import { AuthLayout } from "@/components/auth/AuthLayout"
import { VerificationSuccessUI } from "@/components/auth/VerificationSuccessUI"
import { getTenantBrand } from "@/lib/tenant/brand"

export default async function VerifyPage() {
  const brand = await getTenantBrand()

  return (
    <AuthLayout
      brand={brand ?? undefined}
      title="Verification"
      subtitle="Your account setup is almost complete."
    >
      <VerificationSuccessUI />
    </AuthLayout>
  )
}
