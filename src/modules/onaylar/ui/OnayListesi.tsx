"use client";
/* ONAYLAR LİSTELERİ (maket onaylar.html #/ kuyruk, #/tum — 190): Onay kuyruğu (branşın onaydaki raporları, en yeni üstte; çipler Kusurlu ve
   24 saatten eski, seçiciler Denetçi ve Tesis; sütunlar Rapor no · Ekipman · Denetçi · Gönderildi · Sonuç) ve Tüm raporlar (branşın bütün
   raporları; rapor no ve tesis ayrı aranır, seçiciler Durum ve Denetçi). Satır onay ekranını açar. Bekleme sunucuda hesaplanır (az önce /
   N saattir / N gündür). Yetki sunucuda: liste yalnız görülebilen raporları taşır. 318: İmzamı bekleyen raporlar (C5) ve Revize istekleri.
   596: İmzamı bekleyen raporlarda seçip birlikte imzalama, Onay kuyruğunda seçip birlikte onaylama (TopluImza.tsx). 2026-10-17 (göç 0102):
   teknik yönetici imzası açıkken kuyrukta seçip birlikte İMZALAYIP onaylama (TopluImzaPenceresi kip teknik), hazırlananlar "İmzaya hazır". */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { useBildir, useUyar } from "../../../components/bildirim/Bildirim";
import { useOnayla } from "../../../components/pencere/Onay";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import { useSunucuSuzgec } from "../../../components/liste/SunucuSuzgec";
import type { Secenek, SunucuListe, SuzgecTanimi } from "../../../components/liste/suzgec";
import { TABLO_SAYFA } from "../../../components/liste/sayfa";
import { AltSatir, Rozet, SayfaBasi, Sekmeler, SeritKap, type RozetTuru } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { RAPOR_DURUM, type RaporDurumu } from "../../raporlar/sema";
import type { OnayListeleri, OnaySatiri, RevizeIstekSatiri } from "../server/onaylar";
import { RevizePenceresi, type RevizeTuru } from "./RevizePenceresi";
import { onayIndirmeEylemi, onaylaEylemi, tumRaporlarEylemi } from "./eylemler";
import { SecimCubugu, SecimKutusu, TOPLU_EN_COK, TopluImzaPenceresi, useSecim, type Secim } from "./TopluImza";
import { SignTopluTus } from "../../raporlar/ui/SignImza";
import { useTopluIndir } from "../../raporlar/ui/topluIs";
import stil from "./onaylar.module.css";

const TR_ZAMAN = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const zamanYaz = (z: string) => TR_ZAMAN.format(new Date(z)).replace(",", "");
export const SONUC_ROZET: Record<string, readonly [string, RozetTuru]> = { uygun: ["Uygun", "tamam"], uygun_degil: ["Uygun değil", "red"], sartli: ["Şartlı uygun", "bekliyor"] };
const SIRA_AD: Record<string, string> = { no: "Rapor no", durum: "Durum", denetci: "Muayene uzmanı", ekipman: "Ekipman", tesis: "Müşteri / tesis", sonuc: "Sonuç", tarih: "Tarih" };
function siraEtiketi(v: string) {
  if (v === "varsayilan") return "En yeni önce";
  const [s, y] = v.split("-"), artan = y === "artan";
  if (s === "tarih") return "Tarih: eskiden yeniye";
  return `${SIRA_AD[s] ?? s}: ${s === "durum" ? (artan ? "akış sırası" : "ters akış") : s === "sonuc" ? (artan ? "artan" : "azalan") : artan ? "A → Z" : "Z → A"}`;
}

const noHucre = (r: OnaySatiri) => <><Link className={stil.no} href={`/onaylar/${r.id}`}>{r.no}</Link><AltSatir><Kirp>{`${r.musteri} / ${r.tesis}`}</Kirp></AltSatir></>;
const ekipmanHucre = (r: OnaySatiri) => <span className={stil.hucreSatir}><span className={stil.kod}>{r.ekipmanKod}</span><Kirp>{r.turAd}</Kirp></span>;
const denetciHucre = (r: OnaySatiri) => <><KartEtiket>Denetçi</KartEtiket><Kirp>{r.denetci}</Kirp></>;

/** 596: numara hücresinin solunda seçim kutusu (secilir değilse yalnız numara) */
function secNoHucre(sec: Secim, secilir: (r: OnaySatiri) => boolean, ic: (r: OnaySatiri) => ReactNode) {
  return function hucre(r: OnaySatiri) {
    return secilir(r) ? <div className={stil.secHucre}><SecimKutusu s={sec} id={r.id} ad={r.no} /><div className={stil.secIc}>{ic(r)}</div></div> : ic(r);
  };
}
/** gönderildi hücresi; hazir (2026-10-17, teknik yönetici imzası): imzasız PDF'i hazırlanmış rapor "İmzaya hazır" */
const gonderildiHucre = (r: OnaySatiri, hazir?: ReadonlySet<string>) => (
  <><KartEtiket>Gönderildi</KartEtiket><span><span className={stil.sayi}>{r.gonderildi ? zamanYaz(r.gonderildi) : "—"}</span>
    {r.bekleme && <span className={r.eski ? stil.eski : stil.bekleme}>{r.bekleme} bekliyor</span>}
    {hazir?.has(r.id) && <AltSatir><Rozet tur="kabul">İmzaya hazır</Rozet></AltSatir>}</span></>
);
const KUYRUK_SUTUN: Sutun<OnaySatiri>[] = [
  { k: "no", genislik: "24%", baslik: "Rapor no", kart: "ust", sira: 1, hucre: noHucre },
  { k: "ekipman", genislik: "24%", baslik: "Ekipman", kart: "govde", sira: 2, hucre: ekipmanHucre },
  { k: "denetci", genislik: "18%", baslik: "Denetçi", kart: "govde", sira: 3, hucre: denetciHucre },
  { k: "gonderildi", genislik: "20%", baslik: "Gönderildi", kart: "govde", sira: 4, hucre: (r) => gonderildiHucre(r) },
  { k: "sonuc", genislik: "14%", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: (r) => {
    const s = r.sonuc ? SONUC_ROZET[r.sonuc] : null;
    return s ? <Rozet tur={s[1]}>{s[0]}</Rozet> : <Rozet tur="notr">Seçilmedi</Rozet>;
  } },
];
const TUM_SUTUN: Sutun<OnaySatiri>[] = [
  KUYRUK_SUTUN[0], KUYRUK_SUTUN[1], KUYRUK_SUTUN[2],
  { k: "durum", genislik: "18%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (r) => <Rozet tur={RAPOR_DURUM[r.durum][1]}>{RAPOR_DURUM[r.durum][0]}</Rozet> },
  { k: "eylem", genislik: "16%", baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem", sira: 9, hucre: (r) => (
    <div className={stil.eylemTuslar}><TusBaglanti ikon="eye" href={`/onaylar/${r.id}`}>Görüntüle</TusBaglanti></div>
  ) },
];

/* 2026-11-06 (reisim: "bu ekranda da filtreleme geliştirilmeli ve toplu onay, imzalama vs olmalı, yoksa bir anlamı kalmıyor"): Raporlar listesinin
   süzgeçleri Onaylar'ın her sekmesinde — başlıklı kutular (Rapor no · Ekipman kodu · Tesis yazarak; Ekipman türü · Müşteri · Muayene uzmanı · Branş · İl ·
   Sonuç seçerek; tarih aralığı), sütun başlığından sıralama. Kuyruk ve İmzamı bekleyen tarayıcıda süzülür (süreçteki raporlar), Tüm raporlar sunucuda. */
const GUN_TR = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const gunu = (iso: string | null) => (iso ? GUN_TR.format(new Date(iso)) : "");
const TUMU: Secenek = ["tumu", "Tümü"];
const SONUC_SECENEK: Secenek[] = [["uygun", "Uygun"], ["uygun_degil", "Uygun değil"], ["sartli", "Şartlı uygun"], ["yok", "Sonuç yok"]];
const SONUC_SIRA: Record<string, number> = { uygun: 1, sartli: 2, uygun_degil: 3 };
const SIRA_ADI: Record<string, string> = { no: "Rapor no", ekipman: "Ekipman", denetci: "Muayene uzmanı", gonderildi: "Gönderildi", onay: "Onaylandı", sonuc: "Sonuç" };
type Secici = SuzgecTanimi<OnaySatiri>["seciciler"][number];
const ara = (s: string) => s.toLocaleLowerCase("tr");
/** listedeki değerlerden seçici (boş değer seçeneğe girmez) */
function deger(l: readonly OnaySatiri[], k: string, ad: string, d: (r: OnaySatiri) => string | null, etiket: (r: OnaySatiri) => string = (r) => d(r) ?? ""): Secici {
  const sec = new Map<string, string>();
  for (const r of l) { const v = d(r); if (v && !sec.has(v)) sec.set(v, etiket(r)); }
  return { k, ad, secenek: () => [TUMU, ...[...sec].sort((a, b) => a[1].localeCompare(b[1], "tr"))], gecer: (r, v) => v === "tumu" || d(r) === v };
}
function raporSecicileri(l: readonly OnaySatiri[], uzman: boolean, siralar: readonly string[]): Secici[] {
  return [
    deger(l, "tur", "Ekipman türü", (r) => r.turAd),
    deger(l, "musteri", "Müşteri", (r) => r.musteriId, (r) => r.musteri),
    ...(uzman ? [deger(l, "kisi", "Muayene uzmanı", (r) => r.denetci)] : []),
    { k: "brans", ad: "Branş", secenek: () => [TUMU, ["m", "Mekanik"], ["e", "Elektrik"]], gecer: (r, v) => v === "tumu" || r.brans === v },
    deger(l, "il", "İl", (r) => r.il),
    { k: "sonuc", ad: "Sonuç", secenek: () => [TUMU, ...SONUC_SECENEK], gecer: (r, v) => v === "tumu" || (v === "yok" ? !r.sonuc : r.sonuc === v) },
    { k: "sira", ad: "Sıralama", siralama: true, gecer: () => true, secenek: () => [["varsayilan", "En yeni üstte"],
      ...siralar.flatMap((s) => [[`${s}-artan`, `${SIRA_ADI[s]} · artan`], [`${s}-azalan`, `${SIRA_ADI[s]} · azalan`]] as Secenek[])] },
  ];
}
const RAPOR_ALANLARI: SuzgecTanimi<OnaySatiri>["alanlar"] = [
  { k: "no", ad: "Rapor no", ipucu: "ör. DA-1026-…", metin: (r) => r.no },
  { k: "kod", ad: "Ekipman kodu", ipucu: "ör. HT-10", metin: (r) => r.ekipmanKod },
  { k: "tesis", ad: "Tesis", ipucu: "Tesis ya da müşteri", metin: (r) => `${r.tesis} ${r.musteri}` },
];
const siraAnahtari = (zaman: "gonderildi" | "onay"): Record<string, (r: OnaySatiri) => string | number> => ({
  no: (r) => r.no, ekipman: (r) => ara(r.ekipmanKod), denetci: (r) => ara(r.denetci), [zaman]: (r) => r[zaman] ?? "", sonuc: (r) => (r.sonuc ? SONUC_SIRA[r.sonuc] ?? 0 : 0),
});

function kuyrukTanimi(l: readonly OnaySatiri[]): SuzgecTanimi<OnaySatiri> {
  return {
    ad: "Kuyrukta ara", ipucu: "Hepsinde ara", birim: "rapor", imkansiz: "", sayfa: TABLO_SAYFA, izgara: true,
    metin: (r) => [r.no, r.ekipmanKod, r.turAd, r.tesis, r.musteri, r.denetci].join(" "),
    alanlar: RAPOR_ALANLARI,
    cipler: [
      { k: "kusurlu", ad: "Kusurlu", test: (r) => r.sonuc === "uygun_degil" || r.sonuc === "sartli" },
      { k: "eski", ad: "24 saatten eski", test: (r) => r.eski },
    ],
    seciciler: raporSecicileri(l, true, ["no", "ekipman", "denetci", "gonderildi", "sonuc"]),
    siraAnahtari: siraAnahtari("gonderildi"),
    tarih: { ad: "Gönderildi", gun: (r) => gunu(r.gonderildi) },
  };
}
/* 566 (09-B3): Tüm raporlar SUNUCUDA süzülür ve sayfalanır (raporlar/server/liste.ts onayTumKaynagi — aynı anahtarlar); burada yalnız ekranın
   çizimi (ad, seçenek; denetçi seçenekleri sunucudan). Sıralanabilir sütunlar: siraAnahtari'nın anahtarları (değerleri sunucuda). */
const hep = () => true;
const sifir = () => 0;
function tumTanimi(sec: Record<string, Secenek[]>): SuzgecTanimi<OnaySatiri> {
  return {
    ad: "Raporlarda ara", ipucu: "", birim: "rapor", imkansiz: "", sayfa: 20,
    metin: () => "",
    izgara: true,
    alanlar: [
      { k: "no", ad: "Rapor no", ipucu: "ör. DA-1026-…", metin: () => "" },
      { k: "kod", ad: "Ekipman kodu", ipucu: "ör. HT-10", metin: () => "" },
      { k: "tesis", ad: "Tesis", ipucu: "Tesis ya da müşteri", metin: () => "" },
    ],
    cipler: [],
    seciciler: [
      { k: "durum", ad: "Durum", secenek: () => [TUMU, ...(Object.keys(RAPOR_DURUM) as RaporDurumu[]).map((d) => [d, RAPOR_DURUM[d][0]] as const)], gecer: hep },
      { k: "tur", ad: "Ekipman türü", secenek: () => [TUMU, ...(sec.tur ?? [])], gecer: hep },
      { k: "musteri", ad: "Müşteri", secenek: () => [TUMU, ...(sec.musteri ?? [])], gecer: hep },
      { k: "kisi", ad: "Muayene uzmanı", secenek: () => [TUMU, ...(sec.kisi ?? [])], gecer: hep },
      { k: "brans", ad: "Branş", secenek: () => [TUMU, ["m", "Mekanik"], ["e", "Elektrik"]], gecer: hep },
      { k: "il", ad: "İl", secenek: () => [TUMU, ...(sec.il ?? [])], gecer: hep },
      { k: "ilce", ad: "İlçe", secenek: () => [TUMU, ...(sec.ilce ?? [])], gecer: hep },
      { k: "sonuc", ad: "Sonuç", secenek: () => [TUMU, ...SONUC_SECENEK], gecer: hep },
      { k: "sira", ad: "Sıralama", siralama: true, secenek: () => ["varsayilan", "tarih-artan", "no-artan", "no-azalan", "ekipman-artan", "ekipman-azalan", "tesis-artan", "tesis-azalan",
        "durum-artan", "durum-azalan", "denetci-artan", "denetci-azalan", "sonuc-artan", "sonuc-azalan"].map((x) => [x, siraEtiketi(x)] as const), gecer: hep },
    ],
    siraAnahtari: { no: sifir, durum: sifir, denetci: sifir, ekipman: sifir, tesis: sifir, sonuc: sifir, tarih: sifir },
    tarih: { ad: "Tarih aralığı", gun: () => "" },
  };
}

/** secili: bulunulan sekme — liste boşken de kendi sekmesi görünür (318 incelemesi: İmzamı bekleyen sayfasında hiçbir sekme seçili değildi).
    477 (Talepler–Onaylar kararları T1): "Talepler" — karar verebildiği izin talepleri ve masraf formları; rapor yazmayanda (planlama, muhasebe)
    İmzamı bekleyen raporlar sekmesi yok */
export function onaySekmeleri(v: Pick<OnayListeleri, "yonetici" | "kuyruk" | "tumSayisi" | "branslar" | "imzaBekleyen" | "istekler" | "belgeBekleyen" | "talepler"
  | "talepOnaylar" | "imzaci">, secili?: string) {
  /* 333: Diğer belgeler (bordro, eğitim / zimmet formu, araç tutanağı) — herkesin kendi; denetçinin iki sekmesi (maket onaylar.html BB4) */
  const diger = [`Diğer belgeler (${v.belgeBekleyen})`, "/onaylar/diger"] as const;
  const imza = [`İmzamı bekleyen raporlar (${v.imzaBekleyen.length})`, "/onaylar/imza"] as const;
  const talep = [`Talepler (${v.talepler.length})`, "/onaylar/talepler"] as const;
  const talepVar = v.talepOnaylar || secili === "/onaylar/talepler";
  if (!v.yonetici) {
    return [...(v.imzaci || secili === "/onaylar/imza" ? [imza] : []), ...(talepVar ? [talep] : []), diger];
  }
  const brans = v.branslar.length === 1 ? ` · ${v.branslar[0] === "m" ? "mekanik" : "elektrik"}` : "";
  const l: (readonly [string, string])[] = [[`Onay kuyruğu${brans} (${v.kuyruk.length})`, "/onaylar"], ...(talepVar ? [talep] : []),
    [`Tüm raporlar (${v.tumSayisi})`, "/onaylar/tum"], [`Revize istekleri (${v.istekler.length})`, "/onaylar/istekler"]];
  /* yönetici aynı zamanda rapor yazıyorsa (ör. mekanik yönetici + denetçi) kendi imzası ayrı sekmede */
  if (v.imzaBekleyen.length || secili === "/onaylar/imza") l.push(imza);
  l.push(diger);
  return l;
}

/* 596 TOPLU ONAY (karar K4 "hepsi"): onaylayabildiği raporlar seçilir; "Uygun değil" ya da sonucu seçilmemiş olanlar da girer — onay penceresi
   sayılarını söyler. Her rapor kendi isteğiyle onaylanır (yetki, sürüm, durum sunucuda yeniden); düşenler numarasıyla şeritte. */
/** 2026-11-06: seçilen raporların PDF'leri tek ZIP (tamamlananın imzalı PDF'i) — Raporlar listesinin toplu indirmesiyle aynı (raporlar/ui/topluIs.ts) */
function PdfIndirTusu({ idler }: { idler: readonly string[] }) {
  const { ilerleme, indir } = useTopluIndir();
  const bildir = useBildir();
  const uyar = useUyar();
  const [hazirlaniyor, setHazirlaniyor] = useState(false);
  const calis = async () => {
    setHazirlaniyor(true);
    let l: Awaited<ReturnType<typeof onayIndirmeEylemi>> = null;
    try { l = await onayIndirmeEylemi([...idler]); } catch { l = null; } finally { setHazirlaniyor(false); }
    if (!l) { uyar("Raporlar alınamadı; yeniden deneyin."); return; }
    const y = await indir(l, "onaylar-raporlar");
    if (!y) return;
    const red = y.inemeyen.filter((x) => x.no);
    if (!y.inen && y.inemeyen.length && !red.length) { uyar(y.inemeyen[0].neden); return; }
    bildir(`${y.inen} rapor indirildi.${red.length ? ` ${red.length} rapor inemedi: ${red.slice(0, 3).map((x) => `${x.no} (${x.neden})`).join(", ")}${red.length > 3 ? "…" : ""}` : ""}`);
  };
  const mesgul = hazirlaniyor || !!ilerleme;
  return (
    <Tus tur="ikincil" ikon="download" disabled={mesgul || !idler.length} aria-busy={mesgul || undefined} onClick={() => void calis()}>
      {ilerleme ? `İndiriliyor ${ilerleme}` : "PDF indir"}
    </Tus>
  );
}

export function OnayKuyrugu({ v }: { v: OnayListeleri }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const s = useSuzgec(kuyrukTanimi(v.kuyruk), v.kuyruk);
  /* 2026-11-06: toplu onay ve probata sign'ın toplu imzası 200; PDF'le imza penceresi 50 (pencere açılırken kırpılır) */
  const sec = useSecim(v.teknikImza && !v.sign ? TOPLU_EN_COK : 200);
  const [mesgul, baslat] = useTransition();
  const [ilerleme, setIlerleme] = useState<string | null>(null);
  const [red, setRed] = useState<string[]>([]);
  /* 2026-10-17 (göç 0102): teknik yönetici imzası açıkken onay imzayla — seçilenler imza penceresine */
  const teknik = v.teknikImza, hazir = new Set(v.teknikHazir);
  const [pen, setPen] = useState<OnaySatiri[] | null>(null);
  const uyar = useUyar();
  const pencereyeAl = (l: OnaySatiri[]) => {
    if (l.length > TOPLU_EN_COK) uyar(`PDF'le imzada bir seferde en çok ${TOPLU_EN_COK} rapor; ilk ${TOPLU_EN_COK} rapor alındı.`);
    return l.slice(0, TOPLU_EN_COK);
  };
  const secilir = (r: OnaySatiri) => (teknik ? r.izin.imzala : r.izin.onayla);
  const secilen = v.kuyruk.filter((r) => secilir(r) && sec.secili.includes(r.id));
  const onaylanir = s.sonuc.liste.filter(secilir);
  const hazirSayi = v.kuyruk.filter((r) => hazir.has(r.id)).length;
  const sutunlar: Sutun<OnaySatiri>[] = [{ ...KUYRUK_SUTUN[0], hucre: secNoHucre(sec, secilir, noHucre) }, KUYRUK_SUTUN[1], KUYRUK_SUTUN[2],
    { ...KUYRUK_SUTUN[3], hucre: (r) => gonderildiHucre(r, hazir) }, KUYRUK_SUTUN[4]];
  const topluOnay = async () => {
    const l = secilen, kusurlu = l.filter((r) => r.sonuc === "uygun_degil").length, sartli = l.filter((r) => r.sonuc === "sartli").length;
    const sonucsuz = l.filter((r) => !r.sonuc).length;
    const ek = [kusurlu ? `${kusurlu} rapor “Uygun değil”` : "", sartli ? `${sartli} rapor “Şartlı uygun”` : "", sonucsuz ? `${sonucsuz} raporda sonuç seçilmemiş` : ""]
      .filter(Boolean).join(", ");
    if (!(await onayla({ baslik: `${l.length} raporu onayla`, tus: "Onayla",
      metin: <>Seçilen <b>{l.length}</b> rapor onaylanacak ve muayene uzmanlarının son imzasına düşecek.{ek && <> Dikkat: {ek}.</>}</> }))) return;
    baslat(async () => {
      let tamam = 0;
      const dusen: string[] = [];
      for (const [i, r] of l.entries()) {
        setIlerleme(`${i} / ${l.length} rapor onaylandı…`);
        try {
          const y = await onaylaEylemi(r.id, r.surum);
          if (y.tamam) tamam++; else dusen.push(`${r.no}: ${y.genel ?? Object.values(y.hatalar ?? {})[0] ?? "onaylanamadı"}`);
        } catch { dusen.push(`${r.no}: bağlantı ya da sunucu hatası`); }
      }
      setIlerleme(null); setRed(dusen); sec.temizle();
      bildir(`${tamam} rapor onaylandı.`);
      router.refresh();
    });
  };
  return (
    <>
      <SayfaBasi baslik="Onaylar" sayac={<Sayac s={s} />} />
      <Sekmeler ad="Onaylar bölümleri" ogeler={onaySekmeleri(v)} secili="/onaylar" />
      {(ilerleme || red.length > 0 || onaylanir.length > 1 || (teknik && hazirSayi > 0)) && (
        <SeritKap>
          {ilerleme && <Serit tur="bilgi" ikon="list-checks"><span role="status">{ilerleme}</span></Serit>}
          {red.length > 0 && <Serit tur="hata" ikon="circle-alert"><b>{red.length} rapor onaylanamadı</b> · {red.join(" · ")}</Serit>}
          {!ilerleme && (onaylanir.length > 1 || (teknik && hazirSayi > 0)) && (
            <Serit tur="bilgi" ikon={teknik ? "file-signature" : "list-checks"} eylem={<>
              {onaylanir.length > 1 && <Tus tur="ikincil" disabled={mesgul} onClick={() => sec.hepsi(onaylanir.map((r) => r.id))}>Tümünü seç</Tus>}
              {teknik && hazirSayi > 0 && <Tus tur="ikincil" ikon="upload" onClick={() => setPen([])}>İmzalı PDF&apos;leri yükle</Tus>}
            </>}>
              {teknik ? <>Bu firmada teknik yönetici raporu <b>imzalayarak</b> onaylar · raporları seçip birlikte imzalayabilirsiniz.
                {hazirSayi > 0 && <> {hazirSayi} raporun imzasız PDF&apos;i hazır.</>}</> : <>Raporları seçip birlikte onaylayabilirsiniz.</>}
            </Serit>
          )}
        </SeritKap>
      )}
      <SuzgecliListe s={s} on="o" baslik="Onay kuyruğu" sutunlar={sutunlar} anahtar={(r) => r.id} href={(r) => `/onaylar/${r.id}`} siralanir
        bosVeri={{ ikon: "circle-check", baslik: "Onay bekleyen rapor yok" }} />
      <SecimCubugu sayi={secilen.length} temizle={sec.temizle}>
        <PdfIndirTusu idler={secilen.map((r) => r.id)} />
        {teknik && v.sign && <SignTopluTus idler={secilen.map((r) => r.id)} asama="teknik" bitti={() => { sec.temizle(); router.refresh(); }} />}
        {teknik ? <Tus tur={v.sign ? "ikincil" : "birincil"} ikon="file-signature" onClick={() => setPen(pencereyeAl(secilen))}>{v.sign ? "PDF ile imzala ve onayla" : "İmzala ve onayla"}</Tus>
          : <Tus ikon="circle-check" disabled={mesgul} onClick={() => void topluOnay()}>Seçilenleri onayla</Tus>}
      </SecimCubugu>
      {pen && <TopluImzaPenceresi raporlar={pen} kip="teknik" onKapat={(degisti) => { setPen(null); if (degisti) { sec.temizle(); router.refresh(); } }} />}
    </>
  );
}

/* 2026-11-06: Tüm raporlarda seçim (sayfalar arasında kalır) → PDF indir; onaylanabilen seçilenler birlikte onaylanır (kuyruktaki gibi, rapor rapor) */
export function TumRaporlar({ v, ilk }: { v: OnayListeleri; ilk: SunucuListe<OnaySatiri> }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const s = useSunucuSuzgec(tumTanimi, ilk, tumRaporlarEylemi);
  const sec = useSecim(300);
  const [gorulen, setGorulen] = useState<ReadonlyMap<string, OnaySatiri>>(new Map());
  const [mesgul, baslat] = useTransition();
  const [red, setRed] = useState<string[]>([]);
  /* sayfa değişince seçilenlerin satırı kaybolmasın (onay izni ve sürüm satırdan) */
  const bilinen = new Map(gorulen);
  for (const r of s.sonuc.gorunen) bilinen.set(r.id, r);
  const secilen = sec.secili.map((id) => bilinen.get(id)).filter((r): r is OnaySatiri => !!r);
  const onaylanir = secilen.filter((r) => r.izin.onayla);
  const sutunlar: Sutun<OnaySatiri>[] = [{ ...TUM_SUTUN[0], hucre: secNoHucre({ ...sec, degistir: (id, ac) => {
    const r = s.sonuc.gorunen.find((x) => x.id === id);
    if (r && ac) setGorulen(new Map(gorulen).set(id, r));
    sec.degistir(id, ac);
  } }, () => true, noHucre) }, ...TUM_SUTUN.slice(1)];
  const topluOnay = async () => {
    if (!(await onayla({ baslik: `${onaylanir.length} raporu onayla`, tus: "Onayla",
      metin: <>Seçilenlerden onay bekleyen <b>{onaylanir.length}</b> rapor onaylanacak.{secilen.length > onaylanir.length && <> {secilen.length - onaylanir.length} rapor onay beklemiyor; dokunulmaz.</>}</> }))) return;
    baslat(async () => {
      let tamam = 0;
      const dusen: string[] = [];
      for (const r of onaylanir) {
        try {
          const y = await onaylaEylemi(r.id, r.surum);
          if (y.tamam) tamam++; else dusen.push(`${r.no}: ${y.genel ?? Object.values(y.hatalar ?? {})[0] ?? "onaylanamadı"}`);
        } catch { dusen.push(`${r.no}: bağlantı ya da sunucu hatası`); }
      }
      setRed(dusen); sec.temizle();
      bildir(`${tamam} rapor onaylandı.`);
      router.refresh();
    });
  };
  return (
    <>
      <SayfaBasi baslik="Onaylar" sayac={<Sayac s={s} />} />
      <Sekmeler ad="Onaylar bölümleri" ogeler={onaySekmeleri(v)} secili="/onaylar/tum" />
      {red.length > 0 && <SeritKap><Serit tur="hata" ikon="circle-alert"><b>{red.length} rapor onaylanamadı</b> · {red.join(" · ")}</Serit></SeritKap>}
      <SuzgecliListe s={s} on="t" baslik="Tüm raporlar" sutunlar={sutunlar} anahtar={(r) => r.id} href={(r) => `/onaylar/${r.id}`} siralanir
        bosVeri={{ ikon: "inbox", baslik: "Rapor yok", metin: "Branşınızda açılmış rapor yok." }} />
      <SecimCubugu sayi={sec.secili.length} temizle={sec.temizle}>
        <PdfIndirTusu idler={sec.secili} />
        {!v.teknikImza && onaylanir.length > 0 && <Tus ikon="circle-check" disabled={mesgul} onClick={() => void topluOnay()}>Seçilenleri onayla ({onaylanir.length})</Tus>}
      </SecimCubugu>
    </>
  );
}

/* İMZAMI BEKLEYEN RAPORLAR (C5; maket onaylar.html BB4 imzaCiz, IMZA_SUTUN): kişinin yazdığı, teknik yöneticinin onayladığı raporlar — son imza
   rapor ekranında (İmzala → imzasız PDF'i indir → imzalı PDF'i yükle) ya da 596'dan beri seçip birlikte (TopluImza.tsx). Denetçinin Onaylar'ı
   yalnız bu listedir. İmzasız PDF'i hazırlanmış rapor "İmzaya hazır". */
const imzaNoHucre = (r: OnaySatiri) => (
  <><Link className={stil.no} href={`/raporlar/${r.id}`}>{r.no}</Link><AltSatir><Kirp>{`${r.musteri} / ${r.tesis}`}</Kirp></AltSatir></>
);
const imzaSutunlari = (sec: Secim, hazir: ReadonlySet<string>): Sutun<OnaySatiri>[] => [
  { k: "no", genislik: "26%", baslik: "Rapor no", kart: "ust", sira: 1, hucre: secNoHucre(sec, () => true, imzaNoHucre) },
  { k: "ekipman", genislik: "28%", baslik: "Ekipman", kart: "govde", sira: 2, hucre: ekipmanHucre },
  { k: "onay", genislik: "24%", baslik: "Onaylandı", kart: "govde", sira: 3, hucre: (r) => (
    <><KartEtiket>Onaylandı</KartEtiket><span><span className={stil.sayi}>{r.onay ? zamanYaz(r.onay) : "—"}</span>
      {hazir.has(r.id) && <AltSatir><Rozet tur="kabul">İmzaya hazır</Rozet></AltSatir>}</span></>
  ) },
  { k: "eylem", genislik: "22%", baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem", sira: 9, hucre: (r) => (
    <div className={stil.eylemTuslar}><TusBaglanti tur="birincil" ikon="file-signature" href={`/raporlar/${r.id}`}>İmzala</TusBaglanti></div>
  ) },
];
function imzaTanimi(l: readonly OnaySatiri[]): SuzgecTanimi<OnaySatiri> {
  return { ad: "İmza bekleyenlerde ara", ipucu: "Hepsinde ara", birim: "rapor", imkansiz: "", cipler: [], sayfa: TABLO_SAYFA, izgara: true,
    metin: (r) => [r.no, r.ekipmanKod, r.turAd, r.tesis, r.musteri].join(" "),
    alanlar: RAPOR_ALANLARI,
    seciciler: raporSecicileri(l, false, ["no", "ekipman", "onay"]),
    siraAnahtari: siraAnahtari("onay"),
    tarih: { ad: "Onaylandı", gun: (r) => gunu(r.onay) } };
}
export function ImzaBekleyen({ v }: { v: OnayListeleri }) {
  const router = useRouter();
  const uyar = useUyar();
  const s = useSuzgec(imzaTanimi(v.imzaBekleyen), v.imzaBekleyen);
  /* 2026-11-06: probata sign'ın toplu imzası 200 (sign TOPLU_EN_COK); PDF'le imza penceresi 50 */
  const sec = useSecim(v.sign ? 200 : TOPLU_EN_COK);
  const pencereyeAl = (l: OnaySatiri[]) => {
    if (l.length > TOPLU_EN_COK) uyar(`PDF'le imzada bir seferde en çok ${TOPLU_EN_COK} rapor; ilk ${TOPLU_EN_COK} rapor alındı.`);
    return l.slice(0, TOPLU_EN_COK);
  };
  const [pen, setPen] = useState<OnaySatiri[] | null>(null);
  const hazir = new Set(v.imzaHazir);
  const n = v.imzaBekleyen.length, hazirSayi = v.imzaBekleyen.filter((r) => hazir.has(r.id)).length;
  const secilen = v.imzaBekleyen.filter((r) => sec.secili.includes(r.id));
  return (
    <>
      <SayfaBasi baslik="Onaylar" sayac={<Sayac s={s} />} />
      <Sekmeler ad="Onaylar bölümleri" ogeler={onaySekmeleri(v, "/onaylar/imza")} secili="/onaylar/imza" />
      {n > 0 && (
        <SeritKap>
          <Serit tur="uyari" ikon="file-signature" eylem={<>
            {n > 1 && <Tus tur="ikincil" onClick={() => sec.hepsi(s.sonuc.liste.map((r) => r.id))}>Tümünü seç</Tus>}
            {hazirSayi > 0 && <Tus tur="ikincil" ikon="upload" onClick={() => setPen([])}>İmzalı PDF&apos;leri yükle</Tus>}
          </>}>
            <b>{n} rapor imzanızı bekliyor</b> · seçip birlikte imzalayabilirsiniz ya da raporu açıp İmzala.
            {hazirSayi > 0 && <> {hazirSayi} raporun imzasız PDF&apos;i hazır.</>}
          </Serit>
        </SeritKap>
      )}
      <SuzgecliListe s={s} on="i" baslik="İmzamı bekleyen raporlar" sutunlar={imzaSutunlari(sec, hazir)} anahtar={(r) => r.id} href={(r) => `/raporlar/${r.id}`} siralanir
        bosVeri={{ ikon: "circle-check", baslik: "İmzanızı bekleyen rapor yok" }} />
      <SecimCubugu sayi={secilen.length} temizle={sec.temizle}>
        <PdfIndirTusu idler={secilen.map((r) => r.id)} />
        {v.sign && <SignTopluTus idler={secilen.map((r) => r.id)} asama="uzman" bitti={() => { sec.temizle(); router.refresh(); }} />}
        <Tus tur={v.sign ? "ikincil" : "birincil"} ikon="file-signature" onClick={() => setPen(pencereyeAl(secilen))}>{v.sign ? "PDF ile imzala" : "İmzaya hazırla"}</Tus>
      </SecimCubugu>
      {pen && <TopluImzaPenceresi raporlar={pen} onKapat={(degisti) => { setPen(null); if (degisti) { sec.temizle(); router.refresh(); } }} />}
    </>
  );
}

/* REVİZE İSTEKLERİ (318; maket onaylar.html 141 W4 istekCiz, ISTEK_SUTUN): görebildiği tamamlanan raporlarda muayene uzmanlarının bekleyen
   istekleri, en yeni üstte; satırda Reddet ve Revizeye gönder (aynı pencere onay ekranında da). */
function istekSutunlari(ac: (r: RevizeIstekSatiri, t: RevizeTuru) => void): Sutun<RevizeIstekSatiri>[] {
  return [
    { k: "no", genislik: "20%", baslik: "Rapor no", kart: "ust", sira: 1, hucre: noHucre },
    { k: "ekipman", genislik: "18%", baslik: "Ekipman", kart: "govde", sira: 2, hucre: ekipmanHucre },
    { k: "kisi", genislik: "13%", baslik: "Denetçi", kart: "govde", sira: 3, hucre: (r) => <><KartEtiket>Denetçi</KartEtiket><Kirp>{r.denetci}</Kirp></> },
    { k: "istek", genislik: "23%", baslik: "İstek", kart: "govde", sira: 4, hucre: (r) => (
      <><KartEtiket>İstek</KartEtiket><span><span className={stil.sayi}>{zamanYaz(r.istek.zaman)}</span><AltSatir><Kirp>{r.istek.gerekce}</Kirp></AltSatir></span></>
    ) },
    /* işlem izni yoksa hücre boş (kart görünümünde :empty kuralı gizler — boş tuş şeridi çizilmez) */
    { k: "eylem", genislik: "26%", baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem", sira: 9, hucre: (r) => r.izin.revize ? (
      <div className={stil.eylemTuslar}>
        <Tus tur="ikincil" onClick={() => ac(r, "red")}>Reddet</Tus>
        <Tus tur="ikincil" ikon="file-pen-line" onClick={() => ac(r, "revize")}>Revizeye gönder</Tus>
      </div>
    ) : null },
  ];
}
function istekTanimi(): SuzgecTanimi<RevizeIstekSatiri> {
  return { ad: "Revize isteklerinde ara", ipucu: "Rapor no, kod, tesis", birim: "istek", imkansiz: "", cipler: [], seciciler: [], sayfa: TABLO_SAYFA,
    metin: (r) => [r.no, r.ekipmanKod, r.turAd, r.tesis, r.musteri, r.denetci, r.istek.gerekce].join(" ") };
}
export function RevizeIstekleri({ v }: { v: OnayListeleri }) {
  const router = useRouter();
  const s = useSuzgec(istekTanimi(), v.istekler);
  const [pen, setPen] = useState<{ r: RevizeIstekSatiri; tur: RevizeTuru } | null>(null);
  const [genel, setGenel] = useState<string | null>(null);
  return (
    <>
      <SayfaBasi baslik="Onaylar" sayac={<Sayac s={s} />} />
      <Sekmeler ad="Onaylar bölümleri" ogeler={onaySekmeleri(v)} secili="/onaylar/istekler" />
      {genel && <SeritKap><Serit tur="hata" ikon="circle-alert">{genel}</Serit></SeritKap>}
      <SuzgecliListe s={s} on="v" baslik="Revize istekleri" sutunlar={istekSutunlari((r, tur) => { setGenel(null); setPen({ r, tur }); })} anahtar={(r) => r.id}
        href={(r) => `/onaylar/${r.id}`} bosVeri={{ ikon: "circle-check", baslik: "Revize isteği yok" }} />
      {pen && <RevizePenceresi tur={pen.tur} r={pen.r} istek={pen.r.istek} onKapat={() => setPen(null)}
        bitti={(x) => { setPen(null); setGenel(x.genel ?? null); if (!x.genel) router.refresh(); }} />}
    </>
  );
}
