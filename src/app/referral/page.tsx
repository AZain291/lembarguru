import { Metadata } from 'next'
import ReferralClient from './ReferralClient'

export const metadata: Metadata = {
  title: 'Referral — LembarGuru',
  description: 'Ajak rekan guru bergabung di LembarGuru dan dapatkan reward saat mereka berlangganan.',
  alternates: {
    canonical: '/referral',
  },
  // Wajib login (redirect ke /login untuk pengunjung anonim/Googlebot) --
  // tidak ada konten publik di sini yang perlu diindeks.
  robots: { index: false, follow: true },
}

export default function ReferralPage() {
  return <ReferralClient />
}
