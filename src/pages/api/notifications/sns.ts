import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import * as schema from '../../../db/schema';

interface SNSBody {
    Type: 'SubscriptionConfirmation' | 'Notification' | 'UnsubscribeConfirmation';
    MessageId: string;
    TopicArn: string;
    Message: string;
    Timestamp: string;
    Signature: string;
    SignatureVersion: string;
    SigningCertURL: string;
    SubscribeURL?: string; // Only for SubscriptionConfirmation/UnsubscribeConfirmation
}

interface SESNotification {
    notificationType: 'Bounce' | 'Complaint' | 'Delivery' | 'Received' | 'Reject';
    mail: {
        timestamp: string;
        source: string;
        destination: string[];
        messageId: string;
    };
    bounce?: {
        bounceType: 'Permanent' | 'Transient' | 'Undetermined';
        bounceSubType: string;
        bouncedRecipients: Array<{
            emailAddress: string;
            action: string;
            status: string;
            diagnosticCode: string;
        }>;
    };
    complaint?: {
        complainedRecipients: Array<{
            emailAddress: string;
        }>;
        complaintFeedbackType?: string;
        userAgent?: string;
    };
}

/**
 * AWS SNS Notification Handler for SES Bounces and Complaints.
 * Sets user.emailNotificationsEnabled = false for any matching email records.
 */
export const POST: APIRoute = async ({ request }) => {
    const rawBody = await request.text();
    console.log('[SNS] Received Raw Body:', rawBody);

    try {
        const body = JSON.parse(rawBody) as SNSBody;
        
        // DEBUG: Log exactly what arrives to identify source of 403
        const expectedTopic = env.awsSnsBouncesTopicArn;
        console.log(`[SNS] Parsed Type: ${body.Type}, Topic: ${body.TopicArn}`);
        console.log(`[SNS] Validation Check. Expected: ${expectedTopic}`);

        // 1. Basic Topic Validation (if configured)
        // Set awsSnsBouncesTopicArn in your environment variables.
        if (expectedTopic && body.TopicArn !== expectedTopic) {
            console.error('[SNS] Mismatched TopicArn!', { 
                received: body.TopicArn, 
                expected: expectedTopic 
            });
            return new Response('Unauthorized', { status: 403 });
        }

        // 2. Handle Subscription Confirmation
        if (body.Type === 'SubscriptionConfirmation') {
            if (!body.SubscribeURL) {
                console.error('[SNS] SubscriptionConfirmation missing SubscribeURL');
                return new Response('Missing SubscribeURL', { status: 400 });
            }
            console.error('[SNS] Subscription Confirmation received. URL:', body.SubscribeURL);
            const response = await fetch(body.SubscribeURL);
            if (response.ok) {
                console.log('[SNS] Subscription confirmed successfully.');
                return new Response('Confirmed');
            } else {
                console.error('[SNS] Failed to confirm subscription.');
                return new Response('Failed to confirm', { status: 500 });
            }
        }

        // 3. Handle Notifications
        if (body.Type === 'Notification') {
            const message = JSON.parse(body.Message) as SESNotification;
            const notificationType = message.notificationType;

            if (notificationType === 'Bounce' || notificationType === 'Complaint' || notificationType === 'Reject') {
                const db = drizzle(env.db, { schema });
                
                let recipients: string[] = [];
                if (notificationType === 'Bounce' && message.bounce) {
                    // Only suppress on 'Permanent' (Hard) bounces to protect reputation.
                    // 'Transient' bounces (like mailbox full) can be ignored/retried.
                    if (message.bounce.bounceType !== 'Permanent') {
                        console.log(`[SNS] Ignoring Transient bounce for:`, message.bounce.bouncedRecipients.map((r) => r.emailAddress));
                        return new Response('Notification Processed (Ignored Transient)');
                    }
                    recipients = message.bounce.bouncedRecipients.map((r) => r.emailAddress);
                } else if (notificationType === 'Complaint' && message.complaint) {
                    // Always suppress on complaints.
                    recipients = message.complaint.complainedRecipients.map((r) => r.emailAddress);
                } else if (notificationType === 'Reject') {
                    // Rejects occur before sending; extract recipients from the original message's destination array.
                    recipients = message.mail.destination;
                }

                console.log(`[SNS] Processing ${notificationType} for:`, recipients);

                for (const email of recipients) {
                    const result = await db.update(schema.user)
                        .set({ emailNotificationsEnabled: false })
                        .where(eq(schema.user.email, email))
                        .returning({ id: schema.user.id });
                    
                    if (result.length > 0) {
                        console.log(`[SNS] Suppressed user ${result[0].id} (${email}) due to ${notificationType}`);
                    } else {
                        console.log(`[SNS] Email ${email} not found in user database.`);
                    }
                }
            }
            
            return new Response('Notification Processed');
        }

        return new Response('Unsupported Type', { status: 400 });
    } catch (e) {
        console.error('[SNS] Error processing notification:', e);
        return new Response('Internal Error', { status: 500 });
    }
};
