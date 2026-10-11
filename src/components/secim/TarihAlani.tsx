"use client";
/* TARİH / SAAT ALANI — tek üretici (maketteki MK.zaman; yerli tarih girdisi YOK, kalıp 19). Reisim 2026-09-27: "tıklayınca tarih seçtiren bi
   takvim açılsın ve saat dakika seçebileceğim bir kısım olsun … tarih ve saat ayrı el ile de girilebiliyor … el ile yazınca saat için aşağıda
   ilgili saatler çıkıyor"; "takvimin altında bu gün tuşu olsun"; 2026-10-03: "tıklayınca takvim veya saat açılsın, silip yaza da bileyim".
   · tarih GG.AA.YYYY yazılır ya da takvimden (kutuya ya da simgeye tıklayınca açılır; ay geçişi; Bugün);
   · saatliyse saat ve dakika ayrı kutu: yazarken uyan değerler altta listelenir, liste açık kalır; simge tam listeyi açar;
   · geçerli her değişiklikte degistir(ISO); geçersiz tarih (31.02) kutuda kalır, alan geçersiz işaretlenir. */
import { useCallback, useId, useRef, useState } from "react";
import { Ikon } from "../ikon/Ikon";
import { useDisariTiklama } from "./SecenekListesi";
import { odakla, useYuzen, type YuzenAyar } from "./yuzen";
import { ayBasligi, ayGunleri, ayKaydir, bugunIso, GUN_KISA, iki, parcaGecerli, saatliKur, simdiIso, tarihNo, tarihOku } from "./tarih";
import stil from "./Secim.module.css";

export function TarihAlani({ id, ad, deger, degistir, saat = false, tanim }: {
  /** tarih kutusunun id'si (etiket for= ile bağlanır) */
  id: string;
  ad: string;
  /** "YYYY-MM-DD" ya da saatliyse "YYYY-MM-DDTHH:MM"; boş = değer yok */
  deger: string;
  degistir: (v: string) => void;
  saat?: boolean;
  tanim?: string;
}) {
  const [taslak, setTaslak] = useState<string | null>(null);
  const [acik, setAcik] = useState(false);
  const [ay, setAy] = useState("");
  const kap = useRef<HTMLDivElement>(null);
  const simge = useRef<HTMLButtonElement>(null);
  const takvimId = useId();
  const kapat = useCallback(() => setAcik(false), []);
  useDisariTiklama(acik, kap, kapat);

  const metin = taslak ?? (deger ? tarihNo(deger) : "");
  const gecersiz = taslak !== null && taslak.length >= 10 && !tarihOku(taslak);
  const yay = (gun: string) => degistir(saat ? saatliKur(deger, simdiIso(), { gun }) : gun);
  const takvimAc = (odakVer: boolean) => {
    setAy((tarihOku(metin) ?? deger ?? "").slice(0, 7) || bugunIso().slice(0, 7));
    setAcik(true);
    if (odakVer) requestAnimationFrame(() => {
      const k = kap.current?.querySelector<HTMLElement>(`#${CSS.escape(takvimId)}`);
      odakla(k?.querySelector<HTMLElement>('[aria-pressed="true"]') ?? k?.querySelector<HTMLElement>("[data-bugun]") ?? k?.querySelector<HTMLElement>("[data-gun]"));
    });
  };
  const gunSec = (gun: string) => { setTaslak(null); yay(gun); setAcik(false); simge.current?.focus(); };

  return (
    <div className={saat ? `${stil.zaman} ${stil.saatli}` : stil.zaman} data-zaman={id}>
      <div className={stil.zamanTarih} ref={kap} onKeyDown={(e) => { if (e.key === "Escape" && acik) { e.stopPropagation(); e.preventDefault(); setAcik(false); simge.current?.focus(); } }}>
        <input className={stil.zamanGirdi} id={id} value={metin} inputMode="numeric" maxLength={10} placeholder="GG.AA.YYYY" autoComplete="off"
          aria-invalid={gecersiz || undefined} aria-describedby={tanim}
          onClick={() => { if (!acik) takvimAc(false); }}
          onChange={(e) => {
            const v = e.target.value; setTaslak(v);
            const g = tarihOku(v);
            if (g) { yay(g); setAy(g.slice(0, 7)); }
          }}
          onBlur={() => { if (taslak !== null && tarihOku(taslak)) setTaslak(null); }} />
        <button ref={simge} className={stil.zamanSimge} type="button" aria-haspopup="dialog" aria-expanded={acik} aria-label="Takvimden seç"
          onClick={() => (acik ? setAcik(false) : takvimAc(true))}>
          <Ikon ad="calendar" kucuk />
        </button>
        {acik && (
          <Yuzen className={stil.takvim} id={takvimId} role="dialog" aria-label={ad} ayar={TAKVIM}>
            <div className={stil.takvimBas}>
              <button className={stil.ayTus} type="button" aria-label="Önceki ay" onClick={() => setAy(ayKaydir(ay, -1))}><Ikon ad="chevron-left" /></button>
              <span className={stil.ayAd} aria-live="polite">{ayBasligi(ay)}</span>
              <button className={stil.ayTus} type="button" aria-label="Sonraki ay" onClick={() => setAy(ayKaydir(ay, 1))}><Ikon ad="chevron-right" /></button>
            </div>
            <Gunler ay={ay} secili={(tarihOku(metin) ?? "").slice(0, 10)} sec={gunSec} />
            <div className={stil.takvimAlt}>
              <button className={stil.bugunTus} type="button" onClick={() => gunSec(bugunIso())}>Bugün</button>
            </div>
          </Yuzen>
        )}
      </div>
      {/* saat : dakika tek grup — ayrı satıra düşmez; saatin önerileri dakikanın üstüne binmez (2026-10-03, e2e yakaladı) */}
      {saat && (
        <div className={stil.saatGrup}>
          <Parca tur="saat" ad={ad} deger={deger ? deger.slice(11, 13) : ""} sec={(v) => degistir(saatliKur(deger, simdiIso(), { saat: v }))} />
          <span className={stil.ikiNokta} aria-hidden="true">:</span>
          <Parca tur="dakika" ad={ad} deger={deger ? deger.slice(14, 16) : ""} sec={(v) => degistir(saatliKur(deger, simdiIso(), { dakika: v }))} />
        </div>
      )}
    </div>
  );
}

function Gunler({ ay, secili, sec }: { ay: string; secili: string; sec: (g: string) => void }) {
  const { bosluk, gunler } = ayGunleri(ay);
  const bugun = bugunIso();
  return (
    <div className={stil.gunler}>
      {GUN_KISA.map((g) => <span key={g} className={stil.gunAd} aria-hidden="true">{g}</span>)}
      {Array.from({ length: bosluk }, (_, i) => <span key={`b${i}`} />)}
      {gunler.map((g) => (
        <button key={g} className={g === bugun ? `${stil.gun} ${stil.bugun}` : stil.gun} type="button" data-gun={g} data-bugun={g === bugun ? "" : undefined}
          aria-pressed={g === secili} aria-label={tarihNo(g)} onClick={() => sec(g)}>{Number(g.slice(8, 10))}</button>
      ))}
    </div>
  );
}

/* saat (00–23) ya da dakika (00–59): yazılır, yazılana uyanlar listelenir (09 yazınca da 09 önerilir — reisim 2026-09-27); simge tam liste */
function Parca({ tur, ad, deger, sec }: { tur: "saat" | "dakika"; ad: string; deger: string; sec: (v: string) => void }) {
  const [taslak, setTaslak] = useState<string | null>(null);
  const [acik, setAcik] = useState(false);
  const kap = useRef<HTMLDivElement>(null);
  const girdi = useRef<HTMLInputElement>(null);
  const listeId = useId();
  const kapat = useCallback(() => setAcik(false), []);
  useDisariTiklama(acik, kap, kapat);
  const n = tur === "saat" ? 24 : 60;
  const metin = taslak ?? deger;
  const suz = taslak ?? "";
  const hepsi = Array.from({ length: n }, (_, i) => iki(i));
  const gorunen = hepsi.filter((v) => v.startsWith(suz.replace(/\D/g, "")));
  const ad2 = tur === "saat" ? "Saat" : "Dakika";
  const bitir = (v: string) => { setTaslak(null); sec(v); setAcik(false); girdi.current?.focus(); };
  return (
    <div className={stil.zamanParca} ref={kap}
      onBlur={(e) => { if (e.relatedTarget && !kap.current?.contains(e.relatedTarget as Node)) { setAcik(false); if (taslak !== null && parcaGecerli(taslak, tur)) setTaslak(null); } }}
      onKeyDown={(e) => { if (e.key === "Escape" && acik) { e.stopPropagation(); e.preventDefault(); setAcik(false); girdi.current?.focus(); } }}>
      <input ref={girdi} className={stil.zamanGirdi} value={metin} inputMode="numeric" maxLength={2} autoComplete="off" data-parca={tur}
        aria-label={`${ad} ${tur === "saat" ? "saati" : "dakikası"}`}
        onClick={() => { setTaslak(null); setAcik(true); }}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, ""); setTaslak(v); setAcik(v.length > 0);
          if (parcaGecerli(v, tur)) sec(v);
        }} />
      <button className={stil.zamanSimge} type="button" aria-haspopup="listbox" aria-expanded={acik} aria-controls={acik ? listeId : undefined} aria-label={`${ad2} seç`}
        onClick={() => { setTaslak(null); setAcik(!acik); if (!acik) requestAnimationFrame(() => {
          const l = kap.current?.querySelector<HTMLElement>('[role="listbox"]');
          odakla(l?.querySelector<HTMLElement>('[aria-selected="true"]') ?? l?.querySelector<HTMLElement>('[role="option"]'));
        }); }}>
        <Ikon ad="clock" kucuk />
      </button>
      {acik && gorunen.length > 0 && (
        <Yuzen className={`${stil.liste} ${stil.parcaListe}`} id={listeId} role="listbox" aria-label={ad2} ayar={PARCA}>
          {gorunen.map((v) => (
            <button key={v} className={stil.secenek} type="button" role="option" aria-selected={v === deger} onClick={() => bitir(v)}>{v}</button>
          ))}
        </Yuzen>
      )}
    </div>
  );
}

/* 452: takvim alanın altında yüzer — alan kadar, en az 340 px (telefonda alanın genişliği; ekrandan taşmaz); saat / dakika önerileri alan
   kadar (en az 96 px) */
const TAKVIM: YuzenAyar = { enAzGenislik: 340, enCokYukseklik: 440 };
const PARCA: YuzenAyar = { enAzGenislik: 96, enCokYukseklik: 240 };

/** yüzen katman kabı (koşullu çizilen katmanlar için: kanca bileşenin içinde) */
function Yuzen({ ayar, ...p }: React.HTMLAttributes<HTMLDivElement> & { ayar: YuzenAyar }) {
  const ref = useRef<HTMLDivElement>(null);
  useYuzen(ref, ayar);
  return <div ref={ref} popover="manual" {...p} />;
}
