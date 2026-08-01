'use client'

import { SignIn } from '@clerk/nextjs'
import { Footer } from '@/components/footer'

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-4 text-zinc-100">
      <div className="flex flex-1 items-center justify-center py-12">
        <SignIn
          routing="hash"
          signUpUrl="/login"
          forceRedirectUrl="/dashboard"
        />
      </div>
      <div className="w-full max-w-md pb-6">
        <Footer />
      </div>
    </div>
  )
}
