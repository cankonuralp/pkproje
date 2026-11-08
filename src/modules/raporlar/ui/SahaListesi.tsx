"use client";
/* SAHA LİSTESİ (2026-11-08; sunum claude.ai 4ApGDVAfUgvm8C5nTSRVbh sürüm 2 — reisim: "rapor açıp tek tek ekipman için kontrol etmekten çok farksız değil daha hızlı olabilir", "yap") —
   /raporlar/saha/<plan>. Planın raporu olmayan ekipmanları tek ekranda (bilgileri tesis kaydından ve önceki rapordan; paket /raporlar/yeni ile aynı: yeniRaporPaketi, sayfa önceden iner, bağlantısız
   açılır). Satır başına Uygun / Değil + fotoğraf; "Kalanları uygun işaretle"; "n rapor oluştur" işleri kuyruğa yazar (rapor.saha, rapor.foto) — bağlantı varsa hemen, yoksa bağlantı gelince
   gider. YAPAY ZEKÂ YOK, ücret yok; tek işaretli tuş "S.A.Y okusun". İşaretler cihazda kalır (sayfadan çıkılınca kaybolmaz); fotoğraflar bu sayfada (çıkarken tarayıcı uyarır).
   Kurallar saf: ../saha-listesi.ts. */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useBildir, useUyar } from "../../../components/bildirim/Bildirim";
import { BosDurum } from "../../../components/bos/BosDurum";
import { kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik, kuyrugaTopluEkle, type KuyrukGirdisi } from "../../../components/cevrimdisi/kuyruk";
import { fotografiKucult } from "../../../components/foto/kucult";
import { FotoTusu } from "../../../components/foto/FotoTusu";
import { GizliResim } from "../../../components/gizli-resim/GizliResim";
import { Ikon } from "../../../components/ikon/Ikon";
import { SayfaliListe, TabloSayfalari, useSayfa } from "../../../components/liste/Sayfalayici";
import { Pencere } from "../../../components/pencere/Pencere";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { cihazBugunu, raporKapisi } from "../../planlar/sema";
import type { ChatMesaji } from "../../say-chat/sema";
import { sahaSonucYaz, SahaSonucu, useSahaSonuc } from "../../say-chat/ui/SahaBandi";
import { SayOkusun } from "../../say-chat/ui/SayOkusun";
import { sohbetEylemi } from "../../say-chat/ui/eylemler";
import { girilecekler, kalanlariUygun, maddeAra, SAHA_MADDE_EN_COK, SAHA_NOT_EN_COK, SAHA_SERI_EN_COK, SAHA_SOHBET_EN_COK, sahaMaddeleri, type SahaIsareti } from "../saha-listesi";
import { FOTO_KUYRUK_EN_BUYUK } from "../sema";
import type { YeniRaporPaketi } from "../server/raporlar";
import { sahaEkipmanEylemi } from "./saha-eylemler";
import stil from "./SahaListesi.module.css";

const anahtar = (plan: string) => `probata-saha:${plan}`;
const FOTO_MADDE_EN_COK = 10;
interface Foto { anahtar: number; dosya: File; url: string; kusur: boolean }
let fotoSira = 0;
const base64 = (d: Blob) => new Promise<string>((coz, red) => {
  const r = new FileReader();
  r.onload = () => { const s = String(r.result); coz(s.slice(s.indexOf(",") + 1)); };
  r.onerror = () => red(r.error ?? new Error("Dosya okunamadı."));
  r.readAsDataURL(d);
});
type Ekipman = YeniRaporPaketi["ekipmanlar"][number];

export function SahaListesi({ p, turler }: { p: YeniRaporPaketi; turler: { id: string; ad: string }[] | null }) {
  const kuyruk = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const planId = p.plan.id;
  const [gitti, setGitti] = useState<ReadonlySet<string>>(() => new Set());
  const [isaret, setIsaret] = useState<Readonly<Record<string, SahaIsareti>>>({});
  const [fotolar, setFotolar] = useState<Readonly<Record<string, Foto[]>>>({});
  const [degil, setDegil] = useState<Ekipman | null>(null);
  const [fotoAcik, setFotoAcik] = useState<Ekipman | null>(null);
  const [yeni, setYeni] = useState(false);
  const [mesajlar, setMesajlar] = useState<ChatMesaji[]>([]);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  /* henüz işaretlenmemiş satıra sohbetten bağlanan fotoğraflar */
  const [bekleyenSohbet, setBekleyenSohbet] = useState<Readonly<Record<string, string[]>>>({});
  const uyar = useUyar();
  const sonuc = useSahaSonuc();

  /* işaretler cihazda (yalnız tarayıcıda okunur) */
  useEffect(() => {
    let s: Record<string, SahaIsareti> | null = null;
    try { s = JSON.parse(localStorage.getItem(anahtar(planId)) ?? "null") as Record<string, SahaIsareti> | null; } catch { s = null; }
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- cihazdaki işaretler yalnız tarayıcıda okunur */
    if (s) setIsaret(s);
  }, [planId]);
  const isaretYaz = useCallback((y: Readonly<Record<string, SahaIsareti>>) => {
    setIsaret(y);
    try { if (Object.keys(y).length) localStorage.setItem(anahtar(planId), JSON.stringify(y)); else localStorage.removeItem(anahtar(planId)); } catch { /* saklama yok */ }
  }, [planId]);
  /* sohbetteki işlenmemiş mesajlar (fotoğraf bağlama + S.A.Y okusun tutarı); bağlantı yoksa boş */
  useEffect(() => {
    let canli = true;
    sohbetEylemi().then((r) => { if (canli && r.durum === "tamam") setMesajlar(r.mesajlar.filter((m) => !m.islendi)); }, () => undefined);
    return () => { canli = false; };
  }, []);
  /* fotoğraflar bu sayfada: gönderilmeden çıkılırsa tarayıcı uyarır */
  const fotoVar = Object.values(fotolar).some((l) => l.length > 0);
  useEffect(() => {
    if (!fotoVar) return;
    const f = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [fotoVar]);

  const cihazda = useMemo(() => new Set(kuyruk.isler.filter((x) => (x.tur === "rapor.saha" || x.tur === "rapor.olustur") && x.yer?.startsWith(`${planId}|`)).map((x) => x.yer!.split("|")[1]!)), [kuyruk.isler, planId]);
  const satirlar = useMemo(() => p.ekipmanlar.filter((e) => p.turler[e.turId] && !gitti.has(e.id) && !cihazda.has(e.id)), [p, gitti, cihazda]);
  const s = useSayfa(satirlar.length);
  const isaretli = satirlar.filter((e) => isaret[e.id]), isaretsiz = satirlar.filter((e) => !isaret[e.id]);
  const sohbetFotolari = mesajlar.filter((m) => m.tur === "foto" && m.dosya);
  const baglanan = new Set([...Object.values(isaret).flatMap((x) => x.sohbet), ...Object.values(bekleyenSohbet).flat()]);
  const okunacakFoto = sohbetFotolari.filter((m) => !baglanan.has(m.id)).length, okunacakDiger = mesajlar.filter((m) => m.tur !== "foto").length;

  const geri = <TusBaglanti tur="ikincil" href={`/planlar/${planId}`} ikon="arrow-left">Plana dön</TusBaglanti>;
  /* karar cihazda (YeniRaporEkrani ile aynı): cihazda bekleyen kabul ve cihazın bugünü hesaba katılır; sunucu yeniden denetler */
  const kabulBekliyor = kuyruk.isler.some((x) => x.kayit === planId && x.tur === "plan.kabul");
  const bugun = cihazBugunu();
  const neden = p.planDurum && p.planBaslangic
    ? raporKapisi({ durum: p.planDurum, baslangic: p.planBaslangic }, bugun, kabulBekliyor) ?? (bugun === p.bugun ? p.mesai ?? null : null)
    : p.neden;
  if (neden) return <BosDurum ikon="calendar" baslik="Rapor açılamaz" metin={neden} eylemTus={geri} />;

  const uygun = (e: Ekipman) => {
    const y = { ...isaret };
    if (y[e.id]?.sonuc === "uygun") delete y[e.id];
    else y[e.id] = { sonuc: "uygun", maddeler: [], not: null, sohbet: y[e.id]?.sohbet ?? [] };
    isaretYaz(y);
  };
  const fotoEkle = async (e: Ekipman, l: File[], kusur: boolean) => {
    const eklenen: Foto[] = [];
    for (const f of l) {
      if (f.type && !/^image\/(jpeg|png)$/.test(f.type)) { uyar("Yalnız JPEG ya da PNG fotoğraf."); continue; }
      const k = await fotografiKucult(f).catch(() => f);
      if (k.size > FOTO_KUYRUK_EN_BUYUK) { uyar(`${f.name}: fotoğraf çok büyük (en çok 2 MB).`); continue; }
      eklenen.push({ anahtar: ++fotoSira, dosya: k, url: URL.createObjectURL(k), kusur });
    }
    if (eklenen.length) setFotolar((x) => ({ ...x, [e.id]: [...(x[e.id] ?? []), ...eklenen] }));
  };
  const fotoCikar = (e: Ekipman, f: Foto) => {
    URL.revokeObjectURL(f.url);
    setFotolar((x) => ({ ...x, [e.id]: (x[e.id] ?? []).filter((y) => y.anahtar !== f.anahtar) }));
  };
  const sohbetSec = (e: Ekipman, mesaj: string) => {
    const g: SahaIsareti | undefined = isaret[e.id];
    const once = g?.sohbet ?? [];
    if (!once.includes(mesaj) && once.length >= SAHA_SOHBET_EN_COK) { uyar(`Satıra sohbetten en çok ${SAHA_SOHBET_EN_COK} fotoğraf.`); return; }
    const sohbet = once.includes(mesaj) ? once.filter((x) => x !== mesaj) : [...once, mesaj];
    /* fotoğraf bağlanan satır henüz işaretsizse Uygun işaretlenmez — işaret kullanıcının: yalnız bağ saklanır */
    if (g) isaretYaz({ ...isaret, [e.id]: { ...g, sohbet } });
    else setBekleyenSohbet((x) => ({ ...x, [e.id]: sohbet }));
  };
  const olustur = async () => {
    if (!isaretli.length || gonderiliyor) return;
    setGonderiliyor(true);
    try {
      const isler: KuyrukGirdisi[] = [], kayitlar: string[] = [], uygunDegil: { kod: string; madde: string | null }[] = [], girilecek = new Set<string>();
      for (const e of isaretli) {
        const g = isaret[e.id]!, t = p.turler[e.turId]!.tanim, maddeler = sahaMaddeleri(t), kayit = crypto.randomUUID();
        const sohbet = [...new Set([...g.sohbet, ...(bekleyenSohbet[e.id] ?? [])])];
        kayitlar.push(kayit);
        isler.push({ tur: "rapor.saha", kayit, surum: 0, ad: `${e.kod} raporu`, yer: `${planId}|${e.id}`,
          girdi: { plan: planId, ekipman: e.id, sonuc: g.sonuc, maddeler: g.sonuc === "degil" ? g.maddeler : [], not: g.sonuc === "degil" ? g.not : null, sohbet } });
        const bolum = t.bolumler.find((b) => b.blok === "foto")?.id;
        const ilkMadde = g.sonuc === "degil" ? maddeler.find((m) => m.id === g.maddeler[0]) : undefined;
        for (const f of fotolar[e.id] ?? []) {
          const hedef = f.kusur && ilkMadde ? { bolum: ilkMadde.bolum, madde: ilkMadde.id } : bolum ? { bolum, madde: null } : null;
          if (!hedef) continue;
          isler.push({ tur: "rapor.foto", kayit, surum: 0, ad: `${e.kod} · fotoğraf`, yer: `${hedef.bolum}|${hedef.madde ?? ""}`,
            girdi: { ...hedef, ad: f.dosya.name || "foto.jpg", veri: await base64(f.dosya) } });
        }
        if (g.sonuc === "degil") uygunDegil.push({ kod: e.kod, madde: ilkMadde ? ilkMadde.metin.slice(0, 80) + (g.maddeler.length > 1 ? ` +${g.maddeler.length - 1}` : "") : null });
        for (const x of girilecekler(t)) girilecek.add(x);
      }
      await kuyrugaTopluEkle(isler);
      sahaSonucYaz({ plan: { id: planId, no: p.plan.no }, kayitlar, adet: kayitlar.length, zaman: new Date().toISOString(), uygunDegil, girilecek: [...girilecek], isaretsiz: isaretsiz.map((e) => e.kod) });
      setGitti((x) => new Set([...x, ...isaretli.map((e) => e.id)]));
      for (const l of Object.values(fotolar)) for (const f of l) URL.revokeObjectURL(f.url);
      setFotolar({});
      const kalan = { ...isaret };
      for (const e of isaretli) delete kalan[e.id];
      isaretYaz(kalan);
    } finally { setGonderiliyor(false); }
  };
  const fotoBolumu = (e: Ekipman) => p.turler[e.turId]?.tanim.bolumler.some((b) => b.blok === "foto") ?? false;

  return (
    <div className={stil.sayfa}>
      {sonuc && sonuc.plan.id === planId && <SahaSonucu k={sonuc} />}
      {satirlar.length === 0
        ? <BosDurum ikon="circle-check" baslik="Bütün ekipmanların raporu açık" eylemTus={geri} />
        : (
          <>
            <div className={stil.ust}>
              <span className={stil.sayi} aria-live="polite">{isaretli.length} / {satirlar.length} işaretli</span>
              {isaretsiz.length > 0 && <Tus tur="ikincil" ikon="check" onClick={() => isaretYaz(kalanlariUygun(isaret, isaretsiz.map((e) => e.id)))}>Kalanları uygun işaretle ({isaretsiz.length})</Tus>}
              {turler && <Tus tur="ikincil" ikon="plus" onClick={() => setYeni(true)}>Yeni ekipman</Tus>}
            </div>
            <div className={stil.tabloKap}>
              <table className={stil.tablo}>
                <thead><tr><th scope="col">Ekipman</th><th scope="col">Sonuç</th><th scope="col">Fotoğraf</th></tr></thead>
                <tbody>
                  {s.dilim(satirlar).map((e) => {
                    const g = isaret[e.id], f = fotolar[e.id] ?? [], sayi = f.length + (g?.sohbet.length ?? bekleyenSohbet[e.id]?.length ?? 0);
                    return (
                      <tr key={e.id} data-ekipman={e.kod}>
                        <td className={stil.ekipman}>
                          <b>{e.kod}</b>
                          <span>{p.turler[e.turId]!.tur.ad}{e.ekipmanBilgi.konum ? ` · ${e.ekipmanBilgi.konum}` : ""}</span>
                          {g?.sonuc === "degil" && <span className={stil.kusur}>{g.not ?? sahaMaddeleri(p.turler[e.turId]!.tanim).find((m) => m.id === g.maddeler[0])?.metin}</span>}
                        </td>
                        <td>
                          <div className={stil.sonucTuslar}>
                            <button type="button" className={stil.tusUygun} aria-pressed={g?.sonuc === "uygun"} aria-label={`${e.kod} uygun`} onClick={() => uygun(e)}>Uygun</button>
                            <button type="button" className={stil.tusDegil} aria-pressed={g?.sonuc === "degil"} aria-label={`${e.kod} uygun değil`} onClick={() => setDegil(e)}>Değil</button>
                          </div>
                        </td>
                        <td>
                          {fotoBolumu(e) && (
                            <div className={stil.fotoTuslar}>
                              <FotoTusu ad="" etiket={`${e.kod} fotoğraf ekle`} ikon="camera" sinif={stil.fotoTus} coklu sec={(l) => void fotoEkle(e, l, false)} />
                              {(sayi > 0 || sohbetFotolari.length > 0) && (
                                <button type="button" className={stil.fotoTus} onClick={() => setFotoAcik(e)} aria-label={`${e.kod} fotoğrafları (${sayi})`} title="Fotoğraflar">
                                  <Ikon ad="image" kucuk />{sayi > 0 && <span>{sayi}</span>}</button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TabloSayfalari s={s} ad="Ekipman" />
            <div className={stil.alt}>
              <SayOkusun plan={p.plan.no} foto={okunacakFoto} diger={okunacakDiger} />
              <Tus ikon="file-plus" onClick={() => void olustur()} disabled={!isaretli.length || gonderiliyor} aria-busy={gonderiliyor || undefined}>{isaretli.length} rapor oluştur</Tus>
            </div>
          </>
        )}
      {satirlar.length === 0 && turler && <div className={stil.ust}><Tus tur="ikincil" ikon="plus" onClick={() => setYeni(true)}>Yeni ekipman</Tus></div>}
      {degil && (
        <DegilPenceresi e={degil} p={p} g={isaret[degil.id]} fotolar={(fotolar[degil.id] ?? []).filter((f) => f.kusur)} kapat={() => setDegil(null)}
          fotoEkle={(l) => void fotoEkle(degil, l, true)} fotoCikar={(f) => fotoCikar(degil, f)}
          kaydet={(maddeler, not) => { isaretYaz({ ...isaret, [degil.id]: { sonuc: "degil", maddeler, not, sohbet: isaret[degil.id]?.sohbet ?? bekleyenSohbet[degil.id] ?? [] } }); setDegil(null); }}
          kaldir={isaret[degil.id]?.sonuc === "degil" ? () => { const y = { ...isaret }; delete y[degil.id]; isaretYaz(y); setDegil(null); } : null} />
      )}
      <Pencere acik={!!fotoAcik} baslik={fotoAcik ? `${fotoAcik.kod} · Fotoğraflar` : "Fotoğraflar"} onKapat={() => setFotoAcik(null)}>
        {fotoAcik && (
          <div className={stil.fotoIzgara}>
            {(fotolar[fotoAcik.id] ?? []).map((f, i) => (
              <div key={f.anahtar} className={stil.fotoKutu}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={`Fotoğraf ${i + 1}`} />
                <button type="button" onClick={() => fotoCikar(fotoAcik, f)} aria-label={`Fotoğraf ${i + 1} kaldır`}><Ikon ad="x" kucuk /></button>
              </div>
            ))}
            {sohbetFotolari.map((m) => {
              const secili = (isaret[fotoAcik.id]?.sohbet ?? bekleyenSohbet[fotoAcik.id] ?? []).includes(m.id);
              const baska = baglanan.has(m.id) && !secili;
              return (
                <button key={m.id} type="button" className={stil.sohbetFoto} aria-pressed={secili} disabled={baska} onClick={() => sohbetSec(fotoAcik, m.id)}
                  aria-label={`Sohbetteki fotoğraf${m.metin ? `: ${m.metin}` : ""}`} title={m.metin ?? undefined}>
                  <GizliResim dosyaId={m.dosya!} alt={m.metin ?? "Sohbetteki fotoğraf"} className={stil.sohbetResim} />
                  {secili && <span className={stil.secildi}><Ikon ad="check" kucuk /></span>}
                  {m.metin && <small>{m.metin}</small>}
                </button>
              );
            })}
          </div>
        )}
      </Pencere>
      {yeni && turler && <YeniEkipman plan={planId} turler={turler} kapat={() => setYeni(false)} />}
    </div>
  );
}

function DegilPenceresi({ e, p, g, fotolar, kapat, kaydet, kaldir, fotoEkle, fotoCikar }: {
  e: Ekipman; p: YeniRaporPaketi; g: SahaIsareti | undefined; fotolar: Foto[]; kapat: () => void; kaydet: (maddeler: string[], not: string | null) => void; kaldir: (() => void) | null;
  fotoEkle: (l: File[]) => void; fotoCikar: (f: Foto) => void;
}) {
  const uyar = useUyar();
  const tum = useMemo(() => sahaMaddeleri(p.turler[e.turId]!.tanim), [p, e.turId]);
  const [ara, setAra] = useState("");
  const [secili, setSecili] = useState<string[]>(g?.sonuc === "degil" ? g.maddeler : []);
  const [not, setNot] = useState(g?.sonuc === "degil" ? g.not ?? "" : "");
  const gorunen = useMemo(() => maddeAra(tum, ara), [tum, ara]);
  const degistir = (id: string) => setSecili((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= SAHA_MADDE_EN_COK ? l : [...l, id]));
  const tamam = () => {
    if (tum.length && !secili.length) { uyar("Uygun olmayan maddeyi seçin."); return; }
    if (!tum.length && !not.trim()) { uyar("Kısa bir not yazın."); return; }
    kaydet(secili, not.trim() || null);
  };
  const kusurFoto = secili.length > 0 && fotolar.length < FOTO_MADDE_EN_COK;
  return (
    <Pencere acik baslik={`${e.kod} · Uygun değil`} onKapat={kapat}
      alt={<>{kaldir && <Tus tur="ikincil" onClick={kaldir}>İşareti kaldır</Tus>}<Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus onClick={tamam}>Tamam</Tus></>}>
      <div className={stil.form}>
        {tum.length > 0 && (
          <>
            <label className={stil.etiket} htmlFor="saha-madde-ara">Madde</label>
            <input id="saha-madde-ara" className={stil.girdi} type="search" value={ara} onChange={(x) => setAra(x.target.value)} autoComplete="off" />
            <SayfaliListe ad="Madde" className={stil.maddeler} anahtar={ara} ogeler={gorunen.map((m) => (
              <li key={m.id}>
                <label className={stil.madde} data-secili={secili.includes(m.id) || undefined}>
                  <input type="checkbox" checked={secili.includes(m.id)} onChange={() => degistir(m.id)} />
                  <span>{m.metin}<small>{m.grup}</small></span>
                </label>
              </li>
            ))} />
          </>
        )}
        <label className={stil.etiket} htmlFor="saha-not">Not</label>
        <textarea id="saha-not" className={stil.girdi} rows={2} maxLength={SAHA_NOT_EN_COK} value={not} onChange={(x) => setNot(x.target.value)} />
        <div className={stil.fotoIzgara}>
          {fotolar.map((f, i) => (
            <div key={f.anahtar} className={stil.fotoKutu}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={`Fotoğraf ${i + 1}`} />
              <button type="button" onClick={() => fotoCikar(f)} aria-label={`Fotoğraf ${i + 1} kaldır`}><Ikon ad="x" kucuk /></button>
            </div>
          ))}
          {kusurFoto && <FotoTusu ad="Fotoğraf" etiket="Maddeye fotoğraf ekle" ikon="camera" sinif={stil.fotoTusGenis} coklu sec={fotoEkle} />}
        </div>
      </div>
    </Pencere>
  );
}

function YeniEkipman({ plan, turler, kapat }: { plan: string; turler: { id: string; ad: string }[]; kapat: () => void }) {
  const router = useRouter(), bildir = useBildir(), uyar = useUyar();
  const [tur, setTur] = useState("");
  const [marka, setMarka] = useState("");
  const [model, setModel] = useState("");
  const [yerler, setYerler] = useState<string[]>([""]);
  const [bekliyor, setBekliyor] = useState(false);
  const adet = (n: number) => setYerler((l) => Array.from({ length: Math.min(SAHA_SERI_EN_COK, Math.max(1, n || 1)) }, (_, i) => l[i] ?? ""));
  const ekle = async () => {
    if (!tur) { uyar("Ekipman türü seçin."); return; }
    if (navigator.onLine === false) { uyar("Yeni ekipman için bağlantı gerekir."); return; }
    setBekliyor(true);
    try {
      const r = await sahaEkipmanEylemi(plan, { tur, marka: marka.trim() || null, model: model.trim() || null, yerler: yerler.map((x) => x.trim()) });
      if (r.durum === "tamam") { if (r.bildirim) bildir(r.bildirim); kapat(); router.refresh(); return; }
      uyar(r.durum === "red" ? r.neden : r.durum === "gecersiz" ? Object.values(r.hatalar)[0] ?? "Eklenemedi." : "Eklenemedi.");
    } catch { uyar("Bağlantı yok; bağlanınca yeniden deneyin."); } finally { setBekliyor(false); }
  };
  return (
    <Pencere acik baslik="Yeni ekipman" onKapat={kapat}
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus onClick={() => void ekle()} disabled={bekliyor} aria-busy={bekliyor || undefined}>Listeye ekle</Tus></>}>
      <div className={stil.form}>
        <div className={stil.ikili}>
          <SecimAlani id="saha-tur" ad="Tür" deger={tur} ipucu="Tür seçin" secenekler={turler.map((t) => [t.id, t.ad] as const)} degistir={setTur} />
          <div><label className={stil.etiket} htmlFor="saha-adet">Adet</label>
            <input id="saha-adet" className={stil.girdi} type="number" inputMode="numeric" min={1} max={SAHA_SERI_EN_COK} value={yerler.length} onChange={(x) => adet(Number(x.target.value))} /></div>
        </div>
        <div className={stil.ikili}>
          <div><label className={stil.etiket} htmlFor="saha-marka">Marka</label><input id="saha-marka" className={stil.girdi} maxLength={40} value={marka} onChange={(x) => setMarka(x.target.value)} /></div>
          <div><label className={stil.etiket} htmlFor="saha-model">Model</label><input id="saha-model" className={stil.girdi} maxLength={40} value={model} onChange={(x) => setModel(x.target.value)} /></div>
        </div>
        <SayfaliListe ad="Kullanım yeri" className={stil.yerler} ogeler={yerler.map((y, i) => (
          <li key={i}>
            <label className={stil.etiket} htmlFor={`saha-yer-${i}`}>{i + 1}. kullanım yeri</label>
            <input id={`saha-yer-${i}`} className={stil.girdi} maxLength={60} value={y} onChange={(x) => setYerler((l) => l.map((z, j) => (j === i ? x.target.value : z)))} />
          </li>
        ))} />
      </div>
    </Pencere>
  );
}
