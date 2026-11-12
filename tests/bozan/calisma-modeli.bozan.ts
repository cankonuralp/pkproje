/* OLUMSUZ KANIT — göç 0127'nin kilidi (tests/yonetim.test.ts "çalışma modeli (0127)") neyi koruyor (2026-11-12; reisim: "türkaklı ve türkaksız
   firmalar için 2 ayrı model", pkproje.md §11 K1: modeli yalnız Yönetim değiştirir). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): tetik bu dosyanın
   KENDİ geçici kümesinde kaldırılır. GERÇEK PostgreSQL. O zaman:
   1. firma_ayar_calisma_kilidi kalkınca firmanın uygulama rolü kendi modelini TÜRKAK'sız yapar — TÜRKAK'lı firma zor günde ölçümü kapatıp saati
      elle yazabilirdi. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type pg from "pg";
import { ayarOku, ayarYaz, calismaModeli } from "../../src/server/ayar/ayar.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, sahip: pg.Client, F = "";
before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  sahip = kume.sahipIstemci(); await sahip.connect();
  F = (await sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('bozan-model', 'Bozan Model', 'BM') RETURNING id::text")).rows[0]!.id;
  /* firma TÜRKAK'lı (sahip yazar — kilit yalnız uygulama rolüne) */
  await sahip.query(`INSERT INTO firma_ayar (firma_id, bolum, deger) VALUES ($1, 'calisma', '{"model": "turkak"}'::jsonb)`, [F]);
});
after(async () => { await havuz?.end(); await sahip?.end(); await kume?.durdur(); });

const kapat = () => kiraciIcinde(havuz, F, async (db) => {
  const m = await ayarOku(db, "calisma");
  return ayarYaz(db, "calisma", m.surum, { model: "siz" }, { kim: "Deneme", ne: "ayar.calisma" });
});

test("1. firma_ayar_calisma_kilidi kalkınca firmanın uygulama rolü kendi modelini TÜRKAK'sız yapar (kilidin koruduğu açık)", async () => {
  await assert.rejects(kapat(), /yönetiminden değiştirilir/, "sağlam");
  assert.equal(await kiraciIcinde(havuz, F, (db) => calismaModeli(db)), "turkak");
  await sahip.query("DROP TRIGGER firma_ayar_calisma_kilidi ON firma_ayar");
  assert.equal((await kapat()).durum, "tamam");
  assert.equal(await kiraciIcinde(havuz, F, (db) => calismaModeli(db)), "siz",
    "bozuk: firma kendi modelini TÜRKAK'sız yaptı — testin 'uygulama rolü yazamaz' beklentisi düşer");
});
