'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function TextToSpeech() {
  const [teks, setTeks] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }
    function muatSuara() {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
      setVoiceURI((prev) => prev || list.find((v) => v.lang.startsWith('id'))?.voiceURI || list[0]?.voiceURI || '');
    }
    muatSuara();
    window.speechSynthesis.onvoiceschanged = muatSuara;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  function putar() {
    if (!teks.trim() || !supported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(teks);
    const voice = voices.find((v) => v.voiceURI === voiceURI);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  }

  function berhenti() {
    window.speechSynthesis.cancel();
    setPlaying(false);
  }

  if (!supported) {
    return (
      <Card className="text-center text-[14px] text-ink-soft">
        Peramban ini tidak mendukung fitur text-to-speech. Coba gunakan Chrome atau Edge terbaru.
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      <Card>
        <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
          Suara
          <select className="select-field" value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)}>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
            ))}
          </select>
        </label>

        <label className="mt-3 flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
          Kecepatan bicara: {rate.toFixed(1)}x
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </label>

        <div className="mt-4 flex gap-2">
          <Button onClick={putar} disabled={!teks.trim() || playing} className="flex-1 justify-center">
            Putar
          </Button>
          <Button variant="ghost" onClick={berhenti} disabled={!playing} className="flex-1 justify-center">
            Berhenti
          </Button>
        </div>
      </Card>

      <Card>
        <textarea
          className="input-field min-h-[280px]"
          placeholder="Tempel atau tulis teks/cerita yang ingin dibacakan untuk siswa..."
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
        />
        <p className="mt-2 text-[12px] text-ink-soft">{teks.trim().split(/\s+/).filter(Boolean).length} kata</p>
      </Card>
    </div>
  );
}
