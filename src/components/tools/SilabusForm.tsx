'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MAPEL_UMUM, MAPEL_LAINNYA, KELAS_BY_JENJANG, Field } from '@/components/forms/shared';
import type { SilabusResult } from '@/lib/types';

export function SilabusForm() {
  const [form, setForm] = useState({
    jenjang: 'SD',
    kelas: '5',
    mapel: 'Matematika',
    kurikulum: 'merdeka',
    semester: 'ganjil',
  });
  const isCustomMapel = !MAPEL_UMUM.includes(form.mapel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasil, setHasil] = useState<SilabusResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHasil(null);

    const res = await fetch('/api/generate-silabus', {
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

          <div className="grid grid-cols-2 gap-3">
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
            <Field label="Semester">
              <select
                className="select-field"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              >
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>
            </Field>
          </div>

          {error && <p className="rounded-lg bg-red-soft px-3 py-2 text-[13.5px] text-red">{error}</p>}

          <Button type="submit" disabled={loading} className="justify-center">
            {loading ? 'Menyusun silabus...' : 'Buat Silabus'}
          </Button>
        </form>
      </Card>

      <div>
        {!hasil && !loading && (
          <Card className="flex h-full min-h-[300px] items-center justify-center text-center text-[14px] text-ink-soft">
            Silabus akan muncul di sini setelah kamu klik &quot;Buat Silabus&quot;.
          </Card>
        )}
        {loading && (
          <Card className="flex h-full min-h-[300px] items-center justify-center text-center text-[14px] text-ink-soft">
            Sedang menyusun silabus, mohon tunggu sebentar...
          </Card>
        )}
        {hasil && <HasilSilabus hasil={hasil} />}
      </div>
    </div>
  );
}

function HasilSilabus({ hasil }: { hasil: SilabusResult }) {
  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-ink pb-3">
        <h2 className="font-display text-[19px] font-semibold">{hasil.judul}</h2>
        <Button variant="ghost" onClick={() => window.print()}>
          Cetak
        </Button>
      </div>

      <h3 className="mb-2 font-display text-[15px] font-semibold text-ink">Kompetensi Inti</h3>
      <ul className="mb-5 flex flex-col gap-1.5 pl-4 text-[13.5px] text-ink-soft">
        {hasil.kompetensi_inti.map((ki, i) => (
          <li key={i}>{ki}</li>
        ))}
      </ul>

      <h3 className="mb-2 font-display text-[15px] font-semibold text-ink">Kompetensi Dasar</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr>
              <th className="border-b border-grid-line px-3 py-2 text-left text-ink-soft">Kompetensi Dasar</th>
              <th className="border-b border-grid-line px-3 py-2 text-left text-ink-soft">Materi Pokok</th>
            </tr>
          </thead>
          <tbody>
            {hasil.kompetensi_dasar.map((kd, i) => (
              <tr key={i} className="border-b border-grid-line">
                <td className="px-3 py-2 text-ink">{kd.kd}</td>
                <td className="px-3 py-2 text-ink-soft">{kd.materi_pokok}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
