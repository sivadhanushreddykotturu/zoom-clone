'use client'

import { Radio, Users } from 'lucide-react'

export function RoomHeader({
  participantCount,
  meetingId,
  title,
}: {
  participantCount: number
  meetingId?: string
  title?: string
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Radio className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-destructive">
                <span className="size-1.5 animate-pulse rounded-full bg-destructive" />
                Live
              </span>
            </div>
            <h1 className="mt-1 truncate text-lg font-semibold text-balance text-foreground sm:text-xl">
              {title || meetingId || 'Meeting Room'}
            </h1>
            <p className="truncate text-sm text-muted-foreground font-mono">
              {meetingId}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
          <Users className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {participantCount}
          </span>
          <span className="sr-only">participants in this room</span>
        </div>
      </div>
    </header>
  )
}
