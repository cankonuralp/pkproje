/* S.A.Y ONAY UCU (2026-10-31, kalem 6b — onay kapısı; kural: "onaya, imzaya ya da dışarıya gönderme, silme, yayınlama ve plan kabulü ikinci onay ister").
   Kullanıcı ekrandaki onay penceresinde "Onayla" deyince ekran bunu çağırır: onay, kullanıcının KENDİ konuşmasına sunucunun notu olarak yazılır (yapay
   zekâ yazamaz) — yalnız sunucunun bu konuşmada istediği özet; 10 dakika, tek kullanımlık (src/server/yz/konusma.ts). Kapılar: aynı köken, oturum. */
import { onayYaz } from "../../../../server/yz/konusma";
import { istekOturumu, oturumIslemi } from "../../../../server/kimlik/istek";
import { ayniKoken } from "../../../../server/kimlik/koken";

export const dynamic = "force-dynamic";
const yanit = (govde: object, status = 200) => Response.json(govde, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(istek: Request) {
  if (!(await ayniKoken())) return yanit({ hata: "koken" }, 403);
  const o = await istekOturumu();
  if (!o) return yanit({ hata: "oturum" }, 401);
  let g: { ozet?: unknown; metin?: unknown };
  try { g = await istek.json(); } catch { return yanit({ tamam: false }, 400); }
  const ozet = typeof g.ozet === "string" ? g.ozet : "", metin = typeof g.metin === "string" ? g.metin : "";
  return yanit({ tamam: await oturumIslemi(o, (db) => onayYaz(db, ozet, metin)) });
}
