"use client";
/* FORMAT KURUCU (K4; RAPOR-FORMAT.md §6; maket ekipman-turleri.html #/tur/<kod>/kurucu — maket-kurucu.js): solda bölüm listesi (seç, sırala,
   bölüm ekle), ortada seçili bölümün düzenleyicisi (ad, bloğa göre alanlar / maddeler / sütunlar / değerler, fotoğraf sayıları, sonuç cümlesi,
   yorum zorunlu mu, imza alanları), sağda kurallar ve canlı saha ekranı önizlemesi. Değişiklik "Taslağı kaydet" ile yazılır (Kaydedilmedi ·
   Vazgeç · Kaydet — kalıp Z1); kaydedilmemiş taslak yayınlanmaz. Kilitli (Bakanlık) bölüm silinmez, adı değişmez; kilitli öğe silinmez — sunucu
   yayında kaynak şablondan yeniden denetler (ENGEL). Telefonda kurucu açılmaz (masaüstü işi), önizleme görünür. Karar ve şema sunucuda.
   337–339 incelemesi: kaydedilmemiş taslakla uygulama içi bağlantıya basınca sorulur (tarayıcının sekme kapatma sorusuna ek); taslakta sorun varsa
   üstte "Yayından önce bakılacak" (maket kurucuCiz → denetim; motorun saf yayın denetimi). */
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi } from "../../../components/form/Form";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { NesneBasi, Rozet } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { yayinDenetimi } from "../../../format/motor";
import { BLOKLAR, type Blok, type FormatTanimi } from "../../../format/tanim";
import { bolumAdi, bolumOgeleri, bolumSil, ogeEkle, ogeliBlok, ogeSil, tasi, yeniBolum } from "../kurucu";
import { taslakKaydetEylemi } from "./eylemler";
import { FormatOnizleme } from "./FormatOnizleme";
import { BLOK_ADI } from "./ortak";
import { YayinlaTusu } from "./SablonBolumu";
import stil from "./format.module.css";

const BLOK_IKON: Record<Blok, string> = { bilgi: "list", liste: "list-checks", olcum: "table", test: "gauge", cihaz: "gauge", foto: "camera", kusur: "triangle-alert", sonuc: "badge-check", not: "message-square", imza: "file-signature" };
const BLOK_ACIKLAMA: Partial<Record<Blok, string>> = {
  cihaz: "Türün cihaz türleri; zimmetten eklenir, kalibrasyonu denetlenir. Cihaz türleri tür sayfasında seçilir.",
  kusur: "Kendiliğinden dolar: Uygun değil maddeler ve sınır dışı ölçümler, fotoğraflarıyla.",
};
const OGE: Record<"bilgi" | "liste" | "olcum" | "test", readonly [string, string]> = { bilgi: ["Alanlar", "Alan ekle"], liste: ["Maddeler", "Madde ekle"], olcum: ["Sütunlar", "Sütun ekle"], test: ["Değerler", "Değer ekle"] };
const ID = { ad: "kb-ad", yeni: "kb-yeni", ekle: "kb-ekle", enAz: "kb-enaz", enCok: "kb-encok", cumle: "kb-cumle", baslik: "kb-baslik" } as const;
const odak = (q: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(q)?.focus());

/** sunucunun alan yolu (bolumler.2.ad) → okunur yer ("3. bölüm (Ad): ") */
function yer(k: string, t: FormatTanimi): string {
  const m = /^bolumler\.(\d+)/.exec(k);
  if (!m) return "";
  const b = t.bolumler[Number(m[1])];
  return `${Number(m[1]) + 1}. bölüm${b?.ad ? ` (${b.ad})` : ""}: `;
}

export function FormatKurucu({ turId, turAd, format, tanim, kaynakAd }: {
  turId: string; turAd: string; format: { id: string; surum: number }; tanim: FormatTanimi; kaynakAd: string | null;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [mesgul, baslat] = useTransition();
  /* taslak: sunucudaki tanım değişince (kaydettikten sonra yenileme) ona eşitlenir */
  const ilkJson = JSON.stringify(tanim);
  const [t, setT] = useState<FormatTanimi>(tanim);
  const [son, setSon] = useState(ilkJson);
  const [sec, setSec] = useState(0);
  const [yeni, setYeni] = useState("");
  const [hatalar, setHatalar] = useState<string[]>([]);
  if (son !== ilkJson) { setSon(ilkJson); setT(tanim); setHatalar([]); }
  const kirli = JSON.stringify(t) !== ilkJson;
  const i = Math.max(0, Math.min(sec, t.bolumler.length - 1)), b = t.bolumler[i];
  const degis = (y: FormatTanimi) => { setT(y); setHatalar([]); };

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

  const kaydet = () => baslat(async () => {
    const r = await taslakKaydetEylemi(format.id, format.surum, t);
    if (!r.tamam) {
      setHatalar(r.hatalar ? Object.entries(r.hatalar).map(([k, v]) => `${yer(k, t)}${v}`) : [r.genel ?? "Kaydedilemedi."]);
      bildir("Taslak kaydedilmedi; nedeni sayfanın üstünde."); odak("#kb-hatalar"); return;
    }
    bildir("Taslak kaydedildi."); router.refresh();
  });
  const vazgec = () => { setT(tanim); setHatalar([]); bildir("Değişiklikler geri alındı."); };
  const sec_ = (j: number) => { setSec(j); setYeni(""); odak(`#${ID.baslik}`); };
  const sira = (j: number, k: number, yon: "yukari" | "asagi") => {
    degis({ ...t, bolumler: tasi(t.bolumler, j, k) }); setSec(k);
    /* önce aynı yönün tuşu (art arda taşınabilsin), o kapalıysa karşı yönün — iki ayrı sorgu (virgüllü seçici belge sırasını alırdı) */
    requestAnimationFrame(() => (document.querySelector<HTMLElement>(`[data-kb-${yon}="${k}"]:not([disabled])`)
      ?? document.querySelector<HTMLElement>(`[data-kb-${yon === "yukari" ? "asagi" : "yukari"}="${k}"]`))?.focus());
  };
  const bolumEkle = (blok: Blok) => {
    const y = { ...t, bolumler: [...t.bolumler, yeniBolum(t, blok, BLOK_ADI[blok])] };
    degis(y); setSec(y.bolumler.length - 1); setYeni(""); odak(`#${ID.ad}`); bildir(`${BLOK_ADI[blok]} bölümü eklendi (taslak).`);
  };
  const sil = async () => {
    if (!b || b.kilit) return;
    if (!(await onayla({ baslik: "Bölüm silinsin mi?", metin: `${i + 1} · ${b.ad} taslaktan çıkar. Yayınlanana kadar raporlar etkilenmez.`, tus: "Sil", tehlike: true }))) return;
    degis(bolumSil(t, i)); setSec(Math.max(0, i - 1)); bildir(`${b.ad} bölümü silindi (taslak).`); odak(`#${ID.baslik}`);
  };
  const ekle = () => {
    const a = yeni.trim();
    if (!a) { bildir("Önce adını yazın."); odak(`#${ID.yeni}`); return; }
    degis(ogeEkle(t, i, a)); setYeni(""); bildir(`“${a}” eklendi (taslak).`); odak(`#${ID.yeni}`);
  };
  const bolumYaz = (y: Partial<Record<string, unknown>>) => degis({ ...t, bolumler: t.bolumler.map((x, j) => (j === i ? ({ ...x, ...y } as typeof x) : x)) });
  const sayi = (s: string) => (/^\d{1,2}$/.test(s.trim()) ? Number(s.trim()) : null);

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
          <TusBaglanti ikon="eye" href={`/ekipman-turleri/${turId}/sablon/${format.id}`}>Önizle</TusBaglanti>
          {kirli ? <>
            <span className={stil.kaydetNot}>Kaydedilmedi</span>
            <Tus tur="ikincil" disabled={mesgul} onClick={vazgec}>Vazgeç</Tus>
            <Tus ikon="check" disabled={mesgul} aria-busy={mesgul || undefined} onClick={kaydet}>Taslağı kaydet</Tus>
          </> : <YayinlaTusu format={format} />}
        </>} />
      <div className={stil.seritKap}>
        <Serit tur="bilgi" ikon="info">Firma formatını kendisi kurar; saha ekranı ve PDF bu tanımdan çizilir. Açık raporlar başladıkları sürümle kalır, yeni raporlar yayındaki sürümle açılır.</Serit>
        {hatalar.length > 0 && <div id="kb-hatalar" tabIndex={-1}><Serit tur="hata" ikon="circle-alert">Taslak kaydedilmedi: {hatalar.join(" · ")}</Serit></div>}
        {bakilacak.length > 0 && <Serit tur="uyari" ikon="triangle-alert">Yayından önce bakılacak: {bakilacak.join(" · ")}</Serit>}
        <p className={stil.yalnizDar}>Format kurucu masaüstünde kullanılır; burada önizleme görünür.</p>
      </div>
      <div className={stil.kurucu}>
        <nav className={`${stil.kurucuSol} ${stil.yalnizGenis}`} aria-label="Bölümler">
          <ol className={stil.kurucuBolumler}>
            {t.bolumler.map((x, j) => (
              <li key={x.id} className={j === i ? `${stil.kurucuBolum} ${stil.kurucuSecili}` : stil.kurucuBolum}>
                <button type="button" className={stil.kurucuBolumTus} aria-current={j === i ? "true" : undefined} onClick={() => sec_(j)}>
                  <Ikon ad={BLOK_IKON[x.blok]} kucuk />
                  <span className={stil.kurucuBolumAd}><b>{j + 1} · {x.ad || "Adsız bölüm"}</b><span className={stil.ogeAlt}>{BLOK_ADI[x.blok]}{x.kilit ? " · Bakanlık alanı" : ""}</span></span>
                </button>
                <span className={stil.kurucuSira}>
                  <button type="button" className={stil.ikonTus} data-kb-yukari={j} aria-label={`${x.ad} yukarı`} disabled={j === 0} onClick={() => sira(j, j - 1, "yukari")}><Ikon ad="arrow-up" kucuk /></button>
                  <button type="button" className={stil.ikonTus} data-kb-asagi={j} aria-label={`${x.ad} aşağı`} disabled={j === t.bolumler.length - 1} onClick={() => sira(j, j + 1, "asagi")}><Ikon ad="arrow-down" kucuk /></button>
                </span>
              </li>
            ))}
          </ol>
          <FormIzgara>
            <Alan id={ID.ekle} etiket="Bölüm ekle">
              <SecimAlani id={ID.ekle} ad="Bölüm ekle" deger="" ipucu="Bölüm türü seçin" secenekler={BLOKLAR.map((k) => [k, BLOK_ADI[k]] as const)} degistir={(k) => bolumEkle(k as Blok)} />
            </Alan>
          </FormIzgara>
        </nav>

        <section className={`${stil.bolum} ${stil.kurucuOrta} ${stil.yalnizGenis}`} aria-labelledby={ID.baslik}>
          {!b ? <p className={stil.satir}>Bölüm yok; soldan ekleyin.</p> : <>
            <div className={stil.bolumBas}>
              <h2 className={stil.bolumAd} id={ID.baslik} tabIndex={-1}>{i + 1} · {b.ad || "Adsız bölüm"}</h2>
              {b.kilit ? <Rozet tur="notr">Bakanlık alanı · silinemez</Rozet>
                : <Tus tur="ikincil" ikon="trash-2" onClick={() => void sil()}>Bölümü sil</Tus>}
            </div>
            <FormIzgara>
              <Alan id={ID.ad} etiket="Bölüm adı" zorunlu genis sonuc={b.kilit ? "Bakanlık alanı: adı değişmez." : undefined}>
                <Girdi id={ID.ad} value={b.ad} maxLength={200} disabled={b.kilit} mesajli={b.kilit} onChange={(e) => degis(bolumAdi(t, i, e.target.value))} />
              </Alan>
            </FormIzgara>
            {b.blok === "liste" && <p className={stil.satir}>Cevap seti: <b>{b.cevaplar.join(" · ")}</b> · madde başına açıklama ve referans standart (raporda (i) penceresi)</p>}
            {ogeliBlok(b.blok) && (() => {
              const l = bolumOgeleri(b), [baslik, ekleAd] = OGE[b.blok as keyof typeof OGE];
              return <>
                <p className={stil.etiket}>{baslik} ({l.length})</p>
                {l.length ? <ul className={stil.kurucuOgeler}>
                  {l.map((x) => (
                    <li key={x.id}>
                      <span className={stil.kurucuOge}><span>{x.kilit && <span className={stil.kilit} title="Bakanlık alanı"><Ikon ad="lock" kucuk /><span className="gizli">Bakanlık alanı</span></span>}{x.ad}</span>
                        {x.alt && <span className={stil.ogeAlt}>{x.alt}</span>}</span>
                      {!x.kilit && <button type="button" className={stil.ikonTus} aria-label={`${x.ad} sil`} onClick={() => { degis(ogeSil(t, i, x.id)); bildir(`“${x.ad}” çıkarıldı (taslak).`); odak(`#${ID.yeni}`); }}><Ikon ad="x" kucuk /></button>}
                    </li>
                  ))}
                </ul> : <p className={stil.satir}>Henüz yok.</p>}
                <div className={stil.ekleSatir}>
                  <Girdi id={ID.yeni} aria-label={ekleAd} maxLength={120} value={yeni}
                    onChange={(e) => setYeni(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ekle(); } }} />
                  <Tus tur="ikincil" ikon="plus" onClick={ekle}>{ekleAd}</Tus>
                </div>
              </>;
            })()}
            {b.blok === "foto" && <FormIzgara>
              <Alan id={ID.enAz} etiket="En az fotoğraf">
                <Girdi id={ID.enAz} inputMode="numeric" maxLength={2} value={String(b.enAz)} onChange={(e) => { const n = sayi(e.target.value); if (n !== null) bolumYaz({ enAz: n }); }} />
              </Alan>
              <Alan id={ID.enCok} etiket="En çok fotoğraf">
                <Girdi id={ID.enCok} inputMode="numeric" maxLength={2} value={String(b.enCok)} onChange={(e) => { const n = sayi(e.target.value); if (n !== null) bolumYaz({ enCok: n }); }} />
              </Alan>
            </FormIzgara>}
            {b.blok === "sonuc" && <FormIzgara>
              <Alan id={ID.cumle} etiket="Sonuç cümlesi" genis sonuc={b.kilit ? "Bakanlık alanı: cümle değişmez." : "“… kullanılması uygundur / uygun değildir” — kurallardaki sonuç önerisiyle."}>
                <Girdi id={ID.cumle} value={b.cumle} maxLength={400} disabled={b.kilit} mesajli onChange={(e) => bolumYaz({ cumle: e.target.value })} />
              </Alan>
            </FormIzgara>}
            {b.blok === "not" && <label className={stil.secenek}>
              <input type="checkbox" checked={b.zorunlu} onChange={(e) => bolumYaz({ zorunlu: e.target.checked })} /><span>Yorum zorunlu</span>
            </label>}
            {b.blok === "imza" && <div role="group" aria-label="İmza alanları" className={stil.secenekler}>
              {([["uzman", "Muayene uzmanı"], ["teknik", "Teknik yönetici"]] as const).map(([k, ad]) => (
                <label key={k} className={stil.secenek}>
                  <input type="checkbox" checked={b.imzalar.includes(k)} disabled={b.kilit || (b.imzalar.length === 1 && b.imzalar.includes(k))}
                    onChange={(e) => bolumYaz({ imzalar: e.target.checked ? [...b.imzalar, k] : b.imzalar.filter((x) => x !== k) })} /><span>{ad}</span>
                </label>
              ))}
            </div>}
            {BLOK_ACIKLAMA[b.blok] && <p className={stil.satir}>{BLOK_ACIKLAMA[b.blok]}</p>}
          </>}
        </section>

        <div className={stil.kurucuSag}>
          <section className={`${stil.bolum} ${stil.yalnizGenis}`} aria-labelledby="kb-kural">
            <h2 className={stil.bolumAd} id="kb-kural">Kurallar</h2>
            <div className={stil.secenekler}>
              {kural("foto", "“Uygun değil” maddede fotoğraf zorunlu", "kapalıyken fotoğraf isteğe bağlı")}
              {kural("derece", "Kusur derecesi sorulsun (hafif / ağır)", "açıksa hafif kusur devri çalışır")}
              {kural("oneri", "Sonuç önerisi", "Uygun değil madde ya da sınır dışı ölçüm varsa sonuç “Uygun değil” önerilir")}
            </div>
          </section>
          <section className={stil.bolum} aria-labelledby="kb-onizle">
            <h2 className={stil.bolumAd} id="kb-onizle">Saha ekranı önizlemesi</h2>
            <FormatOnizleme tanim={t} />
          </section>
        </div>
      </div>
    </>
  );
}
