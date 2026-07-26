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
// Serves the template HTML directly so no React frontend is needed
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

    // Step 3: Update InteractionLog (link_clicked only)
    const log = await InteractionLog.findOne({ tracking_token: token });
    if (log) {
      if (!log.link_clicked) {
        log.link_clicked = true;
        log.link_clicked_at = new Date();
        await log.save();
        // Update gamification points
        await updateUserPoints(log.user_id, 'click_link');
      } else {
        await log.save();
      }
    }

    // If called via AJAX (from frontend), return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ tracked: true });
    }

    // Step 4: Serve the campaign's template HTML directly
    // Look up the campaign and its template via the InteractionLog
    const logWithTemplate = await InteractionLog.findOne({ tracking_token: token }).populate({
      path: 'campaign_id',
      populate: { path: 'template_id' }
    });

    const template = logWithTemplate?.campaign_id?.template_id;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

    if (template && template.html_code) {
      const trackedElements = JSON.stringify(template.tracked_elements || []);
      // Inject tracking script so button clicks are recorded
      const trackingScript = `
        <script>
          (function() {
            var token = "${token}";
            var backendUrl = "${backendUrl}";
            var trackedElements = ${trackedElements};
            
            function logPhishingInteraction() {
              fetch(backendUrl + '/api/track/submit/' + token, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              }).then(function(res) { return res.json(); })
                .then(function(data) { console.log('Interaction logged:', data); })
                .catch(function(err) { console.error('Error logging interaction:', err); });
            }
            window.logPhishingInteraction = logPhishingInteraction;

            function logElementInteraction(elementId) {
              fetch(backendUrl + '/api/track/element/' + token, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ element_id: elementId })
              }).catch(function(err) { console.error('Error logging element:', err); });
            }

            document.addEventListener('DOMContentLoaded', function() {
              // Track specific elements defined by admin
              if (trackedElements && trackedElements.length > 0) {
                trackedElements.forEach(function(id) {
                  var idTrim = id.trim();
                  var targetEl = document.getElementById(idTrim) || document.querySelector('[name="' + idTrim + '"]');
                  if (targetEl) {
                    targetEl.addEventListener('click', function(e) {
                      logElementInteraction(idTrim);
                      // Don't prevent default so normal behavior continues
                    });
                    
                    // If it's an input, maybe listen to 'input' or 'change' as well
                    if (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA') {
                       targetEl.addEventListener('change', function(e) {
                          logElementInteraction(idTrim);
                       });
                    }
                  }
                });
              }

              // Fallback: Auto-attach to forms and important buttons
              var forms = document.querySelectorAll('form');
              forms.forEach(function(form) {
                form.addEventListener('submit', function(e) {
                  e.preventDefault();
                  logPhishingInteraction();
                });
              });
              
              var buttons = document.querySelectorAll('button, input[type="submit"], .btn, [role="button"]');
              buttons.forEach(function(btn) {
                var text = (btn.textContent || btn.value || '').toLowerCase();
                if (text.includes('sign in') || text.includes('login') || text.includes('log in') ||
                    text.includes('download') || text.includes('submit') || text.includes('verify') ||
                    text.includes('continue') || text.includes('confirm') || text.includes('pay') ||
                    text.includes('complete') || text.includes('register')) {
                  btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    logPhishingInteraction();
                  });
                }
              });

              var links = document.querySelectorAll('a');
              links.forEach(function(link) {
                var text = (link.textContent || '').toLowerCase();
                if (text.includes('sign in') || text.includes('login') || text.includes('download') ||
                    text.includes('submit') || text.includes('verify') || text.includes('continue')) {
                  link.addEventListener('click', function(e) {
                    e.preventDefault();
                    logPhishingInteraction();
                  });
                }
              });
            });
          })();
        </script>
      `;

      let htmlContent = template.html_code;

      // Remove old tracking scripts if present
      htmlContent = htmlContent.replace(/<!-- FINSHIELD TRACKING SCRIPT -->[\s\S]*?<\/script>/g, '');

      // Inject the tracking script before </head> or </body>
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', trackingScript + '</head>');
      } else if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', trackingScript + '</body>');
      } else {
        htmlContent = htmlContent + trackingScript;
      }

      // Serve the HTML directly
      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlContent);
    }

    // Fallback: redirect to frontend if no template HTML
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

// POST /api/track/element/:token - track specific element interactions
router.post('/element/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const { element_id } = req.body;
    
    if (!element_id) return res.status(400).json({ message: 'element_id required' });

    const log = await InteractionLog.findOne({ tracking_token: token });
    if (!log) return res.status(404).json({ message: 'Not found' });

    // Add to elements_clicked if not already tracked or just track every click? Track every click or just one?
    // We will just append it. To avoid massive spam, maybe limit array size.
    if (log.elements_clicked.length < 50) {
       log.elements_clicked.push({ element_id, clicked_at: new Date() });
       
       if (!log.link_clicked) {
         log.link_clicked = true;
         log.link_clicked_at = new Date();
       }
       await log.save();
       
       await TrackingToken.findOneAndUpdate(
         { token, clicked: false },
         { clicked: true, click_time: new Date() }
       );
    }
    
    res.json({ tracked: true });
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
      email_subject: log.campaign_id?.email_subject || 'Phishing Simulation',
      html_code: template?.html_code || '',
      template_name: template?.template_name || '',
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
