/* KULLANIM ÖZETİ (474; reisim 2026-10-10, maket "Saha ekranı" — Kullanım kutusu): bu formatla yazılan bir raporda denetçinin işi — kontrol
   maddesi sayısı (hepsi ilk cevapla, "Uygun" gelir), cevabı değiştirmenin dokunuşu (açılır listede iki: aç + seç; yan yana tuşlarda bir),
   yazılan ve seçilen kutular, ölçüm tabloları (satır başına sütun). Saf; format kurucusunun saha görünümünde ve sürüm sayfasında gösterilir. */
import { raporDuzeni } from "../../format/duzen.ts";
import type { FormatTanimi } from "../../format/tanim.ts";

export interface Kullanim {
  /** ekranda görünen bölüm (1 Firma bilgileri ve 2 Ekipman bilgileri dahil; imza bölümü ekranda yok) */
  bolum: number;
  madde: number;
  /** bütün maddelerin cevabını değiştirmenin dokunuşu: açılır listede madde başına iki (aç + seç), yan yana tuşlarda bir */
  acilir: number; tus: number;
  /** elle yazılan kutular (yazı, sayı, tarih; test değeri; not / yorum) */
  yazilan: number;
  /** seçilen kutular (seçim, evet / hayır, çoklu seçim; seçmeli test değeri) */
  secilen: number;
  /** ölçüm tabloları: satır başına kutu sayısı */
  tablolar: { ad: string; sutun: number }[];
  /** fotoğraf isteyen bölümler (en az bir fotoğraf zorunlu) */
  foto: number;
}

export function kullanim(t: FormatTanimi): Kullanim {
  let madde = 0, yazilan = 0, secilen = 0, foto = 0;
  const tablolar: Kullanim["tablolar"] = [];
  for (const b of t.bolumler) {
    if (b.blok === "liste") madde += b.gruplar.reduce((n, g) => n + g.maddeler.length, 0);
    else if (b.blok === "bilgi") for (const a of b.alanlar) {
      if (a.kaynak) continue;
      if (a.tur === "secim" || a.tur === "coklu" || a.tur === "evet") secilen++; else yazilan++;
    }
    else if (b.blok === "test") for (const d of b.degerler) { if (d.secenekler?.length) secilen++; else yazilan++; }
    else if (b.blok === "olcum") tablolar.push({ ad: b.ad, sutun: b.sutunlar.length + (b.notlar?.length ? 1 : 0) });
    else if (b.blok === "not") yazilan++;
    else if (b.blok === "foto" && b.enAz > 0) foto++;
  }
  const bolum = 2 + raporDuzeni(t, false).bolumler.filter((x) => x.b.blok !== "imza").length;
  return { bolum, madde, acilir: madde * 2, tus: madde, yazilan, secilen, tablolar, foto };
}
