"use client";
/* SUNUCUDA SÜZÜLEN LİSTE KANCASI (566; 09-B3 "her liste sunucuda sayfalı"; reisim 2026-10-15 analizi — listeler bütün kayıtları tarayıcıya
   indiriyordu). Ekran aynı (FiltreSatiri + SuzgecliListe); fark: süzgeç değişince sunucudan YALNIZ o sayfanın satırları ve sayılar gelir.
   · Arama kutuları yazılırken istek 300 ms bekler (her harfte istek yok); öteki değişiklikler hemen.
   · Eski isteğin geç gelen cevabı yenisinin üstüne yazılmaz (sıra numarası).
   · Cevap gelene kadar önceki sayfa ekranda kalır; istek düşerse ekran bozulmaz, önceki liste kalır.
   · Seçici seçenekleri (müşteri, il, yıl …) sunucudan, görebildiği kayıtlardan. */
import { useEffect, useMemo, useRef, useState } from "react";
import type { Suzgec } from "./SuzgecliListe";
import { sunucuSonucu, yeniDurum, type Secenek, type SunucuListe, type SuzgecDurumu, type SuzgecTanimi } from "./suzgec";

/** arama kutusu yazılırken bekleme (ms) */
const BEKLE = 300;

export function useSunucuSuzgec<K>(tanimYap: (secenekler: Record<string, Secenek[]>) => SuzgecTanimi<K>, ilk: SunucuListe<K>,
  getir: (d: SuzgecDurumu) => Promise<SunucuListe<K> | null>): Suzgec<K> {
  const [veri, setVeri] = useState(ilk);
  const tanim = useMemo(() => tanimYap(veri.secenekler), [tanimYap, veri.secenekler]);
  const [durum, setDurum] = useState<SuzgecDurumu>(() => yeniDurum(tanim));
  const [yukleniyor, setYukleniyor] = useState(false);
  const sira = useRef(0);
  const sayac = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getirRef = useRef(getir);
  useEffect(() => { getirRef.current = getir; });
  useEffect(() => () => { if (sayac.current) clearTimeout(sayac.current); }, []);

  const iste = (d: SuzgecDurumu) => {
    const no = ++sira.current;
    setYukleniyor(true);
    getirRef.current(d).then((v) => {
      if (no !== sira.current) return;
      if (v) setVeri(v);
      setYukleniyor(false);
    }, () => { if (no === sira.current) setYukleniyor(false); });
  };
  const degistir = (d: SuzgecDurumu) => {
    const yazi = d.ara !== durum.ara || Object.keys({ ...d.alan, ...durum.alan }).some((k) => (d.alan[k] ?? "") !== (durum.alan[k] ?? ""));
    setDurum(d);
    if (sayac.current) clearTimeout(sayac.current);
    if (yazi) sayac.current = setTimeout(() => iste(d), BEKLE);
    else iste(d);
  };
  const sonuc = useMemo(() => sunucuSonucu(tanim, durum, veri), [tanim, durum, veri]);
  return { tanim, durum, degistir, sonuc, cipSayilari: veri.cipSayilari, yukleniyor };
}
