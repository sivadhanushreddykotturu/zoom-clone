'use client'

import { useState } from 'react'
import { LogOut, Mic, MicOff, MessageSquare, Smile, ShieldAlert, Monitor } from 'lucide-react'
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
  isHost?: boolean
  onEndMeeting?: () => void
  isScreenSharing?: boolean
  onToggleScreenshare?: () => void
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
  isHost = false,
  onEndMeeting,
  isScreenSharing = false,
  onToggleScreenshare,
}: ControlBarProps) {
  const [showEmojiMenu, setShowEmojiMenu] = useState(false)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-black/95 py-3 pb-safe-bottom">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-1.5 px-2 sm:gap-4 sm:px-6 relative">
        
        {/* Toggle Chat */}
        <button
          type="button"
          onClick={onToggleChat}
          aria-label="Toggle chat"
          className={cn(
            'flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-full border transition-colors relative',
            isChatOpen
              ? 'border-white bg-white text-black'
              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white',
          )}
        >
          <MessageSquare className="size-4 sm:size-4.5" />
          {!isChatOpen && unreadChats > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-white border border-black text-black font-bold text-[8px] sm:text-[9px] animate-pulse">
              {unreadChats > 9 ? '9+' : unreadChats}
            </span>
          )}
        </button>

        {/* Emoji Reactions Picker */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowEmojiMenu(!showEmojiMenu)}
            aria-label="Send reaction"
            className={cn(
              'flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-full border transition-colors border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white',
              showEmojiMenu && 'border-zinc-600 text-white bg-zinc-800'
            )}
          >
            <Smile className="size-4 sm:size-4.5" />
          </button>

          {showEmojiMenu && (
            <div className="absolute bottom-[calc(100%+0.75rem)] left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onSendReaction(emoji)
                    setShowEmojiMenu(false)
                  }}
                  className="flex size-7.5 sm:size-9 items-center justify-center rounded-full text-lg hover:bg-zinc-800 transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Screenshare Button integrated directly into bar for responsive layout */}
        {onToggleScreenshare && (
          <button
            type="button"
            onClick={onToggleScreenshare}
            className={cn(
              'flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-full border transition-colors',
              isScreenSharing
                ? 'border-red-500 bg-red-950 text-red-400'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white',
            )}
            title="Share Screen"
          >
            <Monitor className="size-4 sm:size-4.5" />
          </button>
        )}

        <div className="h-4 w-px bg-zinc-850 shrink-0" aria-hidden="true" />

        {/* Mute / Unmute */}
        <button
          type="button"
          onClick={onToggleMute}
          aria-pressed={isMuted}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={cn(
            'flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-full border transition-colors',
            isMuted
              ? 'border-zinc-800 bg-zinc-900 text-zinc-550 hover:border-zinc-700 hover:text-white'
              : 'border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-750',
          )}
        >
          {isMuted ? (
            <MicOff className="size-4 sm:size-4.5" />
          ) : (
            <Mic className="size-4 sm:size-4.5" />
          )}
        </button>

        <span className="hidden text-xs font-semibold text-zinc-450 md:inline min-w-14 shrink-0">
          {isMuted ? 'Muted' : 'Live'}
        </span>

        <div className="h-4 w-px bg-zinc-850 shrink-0" aria-hidden="true" />

        {/* Leave room */}
        <button
          type="button"
          onClick={onLeave}
          className="flex items-center gap-1 rounded-full border border-zinc-750 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-1.5 sm:px-4.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white transition-colors shrink-0"
        >
          <LogOut className="size-3 sm:size-3.5" />
          Leave
        </button>

        {/* End Meeting button for hosts */}
        {isHost && onEndMeeting && (
          <button
            type="button"
            onClick={onEndMeeting}
            className="flex items-center gap-1 rounded-full border border-red-800 bg-red-950/20 hover:bg-red-950/40 px-3.5 py-1.5 sm:px-4.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-red-400 transition-colors shrink-0"
          >
            <ShieldAlert className="size-3 sm:size-3.5 text-red-500" />
            End
          </button>
        )}

        {/* Admin actions menu */}
        {isAdmin && (
          <div className="ml-0.5 shrink-0">
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
