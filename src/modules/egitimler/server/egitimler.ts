/* EĞİTİMLER — modülün dışa açılan işlevleri (maket egitimler.html; modül 10, Dökümanlar'ın sekmesi). Sayfalar ve eylemler yalnız buradan.
   Yetki her işlevde, sunucuda (canDo, modül 10): "gör" ve üstü bütün kayıtları görür; "kendi" düzeyi (denetçi) yalnız kendi kayıtlarını;
   kayıt eklemek, tekrar kaydetmek, sertifika yüklemek ve eğitim türü eklemek / düzenlemek yalnız "yaz" düzeyinde. Tarih ileri olamaz (ENGEL);
   tekrar tarihi kayıt anında türün süresinden yazılır. Aynı kişi × eğitimde güncel kayıt tektir; tekrarı kaydedilince eskisi "önceki" olur.
   Sertifika tek dosya yolundan (yalnız PDF), isteğe bağlı. Silme yok. Personel bilgisi Personel modülünün dışa açtığı işlevden.
   345: katılım formu (temel format, src/belge/egitim.ts) güncel kaydın katılanının imzasına gönderilir (Onaylar › Diğer belgeler; numara EF-AAYY-SIRA,
   kaynak eğitim kaydı); kayıt başına tek etkin form (bekleyen ya da imzalı — geri gönderilen yeniden gönderilir); imzalı form kayıtta görünür.
   340–345 incelemesi: katılanın açık giriş hesabı yoksa gönderilmez; bekleyen form "Yeniden gönder"le iptal edilip yenisi gider (takılı kalmaz). */
import type { EgitimFormuVerisi } from "../../../belge/egitim.ts";
import { ayarOku, firmaBelgeKunyesi } from "../../../server/ayar/ayar.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { kesinSil, kullanimlar } from "../../../server/db/silici.ts";
import { ekle, guncelle, tablo } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { numaraAl } from "../../../server/numara/numara.ts";
import { canDoEylem, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { belgeGonder, kaynakBelgeleri, kaynakBelgesiniIptal } from "../../onaylar/server/belge-baglanti.ts";
import { personelHesaplari } from "../../../server/kimlik/hesap.ts";
import type { BelgeDurumu } from "../../onaylar/sema.ts";
import { meslek } from "../../personel/sema.ts";
import { personelOzetleri, personelSecenekleri } from "../../personel/server/personel.ts";
import { ayEkle, EgitimKaydiGirdisi, egitimDurumu, EgitimTuruGirdisi, type EgitimDurumu } from "../sema.ts";

const MODUL = 10;
export const DOSYA_MODULU = "egitim";
const TUR = tablo({ ad: "egitim_turu", sutunlar: ["ad", "tekrar_ay"] });
const KAYIT = tablo({ ad: "egitim_kaydi", sutunlar: ["personel_id", "tur_id", "tarih", "tekrar", "kurum", "dosya_id", "onceki"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface Kisi extends YetkiHesabi { ad: string }
export interface EgitimTuru { id: string; ad: string; tekrarAy: number; surum: number; kisi: number; gecti: number; yakin: number;
  /** 371: hiç kaydı yok, silebilen (yönetici) görüyor */
  sil?: boolean }
export interface EgitimKaydi {
  id: string; personelId: string; personel: string; turId: string; tur: string; tarih: string; tekrar: string; kurum: string; dosyaId: string | null; onceki: boolean;
  durum: EgitimDurumu; surum: number;
  /** katılım formu (345): son gönderilen belgenin durumu, imzalıysa imzalı PDF; gönderilmediyse null */
  form: { durum: BelgeDurumu; ad: string; imzaliDosya: string | null } | null;
  /** 371: sertifikası ve katılım formu yok, silebilen (yönetici) görüyor */
  sil?: boolean;
}

export type Yazma =
  | { durum: "tamam"; id: string }
  | { durum: "red"; neden: string }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

const degistirir = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
export const egitimDegistirir = degistirir;
export const bugunTr = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const surumGecerli = (s: number) => Number.isSafeInteger(s) && s >= 0;

async function kendiKisi(db: Sorgulayici, kim: YetkiHesabi): Promise<string | null | false> {
  const d = duzey(kim, MODUL);
  if (d === "yok" || d === "brans") return false;
  return d === "kendi" ? ((await hesabinPersoneli(db, kim.id)) ?? "") : null;
}

export async function egitimEsigi(db: Sorgulayici): Promise<number> {
  return (await ayarOku(db, "uyari_esikleri")).deger.egitim;
}

type KayitDb = { id: string; personel_id: string; tur_id: string; tarih: string; tekrar: string; kurum: string; dosya_id: string | null; onceki: boolean; surum: number };

async function kayitlar(db: Sorgulayici, ben: string | null): Promise<EgitimKaydi[]> {
  const [esik, turler, kisiler, l] = [await egitimEsigi(db), (await db.sorgu<{ id: string; ad: string }>("SELECT id::text, ad FROM egitim_turu")).rows, await personelSecenekleri(db),
    (await db.sorgu<KayitDb>("SELECT id::text, personel_id::text, tur_id::text, tarih::text, tekrar::text, kurum, dosya_id::text, onceki, surum FROM egitim_kaydi")).rows];
  const bugun = bugunTr();
  const gorulen = l.filter((x) => ben === null || x.personel_id === ben);
  const formlar = await kaynakBelgeleri(db, gorulen.map((x) => x.id));
  return gorulen.map((x) => ({
    id: x.id, personelId: x.personel_id, personel: kisiler.find((k) => k.id === x.personel_id)?.ad ?? "Ayrılan personel", turId: x.tur_id,
    tur: turler.find((t) => t.id === x.tur_id)?.ad ?? "—", tarih: x.tarih, tekrar: x.tekrar, kurum: x.kurum, dosyaId: x.dosya_id, onceki: x.onceki,
    durum: egitimDurumu(x.tekrar, bugun, esik), surum: x.surum,
    form: formlar.has(x.id) ? { durum: formlar.get(x.id)!.durum, ad: formlar.get(x.id)!.ad, imzaliDosya: formlar.get(x.id)!.imzaliDosya } : null,
  })).sort((a, b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : a.personel.localeCompare(b.personel, "tr")));
}

export async function egitimListesi(db: Sorgulayici, kim: Kisi): Promise<{ kayitlar: EgitimKaydi[]; turler: EgitimTuru[]; kisiler: { id: string; ad: string }[]; esik: number } | null> {
  const k = await kendiKisi(db, kim);
  if (k === false) return duzey(kim, MODUL) === "yok" ? null : { kayitlar: [], turler: [], kisiler: [], esik: 0 };
  const l = await kayitlar(db, k);
  const turler = (await db.sorgu<{ id: string; ad: string; tekrar_ay: number; surum: number }>("SELECT id::text, ad, tekrar_ay, surum FROM egitim_turu")).rows
    .map((t) => {
      const g = l.filter((x) => x.turId === t.id && !x.onceki);
      return { id: t.id, ad: t.ad, tekrarAy: t.tekrar_ay, surum: t.surum, kisi: g.length, gecti: g.filter((x) => x.durum === "gecti").length, yakin: g.filter((x) => x.durum === "yakin").length };
    }).sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
  /* 371: kesin silinebilenler (yönetici; kullanım veritabanında) */
  if (silebilir(kim)) {
    const kk = await kullanimlar(db, "egitim_kaydi", l.map((x) => x.id)), tk = await kullanimlar(db, "egitim_turu", turler.map((t) => t.id));
    for (const x of l) x.sil = !kk.has(x.id);
    for (const t of turler) (t as EgitimTuru).sil = !tk.has(t.id);
  }
  return { kayitlar: l, turler, kisiler: k === null ? (await personelSecenekleri(db)).map(({ id, ad }) => ({ id, ad })) : [], esik: await egitimEsigi(db) };
}

/** Personel kartı için: kişinin güncel eğitimleri (yetki: Eğitimler'i gören ya da kendisi) */
export async function kisininEgitimleri(db: Sorgulayici, kim: Kisi, personelId: string): Promise<EgitimKaydi[] | null> {
  if (!UUID.test(personelId)) return null;
  const k = await kendiKisi(db, kim);
  if (k === false || (k !== null && k !== personelId)) return null;
  return (await kayitlar(db, personelId)).filter((x) => !x.onceki);
}

export async function egitimTuruKaydet(db: Sorgulayici, kim: Kisi, id: string | null, surum: number, girdi: unknown): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  const g = dogrula(EgitimTuruGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const tr = (x: string) => x.toLocaleLowerCase("tr");
  const ayni = (await db.sorgu<{ id: string; ad: string }>("SELECT id::text, ad FROM egitim_turu")).rows.find((t) => tr(t.ad) === tr(g.veri.ad) && t.id !== id);
  if (ayni) return { durum: "gecersiz", hatalar: { ad: "Bu adla bir eğitim türü var." } };
  const degerler = { ad: g.veri.ad, tekrar_ay: g.veri.tekrar };
  if (!id) return { durum: "tamam", id: (await ekle(db, TUR, degerler, { kim: kim.ad, ne: "egitim_turu.ekle" })).id };
  if (!UUID.test(id)) return { durum: "yok" };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const r = await guncelle(db, TUR, id, surum, degerler, { kim: kim.ad, ne: "egitim_turu.guncelle" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id };
}

/** eğitim kaydı ekle ya da tekrarı kaydet: tarih ileri olamaz; aynı kişi × eğitimde güncel kayıt varsa o önceki olur; sertifika isteğe bağlı */
export async function egitimKaydet(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, girdi: unknown, belge?: { ad: string; bayt: Uint8Array } | null): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  const g = dogrula(EgitimKaydiGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  if (v.tarih > bugunTr()) return { durum: "gecersiz", hatalar: { tarih: "Eğitim tarihi bugünden ileri olamaz." } };
  if (!(await personelSecenekleri(db)).some((k) => k.id === v.personel)) return { durum: "gecersiz", hatalar: { personel: "Personel seçilmeli." } };
  const t = (await db.sorgu<{ tekrar_ay: number }>("SELECT tekrar_ay FROM egitim_turu WHERE id = $1", [v.tur])).rows[0];
  if (!t) return { durum: "gecersiz", hatalar: { tur: "Eğitim seçilmeli." } };
  const eski = (await db.sorgu<{ id: string; surum: number; tarih: string }>(
    "SELECT id::text, surum, tarih::text FROM egitim_kaydi WHERE personel_id = $1 AND tur_id = $2 AND NOT onceki FOR UPDATE", [v.personel, v.tur])).rows[0];
  if (eski && v.tarih <= eski.tarih) return { durum: "gecersiz", hatalar: { tarih: "Güncel kayıttan (aynı eğitim) sonraki bir tarih olmalı." } };
  if (eski) await guncelle(db, KAYIT, eski.id, eski.surum, { onceki: true }, { kim: kim.ad, ne: "egitim.onceki", gerekce: "tekrar kaydedildi" });
  const r = await ekle(db, KAYIT, { personel_id: v.personel, tur_id: v.tur, tarih: v.tarih, tekrar: ayEkle(v.tarih, t.tekrar_ay), kurum: v.kurum }, { kim: kim.ad, ne: "egitim.kaydet" });
  if (belge) {
    const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA_MODULU, kayitId: r.id, ad: belge.ad, bayt: belge.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
    if (!y.tamam) throw new DosyaHatasi(y.neden === "buyuk" ? "PDF en çok 25 MB." : "Dosya PDF değil ya da bozuk.");
    await guncelle(db, KAYIT, r.id, r.surum, { dosya_id: y.id }, { kim: kim.ad, ne: "egitim.sertifika" });
  }
  return { durum: "tamam", id: r.id };
}
/** sertifika reddedilirse kayıt da yazılmaz (işlem düşer) */
export class DosyaHatasi extends Error {}

/** var olan kayda sertifika yükle / değiştir (null: kaldır) */
export async function sertifikaYukle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, surum: number, belge: { ad: string; bayt: Uint8Array } | null): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id) || !(await db.sorgu("SELECT 1 FROM egitim_kaydi WHERE id = $1", [id])).rowCount) return { durum: "yok" };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  let dosyaId: string | null = null;
  if (belge) {
    const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA_MODULU, kayitId: id, ad: belge.ad, bayt: belge.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
    if (!y.tamam) return { durum: "gecersiz", hatalar: { dosya: y.neden === "buyuk" ? "PDF en çok 25 MB." : "Dosya PDF değil ya da bozuk." } };
    dosyaId = y.id;
  }
  const r = await guncelle(db, KAYIT, id, surum, { dosya_id: dosyaId }, { kim: kim.ad, ne: belge ? "egitim.sertifika" : "egitim.sertifika_kaldir" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id };
}

export type EgitimPdfUretici = (v: EgitimFormuVerisi) => Promise<Uint8Array>;
/** katılım formunu katılanın imzasına gönder (345): yalnız "yaz"; güncel kayıt (önceki değil), katılan etkin; kayıt başına tek etkin form. Numara,
    PDF (uret: belge → PDF, sunucuda) ve belge AYNI işlemde (PDF düşerse hiçbiri yazılmaz — DosyaHatasi). Kayıt başına sıraya girer. */
export async function katilimFormuGonder(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, kayitId: string, uret: EgitimPdfUretici): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(kayitId)) return { durum: "yok" };
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`egitim_formu:${kayitId}`]);
  const x = (await db.sorgu<KayitDb & { tur: string }>(
    `SELECT k.id::text, k.personel_id::text, k.tur_id::text, k.tarih::text, k.tekrar::text, k.kurum, k.dosya_id::text, k.onceki, k.surum, t.ad AS tur
       FROM egitim_kaydi k JOIN egitim_turu t ON t.id = k.tur_id AND t.firma_id = k.firma_id WHERE k.id = $1 FOR SHARE OF k`, [kayitId])).rows[0];
  /* 362–373 incelemesi: kayıt paylaşımlı kilitli — aynı anda koşan kaydı silme (0066, FOR UPDATE) ile sıraya girer (silinmiş kayda form gitmez) */
  if (!x) return { durum: "yok" };
  if (x.onceki) return { durum: "red", neden: "Önceki kaydın formu gönderilmez; güncel kayıttan gönderin." };
  const [p] = await personelOzetleri(db, [x.personel_id]);
  if (!p?.etkin) return { durum: "red", neden: "Katılan personel etkin değil." };
  const h = (await personelHesaplari(db, [x.personel_id])).get(x.personel_id)?.durum;
  if (h !== "etkin" && h !== "ilk") return { durum: "red", neden: "Katılanın giriş hesabı yok; form imzaya gönderilemez." };
  const once = (await kaynakBelgeleri(db, [x.id])).get(x.id)?.durum;
  if (once === "imzali") return { durum: "red", neden: "Bu kaydın katılım formu imzalandı." };
  /* bekleyen form: yeniden gönderilir — öncekini iptal eder (kişi eski formu imzalamaz) */
  if (once === "bekliyor") await kaynakBelgesiniIptal(db, kim, x.id);
  const no = await numaraAl(db, "egitim");
  const firma = await firmaBelgeKunyesi(db, depo);
  const v: EgitimFormuVerisi = {
    firma: { ad: firma.ad, kod: firma.kod, adres: firma.adres, logo: firma.logo }, no,
    katilan: { ad: p.ad, meslek: p.meslek === "diger" ? p.meslekMetin ?? "Diğer meslek" : meslek(p.meslek)?.ad ?? p.meslek },
    egitim: x.tur, kurum: x.kurum, tarih: x.tarih, tekrar: x.tekrar,
  };
  let pdf: Uint8Array;
  try { pdf = await uret(v); } catch { throw new DosyaHatasi("Formun PDF'i üretilemedi; biraz sonra yeniden deneyin."); }
  const ad = `${x.tur} katılım formu · ${no}`.slice(-120);
  const g = await belgeGonder(db, depo, kim, firmaId, { tur: "egitim", ad, personelId: x.personel_id, kaynakId: x.id, ay: null, pdf: { ad: `${no}.pdf`, bayt: pdf } });
  if (g.durum !== "tamam") throw new DosyaHatasi(g.durum === "uygunsuz" ? g.neden : "Form imzaya gönderilemedi.");
  return { durum: "tamam", id: x.id };
}

/** dosya erişimi: kaydı gören (denetçi yalnız kendi sertifikasını) açar */
export async function egitimDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, kayitId: string): Promise<boolean> {
  if (!UUID.test(kayitId)) return false;
  const k = await kendiKisi(db, kisi);
  if (k === false) return false;
  const r = (await db.sorgu<{ p: string }>("SELECT personel_id::text AS p FROM egitim_kaydi WHERE id = $1", [kayitId])).rows[0];
  return !!r && (k === null || r.p === k);
}

/* ── KESİN SİLME (371; reisim 2026-10-07 "eklenebilen şeyler silinemiyor"; §9 elli üçüncü tur) — yalnız yönetici (kayit_sil, modül 10). Eğitim türü:
   hiç kaydı yoksa; eğitim kaydı: sertifikası yüklü değilse ve katılım formu imzaya hiç gönderilmediyse (yanlış kişi / tarih). Güncel kayıt silinince
   bir öncekisi güncel olur (veritabanında, göç 0066). */
const silebilir = (kim: YetkiHesabi) => canDoEylem(kim, "kayit_sil", { modul: MODUL });
export async function egitimTuruSil(db: Sorgulayici, kim: Kisi, id: string): Promise<Yazma> {
  if (!silebilir(kim)) return { durum: "yetkisiz" };
  const r = await kesinSil(db, "egitim_turu", id, kim.ad);
  if (r.durum === "kullanildi") return { durum: "red", neden: `Eğitim türü silinemez: ${r.kullanim.egitim ?? 0} eğitim kaydında kullanıldı.` };
  return r.durum === "tamam" ? { durum: "tamam", id } : { durum: "yok" };
}
export async function egitimKaydiSil(db: Sorgulayici, kim: Kisi, id: string): Promise<Yazma> {
  if (!silebilir(kim)) return { durum: "yetkisiz" };
  const r = await kesinSil(db, "egitim_kaydi", id, kim.ad);
  if (r.durum === "kullanildi") {
    return { durum: "red", neden: r.kullanim.sertifika ? "Sertifikası yüklü eğitim kaydı silinmez; önce sertifikayı kaldırın." : "Katılım formu imzaya gönderilmiş eğitim kaydı silinmez." };
  }
  return r.durum === "tamam" ? { durum: "tamam", id } : { durum: "yok" };
}
