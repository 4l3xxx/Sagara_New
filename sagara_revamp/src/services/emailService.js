const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.init();
    }

    init() {
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

        if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
            this.transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: SMTP_PORT || 587,
                secure: SMTP_PORT == 465, // true for 465, false for other ports
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS,
                },
            });
            console.log('[EmailService] SMTP Transporter configured.');
        } else {
            console.warn('[EmailService] SMTP credentials missing in .env. Emails will be mocked.');
        }
    }

    async sendEmail({ to, subject, text, html, attachments }) {
        if (!this.transporter) {
            console.warn(`[EmailService] MOCK SEND to: ${to} | Subject: ${subject}`);
            console.warn(`[EmailService] MOCK CONTENT: ${text}`);
            return { success: true, mocked: true };
        }

        try {
            const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@sagara.tech';
            const info = await this.transporter.sendMail({
                from: `"Sagara Technology" <${from}>`,
                to,
                subject,
                text,
                html,
                attachments
            });
            console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('[EmailService] Failed to send email:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
