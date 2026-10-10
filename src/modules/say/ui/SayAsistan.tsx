"use client";
/* S.A.Y SAHA ASİSTANI (380; maket say.js BB6 — reisim 2026-10-03: "her yer de gözükecek şekilde … daha şık … daha yuvarlak daha ilgi çekici",
   "geçmiş silinmez") — uygulama düzeninde TEK bileşen (her firma sayfası; müşteri paneli ve Yönetim'de yok). Sağ altta yuvarlak düğme (firma yapay
   zekâyı açtıysa); panel masaüstü / tablette sağda yan pencere, telefonda tam ekran; açık / kapalı hâli bu cihazda kalır (sayfa değişince düşmez).
   Geçmiş sunucuda, kişinin hesabında (yalnız kendisi). Hızlı sorular kuralla; serbest soru yapay zekâya. Cevap DÜZ METİN çizilir (HTML işlenmez).
   Bağlantı yoksa, anahtar girilmemişse, sınır dolduysa şerit söyler (sessiz kalmaz). Esc kapatır; açılınca odak soru alanına, kapanınca düğmeye.
   382 — RAPOR EKRANI (baglam.ts: düzenlenen rapor açıkken): hızlı sorular "Eksik alanlar neler?" (bölüm başına "Git" alana götürür) ve "Sonuç ne
   olmalı?" (kriterlerle seçilen uyuşmuyorsa öneri kartı: "Uygula" denetçinin seçimiyle aynı yoldan forma yazar — Kaydet'le kaydedilir; "Vazgeç").
   "Git" ve "Uygula" yalnız o rapor açıkken; sonucu geçmişte kalır. Öneri vermeden rapora hiçbir şey yazılmaz. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { Serit } from "../../../components/serit/Serit";
import type { SohbetEksik, SohbetIletisi } from "../../../server/yz/sohbet";
import type { SayDurum, SayYaniti } from "../server/say";
import { useSayRaporBagi, type SayRaporBagi } from "./baglam";
import { sayDurumEylemi, sayGecmisEylemi, sayHizliEylemi, sayOneriEylemi, sayRaporEylemi, saySorEylemi, sayTemizleEylemi } from "./eylemler";
import stil from "./say.module.css";

const ACIK_ANAHTARI = "probata-say-acik";
type Hizli = "bekleyen" | "sayfa" | "eksik" | "sonuc";
const GENEL: [k: Hizli, ad: string][] = [["bekleyen", "Beni ne bekliyor?"], ["sayfa", "Bu sayfada ne yapılır?"]];
const RAPOR: [k: Hizli, ad: string][] = [["eksik", "Eksik alanlar neler?"], ["sonuc", "Sonuç ne olmalı?"]];
const DAR = "(max-width: 767.98px)";

function cevrimici(): boolean { return typeof navigator === "undefined" || navigator.onLine !== false; }

/** düz metin: paragraflar; "- " ile başlayan satırlar liste */
function Metin({ metin }: { metin: string }) {
  const parcalar: { tur: "p" | "ul"; satirlar: string[] }[] = [];
  for (const satir of metin.split("\n")) {
    const madde = /^\s*[-•]\s+/.test(satir);
    const son = parcalar[parcalar.length - 1];
    if (!satir.trim()) { parcalar.push({ tur: "p", satirlar: [] }); continue; }
    if (madde) { if (son?.tur === "ul") son.satirlar.push(satir.replace(/^\s*[-•]\s+/, "")); else parcalar.push({ tur: "ul", satirlar: [satir.replace(/^\s*[-•]\s+/, "")] }); }
    else if (son?.tur === "p" && son.satirlar.length) son.satirlar.push(satir);
    else parcalar.push({ tur: "p", satirlar: [satir] });
  }
  return <>{parcalar.filter((p) => p.satirlar.length).map((p, i) => p.tur === "ul"
    ? <ul key={i} className={stil.madde}>{p.satirlar.map((s, j) => <li key={j}>{s}</li>)}</ul>
    : <p key={i}>{p.satirlar.join("\n")}</p>)}</>;
}

/** eksikler bölüm başına (sırası korunur): "Bölüm · N alan" + Git (ilk alana) */
function bolumle(l: readonly SohbetEksik[]): { bolumAd: string; ilk: SohbetEksik; n: number }[] {
  const g = new Map<string, { bolumAd: string; ilk: SohbetEksik; n: number }>();
  for (const e of l) { const x = g.get(e.bolum); if (x) x.n++; else g.set(e.bolum, { bolumAd: e.bolumAd, ilk: e, n: 1 }); }
  return [...g.values()];
}

function Ileti({ m, rb, git, uygula, vazgec }: {
  m: SohbetIletisi; rb: SayRaporBagi | null; git: (e: SohbetEksik) => void; uygula: (m: SohbetIletisi) => void; vazgec: (m: SohbetIletisi) => void;
}) {
  if (m.kim === "ben") return <li className={`${stil.mesaj} ${stil.ben}`}>{m.metin}</li>;
  const burada = !!rb && !!m.ek?.rapor && rb.id === m.ek.rapor;
  const o = m.ek?.oneri;
  return (
    <li className={`${stil.mesaj} ${stil.o}`}>
      <Metin metin={m.metin} />
      {m.ek?.bekleyen?.length ? (
        <ul className={stil.bekleyen}>
          {m.ek.bekleyen.map((b) => (
            <li key={b.href}>
              {/^\/[a-z-]*$/.test(b.href) ? <Link href={b.href}>{b.ad}</Link> : b.ad}: {[b.kirmizi ? `${b.kirmizi} ${b.kirmiziAd}` : "", b.sari ? `${b.sari} ${b.sariAd}` : ""].filter(Boolean).join(" · ")}
            </li>
          ))}
        </ul>
      ) : null}
      {m.ek?.eksik?.length ? (
        <ul className={stil.eksik}>
          {bolumle(m.ek.eksik).map((g) => (
            <li key={g.ilk.bolum}>
              <span>{g.bolumAd} · {g.n} alan</span>
              {burada && <button className={stil.kucukTus} type="button" onClick={() => git(g.ilk)}><Ikon ad="arrow-right" kucuk />Git</button>}
            </li>
          ))}
        </ul>
      ) : null}
      {o && (
        <div className={stil.oneri}>
          <p className={stil.oneriBas}><Ikon ad="pencil" kucuk />Öneri</p>
          <p className={stil.oneriMetin}>{o.ad}</p>
          {o.durum === "uygulandi" ? <p className={stil.oneriDurum} tabIndex={-1} id={`say-o-${m.id}`}><Ikon ad="circle-check" kucuk />Rapora uygulandı</p>
            : o.durum === "vazgecildi" ? <p className={`${stil.oneriDurum} ${stil.oneriRed}`} tabIndex={-1} id={`say-o-${m.id}`}>Uygulanmadı</p>
            : !burada ? <p className={`${stil.oneriDurum} ${stil.oneriRed}`}>{m.yer} açıkken uygulanır</p>
            : (
              <div className={stil.oneriTuslar}>
                <button className={stil.kucukTus} type="button" onClick={() => vazgec(m)}>Vazgeç</button>
                <button className={`${stil.kucukTus} ${stil.birincil}`} type="button" onClick={() => uygula(m)}><Ikon ad="check" kucuk />Uygula</button>
              </div>
            )}
        </div>
      )}
    </li>
  );
}

export function SayAsistan() {
  const yol = usePathname() ?? "/";
  const bildir = useBildir();
  const onayla = useOnayla();
  const rb = useSayRaporBagi();
  const [durum, setDurum] = useState<SayDurum | null>(null);
  const [acik, setAcik] = useState(false);
  const [iletiler, setIletiler] = useState<SohbetIletisi[] | null>(null);
  const [soru, setSoru] = useState("");
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [bagli, setBagli] = useState(true);
  const fab = useRef<HTMLButtonElement>(null);
  const girdi = useRef<HTMLInputElement>(null);
  const govde = useRef<HTMLDivElement>(null);

  /* durum: sayfa açılınca bir kez (düzen sayfalar arasında kalır); önceki sayfada açık bırakılan panel açık gelir (odak çalınmaz) */
  useEffect(() => {
    let canli = true;
    sayDurumEylemi().then((d) => {
      if (!canli || !d) return;
      setDurum(d);
      let onceAcik = false;
      try { onceAcik = localStorage.getItem(ACIK_ANAHTARI) === "1"; } catch { /* saklama yok */ }
      if (d.acik && onceAcik) setAcik(true);
    }, () => undefined);
    return () => { canli = false; };
  }, []);
  useEffect(() => {
    const g = () => setBagli(cevrimici());
    g();
    window.addEventListener("online", g); window.addEventListener("offline", g);
    return () => { window.removeEventListener("online", g); window.removeEventListener("offline", g); };
  }, []);
  /* panel açılınca geçmiş (bir kez) */
  useEffect(() => {
    if (!acik || iletiler) return;
    let canli = true;
    sayGecmisEylemi().then((l) => { if (canli) setIletiler(l); }, () => { if (canli) setIletiler([]); });
    return () => { canli = false; };
  }, [acik, iletiler]);
  useEffect(() => { const g = govde.current; if (g) g.scrollTop = g.scrollHeight; }, [iletiler, acik, hata]);
  useEffect(() => {
    if (durum?.acik) document.documentElement.setAttribute("data-say", "var");
    return () => document.documentElement.removeAttribute("data-say");
  }, [durum?.acik]);

  if (!durum?.acik) return null;
  const hazir = durum.anahtar && bagli;
  const raporda = !!rb;

  const ac = (odakla = true) => {
    setAcik(true); setHata(null);
    try { localStorage.setItem(ACIK_ANAHTARI, "1"); } catch { /* saklama yok */ }
    if (odakla) requestAnimationFrame(() => (girdi.current && !girdi.current.disabled ? girdi.current : document.getElementById("say-kapat"))?.focus());
  };
  const kapat = () => {
    setAcik(false);
    try { localStorage.setItem(ACIK_ANAHTARI, "0"); } catch { /* saklama yok */ }
    requestAnimationFrame(() => fab.current?.focus());
  };
  const sonuc = (y: SayYaniti) => {
    if (y.durum === "tamam") { setIletiler((l) => [...(l ?? []), ...y.iletiler.filter((m) => !(l ?? []).some((x) => x.id === m.id))]); setHata(null); return true; }
    setHata(y.neden);
    return false;
  };
  const hizliSor = async (k: Hizli) => {
    if (bekliyor) return;
    setBekliyor(true);
    try {
      if ((k === "eksik" || k === "sonuc") && rb) {
        sonuc(await sayRaporEylemi({ hizli: k, rapor: { id: rb.id, no: rb.no }, ...(k === "eksik" ? { eksik: rb.eksikler().slice(0, 60) } : { sonuc: rb.sonuc() }) }));
      } else if (k === "bekleyen" || k === "sayfa") sonuc(await sayHizliEylemi(k, yol));
    } catch { setHata("S.A.Y'a ulaşılamadı; bağlantıyı kontrol edip yeniden deneyin."); } finally { setBekliyor(false); }
  };
  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    const v = soru.trim();
    if (!v) { girdi.current?.focus(); return; }
    if (bekliyor) return;
    setBekliyor(true);
    try {
      const y = await saySorEylemi(v, yol, rb?.no, rb ? { id: rb.id, cevaplar: rb.cevaplar() } : undefined);
      if (y.durum === "tamam") setSoru("");
      /* soru geçmişe yazıldıysa (çağrı düştü) yeniden çekilir — geçmiş sunucudakiyle aynı kalsın */
      if (!sonuc(y)) setIletiler(await sayGecmisEylemi());
    } catch { setHata("S.A.Y'a ulaşılamadı; bağlantıyı kontrol edip yeniden deneyin."); } finally { setBekliyor(false); girdi.current?.focus(); }
  };
  const temizle = async () => {
    if (!(await onayla({ baslik: "Sohbeti temizle", metin: "S.A.Y ile bütün sohbet geçmişiniz silinir.", tus: "Temizle", tehlike: true }))) return;
    const y = await sayTemizleEylemi();
    if (y.durum === "tamam") { setIletiler([]); setHata(null); bildir("Sohbet temizlendi."); document.getElementById("say-kapat")?.focus(); }
    else setHata(y.neden);
  };
  /* eksiğe git: telefonda panel kapanır (alan görünsün); rapor ekranı bölümleri açar, alana kaydırır ve odaklar */
  const git = (e: SohbetEksik) => {
    if (window.matchMedia(DAR).matches) { setAcik(false); try { localStorage.setItem(ACIK_ANAHTARI, "0"); } catch { /* saklama yok */ } }
    rb?.git(e);
  };
  const oneriSonucu = (m: SohbetIletisi, d: "uygulandi" | "vazgecildi") => {
    setIletiler((l) => (l ?? []).map((x) => (x.id === m.id && x.ek?.oneri ? { ...x, ek: { ...x.ek, oneri: { ...x.ek.oneri, durum: d } } } : x)));
    void sayOneriEylemi(m.id, d);
    requestAnimationFrame(() => document.getElementById(`say-o-${m.id}`)?.focus());
  };
  const uygula = (m: SohbetIletisi) => {
    const o = m.ek?.oneri;
    if (!o || o.durum || !rb || rb.id !== m.ek?.rapor) return;
    rb.sonucUygula(o.deger);
    oneriSonucu(m, "uygulandi");
    bildir(`Öneri rapora uygulandı: ${o.ad}. Kaydetmeyi unutmayın.`);
  };
  const vazgec = (m: SohbetIletisi) => { if (m.ek?.oneri && !m.ek.oneri.durum) oneriSonucu(m, "vazgecildi"); };

  return (
    <>
      {!acik && (
        <button ref={fab} className={stil.fab} type="button" data-say-fab="" onClick={() => ac()} aria-haspopup="dialog" aria-controls="say-panel" aria-expanded={false}
          aria-label="S.A.Y — saha asistanı">
          <span className={stil.fabIkon}><Ikon ad="sparkles" /></span>
          <span className={stil.fabYazi}>S.A.Y<small>Asistan</small></span>
        </button>
      )}
      {acik && (
        <aside className={stil.panel} id="say-panel" role="dialog" aria-labelledby="say-baslik"
          onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); kapat(); } }}>
          <div className={stil.bas}>
            <span className={stil.avatar}><Ikon ad="sparkles" /></span>
            <div className={stil.kimlik}>
              <h2 id="say-baslik">S.A.Y</h2>
              <p className={stil.altYazi}>{raporda ? "Bu raporu okudum · öneri verir, rapora siz uygularsınız" : "Saha asistanı · sorun, yol göstereyim"}</p>
            </div>
            {!!iletiler?.length && (
              <button className={stil.basTus} type="button" onClick={() => void temizle()} aria-label="Sohbeti temizle" title="Sohbeti temizle"><Ikon ad="trash-2" /></button>
            )}
            <button className={stil.basTus} id="say-kapat" type="button" onClick={kapat} aria-label="S.A.Y'ı kapat"><Ikon ad="x" /></button>
          </div>
          <div className={stil.govde} ref={govde}>
            {!bagli && <Serit tur="uyari" ikon="wifi-off">Bağlantı yok: S.A.Y bağlantı gelince çalışır.{raporda ? " Raporu yazmaya devam edebilirsiniz." : ""}</Serit>}
            {bagli && !durum.anahtar && <Serit tur="uyari" ikon="key-round">API anahtarı girilmedi (Firma ayarları › Yapay zekâ): S.A.Y cevap veremez.</Serit>}
            {hazir && durum.sinirDoldu && <Serit tur="uyari" ikon="triangle-alert">Bu ay kişi başı sınırınız doldu; yönetici Firma ayarları&apos;ndan artırabilir.</Serit>}
            {iletiler && !iletiler.length && (
              <p className={stil.bos}>{raporda
                ? "Bu raporu okudum. Eksikleri sorabilir, sonuç için öneri isteyebilirsiniz. Önerileri siz onaylamadan rapora hiçbir şey yazılmaz."
                : "Merhaba! Sizi bekleyen işleri gösterebilir, bu sayfada ne yapılacağını anlatabilirim. Bir sorunuz varsa yazın."}</p>
            )}
            <ol className={stil.liste} aria-live="polite" aria-busy={bekliyor || !iletiler || undefined}>
              {(iletiler ?? []).map((m, i, l) => (
                <IletiYeri key={m.id} m={m} onceki={l[i - 1]} rb={rb} git={git} uygula={uygula} vazgec={vazgec} />
              ))}
            </ol>
            {bekliyor && <p className={stil.yaziyor} role="status">S.A.Y düşünüyor…</p>}
            {hata && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
          </div>
          <div className={stil.alt}>
            <div className={stil.hizli}>
              {(raporda ? RAPOR : GENEL).map(([k, ad]) => (
                <button key={k} className={stil.cip} type="button" disabled={!hazir || bekliyor} onClick={() => void hizliSor(k)}>{ad}</button>
              ))}
            </div>
            <form className={stil.yaz} onSubmit={(e) => void gonder(e)}>
              <label className={stil.gizli} htmlFor="say-girdi">S.A.Y&apos;a sor</label>
              <input ref={girdi} className={stil.girdi} id="say-girdi" autoComplete="off" maxLength={500} placeholder={raporda ? "Bu rapor hakkında sorun" : "S.A.Y'a sorun"}
                value={soru} onChange={(e) => setSoru(e.target.value)} disabled={!hazir} />
              <button className={stil.gonder} type="submit" aria-label="Gönder" disabled={!hazir || bekliyor}><Ikon ad="send" /></button>
            </form>
            <p className={stil.not}>S.A.Y&apos;a müşteri adı, adres ve kişi adı gönderilmez (sorunuza kendiniz yazmadıkça). Sohbet geçmişiniz saklanır, yalnız siz görürsünüz; sayfa değişince silinmez.</p>
          </div>
        </aside>
      )}
    </>
  );
}

/** yer değişince ayraç ("Planlar", "Rapor DM-…" …) */
function IletiYeri({ m, onceki, ...p }: { m: SohbetIletisi; onceki?: SohbetIletisi; rb: SayRaporBagi | null; git: (e: SohbetEksik) => void; uygula: (m: SohbetIletisi) => void; vazgec: (m: SohbetIletisi) => void }) {
  return <>{(!onceki || onceki.yer !== m.yer) && <li className={stil.yer}>{m.yer}</li>}<Ileti m={m} {...p} /></>;
}
