/* RAPOR BELGESİ VERİSİ — belge çizicinin (belge.ts raporBelgesi) tek girdisi. Sunucuda Raporlar modülü doldurur (raporBelgesi); çizici veritabanına
   gitmez, saf: aynı veri → aynı belge (önizleme ve kesin PDF aynı çiziciden, pkproje §4.2, RAPOR-FORMAT §1 "Görünüm"). Değerler raporun kendi
   kayıtlarından ve açıldığı format sürümünden; fotoğraflar sunucuda okunup veri adresi olarak gömülür (dış adres yok). */
import type { Cevaplar, FormatTanimi, RaporSonucu } from "../format/tanim.ts";
import type { BelgeDegerleri } from "./katalog.ts";

export interface BelgeCihazi { turAd: string; kod: string; marka: string | null; model: string | null; seri: string | null;
  kalTarih: string | null; kalBitis: string | null; sertifika: string | null }
export interface BelgeFotosu { ad: string; bolum: string; madde: string | null; src: string | null }
/** 595: imza bölümünün kişi satırları için personel kaydının bilgileri (imza anında kopyalanır — eski kopyalarda yalnız ilk beşi var) */
export interface ImzaKisiBilgisi { meslek: string; meslekMetin?: string | null; ekipnet: string | null; diploma: string | null; oda: string | null; eposta?: string | null; tel?: string | null }

export interface BelgeVerisi {
  /** muayene firması (belgenin sahibi): ad, rapor kodu, nüsha sayısı (firma ayarı); 334: adres, akreditasyon no ve logo (veri adresi) başlıkta */
  firma: { ad: string; kod: string; nusha: number; adres?: string | null; eposta?: string | null; tel?: string | null; akr?: string | null; logo?: string | null };
  no: string; revizyon: number; formatSira: number;
  durum: "taslak" | "onayda" | "onaylandi" | "imzada" | "imzali";
  tur: { ad: string; kod: string; kontrolStd: string[] };
  /** müşteri künyesi (raporun kendi kopyası); 595: e-posta ve telefon tesisin müşterisinden (1. bölümde satırı varsa basılır) */
  kunye: { firmaAdi: string; adres: string | null; sgk: string | null; isgNo: string | null; eposta?: string | null; tel?: string | null };
  /** 595: planın proje numarası (1. bölümde "Proje no" satırı varsa) */
  planNo?: string | null;
  /** başlangıç / bitiş "YYYY-MM-DDTHH:MM" (Türkiye saati); öteki "YYYY-MM-DD" */
  tarih: { bas: string | null; bit: string | null; sonraki: string | null; takip: string | null; rapor: string | null };
  ekipman: { kod: string; marka: string | null; model: string | null; seri: string | null; imal: string | null; konum: string | null; amac: string | null; bolum: string | null };
  tanim: FormatTanimi;
  cevaplar: Cevaplar;
  cihazlar: BelgeCihazi[];
  fotolar: BelgeFotosu[];
  sonuc: RaporSonucu | null;
  yazan: { ad: string } & ImzaKisiBilgisi;
  /** onaylayan teknik yönetici (yalnız formatın imza bloğunda "teknik" yeri varsa basılır — karar 105); 595: hesabı bir personele bağlıysa o kaydın
      bilgileri (imza bölümünde teknik yöneticinin meslek / diploma / oda sicil … satırları) */
  onay: { ad: string; zaman: string; kisi?: ImzaKisiBilgisi | null } | null;
  /** 595 (madde 1): sahada seçilen ikinci muayene uzmanı (plan ekibinden; kaydının bilgileri) */
  ikinci?: ({ ad: string } & ImzaKisiBilgisi) | null;
  /** son imza (imza kalemi); yoksa belge imzasızdır */
  imza: { zaman: string; yontem: string } | null;
  /** imzaya hazırlanan KESİN belge (317): önizleme şeridi yok, imza hücresi elektronik imzayı söyler (imza PDF'in kendisinde) */
  kesin?: boolean;
  /** 2026-10-25 (belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca bağlamalıyız"): rapor değil, programın
      belgesi (zimmet, araç tutanağı, eğitim, talep, teklif, fatura özeti, saha, ön bilgilendirme) firmanın formatıyla — kayıt hücresinin veri'si bu
      değerlerden okunur (src/belge/katalog.ts; belge.ts belgeFormu kurar) */
  belge?: BelgeDegerleri;
}
