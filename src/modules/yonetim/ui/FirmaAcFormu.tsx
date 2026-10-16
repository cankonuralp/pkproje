"use client";
/* YÖNETİM › FİRMA AÇ (348; maket yonetim.html formCiz / denetle / firma-ac): ünvandan alt alan adı ve kısa kod önerilir (elle değiştirilen alanı
   öneri ezmez), adres canlı görünür; ilk firma yöneticisi ad + e-posta; depo bölümü (firmanın kendi deposu K7'de — bugün bilgi). Denetim aynı
   şemayla (sema.ts) önce burada, karar sunucuda ve veritabanında. "Firmayı aç" önce sorulur. Açılınca geçici parola YALNIZ bu ekranda bir kez
   gösterilir (kaydedilmez; sayfadan çıkınca yok). */
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type InputHTMLAttributes } from "react";
import { BilgiListesi, Bilgi } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormBolum, FormEylem, FormIzgara, FormSayfa, Girdi } from "../../../components/form/Form";
import { useKopyala } from "../../../components/pencere/Kopyala";
import { useOnayla } from "../../../components/pencere/Onay";
import { Bolum, Kirinti, Kod, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { firmaAcSemasi, oneri } from "../sema";
import { firmaAcEylemi } from "./eylemler";
import { SUPABASE_ADIMLAR } from "../../firma-ayarlari/sema";
import { DEPO_AD, DEPO_NOT, firmaAdresi, type DepoTuru } from "./ortak";
import { SonrasiAdimlar } from "./SonrasiAdimlar";
import stil from "./yonetim.module.css";

type Alanlar = { unvan: string; alt: string; kod: string; yon: string; eposta: string };
const BOS: Alanlar = { unvan: "", alt: "", kod: "", yon: "", eposta: "" };
const SIRA: (keyof Alanlar)[] = ["unvan", "alt", "kod", "yon", "eposta"];
const ID: Record<keyof Alanlar, string> = { unvan: "y-unvan", alt: "y-alt", kod: "y-kod", yon: "y-yon", eposta: "y-eposta" };
/** FV10: kendi projede kurulumda girilen yapay zekâ anahtarı alanı */
const YZ_ALAN = "ya-yz";

export function FirmaAcFormu({ anaAlan, depo, kendiProje = false }: { anaAlan: string; depo: DepoTuru; kendiProje?: boolean }) {
  const router = useRouter();
  const [d, setD] = useState<Alanlar>(BOS);
  /* FV10: veritabanı — kendi Supabase projesi (probata panelden kurar; anahtar + örgüt ortamdaysa) ya da ortak proje */
  const [vt, setVt] = useState<"kendi" | "ortak">(kendiProje ? "kendi" : "ortak");
  const [yz, setYz] = useState("");
  const [yzHata, setYzHata] = useState<string | null>(null);
  const elle = useRef<{ alt: boolean; kod: boolean }>({ alt: false, kod: false });
  const [hatalar, setHatalar] = useState<Partial<Record<keyof Alanlar, string>>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const [acilan, setAcilan] = useState<{ id: string; parola: string; eposta: string; alt: string; unvan: string } | null>(null);
  const [bekliyor, baslat] = useTransition();
  const onayla = useOnayla();
  const bildir = useBildir();
  const kopya = useKopyala(acilan?.parola ?? null, "ya-parola");

  const degis = (k: keyof Alanlar, v: string) => {
    const yeni = { ...d, [k]: k === "alt" ? v.replace(/[A-Z]/g, (h) => h.toLowerCase()) : k === "kod" ? v.replace(/[a-z]/g, (h) => h.toUpperCase()) : v };
    if (k === "alt" || k === "kod") elle.current[k] = v !== "";
    if (k === "unvan") {
      const o = oneri(v);
      if (!elle.current.alt) yeni.alt = o.alt;
      if (!elle.current.kod) yeni.kod = o.kod;
    }
    setD(yeni);
    if (hatalar[k]) setHatalar({ ...hatalar, [k]: undefined });
  };
  /* FV10: yalnız yapay zekâ anahtarı hatalıysa odak o alana */
  const odakla = (h: Partial<Record<keyof Alanlar | "yz", string>>) => {
    const ilk = SIRA.find((k) => h[k]);
    const hedef = ilk ? ID[ilk] : h.yz ? YZ_ALAN : null;
    if (hedef) requestAnimationFrame(() => document.getElementById(hedef)?.focus());
  };

  const gonder = async () => {
    setGenel(null);
    const g = firmaAcSemasi().safeParse(d);
    if (!g.success) {
      const h: Partial<Record<keyof Alanlar, string>> = {};
      for (const i of g.error.issues) { const k = i.path[0] as keyof Alanlar; h[k] ??= i.message; }
      setHatalar(h); odakla(h); return;
    }
    const adres = firmaAdresi(g.data.alt, anaAlan);
    const metin = vt === "kendi"
      ? `${adres} için firmanın Supabase projesi açılıp kurulur (birkaç dakika; firma sayfasında izlenir). Bitince ${g.data.yon} için geçici parola oluşturursunuz.`
      : `${adres} hemen çalışır; ${g.data.yon} ilk girişte geçici parolayla girip kendi parolasını belirler.`;
    if (!(await onayla({ baslik: "Firma açılsın mı?", metin, tus: "Firmayı aç" }))) return;
    baslat(async () => {
      const f = new FormData();
      for (const k of SIRA) f.set(k, d[k]);
      f.set("vt", vt);
      if (vt === "kendi" && yz.trim()) f.set("yz", yz.trim());
      const r = await firmaAcEylemi(f);
      if (r.hatalar) { setYzHata(r.hatalar.yz ?? null); setHatalar(r.hatalar); odakla(r.hatalar); return; }
      if (r.tamam && r.id && r.kurulum) { bildir(`Kurulum başladı: ${firmaAdresi(r.alt ?? g.data.alt, anaAlan)}`); router.push(`/yonetim/f/${r.id}`); return; }
      if (!r.tamam || !r.id || !r.parola) { setGenel(r.genel ?? "Firma açılamadı."); return; }
      kopya.sifirla();
      setAcilan({ id: r.id, parola: r.parola, eposta: r.eposta ?? g.data.eposta, alt: r.alt ?? g.data.alt, unvan: g.data.unvan });
      setD(BOS); elle.current = { alt: false, kod: false };
      bildir(`Firma açıldı: ${firmaAdresi(r.alt ?? g.data.alt, anaAlan)}`);
      requestAnimationFrame(() => { window.scrollTo(0, 0); document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true }); });
    });
  };

  if (acilan) {
    const adres = firmaAdresi(acilan.alt, anaAlan);
    return (
      <>
        <Kirinti ogeler={[["Firmalar", "/yonetim"], ["Firma açıldı"]]} />
        <SayfaBasi baslik={acilan.unvan} tuslar={<TusBaglanti ikon="building-2" href={`/yonetim/f/${acilan.id}`}>Firma sayfası</TusBaglanti>} />
        <Bolum id="ya-b-giris" baslik="İlk giriş bilgileri">
          <SeritKap><Serit tur="uyari" ikon="triangle-alert">Geçici parola yalnız şimdi görünür; sayfadan çıkınca bir daha gösterilmez. Firma yöneticisine iletin; ilk girişte kendi parolasını belirler.</Serit></SeritKap>
          <BilgiListesi>
            <Bilgi etiket="Adres" genis="cift"><span className={stil.adresKod}>{`https://${adres}`}</span></Bilgi>
            <Bilgi etiket="Giriş adı" genis="cift">{acilan.eposta}</Bilgi>
          </BilgiListesi>
          <p className={stil.etiketUst}>Geçici parola</p>
          <p className={stil.geciciParola} id="ya-parola"><Kod>{acilan.parola}</Kod></p>
          {kopya.durum}
          <div className={stil.eylemSol}>{kopya.tus}</div>
        </Bolum>
        <SonrasiAdimlar />
      </>
    );
  }

  const alan = (k: keyof Alanlar, etiket: string, ek: InputHTMLAttributes<HTMLInputElement>, sonuc?: string, genis = false) => (
    <Alan id={ID[k]} etiket={etiket} zorunlu genis={genis} hata={hatalar[k]} sonuc={hatalar[k] ? undefined : sonuc}>
      <Girdi id={ID[k]} name={k} value={d[k]} hata={!!hatalar[k]} mesajli={!!sonuc || !!hatalar[k]} onChange={(e) => degis(k, e.target.value)} {...ek} />
    </Alan>
  );
  return (
    <>
      <Kirinti ogeler={[["Firmalar", "/yonetim"], ["Firma aç"]]} />
      <SayfaBasi baslik="Firma aç" />
      {genel && <SeritKap><Serit tur="hata" ikon="circle-alert">{genel}</Serit></SeritKap>}
      <form noValidate onSubmit={(e) => { e.preventDefault(); void gonder(); }}>
        <FormSayfa>
          <FormBolum baslik="Firma" id="y-b-firma">
            <FormIzgara>
              {alan("unvan", "Ticari ünvan", { maxLength: 160 }, undefined, true)}
              {alan("alt", "Alt alan adı", { maxLength: 30, spellCheck: false, autoCapitalize: "off", inputMode: "url" }, `Adres: ${d.alt.trim() ? firmaAdresi(d.alt.trim(), anaAlan) : `….${anaAlan}`}`)}
              {alan("kod", "Kısa kod (rapor no öneki)", { maxLength: 2, autoCapitalize: "characters" }, `Rapor no ${d.kod.trim() || "…"}-… ile başlar`)}
            </FormIzgara>
          </FormBolum>
          <FormBolum baslik="İlk firma yöneticisi" id="y-b-yon">
            <FormIzgara>
              {alan("yon", "Ad soyad", { maxLength: 80, autoComplete: "off" })}
              {alan("eposta", "E-posta (giriş adı)", { type: "email", inputMode: "email", maxLength: 120, spellCheck: false, autoCapitalize: "off" })}
            </FormIzgara>
          </FormBolum>
          {/* 2026-10-16 (FIRMA-VT FV10, K1 — reisim: "supabase ve resend bağlantılarını firma açarken biz buradan panelden yapalım"): veritabanı seçimi;
              kendi proje panelden kurulur (Yönetim API anahtarı + örgüt yoksa kapalı, açıklamalı). Önceki "firmanın hesabını bağla" akışı (D1) kalktı. */}
          <FormBolum baslik="Veritabanı (veriler, dosyalar, yedek)" id="y-b-depo" genis>
            <fieldset className={stil.vtSecim}>
              <legend className="gizli">Veritabanı</legend>
              <label className={stil.vtSecenek} data-kapali={kendiProje ? undefined : ""}>
                <input type="radio" name="vt" value="kendi" checked={vt === "kendi"} disabled={!kendiProje} onChange={() => setVt("kendi")} />
                <span>Kendi Supabase projesi (önerilen)
                  <span className={stil.vtAciklama}>{kendiProje
                    ? "Firmanın veritabanı ve dosyaları ayrı Supabase projesinde (Frankfurt); probata panelden açar ve kurar, firma bir şey yapmaz."
                    : "Şu an kapalı: Supabase yönetim anahtarı ve örgütü bu sunucuda tanımlı değil (yayına çıkışta tanımlanır)."}</span>
                </span>
              </label>
              <label className={stil.vtSecenek}>
                <input type="radio" name="vt" value="ortak" checked={vt === "ortak"} onChange={() => setVt("ortak")} />
                <span>Ortak proje
                  <span className={stil.vtAciklama}>{`${DEPO_AD[depo]} — firma hemen açılır.`}</span>
                </span>
              </label>
            </fieldset>
            {vt === "kendi" && (
              <>
                <Alan id={YZ_ALAN} etiket="Yapay zekâ anahtarı (isteğe bağlı)" hata={yzHata}>
                  <Girdi id={YZ_ALAN} type="password" value={yz} hata={!!yzHata} mesajli={!!yzHata} placeholder="sk-ant-…" onChange={(e) => { setYz(e.target.value); setYzHata(null); }} />
                </Alan>
                <ol className={stil.adimlar} aria-label="Kendi proje nasıl kurulur">{SUPABASE_ADIMLAR.map((x) => <li key={x}>{x}</li>)}</ol>
              </>
            )}
            <Serit tur="bilgi" ikon="archive">{DEPO_NOT}</Serit>
          </FormBolum>
        </FormSayfa>
        <FormEylem>
          <TusBaglanti href="/yonetim">Vazgeç</TusBaglanti>
          <Tus type="submit" ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined}>Firmayı aç</Tus>
        </FormEylem>
      </form>
    </>
  );
}
