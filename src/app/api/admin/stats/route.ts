import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayIso = startOfDay.toISOString();

  const [usersRes, profilesRes, genTodayRes, genTotalRes, errTodayRes, tokensTodayRes, tokensAllRes, recentRes] =
    await Promise.all([
      admin.from('profiles').select('id', { count: 'exact', head: true }),
      admin.from('profiles').select('tier'),
      admin.from('usage_logs').select('id', { count: 'exact', head: true })
        .eq('status', 'success').eq('action', 'generate').gte('created_at', todayIso),
      admin.from('usage_logs').select('id', { count: 'exact', head: true })
        .eq('status', 'success').eq('action', 'generate'),
      admin.from('usage_logs').select('id', { count: 'exact', head: true })
        .eq('status', 'error').gte('created_at', todayIso),
      admin.from('usage_logs').select('tokens_used').eq('status', 'success').gte('created_at', todayIso),
      admin.from('usage_logs').select('tokens_used').eq('status', 'success'),
      admin.from('usage_logs')
        .select('created_at, action, status, tokens_used, user_id, guest_token')
        .order('created_at', { ascending: false }).limit(20),
    ]);

  const tierBreakdown: Record<string, number> = {};
  (profilesRes.data ?? []).forEach((p: { tier: string }) => {
    tierBreakdown[p.tier] = (tierBreakdown[p.tier] ?? 0) + 1;
  });

  const sumTokens = (rows: { tokens_used: number | null }[] | null) =>
    (rows ?? []).reduce((sum, r) => sum + (r.tokens_used ?? 0), 0);

  return NextResponse.json({
    totalUsers: usersRes.count ?? 0,
    tierBreakdown,
    generatesToday: genTodayRes.count ?? 0,
    generatesTotal: genTotalRes.count ?? 0,
    errorsToday: errTodayRes.count ?? 0,
    tokensToday: sumTokens(tokensTodayRes.data),
    tokensAllTime: sumTokens(tokensAllRes.data),
    recentLogs: recentRes.data ?? [],
  });
}