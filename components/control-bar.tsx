'use client'

import { useState } from 'react'
import { LogOut, Mic, MicOff, MessageSquare, Smile, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminActionsMenu } from '@/components/admin-actions-menu'

type ControlBarProps = {
  isMuted: boolean
  isAdmin: boolean
  onToggleMute: () => void
  onLeave: () => void
  onMuteEveryone: () => void
  onKickParticipant: () => void
  onSendReaction: (emoji: string) => void
  onToggleChat: () => void
  isChatOpen: boolean
  unreadChats?: number
}

const EMOJIS = ['👍', '✋', '❤️', '👏', '😂']

export function ControlBar({
  isMuted,
  isAdmin,
  onToggleMute,
  onLeave,
  onMuteEveryone,
  onKickParticipant,
  onSendReaction,
  onToggleChat,
  isChatOpen,
  unreadChats = 0,
}: ControlBarProps) {
  const [showEmojiMenu, setShowEmojiMenu] = useState(false)

  return (
    <div className="sticky bottom-0 z-20 border-t border-zinc-800 bg-black/95 py-5">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 px-4 sm:gap-4 sm:px-6 relative">
        
        {/* Toggle Chat */}
        <button
          type="button"
          onClick={onToggleChat}
          aria-label="Toggle chat"
          className={cn(
            'flex size-12 items-center justify-center rounded-full border transition-colors relative',
            isChatOpen
              ? 'border-white bg-white text-black'
              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white',
          )}
        >
          <MessageSquare className="size-5" />
          {!isChatOpen && unreadChats > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-white border-2 border-black text-black font-bold text-[9px] animate-pulse">
              {unreadChats}
            </span>
          )}
        </button>

        {/* Emoji Reactions Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiMenu(!showEmojiMenu)}
            aria-label="Send reaction"
            className={cn(
              'flex size-12 items-center justify-center rounded-full border transition-colors border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white',
              showEmojiMenu && 'border-zinc-600 text-white bg-zinc-800'
            )}
          >
            <Smile className="size-5" />
          </button>

          {showEmojiMenu && (
            <div className="absolute bottom-[calc(100%+0.75rem)] left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 p-2 shadow-2xl">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onSendReaction(emoji)
                    setShowEmojiMenu(false)
                  }}
                  className="flex size-10 items-center justify-center rounded-full text-xl hover:bg-zinc-800 transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-zinc-800" aria-hidden="true" />

        {/* Mute / Unmute */}
        <button
          type="button"
          onClick={onToggleMute}
          aria-pressed={isMuted}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={cn(
            'flex size-12 items-center justify-center rounded-full border transition-colors',
            isMuted
              ? 'border-zinc-800 bg-zinc-900 text-zinc-550 hover:border-zinc-700 hover:text-white'
              : 'border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-750',
          )}
        >
          {isMuted ? (
            <MicOff className="size-5" />
          ) : (
            <Mic className="size-5" />
          )}
        </button>

        <span className="hidden text-xs font-semibold text-zinc-450 sm:inline min-w-16">
          {isMuted ? 'Muted' : 'You are live'}
        </span>

        <div className="h-6 w-px bg-zinc-800" aria-hidden="true" />

        {/* Leave room */}
        <button
          type="button"
          onClick={onLeave}
          className="flex items-center gap-2 rounded-full border border-zinc-750 bg-zinc-900 hover:bg-zinc-800 px-6 py-3 text-sm font-semibold text-white transition-colors"
        >
          <LogOut className="size-4" />
          Leave
        </button>

        {/* Admin actions (Simplified list, co-hosts/admins menu) */}
        {isAdmin && (
          <div className="ml-1">
            <AdminActionsMenu
              onMuteEveryone={onMuteEveryone}
              onKickParticipant={onKickParticipant}
            />
          </div>
        )}
      </div>
    </div>
  )
}
