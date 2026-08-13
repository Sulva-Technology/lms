export interface LessonCreatePayload {
  moduleId: string;
  title: string;
  content?: string;
  resourceType: 'document' | 'video' | 'link' | 'other';
}

export interface StudentNotePayload {
  lessonId: string;
  content: string;
  videoTimestamp?: number;
}
