"use client";
/* SAHA RAPORU · BLOKLAR — formatın her blok türü için TEK çizici (RAPOR-FORMAT.md §2, §7; maket maket-rapor.js bolum, kriterHtml, topluMenu,
   tekSecim, bilgiAlan, olcumHtml, kusurHtml, sonucCumle; rapor.html M8). Formatın bölümleri tanımdaki sırayla çizilir; cevaplar kimlikle yazılır
   (format/tanim.ts Cevaplar). Değerlendirme (kusurlar, satır sonuçları, test sınırları, sonuç önerisi) tarayıcıda format motorundan CANLI —
   sunucu Onaya gönder'de aynı motorla yeniden hesaplar, istemcinin hesabına güvenilmez.
   · bilgi: kayıttan gelen alan (firma, adres, SGK, İSG-KATİP, kontrol tarihi, rapor no, ekipman kodu / adı, seri no, kullanım yeri) salt okunur;
     ötekiler türüne göre yazılır / seçilir.
   · liste: madde başına Uygun · Uygun değil · Uygulanamaz (formatın cevap seti; reisim 2026-09-26); olumsuz cevapta kusur açıklaması, formatta
     derece açıksa (AA9: başlangıçta kapalı) kusur derecesi; bölüm başlığında sayaç ve "Hepsini işaretle" (reisim 2026-09-28/29).
   · olcum: satır ekle / kaldır; satır sonucu formatın hesabından ve sütun sınırlarından; uygunluk notu formatta varsa seçilir (P2, Not-1 …).
   · foto: bölümün fotoğrafları (FotoListesi; en az formatın enAz'ı — hazır şablonlarda 1); "Uygun değil" maddede de fotoğraf eklenir, Kusur
     açıklamalarında adıyla görünür (O2). Her girdinin etiketi var (görünür ya da aria-label); Onaya gönder'in işaretlediği
     boş zorunlu alan aria-invalid + kırmızı çerçeve, doldurulunca kalkar (maket zorunluEksik / uyar).
   472 (maket kararı k2): formatta "yan yana tuşlar" seçildiyse madde cevabı açılır liste yerine tuşlardır (tek dokunuş).
   483 (reisim 2026-10-10: "rapor düzenlemede sadece saha ekranı gözüksün o ekranda düzenleme yapılamasın … sadece sahada personelin nasıl
   göreceği gözüksün"): 473'ün saha ekranında yerinde düzenlemesi (Baglam.yerinde) KALKTI — format yalnız kâğıtta düzenlenir.
   486 (reisim 2026-10-10): ölçüm tablosunda "Son satırı kopyala" (kimlik / no bir artar — ../tablo.ts); sıra sütunu formatın kendi "No"su varken
   "Sıra" (duzen.ts siraBasligi); tablonun altında "Sonuç neye göre çıkar?" (motor.ts sonucKurallari); "Fotoğraf ekle" her zaman (okumaKipi; 542:
   fotoğraf okunmadan eklenir, S.A.Y okur). 488 (reisim 2026-10-11: "sağdaki kopyalama işareti kalksın … sırala tuşu da kalksın … son satırı kopyala diyince sıra no değişerek
   iniyor"): satırın kopyala işareti ve "Sırala" KALKTI, işlem sütunu yapışık değil (Sonuç sütununun üstüne biniyordu); satır sonucu gerekçeyle elle
   değiştirilir (ElleSonuc — hata listesi 54). 2026-10-12 (reisim): bölümün fotoğraf tuşu bölüm başlığında (BaslikYuvasi.tsx), telefonda simge.
   556 (sunum 556 · 2. tur — reisim 2026-10-14: "görüntüdeki gibi değiştirilemez olmasın … dışarıdan diğer kutular ile aynı gözüksün, şu işlemlerin
   sonucudur gibi açıklama olmasın"): formüllü kutu öteki kutular gibidir (HesapGirdi) — boşken formülün değeri, yazılan kalır.
   2026-10-16 (reisim: "herhangi bir tabloda 20 den sonrası sayfalı olacak … herhangi bir liste tablo … 20 den fazlası sayfalı olsun diğer sayfalara
   doğru aksın"): ölçüm tablosu ve kontrol listesi maddeleri 20'şer sayfalı; satır / madde numarası ve kimlikler GENEL. Açık sayfa rapor ekranında
   (Baglam.bolumSayfasi — hangi sayfanın açılacağı ../sayfa-yeri.ts'in tek kuralıyla SahaRaporu'nda); belge / PDF bütün satırları basar (src/belge). */
import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode, type TransitionStartFunction } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi } from "../../../components/form/Form";
import { Ikon } from "../../../components/ikon/Ikon";
import { useSurukleKaydir } from "../../../components/kaydir/useSurukleKaydir";
import { SayfaliListe, TabloSayfalari, useSayfa } from "../../../components/liste/Sayfalayici";
import { DegerYok, Kod, Rozet } from "../../../components/sayfa/Sayfa";
import { useDisariTiklama, type SecimSecenegi } from "../../../components/secim/SecenekListesi";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { tarihNo } from "../../../components/secim/tarih";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import { SINIR_ISARETI } from "../../../format/hesap";
import { ELLE_GEREKCE, ELLE_GEREKCE_EN_AZ, ELLE_SONUC, satirAnahtari, sonucKurallari, type Degerlendirme, type SatirDegerlendirmesi } from "../../../format/motor";
import { imzaSatirlari, olcumBasliklari, sonucMetinleri } from "../../../format/duzen";
import { formulluAlan, formulluDeger, formulluMadde, formulluSutun, type FormulYeri } from "../../../format/formul";
import { doldurma, ekAnahtari, HAZIR_AD, type Bolum, type BolumOf, type Cevaplar, type Sinir } from "../../../format/tanim";
import { meslek } from "../../personel/sema";
import { SONUC_AD } from "../sema";
import type { SahaRaporu } from "../server/raporlar";
import { bilgiAlanlari, testAlanlari } from "../doldur";
import { BaslikBaglami } from "./BaslikYuvasi";
import { okunanHedefleri, okunanlariUygula } from "../foto-eslestir";
import { maddeDilimi } from "../sayfa-yeri";
import { satirKopyala } from "../tablo";
import { AlanDoldurma, ExcelYukle, FotoBolumu, OkumaFotolari, type OkumaKipi } from "./Doldurma";
import { StandartTusu, TalimatTusu, type TalimatParcasi } from "./Kaynaklar";
import stil from "./raporlar.module.css";

/** alan anahtarı → ekrandaki girdinin id'si. Anahtarlar motorun ve sunucunun eksik listesiyle aynı: madde / alan / değer kimliği, "tarih.bas",
    "<madde>.derece", satirAnahtari ("<bölüm>#<sıra>.<sütun>"), "cihaz.<tür>". Kimlikte tire olmaz (tanim.ts) → ayraç tire, çakışma yok. */
export const alanId = (alan: string) => `r-${alan.replace(/[#.]/g, "-")}`;
const virgul = (n: number) => String(n).replace(".", ",");
const sinirMetni = (op?: Sinir, s?: number, birim?: string) => (op && s !== undefined ? `${SINIR_ISARETI[op]} ${virgul(s)}${birim ? ` ${birim}` : ""}` : null);
const EVET: readonly SecimSecenegi[] = [["evet", "Evet"], ["hayir", "Hayır"]];
const DERECE: readonly SecimSecenegi[] = [["hafif", "Hafif kusur"], ["agir", "Ağır kusur"]];
const SONUC: readonly SecimSecenegi[] = [["uygun", SONUC_AD.uygun], ["uygun_degil", SONUC_AD.uygun_degil]];
const IMZA = { uzman: "Muayene uzmanı", teknik: "Teknik yönetici", diger: "Öteki satırlar" } as const;
const etiketi = (l: readonly SecimSecenegi[], v: string) => l.find((o) => o[0] === v)?.[1] ?? "";

export type Kaynak = NonNullable<BolumOf<"bilgi">["alanlar"][number]["kaynak"]>;
type MaddeCevabi = Cevaplar["madde"][string];
/** blokların ortak bağlamı (SahaRaporu kurar) */
export interface Baglam {
  v: SahaRaporu;
  c: Cevaplar;
  /** cevapları değiştirir (kaydedilmemiş değişiklik olur) */
  yaz: (f: (c: Cevaplar) => Cevaplar) => void;
  d: Degerlendirme;
  /** gönderilmiş ya da başkasının raporu: her şey salt okunur */
  oku: boolean;
  /** Onaya gönder bu alanı eksik dedi ve alan hâlâ boş */
  gecersiz: (alan: string) => boolean;
  /** 495: formüllerin değeriyle cevaplar (format/formul.ts formulUygula — motorla aynı); formüllü kutu bunu gösterir */
  h: Cevaplar;
  /** 556: kutunun yalnız formülden gelen değeri (kendi yazılanı yokmuş gibi — format/formul.ts formulDegeri) */
  hesap: (yer: FormulYeri) => string | string[] | null;
  /** kayıttan gelen alanın ekrandaki değeri (seri no, kullanım yeri, kontrol tarihi raporun güncel hâliyle; 492: künye bilgisi denetçinin 1. bölümde
      değiştirdiği hâliyle) */
  kaynak: (k: Kaynak) => string | null;
  /** ekipman kaydına bağlı alanın satırı (460): değeri raporun ekipman bilgisinde — SahaRaporu çizer */
  ekipmanAlani: (a: BolumOf<"bilgi">["alanlar"][number]) => ReactNode;

  /** formatın cihaz bölümü (CihazBolumu; SahaRaporu verir — döngüsel içe aktarma olmasın) */
  cihaz: (bolumId: string) => ReactNode;
  /** fotoğraf listesi: bölümün (madde null) ya da "Uygun değil" maddenin (FotoListesi; SahaRaporu verir) */
  foto: (bolumId: string, madde: string | null) => ReactNode;
  /** "Fotoğraf ekle" (351 → 486 → 542): "ekle" fotoğraf okunmadan eklenir (S.A.Y "fotoğrafları oku ve gir" ile okur) · "deneme" örnek rapor ·
      null düzenlenemez (gönderilmiş rapor, cihazda açılmış yeni rapor) */
  okumaKipi: OkumaKipi | null;
  /** 484: format kurucusunun saha ekranındaki örnek rapor (fotoğraf okunmaz, ne olacağı söylenir; Excel yalnız ekranda) */
  deneme: boolean;
  /** üst ekranın işlemi (354): okuma sürerken Kaydet / Onaya gönder / öteki okumalar kapalı (FotoListesi gibi); okuma rapora fotoğraf ekleyince yenile */
  islem: { mesgul: boolean; baslat: TransitionStartFunction; yenile: () => void };
  /** 2026-10-16: ölçüm tablosunun / kontrol listesinin açık sayfası (20'den sonrası sayfalı) — SahaRaporu tutar: tablo değişince ilk değişen satırın,
      eksiğe git ve S.A.Y'ın işaretlediği maddenin sayfasını o açar (../sayfa-yeri.ts) */
  bolumSayfasi: (bolumId: string) => number;
  bolumSayfaGit: (bolumId: string, sayfa: number) => void;
}

/* ── ORTAK PARÇALAR ──────────────────────────────────────────────────────────────────────────────────────────── */
/** bölüm kartı: "N · ad" başlığı, eksik rozeti, sayaç, başlık tuşları, aç / kapat (her başlık açılır kapanır — reisim 2026-09-26).
    445 (reisim 2026-10-09: "açılır kapanır ekranların başlık satırına basınca açılıp kapanmalı sadece kenardaki küçük bir açma kapama tuşu ile
    olmaz"): başlık satırının HER yerine basınca açılır / kapanır; satırdaki öteki tuş ve bağlantılar (talimat, standart, Hepsini işaretle …) kendi
    işini yapar. Klavye ve ekran okuyucu için kenardaki tuş kalır (aria-expanded); tıklaması da satıra kabarır — tek kez değişir.
    2026-10-12: başlık satırında içeriğin fotoğraf tuşu için yuva (BaslikYuvasi.tsx — tuş portalla gelir; React olayı içeriğin ağacında kabarır,
    satırın aç / kapat'ına gitmez). */
export function RaporBolumu({ id, no, baslik, acik, degistir, eksik = false, sayac, tuslar, ek, children }: {
  id: string; no: string | null; baslik: string; acik: boolean; degistir: (acik: boolean) => void; eksik?: boolean; sayac?: ReactNode; tuslar?: ReactNode;
  /** başlığın hemen yanında (430: adsız tek gruplu kontrol listesinin talimat ünlemi) */
  ek?: ReactNode; children: ReactNode;
}) {
  const b = `b-${id}`;
  const [yuva, setYuva] = useState<HTMLElement | null>(null);
  return (
    <section className={stil.bolum} id={b} aria-labelledby={`${b}-b`}>
      <div className={`${stil.bolumBas} ${stil.bolumBasTik}`} onClick={(e) => {
        const t = e.target as HTMLElement, tus = t.closest("button, a, input, select, textarea, label, summary, [role=button], [role=menuitem], [role=combobox], dialog");
        if (tus && !tus.classList.contains(stil.acTus)) return;
        degistir(!acik);
      }}>
        <h2 className={stil.bolumBaslik} id={`${b}-b`} tabIndex={-1}>{no && <span className={stil.bolumNo}>{no} · </span>}{baslik}</h2>
        {ek}
        {eksik && <Rozet tur="red">Eksik</Rozet>}
        {sayac}
        <div className={stil.bolumSag}>
          {tuslar}
          <span className={stil.basTuslari} ref={setYuva} />
          <button className={stil.acTus} type="button" aria-expanded={acik} aria-controls={`${b}-ic`} aria-label={`${baslik} bölümü`} title={acik ? "Kapat" : "Aç"}>
            <Ikon ad="chevron-down" kucuk />
          </button>
        </div>
      </div>
      <BaslikBaglami.Provider value={{ yuva, ac: () => { if (!acik) degistir(true); } }}>
        <div className={stil.bolumIc} id={`${b}-ic`} hidden={!acik}>{children}</div>
      </BaslikBaglami.Provider>
    </section>
  );
}

export function Satirlar({ children }: { children: ReactNode }) {
  return <dl className={stil.satirlar}>{children}</dl>;
}

/** etiket : değer satırı. Etiket metni alanın tam adıdır ("zorunlu" işareti etiketin dışında — erişilebilir ad değişmesin) */
export function Satir({ etiket, htmlFor, zorunlu = false, genis = false, children }:
  { etiket: string; htmlFor?: string; zorunlu?: boolean; genis?: boolean; children: ReactNode }) {
  const gorunum = htmlFor ? <label htmlFor={htmlFor}>{etiket}</label> : etiket;
  return (
    <div className={genis ? `${stil.satir} ${stil.satirGenis}` : stil.satir}>
      <dt>{gorunum}
        {zorunlu && <span className={stil.zorunlu}> zorunlu</span>}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** 556: formüllü yazı / sayı kutusu — öteki kutular gibi; değeri formülden (kendi yazılanı varsa o). Yazarken yazılan görünür (boşaltılan kutu hemen
    dolmaz); alandan çıkınca boşsa ya da formülün değeri yazıldıysa kutu yeniden formülden gelir (yaz(null): kendi değeri silinir) */
export function HesapGirdi({ id, deger, saf, yaz, ...ozellik }: { id: string; deger: string; saf: () => string | string[] | null; yaz: (x: string | null) => void }
  & Omit<ComponentProps<typeof Girdi>, "id" | "value" | "onChange" | "onBlur">) {
  const [taslak, setTaslak] = useState<string | null>(null);
  return <Girdi id={id} {...ozellik} value={taslak ?? deger} onChange={(e) => { setTaslak(e.target.value); yaz(e.target.value); }}
    onBlur={() => { if (taslak === null) return; const v = taslak.trim(); setTaslak(null); if (!v || v === saf()) yaz(null); }} />;
}
/** 556: formüllü seçim / tarih kutusunun yazıcısı — boş ya da formülün değeri seçilince kutu formülden gelir */
const hesapYazici = (saf: () => string | string[] | null, yaz: (x: string | null) => void) => (x: string) => yaz(!x || x === saf() ? null : x);
const ayniListe = (a: readonly string[], b: string | string[] | null) => Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i]);

/** salt okunur değer kutusu (maket okuGirdi): gönderilmiş raporda alan yerinde kalır */
export function OkuGirdi({ id, deger, ad }: { id: string; deger: string; ad?: string }) {
  return <Girdi id={id} readOnly value={deger || "-"} aria-label={ad} className={stil.oku} />;
}

/** tarih (saatli) alanı + Onaya gönder işareti: TarihAlani geçersizliği kendi tutar; eksik işaretini girdiye buradan koyar, kaldırınca yalnız kendi
    koyduğunu siler (yazılan bozuk tarihin işareti kalır) */
export function TarihKutusu({ id, ad, deger, degistir, saat = false, gecersiz = false, tanim }:
  { id: string; ad: string; deger: string; degistir: (v: string) => void; saat?: boolean; gecersiz?: boolean; tanim?: string }) {
  const koydu = useRef(false);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    if (gecersiz) { el.setAttribute("aria-invalid", "true"); koydu.current = true; }
    else if (koydu.current) { el.removeAttribute("aria-invalid"); koydu.current = false; }
  }, [id, gecersiz]);
  return (
    <div className={gecersiz ? `${stil.tarih} ${stil.gecersiz}` : stil.tarih}>
      <TarihAlani id={id} ad={ad} deger={deger} degistir={degistir} saat={saat} tanim={tanim} />
    </div>
  );
}

/** "Hepsini işaretle" (maket topluMenu): bölümün bütün maddelerini tek seferde işaretler; madde madde değiştirmek serbest */
function TopluMenu({ cevaplar, sec }: { cevaplar: readonly string[]; sec: (c: string) => void }) {
  const [acik, setAcik] = useState(false);
  const kap = useRef<HTMLDivElement>(null);
  const tus = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const kapat = useCallback(() => setAcik(false), []);
  useDisariTiklama(acik, kap, kapat);
  useEffect(() => { if (acik) kap.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus(); }, [acik]);
  const klavye = (e: KeyboardEvent) => {
    if (!acik) return;
    const l = Array.from(kap.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []), i = l.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setAcik(false); tus.current?.focus(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); l[(i + 1) % l.length]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); l[(i - 1 + l.length) % l.length]?.focus(); }
    else if (e.key === "Tab") setAcik(false);
  };
  return (
    <div className={stil.menuKap} ref={kap} onKeyDown={klavye}>
      <button ref={tus} className={tusSinifi("ikincil")} type="button" aria-haspopup="menu" aria-expanded={acik} aria-controls={acik ? menuId : undefined}
        onClick={() => setAcik(!acik)}>
        <Ikon ad="list-checks" kucuk />Hepsini işaretle
      </button>
      {acik && (
        <div className={stil.menu} id={menuId} role="menu" aria-label="Hepsini işaretle">
          {cevaplar.map((c) => (
            <button key={c} className={stil.menuOge} type="button" role="menuitem" onClick={() => { sec(c); setAcik(false); tus.current?.focus(); }}>
              {`Hepsini ${c} yap`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── FORMAT BÖLÜMÜ ───────────────────────────────────────────────────────────────────────────────────────────── */
export function FormatBolumu({ b, no, bag, acik, degistir, eksik }:
  { b: Bolum; no: string | null; bag: Baglam; acik: boolean; degistir: (acik: boolean) => void; eksik: boolean }) {
  const bildir = useBildir();
  let sayac: ReactNode = null, tuslar: ReactNode = null, ek: ReactNode = null;
  if (b.blok === "liste") {
    /* 430: adsız grubun başlığı yok — kontrolün talimat ünlemi bölüm başlığında (her zaman) */
    const adsiz = b.gruplar.find((g) => !g.ad);
    if (adsiz) ek = <TalimatTusu ad={b.ad} baslik={`Talimat · ${b.ad}`} parcalar={grupTalimati(adsiz, (m) => m.metin)} />;
    const maddeler = b.gruplar.flatMap((g) => g.maddeler);
    const n = maddeler.filter((m) => b.cevaplar.includes(bag.h.madde[m.id]?.c ?? "")).length;
    sayac = <span className={stil.sayac}><b>{n}</b> / {maddeler.length} madde</span>;
    if (!bag.oku && maddeler.length) tuslar = <TopluMenu cevaplar={b.cevaplar} sec={(c) => {
      bag.yaz((x) => ({ ...x, madde: { ...x.madde, ...Object.fromEntries(maddeler.map((m) => [m.id, { ...x.madde[m.id], c }])) } }));
      bildir(`${maddeler.length} madde “${c}” işaretlendi.`);
    }} />;
  }
  if (b.blok === "kusur") sayac = <span className={stil.sayac}><b>{bag.d.kusurlar.length}</b> kusur</span>;
  return (
    <RaporBolumu id={b.id} no={no} baslik={b.ad} acik={acik} degistir={degistir} eksik={eksik} sayac={sayac} tuslar={tuslar} ek={ek}>
      <BlokIcerik b={b} no={no} bag={bag} />
    </RaporBolumu>
  );
}

function BlokIcerik({ b, no, bag }: { b: Bolum; no: string | null; bag: Baglam }) {
  switch (b.blok) {
    case "bilgi": return <BilgiBlok b={b} bag={bag} />;
    case "liste": return <ListeBlok b={b} no={no} bag={bag} />;
    case "olcum": return <OlcumBlok b={b} bag={bag} />;
    case "test": return <TestBlok b={b} bag={bag} />;
    case "cihaz": return <>{bag.cihaz(b.id)}</>;
    /* 595 (madde 16): adlı fotoğraf kutuları — her biri kendi "Fotoğraf ekle"siyle; kutusuz fotoğraf da eklenir */
    case "foto": return b.kutular?.length
      ? <>{b.kutular.map((k) => (
        <div key={k.id} className={stil.madde}>
          <div className={stil.maddeSol}><p className={stil.maddeAd}>{k.ad}</p></div>
          <div className={stil.maddeCevap}>{bag.foto(b.id, k.id)}</div>
        </div>
      ))}<div className={stil.madde}><div className={stil.maddeSol}><p className={stil.maddeAd}>Diğer fotoğraflar</p></div>
        <div className={stil.maddeCevap}>{bag.foto(b.id, null)}</div></div></>
      : <>{bag.foto(b.id, null)}</>;
    case "kusur": return <KusurBlok bag={bag} />;
    case "sonuc": return <SonucBlok b={b} bag={bag} />;
    case "not": return <NotBlok b={b} bag={bag} />;
    case "imza": return <ImzaBlok b={b} v={bag.v} />;
    /* 495: serbest metin — formatın sabit yazısı, sahada okunur */
    case "metin": return b.metin.trim() ? <div className={stil.serbestMetin}>{b.metin.trim()}</div> : <p className={stil.bosSatir}>-</p>;
    default: return null;
  }
}

/* ── BİLGİ ── */
export function BilgiBlok({ b, bag }: { b: BolumOf<"bilgi">; bag: Baglam }) {
  return <>
    {/* 484: formatta açıksa fotoğraftan doldur / Excel'den yükle */}
    <AlanDoldurma bag={bag} bolumId={b.id} baslik={b.ad} alanlar={bilgiAlanlari(b)} ayar={doldurma(b)}
      yaz={(id, x) => bag.yaz((c) => ({ ...c, alan: { ...c.alan, [id]: x } }))} dolu={(id) => !!bag.c.alan[id]?.length} />
    <Satirlar>{b.alanlar.map((a) => <BilgiAlani key={a.id} a={a} bag={bag} />)}</Satirlar>
  </>;
}

/** bilgi bölümünün tek satırı (460: tam ekipman bölümü 2. bölümün satırları arasında çizilir) */
export function BilgiAlani({ a, bag }: { a: BolumOf<"bilgi">["alanlar"][number]; bag: Baglam }) {
  if (a.ekipman) return <>{bag.ekipmanAlani(a)}</>;
  const id = alanId(a.id);
  const etiket = a.birim ? `${a.ad} (${a.birim})` : a.ad;
  /* 556: formüllü alan öteki kutular gibi yazılır; değeri formülden (kendi yazılanı varsa o; kayıttan gelen alanda formül boşsa kayıttaki) */
  const f = formulluAlan(a);
  if (a.kaynak && !f) {
    const d = bag.kaynak(a.kaynak);
    return <Satir etiket={etiket}>{d ?? <DegerYok>-</DegerYok>}</Satir>;
  }
  const deger = (f ? bag.h : bag.c).alan[a.id];
  const metin = typeof deger === "string" && deger ? deger : a.kaynak ? bag.kaynak(a.kaynak) ?? "" : "";
  const liste = Array.isArray(deger) ? deger : [];
  const gec = bag.gecersiz(a.id);
  const yazAnahtar = (x: string | string[] | null) => bag.yaz((c) => {
    const alan = { ...c.alan };
    if (x === null) delete alan[a.id]; else alan[a.id] = x;
    return { ...c, alan };
  });
  const yaz = (x: string | string[]) => yazAnahtar(x);
  const saf = () => bag.hesap({ tur: "alan", id: a.id }) ?? (a.kaynak ? bag.kaynak(a.kaynak) : null);
  const sec = f ? hesapYazici(saf, yazAnahtar) : yaz;
  const zorunlu = a.zorunlu && !bag.oku && !f;
  if (a.tur === "coklu") {
    return (
      <Satir etiket={etiket} zorunlu={zorunlu} genis>
        {bag.oku ? (liste.length ? <ul className={stil.cokluOku}>{liste.map((s, i) => <li key={i}>{s}</li>)}</ul> : <DegerYok>-</DegerYok>) : (
          <div className={gec ? `${stil.coklu} ${stil.gecersiz}` : stil.coklu} role="group" aria-label={a.ad} id={id}>
            {(a.secenekler ?? []).map((s, i) => (
              <label key={i} className={stil.kutu}>
                <input type="checkbox" checked={liste.includes(s)} onChange={(e) => {
                  const l = e.target.checked ? [...liste, s] : liste.filter((x) => x !== s);
                  if (f) yazAnahtar(!l.length || ayniListe(l, saf()) ? null : l); else yaz(l);
                }} />
                <span>{s}</span>
              </label>
            ))}
          </div>
        )}
      </Satir>
    );
  }
  let girdi: ReactNode;
  if (bag.oku) {
    girdi = <OkuGirdi id={id} deger={a.tur === "tarih" && metin ? tarihNo(metin) : a.tur === "evet" ? etiketi(EVET, metin) : metin} />;
  } else if (a.tur === "tarih") {
    girdi = <TarihKutusu id={id} ad={a.ad} deger={metin} degistir={sec} gecersiz={gec} />;
  } else if (a.tur === "secim" || a.tur === "evet") {
    girdi = <SecimAlani id={id} ad={a.ad} deger={metin} gecersiz={gec} degistir={sec}
      secenekler={a.tur === "evet" ? EVET : (a.secenekler ?? []).map((s) => [s, s] as const)} />;
  } else if (f) {
    girdi = <HesapGirdi id={id} deger={metin} saf={saf} yaz={yazAnahtar} maxLength={a.tur === "sayi" ? 20 : 500} inputMode={a.tur === "sayi" ? "decimal" : undefined}
      aria-invalid={gec || undefined} />;
  } else {
    girdi = <Girdi id={id} value={metin} maxLength={a.tur === "sayi" ? 20 : 500} inputMode={a.tur === "sayi" ? "decimal" : undefined}
      aria-invalid={gec || undefined} onChange={(e) => yaz(e.target.value)} />;
  }
  return <Satir etiket={etiket} htmlFor={id} zorunlu={zorunlu}>{girdi}</Satir>;
}

/* ── KONTROL MADDELERİ ── */
type GrupT = BolumOf<"liste">["gruplar"][number];
/** grubun talimat penceresi (430): önce grubun talimatı, sonra talimatı olan maddeler (numarasıyla) */
const grupTalimati = (g: GrupT, ad: (m: GrupT["maddeler"][number], i: number) => string): TalimatParcasi[] => [
  { metin: g.talimat ?? "" },
  ...g.maddeler.flatMap((m, i) => (m.talimat?.trim() ? [{ baslik: ad(m, i), metin: m.talimat }] : [])),
];
/** grubun bütün maddelerinin ortak standardı (428): grup başlığında bir kez gösterilir, maddede yalnız farklıysa */
const ortakStd = (g: GrupT) => {
  const l = g.maddeler.map((m) => m.std?.trim() ?? "");
  return l.length && l[0] && l.every((x) => x === l[0]) ? l[0] : null;
};

/* numarasız bölümde (no null) madde numarası bölüm numarasız: "1", "1.2". 2026-10-16: 20 madde / sayfa (gruplar boyunca); grup sayfaya taşıyorsa
   başlığı, talimatı ve ortak standardı o sayfada da; numara genel. "Hepsini işaretle" bütün maddeleri yazar (sayfadan bağımsız) */
function ListeBlok({ b, no, bag }: { b: BolumOf<"liste">; no: string | null; bag: Baglam }) {
  const on = no ? `${no}.` : "";
  const gruplu = b.gruplar.length > 1 || b.gruplar.some((g) => g.ad);
  const sy = useSayfa(b.gruplar.reduce((n, g) => n + g.maddeler.length, 0), { deger: bag.bolumSayfasi(b.id), degistir: (n) => bag.bolumSayfaGit(b.id, n) });
  return (
    <>
      {maddeDilimi(b.gruplar, sy.bas, sy.son).map(({ g, gi, maddeler }) => {
        const std = ortakStd(g);
        return (
          <div key={g.id} className={stil.grup}>
            {g.ad && (
              <div className={stil.grupBas}>
                <h3 className={stil.grupBaslik}>{on}{gi + 1} · {g.ad}</h3>
                <TalimatTusu ad={g.ad} baslik={`Talimat · ${on}${gi + 1} ${g.ad}`} parcalar={grupTalimati(g, (m, mi) => `${on}${gi + 1}.${mi + 1} ${m.metin}`)} />
              </div>
            )}
            {std && <div className={stil.grupStd}><StandartTusu std={std} kaynak={bag.v.kaynak} /></div>}
            {maddeler.map(({ m, mi }) => <Madde key={m.id} m={m} numara={gruplu ? `${on}${gi + 1}.${mi + 1}` : `${on}${mi + 1}`} b={b} bag={bag} grupStd={std} />)}
          </div>
        );
      })}
      <TabloSayfalari s={sy} ad={b.ad} />
    </>
  );
}

function Madde({ m, numara, b, bag, grupStd }: { m: GrupT["maddeler"][number]; numara: string; b: BolumOf<"liste">; bag: Baglam; grupStd: string | null }) {
  const x = bag.c.madde[m.id];
  /* 556: formüllü maddenin cevabı formülden (seçilen kalır; formülün değeri seçilince yeniden formülden) */
  const f = formulluMadde(m);
  const cevap = (f ? bag.h.madde[m.id]?.c : x?.c) ?? "";
  const kusurlu = cevap !== "" && cevap === b.cevaplar[1];
  const id = alanId(m.id), notId = alanId(`${m.id}.not`), dereceId = alanId(`${m.id}.derece`);
  const derece = bag.v.tanim.kurallar.derece;
  /* 472: formatın cevap biçimi — yan yana tuşlar (tek dokunuş) ya da açılır liste */
  const tusla = bag.v.tanim.gorunum.cevap === "tus" && !bag.oku;
  const yaz = (y: Partial<MaddeCevabi>) => bag.yaz((c) => ({ ...c, madde: { ...c.madde, [m.id]: { ...((c.madde[m.id] as MaddeCevabi | undefined) ?? { c: "" }), ...y } } }));
  const cevapYaz = (c: string) => yaz({ c: f && c === bag.hesap({ tur: "madde", id: m.id }) ? "" : c });
  const ekSutunlar = b.ekSutunlar ?? [], ekler = ekSutunlar.filter((s) => s.alan === "yazi");
  const aciklamaSutunu = ekSutunlar.find((s) => s.alan === "aciklama"), fotoSutunu = ekSutunlar.find((s) => s.alan === "foto");
  return (
    <div className={tusla ? `${stil.madde} ${stil.maddeTusla}` : stil.madde}>
      <div className={stil.maddeSol}>
        <p className={stil.maddeAd}><span className={stil.maddeNo}>{numara}</span>
          <span>{m.metin}</span>
          {m.talimat?.trim() && <TalimatTusu ad={m.metin} baslik={`Talimat · ${numara}`} parcalar={[{ baslik: m.metin, metin: m.talimat }]} />}</p>
        {m.std?.trim() && m.std.trim() !== grupStd && <div className={stil.maddeStd}><StandartTusu std={m.std.trim()} kaynak={bag.v.kaynak} /></div>}
        {m.aciklama && (
          <details className={stil.maddeBilgi}>
            <summary><Ikon ad="info" kucuk /><span className="gizli">Madde {numara} açıklaması</span></summary>
            <p>{m.aciklama}</p>
          </details>
        )}
      </div>
      <div className={stil.maddeCevap}>
        {bag.oku ? <OkuGirdi id={id} deger={cevap} ad={m.metin} />
          : tusla ? <CevapTuslari id={id} ad={m.metin} deger={cevap} cevaplar={b.cevaplar} gecersiz={bag.gecersiz(m.id)} degistir={cevapYaz} />
          : <SecimAlani id={id} ad={m.metin} etiketsiz deger={cevap} gecersiz={bag.gecersiz(m.id)} secenekler={b.cevaplar.map((c) => [c, c] as const)}
            degistir={cevapYaz} />}
      </div>
      {/* 595 (madde 7): formatın ek sütunları — her maddede: açıklama (Uygun değil'de kusur açıklaması olarak aşağıda), fotoğraf, serbest yazı */}
      {(ekler.length > 0 || (aciklamaSutunu && !kusurlu) || (fotoSutunu && !kusurlu)) && (
        <div className={stil.maddeKusur}>
          {aciklamaSutunu && !kusurlu && (
            <div>
              <label className={stil.etiket} htmlFor={notId}>{aciklamaSutunu.ad}</label>
              <textarea id={notId} className={stil.metinAlan} maxLength={1000} value={x?.not ?? ""} readOnly={bag.oku} onChange={(e) => yaz({ not: e.target.value })} />
            </div>
          )}
          {fotoSutunu && !kusurlu && (
            <div>
              <p className={stil.etiket}>{fotoSutunu.ad}</p>
              {bag.foto(b.id, m.id)}
            </div>
          )}
          {ekler.map((s) => {
            const k = ekAnahtari(m.id, s.id), eid = alanId(`ek.${m.id}.${s.id}`);
            return (
              <div key={s.id}>
                <label className={stil.etiket} htmlFor={eid}>{s.ad}</label>
                <textarea id={eid} className={stil.metinAlan} maxLength={1000} rows={2} value={bag.c.ek[k] ?? ""} readOnly={bag.oku}
                  onChange={(e) => bag.yaz((c) => { const ek = { ...c.ek }; if (e.target.value) ek[k] = e.target.value; else delete ek[k]; return { ...c, ek }; })} />
              </div>
            );
          })}
        </div>
      )}
      {kusurlu && (
        <div className={stil.maddeKusur}>
          <div>
            <label className={stil.etiket} htmlFor={notId}>Kusur açıklaması</label>
            <textarea id={notId} className={stil.metinAlan} maxLength={1000} value={x?.not ?? ""} readOnly={bag.oku} onChange={(e) => yaz({ not: e.target.value })} />
          </div>
          {(bag.v.tanim.kurallar.foto || bag.v.fotolar.some((f) => f.madde === m.id) || !bag.oku) && (
            <div>
              <p className={stil.etiket}>Fotoğraf{bag.v.tanim.kurallar.foto ? "" : " (isteğe bağlı)"}</p>
              {bag.foto(b.id, m.id)}
            </div>
          )}
          {derece && (
            <div>
              <label className={stil.etiket} htmlFor={dereceId}>Kusur derecesi</label>
              {bag.oku ? <OkuGirdi id={dereceId} deger={etiketi(DERECE, x?.derece ?? "")} />
                : <SecimAlani id={dereceId} ad="Kusur derecesi" deger={x?.derece ?? ""} secenekler={DERECE} gecersiz={bag.gecersiz(`${m.id}.derece`)}
                  degistir={(d) => yaz({ derece: d === "agir" ? "agir" : "hafif" })} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** 472 (maket kararı k2): madde cevabı yan yana tuşlar — tek dokunuşla seçilir; doğal seçim düğmeleri (ok tuşlarıyla gezilir, ekran okuyucu
    grubu maddenin adıyla okur). 2. cevap (Uygun değil) seçiliyken kırmızı. */
function CevapTuslari({ id, ad, deger, cevaplar, gecersiz, degistir }:
  { id: string; ad: string; deger: string; cevaplar: readonly string[]; gecersiz: boolean; degistir: (c: string) => void }) {
  return (
    <div className={gecersiz ? `${stil.cevapTuslari} ${stil.gecersiz}` : stil.cevapTuslari} role="radiogroup" aria-label={ad} id={id} aria-invalid={gecersiz || undefined}>
      {cevaplar.map((c, i) => (
        <label key={c} className={i === 1 ? `${stil.cevapTus} ${stil.cevapOlumsuz}` : stil.cevapTus}>
          <input type="radio" name={id} value={c} checked={deger === c} onChange={() => degistir(c)} />
          <span>{c}</span>
        </label>
      ))}
    </div>
  );
}

/* ── ÖLÇÜM TABLOSU ── */
function OlcumBlok({ b, bag }: { b: BolumOf<"olcum">; bag: Baglam }) {
  const bildir = useBildir();
  const satirlar = bag.c.tablo[b.id] ?? [];
  const sonuclar = bag.d.satirlar[b.id] ?? [];
  const notlar = b.notlar ?? [];
  const notSecenek = notlar.map((n, j): SecimSecenegi => [String(j + 1), `Not-${j + 1}`, n.agir ? "ağır kusur" : n.kusur ? "kusur" : "uygun"]);
  const tablo = (f: (l: Record<string, string>[]) => Record<string, string>[]) => bag.yaz((c) => ({ ...c, tablo: { ...c.tablo, [b.id]: f(c.tablo[b.id] ?? []) } }));
  const hucre = (i: number, k: string, deger: string | null) => tablo((l) => l.map((s, j) => {
    if (j !== i) return s;
    const y = { ...s };
    if (deger === null) delete y[k]; else y[k] = deger;
    return y;
  }));
  const azEksik = bag.gecersiz(b.id);
  /* 486: son satırın kopyası — ilk sütundaki kimlik / no bir artar; yazılanlar Kaydet'e kadar ekranda */
  const ilk = b.sutunlar[0];
  const sonuKopyala = () => {
    const i = satirlar.length - 1;
    tablo((l) => satirKopyala(l, i, ilk?.id));
    bildir(`Son satır kopyalandı${ilk && satirlar[i]?.[ilk.id] ? ` (${ilk.ad} bir arttı)` : ""}; değişen değerleri yazın, kaydetmeyi unutmayın.`);
  };
  const kurallar = sonucKurallari(b, bag.v.tanim);
  const kap = useRef<HTMLDivElement>(null);
  useSurukleKaydir(kap);
  /* 2026-10-16 (reisim: "herhangi bir tabloda 20 den sonrası sayfalı olacak … diğer sayfalara doğru aksın"; örnek bu tablo — 35+ satır tek
     sayfadaydı): 20 satır / sayfa, satır numarası ve kimlikler GENEL (21. satır · No). Sayfa SahaRaporu'nda (bag): tablo değişince (Satır ekle, Son
     satırı kopyala, Excel, S.A.Y, silme, Geri al) İLK DEĞİŞEN satırın sayfası, Onaya gönder'de en üstteki eksiğin sayfası açılır; silinince sayfa
     taşmaz. Belge / PDF bütün satırları basar (src/belge). data-satir: tablonun bütün satır sayısı (ekranda yalnız sayfa var) */
  const sy = useSayfa(satirlar.length, { deger: bag.bolumSayfasi(b.id), degistir: (n) => bag.bolumSayfaGit(b.id, n) });
  /* 595 (madde 5): hazır satırlı "sabit" tabloda denetçi satır eklemez / çıkarmaz (formatın satırları) */
  const sabit = b.satir === "sabit" && !!b.hazir?.length;
  return (
    <>
      {/* 447 (reisim: "satır eklemediğin sürece neyin nereye yazılacağı bile gözükmüyor tablo başlıkları gözükmüyor"): başlıklar her zaman */}
      {/* 452: kendi içinde yatay kayan kap klavyeyle de kaydırılır (odaklanır; ekran okuyucuya bölge adıyla) — boş tabloda odaklanacak alan yok */}
      {(
        <div ref={kap} className={stil.tabloKap} role="region" aria-label={`${b.ad} tablosu`} tabIndex={0} data-satir={satirlar.length}>
          <table className={stil.olcumTablo}>
            <caption className="gizli">{b.ad}</caption>
            <thead>
              <tr>
                <th scope="col">{olcumBasliklari(b).sira}</th>
                {b.sutunlar.map((s) => (
                  <th key={s.id} scope="col">{s.ad}{s.birim && <span className={stil.birim}> ({s.birim})</span>}
                    {sinirMetni(s.op, s.sinir) && <span className={stil.sinir}>sınır {sinirMetni(s.op, s.sinir, s.birim)}</span>}</th>
                ))}
                {notlar.length > 0 && <th scope="col">{olcumBasliklari(b).not}</th>}
                <th scope="col">{olcumBasliklari(b).sonuc}</th>
                {!bag.oku && !sabit && <th scope="col"><span className="gizli">İşlem</span></th>}
              </tr>
            </thead>
            <tbody>
              {!satirlar.length && (
                <tr><td className={stil.bosHucre} colSpan={2 + b.sutunlar.length + (notlar.length ? 1 : 0) + (bag.oku || sabit ? 0 : 1)}>
                  Satır yok{bag.oku ? "." : " — “Satır ekle” ile ekleyin; her satır bir ölçüm noktası."}</td></tr>
              )}
              {sy.dilim(satirlar).map((s, j) => {
                const i = sy.bas + j, r = sonuclar[i], notAnahtar = satirAnahtari(b.id, i, "not");
                return (
                  <tr key={i}>
                    <td className={stil.satirNo}>{s[HAZIR_AD] || i + 1}</td>
                    {b.sutunlar.map((col) => {
                      /* 556: formüllü sütun öteki hücreler gibi; değeri aynı satırdan formülle (yazılan kalır) */
                      const f = formulluSutun(col);
                      const anahtar = satirAnahtari(b.id, i, col.id), id = alanId(anahtar), deger = (f ? bag.h.tablo[b.id]?.[i] : s)?.[col.id] ?? "";
                      const ad = `${i + 1}. satır${s[HAZIR_AD] ? ` (${s[HAZIR_AD]})` : ""} · ${col.ad}${col.birim ? ` (${col.birim})` : ""}`;
                      const saf = () => bag.hesap({ tur: "hucre", bolum: b.id, satir: i, sutun: col.id });
                      const hucreYaz = (x: string | null) => hucre(i, col.id, x);
                      if (bag.oku) return <td key={col.id}>{(col.giris === "evet" ? etiketi(EVET, deger) : deger) || <DegerYok />}</td>;
                      if (col.giris === "secim" || col.giris === "evet") {
                        return (
                          <td key={col.id} className={stil.secimHucre}>
                            <SecimAlani id={id} ad={ad} etiketsiz deger={deger} gecersiz={bag.gecersiz(anahtar)} degistir={f ? hesapYazici(saf, hucreYaz) : hucreYaz}
                              secenekler={col.giris === "evet" ? EVET : (col.secenekler ?? []).map((x) => [x, x] as const)} />
                          </td>
                        );
                      }
                      const ozellik = { "aria-label": ad, maxLength: col.giris === "sayi" ? 12 : 120, inputMode: col.giris === "sayi" ? "decimal" as const : undefined,
                        className: col.giris === "sayi" ? undefined : stil.metinHucre, "aria-invalid": bag.gecersiz(anahtar) || undefined };
                      return (
                        <td key={col.id}>
                          {f ? <HesapGirdi id={id} deger={deger} saf={saf} yaz={hucreYaz} {...ozellik} />
                            : <Girdi id={id} value={deger} {...ozellik} onChange={(e) => hucreYaz(e.target.value)} />}
                        </td>
                      );
                    })}
                    {notlar.length > 0 && (
                      <td>
                        {bag.oku ? (s.not ? `Not-${s.not}` : <DegerYok />)
                          : <SecimAlani id={alanId(notAnahtar)} ad={`${i + 1}. satır · uygunluk notu`} etiketsiz deger={s.not ?? ""} secenekler={notSecenek}
                            gecersiz={bag.gecersiz(notAnahtar)} degistir={(x) => hucre(i, "not", x)} />}
                      </td>
                    )}
                    <td className={stil.sonucHucre}>
                      {r?.uygun === true ? <span className={stil.onay}>Uygun</span> : r?.uygun === false ? <span className={stil.hataMetin}>Uygun değil</span> : <DegerYok />}
                      {/* 488: elle değiştirilen sonuç — kural sonucu yanında; gerekçe salt okunurda */}
                      {r?.elle && <span className={stil.elleIsaret}>elle · kural: {r.elle.kural === true ? "Uygun" : r.elle.kural === false ? "Uygun değil" : "—"}</span>}
                      {r && r.neden.length > 0 && <ul className={stil.neden}>{r.neden.map((n, j) => <li key={j}>{n}</li>)}</ul>}
                      {!bag.oku && !notlar.length && <ElleSonuc b={b} i={i} s={s} r={r} bag={bag} yaz={(y) => tablo((l) => l.map((x, j) => (j === i ? y(x) : x)))} />}
                      {r?.oneriNot && notlar.length > 0 ? <span className={stil.oneri}>Öneri: Not-{r.oneriNot}</span> : null}
                    </td>
                    {!bag.oku && !sabit && (
                      <td className={stil.islemHucre}>
                        <button className={stil.ikonTus} type="button" aria-label={`${i + 1}. satırı kaldır`} title="Kaldır"
                          onClick={() => tablo((l) => l.filter((_, j) => j !== i))}>
                          <Ikon ad="x" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <TabloSayfalari s={sy} ad={b.ad} />
      {/* 486 (reisim 2026-10-10: "neye göre otomatik uygun uygun değil diyor? bununda açıklamasını yap"): Sonuç sütununun kuralı */}
      <details className={stil.notlar}>
        <summary>Sonuç neye göre çıkar?</summary>
        {kurallar.length
          ? <><p className={stil.kuralBas}>Sonuç ölçülen değerlerden kendiliğinden çıkar — kural sağlanırsa Uygun, biri sağlanmazsa Uygun değil (nedeni satırda
            yazar); değeri boş olan kural değerlendirilmez.{!notlar.length && " Gerekirse satırın “Elle değiştir”iyle gerekçe yazarak değiştirilir; belgede kural sonucu da yazar."}</p>
            <ul>{kurallar.map((k, j) => <li key={j}>{k}</li>)}</ul></>
          : <p className={stil.kuralBas}>Bu tabloda sonuç kuralı yok (formatta sonuç kuralı, sütun sınırı ya da olumsuz seçenek tanımlanmamış): Sonuç boş kalır
            {!notlar.length && "; satırın “Elle değiştir”iyle gerekçe yazarak seçilir"}.</p>}
      </details>
      {notlar.length > 0 && (
        <details className={stil.notlar}>
          <summary>Uygunluk notları (Not-1 … Not-{notlar.length})</summary>
          <ol>{notlar.map((n, j) => <li key={j}>{n.metin}</li>)}</ol>
        </details>
      )}
      {!bag.oku && (() => {
        /* 484: formatın bölüm ayarı — fotoğraftan doldur (yapay zekâ) ve Excel'den yükle; ikisinin satırları da aynı yerleştirmeyle (foto-eslestir.ts:
           değeri boş var olan satıra ya da tablonun sonuna) */
        const ayar = doldurma(b);
        const tuslar = <>
          {!sabit && <Tus tur="ikincil" ikon="plus" id={alanId(b.id)} onClick={() => tablo((l) => [...l, {}])}>Satır ekle</Tus>}
          {!sabit && satirlar.length > 0 && <Tus tur="ikincil" ikon="copy" onClick={sonuKopyala}>Son satırı kopyala</Tus>}
          {sabit && <span className={stil.ipucuMetin}>Satırlar formatta hazır: {b.hazir!.length} satır.</span>}
          {ayar.excel && <ExcelYukle tur="tablo" baslik={b.ad} sutunlar={b.sutunlar} mesgul={bag.islem.mesgul} uygula={(l) => tablo((m) => {
            const o = l.map((degerler) => ({ degerler })), h = okunanHedefleri(m, o);
            return okunanlariUygula(m, o.map((x, i) => ({ ...x, hedef: h[i] ?? null })));
          })} />}
          {b.enAz > 0 && <span className={azEksik ? stil.hataMetin : stil.ipucuMetin}>En az {b.enAz} satır.</span>}
        </>;
        return ayar.foto && bag.okumaKipi
          ? <FotoBolumu v={bag.v} bolumId={b.id} baslik={b.ad} islem={bag.islem} kip={bag.okumaKipi} tuslar={tuslar} cubuk={stil.tabloAlt} />
          : <><div className={stil.tabloAlt}>{tuslar}</div><OkumaFotolari v={bag.v} bolumId={b.id} oku={bag.oku} islem={bag.islem} /></>;
      })()}
      {bag.oku && <OkumaFotolari v={bag.v} bolumId={b.id} oku islem={bag.islem} />}
    </>
  );
}

/** 488 (hata listesi 54 kararı): satırın sonucunu denetçi gerekçeyle elle değiştirir — "Elle değiştir" açar; "Kurala göre" geri alır. Değer satırda
    (motor.ts ELLE_SONUC / ELLE_GEREKCE); gerekçe en az ELLE_GEREKCE_EN_AZ harf (yoksa Onaya gönder eksik der, alan işaretlenir) */
function ElleSonuc({ b, i, s, r, bag, yaz }: {
  b: BolumOf<"olcum">; i: number; s: Record<string, string>; r: SatirDegerlendirmesi | undefined; bag: Baglam;
  yaz: (f: (s: Record<string, string>) => Record<string, string>) => void;
}) {
  const [acik, setAcik] = useState(false);
  const secili = s[ELLE_SONUC] === "uygun" || s[ELLE_SONUC] === "uygun_degil" ? s[ELLE_SONUC] : "";
  const sonucId = alanId(satirAnahtari(b.id, i, ELLE_SONUC)), gerekceAnahtar = satirAnahtari(b.id, i, ELLE_GEREKCE);
  if (!acik && !secili) {
    return <button type="button" className={stil.elleTus} aria-label={`${i + 1}. satır: sonucu elle değiştir`} onClick={() => {
      setAcik(true); requestAnimationFrame(() => document.getElementById(sonucId)?.focus());
    }}>Elle değiştir</button>;
  }
  const kural = r?.elle ? r.elle.kural : r?.uygun ?? null;
  return (
    <div className={stil.elleKutu}>
      <SecimAlani id={sonucId} ad={`${i + 1}. satır · elle sonuç`} etiketsiz deger={secili} ipucu="Kurala göre"
        secenekler={[["", "Kurala göre", kural === true ? "Uygun" : kural === false ? "Uygun değil" : ""], ["uygun", "Uygun"], ["uygun_degil", "Uygun değil"]]}
        degistir={(x) => {
          if (!x) { yaz((k) => { const y = { ...k }; delete y[ELLE_SONUC]; delete y[ELLE_GEREKCE]; return y; }); setAcik(false); return; }
          yaz((k) => ({ ...k, [ELLE_SONUC]: x }));
          requestAnimationFrame(() => document.getElementById(alanId(gerekceAnahtar))?.focus());
        }} />
      {secili && <Girdi id={alanId(gerekceAnahtar)} aria-label={`${i + 1}. satır · elle sonucun gerekçesi`} placeholder={`Gerekçe (en az ${ELLE_GEREKCE_EN_AZ} harf)`}
        value={s[ELLE_GEREKCE] ?? ""} maxLength={200} aria-invalid={bag.gecersiz(gerekceAnahtar) || undefined}
        onChange={(e) => { const v = e.target.value; yaz((k) => ({ ...k, [ELLE_GEREKCE]: v })); }} />}
    </div>
  );
}

/* ── TEST DEĞERLERİ ── */
function TestBlok({ b, bag }: { b: BolumOf<"test">; bag: Baglam }) {
  return (
    <>
    {/* 484: formatta açıksa fotoğraftan doldur / Excel'den yükle */}
    <AlanDoldurma bag={bag} bolumId={b.id} baslik={b.ad} alanlar={testAlanlari(b)} ayar={doldurma(b)}
      yaz={(id, x) => bag.yaz((c) => ({ ...c, deger: { ...c.deger, [id]: x } }))} dolu={(id) => !!bag.c.deger[id]} />
    <FormIzgara>
      {b.degerler.map((d) => {
        /* 556: formüllü değer öteki kutular gibi; değeri formülden (yazılan kalır), sınırı varsa sonucu yanında */
        const f = formulluDeger(d);
        const id = alanId(d.id), deger = (f ? bag.h : bag.c).deger[d.id] ?? "", r = bag.d.degerler[d.id] ?? null, gec = bag.gecersiz(d.id);
        const sinir = sinirMetni(d.op, d.sinir, d.birim);
        const ipucu = [sinir && `Sınır ${sinir}`, d.not].filter(Boolean).join(" · ");
        const secmeli = !!d.secenekler?.length;
        const sonuc = ipucu || r !== null ? <>{ipucu}{r !== null && <>{ipucu && " · "}<span className={r ? stil.onay : stil.hataMetin}>{r ? "Uygun" : secmeli ? (d.agir ? "Ağır kusur" : "Uygun değil") : "Sınır dışı"}</span></>}</> : undefined;
        const yaz = (x: string | null) => bag.yaz((c) => {
          const deger = { ...c.deger };
          if (x === null) delete deger[d.id]; else deger[d.id] = x;
          return { ...c, deger };
        });
        const saf = () => bag.hesap({ tur: "deger", id: d.id });
        const ozellik = { maxLength: d.metin ? 60 : 12, inputMode: d.metin ? undefined : "decimal" as const, hata: gec || r === false, mesajli: !!sonuc };
        return (
          <Alan key={d.id} id={id} etiket={d.birim ? `${d.ad} (${d.birim})` : d.ad} zorunlu={d.zorunlu && !bag.oku && !f} hata={gec ? (secmeli ? "Seçilmeli." : "Değer yazılmalı.") : undefined} sonuc={sonuc}>
            {bag.oku ? <OkuGirdi id={id} deger={deger} />
              : secmeli ? <SecimAlani id={id} ad={d.ad} deger={deger} gecersiz={gec} degistir={f ? hesapYazici(saf, yaz) : yaz} secenekler={d.secenekler!.map((s) => [s, s] as const)} />
                : f ? <HesapGirdi id={id} deger={deger} saf={saf} yaz={yaz} {...ozellik} />
                  : <Girdi id={id} value={deger} {...ozellik} onChange={(e) => yaz(e.target.value)} />}
          </Alan>
        );
      }).flatMap((alan, j) => {
        /* 595 (madde 6): formatın ek sütunları — her değerin ardından (yazı / sayı / seçim) */
        const d = b.degerler[j];
        return [alan, ...(b.ekSutunlar ?? []).map((s) => {
          const k = ekAnahtari(d.id, s.id), eid = alanId(`ek.${d.id}.${s.id}`), deger = bag.c.ek[k] ?? "", ad = `${d.ad} · ${s.ad}`;
          const ekYaz = (x: string | null) => bag.yaz((c) => { const ek = { ...c.ek }; if (x) ek[k] = x; else delete ek[k]; return { ...c, ek }; });
          return (
            <Alan key={`${d.id}-${s.id}`} id={eid} etiket={ad}>
              {bag.oku ? <OkuGirdi id={eid} deger={deger} />
                : s.alan === "secim" ? <SecimAlani id={eid} ad={ad} deger={deger} degistir={ekYaz} secenekler={(s.secenekler ?? []).map((o) => [o, o] as const)} />
                  : <Girdi id={eid} value={deger} maxLength={s.alan === "sayi" ? 12 : 200} inputMode={s.alan === "sayi" ? "decimal" : undefined} onChange={(e) => ekYaz(e.target.value)} />}
            </Alan>
          );
        })];
      })}
    </FormIzgara>
    </>
  );
}

/* ── KUSUR AÇIKLAMALARI · SONUÇ · NOT · İMZA ── */
function KusurBlok({ bag }: { bag: Baglam }) {
  const l = bag.d.kusurlar;
  if (!l.length) return <p className={stil.bosSatir}>Kusur yok.</p>;
  /* 2026-10-16: 20'den çok kusur sayfalı (numara genel); belgede hepsi */
  return <SayfaliListe ad="Kusur açıklamaları" sirali className={stil.kusurListe} ogeler={l.map((k, i) => {
    const f = bag.v.fotolar.filter((x) => x.madde === k.ref).map((x) => x.ad);
    return <li key={`${k.ref}-${i}`}>{k.agir ? "** " : ""}{k.metin}{f.length > 0 && <span className={stil.altMetin}> (Fotoğraf: {f.join(", ")})</span>}</li>;
  })} />;
}

function SonucBlok({ b, bag }: { b: BolumOf<"sonuc">; bag: Baglam }) {
  const id = alanId(b.id), s = bag.c.sonuc, cumle = b.cumle.trim(), sm = sonucMetinleri(b);
  return (
    <>
      {cumle && (
        <p className={stil.cumle}>{cumle} {s === "uygun" ? <b>{sm.uygun}</b> : s === "uygun_degil" ? <b>{sm.uygunDegil}</b> : `${sm.uygun} / ${sm.uygunDegil}`}.</p>
      )}
      {b.aciklama.trim() && <p className={stil.aciklama}>{b.aciklama.trim()}</p>}
      <div className={`${stil.madde} ${stil.maddeSonuc}`}>
        <label className={stil.maddeAd} htmlFor={id}>Sonuç ve kanaat</label>
        <div className={stil.maddeCevap}>
          {bag.oku ? <OkuGirdi id={id} deger={s ? SONUC_AD[s] : ""} />
            : <SecimAlani id={id} ad="Sonuç ve kanaat" deger={s} secenekler={SONUC} gecersiz={bag.gecersiz(b.id)}
              degistir={(x) => bag.yaz((c) => ({ ...c, sonuc: x === "uygun" || x === "uygun_degil" ? x : "" }))} />}
        </div>
        {!bag.oku && s === "uygun" && bag.d.kusurlar.length > 0 && (
          <p className={`${stil.maddeUyari} ${stil.uyari}`}>Uygun değil madde ya da sınır dışı test değeri varken sonuç “Uygun”.</p>
        )}
        {/* 534 (reisim 2026-10-13: "Sonuç ve kanaat kısmında öneri olmasın"): "Öneri: …" satırı kalktı. Öneri hesabı (format/motor.ts) yerinde:
            sonuç seçilmeden Onaya gönderilirse sonuç ondan yazılır (raporlar.ts), S.A.Y'ın "sonuç" sorusu onu söyler. */}
      </div>
    </>
  );
}

function NotBlok({ b, bag }: { b: BolumOf<"not">; bag: Baglam }) {
  const gec = bag.gecersiz(b.id), yon = b.yonlendirme?.trim(), ipucu = yon ? `${alanId(b.id)}-yon` : undefined;
  /* 595 (madde 11): formatın yönlendirme yazısı kutunun üstünde; satır sayısı kutunun boyu */
  return (
    <>
      {yon && <p className={stil.ipucuMetin} id={ipucu}>{yon}</p>}
      <textarea id={alanId(b.id)} className={stil.metinAlan} aria-label={b.ad} aria-describedby={ipucu} maxLength={4000} value={bag.c.yorum} readOnly={bag.oku}
        rows={b.satir} aria-required={(b.zorunlu && !bag.oku) || undefined} aria-invalid={gec || undefined} onChange={(e) => bag.yaz((c) => ({ ...c, yorum: e.target.value }))} />
    </>
  );
}

/** yetkili kişi: raporu yazan denetçinin personel kaydından (değişmez); imza son imzada (maket S.yetkili) */
function ImzaBlok({ b, v }: { b: BolumOf<"imza">; v: SahaRaporu }) {
  const m = v.yazan.meslek === "diger" ? v.yazan.meslekMetin : meslek(v.yazan.meslek)?.ad;
  return (
    <>
      <Satirlar>
        <Satir etiket="Ad soyad">{v.yazan.ad}</Satir>
        <Satir etiket="Meslek">{m ?? <DegerYok>-</DegerYok>}</Satir>
        <Satir etiket="Yetkili kişi kayıt no">{v.yazan.ekipnet ? <Kod>{v.yazan.ekipnet}</Kod> : <span className={stil.uyari}>Yok</span>}</Satir>
      </Satirlar>
      <ul className={stil.imzalar}>
        {/* 595: kişiler imza bölümünün satırlarından (format belirler); serbest satırlar belgede sabit yazı ya da boş hücre */}
        {[...new Set(imzaSatirlari(b).map((s) => s.kim))].map((i) => <li key={i} className={stil.imza}><b>{IMZA[i]}</b><span className={stil.imzaKutu}>
          {i === "diger" ? `Belgede: ${imzaSatirlari(b).filter((s) => s.kim === "diger").map((s) => s.ad).join(" · ")}` : "İmza son imzada atılır."}</span></li>)}
      </ul>
    </>
  );
}
