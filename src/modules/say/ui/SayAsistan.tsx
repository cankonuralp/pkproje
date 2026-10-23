"use client";
/* S.A.Y SAHA ASİSTANI (380; maket say.js BB6 — reisim 2026-10-03: "her yer de gözükecek şekilde … daha şık … daha yuvarlak daha ilgi çekici",
   "geçmiş silinmez") — uygulama düzeninde TEK bileşen (her firma sayfası; müşteri paneli ve Yönetim'de yok). Sağ altta yuvarlak düğme (firma yapay
   zekâyı açtıysa); panel masaüstü / tablette sağda yan pencere, telefonda tam ekran; açık / kapalı hâli bu cihazda kalır (sayfa değişince düşmez).
   Geçmiş sunucuda, kişinin hesabında (yalnız kendisi). Hızlı sorular kuralla; serbest soru yapay zekâya. Cevap DÜZ METİN çizilir (HTML işlenmez).
   Bağlantı yoksa, anahtar girilmemişse, sınır dolduysa şerit söyler (sessiz kalmaz). Esc kapatır; açılınca odak soru alanına, kapanınca düğmeye.
   382 — RAPOR EKRANI (baglam.ts: düzenlenen rapor açıkken): hızlı sorular "Eksik alanlar neler?" (bölüm başına "Git" alana götürür) ve "Sonuç ne
   olmalı?" (kriterlerle seçilen uyuşmuyorsa öneri kartı: "Uygula" denetçinin seçimiyle aynı yoldan forma yazar — Kaydet'le kaydedilir; "Vazgeç").
   "Git" ve "Uygula" yalnız o rapor açıkken; sonucu geçmişte kalır. Öneri vermeden rapora hiçbir şey yazılmaz.
   522 — EK (pkproje §3.10 m.17, maket say.js ekran 11): yazma kutusunun yanında ataç → Fotoğraf çek · Galeriden seç · Belge ekle (PDF, Word);
   eklenenler gönderilmeden önce kutunun üstünde küçük görüntü / ad + boyut, × ile çıkar; gönderilen soruda adı görünür. Fotoğraf cihazda küçültülür;
   tür, adet (4) ve toplam boy (4 MB) sunucuda yeniden denetlenir. Dosya saklanmaz.
   542 — S.A.Y RAPORA GİRER (sunum 541 onaylı; reisim 2026-10-14: "oku tuşu olmayacak say asistandan gir ve fotoğrafı okuyup ilgili yerlere girişleri
   yap diyeceğim ve yapacak"): rapor ekranında "Fotoğrafları oku ve gir" (okunmamış fotoğraflar okunur, değerler boş alanlara — yeşil / sarı),
   "Maddeleri uygun işaretle", yazılan kısa komutlar (../istek.ts: "sonucu uygun yap", "üstüne yaz", "geri al" …) kuralla, yapay zekâya gitmeden
   ekranda yapılır; S.A.Y'ın cevabını sunucu sayılardan kurar. Cevabın altında "Geri al" ve dolu alan kaldıysa "Dolu alanları da değiştir" (yalnız
   işi yapan sayfada). K5: rapordayken ataçla eklenen fotoğraf rapora konur (birden çok bölüm varsa hangisine olduğu sorulur) ve okunup girilir.
   550 (sunum 546 — reisim 2026-10-14: "S.A.Y. de herhangi bir kısıt kural vb olmasını istemiyorum oradan direk haiku ile konuşmak aynı claud kullanır
   gibi", "S.A.Y asistanda öneri soruları olarak sadece fotoğrafları oku ve gir kalsın başka bir şey olmasın"): tek hazır tuş "Fotoğrafları oku ve
   gir" (rapor açıkken çalışır); öteki hazır sorular kalktı. Her yazılan Haiku'ya gider (yalnız "geri al" ve bekleyen "Değiştireyim mi?"ye "evet"
   ekranda); cevap Markdown çizilir (ui/Markdown.tsx — HTML işlenmez). Rapordayken Haiku'nun istediği girişler (rapora_yaz) EKRANDA uygulanır:
   işaretli, "Geri al" iletinin altında; kaydetmek kişide. Yazı kutusu çok satırlı: Enter gönderir, Shift+Enter yeni satır.
   553 (reisim 2026-10-14: "konuşarak ilgili formatı yapabiliyo olalım"): format yapıcıdayken taslak gider (baglam.ts useSayFormatBagi); Haiku'nun
   "formati_duzenle" işlemleri taslağa uygulanır, ne yapıldığı bildirimde, "Geri al" iletinin altında; Kaydet / Yayınla kişide.
   557 (sunum 557 · 2. tur onaylı — reisim 2026-10-14): mesaj Gönder'e basınca HEMEN balon (kutu boşalır), altında S.A.Y'ın balonu: hareket eden üç
   nokta + "Düşünüyor" (rapora yazarken "Rapora yazıyor"); S.A.Y iş isteyince ekran yapar, geri okuyup teyit eder, sonucu sayIsSonucuEylemi ile
   döndürür — S.A.Y'ın cevabı ondan sonra ("yaptım" / nedeniyle "yapamadım"); alttaki bildirimler kalktı (her şey sohbette). Başlıkta Küçült (panel
   alta tek satır; bu cihazda kalır); sohbet yukarı kaydırılınca "En alta in".
   561 (reisim 2026-10-15: "chati yukarıdan tutup aşağıya doğru küçültmeyi yapamadım"): panelin boyu üst kenardaki tutamaktan ya da başlıktan
   sürüklenerek değişir (S.A.Y Chat'le aynı ortak parça — components/pencere/PanelBoyu); boy bu cihazda kalır.
   2026-10-15 (pkproje §9 "S.A.Y CLAUDE GİBİ" — reisim: "yap işte yap dedim", "tekrar tekrar soruyor"): (A) İŞ DÖNGÜSÜ — S.A.Y'ın istediği işi ekran
   yapar, sonucu döngünün bütün adımlarıyla ve raporun güncel hâliyle S.A.Y'a döner; S.A.Y yeni iş isterse yine yapılır, iş bitene kadar (tur
   sınırı, Durdur tuşu, onay sorusu yok). Okuma ve geri alma da döngüde. Ara turlar sohbete yazılmaz; S.A.Y'ın son cevabı yazılır, bütün işin
   "Geri al"ı onun altında. Bekleme balonu turda ne yapıldığını söyler (Rapora yazıyor / Okuyor / Düşünüyor). (C) rapora_yaz'ın satir_ekle'si ekranda
   (raporlar/say-doldur.ts). (D) sahte "yaptım" sunucuda yakalanır — ekranda yeni kutu / tuş yok.
   2026-10-16 (S.A.Y 1. adım incelemesi): döngünün hedefi başladığı rapor / taslak — iş sürerken başka rapora geçilirse oraya yazılmaz, S.A.Y'a
   nedeni döner; sorunun ekleri her turda yeniden gider (saklanmaz); iş yarıda kesilirse (tur reddedildi ya da gönderilemedi) yapılanları sunucu
   sayılarla yazar, bütün işin Geri al'ı o iletiye bağlanır; gönderilen soru yarıda kalan işte kutuya geri konmaz (iş iki kez yapılmasın).
   2026-10-16 (pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a — reisim: "sayfalarda gezmesine gerek yok", "bu sayfa açık değil falan demesin", "f5 yapılması
   gerekiyorsa … haber veriyor"): S.A.Y'ın uygulama işlemleri (islem) SUNUCUDA çalışır — ekran yalnız sonucu görür: sunucunun yaptığı adımlar
   (adimlar) ve aynı cevaptaki işlemlerin sonuçları (hazir) döngünün adımlarına girer, "devam"da yeni tur hemen gider. Açık raporu S.A.Y ekranın
   Kaydet / Onaya gönder'iyle kaydeder (raporu_kaydet / onaya_gonder). D: veri değiştiren işlem çalıştıysa iş bitince açık sayfa yenilenir
   (router.refresh); ekranda kaydedilmemiş değişiklik varsa yenilenmez — sunucu S.A.Y'ın cevabına söyler (kaydedilmemis her turda gider).
   2026-10-23 BAŞTAN (reisim: "say asistanı direk claude da haiku nasıl çalışıyor ise direk o şekilde çalıştıramaz mıyız", "hiç bir kısıtı olmasın"):
   soru, ekranın sonucu ve devam akışlı uçta (/api/say — server/dongu.ts); düşünme özeti ve cevap yazıldıkça balonda; konuşma sunucuda olduğu gibi
   saklanır (ekran adımları göndermez, yalnız bekleyen araç çağrılarının sonucunu); ekler önce parça parça yüklenir (/api/say/ek) ve konuşmada kalır;
   ek sayısı, boyu, soru uzunluğu sınırı yok; Excel bütün sayfalarıyla metne çevrilir. */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { fotografiKucult } from "../../../components/foto/kucult";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { useGorunurAlan } from "../../../components/pencere/gorunurAlan";
import { usePanelBoyu } from "../../../components/pencere/PanelBoyu";
import { Serit } from "../../../components/serit/Serit";
import type { SohbetEkAdi, SohbetEksik, SohbetIletisi } from "../../../server/yz/sohbet";
import { xlsxSayfalari } from "../../../components/disa/oku";
import { EK_PARCA_BAYT, KAYDEDILMEMIS } from "../sabitler";
import type { SayDurum } from "../server/say";
import type { SayOlayi } from "../server/dongu";
import type { IsOzeti, SayKomutu } from "../../../server/yz/say";
import { Markdown } from "./Markdown";
import { istekTani, type Istek } from "../istek";
import { kaydedilmemisVar, useSayFormatBagi, useSayRaporBagi, type SayFormatBagi, type SayGeriAl, type SayRaporBagi } from "./baglam";
import { sayDurumEylemi, sayGecmisEylemi, sayOneriEylemi, sayRaporEylemi, sayTemizleEylemi } from "./eylemler";
import stil from "./say.module.css";

const ACIK_ANAHTARI = "probata-say-acik";
/** 557: küçük (alta tek satır) hâli bu cihazda kalır */
const KUCUK_ANAHTARI = "probata-say-kucuk";
/** 561: kısaltılmış boy bu cihazda kalır */
const BOY_ANAHTARI = "probata-say-boy";
/** 550: tek hazır tuş (reisim: "sadece fotoğrafları oku ve gir kalsın başka bir şey olmasın") */
const OKU = "Fotoğrafları oku ve gir";
/** 542: S.A.Y'ın rapora yaptığı işin bu sayfadaki eylemleri (ileti kimliği → geri al / dolu alanları da değiştir) */
interface IslemEylemi { geriAl?: SayGeriAl; ustune?: () => { sayi: number; geriAl: SayGeriAl } }
/** A: döngüde bir araç çağrısını ekranın yapması — S.A.Y'a dönen özet, işin geri alması, dolu alanlar için "üstüne yaz" */
interface KomutSonucu { ozet: IsOzeti; geriAl?: SayGeriAl; ustune?: IslemEylemi["ustune"] }
/** 2026-10-16: döngünün hedefi — başladığı rapor / taslak (yalnız kimliği eşleşen bağ; başka rapora geçilince null) ve bu döngüde kullanılan eylemler */
interface DonguHedefi { rapor: () => SayRaporBagi | null; taslak: () => SayFormatBagi | null; kullanilan: Set<string> }
const yapilamadi = (ad: string, neden: string): KomutSonucu => ({ ozet: { yazildi: 0, ayni: 0, bekliyor: 0, yapilan: [], yazilamadi: [{ ad, neden }] } });
const DAR = "(max-width: 767.98px)";
type SayRed = { durum: "red"; neden: string };

function cevrimici(): boolean { return typeof navigator === "undefined" || navigator.onLine !== false; }

/* 522: ek — gönderilmeden önce yalnız bu ekranda (görüntüsü blob: adresiyle); sunucu türü içerikten yeniden denetler. 2026-10-23 (S.A.Y baştan —
   reisim: "hiç bir kısıtı olmasın"): adet ve boy sınırı yok; her dosya parça parça yüklenir (/api/say/ek) ve konuşmada kalır; Excel ekranda bütün
   sayfalarıyla metne çevrilir */
interface Ek extends SohbetEkAdi { id: number; dosya: File; url: string | null }
const WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
function boyutYaz(b: number): string {
  return b >= 1048576 ? `${String(Math.round(b / 104857.6) / 10).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}
function ekTuru(f: File): SohbetEkAdi["tur"] {
  const ad = f.name.toLocaleLowerCase("tr");
  if (/^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|heic|heif)$/.test(ad)) return "foto";
  if (f.type === "application/pdf" || ad.endsWith(".pdf")) return "pdf";
  if (f.type === WORD || ad.endsWith(".docx")) return "word";
  if (ad.endsWith(".xlsx")) return "tablo";
  return "metin";
}
const TUR_AD: Record<SohbetEkAdi["tur"], string> = { foto: "Fotoğraf", pdf: "PDF", word: "Word", metin: "Dosya", tablo: "Excel" };
/** Excel'in bütün sayfaları metin: her sayfa başlığıyla, hücreler noktalı virgülle (CSV) */
async function excelMetni(f: File): Promise<File> {
  const sayfalar = await xlsxSayfalari(new Uint8Array(await f.arrayBuffer()));
  const hucre = (x: string) => (/[;"\n\r]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x);
  const metin = sayfalar.map((s) => [`## Sayfa: ${s.ad || "(adsız)"}`, ...s.satirlar.map((r) => r.map(hucre).join(";"))].join("\n")).join("\n\n");
  return new File([metin], `${f.name}.csv`, { type: "text/plain" });
}
/** bir eki parça parça yükler (barındırmanın istek boyu sınırı); dönen: konuşmadaki ekin kimliği */
async function ekYukle(e: Ek, ilerle: (s: string) => void): Promise<{ id: string } | SayRed> {
  let dosya = e.dosya;
  if (e.tur === "tablo") {
    try { dosya = await excelMetni(e.dosya); } catch { return { durum: "red", neden: `${e.ad}: Excel okunamadı (bozuk ya da .xlsx değil).` }; }
  }
  const b = new Uint8Array(await dosya.arrayBuffer()), adet = Math.max(1, Math.ceil(b.length / EK_PARCA_BAYT)), yukleme = crypto.randomUUID();
  for (let i = 0; i < adet; i++) {
    if (adet > 1) ilerle(`${e.ad} yükleniyor · %${Math.round((i / adet) * 100)}`);
    const r = await fetch("/api/say/ek", { method: "POST", body: b.subarray(i * EK_PARCA_BAYT, (i + 1) * EK_PARCA_BAYT),
      headers: { "content-type": "application/octet-stream", "x-yukleme": yukleme, "x-sira": String(i), "x-adet": String(adet), "x-ad": encodeURIComponent(e.ad),
        ...(e.tur === "tablo" ? { "x-tablo": "1" } : {}) } });
    const y = await r.json().catch(() => null) as { durum?: string; neden?: string; ek?: { id: string } } | null;
    if (!r.ok || !y) return { durum: "red", neden: `${e.ad}: yüklenemedi; bağlantıyı kontrol edip yeniden deneyin.` };
    if (y.durum === "red") return { durum: "red", neden: y.neden ?? `${e.ad}: yüklenemedi.` };
    if (y.durum === "tamam" && y.ek) return { id: y.ek.id };
  }
  return { durum: "red", neden: `${e.ad}: yüklenemedi.` };
}
/** akışlı yanıtın satırları (her satır bir olay); dönen: okunan olay sayısı */
async function olaylariOku(govde: ReadableStream<Uint8Array>, olay: (x: SayOlayi) => void): Promise<number> {
  const okuyucu = govde.getReader(), cozucu = new TextDecoder();
  let kalan = "", n = 0;
  for (;;) {
    const { done, value } = await okuyucu.read();
    kalan += done ? cozucu.decode() : cozucu.decode(value, { stream: true });
    let i: number;
    while ((i = kalan.indexOf("\n")) >= 0) {
      const satir = kalan.slice(0, i).trim();
      kalan = kalan.slice(i + 1);
      if (!satir) continue;
      try { olay(JSON.parse(satir) as SayOlayi); n++; } catch { /* bozuk satır atlanır */ }
    }
    if (done) return n;
  }
}

function EkListesi({ ekler, cikar }: { ekler: readonly (SohbetEkAdi & { url?: string | null })[]; cikar?: (i: number) => void }) {
  return (
    <ul className={stil.ekler} aria-label="Ekler">
      {ekler.map((e, i) => (
        <li key={i}>
          {/* blob: adresi: yalnız bu cihazda seçilen, henüz gönderilmemiş fotoğraf (sunucuda kopyası yok) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {e.url ? <img src={e.url} alt="" /> : <Ikon ad={e.tur === "foto" ? "image" : "file-text"} kucuk />}
          <b title={e.ad}>{e.ad}</b><small>{TUR_AD[e.tur]} · {boyutYaz(e.boyut)}</small>
          {cikar && <button className={stil.ekCikar} type="button" onClick={() => cikar(i)} aria-label={`${e.ad} ekini çıkar`} title="Çıkar"><Ikon ad="x" kucuk /></button>}
        </li>
      ))}
    </ul>
  );
}

/** eksikler bölüm başına (sırası korunur): "Bölüm · N alan" + Git (ilk alana) */
function bolumle(l: readonly SohbetEksik[]): { bolumAd: string; ilk: SohbetEksik; n: number }[] {
  const g = new Map<string, { bolumAd: string; ilk: SohbetEksik; n: number }>();
  for (const e of l) { const x = g.get(e.bolum); if (x) x.n++; else g.set(e.bolum, { bolumAd: e.bolumAd, ilk: e, n: 1 }); }
  return [...g.values()];
}

function Ileti({ m, rb, git, uygula, vazgec, eylem, eylemYap }: {
  m: SohbetIletisi; rb: SayRaporBagi | null; git: (e: SohbetEksik) => void; uygula: (m: SohbetIletisi) => void; vazgec: (m: SohbetIletisi) => void;
  eylem?: IslemEylemi; eylemYap: (m: SohbetIletisi, ne: "geri" | "ustune") => void;
}) {
  if (m.kim === "ben") return <li className={`${stil.mesaj} ${stil.ben}`}>{m.ek?.ekler?.length ? <EkListesi ekler={m.ek.ekler} /> : null}{m.metin}</li>;
  const burada = !!rb && !!m.ek?.rapor && rb.id === m.ek.rapor;
  const o = m.ek?.oneri;
  return (
    <li className={`${stil.mesaj} ${stil.o}`}>
      <Markdown metin={m.metin} />
      {m.ek?.bekleyen?.length ? (
        <ul className={stil.bekleyen}>
          {m.ek.bekleyen.map((b) => (
            <li key={b.href}>
              {/^\/[a-z-]*$/.test(b.href) ? <Link href={b.href}>{b.ad}</Link> : b.ad}: {[b.kirmizi ? `${b.kirmizi} ${b.kirmiziAd}` : "", b.sari ? `${b.sari} ${b.sariAd}` : ""].filter(Boolean).join(" · ")}
            </li>
          ))}
        </ul>
      ) : null}
      {m.ek?.eksik?.length ? (
        <ul className={stil.eksik}>
          {bolumle(m.ek.eksik).map((g) => (
            <li key={g.ilk.bolum}>
              <span>{g.bolumAd} · {g.n} alan</span>
              {burada && <button className={stil.kucukTus} type="button" onClick={() => git(g.ilk)}><Ikon ad="arrow-right" kucuk />Git</button>}
            </li>
          ))}
        </ul>
      ) : null}
      {eylem && (eylem.geriAl || eylem.ustune) && (
        <div className={stil.oneriTuslar}>
          {eylem.ustune && <button className={`${stil.kucukTus} ${stil.birincil}`} type="button" onClick={() => eylemYap(m, "ustune")}><Ikon ad="pencil" kucuk />Dolu alanları da değiştir</button>}
          {eylem.geriAl && <button className={stil.kucukTus} type="button" onClick={() => eylemYap(m, "geri")}><Ikon ad="undo-2" kucuk />Geri al</button>}
        </div>
      )}
      {o && (
        <div className={stil.oneri}>
          <p className={stil.oneriBas}><Ikon ad="pencil" kucuk />Öneri</p>
          <p className={stil.oneriMetin}>{o.ad}</p>
          {o.durum === "uygulandi" ? <p className={stil.oneriDurum} tabIndex={-1} id={`say-o-${m.id}`}><Ikon ad="circle-check" kucuk />Rapora uygulandı</p>
            : o.durum === "vazgecildi" ? <p className={`${stil.oneriDurum} ${stil.oneriRed}`} tabIndex={-1} id={`say-o-${m.id}`}>Uygulanmadı</p>
            : !burada ? <p className={`${stil.oneriDurum} ${stil.oneriRed}`}>{m.yer} açıkken uygulanır</p>
            : (
              <div className={stil.oneriTuslar}>
                <button className={stil.kucukTus} type="button" onClick={() => vazgec(m)}>Vazgeç</button>
                <button className={`${stil.kucukTus} ${stil.birincil}`} type="button" onClick={() => uygula(m)}><Ikon ad="check" kucuk />Uygula</button>
              </div>
            )}
        </div>
      )}
    </li>
  );
}

export function SayAsistan() {
  const yol = usePathname() ?? "/";
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const rb = useSayRaporBagi();
  const fb = useSayFormatBagi();
  /* A: döngü süren bir işte ekranın GÜNCEL bağı (iş sırasında rapor ekranı kapanırsa ya da yeniden bağlanırsa) */
  const rbRef = useRef(rb), fbRef = useRef(fb);
  useEffect(() => { rbRef.current = rb; fbRef.current = fb; }, [rb, fb]);
  const [durum, setDurum] = useState<SayDurum | null>(null);
  const [acik, setAcik] = useState(false);
  const [iletiler, setIletiler] = useState<SohbetIletisi[] | null>(null);
  const [soru, setSoru] = useState("");
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [bagli, setBagli] = useState(true);
  const [ekler, setEkler] = useState<Ek[]>([]);
  const [menu, setMenu] = useState(false);
  /* 542: rapora yapılan işin eylemleri (bu sayfada), okuma ilerlemesi, eklenen fotoğrafın bölümü sorusu */
  const [islemler, setIslemler] = useState<ReadonlyMap<string, IslemEylemi>>(() => new Map());
  const [ilerleme, setIlerleme] = useState<string | null>(null);
  const [bolumSor, setBolumSor] = useState<{ fotolar: File[]; soru: string } | null>(null);
  /* 557: bekleme balonundaki yazı ("Düşünüyor" / "Rapora yazıyor" …), küçük hâl, sohbetin sonunda mı (en alta in tuşu) */
  const [asama, setAsama] = useState<string | null>(null);
  /* 2026-10-23: S.A.Y'ın yazmakta olduğu cevap ve düşünme özeti (akışla gelir; ileti kaydedilince boşalır) */
  const [canli, setCanli] = useState("");
  const [dusunce, setDusunce] = useState("");
  const [kucuk, setKucuk] = useState(false);
  const [altta, setAltta] = useState(true);
  const alttaRef = useRef(true);
  const geciciSira = useRef(0);
  const ekSira = useRef(0);
  const atac = useRef<HTMLButtonElement>(null);
  const fab = useRef<HTMLButtonElement>(null);
  const girdi = useRef<HTMLTextAreaElement>(null);
  const govde = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  useGorunurAlan(panel, acik);
  const boyu = usePanelBoyu(panel, BOY_ANAHTARI), boy = boyu.boy, boyOku = boyu.oku;

  /* durum: sayfa açılınca bir kez (düzen sayfalar arasında kalır); önceki sayfada açık bırakılan panel açık gelir (odak çalınmaz) */
  useEffect(() => {
    let canli = true;
    sayDurumEylemi().then((d) => {
      if (!canli || !d) return;
      setDurum(d);
      let onceAcik = false;
      try { onceAcik = localStorage.getItem(ACIK_ANAHTARI) === "1"; setKucuk(localStorage.getItem(KUCUK_ANAHTARI) === "1"); } catch { /* saklama yok */ }
      boyOku();
      if (d.acik && onceAcik) setAcik(true);
    }, () => undefined);
    return () => { canli = false; };
  }, [boyOku]);
  useEffect(() => {
    const g = () => setBagli(cevrimici());
    g();
    window.addEventListener("online", g); window.addEventListener("offline", g);
    return () => { window.removeEventListener("online", g); window.removeEventListener("offline", g); };
  }, []);
  /* panel açılınca geçmiş (bir kez) */
  useEffect(() => {
    if (!acik || iletiler) return;
    let canli = true;
    sayGecmisEylemi().then((l) => { if (canli) setIletiler(l); }, () => { if (canli) setIletiler([]); });
    return () => { canli = false; };
  }, [acik, iletiler]);
  /* 557: yeni ileti gelince yalnız sohbetin sonundaysa aşağı kayar (yukarıda okurken yerinde kalır; "En alta in" çıkar) */
  useEffect(() => { const g = govde.current; if (g && alttaRef.current) g.scrollTop = g.scrollHeight; }, [iletiler, acik, hata, asama, kucuk]);
  /* 550: gönderilince yazı kutusu tek satıra döner */
  useEffect(() => { if (!soru && girdi.current) girdi.current.style.height = ""; }, [soru]);
  /* ek menüsü dışarı tıklanınca kapanır */
  useEffect(() => {
    if (!menu) return;
    const d = (e: MouseEvent) => { if (!(e.target as Element | null)?.closest?.("[data-say-ek]")) setMenu(false); };
    document.addEventListener("click", d);
    return () => document.removeEventListener("click", d);
  }, [menu]);
  useEffect(() => {
    const f = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== "saychat") return;
      setAcik(false);
      try { localStorage.setItem(ACIK_ANAHTARI, "0"); } catch { /* saklama yok */ }
    };
    window.addEventListener("probata-panel", f);
    return () => window.removeEventListener("probata-panel", f);
  }, []);
  /* 542: panel açıkken sayfa panelin solunda (temel.css html[data-panel-acik]) */
  useEffect(() => {
    if (!acik) return;
    const h = document.documentElement;
    h.setAttribute("data-panel-acik", "say");
    /* 557: küçükken (561: ya da kısaltılmışken) telefonda sayfa kaymaya devam eder, havadaki tuşlar küçük panelin üstüne çıkar (temel.css) */
    if (kucuk || boy !== null) h.setAttribute("data-panel-kucuk", "say");
    return () => {
      if (h.getAttribute("data-panel-acik") === "say") h.removeAttribute("data-panel-acik");
      if (h.getAttribute("data-panel-kucuk") === "say") h.removeAttribute("data-panel-kucuk");
    };
  }, [acik, kucuk, boy]);
  useEffect(() => {
    if (durum?.acik) document.documentElement.setAttribute("data-say", "var");
    return () => document.documentElement.removeAttribute("data-say");
  }, [durum?.acik]);

  if (!durum?.acik) return null;
  const hazir = durum.anahtar && bagli;
  const raporda = !!rb;

  const ac = (odakla = true) => {
    /* 524: S.A.Y Chat ile aynı yer — biri açılınca öteki kapanır */
    window.dispatchEvent(new CustomEvent("probata-panel", { detail: "say" }));
    setAcik(true); setHata(null); setKucuk(false);
    try { localStorage.setItem(ACIK_ANAHTARI, "1"); localStorage.setItem(KUCUK_ANAHTARI, "0"); } catch { /* saklama yok */ }
    if (odakla) requestAnimationFrame(() => (girdi.current && !girdi.current.disabled ? girdi.current : document.getElementById("say-kapat"))?.focus());
  };
  const kapat = () => {
    setAcik(false);
    try { localStorage.setItem(ACIK_ANAHTARI, "0"); } catch { /* saklama yok */ }
    requestAnimationFrame(() => fab.current?.focus());
  };
  const sonuc = (y: { durum: "tamam"; iletiler: SohbetIletisi[] } | SayRed) => {
    if (y.durum === "tamam") { setIletiler((l) => [...(l ?? []), ...y.iletiler.filter((m) => !(l ?? []).some((x) => x.id === m.id))]); setHata(null); return true; }
    setHata(y.neden);
    return false;
  };
  /* ── 542: S.A.Y rapora girer — iş ekranda (rb), cevabı sunucu sayılardan kurar (geçmişe yazılır) ── */
  const islemKaydet = async (girdi: Record<string, unknown>, eylem?: IslemEylemi) => {
    /* 553: format yapıcıda (rapor yok) geri alma yalnız bildirimle — geçmişe rapor işi yazılmaz */
    if (!rb) { if (girdi.istek === "geri") bildir(Number(girdi.sayi) ? "S.A.Y'ın değişikliği geri alındı (taslak)." : "Geri alınacak değişiklik kalmadı (taslak sonradan değişmiş)."); return; }
    const y = await sayRaporEylemi({ hizli: "islem", rapor: { id: rb.id, no: rb.no }, islem: girdi });
    if (y.durum === "tamam" && eylem && (eylem.geriAl || eylem.ustune)) {
      const m = y.iletiler.find((x) => x.kim === "say");
      if (m) setIslemler((x) => new Map(x).set(m.id, eylem));
    }
    sonuc(y);
  };
  /** en son, hâlâ kullanılabilen eylem (yazılan "üstüne yaz" / "geri al" için). 2026-10-16: yalnız açık raporun / taslağın iletilerindeki (başka
      rapordan kalan geri alma bu rapora uygulanmaz) ve döngüde bu sırada kullanılmamış olan (haric — kapanıştaki islemler henüz güncellenmedi) */
  const sonEylem = (ne: "geri" | "ustune", haric: ReadonlySet<string> = new Set(), yer: { rapor: string | null; format: string | null } = { rapor: rb?.id ?? null, format: fb?.id ?? null }) =>
    [...islemler.entries()].reverse().find(([id, e]) => {
      if (haric.has(id) || !(ne === "geri" ? e.geriAl : e.ustune)) return false;
      const m = iletiler?.find((x) => x.id === id);
      return !!m && ((!!yer.rapor && m.ek?.rapor === yer.rapor) || (!!yer.format && m.ek?.format === yer.format));
    });
  /** işin kendisi (bekleme göstergesi çağıranda): okuma, geri al, dolu alanları da değiştir */
  const islemCalistir = async (istek: Istek, soru: string, ek: readonly { dosya: string; bolum: string }[] = []) => {
    if (!rb) return;
    if (istek === "oku") {
      const r = await rb.fotolariOku((x) => setIlerleme(x), ek);
      setIlerleme(null);
      await islemKaydet({ istek, soru, sayi: r.ozet.okunan, okuma: r.ozet }, { geriAl: r.geriAl, ...(r.ustune ? { ustune: r.ustune } : {}) });
    } else {
      const s = sonEylem(istek === "geri" ? "geri" : "ustune");
      await eylemCalistir(s?.[0] ?? null, istek === "geri" ? "geri" : "ustune", soru);
    }
  };
  const islemYap = async (istek: Istek, soru: string, ek: readonly { dosya: string; bolum: string }[] = []) => {
    if (!rb || bekliyor) return;
    alttaRef.current = true; setAltta(true);
    setBekliyor(true); setHata(null); setAsama(istek === "oku" ? "Okuyor" : "Düşünüyor");
    try { await islemCalistir(istek, soru, ek); }
    catch { setIlerleme(null); setHata("S.A.Y'a ulaşılamadı; bağlantıyı kontrol edip yeniden deneyin."); } finally { setBekliyor(false); setAsama(null); }
  };
  /** A: S.A.Y'ın bir araç çağrısını ekran yapar (557: geri okuyup teyit eder) — S.A.Y'a dönen özet; okuma ve geri alma da döngünün içinde
      (sonuçlarını artık ayrı bir ileti yazmaz, S.A.Y'a döner) */
  const komutYap = async (k: SayKomutu, geriler: SayGeriAl[], h: DonguHedefi): Promise<KomutSonucu> => {
    /* 2026-10-16 (2. adım a): uygulamanın işlemi ekranda yapılmaz — sonucu sunucudan gelir (hazir); gelmediyse yapılamadı */
    if (k.tur === "islem" || k.tur === "islemler") return yapilamadi(k.tur === "islem" ? k.ad || "İşlem" : "İşlemler", "işlemin sonucu sunucudan gelmedi");
    /* 553: format yapıcıda taslağa (2026-10-16: döngünün başladığı taslağa — başka taslağa geçildiyse yazılmaz) */
    if (k.tur === "format") {
      const f = h.taslak();
      if (!f) return yapilamadi("Format taslağı", "format yapıcı iş sırasında kapandı ya da başka bir taslağa geçildi");
      setAsama("Formata yazıyor");
      const r = f.uygula(k.islemler);
      return { ozet: { yazildi: r.yapilan.length, ayni: 0, bekliyor: 0, yapilan: r.yapilan.slice(0, 1_000),
        yazilamadi: r.gecersiz.slice(0, 5_000).map((g) => { const i = g.indexOf(": "); return i > 0 ? { ad: g.slice(0, i), neden: g.slice(i + 2) } : { ad: g, neden: "" }; }) },
        ...(r.yapilan.length ? { geriAl: r.geriAl } : {}) };
    }
    const r = h.rapor();
    /* 2026-10-16 (2. adım a incelemesi): kapanan ekranda yazılıp kaydedilmeyen girişler kayboldu — S.A.Y bunu bilsin (kayıttaki hâli okuyup gerekirse
       işlemle yeniden yazar; "yazıldı" saydıklarıyla onaya göndermesin) */
    if (!r) return yapilamadi("Rapor", "rapor ekranı iş sırasında kapandı ya da başka bir rapora geçildi; ekrana yazılıp kaydedilmeyen girişler kayboldu — "
      + "rapor_getir ile kayıttaki hâli oku, gerekirse rapor_yaz ile yeniden yaz");
    /* 2026-10-16 (2. adım a — C): ekranın Kaydet / Onaya gönder'i (aynı sunucu eylemi, ekranın son hâli) */
    if (k.tur === "kaydet" || k.tur === "gonder") {
      const ad = k.tur === "kaydet" ? "Kaydet" : "Onaya gönder";
      const is = k.tur === "kaydet" ? r.kaydet : r.onayaGonder;
      if (!is) return yapilamadi(ad, "bu ekran S.A.Y'dan kaydedilemiyor; ekrandaki tuşla kaydedin");
      setAsama(k.tur === "kaydet" ? "Kaydediyor" : "Onaya gönderiyor");
      const y = await is();
      if (y.tamam) return { ozet: { yazildi: 1, ayni: 0, bekliyor: 0, yapilan: [y.bildirim], yazilamadi: [] } };
      /* 2. adım a incelemesi: Onaya gönder'de rapor kaydedildi, gönderilmedi (eksik) — kayıt yapılan iş, gönderme yapılamayan */
      return y.kaydedildi ? { ozet: { yazildi: 1, ayni: 0, bekliyor: 0, yapilan: ["Rapor kaydedildi"], yazilamadi: [{ ad, neden: y.neden }] } } : yapilamadi(ad, y.neden);
    }
    if (k.tur === "yaz") {
      setAsama("Rapora yazıyor");
      const y = await r.yaz(k.girisler, k.satirlar);
      const say = (d: string) => y.sonuclar.filter((s) => s.durum === d).length;
      return { ozet: { yazildi: say("yazildi"), ayni: say("ayni"), bekliyor: say("bekliyor"), satir: y.satir ?? 0,
        yapilan: y.sonuclar.filter((s) => s.durum === "yazildi").slice(0, 1_000).map((s) => s.ad),
        yazilamadi: y.sonuclar.filter((s) => s.durum === "yazilamadi").slice(0, 5_000).map((s) => ({ ad: s.ad, neden: s.neden ?? "" })) },
        ...(y.sayi || y.satir ? { geriAl: y.geriAl } : {}) };
    }
    if (k.tur === "oku") {
      setAsama("Okuyor");
      const y = await r.fotolariOku((x) => setIlerleme(x));
      setIlerleme(null);
      const o = y.ozet, girilen = o.bolumler.reduce((t, b) => t + b.alan + b.satir, 0);
      return { ozet: { yazildi: girilen, ayni: 0, bekliyor: 0,
        yapilan: o.bolumler.filter((b) => b.alan || b.satir).map((b) => `${b.ad}: ${[b.alan ? `${b.alan} alan` : "", b.satir ? `${b.satir} satır` : ""].filter(Boolean).join(", ")}${b.belirsiz ? ` (${b.belirsiz} değerden emin değil, sarı)` : ""}`),
        yazilamadi: [...(!o.okunan && !o.okunamayan ? [{ ad: "Fotoğraf", neden: "okunacak fotoğraf yok (bölüm başlığındaki “Fotoğraf ekle” ile eklenir)" }] : []),
          ...(o.okunamayan ? [{ ad: `${o.okunamayan} fotoğraf`, neden: o.neden ?? "okunamadı" }] : []),
          ...o.dolu.map((d) => ({ ad: d, neden: "dolu olduğu için değiştirilmedi" }))] },
        ...(girilen ? { geriAl: y.geriAl } : {}), ...(y.ustune ? { ustune: y.ustune } : {}) };
    }
    /* geri al: önce bu döngünün son işi, yoksa sohbetteki son işin geri alması (bir kez) */
    setAsama("Geri alıyor");
    let g = geriler.pop();
    if (!g) {
      const s = sonEylem("geri", h.kullanilan, { rapor: r.id, format: null });
      if (s) { g = s[1].geriAl; h.kullanilan.add(s[0]); setIslemler((x) => new Map(x).set(s[0], {})); }
    }
    const sayi = g ? g() : 0;
    return { ozet: { yazildi: sayi, ayni: 0, bekliyor: 0, yapilan: sayi ? [`${sayi} giriş geri alındı`] : [],
      yazilamadi: sayi ? [] : [{ ad: "Geri al", neden: "geri alınacak giriş kalmadı (değerler sonradan değişmiş)" }] } };
  };
  /** 2026-10-23 (S.A.Y baştan — reisim: "direk claude da haiku nasıl çalışıyor ise direk o şekilde"): İŞ — akışlı uç (/api/say). S.A.Y'ın düşünme
      özeti ve cevabı yazıldıkça balonda; S.A.Y'ın istediği ekran işlerini ekran yapar (557: geri okuyup teyit eder), sonucu aynı işe döndürür; uç
      "devam" derse (işlev süresi) iş yeni istekle sürer. Tur, adım, süre sınırı yok. Bütün işin "Geri al"ı (ve okumada dolu alan kaldıysa "Dolu
      alanları da değiştir") S.A.Y'ın son iletisinin altında. Veri değiştiren işlem çalıştıysa iş bitince açık sayfa yenilenir (ekranda kaydedilmemiş
      değişiklik yoksa; varsa söylenir) */
  const ekranGirdisi = (h?: DonguHedefi) => {
    const r = h ? h.rapor() : rbRef.current, f = h ? h.taslak() : fbRef.current;
    return { yol, raporNo: r?.no ?? null, canli: r ? { id: r.id, cevaplar: r.cevaplar(), ekipman: r.ekipman(), ...r.canliEk() } : undefined,
      kurucu: f ? { id: f.id, tanim: f.tanim() } : undefined, kaydedilmemis: kaydedilmemisVar() };
  };
  const isYap = async (ilk: Record<string, unknown>): Promise<void> => {
    /* hedef işin başladığı rapor / taslak — iş sürerken başka rapora geçilirse oraya yazılmaz; aynı raporun yeniden bağlanması sürer */
    const ilkRapor = rbRef.current?.id ?? null, ilkTaslak = fbRef.current?.id ?? null;
    const h: DonguHedefi = {
      rapor: () => (ilkRapor && rbRef.current?.id === ilkRapor ? rbRef.current : null),
      taslak: () => (ilkTaslak && fbRef.current?.id === ilkTaslak ? fbRef.current : null),
      kullanilan: new Set(),
    };
    const is = crypto.randomUUID(), geriler: SayGeriAl[] = [];
    let ustune: IslemEylemi["ustune"], sonSay: string | null = null, yenile = false, govde: Record<string, unknown> = { ...ilk, is }, bos = 0;
    for (;;) {
      /* geri çağırmada yazılır (nesne — denetleyici daraltmasın) */
      const d: { ekran: Extract<SayOlayi, { t: "ekran" }> | null; son: "bitti" | "devam" | "hata" | null } = { ekran: null, son: null };
      const r = await fetch("/api/say", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(govde) });
      if (!r.ok || !r.body) { setHata(r.status === 401 ? "Oturumunuz kapandı. Sayfayı yenileyip yeniden giriş yapın." : "S.A.Y'a ulaşılamadı; bağlantıyı kontrol edip yeniden deneyin."); break; }
      const n = await olaylariOku(r.body, (x) => {
        if (x.t === "ileti") {
          setIletiler((l) => [...(l ?? []).filter((m) => !(x.ileti.kim === "ben" && m.id.startsWith("gecici-"))), x.ileti]);
          if (x.ileti.kim === "say") { sonSay = x.ileti.id; setCanli(""); setDusunce(""); }
        } else if (x.t === "metin") setCanli((c) => c + x.d);
        else if (x.t === "dusunce") setDusunce((c) => c + x.d);
        else if (x.t === "asama") setAsama(x.ad);
        else {
          yenile ||= x.yenile;
          if (x.t === "ekran") d.ekran = x;
          else { d.son = x.t; if (x.t === "hata") setHata(x.neden); }
        }
      });
      setCanli(""); setDusunce("");
      const e = d.ekran, son = d.son;
      if (e) {
        const sonuclar: { id: string; ozet: IsOzeti }[] = [];
        for (const a of e.araclar) {
          const k = a.komut ? await komutYap(a.komut, geriler, h) : yapilamadi(a.ad, "aracın girdisi okunamadı");
          if (k.geriAl) geriler.push(k.geriAl);
          if (k.ustune) ustune = k.ustune;
          sonuclar.push({ id: a.id, ozet: k.ozet });
        }
        setAsama("Düşünüyor");
        govde = { tur: "sonuc", is, sonuclar, ...ekranGirdisi(h) };
        bos = 0;
        continue;
      }
      /* uç "devam" dedi ya da akış olaysız kesildi (işlev süresi): iş kaldığı yerden sürer — üst üste iki boş akışta durur */
      if (son === "devam" || (son === null && (bos = n ? 0 : bos + 1) < 2)) { govde = { tur: "devam", is, ...ekranGirdisi(h) }; continue; }
      if (son === null) setHata("S.A.Y'a ulaşılamadı; bağlantıyı kontrol edip yeniden deneyin.");
      break;
    }
    const id: string | null = sonSay;
    if (id && (geriler.length || ustune)) {
      const hepsi = [...geriler].reverse(), u = ustune;
      setIslemler((x) => new Map(x).set(id, { ...(hepsi.length ? { geriAl: () => hepsi.reduce((t, g) => t + g(), 0) } : {}), ...(u ? { ustune: u } : {}) }));
    }
    if (yenile) { if (kaydedilmemisVar()) setHata(KAYDEDILMEMIS); else router.refresh(); }
  };
  /** iletinin altındaki "Geri al" / "Dolu alanları da değiştir" (ya da yazılan komut): bir kez çalışır; sonucu geçmişe */
  const eylemCalistir = async (id: string | null, ne: "geri" | "ustune", soru: string) => {
    const e = id ? islemler.get(id) : undefined;
    let sayi = 0, yeni: IslemEylemi | undefined, kalan: IslemEylemi | null = null;
    if (e && ne === "geri" && e.geriAl) { sayi = e.geriAl(); kalan = {}; }
    if (e && ne === "ustune" && e.ustune) { const r = e.ustune(); sayi = r.sayi; yeni = r.sayi ? { geriAl: r.geriAl } : undefined; kalan = { geriAl: e.geriAl }; }
    if (id && kalan) { const k = kalan; setIslemler((x) => new Map(x).set(id, k)); }
    await islemKaydet({ istek: ne, soru, sayi }, yeni);
  };
  const eylemYap = (m: SohbetIletisi, ne: "geri" | "ustune") => {
    if (bekliyor) return;
    setBekliyor(true);
    eylemCalistir(m.id, ne, ne === "geri" ? "Geri al" : "Dolu alanları da değiştir")
      .catch(() => setHata("S.A.Y'a ulaşılamadı; bağlantıyı kontrol edip yeniden deneyin."))
      .finally(() => { setBekliyor(false); girdi.current?.focus(); });
  };
  /** K5: S.A.Y'a eklenen fotoğraflar rapora (seçilen bölüme) konur, sonra okunup girilir */
  const fotoKoyVeOku = async (fotolar: readonly File[], bolum: string, soru: string) => {
    if (!rb) return;
    setBolumSor(null);
    alttaRef.current = true; setAltta(true);
    setBekliyor(true); setHata(null); setAsama("Okuyor");
    const eklenen: { dosya: string; bolum: string }[] = [];
    try {
      for (const [i, f] of fotolar.entries()) {
        setIlerleme(`Fotoğraf ekleniyor · ${i + 1} / ${fotolar.length}`);
        const r = await rb.fotoEkle(f, bolum);
        if ("neden" in r) { setHata(r.neden); break; }
        eklenen.push({ dosya: r.dosya, bolum });
      }
    } catch { setHata("Fotoğraf eklenemedi; bağlantıyı kontrol edip yeniden deneyin."); }
    setIlerleme(null); setBekliyor(false); setAsama(null);
    for (const x of ekler) if (x.url) URL.revokeObjectURL(x.url);
    setEkler([]); setSoru("");
    if (eklenen.length) await islemYap("oku", soru || "Fotoğrafı oku ve gir", eklenen);
  };
  /** yazı kutusu yazdıkça büyür (en çok ~8 satır; CSS max-height) */
  const boyla = (e: HTMLTextAreaElement) => { e.style.height = "auto"; e.style.height = `${e.scrollHeight + 2}px`; };
  /** Enter gönderir, Shift+Enter yeni satır (yazı birleştirilirken — ör. Türkçe klavye önerisi — Enter gönderilmez) */
  const tusla = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  };
  /* 522: ek ekle — tür ve boy cihazda ön denetim (sunucu yeniden denetler); fotoğraf küçültülür */
  const ekSec = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    setMenu(false);
    requestAnimationFrame(() => girdi.current?.focus());
    if (!f) return;
    const tur = ekTuru(f);
    const dosya = tur === "foto" ? await fotografiKucult(f) : f;
    let url: string | null = null;
    if (tur === "foto") { try { url = URL.createObjectURL(dosya); } catch { url = null; } }
    setEkler((l) => [...l, { id: ++ekSira.current, dosya, ad: f.name, boyut: dosya.size, tur, url }]);
    bildir(`${f.name} eklendi; sorunuzla birlikte gider.`);
  };
  const ekCikar = (i: number) => {
    const e = ekler[i];
    if (!e) return;
    if (e.url) URL.revokeObjectURL(e.url);
    setEkler((l) => l.filter((x) => x.id !== e.id));
    bildir(`${e.ad} çıkarıldı.`);
    girdi.current?.focus();
  };
  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    const v = soru.trim();
    if (!v && !ekler.length) { girdi.current?.focus(); return; }
    if (bekliyor) return;
    /* 542: rapordayken kısa komut ekranda yapılır (yapay zekâya gitmez); "evet" yalnız bekleyen "Değiştireyim mi?" varsa */
    if (rb) {
      const istek = v ? istekTani(v) : null;
      const fotolar = ekler.filter((x) => x.tur === "foto").map((x) => x.dosya);
      if (fotolar.length && fotolar.length === ekler.length && (!v || istek === "oku")) {
        const l = rb.fotoBolumleri();
        if (l.length === 1) { await fotoKoyVeOku(fotolar, l[0].id, v); return; }
        if (l.length > 1) { setBolumSor({ fotolar, soru: v }); return; }
      }
      /* "evet / üstüne yaz" yalnız bekleyen "Değiştireyim mi?" varsa ekranda — yoksa Haiku'ya gider */
      if (istek && !ekler.length && !(istek === "ustune" && !sonEylem("ustune"))) {
        setSoru("");
        await islemYap(istek, v);
        girdi.current?.focus();
        return;
      }
    }
    /* 557: mesaj HEMEN balon (kutu boşalır); sunucunun kaydettiği iletiyle yer değiştirir; gönderilemezse yazı kutuya geri döner (2026-10-16: yalnız
       sorunun kendisi gönderilemediyse — iş başladıysa geri konmaz, yeniden gönderilince iş iki kez yapılmasın) */
    const gid = `gecici-${++geciciSira.current}`, giden = ekler;
    let gitti = false;
    setIletiler((l) => [...(l ?? []), { id: gid, kim: "ben", metin: v || (giden.length === 1 ? "Eki inceler misin?" : "Ekleri inceler misin?"), yer: l?.at(-1)?.yer ?? "",
      ek: giden.length ? { ekler: giden.map((x) => ({ ad: x.ad, boyut: x.boyut, tur: x.tur })) } : null, zaman: new Date().toISOString() }]);
    setSoru(""); setEkler([]);
    alttaRef.current = true; setAltta(true);
    setBekliyor(true); setAsama(giden.length ? "Ekler yükleniyor" : "Düşünüyor"); setMenu(false); setHata(null);
    try {
      /* 2026-10-23: ekler önce yüklenir (parça parça, konuşmada kalır); biri yüklenemezse soru gitmez, yazı ve ekler geri döner */
      const idler: string[] = [];
      for (const x of giden) {
        const y = await ekYukle(x, (m) => setIlerleme(m));
        if ("durum" in y) { setIlerleme(null); setHata(y.neden); setIletiler((l) => (l ?? []).filter((m) => m.id !== gid)); setSoru(v); setEkler(giden); return; }
        idler.push(y.id);
      }
      setIlerleme(null); setAsama("Düşünüyor");
      gitti = true;
      for (const x of giden) if (x.url) URL.revokeObjectURL(x.url);
      await isYap({ tur: "soru", soru: v, ekler: idler, ...ekranGirdisi() });
    } catch {
      if (!gitti) { setIletiler((l) => (l ?? []).filter((x) => x.id !== gid)); setSoru(v); setEkler(giden); }
      setHata("S.A.Y'a ulaşılamadı; bağlantıyı kontrol edip yeniden deneyin.");
    } finally { setBekliyor(false); setAsama(null); setIlerleme(null); setCanli(""); setDusunce(""); girdi.current?.focus(); }
  };
  /* 557: küçült — panel alta tek satır; yeniden basınca aynı boyla açılır (sohbet ve yazılan kaybolmaz) */
  const kucult = (k: boolean) => {
    setKucuk(k);
    try { localStorage.setItem(KUCUK_ANAHTARI, k ? "1" : "0"); } catch { /* saklama yok */ }
    if (!k) requestAnimationFrame(() => (girdi.current && !girdi.current.disabled ? girdi.current : document.getElementById("say-kucult"))?.focus());
  };
  const kaydirildi = () => {
    const g = govde.current;
    if (!g) return;
    const a = g.scrollHeight - g.scrollTop - g.clientHeight < 32;
    alttaRef.current = a;
    if (a !== altta) setAltta(a);
  };
  const enAlta = () => {
    const g = govde.current;
    if (g) g.scrollTop = g.scrollHeight;
    alttaRef.current = true; setAltta(true);
    girdi.current?.focus();
  };
  const temizle = async () => {
    if (!(await onayla({ baslik: "Sohbeti temizle", metin: "S.A.Y ile bütün sohbet geçmişiniz silinir.", tus: "Temizle", tehlike: true }))) return;
    const y = await sayTemizleEylemi();
    if (y.durum === "tamam") { setIletiler([]); setHata(null); bildir("Sohbet temizlendi."); document.getElementById("say-kapat")?.focus(); }
    else setHata(y.neden);
  };
  /* eksiğe git: telefonda panel kapanır (alan görünsün); rapor ekranı bölümleri açar, alana kaydırır ve odaklar */
  const git = (e: SohbetEksik) => {
    if (window.matchMedia(DAR).matches) { setAcik(false); try { localStorage.setItem(ACIK_ANAHTARI, "0"); } catch { /* saklama yok */ } }
    rb?.git(e);
  };
  const oneriSonucu = (m: SohbetIletisi, d: "uygulandi" | "vazgecildi") => {
    setIletiler((l) => (l ?? []).map((x) => (x.id === m.id && x.ek?.oneri ? { ...x, ek: { ...x.ek, oneri: { ...x.ek.oneri, durum: d } } } : x)));
    void sayOneriEylemi(m.id, d);
    requestAnimationFrame(() => document.getElementById(`say-o-${m.id}`)?.focus());
  };
  const uygula = (m: SohbetIletisi) => {
    const o = m.ek?.oneri;
    if (!o || o.durum || !rb || rb.id !== m.ek?.rapor) return;
    rb.sonucUygula(o.deger);
    oneriSonucu(m, "uygulandi");
    bildir(`Öneri rapora uygulandı: ${o.ad}. Kaydetmeyi unutmayın.`);
  };
  const vazgec = (m: SohbetIletisi) => { if (m.ek?.oneri && !m.ek.oneri.durum) oneriSonucu(m, "vazgecildi"); };

  return (
    <>
      {!acik && (
        <button ref={fab} className={stil.fab} type="button" data-say-fab="" onClick={() => ac()} aria-haspopup="dialog" aria-controls="say-panel" aria-expanded={false}
          aria-label="S.A.Y — saha asistanı">
          <span className={stil.fabIkon}><Ikon ad="sparkles" /></span>
          <span className={stil.fabYazi}>S.A.Y<small>Asistan</small></span>
        </button>
      )}
      {acik && (
        <aside ref={panel} className={stil.panel} id="say-panel" role="dialog" aria-labelledby="say-baslik" data-kucuk={kucuk || undefined}
          data-boy={!kucuk && boy !== null ? "" : undefined} style={!kucuk && boy !== null ? { height: `${boy}px` } : undefined}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            e.stopPropagation();
            if (menu) { setMenu(false); atac.current?.focus(); } else kapat();
          }}>
          {!kucuk && boyu.tutamak("S.A.Y'ın", stil.tutamak)}
          <div className={kucuk ? stil.bas : `${stil.bas} ${boyu.basSinif}`} {...(kucuk ? {} : boyu.bas)}>
            <span className={stil.avatar}><Ikon ad="sparkles" /></span>
            <div className={stil.kimlik}>
              <h2 id="say-baslik">S.A.Y</h2>
              <p className={stil.altYazi}>Claude Haiku 5.5</p>
            </div>
            {!!iletiler?.length && (
              <button className={stil.basTus} type="button" onClick={() => void temizle()} aria-label="Sohbeti temizle" title="Sohbeti temizle"><Ikon ad="trash-2" /></button>
            )}
            <button className={stil.basTus} id="say-kucult" type="button" onClick={() => kucult(!kucuk)} aria-expanded={!kucuk} aria-controls="say-govde"
              aria-label={kucuk ? "Büyüt" : "Küçült"} title={kucuk ? "Büyüt" : "Küçült"}><Ikon ad={kucuk ? "chevron-up" : "chevron-down"} /></button>
            <button className={stil.basTus} id="say-kapat" type="button" onClick={kapat} aria-label="S.A.Y'ı kapat"><Ikon ad="x" /></button>
          </div>
          <div className={stil.govde} ref={govde} id="say-govde" onScroll={kaydirildi} hidden={kucuk}>
            {!bagli && <Serit tur="uyari" ikon="wifi-off">Bağlantı yok.{raporda ? " Raporu yazmaya devam edebilirsiniz." : ""}</Serit>}
            {bagli && !durum.anahtar && <Serit tur="uyari" ikon="key-round">API anahtarı girilmedi (Firma ayarları › Yapay zekâ): S.A.Y cevap veremez.</Serit>}
            {hazir && durum.sinirDoldu && <Serit tur="uyari" ikon="triangle-alert">Bu ay kişi başı sınırınız doldu; yönetici Firma ayarları&apos;ndan artırabilir.</Serit>}
            <ol className={stil.liste} aria-live="polite" aria-busy={bekliyor || !iletiler || undefined}>
              {(iletiler ?? []).map((m, i, l) => (
                <IletiYeri key={m.id} m={m} onceki={l[i - 1]} rb={rb} git={git} uygula={uygula} vazgec={vazgec}
                  eylem={(rb && m.ek?.rapor === rb.id) || (fb && m.ek?.format === fb.id) ? islemler.get(m.id) : undefined} eylemYap={eylemYap} />
              ))}
            </ol>
            {bolumSor && rb && (
              <div className={`${stil.mesaj} ${stil.o}`} role="group" aria-label="Fotoğraf hangi bölüme">
                <p>Fotoğraf hangi bölüme?</p>
                <div className={stil.oneriTuslar}>
                  {rb.fotoBolumleri().map((b) => (
                    <button key={b.id} className={stil.kucukTus} type="button" onClick={() => void fotoKoyVeOku(bolumSor.fotolar, b.id, bolumSor.soru)}>{b.ad}</button>
                  ))}
                  <button className={stil.kucukTus} type="button" onClick={() => setBolumSor(null)}>Vazgeç</button>
                </div>
              </div>
            )}
            {/* 557: bekleme balonu — hareket eden üç nokta + "Düşünüyor"; iş sırasında dönen işaret + "Rapora yazıyor" */}
            {bekliyor && (
              <div className={`${stil.mesaj} ${stil.o} ${stil.bekleme}`} role="status" aria-live="polite" data-say-bekleme="">
                {asama === "Düşünüyor" || !asama ? <span className={stil.noktalar} aria-hidden="true"><i /><i /><i /></span> : <span className={stil.donen} aria-hidden="true" />}
                {asama ?? "Düşünüyor"}{ilerleme ? ` · ${ilerleme}` : ""}
                {/* 2026-10-23: düşünme özeti ve yazılmakta olan cevap akışla */}
                {dusunce && !canli && <p className={stil.dusunce}>{dusunce.slice(-600)}</p>}
                {canli && <div className={stil.canli}><Markdown metin={canli} /></div>}
              </div>
            )}
            {hata && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
            {!altta && (
              <button className={stil.enAlta} type="button" onClick={enAlta} aria-label="En alta in" title="En alta in"><Ikon ad="arrow-down" /></button>
            )}
          </div>
          <div className={stil.alt} hidden={kucuk} data-panel-alt="">
            {raporda && (
              <div className={stil.hizli}>
                <button className={stil.cip} type="button" disabled={!hazir || bekliyor} onClick={() => void islemYap("oku", OKU)}>{OKU}</button>
              </div>
            )}
            {!!ekler.length && <EkListesi ekler={ekler} cikar={ekCikar} />}
            <form className={stil.yaz} onSubmit={(e) => void gonder(e)}>
              <div className={stil.ek} data-say-ek="">
                <button ref={atac} className={stil.gonder} type="button" onClick={() => setMenu((m) => !m)} disabled={!hazir || bekliyor}
                  aria-haspopup="true" aria-expanded={menu} aria-controls="say-ek-menu" aria-label="Ek ekle: fotoğraf ya da belge" title="Ek ekle">
                  <Ikon ad="paperclip" />
                </button>
                <div className={stil.ekMenu} id="say-ek-menu" hidden={!menu || !hazir}>
                  <label className={stil.ekOge}><input className={stil.gizli} type="file" accept="image/*" capture="environment" onChange={(e) => void ekSec(e)} />
                    <Ikon ad="camera" kucuk />Fotoğraf çek</label>
                  <label className={stil.ekOge}><input className={stil.gizli} type="file" accept="image/*" onChange={(e) => void ekSec(e)} />
                    <Ikon ad="image" kucuk />Galeriden seç</label>
                  <label className={stil.ekOge}><input className={stil.gizli} type="file" onChange={(e) => void ekSec(e)} />
                    <Ikon ad="file-text" kucuk />Belge ekle<small>PDF, Word, Excel, metin</small></label>
                </div>
              </div>
              <label className={stil.gizli} htmlFor="say-girdi">S.A.Y&apos;a sor</label>
              <textarea ref={girdi} className={stil.girdi} id="say-girdi" autoComplete="off" rows={1}
                placeholder="S.A.Y'a yazın" value={soru} disabled={!hazir}
                onChange={(e) => { setSoru(e.target.value); boyla(e.target); }} onKeyDown={tusla} />
              <button className={stil.gonder} type="submit" aria-label="Gönder" disabled={!hazir || bekliyor}><Ikon ad="send" /></button>
            </form>
          </div>
        </aside>
      )}
    </>
  );
}

/** yer değişince ayraç ("Planlar", "Rapor DM-…" …) */
function IletiYeri({ m, onceki, ...p }: {
  m: SohbetIletisi; onceki?: SohbetIletisi; rb: SayRaporBagi | null; git: (e: SohbetEksik) => void; uygula: (m: SohbetIletisi) => void; vazgec: (m: SohbetIletisi) => void;
  eylem?: IslemEylemi; eylemYap: (m: SohbetIletisi, ne: "geri" | "ustune") => void;
}) {
  return <>{(!onceki || onceki.yer !== m.yer) && !!m.yer && <li className={stil.yer}>{m.yer}</li>}<Ileti m={m} {...p} /></>;
}
