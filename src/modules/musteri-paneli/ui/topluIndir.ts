/* TOPLU İNDİRME (ZIP; 321 — maket musteri.html "Toplu indir (ZIP)" / "Uygunsuz raporlar (ZIP)", Ö3 2026-10-01): süzgeçteki raporların
   imzalı PDF'leri tarayıcıda tek tek (oturumlu tek uçtan, müşteri rolünde — yetki uçta) indirilir, tesis klasörlü ZIP olur (müşteri adı klasörü
   gereksiz: hepsi kendisinin). Yeni sunucu ucu yok; sunucuda ZIP üretilmez. Sınır: en çok 300 rapor (süzgeçle daraltılır). */
import { useState } from "react";
import { baytIndir } from "../../../components/disa/indir";
import { dosyaBaytlari } from "../../../components/gizli-resim/GizliResim";
import { zipBayt, type ZipDosyasi } from "../../../components/disa/zip";
import { klasorAdi } from "./ad";

export const ZIP_SINIR = 300;

export interface ZipRaporu { dosya: string; no: string; tesis: string }

/** raporların imzalı PDF'leri → ZIP baytları; ilerleme (inen / toplam) bildirilir; bir dosya inemezse hepsi durur (eksik ZIP verilmez) */
export async function raporZipi(l: readonly ZipRaporu[], ilerleme: (inen: number, toplam: number) => void): Promise<Uint8Array> {
  if (l.length > ZIP_SINIR) throw new Error(`En çok ${ZIP_SINIR} rapor birlikte indirilir; süzgeçle daraltın.`);
  const dosyalar: ZipDosyasi[] = [], adlar = new Set<string>();
  for (const [i, r] of l.entries()) {
    ilerleme(i, l.length);
    let ad = `${klasorAdi(r.tesis)}/${klasorAdi(r.no)}.pdf`;
    for (let n = 2; adlar.has(ad); n++) ad = `${klasorAdi(r.tesis)}/${klasorAdi(r.no)} (${n}).pdf`;
    adlar.add(ad);
    dosyalar.push([ad, await dosyaBaytlari(r.dosya)]);
  }
  ilerleme(l.length, l.length);
  return zipBayt(dosyalar);
}

/** liste ekranlarının ZIP tuşu: meşgulken ilerleme ("3 / 12"), bitince dosya iner; hata şeritte */
export function useTopluIndir() {
  const [ilerleme, setIlerleme] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const indir = async (l: readonly ZipRaporu[], ad: string) => {
    if (ilerleme) return;
    setHata(null); setIlerleme(`0 / ${l.length}`);
    try {
      const z = await raporZipi(l, (i, n) => setIlerleme(`${i} / ${n}`));
      baytIndir(ad, z, "application/zip");
    } catch (e) {
      setHata(e instanceof Error && e.message.startsWith("En çok") ? e.message : "Raporlar indirilemedi; bağlantıyı denetleyip yeniden deneyin.");
    } finally { setIlerleme(null); }
  };
  return { ilerleme, hata, indir };
}
