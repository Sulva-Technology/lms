import crypto from 'node:crypto';

export function verifyDailyWebhookSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null,
  base64Secret: string | undefined,
): boolean {
  if (!signature || !timestamp || !base64Secret) return false;

  try {
    const normalizedPayload = JSON.stringify(JSON.parse(payload));
    const signedPayload = `${timestamp}.${normalizedPayload}`;
    const secret = Buffer.from(base64Secret, 'base64');
    const computed = crypto.createHmac('sha256', secret).update(signedPayload).digest('base64');

    const receivedBuffer = Buffer.from(signature);
    const computedBuffer = Buffer.from(computed);

    return (
      receivedBuffer.length === computedBuffer.length &&
      crypto.timingSafeEqual(receivedBuffer, computedBuffer)
    );
  } catch {
    return false;
  }
}
