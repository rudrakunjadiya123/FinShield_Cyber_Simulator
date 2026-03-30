require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Template = require('./models/Template');
const Organization = require('./models/Organization');
const Campaign = require('./models/Campaign');
const InteractionLog = require('./models/InteractionLog');
const EmailDeliveryLog = require('./models/EmailDeliveryLog');
const AuditLog = require('./models/AuditLog');
const Report = require('./models/Report');
const Quiz = require('./models/Quiz');
const QuizAttempt = require('./models/QuizAttempt');
const fs = require('fs');
const path = require('path');

const html1 = fs.readFileSync(path.join(__dirname, 'templates', 'Registration_QR.html'), 'utf8');
const html2 = fs.readFileSync(path.join(__dirname, 'templates', 'Github_Fake_Login.html'), 'utf8');
const html3 = fs.readFileSync(path.join(__dirname, 'templates', 'Product_Fake_Index.html'), 'utf8');
const html4 = fs.readFileSync(path.join(__dirname, 'templates', 'Salary_Slip_Fake.html'), 'utf8');

// Predefined HTML/CSS/JS landing page templates
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

const seedDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB for seeding...');

  // Clear all existing data
  await Promise.all([
    User.deleteMany({}),
    Template.deleteMany({}),
    Organization.deleteMany({}),
    Campaign.deleteMany({}),
    InteractionLog.deleteMany({}),
    EmailDeliveryLog.deleteMany({}),
    AuditLog.deleteMany({}),
    Report.deleteMany({}),
    Quiz.deleteMany({}),
    QuizAttempt.deleteMany({})
  ]);
  console.log('Cleared all existing data');

  // Create demo organization
  const demoOrg = await Organization.create({
    name: 'FinShield Demo Corp',
    code: 'DEMO1234',
    industry: 'Technology',
    size: '201-500',
    departments: ['Administration', 'Cybersecurity', 'Security', 'Finance', 'HR', 'Engineering', 'Marketing', 'Sales']
  });
  console.log(`Created organization: ${demoOrg.name} (Code: ${demoOrg.code})`);

  // Create admin user
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@finshield.com',
    password: 'admin123',
    department: 'Administration',
    role: 'admin',
    organization_id: demoOrg._id
  });
  console.log('Created admin: admin@finshield.com / admin123');

  // Update organization created_by
  demoOrg.created_by = admin._id;
  await demoOrg.save();

  // Create cybersecurity team user
  const cyberUser = await User.create({
    name: 'Cyber Team Lead',
    email: 'cyber@finshield.com',
    password: 'cyber123',
    department: 'Cybersecurity',
    role: 'cybersecurity',
    organization_id: demoOrg._id
  });
  console.log('Created cybersecurity user: cyber@finshield.com / cyber123');

  // Create analyst user
  const analyst = await User.create({
    name: 'Security Analyst',
    email: 'analyst@finshield.com',
    password: 'analyst123',
    department: 'Security',
    role: 'analyst',
    organization_id: demoOrg._id
  });
  console.log('Created analyst: analyst@finshield.com / analyst123');

  // Create sample employees
  const departments = ['Finance', 'HR', 'Engineering', 'Marketing', 'Sales'];
  for (const dept of departments) {
    for (let i = 1; i <= 5; i++) {
      await User.create({
        name: `${dept} Employee ${i}`,
        email: `${dept.toLowerCase()}${i}@company.com`,
        password: 'FinShield@2024',
        department: dept,
        role: 'employee',
        points: Math.floor(Math.random() * 60),
        organization_id: demoOrg._id
      });
    }
  }
  console.log('Created 25 sample employees across 5 departments');

  // Create predefined templates (system templates)
  for (const tpl of predefinedTemplates) {
    await Template.create({
      ...tpl,
      created_by: cyberUser._id,
      organization_id: demoOrg._id
    });
  }
  console.log(`Created ${predefinedTemplates.length} predefined system templates`);

  // Create additional sample templates (non-predefined)
  await Template.create({
    template_name: 'Password Reset Urgent',
    email_subject: 'Urgent: Your Password Expires Today',
    email_body: '<p>Dear {{name}},</p><p>Your account password will expire today. You must reset it immediately to avoid losing access to all company systems.</p><p><strong>Click the link below to reset your password now:</strong></p><p><a href="{{link}}">Reset Password Immediately</a></p><p>If you do not reset within 2 hours, your account will be suspended.</p><p>Regards,<br/>IT Support Team</p>',
    phishing_link: '{{link}}',
    difficulty_level: 'easy',
    created_by: cyberUser._id,
    organization_id: demoOrg._id
  });

  await Template.create({
    template_name: 'CEO Wire Transfer Request',
    email_subject: 'Re: Confidential - Wire Transfer Needed',
    email_body: '<p>Hi {{name}},</p><p>I need you to process an urgent wire transfer for a confidential acquisition we are finalizing. This needs to be done today before the markets close.</p><p>Please review the transfer details here:</p><p><a href="{{link}}">View Transfer Instructions</a></p><p>Please keep this confidential and do not discuss with other team members.</p><p>Thanks,<br/>CEO Office</p>',
    phishing_link: '{{link}}',
    difficulty_level: 'hard',
    created_by: cyberUser._id,
    organization_id: demoOrg._id
  });

  console.log('Created 2 additional sample templates');

  console.log('\n========================================');
  console.log('         SEED COMPLETE!');
  console.log('========================================');
  console.log('\nOrganization:');
  console.log(`  Name: ${demoOrg.name}`);
  console.log(`  Code: ${demoOrg.code} (use this to join)`);
  console.log('\nLogin credentials:');
  console.log('  Admin:         admin@finshield.com / admin123');
  console.log('  Cybersecurity: cyber@finshield.com / cyber123');
  console.log('  Analyst:       analyst@finshield.com / analyst123');
  console.log('\nPredefined Templates:');
  predefinedTemplates.forEach(t => console.log(`  - ${t.template_name} (${t.category})`));
  console.log('========================================\n');
  process.exit(0);
};

seedDB().catch(err => {
  console.error(err);
  process.exit(1);
});
