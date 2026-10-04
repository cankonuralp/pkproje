/* ARAÇ GİRDİLERİ — pencerelerin ve sunucunun TEK şeması (maket araclar.html kayitDenetle / denetle / km-kaydet). Plaka "34 ABC 123" biçimi,
   firmada eşsiz (boşluk yok sayılır — sunucu ve veritabanı). Belge bitişleri isteğe bağlı (boşsa takip edilmez). Kilometre yalnız rakam (nokta
   binlik ayırıcı olarak kabul). Tutanak kalemleri ve fotoğraf açıları ÖRNEK şablon (reisim: "örnek bi şablon oluştur inceleyip düzenleriz"). */
import { tarih, zaman, z } from "../../sema/ortak.ts";

const bos = (s: unknown) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim().replace(/\s+/g, " ")) : s);

export const ARAC_TURLERI = ["Binek araç", "Hafif ticari araç", "Kamyonet", "Minibüs", "Kamyon"] as const;
export const YAKITLAR = [["benzin", "Benzin"], ["dizel", "Dizel"], ["lpg", "LPG"], ["elektrik", "Elektrik"], ["hibrit", "Hibrit"]] as const;
export const YAKIT_SEVIYE = [["bos", "Boş"], ["ceyrek", "1/4"], ["yarim", "1/2"], ["ucceyrek", "3/4"], ["dolu", "Dolu"]] as const;
export const ARAC_KONTROL = [["ruhsat", "Ruhsat"], ["police", "Trafik sigortası poliçesi"], ["anahtar", "Anahtar (2 adet)"], ["yangin", "Yangın söndürücü"],
  ["ilkyardim", "İlk yardım çantası"], ["ucgen", "Reflektör (üçgen)"], ["stepne", "Stepne"], ["kriko", "Kriko ve bijon anahtarı"], ["hgs", "HGS etiketi"],
  ["yelek", "Reflektörlü yelek"]] as const;
export const ARAC_FOTO = [["on", "Ön"], ["arka", "Arka"], ["sol", "Sol yan"], ["sag", "Sağ yan"], ["gosterge", "Gösterge (km ve yakıt)"], ["ic", "İç"]] as const;
export type FotoAcisi = (typeof ARAC_FOTO)[number][0];
export const yakitAd = (y: string | null) => YAKITLAR.find((x) => x[0] === y)?.[1] ?? "—";
export const seviyeAd = (y: string | null) => YAKIT_SEVIYE.find((x) => x[0] === y)?.[1] ?? "—";

export const plakaDuz = (s: string) => s.toLocaleUpperCase("tr").replace(/\s+/g, " ").trim();
const PLAKA = /^\d{2} ?[A-ZÇĞİÖŞÜ]{1,3} ?\d{2,4}$/;
const kmSayi = (hata: string) => z.preprocess((s) => (typeof s === "string" ? s.trim().replace(/\./g, "") : s),
  z.string({ error: hata }).regex(/^\d{1,7}$/, hata).transform(Number));
const kmBos = z.preprocess((s) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim().replace(/\./g, "")) : s),
  z.string().regex(/^\d{1,7}$/, "Yalnız rakam.").transform(Number).nullable());
const tarihBos = z.preprocess(bos, tarih.nullable());
const yilUst = () => new Date().getFullYear() + 1;

export const AracGirdisi = z.object({
  plaka: z.preprocess((s) => (typeof s === "string" ? plakaDuz(s) : s),
    z.string({ error: "Plaka yazılmalı." }).min(1, "Plaka yazılmalı.").regex(PLAKA, "Plaka 34 ABC 123 biçiminde.")),
  tur: z.enum(ARAC_TURLERI, { error: "Araç türü seçilmeli." }),
  marka: z.preprocess(bos, z.string({ error: "Marka yazılmalı." }).max(40, "En çok 40 karakter.")),
  model: z.preprocess(bos, z.string({ error: "Model yazılmalı." }).max(40, "En çok 40 karakter.")),
  yil: z.preprocess((s) => (typeof s === "string" ? s.trim() : s), z.string({ error: "Dört haneli yıl." }).regex(/^\d{4}$/, "Dört haneli yıl.").transform(Number))
    .refine((y) => y >= 1980 && y <= yilUst(), { message: `Dört haneli yıl (1980–${yilUst()}).` }),
  yakit: z.enum(YAKITLAR.map((x) => x[0]) as [string, ...string[]], { error: "Yakıt seçilmeli." }),
  ilkKm: kmBos, bakimKm: kmBos,
  muayene: tarihBos, sigorta: tarihBos, kasko: tarihBos,
});
export type AracGirdisi = z.output<typeof AracGirdisi>;

export const KmGirdisi = z.object({ km: kmSayi("Göstergedeki kilometreyi yazın.") });

export const TutanakGirdisi = z.object({
  arac: z.string({ error: "Araç seçilmeli." }).regex(/^[0-9a-f-]{36}$/, "Araç seçilmeli."),
  alan: z.string({ error: "Teslim alan seçilmeli." }).refine((a) => a === "depo" || /^[0-9a-f-]{36}$/.test(a), "Teslim alan seçilmeli."),
  zaman,
  km: kmSayi("Teslimde kilometre yazılır."),
  yakit: z.enum(YAKIT_SEVIYE.map((x) => x[0]) as [string, ...string[]], { error: "Yakıt seviyesi seçilmeli." }),
  kontrol: z.array(z.enum(ARAC_KONTROL.map((x) => x[0]) as [string, ...string[]])).max(ARAC_KONTROL.length).transform((l) => [...new Set(l)]),
  hasar: z.preprocess(bos, z.string().max(400, "En çok 400 karakter.").nullable()),
});
export type TutanakGirdisi = z.output<typeof TutanakGirdisi>;

/* ── tarih yardımcıları (Türkiye günü) ── */
const gun = (iso: string) => new Date(`${iso}T12:00:00Z`);
/** haftanın Pazartesi'si (ISO "YYYY-AA-GG") */
export function haftaBasi(iso: string): string {
  const d = gun(iso.slice(0, 10));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
export function haftaEkle(iso: string, n: number): string { const d = gun(iso); d.setUTCDate(d.getUTCDate() + 7 * n); return d.toISOString().slice(0, 10); }
export const gunFarki = (a: string, b: string) => Math.round((gun(b).getTime() - gun(a).getTime()) / 864e5);
export type BelgeDurumu = "yok" | "gecti" | "yakin" | "gecerli";
export function belgeDurumu(t: string | null, bugun: string, esik: number): BelgeDurumu {
  if (!t) return "yok";
  const k = gunFarki(bugun, t);
  return k < 0 ? "gecti" : k <= esik ? "yakin" : "gecerli";
}
export const kmYaz = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
