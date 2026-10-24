/* BASILI FORMDAN ŞABLON — YAPAY ZEKÂSIZ OKUMA, ortak tipler (2026-10-24; reisim: "ben şablon yükledim bu şablondan başlat dedim neden yapay zeka
   çalışıyor ?", "en baştan beri bunu istedim"). PDF'in KENDİ içeriği okunur — yazılar (yer, boy, kalın / eğik, yazı tipi), dolgular (tablo
   çizgisi olarak çizilen ince dikdörtgenler ve zeminler), çizilen çizgiler, resimler — ve kurallarla şablona çevrilir:
     pdf.js belgesi ──pdf-sayfa.ts pdfSayfalari──▶ PdfSayfasi[] ──pdf-izgara.ts pdfIzgara──▶ BASILI ham (basili.ts basilidanTanim'in girdisi)
   Koordinatlar punto (1/72 inç), sayfanın SOL ÜST köşesinden; y aşağı doğru artar. Yapay zekâ yok, ağ yok; tarayıcıda koşar (ui/pdfOku.ts). */

import type { HucreAlanTuru, HucreTuru, TabloKaynagi, YaziTipi } from "../../format/tanim.ts";

/** sayfadaki bir yazı parçası (pdf.js metin öğesi): x, y sol üst köşe; g genişlik, h yükseklik (taban çizgisi y + h) */
export interface PdfYazi {
  s: string;
  x: number; y: number; g: number; h: number;
  /** yazının boyu (punto) */
  boy: number;
  kalin: boolean; egik: boolean;
  /** yazı tipinin adı (ör. "TimesNewRomanPS-BoldMT", "Arial", "Calibri") — yazı tipi ailesi buradan */
  aile: string;
}
/** dolgulu dikdörtgen (yol dolgusu): renk "#RRGGBB" */
export interface PdfDolgu { x: number; y: number; g: number; h: number; renk: string }
/** çizilen düz çizgi (yol çizimi): uçları ve kalınlığı */
export interface PdfCizgi { x1: number; y1: number; x2: number; y2: number; kalinlik: number }
/** resim (logo vb.): kapladığı dikdörtgen */
export interface PdfResim { x: number; y: number; g: number; h: number }
export interface PdfSayfasi {
  /** sayfanın genişliği ve yüksekliği (punto) */
  en: number; boy: number;
  yazilar: PdfYazi[];
  dolgular: PdfDolgu[];
  cizgiler: PdfCizgi[];
  resimler: PdfResim[];
}

/** okumanın sınırları (bozuk / kötü niyetli PDF tarayıcıyı kilitlemesin) */
export const PDF_SINIR = { sayfa: 20, yazi: 20_000, yol: 60_000, resim: 500 } as const;

/* ── okumanın çıktısı: basili.ts basilidanTanim'in girdisi (BASILI ham — bölümler, satırlar HTML tablosu gibi: hücre o satırda başlar, yukarıdan
   birleşik gelen yer atlanır) ── */
/** hücrenin kenarı: 0 yok · 1 ince · 2 kalın */
export type HamKenar = 0 | 1 | 2;
export interface HamHucre {
  metin: string;
  tur: HucreTuru;
  sutunBirlesim: number; satirBirlesim: number;
  kaynak: "yok" | TabloKaynagi;
  alan: HucreAlanTuru; birim: string; secenekler: string[]; formul: string;
  kim: "yok" | "uzman" | "teknik" | "uzman2" | "tesis";
  gorsel: "logo" | "akr";
  kalin: boolean; egik: boolean; hiza: "sol" | "orta" | "sag";
  /** zemin "#RRGGBB" ya da "" · boy punto (0: belgenin boyu) */
  zemin: string; boy: number;
  /** kenarlar (verilmemişse belgenin çizgisi her yanda) */
  kenar?: { u: HamKenar; a: HamKenar; s: HamKenar; g: HamKenar };
}
export interface HamSatir { tekrar: boolean; yukseklik: number; hucreler: HamHucre[] }
export interface HamBolum {
  ad: string; tur: "tablo" | "cihaz" | "foto" | "kusur";
  /** öncekinin yanında · satırdaki genişlik payı (%) · sütun genişlikleri (%) · kontrol cevapları (2. "uygun değil") */
  yan: boolean; oran: number; sutunlar: number[]; cevaplar: string[];
  satirlar: HamSatir[];
}
export interface BasiliHam {
  cevap: string; baslik: string; formKodu: string; altYazi: string;
  /** belgenin yazı tipi ve boyu; ara — bölümler arası (mm; 2026-10-24: tek parça çizilmiş formun bantları bitişik — 0) */
  yazi: { tip: YaziTipi; boy: number; ara?: number };
  bolumler: HamBolum[];
}
