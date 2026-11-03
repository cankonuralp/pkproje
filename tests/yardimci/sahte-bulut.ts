/* SAHTE GOOGLE DRIVE + ONEDRIVE (2026-11-03; firmanın kendi yedeği) — src/server/dis/bulut-*.ts, src/server/yedek/ ve uçtan uca (scripts/e2e-sunucu.ts)
   için yerel HTTP taklidi; gerçek hizmete istek GİTMEZ. Gerçek uçlar gibi:
   · /google/auth, /ms/authorize: istemci kimliği, dönüş adresi, PKCE (S256) denetlenir; tarayıcı dönüş adresine ?code&state ile yönlenir (izin ekranı
     yok — "izin verildi" sayılır; reddet=true iken ?error=access_denied).
   · /google/token, /ms/token: kod bir kez, doğrulayıcının özeti, sır ve dönüş adresi tutmalı; yenilemede Microsoft yeni yenileme anahtarı verir;
     iptal=true iken her yenileme 400 invalid_grant.
   · Google Drive: klasör / dosya kimlikle (files, q süzgeci: ad + üst + klasör mü), resumable yükleme (POST / PATCH → Location → PUT).
   · OneDrive: uygulama klasöründe yol adresli PUT (≤ 4 MB) ve yükleme oturumu (Content-Range parçaları).
   · Hata enjeksiyonu: yöntem + yol deseni → durum (+ gövde), kaç kez. Her istek kaydedilir. Veri ve anahtarlar UYDURMA (her koşuda rastgele). */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { bosKapi } from "./kume.ts";

export interface SahteDosya { id: string; ad: string; ust: string; klasor: boolean; bayt: Buffer; tur: string }
export interface SahteBulut {
  url: string;
  istemci: { google: string; ms: string }; sir: { google: string; ms: string };
  hesap: { google: string; ms: string };
  /** Google Drive: kimlik → klasör / dosya */
  drive: Map<string, SahteDosya>;
  /** OneDrive: uygulama klasöründe yol → içerik */
  onedrive: Map<string, Buffer>;
  istekler: { yontem: string; yol: string; yetki: string | undefined }[];
  hatalar: { yontem: string; yol: RegExp; durum: number; govde?: unknown; kez: number }[];
  iptal: boolean;
  reddet: boolean;
  /** Google Drive'daki dosyanın tam yolu ("probata yedek/Raporlar/…/x.pdf") */
  driveYolu(id: string): string;
  driveDosyalari(): Map<string, Buffer>;
  kapat(): Promise<void>;
}

export async function sahteBulutKur(): Promise<SahteBulut> {
  const rast = (n = 18) => randomBytes(n).toString("base64url");
  const d: Omit<SahteBulut, "url" | "kapat" | "driveYolu" | "driveDosyalari"> = {
    istemci: { google: `g-${rast(8)}`, ms: `m-${rast(8)}` }, sir: { google: `gs-${rast()}`, ms: `ms-${rast()}` },
    hesap: { google: "yedek@deneme.example", ms: "yedek@deneme-ms.example" },
    drive: new Map(), onedrive: new Map(), istekler: [], hatalar: [], iptal: false, reddet: false,
  };
  /** verilen kodlar (bir kez) ve geçerli anahtarlar */
  const kodlar = new Map<string, { meydan: string; donus: string; h: "google" | "ms" }>();
  const erisimler = new Set<string>(), yenilemeler = new Map<string, "google" | "ms">();
  const oturumlar = new Map<string, { hedef: { tur: "g"; id: string | null; ad: string; ust: string; mime: string } | { tur: "m"; yol: string }; parcalar: Buffer[]; boy: number }>();
  let url = "";
  const json = (y: ServerResponse, durum: number, g: unknown, ek: Record<string, string> = {}) => y.writeHead(durum, { "content-type": "application/json", ...ek }).end(JSON.stringify(g));
  const govdeOku = (i: IncomingMessage) => new Promise<Buffer>((coz) => { const p: Buffer[] = []; i.on("data", (x: Buffer) => p.push(x)); i.on("end", () => coz(Buffer.concat(p))); });
  const yetkili = (i: IncomingMessage) => { const a = i.headers.authorization ?? ""; return a.startsWith("Bearer ") && erisimler.has(a.slice(7)); };
  const anahtarlar = (h: "google" | "ms", yeniYenileme: boolean) => {
    const erisim = `e-${rast()}`; erisimler.add(erisim);
    const yenileme = yeniYenileme ? `y-${rast()}` : null;
    if (yenileme) yenilemeler.set(yenileme, h);
    return { access_token: erisim, expires_in: 3600, token_type: "Bearer", ...(yenileme ? { refresh_token: yenileme } : {}),
      ...(h === "google" ? { scope: "openid email https://www.googleapis.com/auth/drive.file" } : {}) };
  };
  const tamYol = (id: string): string => { const f = d.drive.get(id); return !f ? "" : f.ust === "root" ? f.ad : `${tamYol(f.ust)}/${f.ad}`; };

  const sunucu: Server = createServer(async (i, y) => {
    const u = new URL(i.url ?? "/", "http://x"), yol = u.pathname, yontem = i.method ?? "GET";
    const govde = await govdeOku(i);
    d.istekler.push({ yontem, yol, yetki: i.headers.authorization });
    const hata = d.hatalar.find((h) => h.kez > 0 && h.yontem === yontem && h.yol.test(yol));
    if (hata) { hata.kez--; json(y, hata.durum, hata.govde ?? { error: { code: "taklit", message: "taklit hata — gizli_ayrinti" } }); return; }
    /* ── izin ekranı (tarayıcı) ── */
    const izin = yol === "/google/auth" ? "google" : yol === "/ms/authorize" ? "ms" : null;
    if (izin && yontem === "GET") {
      const p = u.searchParams, donus = p.get("redirect_uri") ?? "", durum = p.get("state") ?? "";
      if (p.get("client_id") !== d.istemci[izin] || p.get("response_type") !== "code" || p.get("code_challenge_method") !== "S256" || !p.get("code_challenge") || !donus) {
        json(y, 400, { error: "invalid_request" }); return;
      }
      if (d.reddet) { y.writeHead(302, { location: `${donus}?error=access_denied&state=${encodeURIComponent(durum)}` }).end(); return; }
      const kod = `k-${rast()}`;
      kodlar.set(kod, { meydan: p.get("code_challenge")!, donus, h: izin });
      y.writeHead(302, { location: `${donus}?code=${kod}&state=${encodeURIComponent(durum)}` }).end();
      return;
    }
    /* ── belirteç ── */
    const bel = yol === "/google/token" ? "google" : yol === "/ms/token" ? "ms" : null;
    if (bel && yontem === "POST") {
      const p = new URLSearchParams(govde.toString("utf8"));
      if (p.get("client_id") !== d.istemci[bel] || p.get("client_secret") !== d.sir[bel]) { json(y, 401, { error: "invalid_client" }); return; }
      if (p.get("grant_type") === "authorization_code") {
        const k = kodlar.get(p.get("code") ?? "");
        kodlar.delete(p.get("code") ?? "");
        const ozet = createHash("sha256").update(p.get("code_verifier") ?? "").digest("base64url");
        if (!k || k.h !== bel || k.meydan !== ozet || k.donus !== p.get("redirect_uri")) { json(y, 400, { error: "invalid_grant" }); return; }
        json(y, 200, anahtarlar(bel, true)); return;
      }
      if (p.get("grant_type") === "refresh_token") {
        if (d.iptal || yenilemeler.get(p.get("refresh_token") ?? "") !== bel) { json(y, 400, { error: "invalid_grant" }); return; }
        json(y, 200, anahtarlar(bel, bel === "ms")); return;
      }
      json(y, 400, { error: "unsupported_grant_type" }); return;
    }
    if (yol === "/google/revoke" && yontem === "POST") { yenilemeler.delete(new URLSearchParams(govde.toString("utf8")).get("token") ?? ""); y.writeHead(200).end(); return; }
    /* ── Google Drive ── */
    if (yol.startsWith("/google/")) {
      if (yol.startsWith("/google/upload/oturum/") && yontem === "PUT") {
        const o = oturumlar.get(yol.split("/").pop()!);
        if (!o || o.hedef.tur !== "g") { json(y, 404, { error: { code: 404 } }); return; }
        const h = o.hedef;
        const id = h.id ?? randomUUID();
        d.drive.set(id, { id, ad: h.ad, ust: h.ust, klasor: false, bayt: govde, tur: h.mime });
        oturumlar.delete(yol.split("/").pop()!);
        json(y, 200, { id }); return;
      }
      if (!yetkili(i)) { json(y, 401, { error: { code: 401, message: "Invalid Credentials" } }); return; }
      if (yol === "/google/userinfo") { json(y, 200, { email: d.hesap.google, email_verified: true }); return; }
      if (yol === "/google/drive/v3/files" && yontem === "GET") {
        const q = u.searchParams.get("q") ?? "";
        const m = /^name = '((?:[^'\\]|\\.)*)' and '([^']+)' in parents and trashed = false and mimeType (=|!=) '([^']+)'$/.exec(q);
        if (!m) { json(y, 400, { error: { code: 400, message: "bad q" } }); return; }
        const ad = m[1]!.replace(/\\(.)/g, "$1"), klasor = m[3] === "=";
        const f = [...d.drive.values()].filter((x) => x.ad === ad && x.ust === m[2] && x.klasor === klasor);
        json(y, 200, { files: f.slice(0, 1).map((x) => ({ id: x.id })) }); return;
      }
      if (yol === "/google/drive/v3/files" && yontem === "POST") {
        const g = JSON.parse(govde.toString("utf8")) as { name: string; mimeType: string; parents: string[] };
        const ust = g.parents?.[0] ?? "root";
        if (ust !== "root" && !d.drive.get(ust)?.klasor) { json(y, 404, { error: { code: 404, message: "File not found" } }); return; }
        const id = randomUUID();
        d.drive.set(id, { id, ad: g.name, ust, klasor: g.mimeType === "application/vnd.google-apps.folder", bayt: Buffer.alloc(0), tur: g.mimeType });
        json(y, 200, { id }); return;
      }
      const yk = /^\/google\/upload\/drive\/v3\/files(?:\/([^/]+))?$/.exec(yol);
      if (yk && u.searchParams.get("uploadType") === "resumable" && (yontem === "POST" || yontem === "PATCH")) {
        const mime = String(i.headers["x-upload-content-type"] ?? "application/octet-stream");
        let hedef: { tur: "g"; id: string | null; ad: string; ust: string; mime: string };
        if (yontem === "PATCH") {
          const f = d.drive.get(yk[1] ?? "");
          if (!f || f.klasor) { json(y, 404, { error: { code: 404, message: "File not found" } }); return; }
          hedef = { tur: "g", id: f.id, ad: f.ad, ust: f.ust, mime };
        } else {
          const g = JSON.parse(govde.toString("utf8")) as { name: string; parents: string[] };
          const ust = g.parents?.[0] ?? "root";
          if (ust !== "root" && !d.drive.get(ust)?.klasor) { json(y, 404, { error: { code: 404, message: "File not found" } }); return; }
          hedef = { tur: "g", id: null, ad: g.name, ust, mime };
        }
        const sid = rast(12);
        oturumlar.set(sid, { hedef, parcalar: [], boy: 0 });
        y.writeHead(200, { location: `${url}/google/upload/oturum/${sid}` }).end(); return;
      }
      json(y, 404, { error: { code: 404, message: "taklitte yok" } }); return;
    }
    /* ── OneDrive ── */
    if (yol.startsWith("/ms/oturum/") && yontem === "PUT") {
      const sid = yol.split("/").pop()!, o = oturumlar.get(sid);
      if (!o || o.hedef.tur !== "m") { json(y, 404, { error: { code: "itemNotFound" } }); return; }
      const m = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(String(i.headers["content-range"] ?? ""));
      if (!m || Number(m[1]) !== o.boy || Number(m[2]) - Number(m[1]) + 1 !== govde.length) { json(y, 416, { error: { code: "invalidRange" } }); return; }
      o.parcalar.push(govde); o.boy += govde.length;
      if (o.boy === Number(m[3])) { d.onedrive.set(o.hedef.yol, Buffer.concat(o.parcalar)); oturumlar.delete(sid); json(y, 201, { id: rast(8) }); return; }
      json(y, 202, { nextExpectedRanges: [`${o.boy}-`] }); return;
    }
    if (yol.startsWith("/ms/graph/v1.0/")) {
      if (!yetkili(i)) { json(y, 401, { error: { code: "InvalidAuthenticationToken" } }); return; }
      if (yol === "/ms/graph/v1.0/me") { json(y, 200, { mail: d.hesap.ms, userPrincipalName: d.hesap.ms }); return; }
      const m = /^\/ms\/graph\/v1\.0\/me\/drive\/special\/approot:\/(.+):\/(content|createUploadSession)$/.exec(yol);
      if (m) {
        const hedefYol = m[1]!.split("/").map(decodeURIComponent).join("/");
        if (m[2] === "content" && yontem === "PUT") {
          if (govde.length > 4 * 1024 * 1024) { json(y, 413, { error: { code: "requestTooLarge" } }); return; }
          d.onedrive.set(hedefYol, govde); json(y, 201, { id: rast(8), name: hedefYol.split("/").pop() }); return;
        }
        if (m[2] === "createUploadSession" && yontem === "POST") {
          const sid = rast(12);
          oturumlar.set(sid, { hedef: { tur: "m", yol: hedefYol }, parcalar: [], boy: 0 });
          json(y, 200, { uploadUrl: `${url}/ms/oturum/${sid}` }); return;
        }
      }
    }
    json(y, 404, { error: { code: "taklitte yok" } });
  });
  const kapi = await bosKapi();
  await new Promise<void>((coz) => sunucu.listen(kapi, "127.0.0.1", coz));
  url = `http://127.0.0.1:${kapi}`;
  return Object.assign(d, {
    url,
    driveYolu: tamYol,
    driveDosyalari: () => new Map([...d.drive.values()].filter((x) => !x.klasor).map((x) => [tamYol(x.id), x.bayt])),
    kapat: () => new Promise<void>((coz) => sunucu.close(() => coz())),
  });
}

/** taklide bağlı ortam (bulutAyari'na verilir) */
export function sahteBulutOrtami(t: SahteBulut, donus = "http://deneme.localhost:3000/api/bulut/donus"): Record<string, string> {
  return { PROBATA_GOOGLE_ISTEMCI: t.istemci.google, PROBATA_GOOGLE_SIR: t.sir.google, PROBATA_ONEDRIVE_ISTEMCI: t.istemci.ms, PROBATA_ONEDRIVE_SIR: t.sir.ms,
    PROBATA_BULUT_DONUS: donus, PROBATA_BULUT_UC: t.url };
}
