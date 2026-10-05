/* UYARILAR (331; modül 20; maket uyarilar.html M10, maket-veri.js MV.uyarilar; pkproje §3 "kalibrasyon bitişine 30 gün kala uyarı", §3.1 modül 10 ve
   20; anayasa 1.3 — uyarı YALNIZ ekranda: e-posta, SMS, anlık bildirim yok; KOD-GECIS §3 "tablo yok — koşuldan türetilir; okundu yok (168)", §4
   Uyarılar: planlama, branş yöneticileri ve firma yöneticisi görür, denetçi "kendi", muhasebe —). Uyarı kayıtlardan türetilir, ayrı kayıt yok:
   koşul kalkınca (kalibrasyon yenilenince, eğitim tekrarlanınca, belge yenilenince) kendiliğinden düşer. Türler: kalibrasyon bitişi, eğitim
   tekrarı, araç belgesi (muayene, trafik sigortası, kasko). Ara kontrol cihaz kaydında henüz yok (sonra). Kimde: zimmetin son hareketi. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { aracUyarilari } from "../../araclar/server/uyari-baglanti.ts";
import { egitimUyarilari } from "../../egitimler/server/uyari-baglanti.ts";
import { cihazUyarilari } from "../../olcum-cihazlari/server/uyari-baglanti.ts";
import { personelOzetleri } from "../../personel/server/personel.ts";
import { kimdeHaritasi } from "../../zimmetler/server/zimmet.ts";
import { uyariGorunur, type UyariTuru } from "../sema.ts";

const MODUL = 20;
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
export const bugunTr = () => GUN.format(new Date());
export interface Uyari {
  id: string; tur: UyariTuru; konu: string; alt: string; kisi: { id: string; ad: string } | null; tarih: string; durum: "gecti" | "yakin"; href: string; sonuc: string;
}

/** uyarılar (en yakın tarih üstte); denetçi yalnız kendisininkileri (kimde / kişi kendisi); göremeyene null */
export async function uyariListesi(db: Sorgulayici, kim: YetkiHesabi): Promise<Uyari[] | null> {
  const d = duzey(kim, MODUL);
  if (d === "yok") return null;
  const ben = d === "kendi" ? (await hesabinPersoneli(db, kim.id)) ?? "" : null;
  const bugun = bugunTr();
  const [c, e, a, kimde] = [await cihazUyarilari(db, bugun), await egitimUyarilari(db, bugun), await aracUyarilari(db, bugun), await kimdeHaritasi(db)];
  const kisiIdleri = [...new Set([...c.l.map((x) => kimde.cihaz.get(x.id)), ...a.l.map((x) => kimde.arac.get(x.id)), ...e.l.map((x) => x.personelId)].filter((x): x is string => !!x))];
  const ad = new Map((await personelOzetleri(db, kisiIdleri)).map((p) => [p.id, p.ad]));
  const kisi = (id: string | null | undefined) => (id ? { id, ad: ad.get(id) ?? "—" } : null);
  const l: Uyari[] = [
    ...c.l.map((x): Uyari => {
      const k = kisi(kimde.cihaz.get(x.id));
      return { id: `k-${x.id}`, tur: "kal", konu: `${x.kod} · ${x.tur}`, alt: "Kalibrasyon", kisi: k, tarih: x.bitis ?? bugun, durum: x.durum, href: `/olcum-cihazlari/${x.id}`,
        sonuc: x.durum === "gecti" ? (k ? `${k.ad} raporlarını onaya gönderemez` : x.bitis ? "depoda" : "geçerli kalibrasyon yok") : `${c.esik} gün içinde bitiyor` };
    }),
    ...e.l.map((x): Uyari => ({ id: `e-${x.id}`, tur: "egt", konu: x.tur, alt: "Eğitim tekrarı", kisi: kisi(x.personelId), tarih: x.tekrar, durum: x.durum,
      href: "/dokumanlar/egitimler", sonuc: x.durum === "gecti" ? "tekrar gerekli" : `${e.esik} gün içinde` })),
    ...a.l.map((x): Uyari => ({ id: `v-${x.id}-${x.belge}`, tur: "arac", konu: `${x.plaka} · ${x.ad}`, alt: x.belge, kisi: kisi(kimde.arac.get(x.id)), tarih: x.tarih,
      durum: x.durum, href: `/araclar/${x.id}`, sonuc: x.durum === "gecti" ? "süresi geçti" : `${a.esik} gün içinde bitiyor` })),
  ];
  return l.filter((u) => uyariGorunur(ben, u.kisi?.id)).sort((x, y) => x.tarih.localeCompare(y.tarih) || x.konu.localeCompare(y.konu, "tr"));
}
