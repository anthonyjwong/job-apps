import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Applications - TechJobs',
  description: 'Manage your job applications, interviews, and assessments.',
}

export default function ApplicationsLayout({ children }: { children: React.ReactNode }) {
  return children
}
