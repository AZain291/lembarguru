import { ReactNode } from 'react';

export const MAPEL_UMUM = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'IPA',
  'IPS',
  'PPKn',
  'Seni Budaya',
  'PJOK',
  'Fisika',
  'Kimia',
  'Biologi',
  'Ekonomi',
  'Sejarah',
  'Geografi',
];

// Sentinel value untuk opsi "Lainnya (ketik sendiri)" di dropdown mapel —
// sengaja bukan string yang mungkin diketik user, supaya tidak pernah
// tertukar dengan mapel kustom yang sungguhan.
export const MAPEL_LAINNYA = '__lainnya__';

export const KELAS_BY_JENJANG: Record<string, string[]> = {
  SD: ['1', '2', '3', '4', '5', '6'],
  SMP: ['7', '8', '9'],
  SMA: ['10', '11', '12'],
};

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink">
      {label}
      {children}
    </label>
  );
}
