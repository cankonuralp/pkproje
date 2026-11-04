/* GİZLİLİK (2026-11-04): oturumsuz açılır — Google'ın izin ekranı ve Microsoft'un uygulama kaydı bu adresi ister (firmanın kendi yedeği). Metin tek
   kaynaktan: src/tanim/gizlilik.ts; iletişim adresi ortamdan (PROBATA_ILETISIM_EPOSTA). Görünüm koşullar sayfasıyla aynı. */
import type { Metadata } from "next";
import { GIZLILIK, GIZLILIK_SURUMU, GOOGLE_SINIRLI_KULLANIM_EN, GOOGLE_SINIRLI_KULLANIM_TR, iletisimAdresi } from "../../../tanim/gizlilik";
import stil from "../giris/giris.module.css";

export const metadata: Metadata = { title: "Gizlilik · probata" };
export const dynamic = "force-dynamic";

export default function Sayfa() {
  const eposta = iletisimAdresi();
  return (
    <main className={stil.giris}>
      <div className={stil.form} style={{ justifyContent: "flex-start" }}>
        <article className={stil.kart} style={{ maxWidth: 760 }}>
          <h1 className={stil.baslik}>Gizlilik</h1>
          <p className={stil.adres}>Sürüm {GIZLILIK_SURUMU}</p>
          {GIZLILIK.map(([baslik, maddeler]) => (
            <section key={baslik}>
              <h2 className={stil.etiket} style={{ marginTop: 16 }}>{baslik}</h2>
              <ul style={{ display: "grid", gap: 8, paddingLeft: 20, margin: 0 }}>
                {maddeler.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </section>
          ))}
          <h2 className={stil.etiket} style={{ marginTop: 16 }}>Google API verisi</h2>
          <p style={{ margin: 0 }}>{GOOGLE_SINIRLI_KULLANIM_TR}</p>
          <p lang="en" style={{ margin: "8px 0 0" }}>{GOOGLE_SINIRLI_KULLANIM_EN}</p>
          {eposta && (
            <>
              <h2 className={stil.etiket} style={{ marginTop: 16 }}>İletişim</h2>
              <p style={{ margin: 0 }}>{eposta}</p>
            </>
          )}
          <a className={stil.baglanti} href="/kosullar">Kullanım koşulları</a>
          <a className={stil.baglanti} href="/giris">Girişe dön</a>
        </article>
      </div>
    </main>
  );
}
