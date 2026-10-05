/* OLUMSUZ KANIT — tests/onaylar.test.ts neyi koruyor (314). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler / modül dosyası geçici klasöre
   kopyalanır, bellekte bozulur, kopyadan koşulur.
   1. Sunucuda rapor_onayla denetimi olmasaydı raporu gören ama onay yetkisi olmayan firma yöneticisi (Onaylar "gör") raporu onaylardı.
   2. 0026'daki gerekçe kuralı olmasaydı rapor gerekçesiz Yeni'ye döner, denetçi neyi düzelteceğini bilmezdi (sunucu dışından yazılan durum).
      (0027 akış işlevini yeniden yazdığı için kural iki göçten birlikte sökülür.)
   3. (317) 0027'deki imza kuralı olmasaydı onaylanmış rapor imzalı sürüm olmadan Tamamlandı'ya geçer, müşteriye imzasız açılırdı.
   4. (318, C5) Sunucuda yönetici düzeyi denetimi olmasaydı Onaylar'da yalnız imzasını bekleyenleri gören denetçi kendi raporunun onay ekranını
      açardı.
   5. (0028, 315–317 incelemesi) Onaydan çıkan raporun bekleyen imza isteği iptal edilmeseydi eski içerikli PDF yeniden onaydan sonra da
      "hazır" kalır, imzalanırdı.
   6. (318 revizyon, 0029) Revizyon kuralı olmasaydı raporun revizyonu elle değişir (imzalı sürüm numarası kayar, R1 atlanır).
   7. (318) Sunucuda rapor_revizeye_gonder denetimi olmasaydı tamamlanan raporu yalnız gören firma yöneticisi revizeye gönderirdi.
   8. (0028 / 0031, 318 incelemesi) İmzalı sürüm yalnız bekleyen isteğin PDF'iyle yazılmasaydı imzaya hiç hazırlanmamış (ya da iptal edilmiş)
      bir PDF imzalı sürüm olurdu.
   9. (0031) İleri tarih kuralı olmasaydı imza gününden ileri tarihli rapor imzalanır, ekipmanın sonraki kusurlarını "giderildi" kapatırdı.
  10. (0031) Eskimiş sürüm kuralı olmasaydı revizyonla düzeltilen yanlış (ileri) tarih başka raporun kusurunu giderilmiş doğururdu.
   Akış ve hareket işlevlerini sonraki göçler (0027, 0029) yeniden yazdığından her kural geçtiği bütün göçlerden birlikte sökülür. */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../../src/server/db/kiraci.ts";
import { klasorDepo } from "../../src/server/dosya/depo.ts";
import { planKabul } from "../../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../../src/modules/rapor-format/server/formatlar.ts";
import { imzaHazirla, imzaliYukle, raporOlustur } from "../../src/modules/raporlar/server/raporlar.ts";
import { dosyaYukle } from "../../src/server/dosya/dosya.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const GEREKCE = `    IF NEW.durum = 'taslak' AND length(btrim(coalesce(current_setting('app.gerekce', true), ''))) < 10 THEN
      RAISE EXCEPTION 'denetçiye dönen raporda gerekçe en az 10 karakter' USING ERRCODE = '23514';
    END IF;
`;
const IMZA = `    IF NEW.durum = 'imzali' AND NOT EXISTS (SELECT 1 FROM rapor_surumu s WHERE s.firma_id = NEW.firma_id AND s.rapor_id = NEW.id AND s.revizyon = NEW.revizyon) THEN
      RAISE EXCEPTION 'imzalı sürüm olmadan rapor tamamlanmaz' USING ERRCODE = '23514';
    END IF;
`;
const IPTAL = `    IF OLD.durum = 'onaylandi' AND NEW.durum IN ('taslak', 'onayda') THEN
      UPDATE imza_istegi SET durum = 'iptal', surum = surum + 1, degisti = now()
        WHERE firma_id = NEW.firma_id AND rapor_id = NEW.id AND revizyon = NEW.revizyon AND durum = 'bekliyor';
    END IF;
`;
const REVIZYON = `  IF NEW.revizyon IS DISTINCT FROM OLD.revizyon AND NOT revize THEN
    RAISE EXCEPTION 'revizyon yalnız tamamlanan rapor revizeye gönderilirken bir artar' USING ERRCODE = '23514';
  END IF;
`;
const KEMER = `  IF NOT EXISTS (SELECT 1 FROM imza_istegi i WHERE i.firma_id = NEW.firma_id AND i.rapor_id = NEW.rapor_id AND i.revizyon = r.revizyon
                 AND i.durum = 'bekliyor' AND i.pdf_dosya = NEW.imzasiz_dosya) THEN
    RAISE EXCEPTION 'imzalı sürüm yalnız bekleyen imza isteğinin PDF''iyle yazılır' USING ERRCODE = '23514';
  END IF;
`;
const ILERI = `  IF r.rapor_tarihi IS NOT NULL AND r.rapor_tarihi > (now() AT TIME ZONE 'Europe/Istanbul')::date THEN
    RAISE EXCEPTION 'muayene tarihi imza gününden ileri olamaz' USING ERRCODE = '23514';
  END IF;
`;
const ESKIMIS = `        AND NOT EXISTS (SELECT 1 FROM rapor_surumu z WHERE z.firma_id = y.firma_id AND z.rapor_id = y.rapor_id AND z.revizyon > y.revizyon)
`;
/** göç → sökülecek kurallar (aynı işlevi yeniden yazan her göçten) */
const SOK: Record<string, string[]> = {
  "0026_": [GEREKCE], "0027_": [GEREKCE, IMZA], "0028_": [IPTAL, KEMER], "0029_": [GEREKCE, IMZA, IPTAL, REVIZYON], "0031_": [KEMER, ILERI, ESKIMIS],
};
const ONAYLAR = "src/modules/onaylar/server/onaylar.ts";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
let havuz: Havuz;
let A: string;
const gecici = mkdtempSync(join(tmpdir(), "onaylar-bozan-"));
const depo = klasorDepo(join(gecici, "depo"));

let sira = 0;
async function bozukModul<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const metin = readFileSync(kaynak, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(kaynak), yol)).href}"`);
  const hedef = join(gecici, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href) as Promise<M>;
}

/** firmaya müşteri, tesis, mekanik tür (KOMPRESOR şablonundan yayında format), ekipman, denetçi, firma yöneticisi; plan açılır, denetçi kabul
    eder, rapor açılır ve onaya gönderilir (taslak → onayda, tetiğin açtığı geçiş) */
async function kur(h: Havuz, firma: string) {
  const q = (sql: string, p: unknown[] = []) => kiraciIcinde(h, firma, async (db) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id);
  const m = await q("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Sanayi A.Ş.', 'Deneme') RETURNING id::text");
  const tesis = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m]);
  const tur = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
  const ekipman = await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'HT-1', 'x') RETURNING id::text", [tesis, tur]);
  const per = await q("INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Bir', '2024-01-01', 'mak-muh') RETURNING id::text");
  const hesap = (eposta: string, rol: string, personel: string | null = null) =>
    q("INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [eposta, [rol], personel]);
  const den: Kisi = { id: await hesap("d@deneme.example", "denetci", per), ad: "Deneme", roller: ["denetci"] };
  const plan: Kisi = { id: await hesap("p@deneme.example", "planlama"), ad: "Deneme", roller: ["planlama"] };
  const yon: Kisi = { id: await hesap("y@deneme.example", "firma_yoneticisi"), ad: "Deneme", roller: ["firma_yoneticisi"] };
  const is = <T,>(k: Kisi, x: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(h, firma, x, { hesapId: k.id });
  await is(yon, async (db) => {
    const t = await taslakBaslat(db, yon, tur, "sablon:KOMPRESOR", null);
    assert.ok(t.durum === "tamam", JSON.stringify(t));
    const y = await yayinla(db, yon, t.id, t.surum, "");
    assert.ok(y.durum === "tamam", JSON.stringify(y));
  });
  const p = await is(plan, (db) => planAc(db, depo, plan, firma, { tesis, baslangic: bugunTr(), bitis: bugunTr(), ekip: [{ personel: per }] }));
  assert.ok(p.durum === "tamam", JSON.stringify(p));
  const surum = (await is(den, (db) => db.sorgu<{ surum: number }>("SELECT surum FROM plan WHERE id = $1", [p.id]))).rows[0].surum;
  const k = await is(den, (db) => planKabul(db, den, p.id, surum, true));
  assert.ok(k.durum === "tamam", JSON.stringify(k));
  const r = await is(den, (db) => raporOlustur(db, den, p.id, ekipman));
  assert.ok(r.durum === "tamam", JSON.stringify(r));
  await is(den, (db) => db.sorgu("UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [r.id]));
  return { den, yon, plan, per, tesis, ekipman, rapor: r.id, is };
}
type Kurulum = Awaited<ReturnType<typeof kur>>;

/** onaylanmış raporu imzalar: imzasız PDF (her çağrı ayrı bayt) + artımlı imza bölümü */
let pdfSira = 0;
async function imzalaTam(k: Kurulum, firma: string, rapor: string) {
  const pdf = new TextEncoder().encode(`%PDF-1.4\n% bozan ${pdfSira++}\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n`);
  const h = await k.is(k.den, (db) => imzaHazirla(db, depo, k.den, firma, rapor, async () => pdf));
  assert.equal(h.durum, "tamam", JSON.stringify(h));
  const imzali = new Uint8Array(Buffer.concat([Buffer.from(pdf), Buffer.from("\n9 0 obj << /Type /Sig /ByteRange [0 1 2 3] /Contents <00> >> endobj\ntrailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n", "latin1")]));
  const surum = (await k.is(k.den, (db) => db.sorgu<{ surum: number }>("SELECT surum FROM rapor WHERE id = $1", [rapor]))).rows[0].surum;
  const y = await k.is(k.den, (db) => imzaliYukle(db, depo, k.den, firma, rapor, surum, { ad: "imzali.pdf", bayt: imzali }));
  assert.equal(y.durum, "tamam", JSON.stringify(y));
}
const yeniFirma = async (kisa: string, kod: string) =>
  (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ($1, 'Deneme', $2) RETURNING id", [kisa, kod])).rows[0].id;

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    const sok = SOK[ad.slice(0, 5)];
    if (!sok) { copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad)); continue; }
    let k = readFileSync(join(GOC_KLASORU, ad), "utf8");
    for (const x of sok) { assert.ok(k.includes(x), `bozulacak satır kaynakta yok: ${ad} · ${x.trim().slice(0, 50)}`); k = k.replace(x, ""); }
    writeFileSync(join(klasor, ad), k);
  }
  supa = await supabaseBenzeri(kume, "onay_bozuk", klasor);
  [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows.map((r) => r.id);
  havuz = havuzKur({ ...kume.uygulama, database: "onay_bozuk" });
});
after(async () => { await havuz?.end(); await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("0026'daki gerekçe kuralı kalkınca rapor gerekçesiz Yeni'ye döner (kilidin koruduğu açık)", async () => {
  const k = await kur(havuz, A);
  await k.is(k.yon, (db) => db.sorgu("UPDATE rapor SET durum = 'taslak' WHERE id = $1", [k.rapor]));
  const r = (await supa.sahip.query<{ durum: string; g: string | null }>(
    "SELECT r.durum, (SELECT gerekce FROM rapor_hareket h WHERE h.rapor_id = r.id AND h.ne = 'geri') AS g FROM rapor r WHERE r.id = $1", [k.rapor])).rows[0];
  assert.deepEqual([r.durum, r.g], ["taslak", null], "rapor gerekçesiz geri döndü");
});

test("0027'deki imza kuralı kalkınca onaylanmış rapor imzalı sürüm olmadan Tamamlandı'ya geçer", async () => {
  /* ayrı firma: ilk testin firması aynı tür kodunu zaten taşıyor (tür kodu firmada eşsiz) */
  const A2 = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a2', 'Deneme A2', 'DB') RETURNING id")).rows[0].id;
  const k = await kur(havuz, A2);
  await k.is(k.yon, (db) => db.sorgu("UPDATE rapor SET durum = 'onaylandi' WHERE id = $1", [k.rapor]));
  await k.is(k.den, (db) => db.sorgu("UPDATE rapor SET durum = 'imzali' WHERE id = $1", [k.rapor]));
  const r = (await supa.sahip.query<{ durum: string; s: string }>(
    "SELECT r.durum, (SELECT count(*) FROM rapor_surumu s WHERE s.rapor_id = r.id)::text AS s FROM rapor r WHERE r.id = $1", [k.rapor])).rows[0];
  assert.deepEqual([r.durum, r.s], ["imzali", "0"], "imzasız rapor tamamlandı");
});

/* 2: göçler BOZULMAMIŞ — kümenin kendi veritabanı; bozulan sunucu kodu */
type Onaylar = typeof import("../../src/modules/onaylar/server/onaylar.ts");
test("sunucuda rapor_onayla denetimi kalkınca raporu yalnız gören firma yöneticisi onaylar", async () => {
  const m = await bozukModul<Onaylar>(ONAYLAR, `  if (!canDoEylem(kim, "rapor_onayla", kayit(r))) return { durum: "yetkisiz" };
  if (r.durum !== "onayda")`, `  if (r.durum !== "onayda")`);
  const s = kume.sahipIstemci(); await s.connect();
  const C = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-c', 'Deneme C', 'DC') RETURNING id").finally(() => s.end())).rows[0].id;
  const h = havuzKur(kume.uygulama);
  try {
    const k = await kur(h, C);
    const r = await k.is(k.yon, (db) => m.onayla(db, k.yon, k.rapor, 1));
    assert.equal(r.durum, "tamam", `firma yöneticisi onayladı: ${JSON.stringify(r)}`);
  } finally { await h.end(); }
});

test("sunucuda yönetici düzeyi denetimi kalkınca denetçi kendi raporunun onay ekranını açar (C5)", async () => {
  const m = await bozukModul<Onaylar>(ONAYLAR, "  if (!yoneticiMi(kim)) return null;", "");
  const s = kume.sahipIstemci(); await s.connect();
  const C = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-c2', 'Deneme C2', 'DE') RETURNING id").finally(() => s.end())).rows[0].id;
  const h = havuzKur(kume.uygulama);
  try {
    const k = await kur(h, C);
    const v = await k.is(k.den, (db) => m.onayEkrani(db, k.den, k.rapor));
    assert.ok(v, "denetçi onay ekranını açtı");
  } finally { await h.end(); }
});

test("0028'deki iptal kuralı kalkınca onaydan çıkan raporun imza isteği bekler kalır (eski PDF imzalanabilir)", async () => {
  const A3 = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a3', 'Deneme A3', 'DF') RETURNING id")).rows[0].id;
  const k = await kur(havuz, A3);
  await k.is(k.yon, (db) => db.sorgu("UPDATE rapor SET durum = 'onaylandi' WHERE id = $1", [k.rapor]));
  const uret = async () => new TextEncoder().encode("%PDF-1.4\n% deneme\n%%EOF\n");
  const h = await k.is(k.den, (db) => imzaHazirla(db, depo, k.den, A3, k.rapor, uret));
  assert.equal(h.durum, "tamam", JSON.stringify(h));
  await k.is(k.yon, (db) => db.sorgu("UPDATE rapor SET durum = 'onayda' WHERE id = $1", [k.rapor]));
  const d = (await supa.sahip.query<{ durum: string }>("SELECT durum FROM imza_istegi WHERE rapor_id = $1", [k.rapor])).rows.map((x) => x.durum);
  assert.deepEqual(d, ["bekliyor"], "onaydan çıkan raporun imza isteği iptal edilmedi");
});

test("0029'daki revizyon kuralı kalkınca raporun revizyonu elle değişir (kilidin koruduğu açık)", async () => {
  const A4 = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a4', 'Deneme A4', 'DG') RETURNING id")).rows[0].id;
  const k = await kur(havuz, A4);
  await k.is(k.den, (db) => db.sorgu("UPDATE rapor SET revizyon = 3 WHERE id = $1", [k.rapor]));
  const r = (await supa.sahip.query<{ revizyon: number }>("SELECT revizyon FROM rapor WHERE id = $1", [k.rapor])).rows[0];
  assert.equal(r.revizyon, 3, "revizyon elle değişti");
});

test("sunucuda rapor_revizeye_gonder denetimi kalkınca tamamlanan raporu yalnız gören firma yöneticisi revizeye gönderir", async () => {
  const m = await bozukModul<Onaylar>(ONAYLAR, `  if (!canDoEylem(kim, "rapor_revizeye_gonder", kayit(r))) return { durum: "yetkisiz" };
  const g = dogrula(RevizeGirdisi, girdi);`, "  const g = dogrula(RevizeGirdisi, girdi);");
  const s = kume.sahipIstemci(); await s.connect();
  const C = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-c3', 'Deneme C3', 'DH') RETURNING id").finally(() => s.end())).rows[0].id;
  const h = havuzKur(kume.uygulama);
  try {
    const k = await kur(h, C);
    /* tamamla: onay (veritabanı rol bilmez), imzasız PDF, imzalı PDF */
    await k.is(k.yon, (db) => db.sorgu("UPDATE rapor SET durum = 'onaylandi' WHERE id = $1", [k.rapor]));
    const pdf = new TextEncoder().encode("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n");
    assert.equal((await k.is(k.den, (db) => imzaHazirla(db, depo, k.den, C, k.rapor, async () => pdf))).durum, "tamam");
    const imzali = new Uint8Array(Buffer.concat([Buffer.from(pdf), Buffer.from("\n9 0 obj << /Type /Sig /ByteRange [0 1 2 3] /Contents <00> >> endobj\ntrailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n", "latin1")]));
    const surum = async () => (await k.is(k.den, (db) => db.sorgu<{ surum: number }>("SELECT surum FROM rapor WHERE id = $1", [k.rapor]))).rows[0].surum;
    const y = await k.is(k.den, async (db) => imzaliYukle(db, depo, k.den, C, k.rapor, await surum(), { ad: "imzali.pdf", bayt: imzali }));
    assert.equal(y.durum, "tamam", JSON.stringify(y));
    const r = await k.is(k.yon, async (db) => m.revizeyeGonder(db, k.yon, k.rapor, await surum(), { gerekce: "Ölçüm değerleri yanlış yazılmış" }));
    assert.equal(r.durum, "tamam", `firma yöneticisi revizeye gönderdi: ${JSON.stringify(r)}`);
  } finally { await h.end(); }
});

test("0028 / 0031'deki bekleyen istek kuralı kalkınca imzaya hiç hazırlanmamış PDF'le imzalı sürüm yazılır", async () => {
  const F = await yeniFirma("deneme-a5", "DI");
  const k = await kur(havuz, F);
  await k.is(k.yon, (db) => db.sorgu("UPDATE rapor SET durum = 'onaylandi' WHERE id = $1", [k.rapor]));
  const yukle = (modul: string, bayt: Uint8Array) => k.is(k.den, (db) => dosyaYukle(db, depo, { firmaId: F, modul, kayitId: k.rapor, ad: "x.pdf", bayt, izinli: ["pdf"], kim: "Deneme", yukleyen: k.den.id }));
  const pdf = new TextEncoder().encode("%PDF-1.4\n% hazırlanmamış\n%%EOF\n");
  const d1 = await yukle("rapor_pdf", pdf), d2 = await yukle("rapor_imzali", new Uint8Array(Buffer.concat([Buffer.from(pdf), Buffer.from("% imza\n")])));
  if (!d1.tamam || !d2.tamam) throw new Error(JSON.stringify([d1, d2]));
  const sha = (await supa.sahip.query<{ sha256: string }>("SELECT sha256 FROM dosya WHERE id = $1", [d2.id])).rows[0].sha256;
  await k.is(k.den, (db) => db.sorgu(`INSERT INTO rapor_surumu (rapor_id, no, imzasiz_dosya, imzali_dosya, imzali_sha256, imza_yontem, kunye, personel, icerik)
    VALUES ($1, 'x', $2, $3, $4, 'dosya', '{}', '{}', '{}')`, [k.rapor, d1.id, d2.id, sha]));
  const n = (await supa.sahip.query<{ n: number }>("SELECT count(*)::int AS n FROM rapor_surumu WHERE rapor_id = $1", [k.rapor])).rows[0].n;
  assert.equal(n, 1, "hazırlanmamış PDF'le imzalı sürüm yazıldı");
});

test("0031'deki ileri tarih kuralı kalkınca imza gününden ileri tarihli rapor imzalanır", async () => {
  const F = await yeniFirma("deneme-a6", "DJ");
  const k = await kur(havuz, F);
  /* ileri tarih taslakken yazılır (bozuk veritabanında gerekçe kuralı da sökük) */
  await k.is(k.yon, (db) => db.sorgu("UPDATE rapor SET durum = 'taslak' WHERE id = $1", [k.rapor]));
  await k.is(k.den, (db) => db.sorgu("UPDATE rapor SET rapor_tarihi = (now() AT TIME ZONE 'Europe/Istanbul')::date + 30 WHERE id = $1", [k.rapor]));
  await k.is(k.yon, (db) => db.sorgu("UPDATE rapor SET durum = 'onaylandi' WHERE id = $1", [k.rapor]));
  await imzalaTam(k, F, k.rapor);
  const r = (await supa.sahip.query<{ ileri: boolean }>(
    "SELECT kontrol_tarihi > (now() AT TIME ZONE 'Europe/Istanbul')::date AS ileri FROM rapor_surumu WHERE rapor_id = $1", [k.rapor])).rows[0];
  assert.equal(r.ileri, true, "ileri tarihli rapor imzalandı");
});

test("0031'deki eskimiş sürüm kuralı kalkınca revizyonla düzeltilen yanlış tarih başka raporun kusurunu giderilmiş doğurur", async () => {
  const F = await yeniFirma("deneme-a7", "DK");
  const k = await kur(havuz, F);
  const tarihle = async (rapor: string, tarih: string) => {
    await k.is(k.den, (db) => db.sorgu("UPDATE rapor SET rapor_tarihi = $2 WHERE id = $1", [rapor, tarih]));
    await k.is(k.yon, (db) => db.sorgu("UPDATE rapor SET durum = 'onaylandi' WHERE id = $1", [rapor]));
    await imzalaTam(k, F, rapor);
  };
  /* X: yanlış tarihle (06-01) imzalanır, revizyonla düzeltilir (02-15) */
  await k.is(k.yon, (db) => db.sorgu("UPDATE rapor SET durum = 'taslak' WHERE id = $1", [k.rapor]));
  await tarihle(k.rapor, "2026-06-01");
  await k.is(k.yon, (db) => db.sorgu("UPDATE rapor SET durum = 'taslak', revizyon = revizyon + 1 WHERE id = $1", [k.rapor]));
  await tarihle(k.rapor, "2026-02-15");
  /* Y: aynı ekipman, ayrı plan, 03-01, kusurlu */
  const p = await k.is(k.plan, (db) => planAc(db, depo, k.plan, F, { tesis: k.tesis, baslangic: bugunTr(), bitis: bugunTr(), ekip: [{ personel: k.per }] }));
  assert.ok(p.durum === "tamam", JSON.stringify(p));
  const ps = (await k.is(k.den, (db) => db.sorgu<{ surum: number }>("SELECT surum FROM plan WHERE id = $1", [p.id]))).rows[0].surum;
  assert.equal((await k.is(k.den, (db) => planKabul(db, k.den, p.id, ps, true))).durum, "tamam");
  const y = await k.is(k.den, (db) => raporOlustur(db, k.den, p.id, k.ekipman));
  assert.ok(y.durum === "tamam", JSON.stringify(y));
  await k.is(k.den, (db) => db.sorgu(`UPDATE rapor SET cevaplar = jsonb_set(cevaplar, '{madde,k1}', '{"c": "Uygun değil", "not": "Korozyon"}'::jsonb),
    sonuc = 'uygun_degil' WHERE id = $1`, [y.id]));
  await tarihle(y.id, "2026-03-01");
  const u = (await supa.sahip.query<{ kapanis: string | null }>("SELECT kapanis FROM uygunsuzluk WHERE rapor_id = $1", [y.id])).rows;
  assert.ok(u.length >= 1 && u.every((z) => z.kapanis === "giderildi"), `eskimiş sürümün tarihi kusuru kapattı: ${JSON.stringify(u)}`);
});
