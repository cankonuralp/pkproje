/* BULUT İZNİNDEN DÖNÜŞ (2026-11-03; firmanın kendi yedeği) — Google / Microsoft izin ekranı tarayıcıyı buraya yollar (?code=…&state=…; reddedilirse
   ?error=…). Dönüş adresi hizmette TEK kayıtlıdır (PROBATA_BULUT_DONUS); istek başka firmanın adresine geldiyse durumdaki kısa adın adresine
   yönlenir (yalnız probata'nın firma adresi — kısa ad biçimi denetli, aynı adrese döngü yok). Firmanın adresinde: oturum şart, izin kaydı tek
   kullanımlık ve başlatan kişiye bağlı (src/server/yedek/baglan.ts); yetki Firma ayarları "yaz". Sonuç Firma ayarları sayfasına kısa kodla döner
   (?yedek=bagli | iptal | suresi | baskasi | hizmet | izin | oturum) — URL'de serbest metin yok. Bağlanınca ilk kopya yanıttan sonra başlar. */
import { ayarlarYazar } from "../../../../modules/firma-ayarlari/server/ayarlar";
import { firmaAdresi, istekKiracisi } from "../../../../server/kiraci/istek";
import { istekOturumu, oturumIslemi } from "../../../../server/kimlik/istek";
import { baglanBitir, durumCoz } from "../../../../server/yedek/baglan";
import { yedekSonraCalistir } from "../../../../server/yedek/sonra";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASLIK = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
const yonlen = (adres: string) => new Response(null, { status: 303, headers: { ...BASLIK, Location: adres } });

export async function GET(istek: Request) {
  const u = new URL(istek.url);
  const c = durumCoz(u.searchParams.get("state") ?? "");
  if (!c) return new Response("Geçersiz istek.", { status: 400, headers: BASLIK });
  const hedef = firmaAdresi(c.kisaAd);
  const k = await istekKiracisi();
  if (!k || k.kisaAd !== c.kisaAd) {
    if (new URL(hedef).host === (istek.headers.get("host") ?? "")) return new Response("Firma bulunamadı.", { status: 404, headers: BASLIK });
    return yonlen(`${hedef}/api/bulut/donus${u.search}`);
  }
  /* aynı adreste: göreli yönlendirme (yerelde kapı numarası korunur) */
  const sonuc = (s: string) => yonlen(`/firma-ayarlari?yedek=${s}`);
  const o = await istekOturumu();
  if (!o) return sonuc("oturum");
  if (!ayarlarYazar(o)) return sonuc("yetki");
  const kod = u.searchParams.get("code") ?? "";
  if (u.searchParams.has("error") || !/^[\x21-\x7e]{1,2048}$/.test(kod)) return sonuc("iptal");
  const r = await oturumIslemi(o, (db) => baglanBitir(db, { kod: c.kod, yetkiKodu: kod, hesapId: o.id, kim: o.ad }));
  if (r === "bagli") yedekSonraCalistir(o.kiraci);
  return sonuc(r);
}
