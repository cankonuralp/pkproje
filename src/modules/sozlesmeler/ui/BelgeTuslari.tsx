"use client";
/* SÖZLEŞME BELGESİ TUŞLARI (2026-10-25, belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı,
   bir müşteri için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim"): Sözleşme PDF'i (indirilir) · Belgeyi doldur
   (firmanın yayındaki sözleşme formatının elle doldurulan yerleri — rapor-format BelgeDoldurmaTusu) · Müşteriye gönder (alıcılar en çok 5; ilk alıcı
   müşterinin e-postası, değiştirilebilir; PDF ekli e-posta, gönderen tuşa basan). Doldurma ve gönderme yalnız "yaz". Karar sunucuda. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { BelgeDegerleri } from "../../../belge/katalog";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { Alan, Girdi } from "../../../components/form/Form";
import { Ikon } from "../../../components/ikon/Ikon";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { Serit } from "../../../components/serit/Serit";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import type { FormatTanimi } from "../../../format/tanim";
import { BelgeDoldurmaTusu } from "../../rapor-format/ui/BelgeDoldurma";
import { GONDER_EN_COK } from "../sema";
import { sozlesmeDoldurEylemi, sozlesmeGonderEylemi } from "./belge-eylemler";
import stil from "./sozlesmeler.module.css";

export interface BelgeDoldurmaBilgisi { tanim: FormatTanimi; degerler: Record<string, string>; surum: number | null; bos: string[] }
type Onizleme = { firma: { ad: string; kod: string; adres?: string | null; logo?: string | null }; degerler: BelgeDegerleri };

const alanId = (i: number) => `sgw-kime-${i}`;

export function BelgeTuslari({ id, no, unvan, yaz, baslik, doldurma, onizleme, alici, konu }: {
  id: string; no: string; unvan: string; yaz: boolean; baslik: string; doldurma: BelgeDoldurmaBilgisi | null; onizleme: Onizleme | null; alici: string | null; konu: string;
}) {
  const [acik, setAcik] = useState(false);
  return (
    <>
      <a className={tusSinifi("ikincil")} href={`/sozlesmeler/${id}/pdf`} download><Ikon ad="download" kucuk />Sözleşme PDF’i</a>
      {yaz && doldurma && onizleme && (
        <BelgeDoldurmaTusu belge="sozlesme" baslik={baslik} tanim={doldurma.tanim} degerler={doldurma.degerler} surum={doldurma.surum} onizlemeVerisi={onizleme}
          kaydet={(d, s) => sozlesmeDoldurEylemi(id, d, s)} />
      )}
      {yaz && <Tus ikon="send" onClick={() => setAcik(true)}>Müşteriye gönder</Tus>}
      {acik && <GonderPenceresi kapat={() => setAcik(false)} id={id} no={no} unvan={unvan} alici={alici} konu={konu} bos={doldurma?.bos ?? []} />}
    </>
  );
}

function GonderPenceresi({ kapat, id, no, unvan, alici, konu, bos }: {
  kapat: () => void; id: string; no: string; unvan: string; alici: string | null; konu: string; bos: string[];
}) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [l, setL] = useState<string[]>([alici ?? ""]);
  const [h, setH] = useState<Record<number, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const odak = (i: number) => requestAnimationFrame(() => document.getElementById(alanId(i))?.focus());
  const gonder = () => baslat(async () => {
    /* boş satırlar gitmez; sunucunun "kime.N" hatası dolu satırların sırasıyla — girdinin satırına geri çevrilir */
    const dolu = l.map((x, i) => [x.trim(), i] as const).filter(([x]) => x);
    if (!dolu.length) { setH({ 0: "En az bir e-posta yazılmalı." }); setGenel(null); odak(0); return; }
    const r = await sozlesmeGonderEylemi(id, dolu.map(([x]) => x));
    if (!r.tamam) {
      const yeni: Record<number, string> = {};
      for (const [k, m] of Object.entries(r.hatalar ?? {})) {
        const n = /^kime\.(\d+)$/.exec(k);
        const satir = n ? dolu[Number(n[1])]?.[1] ?? dolu[0][1] : dolu[0][1];
        yeni[satir] ??= m;
      }
      setH(yeni); setGenel(r.genel ?? null);
      const ilk = Object.keys(yeni).map(Number).sort((a, b) => a - b)[0];
      if (ilk !== undefined) odak(ilk);
      return;
    }
    kapat();
    bildir(`${no}: ${r.adet ?? dolu.length} kişiye e-posta gönderiliyor.`);
    router.refresh();
  });
  const degistir = (i: number, x: string) => { setL(l.map((y, j) => (j === i ? x : y))); if (h[i]) { const k = { ...h }; delete k[i]; setH(k); } };
  const kaldir = (i: number) => { setL(l.filter((_, j) => j !== i)); setH({}); odak(Math.max(0, i - 1)); };
  return (
    <Pencere acik baslik="Müşteriye gönder" onKapat={kapat} odak={`#${alanId(0)}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="send" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={gonder}>Gönder</Tus></>}>
      <p className={pencereMetinSinifi}><b>{no}</b> · {unvan}</p>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      {bos.length > 0 && <Serit tur="uyari" ikon="triangle-alert">Elle doldurulacak {bos.length} yer boş: {bos.join(", ")}.</Serit>}
      <form className={stil.alicilar} onSubmit={(e) => { e.preventDefault(); gonder(); }}>
        {l.map((x, i) => (
          <Alan key={i} id={alanId(i)} etiket={l.length > 1 ? `Alıcı ${i + 1}` : "Alıcı"} zorunlu={i === 0} hata={h[i]}>
            <div className={stil.alici}>
              <Girdi id={alanId(i)} type="email" inputMode="email" maxLength={254} value={x} hata={!!h[i]} placeholder="E-posta adresi"
                onChange={(e) => degistir(i, e.target.value)} />
              {l.length > 1 && <Tus tur="ikincil" ikon="x" onClick={() => kaldir(i)} aria-label={`Alıcı ${i + 1} kaldır`}>Kaldır</Tus>}
            </div>
          </Alan>
        ))}
        <div className={stil.secenekler}>
          <Tus tur="ikincil" ikon="plus" disabled={l.length >= GONDER_EN_COK} aria-describedby={l.length >= GONDER_EN_COK ? "sgw-sinir" : undefined}
            onClick={() => { setL([...l, ""]); odak(l.length); }}>Alıcı ekle</Tus>
          {l.length >= GONDER_EN_COK && <span id="sgw-sinir" className={stil.ipucu}>En çok {GONDER_EN_COK} alıcı.</span>}
        </div>
      </form>
      <BilgiListesi>
        <Bilgi etiket="Konu" genis>{konu}</Bilgi>
        <Bilgi etiket="Ek" genis>{no}.pdf</Bilgi>
      </BilgiListesi>
    </Pencere>
  );
}
