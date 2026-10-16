/* YÖNETİM › FİRMA › E-POSTA GÖNDERİMİ (FIRMA-VT §5.8; FV11 — 2026-10-16, K2 + K3). Reisim (579): "resend için tek seçenek var ve o da firmaların
   kendi mail adresleri ile mail atılması … resend ve supabase ayarları firma ayarları kısmından değiştirilemesin". probata'nın TEK Resend hesabına
   firmanın alan adı eklenir; Resend'in DNS kayıtları ekranda (firmanın alan adı yönetimine girilir); "Doğrula" Resend'e denetletir; doğrulanınca o alan
   adına BAĞLI gönderme anahtarı açılır, uygulamada şifrelenir (sir.ts sifrele — firma + ad ek verisi) ve firma tarafına yazılır.
   KAYITLAR: merkez eposta_alan (asıl kayıt: alan, genel adres, Resend kimliği, DNS kayıtları, durum, anahtarın KİMLİĞİ) · firma tarafı firma_gonderim
   (kilitli kopya) + sır eposta_anahtari (uygulama rolü yazamaz — 0099 K3). Kendi projeli firmada firma tarafı firmanın veritabanında.
   SIRA (iki veritabanı atomik değil — kapalı yön): ekle → önce Resend, sonra merkez, sonra firma tarafı (doğrulanmadı: e-postalar bekler); doğrula →
   doğrulandıysa anahtar → firma tarafı (sır, sonra gönderim "doğrulandı") → EN SON merkez "doğrulandı". Firma tarafı düşerse merkez "bekliyor" kalır,
   yeniden "Doğrula" tamamlar (Resend'de kullanılmayan bir anahtar kalabilir — değeri hiçbir yerde yok). Alan adı değişince firma tarafı hemen
   "doğrulanmadı" olur (eski alanla gönderilmez). Anahtarın değeri hiçbir ize, yanıta, günlüğe düşmez. */
import { sifrele } from "../../../server/ayar/sir.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ResendBicimHatasi, ResendHatasi, type DnsKaydi, type ResendAlani, type ResendYonetimi } from "../../../server/dis/resend-yonetim.ts";
import { gonderimSemasi } from "../sema.ts";
import { firmada, yer, type YonetimCalistirici } from "./firma-tarafi.ts";
import type { YonetimSonucu } from "./yonetim.ts";

export type { DnsKaydi };
export interface EpostaOrtami extends YonetimCalistirici { resend: ResendYonetimi; anaAnahtar: Buffer }
export type GonderimDurumu = "bekliyor" | "dogrulandi" | "hata";
export interface GonderimGorunumu { alan: string; genel: string; durum: GonderimDurumu; kayitlar: DnsKaydi[]; degisti: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ULASILAMADI = "Firmanın veritabanına ulaşılamadı; yeniden deneyin.";
type Satir = { alan: string; genel_yerel: string; resend_id: string; durum: GonderimDurumu; kayitlar: DnsKaydi[]; anahtar_id: string | null; degisti: Date };

async function satirOku(c: YonetimCalistirici, id: string): Promise<Satir | null> {
  return (await c.merkez((db) => db.sorgu<Satir>(
    "SELECT alan, genel_yerel, resend_id, durum, kayitlar, anahtar_id, degisti FROM eposta_alan WHERE firma_id = $1", [id]))).rows[0] ?? null;
}
const gorunum = (s: Satir): GonderimGorunumu => ({ alan: s.alan, genel: `${s.genel_yerel}@${s.alan}`, durum: s.durum, kayitlar: s.kayitlar, degisti: s.degisti.toISOString() });

/** firma sayfasında gösterilen gönderim kaydı (merkezden; yoksa null) */
export async function gonderimGorunumu(c: YonetimCalistirici, id: string): Promise<GonderimGorunumu | null> {
  if (!UUID.test(id)) return null;
  const s = await satirOku(c, id);
  return s ? gorunum(s) : null;
}

/** Resend hatasının sırsız açıklaması */
function resendNedeni(h: unknown): string | null {
  if (h instanceof ResendHatasi) {
    if (h.durum === 401 || h.durum === 403) return "Resend anahtarının yetkisi yetmiyor (probata hesabı).";
    if (h.durum === 429) return "Resend istek sınırı; biraz sonra yeniden deneyin.";
    if (h.durum >= 500) return "Resend geçici hata verdi; yeniden deneyin.";
    return `Resend isteği reddetti (${h.durum}).`;
  }
  if (h instanceof ResendBicimHatasi) return "Resend'in yanıtı beklenen biçimde değil.";
  if (h instanceof Error && (h.name === "TimeoutError" || h.name === "AbortError")) return "Resend yanıt vermedi; yeniden deneyin.";
  return null;
}
async function resendIle<T>(is: () => Promise<T>): Promise<{ tamam: true; deger: T } | { tamam: false; neden: string }> {
  try { return { tamam: true, deger: await is() }; } catch (h) {
    const n = resendNedeni(h);
    if (n) return { tamam: false, neden: n };
    throw h;
  }
}
/** Resend durumundan bizim durumumuz (doğrulandı ancak anahtar firma tarafına yazılınca) */
const durumu = (r: string): GonderimDurumu => (r === "failed" ? "hata" : "bekliyor");

/** firma tarafının gönderim kopyası + (verilirse) sır — ortak firmada merkezde, kendi projelide firmanın veritabanında; ulaşılamazsa false */
async function firmaTarafi(c: YonetimCalistirici, id: string, y: Exclude<Awaited<ReturnType<typeof yer>>, null>, g: { alan: string; genel: string; dogrulandi: boolean },
  sir?: { sifreli: string; son4: string }): Promise<boolean> {
  if (y.vt === "kurulum") return false;
  const is = async (db: Sorgulayici) => {
    if (sir) {
      const r = (await db.sorgu<{ s: { durum?: string } }>("SELECT firma_yonetim_sir($1, 'eposta_anahtari', $2, $3) AS s", [id, sir.sifreli, sir.son4])).rows[0]!.s;
      if (r.durum !== "tamam") throw new Error("gönderim anahtarı yazılamadı");
    }
    const r = (await db.sorgu<{ s: { durum?: string } }>("SELECT firma_yonetim_gonderim($1, $2, $3, $4) AS s", [id, g.alan, g.genel, g.dogrulandi])).rows[0]!.s;
    if (r.durum !== "tamam") throw new Error("gönderim kaydı yazılamadı");
    return true;
  };
  if (y.vt === "ortak") return c.merkez(is);
  const r = await firmada(c, y.kayit, id, is);
  if (r) await c.merkez((db) => db.sorgu("SELECT yonetim_firmada_iz($1, 'ayar.eposta_gonderim', $2::jsonb)", [id, JSON.stringify({ alan: g.alan, dogrulandi: g.dogrulandi, anahtar: !!sir })]));
  return r === true;
}
async function merkezYaz(c: YonetimCalistirici, id: string, s: Omit<Satir, "degisti">): Promise<string | null> {
  const r = (await c.merkez((db) => db.sorgu<{ s: { durum?: string; hata?: string } }>("SELECT yonetim_eposta_alan_yaz($1, $2, $3, $4, $5, $6::jsonb, $7) AS s",
    [id, s.alan, s.genel_yerel, s.resend_id, s.durum, JSON.stringify(s.kayitlar), s.anahtar_id]))).rows[0]!.s;
  if (r.hata === "alan_baska") return "Bu alan adı başka bir firmada kayıtlı.";
  if (r.hata === "yok") return "Firma bulunamadı.";
  return r.durum === "tamam" ? null : "Kayıt yazılamadı.";
}

/** alan adını ekle ya da değiştir (girdi: alan, yerel). Resend'de varsa yeniden eklenmez (adla bulunur). Sonra durum Resend'den okunur. */
export async function gonderimAlaniEkle(o: EpostaOrtami, id: string, girdi: unknown): Promise<YonetimSonucu<{ gorunum: GonderimGorunumu }>> {
  if (!UUID.test(id)) return { durum: "yok" };
  const g = gonderimSemasi.safeParse(girdi);
  if (!g.success) {
    const hatalar: Record<string, string> = {};
    for (const i of g.error.issues) { const k = String(i.path[0] ?? "genel"); hatalar[k] ??= i.message; }
    return { durum: "gecersiz", hatalar };
  }
  const y = await yer(o, id);
  if (!y) return { durum: "yok" };
  if (y.vt === "kurulum") return { durum: "red", neden: "Firmanın kurulumu bitmedi." };
  const { alan, yerel } = g.data;
  const baska = (await o.merkez((db) => db.sorgu("SELECT 1 FROM eposta_alan WHERE alan = $1 AND firma_id <> $2", [alan, id]))).rowCount;
  if (baska) return { durum: "gecersiz", hatalar: { alan: "Bu alan adı başka bir firmada kayıtlı." } };
  const eski = await satirOku(o, id);
  const r = await resendIle(async (): Promise<ResendAlani> => {
    if (eski && eski.alan === alan) return o.resend.alan(eski.resend_id);
    const var_ = (await o.resend.alanlar()).find((x) => x.ad === alan);
    return var_ ? o.resend.alan(var_.id) : o.resend.alanEkle(alan);
  });
  if (!r.tamam) return { durum: "red", neden: r.neden };
  const ayni = eski !== null && eski.alan === alan;
  const yeni: Omit<Satir, "degisti"> = { alan, genel_yerel: yerel, resend_id: r.deger.id, kayitlar: r.deger.kayitlar,
    durum: ayni && eski.durum === "dogrulandi" ? "dogrulandi" : durumu(r.deger.durum), anahtar_id: ayni ? eski.anahtar_id : null };
  /* alan değiştiyse önce firma tarafı "doğrulanmadı" (eski alanla gönderilmez), sonra merkez; aynı alanda yalnız genel adres değişebilir */
  if (!ayni && eski) {
    if (!(await firmaTarafi(o, id, y, { alan, genel: `${yerel}@${alan}`, dogrulandi: false }))) return { durum: "red", neden: ULASILAMADI };
  }
  const n = await merkezYaz(o, id, yeni);
  if (n) return { durum: "red", neden: n };
  if (!(await firmaTarafi(o, id, y, { alan, genel: `${yerel}@${alan}`, dogrulandi: yeni.durum === "dogrulandi" }))) return { durum: "red", neden: ULASILAMADI };
  const s = await satirOku(o, id);
  return { durum: "tamam", gorunum: gorunum(s!) };
}

/** "Doğrula": Resend'e DNS kayıtlarını denetletir; doğrulandıysa gönderme anahtarını açar ve firma tarafına kilitli yazar */
export async function gonderimDogrula(o: EpostaOrtami, id: string): Promise<YonetimSonucu<{ gorunum: GonderimGorunumu }>> {
  if (!UUID.test(id)) return { durum: "yok" };
  const s = await satirOku(o, id);
  if (!s) return { durum: "red", neden: "Önce alan adını ekleyin." };
  const y = await yer(o, id);
  if (!y) return { durum: "yok" };
  if (y.vt === "kurulum") return { durum: "red", neden: "Firmanın kurulumu bitmedi." };
  const r = await resendIle(async () => { await o.resend.dogrula(s.resend_id); return o.resend.alan(s.resend_id); });
  if (!r.tamam) return { durum: "red", neden: r.neden };
  const genel = `${s.genel_yerel}@${s.alan}`;
  let durum: GonderimDurumu = durumu(r.deger.durum), anahtarId = s.anahtar_id;
  if (r.deger.durum === "verified") {
    if (!anahtarId) {
      const k = await resendIle(() => o.resend.gondermeAnahtari(`probata-${s.alan.replace(/[^a-z0-9-]/g, "-").slice(0, 40)}`, s.resend_id));
      if (!k.tamam) return { durum: "red", neden: k.neden };
      const sir = { sifreli: sifrele(k.deger.anahtar, id, "eposta_anahtari", o.anaAnahtar), son4: k.deger.anahtar.slice(-4) };
      if (!(await firmaTarafi(o, id, y, { alan: s.alan, genel, dogrulandi: true }, sir))) {
        await merkezYaz(o, id, { ...s, kayitlar: r.deger.kayitlar, durum: "bekliyor" });
        return { durum: "red", neden: `${ULASILAMADI} Alan adı doğrulandı; gönderim henüz açılmadı.` };
      }
      anahtarId = k.deger.id;
    } else if (!(await firmaTarafi(o, id, y, { alan: s.alan, genel, dogrulandi: true }))) {
      return { durum: "red", neden: ULASILAMADI };
    }
    durum = "dogrulandi";
  } else if (s.durum === "dogrulandi") {
    /* Resend artık doğrulamıyor (DNS kaydı silinmiş olabilir): gönderim kapanır */
    if (!(await firmaTarafi(o, id, y, { alan: s.alan, genel, dogrulandi: false }))) return { durum: "red", neden: ULASILAMADI };
  }
  const n = await merkezYaz(o, id, { ...s, kayitlar: r.deger.kayitlar, durum, anahtar_id: anahtarId });
  if (n) return { durum: "red", neden: n };
  return { durum: "tamam", gorunum: gorunum((await satirOku(o, id))!) };
}
