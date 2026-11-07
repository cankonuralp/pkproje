/* İŞ SINIRI (2026-10-31, V21 madde 1 — reisim: "Konuşmayı 100 bin tokenin altında tutmak: iş bitince eski fotoğraf büyütmeleri ve ilk fotoğraflar ön
   okuma metnine iner, uzun araç sonuçları kısalır"; "aynı fotoğraf ikinci kez büyütülmez (F11 bu koşuda dört kez büyütüldü)"; "eski düşünme bloklarının
   iş sınırında düşürülebilirliğine bak" → bakıldı, düşürülmedi: aşağıda). SAF. Konuşma kaydı DEĞİŞMEZ (yz_konusma yalnız sona eklenir, UPDATE yok —
   tests/say.test.ts); sıkıştırma yapay zekâya giden isteği kurarken uygulanır: kullanıcının SON sorusundan önceki kullanıcı iletileri (bitmiş işler)
   küçülür, bu işin iletileri aynen kalır.
   Aynı kayıttan her istekte aynı çıktı → önbellek öneki iş boyunca sabit, yeni işte bir kez yeniden yazılır. Kilit tests/say-is-siniri.test.ts. */
import { BILDIRIM_ONEKI, RAPOR_YAZAN, sunucuNotuMu } from "./bitis-denetimi.ts";

export interface IsMesaji { role: string; content: unknown }
type Blok = Record<string, unknown>;
/** bitmiş işin araç sonucu bu kadar karakterden uzunsa kırpılır */
export const ESKI_SONUC_EN_COK = 1_500;
export const FOTO_KALDIRILDI = "[fotoğrafın küçük kopyası kaldırıldı — iş bitti; başlığındaki ön okuma kalır, gerekirse foto_goster]";
export const GORUNTU_KALDIRILDI = "[büyütülmüş görüntü kaldırıldı — iş bitti; gerekirse foto_goster yeniden]";

const bloklar = (c: unknown): Blok[] | null => (Array.isArray(c) ? c.filter((b): b is Blok => !!b && typeof b === "object") : null);
const metinler = (m: IsMesaji) => (bloklar(m.content) ?? (typeof m.content === "string" ? [{ type: "text", text: m.content }] : [])).filter((b) => b.type === "text").map((b) => String(b.text ?? ""));
/** kullanıcının sorusu: sonuç bloğu taşımayan, sunucunun denetim notu olmayan kullanıcı iletisi (bitis-denetimi.ts ile aynı kural) */
export const soruMu = (m: IsMesaji): boolean => m.role === "user" && !(bloklar(m.content) ?? []).some((b) => b.type === "tool_result") && metinler(m).some((t) => !sunucuNotuMu(t));
/** kullanıcının son sorusunun yeri (iş sınırı); soru yoksa -1 */
export function sonSoruIndeksi(mesajlar: readonly IsMesaji[]): number {
  for (let i = mesajlar.length - 1; i >= 0; i--) if (soruMu(mesajlar[i]!)) return i;
  return -1;
}

const kirp = (s: string) => (s.length > ESKI_SONUC_EN_COK ? `${s.slice(0, ESKI_SONUC_EN_COK)} …(${s.length - ESKI_SONUC_EN_COK} karakter kırpıldı — iş bitti)` : s);
/** bitmiş işin kullanıcı iletisi: fotoğraf blokları metne, araç sonuçlarındaki görüntüler metne, uzun sonuçlar kırpık */
function kullaniciKucult(l: readonly Blok[]): { bloklar: Blok[]; degisti: boolean } {
  let degisti = false;
  const sonuc = l.map((b) => {
    if (b.type === "image") { degisti = true; return { type: "text", text: FOTO_KALDIRILDI }; }
    if (b.type !== "tool_result") return b;
    if (typeof b.content === "string") {
      const k = kirp(b.content);
      if (k !== b.content) degisti = true;
      return k === b.content ? b : { ...b, content: k };
    }
    const ic = bloklar(b.content);
    if (!ic) return b;
    let icDegisti = false;
    const yeni = ic.map((x) => {
      if (x.type === "image") { icDegisti = true; return { type: "text", text: GORUNTU_KALDIRILDI }; }
      if (x.type === "text" && typeof x.text === "string") { const k = kirp(x.text); if (k !== x.text) { icDegisti = true; return { ...x, text: k }; } }
      return x;
    });
    if (icDegisti) degisti = true;
    return icDegisti ? { ...b, content: yeni } : b;
  });
  return { bloklar: sonuc, degisti };
}
/* Yapay zekâ iletileri (düşünme bloğu ve imzası dahil) AYNEN gider: reisim'in 2026-10-23 kararı "konuşma olduğu gibi"; hizmet önceki turların düşünme
   bloklarını bağlamdan kendisi düşürür ve giriş tokenine saymaz (düşürmek maliyeti değiştirmezdi), uçtan uca taklit de her cevabın düşünmesini ister. */

/** kullanıcının son sorusundan önceki KULLANICI iletileri küçültülmüş; bu işin iletileri ve yapay zekâ iletileri aynen. sikisan: değişen ileti sayısı */
export function konusmaSikistir<T extends IsMesaji>(mesajlar: readonly T[]): { mesajlar: T[]; sikisan: number } {
  const b = sonSoruIndeksi(mesajlar);
  if (b <= 0) return { mesajlar: [...mesajlar], sikisan: 0 };
  let sikisan = 0;
  const l = mesajlar.map((m, i) => {
    if (i >= b || m.role !== "user") return m;
    const ic = bloklar(m.content);
    if (!ic) return m;
    const k = kullaniciKucult(ic);
    if (!k.degisti) return m;
    sikisan++;
    return { ...m, content: k.bloklar };
  });
  return { mesajlar: l, sikisan };
}

const FOTO_NO = /^F?(\d{1,4})$/i;
/** fotoğraf numarası ("F11", "11") → sayı; geçersizse null */
export const fotoNo = (x: unknown): number | null => { const m = FOTO_NO.exec(String(x ?? "").trim()); return m ? Number(m[1]) : null; };
/** bu işte (son sorudan bu yana) foto_goster ile büyütülmüş fotoğrafların numaraları — aynı fotoğraf ikinci kez büyütülmez */
export function gosterilenFotolar(mesajlar: readonly IsMesaji[]): Set<number> {
  const s = new Set<number>(), b = Math.max(0, sonSoruIndeksi(mesajlar));
  for (const m of mesajlar.slice(b)) {
    if (m.role !== "assistant") continue;
    for (const x of bloklar(m.content) ?? []) {
      if (x.type !== "tool_use" || x.name !== "foto_goster") continue;
      const no = fotoNo((x.input as { foto?: unknown } | null)?.foto);
      if (no !== null) s.add(no);
    }
  }
  return s;
}
/* ── 2026-10-31 (V21 madde 7 — reisim: "Bildirim en çok dört satır; sunucu da bunu uygular"): rapora yazan iş bittiğinde S.A.Y'ın bildirimi dört dolu
   satırı aşıyorsa ekrana gitmez, sunucu BİR kez not ekler, S.A.Y kısasını yazar ── */
export const BILDIRIM_EN_COK = 4;
/** dolu satır sayısı (boş satır ve yatay çizgi sayılmaz) */
export const bildirimSatirlari = (metin: string): number => metin.split("\n").map((s) => s.trim()).filter((s) => s && !/^[-*_]{3,}$/.test(s)).length;
/** bu işte rapora yazan işlem var, bildirim notu daha önce verilmedi ve bildirim uzunsa */
export function bildirimNotuGerekli(mesajlar: readonly IsMesaji[], metin: string): boolean {
  if (bildirimSatirlari(metin) <= BILDIRIM_EN_COK) return false;
  const b = sonSoruIndeksi(mesajlar);
  if (b < 0) return false;
  let yazan = false;
  for (const m of mesajlar.slice(b)) {
    if (m.role === "user" && metinler(m).some((t) => t.startsWith(BILDIRIM_ONEKI))) return false;
    if (m.role !== "assistant") continue;
    for (const x of bloklar(m.content) ?? []) {
      if (x.type === "tool_use" && x.name === "islem" && RAPOR_YAZAN.has(String((x.input as { ad?: unknown } | null)?.ad ?? ""))) yazan = true;
    }
  }
  return yazan;
}
export const bildirimNotu = (satir: number) =>
  `${BILDIRIM_ONEKI}: bildirimin ${satir} satır oldu; en çok dört satıra indir — kalın sonuç satırı, sonra yalnız dolu olanlar alt alta: **Varsayım:** · **Boş bırakılan:** · **Yapılamayan:**. `
  + "Yalnız bildirimi yeniden yaz; iş yapma, araç çağırma.";

/* ── 2026-11-01 (V21 A1 — reisim: "100 bin olayını sınırlama şansımız yok mu"): SERT TAVAN. İstem boyu istek öncesi kestirilir; TAVAN'ı aşacaksa iş İÇİNDE
   küçültme seviyesi artar (tek yönlü — bir kez küçülen küçük kalır, seviye yz_konusma_is.kucultme'de): 1 eski büyütme görüntüleri metne (son görüntülü sonuç
   kalır) · 2 okunmuş beceri metinleri nota · 3 uzun araç sonuçları kırpık (son iki kullanıcı iletisi hariç) · 4 "bağlam doldu" sistem notu. ── */
/* 2026-11-02 (altıncı koşu P3): tavan 90 → 75 bin — hizmetin bağlam temizlemesi (BAGLAM_ESIGI 80 bin) her şeyi silip bütün önbelleği yeniden yazdırıyordu
   (6. koşuda 32,8 bin); bizim kademeli küçültme ondan ÖNCE girsin */
export const TAVAN = 75_000, KUCULTME_EN_COK = 4;
/** görüntü başına kestirim: konuşmadaki küçük kopya (≤ 800 px), büyütme / pafta (base64, ≤ 1 568 px), belge (PDF) */
const KUCUK_FOTO = 650, BUYUK_GORUNTU = 2_400, BELGE = 3_000, KARAKTER_BASINA = 3.5;
export const BECERI_KALDIRILDI = (ad: string) => `${ad} okundu — içeriği bağlam için kaldırıldı; gerekirse beceri_oku ile yeniden oku.`;
export const BAGLAM_DOLDU = "Bağlam sınırına yaklaştı: kalan işi en az araç çağrısıyla bitir; yeni okuma, arama ve büyütme yapma; bildirimi yaz.";

/** istemin token kestirimi: metinler (araç girdisi ve düşünce dahil) karakter / 3,5; görüntü ve belge sabit */
export function istemTahmini(mesajlar: readonly IsMesaji[]): number {
  let karakter = 0, token = 0;
  const say = (b: Blok) => {
    if (b.type === "image") { token += (b.source as { type?: unknown } | undefined)?.type === "file" ? KUCUK_FOTO : BUYUK_GORUNTU; return; }
    if (b.type === "document") { token += BELGE; return; }
    if (b.type === "tool_result") { if (typeof b.content === "string") karakter += b.content.length; else for (const x of bloklar(b.content) ?? []) say(x); return; }
    karakter += JSON.stringify(b).length;
  };
  for (const m of mesajlar) { if (typeof m.content === "string") karakter += m.content.length; else for (const b of bloklar(m.content) ?? []) say(b); }
  return Math.ceil(karakter / KARAKTER_BASINA) + token;
}

/* 2026-11-07 (canlı V25 ölçümü — reisim: "10 cent çok büyük maliyet"): KAYMAYAN SINIR. Eskiden "son iki ileti hariç" ve "son görüntülü sonuç hariç"
   kırpılıyordu: her yeni istekte bir önceki ileti de kırpıldığı için konuşmanın o noktasından sonrası önbellekten okunamıyor, her istekte yeniden
   yazılıyordu. Şimdi kırpılan sonuç sayısı basamaklarla ilerler (1, 2, 4, 8, sonra sekizer): sınır yalnız basamakta kayar, arada istekler önbellekten okunur. */
export const KIRPMA_KALAN = 2, KIRPMA_ADIM = 8;
/** n sonuçtan kaçı kırpılır (kalan en az `kalan`; basamaklı — n arttıkça yalnız basamakta değişir) */
export function kirpilacakSayi(n: number, kalan = KIRPMA_KALAN): number {
  const m = n - kalan;
  if (m <= 0) return 0;
  if (m < KIRPMA_ADIM) return 2 ** Math.floor(Math.log2(m));
  return Math.floor(m / KIRPMA_ADIM) * KIRPMA_ADIM;
}
/** bu işin iletileri seviyeye göre küçültülmüş (iş sınırından sonrakiler; soru iletisinin kendisi ve son sonuçlar korunur). Belirlenimli. */
export function isIciKucult<T extends IsMesaji>(mesajlar: readonly T[], seviye: number): { mesajlar: T[]; degisen: number } {
  const b = sonSoruIndeksi(mesajlar);
  if (seviye <= 0 || b < 0) return { mesajlar: [...mesajlar], degisen: 0 };
  const beceri = new Map<string, string>();
  const sonuclu: number[] = [], goruntulu: number[] = [];
  mesajlar.forEach((m, i) => {
    if (i <= b) return;
    if (m.role === "assistant") { for (const x of bloklar(m.content) ?? []) if (x.type === "tool_use" && x.name === "beceri_oku" && typeof x.id === "string") beceri.set(x.id, String((x.input as { ad?: unknown } | null)?.ad ?? "beceri")); return; }
    if (m.role !== "user") return;
    const ic = bloklar(m.content) ?? [];
    if (ic.some((x) => x.type === "tool_result")) sonuclu.push(i);
    if (ic.some((x) => x.type === "tool_result" && (bloklar(x.content) ?? []).some((y) => y.type === "image"))) goruntulu.push(i);
  });
  /* kırpılan ve metne dönen iletiler: baştan, basamaklı sayıda (kaymayan sınır) */
  const kirpilan = new Set(sonuclu.slice(0, kirpilacakSayi(sonuclu.length)));
  const metneDonen = new Set(goruntulu.slice(0, kirpilacakSayi(goruntulu.length, 1)));
  let degisen = 0;
  const l = mesajlar.map((m, i) => {
    if (i <= b || m.role !== "user") return m;
    const ic = bloklar(m.content);
    if (!ic) return m;
    let d = false;
    const yeni = ic.map((x) => {
      if (x.type !== "tool_result") return x;
      if (seviye >= 2 && typeof x.tool_use_id === "string" && beceri.has(x.tool_use_id)) { d = true; return { ...x, content: BECERI_KALDIRILDI(beceri.get(x.tool_use_id)!) }; }
      if (seviye >= 1 && metneDonen.has(i) && Array.isArray(x.content) && (bloklar(x.content) ?? []).some((y) => y.type === "image")) {
        d = true; return { ...x, content: (bloklar(x.content) ?? []).map((y) => (y.type === "image" ? { type: "text", text: GORUNTU_KALDIRILDI } : y)) };
      }
      if (seviye >= 3 && kirpilan.has(i)) {
        if (typeof x.content === "string" && x.content.length > ESKI_SONUC_EN_COK) { d = true; return { ...x, content: kirp(x.content) }; }
        const y = bloklar(x.content);
        if (y?.some((z) => z.type === "text" && typeof z.text === "string" && z.text.length > ESKI_SONUC_EN_COK)) { d = true; return { ...x, content: y.map((z) => (z.type === "text" && typeof z.text === "string" ? { ...z, text: kirp(z.text) } : z)) }; }
      }
      return x;
    });
    if (!d) return m;
    degisen++;
    return { ...m, content: yeni };
  });
  return { mesajlar: l, degisen };
}
/** tavanı aşmayan en düşük seviye (mevcut seviyeden başlar; yalnız ileri) */
export function kucultmeSeviyesi(mesajlar: readonly IsMesaji[], mevcut: number, sistemToken: number, olculen = 0): number {
  let s = Math.max(0, mevcut);
  const tahmin = (sv: number) => Math.max(istemTahmini(isIciKucult(mesajlar, sv).mesajlar) + sistemToken, sv === mevcut ? olculen : 0);
  while (s < KUCULTME_EN_COK && tahmin(s) > TAVAN) s++;
  return s;
}

/* ── 2026-11-01 (V21 B — reisim: "müşteriye bırakmadan otomatik geçmiş silme koyalım"): OTOMATİK KAPANIŞ. İş bitmişken yeni soru gelince konuşma YALNIZ
   60 dakika sessizlikten sonra kendiliğinden kapanır (metni Ar-Ge kaydına, ekleri çöpe; "Sohbeti temizle" tuşu kalır). Son bildirim yeni konuşmanın başına
   not olarak girer. "Başka plan" kuralı dördüncü koşuda, "konuşma büyüdü" kuralı beşinci koşuda KALKTI: ikisinde de kullanıcı aynı fotoğraflarla devam
   sorusu sorunca konuşma kapanıp ekler gitmişti ("fotoğraf yok"). Büyüklük iş sınırı sıkıştırması (konusmaSikistir, isIciKucult) ve hizmetin bağlam
   düzenlemesiyle yönetilir; fotoğraf konuşmada metin olarak taşındığından (büyük iş şeması) büyüme de sınırlıdır. ── */
export const KAPANIS_DAKIKA = 60;
export function kapanisNedeni(g: { mesajlar: readonly IsMesaji[]; sonZaman: Date | null; simdi: Date }): string | null {
  if (!g.mesajlar.length) return null;
  if (g.sonZaman && g.simdi.getTime() - g.sonZaman.getTime() > KAPANIS_DAKIKA * 60_000) return `${KAPANIS_DAKIKA} dakika geçti`;
  return null;
}
/** kapanış notu: önceki işin son bildirimi (en çok dört dolu satır) */
export function kapanisNotu(neden: string, saat: string, sonBildirim: string): string {
  const satirlar = sonBildirim.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 4).join("\n").slice(0, 700);
  return `Önceki konuşma kapandı (${neden}; ${saat}). Önceki işin son bildirimi:\n${satirlar || "—"}\nEski ekler artık konuşmada yok; kullanıcı eski bir fotoğrafı isterse yeniden eklemesini iste.`;
}

export const ZATEN_BUYUTULDU = (no: number) => `F${String(no).padStart(2, "0")} bu işte zaten büyütüldü; o görüntüye bak (aynı fotoğraf bir işte bir kez büyütülür — ilk seferde doğru bölgeyi iste).`;

/* ── 2026-11-01 BÜYÜK İŞ ŞEMASI (reisim: "müşteriler 20-25-50-60 fotoğraflı işi de tek te yaptırmak isteyebilir … müşteriye göstermeden"): PARTİLİ YAZMA.
   S.A.Y raporlara_yaz'ı 8–10 raporluk partilerle çağırır (aynı iş). Parti yazıldıktan sonra ondan ÖNCEKİ büyütme / pafta görüntüleri (araç sonuçlarındaki
   görüntüler) metne iner — o partinin büyütmeleri bitmiştir; sonraki partinin büyütmeleri kalır. Yapay zekâ iletileri aynen; kayıt değişmez; belirlenimli.
   Ekrana yalnız "n / N rapor yazıldı" gider (raporIlerlemesi) — parti, ön okuma, küçültme görünmez. ── */
/** araç çağrısının işlem adı: islem aracının ad'ı ya da doğrudan katalog adıyla çağrı (V21 O9) */
const islemAdi = (x: Blok): string => (x.name === "islem" ? String((x.input as { ad?: unknown } | null)?.ad ?? "") : String(x.name ?? ""));
const islemGirdisi = (x: Blok): Record<string, unknown> => {
  const g = x.name === "islem" ? (x.input as { girdi?: unknown } | null)?.girdi : x.input;
  return g && typeof g === "object" ? g as Record<string, unknown> : {};
};
/** 2026-11-02 (altıncı koşu P2): parti = yalnız RAPORA YAZAN çağrı (rapor_ac, fotoğraf, saat planı değil — 6. koşuda rapor_ac'tan sonra 21,6 bin yeniden
    yazıldı) ve yalnız istem kestirimi PARTI_ESIGI'ni aşıyorsa (küçük işte görüntüyü okumak 0,01 $/M, yeniden yazmak 0,20 $/M — görüntüler kalır) */
export const PARTI_YAZAN: ReadonlySet<string> = new Set(["raporlara_yaz", "rapor_yaz"]);
export const PARTI_ESIGI = 60_000;
export function partiSonuKucult<T extends IsMesaji>(mesajlar: readonly T[]): { mesajlar: T[]; degisen: number } {
  const b = sonSoruIndeksi(mesajlar);
  if (b < 0 || istemTahmini(mesajlar) <= PARTI_ESIGI) return { mesajlar: [...mesajlar], degisen: 0 };
  let sonYazma = -1;
  mesajlar.forEach((m, i) => {
    if (i <= b || m.role !== "assistant") return;
    for (const x of bloklar(m.content) ?? []) if (x.type === "tool_use" && PARTI_YAZAN.has(islemAdi(x))) sonYazma = i;
  });
  if (sonYazma < 0) return { mesajlar: [...mesajlar], degisen: 0 };
  let degisen = 0;
  const l = mesajlar.map((m, i) => {
    if (i <= b || i >= sonYazma || m.role !== "user") return m;
    const ic = bloklar(m.content);
    if (!ic) return m;
    let d = false;
    const yeni = ic.map((x) => {
      if (x.type !== "tool_result" || !Array.isArray(x.content) || !(bloklar(x.content) ?? []).some((y) => y.type === "image")) return x;
      d = true;
      return { ...x, content: (bloklar(x.content) ?? []).map((y) => (y.type === "image" ? { type: "text", text: GORUNTU_KALDIRILDI } : y)) };
    });
    if (!d) return m;
    degisen++;
    return { ...m, content: yeni };
  });
  return { mesajlar: l, degisen };
}

/** bu işte açılan rapor sayısı (rapor_ac sonuçlarındaki kimlikler) ve yazılan rapor sayısı (raporlara_yaz / rapor_yaz girdileri, rapor kimliğiyle tekil;
    sonucu "hata" olan çağrı sayılmaz). Sonucu olmayan çağrı (henüz çalışmamış) sayılmaz. Hiçbiri yoksa null. */
export function raporIlerlemesi(mesajlar: readonly IsMesaji[]): { yazilan: number; acilan: number } | null {
  const b = sonSoruIndeksi(mesajlar);
  if (b < 0) return null;
  const sonuc = new Map<string, string>();
  for (const m of mesajlar.slice(b + 1)) {
    if (m.role !== "user") continue;
    for (const x of bloklar(m.content) ?? []) {
      if (x.type === "tool_result" && typeof x.tool_use_id === "string") sonuc.set(x.tool_use_id, typeof x.content === "string" ? x.content : JSON.stringify(x.content ?? ""));
    }
  }
  const kimlik = (r: unknown): string | null => (typeof r === "string" ? r : r && typeof r === "object" && typeof (r as { rapor?: unknown }).rapor === "string" ? (r as { rapor: string }).rapor : null);
  const acilanSayisi = (s: string): number => {
    try { const x = JSON.parse(s) as { raporlar?: unknown }; return Array.isArray(x.raporlar) ? x.raporlar.filter((r) => r && typeof (r as { id?: unknown }).id === "string").length : 0; } catch { return 0; }
  };
  const yazilan = new Set<string>();
  let acilan = 0;
  for (const m of mesajlar.slice(b + 1)) {
    if (m.role !== "assistant") continue;
    for (const x of bloklar(m.content) ?? []) {
      if (x.type !== "tool_use" || typeof x.id !== "string" || !sonuc.has(x.id)) continue;
      const s = sonuc.get(x.id)!;
      if (/"durum":\s*"hata"/.test(s)) continue;
      const ad = islemAdi(x), g = islemGirdisi(x);
      if (ad === "rapor_ac") acilan += acilanSayisi(s);
      else if (ad === "raporlara_yaz" && Array.isArray(g.raporlar)) g.raporlar.forEach((r, i) => yazilan.add(kimlik(r) ?? `${x.id}:${i}`));
      else if (ad === "rapor_yaz") yazilan.add(kimlik(g.rapor) ?? x.id);
    }
  }
  return acilan || yazilan.size ? { yazilan: yazilan.size, acilan } : null;
}
/** bekleme balonundaki ilerleme satırı */
export const ilerlemeMetni = (i: { yazilan: number; acilan: number } | null): string | null =>
  (!i ? null : i.acilan ? `${i.yazilan} / ${i.acilan} rapor yazıldı` : `${i.yazilan} rapor yazıldı`);
