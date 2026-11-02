"use client";
/* PLAN İÇİ · RAPORLAR (311; maket planlarim.html RAP_SUTUN, CIP_R, suzgecTanimla("r"), X["rapor-sil-ac"]): planın raporları (silinen görünmez),
   en yeni üstte, 20'şer sayfa (reisim "5 değil 20"). Süzgeç alan alan (Rapor no, Ekipman kodu — 2026-09-28 "genel ara olmasın") +
   durum çipleri. Satır: Rapor no · Ekipman (kod + tür) · Sonuç · Durum · Oluşturuldu · İşlem: kendi Yeni raporunda "Raporu düzenle" + Sil (2026-09-29
   "oluşan rapor denetçi tarafından da silinebilsin", onay penceresiyle), ötekinde "Raporu aç" — ikisi de saha rapor ekranına (/raporlar/<id>).
   Raporda "Pasife al" yok (2026-09-30 N11: pasife alma ekipman satırında). Yetki sunucuda; Sil sunucuda yeniden denetlenir (rapor_sil).
   2026-11-02 (liste maketi onaylı — reisim "filtreleme detaylı olmalı"): Raporlar listesiyle aynı düzen — süzgeçler başlıklı kutu (Ekipman türü ·
   Muayene uzmanı · Branş · Sonuç seçerek), Muayene uzmanı sütunu, sütun başlığından sıralama, satır seçimi → PDF indir (ZIP) ve Sil. Plan tek
   tesisin olduğu için müşteri / il / ilçe / tarih aralığı yok. */
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useBildir, useUyar } from "../../../components/bildirim/Bildirim";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { SayfaKutusu, SecimCubugu, SecimKutusu, useSatirSecimi } from "../../../components/liste/Secim";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { Secenek, SuzgecTanimi } from "../../../components/liste/suzgec";
import { useOnayla } from "../../../components/pencere/Onay";
import { DegerYok, Kod, Rozet } from "../../../components/sayfa/Sayfa";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { KALIP } from "../../../styles/kalip";
import { RAPOR_DURUM, SONUC_AD } from "../../raporlar/sema";
import { raporSilEylemi } from "../../raporlar/ui/eylemler";
import { silmeNedeni, TOPLU_EN_COK, topluSil, useTopluIndir, type TopluRapor } from "../../raporlar/ui/topluIs";
import { zamanNo } from "../sema";
import type { PlanEkipmani, PlanIci } from "../server/plan-ici";
import stil from "./planlar.module.css";

type Rapor = PlanIci["raporlar"][number];
type Ekipmanlar = ReadonlyMap<string, PlanEkipmani>;
const DURUM_SIRA = { taslak: 1, onayda: 2, onaylandi: 3, imzada: 4, imzali: 5 } as const;
const SONUC_SIRA = { uygun: 1, sartli: 2, uygun_degil: 3 } as const;
const benzersiz = (l: readonly Secenek[]): Secenek[] => [...new Map(l.map((x) => [x[0], x])).values()].sort((a, b) => a[1].localeCompare(b[1], "tr"));
const SIRALAR: Secenek[] = [
  ["varsayilan", "En yeni üstte"], ["no-artan", "Rapor no · artan"], ["no-azalan", "Rapor no · azalan"], ["ekipman-artan", "Ekipman · A–Z"],
  ["ekipman-azalan", "Ekipman · Z–A"], ["uzman-artan", "Muayene uzmanı · A–Z"], ["uzman-azalan", "Muayene uzmanı · Z–A"], ["sonuc-artan", "Sonuç · artan"],
  ["sonuc-azalan", "Sonuç · azalan"], ["durum-artan", "Durum · akış sırası"], ["durum-azalan", "Durum · ters sıra"], ["olustu-artan", "Oluşturuldu · eskiden yeniye"],
];

function tanim(ekp: Ekipmanlar, l: readonly Rapor[]): SuzgecTanimi<Rapor> {
  const kod = (r: Rapor) => ekp.get(r.ekipmanId)?.kod ?? "";
  const tumu: Secenek = ["tumu", "Tümü"];
  return {
    ad: "Raporlarda ara", ipucu: "Rapor no, ekipman kodu", birim: "rapor", imkansiz: "Bir rapor aynı anda iki durumda olamaz", sayfa: KALIP.sayfa.rapor, izgara: true,
    metin: (r) => [r.no, kod(r), ekp.get(r.ekipmanId)?.tur ?? ""].join(" "),
    alanlar: [
      { k: "no", ad: "Rapor no", ipucu: "ör. DM-1026-001", metin: (r) => r.no },
      { k: "kod", ad: "Ekipman kodu", ipucu: "ör. HT-10", metin: kod },
    ],
    cipler: (["taslak", "onayda", "onaylandi", "imzali"] as const).map((d) => ({ k: d, ad: RAPOR_DURUM[d][0], grup: "durum", test: (r: Rapor) => r.durum === d })),
    seciciler: [
      { k: "tur", ad: "Ekipman türü", secenek: () => [tumu, ...benzersiz(l.map((r) => [r.turId, ekp.get(r.ekipmanId)?.tur ?? "—"] as const))],
        gecer: (r, v) => v === "tumu" || r.turId === v },
      { k: "uzman", ad: "Muayene uzmanı", secenek: () => [tumu, ...benzersiz(l.map((r) => [r.uzman, r.uzman] as const))], gecer: (r, v) => v === "tumu" || r.uzman === v },
      { k: "brans", ad: "Branş", secenek: () => [tumu, ["m", "Mekanik"], ["e", "Elektrik"]], gecer: (r, v) => v === "tumu" || ekp.get(r.ekipmanId)?.brans === v },
      { k: "sonuc", ad: "Sonuç", secenek: () => [tumu, ["uygun", "Uygun"], ["uygun_degil", "Uygun değil"], ["sartli", "Şartlı uygun"], ["yok", "Sonuç yok"]],
        gecer: (r, v) => v === "tumu" || (v === "yok" ? !r.sonuc : r.sonuc === v) },
      { k: "sira", ad: "Sıralama", siralama: true, secenek: () => SIRALAR, gecer: () => true },
    ],
    siraAnahtari: {
      no: (r) => r.no, ekipman: kod, uzman: (r) => r.uzman, sonuc: (r) => (r.sonuc ? SONUC_SIRA[r.sonuc] : 0), durum: (r) => DURUM_SIRA[r.durum], olustu: (r) => r.olustu,
    },
  };
}

export function RaporBolumu({ v }: { v: PlanIci }) {
  const router = useRouter();
  const bildir = useBildir();
  const uyar = useUyar();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const [siliniyor, setSiliniyor] = useState(false);
  const ekp: Ekipmanlar = useMemo(() => new Map(v.ekipman.map((e) => [e.id, e])), [v.ekipman]);
  const t = useMemo(() => tanim(ekp, v.raporlar), [ekp, v.raporlar]);
  const s = useSuzgec(t, v.raporlar);
  const sec = useSatirSecimi<Rapor>((r) => r.id, TOPLU_EN_COK);
  const { ilerleme, indir } = useTopluIndir();
  const baslikId = `raporlar-${v.kart.id}`;
  const gorunen = s.sonuc.gorunen;
  const topluRapor = (r: Rapor): TopluRapor => {
    const e = ekp.get(r.ekipmanId);
    return { ...r, ekipmanKod: e?.kod ?? "", turAd: e?.tur ?? "", tesis: v.kart.tesis.ad };
  };

  async function sil(r: Rapor) {
    const kod = ekp.get(r.ekipmanId)?.kod ?? "—";
    const evet = await onayla({ baslik: "Raporu sil", metin: <><Kod>{r.no}</Kod> · {kod} raporu ve içine yazılan her şey silinir; geri alınamaz.</>, tus: "Sil", tehlike: true });
    if (!evet) return;
    baslat(async () => {
      const y = await raporSilEylemi(r.id, r.surum);
      bildir(y.tamam ? y.bildirim ?? `${r.no} silindi.` : y.genel ?? "Rapor silinemedi.");
      if (y.tamam) sec.kaldir([r.id]);
      router.refresh();
      if (y.tamam) document.getElementById(baslikId)?.focus();
    });
  }
  const indirSonucu = (y: Awaited<ReturnType<typeof indir>>) => {
    if (!y) return;
    const red = y.inemeyen.filter((x) => x.no);
    if (!y.inen && y.inemeyen.length && !red.length) { uyar(y.inemeyen[0].neden); return; }
    bildir(`${y.inen} rapor indirildi.${red.length ? ` ${red.length} rapor inemedi: ${red.slice(0, 3).map((x) => `${x.no} (${x.neden})`).join(", ")}` : ""}`);
  };
  async function topluSilBasla() {
    const l = [...sec.secili.values()].map(topluRapor);
    const olur = l.filter((r) => !silmeNedeni(r)), olmaz = l.length - olur.length;
    if (!olur.length) { uyar("Seçilenlerin hiçbiri silinemez: yalnız kendi Yeni raporunuz silinir."); return; }
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
  }

  const sutunlar: Sutun<Rapor>[] = [
    { k: "sec", genislik: "60px", baslik: "Seç", kart: "govde", sira: 0, siralanmaz: true,
      basHucre: <SayfaKutusu hepsi={gorunen.length > 0 && gorunen.every((r) => sec.secili.has(r.id))} bazi={gorunen.some((r) => sec.secili.has(r.id))}
        ad="Bu sayfadaki raporların hepsini seç" degistir={(ac) => sec.sayfa(gorunen, ac)} />,
      hucre: (r) => <SecimKutusu secili={sec.secili.has(r.id)} ad={r.no} degistir={(ac) => sec.sec(r, ac)} /> },
    { k: "no", genislik: "20%", baslik: "Rapor no", kart: "ust", sira: 1, hucre: (r) => <Kod>{r.no}</Kod> },
    { k: "ekipman", genislik: "16%", baslik: "Ekipman", kart: "govde", sira: 2, hucre: (r) => {
      const e = ekp.get(r.ekipmanId);
      return <span className={stil.hucreSatir}><span className={stil.kod}>{e?.kod ?? "—"}</span><Kirp>{e?.tur ?? ""}</Kirp></span>;
    } },
    { k: "uzman", genislik: "11%", baslik: "Muayene uzmanı", kart: "govde", sira: 3, hucre: (r) => <><KartEtiket>Uzman</KartEtiket><Kirp>{r.uzman}</Kirp></> },
    { k: "sonuc", genislik: "8%", baslik: "Sonuç", kart: "govde", sira: 4, hucre: (r) => <>
      <KartEtiket>Sonuç</KartEtiket>
      {r.sonuc ? <span className={r.sonuc === "uygun" ? stil.sonucUygun : stil.sonucHata}>{SONUC_AD[r.sonuc]}</span> : <DegerYok />}
    </> },
    { k: "durum", genislik: "12%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (r) => <Rozet tur={RAPOR_DURUM[r.durum][1]}>{RAPOR_DURUM[r.durum][0]}</Rozet> },
    { k: "olustu", genislik: "13%", baslik: "Oluşturuldu", kart: "govde", sira: 5, hucre: (r) => <><KartEtiket>Oluşturuldu</KartEtiket><span className={stil.zaman}>{zamanNo(r.olustu)}</span></> },
    { k: "eylem", genislik: "20%", baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem", sira: 9, hucre: (r) => {
      const duzenler = r.benim && r.durum === "taslak";
      return (
        <div className={stil.eylemTuslar}>
          {/* revizyondaki rapor silinmez (tamamlanan sürüm saklı — 318 incelemesi); düzenlenir */}
          {duzenler && r.revizyon === 0 && (
            <Tus tur="ikincil" ikon="trash-2" className={`${stil.ikonTus} ${stil.silTus}`} disabled={bekliyor} aria-label={`${r.no} sil`} title="Sil"
              onClick={() => void sil(r)}><span className="gizli">Sil</span></Tus>
          )}
          <TusBaglanti ikon={duzenler ? "pencil" : "file-text"} href={`/raporlar/${r.id}`}>{duzenler ? "Raporu düzenle" : "Raporu aç"}</TusBaglanti>
        </div>
      );
    } },
  ];

  return (
    <section className={stil.planBolum} aria-labelledby={baslikId}>
      <div className={stil.altBas}><h3 id={baslikId} tabIndex={-1}>Raporlar</h3><Sayac s={s} /></div>
      <SuzgecliListe s={s} on="r" baslik="Bu plandaki raporlar" sutunlar={sutunlar} anahtar={(r) => r.id} siralanir
        bosVeri={{ ikon: "file-text", baslik: "Bu planda rapor yok." }} />
      <SecimCubugu sayi={sec.secili.size} temizle={sec.temizle}>
        <Tus tur="ikincil" ikon="download" disabled={!!ilerleme} onClick={() => void indir([...sec.secili.values()].map(topluRapor), "plan-raporlari").then(indirSonucu)}>
          {ilerleme ? `İndiriliyor ${ilerleme}` : "PDF indir"}
        </Tus>
        <Tus tur="tehlike" ikon="trash-2" disabled={siliniyor} aria-busy={siliniyor || undefined} onClick={() => void topluSilBasla()}>Sil</Tus>
      </SecimCubugu>
    </section>
  );
}
