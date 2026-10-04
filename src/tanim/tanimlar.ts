/* SABİT TANIMLAR (ARKA-UC §2.1 · KOD-GECIS §8) — firma verisi DEĞİL, herkes için aynı, yavaş değişen tanımlar. Tek kaynak burası; şemadan geçer.
   Cihaza karma adlı JSON olarak iner (`/api/tanim/<ad>.<karma>.json`): içerik değişince adı değişir, cihaz yenisini indirir; aynı ad sonsuz önbellekte
   kalır (09-B6), çevrimdışı pakete girer (K3). Firma verisi buraya yazılmaz (iki kişi aynı anda yazamaz, yetki uygulanamaz — §2.1).
   İçerik onaylı maketten ve onaylı kararlardan; alan bilgisi uydurulmaz. Yeni tanım (il / ilçe, meslekler, Bakanlık formatları …) kaynağıyla eklenir. */
import { createHash } from "node:crypto";
import { z } from "../sema/ortak.ts";

const durum = z.object({ ad: z.string().min(1), rozet: z.enum(["bekliyor", "kabul", "denetimde", "tamam", "red", "notr"]) });

export const TANIM_SEMALARI = {
  /** plan ve rapor durum adları (maket MV.PLAN_DURUM, MV.RAPOR_DURUM; KOD-GECIS §5) */
  durumlar: z.object({ plan: z.record(z.string().regex(/^[a-z]+$/), durum), rapor: z.record(z.string().regex(/^[a-z]+$/), durum) }),
  /** sigorta açma eğrisi çarpanları (KOD-GECIS §8: B 5 · C 10 · D 15) */
  egri_carpanlari: z.record(z.enum(["B", "C", "D"]), z.number().int().positive()),
  /** yasal mesai sınırları (KOD-GECIS §7, AA2): günlük en çok 660 dk, yıllık fazla çalışma en çok 270 saat */
  mesai_sinirlari: z.object({ gunluk_ust_dk: z.literal(660), yillik_fazla_saat: z.literal(270) }),
} as const;
export type TanimAdi = keyof typeof TANIM_SEMALARI;

export const TANIMLAR: { [A in TanimAdi]: z.infer<(typeof TANIM_SEMALARI)[A]> } = {
  durumlar: {
    plan: {
      bekliyor: { ad: "Kabul bekliyor", rozet: "bekliyor" }, kabul: { ad: "Kabul edildi", rozet: "kabul" },
      denetimde: { ad: "Denetimde", rozet: "denetimde" }, tamam: { ad: "Tamamlandı", rozet: "tamam" }, red: { ad: "Reddedildi", rozet: "red" },
    },
    rapor: {
      taslak: { ad: "Yeni", rozet: "bekliyor" }, geri: { ad: "Yeni", rozet: "bekliyor" }, onayda: { ad: "Teknik yönetici onayında", rozet: "kabul" },
      onaylandi: { ad: "Muayene uzmanı imzası", rozet: "denetimde" }, imzada: { ad: "İmzaya gönderildi", rozet: "notr" }, imzali: { ad: "Tamamlandı", rozet: "tamam" },
    },
  },
  egri_carpanlari: { B: 5, C: 10, D: 15 },
  mesai_sinirlari: { gunluk_ust_dk: 660, yillik_fazla_saat: 270 },
};

/** anahtarları sıralı JSON (karma yazım sırasına bağlı olmasın) */
export function duzenliJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(duzenliJson).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${duzenliJson((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v);
}

export interface TanimDosyasi { ad: TanimAdi; dosya: string; govde: string }

/** her tanım: şemadan geçmiş gövde + karma adlı dosya adı (sunucu açılırken bir kez) */
export const TANIM_DOSYALARI: readonly TanimDosyasi[] = (Object.keys(TANIM_SEMALARI) as TanimAdi[]).map((ad) => {
  const govde = duzenliJson(TANIM_SEMALARI[ad].parse(TANIMLAR[ad]));
  return { ad, dosya: `${ad}.${createHash("sha256").update(govde).digest("hex").slice(0, 12)}.json`, govde };
});

export const tanimDizini = () => Object.fromEntries(TANIM_DOSYALARI.map((t) => [t.ad, `/api/tanim/${t.dosya}`]));
