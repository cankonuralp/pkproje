/* MUHASEBE — pencerelerin ve sunucunun TEK şeması (maket muhasebe.html fatura-kaydet / tahsilat-kaydet; 327). İletiler maketle aynı. Tutarlar
   KURUŞ (src/sema/ortak.ts tutar). Fatura no dışarıdan (firmanın muhasebe programı): 3 harf / rakam + yıl + 9 hane, 16 karakter. Tarihler YYYY-AA-GG;
   ileri tarih ve fatura tarihi / son imza denetimi sunucuda ve veritabanında (0039). */
import { tarih, tutar, z } from "../../sema/ortak.ts";

export const FATURA_NO = /^[A-Z0-9]{3}20\d{2}\d{9}$/;
export const FaturaGirdisi = z.object({
  no: z.preprocess((s) => (typeof s === "string" ? s.trim().toLocaleUpperCase("en") : s),
    z.string({ error: "Fatura no yazılmalı." }).min(1, "Fatura no yazılmalı.").regex(FATURA_NO, "3 harf ya da rakam + yıl + 9 hane (16 karakter).")),
  tarih,
  /** toplu: müşterinin faturaya hazır bütün işleri (136) */
  toplu: z.boolean().default(false),
});
export type FaturaGirdisi = z.output<typeof FaturaGirdisi>;

export const YONTEM = { havale: "Havale / EFT", cek: "Çek", kart: "Kredi kartı", nakit: "Nakit" } as const;
export type Yontem = keyof typeof YONTEM;
export const TahsilatGirdisi = z.object({
  tarih,
  tutar: tutar.refine((n) => n > 0, { message: "Tutar sıfırdan büyük olmalı (ör. 1.250,00)." }),
  yontem: z.enum(Object.keys(YONTEM) as [Yontem, ...Yontem[]], { error: "Yöntem seçilmeli." }),
  aciklama: z.preprocess((s) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim()) : s ?? null), z.string().max(120, "En çok 120 karakter.").nullable()),
});
export type TahsilatGirdisi = z.output<typeof TahsilatGirdisi>;

/** iş durumu (maket IS_DURUM): vadesi geçti > faturaya hazır > tahsilat bekliyor > rapor sürüyor > kapandı */
export const IS_DURUM = {
  gecikti: ["Vadesi geçti", "red"], hazir: ["Faturaya hazır", "kabul"], tahsilat: ["Tahsilat bekliyor", "bekliyor"], rapor: ["Rapor sürüyor", "notr"],
  kapandi: ["Kapandı", "tamam"],
} as const;
export type IsDurumu = keyof typeof IS_DURUM;
/** fatura durumu (maket F_DURUM) */
export const FATURA_DURUM = { gecikti: ["Vadesi geçti", "red"], bekliyor: ["Bekliyor", "bekliyor"], kismi: ["Kısmi ödendi", "kabul"], odendi: ["Ödendi", "tamam"] } as const;
export type FaturaDurumu = keyof typeof FATURA_DURUM;
/** birim fiyatın kaynağı (maket R_SUTUN) */
export const FIYAT_KAYNAK = { teklif: "teklif", disi: "teklif dışı · fiyat listesi", liste: "fiyat listesi" } as const;

/** KDV (KURUŞ; yuvarlanır) */
export const kdvTutari = (ara: number, oran: number) => Math.round((ara * oran) / 100);
/** kuruş → "1.250,00 TL" */
export const para = (kurus: number) => `${(kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
/** gün ekle (YYYY-AA-GG) */
export function gunEkle(gun: string, n: number): string {
  const d = new Date(`${gun}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
