/* S.A.Y KENDİ İŞİNDEN ÖĞRENME (2026-11-05; göç 0121; reisim: "müşterilerin yaptırdığı işlere göre sürekli kendini eğitme", "benim 1 kere yaptırdığım işi
   claude … bir dahaki sefer daha iyi yapıyor … say asistanda da bu hafızalama yöntemi … geri planda çalışsın ve kullanıcının tokeninden yemesin";
   sunum 7UcQ3N2BJRQkLHq4Whad16 kabul). Yapay zekâ KULLANMAZ — hepsi kod:
   · isOzeti (SAF): konuşmanın SON işinin özeti — kullanıcının isteği, adımlar (işlem adları, hata), S.A.Y'ın yazdığı raporlar, düzeltme isteği mi.
   · isKaydiYaz: iş bitince (src/modules/say/server/dongu.ts) özeti + dokunduğu raporların o andaki cevaplarının parmak izini (anahtar başına md5) yazar.
   · Gece (src/server/is/gece.ts sayOgrenmeIsi): say_ogren_veri puanlar (onaydan geri geldi, S.A.Y'ın bıraktığı cevap elle değişti, sonraki istek düzeltme →
     kötü; hata → şüpheli; raporların hepsi onaylandı → iyi) ve adayları verir; hafizaKur (SAF) örnekleri seçer (iş türü başına en ucuz üç; eski örnekler
     yenisi daha iyi değilse KALIR — K3: öğrenilen silinmez), adları gizler (maskele) ve hafıza metnini kurar; say_hafiza_yaz yazar.
   · hafizaNotu: konuşmanın başında S.A.Y'a giden not (src/modules/say/server/say.ts soruyuEkle) — konuşma boyunca aynı, önbellekte.
   Kilit tests/say-ogrenme-saf.test.ts + tests/say-ogrenme.test.ts (PG). */
import type { Sorgulayici } from "../db/kiraci.ts";

type Blok = Record<string, unknown>;
export interface Mesaj { role: string; content: unknown }
export interface IsAdimi { ad: string; hata?: true }
export interface IsOzeti { soru: string; adimlar: IsAdimi[]; raporlar: string[]; duzeltme: boolean; hata: number; tur: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const bloklar = (c: unknown): Blok[] => (Array.isArray(c) ? c.filter((b): b is Blok => !!b && typeof b === "object") : typeof c === "string" ? [{ type: "text", text: c }] : []);
const nesne = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? x as Record<string, unknown> : {});

/** rapora yazan işlemler (S.A.Y'ın yazdığı rapor buradan); ekranın rapora_yaz'ı ekrandaki rapora yazar */
export const RAPOR_YAZAN: ReadonlySet<string> = new Set(["rapor_yaz", "raporlara_yaz", "rapora_yaz"]);
/** işin türünü belirlemeyen araçlar (okuma, görme, beceri) */
const TUR_DISI: ReadonlySet<string> = new Set(["islemler", "ekran_durumu", "beceri_oku", "foto_goster", "foto_pafta", "form_goster", "web_search"]);
/** kullanıcının bir önceki işi düzelttiğini söyleyen sözler */
export const DUZELTME = /(^|[^\p{L}])(hayır|hayir|yanlış|yanlis|olmamış|olmamis|olmadı|olmadi|hatalı|hatali|düzelt|duzelt|geri al)(?![\p{L}])/iu;

/** araç çağrısının asıl işlem adı ve girdisi: islem aracı { ad, girdi } taşır; katalogdaki ad doğrudan da çağrılır */
function islemi(b: Blok): { ad: string; girdi: Record<string, unknown> } {
  const ad = String(b.name ?? ""), g = nesne(b.input);
  return ad === "islem" && typeof g.ad === "string" ? { ad: g.ad, girdi: nesne(g.girdi) } : { ad, girdi: g };
}
/** girdideki rapor kimlikleri: "rapor" anahtarı (kimlik) ve "raporlar" dizisinin { rapor } öğeleri */
function raporKimlikleri(g: Record<string, unknown>): string[] {
  const l: string[] = [];
  if (typeof g.rapor === "string" && UUID.test(g.rapor)) l.push(g.rapor);
  if (Array.isArray(g.raporlar)) for (const x of g.raporlar) { const r = nesne(x).rapor; if (typeof r === "string" && UUID.test(r)) l.push(r); }
  return l;
}
const hataliSonuc = (b: Blok): boolean => {
  if (b.is_error === true) return true;
  const ic = typeof b.content === "string" ? b.content : bloklar(b.content).filter((x) => x.type === "text").map((x) => String(x.text ?? "")).join("\n");
  return /^Yapılmadı(?!\p{L})/u.test(ic.trim());
};

/** konuşmanın son işinin özeti: istek = sayfa notundan (rol system) hemen önceki kullanıcı iletisinin son yazısı; adımlar ondan sonraki araç çağrıları.
    raporId: ekrandaki rapor (ekranın rapora_yaz'ı oraya yazar). İstek bulunamazsa null */
export function isOzeti(mesajlar: readonly Mesaj[], raporId: string | null = null): IsOzeti | null {
  let i = -1;
  for (let k = mesajlar.length - 1; k > 0; k--) if (mesajlar[k]!.role === "system" && mesajlar[k - 1]!.role === "user") { i = k - 1; break; }
  if (i < 0) return null;
  const yazilar = bloklar(mesajlar[i]!.content).filter((b) => b.type === "text" && typeof b.text === "string").map((b) => String(b.text));
  const soru = (yazilar.at(-1) ?? "").trim().slice(0, 2000);
  const adimlar: IsAdimi[] = [], sira = new Map<string, number>(), raporlar = new Set<string>();
  for (const m of mesajlar.slice(i + 1)) {
    for (const b of bloklar(m.content)) {
      if (m.role === "assistant" && (b.type === "tool_use" || b.type === "server_tool_use")) {
        const { ad, girdi } = islemi(b);
        if (!ad) continue;
        sira.set(String(b.id ?? ""), adimlar.length);
        adimlar.push({ ad: ad.slice(0, 60) });
        if (RAPOR_YAZAN.has(ad)) {
          for (const r of raporKimlikleri(girdi)) raporlar.add(r);
          if (ad === "rapora_yaz" && raporId && UUID.test(raporId)) raporlar.add(raporId);
        }
      } else if (m.role === "user" && b.type === "tool_result" && hataliSonuc(b)) {
        const n = sira.get(String(b.tool_use_id ?? ""));
        if (n !== undefined) adimlar[n] = { ...adimlar[n]!, hata: true };
      }
    }
  }
  const kisa = adimlar.slice(0, 300);
  const hata = kisa.filter((a) => a.hata).length;
  const tur = raporlar.size ? "rapor" : (kisa.find((a) => !TUR_DISI.has(a.ad))?.ad ?? (kisa.length ? "okuma" : "soru"));
  return { soru, adimlar: kisa, raporlar: [...raporlar].slice(0, 200), duzeltme: DUZELTME.test(soru) || kisa.some((a) => a.ad === "geri_al"), hata, tur };
}

/** iş bitince: özet + raporların o andaki cevaplarının parmak izi (gece "S.A.Y'ın bıraktığı cevap elle değişti mi"ye bakar). Aynı iş ikinci kez yazılmaz */
export async function isKaydiYaz(db: Sorgulayici, isId: string, o: IsOzeti): Promise<void> {
  if (!UUID.test(isId)) return;
  const anlik = o.raporlar.length
    ? (await db.sorgu<{ a: Record<string, Record<string, string>> | null }>(
      `SELECT jsonb_object_agg(r.id::text, coalesce((SELECT jsonb_object_agg(e.k, md5(e.v::text)) FROM jsonb_each(r.cevaplar) e(k, v)), '{}'::jsonb)) AS a
         FROM rapor r WHERE r.id = ANY ($1::uuid[]) AND jsonb_typeof(r.cevaplar) = 'object'`, [o.raporlar])).rows[0]?.a ?? {}
    : {};
  await db.sorgu(
    `INSERT INTO say_is (is_id, soru, adimlar, raporlar, anlik, duzeltme, hata, tur) VALUES ($1::uuid, $2, $3::jsonb, $4::uuid[], $5::jsonb, $6, $7, $8)
     ON CONFLICT (firma_id, is_id) DO NOTHING`,
    [isId, o.soru, JSON.stringify(o.adimlar), o.raporlar, JSON.stringify(anlik), o.duzeltme, o.hata, o.tur.slice(0, 160)]);
}

/* ── gece: hafıza ── */
export interface Ornek { id: string; tur: string; soru: string; adimlar: string; istek: number | null; maliyet: number | null; zaman: string; rapor: number }
export interface OgrenmeVerisi {
  adaylar: { id: string; tur: string; soru: string; adimlar: IsAdimi[]; istek: number | null; maliyet: number | string | null; zaman: string; rapor: number }[];
  turler: { ad: string; kod: string | null; onek: string | null }[];
  adlar: string[];
  onceki: Ornek[] | null;
  puanlanan: number;
}
/** iş türü başına en çok bu kadar örnek */
export const ORNEK_EN_COK = 3;
/** hafıza metninin sınırı (karakter) — say_hafiza CHECK 12 000 */
export const HAFIZA_EN_COK = 6000;

/** adlar (müşteri, tesis, kişi) ve numaralar gizlenir: örnek başka bir işin ADINI taşımaz (K2 firma içinde de olsa); e-posta, uzun numara, seri */
export function maskele(metin: string, adlar: readonly string[]): string {
  let s = metin.replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "<e-posta>");
  /* uzun adlar önce (kısa ad uzunun parçasıysa uzun bütün gizlensin) */
  for (const ad of [...new Set(adlar.map((a) => a.trim()).filter((a) => a.length >= 3))].sort((a, b) => b.length - a.length)) {
    const kucuk = ad.toLocaleLowerCase("tr");
    let bas = 0, out = "", k: number;
    const alt = s.toLocaleLowerCase("tr");
    if (alt.length !== s.length) continue; // harf dönüşümü boyu değiştirdiyse (nadir) bu ad atlanır — yanlış yer gizlenmesin
    while ((k = alt.indexOf(kucuk, bas)) >= 0) {
      const once = k > 0 ? alt[k - 1]! : " ", sonra = alt[k + kucuk.length] ?? " ";
      if (/[\p{L}\d]/u.test(once) || /[\p{L}\d]/u.test(sonra)) { out += s.slice(bas, k + 1); bas = k + 1; continue; }
      out += s.slice(bas, k) + "<ad>"; bas = k + kucuk.length;
    }
    s = out + s.slice(bas);
  }
  return s.replace(/(?<![\p{L}\d])[\p{L}\d/-]*\d{4,}[\p{L}\d/-]*/gu, "<no>");
}
/** adımlar kısaltılmış dizi: art arda aynı işlem "×n" */
export function adimMetni(adimlar: readonly IsAdimi[]): string {
  const l: string[] = [];
  let son = "", n = 0;
  const bas = () => { if (son) l.push(n > 1 ? `${son} ×${n}` : son); };
  for (const a of adimlar) { const ad = a.ad + (a.hata ? " (hata)" : ""); if (ad === son) n++; else { bas(); son = ad; n = 1; } }
  bas();
  return l.join(" → ").slice(0, 600);
}
const sayi = (x: unknown): number | null => (x === null || x === undefined || x === "" ? null : Number.isFinite(Number(x)) ? Number(x) : null);
/** örnek seçimi: önceki örnekler + yeni iyi işler; iş türü başına en ucuz üç (eşitse yeni). Eski örnek ancak daha iyisi gelince düşer */
export function ornekSec(onceki: readonly Ornek[], adaylar: OgrenmeVerisi["adaylar"], adlar: readonly string[]): Ornek[] {
  const yeni: Ornek[] = adaylar.map((a) => ({ id: a.id, tur: a.tur.slice(0, 160), soru: maskele(a.soru, adlar).slice(0, 300), adimlar: adimMetni(a.adimlar ?? []),
    istek: sayi(a.istek), maliyet: sayi(a.maliyet), zaman: a.zaman, rapor: Number(a.rapor) || 0 }));
  const hepsi = new Map<string, Ornek>();
  for (const o of [...onceki, ...yeni]) hepsi.set(o.id, o);
  const tur = new Map<string, Ornek[]>();
  for (const o of hepsi.values()) tur.set(o.tur, [...(tur.get(o.tur) ?? []), o]);
  const l: Ornek[] = [];
  for (const [, x] of [...tur].sort(([a], [b]) => a.localeCompare(b, "tr"))) {
    l.push(...x.sort((a, b) => (a.maliyet ?? Infinity) - (b.maliyet ?? Infinity) || b.zaman.localeCompare(a.zaman)).slice(0, ORNEK_EN_COK));
  }
  return l;
}
const dolar = (m: number | null) => (m === null ? "" : ` · ${(m / 1e6).toFixed(3).replace(".", ",")} $`);
/** hafıza metni: alışkanlıklar (türler ve kod düzeni) + örnek işler. Boşsa "" (not gitmez) */
export function hafizaMetni(ornekler: readonly Ornek[], turler: OgrenmeVerisi["turler"]): string {
  const kodlu = turler.filter((t) => t.onek).map((t) => `${t.ad} (${t.onek}…)`);
  const satir: string[] = [];
  if (kodlu.length) satir.push(`Ekipman türleri ve bu firmanın kod düzeni: ${kodlu.join(", ")}.`);
  if (ornekler.length) {
    satir.push("Bu firmada düzeltmesiz bitmiş örnek işler (benzer işte aynı yoldan başla; ekrandaki formatı ve kullanıcının bu konuşmadaki isteğini esas al):");
    ornekler.forEach((o, i) => satir.push(`${i + 1}. ${o.tur}${o.rapor ? ` — ${o.rapor} rapor` : ""}${o.istek ? ` — ${o.istek} istek` : ""}${dolar(o.maliyet)}. `
      + `İstek: "${o.soru.replace(/\s+/g, " ")}". Adımlar: ${o.adimlar || "—"}.`));
  }
  if (!satir.length) return "";
  let m = ["S.A.Y hafızası (bu firmanın geçmiş işlerinden kendiliğinden çıkarıldı; kullanıcının açık isteği her zaman önce gelir):", ...satir].join("\n");
  if (m.length > HAFIZA_EN_COK) m = `${m.slice(0, HAFIZA_EN_COK - 1)}…`;
  return m;
}
/** gece: veriden hafıza */
export function hafizaKur(v: OgrenmeVerisi): { metin: string; ornekler: Ornek[] } {
  const ornekler = ornekSec(v.onceki ?? [], v.adaylar ?? [], v.adlar ?? []);
  return { metin: hafizaMetni(ornekler, v.turler ?? []), ornekler };
}
/** gece adımı (firmanın kiracı işleminde, kişi bağlamı olmadan) */
export async function ogrenGece(db: Sorgulayici): Promise<{ puanlanan: number; ornek: number }> {
  const v = (await db.sorgu<{ v: OgrenmeVerisi | null }>("SELECT say_ogren_veri() AS v")).rows[0]?.v;
  if (!v) return { puanlanan: 0, ornek: 0 };
  const h = hafizaKur(v);
  await db.sorgu("SELECT say_hafiza_yaz($1, $2::jsonb)", [h.metin, JSON.stringify(h.ornekler)]);
  return { puanlanan: Number(v.puanlanan) || 0, ornek: h.ornekler.length };
}
/** konuşmanın başındaki not (yoksa null) */
export async function hafizaNotu(db: Sorgulayici): Promise<string | null> {
  const m = (await db.sorgu<{ metin: string }>("SELECT metin FROM say_hafiza")).rows[0]?.metin?.trim();
  return m ? m : null;
}
