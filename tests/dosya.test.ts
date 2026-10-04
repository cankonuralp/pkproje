/* NEREDEN GELDİ: 09-A1 (kapalı depo, anahtar tek üreticiden, okunur bilgi yok) · A2 (tek indirme ucu, başka firmanın / yetkisiz kaydın dosyası
   404, kalıcı bağlantı yok, nosniff + private + Content-Disposition) · A3 (görsel <img src>'ye adresle yazılmaz) · A4 (tür baytlardan, SVG /
   HTML yok, sınır sunucuda, EXIF silinir) · reisim 2026-10-04: "sızma veri çalma gibi şeylere dikkat et". Saf denetimler + GERÇEK PostgreSQL
   (iki firma) + kaynak taraması. Olumsuz kanıt: tests/bozan/dosya.bozan.ts. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { dosyaAnahtari } from "../src/server/dosya/anahtar.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { dosyaIndirilebilir, dosyaYukle, indirmeBasliklari, type ErisimKaydi } from "../src/server/dosya/dosya.ts";
import { jpegTemizle, pngTemizle, turBul } from "../src/server/dosya/tur.ts";
import { dosyalar, oku } from "./yardimci/denetimler.ts";
import { testKumesi } from "./yardimci/kume.ts";

const b = (...p: (number[] | string)[]) => new Uint8Array(p.flatMap((x) => (typeof x === "string" ? [...Buffer.from(x, "latin1")] : x)));
const seg = (isaret: number, govde: string) => b([0xff, isaret, (govde.length + 2) >> 8, (govde.length + 2) & 0xff], govde);
/* uydurma JPEG: JFIF + EXIF (konum) + yorum + tablo + tarama */
export const JPEG = b([0xff, 0xd8], [...seg(0xe0, "JFIF\0\x01\x01")], [...seg(0xe1, "Exif\0\0GPSLatitude=41.0;GPSLongitude=29.0")], [...seg(0xfe, "Deneme cihaz")],
  [...seg(0xdb, "\0" + "\x01".repeat(64))], [0xff, 0xda, 0, 2], "goruntu-verisi", [0xff, 0xd9]);
const parca = (ad: string, govde: string) => b([0, 0, govde.length >> 8, govde.length & 0xff], ad, govde, [0, 0, 0, 0]);
export const PNG = b([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], [...parca("IHDR", "\0\0\0\x01\0\0\0\x01\x08\x02\0\0\0")], [...parca("tEXt", "Author\0Deneme")],
  [...parca("eXIf", "MM\0*GPS")], [...parca("IDAT", "veri")], [...parca("IEND", "")]);
const PDF = b("%PDF-1.7\n1 0 obj<<>>endobj\n%%EOF");
const XLSX = b([0x50, 0x4b, 0x03, 0x04], "....[Content_Types].xml....xl/workbook.xml....");
const SVG = b('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const HTML = b("<!DOCTYPE html><html><body><script>fetch('/api')</script></body></html>");

test("TÜR baytlardan: JPEG / PNG / PDF / XLSX tanınır; SVG, HTML, sıradan ZIP, izinsiz tür reddedilir (uzantı hiç sorulmaz)", () => {
  const hepsi = ["jpeg", "png", "pdf", "xlsx", "csv"] as const;
  assert.equal(turBul(JPEG, hepsi), "jpeg");
  assert.equal(turBul(PNG, hepsi), "png");
  assert.equal(turBul(PDF, hepsi), "pdf");
  assert.equal(turBul(XLSX, hepsi), "xlsx");
  assert.equal(turBul(new TextEncoder().encode("Ekipman kodu;Tür\nHT-1001;Kompresör\n"), hepsi), "csv");
  assert.equal(turBul(b("Ekipman kodu;T\xfcr\nHT-1001;Kompres\xf6r\n"), hepsi), "csv", "Windows-1254 CSV");
  assert.equal(turBul(b("a;b\n<svg onload=x>"), hepsi), null, "tek baytlık metinde de işaretleme yasak");
  for (const [ad, x] of [["svg", SVG], ["html", HTML], ["zip", b([0x50, 0x4b, 0x03, 0x04], "baska.txt")], ["ikili", b([0, 1, 2, 3])], ["xml", b('<?xml version="1.0"?><a/>')]] as const) {
    assert.equal(turBul(x, hepsi), null, ad);
  }
  assert.equal(turBul(PDF, ["jpeg", "png"]), null, "izinli değilse tanınsa da reddedilir");
  assert.equal(turBul(b("a;b\n"), ["jpeg"]), null, "CSV yalnız gereken yerde");
});

test("EXIF: JPEG'in konum / cihaz / yorum parçaları atılır, görüntü baytları aynen kalır; PNG metin ve eXIf parçaları atılır", () => {
  const j = Buffer.from(jpegTemizle(JPEG)).toString("latin1");
  assert.ok(!j.includes("GPS") && !j.includes("Deneme cihaz"));
  assert.ok(j.includes("JFIF") && j.includes("goruntu-verisi") && j.endsWith("\xff\xd9"));
  assert.deepEqual(jpegTemizle(jpegTemizle(JPEG)), jpegTemizle(JPEG));
  const p = Buffer.from(pngTemizle(PNG)).toString("latin1");
  assert.ok(!p.includes("GPS") && !p.includes("Author"));
  assert.ok(p.includes("IHDR") && p.includes("IDAT") && p.includes("IEND"));
  assert.throws(() => jpegTemizle(b([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff])), /Bozuk JPEG/);
});

test("ANAHTAR yalnız kimliklerden; yol aşma ve okunur ad giremez; depo anahtar dışı yolu ve ikinci yazmayı reddeder", async () => {
  const [f, k, d] = [randomUUID(), randomUUID(), randomUUID()];
  assert.equal(dosyaAnahtari({ firmaId: f, modul: "rapor", kayitId: k, dosyaId: d }), `firma/${f}/rapor/${k}/${d}`);
  for (const bozuk of [{ modul: "../x" }, { modul: "Rapor" }, { kayitId: "../../etc" }, { dosyaId: "ahmet-yilmaz.jpg" }]) {
    assert.throws(() => dosyaAnahtari({ firmaId: f, modul: "rapor", kayitId: k, dosyaId: d, ...bozuk }), /Geçersiz/);
  }
  const kok = mkdtempSync(join(tmpdir(), "depo-"));
  try {
    const depo = klasorDepo(kok);
    const a = dosyaAnahtari({ firmaId: f, modul: "rapor", kayitId: k, dosyaId: d });
    await depo.yaz(a, PDF);
    assert.deepEqual(await depo.oku(a), PDF);
    await assert.rejects(depo.yaz(a, JPEG), /EEXIST/, "dosya değişmez: aynı anahtara ikinci yazma yok");
    for (const y of ["../../etc/passwd", `firma/${f}/../../x`, "/etc/passwd"]) await assert.rejects(depo.oku(y), /Geçersiz depo anahtarı/);
  } finally { rmSync(kok, { recursive: true, force: true }); }
});

test("BAŞLIKLAR: private, nosniff, sandbox; Excel her zaman indirilir; dosya adı başlığa satır / tırnak sokamaz", () => {
  const h = indirmeBasliklari({ anahtar: "x", ad: 'rapor"\r\nSet-Cookie: x=1.xlsx', tur: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", boyut: 10 }, "ac");
  assert.equal(h["X-Content-Type-Options"], "nosniff");
  assert.match(h["Cache-Control"]!, /^private/);
  assert.match(h["Content-Security-Policy"]!, /sandbox/);
  assert.match(h["Content-Disposition"]!, /^attachment; /);
  assert.ok(!/[\r\n]/.test(h["Content-Disposition"]!) && !h["Content-Disposition"]!.includes('rapor"'));
  assert.match(indirmeBasliklari({ anahtar: "x", ad: "foto.jpg", tur: "image/jpeg", boyut: 1 }, "ac")["Content-Disposition"]!, /^inline/);
  assert.match(indirmeBasliklari({ anahtar: "x", ad: "foto.jpg", tur: "image/jpeg", boyut: 1 }, "indir")["Content-Disposition"]!, /^attachment/);
});

/* ── gerçek PostgreSQL ─────────────────────────────────────────────────────────────────────────────────────────── */
let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string, depoKok: string;
const KAYIT = randomUUID(), YASAK_KAYIT = randomUUID();
const KISI = { id: randomUUID(), roller: ["denetci"] };
/* deneme modülü: yalnız KAYIT'ı gösterir */
const ERISIM: ErisimKaydi = { deneme: async (_db, _k, kayitId) => kayitId === KAYIT };

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  depoKok = mkdtempSync(join(tmpdir(), "depo-pg-"));
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(depoKok, { recursive: true, force: true }); });

const yukle = (firma: string, bayt: Uint8Array, kayitId = KAYIT, izinli = ["jpeg", "png", "pdf"] as const) => kiraciIcinde(havuz, firma, (db) =>
  dosyaYukle(db, klasorDepo(depoKok), { firmaId: firma, modul: "deneme", kayitId, ad: "Saha fotoğrafı 1.jpg", bayt, izinli, kim: "Deneme" }));
const indir = (firma: string, id: string, erisim = ERISIM) => kiraciIcinde(havuz, firma, (db) => dosyaIndirilebilir(db, KISI, id, erisim));

test("YÜKLE: içerik temizlenip depoya, kayıt + iz aynı işlemde; sahte uzantılı SVG / büyük / boş dosya reddedilir", async () => {
  const y = await yukle(A, JPEG);
  assert.ok(y.tamam);
  if (!y.tamam) return;
  const depodaki = Buffer.from(await klasorDepo(depoKok).oku(dosyaAnahtari({ firmaId: A, modul: "deneme", kayitId: KAYIT, dosyaId: y.id }))).toString("latin1");
  assert.ok(!depodaki.includes("GPS"), "depoya konum bilgisi gitmedi");
  const iz = await kiraciIcinde(havuz, A, (db) => db.sorgu<{ ne: string }>("SELECT ne FROM denetim_izi WHERE nesne = 'dosya' AND nesne_id = $1", [y.id]));
  assert.equal(iz.rows[0]?.ne, "dosya.yukle");
  assert.deepEqual(await yukle(A, SVG), { tamam: false, neden: "tur" });
  assert.deepEqual(await yukle(A, HTML), { tamam: false, neden: "tur" });
  assert.deepEqual(await yukle(A, new Uint8Array()), { tamam: false, neden: "bos" });
  const buyuk = new Uint8Array(26 << 20); buyuk.set(PDF);
  assert.deepEqual(await yukle(A, buyuk), { tamam: false, neden: "buyuk" });
});

test("İNDİR: aynı firmada yetkili kayıt açılır; başka firma, erişimi tanımsız modül, yetkisiz kayıt, çöp, bozuk kimlik → yok", async () => {
  const y = await yukle(A, PDF);
  assert.ok(y.tamam);
  if (!y.tamam) return;
  const d = await indir(A, y.id);
  assert.equal(d?.tur, "application/pdf");
  assert.equal(d?.ad, "Saha fotoğrafı 1.jpg");
  assert.equal(await indir(B, y.id), null, "başka firma");
  assert.equal(await indir(A, y.id, {}), null, "modülün erişim denetimi yok → kimseye açık değil");
  assert.equal(await indir(A, y.id, JSON.parse('{"__proto__": 1, "toString": 1}')), null);
  const yasak = await yukle(A, PDF, YASAK_KAYIT);
  assert.ok(yasak.tamam);
  if (yasak.tamam) assert.equal(await indir(A, yasak.id), null, "bağlı kaydı göremeyen dosyayı da göremez");
  await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE dosya SET cop = now() WHERE id = $1", [y.id]));
  assert.equal(await indir(A, y.id), null, "çöpteki");
  assert.equal(await indir(A, "../x"), null);
});

test("VERİTABANI: anahtar kaydın kendisine bağlı (başka firmanın anahtarı yazılamaz); içerik sonradan değiştirilemez", async () => {
  const y = await yukle(B, PNG);
  assert.ok(y.tamam);
  if (!y.tamam) return;
  const bAnahtar = dosyaAnahtari({ firmaId: B, modul: "deneme", kayitId: KAYIT, dosyaId: y.id });
  const id = randomUUID();
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu(
    "INSERT INTO dosya (id, modul, kayit_id, anahtar, ad, tur, boyut, sha256) VALUES ($1, 'deneme', $2, $3, 'x', 'image/png', 1, $4)", [id, KAYIT, bAnahtar, "0".repeat(64)])), /check constraint/);
  await assert.rejects(kiraciIcinde(havuz, B, (db) => db.sorgu("UPDATE dosya SET tur = 'application/pdf' WHERE id = $1", [y.id])), /değiştirilemez/);
  await assert.rejects(kiraciIcinde(havuz, B, (db) => db.sorgu("DELETE FROM dosya")), /permission denied/);
});

test("TARAMA: depo anahtarını yalnız anahtar üreticisi birleştirir; dosya adresi yalnız tek uçta ve GizliResim'de, <img src>'ye yazılmaz", () => {
  const metinler = dosyalar("src", [".ts", ".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.deepEqual(metinler.filter((m) => /["'`]firma\/(\$\{|["'`]\s*\+)/.test(m.metin) && m.ad !== "src/server/dosya/anahtar.ts").map((m) => m.ad), []);
  const IZINLI = ["src/components/gizli-resim/GizliResim.tsx", "src/proxy.ts", "src/app/api/dosya/[id]/route.ts", "src/server/dosya/dosya.ts"];
  assert.deepEqual(metinler.filter((m) => m.metin.includes("/api/dosya") && !IZINLI.includes(m.ad)).map((m) => m.ad), []);
  assert.deepEqual(metinler.filter((m) => /<img[^>]*src=\{?["'`]?\/api\//.test(m.metin)).map((m) => m.ad), []);
});
