/* OLUMSUZ KANIT — tests/onaylar.test.ts neyi koruyor (314). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler / modül dosyası geçici klasöre
   kopyalanır, bellekte bozulur, kopyadan koşulur.
   1. Sunucuda rapor_onayla denetimi olmasaydı raporu gören ama onay yetkisi olmayan firma yöneticisi (Onaylar "gör") raporu onaylardı.
   2. 0026'daki gerekçe kuralı olmasaydı rapor gerekçesiz Yeni'ye döner, denetçi neyi düzelteceğini bilmezdi (sunucu dışından yazılan durum). */
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
import { raporOlustur } from "../../src/modules/raporlar/server/raporlar.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const GEREKCE = `    IF NEW.durum = 'taslak' AND length(btrim(coalesce(current_setting('app.gerekce', true), ''))) < 10 THEN
      RAISE EXCEPTION 'denetçiye dönen raporda gerekçe en az 10 karakter' USING ERRCODE = '23514';
    END IF;
`;
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
  return { den, yon, rapor: r.id, is };
}

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0026_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(GEREKCE), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(GEREKCE, ""));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
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
