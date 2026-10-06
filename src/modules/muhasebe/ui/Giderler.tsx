"use client";
/* MUHASEBE › GİDERLER (maket muhasebe.html #/giderler — G_SUTUN, suzgecTanimla "g", giderPencere, gider-excel-*; 328): en yeni üstte; onay bekleyen
   masraf ve belgesi olmayan gider şeridi (yalnız ekranda — anayasa 1.3); listenin altında süzülen satırların KDV hariç / KDV / toplamı. Gider
   penceresi: ekle (ödendi / ödenecek), düzenle, onay bekleyeni "Onayla" ya da "Reddet" (gerekçe), ödeneceği "Ödendi". Excel'e aktar (süzülen
   liste) ve Excel'den yükle (tarayıcıda okunur, satır satır önizleme; sunucu yeniden denetler). İş sayfasının "Giderler" bölümü de buradan.
   Görme ve karar sunucuda (modül 18). */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { baytIndir, dosyaGunu } from "../../../components/disa/indir";
import { tabloOku, TabloHatasi } from "../../../components/disa/oku";
import { XLSX_TURU } from "../../../components/disa/xlsx";
import { Alan, Girdi, ipucuId } from "../../../components/form/Form";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { AltSatir, Bolum, DegerYok, Rozet, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import { Ikon } from "../../../components/ikon/Ikon";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import { tutar as tutarSema } from "../../../sema/ortak";
import { GIDER_EXCEL_SINIR, GIDER_SABLON, giderExceli, giderSablonu, giderSatirlari, type GiderExcelSatiri } from "../excel";
import { ayAd } from "../karlilik";
import { GIDER_DURUM, GIDER_TUR, giderKdv, KDV_ORAN, para, type GiderTuru } from "../sema";
import type { GiderSatiri, GiderSecenekleri } from "../server/giderler";
import { giderExceliYukleEylemi, giderKaydetEylemi, giderReddetEylemi } from "./eylemler";
import { BordroGonderTusu } from "./BordroGonder";
import { MuhasebeSekmeleri } from "./ortak";
import stil from "./muhasebe.module.css";

type Pen = null | { g: GiderSatiri | null; is?: string };
const tekil = (l: [string, string][]) => [...new Map(l)].sort((a, b) => a[1].localeCompare(b[1], "tr"));

function tanim(l: readonly GiderSatiri[]): SuzgecTanimi<GiderSatiri> {
  return {
    ad: "Giderlerde ara", ipucu: "Gider no, iş, açıklama", birim: "gider", sayfa: 20, imkansiz: "Bir gider aynı anda iki durumda olamaz",
    metin: (g) => [g.no, GIDER_TUR[g.tur][0], g.aciklama ?? "", g.is?.no ?? "", g.is?.musteri ?? "", g.personel?.ad ?? ""].join(" "),
    cipler: [
      { k: "bekliyor", ad: "Onay bekliyor", grup: "durum", test: (g) => g.durum === "bekliyor" },
      { k: "onaylandi", ad: "Ödenecek", grup: "durum", test: (g) => g.durum === "onaylandi" },
      { k: "belgesiz", ad: "Belgesi yok", test: (g) => !g.belge },
    ],
    seciciler: [
      { k: "bag", ad: "İş", secenek: () => [["tumu", "Tümü"], ["is", "İşe bağlı"], ["genel", "Genel"]], gecer: (g, v) => v === "tumu" || (v === "is") === !!g.is },
      { k: "tur", ad: "Tür", secenek: () => [["tumu", "Tümü"], ...Object.entries(GIDER_TUR).map(([k, [ad]]) => [k, ad] as [string, string])], gecer: (g, v) => v === "tumu" || g.tur === v },
      { k: "ay", ad: "Dönem", secenek: () => [["tumu", "Tümü"], ...[...new Set(l.map((g) => g.tarih.slice(0, 7)))].sort().reverse().map((a) => [a, ayAd(a)] as [string, string])],
        gecer: (g, v) => v === "tumu" || g.tarih.slice(0, 7) === v },
      { k: "kisi", ad: "Personel", secenek: () => [["tumu", "Tümü"], ...tekil(l.filter((g) => g.personel).map((g) => [g.personel!.id, g.personel!.ad]))],
        gecer: (g, v) => v === "tumu" || g.personel?.id === v },
    ],
  };
}

function sutunlar(ac: (g: GiderSatiri) => void, isIcinde: boolean): Sutun<GiderSatiri>[] {
  return [
    { k: "no", genislik: isIcinde ? "18%" : "14%", baslik: "Gider no", kart: "ust", sira: 1, hucre: (g) => (
      <><button type="button" className={stil.noTus} onClick={() => ac(g)}>{g.no}</button><AltSatir>{tarihNo(g.tarih)}</AltSatir></>
    ) },
    { k: "tur", genislik: isIcinde ? "24%" : "20%", baslik: "Tür / açıklama", kart: "govde", sira: 2, hucre: (g) => (
      <span>{GIDER_TUR[g.tur][0]}{g.aciklama && <AltSatir><Kirp>{g.aciklama}</Kirp></AltSatir>}</span>
    ) },
    isIcinde
      ? { k: "kisi", genislik: "18%", baslik: "Personel", kart: "govde", sira: 3, hucre: (g) => <><KartEtiket>Personel</KartEtiket>{g.personel ? g.personel.ad : <DegerYok />}</> }
      : { k: "bag", genislik: "20%", baslik: "İş / personel", kart: "govde", sira: 3, hucre: (g) => (
          <span>{g.is ? <><Link className={stil.no} href={`/muhasebe/is/${g.is.id}`}>{g.is.no}</Link><AltSatir><Kirp>{[g.is.musteri, g.personel?.ad].filter(Boolean).join(" · ")}</Kirp></AltSatir></>
            : <>Genel{g.personel && <AltSatir><Kirp>{g.personel.ad}</Kirp></AltSatir>}</>}</span>
        ) },
    { k: "tutar", genislik: "16%", baslik: "Tutar (KDV dahil)", kart: "govde", sira: 4, hucre: (g) => (
      <><KartEtiket>Tutar (KDV dahil)</KartEtiket><span><span className={stil.sayi}>{para(g.tutar)}</span><AltSatir>KDV %{g.oran} · {para(g.kdv)}</AltSatir></span></>
    ) },
    { k: "durum", genislik: "15%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (g) => (
      <span><Rozet tur={GIDER_DURUM[g.durum][1]}>{GIDER_DURUM[g.durum][0]}</Rozet>
        <AltSatir>{g.durum === "odendi" && g.odeme ? tarihNo(g.odeme) : g.kaynak === "form" ? "masraf formu" : "muhasebe"}</AltSatir></span>
    ) },
    { k: "belge", genislik: "15%", baslik: "Belge", kart: "eylem", sira: 9, hucre: (g) => (
      g.belge ? <DosyaAcTusu dosyaId={g.belge} ikon="file-text" etiket={`${g.no} belgesi`}>Belge</DosyaAcTusu> : <span className={stil.uyari}>Belge yok</span>
    ) },
  ];
}
function Toplam({ l }: { l: readonly GiderSatiri[] }) {
  const t = l.reduce((n, g) => ({ haric: n.haric + g.haric, kdv: n.kdv + g.kdv, top: n.top + g.tutar }), { haric: 0, kdv: 0, top: 0 });
  return (
    <BilgiListesi>
      <Bilgi etiket="KDV hariç">{para(t.haric)}</Bilgi>
      <Bilgi etiket="KDV">{para(t.kdv)}</Bilgi>
      <Bilgi etiket="Toplam"><b>{para(t.top)}</b></Bilgi>
    </BilgiListesi>
  );
}
const toplamTL = (l: readonly GiderSatiri[]) => para(l.reduce((n, g) => n + g.tutar, 0));

/** Giderler sekmesi */
export function GiderListesi({ giderler, secenekler, bugun, bordro = false }: { giderler: GiderSatiri[]; secenekler: GiderSecenekleri | null; bugun: string; bordro?: boolean }) {
  const s = useSuzgec(tanim(giderler), giderler);
  const [p, setP] = useState<Pen>(null);
  const bek = giderler.filter((g) => g.durum === "bekliyor"), bel = giderler.filter((g) => !g.belge);
  const goster = (k: string) => s.degistir({ ...s.durum, secili: [k], kip: "veya", sayfa: 1 });
  return (
    <>
      <SayfaBasi baslik="Muhasebe" sayac={<Sayac s={s} />} tuslar={<>
        <GiderExcelAktar l={s.sonuc.liste} />
        {secenekler && <GiderExcelYukle secenekler={secenekler} bugun={bugun} />}
        {bordro && <BordroGonderTusu />}
        {secenekler && <Tus ikon="plus" onClick={() => setP({ g: null })}>Gider ekle</Tus>}
      </>} />
      <MuhasebeSekmeleri secili="/muhasebe/giderler" />
      {(bek.length > 0 || bel.length > 0) && <SeritKap>
        {bek.length > 0 && <Serit tur="bilgi" ikon="receipt"><b>Onay bekleyen masraf:</b> {bek.length} · {toplamTL(bek)}{" "}
          <Tus tur="ikincil" onClick={() => goster("bekliyor")}>Göster</Tus></Serit>}
        {bel.length > 0 && <Serit tur="uyari" ikon="triangle-alert"><b>Belgesi yok:</b> {bel.length} gider · {toplamTL(bel)}{" "}
          <Tus tur="ikincil" onClick={() => goster("belgesiz")}>Göster</Tus></Serit>}
      </SeritKap>}
      <SuzgecliListe s={s} on="g" baslik="Giderler" sutunlar={sutunlar((g) => setP({ g }), false)} anahtar={(g) => g.id}
        bosVeri={{ ikon: "receipt", baslik: "Gider yok", metin: "“Gider ekle” ile fişi ya da faturası eklenir." }} />
      {s.sonuc.liste.length > 0 && <Toplam l={s.sonuc.liste} />}
      {p && <GiderPenceresi g={p.g} sabitIs={p.is} secenekler={secenekler} bugun={bugun} kapat={() => setP(null)} />}
    </>
  );
}

/** iş sayfasının "Giderler" bölümü (maket isCiz a-b-gider: başlıkta sayaç ve "Gider ekle"; GI_SUTUN) */
export function IsGiderleri({ giderler, secenekler, isId, isNo, bugun }: { giderler: GiderSatiri[]; secenekler: GiderSecenekleri | null; isId: string; isNo: string; bugun: string }) {
  const [p, setP] = useState<Pen>(null);
  return (
    <Bolum id="b-is-gider" baslik="Giderler" sayac={<><b>{giderler.length}</b> gider</>}
      tuslar={secenekler ? <Tus tur="ikincil" ikon="plus" onClick={() => setP({ g: null, is: isId })}>Gider ekle</Tus> : undefined}>
      {giderler.length ? <Liste baslik="İşin giderleri" sutunlar={sutunlar((g) => setP({ g }), true)} kayitlar={giderler} anahtar={(g) => g.id} />
        : <p className={stil.ozet}>Henüz gider yok.</p>}
      {p && <GiderPenceresi g={p.g} sabitIs={p.is} sabitIsNo={isNo} secenekler={secenekler} bugun={bugun} kapat={() => setP(null)} />}
    </Bolum>
  );
}

/* ── GİDER PENCERESİ ── */
const GID = { tarih: "w-gider-tarih", tur: "w-gider-tur", tutar: "w-gider-tutar", oran: "w-gider-oran", aciklama: "w-gider-aciklama", is: "w-gider-is",
  personel: "w-gider-personel", belge: "w-gider-belge", odeme: "w-gider-odeme", gerekce: "w-gider-gerekce" } as const;
const tlYaz = (kurus: number) => (kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function GiderPenceresi({ g, sabitIs, sabitIsNo, secenekler, bugun, kapat }: {
  g: GiderSatiri | null; sabitIs?: string; sabitIsNo?: string; secenekler: GiderSecenekleri | null; bugun: string; kapat: () => void;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState({ tarih: g?.tarih ?? bugun, tur: g?.tur ?? "", tutar: g ? tlYaz(g.tutar) : "", oran: String(g?.oran ?? 20), aciklama: g?.aciklama ?? "",
    is: g?.is?.id ?? sabitIs ?? "", personel: g?.personel?.id ?? "", odeme: "odendi" });
  const [belge, setBelge] = useState<"var" | "kaldir" | null>(g?.belge ? "var" : null);
  const [red, setRed] = useState<string | null>(null);
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const dosya = useRef<HTMLInputElement>(null);
  const yaz = !!secenekler && g?.durum !== "red";
  const tp = tutarSema.safeParse(d.tutar);
  const kdv = tp.success && tp.data > 0 ? giderKdv(tp.data, Number(d.oran)) : null;
  /* ayrılan personel ya da eski iş seçeneklerde yoksa kayıttaki değer korunur */
  const isler = [...(secenekler?.isler ?? [])];
  if (g?.is && !isler.some((x) => x.id === g.is!.id)) isler.unshift({ id: g.is.id, no: g.is.no, musteri: g.is.musteri, tarih: "" });
  const kisiler = [...(secenekler?.kisiler ?? [])];
  if (g?.personel && !kisiler.some((x) => x.id === g.personel!.id)) kisiler.push(g.personel);
  const odakla = (k?: string) => { if (k) requestAnimationFrame(() => document.getElementById(GID[k as keyof typeof GID] ?? GID.tutar)?.focus()); };
  const kaydet = (sonra: "onaylandi" | "odendi" | null) => baslat(async () => {
    const f = new FormData();
    for (const [k, v] of Object.entries(d)) f.set(k, v);
    if (g) { f.set("id", g.id); f.set("surum", String(g.surum)); }
    if (sonra) f.set("sonra", sonra);
    const secilen = dosya.current?.files?.[0];
    if (secilen) f.set("belge", secilen); else if (belge === "kaldir") f.set("belgeKaldir", "1");
    const r = await giderKaydetEylemi(f);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { odakla(Object.keys(r.hatalar ?? {})[0]); return; }
    kapat(); bildir(r.bildirim ?? "Gider kaydedildi."); router.refresh();
  });
  const reddet = () => baslat(async () => {
    const r = await giderReddetEylemi(g!.id, g!.surum, { gerekce: red ?? "" });
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { odakla(r.hatalar?.gerekce ? "gerekce" : undefined); return; }
    kapat(); bildir(r.bildirim ?? "Gider reddedildi."); router.refresh();
  });
  const baslik = g ? `Gider · ${g.no}` : `Gider ekle${sabitIsNo ? ` · ${sabitIsNo}` : ""}`;
  if (red !== null && g) {
    return (
      <Pencere acik baslik={baslik} onKapat={() => { if (!bekliyor) kapat(); }} odak={`#${GID.gerekce}`}
        alt={<><Tus tur="ikincil" disabled={bekliyor} onClick={() => { setRed(null); setH({}); odakla("tutar"); }}>Vazgeç</Tus>
          <Tus ikon="ban" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={reddet}>Reddet</Tus></>}>
        <p className={pencereMetinSinifi}><b>{g.no}</b> · {GIDER_TUR[g.tur][0]} · {para(g.tutar)}{g.personel && ` · ${g.personel.ad}`}</p>
        {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
        <Alan id={GID.gerekce} etiket="Red gerekçesi" zorunlu hata={h.gerekce} sonuc={h.gerekce ? undefined : "En az 5 karakter; denetçi plan içinde görür."}>
          <textarea id={GID.gerekce} className={stil.metin} maxLength={200} value={red} aria-invalid={!!h.gerekce || undefined} aria-describedby={ipucuId(GID.gerekce)}
            onChange={(e) => setRed(e.target.value)} />
        </Alan>
      </Pencere>
    );
  }
  return (
    <Pencere acik genis baslik={baslik} onKapat={() => { if (!bekliyor) kapat(); }} odak={`#${g ? GID.tutar : GID.tur}`}
      alt={<>
        <Tus tur="ikincil" disabled={bekliyor} onClick={kapat}>{yaz ? "Vazgeç" : "Kapat"}</Tus>
        {/* 341: masraf formunun PDF'i (talep edenle aynı form) */}
        {g?.kaynak === "form" && <a className={tusSinifi("ikincil")} href={`/talepler/pdf/masraf/${g.id}`} download><Ikon ad="file-text" kucuk />PDF</a>}
        {yaz && (g?.durum === "bekliyor" ? <>
          <Tus tur="ikincil" ikon="ban" disabled={bekliyor} onClick={() => { setRed(""); setH({}); setGenel(null); odakla("gerekce"); }}>Reddet</Tus>
          <Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={() => kaydet("onaylandi")}>Onayla</Tus>
        </> : g?.durum === "onaylandi" ? <>
          <Tus tur="ikincil" ikon="check" disabled={bekliyor} onClick={() => kaydet(null)}>Kaydet</Tus>
          <Tus ikon="wallet" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={() => kaydet("odendi")}>Ödendi</Tus>
        </> : <Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={() => kaydet(null)}>{g ? "Kaydet" : "Gideri kaydet"}</Tus>)}
      </>}>
      {g && <p className={pencereMetinSinifi}><Rozet tur={GIDER_DURUM[g.durum][1]}>{GIDER_DURUM[g.durum][0]}</Rozet>{" "}
        {g.kaynak === "form" ? `Masraf formu${g.personel ? ` · ${g.personel.ad}` : ""}` : "Muhasebe kaydı"}{g.durum === "odendi" && g.odeme && ` · ödendi ${tarihNo(g.odeme)}`}
        {g.red && <><br /><span className={stil.uyari}>Red gerekçesi: {g.red}</span></>}</p>}
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      {!yaz && g ? <BilgiListesi>
        <Bilgi etiket="Tarih">{tarihNo(g.tarih)}</Bilgi>
        <Bilgi etiket="Tür">{GIDER_TUR[g.tur][0]}</Bilgi>
        <Bilgi etiket="Tutar (KDV dahil)">{para(g.tutar)}<AltSatir>KDV %{g.oran} · {para(g.kdv)}</AltSatir></Bilgi>
        <Bilgi etiket="İş">{g.is ? `${g.is.no} · ${g.is.musteri}` : "Genel gider"}</Bilgi>
        <Bilgi etiket="Personel">{g.personel?.ad ?? <DegerYok />}</Bilgi>
        <Bilgi etiket="Açıklama">{g.aciklama ?? <DegerYok />}</Bilgi>
        <Bilgi etiket="Belge">{g.belge ? <DosyaAcTusu dosyaId={g.belge} ikon="file-text">Belge</DosyaAcTusu> : <span className={stil.uyari}>Belge yok</span>}</Bilgi>
      </BilgiListesi> : <div className={stil.form}>
        <Alan id={GID.tarih} etiket="Tarih" zorunlu hata={h.tarih}>
          <TarihAlani id={GID.tarih} ad="Gider tarihi" deger={d.tarih} degistir={(x) => setD({ ...d, tarih: x })} tanim={h.tarih ? ipucuId(GID.tarih) : undefined} />
        </Alan>
        <Alan id={GID.tur} etiket="Tür" zorunlu hata={h.tur}>
          <SecimAlani id={GID.tur} ad="Tür" deger={d.tur} ipucu="Tür seçin" gecersiz={!!h.tur} tanim={h.tur ? ipucuId(GID.tur) : undefined}
            secenekler={Object.entries(GIDER_TUR).map(([k, [ad]]) => [k, ad] as const)}
            degistir={(x) => setD({ ...d, tur: x, oran: x in GIDER_TUR ? String(GIDER_TUR[x as GiderTuru][1]) : d.oran })} />
        </Alan>
        <Alan id={GID.tutar} etiket="Tutar (KDV dahil)" zorunlu hata={h.tutar}>
          <Girdi id={GID.tutar} value={d.tutar} inputMode="decimal" maxLength={18} hata={!!h.tutar} mesajli={!!h.tutar} onChange={(e) => setD({ ...d, tutar: e.target.value })} />
        </Alan>
        <Alan id={GID.oran} etiket="KDV oranı" hata={h.oran} sonuc={kdv && !h.oran ? `KDV ${para(kdv.kdv)} · KDV hariç ${para(kdv.haric)}` : undefined}>
          <SecimAlani id={GID.oran} ad="KDV oranı" deger={d.oran} gecersiz={!!h.oran} secenekler={KDV_ORAN.map((o) => [String(o), `%${o}`] as const)}
            degistir={(x) => setD({ ...d, oran: x })} tanim={kdv || h.oran ? ipucuId(GID.oran) : undefined} />
        </Alan>
        <div className={stil.genis}>
          <Alan id={GID.aciklama} etiket="Açıklama" hata={h.aciklama}>
            <Girdi id={GID.aciklama} value={d.aciklama} maxLength={120} hata={!!h.aciklama} mesajli={!!h.aciklama} onChange={(e) => setD({ ...d, aciklama: e.target.value })} />
          </Alan>
        </div>
        <Alan id={GID.is} etiket="İş" hata={h.is}>
          <SecimAlani id={GID.is} ad="İş" deger={d.is} gecersiz={!!h.is} tanim={h.is ? ipucuId(GID.is) : undefined}
            secenekler={[["", "Genel gider"], ...isler.map((x) => [x.id, `${x.no} · ${x.musteri}`, x.tarih ? tarihNo(x.tarih) : ""] as const)]}
            degistir={(x) => setD({ ...d, is: x })} />
        </Alan>
        <Alan id={GID.personel} etiket="Personel" hata={h.personel}>
          <SecimAlani id={GID.personel} ad="Personel" deger={d.personel} gecersiz={!!h.personel} tanim={h.personel ? ipucuId(GID.personel) : undefined} kapali={g?.kaynak === "form"}
            secenekler={[["", "Seçilmedi"], ...kisiler.map((x) => [x.id, x.ad] as const)]} degistir={(x) => setD({ ...d, personel: x })} />
        </Alan>
        <div className={stil.genis}>
          <Alan id={GID.belge} etiket={belge === "var" ? "Belgeyi değiştir (PDF ya da fotoğraf)" : "Belge (PDF ya da fotoğraf)"} hata={h.belge}
            sonuc={h.belge ? undefined : "Fiş ya da fatura; yoksa gider yine kaydedilir, listede “Belge yok” görünür."}>
            <input ref={dosya} id={GID.belge} className={stil.dosya} type="file" accept="application/pdf,image/jpeg,image/png" aria-describedby={ipucuId(GID.belge)}
              aria-invalid={!!h.belge || undefined} />
          </Alan>
          {g?.belge && <p className={stil.ozet}>
            {belge === "kaldir" ? <>Belge kaydedince kaldırılır. <Tus tur="ikincil" onClick={() => setBelge("var")}>Geri al</Tus></>
              : <><DosyaAcTusu dosyaId={g.belge} ikon="file-text">Mevcut belge</DosyaAcTusu> <Tus tur="ikincil" ikon="x" onClick={() => setBelge("kaldir")}>Belgeyi kaldır</Tus></>}
          </p>}
        </div>
        {!g && <Alan id={GID.odeme} etiket="Ödeme">
          <SecimAlani id={GID.odeme} ad="Ödeme" deger={d.odeme} secenekler={[["odendi", "Ödendi"], ["onaylandi", "Ödenecek"]]} degistir={(x) => setD({ ...d, odeme: x })} />
        </Alan>}
      </div>}
    </Pencere>
  );
}

/* ── EXCEL ── */
/** "Excel'e aktar": süzülen liste (maket gider-excel-disa) */
function GiderExcelAktar({ l }: { l: readonly GiderSatiri[] }) {
  const [acik, setAcik] = useState(false);
  const ad = `giderler-${dosyaGunu().slice(0, 7)}.xlsx`;
  const indir = () => baytIndir(ad, giderExceli(l.map((g) => ({ no: g.no, tarih: g.tarih, tur: g.tur, tutar: g.tutar, oran: g.oran, aciklama: g.aciklama, isNo: g.is?.no ?? null,
    personel: g.personel?.ad ?? null, durum: g.durum, odeme: g.odeme, belge: !!g.belge }))), XLSX_TURU);
  return (
    <>
      <Tus tur="ikincil" ikon="download" onClick={() => setAcik(true)}>Excel&apos;e aktar</Tus>
      <Pencere acik={acik} baslik="Excel'e aktar · Giderler" onKapat={() => setAcik(false)} odak="#w-gider-indir"
        alt={<><Tus tur="ikincil" onClick={() => setAcik(false)}>Kapat</Tus><Tus id="w-gider-indir" ikon="download" disabled={!l.length} onClick={indir}>İndir</Tus></>}>
        <p className={pencereMetinSinifi}><b>{l.length} gider</b> · {ad} · {toplamTL(l)}</p>
        <p className={stil.ozet}>Listede süzülen satırlar aktarılır: gider no, tarih, tür, tutar, KDV, açıklama, proje no, personel, durum, ödeme tarihi, belge.</p>
      </Pencere>
    </>
  );
}

/** "Excel'den yükle" (maket gider-excel-ice): şablon, dosya seç, satır satır önizleme, "Yükle (n)" */
function GiderExcelYukle({ secenekler, bugun }: { secenekler: GiderSecenekleri; bugun: string }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [acik, setAcik] = useState(false);
  const [dosya, setDosya] = useState<{ ad: string; ham: string[][]; satirlar: GiderExcelSatiri[] } | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const girdi = useRef<HTMLInputElement>(null);
  const ok = dosya?.satirlar.filter((x) => x.ok) ?? [];
  const planlar = new Map(secenekler.isler.map((x) => [x.no, x.id]));
  const sec = async (f: File | undefined) => {
    if (!f) return;
    setHata(null);
    try {
      /* yalnız kullanılan 6 sütun, hücre en çok 1 000 karakter (sunucu da böyle bekler; uzun açıklama satırda atlanır) */
      const ham = (await tabloOku(f.name, new Uint8Array(await f.arrayBuffer()))).map((r) => r.slice(0, 6).map((c) => c.slice(0, 1000)));
      if (ham.length > GIDER_EXCEL_SINIR + 1) throw new TabloHatasi(`en çok ${GIDER_EXCEL_SINIR} satır`);
      setDosya({ ad: f.name, ham, satirlar: giderSatirlari(ham, planlar, bugun) });
    } catch (e) {
      setDosya(null);
      setHata(`${f.name} okunamadı: ${e instanceof TabloHatasi ? e.message : ".xlsx ya da .csv seçin."}`);
    } finally {
      if (girdi.current) girdi.current.value = "";
    }
  };
  const kapat = () => { if (bekliyor) return; setAcik(false); setDosya(null); setHata(null); };
  const yukle = () => baslat(async () => {
    if (!dosya) return;
    const r = await giderExceliYukleEylemi(dosya.ham);
    if (!r.tamam) { setHata(r.genel ?? "Yüklenemedi."); return; }
    const atla = dosya.satirlar.length - ok.length;
    setAcik(false); setDosya(null);
    bildir(`${r.bildirim ?? "Giderler eklendi."}${atla ? ` ${atla} satır atlandı.` : ""}`); router.refresh();
  });
  return (
    <>
      <Tus tur="ikincil" ikon="upload" onClick={() => setAcik(true)}>Excel&apos;den yükle</Tus>
      <Pencere acik={acik} genis baslik="Excel'den yükle · Giderler" onKapat={kapat} odak="#w-gider-excel-sec"
        alt={<>
          <Tus tur="ikincil" disabled={bekliyor} onClick={kapat}>Vazgeç</Tus>
          <Tus ikon="upload" disabled={bekliyor || !ok.length} aria-busy={bekliyor || undefined} onClick={yukle}>{dosya ? `Yükle (${ok.length})` : "Yükle"}</Tus>
        </>}>
        <p className={pencereMetinSinifi}>Sütunlar: {GIDER_SABLON.join(" · ")}. İlk satır başlıksa atlanır; geçerli satırlar “Ödendi” olarak, muhasebe kaydıyla eklenir.</p>
        <div className={stil.dosyaSec}>
          <Tus tur="ikincil" ikon="file-spreadsheet" onClick={() => baytIndir("gider-yukleme-sablonu.xlsx", giderSablonu(), XLSX_TURU)}>Şablonu indir</Tus>
          <Tus id="w-gider-excel-sec" tur="ikincil" ikon="upload" onClick={() => girdi.current?.click()}>{dosya ? "Başka dosya seç" : "Dosya seç"}</Tus>
          <span className={dosya ? stil.dosyaAd : stil.ozet}>{dosya?.ad ?? "Dosya seçilmedi"}</span>
          <input ref={girdi} type="file" hidden accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            aria-label="Excel ya da CSV dosyası" onChange={(e) => void sec(e.target.files?.[0])} />
        </div>
        {hata && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
        {dosya && (dosya.satirlar.length
          ? <div className={stil.onizlemeKap}>
              <table className={stil.onizleme}>
                <caption className="gizli">Dosyadaki satırlar</caption>
                <thead><tr><th scope="col">Satır</th><th scope="col">Gider</th><th scope="col">Tutar</th><th scope="col">Durum</th></tr></thead>
                <tbody>
                  {dosya.satirlar.map((x) => (
                    <tr key={x.satir}>
                      <td className={stil.sayi}>{x.satir}</td>
                      <td>{x.tarih ? tarihNo(x.tarih) : x.tarihYazi} · {x.tur ? GIDER_TUR[x.tur][0] : x.turYazi}{x.aciklama && <span className={stil.altSatir}>{x.aciklama}</span>}
                        {x.projeNo && <span className={stil.altSatir}>{x.projeNo}</span>}</td>
                      <td className={stil.sayi}>{x.tutar ? para(x.tutar) : x.tutarYazi}{x.tutar !== null && <span className={stil.altSatir}>KDV %{x.oran}</span>}</td>
                      <td>{x.ok ? <Rozet tur="tamam">Eklenecek</Rozet> : <span className={stil.uyari}>{x.neden}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          : <p className={stil.ozet}>Dosyada gider satırı yok.</p>)}
      </Pencere>
    </>
  );
}
