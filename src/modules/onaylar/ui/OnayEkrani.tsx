"use client";
/* ONAY EKRANI (maket onaylar.html onayCiz / raporCiz; 102, 190, 191): kırıntı Onaylar › (Tüm raporlar ›) rapor no · başlıkta rapor no + durum ·
   altında ekipman kodu · tür · tesis · denetçi · kuyruktaki sırası. Tuşlar duruma göre: onayda Durumu değiştir · Geri gönder · Onayla;
   onaylandı Durumu değiştir · Onayı geri al; Yeni Durumu değiştir; Tamamlandı'da Revizeye gönder (+ denetçinin bekleyen isteği varsa İsteği
   reddet ve "Revize isteği" şeridi — 318). Gözden geçirme özeti (uyarılar engel
   değil) ve raporun tamamına bağlantı. Onaylayınca ya da geri gönderince sıradaki rapor açılır (kuyruk boşsa kuyruğa dönülür). Geri gönder ve
   Yeni'ye alma gerekçe ister (≥ 10). Yetki, kural ve geçiş sunucuda ve veritabanında; buradaki tuşlar yalnız izinli olanı gösterir. */
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Kosullar } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, ipucuId } from "../../../components/form/Form";
import { Pencere } from "../../../components/pencere/Pencere";
import { Bolum, Kirinti, Kod, NesneBasi, Rozet, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { RAPOR_DURUM } from "../../raporlar/sema";
import { DURUM_HEDEF } from "../sema";
import type { OnayEkrani as Veri } from "../server/onaylar";
import { durumDegistirEylemi, geriGonderEylemi, onayGeriAlEylemi, onaylaEylemi, type OnayYaniti } from "./eylemler";
import { zamanYaz } from "./OnayListesi";
import { RevizePenceresi, type RevizeTuru } from "./RevizePenceresi";
import stil from "./onaylar.module.css";

const ID = { gerekce: "onay-gerekce", hedef: "onay-hedef" } as const;
type Pen = { tur: "geri" | "durum"; hedef: string | null; gerekce: string; hatalar: Record<string, string> };

/** belge: raporun imzasız belgesi (sunucuda çizilir, src/belge — PDF'le aynı çizici) */
export function OnayEkrani({ v, belge }: { v: Veri; belge: ReactNode }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [pen, setPen] = useState<Pen | null>(null);
  const [genel, setGenel] = useState<string | null>(null);
  const [rev, setRev] = useState<RevizeTuru | null>(null);
  const { r } = v;
  const [durumAd, rozet] = RAPOR_DURUM[r.durum];

  /* sonuç: sıradaki rapora ya da kuyruğa (onay, geri) · aynı ekranda (onayı geri al, durum) */
  const bitti = (y: OnayYaniti, git: boolean) => {
    /* işlevsel güncelleme: bekleme sırasında yazılan metin korunur, kapatılan pencere yeniden açılmaz */
    if (!y.tamam) { if (y.hatalar) { const h = y.hatalar; setPen((p) => (p ? { ...p, hatalar: h } : p)); } else { setPen(null); setGenel(y.genel ?? "İşlem yapılamadı."); } return; }
    setPen(null); setGenel(null); bildir(y.bildirim ?? "Kaydedildi.");
    if (git) router.push(y.sonraki ? `/onaylar/${y.sonraki}` : "/onaylar"); else router.refresh();
  };
  const onayla = () => baslat(async () => bitti(await onaylaEylemi(r.id, r.surum), true));
  const geriAl = () => baslat(async () => bitti(await onayGeriAlEylemi(r.id, r.surum), false));
  const gonder = () => pen && baslat(async () => {
    if (pen.tur === "geri") bitti(await geriGonderEylemi(r.id, r.surum, { gerekce: pen.gerekce }), true);
    else bitti(await durumDegistirEylemi(r.id, r.surum, { hedef: pen.hedef ?? undefined, gerekce: pen.gerekce }), false);
  });
  const zorunlu = pen?.tur === "geri" || pen?.hedef === "taslak";

  const tuslar = <>
    {r.izin.durumDegistir && <Tus tur="ikincil" ikon="refresh-cw" disabled={bekliyor} onClick={() => setPen({ tur: "durum", hedef: null, gerekce: "", hatalar: {} })}>Durumu değiştir</Tus>}
    {r.izin.geriGonder && <Tus tur="ikincil" ikon="undo-2" disabled={bekliyor} onClick={() => setPen({ tur: "geri", hedef: null, gerekce: "", hatalar: {} })}>Geri gönder</Tus>}
    {r.izin.onayGeriAl && <Tus tur="ikincil" ikon="undo-2" disabled={bekliyor} onClick={geriAl}>Onayı geri al</Tus>}
    {r.izin.onayla && <Tus ikon="check" disabled={bekliyor} onClick={onayla}>Onayla</Tus>}
    {r.izin.revize && v.istek && <Tus tur="ikincil" disabled={bekliyor} onClick={() => setRev("red")}>İsteği reddet</Tus>}
    {r.izin.revize && <Tus ikon="file-pen-line" disabled={bekliyor} onClick={() => setRev("revize")}>Revizeye gönder</Tus>}
  </>;

  return (
    <>
      <Kirinti ogeler={r.durum === "onayda" ? [["Onaylar", "/onaylar"], [r.no]] : [["Onaylar", "/onaylar"], ["Tüm raporlar", "/onaylar/tum"], [r.no]]} />
      <NesneBasi baslik={r.no} rozet={<Rozet tur={rozet}>{durumAd}</Rozet>} altIkon="wrench"
        alt={<><Kod>{r.ekipmanKod}</Kod> · {r.turAd} · {r.tesis} · {r.denetci}{v.sira ? ` · ${v.sira} / ${v.kuyrukBoyu}` : ""}</>} tuslar={tuslar} />
      {(genel || r.durum === "taslak" || v.istek) && (
        <SeritKap>
          {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
          {r.durum === "taslak" && <Serit tur="bilgi" ikon="info">Yeni: rapor denetçide; onaya gönderilince kuyruğa düşer.</Serit>}
          {v.istek && <Serit tur="uyari" ikon="file-pen-line"><b>Revize isteği</b> · {v.istek.kim} · {zamanYaz(v.istek.zaman)}: “{v.istek.gerekce}”</Serit>}
        </SeritKap>
      )}
      <Bolum id="onay-ozet" baslik="Gözden geçirme" sayac={r.bekleme ? <span className={r.eski ? stil.eski : stil.bekleme}>{r.bekleme} bekliyor</span> : undefined}>
        <Kosullar ogeler={v.ozet.map((x) => ({ tur: x.tamam ? "tamam" : "eksik", metin: x.metin }))} />
      </Bolum>
      <Bolum id="onay-rapor" baslik="Rapor (önizleme)" tuslar={<TusBaglanti ikon="file-text" href={`/raporlar/${r.id}`}>Rapor ekranı</TusBaglanti>}>
        {belge}
      </Bolum>

      {rev && <RevizePenceresi tur={rev} r={r} istek={v.istek} onKapat={() => setRev(null)}
        bitti={(s) => { setRev(null); setGenel(s.genel ?? null); if (!s.genel) router.refresh(); }} />}

      <Pencere acik={!!pen} baslik={`${pen?.tur === "durum" ? "Durumu değiştir" : "Geri gönder"} · ${r.no}`} onKapat={() => { if (!bekliyor) setPen(null); }} odak={pen?.tur === "durum" ? "input[type=radio]" : `#${ID.gerekce}`}
        alt={<>
          <Tus tur="ikincil" disabled={bekliyor} onClick={() => setPen(null)}>Vazgeç</Tus>
          <Tus ikon={pen?.tur === "durum" ? "refresh-cw" : "undo-2"} disabled={bekliyor} onClick={gonder}>{pen?.tur === "durum" ? "Durumu değiştir" : "Geri gönder"}</Tus>
        </>}>
        {pen?.tur === "durum" && (
          <fieldset className={stil.hedefler} id={ID.hedef} aria-describedby={pen.hatalar.hedef ? ipucuId(ID.hedef) : undefined}>
            <legend>Şu an: {durumAd}</legend>
            {DURUM_HEDEF.filter((d) => d !== r.durum).map((d) => (
              <label key={d} className={stil.secim}>
                <input type="radio" name={ID.hedef} value={d} checked={pen.hedef === d} disabled={bekliyor} onChange={() => setPen((p) => (p ? { ...p, hedef: d, hatalar: {} } : p))} />
                <span>{RAPOR_DURUM[d][0]}</span>
              </label>
            ))}
            {pen.hatalar.hedef && <p className={stil.hata} id={ipucuId(ID.hedef)}>{pen.hatalar.hedef}</p>}
          </fieldset>
        )}
        <Alan id={ID.gerekce} etiket="Gerekçe" zorunlu={zorunlu} hata={pen?.hatalar.gerekce}>
          <textarea id={ID.gerekce} className={stil.gerekce} maxLength={400} value={pen?.gerekce ?? ""} aria-invalid={!!pen?.hatalar.gerekce || undefined}
            aria-describedby={pen?.hatalar.gerekce ? ipucuId(ID.gerekce) : undefined} placeholder="Hangi bölümde ne eksik ya da yanlış"
            readOnly={bekliyor} onChange={(e) => { const g = e.target.value; setPen((p) => (p ? { ...p, gerekce: g, hatalar: { ...p.hatalar, gerekce: "" } } : p)); }} />
        </Alan>
      </Pencere>
    </>
  );
}
