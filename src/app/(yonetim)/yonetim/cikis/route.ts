/* YÖNETİM ÇIKIŞI (355) — düz form isteği (POST; menüdeki "Çıkış yap" ve giriş adımlarındaki "Girişe dön"). Oturum kapanır, tarayıcı girişe yönlenir:
   303 + GÖRELİ adres — tarayıcı kendi adresini (yönetim adresi) korur. Sunucu eyleminin redirect()'i Next'in kendi kökeninden yeniden çizildiği için
   yönetim adresi kayboluyor, çıkış sonrası sayfa 404 oluyordu (14b1bf8 uçtan uca, üç genişlik). Kapı ve iş istek.ts'te: başka adreste 404, başka
   kökenden gelen istek oturumu kapatmaz. */
import { yonetimOturumunuKapat } from "../../../../server/yonetim/istek";

export async function POST(): Promise<Response> {
  const r = await yonetimOturumunuKapat();
  if (r === "adres") return new Response("Bulunamadı", { status: 404 });
  return new Response(null, { status: 303, headers: { Location: r === "tamam" ? "/yonetim/giris?neden=cikis" : "/yonetim/giris", "Cache-Control": "no-store" } });
}
