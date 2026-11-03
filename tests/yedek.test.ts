/* NEREDEN GELDİ: 2026-11-03 — firmanın kendi yedeği (reisim: "yedekleme bağlantısı neden yapılmıyor ? yapılsın firma ayarlardan kendi yedeğini otomatik
   alabiliyo olsun", "her gece tüm siteyi işlemeyelim yeni eklenenler eklensin yedeğe yeter her günün ayrı ayrı yedeği olmasın"; sunum K1–K6 +
   fotoğraf düzeni A). GERÇEK PostgreSQL (göç 0117), iki firma, Google Drive / OneDrive YEREL TAKLİTLE (tests/yardimci/sahte-bulut.ts):
   · katalog aynası: firma_id taşıyan her tablo yedeklenen ya da dışı (src/server/yedek/tablolar.ts); yedeklenenlerin hepsinde tetik, argümanı
     birincil anahtar + gizli sütunlar; tetik işlevi tanımlayıcı-yetkili, arama yolu sabit, PUBLIC'e kapalı;
   · değişiklik kaydı: ekleme / değişiklik / silme satırın SON hâliyle (satır başına tek kayıt), parola özeti yok; uygulama rolü kayda yazamaz;
     firma ayrımı (B, A'nınkini görmez);
   · probata arşivi: ilk koşuda yılın tam kopyası (Excel + JSON + bilgi), biten ay aylık dosyaya ve kayıt silinir, saklama süresi dolan arşiv silinir;
   · bağlama: izin kaydı tek kullanımlık, başlatan kişiye bağlı; yenileme anahtarı şifreli sırda (düz metin veritabanında yok);
   · gönderim: imzalı rapor PDF'i + okuma fotoğrafı raporun klasörüne, belge Belgeler'e, tam kopya + aylık dosya Veri yedeği'ne; İKİNCİ KOŞU YENİ BİR
     ŞEY GÖNDERMEZ; yeni belge yalnız kendisi gider;
   · kopma: izin geri alınınca "kopuk", firma yöneticisine TEK e-posta, yan menü balonu yalnız ayarı değiştirebilene; yeniden bağlanınca bağlı;
   · kesme ve başka hesap: anahtar silinir; başka hesaba bağlanınca gönderilenler yeniden sıraya girer;
   · yetki: Firma ayarları "yaz" olmayan bağlayamaz / kesemez / yedekleyemez; gece işi iki firmayı da koşar.
   Olumsuz kanıt: tests/bozan/yedek.bozan.ts. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type pg from "pg";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { vtDepo } from "../src/server/dosya/depo.ts";
import { dosyaYukle } from "../src/server/dosya/dosya.ts";
import { SON_GOC } from "../src/server/db/son-goc.ts";
import { sirDurumu } from "../src/server/ayar/sir.ts";
import { zipAc } from "../src/components/disa/oku.ts";
import { onayla } from "../src/modules/onaylar/server/onaylar.ts";
import { planIci, planKabul } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc } from "../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { imzaHazirla, imzaliYukle, raporOlustur, type Kisi } from "../src/modules/raporlar/server/raporlar.ts";
import { bulutBagla, bulutKes, simdiYedekle, yedekTakibi } from "../src/modules/firma-ayarlari/server/yedek.ts";
import { bulutAyari, bulutHizmeti } from "../src/server/dis/bulut.ts";
import { arsivAdimi, arsivOku } from "../src/server/yedek/arsiv.ts";
import { baglanBaslat, baglanBitir, baglantiKes, durumCoz, yedekGorunumu } from "../src/server/yedek/baglan.ts";
import { firmaYedegi, yedekIsi, type HizmetBul } from "../src/server/yedek/calis.ts";
import { YEDEK_DISI, YEDEK_TABLOLARI } from "../src/server/yedek/tablolar.ts";
import { donemi } from "../src/server/yedek/yol.ts";
import { testKumesi } from "./yardimci/kume.ts";
import { imzaEki } from "./yardimci/gercek-imza.ts";
import { sahteBulutKur, sahteBulutOrtami, type SahteBulut } from "./yardimci/sahte-bulut.ts";

let kume: GomuluKume, havuz: Havuz, sahip: pg.Client, t: SahteBulut, hb: HizmetBul;
let A: string, B: string;
const depo = vtDepo(() => havuz);
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
let YON: Kisi, PLAN: Kisi, MEK: Kisi, DEN: Kisi, YON_B: Kisi;
let denP: string, t1: string, ht: string, ekp: Record<string, string>;
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>, firma = A) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
const sql = <T extends object>(firma: string, metin: string, p: unknown[] = []) =>
  kiraciIcinde(havuz, firma, (db) => db.sorgu<T & Record<string, unknown>>(metin, p));
async function tetiksiz(metin: string, p: unknown[] = []) {
  await sahip.query("SET session_replication_role = replica");
  try { await sahip.query(metin, p); } finally { await sahip.query("SET session_replication_role = DEFAULT"); }
}
async function hesap(firma: string, eposta: string, roller: string[], ad: string, personel: string | null = null): Promise<Kisi> {
  const id = (await sql<{ id: string }>(firma, "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, $2, $3, 'etkin', $4) RETURNING id::text",
    [eposta, ad, roller, personel])).rows[0].id;
  return { id, ad, roller: roller as Kisi["roller"] };
}
const bayt = (...p: (number[] | string)[]) => new Uint8Array(p.flatMap((x) => (typeof x === "string" ? [...Buffer.from(x, "latin1")] : x)));
const seg = (isaret: number, govde: string) => bayt([0xff, isaret, (govde.length + 2) >> 8, (govde.length + 2) & 0xff], govde);
const JPEG = bayt([0xff, 0xd8], [...seg(0xe0, "JFIF\0\x01\x01")], [...seg(0xdb, "\0" + "\x01".repeat(64))], [0xff, 0xda, 0, 2], "goruntu-verisi", [0xff, 0xd9]);
let pdfSayac = 0;
const pdf = () => new TextEncoder().encode(`%PDF-1.4\n% yedek ${++pdfSayac}\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n`);

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  sahip = kume.sahipIstemci();
  await sahip.connect();
  t = await sahteBulutKur();
  hb = (s) => bulutHizmeti(bulutAyari(s, sahteBulutOrtami(t))!, { bekle: async () => undefined });
  [A, B] = (await sahip.query<{ id: string }>(
    "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('yedek-a', 'Yedek A', 'YA'), ('yedek-b', 'Yedek B', 'YB') RETURNING id::text")).rows.map((r) => r.id);
  const q = async (firma: string, metin: string, p: unknown[] = []) => (await sql<{ id: string }>(firma, metin, p)).rows[0].id;
  denP = await q(A, "INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Deneme Denetçi', '2024-01-01', 'mak-muh', '123') RETURNING id::text");
  YON = await hesap(A, "yon@yedek-a.example", ["firma_yoneticisi"], "Deneme Yönetici");
  PLAN = await hesap(A, "plan@yedek-a.example", ["planlama"], "Deneme Planlama");
  MEK = await hesap(A, "mek@yedek-a.example", ["mekanik_yonetici"], "Deneme Mekanik");
  DEN = await hesap(A, "den@yedek-a.example", ["denetci"], "Deneme Denetçi", denP);
  YON_B = await hesap(B, "yon@yedek-b.example", ["firma_yoneticisi"], "Deneme Yönetici B");
  const m1 = await q(A, "INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Bir Sanayi A.Ş.', 'Deneme Bir') RETURNING id::text");
  t1 = await q(A, "INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m1]);
  ht = await q(A, "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
  for (const kod of ["HT-1", "HT-2"]) await q(A, "INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'x') RETURNING id::text", [t1, ht, kod]);
  ekp = Object.fromEntries((await sql<{ kod: string; id: string }>(A, "SELECT kod, id::text FROM ekipman")).rows.map((x) => [x.kod, x.id]));
  await a(YON, async (db) => {
    const x = tamam(await taslakBaslat(db, YON, ht, "sablon:KOMPRESOR", null));
    tamam(await yayinla(db, YON, x.id, x.surum, ""));
  });
});
after(async () => { await sahip?.end(); await havuz?.end(); await kume?.durdur(); await t?.kapat(); });

/* ── imzalı rapor (tests/saklama.test.ts ile aynı yapı) ── */
const rsurum = async (id: string) => (await sql<{ surum: number }>(A, "SELECT surum FROM rapor WHERE id = $1", [id])).rows[0].surum;
let plan = "";
async function imzaliRapor(kod: string): Promise<{ rapor: string; no: string; imzali: string }> {
  if (!plan) {
    plan = tamam(await a(PLAN, (db) => planAc(db, depo, PLAN, A, { tesis: t1, baslangic: bugunTr(), bitis: bugunTr(), ekip: [{ personel: denP, isgNo: "ISG-1", kaydet: false }] }))).id;
    tamam(await a(DEN, async (db) => planKabul(db, DEN, plan, (await planIci(db, DEN, plan))!.surum, true)));
  }
  const h = tamam(await a(DEN, (db) => raporOlustur(db, DEN, plan, ekp[kod]!))).id;
  await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [h]), { hesapId: DEN.id });
  tamam(await a(MEK, async (db) => onayla(db, MEK, h, await rsurum(h))));
  tamam(await a(DEN, (db) => imzaHazirla(db, depo, DEN, A, h, async () => pdf())));
  const ham = (await sql<{ anahtar: string }>(A, "SELECT d.anahtar FROM imza_istegi i JOIN dosya d ON d.id = i.pdf_dosya WHERE i.rapor_id = $1 AND i.durum = 'bekliyor'", [h])).rows[0];
  const s2 = await rsurum(h);
  tamam(await a(DEN, async (db) => imzaliYukle(db, depo, DEN, A, h, s2, { ad: "imzali.pdf", bayt: Buffer.from(imzaEki(await depo.oku(ham.anahtar, db))) })));
  const s = (await sahip.query<{ no: string; imzali: string }>("SELECT no, imzali_dosya::text AS imzali FROM rapor_surumu WHERE rapor_id = $1", [h])).rows[0];
  return { rapor: h, no: s.no, imzali: s.imzali };
}
async function bagla(k: Kisi, firma = A, kisaAd = "yedek-a", s: "gdrive" | "onedrive" = "gdrive"): Promise<string> {
  const r = await a(k, (db) => baglanBaslat(db, { saglayici: s, hesapId: k.id, kisaAd }, hb), firma);
  const y = await fetch(r!.adres, { redirect: "manual" });
  const l = new URL(y.headers.get("location")!);
  assert.equal(l.origin + l.pathname, "http://deneme.localhost:3000/api/bulut/donus");
  const c = durumCoz(l.searchParams.get("state")!)!;
  assert.equal(c.kisaAd, kisaAd);
  return a(k, (db) => baglanBitir(db, { kod: c.kod, yetkiKodu: l.searchParams.get("code")!, hesapId: k.id, kim: k.ad }, hb), firma);
}
const calistir = (firma = A) => firmaYedegi(havuz, firma, depo, { sure: 120_000, hizmetBul: hb });

test("katalog aynası: firma_id taşıyan her tablo sınıflı; yedeklenenlerde tetik (birincil anahtar + gizli sütun); tetik işlevi güvenli", async () => {
  const tablolar = (await sahip.query<{ t: string }>(
    `SELECT c.relname AS t FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_attribute a ON a.attrelid = c.oid
     WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND a.attname = 'firma_id' AND NOT a.attisdropped ORDER BY 1`)).rows.map((x) => x.t);
  assert.deepEqual(tablolar, [...Object.keys(YEDEK_TABLOLARI), ...Object.keys(YEDEK_DISI)].sort(), "yeni tablo ya yedeğe girer ya gerekçesiyle dışarıda kalır");
  const tetikler = new Map((await sahip.query<{ t: string; d: string }>(
    "SELECT c.relname AS t, pg_get_triggerdef(g.oid) AS d FROM pg_trigger g JOIN pg_class c ON c.oid = g.tgrelid WHERE g.tgname = 'yedek_iz' AND NOT g.tgisinternal")).rows
    .map((x) => [x.t, x.d]));
  assert.deepEqual([...tetikler.keys()].sort(), Object.keys(YEDEK_TABLOLARI).sort());
  for (const [tablo, gizli] of Object.entries(YEDEK_TABLOLARI)) {
    const pk = (await sahip.query<{ s: string }>(
      `SELECT string_agg(a.attname, ',' ORDER BY array_position(i.indkey::int2[], a.attnum)) AS s FROM pg_index i
       JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey) WHERE i.indrelid = $1::regclass AND i.indisprimary`, [`public.${tablo}`])).rows[0].s;
    const d = tetikler.get(tablo)!;
    assert.ok(/AFTER INSERT OR DELETE OR UPDATE/.test(d) && /FOR EACH ROW/.test(d), `${tablo}: ${d}`);
    assert.ok(d.endsWith(`yedek_iz('${[pk, ...gizli].join("', '")}')`), `${tablo}: ${d}`);
  }
  const f = (await sahip.query<{ guvenli: boolean; yol: string[] | null; acik: boolean }>(
    `SELECT p.prosecdef AS guvenli, p.proconfig AS yol, has_function_privilege('public', p.oid, 'EXECUTE') AS acik FROM pg_proc p WHERE p.proname = 'yedek_iz'`)).rows[0];
  assert.ok(f.guvenli && f.yol?.some((x) => x.startsWith("search_path=")) && !f.acik);
});

test("değişiklik kaydı: son hâl, satır başına tek kayıt, silme işaretli, parola özeti yok; uygulama rolü yazamaz; B göremez", async () => {
  const kayit = async (tablo: string, anahtar: string, firma = A) => (await sql<{ silindi: boolean; satir: Record<string, unknown> }>(firma,
    "SELECT silindi, satir FROM yedek_degisiklik WHERE tablo = $1 AND anahtar = $2", [tablo, anahtar])).rows;
  const m = (await sql<{ id: string }>(A, "INSERT INTO musteri (unvan, kisa) VALUES ('Deneme İki Ltd.', 'Deneme İki') RETURNING id::text")).rows[0].id;
  assert.equal((await kayit("musteri", m))[0]?.satir.unvan, "Deneme İki Ltd.");
  await sahip.query("UPDATE musteri SET unvan = 'Deneme İki Ltd. Şti.' WHERE id = $1", [m]);
  const k = await kayit("musteri", m);
  assert.equal(k.length, 1, "satır başına tek kayıt");
  assert.ok(!k[0]!.silindi && k[0]!.satir.unvan === "Deneme İki Ltd. Şti.");
  assert.equal((await kayit("musteri", m, B)).length, 0, "B, A'nın değişikliğini görmez");
  const silinen = (await sql<{ id: string }>(A, "INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Silinen A.Ş.', 'Deneme Silinen') RETURNING id::text")).rows[0].id;
  await sahip.query("DELETE FROM musteri WHERE id = $1", [silinen]);
  const ks = await kayit("musteri", silinen);
  assert.ok(ks.length === 1 && ks[0]!.silindi && ks[0]!.satir.unvan === "Deneme Silinen A.Ş.", "silinen satır son hâliyle işaretli");
  await tetiksiz("UPDATE hesap SET parola_ozeti = 'scrypt$uydurma$ozet' WHERE id = $1", [YON.id]);
  await sahip.query("UPDATE hesap SET ad = 'Deneme Yönetici' WHERE id = $1", [YON.id]);
  const h = await kayit("hesap", YON.id);
  assert.ok(h[0] && !("parola_ozeti" in h[0].satir) && h[0].satir.eposta === "yon@yedek-a.example", "parola özeti kayda girmez");
  await assert.rejects(sql(A, "INSERT INTO yedek_degisiklik (firma_id, tablo, anahtar, satir) VALUES ($1, 'musteri', 'x', '{}')", [A]), /permission denied|izin/);
  await assert.rejects(sql(A, "UPDATE yedek_degisiklik SET satir = '{}'"), /permission denied|izin/);
});

test("probata arşivi: yılın tam kopyası (JSON + Excel + bilgi, parola özetsiz), biten ay aylık dosyaya ve kayıt silinir, süresi dolan silinir", async () => {
  const simdi = new Date();
  const o1 = await a(YON, (db) => arsivAdimi(db, depo, simdi));
  assert.equal(o1.tam, 1);
  assert.equal((await a(YON, (db) => arsivAdimi(db, depo, simdi))).tam, 0, "yılda bir");
  const tam = (await a(YON, (db) => arsivOku(db, depo, "tam", String(donemi(simdi).yil))))!;
  const z = new Map((await zipAc(tam.bayt, 200 << 20, 1000)).map((x) => [x.ad, Buffer.from(x.bayt)]));
  assert.ok(z.has("musteri.jsonl") && z.has("musteri.xlsx") && z.has("bilgi.json"));
  assert.ok(z.get("musteri.jsonl")!.toString().includes("Deneme Bir Sanayi A.Ş."));
  assert.ok(!z.get("hesap.jsonl")!.toString().includes("parola_ozeti"), "tam kopyada parola özeti yok");
  assert.equal(JSON.parse(z.get("bilgi.json")!.toString()).goc, SON_GOC);
  assert.ok(!z.get("musteri.jsonl")!.toString().includes("Yedek B"), "yalnız firmanın satırları");
  /* geçen ayın değişiklikleri: aylık dosyaya, kayıt silinir; bu ayınki kalır */
  const m = (await sql<{ id: string }>(A, "INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Üç A.Ş.', 'Deneme Üç') RETURNING id::text")).rows[0].id;
  await sahip.query("UPDATE yedek_degisiklik SET zaman = zaman - interval '40 days' WHERE firma_id = $1 AND tablo = 'musteri' AND anahtar = $2", [A, m]);
  const gecen = donemi(new Date(Date.now() - 40 * 864e5)).ay;
  const o2 = await a(YON, (db) => arsivAdimi(db, depo, simdi));
  assert.ok(o2.ay >= 1, JSON.stringify(o2));
  assert.equal((await sql(A, "SELECT 1 FROM yedek_degisiklik WHERE anahtar = $1", [m])).rowCount, 0, "aylık dosyaya yazılan kayıt silindi");
  assert.equal((await sql(A, "SELECT 1 FROM yedek_degisiklik WHERE zaman < $1", [donemi(simdi).ayBasi])).rowCount, 0);
  const ay = (await a(YON, (db) => arsivOku(db, depo, "ay", gecen)))!;
  const za = new Map((await zipAc(ay.bayt, 200 << 20, 1000)).map((x) => [x.ad, Buffer.from(x.bayt).toString()]));
  assert.ok(za.get("musteri.jsonl")!.includes("Deneme Üç A.Ş."));
  assert.equal(JSON.parse(za.get("bilgi.json")!).tur, "ay");
  /* B: kendi arşivi; A'nınkini görmez */
  assert.equal((await sql(B, "SELECT 1 FROM yedek_arsiv")).rowCount, 0);
  /* saklama süresi (5 yıl) dolan arşiv: depodan ve kayıttan silinir */
  const eski = (await sahip.query<{ id: string; anahtarlar: string[] }>("SELECT id::text, anahtarlar FROM yedek_arsiv WHERE firma_id = $1 AND tur = 'ay'", [A])).rows[0];
  await sahip.query("UPDATE yedek_arsiv SET olustu = now() - interval '6 years' WHERE id = $1", [eski.id]);
  assert.equal((await a(YON, (db) => arsivAdimi(db, depo, simdi))).silinen, 1);
  assert.equal((await sahip.query("SELECT 1 FROM depo_nesne WHERE anahtar = ANY ($1)", [eski.anahtarlar])).rowCount, 0);
});

test("yetki: Firma ayarları 'yaz' olmayan bağlayamaz / kesemez / yedekleyemez", async () => {
  const g = { saglayici: "gdrive", kok: "probata yedek", duzen: "mt" };
  assert.equal((await a(DEN, (db) => bulutBagla(db, DEN, "yedek-a", -1, g))).durum, "yetkisiz");
  assert.equal((await a(DEN, (db) => bulutKes(db, DEN))).durum, "yetkisiz");
  assert.equal((await a(DEN, (db) => simdiYedekle(db, DEN))).durum, "yetkisiz");
  assert.equal((await a(YON, (db) => bulutBagla(db, YON, "yedek-a", -1, { ...g, saglayici: "" }))).durum, "gecersiz");
});

test("bağlama: izin kaydı tek kullanımlık ve başlatana bağlı; anahtar şifreli; imzalı rapor + okuma fotoğrafı + belge + veri; ikinci koşu yeni bir şey göndermez", async () => {
  /* başka kişi başlatılan izni kullanamaz */
  const r0 = await a(YON, (db) => baglanBaslat(db, { saglayici: "gdrive", hesapId: YON.id, kisaAd: "yedek-a" }, hb));
  const l0 = new URL((await fetch(r0!.adres, { redirect: "manual" })).headers.get("location")!);
  assert.equal(await a(MEK, (db) => baglanBitir(db, { kod: durumCoz(l0.searchParams.get("state")!)!.kod, yetkiKodu: l0.searchParams.get("code")!, hesapId: MEK.id, kim: MEK.ad }, hb)), "baskasi");
  assert.equal(await a(YON, (db) => baglanBitir(db, { kod: durumCoz(l0.searchParams.get("state")!)!.kod, yetkiKodu: l0.searchParams.get("code")!, hesapId: YON.id, kim: YON.ad }, hb)), "suresi",
    "izin kaydı bir kez");
  /* imzalı rapor + okuma fotoğrafı (raporda görünmez — ayrıca gider) + yüklenen sözleşme */
  const r = await imzaliRapor("HT-1");
  const foto = await a(DEN, (db) => dosyaYukle(db, depo, { firmaId: A, modul: "rapor", kayitId: r.rapor, ad: "pano.jpg", bayt: JPEG, izinli: ["jpeg"], kim: DEN.ad }));
  assert.ok(foto.tamam);
  const gorunen = await a(DEN, (db) => dosyaYukle(db, depo, { firmaId: A, modul: "rapor", kayitId: r.rapor, ad: "gorunen.jpg", bayt: JPEG, izinli: ["jpeg"], kim: DEN.ad }));
  assert.ok(gorunen.tamam);
  await tetiksiz("UPDATE rapor SET fotolar = $2::jsonb WHERE id = $1", [r.rapor, JSON.stringify([
    { dosya: foto.tamam && foto.id, ad: "pano.jpg", bolum: "b1", madde: null, okuma: true }, { dosya: gorunen.tamam && gorunen.id, ad: "gorunen.jpg", bolum: "b1", madde: null }])]);
  const soz = await a(YON, (db) => dosyaYukle(db, depo, { firmaId: A, modul: "is_sozlesmesi", kayitId: randomUUID(), ad: "Sözleşme.pdf", bayt: pdf(), izinli: ["pdf"], kim: YON.ad }));
  assert.ok(soz.tamam);
  assert.equal(await bagla(YON), "bagli");
  const s = await a(YON, (db) => db.sorgu<{ sifreli: string }>("SELECT sifreli FROM firma_sir WHERE ad = 'bulut_erisimi'"));
  assert.ok(s.rows[0]?.sifreli && !s.rows[0].sifreli.startsWith("y-"), "yenileme anahtarı şifreli");
  const o = await calistir();
  assert.equal(o.durum, "tamam", JSON.stringify(o));
  const d = t.driveDosyalari();
  const yil = donemi(new Date()).yil, ay = donemi(new Date()).ay;
  const klasor = `probata yedek/Raporlar/Deneme Bir/Merkez/${r.no}`;
  assert.ok(d.has(`${klasor}/${r.no}.pdf`), [...d.keys()].join("\n"));
  assert.ok(d.has(`${klasor}/okuma 1.jpg`), "okuma fotoğrafı raporun klasöründe");
  assert.ok(![...d.keys()].some((k) => k.includes("gorunen")), "raporda görünen fotoğraf PDF'in içinde — ayrıca gitmez");
  assert.ok(d.has(`probata yedek/Belgeler/Sözleşmeler/Sözleşme (${soz.tamam && soz.id.slice(0, 8)}).pdf`));
  assert.ok(d.has(`probata yedek/Veri yedeği/Tam kopya ${yil}.zip`) && d.has(`probata yedek/Veri yedeği/Aylık/${ay}.zip`));
  const imzaliBayt = await a(YON, async (db) => depo.oku((await db.sorgu<{ anahtar: string }>("SELECT anahtar FROM dosya WHERE id = $1", [r.imzali])).rows[0].anahtar, db));
  assert.ok(d.get(`${klasor}/${r.no}.pdf`)!.equals(Buffer.from(imzaliBayt)), "imzalı PDF birebir");
  /* ikinci koşu: yeni bir şey yok — dosya gitmez, tam kopya yeniden alınmaz */
  const istek = t.istekler.length;
  const o2 = await calistir();
  assert.equal(o2.gonderilen, 0);
  assert.ok(!t.istekler.slice(istek).some((x) => x.yontem === "PUT"), "hiçbir içerik yeniden yüklenmez");
  /* yeni belge: yalnız kendisi */
  const yeni = await a(YON, (db) => dosyaYukle(db, depo, { firmaId: A, modul: "olcum_cihazi", kayitId: randomUUID(), ad: "Kalibrasyon.pdf", bayt: pdf(), izinli: ["pdf"], kim: YON.ad }));
  assert.ok(yeni.tamam);
  const o3 = await calistir();
  assert.equal(o3.gonderilen, 1);
  assert.ok(t.driveDosyalari().has(`probata yedek/Belgeler/Ölçüm cihazları/Kalibrasyon (${yeni.tamam && yeni.id.slice(0, 8)}).pdf`));
  const v = await a(YON, (db) => yedekGorunumu(db));
  assert.equal(v.baglanti?.durum, "bagli");
  assert.equal(v.baglanti?.hesap, t.hesap.google);
  assert.ok(v.kuyruk.gonderildi >= 4 && v.kuyruk.bekliyor === 0, JSON.stringify(v.kuyruk));
});

test("kopma: izin geri alınınca kopuk, firma yöneticisine TEK e-posta, balon yalnız ayarı değiştirebilene; yeniden bağlanınca bağlı", async () => {
  t.iptal = true;
  try {
    assert.equal((await calistir()).durum, "kopuk");
    assert.equal((await calistir()).durum, "yok", "kopukken gönderim denenmez");
  } finally { t.iptal = false; }
  const e = (await sql<{ kime: string; konu: string }>(A, "SELECT kime, konu FROM eposta WHERE kaynak = 'yedek'")).rows;
  assert.deepEqual(e.map((x) => x.kime), ["yon@yedek-a.example"], "tek e-posta, yalnız firma yöneticisine");
  assert.match(e[0]!.konu, /Google Drive bağlantısı koptu/);
  assert.equal(await a(YON, (db) => yedekTakibi(db, YON)), true);
  assert.equal(await a(DEN, (db) => yedekTakibi(db, DEN)), false);
  assert.equal((await a(YON, (db) => simdiYedekle(db, YON))).durum, "red");
  assert.equal(await bagla(YON), "bagli");
  assert.equal(await a(YON, (db) => yedekTakibi(db, YON)), false);
  assert.equal((await calistir()).durum, "tamam");
});

test("kesme ve başka hesap: anahtar silinir; başka hesaba bağlanınca gönderilenler yeniden sıraya girer; gece işi iki firmayı koşar", async () => {
  assert.equal(await a(YON, (db) => baglantiKes(db, YON.ad, hb)), true);
  assert.equal((await a(YON, (db) => sirDurumu(db, "bulut_erisimi"))).tanimli, false);
  assert.equal((await a(YON, (db) => yedekGorunumu(db))).baglanti?.durum, "kesildi");
  assert.equal((await calistir()).durum, "yok");
  t.hesap.google = "baska@deneme.example";
  assert.equal(await bagla(YON), "bagli");
  const v = await a(YON, (db) => yedekGorunumu(db));
  assert.ok(v.kuyruk.gonderildi === 0 && v.kuyruk.bekliyor >= 4, JSON.stringify(v.kuyruk));
  /* B OneDrive'a bağlanır; gece işi iki firmayı da koşar */
  assert.equal(await bagla(YON_B, B, "yedek-b", "onedrive"), "bagli");
  const g = await yedekIsi(havuz, depo, 120_000, undefined, { hizmetBul: hb });
  assert.equal(g.durum, "tamam", JSON.stringify(g));
  assert.equal(g.firma, 2);
  assert.ok(g.gonderilen >= 4);
  assert.ok([...t.onedrive.keys()].some((k) => k.startsWith("probata yedek/Veri yedeği/Tam kopya")), "B'nin tam kopyası OneDrive'da");
  assert.equal((await a(YON, (db) => yedekGorunumu(db))).kuyruk.bekliyor, 0);
});
