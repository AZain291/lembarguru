"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// ── TYPES ────────────────────────────────────────────────────────────────────
type Tier = "guest" | "free" | "pro" | "guru";
type Theme = "light" | "dark";
type View = "generate" | "account";

interface QOption { k: string; t: string; }
interface Question {
  text: string;
  options: QOption[];
  answer: string;       // diisi untuk pilihan_ganda dan benar_salah
  pembahasan: string;   // selalu ada
  type: string;         // tipe soal per-item
}
interface MixedConfig {
  pilihan_ganda: number;
  essay: number;
  benar_salah: number;
  isian: number;
  hots: number;
}
interface ResultData {
  questions: Question[];
  mapel: string;
  kelas: string;
  topik: string;
  kurikulum: string;
  fase: string | null;
  mixed: boolean;
  mixedConfig?: MixedConfig;
  singleType?: string;
}
interface UsageData {
  tier: Tier;
  email: string | null;
  used: number;
  max: number | null;
  maxSoal: number;
  sliderMax?: number;
  remaining: number | null;
  generatesToday?: number;
  generatesTotal?: number;
  tokensUsed?: number;
  maxSoalPro?: number;
  maxSoalGuru?: number;
  maxGenFree?: number | null;
  maxSoalFree?: number | null;
}

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const TIER_DEFAULTS: Record<Tier, { maxGen: number | null; maxQ: number; label: string; color: string }> = {
  guest: { maxGen: 3,    maxQ: 5,  label: "Tamu",          color: "#6b7280" },
  free:  { maxGen: 5,    maxQ: 10, label: "Gratis",        color: "#059669" },
  pro:   { maxGen: null, maxQ: 20, label: "Pro",           color: "#d97706" },
  guru:  { maxGen: null, maxQ: 50, label: "Guru Lengkap",  color: "#7c3aed" },
};

const MAPEL = ["Matematika","Bahasa Indonesia","Bahasa Inggris","IPA","IPS","PKn","Sejarah","Biologi","Fisika","Kimia","Pendidikan Agama","Seni Budaya","PJOK","Informatika"];
const KELAS_LIST = ["1 SD","2 SD","3 SD","4 SD","5 SD","6 SD","7 SMP","8 SMP","9 SMP","10 SMA","11 SMA","12 SMA","Umum"];
const FASE_CP = ["Fase A (Kelas 1-2)","Fase B (Kelas 3-4)","Fase C (Kelas 5-6)","Fase D (Kelas 7-9)","Fase E (Kelas 10)","Fase F (Kelas 11-12)"];
const KURIKULUM = ["Kurikulum Merdeka","Kurikulum Nasional (K-13)"];
const TYPES = [
  { v: "pilihan_ganda", l: "Pilihan Ganda",    icon: "◉", hasAnswer: true  },
  { v: "essay",         l: "Esai / Uraian",    icon: "✏", hasAnswer: false },
  { v: "benar_salah",   l: "Benar atau Salah", icon: "⊙", hasAnswer: true  },
  { v: "isian",         l: "Isian Singkat",    icon: "▭", hasAnswer: false },
  { v: "pg_essay",      l: "PG + Essay",       icon: "🎯", hasAnswer: false, pro: true },
  { v: "hots",          l: "HOTS",             icon: "⚡", hasAnswer: false, pro: true },
];
const DIFFICULTY = ["Mudah","Sedang","Sulit","Campuran"];

const HAS_ANSWER_TYPES = new Set(["pilihan_ganda","benar_salah"]);

// ── THEMES ───────────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg:"#f5f4f0", cardBg:"#ffffff", border:"#e5e2db", textPrimary:"#111827",
    textSecondary:"#6b7280", textMuted:"#9ca3af", inputBg:"#fafaf9",
    inputBorder:"#e5e7eb", accent:"#2563eb", accentBg:"#eff6ff", accentText:"#1d4ed8",
    pillBg:"#f0eefc", pillText:"#4338ca", track:"#f3f4f6", hoverRow:"#f9fafb",
    correctBg:"#ecfdf5", correctText:"#065f46", overlay:"rgba(0,0,0,.5)",
    shadow:"0 1px 3px rgba(0,0,0,.1)", dangerBg:"#fef2f2", dangerBorder:"#fecaca",
    dangerText:"#991b1b", warnBg:"#fffbeb", warnBorder:"#fde68a", warnText:"#92400e",
  },
  dark: {
    bg:"#0f1115", cardBg:"#1a1d24", border:"#2a2e38", textPrimary:"#f3f4f6",
    textSecondary:"#9ca3af", textMuted:"#6b7280", inputBg:"#22262f",
    inputBorder:"#343844", accent:"#3b82f6", accentBg:"#1e293b", accentText:"#60a5fa",
    pillBg:"#241f3d", pillText:"#a5b4fc", track:"#262a33", hoverRow:"#20242c",
    correctBg:"#0f2e22", correctText:"#4ade80", overlay:"rgba(0,0,0,.7)",
    shadow:"0 1px 3px rgba(0,0,0,.4)", dangerBg:"#2a1414", dangerBorder:"#5c2424",
    dangerText:"#f87171", warnBg:"#2a2110", warnBorder:"#54451a", warnText:"#fbbf24",
  },
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
function parseQuestions(text: string, defaultType = "pilihan_ganda"): Question[] {
  const lines = text.split("\n").map(l => l.replace(/\*\*/g, "").trim()).filter(Boolean);
  const qs: Question[] = [];
  let cur: Question | null = null;
  let curType = defaultType;

  for (const line of lines) {
    // Detect tipe section header (untuk campuran)
    const sectionMatch = line.match(/^#+\s*(pilihan ganda|esai|isian|benar.+salah|hots)/i);
    if (sectionMatch) {
      const s = sectionMatch[1].toLowerCase();
      if (s.includes("pilihan")) curType = "pilihan_ganda";
      else if (s.includes("esai") || s.includes("essay")) curType = "essay";
      else if (s.includes("isian")) curType = "isian";
      else if (s.includes("benar")) curType = "benar_salah";
      else if (s.includes("hots")) curType = "hots";
      continue;
    }

    const qm = line.match(/^(\d+)[.)]\s+(.+)/);
    if (qm) {
      if (cur) qs.push(cur);
      cur = { text: qm[2], options: [], answer: "", pembahasan: "", type: curType };
      continue;
    }
    if (!cur) continue;

    const om = line.match(/^([a-dA-D])[.)]\s+(.+)/);
    if (om) { cur.options.push({ k: om[1].toUpperCase(), t: om[2] }); continue; }

    const jm = line.match(/^(?:jawab(?:an)?|kunci|answer)\s*:?\s*(.+)/i);
    if (jm) { cur.answer = jm[1].trim(); continue; }

    const pm = line.match(/^(?:pembahasan|penjelasan|alasan|diskusi)\s*:?\s*(.+)/i);
    if (pm) { cur.pembahasan = pm[1].trim(); continue; }

    // Append ke pembahasan jika sudah ada pembahasan sebelumnya
    if (cur.pembahasan && !om && !jm) {
      cur.pembahasan += " " + line;
    }
  }
  if (cur) qs.push(cur);
  return qs.filter(q => q.text.length > 5);
}

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function LembarGuruApp() {
  const [theme, setTheme] = useState<Theme>("light");
  const [view, setView] = useState<View>("generate");
  const [usage, setUsage] = useState<UsageData>({ tier:"guest", email:null, used:0, max:3, maxSoal:5, remaining:3 });

  // Form state
  const [kurikulum, setKurikulum] = useState("Kurikulum Merdeka");
  const [mapel, setMapel] = useState("IPA");
  const [kelas, setKelas] = useState("5 SD");
  const [fase, setFase] = useState("Fase C (Kelas 5-6)");
  const [topik, setTopik] = useState("");
  const [difficulty, setDifficulty] = useState("Campuran");
  const [qtype, setQtype] = useState("pilihan_ganda");

  // Mixed mode
  const [mixedConfig, setMixedConfig] = useState<MixedConfig>({ pilihan_ganda:5, essay:3, benar_salah:0, isian:0, hots:0 });

  // Single mode jumlah soal
  const [pgCount, setPgCount] = useState(5);
  const [essayCount, setEssayCount] = useState(3);
  const [numQ, setNumQ] = useState(5);

  // UI state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();

  // Theme init
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("lembarguru-theme") : null;
    if (saved === "light" || saved === "dark") setTheme(saved);
    else if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) setTheme("dark");
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try { localStorage.setItem("lembarguru-theme", next); } catch {}
  }

  const refreshUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      if (!res.ok) return;
      const data = await res.json();
      setUsage(prev => ({ ...prev, ...data }));
    } catch {}
  }, []);

  useEffect(() => {
    refreshUsage();
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange(() => refreshUsage());
    return () => listener.subscription.unsubscribe();
  }, [refreshUsage]);

  // Clamp pg+essay slider values whenever maxQ changes (e.g. after login/logout)
  const maxQ = usage.sliderMax ?? usage.maxSoal ?? TIER_DEFAULTS[usage.tier].maxQ;
  useEffect(() => {
    if (pgCount + essayCount > maxQ) {
      const half = Math.max(1, Math.floor(maxQ / 2));
      setPgCount(half);
      setEssayCount(Math.max(1, maxQ - half));
    }
  }, [maxQ]); // eslint-disable-line react-hooks/exhaustive-deps

  const C = THEMES[theme];
  const tier = usage.tier;
  const isPro = tier === "pro" || tier === "guru";
  const T = TIER_DEFAULTS[tier];
  const remaining = usage.remaining;
  const used = usage.used;
  const maxGen = usage.max;
  const pct = maxGen ? Math.round((used / maxGen) * 100) : 0;

  const isMixed   = false;
  const isPgEssay  = qtype === "pg_essay";
  const totalMixedQ   = 0;
  const totalPgEssayQ = isPgEssay ? pgCount + essayCount : 0;
  const limitedNumQ   = isPgEssay ? totalPgEssayQ : Math.min(numQ, maxQ);

  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2800);
  };

  async function generateSoal() {
    if (remaining !== null && remaining <= 0) { setModal("limit"); return; }
    if (isMixed && totalMixedQ === 0) { setError("Isi minimal 1 soal di konfigurasi campuran."); return; }

    setLoading(true); setResult(null); setError(""); setShowAnswerKey(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapel, kelas, topik, difficulty, kurikulum,
          fase: kurikulum === "Kurikulum Merdeka" ? fase : null,
          tipe: isMixed ? "campuran" : TYPES.find(t => t.v === qtype)?.l,
          jumlahSoal: limitedNumQ,
          mixedConfig: isMixed ? mixedConfig : null,
        }),
      });

      const data = await res.json();

      if (data.error === "quota_exceeded") { setUsage(prev => ({ ...prev, used: data.used })); setModal("limit"); return; }
      if (data.error === "max_soal_exceeded") { setError(`Maksimal ${data.maxSoal} soal untuk tier ${T.label}.`); return; }
      if (!data.success) throw new Error(data.error || "Gagal");

      const qs = parseQuestions(data.hasil, isMixed ? "campuran" : qtype);
      if (qs.length === 0) throw new Error("Parse gagal — respons kosong");

      setResult({
        questions: qs, mapel, kelas, topik, kurikulum,
        fase: kurikulum === "Kurikulum Merdeka" ? fase : null,
        mixed: isMixed,
        mixedConfig: isMixed ? mixedConfig : undefined,
        singleType: isMixed ? undefined : TYPES.find(t => t.v === qtype)?.l,
      });

      setUsage(prev => ({ ...prev, used: data.used, tier: data.tier ?? prev.tier, remaining: data.remaining ?? prev.remaining, sliderMax: data.sliderMax ?? prev.sliderMax }));
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : null) || "Gagal generate soal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    if (!result) return;
    const questions = result.questions;
    // Soal saja dulu
    let text = questions.map((q, i) => {
      let s = `${i + 1}. ${q.text}\n`;
      if (q.options.length) s += q.options.map(o => `   ${o.k}. ${o.t}`).join("\n") + "\n";
      return s;
    }).join("\n");

    // Kunci jawaban di bawah (hanya pilihan ganda & benar salah)
    const pgSoal = questions.filter(q => HAS_ANSWER_TYPES.has(q.type));
    if (pgSoal.length > 0) {
      text += "\n\n=== KUNCI JAWABAN ===\n";
      pgSoal.forEach((q, i) => {
        const idx = questions.indexOf(q) + 1;
        text += `${idx}. ${q.answer}\n`;
      });
    }

    // Pembahasan
    const hasPembahasan = questions.some(q => q.pembahasan);
    if (hasPembahasan) {
      text += "\n\n=== PEMBAHASAN ===\n";
      questions.forEach((q, i) => {
        if (q.pembahasan) text += `${i + 1}. ${q.pembahasan}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("Berhasil disalin!");
  }

  async function downloadDocx() {
    if (!isPro) { setModal("upgrade"); return; }
    if (!result) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error("Gagal");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `soal-${result.mapel.toLowerCase().replace(/\s+/g, "-")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("File Word berhasil diunduh!");
    } catch {
      showToast("Gagal membuat file Word. Coba lagi.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setModal(null);
    setUsage({ tier:"guest", email:null, used:0, max:3, maxSoal:5, remaining:3 });
    setView("generate");
    router.push("/");
    router.refresh();
  }

  // ── SELECT STYLE ──────────────────────────────────────────────────────────
  const ss: React.CSSProperties = {
    fontFamily:"inherit", fontSize:13, color:C.textPrimary, background:C.inputBg,
    border:`1px solid ${C.inputBorder}`, borderRadius:7, padding:"8px 11px", outline:"none", width:"100%",
  };

  const tierInfo = TIER_DEFAULTS[tier];

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"inherit", transition:"background .2s" }}>

      {/* NAV */}
      <nav style={{ background:C.cardBg, borderBottom:`1px solid ${C.border}`, padding:"0 1.5rem", height:58, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:C.shadow }}>
        <a href="/" style={{ display:"flex", alignItems:"center", gap:9, fontWeight:800, fontSize:17, color:C.textPrimary, textDecoration:"none" }}>
          <img src="/favicon.ico" alt="LembarGuru" style={{ width:30, height:30, borderRadius:7 }} />
          LembarGuru
        </a>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={toggleTheme} title="Toggle tema" style={{ background:C.inputBg, border:`1px solid ${C.inputBorder}`, borderRadius:8, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:15, color:C.textPrimary }}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:20, background:C.pillBg, color:C.pillText }}>
            {tierInfo.label}
          </span>
          {tier === "guest" && (remaining === null || remaining <= 0) && (
            <button onClick={() => setModal("auth")} style={{ background:"#2563eb", color:"#fff", border:"none", borderRadius:8, padding:"7px 14px", fontWeight:600, fontSize:13, cursor:"pointer" }}>
              Daftar Gratis
            </button>
          )}
          {tier === "guest" && remaining !== null && remaining > 0 && (
            <button onClick={() => router.push("/login")} style={{ background:"transparent", border:`1px solid ${C.inputBorder}`, borderRadius:8, padding:"7px 14px", fontWeight:600, fontSize:13, cursor:"pointer", color:C.textPrimary }}>
              Masuk
            </button>
          )}
          {tier === "free" && (
            <button onClick={() => setModal("upgrade")} style={{ background:"#d97706", color:"#fff", border:"none", borderRadius:8, padding:"7px 14px", fontWeight:600, fontSize:13, cursor:"pointer" }}>
              ⚡ Upgrade
            </button>
          )}
          {tier !== "guest" && (
            <>
              <button onClick={() => setView(view === "account" ? "generate" : "account")} style={{ background:view === "account" ? C.accentBg : "transparent", border:`1px solid ${C.inputBorder}`, borderRadius:8, padding:"7px 12px", fontWeight:600, fontSize:13, cursor:"pointer", color:view === "account" ? C.accentText : C.textSecondary }}>
                👤 Akun
              </button>
              <button onClick={handleLogout} style={{ background:"transparent", border:`1px solid ${C.inputBorder}`, borderRadius:8, padding:"7px 12px", fontWeight:600, fontSize:13, cursor:"pointer", color:"#ef4444" }}>
                Keluar
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── ACCOUNT VIEW ───────────────────────────────────────────────────── */}
      {view === "account" && tier !== "guest" && (
        <div style={{ maxWidth:680, margin:"2rem auto", padding:"0 1.5rem" }}>
          <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:14, padding:"1.75rem" }}>
            <h2 style={{ fontSize:18, fontWeight:800, marginBottom:20, color:C.textPrimary }}>👤 Akun Saya</h2>

            {/* User info */}
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20, padding:"14px", background:C.inputBg, borderRadius:10, border:`1px solid ${C.inputBorder}` }}>
              <div style={{ width:48, height:48, borderRadius:"50%", background:"#2563eb", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, flexShrink:0 }}>
                {(usage.email?.[0] ?? "U").toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:C.textPrimary }}>{usage.email ?? "-"}</div>
                <div style={{ display:"flex", gap:6, marginTop:4, alignItems:"center" }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:12, background:C.pillBg, color:C.pillText }}>{tierInfo.label}</span>
                  {isPro && <span style={{ fontSize:11, color:C.textMuted }}>Akses penuh</span>}
                </div>
              </div>
            </div>

            {/* Statistik pemakaian */}
            <h3 style={{ fontSize:13, fontWeight:700, color:C.textSecondary, marginBottom:12, textTransform:"uppercase", letterSpacing:".06em" }}>Pemakaian</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              <StatBox label="Generate hari ini" value={`${used}${maxGen ? ` / ${maxGen}` : " (∞)"}`} C={C} />
              <StatBox label="Maks soal/sesi" value={`${maxQ} soal`} C={C} />
              {usage.generatesTotal !== undefined && (
                <StatBox label="Total generate" value={`${usage.generatesTotal}×`} C={C} />
              )}
              {usage.tokensUsed !== undefined && (
                <StatBox label="Token dipakai" value={usage.tokensUsed.toLocaleString("id-ID")} C={C} />
              )}
            </div>

            {/* Progress bar (hanya non-pro) */}
            {!isPro && maxGen && (
              <div style={{ marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.textSecondary, marginBottom:6 }}>
                  <span>Kuota harian</span>
                  <span>{used} / {maxGen} terpakai</span>
                </div>
                <div style={{ height:6, background:C.track, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:3, width:`${Math.min(pct, 100)}%`, background:pct >= 80 ? "#ef4444" : pct >= 50 ? "#f59e0b" : "#10b981", transition:"width .4s" }} />
                </div>
                {pct >= 80 && (
                  <div style={{ fontSize:11, color:"#f59e0b", marginTop:4 }}>⚠ Kuota hampir habis</div>
                )}
              </div>
            )}

            {/* Fitur tier */}
            <h3 style={{ fontSize:13, fontWeight:700, color:C.textSecondary, marginBottom:10, textTransform:"uppercase", letterSpacing:".06em" }}>Fitur Paket {tierInfo.label}</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
              {[
                `Generate soal: ${maxGen ? `${maxGen}×/hari` : "Tanpa batas"}`,
                `Maks. soal per sesi: ${maxQ}`,
                isPro ? "✅ Download Word (.docx)" : "❌ Download Word (.docx) — perlu upgrade",
                isPro ? "✅ Soal HOTS & campuran" : "❌ Soal HOTS & campuran — perlu upgrade",
                isPro ? "✅ Pembahasan soal" : "❌ Pembahasan soal — perlu upgrade",
              ].map((f, i) => (
                <div key={i} style={{ fontSize:13, color:C.textPrimary, padding:"7px 10px", background:C.inputBg, borderRadius:7 }}>{f}</div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {!isPro && (
                <button onClick={() => setModal("upgrade")} style={{ background:"#d97706", color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  ⚡ Upgrade ke Pro
                </button>
              )}
              <button onClick={() => setView("generate")} style={{ background:C.accentBg, color:C.accentText, border:`1px solid ${C.inputBorder}`, borderRadius:8, padding:"9px 18px", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                🏠 Kembali Generate
              </button>
              <button onClick={handleLogout} style={{ background:"transparent", border:"1px solid #ef4444", borderRadius:8, padding:"9px 18px", fontWeight:600, fontSize:13, cursor:"pointer", color:"#ef4444" }}>
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GENERATE VIEW ──────────────────────────────────────────────────── */}
      {view === "generate" && (
        <>
          {/* HERO */}
          <div style={{ textAlign:"center", padding:"2.5rem 1.5rem 1.5rem", maxWidth:680, margin:"0 auto" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.accentBg, color:C.accentText, fontSize:12, fontWeight:700, padding:"4px 11px", borderRadius:20, marginBottom:14 }}>
              📘 Asisten Guru Indonesia
            </div>
            <h1 style={{ fontSize:"clamp(24px, 4vw, 40px)", fontWeight:800, lineHeight:1.15, marginBottom:12, color:C.textPrimary }}>
              Buat soal berkualitas<br /><span style={{ color:C.accent }}>dalam hitungan detik</span>
            </h1>
            <p style={{ fontSize:15, color:C.textSecondary, lineHeight:1.7, maxWidth:460, margin:"0 auto 20px" }}>
              Generator soal untuk guru SD, SMP, dan SMA — sesuai Kurikulum Merdeka & K-13.
            </p>

            {/* Kurikulum toggle */}
            <div style={{ display:"inline-flex", background:C.track, borderRadius:8, padding:3, gap:2, marginBottom:20 }}>
              {KURIKULUM.map(k => (
                <button key={k} onClick={() => setKurikulum(k)} style={{ background:kurikulum === k ? C.cardBg : "none", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, padding:"5px 12px", borderRadius:6, color:kurikulum === k ? C.accent : C.textSecondary, boxShadow:kurikulum === k ? C.shadow : "none" }}>
                  {k}
                </button>
              ))}
            </div>

            {/* Kuota bar */}
            {!isPro && maxGen && (
              <div style={{ maxWidth:300, margin:"0 auto", background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.textSecondary, marginBottom:6 }}>
                  <span>Soal hari ini</span>
                  <span><strong style={{ color: remaining === 0 ? "#ef4444" : C.textPrimary }}>{remaining}</strong>/{maxGen} sisa</span>
                </div>
                <div style={{ height:5, background:C.track, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:3, width:`${Math.min(pct, 100)}%`, background:pct >= 80 ? "#ef4444" : pct >= 50 ? "#f59e0b" : "#10b981", transition:"width .4s" }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ maxWidth:860, margin:"0 auto", padding:"0 1.5rem 4rem" }}>

            {/* FORM CARD */}
            <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:14, padding:"1.5rem", marginBottom:"1.25rem" }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:"1.25rem", color:C.textPrimary }}>📘 Pengaturan Soal</div>

              {/* Row 1 */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:C.textSecondary, display:"block", marginBottom:5 }}>Mata Pelajaran</label>
                  <select value={mapel} onChange={e => setMapel(e.target.value)} style={ss}>
                    {MAPEL.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:C.textSecondary, display:"block", marginBottom:5 }}>Kelas</label>
                  <select value={kelas} onChange={e => setKelas(e.target.value)} style={ss}>
                    {KELAS_LIST.map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                {kurikulum === "Kurikulum Merdeka" ? (
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:C.textSecondary, display:"block", marginBottom:5 }}>Fase CP</label>
                    <select value={fase} onChange={e => setFase(e.target.value)} style={ss}>
                      {FASE_CP.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:C.textSecondary, display:"block", marginBottom:5 }}>Tingkat Kesulitan</label>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={ss}>
                      {DIFFICULTY.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {kurikulum === "Kurikulum Merdeka" && (
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:C.textSecondary, display:"block", marginBottom:5 }}>Tingkat Kesulitan</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ ...ss, maxWidth:200 }}>
                    {DIFFICULTY.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              )}

              {/* Topik */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:600, color:C.textSecondary, display:"block", marginBottom:5 }}>
                  Topik Spesifik <span style={{ fontWeight:400, color:C.textMuted }}>(opsional)</span>
                </label>
                <input type="text" placeholder="cth: Sistem Pernapasan, Pecahan Desimal…" value={topik} onChange={e => setTopik(e.target.value)} style={ss} />
              </div>

              {/* Tipe soal */}
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:C.textMuted, marginBottom:8 }}>Tipe Soal</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:7, marginBottom:14 }}>
                {TYPES.map(t => {
                  const isProType = t.pro === true;
                  const isSelected = qtype === t.v;
                  const canSelect = !isProType || isPro;
                  return (
                    <button
                      key={t.v}
                      onClick={() => setQtype(t.v)}
                      style={{
                        border: isSelected ? `1.5px solid ${C.accent}` : isProType && !isPro ? `1.5px dashed #d97706` : `1.5px solid ${C.inputBorder}`,
                        background: isSelected ? C.accentBg : isProType && !isPro ? "rgba(217,119,6,0.06)" : C.inputBg,
                        borderRadius:8, padding:"9px 10px",
                        cursor:"pointer", fontSize:12, fontWeight:600,
                        color: isSelected ? C.accentText : isProType && !isPro ? "#d97706" : C.textPrimary,
                        textAlign:"left", display:"flex", alignItems:"center", gap:6,
                        position:"relative" as const,
                      }}
                    >
                      <span>{t.icon}</span>
                      <span>{t.l}</span>
                      {isProType && !isPro && (
                        <span style={{ fontSize:9, background:"#fde68a", color:"#92400e", padding:"1px 5px", borderRadius:3, marginLeft:"auto", fontWeight:700 }}>PRO</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Preview Pro banner - muncul saat tipe Pro dipilih tapi user bukan Pro */}
              {TYPES.find(t => t.v === qtype)?.pro && !isPro && (
                <div style={{ background:"rgba(217,119,6,0.08)", border:"1px solid rgba(217,119,6,0.3)", borderRadius:10, padding:"12px 14px", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#d97706", marginBottom:3 }}>
                      ⚡ Fitur {TYPES.find(t => t.v === qtype)?.l} — Khusus Pro
                    </div>
                    <div style={{ fontSize:12, color:C.textSecondary }}>
                      {qtype === "pg_essay" ? "Generate soal Pilihan Ganda dan Esai sekaligus dalam satu sesi." : "Soal Higher Order Thinking Skills untuk melatih kemampuan analisis dan evaluasi siswa."}
                    </div>
                  </div>
                  <button
                    onClick={() => setModal("upgrade")}
                    style={{ background:"#d97706", color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap" as const, flexShrink:0 }}
                  >
                    Upgrade
                  </button>
                </div>
              )}

              {/* Mixed config */}
              {isMixed && (
                <div style={{ background:C.inputBg, border:`1px solid ${C.inputBorder}`, borderRadius:10, padding:"14px", marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.textSecondary, marginBottom:10 }}>🎲 Konfigurasi Soal Campuran</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {[
                      { key:"pilihan_ganda", label:"Pilihan Ganda" },
                      { key:"essay",         label:"Esai / Uraian" },
                      { key:"benar_salah",   label:"Benar/Salah" },
                      { key:"isian",         label:"Isian Singkat" },
                      { key:"hots",          label:"HOTS" },
                    ].map(({ key, label }) => (
                      <label key={key} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:C.textPrimary }}>
                        <span style={{ minWidth:110 }}>{label}</span>
                        <input
                          type="number" min={0} max={maxQ}
                          value={mixedConfig[key as keyof MixedConfig]}
                          onChange={e => setMixedConfig(prev => ({ ...prev, [key]: Math.max(0, +e.target.value) }))}
                          style={{ ...ss, width:60, padding:"5px 8px" }}
                        />
                        <span style={{ fontSize:11, color:C.textMuted }}>soal</span>
                      </label>
                    ))}
                  </div>
                  <div style={{ fontSize:12, color:C.textSecondary, marginTop:8 }}>
                    Total: <strong style={{ color:C.accent }}>{totalMixedQ}</strong> soal
                    {totalMixedQ > maxQ && <span style={{ color:"#ef4444", marginLeft:8 }}>⚠ Melebihi batas {maxQ}</span>}
                  </div>
                </div>
              )}

              {/* Jumlah soal (single mode — non PG+Essay) */}
              {!isMixed && !isPgEssay && (
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:C.textSecondary, display:"block", marginBottom:5 }}>
                    Jumlah Soal — <span style={{ color:C.accent, fontWeight:800 }}>{limitedNumQ}</span>
                      <span style={{ fontWeight:400, color:C.textMuted }}> (maks. {maxQ}</span>
                      <span style={{ fontWeight:400, fontSize:16, lineHeight:1, color:"#f59e0b" }}> • </span>
                      <span style={{ fontWeight:"bold", color:"#f59e0b"  }}>Pro: {usage.maxSoalPro ?? TIER_DEFAULTS.pro.maxQ}</span>
                      <span style={{ fontWeight:400, fontSize:16, lineHeight:1, color:"#f59e0b" }}> • </span>
                      <span style={{ fontWeight:"bold", color:"#f59e0b"  }}>Guru: {usage.maxSoalGuru ?? TIER_DEFAULTS.guru.maxQ}</span>
                      <span style={{ fontWeight:400, color:C.textMuted }}>)</span>
                  </label>
                  <input type="range" min={1} max={maxQ} value={limitedNumQ} onChange={e => setNumQ(+e.target.value)} style={{ width:"100%", accentColor:C.accent }} />
                </div>
              )}

              {/* Jumlah soal PG + Essay (tampil untuk semua tier saat tipe pg_essay dipilih) */}
              {!isMixed && isPgEssay && (
                <div style={{ marginBottom:14, display:"flex", flexDirection:"column", gap:10 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:C.textSecondary, display:"block", marginBottom:5 }}>
                      Jumlah Soal Pilihan Ganda — <span style={{ color:C.accent, fontWeight:800 }}>{pgCount}</span>
                    </label>
                    <input
                      type="range" min={1} max={Math.max(1, maxQ - essayCount)}
                      value={pgCount}
                      onChange={e => setPgCount(+e.target.value)}
                      style={{ width:"100%", accentColor:C.accent }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:C.textSecondary, display:"block", marginBottom:5 }}>
                      Jumlah Soal Esai — <span style={{ color:C.accent, fontWeight:800 }}>{essayCount}</span>
                    </label>
                    <input
                      type="range" min={1} max={Math.max(1, maxQ - pgCount)}
                      value={essayCount}
                      onChange={e => setEssayCount(+e.target.value)}
                      style={{ width:"100%", accentColor:C.accent }}
                    />
                  </div>
                  <div style={{ fontSize:12, color: totalPgEssayQ > maxQ ? "#ef4444" : C.textSecondary }}>
                    Total: <strong style={{ color: totalPgEssayQ > maxQ ? "#ef4444" : C.accent }}>{totalPgEssayQ}</strong> soal
                    <span style={{ fontWeight:400, color:C.textMuted }}> (maks. {maxQ}</span>
                    <span style={{ fontWeight:400, fontSize:16, lineHeight:1, color:"#f59e0b" }}> • </span>
                    <span style={{ fontWeight:"bold", color:"#f59e0b" }}>Pro: {usage.maxSoalPro ?? TIER_DEFAULTS.pro.maxQ}</span>
                    <span style={{ fontWeight:400, fontSize:16, lineHeight:1, color:"#f59e0b" }}> • </span>
                    <span style={{ fontWeight:"bold", color:"#f59e0b" }}>Guru: {usage.maxSoalGuru ?? TIER_DEFAULTS.guru.maxQ}</span>
                    <span style={{ fontWeight:400, color:C.textMuted }}>)</span>
                  </div>
                </div>
              )}

              {remaining !== null && remaining <= 0 && (
                <div style={{ background:C.warnBg, border:`1px solid ${C.warnBorder}`, color:C.warnText, borderRadius:9, padding:"12px 14px", fontSize:13, marginTop:12 }}>
                  {tier === "guest"
                    ? `Kuota tamu habis. Daftar gratis untuk ${usage.maxGenFree ?? TIER_DEFAULTS.free.maxGen}× generate/hari.`
                    : `Kuota hari ini habis. Upgrade ke Pro untuk tanpa batas.`}
                </div>
              )}

              <div style={{ display:"flex", justifyContent:"center", marginTop:22 }}>
                {TYPES.find(t => t.v === qtype)?.pro && !isPro ? (
                  <button onClick={() => setModal("upgrade")} style={{
                    width:"100%", maxWidth:320, background:"#d97706", color:"#fff",
                    border:"none", borderRadius:10, padding:"12px 28px", fontWeight:700, fontSize:14, cursor:"pointer",
                  }}>
                    ⚡ Upgrade untuk Akses {TYPES.find(t => t.v === qtype)?.l}
                  </button>
                ) : (
                  <button onClick={generateSoal} disabled={loading || (remaining !== null && remaining <= 0) || (isPgEssay && totalPgEssayQ === 0)} style={{
                    width:"100%", maxWidth:320, background:"#2563eb", color:"#fff",
                    border:"none", borderRadius:10, padding:"12px 28px", fontWeight:700, fontSize:14,
                    cursor:loading ? "not-allowed" : "pointer", opacity:loading ? 0.6 : 1,
                  }}>
                    {loading ? "Membuat soal…" : `⚡ Generate ${limitedNumQ} Soal`}
                  </button>
                )}
              </div>
            </div>

            {/* LOADING */}
            {loading && (
              <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:14, padding:"2.5rem", textAlign:"center" }}>
                <div style={{ width:38, height:38, border:`3px solid ${C.track}`, borderTopColor:C.accent, borderRadius:"50%", margin:"0 auto 14px", animation:"spin 0.75s linear infinite" }} />
                <p style={{ fontWeight:700, color:C.textPrimary }}>Soal sedang disusun…</p>
                <p style={{ fontSize:12, color:C.textMuted, marginTop:6 }}>Biasanya membutuhkan 5–15 detik</p>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div style={{ background:C.dangerBg, border:`1px solid ${C.dangerBorder}`, color:C.dangerText, borderRadius:9, padding:"12px 14px", fontSize:13 }}>
                {error}
              </div>
            )}

            {/* RESULT */}
            {result && !loading && (
              <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:14, padding:"1.5rem", animation:"fadeIn .3s ease" }}>
                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1.25rem", flexWrap:"wrap", gap:10 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, color:C.textPrimary }}>
                      {result.mapel} — {result.mixed ? "Campuran" : result.singleType}
                    </div>
                    <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>
                      {result.kelas} · {result.questions.length} soal{result.topik ? ` · ${result.topik}` : ""}
                    </div>
                    {result.mixed && result.mixedConfig && (
                      <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
                        {Object.entries(result.mixedConfig).filter(([,v]) => v > 0).map(([k, v]) => `${k.replace("_"," ")} (${v})`).join(", ")}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={copyResult} title="Salin" style={{ background:"transparent", border:`1px solid ${C.inputBorder}`, borderRadius:6, padding:"7px 10px", cursor:"pointer", color:C.textPrimary, fontSize:13 }}>
                      {copied ? "✓ Disalin" : "📋 Salin"}
                    </button>
                    <button onClick={downloadDocx} disabled={downloading} title={isPro ? "Download Word" : "Fitur Pro"} style={{ background:isPro ? C.accent : "transparent", border:isPro ? "none" : `1px solid ${C.inputBorder}`, borderRadius:6, padding:"7px 12px", cursor:downloading ? "not-allowed" : "pointer", color:isPro ? "#fff" : C.textSecondary, display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, opacity:downloading ? 0.6 : 1 }}>
                      {downloading ? "Membuat…" : "📄 Word"}
                      {!isPro && <span style={{ fontSize:9, background:"#fde68a", color:"#92400e", padding:"1px 4px", borderRadius:3, fontWeight:700 }}>PRO</span>}
                    </button>
                  </div>
                </div>

                {/* SOAL LIST */}
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {result.questions.map((q, i) => (
                    <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:9, padding:"12px 14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", color:C.textMuted }}>Soal {i + 1}</span>
                        <span style={{ fontSize:10, color:C.textMuted, background:C.track, padding:"1px 6px", borderRadius:4 }}>
                          {TYPES.find(t => t.v === q.type)?.l ?? q.type}
                        </span>
                      </div>
                      <div style={{ fontSize:14, fontWeight:500, marginBottom:q.options.length ? 9 : 0, color:C.textPrimary }}>{q.text}</div>
                      {q.options.length > 0 && (
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                          {q.options.map(o => (
                            <div key={o.k} style={{ fontSize:13, padding:"5px 9px", borderRadius:6, display:"flex", gap:7, background:C.hoverRow, color:C.textPrimary }}>
                              <span style={{ fontWeight:700 }}>{o.k}.</span><span>{o.t}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* KUNCI JAWABAN — terpisah di bawah */}
                {result.questions.some(q => q.answer || q.pembahasan) && (
                  <div style={{ marginTop:24 }}>
                    <button onClick={() => setShowAnswerKey(v => !v)} style={{ background:"transparent", border:`1px solid ${C.inputBorder}`, borderRadius:8, padding:"8px 14px", cursor:"pointer", color:C.textSecondary, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                      {showAnswerKey ? "▲" : "▼"} {showAnswerKey ? "Sembunyikan" : "Tampilkan"} Kunci Jawaban & Pembahasan
                    </button>

                    {showAnswerKey && (
                      <div style={{ marginTop:14, paddingTop:14, borderTop:`2px solid ${C.border}`, animation:"fadeIn .2s ease" }}>
                        {/* Kunci jawaban (hanya pilgan & benar/salah) */}
                        {result.questions.some(q => HAS_ANSWER_TYPES.has(q.type) && q.answer) && (
                          <div style={{ marginBottom:18 }}>
                            <div style={{ fontSize:13, fontWeight:700, marginBottom:10, color:C.textPrimary }}>🔑 Kunci Jawaban</div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(80px, 1fr))", gap:6 }}>
                              {result.questions.map((q, i) =>
                                HAS_ANSWER_TYPES.has(q.type) && q.answer ? (
                                  <div key={i} style={{ background:C.correctBg, color:C.correctText, borderRadius:7, padding:"6px 10px", fontSize:13, fontWeight:700 }}>
                                    {i + 1}. {q.answer}
                                  </div>
                                ) : null
                              )}
                            </div>
                          </div>
                        )}

                        {/* Pembahasan semua soal */}
                        {result.questions.some(q => q.pembahasan) && (
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, marginBottom:10, color:C.textPrimary }}>💡 Pembahasan</div>
                            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                              {result.questions.map((q, i) =>
                                q.pembahasan ? (
                                  <div key={i} style={{ borderLeft:`3px solid ${C.accent}`, paddingLeft:12 }}>
                                    <div style={{ fontSize:12, fontWeight:700, color:C.textSecondary, marginBottom:3 }}>
                                      Soal {i + 1}
                                      {HAS_ANSWER_TYPES.has(q.type) && q.answer && (
                                        <span style={{ color:C.correctText, marginLeft:8 }}>— Jawaban: {q.answer}</span>
                                      )}
                                    </div>
                                    <div style={{ fontSize:13, color:C.textPrimary, lineHeight:1.6 }}>{q.pembahasan}</div>
                                  </div>
                                ) : null
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      {modal === "auth" && (
        <Modal onClose={() => setModal(null)} C={C}>
          <h2 style={{ fontSize:19, fontWeight:800, marginBottom:8, color:C.textPrimary }}>Daftar Akun Gratis</h2>
          <p style={{ fontSize:13, color:C.textSecondary, marginBottom:20 }}>
            Dapatkan {usage.maxGenFree ?? TIER_DEFAULTS.free.maxGen}× generate/hari & maks. {usage.maxSoalFree ?? TIER_DEFAULTS.free.maxQ} soal per sesi.
          </p>
          <button onClick={() => { setModal(null); router.push("/login"); }} style={{ width:"100%", background:"#2563eb", color:"#fff", border:"none", borderRadius:10, padding:12, fontWeight:600, cursor:"pointer" }}>
            Daftar / Masuk
          </button>
        </Modal>
      )}

      {modal === "upgrade" && (
        <UpgradeModal onClose={() => setModal(null)} C={C} tier={tier} />
      )}

      {modal === "limit" && (
        <Modal onClose={() => setModal(null)} C={C}>
          <h2 style={{ fontSize:19, fontWeight:800, marginBottom:8, color:C.textPrimary }}>Kuota Habis</h2>
          <p style={{ fontSize:13, color:C.textSecondary, marginBottom:20 }}>
            {tier === "guest"
              ? `Kuota coba gratis (${usage.max ?? 3}×) sudah habis. Daftar akun gratis untuk ${usage.maxGenFree ?? TIER_DEFAULTS.free.maxGen}× generate/hari & maks. ${usage.maxSoalFree ?? TIER_DEFAULTS.free.maxQ} soal per sesi.`
              : tier === "free"
              ? `Kuota harian (${usage.max ?? TIER_DEFAULTS.free.maxGen}×) sudah habis. Upgrade ke Pro untuk generate tanpa batas.`
              : "Kuota hari ini telah habis."}
          </p>
          <button onClick={() => setModal(tier === "guest" ? "auth" : "upgrade")} style={{ width:"100%", background:"#2563eb", color:"#fff", border:"none", borderRadius:10, padding:12, fontWeight:600, cursor:"pointer" }}>
            {tier === "guest" ? "Daftar Gratis" : "Upgrade ke Pro"}
          </button>
        </Modal>
      )}

      {toast && (
        <div style={{ position:"fixed", bottom:20, right:20, background:theme === "light" ? "#111827" : "#2563eb", color:"#fff", padding:"11px 16px", borderRadius:9, fontSize:13, fontWeight:600, zIndex:9999, animation:"fadeIn .2s ease" }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}

// ── SUB COMPONENTS ────────────────────────────────────────────────────────────
function StatBox({ label, value, C }: { label: string; value: string; C: typeof THEMES.light }) {
  return (
    <div style={{ background:C.inputBg, border:`1px solid ${C.inputBorder}`, borderRadius:8, padding:"10px 12px" }}>
      <div style={{ fontSize:11, color:C.textMuted, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:17, fontWeight:800, color:C.textPrimary }}>{value}</div>
    </div>
  );
}

function Modal({ children, onClose, C }: { children: React.ReactNode; onClose: () => void; C: typeof THEMES.light }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:C.overlay, display:"flex", alignItems:"center", justifyContent:"center", zIndex:500, padding:"1rem" }}>
      <div style={{ background:C.cardBg, borderRadius:16, width:"100%", maxWidth:460, padding:"1.75rem", position:"relative", border:`1px solid ${C.border}` }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"none", border:"none", cursor:"pointer", fontSize:18, color:C.textMuted }}>✕</button>
        {children}
      </div>
    </div>
  );
}

function UpgradeModal({ onClose, C, tier }: { onClose: () => void; C: typeof THEMES.light; tier: Tier }) {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [selectedTier, setSelectedTier] = useState<"pro" | "guru">("pro");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const PRICES: Record<"pro" | "guru", Record<"monthly" | "yearly", number>> = {
    pro:  { monthly: 59000,  yearly: 499000 },
    guru: { monthly: 109000, yearly: 899000 },
  };

  const price = PRICES[selectedTier][period];
  const saving = period === "yearly" ? Math.round((PRICES[selectedTier].monthly * 12 - price) / (PRICES[selectedTier].monthly * 12) * 100) : 0;

  async function checkout() {
    setLoading(true); setMsg("");
    try {
      const res = await fetch("/api/payment/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier, period }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "Gagal memproses pembayaran"); return; }
      if (data.redirect_url) window.location.href = data.redirect_url;
    } catch {
      setMsg("Gagal membuat transaksi. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose} C={C}>
      <h2 style={{ fontSize:19, fontWeight:800, marginBottom:4, color:C.textPrimary }}>⚡ Upgrade Paket</h2>
      <p style={{ fontSize:13, color:C.textSecondary, marginBottom:16 }}>Pilih paket yang sesuai kebutuhan kamu.</p>

      {/* Period toggle */}
      <div style={{ display:"flex", background:C.track, borderRadius:8, padding:3, gap:2, marginBottom:14 }}>
        {(["monthly","yearly"] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ flex:1, background:period === p ? C.cardBg : "none", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, padding:"6px", borderRadius:6, color:period === p ? C.accent : C.textSecondary }}>
            {p === "monthly" ? "Bulanan" : `Tahunan${saving > 0 ? ` (-${saving}%)` : ""}`}
          </button>
        ))}
      </div>

      {/* Tier options */}
      {(["pro","guru"] as const).map(t => (
        <div key={t} onClick={() => setSelectedTier(t)} style={{ border:selectedTier === t ? `2px solid ${C.accent}` : `1.5px solid ${C.inputBorder}`, borderRadius:10, padding:"12px 14px", marginBottom:8, cursor:"pointer", background:selectedTier === t ? C.accentBg : C.inputBg }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:700, color:C.textPrimary }}>{t === "pro" ? "Pro" : "Guru Lengkap"}</div>
              <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>
                {t === "pro" ? "20 soal/sesi, HOTS, download Word" : "50 soal/sesi, semua fitur Pro"}
              </div>
            </div>
            <div style={{ fontWeight:800, fontSize:16, color:selectedTier === t ? C.accentText : C.textPrimary }}>
              {formatRp(PRICES[t][period])}
              <span style={{ fontSize:11, fontWeight:400 }}>/{period === "monthly" ? "bln" : "thn"}</span>
            </div>
          </div>
        </div>
      ))}

      {msg && <p style={{ fontSize:12, color:"#ef4444", marginBottom:10 }}>{msg}</p>}

      <button onClick={checkout} disabled={loading} style={{ width:"100%", background:"#2563eb", color:"#fff", border:"none", borderRadius:10, padding:12, fontWeight:700, cursor:loading ? "not-allowed" : "pointer", opacity:loading ? 0.7 : 1, marginTop:8, fontSize:14 }}>
        {loading ? "Memproses…" : `Bayar ${formatRp(price)}`}
      </button>
      <p style={{ fontSize:11, color:C.textMuted, textAlign:"center", marginTop:8 }}>Pembayaran aman via Midtrans · Bisa transfer bank, GoPay, QRIS</p>
    </Modal>
  );
}
