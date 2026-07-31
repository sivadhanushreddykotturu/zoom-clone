'use client'

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  Track,
  ParticipantEvent,
} from 'livekit-client'
import { RoomHeader } from '@/components/room-header'
import { ParticipantTile } from '@/components/participant-tile'
import { ControlBar } from '@/components/control-bar'
import type { Participant as UiParticipant } from '@/lib/room-data'
import { Lock, MailCheck, ArrowLeft, Send, X, Shield, VolumeX, Mic, Monitor, UserCheck, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface ChatMessage {
  sender: string
  senderName: string
  text: string
  timestamp: number
}

function getTrackPublications(p: Participant | null | undefined): any[] {
  if (!p) return []
  const publications = p.trackPublications || (p as any).tracks
  if (!publications) return []
  if (typeof publications.values === 'function') {
    return Array.from(publications.values())
  }
  if (typeof publications === 'object') {
    return Object.values(publications)
  }
  return []
}

function toUiParticipant(
  p: Participant,
  selfIdentity: string,
  moderators: string[],
): UiParticipant {
  const isSelf = p.identity === selfIdentity
  const isAdmin = isSelf
    ? moderators.includes(selfIdentity)
    : moderators.includes(p.identity)

  let isMuted = true
  let isSpeaking = p.isSpeaking ?? false
  const publications = getTrackPublications(p)
  for (const pub of publications) {
    if (pub.kind === Track.Kind.Audio) {
      isMuted = pub.isMuted ?? true
      break
    }
  }

  return {
    id: p.identity,
    name: p.name || p.identity,
    avatar: '', // generated dynamically via Dicebear
    isAdmin,
    isSpeaking,
    isMuted,
    isSelf,
  }
}

function ScreenshareVideo({ room, participantIdentity }: { room: Room | null; participantIdentity: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!room || !videoElement) return

    const targetParticipant = participantIdentity === room.localParticipant.identity
      ? room.localParticipant
      : room.remoteParticipants.get(participantIdentity)

    if (!targetParticipant) return

    let attachedTrack: any = null

    const attachTrack = () => {
      const publications = getTrackPublications(targetParticipant)
      for (const pub of publications) {
        if (pub.kind === Track.Kind.Video && pub.source === Track.Source.ScreenShare) {
          if (pub.track) {
            if (attachedTrack !== pub.track) {
              if (attachedTrack) attachedTrack.detach(videoElement)
              pub.track.attach(videoElement)
              attachedTrack = pub.track
            }
          } else {
            // Track is not yet subscribed, wait for it
            pub.on('subscribed', (track: any) => {
              if (attachedTrack) attachedTrack.detach(videoElement)
              track.attach(videoElement)
              attachedTrack = track
            })
          }
          break
        }
      }
    }

    attachTrack()

    const handleTrackSubscribed = () => {
      attachTrack()
    }
    
    targetParticipant.on('trackSubscribed', handleTrackSubscribed)

    return () => {
      targetParticipant.off('trackSubscribed', handleTrackSubscribed)
      if (attachedTrack && videoElement) {
        attachedTrack.detach(videoElement)
      }
    }
  }, [room, participantIdentity])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-contain"
    />
  )
}

export default function RoomPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = use(params)
  const router = useRouter()

  // Room states
  const [loading, setLoading] = useState(true)
  const [lobbyStatus, setLobbyStatus] = useState<'approved' | 'pending' | 'denied' | 'none'>('none')
  const [lobbyList, setLobbyList] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState<{ allowedDomains: string[] } | null>(null)
  const [connected, setConnected] = useState(false)

  const [selfIdentity, setSelfIdentity] = useState('')
  const [selfName, setSelfName] = useState('')
  const [moderators, setModerators] = useState<string[]>([])
  const [participants, setParticipants] = useState<UiParticipant[]>([])
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Reactions state
  const [reactions, setReactions] = useState<{ [identity: string]: string }>({})

  // Lobby side drawer
  const [isLobbyOpen, setIsLobbyOpen] = useState(false)

  // Screensharing state
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [currentScreenSharer, setCurrentScreenSharer] = useState<string | null>(null)
  const [screenshareRequest, setScreenshareRequest] = useState<{ identity: string; name: string } | null>(null)
  const [screenshareCooldown, setScreenshareCooldown] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Host unmute request popup state
  const [showUnmuteRequest, setShowUnmuteRequest] = useState(false)
  const [isMuteLocked, setIsMuteLocked] = useState(true) // Locked by default for non-admins on entry

  // End Meeting Alert Confirmation Dialog
  const [showEndMeetingPrompt, setShowEndMeetingPrompt] = useState(false)

  const [toast, setToast] = useState<string | null>(null)
  const roomRef = useRef<Room | null>(null)

  // Advanced Ref architecture to completely eliminate disconnect/reconnect loops
  const selfIdentityRef = useRef(selfIdentity)
  const selfNameRef = useRef(selfName)
  const moderatorsRef = useRef(moderators)
  const currentScreenSharerRef = useRef(currentScreenSharer)
  const isScreenSharingRef = useRef(isScreenSharing)
  const isChatOpenRef = useRef(isChatOpen)
  const awayParticipantsRef = useRef<{
    [id: string]: { name: string; isAdmin: boolean; isMuted: boolean; disconnectedAt: number }
  }>({})

  useEffect(() => { selfIdentityRef.current = selfIdentity }, [selfIdentity])
  useEffect(() => { selfNameRef.current = selfName }, [selfName])
  useEffect(() => { moderatorsRef.current = moderators }, [moderators])
  useEffect(() => { currentScreenSharerRef.current = currentScreenSharer }, [currentScreenSharer])
  useEffect(() => { isScreenSharingRef.current = isScreenSharing }, [isScreenSharing])

  useEffect(() => {
    isChatOpenRef.current = isChatOpen
    if (isChatOpen) {
      setUnreadCount(0)
    }
  }, [isChatOpen])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent))
  }, [])

  // Build UI participants list
  const rebuildParticipants = useCallback(() => {
    const room = roomRef.current
    if (!room) return
    const identity = selfIdentityRef.current
    const mods = moderatorsRef.current

    const all: UiParticipant[] = []
    if (room.localParticipant) {
      all.push(toUiParticipant(room.localParticipant, identity, mods))
    }
    for (const p of room.remoteParticipants.values()) {
      all.push(toUiParticipant(p, identity, mods))
    }

    // Merge in participants who disconnected less than 30 seconds ago (grace period)
    const now = Date.now()
    Object.entries(awayParticipantsRef.current).forEach(([id, info]) => {
      if (now - info.disconnectedAt < 30000) {
        all.push({
          id,
          name: info.name,
          avatar: '',
          isAdmin: info.isAdmin,
          isSpeaking: false,
          isMuted: info.isMuted,
          isSelf: false,
          isAway: true,
        })
      }
    })

    setParticipants(all)

    // Detect if someone is screensharing in the room
    let activeSharer: string | null = null
    const allParticipants = [room.localParticipant, ...Array.from(room.remoteParticipants.values())].filter(Boolean)
    for (const p of allParticipants) {
      const publications = p.trackPublications || p.tracks
      if (publications) {
        for (const pub of publications.values()) {
          if (pub.kind === Track.Kind.Video && pub.source === Track.Source.ScreenShare) {
            activeSharer = p.identity
            break
          }
        }
      }
    }
    setCurrentScreenSharer(activeSharer)
  }, [])

  const rebuildParticipantsRef = useRef(rebuildParticipants)
  useEffect(() => {
    rebuildParticipantsRef.current = rebuildParticipants
  }, [rebuildParticipants])

  // Handle incoming LiveKit data channel messages
  const handleDataReceived = useCallback((payload: Uint8Array, participant?: RemoteParticipant) => {
    const textDecoder = new TextDecoder()
    const dataStr = textDecoder.decode(payload)
    try {
      const message = JSON.parse(dataStr)
      const senderId = participant?.identity || 'System'
      const senderName = participant?.name || senderId

      if (message.type === 'chat') {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: senderId,
            senderName,
            text: message.text,
            timestamp: Date.now(),
          },
        ])
        if (!isChatOpenRef.current) {
          setUnreadCount((c) => c + 1)
        }
      } else if (message.type === 'reaction') {
        setReactions((prev) => ({ ...prev, [senderId]: message.emoji }))
        setTimeout(() => {
          setReactions((prev) => {
            const next = { ...prev }
            delete next[senderId]
            return next
          })
        }, 3000)
      } else if (message.type === 'unmute-request') {
        if (message.target.toLowerCase() === selfIdentityRef.current.toLowerCase()) {
          setIsMuteLocked(false) // Unlock unmuting!
          setShowUnmuteRequest(true)
        }
      } else if (message.type === 'mute-lock') {
        const isMod = moderatorsRef.current.some(
          (m) => m.toLowerCase() === selfIdentityRef.current.toLowerCase()
        )
        if (message.target.toLowerCase() === selfIdentityRef.current.toLowerCase() && !isMod) {
          setIsMuteLocked(true)
          if (roomRef.current && roomRef.current.localParticipant.isMicrophoneEnabled) {
            roomRef.current.localParticipant.setMicrophoneEnabled(false)
            rebuildParticipantsRef.current()
          }
          showToast('You have been muted by the host.')
        }
      } else if (message.type === 'mute-lock-all') {
        const isMod = moderatorsRef.current.some(
          (m) => m.toLowerCase() === selfIdentityRef.current.toLowerCase()
        )
        if (!isMod) {
          setIsMuteLocked(true)
          if (roomRef.current && roomRef.current.localParticipant.isMicrophoneEnabled) {
            roomRef.current.localParticipant.setMicrophoneEnabled(false)
            rebuildParticipantsRef.current()
          }
          showToast('The host has muted everyone.')
        }
      } else if (message.type === 'cohost-promoted') {
        setModerators((prev) => {
          const next = [...prev]
          if (!next.includes(message.identity)) {
            next.push(message.identity)
          }
          return next
        })
        setTimeout(() => {
          rebuildParticipantsRef.current()
        }, 100)
        showToast(`${message.identityName} has been promoted to Co-host.`)
      } else if (message.type === 'screenshare-request') {
        const isMod = moderatorsRef.current.includes(selfIdentityRef.current)
        const isCurrentSharer = currentScreenSharerRef.current === selfIdentityRef.current
        if (isMod || isCurrentSharer) {
          setScreenshareRequest({ identity: senderId, name: senderName })
        }
      } else if (message.type === 'screenshare-approved') {
        if (message.target === selfIdentityRef.current) {
          showToast('Screenshare request approved! Starting share.')
          startScreenSharingLocally()
        }
      } else if (message.type === 'screenshare-denied') {
        if (message.target === selfIdentityRef.current) {
          showToast('Host declined your screenshare request.')
        }
      } else if (message.type === 'stop-screenshare-signal') {
        if (isScreenSharingRef.current && roomRef.current) {
          roomRef.current.localParticipant.setScreenShareEnabled(false)
          setIsScreenSharing(false)
          showToast('Host stopped your screenshare.')
        }
      } else if (message.type === 'end-meeting-signal') {
        showToast('The host has ended this meeting.')
        if (roomRef.current) {
          roomRef.current.disconnect()
        }
        router.push('/dashboard')
      }
    } catch (e) {
      console.error('Error parsing data channel message:', e)
    }
  }, [showToast, router])

  const handleDataReceivedRef = useRef(handleDataReceived)
  useEffect(() => {
    handleDataReceivedRef.current = handleDataReceived
  }, [handleDataReceived])

  // 1. Lobby Waiting Room Polling Flow
  useEffect(() => {
    if (lobbyStatus !== 'pending') return

    const checkLobby = async () => {
      try {
        const res = await fetch(`/api/meetings/${meetingId}/lobby`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'approved') {
            setLobbyStatus('approved')
            setLoading(true)
          } else if (data.status === 'denied') {
            setLobbyStatus('denied')
            setError('The host declined your request to join this meeting.')
          }
        }
      } catch (err) {
        console.error('Error polling waiting room status:', err)
      }
    }

    const interval = setInterval(checkLobby, 4000)
    return () => clearInterval(interval)
  }, [lobbyStatus, meetingId])

  // 2. Host Pending Lobby List Polling Flow
  const fetchLobbyList = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/lobby`)
      if (res.ok) {
        const data = await res.json()
        if (data.isModerator && data.pending) {
          setLobbyList(data.pending)
        }
      }
    } catch (err) {
      console.error('Error fetching lobby queue list:', err)
    }
  }, [meetingId])

  useEffect(() => {
    const isMod = moderators.includes(selfIdentity)
    if (!connected || !isMod) return

    fetchLobbyList()
    const interval = setInterval(fetchLobbyList, 5000)
    return () => clearInterval(interval)
  }, [connected, moderators, selfIdentity, fetchLobbyList])

  // Start connect flow (runs exactly once per mount or lobby status shift to approved)
  useEffect(() => {
    if (lobbyStatus === 'pending' || lobbyStatus === 'denied') return
    let cancelled = false

    async function connect() {
      try {
        // Try lobby registration first
        const lobbyCheck = await fetch(`/api/meetings/${meetingId}/lobby`, { method: 'POST' })
        const lobbyData = await lobbyCheck.json()
        if (lobbyData.status === 'pending') {
          setLobbyStatus('pending')
          setLoading(false)
          return
        }

        // Fetch LiveKit Token
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId }),
        })
        const data = await res.json()

        if (!res.ok) {
          if (res.status === 401) {
            router.push(`/login?redirect=/room/${meetingId}`)
            return
          }
          if (res.status === 403 && data.lobbyRequired) {
            setLobbyStatus('pending')
            setLoading(false)
            return
          }
          if (res.status === 403) {
            setAccessDenied({ allowedDomains: data.allowedDomains || [] })
          }
          setError(data.error || 'Could not join meeting.')
          setLoading(false)
          return
        }

        const { token, serverUrl, meetingTitle } = data
        const identity = data.user?.email || ''
        const name = data.user?.name || identity.split('@')[0]
        const mods: string[] = data.moderators || []

        setSelfIdentity(identity)
        setSelfName(name)
        setModerators(mods)
        setMeetingTitle(meetingTitle || '')
        setLobbyStatus('approved')

        // Mock Bypass
        if (token.startsWith('mock_livekit_token_')) {
          setConnected(true)
          setLoading(false)
          setParticipants([
            { id: identity, name: name + ' (You)', avatar: '', isAdmin: mods.includes(identity), isSpeaking: false, isMuted: true, isSelf: true },
            { id: 'alex@domain.com', name: 'Alex Okafor', avatar: '', isAdmin: false, isSpeaking: false, isMuted: true }
          ])
          return
        }

        const livekitRoom = new Room()
        roomRef.current = livekitRoom

        const refresh = () => rebuildParticipantsRef.current()

        livekitRoom
          .on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
            // Remove from away list if they returned
            delete awayParticipantsRef.current[p.identity]

            p.on(ParticipantEvent.IsSpeakingChanged, refresh)
            p.on(ParticipantEvent.TrackMuted, refresh)
            p.on(ParticipantEvent.TrackUnmuted, refresh)
            refresh()
          })
          .on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
            const identity = p.identity
            const name = p.name || p.identity
            const isAdmin = moderatorsRef.current.includes(p.identity)

            // Put them on the away list
            awayParticipantsRef.current[identity] = {
              name,
              isAdmin,
              isMuted: true,
              disconnectedAt: Date.now(),
            }
            refresh()

            // Remove permanently after 30 seconds if they don't reconnect
            setTimeout(() => {
              const entry = awayParticipantsRef.current[identity]
              if (entry && Date.now() - entry.disconnectedAt >= 30000) {
                delete awayParticipantsRef.current[identity]
                showToast(`${name} left the room.`)
                refresh()
              }
            }, 30000)
          })
          .on(RoomEvent.TrackMuted, refresh)
          .on(RoomEvent.TrackUnmuted, refresh)
          .on(RoomEvent.ActiveSpeakersChanged, refresh)
          .on(RoomEvent.LocalTrackPublished, refresh)
          .on(RoomEvent.LocalTrackUnpublished, refresh)
          .on(RoomEvent.TrackPublished, refresh)
          .on(RoomEvent.TrackUnpublished, refresh)
          .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            if (track.kind === Track.Kind.Audio) {
              track.attach()
            }
            refresh()
          })
          .on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            track.detach()
            refresh()
          })
          .on(RoomEvent.DataReceived, (payload, participant) => {
            handleDataReceivedRef.current(payload, participant)
          })
          .on(RoomEvent.Disconnected, (reason) => {
            if (!cancelled) {
              if (reason === 'kicked') {
                showToast('You were removed from the room by the host.')
              } else {
                showToast('You have been disconnected from the meeting.')
              }
              setConnected(false)
              router.push('/dashboard')
            }
          })

        await livekitRoom.connect(serverUrl, token, {
          autoSubscribe: true,
        })

        if (cancelled) {
          await livekitRoom.disconnect()
          return
        }

        await livekitRoom.localParticipant.setMicrophoneEnabled(false)

        setConnected(true)
        setLoading(false)
        refresh()
      } catch (err: any) {
        if (!cancelled) {
          console.error('Room connection error:', err)
          setError(err.message || 'Failed to connect to meeting.')
          setLoading(false)
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      roomRef.current?.disconnect()
    }
  }, [meetingId, router, showToast, lobbyStatus])

  const self = participants.find((p) => p.isSelf)
  const isMuted = self?.isMuted ?? true
  const isAdmin = self?.isAdmin ?? false

  const speakers = useMemo(
    () => participants.filter((p) => p.isSpeaking).length,
    [participants],
  )

  const toggleMute = useCallback(async () => {
    const isMod = moderatorsRef.current.some(
      (m) => m.toLowerCase() === selfIdentityRef.current.toLowerCase()
    )
    if (isMuteLocked && !isMod) {
      showToast('You must be requested by the host to unmute.')
      return
    }
    const room = roomRef.current
    if (!room) return
    const enabled = room.localParticipant.isMicrophoneEnabled
    await room.localParticipant.setMicrophoneEnabled(!enabled)
    setParticipants((prev) =>
      prev.map((p) =>
        p.isSelf ? { ...p, isMuted: enabled, isSpeaking: false } : p,
      ),
    )
  }, [isMuteLocked, showToast])



  // Moderate Waiting Room (Allow / Discard)
  const handleLobbyAction = useCallback(async (targetEmail: string, action: 'approve' | 'deny') => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/lobby`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail, action }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      showToast(`${targetEmail} ${action === 'approve' ? 'allowed entry' : 'entry request discarded'}.`)
      fetchLobbyList()
    } catch (err: any) {
      showToast(err.message || 'Failed to update lobby status.')
    }
  }, [meetingId, fetchLobbyList, showToast])

  // Remote mute-all
  const handleMuteEveryone = useCallback(async () => {
    try {
      const res = await fetch('/api/livekit/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, action: 'mute-all' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Broadcast mute-lock-all signal to all participants
      const room = roomRef.current
      if (room) {
        const textEncoder = new TextEncoder()
        const payload = textEncoder.encode(JSON.stringify({ type: 'mute-lock-all' }))
        room.localParticipant.publishData(payload, { reliable: true })
      }

      showToast('Everyone has been muted.')
    } catch (err: any) {
      showToast(err.message || 'Failed to mute everyone.')
    }
  }, [meetingId, showToast])

  // Remote Kick
  const handleKickParticipant = useCallback(async () => {
    const nonAdmins = participants.filter((p) => !p.isSelf && !p.isAdmin)
    if (nonAdmins.length === 0) {
      showToast('No participants to remove.')
      return
    }
    const target = nonAdmins[nonAdmins.length - 1]
    try {
      const res = await fetch('/api/livekit/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, action: 'kick-user', targetIdentity: target.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`${target.name} was removed from the room.`)
    } catch (err: any) {
      showToast(err.message || 'Failed to remove participant.')
    }
  }, [meetingId, participants, showToast])

  // Remote mute specific participant
  const handleMuteTarget = useCallback(async (identity: string) => {
    try {
      const targetUser = roomRef.current?.remoteParticipants.get(identity)
      if (!targetUser) return
      let trackSid = ''
      const publications = getTrackPublications(targetUser)
      for (const pub of publications) {
        if (pub.kind === Track.Kind.Audio) {
          trackSid = pub.trackSid
          break
        }
      }
      if (!trackSid) return

      const res = await fetch('/api/livekit/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          action: 'mute-user',
          targetIdentity: identity,
          trackSid,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      // Send mute-lock signal directly to the target participant
      const room = roomRef.current
      if (room) {
        const textEncoder = new TextEncoder()
        const payload = textEncoder.encode(JSON.stringify({ type: 'mute-lock', target: identity }))
        room.localParticipant.publishData(payload, { reliable: true })
      }

      showToast(`Muted ${identity}`)
    } catch (err: any) {
      showToast(err.message || 'Failed to mute participant.')
    }
  }, [meetingId, showToast])

  // Remote unmute request
  const handleUnmuteRequest = useCallback((identity: string) => {
    const room = roomRef.current
    if (!room) return
    const textEncoder = new TextEncoder()
    const payload = textEncoder.encode(
      JSON.stringify({ type: 'unmute-request', target: identity }),
    )
    room.localParticipant.publishData(payload, { reliable: true })
    showToast(`Unmute request sent to ${identity}.`)
  }, [showToast])

  // Promote participant to Co-host
  const handlePromoteCohost = useCallback(async (identity: string, name: string) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newModeratorEmail: identity }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const room = roomRef.current
      if (room) {
        const textEncoder = new TextEncoder()
        const payload = textEncoder.encode(
          JSON.stringify({
            type: 'cohost-promoted',
            identity,
            identityName: name,
          }),
        )
        room.localParticipant.publishData(payload, { reliable: true })
      }

      setModerators((prev) => {
        const next = [...prev, identity]
        return next
      })
      setTimeout(() => {
        rebuildParticipantsRef.current()
      }, 100)
      showToast(`${name} is now a Co-host!`)
    } catch (err: any) {
      showToast(err.message || 'Failed to assign Co-host.')
    }
  }, [meetingId, showToast])

  // Local Screenshare start helper
  const startScreenSharingLocally = async () => {
    const room = roomRef.current
    if (!room) return
    try {
      await room.localParticipant.setScreenShareEnabled(true)
      setIsScreenSharing(true)
    } catch (err) {
      console.error('Screenshare launch failed:', err)
    }
  }

  // Handle local Screenshare button trigger
  const handleToggleScreenshare = async () => {
    const room = roomRef.current
    if (!room) return

    if (isScreenSharing) {
      await room.localParticipant.setScreenShareEnabled(false)
      setIsScreenSharing(false)
      return
    }

    const isMod = moderators.includes(selfIdentity)
    
    // Co-hosts and hosts bypass requests - can share instantly
    if (isMod) {
      if (currentScreenSharer && currentScreenSharer !== selfIdentity) {
        const textEncoder = new TextEncoder()
        const stopPayload = textEncoder.encode(JSON.stringify({ type: 'stop-screenshare-signal' }))
        room.localParticipant.publishData(stopPayload, { reliable: true })
      }
      startScreenSharingLocally()
      return
    }

    if (screenshareCooldown) {
      showToast('Wait a bit before requesting to share screen again.')
      return
    }

    const textEncoder = new TextEncoder()
    const payload = textEncoder.encode(
      JSON.stringify({ type: 'screenshare-request' })
    )
    room.localParticipant.publishData(payload, { reliable: true })
    showToast('Sent screenshare request to host. Waiting for approval...')

    setScreenshareCooldown(true)
    setTimeout(() => setScreenshareCooldown(false), 15000)
  };

  // Approve Screenshare Request
  const handleApproveScreenshare = () => {
    if (!screenshareRequest || !roomRef.current) return
    
    const textEncoder = new TextEncoder()
    
    if (isScreenSharing) {
      roomRef.current.localParticipant.setScreenShareEnabled(false)
      setIsScreenSharing(false)
    } else if (currentScreenSharer) {
      const stopPayload = textEncoder.encode(JSON.stringify({ type: 'stop-screenshare-signal' }))
      roomRef.current.localParticipant.publishData(stopPayload, { reliable: true })
    }

    const approvePayload = textEncoder.encode(
      JSON.stringify({ type: 'screenshare-approved', target: screenshareRequest.identity })
    )
    roomRef.current.localParticipant.publishData(approvePayload, { reliable: true })
    
    setScreenshareRequest(null)
    showToast(`Approved screenshare request for ${screenshareRequest.name}`)
  }

  // Deny Screenshare Request
  const handleDenyScreenshare = () => {
    if (!screenshareRequest || !roomRef.current) return
    const textEncoder = new TextEncoder()
    const denyPayload = textEncoder.encode(
      JSON.stringify({ type: 'screenshare-denied', target: screenshareRequest.identity })
    )
    roomRef.current.localParticipant.publishData(denyPayload, { reliable: true })
    setScreenshareRequest(null)
  }

  // Send Chat message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const room = roomRef.current
    if (room) {
      const textEncoder = new TextEncoder()
      const payload = textEncoder.encode(
        JSON.stringify({ type: 'chat', text: chatInput.trim() }),
      )
      room.localParticipant.publishData(payload, { reliable: true })
      
      setChatMessages((prev) => [
        ...prev,
        {
          sender: selfIdentity,
          senderName: selfName,
          text: chatInput.trim(),
          timestamp: Date.now(),
        },
      ])
    }
    setChatInput('')
  }

  // Send Emoji reaction
  const handleSendReaction = (emoji: string) => {
    const room = roomRef.current
    if (room) {
      const textEncoder = new TextEncoder()
      const payload = textEncoder.encode(
        JSON.stringify({ type: 'reaction', emoji }),
      )
      room.localParticipant.publishData(payload, { reliable: false })
      
      setReactions((prev) => ({ ...prev, [selfIdentity]: emoji }))
      setTimeout(() => {
        setReactions((prev) => {
          const next = { ...prev }
          delete next[selfIdentity]
          return next
        })
      }, 3000)
    }
  }

  const participantsWithReactions = useMemo(() => {
    return participants.map((p) => ({
      ...p,
      reaction: reactions[p.id] || undefined,
    }))
  }, [participants, reactions])

  // Check if there are other active co-hosts present in the meeting
  const hasActiveCohost = useMemo(() => {
    return participants.some(
      (p) => !p.isSelf && moderators.includes(p.id)
    )
  }, [participants, moderators])

  const handleEndMeeting = useCallback(async () => {
    const room = roomRef.current
    if (room) {
      const textEncoder = new TextEncoder()
      const payload = textEncoder.encode(JSON.stringify({ type: 'end-meeting-signal' }))
      try {
        room.localParticipant.publishData(payload, { reliable: true })
      } catch (err) {
        console.error(err)
      }
    }

    try {
      await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      })
    } catch (err) {
      console.error(err)
    }

    if (room) {
      room.disconnect()
    }
    router.push('/dashboard')
  }, [meetingId, router])

  const handleLeave = useCallback(async () => {
    const isHost = selfIdentity.toLowerCase() === moderators[0]?.toLowerCase()

    if (isHost && !hasActiveCohost) {
      setShowEndMeetingPrompt(true)
      return
    }

    await roomRef.current?.disconnect()
    router.push('/dashboard')
  }, [router, selfIdentity, moderators, hasActiveCohost])

  // --- waiting lobby UI view ---
  if (lobbyStatus === 'pending') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-4 text-center text-zinc-100">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 space-y-6 shadow-2xl">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-white animate-pulse">
            <Monitor className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Waiting Room</h2>
            <p className="mt-2 text-sm text-zinc-400">
              The host has been notified that you are waiting. You will join the meeting as soon as they let you in.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-750 transition"
            >
              Cancel &amp; Return
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // --- lobby entry denied UI view ---
  if (lobbyStatus === 'denied') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center space-y-5 shadow-2xl text-zinc-100">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-950 border border-red-900 text-red-400">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Request Declined</h2>
            <p className="mt-2 text-sm text-zinc-400">
              You were not allowed to enter this meeting.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-black hover:bg-zinc-200 transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // --- connection loading flow UI view ---
  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black text-zinc-400">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="text-sm">Connecting...</p>
        </div>
      </div>
    )
  }

  // --- error UI view ---
  if (error || accessDenied) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black px-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-950 border border-red-800 text-red-400">
            <Lock className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Access Denied</h2>
            <p className="mt-2 text-sm text-zinc-450">{error || 'Access error.'}</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-zinc-200 transition"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const isMod = moderators.includes(selfIdentity)

  return (
    <div className="flex min-h-dvh bg-black overflow-hidden relative">
      
      {/* Main Room Container */}
      <div className="flex flex-1 flex-col h-dvh">
        <RoomHeader participantCount={participants.length} meetingId={meetingId} title={meetingTitle} />

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10 overflow-y-auto pb-28">
          
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-white" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-zinc-400 font-mono">
                {currentScreenSharer
                  ? `Active Screen Share: ${currentScreenSharer}`
                  : speakers > 0
                  ? `${speakers} ${speakers === 1 ? 'person is' : 'people are'} speaking`
                  : 'On stage'}
              </h2>
            </div>

            {/* Waiting Room Lobby Button badge visible to Hosts/Moderators */}
            {isMod && lobbyList.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsLobbyOpen(true)
                }}
                className="flex items-center gap-1.5 rounded-lg border border-white bg-white px-3 py-1.5 text-xs font-bold text-black shadow-lg animate-pulse"
              >
                <UserCheck className="size-3.5" />
                <span>Waiting Room ({lobbyList.length})</span>
              </button>
            )}
          </div>

          {/* Active Screenshare Video Render Frame */}
          {currentScreenSharer && (
            <div className="mb-8 w-full aspect-video rounded-xl bg-black border border-zinc-800 overflow-hidden relative flex flex-col justify-end shadow-xl">
              <ScreenshareVideo room={roomRef.current} participantIdentity={currentScreenSharer} />
              <div className="absolute bottom-4 left-4 bg-black border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 shadow-md font-mono">
                {currentScreenSharer === selfIdentity ? "Your Screen" : `${participants.find(p => p.id === currentScreenSharer)?.name || currentScreenSharer}'s Screen`}
              </div>
            </div>
          )}

          <ul className="grid grid-cols-3 justify-items-center gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-y-10 md:grid-cols-5 lg:grid-cols-6">
            {participantsWithReactions.map((participant) => (
              <li
                key={participant.id}
                className="relative group cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.admin-option-btn')) return
                  setActiveMenuId(activeMenuId === participant.id ? null : participant.id)
                }}
              >
                <ParticipantTile participant={participant} />
                
                {/* Admin Actions Panel (Hover on desktop, click on mobile) */}
                {isMod && !participant.isSelf && (
                  <div className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 items-center gap-1 bg-zinc-900 border border-zinc-805 p-1 rounded-lg shadow-xl z-20",
                    activeMenuId === participant.id ? "flex" : "hidden group-hover:flex"
                  )}>
                    {participant.isMuted ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUnmuteRequest(participant.id)
                        }}
                        className="admin-option-btn text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-white flex items-center gap-1"
                        title="Request Unmute"
                      >
                        <Mic className="size-3" /> Unmute
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMuteTarget(participant.id)
                        }}
                        className="admin-option-btn text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-red-400 flex items-center gap-1"
                        title="Mute"
                      >
                        <VolumeX className="size-3" /> Mute
                      </button>
                    )}
                    
                    {!participant.isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePromoteCohost(participant.id, participant.name)
                        }}
                        className="admin-option-btn text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-zinc-300 flex items-center gap-1"
                        title="Promote to Co-host"
                      >
                        <Shield className="size-3" /> Co-host
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </main>

        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 bottom-28 z-45 flex justify-center px-4"
          >
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-2xl">
              {toast}
            </div>
          </div>
        )}

        {/* Bottom Control Actions */}
        <ControlBar
          isMuted={isMuted}
          isAdmin={isAdmin}
          onToggleMute={toggleMute}
          onLeave={handleLeave}
          onMuteEveryone={handleMuteEveryone}
          onKickParticipant={handleKickParticipant}
          onSendReaction={handleSendReaction}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          isChatOpen={isChatOpen}
          unreadChats={unreadCount}
          isHost={selfIdentity.toLowerCase() === moderators[0]?.toLowerCase()}
          onEndMeeting={() => setShowEndMeetingPrompt(true)}
          isScreenSharing={isScreenSharing}
          onToggleScreenshare={handleToggleScreenshare}
        />

      </div>

      {/* Real-time Chat sidebar Panel */}
      {isChatOpen && (
        <div className="fixed sm:relative top-0 right-0 bottom-0 w-full sm:w-80 z-40 h-dvh border-l border-zinc-800 bg-zinc-950 flex flex-col justify-between shrink-0 shadow-2xl">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Meeting Chat</h3>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-zinc-500 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center px-4">
                <p className="text-xs">No messages yet.</p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className="text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                    <span>{msg.senderName}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="bg-zinc-900 border border-zinc-850 p-2.5 rounded-lg text-zinc-200 leading-relaxed break-words">
                    {msg.text}
                  </p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendChat} className="p-4 border-t border-zinc-800 flex gap-2">
            <input
              type="text"
              placeholder="Send message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-800 bg-black px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white"
            />
            <button
              type="submit"
              className="flex size-9 items-center justify-center rounded-xl bg-white text-black hover:bg-zinc-200 transition"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}

      {/* Waiting Room Queue Lobby sidebar Panel */}
      {isMod && isLobbyOpen && (
        <div className="fixed sm:relative top-0 right-0 bottom-0 w-full sm:w-80 z-40 h-dvh border-l border-zinc-800 bg-zinc-950 flex flex-col justify-between shrink-0 shadow-2xl">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Waiting Room Queue</h3>
            <button
              onClick={() => setIsLobbyOpen(false)}
              className="text-zinc-500 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {lobbyList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center px-4">
                <p className="text-xs">Waiting room is empty.</p>
              </div>
            ) : (
              lobbyList.map((p) => (
                <div key={p.email} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 space-y-3">
                  <div className="text-xs">
                    <p className="font-bold text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{p.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLobbyAction(p.email, 'deny')}
                      className="flex-1 rounded bg-zinc-800 border border-zinc-700 py-1 text-[11px] text-zinc-350 hover:bg-zinc-750 transition"
                    >
                      Discard
                    </button>
                    <button
                      onClick={() => handleLobbyAction(p.email, 'approve')}
                      className="flex-1 rounded bg-white py-1 text-[11px] text-black font-bold hover:bg-zinc-200 transition"
                    >
                      Allow In
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-zinc-800 text-center">
            <p className="text-[10px] text-zinc-500">Waiting room security rules applied</p>
          </div>
        </div>
      )}

      {/* Screenshare request popup overlay */}
      {screenshareRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-white animate-pulse">
              <Monitor className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Screenshare Request</h3>
              <p className="text-sm text-zinc-450 mt-1">
                <span className="text-white font-bold">{screenshareRequest.name}</span> is requesting to share their screen.
                {currentScreenSharer && ' This will stop the current screen sharing session.'}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDenyScreenshare}
                className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 py-2.5 text-xs font-semibold text-zinc-350 hover:bg-zinc-750 transition"
              >
                Deny
              </button>
              <button
                onClick={handleApproveScreenshare}
                className="flex-1 rounded-xl bg-white py-2.5 text-xs font-bold text-black hover:bg-zinc-200 transition"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Host requested you to unmute popup overlay */}
      {showUnmuteRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-white animate-pulse">
              <Mic className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Unmute Microphone</h3>
              <p className="text-sm text-zinc-450 mt-1">
                The host has requested that you unmute your microphone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowUnmuteRequest(false)}
                className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 py-2.5 text-xs font-semibold text-zinc-350 hover:bg-zinc-750 transition"
              >
                Decline
              </button>
              <button
                onClick={() => {
                  setShowUnmuteRequest(false)
                  if (isMuted) toggleMute()
                }}
                className="flex-1 rounded-xl bg-white py-2.5 text-xs font-bold text-black hover:bg-zinc-250 transition"
              >
                Unmute Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Meeting Alert Confirmation Dialog */}
      {showEndMeetingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-950 border border-red-900 text-red-400">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">End Meeting for Everyone?</h3>
              <p className="text-sm text-zinc-400 mt-1">
                {hasActiveCohost
                  ? "Are you sure you want to end this meeting for all participants?"
                  : "There are no active co-hosts in this meeting. Leaving will end the meeting for all participants."}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleEndMeeting}
                className="w-full rounded-xl bg-red-650 hover:bg-red-650/80 py-2.5 text-xs font-bold text-white transition"
              >
                End Meeting for Everyone
              </button>
              <button
                onClick={() => setShowEndMeetingPrompt(false)}
                className="w-full rounded-xl bg-zinc-800 border border-zinc-700 py-2.5 text-xs font-semibold text-zinc-350 hover:bg-zinc-750 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
