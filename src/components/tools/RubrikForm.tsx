'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MAPEL_UMUM, MAPEL_LAINNYA, KELAS_BY_JENJANG, Field } from '@/components/forms/shared';
import type { RubrikResult } from '@/lib/types';

export function RubrikForm() {
  const [form, setForm] = useState({
    jenjang: 'SD',
    kelas: '5',
    mapel: 'Matematika',
    deskripsi_tugas: '',
    jumlah_level: 4,
  });
  const isCustomMapel = !MAPEL_UMUM.includes(form.mapel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasil, setHasil] = useState<RubrikResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHasil(null);

    const res = await fetch('/api/generate-rubrik', {
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

          <Field label="Deskripsi tugas/aktivitas yang dinilai">
            <textarea
              className="input-field min-h-[100px]"
              placeholder="mis. presentasi kelompok tentang siklus air"
              value={form.deskripsi_tugas}
              onChange={(e) => setForm({ ...form, deskripsi_tugas: e.target.value })}
            />
          </Field>

          <Field label="Jumlah level penilaian">
            <select
              className="select-field"
              value={form.jumlah_level}
              onChange={(e) => setForm({ ...form, jumlah_level: Number(e.target.value) })}
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} level</option>
              ))}
            </select>
          </Field>

          {error && <p className="rounded-lg bg-red-soft px-3 py-2 text-[13.5px] text-red">{error}</p>}

          <Button type="submit" disabled={loading || !form.deskripsi_tugas} className="justify-center">
            {loading ? 'Menyusun rubrik...' : 'Buat Rubrik'}
          </Button>
        </form>
      </Card>

      <div>
        {!hasil && !loading && (
          <Card className="flex h-full min-h-[300px] items-center justify-center text-center text-[14px] text-ink-soft">
            Rubrik akan muncul di sini setelah kamu klik &quot;Buat Rubrik&quot;.
          </Card>
        )}
        {loading && (
          <Card className="flex h-full min-h-[300px] items-center justify-center text-center text-[14px] text-ink-soft">
            Sedang menyusun rubrik, mohon tunggu sebentar...
          </Card>
        )}
        {hasil && <HasilRubrik hasil={hasil} />}
      </div>
    </div>
  );
}

function HasilRubrik({ hasil }: { hasil: RubrikResult }) {
  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-ink pb-3">
        <h2 className="font-display text-[19px] font-semibold">{hasil.judul}</h2>
        <Button variant="ghost" onClick={() => window.print()}>
          Cetak
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr>
              <th className="border-b border-grid-line px-3 py-2 text-left text-ink-soft">Kriteria</th>
              {hasil.levels.map((level) => (
                <th key={level} className="border-b border-grid-line px-3 py-2 text-left text-ink-soft">
                  {level}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hasil.kriteria.map((k) => (
              <tr key={k.nama} className="border-b border-grid-line">
                <td className="px-3 py-2 font-medium text-ink">{k.nama}</td>
                {k.deskriptor.map((d, i) => (
                  <td key={i} className="px-3 py-2 text-ink-soft">{d}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
