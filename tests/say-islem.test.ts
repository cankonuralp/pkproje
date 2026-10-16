/* NEREDEN GELDİ: pkproje §9 "2026-10-15 akşam — S.A.Y CLAUDE GİBİ" (reisim: "adam zaten bizim kodun içinde", "bu sayfa açık değil falan demesin";
   karar (2): "kullanıcının oturumu ve sunucunun bugünkü denetimi aynen (ayrı kural yok)") — 2. adım a (2026-10-16). S.A.Y'ın işlem kataloğu
   (src/modules/say/islem-katalogu.ts) ve yürütücüsü (src/server/yz/islem.ts) GERÇEK PostgreSQL'de, iki firma:
   1. plan aç: planlamacının işlemi tuşun işleviyle aynı sonuç (proje no, ekip, tesisin ekipmanı); muhasebe ve denetçi modülün KENDİ yetki hatasıyla
      reddedilir, plan açılmaz; şemaya uymayan girdi modüle gitmez;
   2. başka firma: B'nin kullanıcısı A'nın planını göremez, A'nın tesisine plan açamaz, A'nın müşterisini bulamaz; girdiye yazılan kişi / firma
      yok sayılır (iş oturumun firmasında);
   3. plan kabul: yalnız plandaki denetçi (beyan özetiyle); rapor aç: plandaki denetçi; rapor yaz (ekranda açık OLMAYAN rapor): ekranın denetimiyle
      yazılır ve raporKaydet ile kaydedilir (sürüm kilidi aynen); ekranda açık rapora işlem yazmaz; yazmayan kişi nedeniyle, başka firma göremez;
   4. müşteri ara sayfalı ("sonraki"); müşteri kaydet ekler / günceller (verilmeyen alan korunur), "gör" düzeyi yazamaz.
   2026-10-16 (2. adım a incelemesi): plan açılınca ekranın uyarıları sonuçta; beyan özeti olmadan kabul yok (tuş ve çevrimdışı yol gibi); ekranda açık,
   kaydedilmemiş rapor künye güncellemesiyle ezilmez; hiçbir şey değiştirmeyen rapor yazması "değişiklik yok" (iş sayılmaz).
   2026-10-16 (2. adım b): 5–6 — kalan modüllerin her birinden yazma + okuma (tuşun işleviyle aynı sonuç) ve yetkisiz rolün modülün kendi reddi;
   Firma ayarları okumasında anahtarın yalnız "tanımlı mı" bilgisi.
   Saf kilitler: tests/say-islem-katalog.test.ts, tests/say-islem-yurutucu.test.ts; olumsuz kanıt: tests/bozan/say-islem.bozan.ts. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { ISLEM_KATALOGU } from "../src/modules/say/islem-katalogu.ts";
import { EKRAN_KAYDEDILMEMIS, GORUNMEZ, islemYurut, type IslemCevabi, type IslemKisisi, type IslemOrtami } from "../src/server/yz/islem.ts";
import { bugunTr } from "../src/modules/planlar/server/planlar.ts";
import { sahaRaporu } from "../src/modules/raporlar/server/raporlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "say-islem-depo-"));
const depo = klasorDepo(klasor);
const bugun = bugunTr();
const kisi = (id: string, ...roller: string[]): IslemKisisi => ({ id, ad: "Deneme", roller: roller as IslemKisisi["roller"] });
interface Firma { plan: IslemKisisi; yon: IslemKisisi; muh: IslemKisisi; den1: IslemKisisi; den2: IslemKisisi; den1P: string; tesis: string; tur: string; ekipman: string }
let FA: Firma, FB: Firma;

async function firmaKur(firma: string, ek: string, sayfaMusterisi: number): Promise<Firma> {
  const f = await kiraciIcinde(havuz, firma, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Sanayi A.Ş.', 'Deneme') RETURNING id::text");
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce) VALUES ($1, 'Merkez', 'Deneme Cad. 1', 'Ankara', 'Çankaya') RETURNING id::text", [m]);
    const per = (ad: string) => q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ($1, '2024-01-01', 'mak-muh', '123') RETURNING id::text", [ad]);
    const k = async (eposta: string, rol: string, personel: string | null = null) => kisi(await q(
      "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [`${eposta}@${ek}.example`, [rol], personel]), rol);
    const den1P = await per("Deneme Bir"), den2P = await per("Deneme İki");
    const den1 = await k("den1", "denetci", den1P), den2 = await k("den2", "denetci", den2P);
    const plan = await k("plan", "planlama"), yon = await k("yon", "firma_yoneticisi"), muh = await k("muh", "muhasebe");
    const tur = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
    const ekipman = await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'x') RETURNING id::text", [tesis, tur, `HT-${ek.slice(-1).toUpperCase()}1`]);
    for (let i = 1; i <= sayfaMusterisi; i++) await q("INSERT INTO musteri (unvan, kisa) VALUES ($1, $1) RETURNING id::text", [`Sayfa Müşteri ${String(i).padStart(2, "0")}`]);
    return { plan, yon, muh, den1, den2, den1P, tesis, tur, ekipman };
  });
  /* Hava tankı: KOMPRESOR şablonundan yayında format (yayınlayan hesap veritabanında damgalanır → yöneticinin bağlamıyla) */
  await kiraciIcinde(havuz, firma, async (db) => {
    const t = await taslakBaslat(db, f.yon, f.tur, "sablon:KOMPRESOR", null);
    if (t.durum !== "tamam") throw new Error(JSON.stringify(t));
    const y = await yayinla(db, f.yon, t.id, t.surum, "");
    if (y.durum !== "tamam") throw new Error(JSON.stringify(y));
  }, { hesapId: f.yon.id });
  return f;
}

/** S.A.Y'ın işlemi: ortam OTURUMDAN (kişi, firma) — eylemin kurduğu gibi; her işlem kendi kiracı işleminde */
const ortam = (firma: string, kim: IslemKisisi, ek: Partial<IslemOrtami> = {}): IslemOrtami => ({
  islet: <T,>(is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, firma, is, { hesapId: kim.id }),
  kim, firmaId: firma, depo: () => depo, kok: null, ekrandakiRapor: null, epostaGonder: () => undefined, ...ek,
});
const isle = async (firma: string, kim: IslemKisisi, ad: string, girdi: unknown, ek: Partial<IslemOrtami> = {}): Promise<IslemCevabi> =>
  (await islemYurut(ISLEM_KATALOGU, ortam(firma, kim, ek), ad, girdi)).cevap;
const tamam = (c: IslemCevabi): Record<string, unknown> => { assert.ok(c.tamam, JSON.stringify(c)); return (c.tamam ? c.sonuc : {}) ?? {}; };
const neden = (c: IslemCevabi) => (c.tamam ? assert.fail(`yapılmamalıydı: ${JSON.stringify(c)}`) : c.neden);
const say = async (firma: string, sql: string, p: unknown[] = []) =>
  Number((await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ n: string }>(sql, p))).rows[0].n);
const planGirdisi = (f: Firma) => ({ tesis: f.tesis, baslangic: bugun, bitis: bugun, aciklama: null, ekip: [{ personel: f.den1P, isgNo: null }] });

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  FA = await firmaKur(A, "deneme-a", 22);
  FB = await firmaKur(B, "deneme-b", 0);
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("1. plan aç: planlamacı açar (tuşun işlevi — numara, ekip, ekipman); muhasebe / denetçi modülün kendi yetki hatasıyla reddedilir; geçersiz girdi modüle gitmez", async () => {
  const sonuc = tamam(await isle(A, FA.plan, "plan_ac", planGirdisi(FA)));
  assert.match(String(sonuc.no), /^P-\d{4}-\d{3}$/);
  assert.equal(await say(A, "SELECT count(*) AS n FROM plan WHERE id = $1 AND durum = 'bekliyor'", [sonuc.id]), 1);
  assert.equal(await say(A, "SELECT count(*) AS n FROM plan_ekip WHERE plan_id = $1 AND personel_id = $2", [sonuc.id, FA.den1P]), 1, "ekip");
  assert.equal(await say(A, "SELECT count(*) AS n FROM plan_ekipman WHERE plan_id = $1 AND ekipman_id = $2", [sonuc.id, FA.ekipman]), 1, "tesisin ekipmanı plana girdi");
  assert.equal(await say(A, "SELECT count(*) AS n FROM denetim_izi WHERE ne = 'plan.ac'"), 1, "denetim izi modülün yazıcısından");
  /* ekranın gösterdiği uyarılar (engel değil) S.A.Y'a da: ekipte İSG-KATİP ID'si yok */
  assert.ok((sonuc.uyarilar as string[] | undefined)?.some((u) => u.includes("İSG-KATİP SÖZLEŞME ID'si yok")), JSON.stringify(sonuc));
  const once = await say(A, "SELECT count(*) AS n FROM plan");
  for (const k of [FA.muh, FA.den1]) assert.equal(neden(await isle(A, k, "plan_ac", planGirdisi(FA))), "Bu işlem için yetkiniz yok.", k.roller.join());
  const g = await isle(A, FA.plan, "plan_ac", { ...planGirdisi(FA), baslangic: "yarın" });
  assert.ok(!g.tamam && g.hatalar?.baslangic, JSON.stringify(g));
  assert.equal(await say(A, "SELECT count(*) AS n FROM plan"), once, "reddedilen ve geçersiz istekte plan açılmadı");
  /* okuma: planlamacı planı bulur ve getirir; muhasebe Planlar'ı hiç göremez */
  const ara = tamam(await isle(A, FA.plan, "plan_ara", { ara: String(sonuc.no) }));
  assert.deepEqual((ara.planlar as { id: string }[]).map((p) => p.id), [sonuc.id]);
  assert.equal(tamam(await isle(A, FA.plan, "plan_getir", { plan: sonuc.id })).no, sonuc.no);
  assert.match(neden(await isle(A, FA.muh, "plan_ara", {})), /göremiyor/);
});

test("2. başka firma: B A'nın planını göremez, A'nın tesisine plan açamaz, A'nın müşterisini bulamaz; girdideki kişi / firma yok sayılır", async () => {
  const pa = tamam(await isle(A, FA.plan, "plan_ac", planGirdisi(FA)));
  const aOnce = await say(A, "SELECT count(*) AS n FROM plan"), bOnce = await say(B, "SELECT count(*) AS n FROM plan");
  assert.equal(neden(await isle(B, FB.plan, "plan_getir", { plan: pa.id })), GORUNMEZ);
  const sahte = { kim: FA.plan, firmaId: A, firma: A, hesapId: FA.plan.id };
  const ac = await isle(B, FB.plan, "plan_ac", { ...planGirdisi(FA), ...sahte });
  assert.ok(!ac.tamam && ac.hatalar?.tesis, JSON.stringify(ac));
  assert.deepEqual([await say(A, "SELECT count(*) AS n FROM plan"), await say(B, "SELECT count(*) AS n FROM plan")], [aOnce, bOnce], "hiçbir firmada plan açılmadı");
  assert.equal(tamam(await isle(B, FB.plan, "musteri_ara", { ara: "Sayfa Müşteri" })).toplam, 0, "A'nın müşterileri B'de yok");
  /* girdiye A'nın kimliği yazılsa da iş oturumun firmasında (B) ve oturumun kişisiyle */
  const pb = tamam(await isle(B, FB.plan, "plan_ac", { ...planGirdisi(FB), ...sahte }));
  assert.equal(await say(B, "SELECT count(*) AS n FROM plan WHERE id = $1", [pb.id]), 1);
  assert.equal(await say(A, "SELECT count(*) AS n FROM plan WHERE id = $1", [pb.id]), 0);
  assert.equal(await say(A, "SELECT count(*) AS n FROM plan"), aOnce);
});

test("3. plan kabul (yalnız plandaki denetçi), rapor aç, rapor yaz: ekranın denetimiyle yazılır ve kaydedilir; ekranda açık rapora işlem yazmaz; yazmayan / başka firma", async () => {
  const p = tamam(await isle(A, FA.plan, "plan_ac", planGirdisi(FA)));
  const v = tamam(await isle(A, FA.den1, "plan_getir", { plan: p.id }));
  const kabul = { plan: p.id, surum: v.surum, beyan_onay: true, beyan_ozet: v.beyan_ozet };
  assert.equal(neden(await isle(A, FA.plan, "plan_kabul", kabul)), "Bu işlem için yetkiniz yok.", "planlamacı kabul edemez (plandaki denetçi değil)");
  assert.equal(neden(await isle(A, FA.den2, "plan_kabul", kabul)), GORUNMEZ, "ekipte olmayan denetçi planı görmez");
  /* beyan özeti olmadan kabul yok (tuşun eylemi ve çevrimdışı plan.kabul gibi — metin okunmadan "beyan onaylandı" izi yazılmaz) */
  const ozetsiz = await isle(A, FA.den1, "plan_kabul", { plan: p.id, surum: v.surum, beyan_onay: true });
  assert.ok(!ozetsiz.tamam && ozetsiz.hatalar?.beyan_ozet, JSON.stringify(ozetsiz));
  assert.equal(await say(A, "SELECT count(*) AS n FROM plan WHERE id = $1 AND durum = 'bekliyor'", [p.id]), 1, "kabul edilmedi");
  tamam(await isle(A, FA.den1, "plan_kabul", kabul));
  const r = tamam(await isle(A, FA.den1, "rapor_ac", { plan: p.id, ekipman: FA.ekipman }));
  const rapor = String(r.id);
  /* ekranda açık, kaydedilmemiş rapor plan bilgisi güncellemesiyle ezilmez (önce ekranın kaydı); kaydedilmişse işlem yapılır */
  assert.equal(neden(await isle(A, FA.den1, "plan_kunye_guncelle", { plan: p.id }, { ekrandakiRapor: rapor, kaydedilmemis: true })), EKRAN_KAYDEDILMEMIS);
  const kg = await isle(A, FA.den1, "plan_kunye_guncelle", { plan: p.id }, { ekrandakiRapor: rapor });
  assert.ok(kg.tamam, JSON.stringify(kg));
  const g = tamam(await isle(A, FA.den1, "rapor_getir", { rapor }));
  assert.equal(g.yazilabilir, true);
  const yer = /^- (e:(?:seri|marka|model)) · /m.exec(String(g.harita))?.[1];
  assert.ok(yer, String(g.harita).slice(0, 600));
  const alan = yer.slice(2) as "seri" | "marka" | "model";
  /* ekranda açıksa işlem yazmaz (ekranın kaydedilmemiş değişikliği ezilmesin) */
  assert.match(neden(await isle(A, FA.den1, "rapor_yaz", { rapor, surum: g.surum, girisler: [{ yer, deger: "SN-ISLEM-1" }] }, { ekrandakiRapor: rapor })), /ekranda açık/);
  /* yazan kişi yazar: ekranın denetimi + raporKaydet (sürüm ilerler) */
  const w = tamam(await isle(A, FA.den1, "rapor_yaz", { rapor, surum: g.surum, girisler: [{ yer, deger: "SN-ISLEM-1" }, { yer: "x:yok", deger: "1" }] }));
  assert.equal(w.yazilan, 1);
  assert.equal((w.yazilamayan as unknown[]).length, 1, "bilinmeyen yer nedeniyle");
  const s = (await kiraciIcinde(havuz, A, (db) => sahaRaporu(db, FA.den1, rapor), { hesapId: FA.den1.id }))!;
  assert.equal(s.ekipmanBilgi[alan], "SN-ISLEM-1");
  assert.ok(s.surum > Number(g.surum), "kaydedildi");
  /* aynı değer yeniden: değişiklik yok — yazma iş sayılmaz (döngünün güvenliği ve sahte "yaptım" denetimi doğru görür) */
  const ayni = await isle(A, FA.den1, "rapor_yaz", { rapor, surum: s.surum, girisler: [{ yer, deger: "SN-ISLEM-1" }] });
  assert.ok(ayni.tamam && ayni.degisiklik === false, JSON.stringify(ayni));
  /* eski sürümle yazılmaz (sürüm kilidi modülde); yazmayan kişi nedeniyle; başka firma göremez */
  assert.match(neden(await isle(A, FA.den1, "rapor_yaz", { rapor, surum: g.surum, girisler: [{ yer, deger: "SN-ISLEM-2" }] })), /sürüm/);
  assert.match(neden(await isle(A, FA.plan, "rapor_yaz", { rapor, surum: s.surum, girisler: [{ yer, deger: "SN-ISLEM-3" }] })), /yalnız görüntüleyebilir/);
  assert.equal(neden(await isle(B, FB.den1, "rapor_yaz", { rapor, surum: s.surum, girisler: [{ yer, deger: "SN-ISLEM-4" }] })), GORUNMEZ);
  assert.equal((await kiraciIcinde(havuz, A, (db) => sahaRaporu(db, FA.den1, rapor), { hesapId: FA.den1.id }))!.ekipmanBilgi[alan], "SN-ISLEM-1");
});

test("4. müşteri ara sayfalı (sonraki); müşteri kaydet ekler ve günceller — verilmeyen alan korunur; gör düzeyi yazamaz", async () => {
  const s1 = tamam(await isle(A, FA.plan, "musteri_ara", { ara: "Sayfa Müşteri" }));
  assert.deepEqual([s1.toplam, s1.sayfa, s1.sonraki, (s1.musteriler as unknown[]).length], [22, 1, 2, 20]);
  const s2 = tamam(await isle(A, FA.plan, "musteri_ara", { ara: "Sayfa Müşteri", sayfa: 2 }));
  assert.deepEqual([s2.sayfa, s2.sonraki, (s2.musteriler as unknown[]).length], [2, null, 2]);
  const ek = tamam(await isle(A, FA.plan, "musteri_kaydet", { alanlar: { unvan: "İşlem Deneme Ltd." } }));
  const k = tamam(await isle(A, FA.plan, "musteri_getir", { musteri: ek.id }));
  tamam(await isle(A, FA.plan, "musteri_kaydet", { musteri: ek.id, surum: k.surum, alanlar: { tel: "0212 000 00 00" } }));
  const k2 = tamam(await isle(A, FA.plan, "musteri_getir", { musteri: ek.id }));
  assert.deepEqual([k2.unvan, k2.tel], ["İşlem Deneme Ltd.", "0212 000 00 00"]);
  /* muhasebe Müşteriler'i görür, yazamaz (modülün yetkisi) */
  assert.equal(tamam(await isle(A, FA.muh, "musteri_ara", { ara: "İşlem Deneme" })).toplam, 1);
  assert.equal(neden(await isle(A, FA.muh, "musteri_kaydet", { alanlar: { unvan: "Muhasebe Ltd." } })), "Bu işlem için yetkiniz yok.");
  assert.equal(await say(A, "SELECT count(*) AS n FROM musteri WHERE unvan = 'Muhasebe Ltd.'"), 0);
});

/* ── 2026-10-16 (2. adım b): kalan modüller — her modülden bir yazma + bir okuma (tuşun işlevi, aynı sonuç) ve yetkisiz rolün modülün KENDİ reddi ── */
test("5. Personel, Ölçüm cihazları, Zimmetler, Araçlar, Eğitimler, Ekipman türleri: yönetici yazar ve bulur; denetçi modülün kendi yetkisiyle reddedilir", async () => {
  const YETKISIZ = "Bu işlem için yetkiniz yok.";
  /* Personel */
  const p = tamam(await isle(A, FA.yon, "personel_kaydet", { alanlar: { ad: "İşlem Personeli", basla: "2025-01-01", meslek: "mak-muh" } }));
  assert.ok((tamam(await isle(A, FA.yon, "personel_ara", { ara: "İşlem Personeli" })).personel as { id: string }[]).some((x) => x.id === p.id));
  assert.equal(neden(await isle(A, FA.den1, "personel_kaydet", { alanlar: { ad: "Yetkisiz Kişi", basla: "2025-01-01", meslek: "mak-muh" } })), YETKISIZ);
  /* Ölçüm cihazları: yeni türle cihaz, kalibrasyon kaydı */
  const c = tamam(await isle(A, FA.yon, "cihaz_kaydet", { alanlar: { kod: "OC-01", tur: "yeni", yeniTur: "İşlem test cihazı", marka: "Deneme" } }));
  tamam(await isle(A, FA.yon, "kalibrasyon_ekle", { cihaz: c.id, kalibrasyon: { tarih: "2026-01-10", bitis: "2027-01-10", lab: "Deneme Lab", sertifika: "S-1", sonuc: "uygun" } }));
  const cg = tamam(await isle(A, FA.yon, "cihaz_getir", { cihaz: c.id }));
  assert.equal((cg.kalibrasyonlar as unknown[]).length, 1);
  assert.equal(neden(await isle(A, FA.den1, "cihaz_kaydet", { alanlar: { kod: "OC-02", tur: "yeni", yeniTur: "Yetkisiz tür" } })), YETKISIZ);
  /* Zimmetler: demirbaş, teslim */
  const d = tamam(await isle(A, FA.yon, "demirbas_ekle", { kod: "DB-001", ad: "Deneme demirbaşı" }));
  tamam(await isle(A, FA.yon, "zimmet_teslim", { varlik: `d:${d.id}`, alan: FA.den1P, zaman: `${bugun}T09:00`, notu: null }));
  const z = tamam(await isle(A, FA.yon, "zimmet_ara", { ara: "DB-001" }));
  assert.equal((z.varliklar as { yer: string; personel?: string }[])[0].personel, FA.den1P, "kimde: denetçi");
  assert.equal(neden(await isle(A, FA.den1, "demirbas_ekle", { kod: "DB-002", ad: "Yetkisiz" })), YETKISIZ);
  /* Araçlar: araç, haftalık kilometre (sayı da olur) */
  const a = tamam(await isle(A, FA.yon, "arac_kaydet", { alanlar: { plaka: "06 ABC 123", tur: "Binek araç", marka: "Deneme", model: "D1", yil: "2022", yakit: "dizel" } }));
  const km = await isle(A, FA.yon, "arac_km", { arac: a.id, km: 12500 });
  assert.ok(km.tamam, JSON.stringify(km));
  assert.equal(tamam(await isle(A, FA.yon, "arac_ara", { ara: "06 ABC" })).toplam, 1);
  assert.equal(neden(await isle(A, FA.den1, "arac_kaydet", { alanlar: { plaka: "06 XYZ 999", tur: "Binek araç", marka: "X", model: "Y", yil: "2022", yakit: "dizel" } })), YETKISIZ);
  /* Eğitimler: tür + kayıt */
  const et = tamam(await isle(A, FA.yon, "egitim_turu_kaydet", { ad: "İşlem eğitimi", tekrar: 12 }));
  tamam(await isle(A, FA.yon, "egitim_kaydet", { personel: FA.den1P, tur: et.id, tarih: "2026-01-05", kurum: "Firma içi" }));
  assert.equal(tamam(await isle(A, FA.yon, "egitim_ara", { ara: "İşlem eğitimi" })).toplam, 1);
  assert.equal(neden(await isle(A, FA.den1, "egitim_turu_kaydet", { ad: "Yetkisiz eğitim", tekrar: "6" })), YETKISIZ);
  /* Ekipman türleri: yeni tür + Ek-III grubuna göre hazır format yayında (tuşun eylemi gibi) */
  const t = tamam(await isle(A, FA.yon, "tur_kaydet", { alanlar: { ad: "İşlem tankı", kod: "IT", grup: "basincli", periyot: "12" } }));
  assert.equal(await say(A, "SELECT count(*) AS n FROM rapor_format WHERE tur_id = $1 AND durum = 'yayinda'", [t.id]), 1, "hazır format yayında");
  assert.ok((tamam(await isle(A, FA.yon, "format_surumleri", { tur: t.id })).surumler as unknown[]).length >= 1);
  assert.equal(neden(await isle(A, FA.den1, "tur_kaydet", { alanlar: { ad: "Yetkisiz tür", kod: "YT", grup: "basincli", periyot: "12" } })), YETKISIZ);
});

test("6. Sözleşmeler, Muhasebe, Talepler, Firma ayarları, okumalar: tuşun işleviyle yazılır; yetkisiz / göremeyen modülün kendi iletisiyle", async () => {
  const YETKISIZ = "Bu işlem için yetkiniz yok.";
  const musteri = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ m: string }>("SELECT musteri_id::text AS m FROM tesis WHERE id = $1", [FA.tesis]))).rows[0].m;
  /* Sözleşmeler: planlamacı hazırlar (numara sunucuda); muhasebe görür, hazırlayamaz */
  const sg = { musteri, tesisler: [FA.tesis], baslangic: bugun, sure: "12", vade: "30", yenileme: "yok" };
  const s = tamam(await isle(A, FA.plan, "sozlesme_hazirla", sg));
  assert.match(String(s.no), /^IS-\d{4}-\d{3}$/);
  assert.equal(neden(await isle(A, FA.muh, "sozlesme_hazirla", sg)), YETKISIZ);
  /* Muhasebe: elle gider (ödendi) ve listesi; denetçi Muhasebe'yi göremez */
  tamam(await isle(A, FA.muh, "gider_kaydet", { kayit: { tarih: bugun, tur: "yakit", tutar: "100,00", oran: 20, aciklama: "İşlem yakıtı", is: null, personel: null, odeme: "odendi" } }));
  assert.equal(tamam(await isle(A, FA.muh, "gider_ara", {})).toplam, 1);
  assert.match(neden(await isle(A, FA.den1, "gider_ara", {})), /göremiyor/);
  /* Talepler: denetçi kendi adına izin ister; yönetici onay listesinde görür ve onaylar; öteki denetçi karar veremez */
  tamam(await isle(A, FA.den1, "izin_gonder", { tur: "yillik", bas: "2026-12-01", bit: "2026-12-02", aciklama: null }));
  const ot = tamam(await isle(A, FA.yon, "onay_talepleri", {}));
  const izin = (ot.talepler as { tip: string; id: string; surum: number }[]).find((x) => x.tip === "izin")!;
  assert.ok(izin, JSON.stringify(ot));
  assert.equal(neden(await isle(A, FA.den2, "talep_karar", { tip: "izin", talep: izin.id, surum: izin.surum, karar: "onayla" })), YETKISIZ);
  tamam(await isle(A, FA.yon, "talep_karar", { tip: "izin", talep: izin.id, surum: izin.surum, karar: "onayla" }));
  assert.equal(await say(A, "SELECT count(*) AS n FROM izin_talebi WHERE id = $1 AND durum = 'onaylandi'", [izin.id]), 1);
  /* Firma ayarları: okumada anahtar yalnız "tanımlı mı" (son 4 hane bile yok); bölüm kaydı sürümle; denetçi göremez */
  const fa = tamam(await isle(A, FA.yon, "firma_ayarlari", {}));
  assert.deepEqual(Object.keys((fa.yz as { anahtar: object }).anahtar), ["tanimli"]);
  assert.ok(!JSON.stringify(fa).includes("son4"), "anahtarın son haneleri gitmez");
  const sk = fa.saklama as { surum: number };
  tamam(await isle(A, FA.yon, "firma_ayari_kaydet", { kesim: "saklama", surum: sk.surum, deger: { yil: 6 } }));
  assert.equal((tamam(await isle(A, FA.yon, "firma_ayarlari", {})).saklama as { deger: { yil: number } }).deger.yil, 6);
  assert.match(neden(await isle(A, FA.den1, "firma_ayarlari", {})), /göremiyor/);
  /* okumalar: ana sayfa, bekleyen işler, uyarılar, performans */
  for (const ad of ["ana_sayfa", "bekleyen_isler", "uyari_ara", "performans_panosu"]) assert.ok((await isle(A, FA.yon, ad, {})).tamam, ad);
  /* Planlar: raporsuz planı yalnız yönetici siler */
  const pl = tamam(await isle(A, FA.plan, "plan_ac", planGirdisi(FA)));
  assert.equal(neden(await isle(A, FA.plan, "plan_sil", { plan: pl.id })), YETKISIZ);
  tamam(await isle(A, FA.yon, "plan_sil", { plan: pl.id }));
  assert.equal(await say(A, "SELECT count(*) AS n FROM plan WHERE id = $1", [pl.id]), 0);
  /* başka firma: B'nin yöneticisi A'nın sözleşmesini göremez */
  assert.equal(neden(await isle(B, FB.yon, "sozlesme_getir", { sozlesme: s.id })), GORUNMEZ);
});
