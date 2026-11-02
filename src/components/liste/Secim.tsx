"use client";
/* TOPLU SEÇİM — tek üretici. 596'da Onaylar'da doğdu (TopluImza: imza / onay); 2026-11-02 (liste maketi onaylı — reisim "seç sil toplu sil vs yok
   raporlar için"): Raporlar ve plan içi raporlar da kullanır. Satırın kutusu, sayfanın hepsini seçen başlık kutusu (kısmi seçimde yarım işaret), altta
   havada duran seçim çubuğu (data-alt-cubuk: S.A.Y düğmesi üstüne çıkar). Seçilen satırlar sayfalar arasında kalır (sunucuda sayfalı listede başka
   sayfadakiler de) — satırın kendisi tutulur, toplu iş onunla yapılır; sınır aşılınca üstte uyarı. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useUyar } from "../bildirim/Bildirim";
import { Tus } from "../tus/Tus";
import stil from "./Secim.module.css";

/** satırın seçim kutusu (dokunma hedefi denetim yüksekliği; etikete basılınca satıra girilmez — Liste etiketi atlar) */
export function SecimKutusu({ secili, ad, degistir }: { secili: boolean; ad: string; degistir: (ac: boolean) => void }) {
  return (
    <label className={stil.kutu}>
      <input type="checkbox" checked={secili} aria-label={`${ad} seç`} onChange={(e) => degistir(e.target.checked)} />
    </label>
  );
}

/** başlık kutusu: sayfadakilerin hepsi seçiliyse işaretli, bir kısmıysa yarım */
export function SayfaKutusu({ hepsi, bazi, ad, degistir, yazi }: { hepsi: boolean; bazi: boolean; ad: string; degistir: (ac: boolean) => void; yazi?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = bazi && !hepsi; }, [bazi, hepsi]);
  return (
    <label className={yazi ? `${stil.kutu} ${stil.yazili}` : stil.kutu}>
      <input ref={ref} type="checkbox" checked={hepsi} aria-label={ad} data-sayfa-sec="" onChange={(e) => degistir(e.target.checked)} />
      {yazi && <span aria-hidden="true">{yazi}</span>}
    </label>
  );
}

/** altta havada duran seçim çubuğu; birim: "rapor", "ekipman" … */
export function SecimCubugu({ sayi, birim = "rapor", temizle, children }: { sayi: number; birim?: string; temizle: () => void; children: ReactNode }) {
  if (!sayi) return null;
  return (
    <div className={stil.cubukKap} data-alt-cubuk="her">
      <div className={stil.cubuk} role="region" aria-label={`Seçilen ${birim}lar`}>
        <span className={stil.cubukSayi}><b>{sayi}</b> {birim} seçili</span>
        <Tus tur="ikincil" onClick={temizle}>Seçimi kaldır</Tus>
        {children}
      </div>
    </div>
  );
}

/** seçilen satırlar (kimlik → satır); en çok enCok satır */
export interface SatirSecimi<K> {
  secili: ReadonlyMap<string, K>;
  sec: (k: K, ac: boolean) => void;
  /** sayfadakilerin hepsini seç / bırak */
  sayfa: (l: readonly K[], ac: boolean) => void;
  /** iş bitince düşenler (silinen raporlar) */
  kaldir: (idler: readonly string[]) => void;
  temizle: () => void;
}
export function useSatirSecimi<K>(anahtar: (k: K) => string, enCok: number, birim = "rapor"): SatirSecimi<K> {
  const [secili, setSecili] = useState<ReadonlyMap<string, K>>(() => new Map());
  const uyar = useUyar();
  const ekle = (l: readonly K[]) => {
    const y = new Map(secili);
    for (const k of l) {
      if (y.has(anahtar(k))) continue;
      if (y.size >= enCok) { uyar(`Bir seferde en çok ${enCok} ${birim} seçilir.`); break; }
      y.set(anahtar(k), k);
    }
    setSecili(y);
  };
  const cikar = (idler: readonly string[]) => { const y = new Map(secili); for (const id of idler) y.delete(id); setSecili(y); };
  return {
    secili,
    sec: (k, ac) => (ac ? ekle([k]) : cikar([anahtar(k)])),
    sayfa: (l, ac) => (ac ? ekle(l) : cikar(l.map(anahtar))),
    kaldir: cikar,
    temizle: () => setSecili(new Map()),
  };
}
