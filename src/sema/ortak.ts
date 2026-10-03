/* ORTAK ŞEMA — girdi doğrulamanın tek kaynağı (KOD-GECIS §2: "girdi doğrulama tek şema kitaplığı; sunucu ve istemci aynı şemayı paylaşır").
   Sunucu her isteği bu şemalarla doğrular; form aynı şemayla anında hata gösterir — iki ayrı kural sessizce ayrışmaz (anayasa 7.1 ayna kuralı).
   Kurallar onaylı maketten ve kararlardan (kaynak her satırda). İletiler Türkçe; zod'un kendi iletileri de Türkçe (tr yerelliği).
   Modüle özgü şema modülün kendi klasöründe (src/modules/<modül>/sema.ts) ve bu yapı taşlarını kullanır. */
import * as z from "zod";

z.config(z.locales.tr());

const kirp = (s: unknown) => (typeof s === "string" ? s.trim() : s);
/** boşlukları kırpılmış zorunlu metin */
export const metin = (ad: string, enCok = 200) =>
  z.preprocess(kirp, z.string({ error: `${ad} yazılmalı.` }).min(1, `${ad} yazılmalı.`).max(enCok, `${ad} en çok ${enCok} karakter.`));
/** isteğe bağlı metin: boş → undefined */
export const metinBos = (ad: string, enCok = 200) =>
  z.preprocess((s) => (kirp(s) === "" ? undefined : kirp(s)), z.string().max(enCok, `${ad} en çok ${enCok} karakter.`).optional());

/** e-posta: kırpılır, küçük harfe çevrilir (giriş e-postası firmada eşsiz — KOD-GECIS §3, eşsizlik veritabanında) */
export const eposta = z.preprocess((s) => (typeof s === "string" ? s.trim().toLowerCase() : s),
  z.email({ error: "Geçerli bir e-posta adresi yazılmalı." }).max(254));

/** parola (karar 37): en az 10 karakter, harf ve rakam içerir — maket giriş ekranıyla aynı ileti */
export const parola = z.string().min(10, "En az 10 karakter; harf ve rakam içermeli.").max(200)
  .refine((p) => /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(p) && /\d/.test(p), "En az 10 karakter; harf ve rakam içermeli.");

/** ekipman kodu (reisim: "ekipman kodu da yine eşsiz olmalı … personel el ile"; KOD-GECIS §3): A–Z 0–9 tire, 3–20, tireyle başlamaz /
 *  bitmez, çift tire yok. Büyük harfe yerelden bağımsız çevrilir (i → I; Türkçe İ A–Z dışında kalırdı). Maketteki denetimle aynı ileti. */
export const ekipmanKodu = z.preprocess((s) => (typeof s === "string" ? s.trim().toUpperCase() : s),
  z.string({ error: "Ekipman kodu boş" }).min(1, "Ekipman kodu boş")
    .regex(/^[A-Z0-9](?:[A-Z0-9]|-(?=[A-Z0-9])){2,19}$/, "Kod: A–Z, 0–9, tire; 3–20 hane"));

/** ölçüm cihazı kodu (maket Ölçüm cihazları): A–Z 0–9 tire, 3–12 */
export const cihazKodu = z.preprocess((s) => (typeof s === "string" ? s.trim().toUpperCase() : s),
  z.string().regex(/^[A-Z0-9-]{3,12}$/, "Cihaz kodu 3–12 hane (A–Z, 0–9, tire)."));

/** fatura no (maket Muhasebe, e-fatura biçimi): 3 harf ya da rakam + yıl + 9 hane */
export const faturaNo = z.preprocess((s) => (typeof s === "string" ? s.trim().toUpperCase() : s),
  z.string().regex(/^[A-Z0-9]{3}20\d{2}\d{9}$/, "3 harf ya da rakam + yıl + 9 hane (16 karakter)."));

/** takvim tarihi ISO "YYYY-MM-DD" (ekranda GG.AA.YYYY; dönüşüm src/components/secim/tarih.ts) — takvimde olmayan gün reddedilir */
export const tarih = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih GG.AA.YYYY biçiminde olmalı.").refine((s) => {
  const [y, a, g] = s.split("-").map(Number);
  const d = new Date(Date.UTC(y, a - 1, g));
  return d.getUTCFullYear() === y && d.getUTCMonth() === a - 1 && d.getUTCDate() === g;
}, "Takvimde olmayan bir gün.");

/** tarih + saat ISO "YYYY-MM-DDTHH:MM" */
export const zaman = z.string().regex(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/, "Tarih ve saat eksik ya da hatalı.")
  .refine((s) => tarih.safeParse(s.slice(0, 10)).success, "Takvimde olmayan bir gün.");

/** tutar → kuruş (tam sayı; para kayan noktayla tutulmaz). "1.234,56" · "1234,5" · "1234" · 1234.5 kabul; eksi yok, en çok 2 ondalık */
export const tutar = z.union([z.string(), z.number()]).transform((v, bag) => {
  const s = typeof v === "number" ? v.toFixed(2).replace(".", ",") : v.trim().replace(/\s/g, "").replace(/₺|TL$/i, "");
  const m = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(s);
  if (!m) { bag.addIssue({ code: "custom", message: "Tutar sayı olmalı (ör. 1.250,00)." }); return z.NEVER; }
  const lira = Number(m[1].replace(/\./g, "")), kurus = Number((m[2] ?? "0").padEnd(2, "0"));
  const toplam = lira * 100 + kurus;
  if (!Number.isSafeInteger(toplam)) { bag.addIssue({ code: "custom", message: "Tutar çok büyük." }); return z.NEVER; }
  return toplam;
});

/** iyimser kilit sürümü (09-D1): her güncelleme okuduğu sürümü yollar */
export const surum = z.number().int().nonnegative();

/** kimlik (uuid) — kayıt adresi ve ilişkiler */
export const kimlik = z.uuid({ error: "Geçersiz kayıt." });

export type DogrulamaHatalari = Record<string, string>;

/** şema hatasını alan → ilk ileti haritasına çevirir (formda alanın altında; sunucu yanıtında aynı biçim) */
export function hatalar(e: z.ZodError): DogrulamaHatalari {
  const h: DogrulamaHatalari = {};
  for (const s of e.issues) {
    const yol = s.path.join(".") || "_";
    if (!(yol in h)) h[yol] = s.message;
  }
  return h;
}

/** doğrula: başarılıysa veri, değilse alan hataları */
export function dogrula<T extends z.ZodType>(sema: T, girdi: unknown):
  { tamam: true; veri: z.output<T> } | { tamam: false; hatalar: DogrulamaHatalari } {
  const r = sema.safeParse(girdi);
  return r.success ? { tamam: true, veri: r.data } : { tamam: false, hatalar: hatalar(r.error) };
}

export { z };
