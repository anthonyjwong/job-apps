import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Job Discovery - TechJobs',
  description: 'Discover AI-classified job opportunities tailored to your interview success likelihood.',
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children
}
