/* S.A.Y EK UCU (2026-10-23 — S.A.Y baştan): dosyanın bir parçası (gövde: baytlar; başlıklar: x-yukleme, x-sira, x-adet, x-ad, x-tablo). Kapılar:
   aynı köken, oturum, parçanın biçimi; birleştirme, tür, yükleme ve kayıt modülde (src/modules/say/server/ek-yukle.ts). Önbellek yok. */
import { after } from "next/server";
import { ekParcasiOku, sayEkParcasi } from "../../../../modules/say/server/ek-yukle";
import { istekOturumu } from "../../../../server/kimlik/istek";
import { ayniKoken } from "../../../../server/kimlik/koken";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const yanit = (govde: object, status = 200) => Response.json(govde, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(istek: Request) {
  if (!(await ayniKoken())) return yanit({ hata: "koken" }, 403);
  const o = await istekOturumu();
  if (!o) return yanit({ hata: "oturum" }, 401);
  const h = istek.headers;
  const p = ekParcasiOku({ yukleme: h.get("x-yukleme"), sira: h.get("x-sira"), adet: h.get("x-adet"), ad: h.get("x-ad"), tablo: h.get("x-tablo") });
  if (!p) return yanit({ hata: "gecersiz" }, 400);
  /* 2026-10-31 (L4): fotoğrafın ön okuması yanıttan sonra (yükleme beklemez) */
  return yanit(await sayEkParcasi(o, p, new Uint8Array(await istek.arrayBuffer()), (is) => after(is)));
}
