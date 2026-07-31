import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Otp } from '@/lib/db/models/Otp'
import { sendOtpEmail } from '@/lib/brevo'
import { isEmailDomainAllowed, ALLOWED_REGISTRATION_DOMAINS } from '@/lib/auth-domains'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    if (!isEmailDomainAllowed(cleanEmail)) {
      const allowedList = ALLOWED_REGISTRATION_DOMAINS.join(', ')
      return NextResponse.json(
        { error: `Registration is restricted. Email domain must end with ${allowedList}` },
        { status: 403 }
      )
    }

    await connectDB()

    // Generate 6-digit numeric OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete existing OTP for this email
    await Otp.deleteMany({ email: cleanEmail })

    // Save new OTP
    await Otp.create({
      email: cleanEmail,
      code,
      expiresAt
    })

    // Send email via Brevo
    await sendOtpEmail(cleanEmail, code)

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${cleanEmail}`
    })
  } catch (error: any) {
    console.error('send-otp route error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
