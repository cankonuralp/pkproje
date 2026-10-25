/* OLUMSUZ KANIT — tests/belge-format.test.ts ve tests/belge-format-saf.test.ts neyi koruyor (2026-10-25, belge formatları; reisim: "herhangi bir
   form ekleme mekaniği bu şekilde çalışmalı aynı araca bağlamalıyız"). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler / modül dosyaları
   geçici klasöre kopyalanır, bellekte bozulur, kopyadan koşulur.
   1. 0104'teki koruma tetiği olmasaydı yayınlanan belge formatının tanımı sonradan değişirdi (aynı sürümle çizilen belgeler başka görünürdü).
   2. basiliBelgeye raporun eklediği bölümleri süzmeseydi basılı formdan kurulan zimmet formunda "Sonuç: uygundur" ve muayene uzmanı imzası çıkardı.
   3. Göçün belge listesi katalogdan bir belge eksik kalsaydı o belgenin formatı veritabanına yazılamazdı — saf testin karşılaştırması bunu görür. */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { BELGE_TURLERI } from "../../src/belge/katalog.ts";
import { basilidanTanim } from "../../src/modules/rapor-format/basili.ts";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const TETIK = "CREATE OR REPLACE TRIGGER belge_format_koru BEFORE INSERT OR UPDATE ON belge_format FOR EACH ROW EXECUTE FUNCTION belge_format_koru();";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
let havuz: Havuz;
let A: string;
const gecici = mkdtempSync(join(tmpdir(), "bf-bozan-"));

/** kaynak dosyayı göreli içe aktarmaları mutlak adrese çevrilmiş ve bozulmuş olarak geçici klasöre yazar, içe aktarır */
let sira = 0;
async function bozukModul<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const metin = readFileSync(kaynak, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(kaynak), yol)).href}"`);
  const hedef = join(gecici, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href) as Promise<M>;
}

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0104_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(TETIK), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(TETIK, ""));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "bf_bozuk", klasor);
  [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('belge-a', 'Deneme A', 'BA') RETURNING id")).rows.map((r) => r.id);
  havuz = havuzKur({ ...kume.uygulama, database: "bf_bozuk" });
});
after(async () => { await havuz?.end(); await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("koruma tetiği olmayınca yayınlanan belge formatının tanımı sonradan değişir (kilidin koruduğu açık)", async () => {
  const id = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO belge_format (belge, durum, sira, sema, tanim, olusturan, yayinlayan, yayin) VALUES ('zimmet', 'yayinda', 1, 1, '{\"sema\":1,\"bolumler\":[]}', 'x', 'x', now()) RETURNING id::text"))).rows[0].id;
  await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE belge_format SET tanim = '{\"sema\":1,\"bolumler\":[{\"id\":\"sahte\"}]}' WHERE id = $1", [id]));
  const t = (await supa.sahip.query<{ tanim: { bolumler: unknown[] } }>("SELECT tanim FROM belge_format WHERE id = $1", [id])).rows[0].tanim;
  assert.equal(t.bolumler.length, 1, "yayınlanmış tanım değişti");
});

test("basiliBelgeye raporun eklediği bölümleri süzmeyince zimmet formuna Sonuç ve muayene uzmanı girer", async () => {
  type Belgeler = typeof import("../../src/modules/rapor-format/server/belgeler.ts");
  const m = await bozukModul<Belgeler>("src/modules/rapor-format/server/belgeler.ts", " && !RAPOR_EKI.has(imza(b))", "");
  const c = basilidanTanim({ cevap: "", baslik: "", formKodu: "", altYazi: "", yazi: { tip: "carlito", boy: 9 }, bolumler: [
    { ad: "Form", tur: "tablo", yan: false, oran: 0, sutunlar: [100], cevaplar: [], satirlar: [
      { tekrar: false, yukseklik: 0, hucreler: [{ metin: "Zimmet", tur: "yazi", sutunBirlesim: 1, satirBirlesim: 1, kaynak: "yok" }] }] }] }, "Zimmet Teslim Formu");
  assert.ok(c);
  const adlar = m.basiliBelgeye(c.tanim, "Zimmet Teslim Formu").bolumler.map((b) => b.ad);
  assert.ok(adlar.includes("Sonuç") && adlar.includes("Muayene uzmanı"), `bozuk süzgeç rapor bölümlerini bırakıyor: ${adlar.join(", ")}`);
});

test("göçün belge listesinden bir belge düşünce saf testin karşılaştırması farkı görür", () => {
  const sql = readFileSync(join(GOC_KLASORU, "0104_belge_format.sql"), "utf8").replace(", 'onbilgi'", "");
  const m = /CONSTRAINT belge_format_belge_check\s+CHECK \(belge IN \(([^)]*)\)\)/.exec(sql);
  assert.ok(m);
  assert.notDeepEqual(m[1].split(",").map((x) => x.trim().replace(/^'|'$/g, "")), [...BELGE_TURLERI], "eksik liste katalogla aynı değil");
});
