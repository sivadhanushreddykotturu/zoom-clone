import { NextResponse } from 'next/server'
import { RoomServiceClient } from 'livekit-server-sdk'
import { connectDB } from '@/lib/db/connect'
import { Meeting } from '@/lib/db/models/Meeting'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { meetingId, action, targetIdentity, trackSid } = await req.json()

    if (!meetingId || !action) {
      return NextResponse.json({ error: 'Meeting ID and action are required' }, { status: 400 })
    }

    await connectDB()
    const meeting = await Meeting.findOne({ meetingId })

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const userEmail = session.email.toLowerCase()
    const isHost = meeting.hostEmail === userEmail
    const isModerator = isHost || meeting.moderators.includes(userEmail)

    if (!isModerator) {
      return NextResponse.json({ error: 'Only hosts or moderators can perform admin actions' }, { status: 403 })
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const livekitHost = process.env.NEXT_PUBLIC_LIVEKIT_URL || ''

    if (!apiKey || !apiSecret || apiKey === 'your_livekit_api_key_here') {
      console.warn('[Admin Action] LiveKit credentials not set. Returning mock response.')
      return NextResponse.json({
        success: true,
        mock: true,
        message: `Action '${action}' executed successfully (Mock)`
      })
    }

    // Convert wss:// or ws:// to https:// or http:// for REST room service client
    const httpHost = livekitHost.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')
    const roomService = new RoomServiceClient(httpHost, apiKey, apiSecret)

    if (action === 'mute-all') {
      // Fetch participants in room and mute all non-host audio tracks
      const participants = await roomService.listParticipants(meetingId)
      for (const p of participants) {
        if (p.identity === meeting.hostEmail) continue // skip primary host
        for (const t of p.tracks) {
          if (t.type === 0) { // TrackType.AUDIO = 0
            await roomService.mutePublishedTrack(meetingId, p.identity, t.sid, true)
          }
        }
      }
      return NextResponse.json({ success: true, message: 'All participants muted successfully' })
    }

    if (action === 'mute-user' && targetIdentity && trackSid) {
      await roomService.mutePublishedTrack(meetingId, targetIdentity, trackSid, true)
      return NextResponse.json({ success: true, message: `Muted ${targetIdentity}` })
    }

    if (action === 'kick-user' && targetIdentity) {
      try {
        await roomService.removeParticipant(meetingId, targetIdentity)
      } catch (err) {
        console.warn('[Admin Action] Participant already removed or offline in LiveKit:', err)
      }

      // Mark their lobby status as denied in MongoDB so they cannot request token to rejoin
      const cleanTarget = targetIdentity.trim().toLowerCase()
      const pEntry = meeting.lobby.find((p) => p.email === cleanTarget)
      if (pEntry) {
        pEntry.status = 'denied'
        await meeting.save()
      }

      return NextResponse.json({ success: true, message: `Removed ${targetIdentity} and blocked from rejoining` })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error: any) {
    console.error('Admin action error:', error)
    return NextResponse.json({ error: error.message || 'Admin action failed' }, { status: 500 })
  }
}
