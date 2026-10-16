/* SAHTE SUPABASE YÖNETİM API'Sİ (FIRMA-VT FV8, 2026-10-16; FV10 aynı gün) — src/server/dis/supabase-yonetim.ts'in testleri, göç dağıtıcının "uygula" kipi ve
   kurulum makinesi (FV10) için yerel HTTP taklidi. Gerçek API gibi: anahtar "Authorization: Bearer" başlığında (yoksa / yanlışsa 401); SQL hatası 400 +
   "Failed to run sql query: ERROR:  <SQLSTATE>: <ileti>"; bilinmeyen proje 404; oran sınırı (sinir429 kadar istek) 429 + Retry-After: 0.
   Uçlar: POST /v1/projects/<proje>/database/query (201 + son ifadenin satırları) · FV10: GET /v1/projects (liste) · POST /v1/projects (gerçeği gibi HEMEN
   201 {id, name, status: COMING_UP} döner; donanımı — küme, veritabanı — projeKur arkada kurar; kuramazsa INIT_FAILED; açılış yanıtı "kaybolsun"
   denirse proje açılır ama 500 döner) · GET …/health?services= (kurulum bitene ve ilk hazirSayac yoklama geçene dek COMING_UP, sonra ACTIVE_HEALTHY) · PUT …/ssl-enforcement · GET …/config/database/pooler · GET / POST …/api-keys?reveal=true (açılan gizli anahtar
   anahtarEklendi ile bildirilir — sahte Storage onu kabul eder) · DELETE /v1/projects/<proje>. Hata enjeksiyonu: hatalar (yöntem + yol deseni → durum,
   kaç kez). Proje → yürütücü: PostgreSQL'de her istek KENDİ bağlantısında. Veri UYDURMA, anahtar uydurma. */
import { randomBytes, randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import type pg from "pg";
import { bosKapi } from "./kume.ts";

export type ProjeYurutucu = (sql: string) => Promise<Record<string, unknown>[]>;
/** FV10: projeKur'un kurduğu donanım */
export type ProjeDonanimi = Pick<SahteProje, "yurutucu" | "havuzcu" | "kapat">;

/** FV10: taklitte açılan projenin donanımı (testin projeKur'u arkada kurar) */
export interface SahteProje {
  id: string; ad: string; durum: string;
  /** donanımın kurulumu (bitince durum ACTIVE_HEALTHY; düşerse INIT_FAILED) — sorgu, havuzcu, silme onu bekler */
  kurulum: Promise<void>;
  yurutucu: ProjeYurutucu;
  havuzcu: { db_host: string; db_port: number; db_name: string; pool_mode: string }[];
  /** sağlık yoklamasının ilk kaç kez COMING_UP döneceği */
  hazirSayac: number;
  ssl: boolean;
  anahtarlar: { name: string; type: string; api_key: string }[];
  /** kurucunun kaynakları (küme) — taklit kapanınca kapatılır */
  kapat?: () => Promise<void>;
}

export interface SahteYonetim {
  url: string;
  anahtar: string;
  projeler: Map<string, ProjeYurutucu>;
  /** FV10: açılmış (sahte) projeler — kimliğe göre */
  acilanlar: Map<string, SahteProje>;
  /** FV10: POST /v1/projects'in donanım kurucusu — arkada koşar (verilmezse 500) */
  projeKur?: (ad: string) => Promise<ProjeDonanimi>;
  /** FV10: açılan gizli anahtar (sahte Storage'a kaydedilir) */
  anahtarEklendi?: (anahtar: string) => void;
  /** FV10: yöntem + yol deseni → durum (kez kadar); "kaybol": POST /v1/projects projeyi açar ama 500 döner */
  hatalar: { yontem: string; yol: RegExp; durum: number | "kaybol"; kez: number }[];
  /** her istek: yöntem, yol, proje + SQL (sorgu ucunda) ve gövde metni (sırların sızmadığını denetlemek için) */
  istekler: { yontem: string; yol: string; proje: string; sql: string; govde: string }[];
  /** sonraki bu kadar istek 429 alır */
  sinir429: number;
  kapat(): Promise<void>;
}

/** sahip bağlantısı üreten işlevden yürütücü: her istek yeni bağlantı, düşerse ROLLBACK (bağlantı kapanır), son ifadenin satırları */
export function pgProjesi(baglan: () => pg.Client): ProjeYurutucu {
  return async (sql) => {
    const c = baglan();
    await c.connect();
    try {
      const r = (await c.query(sql)) as unknown as pg.QueryResult | pg.QueryResult[];
      const son = Array.isArray(r) ? r.at(-1) : r;
      return (son?.rows ?? []) as Record<string, unknown>[];
    } catch (h) {
      try { await c.query("ROLLBACK"); } catch { /* bağlantı zaten düşmüş olabilir */ }
      throw h;
    } finally {
      await c.end();
    }
  };
}

export async function sahteYonetimKur(anahtar = "sbp_uydurma0123456789abcdef0123456789abcd"): Promise<SahteYonetim> {
  const d: Omit<SahteYonetim, "url" | "kapat"> = { anahtar, projeler: new Map(), acilanlar: new Map(), hatalar: [], istekler: [], sinir429: 0 };
  const json = (y: import("node:http").ServerResponse, durum: number, govde: unknown, ek: Record<string, string> = {}) => {
    y.writeHead(durum, { "content-type": "application/json", ...ek }).end(JSON.stringify(govde));
  };
  const sunucu: Server = createServer((istek, y) => {
    const parcalar: Buffer[] = [];
    istek.on("data", (p: Buffer) => parcalar.push(p));
    istek.on("end", () => {
      void (async () => {
        const adres = new URL(istek.url ?? "/", "http://x");
        const yol = adres.pathname, yontem = istek.method ?? "GET";
        const govdeMetni = Buffer.concat(parcalar).toString("utf8");
        if (istek.headers.authorization !== `Bearer ${d.anahtar}`) { json(y, 401, { message: "Unauthorized" }); return; }
        const sorguUcu = /^\/v1\/projects\/([^/]+)\/database\/query$/.exec(yol);
        let sql = "";
        if (sorguUcu) {
          try { sql = String((JSON.parse(govdeMetni) as { query?: unknown }).query ?? ""); } catch { json(y, 400, { message: "bad json" }); return; }
        }
        d.istekler.push({ yontem, yol, proje: sorguUcu?.[1] ?? /^\/v1\/projects\/([^/]+)/.exec(yol)?.[1] ?? "", sql, govde: govdeMetni });
        if (d.sinir429 > 0) { d.sinir429--; json(y, 429, { message: "Rate limit exceeded" }, { "retry-after": "0" }); return; }
        const hata = d.hatalar.find((h) => h.kez > 0 && h.yontem === yontem && h.yol.test(yol));
        if (hata && hata.durum !== "kaybol") { hata.kez--; json(y, hata.durum, { message: `taklit hata ${hata.durum}` }); return; }

        if (sorguUcu) {
          const acilan = d.acilanlar.get(sorguUcu[1]!);
          if (acilan) await acilan.kurulum;
          const yur = d.projeler.get(sorguUcu[1]!) ?? acilan?.yurutucu;
          if (!yur) { json(y, 404, { message: "Project not found" }); return; }
          try { json(y, 201, await yur(sql)); } catch (h) {
            const e = h as { code?: string; message?: string };
            json(y, 400, { message: `Failed to run sql query: ERROR:  ${e.code ?? "XX000"}: ${e.message ?? "hata"}` });
          }
          return;
        }
        /* ── FV10 proje uçları ── */
        if (yontem === "GET" && yol === "/v1/projects") {
          json(y, 200, [...d.acilanlar.values()].map((p) => ({ id: p.id, name: p.ad, status: p.durum, region: "eu-central-1" }))); return;
        }
        if (yontem === "POST" && yol === "/v1/projects") {
          if (!d.projeKur) { json(y, 500, { message: "taklitte proje kurucu yok" }); return; }
          const g = JSON.parse(govdeMetni) as { name?: string; region_selection?: { code?: string } };
          if (!g.name || g.region_selection?.code !== "eu-central-1") { json(y, 400, { message: "bad request" }); return; }
          const kur = d.projeKur;
          const p: SahteProje = { id: yerelProjeKimligi(), ad: g.name, durum: "COMING_UP", hazirSayac: 1, ssl: false, anahtarlar: [], havuzcu: [],
            yurutucu: async () => { throw Object.assign(new Error("proje hazır değil"), { code: "57P03" }); }, kurulum: Promise.resolve() };
          p.kurulum = kur(g.name).then((k) => { Object.assign(p, k); p.durum = "ACTIVE_HEALTHY"; }, () => { p.durum = "INIT_FAILED"; });
          d.acilanlar.set(p.id, p);
          if (hata?.durum === "kaybol") { hata.kez--; json(y, 500, { message: "yanıt kayboldu (taklit)" }); return; }
          json(y, 201, { id: p.id, name: p.ad, status: "COMING_UP" }); return;
        }
        const m = /^\/v1\/projects\/([^/]+)(\/.*)?$/.exec(yol);
        const p = m ? d.acilanlar.get(m[1]!) : undefined;
        if (!m || !p) { json(y, 404, { message: "Project not found" }); return; }
        const alt = m[2] ?? "";
        if (yontem === "DELETE" && alt === "") { await p.kurulum; await p.kapat?.(); d.acilanlar.delete(p.id); json(y, 200, { id: p.id }); return; }
        if (yontem === "GET" && alt === "/health") {
          const servisler = (adres.searchParams.get("services") ?? "").split(",").filter(Boolean);
          const durum = p.durum !== "ACTIVE_HEALTHY" || p.hazirSayac > 0 ? "COMING_UP" : "ACTIVE_HEALTHY";
          if (p.durum === "ACTIVE_HEALTHY" && p.hazirSayac > 0) p.hazirSayac--;
          json(y, 200, servisler.map((s) => ({ name: s, healthy: durum === "ACTIVE_HEALTHY", status: durum }))); return;
        }
        if (yontem === "PUT" && alt === "/ssl-enforcement") { p.ssl = true; json(y, 200, { currentConfig: { database: true }, appliedSuccessfully: true }); return; }
        if (yontem === "GET" && alt === "/config/database/pooler") { await p.kurulum; json(y, 200, p.havuzcu.map((h) => ({ ...h, database_type: "PRIMARY" }))); return; }
        if (alt === "/api-keys" && adres.searchParams.get("reveal") === "true") {
          if (yontem === "GET") { json(y, 200, p.anahtarlar); return; }
          if (yontem === "POST") {
            const g = JSON.parse(govdeMetni) as { name?: string; type?: string };
            const k = { name: g.name ?? "", type: g.type ?? "", api_key: `sb_secret_${randomBytes(18).toString("base64url")}` };
            p.anahtarlar.push(k);
            d.anahtarEklendi?.(k.api_key);
            json(y, 201, k); return;
          }
        }
        json(y, 404, { message: "taklitte yok" });
      })();
    });
  });
  const kapi = await bosKapi();
  await new Promise<void>((coz) => sunucu.listen(kapi, "127.0.0.1", coz));
  return Object.assign(d, {
    url: `http://127.0.0.1:${kapi}`,
    kapat: async () => {
      for (const p of d.acilanlar.values()) { await p.kurulum; await p.kapat?.().catch(() => {}); }
      await new Promise<void>((coz) => sunucu.close(() => coz()));
    },
  });
}

/** taklitte açılan projenin kimliği: yerel taklitte "yerel-<uuid>" (kurulum ref'siz yerel projeyi adından bulur) */
const yerelProjeKimligi = () => `yerel-${randomUUID()}`;
