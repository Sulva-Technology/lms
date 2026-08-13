export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'overridden';

export type RegistrationStep = 'status' | 'compulsory' | 'elective' | 'review' | 'success';

export type RegistrationState = 'open' | 'pending' | 'approved' | 'rejected' | 'closed';

export interface CourseOption {
  id: string;
  code: string;
  title: string;
  credits: number;
  type: 'compulsory' | 'elective';
  instructor: string;
  schedule: string;
  prerequisites: string[];
  description: string;
  conflictTimes: string[];
}

export interface RegistrationConfig {
  minCredits: number;
  maxCredits: number;
  deadline: string;
  currentSemester: string;
}

export interface CourseRegistrationPayload {
  semesterId: string;
  courseSectionIds: string[];
}

export interface RegistrationWindow {
  id: string;
  university_id: string;
  semester_id: string;
  program_id: string | null;
  start_date: string;
  end_date: string;
  add_drop_deadline: string;
  min_credits: number;
  max_credits: number;
}
