'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Video, ShieldAlert, Users, Globe, Plus, Copy, Check } from 'lucide-react'
import { Footer } from '@/components/footer'

export default function CreateMeetingPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [allowedDomains, setAllowedDomains] = useState('@kluniversity.in')
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
    <div className="min-h-dvh bg-black px-4 py-8 text-zinc-100">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="flex size-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-850 text-white">
              <Video className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Create Secure Meeting</h1>
              <p className="text-sm text-zinc-400">Set restrictions &amp; assign moderators</p>
            </div>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-zinc-700 bg-black p-4 text-sm text-red-400">
              <ShieldAlert className="size-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {createdMeeting ? (
            <div className="mt-6 space-y-6 rounded-xl border border-zinc-700 bg-zinc-850 p-6">
              <h3 className="text-lg font-bold text-white">Meeting Created Successfully</h3>

              <div className="space-y-4 rounded-xl bg-black p-4 border border-zinc-800">
                <div>
                  <p className="text-xs uppercase font-bold text-zinc-500">Meeting ID</p>
                  <p className="font-mono text-lg font-bold text-white">{createdMeeting.meetingId}</p>
                </div>
                
                <div>
                  <p className="text-xs uppercase font-bold text-zinc-500">Allowed Domains</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {createdMeeting.allowedDomains?.length > 0 ? (
                      createdMeeting.allowedDomains.map((d: string) => (
                        <span key={d} className="rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs font-mono text-zinc-300">
                          {d}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400">Any domain permitted</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={copyMeetingLink}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 py-3 font-medium text-white hover:bg-zinc-700 transition"
                >
                  {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  onClick={() => router.push(`/room/${createdMeeting.meetingId}`)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 font-bold text-black hover:bg-zinc-200 transition"
                >
                  <Video className="size-4" />
                  <span>Start Meeting</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Standup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black py-3 px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-white"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe className="size-4 text-zinc-400" />
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Allowed Email Domains
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="@kluniversity.in"
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black py-3 px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-white"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Separate with commas. Only matching email domains can join.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Users className="size-4 text-zinc-400" />
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Specific Allowed Emails (Optional)
                  </label>
                </div>
                <textarea
                  rows={2}
                  placeholder="alice@partner.com, bob@partner.com"
                  value={allowedEmails}
                  onChange={(e) => setAllowedEmails(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black py-3 px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-white"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Plus className="size-4 text-zinc-400" />
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Meeting Moderator Emails (Optional)
                  </label>
                </div>
                <textarea
                  rows={2}
                  placeholder="cohost@domain.com"
                  value={moderators}
                  onChange={(e) => setModerators(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black py-3 px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-bold text-black hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Meeting'}
              </button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
