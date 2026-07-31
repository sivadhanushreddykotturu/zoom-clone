import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IOtp extends Document {
  email: string
  code: string
  expiresAt: Date
  createdAt: Date
}

const OtpSchema = new Schema<IOtp>({
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // TTL index automatically deletes after 10 minutes
})

export const Otp: Model<IOtp> = mongoose.models.Otp || mongoose.model<IOtp>('Otp', OtpSchema)
