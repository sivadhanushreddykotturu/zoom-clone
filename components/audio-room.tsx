'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PARTICIPANTS, type Participant } from '@/lib/room-data'
import { RoomHeader } from '@/components/room-header'
import { ParticipantTile } from '@/components/participant-tile'
import { ControlBar } from '@/components/control-bar'

export function AudioRoom() {
  const [participants, setParticipants] = useState<Participant[]>(PARTICIPANTS)
  const [toast, setToast] = useState<string | null>(null)

  const self = participants.find((p) => p.isSelf)
  const isMuted = self?.isMuted ?? true
  const isAdmin = self?.isAdmin ?? false

  const speakers = useMemo(
    () => participants.filter((p) => p.isSpeaking).length,
    [participants],
  )

  const showToast = useCallback((message: string) => {
    setToast(message)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const toggleMute = useCallback(() => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.isSelf
          ? { ...p, isMuted: !p.isMuted, isSpeaking: p.isMuted ? false : false }
          : p,
      ),
    )
  }, [])

  const handleLeave = useCallback(() => {
    showToast('You left the room. See you next time!')
  }, [showToast])

  const handleMuteEveryone = useCallback(() => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.isSelf ? p : { ...p, isMuted: true, isSpeaking: false },
      ),
    )
    showToast('Everyone has been muted.')
  }, [showToast])

  const handleKickParticipant = useCallback(() => {
    setParticipants((prev) => {
      const kickable = prev.filter((p) => !p.isSelf && !p.isAdmin)
      if (kickable.length === 0) return prev
      const target = kickable[kickable.length - 1]
      showToast(`${target.name} was removed from the room.`)
      return prev.filter((p) => p.id !== target.id)
    })
  }, [showToast])

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <RoomHeader participantCount={participants.length} />

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
