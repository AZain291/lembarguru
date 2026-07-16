"use client";

import { useEffect, useState } from "react";
import { TEACHER_TOOLS } from "@/lib/teacherTools";

interface PricingTier {
  tier: string;
  label: string;
  price_monthly: number;
  price_yearly: number;
  max_soal: number;
  max_gen_per_day: number | null;
  unlimited_gen: boolean;
  bank_soal_jumlah: number | null;
  bank_soal_acak: boolean | null;
  enabled_tools: string[] | null;
}

const TOOL_COUNT = TEACHER_TOOLS.length;

const ORDER = ["guest", "free", "pro", "guru"];
const DESC: Record<string, string> = {
  guest: "Coba tanpa perlu daftar.",
  free: "Untuk penggunaan ringan sehari-hari.",
  pro: "Untuk guru yang butuh lebih banyak & lebih lengkap.",
  guru: "Tanpa batas, untuk kebutuhan sekolah/yayasan.",
};

function formatRp(n: number) {
  return n === 0 ? "Gratis" : "Rp " + n.toLocaleString("id-ID");
}

export default function HargaClient() {
  const [tiers, setTiers] = useState<PricingTier[] | null>(null);

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((d) => {
        const sorted = (d.tiers ?? []).sort(
          (a: PricingTier, b: PricingTier) => ORDER.indexOf(a.tier) - ORDER.indexOf(b.tier)
        );
        setTiers(sorted);
      })
      .catch(() => setTiers([]));
  }, []);

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
          <a href="/harga" style={{ color: "#2563eb", textDecoration: "none" }}>Harga</a>
          <a href="/referral" style={{ color: "#6b7280", textDecoration: "none" }}>Referral</a>
          <a href="/contact" style={{ color: "#6b7280", textDecoration: "none" }}>Kontak</a>
          <a href="/terms" style={{ color: "#6b7280", textDecoration: "none" }}>Syarat & Ketentuan</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem 2rem", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, marginBottom: 20 }}>
          💳 Harga
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#111827", lineHeight: 1.2, marginBottom: 16 }}>
          Pilih paket yang<br /><span style={{ color: "#2563eb" }}>sesuai kebutuhan Anda.</span>
        </h1>
        <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.8, maxWidth: 560, margin: "0 auto" }}>
          Kuota dan harga di bawah selalu sesuai pengaturan terbaru dari tim kami.
        </p>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 1.5rem" }}>
        {tiers === null && (
          <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, padding: "3rem 0" }}>Memuat harga...</div>
        )}
        {tiers && tiers.length === 0 && (
          <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, padding: "3rem 0" }}>Belum ada paket tersedia.</div>
        )}
        {tiers && tiers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {tiers.map((t) => {
              const isPro = t.tier === "pro";
              // enabled_tools null = semua tool diizinkan (default). Tampilkan
              // "X dari Y" cuma kalau tier ini benar-benar dibatasi admin --
              // supaya perbedaan jumlah tool antar tier kelihatan jelas.
              const toolCount = t.enabled_tools ? t.enabled_tools.length : TOOL_COUNT;
              const toolsRestricted = toolCount < TOOL_COUNT;
              return (
                <div
                  key={t.tier}
                  style={{
                    background: "#fff",
                    border: isPro ? "2px solid #2563eb" : "1px solid #e5e2db",
                    borderRadius: 14,
                    padding: "1.75rem 1.5rem",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {isPro && (
                    <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#2563eb", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20 }}>
                      Paling Populer
                    </span>
                  )}
                  <div style={{ fontWeight: 800, fontSize: 17, color: "#111827", marginBottom: 4 }}>{t.label}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>{DESC[t.tier] ?? ""}</div>

                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>{formatRp(t.price_monthly)}</span>
                    {t.price_monthly > 0 && <span style={{ fontSize: 13, color: "#6b7280" }}> /bulan</span>}
                  </div>
                  {t.price_yearly > 0 && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
                      atau {formatRp(t.price_yearly)} /tahun
                    </div>
                  )}
                  {t.price_yearly === 0 && <div style={{ marginBottom: 16 }} />}

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#374151", padding: "7px 10px", background: "#f5f4f0", borderRadius: 7 }}>
                      {t.unlimited_gen ? "✅ Generate tanpa batas" : `✅ ${t.max_gen_per_day ?? "-"} soal/hari`}
                    </div>
                    <div style={{ fontSize: 13, color: "#374151", padding: "7px 10px", background: "#f5f4f0", borderRadius: 7 }}>
                      ✅ Maks {t.max_soal} soal per sesi generate
                    </div>
                    <div style={{ fontSize: 13, color: "#374151", padding: "7px 10px", background: "#f5f4f0", borderRadius: 7 }}>
                      ✅ Bank Soal: {t.tier === "guru" ? "tanpa batas" : `${t.bank_soal_jumlah ?? "-"} soal${t.bank_soal_acak ? " (diacak)" : ""}`}
                    </div>
                    <div style={{ fontSize: 13, color: "#374151", padding: "7px 10px", background: "#f5f4f0", borderRadius: 7 }}>
                      {toolsRestricted ? `⚠️ ${toolCount} dari ${TOOL_COUNT} Alat Bantu Guru` : `✅ Akses semua ${TOOL_COUNT} Alat Bantu Guru`}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 20, marginTop: -12 }}>
                    Sebagian tool (RPP, Flashcard, dll) pakai kuota generate yang sama di atas.
                  </div>

                  <a
                    href={t.tier === "guest" ? "/" : "/login"}
                    style={{
                      display: "block", textAlign: "center", textDecoration: "none",
                      background: isPro ? "#2563eb" : "#f5f4f0",
                      color: isPro ? "#fff" : "#111827",
                      borderRadius: 10, padding: "11px", fontWeight: 700, fontSize: 14,
                    }}
                  >
                    {t.tier === "guest" ? "Coba Sekarang" : "Daftar & Mulai"}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
