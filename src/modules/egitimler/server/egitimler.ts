/* EĞİTİMLER — modülün dışa açılan işlevleri (maket egitimler.html; modül 10, Dökümanlar'ın sekmesi). Sayfalar ve eylemler yalnız buradan.
   Yetki her işlevde, sunucuda (canDo, modül 10): "gör" ve üstü bütün kayıtları görür; "kendi" düzeyi (denetçi) yalnız kendi kayıtlarını;
   kayıt eklemek, tekrar kaydetmek, sertifika yüklemek ve eğitim türü eklemek / düzenlemek yalnız "yaz" düzeyinde. Tarih ileri olamaz (ENGEL);
   tekrar tarihi kayıt anında türün süresinden yazılır. Aynı kişi × eğitimde güncel kayıt tektir; tekrarı kaydedilince eskisi "önceki" olur.
   Sertifika tek dosya yolundan (yalnız PDF), isteğe bağlı. Silme yok. Personel bilgisi Personel modülünün dışa açtığı işlevden. */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { personelSecenekleri } from "../../personel/server/personel.ts";
import { ayEkle, EgitimKaydiGirdisi, egitimDurumu, EgitimTuruGirdisi, type EgitimDurumu } from "../sema.ts";

const MODUL = 10;
export const DOSYA_MODULU = "egitim";
const TUR = tablo({ ad: "egitim_turu", sutunlar: ["ad", "tekrar_ay"] });
const KAYIT = tablo({ ad: "egitim_kaydi", sutunlar: ["personel_id", "tur_id", "tarih", "tekrar", "kurum", "dosya_id", "onceki"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface Kisi extends YetkiHesabi { ad: string }
export interface EgitimTuru { id: string; ad: string; tekrarAy: number; surum: number; kisi: number; gecti: number; yakin: number }
export interface EgitimKaydi {
  id: string; personelId: string; personel: string; turId: string; tur: string; tarih: string; tekrar: string; kurum: string; dosyaId: string | null; onceki: boolean;
  durum: EgitimDurumu; surum: number;
}

export type Yazma =
  | { durum: "tamam"; id: string }
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
  return l.filter((x) => ben === null || x.personel_id === ben).map((x) => ({
    id: x.id, personelId: x.personel_id, personel: kisiler.find((k) => k.id === x.personel_id)?.ad ?? "Ayrılan personel", turId: x.tur_id,
    tur: turler.find((t) => t.id === x.tur_id)?.ad ?? "—", tarih: x.tarih, tekrar: x.tekrar, kurum: x.kurum, dosyaId: x.dosya_id, onceki: x.onceki,
    durum: egitimDurumu(x.tekrar, bugun, esik), surum: x.surum,
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

/** dosya erişimi: kaydı gören (denetçi yalnız kendi sertifikasını) açar */
export async function egitimDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, kayitId: string): Promise<boolean> {
  if (!UUID.test(kayitId)) return false;
  const k = await kendiKisi(db, kisi);
  if (k === false) return false;
  const r = (await db.sorgu<{ p: string }>("SELECT personel_id::text AS p FROM egitim_kaydi WHERE id = $1", [kayitId])).rows[0];
  return !!r && (k === null || r.p === k);
}
