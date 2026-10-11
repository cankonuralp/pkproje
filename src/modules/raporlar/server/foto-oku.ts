/* SAHA RAPORU · FOTOĞRAFTAN OKUMA (351; maket rapor.html Z3 "Fotoğraftan oku" — sigorta panosu, ölçü aletinin ekranı; ARKA-UC §5.2; §8.10 "değer
   öneri olarak düşer, inspector onaylamadan kaydedilmez"). İki adım — yapay zekâ çağrısı veritabanı işleminin DIŞINDA (çağrı sürerken bağlantı ve
   satır kilidi tutulmaz):
     1. fotoOkuHazirla (işlem içinde): yazanın Yeni raporu ve ölçüm tablosu · firmada yapay zekâ açık · API anahtarı · fotoğraf JPEG / PNG, en çok
        5 MB, konum bilgisi (EXIF) silinmiş (yapısı bozuksa söylenir, gönderilmez) · kişinin bu ayki kullanımı sınırın altında → en kötü maliyet
        AYRILIR (354: satır kilidiyle — eşzamanlı okumalar sınırı aşamaz; sınır 0 ya da boş = sınırsız, maket Y1) → istek gövdesi + anahtar
        (yalnız sunucuda kalır).
     2. çağrı (src/server/yz/okuma.ts anthropicCagir) → fotoOkuKaydet: önce (kendi işleminde) ayırma gerçek maliyetle kapanır ve okuma kaydı yazılır —
        rapor okuma sürerken silinmiş / gönderilmiş olsa da ödenen çağrı kişinin kullanımına yazılır (354); sonra (ayrı işlemde) rapor hâlâ yazanın Yeni
        raporuysa satırlar ÖNERİ olarak döner (rapora yazılmaz — denetçi uygulayıp Kaydet'le yazar) ve fotoğraf rapora OKUMA fotoğrafı olarak
        eklenir (484: her tabloda; belgede görünmez — eskiden yalnız pano tablosunda, Fotoğraflar bölümüne). Çağrı cevapsız biterse fotoOkuBirak:
        ücretsizse ayırma bırakılır, sonucu bilinmiyorsa harcamaya yazılır.
   Elle giriş her zaman açık: okuma yapılamazsa nedeni söylenir.
   486 (reisim 2026-10-10: "buralarda yapay zekanın okuması için fotoğraf ekleme tuşu olsun yapay zeka okusun diye raporda gözükmesin"): tuş her
   zaman (formatta açık bölümde); firmada yapay zekâ kapalıysa fotoğraf OKUNMADAN okuma fotoğrafı olarak saklanır (okumaFotografiSakla) — açılınca
   fotoğrafın "Oku"su saklanan fotoğrafı okur (OkunacakFoto { dosya }: raporun o bölümdeki okuma fotoğrafı; yeniden eklenmez). */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { sirKullan } from "../../../server/ayar/sir.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { jpegTemizle, pngTemizle, turBul } from "../../../server/dosya/tur.ts";
import { yzAyi, yzAyir, yzAyirmaBirak, yzOkumaYaz } from "../../../server/yz/kullanim.ts";
import { enCokMaliyet, maliyetHesapla, okumaIstegi, okumaYanitiCoz, type OkumaIstegi, type OkunanSatir, type YzModel } from "../../../server/yz/okuma.ts";
import type { BolumOf } from "../../../format/tanim.ts";
import { alanOkunabilir, okumaFotografiBaytlari, okumaFotografiEkle, okunabilirOlcum, type Kisi, type RaporYazma } from "./raporlar.ts";

export const FOTO_OKU_EN_BUYUK = 5 << 20;
const ELLE = "Değerleri elle girebilirsiniz.";
const dolar = (n: number) => String(n).replace(".", ",");

/** okunacak fotoğraf: yeni çekilen (bayt) ya da raporun o bölümdeki okuma fotoğrafı (dosya kimliği — 486, sonradan okuma) */
export type OkunacakFoto = { bayt: Uint8Array } | { dosya: string };
/** okunacak fotoğrafın baytları; kayıtlıysa (raporda zaten duruyor) yeniden eklenmez. Raporun o bölümdeki okuma fotoğrafı değilse null */
export async function okunacakBaytlar(db: Sorgulayici, depo: Depo, kim: Kisi, raporId: string, bolumId: string, foto: OkunacakFoto): Promise<{ bayt: Uint8Array; kayitli: boolean } | null> {
  if ("bayt" in foto) return { bayt: foto.bayt, kayitli: false };
  const k = await okumaFotografiBaytlari(db, depo, kim, raporId, bolumId, foto.dosya);
  return k ? { bayt: k.bayt, kayitli: true } : null;
}
export const KAYITSIZ_FOTO: RaporYazma = { durum: "gecersiz", hatalar: { foto: "Okunacak fotoğraf raporda bulunamadı; sayfayı yenileyin." } };

/** hazırlık: çağrının ihtiyacı + kayıt adımının ihtiyacı (ayrılan tutar, temizlenmiş fotoğraf — raporda zaten duruyorsa null) */
export interface FotoOkuHazir { durum: "hazir"; istek: OkumaIstegi; anahtar: string; model: YzModel; bolum: BolumOf<"olcum">; ay: string; ust: number; foto: { ad: string; bayt: Uint8Array } | null }
export type FotoOkuHazirlik = FotoOkuHazir | RaporYazma;

export async function fotoOkuHazirla(db: Sorgulayici, depo: Depo, kim: Kisi, raporId: string, bolumId: string, kaynak: OkunacakFoto, simdi = new Date()): Promise<FotoOkuHazirlik> {
  const o = await okunabilirOlcum(db, kim, raporId, bolumId);
  if ("durum" in o) return o;
  const k = await okunacakBaytlar(db, depo, kim, raporId, bolumId, kaynak);
  if (!k) return KAYITSIZ_FOTO;
  const foto = { bayt: k.bayt };
  const yz = (await ayarOku(db, "yapay_zeka")).deger;
  if (!yz.acik) return { durum: "red", neden: `Fotoğraftan okuma firmada kapalı (Firma ayarları › Yapay zekâ). ${ELLE}` };
  const anahtar = await sirKullan(db, "yapay_zeka_anahtari");
  if (!anahtar) return { durum: "red", neden: `Yapay zekâ API anahtarı girilmedi (Firma ayarları › Yapay zekâ). ${ELLE}` };
  const tur = turBul(foto.bayt, ["jpeg", "png"]);
  if (!tur || (tur !== "jpeg" && tur !== "png")) return { durum: "gecersiz", hatalar: { foto: "Yalnız JPEG ya da PNG fotoğraf." } };
  if (foto.bayt.length > FOTO_OKU_EN_BUYUK) return { durum: "gecersiz", hatalar: { foto: "Fotoğraf çok büyük (en çok 5 MB)." } };
  /* yapısı bozuk dosya (baştaki imza doğru, parçalar değil): konum bilgisi silinemez → gönderilmez; sunucu eylemi çökmez, kişiye söylenir */
  let temiz: Uint8Array;
  try { temiz = tur === "jpeg" ? jpegTemizle(foto.bayt) : pngTemizle(foto.bayt); } catch { return { durum: "gecersiz", hatalar: { foto: "Fotoğraf bozuk; başka bir fotoğraf deneyin." } }; }
  /* ayırma en sonda: geçersiz fotoğraf ayırma yapmaz */
  const ay = yzAyi(simdi), ust = enCokMaliyet(yz.model);
  if (!(await yzAyir(db, ay, yz.sinir, ust))) {
    return { durum: "red", neden: `Bu ay yapay zekâ sınırınız (${dolar(yz.sinir ?? 0)} $) doldu; firma yöneticisi Firma ayarları › Yapay zekâ'dan artırabilir. ${ELLE}` };
  }
  const ad = `${o.bolum.ad.replace(/[^\p{L}\p{N} ()-]/gu, "").trim().slice(0, 60) || "Tablo"} fotoğrafı.${tur === "png" ? "png" : "jpg"}`;
  return { durum: "hazir", istek: okumaIstegi({ model: yz.model, bolum: o.bolum, resim: temiz, tur }), anahtar, model: yz.model, bolum: o.bolum, ay, ust,
    foto: k.kayitli ? null : { ad, bayt: temiz } };
}

/** 486: fotoğrafı OKUMADAN okuma fotoğrafı olarak saklar — firmada yapay zekâ kapalıyken (açılınca "Oku"). Bölümde fotoğraftan doldurma açık olmalı
    (ölçüm tablosu, ekipman bilgileri, bilgi ya da test bölümü); yalnız yazan, Yeni raporda; JPEG / PNG, en çok 5 MB (sonra okunabilsin), konum
    bilgisi silinir (dosya yolu). Belgede görünmez. */
export async function okumaFotografiSakla(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, raporId: string, bolumId: string, foto: { bayt: Uint8Array }): Promise<RaporYazma> {
  const t = await okunabilirOlcum(db, kim, raporId, bolumId);
  const o = "durum" in t && t.durum === "gecersiz" ? await alanOkunabilir(db, kim, raporId, bolumId) : t;
  if ("durum" in o) return o;
  if (foto.bayt.length > FOTO_OKU_EN_BUYUK) return { durum: "gecersiz", hatalar: { foto: "Fotoğraf çok büyük (en çok 5 MB)." } };
  const tur = turBul(foto.bayt, ["jpeg", "png"]);
  if (!tur) return { durum: "gecersiz", hatalar: { foto: "Yalnız JPEG ya da PNG fotoğraf." } };
  const baslik = "bolum" in o ? o.bolum.ad : o.baslik;
  const ad = `${baslik.replace(/[^\p{L}\p{N} ()-]/gu, "").trim().slice(0, 60) || "Bölüm"} fotoğrafı.${tur === "png" ? "png" : "jpg"}`;
  const r = await okumaFotografiEkle(db, depo, kim, firmaId, raporId, bolumId, { ad, bayt: foto.bayt });
  return r.durum === "tamam" ? { ...r, bildirim: "Fotoğraf rapora eklendi (belgede görünmez). Firmada yapay zekâ açılınca fotoğrafın “Oku”suyla okunur." } : r;
}

/** çağrı cevapsız bitti: ücretsizse ayırma bırakılır; sonucu bilinmiyorsa (zaman aşımı) ayrılan tutar harcamaya yazılır */
export async function fotoOkuBirak(db: Sorgulayici, h: Pick<FotoOkuHazir, "ay" | "ust">, ucret: "yok" | "bilinmiyor"): Promise<void> {
  await yzAyirmaBirak(db, h.ay, h.ust, ucret === "bilinmiyor");
}

export interface FotoOkuKullanim { satirlar: OkunanSatir[]; durum: "tamam" | "kesik" | "ret" }
/** kayıt adımı 1 (kendi işleminde): cevap ÇAĞRI ANINDAKİ tablo tanımıyla süzülür; ayırma gerçek maliyetle kapanır, okuma kaydı yazılır — raporun şimdiki
    hâlinden bağımsız (ödenen çağrı kişinin kullanımına her durumda yazılır) */
export async function fotoOkuKullanimYaz(db: Sorgulayici, raporId: string, h: Pick<FotoOkuHazir, "model" | "bolum" | "ay" | "ust">, govde: unknown): Promise<FotoOkuKullanim> {
  const { satirlar, giris, cikis, durum } = okumaYanitiCoz(govde, h.bolum);
  await yzOkumaYaz(db, { ay: h.ay, ust: h.ust, raporId, bolum: h.bolum.id, model: h.model, oneri: satirlar, giris, cikis, maliyet: maliyetHesapla(h.model, giris, cikis) });
  return { satirlar, durum };
}

/** öneri ya da raporun yazma hatası (okunabilirOlcum "tamam" döndürmez) */
export type FotoOkuSonucu = { durum: "tamam"; satirlar: OkunanSatir[]; bildirim: string; fotoEklendi: boolean } | Exclude<RaporYazma, { durum: "tamam" }>;

/** kayıt adımı 2 (ayrı işlemde): rapor hâlâ yazanın Yeni raporu ve tablo formatta mı (okuma sürerken gönderildiyse öneri dönmez); satır okunduysa
    fotoğraf rapora OKUMA fotoğrafı olarak eklenir (484 — belgede görünmez; eklenemezse söylenir, öneri yine döner) */
export async function fotoOkuKaydet(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, raporId: string, h: Pick<FotoOkuHazir, "bolum" | "foto">, k: FotoOkuKullanim): Promise<FotoOkuSonucu> {
  const o = await okunabilirOlcum(db, kim, raporId, h.bolum.id);
  if ("durum" in o) return o.durum === "tamam" ? { durum: "yok" } : o;
  const parcalar: string[] = [];
  if (k.durum === "ret") parcalar.push(`Yapay zekâ bu fotoğrafı okumadı. ${ELLE}`);
  else if (!k.satirlar.length) parcalar.push(k.durum === "kesik" ? `Okuma yarım kaldı ve satır çıkmadı; tabloyu parça parça fotoğraflayın ya da ${ELLE.toLocaleLowerCase("tr")}` : `Fotoğrafta bu tablonun satırı okunamadı. ${ELLE}`);
  else parcalar.push(`${k.satirlar.length} satır okundu; önerileri gözden geçirip uygulayın.${k.durum === "kesik" ? " Okuma yarım kaldı: kalan satırları ayrı fotoğrafla okutun." : ""}`);
  let fotoEklendi = false;
  if (k.satirlar.length && h.foto) {
    const f = await okumaFotografiEkle(db, depo, kim, firmaId, raporId, h.bolum.id, h.foto);
    fotoEklendi = f.durum === "tamam";
    const neden = f.durum === "gecersiz" ? Object.values(f.hatalar)[0] : f.durum === "red" ? f.neden : "rapor şu an yazılamıyor";
    parcalar.push(fotoEklendi ? "Fotoğraf rapora eklendi (belgede görünmez)." : `Fotoğraf eklenemedi: ${neden?.replace(/\.$/, "")}.`);
  }
  return { durum: "tamam", satirlar: k.satirlar, bildirim: parcalar.join(" "), fotoEklendi };
}
