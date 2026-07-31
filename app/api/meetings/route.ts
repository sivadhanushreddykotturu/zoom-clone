import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Meeting } from '@/lib/db/models/Meeting'
import { getSession } from '@/lib/auth'
import { isMeetingCreationAllowed } from '@/lib/auth-domains'

function parseList(input: any): string[] {
  if (!input) return []
  if (Array.isArray(input)) return input.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
  if (typeof input === 'string') {
    return input
      .split(/[\n,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  }
  return []
}

function sanitizeDomain(domain: string): string {
  let cleaned = domain.trim().toLowerCase()
  if (!cleaned) return ''
  if (!cleaned.startsWith('@') && !cleaned.startsWith('.')) {
    cleaned = `@${cleaned}`
  }
  return cleaned
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    if (!isMeetingCreationAllowed(session.email)) {
      return NextResponse.json(
        { error: 'Only authorized hosts are allowed to create new meetings.' },
        { status: 403 }
      )
    }

    const { title, allowedDomains, allowedEmails, moderators } = await req.json()

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Meeting title is required' }, { status: 400 })
    }

    const parsedDomains = parseList(allowedDomains).map(sanitizeDomain).filter(Boolean)
    const parsedEmails = parseList(allowedEmails)
    const parsedModerators = parseList(moderators)

    // Ensure host is always in moderators list
    const hostEmail = session.email.toLowerCase()
    if (!parsedModerators.includes(hostEmail)) {
      parsedModerators.push(hostEmail)
    }

    await connectDB()

    // Generate unique meetingId (slug format e.g. "room-abc123xyz")
    const meetingId = `room-${Math.random().toString(36).substring(2, 8)}-${Math.random().toString(36).substring(2, 5)}`

    const meeting = await Meeting.create({
      meetingId,
      title: title.trim(),
      hostEmail,
      moderators: parsedModerators,
      allowedDomains: parsedDomains,
      allowedEmails: parsedEmails
    })

    return NextResponse.json({
      success: true,
      meeting: {
        meetingId: meeting.meetingId,
        title: meeting.title,
        hostEmail: meeting.hostEmail,
        moderators: meeting.moderators,
        allowedDomains: meeting.allowedDomains,
        allowedEmails: meeting.allowedEmails,
        createdAt: meeting.createdAt
      }
    })
  } catch (error: any) {
    console.error('Create meeting error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create meeting' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const userEmail = session.email.toLowerCase()

    // Find meetings created by user or where user is moderator or allowed
    const meetings = await Meeting.find({
      $or: [
        { hostEmail: userEmail },
        { moderators: userEmail },
        { allowedEmails: userEmail }
      ]
    }).sort({ createdAt: -1 })

    return NextResponse.json({ success: true, meetings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch meetings' }, { status: 500 })
  }
}
