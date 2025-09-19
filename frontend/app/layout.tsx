import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Header } from '../components/Header'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'TechJobs - AI-Powered Job Search',
  description: 'Land more interviews with AI-powered job classification and strategic career guidance',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies();
  const theme = (cookieStore.get('theme')?.value as 'light' | 'dark' | undefined) ?? undefined;
  const htmlClass = theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : undefined;
  return (
    <html lang="en" className={htmlClass}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}