"use client";
/* FORMAT KURUCU (K4; RAPOR-FORMAT.md §6). 451 (reisim 2026-10-09: "format kurucu hiç kullanışlı değil, mantıksız zor ve karmaşık"; "formatı
   oluştururken nasıl gözükeceği zihnimde canlanmıyor bile"): üç sütunlu düzenleyici (solda bölüm listesi, ortada form, sağda önizleme) KALKTI —
   format RAPORUN KENDİSİNİN ÜSTÜNDE kurulur (Kagit.tsx: belgenin Bakanlık görünümü, yerinde yazı, yerinde ekle / çıkar). "Belge önizlemesi"
   aynı taslağı kesin belgenin çizicisiyle (src/belge/belge.ts — PDF'le aynı) boş bir raporda gösterir. Kurallar ve genel muayene talimatı üstte.
   Değişiklik "Taslağı kaydet" ile yazılır (Kaydedilmedi · Vazgeç · Kaydet — kalıp Z1); kaydedilmemiş taslak yayınlanmaz; kaydedilmemiş taslakla
   sayfadan çıkarken sorulur. 470: Bakanlık öğesi de değişir ve silinir (sorarak) — sunucu yayında kaynak şablondan ayrılanları UYARI olarak
   listeler. Telefonda kurucu açılmaz
   (masaüstü işi): belge önizlemesi görünür. Karar ve şema sunucuda.
   472–474 (reisim 2026-10-10, maket kararları k1–k4): üç görünüm — Kâğıt (açılışta) · Saha ekranı (denetçinin tabletinde / telefonunda göreceği
   gerçek ekran, örnek raporla; orada da yerinde düzenlenir — SahaGorunumu.tsx) · Belge önizlemesi. Üçü aynı taslağı gösterir: birinde yapılan
   değişiklik ötekilerde görünür. Telefonda (maket): Belge · Saha ekranı — saha ekranı yalnız "denetçi gibi dene" (telefon genişliğinde).
   483 (reisim 2026-10-10: "rapor düzenlemede sadece saha ekranı gözüksün o ekranda düzenleme yapılamasın"; "kağıttan düzenleyebiliyoruz ama sahadaki
   görüntü nasıl oluyor düzenleyemiyoruz burası çok karmaşık bir çözüm öner"): TEK DÜZENLEME YERİ KÂĞIT. Saha ekranı salt önizleme; sahaya özgü
   ayarlar kâğıtta — madde cevabının biçimi "Kurallar, saha ekranı ve genel muayene talimatı"nda, bölümün fotoğraftan / Excel'den doldurulması
   bölümün ayarında (484). */
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { raporBelgesi } from "../../../belge/belge";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { useOnayla } from "../../../components/pencere/Onay";
import { NesneBasi, Rozet } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { yayinDenetimi } from "../../../format/motor";
import type { FormatTanimi } from "../../../format/tanim";
import { bolumSil, gorunumYaz } from "../kurucu";
import { taslakKaydetEylemi } from "./eylemler";
import { Kagit } from "./Kagit";
import { SatirAlani } from "./KurucuDuzenleyici";
import { SahaGorunumu } from "./SahaGorunumu";
import { kurucuOrnegi } from "./kurucuOrnegi";
import { YayinlaTusu } from "./SablonBolumu";
import stil from "./format.module.css";

const odak = (q: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(q)?.focus());

/** sunucunun alan yolu (bolumler.2.ad) → okunur yer ("3. bölüm (Ad): ") */
function yer(k: string, t: FormatTanimi): string {
  const m = /^bolumler\.(\d+)/.exec(k);
  if (!m) return "";
  const b = t.bolumler[Number(m[1])];
  return `${Number(m[1]) + 1}. bölüm${b?.ad ? ` (${b.ad})` : ""}: `;
}

/** turStd / turCihaz (459): türün kontrol metodu standartları ve ölçüm cihazı türleri (tür sayfasında seçilir) — kâğıtta ve önizlemede */
export function FormatKurucu({ turId, turAd, turKod, format, tanim, kaynakAd, turStd, turCihaz }: {
  turId: string; turAd: string; turKod: string; format: { id: string; surum: number }; tanim: FormatTanimi; kaynakAd: string | null;
  turStd: string[]; turCihaz: string[];
}) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [mesgul, baslat] = useTransition();
  /* taslak: sunucudaki tanım değişince (kaydettikten sonra yenileme) ona eşitlenir */
  const ilkJson = JSON.stringify(tanim);
  const [t, setT] = useState<FormatTanimi>(tanim);
  const [son, setSon] = useState(ilkJson);
  const [hatalar, setHatalar] = useState<string[]>([]);
  const [gorunum, setGorunum] = useState<"duzen" | "saha" | "belge">("duzen");
  if (son !== ilkJson) { setSon(ilkJson); setT(tanim); setHatalar([]); }
  const kirli = JSON.stringify(t) !== ilkJson;
  const degis = (y: FormatTanimi) => { setT(y); setHatalar([]); };
  const stdAnahtar = turStd.join("\n"), cihazAnahtar = turCihaz.join("\n");
  const tur = useMemo(() => ({ ad: turAd, kod: turKod, std: stdAnahtar ? stdAnahtar.split("\n") : [], cihaz: cihazAnahtar ? cihazAnahtar.split("\n") : [] }),
    [turAd, turKod, stdAnahtar, cihazAnahtar]);

  /* kaydedilmemiş taslakla sayfadan çıkarken tarayıcı sorar */
  useEffect(() => {
    if (!kirli) return;
    const dur = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", dur);
    return () => window.removeEventListener("beforeunload", dur);
  }, [kirli]);
  /* uygulama içi gezinti (Önizle, kırıntı, yan menü — istemci bağlantıları beforeunload'u tetiklemez): kaydedilmemiş taslakta sorulur */
  useEffect(() => {
    if (!kirli) return;
    const tikla = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank" || a.hasAttribute("download")) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
      e.preventDefault(); e.stopPropagation();
      void onayla({ baslik: "Kaydedilmemiş değişiklikler", metin: "Taslağa kaydedilmemiş değişiklikler silinir. Sayfadan çıkılsın mı?", tus: "Çık", tehlike: true })
        .then((tamam) => { if (tamam) router.push(`${u.pathname}${u.search}${u.hash}`); });
    };
    document.addEventListener("click", tikla, true);
    return () => document.removeEventListener("click", tikla, true);
  }, [kirli, onayla, router]);
  /* yayından önce bakılacaklar (boş bölüm, sınırsız tablo, sonuç / imza bölümü yok …): uyarıdır, yayını engellemez */
  const bakilacak = useMemo(() => yayinDenetimi(t), [t]);
  const belge = useMemo(() => raporBelgesi(kurucuOrnegi(t, tur)), [t, tur]);

  const kaydet = () => baslat(async () => {
    const r = await taslakKaydetEylemi(format.id, format.surum, t);
    if (!r.tamam) {
      setHatalar(r.hatalar ? Object.entries(r.hatalar).map(([k, v]) => `${yer(k, t)}${v}`) : [r.genel ?? "Kaydedilemedi."]);
      bildir("Taslak kaydedilmedi; nedeni sayfanın üstünde."); odak("#kb-hatalar"); return;
    }
    bildir("Taslak kaydedildi."); router.refresh();
  });
  const vazgec = () => { setT(tanim); setHatalar([]); bildir("Değişiklikler geri alındı."); };
  /* 470: Bakanlık bölümü de silinir — uyarıyla sorulur, yayında uyarı çıkar (engel değil) */
  const bolumuSil = async (i: number) => {
    const b = t.bolumler[i];
    if (!b || b.blok === "cihaz") return;
    const metin = b.kilit ? `${b.ad} Bakanlık formatının zorunlu bölümü. Silinirse bu formatla yazılan raporlar Bakanlık formatına uymaz; yayınlarken uyarı çıkar.`
      : `${b.ad} taslaktan çıkar. Yayınlanana kadar raporlar etkilenmez.`;
    if (!(await onayla({ baslik: b.kilit ? "Bakanlık bölümü silinsin mi?" : "Bölüm silinsin mi?", metin, tus: "Sil", tehlike: true }))) return;
    degis(bolumSil(t, i)); bildir(`${b.ad} bölümü silindi (taslak).`);
  };
  const kural = (k: keyof FormatTanimi["kurallar"], ad: string, alt: string) => (
    <label className={stil.secenek}>
      <input type="checkbox" checked={t.kurallar[k]} onChange={(e) => degis({ ...t, kurallar: { ...t.kurallar, [k]: e.target.checked } })} />
      <span>{ad}<span className={stil.ogeAlt}>{alt}</span></span>
    </label>
  );

  return (
    <>
      <NesneBasi baslik={`Format kurucu · ${turAd}`} rozet={<Rozet tur="bekliyor">Taslak</Rozet>} altIkon="layout-list"
        alt={`${t.bolumler.length} bölüm · ${kaynakAd ?? "Firma formatı"}`}
        tuslar={<>
          <span className={`${stil.gorunumSecici} ${stil.yalnizGenis}`} role="group" aria-label="Görünüm">
            <Tus tur={gorunum === "duzen" ? "birincil" : "ikincil"} ikon="pencil" aria-pressed={gorunum === "duzen"} onClick={() => setGorunum("duzen")}>Kâğıt</Tus>
            <Tus tur={gorunum === "saha" ? "birincil" : "ikincil"} ikon="tablet-smartphone" aria-pressed={gorunum === "saha"} onClick={() => setGorunum("saha")}>Saha ekranı</Tus>
            <Tus tur={gorunum === "belge" ? "birincil" : "ikincil"} ikon="file-text" aria-pressed={gorunum === "belge"} onClick={() => setGorunum("belge")}>Belge önizlemesi</Tus>
          </span>
          <span className={stil.darSecici} role="group" aria-label="Görünüm">
            <Tus tur={gorunum !== "saha" ? "birincil" : "ikincil"} ikon="file-text" aria-pressed={gorunum !== "saha"} onClick={() => setGorunum("belge")}>Belge</Tus>
            <Tus tur={gorunum === "saha" ? "birincil" : "ikincil"} ikon="smartphone" aria-pressed={gorunum === "saha"} onClick={() => setGorunum("saha")}>Saha ekranı</Tus>
          </span>
          <TusBaglanti tur="ikincil" ikon="eye" href={`/ekipman-turleri/${turId}/sablon/${format.id}`}>Sürüm sayfası</TusBaglanti>
          {kirli ? <>
            <span className={stil.kaydetNot}>Kaydedilmedi</span>
            <Tus tur="ikincil" disabled={mesgul} onClick={vazgec}>Vazgeç</Tus>
            <Tus ikon="check" disabled={mesgul} aria-busy={mesgul || undefined} onClick={kaydet}>Taslağı kaydet</Tus>
          </> : <YayinlaTusu format={format} />}
        </>} />
      <div className={stil.seritKap}>
        <Serit tur="bilgi" ikon="info">
          <span className={stil.yalnizGenis}>Raporun kendisini düzenliyorsunuz: başlığa, maddeye, sütun başlığına basıp yazın; “+” ile ekleyin, “×” ile çıkarın,
            ayrıntılar ayar tuşunda. Kilit simgeli yerler Bakanlık formatının; onlar da değişir, yayınlarken uyarı çıkar. Firma bilgileri her formatta aynıdır.
            Açık raporlar başladıkları sürümle kalır, yeni raporlar yayındaki sürümle açılır.</span>
          <span className={stil.yalnizDar}>Format kurucu masaüstünde düzenlenir; burada belge önizlemesi ve saha ekranı (denetçi gibi dene) açılır.</span>
        </Serit>
        {hatalar.length > 0 && <div id="kb-hatalar" tabIndex={-1}><Serit tur="hata" ikon="circle-alert">Taslak kaydedilmedi: {hatalar.join(" · ")}</Serit></div>}
        {bakilacak.length > 0 && <Serit tur="uyari" ikon="triangle-alert">Yayından önce bakılacak: {bakilacak.join(" · ")}</Serit>}
      </div>
      <details className={`${stil.bolum} ${stil.kurallar} ${stil.yalnizGenis}`}>
        <summary className={stil.kurallarBas}>Kurallar, saha ekranı ve genel muayene talimatı</summary>
        <div className={stil.kurallarIc}>
          <div className={stil.secenekler}>
            {kural("foto", "“Uygun değil” maddede fotoğraf zorunlu", "kapalıyken fotoğraf isteğe bağlı")}
            {kural("derece", "Kusur derecesi sorulsun (hafif / ağır)", "açıksa hafif kusur devri çalışır")}
            {kural("oneri", "Sonuç önerisi", "“Uygun değil” madde ya da sınır dışı ölçüm varsa sonuç “Uygun değil” önerilir")}
          </div>
          {/* 483: sahaya özgü ayar kâğıtta (saha ekranı salt önizleme) — madde cevabının biçimi; belgeye (PDF) etkisi yok */}
          <fieldset className={stil.secenekler}>
            <legend className={stil.kullanimEtiket}>Saha ekranında madde cevabı (belgeye etkisi yok)</legend>
            {([["acilir", "Açılır liste", "cevap listeden seçilir"], ["tus", "Yan yana tuşlar", "tek dokunuşla — sahada daha hızlı"]] as const).map(([k, ad, alt]) => (
              <label key={k} className={stil.secenek}>
                <input type="radio" name="kb-cevap" checked={t.gorunum.cevap === k} onChange={() => degis(gorunumYaz(t, { cevap: k }))} />
                <span>{ad}<span className={stil.ogeAlt}>{alt}</span></span>
              </label>
            ))}
          </fieldset>
          <SatirAlani id="kb-talimat" etiket="Genel muayene talimatı" deger={t.gorunum.talimat} satir={4}
            ipucu="Rapor ekranının sağ üstündeki ünlemden açılır; belgeye (PDF) basılmaz." uygula={(s) => degis(gorunumYaz(t, { talimat: s }))} />
        </div>
      </details>
      <div className={gorunum === "duzen" ? stil.yalnizGenis : stil.gizliHer}>
        <Kagit t={t} degis={degis} tur={tur} bolumuSil={(i) => void bolumuSil(i)} bildir={bildir} />
      </div>
      {/* saha ekranı yalnız seçilince kurulur (çerçeve sayfası o zaman yüklenir); telefonda yalnız dene (SahaGorunumu) */}
      {gorunum === "saha" && <SahaGorunumu turId={turId} formatId={format.id} t={t} />}
      <div className={gorunum === "belge" ? stil.belgeKap : gorunum === "saha" ? stil.gizliHer : `${stil.belgeKap} ${stil.yalnizDar}`}>
        {/* kayan öğe belgenin kendisi (telefonda A4 yana kayar): klavyeyle kaydırılsın diye odak ve ad onda (rapor önizlemesi gibi) */}
        <div className="rb-onizleme" aria-label="Belge önizlemesi" role="region" tabIndex={0}>{belge}</div>
      </div>
    </>
  );
}
