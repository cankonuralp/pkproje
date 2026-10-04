/* RAPOR FORMATI GİRDİSİ — pencerenin ve sunucunun TEK şeması (RAPOR-FORMAT.md §4 başlangıç yolları, §5 sürüm ve yayın). Taslak ya hazır
   şablondan (probata kitaplığı, src/format/sablonlar.ts) ya da türün yayınlanmış bir sürümünden başlar. Şablon anahtarı veritabanının
   CHECK'iyle aynı biçimde (0022); kitaplıkta olup olmadığı sunucuda ayrıca denetlenir (Object.hasOwn — "__proto__" gibi adlar şablon sayılmaz). */
import { SABLONLAR } from "../../format/sablonlar.ts";
import { z } from "../../sema/ortak.ts";

export const SABLON_ANAHTARI = /^[A-Z][A-Z0-9_]{1,23}$/;
/** kitaplıkta varsa şablon, yoksa null (prototip adları şablon değildir) */
export const sablonBul = (k: string) => (SABLON_ANAHTARI.test(k) && Object.hasOwn(SABLONLAR, k) ? SABLONLAR[k] : null);

const kirp = (s: unknown) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : s);

/** başlangıç: "sablon:<anahtar>" ya da "surum:<kimlik>" — pencerenin tek seçim alanının değeri */
export const BaslatGirdisi = z.string({ error: "Başlangıç seçilmeli." }).transform((s, bag): { sablon: string } | { surumId: string } => {
  const [tur, deger = ""] = s.split(/:(.*)/s);
  if (tur === "sablon" && sablonBul(deger)) return { sablon: deger };
  if (tur === "surum" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(deger)) return { surumId: deger };
  bag.addIssue({ code: "custom", message: "Başlangıç seçilmeli." });
  return z.NEVER;
});
export type BaslatGirdisi = z.output<typeof BaslatGirdisi>;

/** sürüm notu (RAPOR-FORMAT §5 "değişiklik notu"): isteğe bağlı, en çok 200 karakter */
export const YayinNotu = z.preprocess(kirp, z.string().max(200, "En çok 200 karakter.").transform((s) => s || null));

