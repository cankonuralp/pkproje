/* S.A.Y SAYFA YARDIMI (380; maket say.js YARDIM — "Bu sayfada ne yapılır?" kuralla, ücretsiz) — modül numarasına göre kısa açıklama; aynı metinler
   yapay zekânın sabit talimatında uygulamanın kılavuzudur (src/server/yz/say.ts saySistemi). Kayıt verisi yok. */
import { ANA_SAYFA, MODULLER, modulBul } from "../moduller.ts";

export const SAYFA_YARDIMI: Readonly<Record<number, string>> = {
  13: "Planlar: size atanan planlar. Planı açıp tarafsızlık beyanıyla kabul edin; plan gününde ekipmanların raporlarını oluşturun. Planlamacı plan bilgilerini Düzenle ile değiştirirse siz Güncelle'ye basınca planınıza ve taslak raporlarınıza geçer.",
  14: "Raporlar: yazdığınız bütün raporlar. Süzgeçle bulun; Yeni ya da geri gönderilen raporu düzenleyip onaya gönderin.",
  15: "Onaylar: imzanızı ya da onayınızı bekleyen her şey — raporların son imzası, bordro, zimmet, eğitim ve araç tutanakları. Yöneticiyseniz branşınızın onay kuyruğu da burada.",
  20: "Uyarılar: süresi yaklaşan ve geçen işler (kalibrasyon, belge, sözleşme, eğitim).",
  3: "Müşteriler: müşteri ve tesis kartları, müşteri girişi, tesisin ekipmanları (Excel'den toplu yükleme).",
  11: "Teklifler: teklif hazırlayın, müşteriye gönderin; kabul edilen teklif sözleşmeye ve plana gider.",
  12: "Sözleşmeler: firmalar arası iş sözleşmesi ve içindeki İSG-KATİP SÖZLEŞME ID'leri (tesis × denetçi).",
  8: "Ölçüm cihazları: kalibrasyon ve ara kontroller; süresi geçen cihaz raporda uyarı verir.",
  9: "Zimmetler: kime hangi cihaz verildi; teslim formu Onaylar'da imzalanır.",
  23: "Araçlar: araç belgeleri, haftalık kilometre ve teslim tutanakları.",
  2: "Personel: kişi kartları, yetkiler, eğitimler, özlük, maaş ve bordrolar.",
  21: "Talepler: izin ve masraf talepleriniz; onaylanınca durumunu burada görürsünüz.",
  18: "Muhasebe: imzalı raporlar → fatura → tahsilat; giderler, gelir-gider ve Maaş bordrosu gönder.",
  19: "Performans: rapor süreleri ve tamamlanma dilimleri.",
  5: "Ekipman türleri: tür kataloğu, kontrol süresi, ölçüm cihazları ve rapor formatı.",
  4: "Dökümanlar: standartlar, talimatlar ve eğitimler.",
  22: "Firma ayarları: künye, imza yöntemi, depolama ve yedek, yapay zekâ, formatlar.",
};
export const ANA_SAYFA_YARDIMI = "Ana sayfa rolünüze göre bugünün işlerini, bekleyenleri ve duyuruları toplar.";

/** yapay zekânın kılavuzu: [menüdeki ad, açıklama] — Ana sayfa + her modül */
export const SAY_KILAVUZU: readonly (readonly [string, string])[] = [
  [ANA_SAYFA.ad, ANA_SAYFA_YARDIMI],
  ...MODULLER.filter((m) => SAYFA_YARDIMI[m.no]).map((m) => [m.ad, SAYFA_YARDIMI[m.no].replace(/^[^:]+:\s*/, "")] as const),
];

/** adresten (istemcinin bulunduğu sayfa) yer adı, modül numarası ve yardım; tanınmayan adres "probata" (kayıt bilgisi taşımaz) */
export function sayfaBilgisi(yol: string): { yer: string; modul: number | null; yardim: string | null } {
  const parca = yol.split(/[?#]/)[0].split("/").filter(Boolean)[0] ?? "";
  if (!parca) return { yer: ANA_SAYFA.ad, modul: null, yardim: ANA_SAYFA_YARDIMI };
  const m = modulBul(parca);
  return m ? { yer: m.ad, modul: m.no, yardim: SAYFA_YARDIMI[m.no] ?? null } : { yer: "probata", modul: null, yardim: null };
}
