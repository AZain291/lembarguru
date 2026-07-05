'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const PRESET_MENIT = [1, 3, 5, 10, 15, 30];

function formatWaktu(detik: number): string {
  const m = Math.floor(detik / 60).toString().padStart(2, '0');
  const s = Math.floor(detik % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function bunyikanBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    // Web Audio tidak tersedia -- abaikan, tampilan visual tetap menandai selesai
  }
}

export function TimerKelas() {
  const [totalDetik, setTotalDetik] = useState(5 * 60);
  const [sisaDetik, setSisaDetik] = useState(5 * 60);
  const [berjalan, setBerjalan] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!berjalan) return;
    intervalRef.current = setInterval(() => {
      setSisaDetik((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setBerjalan(false);
          setSelesai(true);
          bunyikanBeep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [berjalan]);

  function pilihPreset(menit: number) {
    const detik = menit * 60;
    setTotalDetik(detik);
    setSisaDetik(detik);
    setBerjalan(false);
    setSelesai(false);
  }

  function mulaiJeda() {
    if (sisaDetik === 0) return;
    setSelesai(false);
    setBerjalan((b) => !b);
  }

  function reset() {
    setBerjalan(false);
    setSelesai(false);
    setSisaDetik(totalDetik);
  }

  const progres = totalDetik > 0 ? ((totalDetik - sisaDetik) / totalDetik) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      <Card>
        <p className="mb-3 text-[13.5px] font-medium text-ink">Pilih durasi</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_MENIT.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => pilihPreset(m)}
              className={`rounded-lg border py-2 text-[13px] font-medium ${
                totalDetik === m * 60 ? 'border-accent bg-accent text-white' : 'border-grid-line text-ink-soft'
              }`}
            >
              {m} mnt
            </button>
          ))}
        </div>

        <label className="mt-4 flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
          Durasi kustom (menit)
          <input
            type="number"
            min={1}
            className="input-field"
            value={Math.round(totalDetik / 60)}
            onChange={(e) => pilihPreset(Math.max(1, Number(e.target.value)))}
          />
        </label>
      </Card>

      <Card className="flex flex-col items-center justify-center gap-5 py-10">
        <p className={`font-display text-[64px] font-semibold tabular-nums ${selesai ? 'text-red' : 'text-ink'}`}>
          {formatWaktu(sisaDetik)}
        </p>
        <div className="h-2 w-full max-w-[280px] overflow-hidden rounded-full bg-paper-deep">
          <div className="h-full bg-accent transition-all" style={{ width: `${progres}%` }} />
        </div>
        {selesai && <p className="text-[14px] font-semibold text-red">Waktu habis!</p>}
        <div className="flex gap-3">
          <Button onClick={mulaiJeda} disabled={sisaDetik === 0}>
            {berjalan ? 'Jeda' : 'Mulai'}
          </Button>
          <Button variant="ghost" onClick={reset}>Reset</Button>
        </div>
      </Card>
    </div>
  );
}
