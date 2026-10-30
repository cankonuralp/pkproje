/* S.A.Y BECERİLERİ (2026-10-31, kalem 5 — E5; sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"). İş bilgisi talimata gömülmez: becerilerin
   metni src/modules/say/beceriler/*.md (kaynak klasöründen AYNEN taşındı — içerik değiştirilmez), talimata yalnız DİZİNİ girer (ad, tarif, ne zaman);
   S.A.Y bir işe başlamadan önce ilgili beceriyi beceri_oku ile okur. Dizin ve metinler uygulama açılırken bir kez okunur (talimat konuşma boyunca aynı).
   Ön bilgi bozuksa ya da ad tekil değilse uygulama açılmaz (kilit tests/say-beceri.test.ts). Yayında dosyalar /api/say izinde (next.config.ts). */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface Beceri { kod: string; ad: string; tarif: string; neZaman: string; metin: string }
export const BECERI_KLASORU = join(process.cwd(), "src", "modules", "say", "beceriler");

/** dosyanın ön bilgisi (--- ad / tarif / ne_zaman ---) ve metni; biçim bozuksa hata */
export function beceriCoz(dosya: string, icerik: string): Beceri {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(icerik.replace(/\r\n?/g, "\n"));
  if (!m) throw new Error(`${dosya}: ön bilgi yok`);
  const alan = (k: string) => new RegExp(`^${k}:\\s*(.+)$`, "m").exec(m[1]!)?.[1]?.trim() ?? "";
  const kod = /^(B\d{2})-/.exec(dosya)?.[1] ?? "";
  const b = { kod, ad: alan("ad"), tarif: alan("tarif"), neZaman: alan("ne_zaman"), metin: m[2]!.trim() };
  if (!b.kod || !/^[a-z0-9-]{3,60}$/.test(b.ad) || !b.tarif || !b.neZaman || !b.metin) throw new Error(`${dosya}: ön bilgi eksik`);
  return b;
}
/** klasördeki beceriler, dosya adı sırasıyla; ad ve kod tekil */
export function becerileriOku(klasor = BECERI_KLASORU): Beceri[] {
  const l = readdirSync(klasor).filter((d) => /^B\d{2}-.+\.md$/.test(d)).sort().map((d) => beceriCoz(d, readFileSync(join(klasor, d), "utf8")));
  for (const k of ["kod", "ad"] as const) if (new Set(l.map((b) => b[k])).size !== l.length) throw new Error(`beceri ${k} tekil değil`);
  return l;
}
/** talimattaki dizin (sabit metin) */
export function beceriDizini(l: readonly Beceri[]): string {
  return l.map((b) => `- ${b.kod} ${b.ad}: ${b.tarif} — Ne zaman: ${b.neZaman}`).join("\n");
}
/** beceri_oku aracının sonucu: adı ya da kodu verilen becerinin tam metni; bilinmeyende dizin */
export function beceriMetni(l: readonly Beceri[], ad: unknown): string {
  const a = String(ad ?? "").trim().toLowerCase();
  const b = l.find((x) => x.ad === a || x.kod.toLowerCase() === a || `${x.kod.toLowerCase()} ${x.ad}` === a);
  return b ? b.metin :`Böyle bir beceri yok: "${String(ad ?? "")}". Beceriler:\n${beceriDizini(l)}`;
}
