/* DOĞRULAMA SAYFASININ OKUMASI (595 K8): kod bu firmanın ve bu revizyonun değilse (ya da sır anahtarı yoksa) "bulunamadı" — neden söylenmez;
   geçerliyse oturumsuz, salt okunur işlemde raporun imzalı sürümünün kimliği (server/dogrulama.ts). 2026-10-17 (reisim: "rapor doğrulama ekranında
   raporun kendisi de gözüksün"): imzalı PDF de — yalnız kısa ömürlü jetonla (src/server/dogrulama.ts pdfJetonu), saklama süresi dolmadıysa. */
import { dogrulamaCoz, pdfJetonu, pdfJetonuGecerli } from "../../../server/dogrulama.ts";
import { depo } from "../../../server/dosya/depo.ts";
import { acikOkuma } from "../../../server/kiraci/acik.ts";
import type { IstekKiracisi } from "../../../server/kiraci/istek.ts";
import { raporDogrulamaBilgisi, raporDogrulamaPdf, type RaporDogrulama } from "./dogrulama.ts";

const coz = (kiraci: IstekKiracisi | null, kod: string) => {
  if (!kiraci || kod.length > 120) return null;
  try { return dogrulamaCoz(kod, kiraci.firmaId); } catch { return null; }
};

export async function raporuDogrula(kiraci: IstekKiracisi | null, kod: string): Promise<RaporDogrulama> {
  const c = coz(kiraci, kod);
  if (!kiraci || !c) return { durum: "yok" };
  return acikOkuma(kiraci, (db) => raporDogrulamaBilgisi(db, c.raporId, c.revizyon));
}

/** sayfadaki PDF'in kısa ömürlü adresi (sır anahtarı yoksa null) */
export function dogrulamaPdfAdresi(kiraci: IstekKiracisi | null, kod: string): string | null {
  if (!kiraci || !coz(kiraci, kod)) return null;
  try { return `/dogrula/${encodeURIComponent(kod)}/pdf?t=${pdfJetonu(kiraci.firmaId, kod)}`; } catch { return null; }
}

/** jetonlu istekte imzalı PDF (kod ya da jeton tutmazsa, rapor imzasızsa, PDF silindiyse null) */
export async function dogrulamaPdfi(kiraci: IstekKiracisi | null, kod: string, jeton: string): Promise<Uint8Array | null> {
  const c = coz(kiraci, kod);
  if (!kiraci || !c || jeton.length > 80) return null;
  try { if (!pdfJetonuGecerli(jeton, kiraci.firmaId, kod)) return null; } catch { return null; }
  return acikOkuma(kiraci, (db) => raporDogrulamaPdf(db, depo(), c.raporId, c.revizyon));
}
