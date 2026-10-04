"use client";
/* Vitrinin bilgi yüzleri, bilgi listesi, koşul listesi ve form sayfası; uzun tuş (biri başarılı, biri hata veren). Veriler uydurma.
   e2e/bilgi-form.spec.ts ölçer. */
import { useState } from "react";
import { Bilgi, BilgiListesi, Kosullar, Yuz, Yuzler } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormBolum, FormEylem, FormIzgara, FormSayfa, Girdi } from "../../../components/form/Form";
import { Tus } from "../../../components/tus/Tus";
import { UzunTus } from "../../../components/tus/UzunTus";
import { ekipmanKodu } from "../../../sema/ortak";
import stil from "./vitrin.module.css";

/* alan ve girdisi aynı id ile bağlanır: id tek sabitte (çift id kilidi) */
const ID = { kod: "v-kod", seri: "v-seri", konum: "v-konum" } as const;
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function VitrinBilgi() {
  const bildir = useBildir();
  const [kod, setKod] = useState("");
  const [kosu, setKosu] = useState(0);
  /* sunucunun kullanacağı şemanın aynısı (src/sema/ortak.ts) — ekranda anında, sunucuda kesin */
  const kodSonuc = ekipmanKodu.safeParse(kod);
  const kodHata = kod && !kodSonuc.success ? kodSonuc.error.issues[0].message : undefined;
  return (
    <section className={stil.bolum} aria-labelledby="v-bilgi">
      <h2 id="v-bilgi">Bilgi ve form</h2>
      <Yuzler>
        <Yuz ikon="calendar-check" ad="Planlar" sayi={12} not="3 plan bugün" href="/planlar" />
        <Yuz ikon="file-text" ad="Raporlar" sayi={48} not="5 rapor onay bekliyor" uyari />
        <Yuz ikon="gauge" ad="Ölçüm cihazları" sayi={7} not="1 cihazın kalibrasyonu yaklaşıyor" uyari />
        <Yuz ikon="users" ad="Personel" sayi={9} />
      </Yuzler>
      <BilgiListesi>
        <Bilgi etiket="Proje no">P-1026-01</Bilgi>
        <Bilgi etiket="Müşteri">Örnek Metal</Bilgi>
        <Bilgi etiket="Plan tarihi">15.10.2026</Bilgi>
        <Bilgi etiket="Adres" genis>Organize Sanayi Bölgesi 1. Cadde No: 0, Uydurma / İzmir</Bilgi>
        <Bilgi etiket="SGK DETSİS NO" genis="cift">00000000000000000000000000</Bilgi>
      </BilgiListesi>
      <Kosullar ogeler={[
        { tur: "tamam", metin: "Sözleşme imzalı" },
        { tur: "eksik", metin: "İSG-KATİP sözleşme ID'si girilmedi", eylem: <Tus tur="ikincil">Gir</Tus> },
        { tur: "bilgi", metin: "Plan geçmiş tarihe açılabilir; uyarı şeridiyle görünür" },
      ]} />
      <FormSayfa>
        <FormBolum baslik="Ekipman" id="v-fb-ekipman">
          <FormIzgara>
            <Alan id={ID.kod} etiket="Ekipman kodu" zorunlu hata={kodHata}>
              <Girdi id={ID.kod} value={kod} onChange={(e) => setKod(e.target.value)} hata={!!kodHata} />
            </Alan>
            <Alan id={ID.seri} etiket="Seri no" uyari="Bu seri no başka bir kayıtta da var.">
              <Girdi id={ID.seri} defaultValue="SN-0001" mesajli />
            </Alan>
            <Alan id={ID.konum} etiket="Konum" genis sonuc="Konum raporda ekipman bilgisinde görünür.">
              <Girdi id={ID.konum} mesajli />
            </Alan>
          </FormIzgara>
        </FormBolum>
        <FormBolum baslik="Belge">
          <p className={stil.metin}>Uzun süren iş: basınca dönen simge, adım ve 3 sn sonra geçen süre; iş sürerken ikinci basış yok sayılır.</p>
          <p className={stil.metin}>Biten iş: <output data-uzun-kosu={kosu}>{kosu}</output></p>
        </FormBolum>
      </FormSayfa>
      <FormEylem not="Değişiklikler kaydedilmedi">
        <UzunTus tur="ikincil" ikon="download" data-v="uzun-hata" is={async (ilerle) => { ilerle("Bağlanıyor"); await bekle(400); throw new Error("depo yanıt vermedi"); }}>
          Yedek al
        </UzunTus>
        <UzunTus ikon="file-text" data-v="uzun" is={async (ilerle) => {
          ilerle("PDF hazırlanıyor"); await bekle(1800);
          ilerle("Sayfa 2 / 2"); await bekle(1800);
          setKosu((n) => n + 1); bildir("PDF hazır.");
        }}>
          PDF oluştur
        </UzunTus>
      </FormEylem>
    </section>
  );
}
