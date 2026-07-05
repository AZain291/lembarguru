'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Catatan {
  tanggal: string;
  teks: string;
}
interface Siswa {
  id: string;
  nama: string;
  catatan: Catatan[];
}

const STORAGE_KEY = 'lg_catatan_siswa';

export function CatatanSiswa() {
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [namaBaru, setNamaBaru] = useState('');
  const [catatanBaru, setCatatanBaru] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSiswa(JSON.parse(raw));
    } catch {
      // localStorage bisa gagal -- mulai dari daftar kosong
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(siswa));
    } catch {
      // abaikan
    }
  }, [siswa, loaded]);

  function tambahSiswa() {
    if (!namaBaru.trim()) return;
    const baru: Siswa = { id: crypto.randomUUID(), nama: namaBaru.trim(), catatan: [] };
    setSiswa((prev) => [...prev, baru]);
    setNamaBaru('');
    setSelectedId(baru.id);
  }

  function hapusSiswa(id: string) {
    setSiswa((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function tambahCatatan() {
    if (!selectedId || !catatanBaru.trim()) return;
    const entri: Catatan = { tanggal: new Date().toISOString().slice(0, 10), teks: catatanBaru.trim() };
    setSiswa((prev) => prev.map((s) => (s.id === selectedId ? { ...s, catatan: [entri, ...s.catatan] } : s)));
    setCatatanBaru('');
  }

  const dipilih = siswa.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <Card>
        <div className="flex gap-2">
          <input
            className="input-field"
            placeholder="Nama siswa baru"
            value={namaBaru}
            onChange={(e) => setNamaBaru(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tambahSiswa()}
          />
          <Button onClick={tambahSiswa} disabled={!namaBaru.trim()}>+</Button>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          {siswa.length === 0 && <p className="py-6 text-center text-[13px] text-ink-soft">Belum ada siswa.</p>}
          {siswa.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-[13.5px] ${
                selectedId === s.id ? 'bg-accent text-white' : 'text-ink hover:bg-paper-deep'
              }`}
            >
              <span>{s.nama}</span>
              <span className={`text-[11px] ${selectedId === s.id ? 'text-white/70' : 'text-ink-soft'}`}>
                {s.catatan.length}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        {!dipilih ? (
          <p className="py-10 text-center text-[14px] text-ink-soft">Pilih atau tambahkan siswa untuk mulai mencatat.</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between border-b border-ink pb-3">
              <h2 className="font-display text-[19px] font-semibold text-ink">{dipilih.nama}</h2>
              <button type="button" onClick={() => hapusSiswa(dipilih.id)} className="text-[12px] text-red underline">
                Hapus siswa
              </button>
            </div>

            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <textarea
                className="input-field min-h-[70px] flex-1"
                placeholder="Tulis catatan perkembangan/perilaku..."
                value={catatanBaru}
                onChange={(e) => setCatatanBaru(e.target.value)}
              />
              <Button onClick={tambahCatatan} disabled={!catatanBaru.trim()}>Simpan</Button>
            </div>

            {dipilih.catatan.length === 0 ? (
              <p className="text-[13.5px] text-ink-soft">Belum ada catatan untuk siswa ini.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {dipilih.catatan.map((c, i) => (
                  <div key={i} className="rounded-lg border border-grid-line p-3">
                    <p className="mb-1 text-[11.5px] text-ink-soft">
                      {new Date(c.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[13.5px] text-ink">{c.teks}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
