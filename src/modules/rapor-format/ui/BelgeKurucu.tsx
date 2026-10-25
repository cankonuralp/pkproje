"use client";
/* BELGE KURUCU — 2026-10-25 (belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca bağlamalıyız", "zaten araç
   yapılı sadece bağlama işi yapılacak"). Programın ürettiği belgenin (zimmet teslim formu, araç teslim tutanağı, eğitim katılım formu, izin / masraf
   formu, teklif, fatura özeti, saha formu, ön bilgilendirme formu) firmaya özgü formatı rapor şablonunun ARACIYLA kurulur: aynı kâğıt (Kagit.tsx;
   serbest tablo TabloDuzenleyici.tsx), aynı geri al / yinele (../gecmis.ts). Kayıt hücresinin bilgisi belgenin katalogundan (BelgeKatalogBaglami —
   src/belge/katalog.ts). Belge önizlemesi belgenin çizicisiyle (src/belge/belge.ts belgeFormu — PDF'le aynı) uydurma değerlerle (ornekDegerler).
   FormatKurucu.tsx'in yalın hâli: saha ekranı, yapboz, yapay zekâ, kurallar yok. Değişiklik "Taslağı kaydet" ile yazılır; kaydedilmemiş taslak
   yayınlanmaz, kaydedilmemiş taslakla sayfadan çıkarken sorulur. Telefonda yalnız kapı yazısı. Karar ve şema sunucuda (server/belgeler.ts). */
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { belgeFormu } from "../../../belge/belge";
import { BELGE_KATALOGU, ornekDegerler, type BelgeTuru } from "../../../belge/katalog";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi } from "../../../components/form/Form";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { NesneBasi, Rozet } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import type { FormatTanimi } from "../../../format/tanim";
import { adimEkle, bosGecmis, geriAl, kisayol, yinele, type Gecmis } from "../gecmis";
import { bolumSil } from "../kurucu";
import { BelgeKatalogBaglami } from "./belgeBaglam";
import { belgeTaslakKaydetEylemi, belgeYayinlaEylemi } from "./belge-eylemler";
import { Kagit } from "./Kagit";
import stil from "./format.module.css";

export const BELGE_FORMATLARI = "/firma-ayarlari/belgeler";
const NOT_ID = "bk-not";
/** önizlemenin uydurma firması (künye belgede firma ayarlarından gelir) */
const ORNEK_FIRMA = { ad: "Firmanızın adı", kod: "FR", adres: "Firma ayarlarından", logo: null };
const odak = (q: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(q)?.focus());

/** sunucunun alan yolu (bolumler.2.ad) → okunur yer ("3. bölüm (Ad): ") */
function yer(k: string, t: FormatTanimi): string {
  const m = /^bolumler\.(\d+)/.exec(k);
  if (!m) return "";
  const b = t.bolumler[Number(m[1])];
  return `${Number(m[1]) + 1}. bölüm${b?.ad ? ` (${b.ad})` : ""}: `;
}

export function BelgeKurucu({ belge, format, tanim }: { belge: BelgeTuru; format: { id: string; surum: number }; tanim: FormatTanimi }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [mesgul, baslat] = useTransition();
  const katalog = BELGE_KATALOGU[belge];
  /* taslak: sunucudaki tanım değişince (kaydettikten sonra yenileme) ona eşitlenir */
  const ilkJson = JSON.stringify(tanim);
  const [t, setT] = useState<FormatTanimi>(tanim);
  const [son, setSon] = useState(ilkJson);
  const [hatalar, setHatalar] = useState<string[]>([]);
  const [gorunum, setGorunum] = useState<"duzen" | "belge">("duzen");
  const [gecmis, setGecmis] = useState<Gecmis<FormatTanimi>>(bosGecmis);
  if (son !== ilkJson) { setSon(ilkJson); setT(tanim); setHatalar([]); setGecmis(bosGecmis()); }
  const kirli = JSON.stringify(t) !== ilkJson;
  /* aynı yazı alanında art arda yazılanlar tek adım (FormatKurucu 495) */
  const sonAdim = useRef<{ el: Element | null }>({ el: null });
  const degis = (y: FormatTanimi) => {
    const el = document.activeElement, yazi = !!el && /^(INPUT|TEXTAREA)$/.test(el.tagName);
    if (!(yazi && el === sonAdim.current.el)) setGecmis((g) => adimEkle(g, t));
    sonAdim.current = { el: yazi ? el : null };
    setT(y); setHatalar([]);
  };
  const geri = () => { const x = geriAl(gecmis, t); if (!x) return; sonAdim.current = { el: null }; setGecmis(x.gecmis); setT(x.deger); setHatalar([]); bildir("Geri alındı."); };
  const ileri = () => { const x = yinele(gecmis, t); if (!x) return; sonAdim.current = { el: null }; setGecmis(x.gecmis); setT(x.deger); setHatalar([]); bildir("Yinelendi."); };
  const kisayolGuncel = useRef({ geri, ileri });
  useEffect(() => { kisayolGuncel.current = { geri, ileri }; });
  useEffect(() => {
    const bas = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement | null;
      const hedefYazi = !!h && (h.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(h.tagName));
      const k = kisayol({ key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, altKey: e.altKey, hedefYazi });
      if (!k) return;
      e.preventDefault();
      if (k === "geri") kisayolGuncel.current.geri(); else kisayolGuncel.current.ileri();
    };
    document.addEventListener("keydown", bas);
    return () => document.removeEventListener("keydown", bas);
  }, []);

  /* kaydedilmemiş taslakla sayfadan çıkarken tarayıcı sorar; uygulama içi gezintide (istemci bağlantıları) pencere sorar */
  useEffect(() => {
    if (!kirli) return;
    const dur = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", dur);
    return () => window.removeEventListener("beforeunload", dur);
  }, [kirli]);
  useEffect(() => {
    if (!kirli) return;
    const tikla = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank" || a.hasAttribute("download")) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
      e.preventDefault(); e.stopPropagation();
      void onayla({ baslik: "Kaydedilmemiş değişiklikler", metin: "Taslağa kaydedilmemiş değişiklikler silinir. Sayfadan çıkılsın mı?", tus: "Çık", tehlike: true })
        .then((tamam) => { if (tamam) router.push(`${u.pathname}${u.search}${u.hash}`); });
    };
    document.addEventListener("click", tikla, true);
    return () => document.removeEventListener("click", tikla, true);
  }, [kirli, onayla, router]);

  const tur = useMemo(() => ({ ad: katalog.ad, kod: "", std: [], cihaz: [] }), [katalog.ad]);
  const ornek = useMemo(() => ornekDegerler(belge), [belge]);
  /* önizleme yalnız seçilince çizilir */
  const onizleme = useMemo(() => (gorunum === "belge" ? belgeFormu(t, ORNEK_FIRMA, ornek, katalog.ad) : null), [gorunum, t, ornek, katalog.ad]);

  const kaydet = () => baslat(async () => {
    let r: Awaited<ReturnType<typeof belgeTaslakKaydetEylemi>>;
    try { r = await belgeTaslakKaydetEylemi(format.id, format.surum, t); } catch { r = { genel: "Kaydedilemedi." }; }
    if (!r.tamam) {
      setHatalar(r.hatalar ? Object.entries(r.hatalar).map(([k, v]) => `${yer(k, t)}${v}`) : [r.genel ?? "Kaydedilemedi."]);
      bildir("Taslak kaydedilmedi; nedeni sayfanın üstünde."); odak("#bk-hatalar"); return;
    }
    bildir("Taslak kaydedildi."); router.refresh();
  });
  const vazgec = () => { setT(tanim); setHatalar([]); setGecmis(bosGecmis()); bildir("Değişiklikler geri alındı."); };
  const bolumuSil = async (i: number) => {
    const b = t.bolumler[i];
    if (!b) return;
    if (!(await onayla({ baslik: "Bölüm silinsin mi?", metin: `${b.ad} taslaktan çıkar. Yayınlanana kadar belgeler etkilenmez.`, tus: "Sil", tehlike: true }))) return;
    degis(bolumSil(t, i)); bildir(`${b.ad} bölümü silindi (taslak).`);
  };

  return (
    <>
      <div className={stil.telefonKapi}>
        <NesneBasi baslik={`Belge formatı · ${katalog.ad}`} altIkon="file-text" alt="Firmanın formatı" />
        <Serit tur="bilgi" ikon="info">Bu ekran masaüstü için uygundur.</Serit>
        <div className={stil.telefonDon}><TusBaglanti tur="ikincil" ikon="arrow-left" href={BELGE_FORMATLARI}>Belge formatlarına dön</TusBaglanti></div>
      </div>
      <div className={stil.kurucuGovde}>
        <NesneBasi baslik={`Belge formatı · ${katalog.ad}`} rozet={<Rozet tur="bekliyor">Taslak</Rozet>} altIkon="file-text" alt={`${t.bolumler.length} bölüm`}
          tuslar={<>
            <span className={stil.gorunumSecici} role="group" aria-label="Görünüm">
              <Tus tur={gorunum === "duzen" ? "birincil" : "ikincil"} ikon="pencil" aria-pressed={gorunum === "duzen"} onClick={() => setGorunum("duzen")}>Kâğıt</Tus>
              <Tus tur={gorunum === "belge" ? "birincil" : "ikincil"} ikon="file-text" aria-pressed={gorunum === "belge"} onClick={() => setGorunum("belge")}>Belge önizlemesi</Tus>
            </span>
            <TusBaglanti tur="ikincil" ikon="arrow-left" href={BELGE_FORMATLARI}>Belge formatlarına dön</TusBaglanti>
            {kirli ? <>
              <span className={stil.kaydetNot}>Kaydedilmedi</span>
              <Tus tur="ikincil" disabled={mesgul} onClick={vazgec}>Vazgeç</Tus>
              <Tus ikon="check" disabled={mesgul} aria-busy={mesgul || undefined} onClick={kaydet}>Taslağı kaydet</Tus>
            </> : <BelgeYayinlaTusu ad={katalog.ad} format={format} />}
          </>} />
        <div className={stil.seritKap}>
          {hatalar.length > 0 && <div id="bk-hatalar" tabIndex={-1}><Serit tur="hata" ikon="circle-alert">Taslak kaydedilmedi: {hatalar.join(" · ")}</Serit></div>}
        </div>
        <div className={stil.aracCubugu} role="toolbar" aria-label="Taslak araçları">
          <Tus tur="ikincil" ikon="undo-2" disabled={!gecmis.geri.length} aria-keyshortcuts="Control+Z" title="Geri al (Ctrl+Z)" onClick={geri}>Geri al</Tus>
          <Tus tur="ikincil" ikon="redo-2" disabled={!gecmis.ileri.length} aria-keyshortcuts="Control+Y" title="Yinele (Ctrl+Y)" onClick={ileri}>Yinele</Tus>
        </div>
        <div className={gorunum === "duzen" ? undefined : stil.gizliHer}>
          <BelgeKatalogBaglami.Provider value={katalog}>
            <Kagit t={t} degis={degis} tur={tur} bolumuSil={(i) => void bolumuSil(i)} bildir={bildir} />
          </BelgeKatalogBaglami.Provider>
        </div>
        {onizleme && (
          <div className={stil.belgeKap}>
            {/* kayan öğe belgenin kendisi: klavyeyle kaydırılsın diye odak ve ad onda (rapor önizlemesi gibi) */}
            <div className="rb-onizleme" aria-label="Belge önizlemesi" role="region" tabIndex={0}>{onizleme}</div>
          </div>
        )}
      </div>
    </>
  );
}

/** yayınla: sürüm notuyla; yayınlanınca belge formatları listesine dönülür (yeni belgeler bu sürümle çizilir) */
function BelgeYayinlaTusu({ ad, format }: { ad: string; format: { id: string; surum: number } }) {
  const router = useRouter();
  const bildir = useBildir();
  const [acik, setAcik] = useState(false);
  const [bekliyor, baslat] = useTransition();
  const [notu, setNotu] = useState("");
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const yayinla = () => baslat(async () => {
    let r: Awaited<ReturnType<typeof belgeYayinlaEylemi>>;
    try { r = await belgeYayinlaEylemi(format.id, format.surum, notu); } catch { r = { genel: "Yayınlanamadı." }; }
    setH(r.hatalar ?? {}); setGenel(r.genel ?? (r.hatalar && !r.hatalar.notu ? Object.values(r.hatalar).join(" · ") : null));
    if (!r.tamam) return;
    setAcik(false); bildir(r.sira ? `${ad} · sürüm ${r.sira} yayınlandı.` : `${ad} yayınlandı.`); router.push(BELGE_FORMATLARI);
  });
  return (
    <>
      <Tus ikon="upload" onClick={() => { setNotu(""); setH({}); setGenel(null); setAcik(true); }}>Yayınla</Tus>
      {acik && <Pencere acik baslik="Belge formatını yayınla" onKapat={() => setAcik(false)} odak={`#${NOT_ID}`}
        alt={<><Tus tur="ikincil" onClick={() => setAcik(false)}>Vazgeç</Tus><Tus ikon="upload" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={yayinla}>Yayınla</Tus></>}>
        <p className={pencereMetinSinifi}>Yeni belgeler bu sürümle çizilir.</p>
        {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
        <FormIzgara>
          <Alan id={NOT_ID} etiket="Sürüm notu" genis hata={h.notu}>
            <Girdi id={NOT_ID} value={notu} onChange={(e) => setNotu(e.target.value)} maxLength={200} hata={!!h.notu} />
          </Alan>
        </FormIzgara>
      </Pencere>}
    </>
  );
}
