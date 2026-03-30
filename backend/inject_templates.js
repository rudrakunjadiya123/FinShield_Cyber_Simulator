require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');

const fs = require('fs');

const html1 = fs.readFileSync('templates/Registration_QR.html', 'utf8');
const html2 = fs.readFileSync('templates/Github_Fake_Login.html', 'utf8');
const html3 = fs.readFileSync('templates/Product_Fake_Index.html', 'utf8');
const html4 = fs.readFileSync('templates/Salary_Slip_Fake.html', 'utf8');

const predefinedTemplates = [
  {
    template_name: 'Registration QR Code',
    email_subject: 'Complete your Registration',
    email_body: '<p>Dear Employee,</p><p>Please complete the payment step to finalize your account setup. Scan the QR code in the attached page to proceed.</p><p><a href="{{link}}">Complete Registration Now</a></p><p>Regards,<br/>HR Department</p>',
    phishing_link: '{{link}}',
    category: 'QR-Phishing',
    difficulty_level: 'medium',
    is_predefined: true,
    html_code: html1
  },
  {
    template_name: 'GitHub Fake Login',
    email_subject: 'Sign in to GitHub',
    email_body: '<p>Dear Developer,</p><p>We detected a new login to your GitHub account. Please sign in to verify this activity.</p><p><a href="{{link}}">Verify Login Here</a></p><p>Regards,<br/>GitHub Security</p>',
    phishing_link: '{{link}}',
    category: 'Credential-Harvesting',
    difficulty_level: 'hard',
    is_predefined: true,
    html_code: html2
  },
  {
    template_name: 'Nexus AI Login',
    email_subject: 'Nexus AI: Unlock the future',
    email_body: '<p>Hi there,</p><p>Experience the state-of-the-art AI infrastructure designed to scale with your most ambitious ideas. Log in to your Nexus AI account to get started.</p><p><a href="{{link}}">Access Nexus AI</a></p><p>Best,<br/>Nexus Team</p>',
    phishing_link: '{{link}}',
    category: 'Credential-Harvesting',
    difficulty_level: 'medium',
    is_predefined: true,
    html_code: html3
  },
  {
    template_name: 'Salary Slip Download',
    email_subject: 'Your Salary Slip is Ready',
    email_body: '<p>Dear Employee,</p><p>Your salary slip for this month is ready for download. Please access the secure portal to view it.</p><p><a href="{{link}}">Download Salary Slip</a></p><p>Regards,<br/>Payroll Department</p>',
    phishing_link: '{{link}}',
    category: 'Malware-Simulation',
    difficulty_level: 'easy',
    is_predefined: true,
    html_code: html4
  }
];

const injectTemplates = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Find demo organization (assumes seed.js has been run)
  const Organization = require('./models/Organization');
  const org = await Organization.findOne({ code: 'DEMO1234' });
  const User = require('./models/User');
  const cyberAdmin = await User.findOne({ role: 'cybersecurity', organization_id: org._id });

  // Clear existing predefined templates
  await Template.deleteMany({ is_predefined: true });
  console.log('Deleted old predefined templates');

  // Insert new templates
  for (const tpl of predefinedTemplates) {
    await Template.create({
      ...tpl,
      created_by: cyberAdmin._id,
      organization_id: org._id
    });
  }
  
  console.log(`Successfully injected ${predefinedTemplates.length} new templates`);
  process.exit(0);
};

injectTemplates().catch(console.error);
