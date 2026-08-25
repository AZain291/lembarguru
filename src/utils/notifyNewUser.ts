import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface NewUserInfo {
  email: string
  name?: string | null
  phone?: string | null
  method?: 'email' | 'google'
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

// Notifikasi admin saat ada pendaftaran user baru -- dipanggil dari
// /api/notify/new-user (dipicu client di register/page.tsx & login/page.tsx
// setelah signUp email/password sukses) dan langsung dari
// auth/callback/route.ts untuk signup lewat Google. Best-effort: kegagalan
// di sini TIDAK BOLEH menggagalkan pendaftaran user, jadi semua error
// ditelan & di-log saja, tidak pernah throw ke pemanggil.
export async function notifyNewUser({ email, name, phone, method }: NewUserInfo): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || !process.env.RESEND_API_KEY) return

  try {
    await resend.emails.send({
      from: 'LembarGuru <noreply@lembarguru.com>',
      to: adminEmail,
      subject: 'Pendaftaran user baru di LembarGuru',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111827;">Pendaftaran user baru</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Ada user baru mendaftar di LembarGuru${method === 'google' ? ' lewat Google' : ''}.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
            <tr><td style="padding: 4px 8px 4px 0; color: #6b7280;">Nama</td><td style="padding: 4px 0; color: #111827; font-weight: 600;">${escapeHtml(name || '-')}</td></tr>
            <tr><td style="padding: 4px 8px 4px 0; color: #6b7280;">Email</td><td style="padding: 4px 0; color: #111827; font-weight: 600;">${escapeHtml(email)}</td></tr>
            <tr><td style="padding: 4px 8px 4px 0; color: #6b7280;">WhatsApp</td><td style="padding: 4px 0; color: #111827; font-weight: 600;">${escapeHtml(phone || '-')}</td></tr>
          </table>
        </div>
      `,
    })
  } catch (e: any) {
    console.error('[notifyNewUser] gagal kirim email admin:', e.message)
  }
}
