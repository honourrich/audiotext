/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

/**
 * Clerk Webhook Handler - Welcome Email
 * 
 * Sends welcome emails to new users when they sign up
 * 
 * @author Welcome Email Service
 * @version 1.0.0
 */

Deno.serve(async (req) => {
  // Log every request for debugging
  console.log('=== Webhook received ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
        },
      });
    }

    // Health check endpoint (GET request)
    if (req.method === 'GET') {
      console.log('Health check requested');
      return new Response(
        JSON.stringify({ 
          status: 'ok', 
          function: 'send-welcome-email',
          timestamp: new Date().toISOString(),
          hasApiKey: !!Deno.env.get('RESEND_API_KEY')
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed', received: req.method }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'welcome@audiotext.app';

    console.log('Webhook received - checking configuration...');
    console.log('RESEND_API_KEY exists:', !!resendApiKey);
    console.log('RESEND_FROM_EMAIL:', resendFromEmail);

    if (!resendApiKey) {
      console.error('Resend API key not configured - check Supabase secrets');
      // Return 200 to prevent Clerk from retrying, but log the error
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Email service not configured',
          message: 'RESEND_API_KEY secret not found in Supabase'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get raw body text first (Clerk webhooks use Svix format)
    const bodyText = await req.text();
    console.log('Raw body received, length:', bodyText.length);
    console.log('Raw body preview (first 500 chars):', bodyText.substring(0, 500));

    let payload;
    try {
      payload = JSON.parse(bodyText);
      console.log('Payload parsed successfully');
      console.log('Payload type:', payload.type);
      console.log('Payload has data:', !!payload.data);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      // Return 200 to Clerk so it doesn't retry, but log the error
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { type, data } = payload;

    console.log('Received webhook event:', type);
    console.log('Event data keys:', Object.keys(data || {}));
    console.log('Data structure:', {
      hasEmailAddresses: !!data?.email_addresses,
      emailAddressesType: Array.isArray(data?.email_addresses) ? 'array' : typeof data?.email_addresses,
      emailAddressesLength: data?.email_addresses?.length || 0
    });

    // Only process user.created events
    if (type !== 'user.created') {
      return new Response(
        JSON.stringify({ message: 'Event not processed', type }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract user information - handle Clerk's payload structure
    const userEmail = data.email_addresses?.[0]?.email_address;
    const userName = data.first_name || data.username || 'there';
    const userId = data.id;
    
    console.log('Extracted user data:', {
      userId,
      userName,
      userEmail,
      hasEmailAddresses: !!data.email_addresses,
      emailAddressesCount: data.email_addresses?.length || 0,
      first_name: data.first_name,
      username: data.username
    });

    if (!userEmail) {
      console.error('No email address found in webhook payload');
      console.error('Available data keys:', Object.keys(data));
      console.error('Email addresses structure:', JSON.stringify(data.email_addresses, null, 2));
      // Return 200 to prevent Clerk retries, but log the error
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No email address found',
          debug: {
            hasEmailAddresses: !!data.email_addresses,
            emailAddressesLength: data.email_addresses?.length || 0,
            dataKeys: Object.keys(data)
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending welcome email to: ${userEmail} (User: ${userName})`);

    // Welcome email HTML template
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to audiotext.app</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    
                    <!-- Header with gradient -->
                    <tr>
                        <td style="background: linear-gradient(90deg, #14B8A6 0%, #06B6D4 25%, #3B82F6 50%, #8B5CF6 75%, #6366F1 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                audiotext.app
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                                Welcome, ${userName}! 🎉
                            </h2>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Thank you for joining audiotext.app! We're thrilled to have you on board.
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Transform your audio and video content into professional transcripts, summaries, and AI-powered content in minutes.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://audiotext.app/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #3B82F6 0%, #6366F1 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                                            Get Started →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Features Section -->
                            <div style="margin: 40px 0; padding: 30px; background-color: #f9fafb; border-radius: 8px;">
                                <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                                    What you can do:
                                </h3>
                                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                                    <li style="margin-bottom: 10px;">Upload audio/video files (MP3, WAV, MP4, etc.)</li>
                                    <li style="margin-bottom: 10px;">Paste YouTube URLs for instant transcription</li>
                                    <li style="margin-bottom: 10px;">Generate AI-powered summaries and Q&A</li>
                                    <li style="margin-bottom: 10px;">Export in multiple formats (PDF, Word, HTML, TXT)</li>
                                    <li>Create professional show notes automatically</li>
                                </ul>
                            </div>
                            
                            <!-- Quick Tips -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3B82F6; border-radius: 4px;">
                                <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
                                    💡 Quick Tip:
                                </p>
                                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                                    Start with a short audio file or YouTube video to see how fast our AI transcription works!
                                </p>
                            </div>
                            
                            <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                If you have any questions, feel free to reach out to us at <a href="mailto:info@audiotext.app" style="color: #3B82F6; text-decoration: none;">info@audiotext.app</a>.
                            </p>
                            
                            <p style="margin: 20px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Happy transcribing!<br>
                                <strong>The audiotext.app Team</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                <a href="https://audiotext.app" style="color: #3B82F6; text-decoration: none;">audiotext.app</a>
                            </p>
                            <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px;">
                                AI-Powered Transcription & Content Creation
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                <a href="https://audiotext.app" style="color: #9ca3af; text-decoration: none;">Visit Website</a> | 
                                <a href="mailto:info@audiotext.app" style="color: #9ca3af; text-decoration: none;">Contact Us</a>
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();

    // Plain text version
    const textTemplate = `
Welcome to audiotext.app! 🎉

Hi ${userName},

Thank you for joining audiotext.app! We're thrilled to have you on board.

Transform your audio and video content into professional transcripts, summaries, and AI-powered content in minutes.

Get started: https://audiotext.app/dashboard

What you can do:
• Upload audio/video files (MP3, WAV, MP4, etc.)
• Paste YouTube URLs for instant transcription
• Generate AI-powered summaries and Q&A
• Export in multiple formats (PDF, Word, HTML, TXT)
• Create professional show notes automatically

💡 Quick Tip: Start with a short audio file or YouTube video to see how fast our AI transcription works!

If you have any questions, feel free to reach out to us at info@audiotext.app.

Happy transcribing!
The audiotext.app Team

---
audiotext.app - AI-Powered Transcription & Content Creation
Visit: https://audiotext.app | Contact: info@audiotext.app
    `.trim();

    // Send email via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [userEmail],
        subject: 'Welcome to audiotext.app! 🎉',
        html: htmlTemplate,
        text: textTemplate,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }
      
      console.error('Resend API error:', {
        status: emailResponse.status,
        statusText: emailResponse.statusText,
        error: errorDetails
      });
      
      // Return 200 to Clerk so it doesn't retry (we'll handle retries manually if needed)
      // But log the error for debugging
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to send email',
          details: errorDetails,
          message: 'Email sending failed but webhook processed'
        }),
        { 
          status: 200, // Return 200 so Clerk doesn't retry
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    const emailResult = await emailResponse.json();
    console.log('Welcome email sent successfully:', {
      emailId: emailResult.id,
      to: userEmail,
      from: resendFromEmail
    });

    // Return success response - Clerk expects 200 status
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent',
        emailId: emailResult.id 
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error) {
    console.error('Error processing webhook:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    // Return 200 to prevent Clerk from retrying on unexpected errors
    // Log the error for debugging
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 200, // Return 200 so Clerk doesn't mark as failed
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});

