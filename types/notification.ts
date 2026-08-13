export interface NotificationPayload {
  universityId: string;
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'course' | 'assignment' | 'grade' | 'message';
  linkUrl?: string;
  isRead?: boolean;
}
