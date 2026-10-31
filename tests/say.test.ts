/* NEREDEN GELDİ: 380 — S.A.Y saha asistanı (maket say.js BB6; ARKA-UC §5.1 / §5.3; reisim 2026-10-03: "her yer de gözükecek", "geçmiş silinmez
   geçmiş olayı önemli"). 2026-10-23 BAŞTAN KURULDU (reisim: "say asistanı direk claude da haiku nasıl çalışıyor ise direk o şekilde çalıştıramaz
   mıyız", "tamam onaylıyorum … herhangi bir kısıt kurma tamamen temiz kurulum yap, hiç bir kısıtı olmasın"; göç 0103) — eski beklentiler (kişi
   başı 200 ileti, ileti 100 000 karakter, "ek saklanmaz", ayırmanın sabit tabanı, döngü adımlarının ekrandan gelmesi, düzeltme turu) KASITLI
   olarak kalktı. GERÇEK PostgreSQL, iki firma, firma başına üç kişi:
   · kapalıyken / anahtarsızken soru konuşmaya girmez (söylenir);
   · soru: görünen geçmişe ve konuşmaya (ekler — yalnız kişinin kendi ekleri, Dosya API kimliğiyle; yazı) ve ardından sayfa notu (sistem iletisi);
     cevapsız kalan sorunun notu yenisiyle değişir, soru kalır; cevapsız araç çağrıları yeni iletide kapanır (bekleyen sunucu sonucu ya da YARIDA);
   · GÜVENLİK: konuşma, ekler, parçalar, iş kişinin kendisinin — aynı firmadaki başkası ve başka firma görmez; konuşma değişmez (yalnız eklenir),
     sahibi oturumdan damgalanır; "Sohbeti temizle" hepsini siler, eklerin hizmetteki dosyalarını döner; görünen geçmişte sınır yok;
   · iş: aynı kişinin iki işi aynı anda yok (iki pencere sırayı bozamaz); biten ya da süresi dolan iş yer açar; bekleyen sonuçlar bir kez alınır;
   · parçalar sırasıyla birleşir, eksikse yok;
   · 382 rapor ekranının kuralla yaptığı işin METNİNİ sunucu kurar, konuşmaya not olarak da girer (S.A.Y sonra bilir); eski öneri kartı bir kez;
   · 550 / 561 / 553 ekran: rapor haritası yalnız raporu yazanın Yeni raporunda ve adres o raporsa (kısaltmasız; künye gitmez); format haritası yalnız
     kurucu adresinde, formatı değiştirebilene, taslakta; sayfa notu kısa (haritasız).
   · maliyet: ayırma kişinin aylık sınırıyla (firma ayarı; boşsa sınırsız), kapanış gerçek maliyetle; mesaj yalnız sorunun ilk çağrısında sayılır.
   Olumsuz kanıt: tests/bozan/say.bozan.ts. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { planIci, planKabul } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { raporOlustur } from "../src/modules/raporlar/server/raporlar.ts";
import { raporSayBilgisi } from "../src/modules/raporlar/server/say-baglanti.ts";
import { cagriAyir, cagriKapat, sayBaglami, sayDurumu, sayfaNotu, sayGecmisi, sayKapisi, sayOneri, sayRaporCevabi, sayTemizle, soruyuEkle, YARIDA,
} from "../src/modules/say/server/say.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { bekleyenAl, bekleyenYaz, ekKaydet, isAl, isBirak, konusmaEkle, konusmaOku, parcalariBirlestir, parcalariSil, parcaYaz } from "../src/server/yz/konusma.ts";
import { yzAyi } from "../src/server/yz/kullanim.ts";
import { sohbetYaz } from "../src/server/yz/sohbet.ts";
import { testKumesi } from "./yardimci/kume.ts";
import { yzKur, type YzKurulumu } from "./yardimci/yz-kur.ts";
import { KOSUL_SURUMU } from "../src/server/yz/kosul.ts";



let kume: GomuluKume, havuz: Havuz, A = "", B = "";
const klasor = mkdtempSync(join(tmpdir(), "say-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme Kişi", roller: roller as Kisi["roller"] });
interface Firma { yon: Kisi; plan: Kisi; den: Kisi }
let FA: Firma, FB: Firma;

async function firmaKur(firma: string, ek: string): Promise<Firma> {
  const f = await kiraciIcinde(havuz, firma, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa, eposta, tel) VALUES ('Gizli Sanayi A.Ş.', 'Gizli', $1, '0312 000 00 00') RETURNING id::text", [`iletisim@${ek}.example`]);
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce, sgk) VALUES ($1, 'Gizli Tesis', 'Saklı Cad. 1', 'Ankara', 'Çankaya', $2) RETURNING id::text", [m, "2".repeat(26)]);
    const per = await q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Saklı Denetçi', '2024-01-01', 'elk-muh', '123') RETURNING id::text");
    const h = async (eposta: string, rol: string, personel: string | null = null) => kisi(await q(
      "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme Kişi', $2, 'etkin', $3) RETURNING id::text", [`${eposta}@${ek}.example`, [rol], personel]), rol);
    return { yon: await h("yon", "firma_yoneticisi"), plan: await h("plan", "planlama"), den: await h("den", "denetci", per), tesis, per };
  });
  /* denetçiye plan günü gelmiş, kabul bekleyen bir plan (Planlar balonu kırmızı 1) */
  const g = bugunTr();
  const p = await kiraciIcinde(havuz, firma, (db) => planAc(db, depo, f.plan, firma, { tesis: f.tesis, baslangic: g, bitis: g, ekip: [{ personel: f.per, isgNo: "ISG-1", kaydet: false }] }), { hesapId: f.plan.id });
  assert.equal(p.durum, "tamam", JSON.stringify(p));
  return { yon: f.yon, plan: f.plan, den: f.den };
}
const ile = <T,>(firma: string, k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
/* 2026-10-25 (göç 0106): yapay zekâyı firma yazamaz — kurulum sahip bağlantısıyla (yönetimin karşılığı) */
const yzAyari = (firma: string, _k: Kisi, d: YzKurulumu) => yzKur(kume, firma, d);
/* kişinin KENDİ satırı (RLS yalnız firmayı süzer — firmadaki herkesin satırı görünür; 2026-10-08 CI 715bd6f: süzgeçsiz ilk satır planlamacınındı) */
const kullanim = async (firma: string, k: Kisi) => (await ile(firma, k, (db) => db.sorgu<{ mesaj: number; maliyet: string; ayrilan: string }>(
  "SELECT mesaj, maliyet::text, ayrilan::text FROM yz_kullanim WHERE ay = $1 AND hesap_id = $2", [yzAyi(), k.id]))).rows[0] ?? null;

before(async () => {
  process.env.PROBATA_SIR_ANAHTARI ??= randomBytes(32).toString("base64");
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('say-a', 'Say A', 'SA'), ('say-b', 'Say B', 'SB') RETURNING id::text")).rows.map((r) => r.id);
  } finally { await s.end(); }
  FA = await firmaKur(A, "say-a");
  FB = await firmaKur(B, "say-b");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });


const ANAHTAR = "sk-ant-deneme-anahtar-0123456789";

test("kapalıyken ve anahtarsızken soru konuşmaya girmez (söylenir); açık + anahtar hazır", async () => {
  const ekran = { yol: "/planlar", raporNo: null, canli: null, kurucu: null };
  assert.deepEqual(await ile(A, FA.den, (db) => sayDurumu(db)), { acik: false, anahtar: false, sinirDoldu: false });
  assert.deepEqual(await ile(A, FA.den, (db) => soruyuEkle(db, FA.den, { metin: "Soru", ekler: [], ekran })), { durum: "red", neden: "S.A.Y firmada kapalı (probata yönetimi tanımlar)." });
  await yzAyari(A, FA.yon, { acik: true, sinir: null });
  assert.match(JSON.stringify(await ile(A, FA.den, (db) => soruyuEkle(db, FA.den, { metin: "Soru", ekler: [], ekran }))), /API anahtarı girilmedi/);
  await yzAyari(A, FA.yon, { anahtar: ANAHTAR });
  /* 2026-10-31 (kalem 7 — M6): durum koşul kabulünü de verir (yapay zekâ açılınca test kurulumu hesapları kabul ettirir — yz-kur.ts kosulKur) */
  assert.deepEqual(await ile(A, FA.den, (db) => sayDurumu(db)), { acik: true, anahtar: true, sinirDoldu: false, kosul: { firma: true, kisi: true, surum: KOSUL_SURUMU } });
  const k = await ile(A, FA.den, (db) => sayKapisi(db));
  assert.ok(k.durum === "acik" && k.anahtar === ANAHTAR && k.model === "haiku");
  assert.deepEqual(await ile(A, FA.den, (db) => sayGecmisi(db)), []);
  assert.deepEqual(await ile(A, FA.den, (db) => konusmaOku(db)), [], "reddedilen soru konuşmaya girmedi");
  assert.deepEqual(await ile(A, FA.den, (db) => soruyuEkle(db, FA.den, { metin: "  \u0007 ", ekler: [], ekran })), { durum: "red", neden: "Sorunuzu yazın." });
});

test("soru: görünen geçmişe + konuşmaya (ekler, yazı) + sayfa notu; cevapsız sorunun notu değişir; cevapsız araç çağrıları kapanır", async () => {
  const ekran = { yol: "/planlar", raporNo: null, canli: null, kurucu: null };
  const s1 = await ile(A, FA.den, (db) => soruyuEkle(db, FA.den, { metin: "Planları göster", ekler: [], ekran }, new Date("2026-10-23T09:00:00Z")));
  assert.ok(s1.durum === "hazir", JSON.stringify(s1));
  if (s1.durum !== "hazir") return;
  assert.deepEqual([s1.ileti.kim, s1.ileti.metin, s1.ileti.yer], ["ben", "Planları göster", "Planlar"]);
  let k = await ile(A, FA.den, (db) => konusmaOku(db));
  assert.deepEqual(k.map((m) => m.rol), ["user", "system"]);
  assert.deepEqual(k[0].icerik, [{ type: "text", text: "Planları göster" }]);
  assert.match(String(k[1].icerik), /^Kullanıcı şu sayfada: Planlar\./);
  assert.match(String(k[1].icerik), /Bugün: 2026-10-23/);
  assert.doesNotMatch(JSON.stringify(k), /Gizli Sanayi|Saklı Cad|sk-ant/, "kişi / müşteri bilgisi, anahtar yok");
  /* cevap gelmeden yeni soru: eski not silinir (ardında düşünme yok), soru kalır */
  await ile(A, FA.den, (db) => soruyuEkle(db, FA.den, { metin: "Hâlâ orada mısın?", ekler: [], ekran }));
  k = await ile(A, FA.den, (db) => konusmaOku(db));
  assert.deepEqual(k.map((m) => m.rol), ["user", "user", "system"]);
  /* S.A.Y iki araç çağırdı; biri sunucuda yapılmıştı (bekleyen), öteki ekranındı — iş yarıda bırakılıp yeni soru gelince ikisi de kapanır */
  await ile(A, FA.den, async (db) => {
    await konusmaEkle(db, "assistant", [{ type: "thinking", thinking: "", signature: "imza" },
      { type: "tool_use", id: "t1", name: "islem", input: { ad: "plan_ara", girdi: {} } }, { type: "tool_use", id: "t2", name: "rapora_yaz", input: { girisler: [] } }]);
    assert.equal(await isAl(db, randomUUID(), 300), true);
    await bekleyenYaz(db, { t1: "{\"islem\":\"plan_ara\",\"durum\":\"tamam\"}" });
  });
  /* ek: kişinin kendi eki konuşmaya Dosya API kimliğiyle; başkasının eki düşer */
  const ek = await ile(A, FA.den, (db) => ekKaydet(db, { dosya: "file_den_1", ad: "Gizli Sanayi etiketi.jpg", tur: "foto", mime: "image/jpeg", boyut: 1234 }));
  const baskasi = await ile(A, FA.plan, (db) => ekKaydet(db, { dosya: "file_plan_1", ad: "p.pdf", tur: "pdf", mime: "application/pdf", boyut: 9 }));
  const s3 = await ile(A, FA.den, (db) => soruyuEkle(db, FA.den, { metin: "", ekler: [baskasi, ek], ekran }));
  assert.ok(s3.durum === "hazir");
  if (s3.durum !== "hazir") return;
  assert.equal(s3.ileti.metin, "Eki inceler misin?");
  assert.deepEqual(s3.ileti.ek?.ekler, [{ ad: "Gizli Sanayi etiketi.jpg", boyut: 1234, tur: "foto" }], "görünen geçmişte yalnız kişinin kendi eki");
  k = await ile(A, FA.den, (db) => konusmaOku(db));
  /* ikinci sorunun notu kalır: ardından S.A.Y cevap verdi (not cevaplanmış soruya aittir) */
  assert.deepEqual(k.map((m) => m.rol), ["user", "user", "system", "assistant", "user", "system"]);
  assert.deepEqual(k[4].icerik, [
    { type: "tool_result", tool_use_id: "t1", content: "{\"islem\":\"plan_ara\",\"durum\":\"tamam\"}" },
    { type: "tool_result", tool_use_id: "t2", content: YARIDA, is_error: true },
    /* 2026-10-31 (kalem 2, karar 1): ekin numarası, adı (ve varsa çekim saati) gider */
    { type: "text", text: "Malzeme (bu iletide 1 öğe: 1 fotoğraf (F01)). Numaralar konuşma boyunca aynı kalır; sıra kaynağın sırası, yoksa çekim saati, yoksa eklenme." },
    { type: "text", text: "M01 · F01 — fotoğraf · Gizli Sanayi etiketi.jpg:" }, { type: "image", source: { type: "file", file_id: "file_den_1" } },
    { type: "text", text: "Eki inceler misin?" },
  ]);
  assert.doesNotMatch(JSON.stringify(k), /file_plan_1|p.pdf/, "başkasının eki gitmez");
  assert.deepEqual(await ile(A, FA.den, (db) => bekleyenAl(db)), {}, "bekleyen sonuç bir kez alındı");
  /* görünen geçmiş */
  assert.deepEqual((await ile(A, FA.den, (db) => sayGecmisi(db))).map((m) => m.metin), ["Planları göster", "Hâlâ orada mısın?", "Eki inceler misin?"]);
});

test("GÜVENLİK: konuşma, ekler, parçalar, iş kişinin kendisinin; konuşma değişmez; başka firma görmez; temizle hepsini siler", async () => {
  await ile(A, FA.plan, (db) => konusmaEkle(db, "user", [{ type: "text", text: "Planlamacının sorusu" }]));
  const den = await ile(A, FA.den, (db) => konusmaOku(db));
  assert.ok(den.length && !den.some((m) => JSON.stringify(m.icerik).includes("Planlamacının")), "denetçi planlamacının konuşmasını görmez");
  assert.equal((await ile(A, FA.plan, (db) => db.sorgu("SELECT * FROM yz_ek"))).rows.length, 1, "planlamacı yalnız kendi ekini görür");
  await yzAyari(B, FB.yon, { acik: true });
  for (const t of ["yz_konusma", "yz_ek", "yz_ek_parca", "yz_konusma_is"]) {
    assert.deepEqual((await kiraciIcinde(havuz, B, (db) => db.sorgu(`SELECT * FROM ${t}`), { hesapId: FA.den.id })).rows, [], `${t}: başka firma görmez`);
  }
  /* konuşma değişmez (yalnız eklenir); sahibi oturumdan (başkasının adına yazılamaz); oturumsuz yazılamaz */
  /* iki kat: uygulama rolünün UPDATE hakkı yok, tetik de reddeder */
  await assert.rejects(ile(A, FA.den, (db) => db.sorgu("UPDATE yz_konusma SET icerik = '\"x\"'::jsonb")), /permission denied|değişmez/);
  await assert.rejects(ile(A, FA.den, (db) => db.sorgu("UPDATE yz_ek SET ad = 'x'")), /permission denied|değişmez/);
  await ile(A, FA.den, (db) => db.sorgu("INSERT INTO yz_konusma (hesap_id, rol, icerik) VALUES ($1, 'user', '\"sahte\"'::jsonb)", [FA.plan.id]));
  assert.equal((await ile(A, FA.plan, (db) => konusmaOku(db))).some((m) => m.icerik === "sahte"), false, "başkasının adına yazılamaz — kendi konuşmasına düştü");
  assert.equal((await ile(A, FA.den, (db) => konusmaOku(db))).some((m) => m.icerik === "sahte"), true);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => konusmaEkle(db, "user", "x")), /oturumdaki kişi/);
  await assert.rejects(ile(A, FA.den, (db) => konusmaEkle(db, "kotu" as "user", "x")), /check constraint/);
  /* görünen geçmişte sınır yok: uzun ileti ve 200'den çok ileti kalır */
  await ile(A, FA.plan, (db) => sohbetYaz(db, { kim: "say", metin: "u".repeat(150_000), yer: "Ana sayfa" }));
  for (let i = 0; i < 205; i++) await ile(A, FA.plan, (db) => sohbetYaz(db, { kim: i % 2 ? "say" : "ben", metin: `İleti ${i}`, yer: "Ana sayfa" }));
  const p = await ile(A, FA.plan, (db) => sayGecmisi(db));
  assert.equal(p.length, 206, "geçmişin tamamı");
  assert.equal(p[0].metin.length, 150_000);
  /* temizle: yalnız kendi — görünen geçmiş, konuşma, ekler, parçalar, iş; hizmetteki ek dosyaları döner */
  await ile(A, FA.plan, (db) => parcaYaz(db, randomUUID(), 0, new Uint8Array([1, 2])));
  const t = await ile(A, FA.plan, (db) => sayTemizle(db));
  assert.deepEqual([t.silinen, t.dosyalar, t.anahtar], [206, ["file_plan_1"], ANAHTAR]);
  for (const x of ["yz_sohbet", "yz_konusma", "yz_ek", "yz_ek_parca"]) {
    assert.equal((await ile(A, FA.plan, (db) => db.sorgu(`SELECT 1 FROM ${x} WHERE hesap_id = $1`, [FA.plan.id]))).rows.length, 0, x);
  }
  assert.ok((await ile(A, FA.den, (db) => konusmaOku(db))).length > 0, "denetçinin konuşması duruyor");
});

test("iş: aynı kişinin iki işi aynı anda yok; biten ya da süresi dolan iş yer açar; parçalar sırasıyla birleşir", async () => {
  const [i1, i2, i3] = [randomUUID(), randomUUID(), randomUUID()];
  await ile(A, FA.yon, async (db) => {
    assert.equal(await isAl(db, i1, 300), true);
    assert.equal(await isAl(db, i2, 300), false, "ikinci pencere bekler");
    assert.equal(await isAl(db, i1, 300), true, "aynı iş sürer");
    await isBirak(db, i1);
    assert.equal(await isAl(db, i2, 300), true, "biten iş yer açar");
    assert.equal(await isAl(db, i2, -1), true);
    assert.equal(await isAl(db, i3, 300), true, "süresi dolan iş yer açar");
  });
  assert.equal(await ile(A, FA.plan, (db) => isAl(db, randomUUID(), 300)), true, "başka kişinin işi engellemez");
  const y = randomUUID();
  await ile(A, FA.yon, async (db) => {
    await parcaYaz(db, y, 0, new Uint8Array([1, 2]));
    await parcaYaz(db, y, 2, new Uint8Array([5]));
    assert.equal(await parcalariBirlestir(db, y, 3), null, "eksik parça");
    await parcaYaz(db, y, 1, new Uint8Array([3, 4]));
    assert.deepEqual([...(await parcalariBirlestir(db, y, 3))!], [1, 2, 3, 4, 5]);
    await parcalariSil(db, y);
    assert.equal(await parcalariBirlestir(db, y, 3), null);
  });
});

test("382 rapor ekranı: işin metnini sunucu kurar (yer 'Rapor <no>'), konuşmaya not olarak girer; eski öneri kartı bir kez, yalnız sahibi", async () => {
  const R = { id: "6f0c1d2e-3a4b-4c5d-8e9f-0a1b2c3d4e5f", no: "SA-1026-001" };
  assert.deepEqual(await ile(A, FA.yon, (db) => sayRaporCevabi(db, { hizli: "islem", rapor: { id: "kotu", no: R.no }, islem: { istek: "geri", soru: "x", sayi: 0 } })),
    { durum: "red", neden: "Rapor bilgisi okunamadı; sayfayı yenileyip yeniden deneyin." });
  const e = await ile(A, FA.yon, (db) => sayRaporCevabi(db, { hizli: "islem", rapor: R, metin: "sahte", islem: { istek: "geri", soru: "Geri al", sayi: 3 } }));
  assert.ok(e.durum === "tamam");
  if (e.durum !== "tamam") return;
  assert.deepEqual(e.iletiler.map((m) => [m.kim, m.metin, m.yer]), [["ben", "Geri al", `Rapor ${R.no}`], ["say", "3 girişi geri aldım.", `Rapor ${R.no}`]]);
  const son = (await ile(A, FA.yon, (db) => konusmaOku(db))).at(-1)!;
  assert.equal(son.rol, "user");
  assert.match(JSON.stringify(son.icerik), /Ekranda yapıldı — Rapor SA-1026-001: kullanıcı “Geri al” dedi[\s\S]*3 girişi geri aldım\./);
  assert.doesNotMatch(JSON.stringify(son.icerik), /sahte/, "istemcinin metni gitmez");
  const id = await ile(A, FA.yon, (db) => sohbetYaz(db, { kim: "say", metin: "Önerim:", yer: `Rapor ${R.no}`,
    ek: { rapor: R.id, oneri: { alan: "sonuc", deger: "uygun_degil", ad: "Sonuç ve kanaat → Uygun değil", durum: "" } } }));
  assert.equal(await ile(A, FA.plan, (db) => sayOneri(db, id, "uygulandi")), false, "başkasının iletisini işaretleyemez");
  assert.equal(await ile(A, FA.yon, (db) => sayOneri(db, id, "uygulandi")), true);
  assert.equal(await ile(A, FA.yon, (db) => sayOneri(db, id, "vazgecildi")), false, "bir kez");
});

test("550 / 561 / 553 ekran: rapor haritası yalnız raporu yazanın Yeni raporunda, adres o raporsa (kısaltmasız, künyesiz); format haritası taslakta", async () => {
  const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
  const f = await ile(A, FA.yon, async (db) => {
    const tur = (await db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EP', 'Elektrik panosu', 'elektrik', 'e', 12) RETURNING id::text")).rows[0].id;
    const tesis = (await db.sorgu<{ id: string }>("SELECT id::text FROM tesis LIMIT 1")).rows[0].id;
    const ekp = (await db.sorgu<{ id: string }>("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'EP-S1', 'x') RETURNING id::text", [tesis, tur])).rows[0].id;
    const t = tamam(await taslakBaslat(db, FA.yon, tur, "sablon:ZPKR02", null));
    tamam(await yayinla(db, FA.yon, t.id, t.surum, ""));
    const taslak = tamam(await taslakBaslat(db, FA.yon, tur, "sablon:ZPKR02", null));
    const per = (await db.sorgu<{ p: string }>("SELECT personel_id::text AS p FROM hesap WHERE id = $1", [FA.den.id])).rows[0].p;
    return { tur, ekp, tesis, per, taslak: taslak.id };
  });
  const g = bugunTr();
  const plan = tamam(await ile(A, FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis: f.tesis, baslangic: g, bitis: g, ekip: [{ personel: f.per, isgNo: "ISG-2", kaydet: false }] }))).id;
  const v = (await ile(A, FA.den, (db) => planIci(db, FA.den, plan)))!;
  tamam(await ile(A, FA.den, (db) => planKabul(db, FA.den, plan, v.surum, true)));
  const rapor = tamam(await ile(A, FA.den, (db) => raporOlustur(db, FA.den, plan, f.ekp))).id;
  const bilgi = (await ile(A, FA.den, (db) => raporSayBilgisi(db, FA.den, rapor)))!;
  const madde = bilgi.tanim.bolumler.flatMap((b) => (b.blok === "liste" ? b.gruplar.flatMap((x) => x.maddeler) : []))[0];
  const uzun = "Kapak kırık; ".repeat(60);
  const canli = { id: rapor, cevaplar: { alan: { kurulus: "Örnek Kuruluş" }, madde: { [madde.id]: { c: "Uygun değil", not: uzun } }, yorum: "Uzman notu",
    kunye: { firma_adi: "Gizli Sanayi A.Ş." } }, ekipman: { marka: "Örnek Marka" } };
  const yol = `/raporlar/${rapor}`;
  const b = await ile(A, FA.den, (db) => sayBaglami(db, FA.den, { yol, raporNo: "SA-1", canli, kurucu: null }));
  assert.equal(b.raporId, rapor);
  assert.ok(b.rapor?.includes('- e:marka · Marka (yazı) = "Örnek Marka"') && b.rapor.includes(`- m:${madde.id} · ${madde.metin} = "Uygun değil"`), b.rapor ?? "");
  assert.ok(b.rapor?.includes(uzun.trim()), "uzun not kısaltılmaz (eski 300 karakter sınırı kalktı)");
  assert.doesNotMatch(b.rapor ?? "", /Gizli Sanayi|Gizli Tesis|Saklı Cad/, "künye gitmez");
  assert.match(b.acikRapor ?? "", /Sayfada açık rapor: .+ \(Elektrik panosu\) · durum: /);
  assert.doesNotMatch(sayfaNotu(b), /- m:|- e:marka/, "sayfa notunda harita yok");
  /* raporu yazmayan, başka adres, başka firma: harita yok */
  assert.equal((await ile(A, FA.plan, (db) => sayBaglami(db, FA.plan, { yol, raporNo: null, canli, kurucu: null }))).rapor, null);
  assert.equal((await ile(A, FA.den, (db) => sayBaglami(db, FA.den, { yol: "/planlar", raporNo: null, canli, kurucu: null }))).rapor, null);
  assert.equal((await ile(B, FB.den, (db) => sayBaglami(db, FB.den, { yol, raporNo: null, canli, kurucu: null }))).rapor, null);
  /* format yapıcı: yalnız kurucu adresinde, formatı değiştirebilene, taslakta */
  const { FormatTanimi } = await import("../src/format/tanim.ts");
  const { SABLONLAR } = await import("../src/format/sablonlar.ts");
  const kurucu = { id: f.taslak, tanim: FormatTanimi.parse(SABLONLAR.ZPKR02.tanim) };
  const kyol = `/ekipman-turleri/${f.tur}/sablon/${f.taslak}/kurucu`;
  const fb = await ile(A, FA.yon, (db) => sayBaglami(db, FA.yon, { yol: kyol, raporNo: null, canli: null, kurucu }));
  assert.equal(fb.formatId, f.taslak);
  assert.ok(fb.format?.includes("## linye · ölçüm tablosu · Pano sigortaları (linye)"));
  assert.match(sayfaNotu(fb), /Format yapıcıda bir taslak açık/);
  assert.equal((await ile(A, FA.den, (db) => sayBaglami(db, FA.den, { yol: kyol, raporNo: null, canli: null, kurucu }))).format, null, "formatı değiştiremeyen");
  assert.equal((await ile(A, FA.yon, (db) => sayBaglami(db, FA.yon, { yol: "/planlar", raporNo: null, canli: null, kurucu }))).format, null, "başka adres");
});

test("maliyet: ayırma kişinin aylık sınırıyla (boşsa sınırsız), kapanış gerçek maliyetle; mesaj yalnız ilk çağrıda", async () => {
  await yzAyari(A, FA.yon, { sinir: null });
  const ilk = await kullanim(A, FA.yon);
  const a = await ile(A, FA.yon, (db) => cagriAyir(db, "haiku", null, 20_000));
  assert.ok(a && a.ust > 0);
  await ile(A, FA.yon, (db) => cagriKapat(db, a!, 1_234, 1));
  const b = await ile(A, FA.yon, (db) => cagriAyir(db, "haiku", null, 20_000));
  await ile(A, FA.yon, (db) => cagriKapat(db, b!, 1_000, 0));
  const k = await kullanim(A, FA.yon);
  assert.deepEqual([(k?.mesaj ?? 0) - (ilk?.mesaj ?? 0), Number(k?.maliyet) - Number(ilk?.maliyet ?? 0), Number(k?.ayrilan)], [1, 2_234, 0]);
  /* sınır doluysa ayrılmaz */
  assert.equal(await ile(A, FA.yon, (db) => cagriAyir(db, "haiku", 0.001, 20_000)), null);
});
