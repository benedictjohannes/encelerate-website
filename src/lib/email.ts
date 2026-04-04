import { AwsClient } from 'aws4fetch';

export type SendEmailOptions = {
    to: string;
    subject: string;
    html: string;
};

/**
 * Sends an email using AWS SES via the v4 signing protocol.
 * Optimized for Cloudflare Workers using aws4fetch.
 */
export async function sendEmail(env: { 
    awsSesAccessKeyId: string, 
    awsSesSecretAccessKey: string,
    awsSesSenderEmail: string 
}, options: SendEmailOptions) {
    const aws = new AwsClient({
        accessKeyId: env.awsSesAccessKeyId,
        secretAccessKey: env.awsSesSecretAccessKey,
        region: 'ap-southeast-1', 
    });

    const body = new URLSearchParams({
        'Action': 'SendEmail',
        'Source': env.awsSesSenderEmail,
        'Destination.ToAddresses.member.1': options.to,
        'Message.Subject.Data': options.subject,
        'Message.Body.Html.Data': options.html,
        'Message.Subject.Charset': 'UTF-8',
        'Message.Body.Html.Charset': 'UTF-8',
    });

    const response = await aws.fetch('https://email.ap-southeast-1.amazonaws.com', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('SES Email Error:', error);
        throw new Error(`Failed to send email: ${response.statusText}`);
    }

    return response;
}
