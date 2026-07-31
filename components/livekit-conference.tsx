'use client'

import { useState, useEffect } from 'react'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  useParticipants,
  useLocalParticipant,
  useTracks,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Shield, Users, Mic, MicOff, Video, VideoOff, PhoneOff, Settings, AlertCircle } from 'lucide-react'
import { ModeratorPanel } from './moderator-panel'

interface LiveKitConferenceProps {
  token: string
  serverUrl: string
  meetingId: string
  isHost: boolean
  isModerator: boolean
  user: { email: string; name?: string }
}

export function LiveKitConference({
  token,
  serverUrl,
  meetingId,
  isHost,
  isModerator,
  user
}: LiveKitConferenceProps) {
  const [showModPanel, setShowModPanel] = useState(false)
  const [isMockToken, setIsMockToken] = useState(false)

  useEffect(() => {
    if (token.startsWith('mock_livekit_token_')) {
      setIsMockToken(true)
    }
  }, [token])

  if (isMockToken) {
    return (
      <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-100">
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="size-3 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-bold text-white">Meeting: {meetingId}</h2>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
              Preview Mode (Missing LiveKit Credentials)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {(isHost || isModerator) && (
              <button
                onClick={() => setShowModPanel(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition"
              >
                <Shield className="size-4" />
                <span>Admin Controls</span>
              </button>
            )}
          </div>
        </header>

        {/* Mock Participant Video Grid */}
        <main className="flex-1 p-6 flex flex-col items-center justify-center">
          <div className="mb-6 max-w-lg rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center text-xs text-amber-300">
            <AlertCircle className="mx-auto size-5 mb-1 text-amber-400" />
            <p className="font-semibold">LiveKit Cloud credentials not configured in .env.local</p>
            <p className="text-zinc-400 mt-1">
              Add LIVEKIT_API_KEY, LIVEKIT_API_SECRET &amp; NEXT_PUBLIC_LIVEKIT_URL to connect to real video servers. Access control &amp; admin controls are fully functional.
            </p>
          </div>

          <div className="grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative flex aspect-video flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
              <div className="flex size-16 items-center justify-center rounded-full bg-indigo-600/30 text-2xl font-bold text-indigo-400 border border-indigo-500/40">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <span className="mt-3 text-sm font-semibold text-white">{user.name || user.email} (You)</span>
              <span className="mt-1 rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300 font-semibold">
                {isHost ? 'Host' : isModerator ? 'Moderator' : 'Participant'}
              </span>
            </div>

            <div className="relative flex aspect-video flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-600/30 text-2xl font-bold text-emerald-400 border border-emerald-500/40">
                A
              </div>
              <span className="mt-3 text-sm font-semibold text-white">Alex Okafor</span>
              <span className="mt-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-semibold">
                Participant (@kluniversity.com)
              </span>
            </div>
          </div>
        </main>

        {showModPanel && (
          <ModeratorPanel
            meetingId={meetingId}
            isHost={isHost}
            isModerator={isModerator}
            participants={[
              { identity: user.email, name: user.name || user.email, isAudioEnabled: true },
              { identity: 'alex@kluniversity.com', name: 'Alex Okafor', isAudioEnabled: false }
            ]}
            onClose={() => setShowModPanel(false)}
          />
        )}
      </div>
    )
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      style={{ height: '100dvh' }}
    >
      <div className="relative flex h-full flex-col bg-zinc-950 text-zinc-100">
        {/* Custom Header Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs font-semibold backdrop-blur-md">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white">Room: {meetingId}</span>
          </div>

          {(isHost || isModerator) && (
            <button
              onClick={() => setShowModPanel(true)}
              className="flex items-center gap-2 rounded-2xl border border-indigo-500/40 bg-indigo-600/30 px-4 py-2 text-xs font-bold text-indigo-200 backdrop-blur-md hover:bg-indigo-600/50 transition shadow-lg"
            >
              <Shield className="size-4" />
              <span>Admin Controls</span>
            </button>
          )}
        </div>

        {/* LiveKit Video Conference Component */}
        <VideoConference />
        <RoomAudioRenderer />

        {/* Moderator Drawer */}
        {showModPanel && (
          <ModeratorPanel
            meetingId={meetingId}
            isHost={isHost}
            isModerator={isModerator}
            participants={[]}
            onClose={() => setShowModPanel(false)}
          />
        )}
      </div>
    </LiveKitRoom>
  )
}
