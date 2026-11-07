/* FOTOĞRAF ÖN OKUMA — sunucu (2026-10-31, L4; saf kısım ../on-okuma.ts). Ek yüklendikten SONRA arka planda (uç after ile) fotoğraf başına bir küçük çağrı:
   firmada S.A.Y açık, anahtar var, koşullar kabul edilmiş olmalı (sayKapisi); maliyet kişinin aylık sınırından küçük bir ayırmayla düşülür. Düşerse
   iş durmaz (ön okuma yoksa S.A.Y fotoğrafa kendisi bakar). Soru gönderilince döngü yeni eklerin ön okumasını kısa süre bekler (onOkumaBekle). */
import { hataKaydet } from "../../../server/hata/kaydet.ts";
import { oturumIslemi, type IstekOturumu } from "../../../server/kimlik/istek.ts";
import { ekOkumaYaz, fotoEkSayisi, onOkumaBekleyen } from "../../../server/yz/konusma.ts";
import { onOkumaYap } from "./on-okuma-cagri.ts";

export async function fotoOnOku(o: IstekOturumu, ek: string, bayt: Uint8Array, mime: string): Promise<void> {
  try {
    const okuma = await onOkumaYap((is) => oturumIslemi(o, is), bayt, mime);
    if (okuma) await oturumIslemi(o, (db) => ekOkumaYaz(db, ek, okuma));
  } catch (e) {
    void hataKaydet({ kaynak: "sunucu", mesaj: e instanceof Error ? e.message : String(e), yigin: e instanceof Error ? e.stack ?? null : null, yer: "say.on_okuma",
      alan: o.kiraci.kisaAd, hesap: o.id });
  }
}

/** bekleme: taban + fotoğraf başına; en çok (2026-11-01 büyük iş şeması: 60 fotoğrafta ön okuma yükleme sırasında paralel sürer, çoğu bitmiş olur) */
export const ON_OKUMA_BEKLEME = 25_000, ON_OKUMA_FOTO_BASINA = 1_000, ON_OKUMA_BEKLEME_EN_COK = 90_000;
/** sorunun eklerinden ön okuması süren (son 5 dakikada eklenmiş) fotoğraflar bitene ya da süre dolana kadar bekler; balona "Fotoğraflar okunuyor n / N" */
export async function onOkumaBekle(o: IstekOturumu, ekler: readonly string[], yaz?: (x: { t: "asama"; ad: string }) => void): Promise<void> {
  const toplam = await oturumIslemi(o, (db) => fotoEkSayisi(db, ekler));
  if (!toplam) return;
  const son = Date.now() + Math.min(ON_OKUMA_BEKLEME_EN_COK, ON_OKUMA_BEKLEME + ON_OKUMA_FOTO_BASINA * toplam);
  while (Date.now() < son) {
    const bekleyen = await oturumIslemi(o, (db) => onOkumaBekleyen(db, ekler));
    if (!bekleyen) return;
    yaz?.({ t: "asama", ad: `Fotoğraflar okunuyor ${toplam - bekleyen} / ${toplam}` });
    await new Promise((r) => setTimeout(r, 1_000));
  }
}
