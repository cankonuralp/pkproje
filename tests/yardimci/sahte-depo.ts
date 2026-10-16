/* SAHTE SUPABASE STORAGE (568) — tests/depo-supabase.test.ts ve tests/bozan/depo-supabase.bozan.ts için yerel HTTP taklidi. Gerçek Storage'ın
   bağdaştırıcının kullandığı uçları (kova kur, yükle, indir, imzala, sil) ve cevap biçimlerini taklit eder: "yok" 400 + not_found gövdesi (eski
   sürümler), kova yoksa "Bucket not found", var olana ikinci yükleme 409 benzeri; gizli anahtar hem apikey hem Authorization başlığında olmalı.
   bozukYukle: sonraki yükleme içeriği bozarak saklar (taşımanın özet denetimi için). Veri UYDURMA.
   2026-10-16 (FV5, e2e/firma-vt.spec.ts): imzalı adresle OKUMA — GET /object/sign/<kova>/<anahtar>?token=sahte-jeton gizli anahtar istemez (gerçek
   Storage'daki gibi: tarayıcı başlıksız açar); jeton yanlışsa 400. */
import { createServer, type Server } from "node:http";
import { bosKapi } from "./kume.ts";

export interface SahteDepo {
  url: string; gizli: string;
  kovalar: Set<string>;
  nesneler: Map<string, { bayt: Buffer; tur: string; onbellek: string }>;
  istekler: string[];
  bozukYukle: boolean;
  kapat(): Promise<void>;
}

export async function sahteDepoKur(gizli = "sahte-gizli-anahtar-0123456789"): Promise<SahteDepo> {
  const d: Omit<SahteDepo, "url" | "kapat"> = { gizli, kovalar: new Set(), nesneler: new Map(), istekler: [], bozukYukle: false };
  const json = (y: import("node:http").ServerResponse, durum: number, govde: unknown) => {
    y.writeHead(durum, { "content-type": "application/json" }).end(JSON.stringify(govde));
  };
  const yok = (y: import("node:http").ServerResponse) => json(y, 400, { statusCode: "404", error: "not_found", message: "Object not found" });
  const sunucu: Server = createServer((istek, y) => {
    const parcalar: Buffer[] = [];
    istek.on("data", (p: Buffer) => parcalar.push(p));
    istek.on("end", () => {
      const govde = Buffer.concat(parcalar);
      const adres = new URL(istek.url ?? "/", "http://x");
      const yol = adres.pathname.replace(/^\/storage\/v1/, "");
      d.istekler.push(`${istek.method} ${yol}`);
      const imzaliOku = /^\/object\/sign\/([^/]+)\/(.+)$/.exec(yol);
      if (istek.method === "GET" && imzaliOku) {
        const n = adres.searchParams.get("token") === "sahte-jeton" ? d.nesneler.get(`${imzaliOku[1]}/${imzaliOku[2]}`) : undefined;
        if (!n) { json(y, 400, { statusCode: "400", error: "InvalidJWT", message: "invalid signature" }); return; }
        y.writeHead(200, { "content-type": n.tur }).end(n.bayt); return;
      }
      if (istek.headers.apikey !== d.gizli || istek.headers.authorization !== `Bearer ${d.gizli}`) { json(y, 403, { error: "Unauthorized" }); return; }
      if (istek.method === "POST" && yol === "/bucket") {
        const b = JSON.parse(govde.toString()) as { id: string; public: boolean };
        if (b.public !== false) { json(y, 400, { error: "kova özel olmalı (taklit)" }); return; }
        if (d.kovalar.has(b.id)) { json(y, 400, { statusCode: "409", error: "Duplicate", message: "The resource already exists" }); return; }
        d.kovalar.add(b.id); json(y, 200, { name: b.id }); return;
      }
      const imza = /^\/object\/sign\/([^/]+)\/(.+)$/.exec(yol);
      if (istek.method === "POST" && imza) {
        if (!d.nesneler.has(`${imza[1]}/${imza[2]}`)) { yok(y); return; }
        json(y, 200, { signedURL: `/object/sign/${imza[1]}/${imza[2]}?token=sahte-jeton` }); return;
      }
      const nesne = /^\/object\/([^/]+)\/(.+)$/.exec(yol);
      if (nesne && istek.method === "POST") {
        if (!d.kovalar.has(nesne[1])) { json(y, 400, { statusCode: "404", error: "Bucket not found", message: "Bucket not found" }); return; }
        const k = `${nesne[1]}/${nesne[2]}`;
        if (d.nesneler.has(k) && istek.headers["x-upsert"] !== "true") { json(y, 400, { statusCode: "409", error: "Duplicate", message: "The resource already exists" }); return; }
        const bayt = d.bozukYukle ? Buffer.concat([govde, Buffer.from("bozuk")]) : govde;
        d.bozukYukle = false;
        d.nesneler.set(k, { bayt, tur: String(istek.headers["content-type"] ?? ""), onbellek: String(istek.headers["cache-control"] ?? "") });
        json(y, 200, { Key: k }); return;
      }
      if (nesne && istek.method === "GET") {
        const n = d.nesneler.get(`${nesne[1]}/${nesne[2]}`);
        if (!n) { yok(y); return; }
        y.writeHead(200, { "content-type": n.tur }).end(n.bayt); return;
      }
      const kova = /^\/object\/([^/]+)$/.exec(yol);
      if (kova && istek.method === "DELETE") {
        const b = JSON.parse(govde.toString()) as { prefixes: string[] };
        for (const p of b.prefixes) d.nesneler.delete(`${kova[1]}/${p}`);
        json(y, 200, []); return;
      }
      json(y, 404, { error: "taklitte yok" });
    });
  });
  const kapi = await bosKapi();
  await new Promise<void>((coz) => sunucu.listen(kapi, "127.0.0.1", coz));
  return Object.assign(d, { url: `http://127.0.0.1:${kapi}`, kapat: () => new Promise<void>((coz) => sunucu.close(() => coz())) });
}
