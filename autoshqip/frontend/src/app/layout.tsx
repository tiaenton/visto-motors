import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AutoShqip — Makina të Përdorura në Shqipëri',
  description: 'Bli dhe shit makina të përdorura në Shqipëri. Mijëra njoftime nga dealerë të verifikuar.',
  keywords: 'makina, shqiperi, tirane, autoscout, merrjep, makina te perdorura',
  openGraph: {
    title: 'AutoShqip',
    description: 'Platforma nr.1 për makinat në Shqipëri',
    locale: 'sq_AL',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sq">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
