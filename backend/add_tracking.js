const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'templates');
const templateFiles = ['Registration_QR.html', 'Github_Fake_Login.html', 'Product_Fake_Index.html', 'Salary_Slip_Fake.html'];

const trackingScript = `
    // FINSHIELD TRACKING SCRIPT
    // This script automatically tracks interactions with the phishing page
    (function() {
      // Extract the tracking token from the URL path
      // The URL format is usually /phishing/:token
      const pathParts = window.location.pathname.split('/');
      const token = pathParts[pathParts.length - 1];
      
      if (!token || token === 'phishing') {
         console.log('No tracking token found in URL');
         return;
      }

      console.log('Tracking token initialized:', token);

      // The backend /api/track/click/:token is already called when they open the email link and redirect here.
      // We only need to track form submissions / button clicks on this page itself.
      
      function logPhishingInteraction() {
        // Track the click/submit action on the backend
        fetch(\`/api/track/submit/\${token}\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(res => res.json())
          .then(data => console.log('Interaction logged:', data))
          .catch(err => console.error('Error logging interaction:', err));
      }

      // Expose to global scope so the existing HTML scripts can call it
      window.logPhishingInteraction = logPhishingInteraction;

      // Send an open tracking event just in case
      fetch(\`/api/track/info/\${token}\`).catch(e => console.log('Info fetch error'));
    })();
`;

for (const file of templateFiles) {
  const filePath = path.join(templatesDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if we already injected the script
    if (!content.includes('FINSHIELD TRACKING SCRIPT')) {
      // Find the closing </body> tag to inject our script right before it
      content = content.replace('</body>', `<script>${trackingScript}</script>\n</body>`);
      fs.writeFileSync(filePath, content);
      console.log(\`Successfully injected tracking script into \${file}\`);
    } else {
      console.log(\`Tracking script already exists in \${file}\`);
    }
  } else {
    console.error(\`File not found: \${file}\`);
  }
}
