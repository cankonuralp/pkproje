"use client";
/* FORMAT KURUCU · SERBEST TABLO (2026-10-24; reisim: "hangi firmanın hangi PDF formunu yüklersem yükleyeyim şablon o forma dönüşsün ve format
   kurucuda istediğim gibi düzenleyebileyim"; maket docs/maket/format-serbest.html onaylı). Kâğıtta tablonun kendisi: hücreye basılır (sürükleyerek
   ya da Shift ile aralık; telefonda "Aralık seç"), yazı hücresi çift tıklanınca yerinde yazılır; seçimin altında araç paneli — birleştir / ayır,
   satır ve sütun ekle / sil, sütun genişliği, satır yüksekliği, "sahada çoğalır", hücrenin içeriği (yazı, sahada doldurulur, kayıttan, kontrol
   cevabı, sıra no, imza yeri, logo, fotoğraf kutusu, sonuç) ve görünümü (yazı tipi, boy, kalın / eğik / altı çizili, hiza, yazı rengi, zemin,
   kenarlar). Sütun sınırındaki tutamak sürüklenir. İşlemler saf (src/format/tablo.ts); kâğıt ve belge aynı biçemden (hucreBicemi). Kâğıt
   belgenin renkleriyle (açık / koyu temada aynı); panel uygulamanın renkleriyle.
   2026-10-25 (belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca bağlamalıyız"): belge kurucusunda
   (BelgeKatalogBaglami — belgeBaglam.ts) kayıt hücresinin bilgisi belgenin katalogundan: "Belgeden gelen bilgi" (alanlar; çoğalan satırda
   listelerin kolonları), seçim hücreye veri yazar, kaynak'ı siler; kâğıtta bilginin adı. Bağlam yoksa (rapor kurucusu) davranış aynen.
   2026-10-25 (belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı"): belge kurucusunda
   "alan" hücresi de sunulur — adı "Elle doldurulur" (belge açılınca kişinin doldurduğu yer, src/belge/doldurma.ts); ayarları rapordakiyle aynı
   (değer türü, adı, birim, seçenekler, formül, zorunlu). */
import { useContext, useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";
import type { BelgeKatalogu } from "../../../belge/katalog";
import { Ikon } from "../../../components/ikon/Ikon";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import {
  ayir, birlestir, genislet, hucreBicemi, hucreleriYaz, kapsama, kenarYaz, satirEkle, satirSil, secimHucreleri, siraNumaralari, stilYaz, sutunEkle,
  sutunGenisligi, sutunSil, sutunYuzdeleri, type KenarTuru, type Secim, type TabloBolumu,
} from "../../../format/tablo";
import {
  HUCRE_ALAN_TURLERI, HUCRE_TURLERI, TABLO_KAYNAK_ADI, TABLO_KAYNAKLARI, YAZI_TIPI_ADI, YAZI_TIPLERI, type FormatTanimi, type Hucre, type HucreAlanTuru,
  type HucreStili, type HucreTuru, type TabloKaynagi, type YaziTipi,
} from "../../../format/tanim";
import { yeniKimlik } from "../kurucu";
import { BelgeKatalogBaglami, ilkVeri, veriAdi, veriSecenekleri } from "./belgeBaglam";
import k from "./kagit.module.css";
import s from "./tablo.module.css";

export const HUCRE_TURU_ADI: Record<HucreTuru, string> = {
  yazi: "Yazı", alan: "Sahada doldurulur", kayit: "Kayıttan gelir", cevap: "Kontrol cevabı", sira: "Sıra no", imza: "İmza yeri", gorsel: "Logo / görsel",
  foto: "Fotoğraf kutusu", sonuc: "Raporun sonucu",
};
/** belge kurucusunda türün adı (alan hücresi belgede elle doldurulur; öteki türler aynı) */
const turAdi = (x: HucreTuru, belge: boolean) => (belge && x === "alan" ? "Elle doldurulur" : HUCRE_TURU_ADI[x]);
/** belge kurucusunda sunulan türler (rapora özgü kontrol cevabı, imza kişisi, fotoğraf, raporun sonucu yok) */
const BELGE_TURLERI_HUCRE: readonly HucreTuru[] = ["yazi", "alan", "kayit", "sira", "gorsel"];
const HUCRE_IKON: Record<HucreTuru, string> = {
  yazi: "type", alan: "pencil", kayit: "tag", cevap: "list-checks", sira: "list-ordered", imza: "file-signature", gorsel: "image", foto: "camera", sonuc: "circle-check",
};
const ALAN_TURU_ADI: Record<HucreAlanTuru, string> = { metin: "Yazı", sayi: "Sayı", tarih: "Tarih", secim: "Seçim", evet: "Evet / hayır" };
const KISI_ADI = { uzman: "Muayene uzmanı", teknik: "Teknik yönetici", uzman2: "İkinci uzman", tesis: "Tesis yetkilisi" } as const;
/** formların sık zeminleri ve yazı renkleri (belgenin kendi renkleri — kullanıcı her rengi seçebilir) */
const ZEMINLER = ["#F6D5DA", "#F1DBDB", "#E7E7E7", "#DBE4F0", "#FBF0C9", "#DDEFE3"] as const;
const YAZI_RENKLERI = ["#000000", "#1F3B70", "#9E1B1B", "#555555"] as const;
const KENARLAR: readonly (readonly [KenarTuru, string, string])[] = [
  ["hepsi", "Bütün kenarlar", "M3 3h14v14H3zM10 3v14M3 10h14"], ["dis", "Dış kenarlar", "M3 3h14v14H3z"], ["ic", "İç kenarlar", "M10 3v14M3 10h14"],
  ["yok", "Kenar yok", ""], ["u", "Üst kenar", "M3 3h14"], ["a", "Alt kenar", "M3 17h14"], ["s", "Sol kenar", "M3 3v14"], ["g", "Sağ kenar", "M17 3v14"],
];
const HIZA_YOL: Record<string, string> = {
  s: "M3 5h14M3 9h9M3 13h14M3 17h9", o: "M3 5h14M6 9h8M3 13h14M6 17h8", g: "M3 5h14M8 9h9M3 13h14M8 17h9", y: "M3 5h14M3 9h14M3 13h14M3 17h14",
  u: "M3 3h14M10 7v10", d: "M3 10h14M10 4v3M10 13v3", a: "M3 17h14M10 3v10",
};
const Cizim = ({ yol, cerceve = false }: { yol: string; cerceve?: boolean }) => (
  <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true" focusable="false">
    {cerceve && <rect x="3" y="3" width="14" height="14" strokeDasharray="1.5 2" strokeWidth="1" />}
    {yol && <path d={yol} strokeWidth="2" />}
  </svg>
);
const harf = (c: number) => { let x = "", n = c + 1; while (n > 0) { const m = (n - 1) % 26; x = String.fromCharCode(65 + m) + x; n = Math.floor((n - 1) / 26); } return x; };

export function TabloDuzenleyici({ t, i, b, degis, bildir }: {
  t: FormatTanimi; i: number; b: TabloBolumu; degis: (y: FormatTanimi) => void; bildir: (m: string) => void;
}) {
  const [sec, setSec] = useState<Secim | null>(null);
  const [yazilan, setYazilan] = useState<number | null>(null);
  const [aralik, setAralik] = useState(false);
  const [kalin, setKalin] = useState<1 | 2>(1);
  const surukle = useRef<{ r: number; c: number } | null>(null);
  const tabloRef = useRef<HTMLTableElement>(null);
  const katalog = useContext(BelgeKatalogBaglami);
  const g = kapsama(b), yuzde = sutunYuzdeleri(b), siralar = siraNumaralari(t);
  /* tablo küçülünce dışarıda kalan seçim yok sayılır (genislet köşeleri tabloya sığdırır) */
  const a = sec && sec.r1 < b.satirlar.length && sec.c1 < b.sutun.length ? genislet(b, sec) : null;
  const secili = a ? secimHucreleri(b, a) : [];
  const ilk = secili.length ? b.hucreler[secili[0]] : null;

  const yaz = (y: TabloBolumu, ileti?: string) => { degis({ ...t, bolumler: t.bolumler.map((x, j) => (j === i ? y : x)) }); if (ileti) bildir(`${ileti} (taslak).`); };
  const konum = (e: { target: EventTarget | null }) => {
    const td = (e.target as Element | null)?.closest?.("td[data-r]");
    return td ? { r: Number(td.getAttribute("data-r")), c: Number(td.getAttribute("data-c")) } : null;
  };
  const bas = (e: RPointerEvent<HTMLTableElement>) => {
    if ((e.target as Element).closest("textarea")) return;
    const p = konum(e); if (!p) return;
    if (yazilan !== null) setYazilan(null);
    if ((e.shiftKey || aralik) && sec) { setSec({ ...sec, r2: p.r, c2: p.c }); setAralik(false); return; }
    setSec({ r1: p.r, c1: p.c, r2: p.r, c2: p.c });
    if (e.pointerType === "mouse") surukle.current = p;
  };
  const gez = (e: RPointerEvent<HTMLTableElement>) => {
    if (!surukle.current || !sec) return;
    const el = document.elementFromPoint(e.clientX, e.clientY), p = el ? konum({ target: el }) : null;
    if (p && (p.r !== sec.r2 || p.c !== sec.c2)) setSec({ ...sec, r2: p.r, c2: p.c });
  };
  useEffect(() => { const birak = () => { surukle.current = null; }; window.addEventListener("pointerup", birak); return () => window.removeEventListener("pointerup", birak); }, []);

  /* sütun sınırı tutamağı: c ile c+1 arasındaki pay */
  const sutunTut = (e: RPointerEvent<HTMLSpanElement>, c: number) => {
    e.preventDefault(); e.stopPropagation();
    const gen = tabloRef.current?.getBoundingClientRect().width ?? 1, x0 = e.clientX, y0 = sutunYuzdeleri(b);
    let son = b;
    const hareket = (ev: PointerEvent) => { son = sutunGenisligi(b, c, y0[c] + ((ev.clientX - x0) / gen) * 100); yazGecici(son); };
    const bitti = () => { window.removeEventListener("pointermove", hareket); window.removeEventListener("pointerup", bitti); if (son !== b) yaz(son, "Sütun genişliği değişti"); };
    window.addEventListener("pointermove", hareket); window.addEventListener("pointerup", bitti);
  };
  /* sürüklerken yalnız ekrandaki sütun genişlikleri (tanım bırakınca yazılır — geçmişe tek adım) */
  const yazGecici = (y: TabloBolumu) => {
    const cols = tabloRef.current?.querySelectorAll("col"); if (!cols) return;
    sutunYuzdeleri(y).forEach((w, j) => { const c = cols[j] as HTMLElement | undefined; if (c) c.style.width = `${w}%`; });
  };

  const turDegis = (tur: HucreTuru) => {
    if (!sec) return;
    const al = new Set<string>();
    const yeni = (onek: "c") => { const x = yeniKimlik(t, onek, al); al.add(x); return x; };
    yaz(hucreleriYaz(b, sec, (h) => {
      const ortak = { r: h.r, c: h.c, ...(h.rs ? { rs: h.rs } : {}), ...(h.cs ? { cs: h.cs } : {}), ...(h.s ? { s: h.s } : {}) };
      if (h.tur === tur) return h;
      switch (tur) {
        case "yazi": return { ...ortak, tur, m: h.m ?? "" };
        case "alan": return { ...ortak, tur, id: yeni("c"), alan: "metin" as const };
        case "kayit": {
          if (!katalog) return { ...ortak, tur, kaynak: "firma" as const };
          const v = ilkVeri(katalog, !!b.satirlar[h.r]?.tekrar);
          return { ...ortak, tur, ...(v ? { veri: v } : {}) };
        }
        case "cevap": return { ...ortak, tur, id: yeni("c") };
        case "sira": return { ...ortak, tur };
        case "imza": return { ...ortak, tur, kim: "uzman" as const, eimza: true };
        case "gorsel": return { ...ortak, tur, gorsel: "logo" as const };
        case "foto": return { ...ortak, tur, id: yeni("c"), ad: "Fotoğraf" };
        case "sonuc": return { ...ortak, tur, secenekler: ["UYGUNDUR", "UYGUN DEĞİLDİR"] };
      }
    }), `Hücre: ${turAdi(tur, !!katalog)}`);
  };
  const hucreYaz = (o: Partial<Hucre>, ileti?: string) => sec && yaz(hucreleriYaz(b, sec, (h) => {
    const y = { ...h, ...o } as Hucre;
    for (const x of Object.keys(o) as (keyof Hucre)[]) if (o[x] === undefined || o[x] === "") delete y[x];
    return y;
  }), ileti);
  const stil = <K extends keyof HucreStili>(x: K, v: HucreStili[K] | "" | false) => sec && yaz(stilYaz(b, sec, x, v));

  /* ── hücrenin kâğıttaki görünümü (belgede değer basılır; burada ne geleceği) ── */
  const isaret = (ikon: string, yazi: string) => <span className={s.isaret}><Ikon ad={ikon} kucuk />{yazi}</span>;
  const icerik = (h: Hucre, n: number) => {
    if (yazilan === n && h.tur === "yazi") return <YerindeYazi deger={h.m ?? ""} bitir={(m) => { setYazilan(null); if (m !== (h.m ?? "")) yaz({ ...b, hucreler: b.hucreler.map((x, j) => (j === n ? { ...x, m } : x)) }); }} />;
    switch (h.tur) {
      case "yazi": return (h.m ?? "").split("\n").map((p, j) => <span key={j}>{j > 0 && <br />}{p}</span>);
      case "alan": return isaret(h.formul ? "calculator" : "pencil",
        `${h.ad || (katalog ? `Elle doldurulur · ${ALAN_TURU_ADI[h.alan ?? "metin"]}` : ALAN_TURU_ADI[h.alan ?? "metin"])}${h.birim ? ` · ${h.birim}` : ""}`);
      case "kayit": return isaret("tag", katalog ? (h.veri ? veriAdi(katalog, h.veri) : "Bilgi seçin") : h.kaynak ? TABLO_KAYNAK_ADI[h.kaynak] : "Kaynak seçin");
      case "cevap": return isaret("list-checks", b.cevaplar.join(" / "));
      case "sira": return <span>{siralar.get(`${b.id}:${h.r},${h.c}`) ?? ""}</span>;
      case "imza": return isaret("file-signature", `İmza · ${h.kim ? KISI_ADI[h.kim] : "kişi seçin"}${h.eimza ? " · e-imza" : ""}`);
      case "gorsel": return <span className={s.gorsel}>{h.gorsel === "akr" ? "AKR." : "LOGO"}</span>;
      case "foto": return isaret("camera", h.ad || "Fotoğraf");
      /* 2026-10-24: cümle (m — sözcükten önceki kısım) varsa önünde; belge "m SÖZCÜK" basar */
      case "sonuc": return <>
        {h.m?.trim() && <>{h.m.trimEnd().split("\n").map((p, j) => <span key={j}>{j > 0 && <br />}{p}</span>)} </>}
        {isaret("circle-check", (h.secenekler?.length ? h.secenekler : ["UYGUNDUR", "UYGUN DEĞİLDİR"]).join(" / "))}
      </>;
    }
  };

  const tekrarSatirlari = new Set(b.satirlar.flatMap((x, r) => (x.tekrar ? [r] : [])));
  return (
    <div className={s.kap}>
      <div className={s.kaydir}>
        <div className={s.tabloKap}>
          {/* sütun sınırı tutamakları */}
          {yuzde.slice(0, -1).map((_, c) => {
            const sol = yuzde.slice(0, c + 1).reduce((x, y) => x + y, 0);
            return <span key={c} className={s.sutunTut} style={{ left: `${sol}%` }} onPointerDown={(e) => sutunTut(e, c)} role="separator" aria-orientation="vertical"
              aria-label={`${harf(c)} ile ${harf(c + 1)} sütunlarının sınırı`} />;
          })}
          <table ref={tabloRef} className={`rb-tablo ${s.tablo}`} onPointerDown={bas} onPointerMove={gez}
            onDoubleClick={(e) => { const p = konum(e); if (!p) return; const n = g[p.r]?.[p.c]; if (n !== null && n !== undefined && b.hucreler[n].tur === "yazi") setYazilan(n); }}
            aria-label={`${b.ad} · tablo`}>
            <colgroup>{yuzde.map((w, c) => <col key={c} style={{ width: `${w}%` }} />)}</colgroup>
            <tbody>
              {b.satirlar.map((x, r) => (
                <tr key={r} className={tekrarSatirlari.has(r) ? s.tekrar : undefined} style={x.y ? { height: `${x.y}mm` } : undefined}>
                  {b.sutun.map((_, c) => {
                    const n = g[r]?.[c];
                    if (n === null || n === undefined) return <td key={c} data-r={r} data-c={c} style={hucreBicemi({}, t.gorunum.yazi, !!x.y) as CSSProperties} className={a && r >= a.r1 && r <= a.r2 && c >= a.c1 && c <= a.c2 ? s.secili : undefined} />;
                    const h = b.hucreler[n];
                    if (h.r !== r || h.c !== c) return null;
                    const sec_ = !!a && r >= a.r1 && r <= a.r2 && c >= a.c1 && c <= a.c2;
                    return (
                      <td key={c} data-r={r} data-c={c} rowSpan={h.rs} colSpan={h.cs} style={hucreBicemi(h, t.gorunum.yazi, !!x.y) as CSSProperties}
                        className={sec_ ? s.secili : undefined} title={turAdi(h.tur, !!katalog)}>
                        {icerik(h, n)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {a && ilk && (
        <div className={k.panel} role="group" aria-label={`${b.ad} · seçili hücreler`}>
          <div className={k.panelBas}>
            <b>{harf(a.c1)}{a.r1 + 1}{(a.r2 > a.r1 || a.c2 > a.c1) && `:${harf(a.c2)}${a.r2 + 1}`} · {secili.length > 1 ? `${secili.length} hücre` : turAdi(ilk.tur, !!katalog)}</b>
            <button type="button" className={k.tus} aria-label="Seçimi kapat" onClick={() => setSec(null)}><Ikon ad="x" kucuk /></button>
          </div>

          <div className={s.grup} role="group" aria-label="Tablo">
            <button type="button" className={s.tus} disabled={secili.length < 2} onClick={() => { yaz(birlestir(b, a), "Hücreler birleştirildi"); }}>Birleştir</button>
            <button type="button" className={s.tus} disabled={!secili.some((n) => (b.hucreler[n].rs ?? 1) > 1 || (b.hucreler[n].cs ?? 1) > 1)} onClick={() => yaz(ayir(b, a), "Hücre ayrıldı")}>Ayır</button>
            <button type="button" className={s.tus} aria-pressed={aralik} onClick={() => setAralik(!aralik)}>Aralık seç</button>
            <span className={s.ayrac} />
            <span className={s.etiket}>Satır</span>
            <button type="button" className={s.tus} onClick={() => { yaz(satirEkle(b, a.r1), "Satır eklendi"); setSec({ r1: a.r1, c1: a.c1, r2: a.r1, c2: a.c1 }); }}>Üste ekle</button>
            <button type="button" className={s.tus} onClick={() => { yaz(satirEkle(b, a.r2 + 1), "Satır eklendi"); setSec({ r1: a.r2 + 1, c1: a.c1, r2: a.r2 + 1, c2: a.c1 }); }}>Alta ekle</button>
            <button type="button" className={`${s.tus} ${s.sil}`} disabled={b.satirlar.length <= a.r2 - a.r1 + 1} aria-label="Seçili satırları sil" title="Seçili satırları sil"
              onClick={() => { let y = b; for (let r = a.r2; r >= a.r1; r--) y = satirSil(y, r); yaz(y, "Satır silindi"); setSec(null); }}><Ikon ad="trash-2" kucuk /></button>
            <span className={s.etiket}>Sütun</span>
            <button type="button" className={s.tus} onClick={() => { yaz(sutunEkle(b, a.c1), "Sütun eklendi"); setSec({ r1: a.r1, c1: a.c1, r2: a.r1, c2: a.c1 }); }}>Sola ekle</button>
            <button type="button" className={s.tus} onClick={() => { yaz(sutunEkle(b, a.c2 + 1), "Sütun eklendi"); setSec({ r1: a.r1, c1: a.c2 + 1, r2: a.r1, c2: a.c2 + 1 }); }}>Sağa ekle</button>
            <button type="button" className={`${s.tus} ${s.sil}`} disabled={b.sutun.length <= a.c2 - a.c1 + 1} aria-label="Seçili sütunları sil" title="Seçili sütunları sil"
              onClick={() => { let y = b; for (let c = a.c2; c >= a.c1; c--) y = sutunSil(y, c); yaz(y, "Sütun silindi"); setSec(null); }}><Ikon ad="trash-2" kucuk /></button>
          </div>
          <div className={k.panelSatir}>
            <label className={s.sayiAlan}>Sütun genişliği %
              <SayiKutu deger={Math.round(yuzde[a.c1])} en={2} enCok={98} ad="Sütun genişliği yüzde" yaz={(v) => yaz(sutunGenisligi(b, a.c1, v))} /></label>
            <label className={s.sayiAlan}>Satır yüksekliği mm
              <SayiKutu deger={b.satirlar[a.r1]?.y ?? 0} en={0} enCok={250} ad="Satır yüksekliği milimetre" bosSifir
                yaz={(v) => yaz({ ...b, satirlar: b.satirlar.map((x, r) => (r >= a.r1 && r <= a.r2 ? { ...x, y: v || undefined } : x)) })} /></label>
            <label className={k.panelKutu}><input type="checkbox" checked={!!b.satirlar[a.r1]?.tekrar}
              onChange={(e) => {
                const al = new Set<string>();
                yaz({ ...b, satirlar: b.satirlar.map((x, r) => {
                  if (r < a.r1 || r > a.r2) return x;
                  if (!e.target.checked) { const { tekrar: _t, ...geri } = x; void _t; return geri; }
                  const id = x.id ?? yeniKimlik(t, "r", al); al.add(id);
                  return { ...x, tekrar: true, id };
                }) }, e.target.checked ? "Satır sahada çoğalır" : "Satır sabit");
              }} />{katalog ? "Bu satır listedeki her öğe için çoğalır" : "Bu satır sahada çoğalır (ölçüm satırı)"}</label>
          </div>

          {secili.length >= 1 && (
            <div className={s.grup} role="radiogroup" aria-label="Hücrenin içeriği">
              {/* belge kipinde rapora özgü türler (kontrol cevabı, imza kişisi, fotoğraf, raporun sonucu) yok; alan hücresi "Elle doldurulur" */}
              {HUCRE_TURLERI.filter((x) => !katalog || BELGE_TURLERI_HUCRE.includes(x)).map((x) => (
                <button key={x} type="button" role="radio" aria-checked={secili.every((n) => b.hucreler[n].tur === x)} className={s.turTus} onClick={() => turDegis(x)}>
                  <Ikon ad={HUCRE_IKON[x]} kucuk />{turAdi(x, !!katalog)}</button>
              ))}
            </div>
          )}
          {secili.length === 1 && <TurAyari b={b} h={ilk} katalog={katalog} yaz={hucreYaz} bolum={(o, ileti) => yaz({ ...b, ...o }, ileti)} />}

          <div className={s.grup} role="group" aria-label="Yazı">
            <span className={s.secimKap}>
              <SecimAlani id={`kb-${b.id}-yt`} ad="Yazı tipi" etiketsiz deger={ilk.s?.f ?? ""} ipucu="Belgenin yazı tipi"
                secenekler={[["", "Belgenin yazı tipi", ""] as const, ...YAZI_TIPLERI.map((x) => [x, YAZI_TIPI_ADI[x], ""] as const)]}
                degistir={(v) => stil("f", (v || "") as YaziTipi | "")} />
            </span>
            <span className={s.sayi}>
              <button type="button" aria-label="Yazıyı küçült" onClick={() => stil("b", Math.max(5, (ilk.s?.b ?? t.gorunum.yazi?.boy ?? 9) - 0.5))}>−</button>
              <span aria-live="polite">{ilk.s?.b ?? t.gorunum.yazi?.boy ?? 9} pt</span>
              <button type="button" aria-label="Yazıyı büyüt" onClick={() => stil("b", Math.min(40, (ilk.s?.b ?? t.gorunum.yazi?.boy ?? 9) + 0.5))}>+</button>
            </span>
            <button type="button" className={s.tus} aria-pressed={!!ilk.s?.k} aria-label="Kalın" title="Kalın" onClick={() => stil("k", !ilk.s?.k)}><b>K</b></button>
            <button type="button" className={s.tus} aria-pressed={!!ilk.s?.i} aria-label="Eğik" title="Eğik" onClick={() => stil("i", !ilk.s?.i)}><i>E</i></button>
            <button type="button" className={s.tus} aria-pressed={!!ilk.s?.u} aria-label="Altı çizili" title="Altı çizili" onClick={() => stil("u", !ilk.s?.u)}><u>A</u></button>
            <span className={s.ayrac} />
            {(["s", "o", "g", "y"] as const).map((x) => (
              <button key={x} type="button" className={s.tus} aria-pressed={(ilk.s?.a ?? "s") === x} onClick={() => stil("a", x === "s" ? "" : x)}
                aria-label={{ s: "Sola", o: "Ortaya", g: "Sağa", y: "İki yana" }[x]} title={{ s: "Sola", o: "Ortaya", g: "Sağa", y: "İki yana" }[x]}><Cizim yol={HIZA_YOL[x]} /></button>
            ))}
            <span className={s.ayrac} />
            {(["u", "o", "a"] as const).map((x) => (
              <button key={x} type="button" className={s.tus} aria-pressed={(ilk.s?.d ?? "o") === x} onClick={() => stil("d", x === "o" ? "" : x)}
                aria-label={{ u: "Üste", o: "Dikeyde ortaya", a: "Alta" }[x]} title={{ u: "Üste", o: "Dikeyde ortaya", a: "Alta" }[x]}><Cizim yol={HIZA_YOL[x === "o" ? "d" : x]} /></button>
            ))}
          </div>
          <div className={s.grup}>
            <span className={s.etiket}>Yazı rengi</span>
            <Renkler deger={ilk.s?.r} liste={YAZI_RENKLERI} ad="Yazı rengi" yaz={(v) => stil("r", v)} />
            <span className={s.etiket}>Zemin</span>
            <Renkler deger={ilk.s?.z} liste={ZEMINLER} ad="Zemin" yok yaz={(v) => stil("z", v)} />
          </div>
          <div className={s.grup} role="group" aria-label="Kenarlar">
            <span className={s.etiket}>Kenar</span>
            {KENARLAR.map(([x, ad, yol]) => (
              <button key={x} type="button" className={s.tus} aria-label={ad} title={ad} onClick={() => yaz(kenarYaz(b, a, x, kalin, t.gorunum.yazi?.kalin ?? 1))}>
                <Cizim yol={yol} cerceve /></button>
            ))}
            <button type="button" className={s.tus} aria-pressed={kalin === 1} onClick={() => setKalin(1)}>İnce</button>
            <button type="button" className={s.tus} aria-pressed={kalin === 2} onClick={() => setKalin(2)}>Kalın</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** seçili tek hücrenin içeriğe göre ayarları */
function TurAyari({ b, h, katalog, yaz, bolum }: {
  b: TabloBolumu; h: Hucre; katalog: BelgeKatalogu | null; yaz: (o: Partial<Hucre>, ileti?: string) => void; bolum: (o: Partial<TabloBolumu>, ileti?: string) => void;
}) {
  const id = `kb-${b.id}-${h.r}-${h.c}`;
  if (h.tur === "yazi") return <div className={k.panelSatir}><label className={k.panelAlan}>Yazı
    <MetinKutu id={`${id}-m`} deger={h.m ?? ""} cok yaz={(v) => yaz({ m: v })} /></label></div>;
  if (h.tur === "alan") return (
    <div className={k.panelSatir}>
      <span className={s.secimKap}><SecimAlani id={`${id}-at`} ad="Değer türü" deger={h.alan ?? "metin"} etiketsiz
        secenekler={HUCRE_ALAN_TURLERI.map((x) => [x, ALAN_TURU_ADI[x], ""] as const)}
        degistir={(v) => yaz({ alan: v as HucreAlanTuru, ...(v === "secim" && !h.secenekler?.length ? { secenekler: ["Seçenek 1", "Seçenek 2"] } : {}) })} /></span>
      <label className={k.panelAlan}>{katalog ? "Doldururken adı" : "Sahadaki adı"}<MetinKutu id={`${id}-ad`} deger={h.ad ?? ""} ipucu="soldaki ya da üstteki yazı" yaz={(v) => yaz({ ad: v || undefined })} /></label>
      <label className={k.panelAlan}>Birim<MetinKutu id={`${id}-bi`} deger={h.birim ?? ""} yaz={(v) => yaz({ birim: v || undefined })} /></label>
      {h.alan === "secim" && <label className={k.panelAlan}>Seçenekler (satır başına bir)
        <MetinKutu id={`${id}-se`} deger={(h.secenekler ?? []).join("\n")} cok yaz={(v) => yaz({ secenekler: v.split("\n").map((x) => x.trim()).filter(Boolean) })} /></label>}
      <label className={k.panelAlan}>Formül<MetinKutu id={`${id}-fo`} deger={h.formul ?? ""} ipucu="ör. [Kapasite] × 1,25" yaz={(v) => yaz({ formul: v || undefined })} /></label>
      <label className={k.panelKutu}><input type="checkbox" checked={!!h.zorunlu} onChange={(e) => yaz({ zorunlu: e.target.checked || undefined })} />Zorunlu</label>
    </div>
  );
  if (h.tur === "kayit" && katalog) {
    const l = veriSecenekleri(katalog, !!b.satirlar[h.r]?.tekrar);
    /* satırın çoğalması kaldırılınca listenin kolonu seçeneklerde yok — seçili bilgi yine adıyla görünür */
    const secenekler = h.veri && !l.some((x) => x[0] === h.veri) ? [[h.veri, veriAdi(katalog, h.veri), ""] as const, ...l] : l;
    return (
      <div className={k.panelSatir}><span className={s.secimKap}>
        <SecimAlani id={`${id}-bv`} ad="Belgeden gelen bilgi" deger={h.veri ?? ""} etiketsiz ipucu="Bilgi seçin" secenekler={secenekler}
          degistir={(v) => yaz({ veri: v, kaynak: undefined }, "Hücrenin bilgisi değişti")} />
      </span></div>
    );
  }
  if (h.tur === "kayit") return (
    <div className={k.panelSatir}><span className={s.secimKap}>
      <SecimAlani id={`${id}-ka`} ad="Kayıttan gelen bilgi" deger={h.kaynak ?? ""} etiketsiz ipucu="Bilgi seçin"
        secenekler={TABLO_KAYNAKLARI.map((x) => [x, TABLO_KAYNAK_ADI[x], ""] as const)} degistir={(v) => yaz({ kaynak: v as TabloKaynagi })} />
    </span></div>
  );
  if (h.tur === "cevap") return (
    <div className={k.panelSatir}>
      <label className={k.panelAlan}>Maddenin metni<MetinKutu id={`${id}-mm`} deger={h.m ?? ""} ipucu="satırın yazıları" yaz={(v) => yaz({ m: v || undefined })} /></label>
      <label className={k.panelAlan}>Cevaplar (2. cevap “uygun değil”; satır başına bir)
        <MetinKutu id={`${id}-cv`} deger={b.cevaplar.join("\n")} cok yaz={(v) => { const l = v.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 6); if (l.length >= 2) bolum({ cevaplar: l }, "Cevaplar değişti"); }} /></label>
    </div>
  );
  if (h.tur === "imza") return (
    <div className={k.panelSatir}>
      <span className={s.secimKap}><SecimAlani id={`${id}-ki`} ad="Kimin imzası" deger={h.kim ?? ""} etiketsiz
        secenekler={(Object.keys(KISI_ADI) as (keyof typeof KISI_ADI)[]).map((x) => [x, KISI_ADI[x], ""] as const)} degistir={(v) => yaz({ kim: v as keyof typeof KISI_ADI })} /></span>
      {(h.kim === "uzman" || h.kim === "teknik") && <label className={k.panelKutu}><input type="checkbox" checked={!!h.eimza} onChange={(e) => yaz({ eimza: e.target.checked || undefined })} />E-imza bu hücrede</label>}
    </div>
  );
  if (h.tur === "gorsel") return (
    <div className={k.panelSatir}><span className={s.secimKap}><SecimAlani id={`${id}-go`} ad="Görsel" deger={h.gorsel ?? "logo"} etiketsiz
      secenekler={[["logo", "Firma logosu", ""], ["akr", "Akreditasyon no", ""]] as const} degistir={(v) => yaz({ gorsel: v as "logo" | "akr" })} /></span></div>
  );
  if (h.tur === "foto") return <div className={k.panelSatir}><label className={k.panelAlan}>Kutunun adı
    <MetinKutu id={`${id}-fa`} deger={h.ad ?? ""} yaz={(v) => yaz({ ad: v || undefined })} /></label></div>;
  if (h.tur === "sonuc") return (
    <div className={k.panelSatir}>
      <label className={k.panelAlan}>Cümle<MetinKutu id={`${id}-sm`} deger={h.m ?? ""} cok yaz={(v) => yaz({ m: v.trim() ? v : undefined })} /></label>
      <label className={k.panelAlan}>Sözcükler: uygun · uygun değil · (isteğe bağlı) şartlı uygun — satır başına bir
        <MetinKutu id={`${id}-so`} deger={(h.secenekler ?? ["UYGUNDUR", "UYGUN DEĞİLDİR"]).join("\n")} cok
          yaz={(v) => yaz({ secenekler: v.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 3) })} /></label>
    </div>
  );
  if (h.tur === "sira") return (
    <div className={k.panelSatir}><label className={k.panelKutu}><input type="checkbox" checked={!!b.siraDevam} onChange={(e) => bolum({ siraDevam: e.target.checked || undefined })} />Numara önceki tablodan sürer</label></div>
  );
  return null;
}

/** yazı hücresinin kâğıtta yerinde yazısı (Enter yazar, Shift+Enter yeni satır, Esc vazgeçer) */
function YerindeYazi({ deger, bitir }: { deger: string; bitir: (m: string) => void }) {
  const [x, setX] = useState(deger);
  const r = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { r.current?.focus(); r.current?.select(); }, []);
  return <textarea ref={r} className={s.yerinde} aria-label="Hücrenin yazısı" value={x} maxLength={2000} rows={1} onChange={(e) => setX(e.target.value)}
    onBlur={() => bitir(x)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); bitir(x); } else if (e.key === "Escape") { e.preventDefault(); bitir(deger); } }} />;
}
/** panelde yazı kutusu — çıkınca yazar */
function MetinKutu({ id, deger, yaz, cok = false, ipucu }: { id: string; deger: string; yaz: (v: string) => void; cok?: boolean; ipucu?: string }) {
  const [x, setX] = useState<string | null>(null);
  const ortak = { id, className: k.panelGirdi, value: x ?? deger, placeholder: ipucu, onChange: (e: { target: { value: string } }) => setX(e.target.value),
    onBlur: () => { if (x !== null && x !== deger) yaz(x); setX(null); } };
  return cok ? <textarea {...ortak} rows={3} className={`${k.panelGirdi} ${s.cokSatir}`} /> : <input {...ortak} />;
}
function SayiKutu({ deger, en, enCok, ad, yaz, bosSifir = false }: { deger: number; en: number; enCok: number; ad: string; yaz: (n: number) => void; bosSifir?: boolean }) {
  const [x, setX] = useState<string | null>(null);
  return <input className={`${k.panelGirdi} ${s.sayiGirdi}`} aria-label={ad} inputMode="decimal" value={x ?? (bosSifir && !deger ? "" : String(deger))}
    onChange={(e) => setX(e.target.value)}
    onBlur={() => { if (x === null) return; const n = x.trim() === "" && bosSifir ? 0 : Number(x.replace(",", ".")); if (Number.isFinite(n) && n >= en && n <= enCok) yaz(n); setX(null); }} />;
}
function Renkler({ deger, liste, ad, yaz, yok = false }: { deger?: string; liste: readonly string[]; ad: string; yaz: (v: string) => void; yok?: boolean }) {
  return (
    <span className={s.renkler} role="group" aria-label={ad}>
      {yok && <button type="button" className={`${s.renk} ${s.renkYok}`} aria-label={`${ad} yok`} aria-pressed={!deger} onClick={() => yaz("")} />}
      {liste.map((r) => <button key={r} type="button" className={s.renk} style={{ background: r }} aria-label={`${ad} ${r}`} aria-pressed={deger?.toUpperCase() === r} onClick={() => yaz(r)} />)}
      <input type="color" className={s.renkOzel} aria-label={`${ad} · özel renk`} value={(deger ?? (yok ? "#ffffff" : "#000000")).toLowerCase()} onChange={(e) => yaz(e.target.value.toUpperCase())} />
    </span>
  );
}
