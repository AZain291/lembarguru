import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'LembarGuru <no-reply@lembarguru.com>',
    to,
    subject,
    html,
  })

  if (error) {
    console.error('[resend] gagal kirim email:', error)
    throw error
  }
}
