/* OLUMSUZ KANIT — göç 0106'nın kilidi (tests/firma-ayarlari.test.ts "yapay zekâ firmada yazılamaz", tests/yonetim-firmada.test.ts "yapay zekâ ayarı
   (0106)") neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): tetikler bu dosyanın KENDİ geçici kümesinde kaldırılır. GERÇEK PostgreSQL.
   O zaman:
   1. firma_ayar_yz_kilidi kalkınca firmanın uygulama rolü yapay zekâyı açar ve sınırı değiştirir (Firma ayarlarından ya da S.A.Y'dan değişebilirdi);
   2. firma_sir_k3'ten yapay zekâ anahtarı çıkınca uygulama rolü anahtarı yazar. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import type pg from "pg";
import { ayarOku, ayarYaz } from "../../src/server/ayar/ayar.ts";
import { sirYaz } from "../../src/server/ayar/sir.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, sahip: pg.Client, F = "", eskiAnahtar: string | undefined;
before(async () => {
  eskiAnahtar = process.env.PROBATA_SIR_ANAHTARI;
  process.env.PROBATA_SIR_ANAHTARI = randomBytes(32).toString("base64");
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  sahip = kume.sahipIstemci(); await sahip.connect();
  F = (await sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('bozan-yz', 'Bozan YZ', 'BY') RETURNING id::text")).rows[0]!.id;
});
after(async () => {
  if (eskiAnahtar === undefined) delete process.env.PROBATA_SIR_ANAHTARI; else process.env.PROBATA_SIR_ANAHTARI = eskiAnahtar;
  await havuz?.end(); await sahip?.end(); await kume?.durdur();
});

const ac = () => kiraciIcinde(havuz, F, async (db) => {
  const m = await ayarOku(db, "yapay_zeka");
  return ayarYaz(db, "yapay_zeka", m.surum, { ...m.deger, acik: true, sinir: null }, { kim: "Deneme", ne: "ayar.yapay_zeka" });
});

test("1. firma_ayar_yz_kilidi kalkınca uygulama rolü yapay zekâyı açar, sınırı kaldırır (kilidin koruduğu açık)", async () => {
  await assert.rejects(ac(), /yönetiminden değiştirilir/, "sağlam");
  await sahip.query("DROP TRIGGER firma_ayar_yz_kilidi ON firma_ayar");
  assert.equal((await ac()).durum, "tamam");
  const y = await kiraciIcinde(havuz, F, (db) => ayarOku(db, "yapay_zeka"));
  assert.deepEqual([y.deger.acik, y.deger.sinir], [true, null], "bozuk: firma kendi yapay zekâsını açtı, sınırı kaldırdı — testin 'yönetiminden değiştirilir' beklentisi düşer");
});

test("2. firma_sir_k3'ten yapay zekâ anahtarı çıkınca uygulama rolü anahtarı yazar (kilidin koruduğu açık)", async () => {
  const yaz = () => kiraciIcinde(havuz, F, (db) => sirYaz(db, "yapay_zeka_anahtari", "sk-ant-uydurmaAnahtarDegil0123456789wxyz", { kim: "Deneme" }));
  await assert.rejects(yaz(), /yönetiminden kurulur/, "sağlam");
  await sahip.query(`CREATE OR REPLACE FUNCTION firma_sir_k3() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
    BEGIN
      IF current_user = 'probata_uygulama' AND ((TG_OP <> 'DELETE' AND NEW.ad = 'eposta_anahtari') OR (TG_OP <> 'INSERT' AND OLD.ad = 'eposta_anahtari')) THEN
        RAISE EXCEPTION 'E-posta gönderim anahtarı probata yönetiminden kurulur.' USING ERRCODE = '42501';
      END IF;
      RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END $$`);
  await yaz();
  const n = await kiraciIcinde(havuz, F, (db) => db.sorgu("SELECT 1 FROM firma_sir WHERE ad = 'yapay_zeka_anahtari' AND sifreli IS NOT NULL"));
  assert.equal(n.rowCount, 1, "bozuk: uygulama rolü yapay zekâ anahtarını yazdı — testin 'yönetiminden kurulur' beklentisi düşer");
});
