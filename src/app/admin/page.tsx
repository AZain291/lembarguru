'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface LogRow {
  created_at: string; action: string; status: string
  tokens_used: number | null; user_id: string | null; guest_token: string | null
}
interface Stats {
  totalUsers: number; tierBreakdown: Record<string, number>
  generatesToday: number; generatesTotal: number; errorsToday: number
  tokensToday: number; tokensAllTime: number; recentLogs: LogRow[]
}
interface TierRow {
  tier: string; label: string; price_monthly: number; price_yearly: number
  active: boolean; max_soal: number; max_gen_per_day: number | null; unlimited_gen: boolean
}
interface UserRow {
  id: string; email: string; tier: string; tier_expires_at: string | null
  created_at: string; total_generates: number
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
  const [activeTab, setActiveTab] = useState<'stats' | 'tiers' | 'promos' | 'users'>('stats')
  const [changingUserTier, setChangingUserTier] = useState<string | null>(null)

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
  }, [])

  if (loading) return <Centered>Memuat...</Centered>
  if (error) return <Centered>{error}</Centered>
  if (!stats) return null

  async function saveTier(tier: TierRow) {
    setSavingTier(tier.tier); setTierMsg('')
    const res = await fetch('/api/admin/pricing', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tier),
    })
    setSavingTier(null)
    setTierMsg(res.ok ? '✅ Tersimpan' : '❌ Gagal menyimpan')
    setTimeout(() => setTierMsg(''), 3000)
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
    await fetch(`/api/admin/promos?id=${id}`, { method: 'DELETE' })
    reloadPromos()
  }

  async function changeUserTier(userId: string, newTier: string) {
    setChangingUserTier(userId)
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, tier: newTier }) })
    fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users ?? []))
    setChangingUserTier(null)
  }

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'stats',  label: '📊 Statistik' },
    { key: 'tiers',  label: '⚙️ Harga & Kuota' },
    { key: 'promos', label: '🎟️ Promo' },
    { key: 'users',  label: '👥 Users' },
  ]

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
                      <Td c={(log.user_id ?? log.guest_token ?? '').slice(0, 12)} style={{ fontFamily: 'monospace', fontSize: 11 }} />
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
              {users.length} user terdaftar. Kamu bisa mengubah tier user langsung dari sini.
            </p>
            <div style={{ overflowX: 'auto', border: `1px solid ${S.border}`, borderRadius: 10 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: S.card, textAlign: 'left' }}>
                    <Th c="Email" /><Th c="Tier" /><Th c="Expires" /><Th c="Total Gen" /><Th c="Bergabung" /><Th c="Ubah Tier" />
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderTop: `1px solid ${S.border}` }}>
                      <Td c={u.email} style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} />
                      <Td c={u.tier} style={{ color: u.tier === 'free' ? S.muted : u.tier === 'pro' ? '#f59e0b' : '#a78bfa' }} />
                      <Td c={u.tier_expires_at ? new Date(u.tier_expires_at).toLocaleDateString('id-ID') : '-'} />
                      <Td c={u.total_generates ?? 0} />
                      <Td c={new Date(u.created_at).toLocaleDateString('id-ID')} />
                      <Td c={
                        <select
                          value={u.tier}
                          disabled={changingUserTier === u.id}
                          onChange={e => changeUserTier(u.id, e.target.value)}
                          style={{ ...inp, fontSize: 11 }}
                        >
                          {['free', 'pro', 'guru'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      } />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
