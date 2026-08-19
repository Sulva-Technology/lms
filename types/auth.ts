export interface University {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  location?: string;
}

export type AuthRole = 'student' | 'lecturer' | 'department_admin' | 'admin' | 'super_admin';

/**
 * Who someone is. Shared across every organisation they belong to, which is
 * why nothing tenant-scoped lives here — that is on the membership.
 */
export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  email: string | null;
}

export interface SessionData {
  user: {
    id: string;
    email: string;
  } | null;
  profile: UserProfile | null;
  /** The person's standing at the organisation this request is for. */
  membership: import('@/lib/auth/membership').Membership | null;
  isPlatformAdmin: boolean;
  /** The role to authorise this request with; null when there is none here. */
  role: AuthRole | null;
}

export interface RoleOption {
  id: AuthRole;
  title: string;
  description: string;
  icon: string;
}
