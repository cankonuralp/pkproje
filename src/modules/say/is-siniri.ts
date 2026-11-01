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
  `${BILDIRIM_ONEKI}: bildirimin ${satir} satır oldu; en çok dört satıra indir — ne hazır · varsayımla yazılanlar · "-" bırakılanlar · kalan engel. `
  + "Yalnız bildirimi yeniden yaz; iş yapma, araç çağırma.";

/* ── 2026-11-01 (V21 A1 — reisim: "100 bin olayını sınırlama şansımız yok mu"): SERT TAVAN. İstem boyu istek öncesi kestirilir; TAVAN'ı aşacaksa iş İÇİNDE
   küçültme seviyesi artar (tek yönlü — bir kez küçülen küçük kalır, seviye yz_konusma_is.kucultme'de): 1 eski büyütme görüntüleri metne (son görüntülü sonuç
   kalır) · 2 okunmuş beceri metinleri nota · 3 uzun araç sonuçları kırpık (son iki kullanıcı iletisi hariç) · 4 "bağlam doldu" sistem notu. ── */
export const TAVAN = 90_000, KUCULTME_EN_COK = 4;
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

/** bu işin iletileri seviyeye göre küçültülmüş (iş sınırından sonrakiler; soru iletisinin kendisi ve son görüntülü sonuç korunur). Belirlenimli. */
export function isIciKucult<T extends IsMesaji>(mesajlar: readonly T[], seviye: number): { mesajlar: T[]; degisen: number } {
  const b = sonSoruIndeksi(mesajlar);
  if (seviye <= 0 || b < 0) return { mesajlar: [...mesajlar], degisen: 0 };
  const beceri = new Map<string, string>();
  let sonGoruntu = -1, sonKullanici = -1, oncekiKullanici = -1;
  mesajlar.forEach((m, i) => {
    if (i <= b) return;
    if (m.role === "assistant") { for (const x of bloklar(m.content) ?? []) if (x.type === "tool_use" && x.name === "beceri_oku" && typeof x.id === "string") beceri.set(x.id, String((x.input as { ad?: unknown } | null)?.ad ?? "beceri")); return; }
    if (m.role !== "user") return;
    oncekiKullanici = sonKullanici; sonKullanici = i;
    if ((bloklar(m.content) ?? []).some((x) => x.type === "tool_result" && (bloklar(x.content) ?? []).some((y) => y.type === "image"))) sonGoruntu = i;
  });
  let degisen = 0;
  const l = mesajlar.map((m, i) => {
    if (i <= b || m.role !== "user") return m;
    const ic = bloklar(m.content);
    if (!ic) return m;
    let d = false;
    const yeni = ic.map((x) => {
      if (x.type !== "tool_result") return x;
      if (seviye >= 2 && typeof x.tool_use_id === "string" && beceri.has(x.tool_use_id)) { d = true; return { ...x, content: BECERI_KALDIRILDI(beceri.get(x.tool_use_id)!) }; }
      if (seviye >= 1 && i !== sonGoruntu && Array.isArray(x.content) && (bloklar(x.content) ?? []).some((y) => y.type === "image")) {
        d = true; return { ...x, content: (bloklar(x.content) ?? []).map((y) => (y.type === "image" ? { type: "text", text: GORUNTU_KALDIRILDI } : y)) };
      }
      if (seviye >= 3 && i !== sonKullanici && i !== oncekiKullanici) {
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

/* ── 2026-11-01 (V21 B — reisim: "müşteriye bırakmadan otomatik geçmiş silme koyalım"): OTOMATİK KAPANIŞ. İş bitmişken yeni soru gelince konuşma şu üç
   durumda kendiliğinden kapanır (metni Ar-Ge kaydına, ekleri çöpe; "Sohbeti temizle" tuşu kalır): 60 dakika sessizlik · başka planın sayfasından soru ·
   küçültülmüş konuşma KAPANIS_BOYU tokeni aştı. Son bildirim yeni konuşmanın başına not olarak girer. ── */
export const KAPANIS_DAKIKA = 60, KAPANIS_BOYU = 60_000;
export function kapanisNedeni(g: { mesajlar: readonly IsMesaji[]; sonZaman: Date | null; simdi: Date; yeniNot: string }): string | null {
  if (!g.mesajlar.length) return null;
  if (g.sonZaman && g.simdi.getTime() - g.sonZaman.getTime() > KAPANIS_DAKIKA * 60_000) return `${KAPANIS_DAKIKA} dakika geçti`;
  /* "başka plan" kuralı 2026-11-01 dördüncü koşuda KALKTI: kullanıcı aynı fotoğraflarla başka planın sayfasında yeniden sorunca konuşma kapandı, ekleri
     gitti ("fotoğraf yok" dedi — reisim: "eksik var diyip rapor oluşturmadı"). Yalnız 60 dakika ve büyüklük. */
  if (istemTahmini(konusmaSikistir(g.mesajlar).mesajlar) > KAPANIS_BOYU) return "konuşma büyüdü";
  return null;
}
/** kapanış notu: önceki işin son bildirimi (en çok dört dolu satır) */
export function kapanisNotu(neden: string, saat: string, sonBildirim: string): string {
  const satirlar = sonBildirim.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 4).join("\n").slice(0, 700);
  return `Önceki konuşma kapandı (${neden}; ${saat}). Önceki işin son bildirimi:\n${satirlar || "—"}\nEski ekler artık konuşmada yok; kullanıcı eski bir fotoğrafı isterse yeniden eklemesini iste.`;
}

export const ZATEN_BUYUTULDU = (no: number) => `F${String(no).padStart(2, "0")} bu işte zaten büyütüldü; o görüntüye bak (aynı fotoğraf bir işte bir kez büyütülür — ilk seferde doğru bölgeyi iste).`;
