/* S.A.Y RAPOR BAĞLAMI (382) — saha raporu ekranı (raporlar modülü) düzenlenebilir raporu açıkken buraya kendini bağlar; S.A.Y (düzendeki tek bileşen)
   açık raporun CANLI hâlini (kaydedilmemiş değişiklikler dahil) buradan okur, öneriyi buradan uygular, eksik alana buradan götürür. Rapor ekranı
   kapanınca bağ kalkar (S.A.Y genel sorulara döner). Tarayıcı içi; sunucuya yalnız S.A.Y'ın gönderdiği yapı gider. */
import { useSyncExternalStore } from "react";
import type { SohbetEksik } from "../../../server/yz/sohbet";

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
