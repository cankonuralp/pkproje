"use client";
/* YÖNETİM › FİRMA › ÇALIŞMA MODELİ (2026-11-12, göç 0127; maket yerel/maket/turkak-modeli.html 1. bölüm — reisim: "firma açarken türkaklı türkaksız
   diye seçenek olsun yönetimde ona göre açalım daha sonra içeriden de değiştirlebilsin ayarlar"; pkproje.md §11 K1): seçim + Kaydet (önce sorulur),
   altında değişiklik geçmişi (tarih · değişiklik). Karar sunucuda ve veritabanında (firma_yonetim_model); firma bu ayarı değiştiremez. */
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { TabloSayfalari, useSayfa } from "../../../components/liste/Sayfalayici";
import { useOnayla } from "../../../components/pencere/Onay";
import { SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { CALISMA_MODELLERI, MODEL_ADI, type CalismaModeli } from "../../../tanim/calisma-modeli";
import type { ModelGorunumu } from "../server/firma-tarafi";
import { modelDegistirEylemi } from "./eylemler";
import stil from "./yonetim.module.css";

const ZAMAN = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const MODEL_ACIKLAMA: Record<CalismaModeli, string> = {
  turkak: "Kontrol saati ölçülür, sapma gerekçeyle geçer.",
  siz: "Saat elle yazılır, kurallar uyarıdır.",
};
/** en yeni model seçeneği üstte: TÜRKAK'lı, sonra TÜRKAK'sız (maket sırası) */
export const MODEL_SIRASI: readonly CalismaModeli[] = [...CALISMA_MODELLERI].reverse();

export function ModelBolumu({ id, firmaAd, m }: { id: string; firmaAd: string; m: ModelGorunumu | null }) {
  const onayla = useOnayla();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [secili, setSecili] = useState<CalismaModeli>(m?.model ?? "siz");
  const [hata, setHata] = useState<string | null>(null);
  /* geçmiş 20'den uzunsa sayfalı (ortak sayfalama — tests/sayfalama.test.ts) */
  const sayfa = useSayfa(m?.gecmis.length ?? 0);
  if (!m) return <SeritKap><Serit tur="uyari" ikon="triangle-alert">Çalışma modeli okunamadı; sayfayı yenileyin.</Serit></SeritKap>;

  const kaydet = async () => {
    if (!(await onayla({ baslik: "Çalışma modeli değişsin mi?", metin: `${firmaAd}: ${MODEL_ADI[m.model]} → ${MODEL_ADI[secili]}. Yalnız bundan sonra açılan raporlar yeni kurala girer.`, tus: "Değiştir" }))) return;
    baslat(async () => {
      const r = await modelDegistirEylemi(id, secili);
      if (!r.tamam) { setHata(r.genel ?? r.hatalar?.model ?? "Çalışma modeli kaydedilemedi."); return; }
      setHata(null); bildir(`Çalışma modeli: ${MODEL_ADI[secili]}`);
    });
  };
  return (
    <>
      {hata && <SeritKap><Serit tur="hata" ikon="circle-alert">{hata}</Serit></SeritKap>}
      <fieldset className={stil.vtSecim}>
        <legend className="gizli">Çalışma modeli</legend>
        {MODEL_SIRASI.map((k) => (
          <label key={k} className={stil.vtSecenek}>
            <input type="radio" name="yf-model" value={k} checked={secili === k} disabled={bekliyor} onChange={() => { setSecili(k); setHata(null); }} />
            <span>{MODEL_ADI[k]}<span className={stil.vtAciklama}>{MODEL_ACIKLAMA[k]}</span></span>
          </label>
        ))}
      </fieldset>
      <div className={stil.eylemSol}>
        <Tus ikon="check" disabled={bekliyor || secili === m.model} aria-busy={bekliyor || undefined} onClick={() => void kaydet()}>Kaydet</Tus>
      </div>
      {m.gecmis.length > 0 && (
        <div className={stil.yedekTabloKap}>
          <table className={`${stil.yedekTablo} ${stil.modelTablo}`}>
            <caption className="gizli">Çalışma modeli geçmişi</caption>
            <thead><tr><th scope="col">Tarih</th><th scope="col">Değişiklik</th></tr></thead>
            <tbody>
              {sayfa.dilim(m.gecmis).map((g, i) => (
                <tr key={`${g.zaman}-${i}`}>
                  <td>{ZAMAN.format(new Date(g.zaman))}</td>
                  <td>{g.acilis || !g.eski ? `Firma ${MODEL_ADI[g.yeni]} açıldı` : `${MODEL_ADI[g.eski]} → ${MODEL_ADI[g.yeni]}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <TabloSayfalari s={sayfa} ad="değişiklik" />
        </div>
      )}
    </>
  );
}
