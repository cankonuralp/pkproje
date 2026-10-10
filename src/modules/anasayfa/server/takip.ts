/* YAN MENÜ TAKİP BALONLARI (339; maket maket-ortak.js takipHtml + maket-veri.js MV.TAKIP — T6, reisim 2026-09-28: "cihazlarda süresi geçen cihaz
   sayısı kırmızı balon, yaklaşan sarı balon … diğer modüllerde de benzer takip"; 35. tur 163: bekleyen sarı, süresi geçen kırmızı; N9: raporlar
   "kişiye göre"). Modül başına kırmızı / sarı sayı; 0 olan balon çizilmez. Sayılar modüllerin kendi, YETKİYE DUYARLI işlevlerinden (görmediği
   modülün balonu yok; "kendi" düzeyi yalnız kendisininki). Ana sayfa gibi başka modülün tablosuna dokunmaz. Bildirim değildir (anayasa 1.3).
   337–339 incelemesi (U4 / N5 / 236): balon kişinin KENDİ işi — Planlar yalnız ekibinde olduğu planlar (planı atanan kabul eder), Onaylar yalnız
   onaylayabildiği raporlar (firma yöneticisi onaylamaz), Araçlar Araçlar modülünden (kilometre + belge; yönetici hepsi, sürücü kendi aracı).
   477 (reisim 2026-10-10, Talepler–Onaylar kararları T1 "balon da tek" · T3 "Talepler'de balon olmasın"): kişinin karar verebildiği izin talepleri
   ve masraf formları Onaylar'ın balonunda (456'nın Talepler balonu ve sayfa şeridi kalktı).
   480 (reisim 2026-10-10: "dökümanlarda 1 uyarı gözüküyor ama … bir sürü böyle eksikler var"; anayasa 0.8 hata = sınıf, 2.8 sayaç dürüst): her
   balon SEBEPLERİYLE döner (neden: sayı, ne olduğu, listelendiği sayfa) — kabuk, modülün sayfa başlığının altında "yan menüdeki sayının
   sebebi" şeridini bu listeden çizer (components/kabuk/TakipSeridi.tsx); sebebin kendi sayfası onu zaten gösteriyorsa (sayfada) orada çizilmez.
   Balon ve şerit aynı sayılardan: kırmızı = sebeplerin kırmızı toplamı, sarı = sarı toplamı (testle kilitli). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { faturaListesi } from "../../muhasebe/server/muhasebe.ts";
import { aracTakip } from "../../araclar/server/araclar.ts";
import { onayListeleri } from "../../onaylar/server/onaylar.ts";
import { anaPlanlar, isgEksikPlanlar, type IsgEksikPlan } from "../../planlar/server/anasayfa-baglanti.ts";
import { kendiYeniRaporlarim } from "../../raporlar/server/anasayfa-baglanti.ts";
import { uyariListesi } from "../../uyarilar/server/uyarilar.ts";
import { bugunTr, type Kisi } from "./anasayfa.ts";

/** balonun bir sebebi: kaç tane, ne (sayıdan sonra okunur: "2 rapor onayınızı bekliyor"), listelendiği sayfa; sayfada: o sayfa sebebi zaten gösteriyor */
export interface TakipNedeni { tur: "kirmizi" | "sari"; sayi: number; metin: string; yer: string; sayfada: boolean }
export interface TakipBalonu { kirmizi: number; sari: number; ad: { kirmizi: string; sari: string }; neden: TakipNedeni[] }
/** modül (§3.1 numarası) → balon */
export type MenuTakip = Record<number, TakipBalonu>;

const saatGecti = (iso: string | null, saat: number) => !!iso && Date.now() - Date.parse(iso) > saat * 36e5;

/** 449: Sözleşmeler balonunun planları — kişinin gördüğü açık planlardan İSG-KATİP ID'si eksik / bitmiş olanlar (balonla AYNI süzgeç;
    Sözleşmeler sayfası gösterir: "1 yazıyor ama sebebini anlayamıyorum") */
export async function isgEksikTakip(db: Sorgulayici, kim: Kisi & YetkiHesabi): Promise<IsgEksikPlan[]> {
  if (duzey(kim, 13) === "yok" || duzey(kim, 12) === "yok") return [];
  const d = duzey(kim, 13), hep = d === "gor" || d === "yaz", ben = await hesabinPersoneli(db, kim.id);
  return isgEksikPlanlar(db, (await anaPlanlar(db)).filter((p) => hep || (!!ben && p.ekip.includes(ben))));
}

export async function menuTakip(db: Sorgulayici, kim: Kisi & YetkiHesabi): Promise<MenuTakip> {
  const t: MenuTakip = {}, bugun = bugunTr();
  const gor = (m: Parameters<typeof duzey>[1]) => duzey(kim, m) !== "yok";
  const hepsi = (m: Parameters<typeof duzey>[1]) => { const d = duzey(kim, m); return d === "gor" || d === "yaz"; };
  /* balonun sayıları sebeplerden toplanır (şerit ve balon aynı sayıyı söyler) */
  const koy = (no: number, ad: TakipBalonu["ad"], ...l: TakipNedeni[][]) => {
    const neden = l.flat(), kirmizi = neden.filter((x) => x.tur === "kirmizi").reduce((n, x) => n + x.sayi, 0), sari = neden.filter((x) => x.tur === "sari").reduce((n, x) => n + x.sayi, 0);
    if (kirmizi > 0 || sari > 0) t[no] = { kirmizi, sari, ad, neden };
  };
  const ne = (tur: TakipNedeni["tur"], sayi: number, metin: string, yer: string, sayfada = false): TakipNedeni[] => (sayi > 0 ? [{ tur, sayi, metin, yer, sayfada }] : []);

  /* uyarılar ve kaynak modülleri: ölçüm cihazı kalibrasyonu (8), eğitim tekrarı (Dökümanlar 4) — Uyarılar düzeyiyle süzülü */
  const u = gor(20) ? (await uyariListesi(db, kim)) ?? [] : [];
  const say = (tur: string | null, d: "gecti" | "yakin") => u.filter((x) => (tur === null || x.tur === tur) && x.durum === d).length;
  koy(20, { kirmizi: "süresi geçen uyarı", sari: "yaklaşan uyarı" },
    ne("kirmizi", say(null, "gecti"), "uyarının süresi geçti", "/uyarilar", true), ne("sari", say(null, "yakin"), "uyarının süresi yaklaşıyor", "/uyarilar", true));
  if (gor(8)) koy(8, { kirmizi: "süresi geçen cihaz", sari: "süresi yaklaşan cihaz" },
    ne("kirmizi", say("kal", "gecti"), "cihazın kalibrasyonu geçti", "/olcum-cihazlari", true), ne("sari", say("kal", "yakin"), "cihazın kalibrasyonu yaklaşıyor", "/olcum-cihazlari", true));
  if (gor(4)) koy(4, { kirmizi: "eğitim tekrarı geçen", sari: "eğitim tekrarı yaklaşan" },
    ne("kirmizi", say("egt", "gecti"), "eğitimin tekrarı geçti", "/dokumanlar/egitimler", true), ne("sari", say("egt", "yakin"), "eğitimin tekrarı yaklaşıyor", "/dokumanlar/egitimler", true));
  /* araçlar (23): Araçlar modülünden — kilometre durumu + belgeler (karar 236) */
  const ar = gor(23) ? await aracTakip(db, kim) : null;
  if (ar) koy(23, { kirmizi: "süresi geçen araç belgesi (muayene, sigorta, kasko) ya da geçen hafta girilmeyen kilometre",
    sari: "süresi yaklaşan araç belgesi ya da bu hafta bekleyen kilometre" },
    ne("kirmizi", ar.kmEksik, "aracın geçen haftaki kilometresi girilmedi", "/araclar"), ne("kirmizi", ar.belgeGecti, "araç belgesinin (muayene, sigorta, kasko) süresi geçti", "/araclar"),
    ne("sari", ar.kmBekliyor, "aracın bu haftaki kilometresi bekliyor", "/araclar"), ne("sari", ar.belgeYakin, "araç belgesinin (muayene, sigorta, kasko) süresi yaklaşıyor", "/araclar"));

  /* planlar (13): kabul bekleyen — yalnız kişinin ekibinde olduğu planlar (planı atanan kabul eder; U4); plan günü gelmiş olan kırmızı */
  if (gor(13)) {
    const hep = hepsi(13), ben = await hesabinPersoneli(db, kim.id);
    const planlar = (await anaPlanlar(db)).filter((p) => hep || (!!ben && p.ekip.includes(ben)));
    const bek = planlar.filter((p) => p.durum === "bekliyor" && !!ben && p.ekip.includes(ben)), gec = bek.filter((p) => p.baslangic <= bugun).length;
    koy(13, { kirmizi: "plan günü gelmiş, kabul bekleyen plan", sari: "kabul bekleyen plan" },
      ne("kirmizi", gec, "planın günü geldi, kabulünüzü bekliyor", "/planlar"), ne("sari", bek.length - gec, "plan kabulünüzü bekliyor", "/planlar"));
    /* sözleşmeler (12): açık planda İSG-KATİP ID'si eksik ya da bitmiş (görebildiği planlar) — 449: hangi planlar olduğu Sözleşmeler sayfasında */
    if (gor(12)) koy(12, { kirmizi: "açık planda İSG-KATİP SÖZLEŞME ID'si eksik ya da bitmiş", sari: "" },
      ne("kirmizi", (await isgEksikPlanlar(db, planlar)).reduce((n, p) => n + p.eksik, 0), "açık planda İSG-KATİP SÖZLEŞME ID'si eksik ya da bitmiş", "/sozlesmeler", true));
  }

  /* raporlar (14, kişiye göre): kendi geri gönderilen (kırmızı) · onaya gönderilmemiş Yeni (sarı); imza bekleyen Onaylar'da */
  if (gor(14)) {
    const r = await kendiYeniRaporlarim(db, kim.id);
    koy(14, { kirmizi: "size geri gönderilen rapor", sari: "onaya gönderilmemiş raporunuz" },
      ne("kirmizi", r.geri, "raporunuz geri gönderildi", "/raporlar"), ne("sari", r.yeni, "raporunuz onaya gönderilmedi", "/raporlar"));
  }

  /* onaylar (15): imzasını bekleyen raporları + onay kuyruğundan ONAYLAYABİLDİKLERİ (branş yöneticisi; N5) + diğer belgeler + 477 karar
     verebildiği izin talepleri / masraf formları; 24 saati geçen kırmızı */
  const o = gor(15) ? await onayListeleri(db, kim) : null;
  if (o) {
    const kuyruk = o.kuyruk.filter((x) => x.izin.onayla);
    /* her bölümün 24 saati geçeni kırmızı, kalanı sarı (sebep kendi sekmesine götürür) */
    const iki = (l: readonly unknown[], gec: number, metin: string, yer: string) =>
      [...ne("kirmizi", gec, `${metin} (24 saati geçti)`, yer, true), ...ne("sari", l.length - gec, metin, yer, true)];
    koy(15, { kirmizi: "24 saati geçen imza / onay bekleyen rapor ya da talep", sari: "imzanızı ya da onayınızı bekleyen rapor / belge / talep" },
      iki(o.imzaBekleyen, o.imzaBekleyen.filter((x) => saatGecti(x.onay, 24)).length, "rapor son imzanızı bekliyor", "/onaylar/imza"),
      iki(kuyruk, kuyruk.filter((x) => saatGecti(x.gonderildi, 24)).length, "rapor onayınızı bekliyor", "/onaylar"),
      iki(o.talepler, o.talepler.filter((x) => x.eski).length, "talep (izin / masraf formu) kararınızı bekliyor", "/onaylar/talepler"),
      ne("sari", o.belgeBekleyen, "belge imzanızı bekliyor", "/onaylar/diger", true));
  }

  /* muhasebe (18): vadesi geçen fatura */
  if (hepsi(18)) koy(18, { kirmizi: "vadesi geçen fatura", sari: "" },
    ne("kirmizi", ((await faturaListesi(db, kim)) ?? []).filter((f) => f.durum === "gecikti").length, "faturanın vadesi geçti", "/muhasebe/faturalar"));
  return t;
}
