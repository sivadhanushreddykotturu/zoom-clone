import { NextResponse } from 'next/server'
import { WebhookReceiver, RoomServiceClient } from 'livekit-server-sdk'
import { connectDB } from '@/lib/db/connect'
import { Meeting } from '@/lib/db/models/Meeting'

const apiKey = process.env.LIVEKIT_API_KEY || ''
const apiSecret = process.env.LIVEKIT_API_SECRET || ''
const livekitHost = process.env.NEXT_PUBLIC_LIVEKIT_URL || ''

// Skip webhook validation if credentials are not configured
let receiver: WebhookReceiver | null = null
if (apiKey && apiSecret && apiKey !== 'your_livekit_api_key_here') {
  receiver = new WebhookReceiver(apiKey, apiSecret)
}

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!receiver) {
      return new NextResponse('Webhook not configured', { status: 501 })
    }

    const event = receiver.receive(body, authHeader)

    if (event.event === 'participant_left') {
      const roomName = event.room?.name
      const participantIdentity = event.participant?.identity

      if (roomName && participantIdentity) {
        await connectDB()
        const meeting = await Meeting.findOne({ meetingId: roomName })

        if (meeting && meeting.hostEmail === participantIdentity) {
          // Host has left! Let's find a replacement
          const httpHost = livekitHost.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')
          const roomService = new RoomServiceClient(httpHost, apiKey, apiSecret)

          try {
            const participants = await roomService.listParticipants(roomName)
            
            // Find moderators who are currently in the room
            const availableModerators = participants.filter(p => meeting.moderators.includes(p.identity))

            if (availableModerators.length > 0) {
              // Pick a random moderator
              const randomIndex = Math.floor(Math.random() * availableModerators.length)
              const newHost = availableModerators[randomIndex]

              // Update MongoDB
              meeting.hostEmail = newHost.identity
              await meeting.save()

              // Update LiveKit metadata for the new host
              await roomService.updateParticipant(roomName, newHost.identity, JSON.stringify({
                isHost: true,
                isModerator: true,
                email: newHost.identity
              }))
              console.log([Webhook] Host left. Transferred host to )
            } else {
              // No co-hosts available. End the meeting.
              await roomService.deleteRoom(roomName)
              console.log([Webhook] Host left and no co-hosts available. Ended meeting )
            }
          } catch (err) {
            console.error('[Webhook] Error handling host departure:', err)
          }
        }
      }
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}