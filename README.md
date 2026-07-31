# Zoom Clone

A premium live audio meeting room. Drop in, listen, and speak with the community. Protected by Brevo Transactional Email Auth, MongoDB, and LiveKit.

## Setup

1. Copy `.env.local.example` or create `.env.local` and add the following variables:
   - `MONGODB_URI`
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL`
   - `BREVO_SENDER_NAME`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `NEXT_PUBLIC_LIVEKIT_URL`
   - `JWT_SECRET`

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run development server:
   ```bash
   npm run dev
   ```
