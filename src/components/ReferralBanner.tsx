// src/components/ReferralBanner.tsx — v2
// Perbaikan dari v1: tidak lagi bergantung pada styles/lembarguru-tokens.css
// (file itu dibuang dari zip ini, tidak dipakai halaman manapun sekarang).
"use client";

import { useState, useEffect } from "react";

interface Props {
  kodeReferral: string;    // dari tabel referrals.code milik user yang login
  jumlahBerhasil: number;  // count referral_redemptions.status='success'
  totalReward?: number;    // total Rp reward dari referral sukses (opsional)
  unpaidReward?: number;   // bagian dari totalReward yang belum dibayar admin
  commissionPercent?: number; // persentase komisi saat ini (admin-editable)
}

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function ReferralBanner({ kodeReferral, jumlahBerhasil, totalReward, unpaidReward, commissionPercent }: Props) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined"
    ? `${window.location.origin}/register?ref=${kodeReferral}`
    : `https://lembarguru.com/register?ref=${kodeReferral}`;

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div style={{
      background: "#FFFDF8", border: "1px solid #DCD5C0", borderRadius: 14, padding: "20px 24px",
      display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
    }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#1F2A44", margin: 0 }}>
          {jumlahBerhasil > 0
            ? `${jumlahBerhasil} rekan sudah bergabung lewat link Anda.`
            : `Bagikan link, dapatkan ${commissionPercent ?? 10}% reward saat rekan Anda berlangganan.`}
        </p>
        {typeof totalReward === "number" && totalReward > 0 && (
          <p style={{ fontSize: 12, color: "#5B6478", margin: "4px 0 0" }}>
            Total reward: {formatRp(totalReward)}
            {unpaidReward
              ? ` — ${formatRp(unpaidReward)} belum ditransfer (dibayar manual oleh tim kami).`
              : " — semua sudah ditransfer."}
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input readOnly value={link} title="Link referral Anda" style={{
          width: 260, padding: "9px 12px", border: "1px solid #DCD5C0", borderRadius: 8, fontSize: 13,
        }} />
        <button
          type="button"
          onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }}
          style={{
            padding: "9px 16px", borderRadius: 8, border: "none", background: "#1F2A44",
            color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          {copied ? "Tersalin!" : "Salin Link"}
        </button>
      </div>
    </div>
  );
}
