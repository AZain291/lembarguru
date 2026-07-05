'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function parseNama(teks: string): string[] {
  return teks
    .split('\n')
    .map((n) => n.trim())
    .filter(Boolean);
}

function acakUrutan<T>(arr: T[]): T[] {
  const hasil = [...arr];
  for (let i = hasil.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
  }
  return hasil;
}

export function BagiKelompok() {
  const [daftarTeks, setDaftarTeks] = useState('');
  const [mode, setMode] = useState<'jumlah_kelompok' | 'ukuran_kelompok'>('jumlah_kelompok');
  const [nilai, setNilai] = useState(2);
  const [kelompok, setKelompok] = useState<string[][] | null>(null);

  const daftarNama = parseNama(daftarTeks);

  function bagi() {
    if (daftarNama.length === 0 || nilai < 1) return;
    const acakan = acakUrutan(daftarNama);

    const jumlahKelompok =
      mode === 'jumlah_kelompok' ? Math.max(1, nilai) : Math.max(1, Math.ceil(acakan.length / nilai));

    const hasil: string[][] = Array.from({ length: jumlahKelompok }, () => []);
    acakan.forEach((nama, i) => {
      hasil[i % jumlahKelompok].push(nama);
    });

    setKelompok(hasil);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      <Card>
        <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
          Daftar nama siswa (satu nama per baris)
          <textarea
            className="input-field min-h-[200px]"
            placeholder={'Contoh:\nAndi\nBudi\nCitra\nDewi'}
            value={daftarTeks}
            onChange={(e) => setDaftarTeks(e.target.value)}
          />
        </label>
        <p className="mt-1.5 text-[12.5px] text-ink-soft">{daftarNama.length} nama terdaftar</p>

        <div className="mt-4 flex rounded-lg border border-grid-line p-1">
          {(
            [
              { key: 'jumlah_kelompok', label: 'Jumlah kelompok' },
              { key: 'ukuran_kelompok', label: 'Ukuran kelompok' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setMode(opt.key)}
              className={`flex-1 rounded-md py-1.5 text-[13px] font-medium transition-colors ${
                mode === opt.key ? 'bg-accent text-white' : 'text-ink-soft'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="mt-3 flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
          {mode === 'jumlah_kelompok' ? 'Jumlah kelompok' : 'Jumlah siswa per kelompok'}
          <input
            type="number"
            min={1}
            className="input-field"
            value={nilai}
            onChange={(e) => setNilai(Number(e.target.value))}
          />
        </label>

        <Button className="mt-4 w-full justify-center" onClick={bagi} disabled={daftarNama.length === 0}>
          Bagi Kelompok
        </Button>
      </Card>

      <div>
        {!kelompok && (
          <Card className="flex h-full min-h-[300px] items-center justify-center text-center text-[14px] text-ink-soft">
            Hasil pembagian kelompok akan muncul di sini.
          </Card>
        )}
        {kelompok && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {kelompok.map((anggota, i) => (
              <Card key={i}>
                <h3 className="mb-2 font-display text-[16px] font-semibold text-ink">
                  Kelompok {i + 1}
                </h3>
                <ul className="flex flex-col gap-1 text-[14px] text-ink-soft">
                  {anggota.map((nama) => (
                    <li key={nama}>{nama}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
