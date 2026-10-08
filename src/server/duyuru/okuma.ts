/* DUYURU OKUMA (379; KOD-GECIS K5, ARKA-UC §7 "İSGGM duyuruları okuma — günde birkaç kez") — Bakanlığın üç sayfası okunur, ayrıştırılır
   (ayristir.ts), veritabanına yazılır (duyuru_yaz). Tetik: Ana sayfa açılınca son deneme TAZELIK'ten eskiyse yanıttan SONRA arka planda (sonra.ts)
   — kimse bakmazsa hiç istek gitmez. Aynı anda iki okuma yok (is_basla). Bir kaynak okunamazsa (ağ, zaman aşımı, sayfa yapısı değişti → 0
   duyuru) ötekiler yine yazılır, iş "hata" ile biter → Ana sayfa hangi kaynağın alınamadığını söyler, son alınan liste durur (sessiz kalmaz;
   390: okunamayan kaynakların kodu iş kaydına, ağ hatasının nedeni günlüğe).
   İstek: 10 sn, en çok 3 MB, yalnız Bakanlığın sabit adresleri; yönlendirme izlenmez (adres değişirse okunamaz → görünür). PROBATA_DUYURU_UC yalnız uçtan uca testte
   yerel taklide çevirir; kaydedilen bağlantı yine Bakanlığın asıl adresi. */
import { duyuruDurumu, duyuruListesi, duyuruYaz, type DuyuruDurumu, type DuyuruKaynagi, type DuyuruSatiri } from "../db/duyuru.ts";
import { isBasla, isBitir } from "../db/is.ts";
import type { Havuz, Sorgulayici } from "../db/kiraci.ts";
import { csgbAyristir, isekipmanAyristir, type OkunanDuyuru } from "./ayristir.ts";

export interface DuyuruKaynakTanimi { kaynak: DuyuruKaynagi; ad: string; adres: string; ayristir: (html: string, bugun: Date) => OkunanDuyuru[] }

export const DUYURU_KAYNAKLARI: readonly DuyuruKaynakTanimi[] = [
  { kaynak: "isggm", ad: "İSGGM", adres: "https://www.csgb.gov.tr/isggm/duyurular/", ayristir: (h, b) => csgbAyristir(h, "isggm", b) },
  { kaynak: "isgum", ad: "İSGÜM", adres: "https://www.csgb.gov.tr/isgum/duyurular/", ayristir: (h, b) => csgbAyristir(h, "isgum", b) },
  { kaynak: "isekipman", ad: "İş ekipmanları", adres: "https://isekipmanlari.csgb.gov.tr/sayfa.aspx?d=3", ayristir: isekipmanAyristir },
];
/** son denemeden bu kadar sonra Ana sayfa yeniden okutur (günde birkaç kez) */
export const TAZELIK = 6 * 3_600_000;
/** Ana sayfada kaynak başına en yeni */
export const KAYNAK_BASINA = 2;
const SINIR = 3 * 1024 * 1024;

async function sayfaOku(adres: string, uc: string | undefined): Promise<string> {
  const a = new URL(adres);
  const hedef = uc ? `${uc.replace(/\/+$/, "")}${a.pathname}${a.search}` : adres;
  const y = await fetch(hedef, { signal: AbortSignal.timeout(10_000), redirect: "error", headers: { accept: "text/html", "user-agent": "probata-duyuru/1" }, cache: "no-store" });
  if (!y.ok) throw new Error(`HTTP ${y.status}`);
  if (Number(y.headers.get("content-length") ?? 0) > SINIR) throw new Error("sayfa çok büyük");
  const bayt = new Uint8Array(await y.arrayBuffer());
  if (bayt.length > SINIR) throw new Error("sayfa çok büyük");
  return new TextDecoder("utf-8").decode(bayt);
}

/** günlüğe: iletinin yanında ağ hatasının kodu (fetch yalnız "fetch failed" der; asıl neden cause'ta — 390: canlıda portal bağlantısı 10 sn'de
    düşüyordu, günlükte nedeni görünmüyordu) */
export function hataNedeni(h: unknown): string {
  const e = h as { message?: unknown; cause?: { code?: unknown; message?: unknown } };
  const ileti = typeof e?.message === "string" ? e.message : String(h);
  const kod = typeof e?.cause?.code === "string" ? e.cause.code : typeof e?.cause?.message === "string" ? e.cause.message : "";
  return kod && kod !== ileti ? `${ileti} (${kod})` : ileti;
}

export interface DuyuruOkumaOzeti { durum: "tamam" | "hata" | "zaten_calisiyor"; okunan_kaynak: number; hatali_kaynak: number; yeni: number }

export async function duyurulariOku(havuz: Havuz, uc = process.env.PROBATA_DUYURU_UC, bugun = new Date()): Promise<DuyuruOkumaOzeti> {
  const o = { okunan_kaynak: 0, hatali_kaynak: 0, yeni: 0 };
  /* 390: okunamayan kaynakların kodu iş kaydına (Ana sayfa hangisinin alınamadığını söyler — 0074 duyuru_durumu) */
  const hatali: DuyuruKaynagi[] = [];
  const id = await isBasla(havuz, "duyuru_okuma");
  if (!id) return { durum: "zaten_calisiyor", ...o };
  for (const k of DUYURU_KAYNAKLARI) {
    try {
      const liste = k.ayristir(await sayfaOku(k.adres, uc), bugun);
      if (!liste.length) throw new Error("duyuru bulunamadı (sayfa yapısı değişmiş olabilir)");
      o.yeni += await duyuruYaz(havuz, k.kaynak, liste);
      o.okunan_kaynak++;
    } catch (h) {
      o.hatali_kaynak++;
      hatali.push(k.kaynak);
      console.error(`[duyuru] ${k.kaynak} okunamadı:`, hataNedeni(h));
    }
  }
  const durum = o.hatali_kaynak ? "hata" : "tamam";
  await isBitir(havuz, id, durum, { ...o, hatali });
  return { durum, ...o };
}

/** hatali: son okumada alınamayan kaynaklar (390) */
export interface DuyuruBolumu { liste: DuyuruSatiri[]; guncellendi: string | null; hata: boolean; hatali: DuyuruKaynagi[]; tazele: boolean }

/** Ana sayfanın duyuru bölümü; `tazele`: son deneme yoksa ya da TAZELIK'ten eskiyse (sayfa okumayı arka planda başlatır) */
export async function duyuruBolumu(db: Sorgulayici, simdi = Date.now()): Promise<DuyuruBolumu> {
  const liste = await duyuruListesi(db, KAYNAK_BASINA);
  const d: DuyuruDurumu = await duyuruDurumu(db);
  return { liste, guncellendi: d.guncellendi, hata: d.hata, hatali: d.hatali, tazele: !d.son || simdi - Date.parse(d.son) > TAZELIK };
}
