import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-geist-sans',
})

export const metadata: Metadata = {
  title: 'Hodnotové zrcadlo | inspiraise',
  description: 'AI diagnostika tvých hodnot, silných stránek a talentů.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
