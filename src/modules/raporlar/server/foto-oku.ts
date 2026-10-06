/* SAHA RAPORU · FOTOĞRAFTAN OKUMA (351; maket rapor.html Z3 "Fotoğraftan oku" — sigorta panosu, ölçü aletinin ekranı; ARKA-UC §5.2; §8.10 "değer
   öneri olarak düşer, inspector onaylamadan kaydedilmez"). İki adım — yapay zekâ çağrısı veritabanı işleminin DIŞINDA (çağrı sürerken bağlantı ve
   satır kilidi tutulmaz):
     1. fotoOkuHazirla (işlem içinde): yazanın Yeni raporu ve ölçüm tablosu · firmada yapay zekâ açık · API anahtarı · kişinin bu ayki maliyeti sınırın
        altında · fotoğraf JPEG / PNG, en çok 5 MB, konum bilgisi (EXIF) silinmiş → istek gövdesi + anahtar (yalnız sunucuda kalır).
     2. çağrı (src/server/yz/okuma.ts anthropicCagir) → fotoOkuKaydet (işlem içinde): cevap şemaya göre süzülür, maliyet kişinin aylık kullanımına,
        okuma kaydı yz_okuma'ya yazılır; satırlar ÖNERİ olarak döner (rapora yazılmaz — denetçi uygulayıp Kaydet'le yazar).
   Elle giriş her zaman açık: okuma yapılamazsa nedeni söylenir. */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { sirKullan } from "../../../server/ayar/sir.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { jpegTemizle, pngTemizle, turBul } from "../../../server/dosya/tur.ts";
import { yzAyi, yzAyMaliyeti, yzOkumaYaz } from "../../../server/yz/kullanim.ts";
import { maliyetHesapla, okumaIstegi, okumaYanitiCoz, type OkumaIstegi, type OkunanSatir, type YzModel } from "../../../server/yz/okuma.ts";
import type { BolumOf } from "../../../format/tanim.ts";
import { okunabilirOlcum, type Kisi, type RaporYazma } from "./raporlar.ts";

export const FOTO_OKU_EN_BUYUK = 5 << 20;
const ELLE = "Değerleri elle girebilirsiniz.";
const dolar = (n: number) => String(n).replace(".", ",");

export type FotoOkuHazirlik = { durum: "hazir"; istek: OkumaIstegi; anahtar: string; model: YzModel; bolum: BolumOf<"olcum">; ay: string } | RaporYazma;

export async function fotoOkuHazirla(db: Sorgulayici, kim: Kisi, raporId: string, bolumId: string, foto: { bayt: Uint8Array }, simdi = new Date()): Promise<FotoOkuHazirlik> {
  const o = await okunabilirOlcum(db, kim, raporId, bolumId);
  if ("durum" in o) return o;
  const yz = (await ayarOku(db, "yapay_zeka")).deger;
  if (!yz.acik) return { durum: "red", neden: `Fotoğraftan okuma firmada kapalı (Firma ayarları › Yapay zekâ). ${ELLE}` };
  const anahtar = await sirKullan(db, "yapay_zeka_anahtari");
  if (!anahtar) return { durum: "red", neden: `Yapay zekâ API anahtarı girilmedi (Firma ayarları › Yapay zekâ). ${ELLE}` };
  const ay = yzAyi(simdi);
  if (yz.sinir !== null && (await yzAyMaliyeti(db, kim.id, ay)) >= yz.sinir * 1e6) {
    return { durum: "red", neden: `Bu ay yapay zekâ sınırınız (${dolar(yz.sinir)} $) doldu; firma yöneticisi Firma ayarları › Yapay zekâ'dan artırabilir. ${ELLE}` };
  }
  const tur = turBul(foto.bayt, ["jpeg", "png"]);
  if (!tur || (tur !== "jpeg" && tur !== "png")) return { durum: "gecersiz", hatalar: { foto: "Yalnız JPEG ya da PNG fotoğraf." } };
  if (foto.bayt.length > FOTO_OKU_EN_BUYUK) return { durum: "gecersiz", hatalar: { foto: "Fotoğraf çok büyük (en çok 5 MB)." } };
  const temiz = tur === "jpeg" ? jpegTemizle(foto.bayt) : pngTemizle(foto.bayt);
  return { durum: "hazir", istek: okumaIstegi({ model: yz.model, bolum: o.bolum, resim: temiz, tur }), anahtar, model: yz.model, bolum: o.bolum, ay };
}

export type FotoOkuSonucu = { durum: "tamam"; satirlar: OkunanSatir[]; bildirim: string } | RaporYazma;

/** cevabı süzer, kullanımı ve okuma kaydını yazar. Rapor hâlâ yazanın Yeni raporu olmalı (okuma sürerken gönderildiyse öneri dönmez). */
export async function fotoOkuKaydet(db: Sorgulayici, kim: Kisi, raporId: string, h: { model: YzModel; bolum: BolumOf<"olcum">; ay: string }, govde: unknown): Promise<FotoOkuSonucu> {
  const o = await okunabilirOlcum(db, kim, raporId, h.bolum.id);
  if ("durum" in o) return o;
  const { satirlar, giris, cikis } = okumaYanitiCoz(govde, o.bolum);
  await yzOkumaYaz(db, { ay: h.ay, raporId, bolum: o.bolum.id, model: h.model, oneri: satirlar, giris, cikis, maliyet: maliyetHesapla(h.model, giris, cikis) });
  return {
    durum: "tamam", satirlar,
    bildirim: satirlar.length ? `${satirlar.length} satır okundu; önerileri gözden geçirip uygulayın.` : `Fotoğrafta bu tablonun satırı okunamadı. ${ELLE}`,
  };
}
