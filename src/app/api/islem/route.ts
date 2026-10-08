/* ÇEVRİMDIŞI İŞLEM UCU (392; 09-D2, ARKA-UC §4.3 çıkış kuyruğu) — cihazın kuyruğundaki iş (rapor Kaydet, Onaya gönder) kimliğiyle gelir ve bir
   kez uygulanır (src/server/islem/islem.ts; aynı kimlik yeniden gelirse saklanan sonuç). Kapılar sırayla: aynı köken (kiracılar arası sahte istek
   yok), JSON, gövde sınırı, biçim, oturum; işi yazanın etiketi oturumdaki kişininki değilse işlenmez (09-D2 — cihaz işi saklar, o hesapla
   girilince gider; etiket server/islem/yazan.ts, kimlik tarayıcıya gitmez). Yetki, kurallar ve sürüm kilidi modül işlevinde
   (raporlar/server/islem-baglanti.ts). Cihaz saati sunucudan 10 dakikadan fazla saparsa
   yanıtta söylenir (ARKA-UC §4.5; resmî alanlar zaten sunucu saatinden). Önbellek yok. */
import { RAPOR_ISLEM_TURLERI, raporGuncelSurum, raporIslemi } from "../../../modules/raporlar/server/islem-baglanti";
import { kimlik, surum, z } from "../../../sema/ortak";
import { tekSeferlik } from "../../../server/islem/islem";
import { YAZAN_BICIMI, yazanEtiketi } from "../../../server/islem/yazan";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { ayniKoken } from "../../../server/kimlik/koken";

export const dynamic = "force-dynamic";

const BASLIK = { "Cache-Control": "no-store" };
/** rapor cevapları en çok 2 MB (0025) + zarf */
const GOVDE_SINIR = 3 * 1024 * 1024;
const SAAT_FARKI_DK = 10;

const Govde = z.object({
  id: kimlik, tur: z.enum(RAPOR_ISLEM_TURLERI), kayit: kimlik, yazan: z.string().regex(YAZAN_BICIMI), surum, girdi: z.unknown(),
  zaman: z.iso.datetime({ offset: true }).nullable(),
});
const yanit = (govde: object, status = 200) => Response.json(govde, { status, headers: BASLIK });

export async function POST(istek: Request) {
  if (!(await ayniKoken())) return yanit({ hata: "koken" }, 403);
  if (!(istek.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return yanit({ hata: "tur" }, 415);
  if (Number(istek.headers.get("content-length") ?? 0) > GOVDE_SINIR) return yanit({ hata: "buyuk" }, 413);
  const metin = await istek.text();
  if (metin.length > GOVDE_SINIR) return yanit({ hata: "buyuk" }, 413);
  let ham: unknown;
  try { ham = JSON.parse(metin); } catch { return yanit({ hata: "gecersiz" }, 400); }
  const g = Govde.safeParse(ham);
  if (!g.success) return yanit({ hata: "gecersiz" }, 400);
  const o = await istekOturumu();
  if (!o) return yanit({ hata: "oturum" }, 401);
  const b = g.data;
  if (b.yazan !== yazanEtiketi(o.id)) return yanit({ hata: "baska_hesap" }, 409);
  const { s, guncel } = await oturumIslemi(o, async (db) => {
    const s = await tekSeferlik(db, { id: b.id, tur: b.tur, kayit: b.kayit, zaman: b.zaman }, () => raporIslemi(db, o, b.tur, b.kayit, b.surum, b.girdi));
    /* çakışmada güncel sürüm ("benimkini yaz" seçilirse cihaz bununla yeni kimlik gönderir) */
    return { s, guncel: s.durum !== "kimlik_kullanildi" && s.sonuc.durum === "cakisma" ? await raporGuncelSurum(db, b.kayit) : null };
  });
  if (s.durum === "kimlik_kullanildi") return yanit({ hata: "kimlik" }, 409);
  const cihaz = Number(istek.headers.get("x-probata-saat"));
  const fark = Number.isFinite(cihaz) && cihaz > 0 ? Math.round((cihaz - Date.now()) / 60_000) : 0;
  return yanit({ tekrar: s.durum === "tekrar", sonuc: s.sonuc, ...(guncel !== null ? { guncel } : {}), ...(Math.abs(fark) > SAAT_FARKI_DK ? { saatFarkiDk: fark } : {}) });
}
