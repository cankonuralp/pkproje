"use client";
/* FİRMA AYARLARI (334; 544 — maket 539 firma-ayarlari-yeni.html + maket-ayarlar-yeni.js, reisim 2026-10-14: "bu ekranı komple toparla tıklayınca
   pop-up olarak açılarak seçimler yapılabilen küçük paneller haline çevir", "raporların ikinci kopyası değil yedek olarak görülmeli çok fazla yazı var",
   "açık kapalıyı seçince ekran komple kayıyo" → "maketleri falan da onaylıyorum"). Ekran: konusuna göre altı grupta KÜÇÜK PANELLER — ad, şu anki
   değerin tek satırlık özeti, gerekiyorsa rozet. Panele basınca PENCERE açılır; seçim orada, Kaydet / Vazgeç altta (kaydedilince pencere kapanır,
   panelin özeti değişir). Kayma yok: sayfa yerinde; pencerede seçim alan açıp kapatmaz (kapalıyken alanlar soluk, yerinde), uyarı satırı hep
   yerinde. Yazı az: en çok bir kısa satır, uzun anlatım "Nasıl …?" başlığının altında. "Raporların ikinci kopyası" → Yedek penceresinde "Ek yedek";
   "Supabase hesabı ve yedek" → Depolama + Yedek. Kaydedilmemiş değişiklikle kapatınca sorulur; geçersiz değer kaydedilmez, alanın altında söylenir,
   pencere açık kalır. Dosyalar (logo, ön bilgilendirme formu, bordro formatı) seçilince hemen yüklenir; kaldırmak önce sorulur. "Gör" düzeyinde
   pencereler salt okunur. Karar ve doğrulama sunucuda (server/ayarlar.ts). */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId, Segment } from "../../../components/form/Form";
import { DosyaAcTusu, GizliResim } from "../../../components/gizli-resim/GizliResim";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere } from "../../../components/pencere/Pencere";
import { KartEtiket, Liste, type Sutun } from "../../../components/liste/Liste";
import { DegerYok, Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import {
  AYAR_DOSYASI, BULUT_DUZEN, ESIK, IMZA_YONTEM, NUSHA, SAKLAMA_YIL, YASAL, kodBuyut, onBilgiFormKodu,
  type AyarDosyasi, type AyarKesimi, type EsikAdi,
} from "../sema";
import type { FirmaAyarlari as Veri } from "../server/ayarlar";
import { IceAktarma } from "./IceAktarma";
import { ayarDosyasiEylemi, ayarKaydetEylemi, belgeTuruEkleEylemi, belgeTuruKaldirEylemi, bulutBaglaEylemi, bulutKesEylemi, denemeEpostasiEylemi,
  firmaKoduKaydetEylemi, simdiYedekleEylemi, type AyarYaniti } from "./eylemler";
import stil from "./firma-ayarlari.module.css";

const ID = {
  ad: "w-ay-ad", adres: "w-ay-adres", eposta: "w-ay-eposta", tel: "w-ay-tel", akr: "w-ay-akr", nusha: "w-ay-nusha", zeden: "w-ay-zeden", yil: "w-ay-yil",
  normal: "w-ay-normal", bas: "w-ay-bas", mesai: "w-ay-mesai", yillik: "w-ay-yillik", kod: "w-ay-kod",
} as const;
const para = (k: number) => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(k / 100);
const megabayt = (bayt: number) => (bayt / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 1 });

/* ── PANELLER (maket 539 GRUPLAR / PANEL) ── */
type PanelAdi = "firma" | "kod" | "imza" | "belge" | "mesai" | "esik" | "zimmet" | "mbelge" | "fiyat" | "sabit" | "yedek" | "depolama" | "saklama" | "eposta" | "ice";
const PANEL: Record<PanelAdi, { ad: string; ikon: string; genis?: boolean }> = {
  firma: { ad: "Firma bilgileri", ikon: "building-2" }, kod: { ad: "Rapor numarası", ikon: "list-ordered" }, imza: { ad: "İmza yöntemi", ikon: "file-signature" },
  belge: { ad: "Belge şablonları", ikon: "file-text" }, mesai: { ad: "Mesai takibi", ikon: "clock" }, esik: { ad: "Uyarı eşikleri", ikon: "alarm-clock" },
  zimmet: { ad: "Zimmet teslim formu", ikon: "package" }, mbelge: { ad: "Müşteriye açık personel belgeleri", ikon: "id-card", genis: true },
  fiyat: { ad: "Fiyat listesi", ikon: "calculator", genis: true }, sabit: { ad: "Sabit giderler", ikon: "receipt", genis: true },
  yedek: { ad: "Yedek", ikon: "archive" }, depolama: { ad: "Depolama", ikon: "warehouse" }, saklama: { ad: "Rapor saklama süresi", ikon: "history" },
  eposta: { ad: "E-posta", ikon: "mail", genis: true }, ice: { ad: "Toplu içe aktarma", ikon: "file-spreadsheet", genis: true },
};
const GRUPLAR: { k: string; ad: string; p: PanelAdi[] }[] = [
  { k: "firma", ad: "Firma", p: ["firma", "kod", "imza", "belge"] },
  { k: "calisma", ad: "Çalışma", p: ["mesai", "esik", "zimmet", "mbelge"] },
  { k: "para", ad: "Fiyat ve gider", p: ["fiyat", "sabit"] },
  { k: "veri", ad: "Veri ve yedek", p: ["yedek", "depolama", "saklama"] },
  { k: "baglanti", ad: "Bağlantılar", p: ["eposta"] },   // 2026-10-25: yapay zekâ Yönetim'de (göç 0106)
  { k: "arac", ad: "Araçlar", p: ["ice"] },
];
const BULUT_AD = { "": "kapalı", gdrive: "Google Drive", onedrive: "OneDrive" } as const;
/** panelin tek satırlık özeti ve (gerekiyorsa) rozeti — kayıtlı değerden */
function ozet(k: PanelAdi, v: Veri): { metin: string; durum?: string } {
  switch (k) {
    case "firma": return { metin: `${v.firma.deger.ad || v.firma.kayitAd} · ${v.firma.deger.nusha} nüsha · logo ${v.dosyalar.logo ? "var" : "yok"}`,
      durum: !v.firma.deger.adres.trim() || !v.firma.deger.eposta.trim() ? "Eksik" : undefined };
    case "kod": return { metin: `${v.kod}-AAYY-SIRA (ör. ${v.kod}-2610-0001)` };
    case "imza": return { metin: `${IMZA_YONTEM[v.imza.deger.yontem][0]} · ${v.imza.deger.teknik ? "önce teknik yönetici imzalar" : IMZA_YONTEM[v.imza.deger.yontem][1]}` };
    case "belge": return { metin: `Ön bilgilendirme: ${v.dosyalar.on_bilgi ? "firma formatı" : "temel format"} · bordro: ${v.dosyalar.bordro_format ? "var" : "yok"}` };
    case "mesai": { const m = v.mesai.deger; return { metin: `${m.acik ? `Açık · ${m.normal_dk} + ${m.mesai_dk} dk / gün` : "Kapalı"} · başlangıç ${m.baslangic}` }; }
    case "esik": { const e = v.esik.deger; return { metin: `Kalibrasyon ${e.kalibrasyon} · tesis ${e.kontrolu_yaklasan_tesis} · eğitim ${e.egitim} gün` }; }
    case "zimmet": return { metin: `Teslim eden: ${v.kisiler.find((x) => x.id === v.zimmet.deger.teslim_eden)?.ad ?? "seçilmedi"}` };
    case "mbelge": { const n = v.mbelge.deger.secili.length; return { metin: n ? `${n} belge türü müşteriye açık` : "Hiçbiri açık değil" }; }
    case "fiyat": { const bos = v.fiyat.turler.filter((t) => t.fiyat === null).length;
      return { metin: `${v.fiyat.turler.length} ekipman türü${bos ? ` · ${bos} fiyatsız` : ""}`, durum: bos ? "Fiyatsız tür var" : undefined }; }
    case "sabit": return { metin: `${v.sabit.deger.kalemler.length} kalem · aylık ${para(v.sabit.deger.kalemler.reduce((n, x) => n + x.aylik, 0))} TL` };
    case "yedek": { const b = v.ekYedek.baglanti;
      if (b && (b.durum === "kopuk" || b.durum === "dolu")) return { metin: `Ek yedek: ${BULUT_AD[b.saglayici]} · gönderilemiyor`, durum: "Gönderilemiyor" };
      if (b?.durum === "bagli") return { metin: `Ek yedek: ${BULUT_AD[b.saglayici]} · ${v.ekYedek.kuyruk.gonderildi.toLocaleString("tr-TR")} dosya` };
      return { metin: `Aylık arşiv ${v.ekYedek.arsiv.tamYil ? "var" : "henüz yok"} · ek yedek bağlı değil`, durum: "Bağlı değil" }; }
    case "depolama": return { metin: `Deneme projesi · ${v.depolama.dosya.toLocaleString("tr-TR")} dosya · ${megabayt(v.depolama.bayt)} MB` };
    case "saklama": return { metin: `${v.saklama.deger.yil} yıl${v.saklama.deger.yil === 5 ? " (yasal en az)" : ""}` };
    case "eposta": { const g = v.eposta.gonderim, hazir = !!g && g.dogrulandi && g.anahtar;
      return { metin: hazir ? `Bağlı · ${g.alan}` : g ? `${g.alan} · doğrulanmadı` : "E-postalar sırada bekliyor", durum: hazir ? undefined : "Bağlı değil" }; }
    case "ice": return { metin: "Excel'den müşteri, ekipman, cihaz, personel, araç" };
  }
}

/* ── pencere + taslak (Z1) ── */
const PanelBag = createContext<{ ad: string; kapat: () => void }>({ ad: "", kapat: () => undefined });

/** panelin penceresi: Kaydet / Vazgeç altta (salt okunur ya da yalnız bilgi: Kapat); kaydedilmemiş değişiklikle kapatınca sorulur */
function Kart({ genis = false, kirli = false, mesgul = false, kaydet, yaz, children }: {
  genis?: boolean; kirli?: boolean; mesgul?: boolean; kaydet?: () => void; yaz: boolean; children: ReactNode;
}) {
  const { ad, kapat } = useContext(PanelBag);
  const onayla = useOnayla();
  const kapatSor = async () => {
    if (kirli && yaz && !(await onayla({ baslik: "Değişiklikler kaydedilmedi", metin: "Kapatırsanız bu penceredeki değişiklikler silinir.", tus: "Kapat" }))) return;
    kapat();
  };
  const alt = yaz && kaydet
    ? <><Tus tur="ikincil" disabled={mesgul} onClick={() => void kapatSor()}>Vazgeç</Tus><Tus ikon="check" disabled={mesgul} aria-busy={mesgul || undefined} onClick={kaydet}>Kaydet</Tus></>
    : <Tus tur="ikincil" onClick={kapat}>Kapat</Tus>;
  return (
    <Pencere acik baslik={ad} onKapat={() => void kapatSor()} genis={genis} alt={alt}
      odak={'input:not([disabled]):not([type="file"]):not([type="hidden"]), [role="radio"][aria-checked="true"]:not([disabled]), summary'}>
      <div className={stil.pencere}>{children}</div>
    </Pencere>
  );
}

/** uzlastir: sunucu değeri değişince taslak kirliyse (kaydedilmemiş değişiklik) tümüyle atılmaz, yeni değerle uzlaştırılır. Kaydedilince pencere kapanır */
function useKesim<T>(kesim: AyarKesimi, ilk: T, surum: number, gonder?: (d: T) => Promise<AyarYaniti>, uzlastir?: (taslak: T) => T) {
  const { ad, kapat } = useContext(PanelBag);
  const router = useRouter();
  const bildir = useBildir();
  const [mesgul, baslat] = useTransition();
  const [d, setD] = useState<T>(ilk);
  const [h, setH] = useState<Record<string, string>>({});
  /* sunucudaki değer değişince (dosya yüklendi, başka biri kaydetti) taslak ona eşitlenir */
  const ilkJson = JSON.stringify(ilk);
  const [son, setSon] = useState(ilkJson);
  if (son !== ilkJson) { setSon(ilkJson); setD(uzlastir && JSON.stringify(d) !== son ? uzlastir(d) : ilk); setH({}); }
  const kirli = JSON.stringify(d) !== ilkJson;
  const kaydet = () => baslat(async () => {
    const r = await (gonder ? gonder(d) : ayarKaydetEylemi(kesim, surum, d));
    if (!r.tamam) {
      setH(r.hatalar ?? {});
      bildir(r.genel ?? `${ad}: kaydedilmedi; nedeni alanın altında.`);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('dialog[open] [aria-invalid="true"]')?.focus());
      return;
    }
    setH({});
    bildir(r.bildirim ?? `${ad} kaydedildi.`); router.refresh();
    kapat();
  });
  return { d, setD, h, setH, kirli, mesgul, kaydet };
}

const Not = ({ children }: { children: ReactNode }) => <p className={stil.not}>{children}</p>;
const Yardim = ({ baslik, children }: { baslik: string; children: ReactNode }) => (
  <details className={stil.yardim}><summary><Ikon ad="info" kucuk />{baslik}</summary>{children}</details>
);

/* ── dosya ayarı (logo, ön bilgilendirme formu, bordro formatı): seçilince yüklenir ── */
function DosyaAyari({ ne, dosya, surum, yaz, bos, kaldirSonu, resim = false }: {
  ne: AyarDosyasi; dosya: { id: string; ad: string } | null; surum: number; yaz: boolean; bos: string; kaldirSonu: string; resim?: boolean;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [mesgul, baslat] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const secici = useRef<HTMLInputElement>(null);
  const t = AYAR_DOSYASI[ne];
  const gonder = (f: File | null) => baslat(async () => {
    const v = new FormData(); v.set("ne", ne); v.set("surum", String(surum)); if (f) v.set("dosya", f);
    const r = await ayarDosyasiEylemi(v);
    if (!r.tamam) { setHata(r.hatalar?.dosya ?? r.genel ?? "Kaydedilemedi."); return; }
    setHata(null); bildir(r.bildirim ?? "Kaydedildi."); router.refresh();
    /* kaldırınca Kaldır tuşu gider: odak yükleme tuşuna (maket — odak gövdeye düşmez) */
    if (!f) requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-dosya-yukle="${ne}"]`)?.focus());
  });
  const kaldir = async () => {
    if (await onayla({ baslik: `${t.ad} kaldırılsın mı?`, metin: dosya ? `${dosya.ad} kaldırılır; ${kaldirSonu}` : kaldirSonu, tus: "Kaldır", tehlike: true })) gonder(null);
  };
  const kabul = t.turler.map((x) => (x === "pdf" ? "application/pdf" : x === "xlsx" ? ".xlsx" : `image/${x}`)).join(",");
  return (
    <div className={stil.dosya}>
      <div className={stil.dosyaSatir}>
        {dosya ? <>
          {resim && <GizliResim dosyaId={dosya.id} alt="Firma logosu" className={stil.logo} />}
          <DosyaAcTusu dosyaId={dosya.id} ikon="file-text" etiket={`${t.ad}: ${dosya.ad}`}>{dosya.ad}</DosyaAcTusu>
        </> : <span className={stil.degerYok}>{bos}</span>}
        {yaz && <>
          <input ref={secici} type="file" accept={kabul} hidden aria-hidden="true" tabIndex={-1}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) gonder(f); }} />
          <Tus tur="ikincil" ikon="upload" disabled={mesgul} aria-busy={mesgul || undefined} data-dosya-yukle={ne} onClick={() => secici.current?.click()}>{dosya ? "Değiştir" : `${t.ad === "Firma logosu" ? "Logo" : t.ad} yükle`}</Tus>
          {dosya && <Tus tur="ikincil" ikon="x" disabled={mesgul} onClick={kaldir} aria-label={`${t.ad} kaldır`}>Kaldır</Tus>}
        </>}
      </div>
      {hata && <p className={stil.hata} role="alert">{hata}</p>}
    </div>
  );
}

/* ── PENCERELER ── */
function FirmaBilgileri({ v }: { v: Veri }) {
  const s = useKesim("firma", { ...v.firma.deger, nusha: String(v.firma.deger.nusha) }, v.firma.surum);
  const g = (k: "ad" | "adres" | "eposta" | "tel" | "akr", id: string, etiket: string, en: number, ek: { uyari?: string; genis?: boolean; tur?: string } = {}) => (
    <Alan id={id} etiket={etiket} hata={s.h[k]} genis={ek.genis} uyari={!s.h[k] && !s.d[k].trim() ? ek.uyari : undefined}>
      <Girdi id={id} value={s.d[k]} maxLength={en} disabled={!v.yaz} hata={!!s.h[k]} mesajli={!!s.h[k] || (!s.d[k].trim() && !!ek.uyari)} type={ek.tur}
        inputMode={ek.tur === "email" ? "email" : ek.tur === "tel" ? "tel" : undefined} onChange={(e) => s.setD({ ...s.d, [k]: e.target.value })} />
    </Alan>
  );
  return (
    <Kart yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet}>
      <Not>Rapor başlığında ve belgelerde görünür.</Not>
      <FormIzgara>
        {g("ad", ID.ad, "Ticari ad", 120, { genis: true, uyari: `Boş: kayıttaki ad çıkar (${v.firma.kayitAd}).` })}
        {g("adres", ID.adres, "Adres", 200, { genis: true, uyari: "Boş: raporda adres çıkmaz." })}
        {g("eposta", ID.eposta, "Rapor e-postası", 120, { tur: "email", uyari: "Boş: raporda e-posta çıkmaz." })}
        {g("tel", ID.tel, "Telefon", 30, { tur: "tel" })}
        {g("akr", ID.akr, "Akreditasyon no", 20)}
        <Alan id={ID.nusha} etiket="Rapor nüsha sayısı" hata={s.h.nusha}>
          <SecimAlani id={ID.nusha} ad="Rapor nüsha sayısı" deger={s.d.nusha} kapali={!v.yaz} gecersiz={!!s.h.nusha} tanim={s.h.nusha ? ipucuId(ID.nusha) : undefined} secenekler={NUSHA.map((n) => [String(n), `${n} nüsha`] as const)}
            degistir={(x) => s.setD({ ...s.d, nusha: x })} />
        </Alan>
      </FormIzgara>
      <p className={stil.etiketUst}>Logo</p>
      <DosyaAyari ne="logo" dosya={v.dosyalar.logo} surum={v.dosyalar.surum.firma} yaz={v.yaz} resim bos="Logo yok (PNG ya da JPEG, en çok 2 MB)."
        kaldirSonu="raporların ve belgelerin başlığında logo yerinde boş kutu çıkar." />
    </Kart>
  );
}

function ImzaYontemi({ v }: { v: Veri }) {
  const s = useKesim("imza", v.imza.deger, v.imza.surum);
  return (
    <Kart yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet}>
      <div role="radiogroup" aria-label="İmza yöntemi" className={stil.secenekler}>
        {(Object.keys(IMZA_YONTEM) as (keyof typeof IMZA_YONTEM)[]).map((k) => (
          <label key={k} className={stil.secenek}>
            <input type="radio" name="w-ay-imza" value={k} checked={s.d.yontem === k} disabled={!v.yaz} onChange={() => s.setD({ ...s.d, yontem: k })} />
            <span><b>{IMZA_YONTEM[k][0]}</b><span className={stil.altSatir}>{IMZA_YONTEM[k][1]}</span></span>
          </label>
        ))}
      </div>
      {/* 2026-10-17 (göç 0102): açıkken onaydaki raporu teknik yönetici imzalayarak onaylar, sonra muayene uzmanı imzalar; kapalıyken bugünkü akış */}
      <label className={stil.secenek}>
        <input type="checkbox" checked={s.d.teknik} disabled={!v.yaz} onChange={(e) => s.setD({ ...s.d, teknik: e.target.checked })} />
        <span><b>Teknik yönetici raporu imzalasın</b></span>
      </label>
    </Kart>
  );
}

function BelgeSablonlari({ v }: { v: Veri }) {
  return (
    <Kart yaz={false}>
      <p className={stil.etiketUst}>Ön bilgilendirme formu</p>
      <DosyaAyari ne="on_bilgi" dosya={v.dosyalar.on_bilgi} surum={v.dosyalar.surum.sablon} yaz={v.yaz} bos={`Temel format (${onBilgiFormKodu(v.kod)})`}
        kaldirSonu={`müşterilere temel format (${onBilgiFormKodu(v.kod)}) gider.`} />
      <p className={stil.etiketUst}>Bordro formatı</p>
      <DosyaAyari ne="bordro_format" dosya={v.dosyalar.bordro_format} surum={v.dosyalar.surum.sablon} yaz={v.yaz} bos="Yok — bordrolar kişi kişi yüklenir"
        kaldirSonu="bordrolar kişi kişi elle yüklenir." />
    </Kart>
  );
}

function ZimmetFormu({ v }: { v: Veri }) {
  const s = useKesim("zimmet", { teslim_eden: v.zimmet.deger.teslim_eden ?? "" }, v.zimmet.surum);
  return (
    <Kart yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet}>
      <Alan id={ID.zeden} etiket="Teslim eden (başlangıç)" hata={s.h.teslim_eden} sonuc={s.h.teslim_eden ? undefined : "Formda değiştirilebilir."}>
        <SecimAlani id={ID.zeden} ad="Teslim eden (başlangıç)" deger={s.d.teslim_eden} kapali={!v.yaz} tanim={ipucuId(ID.zeden)} gecersiz={!!s.h.teslim_eden}
          secenekler={[["", "Seçilmedi"], ...v.kisiler.map((k) => [k.id, k.ad] as const)]} degistir={(x) => s.setD({ teslim_eden: x })} />
      </Alan>
    </Kart>
  );
}

function Saklama({ v }: { v: Veri }) {
  const s = useKesim("saklama", { yil: String(v.saklama.deger.yil) }, v.saklama.surum);
  return (
    <Kart yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet}>
      {/* 2026-11-04 (göç 0118): Drive bağlıyken 1 yıldan eski raporların dosyaları Drive'a taşınır; süre ekipmanın en son raporuna işler, Drive'a dokunmaz */}
      <Alan id={ID.yil} etiket="Saklama süresi" hata={s.h.yil} sonuc={s.h.yil ? undefined : v.ekYedek.baglanti?.durum === "bagli"
        ? "1 yıldan eski raporların PDF'leri Drive'a taşınır. Süre dolunca probata'daki imzalı raporlar silinir; Drive'dakiler kalır."
        : "Süre dolunca imzalı raporlar silinir."}>
        <SecimAlani id={ID.yil} ad="Saklama süresi" deger={s.d.yil} kapali={!v.yaz} gecersiz={!!s.h.yil} tanim={ipucuId(ID.yil)}
          secenekler={SAKLAMA_YIL.map((y) => [String(y), `${y} yıl${y === 5 ? " (yasal en az)" : ""}`] as const)} degistir={(x) => s.setD({ yil: x })} />
      </Alan>
      {/* 387: silinecekler listesi yalnız firma yöneticisine (Firma ayarları "yaz") */}
      {v.yaz && <p className={stil.not}><Link href="/firma-ayarlari/saklama">Saklama süresi dolacak raporlar</Link></p>}
    </Kart>
  );
}

function Mesai({ v }: { v: Veri }) {
  const m = v.mesai.deger;
  const s = useKesim("mesai", { acik: m.acik, normal_dk: String(m.normal_dk), mesai_dk: String(m.mesai_dk), yillik_fazla_saat: String(m.yillik_fazla_saat), baslangic: m.baslangic }, v.mesai.surum);
  const kapali = !s.d.acik, toplam = (Number(s.d.normal_dk) || 0) + (Number(s.d.mesai_dk) || 0), asti = !kapali && toplam > YASAL.gunlukDk;
  const sayi = (k: "normal_dk" | "mesai_dk" | "yillik_fazla_saat", id: string, etiket: string) => (
    <Alan id={id} etiket={etiket} hata={s.h[k]}>
      <Girdi id={id} value={s.d[k]} inputMode="numeric" maxLength={4} disabled={!v.yaz || kapali} hata={!!s.h[k]} mesajli={!!s.h[k]}
        onChange={(e) => s.setD({ ...s.d, [k]: e.target.value })} />
    </Alan>
  );
  return (
    <Kart yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet}>
      <Segment ad="Mesai takibi" deger={s.d.acik ? "1" : "0"} kapali={!v.yaz} secenekler={[["0", "Kapalı"], ["1", "Açık"]] as const}
        degistir={(x) => s.setD({ ...s.d, acik: x === "1" })} />
      <FormIzgara>
        <Alan id={ID.bas} etiket="Mesai başlangıcı" hata={s.h.baslangic}>
          <Girdi id={ID.bas} value={s.d.baslangic} inputMode="numeric" maxLength={5} placeholder="09:00" disabled={!v.yaz} hata={!!s.h.baslangic}
            mesajli={!!s.h.baslangic} onChange={(e) => s.setD({ ...s.d, baslangic: e.target.value })} />
        </Alan>
        {sayi("normal_dk", ID.normal, "Günlük normal (dk)")}
        {sayi("mesai_dk", ID.mesai, "Günlük mesai (dk)")}
        {sayi("yillik_fazla_saat", ID.yillik, "Yıllık fazla çalışma (saat)")}
      </FormIzgara>
      {/* durum satırı hep yerinde (kayma yok): aşınca metni değişir */}
      <p className={asti ? `${stil.durumSatir} ${stil.uyariSatir}` : stil.durumSatir} aria-live="polite">
        {asti ? <><Ikon ad="triangle-alert" kucuk />Günlük toplam {toplam} dk: kanunda en çok {YASAL.gunlukDk}.</>
          : `Günlük toplam ${toplam} dk (kanunda en çok ${YASAL.gunlukDk}).`}
      </p>
    </Kart>
  );
}

function Esikler({ v }: { v: Veri }) {
  const ilk = Object.fromEntries((Object.keys(ESIK) as EsikAdi[]).map((k) => [k, String(v.esik.deger[k])])) as Record<EsikAdi, string>;
  const s = useKesim("esik", ilk, v.esik.surum);
  return (
    <Kart yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet}>
      <Not>Kaç gün kala uyarılsın.</Not>
      <FormIzgara>
        {(Object.keys(ESIK) as EsikAdi[]).map((k) => {
          const [ad, , , sec] = ESIK[k], id = `w-ay-esik-${k}`;
          return (
            <Alan key={k} id={id} etiket={ad} hata={s.h[k]}>
              <SecimAlani id={id} ad={ad} deger={s.d[k]} kapali={!v.yaz} tanim={s.h[k] ? ipucuId(id) : undefined} gecersiz={!!s.h[k]} secenekler={sec.map((g) => [String(g), `${g} gün`] as const)}
                degistir={(x) => s.setD({ ...s.d, [k]: x })} />
            </Alan>
          );
        })}
      </FormIzgara>
    </Kart>
  );
}

function RaporNumarasi({ v }: { v: Veri }) {
  const s = useKesim("kod", { kod: v.kod }, 0, (d) => firmaKoduKaydetEylemi({ kod: d.kod, gorulen: v.kod }));
  return (
    <Kart yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet}>
      <Alan id={ID.kod} etiket="Firma kodu" hata={s.h.kod ?? s.h.gorulen} sonuc={s.h.kod ? undefined : `Yeni rapor: ${/^[A-Z]{2}$/.test(kodBuyut(s.d.kod)) ? kodBuyut(s.d.kod) : v.kod}-2610-0001`}>
        <Girdi id={ID.kod} value={s.d.kod} maxLength={2} autoCapitalize="characters" disabled={!v.yaz} hata={!!(s.h.kod ?? s.h.gorulen)} mesajli className={stil.kod}
          onChange={(e) => s.setD({ kod: e.target.value.toUpperCase() })} />
      </Alan>
    </Kart>
  );
}

function SabitGiderler({ v }: { v: Veri }) {
  const s = useKesim("sabit", { kalemler: v.sabit.deger.kalemler.map((x) => ({ ad: x.ad, aylik: para(x.aylik), not: x.not })) }, v.sabit.surum);
  const l = s.d.kalemler;
  const yaz = (i: number, k: "ad" | "aylik" | "not", x: string) => s.setD({ kalemler: l.map((y, j) => (j === i ? { ...y, [k]: x } : y)) });
  const toplam = v.sabit.deger.kalemler.reduce((n, x) => n + x.aylik, 0);
  return (
    <Kart genis yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet}>
      <Not>Aylık. Kayıtlı toplam {para(toplam)} TL.</Not>
      {l.map((x, i) => (
        <div key={i} className={stil.kalem}>
          <Alan id={`w-ay-sg-ad-${i}`} etiket="Gider" hata={s.h[`kalemler.${i}.ad`]}>
            <Girdi id={`w-ay-sg-ad-${i}`} value={x.ad} maxLength={60} disabled={!v.yaz} hata={!!s.h[`kalemler.${i}.ad`]} mesajli={!!s.h[`kalemler.${i}.ad`]} onChange={(e) => yaz(i, "ad", e.target.value)} />
          </Alan>
          <Alan id={`w-ay-sg-tutar-${i}`} etiket="Aylık (TL)" hata={s.h[`kalemler.${i}.aylik`]}>
            <Girdi id={`w-ay-sg-tutar-${i}`} value={x.aylik} inputMode="decimal" maxLength={16} disabled={!v.yaz} hata={!!s.h[`kalemler.${i}.aylik`]} mesajli={!!s.h[`kalemler.${i}.aylik`]}
              onChange={(e) => yaz(i, "aylik", e.target.value)} />
          </Alan>
          <Alan id={`w-ay-sg-not-${i}`} etiket="Not" hata={s.h[`kalemler.${i}.not`]}>
            <Girdi id={`w-ay-sg-not-${i}`} value={x.not} maxLength={80} disabled={!v.yaz} onChange={(e) => yaz(i, "not", e.target.value)} />
          </Alan>
          {v.yaz && <Tus tur="ikincil" ikon="x" className={stil.kalemSil} aria-label={`${x.ad || "Adsız gider"} kaldır`}
            onClick={() => { s.setD({ kalemler: l.filter((_, j) => j !== i) }); s.setH({}); }}>Kaldır</Tus>}
        </div>
      ))}
      {v.yaz && l.length < 30 && <div className={stil.tuslar}>
        <Tus tur="ikincil" ikon="plus" onClick={() => { s.setD({ kalemler: [...l, { ad: "", aylik: "0,00", not: "" }] });
          requestAnimationFrame(() => document.getElementById(`w-ay-sg-ad-${l.length}`)?.focus()); }}>Gider ekle</Tus>
      </div>}
    </Kart>
  );
}

/* ── FİYAT LİSTESİ (335; maket "Fiyat listesi": tür başına KDV hariç birim fiyat) ── */
function FiyatListesi({ v }: { v: Veri }) {
  const ilk = { fiyatlar: Object.fromEntries(v.fiyat.turler.map((t) => [t.id, t.fiyat === null ? "" : para(t.fiyat)])) as Record<string, string> };
  const s = useKesim("fiyat", ilk, 0, (d) => ayarKaydetEylemi("fiyat", 0, { fiyatlar: d.fiyatlar, gorulen: ilk.fiyatlar }));
  return (
    <Kart genis yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet}>
      <Not>KDV hariç birim fiyat.</Not>
      {v.fiyat.turler.length ? <div className={stil.fiyatlar}>
        {v.fiyat.turler.map((t) => {
          const id = `w-ay-fiyat-${t.id}`;
          return (
            <Alan key={t.id} id={id} etiket={`${t.ad} (TL)`} hata={s.h[t.id]}>
              <Girdi id={id} value={s.d.fiyatlar[t.id] ?? ""} inputMode="decimal" maxLength={16} disabled={!v.yaz} hata={!!s.h[t.id]} mesajli={!!s.h[t.id]} placeholder="Fiyat yok"
                onChange={(e) => s.setD({ fiyatlar: { ...s.d.fiyatlar, [t.id]: e.target.value } })} />
            </Alan>
          );
        })}
      </div> : <p className={stil.not}>Ekipman türü yok.</p>}
    </Kart>
  );
}

/* ── MÜŞTERİYE AÇIK PERSONEL BELGELERİ (335; maket personelBelgeCiz, Z5 "Belge türü ekle") ── */
const BT = { ad: "w-ay-bt-ad", kisisel: "w-ay-bt-kisisel" } as const;
function MusteriBelgeleri({ v }: { v: Veri }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [mesgulTur, baslatTur] = useTransition();
  const s = useKesim("mbelge", { secili: [...v.mbelge.deger.secili].sort() }, v.mbelge.surum, undefined,
    (d) => ({ secili: d.secili.filter((k) => v.mbelge.turler.some((t) => t.k === k)) }));
  const [ekle, setEkle] = useState<null | { ad: string; kisisel: boolean; hata: string | null }>(null);
  const sec = new Set(s.d.secili);
  const hassas = v.mbelge.turler.filter((t) => t.kisisel && sec.has(t.k));
  const turEkle = () => baslatTur(async () => {
    if (!ekle) return;
    const r = await belgeTuruEkleEylemi({ ad: ekle.ad, kisisel: ekle.kisisel });
    if (!r.tamam) { setEkle({ ...ekle, hata: r.hatalar?.ad ?? r.genel ?? "Eklenemedi." }); requestAnimationFrame(() => document.getElementById(BT.ad)?.focus()); return; }
    setEkle(null); bildir(r.bildirim ?? "Eklendi."); router.refresh();
    requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-tur-ekle]")?.focus());
  });
  const turKaldir = async (k: string, ad: string, kullanim: number) => {
    /* kullanımdaki tür: sorulmadan söylenir (maket bt-kaldir) */
    if (kullanim > 0) { bildir(`${ad} kaldırılamaz: ${kullanim} personelde bu türde yüklü belge var.`); return; }
    if (!(await onayla({ baslik: "Belge türünü kaldır", metin: `${ad} listeden ve müşteriye açık belgelerden kalkar.`, tus: "Kaldır", tehlike: true }))) return;
    baslatTur(async () => {
      const r = await belgeTuruKaldirEylemi(k);
      bildir(r.tamam ? r.bildirim ?? "Kaldırıldı." : r.genel ?? "Kaldırılamadı.");
      if (r.tamam) {
        s.setD({ secili: s.d.secili.filter((x) => x !== k) });   // taslağın geri kalanı korunur
        router.refresh(); requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-tur-ekle]")?.focus());
      }
    });
  };
  return (
    <Kart genis yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet}>
      <Not>Müşteri panelinde, kontrolü yapan personelin hangi belgeleri görünsün.</Not>
      <fieldset className={stil.turler}>
        <legend className="gizli">Müşteriye açık belge türleri</legend>
        {v.mbelge.turler.map((t) => {
          const kutu = (
            <label className={stil.secenek}>
              <input type="checkbox" checked={sec.has(t.k)} disabled={!v.yaz}
                onChange={(e) => s.setD({ secili: (e.target.checked ? [...s.d.secili, t.k] : s.d.secili.filter((x) => x !== t.k)).sort() })} />
              <span>{t.ad}{(t.ek || t.kisisel) && <span className={stil.altSatir}>{[t.ek ? "firmanın eklediği" : "", t.kisisel ? "kişisel veri" : ""].filter(Boolean).join(" · ")}</span>}</span>
            </label>
          );
          return t.ek && v.yaz ? <div key={t.k} className={stil.ekSatir}>{kutu}
            <Tus tur="ikincil" ikon="x" disabled={mesgulTur} aria-label={`${t.ad} türünü kaldır`} onClick={() => turKaldir(t.k, t.ad, t.kullanim)}>Kaldır</Tus></div>
            : <div key={t.k}>{kutu}</div>;
        })}
      </fieldset>
      {s.h.secili && <p className={stil.hata} role="alert">{s.h.secili}</p>}
      {/* uyarı satırı hep yerinde (seçim değişince kayma yok) */}
      <p className={hassas.length ? `${stil.durumSatir} ${stil.uyariSatir}` : stil.durumSatir}>
        {hassas.length ? <><Ikon ad="triangle-alert" kucuk />Kişisel veri müşteriye açık: {hassas.map((t) => t.ad).join(", ")} (KVKK: açık rıza gerekebilir).</> : "Kişisel veri içeren belge açık değil."}
      </p>
      {v.yaz && (ekle ? <div className={stil.ekForm}>
        <FormIzgara>
          <Alan id={BT.ad} etiket="Yeni belge türü" genis hata={ekle.hata ?? undefined}>
            <Girdi id={BT.ad} value={ekle.ad} maxLength={60} hata={!!ekle.hata} mesajli={!!ekle.hata} onChange={(e) => setEkle({ ...ekle, ad: e.target.value, hata: null })} />
          </Alan>
        </FormIzgara>
        <label className={stil.secenek}><input id={BT.kisisel} type="checkbox" checked={ekle.kisisel} onChange={(e) => setEkle({ ...ekle, kisisel: e.target.checked })} /><span>Kişisel veri içerir (KVKK)</span></label>
        <div className={stil.tuslar}>
          <Tus tur="ikincil" disabled={mesgulTur} onClick={() => { setEkle(null); requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-tur-ekle]")?.focus()); }}>Vazgeç</Tus>
          <Tus ikon="check" disabled={mesgulTur} aria-busy={mesgulTur || undefined} onClick={turEkle}>Türü ekle</Tus>
        </div>
      </div> : <div className={stil.tuslar}>
        <Tus tur="ikincil" ikon="plus" data-tur-ekle="" onClick={() => { setEkle({ ad: "", kisisel: false, hata: null }); requestAnimationFrame(() => document.getElementById(BT.ad)?.focus()); }}>Belge türü ekle</Tus>
      </div>)}
    </Kart>
  );
}

/* ── YEDEK (544; maket 539 "Yedek" — reisim: "raporların ikinci kopyası değil yedek olarak görülmeli"). 2026-11-03 (reisim: "yapılsın firma ayarlardan
   kendi yedeğini otomatik alabiliyo olsun" → sunum maketi "Yedek penceresi", K1–K6): EK YEDEK firmanın kendi Google Drive / OneDrive hesabına —
   Bağla (izin ekranı hizmetin kendi sayfası), bağlıyken hesap / klasör / sayılar, Şimdi yedekle, Bağlantıyı kes; koptuysa / doluysa şerit ve Yeniden
   bağla. Bağlı değilken ana klasör ve düzen seçilir (bağlıyken değişmez). Günlük yedek = her gece yalnız yeni ve değişenler Drive'a; aylık arşiv
   probata'nın deposunda (Drive bağlı olsun olmasın). İzin ekranından dönüş ?yedek=<sonuç> ile bu pencereyi açar (YedekSonucBag). ── */
const BID = { d: "w-ay-bulut-d", kok: "w-ay-bulut-kok" } as const;
const HIZMET_AD = { gdrive: "Google Drive", onedrive: "OneDrive" } as const;
const YEDEK_SONUC: Record<string, [tur: "onay" | "uyari" | "hata", metin: string]> = {
  bagli: ["onay", "Hesap bağlandı; ilk kopya başladı."],
  iptal: ["uyari", "Bağlantı yapılmadı: izin verilmedi."],
  suresi: ["uyari", "İzin ekranının süresi doldu; yeniden bağlayın."],
  baskasi: ["hata", "Bağlantıyı başka bir oturum başlatmış; yeniden bağlayın."],
  hizmet: ["hata", "Hizmet yanıt vermedi; biraz sonra yeniden deneyin."],
  izin: ["hata", "Kalıcı izin verilmedi; izin ekranında kutuları işaretleyip yeniden bağlayın."],
  oturum: ["uyari", "Oturumunuz kapanmıştı; yeniden bağlayın."],
  yetki: ["hata", "Bu işlem için yetkiniz yok."],
};
const YedekSonucBag = createContext<string | null>(null);
const zaman = (iso: string | null) => (iso ? new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null);

function Yedek({ v }: { v: Veri }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const sonuc = useContext(YedekSonucBag);
  const [mesgul, baslat] = useTransition();
  const b = v.ekYedek.baglanti, k = v.ekYedek.kuyruk, ar = v.ekYedek.arsiv;
  const bagli = !!b && (b.durum === "bagli" || b.durum === "dolu"), sorun = !!b && (b.durum === "kopuk" || b.durum === "dolu");
  /* 2026-11-04 (reisim: "microsoftu iptal et sadece google drive yedekleme yeterli"): seçenekte yalnız anahtarı girilmiş hizmet (ve bağlı olan);
     hiçbiri yoksa Google Drive. Tek hizmet varsa seçim gösterilmez. */
  const hizmetler = (["gdrive", "onedrive"] as const).filter((x) => v.ekYedek.hazir[x] || b?.saglayici === x);
  const liste: readonly ("gdrive" | "onedrive")[] = hizmetler.length ? hizmetler : ["gdrive"];
  const kayitli = v.bulut.deger.saglayici || b?.saglayici || liste[0]!;
  const [d, setD] = useState({ saglayici: (liste.includes(kayitli) ? kayitli : liste[0]!) as "gdrive" | "onedrive", kok: v.bulut.deger.kok, duzen: v.bulut.deger.duzen });
  const [h, setH] = useState<Record<string, string>>({});
  const secili = bagli && b ? b.saglayici : b?.durum === "kopuk" ? b.saglayici : d.saglayici;
  const hz = HIZMET_AD[secili], hazir = v.ekYedek.hazir[secili];
  const sonGonderim = zaman([b?.sonKopya, b?.ayGonderim].filter((x): x is string => !!x).sort().at(-1) ?? null);
  const bagla = () => baslat(async () => {
    const r = await bulutBaglaEylemi(v.bulut.surum, { ...d, saglayici: secili });
    if (!r.tamam || !r.adres) { setH(r.hatalar ?? {}); bildir(r.genel ?? "Bağlanmadı; nedeni alanın altında."); return; }
    window.location.assign(r.adres);
  });
  const kes = async () => {
    if (!b || !(await onayla({ baslik: "Bağlantı kesilsin mi?", metin: `${HIZMET_AD[b.saglayici]} hesabına yeni dosya gönderilmez; gönderilmiş dosyalar hesapta kalır.`,
      tus: "Bağlantıyı kes", tehlike: true }))) return;
    baslat(async () => { const r = await bulutKesEylemi(); bildir(r.tamam ? r.bildirim ?? "Bağlantı kesildi." : r.genel ?? "Kesilmedi."); router.refresh(); });
  };
  const simdi = () => baslat(async () => { const r = await simdiYedekleEylemi(); bildir(r.tamam ? r.bildirim ?? "Yedekleme başladı." : r.genel ?? "Başlamadı."); router.refresh(); });
  const satir = (tur: "var" | "yok" | "kopuk", ad: string, alt: string) => (
    <li className={tur === "var" ? undefined : tur === "yok" ? stil.yok : stil.kopuk} data-yedek={tur}>
      <Ikon ad={tur === "var" ? "circle-check" : tur === "yok" ? "triangle-alert" : "circle-x"} kucuk /><span><b>{ad}</b><span className={stil.altSatir}>{alt}</span></span>
    </li>
  );
  const s = sonuc ? YEDEK_SONUC[sonuc] : undefined;
  const sayi = (n: number) => n.toLocaleString("tr-TR");
  return (
    <Kart yaz={false}>
      {s && <Serit tur={s[0]}>{s[1]}</Serit>}
      <ul className={stil.durumlar}>
        {b?.durum === "bagli" ? satir("var", "Günlük yedek", `Her gece ${hz}'a${sonGonderim ? ` · son: ${sonGonderim}` : ""}`)
          : sorun ? satir("kopuk", "Günlük yedek", "Gönderilemiyor.") : satir("yok", "Günlük yedek", "Henüz yok.")}
        {ar.sonAy ? satir("var", "Aylık arşiv yedeği", `Her ayın 1'i · son: ${ar.sonAy}`)
          : ar.tamYil ? satir("var", "Aylık arşiv yedeği", `Tam kopya: ${ar.tamYil} · ilk aylık dosya ay sonunda`) : satir("yok", "Aylık arşiv yedeği", "Henüz yok.")}
        {!b || b.durum === "kesildi" ? satir("yok", "Ek yedek", "Bağlı değil.")
          : b.durum === "dolu" ? satir("kopuk", "Ek yedek", `${HIZMET_AD[b.saglayici]} dolu · ${sayi(k.bekliyor)} dosya bekliyor`)
          : b.durum === "kopuk" ? satir("kopuk", "Ek yedek", `${HIZMET_AD[b.saglayici]} bağlantısı koptu · ${sayi(k.bekliyor)} dosya bekliyor`)
          : satir("var", "Ek yedek", k.bekliyor > 0 ? `${HIZMET_AD[b.saglayici]} · ${sayi(k.bekliyor)} dosya sırada` : `${HIZMET_AD[b.saglayici]} bağlı`)}
      </ul>
      {sorun && b && <Serit tur="hata">{b.neden ?? "Yedek gönderilemiyor."}</Serit>}
      {liste.length > 1 && <Segment ad="Ek yedek hizmeti" deger={secili} kapali={!v.yaz || bagli || b?.durum === "kopuk"}
        secenekler={liste.map((x) => [x, HIZMET_AD[x]] as const)} degistir={(x) => setD({ ...d, saglayici: x })} />}
      {b && b.durum !== "kesildi" ? (
        <dl className={stil.bilgi}>
          <div><dt>Hesap</dt><dd>{b.hesap}</dd></div>
          <div><dt>Klasör</dt><dd>{v.bulut.deger.kok} · {BULUT_DUZEN[v.bulut.deger.duzen]}</dd></div>
          <div><dt>Kopyalanan</dt><dd>{sayi(k.gonderildi)} dosya · {megabayt(k.bayt)} MB</dd></div>
          <div><dt>Bekleyen</dt><dd>{sayi(k.bekliyor)} dosya</dd></div>
          <div><dt>Son kopya</dt><dd>{b.sonKopya ? `${zaman(b.sonKopya)}${b.sonDosya ? ` · ${b.sonDosya}` : ""}` : <DegerYok />}</dd></div>
        </dl>
      ) : (
        <FormIzgara>
          <Alan id={BID.kok} etiket="Ana klasör" hata={h.kok}>
            <Girdi id={BID.kok} value={d.kok} maxLength={80} disabled={!v.yaz} hata={!!h.kok} mesajli={!!h.kok} onChange={(e) => setD({ ...d, kok: e.target.value })} />
          </Alan>
          <Alan id={BID.d} etiket="Klasör düzeni" hata={h.duzen}>
            <SecimAlani id={BID.d} ad="Klasör düzeni" deger={d.duzen} kapali={!v.yaz} secenekler={(Object.keys(BULUT_DUZEN) as (keyof typeof BULUT_DUZEN)[]).map((x) => [x, BULUT_DUZEN[x]] as const)}
              degistir={(x) => setD({ ...d, duzen: x as typeof d.duzen })} />
          </Alan>
        </FormIzgara>
      )}
      {v.yaz && (
        <div className={stil.tuslar}>
          {bagli ? <Tus ikon="cloud-upload" disabled={mesgul} aria-busy={mesgul || undefined} onClick={simdi}>Şimdi yedekle</Tus>
            : <Tus ikon="cloud-upload" disabled={mesgul || !hazir} aria-busy={mesgul || undefined} onClick={bagla}>{b?.durum === "kopuk" ? "Yeniden bağla" : `${hz}'ı bağla`}</Tus>}
          {b && b.durum !== "kesildi" && <Tus tur="ikincil" disabled={mesgul} onClick={() => void kes()}>Bağlantıyı kes</Tus>}
        </div>
      )}
      <p className={stil.durumSatir}>{!hazir && !bagli ? `${hz} bağlantısı henüz açılmadı.` : `${liste.map((x) => HIZMET_AD[x]).join(" ve ")} veriyi Türkiye dışında saklayabilir.`}</p>
    </Kart>
  );
}

/* ── DEPOLAMA (544; maket 539 "Depolama" — eski "Supabase hesabı ve yedek"in hesap kısmı; 2026-10-12 sunum D1, 515): yalnız bilgi ──
   2026-10-16 (FIRMA-VT FV10, K1 / K3): hesabı bağlama anlatımı kalktı — proje panelden kurulur, bağlantı kilitli; hesap satırı kiracının projesi */
function Depolama({ v }: { v: Veri }) {
  return (
    <Kart yaz={false}>
      <dl className={stil.bilgi}>
        <div><dt>Hesap</dt><dd>{v.depolama.proje === "kendi" ? "Firmanın kendi Supabase projesi (Frankfurt)" : "probata ortak projesi (Supabase, Frankfurt)"}</dd></div>
        <div><dt>Dosyalar</dt><dd>{v.depolama.dosya.toLocaleString("tr-TR")} dosya · {megabayt(v.depolama.bayt)} MB</dd></div>
      </dl>
    </Kart>
  );
}


/* ── E-POSTA (536; maket 539 "E-posta"; FIRMA-VT FV11 — 2026-10-16, K2 + K3): gönderim probata'nın Resend hesabından firmanın alan adıyla — alan adı,
   genel adres ve doğrulama Yönetim'den, burada KİLİTLİ (yalnız gösterilir; anahtar hiç gösterilmez); gönderene gizli kopya firmada; deneme e-postası
   (tuşa basanın adresine); kimden gider ve çalışanların e-postası "Nasıl …?" başlıkları altında ── */
type EpostaKisi = Veri["eposta"]["kisiler"][number];
const epostaSutunlari: Sutun<EpostaKisi>[] = [
  { k: "kisi", genislik: "34%", baslik: "Kişi", kart: "ust", sira: 1, siralanmaz: true, hucre: (x) => <>{x.ad}<span className={stil.altSatir}>{x.roller}</span></> },
  { k: "adres", genislik: "36%", baslik: "E-posta", kart: "govde", sira: 2, siralanmaz: true, hucre: (x) => <><KartEtiket>E-posta</KartEtiket>{x.eposta}</> },
  { k: "yol", genislik: "30%", baslik: "E-postası nereden gider", kart: "rozet", sira: 1, siralanmaz: true, hucre: (x) => x.yol === "kendi"
    ? <Rozet tur="tamam">Kendi adresinden</Rozet>
    : <><Rozet tur="bekliyor">Genel adresten</Rozet><span className={stil.altSatir}>kişinin adıyla, cevap kişiye</span></> },
];
function Eposta({ v }: { v: Veri }) {
  const router = useRouter();
  const bildir = useBildir();
  const [mesgulA, baslatA] = useTransition();
  const s = useKesim("eposta", { kopya: v.eposta.deger.kopya }, v.eposta.surum);
  const g = v.eposta.gonderim, hazir = !!g && g.dogrulandi && g.anahtar;
  const deneme = () => baslatA(async () => {
    const r = await denemeEpostasiEylemi();
    bildir(r.tamam ? r.bildirim ?? "Deneme e-postası gönderildi." : r.genel ?? "Deneme e-postası gönderilemedi.");
    router.refresh();
  });
  return (
    <Kart genis yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet}>
      <Not>Bu ay gönderilen: {v.eposta.ay.toLocaleString("tr-TR")}.</Not>
      <dl className={stil.bilgi}>
        <div><dt>Gönderen alan adı</dt><dd>{g ? <><span>{g.alan}</span> {g.dogrulandi ? <Rozet tur="tamam">Doğrulandı</Rozet> : <Rozet tur="bekliyor">Doğrulanmadı</Rozet>}</> : <DegerYok />}</dd></div>
        <div><dt>Genel adres</dt><dd>{g ? g.genel : <DegerYok />}</dd></div>
        <div><dt>Otomatik e-postaların cevabı</dt><dd>{v.eposta.rapor || <DegerYok />}</dd></div>
      </dl>
      <FormIzgara>
        <Segment ad="Gönderene gizli kopya" deger={s.d.kopya ? "1" : "0"} kapali={!v.yaz} secenekler={[["0", "Kapalı"], ["1", "Açık"]] as const}
          degistir={(x) => s.setD({ ...s.d, kopya: x === "1" })} />
      </FormIzgara>
      {/* durum satırı hep yerinde */}
      <p className={hazir ? stil.durumSatir : `${stil.durumSatir} ${stil.uyariSatir}`}>
        {!g ? <><Ikon ad="triangle-alert" kucuk />E-posta gönderimi kurulmadı; e-postalar sırada bekler.</>
          : !g.dogrulandi || !g.anahtar ? <><Ikon ad="triangle-alert" kucuk />@{g.alan} henüz doğrulanmadı; e-postalar sırada bekler.</>
          : <>Otomatik e-postalar <b>{g.genel}</b> adresinden; cevaplar <b>{v.eposta.rapor || "Rapor e-postası girilmedi"}</b></>}
      </p>
      {v.yaz && <div className={stil.dosyaSatir}>
        <Tus tur="ikincil" ikon="send" disabled={!hazir || mesgulA} aria-busy={mesgulA || undefined} onClick={deneme}>Deneme e-postası gönder</Tus>
        {v.eposta.ben && <span className={stil.altSatir}>{v.eposta.ben}</span>}
      </div>}
      <Yardim baslik="Çalışanların e-postası nereden gider?">
        <Liste baslik="Çalışanların e-postası nereden gider" sutunlar={epostaSutunlari} kayitlar={v.eposta.kisiler} anahtar={(x) => x.id} />
      </Yardim>
    </Kart>
  );
}

function IceAktarmaPenceresi({ v }: { v: Veri }) {
  return <Kart genis yaz={false}><IceAktarma gecmis={v.ice} yaz={v.yaz} /></Kart>;
}

const ICERIK: Record<PanelAdi, (p: { v: Veri }) => ReactNode> = {
  firma: FirmaBilgileri, kod: RaporNumarasi, imza: ImzaYontemi, belge: BelgeSablonlari, mesai: Mesai, esik: Esikler, zimmet: ZimmetFormu,
  mbelge: MusteriBelgeleri, fiyat: FiyatListesi, sabit: SabitGiderler, yedek: Yedek, depolama: Depolama, saklama: Saklama, eposta: Eposta,
  ice: IceAktarmaPenceresi,
};

/* ── SAYFA ── */
export function FirmaAyarlari({ v, yedekSonuc = null }: { v: Veri; yedekSonuc?: string | null }) {
  const gecerli = yedekSonuc && Object.hasOwn(YEDEK_SONUC, yedekSonuc) ? yedekSonuc : null;
  const [acik, setAcik] = useState<PanelAdi | null>(gecerli ? "yedek" : null);
  const [sonuc] = useState(gecerli);
  const router = useRouter();
  /* izin ekranından dönüş: sonuç bir kez gösterilir, adres sadeleşir (yenileyince yeniden çıkmaz) */
  useEffect(() => { if (yedekSonuc) router.replace("/firma-ayarlari", { scroll: false }); }, [yedekSonuc, router]);
  const Icerik = acik ? ICERIK[acik] : null;
  return (
    <>
      <SayfaBasi baslik="Firma ayarları" />
      {!v.yaz && <Serit tur="bilgi" ikon="info">Yalnız görüntüleme yetkiniz var.</Serit>}
      <div className={stil.gruplar}>
        {GRUPLAR.map((g) => (
          <section key={g.k} className={stil.grup} aria-labelledby={`ay-g-${g.k}`}>
            <h2 className={stil.grupBaslik} id={`ay-g-${g.k}`}>{g.ad}</h2>
            <div className={stil.paneller}>
              {g.p.map((k) => {
                const o = ozet(k, v);
                return (
                  <button key={k} type="button" className={stil.panel} data-panel={k} aria-haspopup="dialog" aria-describedby={`ay-oz-${k}`} onClick={() => setAcik(k)}>
                    <span className={stil.panelIkon}><Ikon ad={PANEL[k].ikon} /></span>
                    <span className={stil.panelYazi}><span className={stil.panelAd}>{PANEL[k].ad}</span><span className={stil.panelOzet} id={`ay-oz-${k}`} title={o.metin}>{o.metin}</span></span>
                    <span className={stil.panelSag}>{o.durum && <Rozet tur="bekliyor">{o.durum}</Rozet>}<Ikon ad="chevron-right" kucuk /></span>
                  </button>
                );
              })}
              {/* 2026-10-25 (belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca bağlamalıyız"): programın
                  ürettiği belgelerin formatları kendi sayfasında (rapor şablonunun aracıyla) — pencere değil, sayfaya gider */}
              {g.k === "firma" && (
                <Link href="/firma-ayarlari/belgeler" className={stil.panel} style={{ textDecoration: "none" }} data-baglanti="belgeler">
                  <span className={stil.panelIkon}><Ikon ad="layout-list" /></span>
                  <span className={stil.panelYazi}><span className={stil.panelAd}>Belge formatları</span>
                    <span className={stil.panelOzet}>Zimmet, araç, eğitim, izin, masraf, teklif, fatura, saha, ön bilgilendirme</span></span>
                  <span className={stil.panelSag}><Ikon ad="chevron-right" kucuk /></span>
                </Link>
              )}
            </div>
          </section>
        ))}
      </div>
      {acik && Icerik && (
        <PanelBag.Provider value={{ ad: PANEL[acik].ad, kapat: () => setAcik(null) }}>
          <YedekSonucBag.Provider value={sonuc}><Icerik v={v} /></YedekSonucBag.Provider>
        </PanelBag.Provider>
      )}
    </>
  );
}
