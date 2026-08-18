import { AuthLayout } from "@/components/auth/AuthLayout"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"
import { getTenantBrand } from "@/lib/tenant/brand"

export default async function ResetPasswordPage() {
  const brand = await getTenantBrand()

  return (
    <AuthLayout
      brand={brand ?? undefined}
      title="Create a new password"
      subtitle="Choose something you have not used on this account before."
    >
      <ResetPasswordForm />
    </AuthLayout>
  )
}
