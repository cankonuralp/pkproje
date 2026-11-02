"use client";
/* RAPORLAR LİSTESİ (modül 14; maket raporlar.html #/ — reisim 2026-09-28: "filtreleyip arama detaylı olmalı; ekipman türüne rapor numarasına göre
   ayrı ayrı arayabilmeliyim", 2026-09-26: "sıralama tarihi olsun her zaman en yeni en yukarıda olsun", "raporlar modülünde kusurlu tuşunu kaldır").
   İmzasını bekleyen raporu olana şerit (Onaylar › İmzamı bekleyen raporlar). Görme sunucuda: denetçi kendi, branş yöneticisi branşı, planlama ve
   firma yöneticisi hepsi. 566 (09-B3): süzgeç ve sayfa SUNUCUDA (server/liste.ts raporSayfasi — aynı anahtarlar); ekrana yalnız sayfanın 20 satırı.
   2026-11-02 (liste maketi onaylı — reisim "filtrelemeler daha detaylı olmalı", "her bir başlığa tıklayınca o başlığa göre sıralanıyor", "seç sil
   toplu sil vs yok raporlar için"): süzgeçler başlıklı kutular — Rapor no · Ekipman kodu · Tesis yazarak, Ekipman türü · Müşteri · Muayene uzmanı ·
   Branş · İl · İlçe · Sonuç seçerek, Tarih aralığı (Yıl'ın yerine); sütun başlığından sıralama (açılışta en yeni üstte; kartta Sıralama kutusu);
   sütunlar Rapor no · Tarih · Ekipman · Müşteri / tesis · Muayene uzmanı · Sonuç · Durum; satır seçimi (sayfalar arasında kalır) → PDF indir (ZIP)
   ve Sil (yalnız kendi Yeni raporu); Toplu indir: süzgece uyanların hepsi (en çok 300). */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBildir, useUyar } from "../../../components/bildirim/Bildirim";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { SayfaKutusu, SecimCubugu, SecimKutusu, useSatirSecimi } from "../../../components/liste/Secim";
import { Sayac, SuzgecliListe } from "../../../components/liste/SuzgecliListe";
import { useSunucuSuzgec } from "../../../components/liste/SunucuSuzgec";
import type { Secenek, SunucuListe, SuzgecTanimi } from "../../../components/liste/suzgec";
import { useOnayla } from "../../../components/pencere/Onay";
import { AltSatir, Rozet, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { RAPOR_DURUM, SONUC_AD } from "../sema";
import type { RaporListeSatiri } from "../server/raporlar";
import { raporIndirmeListesiEylemi, raporSayfasiEylemi } from "./eylemler";
import { silmeNedeni, TOPLU_EN_COK, topluSil, useTopluIndir } from "./topluIs";
import stil from "./raporlar.module.css";

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const gun = (iso: string) => GUN.format(new Date(iso));
const sonucAd = (r: RaporListeSatiri) => (r.sonuc ? SONUC_AD[r.sonuc] : null);

/* süzgeç tanımı: anahtarlar sunucudakiyle aynı (server/liste.ts raporKaynagi); test / gecer / metin SUNUCUDA uygulanır — burada yalnız ekranın
   çizimi için (ad, seçenek); seçenekler (tür, müşteri, uzman, il, ilçe) sunucudan, görebildiği raporlardan */
const hep = () => true;
const SIRALAR: Secenek[] = [
  ["varsayilan", "En yeni üstte"],
  ["tarih-artan", "Tarih · eskiden yeniye"], ["no-artan", "Rapor no · artan"], ["no-azalan", "Rapor no · azalan"],
  ["ekipman-artan", "Ekipman · A–Z"], ["ekipman-azalan", "Ekipman · Z–A"], ["tesis-artan", "Müşteri / tesis · A–Z"], ["tesis-azalan", "Müşteri / tesis · Z–A"],
  ["uzman-artan", "Muayene uzmanı · A–Z"], ["uzman-azalan", "Muayene uzmanı · Z–A"], ["sonuc-artan", "Sonuç · artan"], ["sonuc-azalan", "Sonuç · azalan"],
  ["durum-artan", "Durum · akış sırası"], ["durum-azalan", "Durum · ters sıra"],
];
function tanim(sec: Record<string, Secenek[]>): SuzgecTanimi<RaporListeSatiri> {
  const tumu: Secenek = ["tumu", "Tümü"];
  return {
    ad: "Raporlarda ara", ipucu: "Hepsinde ara", birim: "rapor", sayfa: 20, imkansiz: "Bir rapor aynı anda iki durumda olamaz", izgara: true,
    metin: () => "",
    alanlar: [
      { k: "no", ad: "Rapor no", ipucu: "ör. DA-1026-…", metin: () => "" },
      { k: "kod", ad: "Ekipman kodu", ipucu: "ör. HT-10", metin: () => "" },
      { k: "tesis", ad: "Tesis", ipucu: "ör. fabrika", metin: () => "" },
    ],
    cipler: [
      ...(Object.keys(RAPOR_DURUM) as (keyof typeof RAPOR_DURUM)[]).map((d) => ({ k: d, ad: RAPOR_DURUM[d][0], grup: "durum", test: hep })),
      { k: "geri", ad: "Geri gönderilen", test: hep },
    ],
    seciciler: [
      { k: "tur", ad: "Ekipman türü", secenek: () => [tumu, ...(sec.tur ?? [])], gecer: hep },
      { k: "musteri", ad: "Müşteri", secenek: () => [tumu, ...(sec.musteri ?? [])], gecer: hep },
      { k: "uzman", ad: "Muayene uzmanı", secenek: () => [tumu, ...(sec.uzman ?? [])], gecer: hep },
      { k: "brans", ad: "Branş", secenek: () => [tumu, ["m", "Mekanik"], ["e", "Elektrik"]], gecer: hep },
      { k: "il", ad: "İl", secenek: () => [tumu, ...(sec.il ?? [])], gecer: hep },
      { k: "ilce", ad: "İlçe", secenek: () => [tumu, ...(sec.ilce ?? [])], gecer: hep },
      { k: "sonuc", ad: "Sonuç", secenek: () => [tumu, ["uygun", "Uygun"], ["uygun_degil", "Uygun değil"], ["sartli", "Şartlı uygun"], ["yok", "Sonuç yok"]], gecer: hep },
      { k: "sira", ad: "Sıralama", siralama: true, secenek: () => SIRALAR, gecer: hep },
    ],
    tarih: { ad: "Tarih aralığı", gun: () => "" },
  };
}

/** imzaGor: kişi Onaylar'ı görür (İmzamı bekleyen raporlar orada); görmüyorsa şerit yalnız bilgi verir, raporlar listede "Muayene uzmanı imzası" */
export function RaporListesi({ ilk, imza, imzaGor }: { ilk: SunucuListe<RaporListeSatiri>; imza: number; imzaGor: boolean }) {
  const router = useRouter();
  const bildir = useBildir();
  const uyar = useUyar();
  const onayla = useOnayla();
  const s = useSunucuSuzgec(tanim, ilk, raporSayfasiEylemi);
  const sec = useSatirSecimi<RaporListeSatiri>((r) => r.id, TOPLU_EN_COK);
  const { ilerleme, indir } = useTopluIndir();
  const [siliniyor, setSiliniyor] = useState(false);
  const gorunen = s.sonuc.gorunen;
  const sayfaHepsi = gorunen.length > 0 && gorunen.every((r) => sec.secili.has(r.id));
  const sayfaBazi = gorunen.some((r) => sec.secili.has(r.id));

  const indirSonucu = (y: Awaited<ReturnType<typeof indir>>) => {
    if (!y) return;
    const red = y.inemeyen.filter((x) => x.no);
    if (!y.inen && y.inemeyen.length && !red.length) { uyar(y.inemeyen[0].neden); return; }
    bildir(`${y.inen} rapor indirildi.${red.length ? ` ${red.length} rapor inemedi: ${red.slice(0, 3).map((x) => `${x.no} (${x.neden})`).join(", ")}${red.length > 3 ? "…" : ""}` : ""}`);
  };
  const topluIndir = async () => {
    const l = await raporIndirmeListesiEylemi(s.durum);
    if (!l) { uyar("Raporlar alınamadı; yeniden deneyin."); return; }
    if (l.adet > TOPLU_EN_COK) { uyar(`Süzgece ${l.adet} rapor uyuyor; en çok ${TOPLU_EN_COK} rapor birlikte indirilir. Süzgeçle daraltın.`); return; }
    indirSonucu(await indir(l.raporlar, "raporlar"));
  };
  const sil = async () => {
    const l = [...sec.secili.values()];
    const olur = l.filter((r) => !silmeNedeni(r)), olmaz = l.length - olur.length;
    if (!olur.length) { uyar(`Seçilenlerin hiçbiri silinemez: yalnız kendi Yeni raporunuz silinir.`); return; }
    const evet = await onayla({ baslik: olur.length === 1 ? "Raporu sil" : `${olur.length} raporu sil`, tehlike: true, tus: "Sil",
      metin: <>{olur.length} rapor ve içine yazılan her şey silinir; geri alınamaz.{olmaz ? ` ${olmaz} rapor silinemez (durumu ilerlemiş, revizyonda ya da başka uzmanın); seçili kalır.` : ""}</> });
    if (!evet) return;
    setSiliniyor(true);
    try {
      const y = await topluSil(olur);
      sec.kaldir(y.silinen);
      const hata = y.kalan.filter((x) => olur.some((r) => r.no === x.no));
      bildir(`${y.silinen.length} rapor silindi.${hata.length ? ` ${hata.length} rapor silinemedi: ${hata.slice(0, 3).map((x) => `${x.no} (${x.neden})`).join(", ")}` : ""}`);
      router.refresh();
    } finally { setSiliniyor(false); }
  };

  const sutunlar: Sutun<RaporListeSatiri>[] = [
    { k: "sec", genislik: "52px", baslik: "Seç", kart: "govde", sira: 0, siralanmaz: true,
      basHucre: <SayfaKutusu hepsi={sayfaHepsi} bazi={sayfaBazi} ad="Bu sayfadaki raporların hepsini seç" degistir={(ac) => sec.sayfa(gorunen, ac)} />,
      hucre: (r) => <SecimKutusu secili={sec.secili.has(r.id)} ad={r.no} degistir={(ac) => sec.sec(r, ac)} /> },
    { k: "no", genislik: "14%", baslik: "Rapor no", kart: "ust", sira: 1, hucre: (r) => <Link className={stil.no} href={`/raporlar/${r.id}`}>{r.no}</Link> },
    { k: "tarih", genislik: "10%", baslik: "Tarih", kart: "govde", sira: 4, hucre: (r) => <><KartEtiket>Tarih</KartEtiket>{tarihNo(gun(r.olustu))}</> },
    { k: "ekipman", genislik: "18%", baslik: "Ekipman", kart: "govde", sira: 2, hucre: (r) => (
      <span className={stil.hucreSatir}><span className={stil.kod}>{r.ekipmanKod}</span><Kirp>{r.turAd}</Kirp></span>
    ) },
    { k: "tesis", genislik: "18%", baslik: "Müşteri / tesis", kart: "govde", sira: 3, hucre: (r) => (
      <span><Kirp>{r.tesis}</Kirp><AltSatir><Kirp>{r.musteri}</Kirp></AltSatir></span>
    ) },
    { k: "uzman", genislik: "13%", baslik: "Muayene uzmanı", kart: "govde", sira: 5, hucre: (r) => <><KartEtiket>Uzman</KartEtiket><Kirp>{r.denetci}</Kirp></> },
    { k: "sonuc", genislik: "9%", baslik: "Sonuç", kart: "govde", sira: 6, hucre: (r) => {
      const x = sonucAd(r);
      return <><KartEtiket>Sonuç</KartEtiket>{x ? <span className={r.sonuc === "uygun_degil" ? stil.sonucHata : r.sonuc === "sartli" ? stil.sonucUyari : undefined}>{x}</span> : <span className={stil.bosSatir}>—</span>}</>;
    } },
    { k: "durum", genislik: "15%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (r) => <Rozet tur={RAPOR_DURUM[r.durum][1]}>{RAPOR_DURUM[r.durum][0]}</Rozet> },
  ];

  return (
    <>
      <SayfaBasi baslik="Raporlar" sayac={<Sayac s={s} />} tuslar={
        <Tus tur="ikincil" ikon="download" disabled={!!ilerleme || !s.sonuc.adet} aria-busy={!!ilerleme || undefined} onClick={() => void topluIndir()}>
          {ilerleme ? `İndiriliyor ${ilerleme}` : "Toplu indir"}
        </Tus>} />
      {imza > 0 && (
        <SeritKap>
          <Serit tur="uyari" ikon="file-signature" eylem={imzaGor ? <TusBaglanti ikon="file-signature" href="/onaylar/imza">İmzamı bekleyen raporlar</TusBaglanti> : undefined}>
            <b>{imza} rapor imzanızı bekliyor</b>
          </Serit>
        </SeritKap>
      )}
      <SuzgecliListe s={s} on="r" baslik="Raporlar" sutunlar={sutunlar} anahtar={(r) => r.id} href={(r) => `/raporlar/${r.id}`} siralanir
        bosVeri={{ ikon: "file-text", baslik: "Rapor yok" }} />
      <SecimCubugu sayi={sec.secili.size} temizle={sec.temizle}>
        <Tus tur="ikincil" ikon="download" disabled={!!ilerleme} onClick={() => void indir([...sec.secili.values()], "secilen-raporlar").then(indirSonucu)}>
          {ilerleme ? `İndiriliyor ${ilerleme}` : "PDF indir"}
        </Tus>
        <Tus tur="tehlike" ikon="trash-2" disabled={siliniyor} aria-busy={siliniyor || undefined} onClick={() => void sil()}>Sil</Tus>
      </SecimCubugu>
    </>
  );
}
