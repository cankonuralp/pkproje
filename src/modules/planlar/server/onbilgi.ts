/* ÖN BİLGİLENDİRME FORMU — PDF VE GÖNDERİM (2026-10-25, belge doldurma; reisim: "Sözleşmeyi belge formatlarına bağla ve ön bilgilendirme formunu
   plan açılınca müşteriye e-postayla gönder", "bir müşteri için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim").
   · onBilgiPdfBaytlari: rotanın (…/on-bilgilendirme/pdf) ve e-postanın TEK yolu — firmanın yayındaki formatı (elle değerleriyle), yoksa Firma
     ayarları'na yüklenen PDF'in kendisi, o da yoksa temel format (src/belge/onbilgi.ts).
   · onBilgiGonder: hazırla (yetki, alıcı, içerik — işlemde) → PDF bas (işlem DIŞINDA: Chromium veritabanı işlemini bekletmez) → belge tek dosya
     yolundan + alıcı başına ekli e-posta (işlemde). Gönderimi çağıran tetikler (sonra.ts). İşlem çalıştırıcısı çağıranın (oturumun kiracısı). */
import { onBilgiPdf } from "../../../belge/pdf.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { onBilgiGonderHazirla, onBilgiKuyruga, type OnBilgiBelgesi, type PlanYazma } from "./plan-ici.ts";
import type { Kisi } from "./planlar.ts";

export async function onBilgiPdfBaytlari(v: OnBilgiBelgesi, depo: Depo): Promise<Uint8Array> {
  return !v.format && v.yuklu ? depo.oku(v.yuklu.anahtar) : onBilgiPdf(v);
}

/** oturumun kiracı işlemi (oturumIslemi) — her adım kendi işleminde */
export type Islem = <T>(is: (db: Sorgulayici) => Promise<T>) => Promise<T>;

export async function onBilgiGonder(islem: Islem, depo: Depo, kim: Kisi, firmaId: string, planId: string,
  pdfUret: (v: OnBilgiBelgesi, depo: Depo) => Promise<Uint8Array> = onBilgiPdfBaytlari): Promise<PlanYazma> {
  const h = await islem((db) => onBilgiGonderHazirla(db, kim, planId, depo));
  if (h.durum !== "hazir") return h;
  const pdf = await pdfUret(h.g.v, depo);
  return islem((db) => onBilgiKuyruga(db, depo, kim, firmaId, planId, h.g, pdf));
}
