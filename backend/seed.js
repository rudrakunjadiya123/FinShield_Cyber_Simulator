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
    Report.deleteMany({})
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

  // Create sample templates
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

  await Template.create({
    template_name: 'IT Security Verification',
    email_subject: 'Annual Security Compliance Verification Required',
    email_body: '<p>Dear {{name}},</p><p>As part of our annual security compliance audit, all {{department}} department employees must verify their identity and update their security preferences.</p><p>This is mandatory and must be completed by end of business today.</p><p><a href="{{link}}">Complete Verification</a></p><p>Best regards,<br/>Information Security Team</p>',
    phishing_link: '{{link}}',
    difficulty_level: 'medium',
    created_by: cyberUser._id,
    organization_id: demoOrg._id
  });

  console.log('Created 3 sample templates');

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
  console.log('\nTo create a new organization:');
  console.log('  Go to /register and select "Create New Organization"');
  console.log('\nTo join this demo organization:');
  console.log(`  Use code: ${demoOrg.code}`);
  console.log('========================================\n');
  process.exit(0);
};

seedDB().catch(err => {
  console.error(err);
  process.exit(1);
});
