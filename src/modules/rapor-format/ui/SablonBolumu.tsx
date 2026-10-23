"use client";
/* TÜR SAYFASI › RAPOR ŞABLONU (RAPOR-FORMAT.md §4–5; maket ekipman-turleri.html Format kurucu: "Taslak · vN" / "Yayında · vN", Yayınla onaylı,
   yayın öncesi denetim). Sürüm tablosu (taslak üstte, sonra yeniden eskiye) · Şablondan başlat penceresi (hazır şablon ya da yayınlanmış sürüm;
   varsa taslağın yerine geçer) · 437 Sıfırdan oluştur (boş iskelet; onaylı, taslak varsa yerine geçer) · 439 yayındaki sürümde Düzenle (o sürümden
   taslak → Format kurucu; açık taslak varsa "Taslağa devam et" ya da yeniden başla) · Yayınla penceresi (engeller + uyarılar sunucudan, sürüm notu). Tuşlar yalnız "değiştirir" düzeyine çizilir;
   karar ve denetim yine sunucuda. Taslak Format kurucuda düzenlenir (…/sablon/<sürüm>/kurucu, K4).
   2026-10-12 (reisim: "ekipman türlerinde eski sürüme geri dön tuşu olsun"): eski sürümde "Bu sürüme geri dön" — içeriği yeni sürüm olarak yayınlanır.
   2026-10-12 (reisim: "eski sürümleri silmekte olsun", "silme tuşuda ekle"): hiç kullanılmamış eski sürümde Sil (yalnız yönetici; göç 0081). */
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Kosullar } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { KartEtiket, Liste, type Sutun } from "../../../components/liste/Liste";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { AltSatir, Rozet } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { useOnayla } from "../../../components/pencere/Onay";
import { Serit } from "../../../components/serit/Serit";
import { SilTusu } from "../../../components/sil/SilTusu";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import type { FormatOzeti } from "../server/formatlar";
import { basilidanKurEylemi, surumeGeriDonEylemi, surumSilEylemi, taslakBaslatEylemi, yayinDenetleEylemi, yayinlaEylemi } from "./eylemler";
import { DURUM_ROZET, surumAdi, tarihYaz } from "./ortak";
import stil from "./format.module.css";

const BASLA_ID = "sb-baslangic", NOT_ID = "sb-not", GERI_NOT_ID = "sb-geri-not";

/** `silinebilir` (370 taslak; 2026-10-12 eski sürüm — "eski sürümleri silmekte olsun"): kesin silinebilen sürümler — yönetici ve hiç kullanılmamış
    (sunucuda formatlar.ts silinebilirSurumler; yayındaki, rapor açılmış ya da imzalı rapor sürümü olan sürüm yok). 471: `raporlar` — sürüm başına bu
    sürümle yazılan rapor sayısı.
    `tumu` (2026-10-12): tablo bir kısmı gösteriyorsa (sürüm sayfasının "Öteki sürümler"i) türün bütün sürümleri — açık taslak ve yayındaki ondan
    bulunur (geri dönüş görmediği taslak yüzünden "çakışma" demesin) */
export function SablonTablosu({ turId, surumler, yaz, silinebilir = [], raporlar, tumu }:
  { turId: string; surumler: FormatOzeti[]; yaz: boolean; silinebilir?: readonly string[]; raporlar?: Record<string, number>; tumu?: FormatOzeti[] }) {
  const taslak = (tumu ?? surumler).find((x) => x.durum === "taslak") ?? null;
  const yayinda = (tumu ?? surumler).find((x) => x.durum === "yayinda") ?? null;
  /* 2026-10-12 (reisim: "tuşlar yan yana olabilecekken altlı üstlü ? boşuna sayfa uzuyor"): İşlem sütunu %18'de "Önizle" ile "Bu sürüme geri dön"
     alt alta düşüyordu (Durum ve Kişi sütunları boştu) — genişlik İşlem'e: satırın tuşları (Önizle · Geri dön / Düzenle · Yayınla · Sil) tek satırda */
  const sutunlar: Sutun<FormatOzeti>[] = [
    { k: "surum", genislik: "22%", baslik: "Sürüm", kart: "ust", sira: 1, hucre: (x) => <><b>{surumAdi(x)}</b><AltSatir>{x.kaynakAd ?? "Firma formatı"} · {x.bolum} bölüm{raporlar ? ` · ${raporlar[x.id] ?? 0} rapor` : ""}</AltSatir></> },
    { k: "tarih", genislik: "18%", baslik: "Tarih", kart: "govde", sira: 2, hucre: (x) => <>
      <KartEtiket>{x.yayin ? "Yayınlandı" : "Son değişiklik"}</KartEtiket>{tarihYaz(x.yayin ?? x.degisti)}{x.notu && <AltSatir>{x.notu}</AltSatir>}</> },
    { k: "kisi", genislik: "16%", baslik: "Kişi", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>{x.yayinlayan ? "Yayınlayan" : "Hazırlayan"}</KartEtiket>{x.yayinlayan ?? x.olusturan}</> },
    { k: "durum", genislik: "10%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => <Rozet tur={DURUM_ROZET[x.durum][0]}>{DURUM_ROZET[x.durum][1]}</Rozet> },
    { k: "eylem", genislik: "34%", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: (x) => (
      <span className={stil.tuslar}>
        <TusBaglanti ikon="eye" href={`/ekipman-turleri/${turId}/sablon/${x.id}`}>Önizle</TusBaglanti>
        {yaz && x.durum === "taslak" && <TusBaglanti ikon="pencil" href={`/ekipman-turleri/${turId}/sablon/${x.id}/kurucu`}>Düzenle</TusBaglanti>}
        {yaz && x.durum === "yayinda" && <SurumDuzenleTusu turId={turId} surum={x} taslak={taslak} />}
        {yaz && x.durum === "taslak" && <YayinlaTusu format={x} />}
        {yaz && x.durum === "eski" && <GeriDonTusu turId={turId} surum={x} taslak={taslak} yayinda={yayinda} />}
        {silinebilir.includes(x.id) && x.durum === "taslak" && <SilTusu kucuk ikon="trash-2" ad="Taslak" erisimAdi="Taslağı sil" baslik="Rapor formatı taslağını sil"
          yanEtki="yayınlanmış sürümler etkilenmez" sil={() => surumSilEylemi(x.id)} odak="#b-sablon" />}
        {silinebilir.includes(x.id) && x.durum === "eski" && <SurumSilTusu id={x.id} ad={surumAdi(x)} kucuk />}
      </span>
    ) },
  ];
  return <Liste baslik="Rapor şablonu sürümleri" sutunlar={sutunlar} kayitlar={surumler} anahtar={(x) => x.id} />;
}

/** 2026-10-12 (reisim: "eski sürümleri silmekte olsun", "silme tuşuda ekle"): hiç kullanılmamış ESKİ sürümün kesin silinmesi — çağıran yalnız
    silinebilene çizer (silinebilirSurumler); karar yine sunucuda. `kucuk`: tablo satırında simge; değilse sürüm sayfasının başlığında, sonra türe döner. */
export function SurumSilTusu({ id, ad, kucuk = false, donus }: { id: string; ad: string; kucuk?: boolean; donus?: string }) {
  return <SilTusu kucuk={kucuk} ikon="trash-2" ad={ad} erisimAdi={kucuk ? `${ad} · Sil` : undefined} baslik="Rapor şablonu sürümünü sil"
    yanEtki="bu sürümle rapor yazılmadı; öteki sürümler ve raporlar etkilenmez" sil={() => surumSilEylemi(id)} donus={donus} odak={kucuk ? "#b-sablon" : undefined} />;
}

/** şablondan başlat: hazır şablon ya da yayınlanmış sürüm; taslak varsa onun yerine geçer (onun sürümüyle — görmediği taslağı ezmez) */
export function SablonBaslatTusu({ turId, turAd, taslak, surumler, sablonlar }:
  { turId: string; turAd: string; taslak: { surum: number; degisti: string } | null; surumler: FormatOzeti[]; sablonlar: readonly (readonly [string, string])[] }) {
  const router = useRouter();
  const bildir = useBildir();
  const [acik, setAcik] = useState(false);
  const [bekliyor, baslat] = useTransition();
  const [secim, setSecim] = useState("");
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const secenekler = [
    ["bos", "Boş format (sıfırdan)", "Sıfırdan"] as const,
    ...sablonlar.map(([k, ad]) => [`sablon:${k}`, ad, "Hazır şablon"] as const),
    ...surumler.filter((x) => x.durum !== "taslak").map((x) => [`surum:${x.id}`, `${surumAdi(x)} · ${x.durum === "yayinda" ? "yayında" : "eski"}`, x.kaynakAd ?? "Firma formatı"] as const),
  ];
  const tamam = () => baslat(async () => {
    const r = await taslakBaslatEylemi(turId, taslak?.surum ?? null, secim);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) return;
    setAcik(false); bildir("Taslak hazırlandı; Format kurucuda düzenleyin."); router.push(`/ekipman-turleri/${turId}/sablon/${r.id}/kurucu`);
  });
  return (
    <>
      <Tus tur="ikincil" ikon="layout-list" onClick={() => { setSecim(""); setH({}); setGenel(null); setAcik(true); }}>Şablondan başlat</Tus>
      {acik && <Pencere acik baslik="Şablondan başlat" onKapat={() => setAcik(false)} odak={`#${BASLA_ID}`}
        alt={<><Tus tur="ikincil" onClick={() => setAcik(false)}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={tamam}>Başlat</Tus></>}>
        <p className={pencereMetinSinifi}><b>{turAd}</b></p>
        {taslak && <Serit tur="uyari" ikon="triangle-alert">Taslak ({tarihYaz(taslak.degisti)}) bu başlangıçla değiştirilir.</Serit>}
        {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
        <FormIzgara>
          <Alan id={BASLA_ID} etiket="Başlangıç" zorunlu genis hata={h.baslangic}>
            <SecimAlani id={BASLA_ID} ad="Başlangıç" deger={secim} secenekler={secenekler} ipucu="Şablon ya da sürüm seçin" gecersiz={!!h.baslangic}
              tanim={ipucuId(BASLA_ID)} degistir={setSecim} />
          </Alan>
        </FormIzgara>
      </Pencere>}
    </>
  );
}

/** 439 (reisim 2026-10-09: "ŞABLONU DÜZENLEME YOK SADECE ÖN İZLEME VAR DÜZENLEME DE OLMALI"): yayınlanmış sürüm DEĞİŞMEZ (açılmış ve imzalanmış
    raporlar onu kullanır) — "Düzenle" o sürümü taslağa kopyalar ve Format kurucuya götürür; yayınlayınca yeni sürüm olur. Açık taslak varsa
    sorar: taslağa devam et ya da bu sürümden yeniden başla (taslağın yerine geçer — gördüğü taslak sürümüyle, görmediğini ezmez). */
export function SurumDuzenleTusu({ turId, surum, taslak }:
  { turId: string; surum: Pick<FormatOzeti, "id" | "sira">; taslak: Pick<FormatOzeti, "id" | "surum" | "degisti"> | null }) {
  const router = useRouter();
  const bildir = useBildir();
  const [acik, setAcik] = useState(false);
  const [bekliyor, baslat] = useTransition();
  const [genel, setGenel] = useState<string | null>(null);
  const ad = surumAdi(surum);
  const ac = () => baslat(async () => {
    const r = await taslakBaslatEylemi(turId, taslak?.surum ?? null, `surum:${surum.id}`);
    if (!r.tamam) { setGenel(r.genel ?? Object.values(r.hatalar ?? {})[0] ?? "Taslak açılamadı."); return; }
    setAcik(false); bildir(`${ad} taslağa kopyalandı; Format kurucuda düzenleyip yayınlayın.`); router.push(`/ekipman-turleri/${turId}/sablon/${r.id}/kurucu`);
  });
  return (
    <>
      <Tus tur="ikincil" ikon="pencil" aria-label={`${ad} · Düzenle`} onClick={() => { setGenel(null); setAcik(true); }}>Düzenle</Tus>
      {acik && <Pencere acik baslik={`${ad} · düzenle`} onKapat={() => setAcik(false)}
        alt={<>
          <Tus tur="ikincil" onClick={() => setAcik(false)}>Vazgeç</Tus>
          {taslak && <TusBaglanti ikon="pencil" href={`/ekipman-turleri/${turId}/sablon/${taslak.id}/kurucu`}>Taslağa devam et</TusBaglanti>}
          <Tus ikon="pencil" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={ac}>{taslak ? "Bu sürümden yeniden başla" : "Taslak aç ve düzenle"}</Tus>
        </>}>
        <p className={pencereMetinSinifi}>{ad} bir taslağa kopyalanır.</p>
        {taslak && <Serit tur="uyari" ikon="triangle-alert">Açık bir taslak var ({tarihYaz(taslak.degisti)}). “Bu sürümden yeniden başla” o taslağın
          yerine geçer; taslaktaki değişiklikleri korumak için “Taslağa devam et”.</Serit>}
        {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      </Pencere>}
    </>
  );
}

/** 2026-10-12 (reisim: "ekipman türlerinde eski sürüme geri dön tuşu olsun"): eski sürümün içeriği YENİ sürüm olarak yayınlanır — hiçbir sürüm
    silinmez, yayındaki eskiye düşer, açık raporlar kendi sürümünde kalır, yeni raporlar bu içerikle açılır. Açık taslak varsa yerine geçer (pencere
    söyler; gördüğü taslak sürümüyle — görmediğini ezmez). Karar ve denetim sunucuda (formatlar.ts surumeGeriDon). `git`: sonra yeni sürümün sayfası
    (sürüm sayfasında), yoksa yerinde tazelenir (tür sayfası). */
export function GeriDonTusu({ turId, surum, taslak, yayinda, git = false }: {
  turId: string; surum: Pick<FormatOzeti, "id" | "sira">; taslak: Pick<FormatOzeti, "surum" | "degisti"> | null; yayinda: Pick<FormatOzeti, "sira"> | null; git?: boolean;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const [acik, setAcik] = useState(false);
  const [bekliyor, baslat] = useTransition();
  const [notu, setNotu] = useState("");
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const ad = surumAdi(surum);
  const don = () => baslat(async () => {
    const r = await surumeGeriDonEylemi(turId, surum.id, taslak?.surum ?? null, notu);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? (r.engeller?.length ? r.engeller.join(" · ") : null));
    if (!r.tamam) return;
    setAcik(false);
    bildir(`${ad} geri yüklendi: Sürüm ${r.sira} yayında.${r.uyarilar?.length ? " Bakanlık formatından ayrılan yerler için sürüm sayfasındaki uyarılara bakın." : ""}`);
    if (git && r.id) router.push(`/ekipman-turleri/${turId}/sablon/${r.id}`); else router.refresh();
  });
  return (
    <>
      {/* görünen ad kısa (satırın tuşları yan yana sığsın); erişilebilir ad sürümle birlikte */}
      <Tus tur="ikincil" ikon="rotate-ccw" aria-label={`${ad} · Bu sürüme geri dön`} onClick={() => { setNotu(`${ad} geri yüklendi`); setH({}); setGenel(null); setAcik(true); }}>
        Geri dön</Tus>
      {acik && <Pencere acik baslik={`${ad} · geri dön`} onKapat={() => setAcik(false)} odak={`#${GERI_NOT_ID}`}
        alt={<><Tus tur="ikincil" onClick={() => setAcik(false)}>Vazgeç</Tus>
          <Tus ikon="rotate-ccw" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={don}>Geri dön</Tus></>}>
        <p className={pencereMetinSinifi}>{ad} içeriği yeni sürüm olarak yayınlanır{yayinda ? `; yayındaki ${surumAdi(yayinda)} eskiye düşer` : ""}.</p>
        {taslak && <Serit tur="uyari" ikon="triangle-alert">Açık bir taslak var ({tarihYaz(taslak.degisti)}). Geri dönünce taslağın yerine geçer, taslaktaki
          değişiklikler kalmaz. Korumak için önce taslağı yayınlayın.</Serit>}
        {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
        {h.surum && <Serit tur="hata" ikon="circle-alert">{h.surum}</Serit>}
        <FormIzgara>
          <Alan id={GERI_NOT_ID} etiket="Sürüm notu" genis hata={h.notu}>
            <Girdi id={GERI_NOT_ID} value={notu} onChange={(e) => setNotu(e.target.value)} maxLength={200} hata={!!h.notu} />
          </Alan>
        </FormIzgara>
      </Pencere>}
    </>
  );
}

/** 437 (reisim 2026-10-09: "RAPOR ŞABLONUNDA SIFIRDAN RAPOR ŞABLONU OLUŞTURMAK YOK"): boş iskeletten taslak — onaylanınca Format kurucuya gider */
export function SifirdanTusu({ turId, turAd, taslak }: { turId: string; turAd: string; taslak: { surum: number; degisti: string } | null }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  return (
    <Tus tur="ikincil" ikon="file-plus" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={async () => {
      if (!(await onayla({ baslik: "Sıfırdan oluştur", tus: "Oluştur",
        metin: `${turAd} için boş bir rapor şablonu taslağı açılır: firma ve ekipman bilgileri, ölçüm cihazları, kontrol maddeleri (boş), fotoğraf, kusur, ` +
          `not, sonuç ve imza bölümleri. Maddeleri ve alanları Format kurucuda eklersiniz.${taslak ? ` Taslak (${tarihYaz(taslak.degisti)}) bununla değiştirilir.` : ""}` }))) return;
      baslat(async () => {
        const r = await taslakBaslatEylemi(turId, taslak?.surum ?? null, "bos");
        if (!r.tamam) { bildir(r.genel ?? Object.values(r.hatalar ?? {})[0] ?? "Taslak açılamadı."); return; }
        bildir("Boş taslak hazırlandı; Format kurucuda düzenleyin."); router.push(`/ekipman-turleri/${turId}/sablon/${r.id}/kurucu`);
      });
    }}>Sıfırdan oluştur</Tus>
  );
}

/** 2026-10-23 (basılı formdan şablon — reisim: "ben bunu yükleyince format buna dönüşsün format düzenleyicide bundan düzenleme yapabileyim
    istiyorum"): türün basılı format PDF'inden taslak; bitince Format kurucu açılır. Dönen: hata iletisi (yoksa null). Tür sayfasının yükleme
    penceresi ve basılı format satırı ortak. */
export function useBasilidanKur(turId: string) {
  const router = useRouter();
  const bildir = useBildir();
  return async (formatId: string | null, taslakSurumu: number | null): Promise<string | null> => {
    const r = await basilidanKurEylemi(turId, formatId, taslakSurumu);
    if (!r.tamam || !r.id) return r.genel ?? "Şablon kurulamadı.";
    bildir(["Şablon basılı formdan kuruldu (taslak).", ...(r.uyarilar ?? [])].join(" "));
    router.push(`/ekipman-turleri/${turId}/sablon/${r.id}/kurucu`);
    return null;
  };
}

/** basılı format satırındaki "Şablonu bundan kur" — onaylanınca o PDF'ten taslak (açık taslağın yerine geçer) */
export function BasilidanKurTusu({ turId, formatId, sira, taslak }: { turId: string; formatId: string; sira: number; taslak: { surum: number; degisti: string } | null }) {
  const bildir = useBildir();
  const onayla = useOnayla();
  const kur = useBasilidanKur(turId);
  const [bekliyor, baslat] = useTransition();
  return (
    <Tus tur="ikincil" ikon="scan-text" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={async () => {
      if (!(await onayla({ baslik: `Şablonu sürüm ${sira}'den kur`, tus: "Kur",
        metin: `Rapor şablonu bu basılı forma göre yeni taslak olarak kurulur; yayındaki sürüm değişmez.${taslak ? ` Taslak (${tarihYaz(taslak.degisti)}) bununla değiştirilir.` : ""}` }))) return;
      baslat(async () => { const h = await kur(formatId, taslak?.surum ?? null); if (h) bildir(h); });
    }}>{bekliyor ? "Kuruluyor…" : "Şablonu bundan kur"}</Tus>
  );
}

/** yayınla: engeller (kilitli öğe) ve uyarılar pencere açılınca sunucudan; Yayınla hep basılır, yayınlanamıyorsa nedenini söyler */
export function YayinlaTusu({ format }: { format: Pick<FormatOzeti, "id" | "surum"> }) {
  const router = useRouter();
  const bildir = useBildir();
  const [acik, setAcik] = useState(false);
  const [bekliyor, baslat] = useTransition();
  const [denetim, setDenetim] = useState<{ engeller: string[]; uyarilar: string[] } | null>(null);
  const [notu, setNotu] = useState("");
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  useEffect(() => {
    if (!acik) return;
    let iptal = false;
    void yayinDenetleEylemi(format.id).then((r) => {
      if (iptal) return;
      if (r.tamam) setDenetim({ engeller: r.engeller ?? [], uyarilar: r.uyarilar ?? [] }); else setGenel(r.genel ?? "Denetlenemedi.");
    });
    return () => { iptal = true; };
  }, [acik, format.id]);
  const yayinla = () => baslat(async () => {
    const r = await yayinlaEylemi(format.id, format.surum, notu);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (r.engeller) { setDenetim((d) => ({ engeller: r.engeller!, uyarilar: d?.uyarilar ?? [] })); return; }
    if (!r.tamam) return;
    setAcik(false); bildir(`Rapor şablonu sürüm ${r.sira} yayınlandı.`); router.refresh();
  });
  return (
    <>
      <Tus ikon="upload" onClick={() => { setDenetim(null); setNotu(""); setH({}); setGenel(null); setAcik(true); }}>Yayınla</Tus>
      {acik && <Pencere acik baslik="Rapor şablonunu yayınla" onKapat={() => setAcik(false)} odak={`#${NOT_ID}`}
        alt={<><Tus tur="ikincil" onClick={() => setAcik(false)}>Vazgeç</Tus><Tus ikon="upload" disabled={bekliyor || !denetim} aria-busy={bekliyor || !denetim || undefined} onClick={yayinla}>Yayınla</Tus></>}>
        <p className={pencereMetinSinifi}>Yeni raporlar bu sürümle açılır.</p>
        {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
        {denetim && denetim.engeller.length > 0 && <>
          <Serit tur="hata" ikon="lock">Yayınlanamaz: Bakanlık formatının zorunlu öğeleri korunmalı.</Serit>
          <Kosullar ogeler={denetim.engeller.map((m) => ({ tur: "eksik" as const, metin: m }))} />
        </>}
        {denetim && denetim.uyarilar.length > 0 && <>
          <p className={stil.etiket}>Yayından önce bakılacak</p>
          <Kosullar ogeler={denetim.uyarilar.map((m) => ({ tur: "eksik" as const, metin: m }))} />
        </>}
        <FormIzgara>
          <Alan id={NOT_ID} etiket="Sürüm notu" genis hata={h.notu}>
            <Girdi id={NOT_ID} value={notu} onChange={(e) => setNotu(e.target.value)} maxLength={200} hata={!!h.notu} />
          </Alan>
        </FormIzgara>
      </Pencere>}
    </>
  );
}
