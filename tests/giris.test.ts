/* NEREDEN GELDİ: 09-E1–E4 (parola özeti, kiracıya bağlı oturum, oturum sunucuda, yetki düşünce oturum düşer) · karar 37 (5 hata → 15 dk kilit,
   hesaba ve IP'ye) · reisim 2026-10-04: "site güvenliği, kaynak koddan rol değiştirme sızma veri çalma gibi şeylere dikkat et".
   GERÇEK PostgreSQL'de (gömülü), İKİ FİRMA: aynı e-posta iki firmada ayrı hesap; bir firmanın belirteci öteki firmada geçmez; roller istemciden
   değil hesaptan; tablo sızsa da belirteç ve parola düz değil. Olumsuz kanıt: tests/bozan/giris.bozan.ts. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import pg from "pg";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde } from "../src/server/db/kiraci.ts";
import { belirtecOzeti, cikisYap, girisYap, oturumOku, parolaDegistir } from "../src/server/kimlik/oturum.ts";
import { parolaDogru, parolaOzeti } from "../src/server/kimlik/parola.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: pg.Pool;
let A: string, B: string;
const T0 = new Date("2026-10-04T09:00:00Z");
const sonra = (dk: number) => new Date(T0.getTime() + dk * 60_000);
const PAROLA_A = "dogruParola1", PAROLA_B = "baskaParola2";

async function hesapEkle(firma: string, eposta: string, parola: string, roller: string[], durum = "etkin") {
  const ozet = await parolaOzeti(parola);
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, parola_ozeti, roller, durum) VALUES ($1, 'Deneme Kişi', $2, $3, $4) RETURNING id", [eposta, ozet, roller, durum]))).rows[0].id;
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const sahip = kume.sahipIstemci();
  await sahip.connect();
  try {
    const r = await sahip.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A Muayene', 'DA'), ('deneme-b', 'Deneme B Muayene', 'DB') RETURNING id");
    [A, B] = r.rows.map((x) => x.id);
  } finally { await sahip.end(); }
  // aynı e-posta iki firmada: ayrı hesap, ayrı parola (uydurma)
  await hesapEkle(A, "kisi@deneme.example", PAROLA_A, ["denetci"]);
  await hesapEkle(B, "kisi@deneme.example", PAROLA_B, ["firma_yoneticisi"]);
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("parola özeti scrypt; düz parola yok, yanlış parola ve bozuk özet geçmez", async () => {
  const o = await parolaOzeti("ornekParola9");
  assert.match(o, /^scrypt\$32768\$8\$1\$[\w-]+\$[\w-]+$/);
  assert.ok(!o.includes("ornekParola9"));
  assert.equal(await parolaDogru("ornekParola9", o), true);
  assert.equal(await parolaDogru("ornekParola8", o), false);
  assert.equal(await parolaDogru("ornekParola9", "scrypt$1$8$1$aa$bb"), false);
  assert.notEqual(await parolaOzeti("ornekParola9"), o, "her özetin tuzu ayrı");
});

test("doğru parola giriş yapar; veritabanında belirteç değil yalnız özeti durur; roller hesaptan", async () => {
  const g = await girisYap(havuz, A, { eposta: " Kisi@Deneme.Example ", parola: PAROLA_A, ip: "10.0.0.1", simdi: T0 });
  assert.equal(g.tamam, true);
  if (!g.tamam) return;
  assert.deepEqual(g.hesap.roller, ["denetci"]);
  const satir = await kiraciIcinde(havuz, A, (db) => db.sorgu<{ ozet: string }>("SELECT ozet FROM oturum"));
  assert.equal(satir.rows.length, 1);
  assert.notEqual(satir.rows[0].ozet, g.belirtec);
  assert.equal(satir.rows[0].ozet, belirtecOzeti(g.belirtec));
  const o = await oturumOku(havuz, A, g.belirtec, sonra(5));
  assert.equal(o?.eposta, "kisi@deneme.example");
  assert.deepEqual(o?.roller, ["denetci"]);
  await cikisYap(havuz, A, g.belirtec);
  assert.equal(await oturumOku(havuz, A, g.belirtec, sonra(6)), null);
});

test("BENİ HATIRLA (2026-10-04): işaretsiz oturum 12 saat hareketsizlikte düşer; işaretli 7 güne kadar sürer, 14 günde mutlaka biter", async () => {
  const saat = (n: number) => sonra(n * 60);
  const kisa = await girisYap(havuz, A, { eposta: "kisi@deneme.example", parola: PAROLA_A, ip: "10.4.0.1", simdi: T0 });
  const uzun = await girisYap(havuz, A, { eposta: "kisi@deneme.example", parola: PAROLA_A, ip: "10.4.0.2", hatirla: true, simdi: T0 });
  assert.ok(kisa.tamam && uzun.tamam);
  if (!kisa.tamam || !uzun.tamam) return;
  assert.equal(kisa.hesap.hatirla, false);
  assert.equal(uzun.hesap.hatirla, true);
  assert.equal(await oturumOku(havuz, A, kisa.belirtec, saat(13)), null, "işaretsiz: 13 saat hareketsiz → düşer");
  const ertesiGun = await oturumOku(havuz, A, uzun.belirtec, saat(30));
  assert.equal(ertesiGun?.hatirla, true, "işaretli: ertesi gün açık");
  assert.equal(await oturumOku(havuz, A, uzun.belirtec, saat(30 + 8 * 24)), null, "işaretli: 8 gün hareketsiz → düşer");
  const uzun2 = await girisYap(havuz, A, { eposta: "kisi@deneme.example", parola: PAROLA_A, ip: "10.4.0.3", hatirla: true, simdi: T0 });
  assert.ok(uzun2.tamam);
  if (!uzun2.tamam) return;
  for (let gun = 6; gun <= 13; gun += 6) assert.ok(await oturumOku(havuz, A, uzun2.belirtec, saat(gun * 24)), `${gun}. gün açık`);
  assert.equal(await oturumOku(havuz, A, uzun2.belirtec, saat(14 * 24 + 1)), null, "işaretli de olsa 14 günde biter");
});

test("KİRACI: firma A'nın belirteci firma B'nin adresinde geçmez; A'nın parolası B'de geçmez", async () => {
  const g = await girisYap(havuz, A, { eposta: "kisi@deneme.example", parola: PAROLA_A, ip: "10.0.0.2", simdi: T0 });
  assert.ok(g.tamam);
  if (!g.tamam) return;
  assert.equal(await oturumOku(havuz, B, g.belirtec, sonra(1)), null);
  assert.ok(await oturumOku(havuz, A, g.belirtec, sonra(1)), "A'da hâlâ geçerli (B denemesi silmedi)");
  const capraz = await girisYap(havuz, B, { eposta: "kisi@deneme.example", parola: PAROLA_A, ip: "10.0.0.2", simdi: T0 });
  assert.deepEqual(capraz, { tamam: false, neden: "hatali" });
});

test("ROL: istemci rol yollayamaz; rol değişince açık oturum hemen düşer (09-E4)", async () => {
  const g = await girisYap(havuz, A, { eposta: "kisi@deneme.example", parola: PAROLA_A, ip: "10.0.0.3", simdi: T0 });
  assert.ok(g.tamam);
  if (!g.tamam) return;
  await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE hesap SET roller = '{firma_yoneticisi}' WHERE eposta = 'kisi@deneme.example'"));
  assert.equal(await oturumOku(havuz, A, g.belirtec, sonra(1)), null, "yetki değişti → yeniden giriş");
  const yeni = await girisYap(havuz, A, { eposta: "kisi@deneme.example", parola: PAROLA_A, ip: "10.0.0.3", simdi: sonra(2) });
  assert.ok(yeni.tamam && yeni.hesap.roller.includes("firma_yoneticisi"));
  await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE hesap SET roller = '{denetci}' WHERE eposta = 'kisi@deneme.example'"));
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE hesap SET roller = '{tanri}' WHERE eposta = 'kisi@deneme.example'")), /check constraint/);
});

test("KİLİT: hesapta 5 hatalı deneme → 15 dk kilit; kilitliyken doğru parola da girmez; süre bitince girer", async () => {
  await hesapEkle(A, "kilit@deneme.example", PAROLA_A, ["planlama"]);
  for (let i = 1; i <= 4; i++) {
    assert.deepEqual(await girisYap(havuz, A, { eposta: "kilit@deneme.example", parola: "yanlis" + i, ip: `10.1.0.${i}`, simdi: sonra(i) }), { tamam: false, neden: "hatali" });
  }
  const besinci = await girisYap(havuz, A, { eposta: "kilit@deneme.example", parola: "yanlis5", ip: "10.1.0.5", simdi: sonra(5) });
  assert.equal(besinci.tamam, false);
  assert.equal(!besinci.tamam && besinci.neden, "kilitli");
  const kilitli = await girisYap(havuz, A, { eposta: "kilit@deneme.example", parola: PAROLA_A, ip: "10.1.0.6", simdi: sonra(10) });
  assert.equal(!kilitli.tamam && kilitli.neden, "kilitli");
  const acik = await girisYap(havuz, A, { eposta: "kilit@deneme.example", parola: PAROLA_A, ip: "10.1.0.7", simdi: sonra(21) });
  assert.equal(acik.tamam, true);
  /* 2026-10-04 (K1 güvenli yazıcı): kilit ve giriş denetim izine düşer; "kim" girenin hesabı (veritabanı damgası) */
  const izler = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ ne: string; hesap_id: string | null }>(
    "SELECT d.ne, d.hesap_id::text FROM denetim_izi d JOIN hesap h ON h.id::text = d.nesne_id WHERE h.eposta = 'kilit@deneme.example' ORDER BY d.id"))).rows;
  assert.deepEqual(izler.map((i) => i.ne), ["giris.hesap_kilitlendi", "giris.yapildi"]);
  assert.equal(izler[0].hesap_id, null, "kilitte oturum yok");
  assert.ok(acik.tamam && izler[1].hesap_id === acik.hesap.id);
});

test("KİLİT: aynı IP'den farklı e-postalarla 5 hata → IP 15 dk kilitli; olmayan hesap için yanıt aynı", async () => {
  for (let i = 1; i <= 4; i++) {
    assert.deepEqual(await girisYap(havuz, A, { eposta: `yok${i}@deneme.example`, parola: "x", ip: "10.9.9.9", simdi: sonra(i) }), { tamam: false, neden: "hatali" });
  }
  const r = await girisYap(havuz, A, { eposta: "yok5@deneme.example", parola: "x", ip: "10.9.9.9", simdi: sonra(5) });
  assert.equal(!r.tamam && r.neden, "kilitli");
  const dogruAmaIpKilitli = await girisYap(havuz, A, { eposta: "kisi@deneme.example", parola: PAROLA_A, ip: "10.9.9.9", simdi: sonra(6) });
  assert.equal(!dogruAmaIpKilitli.tamam && dogruAmaIpKilitli.neden, "kilitli");
  const baskaIp = await girisYap(havuz, A, { eposta: "kisi@deneme.example", parola: PAROLA_A, ip: "10.9.9.8", simdi: sonra(6) });
  assert.equal(baskaIp.tamam, true);
  const bFirmasi = await girisYap(havuz, B, { eposta: "kisi@deneme.example", parola: PAROLA_B, ip: "10.9.9.9", simdi: sonra(6) });
  assert.equal(bFirmasi.tamam, true, "IP kilidi firmaya bağlı: öteki firmanın girişini kilitlemez");
});

test("pasif hesap giremez; pasife alınınca açık oturumu düşer", async () => {
  await hesapEkle(A, "pasif@deneme.example", PAROLA_A, ["muhasebe"]);
  const g = await girisYap(havuz, A, { eposta: "pasif@deneme.example", parola: PAROLA_A, ip: "10.2.0.1", simdi: T0 });
  assert.ok(g.tamam);
  await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE hesap SET durum = 'pasif' WHERE eposta = 'pasif@deneme.example'"));
  if (g.tamam) assert.equal(await oturumOku(havuz, A, g.belirtec, sonra(1)), null);
  assert.deepEqual(await girisYap(havuz, A, { eposta: "pasif@deneme.example", parola: PAROLA_A, ip: "10.2.0.2", simdi: sonra(2) }), { tamam: false, neden: "hatali" });
});

test("oturum süresi: 12 saat hareketsizlikte düşer (satır silinir); bozuk belirteç veritabanına gitmeden reddedilir", async () => {
  const g = await girisYap(havuz, A, { eposta: "kisi@deneme.example", parola: PAROLA_A, ip: "10.3.0.1", simdi: T0 });
  assert.ok(g.tamam);
  if (!g.tamam) return;
  assert.ok(await oturumOku(havuz, A, g.belirtec, sonra(11 * 60)));
  assert.equal(await oturumOku(havuz, A, g.belirtec, sonra(11 * 60 + 12 * 60 + 1)), null);
  const kalan = await kiraciIcinde(havuz, A, (db) => db.sorgu("SELECT 1 FROM oturum WHERE ozet = $1", [belirtecOzeti(g.belirtec)]));
  assert.equal(kalan.rowCount, 0);
  for (const b of [undefined, "", "kisa", "' OR 1=1 --".padEnd(43, "x")]) assert.equal(await oturumOku(havuz, A, b, T0), null);
});

test("uygulama rolü hesap silemez (pasife alınır), oturum tablosunu kiracısız göremez", async () => {
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("DELETE FROM hesap")), /permission denied/);
  const r = await havuz.query("SELECT count(*)::int AS n FROM oturum");
  assert.equal(r.rows[0].n, 0);
  const h = await havuz.query("SELECT count(*)::int AS n FROM hesap");
  assert.equal(h.rows[0].n, 0);
});

/* 2026-10-04 (K1, karar 34 + 37): geçici parolayla ilk giriş → parola değiştir */
test("PAROLA: 'ilk' hesap mevcut parolasız değiştirir, durum etkin olur, eski oturumlar düşer, yeni oturum açılır; etkin hesap mevcut parolasız değiştiremez", async () => {
  const id = await hesapEkle(A, "ilk@deneme.example", "geciciParola1", ["denetci"], "ilk");
  const eski = await girisYap(havuz, A, { eposta: "ilk@deneme.example", parola: "geciciParola1", ip: "10.4.0.1", simdi: T0 });
  assert.ok(eski.tamam && eski.hesap.durum === "ilk");
  assert.deepEqual(await parolaDegistir(havuz, A, id, { yeni: "geciciParola1", ip: "10.4.0.1", simdi: T0 }), { tamam: false, neden: "ayni" });
  const r = await parolaDegistir(havuz, A, id, { yeni: "yeniParola22", ip: "10.4.0.1", simdi: sonra(1) });
  assert.ok(r.tamam);
  if (eski.tamam) assert.equal(await oturumOku(havuz, A, eski.belirtec, sonra(2)), null, "eski oturum düştü");
  if (r.tamam) assert.equal((await oturumOku(havuz, A, r.belirtec, sonra(2)))?.durum, "etkin");
  assert.deepEqual(await girisYap(havuz, A, { eposta: "ilk@deneme.example", parola: "geciciParola1", ip: "10.4.0.2", simdi: sonra(3) }), { tamam: false, neden: "hatali" });
  /* artık etkin: mevcut parola zorunlu */
  assert.deepEqual(await parolaDegistir(havuz, A, id, { yeni: "baskaParola33", ip: "10.4.0.1", simdi: sonra(4) }), { tamam: false, neden: "mevcut_yanlis" });
  assert.deepEqual(await parolaDegistir(havuz, A, id, { yeni: "baskaParola33", mevcut: "yanlisParola9", ip: "10.4.0.1", simdi: sonra(4) }), { tamam: false, neden: "mevcut_yanlis" });
  assert.ok((await parolaDegistir(havuz, A, id, { yeni: "baskaParola33", mevcut: "yeniParola22", ip: "10.4.0.1", simdi: sonra(5) })).tamam);
  /* başka firmanın hesabı değiştirilemez */
  assert.deepEqual(await parolaDegistir(havuz, B, id, { yeni: "sizmaParola44", ip: "10.4.0.1", simdi: sonra(6) }), { tamam: false, neden: "yok" });
  const iz = await kiraciIcinde(havuz, A, (db) => db.sorgu<{ hesap_id: string }>("SELECT hesap_id::text FROM denetim_izi WHERE ne = 'hesap.parola_degisti' AND nesne_id = $1", [id]));
  assert.equal(iz.rows.length, 2);
  assert.ok(iz.rows.every((x) => x.hesap_id === id));
});
