import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { PwaRegister } from '@/components/pwa-register'

import { ClerkProvider } from '@clerk/nextjs'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'ZoomClone — Secure Video Conferencing',
  description:
    'A premium, minimal black and white live audio and video meeting room protected by Clerk & MongoDB.',
  generator: 'v0.app',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#6366f1',
          colorBackground: '#09090b',
          colorText: '#ffffff',
          colorTextSecondary: '#a1a1aa',
          colorTextOnPrimaryBackground: '#ffffff',
        },
        elements: {
          card: 'border border-zinc-800 shadow-2xl rounded-2xl bg-zinc-900',
          footerActionLink: 'text-indigo-400 hover:text-indigo-300',
          formButtonPrimary: 'bg-white hover:bg-zinc-200 text-black font-semibold',
        }
      }}
    >
      <html
        lang="en"
        className={`dark bg-background ${geistSans.variable} ${geistMono.variable}`}
      >
        <body className="antialiased font-sans">
          {children}
          <PwaRegister />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
