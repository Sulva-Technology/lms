export interface LiveClassProvider {
  createSession(params: {
    topic: string;
    startTime: string;
    durationMinutes: number;
    hostEmail?: string;
    isRecordingEnabled?: boolean;
    isWaitingRoomEnabled?: boolean;
  }): Promise<{ sessionId: string; hostUrl: string; joinUrl: string; providerMetadata?: Record<string, unknown> }>;

  updateSession(sessionId: string, params: any): Promise<void>;
  
  cancelSession(sessionId: string): Promise<void>;

  generateJoinToken(sessionId: string, participantId: string, role: 'host' | 'guest'): Promise<string>;
}
