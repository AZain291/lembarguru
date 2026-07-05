'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

function predikatSkalaBaku(nilai: number): { huruf: string; predikat: string; warna: string } {
  if (nilai >= 90) return { huruf: 'A', predikat: 'Sangat Baik', warna: 'text-green' };
  if (nilai >= 80) return { huruf: 'B', predikat: 'Baik', warna: 'text-ink' };
  if (nilai >= 70) return { huruf: 'C', predikat: 'Cukup', warna: 'text-gold' };
  return { huruf: 'D', predikat: 'Perlu Bimbingan', warna: 'text-red' };
}

function predikatKkm(nilai: number, kkm: number): { status: string; predikat: string; warna: string } {
  if (nilai < kkm) return { status: 'Belum Tuntas', predikat: 'Perlu Bimbingan', warna: 'text-red' };
  const tengah = kkm + (100 - kkm) / 2;
  if (nilai >= tengah) return { status: 'Tuntas', predikat: 'Sangat Baik', warna: 'text-green' };
  return { status: 'Tuntas', predikat: 'Baik', warna: 'text-ink' };
}

export function KonversiNilai() {
  const [mode, setMode] = useState<'baku' | 'kkm'>('baku');
  const [nilai, setNilai] = useState(85);
  const [kkm, setKkm] = useState(75);

  const hasilBaku = predikatSkalaBaku(nilai);
  const hasilKkm = predikatKkm(nilai, kkm);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      <Card>
        <div className="mb-4 flex rounded-lg border border-grid-line p-1">
          {(
            [
              { key: 'baku', label: 'Skala Baku' },
              { key: 'kkm', label: 'KKM Kustom' },
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

        <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
          Nilai (0-100)
          <input
            type="number"
            min={0}
            max={100}
            className="input-field"
            value={nilai}
            onChange={(e) => setNilai(Number(e.target.value))}
          />
        </label>

        {mode === 'kkm' && (
          <label className="mt-3 flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
            KKM (Kriteria Ketuntasan Minimal)
            <input
              type="number"
              min={0}
              max={100}
              className="input-field"
              value={kkm}
              onChange={(e) => setKkm(Number(e.target.value))}
            />
          </label>
        )}
      </Card>

      <Card className="flex min-h-[300px] flex-col items-center justify-center text-center">
        {mode === 'baku' ? (
          <>
            <p className={`font-display text-[48px] font-semibold ${hasilBaku.warna}`}>
              {hasilBaku.huruf}
            </p>
            <p className={`mt-1 text-[16px] font-medium ${hasilBaku.warna}`}>{hasilBaku.predikat}</p>
            <p className="mt-3 text-[13px] text-ink-soft">
              Skala: A ≥90 · B ≥80 · C ≥70 · D &lt;70
            </p>
          </>
        ) : (
          <>
            <p className={`font-display text-[32px] font-semibold ${hasilKkm.warna}`}>
              {hasilKkm.status}
            </p>
            <p className={`mt-1 text-[16px] font-medium ${hasilKkm.warna}`}>{hasilKkm.predikat}</p>
            <p className="mt-3 text-[13px] text-ink-soft">KKM saat ini: {kkm}</p>
          </>
        )}
      </Card>
    </div>
  );
}
