"use client";
/* FORMAT KURUCU · DÜZENLEYİCİLER (426; reisim 2026-10-09: "bir kullanıcı da bu ve benzeri rapor formatlarını isterse kendi eli ile format
   yapıcıdan yapabileceği şekilde format yapıcıyı düzenle"). Öğe düzenleyici (alan / madde / sütun / değer — tür, seçenekler, uygun değil sayılan
   seçenekler, ağır kusur, sınır, birim, zorunlu, standart, açıklama, talimat, grup), kontrol listesinin grupları ve cevap seti, ölçüm tablosunun
   uygunluk notları, sonuç bölümünün sabit metni, görünüm (form kodu, başlık, metot ve kapsam, genel muayene talimatı). Değişiklik saf
   işlevlerle (../kurucu.ts) taslağa yazılır; kilitli (Bakanlık) öğede yalnız talimat yazılır. Çok satırlı listeler (seçenekler, dayanak) alandan
   çıkınca işlenir — yazarken satır sonu kaybolmasın. */
import { useState } from "react";
import { Alan, FormIzgara, Girdi } from "../../../components/form/Form";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Tus } from "../../../components/tus/Tus";
import { SINIR_ISARETI } from "../../../format/hesap";
import { SINIRLAR, type Bolum, type BolumOf, type FormatTanimi } from "../../../format/tanim";
import { cevaplarYaz, gorunumYaz, grupEkle, grupSil, grupYaz, notlarYaz, ogeYaz, resmiFormat, satirlar, type NotGirdisi, type OgeTuru, type OgeYamasi } from "../kurucu";
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

/** öğenin özellikleri (bölümün türüne göre); kilitli öğede yalnız talimat */
export function OgeDuzenleyici({ t, i, b, id, degis }: { t: FormatTanimi; i: number; b: Bolum; id: string; degis: (y: FormatTanimi) => void }) {
  const yaz = (y: OgeYamasi) => degis(ogeYaz(t, i, id, y));
  const k = `kb-${id}`;
  if (b.blok === "bilgi") {
    const a = b.alanlar.find((x) => x.id === id);
    if (!a) return null;
    if (a.kilit || a.kaynak) return <p className={stil.satir}>{a.kaynak ? "Kayıttan gelen alan: yalnız adı değişir." : "Bakanlık alanı: değişmez."}</p>;
    const secmeli = a.tur === "secim" || a.tur === "coklu";
    return (
      <div className={stil.duzenleyici}>
        <FormIzgara>
          <Alan id={`${k}-ad`} etiket="Ad" zorunlu><Girdi id={`${k}-ad`} value={a.ad} maxLength={200} onChange={(e) => yaz({ ad: e.target.value })} /></Alan>
          <Alan id={`${k}-tur`} etiket="Tür"><SecimAlani id={`${k}-tur`} ad="Tür" deger={a.tur} secenekler={ALAN_TUR} degistir={(v) => yaz({ tur: v as OgeTuru })} /></Alan>
          <Alan id={`${k}-birim`} etiket="Birim"><Girdi id={`${k}-birim`} value={a.birim ?? ""} maxLength={40} onChange={(e) => yaz({ birim: e.target.value })} /></Alan>
        </FormIzgara>
        {secmeli && <SatirAlani id={`${k}-sec`} etiket="Seçenekler" deger={(a.secenekler ?? []).join("\n")} ipucu="Her satıra bir seçenek." uygula={(s) => yaz({ secenekler: satirlar(s, 40, 200) })} />}
        <label className={stil.secenek}><input type="checkbox" checked={a.zorunlu} onChange={(e) => yaz({ zorunlu: e.target.checked })} /><span>Zorunlu</span></label>
      </div>
    );
  }
  if (b.blok === "liste") {
    const g = b.gruplar.find((x) => x.maddeler.some((m) => m.id === id)), m = g?.maddeler.find((x) => x.id === id);
    if (!g || !m) return null;
    return (
      <div className={stil.duzenleyici}>
        {m.kilit ? <p className={stil.satir}>Bakanlık maddesi: metni ve standardı değişmez; talimat yazılır.</p> : <>
          <FormIzgara>
            <Alan id={`${k}-ad`} etiket="Madde metni" zorunlu genis><Girdi id={`${k}-ad`} value={m.metin} maxLength={200} onChange={(e) => yaz({ ad: e.target.value })} /></Alan>
            {b.gruplar.length > 1 && <Alan id={`${k}-grup`} etiket="Grup">
              <SecimAlani id={`${k}-grup`} ad="Grup" deger={g.id} secenekler={b.gruplar.map((x, j) => [x.id, x.ad || `${j + 1}. grup (adsız)`] as const)} degistir={(v) => yaz({ grup: v })} />
            </Alan>}
            <Alan id={`${k}-std`} etiket="Standart / yönetmelik maddesi" genis><Girdi id={`${k}-std`} value={m.std ?? ""} maxLength={200} onChange={(e) => yaz({ std: e.target.value })} /></Alan>
          </FormIzgara>
          <SatirAlani id={`${k}-ack`} etiket="Açıklama (raporda madde bilgisi)" deger={m.aciklama ?? ""} satir={2} uygula={(s) => yaz({ aciklama: s })} />
        </>}
        <SatirAlani id={`${k}-tal`} etiket="Talimat (kontrol nasıl yapılır)" deger={m.talimat ?? ""} ipucu="Saha ekranında maddenin yanındaki ünlemden açılır; PDF'e basılmaz." uygula={(s) => yaz({ talimat: s })} />
      </div>
    );
  }
  if (b.blok === "olcum") {
    const c = b.sutunlar.find((x) => x.id === id);
    if (!c) return null;
    const kapali = b.kilit && !c.id.startsWith("k_");
    if (kapali) return <p className={stil.satir}>Bakanlık sütunu: değişmez.</p>;
    const secenek = c.giris === "evet" ? [["evet", "Evet"], ["hayir", "Hayır"]] as const : (c.secenekler ?? []).map((s) => [s, s] as const);
    return (
      <div className={stil.duzenleyici}>
        <FormIzgara>
          <Alan id={`${k}-ad`} etiket="Sütun adı" zorunlu><Girdi id={`${k}-ad`} value={c.ad} maxLength={200} onChange={(e) => yaz({ ad: e.target.value })} /></Alan>
          <Alan id={`${k}-tur`} etiket="Giriş"><SecimAlani id={`${k}-tur`} ad="Giriş" deger={c.giris} secenekler={SUTUN_TUR} degistir={(v) => yaz({ tur: v as OgeTuru })} /></Alan>
          <Alan id={`${k}-birim`} etiket="Birim"><Girdi id={`${k}-birim`} value={c.birim ?? ""} maxLength={40} onChange={(e) => yaz({ birim: e.target.value })} /></Alan>
          {c.giris === "sayi" && <SinirAlani k={k} op={c.op} sinir={c.sinir} yaz={yaz} />}
        </FormIzgara>
        {c.giris === "secim" && <SatirAlani id={`${k}-sec`} etiket="Seçenekler" deger={(c.secenekler ?? []).join("\n")} ipucu="Her satıra bir seçenek (ör. U, UD, UG)." uygula={(s) => yaz({ secenekler: satirlar(s) })} />}
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
    if (d.kilit) return <p className={stil.satir}>Bakanlık değeri: değişmez.</p>;
    const tur: OgeTuru = d.secenekler?.length ? "secim" : d.metin ? "metin" : "sayi";
    return (
      <div className={stil.duzenleyici}>
        <FormIzgara>
          <Alan id={`${k}-ad`} etiket="Değer adı" zorunlu><Girdi id={`${k}-ad`} value={d.ad} maxLength={200} onChange={(e) => yaz({ ad: e.target.value })} /></Alan>
          <Alan id={`${k}-tur`} etiket="Giriş"><SecimAlani id={`${k}-tur`} ad="Giriş" deger={tur} secenekler={DEGER_TUR} degistir={(v) => yaz({ tur: v as OgeTuru })} /></Alan>
          <Alan id={`${k}-birim`} etiket="Birim"><Girdi id={`${k}-birim`} value={d.birim ?? ""} maxLength={40} onChange={(e) => yaz({ birim: e.target.value })} /></Alan>
          {tur === "sayi" && <SinirAlani k={k} op={d.op} sinir={d.sinir} yaz={yaz} />}
          <Alan id={`${k}-not`} etiket="Not (sınırın yanında)"><Girdi id={`${k}-not`} value={d.not ?? ""} maxLength={120} onChange={(e) => yaz({ not: e.target.value })} /></Alan>
        </FormIzgara>
        {tur === "secim" && <SatirAlani id={`${k}-sec`} etiket="Seçenekler" deger={(d.secenekler ?? []).join("\n")} ipucu="Her satıra bir seçenek (ör. Not 1: Uygun)." uygula={(s) => yaz({ secenekler: satirlar(s) })} />}
        {tur === "secim" && <OlumsuzSecici ad={d.ad} secenekler={(d.secenekler ?? []).map((s) => [s, s] as const)} secili={d.olumsuz ?? []} degis={(l) => yaz({ olumsuz: l })} kapali={false} />}
        <div className={stil.secenekler}>
          <label className={stil.secenek}><input type="checkbox" checked={d.zorunlu} onChange={(e) => yaz({ zorunlu: e.target.checked })} /><span>Zorunlu</span></label>
          <label className={stil.secenek}><input type="checkbox" checked={d.agir} onChange={(e) => yaz({ agir: e.target.checked })} /><span>Uygun değilse ağır kusur</span></label>
        </div>
      </div>
    );
  }
  return null;
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
                <Alan id={`kb-${g.id}-ad`} etiket={`${j + 1}. grup adı`} sonuc={resmi ? "Bakanlık grubu: adı değişmez." : undefined}>
                  <Girdi id={`kb-${g.id}-ad`} value={g.ad} maxLength={200} disabled={resmi} mesajli={resmi} onChange={(e) => degis(grupYaz(t, i, g.id, { ad: e.target.value }))} />
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
      <SatirAlani id={`kb-${b.id}-cevap`} etiket="Cevap seti" deger={b.cevaplar.join("\n")} kapali={b.kilit} satir={3}
        ipucu={b.kilit ? "Bakanlık bölümü: cevap seti değişmez." : "Her satıra bir cevap (2–6). İkinci cevap olumsuz (kusur) sayılır."} uygula={(s) => degis(cevaplarYaz(t, i, satirlar(s, 6, 40)))} />
    </div>
  );
}

/** ölçüm tablosunun uygunluk notları (Not-1 …): metin, kusur mu, ağır mı */
export function NotDuzenleyici({ t, i, b, degis }: { t: FormatTanimi; i: number; b: BolumOf<"olcum">; degis: (y: FormatTanimi) => void }) {
  const notlar: NotGirdisi[] = (b.notlar ?? []).map((n) => ({ metin: n.metin, kusur: n.kusur, agir: n.agir }));
  const yaz = (l: NotGirdisi[]) => degis(notlarYaz(t, i, l));
  if (b.kilit) return notlar.length ? <p className={stil.satir}>Bakanlık uygunluk notları: değişmez ({notlar.length} not).</p> : null;
  return (
    <div className={stil.duzenleyici}>
      <p className={stil.etiket}>Uygunluk notları ({notlar.length}) — denetçi satır başına not seçer</p>
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

/** sonuç bölümünün sabit metni (ağır kusurlar tanımı, açıklamalar) — kilitli bölümde değişmez */
export function SonucAciklamasi({ t, i, b, degis }: { t: FormatTanimi; i: number; b: BolumOf<"sonuc">; degis: (y: FormatTanimi) => void }) {
  return <SatirAlani id={`kb-${b.id}-aciklama`} etiket="Sonuç açıklaması (ağır kusurlar tanımı, açıklamalar)" deger={b.aciklama} kapali={b.kilit} satir={5}
    ipucu={b.kilit ? "Bakanlık bölümü: metin değişmez." : "PDF'te sonuç cümlesinin altında, satır satır."}
    uygula={(s) => degis({ ...t, bolumler: t.bolumler.map((x, j) => (j === i && x.blok === "sonuc" ? { ...x, aciklama: s.slice(0, 4000) } : x)) })} />;
}

const GID = { formKodu: "kb-formkodu", baslik: "kb-belgeadi" } as const;
/** görünüm: form kodu, başlık, metot ve kapsam, genel muayene talimatı (Bakanlık formatında kod ve başlık değişmez) */
export function GorunumDuzenleyici({ t, degis }: { t: FormatTanimi; degis: (y: FormatTanimi) => void }) {
  const resmi = resmiFormat(t);
  return (
    <div className={stil.duzenleyici}>
      <FormIzgara>
        <Alan id={GID.formKodu} etiket="Form kodu" sonuc={resmi ? "Bakanlık formatı: değişmez." : "Boşsa firma kodundan üretilir."}>
          <Girdi id={GID.formKodu} value={t.gorunum.formKodu} maxLength={20} disabled={resmi} mesajli onChange={(e) => degis(gorunumYaz(t, { formKodu: e.target.value }))} />
        </Alan>
        <Alan id={GID.baslik} etiket="Belge başlığı" genis sonuc={resmi ? "Bakanlık formatı: değişmez." : undefined}>
          <Girdi id={GID.baslik} value={t.gorunum.baslik} maxLength={200} disabled={resmi} mesajli={resmi} onChange={(e) => degis(gorunumYaz(t, { baslik: e.target.value }))} />
        </Alan>
      </FormIzgara>
      <SatirAlani id="kb-dayanak" etiket="Periyodik kontrol metodu ve kapsamı" deger={t.gorunum.dayanak.join("\n")} ipucu="Her satıra bir standart / yönetmelik (PDF'te 1. bölümde)." uygula={(s) => degis(gorunumYaz(t, { dayanak: satirlar(s, 20, 300) }))} />
      <SatirAlani id="kb-genel" etiket="Genel muayene talimatı" deger={t.gorunum.talimat} satir={5} ipucu="Rapor ekranının sağ üstündeki ünlemden açılır; PDF'e basılmaz." uygula={(s) => degis(gorunumYaz(t, { talimat: s }))} />
    </div>
  );
}
