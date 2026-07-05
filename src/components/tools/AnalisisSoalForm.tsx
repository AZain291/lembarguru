'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MAPEL_UMUM, MAPEL_LAINNYA, KELAS_BY_JENJANG, Field } from '@/components/forms/shared';
import type { AnalisisSoalResult } from '@/lib/types';

export function AnalisisSoalForm() {
  const [form, setForm] = useState({
    jenjang: 'SD',
    kelas: '5',
    mapel: 'Matematika',
    teks_soal: '',
  });
  const isCustomMapel = !MAPEL_UMUM.includes(form.mapel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasil, setHasil] = useState<AnalisisSoalResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHasil(null);

    const res = await fetch('/api/generate-analisis-soal', {
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

          <Field label="Tempel soal yang ingin dianalisis">
            <textarea
              className="input-field min-h-[220px]"
              placeholder={'Tempel soal di sini, satu soal per baris/paragraf...'}
              value={form.teks_soal}
              onChange={(e) => setForm({ ...form, teks_soal: e.target.value })}
            />
          </Field>

          {error && <p className="rounded-lg bg-red-soft px-3 py-2 text-[13.5px] text-red">{error}</p>}

          <Button type="submit" disabled={loading || !form.teks_soal} className="justify-center">
            {loading ? 'Menganalisis...' : 'Analisis Soal'}
          </Button>
        </form>
      </Card>

      <div>
        {!hasil && !loading && (
          <Card className="flex h-full min-h-[300px] items-center justify-center text-center text-[14px] text-ink-soft">
            Hasil analisis akan muncul di sini setelah kamu klik &quot;Analisis Soal&quot;.
          </Card>
        )}
        {loading && (
          <Card className="flex h-full min-h-[300px] items-center justify-center text-center text-[14px] text-ink-soft">
            Sedang menganalisis soal, mohon tunggu sebentar...
          </Card>
        )}
        {hasil && <HasilAnalisis hasil={hasil} />}
      </div>
    </div>
  );
}

function HasilAnalisis({ hasil }: { hasil: AnalisisSoalResult }) {
  return (
    <Card>
      <h2 className="mb-2 font-display text-[19px] font-semibold">Hasil Analisis</h2>
      <p className="mb-5 border-b border-ink pb-4 text-[13.5px] text-ink-soft">{hasil.ringkasan}</p>

      <div className="flex flex-col gap-3">
        {hasil.analisis.map((a) => (
          <div key={a.nomor} className="rounded-lg border border-grid-line p-3">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink">Soal {a.nomor}</span>
              <span className="rounded bg-paper-deep px-2 py-0.5 font-mono text-[11px] text-ink-soft">
                {a.kategori}
              </span>
              <span className="rounded bg-paper-deep px-2 py-0.5 font-mono text-[11px] capitalize text-ink-soft">
                {a.tingkat_kesulitan}
              </span>
            </div>
            <p className="text-[13.5px] text-ink-soft">
              <b className="text-ink">Validitas:</b> {a.catatan_validitas}
            </p>
            <p className="mt-1 text-[13.5px] text-ink-soft">
              <b className="text-ink">Saran:</b> {a.saran_perbaikan}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
