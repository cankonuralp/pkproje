"use client";
/* EĞİTİMLER (maket egitimler.html #/ kayıtlar · #/turler): süzgeç (durum çipleri aynı grupta, kişi / eğitim seçicisi, Görünüm güncel / önceki),
   en yeni üstte, sayfalı. Tekrarı geçen / yaklaşan için şerit (eşik firma ayarı). "Eğitim kaydı ekle", "Tekrarı kaydet", sertifika ve eğitim türü
   yalnız "değiştirir" düzeyine; karar sunucuda. 345: kayıt penceresinde katılım formu — imzaya gönder (güncel kayıt), bekleyen / imzalı durumu. */
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import { yeniDurum, type SuzgecTanimi } from "../../../components/liste/suzgec";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere } from "../../../components/pencere/Pencere";
import { AltSatir, DegerYok, Rozet, SayfaBasi, Sekmeler } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { Serit } from "../../../components/serit/Serit";
import { SilTusu } from "../../../components/sil/SilTusu";
import { Tus } from "../../../components/tus/Tus";
import { ayEkle, kalanGun, KURUMLAR } from "../sema";
import type { EgitimKaydi, EgitimTuru } from "../server/egitimler";
import { egitimKaydetEylemi, egitimTuruKaydetEylemi, katilimFormuGonderEylemi, sertifikaYukleEylemi, egitimKaydiSilEylemi, egitimTuruSilEylemi } from "./eylemler";
import { DOKUMAN_SEKMELERI } from "../../dokumanlar/ui/ortak";
import { egitimAltSekmeleri, tarihYaz } from "./ortak";
import stil from "./egitimler.module.css";

const KID = { personel: "ekw-personel", tur: "ekw-tur", tarih: "ekw-tarih", kurum: "ekw-kurum", dosya: "ekw-dosya" } as const;
const TID = { ad: "etw-ad", tekrar: "etw-tekrar" } as const;
const SERTIFIKA_ID = "esw-dosya";
const DURUM = { gecti: ["red", "Tekrarı geçti"], yakin: ["bekliyor", "Tekrarı yaklaşıyor"], gecerli: ["tamam", "Geçerli"] } as const;

function tanim(l: readonly EgitimKaydi[], esik: number): SuzgecTanimi<EgitimKaydi> {
  const tekil = (x: [string, string][]) => [...new Map(x)].sort((a, b) => a[1].localeCompare(b[1], "tr"));
  return {
    ad: "Eğitimlerde ara", ipucu: "Kişi, eğitim", birim: "kayıt", sayfa: 20, imkansiz: "Bir kayıt aynı anda iki durumda olamaz",
    metin: (x) => `${x.personel} ${x.tur} ${x.kurum}`,
    cipler: [
      { k: "gecti", ad: "Tekrarı geçti", grup: "durum", test: (x) => !x.onceki && x.durum === "gecti" },
      { k: "yakin", ad: `${esik} gün içinde`, grup: "durum", test: (x) => !x.onceki && x.durum === "yakin" },
      { k: "gecerli", ad: "Geçerli", grup: "durum", test: (x) => !x.onceki && x.durum === "gecerli" },
      { k: "belgesiz", ad: "Belgesi yok", test: (x) => !x.dosyaId },
    ],
    seciciler: [
      { k: "kisi", ad: "Kişi", secenek: () => [["tumu", "Tümü"], ...tekil(l.map((x) => [x.personelId, x.personel]))], gecer: (x, s) => s === "tumu" || x.personelId === s },
      { k: "tur", ad: "Eğitim", secenek: () => [["tumu", "Tümü"], ...tekil(l.map((x) => [x.turId, x.tur]))], gecer: (x, s) => s === "tumu" || x.turId === s },
      { k: "gorunum", ad: "Görünüm", bas: "guncel", secenek: () => [["guncel", "Güncel kayıtlar"], ["onceki", "Önceki kayıtlar"], ["hepsi", "Hepsi"]],
        gecer: (x, s) => s === "hepsi" || (s === "guncel" ? !x.onceki : x.onceki) },
    ],
  };
}

export function EgitimListesi({ kayitlar, turler, kisiler, esik, bugun, yaz, kisi }:
  { kayitlar: EgitimKaydi[]; turler: EgitimTuru[]; kisiler: { id: string; ad: string }[]; esik: number; bugun: string; yaz: boolean; kisi?: string }) {
  /* Uyarılar'dan gelen ?kisi= listeyi o kişiyle süzülü açar (maket egitimler.html "?kisi= … Uyarılar'dan"; 329–332 incelemesi) */
  const t = tanim(kayitlar, esik);
  const s = useSuzgec(t, kayitlar, kisi && kayitlar.some((x) => x.personelId === kisi) ? { sec: { ...yeniDurum(t).sec, kisi } } : undefined);
  const [p, setP] = useState<null | { tip: "ekle"; personel?: string; tur?: string } | { tip: "kayit"; x: EgitimKaydi }>(null);
  const guncel = kayitlar.filter((x) => !x.onceki), gec = guncel.filter((x) => x.durum === "gecti"), yak = guncel.filter((x) => x.durum === "yakin");
  const sutunlar: Sutun<EgitimKaydi>[] = [
    { k: "kisi", genislik: "24%", baslik: "Personel", kart: "ust", sira: 1, hucre: (x) => <button type="button" className={stil.ad} onClick={() => setP({ tip: "kayit", x })}><Kirp>{x.personel}</Kirp></button> },
    { k: "egitim", genislik: "26%", baslik: "Eğitim", kart: "govde", sira: 2, hucre: (x) => <span><Kirp>{x.tur}</Kirp><AltSatir>{x.kurum}</AltSatir></span> },
    { k: "tarih", genislik: "12%", baslik: "Alındı", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>Alındı</KartEtiket>{tarihYaz(x.tarih)}</> },
    { k: "tekrar", genislik: "16%", baslik: "Tekrar", kart: "govde", sira: 4, hucre: (x) => { const k = kalanGun(x.tekrar, bugun); return <><KartEtiket>Tekrar</KartEtiket><span>
      <span className={stil.tarih}>{tarihYaz(x.tekrar)}</span>{x.onceki ? <AltSatir>yenilendi</AltSatir> : x.durum === "gecerli" ? <AltSatir>{k} gün kaldı</AltSatir>
        : <span className={stil.uyari}>{k < 0 ? `${-k} gün geçti` : `${k} gün kaldı`}</span>}</span></>; } },
    { k: "belge", genislik: "8%", baslik: "Belge", kart: "govde", sira: 5, hucre: (x) => <><KartEtiket>Belge</KartEtiket>{x.dosyaId ? "Var" : <span className={stil.uyari}>Yok</span>}</> },
    { k: "durum", genislik: "14%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => x.onceki ? <Rozet tur="notr">Önceki kayıt</Rozet> : <Rozet tur={DURUM[x.durum][0]}>{DURUM[x.durum][1]}</Rozet> },
  ];
  return (
    <>
      <SayfaBasi baslik="Dökümanlar" sayac={<Sayac s={s} />} tuslar={yaz && turler.length > 0 && <Tus ikon="plus" onClick={() => setP({ tip: "ekle" })}>Eğitim kaydı ekle</Tus>} />
      <Sekmeler ad="Döküman bölümleri" ogeler={DOKUMAN_SEKMELERI} secili="/dokumanlar/egitimler" />
      <Sekmeler alt ad="Eğitim bölümleri" ogeler={egitimAltSekmeleri(guncel.length, turler.length)} secili="/dokumanlar/egitimler" />
      {(gec.length > 0 || yak.length > 0) && <div className={stil.seritler}><Serit tur={gec.length ? "hata" : "uyari"} ikon="graduation-cap">
        {gec.length > 0 && <><b>{gec.length} eğitimin tekrarı geçti</b> ({gec.map((x) => `${x.personel} · ${x.tur}`).join(", ")}){yak.length ? "; " : "."}</>}
        {yak.length > 0 && `${yak.length} eğitimin tekrarı ${esik} gün içinde.`}</Serit></div>}
      {yaz && turler.length === 0 && <div className={stil.seritler}><Serit tur="bilgi" ikon="info">Önce “Eğitim türleri” sekmesinden eğitim türü ve tekrar süresi ekleyin.</Serit></div>}
      <SuzgecliListe s={s} on="egt" baslik="Eğitim kayıtları" sutunlar={sutunlar} anahtar={(x) => x.id}
        bosVeri={{ ikon: "graduation-cap", baslik: "Eğitim kaydı yok", metin: "“Eğitim kaydı ekle” ile kişi, eğitim ve tarih girilir; tekrar tarihi türden hesaplanır." }} />
      {p?.tip === "ekle" && <KayitPenceresi kapat={() => setP(null)} turler={turler} kisiler={kisiler} kayitlar={kayitlar} bugun={bugun} personel={p.personel} tur={p.tur} />}
      {p?.tip === "kayit" && <KayitGorunumu x={p.x} kayitlar={kayitlar} bugun={bugun} yaz={yaz} kapat={() => setP(null)}
        tekrar={() => setP({ tip: "ekle", personel: p.x.personelId, tur: p.x.turId })} />}
    </>
  );
}

function KayitPenceresi({ kapat, turler, kisiler, kayitlar, bugun, personel = "", tur = "" }:
  { kapat: () => void; turler: EgitimTuru[]; kisiler: { id: string; ad: string }[]; kayitlar: EgitimKaydi[]; bugun: string; personel?: string; tur?: string }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState({ personel, tur, tarih: "", kurum: "" });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const t = turler.find((x) => x.id === d.tur);
  const eski = kayitlar.find((x) => !x.onceki && x.personelId === d.personel && x.turId === d.tur);
  const kaydet = () => baslat(async () => {
    const f = new FormData(form.current!);
    for (const [k, v] of Object.entries(d)) f.set(k, v);
    const r = await egitimKaydetEylemi(f);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { const k = Object.keys(r.hatalar ?? {})[0] as keyof typeof KID | undefined; if (k && KID[k]) requestAnimationFrame(() => document.getElementById(KID[k])?.focus()); return; }
    kapat(); bildir(eski ? "Tekrar kaydedildi; önceki kayıt saklandı." : "Eğitim kaydı eklendi."); router.refresh();
  });
  return (
    <Pencere acik baslik={personel && tur ? "Tekrarı kaydet" : "Eğitim kaydı ekle"} onKapat={kapat} odak={`#${personel ? KID.tarih : KID.personel}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet</Tus></>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      {eski && <Serit tur="bilgi" ikon="history">Güncel kayıt {tarihYaz(eski.tarih)}; kaydedince önceki olur.</Serit>}
      <form ref={form} onSubmit={(e) => { e.preventDefault(); kaydet(); }}>
        <FormIzgara>
          <Alan id={KID.personel} etiket="Personel" zorunlu hata={h.personel}>
            <SecimAlani id={KID.personel} ad="Personel" deger={d.personel} ipucu="Kişi seçin" gecersiz={!!h.personel} tanim={h.personel ? ipucuId(KID.personel) : undefined}
              secenekler={kisiler.map((k) => [k.id, k.ad] as const)} degistir={(x) => setD({ ...d, personel: x })} />
          </Alan>
          <Alan id={KID.tur} etiket="Eğitim" zorunlu hata={h.tur} sonuc={t ? `Tekrar süresi ${t.tekrarAy} ay` : undefined}>
            <SecimAlani id={KID.tur} ad="Eğitim" deger={d.tur} ipucu="Eğitim seçin" gecersiz={!!h.tur} tanim={ipucuId(KID.tur)}
              secenekler={turler.map((x) => [x.id, x.ad, `${x.tekrarAy} ay`] as const)} degistir={(x) => setD({ ...d, tur: x })} />
          </Alan>
          <Alan id={KID.tarih} etiket="Eğitim tarihi" zorunlu hata={h.tarih} sonuc={t && /^\d{4}-\d{2}-\d{2}$/.test(d.tarih) ? `Tekrar ${tarihYaz(ayEkle(d.tarih, t.tekrarAy))}` : undefined}>
            <TarihAlani id={KID.tarih} ad="Eğitim tarihi" deger={d.tarih} degistir={(x) => setD({ ...d, tarih: x })} tanim={ipucuId(KID.tarih)} />
          </Alan>
          <Alan id={KID.kurum} etiket="Veren" zorunlu hata={h.kurum}>
            <SecimAlani id={KID.kurum} ad="Veren" deger={d.kurum} ipucu="Seçin" gecersiz={!!h.kurum} tanim={h.kurum ? ipucuId(KID.kurum) : undefined}
              secenekler={KURUMLAR.map((k) => [k, k] as const)} degistir={(x) => setD({ ...d, kurum: x })} />
          </Alan>
          <Alan id={KID.dosya} etiket="Sertifika (PDF)" genis hata={h.dosya} sonuc="İsteğe bağlı.">
            <input id={KID.dosya} className={stil.dosya} name="dosya" type="file" accept="application/pdf" aria-describedby={ipucuId(KID.dosya)} />
          </Alan>
        </FormIzgara>
      </form>
      {d.tarih > bugun && <Serit tur="uyari" ikon="triangle-alert">Eğitim tarihi bugünden ileri olamaz.</Serit>}
    </Pencere>
  );
}

/* katılım formu (345; Onaylar › Diğer belgeler): imzalıysa imzalı PDF, bekliyorsa durum, geri gönderildiyse uyarı; "değiştirir" güncel kayıtta gönderir */
function KatilimFormu({ x, yaz, kapat }: { x: EgitimKaydi; yaz: boolean; kapat: () => void }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const f = x.form;
  const gonder = async () => {
    if (!(await onayla({ baslik: "Katılım formunu imzaya gönder", metin: <>{x.tur} katılım formu {x.personel} kişisinin imzasına gider (Onaylar › Diğer belgeler).{f?.durum === "bekliyor" ? " Bekleyen form iptal olur." : ""}</>, tus: "İmzaya gönder" }))) return;
    baslat(async () => {
      const r = await katilimFormuGonderEylemi(x.id);
      if (!r.tamam) { bildir(r.genel ?? "Gönderilemedi."); return; }
      kapat(); bildir(`${x.tur} katılım formu ${x.personel} imzasına gönderildi.`); router.refresh();
    });
  };
  return (
    <div className={stil.form}>
      {f?.durum === "imzali" ? <Serit tur="onay" ikon="file-check">Katılım formu imzalandı ({f.ad}).</Serit>
        : f?.durum === "bekliyor" ? <Serit tur="bilgi" ikon="send">{f.ad}: katılanın imzasını bekliyor (Onaylar › Diğer belgeler).</Serit>
          : f?.durum === "geri" ? <Serit tur="uyari" ikon="triangle-alert">{f.ad}: katılan geri gönderdi; düzeltip yeniden gönderin.</Serit> : null}
      <div className={stil.tuslar}>
        {f?.durum === "imzali" && f.imzaliDosya && <DosyaAcTusu dosyaId={f.imzaliDosya}>İmzalı katılım formu</DosyaAcTusu>}
        {yaz && !x.onceki && f?.durum !== "imzali" && <Tus tur="ikincil" ikon="send" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={gonder}>{f?.durum === "bekliyor" ? "Formu yeniden gönder" : "Katılım formunu imzaya gönder"}</Tus>}
      </div>
    </div>
  );
}

function KayitGorunumu({ x, kayitlar, bugun, yaz, kapat, tekrar }: { x: EgitimKaydi; kayitlar: EgitimKaydi[]; bugun: string; yaz: boolean; kapat: () => void; tekrar: () => void }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [h, setH] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const k = kalanGun(x.tekrar, bugun);
  const gecmis = kayitlar.filter((y) => y.personelId === x.personelId && y.turId === x.turId && y.id !== x.id);
  const yukle = (kaldir = false) => baslat(async () => {
    const f = kaldir ? new FormData() : new FormData(form.current!); f.set("id", x.id); f.set("surum", String(x.surum)); if (kaldir) f.set("kaldir", "1");
    const r = await sertifikaYukleEylemi(f);
    if (!r.tamam) { setH(r.hatalar?.dosya ?? r.genel ?? "Kaydedilemedi."); return; }
    kapat(); bildir(kaldir ? "Sertifika kaldırıldı." : "Sertifika yüklendi."); router.refresh();
  });
  return (
    <Pencere acik baslik={x.tur} onKapat={kapat} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Kapat</Tus>
        {x.sil && <SilTusu ad={`${x.personel} · ${x.tur}`} baslik="Eğitim kaydını sil" yanEtki={x.onceki ? undefined : "varsa bir önceki kaydı güncel olur"}
          sil={async () => { const r = await egitimKaydiSilEylemi(x.id); if (r.tamam) kapat(); return r; }} />}
        {yaz && !x.onceki && <Tus ikon="refresh-cw" onClick={tekrar}>Tekrarı kaydet</Tus>}</>}>
      {x.onceki ? <Serit tur="bilgi" ikon="history">Önceki kayıt: aynı eğitim sonradan yenilendi.</Serit>
        : x.durum === "gecerli" ? <Serit tur="onay" ikon="circle-check">Geçerli; tekrar {k} gün sonra.</Serit>
          : <Serit tur={x.durum === "gecti" ? "hata" : "uyari"} ikon="clock">{k < 0 ? `Tekrarı ${-k} gün önce geçti.` : `Tekrarı ${k} gün sonra.`}</Serit>}
      <Liste baslik="Kayıt" kayitlar={[x, ...gecmis]} anahtar={(y) => y.id} sutunlar={[
        { k: "tarih", genislik: "30%", baslik: "Tarih", kart: "ust", sira: 1, hucre: (y) => <span>{tarihYaz(y.tarih)}<AltSatir>{y.kurum}</AltSatir></span> },
        { k: "tekrar", genislik: "25%", baslik: "Tekrar", kart: "govde", sira: 2, hucre: (y) => <><KartEtiket>Tekrar</KartEtiket>{tarihYaz(y.tekrar)}</> },
        { k: "durum", genislik: "20%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (y) => y.onceki ? <Rozet tur="notr">Önceki</Rozet> : <Rozet tur={DURUM[y.durum][0]}>{DURUM[y.durum][1]}</Rozet> },
        { k: "belge", genislik: "25%", baslik: "Sertifika", kart: "eylem", sira: 9, hucre: (y) => y.dosyaId ? <DosyaAcTusu dosyaId={y.dosyaId}>Sertifika</DosyaAcTusu> : <DegerYok>Yüklenmedi</DegerYok> },
      ]} />
      <KatilimFormu x={x} yaz={yaz} kapat={kapat} />
      {yaz && <form ref={form} onSubmit={(e) => { e.preventDefault(); yukle(); }}>
        <Alan id={SERTIFIKA_ID} etiket={x.dosyaId ? "Sertifikayı değiştir (PDF)" : "Sertifika yükle (PDF)"} hata={h ?? undefined}>
          <input id={SERTIFIKA_ID} className={stil.dosya} name="dosya" type="file" accept="application/pdf" aria-describedby={h ? ipucuId(SERTIFIKA_ID) : undefined} />
        </Alan>
        <div className={stil.tuslar}>
          {x.dosyaId && <Tus tur="ikincil" ikon="x" disabled={bekliyor} onClick={() => yukle(true)}>Sertifikayı kaldır</Tus>}
          <Tus tur="ikincil" ikon="upload" disabled={bekliyor} onClick={() => yukle()}>Yükle</Tus>
        </div>
      </form>}
    </Pencere>
  );
}

export function TurListesi({ turler, yaz, kayitSayisi }: { turler: EgitimTuru[]; yaz: boolean; kayitSayisi: number }) {
  const [p, setP] = useState<null | { t?: EgitimTuru }>(null);
  const sutunlar: Sutun<EgitimTuru>[] = [
    { k: "ad", genislik: "40%", baslik: "Eğitim", kart: "ust", sira: 1, hucre: (t) => <Kirp>{t.ad}</Kirp> },
    { k: "tekrar", genislik: "18%", baslik: "Tekrar süresi", kart: "govde", sira: 2, hucre: (t) => <><KartEtiket>Tekrar süresi</KartEtiket>{t.tekrarAy} ay</> },
    { k: "kisi", genislik: "12%", baslik: "Kişi", kart: "govde", sira: 3, hucre: (t) => <><KartEtiket>Kişi</KartEtiket>{t.kisi}</> },
    { k: "durum", genislik: "16%", baslik: "Tekrarı yaklaşan", kart: "rozet", sira: 1, hucre: (t) => t.gecti || t.yakin
      ? <Rozet tur={t.gecti ? "red" : "bekliyor"}>{t.gecti ? `${t.gecti} geçti${t.yakin ? ` · ${t.yakin} yakın` : ""}` : `${t.yakin} yakın`}</Rozet> : <DegerYok /> },
    { k: "eylem", genislik: "14%", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: (t) => yaz ? <span className={stil.tuslar}>
      <Tus tur="ikincil" ikon="pencil" onClick={() => setP({ t })}>Düzenle</Tus>
      {t.sil && <SilTusu kucuk ikon="trash-2" ad={t.ad} erisimAdi={`${t.ad} türünü sil`} baslik="Eğitim türünü sil" sil={() => egitimTuruSilEylemi(t.id)} />}
    </span> : null },
  ];
  return (
    <>
      <SayfaBasi baslik="Dökümanlar" sayac={<><b>{turler.length}</b> eğitim türü</>} tuslar={yaz && <Tus ikon="plus" onClick={() => setP({})}>Eğitim türü ekle</Tus>} />
      <Sekmeler ad="Döküman bölümleri" ogeler={DOKUMAN_SEKMELERI} secili="/dokumanlar/egitimler" />
      <Sekmeler alt ad="Eğitim bölümleri" ogeler={egitimAltSekmeleri(kayitSayisi, turler.length)} secili="/dokumanlar/egitimler/turler" />
      {turler.length ? <Liste baslik="Eğitim türleri" sutunlar={sutunlar} kayitlar={turler} anahtar={(t) => t.id} />
        : <div className={stil.seritler}><Serit tur="bilgi" ikon="info">Eğitim türü yok. Firmanın eğitimlerini ve tekrar sürelerini ekleyin.</Serit></div>}
      {p && <TurPenceresi kapat={() => setP(null)} t={p.t} />}
    </>
  );
}

function TurPenceresi({ kapat, t }: { kapat: () => void; t?: EgitimTuru }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState({ ad: t?.ad ?? "", tekrar: t ? String(t.tekrarAy) : "" });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const kaydet = () => baslat(async () => {
    const r = await egitimTuruKaydetEylemi(t?.id ?? null, t?.surum ?? 0, d);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) return;
    kapat(); bildir(t ? "Eğitim türü güncellendi." : `${d.ad.trim()} eklendi.`); router.refresh();
  });
  return (
    <Pencere acik baslik={t ? `${t.ad} · düzenle` : "Eğitim türü ekle"} onKapat={kapat} odak={`#${TID.ad}`}
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet</Tus></>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <FormIzgara>
        <Alan id={TID.ad} etiket="Eğitim" zorunlu genis hata={h.ad}><Girdi id={TID.ad} value={d.ad} maxLength={60} hata={!!h.ad} onChange={(e) => setD({ ...d, ad: e.target.value })} /></Alan>
        <Alan id={TID.tekrar} etiket="Tekrar süresi (ay)" zorunlu hata={h.tekrar} sonuc={t ? "Yeni kayıtlarda geçerli; geçmiş kayıtların tekrar tarihi değişmez." : undefined}>
          <Girdi id={TID.tekrar} value={d.tekrar} inputMode="numeric" maxLength={3} hata={!!h.tekrar} mesajli={!!t} onChange={(e) => setD({ ...d, tekrar: e.target.value })} />
        </Alan>
      </FormIzgara>
    </Pencere>
  );
}
