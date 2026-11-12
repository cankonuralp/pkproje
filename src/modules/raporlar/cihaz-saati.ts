/* BAĞLANTISIZKEN KONTROL SAATİ (2026-11-12, göç 0131; pkproje.md §11 K4 — "bağlantısızken saat cihazdan; bağlantıdan çıkarken ve dönerken cihaz saati
   sunucuyla karşılaştırılır — arada saat oynanmışsa iki ölçüm tutmaz, o aradaki kayıtlar sapma; 5 dk'ya kadar fark düzeltilerek kabul").
   Cihaz üç şey gönderir: olayın anı (cihaz saati), bağlantıdan çıkmadan önceki son ölçüm (çapa: sunucunun saati + o andaki cihaz saati) ve işi
   gönderdiği andaki cihaz saati. Sunucu işi aldığı anda kendi saatini bilir:
     çıkış farkı = çapa.sunucu − çapa.cihaz · dönüş farkı = sunucu şimdi − gönderim
   İkisi 5 dakikadan az ayrılıyorsa cihazın saati arada oynanmamıştır: olayın anı dönüş farkıyla sunucu saatine çevrilir. Ayrıca sıra tutmalı:
   çapa ≤ olay ≤ gönderim (cihaz saati geri ya da ileri alınmışsa tutmaz). Tutmayan kayıt reddedilmez — cihazın saatiyle yazılır ve işaretlenir
   (sapma: gerekçesiz onaya gitmez). Hiçbir durumda ileri bir an yazılmaz. Saf; tarayıcı (bekleyen işin ekrandaki saati) ve sunucu ortak. */

/** bağlantıdan çıkarken / dönerken ölçülen farkın en çok ayrılabileceği, ve sıranın payı */
export const SAAT_PAYI_MS = 5 * 60_000;
export interface SaatCapasi { sunucu: number; cihaz: number }
export interface CihazOlcumu {
  /** olayın anı — cihaz saati (ms) */
  an: number;
  /** olaydan önceki son sunucu ölçümü; hiç ölçülmediyse null */
  capa: SaatCapasi | null;
  /** işin gönderildiği andaki cihaz saati (ms); bilinmiyorsa null */
  gonderim: number | null;
}
export interface CihazSaati {
  /** kayda yazılan an (sunucu saati, ms) — ileri bir an olmaz */
  zaman: number;
  tutmadi: boolean;
  /** tutmadıysa nedeni (kayıt ve sapma metni) */
  neden: string | null;
}

const dk = (ms: number) => Math.round(ms / 60_000);

export function cihazSaati(o: CihazOlcumu, sunucuSimdi: number): CihazSaati {
  const donus = o.gonderim === null ? null : sunucuSimdi - o.gonderim;
  const cikis = o.capa ? o.capa.sunucu - o.capa.cihaz : null;
  let neden: string | null = null;
  if (donus === null) neden = "işin gönderildiği andaki cihaz saati bilinmiyor";
  else if (o.an > o.gonderim! + SAAT_PAYI_MS) neden = "cihaz saati kontrol sırasında ileri alınmış";
  else if (o.capa && o.an < o.capa.cihaz - SAAT_PAYI_MS) neden = "cihaz saati kontrol sırasında geri alınmış";
  else if (cikis === null) neden = "bağlantıdan çıkmadan önce cihaz saati ölçülmemiş";
  else if (Math.abs(donus - cikis) > SAAT_PAYI_MS) neden = `cihaz saati bağlantısızken değişmiş (çıkarken fark ${dk(cikis)} dk, dönerken ${dk(donus)} dk)`;
  return { zaman: Math.min(sunucuSimdi, Math.round(o.an + (donus ?? 0))), tutmadi: neden !== null, neden };
}

/** cihaz saatiyle yazılan ucun kanıtı: cihazın gönderdikleri, sunucunun işi aldığı an, tutmadıysa nedeni */
export interface UcKaniti { an: number; capa: SaatCapasi | null; gonderim: number | null; sunucu: number; neden: string | null }
/** başlangıcı ve bitişi birlikte gelen kontrol (S.A.Y Chat Rapor modu — göç 0132, K11: ilk fotoğraf başlangıç, Gönder bitiş): ikisi de sunucu saatine
    çevrilir; bitiş başlangıçtan önce çıkarsa başlangıca çekilir ve kayıt "tutmadı" işaretlenir */
export interface KayitKontrolu { bas: number; bit: number; tutmadi: boolean; kanit: { bas: UcKaniti; bit: UcKaniti } }
export function kayitKontrolu(g: { bas: number; bit: number; capa: SaatCapasi | null }, gonderim: number | null, sunucuSimdi: number): KayitKontrolu {
  const b = cihazSaati({ an: g.bas, capa: g.capa, gonderim }, sunucuSimdi), s = cihazSaati({ an: g.bit, capa: g.capa, gonderim }, sunucuSimdi);
  const once = s.zaman < b.zaman;
  const uc = (an: number, neden: string | null): UcKaniti => ({ an, capa: g.capa, gonderim, sunucu: sunucuSimdi, neden });
  return { bas: b.zaman, bit: once ? b.zaman : s.zaman, tutmadi: b.tutmadi || s.tutmadi || once,
    kanit: { bas: uc(g.bas, b.neden), bit: uc(g.bit, s.neden ?? (once ? "cihazdaki bitiş saati başlangıçtan önce" : null)) } };
}

/** ms → "YYYY-AA-GGTSS:DD" (Türkiye saati, UTC+3) — bekleyen işin ekranda görünen saati */
export const trDakika = (ms: number) => new Date(ms + 3 * 3_600_000).toISOString().slice(0, 16);

/** cihazda bekleyen kontrol işleri (başla / bitir — cihaz saatiyle) ekrandaki kontrol durumunun üstüne: sunucudaki kayıt gelene kadar görünür */
export interface YerelKontrol { bas: number | null; bit: number | null }
export interface OlcumOzeti { durum: "yok" | "suruyor" | "bitti"; bas: string | null; bit: string | null }
export function yerelOlcum<T extends OlcumOzeti>(o: T, y: YerelKontrol): T & { bekliyor: boolean } {
  if (o.durum === "yok" && y.bas !== null) {
    return { ...o, durum: y.bit !== null ? "bitti" : "suruyor", bas: trDakika(y.bas), bit: y.bit !== null ? trDakika(Math.max(y.bit, y.bas)) : null, bekliyor: true };
  }
  if (o.durum === "suruyor" && y.bit !== null) return { ...o, durum: "bitti", bit: trDakika(y.bit), bekliyor: true };
  return { ...o, bekliyor: false };
}
