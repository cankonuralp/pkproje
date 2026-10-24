"use server";
/* RAPOR FORMATI SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama, kilitli öğe denetimi modül işlevinde (formatlar.ts). İstemciden
   gelen kimlik / sürüm yalnız "hangi kayıt, hangi sürümü gördüm" bilgisidir; yayının engeli ve uyarıları sunucuda yeniden hesaplanır.
   438 / 440: Bakanlık şablonundan başlatma / tür eklemede türün PDF'i yoksa resmî PDF, boş standart / cihaz bağlantısı formatınkiyle — aynı işlemde
   (kurulum.ts bakanlikTamamla). */
import { kullanimMetni } from "../../../components/sil/metin";
import { ayniKoken } from "../../../server/kimlik/koken";
import { depo } from "../../../server/dosya/depo";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { GeriDonusIptal, sablondanTurEkle, surumeGeriDon, surumSil, taslakBaslat, taslakKaydet, yayinDenetle, yayinla, type GeriDonSonucu } from "../server/formatlar";
import { bakanlikTamamla } from "../server/kurulum";
import { parcaKaydet, parcaSil } from "../server/parcalar";
import { BELGE_EN_BUYUK, formatBelgesi, formatYzBirak, formatYzHazirla, formatYzKapat, type FormatYzSonucu } from "../server/yz";
import { anthropicCagir } from "../../../server/yz/okuma";
import { basilidanTanim } from "../basili";
import { BASILI_HAM_EN_COK, basiliHazirla, basiliYaz } from "../server/basili";
import type { FirmaParcasi } from "../yapboz";

export interface FormatDurumuYaniti { tamam?: boolean; id?: string; sira?: number; uyarilar?: string[]; engeller?: string[]; hatalar?: Record<string, string>; genel?: string }

const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Bu şablon siz açtıktan sonra başkası tarafından değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Kayıt bulunamadı.",
  kilitli: "Yayınlanmış sürüm değiştirilemez.",
} as const;

/** oturumdaki kişi ya da kullanıcıya söylenecek ileti */
async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}
const metin = (x: unknown) => (typeof x === "string" ? x : "");

export async function taslakBaslatEylemi(turId: string, taslakSurumu: number | null, baslangic: string): Promise<FormatDurumuYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const ts = taslakSurumu === null ? null : Number(taslakSurumu);
  const r = await oturumIslemi(o, async (db) => {
    const t = await taslakBaslat(db, o, metin(turId), metin(baslangic), ts);
    if (t.durum === "tamam") await bakanlikTamamla(db, depo(), o, o.kiraci.firmaId, metin(turId));
    return t;
  });
  if (r.durum === "tamam") return { tamam: true, id: r.id };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}

export async function yayinDenetleEylemi(formatId: string): Promise<FormatDurumuYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const d = await oturumIslemi(o, (db) => yayinDenetle(db, o, metin(formatId)));
  return d ? { tamam: true, engeller: d.engeller, uyarilar: d.uyarilar } : { genel: SONUC.yok };
}

export async function yayinlaEylemi(formatId: string, surum: number, notu: string): Promise<FormatDurumuYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => yayinla(db, o, metin(formatId), Number(surum), metin(notu)));
  if (r.durum === "tamam") return { tamam: true, sira: r.sira, uyarilar: r.uyarilar };
  if (r.durum === "engel") return { engeller: r.engeller };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}

/** 2026-10-12 (reisim: "ekipman türlerinde eski sürüme geri dön tuşu olsun"): eski sürümün içeriği yeni sürüm olarak yayınlanır — karar, yetki ve
    denetim formatlar.ts surumeGeriDon'da; yayın tamamlanmazsa işlem geri alınır (GeriDonusIptal), hiçbir şey değişmez. */
export async function surumeGeriDonEylemi(turId: string, surumId: string, taslakSurumu: number | null, notu: string): Promise<FormatDurumuYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const ts = taslakSurumu === null ? null : Number(taslakSurumu);
  let r: GeriDonSonucu;
  try {
    r = await oturumIslemi(o, (db) => surumeGeriDon(db, o, metin(turId), metin(surumId), ts, metin(notu)));
  } catch (h) {
    if (!(h instanceof GeriDonusIptal)) throw h;
    r = h.sonuc;
  }
  if (r.durum === "tamam") return { tamam: true, id: r.id, sira: r.sira, uyarilar: r.uyarilar };
  if (r.durum === "yayinda") return { genel: "Bu sürüm zaten yayında." };
  if (r.durum === "engel") return { engeller: r.engeller };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}

/** Format kurucu (K4): taslağın tanımını kaydet — şemadan geçmeyen ya da çok büyük tanım yazılmaz; yayınlanmış sürüm değişmez */
export async function taslakKaydetEylemi(formatId: string, surum: number, tanim: unknown): Promise<FormatDurumuYaniti & { surum?: number }> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => taslakKaydet(db, o, metin(formatId), Number(surum), tanim));
  if (r.durum === "tamam") return { tamam: true, id: r.id, surum: r.surum };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}

/** sürüm sil (370 taslak; 2026-10-12 hiç kullanılmamış eski sürüm — göç 0081): yalnız yönetici; karar formatlar.ts surumSil / veritabanında.
    Silinemezse nedeni: yayındaki sürüm ya da kullanıldığı yerler ("2 raporda, 1 imzalı rapor sürümünde"). */
export async function surumSilEylemi(id: string): Promise<FormatDurumuYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => surumSil(db, o, metin(id)));
  if (r.durum === "tamam") return { tamam: true, id: r.id };
  if (r.durum === "kullanildi") {
    return { genel: r.kullanim.yayinda ? "Yayındaki sürüm silinmez; yeni raporlar onunla açılır."
      : `Bu sürüm silinemez: ${kullanimMetni(r.kullanim)} kullanıldı — o raporların belgesi bu sürümle çizilir.` };
  }
  return { genel: SONUC[r.durum] };
}

/** 436: hazır şablondan ekipman türü — tür + şablondan taslak tek işlemde (karar ve yetki formatlar.ts sablondanTurEkle'de) */
export async function sablondanTurEkleEylemi(sablon: string, girdi: unknown): Promise<FormatDurumuYaniti & { formatId?: string }> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const g = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  const temiz = Object.fromEntries(["ad", "kod", "grup", "brans", "periyot", "sure"].map((k) => [k, metin(g[k])]));
  const r = await oturumIslemi(o, async (db) => {
    const t = await sablondanTurEkle(db, o, metin(sablon), temiz);
    if (t.durum === "tamam") await bakanlikTamamla(db, depo(), o, o.kiraci.firmaId, t.turId);
    return t;
  });
  if (r.durum === "tamam") return { tamam: true, id: r.turId, formatId: r.formatId };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}

/** 496: bölümü firmanın parçası olarak kaydet — bölüm istemciden gelir, sunucuda şemadan ve parcaHazirla'dan geçer; firma ve kişi oturumdan */
export async function parcaKaydetEylemi(ad: string, bolum: unknown): Promise<{ tamam?: boolean; parca?: FirmaParcasi; genel?: string }> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => parcaKaydet(db, o, metin(ad), bolum));
  if (r.durum === "tamam" && r.bolum) return { tamam: true, parca: { id: r.id, ad: r.ad, bolum: r.bolum } };
  if (r.durum === "tamam") return { genel: SONUC.yok };
  if (r.durum === "gecersiz") return { genel: r.neden };
  return { genel: SONUC[r.durum] };
}

/** 496: firmanın parçasını kesin sil (yalnız yönetici) — formatlar etkilenmez */
export async function parcaSilEylemi(id: string): Promise<{ tamam?: boolean; genel?: string }> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => parcaSil(db, o, metin(id)));
  return r.durum === "tamam" ? { tamam: true } : { genel: SONUC[r.durum === "gecersiz" ? "yok" : r.durum] };
}

/** 497 "Yapay zekâya anlat": istek + kurucudaki taslak (yalnız istemin kurulması için; şemadan geçer) → öneriler. Hiçbir şey yazılmaz — kurucuda
    "Ekle" / "Uygula". Yetki, ayar, sınır sunucuda; çağrı veritabanı işleminin DIŞINDA (S.A.Y deseni). */
export async function formatYzEylemi(istek: unknown, tanim: unknown, turAd: unknown): Promise<FormatYzSonucu> {
  return yzCagir({ istek, tanim, turAd });
}

/** 498 "Belgeden başlat": firmanın format belgesi (PDF / Word / fotoğraf) → öneriler. Belge saklanmaz; tür içerikten, sunucuda. */
export async function formatBelgeEylemi(form: FormData): Promise<FormatYzSonucu> {
  const d = form.get("dosya");
  if (!(d instanceof File)) return { durum: "red", neden: "Belge seçin." };
  if (d.size > BELGE_EN_BUYUK) return { durum: "red", neden: "Belge çok büyük (en çok 4 MB). PDF'i küçültün ya da sayfaları ayırın." };
  const belge = formatBelgesi(new Uint8Array(await d.arrayBuffer()), d.name);
  if ("durum" in belge) return belge;
  let tanim: unknown = null;
  try { tanim = JSON.parse(String(form.get("tanim") ?? "null")); } catch { tanim = null; }
  return yzCagir({ istek: "", tanim, turAd: form.get("turAd"), belge });
}

/** 2026-10-23 (basılı formdan şablon — reisim: "ben bunu yükleyince format buna dönüşsün format düzenleyicide bundan düzenleme yapabileyim
    istiyorum"): türün basılı format PDF'i türün TASLAĞI olur — kurucuda açılır. 2026-10-24 yapay zekâsız (reisim: "en baştan beri bunu istedim"):
    PDF tarayıcıda okunur (pdfOku.ts), buraya okunan ızgara gelir — sira: okunan PDF'in sürümü. Girdi burada sınırlanır (ızgara en çok 2 MB, sira
    tamsayı); biçimi çeviricide denetlenir. uyarilar: okumanın notu ve şablona alınamayan bölümler. 2026-10-24 (denetim): iki kısa işlem —
    hazırlık (yetki, tür, PDF sürümü türde var mı) ve taslak; çeviri ARADA, veritabanı işleminin dışında (işlemci işi bağlantıyı tutmaz). */
export async function basilidanKurEylemi(turId: string, sira: number, ham: unknown, taslakSurumu: number | null): Promise<FormatDurumuYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const s = Number(sira), ts = taslakSurumu === null ? null : Number(taslakSurumu);
  if (!Number.isSafeInteger(s) || s < 1) return { genel: "Basılı format sürümü geçersiz." };
  let boy = Infinity;
  try { boy = Buffer.byteLength(JSON.stringify(ham) ?? ""); } catch { boy = Infinity; }
  if (!boy) return { genel: "Form okunamadı." };
  if (boy > BASILI_HAM_EN_COK) return { genel: "Form çok büyük; sayfaları ayırıp yeniden yükleyin." };
  const h = await oturumIslemi(o, (db) => basiliHazirla(db, o, metin(turId), s));
  if (h.durum === "red") return { genel: h.neden };
  const ceviri = basilidanTanim(ham, h.turAd);
  if (!ceviri) return { genel: "Form şablona çevrilemedi." };
  const r = await oturumIslemi(o, (db) => basiliYaz(db, o, metin(turId), s, ceviri, ts));
  if (r.durum === "cakisma") return { genel: SONUC.cakisma };
  if (r.durum === "red") return { genel: r.neden };
  return { tamam: true, id: r.id, sira: s, uyarilar: [r.cevap, ...(r.atilan.length ? [`Şablona alınamayan bölüm: ${r.atilan.join(", ")}.`] : [])].filter(Boolean) };
}

async function yzCagir(p: Parameters<typeof formatYzHazirla>[2]): Promise<FormatYzSonucu> {
  const o = await oturum(); if (typeof o === "string") return { durum: "red", neden: o };
  const h = await oturumIslemi(o, (db) => formatYzHazirla(db, o, p));
  if (h.durum !== "hazir") return h;
  const y = await anthropicCagir(h.istek, h.anahtar);
  if (y.durum === "hata") {
    await oturumIslemi(o, (db) => formatYzBirak(db, h, y.ucret));
    return { durum: "red", neden: y.neden };
  }
  return oturumIslemi(o, (db) => formatYzKapat(db, h, y.govde));
}
