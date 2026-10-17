/* RAPOR DOĞRULAMA KARTI (595 K8): karekodun açtığı sayfa — oturumsuz, sunucuda çizilir. İmzalı sürümün kimliği; müşteri ve kişi adı yok.
   2026-10-17 (reisim: "rapor doğrulama ekranında raporun kendisi de gözüksün"): imzalı rapor kartın altında sayfanın içinde (components/pdf/
   PdfGorunumu — kısa ömürlü jetonlu adresten; saklama süresi dolduysa yok). */
import { PdfGorunumu } from "../../../components/pdf/PdfGorunumu";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import type { RaporDogrulama } from "../server/dogrulama";
import { SONUC_AD } from "../sema";
import stil from "./dogrulama.module.css";

const zaman = (iso: string) => new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

export function DogrulamaKarti({ d, pdf = null }: { d: RaporDogrulama; pdf?: string | null }) {
  return (
    <main className={stil.sayfa}>
      <section className={stil.kart} aria-labelledby="dogrulama-baslik">
        <h1 id="dogrulama-baslik" className={stil.baslik}>Rapor doğrulama</h1>
        {d.durum === "yok" ? (
          <p className={stil.metin}>Bu doğrulama kodu bulunamadı. Karekodu raporun kendisinden okuttuğunuzdan ve adresin tam olduğundan emin olun.</p>
        ) : d.durum === "imzasiz" ? (
          <>
            <Rozet tur="bekliyor">İmza bekleniyor</Rozet>
            <p className={stil.metin}><b>{d.no}</b> numaralı rapor {d.firma} tarafından imzaya hazırlandı; e-imzalı hâli henüz yüklenmedi. İmzasız kopya geçerli değildir.</p>
          </>
        ) : (
          <>
            {d.durum === "gecerli"
              ? <Rozet tur="tamam">E-imzalı · geçerli</Rozet>
              : <Rozet tur="red">Yeni revizyonu var</Rozet>}
            <dl className={stil.liste}>
              <dt>Rapor no</dt><dd>{d.no}</dd>
              <dt>Muayene firması</dt><dd>{d.firma}</dd>
              <dt>Ekipman</dt><dd>{d.tur} · {d.ekipman}</dd>
              <dt>Kontrol tarihi</dt><dd>{d.kontrol ? tarihNo(d.kontrol) : "-"}</dd>
              <dt>Sonuç</dt><dd>{d.sonuc ? SONUC_AD[d.sonuc] : "-"}</dd>
              <dt>E-imza</dt><dd>{zaman(d.imzalandi)}</dd>
            </dl>
            {d.yeni && <p className={stil.uyari}>Bu raporun yerine geçen yeni revizyon imzalandı: <b>{d.yeni}</b>. Geçerli olan yeni revizyondur.</p>}
            {d.saklamaBitti && <p className={stil.metin}>Raporun saklama süresi doldu; PDF&apos;i silindi.</p>}
            <p className={stil.ipucu}>Bu sayfa raporun varlığını ve durumunu doğrular{pdf ? "; raporun e-imzalı kopyası aşağıdadır" : ""}.</p>
          </>
        )}
      </section>
      {pdf && d.durum !== "yok" && d.durum !== "imzasiz" && (
        <section className={stil.rapor} aria-label="Rapor">
          <PdfGorunumu adres={pdf} ad={d.no} />
        </section>
      )}
    </main>
  );
}
