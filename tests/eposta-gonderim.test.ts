/* NEREDEN GELDİ: FIRMA-VT.md §5.8, FV11 (sunum 579 onaylı, 2026-10-15; K2 — reisim: "resend için tek seçenek var ve o da firmaların kendi mail adresleri
   ile mail atılması"; K3 — "resend ve supabase ayarları firma ayarları kısmından değiştirilemesin"). Kalem satırı: "kimden; K3 sunucuda ve veritabanında".
   GERÇEK PostgreSQL (tests/yardimci/coklu-vt.ts: merkez + ortak firma O, kendi projeli A ayrı kümede) + Resend taklidi (tests/yardimci/sahte-resend.ts).
   Kilitlenenler:
   · ekle: alan adı denetlenir; Resend'e BİR kez eklenir (yeniden eklemede adla / kayıtla bulunur — eklenip merkeze yazılamamış alan da); merkezde kayıt
     (DNS kayıtları, "bekliyor"), firma tarafında kilitli kopya ("doğrulanmadı"); bir alan adı tek firmanın;
   · doğrula: Resend doğrulamadıkça anahtar açılmaz; doğrulayınca gönderme anahtarı BİR kez açılır (alan adına bağlı), firmada şifreli sır + kopya
     "doğrulandı", sonra merkez "doğrulandı"; anahtarın değeri hiçbir ize, kayda, yanıta düşmez; firma tarafı düşerse merkez "doğrulandı" olmaz;
   · alan adı değişince firma tarafı hemen "doğrulanmadı" (eski alanla gönderilmez);
   · kendi projeli firmada firma tarafı FİRMANIN veritabanında (merkezde gönderim kopyası yok), merkezin izi;
   · K3 veritabanında: uygulama rolü e-posta anahtarını yazamaz, gönderim kaydına ve yönetim işlevlerine dokunamaz, merkez kaydını okuyamaz;
   · gönderim (firmaGonderimi + kimden) kurulan kayıtla çalışır.
   Olumsuz kanıt: tests/bozan/eposta-gonderim.bozan.ts. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { gonderimAlaniEkle, gonderimDogrula, gonderimGorunumu, type EpostaOrtami } from "../src/modules/yonetim/server/eposta.ts";
import type { YonetimCalistirici } from "../src/modules/yonetim/server/firma-tarafi.ts";
import { coz, sirYaz } from "../src/server/ayar/sir.ts";
import { havuzKur, kiraciIcinde, yonetimFirmadaIcinde, yonetimIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { resendYonetimi } from "../src/server/dis/resend-yonetim.ts";
import { firmaGonderimi } from "../src/server/eposta/firma.ts";
import { kimdenKur } from "../src/server/eposta/kimden.ts";
import { parolaOzeti } from "../src/server/kimlik/parola.ts";
import { cokluVtKur, type CokluVt } from "./yardimci/coklu-vt.ts";
import { sahteResendKur, type SahteResend } from "./yardimci/sahte-resend.ts";

let v: CokluVt, r: SahteResend, hA: Havuz, o: EpostaOrtami, c: YonetimCalistirici, eskiAnahtar: string | undefined;
let kopuk = false;
const YE = "yonetici@probata.example";

before(async () => {
  v = await cokluVtKur();
  /* firma tarafının sırrını uygulama okur (sirKullan — ortamdaki ana anahtar); yönetim aynı anahtarla şifreler */
  eskiAnahtar = process.env.PROBATA_SIR_ANAHTARI;
  process.env.PROBATA_SIR_ANAHTARI = v.anahtar.toString("base64");
  hA = havuzKur(v.A.baglanti);
  r = await sahteResendKur();
  // örnek veri UYDURMADIR (CLAUDE.md §7)
  const y = (await v.merkezSahip.query<{ id: string }>("INSERT INTO yonetici (eposta, ad, parola_ozeti, durum, totp_sir) VALUES ($1, 'Deneme Yönetici', $2, 'etkin', 'v1.uydurma-dogrulama-anahtari') RETURNING id::text",
    [YE, await parolaOzeti("yonetim-parola-2026")])).rows[0]!.id;
  c = {
    merkez: (is) => yonetimIcinde(v.merkez, is, { yoneticiId: y }),
    firmada: (kayit, id, is) => {
      if (kopuk) throw Object.assign(new Error("ulaşılamadı"), { code: "ECONNREFUSED" });
      if (id !== v.A.id || kayit.firmaId !== id) throw new Error("bilinmeyen firma havuzu");
      return yonetimFirmadaIcinde(hA, id, is, { yoneticiEposta: YE });
    },
  };
  o = { ...c, resend: resendYonetimi({ uc: r.url, anahtar: r.anahtar, yerel: true }, { bekle: async () => {} }), anaAnahtar: v.anahtar };
});
after(async () => {
  if (eskiAnahtar === undefined) delete process.env.PROBATA_SIR_ANAHTARI; else process.env.PROBATA_SIR_ANAHTARI = eskiAnahtar;
  await hA?.end(); await r?.kapat(); await v?.kapat();
});

const eklemeler = (ad: string) => r.istekler.filter((i) => i.yontem === "POST" && i.yol === "/domains" && JSON.parse(i.govde).name === ad).length;
const anahtarAcmalari = () => r.istekler.filter((i) => i.yontem === "POST" && i.yol === "/api-keys").length;
const tamam = <T extends { durum: string }>(x: T) => { assert.equal(x.durum, "tamam", JSON.stringify(x)); return x as Extract<T, { durum: "tamam" }>; };
/** firma tarafı (ortak firma merkezde, kendi projeli firmanın veritabanında) — uygulama rolüyle, kiracı işleminde */
const firmaTarafi = (h: Havuz, id: string) => kiraciIcinde(h, id, async (db) => ({
  kayit: (await db.sorgu<{ alan: string; genel: string; dogrulandi: boolean }>("SELECT alan, genel, dogrulandi FROM firma_gonderim")).rows[0] ?? null,
  sir: (await db.sorgu<{ sifreli: string | null; son4: string | null }>("SELECT sifreli, son4 FROM firma_sir WHERE ad = 'eposta_anahtari'")).rows[0] ?? null,
}));

test("ortak firma: ekle (Resend'e bir kez, AB) → bekliyor; doğrula (henüz değil) → anahtar yok; doğrulandı → anahtar BİR kez, firmada şifreli; gönderim çalışır; sır izde yok", async () => {
  const id = v.O.id;
  assert.deepEqual(await gonderimAlaniEkle(o, id, { alan: "kötü alan", yerel: "bilgi" }), { durum: "gecersiz", hatalar: { alan: "Alan adı okunamadı (ör. firmaniz.com.tr)." } });
  assert.equal((await gonderimAlaniEkle(o, id, { alan: "ortak-o.example", yerel: "Kötü Yerel" })).durum, "gecersiz");
  const e = tamam(await gonderimAlaniEkle(o, id, { alan: " https://www.Ortak-O.example/ ", yerel: "" }));
  assert.deepEqual([e.gorunum.alan, e.gorunum.genel, e.gorunum.durum, e.gorunum.kayitlar.length], ["ortak-o.example", "bilgi@ortak-o.example", "bekliyor", 3]);
  assert.equal(eklemeler("ortak-o.example"), 1);
  assert.equal(JSON.parse(r.istekler.find((i) => i.yol === "/domains" && i.yontem === "POST")!.govde).region, "eu-west-1");
  assert.deepEqual((await firmaTarafi(v.merkez, id)).kayit, { alan: "ortak-o.example", genel: "bilgi@ortak-o.example", dogrulandi: false });
  /* yeniden ekleme (genel adres değişti): Resend'e ikinci kez eklenmez */
  tamam(await gonderimAlaniEkle(o, id, { alan: "ortak-o.example", yerel: "rapor" }));
  assert.equal(eklemeler("ortak-o.example"), 1, "aynı alan ikinci kez eklenmedi");
  assert.equal((await gonderimGorunumu(c, id))!.genel, "rapor@ortak-o.example");
  /* doğrula: Resend henüz doğrulamadı → anahtar açılmaz, gönderim doğrulanmadı */
  r.dogrulaSonucu = "pending";
  assert.equal(tamam(await gonderimDogrula(o, id)).gorunum.durum, "bekliyor");
  assert.equal(anahtarAcmalari(), 0);
  assert.equal((await firmaTarafi(v.merkez, id)).sir, null);
  /* doğrulandı → anahtar bir kez; firma tarafında şifreli sır + "doğrulandı"; merkez "doğrulandı" */
  r.dogrulaSonucu = "verified";
  assert.equal(tamam(await gonderimDogrula(o, id)).gorunum.durum, "dogrulandi");
  assert.equal(tamam(await gonderimDogrula(o, id)).gorunum.durum, "dogrulandi");
  assert.equal(anahtarAcmalari(), 1, "ikinci Doğrula yeni anahtar açmaz");
  const k = r.anahtarlar[0]!;
  assert.deepEqual([k.permission, k.domain_id], ["sending_access", [...r.alanlar.values()].find((a) => a.ad === "ortak-o.example")!.id], "anahtar alan adına bağlı");
  const t = await firmaTarafi(v.merkez, id);
  assert.deepEqual(t.kayit, { alan: "ortak-o.example", genel: "rapor@ortak-o.example", dogrulandi: true });
  assert.equal(coz(t.sir!.sifreli!, id, "eposta_anahtari", v.anahtar), k.token);
  assert.equal(t.sir!.son4, k.token.slice(-4));
  /* gönderim kurulan kayıtla: Kimden alan adındaki kişi kendisi, otomatikte genel adres */
  const g = (await kiraciIcinde(v.merkez, id, (db) => firmaGonderimi(db)))!;
  assert.deepEqual([g.firma.alan, g.firma.genel, g.firma.dogrulandi], ["ortak-o.example", "rapor@ortak-o.example", true]);
  assert.equal((kimdenKur(g.firma, { ad: "Deneme Bir", eposta: "bir@ortak-o.example" }) as { kimden: string }).kimden, "\"Deneme Bir\" <bir@ortak-o.example>");
  /* sır hiçbir izde, merkez kaydında yok */
  const izler = JSON.stringify((await v.merkezSahip.query("SELECT ne, ayrinti FROM yonetim_izi WHERE hedef_firma = $1", [id])).rows)
    + JSON.stringify((await v.O.sahip.query("SELECT ne, ayrinti FROM denetim_izi WHERE firma_id = $1", [id])).rows)
    + JSON.stringify((await v.merkezSahip.query("SELECT * FROM eposta_alan WHERE firma_id = $1", [id])).rows);
  assert.ok(!izler.includes(k.token) && !izler.includes(r.anahtar), "anahtar izde / kayıtta yok");
  assert.match(izler, /eposta\.alan/);
  assert.match(izler, /ayar\.eposta_anahtari/);
});

test("eklenip merkeze yazılamamış alan adı adla bulunur (ikinci ekleme yok); bir alan adı tek firmanın; alan değişince firma tarafı hemen doğrulanmadı", async () => {
  /* Resend'de var, merkezde yok (önceki deneme merkeze yazamadan düştü) */
  await resendYonetimi({ uc: r.url, anahtar: r.anahtar, yerel: true }).alanEkle("kendi-a.example");
  tamam(await gonderimAlaniEkle(o, v.A.id, { alan: "kendi-a.example", yerel: "bilgi" }));
  assert.equal(eklemeler("kendi-a.example"), 1, "adla bulundu — ikinci kez eklenmedi");
  /* başka firma aynı alanı alamaz */
  assert.deepEqual(await gonderimAlaniEkle(o, v.O.id, { alan: "kendi-a.example", yerel: "bilgi" }), { durum: "gecersiz", hatalar: { alan: "Bu alan adı başka bir firmada kayıtlı." } });
  assert.equal((await gonderimGorunumu(c, v.O.id))!.alan, "ortak-o.example", "O'nun kaydı değişmedi");
  /* O alan adını değiştirir: firma tarafı hemen doğrulanmadı, merkezde anahtar kimliği yok, yeni alan bekliyor */
  const d = tamam(await gonderimAlaniEkle(o, v.O.id, { alan: "ortak-yeni.example", yerel: "bilgi" }));
  assert.equal(d.gorunum.durum, "bekliyor");
  assert.deepEqual((await firmaTarafi(v.merkez, v.O.id)).kayit, { alan: "ortak-yeni.example", genel: "bilgi@ortak-yeni.example", dogrulandi: false });
  assert.equal((await v.merkezSahip.query<{ a: string | null }>("SELECT anahtar_id AS a FROM eposta_alan WHERE firma_id = $1", [v.O.id])).rows[0]!.a, null);
  const g = (await kiraciIcinde(v.merkez, v.O.id, (db) => firmaGonderimi(db)))!;
  assert.equal(kimdenKur(g.firma, null).tamam, false, "doğrulanmamış yeni alanla gönderilmez");
});

test("kendi projeli firma: firma tarafı FİRMANIN veritabanında; firma tarafına ulaşılamazsa merkez doğrulandı olmaz, yeniden Doğrula tamamlar", async () => {
  const id = v.A.id;
  assert.deepEqual((await firmaTarafi(hA, id)).kayit, { alan: "kendi-a.example", genel: "bilgi@kendi-a.example", dogrulandi: false });
  assert.equal((await v.merkezSahip.query("SELECT 1 FROM firma_gonderim WHERE firma_id = $1", [id])).rowCount, 0, "merkezde gönderim kopyası yok");
  r.dogrulaSonucu = "verified";
  kopuk = true;
  const once = anahtarAcmalari();
  const k1 = await gonderimDogrula(o, id);
  kopuk = false;
  assert.equal(k1.durum, "red");
  assert.equal((await gonderimGorunumu(c, id))!.durum, "bekliyor", "firma tarafı yazılamadı — merkez doğrulandı değil");
  assert.equal((await firmaTarafi(hA, id)).sir, null);
  assert.equal(tamam(await gonderimDogrula(o, id)).gorunum.durum, "dogrulandi");
  assert.equal(anahtarAcmalari(), once + 2, "düşen denemenin anahtarı kullanılmadı (değeri hiçbir yerde yok), yeni anahtar açıldı");
  const t = await firmaTarafi(hA, id);
  assert.equal(t.kayit?.dogrulandi, true);
  assert.equal(coz(t.sir!.sifreli!, id, "eposta_anahtari", v.anahtar), r.anahtarlar.at(-1)!.token);
  const iz = (await v.merkezSahip.query<{ ne: string }>("SELECT ne FROM yonetim_izi WHERE hedef_firma = $1", [id])).rows.map((x) => x.ne);
  assert.ok(iz.includes("eposta.alan") && iz.includes("ayar.eposta_gonderim"), JSON.stringify(iz));
  const g = (await kiraciIcinde(hA, id, (db) => firmaGonderimi(db)))!;
  assert.deepEqual([g.firma.alan, g.firma.dogrulandi], ["kendi-a.example", true]);
});

test("K3 veritabanında: uygulama rolü e-posta anahtarını yazamaz, gönderim kaydına ve yönetim işlevlerine dokunamaz, merkez kaydını okuyamaz (2026-10-25: yapay zekâ anahtarını da — 0106)", async () => {
  for (const [h, id] of [[v.merkez, v.O.id], [hA, v.A.id]] as const) {
    await assert.rejects(kiraciIcinde(h, id, (db) => sirYaz(db, "eposta_anahtari", "re_uydurmaAnahtarDegil0123456789", { kim: "Deneme" })), /yönetiminden kurulur/);
    await assert.rejects(kiraciIcinde(h, id, (db) => sirYaz(db, "eposta_anahtari", null, { kim: "Deneme" })), /yönetiminden kurulur/, "kaldıramaz da");
    /* 2026-10-25 (göç 0106): yapay zekâ anahtarını da yazamaz — yalnız Yönetim */
    await assert.rejects(kiraciIcinde(h, id, (db) => sirYaz(db, "yapay_zeka_anahtari", "sk-ant-uydurmaAnahtarDegil0123456789wxyz", { kim: "Deneme" })), /yönetiminden kurulur/);
    await assert.rejects(kiraciIcinde(h, id, (db) => db.sorgu("UPDATE firma_gonderim SET dogrulandi = false")), /permission denied/);
    await assert.rejects(kiraciIcinde(h, id, (db) => db.sorgu("SELECT firma_yonetim_gonderim($1, NULL, NULL, NULL)", [id])), /permission denied/);
  }
  await assert.rejects(kiraciIcinde(v.merkez, v.O.id, (db) => db.sorgu("SELECT * FROM eposta_alan")), /permission denied/);
  await assert.rejects(kiraciIcinde(v.merkez, v.O.id, (db) => db.sorgu("SELECT yonetim_eposta_alan_yaz($1, 'x.example', 'bilgi', 'abcdefgh12', 'bekliyor', '[]', NULL)", [v.O.id])),
    /permission denied/);
  /* yönetimin işlevi bile kendi projeli firmanın kaydını merkezde gönderim kopyası olarak yazamaz (firma bu veritabanında değil) */
  await assert.rejects(c.merkez((db) => db.sorgu("SELECT firma_yonetim_gonderim($1, 'kendi-a.example', 'bilgi@kendi-a.example', true)", [v.A.id])), /bu veritabanında değil/);
});
