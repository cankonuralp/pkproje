/* SAHTE SUPABASE YÖNETİM API'Sİ (FIRMA-VT FV8, 2026-10-16) — src/server/dis/supabase-yonetim.ts'in testleri ve göç dağıtıcının "uygula" kipi için yerel
   HTTP taklidi. Yalnız sorgu ucu: POST /v1/projects/<proje>/database/query, gövde {"query": "…"}. Gerçek API gibi: anahtar "Authorization: Bearer"
   başlığında olmalı (yoksa / yanlışsa 401); başarı 201 + son ifadenin satırları (JSON dizi); SQL hatası 400 + "Failed to run sql query: ERROR:  <SQLSTATE>:
   <ileti>"; bilinmeyen proje 404; oran sınırı (sinir429 kadar istek) 429 + Retry-After: 0. Proje → yürütücü: PostgreSQL'de her istek KENDİ bağlantısında
   (gerçekte de her istek ayrı bağlantı — yarıda düşen işlem geri alınır). Veri UYDURMA, anahtar uydurma. */
import { createServer, type Server } from "node:http";
import type pg from "pg";
import { bosKapi } from "./kume.ts";

export type ProjeYurutucu = (sql: string) => Promise<Record<string, unknown>[]>;

export interface SahteYonetim {
  url: string;
  anahtar: string;
  projeler: Map<string, ProjeYurutucu>;
  /** her istek: proje + SQL (sıra) */
  istekler: { proje: string; sql: string }[];
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
  const d: Omit<SahteYonetim, "url" | "kapat"> = { anahtar, projeler: new Map(), istekler: [], sinir429: 0 };
  const json = (y: import("node:http").ServerResponse, durum: number, govde: unknown, ek: Record<string, string> = {}) => {
    y.writeHead(durum, { "content-type": "application/json", ...ek }).end(JSON.stringify(govde));
  };
  const sunucu: Server = createServer((istek, y) => {
    const parcalar: Buffer[] = [];
    istek.on("data", (p: Buffer) => parcalar.push(p));
    istek.on("end", () => {
      void (async () => {
        const m = /^\/v1\/projects\/([^/]+)\/database\/query$/.exec(istek.url ?? "");
        if (istek.method !== "POST" || !m) { json(y, 404, { message: "taklitte yok" }); return; }
        if (istek.headers.authorization !== `Bearer ${d.anahtar}`) { json(y, 401, { message: "Unauthorized" }); return; }
        const proje = m[1]!;
        let sql = "";
        try { sql = String((JSON.parse(Buffer.concat(parcalar).toString("utf8")) as { query?: unknown }).query ?? ""); } catch { json(y, 400, { message: "bad json" }); return; }
        d.istekler.push({ proje, sql });
        if (d.sinir429 > 0) { d.sinir429--; json(y, 429, { message: "Rate limit exceeded" }, { "retry-after": "0" }); return; }
        const yur = d.projeler.get(proje);
        if (!yur) { json(y, 404, { message: "Project not found" }); return; }
        try {
          json(y, 201, await yur(sql));
        } catch (h) {
          const e = h as { code?: string; message?: string };
          json(y, 400, { message: `Failed to run sql query: ERROR:  ${e.code ?? "XX000"}: ${e.message ?? "hata"}` });
        }
      })();
    });
  });
  const kapi = await bosKapi();
  await new Promise<void>((coz) => sunucu.listen(kapi, "127.0.0.1", coz));
  return Object.assign(d, { url: `http://127.0.0.1:${kapi}`, kapat: () => new Promise<void>((coz) => sunucu.close(() => coz())) });
}
