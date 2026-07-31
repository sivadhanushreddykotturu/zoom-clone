'use client'

import { LogOut, Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminActionsMenu } from '@/components/admin-actions-menu'

type ControlBarProps = {
  isMuted: boolean
  isAdmin: boolean
  onToggleMute: () => void
  onLeave: () => void
  onMuteEveryone: () => void
  onKickParticipant: () => void
}

export function ControlBar({
  isMuted,
  isAdmin,
  onToggleMute,
  onLeave,
  onMuteEveryone,
  onKickParticipant,
}: ControlBarProps) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 px-4 py-5 sm:gap-4 sm:px-6">
        {/* Mute / Unmute */}
        <button
          type="button"
          onClick={onToggleMute}
          aria-pressed={isMuted}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={cn(
            'flex size-14 items-center justify-center rounded-full border transition-colors',
            isMuted
              ? 'border-border bg-card text-muted-foreground hover:bg-accent'
              : 'border-primary/40 bg-primary/15 text-primary hover:bg-primary/25',
          )}
        >
          {isMuted ? (
            <MicOff className="size-6" />
          ) : (
            <Mic className="size-6" />
          )}
        </button>

        <span className="hidden text-sm text-muted-foreground sm:inline">
          {isMuted ? 'Your mic is off' : 'You are live'}
        </span>

        <div className="mx-1 h-8 w-px bg-border" aria-hidden="true" />

        {/* Leave room */}
        <button
          type="button"
          onClick={onLeave}
          className="flex items-center gap-2 rounded-full bg-destructive px-6 py-4 text-sm font-semibold text-destructive-foreground shadow-lg shadow-destructive/20 transition-colors hover:brightness-110"
        >
          <LogOut className="size-5" />
          Leave
        </button>

        {/* Admin actions */}
        {isAdmin && (
          <AdminActionsMenu
            onMuteEveryone={onMuteEveryone}
            onKickParticipant={onKickParticipant}
          />
        )}
      </div>
    </div>
  )
}
