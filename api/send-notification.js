// Test API endpoint - verifies basic functionality works
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
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
      hasApiKey: !!process.env.re_AdYbP4KH_J1jYCL39uN24HcdhmsySzDii,
      hasFromEmail: !!process.env.info@vtoromislenje.com
    });

    const body = req.body;
    
    // Check if Resend is configured
    if (!process.env.re_AdYbP4KH_J1jYCL39uN24HcdhmsySzDii) {
      return res.status(500).json({ 
        error: 'Resend API key not configured',
        hint: 'Set re_AdYbP4KH_J1jYCL39uN24HcdhmsySzDii in Vercel environment variables'
      });
    }

    // Import Resend dynamically
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.re_AdYbP4KH_J1jYCL39uN24HcdhmsySzDii);

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
        required: ['to', 'subject']
      });
    }

    // Determine email type
    const isAnswerEmail = isAnswer === true;

    // Create simple email HTML
    let emailHTML;

    if (isAnswerEmail) {
      // Patient notification email
      emailHTML = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #10B981; margin-top: 0;">✓ Одговор на вашето прашање</h1>
            <h2 style="color: #333;">${questionTitle || 'Прашање'}</h2>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #666;"><strong>Вашето прашање:</strong></p>
              <p style="margin: 10px 0 0 0;">${questionText || ''}</p>
            </div>

            ${attachmentsHTML || ''}

            <div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #059669;"><strong>Одговор од:</strong></p>
              <p style="margin: 5px 0;"><strong>${doctorName || 'Доктор'}</strong></p>
              <p style="margin: 0; color: #666; font-size: 14px;">${doctorSpecialization || ''} • ${doctorHospital || ''} • ${doctorExperience || ''} год.</p>
            </div>

            <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #059669;"><strong>✓ Одговор:</strong></p>
              <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${answerText || ''}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vtoromislenje.com'}" 
                 style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Видете повеќе →
              </a>
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
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #0066CC; margin-top: 0;">🩺 Ново прашање</h1>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Пациент:</strong> ${patientName || 'Непознат'}</p>
              <p style="margin: 5px 0 0 0;"><strong>Област:</strong> ${specialty || 'Општо'}</p>
            </div>

            <h2 style="color: #333;">${questionTitle || 'Прашање'}</h2>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; white-space: pre-wrap;">${questionText || ''}</p>
            </div>

            ${attachmentsHTML || ''}

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vtoromislenje.com'}" 
                 style="background: #0066CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Одговори →
              </a>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Send email using Resend
    const result = await resend.emails.send({
      from: process.env.info@vtoromislenje.com || 'info@vtoromislenje.com',
      to: to,
      subject: subject,
      html: emailHTML,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
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
