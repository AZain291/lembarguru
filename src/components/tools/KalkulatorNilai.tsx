'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Komponen {
  id: string;
  nama: string;
  nilai: number;
  bobot: number;
}

function buatKomponen(nama: string, bobot: number): Komponen {
  return { id: crypto.randomUUID(), nama, nilai: 0, bobot };
}

export function KalkulatorNilai() {
  const [komponen, setKomponen] = useState<Komponen[]>([
    buatKomponen('Tugas', 20),
    buatKomponen('UH', 30),
    buatKomponen('UTS', 20),
    buatKomponen('UAS', 30),
  ]);
  const [kkm, setKkm] = useState(75);

  function ubah(id: string, field: 'nilai' | 'bobot' | 'nama', value: string) {
    setKomponen((prev) =>
      prev.map((k) =>
        k.id === id ? { ...k, [field]: field === 'nama' ? value : Number(value) } : k
      )
    );
  }

  function tambahBaris() {
    setKomponen((prev) => [...prev, buatKomponen('Komponen baru', 0)]);
  }

  function hapusBaris(id: string) {
    setKomponen((prev) => prev.filter((k) => k.id !== id));
  }

  const totalBobot = komponen.reduce((sum, k) => sum + (k.bobot || 0), 0);
  const nilaiAkhir =
    totalBobot > 0
      ? komponen.reduce((sum, k) => sum + k.nilai * k.bobot, 0) / totalBobot
      : 0;
  const tuntas = nilaiAkhir >= kkm;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_90px_90px_36px] gap-2 px-1 text-[11.5px] font-semibold uppercase text-ink-soft">
            <span>Komponen</span>
            <span>Nilai</span>
            <span>Bobot %</span>
            <span />
          </div>
          {komponen.map((k) => (
            <div key={k.id} className="grid grid-cols-[1fr_90px_90px_36px] items-center gap-2">
              <input className="input-field" value={k.nama} onChange={(e) => ubah(k.id, 'nama', e.target.value)} />
              <input type="number" min={0} max={100} className="input-field" value={k.nilai} onChange={(e) => ubah(k.id, 'nilai', e.target.value)} />
              <input type="number" min={0} max={100} className="input-field" value={k.bobot} onChange={(e) => ubah(k.id, 'bobot', e.target.value)} />
              <button type="button" onClick={() => hapusBaris(k.id)} className="text-[16px] text-red">×</button>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="mt-3" onClick={tambahBaris}>+ Tambah komponen</Button>

        <label className="mt-5 flex max-w-[160px] flex-col gap-1.5 text-[13.5px] font-medium text-ink">
          KKM
          <input type="number" min={0} max={100} className="input-field" value={kkm} onChange={(e) => setKkm(Number(e.target.value))} />
        </label>

        {totalBobot !== 100 && (
          <p className="mt-3 text-[12.5px] text-gold">
            Total bobot saat ini {totalBobot}% (idealnya 100%) — nilai akhir tetap dihitung proporsional.
          </p>
        )}
      </Card>

      <Card className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <p className="text-[13px] text-ink-soft">Nilai Akhir</p>
        <p className={`font-display text-[48px] font-bold ${tuntas ? 'text-green' : 'text-red'}`}>
          {nilaiAkhir.toFixed(1)}
        </p>
        <p className={`text-[15px] font-semibold ${tuntas ? 'text-green' : 'text-red'}`}>
          {tuntas ? 'Tuntas' : 'Belum Tuntas'}
        </p>
        <p className="mt-2 text-[12.5px] text-ink-soft">KKM: {kkm}</p>
      </Card>
    </div>
  );
}
