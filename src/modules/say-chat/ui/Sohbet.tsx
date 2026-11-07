"use client";
/* S.A.Y CHAT — SOHBET (2026-11-07 yeniden; sunum claude.ai 2PiEskE9jDqF5kSefutRBC — reisim: "Evet, önerilerle"). Uzman sahada WhatsApp'a yazar gibi
   KENDİNE yazar; S.A.Y "chatten oku" ile okur. Panelde (SayChat.tsx — her sayfada) ve tam sayfada (/planlar/sohbet) aynı bileşen.
   · Gün ayraçları; her mesajda saat ve durum: Cihazda (kuyrukta) · Gönderildi. Yazı · fotoğraf (birden çok, her birine isteğe bağlı altyazı) · belge
     (PDF, Word, Excel). Mesaj saati CİHAZIN saati (yazıldığı an); fotoğrafın çekim saati EXIF'ten, fotoğraf küçültülmeden (EXIF silinmeden) önce.
   · Fotoğraf uzun kenar 2400 px, JPEG %85 (karar 3); kuyruğun sınırını aşarsa bir kademe küçülür.
   · Her mesaj ÇEVRİMDIŞI KUYRUĞA yazılır (bağlantı varsa hemen gider) ve GİRDİĞİ SIRAYLA gider; bekleyen mesaj cihazdaki içeriğiyle görünür.
   · Kişi kendi işlenmemiş mesajını siler; işlenmiş mesajda "→ <plan no> · n rapor" etiketi, dokununca işaret geri alınır.
   · Büyük görüntü: fotoğrafa dokununca. */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useUyar } from "../../../components/bildirim/Bildirim";
import { bekleyenIsler, kuyrugaEkle, kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik, kuyruktanCikar, yenidenDene, type KuyrukSonucOlayi, type KuyrukTuru }
  from "../../../components/cevrimdisi/kuyruk";
import { FotoTusu } from "../../../components/foto/FotoTusu";
import { fotografiKucult } from "../../../components/foto/kucult";
import { DosyaAcTusu, GizliResim } from "../../../components/gizli-resim/GizliResim";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere } from "../../../components/pencere/Pencere";
import { Tus } from "../../../components/tus/Tus";
import { exifCekimZamani } from "../../../server/dosya/exif";
import { CHAT_BELGE_BAYT, CHAT_FOTO_BAYT, CHAT_METIN_EN_COK, FOTO_EN_UZUN, FOTO_KALITE, SECIM_EN_COK, istanbulGunu, type ChatMesaji, type MesajGirdisi } from "../sema";
import { isaretGeriAlEylemi, sohbetEylemi } from "./eylemler";
import stil from "./SayChat.module.css";

const CHAT_ISLERI: readonly KuyrukTuru[] = ["chat.mesaj", "chat.sil"];
const SAYFA = 20;
const SAAT = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });
const GUN = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", year: "numeric", weekday: "long" });
const BELGE_KABUL = ".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const BELGE_ADI = /\.(pdf|docx|xlsx)$/i;
/** fotoğraf küçültme kademeleri (karar 3: ilk kademe; kuyruğun sınırını aşarsa sonraki) */
const KADEMELER: readonly [number, number][] = [[FOTO_EN_UZUN, FOTO_KALITE], [2000, 0.8], [1600, 0.75], [1200, 0.7]];

const base64 = (d: Blob) => new Promise<string>((coz, red) => {
  const r = new FileReader();
  r.onload = () => { const s = String(r.result); coz(s.slice(s.indexOf(",") + 1)); };
  r.onerror = () => red(r.error ?? new Error("Dosya okunamadı."));
  r.readAsDataURL(d);
});
const blobUrl = (veri: string, tur: string) => URL.createObjectURL(new Blob([Uint8Array.from(atob(veri), (c) => c.charCodeAt(0))], { type: tur }));
function gunAdi(gun: string, bugun: string): string {
  if (gun === bugun) return "Bugün";
  const d = new Date(`${bugun}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - 1);
  if (gun === d.toISOString().slice(0, 10)) return "Dün";
  return GUN.format(new Date(`${gun}T12:00:00Z`));
}

/** ekranda görünen mesaj: sunucudaki ya da cihazda bekleyen */
interface Gorunen extends ChatMesaji {
  /** cihazda bekleyen işin kimliği (sunucudakinde null) */
  is: string | null;
  durum: "gonderildi" | "cihazda" | "hata";
  ileti: string | null;
  /** bekleyen fotoğrafın görüntüsü (cihazdaki içerikten) */
  yerel: string | null;
}
interface Secilen { anahtar: number; dosya: File; url: string; cekim: string | null; altyazi: string }
let secimSira = 0;

export function Sohbet({ ilk, panelde = false }: { ilk: ChatMesaji[] | null; panelde?: boolean }) {
  const uyar = useUyar(), onayla = useOnayla();
  const kuyruk = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const [mesajlar, setMesajlar] = useState<ChatMesaji[] | null>(ilk);
  const [bekleyen, setBekleyen] = useState<Awaited<ReturnType<typeof bekleyenIsler>>>([]);
  const [yazi, setYazi] = useState("");
  const [secilen, setSecilen] = useState<Secilen[]>([]);
  const [hazirlaniyor, setHazirlaniyor] = useState(false);
  const [secili, setSecili] = useState<string | null>(null);
  /** reisim 2026-10-16 ("20 den fazlası sayfalı olsun"): sohbetin sonundan SAYFA kadar mesaj; üstte "Önceki mesajlar" bir sayfa daha açar */
  const [kac, setKac] = useState(SAYFA);
  const [goster, setGoster] = useState<{ url?: string; dosya?: string; ad: string } | null>(null);
  const govde = useRef<HTMLDivElement>(null), belgeGirdi = useRef<HTMLInputElement>(null);
  /** cihazdaki fotoğrafların görüntüsü (kayıt → blob: adresi) — bu ekranda seçilen ya da kuyruktaki içerikten */
  const [yereller, setYereller] = useState<Readonly<Record<string, string>>>({});
  const yerelUrl = useRef(new Map<string, string>());

  const yukle = useCallback(async () => {
    try {
      const r = await sohbetEylemi();
      setMesajlar((x) => (r.durum === "tamam" ? r.mesajlar : x ?? []));
    } catch { setMesajlar((x) => x ?? []); /* bağlantı yok: cihazdakiler görünür */ }
  }, []);
  useEffect(() => {
    if (ilk !== null) return;
    let canli = true;
    sohbetEylemi().then((r) => { if (canli) setMesajlar((x) => (r.durum === "tamam" ? r.mesajlar : x ?? [])); },
      () => { if (canli) setMesajlar((x) => x ?? []); });
    return () => { canli = false; };
  }, [ilk]);
  /* gönderilen mesaj: sunucudaki hâl yenilenir */
  useEffect(() => {
    let zaman: number | undefined;
    const f = (e: Event) => {
      const d = (e as CustomEvent<KuyrukSonucOlayi>).detail;
      if (!d?.tur.startsWith("chat.") || d.durum !== "tamam") return;
      window.clearTimeout(zaman);
      zaman = window.setTimeout(() => void yukle(), 400);
    };
    window.addEventListener("probata-islem", f);
    return () => { window.removeEventListener("probata-islem", f); window.clearTimeout(zaman); };
  }, [yukle]);
  /* cihazda bekleyen mesajlar içerikleriyle */
  const chatIsleri = useMemo(() => kuyruk.isler.filter((x) => (CHAT_ISLERI as readonly string[]).includes(x.tur)), [kuyruk.isler]);
  useEffect(() => {
    let canli = true;
    void bekleyenIsler(CHAT_ISLERI).then((l) => {
      if (!canli) return;
      /* bekleyen fotoğrafın görüntüsü cihazdaki içerikten (bu ekranda seçilmediyse) */
      for (const b of l) {
        const g = b.girdi as MesajGirdisi | null;
        if (b.tur !== "chat.mesaj" || g?.tur !== "foto" || !g.veri || yerelUrl.current.has(b.kayit)) continue;
        try { yerelUrl.current.set(b.kayit, blobUrl(g.veri, "image/jpeg")); } catch { /* bozuk içerik: görüntüsüz */ }
      }
      setYereller(Object.fromEntries(yerelUrl.current));
      setBekleyen(l);
    });
    return () => { canli = false; };
  }, [chatIsleri]);
  useEffect(() => () => { for (const u of yerelUrl.current.values()) URL.revokeObjectURL(u); }, []);

  const gorunenler: Gorunen[] = useMemo(() => {
    const silinen = new Set(bekleyen.filter((x) => x.tur === "chat.sil").map((x) => x.kayit));
    const sunucu = new Set((mesajlar ?? []).map((m) => m.id));
    const l: Gorunen[] = (mesajlar ?? []).filter((m) => !silinen.has(m.id)).map((m) => ({ ...m, is: null, durum: "gonderildi", ileti: null, yerel: null }));
    for (const b of bekleyen) {
      if (b.tur !== "chat.mesaj" || sunucu.has(b.kayit)) continue;
      const g = b.girdi as MesajGirdisi | null;
      if (!g) continue;
      const yerel = yereller[b.kayit] ?? null;
      l.push({ id: b.kayit, zaman: g.zaman, sira: g.sira, tur: g.tur, metin: g.metin, ad: g.ad, cekim: g.cekim, dosya: null, islendi: null, is: b.id,
        durum: b.durum === "bekliyor" ? "cihazda" : "hata", ileti: b.ileti, yerel });
    }
    return l.sort((a, b) => a.zaman.localeCompare(b.zaman) || a.sira - b.sira);
  }, [mesajlar, bekleyen, yereller]);

  const gorunen = gorunenler.slice(-kac), oncesi = gorunenler.length - gorunen.length;
  /* yeni mesajda en alta */
  const son = gorunenler.at(-1)?.id;
  useEffect(() => { const g = govde.current; if (g) g.scrollTop = g.scrollHeight; }, [son]);

  /* ── gönderme ── */
  const ekle = (girdi: MesajGirdisi, ad: string) => {
    const kayit = crypto.randomUUID();
    return { kayit, is: kuyrugaEkle({ tur: "chat.mesaj", kayit, surum: 0, girdi, ad }) };
  };
  const fotoHazirla = async (f: File): Promise<Secilen | null> => {
    let cekim: string | null = null;
    try { cekim = exifCekimZamani(new Uint8Array(await f.slice(0, 256 * 1024).arrayBuffer())); } catch { cekim = null; }
    for (const [uzun, kalite] of KADEMELER) {
      const k = await fotografiKucult(f, uzun, kalite).catch(() => null);
      if (k && k.size <= CHAT_FOTO_BAYT) return { anahtar: ++secimSira, dosya: k, url: URL.createObjectURL(k), cekim, altyazi: "" };
    }
    return null;
  };
  const fotolarSecildi = async (l: File[]) => {
    const yer = SECIM_EN_COK - secilen.length;
    const alinan = l.filter((f) => !f.type || /^image\/(jpeg|png)$/.test(f.type)).slice(0, Math.max(0, yer));
    if (alinan.length < l.length) uyar(l.length > yer ? `Bir seferde en çok ${SECIM_EN_COK} fotoğraf.` : "Yalnız JPEG ya da PNG fotoğraf.");
    if (!alinan.length) return;
    setHazirlaniyor(true);
    try {
      const h: Secilen[] = [];
      for (const f of alinan) {
        const s = await fotoHazirla(f);
        if (s) h.push(s); else uyar(`${f.name}: fotoğraf okunamadı.`);
      }
      setSecilen((x) => [...x, ...h]);
    } finally { setHazirlaniyor(false); }
  };
  const secimiKaldir = (anahtar: number) => setSecilen((l) => l.filter((x) => { if (x.anahtar === anahtar) URL.revokeObjectURL(x.url); return x.anahtar !== anahtar; }));
  const gonder = async () => {
    const metin = yazi.trim();
    if ((!metin && !secilen.length) || hazirlaniyor) return;
    const zaman = new Date().toISOString();
    let sira = 0;
    const l = secilen;
    setSecilen([]); setYazi("");
    for (const s of l) {
      const veri = await base64(s.dosya);
      const { kayit } = ekle({ tur: "foto", zaman, sira: sira++, metin: s.altyazi.trim().slice(0, CHAT_METIN_EN_COK) || null, cekim: s.cekim, ad: s.dosya.name || "foto.jpg", veri },
        "S.A.Y Chat · fotoğraf");
      yerelUrl.current.set(kayit, s.url);
    }
    setYereller(Object.fromEntries(yerelUrl.current));
    if (metin) ekle({ tur: "yazi", zaman, sira: sira++, metin: metin.slice(0, CHAT_METIN_EN_COK), cekim: null, ad: null, veri: null }, "S.A.Y Chat · mesaj");
  };
  const belgeSecildi = async (f: File | undefined) => {
    if (!f) return;
    if (!BELGE_ADI.test(f.name)) { uyar("Yalnız PDF, Word (.docx) ya da Excel (.xlsx) belge."); return; }
    if (f.size > CHAT_BELGE_BAYT) { uyar(`Belge çok büyük (en çok ${Math.round(CHAT_BELGE_BAYT / 1024 / 1024)} MB).`); return; }
    const metin = yazi.trim();
    setYazi("");
    ekle({ tur: "belge", zaman: new Date().toISOString(), sira: 0, metin: metin.slice(0, CHAT_METIN_EN_COK) || null, cekim: null, ad: f.name.slice(0, 200), veri: await base64(f) },
      "S.A.Y Chat · belge");
  };

  /* ── silme, işaret ── */
  const sil = async (m: Gorunen) => {
    setSecili(null);
    if (!(await onayla({ baslik: "Mesaj silinsin mi?", metin: m.tur === "yazi" ? `“${(m.metin ?? "").slice(0, 80)}”` : m.ad ?? "Fotoğraf", tus: "Sil", tehlike: true }))) return;
    if (m.is) { await kuyruktanCikar(m.is); return; }
    await kuyrugaEkle({ tur: "chat.sil", kayit: m.id, surum: 0, girdi: {}, ad: "S.A.Y Chat · mesaj sil" });
  };
  const isaretGeri = async (m: Gorunen) => {
    if (!m.islendi) return;
    if (!(await onayla({ baslik: "İşlendi işareti kaldırılsın mı?", metin: `${m.islendi.no} planına işlenen mesajlar yeniden işlenmemiş sayılır.`, tus: "Kaldır" }))) return;
    const r = await isaretGeriAlEylemi(m.id).catch(() => null);
    if (!r || r.durum !== "tamam") { uyar(r?.durum === "red" ? r.neden : "Bağlantı yok; bağlanınca yeniden deneyin."); return; }
    await yukle();
  };

  const bugun = istanbulGunu(new Date().toISOString());
  const kaba = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
  return (
    <div className={panelde ? stil.sohbetPanel : stil.sohbetSayfa}>
      <div className={stil.akis} ref={govde} data-sc-govde="" role="log" aria-label="Sohbet" aria-live="polite">
        {mesajlar === null && <p className={stil.bosMetin}>Yükleniyor…</p>}
        {mesajlar !== null && !gorunenler.length && <p className={stil.bosMetin}>Henüz mesaj yok.</p>}
        {oncesi > 0 && <Tus tur="ikincil" ikon="chevron-up" onClick={() => setKac((x) => x + SAYFA)}>Önceki mesajlar ({oncesi})</Tus>}
        {gorunen.map((m, i) => {
          const gun = istanbulGunu(m.zaman), ayrac = i === 0 || istanbulGunu(gorunen[i - 1]!.zaman) !== gun;
          const resim = m.yerel ?? null;
          return (
            <div key={m.id} className={stil.satir}>
              {ayrac && <p className={stil.gun}><span>{gunAdi(gun, bugun)}</span></p>}
              <div className={m.durum === "cihazda" ? `${stil.balon} ${stil.cihazdaBalon}` : m.durum === "hata" ? `${stil.balon} ${stil.hataBalon}` : stil.balon} data-durum={m.durum} data-islendi={m.islendi ? "" : undefined} data-secili={secili === m.id ? "" : undefined}>
                {m.tur === "foto" && (
                  <button type="button" className={stil.balonFoto} onClick={() => setGoster(resim ? { url: resim, ad: m.ad ?? "Fotoğraf" } : m.dosya ? { dosya: m.dosya, ad: m.ad ?? "Fotoğraf" } : null)}
                    aria-label={`${m.ad ?? "Fotoğraf"} — büyük görüntü`} disabled={!resim && !m.dosya}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {resim ? <img src={resim} alt={m.ad ?? "Fotoğraf"} /> : m.dosya ? <GizliResim dosyaId={m.dosya} alt={m.ad ?? "Fotoğraf"} className={stil.balonResim} />
                      : <span className={stil.silindi}><Ikon ad="image" />Fotoğraf silindi</span>}
                  </button>
                )}
                {m.tur === "belge" && (
                  <div className={stil.belge}>
                    <Ikon ad={/\.xlsx$/i.test(m.ad ?? "") ? "file-spreadsheet" : "file-text"} />
                    <span className={stil.belgeAd}>{m.ad ?? "Belge"}</span>
                    {m.dosya && <DosyaAcTusu dosyaId={m.dosya} indir={!/\.pdf$/i.test(m.ad ?? "")} ikon={/\.pdf$/i.test(m.ad ?? "") ? "eye" : "download"}
                      etiket={`${m.ad ?? "Belge"} aç`}>{/\.pdf$/i.test(m.ad ?? "") ? "Aç" : "İndir"}</DosyaAcTusu>}
                  </div>
                )}
                {m.metin && <p className={m.tur === "yazi" ? stil.metin : stil.altyazi}>{m.metin}</p>}
                <p className={stil.meta}>
                  {m.cekim && <span title="Çekim saati">çekim {m.cekim.slice(11, 16)} · </span>}
                  <time dateTime={m.zaman}>{SAAT.format(new Date(m.zaman))}</time>
                  {m.durum === "gonderildi" ? <span className={stil.gitti} aria-label="Gönderildi" title="Gönderildi"><Ikon ad="check" kucuk /></span>
                    : m.durum === "cihazda" ? <span className={stil.cihazda} title="Cihazda — bağlantı gelince gider"><Ikon ad="clock" kucuk />Cihazda</span>
                    : <span className={stil.hata}><Ikon ad="circle-alert" kucuk />{m.ileti ?? "Gönderilemedi"}</span>}
                  <button type="button" className={stil.balonTus} onClick={() => setSecili((x) => (x === m.id ? null : m.id))} aria-expanded={secili === m.id}
                    aria-label="Mesajın işlemleri"><Ikon ad="ellipsis-vertical" kucuk /></button>
                </p>
                {m.islendi && (
                  <button type="button" className={stil.islendi} onClick={() => void isaretGeri(m)} title="İşareti geri al">
                    <Ikon ad="arrow-right" kucuk />{m.islendi.no} · {m.islendi.rapor} rapor</button>
                )}
                {secili === m.id && (
                  <div className={stil.balonIslem}>
                    {m.durum === "hata" && m.is && <Tus tur="ikincil" ikon="rotate-ccw" onClick={() => { setSecili(null); void yenidenDene(m.is!); }}>Yeniden dene</Tus>}
                    {!m.islendi && <Tus tur="tehlike" ikon="trash-2" onClick={() => void sil(m)}>Sil</Tus>}
                    {m.islendi && <Tus tur="ikincil" ikon="undo-2" onClick={() => { setSecili(null); void isaretGeri(m); }}>İşareti geri al</Tus>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className={stil.yazAlani} data-panel-alt="">
        {secilen.length > 0 && (
          <ul className={stil.secilenler} aria-label="Gönderilecek fotoğraflar">
            {secilen.map((s, i) => (
              <li key={s.anahtar} className={stil.secilen}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt={`Fotoğraf ${i + 1}`} />
                <button type="button" className={stil.secilenSil} onClick={() => secimiKaldir(s.anahtar)} aria-label={`Fotoğraf ${i + 1} kaldır`}><Ikon ad="x" kucuk /></button>
                <label className={stil.gizli} htmlFor={`sc-alt-${s.anahtar}`}>Fotoğraf {i + 1} altyazısı</label>
                <input id={`sc-alt-${s.anahtar}`} className={stil.altyaziGirdi} placeholder="Altyazı" maxLength={CHAT_METIN_EN_COK} value={s.altyazi}
                  onChange={(e) => setSecilen((l) => l.map((x) => (x.anahtar === s.anahtar ? { ...x, altyazi: e.target.value } : x)))} />
              </li>
            ))}
          </ul>
        )}
        <div className={stil.yazSatiri}>
          <FotoTusu ad="" etiket="Fotoğraf ekle" ikon="camera" sinif={stil.ekTus} coklu sec={(l) => void fotolarSecildi(l)} />
          <button type="button" className={stil.ekTus} onClick={() => belgeGirdi.current?.click()} aria-label="Belge ekle (PDF, Word, Excel)" title="Belge ekle">
            <Ikon ad="paperclip" /></button>
          <input ref={belgeGirdi} className={stil.gizli} type="file" accept={BELGE_KABUL} tabIndex={-1} aria-hidden="true"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void belgeSecildi(f); }} />
          <label className={stil.gizli} htmlFor={panelde ? "sc-yazi" : "sc-yazi-sayfa"}>Mesaj</label>
          <textarea id={panelde ? "sc-yazi" : "sc-yazi-sayfa"} className={stil.yazi} rows={1} value={yazi} maxLength={CHAT_METIN_EN_COK} placeholder="Mesaj"
            autoCapitalize="sentences" onChange={(e) => setYazi(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !kaba && !e.nativeEvent.isComposing) { e.preventDefault(); void gonder(); } }} />
          <button type="button" className={stil.gonder} onClick={() => void gonder()} disabled={hazirlaniyor || (!yazi.trim() && !secilen.length)}
            aria-label="Gönder" aria-busy={hazirlaniyor || undefined}><Ikon ad="send" /></button>
        </div>
      </div>
      <Pencere acik={!!goster} baslik={goster?.ad ?? "Fotoğraf"} onKapat={() => setGoster(null)} genis>
        <div className={stil.buyuk}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {goster?.url ? <img src={goster.url} alt={goster.ad} /> : goster?.dosya ? <GizliResim dosyaId={goster.dosya} alt={goster.ad} className={stil.buyukResim} /> : null}
        </div>
      </Pencere>
    </div>
  );
}
