"use client";
/* PDF GÖRÜNÜMÜ (2026-10-17; reisim: "müşteri tıklayınca direk raporu görmeli pdfi aç, tuşu falan ne alaka … burada tıkladığı gibi içeride raporu
   görmeli"): PDF'in sayfaları sayfanın İÇİNDE çizilir — pdf.js tarayıcıda (telefonda da; tarayıcının kendi PDF görüntüleyicisine ve çerçeveye bağlı
   değil). Dosya verilen adresten (aynı köken; yetki sunucuda). Sayfalar kabın genişliğine sığar, sırayla çizilir. pdf.js: dizgi değerlendirme (eval)
   kapalı, XFA kapalı, işçi kendi kökenimizden (CSP worker-src 'self'), yazı tipleri dosyanın içinden. */
import { useEffect, useRef, useState } from "react";
import { dosyaCerceveAdresi } from "../gizli-resim/GizliResim";
import stil from "./pdf.module.css";

/** çizim çözünürlüğü sınırı (piksel genişlik; büyük ekranda ve çok sayfada bellek) */
const EN_GENIS = 1800;

/** dosyaId: depodaki dosya (adres tek dosya ucundan — GizliResim dosyaCerceveAdresi); adres: başka uç (doğrulama sayfasının jetonlu adresi) */
export function PdfGorunumu({ dosyaId, adres: verilen, ad }: { dosyaId?: string; adres?: string; ad: string }) {
  const adres = dosyaId ? dosyaCerceveAdresi(dosyaId) : verilen ?? null;
  const kap = useRef<HTMLDivElement>(null);
  const [durum, setDurum] = useState<"yukleniyor" | "tamam" | "hata">("yukleniyor");
  useEffect(() => {
    const k = kap.current;
    if (!k || !adres) return;
    let bitti = false;
    let birak: (() => void) | null = null;
    setDurum("yukleniyor");
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        if (!pdfjs.GlobalWorkerOptions.workerPort) {
          pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url), { type: "module" });
        }
        const y = await fetch(adres, { credentials: "same-origin" });
        if (!y.ok) throw new Error(`PDF alınamadı (${y.status})`);
        const gorev = pdfjs.getDocument({ data: new Uint8Array(await y.arrayBuffer()), isEvalSupported: false, enableXfa: false, verbosity: 0 });
        birak = () => { void gorev.destroy(); };
        const belge = await gorev.promise;
        k.replaceChildren();
        for (let i = 1; i <= belge.numPages; i++) {
          if (bitti) return;
          const sayfa = await belge.getPage(i);
          const genislik = Math.min(EN_GENIS, Math.max(320, k.clientWidth) * Math.min(window.devicePixelRatio || 1, 2));
          const v = sayfa.getViewport({ scale: genislik / sayfa.getViewport({ scale: 1 }).width });
          const c = document.createElement("canvas");
          c.width = Math.floor(v.width);
          c.height = Math.floor(v.height);
          c.className = stil.sayfa;
          c.setAttribute("role", "img");
          c.setAttribute("aria-label", `${ad} — sayfa ${i} / ${belge.numPages}`);
          c.dataset.pdfSayfa = String(i);
          k.append(c);
          await sayfa.render({ canvas: c, viewport: v }).promise;
          sayfa.cleanup();
        }
        if (!bitti) setDurum("tamam");
      } catch {
        if (!bitti) setDurum("hata");
      }
    })();
    return () => { bitti = true; birak?.(); };
  }, [adres, ad]);
  return (
    <div className={stil.dis}>
      {durum === "yukleniyor" && <p className={stil.durum} role="status">Rapor yükleniyor…</p>}
      {durum === "hata" && <p className={stil.durum} role="alert">Rapor görüntülenemedi; &quot;PDF indir&quot; ile açabilirsiniz.</p>}
      <div ref={kap} className={stil.kap} />
    </div>
  );
}
