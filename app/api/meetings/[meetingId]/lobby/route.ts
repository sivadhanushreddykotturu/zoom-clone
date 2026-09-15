import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Meeting } from '@/lib/db/models/Meeting'
import { getSession } from '@/lib/auth'

// Helper to extract session or mock guest session
async function getSessionOrGuest(req: Request) {
  let session = await getSession()
  if (session) return session

  try {
    // For GET requests, check headers or URL params.
    // For POST/PATCH, check body if possible.
    let guestName = ''
    let guestIdentity = ''

    if (req.method === 'GET') {
      const url = new URL(req.url)
      guestName = url.searchParams.get('guestName') || ''
      guestIdentity = url.searchParams.get('guestIdentity') || ''
    } else {
      // We have to read body. If it's already read, this might fail, so we clone.
      const clone = req.clone()
      const body = await clone.json()
      guestName = body.guestName || ''
      guestIdentity = body.guestIdentity || ''
    }

    if (guestName && guestIdentity) {
      return {
        email: guestIdentity,
        name: guestName + ' (Guest)',
        avatar: ''
      }
    }
  } catch (e) {}

  return null
}

// POST: Ask to join waiting room lobby
export async function POST(
  req: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const session = await getSessionOrGuest(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', requiresGuestLogin: true }, { status: 401 })
    }

    const { meetingId } = await params
    await connectDB()

    const meeting = await Meeting.findOne({ meetingId })
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const email = session.email.toLowerCase()
    const name = session.name || email.split('@')[0]

    // If host or moderator, bypass lobby instantly
    const isHost = meeting.hostEmail === email
    const isModerator = isHost || meeting.moderators.includes(email)
    if (isHost || isModerator) {
      return NextResponse.json({ status: 'approved', bypass: true })
    }

    // Check if user has an existing request in the lobby
    const existing = meeting.lobby.find((p: any) => p.email === email)
    if (existing) {
      // If previously denied, allow requesting again (reset status to pending)
      if (existing.status === 'denied') {
        existing.status = 'pending'
        existing.requestedAt = new Date()
        await meeting.save()
      }
      return NextResponse.json({ status: existing.status })
    }

    // Add user to waiting list
    meeting.lobby.push({
      email,
      name,
      status: 'pending',
      requestedAt: new Date(),
    })
    await meeting.save()

    return NextResponse.json({ status: 'pending' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lobby join failed' }, { status: 500 })
  }
}

// GET: Check waiting status or List waiting room lobby users (Hosts/Moderators)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const session = await getSessionOrGuest(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', requiresGuestLogin: true }, { status: 401 })
    }

    const { meetingId } = await params
    await connectDB()

    const meeting = await Meeting.findOne({ meetingId })
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const email = session.email.toLowerCase()
    const isHost = meeting.hostEmail === email
    const isModerator = isHost || meeting.moderators.includes(email)

    // If moderator/host, return full list of pending lobby participants
    if (isHost || isModerator) {
      const pending = meeting.lobby.filter((p: any) => p.status === 'pending')
      return NextResponse.json({ isModerator: true, pending })
    }

    // Else return the requesting user's status
    const participant = meeting.lobby.find((p: any) => p.email === email)
    return NextResponse.json({
      isModerator: false,
      status: participant ? participant.status : 'not_requested',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lobby fetch failed' }, { status: 500 })
  }
}

// PATCH: Approve (Allow) or Discard (Deny) waiting room participants
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { meetingId } = await params
    const { targetEmail, action } = await req.json() // action: 'approve' | 'deny'

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    await connectDB()
    const meeting = await Meeting.findOne({ meetingId })
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const email = session.email.toLowerCase()
    const isHost = meeting.hostEmail === email
    const isModerator = isHost || meeting.moderators.includes(email)

    if (!isHost && !isModerator) {
      return NextResponse.json({ error: 'Only hosts and moderators can approve/deny participants' }, { status: 403 })
    }

    if (action === 'approve-all' || targetEmail === 'all') {
      let count = 0
      meeting.lobby.forEach((p) => {
        if (p.status === 'pending') {
          p.status = 'approved'
          count++
        }
      })
      await meeting.save()
      return NextResponse.json({ success: true, count, status: 'approved' })
    }

    if (!targetEmail) {
      return NextResponse.json({ error: 'targetEmail is required for single approval' }, { status: 400 })
    }

    const cleanTargetEmail = targetEmail.trim().toLowerCase()
    const participant = meeting.lobby.find((p) => p.email === cleanTargetEmail)
    if (!participant) {
      return NextResponse.json({ error: 'Lobby participant not found' }, { status: 404 })
    }

    participant.status = action === 'approve' ? 'approved' : 'denied'
    await meeting.save()

    return NextResponse.json({ success: true, targetEmail: cleanTargetEmail, status: participant.status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lobby update failed' }, { status: 500 })
  }
}
