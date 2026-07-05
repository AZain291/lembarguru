'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Ide {
  judul: string;
  deskripsi: string;
  durasi: string;
  kategori: 'Pembuka' | 'Energizer' | 'Penutup';
}

const IDE_LIST: Ide[] = [
  { judul: 'Tepuk Semangat', deskripsi: 'Guru memberi aba-aba tepuk 1-2-3, siswa bertepuk sesuai pola sambil berteriak "Semangat!"', durasi: '2 menit', kategori: 'Pembuka' },
  { judul: 'Dua Kebenaran Satu Kebohongan', deskripsi: 'Setiap siswa menyebut 3 pernyataan tentang dirinya, teman menebak mana yang bohong.', durasi: '10 menit', kategori: 'Pembuka' },
  { judul: 'Simon Says', deskripsi: 'Siswa hanya mengikuti instruksi yang diawali "Simon says...", kalau tidak diawali itu jangan bergerak.', durasi: '5 menit', kategori: 'Energizer' },
  { judul: 'Berdiri-Duduk Cepat', deskripsi: 'Guru menyebut kategori (mis. "yang suka matematika"), siswa yang sesuai berdiri secepat mungkin.', durasi: '3 menit', kategori: 'Energizer' },
  { judul: 'Estafet Nama', deskripsi: 'Siswa pertama sebut namanya, siswa kedua ulangi nama pertama lalu sebut namanya, dst.', durasi: '5 menit', kategori: 'Pembuka' },
  { judul: 'Tebak Emosi', deskripsi: 'Satu siswa memperagakan emosi tanpa suara, yang lain menebak.', durasi: '5 menit', kategori: 'Energizer' },
  { judul: 'Lingkaran Terima Kasih', deskripsi: 'Siswa bergiliran mengucapkan satu hal yang mereka syukuri hari ini.', durasi: '5 menit', kategori: 'Penutup' },
  { judul: 'Refleksi Satu Kata', deskripsi: 'Setiap siswa menyebut satu kata yang menggambarkan pelajaran hari ini.', durasi: '3 menit', kategori: 'Penutup' },
  { judul: 'Hujan Tepuk', deskripsi: 'Guru memimpin gerakan tepuk yang menirukan suara hujan, dari rintik hingga deras lalu reda lagi.', durasi: '2 menit', kategori: 'Energizer' },
  { judul: 'Cerita Berantai', deskripsi: 'Siswa bergiliran menambahkan satu kalimat untuk menyambung cerita yang dimulai guru.', durasi: '8 menit', kategori: 'Pembuka' },
  { judul: 'Freeze Dance', deskripsi: 'Siswa menari mengikuti musik dan harus membeku begitu musik berhenti.', durasi: '5 menit', kategori: 'Energizer' },
  { judul: 'Pesan Berbisik', deskripsi: 'Kalimat dibisikkan berantai dari siswa ke siswa, bandingkan hasil akhir dengan aslinya.', durasi: '7 menit', kategori: 'Energizer' },
  { judul: 'Bintang Hari Ini', deskripsi: 'Pilih satu siswa "bintang hari ini" secara bergilir, teman-teman memberi satu pujian tulus.', durasi: '5 menit', kategori: 'Penutup' },
  { judul: 'Tebak Gambar', deskripsi: 'Satu siswa menggambar di papan tanpa kata, yang lain menebak apa yang digambar.', durasi: '6 menit', kategori: 'Energizer' },
  { judul: 'Yel-Yel Kelas', deskripsi: 'Seluruh kelas meneriakkan yel-yel kelas yang sudah disepakati bersama untuk membangkitkan semangat.', durasi: '2 menit', kategori: 'Pembuka' },
  { judul: 'Harapan untuk Besok', deskripsi: 'Setiap siswa menuliskan satu harapan kecil untuk pertemuan besok di secarik kertas.', durasi: '4 menit', kategori: 'Penutup' },
];

const KATEGORI: ('Semua' | Ide['kategori'])[] = ['Semua', 'Pembuka', 'Energizer', 'Penutup'];

export function IceBreaker() {
  const [filter, setFilter] = useState<'Semua' | Ide['kategori']>('Semua');
  const [ide, setIde] = useState<Ide | null>(null);

  function acak() {
    const kandidat = filter === 'Semua' ? IDE_LIST : IDE_LIST.filter((i) => i.kategori === filter);
    if (kandidat.length === 0) return;
    let pilihan: Ide;
    do {
      pilihan = kandidat[Math.floor(Math.random() * kandidat.length)];
    } while (pilihan === ide && kandidat.length > 1);
    setIde(pilihan);
  }

  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center gap-5">
      <div className="flex flex-wrap justify-center gap-2">
        {KATEGORI.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium ${
              filter === k ? 'border-accent bg-accent text-white' : 'border-grid-line text-ink-soft'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <Card className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 text-center">
        {!ide ? (
          <p className="text-[14px] text-ink-soft">Klik &quot;Acak Ide&quot; untuk mendapat ide ice breaker.</p>
        ) : (
          <>
            <span className="rounded-full bg-paper-deep px-3 py-1 text-[11.5px] font-semibold text-ink-soft">
              {ide.kategori} · {ide.durasi}
            </span>
            <h2 className="font-display text-[24px] font-semibold text-ink">{ide.judul}</h2>
            <p className="max-w-[420px] text-[14px] text-ink-soft">{ide.deskripsi}</p>
          </>
        )}
      </Card>

      <Button onClick={acak}>{ide ? 'Ide Lain' : 'Acak Ide'}</Button>
    </div>
  );
}
