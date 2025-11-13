// Email notification API endpoint for Vtoro Mislenje
// Sends emails via Resend API

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (for CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log that we received the request
    console.log('Received notification request');
    console.log('Environment check:', {
      hasApiKey: !!process.env.re_jTivnSRj_48cYUhHj6qK9wiRXVBEi3YPd,
      hasFromEmail: !!process.env.info@vtoromislenje.com
    });

    const body = req.body;
    
    // Check if Resend API key is configured
    if (!process.env.re_jTivnSRj_48cYUhHj6qK9wiRXVBEi3YPd) {
      console.error('re_jTivnSRj_48cYUhHj6qK9wiRXVBEi3YPd not found in environment variables');
      return res.status(500).json({ 
        error: 'Resend API key not configured',
        hint: 'Set re_jTivnSRj_48cYUhHj6qK9wiRXVBEi3YPd in Vercel environment variables'
      });
    }

    // Import Resend dynamically
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.re_jTivnSRj_48cYUhHj6qK9wiRXVBEi3YPd);

    const {
      to,
      subject,
      patientName,
      questionTitle,
      specialty,
      questionText,
      attachmentsHTML,
      isAnswer,
      doctorName,
      doctorSpecialization,
      doctorHospital,
      doctorExperience,
      answerText
    } = body;

    // Validate required fields
    if (!to || !subject) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['to', 'subject'],
        received: { to: !!to, subject: !!subject }
      });
    }

    // Determine email type
    const isAnswerEmail = isAnswer === true;

    // Create email HTML
    let emailHTML;

    if (isAnswerEmail) {
      // Patient notification email
      emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #10B981; margin-top: 0; font-size: 24px;">✅ Одговор на вашето прашање</h1>
            <h2 style="color: #333; font-size: 20px;">${questionTitle || 'Прашање'}</h2>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
              <p style="margin: 0; color: #666;"><strong>Вашето прашање:</strong></p>
              <p style="margin: 10px 0 0 0; color: #374151;">${questionText || ''}</p>
            </div>

            ${attachmentsHTML || ''}

            <div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10B981;">
              <p style="margin: 0; color: #059669;"><strong>Одговор од:</strong></p>
              <p style="margin: 5px 0; color: #065f46; font-size: 16px;"><strong>${doctorName || 'Доктор'}</strong></p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">${doctorSpecialization || ''} • ${doctorHospital || ''} • ${doctorExperience || ''} год.</p>
            </div>

            <div style="background: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #86efac;">
              <p style="margin: 0; color: #059669;"><strong>✓ Одговор:</strong></p>
              <p style="margin: 10px 0 0 0; white-space: pre-wrap; color: #374151; line-height: 1.6;">${answerText || ''}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vtoromislenje.com'}" 
                 style="background: #10B981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                Видете повеќе →
              </a>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 30px 0 0 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 13px;">
                <strong>⚠️ Важна напомена:</strong> Овој одговор претставува стручно мислење и не замена за директна медицинска консултација. Ве молиме консултирајте се со вашиот лекар пред да преземете било какви чекори.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Doctor notification email
      emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #0066CC; margin-top: 0; font-size: 24px;">🩺 Ново прашање</h1>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0066CC;">
              <p style="margin: 0; color: #1e40af;"><strong>Пациент:</strong> ${patientName || 'Непознат'}</p>
              <p style="margin: 5px 0 0 0; color: #1e40af;"><strong>Област:</strong> ${specialty || 'Општо'}</p>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;"><strong>Датум:</strong> ${new Date().toLocaleString('mk-MK')}</p>
            </div>

            <h2 style="color: #333; font-size: 20px;">${questionTitle || 'Прашање'}</h2>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
              <p style="margin: 0; white-space: pre-wrap; color: #374151; line-height: 1.6;">${questionText || ''}</p>
            </div>

            ${attachmentsHTML || ''}

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vtoromislenje.com'}" 
                 style="background: #0066CC; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                Одговори →
              </a>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 30px 0 0 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 13px;">
                Ве молиме одговорете на прашањето во рок од 48 часа за да обезбедите навремена помош на пациентот.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Get FROM_EMAIL from environment or use default
    const fromEmail = process.env.FROM_EMAIL || 'info@vtoromislenje.com';

    console.log('Attempting to send email:', {
      from: fromEmail,
      to: to,
      subject: subject,
      isAnswer: isAnswerEmail
    });

    // Send email using Resend
    const result = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: emailHTML,
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return res.status(400).json({ 
        error: 'Failed to send email',
        details: result.error.message 
      });
    }

    console.log('Email sent successfully:', result.data?.id);

    return res.status(200).json({ 
      success: true, 
      messageId: result.data?.id,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
