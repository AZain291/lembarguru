import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = !!user && user.email === process.env.ADMIN_EMAIL
  return NextResponse.json({ isAdmin })
}