/* ANA SAYFA (332; maket anasayfa.html M1 2. tur — reisim 41: "role göre ama herkes için bir anasayfa olmalı"). Girişten sonra herkes buraya gelir;
   içerik kişinin ROLLERİNE göre: her rolün bölümü (o günün işleri — tıklanır bilgi yüzleri — ve bir iş listesi), birden çok rolü olan alt alta.
   Sayılar modüllerin kendi, yetkiye duyarlı işlevlerinden ve okuyucularından (ana sayfa başka modülün tablosuna dokunmaz). Bildirim yok, hitap yok
   (anayasa 1.3, 0.11). Muhasebe rolüne maketteki dört rolün dışında kısa bir bölüm (faturaya hazır iş, vadesi geçen fatura, onay bekleyen masraf).
   Duyurular (İSGGM, İSGÜM, iş ekipmanları portalı; 379): okunan duyurular (src/server/duyuru — firma verisi değil) + kaynak bağlantıları. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { duyuruBolumu, type DuyuruBolumu } from "../../../server/duyuru/okuma.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { ROL_BRANS, type Rol } from "../../../server/yetki/tanim.ts";
import { etkinEkipmanlar } from "../../ekipman/server/anasayfa-baglanti.ts";
import { cihazTurBranslari, turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import { giderListesi } from "../../muhasebe/server/giderler.ts";
import { faturaListesi, isListesi } from "../../muhasebe/server/muhasebe.ts";
import { bekleyenBelgeSayisi } from "../../onaylar/server/belge-baglanti.ts";
import { onayListeleri } from "../../onaylar/server/onaylar.ts";
import { eksikBilgi, personelListesi, personelOzetleri } from "../../personel/server/personel.ts";
import { acikMi, anaPlanlar, isgEksikSayisi, type AnaPlan } from "../../planlar/server/anasayfa-baglanti.ts";
import { planAcabilir } from "../../planlar/server/planlar.ts";
import { geriGonderdiklerim, sonrakiKontroller } from "../../raporlar/server/anasayfa-baglanti.ts";
import { mesaiDurumu } from "../../raporlar/server/plan-baglanti.ts";
import { raporListesi } from "../../raporlar/server/raporlar.ts";
import { uyariListesi } from "../../uyarilar/server/uyarilar.ts";
import { kisininVarliklari } from "../../zimmetler/server/zimmet.ts";
import type { PlanDurumu } from "../../planlar/sema.ts";

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
export const bugunTr = () => GUN.format(new Date());
const ayEkle = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };
const gunFarki = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);
const saatlerdir = (iso: string) => { const h = (Date.now() - Date.parse(iso)) / 36e5; return h < 24 ? `${Math.max(1, Math.round(h))} saattir` : `${Math.round(h / 24)} gündür`; };
const gunKisa = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
export interface Kisi extends YetkiHesabi { ad: string }

export interface AnaYuz { ikon: string; ad: string; sayi: string | number; href: string; not?: string; uyari?: boolean }
export interface AnaPlanSatiri { id: string; no: string; musteri: string; tesis: string; baslangic: string; ekip: string; durum: PlanDurumu }
export interface AnaKuyrukSatiri { id: string; no: string; ekipman: string; gonderildi: string | null; bekleme: string; denetci: string }
export interface AnaTesisSatiri { id: string; musteri: string; tesis: string; il: string | null; sonraki: string; kalan: number; ekipman: number }
export type AnaListe =
  | { tur: "plan"; baslik: string; kayitlar: AnaPlanSatiri[]; bos: string; tumu: [ad: string, href: string] }
  | { tur: "kuyruk"; baslik: string; kayitlar: AnaKuyrukSatiri[]; bos: string; tumu: [ad: string, href: string] }
  | { tur: "tesis"; baslik: string; kayitlar: AnaTesisSatiri[]; bos: string; tumu: [ad: string, href: string]; planAc: boolean };
export interface AnaBolum { rol: Rol; yuzler: AnaYuz[]; liste: AnaListe | null }
/** belgeBekleyen (333): kişinin imzasını bekleyen diğer belgeler (bordro …) — Onaylar'ı görmeyen de buradan ulaşır */
/** duyuru (379): okunan Bakanlık duyuruları, son okuma, "alınamadı", tazele (sayfa okumayı arka planda başlatır) */
export interface AnaSayfa { bugun: string; ad: string; planAc: boolean; bolumler: AnaBolum[]; belgeBekleyen: number; duyuru: DuyuruBolumu }

export async function anaSayfa(db: Sorgulayici, kim: Kisi): Promise<AnaSayfa> {
  const bugun = bugunTr(), roller = new Set(kim.roller);
  const gor = (m: Parameters<typeof duzey>[1]) => duzey(kim, m) !== "yok";
  /* modülün HEPSİNİ gören düzey ("gör" / "değiştir"); "kendi" ve "branşı" kısıtlı (329–332 incelemesi: bölümler rolle açılıyor, veri düzeyle süzülür) */
  const hepsi = (m: Parameters<typeof duzey>[1]) => { const d = duzey(kim, m); return d === "gor" || d === "yaz"; };
  const benP = await hesabinPersoneli(db, kim.id);
  /* ortak veri bir kez: planlar Planlar düzeyiyle — "kendi" ve "branşı" yalnız ekibinde olduğu planlar */
  const planlar = !gor(13) ? [] : (await anaPlanlar(db)).filter((p) => hepsi(13) || (!!benP && p.ekip.includes(benP)));
  const musteriler = await musteriOzetleri(db);
  const tesis = new Map(musteriler.flatMap((m) => m.tesisler.map((t) => [t.id, { ad: t.ad, il: t.il, musteri: m.kisa }] as const)));
  const ekipAd = new Map((await personelOzetleri(db, [...new Set(planlar.flatMap((p) => p.ekip))])).map((p) => [p.id, p.ad]));
  const planSatiri = (p: AnaPlan): AnaPlanSatiri => ({ id: p.id, no: p.no, musteri: tesis.get(p.tesisId)?.musteri ?? "—", tesis: tesis.get(p.tesisId)?.ad ?? "—",
    baslangic: p.baslangic, ekip: p.ekip.map((k) => ekipAd.get(k) ?? "—").join(", "), durum: p.durum });
  const uyarilar = gor(20) ? (await uyariListesi(db, kim)) ?? [] : [];
  const cihazBrans = kim.roller.some((r) => r === "mekanik_yonetici" || r === "elektrik_yonetici") ? await cihazTurBranslari(db) : new Map<string, ("m" | "e")[]>();
  const bolumler: AnaBolum[] = [];

  if (roller.has("planlama")) {
    /* reddedilen: tesisin güncel planıysa (sonra yeni plan açılınca düşer — maket t.pdurum; 329–332 incelemesi) */
    const acik = planlar.filter(acikMi), bek = planlar.filter((p) => p.durum === "bekliyor"), red = planlar.filter((p) => p.durum === "reddedildi" && !p.yenisi);
    const bugunku = acik.filter((p) => p.baslangic === bugun), isg = await isgEksikSayisi(db, planlar);
    /* kontrolü yaklaşan tesisler: etkin ekipmanın sonraki kontrolü (son imzalı muayeneden; yoksa sistem öncesi kontrol + periyot) en yakını,
       açık planı olmayan tesislerde, eşik içinde (firma ayarı) */
    const esik = (await ayarOku(db, "uyari_esikleri")).deger.kontrolu_yaklasan_tesis;
    const periyot = new Map((await turOzetleri(db)).map((t) => [t.id, t.periyot]));
    const sonraki = await sonrakiKontroller(db), planli = new Set(acik.map((p) => p.tesisId));
    const t = new Map<string, { sonraki: string; ekipman: number }>();
    /* tesis listesi müşteri ve ekipman bilgisi taşır: Müşteriler ve Ekipman'ı hepsini gören düzeyde (329–332 incelemesi) */
    const tesisGor = hepsi(3) && hepsi(7);
    for (const e of tesisGor ? await etkinEkipmanlar(db) : []) {
      const s = sonraki.get(e.id) ?? (e.disKontrol && periyot.has(e.turId) ? ayEkle(e.disKontrol, periyot.get(e.turId)!) : null);
      const x = t.get(e.tesisId) ?? { sonraki: "9999-12-31", ekipman: 0 };
      x.ekipman++; if (s && s < x.sonraki) x.sonraki = s;
      t.set(e.tesisId, x);
    }
    const yaklasan = [...t.entries()].filter(([id, x]) => !planli.has(id) && x.sonraki !== "9999-12-31" && gunFarki(bugun, x.sonraki) <= esik && tesis.has(id))
      .map(([id, x]): AnaTesisSatiri => ({ id, musteri: tesis.get(id)!.musteri, tesis: tesis.get(id)!.ad, il: tesis.get(id)!.il, sonraki: x.sonraki, kalan: gunFarki(bugun, x.sonraki),
        ekipman: x.ekipman })).sort((a, b) => a.sonraki.localeCompare(b.sonraki) || a.musteri.localeCompare(b.musteri, "tr"));
    bolumler.push({ rol: "planlama", yuzler: [
      { ikon: "calendar-check", ad: "Kabul bekleyen plan", sayi: bek.length, href: "/planlar" },
      { ikon: "circle-x", ad: "Reddedilen plan", sayi: red.length, href: "/planlar", uyari: red.length > 0 },
      { ikon: "clock", ad: "Bugün başlayan plan", sayi: bugunku.length, href: "/planlar" },
      { ikon: "scroll-text", ad: "İSG-KATİP eksiği", sayi: isg, href: "/sozlesmeler", not: isg ? "açık planlarda" : "yok", uyari: isg > 0 },
    ], liste: !tesisGor ? null : { tur: "tesis", baslik: `Kontrolü ${esik} gün içinde gelen tesisler`, kayitlar: yaklasan, bos: "Kontrolü yaklaşan tesis yok.",
      tumu: ["Müşteriler", "/musteriler"], planAc: planAcabilir(kim) } });
  }

  if (roller.has("denetci")) {
    const ben = benP;
    const benim = planlar.filter((p) => !!ben && p.ekip.includes(ben) && acikMi(p));
    const bek = benim.filter((p) => p.durum === "bekliyor"), den = benim.filter((p) => p.durum === "denetimde");
    const rap = ((await raporListesi(db, kim)) ?? []).filter((r) => r.benim);
    const taslak = rap.filter((r) => r.durum === "taslak"), geri = taslak.filter((r) => r.geri), imza = rap.filter((r) => r.durum === "onaylandi");
    const zimmet = ben ? await kisininVarliklari(db, ben) : [];
    const kal = uyarilar.filter((u) => u.tur === "kal" && u.kisi?.id === ben).length;
    /* N6 (maket: mesai takibi açıksa; karar 182 "her denetçininki kendisi için"): bugünkü süre — normal ve mesai (329–332 incelemesi) */
    const m = ben ? await mesaiDurumu(db, ben, bugun) : null;
    const sure: AnaYuz[] = m?.acik ? [{ ikon: "clock", ad: "Günlük süre", sayi: `${m.toplam} dk`, href: "/planlar",
      not: `normal ${Math.min(m.toplam, m.normal)} / ${m.normal} · mesai ${Math.max(0, m.toplam - m.normal)} / ${m.hak}${m.dolu ? " · doldu" : ""}`, uyari: m.dolu }] : [];
    bolumler.push({ rol: "denetci", yuzler: [
      { ikon: "calendar-check", ad: "Kabul bekleyen plan", sayi: bek.length, href: "/planlar", not: bek.length ? `en yakını ${gunKisa(bek[0].baslangic)}` : "yok", uyari: bek.length > 0 },
      { ikon: "play", ad: "Denetimdeki plan", sayi: den.length, href: "/planlar", not: den.length ? den[0].no : "yok" },
      { ikon: "file-pen-line", ad: "Taslak rapor", sayi: taslak.length, href: "/raporlar", not: geri.length ? `${geri.length} geri gönderildi` : "onaya gönderilmedi", uyari: geri.length > 0 },
      { ikon: "file-signature", ad: "Son imzanı bekleyen", sayi: imza.length, href: "/onaylar/imza", not: "onaylandı, imza bekliyor", uyari: imza.length > 0 },
      ...sure,
      { ikon: "package", ad: "Zimmetinde", sayi: zimmet.length, href: "/zimmetler", not: kal ? `${kal} cihazın kalibrasyonu uyarıda` : "uyarı yok", uyari: kal > 0 },
    ], liste: { tur: "plan", baslik: "Açık planların", kayitlar: benim.map(planSatiri), bos: "Açık planın yok.", tumu: ["Planlar", "/planlar"] } });
  }

  for (const r of ["mekanik_yonetici", "elektrik_yonetici"] as const) {
    if (!roller.has(r)) continue;
    const b = ROL_BRANS[r]!, o = await onayListeleri(db, kim);
    const kuyruk = (o?.kuyruk ?? []).filter((x) => x.brans === b).sort((x, y) => (x.gonderildi ?? "").localeCompare(y.gonderildi ?? ""));
    const tumu = (o?.tumu ?? []).filter((x) => x.brans === b);
    const imza = tumu.filter((x) => x.durum === "onaylandi");
    /* maket: "Geri gönderdiğin" — yöneticinin kendi geri gönderdiği, düzeltme bekleyen raporlar; kalibrasyon uyarısı branşın cihazları (cihaz türünü
       kullanan ekipman türlerinin branşı; hiçbir türde kullanılmayan iki branşta da) — 329–332 incelemesi */
    const geri = await geriGonderdiklerim(db, kim.id);
    const kal = uyarilar.filter((u) => u.tur === "kal" && (cihazBrans.get(u.cihazTur ?? "") ?? ["m", "e"]).includes(b)).length;
    const ad = b === "m" ? "Mekanik" : "Elektrik";
    bolumler.push({ rol: r, yuzler: [
      { ikon: "badge-check", ad: "Onayını bekleyen", sayi: kuyruk.length, href: "/onaylar", not: kuyruk.length && kuyruk[0].gonderildi ? `en eskisi ${saatlerdir(kuyruk[0].gonderildi)}` : "yok",
        uyari: kuyruk.length > 0 },
      { ikon: "undo-2", ad: "Geri gönderdiğin", sayi: geri, href: "/raporlar", not: "düzeltme bekliyor" },
      { ikon: "file-signature", ad: "Muayene uzmanı imzası", sayi: imza.length, href: "/onaylar", not: `${ad} raporları` },
      { ikon: "gauge", ad: "Kalibrasyon uyarısı", sayi: kal, href: "/uyarilar?tur=kalibrasyon", not: `${ad} cihazları`, uyari: kal > 0 },
    ], liste: { tur: "kuyruk", baslik: "Onay kuyruğu", kayitlar: kuyruk.slice(0, 5).map((x) => ({ id: x.id, no: x.no, ekipman: `${x.ekipmanKod} · ${x.turAd}`, gonderildi: x.gonderildi,
      bekleme: x.gonderildi ? `${saatlerdir(x.gonderildi)} bekliyor` : "", denetci: x.denetci })), bos: "Onay bekleyen rapor yok.", tumu: ["Onaylar", "/onaylar"] } });
  }

  if (roller.has("firma_yoneticisi")) {
    const acik = planlar.filter(acikMi), bugunku = acik.filter((p) => p.baslangic === bugun);
    const o = await onayListeleri(db, kim), tumu = o?.tumu ?? [];
    const kal = uyarilar.filter((u) => u.tur === "kal").length, egt = uyarilar.filter((u) => u.tur === "egt").length, arac = uyarilar.filter((u) => u.tur === "arac").length;
    const sak = uyarilar.filter((u) => u.tur === "sak").length;
    const eksik = ((await personelListesi(db, kim)) ?? []).filter((p) => p.durum === "etkin" && eksikBilgi(p).length);
    bolumler.push({ rol: "firma_yoneticisi", yuzler: [
      { ikon: "calendar-check", ad: "Açık plan", sayi: acik.length, href: "/planlar" },
      { ikon: "badge-check", ad: "Onayda rapor", sayi: tumu.filter((x) => x.durum === "onayda").length, href: "/onaylar" },
      { ikon: "file-signature", ad: "Muayene uzmanı imzası", sayi: tumu.filter((x) => x.durum === "onaylandi").length, href: "/raporlar", not: "imza bekliyor" },
      { ikon: "alarm-clock", ad: "Uyarı", sayi: uyarilar.length, href: "/uyarilar", not: `${kal} kalibrasyon · ${egt} eğitim tekrarı · ${arac} araç belgesi${sak ? ` · ${sak} saklama süresi` : ""}`, uyari: uyarilar.length > 0 },
      { ikon: "users", ad: "Bilgisi eksik personel", sayi: eksik.length, href: "/personel", not: eksik.length ? eksik.map((p) => p.ad).join(", ") : "yok", uyari: eksik.length > 0 },
    ], liste: { tur: "plan", baslik: "Bugün başlayan planlar", kayitlar: bugunku.map(planSatiri), bos: "Bugün başlayan plan yok.", tumu: ["Planlar", "/planlar"] } });
  }

  if (roller.has("muhasebe")) {
    const isler = (await isListesi(db, kim)) ?? [], faturalar = (await faturaListesi(db, kim)) ?? [], giderler = (await giderListesi(db, kim)) ?? [];
    const hazir = isler.filter((x) => x.durum === "hazir"), gec = faturalar.filter((f) => f.durum === "gecikti"), bek = giderler.filter((g) => g.durum === "bekliyor");
    const tl = (k: number) => `${Math.round(k / 100).toLocaleString("tr-TR")} TL`;
    bolumler.push({ rol: "muhasebe", yuzler: [
      { ikon: "file-check", ad: "Faturaya hazır iş", sayi: hazir.length, href: "/muhasebe", not: hazir.length ? hazir.slice(0, 3).map((x) => x.no).join(", ") : "yok", uyari: hazir.length > 0 },
      { ikon: "clock", ad: "Vadesi geçen fatura", sayi: gec.length, href: "/muhasebe/faturalar?durum=gecikti", not: gec.length ? tl(gec.reduce((n, f) => n + f.kalan, 0)) : "yok", uyari: gec.length > 0 },
      /* 477 (T1): masraf formunun kararı Onaylar'da */
      { ikon: "receipt", ad: "Onay bekleyen masraf", sayi: bek.length, href: "/onaylar/talepler", not: bek.length ? tl(bek.reduce((n, g) => n + g.tutar, 0)) : "yok", uyari: bek.length > 0 },
    ], liste: null });
  }
  return { bugun, ad: kim.ad, planAc: planAcabilir(kim), bolumler, belgeBekleyen: await bekleyenBelgeSayisi(db, kim), duyuru: await duyuruBolumu(db) };
}
