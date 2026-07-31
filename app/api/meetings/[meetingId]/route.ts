import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Meeting } from '@/lib/db/models/Meeting'
import { getSession } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params
    await connectDB()

    const meeting = await Meeting.findOne({ meetingId })
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, meeting })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching meeting' }, { status: 500 })
  }
}

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
    const { newModeratorEmail } = await req.json()

    if (!newModeratorEmail || typeof newModeratorEmail !== 'string') {
      return NextResponse.json({ error: 'Moderator email is required' }, { status: 400 })
    }

    const cleanEmail = newModeratorEmail.trim().toLowerCase()

    await connectDB()
    const meeting = await Meeting.findOne({ meetingId })

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Only host or existing moderator can add new moderators
    const userEmail = session.email.toLowerCase()
    const isHost = meeting.hostEmail === userEmail
    const isModerator = meeting.moderators.includes(userEmail)

    if (!isHost && !isModerator) {
      return NextResponse.json({ error: 'Only meeting host or moderators can assign new moderators' }, { status: 403 })
    }

    if (!meeting.moderators.includes(cleanEmail)) {
      meeting.moderators.push(cleanEmail)
      await meeting.save()
    }

    return NextResponse.json({
      success: true,
      message: `${cleanEmail} is now a moderator`,
      moderators: meeting.moderators
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update moderators' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { meetingId } = await params
    await connectDB()

    const meeting = await Meeting.findOne({ meetingId })
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Only host can delete the meeting
    if (meeting.hostEmail !== session.email.toLowerCase()) {
      return NextResponse.json({ error: 'Only the meeting host can delete this meeting' }, { status: 403 })
    }

    await Meeting.deleteOne({ meetingId })

    return NextResponse.json({ success: true, message: 'Meeting deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete meeting' }, { status: 500 })
  }
}

