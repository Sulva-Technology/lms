import { Resend } from 'resend';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** A message body without a recipient, as produced by the template functions. */
export type EmailBody = Omit<EmailMessage, 'to'>;

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

let resendSender: EmailSender | null | undefined;
let injected: EmailSender | null = null;

/** Test-only seam. Pass null to restore normal resolution. */
export function __setEmailSenderForTests(sender: EmailSender | null): void {
  injected = sender;
}

function resolveResendSender(): EmailSender | null {
  if (resendSender !== undefined) return resendSender;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    resendSender = null;
    return null;
  }

  const resend = new Resend(apiKey);

  resendSender = {
    async send(message: EmailMessage) {
      const { error } = await resend.emails.send({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      if (error) throw new Error(error.message);
    },
  };

  return resendSender;
}

/** True when a provider is configured, so callers can skip building bodies. */
export function isEmailConfigured(): boolean {
  return Boolean(injected ?? resolveResendSender());
}

/**
 * Best-effort delivery. Email is a side channel: a provider outage must never
 * fail the database write that triggered it.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const sender = injected ?? resolveResendSender();
  if (!sender) return;

  try {
    await sender.send(message);
  } catch (error) {
    console.error('[email] delivery failed', { to: message.to, subject: message.subject, error });
  }
}
