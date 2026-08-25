// src/app/register/page.tsx — v2
// Perbaikan dari v1: client import dibetulkan ke @/utils/supabase/client.
// Redeem referral tetap manggil /api/referral/redeem (baru, sudah dibuat di v2).
"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { GoogleIcon } from "@/components/GoogleIcon";

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("lg_ref_code", ref);
      setRefCode(ref);
    } else {
      const stored = localStorage.getItem("lg_ref_code");
      if (stored) setRefCode(stored);
    }
  }, [params]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nama, ref_code: refCode ?? null } },
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    if (refCode && data.user) {
      try {
        await fetch("/api/referral/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: refCode, user_id: data.user.id }),
        });
      } catch {
        // gagal catat referral tidak boleh menggagalkan proses daftar
      }
      localStorage.removeItem("lg_ref_code");
    }

    if (data.user) {
      try {
        await fetch("/api/notify/new-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name: nama }),
        });
      } catch {
        // gagal kirim notifikasi admin tidak boleh menggagalkan proses daftar
      }
    }

    setLoading(false);
    router.push("/verifikasi-email");
  }

  async function handleGoogleAuth() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: "0 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Link href="/" style={{ textDecoration: "none", color: "#1F2A44", fontWeight: 700, fontSize: 21 }}>
          LembarGuru
        </Link>
      </div>

      <h1 style={{ fontSize: 22, marginBottom: 4, color: "#1F2A44" }}>Daftar Gratis</h1>
      <p style={{ fontSize: 14, color: "#5B6478", marginBottom: 20 }}>
        Mulai buat soal hari ini, tanpa kartu kredit.
      </p>

      {refCode && (
        <div style={{
          fontFamily: "monospace", fontSize: 12, background: "#F1E6CC", color: "#B98A1F",
          padding: "6px 10px", borderRadius: 6, marginBottom: 16, display: "inline-block",
        }}>
          Diundang lewat kode referral: {refCode}
        </div>
      )}

      <button type="button" onClick={handleGoogleAuth}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", boxSizing: "border-box", padding: "11px", border: "1px solid #DCD5C0", borderRadius: 9, background: "#fff", fontWeight: 600, fontSize: 14, color: "#1F2A44", cursor: "pointer", marginBottom: 18 }}>
        <GoogleIcon />
        Daftar dengan Google
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ flex: 1, height: 1, background: "#DCD5C0" }} />
        <span style={{ fontSize: 12, color: "#9ca3af" }}>atau</span>
        <div style={{ flex: 1, height: 1, background: "#DCD5C0" }} />
      </div>

      <form onSubmit={handleRegister} autoComplete="on">
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#1F2A44" }}>
            Nama lengkap
          </label>
          <input required name="name" autoComplete="name" value={nama} onChange={(e) => setNama(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #DCD5C0", borderRadius: 8 }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#1F2A44" }}>
            Email
          </label>
          <input type="email" required name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #DCD5C0", borderRadius: 8 }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#1F2A44" }}>
            Kata sandi
          </label>
          <input type="password" required name="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #DCD5C0", borderRadius: 8 }} />
        </div>

        {error && <p style={{ color: "#C23B2E", fontSize: 13, marginBottom: 14 }}>{error}</p>}

        <button type="submit" disabled={loading} style={{
          width: "100%", padding: 12, borderRadius: 9, border: "none",
          background: "#1F2A44", color: "#fff", fontWeight: 600, cursor: "pointer",
        }}>
          {loading ? "Memproses..." : "Daftar Gratis"}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: 13.5, color: "#5B6478", marginTop: 20 }}>
        Sudah punya akun?{" "}
        <Link href="/login" style={{ color: "#C23B2E", fontWeight: 600 }}>Masuk</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Memuat...</div>}>
      <RegisterInner />
    </Suspense>
  );
}
