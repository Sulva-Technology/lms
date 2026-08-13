export interface AssignmentPayload {
  courseSectionId: string;
  title: string;
  description?: string;
  dueDate: string;
  totalPoints: number;
  isPublished?: boolean;
  allowLateSubmissions?: boolean;
  maxResubmissions?: number;
}
