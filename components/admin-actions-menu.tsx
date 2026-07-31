'use client'

import { useEffect, useRef, useState } from 'react'
import { MicOff, Shield, UserX, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

type AdminActionsMenuProps = {
  onMuteEveryone: () => void
  onKickParticipant: () => void
}

export function AdminActionsMenu({
  onMuteEveryone,
  onKickParticipant,
}: AdminActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointer(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Admin actions"
        className={cn(
          'flex size-14 items-center justify-center rounded-full border transition-colors',
          open
            ? 'border-primary/40 bg-primary/15 text-primary'
            : 'border-border bg-card text-foreground hover:bg-accent',
        )}
      >
        <Shield className="size-6" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Admin actions"
          className="absolute bottom-[calc(100%+0.75rem)] right-0 z-30 w-60 origin-bottom-right overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-2xl shadow-black/40"
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <Shield className="size-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Admin Actions
            </span>
          </div>
          <div className="h-px bg-border" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onMuteEveryone()
              setOpen(false)
            }}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <VolumeX className="size-4" />
            </span>
            Mute Everyone
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onKickParticipant()
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
              <UserX className="size-4" />
            </span>
            Kick Participant
          </button>

          <div className="my-1 h-px bg-border" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onMuteEveryone()
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <MicOff className="size-4" />
            </span>
            Mute All Listeners
          </button>
        </div>
      )}
    </div>
  )
}
