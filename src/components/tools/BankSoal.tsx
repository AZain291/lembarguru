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

function formatSoalWithHeader(item: SoalRow): string {
  const header = [`Mata Pelajaran: ${item.mapel}`, item.kelas ? `Kelas: ${item.kelas}` : null]
    .filter(Boolean)
    .join('\n');
  return `${header}\n\n${item.teks}`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function BankSoal() {
  const [soal, setSoal] = useState<SoalRow[]>([]);
  const [tier, setTier] = useState<Tier | null>(null);
  const [mapelTerbatas, setMapelTerbatas] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMapel, setFilterMapel] = useState('Semua');
  const [filterKelas, setFilterKelas] = useState('Semua');

  useEffect(() => {
    fetch('/api/bank-soal')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memuat Bank Soal');
        setSoal(data.soal ?? []);
        setTier(data.tier ?? null);
        setMapelTerbatas(data.mapelTerbatas ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function salin(item: SoalRow) {
    try {
      await navigator.clipboard.writeText(formatSoalWithHeader(item));
    } catch {
      // abaikan
    }
  }

  function cetak(item: SoalRow) {
    const win = window.open('', '_blank', 'width=720,height=840');
    if (!win) return;
    const isi = escapeHtml(formatSoalWithHeader(item));
    win.document.write(
      `<pre style="font-family: system-ui, sans-serif; white-space: pre-wrap; padding: 28px; font-size: 14px; line-height: 1.6; color: #1F2A44;">${isi}</pre>`
    );
    win.document.close();
    win.focus();
    win.print();
  }

  const daftarMapel = ['Semua', ...Array.from(new Set(soal.map((s) => s.mapel))).sort()];
  const daftarKelas = ['Semua', ...Array.from(new Set(soal.map((s) => s.kelas).filter((k): k is string => !!k))).sort()];
  const filtered = soal.filter(
    (s) => (filterMapel === 'Semua' || s.mapel === filterMapel) && (filterKelas === 'Semua' || s.kelas === filterKelas)
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-[13px] text-ink-soft">
          Kumpulan soal ini adalah pilihan untuk mendapatkan soal tanpa harus generate soal di LembarGuru.
          {tier && (
            <>
              {' '}Kamu masuk sebagai tier <b className="text-ink">{tier === 'guru' ? 'Guru Lengkap' : tier === 'pro' ? 'Pro' : tier === 'free' ? 'Gratis' : 'Tamu'}</b>.
              {tier === 'guest' && (
                <> Tamu bisa melihat 5 soal Pilihan Ganda dan 5 soal Esai dari <b className="text-ink">{mapelTerbatas ?? 'Matematika'}</b>. Upgrade untuk bisa melihat lebih banyak soal.</>
              )}
              {tier === 'free' && (
                <> Kamu bisa melihat 15 soal Pilihan Ganda dan 10 soal Esai dari <b className="text-ink">{mapelTerbatas ?? 'Matematika'}</b>. Upgrade ke Pro untuk melihat soal dari semua mata pelajaran.</>
              )}
              {tier === 'pro' && ' Kamu bisa melihat 30 soal Pilihan Ganda dan 20 soal Esai dari semua mata pelajaran.'}
              {tier === 'guru' && ' Sebagai Guru Lengkap, kamu bisa melihat semua soal dari semua mata pelajaran tanpa batas.'}
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

      {!loading && !error && soal.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
            Mata pelajaran
            <select value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)} className="select-field w-[200px]">
              {daftarMapel.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
            Kelas
            <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="select-field w-[160px]">
              {daftarKelas.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((item) => (
            <Card key={item.id}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded bg-paper-deep px-2 py-0.5 font-mono text-[11px] text-ink-soft">{item.mapel}</span>
                {item.kelas && <span className="rounded bg-paper-deep px-2 py-0.5 font-mono text-[11px] text-ink-soft">Kelas {item.kelas}</span>}
                {item.kurikulum && <span className="rounded bg-paper-deep px-2 py-0.5 font-mono text-[11px] text-ink-soft">{item.kurikulum}</span>}
              </div>
              <p className="whitespace-pre-wrap text-[13.5px] text-ink">{item.teks}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" onClick={() => salin(item)}>Salin</Button>
                <Button variant="ghost" onClick={() => cetak(item)}>Cetak</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
