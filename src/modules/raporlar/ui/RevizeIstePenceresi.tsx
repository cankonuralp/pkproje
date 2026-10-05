"use client";
/* REVİZE İSTE PENCERESİ (318; maket raporlar.html 192 pencereCiz "revizeIstek"): tamamlanan raporda yazan, neyin düzeltilmesi gerektiğini yazar
   (gerekçe zorunlu, en az 10 karakter); istek teknik yöneticinin Onaylar'ındaki "Revize istekleri"ne düşer. Kural ve yetki sunucuda; hata alanın
   altında, yazılan korunur. */
import { useState } from "react";
import { Alan, ipucuId } from "../../../components/form/Form";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { Tus } from "../../../components/tus/Tus";
import stil from "./raporlar.module.css";

const ID = "r-revize-gerekce";

export function RevizeIstePenceresi({ no, mesgul, onKapat, gonder }: {
  no: string; mesgul: boolean; onKapat: () => void;
  /** sunucuya gönderir; hata metni döner (başarıda null — çağıran pencereyi kapatır) */
  gonder: (gerekce: string) => Promise<string | null>;
}) {
  const [gerekce, setGerekce] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const yolla = async () => { const h = await gonder(gerekce); if (h) { setHata(h); document.getElementById(ID)?.focus(); } };
  return (
    <Pencere acik baslik={`Revize iste · ${no}`} onKapat={() => { if (!mesgul) onKapat(); }} odak={`#${ID}`}
      alt={<>
        <Tus tur="ikincil" disabled={mesgul} onClick={onKapat}>Vazgeç</Tus>
        <Tus ikon="file-pen-line" disabled={mesgul} onClick={() => void yolla()}>İsteği gönder</Tus>
      </>}>
      <p className={pencereMetinSinifi}>İstek teknik yöneticiye gider; revizeye o gönderir. Rapor revize edilirse yeni sürümle yeniden onay ve imzadan geçer.</p>
      <Alan id={ID} etiket="Gerekçe" zorunlu hata={hata}>
        <textarea id={ID} className={stil.metinAlan} maxLength={400} value={gerekce} readOnly={mesgul} aria-invalid={!!hata || undefined}
          aria-describedby={hata ? ipucuId(ID) : undefined} placeholder="Raporda neyin düzeltilmesi gerektiği"
          onChange={(e) => { setGerekce(e.target.value); setHata(null); }} />
      </Alan>
    </Pencere>
  );
}
