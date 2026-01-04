// Email notification API endpoint for Vtoro Mislenje
// Sends emails via Resend API
// Updated with Super Admin notification support

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
      hasApiKey: !!process.env.RESEND_API_KEY,
      hasFromEmail: !!process.env.FROM_EMAIL
    });

    const body = req.body;
    
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'Resend API key not configured',
        hint: 'Set RESEND_API_KEY in Vercel environment variables'
      });
    }

    // Import Resend dynamically
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const {
      to,
      subject,
      patientName,
      patientEmail,
      questionTitle,
      specialty,
      questionText,
      attachmentsHTML,
      questionId,
      // Original notification types
      isAnswer,
      doctorName,
      doctorSpecialization,
      doctorHospital,
      doctorExperience,
      answerText,
      // NEW: Super Admin notification types
      isSuperAdminNotification,
      isDoctorAssignment,
      isPatientAnswer,
      adminNote
    } = body;

    // Validate required fields
    if (!to || !subject) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['to', 'subject'],
        received: { to: !!to, subject: !!subject }
      });
    }

    // Create email HTML based on notification type
    let emailHTML;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vtoromislenje.com';

    // ============================================
    // TYPE 1: Super Admin - New Question Notification
    // ============================================
    if (isSuperAdminNotification) {
      emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 24px;">👑 Ново прашање за доделување</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Супер Админ Известување</p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;"><strong>⚡ Потребна акција:</strong> Доделете го прашањето на лекар</p>
            </div>

            <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0066CC;">
              <p style="margin: 0; color: #1e40af;"><strong>👤 Пациент:</strong> ${patientName || 'Непознат'}</p>
              <p style="margin: 5px 0 0 0; color: #1e40af;"><strong>📧 Email:</strong> ${patientEmail || 'Не е достапен'}</p>
              <p style="margin: 5px 0 0 0; color: #1e40af;"><strong>📂 Област:</strong> ${specialty || 'Општо'}</p>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;"><strong>📅 Датум:</strong> ${new Date().toLocaleString('mk-MK')}</p>
            </div>

            <h2 style="color: #333; font-size: 20px; margin-top: 25px;">${questionTitle || 'Прашање'}</h2>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
              <p style="margin: 0; white-space: pre-wrap; color: #374151; line-height: 1.6;">${questionText || ''}</p>
            </div>

            ${attachmentsHTML || ''}

            <div style="text-align: center; margin-top: 30px;">
              <a href="${appUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                Отвори Контролна Табла →
              </a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 13px; margin-top: 20px;">
              ID на прашање: ${questionId || 'N/A'}
            </p>
          </div>
        </body>
        </html>
      `;
    }
    // ============================================
    // TYPE 2: Doctor Assignment Notification
    // ============================================
    else if (isDoctorAssignment) {
      emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #0066CC; margin-top: 0; font-size: 24px;">📋 Ви е доделено ново прашање</h1>
            
            <p style="color: #374151; font-size: 16px;">Почитуван/а <strong>${doctorName || 'Доктор'}</strong>,</p>
            <p style="color: #374151;">Супер Админот ви додели ново прашање за одговор.</p>

            <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af;"><strong>👤 Пациент:</strong> ${patientName || 'Непознат'}</p>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;"><strong>📅 Датум:</strong> ${new Date().toLocaleString('mk-MK')}</p>
            </div>

            ${adminNote ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;"><strong>📝 Забелешка од Админ:</strong></p>
              <p style="margin: 10px 0 0 0; color: #78350f;">${adminNote}</p>
            </div>
            ` : ''}

            <h2 style="color: #333; font-size: 20px; margin-top: 25px;">${questionTitle || 'Прашање'}</h2>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
              <p style="margin: 0; white-space: pre-wrap; color: #374151; line-height: 1.6;">${questionText || ''}</p>
            </div>

            ${attachmentsHTML || ''}

            <div style="text-align: center; margin-top: 30px;">
              <a href="${appUrl}" 
                 style="background: #0066CC; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                Одговори на прашањето →
              </a>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 30px 0 0 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 13px;">
                ⏰ Ве молиме одговорете на прашањето во рок од 48 часа за да обезбедите навремена помош на пациентот.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    }
    // ============================================
    // TYPE 3: Patient - Approved Answer Notification
    // ============================================
    else if (isPatientAnswer) {
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
            
            <p style="color: #374151; font-size: 16px;">Почитуван/а <strong>${patientName || 'Корисник'}</strong>,</p>
            <p style="color: #374151;">Добивте одговор од нашиот медицински тим на вашето прашање.</p>

            <h2 style="color: #333; font-size: 20px; margin-top: 25px;">${questionTitle || 'Прашање'}</h2>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
              <p style="margin: 0; color: #666;"><strong>Вашето прашање:</strong></p>
              <p style="margin: 10px 0 0 0; color: #374151;">${questionText || ''}</p>
            </div>

            <div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10B981;">
              <p style="margin: 0; color: #059669;"><strong>Одговор од:</strong></p>
              <p style="margin: 5px 0; color: #065f46; font-size: 16px;"><strong>${doctorName || 'Медицински стручњак'}</strong></p>
              ${doctorSpecialization ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">${doctorSpecialization}${doctorHospital ? ' • ' + doctorHospital : ''}</p>` : ''}
            </div>

            <div style="background: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #86efac;">
              <p style="margin: 0; color: #059669;"><strong>✓ Одговор:</strong></p>
              <p style="margin: 10px 0 0 0; white-space: pre-wrap; color: #374151; line-height: 1.6;">${answerText || ''}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${appUrl}" 
                 style="background: #10B981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                Видете повеќе →
              </a>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 30px 0 0 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 13px;">
                <strong>⚠️ Важна напомена:</strong> Овој одговор претставува стручно мислење и не е замена за директна медицинска консултација. Ве молиме консултирајте се со вашиот лекар пред да преземете било какви чекори.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    }
    // ============================================
    // TYPE 4: Original - Patient Answer Notification (legacy)
    // ============================================
    else if (isAnswer === true) {
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
              <a href="${appUrl}" 
                 style="background: #10B981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                Видете повеќе →
              </a>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 30px 0 0 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 13px;">
                <strong>⚠️ Важна напомена:</strong> Овој одговор претставува стручно мислење и не е замена за директна медицинска консултација. Ве молиме консултирајте се со вашиот лекар пред да преземете било какви чекори.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    }
    // ============================================
    // TYPE 5: Original - Doctor Notification (legacy)
    // ============================================
    else {
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
              <a href="${appUrl}" 
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
      type: isSuperAdminNotification ? 'super_admin' : 
            isDoctorAssignment ? 'doctor_assignment' : 
            isPatientAnswer ? 'patient_answer' :
            isAnswer ? 'legacy_answer' : 'legacy_doctor'
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
