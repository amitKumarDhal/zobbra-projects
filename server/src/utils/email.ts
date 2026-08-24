import { Resend } from 'resend';
import { config } from '../config/index.js';

const resend = new Resend(config.resendApiKey);

export const sendQuoteEmail = async (
  to: string,
  quoteNumber: string,
  pdfBuffer: Buffer,
  totalAmount: number
) => {
  try {
    if (config.resendApiKey === 're_mock_key') {
      console.log(`[Mock Email] Quote ${quoteNumber} sent to ${to} (Total: ₹${totalAmount})`);
      return { id: 'mock_email_id_123' };
    }

    const response = await resend.emails.send({
      from: 'Zobra Prints <quotes@zobra.com>',
      to: [to],
      subject: `Official Quotation #${quoteNumber} - Zobra Merchandise`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2>Your Quote #${quoteNumber} is Ready!</h2>
          <p>Thank you for inquiring with Zobra Prints. Your total quotation amount is <strong>₹${totalAmount.toLocaleString('en-IN')}</strong>.</p>
          <p>Please review the attached PDF quotation. You can approve or request changes directly through your Customer Portal.</p>
          <br/>
          <p>Best regards,<br/><strong>Zobra Prints Team</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: `Quote_${quoteNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
    return response;
  } catch (error) {
    console.error('Failed to send Resend email:', error);
    throw error;
  }
};
