const InteractionLog = require('../models/InteractionLog');
const User = require('../models/User');

// AI Module 1: Risk Score Calculation
const calculateUserRiskScore = (interactions) => {
  let score = 0;
  for (const log of interactions) {
    if (log.link_clicked) score += 20;
    if (log.form_submitted) score += 30;
    if (log.reported_email) score -= 10;
  }
  return Math.max(0, Math.min(100, score));
};

const calculateDepartmentRiskScores = async (campaignId) => {
  const logs = await InteractionLog.find({ campaign_id: campaignId }).populate('user_id', 'department');
  const deptMap = {};

  for (const log of logs) {
    const dept = log.user_id?.department || 'Unknown';
    if (!deptMap[dept]) {
      deptMap[dept] = { total: 0, clicks: 0, submissions: 0, reports: 0, users: 0 };
    }
    deptMap[dept].users++;
    if (log.link_clicked) deptMap[dept].clicks++;
    if (log.form_submitted) deptMap[dept].submissions++;
    if (log.reported_email) deptMap[dept].reports++;
  }

  return Object.entries(deptMap).map(([dept, data]) => ({
    department: dept,
    risk_score: Math.round(
      ((data.clicks * 20 + data.submissions * 30 - data.reports * 10) / Math.max(data.users, 1))
    ),
    total_users: data.users,
    clicks: data.clicks,
    submissions: data.submissions,
    reports: data.reports
  }));
};

// AI Module 2: Automated Dashboard Insights
const generateDashboardInsights = async (organizationId) => {
  const filter = organizationId ? { organization_id: organizationId } : {};
  const logs = await InteractionLog.find(filter).populate('user_id', 'department');

  const deptStats = {};
  let totalLogs = logs.length;
  let totalClicks = 0;
  let totalReports = 0;
  let totalSubmissions = 0;

  for (const log of logs) {
    const dept = log.user_id?.department || 'Unknown';
    if (!deptStats[dept]) {
      deptStats[dept] = { clicks: 0, reports: 0, submissions: 0, total: 0 };
    }
    deptStats[dept].total++;
    if (log.link_clicked) { deptStats[dept].clicks++; totalClicks++; }
    if (log.reported_email) { deptStats[dept].reports++; totalReports++; }
    if (log.form_submitted) { deptStats[dept].submissions++; totalSubmissions++; }
  }

  const insights = [];

  // Find most vulnerable department
  let maxClickRate = 0, mostVulnDept = '';
  for (const [dept, stats] of Object.entries(deptStats)) {
    const rate = stats.clicks / Math.max(stats.total, 1);
    if (rate > maxClickRate) {
      maxClickRate = rate;
      mostVulnDept = dept;
    }
  }
  if (mostVulnDept) {
    insights.push({
      type: 'warning',
      title: 'Most Vulnerable Department',
      message: `${mostVulnDept} department shows the highest phishing click rate at ${(maxClickRate * 100).toFixed(1)}%.`
    });
  }

  // Find lowest reporting dept
  let minReportRate = Infinity, lowestReportDept = '';
  for (const [dept, stats] of Object.entries(deptStats)) {
    const rate = stats.reports / Math.max(stats.total, 1);
    if (rate < minReportRate && stats.total > 0) {
      minReportRate = rate;
      lowestReportDept = dept;
    }
  }
  if (lowestReportDept) {
    insights.push({
      type: 'info',
      title: 'Lowest Reporting Rate',
      message: `${lowestReportDept} department has the lowest email reporting rate at ${(minReportRate * 100).toFixed(1)}%.`
    });
  }

  // Overall stats
  if (totalLogs > 0) {
    insights.push({
      type: 'stat',
      title: 'Campaign Performance Summary',
      message: `Overall click rate: ${((totalClicks / totalLogs) * 100).toFixed(1)}%, Report rate: ${((totalReports / totalLogs) * 100).toFixed(1)}%, Credential submission rate: ${((totalSubmissions / totalLogs) * 100).toFixed(1)}%.`
    });
  }

  // Recommendation
  if (totalSubmissions > totalLogs * 0.3) {
    insights.push({
      type: 'critical',
      title: 'High Credential Submission Rate',
      message: 'More than 30% of users submitted credentials. Immediate security awareness training is recommended.'
    });
  }

  return insights;
};

// AI Module 3: Explainable AI
const explainPhishingIndicators = (template) => {
  const indicators = [];
  const body = (template.email_body || '').toLowerCase();
  const subject = (template.email_subject || '').toLowerCase();

  // Check for urgent language
  const urgentWords = ['urgent', 'immediately', 'action required', 'expire', 'suspended', 'verify now', 'limited time'];
  for (const word of urgentWords) {
    if (body.includes(word) || subject.includes(word)) {
      indicators.push({
        indicator: 'Urgent Language',
        description: `The email uses urgent language ("${word}") to pressure you into acting quickly without thinking.`,
        tip: 'Legitimate organizations rarely pressure you with urgent deadlines via email.'
      });
      break;
    }
  }

  // Check for suspicious links
  if (template.phishing_link && template.phishing_link.length > 0) {
    indicators.push({
      indicator: 'Suspicious Link',
      description: 'The email contains a link that may not match the claimed sender\'s domain.',
      tip: 'Always hover over links to check the actual URL before clicking.'
    });
  }

  // Check for credential requests
  const credWords = ['password', 'login', 'credential', 'verify your account', 'confirm your identity', 'social security'];
  for (const word of credWords) {
    if (body.includes(word)) {
      indicators.push({
        indicator: 'Credential Request',
        description: 'The email asks for sensitive information like passwords or personal details.',
        tip: 'Legitimate companies never ask for passwords via email.'
      });
      break;
    }
  }

  // Check for generic greeting
  if (body.includes('dear user') || body.includes('dear customer') || body.includes('dear employee')) {
    indicators.push({
      indicator: 'Generic Greeting',
      description: 'The email uses a generic greeting instead of your actual name.',
      tip: 'Phishing emails often use generic greetings because they are sent in bulk.'
    });
  }

  // Check for mismatched sender
  if (body.includes('support@') || body.includes('admin@') || body.includes('security@')) {
    indicators.push({
      indicator: 'Suspicious Sender',
      description: 'The email claims to be from a support/admin address which may not be genuine.',
      tip: 'Verify the sender\'s email domain matches the legitimate organization.'
    });
  }

  if (indicators.length === 0) {
    indicators.push({
      indicator: 'General Awareness',
      description: 'Always be cautious with unexpected emails that ask you to click links or provide information.',
      tip: 'When in doubt, contact the sender through official channels to verify the email.'
    });
  }

  return indicators;
};

// AI Module 4: Generate Phishing Email Templates
const generatePhishingTemplate = (theme, department, difficulty) => {
  const templates = {
    'password-reset': {
      easy: {
        template_name: `Password Reset - ${department} (Easy)`,
        email_subject: 'Password Reset Required',
        email_body: `<p>Dear User,</p><p>Your password will expire today. Click the link below immediately to reset your password or your account will be suspended.</p><p><a href="{{link}}">Reset Password Now</a></p><p>Regards,<br/>IT Department</p>`,
      },
      medium: {
        template_name: `Password Reset - ${department} (Medium)`,
        email_subject: 'Action Required: Password Expiry Notice',
        email_body: `<p>Dear {{name}},</p><p>As part of our routine security measures, your ${department} department account password is due for renewal. Please update your password within the next 24 hours to maintain uninterrupted access.</p><p><a href="{{link}}">Update Password</a></p><p>Best regards,<br/>IT Security Team</p>`,
      },
      hard: {
        template_name: `Password Reset - ${department} (Hard)`,
        email_subject: `${department} Account Security Update`,
        email_body: `<p>Hi {{name}},</p><p>We've recently upgraded our security infrastructure. As part of this process, we need all ${department} team members to re-verify their credentials. This is a one-time process and should only take a moment.</p><p><a href="{{link}}">Verify Your Account</a></p><p>Thank you for your cooperation,<br/>Information Security</p>`,
      }
    },
    'invoice-payment': {
      easy: {
        template_name: `Invoice Payment - ${department} (Easy)`,
        email_subject: 'URGENT: Invoice Payment Due',
        email_body: `<p>Dear Customer,</p><p>URGENT! Your invoice is overdue. Pay immediately or face account suspension. Click below to pay now.</p><p><a href="{{link}}">Pay Invoice Now</a></p><p>Billing Department</p>`,
      },
      medium: {
        template_name: `Invoice Payment - ${department} (Medium)`,
        email_subject: 'Invoice #INV-2024-3847 - Payment Reminder',
        email_body: `<p>Dear {{name}},</p><p>This is a reminder that invoice #INV-2024-3847 for your ${department} department is pending. Please review and process the payment at your earliest convenience.</p><p><a href="{{link}}">View Invoice Details</a></p><p>Regards,<br/>Accounts Payable</p>`,
      },
      hard: {
        template_name: `Invoice Payment - ${department} (Hard)`,
        email_subject: `Q4 ${department} Budget Reconciliation`,
        email_body: `<p>Hi {{name}},</p><p>I'm following up on the quarterly budget reconciliation for ${department}. Finance has flagged a discrepancy in the Q4 expense reports. Could you review the attached summary and confirm the figures?</p><p><a href="{{link}}">View Reconciliation Report</a></p><p>Thanks,<br/>Sarah Chen, Finance Operations</p>`,
      }
    },
    'hr-policy': {
      easy: {
        template_name: `HR Policy Update - ${department} (Easy)`,
        email_subject: 'IMPORTANT: New Company Policy - Read Now!',
        email_body: `<p>Dear Employee,</p><p>There has been a major change in company policy. All employees must acknowledge the new policy immediately or face disciplinary action.</p><p><a href="{{link}}">Read & Acknowledge Policy</a></p><p>HR Department</p>`,
      },
      medium: {
        template_name: `HR Policy Update - ${department} (Medium)`,
        email_subject: 'Updated Remote Work Policy - Action Needed',
        email_body: `<p>Dear {{name}},</p><p>We have updated our remote work policy effective this month. All ${department} team members are required to review and sign the updated agreement.</p><p><a href="{{link}}">Review Updated Policy</a></p><p>Best regards,<br/>Human Resources</p>`,
      },
      hard: {
        template_name: `HR Policy Update - ${department} (Hard)`,
        email_subject: `${department} Team - Annual Benefits Enrollment`,
        email_body: `<p>Hi {{name}},</p><p>Annual benefits enrollment is now open for the ${department} team. This year we've added several new health plan options. Please log in to review your current selections and make any changes before the enrollment window closes on the 15th.</p><p><a href="{{link}}">Access Benefits Portal</a></p><p>Best,<br/>Emily Rodriguez, HR Benefits Coordinator</p>`,
      }
    },
    'delivery-notification': {
      easy: {
        template_name: `Delivery Notification - ${department} (Easy)`,
        email_subject: 'Your Package is Waiting!',
        email_body: `<p>Dear Customer,</p><p>You have a package waiting for delivery. Track your package now or it will be returned!</p><p><a href="{{link}}">Track Package</a></p><p>Delivery Services</p>`,
      },
      medium: {
        template_name: `Delivery Notification - ${department} (Medium)`,
        email_subject: 'Delivery Notification - Package #DHL48572',
        email_body: `<p>Dear {{name}},</p><p>A package addressed to the ${department} department is scheduled for delivery. Please confirm the delivery address and time slot.</p><p><a href="{{link}}">Confirm Delivery</a></p><p>Regards,<br/>Shipping & Logistics</p>`,
      },
      hard: {
        template_name: `Delivery Notification - ${department} (Hard)`,
        email_subject: `${department} Office Supply Order - Delivery Update`,
        email_body: `<p>Hi {{name}},</p><p>Quick update on the office supply order for ${department} - the vendor confirmed shipment of the monitors and ergonomic chairs. They need someone to confirm the delivery window and loading dock access. Could you verify the details?</p><p><a href="{{link}}">Confirm Delivery Details</a></p><p>Thanks,<br/>Tom, Facilities Management</p>`,
      }
    }
  };

  const themeTemplates = templates[theme] || templates['password-reset'];
  const selected = themeTemplates[difficulty] || themeTemplates['medium'];

  return {
    ...selected,
    phishing_link: '{{link}}',
    difficulty_level: difficulty,
    ai_generated: true
  };
};

module.exports = {
  calculateUserRiskScore,
  calculateDepartmentRiskScores,
  generateDashboardInsights,
  explainPhishingIndicators,
  generatePhishingTemplate
};
