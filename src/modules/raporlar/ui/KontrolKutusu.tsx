"use client";
/* KONTROL SÜRESİ KUTUSU (2026-11-12, göç 0128; maket yerel/maket/turkak-modeli.html 2. bölüm — pkproje.md §11 K2, K3; reisim: "yazılan süre ile
   ekipman başında geçirilen süre uymalı", "ara verme olmasın"): ölçümlü (TÜRKAK'lı firmada açılmış) raporda başlangıç / bitiş yazılmaz. Yazan
   "Kontrole başla" ve "Kontrolü bitir" der; saati veritabanı koyar. "Saati düzelt" (hiç ölçülmediyse "Saati gerekçeyle yaz") penceresi gerekçe ister
   (en az 10 karakter); ölçülen değer kayıtta kalır ve burada üstü çizili görünür. Kural ve yetki sunucuda (raporlar.ts kontrolBasla / kontrolBitir /
   kontrolSaatDuzelt). Bağlantı yokken saat alınmaz (bağlantısız çalışma T5). */
import { useEffect, useState } from "react";
import { useBildir, useUyar } from "../../../components/bildirim/Bildirim";
import { Alan, ipucuId } from "../../../components/form/Form";
import { Pencere } from "../../../components/pencere/Pencere";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { Tus } from "../../../components/tus/Tus";
import type { OlcumGorunumu } from "../server/raporlar";
import { TarihKutusu } from "./Bloklar";
import { kontrolBaslaEylemi, kontrolBitirEylemi, kontrolDuzeltEylemi, type RaporYaniti } from "./eylemler";
import stil from "./raporlar.module.css";

const tarihNo = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`;
const saatliNo = (s: string) => `${tarihNo(s)} ${s.slice(11, 16)}`;
/** "YYYY-MM-DDTHH:MM" (Türkiye saati, UTC+3) → an */
const an = (s: string) => new Date(`${s}:00+03:00`).getTime();
/** iki saat arası tam dakika (eksi olmaz) */
export const dakika = (bas: string, bit: string | number) => Math.max(0, Math.round(((typeof bit === "number" ? bit : an(bit)) - an(bas)) / 60_000));

const BAS = "r-kd-bas", BIT = "r-kd-bit", GEREKCE = "r-kd-gerekce";

export function KontrolKutusu({ raporId, olcum, duzenle, mesgul, baslat, yenile, hata }: {
  raporId: string; olcum: OlcumGorunumu;
  /** yazan, Yeni raporunda (tuşlar yalnız ona) */
  duzenle: boolean; mesgul: boolean;
  baslat: (is: () => Promise<void>) => void; yenile: () => void;
  /** sunucunun reddi / alan hatası ekranın genel şeridine */
  hata: (r: RaporYaniti) => void;
}) {
  const bildir = useBildir();
  const uyar = useUyar();
  const [pencere, setPencere] = useState(false);
  /* sürerken geçen dakika: tarayıcıda, çizimden sonra; yarım dakikada bir ilerler */
  const [gecen, setGecen] = useState<number | null>(null);
  const suruyor = olcum.durum === "suruyor" && olcum.bas ? olcum.bas : null;
  useEffect(() => {
    if (!suruyor) return;
    const g = () => setGecen(dakika(suruyor, Date.now()));
    queueMicrotask(g);
    const z = window.setInterval(g, 30_000);
    return () => window.clearInterval(z);
  }, [suruyor]);

  const calistir = (eylem: () => Promise<RaporYaniti>) => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) { uyar("Kontrol saati için bağlantı gerekli."); return; }
    baslat(async () => {
      let r: RaporYaniti;
      try { r = await eylem(); } catch { uyar("Bağlantı koptu; yeniden deneyin."); return; }
      if (r.tamam) { if (r.bildirim) bildir(r.bildirim); yenile(); return; }
      hata(r);
    });
  };
  const d = olcum.duzeltme;
  const rozet = olcum.durum === "suruyor" ? <Rozet tur="bekliyor">Sürüyor</Rozet>
    : olcum.durum === "bitti" ? (d ? <Rozet tur="notr">{d.olculenBas ? "Elle düzeltildi" : "Elle yazıldı"}</Rozet> : <Rozet tur="tamam">Ölçüldü</Rozet>)
      : <Rozet tur="notr">Başlamadı</Rozet>;
  return (
    <div className={stil.kontrolKutu} role="group" aria-labelledby="r-kontrol-b">
      <div className={stil.kontrolBas}><h3 className={stil.kontrolAd} id="r-kontrol-b">Kontrol süresi</h3>{rozet}</div>
      {olcum.durum === "yok" && (duzenle
        ? <div className={stil.kontrolTus}>
            <Tus ikon="clock" disabled={mesgul} onClick={() => calistir(() => kontrolBaslaEylemi(raporId))}>Kontrole başla</Tus>
            <Tus tur="ikincil" ikon="pencil" disabled={mesgul} onClick={() => setPencere(true)}>Saati gerekçeyle yaz</Tus>
          </div>
        : <p className={stil.ipucuMetin}>Kontrol başlatılmadı.</p>)}
      {olcum.durum === "suruyor" && olcum.bas && (
        <>
          <p className={stil.kontrolSure}><b>{gecen === null ? "…" : `${gecen} dk`}</b><span>Başladı {saatliNo(olcum.bas)}</span></p>
          {duzenle && <div className={stil.kontrolTus}>
            <Tus ikon="circle-check" disabled={mesgul} onClick={() => calistir(() => kontrolBitirEylemi(raporId))}>Kontrolü bitir</Tus>
          </div>}
        </>
      )}
      {olcum.durum === "bitti" && olcum.bas && olcum.bit && (
        <>
          <dl className={stil.kontrolOzet}>
            <div><dt>Başlangıç</dt><dd>{saatliNo(olcum.bas)}{d?.olculenBas && <s>{saatliNo(d.olculenBas)}</s>}</dd></div>
            <div><dt>Bitiş</dt><dd>{saatliNo(olcum.bit)}{d?.olculenBit && <s>{saatliNo(d.olculenBit)}</s>}</dd></div>
            <div><dt>Süre</dt><dd>{`${dakika(olcum.bas, olcum.bit)} dk`}</dd></div>
            {d && <div className={stil.kontrolGenis}><dt>Gerekçe</dt><dd>{d.gerekce}<span className={stil.ipucuMetin}>{` · ${d.kim}`}</span></dd></div>}
          </dl>
          {duzenle && <div className={stil.kontrolTus}>
            <Tus tur="ikincil" ikon="pencil" disabled={mesgul} onClick={() => setPencere(true)}>Saati düzelt</Tus>
          </div>}
        </>
      )}
      {pencere && <DuzeltPenceresi olcum={olcum} mesgul={mesgul} onKapat={() => setPencere(false)}
        gonder={(g) => new Promise((coz) => {
          if (typeof navigator !== "undefined" && navigator.onLine === false) { coz({ genel: "Kontrol saati için bağlantı gerekli." }); return; }
          baslat(async () => {
            let r: RaporYaniti;
            try { r = await kontrolDuzeltEylemi(raporId, g); } catch { coz({ genel: "Bağlantı koptu; yeniden deneyin." }); return; }
            if (r.tamam) { if (r.bildirim) bildir(r.bildirim); setPencere(false); yenile(); }
            coz(r);
          });
        })} />}
    </div>
  );
}

function DuzeltPenceresi({ olcum, mesgul, onKapat, gonder }: {
  olcum: OlcumGorunumu; mesgul: boolean; onKapat: () => void; gonder: (g: { bas: string; bit: string; gerekce: string }) => Promise<RaporYaniti>;
}) {
  const [bas, setBas] = useState(olcum.bas ?? "");
  const [bit, setBit] = useState(olcum.bit ?? "");
  const [gerekce, setGerekce] = useState("");
  const [h, setH] = useState<Record<string, string>>({});
  const yolla = async () => {
    const r = await gonder({ bas, bit, gerekce });
    if (r.tamam) return;
    const hatalar = r.hatalar ?? {};
    setH(Object.keys(hatalar).length ? hatalar : { gerekce: r.genel ?? "Saat yazılamadı." });
    document.getElementById(hatalar.bas ? BAS : hatalar.bit ? BIT : GEREKCE)?.focus();
  };
  return (
    <Pencere acik baslik={olcum.durum === "yok" ? "Saati gerekçeyle yaz" : "Saati düzelt"} onKapat={() => { if (!mesgul) onKapat(); }} odak={`#${GEREKCE}`}
      alt={<>
        <Tus tur="ikincil" disabled={mesgul} onClick={onKapat}>Vazgeç</Tus>
        <Tus ikon="check" disabled={mesgul} onClick={() => void yolla()}>Kaydet</Tus>
      </>}>
      <Alan id={BAS} etiket="Başlangıç" zorunlu hata={h.bas}>
        <TarihKutusu id={BAS} ad="Başlangıç" saat deger={bas} degistir={(x) => { setBas(x); setH({}); }} gecersiz={!!h.bas} tanim={h.bas ? ipucuId(BAS) : undefined} />
      </Alan>
      <Alan id={BIT} etiket="Bitiş" zorunlu hata={h.bit}>
        <TarihKutusu id={BIT} ad="Bitiş" saat deger={bit} degistir={(x) => { setBit(x); setH({}); }} gecersiz={!!h.bit} tanim={h.bit ? ipucuId(BIT) : undefined} />
      </Alan>
      <Alan id={GEREKCE} etiket="Gerekçe" zorunlu hata={h.gerekce}>
        <textarea id={GEREKCE} className={stil.metinAlan} maxLength={500} value={gerekce} readOnly={mesgul} aria-invalid={!!h.gerekce || undefined}
          aria-describedby={h.gerekce ? ipucuId(GEREKCE) : undefined} onChange={(e) => { setGerekce(e.target.value); setH({}); }} />
      </Alan>
    </Pencere>
  );
}
