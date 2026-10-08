"use client";
/* ANA SAYFA (maket anasayfa.html M1 2. tur — BOLUM, PLAN_SUTUN, KUYRUK_SUTUN, TESIS_SUTUN, duyurularHtml; 332): rol başına bölüm (bilgi yüzleri +
   iş listesi), birden çok rolü olan alt alta; "Plan aç" yalnız plan açabilene; duyurular (379: okunan Bakanlık duyuruları, en yeni üstte, yeni
   sekmede; okunamadıysa uyarı şeridi, son liste durur) ve kaynak bağlantıları. Yalnız ekranda; hitap yok. */
import Link from "next/link";
import { Kosullar, Yuz, Yuzler } from "../../../components/bilgi/Bilgi";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { AltSatir, Bolum, Rozet, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { tarihNo } from "../../../components/secim/tarih";
import { TusBaglanti, tusSinifi } from "../../../components/tus/Tus";
import { ROL_ADI } from "../../../server/yetki/tanim";
import { PLAN_DURUM } from "../../planlar/sema";
import type { AnaBolum, AnaKuyrukSatiri, AnaListe, AnaPlanSatiri, AnaSayfa as Veri, AnaTesisSatiri } from "../server/anasayfa";
import stil from "./anasayfa.module.css";

const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const gunYaz = (g: string) => `${tarihNo(g)} ${GUNLER[new Date(`${g}T12:00:00Z`).getUTCDay()]}`;
const zamanYaz = (iso: string) => new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const PLAN_SUTUN: Sutun<AnaPlanSatiri>[] = [
  { k: "plan", genislik: "34%", baslik: "Plan", kart: "ust", sira: 1, hucre: (p) => <><Link className={stil.no} href={`/planlar/${p.id}`}>{p.no}</Link><AltSatir><Kirp>{`${p.musteri} · ${p.tesis}`}</Kirp></AltSatir></> },
  { k: "tarih", genislik: "22%", baslik: "Başlangıç", kart: "govde", sira: 2, hucre: (p) => <><KartEtiket>Başlangıç</KartEtiket>{gunYaz(p.baslangic)}</> },
  { k: "ekip", genislik: "26%", baslik: "Denetçi", kart: "govde", sira: 3, hucre: (p) => <><KartEtiket>Denetçi</KartEtiket><Kirp>{p.ekip || "—"}</Kirp></> },
  { k: "durum", genislik: "18%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (p) => <Rozet tur={PLAN_DURUM[p.durum][1]}>{PLAN_DURUM[p.durum][0]}</Rozet> },
];
const KUYRUK_SUTUN: Sutun<AnaKuyrukSatiri>[] = [
  { k: "rapor", genislik: "34%", baslik: "Rapor", kart: "ust", sira: 1, hucre: (r) => <><Link className={stil.no} href={`/onaylar/${r.id}`}>{r.no}</Link><AltSatir><Kirp>{r.ekipman}</Kirp></AltSatir></> },
  { k: "tarih", genislik: "28%", baslik: "Gönderildi", kart: "govde", sira: 2, hucre: (r) => <><KartEtiket>Gönderildi</KartEtiket><span>{r.gonderildi ? zamanYaz(r.gonderildi) : "—"}<AltSatir>{r.bekleme}</AltSatir></span></> },
  { k: "ekip", genislik: "24%", baslik: "Denetçi", kart: "govde", sira: 3, hucre: (r) => <><KartEtiket>Denetçi</KartEtiket><Kirp>{r.denetci}</Kirp></> },
  { k: "durum", genislik: "14%", baslik: "Durum", kart: "rozet", sira: 1, hucre: () => <Rozet tur="bekliyor">Onayda</Rozet> },
];
const tesisSutunlari = (planAc: boolean): Sutun<AnaTesisSatiri>[] => [
  { k: "tesis", genislik: "36%", baslik: "Müşteri · tesis", kart: "ust", sira: 1, hucre: (t) => (
    <span><span className={stil.ust}>{t.musteri}</span><Link className={stil.no} href={`/musteriler/tesis/${t.id}`}>{t.tesis}</Link>{t.il && <AltSatir>{t.il}</AltSatir>}</span>
  ) },
  { k: "tarih", genislik: "24%", baslik: "Sonraki kontrol", kart: "govde", sira: 2, hucre: (t) => (
    <><KartEtiket>Sonraki kontrol</KartEtiket><span>{tarihNo(t.sonraki)}<AltSatir uyari={t.kalan < 0}>{t.kalan < 0 ? `${-t.kalan} gün geçti` : t.kalan === 0 ? "bugün" : `${t.kalan} gün kaldı`}</AltSatir></span></>
  ) },
  { k: "ekipman", genislik: "14%", baslik: "Ekipman", kart: "govde", sira: 3, hucre: (t) => <><KartEtiket>Ekipman</KartEtiket>{t.ekipman}</> },
  { k: "islem", genislik: "26%", baslik: "İşlem", kart: "eylem", sira: 9, hucre: (t) => planAc ? <TusBaglanti tur="birincil" ikon="calendar-check" href={`/planlar/ac?tesis=${t.id}`}>Plan aç</TusBaglanti> : null },
];
function ListeBolumu({ l, id }: { l: AnaListe; id: string }) {
  const tumu = <TusBaglanti ikon="arrow-right" href={l.tumu[1]}>{l.tumu[0]}</TusBaglanti>;
  return (
    <Bolum id={id} baslik={l.baslik} sayac={<b>{l.kayitlar.length}</b>} tuslar={tumu}>
      {!l.kayitlar.length ? <p className={stil.bos}>{l.bos}</p>
        : l.tur === "plan" ? <Liste baslik={l.baslik} sutunlar={PLAN_SUTUN} kayitlar={l.kayitlar} anahtar={(x) => x.id} />
          : l.tur === "kuyruk" ? <Liste baslik={l.baslik} sutunlar={KUYRUK_SUTUN} kayitlar={l.kayitlar} anahtar={(x) => x.id} />
            : <Liste baslik={l.baslik} sutunlar={tesisSutunlari(l.planAc)} kayitlar={l.kayitlar} anahtar={(x) => x.id} />}
    </Bolum>
  );
}
function RolBolumu({ b, cok }: { b: AnaBolum; cok: boolean }) {
  return (
    <section className={stil.rol} aria-label={ROL_ADI[b.rol]}>
      {cok && <h2 className={stil.rolBaslik}>{ROL_ADI[b.rol]}</h2>}
      <Yuzler>{b.yuzler.map((y) => <Yuz key={y.ad} ikon={y.ikon} ad={y.ad} sayi={y.sayi} not={y.not} uyari={y.uyari} href={y.href} />)}</Yuzler>
      {b.liste && <ListeBolumu l={b.liste} id={`b-ana-${b.rol}`} />}
    </section>
  );
}

/* kaynaklar (src/server/duyuru/okuma.ts DUYURU_KAYNAKLARI ile aynı adresler — istemci sunucu dosyasını içe aktarmaz; tests/duyuru-ayristir kilitler) */
const KAYNAKLAR: [string, string][] = [["İSGGM", "https://www.csgb.gov.tr/isggm/duyurular/"], ["İSGÜM", "https://www.csgb.gov.tr/isgum/duyurular/"],
  ["İş ekipmanları", "https://isekipmanlari.csgb.gov.tr/sayfa.aspx?d=3"]];
const KAYNAK_AD: Record<Veri["duyuru"]["liste"][number]["kaynak"], string> = { isggm: "İSGGM", isgum: "İSGÜM", isekipman: "İş ekipmanları" };

function Duyurular({ d }: { d: Veri["duyuru"] }) {
  return (
    <Bolum id="b-ana-duyuru" baslik="Duyurular"
      sayac={<span className={stil.alt}><b>{d.liste.length}</b> duyuru{d.guncellendi ? ` · güncellendi ${zamanYaz(d.guncellendi)}` : ""}</span>}
      tuslar={<>{KAYNAKLAR.map(([ad, url]) => (
        <a key={ad} className={tusSinifi("ikincil")} href={url} target="_blank" rel="noopener noreferrer"><Ikon ad="arrow-right" kucuk />{ad}</a>))}</>}>
      {/* 390: hangi kaynak alınamadı (ötekiler okunduysa "Duyurular alınamadı" hepsi gibi okunuyordu); takılan okumada ad yok */}
      {d.hata && <SeritKap><Serit tur="uyari" ikon="triangle-alert">{d.hatali.length && d.hatali.length < KAYNAKLAR.length
        ? `${d.hatali.map((k) => KAYNAK_AD[k]).join(", ")} duyuruları alınamadı; son alınan liste gösteriliyor.`
        : "Duyurular alınamadı; son alınan liste gösteriliyor."}</Serit></SeritKap>}
      {d.liste.length
        ? <Kosullar ogeler={d.liste.map((x) => ({ tur: "bilgi" as const, ikon: "scroll-text", metin: <>
            <a className={stil.baglanti} href={x.url} target="_blank" rel="noopener noreferrer">{x.baslik}</a>
            <AltSatir>{tarihNo(x.tarih)} · {KAYNAK_AD[x.kaynak]}</AltSatir></> }))} />
        : <p className={stil.bos}>{d.guncellendi ? "Kaynaklarda duyuru yok." : "Duyurular henüz alınmadı; kaynaklara yukarıdaki bağlantılardan ulaşılır."}</p>}
    </Bolum>
  );
}

export function AnaSayfaGorunumu({ v }: { v: Veri }) {
  return (
    <>
      <SayfaBasi baslik="Ana sayfa" sayac={<span className={stil.alt}>{gunYaz(v.bugun)} · {v.ad}</span>}
        tuslar={v.planAc ? <TusBaglanti tur="birincil" ikon="calendar-check" href="/planlar/ac">Plan aç</TusBaglanti> : undefined} />
      {v.belgeBekleyen > 0 && <SeritKap>
        <Serit tur="uyari" ikon="file-signature" eylem={<TusBaglanti ikon="arrow-right" href="/onaylar/diger">Diğer belgeler</TusBaglanti>}>
          <b>{v.belgeBekleyen} belge imzanızı bekliyor</b> · bordro, eğitim ve zimmet formları Onaylar › Diğer belgeler&apos;de imzalanır.
        </Serit>
      </SeritKap>}
      {v.bolumler.map((b) => <RolBolumu key={b.rol} b={b} cok={v.bolumler.length > 1} />)}
      <Duyurular d={v.duyuru} />
    </>
  );
}
