import { currentUser } from '@clerk/nextjs/server'

export interface UserSessionPayload {
  email: string
  name?: string
  role?: string
}

export async function getSession(): Promise<UserSessionPayload | null> {
  try {
    const user = await currentUser()
    if (!user) return null

    const email = user.emailAddresses[0]?.emailAddress
    if (!email) return null

    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || email.split('@')[0]

    return {
      email,
      name,
    }
  } catch (err) {
    console.error('Clerk session error:', err)
    return null
  }
}

