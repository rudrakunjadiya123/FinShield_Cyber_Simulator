require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('SMTP Config:');
  console.log('  Host:', process.env.SMTP_HOST);
  console.log('  Port:', process.env.SMTP_PORT);
  console.log('  User:', process.env.SMTP_USER);
  console.log('  Pass:', process.env.SMTP_PASS ? '****' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    const result = await transporter.verify();
    console.log('\n✅ SMTP connection verified! Server is ready to send emails.');
  } catch (error) {
    console.log('\n❌ SMTP connection FAILED:', error.message);
    if (error.message.includes('Invalid login') || error.message.includes('auth')) {
      console.log('\n📋 Fix: The Gmail App Password may be expired or invalid.');
      console.log('   1. Go to https://myaccount.google.com/apppasswords');
      console.log('   2. Generate a new App Password for "Mail"');
      console.log('   3. Update SMTP_PASS in backend/.env');
    }
  }
}

testEmail();
