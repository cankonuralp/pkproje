"use client";
/* TOPLU İÇE AKTARMA (ilk kurulum) — Firma ayarları bölümü (337; maket firma-ayarlari iceCiz, ia-sablon / ia-sec / ia-aktar / ia-temizle / ia-geri;
   pkproje §11 245). Ne yükleneceği seçilir → Şablonu indir (Türkçe sütunlar, * zorunlu, örnek satırlar) → Excel seç (.xlsx / .csv; dosya
   tarayıcıda okunur, src/components/disa/oku.ts) → sunucu satır satır denetler: "Eklenecek" (uyarı notu) ya da atlanma nedeni → İçe aktar (N).
   Son içe aktarımlar listelenir; sonuncusu, kayıtları kullanılmadıysa onayla Geri al (kullanılmışsa sorulmadan söylenir — maket). Karar sunucuda. */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { baytIndir } from "../../../components/disa/indir";
import { tabloOku, TabloHatasi } from "../../../components/disa/oku";
import { XLSX_TURU, xlsxBayt } from "../../../components/disa/xlsx";
import { Alan, FormIzgara } from "../../../components/form/Form";
import { useOnayla } from "../../../components/pencere/Onay";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { IA_TUR, IA_TURLER, type IaGecmis, type IaTur } from "../ice-aktar";
import type { IaSatirOzeti } from "../server/ice-aktar";
import { iceAktarDenetleEylemi, iceAktarEylemi, iceAktarimGeriAlEylemi } from "./eylemler";
import stil from "./firma-ayarlari.module.css";

const TUR_ID = "w-ay-ia-tur";
const zamanYaz = (iso: string) => new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function IceAktarma({ gecmis, yaz }: { gecmis: IaGecmis[]; yaz: boolean }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [mesgul, baslat] = useTransition();
  const [tur, setTur] = useState<IaTur>("musteri");
  const [dosya, setDosya] = useState<{ ad: string; ham: string[][]; satirlar: IaSatirOzeti[] } | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const secici = useRef<HTMLInputElement>(null);
  const T = IA_TUR[tur];
  const gecerli = dosya?.satirlar.filter((x) => x.ok).length ?? 0;
  const odak = (secici: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(secici)?.focus());
  /* içe aktarmadan sonra odak YENİ kaydın Geri al tuşuna: liste yenilenince (son kayıt değişince) — o zamana kadar bölüm başlığında (337–339 incelemesi) */
  const geriOdak = useRef<string | null>(null);
  useEffect(() => {
    if (geriOdak.current === null || (gecmis[0]?.id ?? "") === geriOdak.current) return;
    geriOdak.current = null;
    odak("[data-ia-geri]");
  }, [gecmis]);

  const sec = (f: File | undefined) => {
    if (!f) return;
    baslat(async () => {
      setHata(null);
      let ham: string[][];
      try { ham = await tabloOku(f.name, new Uint8Array(await f.arrayBuffer())); }
      catch (e) { setDosya(null); setHata(`${f.name} okunamadı: ${e instanceof TabloHatasi ? e.message : ".xlsx ya da .csv seçin."}`); return; }
      const r = await iceAktarDenetleEylemi({ tur, dosya: f.name, satirlar: ham });
      if (!r.tamam || !r.satirlar) { setDosya(null); setHata(r.genel ?? "Dosya denetlenemedi."); return; }
      setDosya({ ad: f.name, ham, satirlar: r.satirlar });
      odak(r.satirlar.some((x) => x.ok) ? "[data-ia-aktar]" : "#w-ay-ia-ozet");
    });
  };
  const aktar = () => {
    if (!dosya) return;
    baslat(async () => {
      const r = await iceAktarEylemi({ tur, dosya: dosya.ad, satirlar: dosya.ham });
      if (!r.tamam) { setHata(r.genel ?? "İçe aktarılamadı."); return; }
      geriOdak.current = gecmis[0]?.id ?? "";
      setDosya(null); setHata(null); bildir(r.bildirim ?? "İçe aktarıldı."); router.refresh();
      odak("#ay-b-ice");
    });
  };
  const geriAl = (g: IaGecmis) => baslat(async () => {
    /* önce dener: kayıtlar kullanılmışsa sorulmadan söylenir (maket) */
    const d = await iceAktarimGeriAlEylemi(g.id, true);
    if (!d.tamam) { bildir(d.genel ?? "Geri alınamadı."); return; }
    if (!(await onayla({ baslik: "İçe aktarmayı geri al", metin: `${g.turAd}: ${g.adet} satırın kayıtları kaldırılır.`, tus: "Geri al", tehlike: true }))) return;
    const r = await iceAktarimGeriAlEylemi(g.id, false);
    bildir(r.tamam ? r.bildirim ?? "Geri alındı." : r.genel ?? "Geri alınamadı.");
    if (r.tamam) { router.refresh(); odak("#ay-b-ice"); }
  });

  return (
    <>
      {yaz && <>
        <p className={stil.ipucuUst}>İlk kurulumda kayıtları Excel&apos;den yükleyin. Önce müşterileri ve tesisleri, sonra ekipmanları yükleyin (ekipman tesise müşteri ünvanı + tesis adıyla bağlanır).</p>
        <FormIzgara>
          <Alan id={TUR_ID} etiket="Ne yüklenecek">
            <SecimAlani id={TUR_ID} ad="Ne yüklenecek" deger={tur} kapali={mesgul} secenekler={IA_TURLER.map((k) => [k, IA_TUR[k].ad] as const)}
              degistir={(x) => { setTur(x as IaTur); setDosya(null); setHata(null); }} />
          </Alan>
        </FormIzgara>
        <p className={stil.iaSutun}>Sütunlar: {T.sutun.join(" · ")}</p>
        <div className={stil.tuslar}>
          <Tus tur="ikincil" ikon="file-spreadsheet" onClick={() => baytIndir(`${T.dosya}-yukleme-sablonu.xlsx`, xlsxBayt(T.ad, [T.sutun, ...T.ornek]), XLSX_TURU)}>Şablonu indir</Tus>
          <Tus tur="ikincil" ikon="upload" disabled={mesgul} aria-busy={mesgul || undefined} data-ia-sec="" onClick={() => secici.current?.click()}>{dosya ? "Başka dosya seç" : "Excel seç"}</Tus>
          <span className={dosya ? stil.dosyaAd : stil.ipucuSatir}>{dosya?.ad ?? "Dosya seçilmedi"}</span>
          <input ref={secici} type="file" hidden accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" aria-label="Excel ya da CSV dosyası"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; sec(f); }} />
        </div>
        {hata && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
        {dosya && <>
          <p className={stil.iaOzet} id="w-ay-ia-ozet" tabIndex={-1}><b>{gecerli}</b> satır içe aktarılacak · <b>{dosya.satirlar.length - gecerli}</b> satır atlanacak</p>
          <div className={stil.onizlemeKap}>
            <table className={stil.onizleme}>
              <caption className="gizli">Satır denetimi</caption>
              <thead><tr><th scope="col">Satır</th><th scope="col">Kayıt</th><th scope="col">Durum</th></tr></thead>
              <tbody>
                {dosya.satirlar.map((x) => (
                  <tr key={x.no}>
                    <td className={stil.sayi}>{x.no}</td>
                    <td>{x.kod && <span className={stil.kodYazi}>{x.kod} </span>}{x.ana}{x.alt && <span className={stil.alt}>{x.alt}</span>}</td>
                    <td>{x.ok ? <><Rozet tur="tamam">Eklenecek</Rozet>{x.uyari && <span className={stil.altUyari}>{x.uyari}</span>}</> : <span className={stil.hata}>{x.neden}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={stil.tuslar}>
            <Tus ikon="check" disabled={mesgul || !gecerli} aria-busy={mesgul || undefined} data-ia-aktar="" onClick={aktar}>İçe aktar ({gecerli})</Tus>
            <Tus tur="ikincil" disabled={mesgul} onClick={() => { setDosya(null); setHata(null); odak("[data-ia-sec]"); }}>Vazgeç</Tus>
          </div>
        </>}
      </>}
      {gecmis.length > 0 ? <>
        <p className={stil.etiket}>Son içe aktarımlar</p>
        <ul className={stil.bilgiListe}>
          {gecmis.map((g) => (
            <li key={g.id}>
              {zamanYaz(g.zaman)} · {g.turAd} · {g.adet} kayıt{g.atlanan ? ` (${g.atlanan} satır atlandı)` : ""} · {g.kim}
              {g.geri && <span className={stil.alt}>geri alındı</span>}
              {yaz && g.son && !g.geri && <> <Tus tur="ikincil" ikon="undo-2" disabled={mesgul} data-ia-geri="" onClick={() => geriAl(g)}>Geri al</Tus></>}
            </li>
          ))}
        </ul>
      </> : !yaz && <p className={stil.ipucu}>Henüz içe aktarma yapılmadı.</p>}
    </>
  );
}
