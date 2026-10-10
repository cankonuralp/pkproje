"use client";
/* SAHA ÇERÇEVESİ (472–473; reisim 2026-10-10, maket kararları k1 · k3: "kağıtta yapılan değişiklik saha ekranında saha ekranında yapılan
   değişiklik kağıtta etki etsin"). Çerçeve sayfasında (src/app/(cerceve)/…/saha) gerçek saha ekranını örnek raporla çizer; format kurucusu
   (SahaGorunumu.tsx) ile iletiyle konuşur:
   · gelen  { tur: "probata-format", tanim, kip, tema, temizle? } — kurucunun canlı taslağı (şemadan geçmeyen tanım alınmaz), kip, tema;
   · giden  { tur: "probata-hazir" } açılınca · { tur: "probata-degis", tanim } saha ekranında yerinde düzenleme olunca (473) ·
            { tur: "probata-durum", eksik, kusur } denemenin canlı sayıları (kullanım kutusu).
   İletiler YALNIZ aynı kökenden ve yalnız üst pencereden alınır / üst pencereye gönderilir. Taşınan tek şey formatın tanımıdır — yetki
   sunucuda: taslak "Taslağı kaydet" ile, kurucunun kendi eylemiyle yazılır (çerçeve hiçbir şey yazmaz). */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOnayla } from "../../../components/pencere/Onay";
import { raporDuzeni } from "../../../format/duzen";
import { FormatTanimi } from "../../../format/tanim";
import { SahaRaporu } from "../../raporlar/ui/SahaRaporu";
import type { Yerinde } from "../../raporlar/ui/Bloklar";
import type { SahaRaporu as SahaRaporuVerisi } from "../../raporlar/server/raporlar";
import { ilkCevaplar } from "../../raporlar/ornek";
import { altBaslikEkle, bolumAdi, grupYaz, maddeEkle, ogeEkle, ogeSil, ogeYaz, tasi } from "../kurucu";

export type SahaKipi = "duzenle" | "dene";
export interface FormatIletisi { tur: "probata-format"; tanim: unknown; kip: SahaKipi; tema?: string; temizle?: number }

/** kimlik → bölümün sırası ve öğenin türü (kimlikler bütün tanımda tekil) */
function bul(t: FormatTanimi, id: string): { i: number; tur: "bolum" | "grup" | "oge"; kilit: boolean; ad: string } | null {
  for (const [i, b] of t.bolumler.entries()) {
    if (b.id === id) return { i, tur: "bolum", kilit: b.kilit, ad: b.ad };
    if (b.blok === "liste") for (const g of b.gruplar) {
      if (g.id === id) return { i, tur: "grup", kilit: false, ad: g.ad };
      const m = g.maddeler.find((x) => x.id === id);
      if (m) return { i, tur: "oge", kilit: m.kilit, ad: m.metin };
    }
    const o = b.blok === "bilgi" ? b.alanlar.find((x) => x.id === id) : b.blok === "olcum" ? b.sutunlar.find((x) => x.id === id)
      : b.blok === "test" ? b.degerler.find((x) => x.id === id) : undefined;
    if (o) return { i, tur: "oge", kilit: "kilit" in o ? o.kilit : b.kilit, ad: o.ad };
  }
  return null;
}
const YENI_AD = { bilgi: "Yeni alan", liste: "Yeni madde", olcum: "Yeni sütun", test: "Yeni değer" } as const;

export function SahaCerceve({ v, duzenlenir }: { v: SahaRaporuVerisi; duzenlenir: boolean }) {
  const onayla = useOnayla();
  const [tanim, setTanim] = useState(v.tanim);
  const [kip, setKip] = useState<SahaKipi>("dene");
  const [temiz, setTemiz] = useState(0);
  const [gomulu, setGomulu] = useState(false);
  useEffect(() => {
    if (window.parent === window) return;
    const al = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== window.parent) return;
      const m = e.data as Partial<FormatIletisi> | null;
      if (!m || typeof m !== "object" || m.tur !== "probata-format") return;
      const t = FormatTanimi.safeParse(m.tanim);
      if (!t.success) return;
      setTanim(t.data);
      if (m.kip === "duzenle" || m.kip === "dene") setKip(m.kip);
      if (m.tema === "acik" || m.tema === "koyu") document.documentElement.setAttribute("data-tema", m.tema);
      if (typeof m.temizle === "number") setTemiz(m.temizle);
    };
    window.addEventListener("message", al);
    queueMicrotask(() => setGomulu(true));
    window.parent.postMessage({ tur: "probata-hazir" }, location.origin);
    return () => window.removeEventListener("message", al);
  }, []);
  /* yerinde düzenleme (473): kurucunun saf işlevleriyle yeni tanım → üst pencereye (kâğıt aynı tanımı alır, geri yollar) */
  const degis = (y: FormatTanimi) => { if (y === tanim) return; setTanim(y); window.parent.postMessage({ tur: "probata-degis", tanim: y }, location.origin); };
  const yerinde: Yerinde | undefined = duzenlenir && gomulu && kip === "duzenle" ? {
    ad: (id, ad) => {
      const x = bul(tanim, id);
      if (!x) return;
      degis(x.tur === "bolum" ? bolumAdi(tanim, x.i, ad) : x.tur === "grup" ? grupYaz(tanim, x.i, id, { ad }) : ogeYaz(tanim, x.i, id, { ad }));
    },
    ekle: (bolum, grup) => {
      const i = tanim.bolumler.findIndex((b) => b.id === bolum), b = tanim.bolumler[i];
      if (!b || !(b.blok in YENI_AD)) return;
      degis(b.blok === "liste" && grup ? maddeEkle(tanim, i, grup, YENI_AD.liste) : ogeEkle(tanim, i, YENI_AD[b.blok as keyof typeof YENI_AD]));
    },
    cikar: (id) => void (async () => {
      const x = bul(tanim, id);
      if (!x || x.tur !== "oge") return;
      /* 470: Bakanlık öğesi de çıkar — önce sorulur, yayında uyarı */
      if (x.kilit && !(await onayla({ baslik: "Bakanlık öğesi çıkarılsın mı?", tus: "Çıkar", tehlike: true,
        metin: `“${x.ad}” Bakanlık formatının parçası. Çıkarılırsa bu formatla yazılan raporlar Bakanlık formatına uymaz; yayınlarken uyarı çıkar.` }))) return;
      degis(ogeSil(tanim, x.i, id));
    })(),
    /* ekranda görünen bölümler arasında (imza bölümü ekranda yok, ekipman ve kayıttan bölümler 1–2'de) */
    tasi: (bolum, yon) => {
      const g = raporDuzeni(tanim, false).bolumler.filter((x) => x.b.blok !== "imza").map((x) => x.b.id);
      const v = g.indexOf(bolum), hedef = g[v + yon];
      if (v < 0 || !hedef) return;
      degis({ ...tanim, bolumler: tasi(tanim.bolumler, tanim.bolumler.findIndex((b) => b.id === bolum), tanim.bolumler.findIndex((b) => b.id === hedef)) });
    },
    altEkle: (ana, sonra) => {
      const a = tanim.bolumler.find((b) => b.id === ana), p = tanim.bolumler.findIndex((b) => b.id === sonra) + 1;
      if (a && p > 0) degis(altBaslikEkle(tanim, p, a).t);
    },
  } : undefined;
  const durum = useCallback((x: { eksik: number; kusur: number }) => {
    if (window.parent !== window) window.parent.postMessage({ tur: "probata-durum", ...x }, location.origin);
  }, []);
  /* başlangıç cevapları güncel tanımdan ("Denemeyi temizle" ekranı yeniden kurar — kurucuda eklenen maddeler de "Uygun" gelir) */
  const gorunum = useMemo(() => ({ ...v, tanim, cevaplar: ilkCevaplar(tanim) }), [v, tanim]);
  return <SahaRaporu key={temiz} v={gorunum} deneme={{ kip: duzenlenir && gomulu ? kip : "dene", yerinde, durum }} />;
}
