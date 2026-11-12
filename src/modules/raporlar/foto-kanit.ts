/* FOTOĞRAFIN KANITI (2026-11-12; pkproje.md §11 K5 — reisim: "yazılan süre ile ekipman başında geçirilen süre uymalı log kayıtları düzgün olmalı"):
   rapora eklenen fotoğrafla birlikte saklanan üç bilgi — (1) eklendiği an (sunucu saati), (2) çekildiği an (fotoğrafın kendi saati: sunucunun
   dosyadan okuduğu EXIF, yoksa cihazın küçültmeden ÖNCE okuduğu; HER firmada), (3) konum (YALNIZ ölçümlü — TÜRKAK'lı firmada açılmış — raporda ve
   kişi telefonda izin verdiyse; izin vermediyse / alınamadıysa null: "konum yok" da kayıttır). Hiçbiri belgeye basılmaz. Saf: ekran ve sunucu aynı
   şemayı kullanır. Konum 5 ondalığa (≈ 1 m) yuvarlanır. */
import { z } from "../../sema/ortak.ts";

const CEKIM = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const KonumGirdisi = z.object({ e: z.number().min(-90).max(90), b: z.number().min(-180).max(180), d: z.number().min(0).max(100_000).nullable().optional() });
/** cihazdan gelen (güvenilmez) kanıt: uymayan parça yok sayılır — fotoğrafın eklenmesini durdurmaz */
export const FotoKanitGirdisi = z.object({ cekim: z.string().regex(CEKIM).nullable().optional(), konum: KonumGirdisi.nullable().optional() });

export interface FotoKonumu { e: number; b: number; d: number | null }
export interface FotoKaniti { eklendi: string; cekim: string | null; konum?: FotoKonumu | null }

const yuvarla = (n: number) => Math.round(n * 1e5) / 1e5;
const parca = <T,>(sema: z.ZodType<T>, v: unknown): T | null => { const r = sema.safeParse(v); return r.success ? r.data : null; };

/** `exif`: sunucunun dosyadan okuduğu çekim anı (yoksa null); `girdi`: cihazın gönderdiği; `olcumlu`: rapor ölçümlü mü */
export function fotoKaniti(exif: string | null, girdi: unknown, olcumlu: boolean, simdi: Date): FotoKaniti {
  const g = girdi && typeof girdi === "object" ? girdi as { cekim?: unknown; konum?: unknown } : {};
  const cekim = exif && CEKIM.test(exif) ? exif : parca(z.string().regex(CEKIM), g.cekim);
  const kanit: FotoKaniti = { eklendi: simdi.toISOString(), cekim };
  if (!olcumlu) return kanit;
  const k = parca(KonumGirdisi, g.konum);
  kanit.konum = k ? { e: yuvarla(k.e), b: yuvarla(k.b), d: k.d == null ? null : Math.round(k.d) } : null;
  return kanit;
}
