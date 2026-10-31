/* KULLANIM KOŞULLARI (2026-10-31, kalem 7 — M6; karar 5: "Yapay zekâ (S.A.Y)" maddesi 06-KULLANIM-KOSULLARI-YZ.md'deki gibi). Oturumsuz açılır (giriş
   sayfasının altındaki bağlantı, S.A.Y'ın kabul ekranındaki "Koşulları oku"). Metin tek kaynaktan: src/modules/say/kosul-metni.ts; sürüm kosul.ts. */
import type { Metadata } from "next";
import { KOSUL_MADDESI } from "../../../modules/say/kosul-metni";
import { KOSUL_SURUMU } from "../../../server/yz/kosul";
import stil from "../giris/giris.module.css";

export const metadata: Metadata = { title: "Kullanım koşulları · probata", robots: { index: false } };

export default function Sayfa() {
  return (
    <main className={stil.giris}>
      <div className={stil.form} style={{ justifyContent: "flex-start" }}>
        <article className={stil.kart} style={{ maxWidth: 760 }}>
          <h1 className={stil.baslik}>Kullanım koşulları</h1>
          <p className={stil.adres}>Sürüm {KOSUL_SURUMU}</p>
          <h2 className={stil.etiket} style={{ marginTop: 16 }}>Yapay zekâ (S.A.Y)</h2>
          <ol style={{ display: "grid", gap: 8, paddingLeft: 20, margin: 0 }}>
            {KOSUL_MADDESI.map(([b, m]) => <li key={b}><b>{b}</b> {m}</li>)}
          </ol>
          <a className={stil.baglanti} href="/giris">Girişe dön</a>
        </article>
      </div>
    </main>
  );
}
