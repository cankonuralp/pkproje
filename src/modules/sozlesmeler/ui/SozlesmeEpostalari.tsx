/* SÖZLEŞME E-POSTALARI (2026-10-25, belge doldurma): "Müşteriye gönder"le giden e-postalar — alıcı, durum (Gönderildi · Bekliyor · Gönderilemedi),
   gönderildiği zaman ya da nedeni, giden PDF (kuyruk: src/server/eposta/eposta.ts kaynakEpostalari, kaynak "sozlesme"; ek sözleşmeyi görene açılır —
   src/server/dosya/erisim.ts). Gönderim yanıttan sonra; sayfa yenilenince güncel durum. */
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { SayfaliListe } from "../../../components/liste/Sayfalayici";
import { Rozet } from "../../../components/sayfa/Sayfa";
import type { EpostaDurumu } from "../../../server/eposta/eposta";
import { zamanYaz } from "./ortak";
import stil from "./sozlesmeler.module.css";

const DURUM = { gonderildi: ["Gönderildi", "tamam"], bekliyor: ["Bekliyor", "bekliyor"], hata: ["Gönderilemedi", "red"] } as const;

export function SozlesmeEpostalari({ epostalar }: { epostalar: EpostaDurumu[] }) {
  return (
    <SayfaliListe ad="Gönderilen e-postalar" className={stil.epostalar} ogeler={[...epostalar].reverse().map((e) => {
      const [ad, tur] = DURUM[e.durum];
      return (
        <li key={e.id}>
          <span className={stil.epostaKime}>{e.kime}</span>
          <Rozet tur={tur}>{ad}</Rozet>
          <span className={stil.epostaZaman}>{e.gonderildi ? zamanYaz(e.gonderildi) : e.durum === "hata" ? e.sonHata ?? "" : zamanYaz(e.olustu)}</span>
          {e.ek && <DosyaAcTusu dosyaId={e.ek.dosyaId} ikon="file-text" etiket={`${e.ek.ad} · ${e.kime}`}>PDF</DosyaAcTusu>}
        </li>
      );
    })} />
  );
}
