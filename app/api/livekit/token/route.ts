import { NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { connectDB } from '@/lib/db/connect'
import { Meeting } from '@/lib/db/models/Meeting'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to join.' }, { status: 401 })
    }

    const { meetingId } = await req.json()
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 })
    }

    await connectDB()
    const meeting = await Meeting.findOne({ meetingId })

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const userEmail = session.email.toLowerCase()
    const isHost = meeting.hostEmail === userEmail
    const isModerator = isHost || meeting.moderators.includes(userEmail)

    const lobbyEntry = meeting.lobby.find((p) => p.email === userEmail)
    const isApprovedInLobby = lobbyEntry && lobbyEntry.status === 'approved'

    // Enforce lobby waiting room check for regular participants
    if (!isHost && !isModerator && !isApprovedInLobby) {
      return NextResponse.json(
        {
          error: 'Lobby Approval Required: You must be let in by the host/moderators to join this meeting.',
          lobbyRequired: true,
        },
        { status: 403 }
      )
    }

    // Access control check
    const hasAllowedEmails = meeting.allowedEmails && meeting.allowedEmails.length > 0
    const hasAllowedDomains = meeting.allowedDomains && meeting.allowedDomains.length > 0

    let isAllowed = isHost || isModerator || isApprovedInLobby

    if (!isAllowed) {
      // Check explicit allowed emails
      if (hasAllowedEmails && meeting.allowedEmails.includes(userEmail)) {
        isAllowed = true
      }

      // Check allowed domains (e.g. "@gmail.com", "@kluniversity.com", ".ac.uk")
      if (!isAllowed && hasAllowedDomains) {
        const userDomain = userEmail.substring(userEmail.indexOf('@')) // e.g. "@gmail.com"
        isAllowed = meeting.allowedDomains.some((domain: string) => {
          const cleanDomain = domain.toLowerCase()
          return (
            userDomain === cleanDomain ||
            userEmail.endsWith(cleanDomain) ||
            userDomain.endsWith(cleanDomain)
          )
        })
      }

      // If no domain or email restrictions were specified by creator, allow any authenticated user
      if (!hasAllowedEmails && !hasAllowedDomains) {
        isAllowed = true
      }
    }

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: `Access Denied: Your email (${session.email}) is not authorized to join this meeting.`,
          allowedDomains: meeting.allowedDomains,
          allowedEmails: meeting.allowedEmails
        },
        { status: 403 }
      )
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!apiKey || !apiSecret || apiKey === 'your_livekit_api_key_here') {
      console.warn('[LiveKit Token] API key/secret not set in env. Returning fallback token.')
      return NextResponse.json({
        token: 'mock_livekit_token_' + Date.now(),
        serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880',
        isHost,
        isModerator,
        moderators: meeting.moderators,
        meetingTitle: meeting.title,
        user: { email: session.email, name: session.name }
      })
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: session.email,
      name: session.name || session.email.split('@')[0],
      metadata: JSON.stringify({
        isHost,
        isModerator,
        email: session.email
      })
    })

    at.addGrant({
      roomJoin: true,
      room: meetingId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    const token = await at.toJwt()

    return NextResponse.json({
      token,
      serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.livekit.cloud',
      isHost,
      isModerator,
      moderators: meeting.moderators,
      meetingTitle: meeting.title,
      user: { email: session.email, name: session.name }
    })
  } catch (error: any) {
    console.error('LiveKit token generation error:', error)
    return NextResponse.json({ error: error.message || 'Token generation failed' }, { status: 500 })
  }
}
