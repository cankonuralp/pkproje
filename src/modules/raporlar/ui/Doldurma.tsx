"use client";
/* SAHA RAPORU · FOTOĞRAF VE EXCEL'DEN DOLDURMA (484; reisim 2026-10-10: "test tablosu olarak kullanılan yerlere excelden yükle ve fotoğraf ekleme
   özelliği olsun fotoğraf eklenince belgede gözükmeyecek yapay zeka buradan okuma yapıp tabloyu dolduracak, aynı şekilde ekipman bilgilerinde de
   olsun bunu istediğim başlığa da ekleyebiliyim"). Formatta (kâğıtta bölüm ayarı — tanim.ts doldurma) açık bölümde:
   · "Fotoğraf ekle" — bölümün BAŞLIK SATIRINDA (BaslikYuvasi.tsx; telefonda simge). 542 (reisim 2026-10-14: "oku tuşu olmayacak say asistandan gir
     ve fotoğrafı okuyup ilgili yerlere girişleri yap diyeceğim ve yapacak", sunum 541 onaylı): fotoğraf OKUNMADAN rapora okuma fotoğrafı olarak
     eklenir (belgede görünmez); bağlantı yoksa cihazda bekler, bağlantı gelince gider. Okuma S.A.Y'da: "Fotoğrafları oku ve gir" — okunmamış
     fotoğraflar okunur, değerler boş alanlara girer (raporlar/say-doldur.ts). "Oku" tuşu, öneri kartı ve küçük açıklama satırları kalktı.
   · OkumaFotolari — bölümün okuma fotoğrafları: Görüntüle · Sil (cihazda bekleyen "cihazda" yazar).
   · ExcelYukle — "Excel'den yükle" (.xlsx / .csv, tarayıcıda okunur; components/disa/oku.ts) + "Excel şablonu": tablo başlık satırıyla, alanlar
     "Alan | Değer" satırlarıyla eşlenir (doldur.ts); değer türüne uymuyorsa yazılmaz, eşleşmeyen sütun / alan söylenir.
   Örnek raporda (format kurucusunun saha ekranı) fotoğraf eklenmez, ne olacağı söylenir; Excel çalışır (yalnız ekranda). */
import { useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { kuyrugaEkle, kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik } from "../../../components/cevrimdisi/kuyruk";
import { baytIndir } from "../../../components/disa/indir";
import { tabloOku, TabloHatasi } from "../../../components/disa/oku";
import { XLSX_TURU, xlsxBayt } from "../../../components/disa/xlsx";
import { fotografiKucult } from "../../../components/foto/kucult";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import tusStil from "../../../components/tus/Tus.module.css";
import type { OkunacakAlan } from "../../../format/deger";
import type { BolumOf } from "../../../format/tanim";
import { alanExceli, alanSablonu, tabloExceli, tabloSablonu } from "../doldur";
import { FOTO_KUYRUK_EN_BUYUK } from "../sema";
import type { RaporFoto } from "../server/raporlar";
import type { Baglam } from "./Bloklar";
import { BaslikTusu, useBolumAc } from "./BaslikYuvasi";
import { fotoSilEylemi, okumaFotografiEkleEylemi } from "./eylemler";
import stil from "./raporlar.module.css";

const dosyaAdi = (s: string) => s.replace(/[^\p{L}\p{N} ._-]/gu, "").trim().slice(0, 60) || "bolum";
/** kuyruktaki okuma fotoğrafının adı (cihazda bekleyenler bölümün listesinde "cihazda" görünür) */
export const OKUMA_KUYRUK_AD = "Okuma fotoğrafı";

/** 542: fotoğraf ekleme kipi — "ekle": gerçek rapor (fotoğraf okunmadan eklenir) · "deneme": format kurucusunun örnek raporu (ne olacağı söylenir) */
export type OkumaKipi = "ekle" | "deneme";
const DENEME = "Örnek raporda fotoğraf eklenmez; gerçek raporda fotoğraf rapora eklenir (belgede görünmez), S.A.Y okuyup boş alanlara girer.";
const metneCevir = (d: Blob) => new Promise<string>((coz, red) => {
  const r = new FileReader();
  r.onload = () => { const s = String(r.result); coz(s.slice(s.indexOf(",") + 1)); };
  r.onerror = () => red(r.error ?? new Error("Fotoğraf okunamadı."));
  r.readAsDataURL(d);
});

/** fotoğraf ekle — tablo ve alanlı bölüm ortak: fotoğraf küçültülür, OKUNMADAN okuma fotoğrafı olarak eklenir; bağlantı yoksa (ya da istek ağda
    düşerse) cihaz kuyruğuna girer (rapor.foto, okuma) ve bağlantı gelince gider */
export function useFotoEkle({ v, bolumId, kip, islem }: { v: { id: string; surum: number; no: string }; bolumId: string; kip: OkumaKipi; islem: Baglam["islem"] }) {
  const bildir = useBildir();
  const girdi = useRef<HTMLInputElement>(null);
  const [ekleniyor, setEkleniyor] = useState(false);
  const girdiyeDon = () => requestAnimationFrame(() => girdi.current?.focus());
  const kuyruga = async (d: File) => {
    if (d.size > FOTO_KUYRUK_EN_BUYUK) { bildir("Fotoğraf bağlantısız eklenemeyecek kadar büyük (en çok 2 MB); bağlantı gelince ekleyin."); return; }
    await kuyrugaEkle({ tur: "rapor.foto", kayit: v.id, surum: v.surum, girdi: { bolum: bolumId, madde: null, ad: d.name, veri: await metneCevir(d), okuma: true },
      ad: `${OKUMA_KUYRUK_AD} · ${v.no} · ${d.name}`, yer: `${bolumId}|` });
    bildir("Fotoğraf cihazda; bağlantı gelince eklenir.");
  };
  const gonder = (d: File) => {
    if (girdi.current) girdi.current.value = "";
    if (ekleniyor || islem.mesgul) return;
    if (kip === "deneme") { bildir(DENEME); return; }
    setEkleniyor(true);
    islem.baslat(async () => {
      try {
        const k = await fotografiKucult(d);
        if (typeof navigator !== "undefined" && navigator.onLine === false) { await kuyruga(k); return; }
        const f = new FormData();
        f.set("id", v.id); f.set("bolum", bolumId); f.set("dosya", k);
        let r: Awaited<ReturnType<typeof okumaFotografiEkleEylemi>>;
        try { r = await okumaFotografiEkleEylemi(f); } catch { await kuyruga(k); return; }
        bildir(r.tamam ? r.bildirim ?? "Fotoğraf eklendi." : r.genel ?? Object.values(r.hatalar ?? {})[0] ?? "Fotoğraf eklenemedi.");
        if (r.tamam) islem.yenile();
      } finally {
        setEkleniyor(false);
        girdiyeDon();
      }
    });
  };
  return { girdi, ekleniyor, gonder };
}

/** "Fotoğraf ekle" — kamera ya da galeri; bölümün başlık satırında (BaslikTusu); telefonda yazı gizlenir, simge kalır (ad girdinin aria-label'ında);
    fotoğraf seçilince bölüm açılır (useBolumAc) — eklenen fotoğraf bölümün içinde görünür */
export function FotoEkleTusu({ baslik, girdi, ekleniyor, mesgul, gonder }: {
  baslik: string; girdi: RefObject<HTMLInputElement | null>; ekleniyor: boolean; mesgul: boolean; gonder: (d: File) => void;
}) {
  const ac = useBolumAc();
  const kapali = (mesgul && !ekleniyor) || undefined;
  return (
    <BaslikTusu>
      <label className={`${tusSinifi("ikincil", ekleniyor ? tusStil.mesgul : undefined)} ${stil.fotoEkle}`} aria-disabled={kapali} title="Fotoğraf ekle">
        <input ref={girdi} type="file" accept="image/jpeg,image/png" className="gizli" aria-busy={ekleniyor || undefined} aria-disabled={kapali}
          aria-label={`${baslik}: fotoğraf ekle`} onClick={(e) => { if (ekleniyor || mesgul) e.preventDefault(); }}
          onChange={(e) => { const d = e.target.files?.[0]; if (d) { ac(); gonder(d); } }} />
        {ekleniyor ? <span className={tusStil.donen} aria-hidden="true" /> : <Ikon ad="camera" kucuk />}
        <span className={stil.fotoYazi}>{ekleniyor ? "Ekleniyor…" : "Fotoğraf ekle"}</span>
      </label>
    </BaslikTusu>
  );
}

/** bölümün fotoğraf tuşu + okuma fotoğrafları (tablo ve alanlı bölüm ortak); tuslar: bölümün öteki tuşları (Excel …) */
export function FotoBolumu({ v, bolumId, baslik, islem, kip, tuslar, cubuk }: {
  v: { id: string; surum: number; no: string; fotolar: RaporFoto[] }; bolumId: string; baslik: string; islem: Baglam["islem"]; kip: OkumaKipi;
  tuslar?: ReactNode; cubuk?: string;
}) {
  const f = useFotoEkle({ v, bolumId, kip, islem });
  return (
    <>
      <FotoEkleTusu baslik={baslik} girdi={f.girdi} ekleniyor={f.ekleniyor} mesgul={islem.mesgul} gonder={f.gonder} />
      {tuslar && <div className={cubuk ?? stil.etiketCubuk}>{tuslar}</div>}
      <OkumaFotolari v={v} bolumId={bolumId} oku={false} islem={islem} />
    </>
  );
}

/** Excel'den yükle + şablon. tablo: satırları uygula (FotoOkuma'nın yerleştirmesiyle — boş satıra ya da sona); alan: değerleri yaz */
export function ExcelYukle(p: { baslik: string; mesgul: boolean } & (
  | { tur: "tablo"; sutunlar: BolumOf<"olcum">["sutunlar"]; uygula: (satirlar: Record<string, string>[]) => void }
  | { tur: "alan"; alanlar: readonly OkunacakAlan[]; yaz: (id: string, deger: string) => void; dolu: (id: string) => boolean })) {
  const bildir = useBildir();
  const onayla = useOnayla();
  const girdi = useRef<HTMLInputElement>(null);
  const yukle = async (d: File) => {
    if (girdi.current) girdi.current.value = "";
    let ham: string[][];
    try { ham = await tabloOku(d.name, new Uint8Array(await d.arrayBuffer())); } catch (e) {
      bildir(e instanceof TabloHatasi ? e.message : "Dosya okunamadı (yalnız .xlsx ya da .csv).");
      return;
    }
    if (p.tur === "tablo") {
      const x = tabloExceli(ham, p.sutunlar);
      if (!x.eslesen.length) { bildir(`Excel'de bu tablonun sütun başlıkları bulunamadı (${p.sutunlar.map((s) => s.ad).join(", ")}). “Excel şablonu” ile başlayın.`); return; }
      if (!x.satirlar.length) { bildir("Excel'de yüklenecek satır yok."); return; }
      p.uygula(x.satirlar);
      bildir(`${x.satirlar.length} satır Excel'den tabloya yazıldı; kaydetmeyi unutmayın.${x.eslesmeyen.length ? ` Eşleşmeyen sütun: ${x.eslesmeyen.join(", ")}.` : ""}${x.atlanan ? ` ${x.atlanan} satırın değerleri türüne uymadı, yazılmadı.` : ""}`);
      return;
    }
    const x = alanExceli(ham, p.alanlar);
    if (!x.degerler.length) { bildir(`Excel'de bu bölümün alanı bulunamadı. “Excel şablonu” ile başlayın (Alan | Değer).`); return; }
    const ezilecek = x.degerler.filter((v) => p.dolu(v.alan));
    if (ezilecek.length && !(await onayla({ baslik: "Dolu alanlar değişsin mi?", tus: "Değiştir",
      metin: `${ezilecek.map((v) => v.ad).join(", ")} dolu; Excel'deki değerle değişir.` }))) return;
    for (const v of x.degerler) p.yaz(v.alan, v.deger);
    bildir(`${x.degerler.length} alan Excel'den yazıldı; kaydetmeyi unutmayın.${x.eslesmeyen.length ? ` Tanınmayan: ${x.eslesmeyen.slice(0, 5).join(", ")}.` : ""}${x.gecersiz.length ? ` Türüne uymadığı için yazılmayan: ${x.gecersiz.join(", ")}.` : ""}`);
  };
  const sablon = () => baytIndir(`${dosyaAdi(p.baslik)} sablonu.xlsx`,
    xlsxBayt(p.baslik.slice(0, 31) || "Sablon", p.tur === "tablo" ? tabloSablonu(p.sutunlar) : alanSablonu(p.alanlar)), XLSX_TURU);
  return (
    <>
      <label className={`${tusSinifi("ikincil")} ${stil.fotoEkle}`} aria-disabled={p.mesgul || undefined}>
        <input ref={girdi} type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" className="gizli"
          disabled={p.mesgul} aria-label={`${p.baslik}: Excel'den yükle`} onChange={(e) => { const d = e.target.files?.[0]; if (d) void yukle(d); }} />
        <Ikon ad="file-spreadsheet" kucuk /><span>Excel&apos;den yükle</span>
      </label>
      <Tus tur="ikincil" ikon="download" aria-label={`${p.baslik}: Excel şablonu`} onClick={sablon}>Excel şablonu</Tus>
    </>
  );
}

/** bölümün okuma fotoğrafları (belgede görünmez): Görüntüle · Sil; cihazda bekleyenler "cihazda" (bağlantı gelince eklenir) */
export function OkumaFotolari({ v, bolumId, oku, islem }: {
  v: { id: string; surum: number; fotolar: RaporFoto[] }; bolumId: string; oku: boolean; islem: Baglam["islem"];
}) {
  const bildir = useBildir();
  const onayla = useOnayla();
  const kuyruk = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const l = v.fotolar.filter((f) => f.okuma && f.bolum === bolumId);
  const bekleyen = oku ? [] : kuyruk.isler.filter((x) => x.kayit === v.id && x.tur === "rapor.foto" && x.durum === "bekliyor" && x.yer === `${bolumId}|`
    && x.ad.startsWith(OKUMA_KUYRUK_AD));
  if (!l.length && !bekleyen.length) return null;
  const sil = async (f: RaporFoto) => {
    if (!(await onayla({ baslik: "Fotoğrafı sil", metin: `${f.ad} rapordan çıkarılır (girilen değerler kalır).`, tus: "Sil", tehlike: true }))) return;
    islem.baslat(async () => {
      const r = await fotoSilEylemi(v.id, v.surum, f.dosya);
      bildir(r.tamam ? r.bildirim ?? "Fotoğraf silindi." : r.genel ?? "Fotoğraf silinemedi.");
      if (r.tamam) islem.yenile();
    });
  };
  return (
    <ul className={`${stil.fotoListe} ${stil.okumaFoto}`} aria-label="Okunacak fotoğraflar">
      {l.map((f) => (
        <li key={f.dosya}>
          <span className={stil.fotoAd}><Ikon ad="camera" kucuk /> {f.ad}</span>
          <span className={stil.fotoTuslar}>
            <DosyaAcTusu dosyaId={f.dosya}>Görüntüle</DosyaAcTusu>
            {!oku && <Tus tur="ikincil" ikon="trash-2" disabled={islem.mesgul} aria-label={`${f.ad} sil`} onClick={() => void sil(f)}>Sil</Tus>}
          </span>
        </li>
      ))}
      {bekleyen.map((x) => (
        <li key={x.id}>
          <span className={stil.fotoAd}><Ikon ad="wifi-off" kucuk /> {x.ad.split(" · ").pop()}</span>
          <Rozet tur="bekliyor">cihazda</Rozet>
        </li>
      ))}
    </ul>
  );
}

/** alanlı bölümün (ekipman bilgileri, bilgi, test) doldurma çubuğu: formatın ayarına göre fotoğraf ekle ve Excel; okuma fotoğrafları */
export function AlanDoldurma({ bag, bolumId, baslik, alanlar, ayar, yaz, dolu }: {
  bag: Baglam; bolumId: string; baslik: string; alanlar: readonly OkunacakAlan[]; ayar: { foto: boolean; excel: boolean };
  yaz: (id: string, deger: string) => void; dolu: (id: string) => boolean;
}) {
  if (!alanlar.length || (!ayar.foto && !ayar.excel)) return null;
  const excel = ayar.excel && !bag.oku
    ? <ExcelYukle tur="alan" baslik={baslik} alanlar={alanlar} yaz={yaz} dolu={dolu} mesgul={bag.islem.mesgul} /> : null;
  return (
    <div className={stil.doldurma}>
      {ayar.foto && bag.okumaKipi
        ? <FotoBolumu v={bag.v} bolumId={bolumId} baslik={baslik} islem={bag.islem} kip={bag.okumaKipi} tuslar={excel} />
        : <>{excel && <div className={stil.etiketCubuk}>{excel}</div>}<OkumaFotolari v={bag.v} bolumId={bolumId} oku={bag.oku} islem={bag.islem} /></>}
    </div>
  );
}
