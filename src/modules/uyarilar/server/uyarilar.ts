/* UYARILAR (331; modül 20; maket uyarilar.html M10, maket-veri.js MV.uyarilar; pkproje §3 "kalibrasyon bitişine 30 gün kala uyarı", §3.1 modül 10 ve
   20; anayasa 1.3 — uyarı YALNIZ ekranda: e-posta, SMS, anlık bildirim yok; KOD-GECIS §3 "tablo yok — koşuldan türetilir; okundu yok (168)", §4
   Uyarılar: planlama, branş yöneticileri ve firma yöneticisi görür, denetçi "kendi", muhasebe —). Uyarı kayıtlardan türetilir, ayrı kayıt yok:
   koşul kalkınca (kalibrasyon yenilenince, eğitim tekrarlanınca, belge yenilenince) kendiliğinden düşer. Türler: kalibrasyon bitişi, eğitim
   tekrarı, araç belgesi (muayene, trafik sigortası, kasko). Ara kontrol cihaz kaydında henüz yok (sonra). Kimde: zimmetin son hareketi.
   387: saklama süresi 30 gün içinde dolacak imzalı raporlar (süre dolan gün başına bir uyarı) — yalnız firma yöneticisine (Firma ayarları "yaz";
   KOD-GECIS ENGEL 11); liste Firma ayarları › Saklama süresi dolacak raporlar. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { aracUyarilari } from "../../araclar/server/uyari-baglanti.ts";
import { egitimUyarilari } from "../../egitimler/server/uyari-baglanti.ts";
import { saklamaGunleri } from "../../raporlar/server/uyari-baglanti.ts";
import { cihazUyarilari } from "../../olcum-cihazlari/server/uyari-baglanti.ts";
import { personelOzetleri } from "../../personel/server/personel.ts";
import { kimdeHaritasi } from "../../zimmetler/server/zimmet.ts";
import { uyariGorunur, type UyariTuru } from "../sema.ts";

const MODUL = 20, FIRMA_AYARLARI = 22;
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
export const bugunTr = () => GUN.format(new Date());
export interface Uyari {
  id: string; tur: UyariTuru; konu: string; alt: string; kisi: { id: string; ad: string } | null;
  /** bitiş / tekrar günü; kalibrasyonu hiç olmayan cihazda null (329–332 incelemesi: uydurma "bugün" gösterilmez) */
  tarih: string | null; durum: "gecti" | "yakin"; href: string; sonuc: string;
  /** kalibrasyon uyarısında cihazın türü (branş yöneticisinin ana sayfası branşa göre süzer) */
  cihazTur?: string;
}

/** uyarılar (en yakın tarih üstte); denetçi yalnız kendisininkileri (kimde / kişi kendisi); göremeyene null */
export async function uyariListesi(db: Sorgulayici, kim: YetkiHesabi): Promise<Uyari[] | null> {
  const d = duzey(kim, MODUL);
  if (d === "yok") return null;
  /* yalnız "gör" ve "değiştir" hepsini görür; "kendi" ve kapsamı tanımsız düzey ("branşı" — uyarının branşı yok) kısıtlı yönde: yalnız
     kendisininkiler (329–332 incelemesi: "branşı" bütün firmayı açıyordu) */
  const ben = d === "gor" || d === "yaz" ? null : (await hesabinPersoneli(db, kim.id)) ?? "";
  const bugun = bugunTr();
  const [c, e, a, kimde] = [await cihazUyarilari(db, bugun), await egitimUyarilari(db, bugun), await aracUyarilari(db, bugun), await kimdeHaritasi(db)];
  const sak = duzey(kim, FIRMA_AYARLARI) === "yaz" ? await saklamaGunleri(db) : [];
  const kisiIdleri = [...new Set([...c.l.map((x) => kimde.cihaz.get(x.id)), ...a.l.map((x) => kimde.arac.get(x.id)), ...e.l.map((x) => x.personelId)].filter((x): x is string => !!x))];
  const ozet = await personelOzetleri(db, kisiIdleri);
  const ad = new Map(ozet.map((p) => [p.id, p.ad]));
  /* ayrılan personelin eğitim tekrarı uyarı değildir (ona yeni kayıt girilemez, uyarı hiç düşmezdi — 329–332 incelemesi) */
  const ayrilan = new Set(ozet.filter((p) => !p.etkin).map((p) => p.id));
  const kisi = (id: string | null | undefined) => (id ? { id, ad: ad.get(id) ?? "—" } : null);
  const l: Uyari[] = [
    ...c.l.map((x): Uyari => {
      const k = kisi(kimde.cihaz.get(x.id));
      const gonderemez = k ? `${k.ad} raporlarını onaya gönderemez` : "depoda";
      return { id: `k-${x.id}`, tur: "kal", konu: `${x.kod} · ${x.tur}`, alt: "Kalibrasyon", kisi: k, tarih: x.bitis, durum: x.durum, href: `/olcum-cihazlari/${x.id}`, cihazTur: x.turId,
        sonuc: !x.bitis ? `geçerli kalibrasyon yok${k ? ` · ${gonderemez}` : ""}` : x.durum === "gecti" ? gonderemez : `${c.esik} gün içinde bitiyor` };
    }),
    ...e.l.filter((x) => !ayrilan.has(x.personelId)).map((x): Uyari => ({ id: `e-${x.id}`, tur: "egt", konu: x.tur, alt: "Eğitim tekrarı", kisi: kisi(x.personelId),
      tarih: x.tekrar, durum: x.durum, href: `/dokumanlar/egitimler?kisi=${x.personelId}`, sonuc: x.durum === "gecti" ? "tekrar gerekli" : `${e.esik} gün içinde` })),
    ...a.l.map((x): Uyari => ({ id: `v-${x.id}-${x.belge}`, tur: "arac", konu: `${x.plaka} · ${x.ad}`, alt: x.belge, kisi: kisi(kimde.arac.get(x.id)), tarih: x.tarih,
      durum: x.durum, href: `/araclar/${x.id}`, sonuc: x.durum === "gecti" ? "süresi geçti" : `${a.esik} gün içinde bitiyor` })),
    ...sak.map((x): Uyari => ({ id: `s-${x.gun}`, tur: "sak", konu: `${x.adet} raporun PDF'i`, alt: "Saklama süresi", kisi: null, tarih: x.gun,
      durum: x.gecti ? "gecti" : "yakin", href: "/firma-ayarlari/saklama", sonuc: x.gecti ? "ilk gece işinde silinecek" : "süre dolunca silinecek" })),
  ];
  /* tarihsiz (kalibrasyonu hiç olmayan) en üstte */
  return l.filter((u) => uyariGorunur(ben, u.kisi?.id)).sort((x, y) => (x.tarih ?? "").localeCompare(y.tarih ?? "") || x.konu.localeCompare(y.konu, "tr"));
}
