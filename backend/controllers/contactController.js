const sendEmail = require('../utils/sendEmail');
const SiteSettings = require('../model/SiteSettings');
const { sendErrorResponse } = require('../utils/apiError');
const { escapeHtml } = require('../utils/escapeHtml');

const FALLBACK_CONTACT_INBOX = process.env.CONTACT_EMAIL || process.env.SMTP_FROM || process.env.EMAIL_USER;

// The support email is editable in the admin panel. Use it as the inbox so a
// change on the Contact page also redirects the contact form, and fall back to
// the env setting if the database cannot be read.
const resolveContactInbox = async () => {
  try {
    const settings = await SiteSettings.findOne({ key: 'storefront' }).select('email').lean();
    return (settings && settings.email) || FALLBACK_CONTACT_INBOX;
  } catch (error) {
    console.error('Could not load contact inbox from site settings:', error.message);
    return FALLBACK_CONTACT_INBOX;
  }
};

const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const inbox = await resolveContactInbox();
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1d1d1d;">New Contact Message - Bareaya</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
      </div>
    `;

    await sendEmail({
      email: inbox,
      subject: `Bareaya - New contact message from ${safeName}`,
      html,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      replyTo: email
    });

    // Acknowledge the sender in the background so the form responds instantly.
    sendEmail({
      email,
      subject: 'Bareaya - We received your message',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
          <p>Hello ${safeName},</p>
          <p>Thank you for reaching out to Bareaya. We have received your message and will get back to you shortly.</p>
          <p>You can also reach us directly at ${escapeHtml(inbox)}.</p>
          <p>Warm regards,<br/>Bareaya Team</p>
        </div>
      `
    }).catch((ackError) => console.error('Contact acknowledgment email failed:', ackError.message));

    res.status(201).json({ message: 'Message sent successfully!' });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

module.exports = { sendContactMessage };