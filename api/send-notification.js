// Vercel API Route: /api/send-notification.js
// This endpoint sends email notifications to doctors when new questions are submitted

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
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
      return res.status(400).json({ error: 'Missing required fields' });
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
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🩺 Второ мислење</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">✓ Добивте одговор на вашето прашање</p>
            </div>
            
            <!-- Main Content -->
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
              <!-- Question Title -->
              <h2 style="color: #1a202c; font-size: 22px; margin: 0 0 20px 0; font-weight: 600;">
                ${questionTitle}
              </h2>
              
              <!-- Your Question -->
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0066CC;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #718096;">Вашето прашање:</p>
                <p style="color: #1a202c; line-height: 1.6; margin: 0; white-space: pre-wrap; font-size: 15px;">
                  ${questionText}
                </p>
              </div>

              <!-- Attachments if any -->
              ${attachmentsHTML || ''}
              
              <!-- Doctor Info -->
              <div style="background: #D1FAE5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #059669;">Одговор од:</p>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a202c;">${doctorName}</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">
                  ${doctorSpecialization} • ${doctorHospital} • ${doctorExperience} години искуство
                </p>
              </div>
              
              <!-- Doctor's Answer -->
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10B981;">
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #059669;">✓ Професионален одговор:</p>
                <p style="color: #1a202c; line-height: 1.8; margin: 0; white-space: pre-wrap; font-size: 15px;">
                  ${answerText}
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}" 
                   style="display: inline-block; background: #10B981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                  Видете го целосниот одговор →
                </a>
              </div>
              
              <!-- Footer Note -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="color: #718096; font-size: 13px; margin: 0;">
                  Најавете се на платформата за да видите повеќе детали.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 20px; padding: 20px;">
              <p style="color: #718096; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Второ мислење. Сите права задржани.
              </p>
              <p style="color: #718096; font-size: 12px; margin: 10px 0 0 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}" style="color: #0066CC; text-decoration: none;">Посети го сајтот</a>
              </p>
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
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🩺 Второ мислење</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Ново прашање од пациент</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
            <!-- Patient Info -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0066CC;">
              <p style="margin: 0; font-size: 14px; color: #718096;"><strong>Пациент:</strong> ${patientName}</p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #718096;"><strong>Област:</strong> ${specialty}</p>
            </div>
            
            <!-- Question Title -->
            <h2 style="color: #1a202c; font-size: 22px; margin: 0 0 15px 0; font-weight: 600;">
              ${questionTitle}
            </h2>
            
            <!-- Question Text -->
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
              <p style="color: #1a202c; line-height: 1.6; margin: 0; white-space: pre-wrap; font-size: 15px;">
                ${questionText}
              </p>
            </div>
            
            <!-- Attachments Section -->
            ${attachmentsHTML || ''}
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}" 
                 style="display: inline-block; background: #0066CC; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);">
                Одговори на прашањето →
              </a>
            </div>
            
            <!-- Footer Note -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #718096; font-size: 13px; margin: 0;">
                Најавете се на платформата за да го видите прашањето и да одговорите.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 20px; padding: 20px;">
            <p style="color: #718096; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Второ мислење. Сите права задржани.
            </p>
            <p style="color: #718096; font-size: 12px; margin: 10px 0 0 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}" style="color: #0066CC; text-decoration: none;">Посети го сајтот</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notifications@yourdomain.com',
      to: to,
      subject: subject,
      html: emailHTML,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(400).json({ error: error.message });
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
      message: error.message 
    });
  }
}
