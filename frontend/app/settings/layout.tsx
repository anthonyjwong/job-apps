import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings - TechJobs',
  description: 'Customize your profile and application preferences.',
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
