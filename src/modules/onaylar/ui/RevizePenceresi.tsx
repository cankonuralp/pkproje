"use client";
/* REVİZEYE GÖNDER / REVİZE İSTEĞİNİ REDDET PENCERESİ (318; maket onaylar.html pencereCiz "revize" · "istekRed", 131 V1, 141 W4): onay ekranında ve
   "Revize istekleri" satırında aynı pencere. Revizeye gönder: rapor R(n+1) olarak denetçiye Yeni döner, tamamlanan sürüm ve imzalı PDF'i saklanır;
   gerekçe zorunlu (≥ 10) — denetçinin isteği varsa onun gerekçesi başlangıç. Reddet: gerekçe isteğe bağlı (denetçi raporunda görür). Yetki ve
   kural sunucuda; gerekçe hatası alanın altında, ötekisi çağıranın şeridinde. */
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, ipucuId } from "../../../components/form/Form";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { Tus } from "../../../components/tus/Tus";
import { gorunenNo } from "../../raporlar/sema";
import type { OnaySatiri, RevizeIstekBilgisi } from "../server/onaylar";
import { revizeIstegiReddetEylemi, revizeyeGonderEylemi } from "./eylemler";
import stil from "./onaylar.module.css";

const ID = "onay-revize-gerekce";
export type RevizeTuru = "revize" | "red";

export function RevizePenceresi({ tur, r, istek, onKapat, bitti }: {
  tur: RevizeTuru; r: Pick<OnaySatiri, "id" | "no" | "kokNo" | "revizyon" | "surum" | "denetci">; istek: RevizeIstekBilgisi | null;
  onKapat: () => void;
  /** başarı (bildirim metniyle) ya da gerekçe dışı hata (genel) — çağıran yeniler / şeritte gösterir */
  bitti: (s: { bildirim?: string; genel?: string }) => void;
}) {
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [gerekce, setGerekce] = useState(tur === "revize" ? istek?.gerekce ?? "" : "");
  const [hata, setHata] = useState<string | null>(null);
  const revize = tur === "revize";
  const gonder = () => baslat(async () => {
    const y = revize ? await revizeyeGonderEylemi(r.id, r.surum, { gerekce }) : await revizeIstegiReddetEylemi(r.id, istek?.surum ?? -1, { gerekce });
    if (y.tamam) { bildir(y.bildirim ?? "Kaydedildi."); bitti({ bildirim: y.bildirim }); return; }
    if (y.hatalar?.gerekce) { setHata(y.hatalar.gerekce); document.getElementById(ID)?.focus(); return; }
    bitti({ genel: y.genel ?? "İşlem yapılamadı." });
  });
  return (
    <Pencere acik baslik={`${revize ? "Revizeye gönder" : "Revize isteğini reddet"} · ${r.no}`} onKapat={() => { if (!bekliyor) onKapat(); }} odak={`#${ID}`}
      alt={<>
        <Tus tur="ikincil" disabled={bekliyor} onClick={onKapat}>Vazgeç</Tus>
        <Tus ikon={revize ? "file-pen-line" : undefined} disabled={bekliyor} onClick={gonder}>{revize ? "Revizeye gönder" : "Reddet"}</Tus>
      </>}>
      {revize
        ? <p className={pencereMetinSinifi}>Rapor {gorunenNo(r.kokNo, r.revizyon + 1)} olarak {r.denetci} adlı muayene uzmanına Yeni döner; tamamlanan sürüm ve imzalı PDF&apos;i saklanır. Rapor yeniden onay ve imzadan geçer.</p>
        : <p className={pencereMetinSinifi}>{istek ? `${istek.kim} raporunda reddi ve gerekçenizi görür; yeniden isteyebilir.` : "Muayene uzmanı raporunda reddi görür."}</p>}
      <Alan id={ID} etiket="Gerekçe" zorunlu={revize} hata={hata}>
        <textarea id={ID} className={stil.gerekce} maxLength={400} value={gerekce} readOnly={bekliyor} aria-invalid={!!hata || undefined}
          aria-describedby={hata ? ipucuId(ID) : undefined} placeholder={revize ? "Raporda neyin düzeltileceği" : "İsteğe bağlı"}
          onChange={(e) => { setGerekce(e.target.value); setHata(null); }} />
      </Alan>
    </Pencere>
  );
}
