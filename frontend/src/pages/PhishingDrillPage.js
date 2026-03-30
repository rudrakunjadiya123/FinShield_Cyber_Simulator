import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const PhishingDrillPage = () => {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        // Record link click when page loads (fallback tracking)
        try { await api.get(`/track/click/${token}`); } catch (e) {}

        const res = await api.get(`/track/info/${token}`);
        setInfo(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchInfo();
  }, [token]);

  useEffect(() => {
    if (!info?.html_code || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    // Inject the tracking token into the template HTML
    // The tracking script inside the template uses window.location.pathname to get the token
    // But since it's inside an iframe, we need to inject the token directly
    let htmlContent = info.html_code;

    // Inject a script that sets up tracking with the correct token
    const trackingOverride = `
      <script>
        // Override tracking for iframe context
        (function() {
          var token = "${token}";
          
          function logPhishingInteraction() {
            var baseUrl = window.parent.location.origin;
            fetch(baseUrl + '/api/track/submit/' + token, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }).then(function(res) { return res.json(); })
              .then(function(data) { console.log('Interaction logged:', data); })
              .catch(function(err) { console.error('Error logging interaction:', err); });
          }
          window.logPhishingInteraction = logPhishingInteraction;

          // Auto-attach to all forms and important buttons
          document.addEventListener('DOMContentLoaded', function() {
            // Attach to form submissions
            var forms = document.querySelectorAll('form');
            forms.forEach(function(form) {
              form.addEventListener('submit', function(e) {
                e.preventDefault();
                logPhishingInteraction();
              });
            });
            
            // Attach to buttons with common action text
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

            // Also attach to links that look like action buttons
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

    // Insert the tracking override before </head> or at the start of <body>
    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', trackingOverride + '</head>');
    } else if (htmlContent.includes('<body')) {
      htmlContent = htmlContent.replace('<body', trackingOverride + '<body');
    } else {
      htmlContent = trackingOverride + htmlContent;
    }

    // Remove the old FINSHIELD TRACKING SCRIPT from the template (since we injected a better one above)
    htmlContent = htmlContent.replace(/<!-- FINSHIELD TRACKING SCRIPT -->[\s\S]*?<\/script>/g, '');

    doc.open();
    doc.write(htmlContent);
    doc.close();
  }, [info, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  // If template has html_code, render it in a full-screen iframe
  if (info?.html_code) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0 }}>
        <iframe
          ref={iframeRef}
          title="Phishing Simulation Page"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            margin: 0,
            padding: 0
          }}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    );
  }

  // Fallback: No template HTML found — show a generic message
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">&#9888;</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Security Awareness Drill</h1>
        <p className="text-slate-600 mb-4">
          This was a cybersecurity awareness simulation conducted by FinShield.
          No data was collected. Stay vigilant and always verify suspicious emails.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-sm text-yellow-800 mb-2">How to protect yourself:</h3>
          <ul className="text-sm text-yellow-700 space-y-1 text-left">
            <li>&#8226; Always verify the sender's email address</li>
            <li>&#8226; Never enter passwords from email links</li>
            <li>&#8226; Report suspicious emails to IT immediately</li>
            <li>&#8226; Look for urgency tactics and unusual requests</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PhishingDrillPage;
