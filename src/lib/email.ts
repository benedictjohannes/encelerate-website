import { AwsClient } from 'aws4fetch';

export type SendEmailOptions = {
    to: string;
    subject: string;
    html: string;
    from?: string;
    headers?: Record<string, string>;
};

/**
 * Sends an email using AWS SES v2 via the v4 signing protocol.
 * Uses Raw content to support custom headers like List-Unsubscribe.
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

    const fromStr = options.from 
        ? (options.from.includes('<') ? options.from : `${options.from} <${env.awsSesSenderEmail}>`)
        : `encelerate.com blog <${env.awsSesSenderEmail}>`;

    // Construct raw MIME message to support custom headers
    const rawMime = [
        `From: ${fromStr}`,
        `To: ${options.to}`,
        `Subject: ${options.subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        ...Object.entries(options.headers || {}).map(([name, value]) => `${name}: ${value}`),
        '',
        options.html
    ].join('\r\n');

    const payload = {
        Content: {
            Raw: {
                // btoa(unescape(encodeURIComponent(str))) is a robust way to do base64 in environments without Buffer
                Data: btoa(unescape(encodeURIComponent(rawMime)))
            }
        }
    };

    const response = await aws.fetch('https://email.ap-southeast-1.amazonaws.com/v2/email/outbound-emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('SES V2 Raw Email Error:', error);
        throw new Error(`Failed to send email: ${response.statusText}`);
    }

    return response;
}
