/* TALEPLER (330; modül 21; maket talepler.html, personel.html #/izinler; KOD-GECIS §3 "talep_turu, izin_talebi, masraf (gider'e yazar) · izin
   onayı yönetici, masraf onayı muhasebe", §4 Talepler: herkes "kendi", firma yöneticisi "değiştirir"). Personelin kendi talepleri: izin talebi
   (göç 0042) ve masraf formu (Muhasebe'nin gider kaydı — talep-baglanti.ts). Talep YALNIZ kişinin kendi adına (personeli hesabının personeli;
   istemciden personel kimliği alınmaz — veritabanı da denetler). Onay bekleyen talebi yalnız talep eden geri çeker; belgesini o değiştirir.
   İzin onayı / reddi firma yöneticisinde (Personel › İzin talepleri; Talepler "değiştirir"). Masrafın onayı Muhasebe'de. */
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaCope, dosyaYukle, kayitDosyasi } from "../../../server/dosya/dosya.ts";
import { SINIR, turBul } from "../../../server/dosya/tur.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, sil, tablo, type Iz } from "../../../server/db/yazici.ts";
import { ayarOku, firmaBelgeKunyesi } from "../../../server/ayar/ayar.ts";
import { hesabinPersoneli, hesapAdlari } from "../../../server/kimlik/hesap.ts";
import { numaraAl } from "../../../server/numara/numara.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import { masrafBelgesi, masrafFormlari, masrafFormuKaydi, masrafGeriCek, masrafGonder, type MasrafFormu } from "../../muhasebe/server/talep-baglanti.ts";
import { GIDER_DURUM, GIDER_TUR, giderKdv, para } from "../../muhasebe/sema.ts";
import { personelOzetleri } from "../../personel/server/personel.ts";
import { meslek } from "../../personel/sema.ts";
import type { TalepFormuVerisi, TalepTipi } from "../../../belge/talep.ts";
import { izinHaklari } from "../../personel/server/talep-baglanti.ts";
import { personelinPlanlari } from "../../planlar/server/talep-baglanti.ts";
import { isGunu, IzinGirdisi, RedGirdisi, IZIN_DURUM, IZIN_TUR, type IzinDurumu, type IzinTuru } from "../sema.ts";

const MODUL = 21;
export const IZIN_DOSYA = "izin";
const IZIN = tablo({ ad: "izin_talebi", sutunlar: ["no", "personel_id", "tur", "bas", "bit", "gun", "aciklama", "belge", "durum", "red"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
export const bugunTr = () => GUN.format(new Date());
const tarihYaz = (s: string) => s.split("-").reverse().join(".");

export interface Kisi extends YetkiHesabi { ad: string }
export type Yazma =
  | { durum: "tamam"; id: string; no?: string; bildirim?: string }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "red"; neden: string }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };
const girer = (kim: YetkiHesabi) => duzey(kim, MODUL) !== "yok";
/** izin talebini onaylar / reddeder (firma yöneticisi — Talepler "değiştirir") */
export const izinYonetir = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
const iz = (kim: Kisi, ne: string, gerekce?: string): Iz => ({ kim: kim.ad, ne, gerekce });

export type TalepBelgesi = { ad: string; bayt: Uint8Array } | null | "kaldir";
const BELGE_TUR = ["pdf", "jpeg", "png"] as const;
/** belge kayıttan ÖNCE denetlenir (tür baytlardan, boyut) */
function belgeHatasi(b: TalepBelgesi): string | null {
  if (!b || b === "kaldir") return null;
  const t = b.bayt.length ? turBul(b.bayt, BELGE_TUR) : null;
  return !t ? "Belge PDF, JPEG ya da PNG olmalı." : b.bayt.length > SINIR[t] ? "Belge çok büyük (PDF 25 MB, fotoğraf 8 MB)." : null;
}
/** belge okunamadı (bozuk görsel): eylem alan hatasına çevirir; işlem geri alınır */
export class TalepBelgeHatasi extends Error {}

/* ── İZİN ÖZETİ (maket MV.izinOzet): yıllık izin hakkı, bu yıl onaylanan ve bekleyen yıllık izin günleri, kalan ── */
export interface IzinOzeti { yil: string; hak: number; kullanilan: number; bekleyen: number; kalan: number }
interface IzinDb { id: string; no: string; personel_id: string; tur: IzinTuru; bas: string; bit: string; gun: number; aciklama: string | null; belge: string | null;
  durum: IzinDurumu; red: string | null; karar: Date | null; onaylayan: string | null; kaydeden: string | null; olustu: Date; surum: number }
const IZIN_SEC = `SELECT id::text, no, personel_id::text, tur, bas::text, bit::text, gun, aciklama, belge::text, durum, red, karar, onaylayan::text, kaydeden::text, olustu, surum
  FROM izin_talebi`;
function ozet(l: readonly Pick<IzinDb, "tur" | "bas" | "durum" | "gun">[], hak: number, yil: string): IzinOzeti {
  const y = l.filter((x) => x.tur === "yillik" && x.bas.slice(0, 4) === yil);
  const kullanilan = y.filter((x) => x.durum === "onaylandi").reduce((n, x) => n + x.gun, 0), bekleyen = y.filter((x) => x.durum === "bekliyor").reduce((n, x) => n + x.gun, 0);
  return { yil, hak, kullanilan, bekleyen, kalan: hak - kullanilan };
}

/* ── TALEPLERİM ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export interface IzinTalebi {
  id: string; no: string; tur: IzinTuru; bas: string; bit: string; gun: number; aciklama: string | null; belge: string | null; durum: IzinDurumu; red: string | null;
  karar: string | null; kararVeren: string | null; gonderildi: string; surum: number;
}
export interface Taleplerim {
  /** bu yılın ve gelecek yılın özeti — talep başlangıç yılına sayılır, aşım o yılın kalanıyla (329–332 incelemesi) */
  izinler: IzinTalebi[]; masraflar: MasrafFormu[]; ozet: IzinOzeti; gelecekOzet: IzinOzeti;
  /** masraf formunun iş seçenekleri: ekibinde olduğu başlamış planlar */
  isler: { id: string; no: string; tesis: string; tarih: string }[];
}
async function benimPersonelim(db: Sorgulayici, kim: Kisi): Promise<string | null> {
  return girer(kim) ? hesabinPersoneli(db, kim.id) : null;
}
/** kişinin talepleri; Talepler'e giremeyene ya da personeli olmayana null */
export async function taleplerim(db: Sorgulayici, kim: Kisi): Promise<Taleplerim | null> {
  const p = await benimPersonelim(db, kim);
  if (!p) return null;
  const l = (await db.sorgu<IzinDb>(`${IZIN_SEC} WHERE personel_id = $1 ORDER BY olustu DESC`, [p])).rows;
  const ad = await hesapAdlari(db, l.map((x) => x.onaylayan));
  const hak = (await izinHaklari(db, [p])).get(p)?.hak ?? 14;
  const tesis = new Map((await musteriOzetleri(db)).flatMap((m) => m.tesisler.map((t) => [t.id, t.ad] as const)));
  return {
    izinler: l.map((x) => izinSatiri(x, ad)), masraflar: await masrafFormlari(db, p), ozet: ozet(l, hak, bugunTr().slice(0, 4)),
    gelecekOzet: ozet(l, hak, String(Number(bugunTr().slice(0, 4)) + 1)),
    isler: (await personelinPlanlari(db, p, bugunTr())).map((x) => ({ id: x.id, no: x.no, tesis: tesis.get(x.tesisId) ?? "—", tarih: x.baslangic })),
  };
}
const izinSatiri = (x: IzinDb, ad: ReadonlyMap<string, string>): IzinTalebi => ({
  id: x.id, no: x.no, tur: x.tur, bas: x.bas, bit: x.bit, gun: x.gun, aciklama: x.aciklama, belge: x.belge, durum: x.durum, red: x.red,
  karar: x.karar?.toISOString() ?? null, kararVeren: x.onaylayan ? ad.get(x.onaylayan) ?? "—" : null, gonderildi: x.olustu.toISOString(), surum: x.surum,
});

/* ── İZİN TALEBİ ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
async function belgeYukle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, kayitId: string, b: { ad: string; bayt: Uint8Array }): Promise<string> {
  const y = await dosyaYukle(db, depo, { firmaId, modul: IZIN_DOSYA, kayitId, ad: b.ad, bayt: b.bayt, izinli: BELGE_TUR, kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) throw new TalepBelgeHatasi("Belge okunamadı ya da bozuk.");
  return y.id;
}
/** izin talebi gönder (kendi adına); yıllık izinde kalan hakkı aşmak uyarıdır, engel değil (maket) */
export async function izinGonder(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, girdi: unknown, belge: TalepBelgesi = null): Promise<Yazma> {
  const p = await benimPersonelim(db, kim);
  if (!p) return { durum: "yetkisiz" };
  const g = dogrula(IzinGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const bh = belgeHatasi(belge);
  if (bh) return { durum: "gecersiz", hatalar: { belge: bh } };
  const v = g.veri, gun = isGunu(v.bas, v.bit);
  const onek = (await ayarOku(db, "numara")).deger.izin;
  const no = await numaraAl(db, "izin", { onek, simdi: new Date(`${v.bas}T12:00:00+03:00`) });
  const r = await ekle(db, IZIN, { no, personel_id: p, tur: v.tur, bas: v.bas, bit: v.bit, gun, aciklama: v.aciklama, durum: "bekliyor" }, iz(kim, "izin.gonder", no));
  if (belge && belge !== "kaldir") {
    const d = await belgeYukle(db, depo, kim, firmaId, r.id, belge);
    const u = await guncelle(db, IZIN, r.id, r.surum, { belge: d }, iz(kim, "izin.belge", no));
    if (u.durum !== "tamam") throw new Error(`izin belgesi yazılamadı: ${u.durum}`);
  }
  return { durum: "tamam", id: r.id, no, bildirim: `${no} gönderildi: ${gun} iş günü ${IZIN_TUR[v.tur].toLocaleLowerCase("tr")}; yöneticinin onayında.` };
}
async function kendiIzni(db: Sorgulayici, kim: Kisi, id: string) {
  const p = await benimPersonelim(db, kim);
  if (!p || !UUID.test(id)) return null;
  return (await db.sorgu<IzinDb>(`${IZIN_SEC} WHERE id = $1 AND personel_id = $2 FOR UPDATE`, [id, p])).rows[0] ?? null;
}
/** onay bekleyen izin talebini geri çek (silinir; belgesi çöpe) */
export async function izinGeriCek(db: Sorgulayici, kim: Kisi, id: string): Promise<Yazma> {
  const x = await kendiIzni(db, kim, id);
  if (!x) return { durum: "yok" };
  if (x.durum !== "bekliyor") return { durum: "red", neden: "Karar verilmiş talep geri çekilmez." };
  if (x.kaydeden !== kim.id) return { durum: "yetkisiz" };
  if (!(await sil(db, IZIN, id, iz(kim, "izin.geri", x.no)))) return { durum: "yok" };
  if (x.belge) await dosyaCope(db, x.belge, { kim: kim.ad, ne: "dosya.cop", gerekce: x.no });
  return { durum: "tamam", id, no: x.no, bildirim: `${x.no} geri çekildi.` };
}
/** onay bekleyen izin talebinin belgesini ekle / değiştir / kaldır */
export async function izinBelgesi(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, surum: number, belge: TalepBelgesi): Promise<Yazma> {
  const x = await kendiIzni(db, kim, id);
  if (!x) return { durum: "yok" };
  if (x.durum !== "bekliyor") return { durum: "red", neden: "Karar verilmiş talebin belgesi değişmez." };
  if (x.kaydeden !== kim.id) return { durum: "yetkisiz" };
  if (!belge) return { durum: "gecersiz", hatalar: { belge: "Belge seçilmeli." } };
  const bh = belgeHatasi(belge);
  if (bh) return { durum: "gecersiz", hatalar: { belge: bh } };
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const d = belge === "kaldir" ? null : await belgeYukle(db, depo, kim, firmaId, id, belge);
  const u = await guncelle(db, IZIN, id, surum, { belge: d }, iz(kim, "izin.belge", x.no));
  if (u.durum !== "tamam") return { durum: u.durum === "yok" ? "yok" : "cakisma" };
  if (x.belge) await dosyaCope(db, x.belge, { kim: kim.ad, ne: "dosya.cop", gerekce: x.no });
  return { durum: "tamam", id, no: x.no, bildirim: belge === "kaldir" ? "Belge kaldırıldı." : "Belge kaydedildi." };
}

/* ── MASRAF FORMU (Muhasebe'nin gider kaydına) ── */
export async function masrafFormuGonder(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, girdi: unknown, belge: TalepBelgesi = null): Promise<Yazma> {
  const p = await benimPersonelim(db, kim);
  if (!p) return { durum: "yetkisiz" };
  const isler = new Set((await personelinPlanlari(db, p, bugunTr(), 50)).map((x) => x.id));
  return masrafGonder(db, depo, kim, firmaId, p, isler, girdi, belge);
}
export async function masrafFormuGeriCek(db: Sorgulayici, kim: Kisi, id: string): Promise<Yazma> {
  const p = await benimPersonelim(db, kim);
  return p ? masrafGeriCek(db, kim, p, id) : { durum: "yetkisiz" };
}
export async function masrafFormuBelgesi(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, surum: number, belge: TalepBelgesi): Promise<Yazma> {
  const p = await benimPersonelim(db, kim);
  if (!p) return { durum: "yetkisiz" };
  if (!belge) return { durum: "gecersiz", hatalar: { belge: "Belge seçilmeli." } };
  return masrafBelgesi(db, depo, kim, firmaId, p, id, surum, belge);
}

/* ── YÖNETİCİ: Personel › İzin talepleri (maket personel.html #/izinler) ──────────────────────────────────────────────────────────── */
export interface IzinSatiri extends IzinTalebi { personelId: string; personel: string; ozet: IzinOzeti }
/** bütün izin talepleri, bekleyen üstte; yalnız firma yöneticisine (Talepler "değiştirir") */
export async function izinTalepleri(db: Sorgulayici, kim: Kisi): Promise<IzinSatiri[] | null> {
  if (!izinYonetir(kim)) return null;
  const l = (await db.sorgu<IzinDb>(`${IZIN_SEC} ORDER BY (durum = 'bekliyor') DESC, olustu DESC`)).rows;
  const ad = await hesapAdlari(db, l.map((x) => x.onaylayan));
  const kisi = await izinHaklari(db, l.map((x) => x.personel_id));
  /* özet talebin başlangıç yılının (gelecek yıl başlayan izin bu yılın kalanıyla karşılaştırılmaz — 329–332 incelemesi) */
  return l.map((x) => ({ ...izinSatiri(x, ad), personelId: x.personel_id, personel: kisi.get(x.personel_id)?.ad ?? "—",
    ozet: ozet(l.filter((y) => y.personel_id === x.personel_id), kisi.get(x.personel_id)?.hak ?? 14, x.bas.slice(0, 4)) }));
}
async function karar(db: Sorgulayici, kim: Kisi, id: string, surum: number, durum: "onaylandi" | "red", red: string | null): Promise<Yazma> {
  if (!izinYonetir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  const x = (await db.sorgu<IzinDb>(`${IZIN_SEC} WHERE id = $1 FOR UPDATE`, [id])).rows[0];
  if (!x) return { durum: "yok" };
  if (x.durum !== "bekliyor") return { durum: "red", neden: "Bu talep için karar verilmiş." };
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const u = await guncelle(db, IZIN, id, surum, { durum, red }, iz(kim, durum === "red" ? "izin.red" : "izin.onay", x.no));
  if (u.durum !== "tamam") return { durum: u.durum === "yok" ? "yok" : "cakisma" };
  const k = (await izinHaklari(db, [x.personel_id])).get(x.personel_id)?.ad ?? "—";
  return { durum: "tamam", id, no: x.no, bildirim: durum === "onaylandi"
    ? `${x.no} onaylandı: ${k}, ${x.gun} iş günü ${IZIN_TUR[x.tur].toLocaleLowerCase("tr")} (${tarihYaz(x.bas)}${x.bit !== x.bas ? ` – ${tarihYaz(x.bit)}` : ""}).`
    : `${x.no} reddedildi.` };
}
export const izinOnayla = (db: Sorgulayici, kim: Kisi, id: string, surum: number) => karar(db, kim, id, surum, "onaylandi", null);
export async function izinReddet(db: Sorgulayici, kim: Kisi, id: string, surum: number, girdi: unknown): Promise<Yazma> {
  if (!izinYonetir(kim)) return { durum: "yetkisiz" };
  const g = dogrula(RedGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  return karar(db, kim, id, surum, "red", g.veri.gerekce);
}

/** izin talebinin belgesi: talep eden ya da firma yöneticisi açar (09-A2 erişim kaydı) */
export async function izinDosyasiGorulur(db: Sorgulayici, kim: YetkiHesabi, kayitId: string): Promise<boolean> {
  if (!UUID.test(kayitId)) return false;
  const x = (await db.sorgu<{ kaydeden: string | null }>("SELECT kaydeden::text FROM izin_talebi WHERE id = $1", [kayitId])).rows[0];
  return !!x && (izinYonetir(kim) || (girer(kim) && x.kaydeden === kim.id));
}

/* ── TALEP FORMU (PDF; 341 — maket MB.talepPdfAc, 35. tur 162: "talep eden (Talepler), firma yöneticisi (Personel › İzin talepleri) ve muhasebe
   (Muhasebe › Giderler) aynı formu açar") ── */
const tarihNo = (s: string | null) => (s ? s.split("-").reverse().join(".") : "-");
/** talebin formu (izin ya da masraf) — talep eden; izinde firma yöneticisi (Talepler "değiştirir"); masrafta Muhasebe'yi gören. Başkasına null */
export async function talepFormuVerisi(db: Sorgulayici, kim: Kisi, tip: string, id: string, depo: Depo | null = null): Promise<TalepFormuVerisi | null> {
  if ((tip !== "izin" && tip !== "masraf") || !UUID.test(id)) return null;
  const ben = girer(kim) ? await hesabinPersoneli(db, kim.id) : null;
  let personelId: string, no: string, gonderildi: string, durum: string, red: string | null, alanlar: [string, string][];
  let karar: { hesap: string | null; zaman: string | null; sonuc: "onaylandi" | "reddedildi" } | null = null;
  if (tip === "izin") {
    const x = (await db.sorgu<IzinDb>(`${IZIN_SEC} WHERE id = $1`, [id])).rows[0];
    if (!x || !(x.personel_id === ben || izinYonetir(kim))) return null;
    const belge = x.belge ? await kayitDosyasi(db, IZIN_DOSYA, x.id, x.belge) : null;
    personelId = x.personel_id; no = x.no; gonderildi = x.olustu.toISOString(); durum = IZIN_DURUM[x.durum][0]; red = x.red;
    alanlar = [["İzin türü", IZIN_TUR[x.tur]], ["Başlangıç", tarihNo(x.bas)], ["Bitiş", tarihNo(x.bit)], ["Süre", `${x.gun} iş günü`], ["Açıklama", x.aciklama ?? ""],
      ["Ek belge", belge?.ad ?? "-"]];
    if (x.durum !== "bekliyor") karar = { hesap: x.onaylayan, zaman: x.karar?.toISOString() ?? null, sonuc: x.durum === "red" ? "reddedildi" : "onaylandi" };
  } else {
    const g = await masrafFormuKaydi(db, id);
    const muhasebe = ["gor", "yaz"].includes(duzey(kim, 18));
    if (!g || !(g.personelId === ben || muhasebe)) return null;
    const belge = g.belge ? await kayitDosyasi(db, "gider", g.id, g.belge) : null, k = giderKdv(g.tutar, g.oran);
    personelId = g.personelId; no = g.no; gonderildi = g.gonderildi; durum = GIDER_DURUM[g.durum][0]; red = g.red;
    alanlar = [["İş", g.isNo ?? "Genel (işe bağlı değil)"], ["Masraf tarihi", tarihNo(g.tarih)], ["Tür", GIDER_TUR[g.tur]?.[0] ?? g.tur],
      ["Tutar (KDV dahil)", para(g.tutar)], ["KDV", `%${g.oran} · ${para(k.kdv)} (KDV hariç ${para(k.haric)})`], ["Açıklama", g.aciklama ?? ""], ["Fiş", belge?.ad ?? "-"],
      ...(g.odeme ? [["Ödendi", tarihNo(g.odeme)] as [string, string]] : [])];
    if (g.durum !== "bekliyor") karar = { hesap: g.onaylayan, zaman: g.karar, sonuc: g.durum === "red" ? "reddedildi" : "onaylandi" };
  }
  const [p] = await personelOzetleri(db, [personelId]);
  const ad = karar?.hesap ? (await hesapAdlari(db, [karar.hesap])).get(karar.hesap) ?? "—" : null;
  const firma = await firmaBelgeKunyesi(db, depo);
  return {
    firma: { ad: firma.ad, kod: firma.kod, adres: firma.adres, logo: firma.logo }, tip: tip as TalepTipi, no, gonderildi,
    personel: { ad: p?.ad ?? "—", meslek: p ? (p.meslek === "diger" ? p.meslekMetin ?? "Diğer meslek" : meslek(p.meslek)?.ad ?? p.meslek) : "—" },
    durum, alanlar, red,
    karar: karar && karar.zaman ? { ad: ad ?? "—", zaman: karar.zaman, sonuc: karar.sonuc } : null,
  };
}

