/* PERSONEL → S.A.Y CHAT (524; pkproje §3.10 m.3 "Mekanik denetçi yalnız mekanik, elektrik denetçisi yalnız elektrik görür") — kişinin branşı mesleğinden
   (sabit tanım meslekler: b = m | e; teknisyen / diğer: branşsız). Yetki ÇAĞIRANDA (S.A.Y Chat yalnız plan ekibindeki kişinin kendi personelini sorar). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { meslek } from "../sema.ts";

export async function personelBransi(db: Sorgulayici, personelId: string | null): Promise<"m" | "e" | null> {
  if (!personelId) return null;
  const m = (await db.sorgu<{ meslek: string }>("SELECT meslek FROM personel WHERE id = $1", [personelId])).rows[0]?.meslek;
  const b = m ? meslek(m)?.b : "";
  return b === "m" || b === "e" ? b : null;
}
