import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IVote {
  voterEmail: string
  optionIndex: number
}

export interface IPoll {
  pollId: string
  question: string
  options: string[]
  votes: IVote[]
  status: 'active' | 'ended'
  createdAt: Date
}

export interface ILobbyParticipant {
  email: string
  name: string
  status: 'pending' | 'approved' | 'denied'
  requestedAt: Date
}

export interface IMeeting extends Document {
  meetingId: string
  title: string
  hostEmail: string
  moderators: string[]
  allowedDomains: string[]
  allowedEmails: string[]
  lobby: ILobbyParticipant[]
  polls: IPoll[]
  createdAt: Date
}

const PollSchema = new Schema<IPoll>({
  pollId: { type: String, required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  votes: [
    {
      voterEmail: { type: String, required: true, lowercase: true, trim: true },
      optionIndex: { type: Number, required: true }
    }
  ],
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
})

const MeetingSchema = new Schema<IMeeting>({
  meetingId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  hostEmail: { type: String, required: true, lowercase: true, trim: true },
  moderators: [{ type: String, lowercase: true, trim: true }],
  allowedDomains: [{ type: String, lowercase: true, trim: true }],
  allowedEmails: [{ type: String, lowercase: true, trim: true }],
  lobby: [
    {
      email: { type: String, lowercase: true, trim: true },
      name: { type: String },
      status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
      requestedAt: { type: Date, default: Date.now },
    },
  ],
  polls: [PollSchema],
  createdAt: { type: Date, default: Date.now }
})

export const Meeting: Model<IMeeting> =
  mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema)
