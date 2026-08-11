const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

exports.sendMentionNotification = async (toEmail, commentData) => {
  try {
    const { ticketId, authorName, content } = commentData;
    const transporter = createTransporter();

    const context = `Ticket #${ticketId}`

    const mailOptions = {
      from: `"SprintBoard Notifications" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${authorName} mentioned you in ${context}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="background: #4c6df0; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin:0;">SprintBoard</h2>
          </div>
          <div style="background: #f8f7f7; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hi there,</p>
            <p><strong>${authorName}</strong> mentioned you in a comment:</p>
            <div style="background: #fcfcfc; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 8px 0;"><em>"${content}</em></p>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">This is an automated notification from your workspace.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Mention notification sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Failed to send mention email:', error);
    return { success: false, error: error.message };
  }
};