/* S.A.Y CHAT RAPOR MODU — SAF (2026-11-09; reisim: "eskisi gibi direk rapor oluşturma modu olsun", sunum claude.ai HBwuL3s9G693uopxSzTbjH K1–K6 — "Evet, önerilerle"). Ekran ve sunucu
   aynı şemayı kullanır. Bir kayıt = bir ekipman.
   · K1: mesajın satırları formatın ekipman bilgilerinden, kendiliğinden + Not; tür başına ayar yok. n. satır = n. bilgi; "-" ya da boş = bilinmiyor; fazla satır nota.
   · Plandaki bütün ekipman listede (reisim 2026-10-14: "plandan seç diyince plandaki ekipmanlar gözükmüyor"): seçilemeyen nedeniyle görünür.
   Kilit tests/say-rapor-modu.test.ts, olumsuz kanıt tests/bozan/say-rapor-modu.bozan.ts. */
import { KontrolCihazGirdisi } from "../raporlar/sema.ts";
import { z } from "zod";
import { ekipmanBolumuMu } from "../../format/duzen.ts";
import { EKIPMAN_ALAN_ADI, type EkipmanAlani, type FormatTanimi } from "../../format/tanim.ts";
import { kimlik } from "../../sema/ortak.ts";

export const SATIR_EN_COK = 30;
export const SATIR_AD_EN_COK = 60;
export const MESAJ_EN_COK = 60;
export const MESAJ_SATIR_EN_COK = 200;
export const KAYIT_FOTO_EN_COK = 12;
/** kuyruktaki fotoğraf (cihazda küçültülmüş; base64 ≈ 2,7 MB — /api/islem gövde sınırı 3 MB) */
export const KAYIT_FOTO_VERI = 2_900_000;
const ALAN = /^(e:[a-z]+|[ad]:[\w-]{1,80}|yorum)$/;

export interface RaporSatiri { ad: string; alan: string }
const HAZIR: readonly EkipmanAlani[] = ["marka", "model", "seri", "imal", "konum"];
const kisalt = (ad: string) => (ad.length > SATIR_AD_EN_COK ? `${ad.slice(0, SATIR_AD_EN_COK - 1).trimEnd()}…` : ad);

/** K1: formatın ekipman bilgileri (sırasıyla; bölüm yoksa marka, model, seri, imal, konum) + Not */
export function raporSatirlari(t: FormatTanimi | null): RaporSatiri[] {
  const l: RaporSatiri[] = [], tam = t?.bolumler.find(ekipmanBolumuMu);
  for (const a of tam?.alanlar ?? []) {
    if (l.length >= SATIR_EN_COK - 1) break;
    if (a.ekipman) l.push({ ad: kisalt(a.ad), alan: `e:${a.ekipman}` });
    else if (!a.kaynak && !a.formul && a.tur !== "coklu") l.push({ ad: kisalt(a.ad), alan: `a:${a.id}` });
  }
  if (!l.length) for (const e of HAZIR) l.push({ ad: EKIPMAN_ALAN_ADI[e], alan: `e:${e}` });
  l.push({ ad: "Not", alan: "yorum" });
  return l;
}

const bilinmiyor = (x: string) => !x || /^[-–—]+$/.test(x);
const temiz = (x: string) => x.replace(/\s+/g, " ").trim();
/** mesaj → alan değerleri: n. satır n. bilgi; bilinmeyen yazılmaz; fazla satırlar nota */
export function dagit(satirlar: readonly RaporSatiri[], mesaj: readonly string[]): { satirlar: { ad: string; alan: string; deger: string }[]; degerler: Record<string, string> } {
  const degerler: Record<string, string> = {};
  const l = satirlar.map((s, i) => {
    const h = temiz(mesaj[i] ?? ""), yok = bilinmiyor(h);
    if (!yok) degerler[s.alan] = h;
    return { ad: s.ad, alan: s.alan, deger: yok ? "" : h };
  });
  const fazla = mesaj.slice(satirlar.length).map(temiz).filter((x) => !bilinmiyor(x));
  if (fazla.length) degerler.yorum = [degerler.yorum, ...fazla].filter(Boolean).join("\n");
  return { satirlar: l, degerler };
}

export const RaporKaydiGirdisi = z.object({
  plan: kimlik,
  ekipman: z.discriminatedUnion("tip", [z.object({ tip: z.literal("plan"), id: kimlik }), z.object({ tip: z.literal("yeni"), tur: kimlik })]),
  satirlar: z.array(z.object({ ad: z.string().min(1).max(SATIR_AD_EN_COK), alan: z.string().regex(ALAN) })).min(1).max(SATIR_EN_COK),
  mesaj: z.array(z.string().max(MESAJ_SATIR_EN_COK)).max(MESAJ_EN_COK),
  /* 2026-11-12 (göç 0132; pkproje.md §11 K11): TÜRKAK'lı firmada kaydın ölçtüğü kontrol — ilk fotoğrafın anı (başlangıç), Gönder'in anı (bitiş), ikisi
     de cihaz saati (ms) + ilk fotoğraftan önceki son saat ölçümü (çapa); sunucu sunucu saatine çevirir (raporlar/cihaz-saati.ts) */
  kontrol: z.object({ bas: KontrolCihazGirdisi.shape.an, bit: KontrolCihazGirdisi.shape.an, capa: KontrolCihazGirdisi.shape.capa }).optional(),
});
export type RaporKaydiGirdisi = z.input<typeof RaporKaydiGirdisi>;
export const FOTO_ROLLERI = ["ekipman", "etiket"] as const;
export type FotoRolu = (typeof FOTO_ROLLERI)[number];
/* cekim (K5): fotoğrafın çekim anı — cihaz küçültmeden önce okur; biçimi sunucuda denetlenir (raporlar/foto-kanit.ts), uymayan yok sayılır */
export const RaporFotoGirdisi = z.object({ plan: kimlik, rol: z.enum(FOTO_ROLLERI), ad: z.string().min(1).max(200), veri: z.string().min(1).max(KAYIT_FOTO_VERI), cekim: z.unknown().optional() });
export type RaporFotoGirdisi = z.input<typeof RaporFotoGirdisi>;

export type EkipmanDurumu = "uygun" | "rapor" | "kapali";
export interface RaporEkipmani { id: string; kod: string; turId: string; konum: string | null; durum: EkipmanDurumu; neden: string | null }
/** ekipman seçilebilir mi: pasif, formatsız, başkasının ya da onaya gitmiş raporu olan seçilmez; kişinin kendi Yeni raporu varsa kayıt o raporun boş alanlarına girer */
export function ekipmanDurumu(e: { id: string; pasif: boolean }, raporlar: readonly { ekipmanId: string; durum: string; benimTaslak: boolean }[], formatli: boolean): { durum: EkipmanDurumu; neden: string | null } {
  if (e.pasif) return { durum: "kapali", neden: "Pasif" };
  if (!formatli) return { durum: "kapali", neden: "Rapor formatı yok" };
  const r = raporlar.find((x) => x.ekipmanId === e.id);
  if (r?.benimTaslak) return { durum: "rapor", neden: "Raporunuz var" };
  if (r) return { durum: "kapali", neden: r.durum === "taslak" ? "Başka birinin raporu var" : "Raporu yazılmış" };
  return { durum: "uygun", neden: null };
}

export interface RaporFoto { dosya: string; ad: string; rol: FotoRolu; cekim?: string | null }
export interface RaporKaydi {
  /** cihazın ürettiği kimlik (ekran ve kuyruk bununla) */
  id: string; zaman: string; ekipmanId: string | null; turId: string | null; satirlar: RaporSatiri[]; mesaj: string[]; fotolar: RaporFoto[];
  rapor: { id: string; no: string } | null;
}
export interface RaporModuVerisi {
  plan: { id: string; no: string };
  kayitlar: RaporKaydi[];
  ekipmanlar: RaporEkipmani[];
  turler: Record<string, { ad: string; satirlar: RaporSatiri[] }>;
  /** "Yeni ekle" türleri (formatı yayında) */
  yeniTurler: string[];
  /** 0132 (K11): firma TÜRKAK'lı — kaydın ilk fotoğrafı kontrolün başlangıcı, Gönder bitişi (eski önbellekte yok) */
  olcumlu?: boolean;
}
