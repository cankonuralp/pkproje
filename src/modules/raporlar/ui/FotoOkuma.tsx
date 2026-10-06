"use client";
/* SAHA RAPORU · FOTOĞRAFTAN OKUMA (351; maket maket-rapor.js okuyabilir / oneriKart — Z3; §8.10): ölçüm tablosunun altında "Fotoğraftan oku" (kamera
   ya da galeri). Fotoğraf cihazda küçültülür; okuma sunucuda (firmanın anahtarıyla). Okunanlar ÖNERİ kartında: emin olunanlar "Önerileri uygula (n)"
   ile toplu, "Emin değil" satırlar tek tek "Uygula" ile tabloya eklenir; "Vazgeç" hiçbirini eklemez. Eklenen satırlar rapora ancak Kaydet ile yazılır.
   Okunamazsa nedeni söylenir; elle giriş her zaman açık. */
import { useRef, useState, useTransition, type ReactNode } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { fotografiKucult } from "../../../components/foto/kucult";
import { Ikon } from "../../../components/ikon/Ikon";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import type { BolumOf } from "../../../format/tanim";
import type { OkunanSatir } from "../../../server/yz/okuma";
import { fotoOkuEylemi } from "./eylemler";
import stil from "./raporlar.module.css";

/** `tuslar`: tablonun öteki tuşları (Satır ekle …) — maketteki gibi aynı çubukta, "Fotoğraftan oku" önce; öneri kartı çubuğun üstünde */
export function FotoOkuma({ raporId, b, ekle, tuslar, cubuk }: {
  raporId: string; b: BolumOf<"olcum">; ekle: (satirlar: Record<string, string>[]) => void; tuslar: ReactNode; cubuk: string;
}) {
  const bildir = useBildir();
  const girdi = useRef<HTMLInputElement>(null);
  const kart = useRef<HTMLDivElement>(null);
  const [okunuyor, baslat] = useTransition();
  const [oneri, setOneri] = useState<OkunanSatir[] | null>(null);
  const kartId = `r-oneri-${b.id}`;

  const oku = (dosya: File) => baslat(async () => {
    const f = new FormData();
    f.set("id", raporId); f.set("bolum", b.id); f.set("dosya", await fotografiKucult(dosya));
    const r = await fotoOkuEylemi(f);
    if (girdi.current) girdi.current.value = "";
    if (!r.satirlar) { bildir(r.genel ?? "Fotoğraftan okunamadı. Değerleri elle girebilirsiniz."); return; }
    bildir(r.bildirim ?? "");
    if (r.satirlar.length) { setOneri(r.satirlar); requestAnimationFrame(() => kart.current?.focus()); }
  });
  const kapat = () => { setOneri(null); requestAnimationFrame(() => girdi.current?.focus()); };
  const uygula = (secilen: OkunanSatir[], kalan: OkunanSatir[]) => {
    ekle(secilen.map((s) => s.degerler));
    bildir(`${secilen.length} satır tabloya eklendi; kaydetmeyi unutmayın.`);
    if (kalan.length) setOneri(kalan); else kapat();
  };
  const metin = (s: OkunanSatir) => b.sutunlar.filter((c) => s.degerler[c.id]).map((c) => {
    const v = s.degerler[c.id]!;
    return `${c.ad}: ${c.giris === "evet" ? (v === "evet" ? "Evet" : "Hayır") : v}${c.birim && c.giris === "sayi" ? ` ${c.birim}` : ""}`;
  }).join(" · ");
  const emin = oneri?.filter((s) => s.guven !== "dusuk") ?? [];

  return (
    <>
      {oneri && (
        <div className={stil.oneriKart} id={kartId} ref={kart} tabIndex={-1} role="region" aria-label={`${b.ad}: fotoğraftan okunan`}>
          <p className={stil.oneriBas}><Ikon ad="camera" kucuk />Fotoğraftan okunan</p>
          <ul className={stil.oneriListe}>
            {oneri.map((s, i) => (
              <li key={i}>
                <span className={stil.oneriAd}>{metin(s)}</span>
                <span className={stil.oneriSag}>
                  {s.guven === "dusuk"
                    ? <><Rozet tur="bekliyor">Emin değil</Rozet><Tus tur="ikincil" onClick={() => uygula([s], oneri.filter((_, j) => j !== i))}>Uygula</Tus></>
                    : <Rozet tur="notr">Öneri</Rozet>}
                </span>
              </li>
            ))}
          </ul>
          <div className={stil.oneriTuslar}>
            <Tus tur="ikincil" onClick={() => { bildir("Okunanlar uygulanmadı."); kapat(); }}>Vazgeç</Tus>
            {emin.length > 0 && <Tus ikon="check" onClick={() => uygula(emin, oneri.filter((s) => s.guven === "dusuk"))}>Önerileri uygula ({emin.length})</Tus>}
          </div>
        </div>
      )}
      <div className={cubuk}>
        {!oneri && (
          <label className={`${tusSinifi("ikincil")} ${stil.fotoEkle}`} aria-disabled={okunuyor || undefined}>
            <input ref={girdi} type="file" accept="image/jpeg,image/png" className="gizli" disabled={okunuyor}
              aria-label={`${b.ad}: fotoğraftan oku`} onChange={(e) => { const d = e.target.files?.[0]; if (d) oku(d); }} />
            <Ikon ad="camera" kucuk />{okunuyor ? "Okunuyor…" : "Fotoğraftan oku"}
          </label>
        )}
        {tuslar}
      </div>
    </>
  );
}
