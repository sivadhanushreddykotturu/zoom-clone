'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Mic, MicOff, MonitorOff, ExternalLink, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Participant } from '@/lib/room-data'

function MiniVoiceBars() {
  return (
    <span className="flex items-end gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="voice-bar h-2.5 w-0.5 rounded-full bg-emerald-400"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  )
}

interface FloatingPresenterProps {
  participants: (Participant & { isAway?: boolean })[]
  isScreenSharing: boolean
  isMuted: boolean
  onToggleMute: () => void
  onStopScreenshare: () => void
  meetingTitle?: string
}

export function FloatingPresenter({
  participants,
  isScreenSharing,
  isMuted,
  onToggleMute,
  onStopScreenshare,
  meetingTitle,
}: FloatingPresenterProps) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const [isPipActive, setIsPipActive] = useState(false)

  // Function to open native Document Picture-in-Picture window (Chrome/Edge desktop)
  const openDocumentPip = async () => {
    if (typeof window === 'undefined' || !('documentPictureInPicture' in window)) return

    try {
      if (pipWindow) {
        pipWindow.close()
      }

      const win = await (window as any).documentPictureInPicture.requestWindow({
        width: 360,
        height: 280,
      })

      // Copy all style tags & stylesheets into the PiP window so Tailwind works seamlessly
      Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).forEach((style) => {
        win.document.head.appendChild(style.cloneNode(true))
      })

      // Add dark background to PiP document
      win.document.body.className = 'bg-black text-white font-sans antialiased m-0 p-0 overflow-hidden'

      win.addEventListener('pagehide', () => {
        setPipWindow(null)
        setIsPipActive(false)
      })

      setPipWindow(win)
      setIsPipActive(true)
    } catch (err) {
      console.warn('Document Picture-in-Picture failed:', err)
    }
  }

  // Auto-trigger PiP when starting screenshare on desktop if supported
  useEffect(() => {
    if (isScreenSharing && typeof window !== 'undefined' && 'documentPictureInPicture' in window && !pipWindow) {
      openDocumentPip()
    } else if (!isScreenSharing && pipWindow) {
      try {
        pipWindow.close()
      } catch (e) {
        // Window already closed
      }
      setPipWindow(null)
      setIsPipActive(false)
    }
  }, [isScreenSharing])

  if (!isScreenSharing) return null

  const activeSpeaker = participants.find((p) => p.isSpeaking && !p.isAway)

  const presenterContent = (
    <div className="flex flex-col h-full bg-zinc-950 text-white p-3 border border-zinc-800 rounded-2xl shadow-2xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex size-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex size-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2.5 bg-red-500" />
          </span>
          <span className="text-xs font-bold text-zinc-200 tracking-tight truncate">
            {meetingTitle || 'Sharing Screen'}
          </span>
        </div>

        {!isPipActive && typeof window !== 'undefined' && 'documentPictureInPicture' in window && (
          <button
            onClick={openDocumentPip}
            className="flex items-center gap-1 text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded-md transition shrink-0 ml-2"
            title="Pop out floating OS window over all apps"
          >
            <ExternalLink className="size-3" /> Pop Out
          </button>
        )}
      </div>

      {/* Speaking Status Banner */}
      {activeSpeaker && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1.5 text-xs text-emerald-300">
          <div className="flex items-center gap-1.5 truncate">
            <Volume2 className="size-3.5 text-emerald-400 shrink-0" />
            <span className="truncate font-semibold text-[11px]">
              {activeSpeaker.isSelf ? 'You are speaking' : `${activeSpeaker.name} is speaking`}
            </span>
          </div>
          <MiniVoiceBars />
        </div>
      )}

      {/* Participant Avatar Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 py-1 hide-scrollbar">
        <div className="grid grid-cols-4 gap-2 justify-items-center">
          {participants.map((p) => {
            const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(p.id || p.name)}`
            return (
              <div key={p.id} className="flex flex-col items-center gap-1 relative group">
                <div
                  className={cn(
                    'relative rounded-full p-[2px] transition-all duration-300',
                    p.isSpeaking && !p.isAway
                      ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-black scale-105'
                      : 'ring-1 ring-zinc-800',
                    p.isAway && 'opacity-40'
                  )}
                >
                  <div className="size-9 overflow-hidden rounded-full bg-zinc-900 border border-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl} alt={p.name} className="size-full object-cover" />
                  </div>

                  {/* Speaking indicator badge */}
                  {p.isSpeaking && !p.isAway && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-black shadow-md">
                      <MiniVoiceBars />
                    </span>
                  )}

                  {/* Muted indicator */}
                  {!p.isSpeaking && p.isMuted && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-red-400 shadow-sm">
                      <MicOff className="size-2" />
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-medium text-zinc-300 truncate max-w-[55px] text-center">
                  {p.isSelf ? 'You' : p.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Presenter Controls */}
      <div className="mt-2 pt-2 border-t border-zinc-850 flex items-center justify-center gap-2.5">
        <button
          onClick={onToggleMute}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-md',
            isMuted
              ? 'bg-red-600/90 hover:bg-red-600 text-white'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
          )}
        >
          {isMuted ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <button
          onClick={onStopScreenshare}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-950 border border-red-800 text-red-300 hover:bg-red-900 transition shadow-md"
        >
          <MonitorOff className="size-3.5" />
          <span>Stop Sharing</span>
        </button>
      </div>
    </div>
  )

  // If PiP is active, render via Portal into the PiP window's body
  if (isPipActive && pipWindow) {
    return createPortal(presenterContent, pipWindow.document.body)
  }

  // Fallback / In-page floating widget in bottom-right corner for laptop
  return (
    <div className="fixed bottom-24 right-6 z-50 w-72 h-60 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      {presenterContent}
    </div>
  )
}
