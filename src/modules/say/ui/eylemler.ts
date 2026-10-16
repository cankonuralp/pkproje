"use server";
/* S.A.Y SUNUCU EYLEMLERİ (380) — kişi ve kiracı oturumdan (istemciden kimlik alınmaz); başka kökenden gelen istek ve oturumsuz çağrı reddedilir.
   İstemciden gelen yalnız soru metni, hızlı sorunun adı ve bulunulan sayfanın adresi (yer adı sunucuda modül kaydından çıkarılır — kayıt bilgisi
   taşımaz). Yapay zekâ çağrısı veritabanı işleminin dışında.
   522: ekli soru FormData ile (dosyalar + soru, adres, rapor); tür, adet ve boy sunucuda (server/ek.ts), dosya saklanmaz.
   550: kuralla cevaplanan hızlı sorular kalktı (yalnız "Fotoğrafları oku ve gir" — ekranda); rapordayken canlı ekipman bilgisi de gelir (harita);
   internet araması hizmetçe kabul edilmezse (400) soru aramasız bir kez yeniden gönderilir.
   557: rapordayken kontrol tarihleri ve ölçüm cihazı satırları da gelir (harita); sayIsSonucuEylemi — ekranın yaptığı işin sonucu, S.A.Y cevabı
   onunla yazar (çağrı düşerse sonucu sunucu yazar).
   2026-10-15 (pkproje §9 "S.A.Y CLAUDE GİBİ"): (A) sayIsSonucuEylemi döngünün bir turu — S.A.Y yeni iş isterse komutlar ekrana döner, ekran yapar
   ve yine buraya gelir (tur sınırı yok); (D) S.A.Y aracı çağırmadan "yaptım" dediyse cevap gösterilmez, aynı eylemde bir düzeltme turu gider
   (duzelt). Bir eylemdeki çağrılar sayfanın işlev süresine sığsın diye ortak bir bitiş zamanı paylaşır (BITIS_MS).
   2026-10-16 (S.A.Y 1. adım incelemesi): sorunun ekleri döngünün turlarına da gider (sayIsSonucuEkliEylemi — saklanmaz); tur reddedilir ya da
   düşerse işin yarıda kaldığı nedeniyle yazılır (sayIsYarim; ekran turu hiç gönderemediyse sayIsYarimEylemi); düzeltme turu yalnız istekte iş
   yapan araç varken; bitiş zamanı geçtiyse çağrı yapılmaz (işlev süresi aşılmasın); ayırmadan sonra beklenmeyen bir hata olursa açık ayırmalar
   bırakılır (ay sonuna kadar "ayrılan"da kalmasın). */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { anthropicCagir, type OkumaIstegi, type OkumaYaniti } from "../../../server/yz/okuma";
import type { SohbetIletisi } from "../../../server/yz/sohbet";
import { duzeltmeIstegi, isAraciVar, SAHTE_YEDEK, sahteYapildi } from "../../../server/yz/say";
import { EK_EN_COK_ADET, EK_EN_COK_BAYT } from "../ek-sinir";
import { EK_BOY_HATASI, sayEkleriOku, type SayEkDosyasi } from "../server/ek";
import { canliOku, kurucuOku, sayBirak, sayDurumu, sayEkAyir, sayGecmisi, sayIsSonucuHazirla, sayIsSonucuKaydet, sayIsYarim, sayOneri, sayRaporCevabi,
  saySorHazirla, saySorKaydet, sayTemizle, type SayDurum, type SayEkCagri, type SayYaniti } from "../server/say";

const RED: SayYaniti = { durum: "red", neden: "Oturumunuz kapandı. Sayfayı yenileyip yeniden giriş yapın." };
const yolAl = (v: unknown) => (typeof v === "string" && v.startsWith("/") && v.length <= 300 ? v : "/");
/** bir eylemdeki yapay zekâ çağrılarının toplam süresi (sayfaların işlev süresi 55 sn — (uygulama)/layout.tsx; iki veritabanı işlemine pay) ve
    tek çağrının en çok süresi (okuma.ts varsayılanı); kalan süre EN_AZ_MS'den azsa çağrı yapılmaz */
const BITIS_MS = 50_000, CAGRI_MS = 45_000, EN_AZ_MS = 5_000;
const SURE_DOLDU: OkumaYaniti = { durum: "hata", neden: "Yapay zekâ zamanında yanıt vermedi; biraz sonra yeniden deneyin.", ucret: "yok" };
/** 2026-10-16: ekran döngünün turunu gönderemedi (bağlantı, süre) — iletinin nedeni (sunucunun metni) */
const ULASILAMADI = "işin sonucu S.A.Y'a ulaştırılamadı (bağlantı koptu ya da süre doldu).";

async function oturum() {
  if (!(await ayniKoken())) return null;
  return istekOturumu();
}

export async function sayDurumEylemi(): Promise<SayDurum | null> {
  const o = await oturum();
  return o ? oturumIslemi(o, (db) => sayDurumu(db)) : null;
}

export async function sayGecmisEylemi(): Promise<SohbetIletisi[]> {
  const o = await oturum();
  return o ? oturumIslemi(o, (db) => sayGecmisi(db)) : [];
}

/** rapor ekranının yaptığı iş (542): ekran işin sayılarını gönderir, metni sunucu kurar */
export async function sayRaporEylemi(girdi: unknown): Promise<SayYaniti> {
  const o = await oturum();
  if (!o) return RED;
  return oturumIslemi(o, (db) => sayRaporCevabi(db, girdi));
}

/** öneri kartı: Uygula / Vazgeç (yalnız kişinin kendi iletisinde, bir kez) */
export async function sayOneriEylemi(id: unknown, durum: unknown): Promise<boolean> {
  const o = await oturum();
  if (!o || typeof id !== "string" || (durum !== "uygulandi" && durum !== "vazgecildi")) return false;
  return oturumIslemi(o, (db) => sayOneri(db, id, durum));
}

export async function saySorEylemi(soru: unknown, yol: unknown, raporNo?: unknown, canli?: unknown, kurucu?: unknown): Promise<SayYaniti> {
  const bitis = Date.now() + BITIS_MS;
  const o = await oturum();
  return o ? sor(o, soru, yol, raporNo, canli, [], kurucu, bitis) : RED;
}

/** 522: formdaki ekler ("ek", en çok 4 dosya, toplam 4 MB) — tür içerikten (server/ek.ts) */
async function ekleriAl(form: FormData): Promise<SayEkDosyasi[] | { durum: "red"; neden: string }> {
  const dosyalar = form.getAll("ek").filter((d): d is File => d instanceof File);
  if (!dosyalar.length) return { durum: "red", neden: "Ek seçin." };
  if (dosyalar.length > EK_EN_COK_ADET) return { durum: "red", neden: `Bir soruya en çok ${EK_EN_COK_ADET} ek konur.` };
  if (dosyalar.reduce((t, d) => t + d.size, 0) > EK_EN_COK_BAYT) return { durum: "red", neden: EK_BOY_HATASI };
  return sayEkleriOku(await Promise.all(dosyalar.map(async (d) => ({ bayt: new Uint8Array(await d.arrayBuffer()), ad: d.name }))));
}
const jsonAl = (v: FormDataEntryValue | null): unknown => { try { return JSON.parse(String(v ?? "null")); } catch { return null; } };

/** 522: ekli soru — form: soru, yol, raporNo, canli (JSON), ek (en çok 4 dosya, toplam 4 MB) */
export async function sayEkliSorEylemi(form: FormData): Promise<SayYaniti> {
  const bitis = Date.now() + BITIS_MS;
  const o = await oturum();
  if (!o) return RED;
  const ekler = await ekleriAl(form);
  if ("durum" in ekler) return ekler;
  const raporNo = form.get("raporNo");
  return sor(o, String(form.get("soru") ?? ""), form.get("yol"), typeof raporNo === "string" && raporNo ? raporNo : undefined, jsonAl(form.get("canli")), ekler,
    jsonAl(form.get("kurucu")), bitis);
}

type Oturum = NonNullable<Awaited<ReturnType<typeof oturum>>>;

/** yapay zekâ çağrısı, eylemin bitiş zamanına göre (tek çağrı en çok CAGRI_MS, kalan süreyi aşmaz; kalan EN_AZ_MS'den azsa çağrı yapılmaz —
    2026-10-16: 5 sn tabanı bitişi aşıp işlevin 55 sn'sini geçebiliyordu). K7: internet araması bu modelde kabul edilmezse (400 — araç) aramasız bir
    kez daha (ayırma aynı; ücret yalnız gerçek çağrıdan) */
async function cagir(istek: OkumaIstegi, anahtar: string, bitis: number): Promise<OkumaYaniti> {
  const sure = () => Math.min(CAGRI_MS, bitis - Date.now());
  if (sure() < EN_AZ_MS) return SURE_DOLDU;
  let y = await anthropicCagir(istek, anahtar, sure());
  if (y.durum === "hata" && y.kod === 400 && /web_search|tool/i.test(y.ileti ?? "")) {
    const araclar = ((istek.govde.tools ?? []) as { name?: string }[]).filter((t) => t.name !== "web_search");
    const govde: Record<string, unknown> = { ...istek.govde, tools: araclar };
    if (!araclar.length) delete govde.tools;
    if (araclar.length !== ((istek.govde.tools ?? []) as unknown[]).length) y = sure() < EN_AZ_MS ? SURE_DOLDU : await anthropicCagir({ govde } satisfies OkumaIstegi, anahtar, sure());
  }
  return y;
}

/** 2026-10-16: bu eylemin açık ayırmaları — kayıt bitmeden beklenmeyen bir hata olursa bırakılır (çağrı yapıldıysa ücretli: sonucu bilinmiyor);
    sayac: ilk çağrı mesajı sayar, aynı mesajın ek çağrıları (düzeltme, döngü turu) saymaz */
interface AcikAyirma { ay: string; ust: number; ucret: "yok" | "bilinmiyor"; sayac: "mesaj" | "yok" }
async function ayirmalariBirak(o: Oturum, acik: AcikAyirma[]): Promise<void> {
  for (const a of acik.splice(0)) {
    try { await oturumIslemi(o, (db) => sayBirak(db, a, a.ucret, a.sayac)); } catch { /* veritabanına ulaşılamıyor — asıl hata yukarı gider */ }
  }
}

/** D (2026-10-15 — bir cevapta S.A.Y aracı çağırmadan "Yaptım" dedi): cevap araç çağırmadan iş yapıldığını söylüyorsa (ve bu mesajın işinde yapılan
    bir şey yoksa) kullanıcıya gösterilmez — S.A.Y'a düzeltme turu gider (işi yap ya da nedenini söyle); düzeltilmiş cevap yeni iş isterse döngü
    sürer. Ayırması ayrı; düzeltme yapılamazsa (sınır, süre, çağrı düştü) sahte cevap yerine doğru olan (SAHTE_YEDEK) yazılır. 2026-10-16: yalnız
    istekte iş yapan bir araç varken (isAraciVar — araçsız sayfada "yazdım" bilgi veren cevaptır); düşen düzeltme çağrısı mesajı yeniden saymaz */
async function duzelt(o: Oturum, h: { istek: OkumaIstegi; anahtar: string; ay: string; ust: number }, govde: unknown, yapildi: boolean, bitis: number,
  acik: AcikAyirma[]): Promise<{ govde: unknown; ek: SayEkCagri }> {
  if (!isAraciVar(h.istek.govde) || !sahteYapildi(govde, yapildi)) return { govde, ek: { onceki: [], ust: 0 } };
  const yedek = { govde, ek: { onceki: [], ust: 0, yedek: SAHTE_YEDEK } };
  if (bitis - Date.now() < EN_AZ_MS) return yedek;
  const ust = await oturumIslemi(o, (db) => sayEkAyir(db, h.ay, h.ust));
  if (ust === null) return yedek;
  const a: AcikAyirma = { ay: h.ay, ust, ucret: "bilinmiyor", sayac: "yok" };
  acik.push(a);
  const y = await cagir(duzeltmeIstegi(h.istek, govde), h.anahtar, bitis);
  if (y.durum === "hata") {
    await oturumIslemi(o, (db) => sayBirak(db, a, y.ucret, "yok"));
    acik.splice(acik.indexOf(a), 1);
    return yedek;
  }
  return { govde: y.govde, ek: { onceki: [govde], ust } };
}

async function sor(o: Oturum, soru: unknown, yol: unknown, raporNo: unknown, canli: unknown, ekler: SayEkDosyasi[], kurucuHam: unknown, bitis: number): Promise<SayYaniti> {
  if (typeof soru !== "string") return { durum: "red", neden: "Sorunuzu yazın." };
  const h = await oturumIslemi(o, (db) => saySorHazirla(db, o, soru, yolAl(yol), new Date(), typeof raporNo === "string" ? raporNo : null, canliOku(canli), ekler, kurucuOku(kurucuHam)));
  if (h.durum !== "hazir") return h;
  const acik: AcikAyirma[] = [{ ay: h.ay, ust: h.ust, ucret: "bilinmiyor", sayac: "mesaj" }];
  try {
    const y = await cagir(h.istek, h.anahtar, bitis);
    if (y.durum === "hata") {
      acik.length = 0;
      await oturumIslemi(o, (db) => sayBirak(db, h, y.ucret));
      return { durum: "red", neden: y.neden };
    }
    const d = await duzelt(o, h, y.govde, false, bitis, acik);
    const r = await oturumIslemi(o, (db) => saySorKaydet(db, h, d.govde, d.ek));
    acik.length = 0;
    return r;
  } catch (e) {
    await ayirmalariBirak(o, acik);
    throw e;
  }
}

/** 557 → A: ekranın yaptığı işin sonucu — döngünün bütün adımları (yazılan, zaten öyle olan, eklenen satır, yazılamayan + neden) ve ekranın canlı
    hâli. S.A.Y yeni iş isterse komutlar döner (ekran yapar, yine buraya gelir); bitirirse cevabı yazılır (çağrı düşerse sonucu sunucu yazar) */
export async function sayIsSonucuEylemi(girdi: unknown, yol: unknown): Promise<SayYaniti> {
  const bitis = Date.now() + BITIS_MS;
  const o = await oturum();
  if (!o) return RED;
  return isSonucu(o, girdi, yolAl(yol), [], bitis);
}

/** 2026-10-16: sorunun ekleriyle döngü turu — form: girdi (JSON), yol, ek (sorunun ekleri; yine saklanmaz) — S.A.Y kaynağı her turda görür */
export async function sayIsSonucuEkliEylemi(form: FormData): Promise<SayYaniti> {
  const bitis = Date.now() + BITIS_MS;
  const o = await oturum();
  if (!o) return RED;
  const ekler = await ekleriAl(form);
  if ("durum" in ekler) return ekler;
  return isSonucu(o, jsonAl(form.get("girdi")), yolAl(form.get("yol")), ekler, bitis);
}

async function isSonucu(o: Oturum, girdi: unknown, yol: string, ekler: SayEkDosyasi[], bitis: number): Promise<SayYaniti> {
  const h = await oturumIslemi(o, (db) => sayIsSonucuHazirla(db, o, girdi, yol, new Date(), ekler));
  /* 2026-10-16: tur reddedildi (sınır doldu, S.A.Y kapandı, anahtar yok) — önceki turlarda yapılanlar ekranda: sayılarla + nedeni yazılır */
  if (h.durum !== "hazir") return oturumIslemi(o, (db) => sayIsYarim(db, o, girdi, yol, h.neden));
  const acik: AcikAyirma[] = [{ ay: h.ay, ust: h.ust, ucret: "bilinmiyor", sayac: "yok" }];
  try {
    const y = await cagir(h.istek, h.anahtar, bitis);
    if (y.durum === "hata") {
      acik.length = 0;
      return await oturumIslemi(o, (db) => sayIsSonucuKaydet(db, h, null, y.ucret, { onceki: [], ust: 0 }, y.neden));
    }
    const d = await duzelt(o, h, y.govde, h.yapildi, bitis, acik);
    const r = await oturumIslemi(o, (db) => sayIsSonucuKaydet(db, h, d.govde, "yok", d.ek));
    acik.length = 0;
    return r;
  } catch (e) {
    await ayirmalariBirak(o, acik);
    throw e;
  }
}

/** 2026-10-16: ekran döngünün turunu gönderemedi (bağlantı koptu, işlev süresi doldu) — yapay zekâ çağrılmadan yapılanlar sayılarla + "İş yarıda
    kaldı" (nedeni sunucunun metni); S.A.Y zaten cevap yazdıysa yazılmaz */
export async function sayIsYarimEylemi(girdi: unknown, yol: unknown): Promise<SayYaniti> {
  const o = await oturum();
  if (!o) return RED;
  return oturumIslemi(o, (db) => sayIsYarim(db, o, girdi, yolAl(yol), ULASILAMADI));
}

export async function sayTemizleEylemi(): Promise<{ durum: "tamam"; silinen: number } | { durum: "red"; neden: string }> {
  const o = await oturum();
  if (!o) return { durum: "red", neden: "Oturumunuz kapandı." };
  return { durum: "tamam", silinen: await oturumIslemi(o, (db) => sayTemizle(db)) };
}
