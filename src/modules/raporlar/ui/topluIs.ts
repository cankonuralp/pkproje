"use client";
/* RAPORLARDA TOPLU İŞ (2026-11-02, liste maketi onaylı — reisim "seç sil toplu sil vs yok raporlar için"): seçilen ya da süzgece uyan raporların
   PDF'leri tek ZIP (tamamlanan raporun imzalı PDF'i, ötekinin imzasız belgesi — ikisi de oturumlu uçlardan, yetki uçta yeniden; adlar rapor no -
   ekipman kodu - tür, imzasız olanda "-imzasiz"), tek raporda PDF iner. En çok 300 rapor ve 500 MB (müşteri panelinin sınırı). İnemeyen rapor
   (saklama süresi dolmuş, bağlantı) atlanır, sayısı ve nedeni söylenir. Toplu silme: her rapor sunucuda KENDİ işlemiyle (raporSilEylemi —
   yetki, durum ve sürüm her biri için yeniden); yalnız kişinin kendi Yeni (revizyonsuz) raporu silinir, öteki nedeniyle sayılır. */
import { useState } from "react";
import { baytIndir, dosyaGunu } from "../../../components/disa/indir";
import { zipParcalari } from "../../../components/disa/zip";
import { dosyaBaytlari } from "../../../components/gizli-resim/GizliResim";
import { RAPOR_DURUM, raporDosyaAdi, type RaporDurumu } from "../sema";
import { raporSilEylemi } from "./eylemler";

export const TOPLU_EN_COK = 300;
const BAYT_EN_COK = 500 * 1024 * 1024;

export interface TopluRapor {
  id: string; no: string; surum: number; durum: RaporDurumu; revizyon: number; benim: boolean;
  ekipmanKod: string; turAd: string; tesis: string; imzaliDosya?: string | null;
}

/** silinemezse nedeni (sunucu yeniden denetler; burada yalnız pencerede söylemek için) */
export function silmeNedeni(r: TopluRapor): string | null {
  if (r.durum !== "taslak") return `Durumu: ${RAPOR_DURUM[r.durum][0]}`;
  if (r.revizyon > 0) return "Revizyondaki rapor silinmez";
  if (!r.benim) return "Başka uzmanın raporu";
  return null;
}

const dosyaAdiGuvenli = (s: string) => s.replace(/[\\/:*?"<>|]/g, "-").trim() || "tesis";

async function pdfAl(r: TopluRapor): Promise<Uint8Array> {
  if (r.imzaliDosya) return dosyaBaytlari(r.imzaliDosya);
  const y = await fetch(`/raporlar/${r.id}/pdf`, { credentials: "same-origin", cache: "no-store" });
  if (y.status === 409) throw new Error("PDF'i yok (saklama süresi doldu)");
  if (!y.ok || (y.headers.get("Content-Type") ?? "") !== "application/pdf") throw new Error("PDF hazırlanamadı");
  return new Uint8Array(await y.arrayBuffer());
}

/** PDF'leri indirir; ilerleme "3 / 12"; sonuç: inen sayısı ve inemeyenler */
export function useTopluIndir() {
  const [ilerleme, setIlerleme] = useState<string | null>(null);
  const indir = async (l: readonly TopluRapor[], ad: string): Promise<{ inen: number; inemeyen: { no: string; neden: string }[] } | null> => {
    if (ilerleme || !l.length) return null;
    if (l.length > TOPLU_EN_COK) return { inen: 0, inemeyen: [{ no: "", neden: `En çok ${TOPLU_EN_COK} rapor birlikte indirilir; süzgeçle daraltın.` }] };
    const dosyalar: [string, Uint8Array][] = [], adlar = new Set<string>(), inemeyen: { no: string; neden: string }[] = [];
    let toplam = 0;
    try {
      for (const [i, r] of l.entries()) {
        setIlerleme(`${i} / ${l.length}`);
        try {
          const b = await pdfAl(r);
          toplam += b.length;
          if (toplam > BAYT_EN_COK) { inemeyen.push({ no: r.no, neden: "500 MB sınırı aşıldı" }); break; }
          const kok = raporDosyaAdi(r.no, r.ekipmanKod, r.turAd, r.imzaliDosya ? undefined : "imzasiz").replace(/\.pdf$/, "");
          let yol = l.length === 1 ? `${kok}.pdf` : `${dosyaAdiGuvenli(r.tesis)}/${kok}.pdf`;
          for (let n = 2; adlar.has(yol); n++) yol = yol.replace(/( \(\d+\))?\.pdf$/, ` (${n}).pdf`);
          adlar.add(yol);
          dosyalar.push([yol, b]);
        } catch (e) { inemeyen.push({ no: r.no, neden: e instanceof Error ? e.message : "indirilemedi" }); }
      }
      if (dosyalar.length === 1 && l.length === 1) baytIndir(dosyalar[0][0], dosyalar[0][1], "application/pdf");
      else if (dosyalar.length) baytIndir(`${ad}-${dosyaGunu()}.zip`, zipParcalari(dosyalar), "application/zip");
      return { inen: dosyalar.length, inemeyen };
    } finally { setIlerleme(null); }
  };
  return { ilerleme, indir };
}

/** seçilenleri sırayla siler (her biri kendi isteğiyle); dönen: silinenlerin kimlikleri ve silinemeyenler */
export async function topluSil(l: readonly TopluRapor[]): Promise<{ silinen: string[]; kalan: { no: string; neden: string }[] }> {
  const silinen: string[] = [], kalan: { no: string; neden: string }[] = [];
  for (const r of l) {
    const n = silmeNedeni(r);
    if (n) { kalan.push({ no: r.no, neden: n }); continue; }
    try {
      const y = await raporSilEylemi(r.id, r.surum);
      if (y.tamam) silinen.push(r.id); else kalan.push({ no: r.no, neden: y.genel ?? "Silinemedi" });
    } catch { kalan.push({ no: r.no, neden: "Bağlantı ya da sunucu hatası" }); }
  }
  return { silinen, kalan };
}
