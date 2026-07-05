'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Status = 'hadir' | 'izin' | 'sakit' | 'alpa';
const STATUS_LIST: { key: Status; label: string; warna: string }[] = [
  { key: 'hadir', label: 'Hadir', warna: '#2F6F5E' },
  { key: 'izin', label: 'Izin', warna: '#B98A1F' },
  { key: 'sakit', label: 'Sakit', warna: '#0EA5E9' },
  { key: 'alpa', label: 'Alpa', warna: '#C23B2E' },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function parseNama(teks: string): string[] {
  return teks.split('\n').map((n) => n.trim()).filter(Boolean);
}

export function PresensiDigital() {
  const [daftarTeks, setDaftarTeks] = useState('');
  const [status, setStatus] = useState<Partial<Record<string, Status>>>({});
  const [loaded, setLoaded] = useState(false);
  const tanggal = todayKey();

  useEffect(() => {
    try {
      const daftarRaw = localStorage.getItem('lg_presensi_daftar');
      if (daftarRaw) setDaftarTeks(daftarRaw);
      const statusRaw = localStorage.getItem(`lg_presensi_${tanggal}`);
      if (statusRaw) setStatus(JSON.parse(statusRaw));
    } catch {
      // localStorage bisa gagal -- mulai dari kosong
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem('lg_presensi_daftar', daftarTeks);
    } catch {
      // abaikan
    }
  }, [daftarTeks, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(`lg_presensi_${tanggal}`, JSON.stringify(status));
    } catch {
      // abaikan
    }
  }, [status, loaded, tanggal]);

  const daftarNama = useMemo(() => parseNama(daftarTeks), [daftarTeks]);

  function setSel(nama: string, s: Status) {
    setStatus((prev) => ({ ...prev, [nama]: prev[nama] === s ? undefined : s }));
  }

  function tandaiSemuaHadir() {
    const next: Record<string, Status> = {};
    daftarNama.forEach((n) => (next[n] = 'hadir'));
    setStatus(next);
  }

  const tally = STATUS_LIST.map((s) => ({
    ...s,
    jumlah: daftarNama.filter((n) => status[n] === s.key).length,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
          Daftar nama siswa (satu nama per baris)
          <textarea
            className="input-field min-h-[200px]"
            placeholder={'Contoh:\nAndi\nBudi\nCitra'}
            value={daftarTeks}
            onChange={(e) => setDaftarTeks(e.target.value)}
          />
        </label>
        <p className="mt-2 text-[12px] text-ink-soft">
          Presensi tanggal {new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, disimpan di perangkat ini.
        </p>
        {daftarNama.length > 0 && (
          <Button variant="ghost" className="mt-3 w-full justify-center" onClick={tandaiSemuaHadir}>
            Tandai Semua Hadir
          </Button>
        )}
      </Card>

      <div className="flex flex-col gap-4">
        {daftarNama.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {tally.map((s) => (
              <div key={s.key} className="rounded-lg border border-grid-line p-3 text-center">
                <p className="font-display text-[22px] font-bold" style={{ color: s.warna }}>{s.jumlah}</p>
                <p className="text-[11.5px] text-ink-soft">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <Card>
          {daftarNama.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-ink-soft">Masukkan daftar nama siswa di samping.</p>
          ) : (
            <div className="flex flex-col divide-y divide-grid-line">
              {daftarNama.map((nama) => (
                <div key={nama} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="text-[13.5px] font-medium text-ink">{nama}</span>
                  <div className="flex gap-1.5">
                    {STATUS_LIST.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setSel(nama, s.key)}
                        className="rounded-md border px-2 py-1 text-[11.5px] font-medium"
                        style={
                          status[nama] === s.key
                            ? { background: s.warna, borderColor: s.warna, color: '#fff' }
                            : { borderColor: 'var(--color-grid-line)', color: 'var(--color-ink-soft)' }
                        }
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
