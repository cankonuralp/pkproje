-- 0125 · ONAYLAR › DİĞER BELGELER PROBATA SIGN İLE (2026-11-10; reisim: "1 ve 2 ve 4 5 i yap" — liste 2: "Onaylar › Diğer belgeler probata sign ile
-- (zimmet, eğitim, bordro, araç tutanağı)"). Rapor imzasının sign alanları (0122, imza_istegi) belgenin kendisine: sign'daki belge ve istek kimliği,
-- bağlantılar (ŞİFRELİ — firmaya bağlı), sign durumu ve nedeni. Belgenin kuralları değişmez (0044 belge_onay_koru): kararı yalnız imzacı verir,
-- karar verilmiş belge değişmez — sign alanları yalnız belge beklerken yazılır. İdempotent.

ALTER TABLE belge_onay ADD COLUMN IF NOT EXISTS sign_belge text;
ALTER TABLE belge_onay ADD COLUMN IF NOT EXISTS sign_istek text;
ALTER TABLE belge_onay ADD COLUMN IF NOT EXISTS sign_baglanti text;
ALTER TABLE belge_onay ADD COLUMN IF NOT EXISTS sign_durum text;
ALTER TABLE belge_onay ADD COLUMN IF NOT EXISTS sign_neden text;
ALTER TABLE belge_onay DROP CONSTRAINT IF EXISTS belge_onay_sign;
ALTER TABLE belge_onay ADD CONSTRAINT belge_onay_sign CHECK (
  (sign_belge IS NULL OR sign_belge ~ '^[0-9a-f-]{36}$') AND (sign_istek IS NULL OR sign_istek ~ '^[0-9a-f-]{36}$')
  AND (sign_baglanti IS NULL OR sign_baglanti ~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]+$')
  AND (sign_durum IS NULL OR sign_durum IN ('bekliyor', 'reddedildi', 'iptal', 'hata'))
  AND (sign_neden IS NULL OR length(sign_neden) <= 400));
CREATE INDEX IF NOT EXISTS belge_onay_sign_belge ON belge_onay (firma_id, sign_belge) WHERE sign_belge IS NOT NULL;
