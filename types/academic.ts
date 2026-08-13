export interface Assignment {
  id: string;
  courseCode: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  score?: number;
  maxScore: number;
  description: string;
}

export interface Quiz {
  id: string;
  courseCode: string;
  title: string;
  dueDate: string;
  status: 'available' | 'completed' | 'missed';
  score?: number;
  maxScore: number;
  timeLimit: string;
}

export interface Grade {
  id: string;
  courseCode: string;
  courseTitle: string;
  grade: string;
  score: number;
  credits: number;
  semester: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  isImportant: boolean;
  courseCode?: string;
}

export interface Recording {
  id: string;
  title: string;
  courseCode: string;
  date: string;
  duration: string;
  thumbnail: string;
}
