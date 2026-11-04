/* AYLIK YEDEK DOĞRULAMASI (2026-11-04; sunum K5, maket "Firma sayfası › Yedek" — "son doğrulama"). Alınan yedek gerçekten açılıyor mu:
   1. Kaynak: firmanın Drive'ı bağlıysa oradan, değilse probata arşivinden; tam kopya + aylık dosyalar indirilir, açılır, firmanın hâli kurulur
      (hal.ts) — canlı veriye dokunulmaz.
   2. Tablo başına kayıt sayısı canlıyla karşılaştırılır; fark, hâlin anından sonra değişen kayıt sayısını (değişiklik kaydı) aşamaz.
   3. Drive'da: gönderilmiş PDF'lerden en çok DOGRULA_PDF tanesi indirilir — boyutu tutmalı, "%PDF" ile başlamalı.
   Sonuç yedek_dogrulama'ya (göç 0119); sorun çıkarsa firma yöneticilerine BİR e-posta (sorun sürdükçe yeniden gitmez). Gece işi ayda bir çalıştırır
   (dogrulamaVakti); Yönetim'den "Şimdi doğrula". */
import type { Havuz, Sorgulayici } from "../db/kiraci.ts";
import { kiraciIcinde } from "../db/kiraci.ts";
import type { Depo } from "../dosya/depo.ts";
import { epostaKuyruga } from "../eposta/eposta.ts";
import { firmaGonderimi } from "../eposta/firma.ts";
import { bekleyenleriGonder } from "../eposta/gonder.ts";
import { gonderenListesi } from "../kimlik/hesap.ts";
import { BulutHatasi, BulutKopuk, BulutYetki, type BulutHizmeti } from "../dis/bulut.ts";
import { arsivdenHal, driveErisimi, drivedenHal, drivedenIndir, HalHatasi, type YedekHali } from "./hal.ts";
import { YEDEK_TABLOLARI } from "./tablolar.ts";

export const DOGRULA_PDF = 3;
export const DOGRULA_GUN = 30;

export interface DogrulamaOzeti {
  tablo: number; kayit: number;
  pdf: { denenen: number; acilan: number };
  /** en çok 20 sorun */
  sorunlar: string[];
  /** okunan yedek dosyaları */
  dosyalar: string[];
  /** hâlin anı (ISO) */
  an: string | null;
}
export interface DogrulamaSonucu { kaynak: "drive" | "arsiv"; tamam: boolean; ozet: DogrulamaOzeti }

/** son doğrulamanın üstünden DOGRULA_GUN geçti mi (hiç yapılmadıysa evet) */
export async function dogrulamaVakti(db: Sorgulayici, simdi: Date): Promise<boolean> {
  const z = (await db.sorgu<{ z: Date }>("SELECT zaman AS z FROM yedek_dogrulama ORDER BY zaman DESC LIMIT 1")).rows[0]?.z;
  return !z || simdi.getTime() - z.getTime() > DOGRULA_GUN * 864e5;
}

/** SAF: kurulan hâl ↔ canlı sayılar; tolerans: hâlin anından sonra değişen kayıt (tablo başına) */
export function sayilariKarsilastir(hal: Readonly<Record<string, readonly unknown[]>>, canli: Readonly<Record<string, number>>,
  sonra: Readonly<Record<string, number>>): string[] {
  const s: string[] = [];
  for (const t of Object.keys(YEDEK_TABLOLARI)) {
    const y = hal[t]?.length ?? 0, c = canli[t] ?? 0, tol = sonra[t] ?? 0;
    if (Math.abs(y - c) > tol) s.push(`${t}: yedekte ${y}, şu an ${c}`);
  }
  return s;
}

export async function firmaDogrula(h: Havuz, firmaId: string, depo: Depo,
  s: { simdi?: Date; hizmetBul: (x: "gdrive" | "onedrive") => BulutHizmeti | null }): Promise<DogrulamaSonucu> {
  const simdi = s.simdi ?? new Date();
  const ozet: DogrulamaOzeti = { tablo: 0, kayit: 0, pdf: { denenen: 0, acilan: 0 }, sorunlar: [], dosyalar: [], an: null };
  let kaynak: "drive" | "arsiv" = "arsiv";
  let hal: YedekHali | null = null;
  try {
    const d = await driveErisimi(h, firmaId, s.hizmetBul);
    if (d) {
      kaynak = "drive";
      hal = await drivedenHal(h, firmaId, d, simdi);
      /* PDF örneği: gönderilmiş PDF'lerden rastgele */
      const ornek = await kiraciIcinde(h, firmaId, (db) => db.sorgu<{ yol: string[]; ad: string; boyut: string | null }>(
        "SELECT yol, ad, boyut::text FROM bulut_kuyruk WHERE durum = 'gonderildi' AND ad LIKE '%.pdf' ORDER BY random() LIMIT $1", [DOGRULA_PDF]));
      for (const o of ornek.rows) {
        ozet.pdf.denenen++;
        const b = await drivedenIndir(h, firmaId, d, { yol: o.yol, ad: o.ad }, 60 * 1024 * 1024);
        const ok = !!b && (o.boyut === null || b.length === Number(o.boyut)) && new TextDecoder().decode(b.subarray(0, 5)) === "%PDF-";
        if (ok) ozet.pdf.acilan++; else ozet.sorunlar.push(`${o.ad}: Drive'da açılmadı`);
      }
    } else {
      hal = await arsivdenHal(h, firmaId, depo, simdi);
    }
  } catch (e) {
    if (e instanceof HalHatasi) ozet.sorunlar.push(e.message);
    else if (e instanceof BulutKopuk || e instanceof BulutYetki) ozet.sorunlar.push("Drive bağlantısı kopuk");
    else if (e instanceof BulutHatasi) ozet.sorunlar.push(`Drive yanıt vermedi (${e.durum})`);
    else if (e instanceof Error && /ZIP|zip/.test(e.message)) ozet.sorunlar.push("yedek dosyası açılmadı");
    else throw e;
  }
  if (hal) {
    ozet.dosyalar = hal.dosyalar.slice(0, 30);
    ozet.an = hal.an.toISOString();
    ozet.tablo = Object.keys(hal.tablolar).length;
    ozet.kayit = Object.values(hal.tablolar).reduce((n, l) => n + l.length, 0);
    const an = hal.an;
    const { canli, sonra } = await kiraciIcinde(h, firmaId, async (db) => {
      const canli: Record<string, number> = {};
      for (const t of Object.keys(YEDEK_TABLOLARI)) {
        if (!/^[a-z_]{1,40}$/.test(t)) continue;
        canli[t] = (await db.sorgu<{ n: number }>(`SELECT count(*)::int AS n FROM ${t}`)).rows[0]!.n;
      }
      const sonra = Object.fromEntries((await db.sorgu<{ tablo: string; n: number }>(
        "SELECT tablo, count(*)::int AS n FROM yedek_degisiklik WHERE zaman > $1 GROUP BY tablo", [an])).rows.map((x) => [x.tablo, x.n]));
      return { canli, sonra };
    });
    ozet.sorunlar.push(...sayilariKarsilastir(hal.tablolar, canli, sonra));
  }
  ozet.sorunlar = ozet.sorunlar.slice(0, 20);
  const tamam = ozet.sorunlar.length === 0;
  await kiraciIcinde(h, firmaId, async (db) => {
    const once = (await db.sorgu<{ tamam: boolean; bildirildi: boolean }>("SELECT tamam, bildirildi FROM yedek_dogrulama ORDER BY zaman DESC LIMIT 1")).rows[0];
    const bildir = !tamam && !(once && !once.tamam && once.bildirildi);
    const id = (await db.sorgu<{ id: string }>("INSERT INTO yedek_dogrulama (kaynak, tamam, ozet, bildirildi, zaman) VALUES ($1, $2, $3, $4, $5) RETURNING id::text",
      [kaynak, tamam, ozet, bildir || (!!once && !once.tamam && once.bildirildi && !tamam), simdi])).rows[0]!.id;
    if (bildir) await sorunBildir(db, id, ozet);
  });
  return { kaynak, tamam, ozet };
}

/** doğrulama sorunu: firma yöneticilerine bir e-posta */
async function sorunBildir(db: Sorgulayici, id: string, o: DogrulamaOzeti): Promise<void> {
  const kime = (await gonderenListesi(db)).filter((x) => x.roller.includes("firma_yoneticisi")).map((x) => x.eposta);
  if (!kime.length) return;
  await epostaKuyruga(db, {
    kime, kaynak: "yedek", kaynakId: id,
    konu: `Yedek doğrulaması: ${o.sorunlar.length} sorun`,
    govde: ["Firmanızın yedeği doğrulanırken sorun bulundu:", "", ...o.sorunlar.map((x) => `· ${x}`), "",
      "Eksik dosyalar bu gece yeniden gönderilir. Sorun sürerse Firma ayarları › Yedek'ten bağlantıyı denetleyin."].join("\n"),
  }, { kim: "probata", ne: "yedek.dogrulama_bildirildi" });
  await bekleyenleriGonder(db, await firmaGonderimi(db), { kaynak: "yedek", kaynakId: id });
}
