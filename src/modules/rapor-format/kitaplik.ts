/* PARÇA KİTAPLIĞININ ŞABLON BÖLÜMLERİ (496) — sunucuda seçilir, kurucu sayfası istemciye yalnız bunları gönderir (şablon dosyası büyük, tarayıcıya
   gitmez). Bakanlık formatları (ZPKR…, ZPMR01, ZYDR01) ve genel şablonların parça olabilen bölümleri (yapboz.ts parcaOlur), şablon başına. */
import { SABLONLAR } from "../../format/sablonlar.ts";
import { parcaOlur, type HazirParca } from "./yapboz.ts";

export const hazirParcalar = (): HazirParca[] =>
  Object.entries(SABLONLAR).map(([anahtar, s]) => ({ anahtar, ad: s.ad, bolumler: s.tanim.bolumler.filter(parcaOlur) })).filter((h) => h.bolumler.length > 0);
