"use client";
/* FİRMA AYARLARI (334; maket firma-ayarlari.html + maket-ayarlar.js — firmaBilgiCiz, ayarCiz, ayarDigerCiz, Z1 taslak + bölüm Kaydet): geniş
   ekranda solda bölüm listesi, bölümler kart, iki sütunlu yerleşim (sabit giderler tam genişlik); telefonda tek sütun. Değişiklik bölümün
   Kaydet tuşuyla kaydedilir; geçersiz değer kaydedilmez, alanın altında söylenir. Dosyalar (logo, ön bilgilendirme formu, bordro formatı)
   seçilince hemen yüklenir; kaldırmak önce sorulur. "Gör" düzeyinde salt okunur. Karar ve doğrulama sunucuda (server/ayarlar.ts). */
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { DosyaAcTusu, GizliResim } from "../../../components/gizli-resim/GizliResim";
import { useOnayla } from "../../../components/pencere/Onay";
import { SayfaBasi } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import {
  AYAR_BASLIK, AYAR_DOSYASI, BULUT_DUZEN, BULUT_SAGLAYICI, ESIK, IMZA_YONTEM, NUSHA, SAKLAMA_YIL, YASAL, YEDEK_GUN, YEDEK_SIK, YZ_MODEL, kodBuyut, onBilgiFormKodu,
  type AyarDosyasi, type AyarKesimi, type EsikAdi,
} from "../sema";
import type { FirmaAyarlari as Veri } from "../server/ayarlar";
import { ayarDosyasiEylemi, ayarKaydetEylemi, belgeTuruEkleEylemi, belgeTuruKaldirEylemi, firmaKoduKaydetEylemi, yzAnahtarEylemi, type AyarYaniti } from "./eylemler";
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
      <p className={stil.ipucu}>Süre dolunca imzalı rapor PDF&apos;leri ve aylık arşiv yedekleri deponuzdan silinir; silinecekler 30 gün önce size listelenir.</p>
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

/* ── BULUT KAYDI (336; maket bulutCiz Ö2): sağlayıcı, klasör düzeni, ana klasör; hesap bağlantısı ve kendiliğinden kayıt K5 ── */
const BID = { s: "w-ay-bulut-s", d: "w-ay-bulut-d", kok: "w-ay-bulut-kok" } as const;
function BulutKaydi({ v }: { v: Veri }) {
  const s = useKesim("bulut", v.bulut.deger, v.bulut.surum);
  const sg = s.d.saglayici ? BULUT_SAGLAYICI[s.d.saglayici] : null;
  const ornek = `${s.d.kok || "…"} / ${s.d.duzen === "my" ? "Müşteri / 2026" : s.d.duzen === "mty" ? "Müşteri / Tesis / 2026" : "Müşteri / Tesis"} / RAPOR-NO.pdf`;
  return (
    <Kart kesim="bulut" yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec} sayac="bağlı değil">
      <p className={stil.ipucuUst}>Rapor imzalanınca imzalı PDF müşterinin bulut klasörüne kendiliğinden kaydedilir. Müşteri başına aç / kapa ve klasör adı müşteri kartında.</p>
      <FormIzgara>
        <Alan id={BID.s} etiket="Bulut" hata={s.h.saglayici}>
          <SecimAlani id={BID.s} ad="Bulut" deger={s.d.saglayici} kapali={!v.yaz} secenekler={[["", "Seçilmedi"], ...(Object.keys(BULUT_SAGLAYICI) as (keyof typeof BULUT_SAGLAYICI)[]).map((k) => [k, BULUT_SAGLAYICI[k][0]] as const)]}
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
      {sg?.[1] && <Serit tur="uyari" ikon="triangle-alert">{sg[0]} verileri Türkiye dışında saklayabilir: raporlar yurt dışına çıkar (KVKK sorumluluğu firmanın). Kendi sunucunuz seçeneği veriyi Türkiye&apos;de tutar.</Serit>}
      <Serit tur="bilgi" ikon="info">Hesap bağlantısı ve imzalanan raporların kendiliğinden kaydı yayına çıkışla açılır; ayarlar şimdiden kaydedilir.</Serit>
    </Kart>
  );
}

/* ── DEPOLAMA VE YEDEK (336; maket depoCiz — G2/G3 "elle yedekleme olmasın", "kendi depolarında da yedekleri ve raporlar düzenli arşivlensin") ── */
const YID = { sik: "w-ay-yedek-sik", saat: "w-ay-yedek-saat", gun: "w-ay-yedek-gun" } as const;
const SAAT = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
/** sonraki yedek (Türkiye saati) — maket sonrakiYedek */
function sonrakiYedek(sik: string, saat: string): string {
  const p = Object.fromEntries(SAAT.formatToParts(new Date()).map((x) => [x.type, x.value]));
  const gun = `${p.year}-${p.month}-${p.day}`, simdi = Number(p.hour);
  const ekle = (g: string, n: number) => { const d = new Date(`${g}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const yaz = (g: string, s: number) => `${g.slice(8, 10)}.${g.slice(5, 7)}.${g.slice(0, 4)} ${String(s).padStart(2, "0")}:00`;
  if (sik === "saatlik") return simdi + 1 > 23 ? yaz(ekle(gun, 1), 0) : yaz(gun, simdi + 1);
  const s = Number(saat);
  if (sik === "gunluk") return s > simdi ? yaz(gun, s) : yaz(ekle(gun, 1), s);
  const hafta = (8 - new Date(`${gun}T12:00:00Z`).getUTCDay()) % 7;   // Pazartesi
  return hafta === 0 && s > simdi ? yaz(gun, s) : yaz(ekle(gun, hafta || 7), s);
}
function DepoYedek({ v }: { v: Veri }) {
  const s = useKesim("depo", { sik: v.yedek.deger.sik, saat: v.yedek.deger.saat, gun: String(v.yedek.deger.gun) }, v.yedek.surum, (d) => ayarKaydetEylemi("yedek", v.yedek.surum, d));
  return (
    <Kart kesim="depo" genis yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec}>
      <p className={stil.etiketUst}>Firmanın deposu</p>
      <Serit tur="bilgi" ikon="info">Deneme yayınında dosyalar uygulamanın deposunda. Firmanın kendi S3 uyumlu deposu yayına çıkışta bağlanır; depo olmadan firma açılmaz.</Serit>
      <p className={stil.etiket}>Düzenli arşiv (kendiliğinden)</p>
      <ul className={stil.bilgiListe}>
        <li><b>Rapor arşivi</b> · arsiv/raporlar/YIL/Müşteri/ — imzalanan her rapor PDF&apos;i hemen yazılır</li>
        <li><b>Otomatik silme</b> · saklama süresi dolunca ({v.saklama.deger.yil} yıl); raporlar ve aylık yedekler, silinecekler 30 gün önce listelenir</li>
      </ul>
      <Serit tur="bilgi" ikon="info">probata saklama süresi dolmadan hiçbir dosyayı silmez. Deponuzda dosyaları kendiniz silerseniz geri getirilemez; bu sorumluluk firmanızındır.</Serit>
      <p className={stil.etiket}>Yedek (kendiliğinden)</p>
      <FormIzgara>
        <Alan id={YID.sik} etiket="Sıklık" hata={s.h.sik}>
          <SecimAlani id={YID.sik} ad="Yedek sıklığı" deger={s.d.sik} kapali={!v.yaz} secenekler={(Object.keys(YEDEK_SIK) as (keyof typeof YEDEK_SIK)[]).map((k) => [k, YEDEK_SIK[k]] as const)}
            degistir={(x) => s.setD({ ...s.d, sik: x as typeof s.d.sik })} />
        </Alan>
        <Alan id={YID.saat} etiket="Saat (günlük, haftalık)" hata={s.h.saat}>
          <SecimAlani id={YID.saat} ad="Yedek saati" deger={s.d.saat} kapali={!v.yaz || s.d.sik === "saatlik"}
            secenekler={Array.from({ length: 24 }, (_, i) => { const x = String(i).padStart(2, "0"); return [x, `${x}:00`] as const; })} degistir={(x) => s.setD({ ...s.d, saat: x })} />
        </Alan>
        <Alan id={YID.gun} etiket="Yedeklerin saklanması" hata={s.h.gun} sonuc={`Her ayın ilk yedeği ${v.saklama.deger.yil} yıl saklanır. Sonraki yedek: ${sonrakiYedek(s.d.sik, s.d.saat)}.`}>
          <SecimAlani id={YID.gun} ad="Yedeklerin saklanması" deger={s.d.gun} kapali={!v.yaz} tanim={ipucuId(YID.gun)}
            secenekler={YEDEK_GUN.map((g) => [String(g), `${g} gün`] as const)} degistir={(x) => s.setD({ ...s.d, gun: x })} />
        </Alan>
      </FormIzgara>
      <p className={stil.ipucu}>Son yedekler: henüz yedek alınmadı — yedek işi yayına çıkışla kendiliğinden çalışır (elle yedek yok).</p>
    </Kart>
  );
}

/* ── YAPAY ZEKÂ (336; maket yzCiz Y1): aç / kapa, yurt dışı uyarısı, API anahtarı (bir kez yazılır, son 4), model, kişi başı aylık sınır ── */
const ZID = { anahtar: "w-ay-yz-anahtar", model: "w-ay-yz-model", sinir: "w-ay-yz-sinir" } as const;
function YapayZeka({ v }: { v: Veri }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [mesgulA, baslatA] = useTransition();
  const s = useKesim("yz", { acik: v.yz.deger.acik, model: v.yz.deger.model, sinir: v.yz.deger.sinir === null ? "" : String(v.yz.deger.sinir).replace(".", ",") }, v.yz.surum);
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
          <Alan id={ZID.model} etiket="Model" hata={s.h.model} sonuc={YZ_MODEL[s.d.model][1]}>
            <SecimAlani id={ZID.model} ad="Model" deger={s.d.model} kapali={!v.yaz} tanim={ipucuId(ZID.model)} secenekler={(Object.keys(YZ_MODEL) as (keyof typeof YZ_MODEL)[]).map((k) => [k, YZ_MODEL[k][0]] as const)}
              degistir={(x) => s.setD({ ...s.d, model: x as typeof s.d.model })} />
          </Alan>
          <Alan id={ZID.sinir} etiket="Kişi başı aylık sınır ($)" hata={s.h.sinir} sonuc={s.h.sinir ? undefined : "Boş: sınırsız. Dolunca o ay yalnız yönetici artırır."}>
            <Girdi id={ZID.sinir} value={s.d.sinir} inputMode="decimal" maxLength={8} disabled={!v.yaz} hata={!!s.h.sinir} mesajli onChange={(e) => s.setD({ ...s.d, sinir: e.target.value })} />
          </Alan>
        </FormIzgara>
        {!v.yz.anahtar.tanimli && <Serit tur="uyari" ikon="key-round">Anahtar girilmedi: fotoğraftan okuma ve S.A.Y çalışmaz.</Serit>}
        <p className={stil.ipucu}>Bu ay kullanım: henüz yok. Kullanım kişi başına burada listelenir.</p>
      </>}
    </Kart>
  );
}

/* ── SAYFA ── */
const SIRA: AyarKesimi[] = ["firma", "imza", "zimmet", "saklama", "onbilgi", "bordro", "mesai", "esik", "kod", "bulut", "fiyat", "sabit", "depo", "yz", "mbelge"];
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
          <BulutKaydi v={v} />
          <FiyatListesi v={v} />
          <SabitGiderler v={v} />
          <DepoYedek v={v} />
          <YapayZeka v={v} />
          <MusteriBelgeleri v={v} />
        </div>
      </div>
    </>
  );
}
