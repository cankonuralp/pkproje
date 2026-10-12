-- ══ 0083 · YAPAY ZEKÂ MODELİ: HAİKU (2026-10-12; reisim: "yapay zekada da haiku ve diğer haiku sürümleri seçenekler olmalı daha uygun ücretlendirme
-- için" → sunum Y1–Y4 kabul: Claude Haiku 5.5 eklendi, yeni firmada varsayılan; Haiku 4.5 eklenmedi) ══
-- Okuma kaydının model kısıtı (0052: 'opus', 'sonnet') 'haiku'yu da alır. Firma ayarındaki model listesi ve fiyatlar kodda (src/server/yz/okuma.ts,
-- src/modules/firma-ayarlari/sema.ts). ⛔ Her göç IDEMPOTENT.
ALTER TABLE yz_okuma DROP CONSTRAINT IF EXISTS yz_okuma_model_check;
ALTER TABLE yz_okuma ADD CONSTRAINT yz_okuma_model_check CHECK (model IN ('haiku', 'sonnet', 'opus'));
