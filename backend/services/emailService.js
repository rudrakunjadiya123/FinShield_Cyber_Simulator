const nodemailer = require('nodemailer');
const EmailDeliveryLog = require('../models/EmailDeliveryLog');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendPhishingEmail = async (campaignId, user, template, trackingToken, organizationId) => {
  const deliveryLog = await EmailDeliveryLog.create({
    campaign_id: campaignId,
    user_id: user._id,
    organization_id: organizationId,
    email_status: 'pending'
  });

  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const trackingLink = `${frontendUrl}/phishing/${trackingToken}`;

    const emailBody = template.email_body
      .replace(/{{name}}/g, user.name)
      .replace(/{{department}}/g, user.department)
      .replace(/{{link}}/g, trackingLink);

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: template.email_subject.replace(/{{name}}/g, user.name),
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          ${emailBody}
          <br/>
          <a href="${trackingLink}" style="color: #0066cc;">Click here</a>
        </div>
        <img src="${process.env.BACKEND_URL || 'http://localhost:5000'}/api/track/open/${trackingToken}" width="1" height="1" style="display:none;" />
      `
    };

    const info = await transporter.sendMail(mailOptions);
    deliveryLog.email_status = 'sent';
    deliveryLog.smtp_response = info.response || 'Email sent successfully';
    await deliveryLog.save();

    return { success: true, messageId: info.messageId };
  } catch (error) {
    deliveryLog.email_status = 'failed';
    deliveryLog.smtp_response = error.message;
    await deliveryLog.save();

    return { success: false, error: error.message };
  }
};

module.exports = { sendPhishingEmail };
