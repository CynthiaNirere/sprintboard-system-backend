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

exports.sendOrderConfirmationEmail = async (toEmail, orderDetails) => {
  try {
    const { orderId, showTitle, eventDate, eventTime, tickets, totalAmount } = orderDetails;
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Planetarium Box Office" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Booking Confirmed — ${showTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #7b2d5e; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin:0;">Planetarium</h1>
            <p style="margin:4px 0 0; opacity:0.85;">Booking Confirmed</p>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hi there! Your booking is confirmed. Here are your details:</p>
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Show:</strong> ${showTitle}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${eventDate}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${eventTime}</p>
              <p style="margin: 8px 0;"><strong>Tickets:</strong> ${tickets.length}</p>
              ${tickets.map(t => `
                <div style="margin: 8px 0; padding-left: 16px; display: flex; align-items: center; gap: 12px;">
                    <div>
                    <p style="margin: 0;">• Seat ${t.seatLabel} — ${t.ticketType}</p>
                    </div>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(t.qrCode)}&size=80x80" 
                        alt="QR Code" style="width:80px; height:80px; border:1px solid #eee; border-radius:4px;" />
                </div>
                `).join('')}
              <hr style="border: none; border-top: 1px solid #eee; margin: 12px 0;">
              <p style="margin: 8px 0;"><strong>Total:</strong> $${parseFloat(totalAmount).toFixed(2)}</p>
              <p style="margin: 8px 0;"><strong>Booking Ref:</strong> <span style="background:#f0f0f0; padding: 2px 8px; border-radius: 4px;">#${orderId}</span></p>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">Please arrive 10 minutes before showtime. This is an automated message.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(' Confirmation email sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    return { success: false, error: error.message };
  }
};