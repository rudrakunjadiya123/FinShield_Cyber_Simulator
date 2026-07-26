const Template = require('../models/Template');
const { html1, html2, html3, html4 } = require('./defaultTemplates');

const injectDefaultTemplates = async (orgId, userId) => {

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
