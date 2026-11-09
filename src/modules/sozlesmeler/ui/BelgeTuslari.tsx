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
import { aliciHatalari, aliciId, Alicilar, doluAlicilar } from "../../../components/eposta/Alicilar";
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

const ON = "sgw";

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
  const odak = (i: number) => requestAnimationFrame(() => document.getElementById(aliciId(ON, i))?.focus());
  const gonder = () => baslat(async () => {
    /* boş satırlar gitmez; sunucunun "kime.N" hatası dolu satırların sırasıyla — girdinin satırına geri çevrilir */
    const dolu = doluAlicilar(l);
    if (!dolu.length) { setH({ 0: "En az bir e-posta yazılmalı." }); setGenel(null); odak(0); return; }
    const r = await sozlesmeGonderEylemi(id, dolu.map(([x]) => x));
    if (!r.tamam) {
      const yeni = aliciHatalari(dolu, r.hatalar ?? {});
      setH(yeni); setGenel(r.genel ?? null);
      const ilk = Object.keys(yeni).map(Number).sort((a, b) => a - b)[0];
      if (ilk !== undefined) odak(ilk);
      return;
    }
    kapat();
    bildir(`${no}: ${r.adet ?? dolu.length} kişiye e-posta gönderiliyor.`);
    router.refresh();
  });
  return (
    <Pencere acik baslik="Müşteriye gönder" onKapat={kapat} odak={`#${aliciId(ON, 0)}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="send" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={gonder}>Gönder</Tus></>}>
      <p className={pencereMetinSinifi}><b>{no}</b> · {unvan}</p>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      {bos.length > 0 && <Serit tur="uyari" ikon="triangle-alert">Elle doldurulacak {bos.length} yer boş: {bos.join(", ")}.</Serit>}
      <form className={stil.alicilar} onSubmit={(e) => { e.preventDefault(); gonder(); }}>
        <Alicilar on={ON} liste={l} hatalar={h} enCok={GONDER_EN_COK} degistir={setL} hataTemizle={setH} />
      </form>
      <BilgiListesi>
        <Bilgi etiket="Konu" genis>{konu}</Bilgi>
        <Bilgi etiket="Ek" genis>{no}.pdf</Bilgi>
      </BilgiListesi>
    </Pencere>
  );
}
