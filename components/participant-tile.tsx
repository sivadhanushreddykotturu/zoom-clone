'use client'

import { Crown, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Participant } from '@/lib/room-data'

function VoiceBars() {
  return (
    <span className="flex items-end gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="voice-bar h-3 w-0.5 rounded-full bg-white"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  )
}

export function ParticipantTile({
  participant,
  compact,
}: {
  participant: Participant & { reaction?: string; isAway?: boolean }
  compact?: boolean
}) {
  const { name, isAdmin, isSpeaking, isMuted, isSelf, id, reaction, isAway } = participant

  // Use custom avatar if available, otherwise generate unique Dicebear adventurer avatar
  const avatarUrl = participant.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(id || name)}`

  return (
    <div className={cn("flex flex-col items-center gap-2 text-center transition-opacity duration-300", isAway && "opacity-40")}>
      <div className="relative p-1">
        <div
          className={cn(
            'relative rounded-full p-[3px] transition-shadow duration-300',
            isSpeaking && !isAway
              ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
              : 'ring-1 ring-zinc-800',
          )}
        >
          <div className={cn(
            "overflow-hidden rounded-full bg-zinc-900 border border-zinc-800 transition-all",
            compact ? "size-12 sm:size-14" : "size-14 sm:size-18 md:size-20"
          )}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt={`${name}'s avatar`}
              className="size-full object-cover"
              crossOrigin="anonymous"
            />
          </div>
        </div>

        {/* Floating Emoji Reaction Overlay */}
        {reaction && !isAway && (
          <span className="absolute -top-2 -right-2 animate-bounce text-2xl z-10 select-none bg-zinc-900 border border-zinc-850 p-1.5 rounded-full shadow-lg">
            {reaction}
          </span>
        )}

        {/* Speaking indicator badge */}
        {isSpeaking && !isAway && (
          <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 px-2 py-1 shadow-lg">
            <VoiceBars />
            <span className="sr-only">Speaking</span>
          </span>
        )}

        {/* Muted indicator badge */}
        {!isSpeaking && isMuted && (
          <span className="absolute -bottom-1 right-0 flex size-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-550 shadow-md sm:size-7">
            <MicOff className="size-3.5" />
            <span className="sr-only">Muted</span>
          </span>
        )}
      </div>

      <div className="flex max-w-[7rem] flex-col items-center gap-1">
        <div className="flex items-center gap-1 flex-wrap justify-center">
          <span className="truncate text-sm font-medium text-zinc-300">
            {isSelf ? 'You' : name}
          </span>
          {isAway && (
            <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-850 px-1 rounded">
              Away
            </span>
          )}
          {isAdmin && (
            <span
              className="flex items-center gap-1 rounded bg-zinc-800 border border-zinc-700 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-300"
              title="Room admin"
            >
              <Crown className="size-2.5" />
              <span className="sr-only sm:not-sr-only">Admin</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
