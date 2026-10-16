/* ══ RESEND YÖNETİM İSTEMCİSİ (FIRMA-VT §5.8; FV11 — 2026-10-16, K2) ════════════════════════════════════════════════════════════════════════
   Reisim (579): "resend için tek seçenek var ve o da firmaların kendi mail adresleri ile mail atılması". probata'nın TEK Resend hesabında firmanın
   gönderen alan adı: ekle (AB — eu-west-1), DNS kayıtları, doğrula, alan adına BAĞLI gönderme anahtarı (sending_access — başka alan adıyla gönderemez).
   Uçlar (Resend belgesi): GET /domains, POST /domains {name, region}, GET /domains/{id}, POST /domains/{id}/verify, POST /api-keys {name, permission,
   domain_id}. Her yanıt BİÇİMİYLE denetlenir; tutmazsa BicimHatasi (kapalı yön).
   · Anahtar PROBATA_RESEND_ANAHTARI (probata'nın tam yetkili Resend anahtarı): yalnız Vercel ortamında; koda, veritabanına, iletiye, günlüğe yazılmaz.
     Ortam adları YALNIZ src/server/dis/** ve scripts/ içinde (kilit tests/yonetim-anahtari.test.ts); bu dosyayı yalnız yönetim sunucusu içe aktarır.
   · Uç https://api.resend.com. PROBATA_RESEND_YONETIM_UC YALNIZ yerel adres (test taklidi); başka değer HATA: anahtar başka sunucuya gitmez.
     Yönlendirme izlenmez; her istek 30 sn; açık User-Agent "probata".
   · 429: Retry-After kadar (yoksa 1, 2, 4 sn) bekler, en çok 3 kez; toplam bekleme 15 sn'yi aşmaz. Başka hata yeniden denenmez.
   · Hata iletisi SIRSIZ: yalnız durum kodu (sunucunun iletisi yazılmaz). Açılan gönderme anahtarı yalnız dönen değerde — çağıran hemen şifreler. */
import { ALAN_BICIMI } from "../eposta/kimden.ts";

export interface ResendAyari { uc: string; anahtar: string; yerel: boolean }
const VARSAYILAN_UC = "https://api.resend.com";
const YEREL_UC = /^http:\/\/(127\.0\.0\.1|localhost):\d{2,5}$/;
const KIMLIK = /^[A-Za-z0-9_-]{8,64}$/;
export const RESEND = { istekMs: 30_000, enCok429: 3, toplamBekleMs: 15_000, enCokKayit: 20 } as const;

/** ortamdan ayar: anahtar yoksa null (e-posta gönderimi Yönetim'de kapalı, açıklamalı); biçimsizse ya da uç yerel değilse HATA (iletide değer yok) */
export function resendAyari(e: Record<string, string | undefined>): ResendAyari | null {
  const anahtar = (e.PROBATA_RESEND_ANAHTARI ?? "").trim();
  if (!anahtar) return null;
  if (!/^re_[A-Za-z0-9_]{16,200}$/.test(anahtar)) throw new Error("Resend anahtarı biçimsiz (PROBATA_RESEND_ANAHTARI).");
  const uc = (e.PROBATA_RESEND_YONETIM_UC ?? "").replace(/\/+$/, "");
  if (uc && !YEREL_UC.test(uc)) throw new Error("PROBATA_RESEND_YONETIM_UC yalnız yerel adres olabilir (test taklidi).");
  return { uc: uc || VARSAYILAN_UC, anahtar, yerel: !!uc };
}

/** API hatası — iletide yalnız durum */
export class ResendHatasi extends Error {
  readonly durum: number;
  constructor(durum: number) { super(`Resend reddetti (${durum})`); this.name = "ResendHatasi"; this.durum = durum; }
}
export class ResendBicimHatasi extends Error {
  constructor(ne: string) { super(`Resend'in yanıtı beklenen biçimde değil (${ne})`); this.name = "ResendBicimHatasi"; }
}

/** DNS kaydı (ekranda gösterilir; yönetim panele eklenir): tür (MX / TXT / CNAME), ad, değer, öncelik (MX), durum, ne için (SPF / DKIM …) */
export interface DnsKaydi { tur: string; ad: string; deger: string; oncelik: number | null; durum: string; kayit: string }
export interface ResendAlani { id: string; ad: string; durum: string; kayitlar: DnsKaydi[] }
export interface ResendYonetimi {
  /** hesaptaki alan adları (tekrar eklememek için adla aranır) */
  alanlar(): Promise<{ id: string; ad: string; durum: string }[]>;
  /** alan adı ekle (AB bölgesi) */
  alanEkle(ad: string): Promise<ResendAlani>;
  alan(id: string): Promise<ResendAlani>;
  /** DNS kayıtlarını yeniden denet (sonuç sonra alan() ile okunur) */
  dogrula(id: string): Promise<void>;
  /** alan adına bağlı gönderme anahtarı — düz anahtar yalnız bu yanıtta */
  gondermeAnahtari(ad: string, alanId: string): Promise<{ id: string; anahtar: string }>;
}

const metinMi = (x: unknown, en = 300): x is string => typeof x === "string" && x.length > 0 && x.length <= en;
const nesne = (j: unknown, ne: string): Record<string, unknown> => {
  if (j === null || typeof j !== "object" || Array.isArray(j)) throw new ResendBicimHatasi(ne);
  return j as Record<string, unknown>;
};
/** DNS kayıtları: en çok 20; her alan metin ve sınırlı (değer en çok 2 000 — DKIM anahtarı uzun) */
function kayitlarOku(x: unknown): DnsKaydi[] {
  if (x === undefined || x === null) return [];
  if (!Array.isArray(x) || x.length > RESEND.enCokKayit) throw new ResendBicimHatasi("DNS kayıtları");
  return x.map((r) => {
    const o = nesne(r, "DNS kaydı");
    if (!metinMi(o.type, 10) || !/^[A-Z]{1,10}$/.test(o.type) || !metinMi(o.name, 255) || !metinMi(o.value, 2000)) throw new ResendBicimHatasi("DNS kaydı");
    const oncelik = typeof o.priority === "number" && Number.isInteger(o.priority) && o.priority >= 0 && o.priority <= 65535 ? o.priority : null;
    return { tur: o.type, ad: o.name, deger: o.value, oncelik, durum: metinMi(o.status, 40) ? o.status : "", kayit: metinMi(o.record, 40) ? o.record : "" };
  });
}
function alanOku(j: unknown, ne: string): ResendAlani {
  const o = nesne(j, ne);
  if (!metinMi(o.id, 64) || !KIMLIK.test(o.id) || !metinMi(o.name, 100) || !metinMi(o.status, 40)) throw new ResendBicimHatasi(ne);
  return { id: o.id, ad: o.name, durum: o.status, kayitlar: kayitlarOku(o.records) };
}

export function resendYonetimi(a: ResendAyari, s: { bekle?: (ms: number) => Promise<void> } = {}): ResendYonetimi {
  const bekle = s.bekle ?? ((ms: number) => new Promise<void>((coz) => setTimeout(coz, ms)));
  const kimlik = (id: string) => { if (!KIMLIK.test(id)) throw new Error("Geçersiz Resend kimliği."); return id; };
  async function istek(yontem: string, yol: string, govdeVeri?: unknown): Promise<unknown> {
    let beklenen = 0;
    for (let deneme = 0; ; deneme++) {
      const y = await fetch(`${a.uc}${yol}`, {
        method: yontem, redirect: "error", signal: AbortSignal.timeout(RESEND.istekMs),
        headers: { Authorization: `Bearer ${a.anahtar}`, Accept: "application/json", "User-Agent": "probata",
          ...(govdeVeri === undefined ? {} : { "Content-Type": "application/json" }) },
        ...(govdeVeri === undefined ? {} : { body: JSON.stringify(govdeVeri) }),
      });
      const govde = await y.text();
      if (y.ok) {
        if (!govde) return null;
        try { return JSON.parse(govde) as unknown; } catch { throw new ResendBicimHatasi("JSON değil"); }
      }
      if (y.status === 429 && deneme < RESEND.enCok429) {
        const b = y.headers.get("retry-after");
        const ms = b && /^\d+$/.test(b.trim()) ? Number(b.trim()) * 1000 : 1000 * 2 ** deneme;
        if (beklenen + ms <= RESEND.toplamBekleMs) { beklenen += ms; await bekle(ms); continue; }
      }
      throw new ResendHatasi(y.status);
    }
  }
  return {
    async alanlar() {
      const j = nesne(await istek("GET", "/domains"), "alan listesi");
      if (!Array.isArray(j.data)) throw new ResendBicimHatasi("alan listesi");
      return j.data.map((x) => {
        const o = nesne(x, "alan");
        if (!metinMi(o.id, 64) || !KIMLIK.test(o.id) || !metinMi(o.name, 100)) throw new ResendBicimHatasi("alan");
        return { id: o.id, ad: o.name, durum: metinMi(o.status, 40) ? o.status : "" };
      });
    },
    async alanEkle(ad) {
      if (!ALAN_BICIMI.test(ad)) throw new Error("Geçersiz alan adı.");
      const r = alanOku(await istek("POST", "/domains", { name: ad, region: "eu-west-1" }), "eklenen alan");
      if (r.ad !== ad) throw new ResendBicimHatasi("eklenen alanın adı");
      return r;
    },
    async alan(id) {
      return alanOku(await istek("GET", `/domains/${kimlik(id)}`), "alan");
    },
    async dogrula(id) {
      await istek("POST", `/domains/${kimlik(id)}/verify`);
    },
    async gondermeAnahtari(ad, alanId) {
      if (!/^[a-z0-9-]{3,50}$/.test(ad)) throw new Error("Geçersiz anahtar adı.");
      const o = nesne(await istek("POST", "/api-keys", { name: ad, permission: "sending_access", domain_id: kimlik(alanId) }), "gönderme anahtarı");
      if (!metinMi(o.id, 64) || !KIMLIK.test(o.id) || !metinMi(o.token, 300) || !/^re_[A-Za-z0-9_]{16,250}$/.test(o.token)) throw new ResendBicimHatasi("gönderme anahtarı");
      return { id: o.id, anahtar: o.token };
    },
  };
}
