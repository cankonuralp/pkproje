"use client";
/* SAHA RAPORU · FOTOĞRAFTAN / EXCEL'DEN DOLDURMA (484; reisim 2026-10-10: "test tablosu olarak kullanılan yerlere excelden yükle ve fotoğraf ekleme
   özelliği olsun fotoğraf eklenince belgede gözükmeyecek yapay zeka buradan okuma yapıp tabloyu dolduracak, aynı şekilde ekipman bilgilerinde de
   olsun bunu istediğim başlığa da ekleyebiliyim"). Formatta (kâğıtta bölüm ayarı — tanim.ts doldurma) açık bölümde:
   · AlanOkuma — "Fotoğraftan doldur" (385'in "Etiketten oku"sunun genel hâli): ekipman bilgileri, bilgi bölümü, test değerleri; okunanlar ÖNERİ
     kartında (emin olunanlar toplu, "Emin değil" tek tek), yazılanlar rapora ancak Kaydet ile geçer; fotoğraf rapora okuma fotoğrafı olarak eklenir
     (belgede görünmez). Ölçüm tablosunda aynı iş FotoOkuma.tsx'te (satır satır).
   · ExcelYukle — "Excel'den yükle" (.xlsx / .csv, tarayıcıda okunur; components/disa/oku.ts) + "Excel şablonu": tablo başlık satırıyla, alanlar
     "Alan | Değer" satırlarıyla eşlenir (doldur.ts); değer türüne uymuyorsa yazılmaz, eşleşmeyen sütun / alan söylenir.
   · OkumaFotolari — okunan bölümün okuma fotoğrafları: Görüntüle · Oku · Sil (raporda kanıt; belgede yok).
   Örnek raporda (format kurucusunun saha ekranı) fotoğraf okunmaz, ne olacağı söylenir; Excel çalışır (yalnız ekranda).
   486 (reisim 2026-10-10: "linye girme tablo doldurma alanlarında nerde fotoğraf ekleme tuşu? … buralarda yapay zekanın okuması için fotoğraf
   ekleme tuşu olsun yapay zeka okusun diye raporda gözükmesin"): "Fotoğraf ekle (yapay zekâ okur)" tuşu formatta açık bölümde HER ZAMAN — kip
   (OkumaKipi; SahaRaporu kurar): "oku" firmada yapay zekâ açık → okur, öneri gelir · "sakla" kapalı → fotoğraf okunmadan rapora eklenir
   (belgede görünmez), açılınca fotoğrafın "Oku"su okur · "deneme" örnek rapor. Eskiden kapalıyken tuş yerine yalnız not vardı (484): tuş
   görünmüyordu. İş tablo ve alanlı bölümde ortak (useFotoEkle, FotoEkleTusu). */
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
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
import type { AlanOkunan } from "../../../server/yz/alanlar";
import { alanExceli, alanSablonu, tabloExceli, tabloSablonu } from "../doldur";
import type { RaporFoto } from "../server/raporlar";
import type { Baglam } from "./Bloklar";
import { alanOkuEylemi, fotoSilEylemi, okumaFotografiEkleEylemi } from "./eylemler";
import stil from "./raporlar.module.css";

const SURE_GOSTER_SN = 3;
const dosyaAdi = (s: string) => s.replace(/[^\p{L}\p{N} ._-]/gu, "").trim().slice(0, 60) || "bolum";

/** 486: fotoğraf ekleme kipi — "oku": firmada yapay zekâ açık, fotoğraf okunur · "sakla": kapalı, fotoğraf okunmadan saklanır (açılınca "Oku") ·
    "deneme": format kurucusunun örnek raporu (ne olacağı söylenir) */
export type OkumaKipi = "oku" | "sakla" | "deneme";
const DENEME = "Örnek raporda fotoğraf eklenmez; gerçek raporda fotoğraf rapora eklenir (belgede görünmez), yapay zekâ okur, değerler öneri olarak gelir.";

/** fotoğraf ekle / oku işi — tablo (FotoOkuma) ve alanlı bölüm (AlanOkuma) ortak. gonder: yeni fotoğraf (File) ya da raporun okuma fotoğrafı
    (dosya kimliği — "Oku"). "oku" kipinde eylem okur, öneri `oneri`ye; "sakla"da fotoğraf okunmadan rapora eklenir; "deneme"de söylenir. */
export function useFotoEkle<T>({ raporId, bolumId, kip, islem, elle, oku, oneri }: {
  raporId: string; bolumId: string; kip: OkumaKipi; islem: Baglam["islem"]; elle: string;
  oku: (f: FormData) => Promise<{ oneri?: T[]; bildirim?: string; genel?: string; yenile?: boolean }>;
  /** okunan öneriler (boş değil); dönen false: gösterilecek öneri yok (odak tuşa döner) */
  oneri: (l: T[]) => boolean;
}) {
  const bildir = useBildir();
  const girdi = useRef<HTMLInputElement>(null);
  const [okunuyor, setOkunuyor] = useState(false);
  const [sn, setSn] = useState(0);
  useEffect(() => {
    if (!okunuyor) return;
    const bas = Date.now();
    const zaman = setInterval(() => setSn(Math.floor((Date.now() - bas) / 1000)), 500);
    return () => { clearInterval(zaman); setSn(0); };
  }, [okunuyor]);
  const girdiyeDon = () => requestAnimationFrame(() => girdi.current?.focus());
  const gonder = (k: File | string) => {
    if (girdi.current) girdi.current.value = "";
    if (okunuyor || islem.mesgul) return;
    if (kip === "deneme") { bildir(DENEME); return; }
    if (typeof navigator !== "undefined" && navigator.onLine === false) { bildir(`Bağlantı yok: fotoğraf bağlantı gelince eklenir. ${elle}`); return; }
    const sakla = kip === "sakla" && typeof k !== "string";
    setOkunuyor(true);
    bildir(sakla ? "Fotoğraf ekleniyor…" : "Fotoğraf okunuyor…");
    islem.baslat(async () => {
      try {
        const f = new FormData();
        f.set("id", raporId); f.set("bolum", bolumId);
        if (typeof k === "string") f.set("foto", k); else f.set("dosya", await fotografiKucult(k));
        if (sakla) {
          const r = await okumaFotografiEkleEylemi(f);
          bildir(r.tamam ? r.bildirim ?? "Fotoğraf rapora eklendi (belgede görünmez)." : r.genel ?? Object.values(r.hatalar ?? {})[0] ?? "Fotoğraf eklenemedi.");
          if (r.tamam) islem.yenile();
          girdiyeDon();
          return;
        }
        const r = await oku(f);
        if (!r.oneri) { bildir(r.genel ?? `Fotoğraftan okunamadı. ${elle}`); girdiyeDon(); return; }
        bildir(r.bildirim ?? "");
        if (r.yenile) islem.yenile();
        if (!r.oneri.length || !oneri(r.oneri)) girdiyeDon();
      } catch {
        bildir(`${sakla ? "Fotoğraf eklenemedi" : "Fotoğraftan okunamadı"}: bağlantı koptu ya da sunucu yanıt vermedi. ${elle}`);
        girdiyeDon();
      } finally {
        setOkunuyor(false);
      }
    });
  };
  return { girdi, okunuyor, sn, gonder, girdiyeDon };
}

/** "Fotoğraf ekle (yapay zekâ okur)" — kamera ya da galeri; okunurken dönen simge + 3 sn sonra geçen süre (kalıp 12), odak girdide kalır */
export function FotoEkleTusu({ baslik, girdi, okunuyor, sn, kip, mesgul, gonder }: {
  baslik: string; girdi: RefObject<HTMLInputElement | null>; okunuyor: boolean; sn: number; kip: OkumaKipi; mesgul: boolean; gonder: (d: File) => void;
}) {
  const kapali = (mesgul && !okunuyor) || undefined;
  return (
    <label className={`${tusSinifi("ikincil", okunuyor ? tusStil.mesgul : undefined)} ${stil.fotoEkle}`} aria-disabled={kapali}>
      <input ref={girdi} type="file" accept="image/jpeg,image/png" className="gizli" aria-busy={okunuyor || undefined} aria-disabled={kapali}
        aria-label={`${baslik}: fotoğraf ekle (yapay zekâ okur)`} onClick={(e) => { if (okunuyor || mesgul) e.preventDefault(); }}
        onChange={(e) => { const d = e.target.files?.[0]; if (d) gonder(d); }} />
      {okunuyor ? <span className={tusStil.donen} aria-hidden="true" /> : <Ikon ad="camera" kucuk />}
      <span>{okunuyor ? (kip === "sakla" ? "Ekleniyor…" : "Okunuyor…") : "Fotoğraf ekle (yapay zekâ okur)"}</span>
      {okunuyor && sn >= SURE_GOSTER_SN && <span className={tusStil.sure}>{sn} sn</span>}
    </label>
  );
}

/** fotoğraftan doldur — bölümün alanları (ekranda satırı olanlar); yaz: okunan değeri alana yazar (Kaydet'e kadar ekranda) */
export function AlanOkuma({ v, bolumId, baslik, alanlar, yaz, islem, kip, tuslar }: {
  v: { id: string; surum: number; fotolar: RaporFoto[] }; bolumId: string; baslik: string; alanlar: readonly Pick<OkunacakAlan, "id" | "ad">[];
  yaz: (id: string, deger: string) => void; islem: Baglam["islem"]; kip: OkumaKipi; tuslar?: ReactNode;
}) {
  const bildir = useBildir();
  const kart = useRef<HTMLDivElement>(null);
  const [oneri, setOneri] = useState<AlanOkunan[] | null>(null);
  const ad = new Map(alanlar.map((a) => [a.id, a.ad]));
  /* yeni öneri gelince odak kartta — kart çizildikten sonra (385'teki ders: requestAnimationFrame bazen çizimden önce koşuyordu) */
  const kartaOdak = useRef(false);
  useEffect(() => {
    if (!kartaOdak.current || !oneri) return;
    kartaOdak.current = false;
    kart.current?.focus();
  }, [oneri]);
  const f = useFotoEkle<AlanOkunan>({ raporId: v.id, bolumId, kip, islem, elle: "Bilgileri elle girebilirsiniz.",
    oku: async (x) => { const r = await alanOkuEylemi(x); return { ...r, oneri: r.okunan }; },
    /* ekranda satırı olmayan alan öneriye girmez */
    oneri: (o) => { const l = o.filter((x) => ad.has(x.alan)); if (!l.length) return false; kartaOdak.current = true; setOneri(l); return true; } });
  const kapat = () => { setOneri(null); f.girdiyeDon(); };
  const uygula = (secilen: AlanOkunan[]) => {
    if (!oneri) return;
    for (const x of secilen) yaz(x.alan, x.deger);
    const kalan = oneri.filter((x) => !secilen.includes(x));
    bildir(`${secilen.map((x) => ad.get(x.alan)).join(", ")} rapora yazıldı; kaydetmeyi unutmayın.${kalan.length ? " Emin olunmayanları tek tek kontrol edin." : ""}`);
    if (!kalan.length) { kapat(); return; }
    setOneri(kalan);
    requestAnimationFrame(() => (kart.current?.querySelector<HTMLElement>("li button") ?? kart.current?.querySelector<HTMLElement>("button"))?.focus());
  };
  const emin = oneri ? oneri.filter((x) => x.guven !== "dusuk") : [];

  return (
    <>
      {oneri && (
        <div className={stil.oneriKart} ref={kart} tabIndex={-1} role="region" aria-label={`${baslik}: fotoğraftan okunan`}>
          <p className={stil.oneriBas}><Ikon ad="camera" kucuk />Fotoğraftan okunan</p>
          <ul className={stil.oneriListe}>
            {oneri.map((x) => (
              <li key={x.alan}>
                <span className={stil.oneriAd}>{ad.get(x.alan)}: <b>{x.deger}</b></span>
                <span className={stil.oneriSag}>
                  {x.guven === "dusuk"
                    ? <><Rozet tur="bekliyor">Emin değil</Rozet><Tus tur="ikincil" onClick={() => uygula([x])}>Uygula</Tus></>
                    : <Rozet tur="notr">Öneri</Rozet>}
                </span>
              </li>
            ))}
          </ul>
          <div className={stil.oneriTuslar}>
            <Tus tur="ikincil" onClick={() => { bildir("Okunanlar uygulanmadı."); kapat(); }}>Vazgeç</Tus>
            {emin.length > 0 && <Tus ikon="check" onClick={() => uygula(emin)}>Önerileri uygula ({emin.length})</Tus>}
          </div>
        </div>
      )}
      {!oneri && (
        <div className={stil.etiketCubuk}>
          <FotoEkleTusu baslik={baslik} girdi={f.girdi} okunuyor={f.okunuyor} sn={f.sn} kip={kip} mesgul={islem.mesgul} gonder={f.gonder} />
          {tuslar}
        </div>
      )}
      {kip === "sakla" && <OkumaNotu />}
      <OkumaFotolari v={v} bolumId={bolumId} oku={false} islem={islem} okut={kip === "oku" && !oneri ? f.gonder : undefined} />
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

/** okunan bölümün okuma fotoğrafları (belgede görünmez). okut (486): firmada yapay zekâ açıkken fotoğrafın "Oku"su — saklanan fotoğraf okunur */
export function OkumaFotolari({ v, bolumId, oku, islem, okut }: {
  v: { id: string; surum: number; fotolar: RaporFoto[] }; bolumId: string; oku: boolean; islem: Baglam["islem"]; okut?: (dosya: string) => void;
}) {
  const bildir = useBildir();
  const onayla = useOnayla();
  const l = v.fotolar.filter((f) => f.okuma && f.bolum === bolumId);
  if (!l.length) return null;
  const sil = async (f: RaporFoto) => {
    if (!(await onayla({ baslik: "Okuma fotoğrafını sil", metin: `${f.ad} rapordan çıkarılır (okunan değerler kalır).`, tus: "Sil", tehlike: true }))) return;
    islem.baslat(async () => {
      const r = await fotoSilEylemi(v.id, v.surum, f.dosya);
      bildir(r.tamam ? r.bildirim ?? "Fotoğraf silindi." : r.genel ?? "Fotoğraf silinemedi.");
      if (r.tamam) islem.yenile();
    });
  };
  return (
    <div className={stil.okumaFoto}>
      <p className={stil.ipucuMetin}><Ikon ad="camera" kucuk /> Okunan fotoğraf{l.length > 1 ? `lar (${l.length})` : ""} · raporda durur, belgede görünmez</p>
      <ul className={stil.fotoListe}>
        {l.map((f) => (
          <li key={f.dosya}>
            <span className={stil.fotoAd}>{f.ad}</span>
            <span className={stil.fotoTuslar}>
              <DosyaAcTusu dosyaId={f.dosya}>Görüntüle</DosyaAcTusu>
              {!oku && okut && <Tus tur="ikincil" ikon="sparkles" disabled={islem.mesgul} aria-label={`${f.ad} oku (yapay zekâ)`} onClick={() => okut(f.dosya)}>Oku</Tus>}
              {!oku && <Tus tur="ikincil" ikon="trash-2" disabled={islem.mesgul} aria-label={`${f.ad} sil`} onClick={() => void sil(f)}>Sil</Tus>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 486: firmada yapay zekâ kapalı — fotoğraf saklanır, okunmaz; nereden açılacağı */
export function OkumaNotu() {
  return (
    <p className={stil.ipucuMetin}><Ikon ad="info" kucuk /> Firmada yapay zekâ kapalı: fotoğraf rapora eklenir (belgede görünmez), şimdi okunmaz; açılınca
      fotoğrafın yanındaki “Oku” ile okunur (Firma ayarları › Yapay zekâ — açık ve API anahtarı girilmiş olmalı).</p>
  );
}

/** alanlı bölümün (ekipman bilgileri, bilgi, test) doldurma çubuğu: formatın ayarına göre fotoğraftan doldur ve Excel; okuma fotoğrafları */
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
        ? <AlanOkuma v={bag.v} bolumId={bolumId} baslik={baslik} alanlar={alanlar} yaz={yaz} islem={bag.islem} kip={bag.okumaKipi} tuslar={excel} />
        : <>{excel && <div className={stil.etiketCubuk}>{excel}</div>}<OkumaFotolari v={bag.v} bolumId={bolumId} oku={bag.oku} islem={bag.islem} /></>}
    </div>
  );
}
