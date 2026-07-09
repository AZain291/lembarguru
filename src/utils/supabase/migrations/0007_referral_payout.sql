-- 0007_referral_payout.sql
-- referral_redemptions.reward_given cuma berarti "redemption ini berhasil
-- dan reward-nya sudah dihitung" (di-set bareng status='success' oleh
-- upgradeUserForOrder -> markReferralSuccess di src/utils/subscription.ts)
-- -- BUKAN "sudah ditransfer ke referrer". Kolom ini melacak pembayaran
-- manual yang sebenarnya, ditandai admin lewat tab "Referral".
alter table public.referral_redemptions
  add column if not exists paid_at timestamptz;
