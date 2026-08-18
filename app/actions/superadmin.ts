'use server'

import { requireRole } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendUserInvite } from '@/lib/auth/invites';
import { bootstrapAcademicStructure } from '@/lib/services/tenant-bootstrap';
import { isValidSubdomain, slugifySubdomain } from '@/lib/tenant/host';
import { tenantOrigin } from '@/lib/tenant/url';
import { env } from '@/lib/env';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const platformPlanSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  monthlyPriceCents: z.coerce.number().int().min(0).default(0),
  maxStudents: z.coerce.number().int().positive().optional(),
  maxStorageGb: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

const universityStatusSchema = z.object({
  universityId: z.string().uuid(),
  status: z.enum(['active', 'trialing', 'suspended', 'archived']),
});

const universitySchema = z.object({
  name: z.string().min(2),
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(63)
    .refine((value) => isValidSubdomain(value), {
      message: 'Subdomain must be lowercase letters, numbers, and hyphens, and not a reserved name.',
    }),
  domain: z.string().min(2).optional().or(z.literal('')),
  status: z.enum(['active', 'trialing', 'suspended', 'archived']).default('trialing'),
  adminEmail: z.string().email(),
  adminFirstName: z.string().trim().optional().or(z.literal('')),
  adminLastName: z.string().trim().optional().or(z.literal('')),
});

const universitySubscriptionSchema = z.object({
  universityId: z.string().uuid(),
  planId: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['trialing', 'active', 'past_due', 'cancelled']),
});

export async function managePlatformPlanAction(payload: any) {
  const supabase = await createClient();
  const session = await requireRole('super_admin');
  const parsed = platformPlanSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const row = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    monthly_price_cents: parsed.data.monthlyPriceCents,
    max_students: parsed.data.maxStudents || null,
    max_storage_gb: parsed.data.maxStorageGb || null,
    is_active: parsed.data.isActive,
  };

  const query = parsed.data.id
    ? supabase.from('platform_plans').update(row).eq('id', parsed.data.id)
    : supabase.from('platform_plans').insert(row);
  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath('/superadmin/plans');
  return { success: true };
}

export async function updateUniversityStatusAction(payload: any) {
  const supabase = await createClient();
  await requireRole('super_admin');
  const parsed = universityStatusSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from('universities').update({ status: parsed.data.status }).eq('id', parsed.data.universityId);
  if (error) return { error: error.message };
  revalidatePath('/superadmin/universities');
  return { success: true };
}

export async function createUniversityAction(payload: any) {
  const supabase = await createClient();
  await requireRole('super_admin');

  const normalized = {
    ...payload,
    subdomain: slugifySubdomain(String(payload?.subdomain || payload?.name || '')),
  };
  const parsed = universitySchema.safeParse(normalized);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: created, error } = await supabase
    .from('universities')
    .insert({
      name: parsed.data.name,
      subdomain: parsed.data.subdomain,
      domain: parsed.data.domain || null,
      status: parsed.data.status,
    })
    .select('id,subdomain')
    .single();

  if (error) {
    if (error.code === '23505') return { error: 'That subdomain is already taken.' };
    return { error: error.message };
  }

  const url = tenantOrigin(created.subdomain, env.NEXT_PUBLIC_ROOT_DOMAIN);

  try {
    await sendUserInvite({
      email: parsed.data.adminEmail,
      role: 'admin',
      universityId: created.id,
      firstName: parsed.data.adminFirstName || undefined,
      lastName: parsed.data.adminLastName || undefined,
      baseUrl: url,
    });
  } catch (inviteError) {
    // A school with no reachable administrator is worse than no school at all,
    // so undo the tenant rather than leaving an orphan behind.
    await createAdminClient().from('universities').delete().eq('id', created.id);
    const message = inviteError instanceof Error ? inviteError.message : 'Failed to invite the school administrator.';
    return { error: `School was not created: ${message}` };
  }

  // A tenant with no faculty, department, session or term cannot publish a
  // single course, and an organisation that does not think in those terms
  // should not have to assemble them by hand. Failure here is not fatal: the
  // school and its administrator exist, and the structure can be created from
  // the admin dashboard.
  let structureWarning: string | undefined;
  try {
    await bootstrapAcademicStructure(createAdminClient() as any, created.id);
  } catch (bootstrapError) {
    structureWarning =
      bootstrapError instanceof Error ? bootstrapError.message : 'Could not create the default structure.';
  }

  revalidatePath('/superadmin/universities');
  return { success: true, url, structureWarning };
}

export async function updateUniversitySubscriptionAction(payload: any) {
  const supabase = await createClient();
  await requireRole('super_admin');
  const parsed = universitySubscriptionSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from('university_plan_subscriptions').upsert({
    university_id: parsed.data.universityId,
    plan_id: parsed.data.planId || null,
    status: parsed.data.status,
    current_period_start: new Date().toISOString(),
  }, { onConflict: 'university_id' });

  if (error) return { error: error.message };
  revalidatePath('/superadmin/billing');
  revalidatePath('/superadmin/universities');
  return { success: true };
}
