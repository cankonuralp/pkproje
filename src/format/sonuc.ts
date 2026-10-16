/* SONUÇ KURALI (2026-10-16; pkproje §9 "SONUÇ KURALI FORMAT YAPICIDA, HESAP LİSTESİ SADE" — reisim, pano sigortaları tablosunun kurucu görüntüsüyle:
   "saha ekranında doldururken kurala göre otomatik uygun uygun değil diyor, ama ilgili ayar buradan yapılamıyor ? ben göremiyorum sanki o kısım koda
   gömülmüş gibi, eğer böyle bi özellik koyabileceksek format yapıcıya koyalım"; öneriye "onaylıyorum") — saf.
   Ölçüm tablosunun satır sonucu formatın KENDİ kurallarıyla (tanim.ts SonucKurali): her kural formül dilinde (formul.ts) — kurucuda tablonun
   ayarında görünür ve değişir. Bugüne kadar kodda duran Bakanlık hesapları (hesap.ts: nokta, selektivite, linye, pd, zi) burada AYNI sonucu veren
   formüllere çevrilir (varsayilanKurallar); tanımda kural yoksa (eski sürümler, hazır şablonlar) bunlar kullanılır — yayındaki raporların sonucu
   değişmez (kilit tests/sonuc-kurali.test.ts: eski hesapla satır satır karşılaştırma). Kurallar sütunlara ADLARIYLA bakar; varsayılan kurallar
   sütunların kimliklerinden o anki adlarıyla kurulur (firma adı değiştirmiş olsa da aynı sütun).
   Değerlendirme (kuralUygula): DOĞRU → sağlandı, YANLIŞ ya da "Uygun değil[: neden]" → satır Uygun değil (neden sırayla, aynısı bir kez), "Uygun" →
   sağlandı; boş / hesaplanamaz / başka değer → kural değerlendirilmez. Hiç kural değerlendirilmediyse sonuç yok (sütun sınırları ayrıca).
   Bilinçli farklar (yalnız eksik / bozuk satırda; testte yazılı): In (zorunlu) boşken linye "Ib ≤ In ≤ Iz" kuralı değerlendirilmez (eski hesap
   "Uygun" sayıyordu); nedende sayılar formülün yazımıyla (en çok 3 ondalık, virgül); Bakanlık sütunu silinmiş tablodaki o kural kurulmaz.
   Uygunluk notu önerisi (nokta: Öneri Not-1 / 2 / 4 / 5) sonuç kuralı değildir — hesap.ts noktaHesap'ta kalır (kurucuda salt okunur yazar). */
import { EGRI_KAT, RCD_SURE, UO } from "./hesap.ts";
import { formulDuzelt, metne, type Deger } from "./formul.ts";
import type { BolumOf, FormatTanimi, SonucKurali } from "./tanim.ts";

type Olcum = BolumOf<"olcum">;

/** sütunun formüldeki yazımı (kimlikle bulunur, o anki adıyla); yoksa ya da adı "]" içeriyorsa null */
function sutunAdi(b: Olcum, id: string): string | null {
  const s = b.sutunlar.find((x) => x.id === id)?.ad;
  return s && !s.includes("]") ? `[${s}]` : null;
}
/** fonksiyon testlerindeki "Hesaplanan 3 fazlı kısa devre akımı" (değer kimliği ik3) — formatın herhangi bir test bölümünde */
function k3Adi(t: FormatTanimi | null): string | null {
  for (const b of t?.bolumler ?? []) if (b.blok === "test") { const d = b.degerler.find((x) => x.id === "ik3"); if (d && !d.ad.includes("]")) return `[${d.ad}]`; }
  return null;
}
const kural = (kosul: string, neden: string, aciklama: string): SonucKurali =>
  ({ kosul: formulDuzelt(kosul), neden: neden.startsWith("=") ? `=${formulDuzelt(neden.slice(1))}` : neden, aciklama });

const EGRI = Object.entries(EGRI_KAT).map(([k, v]) => `${k} ${v}`).join(", ");
const RCD_KURALI = `RCD testi: ölçülen açma akımı IΔ ≤ anma akımı IΔn ve açma süresi TΔ ≤ ${RCD_SURE} ms`;
/** RCD testi kuralı (selektivite ve linye): üç değer de sayıysa IΔ ≤ IΔn ve TΔ ≤ 200 ms (hesap.ts rcdTestYeter) */
const rcdKosulu = (idn: string, id: string, td: string) => `EĞER(BAĞ_DEĞ_SAY(${idn}; ${id}; ${td}) = 3; VE(${id} <= ${idn}; ${td} <= ${RCD_SURE}); "")`;

/** hesabın Bakanlık kuralları formül olarak (hesap.ts ile aynı sonuç); hesapsız tabloda boş */
export function varsayilanKurallar(t: FormatTanimi | null, b: Olcum): SonucKurali[] {
  const s = (id: string) => sutunAdi(b, id);
  const l: SonucKurali[] = [];
  switch (b.hesap) {
    case "nokta": {
      /* ZPKK01: Zx ≤ Zs (Zs = Uo ÷ Ia, Ia = eğri çarpanı × In); eğri ya da In sütunu yoksa hesabın yaptığı gibi 10 / 0 */
      const zx = s("zx"), zs = `ZS(${s("egri") ?? "\"\""}; ${s("inom") ?? "\"\""})`;
      if (zx) l.push(kural(`${zx} <= ${zs}`, `="Zx " & ${zx} & " Ω > Zs " & ${zs} & " Ω"`,
        `Zx ≤ Zs → Uygun (Zs = ${UO} V ÷ Ia; Ia = eğri çarpanı × In — ${EGRI}; ZPKK01)`));
      break;
    }
    case "selektivite": {
      const idn = s("idn"), id = s("id"), td = s("td");
      if (idn && id && td) l.push(kural(rcdKosulu(idn, id, td), "RCD testi yetersiz", `${RCD_KURALI} → Uygun; biri sağlanmazsa Uygun değil (ZPKK01)`));
      break;
    }
    case "linye": {
      const In = s("akim"), ib = s("ib"), iz = s("iz"), faz = s("faz"), npen = s("npen"), pe = s("pe"), icu = s("icu"), rcd = s("rcd"), id = s("id"), td = s("td");
      const k3 = k3Adi(t);
      /* Icu < Ik3 yalnız SAĞLANMAZSA sonucu belirler (hesapta tek başına "Uygun" yapmaz) */
      if (icu && k3) l.push(kural(`EĞER(${icu} < ${k3}; YANLIŞ; "")`, `="Icu " & ${icu} & " kA < kısa devre akımı " & ${k3} & " kA"`,
        "Icu ≥ hesaplanan 3 fazlı kısa devre akımı (Fonksiyon testlerindeki değer)"));
      /* Ib ya da Iz yazılmışsa: Ib ≤ In ve In ≤ Iz (yazılmayan taraf aranmaz) */
      if (In && (ib || iz)) {
        const parca = [ib && `YADA(EBOŞSA(${ib}); ${ib} <= ${In})`, iz && `YADA(EBOŞSA(${iz}); ${In} <= ${iz})`].filter(Boolean).join("; ");
        l.push(kural(`EĞER(VE(ESAYIYSA(${In}); BAĞ_DEĞ_SAY(${[ib, iz].filter(Boolean).join("; ")}) > 0); VE(${parca}); "")`, "Ib ≤ In ≤ Iz sağlanmıyor", "Ib ≤ In ≤ Iz"));
      }
      if (faz && npen) l.push(kural(`${npen} >= ${faz}`, "N/PEN kesiti faz kesitinden küçük", "N/PEN kesiti ≥ faz kesiti"));
      /* ETTY Çizelge 8: faz ≤ 16 → faz · 16 < faz ≤ 35 → 16 · faz > 35 → faz ÷ 2 (hesap.ts peSiniri) */
      if (faz && pe) l.push(kural(`EĞER(ESAYIYSA(${faz}); ${pe} >= EĞER(${faz} <= 16; ${faz}; EĞER(${faz} <= 35; 16; ${faz} / 2)); "")`, "PE kesiti yetersiz",
        "PE kesiti ≥ faz kesitine göre en az (16 mm²'ye kadar faz kesiti kadar, 16–35 mm² arası 16 mm², 35 mm² üstü yarısı)"));
      if (rcd && id && td) l.push(kural(rcdKosulu(rcd, id, td), "RCD testi yetersiz", `RCD IΔn yazılmışsa ${RCD_KURALI} (ZPKK02)`));
      break;
    }
    case "pd": {
      const k = s("kesit"), tk = s("tkesit");
      if (k) l.push(kural(`VE(${k} >= 6; ${k} <= 25)`, "PD kesiti 6–25 mm² dışında", "PD kesiti 6–25 mm²"));
      if (tk) l.push(kural(`${tk} >= 4`, "Tamamlayıcı PD kesiti 4 mm²'den küçük", "Tamamlayıcı PD kesiti ≥ 4 mm² (ZPKK02)"));
      break;
    }
    case "zi": {
      const d = s("direnc");
      if (d) l.push(kural(`${d} > 50`, "Zemin izolasyon direnci 50 kΩ'dan büyük değil", "Zemin izolasyon direnci > 50 kΩ (ZPKK02)"));
      break;
    }
    default:
      break;
  }
  return l;
}

/** tablonun geçerli kuralları: tanımdaki (boş liste = kural yok) ya da hesabın Bakanlık kuralları */
export const etkinKurallar = (t: FormatTanimi | null, b: Olcum): SonucKurali[] => b.sonucKurali ?? varsayilanKurallar(t, b);
/** tanımdaki kurallar Bakanlık kurallarıyla aynı mı (kurucuda "Bakanlık kuralına dön" tuşu; açıklama sayılmaz) */
export const kuralOzu = (l: readonly SonucKurali[]) => JSON.stringify(l.map((k) => [k.kosul.trim(), (k.neden ?? "").trim(), !!k.agir]));

const kucuk = (s: string) => s.trim().toLocaleLowerCase("tr").replace(/\s+/g, " ");
/** kuralın değeri → sağlandı / sağlanmadı (yazıdaki neden) / değerlendirilmez */
export function kuralDegeri(v: Deger): { uygun: true } | { uygun: false; neden: string | null } | null {
  if (v === true) return { uygun: true };
  if (v === false) return { uygun: false, neden: null };
  if (typeof v !== "string") return null;
  const k = kucuk(v);
  if (k === "uygun") return { uygun: true };
  const m = /^uygun de[gğ]il\s*(?::\s*(.*))?$/su.exec(k);
  if (!m) return null;
  const i = v.indexOf(":");
  return { uygun: false, neden: m[1] !== undefined && i >= 0 ? v.slice(i + 1).trim() || null : null };
}

export interface KuralSonucu { uygun: boolean | null; neden: string[]; agir: boolean }
/** satırın kuralları — hesapla: satırın bağlamında formül (formul.ts satirHesabi) */
export function kuralUygula(kurallar: readonly SonucKurali[], hesapla: (ifade: string) => Deger): KuralSonucu {
  let uygun: boolean | null = null, agir = false;
  const neden: string[] = [];
  for (const k of kurallar) {
    if (!k.kosul.trim()) continue;
    const r = kuralDegeri(hesapla(k.kosul));
    if (!r) continue;
    if (r.uygun) { if (uygun === null) uygun = true; continue; }
    uygun = false;
    agir ||= !!k.agir;
    const n = nedenMetni(k, r.neden, hesapla);
    if (!neden.includes(n)) neden.push(n);
  }
  return { uygun, neden, agir };
}
/** sağlanmayan kuralın nedeni: "=" ile başlayan formül → değeri; yazı → kendisi; yoksa kuralın yazıdaki nedeni; yoksa açıklaması ya da kendisi */
function nedenMetni(k: SonucKurali, yazidaki: string | null, hesapla: (ifade: string) => Deger): string {
  const n = (k.neden ?? "").trim();
  if (n.startsWith("=")) { const v = metne(hesapla(n.slice(1))).trim(); if (v) return v.slice(0, 400); }
  else if (n) return n;
  if (yazidaki) return yazidaki.slice(0, 400);
  return `${(k.aciklama ?? "").trim() || k.kosul.trim()} sağlanmıyor`;
}

/** kurucu açılışında (duzen.ts kurucuyaHazirla): hesaplı tabloda kural yoksa Bakanlık kuralları tanıma yazılır — kurucuda görünür ve değişir */
export function sonucKurallariniYaz(t: FormatTanimi): FormatTanimi {
  if (!t.bolumler.some((b) => b.blok === "olcum" && b.hesap && !b.sonucKurali)) return t;
  return { ...t, bolumler: t.bolumler.map((b) => (b.blok === "olcum" && b.hesap && !b.sonucKurali ? { ...b, sonucKurali: varsayilanKurallar(t, b) } : b)) };
}
