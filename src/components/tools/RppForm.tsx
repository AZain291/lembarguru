'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MAPEL_UMUM, MAPEL_LAINNYA, KELAS_BY_JENJANG, Field } from '@/components/forms/shared';
import type { RppResult } from '@/lib/types';

export function RppForm() {
  const [form, setForm] = useState({
    jenjang: 'SD',
    kelas: '5',
    mapel: 'Matematika',
    kurikulum: 'merdeka',
    topik: '',
    alokasi_waktu: '2 x 35 menit',
    tujuan: '',
  });
  const isCustomMapel = !MAPEL_UMUM.includes(form.mapel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasil, setHasil] = useState<RppResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHasil(null);

    const res = await fetch('/api/generate-rpp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Terjadi kesalahan. Coba lagi.');
      return;
    }
    setHasil(data.hasil);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      <Card>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jenjang">
              <select
                className="select-field"
                value={form.jenjang}
                onChange={(e) => {
                  const jenjang = e.target.value;
                  setForm({ ...form, jenjang, kelas: KELAS_BY_JENJANG[jenjang][0] });
                }}
              >
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
            </Field>
            <Field label="Kelas">
              <select
                className="select-field"
                value={form.kelas}
                onChange={(e) => setForm({ ...form, kelas: e.target.value })}
              >
                {KELAS_BY_JENJANG[form.jenjang].map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Mata pelajaran">
            <select
              className="select-field"
              value={isCustomMapel ? MAPEL_LAINNYA : form.mapel}
              onChange={(e) => {
                const val = e.target.value;
                setForm({ ...form, mapel: val === MAPEL_LAINNYA ? '' : val });
              }}
            >
              {MAPEL_UMUM.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value={MAPEL_LAINNYA}>Lainnya (ketik sendiri)</option>
            </select>
            {isCustomMapel && (
              <input
                className="input-field mt-2"
                placeholder="Tulis mata pelajaran"
                value={form.mapel}
                onChange={(e) => setForm({ ...form, mapel: e.target.value })}
              />
            )}
          </Field>

          <Field label="Kurikulum">
            <select
              className="select-field"
              value={form.kurikulum}
              onChange={(e) => setForm({ ...form, kurikulum: e.target.value })}
            >
              <option value="merdeka">Kurikulum Merdeka</option>
              <option value="k13">K-13</option>
            </select>
          </Field>

          <Field label="Topik/materi">
            <input
              className="input-field"
              placeholder="mis. pecahan sederhana"
              value={form.topik}
              onChange={(e) => setForm({ ...form, topik: e.target.value })}
            />
          </Field>

          <Field label="Alokasi waktu">
            <input
              className="input-field"
              placeholder="mis. 2 x 35 menit"
              value={form.alokasi_waktu}
              onChange={(e) => setForm({ ...form, alokasi_waktu: e.target.value })}
            />
          </Field>

          <Field label="Tujuan pembelajaran (opsional)">
            <textarea
              className="input-field min-h-[70px]"
              placeholder="Kosongkan kalau ingin AI yang menentukan"
              value={form.tujuan}
              onChange={(e) => setForm({ ...form, tujuan: e.target.value })}
            />
          </Field>

          {error && <p className="rounded-lg bg-red-soft px-3 py-2 text-[13.5px] text-red">{error}</p>}

          <Button type="submit" disabled={loading || !form.topik} className="justify-center">
            {loading ? 'Menyusun RPP...' : 'Buat RPP'}
          </Button>
        </form>
      </Card>

      <div>
        {!hasil && !loading && (
          <Card className="flex h-full min-h-[300px] items-center justify-center text-center text-[14px] text-ink-soft">
            RPP akan muncul di sini setelah kamu klik &quot;Buat RPP&quot;.
          </Card>
        )}
        {loading && (
          <Card className="flex h-full min-h-[300px] items-center justify-center text-center text-[14px] text-ink-soft">
            Sedang menyusun RPP, mohon tunggu sebentar...
          </Card>
        )}
        {hasil && <HasilRpp hasil={hasil} />}
      </div>
    </div>
  );
}

function Bagian({ judul, poin }: { judul: string; poin: string[] }) {
  return (
    <div className="mb-5">
      <h3 className="mb-1.5 font-display text-[15px] font-semibold text-ink">{judul}</h3>
      <ul className="flex flex-col gap-1 pl-4 text-[13.5px] text-ink-soft">
        {poin.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

function HasilRpp({ hasil }: { hasil: RppResult }) {
  const [copied, setCopied] = useState(false);

  function teksLengkap() {
    const bagian: [string, string[]][] = [
      ['Tujuan Pembelajaran', hasil.tujuan_pembelajaran],
      ['Kegiatan Pendahuluan', hasil.kegiatan_pendahuluan],
      ['Kegiatan Inti', hasil.kegiatan_inti],
      ['Kegiatan Penutup', hasil.kegiatan_penutup],
      ['Penilaian', hasil.penilaian],
      ['Sumber Belajar', hasil.sumber_belajar],
    ];
    let teks = `${hasil.judul}\n\n`;
    bagian.forEach(([judul, poin]) => {
      teks += `${judul}\n`;
      poin.forEach((p) => (teks += `- ${p}\n`));
      teks += '\n';
    });
    return teks.trim();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(teksLengkap());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // abaikan
    }
  }

  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-ink pb-3">
        <h2 className="font-display text-[19px] font-semibold">{hasil.judul}</h2>
        <Button variant="ghost" onClick={copy}>
          {copied ? 'Tersalin ✓' : 'Copy sebagai teks'}
        </Button>
      </div>
      <Bagian judul="Tujuan Pembelajaran" poin={hasil.tujuan_pembelajaran} />
      <Bagian judul="Kegiatan Pendahuluan" poin={hasil.kegiatan_pendahuluan} />
      <Bagian judul="Kegiatan Inti" poin={hasil.kegiatan_inti} />
      <Bagian judul="Kegiatan Penutup" poin={hasil.kegiatan_penutup} />
      <Bagian judul="Penilaian" poin={hasil.penilaian} />
      <Bagian judul="Sumber Belajar" poin={hasil.sumber_belajar} />
    </Card>
  );
}
