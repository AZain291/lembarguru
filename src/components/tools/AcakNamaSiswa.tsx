'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function parseNama(teks: string): string[] {
  return teks
    .split('\n')
    .map((n) => n.trim())
    .filter(Boolean);
}

export function AcakNamaSiswa() {
  const [daftarTeks, setDaftarTeks] = useState('');
  const [terpilih, setTerpilih] = useState<string | null>(null);
  const [mengacak, setMengacak] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const daftarNama = parseNama(daftarTeks);

  function acak() {
    if (daftarNama.length === 0) return;
    setMengacak(true);

    let hitungan = 0;
    const totalPutaran = 14;
    intervalRef.current = setInterval(() => {
      const acakan = daftarNama[Math.floor(Math.random() * daftarNama.length)];
      setTerpilih(acakan);
      hitungan += 1;
      if (hitungan >= totalPutaran) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setMengacak(false);
      }
    }, 80);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      <Card>
        <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
          Daftar nama siswa (satu nama per baris)
          <textarea
            className="input-field min-h-[220px]"
            placeholder={'Contoh:\nAndi\nBudi\nCitra'}
            value={daftarTeks}
            onChange={(e) => setDaftarTeks(e.target.value)}
          />
        </label>
        <p className="mt-1.5 text-[12.5px] text-ink-soft">{daftarNama.length} nama terdaftar</p>
        <Button
          className="mt-4 w-full justify-center"
          onClick={acak}
          disabled={mengacak || daftarNama.length === 0}
        >
          {mengacak ? 'Mengacak...' : 'Acak Nama'}
        </Button>
      </Card>

      <Card className="flex min-h-[300px] items-center justify-center text-center">
        {terpilih ? (
          <p className="font-display text-[32px] font-semibold text-ink">{terpilih}</p>
        ) : (
          <p className="text-[14px] text-ink-soft">
            Hasil akan muncul di sini setelah kamu klik &quot;Acak Nama&quot;.
          </p>
        )}
      </Card>
    </div>
  );
}
