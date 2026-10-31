/* KULLANIM KOŞULLARI — YAPAY ZEKÂ (S.A.Y) KABULÜ (2026-10-31, kalem 7 — M6; sunum "S.A.Y'a tam yetenek", karar 5: 06'daki madde aynen, ekranlar maket 9;
   göç 0110 kosul_kabul). S.A.Y'a verilen yazı ve belgeler (kişisel belgeler dahil) yapay zekâ hizmetine (Anthropic, ABD) gider: firma yöneticisi firması
   adına, her kullanıcı kendi adına kabul eder. Denetim SUNUCUDA, S.A.Y'a giden her istekte (sayKapisi): güncel sürümün firma ve kişi kabulü yoksa istek
   gitmez. Sürüm tek sabitte; değişince eski kabuller geçersiz, yeniden kabul. Kabul yalnız eklenir (iz). */
import type { Sorgulayici } from "../db/kiraci.ts";

export const KOSUL_YOK = "S.A.Y'ı kullanmadan önce kullanım koşullarının Yapay zekâ (S.A.Y) maddesi kabul edilmeli.";

import { KOSUL_SURUMU } from "../../modules/say/kosul-metni.ts";
export { KOSUL_MADDESI, KOSUL_OZETI, KOSUL_SURUMU } from "../../modules/say/kosul-metni.ts";

export interface KosulDurumu { firma: boolean; kisi: boolean; surum: string }
/** güncel sürümün firma ve kişi kabulü (oturumun kişisi — app.hesap_id) */
export async function kosulDurumu(db: Sorgulayici, surum = KOSUL_SURUMU): Promise<KosulDurumu> {
  const r = (await db.sorgu<{ firma: boolean; kisi: boolean }>(
    `SELECT bool_or(tur = 'firma') AS firma, bool_or(tur = 'kullanici' AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid) AS kisi
       FROM kosul_kabul WHERE surum = $1`, [surum])).rows[0];
  return { firma: !!r?.firma, kisi: !!r?.kisi, surum };
}
export const kosulTamam = (d: KosulDurumu) => d.firma && d.kisi;

/** kabul: firma kabulünü yalnız firma yöneticisi, kullanıcı kabulünü firma kabulünden sonra herkes; dönen: yapılamadıysa nedeni */
export async function kosulKabulEt(db: Sorgulayici, kim: { roller: readonly string[] }, tur: "firma" | "kullanici"): Promise<string | null> {
  const d = await kosulDurumu(db);
  if (tur === "firma") {
    if (!kim.roller.includes("firma_yoneticisi")) return "Koşulları firma adına yalnız firma yöneticisi kabul eder.";
    if (!d.firma) await db.sorgu("INSERT INTO kosul_kabul (tur, surum) VALUES ('firma', $1)", [KOSUL_SURUMU]);
    if (!d.kisi) await db.sorgu("INSERT INTO kosul_kabul (tur, surum) VALUES ('kullanici', $1)", [KOSUL_SURUMU]);
    return null;
  }
  if (!d.firma) return "S.A.Y, firma yöneticiniz kullanım koşullarını kabul edince açılır.";
  if (!d.kisi) await db.sorgu("INSERT INTO kosul_kabul (tur, surum) VALUES ('kullanici', $1)", [KOSUL_SURUMU]);
  return null;
}
