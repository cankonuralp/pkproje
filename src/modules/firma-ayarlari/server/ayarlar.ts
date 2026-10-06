/* FİRMA AYARLARI (334; modül 22; maket firma-ayarlari.html — R1 "ayrı bir modül olsun", Z1 bölüm başına Kaydet, 202 dağınık ayarlar tek yerde).
   Görür: Firma ayarları "gör" ya da "yaz" ("kendi" / "branşı": firma ayarında kişiye ya da branşa ait kayıt yok — görmez; 334 incelemesi);
   değiştirir: "yaz" (başlangıçta firma yöneticisi — SABIT, kendini kilitleyemez). Değerler çekirdeğin ayar
   bölümlerinde (src/server/ayar/ayar.ts: sürüm kilidi, denetim izi); firma kodu firma kaydında (0045 sütun yetkisi); logo / ön bilgilendirme
   formu / bordro formatı tek dosya yolundan (kayıt = firma). Geçersiz değer kaydedilmez, alanın altında söylenir. Öteki modüllerin tablolarına
   dokunmaz: kişi seçenekleri Personel'den. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaCope, dosyaYukle } from "../../../server/dosya/dosya.ts";
import { AYAR_DOSYA, ayarOku, ayarYaz, belgeTurKilidi, firmaKoduYaz, firmaKunyesi, type AyarBolumu } from "../../../server/ayar/ayar.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { personelSecenekleri } from "../../personel/server/personel.ts";
import { fiyatlariYaz, fiyatListesi } from "../../teklifler/server/fiyat-baglanti.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { egitimTurAdlari } from "../../egitimler/server/ayar-baglanti.ts";
import { ozlukTurKullanimi } from "../../personel/server/dosyalar.ts";
import { tutar } from "../../../sema/ortak.ts";
import { sirDurumu, sirYaz } from "../../../server/ayar/sir.ts";
import {
  AnahtarGirdisi, BulutGirdisi, YedekGirdisi, YzGirdisi,
  BelgeTuruGirdisi, FiyatGirdisi, MUSTERI_BELGE_BAS, MUSTERI_BELGE_SON, MusteriBelgeGirdisi,
  AYAR_DOSYASI, EsikGirdisi, FirmaBilgiGirdisi, ImzaGirdisi, KodGirdisi, MesaiGirdisi, SabitGiderGirdisi, SaklamaGirdisi, ZimmetGirdisi, type AyarDosyasi,
} from "../sema.ts";

const MODUL = 22;
export interface Kisi extends YetkiHesabi { ad: string }
export const ayarlarGorur = (kim: YetkiHesabi) => ["gor", "yaz"].includes(duzey(kim, MODUL));
export const ayarlarYazar = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";

type Surumlu<T> = { deger: T; surum: number };
export interface FirmaAyarlari {
  yaz: boolean;
  kod: string;
  firma: Surumlu<{ ad: string; adres: string; eposta: string; akr: string; nusha: number }> & { kayitAd: string };
  imza: Surumlu<{ yontem: "mobil" | "e_imza" }>;
  zimmet: Surumlu<{ teslim_eden: string | null }>;
  saklama: Surumlu<{ yil: number }>;
  mesai: Surumlu<{ acik: boolean; normal_dk: number; mesai_dk: number; yillik_fazla_saat: number }>;
  esik: Surumlu<{ kalibrasyon: number; kontrolu_yaklasan_tesis: number; plan_kontrolu_geliyor: number; egitim: number }>;
  sabit: Surumlu<{ kalemler: { ad: string; aylik: number; not: string }[] }>;
  /** dosya ayarları: kimlik ve görünen ad (yoksa null) ve bölümün sürümü */
  dosyalar: Record<AyarDosyasi, { id: string; ad: string } | null> & { surum: { firma: number; sablon: number } };
  kisiler: { id: string; ad: string }[];
  /** fiyat listesi (335): ekipman türleri (branş, ad sırası) ve birim fiyatı (kuruş; yoksa null) */
  fiyat: { turler: { id: string; ad: string; kod: string; brans: "m" | "e"; fiyat: number | null }[] };
  /** müşteriye açık personel belgeleri (335): türler ve seçililer */
  mbelge: Surumlu<{ secili: string[] }> & { turler: MusteriBelgeTuru[]; ekSurum: number };
  /** 336: yapay zekâ (anahtar yalnız "tanımlı + son 4"; değer asla), bulut kaydı, yedek; saklama süresi (aylık arşiv) */
  yz: Surumlu<{ acik: boolean; model: "opus" | "sonnet"; sinir: number | null }> & { anahtar: { tanimli: boolean; son4: string | null } };
  bulut: Surumlu<{ saglayici: "" | "gdrive" | "onedrive" | "dropbox" | "yandex" | "sftp"; kok: string; duzen: "mt" | "mty" | "my" }>;
  yedek: Surumlu<{ sik: "saatlik" | "gunluk" | "haftalik"; saat: string; gun: 30 | 90 | 365 }>;
}
/** k: özlük türü, "atama" ya da "eg:<eğitim türü>"; ek: firmanın eklediği (kaldırılabilir); kullanim: o türde belgesi olan personel (ek türde) */
export interface MusteriBelgeTuru { k: string; ad: string; kisisel: boolean; ek: boolean; kullanim: number }

async function musteriBelgeTurleri(db: Sorgulayici): Promise<{ turler: MusteriBelgeTuru[]; ekSurum: number; son: number; ek: { k: string; ad: string; kisisel: boolean }[] }> {
  const ek = await ayarOku(db, "belge_tur_ek");
  const ekler: MusteriBelgeTuru[] = [];
  for (const t of ek.deger.turler) ekler.push({ k: t.k, ad: t.ad, kisisel: t.kisisel, ek: true, kullanim: await ozlukTurKullanimi(db, t.k) });
  return {
    ekSurum: ek.surum, ek: ek.deger.turler,
    /* verilmiş en büyük numara (eski kayıtta sayaç yoksa var olan anahtarlardan) */
    son: Math.max(ek.deger.son, ...ek.deger.turler.map((t) => Number(t.k.slice(2)))),
    turler: [
      ...MUSTERI_BELGE_BAS.map(([k, ad, kisisel]) => ({ k, ad, kisisel, ek: false, kullanim: 0 })),
      ...(await egitimTurAdlari(db)).map((t) => ({ k: `eg:${t.id}`, ad: `${t.ad} sertifikası`, kisisel: false, ek: false, kullanim: 0 })),
      ...ekler,
      ...MUSTERI_BELGE_SON.map(([k, ad, kisisel]) => ({ k, ad, kisisel, ek: false, kullanim: 0 })),
    ],
  };
}

async function dosyaAdi(db: Sorgulayici, id: string | null): Promise<{ id: string; ad: string } | null> {
  if (!id) return null;
  const d = (await db.sorgu<{ ad: string }>("SELECT ad FROM dosya WHERE id = $1 AND modul = $2 AND cop IS NULL", [id, AYAR_DOSYA])).rows[0];
  return d ? { id, ad: d.ad } : null;
}

/** ekranın bütün verisi; göremeyene null */
export async function firmaAyarlari(db: Sorgulayici, kim: Kisi): Promise<FirmaAyarlari | null> {
  if (!ayarlarGorur(kim)) return null;
  const k = await firmaKunyesi(db);
  const [f, im, zi, sa, me, es, sg, bs] = [await ayarOku(db, "firma_bilgileri"), await ayarOku(db, "imza"), await ayarOku(db, "zimmet"), await ayarOku(db, "saklama"),
    await ayarOku(db, "mesai"), await ayarOku(db, "uyari_esikleri"), await ayarOku(db, "sabit_gider"), await ayarOku(db, "belge_sablon")];
  return {
    yaz: ayarlarYazar(kim), kod: k.kod,
    firma: { deger: { ad: f.deger.ad, adres: f.deger.adres, eposta: f.deger.eposta, akr: f.deger.akr, nusha: f.deger.nusha }, surum: f.surum, kayitAd: k.ad },
    imza: { deger: im.deger, surum: im.surum }, zimmet: { deger: zi.deger, surum: zi.surum }, saklama: { deger: sa.deger, surum: sa.surum },
    mesai: { deger: { acik: me.deger.acik, normal_dk: me.deger.normal_dk, mesai_dk: me.deger.mesai_dk, yillik_fazla_saat: me.deger.yillik_fazla_saat }, surum: me.surum },
    esik: { deger: es.deger, surum: es.surum }, sabit: { deger: sg.deger, surum: sg.surum },
    dosyalar: { logo: await dosyaAdi(db, f.deger.logo), on_bilgi: await dosyaAdi(db, bs.deger.on_bilgi), bordro_format: await dosyaAdi(db, bs.deger.bordro_format),
      surum: { firma: f.surum, sablon: bs.surum } },
    kisiler: (await personelSecenekleri(db)).map(({ id, ad }) => ({ id, ad })),
    fiyat: await (async () => {
      const f = await fiyatListesi(db);
      return { turler: (await turOzetleri(db)).map((t) => ({ id: t.id, ad: t.ad, kod: t.kod, brans: t.brans, fiyat: f.get(t.id) ?? null })) };
    })(),
    yz: await (async () => {
      const y = await ayarOku(db, "yapay_zeka");
      return { deger: { acik: y.deger.acik, model: y.deger.model, sinir: y.deger.sinir }, surum: y.surum, anahtar: await sirDurumu(db, "yapay_zeka_anahtari") };
    })(),
    bulut: await (async () => { const b = await ayarOku(db, "bulut"); return { deger: b.deger, surum: b.surum }; })(),
    yedek: await (async () => { const b = await ayarOku(db, "yedek"); return { deger: b.deger, surum: b.surum }; })(),
    mbelge: await (async () => {
      const mb = await ayarOku(db, "musteri_belge"), t = await musteriBelgeTurleri(db);
      const secili = [...mb.deger.ozluk, ...mb.deger.egitim.map((x) => `eg:${x}`), ...(mb.deger.atama ? ["atama"] : [])].filter((k) => t.turler.some((x) => x.k === k));
      return { deger: { secili }, surum: mb.surum, turler: t.turler, ekSurum: t.ekSurum };
    })(),
  };
}

/** degismedi: kayıtlı değer zaten aynıydı (sunucu biçimi düzeltti) — ekran taslağı kayıtlı değere döner */
export type AyarYazma = { durum: "tamam"; bildirim: string; degismedi?: true } | { durum: "gecersiz"; hatalar: DogrulamaHatalari } | { durum: "red"; neden: string } | { durum: "cakisma" } | { durum: "yetkisiz" };
const SONUC = (r: { durum: string; hatalar?: DogrulamaHatalari }, bildirim: string): AyarYazma =>
  r.durum === "tamam" ? { durum: "tamam", bildirim } : r.durum === "degisiklik_yok" ? { durum: "tamam", bildirim, degismedi: true } : r.durum === "gecersiz" ? { durum: "gecersiz", hatalar: r.hatalar ?? {} }
    : { durum: "cakisma" };

/** bölüm kaydet (maket Z1 "Kaydet"): girdi şemadan geçer; kaydedilmemiş alan bölümün öteki alanlarıyla birlikte kalır (dosya alanları korunur) */
export async function ayarKaydet(db: Sorgulayici, kim: Kisi, kesim: string, surum: number, girdi: unknown): Promise<AyarYazma> {
  if (!ayarlarYazar(kim)) return { durum: "yetkisiz" };
  if (!Number.isSafeInteger(surum) || surum < -1) return { durum: "cakisma" };
  const iz = { kim: kim.ad, ne: `firma_ayar.${kesim}` };
  const yaz = async <B extends AyarBolumu>(b: B, yeni: unknown, bildirim: string) => SONUC(await ayarYaz(db, b, surum, yeni, iz), bildirim);
  switch (kesim) {
    case "firma": {
      const g = dogrula(FirmaBilgiGirdisi, girdi);
      if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
      const eski = (await ayarOku(db, "firma_bilgileri")).deger;
      return yaz("firma_bilgileri", { ...eski, ...g.veri }, "Firma bilgileri kaydedildi; yeni raporların ve belgelerin başlığına gelir.");
    }
    case "imza": {
      const g = dogrula(ImzaGirdisi, girdi);
      return g.tamam ? yaz("imza", g.veri, "İmza yöntemi kaydedildi; raporlar ve iç belgeler bu yöntemle imzalanır.") : { durum: "gecersiz", hatalar: g.hatalar };
    }
    case "zimmet": {
      const g = dogrula(ZimmetGirdisi, girdi);
      if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
      if (g.veri.teslim_eden && !(await personelSecenekleri(db)).some((p) => p.id === g.veri.teslim_eden)) return { durum: "gecersiz", hatalar: { teslim_eden: "Çalışan bir kişi seçin." } };
      return yaz("zimmet", g.veri, "Zimmet formunda teslim edenin başlangıç değeri kaydedildi.");
    }
    case "saklama": {
      const g = dogrula(SaklamaGirdisi, girdi);
      return g.tamam ? yaz("saklama", g.veri, `Saklama süresi ${g.veri.yil} yıl.`) : { durum: "gecersiz", hatalar: g.hatalar };
    }
    case "mesai": {
      /* kapatırken gizli sayı alanları doğrulanmaz, kayıtlı değerleri kalır (ekranda görünmeyen alanın hatası olmaz — 334 incelemesi) */
      if (girdi && typeof girdi === "object" && (girdi as { acik?: unknown }).acik === false)
        return yaz("mesai", { ...(await ayarOku(db, "mesai")).deger, acik: false }, "Mesai takibi kapalı; günlük süre sınırı yok.");
      const g = dogrula(MesaiGirdisi, girdi);
      if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
      const eski = (await ayarOku(db, "mesai")).deger;
      return yaz("mesai", { ...eski, ...g.veri }, g.veri.acik ? "Mesai takibi kaydedildi (açık)." : "Mesai takibi kapalı; günlük süre sınırı yok.");
    }
    case "esik": {
      const g = dogrula(EsikGirdisi, girdi);
      return g.tamam ? yaz("uyari_esikleri", g.veri, "Uyarı eşikleri kaydedildi; uyarılar bu eşiklerle.") : { durum: "gecersiz", hatalar: g.hatalar };
    }
    case "sabit": {
      const g = dogrula(SabitGiderGirdisi, girdi);
      if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
      const h: DogrulamaHatalari = {};
      g.veri.kalemler.forEach((x, i) => { if (x.ad.length < 2) h[`kalemler.${i}.ad`] = "Gider adı en az 2 harf."; if (x.aylik > 100_000_000_000) h[`kalemler.${i}.aylik`] = "Tutar çok büyük."; });
      if (Object.keys(h).length) return { durum: "gecersiz", hatalar: h };
      return yaz("sabit_gider", g.veri, "Sabit giderler kaydedildi; gelir-gider özetinde her ay gider olarak düşer.");
    }
    case "fiyat": {
      /* KDV hariç birim fiyat; boş: fiyatsız (kayıtlı fiyat silinmez); doluysa sıfırdan büyük (maket tlOku). İyimser kilit (335 incelemesi): yalnız
         ekranın gördüğünden değişen türler yazılır; o türün fiyatı bu arada değiştiyse hiçbiri yazılmaz (sessiz ezme yok) */
      const g = dogrula(FiyatGirdisi, girdi);
      if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
      const turler = new Set((await turOzetleri(db)).map((t) => t.id)), eski = await fiyatListesi(db);
      const gordu = (m: string | undefined): number | null | "bozuk" => {
        const s = (m ?? "").trim(); if (!s) return null;
        const t = tutar.safeParse(s); return t.success ? t.data : "bozuk";
      };
      const h: DogrulamaHatalari = {}, yeni = new Map<string, { fiyat: number; gorulen: number | null }>();
      for (const [tur, metin] of Object.entries(g.veri.fiyatlar)) {
        if (!turler.has(tur)) { h[tur] = "Ekipman türü bulunamadı."; continue; }
        if (!metin.trim()) { if (eski.has(tur)) h[tur] = "Fiyat boş bırakılamaz (kayıtlı fiyat silinmez)."; continue; }
        const t = tutar.safeParse(metin);
        if (!t.success || t.data <= 0 || t.data > 100_000_000_000) { h[tur] = "Tutar okunamadı (ör. 1.250 ya da 1250,50). Kaydedilmedi."; continue; }
        const gorulen = gordu(g.veri.gorulen[tur]);
        if (gorulen === "bozuk") return { durum: "cakisma" };
        if (t.data !== gorulen) yeni.set(tur, { fiyat: t.data, gorulen });
      }
      if (Object.keys(h).length) return { durum: "gecersiz", hatalar: h };
      const n = await fiyatlariYaz(db, kim, yeni);
      if (n === "cakisma") return { durum: "cakisma" };
      return n ? { durum: "tamam", bildirim: `Fiyat listesi kaydedildi (${n} tür); yeni teklifler bu fiyatlarla dolar.` } : { durum: "tamam", bildirim: "Fiyat listesinde değişiklik yok.", degismedi: true };
    }
    case "yz": {
      const g = dogrula(YzGirdisi, girdi);
      if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
      const eski = (await ayarOku(db, "yapay_zeka")).deger;
      return yaz("yapay_zeka", { ...eski, ...g.veri }, g.veri.acik ? "Yapay zekâ ayarları kaydedildi (açık)." : "Yapay zekâ kapatıldı; fotoğraftan okuma ve S.A.Y görünmez.");
    }
    case "bulut": {
      const g = dogrula(BulutGirdisi, girdi);
      return g.tamam ? yaz("bulut", g.veri, "Bulut kaydı ayarları kaydedildi.") : { durum: "gecersiz", hatalar: g.hatalar };
    }
    case "yedek": {
      const g = dogrula(YedekGirdisi, girdi);
      return g.tamam ? yaz("yedek", g.veri, "Yedek ayarları kaydedildi.") : { durum: "gecersiz", hatalar: g.hatalar };
    }
    case "mbelge": {
      const g = dogrula(MusteriBelgeGirdisi, girdi);
      if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
      await belgeTurKilidi(db);
      const t = await musteriBelgeTurleri(db), gecerli = new Set(t.turler.map((x) => x.k));
      if (g.veri.secili.some((k) => !gecerli.has(k))) return { durum: "gecersiz", hatalar: { secili: "Bilinmeyen belge türü." } };
      const sec = [...new Set(g.veri.secili)];
      return yaz("musteri_belge", {
        ozluk: sec.filter((k) => k !== "atama" && !k.startsWith("eg:")), egitim: sec.filter((k) => k.startsWith("eg:")).map((k) => k.slice(3)), atama: sec.includes("atama"),
      }, `Müşteriye açık personel belgeleri kaydedildi (${sec.length} tür).`);
    }
  }
  return { durum: "gecersiz", hatalar: { genel: "Bilinmeyen ayar bölümü." } };
}

/** yapay zekâ API anahtarı (maket Y1): bir kez yazılır, şifreli saklanır (sir.ts), bir daha gösterilmez — yalnız son 4. null: kaldır.
    ac: ekranda "Açık" seçiliyken anahtar girildi (maket Z1: "anahtarı giren yapay zekâyı açmak istiyor") — bölümün gördüğü sürüm; yapay zekâ da
    açılır (sürüm tutmazsa hiçbir şey yazılmaz) */
export async function yzAnahtarYaz(db: Sorgulayici, kim: Kisi, girdi: unknown | null, ac: number | null = null): Promise<AyarYazma> {
  if (!ayarlarYazar(kim)) return { durum: "yetkisiz" };
  let anahtar: string | null = null;
  if (girdi !== null) {
    const g = dogrula(AnahtarGirdisi, girdi);
    if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
    anahtar = g.veri.anahtar;
  }
  const y = await ayarOku(db, "yapay_zeka");
  const acilacak = anahtar !== null && ac !== null && !y.deger.acik;
  if (acilacak && (!Number.isSafeInteger(ac) || (y.id === null ? -1 : y.surum) !== ac)) return { durum: "cakisma" };
  try {
    await sirYaz(db, "yapay_zeka_anahtari", anahtar, { kim: kim.ad });
  } catch (h) {
    /* ana şifreleme anahtarı ortamda yoksa sır düz metne düşmez: yazılmaz, söylenir (kaldırma ana anahtarsız olur) */
    if (h instanceof Error && /Sır anahtarı tanımlı değil/.test(h.message)) return { durum: "red", neden: "Sunucuda sır şifreleme anahtarı tanımlı değil; anahtar kaydedilemedi (yönetim ayarı)." };
    throw h;
  }
  if (acilacak) {
    const r = await ayarYaz(db, "yapay_zeka", ac!, { ...y.deger, acik: true }, { kim: kim.ad, ne: "firma_ayar.yz", gerekce: "anahtarla birlikte açıldı" });
    if (r.durum !== "tamam" && r.durum !== "degisiklik_yok") throw new Error("yapay zekâ açılamadı");
    return { durum: "tamam", bildirim: "API anahtarı kaydedildi; yapay zekâ açık." };
  }
  return { durum: "tamam", bildirim: anahtar ? "API anahtarı kaydedildi." : "API anahtarı kaldırıldı." };
}

const kucuk = (s: string) => s.trim().toLocaleLowerCase("tr");
/** firmaya yeni özlük belge türü (maket Z5): adı var olan bir türle (ya da "… sertifikası" ile) aynı olamaz; ek1–ek30. Hemen kaydedilir. */
export async function belgeTuruEkle(db: Sorgulayici, kim: Kisi, girdi: unknown): Promise<AyarYazma> {
  if (!ayarlarYazar(kim)) return { durum: "yetkisiz" };
  const g = dogrula(BelgeTuruGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  await belgeTurKilidi(db);
  const t = await musteriBelgeTurleri(db), ad = g.veri.ad;
  if (t.turler.some((x) => kucuk(x.ad) === kucuk(ad) || kucuk(x.ad) === kucuk(`${ad} sertifikası`))) return { durum: "gecersiz", hatalar: { ad: "Bu adla bir belge türü zaten var." } };
  if (t.ek.length >= 30) return { durum: "gecersiz", hatalar: { ad: "En çok 30 tür eklenir." } };
  /* kaldırılmış türün anahtarı yeniden verilmez: her zaman verilmiş en büyük numaranın bir fazlası */
  const n = t.son + 1;
  if (n > 999) return { durum: "gecersiz", hatalar: { ad: "Eklenebilecek tür sınırı doldu." } };
  const r = await ayarYaz(db, "belge_tur_ek", t.ekSurum, { turler: [...t.ek, { k: `ek${n}`, ad, kisisel: g.veri.kisisel }], son: n }, { kim: kim.ad, ne: "belge_tur_ek.ekle", gerekce: ad });
  return SONUC(r, `${ad} eklendi; Personel'de belge yüklerken seçilebilir. Müşteriye açmak için işaretleyip kaydedin.`);
}
/** firmanın eklediği türü kaldır: yalnız o türde yüklü belge yokken; müşteriye açık listeden de düşer */
export async function belgeTuruKaldir(db: Sorgulayici, kim: Kisi, k: string): Promise<AyarYazma> {
  if (!ayarlarYazar(kim)) return { durum: "yetkisiz" };
  await belgeTurKilidi(db);   // sayım ile özlük belgesi ekleme yarışmaz
  const t = await musteriBelgeTurleri(db), x = t.ek.find((y) => y.k === k);
  if (!x) return { durum: "red", neden: "Belge türü bulunamadı." };
  const n = await ozlukTurKullanimi(db, k);
  if (n) return { durum: "red", neden: `${x.ad} kaldırılamaz: ${n} personelde bu türde yüklü belge var.` };
  const r = await ayarYaz(db, "belge_tur_ek", t.ekSurum, { turler: t.ek.filter((y) => y.k !== k), son: t.son }, { kim: kim.ad, ne: "belge_tur_ek.kaldir", gerekce: x.ad });
  if (r.durum !== "tamam") return SONUC(r, "");
  const mb = await ayarOku(db, "musteri_belge");
  if (mb.deger.ozluk.includes(k)) {
    /* müşteriye açık listeden düşmezse tür kaldırılmış sayılmaz: işlem geri alınır (yazma hatası yutulmaz — 335 incelemesi) */
    const m = await ayarYaz(db, "musteri_belge", mb.surum, { ...mb.deger, ozluk: mb.deger.ozluk.filter((y) => y !== k) }, { kim: kim.ad, ne: "musteri_belge.tur_kaldir" });
    if (m.durum !== "tamam" && m.durum !== "degisiklik_yok") throw new Error("müşteriye açık belgelerden düşürülemedi");
  }
  return { durum: "tamam", bildirim: `${x.ad} kaldırıldı.` };
}

/** firma kodu (rapor numarasının başı); açılmış raporların numarası değişmez. gorulen: ekranın gördüğü kod (iyimser kilit; yetki vermez) */
export async function firmaKoduKaydet(db: Sorgulayici, kim: Kisi, girdi: unknown): Promise<AyarYazma> {
  if (!ayarlarYazar(kim)) return { durum: "yetkisiz" };
  const g = dogrula(KodGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const r = await firmaKoduYaz(db, g.veri.kod, g.veri.gorulen, { kim: kim.ad, ne: "firma.rapor_kodu" });
  if (r === "cakisma") return { durum: "cakisma" };
  return { durum: "tamam", bildirim: `Firma kodu ${g.veri.kod}; yeni raporlar bu kodla numaralanır.`, ...(r === "degisiklik_yok" ? { degismedi: true as const } : {}) };
}

const DOSYA_TURU = { png: "PNG", jpeg: "JPEG", pdf: "PDF", xlsx: "Excel (.xlsx)" } as const;
/** logo / ön bilgilendirme formu / bordro formatı: yükle (eskisi çöpe) ya da kaldır (belge null) */
export async function ayarDosyasiYaz(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, ne: string, surum: number,
  belge: { ad: string; bayt: Uint8Array } | null): Promise<AyarYazma> {
  if (!ayarlarYazar(kim)) return { durum: "yetkisiz" };
  if (!Object.hasOwn(AYAR_DOSYASI, ne)) return { durum: "gecersiz", hatalar: { dosya: "Bilinmeyen dosya." } };
  const t = AYAR_DOSYASI[ne as AyarDosyasi];
  if (!Number.isSafeInteger(surum) || surum < -1) return { durum: "cakisma" };
  if (belge && belge.bayt.length > t.mb << 20) return { durum: "gecersiz", hatalar: { dosya: `En çok ${t.mb} MB.` } };
  const bolum = t.bolum as "firma_bilgileri" | "belge_sablon";
  const o = await ayarOku(db, bolum);
  /* sürüm yüklemeden ÖNCE: eski ekranın yüklediği dosya hiçbir ayara bağlı olmadan kalmaz (334 incelemesi) */
  if ((o.id === null ? -1 : o.surum) !== surum) return { durum: "cakisma" };
  const eski = (o.deger as Record<string, unknown>)[t.alan] as string | null;
  let yeni: string | null = null;
  if (belge) {
    const y = await dosyaYukle(db, depo, { firmaId, modul: AYAR_DOSYA, kayitId: firmaId, ad: belge.ad, bayt: belge.bayt, izinli: [...t.turler], kim: kim.ad, yukleyen: kim.id });
    if (!y.tamam) return { durum: "gecersiz", hatalar: { dosya: y.neden === "buyuk" ? `En çok ${t.mb} MB.` : `Dosya ${t.turler.map((x) => DOSYA_TURU[x]).join(" ya da ")} olmalı.` } };
    yeni = y.id;
  }
  const r = await ayarYaz(db, bolum, surum, { ...o.deger, [t.alan]: yeni }, { kim: kim.ad, ne: `firma_ayar.${ne}` });
  if (r.durum !== "tamam" && r.durum !== "degisiklik_yok") {
    /* arada başkası kaydetti: yeni yüklenen dosya çöpe (öksüz etkin kayıt kalmaz) */
    if (yeni) await dosyaCope(db, yeni, { kim: kim.ad, ne: `firma_ayar.${ne}.cakisma` });
    return SONUC(r, "");
  }
  if (eski && eski !== yeni) await dosyaCope(db, eski, { kim: kim.ad, ne: `firma_ayar.${ne}.cope` });
  return { durum: "tamam", bildirim: belge ? `${t.ad} kaydedildi.` : `${t.ad} kaldırıldı.` };
}

/** dosya erişimi (src/server/dosya/erisim.ts): firma ayarı dosyası (kayıt = firma) — firmanın her kullanıcısı (logo belgelerde, şablonlar işte) */
export async function ayarDosyasiGorulur(db: Sorgulayici, _kisi: YetkiHesabi, kayitId: string): Promise<boolean> {
  return (await db.sorgu("SELECT 1 FROM firma WHERE id = $1", [kayitId])).rowCount === 1;
}
