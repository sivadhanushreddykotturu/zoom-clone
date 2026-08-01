import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Meeting } from '@/lib/db/models/Meeting'
import { getSession } from '@/lib/auth'

// GET: Fetch all polls for a given meeting
export async function GET(
  req: Request,
  props: { params: Promise<{ meetingId: string }> }
) {
  const params = await props.params;
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const meeting = await Meeting.findOne({ meetingId: params.meetingId })
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    return NextResponse.json({ polls: meeting.polls || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Create/Launch a new poll
export async function POST(
  req: Request,
  props: { params: Promise<{ meetingId: string }> }
) {
  const params = await props.params;
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { question, options } = await req.json()
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: 'Question and at least 2 options are required' }, { status: 400 })
    }

    await connectDB()
    const meeting = await Meeting.findOne({ meetingId: params.meetingId })
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Verify moderator privileges
    const userEmail = session.email.toLowerCase()
    const isHost = meeting.hostEmail === userEmail
    const isModerator = isHost || meeting.moderators.includes(userEmail)
    if (!isModerator) {
      return NextResponse.json({ error: 'Only moderators can create polls' }, { status: 403 })
    }

    const newPoll = {
      pollId: 'poll-' + Math.random().toString(36).substring(2, 11),
      question,
      options,
      votes: [],
      status: 'active' as const,
      createdAt: new Date()
    }

    meeting.polls.push(newPoll)
    await meeting.save()

    return NextResponse.json({ poll: newPoll })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: Vote, Change Vote, or Close a Poll
export async function PATCH(
  req: Request,
  props: { params: Promise<{ meetingId: string }> }
) {
  const params = await props.params;
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pollId, optionIndex, closePoll } = await req.json()
    if (!pollId) {
      return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 })
    }

    await connectDB()
    const meeting = await Meeting.findOne({ meetingId: params.meetingId })
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const poll = meeting.polls.find((p) => p.pollId === pollId)
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    const userEmail = session.email.toLowerCase()

    // Handle closing the poll
    if (closePoll) {
      const isHost = meeting.hostEmail === userEmail
      const isModerator = isHost || meeting.moderators.includes(userEmail)
      if (!isModerator) {
        return NextResponse.json({ error: 'Only moderators can close polls' }, { status: 403 })
      }

      poll.status = 'ended'
      await meeting.save()
      return NextResponse.json({ poll })
    }

    // Handle voting or changing a vote
    if (poll.status !== 'active') {
      return NextResponse.json({ error: 'Voting has ended for this poll' }, { status: 400 })
    }

    if (optionIndex === undefined || optionIndex < 0 || optionIndex >= poll.options.length) {
      return NextResponse.json({ error: 'Invalid option index' }, { status: 400 })
    }

    // Look for existing vote to allow changing votes
    const existingVoteIndex = poll.votes.findIndex((v) => v.voterEmail === userEmail)

    if (existingVoteIndex > -1) {
      // Update existing vote
      poll.votes[existingVoteIndex].optionIndex = optionIndex
    } else {
      // Add new vote
      poll.votes.push({
        voterEmail: userEmail,
        optionIndex
      })
    }

    // Mongoose schema modification tracking
    meeting.markModified('polls')
    await meeting.save()

    return NextResponse.json({ poll })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
