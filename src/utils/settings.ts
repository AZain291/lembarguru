// Key-value generik untuk pengaturan global (migration 0008 -- lihat
// src/utils/supabase/migrations/0008_app_settings.sql). Kalau tabelnya
// belum ada / baris belum ada, semua fungsi di sini fallback diam-diam
// (pola yang sama dengan getDynamicTierLimits() di usage.ts) supaya fitur
// yang bergantung padanya tidak error, cuma pakai nilai default.

export async function getSetting<T>(admin: any, key: string, fallback: T): Promise<T> {
  try {
    const { data, error } = await admin.from('app_settings').select('value').eq('key', key).maybeSingle()
    if (error || !data) return fallback
    return (data.value ?? fallback) as T
  } catch {
    return fallback
  }
}

export async function setSetting(admin: any, key: string, value: unknown): Promise<void> {
  const { error } = await admin
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
  if (error) throw error
}

export const REFERRAL_COMMISSION_KEY = 'referral_commission_percent'
export const DEFAULT_REFERRAL_COMMISSION_PERCENT = 10

// Persentase dari harga paket yang dicatat sebagai reward referral saat
// pembayaran pertama berhasil -- admin-editable lewat tab "Referral"
// (/api/admin/referrals), dipakai oleh upgradeUserForOrder() di
// src/utils/subscription.ts.
export async function getReferralCommissionPercent(admin: any): Promise<number> {
  const value = await getSetting<number>(admin, REFERRAL_COMMISSION_KEY, DEFAULT_REFERRAL_COMMISSION_PERCENT)
  const num = Number(value)
  return Number.isFinite(num) && num >= 0 ? num : DEFAULT_REFERRAL_COMMISSION_PERCENT
}
