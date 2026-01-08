// Contact form API endpoint for Vtoro Mislenje
// Sends contact form submissions via Resend API

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
    console.log('Received contact form submission');

    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'subject', 'message']
      });
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'Email service not configured'
      });
    }

    // Import Resend dynamically
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Email to receive contact form submissions
    const contactEmail = process.env.CONTACT_EMAIL || 'vtoromislenje001@gmail.com';
    const fromEmail = process.env.FROM_EMAIL || 'noreply@vtoromislenje.com';

    // Create email HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #0066CC 0%, #004499 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">📬 Нова порака од контакт формата</h1>
          </div>
          
          <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0066CC;">
            <p style="margin: 0; color: #1e40af;"><strong>👤 Име:</strong> ${name}</p>
            <p style="margin: 8px 0 0 0; color: #1e40af;"><strong>📧 Email:</strong> ${email}</p>
            ${phone ? `<p style="margin: 8px 0 0 0; color: #1e40af;"><strong>📞 Телефон:</strong> ${phone}</p>` : ''}
            <p style="margin: 8px 0 0 0; color: #1e40af;"><strong>📂 Предмет:</strong> ${subject}</p>
          </div>

          <h2 style="color: #333; font-size: 18px; margin-top: 25px;">Порака:</h2>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
            <p style="margin: 0; white-space: pre-wrap; color: #374151; line-height: 1.6;">${message}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 13px; margin: 0;">
              Оваа порака е испратена од контакт формата на vtoromislenje.com
            </p>
            <p style="color: #6b7280; font-size: 13px; margin: 8px 0 0 0;">
              📅 ${new Date().toLocaleString('mk-MK')}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('Sending contact form email to:', contactEmail);

    // Send email using Resend
    const result = await resend.emails.send({
      from: fromEmail,
      to: contactEmail,
      replyTo: email, // So you can reply directly to the person who contacted
      subject: `[Контакт] ${subject} - од ${name}`,
      html: emailHTML,
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return res.status(400).json({ 
        error: 'Failed to send email',
        details: result.error.message 
      });
    }

    console.log('Contact email sent successfully:', result.data?.id);

    return res.status(200).json({ 
      success: true, 
      messageId: result.data?.id,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
