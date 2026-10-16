/* DOĞRULAMA SAYFASININ OKUMASI (595 K8): kod bu firmanın ve bu revizyonun değilse (ya da sır anahtarı yoksa) "bulunamadı" — neden söylenmez;
   geçerliyse oturumsuz, salt okunur işlemde raporun imzalı sürümünün kimliği (server/dogrulama.ts). */
import { dogrulamaCoz } from "../../../server/dogrulama.ts";
import { acikOkuma } from "../../../server/kiraci/acik.ts";
import type { IstekKiracisi } from "../../../server/kiraci/istek.ts";
import { raporDogrulamaBilgisi, type RaporDogrulama } from "./dogrulama.ts";

export async function raporuDogrula(kiraci: IstekKiracisi | null, kod: string): Promise<RaporDogrulama> {
  if (!kiraci || kod.length > 120) return { durum: "yok" };
  let c: ReturnType<typeof dogrulamaCoz> = null;
  try { c = dogrulamaCoz(kod, kiraci.firmaId); } catch { return { durum: "yok" }; }
  if (!c) return { durum: "yok" };
  const { raporId, revizyon } = c;
  return acikOkuma(kiraci, (db) => raporDogrulamaBilgisi(db, raporId, revizyon));
}
