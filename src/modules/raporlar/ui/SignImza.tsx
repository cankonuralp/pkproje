"use client";
/* PROBATA SIGN İMZA ŞERİDİ (2026-11-05, göç 0122; tasarım 59EF1ZZAJZdg6BztvuiWbr — rapor ekranı 3): firmada probata sign açıkken imza buradan başlar.
   · İmzala → sign'ın imza ekranı yeni sekmede (sekme tıklama anında açılır, bağlantı gelince yönlenir — açılır pencere engeline takılmaz).
   · Bekliyor → İmza ekranını aç · Durumu yenile · İptal et. sign webhook'u gelince rapor kendiliğinden ilerler; gecikirse "Durumu yenile".
   · Reddedildi / iptal / denetimden geçmedi → nedeni şeritte, "İmzala" yeniden.
   · K2: "PDF ile imzala" yedek yolu (bugünkü indir / yükle) — elle verilirse görünür. Muayene uzmanı (uzman) ve teknik yönetici (teknik) aynı şerit. */
import { useState, useTransition, type TransitionStartFunction } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import type { SignEkrani } from "../server/sign";
import { signImzalaEylemi, signIptalEylemi, signTopluAdresiEylemi, signTopluEylemi, signYenileEylemi } from "./eylemler";

const AG = "Bağlantı ya da sunucu hatası; yeniden deneyin.";

export function SignImzaSeridi({ raporId, asama, sign, baslik, mesgul, baslat, yenile, hata, elle }: {
  raporId: string; asama: "uzman" | "teknik"; sign: SignEkrani; baslik: string; mesgul: boolean; baslat: TransitionStartFunction;
  yenile: () => void; hata: (m: string | null) => void; elle?: () => void;
}) {
  const bildir = useBildir();
  const imzala = () => {
    /* sekme tıklama anında açılır (sonradan açılan sekmeyi tarayıcı engeller); bağlantı gelince oraya gider */
    const sekme = window.open("about:blank", "_blank");
    baslat(async () => {
      try {
        const r = await signImzalaEylemi(raporId, asama);
        if (r.tamam && r.baglanti) {
          hata(null);
          if (sekme) { sekme.opener = null; sekme.location.href = r.baglanti; } else window.location.assign(r.baglanti);
          if (r.bildirim) bildir(r.bildirim);
          yenile();
        } else { sekme?.close(); hata(r.genel ?? "probata sign'da imza başlatılamadı."); }
      } catch { sekme?.close(); hata(AG); }
    });
  };
  const yenileSor = () => baslat(async () => {
    try {
      const r = await signYenileEylemi(raporId, asama);
      if (r.tamam) { hata(null); bildir(r.bildirim ?? "Güncellendi."); yenile(); } else { hata(r.genel ?? "Durum alınamadı."); yenile(); }
    } catch { hata(AG); }
  });
  const iptal = () => baslat(async () => {
    try {
      const r = await signIptalEylemi(raporId, asama);
      if (r.tamam) { hata(null); bildir(r.bildirim ?? "İptal edildi."); yenile(); } else hata(r.genel ?? "İptal edilemedi.");
    } catch { hata(AG); }
  });
  if (sign.durum === "bekliyor") {
    return (
      <Serit tur="bilgi" ikon="clock" eylem={<>
        <Tus ikon="file-signature" disabled={mesgul} onClick={imzala}>İmza ekranını aç</Tus>
        <Tus tur="ikincil" ikon="refresh-cw" disabled={mesgul} onClick={yenileSor}>Durumu yenile</Tus>
        <Tus tur="ikincil" ikon="circle-x" disabled={mesgul} onClick={iptal}>İptal et</Tus>
      </>}>
        {baslik} · probata sign&apos;da imza bekliyor
      </Serit>
    );
  }
  return (
    <Serit tur="uyari" ikon="file-signature" eylem={<>
      <Tus ikon="file-signature" disabled={mesgul} onClick={imzala}>İmzala</Tus>
      {elle && <Tus tur="ikincil" disabled={mesgul} onClick={elle}>PDF ile imzala</Tus>}
    </>}>
      {baslik} · probata sign · e-imza{sign.neden ? <> · {sign.neden}</> : null}
    </Serit>
  );
}

/** TOPLU İMZA (sign; sınır 200 — sign kurallar.ts TOPLU_EN_COK): seçilen raporlar 10'ar 10'ar sign'a gönderilir (her biri için imzasız PDF bir kez
    üretilir), sonunda sign'ın toplu imza sayfası hepsiyle yeni sekmede açılır (üye oturumu, PIN bir kez). İmzalanan her rapor sign'ın bildirimiyle
    kendiliğinden ilerler. Üyeliği bulunmayan raporlar rapor rapor "İmzala" ile açılır. */
const TOPLU_EN_COK = 200, PARCA = 10;
export function SignTopluTus({ idler, asama, bitti }: { idler: readonly string[]; asama: "uzman" | "teknik"; bitti: () => void }) {
  const bildir = useBildir();
  const [mesgul, baslat] = useTransition();
  const [ilerleme, setIlerleme] = useState<string | null>(null);
  const tikla = () => {
    const sekme = window.open("about:blank", "_blank");
    const l = idler.slice(0, TOPLU_EN_COK);
    baslat(async () => {
      const belgeler: string[] = [], hatalar: string[] = [];
      let uyeDegil = 0, genel: string | null = null;
      try {
        for (let i = 0; i < l.length; i += PARCA) {
          setIlerleme(`Gönderiliyor ${Math.min(i + PARCA, l.length)} / ${l.length}`);
          const r = await signTopluEylemi(l.slice(i, i + PARCA), asama);
          if (!r.tamam) { genel = r.genel ?? "probata sign'a gönderilemedi."; break; }
          belgeler.push(...(r.belgeler ?? [])); uyeDegil += r.uyeDegil ?? 0; hatalar.push(...(r.hatalar ?? []).map((h) => h.neden));
          if (r.dur) break;
        }
        const url = belgeler.length ? await signTopluAdresiEylemi(belgeler) : null;
        if (url) { if (sekme) { sekme.opener = null; sekme.location.href = url; } else window.location.assign(url); } else sekme?.close();
        const parca = [
          genel ?? "",
          url ? `${belgeler.length} rapor probata sign'ın toplu imza sayfasında; PIN'i bir kez girip imzalayın.` : "",
          idler.length > TOPLU_EN_COK ? `Bir seferde en çok ${TOPLU_EN_COK} rapor; kalan ${idler.length - TOPLU_EN_COK} rapor için yeniden seçin.` : "",
          uyeDegil ? `${uyeDegil} raporda sign üyeliğiniz bulunamadı; onları raporun “İmzala” tuşuyla açın.` : "",
          hatalar.length ? `${hatalar.length} rapor gönderilemedi: ${[...new Set(hatalar)].slice(0, 3).join(" · ")}` : "",
        ].filter(Boolean);
        bildir(parca.join(" ") || "Gönderilecek rapor yok.");
        bitti();
      } catch { sekme?.close(); bildir(AG); } finally { setIlerleme(null); }
    });
  };
  return <Tus ikon="file-signature" disabled={mesgul || !idler.length} aria-busy={mesgul || undefined} onClick={tikla}>{ilerleme ?? "probata sign ile imzala"}</Tus>;
}
