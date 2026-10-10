/* EXCEL'DEN DOLDURMA — saf (484; reisim 2026-10-10: "test tablosu olarak kullanılan yerlere excelden yükle … aynı şekilde ekipman bilgilerinde de
   olsun"). Dosya tarayıcıda okunur (components/disa/oku.ts tabloOku — .xlsx / .csv); burada satırlar bölüme eşlenir. Değer alanın / sütunun türüne
   uymuyorsa yazılmaz (src/format/deger.ts alanDegeri — fotoğraftan okumayla aynı kural). Yazılanlar rapora ancak Kaydet ile geçer.
   · TABLO: başlık satırı (ilk 10 satırda en çok sütun adı eşleşen) sütun adlarıyla eşlenir — büyük / küçük harf, birim parantezi, noktalama
     önemsiz; "No" sütunu (satır numarası) yok sayılır; boş satır atlanır; en çok 300 satır.
   · ALANLAR (ekipman bilgileri, bilgi, test): her satırda ilk dolu hücre alanın adı, sonraki dolu hücre değeri ("Alan | Değer"); adı tanınmayan
     satır listede söylenir.
   Şablon: tablonun sütun başlıkları ya da alan adları alt alta (Değer sütunu boş) — denetçi doldurup yükler. */
import { alanDegeri, type OkunacakAlan } from "../../format/deger.ts";
import { raporDuzeni, sabitEkipmanAlanlari } from "../../format/duzen.ts";
import { EKIPMAN_ALAN_ADI, EKIPMAN_ALANLARI, type BolumOf, type EkipmanAlani, type FormatTanimi } from "../../format/tanim.ts";

export const EXCEL_EN_COK_SATIR = 300;
type Sutun = BolumOf<"olcum">["sutunlar"][number];
const norm = (s: string) => s.toLocaleLowerCase("tr").replace(/\([^)]*\)/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** sütunun Excel'deki değeri → tablodaki değer (türüne uymuyorsa null) */
const sutunDegeri = (s: Sutun, ham: string, bugun: Date) =>
  alanDegeri({ tur: s.giris === "sayi" ? "sayi" : s.giris === "evet" ? "evet" : s.giris === "secim" ? "secim" : "metin", uzun: 120, secenekler: s.secenekler }, ham, bugun);

export interface TabloExceli { satirlar: Record<string, string>[]; eslesen: string[]; eslesmeyen: string[]; atlanan: number }

export function tabloExceli(ham: readonly (readonly string[])[], sutunlar: readonly Sutun[], bugun = new Date()): TabloExceli {
  const adlar = new Map(sutunlar.map((s) => [norm(s.ad), s] as const));
  const eslesme = (r: readonly string[]) => r.map((h) => adlar.get(norm(String(h ?? ""))) ?? null);
  let bas = -1, en = 0;
  for (let i = 0; i < Math.min(ham.length, 10); i++) {
    const n = eslesme(ham[i]).filter(Boolean).length;
    if (n > en) { en = n; bas = i; }
  }
  if (bas < 0) return { satirlar: [], eslesen: [], eslesmeyen: [], atlanan: 0 };
  const sira = eslesme(ham[bas]);
  const eslesmeyen = ham[bas].map((h, i) => (sira[i] ? "" : String(h ?? "").trim())).filter((h) => h && norm(h) !== "no");
  const satirlar: Record<string, string>[] = [];
  let atlanan = 0;
  for (const r of ham.slice(bas + 1)) {
    if (satirlar.length >= EXCEL_EN_COK_SATIR) break;
    const s: Record<string, string> = {};
    let dolu = false;
    sira.forEach((c, i) => {
      const v = String(r[i] ?? "").trim();
      if (!c || !v) return;
      dolu = true;
      const d = sutunDegeri(c, v, bugun);
      if (d !== null) s[c.id] = d;
    });
    if (!dolu) continue;
    if (Object.keys(s).length) satirlar.push(s); else atlanan++;
  }
  return { satirlar, eslesen: sutunlar.filter((s) => sira.includes(s)).map((s) => s.ad), eslesmeyen, atlanan };
}

export interface AlanExceli { degerler: { alan: string; ad: string; deger: string }[]; eslesmeyen: string[]; gecersiz: string[] }

export function alanExceli(ham: readonly (readonly string[])[], alanlar: readonly OkunacakAlan[], bugun = new Date()): AlanExceli {
  const adlar = new Map(alanlar.map((a) => [norm(a.ad), a] as const));
  const degerler: AlanExceli["degerler"] = [], eslesmeyen: string[] = [], gecersiz: string[] = [];
  for (const r of ham.slice(0, EXCEL_EN_COK_SATIR)) {
    const dolu = r.map((h) => String(h ?? "").trim()).filter(Boolean);
    if (dolu.length < 2) continue;
    const [ad, ham2] = dolu, a = adlar.get(norm(ad));
    if (!a) { if (!["alan", "alan adı", "bilgi"].includes(norm(ad))) eslesmeyen.push(ad); continue; }
    if (degerler.some((x) => x.alan === a.id)) continue;
    const d = alanDegeri(a, ham2, bugun);
    if (d === null) gecersiz.push(a.ad); else degerler.push({ alan: a.id, ad: a.ad, deger: d });
  }
  return { degerler, eslesmeyen, gecersiz };
}

/** şablon satırları: tablo → başlık satırı; alanlar → "Alan | Değer" + her alan bir satır */
export const tabloSablonu = (sutunlar: readonly Sutun[]) => [sutunlar.map((s) => (s.birim ? `${s.ad} (${s.birim})` : s.ad))];
export const alanSablonu = (alanlar: readonly OkunacakAlan[]) => [["Alan", "Değer"], ...alanlar.map((a) => [a.ad, ""])];

/* ── OKUNACAK / YÜKLENECEK ALANLAR — sunucu (raporlar.ts alanOkunabilir) ve ekran (SahaRaporu, Bloklar) AYNI listeyi kullanır ── */
/** ekipman bilgisinin en çok uzunlukları (sema.ts EkipmanBilgisi ile aynı) */
export const EKIPMAN_UZUN: Record<EkipmanAlani, number> = { marka: 40, model: 40, seri: 30, imal: 4, konum: 60, amac: 120, bolum: 60 };
const ekipmanAlani = (k: EkipmanAlani, ad: string): OkunacakAlan => (k === "imal" ? { id: k, ad, tur: "yil", uzun: 4 } : { id: k, ad, tur: "metin", uzun: EKIPMAN_UZUN[k] });

/** bilgi bölümünün doldurulabilen alanları — kayıttan gelen ve çok seçimli alan hariç; ekipman kaydına bağlı alan EkipmanBilgisi anahtarıyla */
export function bilgiAlanlari(b: BolumOf<"bilgi">): OkunacakAlan[] {
  return b.alanlar.flatMap((a): OkunacakAlan[] => {
    if (a.kaynak || a.tur === "coklu") return [];
    if (a.ekipman) return [ekipmanAlani(a.ekipman, a.ad)];
    return [{ id: a.id, ad: a.birim ? `${a.ad} (${a.birim})` : a.ad, tur: a.tur === "secim" || a.tur === "evet" || a.tur === "tarih" || a.tur === "sayi" ? a.tur : "metin",
      uzun: 500, secenekler: a.secenekler, birim: a.birim }];
  });
}
/** test bölümünün değerleri */
export const testAlanlari = (b: BolumOf<"test">): OkunacakAlan[] => b.degerler.map((d) => ({
  id: d.id, ad: d.birim ? `${d.ad} (${d.birim})` : d.ad, tur: d.secenekler?.length ? "secim" : d.metin ? "metin" : "sayi", uzun: d.metin ? 60 : 12,
  secenekler: d.secenekler, birim: d.birim }));
/** 2. bölüm (ekipman bilgileri): formatın tam ekipman bölümü varsa onun alanları, yoksa ekranda kayıttan başlayan sabit satırlar */
export function ekipmanAlanlari(t: FormatTanimi): { tam: BolumOf<"bilgi"> | null; baslik: string; alanlar: OkunacakAlan[] } {
  const d = raporDuzeni(t, false);
  if (d.tam) return { tam: d.tam, baslik: d.tam.ad, alanlar: bilgiAlanlari(d.tam) };
  return { tam: null, baslik: d.ekipmanBaslik, alanlar: sabitEkipmanAlanlari(t).map((k) => ekipmanAlani(k, EKIPMAN_ALAN_ADI[k])) };
}
/** ekipman bilgisinin anahtarı mı (değeri raporun ekipman bilgisinde) */
export const ekipmanAnahtari = (id: string): id is EkipmanAlani => (EKIPMAN_ALANLARI as readonly string[]).includes(id);
