-- 0114 · S.A.Y BÜYÜK İŞ ŞEMASI (2026-11-01; reisim: "müşteriler 20-25-50-60 fotoğraflı işi de tek te yaptırmak isteyebilir daha uygulanabilir bir şema
-- kurmalıyız, müşteriye göstermeden"; sunum yerel/say-arge/2026-11-01-sunum-buyuk-is-semasi.md, "Evet, başla"):
-- · fotoğrafın ön okuması ETİKET ALANLARINI da döner — alanlar: [{ad: marka | model | seri | imal | kapasite | diger, deger, emin}] (yoksa []);
-- · fotoğrafın kendisi artık konuşmaya girmez, hizmete (Dosya API) yüklenmez — yz_ek.dosya fotoğrafta '-' (src/server/yz/konusma.ts DOSYA_YOK); konuşmaya her
--   fotoğraf için ön okuma satırı girer (src/modules/say/malzeme.ts ekBasligi). Kilit tests/say-on-okuma.test.ts, say-ek. ⛔ Her göç IDEMPOTENT.

ALTER TABLE yz_ek_okuma ADD COLUMN IF NOT EXISTS alanlar jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE yz_ek_okuma DROP CONSTRAINT IF EXISTS yz_ek_okuma_alanlar_dizi;
ALTER TABLE yz_ek_okuma ADD CONSTRAINT yz_ek_okuma_alanlar_dizi CHECK (jsonb_typeof(alanlar) = 'array' AND pg_column_size(alanlar) <= 4000);
