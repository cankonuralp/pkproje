"use client";
/* İŞ VE FATURA SAYFASI PARÇALARI (maket muhasebe.html isCiz / faturaCiz / faturaPencere / tahsilatPencere): raporlar (birim fiyatı ve kaynağı,
   faturası, durumu; süzgeçli), işin faturaları, fatura kalemleri, tahsilatlar; "Fatura kaydet" / "Toplu fatura" ve "Tahsilat ekle" pencereleri.
   Sütun işlevleri istemcide (sunucu sayfası yalnız veri geçirir). Karar sunucuda; sonuç bildirimle. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, Girdi, ipucuId } from "../../../components/form/Form";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { AltSatir, DegerYok, Rozet } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { RAPOR_DURUM } from "../../raporlar/sema";
import { FIYAT_KAYNAK, gunEkle, para, YONTEM } from "../sema";
import type { FaturaKalemi, FaturaOnizleme, FaturaSatiri, IsRaporu } from "../server/muhasebe";
import { faturaKaydetEylemi, tahsilatKaydetEylemi, type MuhasebeYaniti } from "./eylemler";
import { FATURA_SUTUN } from "./Listeler";
import stil from "./muhasebe.module.css";

/* ── RAPORLAR ── */
const R_SUTUN: Sutun<IsRaporu>[] = [
  { k: "no", genislik: "22%", baslik: "Rapor no", kart: "ust", sira: 1, hucre: (r) => <Link className={stil.no} href={`/raporlar/${r.id}`}>{r.no}</Link> },
  { k: "ekipman", genislik: "20%", baslik: "Ekipman", kart: "govde", sira: 2, hucre: (r) => <span><span className={stil.kod}>{r.ekipmanKod}</span><AltSatir><Kirp>{r.turAd}</Kirp></AltSatir></span> },
  { k: "fiyat", genislik: "20%", baslik: "Birim fiyat", kart: "govde", sira: 3, hucre: (r) => (
    <><KartEtiket>Birim fiyat</KartEtiket><span>{r.fiyat === null ? <span className={stil.uyari}>Fiyat yok</span> : <span className={stil.sayi}>{para(r.fiyat)}</span>}
      <AltSatir uyari={r.kaynak === "disi"}>{r.kaynak === "teklif" && r.teklif ? `teklif ${r.teklif.no}` : FIYAT_KAYNAK[r.kaynak]}</AltSatir></span></>
  ) },
  { k: "fatura", genislik: "20%", baslik: "Fatura", kart: "govde", sira: 4, hucre: (r) => (
    <><KartEtiket>Fatura</KartEtiket>{r.fatura ? <Link className={stil.no} href={`/muhasebe/f/${r.fatura.id}`}>{r.fatura.no}</Link>
      : r.imzali ? <span className={stil.uyari}>Faturalanmadı</span> : <DegerYok />}</>
  ) },
  { k: "durum", genislik: "18%", baslik: "Rapor durumu", kart: "rozet", sira: 1, hucre: (r) => <Rozet tur={RAPOR_DURUM[r.durum][1]}>{RAPOR_DURUM[r.durum][0]}</Rozet> },
];
export function IsRaporlari({ raporlar }: { raporlar: IsRaporu[] }) {
  const s = useSuzgec({
    ad: "Raporlarda ara", ipucu: "Rapor no, ekipman", birim: "rapor", sayfa: 20, imkansiz: "Bir rapor aynı anda iki durumda olamaz",
    metin: (r) => [r.no, r.ekipmanKod, r.turAd, r.fatura?.no ?? ""].join(" "),
    cipler: [
      { k: "hazir", ad: "Faturaya hazır", grup: "durum", test: (r) => r.imzali && !r.fatura },
      { k: "faturali", ad: "Faturalandı", grup: "durum", test: (r) => !!r.fatura },
      { k: "surec", ad: "İmza sürecinde", grup: "durum", test: (r) => !r.imzali },
    ],
    seciciler: [],
  }, raporlar);
  return (
    <>
      <p className={stil.ozet}><Sayac s={s} /></p>
      <SuzgecliListe s={s} on="r" baslik="İşin raporları" sutunlar={R_SUTUN} anahtar={(r) => r.id}
        bosVeri={{ ikon: "file-text", baslik: "Rapor yok", metin: "Planın ilk raporu yazılınca burada görünür." }} />
    </>
  );
}

/* ── FATURALAR VE KALEMLER ── */
const FI_SUTUN = FATURA_SUTUN.filter((s) => s.k !== "musteri");
export function IsFaturalari({ faturalar }: { faturalar: FaturaSatiri[] }) {
  return <Liste baslik="İşin faturaları" sutunlar={FI_SUTUN} kayitlar={faturalar} anahtar={(f) => f.id} href={(f) => `/muhasebe/f/${f.id}`} />;
}
const KALEM: Sutun<FaturaKalemi>[] = [
  { k: "tur", genislik: "40%", baslik: "Ekipman türü", kart: "ust", sira: 1, hucre: (k) => <><Kirp>{k.turAd}</Kirp>{k.disi && <AltSatir uyari>teklif dışı · fiyat listesi</AltSatir>}</> },
  { k: "adet", genislik: "16%", baslik: "Adet", kart: "govde", sira: 2, hucre: (k) => <><KartEtiket>Adet</KartEtiket><span className={stil.sayi}>{k.adet}</span></> },
  { k: "fiyat", genislik: "22%", baslik: "Birim fiyat", kart: "govde", sira: 3, hucre: (k) => <><KartEtiket>Birim fiyat</KartEtiket>{k.fiyat === null ? <span className={stil.uyari}>Fiyat yok</span> : para(k.fiyat)}</> },
  { k: "tutar", genislik: "22%", baslik: "Tutar", kart: "govde", sira: 4, hucre: (k) => <><KartEtiket>Tutar</KartEtiket><span className={stil.sayi}>{k.fiyat === null ? "—" : para(k.adet * k.fiyat)}</span></> },
];
export function KalemListesi({ kalemler, baslik = "Fatura kalemleri" }: { kalemler: FaturaKalemi[]; baslik?: string }) {
  return <Liste baslik={baslik} sutunlar={KALEM} kayitlar={kalemler} anahtar={(k) => `${k.turId}|${k.fiyat}`} />;
}
export function Toplamlar({ ara, kdv, kdvTutar, toplam }: { ara: number; kdv: number; kdvTutar: number; toplam: number }) {
  return (
    <BilgiListesi>
      <Bilgi etiket="Ara toplam">{para(ara)}</Bilgi>
      <Bilgi etiket={`KDV %${kdv}`}>{para(kdvTutar)}</Bilgi>
      <Bilgi etiket="Genel toplam"><b>{para(toplam)}</b></Bilgi>
    </BilgiListesi>
  );
}
interface TahsilatSatiri { id: string; tarih: string; tutar: number; yontem: string; aciklama: string | null; kaydeden: string }
const T_SUTUN: Sutun<TahsilatSatiri>[] = [
  { k: "tarih", genislik: "20%", baslik: "Tarih", kart: "ust", sira: 1, hucre: (t) => tarihNo(t.tarih) },
  { k: "tutar", genislik: "24%", baslik: "Tutar", kart: "govde", sira: 2, hucre: (t) => <><KartEtiket>Tutar</KartEtiket><span className={stil.sayi}>{para(t.tutar)}</span></> },
  { k: "yontem", genislik: "32%", baslik: "Yöntem", kart: "govde", sira: 3, hucre: (t) => <><KartEtiket>Yöntem</KartEtiket><span>{t.yontem}{t.aciklama && <AltSatir><Kirp>{t.aciklama}</Kirp></AltSatir>}</span></> },
  { k: "kaydeden", genislik: "24%", baslik: "Kaydeden", kart: "govde", sira: 4, hucre: (t) => <><KartEtiket>Kaydeden</KartEtiket>{t.kaydeden}</> },
];
export function TahsilatListesi({ tahsilatlar }: { tahsilatlar: TahsilatSatiri[] }) {
  return <Liste baslik="Tahsilatlar" sutunlar={T_SUTUN} kayitlar={tahsilatlar} anahtar={(t) => t.id} />;
}

/* ── FATURA KAYDET (tek iş ya da müşterinin faturaya hazır bütün işleri — 136) ── */
const FID = { no: "w-fatura-no", tarih: "w-fatura-tarih" } as const;
export function FaturaKaydet({ planId, isNo, tek, toplu, bugun }: { planId: string; isNo: string; tek: FaturaOnizleme | null; toplu: FaturaOnizleme | null; bugun: string }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [acik, setAcik] = useState<"tek" | "toplu" | null>(null);
  const [d, setD] = useState({ no: "", tarih: bugun });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const o = acik === "toplu" ? toplu : tek;
  const ac = (k: "tek" | "toplu") => { setAcik(k); setD({ no: "", tarih: bugun }); setH({}); setGenel(null); };
  const kaydet = () => baslat(async () => {
    const r: MuhasebeYaniti = await faturaKaydetEylemi(planId, { ...d, toplu: acik === "toplu" });
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { const k = Object.keys(r.hatalar ?? {})[0]; if (k) document.getElementById(FID[k as keyof typeof FID] ?? FID.no)?.focus(); return; }
    setAcik(null); bildir(r.bildirim ?? "Fatura kaydedildi."); router.push(`/muhasebe/f/${r.id}`);
  });
  return (
    <>
      {toplu && <Tus tur="ikincil" ikon="file-text" onClick={() => ac("toplu")}>Toplu fatura ({toplu.isler.length} iş)</Tus>}
      {tek && <Tus ikon="file-plus" onClick={() => ac("tek")}>Fatura kaydet</Tus>}
      <Pencere acik={!!acik && !!o} genis baslik={acik === "toplu" ? `Toplu fatura · ${toplu?.isler.length ?? 0} iş` : `Fatura kaydet · ${isNo}`}
        onKapat={() => { if (!bekliyor) setAcik(null); }} odak={`#${FID.no}`}
        alt={<>
          <Tus tur="ikincil" disabled={bekliyor} onClick={() => setAcik(null)}>Vazgeç</Tus>
          <Tus ikon="check" disabled={bekliyor || !!o?.fiyatsiz} aria-busy={bekliyor || undefined} onClick={kaydet}>Faturayı kaydet</Tus>
        </>}>
        {o && <>
          <p className={pencereMetinSinifi}><b>{o.raporSayisi}</b> imzalı rapor{acik === "toplu" && ` · ${o.isler.map((x) => x.no).join(", ")}`}</p>
          <KalemListesi kalemler={o.kalemler} baslik="Faturaya girecek kalemler" />
          <Toplamlar ara={o.ara} kdv={o.kdv} kdvTutar={o.kdvTutar} toplam={o.toplam} />
          {o.surec > 0 && <Serit tur="uyari" ikon="history">{o.surec} rapor imza sürecinde; bu faturaya girmez, imzalanınca sonraki faturaya kalır.</Serit>}
          {o.fiyatsiz > 0 && <Serit tur="hata" ikon="circle-alert">{o.fiyatsiz} raporun birim fiyatı yok (teklifte ya da fiyat listesinde değil); fiyat listesine ekleyin.</Serit>}
          {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
          <div className={stil.form}>
            <Alan id={FID.no} etiket="Fatura no" zorunlu hata={h.no} sonuc={h.no ? undefined : "Muhasebe programındaki numara (16 karakter)."}>
              <Girdi id={FID.no} value={d.no} maxLength={16} spellCheck={false} hata={!!h.no} mesajli onChange={(e) => setD({ ...d, no: e.target.value })} />
            </Alan>
            <Alan id={FID.tarih} etiket="Fatura tarihi" zorunlu hata={h.tarih}
              sonuc={h.tarih ? undefined : d.tarih ? `Vade ${tarihNo(gunEkle(d.tarih, o.vadeGun))} (${o.vadeGun} gün, ${o.sozlesme ? `sözleşme ${o.sozlesme.no}` : "varsayılan"})` : undefined}>
              <TarihAlani id={FID.tarih} ad="Fatura tarihi" deger={d.tarih} degistir={(x) => setD({ ...d, tarih: x })} tanim={ipucuId(FID.tarih)} />
            </Alan>
          </div>
        </>}
      </Pencere>
    </>
  );
}

/* ── TAHSİLAT EKLE ── */
const TID = { tarih: "w-tahsilat-tarih", tutar: "w-tahsilat-tutar", yontem: "w-tahsilat-yontem", aciklama: "w-tahsilat-aciklama" } as const;
const tlYaz = (kurus: number) => (kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function TahsilatEkle({ fatura, bugun, birincil = true }: { fatura: { id: string; no: string; musteri: string; toplam: number; kalan: number }; bugun: string; birincil?: boolean }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [acik, setAcik] = useState(false);
  const [d, setD] = useState({ tarih: bugun, tutar: tlYaz(fatura.kalan), yontem: "havale", aciklama: "" });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const kaydet = () => baslat(async () => {
    const r = await tahsilatKaydetEylemi(fatura.id, d);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { const k = Object.keys(r.hatalar ?? {})[0]; if (k) document.getElementById(TID[k as keyof typeof TID] ?? TID.tutar)?.focus(); return; }
    setAcik(false); bildir(r.bildirim ?? "Tahsilat kaydedildi."); router.refresh();
  });
  return (
    <>
      <Tus tur={birincil ? "birincil" : "ikincil"} ikon="wallet" onClick={() => { setAcik(true); setD({ tarih: bugun, tutar: tlYaz(fatura.kalan), yontem: "havale", aciklama: "" }); setH({}); setGenel(null); }}>
        Tahsilat ekle
      </Tus>
      <Pencere acik={acik} baslik={`Tahsilat ekle · ${fatura.no}`} onKapat={() => { if (!bekliyor) setAcik(false); }} odak={`#${TID.tutar}`}
        alt={<>
          <Tus tur="ikincil" disabled={bekliyor} onClick={() => setAcik(false)}>Vazgeç</Tus>
          <Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Tahsilatı kaydet</Tus>
        </>}>
        <BilgiListesi>
          <Bilgi etiket="Müşteri">{fatura.musteri}</Bilgi>
          <Bilgi etiket="Fatura tutarı">{para(fatura.toplam)}</Bilgi>
          <Bilgi etiket="Kalan"><b>{para(fatura.kalan)}</b></Bilgi>
        </BilgiListesi>
        {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
        <div className={stil.form}>
          <Alan id={TID.tarih} etiket="Tahsilat tarihi" zorunlu hata={h.tarih}>
            <TarihAlani id={TID.tarih} ad="Tahsilat tarihi" deger={d.tarih} degistir={(x) => setD({ ...d, tarih: x })} tanim={h.tarih ? ipucuId(TID.tarih) : undefined} />
          </Alan>
          <Alan id={TID.tutar} etiket="Tutar (TL)" zorunlu hata={h.tutar} sonuc={h.tutar ? undefined : "Kısmi tahsilat olabilir; en çok kalan kadar."}>
            <Girdi id={TID.tutar} value={d.tutar} inputMode="decimal" maxLength={16} hata={!!h.tutar} mesajli onChange={(e) => setD({ ...d, tutar: e.target.value })} />
          </Alan>
          <Alan id={TID.yontem} etiket="Yöntem" zorunlu hata={h.yontem}>
            <SecimAlani id={TID.yontem} ad="Yöntem" deger={d.yontem} secenekler={Object.entries(YONTEM).map(([k, ad]) => [k, ad] as const)}
              degistir={(x) => setD({ ...d, yontem: x })} tanim={h.yontem ? ipucuId(TID.yontem) : undefined} />
          </Alan>
          <div className={stil.genis}>
            <Alan id={TID.aciklama} etiket="Açıklama" hata={h.aciklama} sonuc={h.aciklama ? undefined : "İsteğe bağlı; ör. çek no, dekont açıklaması."}>
              <Girdi id={TID.aciklama} value={d.aciklama} maxLength={120} hata={!!h.aciklama} mesajli onChange={(e) => setD({ ...d, aciklama: e.target.value })} />
            </Alan>
          </div>
        </div>
      </Pencere>
    </>
  );
}
