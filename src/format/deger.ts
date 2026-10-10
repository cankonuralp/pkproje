/* ALAN DEĞERİ — saf, tarayıcı ve sunucu ortak (484). Fotoğraftan okunan (src/server/yz/alanlar.ts) ya da Excel'den yüklenen
   (src/modules/raporlar/doldur.ts) değer alanın türüne uyuyorsa raporda saklanan biçime çevrilir, uymuyorsa atılır: sayı virgül ondalıklı, tarih
   YYYY-AA-GG (GG.AA.YYYY de okunur; takvimde olmayan gün atılır), seçim seçeneklerden biri (büyük / küçük harf Türkçe'ye göre), evet / hayır
   ("evet", "hayir"), yıl 1900–bu yıl, metin en çok uzunluğu kadar (denetim karakterleri temizlenir). */
export type AlanTuru = "metin" | "sayi" | "tarih" | "secim" | "evet" | "yil";
/** okunacak / yüklenecek alan: kimlik, ekrandaki ad, tür, en çok uzunluk (metin), seçenekler (seçim), birim (sayı) */
export interface OkunacakAlan { id: string; ad: string; tur: AlanTuru; uzun?: number; secenekler?: readonly string[]; birim?: string }

const tr = (s: string) => s.toLocaleLowerCase("tr");
const virgul = (n: number) => String(Math.round(n * 1e6) / 1e6).replace(".", ",");

export function alanDegeri(a: Pick<OkunacakAlan, "tur" | "uzun" | "secenekler">, ham: string, bugun: Date): string | null {
  const d = ham.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!d) return null;
  switch (a.tur) {
    case "sayi": {
      const n = Number(d.replace(/\s/g, "").replace(",", "."));
      return Number.isFinite(n) ? virgul(n) : null;
    }
    case "yil":
      return /^(19|20)\d{2}$/.test(d) && Number(d) <= bugun.getUTCFullYear() ? d : null;
    case "tarih": {
      const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d), nokta = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d);
      const p = iso ? [iso[1], iso[2], iso[3]] : nokta ? [nokta[3], nokta[2], nokta[1]] : null;
      if (!p) return null;
      const [y, ay, g] = p, t = new Date(Date.UTC(Number(y), Number(ay) - 1, Number(g)));
      return t.getUTCFullYear() === Number(y) && t.getUTCMonth() === Number(ay) - 1 && t.getUTCDate() === Number(g) ? `${y}-${ay}-${g}` : null;
    }
    case "secim":
      return (a.secenekler ?? []).find((s) => tr(s) === tr(d)) ?? null;
    case "evet":
      return ["evet", "var", "true", "1", "e"].includes(tr(d)) ? "evet" : ["hayir", "hayır", "yok", "false", "0", "h"].includes(tr(d)) ? "hayir" : null;
    default:
      return d.length <= (a.uzun ?? 200) ? d : null;
  }
}
