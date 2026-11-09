"use client";
/* S.A.Y CHAT RAPOR MODU (2026-11-09; reisim: "eskisi gibi direk rapor oluşturma modu olsun yukarıda onun tuşu olsun, rapor modu, chat modu diye ayrım olsun"; sunum claude.ai
   HBwuL3s9G693uopxSzTbjH K1–K6 — "Evet, önerilerle"). Bir kayıt = bir ekipman: fotoğraf → ekipman → satır satır mesaj → Gönder. Kayıt çevrimdışı kuyruktan gider (K4), cihazdaki kayıt
   "Cihazda" görünür; ekran verisi cihazda da durur. "Bekleyenler için rapor yaz" bağlantı ister, kayıtlar SIRAYLA rapor taslağı olur; yapay zekâ yalnız bu tuşla, etiket fotoğrafı varsa (K2).
   MesajKutusu (542): tek yazı alanı, solda her satırın adı; Enter alttaki satıra geçer (satırlar kaymaz), son satırda yeni satır açar (nota). */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useBildir, useUyar } from "../../../components/bildirim/Bildirim";
import { bekleyenIsler, kuyrugaEkle, kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik, kuyruktanCikar, yenidenDene, type KuyrukSonucOlayi, type KuyrukTuru }
  from "../../../components/cevrimdisi/kuyruk";
import { FotoTusu } from "../../../components/foto/FotoTusu";
import { GizliResim } from "../../../components/gizli-resim/GizliResim";
import { Ikon } from "../../../components/ikon/Ikon";
import { SayfaliListe } from "../../../components/liste/Sayfalayici";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere } from "../../../components/pencere/Pencere";
import { Tus } from "../../../components/tus/Tus";
import { dagit, KAYIT_FOTO_EN_COK, MESAJ_EN_COK, MESAJ_SATIR_EN_COK, type RaporFotoGirdisi, type RaporKaydiGirdisi, type RaporModuVerisi, type RaporSatiri } from "../rapor-modu";
import { raporKaydiOkuEylemi, raporKaydiYazEylemi, raporModuEylemi } from "./eylemler";
import { base64, chatFotoKucult } from "./foto";
import stil from "./SayChat.module.css";

const ISLER: readonly KuyrukTuru[] = ["sayrapor.foto", "sayrapor.kaydet", "sayrapor.sil"];
const onbellek = (plan: string) => `probata-rapor-modu:${plan}`;
const onbellekOku = (plan: string): RaporModuVerisi | null => { try { const s = localStorage.getItem(onbellek(plan)); return s ? JSON.parse(s) as RaporModuVerisi : null; } catch { return null; } };
const onbellekYaz = (plan: string, v: RaporModuVerisi) => { try { localStorage.setItem(onbellek(plan), JSON.stringify(v)); } catch { /* saklama yok */ } };

function MesajKutusu({ satirlar, mesaj, degisti }: { satirlar: readonly RaporSatiri[]; mesaj: readonly string[]; degisti: (l: string[]) => void }) {
  const n = Math.max(satirlar.length, mesaj.length), satir = Math.min(MESAJ_EN_COK, n + 1);
  const deger = Array.from({ length: n }, (_, i) => mesaj[i] ?? "").join("\n");
  return (
    <div className={stil.mesajKutu}>
      <ol className={stil.mesajAdlar} aria-hidden="true">
        {Array.from({ length: satir }, (_, i) => <li key={i} className={satirlar[i] ? undefined : stil.mesajNot}><span>{satirlar[i]?.ad ?? "+ not"}</span></li>)}
      </ol>
      <label className={stil.gizli} htmlFor="sr-mesaj">Mesaj</label>
      <textarea id="sr-mesaj" className={stil.mesajAlan} value={deger} rows={satir} wrap="off" spellCheck={false} autoCapitalize="sentences" autoComplete="off"
        aria-describedby="sr-mesaj-sira" style={{ height: `calc(${satir} * var(--sc-satir))` }}
        onChange={(e) => degisti(e.target.value.split("\n").slice(0, MESAJ_EN_COK).map((x) => x.slice(0, MESAJ_SATIR_EN_COK)))}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
          const ta = e.currentTarget, v = ta.value, sonraki = v.indexOf("\n", ta.selectionStart);
          if (sonraki >= 0) {
            e.preventDefault();
            const bitis = v.indexOf("\n", sonraki + 1), yer = bitis < 0 ? v.length : bitis;
            ta.setSelectionRange(yer, yer);
          } else if (v.split("\n").length >= MESAJ_EN_COK) e.preventDefault();
        }} />
      <p className={stil.gizli} id="sr-mesaj-sira">{satirlar.map((x, i) => `${i + 1}. satır ${x.ad}`).join(", ")}; fazla satırlar nota eklenir; bilinmeyene tire.</p>
    </div>
  );
}

interface Secilen { anahtar: number; dosya: File; url: string }
let sira = 0;
type Secim = { tip: "plan"; id: string; ad: string; tur: string } | { tip: "yeni"; tur: string; ad: string };

function YeniKayit({ v, dolu, kapat }: { v: RaporModuVerisi; dolu: ReadonlySet<string>; kapat: () => void }) {
  const uyar = useUyar();
  const [fotolar, setFotolar] = useState<Secilen[]>([]);
  const [etiket, setEtiket] = useState<Secilen | null>(null);
  const [secim, setSecim] = useState<Secim | null>(null);
  const [mesaj, setMesaj] = useState<string[]>([]);
  const [pencere, setPencere] = useState(false);
  const [sekme, setSekme] = useState<"plan" | "yeni">("plan");
  const [ara, setAra] = useState("");
  const [mesgul, setMesgul] = useState(false);
  const satirlar = secim ? v.turler[secim.tur]?.satirlar ?? [] : [];
  const hazirla = async (f: File): Promise<Secilen | null> => {
    const k = await chatFotoKucult(f);
    if (!k) { uyar(`${f.name}: fotoğraf okunamadı.`); return null; }
    return { anahtar: ++sira, dosya: k, url: URL.createObjectURL(k) };
  };
  const fotoSec = async (l: File[]) => {
    const yer = KAYIT_FOTO_EN_COK - fotolar.length;
    if (l.length > yer) uyar(`Kayda en çok ${KAYIT_FOTO_EN_COK} fotoğraf eklenir.`);
    setMesgul(true);
    try {
      const h: Secilen[] = [];
      for (const f of l.slice(0, Math.max(0, yer))) { const s = await hazirla(f); if (s) h.push(s); }
      setFotolar((x) => [...x, ...h]);
    } finally { setMesgul(false); }
  };
  const ekipSec = (s: Secim) => { setSecim(s); setPencere(false); };
  const gonder = async () => {
    if (mesgul) return;
    if (!fotolar.length) { uyar("Fotoğraf ekleyin."); return; }
    if (!secim) { uyar("Ekipman seçin."); return; }
    setMesgul(true);
    try {
      const kayit = crypto.randomUUID(), plan = v.plan.id;
      const foto = async (s: Secilen, rol: "ekipman" | "etiket") => {
        const girdi: RaporFotoGirdisi = { plan, rol, ad: s.dosya.name || "foto.jpg", veri: await base64(s.dosya) };
        await kuyrugaEkle({ tur: "sayrapor.foto", kayit, surum: 0, girdi, ad: `Rapor kaydı · ${secim.ad} · fotoğraf` });
      };
      for (const s of fotolar) await foto(s, "ekipman");
      if (etiket) await foto(etiket, "etiket");
      const girdi: RaporKaydiGirdisi = { plan, ekipman: secim.tip === "plan" ? { tip: "plan", id: secim.id } : { tip: "yeni", tur: secim.tur }, satirlar: [...satirlar], mesaj };
      await kuyrugaEkle({ tur: "sayrapor.kaydet", kayit, surum: 0, girdi, ad: `Rapor kaydı · ${secim.ad}` });
      kapat();
    } finally { setMesgul(false); }
  };
  const a = ara.toLocaleLowerCase("tr").trim();
  const ekipmanlar = v.ekipmanlar.filter((e) => !a || `${e.kod} ${v.turler[e.turId]?.ad ?? ""} ${e.konum ?? ""}`.toLocaleLowerCase("tr").includes(a));
  const turler = v.yeniTurler.filter((id) => !a || (v.turler[id]?.ad ?? "").toLocaleLowerCase("tr").includes(a));
  return (
    <div className={stil.rmForm}>
      <div className={stil.rmSatir}>
        <FotoTusu ad="Fotoğraf çek" etiket="Fotoğraf çek" ikon="camera" sinif={stil.rmTus} coklu sec={(l) => void fotoSec(l)} />
        <FotoTusu ad={etiket ? "Etiketi değiştir" : "Etiket fotoğrafı"} etiket="Etiket fotoğrafı" ikon="tag" sinif={stil.rmTus}
          sec={(l) => { const f = l[0]; if (f) void hazirla(f).then((s) => { if (s) setEtiket(s); }); }} />
      </div>
      {(fotolar.length > 0 || etiket) && (
        <ul className={stil.rmFotolar} aria-label="Kaydın fotoğrafları">
          {fotolar.map((s, i) => (
            <li key={s.anahtar}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={`Fotoğraf ${i + 1}`} />
              <button type="button" onClick={() => setFotolar((l) => l.filter((x) => x.anahtar !== s.anahtar))} aria-label={`Fotoğraf ${i + 1} kaldır`}><Ikon ad="x" kucuk /></button>
            </li>
          ))}
          {etiket && (
            <li>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={etiket.url} alt="Etiket fotoğrafı" />
              <small>Etiket</small>
              <button type="button" onClick={() => setEtiket(null)} aria-label="Etiket fotoğrafını kaldır"><Ikon ad="x" kucuk /></button>
            </li>
          )}
        </ul>
      )}
      <button type="button" className={stil.rmEkipman} onClick={() => setPencere(true)}>
        <Ikon ad="wrench" kucuk /><span>{secim ? secim.ad : "Ekipman seç"}</span><Ikon ad="chevron-right" kucuk />
      </button>
      {secim && <MesajKutusu satirlar={satirlar} mesaj={mesaj} degisti={setMesaj} />}
      <div className={stil.tuslar}>
        <Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus>
        <Tus tur="birincil" ikon="send" onClick={() => void gonder()} disabled={mesgul} aria-busy={mesgul || undefined}>Gönder</Tus>
      </div>
      <Pencere acik={pencere} baslik="Ekipman seçin" onKapat={() => setPencere(false)}>
        <div className={stil.rmPencere}>
          <div className={stil.modSecim} role="group" aria-label="Ekipman kaynağı">
            <button type="button" aria-pressed={sekme === "plan"} onClick={() => setSekme("plan")}>Plandan seç</button>
            <button type="button" aria-pressed={sekme === "yeni"} onClick={() => setSekme("yeni")}>Yeni ekle</button>
          </div>
          <label className={stil.gizli} htmlFor="sr-ara">Ara</label>
          <input id="sr-ara" className={stil.rmAra} type="search" placeholder="Ara" value={ara} onChange={(e) => setAra(e.target.value)} />
          {sekme === "plan"
            ? <SayfaliListe ad="Plandaki ekipmanlar" className={stil.rmSecimler} anahtar={ara} ogeler={ekipmanlar.map((e) => {
                const kapali = e.durum === "kapali" || dolu.has(e.id), tur = v.turler[e.turId]?.ad ?? "";
                return (
                  <button key={e.id} type="button" disabled={kapali} onClick={() => ekipSec({ tip: "plan", id: e.id, ad: `${e.kod} · ${tur}`, tur: e.turId })}>
                    <b>{e.kod}</b> · {tur}{e.konum ? ` · ${e.konum}` : ""}
                    {(e.neden || dolu.has(e.id)) && <small>{dolu.has(e.id) ? "Başka kaydınızda" : e.neden}</small>}
                  </button>
                );
              })} />
            : <SayfaliListe ad="Türler" className={stil.rmSecimler} anahtar={ara} ogeler={turler.map((id) => (
                <button key={id} type="button" onClick={() => ekipSec({ tip: "yeni", tur: id, ad: `Yeni · ${v.turler[id]?.ad ?? ""}` })}>{v.turler[id]?.ad}</button>
              ))} />}
        </div>
      </Pencere>
    </div>
  );
}

export function RaporModu({ plan }: { plan: { id: string; no: string } | null }) {
  const uyar = useUyar(), bildir = useBildir(), onayla = useOnayla();
  const kuyruk = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const [v, setV] = useState<RaporModuVerisi | null>(null);
  const [kapali, setKapali] = useState(false);
  const [bekleyen, setBekleyen] = useState<Awaited<ReturnType<typeof bekleyenIsler>>>([]);
  const [yeni, setYeni] = useState(false);
  const [yaziyor, setYaziyor] = useState<string | null>(null);
  const [hatalar, setHatalar] = useState<Readonly<Record<string, string>>>({});
  const planId = plan?.id ?? null;
  const yukle = useCallback(async () => {
    if (!planId) return;
    try {
      const r = await raporModuEylemi(planId);
      if (r) { setV(r); onbellekYaz(planId, r); setKapali(false); } else setKapali(true);
    } catch { /* bağlantı yok: cihazdaki veri */ }
  }, [planId]);
  useEffect(() => {
    if (!planId) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- cihazdaki veri yalnız tarayıcıda okunur */
    setV(onbellekOku(planId)); setYeni(false); setHatalar({});
    void yukle();
  }, [planId, yukle]);
  useEffect(() => {
    let zaman: number | undefined;
    const f = (e: Event) => {
      const d = (e as CustomEvent<KuyrukSonucOlayi>).detail;
      if (!d?.tur.startsWith("sayrapor.") || d.durum !== "tamam") return;
      window.clearTimeout(zaman);
      zaman = window.setTimeout(() => void yukle(), 400);
    };
    window.addEventListener("probata-islem", f);
    return () => { window.removeEventListener("probata-islem", f); window.clearTimeout(zaman); };
  }, [yukle]);
  const isler = useMemo(() => kuyruk.isler.filter((x) => (ISLER as readonly string[]).includes(x.tur)), [kuyruk.isler]);
  useEffect(() => {
    let canli = true;
    void bekleyenIsler(ISLER).then((l) => { if (canli) setBekleyen(l); });
    return () => { canli = false; };
  }, [isler]);

  const satirlar = useMemo(() => {
    const silinen = new Set(bekleyen.filter((x) => x.tur === "sayrapor.sil").map((x) => x.kayit));
    const sunucu = (v?.kayitlar ?? []).filter((k) => !silinen.has(k.id));
    const ids = new Set(sunucu.map((k) => k.id));
    const cihaz = bekleyen.filter((x) => x.tur === "sayrapor.kaydet" && !ids.has(x.kayit) && (x.girdi as RaporKaydiGirdisi | null)?.plan === planId);
    return { sunucu, cihaz };
  }, [v, bekleyen, planId]);
  const bekleyenFoto = (id: string) => bekleyen.filter((x) => x.tur === "sayrapor.foto" && x.kayit === id).length;
  const kayitIsi = (id: string) => bekleyen.filter((x) => x.kayit === id);
  const yazilacak = satirlar.sunucu.filter((k) => !k.rapor && !kayitIsi(k.id).length && (k.ekipmanId || k.turId));
  const etiketli = yazilacak.some((k) => k.fotolar.some((f) => f.rol === "etiket"));
  const dolu = useMemo(() => new Set(satirlar.sunucu.filter((k) => !k.rapor && k.ekipmanId).map((k) => k.ekipmanId!)
    .concat(satirlar.cihaz.flatMap((x) => { const e = (x.girdi as RaporKaydiGirdisi).ekipman; return e.tip === "plan" ? [e.id] : []; }))), [satirlar]);

  const raporYaz = async () => {
    if (!planId || yaziyor) return;
    if (navigator.onLine === false) { uyar("Rapor yazmak için bağlantı gerekir."); return; }
    const h: Record<string, string> = {};
    let n = 0, acilan = 0;
    for (const k of yazilacak) {
      setYaziyor(`${++n} / ${yazilacak.length}`);
      const r = await raporKaydiYazEylemi(planId, k.id).catch(() => null);
      if (!r) { h[k.id] = "Bağlantı yok; bağlanınca yeniden deneyin."; continue; }
      if (r.durum === "hata") { h[k.id] = r.neden; continue; }
      acilan++;
      for (const o of r.okumalar) await raporKaydiOkuEylemi(r.rapor.id, o).catch(() => 0);
    }
    setHatalar(h); setYaziyor(null);
    if (acilan) bildir(`${acilan} rapor açıldı.`);
    await yukle();
  };
  const sil = async (id: string, ad: string) => {
    if (!(await onayla({ baslik: "Kayıt silinsin mi?", metin: ad, tus: "Sil", tehlike: true }))) return;
    for (const x of kayitIsi(id)) await kuyruktanCikar(x.id);
    if (satirlar.sunucu.some((k) => k.id === id)) await kuyrugaEkle({ tur: "sayrapor.sil", kayit: id, surum: 0, girdi: {}, ad: "Rapor kaydı · sil" });
  };
  const kapat = () => window.dispatchEvent(new CustomEvent("probata-saychat-kapat"));

  if (!plan) return <div className={stil.rmGovde}><p className={stil.bosMetin}>Plan yok.</p></div>;
  if (kapali && !v) return <div className={stil.rmGovde}><p className={stil.bosMetin}>Bu planda kayıt yazılamaz.</p></div>;
  if (!v) return <div className={stil.rmGovde}><p className={stil.bosMetin}>Yükleniyor…</p></div>;
  const ekipAd = (e: string | null, t: string | null) => {
    const x = e ? v.ekipmanlar.find((y) => y.id === e) : null;
    if (x) return `${x.kod} · ${v.turler[x.turId]?.ad ?? ""}`;
    return t ? `Yeni · ${v.turler[t]?.ad ?? ""}` : "Ekipman seçilmedi";
  };
  if (yeni) return <div className={stil.rmGovde}><YeniKayit v={v} dolu={dolu} kapat={() => setYeni(false)} /></div>;
  const toplam = satirlar.sunucu.length + satirlar.cihaz.length;
  return (
    <>
      <div className={stil.rmGovde}>
        {toplam === 0 && <p className={stil.bosMetin}>Henüz kayıt yok.</p>}
        <SayfaliListe ad="Rapor kayıtları" className={stil.rmListe} anahtar={planId} ogeler={[
          ...satirlar.sunucu.map((k) => {
            const ad = ekipAd(k.ekipmanId, k.turId), is = kayitIsi(k.id), hata = hatalar[k.id] ?? is.find((x) => x.durum !== "bekliyor")?.ileti;
            const d = dagit(k.satirlar, k.mesaj), foto = k.fotolar.filter((f) => f.rol === "ekipman")[0], etk = k.fotolar.some((f) => f.rol === "etiket");
            return (
              <article key={k.id} className={stil.rmKart} data-kayit={k.id}>
                <div className={stil.rmKartBas}>
                  <b>{ad}</b>
                  <button type="button" className={stil.balonTus} onClick={() => void sil(k.id, ad)} aria-label={`${ad} kaydını sil`}><Ikon ad="trash-2" kucuk /></button>
                </div>
                {foto && <GizliResim dosyaId={foto.dosya} alt={foto.ad} className={stil.rmResim} />}
                {d.satirlar.some((s) => s.deger) && (
                  <dl className={stil.rmDegerler}>{d.satirlar.filter((s) => s.deger).map((s) => <div key={s.alan}><dt>{s.ad}</dt><dd>{s.deger}</dd></div>)}</dl>
                )}
                {k.rapor
                  ? <Link className={`${stil.rmRozet} ${stil.rmTamam}`} href={`/raporlar/${k.rapor.id}`} onClick={kapat}><Ikon ad="check" kucuk />Rapor açıldı: {k.rapor.no}</Link>
                  : hata ? <span className={`${stil.rmRozet} ${stil.rmHata}`}><Ikon ad="circle-alert" kucuk />{hata}</span>
                  : is.length ? <span className={stil.rmRozet}><Ikon ad="clock" kucuk />Cihazda{bekleyenFoto(k.id) ? ` · ${bekleyenFoto(k.id)} fotoğraf` : ""}</span>
                  : <span className={stil.rmRozet}>Bekliyor{etk ? " · etiket okunacak" : ""}</span>}
                {is.filter((x) => x.durum !== "bekliyor").slice(0, 1).map((x) => <Tus key={x.id} tur="ikincil" ikon="rotate-ccw" onClick={() => void yenidenDene(x.id)}>Yeniden dene</Tus>)}
              </article>
            );
          }),
          ...satirlar.cihaz.map((x) => {
            const g = x.girdi as RaporKaydiGirdisi, e = g.ekipman, ad = e.tip === "plan" ? ekipAd(e.id, null) : ekipAd(null, e.tur);
            return (
              <article key={x.kayit} className={stil.rmKart} data-kayit={x.kayit}>
                <div className={stil.rmKartBas}>
                  <b>{ad}</b>
                  <button type="button" className={stil.balonTus} onClick={() => void sil(x.kayit, ad)} aria-label={`${ad} kaydını sil`}><Ikon ad="trash-2" kucuk /></button>
                </div>
                {x.durum === "bekliyor"
                  ? <span className={stil.rmRozet}><Ikon ad="clock" kucuk />Cihazda{bekleyenFoto(x.kayit) ? ` · ${bekleyenFoto(x.kayit)} fotoğraf` : ""}</span>
                  : <><span className={`${stil.rmRozet} ${stil.rmHata}`}><Ikon ad="circle-alert" kucuk />{x.ileti ?? "Gönderilemedi"}</span><Tus tur="ikincil" ikon="rotate-ccw" onClick={() => void yenidenDene(x.id)}>Yeniden dene</Tus></>}
              </article>
            );
          }),
        ]} />
      </div>
      <div className={stil.yazAlani} data-panel-alt="">
        <Tus tur="ikincil" ikon="camera" onClick={() => setYeni(true)}>Yeni kayıt</Tus>
        {yazilacak.length > 0 && (etiketli
          ? <button type="button" className={stil.okusun} onClick={() => void raporYaz()} disabled={!!yaziyor} data-yapay-zeka=""><Ikon ad="sparkles" kucuk />{yaziyor ? `Rapor yazılıyor ${yaziyor}` : `Bekleyenler için rapor yaz (${yazilacak.length})`}</button>
          : <Tus tur="birincil" ikon="file-text" onClick={() => void raporYaz()} disabled={!!yaziyor}>{yaziyor ? `Rapor yazılıyor ${yaziyor}` : `Bekleyenler için rapor yaz (${yazilacak.length})`}</Tus>)}
      </div>
    </>
  );
}
