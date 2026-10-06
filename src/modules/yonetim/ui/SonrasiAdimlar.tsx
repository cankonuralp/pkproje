/* "Sonrası firmanın kendi sitesinde" (maket yonetim.html firmaCiz) — firma aç sonucu ve firma sayfası aynı metni gösterir. */
import { Bolum } from "../../../components/sayfa/Sayfa";
import stil from "./yonetim.module.css";

export function SonrasiAdimlar() {
  return (
    <Bolum id="y-b-sonra" baslik="Sonrası firmanın kendi sitesinde">
      <ol className={stil.adimlar}>
        <li>Firma yöneticisi adrese girer, geçici parolayla kendi parolasını belirler.</li>
        <li>Firma ayarları: logo, künye, imza yöntemi, rapor formatları.</li>
        <li>Firma ayarları › Toplu içe aktarma: müşteriler ve tesisler, ekipmanlar, ölçüm cihazları, personel, araçlar (Excel).</li>
        <li>Personel&apos;den öteki kullanıcıların hesapları açılır.</li>
      </ol>
    </Bolum>
  );
}
