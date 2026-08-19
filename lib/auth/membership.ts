import type { AuthRole } from '@/types/auth';

/** Just enough of a Supabase client to read a table, so tests can stub it. */
export type SupabaseLike = { from: (table: string) => any };

export interface Membership {
  userId: string;
  universityId: string;
  role: AuthRole;
  studentId: string | null;
  departmentId: string | null;
}

const MEMBERSHIP_COLUMNS = 'user_id, university_id, role, student_id, department_id';

/**
 * The person's standing at one organisation.
 *
 * A deactivated membership reads as no membership: one organisation removing
 * someone must not touch their account or their standing anywhere else.
 */
export async function getMembership(
  client: SupabaseLike,
  userId: string,
  universityId: string,
): Promise<Membership | null> {
  const { data, error } = await client
    .from('memberships')
    .select(MEMBERSHIP_COLUMNS)
    .eq('user_id', userId)
    .eq('university_id', universityId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('Membership lookup failed:', error);
    return null;
  }
  if (!data) return null;

  return {
    userId: data.user_id,
    universityId: data.university_id,
    role: data.role as AuthRole,
    studentId: data.student_id ?? null,
    departmentId: data.department_id ?? null,
  };
}

/** Platform administration is a property of the account, not of a membership. */
export async function isPlatformAdmin(client: SupabaseLike, userId: string): Promise<boolean> {
  const { data, error } = await client
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Platform admin lookup failed:', error);
    return false;
  }

  return Boolean(data);
}

/**
 * Adds someone to an organisation. Already being a member is the goal state,
 * not a failure, so it reports `created: false` rather than throwing.
 */
export async function addMembership(
  client: SupabaseLike,
  input: {
    userId: string;
    universityId: string;
    role: AuthRole;
    studentId?: string | null;
    departmentId?: string | null;
  },
): Promise<{ created: boolean }> {
  const existing = await getMembership(client, input.userId, input.universityId);
  if (existing) return { created: false };

  const { error } = await client.from('memberships').insert({
    user_id: input.userId,
    university_id: input.universityId,
    role: input.role,
    student_id: input.studentId ?? null,
    department_id: input.departmentId ?? null,
  });

  // 23505 means someone else won the race, which lands in the same state.
  if (error && (error as { code?: string }).code !== '23505') {
    throw new Error(error.message);
  }

  return { created: !error };
}

/**
 * The role to authorise this request with.
 *
 * The membership at the organisation being visited wins: a platform admin who
 * is also a lecturer somewhere acts as a lecturer there.
 */
export function effectiveRole(
  membership: Membership | null,
  platformAdmin: boolean,
): AuthRole | null {
  if (membership) return membership.role;
  return platformAdmin ? 'super_admin' : null;
}
