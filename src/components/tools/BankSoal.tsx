'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SoalRow {
  id: string;
  mapel: string;
  kelas: string | null;
  kurikulum: string | null;
  tipe: string | null;
  teks: string;
  created_at: string;
}

type Tier = 'guest' | 'free' | 'pro' | 'guru';

const TIER_LABEL: Record<Tier, string> = {
  guest: 'Tamu',
  free: 'Gratis',
  pro: 'Pro',
  guru: 'Guru Lengkap',
};

export function BankSoal() {
  const [soal, setSoal] = useState<SoalRow[]>([]);
  const [tier, setTier] = useState<Tier | null>(null);
  const [mapelHariIni, setMapelHariIni] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMapel, setFilterMapel] = useState('Semua');

  useEffect(() => {
    fetch('/api/bank-soal')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memuat Bank Soal');
        setSoal(data.soal ?? []);
        setTier(data.tier ?? null);
        setMapelHariIni(data.mapelHariIni ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function salin(teks: string) {
    try {
      await navigator.clipboard.writeText(teks);
    } catch {
      // abaikan
    }
  }

  const daftarMapel = ['Semua', ...Array.from(new Set(soal.map((s) => s.mapel)))];
  const filtered = filterMapel === 'Semua' ? soal : soal.filter((s) => s.mapel === filterMapel);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-[13px] text-ink-soft">
          Kumpulan soal ini terisi otomatis dari hasil generate seluruh pengguna LembarGuru.
          {tier && (
            <>
              {' '}Kamu masuk sebagai tier <b className="text-ink">{TIER_LABEL[tier]}</b>.
              {tier === 'guest' && mapelHariIni && (
                <> Tamu bisa melihat 5 soal <b className="text-ink">{mapelHariIni}</b> hari ini (mapel bergilir tiap hari).</>
              )}
              {tier === 'free' && ' Kamu bisa melihat 5 soal masing-masing dari Matematika, IPA, dan Bahasa Inggris.'}
              {tier === 'pro' && ' Kamu bisa melihat 10 soal masing-masing dari Matematika, IPA, dan Bahasa Inggris.'}
              {tier === 'guru' && ' Sebagai Guru Lengkap, kamu bisa melihat semua mapel tanpa batas.'}
            </>
          )}
        </p>
      </Card>

      {loading && (
        <Card className="flex min-h-[200px] items-center justify-center text-center text-[14px] text-ink-soft">
          Memuat Bank Soal...
        </Card>
      )}

      {error && (
        <Card className="text-center text-[14px] text-red">{error}</Card>
      )}

      {!loading && !error && soal.length === 0 && (
        <Card className="flex min-h-[200px] items-center justify-center text-center text-[14px] text-ink-soft">
          Belum ada soal yang tersedia untuk kamu. Coba generate soal dulu di halaman utama, atau kembali lagi nanti.
        </Card>
      )}

      {daftarMapel.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {daftarMapel.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFilterMapel(m)}
              className={`rounded-full border px-3 py-1 text-[12.5px] font-medium ${
                filterMapel === m ? 'border-accent bg-accent text-white' : 'border-grid-line text-ink-soft'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((item) => (
          <Card key={item.id}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-paper-deep px-2 py-0.5 font-mono text-[11px] text-ink-soft">{item.mapel}</span>
              {item.kelas && <span className="rounded bg-paper-deep px-2 py-0.5 font-mono text-[11px] text-ink-soft">Kelas {item.kelas}</span>}
              {item.kurikulum && <span className="rounded bg-paper-deep px-2 py-0.5 font-mono text-[11px] text-ink-soft">{item.kurikulum}</span>}
            </div>
            <p className="whitespace-pre-wrap text-[13.5px] text-ink">{item.teks}</p>
            <Button variant="ghost" className="mt-3" onClick={() => salin(item.teks)}>Salin</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
