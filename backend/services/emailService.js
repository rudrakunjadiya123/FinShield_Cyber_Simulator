const nodemailer = require('nodemailer');
const EmailDeliveryLog = require('../models/EmailDeliveryLog');
const TrackingToken = require('../models/TrackingToken');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendPhishingEmail = async (campaign, user, template, trackingToken, organizationId) => {
  const deliveryLog = await EmailDeliveryLog.create({
    campaign_id: campaign._id,
    user_id: user._id,
    organization_id: organizationId,
    email_status: 'pending'
  });

  try {
    const transporter = createTransporter();
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const clickTrackLink = `${backendUrl}/api/track/click/${trackingToken}`;
    const openTrackPixel = `${backendUrl}/api/track/open/${trackingToken}`;

    const emailBody = campaign.email_body
      .replace(/{{name}}/g, user.name)
      .replace(/{{department}}/g, user.department)
      .replace(/{{link}}/g, clickTrackLink);

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: campaign.email_subject.replace(/{{name}}/g, user.name),
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          ${emailBody}
          <br/>
          <a href="${clickTrackLink}" style="color: #0066cc;">Click here</a>
        </div>
        <img src="${openTrackPixel}" width="1" height="1" style="display:none;" />
      `
    };

    const info = await transporter.sendMail(mailOptions);
    deliveryLog.email_status = 'sent';
    deliveryLog.smtp_response = info.response || 'Email sent successfully';
    await deliveryLog.save();

    // Update TrackingToken with email_sent_time
    await TrackingToken.findOneAndUpdate(
      { token: trackingToken },
      { email_sent_time: new Date() }
    );

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('SMTP Error in sendPhishingEmail:', error);
    deliveryLog.email_status = 'failed';
    deliveryLog.smtp_response = error.message;
    await deliveryLog.save();

    return { success: false, error: error.message };
  }
};

const sendWelcomeEmail = async (email, name, password) => {
  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const loginLink = `${frontendUrl}/login`;
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to FinShield - Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0891b2; text-align: center;">Welcome to FinShield</h2>
          <p>Hello ${name},</p>
          <p>Your administrator has created an account for you on the FinShield Cybersecurity Platform.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Login Details:</strong></p>
            <p style="margin: 5px 0;">Email: <strong>${email}</strong></p>
            <p style="margin: 5px 0;">Password: <strong>${password}</strong></p>
          </div>
          <p>You can sign in using the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginLink}" style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Sign In to FinShield</a>
          </div>
          <p style="color: #64748b; font-size: 0.9em;">For security reasons, we strongly recommend changing your password upon first login.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendPhishingEmail, sendWelcomeEmail };
