"use client";
/* SAHA RAPORU · FOTOĞRAFTAN OKUMA (351; maket maket-rapor.js okuyabilir / oneriKart / nokta-oku — Z3; §8.10): ölçüm tablosunun altında "Fotoğraftan
   oku" (kamera ya da galeri). Fotoğraf cihazda küçültülür; okuma sunucuda (firmanın anahtarıyla). Okunanlar ÖNERİ kartında: emin olunanlar
   "Önerileri uygula (n)" ile toplu, "Emin değil" satırlar tek tek "Uygula" ile tabloya yazılır; "Vazgeç" hiçbirini yazmaz. Değeri boş var olan satır
   varsa okunan oraya yazılır (kartta "n. satır"; ölçü aletinden okunan Zx boş noktaya), yoksa yeni satır (foto-eslestir.ts). Yazılanlar rapora ancak
   Kaydet ile geçer. Okunamazsa nedeni söylenir; elle giriş her zaman açık.
   354 (350–351 incelemesi): okuma üst ekranın işleminde (o sürerken Kaydet / Onaya gönder / öteki okumalar kapalı); bağlantı yoksa istek gitmez (maket
   "Bağlantı yok …"); eylem düşerse (bağlantı koptu, sunucu yanıt vermedi) sayfa hata ekranına düşmez, kaydedilmemiş girişler kalır; uzun iş (kalıp
   12): dönen simge + 3 sn sonra geçen süre, girdi odağını korur (disabled değil, aria-busy); uygulamadan sonra odak kalan ilk tuşa, kart kapanınca
   "Fotoğraftan oku"ya. Okuma rapora pano fotoğrafı eklediyse ekran yenilenir (yeni sürüm).
   484: formatta tablonun "Fotoğraftan doldur"u açıksa çizilir (Bloklar — tanim.ts doldurma); okunan fotoğraf her tabloda rapora OKUMA fotoğrafı olarak
   eklenir (belgede görünmez; tablonun altında Doldurma.tsx OkumaFotolari). */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { fotografiKucult } from "../../../components/foto/kucult";
import { Ikon } from "../../../components/ikon/Ikon";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import tusStil from "../../../components/tus/Tus.module.css";
import type { BolumOf } from "../../../format/tanim";
import type { OkunanSatir } from "../../../server/yz/okuma";
import { okunanHedefleri, okunanlariUygula, type Satir } from "../foto-eslestir";
import type { Baglam } from "./Bloklar";
import { fotoOkuEylemi } from "./eylemler";
import stil from "./raporlar.module.css";

const SURE_GOSTER_SN = 3;
type Oneri = OkunanSatir & { kimlik: number };

/** `tuslar`: tablonun öteki tuşları (Satır ekle …) — maketteki gibi aynı çubukta, "Fotoğraftan oku" önce; öneri kartı çubuğun üstünde */
export function FotoOkuma({ raporId, b, satirlar, tablo, islem, tuslar, cubuk, deneme = false }: {
  raporId: string; b: BolumOf<"olcum">; satirlar: readonly Satir[]; tablo: (f: (l: Satir[]) => Satir[]) => void; islem: Baglam["islem"];
  tuslar: ReactNode; cubuk: string;
  /** 484: format kurucusunun saha ekranındaki örnek rapor — fotoğraf okunmaz, ne olacağı söylenir */
  deneme?: boolean;
}) {
  const bildir = useBildir();
  const girdi = useRef<HTMLInputElement>(null);
  const kart = useRef<HTMLDivElement>(null);
  const [okunuyor, setOkunuyor] = useState(false);
  const [sn, setSn] = useState(0);
  const [oneri, setOneri] = useState<Oneri[] | null>(null);
  const kartId = `r-oneri-${b.id}`;

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
    if (deneme) { bildir("Örnek raporda fotoğraf okunmaz; gerçek raporda yapay zekâ tablonun satırlarını okur, öneri olarak gelir, fotoğraf belgede görünmez."); return; }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      bildir("Bağlantı yok: fotoğraftan okuma bağlantı gelince yapılır. Değerleri elle girebilirsiniz.");
      return;
    }
    setOkunuyor(true);
    bildir("Fotoğraf okunuyor…");
    islem.baslat(async () => {
      try {
        const f = new FormData();
        f.set("id", raporId); f.set("bolum", b.id); f.set("dosya", await fotografiKucult(dosya));
        const r = await fotoOkuEylemi(f);
        if (!r.satirlar) { bildir(r.genel ?? "Fotoğraftan okunamadı. Değerleri elle girebilirsiniz."); girdiyeDon(); return; }
        bildir(r.bildirim ?? "");
        if (r.yenile) islem.yenile();
        if (r.satirlar.length) { setOneri(r.satirlar.map((s, i) => ({ ...s, kimlik: i }))); requestAnimationFrame(() => kart.current?.focus()); }
        else girdiyeDon();
      } catch {
        bildir("Fotoğraftan okunamadı: bağlantı koptu ya da sunucu yanıt vermedi. Değerleri elle girebilirsiniz.");
        girdiyeDon();
      } finally {
        setOkunuyor(false);
      }
    });
  };
  const kapat = () => { setOneri(null); girdiyeDon(); };
  /* kartın gösterdiği yerler: bütün öneriler aynı anki tabloya göre */
  const hedef = oneri ? okunanHedefleri(satirlar, oneri) : [];
  const uygula = (secilen: number[]) => {
    if (!oneri) return;
    const sec = secilen.map((i) => ({ degerler: oneri[i].degerler, hedef: hedef[i] ?? null }));
    tablo((l) => okunanlariUygula(l, sec));
    const doldurulan = sec.filter((x) => x.hedef !== null).length;
    bildir(`${sec.length} satır tabloya yazıldı${doldurulan ? ` (${doldurulan} tanesi var olan satıra)` : ""}; kaydetmeyi unutmayın.`);
    const kalan = oneri.filter((_, i) => !secilen.includes(i));
    if (!kalan.length) { kapat(); return; }
    setOneri(kalan);
    requestAnimationFrame(() => (kart.current?.querySelector<HTMLElement>("li button") ?? kart.current?.querySelector<HTMLElement>("button"))?.focus());
  };
  const metin = (s: OkunanSatir) => b.sutunlar.filter((c) => s.degerler[c.id]).map((c) => {
    const v = s.degerler[c.id]!;
    return `${c.ad}: ${c.giris === "evet" ? (v === "evet" ? "Evet" : "Hayır") : v}${c.birim && c.giris === "sayi" ? ` ${c.birim}` : ""}`;
  }).join(" · ");
  const emin = oneri ? oneri.flatMap((s, i) => (s.guven !== "dusuk" ? [i] : [])) : [];

  return (
    <>
      {oneri && (
        <div className={stil.oneriKart} id={kartId} ref={kart} tabIndex={-1} role="region" aria-label={`${b.ad}: fotoğraftan okunan`}>
          <p className={stil.oneriBas}><Ikon ad="camera" kucuk />Fotoğraftan okunan</p>
          <ul className={stil.oneriListe}>
            {oneri.map((s, i) => (
              <li key={s.kimlik}>
                <span className={stil.oneriAd}>{hedef[i] !== null && hedef[i] !== undefined && <b>{hedef[i]! + 1}. satır · </b>}{metin(s)}</span>
                <span className={stil.oneriSag}>
                  {s.guven === "dusuk"
                    ? <><Rozet tur="bekliyor">Emin değil</Rozet><Tus tur="ikincil" onClick={() => uygula([i])}>Uygula</Tus></>
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
      <div className={cubuk}>
        {!oneri && (
          <label className={`${tusSinifi("ikincil", okunuyor ? tusStil.mesgul : undefined)} ${stil.fotoEkle}`} aria-disabled={(islem.mesgul && !okunuyor) || undefined}>
            <input ref={girdi} type="file" accept="image/jpeg,image/png" className="gizli" aria-busy={okunuyor || undefined} aria-disabled={(islem.mesgul && !okunuyor) || undefined}
              aria-label={`${b.ad}: fotoğraftan oku`} onClick={(e) => { if (okunuyor || islem.mesgul) e.preventDefault(); }}
              onChange={(e) => { const d = e.target.files?.[0]; if (d) oku(d); }} />
            {okunuyor ? <span className={tusStil.donen} aria-hidden="true" /> : <Ikon ad="camera" kucuk />}
            <span>{okunuyor ? "Okunuyor…" : "Fotoğraftan oku"}</span>
            {okunuyor && sn >= SURE_GOSTER_SN && <span className={tusStil.sure}>{sn} sn</span>}
          </label>
        )}
        {tuslar}
      </div>
    </>
  );
}
