/* PLANLAR LİSTESİ — SUNUCUDA SAYFALI (566; 09-B3; reisim 2026-10-15 analizi: Planlar listesi bütün planları, bütün ekip satırlarını ve bütün
   plan-ekipman satırlarını okuyup tarayıcıda süzüyordu). Ekran ve anlam aynı (ui/PlanListesi.tsx tanımı): alan aramaları proje adı · proje no;
   seçiciler Durum · Tarih · Müşteri · Branş; sıralama sütun başlığından (no, ad, müşteri, adres, denetçi, başlangıç, durum) ya da seçiciden;
   varsayılan en yeni tarih üstte, aynı günde en son açılan üstte; 20'şer. Görme canDo ile aynı (gorusKosulu: atandığı plan — ekibindeki
   personelin hesabı). Başka modülün tablosu o modülün okuma parçasıyla (TESIS_YER_SQL, PERSONEL_AD_SQL, EKIPMAN_SQL, TUR_SQL, HESAP_PERSONEL_SQL).
   Sınır: metindeki sayıların sırası harf harf (localeCompare "numeric" değil) — proje no sabit genişlikte olduğu için yalnız adlardaki sayıda
   fark eder ("Fabrika 10" < "Fabrika 2"). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { listeGetir, type ListeKaynagi } from "../../../server/liste/liste.ts";
import { duzey, gorusKosulu, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { HESAP_PERSONEL_SQL } from "../../../server/kimlik/hesap.ts";
import type { SunucuListe } from "../../../components/liste/suzgec.ts";
import { EKIPMAN_SQL } from "../../ekipman/server/ekipman.ts";
import { TUR_SQL } from "../../ekipman-turleri/server/turler.ts";
import { TESIS_YER_SQL } from "../../musteriler/server/musteriler.ts";
import { PERSONEL_AD_SQL } from "../../personel/server/personel.ts";
import type { PlanSatir } from "./plan-ici.ts";
import { bugunTr, MODUL } from "./planlar.ts";

const gunEkle = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
/** planın ekibindeki adlar, Türkçe sırayla ("|" ile) */
const EKIP = `(SELECT string_agg(pa.ad, '|' ORDER BY tr_sira(pa.ad) COLLATE "C") FROM plan_ekip pe JOIN ${PERSONEL_AD_SQL} pa ON pa.firma_id = pe.firma_id AND pa.id = pe.personel_id
  WHERE pe.firma_id = p.firma_id AND pe.plan_id = p.id)`;
const BRANS = (b: "m" | "e") => `EXISTS (SELECT 1 FROM plan_ekipman x JOIN ${EKIPMAN_SQL} e ON e.firma_id = x.firma_id AND e.id = x.ekipman_id
  JOIN ${TUR_SQL} t ON t.firma_id = e.firma_id AND t.id = e.tur_id WHERE x.firma_id = p.firma_id AND x.plan_id = p.id AND t.brans = '${b}')`;

export function planKaynagi(bugun: string): ListeKaynagi {
  const gun = new Date(`${bugun}T00:00:00Z`).getUTCDay(), pzt = gunEkle(bugun, -((gun + 6) % 7)), paz = gunEkle(pzt, 6), yedi = gunEkle(bugun, 7);
  return {
    kaynak: `plan p JOIN ${TESIS_YER_SQL} y ON y.firma_id = p.firma_id AND y.id = p.tesis_id`,
    secim: `p.id::text AS id, p.no, p.durum, y.tesis AS ad, y.unvan AS musteri, y.adres, y.il, y.ilce, ${EKIP} AS ekip, p.baslangic::text AS baslangic,
      p.bitis::text AS bitis, p.olustu, ${BRANS("m")} AS mekanik, ${BRANS("e")} AS elektrik`,
    metin: ["p.no", "y.tesis", "y.unvan", "y.adres", "y.ilce", "y.il"],
    alanlar: { ad: "y.tesis", no: "p.no" },
    cipler: {},
    seciciler: {
      durum: { kosul: (v, ekle) => `p.durum = ${ekle(v)}` },
      tarih: { kosul: (v, ekle) => (v === "bugun" ? `p.baslangic <= ${ekle(bugun)}::date AND p.bitis >= ${ekle(bugun)}::date`
        : v === "hafta" ? `p.baslangic <= ${ekle(paz)}::date AND p.bitis >= ${ekle(pzt)}::date`
        : v === "yedi" ? `p.baslangic <= ${ekle(yedi)}::date AND p.bitis >= ${ekle(bugun)}::date` : "false") },
      musteri: { kosul: (v, ekle) => `y.unvan = ${ekle(v)}`, secenek: { deger: "y.unvan", etiket: "y.unvan" } },
      brans: { kosul: (v) => (v === "m" ? BRANS("m") : v === "e" ? BRANS("e") : "false") },
      sira: { kosul: () => null },
    },
    siraSecici: "sira",
    sira: {
      no: { ifade: "tr_sira(p.no)", metin: true }, ad: { ifade: "tr_sira(y.tesis)", metin: true }, musteri: { ifade: "tr_sira(y.unvan)", metin: true },
      adres: { ifade: "tr_sira(concat_ws(' ', coalesce(y.il, ''), coalesce(y.ilce, ''), coalesce(y.adres, '')))", metin: true },
      ekip: { ifade: `tr_sira(coalesce(split_part(${EKIP}, '|', 1), ''))`, metin: true },
      baslangic: { ifade: "p.baslangic" },
      durum: { ifade: "CASE p.durum WHEN 'bekliyor' THEN 1 WHEN 'kabul' THEN 2 WHEN 'denetimde' THEN 3 WHEN 'tamamlandi' THEN 4 ELSE 5 END" },
    },
    varsayilanSira: "p.baslangic DESC, p.olustu DESC, p.id",
    sayfa: 20,
  };
}

type Ham = Omit<PlanSatir, "ekip" | "olustu"> & { ekip: string | null; olustu: Date };
/** Planlar ekranı: görebildiği planlardan süzgeçten geçenlerin SAYFASI + sayılar; göremeyene null */
export async function planSayfasi(db: Sorgulayici, kim: YetkiHesabi, durum: unknown, bugun = bugunTr()): Promise<SunucuListe<PlanSatir> | null> {
  if (duzey(kim, MODUL) === "yok") return null;
  const p: unknown[] = [];
  const g = gorusKosulu(kim, MODUL, {
    atanan: (ben) => `EXISTS (SELECT 1 FROM plan_ekip pe JOIN ${HESAP_PERSONEL_SQL} h ON h.firma_id = pe.firma_id AND h.personel_id = pe.personel_id
      WHERE pe.firma_id = p.firma_id AND pe.plan_id = p.id AND h.id = ${ben})`,
  }, (x) => { p.push(x); return `$${p.length}`; });
  const l = await listeGetir<Ham>(db, planKaynagi(bugun), { sql: g, p }, durum);
  return { ...l, gorunen: l.gorunen.map((x) => ({ ...x, ekip: x.ekip ? x.ekip.split("|") : [], olustu: x.olustu.toISOString() })) };
}
