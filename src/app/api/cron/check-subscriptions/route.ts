import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const resend = new Resend(process.env.RESEND_API_KEY)

// Jalan harian via Vercel Cron. Melakukan 2 hal:
// 1. Downgrade user yang tier_expires_at sudah lewat -> tier 'free'
// 2. Kirim email reminder ke user yang akan expired dalam 3 hari
export async function GET(request: NextRequest) {
  // Proteksi: hanya Vercel Cron yang boleh memanggil endpoint ini
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()

  const results = {
    downgraded: 0,
    remindersSent: 0,
    errors: [] as string[],
  }

  try {
    // ── 1. DOWNGRADE: cari user pro/guru yang sudah lewat tier_expires_at ──
    const { data: expiredUsers, error: expiredErr } = await admin
      .from('profiles')
      .select('id, email, tier, tier_expires_at')
      .neq('tier', 'free')
      .not('tier_expires_at', 'is', null)
      .lt('tier_expires_at', now.toISOString())

    if (expiredErr) throw expiredErr

    if (expiredUsers && expiredUsers.length > 0) {
      const expiredIds = expiredUsers.map(u => u.id)

      const { error: downgradeErr } = await admin
        .from('profiles')
        .update({ tier: 'free', tier_expires_at: null, updated_at: now.toISOString() })
        .in('id', expiredIds)

      if (downgradeErr) throw downgradeErr

      results.downgraded = expiredUsers.length
      console.log(`[cron] Downgraded ${expiredUsers.length} user(s) to free:`, expiredIds)

      // Kirim email "subscription berakhir"
      for (const user of expiredUsers) {
        if (!user.email) continue
        try {
          await resend.emails.send({
            from: 'LembarGuru <noreply@lembarguru.com>',
            to: user.email,
            subject: 'Langganan LembarGuru Anda telah berakhir',
            html: expiredEmailTemplate(user.tier),
          })
        } catch (e: any) {
          results.errors.push(`Failed expired email to ${user.email}: ${e.message}`)
        }
      }
    }

    // ── 2. REMINDER: cari user yang akan expired dalam 3 hari ke depan ──
    const threeDaysFromNow = new Date(now.getTime() + 3 * 86400000)

    const { data: expiringUsers, error: expiringErr } = await admin
      .from('profiles')
      .select('id, email, tier, tier_expires_at')
      .neq('tier', 'free')
      .not('tier_expires_at', 'is', null)
      .gte('tier_expires_at', now.toISOString())
      .lte('tier_expires_at', threeDaysFromNow.toISOString())

    if (expiringErr) throw expiringErr

    if (expiringUsers && expiringUsers.length > 0) {
      for (const user of expiringUsers) {
        if (!user.email) continue

        // Cek apakah reminder untuk order/period ini sudah pernah dikirim
        // (pakai tabel reminder_logs sederhana agar tidak kirim berkali-kali)
        const { data: alreadySent } = await admin
          .from('reminder_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('tier_expires_at', user.tier_expires_at)
          .maybeSingle()

        if (alreadySent) continue

        try {
          const daysLeft = Math.ceil(
            (new Date(user.tier_expires_at!).getTime() - now.getTime()) / 86400000
          )
          await resend.emails.send({
            from: 'LembarGuru <noreply@lembarguru.com>',
            to: user.email,
            subject: `Langganan ${user.tier === 'pro' ? 'Pro' : 'Guru Lengkap'} Anda akan berakhir dalam ${daysLeft} hari`,
            html: reminderEmailTemplate(user.tier, daysLeft),
          })

          await admin.from('reminder_logs').insert({
            user_id: user.id,
            tier_expires_at: user.tier_expires_at,
            sent_at: now.toISOString(),
          })

          results.remindersSent++
        } catch (e: any) {
          results.errors.push(`Failed reminder email to ${user.email}: ${e.message}`)
        }
      }
    }

    console.log('[cron] check-subscriptions result:', results)
    return NextResponse.json({ success: true, ...results })
  } catch (error: any) {
    console.error('[cron] check-subscriptions error:', error)
    return NextResponse.json({ error: error.message, ...results }, { status: 500 })
  }
}

function expiredEmailTemplate(tier: string): string {
  const tierName = tier === 'pro' ? 'Pro' : 'Guru Lengkap'
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111827;">Langganan ${tierName} Anda telah berakhir</h2>
      <p style="color: #4b5563; line-height: 1.6;">
        Akun Anda telah kembali ke paket Free. Anda masih bisa menggunakan LembarGuru dengan kuota terbatas,
        atau perpanjang langganan untuk kembali menikmati fitur lengkap.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/?upgrade=1"
         style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 12px;">
        Perpanjang Langganan
      </a>
    </div>
  `
}

function reminderEmailTemplate(tier: string, daysLeft: number): string {
  const tierName = tier === 'pro' ? 'Pro' : 'Guru Lengkap'
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111827;">Langganan ${tierName} Anda akan segera berakhir</h2>
      <p style="color: #4b5563; line-height: 1.6;">
        Langganan Anda akan berakhir dalam <strong>${daysLeft} hari</strong>. Perpanjang sekarang
        agar tidak kehilangan akses ke fitur lengkap LembarGuru.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/?upgrade=1"
         style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 12px;">
        Perpanjang Sekarang
      </a>
    </div>
  `
}
