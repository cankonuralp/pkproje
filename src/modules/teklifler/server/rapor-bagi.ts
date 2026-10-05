/* RAPOR ↔ TEKLİF BAĞI VE BİRİM FİYAT (§3.2 madde 5; maket muhasebe.html MV.raporFiyat, teklifler.html MV.kalemRaporlari; 324 incelemesi "her
   rapor tek teklife"; 327 muhasebe). Bir rapor, tesisini kapsayan ve tarihi raporun açılış gününden sonra olmayan EN SON kabul edilmiş teklife
   bağlanır (tarih, sonra numara). Birim fiyat: o teklifte raporun türünün kalemi varsa ve rapor o kalemin adedi içindeyse (teklife bağlanan aynı
   türden raporlar açılış sırasıyla) kalemin fiyatı — "teklif"; adedi aşan ya da kalemi olmayan — "teklif dışı", fiyat listesinden; teklif yoksa
   "fiyat listesi". Fiyat listesinde olmayan türün fiyatı null. Teklifler modülünün içinde (teklif tablolarına yalnız bu modül dokunur); Raporlar'ın
   ve Muhasebe'nin teklif-baglanti.ts'inden okur. Yetki ÇAĞIRANDA.
   324–327 incelemesi: FATURALANMIŞ raporun bağı, fiyatı ve kaynağı faturadakidir (kayıt anında yazıldı, değişmez) — sonradan kabul edilen
   yenileme teklifi faturalı raporu kendine çekmez. Kalem adedini önce faturada "teklif" fiyatıyla yazılmış raporlar tüketir; kalan adet
   faturalanmamış raporlara dağıtılır: önce imzalılar, sonra imza bekleyenler (açılış sırasıyla). İmzasız ya da sonradan silinen rapor, imzalı
   raporun teklif fiyatını elinden almaz. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { faturaliRaporlar } from "../../muhasebe/server/teklif-baglanti.ts";
import { teklifRaporlari, type TeklifRaporu } from "../../raporlar/server/teklif-baglanti.ts";

export type FiyatKaynagi = "teklif" | "disi" | "liste";
export interface RaporBagi extends TeklifRaporu {
  teklif: { id: string; no: string } | null;
  /** KURUŞ, KDV hariç; fiyat listesinde yoksa null */
  fiyat: number | null;
  kaynak: FiyatKaynagi;
}

/** tür → fiyat listesindeki birim fiyat (KURUŞ) */
export async function fiyatListesi(db: Sorgulayici): Promise<Map<string, number>> {
  return new Map((await db.sorgu<{ tur_id: string; fiyat: string }>("SELECT tur_id::text, fiyat::text FROM fiyat_listesi")).rows.map((x) => [x.tur_id, Number(x.fiyat)]));
}

/** tesislerdeki (ve onları kapsayan kabul edilmiş tekliflerin bütün tesislerindeki) raporların bağı ve fiyatı: rapor kimliği → bağ */
export async function raporBaglari(db: Sorgulayici, tesisler: readonly string[]): Promise<Map<string, RaporBagi>> {
  const t = (await db.sorgu<{ id: string; no: string; tarih: string; tesisler: string[] | null; kalemler: { tur: string; adet: number; fiyat: string }[] | null }>(
    `SELECT t.id::text, t.no, t.tarih::text,
        (SELECT array_agg(s.tesis_id::text) FROM teklif_tesis s WHERE s.firma_id = t.firma_id AND s.teklif_id = t.id) AS tesisler,
        (SELECT json_agg(json_build_object('tur', k.tur_id::text, 'adet', k.adet, 'fiyat', k.fiyat::text)) FROM teklif_kalem k
          WHERE k.firma_id = t.firma_id AND k.teklif_id = t.id) AS kalemler
     FROM teklif t WHERE t.durum = 'kabul'
       AND EXISTS (SELECT 1 FROM teklif_tesis s WHERE s.firma_id = t.firma_id AND s.teklif_id = t.id AND s.tesis_id = ANY ($1::uuid[]))`, [[...tesisler]])).rows
    .map((x) => ({ id: x.id, no: x.no, tarih: x.tarih, tesisler: x.tesisler ?? [], kalemler: (x.kalemler ?? []).map((k) => ({ tur: k.tur, adet: k.adet, fiyat: Number(k.fiyat) })) }));
  const hepsi = [...new Set([...tesisler, ...t.flatMap((x) => x.tesisler)])];
  const raporlar = await teklifRaporlari(db, hepsi, "1900-01-01");
  const liste = await fiyatListesi(db);
  /* bağ: tesisi kapsayan, tarihi açılış gününden sonra olmayan en son kabul (tarih, sonra numara) */
  const bagli = new Map<string, (typeof t)[number] | null>();
  for (const r of raporlar) {
    const aday = t.filter((x) => x.tesisler.includes(r.tesisId) && x.tarih <= r.gun)
      .sort((a, b) => (a.tarih === b.tarih ? a.no.localeCompare(b.no) : a.tarih.localeCompare(b.tarih))).at(-1) ?? null;
    bagli.set(r.raporId, aday);
  }
  /* faturalı raporlar: faturadaki bağ (teklif no teklif tablosundan) */
  const fatura = await faturaliRaporlar(db, raporlar.map((r) => r.raporId));
  const fNo = new Map(t.map((x) => [x.id, x.no]));
  const eksik = [...new Set([...fatura.values()].map((f) => f.teklifId).filter((x): x is string => !!x && !fNo.has(x)))];
  if (eksik.length) for (const x of (await db.sorgu<{ id: string; no: string }>("SELECT id::text, no FROM teklif WHERE id = ANY ($1::uuid[])", [eksik])).rows) fNo.set(x.id, x.no);
  /* kalem sırası: faturada teklif fiyatıyla yazılanlar adedi tüketir; kalan, faturalanmamışlara — imzalılar önce, açılış sırasıyla */
  const tuketilen = new Map<string, number>();
  for (const r of raporlar) {
    const f = fatura.get(r.raporId);
    if (f?.kaynak === "teklif" && f.teklifId) { const k = `${f.teklifId}|${r.turId}`; tuketilen.set(k, (tuketilen.get(k) ?? 0) + 1); }
  }
  const sira = new Map<string, number>();
  const grup = new Map<string, TeklifRaporu[]>();
  for (const r of raporlar) {
    const x = bagli.get(r.raporId);
    if (x && !fatura.has(r.raporId)) { const k = `${x.id}|${r.turId}`; grup.set(k, [...(grup.get(k) ?? []), r]); }
  }
  for (const [k, l] of grup) {
    const bas = tuketilen.get(k) ?? 0;
    l.sort((a, b) => (a.imzali !== b.imzali ? (a.imzali ? -1 : 1) : a.olustu === b.olustu ? a.raporId.localeCompare(b.raporId) : a.olustu.localeCompare(b.olustu)))
      .forEach((r, i) => sira.set(r.raporId, bas + i));
  }
  const out = new Map<string, RaporBagi>();
  for (const r of raporlar) {
    const f = fatura.get(r.raporId);
    if (f) {
      out.set(r.raporId, { ...r, teklif: f.teklifId ? { id: f.teklifId, no: fNo.get(f.teklifId) ?? "—" } : null, fiyat: f.fiyat, kaynak: f.kaynak });
      continue;
    }
    const x = bagli.get(r.raporId) ?? null, k = x?.kalemler.find((y) => y.tur === r.turId);
    const icinde = !!k && (sira.get(r.raporId) ?? 0) < k.adet;
    out.set(r.raporId, { ...r, teklif: x ? { id: x.id, no: x.no } : null, fiyat: icinde ? k!.fiyat : liste.get(r.turId) ?? null,
      kaynak: !x ? "liste" : icinde ? "teklif" : "disi" });
  }
  return out;
}
