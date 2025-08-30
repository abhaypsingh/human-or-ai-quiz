import type { Handler } from '@netlify/functions';
import { sql } from './_db';
import { getUser } from './_auth';
import { withCors } from './middleware/cors';
import { withValidation, validators } from './middleware/validation';
import { withRateLimit, rateLimitPresets } from './middleware/rate-limiter';
import type { FeedbackRequest, FeedbackResponse } from './types/index';
import crypto from 'crypto';

// Strict rate limiting for feedback (to prevent spam)
const feedbackRateLimit = withRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 feedback submissions per hour
  message: 'Too many feedback submissions. Please wait before submitting again.'
});

export const handler: Handler = withCors()(
  feedbackRateLimit(
    withValidation(validators.feedback())(async (event, context) => {
      // Only allow POST requests for feedback submission
      if (event.httpMethod !== 'POST') {
        return {
          statusCode: 405,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Method Not Allowed',
            message: 'Only POST requests are allowed for feedback submission',
            allowedMethods: ['POST'],
            timestamp: new Date().toISOString()
          })
        };
      }

      try {
        const user = getUser(context); // Optional - feedback can be anonymous
        const feedbackData: FeedbackRequest = (event as any).validatedData;
        
        // Generate unique feedback ID
        const feedbackId = crypto.randomUUID();
        
        // Collect metadata
        const metadata = {
          ...feedbackData.metadata,
          userAgent: event.headers['user-agent'] || 'unknown',
          clientIP: getClientIP(event),
          timestamp: new Date().toISOString(),
          netlifyId: event.headers['x-netlify-id'],
          origin: event.headers.origin
        };

        // Store feedback in database
        // Note: You'll need to create a feedback table in your schema
        await sql`
          INSERT INTO feedback (
            id, 
            user_id, 
            type, 
            title, 
            message, 
            metadata, 
            status,
            created_at
          )
          VALUES (
            ${feedbackId}::uuid,
            ${user?.sub || null}::uuid,
            ${feedbackData.type}::text,
            ${feedbackData.title},
            ${feedbackData.message},
            ${JSON.stringify(metadata)}::jsonb,
            'pending',
            NOW()
          )
        `;

        // Log feedback for monitoring
        console.log('Feedback received:', {
          id: feedbackId,
          type: feedbackData.type,
          title: feedbackData.title,
          userId: user?.sub || 'anonymous',
          timestamp: new Date().toISOString()
        });

        // Send notification email in production (placeholder)
        if (process.env.NODE_ENV === 'production') {
          await sendFeedbackNotification(feedbackId, feedbackData, user);
        }

        const response: FeedbackResponse = {
          id: feedbackId,
          status: 'received',
          message: 'Thank you for your feedback! We appreciate you taking the time to help us improve.'
        };

        return {
          statusCode: 201,
          headers: { 
            'Content-Type': 'application/json',
            'X-Feedback-ID': feedbackId
          },
          body: JSON.stringify(response)
        };

      } catch (error: any) {
        console.error('Feedback submission error:', error);

        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Feedback Submission Failed',
            message: 'Unable to submit feedback. Please try again later.',
            timestamp: new Date().toISOString()
          })
        };
      }
    })
  )
);

// Helper function to get client IP
function getClientIP(event: any): string {
  const forwarded = event.headers['x-forwarded-for'];
  const realIP = event.headers['x-real-ip'];
  const clientIP = event.headers['x-client-ip'];

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (clientIP) {
    return clientIP;
  }

  return 'unknown';
}

// Placeholder for feedback notification
async function sendFeedbackNotification(
  feedbackId: string, 
  feedback: FeedbackRequest, 
  user: any
): Promise<void> {
  // In a real implementation, you would:
  // 1. Send email notification to admins
  // 2. Post to Slack/Discord webhook
  // 3. Create GitHub issue for feature requests
  // 4. Send to error tracking service for bugs
  
  console.log('Feedback notification:', {
    id: feedbackId,
    type: feedback.type,
    title: feedback.title,
    user: user?.email || 'anonymous'
  });

  // Example webhook notification (uncomment and configure in production)
  /*
  if (process.env.WEBHOOK_URL) {
    try {
      await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `New ${feedback.type} feedback received`,
          attachments: [{
            color: feedback.type === 'bug' ? 'danger' : 'good',
            fields: [
              { title: 'Title', value: feedback.title, short: true },
              { title: 'Type', value: feedback.type, short: true },
              { title: 'User', value: user?.email || 'Anonymous', short: true },
              { title: 'Message', value: feedback.message.substring(0, 200), short: false }
            ]
          }]
        })
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }
  */
}