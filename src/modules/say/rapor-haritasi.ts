/* S.A.Y RAPOR HARİTASI (550; sunum 546 K6 — reisim 2026-10-14: "S.A.Y. de herhangi bir kısıt kural vb olmasını istemiyorum oradan direk haiku ile
   konuşmak aynı claude kullanır gibi oradan onu kullanabilmek istiyorum"; karar "diğer önerilerini kabul ediyorum") — saf. 384'teki özetin
   (yalnız adlar ve sayılar) yerine: açık raporun YAZILABİLİR yerleri, kimlikleriyle ve ŞU ANKİ değerleriyle (kaydedilmemiş değişiklikler dahil).
   Haiku istenen girişi "rapora_yaz" aracıyla bu kimliklerle verir; ekran uygular (raporlar/say-doldur.ts komutlariUygula — aynı kimlikler; kilit
   tests/say-rapor-haritasi.test.ts: haritadaki her yer uygulanır). Künye (firma, müşteri, tesis, adres, SGK, İSG-KATİP, rapor no) GİTMEZ —
   rapora yazmak için gerekmez. Çok büyük raporda metin sınırlı (tablonun fazla satırları sayıyla). */
import { Cevaplar, type FormatTanimi } from "../../format/tanim.ts";
import type { OkunacakAlan } from "../../format/deger.ts";
import { bilgiAlanlari, ekipmanAlanlari, ekipmanAnahtari, testAlanlari } from "../raporlar/doldur.ts";

/** haritanın en çok uzunluğu (karakter) ve tablo başına gösterilen satır */
export const HARITA_SINIRI = 60_000;
const TABLO_SATIR = 120;
const tirnak = (s: string) => (s ? `"${s.replace(/\s+/g, " ").slice(0, 300)}"` : "—");
const tur = (a: Pick<OkunacakAlan, "tur" | "secenekler" | "birim">) => a.tur === "secim" ? `seçim: ${(a.secenekler ?? []).join(" / ")}`
  : a.tur === "evet" ? "evet / hayır" : a.tur === "tarih" ? "tarih" : a.tur === "yil" ? "yıl" : a.tur === "sayi" ? `sayı${a.birim ? `, ${a.birim}` : ""}` : "yazı";

export interface CanliRapor { cevaplar: unknown; ekipman: unknown }

/** canlı cevaplar şemaya uymuyorsa null (bağlam eklenmez) */
export function raporHaritasi(t: FormatTanimi, turAd: string, canli: CanliRapor): string | null {
  const g = Cevaplar.safeParse(canli.cevaplar);
  if (!g.success) return null;
  const c = g.data;
  const ekipmanDegeri = (id: string) => {
    const e = canli.ekipman && typeof canli.ekipman === "object" ? (canli.ekipman as Record<string, unknown>)[id] : undefined;
    return typeof e === "string" ? e : "";
  };
  const alanDegeri = (id: string) => (ekipmanAnahtari(id) ? ekipmanDegeri(id) : (() => { const v = c.alan[id]; return Array.isArray(v) ? v.join(", ") : v ?? ""; })());
  const satir = (yer: string, a: Pick<OkunacakAlan, "ad" | "tur" | "secenekler" | "birim">, deger: string) => `- ${yer} · ${a.ad} (${tur(a)}) = ${tirnak(deger)}`;
  const l: string[] = [`Ekipman türü: ${turAd.slice(0, 160)}.`, "Raporun yazılabilir yerleri (yer kimliği · ad (tür) = şu anki değer; — boş):"];
  const ekipman = ekipmanAlanlari(t);
  if (ekipman.alanlar.length) {
    l.push(`## ${ekipman.baslik}`);
    for (const a of ekipman.alanlar) l.push(satir(`e:${a.id}`, a, alanDegeri(a.id)));
  }
  let sonucVar = false, notVar = false;
  for (const b of t.bolumler) {
    if (b.blok === "bilgi" && b.id !== ekipman.tam?.id) {
      const alanlar = bilgiAlanlari(b);
      if (!alanlar.length) continue;
      l.push(`## ${b.ad}`);
      for (const a of alanlar) l.push(satir(ekipmanAnahtari(a.id) ? `e:${a.id}` : `a:${a.id}`, a, alanDegeri(a.id)));
    } else if (b.blok === "test") {
      l.push(`## ${b.ad}`);
      for (const a of testAlanlari(b)) l.push(satir(`d:${a.id}`, a, c.deger[a.id] ?? ""));
    } else if (b.blok === "olcum") {
      const sutunlar = b.sutunlar.filter((s) => !s.formul);
      l.push(`## ${b.ad} — tablo; hücre kimliği t:${b.id}:<satır no>:<sütun kimliği> (satır 1'den; son satırdan sonraki numara yeni satır açar)`);
      l.push(`Sütunlar: ${sutunlar.map((s) => `${s.id} = ${s.ad}${s.birim ? ` (${s.birim})` : ""} [${s.giris === "secim" ? `seçim: ${(s.secenekler ?? []).join(" / ")}` : s.giris === "evet" ? "evet / hayır" : s.giris === "sayi" ? "sayı" : "yazı"}]`).join("; ")}`);
      const satirlar = c.tablo[b.id] ?? [];
      if (!satirlar.length) l.push("- satır yok");
      satirlar.slice(0, TABLO_SATIR).forEach((s, i) => l.push(`- ${i + 1}. satır: ${sutunlar.map((x) => `${x.id}=${tirnak(s[x.id] ?? "")}`).join(", ")}`));
      if (satirlar.length > TABLO_SATIR) l.push(`- … ve ${satirlar.length - TABLO_SATIR} satır daha`);
    } else if (b.blok === "liste") {
      l.push(`## ${b.ad} — kontrol listesi; madde cevabı m:<kimlik> (${b.cevaplar.join(" / ")}), kusur açıklaması m:<kimlik>#not, derecesi m:<kimlik>#derece (hafif / ağır)`);
      for (const gr of b.gruplar) for (const m of gr.maddeler) {
        const x = c.madde[m.id];
        l.push(`- m:${m.id} · ${m.metin.slice(0, 200)} = ${x?.c ? tirnak(x.c) : "—"}${x?.derece ? ` (${x.derece === "agir" ? "ağır" : "hafif"} kusur)` : ""}${x?.not ? ` not ${tirnak(x.not)}` : ""}`);
      }
    } else if (b.blok === "sonuc") sonucVar = true;
    else if (b.blok === "not") notVar = true;
  }
  if (sonucVar) l.push("## Sonuç", `- sonuc · Sonuç (uygun / uygun değil) = ${c.sonuc === "uygun" ? "\"uygun\"" : c.sonuc === "uygun_degil" ? "\"uygun değil\"" : "—"}`);
  if (notVar) l.push("## Uzman yorumu", `- yorum · Muayene uzmanının yorumu (yazı) = ${tirnak(c.yorum)}`);
  const metin = l.join("\n");
  return metin.length > HARITA_SINIRI ? `${metin.slice(0, HARITA_SINIRI)}\n… (rapor uzun; geri kalanı kısaltıldı)` : metin;
}
