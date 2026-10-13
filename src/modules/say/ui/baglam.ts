/* S.A.Y RAPOR BAĞLAMI (382) — saha raporu ekranı (raporlar modülü) düzenlenebilir raporu açıkken buraya kendini bağlar; S.A.Y (düzendeki tek bileşen)
   açık raporun CANLI hâlini (kaydedilmemiş değişiklikler dahil) buradan okur, öneriyi buradan uygular, eksik alana buradan götürür. Rapor ekranı
   kapanınca bağ kalkar (S.A.Y genel sorulara döner). Tarayıcı içi; sunucuya yalnız S.A.Y'ın gönderdiği yapı gider.
   542 (sunum 541 onaylı — reisim 2026-10-14: "say asistandan gir ve fotoğrafı okuyup ilgili yerlere girişleri yap diyeceğim ve yapacak"): S.A.Y
   RAPORA GİRER — okunmamış fotoğrafları okuyup boş alanlara girer, maddeleri uygun işaretler, sonucu yapar; her işin "Geri al"ı. İş rapor ekranında
   (raporlar/say-doldur.ts); kaydetmek kişide. */
import { useSyncExternalStore } from "react";
import type { Cevaplar } from "../../../format/tanim";
import type { SohbetEksik } from "../../../server/yz/sohbet";

/** okuyup girmenin özeti (S.A.Y'ın cevabını sunucu bundan kurar — sayılar ve formatın adları) */
export interface SayOkumaOzeti {
  /** okunan fotoğraf · okunamayan fotoğraf · ilk okunamama nedeni */
  okunan: number; okunamayan: number; neden: string | null;
  /** bölüm başına girilen alan / tablo satırı, emin olunmayan değer sayısı */
  bolumler: { ad: string; alan: number; satir: number; belirsiz: number }[];
  /** dolu olduğu için değiştirilmeyen alanların adları */
  dolu: string[];
}
/** geri al: S.A.Y'ın girdiği ve hâlâ duran değerler önceki hâline döner — dönen: geri alınan giriş sayısı */
export type SayGeriAl = () => number;

export interface SayRaporBagi {
  id: string;
  no: string;
  /** şu an boş olan zorunlu alanlar */
  eksikler: () => SohbetEksik[];
  /** sonuç: formatta var mı, kriterlere göre öneri, seçili, kusur sayısı */
  sonuc: () => { var: boolean; oneri: "uygun" | "uygun_degil"; secili: "" | "uygun" | "uygun_degil"; kusur: number };
  /** öneriyi denetçinin seçimiyle aynı yoldan uygular (kaydedilmemiş değişiklik olur) */
  sonucUygula: (deger: "uygun" | "uygun_degil") => void;
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
  sonucYap: (x: "uygun" | "uygun_degil") => { var: boolean; sayi: number; geriAl: SayGeriAl };
  /** 542 (K5): S.A.Y'a eklenen fotoğraf rapora okuma fotoğrafı olarak (okunmadan) eklenir — dönen: dosya kimliği ya da neden */
  fotoEkle: (dosya: File, bolum: string) => Promise<{ dosya: string } | { neden: string }>;
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
