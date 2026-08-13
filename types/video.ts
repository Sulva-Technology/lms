export interface TranscriptLine {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface VideoNote {
  id: string;
  timestamp: number;
  text: string;
  createdAt: string;
}

export interface VideoResource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'code';
  url: string;
}

export interface VideoComment {
  id: string;
  author: string;
  authorAvatar?: string;
  text: string;
  timestamp: string;
  likes: number;
  replies: number;
}

export interface VideoLessonData {
  id: string;
  title: string;
  courseId: string;
  courseCode: string;
  moduleTitle: string;
  videoUrl?: string; // If empty, show placeholder
  durationSeconds: number;
  transcript: TranscriptLine[];
  resources: VideoResource[];
  comments: VideoComment[];
  nextLesson?: {
    id: string;
    title: string;
  };
  prevLesson?: {
    id: string;
    title: string;
  };
}

export interface VideoAsset {
  id: string;
  universityId: string;
  lessonId?: string;
  courseId?: string;
  liveClassId?: string;
  recordingId?: string;
  provider: string; // 'mux', 'vimeo', 'aws'
  assetId: string;
  playbackId?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  status: 'processing' | 'ready' | 'failed' | 'deleted';
  captionsUrl?: string;
  transcriptUrl?: string;
  visibility: 'private' | 'public' | 'tenant';
  downloadPermission: boolean;
  watermarkSetting?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoAssetPayload {
  lessonId?: string;
  courseId?: string;
  provider: string;
  assetId: string;
  playbackId?: string;
  playbackUrl?: string;
  duration?: number;
  visibility?: 'private' | 'public' | 'tenant';
}
