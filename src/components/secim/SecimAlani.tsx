"use client";
/* SEÇİM ALANI — formdaki tek seçim (kalıp 19: YERLİ AÇILIR LİSTE YOK; reisim 2026-09-16 "seçenekli yerler temamıza aykırı"). Maketteki
   MK.secim ile aynı görünüm: girdi gibi düğme (seçili etiket ya da soluk ipucu + ok) → temalı liste (SecenekListesi). Değer dışarıda.
   Düğmenin rolü combobox (yalnız seçmeli açılır kutu, WAI-ARIA): geçersizlik (aria-invalid) ekran okuyucuya böyle söylenir. */
import { useCallback, useId, useRef, useState } from "react";
import { Ikon } from "../ikon/Ikon";
import { SecenekListesi, useDisariTiklama, ustteMi, type SecimSecenegi } from "./SecenekListesi";
import stil from "./Secim.module.css";

export function SecimAlani({ id, ad, deger, secenekler, degistir, ipucu = "Seçin", gecersiz = false, tanim, kapali = false }: {
  /** düğmenin id'si (etiket for= ile bağlanır) */
  id: string;
  /** listenin erişilebilir adı (alanın etiketi) */
  ad: string;
  deger: string;
  secenekler: readonly SecimSecenegi[];
  degistir: (v: string) => void;
  ipucu?: string;
  gecersiz?: boolean;
  /** aria-describedby (alanın altındaki hata / uyarı) */
  tanim?: string;
  kapali?: boolean;
}) {
  const [acik, setAcik] = useState(false);
  const [ust, setUst] = useState(false);
  const kap = useRef<HTMLDivElement>(null);
  const tus = useRef<HTMLButtonElement>(null);
  const listeId = useId();
  const kapat = useCallback(() => setAcik(false), []);
  useDisariTiklama(acik, kap, kapat);
  const gor = secenekler.find((o) => o[0] === deger);
  return (
    <div className={stil.secim} ref={kap} data-secim-kap={id}>
      <button ref={tus} className={`${stil.girdi} ${stil.tus}`} type="button" id={id} role="combobox" aria-haspopup="listbox" aria-expanded={acik}
        aria-controls={acik ? listeId : undefined} aria-invalid={gecersiz || undefined} aria-describedby={tanim} disabled={kapali}
        onClick={() => { if (!acik) setUst(ustteMi(tus.current)); setAcik(!acik); }}>
        <span className={gor ? stil.kirp : `${stil.kirp} ${stil.bos}`} title={gor?.[1] ?? ipucu}>{gor?.[1] ?? ipucu}</span>
        <Ikon ad="chevron-down" kucuk />
      </button>
      {acik && (
        <SecenekListesi id={listeId} ad={ad} secenekler={secenekler} deger={deger} ust={ust}
          sec={(v) => { degistir(v); setAcik(false); tus.current?.focus(); }}
          kapat={(geri) => { setAcik(false); if (geri) tus.current?.focus(); }} />
      )}
    </div>
  );
}
