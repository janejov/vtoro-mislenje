// Vercel API Route: /api/send-notification.js
// This endpoint sends email notifications

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      to,
      subject,
      patientName,
      questionTitle,
      specialty,
      questionText,
      attachmentsHTML,
      questionId,
      isAnswer,
      doctorName,
      doctorSpecialization,
      doctorHospital,
      doctorExperience,
      answerText
    } = req.body;

    // Validate required fields
    if (!to || !questionTitle) {
      return res.status(400).json({ error: 'Missing required fields: to and questionTitle are required' });
    }

    // Check if API key is set
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Check if this is an answer notification or question notification
    const isAnswerNotification = isAnswer === true;

    // Create email HTML based on notification type
    let emailHTML;

    if (isAnswerNotification) {
      // Email template for patient when doctor answers
      emailHTML = `
        <!DOCTYPE html>
        <html lang="mk">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Одговор на вашето прашање</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', sans-serif; background-color: #f7fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🩺 Второ мислење</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">✓ Добивте одговор на вашето прашање</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1a202c; font-size: 22px; margin: 0 0 20px 0; font-weight: 600;">${questionTitle}</h2>
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0066CC;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #718096;">Вашето прашање:</p>
                <p style="color: #1a202c; line-height: 1.6; margin: 0; white-space: pre-wrap; font-size: 15px;">${questionText || ''}</p>
              </div>
              ${attachmentsHTML || ''}
              <div style="background: #D1FAE5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #059669;">Одговор од:</p>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a202c;">${doctorName || 'Медицински стручњак'}</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">${doctorSpecialization || 'Специјалист'} • ${doctorHospital || 'Медицинска установа'} • ${doctorExperience || '?'} години искуство</p>
              </div>
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10B981;">
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #059669;">✓ Професионален одговор:</p>
                <p style="color: #1a202c; line-height: 1.8; margin: 0; white-space: pre-wrap; font-size: 15px;">${answerText || ''}</p>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vtoromislenje.com'}" style="display: inline-block; background: #10B981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Видете го целосниот одговор →</a>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; padding: 20px;">
              <p style="color: #718096; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Второ мислење. Сите права задржани.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Original email template for doctors when new question is posted
      emailHTML = `
      <!DOCTYPE html>
      <html lang="mk">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ново прашање</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', sans-serif; background-color: #f7fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🩺 Второ мислење</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Ново прашање од пациент</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0066CC;">
              <p style="margin: 0; font-size: 14px; color: #718096;"><strong>Пациент:</strong> ${patientName || 'Непознат'}</p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #718096;"><strong>Област:</strong> ${specialty || 'Општо'}</p>
            </div>
            <h2 style="color: #1a202c; font-size: 22px; margin: 0 0 15px 0; font-weight: 600;">${questionTitle}</h2>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
              <p style="color: #1a202c; line-height: 1.6; margin: 0; white-space: pre-wrap; font-size: 15px;">${questionText || ''}</p>
            </div>
            ${attachmentsHTML || ''}
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vtoromislenje.com'}" style="display: inline-block; background: #0066CC; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Одговори на прашањето →</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; padding: 20px;">
            <p style="color: #718096; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Второ мислење. Сите права задржани.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notifications@vtoromislenje.com',
      to: to,
      subject: subject,
      html: emailHTML,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(400).json({ error: error.message || 'Failed to send email' });
    }

    return res.status(200).json({ 
      success: true, 
      messageId: data?.id,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Unknown error'
    });
  }
}
