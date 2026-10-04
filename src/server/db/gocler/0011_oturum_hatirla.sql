-- ══ 0011 · "BENİ HATIRLA" (reisim 2026-10-04: "giriş ekranında ... beni hatırla tuşu yok") ═══════════════════════════════════════════
-- İşaretsiz (varsayılan): çerez oturumluk (tarayıcı kapanınca biter), sunucuda hareketsizlik 12 saat, mutlak 14 gün — eskisi gibi.
-- İşaretli: çerez 14 gün kalıcı, hareketsizlik sınırı 7 gün (src/server/kimlik/oturum.ts). Mutlak sınır ikisinde de 14 gün. ⛔ IDEMPOTENT.
ALTER TABLE oturum ADD COLUMN IF NOT EXISTS hatirla boolean NOT NULL DEFAULT false;
