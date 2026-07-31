'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, KeyRound, ArrowRight, Video, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code.')
      }

      setInfo(data.message || `Verification code sent to ${email}`)
      setStep('otp')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!otp || otp.trim().length < 6) {
      setError('Please enter the 6-digit verification code.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp, name })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed.')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-4 text-zinc-100">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-white">
            <Video className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Sign In
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Secure domain-restricted video conferencing
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-sm text-red-400">
            <AlertCircle className="size-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-sm text-emerald-400">
            <CheckCircle2 className="size-5 shrink-0" />
            <span>{info}</span>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="2400032717@kluniversity.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Only email addresses ending with <span className="text-zinc-300 font-mono">@kluniversity.in</span> are accepted.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Display Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black py-3 px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-white focus:ring-1 focus:ring-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? (
                <span>Sending Code...</span>
              ) : (
                <>
                  <span>Send Code</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Verification Code (OTP)
                </label>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-xs text-zinc-400 hover:text-white hover:underline"
                >
                  Change Email
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-zinc-800 bg-black py-3 pl-11 pr-4 text-center font-mono text-lg tracking-widest text-white placeholder-zinc-600 outline-none transition focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Check your inbox at <span className="text-zinc-300">{email}</span>.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
          </form>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 border-t border-zinc-800 pt-4">
          <ShieldCheck className="size-4" />
          <span>Security by Brevo &amp; MongoDB</span>
        </div>
      </div>
    </div>
  )
}
