/* FORMUN GÖRÜNTÜSÜ UCU (2026-10-31, kalem 4 — K6; karar 3: ayrı uç, Chromium, 60 sn — S.A.Y'ın ucu Chromium taşımaz). S.A.Y'ın form_goster aracını
   EKRAN çağırır (kullanıcının oturumuyla): raporun işaretli basılı formunun sayfası raporun dosyası olur, kimliği ekrandan S.A.Y'a döner. Kapılar: aynı
   köken, oturum; yetki modülde (raporu gören). */
import { formGoruntusu } from "../../../../modules/raporlar/server/form-goruntusu";
import { depo } from "../../../../server/dosya/depo";
import { istekOturumu, oturumIslemi } from "../../../../server/kimlik/istek";
import { ayniKoken } from "../../../../server/kimlik/koken";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const yanit = (govde: object, status = 200) => Response.json(govde, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(istek: Request) {
  if (!(await ayniKoken())) return yanit({ hata: "koken" }, 403);
  const o = await istekOturumu();
  if (!o) return yanit({ hata: "oturum" }, 401);
  let g: { rapor?: unknown; sayfa?: unknown };
  try { g = await istek.json(); } catch { return yanit({ tamam: false, neden: "İstek okunamadı." }, 400); }
  const rapor = typeof g.rapor === "string" && UUID.test(g.rapor) ? g.rapor : null;
  if (!rapor) return yanit({ tamam: false, neden: "Rapor kimliği geçersiz." }, 400);
  const sayfa = typeof g.sayfa === "number" && Number.isInteger(g.sayfa) && g.sayfa >= 1 ? g.sayfa : 1;
  return yanit(await oturumIslemi(o, (db) => formGoruntusu(db, depo(), o, o.kiraci.firmaId, rapor, sayfa)));
}
