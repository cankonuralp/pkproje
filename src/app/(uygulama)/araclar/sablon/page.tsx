/* ARAÇLAR › Şablon (maket araclar.html #/sablon): teslim tutanağının kalemleri ve fotoğraf açıları. ÖRNEK şablon (reisim: "örnek bi şablon
   oluştur inceleyip düzenleriz"); firmanın düzenlemesi Format kurucu kaleminde. Yalnız "değiştirir" düzeyi. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { Bolum, SayfaBasi, SeritKap, Sekmeler } from "../../../../components/sayfa/Sayfa";
import { Serit } from "../../../../components/serit/Serit";
import { modulBul } from "../../../../modules/moduller";
import { ARAC_FOTO, ARAC_KONTROL, YAKIT_SEVIYE } from "../../../../modules/araclar/sema";
import { aracDegistirir } from "../../../../modules/araclar/server/araclar";
import { aracSekmeleri } from "../../../../modules/araclar/ui/ortak";
import stil from "../../../../modules/araclar/ui/araclar.module.css";
import { modulOturumu } from "../../../../server/kimlik/istek";

const MODUL = modulBul("araclar")!;
export const metadata: Metadata = { title: "Tutanak şablonu" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  if (!aracDegistirir(o)) return <Yetkisiz />;
  return (
    <>
      <SayfaBasi baslik="Araçlar" />
      <Sekmeler ad="Araç bölümleri" ogeler={aracSekmeleri(true, false)} secili="/araclar/sablon" />
      <SeritKap><Serit tur="bilgi" ikon="info">Örnek şablon: kontrol kalemleri ({ARAC_KONTROL.length}) ve fotoğraf açıları ({ARAC_FOTO.length}) öneri. Teslimde doldurulan tutanak bu düzenle çıkar.</Serit></SeritKap>
      <Bolum id="b-arac-alan" baslik="Tutanak alanları">
        <ul className={stil.liste}>
          <li>Araç, teslim eden (kendiliğinden), teslim alan (kişi ya da depo), tarih ve saat</li>
          <li>Kilometre (son bilinenden küçük olamaz)</li>
          <li>Yakıt seviyesi: {YAKIT_SEVIYE.map((x) => x[1]).join(" · ")}</li>
          <li>Hasar ve notlar</li>
        </ul>
      </Bolum>
      <Bolum id="b-arac-kontrol" baslik="Araçta olanlar" sayac={<><b>{ARAC_KONTROL.length}</b> kalem</>}>
        <ul className={stil.liste}>{ARAC_KONTROL.map(([k, ad]) => <li key={k}>{ad}</li>)}</ul>
      </Bolum>
      <Bolum id="b-arac-foto" baslik="Fotoğraf açıları" sayac={<><b>{ARAC_FOTO.length}</b> açı</>}>
        <ul className={stil.liste}>{ARAC_FOTO.map(([k, ad]) => <li key={k}>{ad}</li>)}</ul>
      </Bolum>
    </>
  );
}
