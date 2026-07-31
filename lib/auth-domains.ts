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
 * Validates if a user's email domain is allowed to register/log in.
 */
export function isEmailDomainAllowed(email: string): boolean {
  if (!ALLOWED_REGISTRATION_DOMAINS || ALLOWED_REGISTRATION_DOMAINS.length === 0) {
    return true
  }

  const cleanEmail = email.trim().toLowerCase()

  return ALLOWED_REGISTRATION_DOMAINS.some((domain) => {
    const cleanDomain = domain.trim().toLowerCase()
    if (cleanDomain === '*') return true
    const normalizedDomain = cleanDomain.startsWith('@') ? cleanDomain : `@${cleanDomain}`
    return cleanEmail.endsWith(normalizedDomain)
  })
}
