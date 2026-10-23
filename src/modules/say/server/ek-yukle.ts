/* S.A.Y'A EK YÜKLEME (2026-10-23 — S.A.Y baştan; reisim: "hiç bir kısıtı olmasın"): dosya tarayıcıdan parça parça gelir (barındırmanın istek boyu
   sınırı — sabitler.ts EK_PARCA_BAYT); son parçayla birleşir, türü içerikten bulunur (server/ek.ts), Anthropic Dosya API'sine yüklenir ve kişinin
   eki olarak kaydedilir (yz_ek). Dosyanın boyuna ve sayısına sınır yok. Kişi ve firma oturumdan; parçalar ve ek kişinin kendisinin (RLS). */
import { oturumIslemi, type IstekOturumu } from "../../../server/kimlik/istek.ts";
import { anthropicDosyaYukle } from "../../../server/yz/akis.ts";
import { ekKaydet, parcalariBirlestir, parcalariSil, parcaYaz, type EkTuru } from "../../../server/yz/konusma.ts";
import { sayEkiHazirla } from "./ek.ts";
import { sayKapisi } from "./say.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export interface EkParcasi { yukleme: string; sira: number; adet: number; ad: string; tablo: boolean }
export type EkYaniti = { durum: "parca" } | { durum: "tamam"; ek: { id: string; ad: string; tur: EkTuru; boyut: number } } | { durum: "red"; neden: string };

/** başlıklardan parçanın bilgisi (biçim denetimi) */
export function ekParcasiOku(b: { yukleme: string | null; sira: string | null; adet: string | null; ad: string | null; tablo: string | null }): EkParcasi | null {
  const sira = Number(b.sira), adet = Number(b.adet);
  if (!b.yukleme || !UUID.test(b.yukleme) || !Number.isInteger(sira) || !Number.isInteger(adet) || sira < 0 || adet < 1 || sira >= adet) return null;
  let ad = "";
  try { ad = decodeURIComponent(b.ad ?? ""); } catch { return null; }
  return { yukleme: b.yukleme, sira, adet, ad, tablo: b.tablo === "1" };
}

export async function sayEkParcasi(o: IstekOturumu, p: EkParcasi, veri: Uint8Array): Promise<EkYaniti> {
  if (!veri.length) return { durum: "red", neden: "Dosyanın parçası boş geldi; yeniden ekleyin." };
  await oturumIslemi(o, (db) => parcaYaz(db, p.yukleme, p.sira, veri));
  if (p.sira < p.adet - 1) return { durum: "parca" };
  const h = await oturumIslemi(o, async (db) => {
    const k = await sayKapisi(db);
    if (k.durum === "red") return k;
    const bayt = await parcalariBirlestir(db, p.yukleme, p.adet);
    return bayt ? { durum: "hazir" as const, bayt, anahtar: k.anahtar } : { durum: "red" as const, neden: "Dosyanın bir parçası eksik geldi; yeniden ekleyin." };
  });
  const sil = () => oturumIslemi(o, (db) => parcalariSil(db, p.yukleme));
  if (h.durum === "red") { await sil(); return h; }
  const e = sayEkiHazirla(h.bayt, p.ad, p.tablo);
  if ("durum" in e) { await sil(); return e; }
  const y = await anthropicDosyaYukle(e.bayt, e.dosyaAdi, e.mime, h.anahtar);
  if (y.durum === "hata") { await sil(); return { durum: "red", neden: y.neden }; }
  const id = await oturumIslemi(o, async (db) => {
    await parcalariSil(db, p.yukleme);
    return ekKaydet(db, { dosya: y.id, ad: e.ad, tur: e.tur, mime: e.mime, boyut: h.bayt.length });
  });
  return { durum: "tamam", ek: { id, ad: e.ad, tur: e.tur, boyut: h.bayt.length } };
}
