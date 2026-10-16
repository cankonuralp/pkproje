/* ══ SUPABASE YÖNETİM API İSTEMCİSİ (FIRMA-VT §5.5, §7.4; FV8 — 2026-10-16) ═══════════════════════════════════════════════════════════════════
   Uçlar (Supabase belgesi "Management API Reference"): sorgu POST /v1/projects/{proje}/database/query (201); FV10 (2026-10-16) kurulum için proje listesi
   GET /v1/projects, proje aç POST /v1/projects (201), sağlık GET /v1/projects/{proje}/health?services=…, SSL zorlaması PUT …/ssl-enforcement, havuzcu
   GET …/config/database/pooler, gizli anahtar GET / POST …/api-keys?reveal=true, proje sil DELETE /v1/projects/{proje}. Belgeler gövde biçimini
   vermiyor: her yanıt BİÇİMİYLE denetlenir, tutmazsa BicimHatasi (kapalı yön; FV12'de gerçek hesapla ölçülür). Göç dağıtıcının "uygula" kipi ve
   kurulum makinesi (src/modules/yonetim/server/kurulum.ts) bu istemciyi kullanır.
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

/** FV10: kurulumun ortamı — yönetim ayarı + örgüt (PROBATA_SUPABASE_ORGUT); yerel taklitte projelerin Storage adresi (PROBATA_SUPABASE_DEPO_UC —
    YALNIZ yerel uçla ve yerel adres). Anahtar ya da örgüt yoksa null: "kendi proje" seçeneği kapalı (açıklamalı). */
export function kurulumAyari(e: Record<string, string | undefined>): { yonetim: YonetimAyari; orgut: string; depoUc: string | null } | null {
  let yonetim: YonetimAyari;
  try { yonetim = yonetimAyari(e); } catch { return null; }
  const orgut = e.PROBATA_SUPABASE_ORGUT ?? "";
  if (!/^[A-Za-z0-9_-]{3,60}$/.test(orgut)) return null;
  const depo = (e.PROBATA_SUPABASE_DEPO_UC ?? "").replace(/\/+$/, "");
  if (depo && (!yonetim.yerel || !YEREL_UC.test(depo))) throw new Error("PROBATA_SUPABASE_DEPO_UC yalnız yerel taklitte ve yerel adres olabilir.");
  return { yonetim, orgut, depoUc: depo || null };
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

/** yanıtın biçimi beklenen gibi değil (alan eksik / türü yanlış) — kapalı yön: kurulum adımı düşer, değer kullanılmaz */
export class BicimHatasi extends Error {
  constructor(ne: string) { super(`Supabase yönetim API'sinin yanıtı beklenen biçimde değil (${ne})`); this.name = "BicimHatasi"; }
}

export interface ProjeOzeti { id: string; ad: string; durum: string }
export interface SaglikDurumu { ad: string; durum: string }
export interface HavuzcuAyari { sunucu: string; kapi: number; vt: string; kip: string }

export interface SupabaseYonetimi {
  /** projede SQL koşar; son ifadenin satırları */
  sorgu<T = Record<string, unknown>>(proje: string, sql: string): Promise<T[]>;
  /** FV10: bu anahtarın gördüğü projeler (ad ile tekrar açmaya karşı aranır) */
  projeler(): Promise<ProjeOzeti[]>;
  /** FV10: örgütte AB (eu-central-1) projesi aç — veritabanı sahip parolası bir kez verilir */
  projeAc(g: { ad: string; orgut: string; sahipParolasi: string }): Promise<ProjeOzeti>;
  /** FV10: servislerin sağlığı (db, pooler, storage) */
  saglik(proje: string, servisler: readonly string[]): Promise<SaglikDurumu[]>;
  /** FV10: veritabanına yalnız TLS ile bağlanılsın */
  sslZorla(proje: string): Promise<void>;
  /** FV10: havuzcu (Supavisor) ayarları */
  havuzcu(proje: string): Promise<HavuzcuAyari[]>;
  /** FV10: adıyla gizli (secret) API anahtarı — yoksa açılır; düz anahtar yalnız bu yanıtta */
  gizliAnahtar(proje: string, ad: string): Promise<string>;
  /** FV10: projeyi kaldır (yalnız hiç etkin olmamış kurulum — "Projeyi kaldır ve yeniden dene") */
  projeSil(proje: string): Promise<void>;
}

const metinMi = (x: unknown): x is string => typeof x === "string" && x.length > 0;
const nesneler = (j: unknown, ne: string): Record<string, unknown>[] => {
  if (!Array.isArray(j) || !j.every((x) => x !== null && typeof x === "object" && !Array.isArray(x))) throw new BicimHatasi(ne);
  return j as Record<string, unknown>[];
};
const projeOku = (o: Record<string, unknown>, ne: string): ProjeOzeti => {
  const id = o.id ?? o.ref;
  if (!metinMi(id) || !metinMi(o.name)) throw new BicimHatasi(ne);
  return { id, ad: o.name, durum: metinMi(o.status) ? o.status : "" };
};

export function supabaseYonetimi(a: YonetimAyari, s: { bekle?: (ms: number) => Promise<void> } = {}): SupabaseYonetimi {
  const bekle = s.bekle ?? ((ms: number) => new Promise<void>((coz) => setTimeout(coz, ms)));
  const proje = (p: string) => { if (!projeGecerli(p, a.yerel)) throw new Error("Geçersiz proje kimliği."); return p; };
  /** ortak istek: Bearer anahtar, yönlendirme yok, süre sınırı, 429 beklemesi; başarıda çözülmüş JSON (boş gövde null) */
  async function istek(yontem: string, yol: string, govdeVeri?: unknown): Promise<unknown> {
    let beklenen = 0;
    for (let deneme = 0; ; deneme++) {
      const y = await fetch(`${a.uc}${yol}`, {
        method: yontem, redirect: "error", signal: AbortSignal.timeout(YONETIM.istekMs),
        headers: { Authorization: `Bearer ${a.anahtar}`, Accept: "application/json", ...(govdeVeri === undefined ? {} : { "Content-Type": "application/json" }) },
        ...(govdeVeri === undefined ? {} : { body: JSON.stringify(govdeVeri) }),
      });
      const govde = await y.text();
      if (y.ok) {
        if (!govde) return null;
        try { return JSON.parse(govde) as unknown; } catch { throw new BicimHatasi("JSON değil"); }
      }
      if (y.status === 429 && deneme < YONETIM.enCok429) {
        const ms = bekleSuresi(y.headers.get("retry-after")) ?? 2000 * 2 ** deneme;
        if (beklenen + ms <= YONETIM.toplamBekleMs) { beklenen += ms; await bekle(ms); continue; }
      }
      throw new YonetimHatasi(y.status, sqlDurumu(govde));
    }
  }
  return {
    async sorgu<T>(p: string, sql: string): Promise<T[]> {
      const j = await istek("POST", `/v1/projects/${proje(p)}/database/query`, { query: sql });
      return Array.isArray(j) ? (j as T[]) : [];
    },
    async projeler() {
      return nesneler(await istek("GET", "/v1/projects"), "proje listesi").map((o) => projeOku(o, "proje"));
    },
    async projeAc(g) {
      if (!/^[a-z0-9-]{3,60}$/.test(g.ad) || !/^[A-Za-z0-9_-]{3,60}$/.test(g.orgut) || g.sahipParolasi.length < 24) throw new Error("Proje açma girdisi geçersiz.");
      const j = await istek("POST", "/v1/projects", {
        name: g.ad, organization_slug: g.orgut, db_pass: g.sahipParolasi,
        region_selection: { type: "specific", code: "eu-central-1" }, desired_instance_size: "micro",
      });
      if (j === null || typeof j !== "object" || Array.isArray(j)) throw new BicimHatasi("açılan proje");
      const pr = projeOku(j as Record<string, unknown>, "açılan proje");
      proje(pr.id);
      return pr;
    },
    async saglik(p, servisler) {
      if (!servisler.length || !servisler.every((x) => /^[a-z_]{2,20}$/.test(x))) throw new Error("Geçersiz servis listesi.");
      return nesneler(await istek("GET", `/v1/projects/${proje(p)}/health?services=${servisler.join(",")}`), "sağlık").map((o) => {
        if (!metinMi(o.name) || !metinMi(o.status)) throw new BicimHatasi("sağlık");
        return { ad: o.name, durum: o.status };
      });
    },
    async sslZorla(p) {
      const j = await istek("PUT", `/v1/projects/${proje(p)}/ssl-enforcement`, { requestedConfig: { database: true } });
      const c = (j as { currentConfig?: { database?: unknown } } | null)?.currentConfig?.database;
      if (c !== true) throw new BicimHatasi("SSL zorlaması uygulanmadı");
    },
    async havuzcu(p) {
      return nesneler(await istek("GET", `/v1/projects/${proje(p)}/config/database/pooler`), "havuzcu").map((o) => {
        if (!metinMi(o.db_host) || typeof o.db_port !== "number" || !metinMi(o.db_name) || !metinMi(o.pool_mode)) throw new BicimHatasi("havuzcu");
        return { sunucu: o.db_host, kapi: o.db_port, vt: o.db_name, kip: o.pool_mode };
      });
    },
    async gizliAnahtar(p, ad) {
      if (!/^[a-z_]{3,40}$/.test(ad)) throw new Error("Geçersiz anahtar adı.");
      const bul = (j: unknown) => nesneler(j, "anahtar listesi").find((o) => o.type === "secret" && o.name === ad);
      const var_ = bul(await istek("GET", `/v1/projects/${proje(p)}/api-keys?reveal=true`));
      const o = var_ ?? (await istek("POST", `/v1/projects/${proje(p)}/api-keys?reveal=true`,
        { type: "secret", name: ad, secret_jwt_template: { role: "service_role" } })) as Record<string, unknown> | null;
      const k = o?.api_key;
      if (!metinMi(k) || k.length < 20) throw new BicimHatasi("gizli anahtar");
      return k;
    },
    async projeSil(p) {
      await istek("DELETE", `/v1/projects/${proje(p)}`);
    },
  };
}

/** Yönetim API'siyle göç yürütücüsü (src/server/db/goc.ts GocYurutucu): göç başına TEK istek — BEGIN; SET LOCAL ROLE postgres (0000'in varsayılan
    hakları koşan rolün; FIRMA-VT §5.4); goc tablosu; göç; kaydı; COMMIT. Ad kalıptan, özet onaltılık olduğu için metne güvenle gömülür (yine
    denetlenir). Düşerse işlem sunucuda geri alınır, hata yukarı. */
export function yonetimApiYurutucu(y: Pick<SupabaseYonetimi, "sorgu">, proje: string): GocYurutucu {
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
