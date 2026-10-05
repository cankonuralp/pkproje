/* TOPLU İNDİRME (ZIP; 321 — maket musteri.html "Toplu indir (ZIP)" / "Uygunsuz raporlar (ZIP)", Ö3 2026-10-01): süzgeçteki raporların
   imzalı PDF'leri tarayıcıda tek tek (oturumlu tek uçtan, müşteri rolünde — yetki uçta) indirilir, tesis klasörlü ZIP olur (müşteri adı klasörü
   gereksiz: hepsi kendisinin). Yeni sunucu ucu yok; sunucuda ZIP üretilmez. Sınırlar ve çekirdek: zipla.ts (en çok 300 rapor, 500 MB). */
import { useState } from "react";
import { baytIndir } from "../../../components/disa/indir";
import { dosyaBaytlari } from "../../../components/gizli-resim/GizliResim";
import { raporZipi, ZipSiniri, type ZipRaporu } from "./zipla";

export type { ZipRaporu } from "./zipla";

/** liste ekranlarının ZIP tuşu: meşgulken ilerleme ("3 / 12"), bitince dosya iner; hata şeritte (sınır, bellek ve bağlantı ayrı iletiyle) */
export function useTopluIndir() {
  const [ilerleme, setIlerleme] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const indir = async (l: readonly ZipRaporu[], ad: string) => {
    if (ilerleme) return;
    setHata(null); setIlerleme(`0 / ${l.length}`);
    try {
      const z = await raporZipi(l, (i, n) => setIlerleme(`${i} / ${n}`), dosyaBaytlari);
      baytIndir(ad, z, "application/zip");
    } catch (e) {
      setHata(e instanceof ZipSiniri ? e.message
        : e instanceof RangeError || (e instanceof Error && e.message.startsWith("ZIP:")) ? "Raporlar bu cihazda birlikte paketlenemedi; süzgeçle daraltıp yeniden deneyin."
        : "Raporlar indirilemedi; bağlantıyı denetleyip yeniden deneyin.");
    } finally { setIlerleme(null); }
  };
  return { ilerleme, hata, indir };
}
