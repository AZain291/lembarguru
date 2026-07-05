import Link from 'next/link';
import type { ReactNode } from 'react';
import type { ToolItem } from '@/lib/teacherTools';
import { ToolThemeWrapper } from './ToolThemeWrapper';

// Shell halaman yang dipakai oleh semua src/app/tools/{slug}/page.tsx.
// Sengaja setiap tool punya folder/page.tsx sendiri (bukan satu
// [slug]/page.tsx dinamis dengan lookup map) -- itu import statis per
// halaman, jadi webpack tahu pasti "halaman ini cuma butuh komponen ini"
// dan bisa memisah JS-nya per tool. Waktu dicoba lewat lookup map + dynamic
// import di satu file [slug], webpack malah menggabungkan semua 18 tool
// jadi satu chunk besar karena semuanya terlihat "selalu berpotensi dipakai
// bersama" dari modul yang sama.
export function ToolPageShell({ tool, children }: { tool: ToolItem; children: ReactNode }) {
  return (
    <ToolThemeWrapper className="min-h-screen bg-paper">
      <div className="mx-auto max-w-[960px] px-4 py-8 sm:px-6">
        <Link href="/" className="mb-4 inline-block text-[13px] font-medium text-ink-soft hover:text-ink">
          ← Kembali ke LembarGuru
        </Link>

        <div className="mb-6 flex items-start gap-3">
          <span className="text-[32px] leading-none">{tool.icon}</span>
          <div>
            <h1 className="font-display text-[24px] font-semibold text-ink">{tool.label}</h1>
            <p className="text-[13.5px] text-ink-soft">{tool.desc}</p>
          </div>
        </div>

        {children}
      </div>
    </ToolThemeWrapper>
  );
}
