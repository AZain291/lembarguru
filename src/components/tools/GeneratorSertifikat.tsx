'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function GeneratorSertifikat() {
  const [namaPenerima, setNamaPenerima] = useState('');
  const [judul, setJudul] = useState('Sertifikat Penghargaan');
  const [deskripsi, setDeskripsi] = useState('atas prestasi dan dedikasinya dalam kegiatan belajar');
  const [namaSekolah, setNamaSekolah] = useState('');
  const [namaPenandatangan, setNamaPenandatangan] = useState('');
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));

  const tanggalLabel = tanggal
    ? new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="print:hidden">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
            Judul sertifikat
            <input className="input-field" value={judul} onChange={(e) => setJudul(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
            Nama penerima
            <input className="input-field" placeholder="mis. Andi Saputra" value={namaPenerima} onChange={(e) => setNamaPenerima(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
            Deskripsi penghargaan
            <textarea className="input-field min-h-[80px]" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
            Nama sekolah/acara
            <input className="input-field" placeholder="mis. SDN Merdeka 01" value={namaSekolah} onChange={(e) => setNamaSekolah(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
            Nama penandatangan
            <input className="input-field" placeholder="mis. Siti Aminah, S.Pd." value={namaPenandatangan} onChange={(e) => setNamaPenandatangan(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
            Tanggal
            <input type="date" className="input-field" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </label>
          <Button onClick={() => window.print()} disabled={!namaPenerima.trim()} className="justify-center">
            Cetak / Simpan sebagai PDF
          </Button>
        </div>
      </Card>

      <div
        className="flex aspect-[1.4/1] flex-col items-center justify-center gap-4 rounded-2xl p-10 text-center print:aspect-auto print:rounded-none"
        style={{ border: '6px double #B98A1F', background: '#FFFDF8' }}
      >
        <p className="text-[12px] uppercase tracking-[0.25em] text-ink-soft">{namaSekolah || 'Nama Sekolah/Acara'}</p>
        <h1 className="font-display text-[32px] font-semibold text-ink">{judul}</h1>
        <p className="text-[13px] text-ink-soft">Diberikan kepada</p>
        <p className="font-display text-[40px] font-bold text-gold">{namaPenerima || 'Nama Penerima'}</p>
        <p className="max-w-[420px] text-[14px] text-ink-soft">{deskripsi}</p>
        <div className="mt-6 flex w-full max-w-[380px] items-center justify-between text-[12.5px] text-ink-soft">
          <span>{tanggalLabel}</span>
          <span className="border-t border-ink pt-1 font-medium text-ink">
            {namaPenandatangan || 'Nama Penandatangan'}
          </span>
        </div>
      </div>
    </div>
  );
}
