/* NEREDEN GELDİ: 2026-11-05 — reisim: "müşterilerin yaptırdığı işlere göre sürekli kendini eğitme sistemi", "geri planda çalışsın ve kullanıcının tokeninden
   yemesin"; sunum 7UcQ3N2BJRQkLHq4Whad16 kabul (göç 0121). Bu kilit (GERÇEK PostgreSQL) tutar:
   · iş özeti kişinin kendi adına yazılır; aynı iş ikinci kez yazılmaz; uygulama rolü özetin içeriğini OKUYAMAZ, puanı yazamaz;
   · gece (kişi bağlamı yok) puanlar: düzeltmesiz raporsuz iş bir gün sonra iyi, hata şüpheli, sonraki istek düzeltme → önceki iş kötü; maliyet say_istek'ten;
   · hafıza: iyi işten örnek — adlar ve numaralar gizli; başka firma görmez; ham kayıt silinse de örnek kalır (K3); 12 ayı geçen ham kayıt silinir;
   · konuşmanın BAŞINDA hafıza notu S.A.Y'a gider. Uydurma veri. Saf kısım: tests/say-ogrenme-saf.test.ts. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { soruyuEkle } from "../src/modules/say/server/say.ts";
import type { Kisi } from "../src/modules/planlar/server/planlar.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { konusmaOku } from "../src/server/yz/konusma.ts";
import { istekOlcumuYaz } from "../src/server/yz/olcum.ts";
import { hafizaNotu, isKaydiYaz, ogrenGece, type IsOzeti } from "../src/server/yz/ogrenme.ts";
import { testKumesi } from "./yardimci/kume.ts";
import { yzKur } from "./yardimci/yz-kur.ts";

let kume: GomuluKume, havuz: Havuz, A = "", B = "";
let DA: Kisi, DB: Kisi;
const ile = <T,>(firma: string, k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
const sahip = async <T,>(is: (s: ReturnType<GomuluKume["sahipIstemci"]>) => Promise<T>) => {
  const s = kume.sahipIstemci(); await s.connect();
  try { return await is(s); } finally { await s.end(); }
};
async function kur(firma: string, ek: string): Promise<Kisi> {
  return kiraciIcinde(havuz, firma, async (db) => {
    await db.sorgu("INSERT INTO musteri (unvan, kisa, eposta, tel) VALUES ('Gizli Sanayi A.Ş.', 'Gizli', $1, '0312 000 00 00')", [`iletisim@${ek}.example`]);
    const id = (await db.sorgu<{ id: string }>("INSERT INTO hesap (eposta, ad, roller, durum) VALUES ($1, 'Deneme Kişi', $2, 'etkin') RETURNING id::text",
      [`den@${ek}.example`, ["denetci"]])).rows[0]!.id;
    return { id, ad: "Deneme Kişi", roller: ["denetci"] } as Kisi;
  });
}
before(async () => {
  process.env.PROBATA_SIR_ANAHTARI ??= randomBytes(32).toString("base64");
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  [A, B] = await sahip(async (s) => (await s.query<{ id: string }>(
    "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('ogr-a', 'Öğr A', 'OA'), ('ogr-b', 'Öğr B', 'OB') RETURNING id::text")).rows.map((r) => r.id));
  DA = await kur(A, "ogr-a"); DB = await kur(B, "ogr-b");
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

const oz = (p: Partial<IsOzeti>): IsOzeti => ({ soru: "x", adimlar: [], raporlar: [], duzeltme: false, hata: 0, tur: "soru", ...p });
const puan = (is: string) => sahip(async (s) => (await s.query<{ puan: string | null; maliyet: string | null; istek: number | null }>(
  "SELECT puan, maliyet::text, istek FROM say_is WHERE is_id = $1", [is])).rows[0]);

test("özet kişinin adına; ikinci kez yazılmaz; uygulama içeriği okuyamaz, puan yazamaz", async () => {
  const is = randomUUID();
  await ile(A, DA, (db) => isKaydiYaz(db, is, oz({ soru: "ilk" })));
  await ile(A, DA, (db) => isKaydiYaz(db, is, oz({ soru: "ikinci" })));
  assert.deepEqual(await sahip(async (s) => (await s.query("SELECT soru, hesap_id::text AS h FROM say_is WHERE is_id = $1", [is])).rows), [{ soru: "ilk", h: DA.id }]);
  await assert.rejects(ile(A, DA, (db) => db.sorgu("SELECT soru FROM say_is")), /permission denied/);
  await assert.rejects(ile(A, DA, (db) => db.sorgu("UPDATE say_is SET puan = 'iyi'")), /permission denied/);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => isKaydiYaz(db, randomUUID(), oz({}))), /oturumdaki kişi|row-level|güvenlik/i);
});

test("gece: puan, maliyet, hafıza (gizli adlar); başka firma görmez; öğrenilen silinmez; 12 ay", async () => {
  const iyi = randomUUID(), hatali = randomUUID(), onceki = randomUUID(), duzelt = randomUUID();
  await ile(A, DA, async (db) => {
    await isKaydiYaz(db, iyi, oz({ soru: "Gizli Sanayi A.Ş. için teklif hazırla, vergi no 1234567890", adimlar: [{ ad: "teklif_kaydet" }, { ad: "teklif_kaydet" }], tur: "teklif_kaydet" }));
    await istekOlcumuYaz(db, { is: iyi, giris: 10, okunan: 0, yazilan: 0, cikis: 5, maliyet: 21_000, sureMs: 1000, yazma: 1, islem: 1, sablon: null, derinlik: "high" });
    await istekOlcumuYaz(db, { is: iyi, giris: 10, okunan: 0, yazilan: 0, cikis: 5, maliyet: 12_000, sureMs: 1000, yazma: 0, islem: 0, sablon: null, derinlik: "high" });
    await isKaydiYaz(db, hatali, oz({ adimlar: [{ ad: "plan_ac", hata: true }], hata: 1, tur: "plan_ac" }));
    await isKaydiYaz(db, onceki, oz({ soru: "müşteri ekle", adimlar: [{ ad: "musteri_kaydet" }], tur: "musteri_kaydet" }));
    await isKaydiYaz(db, duzelt, oz({ soru: "hayır yanlış oldu", duzeltme: true }));
  });
  /* işler günler önce (aralarında saatler); düzeltme yalnız "onceki"den 10 dk sonra */
  await sahip((s) => s.query(`UPDATE say_is SET zaman = now() - CASE is_id WHEN $1::uuid THEN interval '4 days' WHEN $2::uuid THEN interval '3 days'
    WHEN $3::uuid THEN interval '2 days' ELSE interval '2 days' - interval '10 minutes' END WHERE is_id = ANY (ARRAY[$1, $2, $3, $4]::uuid[])`,
    [iyi, hatali, onceki, duzelt]));
  const g = await kiraciIcinde(havuz, A, (db) => ogrenGece(db));
  assert.ok(g.puanlanan >= 4 && g.ornek >= 1, JSON.stringify(g));
  assert.deepEqual(await puan(iyi), { puan: "iyi", maliyet: "33000", istek: 2 });
  assert.equal((await puan(hatali))!.puan, "supheli");
  assert.equal((await puan(onceki))!.puan, "kotu", "sonraki istek düzeltme");
  await assert.rejects(ile(A, DA, (db) => ogrenGece(db)), /kişi bağlamı/, "gecenin işi kişi bağlamında koşmaz");
  const m = await ile(A, DA, (db) => hafizaNotu(db));
  assert.match(m ?? "", /^S\.A\.Y hafızası/); assert.match(m ?? "", /teklif_kaydet ×2/); assert.match(m ?? "", /"<ad> için teklif hazırla, vergi no <no>"/);
  assert.doesNotMatch(m ?? "", /Gizli Sanayi|1234567890/);
  assert.equal(await ile(B, DB, (db) => hafizaNotu(db)), null, "başka firmanın hafızası görünmez");
  /* K3: ham kayıt silinse de örnek kalır */
  await sahip((s) => s.query("DELETE FROM say_is WHERE firma_id = $1", [A]));
  await kiraciIcinde(havuz, A, (db) => ogrenGece(db));
  assert.match((await ile(A, DA, (db) => hafizaNotu(db))) ?? "", /teklif_kaydet ×2/, "öğrenilen silinmez");
  /* 12 ayı geçen ham kayıt silinir */
  const eski = randomUUID();
  await ile(A, DA, (db) => isKaydiYaz(db, eski, oz({})));
  await sahip((s) => s.query("UPDATE say_is SET zaman = now() - interval '400 days' WHERE is_id = $1", [eski]));
  await kiraciIcinde(havuz, A, (db) => ogrenGece(db));
  assert.equal(await puan(eski), undefined);
});

test("konuşmanın başında hafıza notu S.A.Y'a gider; sonraki soruda tekrar gitmez", async () => {
  await yzKur(kume, A, { acik: true, sinir: null, anahtar: "sk-ant-deneme-anahtar-0123456789" });
  const ekran = { yol: "/planlar", raporNo: null, canli: null, kurucu: null };
  const r = await ile(A, DA, (db) => soruyuEkle(db, DA, { metin: "forkliftleri yaz", ekler: [], ekran }));
  assert.equal(r.durum, "hazir", JSON.stringify(r));
  const notlar = (await ile(A, DA, (db) => konusmaOku(db))).filter((x) => x.rol === "system").map((x) => String(x.icerik));
  assert.equal(notlar.length, 1); assert.match(notlar[0]!, /^S\.A\.Y hafızası/);
});
