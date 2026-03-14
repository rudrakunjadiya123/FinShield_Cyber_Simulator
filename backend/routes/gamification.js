const express = require('express');
const mongoose = require('mongoose');
const { auth, authorize } = require('../middleware/auth');
const { getLeaderboard, getDepartmentRanking } = require('../services/gamificationService');
const InteractionLog = require('../models/InteractionLog');
const User = require('../models/User');

const router = express.Router();

// GET /api/gamification/leaderboard
router.get('/leaderboard', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const orgId = req.user.organization_id;
    const { department } = req.query;

    const filter = { role: 'employee', organization_id: orgId };
    if (department && department !== 'all') {
      filter.department = department;
    }

    const users = await User.find(filter)
      .select('name email department points security_level')
      .limit(limit);

    // Compute security_score from InteractionLog for each user (same formula as analytics)
    const logMatch = { organization_id: new mongoose.Types.ObjectId(orgId) };
    if (department && department !== 'all') {
      // Can't filter by department here directly, will handle below
    }

    const userStats = await InteractionLog.aggregate([
      { $match: logMatch },
      {
        $group: {
          _id: '$user_id',
          total: { $sum: 1 },
          clicked: { $sum: { $cond: ['$link_clicked', 1, 0] } },
          reported: { $sum: { $cond: ['$reported_email', 1, 0] } },
          submitted: { $sum: { $cond: ['$form_submitted', 1, 0] } }
        }
      }
    ]);

    const statsMap = {};
    for (const s of userStats) {
      const total = s.total || 0;
      let score = 100;
      if (total > 0) {
        const clickPenalty = (s.clicked / total) * 30;
        const submitPenalty = (s.submitted / total) * 40;
        const reportBonus = (s.reported / total) * 20;
        score = Math.max(0, Math.min(100, Math.round(100 - clickPenalty - submitPenalty + reportBonus)));
      }
      statsMap[s._id.toString()] = score;
    }

    const leaderboard = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      department: u.department,
      points: u.points || 0,
      security_level: u.security_level,
      security_score: statsMap[u._id.toString()] ?? 100
    })).sort((a, b) => b.security_score - a.security_score);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/gamification/department-ranking
router.get('/department-ranking', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const ranking = await getDepartmentRanking(req.user.organization_id);
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/gamification/employee/:id - Detailed employee stats with XAI
router.get('/employee/:id', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const user = await User.findOne({ _id: req.params.id, organization_id: orgId })
      .select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get all interaction logs for this employee
    const logs = await InteractionLog.find({ user_id: user._id })
      .populate('campaign_id', 'name status')
      .sort({ createdAt: -1 });

    const totalAttempts = logs.length;
    const emailsOpened = logs.filter(l => l.email_opened).length;
    const linksClicked = logs.filter(l => l.link_clicked).length;
    const emailsReported = logs.filter(l => l.reported_email).length;
    const formsSubmitted = logs.filter(l => l.form_submitted).length;
    const ignored = totalAttempts - linksClicked;

    // Calculate security score (0-100, higher is better)
    let securityScore = 100;
    if (totalAttempts > 0) {
      const clickPenalty = (linksClicked / totalAttempts) * 30;
      const submitPenalty = (formsSubmitted / totalAttempts) * 40;
      const reportBonus = (emailsReported / totalAttempts) * 20;
      securityScore = Math.max(0, Math.min(100, Math.round(100 - clickPenalty - submitPenalty + reportBonus)));
    }

    // Score breakdown for transparency
    const scoreBreakdown = {
      base_score: 100,
      report_bonus: totalAttempts > 0 ? `+${Math.round((emailsReported / totalAttempts) * 20)}` : '+0',
      click_penalty: totalAttempts > 0 ? `-${Math.round((linksClicked / totalAttempts) * 30)}` : '-0',
      submit_penalty: totalAttempts > 0 ? `-${Math.round((formsSubmitted / totalAttempts) * 40)}` : '-0',
      final_score: securityScore
    };

    // XAI: Generate improvement suggestions and identify weaknesses
    const xaiInsights = [];
    const strengths = [];
    const weaknesses = [];

    if (totalAttempts === 0) {
      xaiInsights.push({
        type: 'info',
        title: 'No Campaign Data',
        message: 'This employee has not been included in any phishing simulation campaigns yet.'
      });
    } else {
      // Analyze click behavior
      const clickRate = (linksClicked / totalAttempts) * 100;
      if (clickRate > 50) {
        weaknesses.push({
          area: 'Link Clicking',
          severity: 'high',
          detail: `Clicked ${linksClicked} out of ${totalAttempts} phishing links (${clickRate.toFixed(0)}%).`,
          recommendation: 'Always hover over links before clicking. Check if the URL matches the claimed sender. When in doubt, go directly to the website by typing the URL.'
        });
      } else if (clickRate > 20) {
        weaknesses.push({
          area: 'Link Clicking',
          severity: 'medium',
          detail: `Clicked ${linksClicked} out of ${totalAttempts} phishing links (${clickRate.toFixed(0)}%).`,
          recommendation: 'Be more cautious with email links. Look for urgency cues and suspicious URLs before clicking.'
        });
      } else if (clickRate === 0) {
        strengths.push({
          area: 'Link Awareness',
          detail: 'Has not clicked any phishing links. Shows strong awareness of suspicious URLs.'
        });
      }

      // Analyze form submission
      const submitRate = (formsSubmitted / totalAttempts) * 100;
      if (formsSubmitted > 0) {
        weaknesses.push({
          area: 'Credential Submission',
          severity: 'critical',
          detail: `Submitted credentials ${formsSubmitted} time(s) (${submitRate.toFixed(0)}% of attempts).`,
          recommendation: 'Never enter passwords or personal data from an email link. Always verify the website URL. Legitimate services never ask for passwords via email.'
        });
      } else {
        strengths.push({
          area: 'Credential Protection',
          detail: 'Has never submitted credentials to a phishing page. Good security practice.'
        });
      }

      // Analyze reporting behavior
      const reportRate = (emailsReported / totalAttempts) * 100;
      if (reportRate > 50) {
        strengths.push({
          area: 'Reporting',
          detail: `Reported ${emailsReported} out of ${totalAttempts} phishing emails (${reportRate.toFixed(0)}%). Excellent vigilance.`
        });
      } else if (reportRate > 0) {
        weaknesses.push({
          area: 'Reporting',
          severity: 'low',
          detail: `Only reported ${emailsReported} out of ${totalAttempts} phishing emails (${reportRate.toFixed(0)}%).`,
          recommendation: 'Report all suspicious emails to the security team. Reporting helps protect the entire organization.'
        });
      } else {
        weaknesses.push({
          area: 'Reporting',
          severity: 'medium',
          detail: 'Has never reported a phishing email.',
          recommendation: 'Use the "Report" button when you identify a suspicious email. This helps the security team and earns you +10 points.'
        });
      }

      // Analyze response time
      const avgResponseTime = logs.reduce((sum, l) => sum + (l.time_taken || 0), 0) / totalAttempts;
      if (avgResponseTime > 0 && avgResponseTime < 30) {
        weaknesses.push({
          area: 'Response Speed',
          severity: 'medium',
          detail: `Average response time is ${Math.round(avgResponseTime)} seconds - reacting too quickly.`,
          recommendation: 'Take time to analyze emails before acting. Quick reactions often lead to clicking malicious links.'
        });
      }

      // Overall assessment
      if (securityScore >= 80) {
        xaiInsights.push({
          type: 'success',
          title: 'Strong Security Awareness',
          message: `Security score is ${securityScore}/100. This employee demonstrates good awareness of phishing threats.`
        });
      } else if (securityScore >= 50) {
        xaiInsights.push({
          type: 'warning',
          title: 'Moderate Risk',
          message: `Security score is ${securityScore}/100. There is room for improvement in identifying phishing attempts.`
        });
      } else {
        xaiInsights.push({
          type: 'critical',
          title: 'High Risk Employee',
          message: `Security score is ${securityScore}/100. This employee needs immediate security awareness training.`
        });
      }
    }

    // Campaign-wise breakdown
    const campaignHistory = logs.map(log => ({
      campaign: log.campaign_id?.name || 'Unknown',
      campaign_status: log.campaign_id?.status || 'unknown',
      date: log.createdAt,
      email_opened: log.email_opened,
      link_clicked: log.link_clicked,
      reported: log.reported_email,
      form_submitted: log.form_submitted,
      time_taken: log.time_taken || 0
    }));

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        points: user.points,
        security_level: user.security_level
      },
      stats: {
        total_attempts: totalAttempts,
        emails_opened: emailsOpened,
        links_clicked: linksClicked,
        emails_reported: emailsReported,
        forms_submitted: formsSubmitted,
        ignored: ignored,
        security_score: securityScore
      },
      scoreBreakdown,
      xaiInsights,
      strengths,
      weaknesses,
      campaignHistory
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/gamification/departments - List all departments
router.get('/departments', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const departments = await User.distinct('department', {
      role: 'employee',
      organization_id: req.user.organization_id
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
