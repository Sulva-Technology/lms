"use server";

import { requireRole, requireUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { clearTenantCache } from "@/lib/tenant/resolve";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const studentSettingsSchema = z.object({
  displayName: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  themeDensity: z.enum(["comfortable", "compact"]).optional(),
});

const lecturerSettingsSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  officeHours: z.string().optional(),
  defaultLiveDuration: z.coerce.number().int().min(15).max(240).default(60),
  emailNotifications: z.boolean().default(true),
  quizPublishReview: z.boolean().default(true),
  gradingTurnaroundDays: z.coerce.number().int().min(1).max(30).default(7),
});

const universitySettingsSchema = z.object({
  // Chooses the wording the whole app reads in for this tenant.
  vocabulary: z.enum(["academic", "organization"]).default("academic"),
  timezone: z.string().optional(),
  gradingScale: z.string().optional(),
  registrationPolicy: z.string().optional(),
  supportEmail: z.string().email().optional().or(z.literal("")),
});

// Colours are stored as the admin picked them; the derivation to a readable
// palette happens at render time, so a brand that fails contrast today can be
// re-derived by a change to the engine rather than a migration of stored data.
const HEX_COLOR = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^#[0-9a-f]{6}$/, "Use a six-digit hex colour, for example #690dab.");

const schoolBrandingSchema = z.object({
  primaryColor: HEX_COLOR.nullable().optional(),
  secondaryColor: HEX_COLOR.nullable().optional(),
});

const platformSettingSchema = z.object({
  key: z.string().min(2).regex(/^[a-z0-9_.-]+$/i, "Use letters, numbers, dots, dashes, or underscores."),
  description: z.string().optional(),
  value: z.string().min(1, "Enter a JSON value."),
});

const supportTicketStatusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["open", "pending", "resolved", "closed"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
});

export async function updateStudentSettingsAction(payload: unknown) {
  const adminClient = createAdminClient();
  const session = await requireUser();
  const parsed = studentSettingsSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await adminClient
    .from("profiles")
    .update({ preferences: parsed.data })
    .eq("id", session.user.id);
  if (error) return { error: error.message };
  revalidatePath("/student/settings");
  return { success: true };
}

export async function updateLecturerSettingsAction(payload: unknown) {
  const adminClient = createAdminClient();
  const session = await requireRole("lecturer");
  const parsed = lecturerSettingsSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const preferences = {
    officeHours: parsed.data.officeHours || "",
    defaultLiveDuration: parsed.data.defaultLiveDuration,
    emailNotifications: parsed.data.emailNotifications,
    quizPublishReview: parsed.data.quizPublishReview,
    gradingTurnaroundDays: parsed.data.gradingTurnaroundDays,
  };

  const { error } = await adminClient
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      avatar_url: parsed.data.avatarUrl || null,
      preferences,
    })
    .eq("id", session.user.id);

  if (error) return { error: error.message };
  revalidatePath("/lecturer/settings");
  return { success: true };
}

export async function updateUniversitySettingsAction(payload: unknown) {
  const supabase = await createClient();
  const session = await requireRole("department_admin");
  const parsed = universitySettingsSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("university_settings").upsert({
    university_id: session.universityId,
    settings: parsed.data,
    updated_at: new Date().toISOString(),
  }, { onConflict: "university_id" });
  if (error) return { error: error.message };
  revalidatePath("/admin/settings", "layout");
  return { success: true };
}

/**
 * A school admin sets the two accents their institution is rendered in.
 *
 * Written with the admin client because RLS on `universities` is super-admin
 * only and Postgres row policies cannot restrict which columns an update
 * touches — the guard is the role check plus the fact that only these two
 * columns and the caller's own university are ever named here.
 */
export async function updateSchoolBrandingAction(payload: unknown) {
  const session = await requireRole("department_admin");
  const parsed = schoolBrandingSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const universityId = session.universityId;
  if (!universityId) return { error: "Your account is not attached to an institution." };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("universities")
    .update({
      primary_color: parsed.data.primaryColor ?? null,
      secondary_color: parsed.data.secondaryColor ?? null,
    })
    .eq("id", universityId);

  if (error) return { error: error.message };

  // Middleware caches the tenant row for a minute; dropping it here means the
  // admin sees their own change on the next request rather than after the TTL.
  clearTenantCache();
  revalidatePath("/", "layout");
  return { success: true };
}

export async function upsertPlatformSettingAction(payload: unknown) {
  const supabase = await createClient();
  const session = await requireRole("super_admin");
  const parsed = platformSettingSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let value: unknown;
  try {
    value = JSON.parse(parsed.data.value);
  } catch {
    return { error: "Setting value must be valid JSON." };
  }

  const { error } = await supabase.from("platform_settings").upsert({
    key: parsed.data.key,
    value,
    description: parsed.data.description || null,
    updated_by: session.user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });

  if (error) return { error: error.message };
  revalidatePath("/superadmin/settings");
  return { success: true };
}

export async function updateSupportTicketStatusAction(payload: unknown) {
  const supabase = await createClient();
  await requireRole("super_admin");
  const parsed = supportTicketStatusSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from("support_tickets")
    .update({ status: parsed.data.status, priority: parsed.data.priority })
    .eq("id", parsed.data.ticketId);

  if (error) return { error: error.message };
  revalidatePath("/superadmin/support");
  return { success: true };
}
