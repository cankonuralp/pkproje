/* PLAN E-POSTALARI (432): plan açılınca ekipteki denetçilere ve bilgilendirme listesine giden e-postalar — alıcı, durum (Gönderildi · Bekliyor ·
   Gönderilemedi) ve nedeni. Yalnız plan açabilene (planlama, yönetici; plan-ici.ts). Gönderim yanıttan sonra; sayfa yenilenince güncel durum.
   2026-10-25 (belge doldurma): müşteriye giden ön bilgilendirme formu e-postaları da — ekin adı, gönderilen PDF'i açan tuşla (planı gören açar). */
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { SayfaliListe } from "../../../components/liste/Sayfalayici";
import { Rozet } from "../../../components/sayfa/Sayfa";
import type { EpostaDurumu } from "../../../server/eposta/eposta";
import { zamanNo } from "../sema";
import stil from "./planlar.module.css";

const DURUM = { gonderildi: ["Gönderildi", "tamam"], bekliyor: ["Bekliyor", "bekliyor"], hata: ["Gönderilemedi", "red"] } as const;

export function PlanEpostalari({ epostalar }: { epostalar: EpostaDurumu[] }) {
  const gonderilen = epostalar.filter((e) => e.durum === "gonderildi").length;
  return (
    <section className={stil.notlar} aria-labelledby="plan-epostalari">
      <div className={stil.altBas}>
        <h2 className={stil.adimBaslik} id="plan-epostalari">Bilgilendirme e-postaları</h2>
        <span className={stil.altInline}><b>{gonderilen}</b> / {epostalar.length} gönderildi</span>
      </div>
      <SayfaliListe ad="Bilgilendirme e-postaları" className={stil.epostalar} ogeler={epostalar.map((e) => {
          const [ad, tur] = DURUM[e.durum];
          return (
            <li key={e.id}>
              <span className={stil.epostaKime}>{e.kime}</span>
              {e.ek && <DosyaAcTusu dosyaId={e.ek.dosyaId} ikon="paperclip" etiket={`${e.kime} e-postasının eki: ${e.ek.ad}`} baslik={e.ek.ad}>
                {e.kaynak === "onbilgi" ? "Ön bilgilendirme formu" : "Ek"}</DosyaAcTusu>}
              <Rozet tur={tur}>{ad}</Rozet>
              <span className={stil.altInline}>{e.gonderildi ? zamanNo(e.gonderildi) : e.sonHata ?? ""}</span>
            </li>
          );
        })} />
    </section>
  );
}
