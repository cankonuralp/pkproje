/* ══ MODÜL KAYDI — yan menünün ve modül yollarının TEK KAYNAĞI ══════════════════════════════════════════════
   pkproje.md §3.1'in firma panelinde ekranı olan modülleri; sıra, grup ve adlar reisim'in onayladığı maketle aynı
   (docs/assets/maket.js MENU, 5. tur; tests/moduller.test.ts birebir karşılaştırır). Adlar genel, kişiye bağlı değil
   (reisim 2026-09-23: "planlar raporlar zimmetler gibi genel isimler"). Menüde olmayanlar: 6 Rapor Şablonları (kodda),
   16 PDF Üretimi (sunucu işi), 17 Müşteri Paneli (müşterinin kendi girişi). Kimin hangi modülü göreceği sonra
   belirlenecek (reisim) — bu kayıt o karar geldiğinde yetki alanı alır.
   2026-09-25 (reisim, M1 soruları: "159 birleşsin", "kullanıcı hesabı her zaman personele bağlı olsun"): 1 Kullanıcı & Rol ayrı
   menü değil; hesap, roller ve rol yetkileri Personel'in (2) içinde → 16 modül.
   2026-09-26 (reisim, M3: "ekipmanlar ve ekipman türleri diye iki modüle gerek yok ekipman türleri yeterli" · "planlar açıldığında
   ekipmanlar orada gözüküyor ... neden ekstradan ekipmanlar sekmesi lazım olsun"): 7 Ekipmanlar ayrı menü değil; ekipmanlar planın
   içinde (denetçi sahada ekler) → 15 modül. */

export interface Modul {
  /** pkproje.md §3.1 numarası */
  no: number;
  ad: string;
  /** adres parçası (ASCII); Planlar ana sayfadır */
  yol: string;
  /** Lucide ikon adı (src/components/ikon/lucide-1.47.0/ikonlar.svg) */
  ikon: string;
}

export interface ModulGrubu {
  grup: string;
  moduller: readonly Modul[];
}

export const MODUL_GRUPLARI: readonly ModulGrubu[] = [
  { grup: "İş takibi", moduller: [
    { no: 13, ad: "Planlar", yol: "", ikon: "calendar-check" },
    { no: 14, ad: "Raporlar", yol: "raporlar", ikon: "file-text" },
    { no: 15, ad: "Onaylar", yol: "onaylar", ikon: "badge-check" },
    { no: 20, ad: "Uyarılar", yol: "uyarilar", ikon: "alarm-clock" },
  ] },
  { grup: "Müşteri", moduller: [
    { no: 3, ad: "Müşteriler", yol: "musteriler", ikon: "building-2" },
    { no: 11, ad: "Teklifler", yol: "teklifler", ikon: "file-pen-line" },
    { no: 12, ad: "Sözleşmeler", yol: "sozlesmeler", ikon: "scroll-text" },
  ] },
  { grup: "Varlık", moduller: [
    { no: 8, ad: "Ölçüm cihazları", yol: "olcum-cihazlari", ikon: "gauge" },
    { no: 9, ad: "Zimmetler", yol: "zimmetler", ikon: "package" },
  ] },
  { grup: "Personel", moduller: [
    { no: 2, ad: "Personel", yol: "personel", ikon: "users" },
    { no: 10, ad: "Eğitimler", yol: "egitimler", ikon: "graduation-cap" },
  ] },
  { grup: "Finans", moduller: [
    { no: 18, ad: "Muhasebe", yol: "muhasebe", ikon: "wallet" },
    { no: 19, ad: "Performans", yol: "performans", ikon: "chart-column" },
  ] },
  { grup: "Tanımlar", moduller: [
    { no: 5, ad: "Ekipman türleri", yol: "ekipman-turleri", ikon: "layers" },
    { no: 4, ad: "Standartlar", yol: "standartlar", ikon: "book-open" },
  ] },
];

export const MODULLER: readonly Modul[] = MODUL_GRUPLARI.flatMap((g) => g.moduller);

/** adres parçasından modül; "" Planlar'dır */
export function modulBul(yol: string): Modul | undefined {
  return MODULLER.find((m) => m.yol === yol);
}
