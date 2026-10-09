/* PLAN E-POSTALARI (432): plan açılınca ekipteki denetçilere ve bilgilendirme listesine giden e-postalar — alıcı, durum (Gönderildi · Bekliyor ·
   Gönderilemedi) ve nedeni. Yalnız plan açabilene (planlama, yönetici; plan-ici.ts). Gönderim yanıttan sonra; sayfa yenilenince güncel durum. */
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
      <ul className={stil.epostalar}>
        {epostalar.map((e) => {
          const [ad, tur] = DURUM[e.durum];
          return (
            <li key={e.id}>
              <span className={stil.epostaKime}>{e.kime}</span>
              <Rozet tur={tur}>{ad}</Rozet>
              <span className={stil.altInline}>{e.gonderildi ? zamanNo(e.gonderildi) : e.sonHata ?? ""}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
