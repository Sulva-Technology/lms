export interface GradebookItemPayload {
  courseSectionId: string;
  name: string;
  maxScore: number;
  weight: number;
}

export interface StudentGradeRecord {
  studentId: string;
  studentName: string;
  totalGrade: number;
  items: Record<string, number>;
}
