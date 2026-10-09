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
     boş zorunlu alan aria-invalid + kırmızı çerçeve, doldurulunca kalkar (maket zorunluEksik / uyar). */
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type TransitionStartFunction } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi } from "../../../components/form/Form";
import { Ikon } from "../../../components/ikon/Ikon";
import { DegerYok, Kod, Rozet } from "../../../components/sayfa/Sayfa";
import { useDisariTiklama, type SecimSecenegi } from "../../../components/secim/SecenekListesi";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { tarihNo } from "../../../components/secim/tarih";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import { SINIR_ISARETI } from "../../../format/hesap";
import { satirAnahtari, type Degerlendirme } from "../../../format/motor";
import type { Bolum, BolumOf, Cevaplar, Sinir } from "../../../format/tanim";
import { meslek } from "../../personel/sema";
import { SONUC_AD } from "../sema";
import type { SahaRaporu } from "../server/raporlar";
import { FotoOkuma } from "./FotoOkuma";
import { StandartTusu } from "./Kaynaklar";
import stil from "./raporlar.module.css";

/** alan anahtarı → ekrandaki girdinin id'si. Anahtarlar motorun ve sunucunun eksik listesiyle aynı: madde / alan / değer kimliği, "tarih.bas",
    "<madde>.derece", satirAnahtari ("<bölüm>#<sıra>.<sütun>"), "cihaz.<tür>". Kimlikte tire olmaz (tanim.ts) → ayraç tire, çakışma yok. */
export const alanId = (alan: string) => `r-${alan.replace(/[#.]/g, "-")}`;
const virgul = (n: number) => String(n).replace(".", ",");
const sinirMetni = (op?: Sinir, s?: number, birim?: string) => (op && s !== undefined ? `${SINIR_ISARETI[op]} ${virgul(s)}${birim ? ` ${birim}` : ""}` : null);
const EVET: readonly SecimSecenegi[] = [["evet", "Evet"], ["hayir", "Hayır"]];
const DERECE: readonly SecimSecenegi[] = [["hafif", "Hafif kusur"], ["agir", "Ağır kusur"]];
const SONUC: readonly SecimSecenegi[] = [["uygun", SONUC_AD.uygun], ["uygun_degil", SONUC_AD.uygun_degil]];
const IMZA = { uzman: "Muayene uzmanı", teknik: "Teknik yönetici" } as const;
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
  /** kayıttan gelen alanın ekrandaki değeri (seri no, kullanım yeri, kontrol tarihi raporun güncel hâliyle) */
  kaynak: (k: Kaynak) => string | null;
  /** formatın cihaz bölümü (CihazBolumu; SahaRaporu verir — döngüsel içe aktarma olmasın) */
  cihaz: (bolumId: string) => ReactNode;
  /** fotoğraf listesi: bölümün (madde null) ya da "Uygun değil" maddenin (FotoListesi; SahaRaporu verir) */
  foto: (bolumId: string, madde: string | null) => ReactNode;
  /** ölçüm tablolarında "Fotoğraftan oku" (351): düzenleyebilene, firmada yapay zekâ açık ve anahtar girilmişse */
  yz: boolean;
  /** üst ekranın işlemi (354): okuma sürerken Kaydet / Onaya gönder / öteki okumalar kapalı (FotoListesi gibi); okuma rapora fotoğraf ekleyince yenile */
  islem: { mesgul: boolean; baslat: TransitionStartFunction; yenile: () => void };
}

/* ── ORTAK PARÇALAR ──────────────────────────────────────────────────────────────────────────────────────────── */
/** bölüm kartı: "N · ad" başlığı, eksik rozeti, sayaç, başlık tuşları, aç / kapat (her başlık açılır kapanır — reisim 2026-09-26) */
export function RaporBolumu({ id, no, baslik, acik, degistir, eksik = false, sayac, tuslar, children }: {
  id: string; no: string | null; baslik: string; acik: boolean; degistir: (acik: boolean) => void; eksik?: boolean; sayac?: ReactNode; tuslar?: ReactNode; children: ReactNode;
}) {
  const b = `b-${id}`;
  return (
    <section className={stil.bolum} id={b} aria-labelledby={`${b}-b`}>
      <div className={stil.bolumBas}>
        <h2 className={stil.bolumBaslik} id={`${b}-b`} tabIndex={-1}>{no && <span className={stil.bolumNo}>{no} · </span>}{baslik}</h2>
        {eksik && <Rozet tur="red">Eksik</Rozet>}
        {sayac}
        <div className={stil.bolumSag}>
          {tuslar}
          <button className={stil.acTus} type="button" aria-expanded={acik} aria-controls={`${b}-ic`} aria-label={`${baslik} bölümü`} title={acik ? "Kapat" : "Aç"}
            onClick={() => degistir(!acik)}>
            <Ikon ad="chevron-down" kucuk />
          </button>
        </div>
      </div>
      <div className={stil.bolumIc} id={`${b}-ic`} hidden={!acik}>{children}</div>
    </section>
  );
}

export function Satirlar({ children }: { children: ReactNode }) {
  return <dl className={stil.satirlar}>{children}</dl>;
}

/** etiket : değer satırı. Etiket metni alanın tam adıdır ("zorunlu" işareti etiketin dışında — erişilebilir ad değişmesin) */
export function Satir({ etiket, htmlFor, zorunlu = false, genis = false, children }:
  { etiket: string; htmlFor?: string; zorunlu?: boolean; genis?: boolean; children: ReactNode }) {
  return (
    <div className={genis ? `${stil.satir} ${stil.satirGenis}` : stil.satir}>
      <dt>{htmlFor ? <label htmlFor={htmlFor}>{etiket}</label> : etiket}{zorunlu && <span className={stil.zorunlu}> zorunlu</span>}</dt>
      <dd>{children}</dd>
    </div>
  );
}

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
  let sayac: ReactNode = null, tuslar: ReactNode = null;
  if (b.blok === "liste") {
    const maddeler = b.gruplar.flatMap((g) => g.maddeler);
    const n = maddeler.filter((m) => b.cevaplar.includes(bag.c.madde[m.id]?.c ?? "")).length;
    sayac = <span className={stil.sayac}><b>{n}</b> / {maddeler.length} madde</span>;
    if (!bag.oku && maddeler.length) tuslar = <TopluMenu cevaplar={b.cevaplar} sec={(c) => {
      bag.yaz((x) => ({ ...x, madde: { ...x.madde, ...Object.fromEntries(maddeler.map((m) => [m.id, { ...x.madde[m.id], c }])) } }));
      bildir(`${maddeler.length} madde “${c}” işaretlendi.`);
    }} />;
  }
  if (b.blok === "kusur") sayac = <span className={stil.sayac}><b>{bag.d.kusurlar.length}</b> kusur</span>;
  return (
    <RaporBolumu id={b.id} no={no} baslik={b.ad} acik={acik} degistir={degistir} eksik={eksik} sayac={sayac} tuslar={tuslar}>
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
    case "foto": return <>{bag.foto(b.id, null)}</>;
    case "kusur": return <KusurBlok bag={bag} />;
    case "sonuc": return <SonucBlok b={b} bag={bag} />;
    case "not": return <NotBlok b={b} bag={bag} />;
    case "imza": return <ImzaBlok b={b} v={bag.v} />;
    default: return null;
  }
}

/* ── BİLGİ ── */
export function BilgiBlok({ b, bag }: { b: BolumOf<"bilgi">; bag: Baglam }) {
  return <Satirlar>{b.alanlar.map((a) => <BilgiAlani key={a.id} a={a} bag={bag} />)}</Satirlar>;
}

function BilgiAlani({ a, bag }: { a: BolumOf<"bilgi">["alanlar"][number]; bag: Baglam }) {
  const id = alanId(a.id);
  const etiket = a.birim ? `${a.ad} (${a.birim})` : a.ad;
  if (a.kaynak) {
    const d = bag.kaynak(a.kaynak);
    return <Satir etiket={etiket}>{d ?? <DegerYok>-</DegerYok>}</Satir>;
  }
  const deger = bag.c.alan[a.id];
  const metin = typeof deger === "string" ? deger : "";
  const liste = Array.isArray(deger) ? deger : [];
  const gec = bag.gecersiz(a.id);
  const yaz = (x: string | string[]) => bag.yaz((c) => ({ ...c, alan: { ...c.alan, [a.id]: x } }));
  const zorunlu = a.zorunlu && !bag.oku;
  if (a.tur === "coklu") {
    return (
      <Satir etiket={etiket} zorunlu={zorunlu} genis>
        {bag.oku ? (liste.length ? <ul className={stil.cokluOku}>{liste.map((s, i) => <li key={i}>{s}</li>)}</ul> : <DegerYok>-</DegerYok>) : (
          <div className={gec ? `${stil.coklu} ${stil.gecersiz}` : stil.coklu} role="group" aria-label={a.ad} id={id}>
            {(a.secenekler ?? []).map((s, i) => (
              <label key={i} className={stil.kutu}>
                <input type="checkbox" checked={liste.includes(s)} onChange={(e) => yaz(e.target.checked ? [...liste, s] : liste.filter((x) => x !== s))} />
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
    girdi = <TarihKutusu id={id} ad={a.ad} deger={metin} degistir={yaz} gecersiz={gec} />;
  } else if (a.tur === "secim" || a.tur === "evet") {
    girdi = <SecimAlani id={id} ad={a.ad} deger={metin} gecersiz={gec} degistir={yaz}
      secenekler={a.tur === "evet" ? EVET : (a.secenekler ?? []).map((s) => [s, s] as const)} />;
  } else {
    girdi = <Girdi id={id} value={metin} maxLength={a.tur === "sayi" ? 20 : 500} inputMode={a.tur === "sayi" ? "decimal" : undefined}
      aria-invalid={gec || undefined} onChange={(e) => yaz(e.target.value)} />;
  }
  return <Satir etiket={etiket} htmlFor={id} zorunlu={zorunlu}>{girdi}</Satir>;
}

/* ── KONTROL MADDELERİ ── */
type GrupT = BolumOf<"liste">["gruplar"][number];
/** grubun bütün maddelerinin ortak standardı (428): grup başlığında bir kez gösterilir, maddede yalnız farklıysa */
const ortakStd = (g: GrupT) => {
  const l = g.maddeler.map((m) => m.std?.trim() ?? "");
  return l.length && l[0] && l.every((x) => x === l[0]) ? l[0] : null;
};

/* numarasız bölümde (no null) madde numarası bölüm numarasız: "1", "1.2" */
function ListeBlok({ b, no, bag }: { b: BolumOf<"liste">; no: string | null; bag: Baglam }) {
  const on = no ? `${no}.` : "";
  const gruplu = b.gruplar.length > 1 || b.gruplar.some((g) => g.ad);
  return (
    <>
      {b.gruplar.map((g, gi) => {
        const std = ortakStd(g);
        return (
          <div key={g.id} className={stil.grup}>
            {g.ad && <h3 className={stil.grupBaslik}>{on}{gi + 1} · {g.ad}</h3>}
            {std && <p className={stil.grupStd}><StandartTusu std={std} kaynak={bag.v.kaynak} /></p>}
            {g.maddeler.map((m, mi) => <Madde key={m.id} m={m} numara={gruplu ? `${on}${gi + 1}.${mi + 1}` : `${on}${mi + 1}`} b={b} bag={bag} grupStd={std} />)}
          </div>
        );
      })}
    </>
  );
}

function Madde({ m, numara, b, bag, grupStd }: { m: GrupT["maddeler"][number]; numara: string; b: BolumOf<"liste">; bag: Baglam; grupStd: string | null }) {
  const x = bag.c.madde[m.id];
  const cevap = x?.c ?? "";
  const kusurlu = cevap !== "" && cevap === b.cevaplar[1];
  const id = alanId(m.id), notId = alanId(`${m.id}.not`), dereceId = alanId(`${m.id}.derece`);
  const derece = bag.v.tanim.kurallar.derece;
  const yaz = (y: Partial<MaddeCevabi>) => bag.yaz((c) => ({ ...c, madde: { ...c.madde, [m.id]: { ...((c.madde[m.id] as MaddeCevabi | undefined) ?? { c: "" }), ...y } } }));
  return (
    <div className={stil.madde}>
      <div className={stil.maddeSol}>
        <p className={stil.maddeAd}><span className={stil.maddeNo}>{numara}</span><span>{m.metin}</span></p>
        {m.std?.trim() && m.std.trim() !== grupStd && <p className={stil.maddeStd}><StandartTusu std={m.std.trim()} kaynak={bag.v.kaynak} /></p>}
        {m.aciklama && (
          <details className={stil.maddeBilgi}>
            <summary><Ikon ad="info" kucuk /><span className="gizli">Madde {numara} açıklaması</span></summary>
            <p>{m.aciklama}</p>
          </details>
        )}
      </div>
      <div className={stil.maddeCevap}>
        {bag.oku ? <OkuGirdi id={id} deger={cevap} ad={m.metin} />
          : <SecimAlani id={id} ad={m.metin} etiketsiz deger={cevap} gecersiz={bag.gecersiz(m.id)} secenekler={b.cevaplar.map((c) => [c, c] as const)}
            degistir={(c) => yaz({ c })} />}
      </div>
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

/* ── ÖLÇÜM TABLOSU ── */
function OlcumBlok({ b, bag }: { b: BolumOf<"olcum">; bag: Baglam }) {
  const satirlar = bag.c.tablo[b.id] ?? [];
  const sonuclar = bag.d.satirlar[b.id] ?? [];
  const notlar = b.notlar ?? [];
  const notSecenek = notlar.map((n, j): SecimSecenegi => [String(j + 1), `Not-${j + 1}`, n.agir ? "ağır kusur" : n.kusur ? "kusur" : "uygun"]);
  const tablo = (f: (l: Record<string, string>[]) => Record<string, string>[]) => bag.yaz((c) => ({ ...c, tablo: { ...c.tablo, [b.id]: f(c.tablo[b.id] ?? []) } }));
  const hucre = (i: number, k: string, deger: string) => tablo((l) => l.map((s, j) => (j === i ? { ...s, [k]: deger } : s)));
  const azEksik = bag.gecersiz(b.id);
  return (
    <>
      {satirlar.length ? (
        <div className={stil.tabloKap}>
          <table className={stil.olcumTablo}>
            <caption className="gizli">{b.ad}</caption>
            <thead>
              <tr>
                <th scope="col">No</th>
                {b.sutunlar.map((s) => (
                  <th key={s.id} scope="col">{s.ad}{s.birim && <span className={stil.birim}> ({s.birim})</span>}
                    {sinirMetni(s.op, s.sinir) && <span className={stil.sinir}>sınır {sinirMetni(s.op, s.sinir, s.birim)}</span>}</th>
                ))}
                {notlar.length > 0 && <th scope="col">Uygunluk notu</th>}
                <th scope="col">Sonuç</th>
                {!bag.oku && <th scope="col"><span className="gizli">İşlem</span></th>}
              </tr>
            </thead>
            <tbody>
              {satirlar.map((s, i) => {
                const r = sonuclar[i], notAnahtar = satirAnahtari(b.id, i, "not");
                return (
                  <tr key={i}>
                    <td className={stil.satirNo}>{i + 1}</td>
                    {b.sutunlar.map((col) => {
                      const anahtar = satirAnahtari(b.id, i, col.id), id = alanId(anahtar), deger = s[col.id] ?? "";
                      const ad = `${i + 1}. satır · ${col.ad}${col.birim ? ` (${col.birim})` : ""}`;
                      if (bag.oku) return <td key={col.id}>{(col.giris === "evet" ? etiketi(EVET, deger) : deger) || <DegerYok />}</td>;
                      if (col.giris === "secim" || col.giris === "evet") {
                        return (
                          <td key={col.id}>
                            <SecimAlani id={id} ad={ad} etiketsiz deger={deger} gecersiz={bag.gecersiz(anahtar)} degistir={(x) => hucre(i, col.id, x)}
                              secenekler={col.giris === "evet" ? EVET : (col.secenekler ?? []).map((x) => [x, x] as const)} />
                          </td>
                        );
                      }
                      return (
                        <td key={col.id}>
                          <Girdi id={id} aria-label={ad} value={deger} maxLength={col.giris === "sayi" ? 12 : 120} inputMode={col.giris === "sayi" ? "decimal" : undefined}
                            aria-invalid={bag.gecersiz(anahtar) || undefined} onChange={(e) => hucre(i, col.id, e.target.value)} />
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
                      {r && r.neden.length > 0 && <ul className={stil.neden}>{r.neden.map((n, j) => <li key={j}>{n}</li>)}</ul>}
                      {r?.oneriNot && notlar.length > 0 ? <span className={stil.oneri}>Öneri: Not-{r.oneriNot}</span> : null}
                    </td>
                    {!bag.oku && (
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
      ) : <p className={stil.bosSatir}>Satır yok.</p>}
      {notlar.length > 0 && (
        <details className={stil.notlar}>
          <summary>Uygunluk notları (Not-1 … Not-{notlar.length})</summary>
          <ol>{notlar.map((n, j) => <li key={j}>{n.metin}</li>)}</ol>
        </details>
      )}
      {!bag.oku && (() => {
        const tuslar = <>
          <Tus tur="ikincil" ikon="plus" id={alanId(b.id)} onClick={() => tablo((l) => [...l, {}])}>Satır ekle</Tus>
          {b.enAz > 0 && <span className={azEksik ? stil.hataMetin : stil.ipucuMetin}>En az {b.enAz} satır.</span>}
        </>;
        /* fotoğraftan okunanlar: değeri boş var olan satıra ya da tablonun sonuna (foto-eslestir.ts) */
        return bag.yz
          ? <FotoOkuma raporId={bag.v.id} b={b} satirlar={satirlar} tablo={tablo} islem={bag.islem} cubuk={stil.tabloAlt} tuslar={tuslar} />
          : <div className={stil.tabloAlt}>{tuslar}</div>;
      })()}
    </>
  );
}

/* ── TEST DEĞERLERİ ── */
function TestBlok({ b, bag }: { b: BolumOf<"test">; bag: Baglam }) {
  return (
    <FormIzgara>
      {b.degerler.map((d) => {
        const id = alanId(d.id), deger = bag.c.deger[d.id] ?? "", r = bag.d.degerler[d.id] ?? null, gec = bag.gecersiz(d.id);
        const sinir = sinirMetni(d.op, d.sinir, d.birim);
        const ipucu = [sinir && `Sınır ${sinir}`, d.not].filter(Boolean).join(" · ");
        const secmeli = !!d.secenekler?.length;
        const sonuc = ipucu || r !== null ? <>{ipucu}{r !== null && <>{ipucu && " · "}<span className={r ? stil.onay : stil.hataMetin}>{r ? "Uygun" : secmeli ? (d.agir ? "Ağır kusur" : "Uygun değil") : "Sınır dışı"}</span></>}</> : undefined;
        const yaz = (x: string) => bag.yaz((c) => ({ ...c, deger: { ...c.deger, [d.id]: x } }));
        return (
          <Alan key={d.id} id={id} etiket={d.birim ? `${d.ad} (${d.birim})` : d.ad} zorunlu={d.zorunlu && !bag.oku} hata={gec ? (secmeli ? "Seçilmeli." : "Değer yazılmalı.") : undefined} sonuc={sonuc}>
            {bag.oku ? <OkuGirdi id={id} deger={deger} />
              : secmeli ? <SecimAlani id={id} ad={d.ad} deger={deger} gecersiz={gec} degistir={yaz} secenekler={d.secenekler!.map((s) => [s, s] as const)} />
                : <Girdi id={id} value={deger} maxLength={d.metin ? 60 : 12} inputMode={d.metin ? undefined : "decimal"} hata={gec || r === false} mesajli={!!sonuc}
                  onChange={(e) => yaz(e.target.value)} />}
          </Alan>
        );
      })}
    </FormIzgara>
  );
}

/* ── KUSUR AÇIKLAMALARI · SONUÇ · NOT · İMZA ── */
function KusurBlok({ bag }: { bag: Baglam }) {
  const l = bag.d.kusurlar;
  if (!l.length) return <p className={stil.bosSatir}>Kusur yok.</p>;
  return <ol className={stil.kusurListe}>{l.map((k, i) => {
    const f = bag.v.fotolar.filter((x) => x.madde === k.ref).map((x) => x.ad);
    return <li key={`${k.ref}-${i}`}>{k.agir ? "** " : ""}{k.metin}{f.length > 0 && <span className={stil.altMetin}> (Fotoğraf: {f.join(", ")})</span>}</li>;
  })}</ol>;
}

function SonucBlok({ b, bag }: { b: BolumOf<"sonuc">; bag: Baglam }) {
  const id = alanId(b.id), s = bag.c.sonuc, cumle = b.cumle.trim();
  return (
    <>
      {cumle && (
        <p className={stil.cumle}>{cumle} {s === "uygun" ? <b>uygundur</b> : s === "uygun_degil" ? <b>uygun değildir</b> : "uygundur / uygun değildir"}.</p>
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
        {!bag.oku && bag.v.tanim.kurallar.oneri && <p className={`${stil.maddeUyari} ${stil.ipucuMetin}`}>Öneri: <b>{SONUC_AD[bag.d.oneri]}</b></p>}
      </div>
    </>
  );
}

function NotBlok({ b, bag }: { b: BolumOf<"not">; bag: Baglam }) {
  const gec = bag.gecersiz(b.id);
  return (
    <textarea id={alanId(b.id)} className={stil.metinAlan} aria-label={b.ad} maxLength={4000} value={bag.c.yorum} readOnly={bag.oku}
      aria-required={(b.zorunlu && !bag.oku) || undefined} aria-invalid={gec || undefined} onChange={(e) => bag.yaz((c) => ({ ...c, yorum: e.target.value }))} />
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
        {b.imzalar.map((i) => <li key={i} className={stil.imza}><b>{IMZA[i]}</b><span className={stil.imzaKutu}>İmza son imzada atılır.</span></li>)}
      </ul>
    </>
  );
}
