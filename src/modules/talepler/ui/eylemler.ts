"use server";
/* TALEPLER SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; talep kimin adına olduğu istemciden ALINMAZ (oturumun personeli). Yetki, doğrulama ve
   kurallar modül işlevinde (talepler.ts, muhasebe talep-baglanti.ts) ve veritabanında (0040, 0042, 0079). 477: karar Onaylar'da
   (onaylar/ui/eylemler.ts talepKararEylemi); burada talep edenin düzelt ve yeniden gönder eylemleri. */
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { BelgeHatasi } from "../../muhasebe/server/giderler";
import {
  izinBelgesi, izinDuzelt, izinGeriCek, izinGonder, masrafFormuBelgesi, masrafFormuDuzelt, masrafFormuGeriCek, masrafFormuGonder, TalepBelgeHatasi,
  talepDoldur, talepDoldurmaVerisi, type TalepBelgesi, type TalepDoldurmaVerisi, type Yazma,
} from "../server/talepler";

export interface TalepYaniti { tamam?: boolean; id?: string; no?: string; bildirim?: string; hatalar?: Record<string, string>; genel?: string }
const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Kayıt bulunamadı.", cakisma: "Kayıt bu arada değişti. Sayfayı yenileyip yeniden deneyin." } as const;
const cevir = (r: Yazma): TalepYaniti =>
  r.durum === "tamam" ? { tamam: true, id: r.id, no: r.no, bildirim: r.bildirim } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "red" ? { genel: r.neden }
    : { genel: SONUC[r.durum] };
async function islem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<Yazma>): Promise<TalepYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  try {
    return cevir(await is(o));
  } catch (h) {
    if (h instanceof TalepBelgeHatasi || h instanceof BelgeHatasi) return { hatalar: { belge: h.message } };
    throw h;
  }
}
const yazi = (v: unknown) => (typeof v === "string" ? v : "");
async function belgeOku(form: FormData): Promise<TalepBelgesi | "buyuk"> {
  if (form.get("belgeKaldir") === "1") return "kaldir";
  const f = form.get("belge");
  if (!(f instanceof File) || f.size === 0) return null;
  if (f.size > 25 << 20) return "buyuk";
  return { ad: f.name, bayt: new Uint8Array(await f.arrayBuffer()) };
}
const BUYUK = { hatalar: { belge: "Belge çok büyük (PDF 25 MB, fotoğraf 8 MB)." } };

export async function izinGonderEylemi(form: FormData): Promise<TalepYaniti> {
  const b = await belgeOku(form);
  if (b === "buyuk") return BUYUK;
  const girdi = { tur: yazi(form.get("tur")), bas: yazi(form.get("bas")), bit: yazi(form.get("bit")), aciklama: yazi(form.get("aciklama")) };
  return islem((o) => oturumIslemi(o, (db) => izinGonder(db, depo(), o, o.kiraci.firmaId, girdi, b)));
}
export async function izinGeriCekEylemi(id: string): Promise<TalepYaniti> {
  return islem((o) => oturumIslemi(o, (db) => izinGeriCek(db, o, yazi(id))));
}
export async function izinBelgesiEylemi(form: FormData): Promise<TalepYaniti> {
  const b = await belgeOku(form);
  if (b === "buyuk") return BUYUK;
  return islem((o) => oturumIslemi(o, (db) => izinBelgesi(db, depo(), o, o.kiraci.firmaId, yazi(form.get("id")), Number(form.get("surum")), b)));
}
export async function masrafGonderEylemi(form: FormData): Promise<TalepYaniti> {
  const b = await belgeOku(form);
  if (b === "buyuk") return BUYUK;
  const girdi = { is: yazi(form.get("is")), tarih: yazi(form.get("tarih")), tur: yazi(form.get("tur")), tutar: yazi(form.get("tutar")), oran: yazi(form.get("oran")),
    aciklama: yazi(form.get("aciklama")) };
  return islem((o) => oturumIslemi(o, (db) => masrafFormuGonder(db, depo(), o, o.kiraci.firmaId, girdi, b)));
}
export async function masrafGeriCekEylemi(id: string): Promise<TalepYaniti> {
  return islem((o) => oturumIslemi(o, (db) => masrafFormuGeriCek(db, o, yazi(id))));
}
export async function masrafBelgesiEylemi(form: FormData): Promise<TalepYaniti> {
  const b = await belgeOku(form);
  if (b === "buyuk") return BUYUK;
  return islem((o) => oturumIslemi(o, (db) => masrafFormuBelgesi(db, depo(), o, o.kiraci.firmaId, yazi(form.get("id")), Number(form.get("surum")), b)));
}
/** 477: düzeltmeye geri gönderilen izin talebini düzelt ve yeniden gönder */
export async function izinDuzeltEylemi(form: FormData): Promise<TalepYaniti> {
  const b = await belgeOku(form);
  if (b === "buyuk") return BUYUK;
  const girdi = { tur: yazi(form.get("tur")), bas: yazi(form.get("bas")), bit: yazi(form.get("bit")), aciklama: yazi(form.get("aciklama")) };
  return islem((o) => oturumIslemi(o, (db) => izinDuzelt(db, depo(), o, o.kiraci.firmaId, yazi(form.get("id")), Number(form.get("surum")), girdi, b)));
}
/** 477: düzeltmeye geri gönderilen masraf formunu düzelt ve yeniden gönder */
export async function masrafDuzeltEylemi(form: FormData): Promise<TalepYaniti> {
  const b = await belgeOku(form);
  if (b === "buyuk") return BUYUK;
  const girdi = { is: yazi(form.get("is")), tarih: yazi(form.get("tarih")), tur: yazi(form.get("tur")), tutar: yazi(form.get("tutar")), oran: yazi(form.get("oran")),
    aciklama: yazi(form.get("aciklama")) };
  return islem((o) => oturumIslemi(o, (db) => masrafFormuDuzelt(db, depo(), o, o.kiraci.firmaId, yazi(form.get("id")), Number(form.get("surum")), girdi, b)));
}

/* 2026-10-25 (belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı …"): talep formunun elle
   doldurulan yerleri — talep penceresi açılınca verisi istenir; yetki talepler.ts'te (talepDoldurmaDurumu) */
const DOLDURMA = { ...SONUC, cakisma: "Belge bu arada değişti. Sayfayı yenileyip yeniden deneyin.", formatsiz: "Belgenin yayında formatı yok; doldurulacak yer kalmadı." } as const;
export async function talepDoldurmaVerisiEylemi(tip: string, id: string): Promise<TalepDoldurmaVerisi | null> {
  if (!(await ayniKoken())) return null;
  const o = await istekOturumu();
  if (!o) return null;
  return oturumIslemi(o, (db) => talepDoldurmaVerisi(db, o, yazi(tip), yazi(id), depo()));
}
export async function talepDoldurEylemi(tip: string, id: string, degerler: unknown, surum: unknown): Promise<TalepYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const s = typeof surum === "number" && Number.isSafeInteger(surum) && surum >= 0 ? surum : null;
  const r = await oturumIslemi(o, (db) => talepDoldur(db, o, yazi(tip), yazi(id), degerler, s));
  return r.durum === "tamam" ? { tamam: true } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "red" ? { genel: r.neden }
    : { genel: DOLDURMA[r.durum] };
}
