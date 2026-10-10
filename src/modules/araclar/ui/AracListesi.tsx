"use client";
/* ARAÇLAR LİSTELERİ (maket araclar.html #/ Araçlar · #/tutanaklar · #/benim sürücü görünümü): süzgeç (kalıp 15), tablo ↔ kart. "Araç ekle"
   yalnız "değiştirir" düzeyine; "Teslim tutanağı" değiştirene ve aracı olan sürücüye. Sürücü (kendi düzeyi) yalnız kendi aracını görür ve
   listenin üstünde bu haftanın kilometresini yazar. Karar sunucuda. 363: Görünüm (kalıp 8) — pasif araç listeden kalkar, "Pasif araçlar"da görünür;
   teslim penceresinde yok. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Girdi } from "../../../components/form/Form";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Bolum, DegerYok, SayfaBasi, Sekmeler } from "../../../components/sayfa/Sayfa";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import { BELGE_DURUM } from "../../onaylar/sema";
import { kmYaz } from "../sema";
import type { AracSatiri, KmSatiri, TutanakSatiri } from "../server/araclar";
import { kmKaydetEylemi } from "./eylemler";
import { AracDurumu, aracSekmeleri, BelgeHucre, haftaYaz, kimdeAd, KmRozeti, kmMetin, zamanYaz } from "./ortak";
import { AracPenceresi, TutanakGorunumu, TutanakPenceresi } from "./Pencereler";
import stil from "./araclar.module.css";

function aracTanim(): SuzgecTanimi<AracSatiri> {
  return {
    ad: "Araçlarda ara", ipucu: "Plaka, marka, kişi", birim: "araç", sayfa: 20, imkansiz: "Bir araç aynı anda hem depoda hem zimmette olamaz",
    metin: (v) => `${v.plaka} ${v.tur} ${v.marka} ${v.model} ${kimdeAd(v.kimde)}`,
    cipler: [
      { k: "depo", ad: "Depoda", grup: "yer", test: (v) => v.kimde.tip === "depo" },
      { k: "zimmet", ad: "Zimmette", grup: "yer", test: (v) => v.kimde.tip === "kisi" },
      { k: "belge", ad: "Belge yaklaşan / geçen", test: (v) => v.belgeler.some((b) => b.durum === "gecti" || b.durum === "yakin") },
      { k: "km", ad: "Kilometre girilmedi", test: (v) => v.kmDurum === "eksik" || v.kmDurum === "bekliyor" },
    ],
    seciciler: [{ k: "gorunum", ad: "Görünüm", bas: "etkin", secenek: () => [["etkin", "Etkin araçlar"], ["pasif", "Pasif araçlar"], ["hepsi", "Hepsi"]],
      gecer: (v, s) => s === "hepsi" || (s === "pasif") === !!v.pasif }],
  };
}

export function AracListesi({ araclar, kisiler, yaz, kendi }: { araclar: AracSatiri[]; kisiler: { id: string; ad: string }[]; yaz: boolean; kendi: boolean }) {
  const s = useSuzgec(aracTanim(), araclar);
  const [p, setP] = useState<null | "ekle" | "tutanak">(null);
  const belge = (i: number, ad: string) => function BelgeSutunu(v: AracSatiri) { return <><KartEtiket>{ad}</KartEtiket><BelgeHucre tarih={v.belgeler[i].tarih} durum={v.belgeler[i].durum} /></>; };
  const sutunlar: Sutun<AracSatiri>[] = [
    { k: "arac", genislik: "20%", baslik: "Araç", kart: "ust", sira: 1, hucre: (v) => (
      <span className={stil.hucreSatir}><Ikon ad="car" kucuk /><span><Link className={stil.ad} href={`/araclar/${v.id}`}>{v.plaka}</Link><AltSatir><Kirp>{v.tur} · {v.marka} {v.model}</Kirp></AltSatir></span></span>
    ) },
    { k: "kimde", genislik: "15%", baslik: "Kimde", kart: "govde", sira: 2, hucre: (v) => <><KartEtiket>Kimde</KartEtiket><Kirp>{kimdeAd(v.kimde)}</Kirp></> },
    { k: "km", genislik: "11%", baslik: "Kilometre", kart: "govde", sira: 3, hucre: (v) => <><KartEtiket>Kilometre</KartEtiket>{v.km != null ? <span className={stil.sayi}>{kmMetin(v.km)}</span> : <DegerYok />}</> },
    { k: "muayene", genislik: "11%", baslik: "Muayene", kart: "govde", sira: 4, hucre: belge(0, "Muayene") },
    { k: "sigorta", genislik: "11%", baslik: "Trafik sigortası", kart: "govde", sira: 5, hucre: belge(1, "Trafik sigortası") },
    { k: "kasko", genislik: "11%", baslik: "Kasko", kart: "govde", sira: 6, hucre: belge(2, "Kasko") },
    { k: "hafta", genislik: "10%", baslik: "Bu hafta km", kart: "govde", sira: 7, hucre: (v) => <><KartEtiket>Bu hafta km</KartEtiket><KmRozeti d={v.kmDurum} /></> },
    { k: "durum", genislik: "11%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (v) => <AracDurumu v={v} /> },
  ];
  const tutanakAcik = yaz || (kendi && araclar.length > 0);
  return (
    <>
      <SayfaBasi baslik={kendi ? "Aracım" : "Araçlar"} sayac={<Sayac s={s} />} tuslar={<>
        {yaz && <Tus tur="ikincil" ikon="plus" onClick={() => setP("ekle")}>Araç ekle</Tus>}
        {tutanakAcik && <Tus ikon="clipboard-check" onClick={() => setP("tutanak")}>{kendi ? "Teslim et" : "Teslim tutanağı"}</Tus>}
      </>} />
      <Sekmeler ad="Araç bölümleri" ogeler={aracSekmeleri(yaz, kendi)} secili="/araclar" />
      {kendi && araclar.length > 0 &&
        <Bolum id="b-surucu-km" baslik="Haftalık kilometre">{araclar.map((v) => <KmFormu key={v.id} arac={v} etiketli />)}</Bolum>}
      <SuzgecliListe s={s} on="a" baslik="Araçlar" sutunlar={sutunlar} anahtar={(v) => v.id} href={(v) => `/araclar/${v.id}`}
        bosVeri={kendi
          ? { ikon: "car", baslik: "Üzerinizde araç yok", metin: "Size bir araç teslim edilince burada görünür." }
          : { ikon: "car", baslik: "Araç yok", metin: "Araç ekleyince depoda başlar; teslim tutanağıyla kişiye verilir." }} />
      {p === "ekle" && <AracPenceresi kapat={() => setP(null)} />}
      {p === "tutanak" && <TutanakPenceresi kapat={() => setP(null)} araclar={araclar.filter((v) => !v.pasif)} kisiler={kisiler} surucu={kendi} />}
    </>
  );
}

/** haftalık kilometre girişi (sürücü listesinde ve araç sayfasında) */
export function KmFormu({ arac, etiketli = false, buHafta, oncekiKm }: { arac: Pick<AracSatiri, "id" | "plaka" | "km">; etiketli?: boolean; buHafta?: number | null; oncekiKm?: number | null }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [deger, setDeger] = useState(buHafta != null ? kmYaz(buHafta) : "");
  const [hata, setHata] = useState<string | null>(null);
  const id = `km-${arac.id}`;
  const son = oncekiKm !== undefined ? oncekiKm : arac.km;
  const kaydet = () => baslat(async () => {
    const r = await kmKaydetEylemi(arac.id, deger);
    if (!r.tamam) { setHata(r.hatalar?.km ?? r.genel ?? "Kaydedilemedi."); document.getElementById(id)?.focus(); return; }
    setHata(null);
    bildir(`${arac.plaka}: bu haftanın kilometresi ${r.ileti ?? "kaydedildi"}.`);
    router.refresh();
  });
  return (
    <div className={stil.kmGir}>
      <label className={stil.etiket} htmlFor={id}>{etiketli ? `${arac.plaka} · ` : ""}bu hafta kilometre</label>
      <div className={stil.kmSatir}>
        <Girdi id={id} value={deger} inputMode="numeric" maxLength={9} hata={!!hata} mesajli aria-describedby={`${id}-ipucu`}
          onChange={(e) => setDeger(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") kaydet(); }} />
        <Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>{buHafta != null ? "Düzelt" : "Kaydet"}</Tus>
      </div>
      <p id={`${id}-ipucu`} className={hata ? stil.ipucuHata : stil.ipucu}>{hata ?? (son != null ? `Son bilinen: ${kmYaz(son)} km` : "")}</p>
    </div>
  );
}

export function KmGecmisi({ satirlar }: { satirlar: KmSatiri[] }) {
  if (!satirlar.length) return <p className={stil.bosSatir}>Haftalık kilometre girilmedi.</p>;
  const sutunlar: Sutun<KmSatiri>[] = [
    { k: "hafta", genislik: "25%", baslik: "Hafta", kart: "ust", sira: 1, hucre: (x) => <span>{haftaYaz(x.hafta)}</span> },
    { k: "km", genislik: "20%", baslik: "Kilometre", kart: "govde", sira: 2, hucre: (x) => <><KartEtiket>Kilometre</KartEtiket>{x.km != null ? <span className={stil.sayi}>{kmYaz(x.km)}</span> : <DegerYok>Girilmedi</DegerYok>}</> },
    { k: "yol", genislik: "20%", baslik: "Haftalık yol", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>Haftalık yol</KartEtiket>{x.yol != null ? <span className={stil.sayi}>{kmMetin(x.yol)}</span> : <DegerYok />}</> },
    { k: "giren", genislik: "35%", baslik: "Giren", kart: "govde", sira: 4, hucre: (x) => <><KartEtiket>Giren</KartEtiket>{x.giren ? <span>{x.giren}<AltSatir>{zamanYaz(x.zaman!)}</AltSatir></span> : <DegerYok />}</> },
  ];
  return <Liste baslik="Haftalık kilometre" sutunlar={sutunlar} kayitlar={satirlar} anahtar={(x) => x.hafta} />;
}

function tutanakSutunlari(aracli: boolean, setGoster: (t: TutanakSatiri) => void): Sutun<TutanakSatiri>[] {
  return [
    { k: "tarih", genislik: "18%", baslik: "Tarih", kart: "ust", sira: 1, hucre: (t) => <span>{zamanYaz(t.zaman)}<AltSatir>{t.no ?? "Tutanaksız teslim"}</AltSatir></span> },
    ...(aracli ? [{ k: "arac", genislik: "14%", baslik: "Araç", kart: "govde" as const, sira: 2, hucre: (t: TutanakSatiri) => <><KartEtiket>Araç</KartEtiket><Link className={stil.ad} href={`/araclar/${t.aracId}`}>{t.plaka}</Link></> }] : []),
    { k: "kim", genislik: aracli ? "28%" : "36%", baslik: "Teslim eden → alan", kart: "govde", sira: 3, hucre: (t) => (
      <><KartEtiket>Teslim eden → alan</KartEtiket><span><Kirp>{t.eden} → <b>{t.alan}</b></Kirp>{t.imza && <AltSatir>İmza: {BELGE_DURUM[t.imza][0]}</AltSatir>}</span></>
    ) },
    { k: "km", genislik: "12%", baslik: "Kilometre", kart: "govde", sira: 4, hucre: (t) => <><KartEtiket>Kilometre</KartEtiket>{t.km != null ? <span className={stil.sayi}>{kmYaz(t.km)}</span> : <DegerYok />}</> },
    { k: "foto", genislik: "10%", baslik: "Fotoğraf", kart: "govde", sira: 5, hucre: (t) => <><KartEtiket>Fotoğraf</KartEtiket><span className={stil.hucreSatir}><Ikon ad="camera" kucuk />{t.fotolar.length}</span></> },
    { k: "eylem", genislik: aracli ? "18%" : "24%", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: (t) => (
      <span className={stil.tuslar}>
        <Tus tur="ikincil" ikon="file-text" onClick={() => setGoster(t)}>Tutanak</Tus>
        {t.no && <a className={tusSinifi("ikincil")} href={`/araclar/tutanak/${t.hareketId}/pdf`} download aria-label={`${t.no} PDF`}><Ikon ad="file-text" kucuk />PDF</a>}
      </span>
    ) },
  ];
}

/** aracın kartındaki tutanakları (yalnız o araç) */
export function TutanakTablosu({ tutanaklar }: { tutanaklar: TutanakSatiri[] }) {
  const [goster, setGoster] = useState<TutanakSatiri | null>(null);
  return (
    <>
      <Liste baslik="Teslim tutanakları" sutunlar={tutanakSutunlari(false, setGoster)} kayitlar={tutanaklar} anahtar={(t) => t.id} />
      {goster && <TutanakGorunumu t={goster} kapat={() => setGoster(null)} />}
    </>
  );
}

function tutanakTanimi(l: readonly TutanakSatiri[]): SuzgecTanimi<TutanakSatiri> {
  const tekil = (x: string[]) => [...new Set(x)].sort((a, b) => a.localeCompare(b, "tr")).map((k) => [k, k] as const);
  return {
    ad: "Tutanaklarda ara", ipucu: "Plaka, kişi, tutanak no", birim: "tutanak", sayfa: 20, imkansiz: "Bir tutanak aynı anda iki imza durumunda olamaz",
    metin: (t) => `${t.plaka} ${t.eden} ${t.alan} ${t.no ?? ""}`,
    cipler: [
      { k: "imza", ad: "İmza bekliyor", grup: "imza", test: (t) => t.imza === "bekliyor" },
      { k: "imzali", ad: "İmzalandı", grup: "imza", test: (t) => t.imza === "imzali" },
      { k: "tutanaksiz", ad: "Tutanaksız teslim", test: (t) => !t.no },
    ],
    seciciler: [
      { k: "arac", ad: "Araç", secenek: () => [["tumu", "Tümü"], ...tekil(l.map((t) => t.plaka))], gecer: (t, s) => s === "tumu" || t.plaka === s },
      { k: "kisi", ad: "Kişi", secenek: () => [["tumu", "Tümü"], ...tekil(l.flatMap((t) => [t.eden, t.alan]))], gecer: (t, s) => s === "tumu" || t.eden === s || t.alan === s },
    ],
  };
}

/** 481 (site taraması, kalıp 14–15): Araçlar › Tutanaklar — süzgeçli (arama · imza çipleri · ve/veya · Araç · Kişi), boşken de görünür */
export function TutanakSayfasi({ tutanaklar, baslik, sekmeler }: { tutanaklar: TutanakSatiri[]; baslik: string; sekmeler: readonly (readonly [string, string])[] }) {
  const [goster, setGoster] = useState<TutanakSatiri | null>(null);
  const s = useSuzgec(tutanakTanimi(tutanaklar), tutanaklar);
  return (
    <>
      <SayfaBasi baslik={baslik} sayac={<Sayac s={s} />} />
      <Sekmeler ad="Araç bölümleri" ogeler={sekmeler} secili="/araclar/tutanaklar" />
      <SuzgecliListe s={s} on="ttn" baslik="Teslim tutanakları" sutunlar={tutanakSutunlari(true, setGoster)} anahtar={(t) => t.id}
        bosVeri={{ ikon: "file-text", baslik: "Tutanak yok", metin: "Her teslim alma ve teslim etme bir tutanak olarak burada birikir." }} />
      {goster && <TutanakGorunumu t={goster} kapat={() => setGoster(null)} />}
    </>
  );
}
