'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Video, ShieldAlert, Users, Globe, Plus, Copy, Check, Sparkles } from 'lucide-react'

export default function CreateMeetingPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [allowedDomains, setAllowedDomains] = useState('@gmail.com, @kluniversity.com')
  const [allowedEmails, setAllowedEmails] = useState('')
  const [moderators, setModerators] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdMeeting, setCreatedMeeting] = useState<any | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Meeting title is required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          allowedDomains,
          allowedEmails,
          moderators
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create meeting.')
      }

      setCreatedMeeting(data.meeting)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyMeetingLink = () => {
    if (!createdMeeting) return
    const link = `${window.location.origin}/room/${createdMeeting.meetingId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-dvh bg-zinc-950 px-4 py-8 text-zinc-100">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Video className="size-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Create Restricted Meeting</h1>
              <p className="text-sm text-zinc-400">Configure email domain access rules and moderators</p>
            </div>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
              <ShieldAlert className="size-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {createdMeeting ? (
            <div className="mt-6 space-y-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-300">
              <div className="flex items-center gap-3">
                <Sparkles className="size-6 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Meeting Created Successfully!</h3>
              </div>

              <div className="space-y-2 rounded-xl bg-zinc-950/80 p-4 border border-zinc-800">
                <p className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Meeting ID</p>
                <p className="font-mono text-lg font-bold text-indigo-400">{createdMeeting.meetingId}</p>
                
                <p className="pt-2 text-xs uppercase tracking-wider font-semibold text-zinc-400">Allowed Domains</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {createdMeeting.allowedDomains?.length > 0 ? (
                    createdMeeting.allowedDomains.map((d: string) => (
                      <span key={d} className="rounded-md bg-indigo-500/20 px-2.5 py-1 text-xs font-mono text-indigo-300 border border-indigo-500/30">
                        {d}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400">Any domain permitted</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={copyMeetingLink}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-800 py-3 font-medium text-white hover:bg-zinc-700 transition"
                >
                  {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Meeting Link'}</span>
                </button>

                <button
                  onClick={() => router.push(`/room/${createdMeeting.meetingId}`)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30"
                >
                  <Video className="size-4" />
                  <span>Start Meeting Now</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Review & Strategy Session"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 py-3 px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe className="size-4 text-indigo-400" />
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    Allowed Email Domains
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="@gmail.com, @kluniversity.com, .ac.uk"
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 py-3 px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Separate multiple domains with commas. Only users logged in with matching emails can join!
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Users className="size-4 text-indigo-400" />
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    Specific Allowed Participant Emails (Optional)
                  </label>
                </div>
                <textarea
                  rows={2}
                  placeholder="alice@external.com, bob@partner.org"
                  value={allowedEmails}
                  onChange={(e) => setAllowedEmails(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 py-3 px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Plus className="size-4 text-indigo-400" />
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    Meeting Moderator Emails (Optional)
                  </label>
                </div>
                <textarea
                  rows={2}
                  placeholder="cohost@domain.com, moderator@domain.com"
                  value={moderators}
                  onChange={(e) => setModerators(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 py-3 px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Moderators have access to Mute All, Selective Unmute, and Participant Kick controls.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 font-medium text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Creating Meeting...' : 'Create Meeting'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
