/**
 * Central Configuration for Allowed Registration Email Domains.
 * 
 * To add new allowed email domains in the future, simply add them to the 
 * ALLOWED_REGISTRATION_DOMAINS array below (e.g. ['@kluniversity.in', '@gmail.com']).
 */

export const ALLOWED_REGISTRATION_DOMAINS: string[] = [
  '@kluniversity.in',
  // Add new allowed email domains here in the future:
  // '@gmail.com',
  // '@outlook.com',
]

/**
 * Central Configuration for Authorized Meeting Creators (Hosts).
 * 
 * To restrict meeting creation to specific emails (to conserve LiveKit credits),
 * add authorized host email addresses to the ALLOWED_MEETING_CREATORS array below.
 * 
 * Note: Emails explicitly listed here are ALWAYS allowed to log in (bypass domain restriction)
 * and create meetings.
 */
export const ALLOWED_MEETING_CREATORS: string[] = [
  'sivadhanushkotturu@gmail.com',
  // Add additional authorized host emails here in the future:
  // '2400032717@kluniversity.in',
]

/**
 * Validates if a user's email is allowed to register/log in.
 * - Authorized meeting creators (e.g. sivadhanushkotturu@gmail.com) are ALWAYS allowed.
 * - Other users must match ALLOWED_REGISTRATION_DOMAINS (e.g. @kluniversity.in).
 */
export function isEmailDomainAllowed(email: string): boolean {
  const cleanEmail = email.trim().toLowerCase()

  // 1. Authorized hosts/creators are always allowed to log in
  if (ALLOWED_MEETING_CREATORS.some((creator) => creator.trim().toLowerCase() === cleanEmail)) {
    return true
  }

  if (!ALLOWED_REGISTRATION_DOMAINS || ALLOWED_REGISTRATION_DOMAINS.length === 0) {
    return true
  }

  // 2. Validate against general allowed registration domains
  return ALLOWED_REGISTRATION_DOMAINS.some((domain) => {
    const cleanDomain = domain.trim().toLowerCase()
    if (cleanDomain === '*') return true
    const normalizedDomain = cleanDomain.startsWith('@') ? cleanDomain : `@${cleanDomain}`
    return cleanEmail.endsWith(normalizedDomain)
  })
}

/**
 * Validates if a user's email is authorized to create/host new meetings.
 */
export function isMeetingCreationAllowed(email: string): boolean {
  if (!ALLOWED_MEETING_CREATORS || ALLOWED_MEETING_CREATORS.length === 0) {
    return true
  }

  const cleanEmail = email.trim().toLowerCase()

  return ALLOWED_MEETING_CREATORS.some((creator) => {
    const cleanCreator = creator.trim().toLowerCase()
    if (cleanCreator === '*') return true
    return cleanEmail === cleanCreator
  })
}
