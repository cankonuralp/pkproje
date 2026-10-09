"use client";
/* PERFORMANS EKRANLARI (maket performans.html M15 — panoCiz, kisiCiz, anahtarlar, K_SUTUN, G_SUTUN; 329). Dönem (bu ay · bu yıl · geçen yıl ·
   tarih aralığı) ve branş GÖRÜNÜM ANAHTARIDIR (kalıp 8: süzgeç değil) — adreste (?donem=…&bas=…&bit=…&brans=…), veri sunucuda yeniden hesaplanır.
   Grafikler tek üreticiden (components/grafik). Kazanç yalnız sunucu "kazanç görünür" dediyse (denetçi kendi sayfasında görmez). */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bilgi, BilgiListesi, Yuz, Yuzler } from "../../../components/bilgi/Bilgi";
import { baytIndir, dosyaGunu } from "../../../components/disa/indir";
import { XLSX_TURU, xlsxBayt } from "../../../components/disa/xlsx";
import { Alan, ipucuId } from "../../../components/form/Form";
import { Grafik, Grafikler } from "../../../components/grafik/Grafik";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import { AltSatir, Bolum, DegerYok, Kirinti, NesneBasi, Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { tarihNo } from "../../../components/secim/tarih";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { DONEM_AD, type Brans, type Donem, type DonemKodu, type Ozet, type SureOzeti, type ZamanGrubu } from "../hesap";
import type { KisiGunlugu, KisiPerformansi, PanoKisisi, PerformansPanosu } from "../server/performans";
import stil from "./performans.module.css";

const tl = (kurus: number) => `${Math.round(kurus / 100).toLocaleString("tr-TR")} TL`;
const ortYaz = (n: number) => (n ? n.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : "—");
const yuzde = (a: number, n: number) => (n ? `%${Math.round((a * 100) / n)}` : "—");
const BRANS: Record<"tumu" | Brans, string> = { tumu: "Tümü", m: "Mekanik", e: "Elektrik" };
const bransAd = (b: Brans | null) => (b === "m" ? "Mekanik" : b === "e" ? "Elektrik" : "—");
const ilkAd = (ad: string) => ad.split(" ")[0];
const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const gunYaz = (g: string) => `${tarihNo(g)} ${GUNLER[new Date(`${g}T12:00:00Z`).getUTCDay()]}`;

/* ── DÖNEM VE BRANŞ ANAHTARLARI ── */
const AID = { bas: "w-perf-bas", bit: "w-perf-bit" } as const;
function Anahtarlar({ donem, aralikHata, brans, bransSecilir }: { donem: Donem; aralikHata: string | null; brans?: "tumu" | Brans; bransSecilir?: boolean }) {
  const router = useRouter(), yol = usePathname();
  const [a, setA] = useState({ bas: donem.kod === "aralik" ? donem.bas : "", bit: donem.kod === "aralik" ? donem.bit : "" });
  const [acik, setAcik] = useState(donem.kod === "aralik" || !!aralikHata);
  /* aralık hatası: odak Başlangıç'a, hata iki alana bağlı (maket aralik-uygula; 329–332 incelemesi) */
  useEffect(() => { if (aralikHata) document.getElementById(AID.bas)?.focus(); }, [aralikHata]);
  const git = (p: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(p)) if (v && !(k === "donem" && v === "ay") && !(k === "brans" && v === "tumu")) q.set(k, v);
    router.push(q.size ? `${yol}?${q}` : yol);
  };
  const bransP = bransSecilir && brans !== "tumu" ? brans : undefined;
  return (
    <div className={stil.anahtar}>
      <div className={stil.grup} role="group" aria-label="Dönem">
        {(Object.keys(DONEM_AD) as DonemKodu[]).map((k) => (
          /* basılı = UYGULANAN dönem; aralık tuşu yalnız aralık alanlarını açar (aria-expanded) — veri değişmeden basılı görünmez (329–332 incelemesi) */
          <button key={k} type="button" className={stil.sekme} aria-pressed={donem.kod === k} aria-expanded={k === "aralik" ? acik : undefined}
            onClick={() => (k === "aralik" ? setAcik(true) : (setAcik(false), git({ donem: k, brans: bransP })))}>{DONEM_AD[k]}</button>
        ))}
      </div>
      {acik && <div className={stil.aralik}>
        <Alan id={AID.bas} etiket="Başlangıç" hata={aralikHata ?? undefined}>
          <TarihAlani id={AID.bas} ad="Başlangıç" deger={a.bas} degistir={(x) => setA({ ...a, bas: x })} tanim={aralikHata ? ipucuId(AID.bas) : undefined} />
        </Alan>
        <Alan id={AID.bit} etiket="Bitiş">
          <TarihAlani id={AID.bit} ad="Bitiş" deger={a.bit} degistir={(x) => setA({ ...a, bit: x })} tanim={aralikHata ? ipucuId(AID.bas) : undefined} />
        </Alan>
        <Tus tur="ikincil" onClick={() => git({ donem: "aralik", bas: a.bas, bit: a.bit, brans: bransP })}>Uygula</Tus>
      </div>}
      {bransSecilir && brans && <div className={stil.grup} role="group" aria-label="Branş">
        {(Object.keys(BRANS) as ("tumu" | Brans)[]).map((k) => (
          <button key={k} type="button" className={stil.sekme} aria-pressed={brans === k}
            onClick={() => git({ donem: donem.kod, bas: donem.kod === "aralik" ? donem.bas : undefined, bit: donem.kod === "aralik" ? donem.bit : undefined, brans: k })}>{BRANS[k]}</button>
        ))}
      </div>}
      <p className={stil.donem}>{tarihNo(donem.bas)} – {tarihNo(donem.bit)}{brans && brans !== "tumu" ? ` · ${BRANS[brans].toLocaleLowerCase("tr")}` : ""}</p>
    </div>
  );
}

/* ── YÜZLER ── */
function OzetYuzleri({ o, kazanc }: { o: Ozet; kazanc: boolean }) {
  return (
    <Yuzler>
      <Yuz ikon="file-text" ad="Rapor" sayi={o.rapor} />
      <Yuz ikon="calendar-check" ad="Çalışılan gün" sayi={o.gun} />
      <Yuz ikon="gauge" ad="Gün başı rapor" sayi={ortYaz(o.ort)} />
      {kazanc && <Yuz ikon="wallet" ad="Kazanç" sayi={tl(o.kazanc)} not={`gün başı ${o.gun ? tl(o.gunKazanc) : "—"}`} />}
      <Yuz ikon="undo-2" ad="Geri gönderilen" sayi={o.geri} />
    </Yuzler>
  );
}
function SureYuzleri({ s }: { s: SureOzeti }) {
  return (
    <Bolum id="b-perf-sure" baslik="Tamamlanma süresi" sayac={<><b>{s.n}</b> tamamlanan rapor</>}>
      <Yuzler>
        <Yuz ikon="circle-check" ad="24 saat içinde" sayi={s.h24} not={yuzde(s.h24, s.n)} />
        <Yuz ikon="clock" ad="24–48 saat" sayi={s.h48} not={yuzde(s.h48, s.n)} />
        <Yuz ikon="triangle-alert" ad="48 saatten uzun" sayi={s.h48p} not={yuzde(s.h48p, s.n)} uyari={s.h48p > 0} />
      </Yuzler>
    </Bolum>
  );
}
function ZamanGrafigi({ d, z, kazanc }: { d: Donem; z: ZamanGrubu[]; kazanc: boolean }) {
  return <Grafik baslik={d.grup === "gun" ? "Günlük rapor" : "Aylık rapor"} ilkSutun={d.grup === "gun" ? "Gün" : "Ay"} tam seriler={[["m", "Mekanik"], ["e", "Elektrik"]]}
    satirlar={z.map((x) => ({ etiket: x.etiket, tam: x.tam, parcalar: [["m", x.m], ["e", x.e]], deger: x.rapor ? `${x.rapor} rapor` : "—", alt: x.rapor && kazanc ? tl(x.kazanc) : undefined }))} />;
}

/* ── PANO ── */
function kisiTanim(kazanc: boolean) {
  return {
    ad: "Personelde ara", ipucu: "Ad, meslek", birim: "kişi", sayfa: 20, imkansiz: "", cipler: [],
    metin: (p: PanoKisisi) => `${p.ad} ${p.meslek}`,
    seciciler: [
      { k: "gorunum", ad: "Görünüm", bas: "yazan", secenek: () => [["yazan", "Rapor yazanlar"], ["hepsi", "Bütün denetçiler"]] as [string, string][],
        gecer: (p: PanoKisisi, v: string) => v === "hepsi" || p.o.rapor > 0 || p.o.geri > 0 },
      { k: "sira", ad: "Sıralama", siralama: true, secenek: () => [["varsayilan", kazanc ? "Kazanç (çoktan aza)" : "Rapor (çoktan aza)"], ["rapor-azalan", "Rapor (çoktan aza)"],
        ["ort-azalan", "Gün başı (çoktan aza)"], ["ad-artan", "Ad (A–Z)"]] as [string, string][], gecer: () => true },
    ],
    /* her başlık sıralar (329–332 incelemesi: anahtarı olmayan başlık "sıralı" görünüp sıralamıyordu) */
    siraAnahtari: { rapor: (p: PanoKisisi) => p.o.rapor, ort: (p: PanoKisisi) => p.o.ort, ad: (p: PanoKisisi) => p.ad, kazanc: (p: PanoKisisi) => p.o.kazanc,
      gun: (p: PanoKisisi) => p.o.gun, geri: (p: PanoKisisi) => p.o.geri, h24: (p: PanoKisisi) => p.o.sure.pay, h48p: (p: PanoKisisi) => p.o.sure.h48p,
      son: (p: PanoKisisi) => p.o.son ?? "" },
    varsayilanSira: (a: PanoKisisi, b: PanoKisisi) => (kazanc ? b.o.kazanc - a.o.kazanc : b.o.rapor - a.o.rapor) || a.ad.localeCompare(b.ad, "tr"),
  };
}
function kisiSutunlari(kazanc: boolean): Sutun<PanoKisisi>[] {
  const l: (Sutun<PanoKisisi> | false)[] = [
    { k: "ad", genislik: "18%", baslik: "Personel", kart: "ust", sira: 1, hucre: (p) => <><Link className={stil.ad} href={`/performans/${p.id}`}>{p.ad}</Link><AltSatir><Kirp>{p.meslek}</Kirp></AltSatir></> },
    { k: "rapor", genislik: "8%", baslik: "Rapor", kart: "govde", sira: 2, hucre: (p) => <><KartEtiket>Rapor</KartEtiket><span className={stil.sayi}>{p.o.rapor}</span></> },
    { k: "gun", genislik: "8%", baslik: "Gün", kart: "govde", sira: 3, hucre: (p) => <><KartEtiket>Çalışılan gün</KartEtiket><span className={stil.sayi}>{p.o.gun}</span></> },
    { k: "ort", genislik: "9%", baslik: "Gün başı", kart: "govde", sira: 4, hucre: (p) => <><KartEtiket>Gün başı rapor</KartEtiket><span className={stil.sayi}>{ortYaz(p.o.ort)}</span></> },
    kazanc && { k: "kazanc", genislik: "12%", baslik: "Kazanç", kart: "govde", sira: 5, hucre: (p) => <><KartEtiket>Kazanç</KartEtiket><span className={stil.sayi}>{p.o.kazanc ? tl(p.o.kazanc) : "—"}</span></> },
    { k: "geri", genislik: "10%", baslik: "Geri gönderilen", kart: "govde", sira: 6, hucre: (p) => <><KartEtiket>Geri gönderilen</KartEtiket><span className={p.o.geri ? `${stil.sayi} ${stil.uyari}` : stil.sayi}>{p.o.geri}</span></> },
    { k: "h24", genislik: "11%", baslik: "24 saat içinde", kart: "govde", sira: 7, hucre: (p) => <><KartEtiket>24 saat içinde</KartEtiket>{p.o.sure.n
      ? <span><span className={stil.sayi}>{yuzde(p.o.sure.h24, p.o.sure.n)}</span><AltSatir>{p.o.sure.h24} / {p.o.sure.n}</AltSatir></span> : <DegerYok />}</> },
    { k: "h48p", genislik: "12%", baslik: "48 saatten uzun", kart: "govde", sira: 8, hucre: (p) => <><KartEtiket>48 saatten uzun</KartEtiket>
      <span><span className={p.o.sure.h48p ? `${stil.sayi} ${stil.uyari}` : stil.sayi}>{p.o.sure.h48p}</span>{p.o.sure.n > 0 && <AltSatir>24–48: {p.o.sure.h48}</AltSatir>}</span></> },
    { k: "son", genislik: "12%", baslik: "Son rapor", kart: "govde", sira: 9, hucre: (p) => <><KartEtiket>Son rapor</KartEtiket>{p.o.son ? tarihNo(p.o.son) : <DegerYok />}</> },
  ];
  return l.filter((x): x is Sutun<PanoKisisi> => !!x);
}
function excelAktar(v: PerformansPanosu, l: readonly PanoKisisi[]) {
  const bas = ["Personel", "Meslek", "Rapor", "Çalışılan gün", "Gün başı rapor", ...(v.kazanc ? ["Kazanç (TL, KDV hariç)"] : []), "Geri gönderilen", "Tamamlanan",
    "24 saat içinde", "24–48 saat", "48 saatten uzun", "Son rapor"];
  baytIndir(`performans-${dosyaGunu()}.xlsx`, xlsxBayt("Performans", [bas, ...l.map((p) => [p.ad, p.meslek, p.o.rapor, p.o.gun, Math.round(p.o.ort * 10) / 10,
    ...(v.kazanc ? [Math.round(p.o.kazanc / 100)] : []), p.o.geri, p.o.sure.n, p.o.sure.h24, p.o.sure.h48, p.o.sure.h48p, p.o.son ? tarihNo(p.o.son) : ""])]), XLSX_TURU);
}
export function PanoGorunumu({ v }: { v: PerformansPanosu }) {
  const s = useSuzgec(kisiTanim(v.kazanc), v.kisiler);
  const sureli = v.kisiler.filter((x) => x.o.sure.n).sort((a, b) => b.o.sure.pay - a.o.sure.pay || a.ad.localeCompare(b.ad, "tr"));
  const kazananlar = v.kisiler.filter((x) => x.o.kazanc > 0).sort((a, b) => b.o.kazanc - a.o.kazanc);
  return (
    <>
      <SayfaBasi baslik="Performans" tuslar={<Tus tur="ikincil" ikon="file-spreadsheet" disabled={!s.sonuc.liste.length} onClick={() => excelAktar(v, s.sonuc.liste)}>Excel&apos;e aktar</Tus>} />
      <Anahtarlar donem={v.donem} aralikHata={v.aralikHata} brans={v.brans} bransSecilir={v.bransSecilir} />
      <OzetYuzleri o={v.ozet} kazanc={v.kazanc} />
      <SureYuzleri s={v.ozet.sure} />
      <Grafikler>
        <Grafik baslik="24 saat içinde tamamlanan" ilkSutun="Personel" ust={100} onEk="%" seriler={[["k", "24 saat içinde"]]} bos="Bu dönemde tamamlanan rapor yok."
          satirlar={sureli.map((x) => ({ etiket: ilkAd(x.ad), tam: x.ad, parcalar: [["k", x.o.sure.pay]], deger: `%${x.o.sure.pay}`, alt: `${x.o.sure.h24} / ${x.o.sure.n} rapor` }))} />
        <Grafik baslik="48 saatten uzun süren (rapor)" ilkSutun="Personel" tam seriler={[["h", "48 saatten uzun"]]} bos="Bu dönemde tamamlanan rapor yok."
          satirlar={[...sureli].sort((a, b) => b.o.sure.h48p - a.o.sure.h48p || a.ad.localeCompare(b.ad, "tr")).map((x) => ({ etiket: ilkAd(x.ad), tam: x.ad,
            parcalar: [["h", x.o.sure.h48p]], deger: `${x.o.sure.h48p} rapor`, alt: `24–48 saat: ${x.o.sure.h48}` }))} />
      </Grafikler>
      <Grafikler>
        <ZamanGrafigi d={v.donem} z={v.zaman} kazanc={v.kazanc} />
        {v.kazanc && <Grafik baslik="Personel başına kazanç" ilkSutun="Personel" seriler={[["k", "Kazanç"]]} birim=" TL" bos="Bu dönemde kazanç yok."
          satirlar={kazananlar.map((x) => ({ etiket: ilkAd(x.ad), tam: x.ad, parcalar: [["k", Math.round(x.o.kazanc / 100)]], deger: tl(x.o.kazanc), alt: `${x.o.rapor} rapor · ${x.o.gun} gün` }))} />}
      </Grafikler>
      <Bolum id="b-perf-kisi" baslik="Personel" sayac={<Sayac s={s} />}>
        <SuzgecliListe s={s} on="p" baslik="Personel performansı" sutunlar={kisiSutunlari(v.kazanc)} anahtar={(p) => p.id} href={(p) => `/performans/${p.id}`} siralanir
          bosVeri={{ ikon: "users", baslik: "Denetçi yok", metin: "Denetçi rolündeki personel burada görünür." }} />
      </Bolum>
    </>
  );
}

/* ── KİŞİ ── */
function gunlukSutunlari(kazanc: boolean, isGor: boolean): Sutun<KisiGunlugu>[] {
  const l: (Sutun<KisiGunlugu> | false)[] = [
    { k: "gun", genislik: "22%", baslik: "Gün", kart: "ust", sira: 1, hucre: (g) => gunYaz(g.gun) },
    { k: "is", genislik: "34%", baslik: "İş / tesis", kart: "govde", sira: 2, hucre: (g) => (
      <span>{g.isler.map((x, i) => <span key={x.id}>{i > 0 && ", "}{isGor ? <Link className={stil.no} href={`/muhasebe/is/${x.id}`}>{x.no}</Link> : <span className={stil.sayi}>{x.no}</span>}</span>)}
        <AltSatir><Kirp>{`${g.musteri} · ${g.tesis}`}</Kirp></AltSatir></span>
    ) },
    { k: "rapor", genislik: "12%", baslik: "Rapor", kart: "govde", sira: 3, hucre: (g) => <><KartEtiket>Rapor</KartEtiket><span className={stil.sayi}>{g.rapor}</span></> },
    kazanc && { k: "kazanc", genislik: "14%", baslik: "Kazanç", kart: "govde", sira: 4, hucre: (g) => <><KartEtiket>Kazanç</KartEtiket><span className={stil.sayi}>{tl(g.kazanc)}</span></> },
    { k: "durum", genislik: "18%", baslik: "İmzalı", kart: "rozet", sira: 1, hucre: (g) => (
      <Rozet tur={g.imzali === g.rapor ? "tamam" : g.imzali ? "kabul" : "notr"}>{g.imzali} / {g.rapor} imzalı</Rozet>
    ) },
  ];
  return l.filter((x): x is Sutun<KisiGunlugu> => !!x);
}
export function KisiGorunumu({ v, personelGor, isGor }: { v: KisiPerformansi; personelGor: boolean; isGor: boolean }) {
  const s = v.ozet.sure;
  return (
    <>
      {!v.kendi && <Kirinti ogeler={[["Performans", "/performans"], [v.kisi.ad]]} />}
      <NesneBasi baslik={v.kisi.ad} altIkon="id-card" alt={`${v.kisi.meslek} · ${bransAd(v.kisi.brans)}`}
        tuslar={personelGor && !v.kendi ? <TusBaglanti ikon="user" href={`/personel/${v.kisi.id}`}>Personel kartı</TusBaglanti> : undefined} />
      <Anahtarlar donem={v.donem} aralikHata={v.aralikHata} />
      <OzetYuzleri o={v.ozet} kazanc={v.kazanc} />
      <SureYuzleri s={s} />
      <Grafikler>
        <ZamanGrafigi d={v.donem} z={v.zaman} kazanc={v.kazanc} />
        <Grafik baslik="Tamamlanma süresi (rapor)" ilkSutun="Süre" tam seriler={[["k", "Rapor"]]} bos="Bu dönemde tamamlanan rapor yok." satirlar={s.n ? [
          { etiket: "24 saat içinde", parcalar: [["k", s.h24]], deger: `${s.h24} rapor`, alt: yuzde(s.h24, s.n) },
          { etiket: "24–48 saat", parcalar: [["k", s.h48]], deger: `${s.h48} rapor`, alt: yuzde(s.h48, s.n) },
          { etiket: "48 saatten uzun", parcalar: [["h", s.h48p]], deger: `${s.h48p} rapor`, alt: yuzde(s.h48p, s.n) }] : []} />
        <Grafik baslik="Rapor süreci · ortalama süre (saat)" ilkSutun="Adım" seriler={[["k", "Ortalama saat"]]} bos="Bu dönemde gönderilen rapor yok."
          satirlar={v.surec.some((x) => x.n) ? v.surec.map((x) => ({ etiket: x.ad, parcalar: [["k", x.ort]], deger: x.n ? `ort. ${x.ort.toLocaleString("tr-TR")} saat` : "—", alt: `${x.n} rapor` })) : []} />
      </Grafikler>
      <Bolum id="b-perf-gunluk" baslik="Günlük iş" sayac={<><b>{v.gunluk.length}</b> gün × tesis</>}>
        {v.gunluk.length ? <Liste baslik="Günlük iş" sutunlar={gunlukSutunlari(v.kazanc, isGor)} kayitlar={v.gunluk} anahtar={(g) => `${g.gun}|${g.tesis}|${g.musteri}`} />
          : <p className={stil.ozet}>Bu dönemde rapor yok.</p>}
      </Bolum>
      {v.kendi && <BilgiListesi><Bilgi etiket="Not" genis>Kendi sayılarınız; kazanç ve öteki personel yöneticinizin ekranında.</Bilgi></BilgiListesi>}
    </>
  );
}
