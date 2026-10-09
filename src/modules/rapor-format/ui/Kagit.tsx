"use client";
/* FORMAT KURUCU · KÂĞIT (451; reisim 2026-10-09: "format kurucu hiç kullanışlı değil, mantıksız zor ve karmaşık"; "formatı oluştururken nasıl
   gözükeceği zihnimde canlanmıyor bile") — format RAPORUN KENDİSİNİN ÜSTÜNDE kurulur. Kâğıt, belgenin (src/belge/belge.ts — kesin PDF'le aynı
   çizici) Bakanlık görünümünde (belge.css .rb- sınıfları: başlık tablosu, pembe bölüm şeridi, mavi etiket hücresi, siyah çizgi) ve aynı düzende
   (format/duzen.ts: 1 Firma bilgileri sabit, 2 Ekipman bilgileri, sonra bölümler, aynı numaralar):
   · başlığa, etikete, maddeye, grup adına, sütun başlığına, değer adına, sonuç cümlesine BASILIR ve orada yazılır (Enter ya da dışarı tıklama
     yazar, Esc vazgeçer);
   · "+ Madde ekle", "+ Sütun", "+ Alan ekle", "+ Değer ekle" yerinde yeni satır / sütun açar ve adını yazdırır; "×" çıkarır;
   · ayrıntı (alan türü, seçenekler, sınır, birim, zorunlu, standart, talimat) öğenin ayar tuşundan bölümün altında açılır; bölümün ayarları
     (üst başlık, numarasız, cevap seti, uygunluk notları, fotoğraf sayısı, imza yerleri) bölüm şeridindeki ayar tuşundan;
   · bölüm şeridinde yukarı / aşağı ve sil; bölümler arasında ve sonda "Bölüm ekle".
   Kilitli (Bakanlık) öğe kilit simgeli ve değişmez (sunucu yayında yeniden denetler — ENGEL). 1 Firma bilgileri her formatta aynı (sabit); yalnız
   "Periyodik kontrol metodu ve kapsamı" satırı yazılır. Kâğıdın renkleri belgenin kendi renkleri — açık / koyu temada aynı kâğıt. */
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Ikon } from "../../../components/ikon/Ikon";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { SINIR_ISARETI } from "../../../format/hesap";
import { kayittanBolumMu, raporDuzeni } from "../../../format/duzen";
import { BLOKLAR, Bolum as BolumSema, type Blok, type Bolum, type BolumOf, type FormatTanimi } from "../../../format/tanim";
import {
  bolumAdi, bolumDuzeni, gorunumYaz, grupEkle, grupSil, grupYaz, kurucudan, maddeEkle, ogeEkle, ogeSil, ogeYaz, resmiFormat, satirlar, tasi, yeniBolum, yeniKimlik,
} from "../kurucu";
import { ListeDuzenleyici, NotDuzenleyici, OgeDuzenleyici, SonucAciklamasi } from "./KurucuDuzenleyici";
import { BLOK_ADI } from "./ortak";
import k from "./kagit.module.css";

/** bölüm türünün kısa açıklaması (Bölüm ekle listesinde sağda) */
const BLOK_KISA: Record<Blok, string> = {
  bilgi: "etiket + değer", liste: "maddeler · Uygun / Uygun değil", olcum: "satır satır ölçüm", test: "tek tek değer, sınır", cihaz: "kullanılan cihazlar",
  foto: "fotoğraf kutuları", kusur: "kendiliğinden dolar", sonuc: "uygundur / değildir", not: "uzmanın yorumu", imza: "belgede imza yerleri",
};
const BOLUM_SECENEK = BLOKLAR.map((b) => [b, BLOK_ADI[b], BLOK_KISA[b]] as const);
const virgul = (n: number) => String(n).replace(".", ",");

/* ── YERİNDE YAZI ── düz metin gibi görünür; basınca yazı alanı olur. Tek satırlıda Enter yazar; çok satırlıda Enter yeni satır, dışarı
   tıklama yazar. Esc vazgeçer. Yazılan değer çıkarken işlenir (kırpma yazarken boşluğu yutmasın). */
function Yazi({ deger, yaz, ad, bos = "Yazın", kilit = false, cok = false, ac = false, uzun = 200 }: {
  deger: string; yaz: (s: string) => void; ad: string; bos?: string; kilit?: boolean; cok?: boolean; ac?: boolean; uzun?: number;
}) {
  const [acik, setAcik] = useState(ac);
  const [taslak, setTaslak] = useState(deger);
  const alan = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (acik) { alan.current?.focus(); alan.current?.select(); } }, [acik]);
  if (kilit) return <span className={k.kilitli}>{deger || <span className={k.bos}>{bos}</span>}</span>;
  if (!acik) {
    return (
      <button type="button" className={k.yazi} title="Değiştirmek için basın" onClick={() => { setTaslak(deger); setAcik(true); }}>
        {deger || <span className={k.bos}>{bos}</span>}
      </button>
    );
  }
  const bitir = (yazilsin: boolean) => { setAcik(false); if (yazilsin && taslak !== deger) yaz(taslak); };
  return (
    <textarea ref={alan} className={k.girdi} aria-label={ad} rows={1} maxLength={uzun} value={taslak} onChange={(e) => setTaslak(e.target.value)}
      onBlur={() => bitir(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !cok) { e.preventDefault(); bitir(true); }
        else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); bitir(false); }
      }} />
  );
}

/** kâğıdın üstündeki küçük tuş (ikon + erişilebilir ad) */
function Tus({ ikon, ad, onClick, disabled = false, basili }: { ikon: string; ad: string; onClick: () => void; disabled?: boolean; basili?: boolean }) {
  return (
    <button type="button" className={k.tus} aria-label={ad} title={ad} disabled={disabled} aria-pressed={basili} onClick={onClick}>
      <Ikon ad={ikon} kucuk />
    </button>
  );
}
/** "+ … ekle" (kâğıtta yerinde) */
function Ekle({ ad, onClick, erisimAdi }: { ad: string; onClick: () => void; erisimAdi?: string }) {
  return <button type="button" className={k.ekle} aria-label={erisimAdi} onClick={onClick}><Ikon ad="plus" kucuk />{ad}</button>;
}
const Kilit = () => <span className={k.kilitIkon} title="Bakanlık alanı · değişmez"><Ikon ad="lock" kucuk /><span className="gizli">Bakanlık alanı</span></span>;

/** seçenekler belgedeki gibi (○ A ○ B) */
const Secenekler = ({ l }: { l: readonly string[] }) => <>{l.map((x) => <span key={x} className="rb-sec"><span className="rb-isaret" /> {x}</span>)}</>;

/** bilgi alanının belgedeki boş değeri (türüne göre) */
function AlanOrnegi({ a }: { a: BolumOf<"bilgi">["alanlar"][number] }) {
  if (a.kaynak) return <span className={k.ornek}>kayıttan</span>;
  if (a.tur === "secim" || a.tur === "coklu") return a.secenekler?.length ? <Secenekler l={a.secenekler} /> : <span className={k.ornek}>seçenek yok — ayarlardan</span>;
  if (a.tur === "evet") return <Secenekler l={["Evet", "Hayır"]} />;
  if (a.tur === "tarih") return <span className={k.ornek}>GG.AA.YYYY</span>;
  return <span className={k.ornek}>{a.tur === "sayi" ? "sayı" : "yazı"}{a.birim ? ` · ${a.birim}` : ""}{a.zorunlu ? " · zorunlu" : ""}</span>;
}

type Hucre = readonly [etiket: ReactNode, deger: ReactNode, tam?: boolean];
/** belgedeki iki sütunlu etiket – değer tablosu (belge.ts bilgiTablosu ile aynı dizilim) */
function BilgiTablosu({ l, son }: { l: readonly Hucre[]; son?: ReactNode }) {
  const satir: ReactNode[] = [];
  for (let i = 0; i < l.length; i++) {
    const [e, d, tam] = l[i], s = l[i + 1];
    if (tam || !s || s[2]) satir.push(<tr key={i}><td className="rb-e">{e}</td><td colSpan={3}>{d}</td></tr>);
    else { satir.push(<tr key={i}><td className="rb-e">{e}</td><td>{d}</td><td className="rb-e">{s[0]}</td><td>{s[1]}</td></tr>); i++; }
  }
  if (son) satir.push(<tr key="son" className={k.ekleSatir}><td colSpan={4}>{son}</td></tr>);
  return (
    <table>
      <colgroup><col style={{ width: "22%" }} /><col style={{ width: "28%" }} /><col style={{ width: "22%" }} /><col style={{ width: "28%" }} /></colgroup>
      <tbody>{satir}</tbody>
    </table>
  );
}

export interface KagitOzellik {
  t: FormatTanimi;
  degis: (y: FormatTanimi) => void;
  tur: { ad: string; kod: string };
  /** bölümü sil (onay sorar) */
  bolumuSil: (i: number) => void;
  bildir: (s: string) => void;
}

export function Kagit({ t, degis, tur, bolumuSil, bildir }: KagitOzellik) {
  /* açık ayar: "b:<bölüm>" bölümün ayarları · "o:<bölüm>:<öğe>" öğenin ayrıntıları · "metot" */
  const [ayar, setAyar] = useState<string | null>(null);
  /* yeni eklenen öğe / bölüm: adı yazma kipinde açılır */
  const [yeniId, setYeniId] = useState<string | null>(null);
  const duzen = raporDuzeni(t, false);
  const resmi = resmiFormat(t);
  const sira = (id: string) => t.bolumler.findIndex((b) => b.id === id);
  const ac = (key: string) => setAyar(ayar === key ? null : key);
  const gorunen = duzen.bolumler.map((x) => x.b.id);

  /** yeni öğe: kimliği önceden hesaplanır (ogeEkle aynısını verir), adı yazma kipinde açılır */
  const ogeKoy = (i: number, onek: "a" | "s" | "d", ad: string) => { const id = yeniKimlik(t, onek); degis(ogeEkle(t, i, ad)); setYeniId(id); };
  const maddeKoy = (i: number, gid: string) => { const id = yeniKimlik(t, "m"); degis(maddeEkle(t, i, gid, "Yeni madde")); setYeniId(id); };
  const cikar = (i: number, id: string, ad: string) => { degis(ogeSil(t, i, id)); if (ayar?.endsWith(`:${id}`)) setAyar(null); bildir(`“${ad}” çıkarıldı (taslak).`); };
  /** p: yeni bölümün t.bolumler'deki yeri */
  const bolumKoy = (blok: Blok, p: number) => {
    const b = yeniBolum(t, blok, BLOK_ADI[blok]);
    const l = [...t.bolumler]; l.splice(Math.max(0, Math.min(p, l.length)), 0, b);
    degis({ ...t, bolumler: l }); setYeniId(b.id); bildir(`${BLOK_ADI[blok]} bölümü eklendi (taslak).`);
    requestAnimationFrame(() => document.getElementById(`kb-${b.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
  };
  const tasiGorunen = (id: string, yon: -1 | 1) => {
    const v = gorunen.indexOf(id), hedef = gorunen[v + yon];
    if (!hedef) return;
    degis({ ...t, bolumler: tasi(t.bolumler, sira(id), sira(hedef)) });
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`#kb-${id} [data-yon="${yon}"] button:not([disabled])`)?.focus());
  };

  /** öğe ayrıntıları paneli (bölümün altında) */
  const ogePaneli = (b: Bolum, i: number) => {
    const p = ayar?.startsWith(`o:${b.id}:`) ? ayar.slice(`o:${b.id}:`.length) : null;
    if (!p) return null;
    return (
      <div className={k.panel} role="group" aria-label="Öğenin ayrıntıları">
        <div className={k.panelBas}><b>Ayrıntılar</b><Tus ikon="x" ad="Ayrıntıları kapat" onClick={() => setAyar(null)} /></div>
        <OgeDuzenleyici t={t} i={i} b={b} id={p} degis={degis} />
      </div>
    );
  };
  /** öğe satırının küçük tuşları: ayrıntı · çıkar (kilitliyse kilit) */
  const ogeTuslari = (b: Bolum, i: number, id: string, ad: string, kilit: boolean) => (
    <span className={k.ogeTus}>
      {kilit && <Kilit />}
      <Tus ikon="settings" ad={`${ad} · ayrıntılar`} basili={ayar === `o:${b.id}:${id}`} onClick={() => ac(`o:${b.id}:${id}`)} />
      {!kilit && <Tus ikon="x" ad={`${ad} · çıkar`} onClick={() => cikar(i, id, ad)} />}
    </span>
  );

  /* ── bölümün içeriği (bloğa göre; belgedeki gibi) ── */
  const icerik = (b: Bolum, i: number): ReactNode => {
    switch (b.blok) {
      case "bilgi":
        return <BilgiTablosu l={b.alanlar.map((a) => [
          <span key={a.id} className={k.etiket}><Yazi deger={a.ad} ad="Alan adı" kilit={a.kilit} ac={yeniId === a.id} yaz={(s) => degis(ogeYaz(t, i, a.id, { ad: s }))} />
            {ogeTuslari(b, i, a.id, a.ad, a.kilit)}</span>,
          <AlanOrnegi key={`${a.id}-d`} a={a} />, a.tur === "coklu" || (a.secenekler?.length ?? 0) > 3] as const)}
          son={<Ekle ad="Alan ekle" onClick={() => ogeKoy(i, "a", "Yeni alan")} />} />;
      case "liste": {
        const cok = b.gruplar.length > 1;
        return <>
          <table>
            <colgroup><col style={{ width: "8%" }} /><col style={{ width: "62%" }} /><col style={{ width: "30%" }} /></colgroup>
            <thead><tr><th className="rb-ab">No</th><th className="rb-ab">Kontrol maddesi</th><th className="rb-ab">Sonuç</th></tr></thead>
            <tbody>
              {b.gruplar.map((g, gi) => {
                const resmiGrup = b.kilit && g.maddeler.some((m) => m.kilit);
                return <Fragment key={g.id}>
                  {(cok || g.ad) && <tr><td colSpan={3} className="rb-grup">
                    <span className={k.grupSatir}>
                      <Yazi deger={g.ad} ad="Grup adı" bos="Grup adı (isteğe bağlı)" kilit={resmiGrup} yaz={(s) => degis(grupYaz(t, i, g.id, { ad: s }))} />
                      {cok && !g.maddeler.length && <Tus ikon="x" ad={`${g.ad || `${gi + 1}. grup`} · boş grubu çıkar`} onClick={() => degis(grupSil(t, i, g.id))} />}
                    </span>
                  </td></tr>}
                  {g.maddeler.map((m, mi) => (
                    <tr key={m.id}>
                      <td className="rb-orta">{cok ? `${gi + 1}.${mi + 1}` : mi + 1}</td>
                      <td><span className={k.satir}><Yazi deger={m.metin} ad="Madde metni" kilit={m.kilit} ac={yeniId === m.id} yaz={(s) => degis(ogeYaz(t, i, m.id, { ad: s }))} />
                        {ogeTuslari(b, i, m.id, m.metin, m.kilit)}</span></td>
                      <td><Secenekler l={b.cevaplar} /></td>
                    </tr>
                  ))}
                  <tr className={k.ekleSatir}><td /><td colSpan={2}>
                    <Ekle ad="Madde ekle" erisimAdi={cok ? `Madde ekle (${g.ad || `${gi + 1}. grup`})` : undefined} onClick={() => maddeKoy(i, g.id)} />
                  </td></tr>
                </Fragment>;
              })}
            </tbody>
          </table>
          <div className={k.altSatir}>
            <Ekle ad="Grup ekle" onClick={() => { degis(grupEkle(t, i, "Yeni grup")); bildir("Grup eklendi (taslak); adını yazın."); }} />
            <span className={k.ornek}>Cevaplar: {b.cevaplar.join(" · ")} — bölüm ayarlarından değişir</span>
          </div>
        </>;
      }
      case "olcum": {
        const notlar = b.notlar ?? [];
        const ornek = (s: BolumOf<"olcum">["sutunlar"][number]) => s.giris === "secim" ? (s.secenekler?.join(" / ") || "seçim") : s.giris === "evet" ? "evet / hayır" : s.giris === "metin" ? "yazı" : "sayı";
        return <>
          <table>
            <thead><tr>
              <th className="rb-ab">No</th>
              {b.sutunlar.map((s) => {
                const kilit = b.kilit && !kurucudan(s.id);
                return (
                  <th key={s.id} className="rb-ab">
                    <span className={k.sutun}>
                      <Yazi deger={s.ad} ad="Sütun adı" kilit={kilit} ac={yeniId === s.id} yaz={(x) => degis(ogeYaz(t, i, s.id, { ad: x }))} />
                      {s.birim && <span>({s.birim})</span>}
                      {s.op && s.sinir !== undefined && <span className={k.sinir}>sınır {SINIR_ISARETI[s.op]} {virgul(s.sinir)}</span>}
                      {ogeTuslari(b, i, s.id, s.ad, kilit)}
                    </span>
                  </th>
                );
              })}
              {notlar.length > 0 && <th className="rb-ab">Uygunluk notu</th>}
              <th className="rb-ab">Sonuç</th>
              <th className={k.ekleSutun}><Ekle ad="Sütun" onClick={() => ogeKoy(i, "s", "Yeni sütun")} /></th>
            </tr></thead>
            <tbody>
              {[1, 2].map((n) => (
                <tr key={n}>
                  <td className="rb-orta">{n}</td>
                  {b.sutunlar.map((s) => <td key={s.id}><span className={k.ornek}>{ornek(s)}</span></td>)}
                  {notlar.length > 0 && <td><span className={k.ornek}>Not-1 … Not-{notlar.length}</span></td>}
                  <td><span className={k.ornek}>Uygun / Uygun değil</span></td>
                  <td className={k.ekleSutun} />
                </tr>
              ))}
            </tbody>
          </table>
          <p className={k.altNot}>{b.satir === "ekle" ? "Satırları denetçi raporda ekler" : "Sabit satırlar"}{b.enAz > 0 ? ` · en az ${b.enAz} satır` : ""}.
            {!b.sutunlar.some((s) => (s.op && s.sinir !== undefined) || s.olumsuz?.length) && !b.hesap && !notlar.length && " Sonucun kendiliğinden hesaplanması için bir sütuna sınır verin (sütunun ayrıntıları)."}</p>
          {notlar.length > 0 && <ol className="rb-notlar">{notlar.map((x, j) => <li key={j}>Not-{j + 1}: {x.metin}</li>)}</ol>}
        </>;
      }
      case "test":
        return (
          <table>
            <thead><tr><th className="rb-ab">Ölçüm</th><th className="rb-ab">Değer</th><th className="rb-ab">Sınır</th><th className="rb-ab">Sonuç</th></tr></thead>
            <tbody>
              {b.degerler.map((d) => (
                <tr key={d.id}>
                  <td><span className={k.satir}><Yazi deger={d.ad} ad="Değer adı" kilit={d.kilit} ac={yeniId === d.id} yaz={(s) => degis(ogeYaz(t, i, d.id, { ad: s }))} />
                    {ogeTuslari(b, i, d.id, d.ad, d.kilit)}</span></td>
                  <td><span className={k.ornek}>{d.secenekler?.length ? d.secenekler.join(" / ") : d.metin ? "yazı" : `sayı${d.birim ? ` · ${d.birim}` : ""}`}</span></td>
                  <td>{d.op && d.sinir !== undefined ? `${SINIR_ISARETI[d.op]} ${virgul(d.sinir)}${d.birim ? ` ${d.birim}` : ""}` : d.not || <span className={k.ornek}>sınır yok</span>}</td>
                  <td><span className={k.ornek}>Uygun / Uygun değil</span></td>
                </tr>
              ))}
              <tr className={k.ekleSatir}><td colSpan={4}><Ekle ad="Değer ekle" onClick={() => ogeKoy(i, "d", "Yeni değer")} /></td></tr>
            </tbody>
          </table>
        );
      case "cihaz":
        return (
          <table>
            <thead><tr>{["Cihaz", "Kod / seri no", "Kalibrasyon tarihi", "Geçerlilik", "Sertifika no"].map((x) => <th key={x} className="rb-ab">{x}</th>)}</tr></thead>
            <tbody><tr><td colSpan={5}><span className={k.ornek}>Rapor yazılırken zimmetteki cihazlardan eklenir; türün cihaz türleri tür sayfasında seçilir.</span></td></tr></tbody>
          </table>
        );
      case "foto":
        return (
          <div className="rb-fotolar">
            {Array.from({ length: Math.max(1, Math.min(b.enAz || 1, 3)) }, (_, j) => <div key={j} className={`rb-foto ${k.foto}`}><div className="rb-foto-bos">Fotoğraf {j + 1}</div></div>)}
            <p className={k.altNot}>En az <SayiYazi deger={b.enAz} en={0} ad="En az fotoğraf" yaz={(n) => degis(bolumYaz(t, i, { enAz: n }))} /> · en çok{" "}
              <SayiYazi deger={b.enCok} en={1} ad="En çok fotoğraf" yaz={(n) => degis(bolumYaz(t, i, { enCok: n }))} /> fotoğraf</p>
          </div>
        );
      case "kusur":
        return <p className="rb-kutu-metin"><span className={k.ornek}>Kendiliğinden yazılır: “Uygun değil” maddeler ve sınır dışı ölçümler, fotoğraflarıyla (* hafif, ** ağır).</span></p>;
      case "sonuc":
        return <>
          <p className="rb-kutu-metin">
            <Yazi deger={b.cumle} ad="Sonuç cümlesi" bos="Sonuç cümlesi (ör. … ekipmanın kullanımı)" kilit={b.kilit} uzun={400}
              yaz={(s) => degis(bolumYaz(t, i, { cumle: s.trim() }))} /> <b>uygundur / uygun değildir</b>.
          </p>
          {(b.aciklama || !b.kilit) && <div className="rb-aciklama">
            <Yazi deger={b.aciklama} ad="Sonuç açıklaması" bos="Açıklama (isteğe bağlı: ağır kusurların tanımı, notlar)" kilit={b.kilit} cok uzun={4000}
              yaz={(s) => degis(bolumYaz(t, i, { aciklama: s.slice(0, 4000) }))} />
          </div>}
        </>;
      case "not":
        return <p className="rb-kutu-metin"><span className={k.ornek}>Muayene uzmanının yorumu{b.zorunlu ? " (zorunlu)" : " (isteğe bağlı)"}.</span></p>;
      case "imza":
        return <>
          {b.imzalar.includes("uzman") && <BilgiTablosu l={[["Adı soyadı", "—"], ["Mesleği", "—"], ["Yetkili kişi kayıt no (EKİPNET)", "—"], ["Diploma no", "—"],
            ["Oda sicil no", "—"], ["İmzası", <span key="i" className={k.ornek}>güvenli elektronik imza</span>, true]]} />}
          {b.imzalar.includes("teknik") && <BilgiTablosu l={[["Onaylayan teknik yönetici", "—"], ["Onay zamanı", "—"]]} />}
          <p className={k.altNot}>Rapor ekranında görünmez; belgede (PDF) basılır.</p>
        </>;
    }
  };

  /** bölüm ayarları (şeritteki ayar tuşu) */
  const bolumAyari = (b: Bolum, i: number) => (
    <div className={k.panel} role="group" aria-label={`${b.ad} · bölüm ayarları`}>
      <div className={k.panelBas}><b>{b.ad} · bölüm ayarları</b><Tus ikon="x" ad="Bölüm ayarlarını kapat" onClick={() => setAyar(null)} /></div>
      {!b.kilit && <div className={k.panelSatir}>
        <label className={k.panelAlan}>Üst başlık
          <input className={k.panelGirdi} value={b.ust ?? ""} maxLength={200} onChange={(e) => degis(bolumDuzeni(t, i, { ust: e.target.value }))} />
          <span className={k.panelIpucu}>Aynı üst başlığı taşıyan ardışık bölümler belgede 5.1, 5.2 diye sıralanır.</span>
        </label>
        <label className={k.panelKutu}><input type="checkbox" checked={!!b.numarasiz} onChange={(e) => degis(bolumDuzeni(t, i, { numarasiz: e.target.checked }))} />
          Numarasız bölüm (belgede numara almaz)</label>
      </div>}
      {b.blok === "liste" && <ListeDuzenleyici t={t} i={i} b={b} degis={degis} />}
      {b.blok === "olcum" && <>
        {!b.kilit && <div className={k.panelSatir}>
          <label className={k.panelKutu}><input type="checkbox" checked={b.satir === "ekle"} onChange={(e) => degis(bolumYaz(t, i, { satir: e.target.checked ? "ekle" : "sabit" }))} />
            Satırları denetçi ekler</label>
          <label className={k.panelAlan}>En az satır
            <SayiGirdi deger={b.enAz} en={0} enCok={200} ad="En az satır" yaz={(n) => degis(bolumYaz(t, i, { enAz: n }))} /></label>
        </div>}
        <NotDuzenleyici t={t} i={i} b={b} degis={degis} />
      </>}
      {b.blok === "sonuc" && <SonucAciklamasi t={t} i={i} b={b} degis={degis} />}
      {b.blok === "not" && <label className={k.panelKutu}><input type="checkbox" checked={b.zorunlu} onChange={(e) => degis(bolumYaz(t, i, { zorunlu: e.target.checked }))} />Yorum zorunlu</label>}
      {b.blok === "imza" && <div className={k.panelSatir} role="group" aria-label="İmza yerleri">
        {([["uzman", "Muayene uzmanı"], ["teknik", "Teknik yönetici"]] as const).map(([x, ad]) => (
          <label key={x} className={k.panelKutu}>
            <input type="checkbox" checked={b.imzalar.includes(x)} disabled={b.kilit || (b.imzalar.length === 1 && b.imzalar.includes(x))}
              onChange={(e) => degis(bolumYaz(t, i, { imzalar: e.target.checked ? [...b.imzalar, x] : b.imzalar.filter((y) => y !== x) }))} />{ad}
          </label>
        ))}
      </div>}
      {b.blok === "cihaz" && <p className={k.panelIpucu}>Türün ölçüm cihazı türleri tür sayfasında seçilir; denetçi raporda zimmetindeki cihazı ekler, kalibrasyonu denetlenir.</p>}
      {b.blok === "kusur" && <p className={k.panelIpucu}>Kendiliğinden dolar; ayarı yok.</p>}
    </div>
  );

  /** bölümler arası "Bölüm ekle" (p: yeni bölümün yeri) */
  const araEkle = (p: number, ad: string, id: string, son = false) => (
    <div className={son ? `${k.araEkle} ${k.sonEkle}` : k.araEkle}>
      <SecimAlani id={id} ad={ad} etiketsiz deger="" ipucu={son ? "+ Bölüm ekle" : "+ Buraya bölüm ekle"} secenekler={BOLUM_SECENEK} degistir={(x) => bolumKoy(x as Blok, p)} />
    </div>
  );

  /* ── 2 · Ekipman bilgileri: kayıttan gelen sabit satırlar + formatın ekipman bölümünün alanları (yazılır) ── */
  const katilan = duzen.katilan[0] ?? null, ki = katilan ? sira(katilan.id) : -1;
  const formatAdlari = t.bolumler.flatMap((b) => (b.blok === "bilgi" ? b.alanlar.filter((a) => !a.kaynak).map((a) => a.ad.toLocaleLowerCase("tr")) : []));
  const formatta = (x: string) => formatAdlari.some((ad) => ad.includes(x));
  const sabitEkipman: Hucre[] = [
    ["Ekipman kodu", <span key="k" className={k.ornek}>kayıttan</span>], ["Ekipman türü", tur.ad],
    ...([["marka", "Marka"], ["model", "Model"], ["seri no", "Seri no"], ["imal", "İmal yılı"], ["kullanım yeri", "Kullanım yeri"], ["kullanım amacı", "Kullanım amacı"]] as const)
      .filter(([x]) => !formatta(x)).map(([, e]) => [e, <span key={e} className={k.ornek}>kayıttan</span>] as const),
  ];
  const ekipmanAlanEkle = () => {
    if (katilan) { ogeKoy(ki, "a", "Yeni alan"); return; }
    /* formatta ekipman bölümü yok: "Ekipman bilgileri" bilgi bölümü 1. bölümden sonra açılır */
    const b = yeniBolum(t, "bilgi", "Ekipman bilgileri"), aid = yeniKimlik(t, "a", new Set([b.id]));
    const yeni = BolumSema.parse({ ...b, alanlar: [{ id: aid, ad: "Yeni alan", tur: "metin" }] });
    const p = t.bolumler.findIndex((x) => kayittanBolumMu(x)) + 1;
    const l = [...t.bolumler]; l.splice(p, 0, yeni);
    degis({ ...t, bolumler: l }); setYeniId(aid);
  };

  return (
    <article className={`rb-sayfa ${k.kagit}`} aria-label="Rapor formatı · düzenlenebilir belge">
      {/* başlık tablosu (belge.ts): logo · firma · akreditasyon · belge adı · doküman bilgisi */}
      <table className="rb-bas">
        <colgroup><col style={{ width: "11%" }} /><col style={{ width: "27%" }} /><col style={{ width: "10%" }} /><col style={{ width: "27%" }} /><col style={{ width: "25%" }} /></colgroup>
        <tbody><tr>
          <td className="rb-logo">LOGO</td>
          <td className="rb-firma"><b>Firmanızın adı</b><br /><span className={k.ornek}>adres, logo ve akreditasyon Firma ayarlarından</span></td>
          <td className="rb-logo">AKR.</td>
          <td className="rb-bas-ad"><Yazi deger={t.gorunum.baslik} ad="Belge başlığı" bos={`${tur.ad} periyodik kontrol raporu`} kilit={resmi}
            yaz={(s) => degis(gorunumYaz(t, { baslik: s }))} /></td>
          <td className="rb-dok">
            <div><span>Doküman Kodu</span>: <Yazi deger={t.gorunum.formKodu} ad="Doküman kodu" bos="kendiliğinden" kilit={resmi} uzun={20}
              yaz={(s) => degis(gorunumYaz(t, { formKodu: s }))} /></div>
            <div><span>Format sürümü</span>: taslak</div>
            <div><span>Rapor No</span>: —</div>
            <div><span>Rapor Tarihi</span>: —</div>
          </td>
        </tr></tbody>
      </table>

      {/* 1 · Firma bilgileri — SABİT (her formatta ve raporda aynı; plandan ve kayıttan) */}
      <section className={`rb-bolum ${k.bolum}`} id="kb-firma">
        <div className={k.bolumBas}><h2>1. Firma bilgileri</h2>
          <span className={k.araclar}><span className={k.sabit}><Ikon ad="lock" kucuk />Sabit · her raporda aynı</span></span></div>
        <BilgiTablosu l={[
          ["Firma adı", <span key="f" className={k.ornek}>plandan</span>, true], ["Periyodik kontrol adresi", <span key="a" className={k.ornek}>plandan</span>, true],
          ["Rapor numarası", <span key="n" className={k.ornek}>kendiliğinden</span>], ["Rapor tarihi", <span key="t" className={k.ornek}>GG.AA.YYYY</span>],
          ["İSG-KATİP sözleşme ID", <span key="i" className={k.ornek}>plandan</span>], ["SGK sicil numarası", <span key="s" className={k.ornek}>plandan</span>],
          ["Başlangıç tarihi ve saati", <span key="b" className={k.ornek}>sahada</span>], ["Bitiş tarihi ve saati", <span key="e" className={k.ornek}>sahada</span>],
          ["Bir sonraki periyodik kontrol tarihi", <span key="o" className={k.ornek}>periyottan</span>], ["Takip kontrol tarihi", <span key="k" className={k.ornek}>gerekirse</span>],
          ["Periyodik kontrol metodu ve kapsamı", <span key="m" className={k.metot}>
            <Yazi deger={t.gorunum.dayanak.join("\n")} ad="Periyodik kontrol metodu ve kapsamı" bos="Standart / yönetmelik yazın (her satıra bir tane)" cok uzun={6000}
              yaz={(s) => degis(gorunumYaz(t, { dayanak: satirlar(s, 20, 300) }))} />
            <span className={k.ornek}>+ türün kontrol metodu standartları (tür sayfasında)</span></span>, true],
        ]} />
      </section>

      {/* 2 · Ekipman bilgileri — kayıttan gelen satırlar + formatın sorduğu alanlar */}
      <section className={`rb-bolum ${k.bolum}`} id="kb-ekipman">
        <div className={k.bolumBas}><h2>2. {katilan ? <Yazi deger={katilan.ad} ad="Bölüm adı" kilit={katilan.kilit} yaz={(s) => degis(bolumAdi(t, ki, s))} /> : duzen.ekipmanBaslik}</h2>
          {katilan && <span className={k.araclar}>{katilan.kilit && <span className={k.sabit}><Ikon ad="lock" kucuk />Bakanlık bölümü</span>}</span>}</div>
        <BilgiTablosu l={[...sabitEkipman, ...(katilan ? katilan.alanlar.filter((a) => !a.kaynak).map((a) => [
          <span key={a.id} className={k.etiket}><Yazi deger={a.ad} ad="Alan adı" kilit={a.kilit} ac={yeniId === a.id} yaz={(s) => degis(ogeYaz(t, ki, a.id, { ad: s }))} />
            {ogeTuslari(katilan, ki, a.id, a.ad, a.kilit)}</span>,
          <AlanOrnegi key={`${a.id}-d`} a={a} />, a.tur === "coklu" || (a.secenekler?.length ?? 0) > 3] as const) : []),
          ["Ekipman bölümü", <span key="eb" className={k.ornek}>sahada</span>]]}
          son={<Ekle ad="Alan ekle" onClick={ekipmanAlanEkle} />} />
        {katilan && ogePaneli(katilan, ki)}
      </section>

      {araEkle(duzen.bolumler.length ? sira(duzen.bolumler[0].b.id) : t.bolumler.length, "Buraya bölüm ekle (ekipman bilgilerinden sonra)", "kb-ekle-0")}
      {duzen.bolumler.map((x, v) => {
        const b = x.b, i = sira(b.id), anahtar = `b:${b.id}`;
        return (
          <Fragment key={b.id}>
            {x.ust && <section className="rb-bolum rb-ust"><h2>{x.ust.no}. {x.ust.ad}</h2></section>}
            <section className={`rb-bolum ${k.bolum}`} id={`kb-${b.id}`} aria-label={`${x.no ? `${x.no} ` : ""}${b.ad}`}>
              <div className={x.no?.includes(".") ? `${k.bolumBas} ${k.altBas}` : k.bolumBas}>
                <h2>{x.no && <span className={k.no}>{x.no.includes(".") ? `${x.no} ` : `${x.no}. `}</span>}
                  <Yazi deger={b.ad} ad="Bölüm adı" bos="Bölüm adı" kilit={b.kilit} ac={yeniId === b.id} yaz={(s) => degis(bolumAdi(t, i, s))} /></h2>
                <span className={k.araclar}>
                  {b.kilit && <span className={k.sabit}><Ikon ad="lock" kucuk />Bakanlık bölümü</span>}
                  <span className={k.tur}>{BLOK_ADI[b.blok]}</span>
                  <span data-yon="-1" className={k.yonKap}><Tus ikon="arrow-up" ad={`${b.ad} · yukarı`} disabled={v === 0} onClick={() => tasiGorunen(b.id, -1)} /></span>
                  <span data-yon="1" className={k.yonKap}><Tus ikon="arrow-down" ad={`${b.ad} · aşağı`} disabled={v === gorunen.length - 1} onClick={() => tasiGorunen(b.id, 1)} /></span>
                  <Tus ikon="settings" ad={`${b.ad} · bölüm ayarları`} basili={ayar === anahtar} onClick={() => ac(anahtar)} />
                  {!b.kilit && <Tus ikon="trash-2" ad={`${b.ad} · bölümü sil`} onClick={() => bolumuSil(i)} />}
                </span>
              </div>
              {ayar === anahtar && bolumAyari(b, i)}
              {icerik(b, i)}
              {ogePaneli(b, i)}
            </section>
            {v < duzen.bolumler.length - 1 && araEkle(i + 1, `Buraya bölüm ekle (${b.ad} bölümünden sonra)`, `kb-ekle-${b.id}`)}
          </Fragment>
        );
      })}
      {araEkle(t.bolumler.length, "Bölüm ekle", "kb-ekle", true)}
      <footer className="rb-alt">Firmanızın adı · {t.gorunum.formKodu || `doküman kodu kendiliğinden (${tur.kod})`}</footer>
    </article>
  );
}

/** bölümün düz özelliklerini yazar (enAz, cumle, imzalar …) */
function bolumYaz(t: FormatTanimi, i: number, y: Record<string, unknown>): FormatTanimi {
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? ({ ...x, ...y } as typeof x) : x)) };
}

/** kâğıtta yerinde sayı (fotoğraf sayısı) */
function SayiYazi({ deger, en, ad, yaz }: { deger: number; en: number; ad: string; yaz: (n: number) => void }) {
  return <Yazi deger={String(deger)} ad={ad} uzun={2} yaz={(s) => { const n = Number.parseInt(s.trim(), 10); if (Number.isFinite(n) && n >= en && n <= 50) yaz(n); }} />;
}
/** paneldeki sayı girdisi */
function SayiGirdi({ deger, en, enCok, ad, yaz }: { deger: number; en: number; enCok: number; ad: string; yaz: (n: number) => void }) {
  const [taslak, setTaslak] = useState<string | null>(null);
  return <input className={k.panelGirdi} aria-label={ad} inputMode="numeric" maxLength={3} value={taslak ?? String(deger)}
    onChange={(e) => setTaslak(e.target.value)}
    onBlur={() => { if (taslak === null) return; const n = Number.parseInt(taslak, 10); if (Number.isFinite(n) && n >= en && n <= enCok) yaz(n); setTaslak(null); }} />;
}

