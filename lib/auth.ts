import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_key_zoom_clone_2026'
)

const COOKIE_NAME = 'zoom_session'

export interface UserSessionPayload {
  email: string
  name?: string
  role?: string
}

export async function createSession(payload: UserSessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  })

  return token
}

export async function getSession(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      email: payload.email as string,
      name: payload.name as string | undefined,
      role: payload.role as string | undefined
    }
  } catch {
    return null
  }
}

export async function removeSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
