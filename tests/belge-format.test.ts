/* NEREDEN GELDİ: 2026-10-25 (belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca bağlamalıyız") — rapor
   şablonunun aracı programın bütün belgelerine bağlandı; kayıt göç 0104 belge_format (rapor_format'ın aynısı, tür yerine belge): taslak → yayında →
   eski, belge başına tek taslak ve tek yayın, yayınlanan değişmez, yayın damgası veritabanından; temele dön (yayında sürüm yok → temel format).
   Yetki rapor formatıyla aynı (modül 5: "gör" görür, "yaz" değiştirir; muhasebe görmez) · reisim 2026-10-04: "yetki her zaman sunucuda; istemciden
   gelen kimlik ve sürüm yetki vermez". GERÇEK PostgreSQL, iki firma. Saf parçalar: tests/belge-format-saf.test.ts. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { BELGE_TURLERI } from "../src/belge/katalog.ts";
import type { FormatTanimi } from "../src/format/tanim.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import {
  belgeFormatiOku, belgeFormatlari, belgeTaslakAc, belgeTaslakKaydet, belgeTaslakYaz, belgeTemeleDon, belgeYayinla, yayindakiBelgeFormati,
} from "../src/modules/rapor-format/server/belgeler.ts";
import type { Kisi } from "../src/modules/rapor-format/server/formatlar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let MEK: Kisi, DENETCI: Kisi, MUH: Kisi, MEK_B: Kisi;
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };

async function hesapli(firma: string, eposta: string, rol: string) {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ($1, 'Deneme', $2, 'etkin') RETURNING id::text", [eposta, [rol]]))).rows[0].id;
}
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const b = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, B, is, { hesapId: k.id });
const oku = async (k: Kisi, id: string) => (await a(k, (db) => belgeFormatiOku(db, k, id)))!;
/** taslağın ilk tablosunun ilk hücresinin yazısını değiştirilmiş kopyası */
function degistir(t: FormatTanimi, m: string): FormatTanimi {
  const y = structuredClone(t);
  const tb = y.bolumler[0];
  if (tb.blok === "tablo") tb.hucreler[0] = { ...tb.hucreler[0], tur: "yazi", m };
  return y;
}
const ilkYazi = (t: FormatTanimi | null) => { const tb = t?.bolumler[0]; return tb?.blok === "tablo" ? tb.hucreler[0].m : undefined; };

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('belge-a', 'Deneme A', 'BA'), ('belge-b', 'Deneme B', 'BB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  MEK = kisi(await hesapli(A, "mekanik@belge-a.example", "mekanik_yonetici"), "mekanik_yonetici");
  DENETCI = kisi(await hesapli(A, "denetci@belge-a.example", "denetci"), "denetci");
  MUH = kisi(await hesapli(A, "muhasebe@belge-a.example", "muhasebe"), "muhasebe");
  MEK_B = kisi(await hesapli(B, "mekanik@belge-b.example", "mekanik_yonetici"), "mekanik_yonetici");
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("taslak aç → kaydet → yayınla → ikinci yayın eskiyi düşürür → temele dön (temel format); sıra hep ileri", async () => {
  const bas = (await a(MEK, (db) => belgeFormatlari(db, MEK)))!;
  assert.deepEqual(bas.map((x) => x.belge), [...BELGE_TURLERI], "katalog sırasıyla her belge");
  assert.ok(bas.every((x) => x.yayinda === null && x.taslak === null && x.ad.length > 0));
  assert.equal(await a(MEK, (db) => yayindakiBelgeFormati(db, "zimmet")), null, "yayında format yok → temel format");
  assert.deepEqual(await a(MEK, (db) => belgeTaslakAc(db, MEK, "zimmet", "yayindaki", null)), { durum: "yok" }, "yayında sürüm yokken kopyası açılmaz");

  /* boş taslak: serbest düzende tek tablo */
  const t = tamam(await a(MEK, (db) => belgeTaslakAc(db, MEK, "zimmet", "bos", null)));
  const o = await oku(MEK, t.id);
  assert.deepEqual([o.belge, o.durum, o.tanim.gorunum.serbest, o.tanim.bolumler.map((x) => x.blok)], ["zimmet", "taslak", true, ["tablo"]]);
  /* ikinci taslak açılmaz: görmeden (null) ya da eski sürümle çakışma; gördüğü sürümle yerine geçer */
  assert.deepEqual(await a(MEK, (db) => belgeTaslakAc(db, MEK, "zimmet", "bos", null)), { durum: "cakisma" });
  assert.deepEqual(await a(MEK, (db) => belgeTaslakAc(db, MEK, "zimmet", "bos", t.surum + 5)), { durum: "cakisma" });
  assert.equal(tamam(await a(MEK, (db) => belgeTaslakAc(db, MEK, "zimmet", "bos", t.surum))).id, t.id, "aynı taslak satırı");

  /* kaydet: bozuk tanım yazılmaz; serbest bayrağı kaldırılsa da serbest kalır; eski sürümle yazma çakışma */
  const o2 = await oku(MEK, t.id);
  for (const x of [null, "<script>", { ...o2.tanim, sema: 2 }, { ...o2.tanim, bolumler: [{ id: "x", ad: "X", blok: "betik" }] }]) {
    assert.equal((await a(MEK, (db) => belgeTaslakKaydet(db, MEK, t.id, o2.surum, x))).durum, "gecersiz", JSON.stringify(x).slice(0, 60));
  }
  const yeni = degistir(o2.tanim, "ZİMMET TESLİM FORMU");
  const k = tamam(await a(MEK, (db) => belgeTaslakKaydet(db, MEK, t.id, o2.surum, { ...yeni, gorunum: { ...yeni.gorunum, serbest: false } })));
  const o3 = await oku(MEK, t.id);
  assert.equal(ilkYazi(o3.tanim), "ZİMMET TESLİM FORMU");
  assert.equal(o3.tanim.gorunum.serbest, true, "belge formatı serbest düzende");
  assert.deepEqual(await a(MEK, (db) => belgeTaslakKaydet(db, MEK, t.id, o2.surum, yeni)), { durum: "cakisma" });
  const iz = (await a(MEK, (db) => db.sorgu<{ yeni: Record<string, unknown> }>(
    "SELECT yeni FROM denetim_izi WHERE nesne = 'belge_format' AND nesne_id = $1 AND ne = 'belge_format.taslak_kaydet'", [t.id]))).rows;
  assert.deepEqual(iz.map((x) => x.yeni.tanim), ["gizli"], "tanımın değeri ize yazılmaz");

  /* yayınla: sıra 1, yayınlayan hesap veritabanından; eski sürümle yayın çakışma */
  assert.deepEqual(await a(MEK, (db) => belgeYayinla(db, MEK, t.id, o2.surum, "")), { durum: "cakisma" });
  assert.deepEqual(await a(MEK, (db) => belgeYayinla(db, MEK, t.id, k.surum, "x".repeat(201))), { durum: "gecersiz", hatalar: { notu: "En çok 200 karakter." } });
  assert.deepEqual(await a(MEK, (db) => belgeYayinla(db, MEK, t.id, k.surum, "ilk sürüm")), { durum: "tamam", sira: 1 });
  assert.equal(ilkYazi(await a(MEK, (db) => yayindakiBelgeFormati(db, "zimmet"))), "ZİMMET TESLİM FORMU");
  const damga = (await a(MEK, (db) => db.sorgu<{ yayinlayan_id: string; yayin: Date | null; notu: string }>(
    "SELECT yayinlayan_id::text, yayin, notu FROM belge_format WHERE id = $1", [t.id]))).rows[0];
  assert.deepEqual([damga.yayinlayan_id, !!damga.yayin, damga.notu], [MEK.id, true, "ilk sürüm"]);
  const l1 = (await a(MEK, (db) => belgeFormatlari(db, MEK)))!.find((x) => x.belge === "zimmet")!;
  assert.deepEqual([l1.yayinda?.id, l1.yayinda?.sira, l1.taslak], [t.id, 1, null]);
  assert.equal(await a(MEK, (db) => yayindakiBelgeFormati(db, "arac")), null, "öteki belgeler etkilenmez");

  /* yayındakinin kopyasıyla ikinci sürüm: yayındaki eskiye düşer */
  const t2 = tamam(await a(MEK, (db) => belgeTaslakAc(db, MEK, "zimmet", "yayindaki", null)));
  assert.notEqual(t2.id, t.id);
  assert.equal(ilkYazi((await oku(MEK, t2.id)).tanim), "ZİMMET TESLİM FORMU", "yayındakinin kopyası");
  const tanim2 = degistir((await oku(MEK, t2.id)).tanim, "İKİNCİ");
  const k2 = tamam(await a(MEK, (db) => belgeTaslakKaydet(db, MEK, t2.id, t2.surum, tanim2)));
  assert.deepEqual(await a(MEK, (db) => belgeYayinla(db, MEK, t2.id, k2.surum, "")), { durum: "tamam", sira: 2 });
  assert.equal((await oku(MEK, t.id)).durum, "eski");
  assert.equal(ilkYazi(await a(MEK, (db) => yayindakiBelgeFormati(db, "zimmet"))), "İKİNCİ");
  assert.equal((await a(MEK, (db) => db.sorgu("SELECT 1 FROM belge_format WHERE belge = 'zimmet' AND durum = 'yayinda'"))).rowCount, 1, "tek yayın");

  /* temele dön: yayındaki eskiye düşer, yayında format kalmaz; ikinci kez "yok"; sonraki yayın sırayı sürdürür */
  assert.deepEqual(await a(MEK, (db) => belgeTemeleDon(db, MEK, "zimmet")), { durum: "tamam" });
  assert.equal(await a(MEK, (db) => yayindakiBelgeFormati(db, "zimmet")), null, "temel formata döndü");
  assert.equal((await oku(MEK, t2.id)).durum, "eski");
  assert.deepEqual(await a(MEK, (db) => belgeTemeleDon(db, MEK, "zimmet")), { durum: "yok" });
  const t3 = tamam(await a(MEK, (db) => belgeTaslakAc(db, MEK, "zimmet", "bos", null)));
  assert.deepEqual(await a(MEK, (db) => belgeYayinla(db, MEK, t3.id, t3.surum, "")), { durum: "tamam", sira: 3 });
});

test("basılı formdan taslak (belgeTaslakYaz): şemadan geçmeyen yazılmaz, geçen serbest düzende taslak olur; taslak varken gördüğü sürümle", async () => {
  const t = tamam(await a(MEK, (db) => belgeTaslakAc(db, MEK, "teklif", "bos", null)));
  const tanim = (await oku(MEK, t.id)).tanim;
  assert.equal((await a(MEK, (db) => belgeTaslakYaz(db, MEK, "teklif", { sema: 1, bolumler: "yok" }, "basılı form", t.surum))).durum, "gecersiz");
  assert.deepEqual(await a(MEK, (db) => belgeTaslakYaz(db, MEK, "teklif", tanim, "basılı form", null)), { durum: "cakisma" }, "görmediği taslağı ezmez");
  const y = tamam(await a(MEK, (db) => belgeTaslakYaz(db, MEK, "teklif", degistir({ ...tanim, gorunum: { ...tanim.gorunum, serbest: false } }, "TEKLİF"), "basılı form", t.surum)));
  assert.equal(y.id, t.id);
  const o = await oku(MEK, t.id);
  assert.deepEqual([ilkYazi(o.tanim), o.tanim.gorunum.serbest], ["TEKLİF", true]);
  const iz = (await a(MEK, (db) => db.sorgu<{ gerekce: string }>(
    "SELECT gerekce FROM denetim_izi WHERE nesne = 'belge_format' AND nesne_id = $1 AND ne = 'belge_format.taslak' ORDER BY id DESC LIMIT 1", [t.id]))).rows[0];
  assert.equal(iz?.gerekce, "basılı form");
});

test("yayınlanan sürüm değişmez (tetik): içerik / sıra / belge değişmez, geri alınamaz, yayında doğmaz; tek taslak; bilinmeyen belge yok; silme hakkı yok", async () => {
  const t = tamam(await a(MEK, (db) => belgeTaslakAc(db, MEK, "fatura", "bos", null)));
  tamam(await a(MEK, (db) => belgeYayinla(db, MEK, t.id, t.surum, "")));
  const sorgu = (q: string, p: unknown[] = []) => a(MEK, (db) => db.sorgu(q, p));
  await assert.rejects(sorgu("UPDATE belge_format SET tanim = '{\"x\":1}'::jsonb WHERE id = $1", [t.id]), /değişmez/);
  await assert.rejects(sorgu("UPDATE belge_format SET sira = 9 WHERE id = $1", [t.id]), /değişmez/);
  await assert.rejects(sorgu("UPDATE belge_format SET belge = 'saha' WHERE id = $1", [t.id]), /belgesi değişmez/);
  await assert.rejects(sorgu("UPDATE belge_format SET durum = 'taslak', sira = NULL, yayin = NULL, yayinlayan = NULL WHERE id = $1", [t.id]), /geri alınamaz/);
  await assert.rejects(sorgu("UPDATE belge_format SET yayin = now() - interval '1 day' WHERE id = $1", [t.id]), /değişmez/);
  await assert.rejects(sorgu("INSERT INTO belge_format (belge, durum, sira, sema, tanim, olusturan, yayinlayan, yayin) VALUES ('saha', 'yayinda', 1, 1, '{}', 'x', 'x', now())"),
    /yalnız taslak/);
  await assert.rejects(sorgu("INSERT INTO belge_format (belge, sema, tanim, olusturan) VALUES ('rapor', 1, '{}', 'x')"), /belge_format_belge_check|check/i);
  await assert.rejects(sorgu("DELETE FROM belge_format WHERE id = $1", [t.id]), /permission denied|izin/i);
  assert.deepEqual(await a(MEK, (db) => belgeTaslakKaydet(db, MEK, t.id, 0, undefined)), { durum: "gecersiz", hatalar: { tanim: "Tanım okunamadı ya da çok büyük." } });
  const o = await oku(MEK, t.id);
  assert.deepEqual(await a(MEK, (db) => belgeTaslakKaydet(db, MEK, t.id, o.surum, o.tanim)), { durum: "kilitli" }, "yayınlanmış sürüm kurucudan da değişmez");
  /* taslak: yayına geçerken damga veritabanından (koddan verilen tarih yazılmaz); tek taslak dizini */
  const t2 = tamam(await a(MEK, (db) => belgeTaslakAc(db, MEK, "fatura", "yayindaki", null)));
  await assert.rejects(sorgu("INSERT INTO belge_format (belge, sema, tanim, olusturan) VALUES ('fatura', 1, '{}', 'x')"), /belge_format_tek_taslak|duplicate|yinelenen/i);
  await assert.rejects(sorgu("UPDATE belge_format SET durum = 'eski' WHERE id = $1", [t2.id]), /yayınlanmadan eski olamaz/);
  /* bilinmeyen belge ve kimlik */
  for (const kotu of ["rapor", "__proto__", "", "ZIMMET"]) {
    assert.deepEqual(await a(MEK, (db) => belgeTaslakAc(db, MEK, kotu, "bos", null)), { durum: "yok" }, kotu);
    assert.deepEqual(await a(MEK, (db) => belgeTemeleDon(db, MEK, kotu)), { durum: "yok" }, kotu);
  }
  assert.deepEqual(await a(MEK, (db) => belgeTaslakAc(db, MEK, "fatura", "sablon:ZPKR01", t2.surum)), { durum: "gecersiz", hatalar: { baslangic: "Başlangıç seçilmeli." } });
  assert.deepEqual(await a(MEK, (db) => belgeYayinla(db, MEK, "bir-kimlik", 0, "")), { durum: "yok" });
  assert.equal(await a(MEK, (db) => belgeFormatiOku(db, MEK, "' OR 1=1 --")), null);
});

test("kiracı izolasyonu: başka firmanın belge formatı görünmez, yayındaki de; başka firmaya satır yazılamaz", async () => {
  const t = tamam(await a(MEK, (db) => belgeTaslakAc(db, MEK, "saha", "bos", null)));
  tamam(await a(MEK, (db) => belgeYayinla(db, MEK, t.id, t.surum, "")));
  const lb = (await b(MEK_B, (db) => belgeFormatlari(db, MEK_B)))!;
  assert.ok(lb.every((x) => x.yayinda === null && x.taslak === null), "B firması A'nın sürümlerini görmez");
  assert.equal(await b(MEK_B, (db) => belgeFormatiOku(db, MEK_B, t.id)), null);
  assert.equal(await b(MEK_B, (db) => yayindakiBelgeFormati(db, "saha")), null, "B'nin belgesi temel formatla çizilir");
  assert.equal((await b(MEK_B, (db) => db.sorgu("SELECT 1 FROM belge_format"))).rowCount, 0, "RLS");
  assert.deepEqual(await b(MEK_B, (db) => belgeTaslakKaydet(db, MEK_B, t.id, 0, {})), { durum: "yok" });
  assert.deepEqual(await b(MEK_B, (db) => belgeYayinla(db, MEK_B, t.id, 0, "")), { durum: "yok" });
  await assert.rejects(b(MEK_B, (db) => db.sorgu("INSERT INTO belge_format (firma_id, belge, sema, tanim, olusturan) VALUES ($1, 'saha', 1, '{}', 'x')", [A])),
    /row-level security|satır düzeyi/i);
  /* B kendi taslağını açar; A'nınki etkilenmez */
  tamam(await b(MEK_B, (db) => belgeTaslakAc(db, MEK_B, "saha", "bos", null)));
  assert.equal((await a(MEK, (db) => db.sorgu("SELECT 1 FROM belge_format WHERE belge = 'saha'"))).rowCount, 1);
});

test("yetki: denetçi görür ama değiştiremez; muhasebe görmez; yetkisiz yazamaz (istemcinin kimliği / sürümü yetki vermez)", async () => {
  const t = tamam(await a(MEK, (db) => belgeTaslakAc(db, MEK, "egitim", "bos", null)));
  const o = await oku(MEK, t.id);
  assert.ok(await a(DENETCI, (db) => belgeFormatlari(db, DENETCI)), "denetçi listeyi görür");
  assert.equal((await oku(DENETCI, t.id)).durum, "taslak", "denetçi tanımı görür");
  assert.equal(await a(MUH, (db) => belgeFormatlari(db, MUH)), null);
  assert.equal(await a(MUH, (db) => belgeFormatiOku(db, MUH, t.id)), null);
  for (const k of [DENETCI, MUH]) {
    assert.deepEqual(await a(k, (db) => belgeTaslakAc(db, k, "egitim", "bos", o.surum)), { durum: "yetkisiz" });
    assert.deepEqual(await a(k, (db) => belgeTaslakYaz(db, k, "egitim", o.tanim, "basılı form", o.surum)), { durum: "yetkisiz" });
    assert.deepEqual(await a(k, (db) => belgeTaslakKaydet(db, k, t.id, o.surum, o.tanim)), { durum: "yetkisiz" });
    assert.deepEqual(await a(k, (db) => belgeYayinla(db, k, t.id, o.surum, "")), { durum: "yetkisiz" });
    assert.deepEqual(await a(k, (db) => belgeTemeleDon(db, k, "egitim")), { durum: "yetkisiz" });
  }
  assert.equal((await oku(MEK, t.id)).surum, o.surum, "yetkisiz denemeler hiçbir şey yazmadı");
});
