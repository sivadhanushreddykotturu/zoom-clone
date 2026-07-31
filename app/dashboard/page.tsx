'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Video, Plus, LogOut, ArrowRight, ShieldCheck, Copy, Check, Users, Lock, Calendar } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [meetings, setMeetings] = useState<any[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/auth/me')
        if (!meRes.ok) {
          router.push('/login')
          return
        }
        const meData = await meRes.json()
        setUser(meData.user)

        const meetingsRes = await fetch('/api/meetings')
        if (meetingsRes.ok) {
          const mData = await meetingsRes.json()
          setMeetings(mData.meetings || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    let clean = joinCode.trim()
    if (clean.includes('/room/')) {
      clean = clean.split('/room/')[1]
    }
    router.push(`/room/${clean}`)
  }

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/room/${id}`
    navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Video className="size-5" />
            </div>
            <span className="font-bold tracking-tight text-white sm:text-lg">ZoomClone</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-white">{user?.name || user?.email?.split('@')[0]}</p>
              <p className="text-xs text-zinc-400">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        {/* Quick Action Banner */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Meeting Card */}
          <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-900 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30">
                <ShieldCheck className="size-3.5" />
                <span>Domain Restricted</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Host a Secure Meeting</h2>
              <p className="text-sm text-zinc-400">
                Specify allowed email domains (e.g. @gmail.com, @kluniversity.com) and assign meeting moderators.
              </p>
            </div>

            <Link
              href="/create-meeting"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
            >
              <Plus className="size-5" />
              <span>Create New Meeting</span>
            </Link>
          </div>

          {/* Join Meeting Card */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
                <Video className="size-3.5 text-indigo-400" />
                <span>Instant Join</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Join an Existing Meeting</h2>
              <p className="text-sm text-zinc-400">
                Enter a room code or meeting link to enter the video conference.
              </p>
            </div>

            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Enter Meeting ID (e.g. room-abc123)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-indigo-500"
              />
              <button
                type="submit"
                className="flex items-center justify-center rounded-2xl bg-zinc-800 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition"
              >
                <ArrowRight className="size-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Meetings List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Your Meetings</h3>
            <span className="text-xs text-zinc-400">{meetings.length} Total</span>
          </div>

          {meetings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
              <Calendar className="mx-auto size-8 mb-2 text-zinc-600" />
              <p className="text-sm">No active meetings yet. Click &quot;Create New Meeting&quot; above to get started!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {meetings.map((m) => (
                <div
                  key={m.meetingId}
                  className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-indigo-500/40 hover:bg-zinc-900"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                        {m.meetingId}
                      </span>
                      {m.hostEmail === user?.email && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          Host
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-white line-clamp-1">{m.title}</h4>

                    {m.allowedDomains?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {m.allowedDomains.map((d: string) => (
                          <span key={d} className="text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => copyLink(m.meetingId)}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
                    >
                      {copiedId === m.meetingId ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                      <span>{copiedId === m.meetingId ? 'Copied' : 'Share Link'}</span>
                    </button>

                    <Link
                      href={`/room/${m.meetingId}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                    >
                      <span>Join Room</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
