import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IMeeting extends Document {
  meetingId: string
  title: string
  hostEmail: string
  moderators: string[]
  allowedDomains: string[]
  allowedEmails: string[]
  createdAt: Date
}

const MeetingSchema = new Schema<IMeeting>({
  meetingId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  hostEmail: { type: String, required: true, lowercase: true, trim: true },
  moderators: [{ type: String, lowercase: true, trim: true }],
  allowedDomains: [{ type: String, lowercase: true, trim: true }],
  allowedEmails: [{ type: String, lowercase: true, trim: true }],
  createdAt: { type: Date, default: Date.now }
})

export const Meeting: Model<IMeeting> =
  mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema)
