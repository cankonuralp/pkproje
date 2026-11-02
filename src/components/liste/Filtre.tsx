"use client";
/* FİLTRE SATIRI — tek üretici (kalıp 15; maketteki MK.suzgecHtml + olay işleyicileri). Tek akış, kuralın sırasıyla:
   arama (ya da alan alan arama kutuları) → durum çipleri + ve/veya → seçiciler + Temizle SAĞDA. Hepsi sığmazsa seçiciler + Temizle
   birlikte alt satırın sağına kayar (Temizle yalnız kalmaz). Telefonda (< 768) seçiciler "Filtre" tuşunun açtığı levhada; çip şeridi
   yana kayar. Kutu açılır kapanır (reisim 2026-09-27); başlıkta uygulanan filtre sayısı; tercih bu tarayıcıda sayfa başına hatırlanır.
   Durum dışarıda (useSuzgec): bileşen yalnız çizer ve değişikliği bildirir.
   2026-11-02 (liste maketi onaylı — reisim "filtrelemeler daha detaylı olmalı", örnek ekran): tanım izgara ise seçiciler de alan aramalarıyla aynı
   ızgarada başlıklı kutu (telefonda da; Filtre levhası yok); tarih aralığı kutusu pencerede hazır seçenekler + başlangıç / bitiş günü. */
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Ikon } from "../ikon/Ikon";
import { Pencere } from "../pencere/Pencere";
import { TarihAlani } from "../secim/TarihAlani";
import { gorunenSecenekler, KalanNotu, SecenekArama, SecenekListesi, SecenekTusu, UZUN_LISTE, useDisariTiklama } from "../secim/SecenekListesi";
import { Tus } from "../tus/Tus";
import type { ListeKipi } from "./Liste";
import { aktifSecici, hazirAraliklar, suzgecVar, temizle, uygulanan, type Secici, type SuzgecDurumu, type SuzgecTanimi, type TarihAraligi } from "./suzgec";
import stil from "./Filtre.module.css";


export function FiltreSatiri<K>({ on, tanim, durum, degistir, tb, kip = "tablo", cipSayilari }: {
  /** sayfadaki süzgecin kısa adı (açık / kapalı tercihi bununla hatırlanır) */
  on: string;
  tanim: SuzgecTanimi<K>;
  durum: SuzgecDurumu;
  degistir: (d: SuzgecDurumu) => void;
  /** çipler hariç süzgeçten geçen kayıtlar (çip sayıları) */
  tb: readonly K[];
  kip?: ListeKipi;
  /** 566: sunucuda süzülen listede çip sayıları sunucudan */
  cipSayilari?: Record<string, number>;
}) {
  const yol = usePathname();
  const anahtar = `probata-suzgec-${yol}-${on}`;
  const kutu = useRef<HTMLDetailsElement>(null);
  const [levha, setLevha] = useState(false);
  /* kutu ilk çizimde açık; bu tarayıcıda kapatıldıysa kapanır (durum DOM'da, React yeniden çizince ezmez) */
  useEffect(() => {
    try { if (localStorage.getItem(anahtar) === "kapali" && kutu.current) kutu.current.open = false; } catch { /* depolama kapalı: kutu açık gelir */ }
  }, [anahtar]);

  const yeni = (p: Partial<SuzgecDurumu>) => degistir({ ...durum, ...p, sayfa: 1 });
  const secDegis = (k: string, v: string) => degistir({ ...durum, sec: { ...durum.sec, [k]: v }, sayfa: 1 });
  const temiz = () => degistir(temizle(tanim, durum));
  const say = uygulanan(tanim, durum);
  const izgara = !!tanim.izgara;
  const secicili = tanim.seciciler.length > 0 && !izgara;
  const rozet = aktifSecici(tanim, durum);
  const az = durum.secili.length < 2;

  return (
    <details className={stil.kutu} ref={kutu} open onToggle={(e) => {
      const a = (e.currentTarget as HTMLDetailsElement).open;
      try { localStorage.setItem(anahtar, a ? "acik" : "kapali"); } catch { /* tercih hatırlanmaz */ }
    }}>
      <summary className={stil.bas}>
        <Ikon ad="sliders-horizontal" kucuk />
        <span>Filtreler</span>
        {say > 0 && <span className={stil.say}>{say} filtre uygulandı</span>}
        <span className={stil.ok}><Ikon ad="chevron-down" kucuk /></span>
      </summary>
      <div className={stil.satir} data-sz={on} data-secicisiz={secicili ? undefined : ""} data-liste-kip={kip}>
        {tanim.alanlar || izgara ? (
          <div className={stil.alanlar}>
            {(tanim.alanlar ?? []).map((x) => (
              <label key={x.k} className={stil.alanAra}>
                <span className={stil.alanAd}>{x.ad}</span>
                <input className={stil.girdi} type="search" placeholder={x.ipucu ?? ""} autoComplete="off" value={durum.alan[x.k] ?? ""}
                  onChange={(e) => yeni({ alan: { ...durum.alan, [x.k]: e.target.value } })} />
              </label>
            ))}
            {izgara && tanim.seciciler.filter((x) => !x.siralama).map((x) => (
              <IzgaraSecici key={x.k} secici={x} deger={durum.sec[x.k]} degistir={(v) => secDegis(x.k, v)} />
            ))}
            {izgara && tanim.tarih && <TarihKutusu ad={tanim.tarih.ad} deger={durum.tarih ?? { bas: "", bit: "" }} degistir={(v) => yeni({ tarih: v })} />}
            {izgara && tanim.seciciler.filter((x) => x.siralama).map((x) => (
              <IzgaraSecici key={x.k} secici={x} deger={durum.sec[x.k]} degistir={(v) => secDegis(x.k, v)} sira />
            ))}
          </div>
        ) : (
          <Arama ad={tanim.ad} ipucu={tanim.ipucu} deger={durum.ara} degistir={(v) => yeni({ ara: v })} />
        )}
        {secicili && (
          <button className={stil.filtreTus} type="button" aria-haspopup="dialog" onClick={() => setLevha(true)}>
            <Ikon ad="sliders-horizontal" />Filtre{rozet > 0 && <span className={stil.rozet}>{rozet}</span>}
          </button>
        )}
        {tanim.cipler.length > 0 && (
          <div className={stil.cipler} role="group" aria-label={`${tanim.birim} durumu filtresi`}>
            {tanim.cipler.map((c) => {
              const basili = durum.secili.includes(c.k);
              return (
                <button key={c.k} className={stil.cip} type="button" aria-pressed={basili} data-cip={c.k}
                  onClick={() => yeni({ secili: basili ? durum.secili.filter((x) => x !== c.k) : [...durum.secili, c.k] })}>
                  {c.ad} <span className={stil.cipSayi}>{cipSayilari ? (cipSayilari[c.k] ?? 0) : tb.filter(c.test).length}</span>
                </button>
              );
            })}
            {tanim.cipler.length >= 2 && (
              <div className={stil.kip} role="group" aria-label="Seçili çipleri birleştirme" aria-disabled={az}
                title="veya: seçili çiplerden herhangi birine uyanlar · ve: hepsine uyanlar">
                {(["veya", "ve"] as const).map((k) => (
                  <button key={k} type="button" aria-pressed={durum.kip === k} disabled={az} data-kip={k} onClick={() => yeni({ kip: k })}>{k}</button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className={stil.sag}>
          <div className={stil.seciciler}>
            {!izgara && tanim.seciciler.map((x) => (
              <FiltreSecici key={x.k} secici={x} deger={durum.sec[x.k]} degistir={(v) => secDegis(x.k, v)} />
            ))}
          </div>
          <button className={stil.temizle} type="button" disabled={!suzgecVar(tanim, durum)} onClick={temiz}>
            <Ikon ad="filter-x" kucuk />Temizle
          </button>
        </div>
      </div>
      {secicili && (
        <Pencere acik={levha} baslik="Filtre" onKapat={() => setLevha(false)}
          alt={<>
            <Tus tur="ikincil" onClick={temiz}>Temizle</Tus>
            <Tus onClick={() => setLevha(false)} data-ilk-odak="">Sonuçları göster</Tus>
          </>}>
          {tanim.seciciler.map((x) => <LevhaGrubu key={x.k} secici={x} deger={durum.sec[x.k]} degistir={(v) => secDegis(x.k, v)} />)}
        </Pencere>
      )}
    </details>
  );
}

function Arama({ ad, ipucu, deger, degistir }: { ad: string; ipucu: string; deger: string; degistir: (v: string) => void }) {
  const girdi = useRef<HTMLInputElement>(null);
  return (
    <label className={deger ? `${stil.ara} ${stil.dolu}` : stil.ara}>
      <span className="gizli">{ad}</span>
      <Ikon ad="search" />
      <input ref={girdi} type="search" placeholder={ipucu} autoComplete="off" value={deger} onChange={(e) => degistir(e.target.value)} />
      <button className={stil.araSil} type="button" aria-label="Aramayı temizle" onClick={() => { degistir(""); girdi.current?.focus(); }}>
        <Ikon ad="x" kucuk />
      </button>
    </label>
  );
}

/* seçici: etiket + değer + ortak seçenek listesi (klavye, uzun listede arama; kalıp 19). Dışarı tıklama ve Esc kapatır. */
function FiltreSecici<K>({ secici, deger, degistir }: { secici: Secici<K>; deger: string; degistir: (v: string) => void }) {
  const [acik, setAcik] = useState(false);
  const kap = useRef<HTMLDivElement>(null);
  const tus = useRef<HTMLButtonElement>(null);
  const listeId = useId();
  const kapat = useCallback(() => setAcik(false), []);
  useDisariTiklama(acik, kap, kapat);
  const secenekler = secici.secenek();
  const gor = secenekler.find((o) => o[0] === deger) ?? secenekler[0];
  return (
    <div className={secici.siralama ? `${stil.secici} ${stil.seciciSira}` : stil.secici} ref={kap} data-secici={secici.k}>
      <button ref={tus} className={stil.seciciTus} type="button" aria-haspopup="listbox" aria-expanded={acik} aria-controls={acik ? listeId : undefined}
        onClick={() => setAcik(!acik)}>
        <span className={stil.seciciEtiket}>{secici.ad}</span>
        <span className={stil.seciciDeger}>{gor?.[1]}</span>
        <Ikon ad="chevron-down" kucuk />
      </button>
      {acik && (
        <SecenekListesi id={listeId} ad={secici.ad} secenekler={secenekler} deger={deger} yuzen={{ genislik: "dogal", hiza: "sag" }}
          sec={(v) => { degistir(v); setAcik(false); tus.current?.focus(); }}
          kapat={(geri) => { setAcik(false); if (geri) tus.current?.focus(); }} />
      )}
    </div>
  );
}

/* ızgara seçicisi: başlıklı kutu (alan aramalarıyla aynı boy); seçenek listesi kutunun altında, kutu genişliğinde */
function IzgaraSecici<K>({ secici, deger, degistir, sira = false }: { secici: Secici<K>; deger: string; degistir: (v: string) => void; sira?: boolean }) {
  const [acik, setAcik] = useState(false);
  const kap = useRef<HTMLDivElement>(null);
  const tus = useRef<HTMLButtonElement>(null);
  const listeId = useId(), adId = useId();
  const kapat = useCallback(() => setAcik(false), []);
  useDisariTiklama(acik, kap, kapat);
  const secenekler = secici.secenek();
  const gor = secenekler.find((o) => o[0] === deger) ?? secenekler[0];
  const dolu = !sira && deger !== "tumu";
  return (
    <div className={sira ? `${stil.alanAra} ${stil.seciciSira}` : stil.alanAra} ref={kap} data-secici={secici.k}>
      <span className={stil.alanAd} id={adId}>{secici.ad}</span>
      <button ref={tus} className={`${stil.girdi} ${stil.kutuTus}`} type="button" aria-haspopup="listbox" aria-expanded={acik}
        aria-controls={acik ? listeId : undefined} aria-labelledby={adId} data-dolu={dolu || undefined} onClick={() => setAcik(!acik)}>
        <span className={stil.kutuDeger}>{gor?.[1]}</span>
        <Ikon ad="chevron-down" kucuk />
      </button>
      {acik && (
        <SecenekListesi id={listeId} ad={secici.ad} secenekler={secenekler} deger={deger} yuzen={{ genislik: "alan" }}
          sec={(v) => { degistir(v); setAcik(false); tus.current?.focus(); }}
          kapat={(geri) => { setAcik(false); if (geri) tus.current?.focus(); }} />
      )}
    </div>
  );
}

const GUN_TR = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const gunNo = (g: string) => `${g.slice(8, 10)}.${g.slice(5, 7)}.${g.slice(0, 4)}`;
/** tarih aralığının kutudaki yazısı: hazır seçenekse adı, değilse "GG.AA.YYYY – GG.AA.YYYY", boşsa Tümü */
function tarihYazisi(d: TarihAraligi, bugun: string): string {
  if (!d.bas && !d.bit) return "Tümü";
  const h = hazirAraliklar(bugun).find((x) => x.bas === d.bas && x.bit === d.bit);
  return h ? h.ad : `${d.bas ? gunNo(d.bas) : "…"} – ${d.bit ? gunNo(d.bit) : "…"}`;
}

/* tarih aralığı kutusu: tıklayınca pencere — hazır seçenekler ya da başlangıç / bitiş günü; Uygula ile süzer */
function TarihKutusu({ ad, deger, degistir }: { ad: string; deger: TarihAraligi; degistir: (v: TarihAraligi) => void }) {
  const [acik, setAcik] = useState(false);
  const [taslak, setTaslak] = useState<TarihAraligi>(deger);
  const adId = useId(), basId = useId(), bitId = useId();
  const bugun = GUN_TR.format(new Date());
  const dolu = !!(deger.bas || deger.bit);
  const ters = !!(taslak.bas && taslak.bit && taslak.bas > taslak.bit);
  return (
    <div className={stil.alanAra} data-tarih-araligi="">
      <span className={stil.alanAd} id={adId}>{ad}</span>
      <button className={`${stil.girdi} ${stil.kutuTus}`} type="button" aria-haspopup="dialog" aria-labelledby={adId} data-dolu={dolu || undefined}
        onClick={() => { setTaslak(deger); setAcik(true); }}>
        <span className={stil.kutuDeger}>{tarihYazisi(deger, bugun)}</span>
        <Ikon ad="calendar" kucuk />
      </button>
      <Pencere acik={acik} baslik={ad} onKapat={() => setAcik(false)}
        alt={<>
          <Tus tur="ikincil" onClick={() => { degistir({ bas: "", bit: "" }); setAcik(false); }}>Temizle</Tus>
          <Tus disabled={ters} onClick={() => { degistir(taslak); setAcik(false); }} data-ilk-odak="">Uygula</Tus>
        </>}>
        <div className={stil.levhaSecenekler} role="group" aria-label="Hazır aralıklar">
          {hazirAraliklar(bugun).map((h) => (
            <button key={h.k} className={stil.cip} type="button" aria-pressed={taslak.bas === h.bas && taslak.bit === h.bit}
              onClick={() => setTaslak({ bas: h.bas, bit: h.bit })}>{h.ad}</button>
          ))}
        </div>
        <div className={stil.tarihIki}>
          <div className={stil.alanAra}><label className={stil.alanAd} htmlFor={basId}>Başlangıç</label>
            <TarihAlani id={basId} ad="Başlangıç" deger={taslak.bas} degistir={(v) => setTaslak({ ...taslak, bas: v })} /></div>
          <div className={stil.alanAra}><label className={stil.alanAd} htmlFor={bitId}>Bitiş</label>
            <TarihAlani id={bitId} ad="Bitiş" deger={taslak.bit} degistir={(v) => setTaslak({ ...taslak, bit: v })} /></div>
        </div>
        {ters && <p className={stil.tarihHata} role="alert">Bitiş başlangıçtan önce olamaz.</p>}
      </Pencere>
    </div>
  );
}

/* telefon levhası: kısa seçenekler çip, uzunlar aranır kayan dikey liste (seçili en üstte) */
function LevhaGrubu<K>({ secici, deger, degistir }: { secici: Secici<K>; deger: string; degistir: (v: string) => void }) {
  const [ara, setAra] = useState("");
  const secenekler = secici.secenek();
  if (secenekler.length <= UZUN_LISTE) {
    return (
      <div className={stil.levhaGrup}>
        <p className={stil.levhaAd}>{secici.ad}</p>
        <div className={stil.levhaSecenekler}>
          {secenekler.map((o) => (
            <button key={o[0]} className={stil.cip} type="button" aria-pressed={o[0] === deger} onClick={() => degistir(o[0])}>{o[1]}</button>
          ))}
        </div>
      </div>
    );
  }
  const { liste: sirali, kalan, hic } = gorunenSecenekler(secenekler, deger, ara, true);
  return (
    <div className={stil.levhaGrup}>
      <p className={stil.levhaAd}>{secici.ad}</p>
      <div className={stil.levhaListe} role="listbox" aria-label={secici.ad}>
        <SecenekArama ad={secici.ad} deger={ara} degistir={setAra} bos={hic} />
        <div className={stil.levhaKayan}>
          {sirali.map((o) => <SecenekTusu key={o[0]} o={o} secili={o[0] === deger} sec={() => degistir(o[0])} />)}
          <KalanNotu kalan={kalan} />
        </div>
      </div>
    </div>
  );
}
