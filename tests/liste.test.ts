/* NEREDEN GELDİ: 566 — reisim 2026-10-15 ("sitede donma yaşanabilecek şeyler düşünülüp kurgumuz … yapıldı mı genel bi analiz yap" → analiz: Raporlar
   listesi firmanın BÜTÜN raporlarını tarayıcıya indirip orada süzüyordu, 09-B3 "her liste sunucuda sayfalı" → "elindeki bütün işleri yap").
   Süzgeç sunucuya taşındı (src/server/liste/liste.ts listeGetir + raporlar/server/liste.ts raporSayfasi); ekran ve anlam AYNI kalmalı.
   GERÇEK PostgreSQL, iki firma. Kilit: aynı veride, beş kişinin (firma yöneticisi, iki denetçi, mekanik ve elektrik yönetici) gözünden, onlarca
   süzgeç durumunda sunucunun sonucu ESKİ tarayıcı süzgecinin (components/liste/suzgec.ts listele + 318'deki tanım + raporListesi) sonucuyla
   birebir: sayfanın satırları ve sırası, süzgeçten geçen sayı, toplam, çip sayıları, seçici seçenekleri, boş durumun hâli. Türkçe harfler
   (I / ı, İ / i, ş, ç …) aramada ve seçenek sırasında; görme kuralı canDo ile aynı (gorusKosulu); başka firmanın raporu yok.
   Olumsuz kanıt: tests/bozan/liste.bozan.ts. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { listele, yeniDurum, type Secenek, type SuzgecDurumu, type SuzgecTanimi } from "../src/components/liste/suzgec.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { raporSayfasi } from "../src/modules/raporlar/server/liste.ts";
import { raporListesi, type Kisi, type RaporListeSatiri } from "../src/modules/raporlar/server/raporlar.ts";
import { RAPOR_DURUM } from "../src/modules/raporlar/sema.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, A = "", B = "";
const K: Record<string, Kisi> = {};
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const gun = (iso: string) => GUN.format(new Date(iso));
const benzersiz = <T,>(l: readonly T[]) => [...new Set(l)];

/* ESKİ tarayıcı tanımı (318 — ui/RaporListesi.tsx'in 566 öncesi hâli): sunucunun karşılaştırıldığı ölçü */
function eskiTanim(l: readonly RaporListeSatiri[]): SuzgecTanimi<RaporListeSatiri> {
  return {
    ad: "Raporlarda ara", ipucu: "", birim: "rapor", sayfa: 20, imkansiz: "",
    metin: (r) => [r.no, r.ekipmanKod, r.turAd, r.tesis, r.musteri].join(" "),
    alanlar: [
      { k: "no", ad: "", metin: (r) => r.no }, { k: "kod", ad: "", metin: (r) => r.ekipmanKod },
      { k: "tur", ad: "", metin: (r) => r.turAd }, { k: "tesis", ad: "", metin: (r) => `${r.tesis} ${r.musteri}` },
    ],
    cipler: [
      ...(Object.keys(RAPOR_DURUM) as (keyof typeof RAPOR_DURUM)[]).map((d) => ({ k: d, ad: "", grup: "durum", test: (r: RaporListeSatiri) => r.durum === d })),
      { k: "geri", ad: "", test: (r) => r.geri },
    ],
    seciciler: [
      { k: "musteri", ad: "", secenek: () => [["tumu", ""], ...benzersiz(l.map((r) => r.musteriId)).map((m) => [m, l.find((r) => r.musteriId === m)!.musteri] as const)
        .sort((a, b) => a[1].localeCompare(b[1], "tr"))], gecer: (r, v) => v === "tumu" || r.musteriId === v },
      { k: "il", ad: "", secenek: () => [["tumu", ""], ...benzersiz(l.map((r) => r.il).filter((x): x is string => !!x)).sort((a, b) => a.localeCompare(b, "tr")).map((x) => [x, x] as const)],
        gecer: (r, v) => v === "tumu" || r.il === v },
      { k: "sonuc", ad: "", secenek: () => [], gecer: (r, v) => v === "tumu" || (v === "yok" ? !r.sonuc : r.sonuc === v) },
      { k: "yil", ad: "", secenek: () => [["tumu", ""], ...benzersiz(l.map((r) => gun(r.olustu).slice(0, 4))).sort().reverse().map((y) => [y, y] as const)],
        gecer: (r, v) => v === "tumu" || gun(r.olustu).startsWith(v) },
    ],
  };
}

const ile = <T,>(firma: string, k: Kisi, is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });

before(async () => {
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('liste-a', 'Liste A', 'LA'), ('liste-b', 'Liste B', 'LB') RETURNING id::text")).rows.map((r) => r.id);
  } finally { await s.end(); }
  /* uydurma veri: iki müşteri, üç tesis (Türkçe harfli iller), iki tür (mekanik / elektrik), iki denetçi */
  const v = await kiraciIcinde(havuz, A, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m1 = await q("INSERT INTO musteri (unvan, kisa) VALUES ('Işık Makina A.Ş.', 'Işık Makina') RETURNING id::text");
    const m2 = await q("INSERT INTO musteri (unvan, kisa) VALUES ('Çınar Yapı A.Ş.', 'Çınar Yapı') RETURNING id::text");
    const t1 = await q("INSERT INTO tesis (musteri_id, ad, il) VALUES ($1, 'İkinci Fabrika', 'İzmir') RETURNING id::text", [m1]);
    const t2 = await q("INSERT INTO tesis (musteri_id, ad, il) VALUES ($1, 'Şantiye', 'Iğdır') RETURNING id::text", [m1]);
    const t3 = await q("INSERT INTO tesis (musteri_id, ad, il) VALUES ($1, 'Depo', 'Çorum') RETURNING id::text", [m2]);
    const tm = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basinc', 'm', 12) RETURNING id::text");
    const te = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('IT', 'İç tesisat', 'elektrik', 'e', 12) RETURNING id::text");
    const p1 = await q("INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Bir', '2024-01-01', 'mak-muh') RETURNING id::text");
    const p2 = await q("INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme İki', '2024-01-01', 'elk-muh') RETURNING id::text");
    const h = async (e: string, roller: string[], per: string | null = null) => q(
      "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [`${e}@liste-a.example`, roller, per]);
    K.yon = { id: await h("yon", ["firma_yoneticisi"]), ad: "Deneme", roller: ["firma_yoneticisi"] };
    K.d1 = { id: await h("d1", ["denetci"], p1), ad: "Deneme", roller: ["denetci"] };
    K.d2 = { id: await h("d2", ["denetci"], p2), ad: "Deneme", roller: ["denetci"] };
    K.mek = { id: await h("mek", ["mekanik_yonetici", "denetci"]), ad: "Deneme", roller: ["mekanik_yonetici", "denetci"] };
    K.elk = { id: await h("elk", ["elektrik_yonetici"]), ad: "Deneme", roller: ["elektrik_yonetici"] };
    const ekp: { id: string; tur: string; tesis: string }[] = [];
    let i = 0;
    for (const [tesis, tur] of [[t1, tm], [t1, te], [t2, tm], [t2, te], [t3, tm], [t3, te]] as const) {
      for (let n = 0; n < 2; n++) ekp.push({ id: await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'Deneme') RETURNING id::text",
        [tesis, tur, `${tur === tm ? "HT" : "IŞ"}-${String(++i).padStart(3, "0")}`]), tur, tesis });
    }
    return { ekp, p1, p2 };
  });
  /* 30 rapor: durum / sonuç / yıl / yazan / revizyon çeşitli (tetiksiz — süper kullanıcı, geçici veritabanı); geri gönderilmiş üç rapor */
  const durumlar = ["taslak", "onayda", "onaylandi", "imzada", "imzali"] as const;
  const s2 = kume.sahipIstemci(); await s2.connect();
  try {
    await s2.query("SET session_replication_role = replica");
    for (let n = 0; n < 30; n++) {
      const e = v.ekp[n % v.ekp.length], d = durumlar[n % 5], yazan = n % 3 === 0 ? K.d2 : n % 3 === 1 ? K.d1 : K.mek;
      const per = yazan === K.d2 ? v.p2 : v.p1;
      const olustu = new Date(Date.UTC(2024 + (n % 3), n % 12, 1 + n, 9, n)).toISOString();
      const id = (await s2.query<{ id: string }>(`INSERT INTO rapor (firma_id, no, revizyon, plan_id, ekipman_id, tur_id, format_id, personel_id, hesap_id, durum, kunye, sonuc, olustu)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, '{}', $11, $12) RETURNING id::text`,
        [A, `LA-1026-${String(n + 1).padStart(3, "0")}-${(n + 10).toString(16).padStart(5, "0")}`, n === 4 ? 1 : 0, randomUUID(), e.id, e.tur, randomUUID(), per, yazan.id, d,
          n % 4 === 0 ? null : n % 4 === 1 ? "uygun_degil" : "uygun", olustu])).rows[0].id;
      if (d === "taslak" && n < 16) await s2.query("INSERT INTO rapor_hareket (firma_id, rapor_id, revizyon, ne) VALUES ($1, $2, 0, 'geri')", [A, id]);
    }
    /* başka firma: aynı adlı bir rapor (görünmemeli) */
    await s2.query(`INSERT INTO rapor (firma_id, no, plan_id, ekipman_id, tur_id, format_id, personel_id, durum, kunye, olustu)
      VALUES ($1, 'LB-1026-001-00001', $2, $3, $4, $5, $6, 'taslak', '{}', now())`, [B, randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID()]);
  } finally { await s2.end(); }
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

/** aynı durumda eski (tarayıcı) ve yeni (sunucu) sonucu karşılaştırır */
async function karsilastir(kim: Kisi, d: Partial<SuzgecDurumu>, ne: string) {
  const eski = (await ile(A, kim, (db) => raporListesi(db, kim)))!;
  const t = eskiTanim(eski);
  const durum = { ...yeniDurum(t), ...d, sec: { ...yeniDurum(t).sec, ...d.sec }, alan: { ...yeniDurum(t).alan, ...d.alan } };
  const o = listele(t, durum, eski);
  const y = (await ile(A, kim, (db) => raporSayfasi(db, kim, durum)))!;
  assert.deepEqual(y.gorunen.map((r) => r.id), o.gorunen.map((r) => r.id), `${ne}: sayfanın satırları`);
  assert.deepEqual([y.adet, y.toplam, y.kayitSayisi, y.sayfa, y.sayfaSayisi], [o.liste.length, o.toplam, eski.length, o.sayfa, o.sayfaSayisi], `${ne}: sayılar`);
  for (const c of t.cipler) assert.equal(y.cipSayilari[c.k], o.tb.filter(c.test).length, `${ne}: ${c.k} çipi`);
  for (const k of ["musteri", "il", "yil"]) {
    const bek = t.seciciler.find((x) => x.k === k)!.secenek().slice(1) as Secenek[];
    assert.deepEqual(y.secenekler[k], bek.map(([a, b]) => [a, b]), `${ne}: ${k} seçenekleri`);
  }
  /* satırın içeriği aynı (yazanın kimliği gitmez) */
  for (const r of y.gorunen) assert.deepEqual(r, eski.find((x) => x.id === r.id), `${ne}: ${r.no} satırı`);
  return y;
}

test("sunucu süzgeci eski tarayıcı süzgeciyle birebir: beş kişi × süzgeç durumları (sayfa, sayılar, çipler, seçenekler, satırlar)", async () => {
  const kisiler = ["yon", "d1", "d2", "mek", "elk"] as const;
  const durumlar: [string, Partial<SuzgecDurumu>][] = [
    ["başlangıç", {}],
    ["2. sayfa", { sayfa: 2 }],
    ["sayfa aşımı sona çekilir", { sayfa: 99 }],
    ["rapor no (küçük harf)", { alan: { no: "la-1026-01" } }],
    ["ekipman kodu Türkçe büyük harf (IŞ ↔ ış)", { alan: { kod: "ış-0" } }],
    ["ekipman türü (İç ↔ iç)", { alan: { tur: "İÇ TES" } }],
    ["tesis + müşteri (Işık ↔ ışık, İzmir değil tesis)", { alan: { tesis: "ışık" } }],
    ["tesis (Şantiye ↔ şantiye)", { alan: { tesis: "ŞANTİYE" } }],
    ["genel arama", { ara: "hava" }],
    ["çip veya", { secili: ["onayda", "imzali"] }],
    ["çip ve (imkânsız)", { secili: ["onayda", "imzali"], kip: "ve" }],
    ["geri + taslak ve", { secili: ["geri", "taslak"], kip: "ve" }],
    ["sonuç yok", { sec: { sonuc: "yok" } }],
    ["sonuç uygun değil", { sec: { sonuc: "uygun_degil" } }],
    ["yıl", { sec: { yil: "2025" } }],
    ["il (Iğdır)", { sec: { il: "Iğdır" } }],
    ["hiçbir şey uymaz", { alan: { no: "zzz" } }],
  ];
  for (const k of kisiler) {
    const kim = K[k];
    const mus = (await ile(A, kim, (db) => raporSayfasi(db, kim, {})))!.secenekler.musteri ?? [];
    for (const [ne, d] of [...durumlar, ...(mus.length ? [[`müşteri ${mus[0][1]}`, { sec: { musteri: mus[0][0] } }] as [string, Partial<SuzgecDurumu>]] : [])]) {
      await karsilastir(kim, d, `${k} · ${ne}`);
    }
  }
});

test("görme kuralı canDo ile aynı: denetçi yalnız kendi, branş yöneticisi branşı + kendi yazdığı; başka firma yok; bozuk süzgeç durumu başlangıca döner", async () => {
  const say = async (k: Kisi) => (await ile(A, k, (db) => raporSayfasi(db, k, {})))!.kayitSayisi;
  assert.equal(await say(K.yon), 30);
  assert.equal(await say(K.d1), 10);
  assert.equal(await say(K.d2), 10);
  /* mekanik yönetici: mekanik türün raporları + elektrik türde kendi yazdıkları */
  const mek = (await ile(A, K.mek, (db) => raporListesi(db, K.mek)))!;
  assert.equal(await say(K.mek), mek.length);
  assert.ok(mek.some((r) => r.brans === "e") && mek.some((r) => r.brans === "m"));
  assert.equal(await say(K.elk), (await ile(A, K.elk, (db) => raporListesi(db, K.elk)))!.length);
  /* Raporlar'ı görmeyen null; bozuk durum (yanlış tür, aşırı uzun) başlangıç durumu sayılır — koşula girmez */
  assert.equal(await ile(A, K.yon, (db) => raporSayfasi(db, { id: K.yon.id, roller: ["muhasebe"] }, {})), null);
  const bozuk = (await ile(A, K.yon, (db) => raporSayfasi(db, K.yon, { ara: 5, alan: { no: "x".repeat(5000) }, sec: { musteri: "'; DROP TABLE rapor; --" } })))!;
  assert.equal(bozuk.adet, 30);
  const enj = (await ile(A, K.yon, (db) => raporSayfasi(db, K.yon, { sec: { musteri: "'; DROP TABLE rapor; --", il: "' OR 1=1 --" } })))!;
  assert.equal(enj.adet, 0, "seçici değeri değer olarak karşılaştırılır (müşteri kimliği değilse hiçbir şey)");
  assert.equal((await ile(A, K.yon, (db) => raporSayfasi(db, K.yon, {})))!.kayitSayisi, 30, "tablo yerinde");
});
