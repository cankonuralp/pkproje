/* RAPORLAR — saha raporunun formu ve sunucusu için TEK şema + durum adları (maket rapor.html M8; KOD-GECIS §5 Rapor; RAPOR-FORMAT §7).
   Raporun içeriği iki parça: (1) her raporda aynı sabit bölümler — firma bilgileri (künye raporun kopyası, salt okunur) + kontrol tarihleri,
   ekipman bilgileri (elle; ekipman kaydından başlar), (2) türün format tanımından gelen bölümler — cevaplar kimliklerle (format/tanim.ts Cevaplar).
   Cihaz ve fotoğraf sayısı istemciden alınmaz, sunucu raporun kendi listesinden sayar. */
import { Cevaplar } from "../../format/tanim.ts";
import { tarih, zaman, z } from "../../sema/ortak.ts";

/** durum kodları sabit tanımlarla aynı (src/tanim/veri.ts durumlar.rapor; göç 0025): ad ve rozet */
export const RAPOR_DURUM = {
  taslak: ["Yeni", "bekliyor"], onayda: ["Teknik yönetici onayında", "kabul"], onaylandi: ["Muayene uzmanı imzası", "denetimde"],
  imzada: ["İmzaya gönderildi", "notr"], imzali: ["Tamamlandı", "tamam"],
} as const;
export type RaporDurumu = keyof typeof RAPOR_DURUM;
export const SONUC_AD = { uygun: "Uygun", uygun_degil: "Uygun değil" } as const;

const bos = (s: unknown) => (s === undefined || s === null || (typeof s === "string" && s.trim() === "") ? null : typeof s === "string" ? s.trim().replace(/\s+/g, " ") : s);
const metin = (n: number) => z.preprocess(bos, z.string().max(n, `En çok ${n} karakter.`).nullable());

/** ekipman bilgileri (maket "Ekipman bilgileri": elle girilir; ekipman kaydından başlar) */
export const EkipmanBilgisi = z.object({
  marka: metin(40), model: metin(40), seri: metin(30),
  imal: z.preprocess(bos, z.string().regex(/^(19|20)\d{2}$/, "İmal yılı 4 haneli yıl olmalı.").nullable()),
  konum: metin(60), amac: metin(120), bolum: metin(60),
});
export type EkipmanBilgisi = z.output<typeof EkipmanBilgisi>;

/** kontrol tarihleri (maket "Firma bilgileri"): başlangıç rapor açılınca yazılır (zorunlu); bitiş, sonraki kontrol ve rapor tarihi elle seçilmediyse
    Onaya gönderde sunucu yazar (bitiş: gönderme anı · sonraki: başlangıç + tür periyodu · rapor tarihi: başlangıç günü); takip isteğe bağlı */
export const RaporTarihleri = z.object({
  bas: z.preprocess(bos, zaman), bit: z.preprocess(bos, zaman.nullable()),
  sonraki: z.preprocess(bos, tarih.nullable()), takip: z.preprocess(bos, tarih.nullable()), rapor: z.preprocess(bos, tarih.nullable()),
}).superRefine((t, bag) => {
  if (t.bas && t.bit && t.bit < t.bas) bag.addIssue({ code: "custom", path: ["bit"], message: "Bitiş başlangıçtan önce." });
});
export type RaporTarihleri = z.output<typeof RaporTarihleri>;

/** Kaydet (ve Onaya gönder öncesi kayıt): istemcinin gördüğü sürümle */
export const RaporKaydi = z.object({ ekipman: EkipmanBilgisi, tarih: RaporTarihleri, cevaplar: Cevaplar });
export type RaporKaydi = z.output<typeof RaporKaydi>;

/** raporda ölçüm cihazı (tür × cihaz) ve fotoğraf (dosya) kayıtları — rapor tablosunda JSON */
export const RaporCihazi = z.object({ tur: z.string().uuid(), cihaz: z.string().uuid() });
export type RaporCihazi = z.output<typeof RaporCihazi>;

/** kalibrasyon durumu: bitiş bugünden önceyse geçmiş */
export const kalibrasyonGecti = (bitis: string | null, bugun: string) => !bitis || bitis < bugun;

/** türün periyodu kadar ay sonrası (sonraki kontrol): ayın son günü taşmaz (31 Ocak + 1 ay = 28/29 Şubat) */
export function ayEkle(iso: string, ay: number): string {
  const [y, m, g] = iso.slice(0, 10).split("-").map(Number);
  const son = new Date(Date.UTC(y, m - 1 + ay + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + ay, Math.min(g, son))).toISOString().slice(0, 10);
}
