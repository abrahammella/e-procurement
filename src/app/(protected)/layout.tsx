'use client'

import { DashboardShell } from '@/components/layout/DashboardShell'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell>{children}</DashboardShell>
}
