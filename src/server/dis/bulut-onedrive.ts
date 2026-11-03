/* BULUT YEDEK — ONEDRIVE (2026-11-03; kurallar bulut-ortak.ts başlığında). Uçlar (Microsoft belgesi): izin / belirteç
   login.microsoftonline.com/common/oauth2/v2.0/authorize, /token (kişisel ve iş hesapları); hesap ve dosyalar Microsoft Graph
   graph.microsoft.com/v1.0/me/drive/special/approot (UYGULAMA KLASÖRÜ — "Uygulamalar/<uygulama adı>"; izin "Files.ReadWrite.AppFolder" yalnız orayı
   açar). Yol adresli: klasörler yüklemede kendiliğinden açılır, aynı yoldaki dosyanın içeriği değişir (conflictBehavior=replace). 4 MB'a kadar tek
   PUT; üstü yükleme oturumuyla 10 MiB'lık parçalar (320 KiB'ın katı). Microsoft yenileme anahtarını her yenilemede DEĞİŞTİRİR — dönen yenileme
   çağıranda saklanır. İzni geri bırakmanın uygulama ucu yok: bağlantı kesilince anahtar silinir (hesap sahibi izni Microsoft hesabından da kaldırır). */
import {
  BulutDolu, BulutHatasi, BulutKopuk, BulutYetki, ISTEK_MS, belirtecIstegi, bekleme, jsonOku, metin,
  type BulutAyari, type BulutHizmeti, type Yukleme,
} from "./bulut-ortak.ts";

const KAPSAM = "offline_access User.Read Files.ReadWrite.AppFolder";
const TEK_PUT = 4 * 1024 * 1024, PARCA = 10 * 1024 * 1024;
/** OneDrive'ın yükleme oturumu adresi (yanıttan gelir): yalnız Microsoft'un alanları */
const OTURUM_ALANI = /^https:\/\/([a-z0-9-]+\.)*(sharepoint\.com|onedrive\.com|live\.net|microsoft\.com|office\.com|1drv\.com)\//;

export function onedriveHizmeti(a: BulutAyari, bekle: (ms: number) => Promise<void>): BulutHizmeti {
  const u = a.uc ? `${a.uc}/ms` : null;
  const UC = {
    izin: u ? `${u}/authorize` : "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    belirtec: u ? `${u}/token` : "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    graph: u ? `${u}/graph/v1.0` : "https://graph.microsoft.com/v1.0",
  };

  /** Graph isteği: 401 → BulutYetki, 507 / kota → BulutDolu, 429 / 503 bir kez bekleyip yeniden, öteki hata → BulutHatasi */
  async function istek(url: string, i: RequestInit, erisim: string | null, deneme = 0): Promise<Response> {
    let y: Response;
    try {
      y = await fetch(url, { ...i, redirect: "error", signal: AbortSignal.timeout(ISTEK_MS),
        headers: { ...(erisim ? { Authorization: `Bearer ${erisim}` } : {}), "User-Agent": "probata", ...(i.headers as Record<string, string> | undefined) } });
    } catch { throw new BulutHatasi(0, "ağ"); }
    if (y.ok) return y;
    if (y.status === 401) { await y.body?.cancel(); throw new BulutYetki(); }
    const j = await jsonOku(y);
    const kod = j.error && typeof j.error === "object" ? String((j.error as Record<string, unknown>).code ?? "").slice(0, 40) : "";
    if (y.status === 507 || /quotaLimitReached|insufficientStorage/i.test(kod)) throw new BulutDolu();
    const ms = bekleme(y);
    if (ms !== null && deneme === 0) { await bekle(ms); return istek(url, i, erisim, 1); }
    throw new BulutHatasi(y.status, kod);
  }
  /** uygulama klasörü içinde yol: her parça ayrı kodlanır */
  const yolAdresi = (y: Yukleme) => `${UC.graph}/me/drive/special/approot:/${[...y.yol, y.ad].map(encodeURIComponent).join("/")}:`;

  return {
    izinAdresi(durum, meydan) {
      return `${UC.izin}?${new URLSearchParams({ client_id: a.istemci, response_type: "code", redirect_uri: a.donus, response_mode: "query", scope: KAPSAM,
        state: durum, code_challenge: meydan, code_challenge_method: "S256", prompt: "select_account" })}`;
    },
    async kodTakas(kod, dogrulayici) {
      const j = await belirtecIstegi(UC.belirtec, { client_id: a.istemci, client_secret: a.sir, grant_type: "authorization_code", code: kod,
        redirect_uri: a.donus, code_verifier: dogrulayici, scope: KAPSAM });
      if (!metin(j.access_token, 10000) || !metin(j.refresh_token, 10000)) throw new BulutKopuk("Microsoft kalıcı izin vermedi; yeniden bağlanın.");
      return { erisim: j.access_token, yenileme: j.refresh_token };
    },
    async yenile(yenileme) {
      const j = await belirtecIstegi(UC.belirtec, { client_id: a.istemci, client_secret: a.sir, grant_type: "refresh_token", refresh_token: yenileme, scope: KAPSAM });
      if (!metin(j.access_token, 10000)) throw new BulutHatasi(200, "anahtar yok");
      return { erisim: j.access_token, yenileme: metin(j.refresh_token, 10000) ? j.refresh_token : null };
    },
    async hesap(erisim) {
      const j = await jsonOku(await istek(`${UC.graph}/me?$select=mail,userPrincipalName`, {}, erisim));
      const e = metin(j.mail, 320) ? j.mail : j.userPrincipalName;
      if (!metin(e, 320)) throw new BulutHatasi(200, "hesap");
      return e;
    },
    async birak() { /* Microsoft'ta uygulamanın izni geri bırakma ucu yok — anahtar çağıranda silinir */ },
    async yukle(erisim, y) {
      if (y.bayt.length <= TEK_PUT) {
        await (await istek(`${yolAdresi(y)}/content?@microsoft.graph.conflictBehavior=replace`, { method: "PUT", headers: { "Content-Type": y.tur }, body: Buffer.from(y.bayt) }, erisim)).body?.cancel();
        return;
      }
      const o = await jsonOku(await istek(`${yolAdresi(y)}/createUploadSession`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "replace" } }) }, erisim));
      const adres = o.uploadUrl;
      if (!metin(adres, 4000) || !(OTURUM_ALANI.test(adres) || (u !== null && adres.startsWith(u)))) throw new BulutHatasi(200, "yükleme adresi");
      /* oturum adresi kendi yetkisini taşır: erişim anahtarı GÖNDERİLMEZ */
      for (let bas = 0; bas < y.bayt.length; bas += PARCA) {
        const p = y.bayt.subarray(bas, Math.min(bas + PARCA, y.bayt.length));
        await (await istek(adres, { method: "PUT", headers: { "Content-Range": `bytes ${bas}-${bas + p.length - 1}/${y.bayt.length}` }, body: Buffer.from(p) }, null)).body?.cancel();
      }
    },
  };
}
