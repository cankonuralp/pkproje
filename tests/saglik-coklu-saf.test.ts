/* NEREDEN GELDİ: FIRMA-VT.md §5.5 "Sağlık", §6 FV7 (sunum 579, reisim onayı 2026-10-15) — "/api/saglik firma adresinde merkezi ve o firmanın
   veritabanını denetler; yeni alan firma_vt. Firma listesi ya da sayısı açık uçta görünmez. /api/saglik/projeler zamanliYetkili ile; 4 eşzamanlı, proje
   başına 5 sn; yalnız {toplam, tamam, sorunlu}; proje başına sonuç firma_vt.son_saglik'e. tools/duman.mjs: PROBATA_DUMAN_SIR varsa bu ucu da yoklar."
   VERİTABANISIZ (sahte havuzlar — tests/yardimci/sahte-saglik.ts; gerçek PostgreSQL tests/saglik-coklu.test.ts). Kilitlenenler:
   · yanıtın biçimi: yedi anahtar HER durumda (firma adresi, kök, firma çözülemedi, merkez yok) — firma listesi / sayısı okunmaz; durum = hepsi
     (2026-10-15 FV7 incelemesi: "firmanın varlığı / yeri okunmaz" iddiası daraltıldı — firma veritabanı sorunluyken firma_vt=false o adresi ele verir);
   · firma sağlığının değerlendirmesi: göç / kimlik / bağlantı ayrımı, neden SIRSIZ (hata iletisi, bağlantı dizesi, sunucu yazılmaz); firmadan gelen göç
     bilgisi biçim denetiminden geçer (bozuk ad / sayı null);
   · /api/saglik çekirdeği: kökte firma havuzu hiç istenmez; firma adresinde KİRACININ havuzu, kiracı işleminde (vt_firma_dogrula) + READ ONLY + sunucuda
     süre sınırı; firma çözülemez / havuz kurulamaz / merkez kurulamaz → uç düşmez; cevap vermeyen firma ya da merkez süre sınırında yanlış; aynı anda
     gelen istekler TEK sorguyu paylaşır; süre sınırı tek uçuşun DIŞINDA (süresi dolan iş askıdayken yeni bağlantı açılmaz); yayındaki önbellekle firma
     sonucu süresince yeniden sorulmaz (sağlam 10 sn, sorunlu 30 sn — bozuk parolada tek deneme); önbellek verilmezse her istek sorar;
   · /api/saglik/projeler çekirdeği: kurulumu bitmemiş proje yoklanmaz / sayılmaz; en çok 4 aynı anda — süresi dolan projenin arkadaki işi de sayılır;
     proje başına süre; tek bitiş zamanı (süresi sığmayan proje başlamaz, sorunlu, yazılmaz); ana anahtar yok / merkez yayında + yerel adres → firmaya
     bağlanılmaz; merkez merkezOku'dan (vt_merkez_dogrula), işlem içinde yönetim rolü, okuma ve yazma süre sınırlı (istemci + statement_timeout); yazma
     tek UPDATE (yalnız son_saglik + zaman); merkez yazamazsa / süresinde bitmezse hata (uç 503); hedef yoksa anahtar okunmaz, yazılmaz;
   · uçların metni (tests/yardimci/denetimler.ts saglikUcuEksikleri) ve klasör (her düzey — saglikKlasoruEksikleri);
   · tools/duman.mjs alt süreçte, sahte siteye karşı: sırla projeler ucu Authorization ile yoklanır, sorunlu 0 değilse düşer; sır çıktıya yazılmaz;
     sırsız denetim atlanır (sayıya girmez); sır izin dışı adrese (yerel olmayan http, ürünün alt adresi olmayan https) gönderilmez; biçimi bozuk sır
     (gömülü satır sonu) gönderilmez ve çıktıya düşmez.
   Olumsuz kanıt: tests/bozan/saglik-coklu-saf.bozan.ts. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  firmaSagligiDegerlendir, gocBilgisi, projeleriYokla, saglikDegerlendir, saglikDenetle, saglikYaniti, SAGLIK, type SaglikAyari, type SaglikYaniti,
} from "../src/server/saglik.ts";
import type { KiraciYeri } from "../src/server/db/firma-havuzu.ts";
import { GOC_SAYISI, SON_GOC } from "../src/server/db/son-goc.ts";
import { kayitOnbellegiKur } from "../src/server/kiraci/kayit-onbellek.ts";
import { dosyalar, oku, saglikKlasoruEksikleri, saglikUcuEksikleri } from "./yardimci/denetimler.ts";
import { dumanKos, hata, hedefSatiri, IYI, sahteHavuz, sahteSite, saglikCevabi, type SahteHavuz } from "./yardimci/sahte-saglik.ts";

const ANAHTARLAR = ["veritabani", "goc_guncel", "rls", "api_kapali", "uygulama_kisitli", "isler", "firma_vt"];
const TAMAM: SaglikYaniti = {
  durum: "tamam", surum: "deneme",
  denetimler: { veritabani: true, goc_guncel: true, rls: true, api_kapali: true, uygulama_kisitli: true, isler: true, firma_vt: true },
};
const GOC_EKSIK = { ...IYI, goc_sayisi: GOC_SAYISI - 1 };
/* 2026-10-15 (FV7 incelemesi): duman sırrın biçimini denetler (en az 32 görünür ASCII karakter) — deneme sırrı 36 karakter (önce 20'ydi) */
const SIR = `sir-${randomBytes(24).toString("base64url")}`;

/** /api/saglik çekirdeği sahte havuzlarla: merkez + (varsa) firmanın havuzu */
function kur(o: { kiraci?: KiraciYeri | null; merkez?: SahteHavuz; firma?: SahteHavuz; ek?: Partial<SaglikAyari> } = {}) {
  const merkez = o.merkez ?? sahteHavuz(saglikCevabi(IYI));
  const firma = o.firma ?? sahteHavuz(saglikCevabi(IYI));
  const istenen: KiraciYeri[] = [];
  const a: SaglikAyari = {
    merkez: () => merkez, kiraciBul: async () => o.kiraci ?? null, havuz: (k) => { istenen.push(k); return firma; }, surum: "deneme", ...o.ek,
  };
  return { a, merkez, firma, istenen };
}

/* ── yanıtın biçimi ve değerlendirme ─────────────────────────────────────────────────────────────────────────────────────────────────── */
test("yanıt her durumda aynı yedi anahtar; durum = merkezin altısı VE firma veritabanı", () => {
  const iyi = saglikDegerlendir(IYI, { son: SON_GOC, sayi: GOC_SAYISI }, "deneme");
  assert.deepEqual(saglikYaniti(iyi, true), TAMAM);
  const firmaYok = saglikYaniti(iyi, false);
  assert.deepEqual([firmaYok.durum, firmaYok.denetimler.firma_vt], ["sorun", false]);
  const merkezYok = saglikYaniti(saglikDegerlendir(null, { son: SON_GOC, sayi: GOC_SAYISI }, "deneme"), true);
  assert.deepEqual([merkezYok.durum, merkezYok.denetimler.veritabani, merkezYok.denetimler.firma_vt], ["sorun", false, true]);
  for (const r of [saglikYaniti(iyi, true), firmaYok, merkezYok, saglikYaniti(saglikDegerlendir(null), false)]) {
    assert.deepEqual(Object.keys(r), ["durum", "surum", "denetimler"]);
    assert.deepEqual(Object.keys(r.denetimler), ANAHTARLAR);
  }
});

test("firma sağlığı: veri → altı denetim + kimlik + bulunan göç; düşen denetim adlarıyla; 42501 bağlantı var / kimlik yok; neden SIRSIZ", () => {
  assert.deepEqual(firmaSagligiDegerlendir({ veri: IYI }), {
    durum: "tamam", goc: { son: SON_GOC, sayi: GOC_SAYISI },
    denetimler: { veritabani: true, goc_guncel: true, rls: true, api_kapali: true, uygulama_kisitli: true, isler: true, kimlik: true },
  });
  const eksik = firmaSagligiDegerlendir({ veri: { ...GOC_EKSIK, rls_eksik: 1 } });
  assert.deepEqual([eksik.durum, eksik.neden, eksik.denetimler.kimlik, eksik.goc], ["sorun", "düşen: goc_guncel, rls", true, { son: SON_GOC, sayi: GOC_SAYISI - 1 }]);
  const red = firmaSagligiDegerlendir({ hata: hata("42501") });
  assert.deepEqual([red.durum, red.denetimler.veritabani, red.denetimler.kimlik, red.neden, red.goc],
    ["sorun", true, false, "yetki reddi — yanlış veritabanı ya da eksik hak (42501)", undefined]);
  const kopuk = firmaSagligiDegerlendir({ hata: hata("ECONNREFUSED") });
  assert.deepEqual([kopuk.denetimler.veritabani, kopuk.neden], [false, "bağlantı reddedildi (ECONNREFUSED)"]);
  assert.equal(firmaSagligiDegerlendir({ hata: hata("28P01", `password authentication failed: ${SIR}`) }).neden, "parola reddedildi (28P01)");
  const sizan = firmaSagligiDegerlendir({ hata: new Error(`postgres://probata_uygulama:${SIR}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres koptu`) });
  assert.equal(sizan.neden, "bağlantı kurulamadı");
  assert.equal(firmaSagligiDegerlendir({ kayitHatasi: new Error("Unsupported state or unable to authenticate data") }).neden,
    "bağlantı kaydı: uygulama parolası çözülemedi (ana anahtar ya da ek veri tutmuyor)");
  assert.match(firmaSagligiDegerlendir({ kayitYok: true }).neden ?? "", /^bağlantı kaydı eksik/);
  for (const y of [red, kopuk, sizan]) {
    assert.ok(Object.values(y.denetimler).filter((x) => x).length <= 1);
    assert.ok(!JSON.stringify(y).includes(SIR) && !JSON.stringify(y).includes("supabase.com"), "neden sırsız");
  }
});

/* ── /api/saglik çekirdeği ───────────────────────────────────────────────────────────────────────────────────────────────────────────── */
test("kök / yönetim / bilinmeyen adres: firma havuzu hiç istenmez, yalnız merkez; firma_vt doğru (biçim aynı)", async () => {
  const k = kur();
  assert.deepEqual(await saglikDenetle(k.a), TAMAM);
  assert.deepEqual(k.istenen, []);
  assert.equal(k.firma.cagrilar.length + k.firma.baglanti, 0);
  assert.ok(k.merkez.cagrilar.some((c) => c.sql.includes("saglik_denetimi()")));
});

test("firma adresi: KİRACININ havuzu; kiracı işleminde vt_firma_dogrula, salt okunur, sunucuda süre sınırı; merkez ayrıca", async () => {
  const kiraci: KiraciYeri = { firmaId: randomUUID() };
  const k = kur({ kiraci });
  assert.deepEqual(await saglikDenetle(k.a), TAMAM);
  assert.deepEqual(k.istenen, [kiraci]);
  const sql = k.firma.cagrilar.map((c) => c.sql);
  assert.deepEqual(sql.slice(0, 2), ["BEGIN", "SELECT set_config('app.firma_id', $1, true), set_config('app.hesap_id', $2, true), vt_firma_dogrula($1::uuid)"]);
  assert.equal(k.firma.cagrilar[1]!.degerler?.[0], kiraci.firmaId);
  assert.deepEqual(sql.slice(2), ["SET TRANSACTION READ ONLY", "SELECT set_config('statement_timeout', $1, true)",
    "SELECT saglik_denetimi() || is_denetimi() AS s", "COMMIT"]);
  assert.equal(k.firma.cagrilar[3]!.degerler?.[0], String(SAGLIK.firmaMs));
  assert.ok(k.merkez.cagrilar.some((c) => c.sql.includes("saglik_denetimi()")), "merkez de denetlendi");
});

test("firmanın veritabanı geride ya da reddediyor → yalnız firma_vt yanlış, durum sorun; biçim aynı", async () => {
  const kiraci = { firmaId: randomUUID() };
  const geride = await saglikDenetle(kur({ kiraci, firma: sahteHavuz(saglikCevabi(GOC_EKSIK)) }).a);
  assert.deepEqual(geride, { ...TAMAM, durum: "sorun", denetimler: { ...TAMAM.denetimler, firma_vt: false } });
  const red = sahteHavuz((s) => { if (s.includes("vt_firma_dogrula")) throw hata("42501", "Bu veritabanı başka bir firmanın"); });
  const r = await saglikDenetle(kur({ kiraci, firma: red }).a);
  assert.deepEqual([r.durum, r.denetimler.firma_vt, r.denetimler.veritabani], ["sorun", false, true]);
  assert.ok(!red.cagrilar.some((c) => c.sql.includes("saglik_denetimi()")), "kimlik reddinden sonra veri okunmadı");
  assert.ok(red.cagrilar.some((c) => c.sql === "ROLLBACK"));
});

test("firma çözülemedi / havuz kurulamadı / merkez havuzu kurulamadı → uç düşmez, ilgili denetim yanlış, biçim aynı", async () => {
  const cozulemedi = await saglikDenetle({ ...kur().a, kiraciBul: async () => { throw hata("ECONNREFUSED"); } });
  assert.deepEqual([cozulemedi.durum, cozulemedi.denetimler.firma_vt, cozulemedi.denetimler.veritabani], ["sorun", false, true]);
  const havuzsuz = await saglikDenetle({ ...kur({ kiraci: { firmaId: randomUUID() } }).a, havuz: () => { throw new Error("Sır anahtarı tanımlı değil"); } });
  assert.deepEqual([havuzsuz.durum, havuzsuz.denetimler.firma_vt], ["sorun", false]);
  const merkezsiz = await saglikDenetle({ ...kur().a, merkez: () => { throw new Error("Veritabanı bağlantı ayarı yok"); } });
  assert.deepEqual([merkezsiz.durum, merkezsiz.denetimler.veritabani, merkezsiz.denetimler.firma_vt], ["sorun", false, true]);
  for (const r of [cozulemedi, havuzsuz, merkezsiz]) assert.deepEqual(Object.keys(r.denetimler), ANAHTARLAR);
});

test("cevap vermeyen firma veritabanı süre sınırında yanlış (uç asılmaz)", async () => {
  const asili = sahteHavuz(() => undefined, { baglan: () => new Promise<void>(() => {}) });
  const bas = Date.now();
  const r = await saglikDenetle(kur({ kiraci: { firmaId: randomUUID() }, firma: asili, ek: { firmaMs: 200 } }).a);
  const sure = Date.now() - bas;
  assert.deepEqual([r.durum, r.denetimler.firma_vt], ["sorun", false]);
  assert.ok(sure < 1_500, `süre: ${sure} ms`);
});

const sagliklari = (h: SahteHavuz) => h.cagrilar.filter((c) => c.sql.includes("saglik_denetimi()")).length;

/* 2026-10-15 (FV7 incelemesi, kasıtlı beklenti değişikliği): önceki başlık "sonuç önbelleğe alınmaz" idi — yayında artık firma sonucu önbellekte
   (aşağıdaki test); önbellek VERİLMEYEN çağrı (testler) her istekte sorar — [2, 2] o yolun beklentisi olarak kaldı */
test("aynı anda gelen istekler TEK sorguyu paylaşır (merkez ve firma); önbellek verilmezse sonraki istek yeniden sorar", async () => {
  const kiraci = { firmaId: randomUUID() };
  const merkez = sahteHavuz(saglikCevabi(IYI, 50)), firma = sahteHavuz(saglikCevabi(IYI, 50));
  const k = kur({ kiraci, merkez, firma });
  const sonuclar = await Promise.all(Array.from({ length: 5 }, () => saglikDenetle(k.a)));
  for (const r of sonuclar) assert.deepEqual(r, TAMAM);
  assert.deepEqual([sagliklari(merkez), sagliklari(firma), firma.baglanti], [1, 1, 1]);
  await saglikDenetle(k.a);
  assert.deepEqual([sagliklari(merkez), sagliklari(firma)], [2, 2], "önbelleksiz yol");
});

test("süre sınırı tek uçuşun DIŞINDA: süresi dolan iş askıdayken gelen istek yeni bağlantı / sorgu açmaz, aynı işi bekler (firma ve merkez)", async () => {
  const asili = sahteHavuz(() => undefined, { baglan: () => new Promise<void>(() => {}) });
  const merkezAsili = sahteHavuz(() => new Promise<never>(() => {}));
  const k = kur({ kiraci: { firmaId: randomUUID() }, firma: asili, merkez: merkezAsili, ek: { firmaMs: 100, merkezMs: 100 } });
  const bas = Date.now();
  for (let i = 0; i < 3; i++) {
    const r = await saglikDenetle(k.a);
    assert.deepEqual([r.durum, r.denetimler.veritabani, r.denetimler.firma_vt], ["sorun", false, false], `${i}`);
  }
  assert.ok(Date.now() - bas < 1_500, "her istek süresinde döndü");
  assert.equal(asili.baglanti, 1, "firma: askıdaki tek bağlanma — sonraki istekler yeni bağlantı açmadı");
  assert.equal(sagliklari(merkezAsili), 1, "merkez: askıdaki tek sorgu");
  /* kiracının çözümü (merkezde firma_coz) asılırsa da uç merkez süresinde döner, firma_vt yanlış */
  const cozumAsili = await saglikDenetle({ ...kur({ ek: { merkezMs: 100 } }).a, kiraciBul: () => new Promise<never>(() => {}) });
  assert.deepEqual([cozumAsili.durum, cozumAsili.denetimler.firma_vt, cozumAsili.denetimler.veritabani], ["sorun", false, true]);
});

test("yayındaki önbellekle: firma sonucu süresince yeniden sorulmaz (sağlam 10 sn, sorunlu 30 sn); bozuk parolada süre başına TEK deneme; merkez her istekte", async () => {
  let saat = 1_000_000;
  const onbellek = kayitOnbellegiKur<true>({ olumluSn: SAGLIK.olumluSn, olumsuzSn: SAGLIK.olumsuzSn, simdi: () => saat });
  assert.deepEqual([SAGLIK.olumluSn, SAGLIK.olumsuzSn], [10, 30]);
  const merkez = sahteHavuz(saglikCevabi(IYI)), firma = sahteHavuz(saglikCevabi(IYI));
  const k = kur({ kiraci: { firmaId: randomUUID() }, merkez, firma, ek: { onbellek } });
  assert.deepEqual(await saglikDenetle(k.a), TAMAM);
  assert.deepEqual(await Promise.all([saglikDenetle(k.a), saglikDenetle(k.a)]), [TAMAM, TAMAM]);
  /* merkez önbelleksiz: üç istek, iki sorgu (aynı anda gelen ikisi tek uçuşu paylaştı); firma tek sorgu, havuz bir kez istendi */
  assert.deepEqual([sagliklari(merkez), sagliklari(firma), firma.baglanti, k.istenen.length], [2, 1, 1, 1], "süre içinde firmaya gidilmedi, havuz istenmedi");
  saat += SAGLIK.olumluSn * 1_000 - 1;
  await saglikDenetle(k.a);
  assert.equal(sagliklari(firma), 1, "10 sn dolmadan");
  saat += 2;
  await saglikDenetle(k.a);
  assert.equal(sagliklari(firma), 2, "10 sn dolunca yeniden");

  /* parolası bozuk firma: her oturumsuz istek bir hatalı parola denemesi olmasın (Supabase yasağı) */
  const bozuk = sahteHavuz(() => undefined, { baglan: async () => { throw hata("28P01", "password authentication failed"); } });
  const b = kur({ kiraci: { firmaId: randomUUID() }, firma: bozuk, ek: { onbellek } });
  const bas = saat;
  for (let i = 0; i < 5; i++) assert.equal((await saglikDenetle(b.a)).denetimler.firma_vt, false);
  assert.equal(bozuk.baglanti, 1, "beş istek, tek bağlanma denemesi");
  saat = bas + SAGLIK.olumsuzSn * 1_000 - 1;
  await saglikDenetle(b.a);
  assert.equal(bozuk.baglanti, 1, "30 sn dolmadan (sağlam sonucun 10 sn'si geçti)");
  saat = bas + SAGLIK.olumsuzSn * 1_000 + 1;
  await saglikDenetle(b.a);
  assert.equal(bozuk.baglanti, 2, "30 sn dolunca yeniden");

  /* firma adresi olmayan istek önbelleğe yazmaz (bilinmeyen adlar belleği şişiremez) */
  const once = onbellek.boyut;
  await saglikDenetle(kur({ ek: { onbellek } }).a);
  assert.equal(onbellek.boyut, once);
});

/* ── /api/saglik/projeler çekirdeği ──────────────────────────────────────────────────────────────────────────────────────────────────── */
/** merkez sahtesi: goc_hedefleri satırları + UPDATE'in parametresi (yazılan sonuçlar) */
function merkezSahtesi(satirlar: Record<string, unknown>[], o: { yazmaHatasi?: boolean } = {}) {
  const yazilan: { firma_id: string; s: Record<string, unknown> }[][] = [];
  const h = sahteHavuz((sql, d) => {
    if (sql.includes("goc_hedefleri()")) return { rows: satirlar, rowCount: satirlar.length };
    if (/^\s*UPDATE firma_vt/.test(sql)) {
      if (o.yazmaHatasi) throw hata("42501", "permission denied for table firma_vt");
      const l = JSON.parse(String(d![0])) as { firma_id: string; s: Record<string, unknown> }[];
      yazilan.push(l);
      return { rows: [], rowCount: l.length };
    }
    return undefined;
  });
  return { h, yazilan };
}

test("projeler: kurulumu bitmemiş yoklanmaz / sayılmaz; en çok 4 aynı anda; neden sırsız; yazma tek UPDATE; merkez merkezOku + yönetim rolü", async () => {
  const anahtar = randomBytes(32);
  const tamamlar = Array.from({ length: 6 }, () => hedefSatiri(anahtar));
  const eksikKayit = hedefSatiri(anahtar, { sunucu: null });
  const kurulumda = hedefSatiri(anahtar, { kurulum_durum: "calisiyor", parola_sifreli: null, sunucu: null });
  const m = merkezSahtesi([...tamamlar, eksikKayit, kurulumda]);
  let acik = 0, enCok = 0;
  const okunan: string[] = [];
  const r = await projeleriYokla({
    merkez: m.h, anahtar: () => anahtar, merkezYerel: true, surum: "deneme",
    oku: async (ayar, firmaId) => {
      okunan.push(firmaId);
      assert.equal(ayar.user, "probata_uygulama");
      assert.equal(ayar.password, `parola-${firmaId.slice(0, 8)}`, "parola bellekte çözüldü");
      acik++; enCok = Math.max(enCok, acik);
      await new Promise((coz) => setTimeout(coz, 30));
      acik--;
      if (firmaId === tamamlar[1]!.firma_id) return GOC_EKSIK;
      if (firmaId === tamamlar[2]!.firma_id) throw Object.assign(new Error(`connect ECONNREFUSED 127.0.0.1:5432 ${SIR}`), { code: "ECONNREFUSED" });
      return IYI;
    },
  });
  assert.deepEqual(r, { toplam: 7, tamam: 4, sorunlu: 3 });
  assert.deepEqual(Object.keys(r), ["toplam", "tamam", "sorunlu"]);
  assert.equal(enCok, SAGLIK.ayniAnda, "en çok 4 aynı anda");
  assert.deepEqual(okunan.sort(), tamamlar.map((t) => String(t.firma_id)).sort(), "kayıtsız ve kurulumdaki okunmadı");
  assert.equal(m.yazilan.length, 1, "tek UPDATE");
  const yazilan = new Map(m.yazilan[0]!.map((x) => [x.firma_id, x.s]));
  assert.equal(yazilan.size, 7);
  assert.ok(!yazilan.has(String(kurulumda.firma_id)), "kurulumdaki yazılmaz");
  assert.deepEqual(yazilan.get(String(tamamlar[0]!.firma_id)), {
    durum: "tamam", surum: "deneme", goc: { son: SON_GOC, sayi: GOC_SAYISI },
    denetimler: { veritabani: true, goc_guncel: true, rls: true, api_kapali: true, uygulama_kisitli: true, isler: true, kimlik: true },
  });
  assert.equal(yazilan.get(String(tamamlar[1]!.firma_id))!.neden, "düşen: goc_guncel");
  assert.equal(yazilan.get(String(tamamlar[2]!.firma_id))!.neden, "bağlantı reddedildi (ECONNREFUSED)");
  assert.match(String(yazilan.get(String(eksikKayit.firma_id))!.neden), /^bağlantı kaydı eksik/);
  const metin = JSON.stringify(m.yazilan);
  assert.ok(!metin.includes(SIR) && !metin.includes("127.0.0.1") && !/v1\.[A-Za-z0-9_-]+\./.test(metin), "yazılanda sır / sunucu / şifreli metin yok");
  const sql = m.h.cagrilar.map((c) => c.sql.trim().split("\n")[0]!.trim());
  const SURE = "SELECT set_config('statement_timeout', $1, true)";
  assert.deepEqual(sql.slice(0, 6), ["BEGIN READ ONLY", "SELECT set_config('app.firma_id', '', true), set_config('app.hesap_id', '', true), vt_merkez_dogrula()",
    "SET LOCAL ROLE probata_yonetim", SURE, sql[4], "COMMIT"]);
  assert.match(sql[4]!, /FROM goc_hedefleri\(\)$|^SELECT firma_id::text/);
  assert.deepEqual(sql.slice(6), ["BEGIN", "SELECT set_config('app.firma_id', '', true), set_config('app.hesap_id', '', true), set_config('app.yonetici_id', $1, true)",
    "SET LOCAL ROLE probata_yonetim", SURE, "UPDATE firma_vt v SET son_saglik = x.s, son_saglik_zaman = now()", "COMMIT"]);
  const sureler = m.h.cagrilar.filter((c) => c.sql === SURE).map((c) => c.degerler?.[0]);
  assert.deepEqual(sureler, [String(SAGLIK.merkezMs), String(SAGLIK.merkezMs)], "merkez okuma ve yazma sunucuda süre sınırlı");
});

/* 2026-10-15 (FV7 incelemesi, kasıtlı beklenti değişikliği): tek bitiş zamanı — proje ancak süresi (projeMs) bitişe sığarsa başlar ve süresi dolan
   projenin arkadaki işi bitişe dek beklenir; önce "başlangıçtan beri geçen < toplamMs" yeterdi ve arkadaki iş beklenmezdi. Bu yüzden iki koşu da
   projeMs ve toplamMs'i birlikte verir (yeni kuralla varsayılan 5 sn'lik proje süresi 100 ms'lik bitişe hiç sığmazdı). */
test("projeler: proje başına süre (cevap vermeyen kesilir, işçisi bitişte bırakır); süresi bitişe sığmayan proje başlamaz, sorunlu sayılır, yazılmaz", async () => {
  const anahtar = randomBytes(32);
  const l = Array.from({ length: 6 }, () => hedefSatiri(anahtar));
  const m = merkezSahtesi(l);
  const bas = Date.now();
  const r = await projeleriYokla({
    merkez: m.h, anahtar: () => anahtar, merkezYerel: true, projeMs: 200, toplamMs: 600,
    oku: (_a, id) => (id === l[0]!.firma_id ? new Promise<never>(() => {}) : Promise.resolve(IYI)),
  });
  assert.ok(Date.now() - bas < 1_500, "asılı proje süresinde kesildi, işçisi bitişte bıraktı");
  assert.deepEqual(r, { toplam: 6, tamam: 5, sorunlu: 1 });
  assert.match(String(m.yazilan[0]!.find((x) => x.firma_id === l[0]!.firma_id)!.s.neden), /zaman aşımı/);

  const m2 = merkezSahtesi(l);
  const r2 = await projeleriYokla({
    merkez: m2.h, anahtar: () => anahtar, merkezYerel: true, projeMs: 200, toplamMs: 300,
    oku: async () => { await new Promise((coz) => setTimeout(coz, 150)); return IYI; },
  });
  assert.deepEqual(r2, { toplam: 6, tamam: 4, sorunlu: 2 }, "ilk dördü yoklandı, kalan ikisinin süresi bitişe sığmadı — sorunlu");
  assert.equal(m2.yazilan[0]!.length, 4, "yoklanmayan yazılmaz");
});

test("projeler: süresi dolan projenin arkadaki işi bitene dek işçi yeni projeye geçmez — açık firma bağlantısı en çok 4", async () => {
  const anahtar = randomBytes(32);
  const l = Array.from({ length: 8 }, () => hedefSatiri(anahtar));
  const m = merkezSahtesi(l);
  let acik = 0, enCok = 0;
  const bas = Date.now();
  const r = await projeleriYokla({
    merkez: m.h, anahtar: () => anahtar, merkezYerel: true, projeMs: 50, toplamMs: 5_000,
    oku: () => {
      acik++; enCok = Math.max(enCok, acik);
      return new Promise((coz) => setTimeout(() => { acik--; coz(IYI); }, 250));
    },
  });
  assert.deepEqual(r, { toplam: 8, tamam: 0, sorunlu: 8 }, "hepsi süresinde bitmedi");
  assert.equal(enCok, SAGLIK.ayniAnda, "arkadaki işler de sayıldı — en çok 4 açık");
  assert.ok(Date.now() - bas < 2_500);
  for (const x of m.yazilan[0]!) assert.match(String(x.s.neden), /zaman aşımı/);
});

test("projeler: merkez okuması ya da yazması süresinde bitmezse hata (uç 503) — uç asılmaz", async () => {
  const anahtar = randomBytes(32);
  const okumaAsili = sahteHavuz((sql) => (sql.includes("goc_hedefleri()") ? new Promise<never>(() => {}) : undefined));
  let bas = Date.now();
  await assert.rejects(projeleriYokla({ merkez: okumaAsili, anahtar: () => anahtar, merkezYerel: true, merkezMs: 100, oku: async () => IYI }), /timeout/);
  assert.ok(Date.now() - bas < 1_500, "okuma süresinde kesildi");
  const satir = hedefSatiri(anahtar);
  const yazmaAsili = sahteHavuz((sql) => (sql.includes("goc_hedefleri()") ? { rows: [satir], rowCount: 1 }
    : /^\s*UPDATE firma_vt/.test(sql) ? new Promise<never>(() => {}) : undefined));
  bas = Date.now();
  await assert.rejects(projeleriYokla({ merkez: yazmaAsili, anahtar: () => anahtar, merkezYerel: true, merkezMs: 100, oku: async () => IYI }), /timeout/);
  assert.ok(Date.now() - bas < 1_500, "yazma süresinde kesildi");
});

test("firmadan gelen göç bilgisi biçimi tutmazsa merkeze yazılmaz (null): serbest / dev metin, biçim dışı ad, negatif / kesirli / dev sayı", async () => {
  const dev = "x".repeat(100_000);
  const durumlar: [unknown, unknown, { son: string | null; sayi: number | null }][] = [
    [SON_GOC, GOC_SAYISI, { son: SON_GOC, sayi: GOC_SAYISI }],
    [SON_GOC, String(GOC_SAYISI), { son: SON_GOC, sayi: GOC_SAYISI }],
    [null, 0, { son: null, sayi: 0 }],
    [dev, -1, { son: null, sayi: null }],
    [`${SON_GOC}; <b>yönetim ekranı</b>`, 1.5, { son: null, sayi: null }],
    [`0096_${"a".repeat(81)}.sql`, 1e9, { son: null, sayi: null }],
    ["../0096_merkez_kaydi.sql", "97; --", { son: null, sayi: null }],
    [{ ad: SON_GOC }, null, { son: null, sayi: null }],
  ];
  for (const [son, sayi, beklenen] of durumlar) {
    assert.deepEqual(gocBilgisi({ ...IYI, son_goc: son as string, goc_sayisi: sayi as number }), beklenen, JSON.stringify([son, sayi]).slice(0, 80));
  }
  const anahtar = randomBytes(32);
  const m = merkezSahtesi([hedefSatiri(anahtar)]);
  assert.deepEqual(await projeleriYokla({ merkez: m.h, anahtar: () => anahtar, merkezYerel: true, oku: async () => ({ ...IYI, son_goc: dev, goc_sayisi: -1 }) }),
    { toplam: 1, tamam: 0, sorunlu: 1 });
  assert.deepEqual(m.yazilan[0]![0]!.s.goc, { son: null, sayi: null });
  assert.ok(JSON.stringify(m.yazilan).length < 1_000, "dev metin merkeze gitmedi");
});

test("projeler: ana anahtar yok / merkez yayında + yerel adres → firmaya bağlanılmaz, hepsi sorunlu; hedef yoksa anahtar okunmaz, yazılmaz", async () => {
  const anahtar = randomBytes(32);
  const l = [hedefSatiri(anahtar), hedefSatiri(anahtar)];
  let okundu = 0;
  const oku = async () => { okundu++; return IYI; };
  const m = merkezSahtesi(l);
  assert.deepEqual(await projeleriYokla({ merkez: m.h, anahtar: () => { throw new Error("Sır anahtarı tanımlı değil (PROBATA_SIR_ANAHTARI, 32 bayt base64)"); }, merkezYerel: true, oku }),
    { toplam: 2, tamam: 0, sorunlu: 2 });
  assert.match(String(m.yazilan[0]![0]!.s.neden), /^bağlantı kaydı: uygulama parolası çözülemedi/);
  /* anahtar yokken asıl neden anahtar — kaydın öteki denetimleri (burada yerel adres, merkez yayında) önce gelmez */
  const ya = merkezSahtesi(l);
  await projeleriYokla({ merkez: ya.h, anahtar: () => { throw new Error("Sır anahtarı tanımlı değil (PROBATA_SIR_ANAHTARI, 32 bayt base64)"); }, merkezYerel: false, oku });
  assert.match(String(ya.yazilan[0]![0]!.s.neden), /^bağlantı kaydı: uygulama parolası çözülemedi/);
  const y = merkezSahtesi(l);
  assert.deepEqual(await projeleriYokla({ merkez: y.h, anahtar: () => anahtar, merkezYerel: false, oku }), { toplam: 2, tamam: 0, sorunlu: 2 });
  assert.equal(y.yazilan[0]![0]!.s.neden, "bağlantı kaydı: yerel adres (merkez yayında)");
  assert.equal(okundu, 0, "firmaya bağlanılmadı");
  const bos = merkezSahtesi([]);
  let anahtarOkundu = 0;
  assert.deepEqual(await projeleriYokla({ merkez: bos.h, anahtar: () => { anahtarOkundu++; return anahtar; }, merkezYerel: true, oku }), { toplam: 0, tamam: 0, sorunlu: 0 });
  assert.deepEqual([anahtarOkundu, bos.yazilan.length], [0, 0]);
  assert.ok(!bos.h.cagrilar.some((c) => /UPDATE/.test(c.sql)));
});

test("projeler: merkez yazamazsa hata (uç 503 — sayı uydurulmaz)", async () => {
  const anahtar = randomBytes(32);
  const m = merkezSahtesi([hedefSatiri(anahtar)], { yazmaHatasi: true });
  await assert.rejects(projeleriYokla({ merkez: m.h, anahtar: () => anahtar, merkezYerel: true, oku: async () => IYI }), (h: { code?: string }) => h.code === "42501");
});

/* ── uçların metni ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
test("uçlar: sağlık kiracıyı yalnız Host'tan alır; projeler ucunun ilk işi zamanliYetkili, yanıtı yalnız sayılar; çekirdek ve veritabanı kapıları", () => {
  assert.deepEqual(saglikUcuEksikleri({
    ucu: oku("src/app/api/saglik/route.ts"), projeler: oku("src/app/api/saglik/projeler/route.ts"), cekirdek: oku("src/server/saglik.ts"), vt: oku("src/server/db/saglik.ts"),
  }), []);
  /* 2026-10-15 (FV7 incelemesi): klasörün HER düzeyi — önce yalnız ilk düzeydeki klasörlere bakılıyordu (projeler/<x>/route.ts kaçardı) */
  assert.deepEqual(saglikKlasoruEksikleri(dosyalar("src/app/api/saglik", [""])), []);
});

/* ── tools/duman.mjs ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
const PROJELER_SATIRI = "proje sağlığı: her kendi projeli firma veritabanı (sorunlu 0)";

test("duman: sırla projeler ucu Authorization ile BİR kez yoklanır; sorunlu 0 → geçer; sır çıktıya yazılmaz; denetim sayısı 12", async () => {
  const site = await sahteSite({ status: 200, govde: { toplam: 2, tamam: 2, sorunlu: 0 } });
  try {
    const d = await dumanKos(`http://127.0.0.1:${site.kapi}`, SIR);
    const p = site.istekler.filter((i) => i.yol === "/api/saglik/projeler");
    assert.deepEqual(p, [{ yol: "/api/saglik/projeler", yetki: `Bearer ${SIR}` }]);
    assert.ok(site.istekler.filter((i) => i.yol !== "/api/saglik/projeler").every((i) => i.yetki === undefined), "sır yalnız projeler ucuna");
    assert.match(d.cikti, new RegExp(`^✔ ${PROJELER_SATIRI.replace(/[()]/g, "\\$&")}$`, "m"));
    assert.match(d.cikti, /\/12 denetim/);
    assert.ok(!d.cikti.includes(SIR) && !d.hata.includes(SIR), "sır çıktıda");
  } finally { await site.kapat(); }
});

test("duman: sorunlu proje (503 ya da 200 + sorunlu > 0) → düşer, sayılarla", async () => {
  for (const [status, govde] of [[503, { toplam: 2, tamam: 1, sorunlu: 1 }], [200, { toplam: 2, tamam: 1, sorunlu: 1 }], [401, { hata: "Yetkisiz." }]] as const) {
    const site = await sahteSite({ status, govde });
    try {
      const d = await dumanKos(`http://127.0.0.1:${site.kapi}`, SIR);
      assert.match(d.cikti, new RegExp(`^✖ ${PROJELER_SATIRI.replace(/[()]/g, "\\$&")} — HTTP ${status}`, "m"), `${status}`);
      assert.equal(d.kod, 1);
      assert.ok(!d.cikti.includes(SIR));
    } finally { await site.kapat(); }
  }
});

test("duman: sırsız → projeler ucu hiç istenmez, 'atlandı' satırı, sayıya girmez (11)", async () => {
  const site = await sahteSite({ status: 200, govde: { toplam: 0, tamam: 0, sorunlu: 0 } });
  try {
    const d = await dumanKos(`http://127.0.0.1:${site.kapi}`, undefined);
    assert.equal(site.istekler.filter((i) => i.yol === "/api/saglik/projeler").length, 0);
    assert.ok(site.istekler.some((i) => i.yol === "/api/saglik"), "sağlık ucu yine yoklandı");
    assert.match(d.cikti, new RegExp(`^– atlandı: ${PROJELER_SATIRI.replace(/[()]/g, "\\$&")} — PROBATA_DUMAN_SIR yok$`, "m"));
    assert.match(d.cikti, /\/11 denetim/);
  } finally { await site.kapat(); }
});

test("duman: sır yerel olmayan http adresine GÖNDERİLMEZ (istek yapılmaz, denetim düşer)", async (t) => {
  let site: Awaited<ReturnType<typeof sahteSite>>;
  try { site = await sahteSite({ status: 200, govde: { toplam: 0, tamam: 0, sorunlu: 0 } }, "::1"); } catch {
    t.skip("IPv6 yerel adres yok");
    return;
  }
  try {
    const d = await dumanKos(`http://[::1]:${site.kapi}`, SIR);
    assert.equal(site.istekler.filter((i) => i.yol === "/api/saglik/projeler").length, 0, "projeler ucu istenmedi");
    assert.ok(site.istekler.every((i) => i.yetki === undefined), "hiçbir istekte sır yok");
    assert.match(d.cikti, /^✖ proje sağlığı: .* — sır yalnız https:\/\/<ad>\.probata\.com\.tr ya da yerel http adrese gönderilir — istek yapılmadı$/m);
    assert.ok(!d.cikti.includes(SIR));
  } finally { await site.kapat(); }
});

/* 2026-10-15 (FV7 incelemesi): önce her https adresine gidiyordu — yazım hatalı ya da benzer alan adı sırrı yabancı sunucuya teslim ederdi */
test("duman: sır ürünün alt adresi olmayan https adresine GÖNDERİLMEZ (istek yapılmaz, denetim düşer)", async () => {
  const site = await sahteSite({ status: 200, govde: { toplam: 0, tamam: 0, sorunlu: 0 } });
  try {
    const d = await dumanKos(`https://127.0.0.1:${site.kapi}`, SIR);
    assert.ok(site.istekler.every((i) => i.yetki === undefined), "hiçbir istekte sır yok");
    assert.match(d.cikti, /^✖ proje sağlığı: .* — sır yalnız https:\/\/<ad>\.probata\.com\.tr ya da yerel http adrese gönderilir — istek yapılmadı$/m);
    assert.equal(d.kod, 1);
    assert.ok(!d.cikti.includes(SIR) && !d.hata.includes(SIR));
  } finally { await site.kapat(); }
});

/* 2026-10-15 (FV7 incelemesi): gömülü satır sonu / NUL'lu sırda fetch "Headers.append: ... is an invalid header value." fırlatıyor, iletide sır
   açıkça duruyordu ve ileti çıktıya yazılıyordu (sır sızardı) */
test("duman: biçimi bozuk sır (gömülü satır sonu) gönderilmez; sırrın hiçbir parçası çıktıya yazılmaz", async () => {
  const site = await sahteSite({ status: 200, govde: { toplam: 0, tamam: 0, sorunlu: 0 } });
  const on = randomBytes(12).toString("hex"), son = randomBytes(12).toString("hex");
  try {
    const d = await dumanKos(`http://127.0.0.1:${site.kapi}`, `${on}\r\n${son}`);
    assert.equal(site.istekler.filter((i) => i.yol === "/api/saglik/projeler").length, 0, "projeler ucu istenmedi");
    assert.match(d.cikti, /^✖ proje sağlığı: .* — PROBATA_DUMAN_SIR biçimi geçersiz .* — istek yapılmadı$/m);
    for (const p of [on, son]) assert.ok(!d.cikti.includes(p) && !d.hata.includes(p), "sırrın parçası çıktıda");
  } finally { await site.kapat(); }
});
