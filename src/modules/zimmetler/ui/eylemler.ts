"use server";
/* ZİMMETLER SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama, "kimde" ve fotoğraf denetimi modül işlevinde (zimmet.ts).
   Teslim eden istemciden alınmaz (sunucu o anki "kimde"yi yazar). */
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { demirbasEkle, FotoHatasi, teslimEt, type Yazma } from "../server/zimmet";

export interface PencereDurumu { tamam?: boolean; id?: string; hatalar?: Record<string, string>; genel?: string }

const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Kayıt bulunamadı." } as const;
async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}
const cevir = (r: Yazma): PencereDurumu =>
  r.durum === "tamam" ? { tamam: true, id: r.id } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : { genel: SONUC[r.durum] };

export async function teslimEtEylemi(form: FormData): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const fotolar: { ad: string; bayt: Uint8Array }[] = [];
  for (const f of form.getAll("foto")) {
    if (!(f instanceof File) || f.size === 0) continue;
    if (f.size > 8 << 20) return { hatalar: { foto: "Fotoğraf en çok 8 MB." } };
    fotolar.push({ ad: f.name, bayt: new Uint8Array(await f.arrayBuffer()) });
  }
  const girdi = { varlik: String(form.get("varlik") ?? ""), alan: String(form.get("alan") ?? ""), zaman: String(form.get("zaman") ?? ""), notu: String(form.get("notu") ?? "") };
  try {
    return cevir(await oturumIslemi(o, (db) => teslimEt(db, depo(), o, o.kiraci.firmaId, girdi, fotolar)));
  } catch (h) {
    if (h instanceof FotoHatasi) return { hatalar: { foto: h.message } };
    throw h;
  }
}

export async function demirbasEkleEylemi(girdi: unknown): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const g = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  return cevir(await oturumIslemi(o, (db) => demirbasEkle(db, o, { kod: String(g.kod ?? ""), ad: String(g.ad ?? "") })));
}
