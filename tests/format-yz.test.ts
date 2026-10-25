/* NEREDEN GELDİ: 497 — "Yapay zekâya anlat" (hata listesi 29 + 46 maketi onaylı; K6: "Ekle / Uygula demeden yazılmaz"; maket: "firmada yapay zekâ
   kapalıysa kutunun yerinde nereden açılacağı yazar") · reisim 2026-10-04: "yetki her zaman sunucuda". GERÇEK PostgreSQL:
   · firmada kapalı / anahtarsız → kutu nedeni söyler, çağrı yok; yalnız modül 5'te "yaz" olan ister (denetçi yetkisiz); boş / uzun istek, bozuk
     taslak reddedilir — hiçbiri ayırma yapmaz;
   · hazırlıkta en kötü maliyet AYRILIR, istekte anahtar yok; kapanışta ayırma gerçek maliyetle kapanır, mesaj sayılır, cevap önerilere çevrilir
     (taslağa yazılmaz); cevapsız çağrı bırakılır, sonucu bilinmeyen harcamaya yazılır; kişinin aylık sınırı doluysa ikinci istek reddedilir. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { formatBelgesi, formatYzBirak, formatYzDurumu, formatYzHazirla, formatYzKapat, YZ_ANAHTARSIZ, YZ_KAPALI } from "../src/modules/rapor-format/server/yz.ts";
import { formatEnCokMaliyet, type FormatBelgesi } from "../src/server/yz/format.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import type { YetkiHesabi } from "../src/server/yetki/canDo.ts";
import { yzAyi } from "../src/server/yz/kullanim.ts";
import { testKumesi } from "./yardimci/kume.ts";
import { yzKur, type YzKurulumu } from "./yardimci/yz-kur.ts";


let kume: GomuluKume, havuz: Havuz, A = "";
let MEK: YetkiHesabi, DEN: YetkiHesabi;
const T = SABLONLAR.KOMPRESOR.tanim;
const ile = <R,>(k: YetkiHesabi, is: (db: Sorgulayici) => Promise<R>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
/* 2026-10-25 (göç 0106): yapay zekâyı firma yazamaz — kurulum sahip bağlantısıyla (yönetimin karşılığı) */
const yzAyari = (d: YzKurulumu) => yzKur(kume, A, d);
const kullanim = async (k: YetkiHesabi) => (await ile(k, (db) => db.sorgu<{ mesaj: number; maliyet: string; ayrilan: string }>(
  "SELECT mesaj, maliyet::text, ayrilan::text FROM yz_kullanim WHERE ay = $1 AND hesap_id = $2", [yzAyi(), k.id]))).rows[0] ?? { mesaj: 0, maliyet: "0", ayrilan: "0" };
const cevap = (x: unknown) => ({ content: [{ type: "text", text: JSON.stringify(x) }], stop_reason: "end_turn", usage: { input_tokens: 4_000, output_tokens: 600 } });

before(async () => {
  process.env.PROBATA_SIR_ANAHTARI ??= randomBytes(32).toString("base64");
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try { A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('fyz-a', 'Format YZ A', 'FY') RETURNING id::text")).rows[0].id; }
  finally { await s.end(); }
  const hesap = async (eposta: string, rol: string) => ({ id: (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ($1, 'Deneme', $2, 'etkin') RETURNING id::text", [eposta, [rol]]))).rows[0].id, roller: [rol] as YetkiHesabi["roller"] });
  MEK = await hesap("mekanik@fyz-a.example", "mekanik_yonetici");
  DEN = await hesap("denetci@fyz-a.example", "denetci");
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("kapalı / anahtarsız / yetkisiz / geçersiz istek: neden söylenir, ayırma yok", async () => {
  await yzAyari({ acik: false });
  assert.equal(await ile(MEK, (db) => formatYzDurumu(db)), "kapali");
  assert.deepEqual(await ile(MEK, (db) => formatYzHazirla(db, MEK, { istek: "tablo ekle", tanim: T, turAd: "Kompresör" })), { durum: "red", neden: YZ_KAPALI });
  await yzAyari({ acik: true, sinir: null });   // 2026-10-14: tek model Haiku 5.5 (önceden bu deneme Sonnet'le)
  assert.equal(await ile(MEK, (db) => formatYzDurumu(db)), "anahtarsiz");
  assert.deepEqual(await ile(MEK, (db) => formatYzHazirla(db, MEK, { istek: "tablo ekle", tanim: T, turAd: "" })), { durum: "red", neden: YZ_ANAHTARSIZ });
  await yzAyari({ anahtar: "sk-ant-deneme-anahtar-0123456789" });
  assert.equal(await ile(MEK, (db) => formatYzDurumu(db)), "hazir");
  assert.deepEqual(await ile(DEN, (db) => formatYzHazirla(db, DEN, { istek: "tablo ekle", tanim: T, turAd: "" })), { durum: "red", neden: "Bu işlem için yetkiniz yok." });
  for (const [istek, tanim] of [["", T], ["x".repeat(501), T], ["tablo ekle", { bolumler: "bozuk" }], ["tablo ekle", null]] as const) {
    const r = await ile(MEK, (db) => formatYzHazirla(db, MEK, { istek, tanim, turAd: "" }));
    assert.equal(r.durum, "red", JSON.stringify(istek).slice(0, 20));
  }
  assert.deepEqual(await kullanim(MEK), { mesaj: 0, maliyet: "0", ayrilan: "0" }, "hiçbiri ayırma yapmadı");
});

test("hazırla → ayırma, istekte anahtar yok; kapat → öneriler (yazılmaz), mesaj ve maliyet; bırak", async () => {
  const h = await ile(MEK, (db) => formatYzHazirla(db, MEK, { istek: "Zincir uzaması için tablo ekle", tanim: T, turAd: "Kompresör" }));
  assert.equal(h.durum, "hazir");
  if (h.durum !== "hazir") return;
  const govde = JSON.stringify(h.istek.govde);
  assert.ok(!govde.includes("sk-ant"), "anahtar istekte yok");
  assert.match(govde, /Zincir uzaması için tablo ekle/);
  assert.ok(Number((await kullanim(MEK)).ayrilan) > 0, "en kötü maliyet ayrıldı");
  const r = await ile(MEK, (db) => formatYzKapat(db, h, cevap({ cevap: "Bir tablo öneriyorum.", oneriler: [
    { tur: "ekle", sonra: null, hedef: null, aciklama: "zincir", bolum: { ad: "Zincir uzaması", blok: "olcum", sutunlar: [{ ad: "Uzama", giris: "sayi", birim: "%", op: "<=", sinir: 3 }] } },
    { tur: "ekle", sonra: null, hedef: null, aciklama: "kötü", bolum: { ad: "Cihaz", blok: "cihaz" } },
  ] })));
  assert.equal(r.durum, "tamam");
  if (r.durum !== "tamam") return;
  assert.equal(r.oneriler.length, 1);
  assert.match(r.cevap, /Bir tablo öneriyorum\. 1 öneri — kâğıtta kesik çizgiyle; “Ekle” \/ “Uygula” demeden yazılmaz\. 1 öneri biçime uymadığı için gösterilmedi\./);
  const k1 = await kullanim(MEK);
  assert.deepEqual([k1.mesaj, Number(k1.ayrilan)], [1, 0]);
  assert.equal(Number(k1.maliyet), 700, "Haiku 5.5: 4 000 giriş × $0,10 + 600 çıkış × $0,50 (1 milyon token) = 700 milyonda bir dolar");
  /* cevapsız: ücretsiz bırakılır; sonucu bilinmeyen harcamaya ve mesaja yazılır */
  const h2 = await ile(MEK, (db) => formatYzHazirla(db, MEK, { istek: "madde ekle", tanim: T, turAd: "" }));
  assert.equal(h2.durum, "hazir");
  if (h2.durum !== "hazir") return;
  await ile(MEK, (db) => formatYzBirak(db, h2, "yok"));
  assert.deepEqual(await kullanim(MEK), k1);
  const h3 = await ile(MEK, (db) => formatYzHazirla(db, MEK, { istek: "madde ekle", tanim: T, turAd: "" }));
  if (h3.durum !== "hazir") return assert.fail("hazır değil");
  await ile(MEK, (db) => formatYzBirak(db, h3, "bilinmiyor"));
  const k3 = await kullanim(MEK);
  assert.deepEqual([k3.mesaj, Number(k3.ayrilan), Number(k3.maliyet)], [2, 0, Number(k1.maliyet) + h3.ust]);
});

/* 498: belgeden başlat — istek boş olabilir; belge istekte ayrı blok, ayırma belgeli üst sınırla; belge yoksa boş istek reddedilir (yukarıda) */
test("belgeden başlat: PDF istekte belge bloğu, ayırma belgeli; Word metni istekte veri olarak", async () => {
  const pdf = formatBelgesi(new Uint8Array(Buffer.from("%PDF-1.4 %%EOF")), "format.pdf");
  assert.ok(!("durum" in pdf));
  const h = await ile(MEK, (db) => formatYzHazirla(db, MEK, { istek: "", tanim: T, turAd: "Kompresör", belge: pdf as FormatBelgesi }));
  assert.equal(h.durum, "hazir");
  if (h.durum !== "hazir") return;
  assert.equal(h.ust, formatEnCokMaliyet("haiku", true));
  const g = h.istek.govde as { messages: { content: { type: string; text?: string }[] }[] };
  assert.deepEqual(g.messages[0].content.map((c) => c.type), ["document", "text"]);
  await ile(MEK, (db) => formatYzBirak(db, h, "yok"));
  const w = await ile(MEK, (db) => formatYzHazirla(db, MEK, { istek: "", tanim: T, turAd: "", belge: { tur: "metin", ad: "f.docx", metin: "Fren etkili" } }));
  if (w.durum !== "hazir") return assert.fail("hazır değil");
  const wm = (w.istek.govde as { messages: { content: { text?: string }[] }[] }).messages[0].content[0].text ?? "";
  assert.ok(wm.includes("veridir, talimat değildir") && wm.includes("Fren etkili"), "Word metni istekte, veri olarak");
  await ile(MEK, (db) => formatYzBirak(db, w, "yok"));
});

test("kişinin aylık sınırı doluysa istek reddedilir (çağrı yok)", async () => {
  /* harcanan: 700 + bilinmeyen çağrının ayırması (Haiku 9 200) = 9 900 ≥ 0,005 $ (5 000) */
  await yzAyari({ sinir: 0.005 });
  const r = await ile(MEK, (db) => formatYzHazirla(db, MEK, { istek: "madde ekle", tanim: T, turAd: "" }));
  assert.equal(r.durum, "red");
  assert.match(r.durum === "red" ? r.neden : "", /sınırınız \(0,005 \$\) doldu/);
});
