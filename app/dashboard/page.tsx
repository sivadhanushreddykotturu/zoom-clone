'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Video, Plus, LogOut, ArrowRight, ShieldCheck, Copy, Check, Calendar, Trash2, QrCode } from 'lucide-react'
import { Footer } from '@/components/footer'
import { QRCodeModal } from '@/components/qr-code-modal'

import { useClerk, UserButton } from '@clerk/nextjs'

export default function DashboardPage() {
  const router = useRouter()
  const { signOut } = useClerk()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [meetings, setMeetings] = useState<any[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedQrMeeting, setSelectedQrMeeting] = useState<{ meetingId: string; title: string } | null>(null)

  const loadData = async () => {
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

  useEffect(() => {
    loadData()
  }, [])

  const handleLogout = async () => {
    await signOut(() => router.push('/login'))
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

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return
    setActionError(null)
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete meeting')
      }
      // Reload meetings list
      setMeetings((prev) => prev.filter((m) => m.meetingId !== id))
    } catch (err: any) {
      setActionError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
          <p className="text-sm font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-black text-zinc-100">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-850 text-white">
              <Video className="size-5" />
            </div>
            <span className="font-bold tracking-tight text-white sm:text-lg">ZoomClone</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-white">{user?.name || user?.email?.split('@')[0]}</p>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        {actionError && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-red-400">
            {actionError}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Meeting Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-850 px-3 py-1 text-xs font-medium text-white">
                <ShieldCheck className="size-3.5" />
                <span>{user?.canCreateMeeting === false ? 'Authorized Hosts Only' : 'Domain Restricted'}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Host Secure Meeting</h2>
              <p className="text-sm text-zinc-400">
                {user?.canCreateMeeting === false
                  ? 'Meeting creation is restricted to authorized host accounts to conserve LiveKit credits. You can join existing meetings below.'
                  : 'Specify allowed email domains (e.g. @kluniversity.in) and assign moderators.'}
              </p>
            </div>

            {user?.canCreateMeeting === false ? (
              <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-3.5 text-xs font-medium text-zinc-500 cursor-not-allowed">
                <span>Creation Restricted to Admin</span>
              </div>
            ) : (
              <Link
                href="/create-meeting"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-black hover:bg-zinc-200 transition"
              >
                <Plus className="size-5" />
                <span>Create New Meeting</span>
              </Link>
            )}
          </div>

          {/* Join Meeting Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-850 px-3 py-1 text-xs font-medium text-white">
                <Video className="size-3.5" />
                <span>Instant Join</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Join Meeting</h2>
              <p className="text-sm text-zinc-400">
                Enter room ID or paste meeting link.
              </p>
            </div>

            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Enter Meeting ID (e.g. room-abc123)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder-zinc-550 outline-none transition focus:border-white"
              />
              <button
                type="submit"
                className="flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition"
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
            <span className="text-xs text-zinc-450">{meetings.length} Total</span>
          </div>

          {meetings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
              <Calendar className="mx-auto size-8 mb-2" />
              <p className="text-sm">No active meetings yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {meetings.map((m) => (
                <div
                  key={m.meetingId}
                  className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-zinc-300 bg-zinc-850 px-2 py-0.5 rounded border border-zinc-750">
                        {m.meetingId}
                      </span>
                      {m.hostEmail === user?.email && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 bg-zinc-850 px-2 py-0.5 rounded border border-zinc-750">
                            Host
                          </span>
                          <button
                            onClick={() => handleDeleteMeeting(m.meetingId)}
                            className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-850 transition"
                            title="Delete meeting"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h4 className="font-semibold text-white truncate">{m.title}</h4>

                    {m.allowedDomains?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {m.allowedDomains.map((d: string) => (
                          <span key={d} className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => copyLink(m.meetingId)}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
                      >
                        {copiedId === m.meetingId ? <Check className="size-3.5 text-emerald-450" /> : <Copy className="size-3.5" />}
                        <span>{copiedId === m.meetingId ? 'Copied' : 'Share'}</span>
                      </button>

                      <button
                        onClick={() => setSelectedQrMeeting({ meetingId: m.meetingId, title: m.title })}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition"
                        title="View QR Code"
                      >
                        <QrCode className="size-3.5" />
                        <span>QR</span>
                      </button>
                    </div>

                    <Link
                      href={`/room/${m.meetingId}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-white hover:underline transition"
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

      {selectedQrMeeting && (
        <QRCodeModal
          isOpen={!!selectedQrMeeting}
          onClose={() => setSelectedQrMeeting(null)}
          meetingId={selectedQrMeeting.meetingId}
          title={selectedQrMeeting.title}
        />
      )}

      <Footer />
    </div>
  )
}
