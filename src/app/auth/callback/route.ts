import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { notifyNewUser } from '@/utils/notifyNewUser'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { data } = await supabase.auth.exchangeCodeForSession(code)
    const user = data.user

    // Supabase tidak memberi flag "user baru" eksplisit dari OAuth callback --
    // heuristik yang dipakai di sini: created_at & last_sign_in_at cuma
    // berjarak beberapa detik untuk sign-in Google PERTAMA (baru dibuatkan
    // baris auth.users), sementara login ulang berikutnya jaraknya jauh.
    if (user?.email && user.created_at && user.last_sign_in_at) {
      const createdAt = new Date(user.created_at).getTime()
      const lastSignInAt = new Date(user.last_sign_in_at).getTime()
      if (Math.abs(lastSignInAt - createdAt) < 10_000) {
        const name = (user.user_metadata?.full_name || user.user_metadata?.name) as string | undefined
        try {
          await notifyNewUser({ email: user.email, name, method: 'google' })
        } catch {
          // gagal kirim notifikasi admin tidak boleh menggagalkan login Google
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/confirm`)
}
