/* DUYURU AYRIŞTIRICI (379) — saf: Bakanlık sayfalarının HTML'inden duyuru listesi (başlık, yayım tarihi, bağlantı). Sayfa yapısı değişince BOŞ
   liste döner (okuma işi bunu "okunamadı" sayar, Ana sayfa "alınamadı" der — sessiz kalmaz). Tarihi doğrulanamayan, bağlantısı Bakanlığın
   adresi olmayan duyuru listeye girmez (pkproje §9 yirmi sekizinci tur). Bağlantı her zaman Bakanlığın asıl adresinden kurulur. */

export interface OkunanDuyuru { url: string; baslik: string; tarih: string }

/** kaynak başına en çok (veritabanı da kaynak başına en yeni 50'yi tutar) */
export const EN_COK = 50;

const ADLI: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " " };

/** HTML varlıkları: sayısal (&#246; &#xF6;) ve sık adlılar; bilinmeyen olduğu gibi kalır */
export function varlikCoz(s: string): string {
  return s.replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]{2,8});/gi, (t, k: string) => {
    if (k[0] === "#") {
      const n = k[1] === "x" || k[1] === "X" ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
      return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : t;
    }
    return ADLI[k.toLowerCase()] ?? t;
  });
}

/** etiketler atılır, varlıklar çözülür, boşluklar teke iner */
export function metin(html: string): string {
  return varlikCoz(html.replace(/<[^>]*>/g, " ")).replace(/[\s\u0000-\u001f\u007f ]+/g, " ").trim();
}

const AYLAR: Record<string, number> = {
  ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6, temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12,
};

/** gerçek bir takvim günü, 2000'den sonra ve bugünden en çok 1 gün ileri → "YYYY-AA-GG"; değilse null */
export function tarihDogrula(gun: number, ay: number, yil: number, bugun: Date): string | null {
  if (!Number.isInteger(gun) || !Number.isInteger(ay) || !Number.isInteger(yil) || yil < 2000) return null;
  const t = new Date(Date.UTC(yil, ay - 1, gun));
  if (t.getUTCFullYear() !== yil || t.getUTCMonth() !== ay - 1 || t.getUTCDate() !== gun) return null;
  if (t.getTime() > bugun.getTime() + 86_400_000) return null;
  return `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
}

/** başlık: düz metin, sondaki noktalı virgül / iki nokta atılır, 3–300 karakter */
function baslikTemiz(html: string): string | null {
  const b = metin(html).replace(/[\s;:]+$/, "");
  return b.length >= 3 ? b.slice(0, 300) : null;
}

/** aynı bağlantı bir kez (ilk görülen) */
function tekil(liste: OkunanDuyuru[]): OkunanDuyuru[] {
  const gorulen = new Set<string>();
  return liste.filter((d) => !gorulen.has(d.url) && gorulen.add(d.url));
}

/** İSGGM / İSGÜM (www.csgb.gov.tr/<birim>/duyurular/): her öğe <a class="announcement-item-href" href="/<birim>/duyurular/<kod>/"> içinde gün,
    ay adı, yıl ve başlık (h1.title; yoksa title niteliği) */
export function csgbAyristir(html: string, birim: "isggm" | "isgum", bugun: Date): OkunanDuyuru[] {
  const yolDeseni = new RegExp(`^/${birim}/duyurular/[A-Za-z0-9-]{1,60}/?$`);
  const sonuc: OkunanDuyuru[] = [];
  for (const m of html.matchAll(/<a\b([^>]*\bclass="[^"]*\bannouncement-item-href\b[^"]*"[^>]*)>([\s\S]*?)<\/a>/g)) {
    if (sonuc.length >= EN_COK) break;
    const [, nit, ic] = m;
    const href = /\bhref="([^"]+)"/.exec(nit)?.[1];
    if (!href || !yolDeseni.test(href)) continue;
    const gun = /class="day"[^>]*>\s*(\d{1,2})\s*</.exec(ic)?.[1];
    const ay = /class="moon"[^>]*>\s*([^<]+?)\s*</.exec(ic)?.[1];
    const yil = /class="year"[^>]*>\s*(\d{4})\s*</.exec(ic)?.[1];
    const tarih = gun && ay && yil ? tarihDogrula(Number(gun), AYLAR[metin(ay).toLocaleLowerCase("tr-TR")] ?? 0, Number(yil), bugun) : null;
    const baslik = baslikTemiz(/<h1\b[^>]*\bclass="title"[^>]*>([\s\S]*?)<\/h1>/.exec(ic)?.[1] ?? /\btitle="([^"]*)"/.exec(nit)?.[1] ?? "");
    if (!tarih || !baslik) continue;
    sonuc.push({ url: `https://www.csgb.gov.tr${href.endsWith("/") ? href : `${href}/`}`, baslik, tarih });
  }
  return tekil(sonuc);
}

/** iş ekipmanları portalı (isekipmanlari.csgb.gov.tr/sayfa.aspx?d=3): serbest metin — "GG.AA.YYYY >> Başlık" (eskilerde "GG/AA/YYYY") ve
    ardından duyurunun "detay.aspx?d=<no>" bağlantısı. Bir tarih işaretinden ötekine kadarki parça tek duyuru; başlık ilk bölüm sonuna ya da
    bağlantıya kadar ("… için tıklayınız" kuyruğu atılır); bağlantısı olmayan parça girmez. */
export function isekipmanAyristir(html: string, bugun: Date): OkunanDuyuru[] {
  const isaretler = [...html.matchAll(/(\d{2})[./](\d{2})[./](\d{4})(?:\s|&nbsp;)*(?:&gt;|>)\s*(?:&gt;|>)/g)];
  const sonuc: OkunanDuyuru[] = [];
  for (let i = 0; i < isaretler.length && sonuc.length < EN_COK; i++) {
    const m = isaretler[i];
    const parca = html.slice((m.index ?? 0) + m[0].length, isaretler[i + 1]?.index);
    const tarih = tarihDogrula(Number(m[1]), Number(m[2]), Number(m[3]), bugun);
    const no = /href="(?:https?:\/\/isekipmanlari\.csgb\.gov\.tr)?\/?detay\.aspx\?d=(\d{1,7})"/i.exec(parca)?.[1];
    const son = Math.min(...[parca.search(/<\/div>/i), parca.search(/<a\b/i), 600].filter((n) => n >= 0));
    const baslik = baslikTemiz(metin(parca.slice(0, son)).replace(/\s*(?:ilgili\s+)?(?:duyuru|detay)\s+için(?:\s+tıklayınız\.?)?\s*$/i, ""));
    if (!tarih || !no || !baslik) continue;
    sonuc.push({ url: `https://isekipmanlari.csgb.gov.tr/detay.aspx?d=${no}`, baslik, tarih });
  }
  return tekil(sonuc);
}
