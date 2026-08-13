export interface FacultyPayload {
  name: string;
  code: string;
}

export interface DepartmentPayload {
  facultyId: string;
  name: string;
  code: string;
}

export interface ProgramPayload {
  departmentId: string;
  name: string;
  code: string;
  description?: string;
}

export interface CoursePayload {
  departmentId: string;
  title: string;
  code: string;
  description?: string;
  credits: number;
  status?: 'draft' | 'published' | 'archived';
}

export interface AcademicSessionPayload {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface SemesterPayload {
  academicSessionId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}
