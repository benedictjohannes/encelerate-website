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
 * Native headers support allows for List-Unsubscribe and other custom headers.
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

    const payload = {
        FromEmailAddress: fromStr,
        Destination: {
            ToAddresses: [options.to]
        },
        Content: {
            Simple: {
                Subject: { Data: options.subject, Charset: 'UTF-8' },
                Body: {
                    Html: { Data: options.html, Charset: 'UTF-8' }
                }
            }
        },
        // Map headers if provided
        ...(options.headers && {
            EmailAttributes: {
                AdditionalHeaders: Object.entries(options.headers).map(([Name, Value]) => ({ Name, Value }))
            }
        })
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
        console.error('SES V2 Email Error:', error);
        throw new Error(`Failed to send email: ${response.statusText}`);
    }

    return response;
}
