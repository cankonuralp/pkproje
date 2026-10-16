/* ══ SUPABASE YÖNETİM API İSTEMCİSİ (FIRMA-VT §5.5, §7.4; FV8 — 2026-10-16) ═══════════════════════════════════════════════════════════════════
   Yalnız SORGU ucu: POST /v1/projects/{proje}/database/query (Supabase belgesi "Run sql query" — başarı 201, oran sınırı 429). Göç dağıtıcının
   "uygula" kipi bununla göçleri her projeye uygular (yonetimApiYurutucu); kurulum makinesi (FV10) aynı istemciyi kullanacak.
   · Anahtar PROBATA_SUPABASE_YONETIM_ANAHTARI ("probata otomasyon" kullanıcısının klasik PAT'i — FIRMA-VT §7.4, §8 açık soru 2): yalnız Vercel
     ortamında; koda, veritabanına, iletiye, günlüğe yazılmaz. Ortam adları YALNIZ src/server/dis/** ve scripts/ içinde (kilit
     tests/yonetim-anahtari.test.ts); bu dosyayı yalnız göç dağıtıcı içe aktarır (uygulamanın istek yolu ve tarayıcı zinciri değil).
   · Uç https://api.supabase.com. PROBATA_SUPABASE_YONETIM_UC YALNIZ yerel adres (http://127.0.0.1:<kapı> / http://localhost:<kapı>) — test taklidi
     (tests/yardimci/sahte-supabase-yonetim.ts); başka değer HATA: anahtar başka sunucuya gitmez. Yönlendirme izlenmez.
   · Proje kimliği: Supabase ref (20 küçük harf / rakam). "yerel-…" (yerel-merkez, yerel-<firma kimliği>) YALNIZ yerel uçla — ref'siz yerel
     veritabanları (test) taklitte böyle adlanır; yayında hiç kabul edilmez.
   · 429: Retry-After kadar (yoksa 2, 4, 8 sn) bekler, en çok 3 kez; toplam bekleme 30 sn'yi aşmaz — sonra hata. Başka hata yeniden denenmez (göç
     yan etkili; yarım kalan iş sunucuda geri alınır — BEGIN … COMMIT tek istekte).
   · Hata iletisi SIRSIZ: yalnız durum kodu + (varsa) SQLSTATE; sunucunun iletisi (tablo adı, değer taşıyabilir) yazılmaz. Her istek 60 sn sınırlı. */
import { AD_KALIBI, type GocDosyasi, type GocYurutucu } from "../db/goc.ts";

export interface YonetimAyari {
  /** API kökü (sonunda / yok) */
  uc: string;
  anahtar: string;
  /** uç yerel mi (test taklidi) — "yerel-…" proje adları yalnız o zaman */
  yerel: boolean;
}

const VARSAYILAN_UC = "https://api.supabase.com";
const YEREL_UC = /^http:\/\/(127\.0\.0\.1|localhost):\d{2,5}$/;
const REF = /^[a-z0-9]{20}$/;
const YEREL_PROJE = /^yerel-(merkez|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
const OZET = /^[0-9a-f]{64}$/;
export const YONETIM = { istekMs: 60_000, enCok429: 3, toplamBekleMs: 30_000 } as const;

/** ortamdan ayar: anahtar yoksa / biçimsizse, uç yerel değilse HATA (iletide değer yok) */
export function yonetimAyari(e: Record<string, string | undefined>): YonetimAyari {
  const anahtar = e.PROBATA_SUPABASE_YONETIM_ANAHTARI ?? "";
  if (!anahtar) throw new Error("Supabase yönetim anahtarı yok (PROBATA_SUPABASE_YONETIM_ANAHTARI).");
  if (anahtar.length < 20 || anahtar.length > 200 || /\s/.test(anahtar)) throw new Error("Supabase yönetim anahtarı biçimsiz (PROBATA_SUPABASE_YONETIM_ANAHTARI).");
  const ucOrtam = (e.PROBATA_SUPABASE_YONETIM_UC ?? "").replace(/\/+$/, "");
  if (ucOrtam && !YEREL_UC.test(ucOrtam)) throw new Error("PROBATA_SUPABASE_YONETIM_UC yalnız yerel adres olabilir (test taklidi).");
  return { uc: ucOrtam || VARSAYILAN_UC, anahtar, yerel: !!ucOrtam };
}

/** proje adı geçerli mi: ref; "yerel-…" yalnız yerel uçla */
export const projeGecerli = (proje: string, yerel: boolean): boolean => REF.test(proje) || (yerel && YEREL_PROJE.test(proje));

/** API hatası — iletide yalnız durum ve SQLSTATE (sır, sunucu iletisi yok) */
export class YonetimHatasi extends Error {
  readonly durum: number;
  readonly kod: string | null;
  constructor(durum: number, kod: string | null) {
    super(`Supabase yönetim API'si reddetti (${durum}${kod ? `, ${kod}` : ""})`);
    this.name = "YonetimHatasi";
    this.durum = durum;
    this.kod = kod;
  }
}
/** sunucunun hata gövdesinden SQLSTATE (ör. "Failed to run sql query: ERROR:  42P07: …"); yoksa null */
export function sqlDurumu(govde: string): string | null {
  return /ERROR:\s+([0-9A-Z]{5}):/.exec(govde)?.[1] ?? null;
}
/** Retry-After (saniye ya da HTTP tarihi) → ms; yoksa / okunmazsa null */
export function bekleSuresi(baslik: string | null, simdi = Date.now()): number | null {
  if (!baslik) return null;
  if (/^\d+$/.test(baslik.trim())) return Number(baslik.trim()) * 1000;
  const t = Date.parse(baslik);
  return Number.isNaN(t) ? null : Math.max(0, t - simdi);
}

export interface SupabaseYonetimi {
  /** projede SQL koşar; son ifadenin satırları */
  sorgu<T = Record<string, unknown>>(proje: string, sql: string): Promise<T[]>;
}

export function supabaseYonetimi(a: YonetimAyari, s: { bekle?: (ms: number) => Promise<void> } = {}): SupabaseYonetimi {
  const bekle = s.bekle ?? ((ms: number) => new Promise<void>((coz) => setTimeout(coz, ms)));
  return {
    async sorgu<T>(proje: string, sql: string): Promise<T[]> {
      if (!projeGecerli(proje, a.yerel)) throw new Error("Geçersiz proje kimliği.");
      let beklenen = 0;
      for (let deneme = 0; ; deneme++) {
        const y = await fetch(`${a.uc}/v1/projects/${proje}/database/query`, {
          method: "POST", redirect: "error", signal: AbortSignal.timeout(YONETIM.istekMs),
          headers: { Authorization: `Bearer ${a.anahtar}`, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query: sql }),
        });
        const govde = await y.text();
        if (y.ok) {
          if (!govde) return [];
          const j = JSON.parse(govde) as unknown;
          return Array.isArray(j) ? (j as T[]) : [];
        }
        if (y.status === 429 && deneme < YONETIM.enCok429) {
          const ms = bekleSuresi(y.headers.get("retry-after")) ?? 2000 * 2 ** deneme;
          if (beklenen + ms <= YONETIM.toplamBekleMs) { beklenen += ms; await bekle(ms); continue; }
        }
        throw new YonetimHatasi(y.status, sqlDurumu(govde));
      }
    },
  };
}

/** Yönetim API'siyle göç yürütücüsü (src/server/db/goc.ts GocYurutucu): göç başına TEK istek — BEGIN; SET LOCAL ROLE postgres (0000'in varsayılan
    hakları koşan rolün; FIRMA-VT §5.4); goc tablosu; göç; kaydı; COMMIT. Ad kalıptan, özet onaltılık olduğu için metne güvenle gömülür (yine
    denetlenir). Düşerse işlem sunucuda geri alınır, hata yukarı. */
export function yonetimApiYurutucu(y: SupabaseYonetimi, proje: string): GocYurutucu {
  return {
    async kayitli() {
      const v = await y.sorgu<{ var: boolean }>(proje, "SELECT to_regclass('public.goc') IS NOT NULL AS var");
      if (!v[0]?.var) return new Map();
      return new Map((await y.sorgu<{ ad: string; ozet: string }>(proje, "SELECT ad, ozet FROM public.goc")).map((r) => [r.ad, r.ozet]));
    },
    async uygula(goc: GocDosyasi) {
      if (!AD_KALIBI.test(goc.ad) || !OZET.test(goc.ozet)) throw new Error("Göç adı ya da özeti biçimsiz.");
      await y.sorgu(proje, [
        "BEGIN;",
        "SET LOCAL ROLE postgres;",
        "CREATE TABLE IF NOT EXISTS public.goc (ad text PRIMARY KEY, ozet text NOT NULL, uygulandi timestamptz NOT NULL DEFAULT now());",
        goc.metin,
        ";",
        `INSERT INTO public.goc (ad, ozet) VALUES ('${goc.ad}', '${goc.ozet}');`,
        "COMMIT;",
      ].join("\n"));
    },
  };
}
