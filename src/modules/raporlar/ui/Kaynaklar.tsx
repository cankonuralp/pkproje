"use client";
/* STANDART PENCERESİ (428; reisim 2026-10-09: "Denetçi muayene yaparken standarta tıklayınca pop-up olarak standart açılmalı okuyabilmeli
   yanlışlıkla tıklaması ihtimaline karşı önceden sorsun evet denirse açılsın"). Madde / grup standardı ve türün kontrol metodu tuş olarak
   görünür; basınca ÖNCE sorulur ("Standart açılsın mı?"), Aç denirse pencere: her atıf (dokumanlar/eslestir.ts) firmanın standart
   kütüphanesindeki güncel PDF'le (çerçevede, uygulamanın kendi kökeninden — kısa ömürlü yetkili indirme; telefonda yeni sekmede) ya da Bakanlık
   kriter belgesinin metniyle (ZPKKnn) açılır. Kütüphanede yoksa söylenir. Rapordaki yer ve yazılanlar değişmez (pencere kapanınca odak
   tuşa döner). */
import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";
import { DosyaAcTusu, dosyaCerceveAdresi } from "../../../components/gizli-resim/GizliResim";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere } from "../../../components/pencere/Pencere";
import type { KriterBelgesi } from "../../../tanim/kriterler";
import { atiflar, kriterKodu, standartBul } from "../../dokumanlar/eslestir";
import type { RaporKaynaklari } from "../server/raporlar";
import stil from "./raporlar.module.css";

/** standart tuşu: önce sorar, evet denirse standart penceresi */
export function StandartTusu({ std, kaynak }: { std: string; kaynak: RaporKaynaklari }) {
  const onayla = useOnayla();
  const [acik, setAcik] = useState(false);
  const ac = async () => {
    /* soru penceresi kapanıp odağı tuşa geri verdikten sonra açılır — yoksa yeni pencere odağı kapanan sorudaki "Aç"a bağlar, kapanınca odak
       sayfaya düşerdi (uçtan uca saha-raporu) */
    if (await onayla({ baslik: "Standart açılsın mı?", metin: `“${std}” bir pencerede açılır; rapordaki yeriniz ve yazdıklarınız değişmez.`, tus: "Aç" })) {
      requestAnimationFrame(() => setAcik(true));
    }
  };
  return (
    <>
      <button type="button" className={stil.stdTus} aria-haspopup="dialog" onClick={() => void ac()}>
        <Ikon ad="book-open" kucuk /><span>{std}</span>
      </button>
      {/* pencere belgenin köküne: tuş paragrafın / başlığın içinde durabilir — <dialog> orada geçersiz iç içelik olurdu (uçtan uca telefon:
          geliştirme kipinin hata katmanı ekranı kapatıyordu) */}
      {acik && createPortal(
        <Pencere acik baslik="Standart" genis onKapat={() => setAcik(false)}>
          {atiflar(std).map((a, i) => <Atif key={i} atif={a} kaynak={kaynak} />)}
        </Pencere>, document.body)}
    </>
  );
}

function Atif({ atif, kaynak }: { atif: string; kaynak: RaporKaynaklari }) {
  const kod = kriterKodu(atif);
  if (kod) {
    const k = kaynak.kriterler.find((x) => x.kod === kod);
    if (k) return <KriterMetni k={k} />;
    return (
      <section className={stil.stdBolum}>
        <h3>{atif}</h3>
        <p className={stil.stdNot}>Bakanlık kriter belgesi <Link href={`/dokumanlar/kriterler/${kod}`}>Dökümanlar › Kriterler</Link> sayfasında.</p>
      </section>
    );
  }
  const s = kaynak.standartlar ? standartBul(atif, kaynak.standartlar) : null;
  if (!s) return (
    <section className={stil.stdBolum}>
      <h3>{atif}</h3>
      <p className={stil.stdNot}>{kaynak.standartlar
        ? "Bu standart firmanın standart kütüphanesinde yok. PDF'i Dökümanlar › Standartlar'a yüklenince buradan açılır."
        : "Standartları görme yetkiniz yok."}</p>
    </section>
  );
  return (
    <section className={stil.stdBolum}>
      <h3>{s.no}:{s.surumAdi}</h3>
      <p className={stil.stdNot}>{s.konu}{atif.trim() !== s.no ? ` · atıf: ${atif}` : ""}</p>
      {dosyaCerceveAdresi(s.dosyaId) && <iframe className={stil.stdCerceve} src={dosyaCerceveAdresi(s.dosyaId)!} title={`${s.no} standardı`} />}
      <p className={stil.stdTelefon}>Telefonda PDF yeni sekmede açılır.</p>
      <DosyaAcTusu dosyaId={s.dosyaId} ikon="file-text">Yeni sekmede aç</DosyaAcTusu>
    </section>
  );
}

/* ── TALİMAT (430; reisim 2026-10-09: "kontrol madde başlıklarında ve başlıkların yanında küçük ünlemler olmalı ve talimat yazılabilmeli, eğer o
   madde için bir talimat yoksa ünlem olmasın ama kontrol başlığında her daim o ünlem olsun tıklayınca yine pop-up talimatlar gözüksün
   talimatlar o işlemlerin nasıl yapılacağına dair açıklamalardır"). Talimat formatta yazılır (Format kurucu: madde / grup / genel); PDF'e
   basılmaz. Tıklayınca sormadan açılır (yalnız okunur, rapora dokunmaz). ── */
export interface TalimatParcasi { baslik?: string; metin: string }
/** ünlem tuşu → talimat penceresi; parçalar boşsa pencere "talimat yazılmamış" der */
export function TalimatTusu({ ad, baslik, parcalar, buyuk = false }: { ad: string; baslik: string; parcalar: TalimatParcasi[]; buyuk?: boolean }) {
  const [acik, setAcik] = useState(false);
  const dolu = parcalar.filter((p) => p.metin.trim());
  return (
    <>
      <button type="button" className={buyuk ? `${stil.talimatTus} ${stil.talimatBuyuk}` : stil.talimatTus} aria-haspopup="dialog" aria-label={`${ad} talimatı`}
        title="Talimat" data-talimat={dolu.length ? "var" : "yok"} onClick={() => setAcik(true)}>
        <Ikon ad="circle-alert" kucuk={!buyuk} />
      </button>
      {acik && createPortal(
        <Pencere acik baslik={baslik} genis={dolu.length > 1} onKapat={() => setAcik(false)}>
          {dolu.length ? dolu.map((p, i) => (
            <section key={i} className={stil.talimatBolum}>
              {p.baslik && <h3>{p.baslik}</h3>}
              {p.metin.trim().split("\n").filter(Boolean).map((s, j) => <p key={j}>{s}</p>)}
            </section>
          )) : <p className={stil.stdNot}>Bu kontrol için talimat yazılmamış. Talimat rapor formatında yazılır (Ekipman türleri › Rapor şablonu › Format kurucu).</p>}
        </Pencere>, document.body)}
    </>
  );
}

/** Bakanlık kriter belgesi (kodda; src/tanim/kriterler.ts) — kapsam, maddeler, notlar */
function KriterMetni({ k }: { k: KriterBelgesi }) {
  return (
    <section className={stil.stdBolum}>
      <h3>{k.kod} · {k.ad}</h3>
      <p className={stil.stdNot}>{k.kapsam}</p>
      <ol className={stil.kriterMaddeleri}>
        {k.maddeler.map((m) => (
          <li key={m.no}>
            <b>{m.no} · {m.baslik}</b>
            <p>{m.icerik}</p>
            <p className={stil.stdNot}>{m.kaynak}</p>
          </li>
        ))}
      </ol>
      {k.notlar.length > 0 && <>
        <h4 className={stil.kriterNotBas}>Notlar</h4>
        <ol className={stil.kriterNotlar}>{k.notlar.map((n, i) => <li key={i}>{n}</li>)}</ol>
      </>}
    </section>
  );
}
