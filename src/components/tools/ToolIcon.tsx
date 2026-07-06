import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

// Set ikon SVG garis (bukan emoji) untuk grid "Alat Bantu Guru" & header
// halaman /tools/{slug} -- currentColor supaya otomatis ikut warna
// ink/accent tema (termasuk mode gelap), tanpa perlu varian per-tema.
const ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  'generator-rpp': (p) => (
    <Base {...p}>
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h6M9 16.5h6M9 9.5h2" />
    </Base>
  ),
  'bank-soal': (p) => (
    <Base {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h4.5l1.5 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </Base>
  ),
  'analisis-soal': (p) => (
    <Base {...p}>
      <path d="M4 20h16" />
      <rect x="5" y="12" width="3" height="8" rx="0.6" />
      <rect x="10.5" y="7" width="3" height="13" rx="0.6" />
      <rect x="16" y="15" width="3" height="5" rx="0.6" />
    </Base>
  ),
  'silabus-ki-kd': (p) => (
    <Base {...p}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3.5h6a1 1 0 0 1 1 1V5H8v-.5a1 1 0 0 1 1-1Z" />
      <path d="M9 11h6M9 14.5h6M9 18h4" />
    </Base>
  ),
  flashcard: (p) => (
    <Base {...p}>
      <rect x="7" y="4" width="13" height="16" rx="2" />
      <path d="M4 8v11a2 2 0 0 0 2 2h9" />
    </Base>
  ),
  'rubrik-penilaian': (p) => (
    <Base {...p}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8.5 12l2 2 4-4" />
      <path d="M8.5 16.5h6" />
    </Base>
  ),
  'acak-nama-siswa': (p) => (
    <Base {...p}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </Base>
  ),
  'bagi-kelompok': (p) => (
    <Base {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c0-3.6 2.5-6.5 5.5-6.5s5.5 2.9 5.5 6.5" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M14.8 13.8c2.5.3 4.7 2.7 4.7 6.2" />
    </Base>
  ),
  'jadwal-mengajar': (p) => (
    <Base {...p}>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 9.5h16M8 3v4M16 3v4" />
      <path d="M8 13.5h2M12 13.5h2M16 13.5h1" />
    </Base>
  ),
  'konversi-nilai': (p) => (
    <Base {...p}>
      <circle cx="7.5" cy="7.5" r="2.2" />
      <circle cx="16.5" cy="16.5" r="2.2" />
      <path d="M17 6 7 18" />
    </Base>
  ),
  'timer-kelas': (p) => (
    <Base {...p}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2" />
      <path d="M10 2h4M12 2v3" />
    </Base>
  ),
  'papan-poin': (p) => (
    <Base {...p}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" />
      <path d="M12 13v3M9.5 20h5M10.2 17h3.6v3h-3.6Z" />
    </Base>
  ),
  'presensi-digital': (p) => (
    <Base {...p}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.6 2.7-6.5 6-6.5s6 2.9 6 6.5" />
      <path d="M16 12.5l2 2 3.5-3.5" />
    </Base>
  ),
  'generator-sertifikat': (p) => (
    <Base {...p}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M9 13.5 7.5 21l4.5-2.5L16.5 21 15 13.5" />
      <path d="M9.6 9 11 10.4l3.4-3.6" />
    </Base>
  ),
  'text-to-speech': (p) => (
    <Base {...p}>
      <path d="M5 10v4h3l4 4V6l-4 4Z" />
      <path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10.5" />
    </Base>
  ),
  'catatan-siswa': (p) => (
    <Base {...p}>
      <path d="M12 7c-1.6-1.4-3.7-2-6-2H4v12h2c2.3 0 4.4.6 6 2" />
      <path d="M12 7c1.6-1.4 3.7-2 6-2h2v12h-2c-2.3 0-4.4.6-6 2" />
      <path d="M12 7v12" />
    </Base>
  ),
  'kalkulator-nilai': (p) => (
    <Base {...p}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <rect x="7.5" y="5.5" width="9" height="3.5" rx="0.6" />
      <circle cx="8.3" cy="13" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="13" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.3" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
    </Base>
  ),
  'ice-breaker': (p) => (
    <Base {...p}>
      <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21" />
      <path d="M5.8 5.8l2.5 2.5M15.7 15.7l2.5 2.5M18.2 5.8l-2.5 2.5M8.3 15.7l-2.5 2.5" />
      <circle cx="12" cy="12" r="2.5" />
    </Base>
  ),
};

export function ToolIcon({ slug, ...props }: { slug: string } & IconProps) {
  const Icon = ICONS[slug];
  if (!Icon) return null;
  return <Icon {...props} />;
}
