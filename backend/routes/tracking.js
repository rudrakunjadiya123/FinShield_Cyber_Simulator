const express = require('express');
const InteractionLog = require('../models/InteractionLog');
const Template = require('../models/Template');
const Campaign = require('../models/Campaign');
const { auth, authorize } = require('../middleware/auth');
const { updateUserPoints } = require('../services/gamificationService');
const { explainPhishingIndicators } = require('../services/aiService');

const router = express.Router();

// GET /api/track/open/:token - tracking pixel for email open
router.get('/open/:token', async (req, res) => {
  try {
    const log = await InteractionLog.findOne({ tracking_token: req.params.token });
    if (log && !log.email_opened) {
      log.email_opened = true;
      log.email_opened_at = new Date();
      await log.save();
    }
    // Return a 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, { 'Content-Type': 'image/gif', 'Content-Length': pixel.length });
    res.end(pixel);
  } catch (error) {
    res.status(200).end(); // Don't reveal errors to target
  }
});

// GET /api/track/click/:token - when user clicks the phishing link
router.get('/click/:token', async (req, res) => {
  try {
    const log = await InteractionLog.findOne({ tracking_token: req.params.token });
    if (log) {
      if (!log.link_clicked) {
        log.link_clicked = true;
        log.link_clicked_at = new Date();
        await log.save();
        await updateUserPoints(log.user_id, 'click_link');
      }
    }
    // Redirect to the phishing simulation page on frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/phishing/${req.params.token}`);
  } catch (error) {
    res.status(200).send('Page not found');
  }
});

// POST /api/track/report/:token - user reports the email
router.post('/report/:token', async (req, res) => {
  try {
    const log = await InteractionLog.findOne({ tracking_token: req.params.token });
    if (!log) return res.status(404).json({ message: 'Not found' });
    if (!log.reported_email) {
      log.reported_email = true;
      log.reported_at = new Date();
      log.time_taken = Math.round((new Date() - log.createdAt) / 1000);
      await log.save();
      await updateUserPoints(log.user_id, 'report_email');
    }
    res.json({ message: 'Thank you for reporting this suspicious email! You earned 10 points.', reported: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/track/submit/:token - form submission tracking
router.post('/submit/:token', async (req, res) => {
  try {
    const log = await InteractionLog.findOne({ tracking_token: req.params.token }).populate({
      path: 'campaign_id',
      populate: { path: 'template_id' }
    });
    if (!log) return res.status(404).json({ message: 'Not found' });

    // SECURITY: Do NOT store any submitted form data (passwords, credentials, etc.)
    if (!log.form_submitted) {
      log.form_submitted = true;
      log.form_submitted_at = new Date();
      log.time_taken = Math.round((new Date() - log.createdAt) / 1000);
      await log.save();
      await updateUserPoints(log.user_id, 'submit_form');
    }

    // Get XAI explanation
    const template = log.campaign_id?.template_id;
    const explanation = template ? explainPhishingIndicators(template) : [];

    res.json({
      message: 'This was a cybersecurity awareness drill. No data was collected.',
      drill: true,
      explanation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/track/info/:token - get interaction info for the phishing page
router.get('/info/:token', async (req, res) => {
  try {
    const log = await InteractionLog.findOne({ tracking_token: req.params.token }).populate({
      path: 'campaign_id',
      populate: { path: 'template_id' }
    });
    if (!log) return res.status(404).json({ message: 'Not found' });

    const template = log.campaign_id?.template_id;
    res.json({
      token: req.params.token,
      email_subject: template?.email_subject || 'Phishing Simulation',
      has_form: true,
      already_reported: log.reported_email,
      already_submitted: log.form_submitted
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
