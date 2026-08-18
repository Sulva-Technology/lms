import { AuthLayout } from "@/components/auth/AuthLayout"
import { LoginForm } from "@/components/auth/LoginForm"
import { getTenantBrand } from "@/lib/tenant/brand"

export default async function LoginPage() {
  const brand = await getTenantBrand()

  return (
    <AuthLayout
      brand={brand ?? undefined}
      title="Welcome back"
      subtitle={
        brand
          ? `Sign in with the account ${brand.name} issued you.`
          : "Sign in to reach your courses, classes and results."
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}
