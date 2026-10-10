/* SAHA RAPORU · FOTOĞRAFTAN ALAN OKUMA (484; 385'in etiket plakası okumasının genel hâli — reisim 2026-10-10: "fotoğraf ekleme özelliği olsun
   fotoğraf eklenince belgede gözükmeyecek yapay zeka buradan okuma yapıp tabloyu dolduracak, aynı şekilde ekipman bilgilerinde de olsun bunu
   istediğim başlığa da ekleyebiliyim"). Ekipman bilgileri, bilgi bölümü ya da test değerleri — formatta "Fotoğraftan doldur" açık bölüm. Fotoğraftan
   okumayla (foto-oku.ts) aynı iki adım: hazırlık (işlem içinde: yazanın Yeni raporu · bölümde doldurma açık · firmada yapay zekâ açık · API anahtarı ·
   fotoğraf JPEG / PNG, en çok 5 MB, konum bilgisi silinmiş · kişinin sınırı → en kötü maliyet AYRILIR) → çağrı (işlem DIŞINDA) → kayıt (ayırma
   gerçek maliyetle kapanır, okuma kaydı bölümün kimliğiyle; rapor hâlâ yazanın Yeni raporuysa okunanlar ÖNERİ olarak döner — rapora yazılmaz,
   denetçi uygular, Kaydet'le yazılır; bir alan okunduysa fotoğraf rapora OKUMA fotoğrafı olarak eklenir — belgede görünmez). Elle giriş her zaman açık. */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { sirKullan } from "../../../server/ayar/sir.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { jpegTemizle, pngTemizle, turBul } from "../../../server/dosya/tur.ts";
import { alanEnCokMaliyet, alanIstegi, alanYanitiCoz, type AlanOkunan, type OkunacakAlan } from "../../../server/yz/alanlar.ts";
import { yzAyi, yzAyir, yzAyirmaBirak, yzOkumaYaz } from "../../../server/yz/kullanim.ts";
import { maliyetHesapla, type OkumaIstegi, type YzModel } from "../../../server/yz/okuma.ts";
import { FOTO_OKU_EN_BUYUK } from "./foto-oku.ts";
import { alanOkunabilir, okumaFotografiEkle, type Kisi, type RaporYazma } from "./raporlar.ts";

const ELLE = "Bilgileri elle girebilirsiniz.";
const dolar = (n: number) => String(n).replace(".", ",");

export interface AlanOkuHazir {
  durum: "hazir"; istek: OkumaIstegi; anahtar: string; model: YzModel; ay: string; ust: number; bolum: string; alanlar: OkunacakAlan[];
  foto: { ad: string; bayt: Uint8Array };
}

export async function alanOkuHazirla(db: Sorgulayici, kim: Kisi, raporId: string, bolumId: string, foto: { bayt: Uint8Array }, simdi = new Date()): Promise<AlanOkuHazir | RaporYazma> {
  const o = await alanOkunabilir(db, kim, raporId, bolumId);
  if ("durum" in o) return o;
  const yz = (await ayarOku(db, "yapay_zeka")).deger;
  if (!yz.acik) return { durum: "red", neden: `Fotoğraftan okuma firmada kapalı (Firma ayarları › Yapay zekâ). ${ELLE}` };
  const anahtar = await sirKullan(db, "yapay_zeka_anahtari");
  if (!anahtar) return { durum: "red", neden: `Yapay zekâ API anahtarı girilmedi (Firma ayarları › Yapay zekâ). ${ELLE}` };
  const tur = turBul(foto.bayt, ["jpeg", "png"]);
  if (!tur || (tur !== "jpeg" && tur !== "png")) return { durum: "gecersiz", hatalar: { foto: "Yalnız JPEG ya da PNG fotoğraf." } };
  if (foto.bayt.length > FOTO_OKU_EN_BUYUK) return { durum: "gecersiz", hatalar: { foto: "Fotoğraf çok büyük (en çok 5 MB)." } };
  let temiz: Uint8Array;
  try { temiz = tur === "jpeg" ? jpegTemizle(foto.bayt) : pngTemizle(foto.bayt); } catch { return { durum: "gecersiz", hatalar: { foto: "Fotoğraf bozuk; başka bir fotoğraf deneyin." } }; }
  /* ayırma en sonda: geçersiz fotoğraf ayırma yapmaz */
  const ay = yzAyi(simdi), ust = alanEnCokMaliyet(yz.model);
  if (!(await yzAyir(db, ay, yz.sinir, ust))) {
    return { durum: "red", neden: `Bu ay yapay zekâ sınırınız (${dolar(yz.sinir ?? 0)} $) doldu; firma yöneticisi Firma ayarları › Yapay zekâ'dan artırabilir. ${ELLE}` };
  }
  const ad = `${o.baslik.replace(/[^\p{L}\p{N} ()-]/gu, "").trim().slice(0, 60) || "Bölüm"} fotoğrafı.${tur === "png" ? "png" : "jpg"}`;
  return { durum: "hazir", istek: alanIstegi({ model: yz.model, baslik: o.baslik, alanlar: o.alanlar, resim: temiz, tur }), anahtar, model: yz.model, ay, ust,
    bolum: bolumId, alanlar: o.alanlar, foto: { ad, bayt: temiz } };
}

/** çağrı cevapsız bitti: ücretsizse ayırma bırakılır; sonucu bilinmiyorsa harcamaya yazılır */
export async function alanOkuBirak(db: Sorgulayici, h: Pick<AlanOkuHazir, "ay" | "ust">, ucret: "yok" | "bilinmiyor"): Promise<void> {
  await yzAyirmaBirak(db, h.ay, h.ust, ucret === "bilinmiyor");
}

export interface AlanOkuKullanim { okunan: AlanOkunan[]; durum: "tamam" | "kesik" | "ret" }
/** kayıt adımı 1 (kendi işleminde): cevap ÇAĞRI ANINDAKİ alanlarla süzülür; ayırma gerçek maliyetle kapanır, okuma kaydı (bölümün kimliği) yazılır —
    raporun şimdiki hâlinden bağımsız (ödenen çağrı kişinin kullanımına her durumda yazılır) */
export async function alanOkuKullanimYaz(db: Sorgulayici, raporId: string, h: Pick<AlanOkuHazir, "model" | "ay" | "ust" | "bolum" | "alanlar">, govde: unknown, bugun = new Date()): Promise<AlanOkuKullanim> {
  const { okunan, giris, cikis, durum } = alanYanitiCoz(govde, h.alanlar, bugun);
  await yzOkumaYaz(db, { ay: h.ay, ust: h.ust, raporId, bolum: h.bolum, model: h.model,
    oneri: okunan.map((x) => ({ degerler: { [x.alan]: x.deger }, guven: x.guven })), giris, cikis, maliyet: maliyetHesapla(h.model, giris, cikis) });
  return { okunan, durum };
}

export type AlanOkuSonucu = { durum: "tamam"; okunan: AlanOkunan[]; bildirim: string; fotoEklendi: boolean } | Exclude<RaporYazma, { durum: "tamam" }>;

/** kayıt adımı 2 (ayrı işlemde): rapor hâlâ yazanın Yeni raporu ve bölüm okunabilir mi (okuma sürerken gönderildiyse öneri dönmez); bir alan okunduysa
    fotoğraf rapora OKUMA fotoğrafı olarak eklenir (belgede görünmez; eklenemezse söylenir, öneri yine döner) */
export async function alanOkuSonuc(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, raporId: string, h: Pick<AlanOkuHazir, "bolum" | "foto">, k: AlanOkuKullanim): Promise<AlanOkuSonucu> {
  const o = await alanOkunabilir(db, kim, raporId, h.bolum);
  if ("durum" in o) return o.durum === "tamam" ? { durum: "yok" } : o;
  const parcalar = [k.durum === "ret" ? `Yapay zekâ bu fotoğrafı okumadı. ${ELLE}`
    : !k.okunan.length ? `Fotoğrafta bu bölümün bilgisi okunamadı. ${ELLE}`
    : `${k.okunan.length} bilgi okundu; uygulamadan rapora yazılmaz.${k.durum === "kesik" ? " Okuma yarım kaldı." : ""}`];
  let fotoEklendi = false;
  if (k.okunan.length) {
    const f = await okumaFotografiEkle(db, depo, kim, firmaId, raporId, h.bolum, h.foto);
    fotoEklendi = f.durum === "tamam";
    const neden = f.durum === "gecersiz" ? Object.values(f.hatalar)[0] : f.durum === "red" ? f.neden : "rapor şu an yazılamıyor";
    parcalar.push(fotoEklendi ? "Fotoğraf rapora eklendi (belgede görünmez)." : `Fotoğraf eklenemedi: ${neden?.replace(/\.$/, "")}.`);
  }
  return { durum: "tamam", okunan: k.okunan, bildirim: parcalar.join(" "), fotoEklendi };
}
