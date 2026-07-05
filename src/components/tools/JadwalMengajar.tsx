'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const JUMLAH_JAM = 8;
const STORAGE_KEY = 'lg_jadwal_mengajar';

type Jadwal = Record<string, string>; // key `${hari}-${jam}` -> "Mapel - Kelas"

export function JadwalMengajar() {
  const [jadwal, setJadwal] = useState<Jadwal>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setJadwal(JSON.parse(raw));
    } catch {
      // localStorage bisa gagal (mis. mode privat) — mulai dari jadwal kosong saja
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jadwal));
    } catch {
      // abaikan — penyimpanan lokal opsional, bukan fitur kritis
    }
  }, [jadwal, loaded]);

  function setSel(hari: string, jam: number, value: string) {
    setJadwal((prev) => ({ ...prev, [`${hari}-${jam}`]: value }));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12.5px] text-ink-soft">
        Disimpan otomatis di perangkat ini saja — tidak tersinkron ke perangkat lain.
      </p>
      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-surface px-2 py-2 text-left text-ink-soft">Hari</th>
              {Array.from({ length: JUMLAH_JAM }, (_, i) => (
                <th key={i} className="px-2 py-2 text-ink-soft">
                  Jam {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HARI.map((hari) => (
              <tr key={hari} className="border-t border-grid-line">
                <td className="sticky left-0 bg-surface px-2 py-2 font-medium text-ink">{hari}</td>
                {Array.from({ length: JUMLAH_JAM }, (_, i) => {
                  const jam = i + 1;
                  const key = `${hari}-${jam}`;
                  return (
                    <td key={jam} className="px-1 py-1">
                      <input
                        className="w-[100px] rounded-md border border-grid-line bg-surface px-2 py-1.5 text-[12.5px] text-ink"
                        placeholder="-"
                        value={jadwal[key] ?? ''}
                        onChange={(e) => setSel(hari, jam, e.target.value)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
