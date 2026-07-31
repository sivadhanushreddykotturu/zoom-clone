export async function sendOtpEmail(email: string, code: string) {
  const apiKey = process.env.BREVO_API_KEY
  let senderEmail = process.env.BREVO_SENDER_EMAIL || 'sivadhanushkotturu@gmail.com'
  let senderName = process.env.BREVO_SENDER_NAME || 'PhotoDrive'

  // Parse "Name <email@domain.com>" format if provided
  if (senderEmail.includes('<') && senderEmail.includes('>')) {
    const match = senderEmail.match(/([^<]+)<([^>]+)>/)
    if (match) {
      senderName = match[1].trim()
      senderEmail = match[2].trim()
    }
  }


  console.log(`[AUTH OTP] Verification code for ${email} is: ${code}`)

  if (!apiKey || apiKey === 'your_brevo_api_key_here') {
    console.warn('[Brevo] BREVO_API_KEY not configured. OTP printed to console above.')
    return { success: true, mock: true }
  }

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email }],
    subject: `${code} is your ZoomClone login code`,
    htmlContent: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Login Code</title></head>
<body style="margin:0;padding:0;background:#09090b;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:32px;">
        <tr><td align="center" style="padding-bottom:24px;">
          <div style="background:#312e81;border-radius:12px;width:48px;height:48px;display:inline-flex;align-items:center;justify-content:center;">
            <span style="color:#fff;font-size:22px;">📹</span>
          </div>
          <h1 style="color:#f4f4f5;font-size:22px;margin:16px 0 4px;">Your Login Code</h1>
          <p style="color:#71717a;font-size:14px;margin:0;">Use this to sign in to ZoomClone</p>
        </td></tr>
        <tr><td align="center" style="padding:0 0 24px;">
          <div style="background:#09090b;border:1px solid #3730a3;border-radius:10px;padding:20px 40px;display:inline-block;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#818cf8;font-family:monospace;">${code}</span>
          </div>
          <p style="color:#a1a1aa;font-size:13px;margin:16px 0 0;">This code expires in <strong style="color:#f4f4f5;">10 minutes</strong></p>
        </td></tr>
        <tr><td style="border-top:1px solid #27272a;padding-top:20px;">
          <p style="color:#52525b;font-size:12px;text-align:center;margin:0;">If you did not request this, please ignore this email. Do not share this code with anyone.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    console.error('[Brevo API Error]', res.status, errorBody)
    throw new Error(`Brevo email send failed (${res.status}): ${errorBody}`)
  }

  const resJson = await res.json()
  console.log('[Brevo] Email sent successfully. MessageId:', resJson.messageId)
  return { success: true, messageId: resJson.messageId }
}
