import re

with open('app/room/[meetingId]/page.tsx', 'r') as f:
    content = f.read()

# Add states for guest login
state_injection = """  const [requiresGuestLogin, setRequiresGuestLogin] = useState(false)
  const [guestNameInput, setGuestNameInput] = useState('')"""

content = re.sub(
    r'(const \[connected, setConnected\] = useState\(false\))',
    r'\1\n' + state_injection,
    content
)

# Update fetchToken logic
old_fetchToken = """    async function fetchToken() {
      try {
        // Try lobby registration first
        const lobbyCheck = await fetch(/api/meetings//lobby, { method: 'POST' })"""

new_fetchToken = """    async function fetchToken() {
      try {
        const guestName = localStorage.getItem('guestName') || ''
        const guestIdentity = localStorage.getItem('guestIdentity') || ''
        
        // Try lobby registration first
        const lobbyCheck = await fetch(/api/meetings//lobby, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestName, guestIdentity })
        })"""

content = content.replace(old_fetchToken, new_fetchToken)

old_token_fetch = """        // Fetch LiveKit Token
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId }),
        })"""

new_token_fetch = """        // Fetch LiveKit Token
        const guestName = localStorage.getItem('guestName') || ''
        const guestIdentity = localStorage.getItem('guestIdentity') || ''
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId, guestName, guestIdentity }),
        })"""

content = content.replace(old_token_fetch, new_token_fetch)

old_401_handler = """          if (!res.ok) {
          if (res.status === 401) {
            router.push(/login?redirect=/room/)
            return
          }"""
# Note: wait, let's just do a regex replace for the 401 handler
content = re.sub(
    r'if \(res\.status === 401\) \{\s*router\.push\([^)]+\)\s*return\s*\}',
    r'''if (res.status === 401) {
            if (data.requiresGuestLogin) {
              setRequiresGuestLogin(true)
              setLoading(false)
            } else {
              router.push(/login?redirect=/room/)
            }
            return
          }''',
    content
)

# Add the Guest UI rendering before the error UI view
guest_ui = """
  if (requiresGuestLogin) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black px-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">Join Meeting</h1>
            <p className="mt-2 text-sm text-zinc-400">Enter your name to join as a guest, or log in.</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!guestNameInput.trim()) return;
            const identity = guest_@guest.local;
            localStorage.setItem('guestIdentity', identity);
            localStorage.setItem('guestName', guestNameInput.trim());
            setRequiresGuestLogin(false);
            setLoading(true);
            // It will trigger the useEffect to fetch token again
          }} className="space-y-4">
            <div>
              <label htmlFor="guestName" className="block text-sm font-medium text-zinc-300 mb-1">Display Name</label>
              <input
                id="guestName"
                type="text"
                value={guestNameInput}
                onChange={e => setGuestNameInput(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Join as Guest
            </button>
          </form>
          <div className="text-center">
            <p className="text-sm text-zinc-400">
              Already have an account? <Link href={/login?redirect=/room/} className="text-indigo-400 hover:text-indigo-300">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- error UI view ---"""

content = content.replace('  // --- error UI view ---', guest_ui)

with open('app/room/[meetingId]/page.tsx', 'w') as f:
    f.write(content)
print("Updated room page")
