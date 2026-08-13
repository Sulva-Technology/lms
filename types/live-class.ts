export interface LiveSession {
  id: string;
  courseCode: string;
  courseTitle: string;
  topic: string;
  lecturerName: string;
  lecturerAvatar?: string;
  status: 'scheduled' | 'live' | 'completed';
  startTime: string;
  duration: string;
  participantsCount: number;
  tags?: string[];
  meetingLink?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  isHost: boolean;
}

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  isMuted: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
  hasVideo: boolean;
}

export interface LiveClassPayload {
  universityId: string;
  courseId: string;
  courseSectionId: string;
  lecturerId: string;
  topic: string;
  description?: string;
  startTime: string;
  durationMinutes: number;
  isRecordingEnabled?: boolean;
  isWaitingRoomEnabled?: boolean;
  joinBeforeHost?: boolean;
  trackingRule?: 'duration' | 'join';
}

export interface LiveClassResponse {
  id: string;
  providerSessionId: string;
  topic: string;
  startTime: string;
  durationMinutes: number;
  status: string;
  joinUrl: string;
}
