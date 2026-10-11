"use client";
/* YÜZEN KATMAN — açılır liste, takvim ve saat önerileri ÜST KATMANDA açılır (tarayıcının "popover" üst katmanı): sayfayı ve pencereyi
   İTMEZ, kayan pencere ya da kart KESMEZ. 452 (reisim 2026-10-09: "seçmeli yere tıklıyoruz tüm sayfa kayıyor", "bu ve benzeri kaymalar kabul
   edilemez"): pencerede liste akış içinde açılıp altındaki alanları itiyordu; takvim pencerenin altında kesiliyordu.
   Konum, katmanın ait olduğu alanın (DOM'daki üst öğesi) ekrandaki yerinden: altında; sığmazsa ve üstte daha çok yer varsa üstünde; ekranın
   kenarından taşmaz (en az 8 px pay); sayfa ya da pencere kayınca, boyut değişince yeniden yerleşir. Üst katman yoksa (eski tarayıcı) sabit
   konumla yine yüzer. Katman DOM'da alanın içinde kalır: dışarı tıklama, odak ve klavye eskisi gibi.
   486 (reisim 2026-10-10: "tip seçin kısmına tıklayınca saçma sapan başa atıp"): tablodaki eski bir CSS ezmesi katmanı akışa (position: static)
   alıyordu — üst katmanda akıştaki öğe sayfanın başında çizilir, odak sayfayı oraya kaydırır. Artık konum biçemi katmanın KENDİ satır içi
   biçeminde (fixed, kenarlar, pay sıfır): hiçbir sayfa CSS'i ezemez; katmanın içine odak sayfayı kaydırmadan verilir (odakla). */
import { useLayoutEffect, type RefObject } from "react";

const BOSLUK = 6, PAY = 8;

export interface YuzenAyar {
  /** "alan": alanın genişliği (en az enAzGenislik) · "dogal": içeriğin kendi genişliği · sayı: sabit px */
  genislik?: "alan" | "dogal" | number;
  enAzGenislik?: number;
  /** katmanın en çok yüksekliği (içi kayar); ekranda yer azsa daha kısa */
  enCokYukseklik?: number;
  /** "sol": sol kenarlar hizalı · "sag": sağ kenarlar hizalı (sağdaki süzgeç seçicisi) */
  hiza?: "sol" | "sag";
}

/** ekrandaki yer: alanın altı mı üstü mü, en çok ne kadar yükseklik (saf; testte doğrudan) */
export function yuzenYer(alan: { top: number; bottom: number }, ekranY: number, yukseklik: number, enCok: number) {
  const alt = ekranY - alan.bottom - BOSLUK - PAY, ust = alan.top - BOSLUK - PAY;
  const h = Math.min(yukseklik, enCok);
  if (h <= alt || alt >= ust) return { ust: false, enCok: Math.max(Math.min(enCok, alt), 120) };
  return { ust: true, enCok: Math.max(Math.min(enCok, ust), 120) };
}

/** yatay yer: ekranın içinde kalır (saf) */
export function yuzenSol(alan: { left: number; right: number }, ekranX: number, genislik: number, hiza: "sol" | "sag") {
  const sol = hiza === "sag" ? alan.right - genislik : alan.left;
  return Math.max(PAY, Math.min(sol, ekranX - genislik - PAY));
}

/** yüzen katmanın içindeki öğeye odak — sayfa ya da kayan kap KAYMAZ (katman zaten alanın yanında, ekranda) */
export function odakla(e: HTMLElement | null | undefined) {
  e?.focus({ preventScroll: true });
}

/** katmanı alanına göre yerleştirir (biçemi yazar — konum dahil: sayfanın CSS'i katmanı akışa alamaz) */
function yerlestir(k: HTMLElement, alan: HTMLElement, { genislik = "alan", enAzGenislik = 220, enCokYukseklik = 320, hiza = "sol" }: YuzenAyar) {
  const r = alan.getBoundingClientRect(), ekranX = document.documentElement.clientWidth, ekranY = document.documentElement.clientHeight;
  const sinir = ekranX - 2 * PAY, b = k.style;
  b.position = "fixed"; b.margin = "0"; b.right = "auto";
  if (genislik === "dogal") { b.width = ""; b.maxWidth = `${sinir}px`; }
  else b.width = `${Math.min(typeof genislik === "number" ? genislik : Math.max(r.width, enAzGenislik), sinir)}px`;
  b.maxHeight = `${enCokYukseklik}px`;
  const w = k.offsetWidth, y = yuzenYer(r, ekranY, k.scrollHeight, enCokYukseklik);
  b.left = `${yuzenSol(r, ekranX, Math.max(w, genislik === "dogal" ? enAzGenislik : 0), hiza)}px`;
  b.maxHeight = `${y.enCok}px`;
  if (y.ust) { b.top = "auto"; b.bottom = `${ekranY - r.top + BOSLUK}px`; }
  else { b.bottom = "auto"; b.top = `${r.bottom + BOSLUK}px`; }
}

/** üst katmanda aç / kapat */
function katmanAc(k: HTMLElement, ac: boolean) {
  try {
    if (ac && !k.matches(":popover-open")) k.showPopover();
    if (!ac && k.matches(":popover-open")) k.hidePopover();
  } catch { /* üst katman yok: sabit konumla yine yüzer */ }
}

export function useYuzen(katman: RefObject<HTMLElement | null>, { genislik = "alan", enAzGenislik = 220, enCokYukseklik = 320, hiza = "sol" }: YuzenAyar = {}) {
  useLayoutEffect(() => {
    const k = katman.current, alan = k?.parentElement;
    if (!k || !alan) return;
    katmanAc(k, true);
    const yerles = () => yerlestir(k, alan, { genislik, enAzGenislik, enCokYukseklik, hiza });
    yerles();
    /* içerik değişince (arama süzdü, ay değişti) de yerleşsin — yalnız alt öğeler izlenir (katmanın kendi biçemi değil: döngü olmaz) */
    let kare = 0;
    const sonra = () => { cancelAnimationFrame(kare); kare = requestAnimationFrame(yerles); };
    const gozcu = typeof MutationObserver === "function" ? new MutationObserver(sonra) : null;
    gozcu?.observe(k, { childList: true, subtree: true, characterData: true });
    /* katmanın kendi içi kayınca yerleşmez; sayfa / pencere kayınca yerleşir */
    const kaydi = (e: Event) => { if (!(e.target instanceof Node && k.contains(e.target))) yerles(); };
    window.addEventListener("scroll", kaydi, true);
    window.addEventListener("resize", yerles);
    return () => {
      cancelAnimationFrame(kare);
      gozcu?.disconnect();
      window.removeEventListener("scroll", kaydi, true);
      window.removeEventListener("resize", yerles);
      katmanAc(k, false);
    };
  }, [katman, genislik, enAzGenislik, enCokYukseklik, hiza]);
}
