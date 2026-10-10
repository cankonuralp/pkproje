"use client";
/* SAHA RAPORU (modül 14; maket rapor.html M8 + maket-rapor.js ciz, eylemHtml, gonder, zorunluEksik, eksikeGit; KOD-GECIS §5 Rapor, §9 ENGEL 2 · 5;
   RAPOR-FORMAT §7). Kırıntı Planlar › plan no › rapor no · başlıkta "<ekipman kodu> · <tür>" + durum rozeti · altında rapor no · müşteri · tesis ·
   yazan (L7: firma önce, tesis sonra) · düzenlenirken son kayıt.
   Bölümler: 1 Firma bilgileri (künye raporun KENDİ kopyası, salt okunur — planlamacı değiştirdiyse şeritte "Güncelle"; kontrol tarihleri
   burada: başlangıç rapor açılınca yazılır, zorunlu; bitiş, sonraki kontrol ve rapor tarihi elle seçilmediyse Onaya gönderde sunucu yazar —
   ekranda başlangıç değişince sonraki kontrol ve rapor tarihi ondan önerilir, elle seçilen kalır), 2 Ekipman bilgileri (elle; ekipman
   kaydından başlar), sonra türün formatının bölümleri sırasıyla (Bloklar). Formatın yalnız kayıttan gelen alanlardan oluşan bilgi bölümü
   (hazır şablonlarda "Firma bilgileri") 1. bölümün kopyası olduğundan ayrıca çizilmez; format cihaz bölümü vermiyor ama tür cihaz istiyorsa
   "Ölçüm cihazları" sabit bölüm olur.
   Kaydet + Onaya gönder hep görünür, altta yapışkan (reisim 2026-09-27); Sil yanında (2026-09-29), sorulur (AA8). Onaya gönder önce kaydeder;
   sonuç seçilmediyse önerisi yazılır (reisim 2026-09-27); zorunlu alan eksikse (ENGEL 5) ya da cihaz eksik / kalibrasyonu geçmişse (ENGEL 2)
   gönderilmez: "Zorunlu alanlar doldurulmadı" penceresi eksikleri sayar, her biri alanına götürür; boş alanlar kırmızı (aria-invalid), doldurdukça işaret
   kalkar (maket UY / zorunluEksik). Göndermeden önce sorulur (maket gonder: "Rapor onaya gönderilsin mi?"). Gönderilen rapor salt okunur (kilit
   şeridi). Formatın kendi ekipman bilgi bölümü (ör. kompresör) 2. bölüme katılır; formatın sorduğu alan sabit satırda tekrar edilmez (marka,
   model, imal yılı …); 460: tam ekipman bölümlü formatta 2. bölüm yalnız kod, tür, metot ve formatın alanlarıdır (marka, model … ekipman
   kaydına bağlı alan olarak formatın koyduğu yerde ve adla). Yetki, kural ve ENGEL sunucuda; buradaki tuşlar yalnız izinli olanı gösterir.
   313: "Kaydet ve kopyala" (Yeni) / "Kopyala" (gönderilmiş) yeni ekipmanın raporunu açar ve oraya gider (karar 204–209); kopyadan açılan Yeni
   raporda kaynak şeridi (U7); daha yeni format sürümü yayınlandıysa "Formatı güncelle" şeridi (U6, 211); günlük süre dolduysa neden şeridi (212).
   318 revizyon (maket raporlar.html 192, 131): tamamlanan raporda yazana "Revize iste" (gerekçe) → "Revize isteğiniz teknik yöneticide" şeridi
   + "Revize isteğini geri çek"; reddedilirse "Revize isteği reddedildi" şeridi; revizeye gönderilen rapor Yeni açılır, üstünde "Revizeye
   gönderildi (R1)" + gerekçe; rapor no revizyon ekiyle.
   472 (reisim 2026-10-10, maket kararları k1–k4): `deneme` — format kurucusunun "Saha ekranı" görünümü taslak formatı bu ekranla, UYDURMA bir
   raporla (../ornek.ts) gösterir: sunucuya hiçbir şey gitmez (Kaydet / Onaya gönder yalnız denetler, cihaz kuyruğu ve S.A.Y yok), fotoğraf
   dosyası yüklenmez (sayı artar), kırıntı yok; denetçinin göreceği gibi. 483 (reisim 2026-10-10: "rapor düzenlemede sadece saha ekranı gözüksün
   o ekranda düzenleme yapılamasın"): 473'ün "duzenle" kipi (formatın saha ekranında yerinde düzenlenmesi) kalktı — format yalnız kâğıtta. */
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition, type ReactNode, type TransitionStartFunction } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { bekleyenIcerik, kayitBilgileriniKapat, kuyrugaEkle, kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik, type KuyrukSonucOlayi, type KuyrukTuru } from "../../../components/cevrimdisi/kuyruk";
import { Girdi, ipucuId } from "../../../components/form/Form";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { DegerYok, Kirinti, Kod, NesneBasi, Rozet, SeritKap } from "../../../components/sayfa/Sayfa";
import { simdiIso, tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { raporDuzeni, sabitEkipmanAlanlari } from "../../../format/duzen";
import { degerlendir } from "../../../format/motor";
import { EKIPMAN_ALAN_ADI, type Cevaplar } from "../../../format/tanim";
import { ayEkle, RAPOR_DURUM, type EkipmanBilgisi, type RaporDurumu, type RaporTarihleri } from "../sema";
import { cevaplariTamamla } from "../ornek";
import type { SahaRaporu as SahaRaporuVerisi } from "../server/raporlar";
import {
  alanId, BilgiAlani, BilgiBlok, FormatBolumu, OkuGirdi, RaporBolumu, Satir, Satirlar, TarihKutusu, type Baglam, type Kaynak,
} from "./Bloklar";
import { CihazBolumu } from "./CihazBolumu";
import { EtiketOkuma } from "./EtiketOkuma";
import { FotoListesi } from "./FotoListesi";
import { ImzaBolumu } from "./ImzaBolumu";
import { KopyaPenceresi } from "./KopyaPenceresi";
import { StandartTusu, TalimatTusu } from "./Kaynaklar";
import { AsamaCizgisi } from "./AsamaCizgisi";
import { RevizeIstePenceresi } from "./RevizeIstePenceresi";
import {
  onayaGonderEylemi, raporFormatGuncelleEylemi, raporKaydetEylemi, raporKopyalaEylemi, raporKunyeGuncelleEylemi, raporSilEylemi, revizeIstegiGeriCekEylemi,
  revizeIsteEylemi, type RaporYaniti,
} from "./eylemler";
import { sayRaporBagla } from "../../say/ui/baglam";
import stil from "./raporlar.module.css";

type Gorunum = SahaRaporuVerisi;
/** 472: format kurucusunun saha görünümü (örnek rapor; durum: denemenin canlı eksik / kusur sayısı kurucunun kullanım kutusuna) */
export interface Deneme { durum?: (x: { eksik: number; kusur: number }) => void }
type EkipmanAnahtari = keyof EkipmanBilgisi;
type TarihAnahtari = keyof RaporTarihleri;
interface Eksik { bolum: string; alan: string; ad: string }

/** sabit bölümlerin kimliği (format kimliklerinde tire olmaz → çakışmaz) */
const SABIT = { firma: "sabit-firma", ekipman: "sabit-ekipman", cihaz: "sabit-cihaz" } as const;
const EID = (k: EkipmanAnahtari) => `r-ek-${k}`;
/** ekipman bilgisinin en çok uzunluğu (sema.ts EkipmanBilgisi ile aynı) */
const EN: Record<EkipmanAnahtari, number> = { marka: 40, model: 40, seri: 30, imal: 4, konum: 60, amac: 120, bolum: 60 };
const ETIKET = ["marka", "model", "seri", "imal"] as const;
const TID = (k: TarihAnahtari) => alanId(`tarih.${k}`);
const KILIT: Record<Exclude<RaporDurumu, "taslak">, string> = {
  onayda: "Teknik yönetici onayında", onaylandi: "Muayene uzmanı imzası bekleniyor", imzada: "İmzaya gönderildi",
  imzali: "Tamamlandı · son imza atıldı, müşteriye açıldı",
};
/* 394: bağlantı yok mu · istek ağda mı düştü (sunucu eylemi bağlantısızken TypeError atar) */
const cevrimdisiMi = () => typeof navigator !== "undefined" && navigator.onLine === false;
const agHatasi = (e: unknown) => e instanceof TypeError || cevrimdisiMi();

/** sunucunun alan hatası anahtarı → ekrandaki ad (üst şeritte "ad: ileti") */
const ALAN_ADI: Record<string, string> = {
  "ekipman.marka": "Marka", "ekipman.model": "Model", "ekipman.seri": "Seri no", "ekipman.imal": "İmal yılı", "ekipman.konum": "Kullanım yeri",
  "ekipman.amac": "Kullanım amacı", "ekipman.bolum": "Ekipman bölümü", "tarih.bas": "Başlangıç tarihi", "tarih.bit": "Bitiş tarihi",
  "tarih.sonraki": "Bir sonraki periyodik kontrol tarihi", "tarih.takip": "Takip kontrol tarihi", "tarih.rapor": "Rapor tarihi",
};

const TR_ZAMAN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** zaman damgası → "GG.AA.YYYY SS:DD" (Türkiye saati; sunucuda ve tarayıcıda aynı) */
const zamanNo = (z: string) => { const s = TR_ZAMAN.format(new Date(z)); return `${tarihNo(s.slice(0, 10))} ${s.slice(12, 17)}`; };
/** ekrandaki saatli değer "YYYY-MM-DDTHH:MM" → "GG.AA.YYYY SS:DD" */
const saatliNo = (s: string) => `${tarihNo(s)} ${s.slice(11, 16)}`;
const bosla = <T extends Record<string, string | null>>(o: T) => Object.fromEntries(Object.entries(o).map(([k, x]) => [k, x ?? ""])) as { [K in keyof T]: string };

/** `yeni` (405): bağlantısız açılan YENİ rapor (v cihazda kuruldu, kimlik geçici) — planı, ekipmanı ve kodu; bütün işler kuyruktan gider */
export function SahaRaporu({ v, yeni, deneme }: { v: Gorunum; yeni?: { plan: string; ekipman: string; kod: string }; deneme?: Deneme }) {
  const denemede = !!deneme;
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslatHam] = useTransition();
  /* bağlantı yokken sunucuya giden her tuş (fotoğraf, cihaz, kopya …) sayfayı hata ekranına düşürmez: şeritte söyler, yazılanlar ekranda kalır
     (394; Kaydet ve Onaya gönder aşağıda cihaz kuyruğuna gider) */
  const baslat: TransitionStartFunction = (f) => baslatHam(async () => {
    try { await f(); } catch (e) {
      if (agHatasi(e)) { setGenel("Bağlantı yok: bu işlem bağlantı gerektirir. Kaydet ve Onaya gönder cihaza kaydedilir, bağlantı gelince gider."); return; }
      throw e;
    }
  });
  /* çevrimdışı kuyruk (394; maket Z4): bu raporun cihazda bekleyen işi — Onaya gönder bekliyorsa rapor salt okunur */
  const kuyruk = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const bekleyenIs = kuyruk.isler.find((x) => x.kayit === v.id && x.durum === "bekliyor");
  const gonderimBekliyor = kuyruk.isler.some((x) => x.kayit === v.id && x.durum === "bekliyor" && x.tur === "rapor.gonder");
  /* 398: cihazda bekleyen fotoğraflar (yerleri "bölüm|madde") — canlı değerlendirmede sayılır, başlıkta söylenir */
  const bekleyenFotolar = useMemo(() => kuyruk.isler.filter((x) => x.kayit === v.id && x.durum === "bekliyor" && x.tur === "rapor.foto"), [kuyruk.isler, v.id]);
  const sorunluIs = kuyruk.isler.find((x) => x.kayit === v.id && (x.durum === "cakisma" || x.durum === "hata"));
  const formBekliyor = kuyruk.isler.some((x) => x.kayit === v.id && x.durum === "bekliyor" && x.tur !== "rapor.foto");
  /* 405: yeni rapor sunucuda açıldı (gerçek kimlik) — ekran salt okunur; raporun cihazda bekleyen işleri gidince raporun sayfasına geçilir (önce
     geçilseydi sayfa, kayıt yazılmadan çizilip boş görünebilirdi) */
  const [acildi, setAcildi] = useState<string | null>(null);
  useEffect(() => {
    if (!acildi || kuyruk.isler.some((x) => x.kayit === acildi && x.durum === "bekliyor")) return;
    router.replace(`/raporlar/${acildi}`);
  }, [acildi, kuyruk, router]);
  const duzenle = v.izin.duzenle && !gonderimBekliyor && !acildi;
  const [ekipman, setEkipman] = useState(() => bosla(v.ekipmanBilgi));
  /* 464 (reisim 2026-10-09, hata listesi 9: "… bir sonraki kontrol tarihi olmalı ve bunlar o günkü tarihe ve saate göre otomatik dolmalı istenirse
     elle düzeltilebilmeli"): sonraki kontrol (başlangıç + tür periyodu) ve rapor tarihi (başlangıç günü) açılışta yazılı gelir — eskiden boş
     görünüp gönderilirken dolardı */
  const [tarih, setTarih] = useState(() => {
    const t = bosla(v.tarih), g = t.bas.slice(0, 10);
    if (g && !t.sonraki) t.sonraki = ayEkle(g, v.tur.periyot);
    if (g && !t.rapor) t.rapor = g;
    return t;
  });
  const [cevaplar, setCevaplar] = useState<Cevaplar>(v.cevaplar);
  /* sonraki kontrol ve rapor tarihi elle seçilene kadar başlangıçtan gelir (maket sonrakiEl / rtarihEl) */
  /* kaydedilmiş değer başlangıçtan türetilenle aynıysa elle seçilmemiş sayılır (yeniden açılışta da başlangıca bağlı kalır) */
  const [elle, setElle] = useState(() => {
    const basGun = v.tarih.bas.slice(0, 10);
    return { sonraki: !!v.tarih.sonraki && v.tarih.sonraki !== ayEkle(basGun, v.tur.periyot), rapor: !!v.tarih.rapor && v.tarih.rapor !== basGun };
  });
  const [kirli, setKirli] = useState(false);
  /* 404: cihazda bekleyen (gönderilmemiş) kayıt varsa ekran onu gösterir — sunucudaki eski hâl değil (açılışta ve sayfa tazelenince; kullanıcı o
     sırada yazıyorsa onun yazdığı kalır) */
  const [cihazdaki, setCihazdaki] = useState(false);
  const kirliRef = useRef(false);
  useEffect(() => { kirliRef.current = kirli; }, [kirli]);
  useEffect(() => {
    if (denemede) return;
    let iptal = false;
    void bekleyenIcerik(v.id).then((b) => {
      if (iptal || !b || kirliRef.current) { if (!iptal && !b) setCihazdaki(false); return; }
      const g = b.girdi as Partial<{ ekipman: Record<string, string>; tarih: Record<string, string>; cevaplar: Cevaplar }>;
      if (g.ekipman) setEkipman((e) => ({ ...e, ...g.ekipman }) as typeof e);
      if (g.tarih) setTarih((t) => ({ ...t, ...g.tarih }) as typeof t);
      if (g.cevaplar) setCevaplar(g.cevaplar);
      setCihazdaki(true);
    }).catch(() => undefined);
    return () => { iptal = true; };
  }, [v.id, v.surum, denemede]);
  const [sonKayit, setSonKayit] = useState<string | null>(v.surum > 0 ? v.degisti : null);
  const [isaretli, setIsaretli] = useState<ReadonlySet<string>>(() => new Set());
  const [eksikler, setEksikler] = useState<Eksik[] | null>(null);
  const [genel, setGenel] = useState<string | null>(null);
  const [alanHata, setAlanHata] = useState<Record<string, string>>({});
  /* 463 (reisim 2026-10-09, hata listesi 8: "her bölüm açık geliyor, her bölüm kapalı gelmeli"): bölümler KAPALI açılır; bu sekmede aynı raporda
     açılanlar yenilemede ve geri gelişte açık kalır (sessionStorage, rapor başına); "Tümünü aç / kapat"; eksik bulununca hepsi açılır */
  const acikAnahtar = `probata-rapor-acik:${v.id}`;
  const [acikSet, setAcikSet] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    if (denemede) return;
    let l: string[] = [];
    try {
      const s = sessionStorage.getItem(acikAnahtar);
      if (s) l = (JSON.parse(s) as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 60);
    } catch { /* okunamazsa kapalı */ }
    if (l.length) queueMicrotask(() => setAcikSet(new Set(l)));
  }, [acikAnahtar, denemede]);
  /* 472: örnek raporda (kurucunun saha ekranı) bölümler gerçek ekran gibi kapalı gelir; kâğıtta eklenen maddeye ilk cevap, çıkarılan maddenin
     cevabı düşer (taslak her değiştiğinde) */
  const ilkTanim = useRef(true);
  useEffect(() => {
    if (!denemede) return;
    if (ilkTanim.current) { ilkTanim.current = false; return; }
    queueMicrotask(() => setCevaplar((c) => cevaplariTamamla(v.tanim, c)));
  }, [denemede, v.tanim]);
  const acikYaz = (y: ReadonlySet<string>) => {
    setAcikSet(y);
    if (denemede) return;
    try { sessionStorage.setItem(acikAnahtar, JSON.stringify([...y])); } catch { /* saklanamazsa yalnız bu ekranda */ }
  };
  /* 472: örnek raporun fotoğrafları — dosya yüklenmez, yalnız yerleri sayılır (zorunlu fotoğraf denenebilsin) */
  const [denemeFoto, setDenemeFoto] = useState<{ bolum: string; madde: string | null }[]>([]);
  const hepsiniAc = () => acikYaz(new Set([SABIT.firma, SABIT.ekipman, SABIT.cihaz, ...v.tanim.bolumler.map((b) => b.id)]));
  const [kopya, setKopya] = useState(false);
  const [revizeAc, setRevizeAc] = useState(false);
  /* yazmadan sonra sayfa yenilenip yeni sürüm gelene kadar yazan tuşlar kapalı: bildirim yenilemeden önce çıkar, hemen basılan ikinci tuş eski
     sürümle gidip "değiştirildi" denmesin (yenilenen veri yeni nesnedir — aynı nesne = henüz gelmedi) */
  const [yenilenen, setYenilenen] = useState<Gorunum | null>(null);
  const mesgul = bekliyor || yenilenen === v;
  const yenile = () => { setYenilenen(v); router.refresh(); window.setTimeout(() => setYenilenen((y) => (y === v ? null : y)), 20_000); };   /* yenileme düşerse tuşlar açılır */
  const oku = !duzenle;

  /* canlı değerlendirme: cihaz sayısı raporun kendi listesinden (sunucu da öyle sayar), fotoğraf bu sürümde yok */
  const d = useMemo(() => {
    /* sayılar sunucudaki gibi raporun kendi listesinden: bölüm başına ve madde başına fotoğraf */
    const foto: Record<string, number> = {}, mf: Record<string, number> = {};
    const yerler = [...v.fotolar, ...denemeFoto, ...bekleyenFotolar.map((x) => { const [bolum, m] = (x.yer ?? "|").split("|"); return { bolum, madde: m || null }; })];
    for (const f of yerler) { if (f.madde) mf[f.madde] = (mf[f.madde] ?? 0) + 1; else foto[f.bolum] = (foto[f.bolum] ?? 0) + 1; }
    const madde = Object.fromEntries(Object.entries(cevaplar.madde).map(([k, x]) => [k, { ...x, foto: mf[k] ?? 0 }]));
    return degerlendir(v.tanim, { ...cevaplar, madde, cihaz: v.cihazlar.filter((x) => x.cihaz).length, foto });
  }, [v.tanim, v.cihazlar, v.fotolar, denemeFoto, bekleyenFotolar, cevaplar]);
  /* şu an boş olan zorunlu alanlar (format + sabit tarihler + gerekli cihazlar); işaret yalnız Onaya gönder'in dediği VE hâlâ boş olanda */
  const canli = useMemo(() => {
    const s = new Set(d.eksikler.map((e) => e.alan));
    if (!tarih.bas) s.add("tarih.bas");
    for (const x of v.cihazlar) if (!x.cihaz || x.cihaz.eksik || x.cihaz.gecti) s.add(`cihaz.${x.turId}`);
    return s;
  }, [d, tarih.bas, v.cihazlar]);
  const gecersiz = (alan: string) => isaretli.has(alan) && canli.has(alan);
  /* 473: denemenin canlı eksik / kusur sayısı kurucuya */
  const durumBildir = deneme?.durum, eksikSay = canli.size, kusurSay = d.kusurlar.length;
  useEffect(() => { durumBildir?.({ eksik: eksikSay, kusur: kusurSay }); }, [durumBildir, eksikSay, kusurSay]);

  const kaynaklar: Record<Kaynak, string | null> = {
    firma_adi: v.kunye.firmaAdi, tesis_adresi: v.kunye.adres, sgk: v.kunye.sgk, isg_id: v.kunye.isgNo,
    kontrol_tarihi: tarih.bas ? tarihNo(tarih.bas) : null, rapor_no: v.no, ekipman_kodu: v.ekipman.kod, ekipman_adi: v.tur.ad,
    seri_no: ekipman.seri || null, kullanim_yeri: ekipman.konum || null,
  };
  const yaz = (f: (c: Cevaplar) => Cevaplar) => { setCevaplar(f); setKirli(true); };
  const bag: Baglam = {
    v, c: cevaplar, yaz, d, oku, gecersiz, kaynak: (k) => kaynaklar[k], yz: !oku && v.yz, islem: { mesgul, baslat, yenile },
    ekipmanAlani: (a) => (a.ekipman ? metinSatiri(a.ekipman, a.ad, EN[a.ekipman], a.ekipman === "imal") : null),
    cihaz: (bolumId) => <CihazBolumu v={v} bolumId={bolumId} oku={oku || !!yeni || denemede} gecersiz={gecersiz} mesgul={mesgul} baslat={baslat} yenile={yenile} />,
    foto: (bolumId, madde) => (denemede
      ? <DenemeFoto key={`${bolumId}-${madde ?? ""}`} adet={denemeFoto.filter((f) => f.bolum === bolumId && f.madde === madde).length}
        gecersiz={gecersiz(madde ? `${madde}.foto` : bolumId)} ekle={() => setDenemeFoto((l) => [...l, { bolum: bolumId, madde }])}
        cikar={() => setDenemeFoto((l) => { const i = l.findIndex((f) => f.bolum === bolumId && f.madde === madde); return i < 0 ? l : l.filter((_, j) => j !== i); })} />
      : <FotoListesi key={`${bolumId}-${madde ?? ""}`} v={v} bolumId={bolumId} madde={madde} oku={oku} yeniAc={yeni ? yeniAc : undefined}
        gecersiz={gecersiz(madde ? `${madde}.foto` : bolumId)} mesgul={mesgul} baslat={baslat} yenile={yenile} />),
  };

  /* format bölümleri ve numaraları belgeyle ortak (format/duzen.ts, 427): yalnız kayıttan gelen alanlı bilgi bölümü 1. bölümün kopyası — çizilmez;
     ekipman bilgi bölümü 2. bölüme katılır ve adı 2. bölümün başlığı olur; üst başlıklı bölümler N.1, N.2; numarasız bölüm numarasız */
  /* 2. bölüm: eski formatta kayıttan başlayan sabit satırlar (formatın aynı adlı alanı varsa o satır yok — belgeyle aynı liste); tam ekipman
     bölümlü formatta (460) yalnız kod, tür, metot ve formatın alanları — marka, model … ekipman kaydına bağlı alan olarak yerinde */
  const cihazEk = !v.tanim.bolumler.some((b) => b.blok === "cihaz") && v.cihazlar.length > 0;
  const duzen = raporDuzeni(v.tanim, cihazEk);
  const katilan = duzen.katilan;
  const sabit = sabitEkipmanAlanlari(v.tanim);
  /* etiketten okunabilen ve ekranda satırı olan alanlar (385) */
  const etiketAlanlari = ETIKET.filter((k) => (duzen.tam ? duzen.tam.alanlar.some((a) => a.ekipman === k) : sabit.includes(k)));
  const cihazEksik = v.cihazlar.some((x) => gecersiz(`cihaz.${x.turId}`));
  const bolumEksik = (id: string) => d.eksikler.some((e) => e.bolum === id && gecersiz(e.alan));
  const acik = (id: string) => acikSet.has(id);
  const degistir = (id: string) => (a: boolean) => { const y = new Set(acikSet); if (a) y.add(id); else y.delete(id); acikYaz(y); };
  /* ekranda görünen bölümler (imza bölümü yalnız belgede — 447): "Tümünü aç / kapat" */
  const gorunurBolumler = duzen.bolumler.filter(({ b }) => b.blok !== "imza");
  const gorunenBolumler = [SABIT.firma, SABIT.ekipman, ...(cihazEk ? [SABIT.cihaz] : []), ...gorunurBolumler.map(({ b }) => b.id)];
  const hepsiAcik = gorunenBolumler.every((id) => acikSet.has(id));

  /* ── yazma ── */
  const ekipmanYaz = (k: EkipmanAnahtari, x: string) => { setEkipman((e) => ({ ...e, [k]: x })); setKirli(true); };
  const tarihYaz = (k: TarihAnahtari, x: string) => {
    const oto = { sonraki: !elle.sonraki, rapor: !elle.rapor };
    setTarih((t) => {
      const y = { ...t, [k]: x };
      if (k === "bas" && x) {
        if (oto.sonraki) y.sonraki = ayEkle(x.slice(0, 10), v.tur.periyot);
        if (oto.rapor) y.rapor = x.slice(0, 10);
      }
      return y;
    });
    if (k === "sonraki" || k === "rapor") setElle((e) => ({ ...e, [k]: true }));
    setKirli(true);
  };
  const girdi = () => ({ ekipman, tarih, cevaplar });
  /* 464: bitiş elle seçilene kadar ŞİMDİ gösterilir (yarım dakikada bir ilerler, başlangıçtan önce olmaz) ve kaydedilmez — gönderilirken sunucu
     gönderme anını yazar (değişmedi). Sunucu saati Türkiye saati değil: değer tarayıcıda, çizimden sonra gelir */
  const [simdi, setSimdi] = useState("");
  const bitOto = !oku && !tarih.bit;
  useEffect(() => {
    if (!bitOto) return;
    const g = () => setSimdi(simdiIso());
    queueMicrotask(g);
    const z = window.setInterval(g, 30_000);
    return () => window.clearInterval(z);
  }, [bitOto]);
  const gorunen = (k: TarihAnahtari) => (k === "bit" && bitOto ? (simdi && simdi < tarih.bas ? tarih.bas : simdi) : tarih[k]);
  const kaydedildi = () => { setKirli(false); setSonKayit(new Date().toISOString()); setGenel(null); setAlanHata({}); };
  const yanitHatasi = (r: RaporYaniti) => {
    const h = r.hatalar ?? {}, ilk = Object.keys(h)[0];
    setAlanHata(h);
    setGenel(r.genel ?? (ilk ? `${ALAN_ADI[ilk] ? `${ALAN_ADI[ilk]}: ` : ""}${h[ilk]}` : "İşlem yapılamadı."));
  };

  /* bağlantı yoksa (ya da istek ağda düştüyse) iş cihaz kuyruğuna; bu raporun kuyrukta bekleyen işi varsa yenisi onun yerine ve kuyruktan gider
     (ikisi ayrı yollardan gitse eskisi yenisini "değiştirildi" diye düşürürdü) */
  /* 405: yeni raporda ilk işten önce "rapor.olustur" kuyruğa (bir kez; açılınca işler sunucunun verdiği kimliğe bağlanır) */
  const yeniAc = async () => {
    if (yeni) await kuyrugaEkle({ tur: "rapor.olustur", kayit: v.id, surum: 0, girdi: { plan: yeni.plan, ekipman: yeni.ekipman }, ad: `Yeni rapor · ${yeni.kod}`, yer: `${yeni.plan}|${yeni.ekipman}` });
  };
  const kuyruga = async (tur: KuyrukTuru, bildirim: string) => {
    await yeniAc();
    await kuyrugaEkle({ tur, kayit: v.id, surum: v.surum, girdi: girdi(), ad: `${tur === "rapor.gonder" ? "Onaya gönder" : "Rapor kaydı"} · ${v.no}` });
    kaydedildi();
    bildir(bildirim);
  };
  const kaydet = () => baslat(async () => {
    if (yeni || cevrimdisiMi() || bekleyenIs) { await kuyruga("rapor.kaydet", cevrimdisiMi() ? "Cihaza kaydedildi; bağlantı gelince gönderilecek." : "Kaydediliyor…"); return; }
    let r: RaporYaniti;
    try { r = await raporKaydetEylemi(v.id, v.surum, girdi()); } catch (e) {
      if (!agHatasi(e)) throw e;
      await kuyruga("rapor.kaydet", "Bağlantı koptu: cihaza kaydedildi; bağlantı gelince gönderilecek.");
      return;
    }
    if (r.tamam) { kaydedildi(); void kayitBilgileriniKapat(v.id); bildir(r.bildirim ?? "Rapor kaydedildi."); yenile(); return; }
    yanitHatasi(r);
  });
  /* kuyruktan giden işin sonucu (394): bu raporunsa ekran tazelenir; eksikse alanlar işaretlenir (bağlantılı Onaya gönder gibi) */
  const kuyrukSonucu = useRef<(d: KuyrukSonucOlayi) => void>(() => undefined);
  useEffect(() => {
    kuyrukSonucu.current = (d) => {
      if (d.kayit !== v.id) return;
      /* 405: yeni rapor sunucuda açıldı → raporun kendi ekranına (bekleyen kayıt / fotoğraflar oradan, gerçek kimlikle gider) */
      if (d.tur === "rapor.olustur") {
        if (d.durum === "tamam" && d.yeni) { bildir(`${yeni?.kod ?? v.ekipman.kod}: rapor açıldı, numarası verildi.`); setAcildi(d.yeni); return; }
        setGenel(`Rapor açılamadı — ${d.ileti ?? "üst çubuktaki bekleyen işlemlere bakın"}. Yazdıklarınız cihazda duruyor.`);
        return;
      }
      if (d.durum === "tamam") {
        setGenel(null);
        bildir(d.tur === "rapor.gonder" ? `${v.no}: cihazda bekleyen onaya gönderim gitti.` : d.tur === "rapor.foto" ? `${v.no}: cihazda bekleyen fotoğraf gönderildi.` : `${v.no}: cihazda bekleyen kayıt gönderildi.`);
        yenile();
        return;
      }
      if (d.durum === "eksik" && d.eksikler) { setIsaretli(new Set(d.eksikler.map((e) => e.alan))); hepsiniAc(); setEksikler(d.eksikler); yenile(); return; }
      setGenel(`${v.no}: cihazda bekleyen iş gönderilemedi — ${d.ileti ?? "üst çubuktaki bekleyen işlemlere bakın"}.`);
    };
  });
  useEffect(() => {
    const f = (e: Event) => kuyrukSonucu.current((e as CustomEvent<KuyrukSonucOlayi>).detail);
    window.addEventListener("probata-islem", f);
    return () => window.removeEventListener("probata-islem", f);
  }, []);
  const gonder = async () => {
    if (!(await onayla({ baslik: "Rapor onaya gönderilsin mi?", tus: "Onaya gönder",
      metin: `${v.no} teknik yöneticinin onayına gider. Onaylanana ya da geri gönderilene kadar raporda değişiklik yapılamaz.` }))) return;
    gonderIc();
  };
  const gonderIc = () => baslat(async () => {
    const yon = "bağlantı gelince onaya gider";
    if (yeni || cevrimdisiMi() || bekleyenIs) { await kuyruga("rapor.gonder", cevrimdisiMi() ? `Cihaza kaydedildi: ${yon}.` : "Onaya gönderiliyor…"); return; }
    let r: RaporYaniti;
    try { r = await onayaGonderEylemi(v.id, v.surum, girdi()); } catch (e) {
      if (!agHatasi(e)) throw e;
      await kuyruga("rapor.gonder", `Bağlantı koptu: cihaza kaydedildi; ${yon}.`);
      return;
    }
    if (r.eksikler) {   /* rapor kaydedildi, gönderilmedi */
      kaydedildi(); setIsaretli(new Set(r.eksikler.map((e) => e.alan))); hepsiniAc(); setEksikler(r.eksikler); yenile();
      return;
    }
    if (r.tamam) { kaydedildi(); void kayitBilgileriniKapat(v.id); setIsaretli(new Set()); bildir(r.bildirim ?? "Rapor onaya gönderildi."); yenile(); window.scrollTo({ top: 0 }); return; }
    yanitHatasi(r);
  });
  /* 472: örnek raporda Onaya gönder yalnız denetler — gerçek Onaya gönder'in eksik listesi (boş zorunlu alan, cihaz) aynı pencerede */
  const denemeGonder = () => {
    const l: Eksik[] = [];
    if (!tarih.bas) l.push({ bolum: SABIT.firma, alan: "tarih.bas", ad: "Periyodik kontrol başlangıç tarihi ve saati" });
    for (const e of d.eksikler) l.push(e);
    for (const x of v.cihazlar) if (!x.cihaz || x.cihaz.eksik || x.cihaz.gecti) l.push({ bolum: SABIT.cihaz, alan: `cihaz.${x.turId}`, ad: `${x.turAd}: ölçüm cihazı` });
    if (!l.length) { setIsaretli(new Set()); bildir("Örnek rapor eksiksiz: gerçek raporda onaya giderdi. Örnek rapor kaydedilmez."); return; }
    setIsaretli(new Set(l.map((e) => e.alan))); hepsiniAc(); setEksikler(l);
  };
  const sil = async () => {
    if (!(await onayla({ baslik: "Raporu sil", metin: `${v.no} · ${v.ekipman.kod} raporu ve içine yazılan her şey silinir; geri alınamaz.`, tus: "Sil", tehlike: true }))) return;
    baslat(async () => {
      const r = await raporSilEylemi(v.id, v.surum);
      if (r.tamam) { bildir(r.bildirim ?? "Rapor silindi."); router.push(`/planlar/${v.plan.id}`); return; }
      yanitHatasi(r);
    });
  };
  /* kopya: Yeni raporda ekranın son hâli önce kaydedilir; başarıda yeni ekipmanın raporuna gidilir (karar 208) */
  const kopyala = (k: { kod: string; konum: string }) => new Promise<string | null>((bitti) => baslat(async () => {
    const r = await raporKopyalaEylemi(v.id, v.surum, k, duzenle ? girdi() : null);
    if (r.tamam && r.id) { setKirli(false); setKopya(false); bildir(r.bildirim ?? "Kopya açıldı."); router.push(`/raporlar/${r.id}`); bitti(null); return; }
    const h = r.hatalar ?? {}, ilk = Object.keys(h)[0];
    if (r.hatalar && !h.kod && ilk) { setKopya(false); yanitHatasi(r); bitti(null); return; }   /* raporun kendi alanı geçersiz: üst şeritte */
    bitti(h.kod ?? r.genel ?? (ilk ? h[ilk] : "Kopya açılamadı."));
  }));
  const onizle = () => baslat(async () => {
    const r = await raporKaydetEylemi(v.id, v.surum, girdi());
    if (r.tamam) { kaydedildi(); router.push(`/raporlar/${v.id}/onizle`); return; }
    yanitHatasi(r);
  });
  /* revize iste (318): başarıda pencere kapanır; gerekçe hatası pencerede, ötekisi üst şeritte */
  const revizeIste = (gerekce: string) => new Promise<string | null>((bitti) => baslat(async () => {
    const r = await revizeIsteEylemi(v.id, { gerekce });
    if (r.tamam) { setRevizeAc(false); setGenel(null); bildir(r.bildirim ?? "Revize isteği gönderildi."); yenile(); bitti(null); return; }
    if (r.hatalar?.gerekce) { bitti(r.hatalar.gerekce); return; }
    setRevizeAc(false); setGenel(r.genel ?? "İstek gönderilemedi."); bitti(null);
  }));
  const revizeGeriCek = () => v.revize?.bekleyen && baslat(async () => {
    const r = await revizeIstegiGeriCekEylemi(v.id, v.revize!.bekleyen!.id, v.revize!.bekleyen!.surum);
    if (r.tamam) { setGenel(null); bildir(r.bildirim ?? "Revize isteği geri çekildi."); yenile(); return; }
    setGenel(r.genel ?? "İstek geri çekilemedi.");
  });
  const formatGuncelle = () => baslat(async () => {
    const r = await raporFormatGuncelleEylemi(v.id, v.surum, girdi());
    if (r.tamam) { kaydedildi(); bildir(r.bildirim ?? "Format güncellendi."); yenile(); return; }
    yanitHatasi(r);
  });
  const kunyeGuncelle = () => baslat(async () => {
    const r = await raporKunyeGuncelleEylemi(v.id);
    if (r.tamam) { setGenel(null); bildir(r.bildirim ?? "Plan bilgileri güncellendi."); yenile(); return; }
    yanitHatasi(r);
  });
  /* eksiğe git (maket eksikeGit): pencere kapanır, bölümler açılır, alana kayılır ve odaklanır (pencerenin odak iadesinden sonra). Listedeki
     eksiğe ya da Tamam'a basınca; X / Esc yalnız kapatır (odak Onaya gönder'e döner, kişi nereye gideceğini kendi seçer) */
  const git = (e: Eksik) => {
    setEksikler(null);
    hepsiniAc();
    window.setTimeout(() => {
      const el = document.getElementById(alanId(e.alan)) ?? document.getElementById(`b-${e.bolum}-b`);
      if (!el) return;
      const hedef = el.matches("input, textarea, button") ? el : el.querySelector<HTMLElement>("input, textarea, button") ?? el;
      el.scrollIntoView({ block: "center" });
      hedef.focus({ preventScroll: true });
    }, 60);
  };
  const tamam = () => (eksikler?.length ? git(eksikler[0]) : setEksikler(null));

  /* S.A.Y (382): düzenlenebilir rapor açıkken S.A.Y bu raporu okur — CANLI hâl (kaydedilmemiş değişiklikler dahil): boş zorunlu alanlar, sonuç
     önerisi; öneri denetçinin seçimiyle aynı yoldan uygulanır (Kaydet'le yazılır); eksiğe aynı "git" götürür. Rapor ekranı kapanınca bağ kalkar. */
  const sayGuncel = useRef({ d, cevaplar, tarih, yaz, git });
  useEffect(() => { sayGuncel.current = { d, cevaplar, tarih, yaz, git }; });
  useEffect(() => {
    if (oku || yeni || denemede) return;
    const bolumAdi = (id: string) => v.tanim.bolumler.find((b) => b.id === id)?.ad ?? id;
    return sayRaporBagla({
      id: v.id, no: v.no,
      eksikler: () => {
        const { d, tarih } = sayGuncel.current, l: { bolum: string; alan: string; ad: string; bolumAd: string }[] = [];
        if (!tarih.bas) l.push({ bolum: SABIT.firma, alan: "tarih.bas", ad: "Kontrol başlangıcı", bolumAd: "Firma bilgileri" });
        for (const e of d.eksikler) l.push({ bolum: e.bolum, alan: e.alan, ad: e.ad.slice(0, 300), bolumAd: bolumAdi(e.bolum).slice(0, 120) });
        for (const x of v.cihazlar) {
          if (x.cihaz && !x.cihaz.eksik && !x.cihaz.gecti) continue;
          l.push({ bolum: SABIT.cihaz, alan: `cihaz.${x.turId}`, bolumAd: "Ölçüm cihazları",
            ad: `${x.turAd}: ${!x.cihaz ? "ölçüm cihazı eklenmedi" : x.cihaz.eksik ? "eklenen cihaz artık kayıtlı değil" : "kalibrasyonu geçmiş"}`.slice(0, 300) });
        }
        return l;
      },
      sonuc: () => {
        const { d, cevaplar } = sayGuncel.current;
        return { var: v.tanim.bolumler.some((b) => b.blok === "sonuc"), oneri: d.oneri, secili: cevaplar.sonuc === "uygun" || cevaplar.sonuc === "uygun_degil" ? cevaplar.sonuc : "", kusur: d.kusurlar.length };
      },
      sonucUygula: (x) => sayGuncel.current.yaz((c) => ({ ...c, sonuc: x })),
      git: (e) => sayGuncel.current.git({ bolum: e.bolum, alan: e.alan, ad: e.ad }),
      cevaplar: () => sayGuncel.current.cevaplar,
    });
  }, [oku, yeni, denemede, v.id, v.no, v.tanim, v.cihazlar]);

  /* ── alan çizicileri ── */
  const metinSatiri = (k: EkipmanAnahtari, etiket: string, en: number, sayisal = false) => {
    const id = EID(k), h = alanHata[`ekipman.${k}`];
    return (
      <Satir key={k} etiket={etiket} htmlFor={id}>
        {oku ? <OkuGirdi id={id} deger={ekipman[k]} /> : <Girdi id={id} value={ekipman[k]} maxLength={en} inputMode={sayisal ? "numeric" : undefined} hata={!!h}
          onChange={(e) => ekipmanYaz(k, e.target.value)} />}
        {h && <p className={stil.alanHata} id={ipucuId(id)}>{h}</p>}
      </Satir>
    );
  };
  const tarihUyari = (k: TarihAnahtari) =>
    k === "bit" && tarih.bas && tarih.bit && tarih.bit < tarih.bas ? "Bitiş başlangıçtan önce."
      : k === "sonraki" && tarih.bas && tarih.sonraki && tarih.sonraki <= tarih.bas.slice(0, 10) ? "Kontrol tarihinden sonra olmalı." : null;
  /* genis (464): başlangıç, bitiş ve sonraki kontrol alt alta, tam satır */
  const tarihSatiri = (k: TarihAnahtari, etiket: string, saat: boolean, zorunlu = false, genis = false) => {
    const id = TID(k), alan = `tarih.${k}`, gec = gecersiz(alan);
    const h = alanHata[alan] ?? (gec ? "Tarih ve saat seçilmeli." : null), u = h ? null : tarihUyari(k);
    const oto = k === "bit" && bitOto && !h && !u;
    return (
      <Satir key={k} etiket={etiket} htmlFor={id} zorunlu={zorunlu && !oku} genis={genis}>
        {oku ? <OkuGirdi id={id} deger={tarih[k] ? (saat ? saatliNo(tarih[k]) : tarihNo(tarih[k])) : ""} /> : <>
          <TarihKutusu id={id} ad={etiket} saat={saat} deger={gorunen(k)} degistir={(x) => tarihYaz(k, x)} gecersiz={gec}
            tanim={h || u || oto ? ipucuId(id) : undefined} />
          {(h || u) && <p className={h ? stil.alanHata : stil.alanUyari} id={ipucuId(id)}>{h ?? u}</p>}
          {oto && <p className={stil.ipucuMetin} id={ipucuId(id)}>Şimdi · onaya gönderilince o anın saati yazılır; değiştirmek için seçin.</p>}
        </>}
      </Satir>
    );
  };
  /* 428: türün kontrol metodu standartları da standart penceresini açar (önce sorar) */
  const metot = v.tur.kontrolStd.length
    ? <span className={stil.stdListe}>{v.tur.kontrolStd.map((x) => <StandartTusu key={x} std={x} kaynak={v.kaynak} />)}</span> : <DegerYok>-</DegerYok>;
  const onceki = v.ekipman.onceki;

  /* ── şeritler ── */
  const seritler: ReactNode[] = [];
  if (deneme) {
    seritler.push(<Serit key="deneme" tur="bilgi" ikon="flask-conical">
      Örnek rapor · denetçinin sahada göreceği ekran. Format kâğıtta düzenlenir; burada yazdıklarınız kaydedilmez, müşteri, tesis ve cihazlar uydurmadır.</Serit>);
  }
  if (genel) seritler.push(<Serit key="hata" tur="hata" ikon="circle-alert">{genel}</Serit>);
  /* 405: yeni rapor cihazda — numara ve kimlik sunucuda, bağlantı gelince */
  else if (acildi) seritler.push(<Serit key="acildi" tur="onay" ikon="circle-check" eylem={<TusBaglanti tur="ikincil" href={`/raporlar/${acildi}`}>Raporu aç</TusBaglanti>}>Rapor sunucuda açıldı; cihazda bekleyen kaydı gidince raporun sayfasına geçilir.</Serit>);
  else if (yeni) seritler.push(<Serit key="yeni" tur="bilgi" ikon="wifi-off">Bu rapor bu cihazda açıldı; bağlantı gelince sunucuda açılır ve numarası verilir. Ölçüm cihazı ve fotoğraftan okuma o zaman eklenir.</Serit>);
  /* 402: cihazda gönderilemeyen iş (çakışma, yapılamadı) sayfa yenilense de söylenir — anlık bildirim kaybolsa da kullanıcı bilir */
  else if (cihazdaki && formBekliyor) seritler.push(<Serit key="cihazdaki" tur="bilgi" ikon="wifi-off">Bu ekranda cihazda bekleyen kaydınız gösteriliyor; bağlantı gelince gönderilecek.</Serit>);
  else if (sorunluIs) seritler.push(<Serit key="kuyruk" tur="hata" ikon="circle-alert">{v.no}: cihazda bekleyen iş gönderilemedi{sorunluIs.ileti ? ` — ${sorunluIs.ileti}` : ""}. Üst çubuktaki bekleyen işlemlerden seçin.</Serit>);
  if (duzenle && v.kunyeFark.length) {
    seritler.push(
      <Serit key="kunye" tur="bilgi" ikon="refresh-cw" eylem={<Tus tur="ikincil" ikon="refresh-cw" disabled={mesgul} onClick={kunyeGuncelle}>Güncelle</Tus>}>
        Planlamacı plan bilgilerini değiştirdi: <b>{v.kunyeFark.join(", ")}</b>. Raporunuza almak için Güncelle&apos;ye basın.
      </Serit>,
    );
  }
  if ((duzenle || v.izin.kopyala) && v.mesaiDolu) {
    seritler.push(<Serit key="mesai" tur="uyari" ikon="clock">Günlük süre doldu; yeni rapor ve kopya oluşturulamaz.</Serit>);
  }
  if (duzenle && v.guncelFormat) {
    seritler.push(
      <Serit key="format" tur="bilgi" ikon="refresh-cw" eylem={<Tus tur="ikincil" ikon="refresh-cw" disabled={mesgul} onClick={formatGuncelle}>Formatı güncelle</Tus>}>
        Bu rapor eski format sürümüyle açıldı (sürüm {v.formatSira}); güncel sürüm {v.guncelFormat}.
      </Serit>,
    );
  }
  /* U8 (314): teknik yönetici geri gönderdiyse (ya da durumu Yeni'ye aldıysa) gerekçe raporun üstünde; revizeye gönderdiyse (318) "Revizeye gönderildi (R1)" */
  if (v.durum === "taslak" && v.geri) {
    seritler.push(
      <Serit key="geri" tur="uyari" ikon={v.geri.revize ? "file-pen-line" : "undo-2"}>
        <b>{v.geri.revize ? `Revizeye gönderildi (R${v.geri.revize})` : "Geri gönderildi"}</b> · {v.geri.kim} · {zamanNo(v.geri.zaman)}{v.geri.gerekce ? <>: “{v.geri.gerekce}”</> : null}
      </Serit>,
    );
  }
  /* revize isteği (318): bekleyen istek geri çekilebilir; reddedilen isteğin gerekçesi görünür (yeniden istenebilir) */
  if (v.revize?.bekleyen) {
    seritler.push(
      <Serit key="revize" tur="bilgi" ikon="file-pen-line" eylem={<Tus tur="ikincil" ikon="undo-2" disabled={mesgul} onClick={revizeGeriCek}>Revize isteğini geri çek</Tus>}>
        <b>Revize isteğiniz teknik yöneticide</b> · {zamanNo(v.revize.bekleyen.zaman)}: “{v.revize.bekleyen.gerekce}”
      </Serit>,
    );
  } else if (v.revize?.red) {
    seritler.push(
      <Serit key="revize" tur="uyari" ikon="file-pen-line">
        <b>Revize isteği reddedildi</b> · {v.revize.red.kim} · {zamanNo(v.revize.red.zaman)}{v.revize.red.gerekce ? <>: “{v.revize.red.gerekce}”</> : null}
      </Serit>,
    );
  }
  if (v.durum === "taslak" && v.kopyaKaynak) {
    seritler.push(
      <Serit key="kopya" tur="bilgi" ikon="copy">
        Bilgiler <Kod>{v.kopyaKaynak}</Kod> raporundan kopyalandı; test değerleri, fotoğraflar ve sonuç bu ekipman için girilir.
      </Serit>,
    );
  }
  /* son imza (317): imza şeridi kilit şeridinin yerine geçer (aynı şeyi iki kez söylemesin) */
  if (v.imza || v.imzali) seritler.push(<ImzaBolumu key="imza" v={v} mesgul={mesgul} baslat={baslat} yenile={yenile} hata={setGenel} />);
  else if (v.durum !== "taslak") {
    seritler.push(<Serit key="kilit" tur="bilgi" ikon="lock">{KILIT[v.durum]}{v.durum === "onayda" && v.gonderildi ? ` · ${zamanNo(v.gonderildi)}` : null}</Serit>);
  } else if (gonderimBekliyor) {
    /* 394 (maket Z4): Onaya gönder cihazda bekliyor — gidene kadar rapor değişmez */
    seritler.push(<Serit key="kilit" tur="uyari" ikon="wifi-off">Onaya gönderim bu cihazda bekliyor: bağlantı gelince gider. O zamana kadar rapor değiştirilemez.</Serit>);
  } else if (!duzenle) {
    seritler.push(<Serit key="kilit" tur="bilgi" ikon="lock">Rapor yazılıyor; yalnız raporu yazan muayene uzmanı düzenler.</Serit>);
  }

  const [durumAd, rozet] = RAPOR_DURUM[v.durum];
  return (
    <>
      {!deneme && <Kirinti ogeler={[["Planlar", "/planlar"], [v.plan.no, `/planlar/${v.plan.id}`], [v.no]]} />}
      <NesneBasi baslik={`${v.ekipman.kod} · ${v.tur.ad}`} altIkon="file-text"
        rozet={<><Rozet tur={rozet}>{durumAd}</Rozet>{bekleyenIs && <Rozet tur="bekliyor">{gonderimBekliyor ? "Gönderilmedi · bağlantı bekleniyor" : formBekliyor ? "Cihazda kayıt · gönderilmedi" : `Cihazda ${bekleyenFotolar.length} fotoğraf · gönderilmedi`}</Rozet>}</>}
        alt={<><Kod>{v.no}</Kod> · {v.plan.musteriKisa} · {v.plan.tesisAd} · {v.yazan.ad}</>}
        tuslar={<>
          {duzenle && !deneme && (
            <p className={kirli ? `${stil.kayit} ${stil.kirli}` : stil.kayit} aria-live="polite">
              {kirli ? "Kaydedilmemiş değişiklik var" : sonKayit ? `Son kayıt ${zamanNo(sonKayit)}` : "Kaydedildi"}
            </p>
          )}
          {/* Ön izle (reisim 2026-09-28): kaydedilmiş hâl; kesin PDF'le aynı çizici. Kaydedilmemiş değişiklik varsa önce kaydedilir (atılmaz) */}
          {yeni || deneme ? null : duzenle && kirli
            ? <Tus tur="ikincil" ikon="eye" disabled={mesgul} onClick={onizle}>Ön izle</Tus>
            : <TusBaglanti ikon="eye" href={`/raporlar/${v.id}/onizle`}>Ön izle</TusBaglanti>}
          {v.revize?.iste && <Tus tur="ikincil" ikon="file-pen-line" disabled={mesgul} onClick={() => setRevizeAc(true)}>Revize iste</Tus>}
          {/* 431: genel muayene talimatı (formatın; PDF'e basılmaz) — sağ üstte her zaman */}
          <TalimatTusu buyuk ad="Genel muayene" baslik="Genel muayene talimatı" parcalar={[{ metin: v.tanim.gorunum.talimat }]} />
        </>} />
      <AsamaCizgisi durum={v.durum} />
      {seritler.length > 0 && <SeritKap>{seritler}</SeritKap>}

      <div className={stil.bolumler}>
        <div className={stil.bolumAraclari}>
          <Tus tur="ikincil" ikon={hepsiAcik ? "chevron-up" : "chevron-down"} onClick={() => (hepsiAcik ? acikYaz(new Set()) : hepsiniAc())}>
            {hepsiAcik ? "Tümünü kapat" : "Tümünü aç"}</Tus>
        </div>
        <RaporBolumu id={SABIT.firma} no="1" baslik="Firma bilgileri" acik={acik(SABIT.firma)} degistir={degistir(SABIT.firma)}
          eksik={gecersiz("tarih.bas") || gecersiz("tarih.bit")}>
          {/* 447 (reisim 2026-10-09: "görselde attığım ekranda bi bak sıralama hatası yok mu"): Bakanlık formunun ve belgenin (src/belge/belge.ts)
              sırasıyla, iki sütunda satır satır eşleşir — firma adı | adres · rapor no | rapor tarihi · İSG-KATİP | SGK · başlangıç | bitiş ·
              sonraki | takip; sonra müşterinin e-posta | telefonu, metot ve ekipman bölümü */}
          <Satirlar>
            <Satir etiket="Firma adı">{v.kunye.firmaAdi}</Satir>
            <Satir etiket="Periyodik kontrol adresi">{v.kunye.adres ?? <DegerYok>-</DegerYok>}</Satir>
            <Satir etiket="Rapor no"><Kod>{v.no}</Kod></Satir>
            {tarihSatiri("rapor", "Rapor tarihi", false)}
            <Satir etiket="İSG-KATİP SÖZLEŞME ID">{v.kunye.isgNo ? <span className={stil.kodUzun}>{v.kunye.isgNo}</span> : <span className={stil.uyari}>Yok</span>}</Satir>
            <Satir etiket="SGK DETSİS NO">{v.kunye.sgk ? <span className={stil.kodUzun}>{v.kunye.sgk}</span> : <span className={stil.uyari}>Yok</span>}</Satir>
            {/* 464 (reisim, hata listesi 9: "Periyodik kontrol başlangıç ve bitiş tarihleri alt alta olmalı, hemen ardından bir sonraki kontrol
                tarihi olmalı"): üçü alt alta, tam satır */}
            {tarihSatiri("bas", "Periyodik kontrol başlangıç tarihi ve saati", true, true, true)}
            {tarihSatiri("bit", "Periyodik kontrol bitiş tarihi ve saati", true, false, true)}
            {tarihSatiri("sonraki", "Bir sonraki periyodik kontrol tarihi", false, false, true)}
            {tarihSatiri("takip", "Takip kontrol tarihi", false)}
            <Satir etiket="E-posta">{v.kunye.eposta ?? <DegerYok>-</DegerYok>}</Satir>
            <Satir etiket="Telefon">{v.kunye.tel ?? <DegerYok>-</DegerYok>}</Satir>
            <Satir etiket="Periyodik kontrol metodu ve kapsamı">{metot}</Satir>
            {!duzen.tam && metinSatiri("bolum", "Ekipman bölümü", 60)}
          </Satirlar>
        </RaporBolumu>

        <RaporBolumu id={SABIT.ekipman} no="2" baslik={duzen.ekipmanBaslik} acik={acik(SABIT.ekipman)} degistir={degistir(SABIT.ekipman)}
          eksik={katilan.some((b) => bolumEksik(b.id))}>
          {/* 385: etiket plakasından okuma — yazılabilir raporda, firmada yapay zekâ açıksa, ekranda satırı olan etiket alanları için */}
          {bag.yz && etiketAlanlari.length > 0 && (
            <EtiketOkuma raporId={v.id} alanlar={etiketAlanlari} yaz={(k, x) => ekipmanYaz(k, x)} islem={bag.islem} />
          )}
          <Satirlar>
            <Satir etiket="Kod"><Kod>{v.ekipman.kod}</Kod></Satir>
            <Satir etiket="Ekipman türü">{v.tur.ad}</Satir>
            <Satir etiket="Kontrol metodu">{metot}</Satir>
            {duzen.tam ? duzen.tam.alanlar.map((a) => <BilgiAlani key={a.id} a={a} bag={bag} />)
              : sabit.map((k) => metinSatiri(k, EKIPMAN_ALAN_ADI[k], EN[k], k === "imal"))}
            <Satir etiket="Önceki kontrol">
              {onceki ? `${tarihNo(onceki.tarih)} · ${onceki.sonuc ?? "-"} · eski kayıt (Excel)` : "İlk kontrol"}
            </Satir>
          </Satirlar>
          {!duzen.tam && katilan.map((b) => <BilgiBlok key={b.id} b={b} bag={bag} />)}
        </RaporBolumu>

        {cihazEk && (
          <RaporBolumu id={SABIT.cihaz} no="3" baslik="Ölçüm cihazları" acik={acik(SABIT.cihaz)} degistir={degistir(SABIT.cihaz)} eksik={cihazEksik}>
            {bag.cihaz(SABIT.cihaz)}
          </RaporBolumu>
        )}

        {/* 447 (reisim: "yetkili kişiler ve imzalar kısmının denetim raporu ekranında gözükmesine gerek yok"): imza bölümü yalnız belgede (PDF) */}
        {gorunurBolumler.map(({ b, no, ust }) => (
          <Fragment key={b.id}>
            {ust && <h2 className={stil.ustBaslik}><span className={stil.bolumNo}>{ust.no} · </span>{ust.ad}</h2>}
            <FormatBolumu b={b} no={no} bag={bag} acik={acik(b.id)} degistir={degistir(b.id)}
              eksik={bolumEksik(b.id) || (b.blok === "cihaz" && cihazEksik)} />
          </Fragment>
        ))}
      </div>

      {deneme ? (
        <div className={stil.eylem} data-alt-cubuk="her">
          <Tus tur="ikincil" ikon="check" onClick={() => bildir("Örnek rapor kaydedilmez.")}>Kaydet</Tus>
          <Tus ikon="send" onClick={denemeGonder}>Onaya gönder</Tus>
        </div>
      ) : (duzenle || v.izin.sil || v.izin.kopyala) && (
        <div className={stil.eylem} data-alt-cubuk="her">
          {v.izin.sil && <Tus tur="ikincil" ikon="trash-2" className={stil.silTus} disabled={mesgul} onClick={sil}>Sil</Tus>}
          {v.izin.kopyala && <Tus tur="ikincil" ikon="copy" disabled={mesgul} onClick={() => setKopya(true)}>{duzenle ? "Kaydet ve kopyala" : "Kopyala"}</Tus>}
          {duzenle && <>
            <Tus tur="ikincil" ikon="check" disabled={mesgul} onClick={kaydet}>Kaydet</Tus>
            <Tus ikon="send" disabled={mesgul} onClick={gonder}>Onaya gönder</Tus>
          </>}
        </div>
      )}

      {revizeAc && <RevizeIstePenceresi no={v.no} mesgul={mesgul} onKapat={() => setRevizeAc(false)} gonder={revizeIste} />}

      {kopya && <KopyaPenceresi kaydetVe={duzenle} kaynakKod={v.ekipman.kod} turAd={v.tur.ad} konum={ekipman.konum} mesgul={mesgul}
        onKapat={() => setKopya(false)} kopyala={kopyala} />}

      <Pencere acik={!!eksikler} baslik="Zorunlu alanlar doldurulmadı" onKapat={() => setEksikler(null)} alt={<Tus onClick={tamam}>Tamam</Tus>}>
        <p className={pencereMetinSinifi}>Eksik alanlar kırmızıyla işaretlendi. {deneme ? "Örnek rapor kaydedilmez." : "Rapor kaydedildi, gönderilmedi."}</p>
        <ul className={stil.eksikListe}>
          {(eksikler ?? []).map((e, i) => (
            <li key={`${e.alan}-${i}`}>
              <button className={stil.eksikTus} type="button" data-ilk-odak={i === 0 ? "" : undefined} onClick={() => git(e)}>
                <Ikon ad="circle-alert" kucuk /><span>{e.ad}</span>
              </button>
            </li>
          ))}
        </ul>
      </Pencere>
    </>
  );
}

/** 472: örnek raporun fotoğrafı — dosya seçilmez, yüklenmez; "Fotoğraf ekle" yalnız sayar (zorunlu fotoğraf kuralı denensin) */
function DenemeFoto({ adet, gecersiz, ekle, cikar }: { adet: number; gecersiz: boolean; ekle: () => void; cikar: () => void }) {
  return (
    <div className={stil.tabloAlt}>
      <span className={gecersiz ? stil.hataMetin : stil.ipucuMetin}>{adet ? `${adet} örnek fotoğraf` : "Fotoğraf yok"} · örnek raporda dosya yüklenmez</span>
      <Tus tur="ikincil" ikon="camera" onClick={ekle}>Fotoğraf ekle</Tus>
      {adet > 0 && <Tus tur="ikincil" ikon="x" onClick={cikar}>Fotoğrafı çıkar</Tus>}
    </div>
  );
}
