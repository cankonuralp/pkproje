/* NEREDEN GELDİ: FIRMA-VT.md §5.10, §5.11, FV9 (sunum 579 onaylı, 2026-10-15) — kendi projeli firmanın verisi kendi veritabanında: yönetim işleri
   (dondur, geçici parola, K4 yapay zekâ anahtarı — reisim kararı: "Yönetim'den girilir / değiştirilir / kaldırılır, firma da değiştirir, iki taraf denetim
   izinde") firmanın veritabanında yapılır; merkez yalnız durumu ve izi tutar. GERÇEK PostgreSQL, iki küme, üç veritabanı (tests/yardimci/coklu-vt.ts).
   İşlemler modülün kendi işlevleriyle (src/modules/yonetim/server/firma-tarafi.ts), çalıştırıcı: merkezde yonetimIcinde (yönetici), firmada
   yonetimFirmadaIcinde (göç 0097). Kilitlenenler:
   · firma tarafı işlevleri MERKEZDE reddedilir (42501); uygulama rolü doğrudan çağıramaz; yöneticinin e-postası yoksa reddedilir; başka firmanın
     veritabanında reddedilir (vt_firma_dogrula); merkez kendi projeli firmanın sırrını yazamaz;
   · dondur: firma veritabanında durum + oturumlar silinir + firmanın izi "probata yönetim (<e-posta>)", merkezde durum + iz; etkinleştir tersine;
     KAPALI YÖN: firma tarafına ulaşılamazsa dondurulmaz (merkez değişmez); etkinleştirmede firma tarafı düşerse giriş kapalı kalır, yeniden deneme
     tamamlar;
   · geçici parola: firma veritabanında değişir (durum "ilk"), iz iki tarafta;
   · yapay zekâ anahtarı: şifreli (firma + ad ek verisi), değer hiçbir izde yok — yalnız son 4; kaldır; geçersiz anahtar yazılmaz; ortak firmada merkezde;
   · özet: kullanıcı, yönetici, anahtar tanımlı mı + son 4, bu ayın kullanımı — iki türde.
   Olumsuz kanıt: tests/bozan/yonetim-firmada.bozan.ts. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import type pg from "pg";
import { firmaDurumuYonet, firmaOzetiYonet, geciciParolaYonet, yzAnahtariYonet, yzAyarYonet, type YonetimCalistirici } from "../src/modules/yonetim/server/firma-tarafi.ts";
import { coz } from "../src/server/ayar/sir.ts";
import { havuzKur, kiraciIcinde, yonetimFirmadaIcinde, yonetimIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { parolaOzeti } from "../src/server/kimlik/parola.ts";
import { cokluVtKur, type CokluVt, type TestFirmasi } from "./yardimci/coklu-vt.ts";

let v: CokluVt, Y = "", hA: Havuz, hB: Havuz, c: YonetimCalistirici;
const YE = "yonetici@probata.example";
const ANA = randomBytes(32);
const ANAHTAR = "sk-ant-uydurmaAnahtarDegil0123456789wxyz";
const yetkisiz = (e: unknown) => (e as { code?: string }).code === "42501";
const havuzu = (id: string) => (id === v.A.id ? hA : id === v.B.id ? hB : null);

before(async () => {
  v = await cokluVtKur();
  hA = havuzKur(v.A.baglanti);
  hB = havuzKur(v.B.baglanti);
  // örnek veri UYDURMADIR (CLAUDE.md §7)
  Y = (await v.merkezSahip.query<{ id: string }>("INSERT INTO yonetici (eposta, ad, parola_ozeti, durum, totp_sir) VALUES ($1, 'Deneme Yönetici', $2, 'etkin', 'v1.uydurma-dogrulama-anahtari') RETURNING id::text",
    [YE, await parolaOzeti("yonetim-parola-2026")])).rows[0]!.id;
  const ozet = await parolaOzeti("firma-parola-2026");
  for (const f of [v.O, v.A]) {
    await f.sahip.query("INSERT INTO hesap (firma_id, eposta, ad, parola_ozeti, roller, durum) VALUES ($1, $2, 'Deneme Yönetici Kişi', $3, '{firma_yoneticisi}', 'etkin')",
      [f.id, `yon@${f.kisaAd}.example`, ozet]);
  }
  c = {
    merkez: (is) => yonetimIcinde(v.merkez, is, { yoneticiId: Y }),
    firmada: (kayit, id, is) => {
      const h = havuzu(id);
      if (!h || kayit.firmaId !== id) throw new Error("bilinmeyen firma havuzu");
      return yonetimFirmadaIcinde(h, id, is, { yoneticiEposta: YE });
    },
  };
});
after(async () => { await hA?.end(); await hB?.end(); await v?.kapat(); });

const tek = async <T extends pg.QueryResultRow>(s: pg.Client, sql: string, p: unknown[] = []) => (await s.query<T>(sql, p)).rows[0];
const durumlar = async (f: TestFirmasi) => [
  (await tek<{ d: string }>(v.merkezSahip, "SELECT durum AS d FROM firma WHERE id = $1", [f.id]))!.d,
  (await tek<{ d: string }>(f.sahip, "SELECT durum AS d FROM firma WHERE id = $1", [f.id]))!.d,
];

test("firma tarafı işlevleri merkezde reddedilir; uygulama rolü doğrudan çağıramaz; e-postasız ya da başka firmanın veritabanında reddedilir", async () => {
  await assert.rejects(yonetimIcinde(v.merkez, (db) => db.sorgu("SELECT firma_yonetim_durum($1, 'dondu')", [v.O.id]), { yoneticiId: Y }), yetkisiz, "merkezde");
  await assert.rejects(yonetimIcinde(v.merkez, (db) => db.sorgu("SELECT firma_yonetim_gecici_parola($1, 'scrypt$x')", [v.A.id]), { yoneticiId: Y }), yetkisiz);
  await assert.rejects(kiraciIcinde(hA, v.A.id, (db) => db.sorgu("SELECT firma_yonetim_durum($1, 'dondu')", [v.A.id])), yetkisiz, "uygulama rolü");
  await assert.rejects(kiraciIcinde(hA, v.A.id, (db) => db.sorgu("SELECT firma_yonetim_sir($1, 'yapay_zeka_anahtari', NULL, NULL)", [v.A.id])), yetkisiz);
  /* yönetim rolüne geçip e-posta koymadan */
  await assert.rejects(kiraciIcinde(hA, v.A.id, async (db) => { await db.sorgu("SET LOCAL ROLE probata_yonetim"); return db.sorgu("SELECT firma_yonetim_durum($1, 'dondu')", [v.A.id]); }), yetkisiz);
  /* B'nin işi A'nın veritabanında (yanlış havuz) */
  await assert.rejects(yonetimFirmadaIcinde(hA, v.B.id, (db) => db.sorgu("SELECT firma_yonetim_durum($1, 'dondu')", [v.B.id]), { yoneticiEposta: YE }), yetkisiz);
  /* merkez kendi projeli firmanın sırrını yazamaz; merkez izi yalnız kendi projeli firma ve bilinen işler için */
  await assert.rejects(yonetimIcinde(v.merkez, (db) => db.sorgu("SELECT firma_yonetim_sir($1, 'yapay_zeka_anahtari', NULL, NULL)", [v.A.id]), { yoneticiId: Y }), yetkisiz);
  await assert.rejects(yonetimIcinde(v.merkez, (db) => db.sorgu("SELECT yonetim_firmada_iz($1, 'hesap.gecici_parola', '{}')", [v.O.id]), { yoneticiId: Y }), yetkisiz);
  await assert.rejects(yonetimIcinde(v.merkez, (db) => db.sorgu("SELECT yonetim_firmada_iz($1, 'firma.silindi', '{}')", [v.A.id]), { yoneticiId: Y }));
  assert.deepEqual(await durumlar(v.A), ["etkin", "etkin"], "hiçbir şey değişmedi");
});

test("dondur: firma veritabanında durum + oturumlar silinir + izi, merkezde durum + iz; etkinleştir tersine", async () => {
  const hesap = (await tek<{ id: string }>(v.A.sahip, "SELECT id::text FROM hesap WHERE firma_id = $1 LIMIT 1", [v.A.id]))!.id;
  await v.A.sahip.query("INSERT INTO oturum (ozet, firma_id, hesap_id, bitis) VALUES ($1, $2, $3, now() + interval '1 hour')", ["a".repeat(64), v.A.id, hesap]);
  assert.equal((await firmaDurumuYonet(c, v.A.id, "dondu")).durum, "tamam");
  assert.deepEqual(await durumlar(v.A), ["dondu", "dondu"]);
  assert.equal(Number((await tek<{ n: string }>(v.A.sahip, "SELECT count(*) AS n FROM oturum WHERE firma_id = $1", [v.A.id]))!.n), 0, "oturumlar silindi");
  assert.ok(await tek(v.A.sahip, "SELECT 1 FROM denetim_izi WHERE firma_id = $1 AND ne = 'firma.donduruldu' AND kim = $2", [v.A.id, `probata yönetim (${YE})`]), "firmanın izi");
  assert.ok(await tek(v.merkezSahip, "SELECT 1 FROM yonetim_izi WHERE hedef_firma = $1 AND ne = 'firma.donduruldu'", [v.A.id]), "merkezin izi");
  assert.equal((await firmaDurumuYonet(c, v.A.id, "etkin")).durum, "tamam");
  assert.deepEqual(await durumlar(v.A), ["etkin", "etkin"]);
});

test("KAPALI YÖN: firma tarafına ulaşılamazsa dondurulmaz; etkinleştirmede firma tarafı düşerse giriş kapalı kalır, yeniden deneme tamamlar", async () => {
  const kopuk: YonetimCalistirici = { merkez: c.merkez, firmada: async () => { throw Object.assign(new Error("ulaşılamadı"), { code: "ECONNREFUSED" }); } };
  const r = await firmaDurumuYonet(kopuk, v.A.id, "dondu");
  assert.equal(r.durum, "red");
  assert.match(r.durum === "red" ? r.neden : "", /ulaşılamadı.*dondurulmadı/);
  assert.deepEqual(await durumlar(v.A), ["etkin", "etkin"], "merkez değişmedi");
  assert.equal((await firmaDurumuYonet(c, v.A.id, "dondu")).durum, "tamam");
  const r2 = await firmaDurumuYonet(kopuk, v.A.id, "etkin");
  assert.equal(r2.durum, "red");
  assert.deepEqual(await durumlar(v.A), ["etkin", "dondu"], "merkez açıldı, firmanın girişi hâlâ kapalı");
  assert.equal((await firmaDurumuYonet(c, v.A.id, "etkin")).durum, "tamam", "yeniden deneme: merkez 'zaten etkin', firma tarafı tamamlandı");
  assert.deepEqual(await durumlar(v.A), ["etkin", "etkin"]);
});

test("geçici parola: kendi projelide firma veritabanında değişir (durum 'ilk'), iz iki tarafta; ortak firmada merkezde (bugünkü gibi)", async () => {
  const once = (await tek<{ p: string }>(v.A.sahip, "SELECT parola_ozeti AS p FROM hesap WHERE firma_id = $1", [v.A.id]))!.p;
  const r = await geciciParolaYonet(c, v.A.id);
  assert.equal(r.durum, "tamam", JSON.stringify(r));
  if (r.durum !== "tamam") return;
  assert.equal(r.eposta, `yon@${v.A.kisaAd}.example`);
  const h = (await tek<{ p: string; d: string }>(v.A.sahip, "SELECT parola_ozeti AS p, durum AS d FROM hesap WHERE firma_id = $1", [v.A.id]))!;
  assert.ok(h.p !== once && h.d === "ilk");
  assert.ok(await tek(v.A.sahip, "SELECT 1 FROM denetim_izi WHERE firma_id = $1 AND ne = 'hesap.gecici_parola' AND kim = $2", [v.A.id, `probata yönetim (${YE})`]));
  assert.ok(await tek(v.merkezSahip, "SELECT 1 FROM yonetim_izi WHERE hedef_firma = $1 AND ne = 'hesap.gecici_parola'", [v.A.id]));
  const o = await geciciParolaYonet(c, v.O.id);
  assert.equal(o.durum, "tamam", JSON.stringify(o));
});

test("yapay zekâ anahtarı (K4): kendi projelide firma veritabanında şifreli, değer izde yok — son 4; kaldır; geçersiz yazılmaz; ortakta merkezde", async () => {
  for (const f of [v.A, v.O]) {
    const r = await yzAnahtariYonet(c, f.id, ANAHTAR, ANA);
    assert.deepEqual(r, { durum: "tamam", son4: "wxyz" }, f.kisaAd);
    const s = (await tek<{ sifreli: string; son4: string }>(f.sahip, "SELECT sifreli, son4 FROM firma_sir WHERE firma_id = $1 AND ad = 'yapay_zeka_anahtari'", [f.id]))!;
    assert.equal(coz(s.sifreli, f.id, "yapay_zeka_anahtari", ANA), ANAHTAR, "firma + ad ek verisiyle şifreli");
    assert.equal(s.son4, "wxyz");
    const iz = JSON.stringify((await f.sahip.query("SELECT kim, ne, ayrinti FROM denetim_izi WHERE firma_id = $1 AND nesne = 'firma_sir'", [f.id])).rows);
    assert.match(iz, /ayar\.sir_degisti/);
    assert.ok(iz.includes(`probata yönetim (${YE})`) && !iz.includes(ANAHTAR), "iz: kim yönetim, değer yok");
    assert.ok(await tek(v.merkezSahip, "SELECT 1 FROM yonetim_izi WHERE hedef_firma = $1 AND ne = 'ayar.yz_anahtari' AND ayrinti->>'son4' = 'wxyz'", [f.id]), "merkezin izi");
    const oz = await firmaOzetiYonet(c, f.id);
    assert.deepEqual([oz?.yz.tanimli, oz?.yz.son4, oz?.kullanici, oz?.yonetici?.eposta], [true, "wxyz", 1, `yon@${f.kisaAd}.example`]);
    assert.match(String(oz?.yz.ay), /^\d{4}-\d{2}$/);
    assert.deepEqual(await yzAnahtariYonet(c, f.id, null, ANA), { durum: "tamam", son4: null });
    assert.equal((await tek<{ s: string | null }>(f.sahip, "SELECT sifreli AS s FROM firma_sir WHERE firma_id = $1 AND ad = 'yapay_zeka_anahtari'", [f.id]))!.s, null, "kaldırıldı");
    assert.equal((await firmaOzetiYonet(c, f.id))?.yz.tanimli, false);
  }
  const g = await yzAnahtariYonet(c, v.A.id, "anahtar-degil", ANA);
  assert.equal(g.durum, "gecersiz");
  assert.equal((await firmaOzetiYonet(c, v.A.id))?.yz.tanimli, false, "geçersiz anahtar yazılmadı");
});

/* 2026-10-25 (reisim: "Yapay zekâ ayarları Firma ayarlarından kalksın, yalnız Yönetim panelinden yönetilsin; firmalar kendileri değiştiremesin" —
   göç 0106): Yönetim aç / kapa ve kişi başı sınırı yazar (kendi projelide firma veritabanında, ortakta merkezde), izler iki tarafta; özet ayarı
   (başlangıç kapalı, 5 $) ve kişi kişi kullanımı döndürür; uygulama rolü yazdığı satırı değiştiremez, silemez. */
test("yapay zekâ ayarı (0106): yönetim yazar, iz; özet açık / sınır / kişi kişi kullanım; uygulama rolü değiştiremez, silemez", async () => {
  for (const f of [v.A, v.O]) {
    const once = await firmaOzetiYonet(c, f.id);
    assert.deepEqual([once?.yz.acik, once?.yz.sinir, once?.yz.kisiler], [false, 5, []], `${f.kisaAd}: başlangıç kapalı, 5 $`);
    const g = await yzAyarYonet(c, f.id, { acik: true, sinir: "abc" });
    assert.equal(g.durum, "gecersiz", "sayı olmayan sınır yazılmaz");
    assert.deepEqual(await yzAyarYonet(c, f.id, { acik: true, sinir: "7,5" }), { durum: "tamam" });
    const a = (await tek<{ d: { acik: boolean; sinir: number; model: string } }>(f.sahip, "SELECT deger AS d FROM firma_ayar WHERE firma_id = $1 AND bolum = 'yapay_zeka'", [f.id]))!;
    assert.deepEqual([a.d.acik, a.d.sinir, a.d.model], [true, 7.5, "haiku"]);
    assert.ok(await tek(f.sahip, "SELECT 1 FROM denetim_izi WHERE firma_id = $1 AND ne = 'ayar.yapay_zeka' AND kim = $2", [f.id, `probata yönetim (${YE})`]), "firmanın izi");
    assert.ok(await tek(v.merkezSahip, "SELECT 1 FROM yonetim_izi WHERE hedef_firma = $1 AND ne = 'ayar.yz' AND (ayrinti->>'acik')::boolean", [f.id]), "merkezin izi");
    const h = (await tek<{ id: string }>(f.sahip, "SELECT id::text FROM hesap WHERE firma_id = $1 LIMIT 1", [f.id]))!;
    await f.sahip.query("INSERT INTO yz_kullanim (firma_id, hesap_id, ay, okuma, mesaj, maliyet) VALUES ($1, $2, to_char(now() AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM'), 3, 2, 4500) ON CONFLICT DO NOTHING", [f.id, h.id]);
    const oz = await firmaOzetiYonet(c, f.id);
    assert.deepEqual([oz?.yz.acik, oz?.yz.sinir, oz?.yz.kisiler.map((k) => [k.okuma, k.mesaj, k.maliyet])], [true, 7.5, [[3, 2, 4500]]]);
    assert.deepEqual(await yzAyarYonet(c, f.id, { acik: false, sinir: "" }), { durum: "tamam" });
    assert.deepEqual([(await firmaOzetiYonet(c, f.id))?.yz.acik, (await firmaOzetiYonet(c, f.id))?.yz.sinir], [false, null], "boş sınır = sınırsız");
  }
  /* K5: firmanın uygulama rolü yönetimin yazdığı satıra dokunamaz (kendi projeli firmanın veritabanında ve merkezde) */
  for (const [h, id] of [[hA, v.A.id], [v.merkez, v.O.id]] as const) {
    await assert.rejects(kiraciIcinde(h, id, (db) => db.sorgu("UPDATE firma_ayar SET deger = deger || '{\"acik\": true}'::jsonb WHERE bolum = 'yapay_zeka'")), yetkisiz);
    await assert.rejects(kiraciIcinde(h, id, (db) => db.sorgu("DELETE FROM firma_ayar WHERE bolum = 'yapay_zeka'")), yetkisiz);
    await assert.rejects(kiraciIcinde(h, id, (db) => db.sorgu("SELECT firma_yonetim_yz($1, true, 5)", [id])), /permission denied/);
  }
});
