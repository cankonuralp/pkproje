"use client";
/* SAHA RAPORU · ETİKET PLAKASINDAN OKUMA (385; maket maket-rapor.js etiket-oku · oneriKart "Etiket plakasından okunan"; ARKA-UC §5.2) — Ekipman
   bilgileri bölümünde "Etiketten oku" (kamera ya da galeri). Fotoğraf cihazda küçültülür; okuma sunucuda (firmanın anahtarıyla). Okunanlar ÖNERİ
   kartında: emin olunanlar "Önerileri uygula (n)" ile toplu, "Emin değil" olan tek tek "Uygula" ile alana yazılır; "Vazgeç" hiçbirini yazmaz.
   Yazılanlar rapora ancak Kaydet ile geçer; okunamazsa nedeni söylenir, elle giriş her zaman açık. Fotoğraftan okumayla aynı davranış (FotoOkuma.tsx):
   okuma ekranın işleminde, uzun işte dönen simge + geçen süre, kart açılınca odak kartta, kapanınca "Etiketten oku"da. */
import { useEffect, useRef, useState } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { fotografiKucult } from "../../../components/foto/kucult";
import { Ikon } from "../../../components/ikon/Ikon";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import tusStil from "../../../components/tus/Tus.module.css";
import { ETIKET_ALANLARI, type EtiketAlani, type EtiketOkunan } from "../../../server/yz/etiket";
import type { Baglam } from "./Bloklar";
import { etiketOkuEylemi } from "./eylemler";
import stil from "./raporlar.module.css";

const SURE_GOSTER_SN = 3;
const AD = Object.fromEntries(ETIKET_ALANLARI.map(([a, ad]) => [a, ad])) as Record<EtiketAlani, string>;

/** `alanlar`: ekranda sabit satırı olan etiket alanları (formatın sorduğu alan sabit satırda yok — orada okunan yazılmaz) */
export function EtiketOkuma({ raporId, alanlar, yaz, islem }: {
  raporId: string; alanlar: readonly EtiketAlani[]; yaz: (alan: EtiketAlani, deger: string) => void; islem: Baglam["islem"];
}) {
  const bildir = useBildir();
  const girdi = useRef<HTMLInputElement>(null);
  const kart = useRef<HTMLDivElement>(null);
  const [okunuyor, setOkunuyor] = useState(false);
  const [sn, setSn] = useState(0);
  const [oneri, setOneri] = useState<EtiketOkunan[] | null>(null);
  useEffect(() => {
    if (!okunuyor) return;
    const bas = Date.now();
    const zaman = setInterval(() => setSn(Math.floor((Date.now() - bas) / 1000)), 500);
    return () => { clearInterval(zaman); setSn(0); };
  }, [okunuyor]);

  const girdiyeDon = () => requestAnimationFrame(() => girdi.current?.focus());
  const oku = (dosya: File) => {
    if (girdi.current) girdi.current.value = "";
    if (okunuyor || islem.mesgul) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      bildir("Bağlantı yok: etiketten okuma bağlantı gelince yapılır. Bilgileri elle girebilirsiniz.");
      return;
    }
    setOkunuyor(true);
    bildir("Etiket okunuyor…");
    islem.baslat(async () => {
      try {
        const f = new FormData();
        f.set("id", raporId); f.set("dosya", await fotografiKucult(dosya));
        const r = await etiketOkuEylemi(f);
        if (!r.okunan) { bildir(r.genel ?? "Etiketten okunamadı. Bilgileri elle girebilirsiniz."); girdiyeDon(); return; }
        bildir(r.bildirim ?? "");
        /* ekranda satırı olmayan alan (formatın sorduğu) öneriye girmez */
        const l = r.okunan.filter((x) => alanlar.includes(x.alan));
        if (l.length) { setOneri(l); requestAnimationFrame(() => kart.current?.focus()); } else girdiyeDon();
      } catch {
        bildir("Etiketten okunamadı: bağlantı koptu ya da sunucu yanıt vermedi. Bilgileri elle girebilirsiniz.");
        girdiyeDon();
      } finally {
        setOkunuyor(false);
      }
    });
  };
  const kapat = () => { setOneri(null); girdiyeDon(); };
  const uygula = (secilen: EtiketOkunan[]) => {
    if (!oneri) return;
    for (const x of secilen) yaz(x.alan, x.deger);
    const kalan = oneri.filter((x) => !secilen.includes(x));
    bildir(`${secilen.map((x) => AD[x.alan]).join(", ")} rapora yazıldı; kaydetmeyi unutmayın.${kalan.length ? " Emin olunmayanları tek tek kontrol edin." : ""}`);
    if (!kalan.length) { kapat(); return; }
    setOneri(kalan);
    requestAnimationFrame(() => (kart.current?.querySelector<HTMLElement>("li button") ?? kart.current?.querySelector<HTMLElement>("button"))?.focus());
  };
  const emin = oneri ? oneri.filter((x) => x.guven !== "dusuk") : [];

  return (
    <>
      {oneri && (
        <div className={stil.oneriKart} ref={kart} tabIndex={-1} role="region" aria-label="Etiket plakasından okunan">
          <p className={stil.oneriBas}><Ikon ad="camera" kucuk />Etiket plakasından okunan</p>
          <ul className={stil.oneriListe}>
            {oneri.map((x) => (
              <li key={x.alan}>
                <span className={stil.oneriAd}>{AD[x.alan]}: <b>{x.deger}</b></span>
                <span className={stil.oneriSag}>
                  {x.guven === "dusuk"
                    ? <><Rozet tur="bekliyor">Emin değil</Rozet><Tus tur="ikincil" onClick={() => uygula([x])}>Uygula</Tus></>
                    : <Rozet tur="notr">Öneri</Rozet>}
                </span>
              </li>
            ))}
          </ul>
          <div className={stil.oneriTuslar}>
            <Tus tur="ikincil" onClick={() => { bildir("Okunanlar uygulanmadı."); kapat(); }}>Vazgeç</Tus>
            {emin.length > 0 && <Tus ikon="check" onClick={() => uygula(emin)}>Önerileri uygula ({emin.length})</Tus>}
          </div>
        </div>
      )}
      {!oneri && (
        <div className={stil.etiketCubuk}>
          <label className={`${tusSinifi("ikincil", okunuyor ? tusStil.mesgul : undefined)} ${stil.fotoEkle}`} aria-disabled={(islem.mesgul && !okunuyor) || undefined}>
            <input ref={girdi} type="file" accept="image/jpeg,image/png" className="gizli" aria-busy={okunuyor || undefined} aria-disabled={(islem.mesgul && !okunuyor) || undefined}
              aria-label="Etiketten oku" onClick={(e) => { if (okunuyor || islem.mesgul) e.preventDefault(); }}
              onChange={(e) => { const d = e.target.files?.[0]; if (d) oku(d); }} />
            {okunuyor ? <span className={tusStil.donen} aria-hidden="true" /> : <Ikon ad="camera" kucuk />}
            <span>{okunuyor ? "Okunuyor…" : "Etiketten oku"}</span>
            {okunuyor && sn >= SURE_GOSTER_SN && <span className={tusStil.sure}>{sn} sn</span>}
          </label>
        </div>
      )}
    </>
  );
}
