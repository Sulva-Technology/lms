export interface DashboardStats {
  totalStudents: number;
  averageAttendance: number;
  assignmentsToGrade: number;
  unansweredQuestions: number;
}

export interface AssignedCourse {
  id: string;
  courseId?: string;
  code: string;
  title: string;
  enrolledStudents: number;
  nextClassTime?: string;
  imageSeed: string;
}

export interface UpcomingLecturerClass {
  id: string;
  title: string;
  course: string;
  time: string;
  duration: string;
  studentCount: number;
}

export interface PendingGrading {
  id: string;
  course: string;
  assignmentTitle: string;
  submissionsCount: number;
  urgency: 'high' | 'medium' | 'low';
  dueDate: string;
}

export interface RecordingReview {
  id: string;
  course: string;
  classTitle: string;
  date: string;
  duration: string;
  status: 'processing' | 'ready';
}

export interface StudentQuestion {
  id: string;
  studentName: string;
  studentAvatar?: string;
  course: string;
  question: string;
  timeAgo: string;
  isResolved: boolean;
}
