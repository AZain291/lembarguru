'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MAPEL_UMUM, MAPEL_LAINNYA, KELAS_BY_JENJANG, Field } from '@/components/forms/shared';
import type { FlashcardResult } from '@/lib/types';

export function FlashcardForm() {
  const [form, setForm] = useState({
    jenjang: 'SD',
    kelas: '5',
    mapel: 'Matematika',
    topik: '',
    jumlah_kartu: 10,
  });
  const isCustomMapel = !MAPEL_UMUM.includes(form.mapel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasil, setHasil] = useState<FlashcardResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHasil(null);

    const res = await fetch('/api/generate-flashcard', {
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

          <Field label="Topik">
            <input
              className="input-field"
              placeholder="mis. nama-nama planet"
              value={form.topik}
              onChange={(e) => setForm({ ...form, topik: e.target.value })}
            />
          </Field>

          <Field label="Jumlah kartu (maks. 20)">
            <input
              type="number"
              min={1}
              max={20}
              className="input-field"
              value={form.jumlah_kartu}
              onChange={(e) => setForm({ ...form, jumlah_kartu: Number(e.target.value) })}
            />
          </Field>

          {error && <p className="rounded-lg bg-red-soft px-3 py-2 text-[13.5px] text-red">{error}</p>}

          <Button type="submit" disabled={loading || !form.topik} className="justify-center">
            {loading ? 'Menyusun flashcard...' : 'Buat Flashcard'}
          </Button>
        </form>
      </Card>

      <div>
        {!hasil && !loading && (
          <Card className="flex h-full min-h-[300px] items-center justify-center text-center text-[14px] text-ink-soft">
            Flashcard akan muncul di sini setelah kamu klik &quot;Buat Flashcard&quot;.
          </Card>
        )}
        {loading && (
          <Card className="flex h-full min-h-[300px] items-center justify-center text-center text-[14px] text-ink-soft">
            Sedang menyusun flashcard, mohon tunggu sebentar...
          </Card>
        )}
        {hasil && (
          <Card>
            <h2 className="mb-4 border-b border-ink pb-3 font-display text-[19px] font-semibold">
              {hasil.judul}
            </h2>
            <p className="mb-3 text-[12.5px] text-ink-soft">Klik kartu untuk membalik.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {hasil.kartu.map((k, i) => (
                <FlipCard key={i} depan={k.depan} belakang={k.belakang} />
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function FlipCard({ depan, belakang }: { depan: string; belakang: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped(!flipped)}
      className="h-[140px] w-full text-left [perspective:1000px]"
    >
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-grid-line bg-surface p-3 text-center text-[13.5px] font-medium text-ink [backface-visibility:hidden]">
          {depan}
        </div>
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-ink bg-paper-deep p-3 text-center text-[13px] text-ink-soft [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {belakang}
        </div>
      </div>
    </button>
  );
}
