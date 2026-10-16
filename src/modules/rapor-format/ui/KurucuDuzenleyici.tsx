"use client";
/* FORMAT KURUCU · DÜZENLEYİCİLER (426; reisim 2026-10-09: "bir kullanıcı da bu ve benzeri rapor formatlarını isterse kendi eli ile format
   yapıcıdan yapabileceği şekilde format yapıcıyı düzenle"). Öğe düzenleyici (alan / madde / sütun / değer — tür, seçenekler, uygun değil sayılan
   seçenekler, ağır kusur, sınır, birim, zorunlu, standart, açıklama, talimat, grup), kontrol listesinin grupları ve cevap seti, ölçüm tablosunun
   uygunluk notları, sonuç bölümünün sabit metni, görünüm (form kodu, başlık, metot ve kapsam, genel muayene talimatı). Değişiklik saf
   işlevlerle (../kurucu.ts) taslağa yazılır; 470: Bakanlık öğesi de değişir (yayında uyarı). Çok satırlı listeler (seçenekler, dayanak) alandan
   çıkınca işlenir — yazarken satır sonu kaybolmasın. */
import { useState } from "react";
import { Alan, FormIzgara, Girdi } from "../../../components/form/Form";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Tus } from "../../../components/tus/Tus";
import { SINIR_ISARETI } from "../../../format/hesap";
import { SINIRLAR, type Bolum, type BolumOf, type FormatTanimi } from "../../../format/tanim";
import { EN_TR, EXCEL_ISLEVLERI } from "../../../format/excel";
import { FORMUL_EN_UZUN, formulDenet, genelAdlar, OZEL_ISLEV_TARIFI, tabloAdlari } from "../../../format/formul";
import { etkinKurallar, kuralOzu, varsayilanKurallar } from "../../../format/sonuc";
import { KURAL_EN_COK, type SonucKurali } from "../../../format/tanim";
import {
  bakanlikKuralinaDon, cevaplarYaz, formulAdGruplari, formuleEkle, gorunumYaz, grupEkle, grupSil, grupYaz, notlarYaz, ogeYaz, resmiFormat, satirlar, sonucKuraliYaz,
  type AdGruplari, type NotGirdisi, type OgeTuru, type OgeYamasi,
} from "../kurucu";
import stil from "./format.module.css";

const ALAN_TUR: readonly (readonly [OgeTuru, string])[] = [["metin", "Metin"], ["sayi", "Sayı"], ["tarih", "Tarih"], ["secim", "Seçim (tek)"], ["coklu", "Seçim (çoklu)"], ["evet", "Evet / hayır"]];
const SUTUN_TUR: readonly (readonly [OgeTuru, string])[] = [["sayi", "Sayı"], ["metin", "Metin"], ["secim", "Seçim"], ["evet", "Evet / hayır"]];
const DEGER_TUR: readonly (readonly [OgeTuru, string])[] = [["sayi", "Sayı"], ["metin", "Metin"], ["secim", "Seçim"]];
const SINIR_SECENEK = [["", "Sınır yok"], ...SINIRLAR.map((o) => [o, `${SINIR_ISARETI[o]} ${o === "<=" ? "(en çok)" : o === ">=" ? "(en az)" : o === "<" ? "(küçük)" : "(büyük)"}`] as const)] as const;

/** çok satırlı metin: yazarken kendi durumunda, alandan çıkınca işlenir */
export function SatirAlani({ id, etiket, deger, uygula, ipucu, kapali = false, satir = 4 }:
  { id: string; etiket: string; deger: string; uygula: (s: string) => void; ipucu?: string; kapali?: boolean; satir?: number }) {
  const [taslak, setTaslak] = useState<string | null>(null);
  return (
    <Alan id={id} etiket={etiket} genis sonuc={ipucu}>
      <textarea id={id} className={stil.metin} rows={satir} value={taslak ?? deger} disabled={kapali} aria-describedby={ipucu ? `${id}-ipucu` : undefined}
        onChange={(e) => setTaslak(e.target.value)} onBlur={() => { if (taslak !== null) { uygula(taslak); setTaslak(null); } }} />
    </Alan>
  );
}

/** seçeneklerden "uygun değil" sayılanlar (işaret kutuları) */
function OlumsuzSecici({ ad, secenekler, secili, degis, kapali }: { ad: string; secenekler: readonly (readonly [string, string])[]; secili: readonly string[]; degis: (l: string[]) => void; kapali: boolean }) {
  if (!secenekler.length) return null;
  return (
    <div role="group" aria-label={`${ad} · uygun değil sayılan seçenekler`} className={stil.secenekler}>
      <p className={stil.etiket}>Uygun değil sayılan seçenekler</p>
      {secenekler.map(([v, e]) => (
        <label key={v} className={stil.secenek}>
          <input type="checkbox" checked={secili.includes(v)} disabled={kapali} onChange={(x) => degis(x.target.checked ? [...secili, v] : secili.filter((o) => o !== v))} /><span>{e}</span>
        </label>
      ))}
    </div>
  );
}

/** öğenin özellikleri (bölümün türüne göre); 470: Bakanlık öğesinde de hepsi — değişince yayında uyarı */
export function OgeDuzenleyici({ t, i, b, id, degis }: { t: FormatTanimi; i: number; b: Bolum; id: string; degis: (y: FormatTanimi) => void }) {
  const yaz = (y: OgeYamasi) => degis(ogeYaz(t, i, id, y));
  const k = `kb-${id}`;
  if (b.blok === "bilgi") {
    const a = b.alanlar.find((x) => x.id === id);
    if (!a) return null;
    /* 556: kayıttan gelen ve ekipman bilgisine bağlı alanda da formül */
    if (a.kaynak || a.ekipman) {
      return <div className={stil.duzenleyici}>
        <p className={stil.satir}>{a.ekipman ? "Ekipman kaydına bağlı alan." : "Kayıttan gelen alan."}</p>
        <FormulAlani k={k} deger={a.formul} adlar={genelAdlar(t)} gruplar={formulAdGruplari(t, b, a.ad)} kendi={a.ad} yaz={(f) => yaz({ formul: f })} />
      </div>;
    }
    const secmeli = a.tur === "secim" || a.tur === "coklu";
    return (
      <div className={stil.duzenleyici}>
        <FormIzgara>
          <Alan id={`${k}-ad`} etiket="Ad" zorunlu><Girdi id={`${k}-ad`} value={a.ad} maxLength={200} onChange={(e) => yaz({ ad: e.target.value })} /></Alan>
          <Alan id={`${k}-tur`} etiket="Tür"><SecimAlani id={`${k}-tur`} ad="Tür" deger={a.tur} secenekler={ALAN_TUR} degistir={(v) => yaz({ tur: v as OgeTuru })} /></Alan>
          <Alan id={`${k}-birim`} etiket="Birim"><Girdi id={`${k}-birim`} value={a.birim ?? ""} maxLength={40} onChange={(e) => yaz({ birim: e.target.value })} /></Alan>
        </FormIzgara>
        {secmeli && <SatirAlani id={`${k}-sec`} etiket="Seçenekler" deger={(a.secenekler ?? []).join("\n")} ipucu="Her satıra bir seçenek." uygula={(s) => yaz({ secenekler: satirlar(s, 40, 200) })} />}
        <FormulAlani k={k} deger={a.formul} adlar={genelAdlar(t)} gruplar={formulAdGruplari(t, b, a.ad)} kendi={a.ad} yaz={(f) => yaz({ formul: f })} />
        {!a.formul && <label className={stil.secenek}><input type="checkbox" checked={a.zorunlu} onChange={(e) => yaz({ zorunlu: e.target.checked })} /><span>Zorunlu</span></label>}
        {/* 595 (madde 9): belgede tam satır (verilmemişse çoklu seçim ve uzun seçenek listesi kendiliğinden tam) */}
        <label className={stil.secenek}><input type="checkbox" checked={a.tam ?? (a.tur === "coklu" || (a.secenekler?.length ?? 0) > 3)}
          onChange={(e) => yaz({ tam: e.target.checked })} /><span>Belgede tam satır</span></label>
      </div>
    );
  }
  if (b.blok === "liste") {
    const g = b.gruplar.find((x) => x.maddeler.some((m) => m.id === id)), m = g?.maddeler.find((x) => x.id === id);
    if (!g || !m) return null;
    return (
      <div className={stil.duzenleyici}>
        {m.kilit && <p className={stil.satir}>Bakanlık maddesi: değiştirirseniz yayında uyarı çıkar.</p>}
        <>
          <FormIzgara>
            <Alan id={`${k}-ad`} etiket="Madde metni" zorunlu genis><Girdi id={`${k}-ad`} value={m.metin} maxLength={200} onChange={(e) => yaz({ ad: e.target.value })} /></Alan>
            {b.gruplar.length > 1 && <Alan id={`${k}-grup`} etiket="Grup">
              <SecimAlani id={`${k}-grup`} ad="Grup" deger={g.id} secenekler={b.gruplar.map((x, j) => [x.id, x.ad || `${j + 1}. grup (adsız)`] as const)} degistir={(v) => yaz({ grup: v })} />
            </Alan>}
            <Alan id={`${k}-std`} etiket="Standart / yönetmelik maddesi" genis><Girdi id={`${k}-std`} value={m.std ?? ""} maxLength={200} onChange={(e) => yaz({ std: e.target.value })} /></Alan>
          </FormIzgara>
          <SatirAlani id={`${k}-ack`} etiket="Açıklama (raporda madde bilgisi)" deger={m.aciklama ?? ""} satir={2} uygula={(s) => yaz({ aciklama: s })} />
        </>
        <SatirAlani id={`${k}-tal`} etiket="Talimat (kontrol nasıl yapılır)" deger={m.talimat ?? ""} ipucu="Saha ekranında maddenin yanındaki ünlemden açılır; PDF'e basılmaz." uygula={(s) => yaz({ talimat: s })} />
        {/* 556: maddenin cevabı da formülle (ör. EĞER(MİN([Direnç]) >= 50; "Uygun"; "Uygun değil")) */}
        <FormulAlani k={k} deger={m.formul} adlar={genelAdlar(t)} gruplar={formulAdGruplari(t, b, m.metin)} kendi={m.metin} yaz={(f) => yaz({ formul: f })} />
      </div>
    );
  }
  if (b.blok === "olcum") {
    const c = b.sutunlar.find((x) => x.id === id);
    if (!c) return null;
    const bakanlik = b.kilit && !c.id.startsWith("k_");
    const secenek = c.giris === "evet" ? [["evet", "Evet"], ["hayir", "Hayır"]] as const : (c.secenekler ?? []).map((s) => [s, s] as const);
    return (
      <div className={stil.duzenleyici}>
        {bakanlik && <p className={stil.satir}>Bakanlık sütunu: değiştirirseniz yayında uyarı çıkar.</p>}
        <FormIzgara>
          <Alan id={`${k}-ad`} etiket="Sütun adı" zorunlu><Girdi id={`${k}-ad`} value={c.ad} maxLength={200} onChange={(e) => yaz({ ad: e.target.value })} /></Alan>
          <Alan id={`${k}-tur`} etiket="Giriş"><SecimAlani id={`${k}-tur`} ad="Giriş" deger={c.giris} secenekler={SUTUN_TUR} degistir={(v) => yaz({ tur: v as OgeTuru })} /></Alan>
          <Alan id={`${k}-birim`} etiket="Birim"><Girdi id={`${k}-birim`} value={c.birim ?? ""} maxLength={40} onChange={(e) => yaz({ birim: e.target.value })} /></Alan>
          {c.giris === "sayi" && <SinirAlani k={k} op={c.op} sinir={c.sinir} yaz={yaz} />}
        </FormIzgara>
        {c.giris === "secim" && <SatirAlani id={`${k}-sec`} etiket="Seçenekler" deger={(c.secenekler ?? []).join("\n")} ipucu="Her satıra bir seçenek (ör. U, UD, UG)." uygula={(s) => yaz({ secenekler: satirlar(s) })} />}
        <FormulAlani k={k} deger={c.formul} adlar={tabloAdlari(t, b)} gruplar={formulAdGruplari(t, b, c.ad)} kendi={c.ad} yaz={(f) => yaz({ formul: f })} tablo />
        {(c.giris === "secim" || c.giris === "evet") && <OlumsuzSecici ad={c.ad} secenekler={secenek} secili={c.olumsuz ?? []} degis={(l) => yaz({ olumsuz: l })} kapali={false} />}
        <div className={stil.secenekler}>
          <label className={stil.secenek}><input type="checkbox" checked={c.zorunlu} onChange={(e) => yaz({ zorunlu: e.target.checked })} /><span>Zorunlu</span></label>
          <label className={stil.secenek}><input type="checkbox" checked={c.agir} onChange={(e) => yaz({ agir: e.target.checked })} /><span>Uygun değilse ağır kusur</span></label>
        </div>
      </div>
    );
  }
  if (b.blok === "test") {
    const d = b.degerler.find((x) => x.id === id);
    if (!d) return null;
    const tur: OgeTuru = d.secenekler?.length ? "secim" : d.metin ? "metin" : "sayi";
    return (
      <div className={stil.duzenleyici}>
        {d.kilit && <p className={stil.satir}>Bakanlık değeri: değiştirirseniz yayında uyarı çıkar.</p>}
        <FormIzgara>
          <Alan id={`${k}-ad`} etiket="Değer adı" zorunlu><Girdi id={`${k}-ad`} value={d.ad} maxLength={200} onChange={(e) => yaz({ ad: e.target.value })} /></Alan>
          <Alan id={`${k}-tur`} etiket="Giriş"><SecimAlani id={`${k}-tur`} ad="Giriş" deger={tur} secenekler={DEGER_TUR} degistir={(v) => yaz({ tur: v as OgeTuru })} /></Alan>
          <Alan id={`${k}-birim`} etiket="Birim"><Girdi id={`${k}-birim`} value={d.birim ?? ""} maxLength={40} onChange={(e) => yaz({ birim: e.target.value })} /></Alan>
          {tur === "sayi" && <SinirAlani k={k} op={d.op} sinir={d.sinir} yaz={yaz} />}
          <Alan id={`${k}-not`} etiket="Not (sınırın yanında)"><Girdi id={`${k}-not`} value={d.not ?? ""} maxLength={120} onChange={(e) => yaz({ not: e.target.value })} /></Alan>
        </FormIzgara>
        {tur === "secim" && <SatirAlani id={`${k}-sec`} etiket="Seçenekler" deger={(d.secenekler ?? []).join("\n")} ipucu="Her satıra bir seçenek (ör. Not 1: Uygun)." uygula={(s) => yaz({ secenekler: satirlar(s) })} />}
        {tur === "secim" && <OlumsuzSecici ad={d.ad} secenekler={(d.secenekler ?? []).map((s) => [s, s] as const)} secili={d.olumsuz ?? []} degis={(l) => yaz({ olumsuz: l })} kapali={false} />}
        <FormulAlani k={k} deger={d.formul} adlar={genelAdlar(t)} gruplar={formulAdGruplari(t, b, d.ad)} kendi={d.ad} yaz={(f) => yaz({ formul: f })} />
        <div className={stil.secenekler}>
          <label className={stil.secenek}><input type="checkbox" checked={d.zorunlu} onChange={(e) => yaz({ zorunlu: e.target.checked })} /><span>Zorunlu</span></label>
          <label className={stil.secenek}><input type="checkbox" checked={d.agir} onChange={(e) => yaz({ agir: e.target.checked })} /><span>Uygun değilse ağır kusur</span></label>
        </div>
      </div>
    );
  }
  return null;
}

/** 495 → 556 (sunum 556 · 2. tur — reisim: "istediğim hesabı istediğim gibi yapabilmeliyim kısıtlama olmamalı"): kutunun formülü — her kutuda;
    Excel'in işlevleri (Türkçe ya da İngilizce adıyla — format/excel.ts), formatın her kutusunun adı; ada / işarete / işleve basınca imlecin yerine
    eklenir; yazarken denetlenir (format/formul.ts formulDenet); alandan çıkınca işlenir. Sahada kutu formülle dolar, denetçi değiştirebilir.
    2026-10-16 (reisim: "hesaplama tuşuna basınca bir sürü değer çıkıyor … her birimin kendi tablosundaki değerler çıksın, diğer değerler diğer olarak
    gözüksün tıklayıp açılan listeden seçilebilsin"): tuş olarak yalnız öğenin bölümünün (tabloda tablonun) adları; formatın öteki kutuları "Diğer"
    açılır listesinde bölüm bölüm, aranır (kurucu.ts formulAdGruplari). Tablonun sonuç kuralı da bu alanla yazılır (etiket, ipucu, işlevler). */
const SIK_ISLEVLER = ["EĞER", "VE", "YADA", "TOPLA", "ORTALAMA", "MİN", "MAK", "YUVARLA", "KAREKÖK", "EĞERSAY", "ETOPLA", "SERİTARİH", "BİRLEŞTİR", "DÜŞEYARA", "SÜTUN"];
const KURAL_ISLEVLERI = ["EĞER", "VE", "YADA", "ESAYIYSA", "EBOŞSA", "BAĞ_DEĞ_SAY", "MİN", "MAK", "YUVARLA", "ZS"];
const ISARETLER = ["+", "−", "×", "÷", "^", "%", "(", ")", ";", "&", "=", "<>", "<", ">", "<=", ">=", "\"\""];
function FormulAlani({ k, deger, adlar, gruplar, kendi, yaz, tablo = false, etiket = "Formül", ipucu, islevler = SIK_ISLEVLER }: {
  k: string; deger?: string; adlar: readonly string[]; gruplar: AdGruplari; kendi: string; yaz: (formul: string) => void; tablo?: boolean; etiket?: string;
  ipucu?: string; islevler?: readonly string[];
}) {
  const [taslak, setTaslak] = useState<string | null>(null);
  const [ara, setAra] = useState("");
  const [digerAra, setDigerAra] = useState("");
  const id = `${k}-formul`, metin = taslak ?? deger ?? "";
  const hata = metin.trim() ? formulDenet(metin, adlar, kendi || undefined) : null;
  const ekle = (s: string) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    const { formul: y, imlec } = formuleEkle(metin, el?.selectionStart ?? metin.length, el?.selectionEnd ?? metin.length, s);
    setTaslak(null); yaz(y);
    const geri = s === "\"\"" ? 1 : 0;
    requestAnimationFrame(() => { const g = document.getElementById(id) as HTMLInputElement | null; g?.focus(); g?.setSelectionRange(imlec - geri, imlec - geri); });
  };
  const ic = (x: string, q: string) => x.toLocaleLowerCase("tr").includes(q);
  /* aranınca: adı geçen kutular (öteki bölümler ve uzun madde metinleri dahil) ve işlevler; aranmazken bölümün kısa adlı kutuları ve sık işlevler */
  const q = ara.trim().toLocaleLowerCase("tr");
  const hepsi = [...gruplar.kendi, ...gruplar.diger.flatMap((g) => g.adlar)];
  const adTuslari = q ? hepsi.filter((x) => ic(x, q)).slice(0, 20) : gruplar.kendi.filter((x) => x.length <= 40);
  const ozel = Object.keys(OZEL_ISLEV_TARIFI);
  const islevTuslari = q ? [...ozel.filter((x) => ic(x, q)), ...EXCEL_ISLEVLERI.filter((en) => ic(en, q) || ic(EN_TR[en] ?? "", q)).slice(0, 40).map((en) => EN_TR[en] ?? en)]
    : islevler;
  const dq = digerAra.trim().toLocaleLowerCase("tr");
  const diger = gruplar.diger.map((g) => ({ ...g, adlar: dq ? g.adlar.filter((x) => ic(x, dq) || ic(g.bolum, dq)) : g.adlar })).filter((g) => g.adlar.length);
  const digerSayisi = gruplar.diger.reduce((t, g) => t + g.adlar.length, 0);
  return (
    <div className={stil.formul}>
      <Alan id={id} etiket={etiket} genis hata={hata ?? undefined} sonuc={hata ? undefined : ipucu}>
        <Girdi id={id} value={metin} maxLength={FORMUL_EN_UZUN} hata={!!hata} mesajli spellCheck={false} autoComplete="off"
          onChange={(e) => setTaslak(e.target.value)} onBlur={() => { if (taslak === null) return; yaz(taslak); setTaslak(null); }} />
      </Alan>
      <div className={stil.formulAdlar} role="group" aria-label={tablo ? "Formüle ekle: bu tablonun sütunları" : "Formüle ekle: bu bölümün kutuları"}>
        {adTuslari.map((x) => <button key={`a-${x}`} type="button" className={stil.formulTus} onClick={() => ekle(`[${x}]`)}>{x}</button>)}
      </div>
      {digerSayisi > 0 && (
        <details className={stil.formulDiger}>
          <summary>Diğer kutular ({digerSayisi})</summary>
          <div className={stil.formulDigerIc}>
            <label className="gizli" htmlFor={`${k}-formul-diger-ara`}>Diğer kutularda ara</label>
            <input id={`${k}-formul-diger-ara`} className={stil.formulAra} type="search" value={digerAra} placeholder="Diğer kutularda ara" autoComplete="off"
              onChange={(e) => setDigerAra(e.target.value)} />
            {diger.map((g) => (
              <div key={g.bolum} role="group" aria-label={`Formüle ekle: ${g.bolum}`}>
                <p className={stil.formulGrupAdi}>{g.bolum}</p>
                <div className={stil.formulAdlar}>
                  {g.adlar.map((x) => (
                    <button key={`d-${x}`} type="button" className={stil.formulTus} title={x} onClick={() => ekle(`[${x}]`)}>{x.length > 60 ? `${x.slice(0, 58)}…` : x}</button>
                  ))}
                </div>
              </div>
            ))}
            {!diger.length && <p className={stil.formulGrupAdi}>Aranan kutu yok.</p>}
          </div>
        </details>
      )}
      <div className={stil.formulAdlar} role="group" aria-label="Formüle ekle: işaretler">
        {ISARETLER.map((o) => <button key={`o-${o}`} type="button" className={stil.formulTus} aria-label={`Formüle ekle: ${o === "\"\"" ? "tırnak" : o}`} onClick={() => ekle(o)}>{o}</button>)}
      </div>
      <div className={stil.formulAdlar} role="group" aria-label="Formüle ekle: işlevler">
        {islevTuslari.map((x) => <button key={`f-${x}`} type="button" className={`${stil.formulTus} ${stil.formulIslev}`} title={OZEL_ISLEV_TARIFI[x]} onClick={() => ekle(`${x}(`)}>{x}</button>)}
        <label className="gizli" htmlFor={`${k}-formul-ara`}>Kutu ya da işlev ara</label>
        <input id={`${k}-formul-ara`} className={stil.formulAra} type="search" value={ara} placeholder="Kutu ya da işlev ara" autoComplete="off" onChange={(e) => setAra(e.target.value)} />
      </div>
    </div>
  );
}

/** 2026-10-16 (pkproje §9 "SONUÇ KURALI FORMAT YAPICIDA" — reisim: "kurala göre otomatik uygun uygun değil diyor, ama ilgili ayar buradan
    yapılamıyor … format yapıcıya koyalım"): ölçüm tablosunun SONUÇ KURALI (tablonun bölüm ayarında). Kural kural formül (bu tablonun sütunları,
    formatın kutuları, ZS), sağlanmazsa yazılacak neden, sahadaki açıklama, ağır kusur; kural ekle / kaldır; bütün kuralları kaldır (kendiliğinden
    sonuç yok); Bakanlık tablosunda "Bakanlık kuralına dön". Değerlendirme src/format/sonuc.ts — saha ekranı ve belge aynı kuralla. */
export function SonucKuraliDuzenleyici({ t, i, b, degis }: { t: FormatTanimi; i: number; b: BolumOf<"olcum">; degis: (y: FormatTanimi) => void }) {
  const kurallar = etkinKurallar(t, b);
  const yaz = (l: readonly SonucKurali[]) => degis(sonucKuraliYaz(t, i, l));
  const kuralYaz = (j: number, y: Partial<SonucKurali>) => yaz(kurallar.map((x, z) => (z === j ? { ...x, ...y } : x)));
  const bakanlik = !!b.hesap && kuralOzu(kurallar) === kuralOzu(varsayilanKurallar(t, b));
  const adlar = tabloAdlari(t, b), gruplar = formulAdGruplari(t, b);
  const kk = `kb-${b.id}-kural`;
  return (
    <div className={stil.duzenleyici} role="group" aria-label={`${b.ad} · sonuç kuralı`}>
      <p className={stil.etiket}>Sonuç kuralı ({kurallar.length}){b.hesap ? (bakanlik ? " — Bakanlık kuralı" : " — Bakanlık kuralı değiştirildi") : ""}</p>
      <p className={stil.satir}>Satırın Sonuç sütunu bu kurallarla kendiliğinden çıkar: kural DOĞRU ise sağlanır, YANLIŞ ise satır “Uygun değil” olur
        (nedeni satırda ve kusurlarda yazar). Kural “Uygun” ya da “Uygun değil: neden” de yazabilir. Değeri boş olan (ölçülmemiş) kural değerlendirilmez;
        sayı sütununa yazılan yazı boş sayılır. Kural yoksa Sonuç’u denetçi seçer; sütun sınırları ve “uygun değil” seçenekleri yine geçerli.
        {b.notlar?.length ? " Bu tabloda uygunluk notu var: kusuru satırda seçilen not belirler." : ""}</p>
      {kurallar.length > 0 && (
        <ol className={stil.kurucuOgeler}>
          {kurallar.map((x, j) => (
            <li key={j} className={`${stil.grupSatir} ${stil.kural}`}>
              <FormulAlani k={`${kk}${j}`} etiket={`${j + 1}. kural`} deger={x.kosul} adlar={adlar} gruplar={gruplar} kendi="" tablo islevler={KURAL_ISLEVLERI}
                ipucu="DOĞRU / YANLIŞ veren formül, örn. [Direnç] > 50 ya da [Zx] <= ZS([Açma eğrisi]; [In])." yaz={(f) => kuralYaz(j, { kosul: f })} />
              <FormIzgara>
                <Alan id={`${kk}${j}-neden`} etiket="Sağlanmazsa neden" genis sonuc="Satırda ve kusurlarda yazar. “=” ile başlarsa formül, örn. =“Zx ” & [Zx].">
                  <MetinGirdisi id={`${kk}${j}-neden`} deger={x.neden ?? ""} uzun={2000} uygula={(v) => kuralYaz(j, { neden: v })} />
                </Alan>
                <Alan id={`${kk}${j}-aciklama`} etiket="Açıklama (sahada “Sonuç neye göre çıkar?”)" genis>
                  <MetinGirdisi id={`${kk}${j}-aciklama`} deger={x.aciklama ?? ""} uzun={400} uygula={(v) => kuralYaz(j, { aciklama: v })} />
                </Alan>
              </FormIzgara>
              <div className={stil.kuralTuslari}>
                <label className={stil.secenek}><input type="checkbox" checked={!!x.agir} onChange={(e) => kuralYaz(j, { agir: e.target.checked })} /><span>Sağlanmazsa ağır kusur</span></label>
                <Tus tur="ikincil" ikon="x" onClick={() => yaz(kurallar.filter((_, z) => z !== j))}>{`${j + 1}. kuralı kaldır`}</Tus>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className={stil.kuralTuslari}>
        {kurallar.length < KURAL_EN_COK && <Tus tur="ikincil" ikon="plus" onClick={() => yaz([...kurallar, { kosul: "" }])}>Kural ekle</Tus>}
        {kurallar.length > 0 && <Tus tur="ikincil" ikon="trash-2" onClick={() => yaz([])}>Kuralları kaldır (sonucu denetçi seçer)</Tus>}
        {b.hesap && !bakanlik && <Tus tur="ikincil" ikon="rotate-ccw" onClick={() => degis(bakanlikKuralinaDon(t, i))}>Bakanlık kuralına dön</Tus>}
      </div>
      {b.hesap === "nokta" && <p className={stil.satir}>Uygunluk notu önerisi (satırdaki “Öneri: Not-…”) Bakanlık kuralıyla (ZPKK01) çıkar, burada değişmez:
        Zx ≤ Zs ise Not-1 (32 A’e kadar prizde RCD yoksa Not-5), aşıyorsa RCD varsa Not-4, yoksa Not-2 (ağır).</p>}
      <p className={stil.satir}>{OZEL_ISLEV_TARIFI.ZS}</p>
    </div>
  );
}

/** tek satırlık metin: yazarken kendi durumunda, alandan çıkınca işlenir */
function MetinGirdisi({ id, deger, uzun, uygula }: { id: string; deger: string; uzun: number; uygula: (s: string) => void }) {
  const [taslak, setTaslak] = useState<string | null>(null);
  return <Girdi id={id} value={taslak ?? deger} maxLength={uzun} onChange={(e) => setTaslak(e.target.value)} onBlur={() => { if (taslak !== null) { uygula(taslak); setTaslak(null); } }} />;
}

/** sayı sütunu / değeri için sınır: kural + değer (değer alandan çıkınca işlenir) */
function SinirAlani({ k, op, sinir, yaz }: { k: string; op?: string; sinir?: number; yaz: (y: OgeYamasi) => void }) {
  const [taslak, setTaslak] = useState<string | null>(null);
  return <>
    <Alan id={`${k}-op`} etiket="Sınır"><SecimAlani id={`${k}-op`} ad="Sınır" deger={op ?? ""} secenekler={SINIR_SECENEK} degistir={(v) => yaz({ op: v as OgeYamasi["op"] })} /></Alan>
    {op && <Alan id={`${k}-sinir`} etiket="Sınır değeri">
      <Girdi id={`${k}-sinir`} inputMode="decimal" maxLength={12} value={taslak ?? (sinir === undefined ? "" : String(sinir).replace(".", ","))}
        onChange={(e) => setTaslak(e.target.value)}
        onBlur={() => { if (taslak === null) return; const n = Number.parseFloat(taslak.replace(",", ".")); yaz({ sinir: Number.isFinite(n) ? n : null }); setTaslak(null); }} />
    </Alan>}
  </>;
}

/** kontrol listesinin grupları (ad, talimat, boşsa sil), grup ekle, cevap seti */
export function ListeDuzenleyici({ t, i, b, degis }: { t: FormatTanimi; i: number; b: BolumOf<"liste">; degis: (y: FormatTanimi) => void }) {
  const [yeni, setYeni] = useState("");
  return (
    <div className={stil.duzenleyici}>
      <p className={stil.etiket}>Gruplar ({b.gruplar.length})</p>
      <ol className={stil.kurucuOgeler}>
        {b.gruplar.map((g, j) => {
          const resmi = b.kilit && g.maddeler.some((m) => m.kilit);
          return (
            <li key={g.id} className={stil.grupSatir}>
              <FormIzgara>
                <Alan id={`kb-${g.id}-ad`} etiket={`${j + 1}. grup adı`} sonuc={resmi ? "Bakanlık grubu: değiştirirseniz yayında uyarı çıkar." : undefined}>
                  <Girdi id={`kb-${g.id}-ad`} value={g.ad} maxLength={200} mesajli={resmi} onChange={(e) => degis(grupYaz(t, i, g.id, { ad: e.target.value }))} />
                </Alan>
              </FormIzgara>
              <SatirAlani id={`kb-${g.id}-tal`} etiket={`${j + 1}. grup talimatı`} deger={g.talimat ?? ""} satir={2} ipucu="Grup başlığındaki ünlemden açılır." uygula={(s) => degis(grupYaz(t, i, g.id, { talimat: s }))} />
              {!g.maddeler.length && b.gruplar.length > 1 && <Tus tur="ikincil" ikon="trash-2" onClick={() => degis(grupSil(t, i, g.id))}>Boş grubu sil</Tus>}
            </li>
          );
        })}
      </ol>
      <div className={stil.ekleSatir}>
        <Girdi id={`kb-${b.id}-grup`} aria-label="Yeni grup adı" maxLength={200} value={yeni} onChange={(e) => setYeni(e.target.value)} />
        <Tus tur="ikincil" ikon="plus" onClick={() => { degis(grupEkle(t, i, yeni)); setYeni(""); }}>Grup ekle</Tus>
      </div>
      <SatirAlani id={`kb-${b.id}-cevap`} etiket="Cevap seti" deger={b.cevaplar.join("\n")} satir={3}
        ipucu={b.kilit ? "Bakanlık bölümü: değiştirirseniz yayında uyarı çıkar. Her satıra bir cevap (2–6)." : "Her satıra bir cevap (2–6). İkinci cevap olumsuz (kusur) sayılır."} uygula={(s) => degis(cevaplarYaz(t, i, satirlar(s, 6, 40)))} />
    </div>
  );
}

/** ölçüm tablosunun uygunluk notları (Not-1 …): metin, kusur mu, ağır mı */
export function NotDuzenleyici({ t, i, b, degis }: { t: FormatTanimi; i: number; b: BolumOf<"olcum">; degis: (y: FormatTanimi) => void }) {
  const notlar: NotGirdisi[] = (b.notlar ?? []).map((n) => ({ metin: n.metin, kusur: n.kusur, agir: n.agir }));
  const yaz = (l: NotGirdisi[]) => degis(notlarYaz(t, i, l));
  return (
    <div className={stil.duzenleyici}>
      <p className={stil.etiket}>Uygunluk notları ({notlar.length}) — denetçi satır başına not seçer{b.kilit ? " · Bakanlık notları: değiştirirseniz yayında uyarı çıkar" : ""}</p>
      <ol className={stil.kurucuOgeler}>
        {notlar.map((n, j) => (
          <li key={j} className={stil.grupSatir}>
            <FormIzgara>
              <Alan id={`kb-${b.id}-not${j}`} etiket={`Not-${j + 1}`} genis><Girdi id={`kb-${b.id}-not${j}`} value={n.metin} maxLength={400} onChange={(e) => yaz(notlar.map((x, z) => (z === j ? { ...x, metin: e.target.value } : x)))} /></Alan>
            </FormIzgara>
            <div className={stil.secenekler}>
              <label className={stil.secenek}><input type="checkbox" checked={n.kusur} onChange={(e) => yaz(notlar.map((x, z) => (z === j ? { ...x, kusur: e.target.checked } : x)))} /><span>Kusur</span></label>
              <label className={stil.secenek}><input type="checkbox" checked={n.agir} disabled={!n.kusur} onChange={(e) => yaz(notlar.map((x, z) => (z === j ? { ...x, agir: e.target.checked } : x)))} /><span>Ağır kusur</span></label>
              <Tus tur="ikincil" ikon="x" onClick={() => yaz(notlar.filter((_, z) => z !== j))}>Notu çıkar</Tus>
            </div>
          </li>
        ))}
      </ol>
      <Tus tur="ikincil" ikon="plus" onClick={() => yaz([...notlar, { metin: `Not-${notlar.length + 1}`, kusur: false, agir: false }])}>Not ekle</Tus>
    </div>
  );
}

/** sonuç bölümünün sabit metni (ağır kusurlar tanımı, açıklamalar) — 470: Bakanlık bölümünde de yazılır, yayında uyarı */
export function SonucAciklamasi({ t, i, b, degis }: { t: FormatTanimi; i: number; b: BolumOf<"sonuc">; degis: (y: FormatTanimi) => void }) {
  return <SatirAlani id={`kb-${b.id}-aciklama`} etiket="Sonuç açıklaması (ağır kusurlar tanımı, açıklamalar)" deger={b.aciklama} satir={5}
    ipucu={b.kilit ? "Bakanlık bölümü: değiştirirseniz yayında uyarı çıkar. PDF'te sonuç cümlesinin altında." : "PDF'te sonuç cümlesinin altında, satır satır."}
    uygula={(s) => degis({ ...t, bolumler: t.bolumler.map((x, j) => (j === i && x.blok === "sonuc" ? { ...x, aciklama: s.slice(0, 4000) } : x)) })} />;
}

const GID = { formKodu: "kb-formkodu", baslik: "kb-belgeadi" } as const;
/** görünüm: form kodu, başlık, metot ve kapsam, genel muayene talimatı (470: Bakanlık formatında kod ve başlık da değişir, yayında uyarı) */
export function GorunumDuzenleyici({ t, degis }: { t: FormatTanimi; degis: (y: FormatTanimi) => void }) {
  const resmi = resmiFormat(t);
  return (
    <div className={stil.duzenleyici}>
      <FormIzgara>
        <Alan id={GID.formKodu} etiket="Form kodu" sonuc={resmi ? "Bakanlık formatı: değiştirirseniz yayında uyarı çıkar." : "Boşsa firma kodundan üretilir."}>
          <Girdi id={GID.formKodu} value={t.gorunum.formKodu} maxLength={20} mesajli onChange={(e) => degis(gorunumYaz(t, { formKodu: e.target.value }))} />
        </Alan>
        <Alan id={GID.baslik} etiket="Belge başlığı" genis sonuc={resmi ? "Bakanlık formatı: değiştirirseniz yayında uyarı çıkar." : undefined}>
          <Girdi id={GID.baslik} value={t.gorunum.baslik} maxLength={200} mesajli={resmi} onChange={(e) => degis(gorunumYaz(t, { baslik: e.target.value }))} />
        </Alan>
      </FormIzgara>
      <SatirAlani id="kb-dayanak" etiket="Periyodik kontrol metodu ve kapsamı" deger={t.gorunum.dayanak.join("\n")} ipucu="Her satıra bir standart / yönetmelik (PDF'te 1. bölümde)." uygula={(s) => degis(gorunumYaz(t, { dayanak: satirlar(s, 20, 300) }))} />
      <SatirAlani id="kb-genel" etiket="Genel muayene talimatı" deger={t.gorunum.talimat} satir={5} ipucu="Rapor ekranının sağ üstündeki ünlemden açılır; PDF'e basılmaz." uygula={(s) => degis(gorunumYaz(t, { talimat: s }))} />
    </div>
  );
}
