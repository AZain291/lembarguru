// src/app/coba-gratis/page.tsx — v2
// PERBEDAAN BESAR dari v1: tidak ada lagi /api/guest-quota atau
// /api/generate-tamu buatan sendiri. Tamu sudah punya guest_id cookie
// (httpOnly, di-set middleware.ts) dan kuota tamu sudah diatur lewat
// pricing_tiers tier='guest' (kelihatan dari ORDER admin lama).
//
// ASUMSI YANG BELUM DIVERIFIKASI (saya belum lihat isi file-file ini):
// - src/app/api/generate/route.ts: apakah otomatis mengenali guest lewat
//   cookie guest_id kalau user belum login? Atau perlu param eksplisit?
// - src/app/api/usage/route.ts: apakah bisa dipanggil tanpa login dan
//   balikin sisa kuota guest? Bentuk response-nya seperti apa?
// Kirim isi kedua file itu untuk saya pastikan field di bawah ini
// (SISA_KUOTA_FIELD, dst) sudah benar — sekarang saya tulis dengan nama
// field paling masuk akal berdasar pola project (snake_case, mirip usage.ts).
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const JENJANG = ["SD", "SMP", "SMA"];
const MAPEL_BY_JENJANG: Record<string, string[]> = {
  SD: ["Matematika", "Bahasa Indonesia", "IPA", "IPS", "PKn"],
  SMP: ["Matematika", "Bahasa Indonesia", "IPA", "IPS", "Bahasa Inggris"],
  SMA: ["Matematika", "Bahasa Indonesia", "Fisika", "Kimia", "Biologi", "Ekonomi"],
};

export default function CobaGratisPage() {
  const [jenjang, setJenjang] = useState("SD");
  const [mapel, setMapel] = useState(MAPEL_BY_JENJANG["SD"][0]);
  const [kelas, setKelas] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [hasil, setHasil] = useState<string[] | null>(null);
  const [sisaKuota, setSisaKuota] = useState<number | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO verifikasi: apakah GET /api/usage tanpa auth balikin kuota
    // guest berdasarkan cookie guest_id? Kalau route ini wajib login,
    // baris ini perlu diganti ke endpoint lain.
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.remaining === "number") setSisaKuota(d.remaining);
      })
      .catch(() => {});
  }, []);

  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    setHasil(null);

    try {
      // TODO verifikasi: bentuk body yang diharapkan src/app/api/generate/route.ts.
      // Field di bawah nebak dari konteks mockup (jenjang/mapel/kelas), BUKAN
      // dikonfirmasi dari isi route.ts yang sebenarnya.
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenjang, mapel, kelas, jumlah: 3 }),
      });

      if (res.status === 429 || res.status === 403) {
        setShowUpgrade(true);
        return;
      }
      if (!res.ok) throw new Error("Gagal membuat soal. Coba lagi.");

      const data = await res.json();
      // TODO verifikasi: nama field hasil soal di response asli.
      setHasil(data.soal ?? data.questions ?? []);
      if (typeof data.remaining === "number") setSisaKuota(data.remaining);
    } catch (e: any) {
      setError(e.message ?? "Terjadi kesalahan.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", background: "#F7F4EC" }}>
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 28px", maxWidth: 1160, margin: "0 auto",
      }}>
        <Link href="/" style={{ textDecoration: "none", color: "#1F2A44", fontWeight: 700, fontSize: 21 }}>
          LembarGuru
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {sisaKuota !== null && (
            <span style={{
              fontFamily: "monospace", fontSize: 11, background: "#F1E6CC", color: "#B98A1F",
              padding: "4px 10px", borderRadius: 5,
            }}>
              Sisa kuota tamu: {sisaKuota}
            </span>
          )}
          <Link href="/register" style={{
            padding: "10px 18px", borderRadius: 9, background: "#1F2A44", color: "#fff",
            textDecoration: "none", fontWeight: 600, fontSize: 14,
          }}>
            Daftar Gratis
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: "20px auto", padding: "0 28px 80px" }}>
        <h1 style={{ fontSize: 28, color: "#1F2A44", marginBottom: 10 }}>
          Rasakan LembarGuru sekarang juga.
        </h1>
        <p style={{ color: "#5B6478", marginBottom: 28 }}>
          Kuota tamu terbatas per hari. Daftar gratis untuk kuota lebih besar.
        </p>

        <div style={{ background: "#FFFDF8", border: "1px solid #DCD5C0", borderRadius: 14, padding: 26 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#1F2A44" }}>Jenjang</label>
              <select value={jenjang} onChange={(e) => { setJenjang(e.target.value); setMapel(MAPEL_BY_JENJANG[e.target.value][0]); }}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #DCD5C0", borderRadius: 8 }}>
                {JENJANG.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#1F2A44" }}>Kelas</label>
              <input type="number" min={1} max={12} value={kelas} onChange={(e) => setKelas(Number(e.target.value))}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #DCD5C0", borderRadius: 8 }} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#1F2A44" }}>Mata pelajaran</label>
              <select value={mapel} onChange={(e) => setMapel(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #DCD5C0", borderRadius: 8 }}>
                {MAPEL_BY_JENJANG[jenjang].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {error && <p style={{ color: "#C23B2E", fontSize: 13 }}>{error}</p>}

          <button onClick={handleGenerate} disabled={generating} style={{
            width: "100%", padding: 12, borderRadius: 9, border: "none",
            background: "#1F2A44", color: "#fff", fontWeight: 600, cursor: "pointer",
          }}>
            {generating ? "Menyusun soal..." : "Buat Soal Sekarang"}
          </button>
        </div>

        {hasil && (
          <div style={{ background: "#FFFDF8", border: "1px solid #DCD5C0", borderRadius: 14, padding: 26, marginTop: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 14, color: "#1F2A44" }}>Hasil soal</h3>
            <ol style={{ paddingLeft: 20 }}>
              {hasil.map((soal, i) => (
                <li key={i} style={{ marginBottom: 10, color: "#1F2A44", fontSize: 14.5, lineHeight: 1.6 }}>{soal}</li>
              ))}
            </ol>
          </div>
        )}
      </main>

      {showUpgrade && (
        <div onClick={() => setShowUpgrade(false)} style={{
          position: "fixed", inset: 0, background: "rgba(31,42,68,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#FFFDF8", borderRadius: 14, maxWidth: 400, width: "100%",
            padding: "32px 28px", textAlign: "center",
          }}>
            <h2 style={{ fontSize: 20, color: "#1F2A44", marginBottom: 10 }}>
              Daftar untuk lanjut membuat soal.
            </h2>
            <p style={{ color: "#5B6478", fontSize: 14, marginBottom: 22 }}>
              Kuota gratis tamu sudah habis. Daftar akun gratis untuk kuota lebih besar
              dan simpan riwayat soal.
            </p>
            <Link href="/register" style={{
              display: "block", padding: 12, borderRadius: 9, background: "#1F2A44",
              color: "#fff", fontWeight: 600, textDecoration: "none", marginBottom: 10,
            }}>
              Daftar Gratis Sekarang
            </Link>
            <button onClick={() => setShowUpgrade(false)} style={{
              width: "100%", padding: 12, borderRadius: 9, border: "1.5px solid #1F2A44",
              background: "transparent", color: "#1F2A44", fontWeight: 600, cursor: "pointer",
            }}>
              Nanti Saja
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
