/* NEREDEN GELDİ: 379 — KOD-GECIS K5 "İSGGM duyuru okuma", pkproje §3 Ana sayfa Duyurular (yirmi yedinci / sekizinci tur: yayım tarihi zorunlu,
   en yeni üstte, kaynaklar İSGGM + İSGÜM + iş ekipmanları portalı; okunamazsa "alınamadı; son alınan liste gösteriliyor"). GERÇEK PostgreSQL,
   iki firma, yerel HTTP taklidi (UYDURMA sayfalar — e2e/duyuru-ornek.ts):
   · okuma: üç kaynak yazılır, ikinci okuma yeni eklemez; bir kaynak düşerse ötekiler yine yazılır, iş "hata", durum "alınamadı" der ve son liste
     durur; aynı anda iki okuma yok;
   · liste: kaynak başına en yeni 2, hepsi en yeni üstte; iki firma aynı listeyi görür (firma verisi değil);
   · yazma: kaynak / liste / tarih (gelecek) / bağlantı (Bakanlık dışı, javascript:) / başlık denetimleri veritabanında; başlık güncellenir; aynı
     bağlantı tek satır; kaynak başına en yeni 50 kalır;
   · uygulama rolü tabloya doğrudan erişemez; işlevler tanımlayıcı-yetkili, PUBLIC'e kapalı;
   · tazelik: son deneme yoksa / 6 saatten eskiyse Ana sayfa okumayı başlatır, yeniyse başlatmaz.
   Olumsuz kanıt: tests/bozan/duyuru.bozan.ts. */
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, before, test } from "node:test";
import type pg from "pg";
import { ornekSayfa } from "../e2e/duyuru-ornek.ts";
import { duyuruDurumu, duyuruListesi, duyuruYaz } from "../src/server/db/duyuru.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { isBasla, isBitir } from "../src/server/db/is.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { duyuruBolumu, duyurulariOku, TAZELIK } from "../src/server/duyuru/okuma.ts";
import { bosKapi, testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, sahip: pg.Client, sunucu: Server, uc = "", A = "", B = "";
const BUGUN = new Date("2026-10-08T09:00:00Z");
/** taklidin düşüreceği yollar (kaynak okunamadı) · yapısı değişmiş sayfa döneceği yollar (sayfa geldi, duyuru yok) */
const dusen = new Set<string>(), degisen = new Set<string>();

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  sahip = kume.sahipIstemci();
  await sahip.connect();
  [A, B] = (await sahip.query<{ id: string }>(
    "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('duyuru-a', 'Duyuru A', 'DA'), ('duyuru-b', 'Duyuru B', 'DB') RETURNING id::text")).rows.map((r) => r.id);
  sunucu = createServer((istek, yanit) => {
    const sayfa = dusen.has(istek.url ?? "") ? null
      : degisen.has(istek.url ?? "") ? "<!DOCTYPE html><html><body><div class=\"yeni-tasarim\">Duyurular</div></body></html>" : ornekSayfa(istek.url ?? "");
    if (!sayfa) { yanit.writeHead(404).end("yok"); return; }
    yanit.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(sayfa);
  });
  const kapi = await bosKapi();
  await new Promise<void>((coz) => sunucu.listen(kapi, "127.0.0.1", coz));
  uc = `http://127.0.0.1:${kapi}`;
});
after(async () => { sunucu?.close(); await sahip?.end(); await havuz?.end(); await kume?.durdur(); });

const liste = (f: string) => kiraciIcinde(havuz, f, (db) => duyuruListesi(db, 2));
const durum = () => kiraciIcinde(havuz, A, (db) => duyuruDurumu(db));

test("okuma: üç kaynak yazılır; liste kaynak başına en yeni 2, en yeni üstte; iki firma aynı listeyi görür; ikinci okuma yeni eklemez", async () => {
  assert.deepEqual(await durum(), { guncellendi: null, hata: false, son: null });
  assert.deepEqual(await liste(A), []);
  const o = await duyurulariOku(havuz, uc, BUGUN);
  assert.deepEqual(o, { durum: "tamam", okunan_kaynak: 3, hatali_kaynak: 0, yeni: 7 });
  const la = await liste(A);
  assert.deepEqual(la.map((d) => [d.tarih, d.kaynak, d.baslik]), [
    ["2026-09-15", "isggm", "Deneme İSGGM duyurusu: Örnek sınav takvimi"],
    ["2026-09-12", "isekipman", "Deneme portal duyurusu: rapor formatı güncellendi"],
    ["2026-09-10", "isgum", "Deneme İSGÜM duyurusu: ölçüm eğitimi"],
    ["2026-09-02", "isggm", "Deneme İSGGM duyurusu: eğitim başvuruları"],
    ["2026-08-01", "isgum", "Deneme İSGÜM duyurusu: laboratuvar"],
    ["2026-07-03", "isekipman", "Deneme portal duyurusu: sözleşme süreleri"],
  ]);
  assert.ok(la.every((d) => d.url.startsWith("https://www.csgb.gov.tr/") || d.url.startsWith("https://isekipmanlari.csgb.gov.tr/")), "bağlantı Bakanlığın asıl adresi");
  assert.deepEqual(await liste(B), la, "firma verisi değil: iki firma aynı listeyi görür");
  const d = await durum();
  assert.equal(d.hata, false);
  assert.ok(d.guncellendi && d.son);
  assert.equal((await duyurulariOku(havuz, uc, BUGUN)).yeni, 0, "ikinci okuma yeni eklemez");
});

test("bir kaynak düşerse ötekiler yine yazılır, iş 'hata', durum 'alınamadı' ve son liste durur; sonraki başarılı okumada hata kalkar", async () => {
  const once = await liste(A);
  dusen.add("/isgum/duyurular/");
  const o = await duyurulariOku(havuz, uc, BUGUN);
  assert.deepEqual([o.durum, o.okunan_kaynak, o.hatali_kaynak], ["hata", 2, 1]);
  assert.equal((await durum()).hata, true);
  assert.deepEqual(await liste(A), once, "son alınan liste gösterilir");
  /* yapı değişti (sayfa geldi ama duyuru yok) de "okunamadı" sayılır — sessiz kalmaz */
  dusen.clear();
  degisen.add("/isggm/duyurular/");
  const y = await duyurulariOku(havuz, uc, BUGUN);
  assert.deepEqual([y.durum, y.okunan_kaynak, y.hatali_kaynak], ["hata", 2, 1]);
  degisen.clear();
  const s = await duyurulariOku(havuz, "http://127.0.0.1:1", BUGUN);   // hiçbir kaynağa ulaşılamaz
  assert.deepEqual([s.durum, s.okunan_kaynak, s.hatali_kaynak], ["hata", 0, 3]);
  assert.equal((await durum()).hata, true);
  assert.equal((await duyurulariOku(havuz, uc, BUGUN)).durum, "tamam");
  assert.equal((await durum()).hata, false);
  /* aynı anda iki okuma yok */
  const calisan = await isBasla(havuz, "duyuru_okuma");
  assert.ok(calisan);
  assert.equal((await duyurulariOku(havuz, uc, BUGUN)).durum, "zaten_calisiyor");
  await isBitir(havuz, calisan, "tamam", {});
});

test("yazma denetimleri veritabanında: kaynak, liste, gelecek tarih, Bakanlık dışı / betik bağlantısı, başlık; güncelleme; tekil; kaynak başına 50", async () => {
  const u = (n: number | string) => `https://isekipmanlari.csgb.gov.tr/detay.aspx?d=${n}`;
  await assert.rejects(duyuruYaz(havuz, "baska" as "isggm", []), /kaynağı geçersiz/);
  await assert.rejects(havuz.query("SELECT duyuru_yaz('isggm', '{}'::jsonb)"), /listesi geçersiz/);
  await assert.rejects(duyuruYaz(havuz, "isekipman", [{ url: u(1), baslik: "Gelecek tarihli", tarih: "2099-01-01" }]), /tarihi geçersiz/);
  await assert.rejects(duyuruYaz(havuz, "isekipman", [{ url: u(1), baslik: "Tarihsiz", tarih: null as unknown as string }]), /tarihi geçersiz/);
  for (const url of ["https://kotu.example/detay.aspx?d=1", "javascript:alert(1)", "http://isekipmanlari.csgb.gov.tr/detay.aspx?d=1",
    "https://isekipmanlari.csgb.gov.tr.kotu.example/x", "https://www.csgb.gov.tr/x\"onmouseover=1"]) {
    await assert.rejects(duyuruYaz(havuz, "isekipman", [{ url, baslik: "Kötü bağlantı", tarih: "2026-01-01" }]), /duyuru_url_check|check constraint/, url);
  }
  await assert.rejects(duyuruYaz(havuz, "isekipman", [{ url: u(2), baslik: "x", tarih: "2026-01-01" }]), /check constraint/);
  /* güncelleme + aynı bağlantı tek satır */
  assert.equal(await duyuruYaz(havuz, "isekipman", [{ url: u(500), baslik: "İlk başlık", tarih: "2026-01-02" }, { url: u(500), baslik: "İlk başlık", tarih: "2026-01-02" }]), 1);
  assert.equal(await duyuruYaz(havuz, "isekipman", [{ url: u(500), baslik: "Düzeltilmiş başlık", tarih: "2026-01-02" }]), 0);
  assert.equal((await sahip.query<{ baslik: string }>("SELECT baslik FROM duyuru WHERE url = $1", [u(500)])).rows[0].baslik, "Düzeltilmiş başlık");
  /* kaynak başına en yeni 50 */
  const yuz = Array.from({ length: 80 }, (_, i) => ({ url: u(1000 + i), baslik: `Toplu duyuru ${i}`, tarih: `2025-${String(1 + (i % 12)).padStart(2, "0")}-01` }));
  await duyuruYaz(havuz, "isekipman", yuz);
  assert.equal((await sahip.query<{ n: number }>("SELECT count(*)::int AS n FROM duyuru WHERE kaynak = 'isekipman'")).rows[0].n, 50);
  assert.equal((await sahip.query<{ n: number }>("SELECT count(*)::int AS n FROM duyuru WHERE kaynak = 'isggm'")).rows[0].n, 3, "öteki kaynağa dokunulmaz");
});

test("GÜVENLİK: uygulama rolü tabloya doğrudan erişemez; işlevler tanımlayıcı-yetkili, PUBLIC'e kapalı", async () => {
  await assert.rejects(havuz.query("SELECT * FROM duyuru"), /permission denied|izin/i);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO duyuru (url, kaynak, baslik, tarih) VALUES ('https://www.csgb.gov.tr/x', 'isggm', 'Sızma', '2026-01-01')")), /permission denied|izin/i);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("DELETE FROM duyuru")), /permission denied|izin/i);
  for (const islev of ["duyuru_yaz", "duyuru_listesi", "duyuru_durumu"]) {
    const r = (await sahip.query<{ guvenli: boolean; yol: boolean; herkes: boolean; uygulama: boolean }>(
      `SELECT p.prosecdef AS guvenli, coalesce(array_to_string(p.proconfig, ',') LIKE '%search_path=%', false) AS yol,
         EXISTS (SELECT 1 FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) x WHERE x.grantee = 0 AND x.privilege_type = 'EXECUTE') AS herkes,
         has_function_privilege('probata_uygulama', p.oid, 'EXECUTE') AS uygulama
       FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = $1`, [islev])).rows;
    assert.deepEqual(r, [{ guvenli: true, yol: true, herkes: false, uygulama: true }], islev);
  }
  /* liste sınırı: negatif / büyük adet güvenli */
  assert.equal((await kiraciIcinde(havuz, A, (db) => duyuruListesi(db, -5))).length, 0);
  assert.ok((await kiraciIcinde(havuz, A, (db) => duyuruListesi(db, 1000))).length <= 60);
});

test("tazelik: son deneme 6 saatten yeniyse okutmaz, eskiyse / hiç yoksa okutur; takılı okuma 'alınamadı'", async () => {
  const simdi = Date.now();
  const b = await kiraciIcinde(havuz, A, (db) => duyuruBolumu(db, simdi));
  assert.equal(b.tazele, false, "az önce okundu");
  assert.equal(b.liste.length, 6);
  assert.equal((await kiraciIcinde(havuz, A, (db) => duyuruBolumu(db, simdi + TAZELIK + 60_000))).tazele, true);
  /* takılı okuma: 2 saattir "çalışıyor" → sonraki deneme onu "takıldı" yapar; durum "alınamadı" */
  await sahip.query("DELETE FROM is_calisma WHERE ad = 'duyuru_okuma'");
  assert.equal((await kiraciIcinde(havuz, A, (db) => duyuruBolumu(db))).tazele, true, "hiç deneme yok");
  await sahip.query("INSERT INTO is_calisma (ad, basladi) VALUES ('duyuru_okuma', now() - interval '2 hours')");
  const id = await isBasla(havuz, "duyuru_okuma");
  assert.ok(id);
  assert.equal((await durum()).hata, true, "takılan okuma alınamadı sayılır");
  await isBitir(havuz, id, "tamam", { okunan_kaynak: 3 });
  assert.equal((await durum()).hata, false);
});
