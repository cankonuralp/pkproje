"use server";
/* RAPORLAR SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, kurallar ve ENGEL'ler modül işlevinde (raporlar.ts). İstemciden gelen kimlik ve sürüm
   yalnız "hangi rapor, hangi sürümü gördüm" bilgisidir; yetki vermez. Cihaz / fotoğraf sayısı istemciden alınmaz. */
import { refresh } from "next/cache";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { depo } from "../../../server/dosya/depo";
import { yedekSonraCalistir } from "../../../server/yedek/sonra";
import { belgePdf } from "../../../belge/pdf";
import {
  cihazEkle, cihazKaldir, fotoEkle, fotoSil, imzaHazirla, imzaliEslestirYukle, imzaliYukle, kayitliOnayaGonder, kontrolBasla, kontrolBitir, kontrolSaatDuzelt, onayaGonder, raporFormatGuncelle, raporKaydet, raporKopyala, raporKunyeGuncelle, raporOlustur, takipAc,
  raporSil, revizeIste, revizeIstegiGeriCek, teknikImzaHazirla, teknikImzaliEslestirYukle, teknikImzaliYukle, type RaporYazma,
} from "../server/raporlar";
import { anthropicCagir, type OkunanSatir } from "../../../server/yz/okuma";
import { FOTO_OKU_EN_BUYUK, fotoOkuBirak, fotoOkuHazirla, fotoOkuKaydet, fotoOkuKullanimYaz, okumaFotografiSakla, type OkunacakFoto } from "../server/foto-oku";
import { alanOkuBirak, alanOkuHazirla, alanOkuKullanimYaz, alanOkuSonuc } from "../server/alan-oku";
import { raporOneriSil } from "../server/oneri";
import type { AlanOkunan } from "../../../server/yz/alanlar";
import { raporIndirmeListesi, raporSayfasi } from "../server/liste";
import { firmaCalistirici, SignHatasi, signGonder, signHazirla, signIptalGonder, signIptalHazirla, signIptalYaz, signKaydet, signSonuclandir, signTopluHazirla, signTopluIste,
  signYenilenecek, type Asama } from "../server/sign";
import type { RaporListeSatiri } from "../server/raporlar";
import type { SunucuListe } from "../../../components/liste/suzgec";

export interface RaporYaniti {
  /** dosya (542): eklenen okuma fotoğrafının kimliği */
  tamam?: boolean; id?: string; dosya?: string; bildirim?: string; hatalar?: Record<string, string>; eksikler?: { bolum: string; alan: string; ad: string }[]; genel?: string;
}
const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Rapor siz açtıktan sonra değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Rapor bulunamadı.",
} as const;
const yanit = (r: RaporYazma): RaporYaniti =>
  r.durum === "tamam" ? { tamam: true, id: r.id, bildirim: r.bildirim, ...(r.dosya ? { dosya: r.dosya } : {}) } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "eksik" ? { eksikler: r.eksikler }
    : r.durum === "red" ? { genel: r.neden } : { genel: SONUC[r.durum] };
async function islem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<RaporYazma>): Promise<RaporYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  return yanit(await is(o));
}
const metin = (v: unknown) => (typeof v === "string" ? v : "");

/** 566: Raporlar listesinin bir sayfası (süzgeç SUNUCUDA — 09-B3). Oturum ve kiracı istekten; görme kuralı modül işlevinde (raporSayfasi).
    Süzgeç durumu biçim denetiminden geçer, koşula yalnız değer olarak girer. Göremeyene / oturumsuza null. */
export async function raporSayfasiEylemi(durum: unknown): Promise<SunucuListe<RaporListeSatiri> | null> {
  if (!(await ayniKoken())) return null;
  const o = await istekOturumu();
  if (!o) return null;
  return oturumIslemi(o, (db) => raporSayfasi(db, o, durum));
}

/** 2026-11-02 (Toplu indir): süzgeçten geçen bütün raporlar (en çok 300; aşarsa yalnız sayı). Görme kuralı modül işlevinde. */
export async function raporIndirmeListesiEylemi(durum: unknown): Promise<{ adet: number; raporlar: RaporListeSatiri[] } | null> {
  if (!(await ayniKoken())) return null;
  const o = await istekOturumu();
  if (!o) return null;
  return oturumIslemi(o, (db) => raporIndirmeListesi(db, o, durum));
}

/** 525: bekleyen öneri (S.A.Y Chat okuması) uygulandı / bırakıldı ya da şerit kapatıldı — bölümün önerileri kalkar (yalnız kişinin kendisininkiler) */
export async function raporOneriKapatEylemi(raporId: unknown, bolum: unknown): Promise<boolean> {
  if (!(await ayniKoken())) return false;
  const o = await istekOturumu();
  if (!o || typeof raporId !== "string" || typeof bolum !== "string") return false;
  return (await oturumIslemi(o, (db) => raporOneriSil(db, o, raporId, bolum))) > 0;
}

export async function raporOlusturEylemi(planId: string, ekipmanId: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => raporOlustur(db, o, metin(planId), metin(ekipmanId))));
}
/** 2026-10-26 (göç 0108): takip muayenesi aç — ekipmanın açık uygunsuzluğu olan son imzalı raporuna (…-T1) */
export async function takipAcEylemi(planId: string, ekipmanId: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => takipAc(db, o, metin(planId), metin(ekipmanId))));
}
export async function raporKaydetEylemi(id: string, surum: number, girdi: unknown): Promise<RaporYaniti> {
  const y = await islem((o) => oturumIslemi(o, (db) => raporKaydet(db, o, metin(id), Number(surum), girdi)));
  /* istemci yönlendiricisi sunucuda yenilenir: Ön izle kaydedip sayfadan çıkar, tarayıcının geri tuşu önbellekteki eski sürümü getirmesin
     (318 incelemesi — istemcide refresh + push'ta push bekleyen yenilemeyi atar) */
  if (y.tamam) refresh();
  return y;
}
export async function onayaGonderEylemi(id: string, surum: number, girdi: unknown): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => onayaGonder(db, o, metin(id), Number(surum), girdi)));
}
/* 2026-11-12 (göç 0128; pkproje.md §11 K2, K3): ölçümlü raporda kontrol saati — başlat / bitir (saati veritabanı yazar) ve gerekçeli düzeltme.
   Raporun sürümü sunucuda okunur (ekrandaki kaydedilmemiş değişiklik kalır); sonuç ekrana yenilemeyle gelir. */
export async function kontrolBaslaEylemi(id: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => kontrolBasla(db, o, metin(id))));
}
export async function kontrolBitirEylemi(id: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => kontrolBitir(db, o, metin(id))));
}
export async function kontrolDuzeltEylemi(id: string, girdi: unknown): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => kontrolSaatDuzelt(db, o, metin(id), girdi)));
}
/** 2026-11-06 (plan içi "Hazır olanları onaya gönder"): raporu kayıttaki hâliyle onaya gönderir; eksikli rapor değişmez, eksikleri döner */
export async function kayitliOnayaGonderEylemi(id: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => kayitliOnayaGonder(db, o, metin(id))));
}
export async function raporSilEylemi(id: string, surum: number): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => raporSil(db, o, metin(id), Number(surum))));
}
export async function cihazEkleEylemi(id: string, surum: number, turId: string, cihazId: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => cihazEkle(db, o, metin(id), Number(surum), metin(turId), metin(cihazId))));
}
export async function cihazKaldirEylemi(id: string, surum: number, turId: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => cihazKaldir(db, o, metin(id), Number(surum), metin(turId))));
}
export async function raporKunyeGuncelleEylemi(id: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => raporKunyeGuncelle(db, o, metin(id))));
}
/** fotoğraf ekle (form: id, surum, bolum, madde?, dosya); tür, boyut ve yer sunucuda denetlenir */
export async function fotoEkleEylemi(form: FormData): Promise<RaporYaniti> {
  const dosya = form.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { hatalar: { foto: "Fotoğraf seçilmeli." } };
  if (dosya.size > 8 << 20) return { hatalar: { foto: "Fotoğraf çok büyük (en çok 8 MB)." } };
  const bayt = new Uint8Array(await dosya.arrayBuffer());
  const madde = metin(form.get("madde"));
  /* 2026-11-12 (K5): cihazın okuduğu çekim anı ve konum (JSON; biçimi modülde denetlenir, bozuksa yok sayılır) */
  let kanit: unknown = null;
  try { kanit = JSON.parse(metin(form.get("kanit")) || "null"); } catch { kanit = null; }
  return islem((o) => oturumIslemi(o, (db) => fotoEkle(db, depo(), o, o.kiraci.firmaId, metin(form.get("id")), Number(form.get("surum")),
    { bolum: metin(form.get("bolum")), madde: madde || null }, { ad: dosya.name, bayt }, kanit)));
}
/** okunacak fotoğraf formdan (486): yeni dosya ("dosya") ya da raporun okuma fotoğrafı ("foto" — dosya kimliği; sonradan okuma). Dosya büyüklüğü burada,
    fotoğrafın raporun o bölümüne ait olduğu modülde denetlenir. */
async function okunacak(form: FormData): Promise<OkunacakFoto | string> {
  const kayitli = metin(form.get("foto"));
  if (kayitli) return { dosya: kayitli };
  const dosya = form.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return "Fotoğraf seçilmeli.";
  if (dosya.size > FOTO_OKU_EN_BUYUK) return "Fotoğraf çok büyük (en çok 5 MB).";
  return { bayt: new Uint8Array(await dosya.arrayBuffer()) };
}
/** 486: fotoğrafı OKUMADAN okuma fotoğrafı olarak ekle (form: id, bolum, dosya) — firmada yapay zekâ kapalıyken; belgede görünmez */
export async function okumaFotografiEkleEylemi(form: FormData): Promise<RaporYaniti> {
  const k = await okunacak(form);
  if (typeof k === "string" || !("bayt" in k)) return { genel: typeof k === "string" ? k : "Fotoğraf seçilmeli." };
  return islem((o) => oturumIslemi(o, (db) => okumaFotografiSakla(db, depo(), o, o.kiraci.firmaId, metin(form.get("id")), metin(form.get("bolum")), k)));
}
/** fotoğraftan okuma (351; form: id, bolum, dosya ya da foto): hazırlık (ayırma) ve kayıt oturumun işlemlerinde, yapay zekâ çağrısı işlemin DIŞINDA; satırlar öneri.
    354: beklenmeyen hata eylemi çökertmez (istemci hata ekranına düşüp kaydedilmemiş girişler kaybolmasın) — ileti döner; çağrı cevapsız biterse ayırma
    kapanır (ücretsizse bırakılır, sonucu bilinmiyorsa harcamaya yazılır); ödenen çağrı rapor yazılamaz olsa da kullanıma yazılır. */
export interface FotoOkuYaniti { satirlar?: OkunanSatir[]; bildirim?: string; genel?: string; yenile?: boolean }
export async function fotoOkuEylemi(form: FormData): Promise<FotoOkuYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const id = metin(form.get("id")), bolum = metin(form.get("bolum"));
  try {
    const kaynak = await okunacak(form);
    if (typeof kaynak === "string") return { genel: kaynak };
    const h = await oturumIslemi(o, (db) => fotoOkuHazirla(db, depo(), o, id, bolum, kaynak));
    if (h.durum !== "hazir") return { genel: yanit(h).genel ?? Object.values(yanit(h).hatalar ?? {})[0] ?? "Fotoğraftan okunamadı." };
    const y = await anthropicCagir(h.istek, h.anahtar);
    if (y.durum === "hata") {
      await oturumIslemi(o, (db) => fotoOkuBirak(db, h, y.ucret));
      return { genel: `Fotoğraftan okunamadı: ${y.neden} Değerleri elle girebilirsiniz.` };
    }
    const kullanim = await oturumIslemi(o, (db) => fotoOkuKullanimYaz(db, id, h, y.govde));
    const k = await oturumIslemi(o, (db) => fotoOkuKaydet(db, depo(), o, o.kiraci.firmaId, id, h, kullanim));
    return k.durum === "tamam" ? { satirlar: k.satirlar, bildirim: k.bildirim, yenile: k.fotoEklendi } : { genel: yanit(k).genel ?? "Fotoğraftan okunamadı." };
  } catch (e) {
    console.error("[fotoğraftan okuma] beklenmeyen hata:", (e as Error)?.message);
    return { genel: "Fotoğraftan okunamadı (beklenmeyen hata). Değerleri elle girebilirsiniz." };
  }
}
/** fotoğraftan alan okuma (484; 385'in etiket plakası okumasının genel hâli — form: id, bolum ("ekipman" ya da bölümün kimliği), dosya): öneri döner,
    rapora yazmaz; bir alan okunduysa fotoğraf rapora okuma fotoğrafı olarak (belgede görünmez) — ekran yenilenir */
export interface AlanOkuYaniti { okunan?: AlanOkunan[]; bildirim?: string; genel?: string; yenile?: boolean }
export async function alanOkuEylemi(form: FormData): Promise<AlanOkuYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const id = metin(form.get("id")), bolum = metin(form.get("bolum"));
  try {
    const kaynak = await okunacak(form);
    if (typeof kaynak === "string") return { genel: kaynak };
    const h = await oturumIslemi(o, (db) => alanOkuHazirla(db, depo(), o, id, bolum, kaynak));
    if (h.durum !== "hazir") return { genel: yanit(h).genel ?? Object.values(yanit(h).hatalar ?? {})[0] ?? "Fotoğraftan okunamadı." };
    const y = await anthropicCagir(h.istek, h.anahtar);
    if (y.durum === "hata") {
      await oturumIslemi(o, (db) => alanOkuBirak(db, h, y.ucret));
      return { genel: `Fotoğraftan okunamadı: ${y.neden} Bilgileri elle girebilirsiniz.` };
    }
    const kullanim = await oturumIslemi(o, (db) => alanOkuKullanimYaz(db, id, h, y.govde));
    const k = await oturumIslemi(o, (db) => alanOkuSonuc(db, depo(), o, o.kiraci.firmaId, id, h, kullanim));
    return k.durum === "tamam" ? { okunan: k.okunan, bildirim: k.bildirim, yenile: k.fotoEklendi } : { genel: yanit(k).genel ?? "Fotoğraftan okunamadı." };
  } catch (e) {
    console.error("[fotoğraftan alan okuma] beklenmeyen hata:", (e as Error)?.message);
    return { genel: "Fotoğraftan okunamadı (beklenmeyen hata). Bilgileri elle girebilirsiniz." };
  }
}
export async function fotoSilEylemi(id: string, surum: number, dosyaId: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => fotoSil(db, o, metin(id), Number(surum), metin(dosyaId))));
}
/** Kaydet ve kopyala (kayit: ekranın son hâli) / Kopyala (gönderilmiş rapor, kayit null); başarıda id yeni raporun */
export async function raporKopyalaEylemi(id: string, surum: number, girdi: unknown, kayit: unknown): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => raporKopyala(db, o, metin(id), Number(surum), girdi, kayit ?? null)));
}
export async function raporFormatGuncelleEylemi(id: string, surum: number, kayit: unknown): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => raporFormatGuncelle(db, o, metin(id), Number(surum), kayit)));
}
/** İmzala (317): onaylanmış raporun kesin imzasız PDF'i sunucuda bir kez üretilir (başsız Chromium) ve saklanır */
export async function imzaHazirlaEylemi(id: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => imzaHazirla(db, depo(), o, o.kiraci.firmaId, metin(id), belgePdf)));
}
/** imzalı PDF yükle (form: id, surum, dosya); önek, imza sözlüğü, yetki ve durum sunucuda */
export async function imzaliYukleEylemi(form: FormData): Promise<RaporYaniti> {
  const dosya = form.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { hatalar: { dosya: "İmzalı PDF seçilmeli." } };
  if (dosya.size > 25 << 20) return { hatalar: { dosya: "PDF çok büyük (en çok 25 MB)." } };
  const bayt = new Uint8Array(await dosya.arrayBuffer());
  return islem(async (o) => {
    const r = await oturumIslemi(o, (db) => imzaliYukle(db, depo(), o, o.kiraci.firmaId, metin(form.get("id")), Number(form.get("surum")), { ad: dosya.name, bayt }));
    /* 2026-11-03: imzalı rapor firmanın Drive / OneDrive yedeğine birkaç dakika içinde (bağlı değilse hemen biter) */
    if (r.durum === "tamam") yedekSonraCalistir(o.kiraci, 25_000);
    return r;
  });
}
/** 596 toplu imza: tek imzalı PDF (form: dosya) — hangi rapora ait olduğu sunucuda İÇERİKTEN bulunur (rapor kimliği istemciden alınmaz);
    yanıtta raporun kimliği ve numarası (sonuç tablosu) */
export async function imzaliEslestirYukleEylemi(form: FormData): Promise<RaporYaniti & { no?: string | null; rapor?: string | null }> {
  const dosya = form.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { hatalar: { dosya: "İmzalı PDF seçilmeli." } };
  if (dosya.size > 25 << 20) return { hatalar: { dosya: "PDF çok büyük (en çok 25 MB)." } };
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const bayt = new Uint8Array(await dosya.arrayBuffer());
  const s = await oturumIslemi(o, (db) => imzaliEslestirYukle(db, depo(), o, o.kiraci.firmaId, { ad: dosya.name, bayt }));
  if (s.sonuc.durum === "tamam") yedekSonraCalistir(o.kiraci, 25_000);
  return { ...yanit(s.sonuc), no: s.no, rapor: s.id };
}
/* 2026-10-17 TEKNİK YÖNETİCİ İMZASI (göç 0102): firma ayarı açıkken onaydaki raporu teknik yönetici imzalayarak onaylar — yetki, ayar, durum,
   imza denetimi ve imzalayanın adı sunucuda (raporlar.ts teknikImza…) */
export async function teknikImzaHazirlaEylemi(id: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => teknikImzaHazirla(db, depo(), o, o.kiraci.firmaId, metin(id), belgePdf)));
}
/** teknik yöneticinin imzalı PDF'i (form: id, surum, dosya) */
export async function teknikImzaliYukleEylemi(form: FormData): Promise<RaporYaniti> {
  const dosya = form.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { hatalar: { dosya: "İmzalı PDF seçilmeli." } };
  if (dosya.size > 25 << 20) return { hatalar: { dosya: "PDF çok büyük (en çok 25 MB)." } };
  const bayt = new Uint8Array(await dosya.arrayBuffer());
  return islem((o) => oturumIslemi(o, (db) => teknikImzaliYukle(db, depo(), o, o.kiraci.firmaId, metin(form.get("id")), Number(form.get("surum")), { ad: dosya.name, bayt })));
}
/** teknik yöneticinin toplu yüklemesi: tek imzalı PDF (form: dosya) — hangi rapora ait olduğu sunucuda içerikten */
export async function teknikImzaliEslestirYukleEylemi(form: FormData): Promise<RaporYaniti & { no?: string | null; rapor?: string | null }> {
  const dosya = form.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { hatalar: { dosya: "İmzalı PDF seçilmeli." } };
  if (dosya.size > 25 << 20) return { hatalar: { dosya: "PDF çok büyük (en çok 25 MB)." } };
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const bayt = new Uint8Array(await dosya.arrayBuffer());
  const s = await oturumIslemi(o, (db) => teknikImzaliEslestirYukle(db, depo(), o, o.kiraci.firmaId, { ad: dosya.name, bayt }));
  return { ...yanit(s.sonuc), no: s.no, rapor: s.id };
}
/* revize isteği (318): yalnız raporu yazan, tamamlanan raporda */
export async function revizeIsteEylemi(id: string, girdi: unknown): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => revizeIste(db, o, metin(id), girdi)));
}
export async function revizeIstegiGeriCekEylemi(id: string, istekId: string, surum: number): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => revizeIstegiGeriCek(db, o, metin(id), metin(istekId), Number(surum))));
}

/* ── 2026-11-05 (göç 0122): probata sign ile imza — hazırla (işlem) → sign'a gönder (ağ, işlem dışında) → kaydet; durum yenile; iptal ── */
const signAsama = (a: unknown): Asama => (a === "teknik" ? "teknik" : "uzman");
/** toplu imzada tek istekte gönderilen rapor (her biri için imzasız PDF üretilir) */
const SIGN_TOPLU_PARCA = 10;
/** 2026-11-07 (gömülü imza): ekranın açacağı adresler — gomulu: probata'nın içinde iframe'de; baglanti: yeni sekme yedeği (gömülü yoksa ya da açılamazsa) */
interface SignAdresleri { gomulu?: string; baglanti?: string }
type Oturum = NonNullable<Awaited<ReturnType<typeof istekOturumu>>>;
/** toplu imza adresi sign'dan (oturumdaki kişinin e-postasıyla; 60 dk geçerli, saklanmaz) — belgeler: sign'ın kabul ettikleri */
async function signTopluAdresAl(o: Oturum, belgeler: readonly string[]): Promise<RaporYaniti & SignAdresleri & { belgeler?: string[] }> {
  const h = await oturumIslemi(o, (db) => signTopluHazirla(db, o));
  if ("hata" in h) return { genel: h.hata };
  try {
    const t = await signTopluIste(h, belgeler);
    if (!t.gomulu && !t.adres) return { genel: "probata sign toplu imza adresi vermedi." };
    return { tamam: true, ...(t.gomulu ? { gomulu: t.gomulu } : {}), ...(t.adres ? { baglanti: t.adres } : {}), belgeler: t.belgeler };
  } catch (e) {
    if (e instanceof SignHatasi) return { genel: e.message };
    throw e;
  }
}
/** İmzala (sign): adresler döner — ekran gömülü pencerede (iframe) açar, olmazsa yeni sekmede. sign'a ulaşılamazsa neden şeritte; elle yol açık kalır */
export async function signImzalaEylemi(id: string, asama: string): Promise<RaporYaniti & SignAdresleri> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const h = await oturumIslemi(o, (db) => signHazirla(db, depo(), o, o.kiraci.firmaId, metin(id), signAsama(asama), belgePdf, { tek: true }));
  if (h.tur === "hata") return yanit(h.y);
  if (h.tur === "acik") return { tamam: true, ...(h.gomulu ? { gomulu: h.gomulu } : {}), ...(h.baglanti ? { baglanti: h.baglanti } : {}) };
  try {
    const s = await signGonder(h);
    if (!(await oturumIslemi(o, (db) => signKaydet(db, o, o.kiraci.firmaId, h.istekId, s)))) return { genel: "Rapor bu arada değişti. Sayfayı yenileyip yeniden deneyin." };
    return { tamam: true, ...(s.gomulu ? { gomulu: s.gomulu } : {}), ...(s.baglanti ? { baglanti: s.baglanti } : {}) };
  } catch (e) {
    if (e instanceof SignHatasi) return { genel: e.message };
    throw e;
  }
}
/** Durumu yenile: sign'a sorar; imzalandıysa imzalı PDF bugünkü yükleme yolundan geçer */
export async function signYenileEylemi(id: string, asama: string): Promise<RaporYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const istek = await oturumIslemi(o, (db) => signYenilenecek(db, o, metin(id), signAsama(asama)));
  if (!istek) return { genel: "probata sign'da bekleyen imza isteği yok." };
  try {
    const s = await signSonuclandir(firmaCalistirici(o.kiraci), depo(), o.kiraci.firmaId, istek);
    if (s.durum === "tamam") { yedekSonraCalistir(o.kiraci, 25_000); return { tamam: true, bildirim: s.bildirim }; }
    if (s.durum === "bekliyor") return { tamam: true, bildirim: "probata sign'da imza henüz atılmadı." };
    return { genel: s.neden };
  } catch (e) {
    if (e instanceof SignHatasi) return { genel: e.message };
    throw e;
  }
}
/** İptal et: sign'daki istek iptal; elle yol ve yeniden "İmzala" açık */
export async function signIptalEylemi(id: string, asama: string): Promise<RaporYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const h = await oturumIslemi(o, (db) => signIptalHazirla(db, o, metin(id), signAsama(asama)));
  if (!h) return { genel: "İptal edilecek imza isteği yok." };
  try { await signIptalGonder(h.anahtar, h.istek.sign_istek!); }
  catch (e) { if (!(e instanceof SignHatasi) || e.kod !== 409) return { genel: e instanceof Error ? e.message : "probata sign'a ulaşılamadı." }; }
  await oturumIslemi(o, (db) => signIptalYaz(db, o, h.istek.id));
  return { tamam: true, bildirim: "İmza isteği iptal edildi." };
}

/** toplu imza (sign) — BİR PARÇA: en çok  rapor sign'a gönderilir (her biri için imzasız PDF bir kez üretilir — 200 rapor tek isteğe
    sığmaz; ekran parça parça çağırır), istekler uzmanın sign üyeliğine bağlanır. Dönen: üyeye bağlanan belgeler (ekran hepsini toplayıp sign'ın
    toplu sayfasını açar — en çok 200, PIN bir kez), üyesi bulunmayanların sayısı (rapor rapor İmzala), hatalar. İmzalanan her rapor bildirimle ilerler */
export async function signTopluEylemi(idler: string[], asama: string): Promise<{ tamam?: boolean; genel?: string; belgeler?: string[];
  hatalar?: { id: string; neden: string }[]; uyeDegil?: number; dur?: boolean }> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const l = [...new Set((Array.isArray(idler) ? idler : []).map(metin).filter((x) => /^[0-9a-f-]{36}$/.test(x)))].slice(0, SIGN_TOPLU_PARCA);
  if (!l.length) return { genel: "Rapor seçilmedi." };
  const a = signAsama(asama), belgeler: string[] = [], hatalar: { id: string; neden: string }[] = [];
  let uyeDegil = 0, dur = false;
  for (const id of l) {
    try {
      const h = await oturumIslemi(o, (db) => signHazirla(db, depo(), o, o.kiraci.firmaId, id, a, belgePdf, { toplu: true }));
      if (h.tur === "hata") { const y = yanit(h.y); hatalar.push({ id, neden: y.genel ?? Object.values(y.hatalar ?? {})[0] ?? "Hazırlanamadı." }); continue; }
      if (h.tur === "acik") { belgeler.push(h.belge); continue; }
      const g = await signGonder(h, undefined, undefined, { toplu: true });
      if (!(await oturumIslemi(o, (db) => signKaydet(db, o, o.kiraci.firmaId, h.istekId, g)))) { hatalar.push({ id, neden: "Rapor bu arada değişti." }); continue; }
      if (g.baglanti) uyeDegil++; else belgeler.push(g.belge);
    } catch (e) {
      /* anahtar geçersiz ya da sign'a ulaşılamıyor: kalan parçalar da düşerdi — ekran durur */
      if (e instanceof SignHatasi) { hatalar.push({ id, neden: e.message }); if (e.kod === 401 || e.kod === 0) { dur = true; break; } continue; }
      throw e;
    }
  }
  return { tamam: true, belgeler, hatalar, uyeDegil, dur };
}
/** toplu imza: toplanan belgelerle sign'ın toplu imza adresleri — sign'dan, oturumdaki kişinin e-postasıyla (2026-11-07: adres elle kurulmaz) */
export async function signTopluAdresiEylemi(belgeler: string[]): Promise<RaporYaniti & SignAdresleri & { belgeler?: string[] }> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const l = (Array.isArray(belgeler) ? belgeler : []).map(metin).filter((x) => /^[0-9a-f-]{36}$/.test(x));
  return l.length ? signTopluAdresAl(o, l) : { genel: "Toplu imzaya rapor yok." };
}
