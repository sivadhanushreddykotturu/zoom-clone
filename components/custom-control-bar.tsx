'use client'

import { useLocalParticipant, TrackToggle, DisconnectButton, useRoomContext } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { Mic, MicOff, Video, VideoOff, Hand, Lock } from 'lucide-react'
import { useState, useEffect } from 'react'

export function CustomControlBar({ isHost, isModerator, meetingId }: { isHost: boolean, isModerator: boolean, meetingId: string }) {
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()
  const canPublish = localParticipant?.permissions?.canPublish ?? false
  const [requesting, setRequesting] = useState(false)

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [prevCanPublish, setPrevCanPublish] = useState(canPublish)

  // Watch for permission changes to show a notification
  useEffect(() => {
    if (!isHost && !isModerator) {
      if (canPublish && !prevCanPublish) {
        setToastMessage("Host gave you permission! You can now speak.")
        setTimeout(() => setToastMessage(null), 5000)
      } else if (!canPublish && prevCanPublish) {
        setToastMessage("Your microphone has been locked by the host.")
        setTimeout(() => setToastMessage(null), 5000)
      }
    }
    setPrevCanPublish(canPublish)
  }, [canPublish, prevCanPublish, isHost, isModerator])

  // Listen to mute events to auto-revoke permission
  useEffect(() => {
    if (!localParticipant) return
    
    const handleTrackMuted = (pub: any) => {
      if (pub.source === Track.Source.Microphone) {
        // If a participant (not host/mod) mutes themselves, revoke their permission so they must raise hand again
        if (!isHost && !isModerator && canPublish) {
          fetch('/api/livekit/admin-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ meetingId, action: 'restrict-unmute', targetIdentity: localParticipant.identity })
          })
        }
      }
    }

    localParticipant.on('trackMuted', handleTrackMuted)
    return () => {
      localParticipant.off('trackMuted', handleTrackMuted)
    }
  }, [localParticipant, isHost, isModerator, canPublish, meetingId])

  const handleRequestUnmute = async () => {
    if (canPublish) return
    setRequesting(true)
    try {
      await fetch('/api/livekit/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, action: 'raise-hand', targetIdentity: localParticipant.identity })
      })
      // We will also use setAttributes for immediate local/room state
      if (localParticipant.setAttributes) {
        await localParticipant.setAttributes({ raisedHand: 'true' })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setTimeout(() => setRequesting(false), 2000)
    }
  }

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="rounded-full bg-indigo-600 px-6 py-3 shadow-xl border border-indigo-500/30 flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-2xl bg-zinc-900/90 px-6 py-3 border border-zinc-800 backdrop-blur-md shadow-2xl">
        {/* Mic Button */}
      {canPublish ? (
        <TrackToggle 
          source={Track.Source.Microphone} 
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition data-[state=on]:bg-emerald-500/20 data-[state=on]:text-emerald-400"
        >
          <Mic className="size-5 mb-1" />
          <span className="text-[10px] font-medium">Mic</span>
        </TrackToggle>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center p-3 px-4 rounded-xl bg-zinc-800/50 text-zinc-500 cursor-not-allowed" title="Microphone is locked by the host">
            <div className="relative">
              <MicOff className="size-5 mb-1 opacity-50" />
              <Lock className="size-3 absolute -top-1 -right-2 text-rose-500" />
            </div>
            <span className="text-[10px] font-medium">Locked</span>
          </div>
          <button
            onClick={handleRequestUnmute}
            className={lex flex-col items-center justify-center p-3 px-5 rounded-xl transition border }
            title="Request to Speak (Raise Hand)"
          >
            {requesting ? (
              <Hand className="size-5 mb-1 animate-bounce" />
            ) : (
              <Hand className="size-5 mb-1" />
            )}
            <span className="text-[10px] font-medium">{requesting ? 'Requested' : 'Raise Hand'}</span>
          </button>
        </>
      )}

      {/* Video Button */}
      {canPublish ? (
        <TrackToggle 
          source={Track.Source.Camera} 
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition data-[state=on]:bg-emerald-500/20 data-[state=on]:text-emerald-400"
        >
          <Video className="size-5 mb-1" />
          <span className="text-[10px] font-medium">Video</span>
        </TrackToggle>
      ) : null}

      <div className="w-px h-10 bg-zinc-800 mx-2" />

      <DisconnectButton className="flex flex-col items-center justify-center px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition">
        Leave
      </DisconnectButton>
    </div>
    </>
  )
}