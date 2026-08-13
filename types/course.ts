export interface Lecturer {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  department: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  type: 'video' | 'reading' | 'quiz' | 'live_recording';
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface CourseStat {
  label: string;
  value: string | number;
  icon: string;
}

export interface AssignmentDetail {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  score?: number;
  maxScore?: number;
}

export interface QuizDetail {
  id: string;
  title: string;
  dueDate: string;
  status: 'available' | 'completed' | 'missed';
  score?: number;
  maxScore?: number;
  timeLimit: string;
}

export interface CourseResource {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'link' | 'zip';
  size?: string;
  url: string;
}

export interface CourseDiscussion {
  id: string;
  author: string;
  authorAvatar?: string;
  title: string;
  preview: string;
  replies: number;
  timeAgo: string;
}

export interface CourseDetail {
  id: string;
  code: string;
  title: string;
  description: string;
  imageSeed: string;
  progress: number;
  credits: number;
  semester: string;
  lecturer: Lecturer;
  stats: CourseStat[];
  modules: CourseModule[];
  assignments: AssignmentDetail[];
  quizzes: QuizDetail[];
  resources: CourseResource[];
  discussions: CourseDiscussion[];
}
