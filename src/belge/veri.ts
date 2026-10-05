/* RAPOR BELGESİ VERİSİ — belge çizicinin (belge.ts raporBelgesi) tek girdisi. Sunucuda Raporlar modülü doldurur (raporBelgesi); çizici veritabanına
   gitmez, saf: aynı veri → aynı belge (önizleme ve kesin PDF aynı çiziciden, pkproje §4.2, RAPOR-FORMAT §1 "Görünüm"). Değerler raporun kendi
   kayıtlarından ve açıldığı format sürümünden; fotoğraflar sunucuda okunup veri adresi olarak gömülür (dış adres yok). */
import type { Cevaplar, FormatTanimi } from "../format/tanim.ts";

export interface BelgeCihazi { turAd: string; kod: string; marka: string | null; model: string | null; seri: string | null;
  kalTarih: string | null; kalBitis: string | null; sertifika: string | null }
export interface BelgeFotosu { ad: string; bolum: string; madde: string | null; src: string | null }

export interface BelgeVerisi {
  /** muayene firması (belgenin sahibi): ad, rapor kodu, nüsha sayısı (firma ayarı) */
  firma: { ad: string; kod: string; nusha: number };
  no: string; revizyon: number; formatSira: number;
  durum: "taslak" | "onayda" | "onaylandi" | "imzada" | "imzali";
  tur: { ad: string; kod: string; kontrolStd: string[] };
  /** müşteri künyesi (raporun kendi kopyası) */
  kunye: { firmaAdi: string; adres: string | null; sgk: string | null; isgNo: string | null };
  /** başlangıç / bitiş "YYYY-MM-DDTHH:MM" (Türkiye saati); öteki "YYYY-MM-DD" */
  tarih: { bas: string | null; bit: string | null; sonraki: string | null; takip: string | null; rapor: string | null };
  ekipman: { kod: string; marka: string | null; model: string | null; seri: string | null; imal: string | null; konum: string | null; amac: string | null; bolum: string | null };
  tanim: FormatTanimi;
  cevaplar: Cevaplar;
  cihazlar: BelgeCihazi[];
  fotolar: BelgeFotosu[];
  sonuc: "uygun" | "uygun_degil" | null;
  yazan: { ad: string; meslek: string; ekipnet: string | null; diploma: string | null; oda: string | null };
  /** onaylayan teknik yönetici (yalnız formatın imza bloğunda "teknik" yeri varsa basılır — karar 105) */
  onay: { ad: string; zaman: string } | null;
  /** son imza (imza kalemi); yoksa belge imzasızdır */
  imza: { zaman: string; yontem: string } | null;
  /** imzaya hazırlanan KESİN belge (317): önizleme şeridi yok, imza hücresi elektronik imzayı söyler (imza PDF'in kendisinde) */
  kesin?: boolean;
}
