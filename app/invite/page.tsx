import { AuthLayout } from "@/components/auth/AuthLayout"
import { InviteAcceptanceUI } from "@/components/auth/InviteAcceptanceUI"
import { getTenantBrand } from "@/lib/tenant/brand"

export default async function InvitePage() {
  const brand = await getTenantBrand()

  return (
    <AuthLayout
      brand={brand ?? undefined}
      title="You have been invited"
      subtitle={
        brand ? `Join ${brand.name} on its learning portal.` : "Join your institution's portal."
      }
    >
      <InviteAcceptanceUI />
    </AuthLayout>
  )
}
