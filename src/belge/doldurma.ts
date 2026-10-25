/* BELGE DOLDURMA — 2026-10-25 (belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir
   müşteri için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim"). Firmanın belge formatında (rapor şablonunun
   aracıyla kurulan serbest tablo) "alan" hücresi belgede ELLE DOLDURULAN yerdir: belge açılınca (sözleşme, teklif, zimmet …) kişi bu yerleri
   doldurur, değerler kayıt başına saklanır (göç 0105 belge_doldurma — hücre kimliği → değer), belge çizilirken hücreye basılır (belge.ts
   belgeFormu). Çoğalan satırdaki alan hücresi listenin her öğesinde tekrarlanır — tek değerle doldurulamaz, elle yerlere girmez.
   · elleAlanlari: formatın elle doldurulan yerleri, okuma sırasıyla (tablo tablo, satır satır); adı hücrenin adı ya da solundaki / üstündeki yazı
     (format/tablo.ts hucreEtiketi — sahadaki adla aynı), varsayılanı formülün boş belgedeki değeri (formül her açılışta yeniden hesaplanır: boş
     bırakılan yerde belgede formülün değeri basılır).
   · elleDegerleriDenetle: gelen değerler yalnız bu yerlerin kimlikleri, her biri yazı (en çok 2000 karakter), türüne göre saklanan biçime çevrilir
     (sayı virgül ondalıklı, tarih YYYY-AA-GG, seçim seçeneklerden biri, evet / hayır "evet" · "hayir" — format/deger.ts, saha ekranıyla aynı);
     boş değer saklanmaz; toplam veritabanının sınırı (200 000 bayt) içinde. Zorunlu yerin boşluğu kaydı DURDURMAZ (kural uyarıdır) —
     eksikElleAlanlar gönderen modülün uyarısı için.
   SAF (veritabanısız; doldurma penceresinde tarayıcıda da koşar). Kilit tests/belge-doldurma.test.ts. */
import { alanDegeri } from "../format/deger.ts";
import { formulUygula } from "../format/formul.ts";
import { hucreEtiketi, kapsama } from "../format/tablo.ts";
import { Cevaplar, type FormatTanimi, type HucreAlanTuru } from "../format/tanim.ts";

export interface ElleAlan { id: string; ad: string; alan: HucreAlanTuru; birim?: string; secenekler?: string[]; varsayilan?: string; zorunlu?: boolean }

/** tek değerin en çok uzunluğu (Cevaplar.alan ile aynı) */
export const ELLE_DEGER_EN_UZUN = 2000;
/** saklanan değerlerin en çok boyu — göç 0105'in octet_length(degerler::text) sınırı */
export const ELLE_TOPLAM_EN_COK = 200_000;
/** girdide en çok bu kadar anahtar (hepsi yer kimliği olmalı; fazlası okunmaz) */
const ANAHTAR_EN_COK = 2000;

const bayt = (s: string) => new TextEncoder().encode(s).length;

/** formatın elle doldurulan yerleri (serbest tabloların çoğalmayan satırlarındaki "alan" hücreleri), okuma sırasıyla */
export const elleAlanlari = (t: FormatTanimi): ElleAlan[] => yerler(t, true);

/** yerler; varsayilanli: formülün boş belgedeki değeri de (denetim ve çizim için gerekmez — formül hesaplanmaz) */
function yerler(t: FormatTanimi, varsayilanli: boolean): ElleAlan[] {
  /* formülün boş belgedeki değeri — yalnız formüllü yer varsa hesaplanır */
  let formul: Record<string, string | string[]> | null = null;
  const formulDegeri = (id: string): string | undefined => {
    if (formul === null) { try { formul = formulUygula(t, Cevaplar.parse({})).alan; } catch { formul = {}; } }
    const v = formul[id];
    const s = Array.isArray(v) ? v.join(", ") : v;
    return s && s.trim() ? s : undefined;
  };
  const l: ElleAlan[] = [];
  const gorulen = new Set<string>();
  for (const b of t.bolumler) {
    if (b.blok !== "tablo") continue;
    const g = kapsama(b), tekrar = new Set(b.satirlar.flatMap((s, r) => (s.tekrar ? [r] : [])));
    for (const h of [...b.hucreler].sort((x, y) => x.r - y.r || x.c - y.c)) {
      if (h.tur !== "alan" || !h.id || tekrar.has(h.r) || gorulen.has(h.id)) continue;
      gorulen.add(h.id);
      const varsayilan = varsayilanli && h.formul ? formulDegeri(h.id) : undefined;
      l.push({
        id: h.id, ad: hucreEtiketi(b, h, g) || `Yer ${l.length + 1}`, alan: h.alan ?? "metin",
        ...(h.birim ? { birim: h.birim } : {}), ...(h.alan === "secim" && h.secenekler?.length ? { secenekler: [...h.secenekler] } : {}),
        ...(varsayilan ? { varsayilan } : {}), ...(h.zorunlu ? { zorunlu: true } : {}),
      });
    }
  }
  return l;
}

/** girilen değeri yerin türüne göre saklanan biçime çevirir; boşsa null; türüne uymuyorsa hata iletisi */
function cevir(a: ElleAlan, ham: string): { deger: string | null } | { hata: string } {
  if (a.alan === "metin") {
    /* çok satırlı yazı: satır sonları kalır, öteki denetim karakterleri boşluk olur */
    const d = ham.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").trim();
    return { deger: d || null };
  }
  if (!ham.trim()) return { deger: null };
  const d = alanDegeri({ tur: a.alan, secenekler: a.secenekler, uzun: ELLE_DEGER_EN_UZUN }, ham, new Date());
  if (d !== null) return { deger: d };
  switch (a.alan) {
    case "sayi": return { hata: "Sayı yazın." };
    case "tarih": return { hata: "Geçerli bir tarih yazın (GG.AA.YYYY)." };
    case "secim": return { hata: "Seçeneklerden birini seçin." };
    case "evet": return { hata: "Evet ya da hayır seçin." };
  }
}

/** elle doldurulan yerlerin değerlerini denetler ve saklanan biçime çevirir (boşlar düşer). Hatalar yer kimliğiyle; girdinin kendisindeki hata
    "degerler" anahtarında. */
export function elleDegerleriDenetle(t: FormatTanimi, girdi: unknown):
  { tamam: true; degerler: Record<string, string> } | { tamam: false; hatalar: Record<string, string> } {
  const genel = (ileti: string) => ({ tamam: false as const, hatalar: { degerler: ileti } });
  if (typeof girdi !== "object" || girdi === null || Array.isArray(girdi)) return genel("Değerler okunamadı.");
  const proto = Object.getPrototypeOf(girdi);
  if (proto !== Object.prototype && proto !== null) return genel("Değerler okunamadı.");
  const girisler = Object.entries(girdi as Record<string, unknown>);
  if (girisler.length > ANAHTAR_EN_COK) return genel("Değerler okunamadı.");
  const yer = new Map(yerler(t, false).map((a) => [a.id, a] as const));
  /* Map → Object.fromEntries: "__proto__" gibi anahtar da kendi özelliği olur (nesnenin önüne geçmez) */
  const hatalar = new Map<string, string>(), degerler = new Map<string, string>();
  for (const [k, v] of girisler) {
    const a = yer.get(k);
    if (!a) { hatalar.set(k, "Formda böyle bir yer yok."); continue; }
    if (v === null || v === undefined) continue;
    if (typeof v !== "string") { hatalar.set(k, "Değer yazı olmalı."); continue; }
    if (v.length > ELLE_DEGER_EN_UZUN) { hatalar.set(k, `En çok ${ELLE_DEGER_EN_UZUN} karakter.`); continue; }
    const c = cevir(a, v);
    if ("hata" in c) hatalar.set(k, c.hata);
    else if (c.deger !== null) degerler.set(k, c.deger);
  }
  if (hatalar.size) return { tamam: false, hatalar: Object.fromEntries(hatalar) };
  const sonuc = Object.fromEntries(degerler);
  /* veritabanı jsonb'yi her ":" ve "," ardına boşlukla yazar — anahtar başına iki bayt payı */
  if (bayt(JSON.stringify(sonuc)) + 2 * degerler.size > ELLE_TOPLAM_EN_COK) return genel("Değerler çok uzun (toplam en çok 200 KB).");
  return { tamam: true, degerler: sonuc };
}

/** zorunlu olup boş kalan yerler (değeri ve formülden varsayılanı yok) — gönderen modülün uyarısı; kaydı durdurmaz */
export function eksikElleAlanlar(t: FormatTanimi, degerler: Readonly<Record<string, string>> | null | undefined): ElleAlan[] {
  return elleAlanlari(t).filter((a) => a.zorunlu && !a.varsayilan && !(degerler?.[a.id] ?? "").trim());
}

/** belgeye basılacak cevaplar: yalnız formatın elle yerleri, yazı ve sınır içinde (saklanmış ya da pencerede girilmekte olan değerler) */
export function elleCevaplari(t: FormatTanimi, elle: Readonly<Record<string, unknown>> | null | undefined): Record<string, string> {
  if (!elle) return {};
  const kimlik = new Set(yerler(t, false).map((a) => a.id));
  return Object.fromEntries(Object.entries(elle).filter((g): g is [string, string] =>
    kimlik.has(g[0]) && typeof g[1] === "string" && g[1].length <= ELLE_DEGER_EN_UZUN && g[1].trim() !== ""));
}
