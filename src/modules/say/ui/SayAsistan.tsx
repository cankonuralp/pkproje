"use client";
/* S.A.Y SAHA ASİSTANI (380; maket say.js BB6 — reisim 2026-10-03: "her yer de gözükecek şekilde … daha şık … daha yuvarlak daha ilgi çekici",
   "geçmiş silinmez") — uygulama düzeninde TEK bileşen (her firma sayfası; müşteri paneli ve Yönetim'de yok). Sağ altta yuvarlak düğme (firma yapay
   zekâyı açtıysa); panel masaüstü / tablette sağda yan pencere, telefonda tam ekran; açık / kapalı hâli bu cihazda kalır (sayfa değişince düşmez).
   Geçmiş sunucuda, kişinin hesabında (yalnız kendisi). Hızlı sorular kuralla; serbest soru yapay zekâya. Cevap DÜZ METİN çizilir (HTML işlenmez).
   Bağlantı yoksa, anahtar girilmemişse, sınır dolduysa şerit söyler (sessiz kalmaz). Esc kapatır; açılınca odak soru alanına, kapanınca düğmeye.
   382 — RAPOR EKRANI (baglam.ts: düzenlenen rapor açıkken): hızlı sorular "Eksik alanlar neler?" (bölüm başına "Git" alana götürür) ve "Sonuç ne
   olmalı?" (kriterlerle seçilen uyuşmuyorsa öneri kartı: "Uygula" denetçinin seçimiyle aynı yoldan forma yazar — Kaydet'le kaydedilir; "Vazgeç").
   "Git" ve "Uygula" yalnız o rapor açıkken; sonucu geçmişte kalır. Öneri vermeden rapora hiçbir şey yazılmaz.
   522 — EK (pkproje §3.10 m.17, maket say.js ekran 11): yazma kutusunun yanında ataç → Fotoğraf çek · Galeriden seç · Belge ekle (PDF, Word);
   eklenenler gönderilmeden önce kutunun üstünde küçük görüntü / ad + boyut, × ile çıkar; gönderilen soruda adı görünür. Fotoğraf cihazda küçültülür;
   tür, adet (4) ve toplam boy (4 MB) sunucuda yeniden denetlenir. Dosya saklanmaz.
   542 — S.A.Y RAPORA GİRER (sunum 541 onaylı; reisim 2026-10-14: "oku tuşu olmayacak say asistandan gir ve fotoğrafı okuyup ilgili yerlere girişleri
   yap diyeceğim ve yapacak"): rapor ekranında "Fotoğrafları oku ve gir" (okunmamış fotoğraflar okunur, değerler boş alanlara — yeşil / sarı),
   "Maddeleri uygun işaretle", yazılan kısa komutlar (../istek.ts: "sonucu uygun yap", "üstüne yaz", "geri al" …) kuralla, yapay zekâya gitmeden
   ekranda yapılır; S.A.Y'ın cevabını sunucu sayılardan kurar. Cevabın altında "Geri al" ve dolu alan kaldıysa "Dolu alanları da değiştir" (yalnız
   işi yapan sayfada). K5: rapordayken ataçla eklenen fotoğraf rapora konur (birden çok bölüm varsa hangisine olduğu sorulur) ve okunup girilir. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { fotografiKucult } from "../../../components/foto/kucult";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { useGorunurAlan } from "../../../components/pencere/gorunurAlan";
import { Serit } from "../../../components/serit/Serit";
import type { SohbetEkAdi, SohbetEksik, SohbetIletisi } from "../../../server/yz/sohbet";
import { EK_EN_COK_ADET, EK_EN_COK_BAYT } from "../ek-sinir";
import type { SayDurum, SayYaniti } from "../server/say";
import { istekTani, type Istek } from "../istek";
import { useSayRaporBagi, type SayGeriAl, type SayRaporBagi } from "./baglam";
import { sayDurumEylemi, sayEkliSorEylemi, sayGecmisEylemi, sayHizliEylemi, sayOneriEylemi, sayRaporEylemi, saySorEylemi, sayTemizleEylemi } from "./eylemler";
import stil from "./say.module.css";

const ACIK_ANAHTARI = "probata-say-acik";
type Hizli = "bekleyen" | "sayfa" | "eksik" | "sonuc" | "oku" | "maddeler";
const GENEL: [k: Hizli, ad: string][] = [["bekleyen", "Beni ne bekliyor?"], ["sayfa", "Bu sayfada ne yapılır?"]];
const RAPOR: [k: Hizli, ad: string][] = [["oku", "Fotoğrafları oku ve gir"], ["maddeler", "Maddeleri uygun işaretle"], ["eksik", "Eksik alanlar neler?"],
  ["sonuc", "Sonuç ne olmalı?"]];
/** 542: S.A.Y'ın rapora yaptığı işin bu sayfadaki eylemleri (ileti kimliği → geri al / dolu alanları da değiştir) */
interface IslemEylemi { geriAl?: SayGeriAl; ustune?: () => { sayi: number; geriAl: SayGeriAl } }
const DAR = "(max-width: 767.98px)";

function cevrimici(): boolean { return typeof navigator === "undefined" || navigator.onLine !== false; }

/* 522: ek — gönderilmeden önce yalnız bu ekranda (görüntüsü blob: adresiyle); sunucu türü içerikten yeniden denetler */
interface Ek extends SohbetEkAdi { id: number; dosya: File; url: string | null }
const WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const BELGE_TURLERI = `.pdf,.docx,application/pdf,${WORD}`;
function boyutYaz(b: number): string {
  return b >= 1048576 ? `${String(Math.round(b / 104857.6) / 10).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}
function ekTuru(f: File): SohbetEkAdi["tur"] | null {
  const ad = f.name.toLocaleLowerCase("tr");
  if (/^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/.test(ad)) return "foto";
  if (f.type === "application/pdf" || ad.endsWith(".pdf")) return "pdf";
  if (f.type === WORD || ad.endsWith(".docx")) return "word";
  return null;
}
const TUR_AD: Record<SohbetEkAdi["tur"], string> = { foto: "Fotoğraf", pdf: "PDF", word: "Word" };

function EkListesi({ ekler, cikar }: { ekler: readonly (SohbetEkAdi & { url?: string | null })[]; cikar?: (i: number) => void }) {
  return (
    <ul className={stil.ekler} aria-label="Ekler">
      {ekler.map((e, i) => (
        <li key={i}>
          {/* blob: adresi: yalnız bu cihazda seçilen, henüz gönderilmemiş fotoğraf (sunucuda kopyası yok) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {e.url ? <img src={e.url} alt="" /> : <Ikon ad={e.tur === "foto" ? "image" : "file-text"} kucuk />}
          <b title={e.ad}>{e.ad}</b><small>{TUR_AD[e.tur]} · {boyutYaz(e.boyut)}</small>
          {cikar && <button className={stil.ekCikar} type="button" onClick={() => cikar(i)} aria-label={`${e.ad} ekini çıkar`} title="Çıkar"><Ikon ad="x" kucuk /></button>}
        </li>
      ))}
    </ul>
  );
}

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

function Ileti({ m, rb, git, uygula, vazgec, eylem, eylemYap }: {
  m: SohbetIletisi; rb: SayRaporBagi | null; git: (e: SohbetEksik) => void; uygula: (m: SohbetIletisi) => void; vazgec: (m: SohbetIletisi) => void;
  eylem?: IslemEylemi; eylemYap: (m: SohbetIletisi, ne: "geri" | "ustune") => void;
}) {
  if (m.kim === "ben") return <li className={`${stil.mesaj} ${stil.ben}`}>{m.ek?.ekler?.length ? <EkListesi ekler={m.ek.ekler} /> : null}{m.metin}</li>;
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
      {eylem && (eylem.geriAl || eylem.ustune) && (
        <div className={stil.oneriTuslar}>
          {eylem.ustune && <button className={`${stil.kucukTus} ${stil.birincil}`} type="button" onClick={() => eylemYap(m, "ustune")}><Ikon ad="pencil" kucuk />Dolu alanları da değiştir</button>}
          {eylem.geriAl && <button className={stil.kucukTus} type="button" onClick={() => eylemYap(m, "geri")}><Ikon ad="undo-2" kucuk />Geri al</button>}
        </div>
      )}
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
  const [ekler, setEkler] = useState<Ek[]>([]);
  const [menu, setMenu] = useState(false);
  /* 542: rapora yapılan işin eylemleri (bu sayfada), okuma ilerlemesi, eklenen fotoğrafın bölümü sorusu */
  const [islemler, setIslemler] = useState<ReadonlyMap<string, IslemEylemi>>(() => new Map());
  const [ilerleme, setIlerleme] = useState<string | null>(null);
  const [bolumSor, setBolumSor] = useState<{ fotolar: File[]; soru: string } | null>(null);
  const ekSira = useRef(0);
  const atac = useRef<HTMLButtonElement>(null);
  const fab = useRef<HTMLButtonElement>(null);
  const girdi = useRef<HTMLInputElement>(null);
  const govde = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  useGorunurAlan(panel, acik);

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
  /* ek menüsü dışarı tıklanınca kapanır */
  useEffect(() => {
    if (!menu) return;
    const d = (e: MouseEvent) => { if (!(e.target as Element | null)?.closest?.("[data-say-ek]")) setMenu(false); };
    document.addEventListener("click", d);
    return () => document.removeEventListener("click", d);
  }, [menu]);
  useEffect(() => {
    const f = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== "saychat") return;
      setAcik(false);
      try { localStorage.setItem(ACIK_ANAHTARI, "0"); } catch { /* saklama yok */ }
    };
    window.addEventListener("probata-panel", f);
    return () => window.removeEventListener("probata-panel", f);
  }, []);
  useEffect(() => {
    if (durum?.acik) document.documentElement.setAttribute("data-say", "var");
    return () => document.documentElement.removeAttribute("data-say");
  }, [durum?.acik]);

  if (!durum?.acik) return null;
  const hazir = durum.anahtar && bagli;
  const raporda = !!rb;

  const ac = (odakla = true) => {
    /* 524: S.A.Y Chat ile aynı yer — biri açılınca öteki kapanır */
    window.dispatchEvent(new CustomEvent("probata-panel", { detail: "say" }));
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
  /* ── 542: S.A.Y rapora girer — iş ekranda (rb), cevabı sunucu sayılardan kurar (geçmişe yazılır) ── */
  const islemKaydet = async (girdi: Record<string, unknown>, eylem?: IslemEylemi) => {
    if (!rb) return;
    const y = await sayRaporEylemi({ hizli: "islem", rapor: { id: rb.id, no: rb.no }, islem: girdi });
    if (y.durum === "tamam" && eylem && (eylem.geriAl || eylem.ustune)) {
      const m = y.iletiler.find((x) => x.kim === "say");
      if (m) setIslemler((x) => new Map(x).set(m.id, eylem));
    }
    sonuc(y);
  };
  /** en son, hâlâ kullanılabilen eylem (yazılan "üstüne yaz" / "geri al" için) */
  const sonEylem = (ne: "geri" | "ustune") => [...islemler.entries()].reverse().find(([, e]) => (ne === "geri" ? e.geriAl : e.ustune));
  const islemYap = async (istek: Istek, soru: string, ek: readonly { dosya: string; bolum: string }[] = []) => {
    if (!rb || bekliyor) return;
    setBekliyor(true); setHata(null);
    try {
      if (istek === "oku") {
        const r = await rb.fotolariOku((x) => setIlerleme(x), ek);
        setIlerleme(null);
        await islemKaydet({ istek, soru, sayi: r.ozet.okunan, okuma: r.ozet }, { geriAl: r.geriAl, ...(r.ustune ? { ustune: r.ustune } : {}) });
      } else if (istek === "maddeler") {
        const r = rb.maddeleriIsaretle();
        await islemKaydet({ istek, soru, sayi: r.sayi }, r.sayi ? { geriAl: r.geriAl } : undefined);
      } else if (istek === "sonuc_uygun" || istek === "sonuc_uygun_degil") {
        const r = rb.sonucYap(istek === "sonuc_uygun" ? "uygun" : "uygun_degil");
        await islemKaydet({ istek, soru, sayi: r.sayi, var: r.var }, r.sayi ? { geriAl: r.geriAl } : undefined);
      } else {
        const s = sonEylem(istek === "geri" ? "geri" : "ustune");
        await eylemCalistir(s?.[0] ?? null, istek === "geri" ? "geri" : "ustune", soru);
      }
    } catch { setIlerleme(null); setHata("S.A.Y'a ulaşılamadı; bağlantıyı kontrol edip yeniden deneyin."); } finally { setBekliyor(false); }
  };
  /** iletinin altındaki "Geri al" / "Dolu alanları da değiştir" (ya da yazılan komut): bir kez çalışır; sonucu geçmişe */
  const eylemCalistir = async (id: string | null, ne: "geri" | "ustune", soru: string) => {
    const e = id ? islemler.get(id) : undefined;
    let sayi = 0, yeni: IslemEylemi | undefined, kalan: IslemEylemi | null = null;
    if (e && ne === "geri" && e.geriAl) { sayi = e.geriAl(); kalan = {}; }
    if (e && ne === "ustune" && e.ustune) { const r = e.ustune(); sayi = r.sayi; yeni = r.sayi ? { geriAl: r.geriAl } : undefined; kalan = { geriAl: e.geriAl }; }
    if (id && kalan) { const k = kalan; setIslemler((x) => new Map(x).set(id, k)); }
    await islemKaydet({ istek: ne, soru, sayi }, yeni);
  };
  const eylemYap = (m: SohbetIletisi, ne: "geri" | "ustune") => {
    if (bekliyor) return;
    setBekliyor(true);
    eylemCalistir(m.id, ne, ne === "geri" ? "Geri al" : "Dolu alanları da değiştir")
      .catch(() => setHata("S.A.Y'a ulaşılamadı; bağlantıyı kontrol edip yeniden deneyin."))
      .finally(() => { setBekliyor(false); girdi.current?.focus(); });
  };
  /** K5: S.A.Y'a eklenen fotoğraflar rapora (seçilen bölüme) konur, sonra okunup girilir */
  const fotoKoyVeOku = async (fotolar: readonly File[], bolum: string, soru: string) => {
    if (!rb) return;
    setBolumSor(null);
    setBekliyor(true); setHata(null);
    const eklenen: { dosya: string; bolum: string }[] = [];
    try {
      for (const [i, f] of fotolar.entries()) {
        setIlerleme(`Fotoğraf rapora ekleniyor · ${i + 1} / ${fotolar.length}`);
        const r = await rb.fotoEkle(f, bolum);
        if ("neden" in r) { setHata(r.neden); break; }
        eklenen.push({ dosya: r.dosya, bolum });
      }
    } catch { setHata("Fotoğraf eklenemedi; bağlantıyı kontrol edip yeniden deneyin."); }
    setIlerleme(null); setBekliyor(false);
    for (const x of ekler) if (x.url) URL.revokeObjectURL(x.url);
    setEkler([]); setSoru("");
    if (eklenen.length) await islemYap("oku", soru || "Fotoğrafı oku ve gir", eklenen);
  };
  const hizliSor = async (k: Hizli) => {
    if (bekliyor) return;
    if ((k === "oku" || k === "maddeler") && rb) { await islemYap(k, k === "oku" ? "Fotoğrafları oku ve gir" : "Maddeleri uygun işaretle"); return; }
    setBekliyor(true);
    try {
      if ((k === "eksik" || k === "sonuc") && rb) {
        sonuc(await sayRaporEylemi({ hizli: k, rapor: { id: rb.id, no: rb.no }, ...(k === "eksik" ? { eksik: rb.eksikler().slice(0, 60) } : { sonuc: rb.sonuc() }) }));
      } else if (k === "bekleyen" || k === "sayfa") sonuc(await sayHizliEylemi(k, yol));
    } catch { setHata("S.A.Y'a ulaşılamadı; bağlantıyı kontrol edip yeniden deneyin."); } finally { setBekliyor(false); }
  };
  /* 522: ek ekle — tür ve boy cihazda ön denetim (sunucu yeniden denetler); fotoğraf küçültülür */
  const ekSec = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    setMenu(false);
    requestAnimationFrame(() => girdi.current?.focus());
    if (!f) return;
    const tur = ekTuru(f);
    if (!tur) { bildir("Yalnız fotoğraf, PDF ya da Word (.docx) eklenir."); return; }
    if (ekler.length >= EK_EN_COK_ADET) { bildir(`Bir soruya en çok ${EK_EN_COK_ADET} ek konur.`); return; }
    const dosya = tur === "foto" ? await fotografiKucult(f) : f;
    if (ekler.reduce((t, x) => t + x.boyut, 0) + dosya.size > EK_EN_COK_BAYT) { bildir(`${f.name} ${boyutYaz(dosya.size)}: ekler toplam en çok 4 MB olabilir.`); return; }
    let url: string | null = null;
    if (tur === "foto") { try { url = URL.createObjectURL(dosya); } catch { url = null; } }
    setEkler((l) => [...l, { id: ++ekSira.current, dosya, ad: f.name, boyut: dosya.size, tur, url }]);
    bildir(`${f.name} eklendi; sorunuzla birlikte gider.`);
  };
  const ekCikar = (i: number) => {
    const e = ekler[i];
    if (!e) return;
    if (e.url) URL.revokeObjectURL(e.url);
    setEkler((l) => l.filter((x) => x.id !== e.id));
    bildir(`${e.ad} çıkarıldı.`);
    girdi.current?.focus();
  };
  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    const v = soru.trim();
    if (!v && !ekler.length) { girdi.current?.focus(); return; }
    if (bekliyor) return;
    /* 542: rapordayken kısa komut ekranda yapılır (yapay zekâya gitmez); "evet" yalnız bekleyen "Değiştireyim mi?" varsa */
    if (rb) {
      const istek = v ? istekTani(v) : null;
      const fotolar = ekler.filter((x) => x.tur === "foto").map((x) => x.dosya);
      if (fotolar.length && fotolar.length === ekler.length && (!v || istek === "oku")) {
        const l = rb.fotoBolumleri();
        if (l.length === 1) { await fotoKoyVeOku(fotolar, l[0].id, v); return; }
        if (l.length > 1) { setBolumSor({ fotolar, soru: v }); return; }
      }
      if (istek && !ekler.length && !(istek === "ustune" && /^(evet|değiştir|evet değiştir)$/i.test(v) && !sonEylem("ustune"))) {
        setSoru("");
        await islemYap(istek, v);
        girdi.current?.focus();
        return;
      }
    }
    setBekliyor(true); setMenu(false);
    try {
      const canli = rb ? { id: rb.id, cevaplar: rb.cevaplar() } : undefined;
      let y: SayYaniti;
      if (ekler.length) {
        const fd = new FormData();
        fd.set("soru", v); fd.set("yol", yol);
        if (rb) { fd.set("raporNo", rb.no); fd.set("canli", JSON.stringify(canli)); }
        for (const x of ekler) fd.append("ek", x.dosya, x.ad);
        y = await sayEkliSorEylemi(fd);
      } else y = await saySorEylemi(v, yol, rb?.no, canli);
      if (y.durum === "tamam") {
        setSoru("");
        for (const x of ekler) if (x.url) URL.revokeObjectURL(x.url);
        setEkler([]);
      }
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
        <aside ref={panel} className={stil.panel} id="say-panel" role="dialog" aria-labelledby="say-baslik"
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            e.stopPropagation();
            if (menu) { setMenu(false); atac.current?.focus(); } else kapat();
          }}>
          <div className={stil.bas}>
            <span className={stil.avatar}><Ikon ad="sparkles" /></span>
            <div className={stil.kimlik}>
              <h2 id="say-baslik">S.A.Y</h2>
              <p className={stil.altYazi}>{raporda ? "Bu rapordayım · fotoğrafları okur, boş alanlara girerim" : "Saha asistanı · sorun, yol göstereyim"}</p>
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
                ? "Fotoğrafı bölümüne ekleyin, “Fotoğrafları oku ve gir” deyin; okuduklarımı boş alanlara girerim. Kaydetmek sizde."
                : "Merhaba! Sizi bekleyen işleri gösterebilir, bu sayfada ne yapılacağını anlatabilirim. Bir sorunuz varsa yazın."}</p>
            )}
            <ol className={stil.liste} aria-live="polite" aria-busy={bekliyor || !iletiler || undefined}>
              {(iletiler ?? []).map((m, i, l) => (
                <IletiYeri key={m.id} m={m} onceki={l[i - 1]} rb={rb} git={git} uygula={uygula} vazgec={vazgec}
                  eylem={rb && m.ek?.rapor === rb.id ? islemler.get(m.id) : undefined} eylemYap={eylemYap} />
              ))}
            </ol>
            {bolumSor && rb && (
              <div className={`${stil.mesaj} ${stil.o}`} role="group" aria-label="Fotoğraf hangi bölüme">
                <p>Fotoğraf hangi bölüme?</p>
                <div className={stil.oneriTuslar}>
                  {rb.fotoBolumleri().map((b) => (
                    <button key={b.id} className={stil.kucukTus} type="button" onClick={() => void fotoKoyVeOku(bolumSor.fotolar, b.id, bolumSor.soru)}>{b.ad}</button>
                  ))}
                  <button className={stil.kucukTus} type="button" onClick={() => setBolumSor(null)}>Vazgeç</button>
                </div>
              </div>
            )}
            {bekliyor && <p className={stil.yaziyor} role="status">{ilerleme ? `S.A.Y okuyor: ${ilerleme}` : "S.A.Y düşünüyor…"}</p>}
            {hata && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
          </div>
          <div className={stil.alt}>
            <div className={stil.hizli}>
              {(raporda ? RAPOR : GENEL).map(([k, ad]) => (
                <button key={k} className={stil.cip} type="button" disabled={!hazir || bekliyor} onClick={() => void hizliSor(k)}>{ad}</button>
              ))}
            </div>
            {!!ekler.length && <EkListesi ekler={ekler} cikar={ekCikar} />}
            <form className={stil.yaz} onSubmit={(e) => void gonder(e)}>
              <div className={stil.ek} data-say-ek="">
                <button ref={atac} className={stil.gonder} type="button" onClick={() => setMenu((m) => !m)} disabled={!hazir || bekliyor}
                  aria-haspopup="true" aria-expanded={menu} aria-controls="say-ek-menu" aria-label="Ek ekle: fotoğraf ya da belge" title="Ek ekle">
                  <Ikon ad="paperclip" />
                </button>
                <div className={stil.ekMenu} id="say-ek-menu" hidden={!menu || !hazir}>
                  <label className={stil.ekOge}><input className={stil.gizli} type="file" accept="image/*" capture="environment" onChange={(e) => void ekSec(e)} />
                    <Ikon ad="camera" kucuk />Fotoğraf çek</label>
                  <label className={stil.ekOge}><input className={stil.gizli} type="file" accept="image/*" onChange={(e) => void ekSec(e)} />
                    <Ikon ad="image" kucuk />Galeriden seç</label>
                  <label className={stil.ekOge}><input className={stil.gizli} type="file" accept={BELGE_TURLERI} onChange={(e) => void ekSec(e)} />
                    <Ikon ad="file-text" kucuk />Belge ekle<small>PDF, Word</small></label>
                </div>
              </div>
              <label className={stil.gizli} htmlFor="say-girdi">S.A.Y&apos;a sor</label>
              <input ref={girdi} className={stil.girdi} id="say-girdi" autoComplete="off" maxLength={500} placeholder={raporda ? "Sorun ya da “oku ve gir” deyin" : "S.A.Y'a sorun"}
                value={soru} onChange={(e) => setSoru(e.target.value)} disabled={!hazir} />
              <button className={stil.gonder} type="submit" aria-label="Gönder" disabled={!hazir || bekliyor}><Ikon ad="send" /></button>
            </form>
            <p className={stil.not}>Sohbeti yalnız siz görürsünüz. Ekler en çok 4 MB.</p>
          </div>
        </aside>
      )}
    </>
  );
}

/** yer değişince ayraç ("Planlar", "Rapor DM-…" …) */
function IletiYeri({ m, onceki, ...p }: {
  m: SohbetIletisi; onceki?: SohbetIletisi; rb: SayRaporBagi | null; git: (e: SohbetEksik) => void; uygula: (m: SohbetIletisi) => void; vazgec: (m: SohbetIletisi) => void;
  eylem?: IslemEylemi; eylemYap: (m: SohbetIletisi, ne: "geri" | "ustune") => void;
}) {
  return <>{(!onceki || onceki.yer !== m.yer) && <li className={stil.yer}>{m.yer}</li>}<Ileti m={m} {...p} /></>;
}
