/* YEDEĞİN KLASÖR DÜZENİ (2026-11-03; sunum "Drive'da görünüşü" + fotoğraf düzeni A) — SAF. Ana klasör firmanın ayarından (Firma ayarları › Yedek):
     <ana>/Raporlar/<Müşteri>/<Tesis>[/<Yıl>]/<rapor no>/<rapor no[-Rn]>.pdf  + raporda görünmeyen fotoğraflar (okuma, işaretli form) aynı klasörde
     <ana>/Belgeler/<tür>/<dosya adı (kısa kimlik)>.<uzantı>
     <ana>/Veri yedeği/Tam kopya <yıl>.zip · <ana>/Veri yedeği/Aylık/<yıl-ay>.zip
   Adlar iki hizmetin de kabul ettiği biçime getirilir: \ / : * ? " < > | # % ve denetim karakterleri boşluk olur, baş / son boşluk ve sondaki nokta
   atılır, en çok 120 karakter; boş kalırsa "-". */

export type KlasorDuzeni = "mt" | "mty" | "my";

export function adTemizle(ad: string, en = 120): string {
  const t = ad.normalize("NFC").replace(/[\u0000-\u001f\u007f\\/:*?"<>|#%]+/g, " ").replace(/\s+/g, " ").trim().slice(0, en).replace(/[\s.]+$/, "");
  return t || "-";
}

/** dosya adını uzantısıyla birlikte kırp (uzantı korunur) */
export function dosyaAdi(ad: string, uzanti: string): string {
  return `${adTemizle(ad, 110)}.${uzanti}`;
}

export const UZANTI: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf", "text/csv": "csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx", "application/zip": "zip",
};

export interface RaporYeri { kok: string; duzen: KlasorDuzeni; musteri: string; tesis: string; yil: number; no: string }
export function raporKlasoru(r: RaporYeri): string[] {
  const y = [adTemizle(r.kok), "Raporlar", adTemizle(r.musteri)];
  if (r.duzen !== "my") y.push(adTemizle(r.tesis));
  if (r.duzen !== "mt") y.push(String(r.yil));
  y.push(adTemizle(r.no));
  return y;
}

/** firmanın yüklediği / programın ürettiği belgeler: dosya modülü → Belgeler altındaki klasör (yoksa yedeğe girmez). Rapor fotoğrafları ve imzalı
    rapor PDF'i raporun klasöründe (raporKlasoru); imzaya hazırlanan PDF, S.A.Y ekleri ve kişiye özel saha notları yedeğe girmez. */
export const BELGE_KLASORU: Readonly<Record<string, readonly string[]>> = {
  is_sozlesmesi: ["Sözleşmeler"], sozlesme_gonderim: ["Sözleşmeler", "Müşteriye gönderilen"], sozlesme_sablon: ["Sözleşmeler", "Şablonlar"], teklif_gonderim: ["Teklifler", "Müşteriye gönderilen"],
  isg_katip: ["İSG-KATİP"], olcum_cihazi: ["Ölçüm cihazları"], egitim: ["Eğitimler"],
  ozluk: ["Personel", "Özlük"], atama: ["Personel", "Ekipman atama belgeleri"], bordro: ["Personel", "Bordrolar"], zimmet_formu: ["Personel", "Zimmet formları"],
  zimmet: ["Zimmet ve araç tutanakları"], belge_onay_imzali: ["İmzalı belgeler"], gider: ["Muhasebe", "Giderler"], izin: ["Talepler", "İzin belgeleri"],
  saha_formu: ["Planlar", "Saha formları"], plan_onbilgi: ["Planlar", "Ön bilgilendirme"], ekipman_turu: ["Rapor formatları"],
  standart: ["Dökümanlar", "Standartlar"], dokuman: ["Dökümanlar"], firma_ayar: ["Firma ayarları"],
};
/** yedeğe hiç girmeyen dosya modülleri (BELGE_KLASORU ile birlikte dosya modüllerinin tamamı — kilit tests/yedek-saf.test.ts) */
export const YEDEK_DISI_DOSYA: Readonly<Record<string, string>> = {
  rapor: "fotoğraf raporun PDF'inde; yalnız okuma fotoğrafı raporun klasörüne",
  rapor_pdf: "imzaya hazırlanan imzasız PDF",
  rapor_imzali: "raporun klasörüne (imzalı PDF)",
  say_form: "raporun klasörüne (işaretli form)",
  belge_onay: "imzaya gönderilen imzasız belge (imzalısı yedekte)",
  say_ek: "S.A.Y eki", say_chat: "kişiye özel sohbet",
};

export function belgeYolu(kok: string, modul: string): string[] | null {
  const k = BELGE_KLASORU[modul];
  return k ? [adTemizle(kok), "Belgeler", ...k.map((x) => adTemizle(x))] : null;
}
/** belgenin adı: kendi adı + kısa kimlik (aynı adlı iki belge birbirini ezmesin) */
export function belgeAdi(ad: string, dosyaId: string, tur: string): string {
  const u = UZANTI[tur] ?? "bin";
  const kok = ad.replace(new RegExp(`\\.${u}$`, "i"), "");
  return dosyaAdi(`${kok} (${dosyaId.slice(0, 8)})`, u);
}

export const veriKlasoru = (kok: string) => [adTemizle(kok), "Veri yedeği"];
export const ayKlasoru = (kok: string) => [...veriKlasoru(kok), "Aylık"];
export const tamKopyaAdi = (yil: number) => `Tam kopya ${yil}.zip`;
export const ayDosyasiAdi = (donem: string) => `${donem}.zip`;

/** İstanbul saatine göre yıl, ay ("2026-11") ve ayın ilk anı */
export function donemi(t: Date): { yil: number; ay: string; ayBasi: Date } {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit" }).formatToParts(t);
  const yil = Number(p.find((x) => x.type === "year")!.value), ayNo = Number(p.find((x) => x.type === "month")!.value);
  /* Türkiye 2016'dan beri yaz saati uygulamıyor: UTC+3 */
  return { yil, ay: `${yil}-${String(ayNo).padStart(2, "0")}`, ayBasi: new Date(Date.UTC(yil, ayNo - 1, 1, -3)) };
}
/** "2026-11" → [ayın ilk anı, sonraki ayın ilk anı) */
export function ayAraligi(donem: string): [Date, Date] {
  const [y, a] = donem.split("-").map(Number) as [number, number];
  return [new Date(Date.UTC(y, a - 1, 1, -3)), new Date(Date.UTC(y, a, 1, -3))];
}
