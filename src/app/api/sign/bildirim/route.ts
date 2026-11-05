/* PROBATA SIGN BİLDİRİMİ (2026-11-05, göç 0122) — sign'ın webhook'u buraya gelir: https://<firma>.probata.com.tr/api/sign/bildirim (Yönetim › firma ›
   probata sign ekranı bu adresi gösterir). Firma adresten (alt alan adı); imza (X-Probata-Imza) firmanın webhook sırrıyla doğrulanır; iş modülde
   (raporlar/server/sign.ts signBildirim). Gövde en çok 64 KB. Oturum yok — rapor, imza isteğinin SAHİBİNİN yetkisiyle sonuçlanır. */
import { istekKiracisi } from "../../../../server/kiraci/istek";
import { depo } from "../../../../server/dosya/depo";
import { yedekSonraCalistir } from "../../../../server/yedek/sonra";
import { firmaCalistirici, signBildirim } from "../../../../modules/raporlar/server/sign";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASLIK = { "Cache-Control": "no-store" };
const GOVDE_EN_COK = 64 * 1024;

export async function POST(istek: Request) {
  const k = await istekKiracisi();
  if (!k) return Response.json({ hata: "Firma bulunamadı." }, { status: 404, headers: BASLIK });
  const boy = Number(istek.headers.get("content-length") ?? "0");
  if (boy > GOVDE_EN_COK) return Response.json({ hata: "Gövde çok büyük." }, { status: 413, headers: BASLIK });
  const govde = await istek.text();
  if (govde.length > GOVDE_EN_COK) return Response.json({ hata: "Gövde çok büyük." }, { status: 413, headers: BASLIK });
  const s = await signBildirim(firmaCalistirici(k), depo(), k.firmaId,
    { govde, imza: istek.headers.get("x-probata-imza"), gonderim: istek.headers.get("x-probata-gonderim") });
  if (s.kod === 200 && s.ileti === "tamam") yedekSonraCalistir(k, 25_000);
  return Response.json({ sonuc: s.ileti }, { status: s.kod, headers: BASLIK });
}
