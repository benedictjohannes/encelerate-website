export type SendEmailOptions = {
    to: string;
    subject: string;
    html: string;
    from?: string;
    headers?: Record<string, string>;
};

/**
 * Sends an email using the Plunk API.
 */
export async function sendEmail(env: { 
    plunkApiKey: string 
}, options: SendEmailOptions) {
    let fromEmail = 'blog-notifications@mail.encelerate.com';
    let fromName = 'encelerate.com blog';

    if (options.from) {
        const match = options.from.match(/^(.*?)\s*<(.*?)>$/);
        if (match) {
            fromName = match[1].trim();
            fromEmail = match[2].trim();
        } else {
            fromName = options.from.trim();
        }
    }

    const response = await fetch('https://next-api.useplunk.com/v1/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.plunkApiKey}`,
        },
        body: JSON.stringify({
            to: options.to,
            subject: options.subject,
            body: options.html,
            from: {
                name: fromName,
                email: fromEmail,
            },
            headers: options.headers,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Plunk Email Error:', error);
        throw new Error(`Failed to send email: ${response.statusText}`);
    }

    return response;
}

