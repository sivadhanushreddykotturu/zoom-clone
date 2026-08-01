'use client'

import { SignIn } from '@clerk/nextjs'
import { Video, ShieldCheck } from 'lucide-react'
import { Footer } from '@/components/footer'

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-4 text-zinc-100">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-white">
            <Video className="size-6 text-indigo-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Sign In to ZoomClone
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Secure, premium domain-restricted video conferencing
          </p>
        </div>

        <div className="flex justify-center">
          <SignIn
            routing="hash"
            signUpUrl="/login"
            forceRedirectUrl="/dashboard"
          />
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 border-t border-zinc-900 pt-4">
          <ShieldCheck className="size-4 text-emerald-500" />
          <span>Security by Clerk &amp; MongoDB</span>
        </div>
      </div>
      <div className="mt-6 w-full max-w-md">
        <Footer />
      </div>
    </div>
  )
}
