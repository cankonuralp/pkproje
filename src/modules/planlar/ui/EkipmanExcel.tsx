"use client";
/* PLAN AÇ › EKİPMANLAR — "Excel'den yükle" (465; reisim 2026-10-09, hata listesi 7: "ayrıca excelden aktarma gibi seçenekler de olmalı").
   Teklifler'deki pencereyle aynı akış (325): şablon, dosya seç (tarayıcıda okunur, sunucuya gitmez — tek okuyucu src/components/disa/oku.ts),
   satır satır önizleme, geçerli satırlar "Listeye ekle" ile formun elle eklenen ekipman satırlarına geçer (plan açılınca tesise kaydedilir;
   kurallar sunucuda yeniden). Saf iş ../excel.ts'te. */
import { useRef, useState } from "react";
import { baytIndir } from "../../../components/disa/indir";
import { tabloOku, TabloHatasi } from "../../../components/disa/oku";
import { XLSX_TURU } from "../../../components/disa/xlsx";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { planExcelSatirlari, planSablonExceli, type ExcelTuru, type PlanExcelSatiri } from "../excel";
import stil from "./planlar.module.css";

/** tesiste: tesiste kayıtlı kodlar · listede: formda elle yazılmış kodlar · bos: eklenebilecek satır sayısı (en çok) */
export function PlanExcelYukle({ turler, tesiste, listede, bos, onEkle }: {
  turler: readonly ExcelTuru[]; tesiste: readonly string[]; listede: readonly string[]; bos: number; onEkle: (l: PlanExcelSatiri[]) => void;
}) {
  const [acik, setAcik] = useState(false);
  const [dosya, setDosya] = useState<{ ad: string; satirlar: PlanExcelSatiri[] } | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [okunuyor, setOkunuyor] = useState(false);
  const girdi = useRef<HTMLInputElement>(null);
  const gecerli = (dosya?.satirlar.filter((x) => x.ok) ?? []).slice(0, Math.max(0, bos));
  const fazla = (dosya?.satirlar.filter((x) => x.ok).length ?? 0) - gecerli.length;
  const sec = async (f: File | undefined) => {
    if (!f) return;
    setOkunuyor(true); setHata(null);
    try {
      const ham = await tabloOku(f.name, new Uint8Array(await f.arrayBuffer()));
      setDosya({ ad: f.name, satirlar: planExcelSatirlari(ham, turler, tesiste, listede) });
    } catch (e) {
      setDosya(null);
      setHata(`${f.name} okunamadı: ${e instanceof TabloHatasi ? e.message : ".xlsx ya da .csv seçin."}`);
    } finally {
      setOkunuyor(false);
      if (girdi.current) girdi.current.value = "";
    }
  };
  const kapat = () => { setAcik(false); setDosya(null); setHata(null); };
  return (
    <>
      <Tus tur="ikincil" ikon="upload" disabled={bos <= 0} onClick={() => setAcik(true)}>Excel&apos;den yükle</Tus>
      <Pencere acik={acik} genis baslik="Excel'den yükle" onKapat={kapat} odak="#pa-excel-sec"
        alt={<>
          <Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus>
          <Tus ikon="upload" disabled={!gecerli.length} onClick={() => { onEkle(gecerli); kapat(); }}>
            {dosya ? `Listeye ekle (${gecerli.length})` : "Listeye ekle"}
          </Tus>
        </>}>
        <p className={pencereMetinSinifi}>Tesiste kayıtlı olmayan ekipmanlar. Sütunlar: Kod · Ekipman türü · Konum; kod ve tür zorunlu. Plan açılınca tesise de
          kaydedilir.</p>
        <div className={stil.dosyaSec}>
          <Tus tur="ikincil" ikon="file-spreadsheet" onClick={() => baytIndir("plan-ekipman-sablonu.xlsx", planSablonExceli(turler[0]?.ad), XLSX_TURU)}>Şablonu indir</Tus>
          <Tus id="pa-excel-sec" tur="ikincil" ikon="upload" disabled={okunuyor} aria-busy={okunuyor || undefined} onClick={() => girdi.current?.click()}>
            {dosya ? "Başka dosya seç" : "Dosya seç"}
          </Tus>
          <span className={dosya ? stil.dosyaAd : stil.altMetin}>{dosya?.ad ?? "Dosya seçilmedi"}</span>
          <input ref={girdi} type="file" hidden accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            aria-label="Excel ya da CSV dosyası" onChange={(e) => void sec(e.target.files?.[0])} />
        </div>
        {hata && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
        {fazla > 0 && <Serit tur="uyari" ikon="triangle-alert">Listeye en çok {bos} ekipman daha eklenebilir; {fazla} satır eklenmez.</Serit>}
        {dosya && (dosya.satirlar.length
          ? <div className={stil.onizlemeKap}>
              <table className={stil.onizleme}>
                <caption className="gizli">Dosyadaki satırlar</caption>
                <thead><tr><th scope="col">Satır</th><th scope="col">Ekipman</th><th scope="col">Durum</th></tr></thead>
                <tbody>
                  {dosya.satirlar.map((x) => (
                    <tr key={x.satir}>
                      <td className={stil.sayi}>{x.satir}</td>
                      <td>{x.kod && <span className={stil.kod}>{x.kod} </span>}{x.turAd}{x.konum && <span className={stil.altMetin}>{x.konum}</span>}</td>
                      <td>{x.ok ? <Rozet tur="tamam">Eklenecek</Rozet> : <span className={stil.hataMetin}>{x.neden}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          : <p className={stil.altMetin}>Dosyada ekipman satırı yok.</p>)}
      </Pencere>
    </>
  );
}
