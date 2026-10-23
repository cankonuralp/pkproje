/* S.A.Y UCU (2026-10-23 — S.A.Y baştan; reisim: "say asistanı direk claude da haiku nasıl çalışıyor ise direk o şekilde çalıştıramaz mıyız"):
   soru, ekranın sonucu ya da devam → akışlı yanıt (satır başına bir JSON olay — src/modules/say/server/dongu.ts SayOlayi). Kapılar: aynı köken,
   oturum; işin kendisi ve yetki modülde. İşlev süresi barındırmanın en uzunu; dolmak üzereyse iş "devam" olayıyla yeni istekte sürer. Önbellek yok. */
import { sayAkisi, type SayOlayi } from "../../../modules/say/server/dongu";
import { hataKaydet } from "../../../server/hata/kaydet";
import { istekOturumu } from "../../../server/kimlik/istek";
import { ayniKoken } from "../../../server/kimlik/koken";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const yanit = (govde: object, status: number) => Response.json(govde, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(istek: Request) {
  if (!(await ayniKoken())) return yanit({ hata: "koken" }, 403);
  const o = await istekOturumu();
  if (!o) return yanit({ hata: "oturum" }, 401);
  let ham: unknown;
  try { ham = await istek.json(); } catch { return yanit({ hata: "gecersiz" }, 400); }
  const bitis = Date.now() + (300 - 15) * 1000;
  const kodla = new TextEncoder();
  const akis = new ReadableStream<Uint8Array>({
    async start(c) {
      /* bağlantı koptuysa yazma yutulur — iş sürer, konuşma kaydedilir */
      const yaz = (x: SayOlayi) => { try { c.enqueue(kodla.encode(`${JSON.stringify(x)}\n`)); } catch { /* bağlantı yok */ } };
      try { await sayAkisi(o, ham, yaz, bitis); }
      catch (e) {
        void hataKaydet({ kaynak: "sunucu", mesaj: e instanceof Error ? e.message : String(e), yigin: e instanceof Error ? e.stack ?? null : null,
          yer: "api.say", alan: o.kiraci.kisaAd, hesap: o.id });
        yaz({ t: "hata", neden: "S.A.Y'da beklenmeyen bir sorun oldu; yeniden deneyin.", yenile: false });
      } finally { try { c.close(); } catch { /* kapalı */ } }
    },
  });
  return new Response(akis, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}
