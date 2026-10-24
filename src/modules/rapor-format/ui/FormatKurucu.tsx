"use client";
/* FORMAT KURUCU (K4; RAPOR-FORMAT.md §6). 451 (reisim 2026-10-09: "format kurucu hiç kullanışlı değil, mantıksız zor ve karmaşık"; "formatı
   oluştururken nasıl gözükeceği zihnimde canlanmıyor bile"): üç sütunlu düzenleyici (solda bölüm listesi, ortada form, sağda önizleme) KALKTI —
   format RAPORUN KENDİSİNİN ÜSTÜNDE kurulur (Kagit.tsx: belgenin Bakanlık görünümü, yerinde yazı, yerinde ekle / çıkar). "Belge önizlemesi"
   aynı taslağı kesin belgenin çizicisiyle (src/belge/belge.ts — PDF'le aynı) boş bir raporda gösterir. Kurallar ve genel muayene talimatı üstte.
   Değişiklik "Taslağı kaydet" ile yazılır (Kaydedilmedi · Vazgeç · Kaydet — kalıp Z1); kaydedilmemiş taslak yayınlanmaz; kaydedilmemiş taslakla
   sayfadan çıkarken sorulur. 470: Bakanlık öğesi de değişir ve silinir (sorarak) — sunucu yayında kaynak şablondan ayrılanları UYARI olarak
   listeler. Telefonda kurucu açılmaz
   (masaüstü işi): belge önizlemesi görünür. Karar ve şema sunucuda.
   472–474 (reisim 2026-10-10, maket kararları k1–k4): üç görünüm — Kâğıt (açılışta) · Saha ekranı (denetçinin tabletinde / telefonunda göreceği
   gerçek ekran, örnek raporla; orada da yerinde düzenlenir — SahaGorunumu.tsx) · Belge önizlemesi. Üçü aynı taslağı gösterir: birinde yapılan
   değişiklik ötekilerde görünür. Telefonda (maket): Belge · Saha ekranı — saha ekranı yalnız "denetçi gibi dene" (telefon genişliğinde).
   483 (reisim 2026-10-10: "rapor düzenlemede sadece saha ekranı gözüksün o ekranda düzenleme yapılamasın"; "kağıttan düzenleyebiliyoruz ama sahadaki
   görüntü nasıl oluyor düzenleyemiyoruz burası çok karmaşık bir çözüm öner"): TEK DÜZENLEME YERİ KÂĞIT. Saha ekranı salt önizleme; sahaya özgü
   ayarlar kâğıtta — madde cevabının biçimi "Kurallar, saha ekranı ve genel muayene talimatı"nda, bölümün fotoğraftan / Excel'den doldurulması
   bölümün ayarında (484).
   486: seçili görünüm (Kâğıt / Saha ekranı / Belge) bu sekmede taslak başına hatırlanır (sessionStorage) — sayfa yenilenince aynı görünüm açılır
   (deneme makinesinin geliştirme sunucusu saha ekranını derlerken sayfayı baştan yüklüyordu; kullanıcı için de F5'te görünüm kaybolmaz).
   493 (hata listesi 29 + 46 maketi onaylandı, reisim 2026-10-11: "mevcuttaki sistemi koruyalım gelişmiş seçenekler tuşu olsun"): kâğıdın üstünde
   araç çubuğu — Geri al / Yinele (Ctrl+Z, Ctrl+Y; yazı alanındayken alanın kendi geri alması); her değişiklik bir adım (../gecmis.ts).
   494: araç çubuğunda "Gelişmiş seçenekler" — kâğıt AYNI kalır, soluna parça kutusu (sürükle-bırak ya da bas-yerini seç), sağına seçili bölüm
   gelir (Yapboz.tsx, ../yapboz.ts); bölümler tutamaktan taşınır. Aynı taslak, aynı geçmiş; "Basit görünüme dön" ile kâğıt tek başına. Seçim bu
   sekmede taslak başına hatırlanır. Telefonda kurucu yok. 2026-10-12 (reisim: "parça olarak kaydet yukarda kaldı … takip etsin sayfayı"): yan
   kutular sayfayı izler — geniş ekranda iki ayrı sütun, orta genişlikte tek sütunda (seçili bölüm üstte); düzen yapboz.module.css.
   496: parça kitaplığı — Bakanlık formatlarının bölümleri ve firmanın parçaları (seçili bölümde "Parça olarak kaydet"; sunucuda format_parca).
   497: gelişmiş görünümde kâğıdın üstünde "Yapay zekâya anlat" (YzKutusu.tsx) — öneriler kâğıtta kesik çizgiyle; "Ekle" / "Uygula" taslağa
   ekler (geçmişe bir adım; yine "Taslağı kaydet"le yazılır), "Vazgeç" atar. Öneri taslak değişse de kimliğiyle yerini bulur (../yz-oneri.ts). */
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { raporBelgesi } from "../../../belge/belge";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { useOnayla } from "../../../components/pencere/Onay";
import { NesneBasi, Rozet } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { yayinDenetimi } from "../../../format/motor";
import { basTuru } from "../../../format/duzen";
import { YAZI_TIPI_ADI, YAZI_TIPLERI, type FormatTanimi } from "../../../format/tanim";
import { belgeYazisiYaz, bolumSil, gorunumYaz } from "../kurucu";
import { YAZI_AILESI } from "../../../format/tablo";
import { adimEkle, bosGecmis, geriAl, kisayol, yinele, type Gecmis } from "../gecmis";
import { alanaParcaEkle, bolumKopyala, bolumuTasi, parcaBul, parcaYerlestir, type FirmaParcasi, type HazirParca } from "../yapboz";
import { Parcalar, SeciliBolum } from "./Yapboz";
import { bolumeKaydir } from "./kaydir";
import { formatBelgeEylemi, formatYzEylemi, parcaKaydetEylemi, parcaSilEylemi, taslakKaydetEylemi } from "./eylemler";
import { oneriEkle, oneriUygula, oneriYeri, type Oneri } from "../yz-oneri";
import { formatIslemleri, type FormatIslemi } from "../say-kurucu";
import { sayFormatBagla } from "../../say/ui/baglam";
import { YzKutusu } from "./YzKutusu";
import { Kagit } from "./Kagit";
import { SatirAlani } from "./KurucuDuzenleyici";
import { SahaGorunumu } from "./SahaGorunumu";
import { kurucuOrnegi } from "./kurucuOrnegi";
import { YayinlaTusu } from "./SablonBolumu";
import stil from "./format.module.css";
import ys from "./yapboz.module.css";

const odak = (q: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(q)?.focus());

/** sunucunun alan yolu (bolumler.2.ad) → okunur yer ("3. bölüm (Ad): ") */
function yer(k: string, t: FormatTanimi): string {
  const m = /^bolumler\.(\d+)/.exec(k);
  if (!m) return "";
  const b = t.bolumler[Number(m[1])];
  return `${Number(m[1]) + 1}. bölüm${b?.ad ? ` (${b.ad})` : ""}: `;
}

/** turStd / turCihaz (459): türün kontrol metodu standartları ve ölçüm cihazı türleri (tür sayfasında seçilir) — kâğıtta ve önizlemede */
export function FormatKurucu({ turId, turAd, turKod, format, tanim, kaynakAd, turStd, turCihaz, firmaParca, hazirParca, parcaSilebilir, yz }: {
  turId: string; turAd: string; turKod: string; format: { id: string; surum: number }; tanim: FormatTanimi; kaynakAd: string | null;
  turStd: string[]; turCihaz: string[];
  /** 496: parça kitaplığı (sunucudan) — firmanın parçaları, şablon bölümleri; parcaSilebilir: yönetici (karar yine sunucuda) */
  firmaParca: FirmaParcasi[]; hazirParca: HazirParca[]; parcaSilebilir: boolean;
  /** 497: firmada yapay zekâ hazır mı (değilse kutuda nereden açılacağı) */
  yz: { hazir: boolean; neden: string };
}) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [mesgul, baslat] = useTransition();
  /* taslak: sunucudaki tanım değişince (kaydettikten sonra yenileme) ona eşitlenir */
  const ilkJson = JSON.stringify(tanim);
  const [t, setT] = useState<FormatTanimi>(tanim);
  const [son, setSon] = useState(ilkJson);
  const [hatalar, setHatalar] = useState<string[]>([]);
  const [gorunum, setGorunumDurum] = useState<"duzen" | "saha" | "belge">("duzen");
  const gorunumAnahtar = `probata-kurucu-gorunum:${format.id}`;
  useEffect(() => {
    let g: string | null = null;
    try { g = sessionStorage.getItem(gorunumAnahtar); } catch { /* okunamazsa Kâğıt */ }
    if (g === "saha" || g === "belge") queueMicrotask(() => setGorunumDurum(g));
  }, [gorunumAnahtar]);
  const setGorunum = (g: "duzen" | "saha" | "belge") => {
    setGorunumDurum(g);
    try { sessionStorage.setItem(gorunumAnahtar, g); } catch { /* saklanamazsa yalnız bu ekranda */ }
  };
  /* 493: geri al / yinele — her değişiklik bir adım; kaydedilince (sunucu tanımı değişince) ya da Vazgeç'le sıfırlanır */
  const [gecmis, setGecmis] = useState<Gecmis<FormatTanimi>>(bosGecmis);
  if (son !== ilkJson) { setSon(ilkJson); setT(tanim); setHatalar([]); setGecmis(bosGecmis()); }
  const kirli = JSON.stringify(t) !== ilkJson;
  /* 495: aynı yazı alanında art arda yazılanlar (öğe ayrıntılarındaki ad, formül …) tek adım — Geri al harf harf geri almasın; başka alanda ya da
     tuşla yapılan değişiklik yeni adım */
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
  /* 553 (reisim 2026-10-14: "konuşarak ilgili formatı yapabiliyo olalım"): S.A.Y taslağı görür (kaydedilmemiş değişiklikler dahil), Haiku'nun
     "formati_duzenle" işlemlerini uygular — geçmişe bir adım (araç çubuğundaki Geri al da alır); S.A.Y iletisinin altındaki Geri al, taslak o
     hâldeyse önceki hâline döndürür. Kaydet / Yayınla kişide. */
  const sayGuncel = useRef({ t, degis, kirli });
  useEffect(() => { sayGuncel.current = { t, degis, kirli }; });
  useEffect(() => sayFormatBagla({
    id: format.id,
    tanim: () => sayGuncel.current.t,
    /* 2026-10-16 (S.A.Y 2. adım a — D): kaydedilmemiş taslak varsa S.A.Y işten sonra sayfayı yenilemez, söyler */
    kirli: () => sayGuncel.current.kirli,
    uygula: (islemler) => {
      const once = sayGuncel.current.t, r = formatIslemleri(once, islemler as readonly FormatIslemi[]);
      const sonra = JSON.stringify(r.t);
      if (r.t !== once) { sonAdim.current = { el: null }; sayGuncel.current.degis(r.t); }
      return {
        yapilan: r.yapilan, gecersiz: r.gecersiz,
        geriAl: () => {
          if (r.t === once || JSON.stringify(sayGuncel.current.t) !== sonra) return 0;
          sonAdim.current = { el: null }; sayGuncel.current.degis(once);
          return 1;
        },
      };
    },
  }), [format.id]);
  const stdAnahtar = turStd.join("\n"), cihazAnahtar = turCihaz.join("\n");
  const tur = useMemo(() => ({ ad: turAd, kod: turKod, std: stdAnahtar ? stdAnahtar.split("\n") : [], cihaz: cihazAnahtar ? cihazAnahtar.split("\n") : [] }),
    [turAd, turKod, stdAnahtar, cihazAnahtar]);

  /* kaydedilmemiş taslakla sayfadan çıkarken tarayıcı sorar */
  useEffect(() => {
    if (!kirli) return;
    const dur = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", dur);
    return () => window.removeEventListener("beforeunload", dur);
  }, [kirli]);
  /* uygulama içi gezinti (Önizle, kırıntı, yan menü — istemci bağlantıları beforeunload'u tetiklemez): kaydedilmemiş taslakta sorulur */
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
  /* yayından önce bakılacaklar (boş bölüm, sınırsız tablo, sonuç / imza bölümü yok …): uyarıdır, yayını engellemez */
  const bakilacak = useMemo(() => yayinDenetimi(t), [t]);
  const belge = useMemo(() => raporBelgesi(kurucuOrnegi(t, tur)), [t, tur]);

  const kaydet = () => baslat(async () => {
    const r = await taslakKaydetEylemi(format.id, format.surum, t);
    if (!r.tamam) {
      setHatalar(r.hatalar ? Object.entries(r.hatalar).map(([k, v]) => `${yer(k, t)}${v}`) : [r.genel ?? "Kaydedilemedi."]);
      bildir("Taslak kaydedilmedi; nedeni sayfanın üstünde."); odak("#kb-hatalar"); return;
    }
    bildir("Taslak kaydedildi."); router.refresh();
  });
  const vazgec = () => { setT(tanim); setHatalar([]); setGecmis(bosGecmis()); bildir("Değişiklikler geri alındı."); };

  /* ── 494: gelişmiş görünüm (yapboz) ── */
  const gelismisAnahtar = `probata-kurucu-gelismis:${format.id}`;
  const [gelismis, setGelismisDurum] = useState(false);
  useEffect(() => {
    let g: string | null = null;
    try { g = sessionStorage.getItem(gelismisAnahtar); } catch { /* okunamazsa basit */ }
    if (g === "1") queueMicrotask(() => setGelismisDurum(true));
  }, [gelismisAnahtar]);
  const [tutulan, setTutulan] = useState<string | null>(null);
  const [secili, setSecili] = useState<string | null>(null);
  const setGelismis = (x: boolean) => {
    setGelismisDurum(x); setTutulan(null);
    try { sessionStorage.setItem(gelismisAnahtar, x ? "1" : "0"); } catch { /* saklanamazsa yalnız bu ekranda */ }
    if (x && gorunum !== "duzen") setGorunum("duzen");
  };
  /* tutulan parça Esc ile bırakılır */
  useEffect(() => {
    if (!tutulan) return;
    const bas = (e: KeyboardEvent) => { if (e.key === "Escape") setTutulan(null); };
    document.addEventListener("keydown", bas);
    return () => document.removeEventListener("keydown", bas);
  }, [tutulan]);
  const goster = (id: string) => bolumeKaydir(`kb-${id}`);
  /* 496: parça kitaplığı — firmanın parçaları bu ekranda güncellenir (kaydet / sil), şablon bölümleri sabit */
  const [firmaParcalari, setFirmaParcalari] = useState(firmaParca);
  const kitaplik = useMemo(() => ({ firma: firmaParcalari, hazir: hazirParca }), [firmaParcalari, hazirParca]);
  const parcaKaydet = (i: number) => {
    const b = t.bolumler[i];
    if (!b) return;
    baslat(async () => {
      const r = await parcaKaydetEylemi(b.ad, b);
      if (!r.tamam || !r.parca) { bildir(r.genel ?? "Parça kaydedilemedi."); return; }
      const p = r.parca;
      setFirmaParcalari((l) => [...l, p]);
      bildir(`${p.ad} firmanızın parçalarına kaydedildi; bütün formatlarınızda parça kutusunda.`);
    });
  };
  const parcaSil = async (id: string, ad: string) => {
    if (!(await onayla({ baslik: "Parça silinsin mi?", metin: `${ad} firmanızın parçalarından kesin silinir. Onu kullanan formatlar değişmez (parça formata kopyalanmıştı).`,
      tus: "Sil", tehlike: true }))) return;
    baslat(async () => {
      const r = await parcaSilEylemi(id);
      if (!r.tamam) { bildir(r.genel ?? "Parça silinemedi."); return; }
      setFirmaParcalari((l) => l.filter((x) => x.id !== id));
      if (tutulan === `f:${id}`) setTutulan(null);
      bildir(`${ad} parçası silindi.`);
    });
  };
  /* 497: yapay zekâya anlat — öneriler bu ekranda; yazılmaz, "Ekle" / "Uygula" taslağa ekler */
  const [oneriler, setOneriler] = useState<Oneri[]>([]);
  const [yzCevap, setYzCevap] = useState("");
  const oneriAl = (r: Awaited<ReturnType<typeof formatYzEylemi>>) => {
    if (r.durum !== "tamam") { setYzCevap(r.neden); bildir(r.neden); return; }
    setOneriler(r.oneriler); setYzCevap(r.cevap);
    bildir(r.oneriler.length ? `${r.oneriler.length} öneri geldi; kâğıtta kesik çizgiyle.` : "Öneri gelmedi.");
  };
  const oner = (istek: string) => baslat(async () => { setYzCevap(""); oneriAl(await formatYzEylemi(istek, t, turAd)); });
  /* 498: belgeden başlat — belge yalnız yapay zekâya gider, saklanmaz */
  const belgeden = (f: File) => baslat(async () => {
    setYzCevap(`${f.name} okunuyor…`);
    const fd = new FormData();
    fd.set("dosya", f); fd.set("tanim", JSON.stringify(t)); fd.set("turAd", turAd);
    oneriAl(await formatBelgeEylemi(fd));
  });
  const oneriAt = (id: string) => setOneriler((l) => l.filter((x) => x.id !== id));
  const yzEkle = (id: string, p: number) => {
    const o = oneriler.find((x) => x.id === id);
    if (!o || o.tur !== "ekle") return;
    const x = oneriEkle(t, o, p);
    if (!x) { bildir("Öneri bu taslağa eklenemedi (biçime uymadı)."); return; }
    degis(x.t); oneriAt(id); setSecili(x.id); bildir(`${o.bolum.ad} eklendi (taslak).`); goster(x.id);
  };
  const yzUygula = (id: string) => {
    const o = oneriler.find((x) => x.id === id);
    if (!o || o.tur !== "degistir") return;
    const y = oneriUygula(t, o);
    if (!y) { bildir("Öneri uygulanamadı: bölüm artık yok ya da öneri biçime uymadı."); return; }
    degis(y); oneriAt(id); setSecili(o.hedef); bildir(`${o.bolum.ad} değişti (taslak).`); goster(o.hedef);
  };
  const birak = (p: number, v: { parca?: string; bolum?: string }) => {
    if (v.bolum) { const y = bolumuTasi(t, v.bolum, p); if (y !== t) { degis(y); setSecili(v.bolum); bildir("Bölüm taşındı (taslak)."); } return; }
    if (!v.parca) return;
    const x = parcaYerlestir(t, v.parca, p, kitaplik);
    if (!x) return;
    degis(x.t); setSecili(x.bolum); setTutulan(null); bildir(`${parcaBul(t, v.parca, kitaplik)?.ad ?? "Parça"} eklendi (taslak).`); goster(x.bolum);
  };
  const alanaBirak = (i: number, k: string) => {
    const x = alanaParcaEkle(t, i, k);
    if (!x) return;
    degis(x.t); setSecili(t.bolumler[i].id); setTutulan(null); bildir(`${parcaBul(t, k)?.ad ?? "Alan"} ${t.bolumler[i].ad} bölümüne eklendi (taslak).`);
  };
  const kopyala = (i: number) => {
    const x = bolumKopyala(t, i);
    if (!x) return;
    degis(x.t); setSecili(x.id); bildir(`${t.bolumler[i].ad} kopyalandı (taslak).`); goster(x.id);
  };
  /* 470: Bakanlık bölümü de silinir — uyarıyla sorulur, yayında uyarı çıkar (engel değil) */
  const bolumuSil = async (i: number) => {
    const b = t.bolumler[i];
    if (!b || b.blok === "cihaz") return;
    const metin = b.kilit ? `${b.ad} Bakanlık formatının zorunlu bölümü. Silinirse bu formatla yazılan raporlar Bakanlık formatına uymaz; yayınlarken uyarı çıkar.`
      : `${b.ad} taslaktan çıkar. Yayınlanana kadar raporlar etkilenmez.`;
    if (!(await onayla({ baslik: b.kilit ? "Bakanlık bölümü silinsin mi?" : "Bölüm silinsin mi?", metin, tus: "Sil", tehlike: true }))) return;
    degis(bolumSil(t, i)); bildir(`${b.ad} bölümü silindi (taslak).`);
  };
  const kural = (k: keyof FormatTanimi["kurallar"], ad: string, alt: string) => (
    <label className={stil.secenek}>
      <input type="checkbox" checked={t.kurallar[k]} onChange={(e) => degis({ ...t, kurallar: { ...t.kurallar, [k]: e.target.checked } })} />
      <span>{ad}<span className={stil.ogeAlt}>{alt}</span></span>
    </label>
  );

  return (
    <>
      <NesneBasi baslik={`Format kurucu · ${turAd}`} rozet={<Rozet tur="bekliyor">Taslak</Rozet>} altIkon="layout-list"
        alt={`${t.bolumler.length} bölüm · ${kaynakAd ?? "Firma formatı"}`}
        tuslar={<>
          <span className={`${stil.gorunumSecici} ${stil.yalnizGenis}`} role="group" aria-label="Görünüm">
            <Tus tur={gorunum === "duzen" ? "birincil" : "ikincil"} ikon="pencil" aria-pressed={gorunum === "duzen"} onClick={() => setGorunum("duzen")}>Kâğıt</Tus>
            <Tus tur={gorunum === "saha" ? "birincil" : "ikincil"} ikon="tablet-smartphone" aria-pressed={gorunum === "saha"} onClick={() => setGorunum("saha")}>Saha ekranı</Tus>
            <Tus tur={gorunum === "belge" ? "birincil" : "ikincil"} ikon="file-text" aria-pressed={gorunum === "belge"} onClick={() => setGorunum("belge")}>Belge önizlemesi</Tus>
          </span>
          <span className={stil.darSecici} role="group" aria-label="Görünüm">
            <Tus tur={gorunum !== "saha" ? "birincil" : "ikincil"} ikon="file-text" aria-pressed={gorunum !== "saha"} onClick={() => setGorunum("belge")}>Belge</Tus>
            <Tus tur={gorunum === "saha" ? "birincil" : "ikincil"} ikon="smartphone" aria-pressed={gorunum === "saha"} onClick={() => setGorunum("saha")}>Saha ekranı</Tus>
          </span>
          <TusBaglanti tur="ikincil" ikon="eye" href={`/ekipman-turleri/${turId}/sablon/${format.id}`}>Sürüm sayfası</TusBaglanti>
          {/* 529 (reisim 2026-10-13: "diğer tuşların yanına koy tuşa basınca ilgili sayfaya gitsin"): S.A.Y Chat ayarları kendi sayfasında */}
          <TusBaglanti tur="ikincil" ikon="message-square-text" href={`/ekipman-turleri/${turId}/say-chat`}>S.A.Y Chat ayarları</TusBaglanti>
          {kirli ? <>
            <span className={stil.kaydetNot}>Kaydedilmedi</span>
            <Tus tur="ikincil" disabled={mesgul} onClick={vazgec}>Vazgeç</Tus>
            <Tus ikon="check" disabled={mesgul} aria-busy={mesgul || undefined} onClick={kaydet}>Taslağı kaydet</Tus>
          </> : <YayinlaTusu format={format} />}
        </>} />
      <div className={stil.seritKap}>
        <div className={stil.yalnizDar}><Serit tur="bilgi" ikon="info">Format kurucu masaüstünde düzenlenir.</Serit></div>
        {hatalar.length > 0 && <div id="kb-hatalar" tabIndex={-1}><Serit tur="hata" ikon="circle-alert">Taslak kaydedilmedi: {hatalar.join(" · ")}</Serit></div>}
        {bakilacak.length > 0 && <Serit tur="uyari" ikon="triangle-alert">Yayından önce bakılacak: {bakilacak.join(" · ")}</Serit>}
      </div>
      <details className={`${stil.bolum} ${stil.kurallar} ${stil.yalnizGenis}`}>
        <summary className={stil.kurallarBas}>Kurallar, saha ekranı ve genel muayene talimatı</summary>
        <div className={stil.kurallarIc}>
          <div className={stil.secenekler}>
            {kural("foto", "“Uygun değil” maddede fotoğraf zorunlu", "kapalıyken fotoğraf isteğe bağlı")}
            {kural("derece", "Kusur derecesi sorulsun (hafif / ağır)", "açıksa hafif kusur devri çalışır")}
            {kural("oneri", "Sonuç önerisi", "“Uygun değil” madde ya da sınır dışı ölçüm varsa sonuç “Uygun değil” önerilir")}
          </div>
          {/* 483: sahaya özgü ayar kâğıtta (saha ekranı salt önizleme) — madde cevabının biçimi; belgeye (PDF) etkisi yok */}
          <fieldset className={stil.secenekler}>
            <legend className={stil.kullanimEtiket}>Saha ekranında madde cevabı</legend>
            {([["acilir", "Açılır liste", "cevap listeden seçilir"], ["tus", "Yan yana tuşlar", "tek dokunuşla — sahada daha hızlı"]] as const).map(([k, ad, alt]) => (
              <label key={k} className={stil.secenek}>
                <input type="radio" name="kb-cevap" checked={t.gorunum.cevap === k} onChange={() => degis(gorunumYaz(t, { cevap: k }))} />
                <span>{ad}<span className={stil.ogeAlt}>{alt}</span></span>
              </label>
            ))}
          </fieldset>
          <SatirAlani id="kb-talimat" etiket="Genel muayene talimatı" deger={t.gorunum.talimat} satir={4} uygula={(s) => degis(gorunumYaz(t, { talimat: s }))} />
        </div>
      </details>
      {/* 2026-10-23 (basılı formdan şablon — reisim: "bu pdfine bi bak nasıl gözüküyor"): belgenin başı ve görünümü; kâğıtta ve belgede aynı */}
      <details className={`${stil.bolum} ${stil.kurallar} ${stil.yalnizGenis}`}>
        <summary className={stil.kurallarBas}>Belge görünümü</summary>
        <div className={`${stil.kurallarIc} ${stil.gorunumSecenek}`}>
          {([
            ["bas", "Belgenin başı", [["tablo", "Logo, firma ve doküman bilgisi tablosu"], ["ad", "Yalnız belge adı"]], basTuru(t)],
            ["zemin", "Bölüm başlığının zemini", [["pembe", "Pembe"], ["gri", "Gri"], ["yok", "Zeminsiz"]], t.gorunum.stil?.zemin ?? "pembe"],
            ["hiza", "Bölüm başlığının yeri", [["sol", "Sola"], ["orta", "Ortaya"]], t.gorunum.stil?.hiza ?? "sol"],
            ["etiket", "Etiket hücreleri", [["mavi", "Mavi zeminli"], ["kalin", "Zeminsiz, kalın yazı"]], t.gorunum.stil?.etiket ?? "mavi"],
          ] as const).map(([k, ad, l, secili]) => (
            <fieldset key={k} className={stil.secenekler}>
              <legend className={stil.kullanimEtiket}>{ad}</legend>
              {l.map(([x, xad]) => (
                <label key={x} className={stil.secenek}>
                  <input type="radio" name={`kb-gorunum-${k}`} checked={secili === x}
                    onChange={() => degis(k === "bas" ? gorunumYaz(t, { basTuru: x as "tablo" | "ad" }) : gorunumYaz(t, { stil: { [k]: x } }))} />
                  <span>{xad}</span>
                </label>
              ))}
            </fieldset>
          ))}
          {/* 2026-10-24 (serbest düzen): sabit bölümler var / yok; belgenin yazısı ve çizgisi (serbest tablolarda) */}
          <fieldset className={stil.secenekler}>
            <legend className={stil.kullanimEtiket}>Sabit bölümler</legend>
            {([[false, "Başlık tablosu, firma ve ekipman bilgileri belgede"], [true, "Yok — belge yalnız benim bölümlerimden"]] as const).map(([x, xad]) => (
              <label key={String(x)} className={stil.secenek}>
                <input type="radio" name="kb-gorunum-serbest" checked={!!t.gorunum.serbest === x} onChange={() => degis(belgeYazisiYaz(t, { serbest: x }))} />
                <span>{xad}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className={stil.secenekler}>
            <legend className={stil.kullanimEtiket}>Tabloların yazı tipi</legend>
            {YAZI_TIPLERI.map((x) => (
              <label key={x} className={stil.secenek}>
                <input type="radio" name="kb-gorunum-yazi" checked={(t.gorunum.yazi?.tip ?? "carlito") === x}
                  onChange={() => degis(belgeYazisiYaz(t, { tip: x === "carlito" ? undefined : x }))} />
                <span style={{ fontFamily: YAZI_AILESI[x] }}>{YAZI_TIPI_ADI[x]}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className={stil.secenekler}>
            <legend className={stil.kullanimEtiket}>Tabloların yazısı ve çizgisi</legend>
            {([["boy", "Yazı boyu (pt)", t.gorunum.yazi?.boy ?? 9, 6, 16], ["ara", "Bölümler arası (mm)", t.gorunum.yazi?.ara ?? 3, 0, 10],
              ["ic", "Hücre iç boşluğu (mm)", t.gorunum.yazi?.ic ?? 0.6, 0, 4]] as const).map(([a, ad, d, en, enCok]) => (
              <label key={a} className={stil.secenek}>
                <span>{ad}</span>
                <input type="number" className={stil.sayiKutu} step={a === "boy" ? 0.5 : 0.2} min={en} max={enCok} defaultValue={d} key={`${a}-${d}`}
                  onBlur={(e) => { const n = Number(e.target.value); if (Number.isFinite(n) && n >= en && n <= enCok && n !== d) degis(belgeYazisiYaz(t, { [a]: n })); }} />
              </label>
            ))}
            {([[1, "İnce çizgi"], [2, "Kalın çizgi"]] as const).map(([x, xad]) => (
              <label key={x} className={stil.secenek}>
                <input type="radio" name="kb-gorunum-kalin" checked={(t.gorunum.yazi?.kalin ?? 1) === x} onChange={() => degis(belgeYazisiYaz(t, { kalin: x === 1 ? undefined : x }))} />
                <span>{xad}</span>
              </label>
            ))}
            <label className={stil.secenek}>
              <span>Çizgi rengi</span>
              <input type="color" value={(t.gorunum.yazi?.cizgi ?? "#000000").toLowerCase()} aria-label="Çizgi rengi"
                onChange={(e) => degis(belgeYazisiYaz(t, { cizgi: e.target.value.toUpperCase() === "#000000" ? undefined : e.target.value.toUpperCase() }))} />
            </label>
          </fieldset>
        </div>
      </details>
      {/* 493: araç çubuğu (geniş ekranda; telefonda kurucu yok) */}
      <div className={`${stil.aracCubugu} ${stil.yalnizGenis}`} role="toolbar" aria-label="Taslak araçları">
        <Tus tur="ikincil" ikon="undo-2" disabled={!gecmis.geri.length} aria-keyshortcuts="Control+Z" title="Geri al (Ctrl+Z)" onClick={geri}>Geri al</Tus>
        <Tus tur="ikincil" ikon="redo-2" disabled={!gecmis.ileri.length} aria-keyshortcuts="Control+Y" title="Yinele (Ctrl+Y)" onClick={ileri}>Yinele</Tus>
        <Tus tur={gelismis ? "birincil" : "ikincil"} ikon="puzzle" aria-pressed={gelismis} onClick={() => setGelismis(!gelismis)}>
          {gelismis ? "Basit görünüme dön" : "Gelişmiş seçenekler"}</Tus>
      </div>
      {gelismis && gorunum === "duzen" ? (
        <div className={`${ys.yapboz} ${stil.yalnizGenis}`}>
          {/* yan kutular sayfayı izler (yapboz.module.css): geniş ekranda iki ayrı sütun, orta genişlikte tek sütunda seçili bölüm üstte */}
          <div className={ys.yanlar}>
            <div className={ys.sol}>
              <Parcalar t={t} kitaplik={kitaplik} tutulan={tutulan} tut={setTutulan} sil={parcaSilebilir ? (id, ad) => void parcaSil(id, ad) : null} />
            </div>
            <div className={ys.sag}><SeciliBolum t={t} secili={secili} kopyala={kopyala} sil={(i) => void bolumuSil(i)} parcaKaydet={mesgul ? null : parcaKaydet} /></div>
          </div>
          <div className={ys.orta}>
            <YzKutusu t={t} yz={yz} mesgul={mesgul} cevap={yzCevap} oneriler={oneriler} oner={oner} uygula={yzUygula} vazgec={oneriAt} belgeden={belgeden} />
            <Kagit t={t} degis={degis} tur={tur} bolumuSil={(i) => void bolumuSil(i)} bildir={bildir}
              yapboz={{ tutulan: tutulan ? parcaBul(t, tutulan, kitaplik) : null, birak, alanaBirak, secili, sec: setSecili,
                oneriler: oneriler.flatMap((o) => (o.tur === "ekle" ? [{ id: o.id, p: oneriYeri(t, o), aciklama: o.aciklama, bolum: o.bolum }] : [])),
                oneriEkle: yzEkle, oneriVazgec: oneriAt }} />
          </div>
        </div>
      ) : (
        <div className={gorunum === "duzen" ? stil.yalnizGenis : stil.gizliHer}>
          <Kagit t={t} degis={degis} tur={tur} bolumuSil={(i) => void bolumuSil(i)} bildir={bildir} />
        </div>
      )}
      {/* saha ekranı yalnız seçilince kurulur (çerçeve sayfası o zaman yüklenir); telefonda yalnız dene (SahaGorunumu) */}
      {gorunum === "saha" && <SahaGorunumu turId={turId} formatId={format.id} t={t} />}
      <div className={gorunum === "belge" ? stil.belgeKap : gorunum === "saha" ? stil.gizliHer : `${stil.belgeKap} ${stil.yalnizDar}`}>
        {/* kayan öğe belgenin kendisi (telefonda A4 yana kayar): klavyeyle kaydırılsın diye odak ve ad onda (rapor önizlemesi gibi) */}
        <div className="rb-onizleme" aria-label="Belge önizlemesi" role="region" tabIndex={0}>{belge}</div>
      </div>
    </>
  );
}
