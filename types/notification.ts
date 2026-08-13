import type { EmailBody } from '@/lib/email/send';

/** Builds the email body for one recipient, or returns null to skip mailing them. */
export type NotificationEmailBuilder = (recipient: {
  email: string;
  name: string;
}) => EmailBody | null;

export interface NotificationPayload {
  universityId: string;
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'course' | 'assignment' | 'grade' | 'message';
  linkUrl?: string;
  isRead?: boolean;
  /** Optional transactional email to send alongside the in-app notification. */
  email?: NotificationEmailBuilder;
}
