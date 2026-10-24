/* BASILI FORMDAN ŞABLON — yapay zekânın okuduğu formun format tanımına çevrilmesi, saf (2026-10-23; reisim: "ben bunu yükleyince format buna
   dönüşsün format düzenleyicide bundan düzenleme yapabileyim istiyorum"). İstek ve cevabın çözümü src/server/yz/basili.ts.
   2026-10-24 (format kurucu serbest düzen — reisim: "hangi firmanın hangi PDF formunu yüklersem yükleyeyim şablon o forma dönüşsün ve format
   kurucuda istediğim gibi düzenleyebileyim"; maket docs/maket/format-serbest.html onaylı): form SERBEST DÜZENE kurulur (gorunum.serbest — sabit
   başlık / firma / ekipman bölümü yok): her tablo bir serbest tablo bölümü (src/format/tablo.ts), satırlar HTML tablosu gibi (hücre o satırda
   başlar, yukarıdan birleşik gelen yer atlanır), hücrenin türü / kaynağı / görünümü formdan; yan yana tablolar aynı satırda. Her parça ŞEMADAN
   geçer; geçmeyen bölüm atılır (adı söylenir). Raporun yürümesi için gerekenler formda yoksa sona eklenir, kurucuda düzenlenir: raporun sonucu
   (sonuç hücresi), muayene uzmanının imza yeri, fotoğraflar. Kimlikler kurucunun ("k_"). */
import { bosFormat } from "../../format/sablonlar.ts";
import { onar } from "../../format/tablo.ts";
import {
  Bolum, FormatTanimi, HUCRE_ALAN_TURLERI, HUCRE_TURLERI, TABLO_KAYNAKLARI, YAZI_TIPLERI, type Hucre, type HucreStili, type TabloSatiri,
} from "../../format/tanim.ts";
import { yeniKimlik } from "./kurucu.ts";

export interface BasiliCeviri {
  tanim: FormatTanimi;
  /** yapay zekânın kullanıcıya notu */
  cevap: string;
  /** şemaya uymadığı için atılan bölümlerin adları */
  atilan: string[];
}

type Ham = Record<string, unknown>;
const nesne = (x: unknown): Ham => (x && typeof x === "object" && !Array.isArray(x) ? (x as Ham) : {});
const dizi = (x: unknown, n: number): unknown[] => (Array.isArray(x) ? x.slice(0, n) : []);
const yazi = (x: unknown, n: number) => (typeof x === "string" ? x.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n) : "");
/** satır sonlarını koruyan yazı (hücre metni) */
const uzunYazi = (x: unknown, n: number) => (typeof x === "string" ? x.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").trim().slice(0, n) : "");
const evet = (x: unknown) => x === true;
const bir = <T extends string>(l: readonly T[], x: unknown): T | undefined => l.find((y) => y === x);
const tamSayi = (x: unknown, en: number, enCok: number, d: number) => (typeof x === "number" && Number.isFinite(x) ? Math.max(en, Math.min(enCok, Math.round(x))) : d);
const RENK = /^#[0-9a-fA-F]{6}$/;
const CEVAPLAR = ["U", "UD", "X"];
const SATIR_EN_COK = 200, SUTUN_EN_COK = 40;

/** ham hücrenin görünümü (boş görünüm: undefined) */
function stil(h: Ham, belgeBoy: number): HucreStili | undefined {
  const s: HucreStili = {};
  if (evet(h.kalin)) s.k = true;
  if (evet(h.egik)) s.i = true;
  if (h.hiza === "orta") s.a = "o"; else if (h.hiza === "sag") s.a = "g";
  if (typeof h.zemin === "string" && RENK.test(h.zemin) && h.zemin.toUpperCase() !== "#FFFFFF") s.z = h.zemin.toUpperCase();
  if (typeof h.boy === "number" && h.boy >= 5 && h.boy <= 40 && Math.abs(h.boy - belgeBoy) >= 0.5) s.b = Math.round(h.boy * 2) / 2;
  return Object.keys(s).length ? s : undefined;
}

/** ham (src/server/yz/basili.ts BASILI_SEMASI) → format tanımı; tanım şemadan geçmezse null */
export function basilidanTanim(ham: Ham, turAd: string): BasiliCeviri | null {
  const baslik = yazi(ham.baslik, 200) || `${turAd} Periyodik Kontrol Raporu`;
  const iskelet = bosFormat(baslik);
  const hy = nesne(ham.yazi);
  const tip = bir(YAZI_TIPLERI, hy.tip);
  const boy = typeof hy.boy === "number" && hy.boy >= 6 && hy.boy <= 16 ? Math.round(hy.boy * 2) / 2 : 9;
  /* kimlikler o ana kadar kurulanlara göre tekil (yeniKimlik çalışan tanıma bakar; ek: bu çeviride verilenler) */
  const ek = new Set<string>();
  const bolumler: Bolum[] = [];
  const calisan = (): FormatTanimi => ({ ...iskelet, bolumler });
  const yeni = (onek: "b" | "c" | "r") => { const x = yeniKimlik(calisan(), onek, ek); ek.add(x); return x; };
  const atilan: string[] = [];

  for (const [n, x] of dizi(ham.bolumler, 40).map(nesne).entries()) {
    const ad = yazi(x.ad, 200) || `Bölüm ${n + 1}`;
    const yan = bolumler.length > 0 && evet(x.yan);
    const oran = typeof x.oran === "number" && x.oran >= 5 && x.oran <= 100 ? Math.round(x.oran) : undefined;
    const yer = { ...(yan ? { yan: true } : {}), ...(yan && oran ? { oran } : {}) };
    if (x.tur === "cihaz" || x.tur === "foto" || x.tur === "kusur") {
      if (x.tur === "cihaz" && bolumler.some((y) => y.blok === "cihaz")) continue;
      const govde = x.tur === "foto" ? { enAz: 1, enCok: 20 } : {};
      const b = Bolum.safeParse({ id: x.tur === "cihaz" ? "cihaz" : yeni("b"), ad, blok: x.tur, kilit: false, ...govde, ...yer });
      if (b.success) bolumler.push(b.data); else atilan.push(ad);
      continue;
    }
    /* serbest tablo: sütun oranları, satırlar soldan sağa yerleşir; taşan hücre sığdırılır, boş kalan yer boş yazı hücresi */
    const sutun = dizi(x.sutunlar, SUTUN_EN_COK).map((w) => (typeof w === "number" && w > 0 ? Math.min(100, Math.max(1, w)) : 0)).filter((w) => w > 0);
    const C = sutun.length || 1;
    const hamSatirlar = dizi(x.satirlar, SATIR_EN_COK).map(nesne);
    if (!hamSatirlar.length) { atilan.push(ad); continue; }
    const R = hamSatirlar.length;
    const dolu = new Set<string>(), hucreler: Hucre[] = [], satirlar: TabloSatiri[] = [];
    const cevaplar = [...new Set(dizi(x.cevaplar, 6).map((c) => yazi(c, 40)).filter(Boolean))];
    hamSatirlar.forEach((hs, r) => {
      const tekrar = evet(hs.tekrar);
      const y = typeof hs.yukseklik === "number" && hs.yukseklik > 0 ? Math.min(250, Math.round(hs.yukseklik)) : 0;
      satirlar.push({ ...(y ? { y } : {}), ...(tekrar ? { tekrar: true, id: yeni("r") } : {}) });
      let c = 0;
      for (const h of dizi(hs.hucreler, SUTUN_EN_COK).map(nesne)) {
        while (c < C && dolu.has(`${r},${c}`)) c++;
        if (c >= C) break;
        let cs = tamSayi(h.sutunBirlesim, 1, C - c, 1);
        /* tekrar satırında birleşme yalnız yana (çoğalan satır tek satır) */
        let rs = tekrar ? 1 : tamSayi(h.satirBirlesim, 1, R - r, 1);
        /* sağa doğru dolu yere çarpan birleşme kısalır; aşağı doğru da */
        for (let e = 1; e < cs; e++) if (dolu.has(`${r},${c + e}`)) { cs = e; break; }
        for (let a = 1; a < rs; a++) if (hamSatirlar[r + a] && evet(hamSatirlar[r + a].tekrar)) { rs = a; break; }
        for (let a = 0; a < rs; a++) for (let e = 0; e < cs; e++) dolu.add(`${r + a},${c + e}`);
        const tur = bir(HUCRE_TURLERI, h.tur) ?? "yazi";
        const st = stil(h, boy), metin = uzunYazi(h.metin, 2000);
        const ortak = { r, c, ...(rs > 1 ? { rs } : {}), ...(cs > 1 ? { cs } : {}), ...(st ? { s: st } : {}) };
        const secenekler = dizi(h.secenekler, 40).map((o) => yazi(o, 200)).filter(Boolean);
        let hucre: Hucre;
        switch (tur) {
          case "alan": {
            const alan = bir(HUCRE_ALAN_TURLERI, h.alan) ?? "metin";
            const secimli = alan === "secim" && secenekler.length > 0;
            hucre = { ...ortak, tur, id: yeni("c"), alan: alan === "secim" && !secimli ? "metin" : alan, ...(yazi(metin, 200) ? { ad: yazi(metin, 200) } : {}),
              ...(secimli ? { secenekler } : {}), ...(yazi(h.birim, 40) ? { birim: yazi(h.birim, 40) } : {}), ...(yazi(h.formul, 2000) ? { formul: yazi(h.formul, 2000) } : {}) };
            break;
          }
          case "kayit": {
            const kaynak = bir(TABLO_KAYNAKLARI, h.kaynak);
            hucre = kaynak ? { ...ortak, tur, kaynak } : { ...ortak, tur: "alan", id: yeni("c"), alan: "metin", ...(yazi(metin, 200) ? { ad: yazi(metin, 200) } : {}) };
            break;
          }
          case "cevap": hucre = { ...ortak, tur, id: yeni("c") }; break;
          case "sira": hucre = { ...ortak, tur }; break;
          case "imza": {
            const kim = bir(["uzman", "teknik", "uzman2", "tesis"] as const, h.kim) ?? "uzman";
            hucre = { ...ortak, tur, kim, ...(kim === "uzman" || kim === "teknik" ? { eimza: true } : {}) };
            break;
          }
          case "gorsel": hucre = { ...ortak, tur, gorsel: h.gorsel === "akr" ? "akr" : "logo" }; break;
          case "foto": hucre = { ...ortak, tur, id: yeni("c"), ad: yazi(metin, 200) || "Fotoğraf" }; break;
          case "sonuc": hucre = { ...ortak, tur, secenekler: secenekler.length >= 2 ? secenekler.slice(0, 3) : ["UYGUNDUR", "UYGUN DEĞİLDİR"] }; break;
          default: hucre = { ...ortak, tur: "yazi", m: metin };
        }
        hucreler.push(hucre);
        c += cs;
      }
    });
    const tablo = onar({ id: yeni("b"), ad, blok: "tablo", kilit: false, sutun: sutun.length ? sutun : [100], satirlar, hucreler,
      cevaplar: cevaplar.length >= 2 ? cevaplar : CEVAPLAR, ...yer });
    const b = Bolum.safeParse(tablo);
    if (b.success) bolumler.push(b.data); else atilan.push(ad);
  }

  /* raporun yürümesi için gerekenler formda yoksa sona: sonuç (sonuç hücresi), muayene uzmanının imza yeri, fotoğraflar */
  const hucreVar = (f: (h: Hucre) => boolean) => bolumler.some((b) => b.blok === "tablo" && b.hucreler.some(f));
  const ekTablo = (ad: string, l: Omit<Hucre, "r" | "c">[]) => {
    const t = Bolum.parse({ id: yeni("b"), ad, blok: "tablo", kilit: false, sutun: l.map(() => 100 / l.length), satirlar: [{}],
      hucreler: l.map((h, c) => ({ ...h, r: 0, c })) });
    bolumler.push(t);
  };
  if (!hucreVar((h) => h.tur === "sonuc")) ekTablo("Sonuç", [{ tur: "yazi", m: "SONUÇ", s: { k: true } }, { tur: "sonuc", secenekler: ["UYGUNDUR", "UYGUN DEĞİLDİR"], s: { k: true } }]);
  if (!hucreVar((h) => h.tur === "imza" && h.kim === "uzman")) {
    ekTablo("Muayene uzmanı", [{ tur: "yazi", m: "Muayene uzmanı", s: { k: true } }, { tur: "kayit", kaynak: "uzman_ad" }, { tur: "imza", kim: "uzman", eimza: true }]);
  }
  if (!bolumler.some((b) => b.blok === "foto") && !hucreVar((h) => h.tur === "foto")) bolumler.push({ id: yeni("b"), ad: "Fotoğraflar", blok: "foto", kilit: false, enAz: 1, enCok: 20 });

  const gorunum = {
    ...iskelet.gorunum, formKodu: yazi(ham.formKodu, 20), baslik, serbest: true,
    yazi: { ...(tip && tip !== "carlito" ? { tip } : {}), ...(boy !== 9 ? { boy } : {}) },
    ...(yazi(ham.altYazi, 300) ? { altYazi: yazi(ham.altYazi, 300) } : {}),
  };
  if (!Object.keys(gorunum.yazi).length) delete (gorunum as { yazi?: unknown }).yazi;
  const t = FormatTanimi.safeParse({ ...iskelet, bolumler, gorunum });
  if (!t.success) return null;
  return { tanim: t.data, cevap: yazi(ham.cevap, 1000), atilan };
}
