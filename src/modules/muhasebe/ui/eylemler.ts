"use server";
/* MUHASEBE SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama ve kurallar modül işlevinde (muhasebe.ts, giderler.ts) ve veritabanında
   (0039, 0040). İstemciden gelen kimlik yalnız "hangi iş / fatura / gider" bilgisidir; yetki vermez. */
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { BelgeHatasi, giderExceliYukle, giderKaydet, giderOdendi, type GiderBelgesi, type GiderSonra } from "../server/giderler";
import { faturaKaydet, tahsilatKaydet, type Yazma } from "../server/muhasebe";
import { bordroGonder, bordroGonderimi, type BordroGonderimi } from "../server/bordro-gonder";

export interface MuhasebeYaniti { tamam?: boolean; id?: string; no?: string; bildirim?: string; hatalar?: Record<string, string>; genel?: string }

const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Kayıt bulunamadı.", cakisma: "Kayıt bu arada değişti. Sayfayı yenileyip yeniden deneyin." } as const;
const cevir = (r: Yazma): MuhasebeYaniti =>
  r.durum === "tamam" ? { tamam: true, id: r.id, no: r.no, bildirim: r.bildirim } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "red" ? { genel: r.neden }
    : { genel: SONUC[r.durum] };
async function islem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<Yazma>): Promise<MuhasebeYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  return cevir(await is(o));
}
const yazi = (v: unknown) => (typeof v === "string" ? v : "");

export async function faturaKaydetEylemi(planId: string, girdi: unknown): Promise<MuhasebeYaniti> {
  return islem((o) => oturumIslemi(o, (db) => faturaKaydet(db, o, yazi(planId), girdi)));
}
export async function tahsilatKaydetEylemi(faturaId: string, girdi: unknown): Promise<MuhasebeYaniti> {
  return islem((o) => oturumIslemi(o, (db) => tahsilatKaydet(db, o, yazi(faturaId), girdi)));
}

/* ── GİDERLER (328) ── */
const SONRA: readonly GiderSonra[] = ["odendi"];
async function belgeOku(form: FormData): Promise<GiderBelgesi | "buyuk"> {
  if (form.get("belgeKaldir") === "1") return "kaldir";
  const f = form.get("belge");
  if (!(f instanceof File) || f.size === 0) return null;
  if (f.size > 25 << 20) return "buyuk";
  return { ad: f.name, bayt: new Uint8Array(await f.arrayBuffer()) };
}
/** gider ekle / düzenle (+ aynı işlemde onayla ya da ödendi); belge isteğe bağlı */
export async function giderKaydetEylemi(form: FormData): Promise<MuhasebeYaniti> {
  const belge = await belgeOku(form);
  if (belge === "buyuk") return { hatalar: { belge: "Belge çok büyük (PDF 25 MB, fotoğraf 8 MB)." } };
  const id = yazi(form.get("id")) || null, sonra = yazi(form.get("sonra")) as GiderSonra;
  const girdi = { tarih: yazi(form.get("tarih")), tur: yazi(form.get("tur")), tutar: yazi(form.get("tutar")), oran: yazi(form.get("oran")), aciklama: yazi(form.get("aciklama")),
    is: yazi(form.get("is")), personel: yazi(form.get("personel")), odeme: yazi(form.get("odeme")) || undefined };
  try {
    return await islem((o) => oturumIslemi(o, (db) => giderKaydet(db, depo(), o, o.kiraci.firmaId, id, Number(form.get("surum") ?? 0), girdi, belge,
      SONRA.includes(sonra) ? sonra : null)));
  } catch (h) {
    if (h instanceof BelgeHatasi) return { hatalar: { belge: h.message } };
    throw h;
  }
}
/** 477 (T5): onaylanmış (ödenecek) gideri ödendi işaretle — içerik değişmez (masraf formu da) */
export async function giderOdendiEylemi(id: string, surum: number): Promise<MuhasebeYaniti> {
  return islem((o) => oturumIslemi(o, (db) => giderOdendi(db, o, yazi(id), Number(surum))));
}
/** Excel'den yükle: tarayıcıda okunan satırlar; sunucuda yeniden denetlenir */
export async function giderExceliYukleEylemi(ham: unknown): Promise<MuhasebeYaniti> {
  return islem((o) => oturumIslemi(o, (db) => giderExceliYukle(db, o, ham)));
}

/* ── MAAŞ BORDROSU GÖNDER (333): pencere verisi ve gönderim; yetki (Muhasebe "yaz") ve PDF denetimi sunucuda ── */
export async function bordroGonderimiEylemi(ay: string): Promise<{ veri?: BordroGonderimi; genel?: string }> {
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const veri = await oturumIslemi(o, (db) => bordroGonderimi(db, o, yazi(ay)));
  return veri ? { veri } : { genel: SONUC.yetkisiz };
}
/** form: ay, secili (kişi kimlikleri, çok), dosya-<kişi> (PDF) */
export async function bordroGonderEylemi(form: FormData): Promise<MuhasebeYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const secili = form.getAll("secili").map(yazi).slice(0, 1000);
  const dosyalar = new Map<string, { ad: string; bayt: Uint8Array }>();
  let toplam = 0;
  for (const id of secili) {
    const f = form.get(`dosya-${id}`);
    if (!(f instanceof File) || f.size === 0) continue;
    if (f.size > 25 << 20) return { hatalar: { [id]: "PDF en çok 25 MB." } };
    if ((toplam += f.size) > 25 << 20) return { genel: "Bir seferde en çok 25 MB gönderilir; daha az kişi seçin." };
    dosyalar.set(id, { ad: f.name, bayt: new Uint8Array(await f.arrayBuffer()) });
  }
  const r = await oturumIslemi(o, (db) => bordroGonder(db, depo(), o, o.kiraci.firmaId, yazi(form.get("ay")), secili, dosyalar));
  return r.durum === "tamam" ? { tamam: true, bildirim: r.bildirim } : r.durum === "gecersiz" ? { hatalar: r.hatalar, genel: r.genel } : { genel: SONUC.yetkisiz };
}
