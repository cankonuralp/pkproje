"use server";
/* ARAÇLAR SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama, kilometre ve fotoğraf denetimi modül işlevinde (araclar.ts).
   Teslim eden istemciden alınmaz (Zimmetler o anki "kimde"yi yazar). */
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { aracKaydet, FotoHatasi, kmKaydet, tutanakKaydet } from "../server/araclar";

export interface PencereDurumu { tamam?: boolean; id?: string; hatalar?: Record<string, string>; genel?: string; ileti?: string }

const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Kayıt bulunamadı.", cakisma: "Kayıt bu arada değişti. Sayfayı yenileyip yeniden deneyin." } as const;
async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}
type Sonuc = { durum: "tamam"; id: string } | { durum: "gecersiz"; hatalar: Record<string, string> } | { durum: keyof typeof SONUC };
const cevir = (r: Sonuc, ileti?: string): PencereDurumu =>
  r.durum === "tamam" ? { tamam: true, id: r.id, ileti } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : { genel: SONUC[r.durum] };
const nesne = (g: unknown) => (g && typeof g === "object" ? g : {}) as Record<string, unknown>;
const yazi = (x: unknown) => (typeof x === "string" ? x : "");

export async function aracKaydetEylemi(id: string | null, surum: number, girdi: unknown): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const g = nesne(girdi);
  const temiz = Object.fromEntries(["plaka", "tur", "marka", "model", "yil", "yakit", "ilkKm", "bakimKm", "muayene", "sigorta", "kasko"].map((k) => [k, yazi(g[k])]));
  return cevir(await oturumIslemi(o, (db) => aracKaydet(db, o, typeof id === "string" ? id : null, Number(surum), temiz)));
}

export async function kmKaydetEylemi(aracId: string, km: string): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => kmKaydet(db, o, yazi(aracId), { km: yazi(km) }));
  return cevir(r, r.durum === "tamam" ? [r.duzeltildi ? "düzeltildi" : "kaydedildi", r.uyari].filter(Boolean).join(". ") : undefined);
}

export async function tutanakKaydetEylemi(form: FormData): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const fotolar: { aci: string; ad: string; bayt: Uint8Array }[] = [];
  for (const [ad, f] of form.entries()) {
    if (!ad.startsWith("foto-") || !(f instanceof File) || f.size === 0) continue;
    if (f.size > 8 << 20) return { hatalar: { [ad]: "Fotoğraf en çok 8 MB." } };
    fotolar.push({ aci: ad.slice(5), ad: f.name, bayt: new Uint8Array(await f.arrayBuffer()) });
  }
  const girdi = {
    arac: yazi(form.get("arac")), alan: yazi(form.get("alan")), zaman: yazi(form.get("zaman")), km: yazi(form.get("km")), yakit: yazi(form.get("yakit")),
    kontrol: form.getAll("kontrol").map(yazi), hasar: yazi(form.get("hasar")),
  };
  try {
    const r = await oturumIslemi(o, (db) => tutanakKaydet(db, depo(), o, o.kiraci.firmaId, girdi, fotolar));
    return cevir(r, r.durum === "tamam" ? r.no : undefined);
  } catch (h) {
    if (h instanceof FotoHatasi) return { hatalar: { [`foto-${h.aci}`]: h.message } };
    throw h;
  }
}
