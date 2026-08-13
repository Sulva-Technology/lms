'use server'

import { requireRole } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
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
  domain: z.string().min(2).optional().or(z.literal('')),
  status: z.enum(['active', 'trialing', 'suspended', 'archived']).default('trialing'),
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
  const parsed = universitySchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from('universities').insert({
    name: parsed.data.name,
    domain: parsed.data.domain || null,
    status: parsed.data.status,
  });
  if (error) return { error: error.message };
  revalidatePath('/superadmin/universities');
  return { success: true };
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
