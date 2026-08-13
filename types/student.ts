export interface Course {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  imageSeed: string;
  totalChapters: number;
  completedChapters: number;
  timeRemaining?: string;
}

export interface LiveClass {
  id: string;
  title: string;
  course: string;
  instructor: string;
  startTime: string;
  duration: string;
  zoomLink?: string;
  instructorAvatar?: string;
  theme?: "blue" | "purple" | "orange" | "emerald";
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  urgency: "high" | "medium" | "low";
}

export interface Announcement {
  id: string;
  title: string;
  course: string;
  date: string;
  excerpt: string;
  isUnread: boolean;
}

export interface AcademicStats {
  gpa: number;
  creditsCompleted: number;
  totalCredits: number;
  assignmentsDone: number;
  attendanceRate: number;
  learningStreakDays: number;
}
