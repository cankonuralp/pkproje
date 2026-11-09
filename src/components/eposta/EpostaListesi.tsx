/* GÖNDERİLEN E-POSTALAR — tek üretici (2026-10-25 sözleşme; 2026-11-09 teklif de): alıcı, durum (Gönderildi · Bekliyor · Gönderilemedi), gönderildiği zaman ya da
   nedeni, giden PDF (kuyruk: src/server/eposta/eposta.ts kaynakEpostalari; ek, kaydı görene açılır — src/server/dosya/erisim.ts). Gönderim yanıttan sonra; sayfa
   yenilenince güncel durum. */
import { DosyaAcTusu } from "../gizli-resim/GizliResim";
import { SayfaliListe } from "../liste/Sayfalayici";
import { Rozet } from "../sayfa/Sayfa";
import type { EpostaDurumu } from "../../server/eposta/eposta";
import stil from "./eposta.module.css";

const DURUM = { gonderildi: ["Gönderildi", "tamam"], bekliyor: ["Bekliyor", "bekliyor"], hata: ["Gönderilemedi", "red"] } as const;
const ZAMAN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const zamanYaz = (iso: string) => { const s = ZAMAN.format(new Date(iso)); return `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)} ${s.slice(12, 17)}`; };

export function EpostaListesi({ epostalar }: { epostalar: readonly EpostaDurumu[] }) {
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
