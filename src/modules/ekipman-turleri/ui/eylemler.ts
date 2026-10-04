"use server";
/* EKİPMAN TÜRLERİ SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama ve dosya denetimi modül işlevinde (turler.ts). İstemciden gelen
   kimlik / sürüm yalnız "hangi kayıt, hangi sürümü gördüm" bilgisidir; dosyanın türü adından değil baytlarından anlaşılır. */
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { formatKaldir, formatYukle, turKaydet } from "../server/turler";

export interface PencereDurumu { tamam?: boolean; id?: string; sira?: number; hatalar?: Record<string, string>; genel?: string }

const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Bu kayıt siz açtıktan sonra başkası tarafından değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Kayıt bulunamadı.",
} as const;
const ALANLAR = ["ad", "kod", "grup", "brans", "periyot", "sure"] as const;

/** oturumdaki kişi ya da kullanıcıya söylenecek ileti */
async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}

export async function turKaydetEylemi(turId: string | null, surum: number, girdi: unknown): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const g = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  const temiz = Object.fromEntries(ALANLAR.map((k) => [k, typeof g[k] === "string" ? g[k] : ""]));
  const r = await oturumIslemi(o, (db) => turKaydet(db, o, typeof turId === "string" && turId ? turId : null, Number(surum), temiz));
  if (r.durum === "tamam") return { tamam: true, id: r.id };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}

export async function formatYukleEylemi(form: FormData): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const dosya = form.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { hatalar: { dosya: "PDF seçilmeli." } };
  if (dosya.size > 25 << 20) return { hatalar: { dosya: "PDF en çok 25 MB." } };
  const bayt = new Uint8Array(await dosya.arrayBuffer());
  const r = await oturumIslemi(o, (db) => formatYukle(db, depo(), o, o.kiraci.firmaId, String(form.get("tur") ?? ""), { ad: dosya.name, bayt }, String(form.get("not") ?? "")));
  if (r.durum === "tamam") return { tamam: true, sira: r.sira };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}

export async function formatKaldirEylemi(formatId: string, surum: number): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => formatKaldir(db, o, String(formatId), Number(surum)));
  if (r.durum === "tamam") return { tamam: true };
  if (r.durum === "gecersiz") return { genel: "Kaldırılamadı." };
  return { genel: SONUC[r.durum] };
}
