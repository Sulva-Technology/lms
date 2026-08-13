export interface University {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  location?: string;
}

export type AuthRole = 'student' | 'lecturer' | 'department_admin' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  university_id: string | null;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: AuthRole;
  student_id: string | null;
}

export interface SessionData {
  user: {
    id: string;
    email: string;
  } | null;
  profile: UserProfile | null;
}

export interface RoleOption {
  id: AuthRole;
  title: string;
  description: string;
  icon: string;
}
