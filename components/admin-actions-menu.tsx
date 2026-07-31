'use client'

import { useEffect, useRef, useState } from 'react'
import { Shield, UserX, VolumeX } from 'lucide-react'
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
          'flex size-12 items-center justify-center rounded-full border transition-colors',
          open
            ? 'border-white bg-white text-black'
            : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white',
        )}
      >
        <Shield className="size-5" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Admin actions"
          className="absolute bottom-[calc(100%+0.75rem)] right-0 z-30 w-52 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl"
        >
          <div className="flex items-center gap-2 px-3 py-2 text-zinc-450 border-b border-zinc-800">
            <Shield className="size-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Host Actions
            </span>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onMuteEveryone()
              setOpen(false)
            }}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <VolumeX className="size-4" />
            <span>Mute Everyone</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onKickParticipant()
              setOpen(false)
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
          >
            <UserX className="size-4" />
            <span>Kick Participant</span>
          </button>
        </div>
      )}
    </div>
  )
}
