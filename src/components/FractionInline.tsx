import { Fragment, type ReactNode } from "react";
import { splitFractionSegments } from "@/lib/fraction";

// Pecahan bersusun inline (angka di atas garis / angka di bawah garis) di
// tengah kalimat -- dipakai LembarGuruApp.tsx (hasil generate) & BankSoal.tsx
// (soal tersimpan) supaya keduanya konsisten. Teks soal/opsi/pembahasan
// berisi marker "{{2/3}}" (lihat src/lib/fraction.ts) yang di-split lewat
// renderWithFractions() jadi teks biasa + potongan <FractionInline> --
// tempat manapun yang menampilkan teks soal HARUS lewat helper ini, bukan
// string mentah, supaya markernya tidak ikut tampil sebagai teks aneh.
export function FractionInline({ numerator, denominator }: { numerator: string; denominator: string }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", verticalAlign: "middle", fontSize: "0.82em", lineHeight: 1.15, margin: "0 2px", position: "relative", top: "0.05em" }}>
      <span>{numerator}</span>
      <span style={{ borderTop: "1.3px solid currentColor", width: "100%", minWidth: 11 }} />
      <span>{denominator}</span>
    </span>
  );
}

export function renderWithFractions(text: string): ReactNode {
  const segments = splitFractionSegments(text);
  if (segments.length === 1 && segments[0].type === "text") return text;
  return segments.map((seg, i) =>
    seg.type === "fraction"
      ? <FractionInline key={i} numerator={seg.numerator} denominator={seg.denominator} />
      : <Fragment key={i}>{seg.value}</Fragment>
  );
}
