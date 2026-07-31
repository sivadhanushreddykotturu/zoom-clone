import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Otp } from '@/lib/db/models/Otp'
import { User } from '@/lib/db/models/User'
import { createSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, code, name } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and OTP code are required' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanCode = code.trim()

    await connectDB()

    const otpDoc = await Otp.findOne({ email: cleanEmail, code: cleanCode })

    if (!otpDoc) {
      return NextResponse.json({ error: 'Invalid or expired OTP code' }, { status: 400 })
    }

    if (new Date() > otpDoc.expiresAt) {
      await Otp.deleteOne({ _id: otpDoc._id })
      return NextResponse.json({ error: 'OTP code has expired' }, { status: 400 })
    }

    // OTP verified successfully, clean it up
    await Otp.deleteOne({ _id: otpDoc._id })

    // Find or create User
    let user = await User.findOne({ email: cleanEmail })
    if (!user) {
      const derivedName = name?.trim() || cleanEmail.split('@')[0]
      user = await User.create({
        email: cleanEmail,
        name: derivedName
      })
    } else if (name && name.trim()) {
      user.name = name.trim()
      await user.save()
    }

    // Create session cookie
    await createSession({
      email: user.email,
      name: user.name,
      role: user.role
    })

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('verify-otp route error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
