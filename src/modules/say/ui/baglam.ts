/* S.A.Y RAPOR BAĞLAMI (382) — saha raporu ekranı (raporlar modülü) düzenlenebilir raporu açıkken buraya kendini bağlar; S.A.Y (düzendeki tek bileşen)
   açık raporun CANLI hâlini (kaydedilmemiş değişiklikler dahil) buradan okur, öneriyi buradan uygular, eksik alana buradan götürür. Rapor ekranı
   kapanınca bağ kalkar (S.A.Y genel sorulara döner). Tarayıcı içi; sunucuya yalnız S.A.Y'ın gönderdiği yapı gider.
   542 (sunum 541 onaylı — reisim 2026-10-14: "say asistandan gir ve fotoğrafı okuyup ilgili yerlere girişleri yap diyeceğim ve yapacak"): S.A.Y
   RAPORA GİRER — okunmamış fotoğrafları okuyup boş alanlara girer, maddeleri uygun işaretler, sonucu yapar; her işin "Geri al"ı. İş rapor ekranında
   (raporlar/say-doldur.ts); kaydetmek kişide. */
import { useSyncExternalStore } from "react";
import type { Cevaplar, RaporSonucu } from "../../../format/tanim";
import type { SohbetEksik } from "../../../server/yz/sohbet";
import type { SatirEkle } from "../../../server/yz/say";

/** okuyup girmenin özeti (S.A.Y'ın cevabını sunucu bundan kurar — sayılar ve formatın adları) */
export interface SayOkumaOzeti {
  /** okunan fotoğraf · okunamayan fotoğraf · ilk okunamama nedeni */
  okunan: number; okunamayan: number; neden: string | null;
  /** bölüm başına girilen alan / tablo satırı, emin olunmayan değer sayısı */
  bolumler: { ad: string; alan: number; satir: number; belirsiz: number }[];
  /** dolu olduğu için değiştirilmeyen alanların adları */
  dolu: string[];
}
/** 557: bir girişin sonucu (raporlar/say-doldur.ts GirisSonucu ile aynı) */
export interface SayGirisSonucu { yer: string; ad: string; durum: "yazildi" | "ayni" | "yazilamadi" | "bekliyor"; neden?: string }
/** geri al: S.A.Y'ın girdiği ve hâlâ duran değerler önceki hâline döner — dönen: geri alınan giriş sayısı */
export type SayGeriAl = () => number;

export interface SayRaporBagi {
  id: string;
  no: string;
  /** şu an boş olan zorunlu alanlar */
  eksikler: () => SohbetEksik[];
  /** sonuç: formatta var mı, kriterlere göre öneri, seçili, kusur sayısı */
  sonuc: () => { var: boolean; oneri: RaporSonucu; secili: "" | RaporSonucu; kusur: number };
  /** öneriyi denetçinin seçimiyle aynı yoldan uygular (kaydedilmemiş değişiklik olur) */
  sonucUygula: (deger: RaporSonucu) => void;
  /** eksik alana götürür (bölümler açılır, alan odaklanır) */
  git: (e: SohbetEksik) => void;
  /** 384: ekranın canlı cevapları (serbest soruda sunucu özetler — yalnız formatın adları, seçenekler, sayılar yapay zekâya gider) */
  cevaplar: () => Cevaplar;
  /** 542: fotoğraf eklenebilen (fotoğraftan doldurması açık) bölümler */
  fotoBolumleri: () => { id: string; ad: string }[];
  /** 542: raporun okunmamış okuma fotoğrafı sayısı */
  okunmamis: () => number;
  /** 542: okunmamış fotoğrafları (ve `ek` — S.A.Y'a eklenip rapora konan) okur, boş alanlara girer; ustune: dolu alan varsa onları da yazar */
  fotolariOku: (ilerle: (metin: string) => void, ek?: readonly { dosya: string; bolum: string }[]) => Promise<{
    ozet: SayOkumaOzeti; geriAl: SayGeriAl; ustune: (() => { sayi: number; geriAl: SayGeriAl }) | null;
  }>;
  /** 542 (K4): cevapsız maddeler "Uygun" */
  maddeleriIsaretle: () => { sayi: number; geriAl: SayGeriAl };
  /** 542 (K4): sonuç — formatta sonuç yoksa var false */
  sonucYap: (x: RaporSonucu) => { var: boolean; sayi: number; geriAl: SayGeriAl };
  /** 542 (K5): S.A.Y'a eklenen fotoğraf rapora okuma fotoğrafı olarak (okunmadan) eklenir — dönen: dosya kimliği ya da neden */
  fotoEkle: (dosya: File, bolum: string) => Promise<{ dosya: string } | { neden: string }>;
  /** 550: ekranın canlı ekipman bilgisi (raporun haritası için — sunucu Haiku'ya yer kimlikleri ve değerlerle gönderir) */
  ekipman: () => Record<string, string>;
  /** 557: haritanın canlı ekleri — kontrol tarihleri, ölçüm cihazı satırları (seçilebilir cihazlarıyla); künyenin değeri gitmez */
  canliEk: () => { tarih: Record<string, string>; cihazlar: { turId: string; turAd: string; secili: string | null; secenekler: { id: string; kod: string; ad: string }[] }[] };
  /** 550 → 557: Haiku'nun "rapora_yaz" girişleri (raporlar/say-doldur.ts komutlariUygula) — elle ne giriliyorsa, ekranın denetimiyle; ekran yazar,
      geri okuyup teyit eder, ölçüm cihazını sunucu işlemiyle seçer. 2026-10-15 (C): satirlar — satir_ekle (bir tabloya tek komutla N satır).
      Dönen: her girişin sonucu, girilen sayı, eklenen satır, geri al. A: cevaplar / ekipman / canliEk bu yazmanın hemen ardından GÜNCEL hâli verir
      (döngünün sonraki turu haritayı onunla kurar) */
  yaz: (girisler: readonly { yer: string; deger: string }[], satirlar?: readonly SatirEkle[]) => Promise<{ sayi: number; sonuclar: SayGirisSonucu[]; geriAl: SayGeriAl; satir?: number }>;
  /** 2026-10-16 (pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a — D): ekranda kaydedilmemiş değişiklik var mı (iş bitince sayfa yenilenmez, S.A.Y söyler) */
  kirli?: () => boolean;
  /** 2026-10-16 (C): S.A.Y'ın raporu_kaydet / onaya_gonder aracı — ekrandaki Kaydet / Onaya gönder'in AYNISI (ekranın son hâli, aynı sunucu eylemi) */
  kaydet?: () => Promise<SayEkranSonucu>;
  onayaGonder?: () => Promise<SayEkranSonucu>;
}
/** ekranın yaptığı kaydetme / gönderme işinin sonucu (S.A.Y'a döner). kaydedildi: Onaya gönder'de rapor kaydedildi ama gönderilmedi (zorunlu alan
    eksik) — kayıt iş sayılır (S.A.Y "kaydettim" diyebilir) */
export type SayEkranSonucu = { tamam: true; bildirim: string } | { tamam: false; neden: string; kaydedildi?: boolean };

/* ── 553 FORMAT YAPICI (reisim 2026-10-14: "konuşarak ilgili formatı yapabiliyo olalım"): taslak açıkken format yapıcı kendini bağlar — S.A.Y
   taslağı (kaydedilmemiş değişiklikler dahil) gönderir, Haiku'nun "formati_duzenle" işlemlerini taslağa uygular (format yapıcının geçmişine bir
   adım; Geri al iletinin altında). Kaydet / Yayınla kişide. */
export interface SayFormatBagi {
  /** taslağın kimliği (rapor_format) */
  id: string;
  /** canlı taslak (kaydedilmemiş değişiklikler dahil) */
  tanim: () => unknown;
  /** işlemleri uygular (rapor-format/say-kurucu.ts formatIslemleri) — dönen: yapılan / yapılamayan, geri al */
  uygula: (islemler: readonly Record<string, unknown>[]) => { yapilan: string[]; gecersiz: string[]; geriAl: SayGeriAl };
  /** 2026-10-16 (D): taslakta kaydedilmemiş değişiklik var mı */
  kirli?: () => boolean;
}
let formatBag: SayFormatBagi | null = null;
const formatDinleyen = new Set<() => void>();
export function sayFormatBagla(b: SayFormatBagi): () => void {
  formatBag = b; for (const d of formatDinleyen) d();
  return () => { if (formatBag === b) { formatBag = null; for (const d of formatDinleyen) d(); } };
}
export function useSayFormatBagi(): SayFormatBagi | null {
  return useSyncExternalStore((d) => { formatDinleyen.add(d); return () => { formatDinleyen.delete(d); }; }, () => formatBag, () => null);
}

let bag: SayRaporBagi | null = null;
const dinleyenler = new Set<() => void>();
const duyur = () => { for (const d of dinleyenler) d(); };

/** rapor ekranı bağlanır; dönen işlev bağı kaldırır (yalnız kendi bağıysa) */
export function sayRaporBagla(b: SayRaporBagi): () => void {
  bag = b; duyur();
  return () => { if (bag === b) { bag = null; duyur(); } };
}

export function useSayRaporBagi(): SayRaporBagi | null {
  return useSyncExternalStore((d) => { dinleyenler.add(d); return () => { dinleyenler.delete(d); }; }, () => bag, () => null);
}

/** 2026-10-16 (2. adım a — D): ekranda kaydedilmemiş değişiklik var mı (açık rapor ya da format taslağı) — varsa S.A.Y işten sonra sayfayı yenilemez */
export function kaydedilmemisVar(): boolean {
  return !!bag?.kirli?.() || !!formatBag?.kirli?.();
}
