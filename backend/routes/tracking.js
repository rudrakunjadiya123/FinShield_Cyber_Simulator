const express = require('express');
const InteractionLog = require('../models/InteractionLog');
const TrackingToken = require('../models/TrackingToken');
const Template = require('../models/Template');
const Campaign = require('../models/Campaign');
const { auth, authorize } = require('../middleware/auth');
const { updateUserPoints } = require('../services/gamificationService');
const { explainPhishingIndicators } = require('../services/aiService');

const router = express.Router();

// GET /api/track/open/:token - tracking pixel for email open
router.get('/open/:token', async (req, res) => {
  try {
    const token = req.params.token;

    // Update TrackingToken collection
    await TrackingToken.findOneAndUpdate(
      { token },
      { $setOnInsert: {} },
      { upsert: false }
    );

    // Update InteractionLog
    const log = await InteractionLog.findOne({ tracking_token: token });
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
// This is the main tracking route: GET /track/:token
// Works from ANY device because the token is embedded in the URL
router.get('/click/:token', async (req, res) => {
  try {
    const token = req.params.token;

    // Step 1: Find token in TrackingToken collection
    const trackingDoc = await TrackingToken.findOne({ token });

    if (trackingDoc) {
      // Step 2: Update clicked = true and save click_time
      if (!trackingDoc.clicked) {
        trackingDoc.clicked = true;
        trackingDoc.click_time = new Date();
        await trackingDoc.save();
      }
    }

    // Step 3: Update InteractionLog (link_clicked only — do NOT auto-mark email_opened here)
    const log = await InteractionLog.findOne({ tracking_token: token });
    if (log) {
      if (!log.link_clicked) {
        log.link_clicked = true;
        log.link_clicked_at = new Date();
        await log.save();
        // Step 5: Update gamification points
        await updateUserPoints(log.user_id, 'click_link');
      } else {
        await log.save();
      }
    }

    // Step 6: Redirect user to phishing simulation page
    // If called via AJAX (from frontend), return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ tracked: true });
    }
    // Otherwise redirect to the phishing page with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/phishing/${token}`);
  } catch (error) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ tracked: false });
    }
    res.status(200).send('Page not found');
  }
});

// POST /api/track/report/:token - user reports the email (interaction/report)
router.post('/report/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const log = await InteractionLog.findOne({ tracking_token: token });
    if (!log) return res.status(404).json({ message: 'Not found' });

    // Auto-mark opens and clicks since they interacted
    if (!log.email_opened) {
      log.email_opened = true;
      log.email_opened_at = new Date();
    }
    if (!log.link_clicked) {
      log.link_clicked = true;
      log.link_clicked_at = new Date();
    }

    // Update TrackingToken to mark clicked if not already
    await TrackingToken.findOneAndUpdate(
      { token, clicked: false },
      { clicked: true, click_time: new Date() }
    );

    if (!log.reported_email) {
      log.reported_email = true;
      log.reported_at = new Date();
      log.time_taken = Math.round((new Date() - log.createdAt) / 1000);
      await log.save();
      await updateUserPoints(log.user_id, 'report_email');
    } else {
      await log.save();
    }
    res.json({ message: 'Thank you for reporting this suspicious email! You earned 10 points.', reported: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/track/submit/:token - form submission tracking (interaction/form-submit)
// SECURITY: Never store real passwords submitted by users
router.post('/submit/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const log = await InteractionLog.findOne({ tracking_token: token }).populate({
      path: 'campaign_id',
      populate: { path: 'template_id' }
    });
    if (!log) return res.status(404).json({ message: 'Not found' });

    // SECURITY: Do NOT store any submitted form data (passwords, credentials, etc.)
    // Auto-mark opens and clicks since they interacted
    if (!log.email_opened) {
      log.email_opened = true;
      log.email_opened_at = new Date();
    }
    if (!log.link_clicked) {
      log.link_clicked = true;
      log.link_clicked_at = new Date();
    }

    // Update TrackingToken to mark clicked if not already
    await TrackingToken.findOneAndUpdate(
      { token, clicked: false },
      { clicked: true, click_time: new Date() }
    );

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

    // Show awareness message
    res.json({
      message: 'This was a cybersecurity awareness simulation. No data was collected.',
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
    const token = req.params.token;

    // Get data from both collections
    const log = await InteractionLog.findOne({ tracking_token: token }).populate({
      path: 'campaign_id',
      populate: { path: 'template_id' }
    });
    if (!log) return res.status(404).json({ message: 'Not found' });

    const trackingDoc = await TrackingToken.findOne({ token });

    const template = log.campaign_id?.template_id;
    res.json({
      token: token,
      email_subject: template?.email_subject || 'Phishing Simulation',
      has_form: true,
      already_reported: log.reported_email,
      already_submitted: log.form_submitted,
      clicked: trackingDoc?.clicked || false,
      click_time: trackingDoc?.click_time || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
