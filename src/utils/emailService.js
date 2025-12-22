// Email service using Nodemailer
import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, message, html = null) => {
  try {
    // Check if email configuration is available
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    // If email config is not set up, log and return error
    if (!emailHost || !emailPort || !emailUser || !emailPass) {
      const errorMsg = 'Email configuration not found. Please configure EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS in your .env file';
      console.error('❌ Email Service Error:', errorMsg);
      console.log('Email would be sent to:', to);
      console.log('Subject:', subject);
      console.log('Message:', message);
      return { success: false, error: errorMsg };
    }

    // Create transporter with Gmail-specific settings
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort),
      secure: emailPort === '465', // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      // Gmail-specific settings
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
      // Connection timeout
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
    });

    // Verify transporter configuration
    console.log('🔍 Verifying email transporter configuration...');
    console.log(`📧 Using SMTP: ${emailHost}:${emailPort}`);
    console.log(`📧 From: ${emailUser}`);
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', verifyError.message);
      if (verifyError.message.includes('Invalid login') || verifyError.code === 'EAUTH') {
        throw new Error('Gmail authentication failed. Please use an App Password instead of your regular password. Get it from: https://myaccount.google.com/apppasswords');
      }
      throw verifyError;
    }

    // Send email
    const mailOptions = {
      from: `"Artzyra Platform" <${emailUser}>`,
      to,
      subject,
      text: message,
      html: html || message.replace(/\n/g, '<br>'),
    };

    console.log(`📧 Sending email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully! Message ID:', info.messageId);
    console.log('✅ Email response:', info.response);
    
    return { success: true, message: 'Email sent successfully', messageId: info.messageId, response: info.response };
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    console.error('❌ Full error:', error);
    
    // Provide helpful error messages for common issues
    let helpfulError = error.message;
    if (error.code === 'EAUTH' || error.message.includes('Invalid login')) {
      helpfulError = 'Gmail authentication failed. Please use a Gmail App Password instead of your regular password. Get it from: https://myaccount.google.com/apppasswords';
    } else if (error.code === 'ECONNECTION' || error.message.includes('connect')) {
      helpfulError = 'Could not connect to email server. Check EMAIL_HOST and EMAIL_PORT in .env file.';
    } else if (error.message.includes('timeout')) {
      helpfulError = 'Email server connection timeout. Check your internet connection and email server settings.';
    }
    
    return { success: false, error: helpfulError, fullError: error.toString() };
  }
};

const sendApprovalEmail = async (userEmail, userName, isApproved) => {
  const subject = isApproved 
    ? 'Account Approved - Talent Booking Platform'
    : 'Account Approval Pending - Talent Booking Platform';
  
  const message = isApproved
    ? `You are approved.`
    : `Hello ${userName},\n\nYour account is pending approval. We will notify you once it's been reviewed.\n\nBest regards,\nTalent Booking Platform`;

  return await sendEmail(userEmail, subject, message);
};

const sendBookingNotificationEmail = async (userEmail, userName, bookingDetails) => {
  const subject = 'New Booking Notification';
  const message = `Hello ${userName},\n\nYou have a new booking request.\n\nBooking Details:\nDate: ${bookingDetails.date}\nTime: ${bookingDetails.time}\n\nPlease check your dashboard for more details.\n\nBest regards,\nTalent Booking Platform`;

  return await sendEmail(userEmail, subject, message);
};

export {
  sendEmail,
  sendApprovalEmail,
  sendBookingNotificationEmail,
};

