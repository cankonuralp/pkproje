/* TOPLU İNDİRMENİN SAF ÇEKİRDEĞİ (321; boyut sınırı 320–323 incelemesi): raporların imzalı PDF'leri tek tek alınır (alıcı dışarıdan — tarayıcıda
   oturumlu tek uç, testte taklit), tesis klasörlü ZIP parçaları olur. Sınırlar: en çok 300 rapor ve toplam 500 MB — dosyalar tarayıcının
   belleğinde toplanır (telefonda da sığsın). Toplam, listedeki boyutlardan İNDİRMEDEN ÖNCE denetlenir; inerken de sayılır (liste eksik /
   eskiyse aşan anda durur, aynı GB'lar boşuna inmez). Sınır aşımı ayrı hata türüyle döner (ekranda "bağlantı" hatası sanılmasın). Bir dosya
   inemezse hepsi durur (eksik ZIP verilmez). */
import { zipParcalari, type ZipDosyasi } from "../../../components/disa/zip.ts";
import { klasorAdi } from "./ad.ts";

export const ZIP_SINIR = 300;
export const ZIP_BAYT_SINIR = 500 * 1024 * 1024;

/** sınır aşımı: iletisi olduğu gibi gösterilir */
export class ZipSiniri extends Error {}

/** boyut: imzalı PDF'in baytı (listeden; bilinmiyorsa 0 — inerken sayılır) */
export interface ZipRaporu { dosya: string; no: string; tesis: string; boyut: number }

const mb = (n: number) => `${Math.ceil(n / (1024 * 1024)).toLocaleString("tr-TR")} MB`;
const asim = (n: number, sinir: number) => new ZipSiniri(`Seçili raporlar birlikte ${mb(n)}; en çok ${mb(sinir)} birlikte indirilir. Süzgeçle daraltın.`);

/** raporların imzalı PDF'leri → ZIP parçaları; ilerleme (inen / toplam) bildirilir. sinir: bayt (test küçük verir) */
export async function raporZipi(l: readonly ZipRaporu[], ilerleme: (inen: number, toplam: number) => void, al: (dosya: string) => Promise<Uint8Array>,
  sinir = ZIP_BAYT_SINIR): Promise<Uint8Array[]> {
  if (l.length > ZIP_SINIR) throw new ZipSiniri(`En çok ${ZIP_SINIR} rapor birlikte indirilir; süzgeçle daraltın.`);
  const tahmin = l.reduce((n, r) => n + Math.max(0, r.boyut), 0);
  if (tahmin > sinir) throw asim(tahmin, sinir);
  const dosyalar: ZipDosyasi[] = [], adlar = new Set<string>();
  let inen = 0;
  for (const [i, r] of l.entries()) {
    ilerleme(i, l.length);
    let ad = `${klasorAdi(r.tesis)}/${klasorAdi(r.no)}.pdf`;
    for (let n = 2; adlar.has(ad); n++) ad = `${klasorAdi(r.tesis)}/${klasorAdi(r.no)} (${n}).pdf`;
    adlar.add(ad);
    const b = await al(r.dosya);
    inen += b.length;
    if (inen > sinir) throw asim(Math.max(inen, tahmin), sinir);
    dosyalar.push([ad, b]);
  }
  ilerleme(l.length, l.length);
  return zipParcalari(dosyalar);
}
