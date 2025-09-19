import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics - TechJobs',
  description: 'Track your interview success metrics and career progression insights.',
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children
}
