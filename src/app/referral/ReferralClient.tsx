"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ReferralBanner from "@/components/ReferralBanner";

interface ReferralData {
  code: string;
  successCount: number;
  totalReward: number;
  unpaidReward: number;
  commissionPercent: number;
}

export default function ReferralClient() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [data, setData] = useState<ReferralData | null>(null);
  const [error, setError] = useState("");

  // Wajib login -- kalau belum, arahkan ke /login lalu kembali ke sini.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: authData }) => {
      if (!authData.user) {
        router.replace(`/login?redirect=${encodeURIComponent("/referral")}`);
        return;
      }
      setCheckingAuth(false);
      fetch("/api/referral/me")
        .then((r) => r.json())
        .then((d) => {
          if (d.code) setData(d);
          else setError(d.error || "Gagal memuat data referral");
        })
        .catch(() => setError("Gagal memuat data referral"));
    });
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "system-ui, sans-serif", padding: "0 0 4rem" }}>
      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e2db", padding: "0 1.5rem", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: 17, color: "#111827", textDecoration: "none" }}>
          <img src="/favicon.ico" alt="LembarGuru" style={{ width: 30, height: 30, borderRadius: 7 }} />
          LembarGuru
        </a>
        <div style={{ display: "flex", gap: 20, fontSize: 13, fontWeight: 600 }}>
          <a href="/about" style={{ color: "#6b7280", textDecoration: "none" }}>Tentang</a>
          <a href="/blog" style={{ color: "#6b7280", textDecoration: "none" }}>Blog</a>
          <a href="/materi" style={{ color: "#6b7280", textDecoration: "none" }}>Materi Guru</a>
          <a href="/harga" style={{ color: "#6b7280", textDecoration: "none" }}>Harga</a>
          <a href="/referral" style={{ color: "#2563eb", textDecoration: "none" }}>Referral</a>
          <a href="/contact" style={{ color: "#6b7280", textDecoration: "none" }}>Kontak</a>
          <a href="/terms" style={{ color: "#6b7280", textDecoration: "none" }}>Syarat & Ketentuan</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "4rem 1.5rem 2rem", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, marginBottom: 20 }}>
          🎁 Referral
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, color: "#111827", lineHeight: 1.2, marginBottom: 16 }}>
          Ajak rekan guru,<br /><span style={{ color: "#2563eb" }}>dapatkan reward.</span>
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.8, maxWidth: 480, margin: "0 auto" }}>
          Bagikan link referral Anda. Setiap rekan yang mendaftar lewat link itu dan berlangganan paket
          berbayar, Anda dapat reward{data ? ` ${data.commissionPercent}%` : ""} dari harga paketnya.
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 1.5rem" }}>
        {checkingAuth && (
          <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, padding: "3rem 0" }}>Memuat...</div>
        )}

        {!checkingAuth && error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 12, padding: "1.25rem", fontSize: 14, textAlign: "center" }}>
            {error}
          </div>
        )}

        {!checkingAuth && data && (
          <>
            <ReferralBanner
              kodeReferral={data.code}
              jumlahBerhasil={data.successCount}
              totalReward={data.totalReward}
              unpaidReward={data.unpaidReward}
              commissionPercent={data.commissionPercent}
            />

            <div style={{ background: "#fff", border: "1px solid #e5e2db", borderRadius: 14, padding: "1.75rem", marginTop: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 14 }}>Cara Kerjanya</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  ["1", "Bagikan link referral di atas ke rekan guru lain."],
                  ["2", "Rekan Anda mendaftar akun lewat link itu."],
                  [
                    "3",
                    `Begitu rekan Anda berlangganan paket Pro/Guru Lengkap pertama kali, Anda dapat reward ${data.commissionPercent}% dari harga paketnya.`,
                  ],
                  ["4", "Reward ditransfer manual oleh tim kami — Anda bisa memantau status pembayarannya di halaman ini."],
                ].map(([n, text]) => (
                  <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {n}
                    </span>
                    <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.6, margin: 0 }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
