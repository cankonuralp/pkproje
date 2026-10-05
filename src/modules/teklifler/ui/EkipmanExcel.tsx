"use client";
/* TEKLİFİN EKİPMAN LİSTESİ — "Excel'den yükle" ve "Excel'e aktar" pencereleri (maket teklifler.html exIceCiz / excel-disa; L1 2026-09-30; 325).
   Dosya tarayıcıda okunur (sunucuya gitmez; tek okuyucu src/components/disa/oku.ts), satır satır denetim önizlemesi, geçerli satırlar
   "Kalemlere ekle" ile forma geçer (kayıt formun Kaydet'iyle, sunucu şemasından). Dışa aktarma: yüklenen liste, yoksa tesisin kayıtlı (etkin)
   ekipmanı — önizleme + İndir (.xlsx). Saf işler ../excel.ts'te. */
import { useRef, useState } from "react";
import { baytIndir } from "../../../components/disa/indir";
import { tabloOku, TabloHatasi } from "../../../components/disa/oku";
import { XLSX_TURU } from "../../../components/disa/xlsx";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { ekipmanExceli, excelSatirlari, sablonExceli, type ExcelSatiri, type ExcelTuru, type TeklifEkipmani } from "../excel";
import stil from "./teklifler.module.css";

const turAdi = (turler: readonly ExcelTuru[], id: string) => turler.find((t) => t.id === id);
const bransAd = (b: "m" | "e") => (b === "m" ? "Mekanik" : "Elektrik");

/** "Excel'den yükle": şablon, dosya seç, satır satır önizleme, "Kalemlere ekle (n)" — onEkle dosyanın BÜTÜN satırlarını alır (atlananları sayar) */
export function ExcelYukle({ turler, mevcut, onEkle }: { turler: readonly ExcelTuru[]; mevcut: readonly TeklifEkipmani[]; onEkle: (l: ExcelSatiri[]) => void }) {
  const [acik, setAcik] = useState(false);
  const [dosya, setDosya] = useState<{ ad: string; satirlar: ExcelSatiri[] } | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [okunuyor, setOkunuyor] = useState(false);
  const girdi = useRef<HTMLInputElement>(null);
  const gecerli = dosya?.satirlar.filter((x) => x.ok) ?? [];
  const sec = async (f: File | undefined) => {
    if (!f) return;
    setOkunuyor(true); setHata(null);
    try {
      const ham = await tabloOku(f.name, new Uint8Array(await f.arrayBuffer()));
      setDosya({ ad: f.name, satirlar: excelSatirlari(ham, turler, mevcut) });
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
      <Tus tur="ikincil" ikon="upload" onClick={() => setAcik(true)}>Excel&apos;den yükle</Tus>
      <Pencere acik={acik} genis baslik="Excel'den yükle" onKapat={kapat} odak="#tk-excel-sec"
        alt={<>
          <Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus>
          <Tus ikon="upload" disabled={!gecerli.length} onClick={() => { if (dosya) onEkle(dosya.satirlar); kapat(); }}>
            {dosya ? `Kalemlere ekle (${gecerli.length})` : "Kalemlere ekle"}
          </Tus>
        </>}>
        <p className={pencereMetinSinifi}>Müşterinin ekipman listesi. Sütunlar: Kod · Ekipman türü · Konum · Seri no; yalnız tür zorunlu. Geçerli satırlar tür başına
          adetle kalemlere eklenir, fiyat fiyat listesinden.</p>
        <div className={stil.dosyaSec}>
          <Tus tur="ikincil" ikon="file-spreadsheet" onClick={() => baytIndir("teklif-ekipman-sablonu.xlsx", sablonExceli(turler[0]?.ad), XLSX_TURU)}>Şablonu indir</Tus>
          <Tus id="tk-excel-sec" tur="ikincil" ikon="upload" disabled={okunuyor} aria-busy={okunuyor || undefined} onClick={() => girdi.current?.click()}>
            {dosya ? "Başka dosya seç" : "Dosya seç"}
          </Tus>
          <span className={dosya ? stil.dosyaAd : stil.yok}>{dosya?.ad ?? "Dosya seçilmedi"}</span>
          <input ref={girdi} type="file" hidden accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            aria-label="Excel ya da CSV dosyası" onChange={(e) => void sec(e.target.files?.[0])} />
        </div>
        {hata && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
        {dosya && (dosya.satirlar.length
          ? <div className={stil.onizlemeKap}>
              <table className={stil.onizleme}>
                <caption className="gizli">Dosyadaki satırlar</caption>
                <thead><tr><th scope="col">Satır</th><th scope="col">Ekipman</th><th scope="col">Durum</th></tr></thead>
                <tbody>
                  {dosya.satirlar.map((x) => (
                    <tr key={x.satir}>
                      <td className={stil.sayi}>{x.satir}</td>
                      <td>{x.kod && <span className={stil.kod}>{x.kod} </span>}{x.turAd}{x.konum && <span className={stil.altSatir}>{x.konum}</span>}</td>
                      <td>{x.ok ? <Rozet tur="tamam">Eklenecek</Rozet> : <span className={stil.hataMetin}>{x.neden}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          : <p className={stil.ipucu}>Dosyada ekipman satırı yok.</p>)}
      </Pencere>
    </>
  );
}

/** "Excel'e aktar": önizleme + İndir. liste verilmezse getir() ile alınır (formda: seçili tesislerin kayıtlı ekipmanı) */
export function ExcelAktar({ turler, fiyat, ad, ne, liste, getir, kapali, sebep }: {
  turler: readonly ExcelTuru[]; fiyat: Readonly<Record<string, number | null>>; ad: string; ne: string; liste?: readonly TeklifEkipmani[];
  getir?: () => Promise<{ liste?: TeklifEkipmani[]; genel?: string }>; kapali?: boolean; sebep?: string;
}) {
  const [acik, setAcik] = useState<readonly TeklifEkipmani[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);
  const ac = async () => {
    setHata(null);
    if (liste) { setAcik(liste); return; }
    if (!getir) return;
    setBekliyor(true);
    try {
      const r = await getir();
      if (r.liste) setAcik(r.liste); else setHata(r.genel ?? "Ekipman listesi alınamadı.");
    } finally { setBekliyor(false); }
  };
  const sebepId = sebep ? "tk-excel-sebep" : undefined;
  return (
    <>
      <Tus tur="ikincil" ikon="download" disabled={kapali || bekliyor} aria-busy={bekliyor || undefined} aria-describedby={kapali ? sebepId : undefined}
        onClick={() => void ac()}>Excel&apos;e aktar</Tus>
      {kapali && sebep && <p className={stil.ipucu} id={sebepId}>{sebep}</p>}
      {hata && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
      <Pencere acik={!!acik} genis baslik="Excel'e aktar" onKapat={() => setAcik(null)} odak="#tk-excel-indir"
        alt={<>
          <Tus tur="ikincil" onClick={() => setAcik(null)}>Kapat</Tus>
          <Tus id="tk-excel-indir" ikon="download" disabled={!acik?.length}
            onClick={() => { if (acik) baytIndir(ad, ekipmanExceli(acik, turler, (t) => fiyat[t] ?? null), XLSX_TURU); }}>İndir</Tus>
        </>}>
        {acik && (acik.length
          ? <>
              <p className={pencereMetinSinifi}><b>{acik.length} ekipman</b> · {ne} · {ad}</p>
              <div className={stil.onizlemeKap}>
                <table className={stil.onizleme}>
                  <caption className="gizli">Aktarılacak ekipmanlar</caption>
                  <thead><tr><th scope="col">Ekipman</th><th scope="col">Konum · seri no</th></tr></thead>
                  <tbody>
                    {acik.map((e, i) => {
                      const t = turAdi(turler, e.tur);
                      return (
                        <tr key={`${e.kod}-${i}`}>
                          <td>{e.kod && <span className={stil.kod}>{e.kod} </span>}{t?.ad ?? "—"}{t && <span className={stil.altSatir}>{bransAd(t.brans)}</span>}</td>
                          <td>{e.konum || "—"}{e.seri && <span className={stil.altSatir}>{e.seri}</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          : <p className={pencereMetinSinifi}>Aktarılacak ekipman yok: seçili tesislerde kayıtlı etkin ekipman bulunmuyor.</p>)}
      </Pencere>
    </>
  );
}
