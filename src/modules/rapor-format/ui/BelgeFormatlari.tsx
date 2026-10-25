"use client";
/* FİRMA AYARLARI › BELGE FORMATLARI — 2026-10-25 (belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca
   bağlamalıyız", "zaten araç yapılı sadece bağlama işi yapılacak"). Programın ürettiği her belge için: "Temel format" (src/belge/<belge>.ts) ya da
   "Firmanın formatı · Sürüm n" (+ açık taslak). Tuşlar rapor şablonunun aracıyla (SablonBolumu.tsx deseni): PDF'ten kur (PDF tarayıcıda okunur —
   pdfOku.ts; okunan ızgara sunucuya, şablon taslak olur, Belge kurucu açılır), Boş başla, Düzenle (taslak varsa ona, yoksa yayındakinden taslak),
   Temel formata dön (yalnız yayında varsa). Açık taslağın yerine geçen işlem sorar. Tuşlar yalnız değiştirebilene çizilir; karar ve yetki sunucuda
   (server/belgeler.ts). Aşama ayrı durumda (geçişin ilk adımındaki durum ancak iş bitince görünürdü — BasilidanKurTusu). */
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { KartEtiket, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { useOnayla } from "../../../components/pencere/Onay";
import { AltSatir, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import type { BasiliHam } from "../pdf-tipler";
import type { BelgeFormatOzeti } from "../server/belgeler";
import { BELGE_FORMATLARI } from "./BelgeKurucu";
import { belgeBasilidanKurEylemi, belgeTaslakAcEylemi, belgeTemeleDonEylemi } from "./belge-eylemler";
import { tarihYaz } from "./ortak";
import { pdfdenHam, pdfOkumaHatasi } from "./pdfOku";
import stil from "./format.module.css";

/** tarayıcıda okunacak PDF'in sınırı (türün format PDF'iyle aynı — ekipman-turleri/ui/eylemler.ts) */
const PDF_EN_COK = 25 << 20;
const kurucu = (id: string) => `${BELGE_FORMATLARI}/${id}/kurucu`;
const TANIM: SuzgecTanimi<BelgeFormatOzeti> = {
  ad: "Belgelerde ara", ipucu: "Belge adı", birim: "belge", sayfa: 20, imkansiz: "Bir belge aynı anda temel formatta ve firmanın formatında olamaz",
  metin: (x) => x.ad,
  cipler: [
    { k: "firma", ad: "Firmanın formatı", grup: "format", test: (x) => !!x.yayinda },
    { k: "temel", ad: "Temel format", grup: "format", test: (x) => !x.yayinda },
    { k: "taslak", ad: "Taslak var", test: (x) => !!x.taslak },
  ],
  seciciler: [],
};

export function BelgeFormatlari({ ozetler, yaz }: { ozetler: BelgeFormatOzeti[]; yaz: boolean }) {
  const sutunlar: Sutun<BelgeFormatOzeti>[] = [
    { k: "belge", genislik: yaz ? "28%" : "50%", baslik: "Belge", kart: "ust", sira: 1, hucre: (x) => <b>{x.ad}</b> },
    { k: "format", genislik: yaz ? "26%" : "50%", baslik: "Format", kart: "govde", sira: 2, hucre: (x) => <>
      <KartEtiket>Format</KartEtiket>{x.yayinda ? `Firmanın formatı · Sürüm ${x.yayinda.sira}` : "Temel format"}
      {x.yayinda && <AltSatir>Yayınlandı · {tarihYaz(x.yayinda.yayin)}</AltSatir>}
      {x.taslak && <AltSatir>Taslak var · {tarihYaz(x.taslak.degisti)}</AltSatir>}
    </> },
    ...(yaz ? [{ k: "eylem", genislik: "46%", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: (x: BelgeFormatOzeti) => <BelgeTuslari x={x} /> } as const] : []),
  ];
  const s = useSuzgec(TANIM, ozetler);
  return (
    <>
      <SayfaBasi baslik="Belge formatları" sayac={<Sayac s={s} />} />
      <SuzgecliListe s={s} on="bf" baslik="Belge formatları" sutunlar={sutunlar} anahtar={(x) => x.belge} bosVeri={{ ikon: "file-text", baslik: "Belge yok" }} />
    </>
  );
}

/** satırın tuşları: PDF'ten kur · Boş başla · Düzenle · Temel formata dön */
function BelgeTuslari({ x }: { x: BelgeFormatOzeti }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const dosya = useRef<HTMLInputElement>(null);
  const [asama, setAsama] = useState<"okunuyor" | "kuruluyor" | "aciliyor" | "donuyor" | null>(null);
  const calisiyor = asama !== null;
  const yerine = x.taslak ? ` Taslak (${tarihYaz(x.taslak.degisti)}) bununla değiştirilir.` : "";
  const hata = (r: { genel?: string; hatalar?: Record<string, string> }, varsayilan: string) => r.genel ?? Object.values(r.hatalar ?? {})[0] ?? varsayilan;

  const pdftenKur = async (f: File) => {
    if (f.size > PDF_EN_COK) { bildir("PDF en çok 25 MB."); return; }
    if (x.taslak && !(await onayla({ baslik: `${x.ad} · PDF'ten kur`, tus: "Kur", metin: `Format bu PDF'e göre yeni taslak olarak kurulur.${yerine}` }))) return;
    setAsama("okunuyor");
    let ham: BasiliHam;
    try { ham = await pdfdenHam(await f.arrayBuffer()); } catch (e) { setAsama(null); bildir(pdfOkumaHatasi(e)); return; }
    setAsama("kuruluyor");
    let r: Awaited<ReturnType<typeof belgeBasilidanKurEylemi>>;
    try { r = await belgeBasilidanKurEylemi(x.belge, ham, x.taslak?.surum ?? null); } catch { r = { genel: "Şablon kurulamadı." }; }
    if (!r.tamam || !r.id) { setAsama(null); bildir(hata(r, "Şablon kurulamadı.")); return; }
    /* kurulunca kurucu açılır — tuş o ana dek "Şablon kuruluyor…" (ikinci basış görmediği taslağı ezmeye kalkmasın) */
    bildir(["Şablon PDF'ten kuruldu (taslak).", ...(r.uyarilar ?? [])].join(" "));
    router.push(kurucu(r.id));
  };
  const taslakAc = async (kaynak: "bos" | "yayindaki") => {
    if (kaynak === "bos" && !(await onayla({ baslik: `${x.ad} · boş başla`, tus: "Başla", metin: `Boş bir format taslağı açılır.${yerine}` }))) return;
    setAsama("aciliyor");
    let r: Awaited<ReturnType<typeof belgeTaslakAcEylemi>>;
    try { r = await belgeTaslakAcEylemi(x.belge, kaynak, kaynak === "bos" ? x.taslak?.surum ?? null : null); } catch { r = { genel: "Taslak açılamadı." }; }
    if (!r.tamam || !r.id) { setAsama(null); bildir(hata(r, "Taslak açılamadı.")); return; }
    router.push(kurucu(r.id));
  };
  const temeleDon = async () => {
    if (!x.yayinda) return;
    if (!(await onayla({ baslik: `${x.ad} · temel formata dön`, tus: "Temel formata dön", tehlike: true,
      metin: `Firmanın formatı (Sürüm ${x.yayinda.sira}) yayından kalkar; yeni belgeler temel formatla çizilir.` }))) return;
    setAsama("donuyor");
    let r: Awaited<ReturnType<typeof belgeTemeleDonEylemi>>;
    try { r = await belgeTemeleDonEylemi(x.belge); } catch { r = { genel: "Temel formata dönülemedi." }; }
    setAsama(null);
    if (!r.tamam) { bildir(hata(r, "Temel formata dönülemedi.")); return; }
    bildir(`${x.ad} temel formata döndü.`); router.refresh();
  };

  return (
    <span className={stil.tuslar}>
      <input ref={dosya} type="file" accept="application/pdf,.pdf" hidden tabIndex={-1} aria-label={`${x.ad} · PDF`}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void pdftenKur(f); }} />
      <Tus tur="ikincil" ikon="scan-text" disabled={calisiyor} aria-busy={asama === "okunuyor" || asama === "kuruluyor" || undefined}
        aria-label={`${x.ad} · PDF'ten kur`} onClick={() => dosya.current?.click()}>
        {asama === "okunuyor" ? "PDF okunuyor…" : asama === "kuruluyor" ? "Şablon kuruluyor…" : "PDF'ten kur"}</Tus>
      <Tus tur="ikincil" ikon="file-plus" disabled={calisiyor} aria-label={`${x.ad} · Boş başla`} onClick={() => void taslakAc("bos")}>Boş başla</Tus>
      {x.taslak
        ? <TusBaglanti ikon="pencil" href={kurucu(x.taslak.id)}>Düzenle</TusBaglanti>
        : x.yayinda && <Tus tur="ikincil" ikon="pencil" disabled={calisiyor} aria-busy={asama === "aciliyor" || undefined} aria-label={`${x.ad} · Düzenle`}
          onClick={() => void taslakAc("yayindaki")}>Düzenle</Tus>}
      {x.yayinda && <Tus tur="ikincil" ikon="rotate-ccw" disabled={calisiyor} aria-busy={asama === "donuyor" || undefined} aria-label={`${x.ad} · Temel formata dön`}
        onClick={() => void temeleDon()}>Temel formata dön</Tus>}
    </span>
  );
}
