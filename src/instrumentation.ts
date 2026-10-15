/* SUNUCU İSTEK HATASI (567; 06-HATA-TAKIBI — tarayıcıdaki dinleyicinin sunucu karşılığı): Next sunucusunun yakaladığı her istek hatası (sayfa
   çizimi, sunucu eylemi, uç, ara katman) hata kaydına (göç 0093) düşer. İstek başlıkları (çerez, oturum) YAZILMAZ: yalnız yol (sorgusuz), yöntem,
   rota, firmanın kısa adı (Host'tan). Kayıt yolu hata fırlatmaz. Yalnız Node çalışma ortamında (veritabanı bağlantısı orada). */
import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (hata, istek, baglam) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const [{ hataKaydet }, { kiraciAdiCoz }] = await Promise.all([import("./server/hata/kaydet"), import("./server/kiraci/coz")]);
    /* ana alan server/kiraci/istek.ts anaAlan ile aynı (o dosya "server-only" — burada içe aktarılmaz) */
    const anaAlan = () => process.env.PROBATA_ANA_ALAN || "localhost";
    const e = hata instanceof Error ? hata : null;
    const ozet = typeof hata === "object" && hata !== null && "digest" in hata ? ` (kod ${String((hata as { digest: unknown }).digest).slice(0, 16)})` : "";
    const host = istek.headers.host;
    await hataKaydet({
      kaynak: "sunucu", mesaj: `${e ? `${e.name}: ${e.message}` : String(hata)}${ozet}`, yigin: e?.stack ?? null, adres: istek.path,
      yer: `${istek.method} ${baglam.routePath} · ${baglam.routeType}`, alan: kiraciAdiCoz(Array.isArray(host) ? host[0] : host ?? "", anaAlan()),
    });
  } catch (e) {
    console.error("[hata kaydı] sunucu hatası yazılamadı:", e instanceof Error ? e.message : String(e));
  }
};
