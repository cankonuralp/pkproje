/* "Sonrası firmanın kendi sitesinde" (maket yonetim.html firmaCiz) — firma aç sonucu ve firma sayfası aynı metni gösterir. 2026-10-16 (FIRMA-VT FV10–FV11,
   K1 / K2): "kendi Supabase hesabını bağlar" kalktı (proje panelden kurulur); e-posta gönderimi Yönetim'den. */
import { Cerceve } from "./ortak";
import stil from "./yonetim.module.css";

export function SonrasiAdimlar({ ciplak = false }: { ciplak?: boolean } = {}) {
  return (
    <Cerceve ciplak={ciplak} id="y-b-sonra" baslik="Sonrası firmanın kendi sitesinde">
      <ol className={stil.adimlar}>
        <li>Firma yöneticisi adrese girer, geçici parolayla kendi parolasını belirler.</li>
        <li>E-posta gönderimi (firma sayfasında): probata&apos;nın alan adı üzerinden tek tuşla ya da firmanın kendi alan adından (DNS kayıtları, &quot;Doğrula&quot;).</li>
        <li>Firma ayarları: logo, künye, imza yöntemi, rapor formatları.</li>
        <li>Firma ayarları › Toplu içe aktarma: müşteriler ve tesisler, ekipmanlar, ölçüm cihazları, personel, araçlar (Excel).</li>
        <li>Personel&apos;den öteki kullanıcıların hesapları açılır.</li>
      </ol>
    </Cerceve>
  );
}
