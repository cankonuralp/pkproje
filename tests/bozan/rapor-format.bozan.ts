/* OLUMSUZ KANIT — tests/rapor-format.test.ts ve tests/format-motor.test.ts'in kilit denetimi neyi koruyor (308). Kaynak diskte DEĞİŞTİRİLMEZ
   (anayasa 13.11): göçler / modül dosyaları geçici klasöre kopyalanır, bellekte bozulur, kopyadan koşulur.
   1. 0022'deki koruma tetiği olmasaydı yayınlanan sürümün tanımı sonradan değişirdi → imzalı raporun PDF'i başka formatla çizilirdi.
   2. Motorda "değiştirilmiş" denetimi olmasaydı Bakanlık maddesinin metni değiştirilip yayınlanırdı (yalnız silme yakalanırdı).
   3. Sunucu kilit kaynağını hazır şablondan almasaydı, ilk yayında istemci kilitli öğeleri silip yayınlayabilirdi (karşılaştıracak önceki yayın yok). */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const TETIK = "CREATE OR REPLACE TRIGGER rapor_format_koru BEFORE INSERT OR UPDATE ON rapor_format FOR EACH ROW EXECUTE FUNCTION rapor_format_koru();";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
let havuz: Havuz;
let A: string, tur: string;
const gecici = mkdtempSync(join(tmpdir(), "rf-bozan-"));

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
    if (ad.startsWith("0022_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(TETIK), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(TETIK, ""));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "rf_bozuk", klasor);
  [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows.map((r) => r.id);
  havuz = havuzKur({ ...kume.uygulama, database: "rf_bozuk" });
  tur = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('DT', 'Deneme Tesisat', 'elektrik', 'e', 12) RETURNING id::text"))).rows[0].id;
});
after(async () => { await havuz?.end(); await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("koruma tetiği olmayınca yayınlanan sürümün tanımı sonradan değişir (kilidin koruduğu açık)", async () => {
  const id = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO rapor_format (tur_id, durum, sira, sema, tanim, olusturan, yayinlayan, yayin) VALUES ($1, 'yayinda', 1, 1, '{\"sema\":1,\"bolumler\":[]}', 'x', 'x', now()) RETURNING id::text", [tur]))).rows[0].id;
  await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE rapor_format SET tanim = '{\"sema\":1,\"bolumler\":[{\"id\":\"sahte\"}]}' WHERE id = $1", [id]));
  const t = (await supa.sahip.query<{ tanim: { bolumler: unknown[] } }>("SELECT tanim FROM rapor_format WHERE id = $1", [id])).rows[0].tanim;
  assert.equal(t.bolumler.length, 1, "yayınlanmış tanım değişti");
});

test("motorda 'değiştirilmiş' denetimi kalkınca Bakanlık maddesinin metni değiştirilmiş taslak engelsiz geçer", async () => {
  type Motor = typeof import("../../src/format/motor.ts");
  const m = await bozukModul<Motor>("src/format/motor.ts", `        else if (maddeOzu(n) !== maddeOzu(e)) sorun("değiştirilmiş", id, ad);\n`, "");
  const t = structuredClone(SABLONLAR.ZPKR02.tanim);
  const g = t.bolumler.find((b) => b.id === "gozle");
  if (g?.blok === "liste") g.gruplar[0].maddeler[0].metin = "Değiştirildi";
  assert.deepEqual(m.kilitDenetimi(t, SABLONLAR.ZPKR02.tanim), [], "bozuk motor değişikliği görmüyor");
});

test("sunucu kilit kaynağını şablondan almayınca ilk yayında kilitli öğeleri silinmiş taslak yayınlanır", async () => {
  type Formatlar = typeof import("../../src/modules/rapor-format/server/formatlar.ts");
  const f = await bozukModul<Formatlar>("src/modules/rapor-format/server/formatlar.ts", "  if (s) l.push(s.tanim);\n", "");
  /* bu denemede göçler BOZULMAMIŞ (tetik yerinde): kümenin kendi veritabanı */
  const s = kume.sahipIstemci(); await s.connect();
  const firma = await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-c', 'Deneme C', 'DC') RETURNING id").finally(() => s.end());
  const C = firma.rows[0].id;
  const h = havuzKur(kume.uygulama);
  try {
    const kimId = (await kiraciIcinde(h, C, (db) => db.sorgu<{ id: string }>(
      "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('e@deneme.example', 'Deneme', '{elektrik_yonetici}', 'etkin') RETURNING id::text"))).rows[0].id;
    const kim = { id: kimId, ad: "Deneme", roller: ["elektrik_yonetici"] as const };
    const turC = (await kiraciIcinde(h, C, (db) => db.sorgu<{ id: string }>(
      "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('DU', 'Deneme Tesisat 2', 'elektrik', 'e', 12) RETURNING id::text"))).rows[0].id;
    const is = <T,>(x: (db: Parameters<Parameters<typeof kiraciIcinde>[2]>[0]) => Promise<T>) => kiraciIcinde(h, C, x, { hesapId: kimId });
    const b = await is((db) => f.taslakBaslat(db, kim, turC, "sablon:ZPKR02", null));
    assert.ok(b.durum === "tamam");
    const eksik = structuredClone(SABLONLAR.ZPKR02.tanim); eksik.bolumler = eksik.bolumler.filter((x) => x.id !== "gozle" && x.id !== "fonk");
    const k = await is((db) => f.taslakKaydet(db, kim, b.id, b.surum, eksik));
    assert.ok(k.durum === "tamam");
    const y = await is((db) => f.yayinla(db, kim, k.id, k.surum, ""));
    assert.equal(y.durum, "tamam", "Bakanlık maddeleri silinmiş format yayınlandı");
  } finally { await h.end(); }
});
