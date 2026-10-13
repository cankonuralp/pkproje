"use client";
/* S.A.Y CHAT (524; pkproje §3.10 m.1–12, 18–24; maket 521 maket-saychat.js ekran 1–9 — reisim 2026-10-13: "onayılıyorum, yap bitir"). Plan içinde,
   S.A.Y düğmesinin yanında "S.A.Y Chat"; o planın sohbeti (kişinin kayıtları). S.A.Y paneliyle aynı yerde: biri açılınca öteki kapanır.
   · Kayıt = bir ekipman: Fotoğraf çek → Ekipman seçin (Plandan seç / Yeni ekle; branşa göre) → yönerge + numaralı mesaj (n. satır = n. madde; "-" ya
     da boş = bilinmiyor; fazla satırlar nota; hazır değerli satır dolu gelir; altında her satırın düştüğü alan — KURALLA, sema.ts dagit) → okunacak
     fotoğraflar (türün açık başlıkları) → Gönder. Etiket fotoğrafı isteğe bağlı: eklenince kota uyarısı, "Oku ve mesaja yaz" / "Okumadan geç".
   · Gönder / Kaydet / Sil ÇEVRİMDIŞI KUYRUĞA yazılır (bağlantı varsa hemen gider): kayıt "Cihazda" görünür, gidince "Gönderildi" (sunucudan yenilenir).
     Fotoğraflar Gönder'de kuyruğa girer (Vazgeç'te hiçbir şey gitmez); görüntüsü bu oturumda bu cihazda, gidince sunucudan (yalnız sahibi açar).
   · Kişiye özel: veri sunucuda kişinin kendi kayıtlarıyla gelir (RLS).
   · 525 "Bekleyenler için rapor yaz (n)" (ekran 10): gönderilmiş kayıtlar, ne olacağı, "Yeni ekle"de ekipman kodu, "Oluşturmadan önce" koşulları
     (plan günü / tamamlanmış plan, günlük süre, internet, yapay zekâ ve kota) → kayıtlar SIRAYLA taslak olur (her biri ayrı istek), okunacak
     fotoğraflar yapay zekâyla okunur (her biri ayrı istek); olan raporlar bağlantısıyla listelenir, olmayan kayıt nedeniyle bekler.
   · 527 (reisim 2026-10-13: "fotoğraf işaretine tıklayınca galeriden veya pc den de fotoğraf yükleyebilmek olsun"): her fotoğraf tuşu (yeni kayıt,
     ekipman "+ ek", etiket, okunacak başlık) FotoTusu — Fotoğraf çek · Galeriden / bilgisayardan seç (etiket dışında birden çok); uymayan ve kayıttaki
     yeri aşan fotoğraf eklenmez, söylenir (foto-secim.ts). */
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useBildir, useUyar } from "../../../components/bildirim/Bildirim";
import { bekleyenIcerik, kuyrugaEkle, kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik, kuyruktanCikar, type KuyrukSonucOlayi } from "../../../components/cevrimdisi/kuyruk";
import { fotografiKucult } from "../../../components/foto/kucult";
import { GizliResim } from "../../../components/gizli-resim/GizliResim";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere } from "../../../components/pencere/Pencere";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { fotolariSec, fotoSecimiUyarisi } from "../foto-secim";
import type { ChatKaydi, SayChatPaneli } from "../server/kayitlar";
import { dagit, EKIPMAN_FOTO_EN_COK, MESAJ_EN_COK, MESAJ_SATIR_EN_COK, OKUNACAK_FOTO_EN_COK, type ChatEkipman, type ChatFoto, type ChatTanimi, type FotoRolu,
  type KayitGirdisi } from "../sema";
import { chatEtiketOkuEylemi, chatOkutEylemi, chatRaporYazEylemi } from "./eylemler";
import { FotoTusu } from "./FotoTusu";
import stil from "./SayChat.module.css";

const baglantiAbone = (f: () => void) => {
  window.addEventListener("online", f); window.addEventListener("offline", f);
  return () => { window.removeEventListener("online", f); window.removeEventListener("offline", f); };
};
const cevrimdisiMi = () => navigator.onLine === false;
const metneCevir = (d: Blob) => new Promise<string>((coz, red) => {
  const r = new FileReader();
  r.onload = () => { const s = String(r.result); coz(s.slice(s.indexOf(",") + 1)); };
  r.onerror = () => red(r.error ?? new Error("Fotoğraf okunamadı."));
  r.readAsDataURL(d);
});
const SAAT = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });
const bos = (v: string | undefined) => !v || !v.trim() || /^[-–—]+$/.test(v.trim());
/* kayıttaki fotoğraf yeri (sunucunun cümlesi: server/kayitlar.ts chatFoto) */
const EKIPMAN_SINIRI = `Kayda en çok ${EKIPMAN_FOTO_EN_COK} ekipman fotoğrafı`, OKUNACAK_SINIRI = `Başlık başına en çok ${OKUNACAK_FOTO_EN_COK} fotoğraf`;

/** bu ekranda eklenen, henüz kuyruğa girmemiş fotoğraf (görüntüsü blob: adresiyle); anahtar sayfa boyunca artan sayaç */
let yerelSira = 0;
interface Yerel { anahtar: number; dosya: File; url: string; rol: FotoRolu; k: string | null }
interface Taslak {
  id: string; yeni: boolean; surum: number; ekipman: ChatEkipman | null; mesaj: string[]; tanim: ChatTanimi | null; tanimSurum: number;
  fotolar: ChatFoto[]; kaldir: string[]; yerel: Yerel[]; okundu: number[];
}
/** listede görünen kayıt: sunucudaki + cihazda bekleyen hâli */
interface Gorunen { id: string; surum: number; zaman: string | null; ekipman: ChatEkipman | null; mesaj: string[]; tanim: ChatTanimi | null; tanimSurum: number;
  fotolar: ChatFoto[]; bekleyenFoto: number; cihazda: boolean; ileti: string | null; sunucuda: boolean }

/** küçük görüntü: bu cihazda seçilen (blob:) ya da sunucudaki (GizliResim — yalnız sahibi açar) */
function Foto({ f, cikar }: { f: { url?: string; dosya?: string; ad: string }; cikar?: () => void }) {
  return (
    <li className={stil.foto} title={f.ad}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {f.url ? <img src={f.url} alt={f.ad} /> : f.dosya ? <GizliResim dosyaId={f.dosya} alt={f.ad} className={stil.fotoResim} /> : <Ikon ad="camera" />}
      {cikar && <button className={stil.fotoSil} type="button" onClick={cikar} aria-label={`${f.ad} kaldır`} title="Kaldır"><Ikon ad="x" kucuk /></button>}
    </li>
  );
}

const sunucuEkipmani = (k: ChatKaydi): ChatEkipman | null => (k.ekipman?.tip === "plan" ? { tip: "plan", id: k.ekipman.id } : k.ekipman?.tip === "yeni" ? { tip: "yeni", tur: k.ekipman.turId } : null);

export function SayChat({ veri }: { veri: SayChatPaneli }) {
  const router = useRouter();
  const bildir = useBildir(), uyar = useUyar(), onayla = useOnayla();
  const kuyruk = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const cevrimdisi = useSyncExternalStore(baglantiAbone, cevrimdisiMi, () => false);
  const [acik, setAcik] = useState(false);
  const [taslak, setTaslak] = useState<Taslak | null>(null);
  const [cihazIcerik, setCihazIcerik] = useState<Record<string, KayitGirdisi>>({});
  const [secim, setSecim] = useState<{ sekme: "plan" | "yeni"; ara: string } | null>(null);
  const [etiket, setEtiket] = useState<{ dosya: File; okunuyor: boolean } | null>(null);
  const [konum, setKonum] = useState<{ right: number; bottom: number } | null>(null);
  /* 525: rapor yaz ekranı — ekipman kodları (yeni ekipman), kayıt başına hata, oluşan raporlar */
  const [raporEkrani, setRaporEkrani] = useState(false);
  const [kodlar, setKodlar] = useState<Record<string, string>>({});
  const [sonuclar, setSonuclar] = useState<Record<string, { rapor?: { id: string; no: string }; okunan?: number; neden?: string; kod?: boolean }>>({});
  const [yaziyor, setYaziyor] = useState<string | null>(null);
  const fab = useRef<HTMLButtonElement>(null);

  const turAd = (id: string | undefined) => (id && veri.turler[id]?.ad) || "Ekipman";
  const ekipmanTuru = (e: ChatEkipman | null): string | null => (!e ? null : e.tip === "yeni" ? e.tur : veri.planEkipmani.find((x) => x.id === e.id)?.turId
    ?? veri.kayitlar.find((k) => k.ekipman?.tip === "plan" && k.ekipman.id === e.id)?.ekipman?.turId ?? null);
  const ekipAd = (e: ChatEkipman | null) => {
    if (!e) return "Ekipman seçilmedi";
    if (e.tip === "yeni") return `${turAd(e.tur)} (yeni)`;
    const p = veri.planEkipmani.find((x) => x.id === e.id) ?? veri.kayitlar.map((k) => k.ekipman).find((x) => x?.tip === "plan" && x.id === e.id);
    return p && "kod" in p ? `${p.kod} · ${turAd(p.turId)}` : "Plandaki ekipman";
  };

  /* cihazda bekleyen işler: kaydın son hâli (şifreli depodan) */
  const chatIsleri = useMemo(() => kuyruk.isler.filter((x) => x.tur.startsWith("saychat.")), [kuyruk.isler]);
  useEffect(() => {
    let canli = true;
    const idler = [...new Set(chatIsleri.filter((x) => x.tur === "saychat.kaydet").map((x) => x.kayit))];
    void Promise.all(idler.map(async (id) => [id, await bekleyenIcerik(id)] as const)).then((l) => {
      if (!canli) return;
      const o: Record<string, KayitGirdisi> = {};
      for (const [id, b] of l) if (b && b.tur === "saychat.kaydet") o[id] = b.girdi as KayitGirdisi;
      setCihazIcerik(o);
    });
    return () => { canli = false; };
  }, [chatIsleri]);
  /* gönderilen iş sonucu: sunucudaki hâl yenilenir */
  useEffect(() => {
    const f = (e: Event) => { const d = (e as CustomEvent<KuyrukSonucOlayi>).detail; if (d?.tur.startsWith("saychat.") && d.durum === "tamam") router.refresh(); };
    window.addEventListener("probata-islem", f);
    return () => window.removeEventListener("probata-islem", f);
  }, [router]);
  /* S.A.Y ile aynı yer: biri açılınca öteki kapanır */
  useEffect(() => {
    const f = (e: Event) => { if ((e as CustomEvent<string>).detail === "say") setAcik(false); };
    window.addEventListener("probata-panel", f);
    return () => window.removeEventListener("probata-panel", f);
  }, []);
  /* sayfanın sonu düğmenin altında kalmasın (temel.css html[data-saychat]) */
  useEffect(() => {
    document.documentElement.setAttribute("data-saychat", "var");
    return () => document.documentElement.removeAttribute("data-saychat");
  }, []);
  /* düğme S.A.Y düğmesinin solunda (S.A.Y yoksa sağ altta) */
  useEffect(() => {
    const olc = () => {
      const s = document.querySelector<HTMLElement>("[data-say-fab]");
      if (!s) { setKonum(null); return; }
      const r = s.getBoundingClientRect(), right = Math.round(window.innerWidth - r.left + 10), bottom = Math.round(window.innerHeight - r.bottom);
      /* aynı konumda durum değişmez (her DOM değişikliğinde yeniden çizilmesin) */
      setKonum((k) => (k && k.right === right && k.bottom === bottom ? k : { right, bottom }));
    };
    olc();
    const g = new MutationObserver(olc);
    g.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", olc);
    return () => { g.disconnect(); window.removeEventListener("resize", olc); };
  }, []);

  const gorunenler: Gorunen[] = useMemo(() => {
    const silinen = new Set(chatIsleri.filter((x) => x.tur === "saychat.sil").map((x) => x.kayit));
    const l: Gorunen[] = veri.kayitlar.filter((k) => !silinen.has(k.id)).map((k) => ({ id: k.id, surum: k.surum, zaman: k.zaman, ekipman: sunucuEkipmani(k), mesaj: k.mesaj,
      tanim: k.tanim, tanimSurum: k.tanimSurum, fotolar: k.fotolar, bekleyenFoto: 0, cihazda: false, ileti: null, sunucuda: true }));
    for (const [id, g] of Object.entries(cihazIcerik)) {
      if (silinen.has(id) || g.plan !== veri.plan.id) continue;
      const x = l.find((y) => y.id === id), is = chatIsleri.find((y) => y.kayit === id && y.tur === "saychat.kaydet");
      const ortak = { ekipman: g.ekipman ?? null, mesaj: g.mesaj, tanim: (g.tanim as ChatTanimi | null) ?? null, tanimSurum: g.tanimSurum, cihazda: true, ileti: is?.ileti ?? null };
      if (x) Object.assign(x, ortak, { fotolar: x.fotolar.filter((f) => !(g.kaldir ?? []).includes(f.dosya)) });
      else l.push({ id, surum: 0, zaman: is?.zaman ?? null, fotolar: [], bekleyenFoto: 0, sunucuda: false, ...ortak });
    }
    for (const x of l) x.bekleyenFoto = chatIsleri.filter((y) => y.kayit === x.id && y.tur === "saychat.foto").length;
    return l;
  }, [veri, cihazIcerik, chatIsleri]);
  const bekleyenSayisi = gorunenler.filter((g) => g.cihazda || g.bekleyenFoto).length;
  /* rapora hazır: gönderilmiş, cihazda işi yok, ekipmanı ve en az bir ekipman fotoğrafı var */
  const hazirlar = gorunenler.filter((g) => g.sunucuda && !g.cihazda && !g.bekleyenFoto && g.ekipman && g.tanim && g.fotolar.some((f) => f.rol === "ekipman"));

  const ac = () => {
    window.dispatchEvent(new CustomEvent("probata-panel", { detail: "saychat" }));
    setAcik(true);
    requestAnimationFrame(() => document.getElementById("sc-ilk")?.focus());
  };
  const kapat = () => { setAcik(false); setTaslak(null); setRaporEkrani(false); requestAnimationFrame(() => fab.current?.focus()); };

  /* ── taslak ── */
  /* seçilen fotoğraflar (kamera ya da galeri / bilgisayar — birden çok olabilir): küçültülür; uymayan ve kayıttaki yeri aşan eklenmez, söylenir */
  const yerelHazirla = async (l: File[], rol: FotoRolu, k: string | null, yer: number, sinir: string): Promise<Yerel[]> => {
    const s = await fotolariSec(l, yer, (f) => fotografiKucult(f));
    const u = fotoSecimiUyarisi(s, sinir);
    if (u) uyar(u);
    return s.alinan.map((dosya) => ({ anahtar: ++yerelSira, dosya, url: URL.createObjectURL(dosya), rol, k }));
  };
  /** kayıtta bu rol / başlık için kalan yer (sunucudaki + bu ekranda eklenenler) */
  const kalanYer = (t: Taslak, rol: "ekipman" | "okunacak", k: string | null) =>
    (rol === "ekipman" ? EKIPMAN_FOTO_EN_COK : OKUNACAK_FOTO_EN_COK)
    - t.fotolar.filter((f) => f.rol === rol && f.k === k).length - t.yerel.filter((y) => y.rol === rol && y.k === k).length;
  const yeniKayit = async (l: File[]) => {
    const y = await yerelHazirla(l, "ekipman", null, EKIPMAN_FOTO_EN_COK, EKIPMAN_SINIRI);
    if (!y.length) return;
    setTaslak({ id: crypto.randomUUID(), yeni: true, surum: 0, ekipman: null, mesaj: [], tanim: null, tanimSurum: 0, fotolar: [], kaldir: [], yerel: y, okundu: [] });
    setSecim({ sekme: "plan", ara: "" });
  };
  const duzenle = (g: Gorunen) => {
    setTaslak({ id: g.id, yeni: !g.sunucuda, surum: g.surum, ekipman: g.ekipman, mesaj: [...g.mesaj], tanim: g.tanim, tanimSurum: g.tanimSurum,
      fotolar: g.fotolar, kaldir: [], yerel: [], okundu: [] });
    requestAnimationFrame(() => document.getElementById("sc-form-bas")?.focus());
  };
  const birak = (t: Taslak | null) => { for (const y of t?.yerel ?? []) URL.revokeObjectURL(y.url); };
  const vazgec = () => { birak(taslak); setTaslak(null); requestAnimationFrame(() => document.getElementById("sc-ilk")?.focus()); };
  const degis = (f: (t: Taslak) => Taslak) => setTaslak((t) => (t ? f(t) : t));

  /* tür seçilince yönerge o türün ayarından; hazır değerli satır dolu; tür değişince mesaj sıfırlanır, başlığı kalmayan okunacak fotoğraflar düşer */
  const ekipmanSec = (e: ChatEkipman) => {
    const tur = ekipmanTuru(e), c = tur ? veri.turler[tur] : null;
    if (!c) { uyar("Bu türün rapor formatı yayında değil."); return; }
    degis((t) => {
      const ayniTur = t.tanim && ekipmanTuru(t.ekipman) === tur;
      const acikK = new Set(c.tanim.okunacak.filter((o) => o.acik).map((o) => o.k));
      const dusen = t.fotolar.filter((f) => f.rol === "okunacak" && !acikK.has(f.k ?? ""));
      return { ...t, ekipman: e, tanim: ayniTur ? t.tanim : c.tanim, tanimSurum: ayniTur ? t.tanimSurum : c.surum,
        mesaj: ayniTur ? t.mesaj : c.tanim.satirlar.map((s) => s.hazir), okundu: ayniTur ? t.okundu : [],
        fotolar: t.fotolar.filter((f) => !dusen.includes(f)), kaldir: [...t.kaldir, ...dusen.map((f) => f.dosya)],
        yerel: t.yerel.filter((y) => y.rol !== "okunacak" || acikK.has(y.k ?? "")) };
    });
    setSecim(null);
    bildir(`${ekipAd(e)} seçildi; yönerge türün ayarından geldi.`);
    /* pencere kapanınca odağı açana döndürür; sonra ilk satıra */
    setTimeout(() => document.getElementById("sc-s0")?.focus(), 80);
  };
  const fotoEkle = async (l: File[], rol: "ekipman" | "okunacak", k: string | null) => {
    if (!taslak) return;
    const y = await yerelHazirla(l, rol, k, kalanYer(taslak, rol, k), rol === "ekipman" ? EKIPMAN_SINIRI : OKUNACAK_SINIRI);
    if (!y.length) return;
    degis((t) => ({ ...t, yerel: [...t.yerel, ...y] }));
    bildir(`${y.length === 1 ? y[0].dosya.name : `${y.length} fotoğraf`} eklendi; kayıtla birlikte gider.`);
  };
  const yerelCikar = (a: number) => degis((t) => { const y = t.yerel.find((x) => x.anahtar === a); if (y) URL.revokeObjectURL(y.url); return { ...t, yerel: t.yerel.filter((x) => x.anahtar !== a) }; });
  const sunucuCikar = (d: string) => degis((t) => ({ ...t, fotolar: t.fotolar.filter((f) => f.dosya !== d), kaldir: [...t.kaldir, d] }));

  /* etiket fotoğrafı: önce kota uyarısı; okununca boş (ya da hazır değeri değişmemiş) satırlara öneri */
  const etiketSec = async (l: File[]) => {
    if (!taslak) return;
    /* etiket tektir: yenisi eskisinin yerine (yer hep 1) */
    const [y] = await yerelHazirla(l.slice(0, 1), "etiket", null, 1, "");
    if (!y) return;
    degis((t) => ({ ...t, yerel: [...t.yerel.filter((x) => x.rol !== "etiket"), y], fotolar: t.fotolar.filter((x) => x.rol !== "etiket"),
      kaldir: [...t.kaldir, ...t.fotolar.filter((x) => x.rol === "etiket").map((x) => x.dosya)] }));
    setEtiket({ dosya: y.dosya, okunuyor: false });
  };
  const etiketOku = async () => {
    if (!etiket || !taslak?.tanim) return;
    setEtiket({ ...etiket, okunuyor: true });
    const fd = new FormData();
    fd.set("foto", etiket.dosya); fd.set("plan", veri.plan.id); fd.set("satirlar", JSON.stringify(taslak.tanim.satirlar.map((s) => ({ ad: s.ad, alan: s.alan }))));
    try {
      const r = await chatEtiketOkuEylemi(fd);
      if (r.durum !== "tamam") { uyar(r.neden); setEtiket(null); return; }
      degis((t) => {
        const mesaj = [...t.mesaj], okundu = [...t.okundu];
        for (const o of r.okunan) {
          const st = t.tanim?.satirlar[o.i];
          if (!st || st.alan === "yorum") continue;
          if (!bos(mesaj[o.i]) && mesaj[o.i] !== st.hazir) continue;
          mesaj[o.i] = o.deger.slice(0, MESAJ_SATIR_EN_COK); if (!okundu.includes(o.i)) okundu.push(o.i);
        }
        return { ...t, mesaj, okundu };
      });
      bildir(r.bildirim);
    } catch { uyar("Okuma yapılamadı; bağlantıyı kontrol edip satırları elle yazın."); }
    setEtiket(null);
    /* pencere kapanınca odağı açana döndürür; sonra ilk satıra */
    setTimeout(() => document.getElementById("sc-s0")?.focus(), 80);
  };

  const gonder = async () => {
    const t = taslak;
    if (!t) return;
    if (!t.ekipman || !t.tanim) { uyar("Önce ekipmanı seçin."); setSecim({ sekme: "plan", ara: "" }); return; }
    const ekipFoto = t.fotolar.filter((f) => f.rol === "ekipman").length + t.yerel.filter((y) => y.rol === "ekipman").length;
    if (!ekipFoto) { uyar("En az bir ekipman fotoğrafı çekin."); return; }
    const ad = ekipAd(t.ekipman);
    /* önce kayıt, sonra fotoğraflar (CI 588099e, telefon): fotoğraf kaydın sürümünü artırır — kayıt sonra kuyruğa girerse ilk fotoğraf gitmiş olur,
       kayıt eski sürümle "çakışma"ya düşerdi. Fotoğraf sürüme bakmaz; kayıt yoksa sunucu fotoğrafla açar. */
    try {
      const mesaj = t.mesaj.slice(0, MESAJ_EN_COK).map((x) => (x ?? "").slice(0, MESAJ_SATIR_EN_COK));
      while (mesaj.length && !mesaj[mesaj.length - 1]?.trim() && mesaj.length > t.tanim.satirlar.length) mesaj.pop();
      const girdi: KayitGirdisi = { plan: veri.plan.id, ekipman: t.ekipman, mesaj, tanim: t.tanim, tanimSurum: t.tanimSurum, kaldir: t.kaldir };
      await kuyrugaEkle({ tur: "saychat.kaydet", kayit: t.id, surum: t.surum, girdi, ad: `S.A.Y Chat · ${ad}` });
      for (const y of t.yerel) {
        await kuyrugaEkle({ tur: "saychat.foto", kayit: t.id, surum: t.surum, ad: `S.A.Y Chat · ${ad} · ${y.dosya.name}`,
          girdi: { plan: veri.plan.id, rol: y.rol, k: y.k, ad: y.dosya.name, veri: await metneCevir(y.dosya) } });
      }
    } catch { uyar("Kayıt cihaza yazılamadı; yeniden deneyin."); return; }
    birak(t); setTaslak(null);
    bildir(cevrimdisiMi() ? "Kayıt cihaza kaydedildi; bağlantı gelince gönderilecek." : t.yeni ? "Kayıt gönderiliyor…" : "Değişiklik gönderiliyor…");
    requestAnimationFrame(() => document.getElementById("sc-ilk")?.focus());
  };
  const kayitSil = async () => {
    const t = taslak;
    if (!t || !(await onayla({ baslik: "Kaydı sil", metin: `${ekipAd(t.ekipman)} kaydı ve fotoğrafları silinir.`, tus: "Sil", tehlike: true }))) return;
    for (const x of chatIsleri.filter((y) => y.kayit === t.id)) await kuyruktanCikar(x.id);
    if (veri.kayitlar.some((k) => k.id === t.id)) await kuyrugaEkle({ tur: "saychat.sil", kayit: t.id, surum: t.surum, girdi: null, ad: `S.A.Y Chat · sil · ${ekipAd(t.ekipman)}` });
    birak(t); setTaslak(null);
    bildir("Kayıt silindi.");
    requestAnimationFrame(() => document.getElementById("sc-ilk")?.focus());
  };

  /* ── çizim ── */
  const fotolar = (t: Taslak, rol: FotoRolu, k: string | null) => [
    ...t.fotolar.filter((f) => f.rol === rol && f.k === k).map((f) => <Foto key={f.dosya} f={{ dosya: f.dosya, ad: f.ad }} cikar={() => sunucuCikar(f.dosya)} />),
    ...t.yerel.filter((y) => y.rol === rol && y.k === k).map((y) => <Foto key={y.anahtar} f={{ url: y.url, ad: y.dosya.name }} cikar={() => yerelCikar(y.anahtar)} />),
  ];
  const sohbet = (
    <>
      <div className={stil.govdeP}>
        {cevrimdisi && <Serit tur="uyari" ikon="wifi-off">Çevrimdışı · {bekleyenSayisi ? `${bekleyenSayisi} kayıt cihazda bekliyor; bağlantı gelince gider.` : "kayıtlar cihazda birikir, bağlantı gelince gider."}</Serit>}
        {gorunenler.length ? (
          <>
            <p className={stil.ara}>Yalnız sizin bekleyen kayıtlarınız · raporu yazılanlar burada görünmez</p>
            <ol className={stil.liste} aria-label="Kayıtlar">
              {gorunenler.map((g) => {
                const d = g.tanim ? dagit(g.tanim, g.mesaj) : null, turId = ekipmanTuru(g.ekipman), b = turId ? veri.turler[turId]?.basliklar ?? [] : [];
                const ozet = d ? d.satirlar.filter((s) => s.deger && s.alan !== "yorum").slice(0, 4) : [];
                const okl = b.map(([k, ad]) => [ad, g.fotolar.filter((f) => f.rol === "okunacak" && f.k === k).length] as const).filter(([, n]) => n);
                const ekip = g.fotolar.filter((f) => f.rol === "ekipman");
                return (
                  <li key={g.id} className={stil.kayit}>
                    {ekip.length > 0 && <ul className={stil.fotolar} aria-label="Ekipman fotoğrafları">{ekip.slice(0, 4).map((f) => <Foto key={f.dosya} f={{ dosya: f.dosya, ad: f.ad }} />)}</ul>}
                    <p className={stil.kayitBas}><b>{ekipAd(g.ekipman)}</b></p>
                    {(ozet.length > 0 || d?.degerler.yorum) && (
                      <div className={stil.ozet}>
                        {ozet.map((s) => <div key={s.alan}><b>{s.ad}:</b> {s.deger}</div>)}
                        {d?.degerler.yorum && <div><b>Not:</b> {d.degerler.yorum}</div>}
                      </div>
                    )}
                    {okl.length > 0 && <div className={stil.cipler}>{okl.map(([ad, n]) => <span key={ad} className={stil.cip}><Ikon ad="scan-text" kucuk />{ad}{n > 1 ? ` · ${n}` : ""}</span>)}</div>}
                    {g.ileti && <p className={stil.hata}>{g.ileti}</p>}
                    <div className={stil.kayitAlt}>
                      <span className={g.cihazda || g.bekleyenFoto ? stil.cihazda : stil.gitti}>
                        <Ikon ad={g.cihazda || g.bekleyenFoto ? "wifi-off" : "circle-check"} kucuk />
                        {g.cihazda || g.bekleyenFoto ? `Cihazda${g.bekleyenFoto ? ` · ${g.bekleyenFoto} fotoğraf bekliyor` : ""}` : "Gönderildi"}
                        {g.zaman ? ` · ${SAAT.format(new Date(g.zaman))}` : ""}
                      </span>
                      <Tus tur="ikincil" ikon="pencil" onClick={() => duzenle(g)} aria-label={`${ekipAd(g.ekipman)} kaydını düzenle`}>Düzenle</Tus>
                    </div>
                  </li>
                );
              })}
            </ol>
            {hazirlar.length > 0 && (
              <div className={stil.tuslar}>
                <Tus tur="ikincil" ikon="file-plus" onClick={() => { setRaporEkrani(true); setSonuclar({}); requestAnimationFrame(() => document.getElementById("sc-rapor-bas")?.focus()); }}>
                  Bekleyenler için rapor yaz ({hazirlar.length})</Tus>
              </div>
            )}
          </>
        ) : (
          <p className={stil.bosMetin}>Sahada her ekipman için bir kayıt: önce ekipmanın fotoğrafını ekleyin (çekin ya da galeriden seçin), sonra hangi ekipman olduğunu seçin ve yönergedeki sırayla
            mesajı yazın. İnternet olmasa da kayıt cihazda birikir; sonra “Bekleyenler için rapor yaz” ile rapor taslakları oluşur.</p>
        )}
      </div>
      <div className={stil.altP}>
        <div className={stil.yeni}>
          <FotoTusu ad="Fotoğraf ekle" ikon="camera" sinif={stil.birincil} id="sc-ilk" coklu sec={(l) => void yeniKayit(l)} />
          <span className={stil.not}>Yeni kayıt: önce ekipmanın fotoğrafını çekin ya da galeriden seçin.</span>
        </div>
        <p className={stil.not}>Bu sohbeti yalnız siz görürsünüz; plan sorumlusu, teknik yönetici ve yönetici görmez.</p>
      </div>
    </>
  );

  const form = taslak && (() => {
    const t = taslak, tur = ekipmanTuru(t.ekipman), c = tur ? veri.turler[tur] : null;
    const d = t.tanim ? dagit(t.tanim, t.mesaj) : null;
    const n = t.tanim ? Math.min(MESAJ_EN_COK, Math.max(t.tanim.satirlar.length, t.mesaj.length) + 1) : 0;
    const etiketVar = t.fotolar.some((f) => f.rol === "etiket") || t.yerel.some((y) => y.rol === "etiket");
    return (
      <>
        <div className={stil.govdeP}>
          <h3 className={stil.adim} id="sc-form-bas" tabIndex={-1}>{t.yeni && !veri.kayitlar.some((k) => k.id === t.id) ? "Yeni kayıt" : "Kaydı düzenle"} · {ekipAd(t.ekipman)}</h3>
          <div className={stil.ekipman}>
            <span><b>{ekipAd(t.ekipman)}</b><small>{!t.ekipman ? "Bu hangi ekipman? Seçin." : t.ekipman.tip === "plan" ? "plandan" : "rapor yazılırken plana eklenir; kodu o zaman yazılır"}</small></span>
            <Tus tur="ikincil" ikon={t.ekipman ? "pencil" : "list-ordered"} onClick={() => setSecim({ sekme: t.ekipman?.tip === "yeni" ? "yeni" : "plan", ara: "" })}>
              {t.ekipman ? "Değiştir" : "Ekipman seçin"}</Tus>
          </div>
          <p className={stil.ara}>Ekipman fotoğrafları</p>
          <ul className={stil.fotolar} aria-label="Ekipman fotoğrafları">
            {fotolar(t, "ekipman", null)}
            <li><FotoTusu ad="+ ek" etiket="Ekipman fotoğrafı ekle" ikon="camera" sinif={stil.ekle} coklu sec={(l) => void fotoEkle(l, "ekipman", null)} /></li>
          </ul>
          {t.tanim && c && d && (
            <>
              <div className={stil.yonerge}>
                <p className={stil.ara}>Her satıra sırayla</p>
                <ol>{t.tanim.satirlar.map((s, i) => <li key={i}>{s.ad}{s.hazir && <span className={stil.alt}> · {s.hazir}</span>}</li>)}</ol>
                <FotoTusu ad={etiketVar ? "Etiket fotoğrafı · yeniden" : "Etiket fotoğrafı"} ikon="tag" sinif={stil.ikincil} sec={(l) => void etiketSec(l)} />
              </div>
              {etiketVar && <p className={stil.etiketDurum}><Ikon ad="tag" kucuk />Etiket fotoğrafı eklendi · rapora konmaz{t.okundu.length ? ` · ${t.okundu.length} satır okundu` : ""}</p>}
              <p className={stil.ara} id="sc-mesaj-bas">Mesaj · etiket yazmayın; satır sırası yönergenin sırasıdır, bilinmeyene &quot;-&quot;</p>
              <ol className={stil.mesaj} aria-labelledby="sc-mesaj-bas">
                {Array.from({ length: n }, (_, i) => {
                  const st = t.tanim!.satirlar[i], v = t.mesaj[i] ?? "", hz = !!st?.hazir && v === st.hazir, okd = t.okundu.includes(i);
                  return (
                    <li key={i}>
                      <span className={stil.no} aria-hidden="true">{i + 1}</span>
                      <input className={stil.girdi} id={`sc-s${i}`} autoComplete="off" maxLength={MESAJ_SATIR_EN_COK} value={v}
                        aria-label={`${i + 1}. satır (${st ? st.ad : "nota eklenir"})`}
                        onChange={(e) => degis((x) => { const m = [...x.mesaj]; while (m.length < i) m.push(""); m[i] = e.target.value; return { ...x, mesaj: m, okundu: x.okundu.filter((o) => o !== i) }; })} />
                      {hz ? <Rozet tur="notr">hazır</Rozet> : okd ? <Rozet tur="kabul">okundu</Rozet> : null}
                    </li>
                  );
                })}
              </ol>
              <ul className={stil.dagilim} aria-label="Satırların düştüğü alanlar">
                {d.satirlar.map((s, i) => (
                  <li key={i}><b>{i + 1}</b> {s.ad} {s.alan === "yorum" ? (s.deger ? "→ uzman yorumu" : "boş") : !s.deger ? "boş" : t.tanim!.satirlar[i]?.hazir === s.deger ? `${s.deger} · hazır` : <span className={stil.tamam}>✓</span>}</li>
                ))}
                {d.fazla.map((f, j) => <li key={`f${j}`}><b>{t.tanim!.satirlar.length + j + 1}</b> fazla satır → nota eklenir</li>)}
              </ul>
              <p className={stil.ara}>Yapay zekânın okuyacağı fotoğraflar</p>
              {c.basliklar.length ? (
                <>
                  <ul className={stil.okuma}>
                    {c.basliklar.map(([k, ad, ne]) => {
                      const sayi = t.fotolar.filter((f) => f.rol === "okunacak" && f.k === k).length + t.yerel.filter((y) => y.rol === "okunacak" && y.k === k).length;
                      return (
                        <li key={k}>
                          <div className={stil.okumaBas}>
                            <span><b>{ad}</b><small>{ne} · {sayi ? `${sayi} fotoğraf` : "fotoğraf yok"}</small></span>
                            <FotoTusu ad={sayi ? "Bir daha ekle" : "Fotoğraf ekle"} etiket={`${ad}: ${sayi ? "bir daha fotoğraf ekle" : "fotoğraf ekle"}`} ikon="camera"
                              sinif={stil.ikincil} coklu sec={(l) => void fotoEkle(l, "okunacak", k)} />
                          </div>
                          {sayi > 0 && <ul className={stil.fotolar} aria-label={`${ad} fotoğrafları`}>{fotolar(t, "okunacak", k)}</ul>}
                        </li>
                      );
                    })}
                  </ul>
                  <Serit tur="bilgi" ikon="sparkles"><b>Rapor yazılırken yapay zekâ okur.</b> Değerler o bölüme öneri olarak düşer, siz onaylarsınız. Firmanın yapay zekâ kotasından harcar; çevrimdışıyken bekler. Bu fotoğraflar belgeye basılmaz.</Serit>
                </>
              ) : <p className={stil.not}>Bu türde okunacak fotoğraf başlığı yok (Ekipman türleri › S.A.Y Chat ayarları).</p>}
            </>
          )}
        </div>
        <div className={stil.altP}>
          <div className={stil.tuslar}>
            {veri.kayitlar.some((k) => k.id === t.id) || chatIsleri.some((x) => x.kayit === t.id)
              ? <Tus tur="tehlike" ikon="trash-2" onClick={() => void kayitSil()}>Kaydı sil</Tus> : null}
            <Tus tur="ikincil" onClick={vazgec}>Vazgeç</Tus>
            <Tus ikon="send" onClick={() => void gonder()}>{t.yeni ? "Gönder" : "Kaydet"}</Tus>
          </div>
        </div>
      </>
    );
  })();

  /* ── 525 bekleyenler için rapor yaz ── */
  const okunacakSayisi = (g: Gorunen) => g.fotolar.filter((f) => f.rol === "okunacak" && g.tanim?.okunacak.some((o) => o.acik && o.k === f.k)).length;
  const toplamOkuma = hazirlar.reduce((n, g) => n + okunacakSayisi(g), 0);
  const raporYaz = async () => {
    if (yaziyor) return;
    const yeniKodsuz = hazirlar.find((g) => g.ekipman?.tip === "yeni" && !kodlar[g.id]?.trim());
    if (yeniKodsuz) {
      setSonuclar((s) => ({ ...s, [yeniKodsuz.id]: { neden: "Ekipman kodunu yazın (etiketteki; firmada eşsiz).", kod: true } }));
      uyar("Yeni ekipmanın kodunu yazın.");
      requestAnimationFrame(() => document.getElementById(`sc-kod-${yeniKodsuz.id}`)?.focus());
      return;
    }
    const sonuc: typeof sonuclar = {};
    let olan = 0, okunan = 0;
    for (const [i, g] of hazirlar.entries()) {
      setYaziyor(`${i + 1} / ${hazirlar.length} · ${ekipAd(g.ekipman)}`);
      try {
        const r = await chatRaporYazEylemi(veri.plan.id, g.id, kodlar[g.id] ?? null);
        if (r.durum !== "tamam") { sonuc[g.id] = { neden: r.neden, kod: r.alan === "kod" }; continue; }
        olan++;
        let n = 0;
        for (const o of r.okumalar) { setYaziyor(`${i + 1} / ${hazirlar.length} · yapay zekâ okuyor`); n += await chatOkutEylemi(r.rapor.id, o); }
        okunan += n;
        sonuc[g.id] = { rapor: r.rapor, okunan: n };
      } catch { sonuc[g.id] = { neden: "Bağlantı koptu; kayıt bekliyor, yeniden deneyin." }; break; }
    }
    setYaziyor(null);
    setSonuclar(sonuc);
    router.refresh();
    bildir(`${olan} rapor taslağı oluştu${okunan ? `, ${okunan} değer öneri olarak bekliyor` : ""}${olan < hazirlar.length ? `; ${hazirlar.length - olan} kayıt bekliyor` : ""}.`);
    requestAnimationFrame(() => document.getElementById("sc-rapor-sonuc")?.focus());
  };
  const olusanlar = Object.entries(sonuclar).filter(([, x]) => x.rapor);
  const raporEkraniHtml = raporEkrani && (
    <>
      <div className={stil.govdeP}>
        <h3 className={stil.adim} id="sc-rapor-bas" tabIndex={-1}>Bekleyenler için rapor yaz</h3>
        <p className={stil.ara}>{veri.plan.no} · {hazirlar.length} kayıt</p>
        {olusanlar.length > 0 && (
          <div className={stil.sonuc} id="sc-rapor-sonuc" tabIndex={-1} role="status">
            <p><b>{olusanlar.length} rapor taslağı oluştu.</b> Kriterleri ve ölçümleri raporda doldurursunuz; okunan değerler raporda öneri olarak bekler.</p>
            <ul>{olusanlar.map(([k, x]) => <li key={k}><span>{x.rapor!.no}{x.okunan ? ` · ${x.okunan} değer öneri` : ""}</span><TusBaglanti href={`/raporlar/${x.rapor!.id}`} ikon="arrow-right">Raporu aç</TusBaglanti></li>)}</ul>
          </div>
        )}
        {hazirlar.length > 0 ? (
          <ol className={stil.liste} aria-label="Rapora dönüşecek kayıtlar">
            {hazirlar.map((g, i) => {
              const d = dagit(g.tanim!, g.mesaj), alan = Object.keys(d.degerler).filter((a) => a !== "yorum").length;
              const ekip = g.fotolar.filter((f) => f.rol === "ekipman").length, ok = okunacakSayisi(g), x = sonuclar[g.id];
              const on = [g.ekipman?.tip === "plan" ? "Plandaki ekipmana yazılacak" : "Plana yeni ekipman olarak eklenecek", `${alan} alan dolacak`, `${ekip} fotoğraf rapora geçecek`,
                ok ? `${ok} fotoğraf ${veri.yz.hazir ? "yapay zekâyla okunacak" : "saklanacak"}` : "", d.degerler.yorum ? "not → uzman yorumu" : ""].filter(Boolean);
              return (
                <li key={g.id} className={stil.kayit}>
                  <p className={stil.kayitBas}><b>{i + 1} · {ekipAd(g.ekipman)}</b></p>
                  <p className={stil.not}>{on.join(" · ")}</p>
                  {g.ekipman?.tip === "yeni" && (
                    <div className={stil.kod}>
                      <label htmlFor={`sc-kod-${g.id}`}>Ekipman kodu <small>etiketteki; firmada eşsiz</small></label>
                      <input className={stil.girdi} id={`sc-kod-${g.id}`} maxLength={20} autoComplete="off" value={kodlar[g.id] ?? ""} aria-invalid={x?.kod || undefined}
                        aria-describedby={x?.neden ? `sc-kod-${g.id}-i` : undefined}
                        onChange={(e) => { setKodlar((k) => ({ ...k, [g.id]: e.target.value.toLocaleUpperCase("tr") })); setSonuclar((s) => { const y = { ...s }; delete y[g.id]; return y; }); }} />
                    </div>
                  )}
                  {x?.neden && <p className={stil.hata} id={`sc-kod-${g.id}-i`}>{x.neden}</p>}
                </li>
              );
            })}
          </ol>
        ) : <p className={stil.bosMetin}>Rapora dönüşecek kayıt kalmadı.</p>}
        <p className={stil.ara}>Oluşturmadan önce</p>
        <ul className={stil.kosullar}>
          {veri.rapor.engel ? <li className={stil.kosulEksik}><Ikon ad="circle-alert" kucuk />{veri.rapor.engel}</li>
            : <li className={stil.kosulTamam}><Ikon ad="circle-check" kucuk />Plan günü geldi</li>}
          {veri.rapor.mesai && <li className={stil.kosulBilgi}><Ikon ad="clock" kucuk />{veri.rapor.mesai}</li>}
          {cevrimdisi ? <li className={stil.kosulEksik}><Ikon ad="wifi-off" kucuk />İnternet gerekli: rapor numarası sunucuda verilir</li>
            : <li className={stil.kosulTamam}><Ikon ad="circle-check" kucuk />İnternet var: rapor numarası sunucuda verilir</li>}
          {toplamOkuma > 0 && <li className={stil.kosulBilgi}><Ikon ad="sparkles" kucuk />{veri.yz.hazir
            ? `Yapay zekâ ${toplamOkuma} fotoğraf okuyacak: firmanın kotasından harcar (${veri.yz.kota})`
            : `Yapay zekâ kapalı: ${toplamOkuma} fotoğraf raporda saklanır, açılınca okunur`}</li>}
        </ul>
        <p className={stil.not}>Taslaklar sırayla açılır; kriterleri ve ölçümleri raporda doldurursunuz. Raporu oluşan kayıtlar sohbetten silinir; etiket fotoğrafı rapora konmaz.</p>
        {yaziyor && <p className={stil.not} role="status">Oluşturuluyor: {yaziyor}</p>}
      </div>
      <div className={stil.altP}>
        <div className={stil.tuslar}>
          <Tus tur="ikincil" ikon="arrow-left" onClick={() => { setRaporEkrani(false); requestAnimationFrame(() => document.getElementById("sc-ilk")?.focus()); }} disabled={!!yaziyor}>Geri</Tus>
          <Tus ikon="file-plus" onClick={() => void raporYaz()} disabled={!!yaziyor || !!veri.rapor.engel || cevrimdisi || !hazirlar.length}>
            {hazirlar.length} rapor taslağı oluştur</Tus>
        </div>
      </div>
    </>
  );

  /* ekipman seçimi: Plandan seç (kişinin başka kaydındakiler düşer) / Yeni ekle */
  const baskaKayitta = new Set(gorunenler.filter((g) => g.id !== taslak?.id && g.ekipman?.tip === "plan").map((g) => (g.ekipman as { id: string }).id));
  const ara = (secim?.ara ?? "").toLocaleLowerCase("tr");
  const planSecenek = veri.planEkipmani.filter((e) => !baskaKayitta.has(e.id) && (!ara || `${e.kod} ${turAd(e.turId)} ${e.konum ?? ""}`.toLocaleLowerCase("tr").includes(ara)));
  const yeniSecenek = veri.yeniTurler.filter((id) => !ara || `${turAd(id)} ${veri.turler[id]?.kod ?? ""}`.toLocaleLowerCase("tr").includes(ara));

  return (
    <>
      {!acik && (
        <button ref={fab} className={stil.fab} type="button" data-saychat-fab="" onClick={ac} aria-haspopup="dialog" aria-controls="sc-panel" aria-expanded={false}
          aria-label="S.A.Y Chat — planın sohbeti" style={konum ? { right: konum.right, bottom: konum.bottom } : undefined}>
          <span className={stil.fabIkon}><Ikon ad="message-square-text" /></span>
          <span className={stil.fabYazi}>S.A.Y<small>Chat</small></span>
          {bekleyenSayisi > 0 && <span className={stil.fabSayi} aria-label={`${bekleyenSayisi} kayıt cihazda`}>{bekleyenSayisi}</span>}
        </button>
      )}
      {acik && (
        <aside className={stil.panel} id="sc-panel" role="dialog" aria-labelledby="sc-baslik"
          onKeyDown={(e) => {
            if (e.key !== "Escape" || secim || etiket) return;
            e.stopPropagation();
            if (taslak) vazgec(); else if (raporEkrani && !yaziyor) setRaporEkrani(false); else kapat();
          }}>
          <div className={stil.basP}>
            <span className={stil.avatar}><Ikon ad="message-square-text" /></span>
            <div className={stil.kimlik}>
              <h2 id="sc-baslik">S.A.Y Chat</h2>
              <p className={stil.altYazi}>{veri.plan.no} · sahadaki kayıtlarınız</p>
            </div>
            <button className={stil.basTus} type="button" onClick={kapat} aria-label="S.A.Y Chat'i kapat"><Ikon ad="x" /></button>
          </div>
          {form ?? (raporEkrani ? raporEkraniHtml : sohbet)}
        </aside>
      )}
      <Pencere acik={!!secim} baslik="Ekipman seçin" onKapat={() => setSecim(null)} odak="[data-ilk-odak]">
        <div className={stil.sekmeler} role="tablist" aria-label="Ekipman kaynağı">
          {(["plan", "yeni"] as const).map((s) => (
            <button key={s} type="button" role="tab" aria-selected={secim?.sekme === s} className={stil.sekme} data-ilk-odak={s === "plan" ? "" : undefined}
              onClick={() => setSecim((x) => (x ? { ...x, sekme: s } : x))}>{s === "plan" ? "Plandan seç" : "Yeni ekle"}</button>
          ))}
        </div>
        <label className={stil.gizli} htmlFor="sc-ara">Ara</label>
        <input className={stil.girdi} id="sc-ara" placeholder="Kod, tür ya da yer ara" autoComplete="off" value={secim?.ara ?? ""}
          onChange={(e) => setSecim((x) => (x ? { ...x, ara: e.target.value } : x))} />
        {secim?.sekme === "plan" ? (
          planSecenek.length ? (
            <ul className={stil.secenekler}>
              {planSecenek.map((e) => (
                <li key={e.id}><button type="button" className={stil.secenek} onClick={() => ekipmanSec({ tip: "plan", id: e.id })}>
                  <b>{e.kod} · {turAd(e.turId)}</b><small>{e.konum ?? "yer yok"}</small></button></li>
              ))}
            </ul>
          ) : <p className={stil.not}>Plandaki, branşınıza uygun ve raporu yazılmamış ekipman kalmadı. Plana yeni ekipman için “Yeni ekle”.</p>
        ) : (
          yeniSecenek.length ? (
            <ul className={stil.secenekler}>
              {yeniSecenek.map((id) => (
                <li key={id}><button type="button" className={stil.secenek} onClick={() => ekipmanSec({ tip: "yeni", tur: id })}>
                  <b>{turAd(id)}</b><small>{veri.turler[id]?.kod} · rapor yazılırken plana eklenir</small></button></li>
              ))}
            </ul>
          ) : <p className={stil.not}>Branşınızda rapor formatı yayında tür yok.</p>
        )}
      </Pencere>
      <Pencere acik={!!etiket} baslik="Etiketten okuma" onKapat={() => setEtiket(null)}
        alt={<>
          <Tus tur="ikincil" onClick={() => setEtiket(null)} data-ilk-odak="">Okumadan geç</Tus>
          <Tus ikon="sparkles" onClick={() => void etiketOku()} disabled={!veri.yz.hazir || cevrimdisi || etiket?.okunuyor}>{etiket?.okunuyor ? "Okunuyor…" : "Oku ve mesaja yaz"}</Tus>
        </>}>
        <p>Etiket fotoğrafı eklendi. Yapay zekâ etiketi okuyup mesajın boş satırlarına yazabilir; siz kontrol edip değiştirirsiniz. Etiket fotoğrafı rapora konmaz.</p>
        {veri.yz.hazir
          ? <Serit tur="uyari" ikon="sparkles">Okuma yapay zekâ kullanır, firmanın kotasından harcar: {veri.yz.kota}.</Serit>
          : <Serit tur="bilgi" ikon="info">Yapay zekâ firmada kapalı ya da anahtar girilmedi; satırları elle yazın.</Serit>}
        {cevrimdisi && <Serit tur="uyari" ikon="wifi-off">Bağlantı yok: okuma bağlantı gelince yapılabilir. Fotoğraf kayıtla birlikte saklanır.</Serit>}
      </Pencere>
    </>
  );
}
