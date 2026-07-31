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
          className="voice-bar h-3 w-0.5 rounded-full bg-primary-foreground"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  )
}

export function ParticipantTile({ participant }: { participant: Participant }) {
  const { name, avatar, isAdmin, isSpeaking, isMuted, isSelf } = participant

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative">
        <div
          className={cn(
            'relative rounded-full p-[3px] transition-shadow duration-300',
            isSpeaking
              ? 'speaker-ring'
              : 'ring-1 ring-border ring-inset',
          )}
        >
          <div className="size-16 overflow-hidden rounded-full bg-muted sm:size-20 md:size-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar || '/placeholder.svg'}
              alt={`${name}'s avatar`}
              className="size-full object-cover"
              crossOrigin="anonymous"
            />
          </div>
        </div>

        {/* Speaking indicator badge */}
        {isSpeaking && (
          <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full bg-primary px-2 py-1 shadow-lg">
            <VoiceBars />
            <span className="sr-only">Speaking</span>
          </span>
        )}

        {/* Muted indicator badge */}
        {!isSpeaking && isMuted && (
          <span className="absolute -bottom-1 right-0 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md sm:size-7">
            <MicOff className="size-3.5" />
            <span className="sr-only">Muted</span>
          </span>
        )}
      </div>

      <div className="flex max-w-[7rem] flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <span className="truncate text-sm font-medium text-foreground">
            {isSelf ? 'You' : name}
          </span>
          {isAdmin && (
            <span
              className="flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
              title="Room admin"
            >
              <Crown className="size-3" />
              <span className="sr-only sm:not-sr-only">Admin</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
