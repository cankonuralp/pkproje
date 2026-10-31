/* İŞ SINIRI (2026-10-31, V21 madde 1 — reisim: "Konuşmayı 100 bin tokenin altında tutmak: iş bitince eski fotoğraf büyütmeleri ve ilk fotoğraflar ön
   okuma metnine iner, uzun araç sonuçları kısalır"; "aynı fotoğraf ikinci kez büyütülmez (F11 bu koşuda dört kez büyütüldü)"; "eski düşünme bloklarının
   iş sınırında düşürülebilirliğine bak"). SAF. Konuşma kaydı DEĞİŞMEZ (yz_konusma yalnız sona eklenir, UPDATE yok — tests/say.test.ts); sıkıştırma
   yapay zekâya giden isteği kurarken uygulanır: kullanıcının SON sorusundan önceki iletiler (bitmiş işler) küçülür, bu işin iletileri aynen kalır.
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
/** bitmiş işin yapay zekâ iletisi: düşünme blokları düşer (hizmet önceki turların düşünmesini zaten saymaz; yük ve kayıt küçülür); boş kalacaksa aynen */
function asistanKucult(l: readonly Blok[]): { bloklar: Blok[]; degisti: boolean } {
  const kalan = l.filter((b) => b.type !== "thinking" && b.type !== "redacted_thinking");
  return kalan.length && kalan.length !== l.length ? { bloklar: kalan, degisti: true } : { bloklar: [...l], degisti: false };
}

/** kullanıcının son sorusundan önceki iletiler küçültülmüş; bu işin iletileri aynen. sikisan: değişen ileti sayısı */
export function konusmaSikistir<T extends IsMesaji>(mesajlar: readonly T[]): { mesajlar: T[]; sikisan: number } {
  const b = sonSoruIndeksi(mesajlar);
  if (b <= 0) return { mesajlar: [...mesajlar], sikisan: 0 };
  let sikisan = 0;
  const l = mesajlar.map((m, i) => {
    if (i >= b) return m;
    const ic = bloklar(m.content);
    if (!ic) return m;
    const k = m.role === "assistant" ? asistanKucult(ic) : m.role === "user" ? kullaniciKucult(ic) : null;
    if (!k?.degisti) return m;
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

export const ZATEN_BUYUTULDU = (no: number) => `F${String(no).padStart(2, "0")} bu işte zaten büyütüldü; o görüntüye bak (aynı fotoğraf bir işte bir kez büyütülür — ilk seferde doğru bölgeyi iste).`;
