'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function ConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Cek apakah user sudah terverifikasi
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        setStatus('error')
      } else {
        setStatus('success')
        setTimeout(() => router.push('/'), 3000)
      }
    })
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', border: '1px solid #e5e2db', borderRadius: 14, padding: '2.5rem', textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontWeight: 800, fontSize: 17, marginBottom: 32 }}>
          <div style={{ width: 30, height: 30, background: '#2563eb', color: '#fff', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>L</div>
          LembarGuru
        </div>

        {status === 'loading' && (
          <>
            <div style={{ width: 44, height: 44, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.75s linear infinite' }} />
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Memverifikasi email...</h1>
            <p style={{ fontSize: 13, color: '#6b7280' }}>Mohon tunggu sebentar.</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 56, height: 56, background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>✓</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Email terverifikasi!</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Akun kamu sudah aktif. Kamu akan diarahkan ke beranda dalam 3 detik...</p>
            <button
              onClick={() => router.push('/')}
              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 9, padding: '11px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Ke Beranda Sekarang
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 56, height: 56, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>✕</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Link tidak valid</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Link konfirmasi sudah kadaluarsa atau tidak valid. Silakan daftar ulang.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => router.push('/login')}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 9, padding: '11px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Kembali ke Login
              </button>
              <a href="/" style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'none' }}>← Ke Beranda</a>
            </div>
          </>
        )}

      </div>
    </div>
  )
}