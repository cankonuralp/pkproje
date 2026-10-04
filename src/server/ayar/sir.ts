/* ŞİFRELİ SIRLAR (ARKA-UC §8): yapay zekâ API anahtarı, bulut erişimi, imza sağlayıcı bilgileri. Veritabanında yalnız AES-256-GCM ile şifreli;
   ana anahtar ortam değişkeninde (PROBATA_SIR_ANAHTARI, 32 bayt base64), veritabanında / depoda / kodda DEĞİL. Şifreli metin firmaya ve sırrın adına
   bağlıdır (ek doğrulama verisi): satır başka firmaya ya da başka ada kopyalansa çözülmez. Sır istemciye gönderilmez, loga yazılmaz; ekranda son 4.
   Çözme yalnız sunucuda, kullanılacağı an (ör. yapay zekâ isteği) — sayfaya ya da sunucu eylemi yanıtına konmaz. */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { Sorgulayici } from "../db/kiraci.ts";
import { izYaz } from "../db/yazici.ts";

const AD = /^[a-z_]{1,40}$/;
export const SIR_ADLARI = ["yapay_zeka_anahtari", "bulut_erisimi", "imza_saglayici"] as const;
export type SirAdi = (typeof SIR_ADLARI)[number];

/** ana anahtar: ortamdan; yoksa ya da bozuksa sır yazılamaz / okunamaz (sessizce düz metne düşmez) */
export function anaAnahtar(ortam: string | undefined = process.env.PROBATA_SIR_ANAHTARI): Buffer {
  const a = ortam ? Buffer.from(ortam, "base64") : Buffer.alloc(0);
  if (a.length !== 32) throw new Error("Sır anahtarı tanımlı değil (PROBATA_SIR_ANAHTARI, 32 bayt base64)");
  return a;
}

const ek = (firmaId: string, ad: string) => Buffer.from(`probata:sir:v1:${firmaId}:${ad}`, "utf8");

export function sifrele(duz: string, firmaId: string, ad: string, anahtar = anaAnahtar()): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", anahtar, iv);
  c.setAAD(ek(firmaId, ad));
  const govde = Buffer.concat([c.update(duz, "utf8"), c.final()]);
  return `v1.${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${govde.toString("base64url")}`;
}

export function coz(sifreli: string, firmaId: string, ad: string, anahtar = anaAnahtar()): string {
  const [s, iv, etiket, govde] = sifreli.split(".");
  if (s !== "v1" || !iv || !etiket || !govde) throw new Error("Bozuk sır");
  const d = createDecipheriv("aes-256-gcm", anahtar, Buffer.from(iv, "base64url"));
  d.setAAD(ek(firmaId, ad));
  d.setAuthTag(Buffer.from(etiket, "base64url"));
  return Buffer.concat([d.update(Buffer.from(govde, "base64url")), d.final()]).toString("utf8");
}

const firmaKimligi = async (db: Sorgulayici) => {
  const r = (await db.sorgu<{ id: string }>("SELECT gecerli_firma()::text AS id")).rows[0]?.id;
  if (!r) throw new Error("Firma bağlamı yok");
  return r;
};

/** sırrı yazar (ya da duz = null ile kaldırır). İz: yalnız "değişti" ve son 4 — değer asla. */
export async function sirYaz(db: Sorgulayici, ad: SirAdi, duz: string | null, iz: { kim: string }, anahtar = anaAnahtar()): Promise<void> {
  if (!AD.test(ad) || !(SIR_ADLARI as readonly string[]).includes(ad)) throw new Error("Bilinmeyen sır");
  if (duz !== null && (duz.length === 0 || duz.length > 4000)) throw new Error("Geçersiz sır uzunluğu");
  const firmaId = await firmaKimligi(db);
  const sifreli = duz === null ? null : sifrele(duz, firmaId, ad, anahtar);
  const son4 = duz === null ? null : duz.slice(-4);
  await db.sorgu(
    `INSERT INTO firma_sir (ad, sifreli, son4) VALUES ($1, $2, $3)
     ON CONFLICT (firma_id, ad) DO UPDATE SET sifreli = EXCLUDED.sifreli, son4 = EXCLUDED.son4, surum = firma_sir.surum + 1, degisti = now()`,
    [ad, sifreli, son4]);
  await izYaz(db, { ...iz, ne: duz === null ? "ayar.sir_kaldirildi" : "ayar.sir_degisti", nesne: "firma_sir", nesneId: ad, ayrinti: { son4: son4 ?? null } });
}

/** sır tanımlı mı + son 4 (ekranda gösterilecek tek şey) */
export async function sirDurumu(db: Sorgulayici, ad: SirAdi): Promise<{ tanimli: boolean; son4: string | null }> {
  const r = (await db.sorgu<{ son4: string | null; tanimli: boolean }>("SELECT son4, sifreli IS NOT NULL AS tanimli FROM firma_sir WHERE ad = $1", [ad])).rows[0];
  return { tanimli: !!r?.tanimli, son4: r?.tanimli ? r.son4 : null };
}

/** YALNIZ sunucuda, kullanılacağı an: çözülmüş sır (yoksa null) */
export async function sirKullan(db: Sorgulayici, ad: SirAdi, anahtar = anaAnahtar()): Promise<string | null> {
  const r = (await db.sorgu<{ sifreli: string | null }>("SELECT sifreli FROM firma_sir WHERE ad = $1", [ad])).rows[0];
  if (!r?.sifreli) return null;
  return coz(r.sifreli, await firmaKimligi(db), ad, anahtar);
}
