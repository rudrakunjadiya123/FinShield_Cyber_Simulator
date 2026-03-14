const express = require('express');
const Report = require('../models/Report');
const { auth, authorize } = require('../middleware/auth');
const { logAudit } = require('../services/auditService');
const { calculateDepartmentRiskScores } = require('../services/aiService');

const router = express.Router();

// GET /api/reports - org-scoped
router.get('/', auth, authorize('admin', 'analyst'), async (req, res) => {
  try {
    const reports = await Report.find({ organization_id: req.user.organization_id })
      .populate('analyst_id', 'name email')
      .populate('campaign_id', 'name status')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/reports
router.post('/', auth, authorize('analyst'), async (req, res) => {
  try {
    const { campaign_id, title, summary, recommendations } = req.body;
    const orgId = req.user.organization_id;

    const deptRisks = await calculateDepartmentRiskScores(campaign_id);
    const avgRisk = deptRisks.length > 0
      ? Math.round(deptRisks.reduce((sum, d) => sum + d.risk_score, 0) / deptRisks.length)
      : 0;

    const report = await Report.create({
      analyst_id: req.user._id,
      campaign_id,
      organization_id: orgId,
      title,
      summary,
      risk_score: avgRisk,
      recommendations: recommendations || [],
      department_risks: deptRisks.map(d => ({
        department: d.department,
        risk_score: d.risk_score,
        vulnerabilities: [
          d.clicks > 0 ? `${d.clicks} users clicked phishing links` : null,
          d.submissions > 0 ? `${d.submissions} users submitted credentials` : null,
          d.reports === 0 ? 'No users reported the email' : null
        ].filter(Boolean)
      }))
    });

    await logAudit(req.user._id, 'create', 'report', report._id, `Created report: ${title}`, orgId);
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reports/:id
router.get('/:id', auth, authorize('admin', 'analyst'), async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, organization_id: req.user.organization_id })
      .populate('analyst_id', 'name email')
      .populate('campaign_id', 'name status');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
