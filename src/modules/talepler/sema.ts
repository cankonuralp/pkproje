/* TALEPLER — pencerelerin ve sunucunun TEK şeması (maket talepler.html izinCiz / masrafCiz, personel.html izin reddet; 330). İletiler maketle aynı.
   İzin: tür, başlangıç–bitiş (bitiş başlangıçtan önce olamaz; en çok 1 yıl), açıklama (160). İş günü hafta sonunu ve resmî tatilleri saymaz
   (417: src/tanim/veri.ts resmi_tatiller — maket "uygulamada"; yarım günler iş günü). Masraf formu Muhasebe'nin gider şemasıyla (muhasebe/sema.ts GiderGirdisi). */
import { tarih, z } from "../../sema/ortak.ts";
import { TANIMLAR } from "../../tanim/veri.ts";

export const IZIN_TUR = { yillik: "Yıllık izin", mazeret: "Mazeret izni", rapor: "Hastalık (sağlık raporu)", ucretsiz: "Ücretsiz izin" } as const;
export type IzinTuru = keyof typeof IZIN_TUR;
export const IZIN_DURUM = { bekliyor: ["Onay bekliyor", "bekliyor"], onaylandi: ["Onaylandı", "tamam"], red: ["Reddedildi", "red"] } as const;
export type IzinDurumu = keyof typeof IZIN_DURUM;

const SABIT_TATIL = new Set(TANIMLAR.resmi_tatiller.sabit.map((t) => t.gun));
const DINI_TATIL = new Set(TANIMLAR.resmi_tatiller.dini.flatMap((t) => t.gunler));
/** resmî tatil mi (tam gün; 2429 sayılı Kanun + Diyanet takvimindeki dini bayramlar) */
export const tatilMi = (gun: string) => SABIT_TATIL.has(gun.slice(5)) || DINI_TATIL.has(gun);

/** iş günü: başlangıç ve bitiş dahil, cumartesi, pazar ve resmî tatiller sayılmaz */
export function isGunu(bas: string, bit: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bas) || !/^\d{4}-\d{2}-\d{2}$/.test(bit) || bit < bas) return 0;
  let n = 0;
  for (let d = new Date(`${bas}T12:00:00Z`), s = Date.parse(`${bit}T12:00:00Z`); d.getTime() <= s; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() % 6 && !tatilMi(d.toISOString().slice(0, 10))) n++;
  }
  return n;
}

const bosNull = (s: unknown) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim()) : s ?? null);
export const IzinGirdisi = z.object({
  tur: z.enum(Object.keys(IZIN_TUR) as [IzinTuru, ...IzinTuru[]], { error: "İzin türü seçilmeli." }),
  bas: tarih,
  bit: tarih,
  aciklama: z.preprocess(bosNull, z.string().max(160, "En çok 160 karakter.").nullable()),
}).superRefine((v, c) => {
  if (v.bit < v.bas) c.addIssue({ code: "custom", path: ["bit"], message: "Bitiş başlangıçtan önce olamaz." });
  else if (Date.parse(v.bit) - Date.parse(v.bas) > 366 * 864e5) c.addIssue({ code: "custom", path: ["bit"], message: "En çok bir yıllık izin." });
  else if (!isGunu(v.bas, v.bit)) c.addIssue({ code: "custom", path: ["bit"], message: "Seçilen aralıkta iş günü yok." });
});
export type IzinGirdisi = z.output<typeof IzinGirdisi>;
export const RedGirdisi = z.object({
  gerekce: z.preprocess((s) => (typeof s === "string" ? s.trim() : s), z.string({ error: "Gerekçe yazılmalı." }).min(5, "Gerekçe en az 5 karakter.").max(200, "En çok 200 karakter.")),
});
