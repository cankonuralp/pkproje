"use client";
/* S.A.Y KULLANIM KOŞULLARI KABULÜ (2026-10-31, kalem 7 — M6; maket 9, 06-KULLANIM-KOSULLARI-YZ §2): firma yöneticisi firması adına, kullanıcı kendi adına;
   firma kabul etmediyse öteki kullanıcılar yalnız bekleme yazısını görür, yazı kutusu yok. Kabul sunucuda kaydedilir ve S.A.Y'a giden her istekte
   denetlenir (src/server/yz/kosul.ts). */
import { useState } from "react";
import type { KosulDurumu } from "../../../server/yz/kosul";
import { KOSUL_OZETI } from "../kosul-metni";
import { kosulKabulEylemi } from "./eylemler";
import stil from "./say.module.css";

export function KosulKabul({ kosul, kabulEdildi }: { kosul: KosulDurumu & { yonetici?: boolean }; kabulEdildi: () => void }) {
  const [isaret, setIsaret] = useState(false), [bekliyor, setBekliyor] = useState(false), [hata, setHata] = useState<string | null>(null);
  const firmaAdina = !kosul.firma && !!kosul.yonetici;
  if (!kosul.firma && !kosul.yonetici) {
    return <p className={`${stil.mesaj} ${stil.o}`} data-kosul="bekle">S.A.Y, firma yöneticiniz kullanım koşullarını kabul edince açılır.</p>;
  }
  const kabul = async () => {
    setBekliyor(true); setHata(null);
    try {
      const r = await kosulKabulEylemi(firmaAdina ? "firma" : "kullanici");
      if (r.tamam) kabulEdildi(); else setHata(r.neden ?? "Kabul kaydedilemedi.");
    } catch { setHata("Kabul kaydedilemedi; bağlantıyı kontrol edip yeniden deneyin."); } finally { setBekliyor(false); }
  };
  return (
    <section className={`${stil.mesaj} ${stil.o}`} aria-labelledby="kosul-baslik" data-kosul={firmaAdina ? "firma" : "kullanici"}>
      <h3 id="kosul-baslik" className={stil.mdBaslik}>{firmaAdina ? "S.A.Y'ı firmanız için açın" : "S.A.Y'ı kullanmadan önce"}</h3>
      <ul className={stil.madde}>{KOSUL_OZETI.map((s) => <li key={s}>{s}</li>)}</ul>
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <input type="checkbox" id="kosul-isaret" checked={isaret} onChange={(e) => setIsaret(e.target.checked)} />
        <span>{firmaAdina ? "Kullanım koşullarının Yapay zekâ (S.A.Y) maddesini okudum, firmam adına kabul ediyorum." : "Okudum, kabul ediyorum."}</span>
      </label>
      {hata && <p role="alert">{hata}</p>}
      <div className={stil.oneriTuslar}>
        <a className={stil.kucukTus} href="/kosullar" target="_blank" rel="noopener">Koşulları oku</a>
        <button className={stil.kucukTus} type="button" id="kosul-kabul" disabled={!isaret || bekliyor} onClick={() => void kabul()}>Kabul et</button>
      </div>
    </section>
  );
}
