"use client";
/* FİRMA AYARLARI (334; maket firma-ayarlari.html + maket-ayarlar.js — firmaBilgiCiz, ayarCiz, ayarDigerCiz, Z1 taslak + bölüm Kaydet): geniş
   ekranda solda bölüm listesi, bölümler kart, iki sütunlu yerleşim (sabit giderler tam genişlik); telefonda tek sütun. Değişiklik bölümün
   Kaydet tuşuyla kaydedilir; geçersiz değer kaydedilmez, alanın altında söylenir. Dosyalar (logo, ön bilgilendirme formu, bordro formatı)
   seçilince hemen yüklenir; kaldırmak önce sorulur. "Gör" düzeyinde salt okunur. Karar ve doğrulama sunucuda (server/ayarlar.ts). */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { DosyaAcTusu, GizliResim } from "../../../components/gizli-resim/GizliResim";
import { useOnayla } from "../../../components/pencere/Onay";
import { KartEtiket, Liste, type Sutun } from "../../../components/liste/Liste";
import { DegerYok, Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import {
  AYAR_BASLIK, AYAR_DOSYASI, BULUT_DUZEN, BULUT_SAGLAYICI, ESIK, IMZA_YONTEM, NUSHA, RESEND_ADIMLAR, SAKLAMA_YIL, SUPABASE_ADIMLAR, YASAL, YZ_MODEL, kodBuyut, onBilgiFormKodu,
  type AyarDosyasi, type AyarKesimi, type EsikAdi,
} from "../sema";
import type { FirmaAyarlari as Veri } from "../server/ayarlar";
import { IceAktarma } from "./IceAktarma";
import { ayarDosyasiEylemi, ayarKaydetEylemi, belgeTuruEkleEylemi, belgeTuruKaldirEylemi, denemeEpostasiEylemi, epostaAnahtarEylemi, firmaKoduKaydetEylemi, yzAnahtarEylemi,
  type AyarYaniti } from "./eylemler";
import stil from "./firma-ayarlari.module.css";

const ID = {
  ad: "w-ay-ad", adres: "w-ay-adres", eposta: "w-ay-eposta", akr: "w-ay-akr", nusha: "w-ay-nusha", zeden: "w-ay-zeden", yil: "w-ay-yil",
  normal: "w-ay-normal", mesai: "w-ay-mesai", yillik: "w-ay-yillik", kod: "w-ay-kod", dosyaSec: "w-ay-dosya-sec",
} as const;
const bolumId = (k: AyarKesimi) => `ay-b-${k}`;
const para = (k: number) => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(k / 100);

/* ── bölüm kartı + taslak (Z1) ── */
function Kart({ kesim, genis = false, kirli, mesgul, kaydet, vazgec, yaz, sayac, children }: {
  kesim: AyarKesimi; genis?: boolean; kirli: boolean; mesgul: boolean; kaydet: () => void; vazgec: () => void; yaz: boolean; sayac?: ReactNode; children: ReactNode;
}) {
  return (
    <section className={genis ? `${stil.kart} ${stil.genis}` : stil.kart} aria-labelledby={bolumId(kesim)}>
      <div className={stil.bas}>
        <h2 className={stil.baslik} id={bolumId(kesim)} tabIndex={-1}>{AYAR_BASLIK[kesim]}</h2>
        {sayac && <span className={stil.sayac}>{sayac}</span>}
        {yaz && kirli && <span className={stil.kaydet}>
          <span className={stil.kaydetNot}>Kaydedilmedi</span>
          <Tus tur="ikincil" disabled={mesgul} onClick={vazgec}>Vazgeç</Tus>
          <Tus ikon="check" disabled={mesgul} aria-busy={mesgul || undefined} onClick={kaydet}>Kaydet</Tus>
        </span>}
      </div>
      {children}
    </section>
  );
}

/** uzlastir: sunucu değeri değişince taslak kirliyse (kaydedilmemiş değişiklik) tümüyle atılmaz, yeni değerle uzlaştırılır */
function useKesim<T>(kesim: AyarKesimi, ilk: T, surum: number, gonder?: (d: T) => Promise<AyarYaniti>, uzlastir?: (taslak: T) => T) {
  const router = useRouter();
  const bildir = useBildir();
  const [mesgul, baslat] = useTransition();
  const [d, setD] = useState<T>(ilk);
  const [h, setH] = useState<Record<string, string>>({});
  /* sunucudaki değer değişince (kaydettikten sonra yenileme — biçim düzelmiş olabilir) taslak ona eşitlenir */
  const ilkJson = JSON.stringify(ilk);
  const [son, setSon] = useState(ilkJson);
  if (son !== ilkJson) { setSon(ilkJson); setD(uzlastir && JSON.stringify(d) !== son ? uzlastir(d) : ilk); setH({}); }
  const kirli = JSON.stringify(d) !== ilkJson;
  const kaydet = () => baslat(async () => {
    const r = await (gonder ? gonder(d) : ayarKaydetEylemi(kesim, surum, d));
    if (!r.tamam) {
      setH(r.hatalar ?? {});
      if (r.genel) bildir(r.genel);
      else bildir(`${AYAR_BASLIK[kesim]}: bazı alanlar kaydedilmedi; nedeni alanın altında.`);
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`section[aria-labelledby="${bolumId(kesim)}"] [aria-invalid="true"]`)?.focus());
      return;
    }
    /* kayıtlı değer zaten aynıydı (sunucu kırptı / büyüttü / biçimledi): sunucu değeri değişmeyeceği için taslak burada kayıtlıya döner */
    setH({}); if (r.degismedi) setD(ilk);
    bildir(r.bildirim ?? `${AYAR_BASLIK[kesim]} kaydedildi.`); router.refresh();
    requestAnimationFrame(() => document.getElementById(bolumId(kesim))?.focus());
  });
  const vazgec = () => { setD(ilk); setH({}); bildir(`${AYAR_BASLIK[kesim]}: değişiklikler geri alındı.`); document.getElementById(bolumId(kesim))?.focus(); };
  return { d, setD, h, setH, kirli, mesgul, kaydet, vazgec };
}

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
      {dosya ? <div className={stil.dosyaSatir}>
        {resim && <GizliResim dosyaId={dosya.id} alt="Firma logosu" className={stil.logo} />}
        <DosyaAcTusu dosyaId={dosya.id} ikon="file-text" etiket={`${t.ad}: ${dosya.ad}`}>{dosya.ad}</DosyaAcTusu>
      </div> : <p className={stil.ipucu}>{bos}</p>}
      {yaz && <div className={stil.tuslar}>
        <input ref={secici} type="file" accept={kabul} hidden aria-hidden="true" tabIndex={-1}
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) gonder(f); }} />
        <Tus tur="ikincil" ikon="upload" disabled={mesgul} aria-busy={mesgul || undefined} data-dosya-yukle={ne} onClick={() => secici.current?.click()}>{dosya ? "Değiştir" : `${t.ad === "Firma logosu" ? "Logo" : t.ad} yükle`}</Tus>
        {dosya && <Tus tur="ikincil" ikon="x" disabled={mesgul} onClick={kaldir} aria-label={`${t.ad} kaldır`}>Kaldır</Tus>}
      </div>}
      {hata && <p className={stil.hata} role="alert">{hata}</p>}
    </div>
  );
}

/* ── BÖLÜMLER ── */
function FirmaBilgileri({ v }: { v: Veri }) {
  const s = useKesim("firma", { ...v.firma.deger, nusha: String(v.firma.deger.nusha) }, v.firma.surum);
  const g = (k: "ad" | "adres" | "eposta" | "akr", id: string, etiket: string, en: number, ek: { sonuc?: string; uyari?: string; genis?: boolean; tur?: string } = {}) => (
    <Alan id={id} etiket={etiket} hata={s.h[k]} genis={ek.genis} uyari={!s.h[k] && !s.d[k].trim() ? ek.uyari : undefined} sonuc={ek.sonuc}>
      <Girdi id={id} value={s.d[k]} maxLength={en} disabled={!v.yaz} hata={!!s.h[k]} mesajli={!!s.h[k] || (!s.d[k].trim() && !!ek.uyari) || !!ek.sonuc} type={ek.tur}
        inputMode={ek.tur === "email" ? "email" : undefined} onChange={(e) => s.setD({ ...s.d, [k]: e.target.value })} />
    </Alan>
  );
  return (
    <Kart kesim="firma" yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec}>
      <FormIzgara>
        {g("ad", ID.ad, "Ticari ad", 120, { genis: true, uyari: `Boş: raporda firma kaydındaki ad çıkar (${v.firma.kayitAd}).` })}
        {g("adres", ID.adres, "Adres", 200, { genis: true, uyari: "Boş: raporda bu alan boş çıkar." })}
        {g("eposta", ID.eposta, "Rapor e-postası", 120, { sonuc: "Müşteriye giden rapor ve bildirimler bu adresten", tur: "email", uyari: "Boş: raporda bu alan boş çıkar." })}
        {g("akr", ID.akr, "Akreditasyon no", 20, { sonuc: "TÜRKAK markasının yanında", uyari: "Boş: raporda bu alan boş çıkar." })}
        <Alan id={ID.nusha} etiket="Rapor nüsha sayısı" hata={s.h.nusha}>
          <SecimAlani id={ID.nusha} ad="Rapor nüsha sayısı" deger={s.d.nusha} kapali={!v.yaz} gecersiz={!!s.h.nusha} tanim={s.h.nusha ? ipucuId(ID.nusha) : undefined} secenekler={NUSHA.map((n) => [String(n), `${n} nüsha`] as const)}
            degistir={(x) => s.setD({ ...s.d, nusha: x })} />
        </Alan>
      </FormIzgara>
      <p className={stil.etiket}>Firma logosu</p>
      <DosyaAyari ne="logo" dosya={v.dosyalar.logo} surum={v.dosyalar.surum.firma} yaz={v.yaz} resim
        bos="Logo yüklenmedi; raporların başlığında logo yeri boş çıkar. PNG ya da JPEG, en çok 2 MB."
        kaldirSonu="raporların ve belgelerin başlığında logo yerinde boş kutu çıkar." />
    </Kart>
  );
}

function ImzaYontemi({ v }: { v: Veri }) {
  const s = useKesim("imza", v.imza.deger, v.imza.surum);
  return (
    <Kart kesim="imza" yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec}>
      <div role="radiogroup" aria-labelledby={bolumId("imza")} className={stil.secenekler}>
        {(Object.keys(IMZA_YONTEM) as (keyof typeof IMZA_YONTEM)[]).map((k) => (
          <label key={k} className={stil.secenek}>
            <input type="radio" name="w-ay-imza" value={k} checked={s.d.yontem === k} disabled={!v.yaz} onChange={() => s.setD({ yontem: k })} />
            <span>{IMZA_YONTEM[k][0]} — {IMZA_YONTEM[k][1]}</span>
          </label>
        ))}
      </div>
      <p className={stil.ipucu}>Raporun son imzası ve iç belgeler bu yöntemle; indir-imzala-yükle yolu her zaman açık.</p>
    </Kart>
  );
}

function ZimmetFormu({ v }: { v: Veri }) {
  const s = useKesim("zimmet", { teslim_eden: v.zimmet.deger.teslim_eden ?? "" }, v.zimmet.surum);
  return (
    <Kart kesim="zimmet" yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec}>
      <Alan id={ID.zeden} etiket="Teslim eden (başlangıç)" hata={s.h.teslim_eden} sonuc={s.h.teslim_eden ? undefined : "Zimmet teslim formunda firma adına teslim eden; formda değiştirilebilir."}>
        <SecimAlani id={ID.zeden} ad="Teslim eden (başlangıç)" deger={s.d.teslim_eden} kapali={!v.yaz} tanim={ipucuId(ID.zeden)} gecersiz={!!s.h.teslim_eden}
          secenekler={[["", "Seçilmedi"], ...v.kisiler.map((k) => [k.id, k.ad] as const)]} degistir={(x) => s.setD({ teslim_eden: x })} />
      </Alan>
    </Kart>
  );
}

function Saklama({ v }: { v: Veri }) {
  const s = useKesim("saklama", { yil: String(v.saklama.deger.yil) }, v.saklama.surum);
  return (
    <Kart kesim="saklama" yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec}>
      <Alan id={ID.yil} etiket="Saklama süresi" hata={s.h.yil}>
        <SecimAlani id={ID.yil} ad="Saklama süresi" deger={s.d.yil} kapali={!v.yaz} gecersiz={!!s.h.yil} tanim={s.h.yil ? ipucuId(ID.yil) : undefined}
          secenekler={SAKLAMA_YIL.map((y) => [String(y), `${y} yıl${y === 5 ? " (yasal en az)" : ""}`] as const)} degistir={(x) => s.setD({ yil: x })} />
      </Alan>
      <p className={stil.ipucu}>Süre dolunca imzalı rapor PDF&apos;leri ve aylık arşiv yedekleri deponuzdan silinir; silinecekler 30 gün önce size listelenir.
        Süreyi kısaltırsanız yeni süre 30 gün sonra işler (silinecekler önce listelenir).</p>
      {/* 387: silinecekler listesi yalnız firma yöneticisine (Firma ayarları "yaz") */}
      {v.yaz && <p className={stil.ipucu}><Link href="/firma-ayarlari/saklama">Saklama süresi dolacak raporlar</Link></p>}
    </Kart>
  );
}

function SablonDosyasi({ v, ne, kesim, bos, kaldirSonu }: { v: Veri; ne: "on_bilgi" | "bordro_format"; kesim: AyarKesimi; bos: string; kaldirSonu: string }) {
  return (
    <Kart kesim={kesim} yaz={false} kirli={false} mesgul={false} kaydet={() => undefined} vazgec={() => undefined}>
      <DosyaAyari ne={ne} dosya={v.dosyalar[ne]} surum={v.dosyalar.surum.sablon} yaz={v.yaz} bos={bos} kaldirSonu={kaldirSonu} />
    </Kart>
  );
}

function Mesai({ v }: { v: Veri }) {
  const m = v.mesai.deger;
  const s = useKesim("mesai", { acik: m.acik, normal_dk: String(m.normal_dk), mesai_dk: String(m.mesai_dk), yillik_fazla_saat: String(m.yillik_fazla_saat) }, v.mesai.surum);
  const toplam = Number(s.d.normal_dk) + Number(s.d.mesai_dk);
  const sayi = (k: "normal_dk" | "mesai_dk" | "yillik_fazla_saat", id: string, etiket: string, sonuc?: string) => (
    <Alan id={id} etiket={etiket} hata={s.h[k]} sonuc={s.h[k] ? undefined : sonuc}>
      <Girdi id={id} value={s.d[k]} inputMode="numeric" maxLength={4} disabled={!v.yaz} hata={!!s.h[k]} mesajli={!!s.h[k] || !!sonuc}
        onChange={(e) => s.setD({ ...s.d, [k]: e.target.value })} />
    </Alan>
  );
  return (
    <Kart kesim="mesai" yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec}>
      <label className={stil.secenek}>
        <input type="checkbox" checked={s.d.acik} disabled={!v.yaz} onChange={(e) => s.setD({ ...s.d, acik: e.target.checked })} />
        <span>Açık — günlük süre dolunca yeni rapor oluşturulamaz</span>
      </label>
      {s.d.acik && <>
        <FormIzgara>
          {sayi("normal_dk", ID.normal, "Günlük normal çalışma (dk)")}
          {sayi("mesai_dk", ID.mesai, "Günlük mesai (dk)")}
          {sayi("yillik_fazla_saat", ID.yillik, "Yıllık fazla çalışma sınırı (saat)", "Kanunda en çok 270 saat. Dolan kişide o yıl mesai kullanılmaz.")}
        </FormIzgara>
        {toplam > YASAL.gunlukDk && <Serit tur="uyari" ikon="triangle-alert">Günlük toplam {toplam} dk: İş Kanunu&apos;na göre günlük çalışma 11 saati (660 dk) aşamaz.</Serit>}
      </>}
      <p className={stil.ipucu}>Raporun süresi ekipman türünün kontrol süresidir (Ekipman türleri). Önce normal süre, sonra mesai dolar. Fazla çalışma için çalışanın yılda bir yazılı onayı gerekir.</p>
    </Kart>
  );
}

function Esikler({ v }: { v: Veri }) {
  const ilk = Object.fromEntries((Object.keys(ESIK) as EsikAdi[]).map((k) => [k, String(v.esik.deger[k])])) as Record<EsikAdi, string>;
  const s = useKesim("esik", ilk, v.esik.surum);
  return (
    <Kart kesim="esik" yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec}>
      <FormIzgara>
        {(Object.keys(ESIK) as EsikAdi[]).map((k) => {
          const [ad, etiket, bas, sec] = ESIK[k], id = `w-ay-esik-${k}`;
          return (
            <Alan key={k} id={id} etiket={ad} hata={s.h[k]} sonuc={s.h[k] ? undefined : `${etiket}${Number(s.d[k]) === bas ? "" : ` · başlangıç ${bas} gün`}`}>
              <SecimAlani id={id} ad={ad} deger={s.d[k]} kapali={!v.yaz} tanim={ipucuId(id)} gecersiz={!!s.h[k]} secenekler={sec.map((g) => [String(g), `${g} gün`] as const)}
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
    <Kart kesim="kod" yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec}>
      <Alan id={ID.kod} etiket="Firma kodu" hata={s.h.kod ?? s.h.gorulen} sonuc={s.h.kod ? undefined : `Yeni rapor: ${/^[A-Z]{2}$/.test(kodBuyut(s.d.kod)) ? kodBuyut(s.d.kod) : v.kod}-AAYY-SIRA-…; açılmış raporların numarası değişmez.`}>
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
    <Kart kesim="sabit" genis yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec} sayac={<><b>{l.length}</b> kalem</>}>
      <p className={stil.ipucu}>Aylık; Muhasebe&apos;nin gelir-gider özetinde her ay gider olarak düşer. Kayıtlı toplam {para(toplam)} TL.</p>
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
            onClick={() => { s.setD({ kalemler: l.filter((_, j) => j !== i) }); s.setH({}); requestAnimationFrame(() => document.getElementById(bolumId("sabit"))?.focus()); }}>Kaldır</Tus>}
        </div>
      ))}
      {v.yaz && l.length < 30 && <div className={stil.tuslar}>
        <Tus tur="ikincil" ikon="plus" onClick={() => { s.setD({ kalemler: [...l, { ad: "", aylik: "0,00", not: "" }] });
          requestAnimationFrame(() => document.getElementById(`w-ay-sg-ad-${l.length}`)?.focus()); }}>Sabit gider ekle</Tus>
      </div>}
    </Kart>
  );
}

/* ── FİYAT LİSTESİ (335; maket "Fiyat listesi": tür başına KDV hariç birim fiyat, dört sütuna kadar) ── */
function FiyatListesi({ v }: { v: Veri }) {
  const ilk = { fiyatlar: Object.fromEntries(v.fiyat.turler.map((t) => [t.id, t.fiyat === null ? "" : para(t.fiyat)])) as Record<string, string> };
  const s = useKesim("fiyat", ilk, 0, (d) => ayarKaydetEylemi("fiyat", 0, { fiyatlar: d.fiyatlar, gorulen: ilk.fiyatlar }));
  return (
    <Kart kesim="fiyat" genis yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec} sayac={<><b>{v.fiyat.turler.length}</b> tür</>}>
      <p className={stil.ipucuUst}>KDV hariç birim fiyat. Yeni teklif bu listeden dolar; teklif dışı rapor bu fiyatla faturalanır. Kabul edilmiş tekliflerin fiyatı değişmez.</p>
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
      </div> : <p className={stil.ipucu}>Ekipman türü yok; türler Ekipman türleri&apos;nden eklenir.</p>}
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
        router.refresh(); requestAnimationFrame(() => document.getElementById(bolumId("mbelge"))?.focus());
      }
    });
  };
  return (
    <Kart kesim="mbelge" genis yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec} sayac={<><b>{s.d.secili.length}</b> tür</>}>
      <p className={stil.ipucuUst}>Müşteri panelinde &quot;Muayene personeli&quot; sekmesinde, o müşteriye giden muayene personelinin yalnız işaretli belgeleri görünür.</p>
      <fieldset className={stil.turler}>
        <legend className="gizli">Müşteriye açık belge türleri</legend>
        {v.mbelge.turler.map((t) => {
          const kutu = (
            <label className={stil.secenek}>
              <input type="checkbox" checked={sec.has(t.k)} disabled={!v.yaz}
                onChange={(e) => s.setD({ secili: (e.target.checked ? [...s.d.secili, t.k] : s.d.secili.filter((x) => x !== t.k)).sort() })} />
              <span>{t.ad}{(t.ek || t.kisisel) && <span className={stil.alt}>{[t.ek ? "firmanın eklediği" : "", t.kisisel ? "kişisel veri" : ""].filter(Boolean).join(" · ")}</span>}</span>
            </label>
          );
          return t.ek && v.yaz ? <div key={t.k} className={stil.ekSatir}>{kutu}
            <Tus tur="ikincil" ikon="x" disabled={mesgulTur} aria-label={`${t.ad} türünü kaldır`} onClick={() => turKaldir(t.k, t.ad, t.kullanim)}>Kaldır</Tus></div>
            : <div key={t.k}>{kutu}</div>;
        })}
      </fieldset>
      {s.h.secili && <p className={stil.hata} role="alert">{s.h.secili}</p>}
      {hassas.length > 0 && <Serit tur="uyari" ikon="triangle-alert">Kişisel veri içeren belge müşteriye açık: {hassas.map((t) => t.ad).join(", ")}. Personelin açık rızası gerekebilir (KVKK); karar firmanın.</Serit>}
      {v.yaz && (ekle ? <div className={stil.ekForm}>
        <FormIzgara>
          <Alan id={BT.ad} etiket="Yeni belge türü" genis hata={ekle.hata ?? undefined} sonuc={ekle.hata ? undefined : "Personel'de özlük belgesi yüklerken seçilir; müşteriye açmak için listede işaretleyin."}>
            <Girdi id={BT.ad} value={ekle.ad} maxLength={60} hata={!!ekle.hata} mesajli onChange={(e) => setEkle({ ...ekle, ad: e.target.value, hata: null })} />
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

/* ── RAPORLARIN İKİNCİ KOPYASI (336 "Bulut kaydı", maket bulutCiz Ö2; 2026-10-12 sunum D3 kabul — reisim: "önerilerini kabul ediyorum, hayata
   geçir"): isteğe bağlı; imzalanan raporlar (müşteri klasörlü) ve aylık arşiv yedeği Supabase dışında firmanın Google Drive / OneDrive'ında da durur.
   Kapalıyken uyarı: raporların tek kopyası Supabase'te. Hesap bağlantısı ve kendiliğinden kopya yayına çıkışta (K7); ayarlar şimdiden kaydedilir. ── */
const BID = { s: "w-ay-bulut-s", d: "w-ay-bulut-d", kok: "w-ay-bulut-kok" } as const;
function IkinciKopya({ v }: { v: Veri }) {
  const s = useKesim("bulut", v.bulut.deger, v.bulut.surum);
  const acik = s.d.saglayici !== "";
  const sg = s.d.saglayici ? BULUT_SAGLAYICI[s.d.saglayici] : null;
  const ornek = `${s.d.kok || "…"} / ${s.d.duzen === "my" ? "Müşteri / 2026" : s.d.duzen === "mty" ? "Müşteri / Tesis / 2026" : "Müşteri / Tesis"} / RAPOR-NO.pdf`;
  return (
    <Kart kesim="bulut" yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec} sayac={v.bulut.deger.saglayici ? "açık" : "kapalı"}>
      <p className={stil.ipucuUst}>İmzalanan her rapor (müşteri klasörlü) ve aylık arşiv yedeği, Supabase dışında firmanızın kendi bulutunda da durur. İsteğe bağlı.</p>
      <div role="radiogroup" aria-labelledby={bolumId("bulut")} className={stil.secenekler}>
        {([[false, "Kapalı"], [true, "Açık"]] as const).map(([d, ad]) => (
          <label key={ad} className={stil.secenek}><input type="radio" name="w-ay-bulut-acik" checked={acik === d} disabled={!v.yaz}
            onChange={() => s.setD({ ...s.d, saglayici: d ? (v.bulut.deger.saglayici || "gdrive") : "" })} /><span>{ad}</span></label>
        ))}
      </div>
      {acik ? <>
        <FormIzgara>
          <Alan id={BID.s} etiket="Hizmet" hata={s.h.saglayici}>
            <SecimAlani id={BID.s} ad="Hizmet" deger={s.d.saglayici} kapali={!v.yaz} secenekler={(Object.keys(BULUT_SAGLAYICI) as (keyof typeof BULUT_SAGLAYICI)[]).map((k) => [k, BULUT_SAGLAYICI[k][0]] as const)}
              degistir={(x) => s.setD({ ...s.d, saglayici: x as typeof s.d.saglayici })} />
          </Alan>
          <Alan id={BID.d} etiket="Klasör düzeni" hata={s.h.duzen}>
            <SecimAlani id={BID.d} ad="Klasör düzeni" deger={s.d.duzen} kapali={!v.yaz} secenekler={(Object.keys(BULUT_DUZEN) as (keyof typeof BULUT_DUZEN)[]).map((k) => [k, BULUT_DUZEN[k]] as const)}
              degistir={(x) => s.setD({ ...s.d, duzen: x as typeof s.d.duzen })} />
          </Alan>
          <Alan id={BID.kok} etiket="Ana klasör" hata={s.h.kok} genis sonuc={s.h.kok ? undefined : `Örnek yol: ${ornek}`}>
            <Girdi id={BID.kok} value={s.d.kok} maxLength={80} disabled={!v.yaz} hata={!!s.h.kok} mesajli onChange={(e) => s.setD({ ...s.d, kok: e.target.value })} />
          </Alan>
        </FormIzgara>
        {sg?.[1] && <Serit tur="uyari" ikon="triangle-alert">{sg[0]} verileri Türkiye dışında saklayabilir: raporların kopyası yurt dışına çıkar (KVKK sorumluluğu firmanın).</Serit>}
        <Serit tur="bilgi" ikon="info">Hesap bağlantısı ve kendiliğinden kopya yayına çıkışta açılır: hizmetin kendi izin ekranı açılır, probata yalnız ana klasöre yazar. Ayarlar şimdiden kaydedilir.</Serit>
      </> : <Serit tur="uyari" ikon="triangle-alert">Raporlarınızın tek kopyası Supabase&apos;te. Supabase hesabı kapanırsa ya da proje silinirse raporlar geri gelmez; ikinci kopyayı açmanızı öneririz.</Serit>}
    </Kart>
  );
}

/* ── SUPABASE HESABI VE YEDEK (336 "Depolama ve yedek", maket depoCiz G2/G3; 2026-10-12 sunum D1–D2 kabul — reisim: "supabase hesabını nasıl
   bağlayacağımızı göremedim eğer o da kurguluysa sorun yok"): firmanın veritabanı ve dosyaları kendi Supabase hesabında; bağlama akışı
   (SUPABASE_ADIMLAR — Yönetim de aynı metni gösterir) yayına çıkışta açılır, deneme yayınında probata'nın ortak deneme projesi. Ayrı S3 deposu formu ve
   yedek sıklığı / saati / saklama seçimleri kalktı: Supabase'in günlük yedeği + aylık arşiv yedeği kendiliğinden. Yalnız bilgi, düzenleme yok. ── */
const megabayt = (bayt: number) => (bayt / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 1 });
function SupabaseYedek({ v }: { v: Veri }) {
  const yok = () => undefined;
  return (
    <Kart kesim="depo" genis yaz={false} kirli={false} mesgul={false} kaydet={yok} vazgec={yok} sayac="deneme projesi">
      <p className={stil.ipucuUst}>Veritabanı ve dosyalar firmanızın kendi Supabase hesabında durur (Frankfurt). Paket ve ödeme Supabase&apos;te, fatura doğrudan size gelir.</p>
      <p className={stil.etiket}>Bağlantı ve kullanım</p>
      <ul className={stil.bilgiListe}>
        <li><b>Şu an</b> · probata&apos;nın ortak deneme projesi (Supabase, Frankfurt). Kendi hesabınız yayına çıkışta bağlanır.</li>
        <li><b>Dosyalar</b> · {v.depolama.dosya.toLocaleString("tr-TR")} dosya · {megabayt(v.depolama.bayt)} MB (fotoğraf, belge, imzalı raporlar)</li>
        <li><b>Pro paket</b> · 25 $/ay: 8 GB veritabanı, 100 GB dosya, ayda 250 GB indirme, her gün alınan veritabanı yedeği (7 gün geriye dönülebilir)</li>
      </ul>
      <p className={stil.etiket}>Supabase hesabı nasıl bağlanır (yayına çıkışta)</p>
      <ol className={stil.bilgiListe}>{SUPABASE_ADIMLAR.map((x) => <li key={x}>{x}</li>)}</ol>
      {/* 2026-10-12 (515; reisim: "supabase de neden raporlar 7 gün duruyor peki daha fazla değil de ?" → "evet netleştir"): 7 gün raporların ömrü
         değil, veritabanının geri sarma yedeği — önce raporların ne kadar durduğu, sonra yedekler */}
      <p className={stil.etiket}>Raporlar ne kadar durur, yedek ne işe yarar (kendiliğinden, ayar yok)</p>
      <ul className={stil.bilgiListe}>
        <li><b>Raporlar</b> · arsiv/raporlar/YIL/Müşteri/ — imzalanan her rapor saklama süresi ({v.saklama.deger.yil} yıl) boyunca durur; süre dolmadan
          silinmez, silinecekler 30 gün önce listelenir.</li>
        <li><b>Aylık arşiv yedeği</b> · her ayın 1&apos;i · arsiv/yedek/ — veritabanının o ayki tam kopyası; o da saklama süresi
          ({v.saklama.deger.yil} yıl) boyunca durur. Kendi hesabınız bağlanınca başlar.</li>
        <li><b>Supabase günlük yedeği</b> · yalnız geri sarma içindir: veritabanı yanlışlıkla bozulursa son 7 günün herhangi bir gününe dönülür.
          7 gün raporların ömrü değildir, raporlar 7 gün sonra silinmez. Supabase&apos;in kendisi alır (Pro paket); dosyaları kapsamaz.</li>
      </ul>
      <Serit tur="bilgi" ikon="info">probata saklama süresi dolmadan hiçbir dosyayı silmez. Supabase hesabınızda dosyaları ya da projeyi kendiniz silerseniz geri getirilemez; raporların ikinci kopyası bunun içindir.</Serit>
    </Kart>
  );
}

/* ── YAPAY ZEKÂ (336; maket yzCiz Y1): aç / kapa, yurt dışı uyarısı, API anahtarı (bir kez yazılır, son 4), model, kişi başı aylık sınır ── */
/* bu ayın kişi başı kullanımı (354; maket yzCiz SUT — 380: S.A.Y mesajı; "kendi anahtarı" sütunu o iş gelince): sınır kayıtlı değere göre (boş ya da
   0 = sınırsız, maket "sinirli = sinir > 0"); %80'de sarı, dolunca kırmızı */
type YzKullanim = Veri["yz"]["kullanim"][number];
const dolarYaz = (m: number) => `$${(m / 1e6).toFixed(2).replace(".", ",")}`;
const yzSutunlari = (sinir: number | null): Sutun<YzKullanim>[] => [
  { k: "kisi", genislik: "32%", baslik: "Kişi", kart: "ust", sira: 1, siralanmaz: true, hucre: (x) => x.ad },
  { k: "okuma", genislik: "18%", baslik: "Fotoğraftan okuma", kart: "govde", sira: 2, siralanmaz: true, hucre: (x) => <><KartEtiket>Fotoğraftan okuma</KartEtiket>{x.okuma}</> },
  { k: "mesaj", genislik: "16%", baslik: "S.A.Y mesajı", kart: "govde", sira: 3, siralanmaz: true, hucre: (x) => <><KartEtiket>S.A.Y mesajı</KartEtiket>{x.mesaj}</> },
  { k: "usd", genislik: "16%", baslik: "Harcama", kart: "govde", sira: 4, siralanmaz: true, hucre: (x) => <><KartEtiket>Harcama</KartEtiket>{dolarYaz(x.maliyet)}</> },
  { k: "durum", genislik: "18%", baslik: "Sınır", kart: "rozet", sira: 1, siralanmaz: true, hucre: (x) => {
    if (sinir === null || sinir <= 0) return <DegerYok>sınırsız</DegerYok>;
    const o = x.maliyet / (sinir * 1e6);
    return o >= 1 ? <Rozet tur="red">Doldu</Rozet> : <Rozet tur={o >= 0.8 ? "bekliyor" : "tamam"}>%{Math.round(o * 100)}</Rozet>;
  } },
];
const ZID = { anahtar: "w-ay-yz-anahtar", sinir: "w-ay-yz-sinir" } as const;
function YapayZeka({ v }: { v: Veri }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [mesgulA, baslatA] = useTransition();
  const s = useKesim("yz", { acik: v.yz.deger.acik, sinir: v.yz.deger.sinir === null ? "" : String(v.yz.deger.sinir).replace(".", ",") }, v.yz.surum);
  const [yeni, setYeni] = useState<null | { deger: string; hata: string | null }>(v.yz.anahtar.tanimli ? null : { deger: "", hata: null });
  const anahtarKaydet = () => baslatA(async () => {
    if (!yeni) return;
    /* ekranda "Açık" seçili ama kayıtlı değilse anahtarla birlikte açılır (maket Z1: anahtarı giren yapay zekâyı açmak istiyor) */
    const r = await yzAnahtarEylemi({ anahtar: yeni.deger }, s.d.acik && !v.yz.deger.acik ? v.yz.surum : null);
    if (!r.tamam) { setYeni({ deger: "", hata: r.hatalar?.anahtar ?? r.genel ?? "Kaydedilemedi." }); requestAnimationFrame(() => document.getElementById(ZID.anahtar)?.focus()); return; }
    setYeni(null); bildir(r.bildirim ?? "API anahtarı kaydedildi."); router.refresh();
    requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-yz-degistir]")?.focus());
  });
  const anahtarKaldir = async () => {
    if (!(await onayla({ baslik: "API anahtarını kaldır", metin: "Fotoğraftan okuma ve S.A.Y, yeni anahtar girilene kadar çalışmaz.", tus: "Kaldır", tehlike: true }))) return;
    baslatA(async () => {
      const r = await yzAnahtarEylemi(null); bildir(r.tamam ? r.bildirim ?? "Kaldırıldı." : r.genel ?? "Kaldırılamadı.");
      if (r.tamam) { setYeni({ deger: "", hata: null }); router.refresh(); requestAnimationFrame(() => document.getElementById(ZID.anahtar)?.focus()); }
    });
  };
  return (
    <Kart kesim="yz" genis yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec} sayac={v.yz.deger.acik ? "açık" : "kapalı"}>
      <p className={stil.ipucuUst}>Fotoğraftan okuma (sigorta, topraklama noktası, etiket) ve rapor sayfasındaki S.A.Y sohbeti. Firmanın Anthropic hesabıyla çalışır; harcama o hesaptan.</p>
      <div role="radiogroup" aria-labelledby={bolumId("yz")} className={stil.secenekler}>
        {([[false, "Kapalı"], [true, "Açık"]] as const).map(([d, ad]) => (
          <label key={ad} className={stil.secenek}><input type="radio" name="w-ay-yz-acik" checked={s.d.acik === d} disabled={!v.yaz} onChange={() => s.setD({ ...s.d, acik: d })} /><span>{ad}</span></label>
        ))}
      </div>
      {s.d.acik && <>
        <Serit tur="uyari" ikon="triangle-alert">Fotoğraf ve maskelenmiş rapor bilgisi (müşteri adı, adres, kişi adı, numaralar gönderilmez) yurt dışına, Anthropic&apos;e (ABD) gider. KVKK yurt dışı aktarım koşulları firmanın sorumluluğunda.</Serit>
        {yeni === null ? <><p className={stil.etiket}>API anahtarı</p><div className={stil.dosyaSatir}>
          <span className={stil.anahtar}>…{v.yz.anahtar.son4} kayıtlı</span>
          {v.yaz && <><Tus tur="ikincil" ikon="pencil" disabled={mesgulA} data-yz-degistir="" onClick={() => { setYeni({ deger: "", hata: null }); requestAnimationFrame(() => document.getElementById(ZID.anahtar)?.focus()); }}>Değiştir</Tus>
            <Tus tur="ikincil" ikon="trash-2" disabled={mesgulA} onClick={anahtarKaldir} aria-label="API anahtarını kaldır">Kaldır</Tus></>}
        </div></> : v.yaz && <>
          <Alan id={ZID.anahtar} etiket="API anahtarı" genis hata={yeni.hata ?? undefined} sonuc={yeni.hata ? undefined : "Anthropic Console'dan alınır (sk-ant- ile başlar). Şifreli saklanır, bir daha gösterilmez."}>
            <Girdi id={ZID.anahtar} type="password" value={yeni.deger} maxLength={210} spellCheck={false} hata={!!yeni.hata} mesajli onChange={(e) => setYeni({ deger: e.target.value, hata: null })} />
          </Alan>
          <div className={stil.tuslar}>
            <Tus ikon="check" disabled={mesgulA} aria-busy={mesgulA || undefined} onClick={anahtarKaydet}>Anahtarı kaydet</Tus>
            {v.yz.anahtar.tanimli && <Tus tur="ikincil" disabled={mesgulA}
              onClick={() => { setYeni(null); requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-yz-degistir]")?.focus()); }}>Vazgeç</Tus>}
          </div>
        </>}
        <FormIzgara>
          {/* 2026-10-14 (reisim: "tek seçenek claude haiku 5.5 olsun"): tek model — seçim yok, adı ve fiyatı yazar */}
          <div>
            <p className={stil.etiket}>Model</p>
            <span className={stil.anahtar}>{YZ_MODEL[0]}</span>
            <span className={stil.altSatir}>{YZ_MODEL[1]}</span>
          </div>
          <Alan id={ZID.sinir} etiket="Kişi başı aylık sınır ($)" hata={s.h.sinir} sonuc={s.h.sinir ? undefined : "Boş: sınırsız. Dolunca o ay yalnız yönetici artırır."}>
            <Girdi id={ZID.sinir} value={s.d.sinir} inputMode="decimal" maxLength={8} disabled={!v.yaz} hata={!!s.h.sinir} mesajli onChange={(e) => s.setD({ ...s.d, sinir: e.target.value })} />
          </Alan>
        </FormIzgara>
        {!v.yz.anahtar.tanimli && <Serit tur="uyari" ikon="key-round">Anahtar girilmedi: fotoğraftan okuma ve S.A.Y çalışmaz.</Serit>}
        <p className={stil.etiket}>Bu ay kullanım (kişi başına)</p>
        {v.yz.kullanim.length
          ? <Liste baslik="Yapay zekâ kullanımı" sutunlar={yzSutunlari(v.yz.deger.sinir)} kayitlar={v.yz.kullanim} anahtar={(x) => x.id} />
          : <p className={stil.ipucu}>Bu ay henüz yapay zekâ kullanılmadı.</p>}
      </>}
    </Kart>
  );
}

/* ── E-POSTA (536; maket postaCiz 535 — reisim: "kim mail gönder tuşuna basarsa onun mailinden gitmeli" → "A seçeneğini kabul ediyorum" → maket
   "onaylıyorum"): kurulum adımları (anahtar yokken), Resend API anahtarı (bir kez yazılır, son 4), gönderen alan adı ve gönderene gizli kopya (bölüm
   Kaydet'i), "Kimden gider" kuralları, deneme e-postası (tuşa basanın adresine), çalışanların e-postası nereden gider (kayıtlı alan adına göre) ── */
type EpostaKisi = Veri["eposta"]["kisiler"][number];
const EID = { anahtar: "w-ay-ep-anahtar", alan: "w-ay-ep-alan" } as const;
const epostaSutunlari: Sutun<EpostaKisi>[] = [
  { k: "kisi", genislik: "34%", baslik: "Kişi", kart: "ust", sira: 1, siralanmaz: true, hucre: (x) => <>{x.ad}<span className={stil.altSatir}>{x.roller}</span></> },
  { k: "adres", genislik: "36%", baslik: "E-posta", kart: "govde", sira: 2, siralanmaz: true, hucre: (x) => <><KartEtiket>E-posta</KartEtiket>{x.eposta}</> },
  { k: "yol", genislik: "30%", baslik: "E-postası nereden gider", kart: "rozet", sira: 1, siralanmaz: true, hucre: (x) => x.yol === "kendi"
    ? <Rozet tur="tamam">Kendi adresinden</Rozet>
    : <><Rozet tur="bekliyor">Rapor e-postasından</Rozet><span className={stil.altSatir}>kişinin adıyla, cevap kişiye</span></> },
];
function Eposta({ v }: { v: Veri }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [mesgulA, baslatA] = useTransition();
  const s = useKesim("eposta", { alan: v.eposta.deger.alan, kopya: v.eposta.deger.kopya }, v.eposta.surum);
  const [yeni, setYeni] = useState<null | { deger: string; hata: string | null }>(v.eposta.anahtar.tanimli ? null : { deger: "", hata: null });
  const kayitli = v.eposta.deger.alan, hazir = v.eposta.anahtar.tanimli && !!kayitli;
  const genelUygun = !!kayitli && v.eposta.genel.trim().toLowerCase().endsWith(`@${kayitli}`);
  const ornek = v.eposta.kisiler.find((x) => x.yol === "kendi");
  const anahtarKaydet = () => baslatA(async () => {
    if (!yeni) return;
    const r = await epostaAnahtarEylemi({ anahtar: yeni.deger });
    if (!r.tamam) { setYeni({ deger: "", hata: r.hatalar?.anahtar ?? r.genel ?? "Kaydedilemedi." }); requestAnimationFrame(() => document.getElementById(EID.anahtar)?.focus()); return; }
    setYeni(null); bildir(r.bildirim ?? "Resend API anahtarı kaydedildi."); router.refresh();
    requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-ep-degistir]")?.focus());
  });
  const anahtarKaldir = async () => {
    if (!(await onayla({ baslik: "Resend API anahtarını kaldır", metin: "Yeni anahtar girilene kadar e-postalar gönderilmez, sırada bekler.", tus: "Kaldır", tehlike: true }))) return;
    baslatA(async () => {
      const r = await epostaAnahtarEylemi(null); bildir(r.tamam ? r.bildirim ?? "Kaldırıldı." : r.genel ?? "Kaldırılamadı.");
      if (r.tamam) { setYeni({ deger: "", hata: null }); router.refresh(); requestAnimationFrame(() => document.getElementById(EID.anahtar)?.focus()); }
    });
  };
  const deneme = () => baslatA(async () => {
    const r = await denemeEpostasiEylemi();
    bildir(r.tamam ? r.bildirim ?? "Deneme e-postası gönderildi." : r.genel ?? "Deneme e-postası gönderilemedi.");
    router.refresh();
  });
  return (
    <Kart kesim="eposta" genis yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec} sayac={hazir ? `bağlı · ${kayitli}` : "bağlı değil"}>
      <p className={stil.ipucuUst}>Plan bildirimi, teklif, rapor gibi e-postalar firmanın kendi Resend hesabıyla gider; ücreti firmanındır (ayda 3.000, günde 100 e-postaya kadar
        ücretsiz). Kim gönder tuşuna basarsa e-posta onun adresinden gider.</p>
      {!v.eposta.anahtar.tanimli && <><p className={stil.etiket}>Kurulum</p><ol className={stil.bilgiListe}>{RESEND_ADIMLAR.map((x) => <li key={x}>{x}</li>)}</ol></>}
      {yeni === null ? <><p className={stil.etiket}>Resend API anahtarı</p><div className={stil.dosyaSatir}>
        <span className={stil.anahtar}>…{v.eposta.anahtar.son4} kayıtlı</span>
        {v.yaz && <><Tus tur="ikincil" ikon="pencil" disabled={mesgulA} data-ep-degistir="" onClick={() => { setYeni({ deger: "", hata: null }); requestAnimationFrame(() => document.getElementById(EID.anahtar)?.focus()); }}>Değiştir</Tus>
          <Tus tur="ikincil" ikon="trash-2" disabled={mesgulA} onClick={anahtarKaldir} aria-label="Resend API anahtarını kaldır">Kaldır</Tus></>}
      </div></> : v.yaz && <>
        <Alan id={EID.anahtar} etiket="Resend API anahtarı" genis hata={yeni.hata ?? undefined} sonuc={yeni.hata ? undefined : "re_ ile başlar. Şifreli saklanır, bir daha gösterilmez."}>
          <Girdi id={EID.anahtar} type="password" value={yeni.deger} maxLength={210} spellCheck={false} hata={!!yeni.hata} mesajli onChange={(e) => setYeni({ deger: e.target.value, hata: null })} />
        </Alan>
        <div className={stil.tuslar}>
          <Tus ikon="check" disabled={mesgulA} aria-busy={mesgulA || undefined} onClick={anahtarKaydet}>Anahtarı kaydet</Tus>
          {v.eposta.anahtar.tanimli && <Tus tur="ikincil" disabled={mesgulA}
            onClick={() => { setYeni(null); requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-ep-degistir]")?.focus()); }}>Vazgeç</Tus>}
        </div>
      </>}
      <FormIzgara>
        <Alan id={EID.alan} etiket="Gönderen alan adı" hata={s.h.alan} sonuc={s.h.alan ? undefined : "Resend'de doğrulanmış alan adı; bu alan adındaki her adresten gönderilir."}>
          <Girdi id={EID.alan} value={s.d.alan} maxLength={100} disabled={!v.yaz} hata={!!s.h.alan} mesajli spellCheck={false} placeholder="firmaniz.com.tr" inputMode="url"
            onChange={(e) => s.setD({ ...s.d, alan: e.target.value })} />
        </Alan>
        <div>
          <p className={stil.etiket} id="w-ay-ep-kopya">Gönderene gizli kopya</p>
          <div role="radiogroup" aria-labelledby="w-ay-ep-kopya" className={stil.secenekler}>
            {([[false, "Kapalı"], [true, "Açık"]] as const).map(([d, ad]) => (
              <label key={ad} className={stil.secenek}><input type="radio" name="w-ay-ep-kopya" checked={s.d.kopya === d} disabled={!v.yaz} onChange={() => s.setD({ ...s.d, kopya: d })} /><span>{ad}</span></label>
            ))}
          </div>
          <p className={stil.ipucu}>Açıksa gönderen, e-postanın bir kopyasını kendi kutusunda görür.</p>
        </div>
      </FormIzgara>
      {!v.eposta.anahtar.tanimli && <Serit tur="uyari" ikon="key-round">Anahtar girilmedi: e-postalar gönderilmez, sırada bekler; anahtar girilince gider.</Serit>}
      <p className={stil.etiket}>Kimden gider</p>
      <ul className={stil.bilgiListe}>
        <li>Kim gönder tuşuna basarsa onun adresinden: adresi {kayitli ? <b>@{kayitli}</b> : "firmanın alan adı"} ile biten çalışan
          {ornek ? <> (ör. {ornek.ad} &lt;{ornek.eposta}&gt;)</> : null}; cevap da ona gelir.</li>
        <li>Adresi başka alan adında olan (kişisel posta) ya da adresi olmayan: Rapor e-postasından, kişinin adıyla gider; cevap kişiye gelir.</li>
        <li>Otomatik e-postalar (hatırlatmalar; kimsenin basmadığı): Rapor e-postası{v.eposta.genel ? <> <b>{v.eposta.genel}</b></> : " (Firma bilgileri'nde girilmedi)"}.</li>
      </ul>
      {kayitli && !genelUygun && <Serit tur="uyari" ikon="triangle-alert">Rapor e-postası @{kayitli} alan adında değil: otomatik e-postalar ve kişisel adreslilerin e-postaları gönderilemez, sırada bekler. Firma bilgileri&apos;nde düzeltin.</Serit>}
      {v.yaz && <div className={stil.tuslar}>
        <Tus tur="ikincil" ikon="send" disabled={!hazir || mesgulA} aria-busy={mesgulA || undefined} onClick={deneme}>Deneme e-postası gönder</Tus>
      </div>}
      <p className={stil.ipucu}>Deneme e-postası sizin adresinize gider{v.eposta.ben ? ` (${v.eposta.ben})` : ""}. Bu ay gönderilen: {v.eposta.ay.toLocaleString("tr-TR")} e-posta.</p>
      <p className={stil.etiket}>Çalışanların e-postası nereden gider</p>
      <Liste baslik="Çalışanların e-postası nereden gider" sutunlar={epostaSutunlari} kayitlar={v.eposta.kisiler} anahtar={(x) => x.id} />
    </Kart>
  );
}

/* ── SAYFA ── */
const SIRA: AyarKesimi[] = ["firma", "imza", "zimmet", "saklama", "onbilgi", "bordro", "mesai", "esik", "kod", "bulut", "fiyat", "sabit", "depo", "yz", "eposta", "mbelge", "ice"];
export function FirmaAyarlari({ v }: { v: Veri }) {
  return (
    <>
      <SayfaBasi baslik="Firma ayarları" />
      {!v.yaz && <Serit tur="bilgi" ikon="info">Ayarları görüyorsunuz; değiştirmek için Firma ayarlarında &quot;değiştirir&quot; yetkisi gerekir.</Serit>}
      <div className={stil.duzen}>
        <nav className={stil.nav} aria-label="Ayar bölümleri">
          <ul className={stil.navListe}>
            {SIRA.map((k) => <li key={k}><a className={stil.navOge} href={`#${bolumId(k)}`} onClick={(e) => {
              e.preventDefault(); const h = document.getElementById(bolumId(k)); if (h) { h.scrollIntoView({ block: "start" }); h.focus({ preventScroll: true }); }
            }}>{AYAR_BASLIK[k]}</a></li>)}
          </ul>
        </nav>
        <div className={stil.izgara}>
          <FirmaBilgileri v={v} />
          <ImzaYontemi v={v} />
          <ZimmetFormu v={v} />
          <Saklama v={v} />
          <SablonDosyasi v={v} ne="on_bilgi" kesim="onbilgi" bos={`Firma formatı yüklenmedi; müşteriye temel format (${onBilgiFormKodu(v.kod)}) gider.`}
            kaldirSonu={`müşterilere temel format (${onBilgiFormKodu(v.kod)}) gider.`} />
          <SablonDosyasi v={v} ne="bordro_format" kesim="bordro" bos="Bordro formatı yüklenmedi; Muhasebe bordroları kişi kişi elle yükler."
            kaldirSonu="bordrolar kişi kişi elle yüklenir." />
          <Mesai v={v} />
          <Esikler v={v} />
          <RaporNumarasi v={v} />
          <IkinciKopya v={v} />
          <FiyatListesi v={v} />
          <SabitGiderler v={v} />
          <SupabaseYedek v={v} />
          <YapayZeka v={v} />
          <Eposta v={v} />
          <MusteriBelgeleri v={v} />
          <Kart kesim="ice" genis yaz={false} kirli={false} mesgul={false} kaydet={() => undefined} vazgec={() => undefined}>
            <IceAktarma gecmis={v.ice} yaz={v.yaz} />
          </Kart>
        </div>
      </div>
    </>
  );
}
