export interface RecordingMetadata {
  id: string;
  universityId: string;
  courseId: string;
  liveClassId: string;
  provider: string;
  providerRecordingId: string;
  playbackUrl: string;
  durationSeconds: number;
  status: 'processing' | 'ready' | 'failed';
  isPublished: boolean;
}
