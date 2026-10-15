/* NEREDEN GELDİ: 566 — reisim 2026-10-15 ("sitede donma yaşanabilecek şeyler düşünülüp kurgumuz … yapıldı mı genel bi analiz yap" → analiz: Raporlar
   listesi firmanın BÜTÜN raporlarını tarayıcıya indirip orada süzüyordu, 09-B3 "her liste sunucuda sayfalı" → "elindeki bütün işleri yap").
   Süzgeç sunucuya taşındı (src/server/liste/liste.ts listeGetir + raporlar/server/liste.ts raporSayfasi); ekran ve anlam AYNI kalmalı.
   GERÇEK PostgreSQL, iki firma. Kilit: aynı veride, beş kişinin (firma yöneticisi, iki denetçi, mekanik ve elektrik yönetici) gözünden, onlarca
   süzgeç durumunda sunucunun sonucu ESKİ tarayıcı süzgecinin (components/liste/suzgec.ts listele + 318'deki tanım + raporListesi) sonucuyla
   birebir: sayfanın satırları ve sırası, süzgeçten geçen sayı, toplam, çip sayıları, seçici seçenekleri, boş durumun hâli. Türkçe harfler
   (I / ı, İ / i, ş, ç …) aramada ve seçenek sırasında; görme kuralı canDo ile aynı (gorusKosulu); başka firmanın raporu yok. Planlar da aynı
   ölçüyle (planListesi + 318 öncesi tanım): sütun başlığı sıralamaları (no, ad, müşteri, adres, denetçi, başlangıç, durum; artan / azalan),
   tarih pencereleri (bugün, bu hafta, 7 gün), branş, müşteri, durum. Onaylar › Tüm raporlar da (Onaylar düzeyiyle görülen bütün raporlar + 566 öncesi
   tanım): rapor no, tesis, durum, denetçi, sıralamalar; satırın izinleri kuyruktakiyle aynı; sekmedeki sayı (tumSayisi) görülen rapor sayısı.
   Olumsuz kanıt: tests/bozan/liste.bozan.ts. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { listele, yeniDurum, type Secenek, type SuzgecDurumu, type SuzgecTanimi } from "../src/components/liste/suzgec.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { raporSayfasi } from "../src/modules/raporlar/server/liste.ts";
import { planSayfasi } from "../src/modules/planlar/server/liste.ts";
import { planListesi, type PlanSatir } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr } from "../src/modules/planlar/server/planlar.ts";
import { PLAN_DURUM, type PlanDurumu } from "../src/modules/planlar/sema.ts";
import { raporListesi, type Kisi, type RaporListeSatiri } from "../src/modules/raporlar/server/raporlar.ts";
import { RAPOR_DURUM, type RaporDurumu } from "../src/modules/raporlar/sema.ts";
import { raporOzetleri, type RaporOzeti } from "../src/modules/raporlar/server/onay-baglanti.ts";
import { onayListeleri, tumRaporlarSayfasi } from "../src/modules/onaylar/server/onaylar.ts";
import { canDo } from "../src/server/yetki/canDo.ts";
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

/* ESKİ Planlar tanımı (ui/PlanListesi.tsx'in 566 öncesi hâli) */
const gunEkle = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const DURUM_SIRA: Record<PlanDurumu, number> = { bekliyor: 1, kabul: 2, denetimde: 3, tamamlandi: 4, reddedildi: 5 };
function eskiPlanTanimi(kayitlar: readonly PlanSatir[], bugun: string): SuzgecTanimi<PlanSatir> {
  const g = new Date(`${bugun}T00:00:00Z`).getUTCDay(), pzt = gunEkle(bugun, -((g + 6) % 7)), paz = gunEkle(pzt, 6), yedi = gunEkle(bugun, 7);
  return {
    ad: "", ipucu: "", birim: "plan", sayfa: 20, imkansiz: "",
    metin: (p) => [p.no, p.ad, p.musteri, p.adres ?? "", p.ilce ?? "", p.il ?? ""].join(" "),
    alanlar: [{ k: "ad", ad: "", metin: (p) => p.ad }, { k: "no", ad: "", metin: (p) => p.no }],
    cipler: [],
    seciciler: [
      { k: "durum", ad: "", secenek: () => [], gecer: (p, v) => v === "tumu" || p.durum === v },
      { k: "tarih", ad: "", secenek: () => [], gecer: (p, v) => v === "tumu" || (v === "bugun" ? p.baslangic <= bugun && p.bitis >= bugun
        : v === "hafta" ? p.baslangic <= paz && p.bitis >= pzt : p.baslangic <= yedi && p.bitis >= bugun) },
      { k: "musteri", ad: "", secenek: () => [["tumu", ""], ...[...new Set(kayitlar.map((p) => p.musteri))].sort((a, b) => a.localeCompare(b, "tr")).map((x) => [x, x] as const)],
        gecer: (p, v) => v === "tumu" || p.musteri === v },
      { k: "brans", ad: "", secenek: () => [], gecer: (p, v) => v === "tumu" || (v === "m" ? p.mekanik : p.elektrik) },
      { k: "sira", ad: "", siralama: true, secenek: () => [], gecer: () => true },
    ],
    siraAnahtari: {
      no: (p) => p.no, ad: (p) => p.ad, musteri: (p) => p.musteri, adres: (p) => `${p.il ?? ""} ${p.ilce ?? ""} ${p.adres ?? ""}`, ekip: (p) => p.ekip[0] ?? "",
      baslangic: (p) => p.baslangic, durum: (p) => DURUM_SIRA[p.durum],
    },
    varsayilanSira: (a, b) => b.baslangic.localeCompare(a.baslangic) || b.olustu.localeCompare(a.olustu),
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
    return { ekp, p1, p2, tesisler: [t1, t2, t3] };
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
      /* veritabanı kuralı (0026 rapor_onay_tutarli): onay zamanı yalnız onaylanmış / imzadaki / tamamlanan raporda */
      const onay = d === "taslak" || d === "onayda" ? null : new Date(Date.parse(olustu) + 864e5).toISOString();
      const gonderildi = d === "taslak" ? null : new Date(Date.parse(olustu) + 36e5).toISOString();
      const id = (await s2.query<{ id: string }>(`INSERT INTO rapor (firma_id, no, revizyon, plan_id, ekipman_id, tur_id, format_id, personel_id, hesap_id, durum, kunye, sonuc, olustu, onay, gonderildi)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, '{}', $11, $12, $13, $14) RETURNING id::text`,
        [A, `LA-1026-${String(n + 1).padStart(3, "0")}-${(n + 10).toString(16).padStart(5, "0")}`, n === 4 ? 1 : 0, randomUUID(), e.id, e.tur, randomUUID(), per, yazan.id, d,
          n % 4 === 0 ? null : n % 4 === 1 ? "uygun_degil" : "uygun", olustu, onay, gonderildi])).rows[0].id;
      if (d === "taslak" && n < 16) await s2.query("INSERT INTO rapor_hareket (firma_id, rapor_id, revizyon, ne) VALUES ($1, $2, 0, 'geri')", [A, id]);
    }
    /* 25 plan: tesis / durum / tarih (bugün çevresinde) / ekip / ekipman (branş) çeşitli */
    const bugun = bugunTr(), pdurum = ["bekliyor", "kabul", "denetimde", "tamamlandi", "reddedildi"] as const;
    for (let n = 0; n < 25; n++) {
      const tesis = v.tesisler[n % 3], bas = gunEkle(bugun, (n % 11) - 5), bit = gunEkle(bas, n % 3);
      /* durumun tutarlılık kuralları (0024): kabul edilmiş planda kabul + beyan, reddedilende red + gerekçe, tamamlananda kontrol + bitiş */
      const pid = (await s2.query<{ id: string }>(`INSERT INTO plan (firma_id, no, tesis_id, baslangic, bitis, durum, firma_adi, acan, olustu,
          kabul, kabul_eden, beyan, red, red_eden, red_gerekce, kontrol_tamam, bitti)
        SELECT $1::uuid, $2::text, $3::uuid, $4::date, $5::date, $6::text, 'Liste A', 'Deneme', $7::timestamptz,
          CASE WHEN k THEN $7::timestamptz END, CASE WHEN k THEN 'Deneme' END, CASE WHEN k THEN 'Plan okundu, kabul ediyorum — deneme beyanı.' END,
          CASE WHEN r THEN $7::timestamptz END, CASE WHEN r THEN 'Deneme' END, CASE WHEN r THEN 'Uygun değil' END,
          CASE WHEN t THEN $7::timestamptz END, CASE WHEN t THEN $7::timestamptz END
        FROM (SELECT $6::text IN ('kabul', 'denetimde', 'tamamlandi') AS k, $6::text = 'reddedildi' AS r, $6::text = 'tamamlandi' AS t) d RETURNING id::text`,
        [A, `LA-1026-${String(n + 1).padStart(3, "0")}`, tesis, bas, bit, pdurum[n % 5], new Date(Date.UTC(2026, 0, 1, 8, n)).toISOString()])).rows[0].id;
      for (const per of n % 3 === 0 ? [v.p1, v.p2] : n % 3 === 1 ? [v.p1] : [v.p2]) await s2.query("INSERT INTO plan_ekip (firma_id, plan_id, personel_id) VALUES ($1, $2, $3)", [A, pid, per]);
      for (const e of v.ekp.filter((x) => x.tesis === tesis).slice(0, 1 + (n % 4))) await s2.query("INSERT INTO plan_ekipman (firma_id, plan_id, ekipman_id, ekleyen) VALUES ($1, $2, $3, 'Deneme')", [A, pid, e.id]);
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

async function planKarsilastir(kim: Kisi, d: Partial<SuzgecDurumu>, ne: string) {
  const bugun = bugunTr();
  const eski = (await ile(A, kim, (db) => planListesi(db, kim)))!;
  const t = eskiPlanTanimi(eski, bugun);
  const durum = { ...yeniDurum(t), ...d, sec: { ...yeniDurum(t).sec, ...d.sec }, alan: { ...yeniDurum(t).alan, ...d.alan } };
  const o = listele(t, durum, eski);
  const y = (await ile(A, kim, (db) => planSayfasi(db, kim, durum, bugun)))!;
  assert.deepEqual(y.gorunen.map((r) => r.no), o.gorunen.map((r) => r.no), `${ne}: sayfanın satırları ve sırası`);
  assert.deepEqual([y.adet, y.toplam, y.kayitSayisi, y.sayfa], [o.liste.length, o.toplam, eski.length, o.sayfa], `${ne}: sayılar`);
  assert.deepEqual(y.secenekler.musteri, (t.seciciler.find((x) => x.k === "musteri")!.secenek().slice(1) as Secenek[]).map(([a, b]) => [a, b]), `${ne}: müşteri seçenekleri`);
  for (const r of y.gorunen) assert.deepEqual(r, eski.find((x) => x.id === r.id), `${ne}: ${r.no} satırı`);
}

test("Planlar: sunucu süzgeci ve sıralaması eski tarayıcı süzgeciyle birebir (kişiler × süzgeç × sıralama)", async () => {
  const durumlar: [string, Partial<SuzgecDurumu>][] = [
    ["başlangıç", {}], ["2. sayfa", { sayfa: 2 }],
    ["proje adı (Şantiye ↔ şantiye)", { alan: { ad: "ŞANTİYE" } }], ["proje no", { alan: { no: "la-1026-01" } }], ["genel arama (Iğdır ↔ ığdır)", { ara: "ığdır" }],
    ["durum", { sec: { durum: "kabul" } }], ["bugün", { sec: { tarih: "bugun" } }], ["bu hafta", { sec: { tarih: "hafta" } }], ["7 gün", { sec: { tarih: "yedi" } }],
    ["branş mekanik", { sec: { brans: "m" } }], ["branş elektrik", { sec: { brans: "e" } }], ["müşteri", { sec: { musteri: "Çınar Yapı A.Ş." } }],
    ...["no", "ad", "musteri", "adres", "ekip", "baslangic", "durum"].flatMap((s) => (["artan", "azalan"] as const).map((y) =>
      [`sıra ${s} ${y}`, { sec: { sira: `${s}-${y}` } }] as [string, Partial<SuzgecDurumu>])),
    ["sıra + 2. sayfa", { sec: { sira: "musteri-azalan" }, sayfa: 2 }],
  ];
  for (const k of ["yon", "d1", "d2", "mek", "elk"] as const) for (const [ne, d] of durumlar) await planKarsilastir(K[k], d, `${k} · ${ne}`);
  assert.equal(Object.keys(PLAN_DURUM).length, 5);
});

/* ESKİ Onaylar › Tüm raporlar tanımı (onaylar/ui/OnayListesi.tsx'in 566 öncesi hâli); liste: Onaylar düzeyiyle görülen bütün raporlar, en yeni üstte */
const RDURUM_SIRA: Record<RaporDurumu, number> = { taslak: 1, onayda: 2, onaylandi: 3, imzada: 4, imzali: 5 };
function eskiTumTanimi(l: readonly RaporOzeti[]): SuzgecTanimi<RaporOzeti> {
  return {
    ad: "", ipucu: "", birim: "rapor", imkansiz: "", sayfa: 20,
    metin: (r) => r.no,
    alanlar: [{ k: "no", ad: "", metin: (r) => r.no }, { k: "tesis", ad: "", metin: (r) => `${r.musteri} ${r.tesis}` }],
    cipler: [],
    seciciler: [
      { k: "durum", ad: "", secenek: () => [], gecer: (r, v) => v === "tumu" || r.durum === v },
      { k: "kisi", ad: "", secenek: () => [["tumu", ""], ...benzersiz(l.map((r) => r.denetci)).sort((a, b) => a.localeCompare(b, "tr")).map((x) => [x, x] as const)],
        gecer: (r, v) => v === "tumu" || r.denetci === v },
      { k: "sira", ad: "", siralama: true, secenek: () => [], gecer: () => true },
    ],
    siraAnahtari: { no: (r) => r.no, durum: (r) => RDURUM_SIRA[r.durum], denetci: (r) => r.denetci },
    varsayilanSira: (a, b) => b.olustu.localeCompare(a.olustu),
  };
}
const disinda = (x: object, ...adlar: string[]) => Object.fromEntries(Object.entries(x).filter(([a]) => !adlar.includes(a)));

async function onayKarsilastir(kim: Kisi, d: Partial<SuzgecDurumu>, ne: string) {
  const eski = (await ile(A, kim, (db) => raporOzetleri(db))).filter((r) => canDo(kim, 15, "gor", { sahip: r.hesapId, brans: r.brans }))
    .sort((a, b) => b.olustu.localeCompare(a.olustu));
  const t = eskiTumTanimi(eski);
  const durum = { ...yeniDurum(t), ...d, sec: { ...yeniDurum(t).sec, ...d.sec }, alan: { ...yeniDurum(t).alan, ...d.alan } };
  const o = listele(t, durum, eski);
  const y = (await ile(A, kim, (db) => tumRaporlarSayfasi(db, kim, durum)))!;
  assert.deepEqual(y.gorunen.map((r) => r.no), o.gorunen.map((r) => r.no), `${ne}: sayfanın satırları ve sırası`);
  assert.deepEqual([y.adet, y.toplam, y.kayitSayisi, y.sayfa, y.sayfaSayisi], [o.liste.length, o.toplam, eski.length, o.sayfa, o.sayfaSayisi], `${ne}: sayılar`);
  assert.deepEqual(y.secenekler.kisi, (t.seciciler.find((x) => x.k === "kisi")!.secenek().slice(1) as Secenek[]).map(([a, b]) => [a, b]), `${ne}: denetçi seçenekleri`);
  const v = (await ile(A, kim, (db) => onayListeleri(db, kim)))!;
  assert.equal(v.tumSayisi, eski.length, `${ne}: sekmedeki sayı`);
  assert.deepEqual(v.branslar, benzersiz(eski.map((r) => r.brans)).sort(), `${ne}: branşlar`);
  for (const r of y.gorunen) {
    assert.deepEqual(disinda(r, "izin", "bekleme", "eski"), disinda(eski.find((x) => x.id === r.id)!, "hesapId"), `${ne}: ${r.no} satırı (yazanın kimliği gitmez)`);
    const q = v.kuyruk.find((x) => x.id === r.id);
    if (q) assert.deepEqual(r, q, `${ne}: ${r.no} kuyruktaki satırla aynı (izinler, bekleme)`);
  }
}

test("Onaylar › Tüm raporlar: sunucu süzgeci eski tarayıcı süzgeciyle birebir (yöneticiler × süzgeç × sıralama); denetçiye yok", async () => {
  const durumlar: [string, Partial<SuzgecDurumu>][] = [
    ["başlangıç", {}], ["2. sayfa", { sayfa: 2 }], ["sayfa aşımı", { sayfa: 99 }],
    ["rapor no", { alan: { no: "la-1026-01" } }], ["tesis (Işık ↔ ışık)", { alan: { tesis: "ışık" } }], ["tesis (Şantiye ↔ şantiye)", { alan: { tesis: "ŞANTİYE" } }],
    ["müşteri + tesis", { alan: { tesis: "çınar yapı depo" } }], ["genel arama", { ara: "LA-1026-02" }],
    ["durum onayda", { sec: { durum: "onayda" } }], ["durum tamamlandı", { sec: { durum: "imzali" } }], ["denetçi", { sec: { kisi: "Deneme İki" } }],
    ...["no", "durum", "denetci"].flatMap((s) => (["artan", "azalan"] as const).map((yon) => [`sıra ${s} ${yon}`, { sec: { sira: `${s}-${yon}` } }] as [string, Partial<SuzgecDurumu>])),
    ["sıra + 2. sayfa", { sec: { sira: "denetci-azalan" }, sayfa: 2 }],
  ];
  for (const k of ["yon", "mek", "elk"] as const) for (const [ne, d] of durumlar) await onayKarsilastir(K[k], d, `${k} · ${ne}`);
  for (const k of ["d1", "d2"] as const) {
    assert.equal(await ile(A, K[k], (db) => tumRaporlarSayfasi(db, K[k], {})), null, `${k}: tüm raporlar yöneticinin (C5)`);
    assert.equal((await ile(A, K[k], (db) => onayListeleri(db, K[k])))!.tumSayisi, 0);
  }
});
