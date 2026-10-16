"use client";
/* TOPLU İMZA ve TOPLU ONAY (596; reisim 2026-10-16 kararları: yalnız raporlar · tek ZIP · imzalı PDF içeriğinden eşleşir · toplu onay seçilen
   hepsi — "Uygun değil" olanlar da, önce sorulur · bir seferde en çok 50 · araç e-İmzaTR). Seçim istemcide; her rapor sunucuda KENDİ işlemiyle
   (imzaHazirlaEylemi, imzaliEslestirYukleEylemi, onaylaEylemi) — yetki, durum ve imza denetimi her biri için yeniden; biri düşerse yalnız o.
   İmza penceresi: 1) seçilenlerin imzasız PDF'leri sunucuda hazırlanır (hazırlanan kalır — listede "İmzaya hazır"), 2) tek ZIP (adlar rapor no),
   3) e-imza aracında birlikte imzalanır, 4) imzalı PDF'ler ya da ZIP bırakılır: hangi rapora ait olduğu sunucuda içerikten bulunur (dosya adı
   değişse de), 5) sonuç listesi. */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useUyar } from "../../../components/bildirim/Bildirim";
import { TabloHatasi, zipAc } from "../../../components/disa/oku";
import { baytIndir, dosyaGunu } from "../../../components/disa/indir";
import { dosyaBaytlari } from "../../../components/gizli-resim/GizliResim";
import { zipParcalari } from "../../../components/disa/zip";
import { Ikon } from "../../../components/ikon/Ikon";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import { imzaHazirlaEylemi, imzaliEslestirYukleEylemi } from "../../raporlar/ui/eylemler";
import type { OnaySatiri } from "../server/onaylar";
import stil from "./onaylar.module.css";

/** bir seferde en çok (karar K5); sunucudaki TOPLU_IMZA_EN_COK ile aynı */
export const TOPLU_EN_COK = 50;
const PDF_EN_BUYUK = 25 << 20, TOPLAM_EN_BUYUK = 300 << 20;
const AG = "Bağlantı ya da sunucu hatası; yeniden deneyin.";

/* ── SEÇİM ── */
export interface Secim { secili: readonly string[]; degistir: (id: string, ac: boolean) => void; hepsi: (idler: readonly string[]) => void; temizle: () => void }
export function useSecim(): Secim {
  const [secili, setSecili] = useState<readonly string[]>([]);
  const uyar = useUyar();
  return {
    secili,
    degistir: (id, ac) => {
      if (!ac) { setSecili(secili.filter((x) => x !== id)); return; }
      if (secili.includes(id)) return;
      if (secili.length >= TOPLU_EN_COK) { uyar(`Bir seferde en çok ${TOPLU_EN_COK} rapor seçilir.`); return; }
      setSecili([...secili, id]);
    },
    hepsi: (idler) => {
      if (idler.length > TOPLU_EN_COK) uyar(`Bir seferde en çok ${TOPLU_EN_COK} rapor; ilk ${TOPLU_EN_COK} rapor seçildi.`);
      setSecili(idler.slice(0, TOPLU_EN_COK));
    },
    temizle: () => setSecili([]),
  };
}
/** satırın seçim kutusu (dokunma hedefi denetim yüksekliği; satıra girmez — Liste etikete basılınca kayda gitmez) */
export function SecimKutusu({ s, id, ad }: { s: Secim; id: string; ad: string }) {
  return (
    <label className={stil.secKutu}>
      <input type="checkbox" checked={s.secili.includes(id)} aria-label={`${ad} seç`} onChange={(e) => s.degistir(id, e.target.checked)} />
    </label>
  );
}
/** altta havada duran seçim çubuğu (rapor ekranının tuşları gibi — data-alt-cubuk: S.A.Y düğmesi üstüne çıkar) */
export function SecimCubugu({ sayi, temizle, children }: { sayi: number; temizle: () => void; children: ReactNode }) {
  if (!sayi) return null;
  return (
    <div className={stil.cubukKap} data-alt-cubuk="her">
      <div className={stil.cubuk} role="region" aria-label="Seçilen raporlar">
        <span className={stil.cubukSayi}><b>{sayi}</b> rapor seçili</span>
        <Tus tur="ikincil" onClick={temizle}>Seçimi kaldır</Tus>
        {children}
      </div>
    </div>
  );
}

/* ── İMZA PENCERESİ ── */
interface Hazir { id: string; no: string; dosya: string }
interface Sonuc { no: string | null; dosya: string; tamam: boolean; metin: string }
const pdfMi = (b: Uint8Array) => b.length > 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d;   // %PDF-
const zipMi = (b: Uint8Array) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;

/** raporlar: imzaya hazırlanacaklar (boşsa yalnız yükleme — daha önce hazırlanmış PDF'lerin imzalı hâlleri). onKapat(degisti): bir şey
    hazırlandı ya da imzalandıysa liste yenilenir. */
export function TopluImzaPenceresi({ raporlar, onKapat }: { raporlar: readonly OnaySatiri[]; onKapat: (degisti: boolean) => void }) {
  const [hazir, setHazir] = useState<Hazir[]>([]);
  const [hazirHata, setHazirHata] = useState<{ no: string; neden: string }[]>([]);
  const [hazirlaniyor, setHazirlaniyor] = useState(raporlar.length > 0);
  const [indiriliyor, setIndiriliyor] = useState(false);
  const [indirildi, setIndirildi] = useState(false);
  const [yukleme, setYukleme] = useState<{ biten: number; toplam: number } | null>(null);
  const [sonuclar, setSonuclar] = useState<Sonuc[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [ustunde, setUstunde] = useState(false);
  const girdi = useRef<HTMLInputElement>(null);
  const kapandi = useRef(false), basladi = useRef(false), degisti = useRef(false);
  const durumId = useId(), hataId = useId(), girdiId = useId();

  /* 1) hazırla: sırayla, her rapor kendi isteğiyle (Chromium PDF'i sunucuda); pencere kapanınca durur — hazırlanan kalır */
  useEffect(() => {
    if (basladi.current || !raporlar.length) return;
    basladi.current = true;
    void (async () => {
      const l: Hazir[] = [], h: { no: string; neden: string }[] = [];
      for (const r of raporlar) {
        if (kapandi.current) return;
        try {
          const y = await imzaHazirlaEylemi(r.id);
          if (y.tamam && y.dosya) { l.push({ id: r.id, no: r.no, dosya: y.dosya }); degisti.current = true; } else h.push({ no: r.no, neden: y.genel ?? "İmzasız PDF hazırlanamadı." });
        } catch { h.push({ no: r.no, neden: AG }); }
        if (kapandi.current) return;
        setHazir([...l]); setHazirHata([...h]);
      }
      setHazirlaniyor(false);
    })();
  }, [raporlar]);

  const kapat = () => {
    if (yukleme) return;   // yükleme sürerken kapanmaz (yarıda kalan dosya sonuçsuz kalmasın)
    kapandi.current = true;
    onKapat(degisti.current);
  };

  /* 2) tek ZIP: hazırlanan PDF'ler oturumlu tek dosya ucundan (GizliResim dosyaBaytlari — yetki uçta yeniden), adları rapor no */
  const indir = async () => {
    setIndiriliyor(true); setHata(null);
    try {
      const dosyalar: [string, Uint8Array][] = [];
      for (const p of hazir) dosyalar.push([`${p.no}.pdf`, await dosyaBaytlari(p.dosya)]);
      baytIndir(`imzalanacak-raporlar-${dosyaGunu()}.zip`, zipParcalari(dosyalar), "application/zip");
      setIndirildi(true);
    } catch { setHata("PDF'ler indirilemedi; yeniden deneyin."); } finally { setIndiriliyor(false); }
  };

  /* 4) yükle: PDF'ler ve ZIP'ler açılır; her PDF ayrı istekle — eşleştirme ve denetim sunucuda */
  const yukle = async (liste: readonly File[]) => {
    if (!liste.length || yukleme) return;
    setHata(null);
    const pdfler: { ad: string; bayt: Uint8Array }[] = [], atlanan: Sonuc[] = [];
    let toplam = 0;
    const ekle = (ad: string, bayt: Uint8Array) => {
      if (!pdfMi(bayt)) { atlanan.push({ no: null, dosya: ad, tamam: false, metin: "PDF değil." }); return; }
      if (bayt.length > PDF_EN_BUYUK) { atlanan.push({ no: null, dosya: ad, tamam: false, metin: "PDF çok büyük (en çok 25 MB)." }); return; }
      if (toplam + bayt.length > TOPLAM_EN_BUYUK) { atlanan.push({ no: null, dosya: ad, tamam: false, metin: "Toplam 300 MB aşıldı; bu dosyayı ikinci turda yükleyin." }); return; }
      if (pdfler.length >= TOPLU_EN_COK) { atlanan.push({ no: null, dosya: ad, tamam: false, metin: `Bir seferde en çok ${TOPLU_EN_COK} PDF; bunu ikinci turda yükleyin.` }); return; }
      toplam += bayt.length;
      pdfler.push({ ad, bayt });
    };
    for (const f of liste) {
      if (f.size > TOPLAM_EN_BUYUK) { atlanan.push({ no: null, dosya: f.name, tamam: false, metin: "Dosya çok büyük." }); continue; }
      const b = new Uint8Array(await f.arrayBuffer());
      if (zipMi(b)) {
        try { for (const x of await zipAc(b, TOPLAM_EN_BUYUK, TOPLU_EN_COK * 2)) ekle(x.ad, x.bayt); }
        catch (e) { atlanan.push({ no: null, dosya: f.name, tamam: false, metin: e instanceof TabloHatasi ? e.message : "ZIP dosyası okunamadı." }); }
      } else ekle(f.name, b);
    }
    if (girdi.current) girdi.current.value = "";
    const l: Sonuc[] = [];
    setYukleme({ biten: 0, toplam: pdfler.length });
    for (const [i, p] of pdfler.entries()) {
      const f = new FormData();
      f.set("dosya", new File([p.bayt as BlobPart], p.ad, { type: "application/pdf" }));
      try {
        const y = await imzaliEslestirYukleEylemi(f);
        if (y.tamam) degisti.current = true;
        l.push({ no: y.no ?? null, dosya: p.ad, tamam: !!y.tamam, metin: y.tamam ? "İmzalandı · müşteriye açıldı" : y.hatalar?.dosya ?? y.genel ?? "Yüklenemedi." });
      } catch { l.push({ no: null, dosya: p.ad, tamam: false, metin: AG }); }
      setYukleme({ biten: i + 1, toplam: pdfler.length });
    }
    setYukleme(null);
    setSonuclar([...l, ...atlanan]);
  };

  const yukleniyor = !!yukleme;
  const bekle = hazirlaniyor || indiriliyor || yukleniyor;
  const n = raporlar.length;

  if (sonuclar) {
    const tamam = sonuclar.filter((x) => x.tamam).length, red = sonuclar.length - tamam;
    return (
      <Pencere acik genis baslik={`${tamam} rapor imzalandı${red ? ` · ${red} dosya reddedildi` : ""}`} onKapat={kapat}
        alt={<>
          <Tus tur="ikincil" onClick={() => setSonuclar(null)}>Başka PDF yükle</Tus>
          <Tus onClick={kapat} data-ilk-odak="">Tamam</Tus>
        </>}>
        <ul className={stil.sonucListe} aria-label="Yükleme sonuçları">
          {sonuclar.map((x, i) => (
            <li key={i}>
              <span className={stil.sonucBas}>
                <span className={stil.sonucNo}>{x.no ?? "Eşleşmedi"}</span>
                <Rozet tur={x.tamam ? "tamam" : "red"}>{x.tamam ? "İmzalandı" : "Reddedildi"}</Rozet>
              </span>
              <span className={stil.sonucDosya}>{x.dosya}</span>
              <span className={x.tamam ? stil.sonucMetin : stil.hata}>{x.metin}</span>
            </li>
          ))}
        </ul>
        {red > 0 && <p className={pencereMetinSinifi}>Reddedilen raporlar listede kalır; imzalı hâllerini yeniden yükleyebilirsiniz.</p>}
      </Pencere>
    );
  }

  const adim = (no: number, durum: "tamam" | "simdi" | "sira", baslik: string, govde: ReactNode) => (
    <li className={stil.topluAdim}>
      <span className={stil.adimIsaret} data-durum={durum} aria-hidden="true">{durum === "tamam" ? <Ikon ad="check" kucuk /> : no}</span>
      <div><p className={stil.adimBaslik}>{baslik}</p>{govde}</div>
    </li>
  );
  const dosyaGirdisi = (
    <input ref={girdi} id={girdiId} type="file" multiple accept="application/pdf,.pdf,application/zip,.zip" className="gizli" disabled={bekle}
      aria-label="İmzalı PDF'leri ya da ZIP'i yükle" aria-describedby={hata ? hataId : undefined}
      onChange={(e) => { const l = [...(e.target.files ?? [])]; void yukle(l); }} />
  );

  return (
    <Pencere acik genis baslik={n ? `${n} raporu imzala` : "İmzalı PDF'leri yükle"} onKapat={kapat}
      alt={<>
        <Tus tur="ikincil" disabled={yukleniyor} onClick={kapat} data-ilk-odak="">Sonra devam et</Tus>
        <label className={`${tusSinifi("birincil")} ${stil.dosyaSec}`} aria-disabled={bekle || undefined}>
          {dosyaGirdisi}
          İmzalı PDF&apos;leri yükle
        </label>
      </>}>
      <ol className={stil.topluAdimlar}>
        {n > 0 && adim(1, hazirlaniyor ? "simdi" : "tamam", hazirlaniyor ? "İmzasız PDF'ler hazırlanıyor" : "İmzasız PDF'ler hazır", <>
          <p className={stil.adimMetin} id={durumId} role="status">{hazir.length + hazirHata.length} / {n} işlendi · {hazir.length} hazır</p>
          {hazirHata.map((x) => <p key={x.no} className={stil.hata}>{x.no}: {x.neden}</p>)}
        </>)}
        {n > 0 && adim(2, indirildi ? "tamam" : hazirlaniyor ? "sira" : "simdi", "İndirin", <div className={stil.indir}>
          <Tus tur="ikincil" ikon="download" disabled={bekle || !hazir.length} onClick={() => void indir()}>
            {indiriliyor ? "İndiriliyor…" : `ZIP indir (${hazir.length} PDF)`}
          </Tus>
          {indirildi && <span className={stil.adimMetin}>İndirildi.</span>}
        </div>)}
        {adim(n ? 3 : 1, "sira", "e-İmzaTR'de birlikte imzalayın", <p className={stil.adimMetin}>
          ZIP&apos;i açın, PDF&apos;lerin hepsini birlikte seçip imzalayın; kart takılıyken PIN bir kez sorulur. İmza türü PDF imzası (PAdES) olmalı —
          imzalı dosya yine .pdf olur; ayrı .imz dosyası kabul edilmez. Dosya adlarını değiştirmeniz sorun değil.
        </p>)}
        {adim(n ? 4 : 2, yukleniyor ? "simdi" : "sira", "İmzalı PDF'leri yükleyin", <>
          <label className={stil.birak} htmlFor={girdiId} data-ustunde={ustunde || undefined} aria-disabled={bekle || undefined}
            onDragOver={(e) => { e.preventDefault(); setUstunde(true); }} onDragLeave={() => setUstunde(false)}
            onDrop={(e) => { e.preventDefault(); setUstunde(false); if (!bekle) void yukle([...e.dataTransfer.files]); }}>
            {yukleme ? <span role="status">{yukleme.biten} / {yukleme.toplam} PDF yüklendi…</span>
              : <span>PDF&apos;leri ya da ZIP&apos;i buraya bırakın · ya da dosya seçin (en çok {TOPLU_EN_COK} PDF)</span>}
          </label>
          <p className={stil.adimMetin}>Her PDF ayrı denetlenir: imzaya hazırlanan PDF&apos;in kendisiyle başlamalı ve imza taşımalı. Geçenler hemen tamamlanır ve
            müşteriye açılır.</p>
        </>)}
      </ol>
      {hata && <p className={stil.hata} id={hataId} role="alert">{hata}</p>}
      {n > 0 && <p className={pencereMetinSinifi}>Pencereyi kapatırsanız hazırlananlar kalır; listede “İmzaya hazır” olarak görünür, yükleme sonra yapılır.</p>}
    </Pencere>
  );
}
