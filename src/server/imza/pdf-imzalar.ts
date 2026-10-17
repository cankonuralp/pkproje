/* PDF İMZA ÇÖZÜMLEYİCİSİ (IMZA-SERVISI.md ES1, 2026-10-17; reisim: "eğer bu belgede varsa bizde koyucaz" — incelenen gerçek imzalı belgenin
   beş katmanı). Saf; saldırganın denetlediği PDF (her yol sınırlı: imza, sertifika, DSS öğesi, anahtar işlemi sayısı). Her imza ve belge zaman
   damgası için:
   · kapsam (/ByteRange): [0 a b c], a < b, aradaki boşluk tam olarak /Contents'in onaltılık dizesi, son ≤ dosya;
   · bütünlük: kapsanan baytların özeti = imzalı özniteliklerdeki messageDigest;
   · imza değeri: imzalayanın sertifikasındaki anahtarla; imzalayan sertifikası imzalı signingCertificate özetiyle seçilir ve BAĞLI olmalı;
     zinciri, 5070 nitelikli işareti, imza anında geçerli mi;
   · imza zaman damgası (imza değerinin damgası) ve belge zaman damgası (ETSI.RFC3161 — kapsanan baytların damgası): iz, damganın imzası,
     damga sunucusunun sertifikası (cms.ts);
   · uzun süreli doğrulama sözlüğü: YALNIZ son kataloğun /DSS'i (çapraz başvurudan — yorum ya da dize sayılmaz), içindeki OCSP / iptal listesi
     akışları; imzalayanın iptal durumu DSS'teki kanıttan (iptal.ts — kanıtın imzası ve bu sertifikaya ait olduğu doğrulanır);
   · imzanın kapsamından SONRA belgede ne var (sonrakiEkler): yalnız imza / damga / DSS / imza alanının doldurulması / belge bilgisi "izinli";
     sayfa, içerik, kaynak … değişmişse "değişiklik" (Adobe'nin imza sonrası değişiklik denetiminin karşılığı);
   · düzey: B-B · B-T · B-LT · B-LTA (ETSI EN 319 142).
   Güvenilir kök listesi burada YOK (kök listesi kararı ertelendi — resmî kaynaktan teyitle eklenecek): zincirin kökü yalnız adlandırılır;
   uydurma ama "nitelikli" işaretli bir zinciri bu çözümleyici tek başına ayırt edemez. 2026-10-17 bağımsız incelemenin bulguları (DSS'in metin
   taramasıyla ve aşırı geri izlemeyle okunması, imza sonrası değişikliğin görünmemesi, kaçan TypeError, sertifika değiştirme) kapatıldı. */
import { dugum, okuyucu, BozukDer } from "./der.ts";
import { damgaDenetle, imzaciSertifikasi, imzaDenetle, imzaliVeriOku, imzaSertifikasiTutar, ozetAdi, ozetDenetle, CMS_OID, type Sonuc } from "./cms.ts";
import { crlDenetle, ocspCevabi, type IptalDurumu } from "./iptal.ts";
import { anahtarlar, basvuru, degerOku, nesneOkuyucu, sonDurum, PdfHatasi, type NesneOkuyucu } from "./pdf-ek.ts";
import { gecerliMi, sertifikaOku, vereniBul, yeniButce, zincirKur, type Sertifika, type SertifikaBilgisi } from "./sertifika.ts";

export const PDF_SINIR = 64 * 1024 * 1024;
const IMZA_SINIR = 32, ICERIK_SINIR = 2 * 1024 * 1024, PENCERE = 64 * 1024;

export type Duzey = "yok" | "B-B" | "B-T" | "B-LT" | "B-LTA";

export interface DamgaBilgisi {
  zaman: string | null;
  tsa: string | null;
  politika: string | null;
  /** damganın kapsadığı veriyle iz aynı mı */
  iz: Sonuc;
  /** damganın kendi imzası + içerik özeti */
  imza: Sonuc;
}

export interface ImzaBilgisi {
  tur: "imza" | "belge_damgasi";
  altFiltre: string | null;
  /** imzanın dışında kalan boşluğun (/Contents) başı — öncesindeki her bayt imzalı */
  boslukBas: number;
  /** kapsanan son bayt (ByteRange b + c) ve dosyanın tamamını kapsıyor mu */
  kapsamSon: number;
  tamami: boolean;
  /** kapsanan baytların özeti messageDigest'le aynı mı (belge damgasında: damga izi) */
  butunluk: Sonuc;
  /** imza değeri (belge damgasında: damganın kendi imzası) */
  imzaDegeri: Sonuc;
  ozet: string | null;
  imzalayan: SertifikaBilgisi | null;
  /** imzalayandan köke sertifika adları */
  zincir: string[];
  /** signingCertificateV2 imzalayanın sertifikasını gösteriyor mu (yoksa null) */
  sertifikaBagi: boolean | null;
  /** imza anında (damga zamanı, yoksa imza sözlüğünün /M'si) sertifika geçerli miydi */
  anindaGecerli: boolean | null;
  /** imza sözlüğündeki zaman (/M — imzalayanın bilgisayar saati; güvenilmez) */
  sozlukZamani: string | null;
  damga: DamgaBilgisi | null;
  /** imzalayanın iptal durumu: belgedeki DSS'te bu sertifika için doğrulanmış OCSP cevabı ya da iptal listesi; kanıt yoksa null */
  iptal: IptalDurumu | null;
  /** imzanın kapsamından sonra belgede ne var */
  sonrakiEkler: SonrakiEkler;
}

/** yok: imza dosyanın sonuna kadar · izinli: yalnız imza, damga, DSS, imza alanının doldurulması, belge bilgisi · degisiklik: imzalı bölümdeki
    nesne (sayfa, içerik, kaynak …) sonradan değişmiş ya da silinmiş — nesne numaralarıyla · okunamadi: çapraz başvuru çözülemedi */
export interface SonrakiEkler { durum: "yok" | "izinli" | "degisiklik" | "okunamadi"; nesneler: number[] }

export interface ImzaCozumu {
  imzalar: ImzaBilgisi[];
  /** son kataloğun DSS'i: okunabilen OCSP cevabı, iptal listesi ve sertifika akışı sayısı; konum: DSS nesnesinin (satır içiyse kataloğun) yeri */
  dss: { var: boolean; ocsp: number; crl: number; sertifika: number; konum: number | null };
  duzey: Duzey;
  /** sonuncusu dosyanın tamamını kapsıyor mu (sonrasında eklenmiş imzasız bölüm yok) */
  sonuTamami: boolean;
  /** hiçbir imzadan sonra izinsiz değişiklik yok (her imzanın sonrakiEkler'i "yok" ya da "izinli") */
  degisiklikYok: boolean;
}

const TAM = /\/ByteRange[\x00\t\n\f\r ]{0,20}\[[\x00\t\n\f\r ]{0,20}(\d{1,10})[\x00\t\n\f\r ]{1,20}(\d{1,10})[\x00\t\n\f\r ]{1,20}(\d{1,10})[\x00\t\n\f\r ]{1,20}(\d{1,10})[\x00\t\n\f\r ]{0,20}\]/g;
const NESNE = /(\d{1,10})[\x00\t\n\f\r ]{1,20}(\d{1,5})[\x00\t\n\f\r ]{1,20}obj\b/g;

/** "D:YYYYMMDDHHmmSS+HH'mm'" → ISO; okunamazsa null */
export function pdfZamani(s: string): string | null {
  const m = /^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(?:([+\-Z])(\d{2})?'?(\d{2})?'?)?/.exec(s);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2] ?? 1) - 1, Number(m[3] ?? 1), Number(m[4] ?? 0), Number(m[5] ?? 0), Number(m[6] ?? 0));
  const isaret = m[7] === "-" ? -1 : m[7] === "+" ? 1 : 0;
  const fark = isaret * (Number(m[8] ?? 0) * 60 + Number(m[9] ?? 0)) * 60_000;
  return Number.isNaN(t) ? null : new Date(t - fark).toISOString();
}

/** imza sözlüğünün metni (onaltılık /Contents çıkarılmış): ByteRange'ten geriye nesne başına, boşluktan sonra endobj'ye */
function sozlukMetni(s: string, eslesmeBas: number, eslesmeSon: number, a: number, b: number): string {
  const once = Math.min(eslesmeBas, a);
  const pencere = s.slice(Math.max(0, once - PENCERE), once);
  let bas = -1;
  NESNE.lastIndex = 0;
  for (let m = NESNE.exec(pencere); m; m = NESNE.exec(pencere)) bas = m.index;
  const basMutlak = bas < 0 ? Math.max(0, once - 2048) : Math.max(0, once - PENCERE) + bas;
  const sonra = Math.max(eslesmeSon, b);
  const bitis = s.indexOf("endobj", sonra);
  const sonMutlak = bitis < 0 || bitis - sonra > PENCERE ? Math.min(s.length, sonra + 2048) : bitis;
  /* basMutlak ≤ once ≤ a: sözlüğün /Contents'ten önceki ve sonraki parçası */
  return `${s.slice(basMutlak, a)} ${s.slice(b, sonMutlak)}`;
}

const ad = (sozluk: string, anahtar: string) => new RegExp(`/${anahtar}[\\x00\\t\\n\\f\\r ]{0,20}/([^\\x00\\t\\n\\f\\r ()<>\\[\\]{}/%]{1,64})`).exec(sozluk)?.[1] ?? null;

export interface ImzaYeri { a: number; b: number; c: number; sozluk: string }

/** PDF'teki imza ve belge damgası yerleri (/ByteRange + sözlük metni) — kapsadıkları bölüm sırasıyla; kapsamı kurala uymayan yer atlanır */
export function imzaYerleri(pdf: Uint8Array): ImzaYeri[] {
  if (pdf.length > PDF_SINIR || pdf.length < 16) return [];
  const s = Buffer.from(pdf.buffer, pdf.byteOffset, pdf.byteLength).toString("latin1");
  const gorulen = new Set<string>();
  const ham: ImzaYeri[] = [];
  TAM.lastIndex = 0;
  for (let m = TAM.exec(s); m && ham.length < IMZA_SINIR; m = TAM.exec(s)) {
    const [z, a, b, c] = [m[1], m[2], m[3], m[4]].map(Number);
    if (z !== 0 || !(a < b) || b + c > pdf.length || b - a < 4 || b - a > ICERIK_SINIR * 2 + 2) continue;
    if (s[a] !== "<" || s[b - 1] !== ">") continue;
    /* boşluk tam olarak imza sözlüğünün /Contents değeri — başka bir onaltılık dize (ör. sayfa içeriği) imzanın dışında bırakılamaz */
    if (!/\/Contents[\x00\t\n\f\r ]{0,20}$/.test(s.slice(Math.max(0, a - 40), a))) continue;
    const anahtar = `${a}:${b}:${c}`;
    if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar);
    ham.push({ a, b, c, sozluk: sozlukMetni(s, m.index, m.index + m[0].length, a, b) });
  }
  return ham.sort((x, y) => (x.b + x.c) - (y.b + y.c));
}

/** yerin /Contents'indeki DER (dolgusu yalnız sıfır olmalı — DER'den sonra veri gizlenemez); okunamazsa null */
export function imzaIcerigi(pdf: Uint8Array, y: ImzaYeri): Buffer | null {
  const hex = Buffer.from(pdf.buffer, pdf.byteOffset, pdf.byteLength).toString("latin1", y.a + 1, y.b - 1).replace(/[\x00\t\n\f\r ]/g, "");
  if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2) return null;
  const tum = Buffer.from(hex, "hex");
  let der: Buffer;
  try { der = tum.subarray(0, dugum(okuyucu(tum), 0).son); } catch (e) { if (e instanceof BozukDer || e instanceof RangeError) return null; throw e; }
  return tum.subarray(der.length).some((x) => x !== 0) ? null : der;
}

/** PDF'teki imzalar ve belge zaman damgaları — kapsadıkları bölüm sırasıyla */
export function pdfImzalariniCozumle(pdf: Uint8Array): ImzaCozumu {
  const bos: ImzaCozumu = { imzalar: [], dss: { var: false, ocsp: 0, crl: 0, sertifika: 0, konum: null }, duzey: "yok", sonuTamami: false, degisiklikYok: true };
  if (pdf.length > PDF_SINIR || pdf.length < 16) return bos;
  const yerler = imzaYerleri(pdf);
  const s = Buffer.from(pdf.buffer, pdf.byteOffset, pdf.byteLength).toString("latin1");
  const oku = nesneOkuyucu(s);
  const dss = dssOku(s, oku);
  const imzalar = yerler.map((h) => {
    const { bilgi, sert, havuz } = imzaCozumle(pdf, h);
    if (sert && bilgi.tur === "imza") bilgi.iptal = iptalBul(sert, [...havuz, ...dss.sertifikalar], dss);
    bilgi.sonrakiEkler = sonrakiEkler(s, bilgi.kapsamSon, oku);
    return bilgi;
  });
  const sonuTamami = imzalar.length > 0 && imzalar[imzalar.length - 1].tamami;
  const degisiklikYok = imzalar.every((i) => i.sonrakiEkler.durum === "yok" || i.sonrakiEkler.durum === "izinli");
  return { imzalar, dss: dss.ozet, duzey: duzeyBul(imzalar, dss.ozet), sonuTamami, degisiklikYok };
}

/* ── imza ── */
function imzaCozumle(pdf: Uint8Array, h: ImzaYeri): { bilgi: ImzaBilgisi; sert: Sertifika | null; havuz: Sertifika[] } {
  const altFiltre = ad(h.sozluk, "SubFilter"), tur = ad(h.sozluk, "Type");
  const zm = /\/M[\x00\t\n\f\r ]{0,20}\((D:[^)]{4,40})\)/.exec(h.sozluk)?.[1];
  const belgeDamgasi = tur === "DocTimeStamp" || altFiltre === "ETSI.RFC3161";
  const parcalar = [pdf.subarray(0, h.a), pdf.subarray(h.b, h.b + h.c)];
  const sonuc: ImzaBilgisi = {
    tur: belgeDamgasi ? "belge_damgasi" : "imza", altFiltre, boslukBas: h.a, kapsamSon: h.b + h.c, tamami: h.b + h.c === pdf.length,
    butunluk: "okunamadi", imzaDegeri: "okunamadi", ozet: null, imzalayan: null, zincir: [], sertifikaBagi: null, anindaGecerli: null,
    sozlukZamani: zm ? pdfZamani(zm) : null, damga: null, iptal: null, sonrakiEkler: { durum: "yok", nesneler: [] },
  };
  try {
    return imzaDoldur(sonuc, pdf, h, belgeDamgasi, parcalar);
  } catch (e) {
    /* saldırganın girdisi: beklenmeyen her yapı "okunamadı" — çözümleyici fırlatmaz (yükleme 500 vermez; inceleme 2026-10-17) */
    if (!(e instanceof BozukDer || e instanceof RangeError || e instanceof TypeError)) throw e;
    return { bilgi: { ...sonuc, butunluk: "okunamadi", imzaDegeri: "okunamadi" }, sert: null, havuz: [] };
  }
}

function imzaDoldur(sonuc: ImzaBilgisi, pdf: Uint8Array, h: ImzaYeri, belgeDamgasi: boolean, parcalar: Uint8Array[]): { bilgi: ImzaBilgisi; sert: Sertifika | null; havuz: Sertifika[] } {
  /* /Contents dolgusu: DER'den sonra YALNIZ sıfır — dolguya veri gizlenemez (imzanın dışındaki bayt) */
  const der = imzaIcerigi(pdf, h);
  if (!der) return { bilgi: sonuc, sert: null, havuz: [] };
  if (belgeDamgasi) {
    const d = damgaDenetle(der, parcalar);
    sonuc.damga = { zaman: d.zaman, tsa: d.tsa?.bilgi.ad ?? null, politika: d.politika, iz: d.iz, imza: birlestir(d.imza, d.ozet) };
    sonuc.butunluk = d.iz;
    sonuc.imzaDegeri = birlestir(d.imza, d.ozet);
    sonuc.imzalayan = d.tsa?.bilgi ?? null;
    sonuc.anindaGecerli = d.tsa && d.zaman ? gecerliMi(d.tsa.bilgi, d.zaman) : null;
    return { bilgi: sonuc, sert: null, havuz: [] };
  }
  const v = imzaliVeriOku(der);
  const si = v.imzacilar[0];
  sonuc.ozet = ozetAdi(si.ozetOid);
  sonuc.butunluk = si.imzaliOzDer ? ozetDenetle(si, parcalar) : "desteklenmiyor";
  const sert = imzaciSertifikasi(v, si);
  if (sert) {
    sonuc.imzalayan = sert.bilgi;
    sonuc.imzaDegeri = imzaDenetle(si, sert.anahtar, parcalar);
    sonuc.sertifikaBagi = imzaSertifikasiTutar(si, sert);
    sonuc.zincir = zincirKur(sert, v.sertifikalar, yeniButce()).map((c: Sertifika) => c.bilgi.ad ?? c.bilgi.kurum ?? "?");
  }
  const token = si.imzasizOz.get(CMS_OID.imzaDamgasi)?.[0];
  if (token) {
    /* özniteliğin değeri ContentInfo'nun kendisi */
    const d = damgaDenetle(token, [si.imza], v.sertifikalar);
    sonuc.damga = { zaman: d.zaman, tsa: d.tsa?.bilgi.ad ?? null, politika: d.politika, iz: d.iz, imza: birlestir(d.imza, d.ozet) };
  }
  const zaman = (sonuc.damga?.iz === "tamam" && sonuc.damga.imza === "tamam" ? sonuc.damga.zaman : null) ?? sonuc.sozlukZamani;
  if (sert && zaman) sonuc.anindaGecerli = gecerliMi(sert.bilgi, zaman);
  return { bilgi: sonuc, sert, havuz: v.sertifikalar };
}

/** iki sonucun zayıfı (tamam ancak ikisi de tamamsa) */
function birlestir(a: Sonuc, b: Sonuc): Sonuc {
  const sira: Sonuc[] = ["bozuk", "okunamadi", "desteklenmiyor", "tamam"];
  return sira[Math.min(sira.indexOf(a), sira.indexOf(b))];
}

/* ── DSS ── */
const REF = /(\d{1,10})[\x00\t\n\f\r ]{1,20}(\d{1,5})[\x00\t\n\f\r ]{1,20}R/g;
const DSS_SINIR = 64, IPTAL_DENEME = 16;
interface Dss { ozet: ImzaCozumu["dss"]; ocsp: Buffer[]; crl: Buffer[]; sertifikalar: Sertifika[] }

/** belgenin kökü: son trailer / xref akışı; çözülemezse (onarım) metindeki son /Root */
function kokNo(s: string): number | null {
  try { return basvuru(sonDurum(s).kok)![0]; } catch (e) { if (!(e instanceof PdfHatasi || e instanceof RangeError)) throw e; }
  let son: RegExpExecArray | null = null;
  const r = /\/Root[\x00\t\n\f\r ]{0,20}(\d{1,10})[\x00\t\n\f\r ]{1,20}\d{1,5}[\x00\t\n\f\r ]{1,20}R/g;
  for (let m = r.exec(s); m; m = r.exec(s)) son = m;
  return son ? Number(son[1]) : null;
}

/** son kataloğun /DSS'i (başvuru ya da satır içi); dizileri (satır içi ya da dolaylı) — öğeleri akış olarak okunur */
function dssOku(s: string, oku: NesneOkuyucu): Dss {
  const yok: Dss = { ozet: { var: false, ocsp: 0, crl: 0, sertifika: 0, konum: null }, ocsp: [], crl: [], sertifikalar: [] };
  try {
    const kok = kokNo(s);
    const katalog = kok === null ? null : oku(kok);
    if (!katalog?.startsWith("<<")) return yok;
    const dv = degerOku(katalog, "DSS");
    if (!dv) return yok;
    const r = basvuru(dv);
    const govde = r ? oku(r[0]) : dv;
    if (!govde?.startsWith("<<")) return yok;
    const konum = oku.konum(r ? r[0] : kok!);
    const akislar = (k: string): Buffer[] => {
      let x = degerOku(govde, k);
      const xr = basvuru(x);
      if (xr) x = oku(xr[0]);
      if (!x?.startsWith("[")) return [];
      return [...x.matchAll(REF)].slice(0, DSS_SINIR).map((m) => oku.akis(Number(m[1]))).filter((b): b is Buffer => !!b);
    };
    const ocsp = akislar("OCSPs"), crl = akislar("CRLs");
    const sertifikalar = akislar("Certs").map((b) => sertifikaOku(b)).filter((x): x is Sertifika => !!x);
    return { ozet: { var: true, ocsp: ocsp.length, crl: crl.length, sertifika: sertifikalar.length, konum }, ocsp, crl, sertifikalar };
  } catch (e) {
    if (e instanceof PdfHatasi || e instanceof RangeError) return yok;
    throw e;
  }
}

/** imzalayanın iptal durumu: DSS'teki OCSP cevapları, sonra iptal listeleri — kanıtın imzası (veren ya da yetkili OCSP imzacısı) ve CertID /
    listenin vereni bu sertifikayı tutmalı */
function iptalBul(s: Sertifika, havuz: Sertifika[], dss: Dss): IptalDurumu | null {
  const veren = vereniBul(s, havuz, yeniButce(16));
  if (!veren) return null;
  for (const der of dss.ocsp.slice(0, IPTAL_DENEME)) {
    try { const r = ocspCevabi(der, s, veren); if (r.imza === "tamam" && r.durum !== "bilinmiyor") return r.durum; } catch { /* sıradaki */ }
  }
  for (const der of dss.crl.slice(0, IPTAL_DENEME)) {
    try { const r = crlDenetle(der, s, veren); if (r.imza === "tamam") return r.durum; } catch { /* sıradaki */ }
  }
  return null;
}

/* ── imzadan sonraki ekler ── */
const SONRAKI_SINIR = 5_000;
/** karşılaştırma için değer metni: boşluklar tek, ayraç çevresinde boşluk yok */
const duz = (x: string | null | undefined) => (x ?? "").replace(/[\x00\t\n\f\r ]+/g, " ").replace(/ ?(<<|>>|\[|\]) ?/g, "$1").trim();
const basvurular = (dizi: string | null) => [...(dizi ?? "").matchAll(REF)].map((m) => `${m[1]} ${m[2]}`);

/** iki sözlük, serbest anahtarlar dışında aynı mı */
function serbestDisiAyni(eski: string, yeni: string, serbest: readonly string[]): boolean {
  const a = anahtarlar(eski), b = anahtarlar(yeni);
  for (const k of new Set([...a.keys(), ...b.keys()])) {
    if (serbest.includes(k)) continue;
    const x = a.get(k), y = b.get(k);
    if (!x || !y || duz(eski.slice(x[0], x[1])) !== duz(yeni.slice(y[0], y[1]))) return false;
  }
  return true;
}

/** imzanın kapsamından (K) sonra belgede ne değişti: imzalı sürümün nesneleri son hâlleriyle karşılaştırılır (çapraz başvuru zincirinden) */
function sonrakiEkler(s: string, K: number, son: NesneOkuyucu): SonrakiEkler {
  if (K >= s.length) return { durum: "yok", nesneler: [] };
  if (!son.yerler) return { durum: "okunamadi", nesneler: [] };
  let once: NesneOkuyucu, kokOnce: number, kokSon: number, bilgi: number | null;
  try {
    once = nesneOkuyucu(s.slice(0, K));
    const d0 = sonDurum(s.slice(0, K)), d1 = sonDurum(s);
    kokOnce = basvuru(d0.kok)![0]; kokSon = basvuru(d1.kok)![0];
    bilgi = basvuru(d1.bilgi)?.[0] ?? null;
  } catch (e) {
    if (e instanceof PdfHatasi || e instanceof RangeError) return { durum: "okunamadi", nesneler: [] };
    throw e;
  }
  if (!once.yerler) return { durum: "okunamadi", nesneler: [] };
  if (kokOnce !== kokSon) return { durum: "degisiklik", nesneler: [kokSon] };
  const adaylar: number[] = [];
  for (const [no, y] of son.yerler) {
    const k = y.tur === "duz" ? y.konum : y.tur === "akis" ? son.konum(y.akis) : null;
    const eski = once.yerler.get(no);
    if (y.tur === "bos" ? !!eski && eski.tur !== "bos" : k !== null && k >= K) adaylar.push(no);
    if (adaylar.length > SONRAKI_SINIR) return { durum: "okunamadi", nesneler: [] };
  }
  const katalog = son(kokSon) ?? "";
  const formNo = (() => { try { return basvuru(degerOku(katalog, "AcroForm"))?.[0] ?? null; } catch { return null; } })();
  /* imza alanı: /FT /Sig ya da ebeveyni /FT /Sig olan görünüm */
  const imzaAlani = (ref: string) => {
    const g = son(Number(ref.split(" ")[0]));
    if (!g?.startsWith("<<")) return false;
    if (duz(degerOku(g, "FT")) === "/Sig") return true;
    const p = basvuru(degerOku(g, "Parent"));
    const e = p ? son(p[0]) : null;
    return !!e?.startsWith("<<") && duz(degerOku(e, "FT")) === "/Sig";
  };
  /* dizi: eskiler kalır, eklenenler yalnız imza alanı */
  const diziIzinli = (eski: string | null, yeni: string | null) => {
    const a = basvurular(eski), b = basvurular(yeni);
    return a.every((x) => b.includes(x)) && b.filter((x) => !a.includes(x)).every(imzaAlani);
  };
  /* değer satır içi dizi ya da dolaylı dizi (dolaylı dizinin kendisi ayrıca aday olarak denetlenir) */
  const deger = (o: NesneOkuyucu, g: string, k: string) => { const v = degerOku(g, k); const r = basvuru(v); return r ? o(r[0]) : v; };
  const izinli = (no: number, eski: string, yeni: string): boolean => {
    if (no === bilgi) return true;
    if (yeni.startsWith("[") && eski.startsWith("[")) return diziIzinli(eski, yeni);
    if (!yeni.startsWith("<<") || !eski.startsWith("<<")) return false;
    const tip = duz(degerOku(yeni, "Type"));
    if (tip === "/Metadata") return true;
    if (no === kokSon) {
      return serbestDisiAyni(eski, yeni, ["DSS", "AcroForm", "Perms", "Extensions", "Metadata"]) &&
        (!!basvuru(degerOku(yeni, "AcroForm")) || formIzinli(deger(once, eski, "AcroForm") ?? "<< >>", deger(son, yeni, "AcroForm") ?? "<< >>"));
    }
    if (no === formNo) return formIzinli(eski, yeni);
    if (tip === "/Page") return serbestDisiAyni(eski, yeni, ["Annots"]) && diziIzinli(deger(once, eski, "Annots"), deger(son, yeni, "Annots"));
    if (duz(degerOku(yeni, "FT")) === "/Sig" || (basvuru(degerOku(yeni, "Parent")) && imzaAlani(`${no} 0`))) {
      /* boş imza alanının doldurulması: yalnız değer (önceden yoksa), görünüm, bayrak */
      const v0 = degerOku(eski, "V");
      return serbestDisiAyni(eski, yeni, ["V", "AP", "MK", "DA", "F", "Lock", "SV"]) && (!v0 || duz(v0) === duz(degerOku(yeni, "V")));
    }
    return false;
  };
  const formIzinli = (eski: string, yeni: string) =>
    serbestDisiAyni(eski, yeni, ["Fields", "SigFlags", "DR", "DA", "NeedAppearances"]) && diziIzinli(deger(once, eski, "Fields"), deger(son, yeni, "Fields"));
  const kotu: number[] = [];
  for (const no of adaylar) {
    const eski = once(no);
    if (eski === null) continue; /* yeni nesne — ancak değişen eski bir nesne gösterirse görünür; o nesne burada yakalanır */
    const yeni = son(no);
    try {
      if (yeni === null) kotu.push(no);
      else if (duz(eski) === duz(yeni) && (once.ham(no)?.equals(son.ham(no) ?? Buffer.alloc(0)) ?? son.ham(no) === null)) continue;
      else if (!izinli(no, eski, yeni)) kotu.push(no);
    } catch (e) {
      if (!(e instanceof PdfHatasi || e instanceof RangeError)) throw e;
      kotu.push(no);
    }
    if (kotu.length >= 32) break;
  }
  return kotu.length ? { durum: "degisiklik", nesneler: kotu } : { durum: "izinli", nesneler: [] };
}

/* ── düzey ── */
const saglam = (i: ImzaBilgisi) => i.butunluk === "tamam" && i.imzaDegeri === "tamam" && (i.tur !== "imza" || i.sertifikaBagi !== false);
const damgaSaglam = (d: DamgaBilgisi | null) => !!d && d.iz === "tamam" && d.imza === "tamam";

/** ETSI EN 319 142 düzeyi: imzaların hepsi sağlamsa (sertifika bağı tutan) B-B; her imzanın zamanı damgalıysa B-T — imza damgası ya da imzayı
    kapsayan sağlam belge damgası (EN 319 142-1 §5.3: "signature time-stamp" ya da "document time-stamp"); DSS'te her imzalayan için doğrulanmış
    iptal kanıtı B-LT; DSS'ten sonra sağlam belge damgası B-LTA. Bozuk imza varsa "yok". */
function duzeyBul(imzalar: ImzaBilgisi[], dss: ImzaCozumu["dss"]): Duzey {
  const imza = imzalar.filter((i) => i.tur === "imza");
  if (!imza.length || !imza.every(saglam) || imzalar.some((i) => i.tur === "belge_damgasi" && !saglam(i))) return "yok";
  const belgeDamgalari = imzalar.filter((i) => i.tur === "belge_damgasi" && saglam(i));
  if (!imza.every((i) => damgaSaglam(i.damga) || belgeDamgalari.some((d) => d.boslukBas >= i.kapsamSon))) return "B-B";
  if (!dss.var || !imza.every((i) => i.iptal !== null)) return "B-T";
  const arsiv = imzalar.some((i) => i.tur === "belge_damgasi" && saglam(i) && dss.konum !== null && dss.konum < i.kapsamSon);
  return arsiv ? "B-LTA" : "B-LT";
}
