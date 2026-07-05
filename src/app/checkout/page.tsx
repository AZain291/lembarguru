"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Plan = {
  tier: string;
  label: string;
  price_monthly: number;
  price_yearly: number;
};

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = searchParams.get("plan") || "";
  const cycle = (searchParams.get("cycle") === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly";

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [promoError, setPromoError] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  // Wajib login — kalau belum, arahkan ke /login lalu kembali ke sini
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        const redirectTo = `/checkout?plan=${tier}&cycle=${cycle}`;
        router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`);
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router, tier, cycle]);

  // Ambil detail paket dari /api/pricing (route publik yang sudah dibuat sebelumnya)
  useEffect(() => {
    if (!tier) {
      setLoadingPlan(false);
      return;
    }
    fetch("/api/pricing")
      .then((res) => res.json())
      .then((data) => {
        const found = (data?.tiers ?? []).find((t: any) => t.tier === tier);
        if (found) {
          setPlan({
            tier: found.tier,
            label: found.label,
            price_monthly: Number(found.price_monthly ?? 0),
            price_yearly: Number(found.price_yearly ?? 0),
          });
        }
      })
      .finally(() => setLoadingPlan(false));
  }, [tier]);

  const basePrice = plan ? (cycle === "yearly" ? plan.price_yearly : plan.price_monthly) : 0;
  const finalPrice = Math.max(basePrice - discount, 0);

  async function checkPromo() {
    if (!promoCode.trim()) return;
    setPromoStatus("checking");
    setPromoError("");
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), tier }),
      });
      const data = await res.json();
      if (!data.valid) {
        setPromoStatus("invalid");
        setPromoError(data.error || "Kode promo tidak valid");
        setDiscount(0);
        return;
      }
      const amount =
        data.discountType === "percentage"
          ? Math.round(basePrice * (data.discountValue / 100))
          : data.discountValue;
      setDiscount(Math.min(amount, basePrice));
      setPromoStatus("valid");
    } catch {
      setPromoStatus("invalid");
      setPromoError("Gagal memeriksa kode promo, coba lagi");
      setDiscount(0);
    }
  }

  async function handlePay() {
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch("/api/payment/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          cycle,
          promoCode: promoStatus === "valid" ? promoCode.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error || "Gagal membuat transaksi");
        setPaying(false);
        return;
      }
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        setPayError("Gagal membuat transaksi");
        setPaying(false);
      }
    } catch {
      setPayError("Terjadi kesalahan, coba lagi");
      setPaying(false);
    }
  }

  if (checkingAuth || loadingPlan) {
    return <div style={{ padding: 40, fontFamily: "sans-serif", color: "#5B6478" }}>Memuat...</div>;
  }

  if (!plan) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        Paket tidak ditemukan.{" "}
        <a href="/#harga" style={{ color: "#1F2A44" }}>
          Kembali ke daftar paket
        </a>
      </div>
    );
  }

  return (
    <>
      <div style={{ maxWidth: 480, margin: "60px auto", padding: "0 20px", fontFamily: "'Inter', sans-serif" }}>
        <h1 style={{ fontSize: 24, marginBottom: 6, color: "#1F2A44" }}>Checkout</h1>
        <p style={{ color: "#5B6478", marginBottom: 28 }}>
          {plan.label} · {cycle === "yearly" ? "Tahunan" : "Bulanan"}
        </p>

        <div style={{ border: "1px solid #DCD5C0", borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#1F2A44" }}>
            <span>Harga paket</span>
            <span>Rp{basePrice.toLocaleString("id-ID")}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#2F6F5E" }}>
              <span>Diskon ({promoCode})</span>
              <span>-Rp{discount.toLocaleString("id-ID")}</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              borderTop: "1px dashed #DCD5C0",
              paddingTop: 8,
              marginTop: 8,
              color: "#1F2A44",
            }}
          >
            <span>Total</span>
            <span>Rp{finalPrice.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#1F2A44" }}>
            Kode promo (opsional)
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoStatus("idle");
                setDiscount(0);
              }}
              placeholder="Masukkan kode"
              style={{ flex: 1, padding: "9px 12px", border: "1px solid #ccc", borderRadius: 8 }}
            />
            <button
              onClick={checkPromo}
              disabled={promoStatus === "checking" || !promoCode.trim()}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                border: "1px solid #1F2A44",
                background: "#fff",
                color: "#1F2A44",
                cursor: "pointer",
              }}
            >
              {promoStatus === "checking" ? "Mengecek..." : "Terapkan"}
            </button>
          </div>
          {promoStatus === "valid" && (
            <p style={{ color: "#2F6F5E", fontSize: 13, marginTop: 6 }}>Kode promo berhasil diterapkan.</p>
          )}
          {promoStatus === "invalid" && (
            <p style={{ color: "#C23B2E", fontSize: 13, marginTop: 6 }}>{promoError}</p>
          )}
        </div>

        {payError && <p style={{ color: "#C23B2E", fontSize: 13, marginBottom: 12 }}>{payError}</p>}

        <button
          onClick={handlePay}
          disabled={paying}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 9,
            border: "none",
            background: "#1F2A44",
            color: "#fff",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          {paying ? "Memproses..." : `Bayar Rp${finalPrice.toLocaleString("id-ID")}`}
        </button>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: "sans-serif" }}>Memuat...</div>}>
      <CheckoutInner />
    </Suspense>
  );
}
