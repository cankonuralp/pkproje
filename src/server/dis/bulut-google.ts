/* BULUT YEDEK — GOOGLE DRIVE (2026-11-03; kurallar bulut-ortak.ts başlığında). Uçlar (Google belgesi): izin accounts.google.com/o/oauth2/v2/auth,
   belirteç / bırakma oauth2.googleapis.com/token, /revoke, hesap openidconnect.googleapis.com/v1/userinfo, Drive v3 www.googleapis.com/drive/v3/files
   ve yükleme www.googleapis.com/upload/drive/v3/files (resumable: önce üst bilgi → Location, sonra içerik). İzin "drive.file": probata yalnız kendi
   açtığı klasörü ve dosyaları görür. Drive yolla değil kimlikle çalışır: klasör ve dosya kimlikleri çağıranın yer deposunda; kayıtlı kimlik
   silinmişse (404) yol unutulur, bir kez yeniden aranır / açılır. Aynı adlı dosya varsa içeriği değişir (kopya dosya oluşmaz). */
import {
  BulutDolu, BulutHatasi, BulutKopuk, BulutYetki, ISTEK_MS, belirtecIstegi, bekleme, jsonOku, metin,
  type BulutAyari, type BulutHizmeti, type YerDeposu, type Yukleme,
} from "./bulut-ortak.ts";

const KLASOR = "application/vnd.google-apps.folder";
const KAPSAM = "openid email https://www.googleapis.com/auth/drive.file";
const KIMLIK = /^[A-Za-z0-9_-]{5,200}$/;

export function googleHizmeti(a: BulutAyari, bekle: (ms: number) => Promise<void>): BulutHizmeti {
  const u = a.uc ? `${a.uc}/google` : null;
  const UC = {
    izin: u ? `${u}/auth` : "https://accounts.google.com/o/oauth2/v2/auth",
    belirtec: u ? `${u}/token` : "https://oauth2.googleapis.com/token",
    birak: u ? `${u}/revoke` : "https://oauth2.googleapis.com/revoke",
    hesap: u ? `${u}/userinfo` : "https://openidconnect.googleapis.com/v1/userinfo",
    dosyalar: u ? `${u}/drive/v3/files` : "https://www.googleapis.com/drive/v3/files",
    yukle: u ? `${u}/upload/drive/v3/files` : "https://www.googleapis.com/upload/drive/v3/files",
  };

  /** Drive isteği: 401 → BulutYetki, 403 + depolama kotası → BulutDolu, 404 → null, 429 / 503 bir kez bekleyip yeniden, öteki → BulutHatasi */
  async function istek(erisim: string, url: string, i: RequestInit = {}, deneme = 0): Promise<Response | null> {
    let y: Response;
    try {
      y = await fetch(url, { ...i, redirect: "error", signal: AbortSignal.timeout(ISTEK_MS),
        headers: { Authorization: `Bearer ${erisim}`, "User-Agent": "probata", ...(i.headers as Record<string, string> | undefined) } });
    } catch { throw new BulutHatasi(0, "ağ"); }
    if (y.ok) return y;
    if (y.status === 404) { await y.body?.cancel(); return null; }
    if (y.status === 401) { await y.body?.cancel(); throw new BulutYetki(); }
    const j = await jsonOku(y);
    const hata = (j.error && typeof j.error === "object" ? j.error : {}) as Record<string, unknown>;
    const neden = Array.isArray(hata.errors) && hata.errors[0] && typeof hata.errors[0] === "object" ? String((hata.errors[0] as Record<string, unknown>).reason ?? "") : "";
    if (y.status === 403 && /storageQuotaExceeded|quotaExceeded/.test(neden)) throw new BulutDolu();
    const ms = bekleme(y) ?? (y.status === 403 && /rateLimitExceeded|userRateLimitExceeded/.test(neden) ? 2000 : null);
    if (ms !== null && deneme === 0) { await bekle(ms); return istek(erisim, url, i, 1); }
    throw new BulutHatasi(y.status, neden.slice(0, 40));
  }
  const kac = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  /** üst klasörde bu adda (klasör ya da dosya) — probata'nın açtıkları arasında */
  async function bul(erisim: string, ust: string, ad: string, klasor: boolean): Promise<string | null> {
    const q = `name = '${kac(ad)}' and '${ust}' in parents and trashed = false and mimeType ${klasor ? "=" : "!="} '${KLASOR}'`;
    const y = await istek(erisim, `${UC.dosyalar}?${new URLSearchParams({ q, fields: "files(id)", pageSize: "1", spaces: "drive" })}`);
    if (!y) return null;
    const f = (await jsonOku(y)).files;
    const id = Array.isArray(f) && f[0] && typeof f[0] === "object" ? (f[0] as Record<string, unknown>).id : null;
    return metin(id, 200) && KIMLIK.test(id) ? id : null;
  }
  async function klasorAc(erisim: string, ust: string, ad: string): Promise<string> {
    const y = await istek(erisim, `${UC.dosyalar}?fields=id`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: ad, mimeType: KLASOR, parents: [ust] }) });
    const id = y ? (await jsonOku(y)).id : null;
    if (!metin(id, 200) || !KIMLIK.test(id)) throw new BulutHatasi(y?.status ?? 404, "klasör");
    return id;
  }
  /** yolun son klasörünün kimliği (yoksa açılır) */
  async function klasorYolu(erisim: string, yol: readonly string[], yerler: YerDeposu): Promise<string> {
    let ust = "root";
    for (let i = 0; i < yol.length; i++) {
      const anahtar = yol.slice(0, i + 1).join("/");
      let id = await yerler.al(anahtar);
      if (!id) {
        id = (await bul(erisim, ust, yol[i]!, true)) ?? (await klasorAc(erisim, ust, yol[i]!));
        await yerler.koy(anahtar, id);
      }
      ust = id;
    }
    return ust;
  }
  /** resumable yükleme: oturumu aç (yeni dosya POST, var olan PATCH) → içeriği tek PUT'la gönder */
  async function icerikYaz(erisim: string, y: Yukleme, ust: string, varOlan: string | null): Promise<string | null> {
    const ac = await istek(erisim, varOlan ? `${UC.yukle}/${varOlan}?uploadType=resumable&fields=id` : `${UC.yukle}?uploadType=resumable&fields=id`, {
      method: varOlan ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": y.tur, "X-Upload-Content-Length": String(y.bayt.length) },
      body: JSON.stringify(varOlan ? {} : { name: y.ad, parents: [ust] }),
    });
    if (!ac) return null;
    const yer = ac.headers.get("location");
    await ac.body?.cancel();
    if (!yer || !(yer.startsWith(UC.yukle) || (u !== null && yer.startsWith(u)))) throw new BulutHatasi(ac.status, "yükleme adresi");
    const p = await istek(erisim, yer, { method: "PUT", headers: { "Content-Type": y.tur }, body: Buffer.from(y.bayt) });
    if (!p) return null;
    const id = (await jsonOku(p)).id;
    if (!metin(id, 200) || !KIMLIK.test(id)) throw new BulutHatasi(p.status, "yüklenen dosya");
    return id;
  }

  return {
    izinAdresi(durum, meydan) {
      return `${UC.izin}?${new URLSearchParams({ client_id: a.istemci, redirect_uri: a.donus, response_type: "code", scope: KAPSAM, access_type: "offline",
        prompt: "consent", state: durum, code_challenge: meydan, code_challenge_method: "S256" })}`;
    },
    async kodTakas(kod, dogrulayici) {
      const j = await belirtecIstegi(UC.belirtec, { code: kod, client_id: a.istemci, client_secret: a.sir, redirect_uri: a.donus, grant_type: "authorization_code",
        code_verifier: dogrulayici });
      if (!metin(j.access_token) || !metin(j.refresh_token)) throw new BulutKopuk("Google kalıcı izin vermedi; yeniden bağlanın.");
      if (typeof j.scope === "string" && !j.scope.split(" ").includes("https://www.googleapis.com/auth/drive.file")) throw new BulutKopuk("Drive izni verilmedi; izin ekranında kutuyu işaretleyin.");
      return { erisim: j.access_token, yenileme: j.refresh_token };
    },
    async yenile(yenileme) {
      const j = await belirtecIstegi(UC.belirtec, { refresh_token: yenileme, client_id: a.istemci, client_secret: a.sir, grant_type: "refresh_token" });
      if (!metin(j.access_token)) throw new BulutHatasi(200, "anahtar yok");
      return { erisim: j.access_token, yenileme: metin(j.refresh_token) ? j.refresh_token : null };
    },
    async hesap(erisim) {
      const y = await istek(erisim, UC.hesap);
      const e = y ? (await jsonOku(y)).email : null;
      if (!metin(e, 320)) throw new BulutHatasi(y?.status ?? 404, "hesap");
      return e;
    },
    async birak(yenileme) {
      try { await fetch(UC.birak, { method: "POST", redirect: "error", signal: AbortSignal.timeout(ISTEK_MS),
        headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token: yenileme }) }); } catch { /* bağlantı yine de kesilir */ }
    },
    async bul(erisim, y, yerler) {
      /* kayıtlı kimlik yoksa klasör yolu kayıtlı kimliklerle aranır (açılmaz); Drive yolla değil kimlikle bilir */
      let id = await yerler.al([...y.yol, y.ad].join("/"));
      if (!id) {
        let ust = "root";
        for (let i = 0; i < y.yol.length; i++) {
          const k = await yerler.al(y.yol.slice(0, i + 1).join("/")) ?? await bul(erisim, ust, y.yol[i]!, true);
          if (!k) return null;
          ust = k;
        }
        id = await bul(erisim, ust, y.ad, false);
        if (!id) return null;
      }
      if (!KIMLIK.test(id)) return null;
      const r = await istek(erisim, `${UC.dosyalar}/${encodeURIComponent(id)}?fields=id,size,trashed`);
      if (!r) return null;
      const j = await jsonOku(r);
      if (j.trashed === true) return null;
      const boyut = Number(j.size);
      return Number.isFinite(boyut) && boyut >= 0 ? { boyut } : null;
    },
    async yukle(erisim, y, yerler) {
      for (let deneme = 0; deneme < 2; deneme++) {
        const ust = await klasorYolu(erisim, y.yol, yerler);
        const anahtar = [...y.yol, y.ad].join("/");
        const kayitli = await yerler.al(anahtar);
        const varOlan = kayitli ?? (await bul(erisim, ust, y.ad, false));
        const id = await icerikYaz(erisim, y, ust, varOlan);
        if (id) { await yerler.koy(anahtar, id); return; }
        /* 404: klasör ya da dosya Drive'da silinmiş — yol unutulur, bir kez baştan */
        await yerler.sil(y.yol[0]!);
      }
      throw new BulutHatasi(404, "klasör bulunamadı");
    },
  };
}
