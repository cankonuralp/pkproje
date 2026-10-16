/* SAHTE RESEND YÖNETİM API'Sİ (FIRMA-VT FV11, 2026-10-16) — src/server/dis/resend-yonetim.ts, yönetimin e-posta gönderimi (src/modules/yonetim/server/
   eposta.ts) ve uçtan uca (scripts/e2e-sunucu.ts) için yerel HTTP taklidi. Gerçek API gibi: anahtar "Authorization: Bearer" başlığında (yoksa / yanlışsa
   401); GET /domains → {object, data}; POST /domains {name, region} → {id, name, status: "not_started", region, records}; GET /domains/{id} → doğrulama
   istenmediyse "not_started", istendiyse dogrulaSonucu (verified | pending | failed — kayıtların durumu da); POST /domains/{id}/verify; POST /api-keys
   {name, permission, domain_id} → {id, token} (açılan anahtar anahtarEklendi ile bildirilir); bilinmeyen alan 404; oran sınırı (sinir429 kadar istek)
   429 + Retry-After: 0; hata enjeksiyonu (yöntem + yol deseni → durum, kaç kez). Her istek kaydedilir (yöntem, yol, gövde, User-Agent). Veri ve anahtar
   UYDURMA (anahtar her koşuda rastgele — depoya girmez). */
import { randomBytes, randomUUID } from "node:crypto";
import { createServer, type Server, type ServerResponse } from "node:http";
import { bosKapi } from "./kume.ts";

export interface SahteAlan { id: string; ad: string; region: string; dogrulama: number }
export interface SahteResend {
  url: string;
  anahtar: string;
  alanlar: Map<string, SahteAlan>;
  anahtarlar: { id: string; token: string; name: string; permission: string; domain_id: string }[];
  istekler: { yontem: string; yol: string; govde: string; ua: string | undefined }[];
  /** doğrulama istenen alanın sonucu */
  dogrulaSonucu: "verified" | "pending" | "failed";
  sinir429: number;
  hatalar: { yontem: string; yol: RegExp; durum: number; kez: number }[];
  /** açılan gönderme anahtarı (ör. uçtan uca e-posta taklidi kabul etsin) */
  anahtarEklendi?: (token: string) => void;
  kapat(): Promise<void>;
}

const kayitlar = (a: SahteAlan, durum: string) => [
  { record: "SPF", name: "send", type: "MX", ttl: "Auto", status: durum, value: `feedback-smtp.${a.region}.amazonses.com`, priority: 10 },
  { record: "SPF", name: "send", type: "TXT", ttl: "Auto", status: durum, value: "\"v=spf1 include:amazonses.com ~all\"" },
  { record: "DKIM", name: "resend._domainkey", type: "TXT", ttl: "Auto", status: durum, value: `p=UYDURMA${a.id.replace(/-/g, "")}` },
];

export async function sahteResendKur(anahtar = `re_uydurmaYonetimAnahtari${randomBytes(6).toString("hex")}`): Promise<SahteResend> {
  const d: Omit<SahteResend, "url" | "kapat"> = { anahtar, alanlar: new Map(), anahtarlar: [], istekler: [], dogrulaSonucu: "verified", sinir429: 0, hatalar: [] };
  const json = (y: ServerResponse, durum: number, govde: unknown, ek: Record<string, string> = {}) =>
    y.writeHead(durum, { "content-type": "application/json", ...ek }).end(JSON.stringify(govde));
  const durumu = (a: SahteAlan) => (a.dogrulama === 0 ? "not_started" : d.dogrulaSonucu);
  const alanYaniti = (a: SahteAlan) => ({ object: "domain", id: a.id, name: a.ad, status: durumu(a), region: a.region, records: kayitlar(a, durumu(a)) });
  const sunucu: Server = createServer((istek, y) => {
    const parcalar: Buffer[] = [];
    istek.on("data", (p: Buffer) => parcalar.push(p));
    istek.on("end", () => {
      const yol = new URL(istek.url ?? "/", "http://x").pathname, yontem = istek.method ?? "GET", govde = Buffer.concat(parcalar).toString("utf8");
      d.istekler.push({ yontem, yol, govde, ua: istek.headers["user-agent"] });
      if (istek.headers.authorization !== `Bearer ${d.anahtar}`) { json(y, 401, { name: "validation_error", message: "API key is invalid" }); return; }
      if (d.sinir429 > 0) { d.sinir429--; json(y, 429, { name: "rate_limit_exceeded", message: "Too many requests" }, { "retry-after": "0" }); return; }
      const hata = d.hatalar.find((h) => h.kez > 0 && h.yontem === yontem && h.yol.test(yol));
      if (hata) { hata.kez--; json(y, hata.durum, { name: "taklit", message: `taklit hata ${hata.durum} — gizli_ayrinti` }); return; }
      let g: Record<string, unknown> = {};
      try { g = govde ? JSON.parse(govde) as Record<string, unknown> : {}; } catch { json(y, 400, { message: "bad json" }); return; }
      if (yontem === "GET" && yol === "/domains") { json(y, 200, { object: "list", has_more: false, data: [...d.alanlar.values()].map((a) => ({ id: a.id, name: a.ad, status: durumu(a), region: a.region })) }); return; }
      if (yontem === "POST" && yol === "/domains") {
        if (typeof g.name !== "string" || ![...d.alanlar.values()].every((a) => a.ad !== g.name)) { json(y, 422, { message: "domain invalid or exists" }); return; }
        const a: SahteAlan = { id: randomUUID(), ad: g.name, region: typeof g.region === "string" ? g.region : "us-east-1", dogrulama: 0 };
        d.alanlar.set(a.id, a);
        json(y, 200, alanYaniti(a)); return;
      }
      const m = /^\/domains\/([^/]+)(\/verify)?$/.exec(yol);
      if (m) {
        const a = d.alanlar.get(m[1]!);
        if (!a) { json(y, 404, { message: "Domain not found" }); return; }
        if (yontem === "POST" && m[2]) { a.dogrulama++; json(y, 200, { object: "domain", id: a.id }); return; }
        if (yontem === "GET" && !m[2]) { json(y, 200, alanYaniti(a)); return; }
      }
      if (yontem === "POST" && yol === "/api-keys") {
        const a = typeof g.domain_id === "string" ? d.alanlar.get(g.domain_id) : undefined;
        if (!a || g.permission !== "sending_access" || typeof g.name !== "string") { json(y, 422, { message: "invalid api key request" }); return; }
        const k = { id: randomUUID(), token: `re_${randomBytes(18).toString("base64url").replace(/[-_]/g, "x")}`, name: g.name, permission: g.permission, domain_id: a.id };
        d.anahtarlar.push(k);
        d.anahtarEklendi?.(k.token);
        json(y, 201, { id: k.id, token: k.token }); return;
      }
      json(y, 404, { message: "taklitte yok" });
    });
  });
  const kapi = await bosKapi();
  await new Promise<void>((coz) => sunucu.listen(kapi, "127.0.0.1", coz));
  return Object.assign(d, { url: `http://127.0.0.1:${kapi}`, kapat: () => new Promise<void>((coz) => sunucu.close(() => coz())) });
}
