/* SUPABASE STORAGE DEPOSU (568; reisim 2026-10-15: "fotoğraflar neden veritabanından kota yiyor, storage'da olması gerekmiyor mu", "gizli link")
   — Depo arayüzünün Supabase Storage karşılığı; REST ile, ek paket yok (anayasa 5.2: dış kod yok). Kova ÖZEL: herkese açık adres yok; sunucu
   gizli anahtarla yazar / okur / siler. Tarayıcıya yalnız 5 dakikalık İMZALI adres gider (dosya ucu, yalnız sayfa açılışında — yetki ucunda
   denetlendikten sonra); görsel, PDF penceresi ve toplu indirme kendi kökenimizden akar (CSP ve CORS değişmez).
   · Yazılan değişmez: aynı anahtara ikinci kez yazılmaz (x-upsert: false — klasör ve veritabanı deposuyla aynı); kova yoksa bir kez kurulur (özel,
     boyut sınırlı).
   · GEÇİŞ (yedek = veritabanı deposu, 347): Storage'da olmayan nesne yedekten okunur; gece işi (tasi) eski nesneleri Storage'a taşır — yüklenen
     içerik GERİ okunur, özeti veritabanındaki içeriğin özetiyle tutarsa satır silinir (depo_nesne_tasindi, göç 0094); tutmazsa satır kalır, bozuk
     kopya Storage'dan kaldırılır.
   · Her firma kendi Supabase'i (513, K7): ayar bugün ortamdan (ortak deneme projesi); firmaya göre çözme K7'de buraya bağlanır.
   · Sır (gizli anahtar) koda yazılmaz, günlüğe / hataya düşmez. */
import { createHash } from "node:crypto";
import type { Sorgulayici } from "../db/kiraci.ts";
import { anahtarGecerli } from "./anahtar.ts";
import type { Depo, TasimaSonucu } from "./depo.ts";

export interface SupabaseAyari { url: string; gizli: string; kova: string }

const KOVA = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const SURE = 20_000;
/** kovanın tek dosya sınırı (yükleme sınırı 25 MB — tur.ts SINIR; pay) */
const KOVA_SINIRI = 30 * 1024 * 1024;

/** ortamdan ayar (saf): PROBATA_SUPABASE_URL (https://<proje>.supabase.co; yerel deneme sunucusu için http://127.0.0.1) + PROBATA_SUPABASE_GIZLI;
    kova PROBATA_SUPABASE_KOVA (yoksa "probata"). Eksik / biçimsizse hata — sessiz düşüş yok. */
export function supabaseOrtami(e: Record<string, string | undefined>): SupabaseAyari {
  const url = (e.PROBATA_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const gizli = e.PROBATA_SUPABASE_GIZLI ?? "";
  const kova = e.PROBATA_SUPABASE_KOVA || "probata";
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$|^http:\/\/127\.0\.0\.1:\d{2,5}$/.test(url)) throw new Error("PROBATA_SUPABASE_URL geçersiz (https://<proje>.supabase.co).");
  if (gizli.length < 20) throw new Error("PROBATA_SUPABASE_GIZLI yok.");
  if (!KOVA.test(kova)) throw new Error("PROBATA_SUPABASE_KOVA geçersiz.");
  return { url, gizli, kova };
}

/** Storage'ın "yok" cevabı: 404 ya da (eski sürümler) 400 + gövdede not_found / "not found" */
const yokMu = (durum: number, govde: string) => durum === 404 || (durum === 400 && /not[_ ]?found/i.test(govde));
const kovaYokMu = (durum: number, govde: string) => (durum === 404 || durum === 400) && /bucket not found/i.test(govde);
const varMi = (durum: number, govde: string) => durum === 409 || (durum === 400 && /already exists|duplicate/i.test(govde));

export type SupabaseDepo = Depo & Required<Pick<Depo, "imzaliAdres" | "tasi">>;

export function supabaseDepo(ayar: SupabaseAyari, yedek: Depo | null): SupabaseDepo {
  const kok = `${ayar.url}/storage/v1`;
  const yol = (anahtar: string) => {
    if (!anahtarGecerli(anahtar)) throw new Error("Geçersiz depo anahtarı");
    return `${ayar.kova}/${anahtar}`;
  };
  const istek = async (adres: string, init: RequestInit = {}) => {
    const y = await fetch(`${kok}${adres}`, {
      ...init, redirect: "error", signal: AbortSignal.timeout(SURE),
      headers: { apikey: ayar.gizli, Authorization: `Bearer ${ayar.gizli}`, ...(init.headers as Record<string, string> | undefined) },
    });
    return y;
  };
  const hata = (ne: string, durum: number) => new Error(`Depoya erişilemedi (${ne}: ${durum})`);
  let kovaKuruldu = false;
  async function kovaKur(): Promise<void> {
    const y = await istek("/bucket", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ayar.kova, name: ayar.kova, public: false, file_size_limit: KOVA_SINIRI }) });
    const g = await y.text();
    if (!y.ok && !varMi(y.status, g)) throw hata("kova", y.status);
    kovaKuruldu = true;
  }
  /** yükler; zaten varsa "var" (değişmez — üzerine yazılmaz) */
  async function yukle(anahtar: string, bayt: Uint8Array, tur: string): Promise<"yazildi" | "var"> {
    for (let deneme = 0; deneme < 2; deneme++) {
      const y = await istek(`/object/${yol(anahtar)}`, {
        method: "POST", body: Buffer.from(bayt),
        headers: { "Content-Type": tur, "x-upsert": "false", "cache-control": "private, no-store" },
      });
      const g = y.ok ? "" : await y.text();
      if (y.ok) return "yazildi";
      if (varMi(y.status, g)) return "var";
      if (deneme === 0 && !kovaKuruldu && kovaYokMu(y.status, g)) { await kovaKur(); continue; }
      throw hata("yazma", y.status);
    }
    throw hata("yazma", 0);
  }
  /** Storage'daki içerik; yoksa null */
  async function indir(anahtar: string): Promise<Uint8Array | null> {
    const y = await istek(`/object/${yol(anahtar)}`);
    if (y.ok) return new Uint8Array(await y.arrayBuffer());
    const g = await y.text();
    if (yokMu(y.status, g) || kovaYokMu(y.status, g)) return null;
    throw hata("okuma", y.status);
  }

  return {
    async yaz(anahtar, bayt, _db, tur) {
      await yukle(anahtar, bayt, tur ?? "application/octet-stream");
    },
    async oku(anahtar, db) {
      const b = await indir(anahtar);
      if (b) return b;
      if (yedek) return yedek.oku(anahtar, db);
      throw new Error("Depoda böyle bir nesne yok");
    },
    async copSil(anahtar, db) {
      yol(anahtar);
      const y = await istek(`/object/${ayar.kova}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [anahtar] }) });
      if (!y.ok) { const g = await y.text(); if (!yokMu(y.status, g) && !kovaYokMu(y.status, g)) throw hata("silme", y.status); }
      if (yedek) await yedek.copSil(anahtar, db);
    },
    async oksuzSay(db) {
      return yedek ? yedek.oksuzSay(db) : null;   // Storage listelenmez (A1); yedekteki öksüzler sayılır
    },
    /** 5 dakikalık (saniye) imzalı adres; indir verilirse o adla indirilir. Storage'da yoksa null (çağıran yedekten akıtır). */
    async imzaliAdres(anahtar, saniye, indirAdi) {
      const y = await istek(`/object/sign/${yol(anahtar)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: saniye }) });
      const g = await y.text();
      if (!y.ok) { if (yokMu(y.status, g) || kovaYokMu(y.status, g)) return null; throw hata("imza", y.status); }
      const imzali = (JSON.parse(g) as { signedURL?: unknown }).signedURL;
      if (typeof imzali !== "string" || !imzali.startsWith("/object/sign/")) throw hata("imza", y.status);
      return `${kok}${imzali}${indirAdi ? `${imzali.includes("?") ? "&" : "?"}download=${encodeURIComponent(indirAdi)}` : ""}`;
    },
    /** GECE TAŞIMASI (oturumdaki firmanın işleminde): veritabanı deposundaki en eski nesneler Storage'a; geri okunan içeriğin özeti tutarsa satır
        silinir (veritabanı da özeti denetler — depo_nesne_tasindi). Sınır: adet ve bayt; aşılırsa kalan var. */
    async tasi(db: Sorgulayici, sinir: { adet: number; bayt: number }): Promise<TasimaSonucu> {
      const l = (await db.sorgu<{ anahtar: string; boyut: number }>(
        "SELECT anahtar, octet_length(bayt)::int AS boyut FROM depo_nesne ORDER BY olustu, anahtar LIMIT $1", [sinir.adet + 1])).rows;
      const s: TasimaSonucu = { tasinan: 0, bayt: 0, hatali: 0, kalan: l.length > sinir.adet };
      for (const x of l.slice(0, sinir.adet)) {
        if (s.tasinan > 0 && s.bayt + x.boyut > sinir.bayt) { s.kalan = true; break; }
        const n = (await db.sorgu<{ bayt: Buffer; tur: string | null }>(
          "SELECT n.bayt, (SELECT d.tur FROM dosya d WHERE d.anahtar = n.anahtar LIMIT 1) AS tur FROM depo_nesne n WHERE n.anahtar = $1", [x.anahtar])).rows[0];
        if (!n) continue;
        await yukle(x.anahtar, new Uint8Array(n.bayt), n.tur ?? "application/octet-stream");
        const geri = await indir(x.anahtar);
        const ozet = geri ? createHash("sha256").update(geri).digest("hex") : "";
        const silindi = (await db.sorgu<{ t: boolean }>("SELECT depo_nesne_tasindi($1, $2) AS t", [x.anahtar, ozet])).rows[0].t;
        if (silindi) { s.tasinan++; s.bayt += x.boyut; continue; }
        /* tutmadı: bozuk kopya Storage'dan kaldırılır (okuma yedeğe düşer; sonraki gece yeniden yüklenir), satır kalır */
        s.hatali++;
        const y = await istek(`/object/${ayar.kova}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [x.anahtar] }) });
        if (!y.ok) await y.text();
      }
      return s;
    },
  };
}
