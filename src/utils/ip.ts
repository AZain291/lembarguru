import { headers } from 'next/headers'
import crypto from 'crypto'

// Hash (bukan simpan mentah) alamat IP request saat ini -- dipakai sebagai
// sinyal kuota tambahan untuk tamu (lihat checkQuota/logUsage di usage.ts),
// supaya kuota harian tidak trivial di-reset cuma dengan clear cookie/
// incognito (guest_id doang gampang direset, IP jaringan tidak).
export async function getClientIpHash(): Promise<string | null> {
  try {
    const h = await headers()
    const forwarded = h.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : h.get('x-real-ip')
    if (!ip) return null
    return crypto.createHash('sha256').update(ip).digest('hex')
  } catch {
    return null
  }
}
