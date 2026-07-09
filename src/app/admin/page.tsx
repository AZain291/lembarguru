'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { MAPEL, KELAS_LIST } from '@/lib/subjectOptions'
import { TEACHER_TOOLS } from '@/lib/teacherTools'

interface LogRow {
  created_at: string; action: string; status: string
  tokens_used: number | null; user_id: string | null; guest_token: string | null
  user_display: string
}
interface Stats {
  totalUsers: number; tierBreakdown: Record<string, number>
  generatesToday: number; generatesTotal: number; errorsToday: number
  tokensToday: number; tokensAllTime: number; recentLogs: LogRow[]
}
interface TierRow {
  tier: string; label: string; price_monthly: number; price_yearly: number
  active: boolean; max_soal: number; max_gen_per_day: number | null; unlimited_gen: boolean
  bank_soal_jumlah: number | null; bank_soal_acak: boolean
  bank_soal_mapel: string | null; bank_soal_kelas: string | null
  enabled_tools: string[] | null
}
interface GeneratedSoalRow {
  id: string; mapel: string; kelas: string | null; kurikulum: string | null
  tipe: string | null; teks: string; hidden: boolean; created_at: string
}
interface UserRow {
  id: string; email: string; tier: string; tier_expires_at: string | null
  created_at: string; total_generates: number
  name: string | null; phone: string | null
}
interface OrderRow {
  order_id: string; user_id: string; email: string
  tier: string; period: string; amount: number; discount_amount: number | null
  status: 'pending' | 'success' | 'failed'
  paid_at: string | null; created_at: string
}
interface ReferralRow {
  id: string; code: string; referrerEmail: string; referredEmail: string
  status: 'pending' | 'success' | 'cancelled'
  reward_amount: number | null; paid_at: string | null; created_at: string
}

const S = {
  bg: '#0f1115', card: '#1a1d24', border: '#2a2e38', text: '#f3f4f6',
  muted: '#9ca3af', accent: '#3b82f6', green: '#4ade80', red: '#ef4444',
}
const inp: React.CSSProperties = {
  background: '#22262f', border: '1px solid #343844', borderRadius: 6,
  color: '#fff', padding: '6px 8px', fontSize: 12,
}

function Card({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: S.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color ?? S.text }}>{value}</div>
    </div>
  )
}
function Th({ c }: { c: string }) { return <th style={{ padding: '8px 10px', fontWeight: 600, color: S.muted, textAlign: 'left' }}>{c}</th> }
function Td({ c, style }: { c: React.ReactNode; style?: React.CSSProperties }) { return <td style={{ padding: '8px 10px', ...style }}>{c}</td> }
function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: S.bg, color: S.text }}>{children}</div>
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tiers, setTiers] = useState<TierRow[]>([])
  const [promos, setPromos] = useState<any[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [savingTier, setSavingTier] = useState<string | null>(null)
  const [tierMsg, setTierMsg] = useState('')
  const [newPromo, setNewPromo] = useState({ code: '', discount_type: 'percent', discount_value: 10, applies_to: 'all', max_uses: '', valid_until: '' })
  const [promoMsg, setPromoMsg] = useState('')
  const [activeTab, setActiveTab] = useState<'stats' | 'tiers' | 'promos' | 'users' | 'orders' | 'soal' | 'referral' | 'tools'>('stats')
  const [toolsMsg, setToolsMsg] = useState('')
  const [savingTools, setSavingTools] = useState(false)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null)
  const [orderMsg, setOrderMsg] = useState('')
  const [referrals, setReferrals] = useState<ReferralRow[]>([])
  const [refActionLoading, setRefActionLoading] = useState<string | null>(null)
  const [refMsg, setRefMsg] = useState('')
  const [commissionPercent, setCommissionPercent] = useState<number>(10)
  const [commissionInput, setCommissionInput] = useState('10')
  const [savingCommission, setSavingCommission] = useState(false)
  const [commissionMsg, setCommissionMsg] = useState('')
  const [soalList, setSoalList] = useState<GeneratedSoalRow[]>([])
  const [soalActionLoading, setSoalActionLoading] = useState<string | null>(null)
  const [soalMsg, setSoalMsg] = useState('')
  const [soalFilter, setSoalFilter] = useState<'semua' | 'tampil' | 'sembunyi'>('semua')
  const [changingUserTier, setChangingUserTier] = useState<string | null>(null)
  const [sharePromo, setSharePromo] = useState<any | null>(null)
  const [userTierExpiry, setUserTierExpiry] = useState<Record<string, string>>({})
  const [editProfile, setEditProfile] = useState<Record<string, { name: string; phone: string }>>({})
  const [savingProfile, setSavingProfile] = useState<string | null>(null)

  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async res => {
        if (res.status === 403) throw new Error('Anda tidak punya akses ke halaman ini.')
        if (!res.ok) throw new Error('Gagal memuat data.')
        return res.json()
      })
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))

    fetch('/api/admin/pricing').then(r => r.json()).then(d => {
      const ORDER = ['guest', 'free', 'pro', 'guru']
      const sorted = (d.tiers ?? []).sort((a: TierRow, b: TierRow) =>
        ORDER.indexOf(a.tier) - ORDER.indexOf(b.tier)
      )
      setTiers(sorted)
    })
    fetch('/api/admin/promos').then(r => r.json()).then(d => setPromos(d.promos ?? []))
    fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users ?? []))
    fetch('/api/admin/orders').then(r => r.json()).then(d => setOrders(d.orders ?? []))
    fetch('/api/admin/generated-soal').then(r => r.json()).then(d => setSoalList(d.soal ?? []))
    fetch('/api/admin/referrals').then(r => r.json()).then(d => {
      setReferrals(d.redemptions ?? [])
      if (typeof d.commissionPercent === 'number') {
        setCommissionPercent(d.commissionPercent)
        setCommissionInput(String(d.commissionPercent))
      }
    })
  }, [])

  if (loading) return <Centered>Memuat...</Centered>
  if (error) return <Centered>{error}</Centered>
  if (!stats) return null

  async function saveTier(tier: TierRow) {
    setSavingTier(tier.tier); setTierMsg('')
    const res = await fetch('/api/admin/pricing', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tier),
    })
    const data = await res.json().catch(() => ({}))
    setSavingTier(null)
    setTierMsg(res.ok ? '✅ Tersimpan' : `❌ Gagal menyimpan: ${data.error || 'unknown error'}`)
    setTimeout(() => setTierMsg(''), 6000)
  }

  function updateTierField(tierKey: string, field: string, value: any) {
    setTiers(prev => prev.map(t => t.tier === tierKey ? { ...t, [field]: value } : t))
  }

  async function reloadPromos() {
    fetch('/api/admin/promos').then(r => r.json()).then(d => setPromos(d.promos ?? []))
  }

  async function createPromo() {
    setPromoMsg('')
    const res = await fetch('/api/admin/promos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newPromo, discount_value: Number(newPromo.discount_value), max_uses: newPromo.max_uses ? Number(newPromo.max_uses) : null, valid_until: newPromo.valid_until || null }),
    })
    const data = await res.json()
    if (!res.ok) { setPromoMsg(data.error || 'Gagal'); return }
    setNewPromo({ code: '', discount_type: 'percent', discount_value: 10, applies_to: 'all', max_uses: '', valid_until: '' })
    reloadPromos()
    setPromoMsg('✅ Promo berhasil dibuat')
    setTimeout(() => setPromoMsg(''), 3000)
  }

  async function togglePromo(id: string, active: boolean) {
    await fetch('/api/admin/promos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: !active }) })
    reloadPromos()
  }

  async function deletePromo(id: string) {
    if (!confirm('Hapus promo ini?')) return
    await fetch('/api/admin/promos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    reloadPromos()
  }

  async function changeUserTier(userId: string, newTier: string) {
    setChangingUserTier(userId)
    // Hitung default expiry: 30 hari dari sekarang jika tier bukan free
    const defaultExpiry = newTier === 'free' ? null : new Date(Date.now() + 30 * 86400000).toISOString()
    const customExpiry = userTierExpiry[userId]
    const tierExpiresAt = newTier === 'free' ? null : (customExpiry ? new Date(customExpiry).toISOString() : defaultExpiry)

    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, tier: newTier, tier_expires_at: tierExpiresAt }),
    })
    fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users ?? []))
    setChangingUserTier(null)
  }

  function profileField(u: UserRow, field: 'name' | 'phone'): string {
    return editProfile[u.id]?.[field] ?? u[field] ?? ''
  }

  function setProfileField(u: UserRow, field: 'name' | 'phone', value: string) {
    setEditProfile(prev => ({
      ...prev,
      [u.id]: {
        name: field === 'name' ? value : profileField(u, 'name'),
        phone: field === 'phone' ? value : profileField(u, 'phone'),
      },
    }))
  }

  async function saveUserProfile(u: UserRow) {
    setSavingProfile(u.id)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id, name: profileField(u, 'name').trim(), phone: profileField(u, 'phone').trim() }),
    })
    const data = await fetch('/api/admin/users').then(r => r.json())
    setUsers(data.users ?? [])
    setEditProfile(prev => {
      const next = { ...prev }
      delete next[u.id]
      return next
    })
    setSavingProfile(null)
  }

  async function reloadOrders() {
    const data = await fetch('/api/admin/orders').then(r => r.json())
    setOrders(data.orders ?? [])
  }

  async function markOrderSuccess(orderId: string) {
    if (!confirm('Tandai transaksi ini sukses dan naikkan tier user secara manual?')) return
    setOrderActionLoading(orderId); setOrderMsg('')
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, action: 'mark_success' }),
      })
      const data = await res.json()
      setOrderMsg(res.ok ? '✅ Tier user berhasil dinaikkan' : `❌ ${data.error || 'Gagal'}`)
      await reloadOrders()
    } catch {
      setOrderMsg('❌ Gagal menghubungi server, coba lagi')
    }
    setOrderActionLoading(null)
    setTimeout(() => setOrderMsg(''), 4000)
  }

  async function markOrderFailed(orderId: string) {
    if (!confirm('Batalkan transaksi ini? Kalau sebelumnya sukses, tier user akan diturunkan kembali ke free (kalau tier saat ini masih sama dengan tier order ini).')) return
    setOrderActionLoading(orderId); setOrderMsg('')
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, action: 'mark_failed' }),
      })
      const data = await res.json()
      setOrderMsg(res.ok ? (data.downgraded ? '✅ Transaksi dibatalkan, tier user diturunkan ke free' : '✅ Transaksi dibatalkan') : `❌ ${data.error || 'Gagal'}`)
      await reloadOrders()
    } catch {
      setOrderMsg('❌ Gagal menghubungi server, coba lagi')
    }
    setOrderActionLoading(null)
    setTimeout(() => setOrderMsg(''), 4000)
  }

  async function saveCommission() {
    const value = Number(commissionInput)
    if (!Number.isFinite(value) || value < 0) {
      setCommissionMsg('❌ Persentase tidak valid'); setTimeout(() => setCommissionMsg(''), 4000); return
    }
    setSavingCommission(true); setCommissionMsg('')
    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionPercent: value }),
      })
      const data = await res.json()
      if (res.ok) { setCommissionPercent(value); setCommissionMsg('✅ Tersimpan') }
      else setCommissionMsg(`❌ ${data.error || 'Gagal menyimpan'}`)
    } catch {
      setCommissionMsg('❌ Gagal menghubungi server, coba lagi')
    }
    setSavingCommission(false)
    setTimeout(() => setCommissionMsg(''), 4000)
  }

  async function reloadReferrals() {
    const data = await fetch('/api/admin/referrals').then(r => r.json())
    setReferrals(data.redemptions ?? [])
  }

  async function markReferralPaid(id: string, paid: boolean) {
    setRefActionLoading(id); setRefMsg('')
    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, paid }),
      })
      const data = await res.json()
      setRefMsg(res.ok ? (paid ? '✅ Ditandai sudah dibayar' : '✅ Ditandai belum dibayar') : `❌ ${data.error || 'Gagal'}`)
      await reloadReferrals()
    } catch {
      setRefMsg('❌ Gagal menghubungi server, coba lagi')
    }
    setRefActionLoading(null)
    setTimeout(() => setRefMsg(''), 4000)
  }

  async function reloadSoal() {
    const data = await fetch('/api/admin/generated-soal').then(r => r.json())
    setSoalList(data.soal ?? [])
  }

  async function toggleSoalHidden(id: string, hidden: boolean) {
    setSoalActionLoading(id); setSoalMsg('')
    try {
      const res = await fetch('/api/admin/generated-soal', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, hidden: !hidden }),
      })
      const data = await res.json()
      setSoalMsg(res.ok ? (hidden ? '✅ Soal ditampilkan lagi' : '✅ Soal disembunyikan') : `❌ ${data.error || 'Gagal'}`)
      await reloadSoal()
    } catch {
      setSoalMsg('❌ Gagal menghubungi server, coba lagi')
    }
    setSoalActionLoading(null)
    setTimeout(() => setSoalMsg(''), 4000)
  }

  async function deleteSoal(id: string) {
    if (!confirm('Hapus soal ini secara permanen dari Bank Soal?')) return
    setSoalActionLoading(id); setSoalMsg('')
    try {
      const res = await fetch('/api/admin/generated-soal', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      setSoalMsg(res.ok ? '✅ Soal dihapus' : `❌ ${data.error || 'Gagal'}`)
      await reloadSoal()
    } catch {
      setSoalMsg('❌ Gagal menghubungi server, coba lagi')
    }
    setSoalActionLoading(null)
    setTimeout(() => setSoalMsg(''), 4000)
  }

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'stats',  label: '📊 Statistik' },
    { key: 'tiers',  label: '⚙️ Harga & Kuota' },
    { key: 'promos', label: '🎟️ Promo' },
    { key: 'users',  label: '👥 Users' },
    { key: 'orders', label: '💳 Transaksi' },
    { key: 'soal',   label: '🗂️ Bank Soal' },
    { key: 'referral', label: '🎁 Referral' },
    { key: 'tools',    label: '🧰 Tool' },
  ]

  const TOOL_TIER_ORDER = ['guest', 'free', 'pro', 'guru'] as const

  // enabled_tools null berarti "semua tool diizinkan" -- materialize ke
  // daftar penuh dulu sebelum di-toggle supaya nilainya eksplisit begitu
  // admin menyentuh salah satu checkbox.
  function toggleToolForTier(tierKey: string, slug: string) {
    setTiers(prev => prev.map(t => {
      if (t.tier !== tierKey) return t
      const current = t.enabled_tools ?? TEACHER_TOOLS.map(x => x.slug)
      const next = current.includes(slug) ? current.filter(s => s !== slug) : [...current, slug]
      return { ...t, enabled_tools: next }
    }))
  }

  async function saveAllTools() {
    setSavingTools(true); setToolsMsg('')
    try {
      const results = await Promise.all(
        tiers.filter(t => TOOL_TIER_ORDER.includes(t.tier as any)).map(t =>
          fetch('/api/admin/pricing', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t),
          })
        )
      )
      const allOk = results.every(r => r.ok)
      setToolsMsg(allOk ? '✅ Tersimpan' : '❌ Sebagian gagal disimpan, coba lagi')
    } catch {
      setToolsMsg('❌ Gagal menghubungi server, coba lagi')
    }
    setSavingTools(false)
    setTimeout(() => setToolsMsg(''), 4000)
  }

  return (
    <div style={{ minHeight: '100vh', background: S.bg, color: S.text, padding: '2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>📊 Admin Dashboard — LembarGuru</h1>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #ef4444', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#ef4444', cursor: 'pointer' }}>
            Keluar
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, background: '#131619', borderRadius: 10, padding: 4 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ flex: 1, background: activeTab === t.key ? S.card : 'transparent', border: 'none', borderRadius: 7, padding: '9px 14px', color: activeTab === t.key ? S.text : S.muted, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── STATS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'stats' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
              <Card label="Total User" value={stats.totalUsers} />
              <Card label="Generate Hari Ini" value={stats.generatesToday} />
              <Card label="Generate Total" value={stats.generatesTotal} />
              <Card label="Error Hari Ini" value={stats.errorsToday} color={stats.errorsToday > 0 ? S.red : undefined} />
              <Card label="Token Hari Ini" value={stats.tokensToday.toLocaleString('id-ID')} />
              <Card label="Token Total" value={stats.tokensAllTime.toLocaleString('id-ID')} />
            </div>

            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Distribusi Tier</h2>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              {Object.entries(stats.tierBreakdown).map(([tier, count]) => (
                <div key={tier} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
                  <strong>{tier}</strong>: {count}
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>20 Aktivitas Terbaru</h2>
            <div style={{ overflowX: 'auto', border: `1px solid ${S.border}`, borderRadius: 10 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: S.card, textAlign: 'left' }}>
                    <Th c="Waktu" /><Th c="Aksi" /><Th c="Status" /><Th c="Token" /><Th c="User/Guest" />
                  </tr>
                </thead>
                <tbody>
                  {stats.recentLogs.map((log, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${S.border}` }}>
                      <Td c={new Date(log.created_at).toLocaleString('id-ID')} />
                      <Td c={log.action} />
                      <Td c={log.status} style={{ color: log.status === 'error' ? S.red : S.green }} />
                      <Td c={log.tokens_used ?? 0} />
                      <Td c={log.user_display} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── TIERS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'tiers' && (
          <>
            <p style={{ fontSize: 13, color: S.muted, marginBottom: 16 }}>
              Ubah harga dan kuota untuk setiap tier. Perubahan langsung berlaku untuk user baru dan generate berikutnya.
            </p>
            {tierMsg && <div style={{ fontSize: 13, marginBottom: 12, color: tierMsg.includes('✅') ? S.green : S.red }}>{tierMsg}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tiers.map(tier => (
                <div key={tier.tier} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <strong style={{ fontSize: 15 }}>{tier.label}</strong>
                    <span style={{ fontSize: 11, background: '#22262f', border: '1px solid #343844', padding: '2px 8px', borderRadius: 12, color: S.muted }}>{tier.tier}</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, marginLeft: 'auto', cursor: 'pointer' }}>
                      <input type="checkbox" checked={tier.active} onChange={e => updateTierField(tier.tier, 'active', e.target.checked)} />
                      <span style={{ color: tier.active ? S.green : S.muted }}>Aktif</span>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, color: S.muted, display: 'block', marginBottom: 4 }}>Harga Bulanan (Rp)</label>
                      <input type="number" value={tier.price_monthly} onChange={e => updateTierField(tier.tier, 'price_monthly', Number(e.target.value))} style={{ ...inp, width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: S.muted, display: 'block', marginBottom: 4 }}>Harga Tahunan (Rp)</label>
                      <input type="number" value={tier.price_yearly} onChange={e => updateTierField(tier.tier, 'price_yearly', Number(e.target.value))} style={{ ...inp, width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: S.muted, display: 'block', marginBottom: 4 }}>Maks. Soal per Sesi</label>
                      <input type="number" value={tier.max_soal ?? 10} onChange={e => updateTierField(tier.tier, 'max_soal', Number(e.target.value))} style={{ ...inp, width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: S.muted, display: 'block', marginBottom: 4 }}>Generate per Hari</label>
                      <input
                        type="number"
                        value={tier.unlimited_gen ? '' : (tier.max_gen_per_day ?? 5)}
                        placeholder={tier.unlimited_gen ? '∞ (tanpa batas)' : ''}
                        disabled={tier.unlimited_gen}
                        onChange={e => updateTierField(tier.tier, 'max_gen_per_day', Number(e.target.value))}
                        style={{ ...inp, width: '100%', opacity: tier.unlimited_gen ? 0.5 : 1 }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                        <input type="checkbox" checked={tier.unlimited_gen ?? false} onChange={e => updateTierField(tier.tier, 'unlimited_gen', e.target.checked)} />
                        <span>Generate tanpa batas</span>
                      </label>
                    </div>
                  </div>

                  <button onClick={() => saveTier(tier)} disabled={savingTier === tier.tier} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: savingTier === tier.tier ? 0.6 : 1 }}>
                    {savingTier === tier.tier ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                  </button>
                </div>
              ))}
            </div>
            {tiers.length === 0 && (
              <div style={{ color: S.muted, fontSize: 13, marginTop: 16 }}>
                ⚠ Tabel pricing_tiers kosong. Jalankan SQL migration terlebih dahulu.
              </div>
            )}
          </>
        )}

        {/* ── PROMOS TAB ────────────────────────────────────────────────── */}
        {activeTab === 'promos' && (
          <>
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>+ Buat Kode Promo Baru</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {[
                  { label: 'Kode', el: <input value={newPromo.code} onChange={e => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })} placeholder="GURU50" style={inp} /> },
                  { label: 'Tipe Diskon', el: <select value={newPromo.discount_type} onChange={e => setNewPromo({ ...newPromo, discount_type: e.target.value })} style={inp}><option value="percent">Persen (%)</option><option value="fixed">Potongan Rp</option></select> },
                  { label: 'Nilai', el: <input type="number" value={newPromo.discount_value} onChange={e => setNewPromo({ ...newPromo, discount_value: Number(e.target.value) })} style={{ ...inp, width: 80 }} /> },
                  { label: 'Berlaku untuk', el: <select value={newPromo.applies_to} onChange={e => setNewPromo({ ...newPromo, applies_to: e.target.value })} style={inp}><option value="all">Semua</option><option value="pro">Pro</option><option value="guru">Guru</option></select> },
                  { label: 'Maks. Pakai', el: <input type="number" value={newPromo.max_uses} onChange={e => setNewPromo({ ...newPromo, max_uses: e.target.value })} placeholder="∞" style={{ ...inp, width: 80 }} /> },
                  { label: 'Berlaku Sampai', el: <input type="date" value={newPromo.valid_until} onChange={e => setNewPromo({ ...newPromo, valid_until: e.target.value })} style={inp} /> },
                ].map(({ label, el }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 10, color: S.muted }}>{label}</label>
                    {el}
                  </div>
                ))}
                <button onClick={createPromo} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + Buat
                </button>
              </div>
              {promoMsg && <div style={{ fontSize: 12, marginTop: 10, color: promoMsg.includes('✅') ? S.green : S.red }}>{promoMsg}</div>}
            </div>

            <div style={{ overflowX: 'auto', border: `1px solid ${S.border}`, borderRadius: 10 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: S.card, textAlign: 'left' }}>
                    <Th c="Kode" /><Th c="Diskon" /><Th c="Berlaku" /><Th c="Terpakai" /><Th c="Exp" /><Th c="Status" /><Th c="Aksi" />
                  </tr>
                </thead>
                <tbody>
                  {promos.map(p => (
                    <tr key={p.id} style={{ borderTop: `1px solid ${S.border}` }}>
                      <Td c={p.code} style={{ fontWeight: 700 }} />
                      <Td c={p.discount_type === 'percent' ? `${p.discount_value}%` : `Rp ${p.discount_value?.toLocaleString('id-ID')}`} />
                      <Td c={p.applies_to} />
                      <Td c={`${p.used_count ?? 0}${p.max_uses ? ` / ${p.max_uses}` : ''}`} />
                      <Td c={p.valid_until ? new Date(p.valid_until).toLocaleDateString('id-ID') : '∞'} />
                      <Td c={p.active ? 'Aktif' : 'Nonaktif'} style={{ color: p.active ? S.green : S.muted }} />
                      <Td c={
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setSharePromo(p)} style={{ background: 'transparent', border: `1px solid #f59e0b`, color: '#d97706', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                            📤 Share
                          </button>
                          <button onClick={() => togglePromo(p.id, p.active)} style={{ background: 'transparent', border: `1px solid ${S.border}`, color: S.text, borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>
                            {p.active ? 'Matikan' : 'Aktifkan'}
                          </button>
                          <button onClick={() => deletePromo(p.id)} style={{ background: 'transparent', border: '1px solid #5c2424', color: S.red, borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>
                            Hapus
                          </button>
                        </div>
                      } />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── USERS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <>
            <p style={{ fontSize: 13, color: S.muted, marginBottom: 14 }}>
              {users.length} user terdaftar. Kamu bisa mengubah nama, no. WA, dan tier user langsung dari sini.
            </p>
            <div style={{ overflowX: 'auto', border: `1px solid ${S.border}`, borderRadius: 10 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: S.card, textAlign: 'left' }}>
                    <Th c="Email" /><Th c="Nama & No. WA" /><Th c="Tier" /><Th c="Expires" /><Th c="Total Gen" /><Th c="Bergabung" /><Th c="Ubah Tier" />
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderTop: `1px solid ${S.border}` }}>
                      <Td c={u.email} style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} />
                      <Td c={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                          <input
                            placeholder="Nama"
                            value={profileField(u, 'name')}
                            onChange={e => setProfileField(u, 'name', e.target.value)}
                            style={{ ...inp, fontSize: 11 }}
                          />
                          <input
                            placeholder="No. WA"
                            value={profileField(u, 'phone')}
                            onChange={e => setProfileField(u, 'phone', e.target.value)}
                            style={{ ...inp, fontSize: 11 }}
                          />
                          <button
                            onClick={() => saveUserProfile(u)}
                            disabled={savingProfile === u.id}
                            style={{ background: 'transparent', border: `1px solid ${S.border}`, color: S.text, borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}
                          >
                            {savingProfile === u.id ? 'Menyimpan...' : 'Simpan'}
                          </button>
                        </div>
                      } />
                      <Td c={u.tier} style={{ color: u.tier === 'free' ? S.muted : u.tier === 'pro' ? '#f59e0b' : '#a78bfa' }} />
                      <Td c={u.tier_expires_at ? new Date(u.tier_expires_at).toLocaleDateString('id-ID') : '-'} />
                      <Td c={u.total_generates ?? 0} />
                      <Td c={new Date(u.created_at).toLocaleDateString('id-ID')} />
                      <Td c={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <select
                            value={u.tier}
                            disabled={changingUserTier === u.id}
                            onChange={e => changeUserTier(u.id, e.target.value)}
                            style={{ ...inp, fontSize: 11 }}
                          >
                            {['free', 'pro', 'guru'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {u.tier !== 'free' && (
                            <input
                              type="date"
                              title="Tanggal kadaluarsa (opsional, default 30 hari)"
                              value={userTierExpiry[u.id] ?? ''}
                              onChange={e => setUserTierExpiry(prev => ({ ...prev, [u.id]: e.target.value }))}
                              style={{ ...inp, fontSize: 10 }}
                            />
                          )}
                        </div>
                      } />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── ORDERS/TRANSAKSI TAB ──────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <>
            <p style={{ fontSize: 13, color: S.muted, marginBottom: 14 }}>
              Catatan semua transaksi Midtrans. Status seharusnya berubah otomatis lewat webhook pembayaran --
              tombol di sini cuma untuk cadangan kalau webhook gagal terpanggil/terproses (tier user langsung
              disesuaikan begitu status diubah manual di sini).
            </p>
            {orderMsg && <div style={{ fontSize: 13, marginBottom: 12, color: orderMsg.includes('✅') ? S.green : S.red }}>{orderMsg}</div>}
            <div style={{ overflowX: 'auto', border: `1px solid ${S.border}`, borderRadius: 10 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: S.card, textAlign: 'left' }}>
                    <Th c="Order ID" /><Th c="Email" /><Th c="Paket" /><Th c="Harga" /><Th c="Status" /><Th c="Tanggal" /><Th c="Aksi" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.order_id} style={{ borderTop: `1px solid ${S.border}` }}>
                      <Td c={o.order_id} style={{ fontFamily: 'monospace', fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }} />
                      <Td c={o.email} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} />
                      <Td c={`${o.tier} · ${o.period === 'yearly' ? 'Tahunan' : 'Bulanan'}`} />
                      <Td c={
                        <div>
                          <div>Rp {Number(o.amount).toLocaleString('id-ID')}</div>
                          {!!o.discount_amount && (
                            <div style={{ fontSize: 10, color: S.muted }}>Diskon Rp {Number(o.discount_amount).toLocaleString('id-ID')}</div>
                          )}
                        </div>
                      } />
                      <Td
                        c={o.status === 'success' ? 'Sukses' : o.status === 'failed' ? 'Gagal' : 'Pending'}
                        style={{ color: o.status === 'success' ? S.green : o.status === 'failed' ? S.red : '#f59e0b', fontWeight: 600 }}
                      />
                      <Td c={new Date(o.created_at).toLocaleString('id-ID')} />
                      <Td c={
                        <div style={{ display: 'flex', gap: 4 }}>
                          {o.status !== 'success' && (
                            <button
                              onClick={() => markOrderSuccess(o.order_id)}
                              disabled={orderActionLoading === o.order_id}
                              style={{ background: 'transparent', border: `1px solid ${S.green}`, color: S.green, borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}
                            >
                              Tandai Sukses
                            </button>
                          )}
                          {o.status === 'success' && (
                            <button
                              onClick={() => markOrderFailed(o.order_id)}
                              disabled={orderActionLoading === o.order_id}
                              style={{ background: 'transparent', border: `1px solid ${S.red}`, color: S.red, borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}
                            >
                              Batalkan
                            </button>
                          )}
                        </div>
                      } />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orders.length === 0 && (
              <div style={{ color: S.muted, fontSize: 13, marginTop: 16 }}>
                Belum ada transaksi tercatat.
              </div>
            )}
          </>
        )}

        {/* ── BANK SOAL TAB (pengaturan tampilan + moderasi) ────────────── */}
        {activeTab === 'soal' && (
          <>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Pengaturan Tampilan Bank Soal</h3>
            <p style={{ fontSize: 13, color: S.muted, marginBottom: 14 }}>
              Atur jumlah soal yang tampil, filter mata pelajaran/kelas, dan apakah diacak, untuk setiap tier.
              Guru selalu tanpa batas jadi tidak ada di sini.
            </p>
            {tierMsg && <div style={{ fontSize: 13, marginBottom: 12, color: tierMsg.includes('✅') ? S.green : S.red }}>{tierMsg}</div>}
            <div style={{ overflowX: 'auto', border: `1px solid ${S.border}`, borderRadius: 10, marginBottom: 28 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: S.card, textAlign: 'left' }}>
                    <Th c="Tier" /><Th c="Jumlah Soal" /><Th c="Mata Pelajaran" /><Th c="Kelas" /><Th c="Acak" /><Th c="" />
                  </tr>
                </thead>
                <tbody>
                  {tiers.filter(t => t.tier !== 'guru').map(t => (
                    <tr key={t.tier} style={{ borderTop: `1px solid ${S.border}` }}>
                      <Td c={t.label} style={{ fontWeight: 700 }} />
                      <Td c={
                        <input
                          type="number"
                          value={t.bank_soal_jumlah ?? 0}
                          onChange={e => updateTierField(t.tier, 'bank_soal_jumlah', Number(e.target.value))}
                          style={{ ...inp, width: 80 }}
                        />
                      } />
                      <Td c={
                        <select
                          title="Mata Pelajaran"
                          value={t.bank_soal_mapel ?? 'Semua'}
                          onChange={e => updateTierField(t.tier, 'bank_soal_mapel', e.target.value === 'Semua' ? null : e.target.value)}
                          style={{ ...inp, width: 160 }}
                        >
                          <option value="Semua">Semua</option>
                          {MAPEL.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      } />
                      <Td c={
                        <select
                          title="Kelas"
                          value={t.bank_soal_kelas ?? 'Semua'}
                          onChange={e => updateTierField(t.tier, 'bank_soal_kelas', e.target.value === 'Semua' ? null : e.target.value)}
                          style={{ ...inp, width: 120 }}
                        >
                          <option value="Semua">Semua</option>
                          {KELAS_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      } />
                      <Td c={
                        <select
                          title="Acak"
                          value={t.bank_soal_acak ? 'iya' : 'tidak'}
                          onChange={e => updateTierField(t.tier, 'bank_soal_acak', e.target.value === 'iya')}
                          style={{ ...inp, width: 90 }}
                        >
                          <option value="iya">Iya</option>
                          <option value="tidak">Tidak</option>
                        </select>
                      } />
                      <Td c={
                        <button
                          onClick={() => saveTier(t)}
                          disabled={savingTier === t.tier}
                          style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: savingTier === t.tier ? 0.6 : 1 }}
                        >
                          {savingTier === t.tier ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      } />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Moderasi Soal</h3>
            <p style={{ fontSize: 13, color: S.muted, marginBottom: 14 }}>
              Semua soal yang otomatis masuk ke kolam Bank Soal bersama dari hasil generate user. Sembunyikan
              soal yang kualitasnya kurang baik (bisa ditampilkan lagi kapan saja) atau hapus permanen.
            </p>
            {soalMsg && <div style={{ fontSize: 13, marginBottom: 12, color: soalMsg.includes('✅') ? S.green : S.red }}>{soalMsg}</div>}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {([
                { key: 'semua', label: 'Semua' },
                { key: 'tampil', label: 'Tampil' },
                { key: 'sembunyi', label: 'Disembunyikan' },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setSoalFilter(f.key)}
                  style={{
                    background: soalFilter === f.key ? S.accent : 'transparent',
                    border: `1px solid ${soalFilter === f.key ? S.accent : S.border}`,
                    color: soalFilter === f.key ? '#fff' : S.muted,
                    borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ overflowX: 'auto', border: `1px solid ${S.border}`, borderRadius: 10 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: S.card, textAlign: 'left' }}>
                    <Th c="Mapel" /><Th c="Kelas" /><Th c="Tipe" /><Th c="Cuplikan Soal" /><Th c="Status" /><Th c="Aksi" />
                  </tr>
                </thead>
                <tbody>
                  {soalList
                    .filter(s => soalFilter === 'semua' ? true : soalFilter === 'tampil' ? !s.hidden : s.hidden)
                    .map(s => (
                      <tr key={s.id} style={{ borderTop: `1px solid ${S.border}` }}>
                        <Td c={s.mapel} />
                        <Td c={s.kelas ?? '-'} />
                        <Td c={s.tipe ?? '-'} />
                        <Td c={s.teks.length > 90 ? s.teks.slice(0, 90) + '…' : s.teks} style={{ maxWidth: 320 }} />
                        <Td c={s.hidden ? 'Disembunyikan' : 'Tampil'} style={{ color: s.hidden ? S.muted : S.green, fontWeight: 600 }} />
                        <Td c={
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => toggleSoalHidden(s.id, s.hidden)}
                              disabled={soalActionLoading === s.id}
                              style={{ background: 'transparent', border: `1px solid ${S.border}`, color: S.text, borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}
                            >
                              {s.hidden ? 'Tampilkan' : 'Sembunyikan'}
                            </button>
                            <button
                              onClick={() => deleteSoal(s.id)}
                              disabled={soalActionLoading === s.id}
                              style={{ background: 'transparent', border: `1px solid ${S.red}`, color: S.red, borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}
                            >
                              Hapus
                            </button>
                          </div>
                        } />
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {soalList.length === 0 && (
              <div style={{ color: S.muted, fontSize: 13, marginTop: 16 }}>
                Belum ada soal tersimpan di Bank Soal.
              </div>
            )}
          </>
        )}

        {/* ── REFERRAL TAB ─────────────────────────────────────────────── */}
        {activeTab === 'referral' && (
          <>
            <p style={{ fontSize: 13, color: S.muted, marginBottom: 14 }}>
              Reward referral ({commissionPercent}% dari harga paket) ditandai otomatis "Sukses" begitu
              rekan yang direferensikan berhasil bayar pertama kali. Belum ada pembayaran otomatis --
              transfer reward ke referrer dilakukan manual di luar sistem, lalu ditandai "Sudah Dibayar" di sini.
            </p>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 20, background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: '14px 16px' }}>
              <div>
                <label htmlFor="commission-input" style={{ display: 'block', fontSize: 12, color: S.muted, marginBottom: 6 }}>Komisi Referral</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    id="commission-input"
                    type="number" min={0} max={100} step={0.5}
                    value={commissionInput}
                    onChange={e => setCommissionInput(e.target.value)}
                    style={{ ...inp, width: 90 }}
                  />
                  <span style={{ fontSize: 13, color: S.muted }}>%</span>
                </div>
              </div>
              <button
                onClick={saveCommission}
                disabled={savingCommission}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: savingCommission ? 0.6 : 1 }}
              >
                {savingCommission ? 'Menyimpan...' : 'Simpan'}
              </button>
              {commissionMsg && <span style={{ fontSize: 13, color: commissionMsg.includes('✅') ? S.green : S.red }}>{commissionMsg}</span>}
            </div>

            {refMsg && <div style={{ fontSize: 13, marginBottom: 12, color: refMsg.includes('✅') ? S.green : S.red }}>{refMsg}</div>}
            <div style={{ overflowX: 'auto', border: `1px solid ${S.border}`, borderRadius: 10 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: S.card, textAlign: 'left' }}>
                    <Th c="Kode" /><Th c="Referrer" /><Th c="Rekan" /><Th c="Status" /><Th c="Reward" /><Th c="Tanggal" /><Th c="Aksi" />
                  </tr>
                </thead>
                <tbody>
                  {referrals.map(r => (
                    <tr key={r.id} style={{ borderTop: `1px solid ${S.border}` }}>
                      <Td c={r.code} style={{ fontFamily: 'monospace' }} />
                      <Td c={r.referrerEmail} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }} />
                      <Td c={r.referredEmail} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }} />
                      <Td
                        c={r.status === 'success' ? 'Sukses' : r.status === 'cancelled' ? 'Batal' : 'Pending'}
                        style={{ color: r.status === 'success' ? S.green : r.status === 'cancelled' ? S.red : '#f59e0b', fontWeight: 600 }}
                      />
                      <Td c={
                        r.status === 'success'
                          ? <div>
                              <div>Rp {Number(r.reward_amount ?? 0).toLocaleString('id-ID')}</div>
                              <div style={{ fontSize: 10, color: r.paid_at ? S.green : S.muted }}>{r.paid_at ? 'Sudah dibayar' : 'Belum dibayar'}</div>
                            </div>
                          : '-'
                      } />
                      <Td c={new Date(r.created_at).toLocaleString('id-ID')} />
                      <Td c={
                        r.status === 'success' ? (
                          <button
                            onClick={() => markReferralPaid(r.id, !r.paid_at)}
                            disabled={refActionLoading === r.id}
                            style={{
                              background: 'transparent', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer',
                              border: `1px solid ${r.paid_at ? S.muted : S.green}`, color: r.paid_at ? S.muted : S.green,
                            }}
                          >
                            {r.paid_at ? 'Batalkan' : 'Tandai Dibayar'}
                          </button>
                        ) : '-'
                      } />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {referrals.length === 0 && (
              <div style={{ color: S.muted, fontSize: 13, marginTop: 16 }}>
                Belum ada referral tercatat.
              </div>
            )}
          </>
        )}

        {/* ── TOOL TAB (akses tool per tier) ──────────────────────────── */}
        {activeTab === 'tools' && (
          <>
            <p style={{ fontSize: 13, color: S.muted, marginBottom: 14 }}>
              Atur tool "Alat Bantu Guru" mana yang boleh diakses tiap tier. Tool yang tidak dicentang
              akan ditampilkan abu-abu (nonaktif) di halaman utama untuk user tier tersebut.
            </p>
            {toolsMsg && <div style={{ fontSize: 13, marginBottom: 12, color: toolsMsg.includes('✅') ? S.green : S.red }}>{toolsMsg}</div>}
            <div style={{ overflowX: 'auto', border: `1px solid ${S.border}`, borderRadius: 10, marginBottom: 16 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: S.card, textAlign: 'left' }}>
                    <Th c="Tool" />
                    {TOOL_TIER_ORDER.map(tk => (
                      <Th key={tk} c={tiers.find(t => t.tier === tk)?.label ?? tk} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TEACHER_TOOLS.map(tool => (
                    <tr key={tool.slug} style={{ borderTop: `1px solid ${S.border}` }}>
                      <Td c={tool.label} />
                      {TOOL_TIER_ORDER.map(tk => {
                        const t = tiers.find(x => x.tier === tk)
                        const enabled = !t?.enabled_tools || t.enabled_tools.includes(tool.slug)
                        return (
                          <Td key={tk} c={
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => toggleToolForTier(tk, tool.slug)}
                              title={`${tool.label} untuk tier ${t?.label ?? tk}`}
                            />
                          } />
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={saveAllTools}
              disabled={savingTools}
              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: savingTools ? 0.6 : 1 }}
            >
              {savingTools ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
            </button>
          </>
        )}
      </div>


      {sharePromo && (
        <AdminShareModal promo={sharePromo} onClose={() => setSharePromo(null)} />
      )}
    </div>
  )
}

function AdminShareModal({ promo, onClose }: { promo: any; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [copied, setCopied] = useState(false)
  const promoUrl = 'https://www.lembarguru.com/?promo=' + promo.code
  const disc = promo.discount_type === 'percent'
    ? promo.discount_value + '% off'
    : 'Diskon Rp ' + Number(promo.discount_value).toLocaleString('id-ID')
  const exp = promo.valid_until
    ? new Date(promo.valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  function roundR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r)
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h)
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r)
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath()
  }

  function drawCard() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = 1080, H = 1080
    canvas.width = W; canvas.height = H
    ctx.fillStyle = '#1a1740'; ctx.fillRect(0,0,W,H)
    ctx.fillStyle = 'rgba(245,158,11,0.06)'
    for (let i=0;i<4;i++) { ctx.beginPath(); ctx.arc(W-80, 80+i*60, 200+i*50, 0, Math.PI*2); ctx.fill() }
    ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 36px sans-serif'; ctx.fillText('LembarGuru', 80, 100)
    ctx.fillStyle = 'rgba(245,158,11,0.2)'; roundR(ctx,80,130,220,56,10); ctx.fill()
    ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 28px sans-serif'; ctx.fillText(disc, 100, 167)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 72px sans-serif'; ctx.fillText('Upgrade ke Pro', 80, 300)
    ctx.fillStyle = '#d1cfe8'; ctx.font = '48px sans-serif'; ctx.fillText('harga lebih hemat!', 80, 370)
    ctx.fillStyle = '#a5a3c0'; ctx.font = '28px sans-serif'
    ctx.fillText('Generator soal AI untuk guru SD, SMP & SMA', 80, 440)
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; roundR(ctx,80,540,W-160,120,16); ctx.fill()
    ctx.strokeStyle = 'rgba(245,158,11,0.5)'; ctx.lineWidth = 2; roundR(ctx,80,540,W-160,120,16); ctx.stroke()
    ctx.fillStyle = '#a5a3c0'; ctx.font = '24px sans-serif'; ctx.fillText('Gunakan kode promo:', 110, 582)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 52px monospace'; ctx.fillText(promo.code, 110, 640)
    if (exp) {
      ctx.fillStyle = '#a5a3c0'; ctx.font = '22px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('Berlaku sampai', W-110, 582)
      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(exp, W-110, 617); ctx.textAlign = 'left'
    }
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '22px monospace'; ctx.fillText(promoUrl, 80, H-60)
    ctx.fillStyle = '#f59e0b'; ctx.fillRect(80, H-30, W-160, 4)
  }

  useEffect(() => { if (canvasRef.current) drawCard() }, [])

  function downloadCard() {
    if (!canvasRef.current) return
    const a = document.createElement('a')
    a.download = 'promo-lembarguru-' + promo.code + '.png'
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()
  }

  function copyLink() {
    navigator.clipboard.writeText(promoUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const expText = exp ? ' Berlaku sampai ' + exp + '.' : ''
  const shareText = 'Promo LembarGuru ' + disc + '!\nGunakan kode *' + promo.code + '* saat upgrade.' + expText + '\n\nGenerator soal AI untuk guru Indonesia.\n' + promoUrl

  const platforms = [
    { label: 'WhatsApp',   color: '#25d366', icon: '💬', url: 'https://wa.me/?text=' + encodeURIComponent(shareText) },
    { label: 'X / Twitter', color: '#000000', icon: '𝕏',  url: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent('Promo LembarGuru ' + disc + '! Kode: ' + promo.code + ' ' + promoUrl) },
    { label: 'Facebook',   color: '#1877f2', icon: 'f',  url: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(promoUrl) },
    { label: 'Telegram',   color: '#2aabee', icon: '✈',  url: 'https://t.me/share/url?url=' + encodeURIComponent(promoUrl) + '&text=' + encodeURIComponent(shareText) },
    { label: 'Threads',    color: '#000000', icon: '@',  url: 'https://www.threads.net/intent/post?text=' + encodeURIComponent(shareText) },
  ]

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: '1rem' }}>
      <div style={{ background: '#1a1d24', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative', border: '1px solid #2a2e38' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>✕</button>
        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4, color: '#f3f4f6' }}>📤 Share Promo {promo.code}</h2>
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Download share card atau share langsung via link.</p>
        <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 10, marginBottom: 14, display: 'block' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {platforms.map(pl => (
            <a key={pl.label} href={pl.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: pl.color, color: '#fff', borderRadius: 8, padding: '9px 10px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              <span style={{ fontSize: 15 }}>{pl.icon}</span>{pl.label}
            </a>
          ))}
          <button onClick={downloadCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            ⬇ Download
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input readOnly value={promoUrl} style={{ flex: 1, fontSize: 12, padding: '8px 10px', border: '1px solid #343844', borderRadius: 8, background: '#22262f', color: '#9ca3af', fontFamily: 'monospace' }} />
          <button onClick={copyLink} style={{ fontSize: 12, padding: '8px 14px', border: '1px solid ' + (copied ? '#10b981' : '#343844'), borderRadius: 8, background: copied ? '#0f2e22' : '#22262f', color: copied ? '#4ade80' : '#f3f4f6', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {copied ? '✓ Tersalin' : 'Salin link'}
          </button>
        </div>
      </div>
    </div>
  )
}