"use server";
/* PLANLAR SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama ve uyarılar modül işlevinde (planlar.ts). İstemciden gelen kimlikler yalnız
   "hangi tesis, hangi denetçi" bilgisidir; tesisin, denetçinin ve İSG-KATİP kaydının bu firmada olduğu sunucuda denetlenir. */
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import {
  ekipmanPasif, ekipmanSil, kayitliEkle, kodDurumu, kontrolListesi, kunyeDuzenle, kunyeGuncelle, notEkle, planKabul, planReddet, planSil, planTamamla, tamamlamaGeriAl, yeniEkipman,
  type KodDurumu, type PlanYazma,
} from "../server/plan-ici";
import { cevrimdisiPaketi, type CevrimdisiPaketi } from "../server/cevrimdisi";
import { bugunTr, planAc, tesisPlanBilgisi, type TesisPlanBilgisi } from "../server/planlar";

export interface PlanAcYaniti { tamam?: boolean; id?: string; no?: string; hatalar?: Record<string, string>; genel?: string }

async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}

/** çevrimdışı paket (396): kişinin önümüzdeki 7 gündeki planları ve Yeni raporları — cihaz bu sayfaları önceden açar */
export async function cevrimdisiPaketiEylemi(): Promise<CevrimdisiPaketi | null> {
  const o = await oturum(); if (typeof o === "string") return null;
  return oturumIslemi(o, (db) => cevrimdisiPaketi(db, o, bugunTr()));
}

export async function tesisPlanBilgisiEylemi(tesisId: string): Promise<TesisPlanBilgisi | null> {
  const o = await oturum(); if (typeof o === "string") return null;
  return oturumIslemi(o, (db) => tesisPlanBilgisi(db, o, typeof tesisId === "string" ? tesisId : ""));
}

export async function planAcEylemi(girdi: unknown): Promise<PlanAcYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => planAc(db, depo(), o, o.kiraci.firmaId, girdi));
  if (r.durum === "tamam") return { tamam: true, id: r.id, no: r.no };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: "Plan açma yetkiniz yok." };
}

/* ── PLAN İÇİ (310) — yetki ve geçiş kuralları plan-ici.ts'te; burada yalnız oturum ve yanıtın biçimi ── */
export interface PlanYaniti { tamam?: boolean; id?: string; bildirim?: string; hatalar?: Record<string, string>; genel?: string }
const PLAN_SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Plan siz açtıktan sonra başkası tarafından değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Plan bulunamadı.",
} as const;
const yanit = (r: PlanYazma): PlanYaniti =>
  r.durum === "tamam" ? { tamam: true, id: r.id, bildirim: r.bildirim } : r.durum === "gecersiz" ? { hatalar: r.hatalar }
    : r.durum === "red" ? { genel: r.neden } : { genel: PLAN_SONUC[r.durum] };
async function planIslemi(is: (o: Exclude<Awaited<ReturnType<typeof oturum>>, string>) => Promise<PlanYazma>): Promise<PlanYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  return yanit(await is(o));
}
const metin = (v: unknown) => (typeof v === "string" ? v : "");

export async function planKabulEylemi(id: string, surum: number, beyanOnay: boolean, beyanOzet: string): Promise<PlanYaniti> {
  return planIslemi((o) => oturumIslemi(o, (db) => planKabul(db, o, metin(id), Number(surum), beyanOnay === true, metin(beyanOzet))));
}
export async function planReddetEylemi(id: string, surum: number, gerekce: string): Promise<PlanYaniti> {
  return planIslemi((o) => oturumIslemi(o, (db) => planReddet(db, o, metin(id), Number(surum), { gerekce: metin(gerekce) })));
}
export async function kontrolListesiEylemi(id: string, surum: number, tamam: boolean): Promise<PlanYaniti> {
  return planIslemi((o) => oturumIslemi(o, (db) => kontrolListesi(db, o, metin(id), Number(surum), tamam === true)));
}
export async function planTamamlaEylemi(id: string, surum: number): Promise<PlanYaniti> {
  return planIslemi((o) => oturumIslemi(o, (db) => planTamamla(db, o, metin(id), Number(surum))));
}
export async function tamamlamaGeriAlEylemi(id: string, surum: number): Promise<PlanYaniti> {
  return planIslemi((o) => oturumIslemi(o, (db) => tamamlamaGeriAl(db, o, metin(id), Number(surum))));
}
export async function kunyeDuzenleEylemi(id: string, surum: number, girdi: unknown): Promise<PlanYaniti> {
  return planIslemi((o) => oturumIslemi(o, (db) => kunyeDuzenle(db, o, metin(id), Number(surum), girdi)));
}
export async function kunyeGuncelleEylemi(id: string): Promise<PlanYaniti> {
  return planIslemi((o) => oturumIslemi(o, (db) => kunyeGuncelle(db, o, metin(id))));
}
export async function notEkleEylemi(id: string, notMetni: string): Promise<PlanYaniti> {
  return planIslemi((o) => oturumIslemi(o, (db) => notEkle(db, o, metin(id), { metin: metin(notMetni) })));
}
export async function kodDurumuEylemi(id: string, kod: string): Promise<KodDurumu | null> {
  const o = await oturum(); if (typeof o === "string") return null;
  return oturumIslemi(o, (db) => kodDurumu(db, o, metin(id), metin(kod)));
}
export async function yeniEkipmanEylemi(id: string, girdi: unknown): Promise<PlanYaniti> {
  return planIslemi((o) => oturumIslemi(o, (db) => yeniEkipman(db, o, metin(id), girdi)));
}
export async function kayitliEkleEylemi(id: string, idler: string[]): Promise<PlanYaniti> {
  return planIslemi((o) => oturumIslemi(o, (db) => kayitliEkle(db, o, metin(id), idler)));
}
export async function ekipmanPasifEylemi(id: string, ekipmanId: string, surum: number, pasif: boolean): Promise<PlanYaniti> {
  return planIslemi((o) => oturumIslemi(o, (db) => ekipmanPasif(db, o, metin(id), metin(ekipmanId), Number(surum), pasif === true)));
}
/** kesin sil (360): yalnız yönetici, yalnız hiç kullanılmamış ekipman — karar plan-ici.ts / veritabanında */
export async function ekipmanSilEylemi(id: string, ekipmanId: string): Promise<PlanYaniti> {
  return planIslemi((o) => oturumIslemi(o, (db) => ekipmanSil(db, o, metin(id), metin(ekipmanId))));
}

/** 372: raporsuz, tamamlanmamış plan kesin silinir (yalnız yönetici; karar plan-ici.ts / veritabanında) */
export async function planSilEylemi(id: string): Promise<PlanYaniti> {
  return planIslemi((o) => oturumIslemi(o, (db) => planSil(db, o, metin(id))));
}
