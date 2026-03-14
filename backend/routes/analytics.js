const express = require('express');
const InteractionLog = require('../models/InteractionLog');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const EmailDeliveryLog = require('../models/EmailDeliveryLog');
const Template = require('../models/Template');
const { auth, authorize } = require('../middleware/auth');
const { calculateDepartmentRiskScores, generateDashboardInsights } = require('../services/aiService');

const router = express.Router();

// GET /api/analytics/my-stats - Personal stats for employees
router.get('/my-stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const logs = await InteractionLog.find({ user_id: userId })
      .populate('campaign_id', 'name')
      .sort({ timestamp: -1 });

    const totalPhishingAttempts = logs.length;
    const emailsOpened = logs.filter(l => l.email_opened).length;
    const linksClicked = logs.filter(l => l.link_clicked).length;
    const emailsReported = logs.filter(l => l.reported_email).length;
    const formsSubmitted = logs.filter(l => l.form_submitted).length;

    let securityScore = 100;
    if (totalPhishingAttempts > 0) {
      const clickPenalty = (linksClicked / totalPhishingAttempts) * 30;
      const submitPenalty = (formsSubmitted / totalPhishingAttempts) * 40;
      const reportBonus = (emailsReported / totalPhishingAttempts) * 20;
      securityScore = Math.max(0, Math.min(100, Math.round(100 - clickPenalty - submitPenalty + reportBonus)));
    }

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

// GET /api/analytics/filters - Get all filter options
router.get('/filters', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const orgId = req.user.organization_id;

    const departments = await User.distinct('department', { organization_id: orgId, role: 'employee' });
    const campaigns = await Campaign.find({ organization_id: orgId }).select('_id name status createdAt');
    const users = await User.find({ organization_id: orgId, role: 'employee' }).select('_id name email department');

    res.json({
      departments: departments.sort(),
      campaigns: campaigns.map(c => ({ id: c._id, name: c.name, status: c.status })),
      users: users.map(u => ({ id: u._id, name: u.name, email: u.email, department: u.department })),
      timeRanges: [
        { id: 'all', name: 'All Time' },
        { id: '7d', name: 'Last 7 Days' },
        { id: '30d', name: 'Last 30 Days' },
        { id: '90d', name: 'Last 90 Days' },
        { id: '1y', name: 'Last Year' }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/analytics/dashboard-v2 - Advanced dashboard with filters
router.get('/dashboard-v2', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const { departments, campaigns, users, timeRange } = req.query;

    // Parse filter arrays
    const deptFilter = departments ? departments.split(',').filter(d => d && d !== 'all') : [];
    const campFilter = campaigns ? campaigns.split(',').filter(c => c && c !== 'all') : [];
    const userFilter = users ? users.split(',').filter(u => u && u !== 'all') : [];

    // Build date filter
    let dateFilter = {};
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[timeRange] || 0;
      if (days) dateFilter = { createdAt: { $gte: new Date(now - days * 24 * 60 * 60 * 1000) } };
    }

    // Build log filter
    const logFilter = { organization_id: orgId, ...dateFilter };
    if (campFilter.length) logFilter.campaign_id = { $in: campFilter };
    if (userFilter.length) logFilter.user_id = { $in: userFilter };

    // Fetch logs with populated data
    let logs = await InteractionLog.find(logFilter)
      .populate('user_id', 'name email department')
      .populate('campaign_id', 'name status template_id createdAt');

    // Filter by department if specified
    if (deptFilter.length) {
      logs = logs.filter(l => l.user_id && deptFilter.includes(l.user_id.department));
    }

    // ===== 1. Phishing Email Interaction Rate (Bar Chart) =====
    const interactionRate = {
      emails_opened: logs.filter(l => l.email_opened).length,
      links_clicked: logs.filter(l => l.link_clicked).length,
      credentials_entered: logs.filter(l => l.form_submitted).length,
      emails_reported: logs.filter(l => l.reported_email).length
    };

    // ===== 2. Department Risk Level Over Time (Line Chart) =====
    const deptRiskOverTime = {};
    const allDepts = [...new Set(logs.map(l => l.user_id?.department).filter(Boolean))];

    for (const log of logs) {
      const dept = log.user_id?.department;
      if (!dept) continue;
      const month = new Date(log.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!deptRiskOverTime[month]) deptRiskOverTime[month] = {};
      if (!deptRiskOverTime[month][dept]) deptRiskOverTime[month][dept] = { total: 0, clicked: 0, submitted: 0, reported: 0 };
      deptRiskOverTime[month][dept].total++;
      if (log.link_clicked) deptRiskOverTime[month][dept].clicked++;
      if (log.form_submitted) deptRiskOverTime[month][dept].submitted++;
      if (log.reported_email) deptRiskOverTime[month][dept].reported++;
    }

    const departmentRiskTimeline = Object.entries(deptRiskOverTime)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, depts]) => {
        const entry = { month };
        for (const dept of allDepts) {
          const d = depts[dept] || { total: 0, clicked: 0, submitted: 0 };
          entry[dept] = d.total > 0 ? Math.round((d.clicked * 20 + d.submitted * 30) / d.total) : 0;
        }
        return entry;
      });

    // ===== 3. Attack Type Distribution (Pie Chart) =====
    const attackTypes = {};
    for (const log of logs) {
      const campaign = log.campaign_id;
      if (!campaign) continue;
      // Derive attack type from campaign name or default categories
      let type = 'Phishing Email';
      const name = (campaign.name || '').toLowerCase();
      if (name.includes('login') || name.includes('credential')) type = 'Fake Login';
      else if (name.includes('attachment') || name.includes('malware')) type = 'Malware Attachment';
      else if (name.includes('sms') || name.includes('text')) type = 'SMS Phishing';
      else if (name.includes('voice') || name.includes('call')) type = 'Voice Phishing';
      attackTypes[type] = (attackTypes[type] || 0) + 1;
    }
    const attackTypeDistribution = Object.entries(attackTypes).map(([name, value]) => ({ name, value }));

    // ===== 4. Top High-Risk Employees (Table) =====
    const userRisk = {};
    for (const log of logs) {
      const userId = log.user_id?._id?.toString();
      if (!userId) continue;
      if (!userRisk[userId]) {
        userRisk[userId] = {
          id: userId,
          name: log.user_id.name,
          email: log.user_id.email,
          department: log.user_id.department,
          total: 0, clicked: 0, submitted: 0, reported: 0
        };
      }
      userRisk[userId].total++;
      if (log.link_clicked) userRisk[userId].clicked++;
      if (log.form_submitted) userRisk[userId].submitted++;
      if (log.reported_email) userRisk[userId].reported++;
    }

    const highRiskEmployees = Object.values(userRisk)
      .map(u => ({
        ...u,
        risk_score: u.total > 0 ? Math.min(100, Math.round((u.clicked * 20 + u.submitted * 40) / u.total * (100 / 60))) : 0
      }))
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 10);

    // ===== 5. Campaign Performance Funnel =====
    const totalEmailsSent = logs.length;
    const funnelData = [
      { name: 'Emails Sent', value: totalEmailsSent },
      { name: 'Emails Opened', value: interactionRate.emails_opened },
      { name: 'Links Clicked', value: interactionRate.links_clicked },
      { name: 'Credentials Entered', value: interactionRate.credentials_entered },
      { name: 'Emails Reported', value: interactionRate.emails_reported }
    ];

    // ===== 6. Department Breakdown =====
    const deptStats = {};
    for (const log of logs) {
      const dept = log.user_id?.department || 'Unknown';
      if (!deptStats[dept]) deptStats[dept] = { total: 0, opened: 0, clicked: 0, reported: 0, submitted: 0 };
      deptStats[dept].total++;
      if (log.email_opened) deptStats[dept].opened++;
      if (log.link_clicked) deptStats[dept].clicked++;
      if (log.reported_email) deptStats[dept].reported++;
      if (log.form_submitted) deptStats[dept].submitted++;
    }

    const departmentBreakdown = Object.entries(deptStats).map(([dept, stats]) => ({
      department: dept,
      ...stats,
      risk_score: stats.total > 0 ? Math.round((stats.clicked * 20 + stats.submitted * 30 - stats.reported * 10) / stats.total) : 0,
      click_rate: stats.total ? ((stats.clicked / stats.total) * 100).toFixed(1) : 0,
      report_rate: stats.total ? ((stats.reported / stats.total) * 100).toFixed(1) : 0
    })).sort((a, b) => b.risk_score - a.risk_score);

    // ===== 7. Overview Stats =====
    const totalUsers = await User.countDocuments({ role: 'employee', organization_id: orgId });
    const allCampaigns = await Campaign.countDocuments({ organization_id: orgId });
    const activeCampaigns = await Campaign.countDocuments({ organization_id: orgId, status: 'running' });

    res.json({
      overview: {
        total_users: totalUsers,
        total_campaigns: allCampaigns,
        active_campaigns: activeCampaigns,
        total_emails_sent: totalEmailsSent,
        emails_opened: interactionRate.emails_opened,
        links_clicked: interactionRate.links_clicked,
        credentials_entered: interactionRate.credentials_entered,
        emails_reported: interactionRate.emails_reported,
        click_rate: totalEmailsSent ? ((interactionRate.links_clicked / totalEmailsSent) * 100).toFixed(1) : 0,
        report_rate: totalEmailsSent ? ((interactionRate.emails_reported / totalEmailsSent) * 100).toFixed(1) : 0
      },
      interactionRate,
      departmentRiskTimeline,
      departments: allDepts,
      attackTypeDistribution,
      highRiskEmployees,
      funnelData,
      departmentBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Legacy endpoints for backward compatibility
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
      if (!deptStats[dept]) deptStats[dept] = { total: 0, opened: 0, clicked: 0, reported: 0, submitted: 0 };
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
      risk_score: data.scores.length ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
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

router.get('/insights', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const insights = await generateDashboardInsights(orgId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
