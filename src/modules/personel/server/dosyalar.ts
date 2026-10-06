/* PERSONEL DOSYASI — kartın alt bölümleri (maket personel.html: özlük dosyası, ekipman atamaları, maaş ve bordrolar, zimmetindekiler + imzalı
   zimmet formu). Yetki her işlevde, sunucuda (canDo, modül 2):
   · ÖZLÜK ve BORDRO yalnız "yaz" düzeyinde görülür ve değiştirilir (KVKK: özlük ve maaş bilgisi; Muhasebe'nin bordro görünürlüğü Muhasebe kaleminde).
   · ATAMA ve ZİMMET kartı görebilen görür ("kendi" düzeyi yalnız kendisininkini); değiştirmek "yaz".
   Belgeler tek dosya yolundan (yalnız PDF), ZORUNLU; kayıt eklenir → dosya yüklenir → kayda bağlanır; dosya reddedilirse işlem düşer (DosyaHatasi).
   Silme yok: kaldırılan satır "kaldirildi" ile kalır. Aynı dönemin yeni bordrosu eskisini kaldırır; kişi × tür başına tek geçerli atama.
   İmzalı zimmet formunun kapsamı istemciden alınmaz: yükleme anındaki zimmet sunucuda okunur; zimmet sonradan değişirse form "eskidi".
   344: zimmet teslim formu temel formatla (src/belge/zimmet.ts) indirilir ya da kişinin imzasına gönderilir (Onaylar › Diğer belgeler; numara
   ZF-AAYY-SIRA, kapsam gönderme anındaki zimmet, form kaydı belgenin kaynağı). Kişi imzalayınca imzalı PDF imzalı zimmet formu olur; yeni form
   gönderilince önceki bekleyen iptal olur (kişi eski kapsamı imzalamaz).
   Öteki modüllerin tablolarına dokunmaz: tür ve zimmet bilgisi o modüllerin dışa açtığı işlevlerden. */
import type { ZimmetFormuVerisi } from "../../../belge/zimmet.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo, type TabloTanimi } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle, kayitDosyasi } from "../../../server/dosya/dosya.ts";
import { numaraAl } from "../../../server/numara/numara.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { kisininVarliklari, type VarlikSatiri } from "../../zimmetler/server/zimmet.ts";
import { belgeGonder, bordroBelgeleri, bordroKilidi, guncelBordroBelgesi, kaynakBelgeleri, kaynakBelgesiniIptal } from "../../onaylar/server/belge-baglanti.ts";
import { bordroBelgeAdi, type BelgeDurumu } from "../../onaylar/sema.ts";
import { AtamaGirdisi, BordroGirdisi, meslek, OzlukGirdisi, ozlukTurleri, type EkTur } from "../sema.ts";
import { ayarOku, belgeTurKilidi, firmaBelgeKunyesi } from "../../../server/ayar/ayar.ts";
import { personelOzetleri } from "./personel.ts";
import { personelKartiGorur } from "./kart-baglanti.ts";
import { personelHesaplari } from "../../../server/kimlik/hesap.ts";

/** firmanın eklediği özlük türleri (Firma ayarları; 335) */
export const ekTurler = async (db: Sorgulayici): Promise<EkTur[]> => (await ayarOku(db, "belge_tur_ek")).deger.turler.map(({ k, ad }) => ({ k, ad }));

const MODUL = 2;
export const DOSYA = { ozluk: "ozluk", atama: "atama", bordro: "bordro", zimmetFormu: "zimmet_formu" } as const;
const OZLUK = tablo({ ad: "ozluk_belgesi", sutunlar: ["personel_id", "tur", "aciklama", "dosya_id", "kaldirildi"] });
const ATAMA = tablo({ ad: "ekipman_atamasi", sutunlar: ["personel_id", "tur_id", "tarih", "dosya_id", "kaldirildi"] });
const BORDRO = tablo({ ad: "bordro", sutunlar: ["personel_id", "ay", "brut", "net", "maliyet", "dosya_id", "kaldirildi"] });
const FORM = tablo({ ad: "zimmet_formu", sutunlar: ["personel_id", "kapsam", "dosya_id"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** iş günü (aylık maliyet → günlük; maket MV.IS_GUNU) */
export const IS_GUNU = 22;

export interface Kisi extends YetkiHesabi { ad: string }
export interface OzlukSatiri { id: string; tur: string; aciklama: string | null; dosyaId: string | null; tarih: string; surum: number }
export interface AtamaSatiri { id: string; turId: string; tur: string; brans: "m" | "e" | null; tarih: string; dosyaId: string | null; surum: number }
/** tutarlar kuruş (tam sayı) */
export interface BordroSatiri {
  id: string; ay: string; brut: number; net: number; maliyet: number; dosyaId: string | null; yuklendi: string; surum: number;
  /** 333: dönemin bordrosu kişinin imzasına gönderildi mi (Onaylar › Diğer belgeler) — gönderilmediyse null */
  onay: { durum: BelgeDurumu; karar: string | null } | null;
}
export interface ZimmetFormu { id: string; tarih: string; kapsam: number; dosyaId: string | null; guncel: boolean }
/** imzaya gönderilmiş ve henüz imzalanmamış son form (344): belgenin adı (numarasıyla) ve durumu */
export interface ZimmetGonderimi { ad: string; durum: BelgeDurumu; tarih: string }
export interface PersonelDosyasi {
  yaz: boolean;
  /** null: görme yetkisi yok (bölüm çizilmez) */
  ozluk: OzlukSatiri[] | null; bordrolar: BordroSatiri[] | null;
  atamalar: AtamaSatiri[]; zimmet: VarlikSatiri[]; zimmetFormu: ZimmetFormu | null; zimmetGonderimi: ZimmetGonderimi | null;
  turler: { id: string; ad: string; brans: "m" | "e" }[];
  /** özlük belge türleri (sabitler + firmanın ekledikleri; 335) */
  ozlukTurleri: (readonly [string, string])[];
}

export type Yazma =
  | { durum: "tamam"; id: string; bildirim?: string }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };
/** belge reddedilirse kayıt da yazılmaz (işlem düşer) */
export class DosyaHatasi extends Error {}

type Belge = { ad: string; bayt: Uint8Array };
const yazar = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
const surumGecerli = (s: number) => Number.isSafeInteger(s) && s >= 0;
const gun = (d: Date | string) => (typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10));
const kurus = (s: string) => Math.round(Number(s) * 100);
const lira = (k: number) => (k / 100).toFixed(2);
export const bugunTr = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

/** kişinin kartını görebilir mi (personelKarti ile aynı kural, tek yer: kart-baglanti.ts) */
const kartGorur = personelKartiGorur;
async function etkinKisi(db: Sorgulayici, personelId: string): Promise<boolean> {
  return UUID.test(personelId) && !!(await db.sorgu("SELECT 1 FROM personel WHERE id = $1 AND durum = 'etkin'", [personelId])).rowCount;
}
const anahtarlar = (v: VarlikSatiri[]) => v.map((x) => x.anahtar).sort();

/** kartın bütün dosya bölümleri; kart görülmüyorsa null */
export async function personelDosyasi(db: Sorgulayici, kim: Kisi, personelId: string): Promise<PersonelDosyasi | null> {
  if (!(await kartGorur(db, kim, personelId))) return null;
  const yaz = yazar(kim);
  const turler = await turOzetleri(db);
  const atamalar = (await db.sorgu<{ id: string; tur_id: string; tarih: string; dosya_id: string | null; surum: number }>(
    "SELECT id::text, tur_id::text, tarih::text, dosya_id::text, surum FROM ekipman_atamasi WHERE personel_id = $1 AND kaldirildi IS NULL", [personelId])).rows
    .map((a) => { const t = turler.find((x) => x.id === a.tur_id); return { id: a.id, turId: a.tur_id, tur: t?.ad ?? "—", brans: t?.brans ?? null, tarih: a.tarih, dosyaId: a.dosya_id, surum: a.surum }; })
    .sort((a, b) => (a.brans === b.brans ? a.tur.localeCompare(b.tur, "tr") : a.brans === "m" ? -1 : 1));
  const zimmet = await kisininVarliklari(db, personelId);
  /* imzalı form: yüklenen tarama (dosya_id) ya da Onaylar'da imzalanan gönderim (belgenin imzalı PDF'i) — hangisi yeniyse (344) */
  const formlar = (await db.sorgu<{ id: string; olustu: Date; kapsam: string[]; dosya_id: string | null }>(
    "SELECT id::text, olustu, kapsam, dosya_id::text FROM zimmet_formu WHERE personel_id = $1 ORDER BY olustu DESC", [personelId])).rows;
  const belgeler = await kaynakBelgeleri(db, formlar.filter((x) => !x.dosya_id).map((x) => x.id));
  const fi = formlar.findIndex((x) => x.dosya_id || belgeler.get(x.id)?.durum === "imzali"), f = formlar[fi];
  const zimmetFormu = f ? { id: f.id, tarih: gun(f.olustu), kapsam: f.kapsam.length, dosyaId: f.dosya_id ?? belgeler.get(f.id)!.imzaliDosya,
    guncel: [...f.kapsam].sort().join() === anahtarlar(zimmet).join() } : null;
  const gb = formlar.slice(0, fi < 0 ? formlar.length : fi).map((x) => ({ x, b: belgeler.get(x.id) })).find((y) => y.b);
  const zimmetGonderimi = gb?.b ? { ad: gb.b.ad, durum: gb.b.durum, tarih: gun(gb.x.olustu) } : null;
  let ozluk: OzlukSatiri[] | null = null, bordrolar: BordroSatiri[] | null = null;
  if (yaz) {
    ozluk = (await db.sorgu<{ id: string; tur: string; aciklama: string | null; dosya_id: string | null; olustu: Date; surum: number }>(
      "SELECT id::text, tur, aciklama, dosya_id::text, olustu, surum FROM ozluk_belgesi WHERE personel_id = $1 AND kaldirildi IS NULL ORDER BY olustu DESC", [personelId])).rows
      .map((x) => ({ id: x.id, tur: x.tur, aciklama: x.aciklama, dosyaId: x.dosya_id, tarih: gun(x.olustu), surum: x.surum }));
    bordrolar = (await db.sorgu<{ id: string; ay: string; brut: string; net: string; maliyet: string; dosya_id: string | null; olustu: Date; surum: number }>(
      "SELECT id::text, ay, brut::text, net::text, maliyet::text, dosya_id::text, olustu, surum FROM bordro WHERE personel_id = $1 AND kaldirildi IS NULL ORDER BY ay DESC", [personelId])).rows
      .map((x) => ({ id: x.id, ay: x.ay, brut: kurus(x.brut), net: kurus(x.net), maliyet: kurus(x.maliyet), dosyaId: x.dosya_id, yuklendi: gun(x.olustu), surum: x.surum, onay: null }));
    /* durum bordro KAYDININ belgesinden (333 incelemesi: dönemle eşlenince yeniden yüklenen, imzalanmamış bordro "İmzalandı" görünüyordu) */
    const onay = await bordroBelgeleri(db, [personelId]);
    for (const b of bordrolar) { const o = guncelBordroBelgesi(onay, personelId, b.ay, b.id); if (o) b.onay = { durum: o.durum, karar: o.karar }; }
  }
  return { yaz, ozluk, bordrolar, atamalar, zimmet, zimmetFormu, zimmetGonderimi, turler: yaz ? turler : [], ozlukTurleri: ozlukTurleri(await ekTurler(db)) };
}

/** günlük maliyet (kuruş): son bordronun işverene maliyeti / iş günü — iş kârlılığına girer */
export const gunlukMaliyet = (b: BordroSatiri | undefined) => (b ? Math.round(b.maliyet / IS_GUNU) : 0);

/* ── ortak: belgeyi yükle ve kayda bağla ── */
async function belgeBagla<S extends string>(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, t: TabloTanimi<S>, modul: string, kayit: { id: string; surum: number }, belge: Belge, ne: string) {
  const y = await dosyaYukle(db, depo, { firmaId, modul, kayitId: kayit.id, ad: belge.ad, bayt: belge.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) throw new DosyaHatasi(y.neden === "buyuk" ? "PDF en çok 25 MB." : "Dosya PDF değil ya da bozuk.");
  const r = await guncelle(db, t, kayit.id, kayit.surum, { dosya_id: y.id } as Partial<Record<S, unknown>>, { kim: kim.ad, ne });
  if (r.durum !== "tamam") throw new DosyaHatasi("Belge kayda bağlanamadı. Yeniden deneyin.");
}

/** var olan satırın belgesini değiştir / satırı kaldır (üç tablo için ortak) */
async function satirIslemi<S extends string>(db: Sorgulayici, depo: Depo | null, kim: Kisi, firmaId: string | null, t: TabloTanimi<S>, modul: string, id: string, surum: number, belge: Belge | null): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id) || !(await db.sorgu(`SELECT 1 FROM ${t.ad} WHERE id = $1 AND kaldirildi IS NULL`, [id])).rowCount) return { durum: "yok" };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  if (belge && depo && firmaId) {
    const y = await dosyaYukle(db, depo, { firmaId, modul, kayitId: id, ad: belge.ad, bayt: belge.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
    if (!y.tamam) return { durum: "gecersiz", hatalar: { dosya: y.neden === "buyuk" ? "PDF en çok 25 MB." : "Dosya PDF değil ya da bozuk." } };
    const r = await guncelle(db, t, id, surum, { dosya_id: y.id } as Partial<Record<S, unknown>>, { kim: kim.ad, ne: `${t.ad}.belge` });
    return r.durum === "cakisma" || r.durum === "yok" ? { durum: r.durum } : { durum: "tamam", id };
  }
  const r = await guncelle(db, t, id, surum, { kaldirildi: new Date().toISOString() } as Partial<Record<S, unknown>>, { kim: kim.ad, ne: `${t.ad}.kaldir` });
  return r.durum === "cakisma" || r.durum === "yok" ? { durum: r.durum } : { durum: "tamam", id };
}

/* ── ÖZLÜK ── */
export async function ozlukEkle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, personelId: string, girdi: unknown, belge: Belge | null): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(personelId) || !(await db.sorgu("SELECT 1 FROM personel WHERE id = $1", [personelId])).rowCount) return { durum: "yok" };
  const g = dogrula(OzlukGirdisi, girdi);
  const h: DogrulamaHatalari = g.tamam ? {} : { ...g.hatalar };
  /* firmanın eklediği türde: tür kaldırma ile yarışmaz (kilit işlem sonuna kadar — 335 incelemesi) */
  if (g.tamam && g.veri.tur.startsWith("ek")) await belgeTurKilidi(db);
  if (g.tamam && !ozlukTurleri(await ekTurler(db)).some(([k]) => k === g.veri.tur)) h.tur = "Belge türü seçilmeli.";
  if (!belge) h.dosya = "Belge (PDF) seçilmeli.";
  if (!g.tamam || !belge || Object.keys(h).length) return { durum: "gecersiz", hatalar: h };
  const r = await ekle(db, OZLUK, { personel_id: personelId, tur: g.veri.tur, aciklama: g.veri.aciklama }, { kim: kim.ad, ne: "ozluk.ekle" });
  await belgeBagla(db, depo, kim, firmaId, OZLUK, DOSYA.ozluk, r, belge, "ozluk.belge");
  return { durum: "tamam", id: r.id };
}
export const ozlukBelgeDegistir = (db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, surum: number, belge: Belge) =>
  satirIslemi(db, depo, kim, firmaId, OZLUK, DOSYA.ozluk, id, surum, belge);
export const ozlukKaldir = (db: Sorgulayici, kim: Kisi, id: string, surum: number) => satirIslemi(db, null, kim, null, OZLUK, DOSYA.ozluk, id, surum, null);

/* ── EKİPMAN ATAMASI (karar L4: atanmadığı türde plan ve rapor yalnız UYARI) ── */
export async function atamaEkle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, personelId: string, girdi: unknown, belge: Belge | null): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  if (!(await etkinKisi(db, personelId))) return { durum: "yok" };
  const g = dogrula(AtamaGirdisi, girdi);
  const h: DogrulamaHatalari = g.tamam ? {} : { ...g.hatalar };
  if (!belge) h.dosya = "Atama belgesi (PDF) seçilmeli.";
  if (g.tamam) {
    if (g.veri.tarih > bugunTr()) h.tarih = "Atama tarihi bugünden ileri olamaz.";
    if (!(await turOzetleri(db)).some((t) => t.id === g.veri.tur)) h.tur = "Ekipman türü seçilmeli.";
    else if ((await db.sorgu("SELECT 1 FROM ekipman_atamasi WHERE personel_id = $1 AND tur_id = $2 AND kaldirildi IS NULL", [personelId, g.veri.tur])).rowCount)
      h.tur = "Bu türe ataması var; belgeyi değiştirin.";
  }
  if (!g.tamam || Object.keys(h).length || !belge) return { durum: "gecersiz", hatalar: h };
  const r = await ekle(db, ATAMA, { personel_id: personelId, tur_id: g.veri.tur, tarih: g.veri.tarih }, { kim: kim.ad, ne: "atama.ekle" });
  await belgeBagla(db, depo, kim, firmaId, ATAMA, DOSYA.atama, r, belge, "atama.belge");
  return { durum: "tamam", id: r.id };
}
export const atamaBelgeDegistir = (db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, surum: number, belge: Belge) =>
  satirIslemi(db, depo, kim, firmaId, ATAMA, DOSYA.atama, id, surum, belge);
export const atamaKaldir = (db: Sorgulayici, kim: Kisi, id: string, surum: number) => satirIslemi(db, null, kim, null, ATAMA, DOSYA.atama, id, surum, null);

/** öteki modüller için (plan / rapor uyarısı): kişinin atandığı tür kimlikleri. Yetki ÇAĞIRANDA. */
export async function atananTurler(db: Sorgulayici, personelId: string): Promise<string[]> {
  if (!UUID.test(personelId)) return [];
  return (await db.sorgu<{ t: string }>("SELECT tur_id::text AS t FROM ekipman_atamasi WHERE personel_id = $1 AND kaldirildi IS NULL", [personelId])).rows.map((x) => x.t);
}

/* ── BORDRO: aynı dönemin yenisi eskisini kaldırır (saklanır) ── */
export async function bordroYukle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, personelId: string, girdi: unknown, belge: Belge | null): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(personelId) || !(await db.sorgu("SELECT 1 FROM personel WHERE id = $1", [personelId])).rowCount) return { durum: "yok" };
  const g = dogrula(BordroGirdisi, girdi);
  const h: DogrulamaHatalari = g.tamam ? {} : { ...g.hatalar };
  if (!belge) h.dosya = "Bordro (PDF) seçilmeli.";
  if (g.tamam && g.veri.ay > bugunTr().slice(0, 7)) h.ay = "Gelecek ayın bordrosu yüklenemez.";
  if (!g.tamam || Object.keys(h).length || !belge) return { durum: "gecersiz", hatalar: h };
  const v = g.veri;
  await bordroKilidi(db, personelId, v.ay);
  const eski = (await db.sorgu<{ id: string; surum: number }>(
    "SELECT id::text, surum FROM bordro WHERE personel_id = $1 AND ay = $2 AND kaldirildi IS NULL FOR UPDATE", [personelId, v.ay])).rows[0];
  let iptal = 0;
  if (eski) {
    await guncelle(db, BORDRO, eski.id, eski.surum, { kaldirildi: new Date().toISOString() }, { kim: kim.ad, ne: "bordro.kaldir", gerekce: "aynı dönemin yenisi yüklendi" });
    /* eski bordronun bekleyen imzası iptal: kişi eski PDF'i imzalamasın; yenisi yeniden onaya gönderilir (333 incelemesi) */
    iptal = await kaynakBelgesiniIptal(db, kim, eski.id);
  }
  const r = await ekle(db, BORDRO, { personel_id: personelId, ay: v.ay, brut: lira(v.brut), net: lira(v.net), maliyet: lira(v.maliyet) }, { kim: kim.ad, ne: "bordro.yukle" });
  await belgeBagla(db, depo, kim, firmaId, BORDRO, DOSYA.bordro, r, belge, "bordro.belge");
  return { durum: "tamam", id: r.id, bildirim: iptal ? "Bordro yüklendi; önceki bordronun bekleyen onayı iptal edildi — yenisini onaya gönderin." : undefined };
}
/** bordroyu kaldır; bekleyen imzası iptal olur (333 incelemesi) */
export async function bordroKaldir(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<Yazma> {
  const r = await satirIslemi(db, null, kim, null, BORDRO, DOSYA.bordro, id, surum, null);
  if (r.durum === "tamam" && await kaynakBelgesiniIptal(db, kim, id)) return { ...r, bildirim: "Kaldırıldı; bordronun bekleyen onayı iptal edildi." };
  return r;
}

/** bordroyu kişinin imzasına gönder (333; maket personel.html "Onaya gönder" → Onaylar › Diğer belgeler): yalnız "yaz"; bordronun PDF'i
    belgenin kendi dosyası olur. Aynı dönemin bordrosu ikinci kez gönderilmez (geri gönderilen yeniden gönderilir). */
export async function bordroOnayaGonder(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string): Promise<Yazma | { durum: "red"; neden: string }> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  const b = (await db.sorgu<{ personel_id: string; ay: string; dosya_id: string | null }>(
    "SELECT personel_id::text, ay, dosya_id::text FROM bordro WHERE id = $1 AND kaldirildi IS NULL", [id])).rows[0];
  if (!b) return { durum: "yok" };
  const d = b.dosya_id ? await kayitDosyasi(db, DOSYA.bordro, id, b.dosya_id) : null;
  if (!d) return { durum: "red", neden: "Bordronun PDF'i yok; önce bordroyu yükleyin." };
  const r = await belgeGonder(db, depo, kim, firmaId, {
    tur: "bordro", ad: bordroBelgeAdi(b.ay), personelId: b.personel_id, kaynakId: id, ay: b.ay, pdf: { ad: `bordro-${b.ay}.pdf`, bayt: await depo.oku(d.anahtar, db) },
  });
  if (r.durum === "zaten") return { durum: "red", neden: "Bu dönemin bordrosu zaten imzaya gönderildi." };
  if (r.durum === "uygunsuz") return { durum: "red", neden: r.neden };
  return { durum: "tamam", id };
}

/* ── İMZALI ZİMMET FORMU: kapsam yükleme anındaki zimmetten (sunucuda) ── */
export async function zimmetFormuYukle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, personelId: string, belge: Belge | null): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(personelId) || !(await db.sorgu("SELECT 1 FROM personel WHERE id = $1", [personelId])).rowCount) return { durum: "yok" };
  if (!belge) return { durum: "gecersiz", hatalar: { dosya: "İmzalı form (PDF) seçilmeli." } };
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`zimmet_formu:${personelId}`]);
  const z = await kisininVarliklari(db, personelId);
  if (!z.length) return { durum: "gecersiz", hatalar: { dosya: "Zimmetinde varlık yok; form yüklenmez." } };
  /* ıslak imzalı tarama gelince imzaya gönderilmiş bekleyen form iptal olur (aynı zimmet iki yoldan imzalanmaz; 344) */
  for (const x of (await db.sorgu<{ id: string }>("SELECT id::text FROM zimmet_formu WHERE personel_id = $1 AND dosya_id IS NULL", [personelId])).rows) {
    await kaynakBelgesiniIptal(db, kim, x.id);
  }
  const r = await ekle(db, FORM, { personel_id: personelId, kapsam: anahtarlar(z) }, { kim: kim.ad, ne: "zimmet_formu.yukle" });
  await belgeBagla(db, depo, kim, firmaId, FORM, DOSYA.zimmetFormu, r, belge, "zimmet_formu.belge");
  return { durum: "tamam", id: r.id };
}

/* ── ZİMMET TESLİM FORMU (344; maket personel.html zimmet formu "PDF indir" / "İmzala", MB.zimmetFormu; AA3) ── */
const VARLIK_TUR = { c: "Ölçüm cihazı", a: "Araç", d: "Demirbaş" } as const;
const GUN_TR = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const tarihNo = (g: string) => `${g.slice(8, 10)}.${g.slice(5, 7)}.${g.slice(0, 4)}`;
async function zimmetVerisi(db: Sorgulayici, personelId: string, z: VarlikSatiri[], no: string | null, depo: Depo | null): Promise<ZimmetFormuVerisi> {
  const eden = (await ayarOku(db, "zimmet")).deger.teslim_eden;
  const kisiler = new Map((await personelOzetleri(db, eden ? [personelId, eden] : [personelId]))
    .map((p) => [p.id, { ad: p.ad, meslek: p.meslek === "diger" ? p.meslekMetin ?? "Diğer meslek" : meslek(p.meslek)?.ad ?? p.meslek }]));
  const firma = await firmaBelgeKunyesi(db, depo);
  return {
    firma: { ad: firma.ad, kod: firma.kod, adres: firma.adres, logo: firma.logo }, no, tarih: bugunTr(),
    alan: kisiler.get(personelId) ?? { ad: "—", meslek: "—" }, eden: eden ? kisiler.get(eden) ?? null : null,
    varliklar: z.map((v) => ({ kod: v.kod, ad: v.ad, tur: VARLIK_TUR[v.tur], teslim: v.son ? GUN_TR.format(new Date(v.son.zaman)) : null,
      not: v.tur === "c" && v.bitis ? `kalibrasyon ${tarihNo(v.bitis)}` : null })),
  };
}

/** indirilen (imzaya gönderilmemiş, numarasız) form — ıslak imza için: yalnız Personel "yaz"; kişinin zimmeti yoksa null */
export async function zimmetFormuVerisi(db: Sorgulayici, kim: Kisi, personelId: string, depo: Depo | null = null): Promise<ZimmetFormuVerisi | null> {
  if (!yazar(kim) || !(await kartGorur(db, kim, personelId))) return null;
  const z = await kisininVarliklari(db, personelId);
  return z.length ? zimmetVerisi(db, personelId, z, null, depo) : null;
}

export type ZimmetPdfUretici = (v: ZimmetFormuVerisi) => Promise<Uint8Array>;
/** imzalayacak kişinin açık giriş hesabı (ilk girişini bekleyen de sayılır; kapalı sayılmaz) — Onaylar'da yalnız hesabın kişisi imzalar (0044) */
export const imzaHesabiVar = (durum: string | undefined) => durum === "etkin" || durum === "ilk";
/** formu kişinin imzasına gönder: yalnız "yaz"; kişi etkin ve zimmeti var. Kapsam sunucuda okunan zimmet; numara, form kaydı, PDF (uret: belge →
    PDF, sunucuda) ve belge AYNI işlemde (PDF düşerse hiçbiri yazılmaz — DosyaHatasi). Kişi başına sıraya girer; önceki bekleyen form iptal olur. */
export async function zimmetFormuGonder(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, personelId: string, uret: ZimmetPdfUretici): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(personelId) || !(await db.sorgu("SELECT 1 FROM personel WHERE id = $1", [personelId])).rowCount) return { durum: "yok" };
  /* 340–345 incelemesi: ayrılan personele ve giriş hesabı olmayana gönderilen form kimsenin imzalayamayacağı belge olurdu */
  if (!(await etkinKisi(db, personelId))) return { durum: "gecersiz", hatalar: { dosya: "Personel ayrılmış; form imzaya gönderilmez." } };
  if (!imzaHesabiVar((await personelHesaplari(db, [personelId])).get(personelId)?.durum)) {
    return { durum: "gecersiz", hatalar: { dosya: "Kişinin giriş hesabı yok; form imzaya gönderilemez. Formu indirip ıslak imzalı taramasını yükleyin." } };
  }
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`zimmet_formu:${personelId}`]);
  const z = await kisininVarliklari(db, personelId);
  if (!z.length) return { durum: "gecersiz", hatalar: { dosya: "Zimmetinde varlık yok; form gönderilmez." } };
  for (const x of (await db.sorgu<{ id: string }>("SELECT id::text FROM zimmet_formu WHERE personel_id = $1 AND dosya_id IS NULL", [personelId])).rows) {
    await kaynakBelgesiniIptal(db, kim, x.id);
  }
  const no = await numaraAl(db, "zimmet");
  const r = await ekle(db, FORM, { personel_id: personelId, kapsam: anahtarlar(z) }, { kim: kim.ad, ne: "zimmet_formu.gonder", gerekce: no });
  let pdf: Uint8Array;
  try { pdf = await uret(await zimmetVerisi(db, personelId, z, no, depo)); } catch { throw new DosyaHatasi("Formun PDF'i üretilemedi; biraz sonra yeniden deneyin."); }
  const g = await belgeGonder(db, depo, kim, firmaId, { tur: "zimmet", ad: `Zimmet teslim formu · ${no}`, personelId, kaynakId: r.id, ay: null, pdf: { ad: `${no}.pdf`, bayt: pdf } });
  if (g.durum !== "tamam") throw new DosyaHatasi(g.durum === "uygunsuz" ? g.neden : "Form imzaya gönderilemedi.");
  return { durum: "tamam", id: r.id, bildirim: `${no} zimmet teslim formu imzaya gönderildi (Onaylar › Diğer belgeler).` };
}

/* ── DOSYA ERİŞİMİ (src/server/dosya/erisim.ts) ── */
const kayitKisisi = async (db: Sorgulayici, t: string, kayitId: string) =>
  UUID.test(kayitId) ? (await db.sorgu<{ p: string }>(`SELECT personel_id::text AS p FROM ${t} WHERE id = $1`, [kayitId])).rows[0]?.p ?? null : null;
/** özlük ve bordro: yalnız "yaz" düzeyi */
export async function gizliDosyaGorulur(db: Sorgulayici, kisi: YetkiHesabi, tablo_: "ozluk_belgesi" | "bordro", kayitId: string): Promise<boolean> {
  return yazar(kisi) && !!(await kayitKisisi(db, tablo_, kayitId));
}
/** atama belgesi ve imzalı zimmet formu: kartı gören (denetçi yalnız kendisininkini) */
export async function kartDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, tablo_: "ekipman_atamasi" | "zimmet_formu", kayitId: string): Promise<boolean> {
  const p = await kayitKisisi(db, tablo_, kayitId);
  return !!p && (await kartGorur(db, kisi, p));
}

/** Planlar için (Plan aç uyarısı "ekipte bu türe atanmış denetçi yok", L4): kişi → atandığı türler (geçerli atamalar). Yetki ÇAĞIRANDA. */
export async function atamaHaritasi(db: Sorgulayici): Promise<Record<string, string[]>> {
  const r = await db.sorgu<{ personel_id: string; tur_id: string }>("SELECT personel_id::text, tur_id::text FROM ekipman_atamasi WHERE kaldirildi IS NULL");
  const h: Record<string, string[]> = {};
  for (const x of r.rows) (h[x.personel_id] ??= []).push(x.tur_id);
  return h;
}

/** Firma ayarları için (335 — firmanın eklediği belge türü ancak o türde belge yokken kaldırılır): türdeki geçerli özlük belgesi sayısı. Yetki ÇAĞIRANDA. */
export async function ozlukTurKullanimi(db: Sorgulayici, tur: string): Promise<number> {
  return Number((await db.sorgu<{ n: string }>("SELECT count(DISTINCT personel_id)::text AS n FROM ozluk_belgesi WHERE tur = $1 AND kaldirildi IS NULL", [tur])).rows[0].n);
}
