"use client";
/* ONAYLAR LİSTELERİ (maket onaylar.html #/ kuyruk, #/tum — 190): Onay kuyruğu (branşın onaydaki raporları, en yeni üstte; çipler Kusurlu ve
   24 saatten eski, seçiciler Denetçi ve Tesis; sütunlar Rapor no · Ekipman · Denetçi · Gönderildi · Sonuç) ve Tüm raporlar (branşın bütün
   raporları; rapor no ve tesis ayrı aranır, seçiciler Durum ve Denetçi). Satır onay ekranını açar. Bekleme sunucuda hesaplanır (az önce /
   N saattir / N gündür). Yetki sunucuda: liste yalnız görülebilen raporları taşır. 318: İmzamı bekleyen raporlar (C5) ve Revize istekleri. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Rozet, SayfaBasi, Sekmeler, SeritKap, type RozetTuru } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { RAPOR_DURUM, type RaporDurumu } from "../../raporlar/sema";
import type { OnayListeleri, OnaySatiri, RevizeIstekSatiri } from "../server/onaylar";
import { RevizePenceresi, type RevizeTuru } from "./RevizePenceresi";
import stil from "./onaylar.module.css";

const TR_ZAMAN = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const zamanYaz = (z: string) => TR_ZAMAN.format(new Date(z)).replace(",", "");
export const SONUC_ROZET: Record<string, readonly [string, RozetTuru]> = { uygun: ["Uygun", "tamam"], uygun_degil: ["Uygun değil", "red"] };
const DURUM_SIRA: Record<RaporDurumu, number> = { taslak: 1, onayda: 2, onaylandi: 3, imzada: 4, imzali: 5 };
const benzersiz = <T,>(l: readonly T[]) => [...new Set(l)];
const SIRA_AD: Record<string, string> = { no: "Rapor no", durum: "Durum", denetci: "Denetçi" };
function siraEtiketi(v: string) {
  if (v === "varsayilan") return "En yeni önce";
  const [s, y] = v.split("-"), artan = y === "artan";
  return `${SIRA_AD[s] ?? s}: ${s === "durum" ? (artan ? "akış sırası" : "ters akış") : artan ? "A → Z" : "Z → A"}`;
}

const noHucre = (r: OnaySatiri) => <><Link className={stil.kod} href={`/onaylar/${r.id}`}>{r.no}</Link><AltSatir><Kirp>{`${r.musteri} / ${r.tesis}`}</Kirp></AltSatir></>;
const ekipmanHucre = (r: OnaySatiri) => <span className={stil.hucreSatir}><span className={stil.kod}>{r.ekipmanKod}</span><Kirp>{r.turAd}</Kirp></span>;
const denetciHucre = (r: OnaySatiri) => <><KartEtiket>Denetçi</KartEtiket><Kirp>{r.denetci}</Kirp></>;

const KUYRUK_SUTUN: Sutun<OnaySatiri>[] = [
  { k: "no", genislik: "24%", baslik: "Rapor no", kart: "ust", sira: 1, hucre: noHucre },
  { k: "ekipman", genislik: "24%", baslik: "Ekipman", kart: "govde", sira: 2, hucre: ekipmanHucre },
  { k: "denetci", genislik: "18%", baslik: "Denetçi", kart: "govde", sira: 3, hucre: denetciHucre },
  { k: "gonderildi", genislik: "20%", baslik: "Gönderildi", kart: "govde", sira: 4, hucre: (r) => (
    <><KartEtiket>Gönderildi</KartEtiket><span><span className={stil.sayi}>{r.gonderildi ? zamanYaz(r.gonderildi) : "—"}</span>
      {r.bekleme && <span className={r.eski ? stil.eski : stil.bekleme}>{r.bekleme} bekliyor</span>}</span></>
  ) },
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

function kuyrukTanimi(l: readonly OnaySatiri[]): SuzgecTanimi<OnaySatiri> {
  return {
    ad: "Kuyrukta ara", ipucu: "Rapor no, kod, tesis", birim: "rapor", imkansiz: "",
    metin: (r) => [r.no, r.ekipmanKod, r.turAd, r.tesis, r.musteri, r.denetci].join(" "),
    cipler: [
      { k: "kusurlu", ad: "Kusurlu", test: (r) => r.sonuc === "uygun_degil" },
      { k: "eski", ad: "24 saatten eski", test: (r) => r.eski },
    ],
    seciciler: [
      { k: "kisi", ad: "Denetçi", secenek: () => [["tumu", "Tümü"], ...benzersiz(l.map((r) => r.denetci)).sort((a, b) => a.localeCompare(b, "tr")).map((x) => [x, x] as const)],
        gecer: (r, v) => v === "tumu" || r.denetci === v },
      { k: "tesis", ad: "Tesis", secenek: () => [["tumu", "Tümü"], ...benzersiz(l.map((r) => r.tesisId)).map((t) => {
        const r = l.find((x) => x.tesisId === t)!; return [t, `${r.musteri} / ${r.tesis}`] as const; })],
        gecer: (r, v) => v === "tumu" || r.tesisId === v },
    ],
  };
}
function tumTanimi(l: readonly OnaySatiri[]): SuzgecTanimi<OnaySatiri> {
  return {
    ad: "Raporlarda ara", ipucu: "", birim: "rapor", imkansiz: "", sayfa: 20,
    metin: (r) => r.no,
    alanlar: [
      { k: "no", ad: "Rapor no", ipucu: "ör. DA-1026-…", metin: (r) => r.no },
      { k: "tesis", ad: "Tesis", ipucu: "Tesis ya da müşteri", metin: (r) => `${r.musteri} ${r.tesis}` },
    ],
    cipler: [],
    seciciler: [
      { k: "durum", ad: "Durum", secenek: () => [["tumu", "Tümü"], ...(Object.keys(RAPOR_DURUM) as RaporDurumu[]).map((d) => [d, RAPOR_DURUM[d][0]] as const)],
        gecer: (r, v) => v === "tumu" || r.durum === v },
      { k: "kisi", ad: "Denetçi", secenek: () => [["tumu", "Tümü"], ...benzersiz(l.map((r) => r.denetci)).sort((a, b) => a.localeCompare(b, "tr")).map((x) => [x, x] as const)],
        gecer: (r, v) => v === "tumu" || r.denetci === v },
      { k: "sira", ad: "Sıralama", siralama: true, secenek: () => ["varsayilan", "no-artan", "no-azalan", "durum-artan", "durum-azalan", "denetci-artan", "denetci-azalan"]
        .map((x) => [x, siraEtiketi(x)] as const), gecer: () => true },
    ],
    siraAnahtari: { no: (r) => r.no, durum: (r) => DURUM_SIRA[r.durum], denetci: (r) => r.denetci },
    varsayilanSira: (a, b) => b.olustu.localeCompare(a.olustu),
  };
}

export function onaySekmeleri(v: Pick<OnayListeleri, "kuyruk" | "tumu" | "branslar" | "imzaBekleyen" | "istekler">) {
  const brans = v.branslar.length === 1 ? ` · ${v.branslar[0] === "m" ? "mekanik" : "elektrik"}` : "";
  const l: (readonly [string, string])[] = [[`Onay kuyruğu${brans} (${v.kuyruk.length})`, "/onaylar"], [`Tüm raporlar (${v.tumu.length})`, "/onaylar/tum"],
    [`Revize istekleri (${v.istekler.length})`, "/onaylar/istekler"]];
  /* yönetici aynı zamanda rapor yazıyorsa (ör. mekanik yönetici + denetçi) kendi imzası ayrı sekmede */
  if (v.imzaBekleyen.length) l.push([`İmzamı bekleyen raporlar (${v.imzaBekleyen.length})`, "/onaylar/imza"]);
  return l;
}

export function OnayKuyrugu({ v }: { v: OnayListeleri }) {
  const s = useSuzgec(kuyrukTanimi(v.kuyruk), v.kuyruk);
  return (
    <>
      <SayfaBasi baslik="Onaylar" sayac={<Sayac s={s} />} />
      <Sekmeler ad="Onaylar bölümleri" ogeler={onaySekmeleri(v)} secili="/onaylar" />
      <SuzgecliListe s={s} on="o" baslik="Onay kuyruğu" sutunlar={KUYRUK_SUTUN} anahtar={(r) => r.id} href={(r) => `/onaylar/${r.id}`}
        bosVeri={{ ikon: "circle-check", baslik: "Onay bekleyen rapor yok", metin: "Denetçi raporu onaya gönderince burada görünür." }} />
    </>
  );
}

export function TumRaporlar({ v }: { v: OnayListeleri }) {
  const s = useSuzgec(tumTanimi(v.tumu), v.tumu);
  return (
    <>
      <SayfaBasi baslik="Onaylar" sayac={<Sayac s={s} />} />
      <Sekmeler ad="Onaylar bölümleri" ogeler={onaySekmeleri(v)} secili="/onaylar/tum" />
      <SuzgecliListe s={s} on="t" baslik="Tüm raporlar" sutunlar={TUM_SUTUN} anahtar={(r) => r.id} href={(r) => `/onaylar/${r.id}`} siralanir
        bosVeri={{ ikon: "inbox", baslik: "Rapor yok", metin: "Branşınızda açılmış rapor yok." }} />
    </>
  );
}

/* İMZAMI BEKLEYEN RAPORLAR (C5; maket onaylar.html BB4 imzaCiz, IMZA_SUTUN): kişinin yazdığı, teknik yöneticinin onayladığı raporlar — son imza
   rapor ekranında (İmzala → imzasız PDF'i indir → imzalı PDF'i yükle; her rapor ayrı). Denetçinin Onaylar'ı yalnız bu listedir. */
const IMZA_SUTUN: Sutun<OnaySatiri>[] = [
  { k: "no", genislik: "26%", baslik: "Rapor no", kart: "ust", sira: 1, hucre: (r) => (
    <><Link className={stil.kod} href={`/raporlar/${r.id}`}>{r.no}</Link><AltSatir><Kirp>{`${r.musteri} / ${r.tesis}`}</Kirp></AltSatir></>
  ) },
  { k: "ekipman", genislik: "28%", baslik: "Ekipman", kart: "govde", sira: 2, hucre: ekipmanHucre },
  { k: "onay", genislik: "24%", baslik: "Onaylandı", kart: "govde", sira: 3, hucre: (r) => (
    <><KartEtiket>Onaylandı</KartEtiket><span className={stil.sayi}>{r.onay ? zamanYaz(r.onay) : "—"}</span></>
  ) },
  { k: "eylem", genislik: "22%", baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem", sira: 9, hucre: (r) => (
    <div className={stil.eylemTuslar}><TusBaglanti tur="birincil" ikon="file-signature" href={`/raporlar/${r.id}`}>İmzala</TusBaglanti></div>
  ) },
];
function imzaTanimi(): SuzgecTanimi<OnaySatiri> {
  return { ad: "İmza bekleyenlerde ara", ipucu: "Rapor no, kod, tesis", birim: "rapor", imkansiz: "", cipler: [], seciciler: [],
    metin: (r) => [r.no, r.ekipmanKod, r.turAd, r.tesis, r.musteri].join(" ") };
}
export function ImzaBekleyen({ v }: { v: OnayListeleri }) {
  const s = useSuzgec(imzaTanimi(), v.imzaBekleyen);
  const n = v.imzaBekleyen.length;
  return (
    <>
      <SayfaBasi baslik="Onaylar" sayac={<Sayac s={s} />} />
      {v.yonetici && <Sekmeler ad="Onaylar bölümleri" ogeler={onaySekmeleri(v)} secili="/onaylar/imza" />}
      {n > 0 && (
        <SeritKap>
          <Serit tur="uyari" ikon="file-signature"><b>{n} rapor imzanızı bekliyor</b> · her rapor ayrı imzalanır: raporu açın, İmzala.</Serit>
        </SeritKap>
      )}
      <SuzgecliListe s={s} on="i" baslik="İmzamı bekleyen raporlar" sutunlar={IMZA_SUTUN} anahtar={(r) => r.id} href={(r) => `/raporlar/${r.id}`}
        bosVeri={{ ikon: "circle-check", baslik: "İmzanızı bekleyen rapor yok", metin: "Teknik yönetici raporunuzu onaylayınca son imza için burada görünür." }} />
    </>
  );
}

/* REVİZE İSTEKLERİ (318; maket onaylar.html 141 W4 istekCiz, ISTEK_SUTUN): görebildiği tamamlanan raporlarda muayene uzmanlarının bekleyen
   istekleri, en yeni üstte; satırda Reddet ve Revizeye gönder (aynı pencere onay ekranında da). */
function istekSutunlari(ac: (r: RevizeIstekSatiri, t: RevizeTuru) => void): Sutun<RevizeIstekSatiri>[] {
  return [
    { k: "no", genislik: "22%", baslik: "Rapor no", kart: "ust", sira: 1, hucre: noHucre },
    { k: "ekipman", genislik: "20%", baslik: "Ekipman", kart: "govde", sira: 2, hucre: ekipmanHucre },
    { k: "kisi", genislik: "14%", baslik: "Denetçi", kart: "govde", sira: 3, hucre: (r) => <><KartEtiket>Denetçi</KartEtiket><Kirp>{r.denetci}</Kirp></> },
    { k: "istek", genislik: "24%", baslik: "İstek", kart: "govde", sira: 4, hucre: (r) => (
      <><KartEtiket>İstek</KartEtiket><span><span className={stil.sayi}>{zamanYaz(r.istek.zaman)}</span><AltSatir><Kirp>{r.istek.gerekce}</Kirp></AltSatir></span></>
    ) },
    { k: "eylem", genislik: "20%", baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem", sira: 9, hucre: (r) => (
      <div className={stil.eylemTuslar}>
        {r.izin.revize && <Tus tur="ikincil" onClick={() => ac(r, "red")}>Reddet</Tus>}
        {r.izin.revize && <Tus tur="ikincil" ikon="file-pen-line" onClick={() => ac(r, "revize")}>Revizeye gönder</Tus>}
      </div>
    ) },
  ];
}
function istekTanimi(): SuzgecTanimi<RevizeIstekSatiri> {
  return { ad: "Revize isteklerinde ara", ipucu: "Rapor no, kod, tesis", birim: "istek", imkansiz: "", cipler: [], seciciler: [],
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
        href={(r) => `/onaylar/${r.id}`} bosVeri={{ ikon: "circle-check", baslik: "Revize isteği yok", metin: "Muayene uzmanı tamamlanan raporunda revize isterse burada görünür." }} />
      {pen && <RevizePenceresi tur={pen.tur} r={pen.r} istek={pen.r.istek} onKapat={() => setPen(null)}
        bitti={(x) => { setPen(null); setGenel(x.genel ?? null); if (!x.genel) router.refresh(); }} />}
    </>
  );
}
