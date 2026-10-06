const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === "false" ? false : true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      // The mail host sits across the internet from the VPS, so a silent
      // packet drop would otherwise leave a socket parked for the OS default
      // (minutes) and eat a pooled connection. Fail fast instead — every caller
      // treats a failure as non-fatal.
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000
    });
  }
  return transporter;
};

const sendEmail = async ({ email, subject, text, html, replyTo }) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.EMAIL_USER,
            to: email,
            subject,
            text,
            html
        };
        if (replyTo) mailOptions.replyTo = replyTo;
        return await getTransporter().sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw new Error("Failed to send email");
    }
};

module.exports = sendEmail;