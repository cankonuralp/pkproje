/* FOTOĞRAF ÖN OKUMASI — ÇAĞRI (2026-11-07; on-okuma.ts'ten ayrıldı): oturum katmanına (next/headers) bağlı değil — S.A.Y'ın ekinin ön okuması
   (on-okuma.ts fotoOnOku) ve S.A.Y Chat'in "chatten oku"su (say-chat/server/oku.ts) aynı çağrıyı kullanır. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { anthropicCagir } from "../../../server/yz/okuma.ts";
import { sayMaliyeti } from "../../../server/yz/say.ts";
import type { OnOkuma } from "../malzeme.ts";
import { ON_OKUMA_YANIT, onOkumaCoz, onOkumaIstegi } from "../on-okuma.ts";
import { cagriBirak, cagriKapat, kucukCagriAyir, sayKapisi } from "./say.ts";

/** bir fotoğrafın ön okuması (S.A.Y kapısı açık, kişinin sınırından küçük ayırma) — islet: kişinin kiracı işlemi (her adım ayrı, çağrı işlemin DIŞINDA).
    Okunamadıysa ya da kapı kapalıysa null. 2026-11-07: S.A.Y Chat'in "chatten oku"su da bununla (fotoğraf başına bir kez, sonuç mesajda saklanır). */
export async function onOkumaYap(islet: <T>(is: (db: Sorgulayici) => Promise<T>) => Promise<T>, bayt: Uint8Array, mime: string): Promise<OnOkuma | null> {
  const h = await islet(async (db) => {
    const k = await sayKapisi(db);
    if (k.durum === "red") return null;
    const a = await kucukCagriAyir(db, k.model, k.sinir, Math.ceil(bayt.length / 600) + 3_000, ON_OKUMA_YANIT);
    return a ? { k, a } : null;
  });
  if (!h) return null;
  const y = await anthropicCagir(onOkumaIstegi(h.k.model, bayt, mime), h.k.anahtar, 45_000);
  if (y.durum === "hata") { await islet((db) => cagriBirak(db, h.a, y.ucret === "bilinmiyor")); return null; }
  const c = onOkumaCoz(y.govde);
  await islet((db) => cagriKapat(db, h.a, sayMaliyeti(h.k.model, c.usage).maliyet, 0));
  return c.okuma;
}
