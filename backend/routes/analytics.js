const express = require('express');
const InteractionLog = require('../models/InteractionLog');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const EmailDeliveryLog = require('../models/EmailDeliveryLog');
const { auth, authorize } = require('../middleware/auth');
const { calculateDepartmentRiskScores, generateDashboardInsights } = require('../services/aiService');

const router = express.Router();

// GET /api/analytics/my-stats - Personal stats for employees
router.get('/my-stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all interaction logs for this user
    const logs = await InteractionLog.find({ user_id: userId })
      .populate('campaign_id', 'name')
      .sort({ timestamp: -1 });

    const totalPhishingAttempts = logs.length;
    const emailsOpened = logs.filter(l => l.email_opened).length;
    const linksClicked = logs.filter(l => l.link_clicked).length;
    const emailsReported = logs.filter(l => l.reported_email).length;
    const formsSubmitted = logs.filter(l => l.form_submitted).length;

    // Calculate security score (inverse of risk)
    let securityScore = 100;
    if (totalPhishingAttempts > 0) {
      const clickPenalty = (linksClicked / totalPhishingAttempts) * 30;
      const submitPenalty = (formsSubmitted / totalPhishingAttempts) * 40;
      const reportBonus = (emailsReported / totalPhishingAttempts) * 20;
      securityScore = Math.max(0, Math.min(100, Math.round(100 - clickPenalty - submitPenalty + reportBonus)));
    }

    // Recent activity (last 5 interactions)
    const recentActivity = logs.slice(0, 5).map(log => ({
      campaign: log.campaign_id?.name || 'Unknown Campaign',
      date: log.timestamp,
      emailOpened: log.email_opened,
      linkClicked: log.link_clicked,
      reported: log.reported_email,
      formSubmitted: log.form_submitted
    }));

    res.json({
      user: {
        name: user.name,
        email: user.email,
        department: user.department,
        points: user.points || 0,
        security_level: user.security_level || 'Beginner'
      },
      stats: {
        total_phishing_attempts: totalPhishingAttempts,
        emails_opened: emailsOpened,
        links_clicked: linksClicked,
        emails_reported: emailsReported,
        forms_submitted: formsSubmitted,
        security_score: securityScore
      },
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/analytics/dashboard - org-scoped analytics
router.get('/dashboard', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const campaigns = await Campaign.find({ organization_id: orgId });
    const logs = await InteractionLog.find({ organization_id: orgId }).populate('user_id', 'department');
    const totalUsers = await User.countDocuments({ role: 'employee', organization_id: orgId });

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'running').length;
    const totalLogs = logs.length;
    const opened = logs.filter(l => l.email_opened).length;
    const clicked = logs.filter(l => l.link_clicked).length;
    const reported = logs.filter(l => l.reported_email).length;
    const submitted = logs.filter(l => l.form_submitted).length;

    const deptStats = {};
    for (const log of logs) {
      const dept = log.user_id?.department || 'Unknown';
      if (!deptStats[dept]) {
        deptStats[dept] = { total: 0, opened: 0, clicked: 0, reported: 0, submitted: 0 };
      }
      deptStats[dept].total++;
      if (log.email_opened) deptStats[dept].opened++;
      if (log.link_clicked) deptStats[dept].clicked++;
      if (log.reported_email) deptStats[dept].reported++;
      if (log.form_submitted) deptStats[dept].submitted++;
    }

    const departmentBreakdown = Object.entries(deptStats).map(([dept, stats]) => ({
      department: dept,
      ...stats,
      click_rate: stats.total ? ((stats.clicked / stats.total) * 100).toFixed(1) : 0,
      report_rate: stats.total ? ((stats.reported / stats.total) * 100).toFixed(1) : 0
    }));

    const campaignPerformance = [];
    for (const campaign of campaigns) {
      const cLogs = logs.filter(l => l.campaign_id.toString() === campaign._id.toString());
      campaignPerformance.push({
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        total: cLogs.length,
        clicked: cLogs.filter(l => l.link_clicked).length,
        reported: cLogs.filter(l => l.reported_email).length,
        submitted: cLogs.filter(l => l.form_submitted).length
      });
    }

    res.json({
      overview: {
        total_users: totalUsers,
        total_campaigns: totalCampaigns,
        active_campaigns: activeCampaigns,
        total_emails_sent: totalLogs,
        emails_opened: opened,
        links_clicked: clicked,
        emails_reported: reported,
        forms_submitted: submitted,
        click_rate: totalLogs ? ((clicked / totalLogs) * 100).toFixed(1) : 0,
        report_rate: totalLogs ? ((reported / totalLogs) * 100).toFixed(1) : 0,
        submission_rate: totalLogs ? ((submitted / totalLogs) * 100).toFixed(1) : 0
      },
      departmentBreakdown,
      campaignPerformance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/analytics/risk-score
router.get('/risk-score', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const { campaignId } = req.query;
    if (campaignId) {
      const deptRisks = await calculateDepartmentRiskScores(campaignId);
      return res.json(deptRisks);
    }
    const campaigns = await Campaign.find({ organization_id: orgId });
    const allRisks = [];
    for (const campaign of campaigns) {
      const risks = await calculateDepartmentRiskScores(campaign._id);
      allRisks.push(...risks);
    }
    const deptMap = {};
    for (const risk of allRisks) {
      if (!deptMap[risk.department]) {
        deptMap[risk.department] = { scores: [], users: 0, clicks: 0, submissions: 0, reports: 0 };
      }
      deptMap[risk.department].scores.push(risk.risk_score);
      deptMap[risk.department].users += risk.total_users;
      deptMap[risk.department].clicks += risk.clicks;
      deptMap[risk.department].submissions += risk.submissions;
      deptMap[risk.department].reports += risk.reports;
    }
    const result = Object.entries(deptMap).map(([dept, data]) => ({
      department: dept,
      risk_score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      total_users: data.users,
      clicks: data.clicks,
      submissions: data.submissions,
      reports: data.reports
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/analytics/insights - org-scoped AI insights
router.get('/insights', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const insights = await generateDashboardInsights(orgId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/analytics/email-delivery
router.get('/email-delivery', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const { campaignId } = req.query;
    const filter = { organization_id: orgId };
    if (campaignId) filter.campaign_id = campaignId;
    const logs = await EmailDeliveryLog.find(filter)
      .populate('user_id', 'name email department')
      .sort({ timestamp: -1 });

    const sent = logs.filter(l => l.email_status === 'sent').length;
    const failed = logs.filter(l => l.email_status === 'failed').length;
    const pending = logs.filter(l => l.email_status === 'pending').length;

    res.json({ total: logs.length, sent, failed, pending, logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
