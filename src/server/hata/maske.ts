/* HATA KAYDININ HAZIRLIĞI — saf (567; 06-HATA-TAKIBI "aynı hata kısılır, gürültü elenir", "bağlamıyla yazılır, yığın izi kırpılır"; 09 G2 "log ve
   hata kaydında kişisel veri yok"). Kayda gitmeden önce:
   · maske: e-posta → [e-posta], 10+ haneli sayı (telefon, T.C. kimlik, SGK no) → [sayı], jeton / anahtar (JWT, uzun rastgele dizgi, 40+ onaltılık)
     → [iz]. Kayıt kimliği (UUID) kalır — kişisel veri değil, destekte kaydı bulur;
   · adres: yalnız yol (sorgu dizgisi ve # sonrası atılır — arama metni, belirteç taşıyabilir);
   · yığın izi: ilk satır (mesajın kopyası) atılır, en çok 8 kare, köken (https://alan) atılır, 1200 karaktere kırpılır;
   · gürültü: bizim sorunumuz olmayan bilinen iletiler yazılmaz (her birinin yanında NEDEN zararsız olduğu). */

export interface HataGirdisi {
  kaynak: "istemci" | "sunucu";
  mesaj: string;
  yer?: string | null;
  yigin?: string | null;
  adres?: string | null;
  /** firmanın kısa adı (alt alan adı) */
  alan?: string | null;
  /** oturumlu hesabın kimliği (ad değil) */
  hesap?: string | null;
  surum?: string | null;
  cihaz?: string | null;
}
export interface HazirHata {
  kaynak: "istemci" | "sunucu"; mesaj: string; yer: string | null; yigin: string | null; adres: string | null; alan: string | null; hesap: string | null;
  surum: string | null; cihaz: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** kişisel veri ve sırları maskeler */
export function maskele(s: string): string {
  return s
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[e-posta]")
    .replace(/\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?/g, "[iz]")
    /* FIRMA-VT FV8 (2026-10-16): Supabase yönetim / gizli / yayımlanabilir anahtarı ve Resend anahtarı — kısa olsa da (uzun dizgi kuralına girmeyen) */
    .replace(/\b(?:sbp|sb_secret|sb_publishable)_[A-Za-z0-9_-]{6,}/g, "[iz]")
    .replace(/\bre_(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{8,}/g, "[iz]")
    /* uzun rastgele dizgi: içinde onaltılık olmayan harf ya da _ olan 24+ karakter (UUID yalnız onaltılık + tire — kalır) */
    .replace(/(?<![A-Za-z0-9_-])(?=[A-Za-z0-9_-]*[g-zG-Z_])(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{24,}(?![A-Za-z0-9_-])/g, "[iz]")
    .replace(/(?<![0-9a-fA-F])[0-9a-fA-F]{40,}(?![0-9a-fA-F])/g, "[iz]")
    .replace(/(?<![\w.])\+?\d(?:[ .-]?\d){9,}(?![\w])/g, "[sayı]");
}

/** adresin yalnız yolu (sorgu ve # atılır); geçersizse null */
export function adresYolu(a: string | null | undefined): string | null {
  if (!a) return null;
  const y = a.split(/[?#]/)[0].trim();
  return y.startsWith("/") ? maskele(y).slice(0, 200) : null;
}

/** yığın izi: ilk satır (mesaj) atılır, en çok 8 kare, köken atılır, maskelenir, 1200 karakter */
export function yiginKirp(y: string | null | undefined): string | null {
  if (!y) return null;
  const satirlar = y.split("\n").map((s) => s.trim()).filter(Boolean);
  const kareler = (satirlar.length > 1 && !/^at\s|@/.test(satirlar[0]) ? satirlar.slice(1) : satirlar).slice(0, 8)
    .map((s) => s.replace(/https?:\/\/[^/\s)]+/g, ""));
  const k = maskele(kareler.join("\n")).slice(0, 1200);
  return k || null;
}

/* GÜRÜLTÜ — yazılmaz (neden zararsız): */
const GURULTU: readonly RegExp[] = [
  /ResizeObserver loop/i,                       // tarayıcının çizim döngüsü uyarısı; bir sonraki karede düzelir, kullanıcı görmez
  /^Script error\.?$/i,                         // başka kökenden betik — içerik yok (bizim betiklerimiz kendi kökenimizden)
  /Failed to fetch|NetworkError|Load failed|network error|ERR_NETWORK|ERR_INTERNET_DISCONNECTED/i, // bağlantı koptu; ekran "Bağlantı yok" der
  /AbortError|aborted a request|operation was aborted|signal is aborted/i, // sayfadan çıkınca / yeni istek eskisini iptal edince
  /NEXT_REDIRECT|NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK/,  // Next'in yönlendirme / bulunamadı akışı — hata değil
  /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to load chunk/i, // yeni yayından sonra açık kalan eski sekme; sayfa yenilenince geçer
];
export const gurultuMu = (mesaj: string) => GURULTU.some((r) => r.test(mesaj));

/** kayda gidecek biçim (maskeli, kırpılmış); gürültü ya da boş mesajsa null */
export function hataHazirla(g: HataGirdisi): HazirHata | null {
  const mesaj = maskele(String(g.mesaj ?? "").replace(/\s+/g, " ").trim()).slice(0, 300);
  if (!mesaj || gurultuMu(mesaj)) return null;
  const alan = g.alan && /^[a-z0-9-]{1,63}$/.test(g.alan) ? g.alan : null;
  return {
    kaynak: g.kaynak, mesaj,
    yer: g.yer ? maskele(String(g.yer)).replace(/https?:\/\/[^/\s)]+/g, "").slice(0, 200) || null : null,
    yigin: yiginKirp(g.yigin), adres: adresYolu(g.adres), alan, hesap: g.hesap && UUID.test(g.hesap) ? g.hesap : null,
    surum: g.surum ? String(g.surum).slice(0, 40) : null, cihaz: g.cihaz ? maskele(String(g.cihaz)).slice(0, 160) : null,
  };
}
