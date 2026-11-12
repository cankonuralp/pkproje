/* RAPORUN ZAMAN ÇİZELGESİ (2026-11-12; maket yerel/maket/turkak-modeli.html 4. bölüm — pkproje.md §11 K10 / T7; reisim: "log kayıtları düzgün olmalı"):
   denetçiye gösterilen kayıt — rapor açıldı, kontrol başladı, fotoğraflar (çekim anı, konum), kontrol bitti, saat düzeltmesi (gerekçesiyle), onaya
   gönderildi (sapma sayısıyla), onay, imza … tek listede, zamana göre. Kaynaklar: raporun durum hareketleri (rapor_hareket — veritabanı tetiği yazar),
   kontrol kaydı (göç 0128 — saati veritabanı koyar), fotoğrafların kanıtı (foto-kanit.ts). Saf: sunucu satırları verir, burada sıralanır ve adlanır.
   Dikkat isteyen satır (elle yazılan saat, saat dışı fotoğraf, geri gönderme) işaretlidir. */
import { FOTO_PAY_DK, type SapmaKaydi } from "./sapma.ts";

export interface CizelgeSatiri {
  /** olayın anı (ISO) */
  zaman: string; olay: string; kim: string;
  /** saatin kaynağı: sunucunun / veritabanının saati ya da elle yazılan */
  kaynak: "Sunucu" | "Elle";
  /** dikkat isteyen satır */
  dikkat: boolean;
}
export interface CizelgeGirdisi {
  hareketler: readonly { zaman: Date; ne: string; gerekce: string | null; kim: string }[];
  /** kontrol kaydı (ölçümsüz raporda / henüz başlamadıysa null); `yazan`: raporu yazan kişi */
  kontrol: { basladi: Date | null; bitti: Date | null; duzBas: Date | null; duzBit: Date | null; gerekce: string | null; duzKim: string | null; duzZaman: Date | null } | null;
  yazan: string;
  fotolar: readonly { ad: string; eklendi?: string; cekim?: string | null; konum?: unknown; okuma?: boolean }[];
  sapmalar: readonly SapmaKaydi[];
}

const HAREKET: Record<string, string> = {
  olustur: "Rapor açıldı", gonder: "Onaya gönderildi", onay: "Onaylandı", onay_geri: "Onay geri alındı", geri: "Geri gönderildi", imza: "İmzalandı",
  revize: "Revizeye gönderildi", sil: "Rapor silindi", durum: "Durum değiştirildi",
};
const TR = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const trZaman = (d: Date) => TR.format(d).replace(",", "");
const dk = (a: Date, b: Date) => Math.max(0, Math.round((b.getTime() - a.getTime()) / 60_000));
/** fotoğrafın kendi saati "YYYY-AA-GG SS:DD" (Türkiye saati sayılır) → an */
const cekimAni = (c: string) => new Date(`${c.slice(0, 10)}T${c.slice(11, 16)}:00+03:00`).getTime();
const cekimYazi = (c: string) => `${c.slice(8, 10)}.${c.slice(5, 7)}.${c.slice(0, 4)} ${c.slice(11, 16)}`;

export function zamanCizelgesi(g: CizelgeGirdisi): CizelgeSatiri[] {
  const l: CizelgeSatiri[] = [];
  const sonGonder = [...g.hareketler].reverse().find((h) => h.ne === "gonder");
  for (const h of g.hareketler) {
    const ad = HAREKET[h.ne];
    if (!ad) continue;
    const ek = h === sonGonder && g.sapmalar.length ? ` · ${g.sapmalar.length} sapma gerekçeli` : h.gerekce ? ` · ${h.gerekce}` : "";
    l.push({ zaman: h.zaman.toISOString(), olay: `${ad}${ek}`, kim: h.kim, kaynak: "Sunucu", dikkat: h.ne === "geri" || h.ne === "onay_geri" || (h === sonGonder && g.sapmalar.length > 0) });
  }
  const k = g.kontrol;
  if (k?.basladi) l.push({ zaman: k.basladi.toISOString(), olay: "Kontrol başladı", kim: g.yazan, kaynak: "Sunucu", dikkat: false });
  if (k?.basladi && k.bitti) l.push({ zaman: k.bitti.toISOString(), olay: `Kontrol bitti · ${dk(k.basladi, k.bitti)} dk`, kim: g.yazan, kaynak: "Sunucu", dikkat: false });
  if (k?.duzBas && k.duzBit && k.duzZaman) {
    l.push({ zaman: k.duzZaman.toISOString(), kim: k.duzKim ?? g.yazan, kaynak: "Elle", dikkat: true,
      olay: `Kontrol saati gerekçeyle ${k.basladi ? "düzeltildi" : "yazıldı"}: ${trZaman(k.duzBas)} – ${trZaman(k.duzBit).slice(11)} (${dk(k.duzBas, k.duzBit)} dk) · ${k.gerekce ?? ""}` });
  }
  /* fotoğrafın saat dışı sayılması sapma denetimiyle aynı ölçü: rapora yazılan saat (düzeltme varsa o) ± pay */
  const bas = k ? (k.duzBas ?? k.basladi) : null, bit = k ? (k.duzBas ? k.duzBit : k.bitti) : null, pay = FOTO_PAY_DK * 60_000;
  for (const f of g.fotolar) {
    if (!f.eklendi) continue;
    const c = f.cekim ? cekimAni(f.cekim) : null;
    const disi = c !== null && !!bas && !!bit && (c < bas.getTime() - pay || c > bit.getTime() + pay);
    l.push({ zaman: f.eklendi, kim: g.yazan, kaynak: "Sunucu", dikkat: disi,
      olay: `${f.okuma ? "Okuma fotoğrafı" : "Fotoğraf"} eklendi · ${f.ad}${f.cekim ? ` · çekim ${cekimYazi(f.cekim)}${disi ? " (saat dışı)" : ""}` : ""}${f.konum === undefined ? "" : f.konum ? " · konum kayıtlı" : " · konum yok"}` });
  }
  return l.sort((a, b) => a.zaman.localeCompare(b.zaman));
}

/** Excel'e aktarılan tablo (başlık + satırlar): saat Türkiye saatiyle */
export function cizelgeTablosu(l: readonly CizelgeSatiri[]): string[][] {
  return [["Saat", "Olay", "Kim", "Saatin kaynağı"], ...l.map((s) => [trZaman(new Date(s.zaman)), s.olay, s.kim, s.kaynak])];
}
export { trZaman as cizelgeZamani };
