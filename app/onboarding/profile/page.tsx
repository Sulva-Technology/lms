import { ProfileSetupForm } from "@/components/auth/ProfileSetupForm"
import { getRoleRedirectPath } from "@/lib/auth/redirects"
import { normalizeRoleParam } from "@/lib/auth/roles"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role) {
    redirect(getRoleRedirectPath(profile.role as any))
  }

  const assignedRole = normalizeRoleParam(user.user_metadata?.role)
  const universityId = user.user_metadata?.university_id as string | undefined
  let universityName: string | null = null

  if (universityId) {
    const { data: university } = await adminClient
      .from("universities")
      .select("name")
      .eq("id", universityId)
      .maybeSingle()

    universityName = university?.name ?? null
  }

  const inviteError = !assignedRole
    ? "This invite is missing secure role metadata. Ask an administrator to resend it."
    : assignedRole !== "super_admin" && !universityId
      ? "This invite is missing a university assignment. Ask an administrator to resend it."
      : null

  return (
    <ProfileSetupForm
      assignedRole={assignedRole}
      universityName={universityName}
      email={user.email}
      initialFirstName={user.user_metadata?.first_name}
      initialLastName={user.user_metadata?.last_name}
      inviteError={inviteError}
    />
  )
}
