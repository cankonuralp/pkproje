/* S.A.Y RAPOR ÖZETİ (384; ARKA-UC §5.3 "Ne bilir: o raporun alanları, türün kriterleri ve formatı", §5.4 "gönderilen veri en aza") — saf. Ekranın
   canlı cevapları (kaydedilmemiş değişiklikler dahil) şemadan geçer, format motoruyla değerlendirilir; yapay zekâya giden metin YALNIZ formatın
   kendi adları (madde, ölçüm satırı, alan adları), seçenekler ve sayılardır. Serbest metin (kusur açıklaması, not, bilgi alanlarının değerleri —
   seri no, kullanım yeri …) ve künye (firma, müşteri, tesis, adres, SGK, İSG-KATİP, rapor no) GİTMEZ. Liste uzunlukları sınırlı. */
import { degerlendir } from "../../format/motor.ts";
import { Cevaplar, type FormatTanimi } from "../../format/tanim.ts";

const EN_COK = 15;
const kisa = (s: string) => (s.length > 160 ? `${s.slice(0, 157)}…` : s);
const listele = (l: readonly string[]) => (l.length > EN_COK ? [...l.slice(0, EN_COK).map(kisa), `… ve ${l.length - EN_COK} tane daha`] : l.map(kisa));

/** canlı cevaplar şemaya uymuyorsa null (bağlam eklenmez) */
export function raporOzeti(tanim: FormatTanimi, turAd: string, ham: unknown): string | null {
  const g = Cevaplar.safeParse(ham);
  if (!g.success) return null;
  const c = g.data, d = degerlendir(tanim, c);
  const listeBolumleri = tanim.bolumler.filter((b) => b.blok === "liste");
  let toplam = 0, cevaplanan = 0;
  const uygunDegil: string[] = [];
  for (const b of listeBolumleri) for (const gr of b.gruplar) for (const m of gr.maddeler) {
    toplam++;
    const x = c.madde[m.id];
    if (!x || !b.cevaplar.includes(x.c)) continue;
    cevaplanan++;
    if (x.c === b.cevaplar[1]) uygunDegil.push(`${b.ad} › ${m.metin}${x.derece === "agir" ? " (ağır kusur)" : x.derece === "hafif" ? " (hafif kusur)" : ""}`);
  }
  const listeIdleri = new Set(listeBolumleri.map((b) => b.id));
  const bolumu = new Map(tanim.bolumler.map((b) => [b.id, b]));
  /* ölçüm satırının etiketi kullanıcının yazdığı ilk hücredir (serbest metin) — yerine "Bölüm · N. satır"; test değerinin adı formatın kendisi */
  const sinirDisi = d.kusurlar.filter((k) => !listeIdleri.has(k.bolum)).map((k) => {
    const b = bolumu.get(k.bolum);
    return b?.blok === "olcum" ? `${b.ad} · ${Number(k.ref.split("#")[1] ?? 0) + 1}. satır` : k.kriter;
  });
  const sonuc = c.sonuc === "uygun" ? "Uygun" : c.sonuc === "uygun_degil" ? "Uygun değil" : "seçilmedi";
  return [
    `Ekipman türü: ${kisa(turAd)}. Formatın bölümleri: ${listele(tanim.bolumler.map((b) => b.ad)).join(", ")}.`,
    toplam ? `Kontrol maddeleri: ${cevaplanan} / ${toplam} cevaplandı.` : "",
    uygunDegil.length ? `“Uygun değil” işaretli maddeler: ${listele(uygunDegil).join("; ")}.` : "",
    sinirDisi.length ? `Sınır dışı ölçüm / test: ${listele(sinirDisi).join("; ")}.` : "",
    d.eksikler.length ? `Boş zorunlu alanlar (${d.eksikler.length}): ${listele(d.eksikler.map((e) => e.ad)).join("; ")}.` : "Zorunlu alanların hepsi dolu.",
    `Sonuç: ${sonuc}; kriterlere göre öneri: ${d.oneri === "uygun" ? "Uygun" : "Uygun değil"}.`,
  ].filter(Boolean).join("\n");
}
