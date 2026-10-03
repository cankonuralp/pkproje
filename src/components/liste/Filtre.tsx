"use client";
/* FİLTRE SATIRI — tek üretici (kalıp 15; maketteki MK.suzgecHtml + olay işleyicileri). Tek akış, kuralın sırasıyla:
   arama (ya da alan alan arama kutuları) → durum çipleri + ve/veya → seçiciler + Temizle SAĞDA. Hepsi sığmazsa seçiciler + Temizle
   birlikte alt satırın sağına kayar (Temizle yalnız kalmaz). Telefonda (< 768) seçiciler "Filtre" tuşunun açtığı levhada; çip şeridi
   yana kayar. Kutu açılır kapanır (reisim 2026-09-27); başlıkta uygulanan filtre sayısı; tercih bu tarayıcıda sayfa başına hatırlanır.
   Durum dışarıda (useSuzgec): bileşen yalnız çizer ve değişikliği bildirir. */
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Ikon } from "../ikon/Ikon";
import { Pencere } from "../pencere/Pencere";
import { SecenekArama, SecenekListesi, SecenekTusu, UZUN_LISTE, useDisariTiklama, ustteMi } from "../secim/SecenekListesi";
import { Tus } from "../tus/Tus";
import type { ListeKipi } from "./Liste";
import { aktifSecici, suzgecVar, temizle, tr, uygulanan, type Secici, type SuzgecDurumu, type SuzgecTanimi } from "./suzgec";
import stil from "./Filtre.module.css";


export function FiltreSatiri<K>({ on, tanim, durum, degistir, tb, kip = "tablo" }: {
  /** sayfadaki süzgecin kısa adı (açık / kapalı tercihi bununla hatırlanır) */
  on: string;
  tanim: SuzgecTanimi<K>;
  durum: SuzgecDurumu;
  degistir: (d: SuzgecDurumu) => void;
  /** çipler hariç süzgeçten geçen kayıtlar (çip sayıları) */
  tb: readonly K[];
  kip?: ListeKipi;
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
  const secicili = tanim.seciciler.length > 0;
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
        {tanim.alanlar ? (
          <div className={stil.alanlar}>
            {tanim.alanlar.map((x) => (
              <label key={x.k} className={stil.alanAra}>
                <span className={stil.alanAd}>{x.ad}</span>
                <input className={stil.girdi} type="search" placeholder={x.ipucu ?? ""} autoComplete="off" value={durum.alan[x.k] ?? ""}
                  onChange={(e) => yeni({ alan: { ...durum.alan, [x.k]: e.target.value } })} />
              </label>
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
                  {c.ad} <span className={stil.cipSayi}>{tb.filter(c.test).length}</span>
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
            {tanim.seciciler.map((x) => (
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
  const [ust, setUst] = useState(false);
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
        onClick={() => { if (!acik) setUst(ustteMi(tus.current)); setAcik(!acik); }}>
        <span className={stil.seciciEtiket}>{secici.ad}</span>
        <span className={stil.seciciDeger}>{gor?.[1]}</span>
        <Ikon ad="chevron-down" kucuk />
      </button>
      {acik && (
        <SecenekListesi id={listeId} ad={secici.ad} secenekler={secenekler} deger={deger} ust={ust} sinif={stil.seciciListe}
          sec={(v) => { degistir(v); setAcik(false); tus.current?.focus(); }}
          kapat={(geri) => { setAcik(false); if (geri) tus.current?.focus(); }} />
      )}
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
  const q = tr(ara.trim());
  const sirali = [...secenekler.filter((o) => o[0] === deger), ...secenekler.filter((o) => o[0] !== deger)].filter((o) => !q || tr(o[1]).includes(q));
  return (
    <div className={stil.levhaGrup}>
      <p className={stil.levhaAd}>{secici.ad}</p>
      <div className={stil.levhaListe} role="listbox" aria-label={secici.ad}>
        <SecenekArama ad={secici.ad} deger={ara} degistir={setAra} bos={!sirali.length} />
        <div className={stil.levhaKayan}>
          {sirali.map((o) => <SecenekTusu key={o[0]} o={o} secili={o[0] === deger} sec={() => degistir(o[0])} />)}
        </div>
      </div>
    </div>
  );
}
