'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Tim {
  id: string;
  nama: string;
  skor: number;
}

const STORAGE_KEY = 'lg_papan_poin';
const WARNA = ['#C23B2E', '#2F6F5E', '#1F2A44', '#B98A1F', '#7C3AED', '#0EA5E9'];

export function PapanPoin() {
  const [tim, setTim] = useState<Tim[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [namaBaru, setNamaBaru] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTim(JSON.parse(raw));
    } catch {
      // localStorage bisa gagal -- mulai dari papan kosong
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tim));
    } catch {
      // abaikan
    }
  }, [tim, loaded]);

  function tambahTim() {
    if (!namaBaru.trim()) return;
    setTim((prev) => [...prev, { id: crypto.randomUUID(), nama: namaBaru.trim(), skor: 0 }]);
    setNamaBaru('');
  }

  function ubahSkor(id: string, delta: number) {
    setTim((prev) => prev.map((t) => (t.id === id ? { ...t, skor: t.skor + delta } : t)));
  }

  function hapusTim(id: string) {
    setTim((prev) => prev.filter((t) => t.id !== id));
  }

  function resetSkor() {
    setTim((prev) => prev.map((t) => ({ ...t, skor: 0 })));
  }

  const skorTertinggi = tim.length > 0 ? Math.max(...tim.map((t) => t.skor)) : 0;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-wrap gap-2">
          <input
            className="input-field flex-1"
            style={{ minWidth: 180 }}
            placeholder="Nama kelompok/tim baru"
            value={namaBaru}
            onChange={(e) => setNamaBaru(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tambahTim()}
          />
          <Button onClick={tambahTim} disabled={!namaBaru.trim()}>Tambah Tim</Button>
          {tim.length > 0 && <Button variant="ghost" onClick={resetSkor}>Reset Skor</Button>}
        </div>
      </Card>

      {tim.length === 0 && (
        <Card className="flex min-h-[200px] items-center justify-center text-center text-[14px] text-ink-soft">
          Tambahkan tim untuk mulai mencatat poin.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tim.map((t, i) => (
          <Card key={t.id} className="flex flex-col items-center gap-3 text-center">
            <span
              className="rounded-full px-3 py-1 text-[12px] font-semibold text-white"
              style={{ background: WARNA[i % WARNA.length] }}
            >
              {t.nama}
            </span>
            <p className="font-display text-[40px] font-bold text-ink">
              {t.skor}
              {t.skor === skorTertinggi && t.skor > 0 && <span className="ml-1 text-[20px]">🏆</span>}
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              <button type="button" onClick={() => ubahSkor(t.id, -5)} className="rounded-md border border-grid-line px-2 py-1 text-[12px] text-ink-soft">-5</button>
              <button type="button" onClick={() => ubahSkor(t.id, -1)} className="rounded-md border border-grid-line px-2 py-1 text-[12px] text-ink-soft">-1</button>
              <button type="button" onClick={() => ubahSkor(t.id, 1)} className="rounded-md bg-accent px-2 py-1 text-[12px] text-white">+1</button>
              <button type="button" onClick={() => ubahSkor(t.id, 5)} className="rounded-md bg-accent px-2 py-1 text-[12px] text-white">+5</button>
            </div>
            <button type="button" onClick={() => hapusTim(t.id)} className="text-[12px] text-red underline">
              Hapus tim
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
