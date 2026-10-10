"use client";
/* SAHA RAPORU · FOTOĞRAFTAN / EXCEL'DEN DOLDURMA (484; reisim 2026-10-10: "test tablosu olarak kullanılan yerlere excelden yükle ve fotoğraf ekleme
   özelliği olsun fotoğraf eklenince belgede gözükmeyecek yapay zeka buradan okuma yapıp tabloyu dolduracak, aynı şekilde ekipman bilgilerinde de
   olsun bunu istediğim başlığa da ekleyebiliyim"). Formatta (kâğıtta bölüm ayarı — tanim.ts doldurma) açık bölümde:
   · AlanOkuma — "Fotoğraftan doldur" (385'in "Etiketten oku"sunun genel hâli): ekipman bilgileri, bilgi bölümü, test değerleri; okunanlar ÖNERİ
     kartında (emin olunanlar toplu, "Emin değil" tek tek), yazılanlar rapora ancak Kaydet ile geçer; fotoğraf rapora okuma fotoğrafı olarak eklenir
     (belgede görünmez). Ölçüm tablosunda aynı iş FotoOkuma.tsx'te (satır satır).
   · ExcelYukle — "Excel'den yükle" (.xlsx / .csv, tarayıcıda okunur; components/disa/oku.ts) + "Excel şablonu": tablo başlık satırıyla, alanlar
     "Alan | Değer" satırlarıyla eşlenir (doldur.ts); değer türüne uymuyorsa yazılmaz, eşleşmeyen sütun / alan söylenir.
   · OkumaFotolari — okunan bölümün okuma fotoğrafları: Görüntüle · Sil (raporda kanıt; belgede yok).
   · YzKapali — fotoğraftan doldurma açık ama firmada yapay zekâ kapalıysa nedenini ve yerini söyler (tuş çizilmez — anayasa 7.4).
   Örnek raporda (format kurucusunun saha ekranı) fotoğraf okunmaz, ne olacağı söylenir; Excel çalışır (yalnız ekranda). */
import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { alanOkuEylemi, fotoSilEylemi } from "./eylemler";
import stil from "./raporlar.module.css";

const SURE_GOSTER_SN = 3;
const dosyaAdi = (s: string) => s.replace(/[^\p{L}\p{N} ._-]/gu, "").trim().slice(0, 60) || "bolum";

/** fotoğraftan doldur — bölümün alanları (ekranda satırı olanlar); yaz: okunan değeri alana yazar (Kaydet'e kadar ekranda) */
export function AlanOkuma({ raporId, bolumId, baslik, alanlar, yaz, islem, deneme, tuslar }: {
  raporId: string; bolumId: string; baslik: string; alanlar: readonly Pick<OkunacakAlan, "id" | "ad">[]; yaz: (id: string, deger: string) => void;
  islem: Baglam["islem"]; deneme: boolean; tuslar?: ReactNode;
}) {
  const bildir = useBildir();
  const girdi = useRef<HTMLInputElement>(null);
  const kart = useRef<HTMLDivElement>(null);
  const [okunuyor, setOkunuyor] = useState(false);
  const [sn, setSn] = useState(0);
  const [oneri, setOneri] = useState<AlanOkunan[] | null>(null);
  const ad = new Map(alanlar.map((a) => [a.id, a.ad]));
  /* yeni öneri gelince odak kartta — kart çizildikten sonra (385'teki ders: requestAnimationFrame bazen çizimden önce koşuyordu) */
  const kartaOdak = useRef(false);
  useEffect(() => {
    if (!kartaOdak.current || !oneri) return;
    kartaOdak.current = false;
    kart.current?.focus();
  }, [oneri]);
  useEffect(() => {
    if (!okunuyor) return;
    const bas = Date.now();
    const zaman = setInterval(() => setSn(Math.floor((Date.now() - bas) / 1000)), 500);
    return () => { clearInterval(zaman); setSn(0); };
  }, [okunuyor]);

  const girdiyeDon = () => requestAnimationFrame(() => girdi.current?.focus());
  const oku = (dosya: File) => {
    if (girdi.current) girdi.current.value = "";
    if (okunuyor || islem.mesgul) return;
    if (deneme) { bildir("Örnek raporda fotoğraf okunmaz; gerçek raporda yapay zekâ okur, değerler öneri olarak gelir, fotoğraf belgede görünmez."); return; }
    if (typeof navigator !== "undefined" && navigator.onLine === false) { bildir("Bağlantı yok: fotoğraftan okuma bağlantı gelince yapılır. Bilgileri elle girebilirsiniz."); return; }
    setOkunuyor(true);
    bildir("Fotoğraf okunuyor…");
    islem.baslat(async () => {
      try {
        const f = new FormData();
        f.set("id", raporId); f.set("bolum", bolumId); f.set("dosya", await fotografiKucult(dosya));
        const r = await alanOkuEylemi(f);
        if (!r.okunan) { bildir(r.genel ?? "Fotoğraftan okunamadı. Bilgileri elle girebilirsiniz."); girdiyeDon(); return; }
        bildir(r.bildirim ?? "");
        if (r.yenile) islem.yenile();
        /* ekranda satırı olmayan alan öneriye girmez */
        const l = r.okunan.filter((x) => ad.has(x.alan));
        if (l.length) { kartaOdak.current = true; setOneri(l); } else girdiyeDon();
      } catch {
        bildir("Fotoğraftan okunamadı: bağlantı koptu ya da sunucu yanıt vermedi. Bilgileri elle girebilirsiniz.");
        girdiyeDon();
      } finally {
        setOkunuyor(false);
      }
    });
  };
  const kapat = () => { setOneri(null); girdiyeDon(); };
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
          <label className={`${tusSinifi("ikincil", okunuyor ? tusStil.mesgul : undefined)} ${stil.fotoEkle}`} aria-disabled={(islem.mesgul && !okunuyor) || undefined}>
            <input ref={girdi} type="file" accept="image/jpeg,image/png" className="gizli" aria-busy={okunuyor || undefined} aria-disabled={(islem.mesgul && !okunuyor) || undefined}
              aria-label={`${baslik}: fotoğraftan doldur`} onClick={(e) => { if (okunuyor || islem.mesgul) e.preventDefault(); }}
              onChange={(e) => { const d = e.target.files?.[0]; if (d) oku(d); }} />
            {okunuyor ? <span className={tusStil.donen} aria-hidden="true" /> : <Ikon ad="camera" kucuk />}
            <span>{okunuyor ? "Okunuyor…" : "Fotoğraftan doldur"}</span>
            {okunuyor && sn >= SURE_GOSTER_SN && <span className={tusStil.sure}>{sn} sn</span>}
          </label>
          {tuslar}
        </div>
      )}
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

/** okunan bölümün okuma fotoğrafları (belgede görünmez) */
export function OkumaFotolari({ v, bolumId, oku, islem }: { v: { id: string; surum: number; fotolar: RaporFoto[] }; bolumId: string; oku: boolean; islem: Baglam["islem"] }) {
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
              {!oku && <Tus tur="ikincil" ikon="trash-2" disabled={islem.mesgul} aria-label={`${f.ad} sil`} onClick={() => void sil(f)}>Sil</Tus>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** fotoğraftan doldurma formatta açık ama firmada yapay zekâ kapalı — tuş yok, nedeni ve yeri */
export function YzKapali() {
  return <p className={stil.ipucuMetin}><Ikon ad="info" kucuk /> Fotoğraftan doldurma için firmada yapay zekâ açık ve API anahtarı girilmiş olmalı (Firma ayarları › Yapay zekâ).</p>;
}

/** alanlı bölümün (ekipman bilgileri, bilgi, test) doldurma çubuğu: formatın ayarına göre fotoğraftan doldur ve Excel; okuma fotoğrafları */
export function AlanDoldurma({ bag, bolumId, baslik, alanlar, ayar, yaz, dolu }: {
  bag: Baglam; bolumId: string; baslik: string; alanlar: readonly OkunacakAlan[]; ayar: { foto: boolean; excel: boolean };
  yaz: (id: string, deger: string) => void; dolu: (id: string) => boolean;
}) {
  if (!alanlar.length || (!ayar.foto && !ayar.excel)) return null;
  const fotoOlur = ayar.foto && (bag.yz || bag.deneme);
  const excel = ayar.excel && !bag.oku
    ? <ExcelYukle tur="alan" baslik={baslik} alanlar={alanlar} yaz={yaz} dolu={dolu} mesgul={bag.islem.mesgul} /> : null;
  return (
    <div className={stil.doldurma}>
      {!bag.oku && (fotoOlur
        ? <AlanOkuma raporId={bag.v.id} bolumId={bolumId} baslik={baslik} alanlar={alanlar} yaz={yaz} islem={bag.islem} deneme={bag.deneme} tuslar={excel} />
        : excel && <div className={stil.etiketCubuk}>{excel}</div>)}
      {!bag.oku && ayar.foto && !fotoOlur && <YzKapali />}
      <OkumaFotolari v={bag.v} bolumId={bolumId} oku={bag.oku} islem={bag.islem} />
    </div>
  );
}
