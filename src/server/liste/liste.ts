/* SUNUCUDA SAYFALI LİSTE (566; 09-B3 "her liste sunucuda sayfalı", ARKA-UC §2.3; reisim 2026-10-15: "sitede donma yaşanabilecek şeyler …" →
   analiz: listeler firmanın BÜTÜN kayıtlarını tarayıcıya indirip orada süzüyordu → "elindeki bütün işleri yap").
   Tarayıcıdaki süzgecin (components/liste/suzgec.ts listele) SQL karşılığı — aynı anlam, aynı sonuç:
   · genel arama ve alan aramaları: Türkçe küçük harfe çevrilmiş metinde "içerir" (tr_kucuk, göç 0092);
   · seçiciler (her biri kendi koşulu; "tumu" koşulsuz), çipler ("veya" / "ve"); çip sayıları çipler HARİÇ her şey uygulanmış kümeden;
   · görünüm anahtarı (bas'lı seçici) toplamın içinde; sıralama Türkçe harf sırasıyla (tr_sira, "C" harmanı);
   · sayfa sayıyı aşarsa sona çekilir; yalnız o sayfanın satırları döner.
   Kaynak (FROM … JOIN …) ve ifadeler listenin modülünde; başka modülün tablosu o modülün dışa açtığı parçayla (…_SQL) okunur. Görme yetkisi
   kaynağın koşuluyla (yetki/canDo.ts gorusKosulu) — tarayıcıdan gelen hiçbir şey koşul olmaz, değerler parametre. */
import type { Sorgulayici } from "../db/kiraci.ts";
import { listele, yeniDurum, type Secenek, type SunucuListe, type SuzgecDurumu, type SuzgecTanimi } from "../../components/liste/suzgec.ts";
import { z } from "zod";

/** parametre ekleyici: değeri ekler, yer tutucusunu ($n) döndürür */
export type Ekle = (deger: unknown) => string;

export interface ListeKaynagi {
  /** FROM … (JOIN …) — WHERE'siz */
  kaynak: string;
  /** satırın SELECT listesi */
  secim: string;
  /** genel arama: metin ifadeleri (boş olabilir) — birleşiminde aranır */
  metin: readonly string[];
  /** alan alan arama: alan → metin ifadesi */
  alanlar: Readonly<Record<string, string>>;
  /** çip → mantıksal ifade */
  cipler: Readonly<Record<string, string>>;
  /** seçici → koşul ("tumu" için çağrılmaz); null: koşul yok. gorunum: başlangıç değerli görünüm anahtarı (toplamın içinde). secenek: seçenekler
      görme kümesinden (değer, etiket ifadeleri; sıra etikete göre Türkçe ya da değere göre azalan) */
  seciciler: Readonly<Record<string, { kosul: (deger: string, ekle: Ekle) => string | null; gorunum?: boolean;
    secenek?: { deger: string; etiket: string; sira?: "etiket" | "deger-azalan" } }>>;
  /** sıralama sütunu → ifade (metinse tr_sira(…) — "C" harmanı eklenir) */
  sira: Readonly<Record<string, { ifade: string; metin?: boolean }>>;
  /** varsayılan ORDER BY (yönüyle) */
  varsayilanSira: string;
  /** sıralama seçicisinin anahtarı (varsa) */
  siraSecici?: string;
  sayfa: number;
}

/** tarayıcıdan gelen süzgeç durumu: biçim ve uzunluk denetimi (koşula değer olarak girer) */
const metin = z.string().max(200);
export const SuzgecDurumuSemasi = z.object({
  ara: metin.default(""),
  secili: z.array(z.string().max(40)).max(40).default([]),
  kip: z.enum(["veya", "ve"]).default("veya"),
  sec: z.record(z.string().max(40), z.string().max(80)).default({}),
  sayfa: z.number().int().min(1).max(1_000_000).default(1),
  alan: z.record(z.string().max(40), metin).default({}),
});

/** Türkçe küçük harf (tarayıcının toLocaleLowerCase("tr") karşılığı; veritabanında tr_kucuk) */
export const trKucuk = (s: string) => s.toLocaleLowerCase("tr");

/** sorguyu kurar ve koşar; gorus: kaynağın görme koşulu (yetki) ve kendi parametreleri ile */
export async function listeGetir<K>(db: Sorgulayici, k: ListeKaynagi, gorus: { sql: string; p: readonly unknown[] }, d0: unknown): Promise<SunucuListe<K>> {
  const g = SuzgecDurumuSemasi.safeParse(d0);
  const d: SuzgecDurumu = g.success ? g.data : SuzgecDurumuSemasi.parse({});
  const p: unknown[] = [...gorus.p];
  const ekle: Ekle = (x) => { p.push(x); return `$${p.length}`; };
  const icerir = (ifade: string, aranan: string) => `strpos(tr_kucuk(coalesce(${ifade}, '')), ${ekle(trKucuk(aranan))}) > 0`;

  const goruntu: string[] = [`(${gorus.sql})`];
  for (const [ad, s] of Object.entries(k.seciciler)) {
    if (!s.gorunum) continue;
    const v = d.sec[ad] ?? "tumu";
    const c = v === "tumu" ? null : s.kosul(v, ekle);
    if (c) goruntu.push(`(${c})`);
  }
  const taban = [...goruntu];
  const ara = d.ara.trim();
  if (ara && k.metin.length) taban.push(icerir(`concat_ws(' ', ${k.metin.map((x) => `coalesce(${x}, '')`).join(", ")})`, ara));
  for (const [ad, ifade] of Object.entries(k.alanlar)) {
    const v = (d.alan[ad] ?? "").trim();
    if (v) taban.push(icerir(ifade, v));
  }
  for (const [ad, s] of Object.entries(k.seciciler)) {
    if (s.gorunum || ad === k.siraSecici) continue;
    const v = d.sec[ad] ?? "tumu";
    const c = v === "tumu" ? null : s.kosul(v, ekle);
    if (c) taban.push(`(${c})`);
  }
  const secili = d.secili.filter((c) => Object.hasOwn(k.cipler, c));
  const cip = secili.length ? `(${secili.map((c) => `(${k.cipler[c]})`).join(d.kip === "ve" ? " AND " : " OR ")})` : "true";

  const ws = (l: readonly string[]) => (l.length ? l.join(" AND ") : "true");
  const cipAdlari = Object.keys(k.cipler);
  /* tek geçişte sayılar: görme kümesi (veri yok mu), görünüm toplamı, taban (çip sayıları), süzgeçten geçen */
  const sayim = (await db.sorgu<Record<string, number>>(
    `SELECT count(*) FILTER (WHERE ${gorus.sql})::int AS kayit,
            count(*) FILTER (WHERE ${ws(goruntu)})::int AS toplam,
            count(*) FILTER (WHERE ${ws(taban)} AND ${cip})::int AS adet
            ${cipAdlari.map((c, i) => `, count(*) FILTER (WHERE ${ws(taban)} AND (${k.cipler[c]}))::int AS c${i}`).join("")}
     FROM ${k.kaynak}`, p)).rows[0];
  const adet = sayim.adet ?? 0;
  const sayfaSayisi = Math.max(1, Math.ceil(adet / k.sayfa));
  const sayfa = Math.min(Math.max(1, d.sayfa), sayfaSayisi);

  /* sıralama: seçici değeri "<sütun>-artan|azalan" ya da varsayılan */
  let sira = k.varsayilanSira;
  const sv = k.siraSecici ? d.sec[k.siraSecici] : undefined;
  if (sv && sv !== "varsayilan") {
    const [sutun, yon] = sv.split("-");
    const s = Object.hasOwn(k.sira, sutun) ? k.sira[sutun] : undefined;
    if (s && (yon === "artan" || yon === "azalan")) sira = `${s.ifade}${s.metin ? ' COLLATE "C"' : ""} ${yon === "artan" ? "ASC" : "DESC"}, ${k.varsayilanSira}`;
  }
  const rows = (await db.sorgu<K & object>(
    `SELECT ${k.secim} FROM ${k.kaynak} WHERE ${ws(taban)} AND ${cip} ORDER BY ${sira} LIMIT ${k.sayfa} OFFSET ${(sayfa - 1) * k.sayfa}`, p)).rows;

  /* seçenekleri olan seçiciler: görme kümesindeki farklı değerler (tarayıcı yüklü kayıtlardan üretiyordu — aynı küme) */
  const secenekler: Record<string, Secenek[]> = {};
  for (const [ad, s] of Object.entries(k.seciciler)) {
    if (!s.secenek) continue;
    const sirasi = s.secenek.sira === "deger-azalan" ? "d DESC" : 'tr_sira(e) COLLATE "C", d';
    secenekler[ad] = (await db.sorgu<{ d: string; e: string }>(
      `SELECT d, e FROM (SELECT DISTINCT (${s.secenek.deger})::text AS d, (${s.secenek.etiket})::text AS e FROM ${k.kaynak} WHERE ${gorus.sql}) x
       WHERE d IS NOT NULL AND e IS NOT NULL ORDER BY ${sirasi}`, [...gorus.p])).rows.map((x) => [x.d, x.e] as const);
  }
  return {
    gorunen: rows as K[], adet, toplam: sayim.toplam ?? 0, kayitSayisi: sayim.kayit ?? 0, sayfa, sayfaSayisi,
    cipSayilari: Object.fromEntries(cipAdlari.map((c, i) => [c, sayim[`c${i}`] ?? 0])), secenekler,
  };
}

/** HESAPLANMIŞ SATIRLAR (Muhasebe: iş durumu, kalan, kâr — SQL karşılığı kurulamayan): tarayıcının süzgeci (listele) AYNEN sunucuda koşar —
    aynı tanım, aynı sonuç; tarayıcıya bütün kayıtlar inmez, yalnız sayfanın satırları, sayılar, çip sayıları ve seçenekler (sıralama seçicisi
    hariç, "Tümü"süz). Süzgeç durumu biçim denetiminden geçer; bozuksa başlangıç durumu. Veri sunucuda bir kez hesaplanır. */
export function bellekteListele<K>(t: SuzgecTanimi<K>, d0: unknown, kayitlar: readonly K[]): SunucuListe<K> {
  const d = bellekDurumu(t, d0);
  const o = listele(t, d, kayitlar);
  return {
    gorunen: o.gorunen, adet: o.adet, toplam: o.toplam, kayitSayisi: kayitlar.length, sayfa: o.sayfa, sayfaSayisi: o.sayfaSayisi,
    cipSayilari: Object.fromEntries(t.cipler.map((c) => [c.k, o.tb.filter(c.test).length])),
    secenekler: Object.fromEntries(t.seciciler.filter((s) => !s.siralama).map((s) => [s.k, s.secenek().filter(([v]) => v !== "tumu")])),
  };
}

/** tarayıcıdan gelen süzgeç durumu → tanımın başlangıcıyla birleşmiş durum (bozuksa başlangıç) */
export function bellekDurumu<K>(t: SuzgecTanimi<K>, d0: unknown): SuzgecDurumu {
  const bas = yeniDurum(t);
  const g = SuzgecDurumuSemasi.safeParse(d0);
  return g.success ? { ...g.data, sec: { ...bas.sec, ...g.data.sec }, alan: { ...bas.alan, ...g.data.alan } } : bas;
}
/** 576: süzgeçten geçen BÜTÜN kayıtlar (sayfasız; sıralı) — toplam ve Excel'e aktarma için (ekrana sayfa gider) */
export const bellekteSuz = <K,>(t: SuzgecTanimi<K>, d0: unknown, kayitlar: readonly K[]): K[] => listele(t, bellekDurumu(t, d0), kayitlar).liste;
