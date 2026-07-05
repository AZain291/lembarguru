'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [message, setMessage]   = useState('')
  const [loading, setLoading]   = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (mode === 'register') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        // Simpan nama & nomor WA ke tabel profiles
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            name: name.trim(),
            phone: phone.trim(),
          })
        }
        setMessage('Cek email untuk konfirmasi akun!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        let isAdmin = false
        try {
          const checkRes = await fetch('/api/admin/check')
          const checkData = await checkRes.json()
          isAdmin = !!checkData.isAdmin
        } catch {
          // kalau gagal cek admin, lanjut ke homepage biasa
        }
        router.push(isAdmin ? '/admin' : '/')
        router.refresh()
      }
    }

    setLoading(false)
  }

  const inp = { width: '100%', padding: '9px 11px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', border: '1px solid #e5e2db', borderRadius: 14, padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: 17, marginBottom: 24 }}>
          <div style={{ width: 30, height: 30, background: '#2563eb', color: '#fff', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>L</div>
          LembarGuru
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, color: '#111827' }}>
          {mode === 'login' ? 'Masuk ke akun' : 'Daftar gratis'}
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
          {mode === 'login' ? 'Selamat datang kembali!' : 'Dapatkan 5× generate soal per hari.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Nama & WA — hanya saat register */}
          {mode === 'register' && (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Nama Lengkap</label>
                <input type="text" placeholder="cth: Budi Santoso" value={name} onChange={e => setName(e.target.value)} required
                  style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>
                  Nomor WhatsApp <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opsional)</span>
                </label>
                <input type="tel" placeholder="cth: 08123456789" value={phone} onChange={e => setPhone(e.target.value)}
                  style={inp} />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Email</label>
            <input type="email" placeholder="guru@sekolah.ac.id" value={email} onChange={e => setEmail(e.target.value)} required
              style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Password</label>
            <input type="password" placeholder="Minimal 6 karakter" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              style={inp} />
          </div>

          {message && (
            <p style={{ fontSize: 13, color: message.includes('Cek') ? '#065f46' : '#991b1b', background: message.includes('Cek') ? '#ecfdf5' : '#fef2f2', padding: '9px 12px', borderRadius: 7, margin: 0 }}>
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 9, padding: '11px', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginTop: 4 }}>
            {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(''); setName(''); setPhone('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#2563eb', textDecoration: 'underline' }}>
            {mode === 'login' ? 'Belum punya akun? Daftar gratis' : 'Sudah punya akun? Masuk'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <a href="/" style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'none' }}>← Kembali ke beranda</a>
        </div>
      </div>
    </div>
  )
}
