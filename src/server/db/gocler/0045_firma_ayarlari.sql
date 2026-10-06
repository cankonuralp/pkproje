-- ══ 0045 · FİRMA AYARLARI (334; maket firma-ayarlari.html "Rapor numarası": firma kodu — "Yeni rapor: KOD-AAYY-SIRA-…; açılmış raporların
-- numarası değişmez") ══
-- Uygulama rolü firmanın YALNIZ rapor kodunu değiştirebilir (sütun yetkisi; satır kendi firması — firma_kendi politikası UPDATE'te de geçerli).
-- Açılmış raporun numarası raporda saklı, değişmez; numara üretici kodu her yeni numarada firmadan okur. Yetki (Firma ayarları "değiştirir")
-- uygulamada (src/modules/firma-ayarlari). ⛔ Her göç IDEMPOTENT.
GRANT UPDATE (rapor_kodu) ON firma TO probata_uygulama;
