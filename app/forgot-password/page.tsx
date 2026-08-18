import { AuthLayout } from "@/components/auth/AuthLayout"
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"
import { getTenantBrand } from "@/lib/tenant/brand"

export default async function ForgotPasswordPage() {
  const brand = await getTenantBrand()

  return (
    <AuthLayout
      brand={brand ?? undefined}
      title="Reset your password"
      subtitle="Enter your email address and we will send you instructions to set a new one."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
