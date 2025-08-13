import { AuthShell } from '@/components/layout/AuthShell'
import { SupabaseSignupStepper } from '@/components/auth/SupabaseSignupStepper'

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic'

export default function SignupWizardPage() {
  return (
    <AuthShell
      title="Crear Cuenta"
      subtitle="Complete el proceso de registro paso a paso"
    >
      <SupabaseSignupStepper />
    </AuthShell>
  )
}
