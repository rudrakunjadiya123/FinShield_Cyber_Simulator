const fs = require('fs');
const path = require('path');
const Template = require('../models/Template');

const injectDefaultTemplates = async (orgId, userId) => {
  const templatesDir = path.join(__dirname, '..', 'templates');
  
  // Safely read template HTML files
  let html1 = '', html2 = '', html3 = '', html4 = '';
  try { html1 = fs.readFileSync(path.join(templatesDir, 'Registration_QR.html'), 'utf8'); } catch(e) { console.error('Warning: Registration_QR.html not found'); }
  try { html2 = fs.readFileSync(path.join(templatesDir, 'Github_Fake_Login.html'), 'utf8'); } catch(e) { console.error('Warning: Github_Fake_Login.html not found'); }
  try { html3 = fs.readFileSync(path.join(templatesDir, 'Product_Fake_Index.html'), 'utf8'); } catch(e) { console.error('Warning: Product_Fake_Index.html not found'); }
  try { html4 = fs.readFileSync(path.join(templatesDir, 'Salary_Slip_Fake.html'), 'utf8'); } catch(e) { console.error('Warning: Salary_Slip_Fake.html not found'); }

  const predefinedTemplates = [
    {
      template_name: 'Registration QR Code',
      phishing_link: '{{link}}',
      category: 'QR-Phishing',
      difficulty_level: 'medium',
      is_predefined: true,
      html_code: html1
    },
    {
      template_name: 'GitHub Fake Login',
      phishing_link: '{{link}}',
      category: 'Credential-Harvesting',
      difficulty_level: 'hard',
      is_predefined: true,
      html_code: html2
    },
    {
      template_name: 'Nexus AI Login',
      phishing_link: '{{link}}',
      category: 'Credential-Harvesting',
      difficulty_level: 'medium',
      is_predefined: true,
      html_code: html3
    },
    {
      template_name: 'Salary Slip Download',
      phishing_link: '{{link}}',
      category: 'Malware-Simulation',
      difficulty_level: 'easy',
      is_predefined: true,
      html_code: html4
    }
  ];

  for (const tpl of predefinedTemplates) {
    try {
      await Template.create({
        ...tpl,
        created_by: userId,
        organization_id: orgId
      });
    } catch (err) {
      console.error('Error injecting template', tpl.template_name, err.message);
    }
  }
};

module.exports = { injectDefaultTemplates };
