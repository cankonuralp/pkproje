-- ══ 0010 · İŞLEVLERİN ARAMA YOLU SABİT ═══════════════════════════════════════════════════════════════════════════════════════════
-- Supabase güvenlik denetimi (2026-10-04, "function_search_path_mutable"): arama yolu işlevi çağıranın oturumundan gelirse, şema oluşturma
-- hakkı olan biri aynı adlı bir tabloyu / işlevi öne koyup tetiğin davranışını değiştirebilir. Her işlevin arama yolu sabitlenir
-- (pg_catalog önce, sonra public; geçici şema en sonda). firma_bul 0001'de zaten sabit. ⛔ Her göç IDEMPOTENT.
ALTER FUNCTION gecerli_firma() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION hesap_oturum_dusur() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION denetim_izi_damga() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION denetim_izi_degismez() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION numara_sayaci_ileri() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION dosya_icerik_degismez() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION personel_ayrilinca_hesap_kapat() SET search_path = pg_catalog, public, pg_temp;
