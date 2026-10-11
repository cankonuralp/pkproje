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
   eklenir (belgede görünmez; tablonun altında Doldurma.tsx OkumaFotolari).
   486: tuş "Fotoğraf ekle (yapay zekâ okur)" — formatta açık tabloda HER ZAMAN; firmada yapay zekâ kapalıyken fotoğraf okunmadan saklanır, açılınca
   fotoğrafın "Oku"su okur (iş Doldurma.tsx useFotoEkle'de, alanlı bölümle ortak). */
import { useRef, useState, type ReactNode } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Ikon } from "../../../components/ikon/Ikon";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { Tus } from "../../../components/tus/Tus";
import type { BolumOf } from "../../../format/tanim";
import type { OkunanSatir } from "../../../server/yz/okuma";
import { okunanHedefleri, okunanlariUygula, type Satir } from "../foto-eslestir";
import type { RaporFoto } from "../server/raporlar";
import type { Baglam } from "./Bloklar";
import { FotoEkleTusu, OkumaFotolari, OkumaNotu, useFotoEkle, type OkumaKipi } from "./Doldurma";
import { fotoOkuEylemi } from "./eylemler";
import stil from "./raporlar.module.css";

type Oneri = OkunanSatir & { kimlik: number };

/** `tuslar`: tablonun öteki tuşları (Satır ekle …) — maketteki gibi aynı çubukta, "Fotoğraf ekle" önce; öneri kartı çubuğun üstünde */
export function FotoOkuma({ v, b, satirlar, tablo, islem, tuslar, cubuk, kip }: {
  v: { id: string; surum: number; fotolar: RaporFoto[] }; b: BolumOf<"olcum">; satirlar: readonly Satir[]; tablo: (f: (l: Satir[]) => Satir[]) => void;
  islem: Baglam["islem"]; tuslar: ReactNode; cubuk: string; kip: OkumaKipi;
}) {
  const bildir = useBildir();
  const kart = useRef<HTMLDivElement>(null);
  const [oneri, setOneri] = useState<Oneri[] | null>(null);
  const kartId = `r-oneri-${b.id}`;
  const f = useFotoEkle<OkunanSatir>({ raporId: v.id, bolumId: b.id, kip, islem, elle: "Değerleri elle girebilirsiniz.",
    oku: async (x) => { const r = await fotoOkuEylemi(x); return { ...r, oneri: r.satirlar }; },
    oneri: (l) => { setOneri(l.map((s, i) => ({ ...s, kimlik: i }))); requestAnimationFrame(() => kart.current?.focus()); return true; } });
  const kapat = () => { setOneri(null); f.girdiyeDon(); };
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
        {!oneri && <FotoEkleTusu baslik={b.ad} girdi={f.girdi} okunuyor={f.okunuyor} sn={f.sn} kip={kip} mesgul={islem.mesgul} gonder={f.gonder} />}
        {tuslar}
      </div>
      {kip === "sakla" && <OkumaNotu />}
      <OkumaFotolari v={v} bolumId={b.id} oku={false} islem={islem} okut={kip === "oku" && !oneri ? f.gonder : undefined} />
    </>
  );
}
