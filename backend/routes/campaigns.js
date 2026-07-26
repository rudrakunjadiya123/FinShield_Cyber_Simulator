const express = require('express');
const Campaign = require('../models/Campaign');
const InteractionLog = require('../models/InteractionLog');
const TrackingToken = require('../models/TrackingToken');
const User = require('../models/User');
const Template = require('../models/Template');
const { auth, authorize } = require('../middleware/auth');
const { logAudit } = require('../services/auditService');
const { sendPhishingEmail } = require('../services/emailService');
const { generateEmailContent } = require('../services/geminiService');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// GET /api/campaigns - list campaigns for user's organization
router.get('/', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const campaigns = await Campaign.find({ organization_id: orgId })
      .populate('template_id', 'template_name email_subject')
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/campaigns/:id
router.get('/:id', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, organization_id: req.user.organization_id })
      .populate('template_id')
      .populate('created_by', 'name email');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/campaigns/generate-description - Generate email content via Gemini AI
router.post('/generate-description', auth, authorize('admin', 'cybersecurity'), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    const content = await generateEmailContent(prompt);
    res.json(content);
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate content' });
  }
});

// POST /api/campaigns - create campaign
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email_subject, email_body, template_id, target_departments, target_emails, launch_date, status } = req.body;
    const orgId = req.user.organization_id;
    const campaign = await Campaign.create({
      name,
      email_subject,
      email_body,
      template_id,
      target_departments: target_departments || [],
      target_emails: target_emails || [],
      launch_date,
      status: status || (launch_date ? 'scheduled' : 'draft'),
      created_by: req.user._id,
      organization_id: orgId
    });
    await logAudit(req.user._id, 'create', 'campaign', campaign._id, `Created campaign: ${name}`, orgId);
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/campaigns/:id
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const campaignToUpdate = await Campaign.findOne({ _id: req.params.id, organization_id: req.user.organization_id });
    if (!campaignToUpdate) return res.status(404).json({ message: 'Campaign not found' });
    if (new Date() >= new Date(campaignToUpdate.launch_date)) {
      return res.status(403).json({ message: 'Cannot edit campaign after its scheduled launch date' });
    }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, organization_id: req.user.organization_id },
      req.body, { new: true }
    );
    await logAudit(req.user._id, 'update', 'campaign', campaign._id, `Updated campaign: ${campaign.name}`, req.user.organization_id);
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/campaigns/:id
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, organization_id: req.user.organization_id });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    
    if (new Date() >= new Date(campaign.launch_date)) {
      return res.status(403).json({ message: 'Cannot delete campaign after its scheduled launch date' });
    }
    if (campaign.status === 'running' || campaign.status === 'completed') {
      return res.status(400).json({ message: `Cannot delete a campaign that is ${campaign.status}` });
    }

    await InteractionLog.deleteMany({ campaign_id: campaign._id });
    await TrackingToken.deleteMany({ campaign_id: campaign._id });
    await Campaign.deleteOne({ _id: campaign._id });

    await logAudit(req.user._id, 'delete', 'campaign', campaign._id, `Deleted campaign: ${campaign.name}`, req.user.organization_id);
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/campaigns/:id/launch - launch a campaign
router.post('/:id/launch', auth, authorize('admin'), async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const campaign = await Campaign.findOne({ _id: req.params.id, organization_id: orgId }).populate('template_id');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.status === 'running') {
      return res.status(400).json({ message: 'Campaign is already running' });
    }
    if (campaign.status === 'completed') {
      return res.status(400).json({ message: 'Campaign is already completed' });
    }

    // Get target users within same organization
    const targetUsers = await User.find({
      department: { $in: campaign.target_departments },
      role: 'employee',
      organization_id: orgId
    });

    if (targetUsers.length === 0) {
      return res.status(400).json({ message: 'No target users found in selected departments' });
    }

    campaign.status = 'running';
    await campaign.save();

    const results = [];
    for (const user of targetUsers) {
      const trackingToken = uuidv4();

      // Create TrackingToken document for this user+campaign
      await TrackingToken.create({
        token: trackingToken,
        user_id: user._id,
        campaign_id: campaign._id,
        organization_id: orgId
      });

      // Create InteractionLog to track all interactions
      await InteractionLog.create({
        user_id: user._id,
        campaign_id: campaign._id,
        organization_id: orgId,
        tracking_token: trackingToken
      });

      const emailResult = await sendPhishingEmail(
        campaign,
        user,
        campaign.template_id,
        trackingToken,
        orgId
      );
      results.push({ user: user.email, ...emailResult });
    }

    await logAudit(req.user._id, 'launch', 'campaign', campaign._id,
      `Launched campaign: ${campaign.name} to ${targetUsers.length} users`, orgId);

    res.json({
      message: 'Campaign launched successfully',
      total_targets: targetUsers.length,
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/campaigns/:id/reset - reset a campaign to draft (clears old tracking data)
router.post('/:id/reset', auth, authorize('admin'), async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const campaign = await Campaign.findOne({ _id: req.params.id, organization_id: orgId });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Delete old tracking data so it can be re-launched fresh
    await InteractionLog.deleteMany({ campaign_id: campaign._id });
    await TrackingToken.deleteMany({ campaign_id: campaign._id });

    campaign.status = 'draft';
    await campaign.save();

    await logAudit(req.user._id, 'reset', 'campaign', campaign._id, `Reset campaign: ${campaign.name}`, orgId);
    res.json({ message: 'Campaign reset to draft. You can now re-launch it.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/campaigns/:id/complete
router.post('/:id/complete', auth, authorize('admin'), async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, organization_id: req.user.organization_id });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    campaign.status = 'completed';
    await campaign.save();

    // Award +5 ignore points to users who received email but never clicked, submitted, or reported
    const logs = await InteractionLog.find({ campaign_id: campaign._id });
    let ignoredCount = 0;
    for (const log of logs) {
      if (!log.link_clicked && !log.form_submitted && !log.reported_email) {
        await require('../services/gamificationService').updateUserPoints(log.user_id, 'ignore_phishing');
        ignoredCount++;
      }
    }

    await logAudit(req.user._id, 'complete', 'campaign', campaign._id, `Completed campaign: ${campaign.name}`, req.user.organization_id);
    res.json({ message: 'Campaign marked as completed', campaign, ignored_rewarded: ignoredCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/campaigns/:id/stats
router.get('/:id/stats', auth, authorize('admin', 'cybersecurity', 'analyst'), async (req, res) => {
  try {
    const logs = await InteractionLog.find({
      campaign_id: req.params.id,
      organization_id: req.user.organization_id
    }).populate('user_id', 'name email department');
    const total = logs.length;

    const clicked = logs.filter(l => l.link_clicked).length;
    const reported = logs.filter(l => l.reported_email).length;
    const submitted = logs.filter(l => l.form_submitted).length;

    const element_stats = {};
    logs.forEach(log => {
      if (log.elements_clicked && log.elements_clicked.length > 0) {
        log.elements_clicked.forEach(el => {
          if (!element_stats[el.element_id]) element_stats[el.element_id] = 0;
          element_stats[el.element_id]++;
        });
      }
    });

    res.json({
      total_targets: total,

      link_clicked: clicked,
      reported_email: reported,
      form_submitted: submitted,
      open_rate: total ? ((opened / total) * 100).toFixed(1) : 0,
      click_rate: total ? ((clicked / total) * 100).toFixed(1) : 0,
      report_rate: total ? ((reported / total) * 100).toFixed(1) : 0,
      submission_rate: total ? ((submitted / total) * 100).toFixed(1) : 0,
      element_stats,
      logs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
