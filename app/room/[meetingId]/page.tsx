'use client'

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  Track,
  ParticipantEvent,
} from 'livekit-client'
import { RoomHeader } from '@/components/room-header'
import { ParticipantTile } from '@/components/participant-tile'
import { ControlBar } from '@/components/control-bar'
import type { Participant as UiParticipant } from '@/lib/room-data'
import { Lock, MailCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Convert a LiveKit participant to our UI participant shape
function toUiParticipant(
  p: Participant,
  selfIdentity: string,
  moderators: string[],
): UiParticipant {
  const isSelf = p.identity === selfIdentity
  const isAdmin = isSelf
    ? moderators.includes(selfIdentity)
    : moderators.includes(p.identity)

  // Check audio track publication to see if muted
  let isMuted = true
  let isSpeaking = p.isSpeaking ?? false
  for (const pub of p.trackPublications.values()) {
    if (pub.kind === Track.Kind.Audio) {
      isMuted = pub.isMuted ?? true
      break
    }
  }

  return {
    id: p.identity,
    name: p.name || p.identity,
    avatar: `/avatars/avatar-${Math.abs(hashStr(p.identity) % 8) + 1}.png`,
    isAdmin,
    isSpeaking,
    isMuted,
    isSelf,
  }
}

function hashStr(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0
  }
  return hash
}

export default function RoomPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState<{ allowedDomains: string[] } | null>(null)
  const [connected, setConnected] = useState(false)

  const [selfIdentity, setSelfIdentity] = useState('')
  const [moderators, setModerators] = useState<string[]>([])
  const [participants, setParticipants] = useState<UiParticipant[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const roomRef = useRef<Room | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // Build UI participants from LiveKit room state
  const rebuildParticipants = useCallback(
    (room: Room, identity: string, mods: string[]) => {
      const all: UiParticipant[] = []
      if (room.localParticipant) {
        all.push(toUiParticipant(room.localParticipant, identity, mods))
      }
      for (const p of room.remoteParticipants.values()) {
        all.push(toUiParticipant(p, identity, mods))
      }
      setParticipants(all)
    },
    [],
  )

  useEffect(() => {
    let cancelled = false

    async function connect() {
      try {
        // Fetch token + meeting info
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId }),
        })
        const data = await res.json()

        if (!res.ok) {
          if (res.status === 401) {
            router.push(`/login?redirect=/room/${meetingId}`)
            return
          }
          if (res.status === 403) {
            setAccessDenied({ allowedDomains: data.allowedDomains || [] })
          }
          setError(data.error || 'Could not join meeting.')
          setLoading(false)
          return
        }

        const { token, serverUrl, isModerator, isHost } = data
        const identity = data.user?.email || ''
        const mods: string[] = data.moderators || []

        setSelfIdentity(identity)
        setModerators(mods)

        const livekitRoom = new Room()
        roomRef.current = livekitRoom

        // Wire events
        const refresh = () => rebuildParticipants(livekitRoom, identity, mods)

        livekitRoom
          .on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
            p.on(ParticipantEvent.IsSpeakingChanged, refresh)
            p.on(ParticipantEvent.TrackMuted, refresh)
            p.on(ParticipantEvent.TrackUnmuted, refresh)
            refresh()
          })
          .on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
            showToast(`${p.name || p.identity} left the room.`)
            refresh()
          })
          .on(RoomEvent.TrackMuted, refresh)
          .on(RoomEvent.TrackUnmuted, refresh)
          .on(RoomEvent.ActiveSpeakersChanged, refresh)
          .on(RoomEvent.LocalTrackPublished, refresh)
          .on(RoomEvent.LocalTrackUnpublished, refresh)
          .on(RoomEvent.Disconnected, () => {
            if (!cancelled) {
              showToast('You left the room. See you next time!')
              setConnected(false)
            }
          })

        await livekitRoom.connect(serverUrl, token, {
          autoSubscribe: true,
        })

        if (cancelled) {
          await livekitRoom.disconnect()
          return
        }

        await livekitRoom.localParticipant.setMicrophoneEnabled(false)

        setConnected(true)
        setLoading(false)
        refresh()
      } catch (err: any) {
        if (!cancelled) {
          console.error('Room connection error:', err)
          setError(err.message || 'Failed to connect to meeting.')
          setLoading(false)
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      roomRef.current?.disconnect()
    }
  }, [meetingId, router, rebuildParticipants, showToast])

  const self = participants.find((p) => p.isSelf)
  const isMuted = self?.isMuted ?? true
  const isAdmin = self?.isAdmin ?? false

  const speakers = useMemo(
    () => participants.filter((p) => p.isSpeaking).length,
    [participants],
  )

  const toggleMute = useCallback(async () => {
    const room = roomRef.current
    if (!room) return
    const enabled = room.localParticipant.isMicrophoneEnabled
    await room.localParticipant.setMicrophoneEnabled(!enabled)
    setParticipants((prev) =>
      prev.map((p) =>
        p.isSelf ? { ...p, isMuted: enabled, isSpeaking: false } : p,
      ),
    )
  }, [])

  const handleLeave = useCallback(async () => {
    await roomRef.current?.disconnect()
    showToast('You left the room. See you next time!')
    router.push('/dashboard')
  }, [showToast, router])

  const handleMuteEveryone = useCallback(async () => {
    try {
      const res = await fetch('/api/livekit/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, action: 'mute-all' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Everyone has been muted.')
    } catch (err: any) {
      showToast(err.message || 'Failed to mute everyone.')
    }
  }, [meetingId, showToast])

  const handleKickParticipant = useCallback(async () => {
    const nonAdmins = participants.filter((p) => !p.isSelf && !p.isAdmin)
    if (nonAdmins.length === 0) {
      showToast('No participants to remove.')
      return
    }
    const target = nonAdmins[nonAdmins.length - 1]
    try {
      const res = await fetch('/api/livekit/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, action: 'kick-user', targetIdentity: target.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`${target.name} was removed from the room.`)
    } catch (err: any) {
      showToast(err.message || 'Failed to remove participant.')
    }
  }, [meetingId, participants, showToast])

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verifying access &amp; connecting…</p>
        </div>
      </div>
    )
  }

  // --- Access denied / error ---
  if (error || accessDenied) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <Lock className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error || 'You are not authorized to join this meeting.'}</p>
          </div>
          {accessDenied && accessDenied.allowedDomains.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-left">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <MailCheck className="size-4 text-primary" /> Allowed Domains
              </p>
              <div className="flex flex-wrap gap-1.5">
                {accessDenied.allowedDomains.map((d) => (
                  <span key={d} className="rounded-md bg-primary/15 px-2.5 py-1 text-xs font-mono text-primary">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent transition"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // --- Room UI (original design preserved) ---
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <RoomHeader participantCount={participants.length} meetingId={meetingId} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          <h2 className="text-sm font-medium text-muted-foreground">
            {speakers > 0
              ? `${speakers} ${speakers === 1 ? 'person is' : 'people are'} speaking`
              : 'On stage'}
          </h2>
        </div>

        <ul className="grid grid-cols-3 justify-items-center gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-y-10 md:grid-cols-5 lg:grid-cols-6">
          {participants.map((participant) => (
            <li key={participant.id}>
              <ParticipantTile participant={participant} />
            </li>
          ))}
        </ul>
      </main>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex justify-center px-4"
        >
          <div className="rounded-full border border-border bg-popover px-4 py-2.5 text-sm font-medium text-popover-foreground shadow-2xl shadow-black/40">
            {toast}
          </div>
        </div>
      )}

      <ControlBar
        isMuted={isMuted}
        isAdmin={isAdmin}
        onToggleMute={toggleMute}
        onLeave={handleLeave}
        onMuteEveryone={handleMuteEveryone}
        onKickParticipant={handleKickParticipant}
      />
    </div>
  )
}
