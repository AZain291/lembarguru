'use client';

import { useEffect, useState, type ReactNode } from 'react';

const THEME_STORAGE_KEY = 'lembarguru-theme';

// Halaman /tools/[slug] adalah Server Component (butuh generateMetadata /
// generateStaticParams), jadi sinkronisasi tema gelap/terang dari
// localStorage -- yang butuh browser -- dipisah ke client component kecil
// ini. Key localStorage-nya SENGAJA sama persis dengan yang dipakai
// LembarGuruApp.tsx supaya toggle tema di halaman utama ikut berlaku di
// sini. Class "dark" yang ditaruh di sini men-trigger override token warna
// di globals.css (.dark { --color-ink: ...; ... }).
export function ToolThemeWrapper({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      setDark(localStorage.getItem(THEME_STORAGE_KEY) === 'dark');
    } catch {
      // localStorage bisa gagal (mis. mode privat) -- default ke tema terang
    }
  }, []);

  return <div className={`${className} ${dark ? 'dark' : ''}`}>{children}</div>;
}
