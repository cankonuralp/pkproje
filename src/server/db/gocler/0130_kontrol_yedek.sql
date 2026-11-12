-- ══ 0130 · KONTROL KAYDI YEDEĞE (2026-11-12; pkproje.md §11 T7 — reisim: "log kayıtları düzgün olmalı"): ölçülen kontrol saatleri (göç 0128) firmanın
--    yedeğine girer — değişiklik kaydı (yedek_iz tetiği) ve yedeklenen tablolar listesi. Geri yüklemede tablo sırası bağlardan hesaplanır, kullanıcı
--    tetikleri kapalıdır (ölçülen saat aynen geri gelir). Liste src/server/yedek/tablolar.ts ile aynı (kilit tests/yedek-saf.test.ts). ══
-- ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE TRIGGER yedek_iz AFTER INSERT OR UPDATE OR DELETE ON kontrol FOR EACH ROW EXECUTE FUNCTION yedek_iz('id');

/* yedeklenen tablolar (0119, 0123): kontrol eklendi */
CREATE OR REPLACE FUNCTION yedek_tablolari() RETURNS text[]
  LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY['arac', 'arac_km', 'arac_tutanagi', 'belge_doldurma', 'belge_format', 'belge_onay', 'bordro', 'cihaz_turu', 'demirbas',
    'denetim_izi', 'dokuman', 'dosya', 'egitim_kaydi', 'egitim_turu', 'ekipman', 'ekipman_atamasi', 'ekipman_kodu', 'ekipman_turu', 'fatura',
    'fatura_rapor', 'firma_ayar', 'fiyat_listesi', 'format_parca', 'gider', 'hesap', 'ice_aktarim', 'imza_istegi', 'is_sozlesmesi',
    'is_sozlesmesi_tesis', 'isg_katip', 'izin_talebi', 'kalibrasyon', 'kontrol', 'kosul_kabul', 'musteri', 'musteri_hesap', 'numara_sayaci',
    'olcum_cihazi', 'ozluk_belgesi', 'personel', 'plan', 'plan_ekip', 'plan_ekipman', 'plan_not', 'rapor', 'rapor_format', 'rapor_hareket',
    'rapor_revize_istegi', 'rapor_surumu', 'saha_formu', 'saklama_silme', 'sozlesme_sablon', 'standart', 'standart_tanim', 'tahsilat', 'teklif',
    'teklif_kalem', 'teklif_tesis', 'tesis', 'tur_format', 'uygunsuzluk', 'zimmet_formu', 'zimmet_hareket']::text[]
$$;
ALTER FUNCTION yedek_tablolari() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yedek_tablolari() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION yedek_tablolari() TO probata_uygulama;
