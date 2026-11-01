/* FOTOĞRAF ÖN OKUMA — sunucu (2026-10-31, L4; saf kısım ../on-okuma.ts). Ek yüklendikten SONRA arka planda (uç after ile) fotoğraf başına bir küçük çağrı:
   firmada S.A.Y açık, anahtar var, koşullar kabul edilmiş olmalı (sayKapisi); maliyet kişinin aylık sınırından küçük bir ayırmayla düşülür. Düşerse
   iş durmaz (ön okuma yoksa S.A.Y fotoğrafa kendisi bakar). Soru gönderilince döngü yeni eklerin ön okumasını kısa süre bekler (onOkumaBekle). */
import { hataKaydet } from "../../../server/hata/kaydet.ts";
import { oturumIslemi, type IstekOturumu } from "../../../server/kimlik/istek.ts";
import { ekOkumaYaz, fotoEkSayisi, onOkumaBekleyen } from "../../../server/yz/konusma.ts";
import { anthropicCagir } from "../../../server/yz/okuma.ts";
import { sayMaliyeti } from "../../../server/yz/say.ts";
import { ON_OKUMA_YANIT, onOkumaCoz, onOkumaIstegi } from "../on-okuma.ts";
import { cagriBirak, cagriKapat, kucukCagriAyir, sayKapisi } from "./say.ts";

export async function fotoOnOku(o: IstekOturumu, ek: string, bayt: Uint8Array, mime: string): Promise<void> {
  try {
    const h = await oturumIslemi(o, async (db) => {
      const k = await sayKapisi(db);
      if (k.durum === "red") return null;
      const a = await kucukCagriAyir(db, k.model, k.sinir, Math.ceil(bayt.length / 600) + 3_000, ON_OKUMA_YANIT);
      return a ? { k, a } : null;
    });
    if (!h) return;
    const y = await anthropicCagir(onOkumaIstegi(h.k.model, bayt, mime), h.k.anahtar, 45_000);
    if (y.durum === "hata") { await oturumIslemi(o, (db) => cagriBirak(db, h.a, y.ucret === "bilinmiyor")); return; }
    const c = onOkumaCoz(y.govde);
    await oturumIslemi(o, async (db) => {
      await cagriKapat(db, h.a, sayMaliyeti(h.k.model, c.usage).maliyet, 0);
      if (c.okuma) await ekOkumaYaz(db, ek, c.okuma);
    });
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
