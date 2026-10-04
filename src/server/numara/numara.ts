/* ══ NUMARA ÜRETİCİ — tek üretici (pkproje §3.5 · KOD-GECIS §6) ══════════════════════════════════════════════════════
   Proje ve rapor numarasını kimse elle yazmaz; numara yalnız burada, kaydı oluşturan işlemin İÇİNDE alınır (sayaç 0004_numara.sql):
   · Proje `P-AAYY-SIRA` — AAYY planın açıldığı ay (Türkiye saati), SIRA o ayda 001'den.
   · Rapor `XX-AAYY-SIRA-EK` — XX firmanın rapor kodu, SIRA firmada kesintisiz (ayla sıfırlanmaz), EK 5 hane rasgele (tahmin edilemez).
     Revizyon: aynı numara + `-R1`, `-R2` …
   · Teklif `T-` · sözleşme `IS-` · gider `G-` · izin `I-` + `AAYY-SIRA` (aylık). Önek firma ayarıyla değişebilir (§3.7 satır 8).
   Kayıt oluşturan işlem geri alınırsa sıra da geri alınır (boşluk kalmaz); verilmiş numara yeniden verilmez. */
import { randomBytes } from "node:crypto";
import type { Sorgulayici } from "../db/kiraci.ts";

export const NUMARA_TURLERI = {
  proje: { onek: "P", donem: "ay" },
  rapor: { onek: "", donem: "yok" },
  teklif: { onek: "T", donem: "ay" },
  sozlesme: { onek: "IS", donem: "ay" },
  gider: { onek: "G", donem: "ay" },
  izin: { onek: "I", donem: "ay" },
} as const;
export type NumaraTuru = keyof typeof NUMARA_TURLERI;

const ONEK = /^[A-Z]{1,4}$/;
const AY = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", month: "2-digit", year: "2-digit" });

/** "AAYY" — Türkiye saatine göre ay ve yıl (UTC gece yarısı ayı kaydırmasın: 30 Eylül 23:30 TSİ = Eylül) */
export function aayy(t: Date): string {
  const p = Object.fromEntries(AY.formatToParts(t).map((x) => [x.type, x.value]));
  return `${p.month}${p.year}`;
}

export const sira = (n: number) => String(n).padStart(3, "0");

/** sayaçtan sıradaki numara (işlemin içinde; aynı anda alan ikinci işlem ilki bitene kadar bekler) */
async function siradaki(db: Sorgulayici, tur: NumaraTuru, donem: string): Promise<number> {
  const r = await db.sorgu<{ son: number }>(
    `INSERT INTO numara_sayaci (tur, donem, son) VALUES ($1, $2, 1)
     ON CONFLICT (firma_id, tur, donem) DO UPDATE SET son = numara_sayaci.son + 1 RETURNING son`, [tur, donem]);
  return r.rows[0].son;
}

export interface NumaraSecenegi {
  simdi?: Date;
  /** firma ayarındaki önek (yoksa varsayılan) */
  onek?: string;
}

/** Proje / teklif / sözleşme / gider / izin numarası: ÖNEK-AAYY-SIRA */
export async function numaraAl(db: Sorgulayici, tur: Exclude<NumaraTuru, "rapor">, s: NumaraSecenegi = {}): Promise<string> {
  const onek = s.onek ?? NUMARA_TURLERI[tur].onek;
  if (!ONEK.test(onek)) throw new Error(`Geçersiz numara öneki: ${onek}`);
  const donem = aayy(s.simdi ?? new Date());
  return `${onek}-${donem}-${sira(await siradaki(db, tur, donem))}`;
}

/** Rapor numarası: XX-AAYY-SIRA-EK (XX firmanın rapor kodu, veritabanından; SIRA kesintisiz) */
export async function raporNoAl(db: Sorgulayici, s: { simdi?: Date } = {}): Promise<string> {
  const kod = (await db.sorgu<{ rapor_kodu: string }>("SELECT rapor_kodu FROM firma WHERE id = gecerli_firma()")).rows[0]?.rapor_kodu;
  if (!kod) throw new Error("Firma bağlamı yok");
  const n = await siradaki(db, "rapor", "");
  return `${kod}-${aayy(s.simdi ?? new Date())}-${sira(n)}-${randomBytes(3).toString("hex").slice(0, 5)}`;
}

const RAPOR_NO = /^[A-Z]{2}-\d{4}-\d{3,}-[0-9a-f]{5}$/;
/** revizyon: aynı numara + -R1, -R2 … (yalnız asıl numaradan) */
export function revizyonNo(raporNo: string, n: number): string {
  if (!RAPOR_NO.test(raporNo)) throw new Error(`Geçersiz rapor numarası: ${raporNo}`);
  if (!Number.isSafeInteger(n) || n < 1) throw new Error("Geçersiz revizyon");
  return `${raporNo}-R${n}`;
}
