/* RAPORLAR › EKİPMANLAR SEKMESİ (2026-11-16; reisim: "teknik yönetici tarafında gözüksün, o silebilsin sadece", "herkesinkini raporlar ekranında bir
   sekme de görsün"). Nereden geldi: plansız kalan ekipmanın hiçbir ekranda "Sil"i yoktu (ekipman yalnız kabul edilmiş planın içinden siliniyordu);
   ekipmanı olan tesis ve müşterisi de bu yüzden silinemiyordu. Burada teknik yönetici FİRMANIN BÜTÜN ekipmanlarını (kim eklemiş olursa olsun, hangi
   tesiste olursa olsun; yalnız kendi branşının türleri) görür ve HİÇ KULLANILMAMIŞ olanı kesin siler. Liste SUNUCUDA sayfalı (09-B3; listeGetir).
   Ekipman tablosunun sahibi Ekipman modülü: okuma parçası EKIPMAN_LISTE_SQL, kullanım ve silme onun işlevleriyle (silici.ts — kullanılmış kayıt
   silinmez, veritabanı reddeder). Yetki burada (ekipman-yetki.ts). */
import type { SunucuListe } from "../../../components/liste/suzgec.ts";
import { kullanimMetni } from "../../../components/sil/metin.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { listeGetir, type ListeKaynagi } from "../../../server/liste/liste.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { EKIPMAN_LISTE_SQL, ekipmanKilitle, ekipmanKullanimi, ekipmanSil } from "../../ekipman/server/ekipman.ts";
import { TUR_SQL } from "../../ekipman-turleri/server/turler.ts";
import { TESIS_YER_SQL } from "../../musteriler/server/musteriler.ts";
import { bransiYonetir, yonetilenBranslar, type Brans } from "../ekipman-yetki.ts";

const MODUL = 14;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface EkipmanListeSatiri {
  id: string; kod: string; tur: string; brans: Brans; tesis: string; musteri: string; konum: string | null; ekleyen: string; olustu: string; pasif: boolean;
  /** kullanıldığı yerlerin sayımı (rapor, tamamlanmış plan …); null: hiç kullanılmamış — silinebilir */
  kullanim: Record<string, number> | null;
}
export type EkipmanYazma = { durum: "tamam"; bildirim: string } | { durum: "yetkisiz" } | { durum: "yok" } | { durum: "red"; neden: string };

/** sekmeyi görür mü: Raporlar'ı gören teknik yönetici */
export const ekipmanYonetir = (kim: YetkiHesabi): boolean => duzey(kim, MODUL) !== "yok" && yonetilenBranslar(kim.roller).length > 0;

const KAYNAK = `${EKIPMAN_LISTE_SQL} e
  JOIN ${TUR_SQL} t ON t.firma_id = e.firma_id AND t.id = e.tur_id
  JOIN ${TESIS_YER_SQL} y ON y.firma_id = e.firma_id AND y.id = e.tesis_id`;

/** süzgeç tanımı (ui/EkipmanListesi.tsx tanim ile aynı anahtarlar) */
export function ekipmanKaynagi(): ListeKaynagi {
  return {
    kaynak: KAYNAK,
    secim: `e.id::text AS id, e.kod, t.ad AS tur, t.brans, y.tesis, y.musteri, e.konum, e.ekleyen, e.olustu, (e.pasif IS NOT NULL) AS pasif`,
    metin: ["e.kod", "t.ad", "y.tesis", "y.musteri", "e.konum", "e.ekleyen"],
    alanlar: { kod: "e.kod", tesis: "concat_ws(' ', y.tesis, y.musteri)" },
    cipler: {},
    seciciler: {
      tur: { kosul: (v, ekle) => (UUID.test(v) ? `t.id = ${ekle(v)}::uuid` : "false"), secenek: { deger: "t.id", etiket: "t.ad" } },
      musteri: { kosul: (v, ekle) => (UUID.test(v) ? `y.musteri_id = ${ekle(v)}::uuid` : "false"), secenek: { deger: "y.musteri_id", etiket: "y.musteri" } },
      ekleyen: { kosul: (v, ekle) => `e.ekleyen = ${ekle(v)}`, secenek: { deger: "e.ekleyen", etiket: "e.ekleyen" } },
      sira: { kosul: () => null },
    },
    siraSecici: "sira",
    sira: {
      kod: { ifade: "tr_sira(e.kod)", metin: true }, tur: { ifade: "tr_sira(t.ad)", metin: true },
      tesis: { ifade: "tr_sira(concat_ws(' ', y.musteri, y.tesis))", metin: true }, ekleyen: { ifade: "tr_sira(e.ekleyen)", metin: true }, olustu: { ifade: "e.olustu" },
    },
    varsayilanSira: "e.olustu DESC, e.id",
    sayfa: 20,
  };
}

type Ham = Omit<EkipmanListeSatiri, "olustu" | "kullanim"> & { olustu: Date };
/** sekmenin bir sayfası: teknik yöneticinin branş(lar)ındaki bütün ekipmanlar; sekmeyi görmeyene null */
export async function ekipmanSayfasi(db: Sorgulayici, kim: YetkiHesabi, durum: unknown): Promise<SunucuListe<EkipmanListeSatiri> | null> {
  if (!ekipmanYonetir(kim)) return null;
  const l = await listeGetir<Ham>(db, ekipmanKaynagi(), { sql: "t.brans = ANY ($1::text[])", p: [yonetilenBranslar(kim.roller)] }, durum);
  const kullanim = await ekipmanKullanimi(db, l.gorunen.map((x) => x.id));
  return { ...l, gorunen: l.gorunen.map((x) => ({ ...x, olustu: x.olustu.toISOString(), kullanim: kullanim.get(x.id) ?? null })) };
}

/** kesin sil: yalnız teknik yönetici, yalnız kendi branşının türü, yalnız hiç kullanılmamış ekipman (açık plan satırları ve kod geçmişi birlikte
    silinir, kod serbest kalır — Ekipman modülü). Rapor oluşturmayla aynı anda koşmasın diye ekipman kilitlenir (plan içindeki silme gibi). */
export async function ekipmanKesinSil(db: Sorgulayici, kim: YetkiHesabi & { ad: string }, id: string): Promise<EkipmanYazma> {
  if (!ekipmanYonetir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  const x = (await db.sorgu<{ brans: Brans }>(`SELECT t.brans FROM ${KAYNAK} WHERE e.id = $1`, [id])).rows[0];
  if (!x) return { durum: "yok" };
  if (!bransiYonetir(kim.roller, x.brans)) return { durum: "yetkisiz" };
  await ekipmanKilitle(db, id);
  const r = await ekipmanSil(db, kim.ad, id);
  if (r.durum === "kullanildi") return { durum: "red", neden: `Ekipman silinemez: ${kullanimMetni(r.kullanim) || "başka kayıtlarda"} kullanıldı.` };
  if (r.durum === "yok") return { durum: "yok" };
  return { durum: "tamam", bildirim: `${r.ad} silindi.` };
}
