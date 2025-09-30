import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Header } from '../components/Header';
import { ThemeProvider } from '../components/ThemeProvider';
import '../styles/globals.css';

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
  const themeCookie = (cookieStore.get('theme')?.value as 'light' | 'dark' | undefined) ?? undefined;
  const htmlClass = themeCookie === 'dark' ? 'dark' : themeCookie === 'light' ? 'light' : undefined;
  return (
    <html lang="en" className={htmlClass}>
      <body>
        <ThemeProvider initialTheme={themeCookie ?? 'dark'}>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}