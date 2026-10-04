"use client";
/* GİZLİ RESİM — depodaki görsel YALNIZ bu bileşenle gösterilir (09-A3): adres <img src>'ye yazılmaz; görsel oturumlu istekle kimliğinden
   indirilir, blob: adresine çevrilir, oturum boyunca önbellekte kalır (aynı dosya ikinci kez inmez — B2), görünür alana girince yüklenir.
   İnemezse görsel yerine kısa ileti (sessiz boşluk yok). */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Ikon } from "../ikon/Ikon";
import { tusSinifi } from "../tus/Tus";
import stil from "./GizliResim.module.css";

const onbellek = new Map<string, Promise<string>>();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** PDF / yazdırma akışı görselleri BEKLEYEREK hazırlar (soğuk önbellekte boş fotoğraf olmasın) */
export function gizliResimAdresi(dosyaId: string): Promise<string> {
  if (!UUID.test(dosyaId)) return Promise.reject(new Error("Geçersiz dosya"));
  let s = onbellek.get(dosyaId);
  if (!s) {
    s = fetch(`/api/dosya/${dosyaId}`, { credentials: "same-origin", cache: "no-store" }).then(async (y) => {
      if (!y.ok) throw new Error(String(y.status));
      const tur = y.headers.get("Content-Type") ?? "";
      if (!tur.startsWith("image/")) throw new Error("Görsel değil");
      return URL.createObjectURL(await y.blob());
    });
    s.catch(() => onbellek.delete(dosyaId));   // başarısız indirme önbellekte kalmaz, sonra yeniden denenir
    onbellek.set(dosyaId, s);
  }
  return s;
}

export function GizliResim({ dosyaId, alt, className }: { dosyaId: string; alt: string; className?: string }) {
  const kap = useRef<HTMLSpanElement>(null);
  const [adres, setAdres] = useState<string | null>(null);
  const [hata, setHata] = useState(false);
  useEffect(() => {
    const k = kap.current;
    if (!k) return;
    let canli = true;
    const gozlemci = new IntersectionObserver((girdiler) => {
      if (!girdiler.some((g) => g.isIntersecting)) return;
      gozlemci.disconnect();
      gizliResimAdresi(dosyaId).then((a) => { if (canli) setAdres(a); }, () => { if (canli) setHata(true); });
    }, { rootMargin: "200px" });
    gozlemci.observe(k);
    return () => { canli = false; gozlemci.disconnect(); };
  }, [dosyaId]);
  return (
    <span ref={kap} className={`${stil.kap} ${className ?? ""}`} data-gizli-resim="">
      {/* blob: adresi: next/image'in en iyileyicisi oturumlu, kimlikli görseli indiremez (ve sunucuda kopya üretmemeli — A3) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {adres ? <img src={adres} alt={alt} loading="lazy" decoding="async" className={stil.resim} /> : hata ? <span className={stil.hata}>Görsel açılamadı</span> : null}
    </span>
  );
}

/** DOSYAYI AÇ (PDF): depodaki dosyanın adresi yalnız bu dosyada üretilir (tests/dosya.test.ts TARAMA). Yeni sekmede, oturumlu tek uçtan
    (yetki ve kiracı orada); kalıcı herkese açık bağlantı değildir. */
export function DosyaAcTusu({ dosyaId, children, ikon = "eye" }: { dosyaId: string; children: ReactNode; ikon?: string }) {
  if (!UUID.test(dosyaId)) return null;
  return <a className={tusSinifi("ikincil")} href={`/api/dosya/${dosyaId}`} target="_blank" rel="noopener"><Ikon ad={ikon} kucuk />{children}</a>;
}
