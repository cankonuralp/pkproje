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
   Bakanlık öğesi kilit simgeli; 470 (reisim 2026-10-10, hata listesi 38: "biraz daha serbestlik") o da yazılır, çıkarılır, silinir — çıkarmadan /
   silmeden önce sorulur, yayında uyarı çıkar (engel değil). 1 Firma bilgileri her formatta aynı (sabit); yalnız
   "Periyodik kontrol metodu ve kapsamı" satırı yazılır. 460 (reisim 2026-10-09: "ekipman bilgileri kısmıda değiştirilebilir olsun zira yangın
   dolabı gibi ekipmanlarda farklı girdiler olabiliyor sabit olan tek şey firma bilgileri, cihazlar ve standartlar"): 2. bölüm serbest — ekipman
   kodu ve türü dışındaki her satırın adı değişir, çıkarılır, yeni alan eklenir; marka, model, seri no … "Ekipman kaydından alan ekle" ile geri
   gelir (değeri ekipman kaydından başlar; kâğıt eski formatı açılışta çevirir — format/duzen.ts ekipmanTamYap). 459: standartlar ve cihazlar
   sabit ve TÜRDEN — metot satırında türün kontrol metodu standartları, ölçüm cihazları bölümünde türün cihaz türleri kendiliğinden (tür
   sayfasında değişince burada da); cihaz bölümü silinmez, tektir. 461 (reisim: "üst başlık ekleme olayı kullanımı zorlaştırıyor alt başlık
   ekleme olayı olmadığı için anlamsız oluyor alt başlık ekleme olsun"): bölümün altına "Alt başlık ekle" (5 → 5.1, 5.2 …; 469: doğrudan — tür sordurmaz, ana bölümün türünde); şeritte "alt başlık
   yap / ana başlık yap"; üst başlık yazma kutusu kalktı (var olan üst başlık görünür, kaldırılır). Kâğıdın renkleri belgenin kendi renkleri —
   açık / koyu temada aynı kâğıt. */
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { SINIR_ISARETI } from "../../../format/hesap";
import { altBaslikAnasi, altGrupSonu, raporDuzeni } from "../../../format/duzen";
import { BLOKLAR, doldurma, DOLDURULUR, EKIPMAN_ALAN_ADI, EKIPMAN_ALANLARI, type Blok, type Bolum, type BolumOf, type FormatTanimi } from "../../../format/tanim";
import {
  altBaslikEkle, bolumAdi, bolumDuzeni, ekipmanAlaniEkle, gorunumYaz, grupEkle, grupSil, grupYaz, kurucudan, maddeEkle, ogeEkle, ogeSil, ogeYaz, satirlar, tasi,
  yeniBolum, yeniKimlik,
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
function Yazi({ deger, yaz, ad, bos = "Yazın", cok = false, ac = false, uzun = 200 }: {
  deger: string; yaz: (s: string) => void; ad: string; bos?: string; cok?: boolean; ac?: boolean; uzun?: number;
}) {
  const [acik, setAcik] = useState(ac);
  const [taslak, setTaslak] = useState(deger);
  const alan = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (acik) { alan.current?.focus(); alan.current?.select(); } }, [acik]);
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
/* 470: Bakanlık öğesinin işareti (değişir, yayında uyarı) — "Sabit" satırlar (ekipman kodu, türü) değişmez */
const Kilit = ({ ad = "Bakanlık formatının parçası", not = "değiştirilirse yayında uyarı çıkar" }: { ad?: string; not?: string }) => (
  <span className={k.kilitIkon} title={`${ad} · ${not}`}><Ikon ad="lock" kucuk /><span className="gizli">{ad}</span></span>
);

/** seçenekler belgedeki gibi (○ A ○ B) */
const Secenekler = ({ l }: { l: readonly string[] }) => <>{l.map((x) => <span key={x} className="rb-sec"><span className="rb-isaret" /> {x}</span>)}</>;

/** bilgi alanının belgedeki boş değeri (türüne göre) */
function AlanOrnegi({ a }: { a: BolumOf<"bilgi">["alanlar"][number] }) {
  if (a.ekipman) return <span className={k.ornek}>sahada · ekipman kaydından başlar</span>;
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
  /** std / cihaz (459): türün kontrol metodu standartları ve ölçüm cihazı türleri — tür sayfasında seçilir, kâğıtta kendiliğinden */
  tur: { ad: string; kod: string; std: readonly string[]; cihaz: readonly string[] };
  /** bölümü sil (onay sorar) */
  bolumuSil: (i: number) => void;
  bildir: (s: string) => void;
}

export function Kagit({ t, degis, tur, bolumuSil, bildir }: KagitOzellik) {
  /* açık ayar: "b:<bölüm>" bölümün ayarları · "o:<bölüm>:<öğe>" öğenin ayrıntıları · "metot" */
  const [ayar, setAyar] = useState<string | null>(null);
  /* yeni eklenen öğe / bölüm: adı yazma kipinde açılır */
  const [yeniId, setYeniId] = useState<string | null>(null);
  const onayla = useOnayla();
  const duzen = raporDuzeni(t, false);
  const sira = (id: string) => t.bolumler.findIndex((b) => b.id === id);
  const ac = (key: string) => setAyar(ayar === key ? null : key);
  const gorunen = duzen.bolumler.map((x) => x.b.id);

  /** yeni öğe: kimliği önceden hesaplanır (ogeEkle aynısını verir), adı yazma kipinde açılır */
  const ogeKoy = (i: number, onek: "a" | "s" | "d", ad: string) => { const id = yeniKimlik(t, onek); degis(ogeEkle(t, i, ad)); setYeniId(id); };
  const maddeKoy = (i: number, gid: string) => { const id = yeniKimlik(t, "m"); degis(maddeEkle(t, i, gid, "Yeni madde")); setYeniId(id); };
  /* 470: Bakanlık öğesi de çıkar — önce sorulur */
  const cikar = async (i: number, id: string, ad: string, bakanlik: boolean) => {
    if (bakanlik && !(await onayla({ baslik: "Bakanlık öğesi çıkarılsın mı?", tus: "Çıkar", tehlike: true,
      metin: `“${ad}” Bakanlık formatının parçası. Çıkarılırsa bu formatla yazılan raporlar Bakanlık formatına uymaz; yayınlarken uyarı çıkar.` }))) return;
    degis(ogeSil(t, i, id)); if (ayar?.endsWith(`:${id}`)) setAyar(null); bildir(`“${ad}” çıkarıldı (taslak).`);
  };
  /** p: yeni bölümün t.bolumler'deki yeri */
  const bolumKoy = (blok: Blok, p: number) => {
    const b = yeniBolum(t, blok, BLOK_ADI[blok]);
    const l = [...t.bolumler]; l.splice(Math.max(0, Math.min(p, l.length)), 0, b);
    degis({ ...t, bolumler: l }); setYeniId(b.id); bildir(`${BLOK_ADI[blok]} bölümü eklendi (taslak).`);
    requestAnimationFrame(() => document.getElementById(`kb-${b.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
  };
  /** 469: ana bölümün altına doğrudan alt başlık (tür sordurmaz; ana bölümün türünde) — adı yazma kipinde açılır */
  const altKoy = (p: number, ana: Bolum) => {
    const y = altBaslikEkle(t, p, ana);
    degis(y.t); setYeniId(y.id); bildir(`${ana.ad} altına alt başlık eklendi (taslak).`);
    requestAnimationFrame(() => document.getElementById(`kb-${y.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
  };
  /** 461: v. bölümden sonra eklenen alt başlığın ana bölümü — v ana bölümse kendisi, alt başlıksa onun ana bölümü; üst başlıklı grup ya da
      numarasız bölümden sonra alt başlık olmaz (null) */
  const anaBolum = (v: number): Bolum | null => altBaslikAnasi(duzen.bolumler, v);
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
  /** öğe satırının küçük tuşları: Bakanlık işareti · ayrıntı · çıkar (470: Bakanlık öğesinde de, sorarak) */
  const ogeTuslari = (b: Bolum, i: number, id: string, ad: string, kilit: boolean) => (
    <span className={k.ogeTus}>
      {kilit && <Kilit />}
      <Tus ikon="settings" ad={`${ad} · ayrıntılar`} basili={ayar === `o:${b.id}:${id}`} onClick={() => ac(`o:${b.id}:${id}`)} />
      <Tus ikon="x" ad={`${ad} · çıkar`} onClick={() => void cikar(i, id, ad, kilit)} />
    </span>
  );

  /* ── bölümün içeriği (bloğa göre; belgedeki gibi) ── */
  const icerik = (b: Bolum, i: number): ReactNode => {
    switch (b.blok) {
      case "bilgi":
        return <BilgiTablosu l={b.alanlar.map((a) => [
          <span key={a.id} className={k.etiket}><Yazi deger={a.ad} ad="Alan adı" ac={yeniId === a.id} yaz={(s) => degis(ogeYaz(t, i, a.id, { ad: s }))} />
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
                return <Fragment key={g.id}>
                  {(cok || g.ad) && <tr><td colSpan={3} className="rb-grup">
                    <span className={k.grupSatir}>
                      <Yazi deger={g.ad} ad="Grup adı" bos="Grup adı (isteğe bağlı)" yaz={(s) => degis(grupYaz(t, i, g.id, { ad: s }))} />
                      {cok && !g.maddeler.length && <Tus ikon="x" ad={`${g.ad || `${gi + 1}. grup`} · boş grubu çıkar`} onClick={() => degis(grupSil(t, i, g.id))} />}
                    </span>
                  </td></tr>}
                  {g.maddeler.map((m, mi) => (
                    <tr key={m.id}>
                      <td className="rb-orta">{cok ? `${gi + 1}.${mi + 1}` : mi + 1}</td>
                      <td><span className={k.satir}><Yazi deger={m.metin} ad="Madde metni" ac={yeniId === m.id} yaz={(s) => degis(ogeYaz(t, i, m.id, { ad: s }))} />
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
                      <Yazi deger={s.ad} ad="Sütun adı" ac={yeniId === s.id} yaz={(x) => degis(ogeYaz(t, i, s.id, { ad: x }))} />
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
                  <td><span className={k.satir}><Yazi deger={d.ad} ad="Değer adı" ac={yeniId === d.id} yaz={(s) => degis(ogeYaz(t, i, d.id, { ad: s }))} />
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
        /* 459: satırlar türün ölçüm cihazı türlerinden (tür sayfası); cihazın kendisi sahada zimmetten seçilir, kalibrasyonu denetlenir */
        return (
          <table>
            <thead><tr>{["Cihaz", "Kod / seri no", "Kalibrasyon tarihi", "Geçerlilik", "Sertifika no"].map((x) => <th key={x} className="rb-ab">{x}</th>)}</tr></thead>
            <tbody>
              {tur.cihaz.map((ad) => (
                <tr key={ad}><td className={k.turdan}>{ad}</td><td colSpan={4}><span className={k.ornek}>sahada zimmetten seçilir · kalibrasyonu denetlenir</span></td></tr>
              ))}
              <tr><td colSpan={5}><span className={k.ornek}>{tur.cihaz.length ? "Cihaz türleri tür sayfasından, kendiliğinden; orada değişince burada da değişir."
                : "Bu türe ölçüm cihazı türü seçilmemiş — tür sayfasında seçilince burada kendiliğinden görünür."}</span></td></tr>
            </tbody>
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
            <Yazi deger={b.cumle} ad="Sonuç cümlesi" bos="Sonuç cümlesi (ör. … ekipmanın kullanımı)" uzun={400}
              yaz={(s) => degis(bolumYaz(t, i, { cumle: s.trim() }))} /> <b>uygundur / uygun değildir</b>.
          </p>
          {<div className="rb-aciklama">
            <Yazi deger={b.aciklama} ad="Sonuç açıklaması" bos="Açıklama (isteğe bağlı: ağır kusurların tanımı, notlar)" cok uzun={4000}
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
  /* 484 (reisim 2026-10-10: "test tablosu olarak kullanılan yerlere excelden yükle ve fotoğraf ekleme özelliği olsun … aynı şekilde ekipman
     bilgilerinde de olsun bunu istediğim başlığa da ekleyebiliyim rapor tasarımcısında da olsun"): bilgi / ölçüm tablosu / test bölümünde sahada
     fotoğraftan (yapay zekâ okur, fotoğraf belgede görünmez) ve Excel'den doldurma — bölümün ayarı (tanim.ts doldur / doldurma) */
  const doldurmaAyari = (b: Bolum, i: number) => {
    if (!DOLDURULUR.includes(b.blok)) return null;
    const d = doldurma(b), yaz = (y: Partial<typeof d>) => degis(bolumYaz(t, i, { doldur: { ...d, ...y } }));
    return (
      <div className={k.panelSatir} role="group" aria-label={`${b.ad} · sahada doldurma`}>
        <label className={k.panelKutu}><input type="checkbox" checked={d.foto} onChange={(e) => yaz({ foto: e.target.checked })} />
          Fotoğraftan doldur (yapay zekâ okur, denetçi onaylar; fotoğraf raporda durur, belgede görünmez)</label>
        <label className={k.panelKutu}><input type="checkbox" checked={d.excel} onChange={(e) => yaz({ excel: e.target.checked })} />
          Excel&apos;den yükle (sütun başlıkları ya da “Alan | Değer” satırlarıyla)</label>
      </div>
    );
  };
  const bolumAyari = (b: Bolum, i: number) => (
    <div className={k.panel} role="group" aria-label={`${b.ad} · bölüm ayarları`}>
      <div className={k.panelBas}><b>{b.ad} · bölüm ayarları</b><Tus ikon="x" ad="Bölüm ayarlarını kapat" onClick={() => setAyar(null)} /></div>
      {<div className={k.panelSatir}>
        <label className={k.panelKutu}><input type="checkbox" checked={!!b.alt} onChange={(e) => degis(bolumDuzeni(t, i, { alt: e.target.checked }))} />
          Alt başlık (üstündeki bölümün altında 5.1, 5.2 … diye numaralanır)</label>
        {!b.alt && <label className={k.panelKutu}><input type="checkbox" checked={!!b.numarasiz} onChange={(e) => degis(bolumDuzeni(t, i, { numarasiz: e.target.checked }))} />
          Numarasız bölüm (belgede numara almaz)</label>}
        {b.ust && <span className={k.panelIpucu}>Üst başlık: <b>{b.ust}</b>{" "}
          <button type="button" className={k.ekle} onClick={() => degis(bolumDuzeni(t, i, { ust: "" }))}>Üst başlığı kaldır</button></span>}
      </div>}
      {doldurmaAyari(b, i)}
      {b.blok === "liste" && <ListeDuzenleyici t={t} i={i} b={b} degis={degis} />}
      {b.blok === "olcum" && <>
        {<div className={k.panelSatir}>
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
            <input type="checkbox" checked={b.imzalar.includes(x)} disabled={b.imzalar.length === 1 && b.imzalar.includes(x)}
              onChange={(e) => degis(bolumYaz(t, i, { imzalar: e.target.checked ? [...b.imzalar, x] : b.imzalar.filter((y) => y !== x) }))} />{ad}
          </label>
        ))}
      </div>}
      {b.blok === "cihaz" && <p className={k.panelIpucu}>Sabit bölüm: satırları türün ölçüm cihazı türleri (tür sayfasında seçilir, burada kendiliğinden); denetçi raporda zimmetindeki cihazı ekler, kalibrasyonu denetlenir.</p>}
      {b.blok === "kusur" && <p className={k.panelIpucu}>Kendiliğinden dolar; ayarı yok.</p>}
    </div>
  );

  /** bölümler arası "Bölüm ekle" (p: yeni bölümün yeri); ölçüm cihazları bölümü tektir (459) */
  const cihazVar = t.bolumler.some((b) => b.blok === "cihaz");
  /* ana: buraya eklenen alt başlığın ana bölümü (461; yoksa yalnız "Bölüm ekle"). 469: "+ Alt başlık ekle" DOĞRUDAN alt başlık açar (tür
     sordurmaz) ve yalnız ana bölümün grubunun sonunda görünür — yeni alt başlık var olanların ardına eklenir */
  const araEkle = (p: number, ad: string, id: string, son = false, ana: Bolum | null = null) => {
    const secenekler = cihazVar ? BOLUM_SECENEK.filter(([b]) => b !== "cihaz") : BOLUM_SECENEK;
    return (
      <div className={son ? `${k.araEkle} ${k.sonEkle}` : k.araEkle}>
        {ana && <Ekle ad="Alt başlık ekle" erisimAdi={`Alt başlık ekle (${ana.ad} altına)`} onClick={() => altKoy(p, ana)} />}
        <SecimAlani id={id} ad={ad} etiketsiz deger="" ipucu={son ? "+ Bölüm ekle" : "+ Buraya bölüm ekle"} degistir={(x) => bolumKoy(x as Blok, p)} secenekler={secenekler} />
      </div>
    );
  };
  /** v. bölümden sonra ana bölümün alt başlık grubu bitiyor mu (sonraki bölüm aynı ananın alt başlığı değil) */
  const grupSonu = (v: number) => altGrupSonu(duzen.bolumler, v);

  /* ── 2 · Ekipman bilgileri (460): ekipman kodu ve türü sabit; öteki her satır formatın ekipman bölümünün alanı (kâğıt eski formatı açılışta
     çevirir — tam bölüm her zaman var) ── */
  const ekip = duzen.tam, ki = ekip ? sira(ekip.id) : -1;
  const eksikBagli = ekip ? EKIPMAN_ALANLARI.filter((x) => !ekip.alanlar.some((a) => a.ekipman === x)) : [];
  /* listede yalnız eksik olanlar var; eklenen satırın ad tuşuna odak */
  const bagliEkle = (x: string) => {
    const e = EKIPMAN_ALANLARI.find((y) => y === x);
    if (!ekip || !e) return;
    const id = yeniKimlik(t, "a"); degis(ekipmanAlaniEkle(t, ki, e));
    bildir(`“${EKIPMAN_ALAN_ADI[e]}” eklendi (taslak).`);
    requestAnimationFrame(() => document.getElementById("kb-ekipman")?.querySelector<HTMLElement>(`[data-alan="${id}"] button`)?.focus());
  };

  return (
    <article className={`rb-sayfa ${k.kagit}`} aria-label="Rapor formatı · düzenlenebilir belge">
      {/* başlık tablosu (belge.ts): logo · firma · akreditasyon · belge adı · doküman bilgisi */}
      <table className="rb-bas">
        <colgroup><col style={{ width: "11%" }} /><col style={{ width: "27%" }} /><col style={{ width: "10%" }} /><col style={{ width: "27%" }} /><col style={{ width: "25%" }} /></colgroup>
        <tbody><tr>
          <td className="rb-logo">LOGO</td>
          <td className="rb-firma"><b>Firmanızın adı</b><br /><span className={k.ornek}>adres, logo ve akreditasyon Firma ayarlarından</span></td>
          <td className="rb-logo"><span className={k.ornek}>Akreditasyon (TÜRKAK) no · Firma ayarlarından; yoksa boş</span></td>
          <td className="rb-bas-ad"><Yazi deger={t.gorunum.baslik} ad="Belge başlığı" bos={`${tur.ad} periyodik kontrol raporu`}
            yaz={(s) => degis(gorunumYaz(t, { baslik: s }))} /></td>
          <td className="rb-dok">
            <div><span>Doküman Kodu</span>: <Yazi deger={t.gorunum.formKodu} ad="Doküman kodu" bos="kendiliğinden" uzun={20}
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
            {tur.std.length ? <span className={k.turdan}>{tur.std.join(" · ")}<span className={k.ornek}> — türün standartları (tür sayfasından, kendiliğinden)</span></span>
              : <span className={k.ornek}>Türün kontrol metodu standardı seçilmemiş — tür sayfasında seçilince burada kendiliğinden görünür.</span>}</span>, true],
        ]} />
      </section>

      {/* 2 · Ekipman bilgileri — kod ve tür sabit; öteki satırlar formatın (adı yazılır, çıkarılır, eklenir) */}
      <section className={`rb-bolum ${k.bolum}`} id="kb-ekipman">
        <div className={k.bolumBas}><h2>2. {ekip ? <Yazi deger={ekip.ad} ad="Bölüm adı" yaz={(s) => degis(bolumAdi(t, ki, s))} /> : duzen.ekipmanBaslik}</h2>
          <span className={k.araclar}>
            {ekip?.kilit && <span className={k.sabit}><Ikon ad="lock" kucuk />Bakanlık bölümü</span>}
            {ekip && <DoldurmaIsareti b={ekip} />}
            {ekip && <Tus ikon="settings" ad={`${ekip.ad} · bölüm ayarları`} basili={ayar === "b:ekipman"} onClick={() => ac("b:ekipman")} />}
          </span></div>
        {ekip && ayar === "b:ekipman" && (
          <div className={k.panel} role="group" aria-label={`${ekip.ad} · bölüm ayarları`}>
            <div className={k.panelBas}><b>{ekip.ad} · bölüm ayarları</b><Tus ikon="x" ad="Bölüm ayarlarını kapat" onClick={() => setAyar(null)} /></div>
            {doldurmaAyari(ekip, ki)}
          </div>
        )}
        <BilgiTablosu l={[
          [<span key="kod" className={k.etiket}>Ekipman kodu<span className={k.ogeTus}><Kilit ad="Sabit · her raporda" not="değişmez" /></span></span>, <span key="k" className={k.ornek}>kayıttan</span>],
          [<span key="tur" className={k.etiket}>Ekipman türü<span className={k.ogeTus}><Kilit ad="Sabit · her raporda" not="değişmez" /></span></span>, tur.ad],
          ...(ekip ? ekip.alanlar.map((a): Hucre => [
            <span key={a.id} className={k.etiket} data-alan={a.id}><Yazi deger={a.ad} ad="Alan adı" ac={yeniId === a.id} yaz={(s) => degis(ogeYaz(t, ki, a.id, { ad: s }))} />
              {ogeTuslari(ekip, ki, a.id, a.ad, a.kilit)}</span>,
            <AlanOrnegi key={`${a.id}-d`} a={a} />, a.tur === "coklu" || (a.secenekler?.length ?? 0) > 3]) : []),
        ]}
          son={ekip && <span className={k.ekleSira}>
            <Ekle ad="Alan ekle" onClick={() => ogeKoy(ki, "a", "Yeni alan")} />
            {eksikBagli.length > 0 && <span className={k.ekleSecim}>
              <SecimAlani id="kb-ekipman-kayit" ad="Ekipman kaydından alan ekle" etiketsiz deger="" ipucu="+ Ekipman kaydından alan"
                secenekler={eksikBagli.map((x) => [x, EKIPMAN_ALAN_ADI[x], "sahada · kayıttan başlar"] as const)} degistir={bagliEkle} />
            </span>}
          </span>} />
        {ekip && ogePaneli(ekip, ki)}
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
                  <Yazi deger={b.ad} ad="Bölüm adı" bos="Bölüm adı" ac={yeniId === b.id} yaz={(s) => degis(bolumAdi(t, i, s))} /></h2>
                <span className={k.araclar}>
                  {b.kilit && <span className={k.sabit}><Ikon ad="lock" kucuk />Bakanlık bölümü</span>}
                  {!b.kilit && b.blok === "cihaz" && <span className={k.sabit}><Ikon ad="lock" kucuk />Sabit · türün cihazları</span>}
                  <span className={k.tur}>{BLOK_ADI[b.blok]}</span>
                  <DoldurmaIsareti b={b} />
                  <span data-yon="-1" className={k.yonKap}><Tus ikon="arrow-up" ad={`${b.ad} · yukarı`} disabled={v === 0} onClick={() => tasiGorunen(b.id, -1)} /></span>
                  <span data-yon="1" className={k.yonKap}><Tus ikon="arrow-down" ad={`${b.ad} · aşağı`} disabled={v === gorunen.length - 1} onClick={() => tasiGorunen(b.id, 1)} /></span>
                  {(b.alt && x.no?.includes(".")
                    ? <Tus ikon="chevron-left" ad={`${b.ad} · ana başlık yap`} onClick={() => degis(bolumDuzeni(t, i, { alt: false }))} />
                    : v > 0 && anaBolum(v - 1) && <Tus ikon="chevron-right" ad={`${b.ad} · alt başlık yap (${anaBolum(v - 1)!.ad} altına)`}
                      onClick={() => degis(bolumDuzeni(t, i, { alt: true }))} />)}
                  <Tus ikon="settings" ad={`${b.ad} · bölüm ayarları`} basili={ayar === anahtar} onClick={() => ac(anahtar)} />
                  {b.blok !== "cihaz" && <Tus ikon="trash-2" ad={`${b.ad} · bölümü sil`} onClick={() => bolumuSil(i)} />}
                </span>
              </div>
              {ayar === anahtar && bolumAyari(b, i)}
              {icerik(b, i)}
              {ogePaneli(b, i)}
            </section>
            {v < duzen.bolumler.length - 1 && araEkle(i + 1, `Buraya bölüm ekle (${b.ad} bölümünden sonra)`, `kb-ekle-${b.id}`, false, grupSonu(v) ? anaBolum(v) : null)}
          </Fragment>
        );
      })}
      {araEkle(t.bolumler.length, "Bölüm ekle", "kb-ekle", true, duzen.bolumler.length ? anaBolum(duzen.bolumler.length - 1) : null)}
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

/** 484: başlıkta bölümün sahada doldurma ayarı (açıksa) — "Fotoğraf · Excel" */
function DoldurmaIsareti({ b }: { b: Bolum }) {
  const d = doldurma(b);
  if (!d.foto && !d.excel) return null;
  return <span className={k.tur} title="Sahada bu bölüm fotoğraftan ya da Excel'den doldurulur (bölüm ayarı)">
    <Ikon ad={d.foto ? "camera" : "file-spreadsheet"} kucuk />{[d.foto && "Fotoğraf", d.excel && "Excel"].filter(Boolean).join(" · ")}</span>;
}
