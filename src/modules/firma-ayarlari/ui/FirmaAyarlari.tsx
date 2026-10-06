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
import { AYAR_BASLIK, AYAR_DOSYASI, ESIK, IMZA_YONTEM, NUSHA, SAKLAMA_YIL, YASAL, type AyarDosyasi, type AyarKesimi, type EsikAdi } from "../sema";
import type { FirmaAyarlari as Veri } from "../server/ayarlar";
import { ayarDosyasiEylemi, ayarKaydetEylemi, belgeTuruEkleEylemi, belgeTuruKaldirEylemi, firmaKoduKaydetEylemi, type AyarYaniti } from "./eylemler";
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

function useKesim<T>(kesim: AyarKesimi, ilk: T, surum: number, gonder?: (d: T) => Promise<AyarYaniti>) {
  const router = useRouter();
  const bildir = useBildir();
  const [mesgul, baslat] = useTransition();
  const [d, setD] = useState<T>(ilk);
  const [h, setH] = useState<Record<string, string>>({});
  /* sunucudaki değer değişince (kaydettikten sonra yenileme — biçim düzelmiş olabilir) taslak ona eşitlenir */
  const ilkJson = JSON.stringify(ilk);
  const [son, setSon] = useState(ilkJson);
  if (son !== ilkJson) { setSon(ilkJson); setD(ilk); setH({}); }
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
    setH({}); bildir(r.bildirim ?? `${AYAR_BASLIK[kesim]} kaydedildi.`); router.refresh();
    requestAnimationFrame(() => document.getElementById(bolumId(kesim))?.focus());
  });
  const vazgec = () => { setD(ilk); setH({}); bildir(`${AYAR_BASLIK[kesim]}: değişiklikler geri alındı.`); document.getElementById(bolumId(kesim))?.focus(); };
  return { d, setD, h, kirli, mesgul, kaydet, vazgec };
}

/* ── dosya ayarı (logo, ön bilgilendirme formu, bordro formatı): seçilince yüklenir ── */
function DosyaAyari({ ne, dosya, surum, yaz, bos, resim = false }: { ne: AyarDosyasi; dosya: { id: string; ad: string } | null; surum: number; yaz: boolean; bos: string; resim?: boolean }) {
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
  });
  const kaldir = async () => {
    if (await onayla({ baslik: `${t.ad} kaldırılsın mı?`, metin: ne === "logo" ? "Raporların ve belgelerin başlığında logo yerinde boş kutu çıkar." : bos, tus: "Kaldır", tehlike: true })) gonder(null);
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
        <Tus tur="ikincil" ikon="upload" disabled={mesgul} aria-busy={mesgul || undefined} onClick={() => secici.current?.click()}>{dosya ? "Değiştir" : `${t.ad === "Firma logosu" ? "Logo" : t.ad} yükle`}</Tus>
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
        {g("eposta", ID.eposta, "Rapor e-postası", 120, { sonuc: "Müşteriye giden rapor ve bildirimler bu adresten", tur: "email" })}
        {g("akr", ID.akr, "Akreditasyon no", 20, { sonuc: "TÜRKAK markasının yanında" })}
        <Alan id={ID.nusha} etiket="Rapor nüsha sayısı" hata={s.h.nusha}>
          <SecimAlani id={ID.nusha} ad="Rapor nüsha sayısı" deger={s.d.nusha} kapali={!v.yaz} secenekler={NUSHA.map((n) => [String(n), `${n} nüsha`] as const)}
            degistir={(x) => s.setD({ ...s.d, nusha: x })} />
        </Alan>
      </FormIzgara>
      <p className={stil.etiket}>Firma logosu</p>
      <DosyaAyari ne="logo" dosya={v.dosyalar.logo} surum={v.dosyalar.surum.firma} yaz={v.yaz} resim
        bos="Logo yüklenmedi; raporların başlığında logo yeri boş çıkar. PNG ya da JPEG, en çok 2 MB." />
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
        <SecimAlani id={ID.zeden} ad="Teslim eden (başlangıç)" deger={s.d.teslim_eden} kapali={!v.yaz} tanim={ipucuId(ID.zeden)}
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
        <SecimAlani id={ID.yil} ad="Saklama süresi" deger={s.d.yil} kapali={!v.yaz}
          secenekler={SAKLAMA_YIL.map((y) => [String(y), `${y} yıl${y === 5 ? " (yasal en az)" : ""}`] as const)} degistir={(x) => s.setD({ yil: x })} />
      </Alan>
      <p className={stil.ipucu}>Süre dolunca imzalı rapor PDF&apos;leri ve aylık arşiv yedekleri deponuzdan silinir; silinecekler 30 gün önce size listelenir.</p>
    </Kart>
  );
}

function SablonDosyasi({ v, ne, kesim, bos }: { v: Veri; ne: "on_bilgi" | "bordro_format"; kesim: AyarKesimi; bos: string }) {
  return (
    <Kart kesim={kesim} yaz={false} kirli={false} mesgul={false} kaydet={() => undefined} vazgec={() => undefined}>
      <DosyaAyari ne={ne} dosya={v.dosyalar[ne]} surum={v.dosyalar.surum.sablon} yaz={v.yaz} bos={bos} />
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
              <SecimAlani id={id} ad={ad} deger={s.d[k]} kapali={!v.yaz} tanim={ipucuId(id)} secenekler={sec.map((g) => [String(g), `${g} gün`] as const)}
                degistir={(x) => s.setD({ ...s.d, [k]: x })} />
            </Alan>
          );
        })}
      </FormIzgara>
    </Kart>
  );
}

function RaporNumarasi({ v }: { v: Veri }) {
  const s = useKesim("kod", { kod: v.kod }, 0, (d) => firmaKoduKaydetEylemi(d));
  return (
    <Kart kesim="kod" yaz={v.yaz} kirli={s.kirli} mesgul={s.mesgul} kaydet={s.kaydet} vazgec={s.vazgec}>
      <Alan id={ID.kod} etiket="Firma kodu" hata={s.h.kod} sonuc={s.h.kod ? undefined : `Yeni rapor: ${/^[A-Za-z]{2}$/.test(s.d.kod) ? s.d.kod.toLocaleUpperCase("tr") : v.kod}-AAYY-SIRA-…; açılmış raporların numarası değişmez.`}>
        <Girdi id={ID.kod} value={s.d.kod} maxLength={2} autoCapitalize="characters" disabled={!v.yaz} hata={!!s.h.kod} mesajli className={stil.kod}
          onChange={(e) => s.setD({ kod: e.target.value })} />
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
            onClick={() => { s.setD({ kalemler: l.filter((_, j) => j !== i) }); requestAnimationFrame(() => document.getElementById(bolumId("sabit"))?.focus()); }}>Kaldır</Tus>}
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
  const s = useKesim("fiyat", ilk, 0);
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
  const s = useKesim("mbelge", { secili: [...v.mbelge.deger.secili].sort() }, v.mbelge.surum);
  const [ekle, setEkle] = useState<null | { ad: string; kisisel: boolean; hata: string | null }>(null);
  const sec = new Set(s.d.secili);
  const hassas = v.mbelge.turler.filter((t) => t.kisisel && sec.has(t.k));
  const turEkle = () => baslatTur(async () => {
    if (!ekle) return;
    const r = await belgeTuruEkleEylemi({ ad: ekle.ad, kisisel: ekle.kisisel });
    if (!r.tamam) { setEkle({ ...ekle, hata: r.hatalar?.ad ?? r.genel ?? "Eklenemedi." }); requestAnimationFrame(() => document.getElementById(BT.ad)?.focus()); return; }
    setEkle(null); bildir(r.bildirim ?? "Eklendi."); router.refresh();
  });
  const turKaldir = async (k: string, ad: string) => {
    if (!(await onayla({ baslik: "Belge türünü kaldır", metin: `${ad} listeden ve müşteriye açık belgelerden kalkar.`, tus: "Kaldır", tehlike: true }))) return;
    baslatTur(async () => {
      const r = await belgeTuruKaldirEylemi(k);
      bildir(r.tamam ? r.bildirim ?? "Kaldırıldı." : r.genel ?? "Kaldırılamadı.");
      if (r.tamam) { router.refresh(); requestAnimationFrame(() => document.getElementById(bolumId("mbelge"))?.focus()); }
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
            <Tus tur="ikincil" ikon="x" disabled={mesgulTur} aria-label={`${t.ad} türünü kaldır`} onClick={() => turKaldir(t.k, t.ad)}>Kaldır</Tus></div>
            : <div key={t.k}>{kutu}</div>;
        })}
      </fieldset>
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

/* ── SAYFA ── */
const SIRA: AyarKesimi[] = ["firma", "imza", "zimmet", "saklama", "onbilgi", "bordro", "mesai", "esik", "kod", "fiyat", "sabit", "mbelge"];
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
          <SablonDosyasi v={v} ne="on_bilgi" kesim="onbilgi" bos="Firma formatı yüklenmedi; müşteriye temel format (KM-FR-OBF-01) gider." />
          <SablonDosyasi v={v} ne="bordro_format" kesim="bordro" bos="Bordro formatı yüklenmedi; Muhasebe bordroları kişi kişi elle yükler." />
          <Mesai v={v} />
          <Esikler v={v} />
          <RaporNumarasi v={v} />
          <FiyatListesi v={v} />
          <SabitGiderler v={v} />
          <MusteriBelgeleri v={v} />
        </div>
      </div>
    </>
  );
}
