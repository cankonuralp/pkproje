/* NEREDEN GELDİ: 380 — S.A.Y saha asistanı (maket say.js BB6; ARKA-UC §5.1 / §5.3 / §5.4; reisim 2026-10-03: "her yer de gözükecek", "geçmiş silinmez
   geçmiş olayı önemli"). GERÇEK PostgreSQL, iki firma, firma başına iki kişi:
   · kapalıyken / anahtarsızken cevap yok (düğme yok, söylenir); 550: kuralla cevaplanan hızlı sorular ("Beni ne bekliyor?", "Bu sayfada ne
     yapılır?", "Eksik alanlar", "Sonuç") KALKTI — hepsi serbest soru;
   · serbest soru: sınır AYRILIR, soru geçmişe; istek önbellekli talimat + bağlam (rol adları, sayfa, bekleyen sayıları) — müşteri unvanı, adres,
     kişi adı, e-posta, anahtar GİTMEZ; cevap geçmişe, ayırma gerçek maliyetle kapanır; sınır doluysa soru yazılmaz; cevapsız çağrı bırakılır /
     bilinmiyorsa harcamaya yazılır;
   · geçmiş kişinin kendisinin: aynı firmadaki başka kişi ve başka firma görmez, temizleyemez; uygulama rolü tabloya yazamaz / silemez; kişi başı
     en yeni 200; mesaj sayısı yalnız artar;
   · 382 rapor ekranı: ekranın yaptığı işin cevabının METNİNİ sunucu kurar, yer "Rapor <no>"; eski iletinin öneri kartı bir kez işaretlenir,
     başkası işaretleyemez; serbest soruda yer rapor numarası;
   · 550 (sunum 546 K6 — reisim 2026-10-14: "S.A.Y. de herhangi bir kısıt kural vb olmasını istemiyorum … aynı claud kullanır gibi"): açık raporun
     HARİTASI (yer kimlikleri, şu anki değerler) yalnız raporu yazanın Yeni raporunda ve adres o raporsa; künye gitmez; rapordayken Haiku'nun araç
     çağrıları komut olarak döner (rapor dışında araç ve komut yok); ayırma internet aramasını da kapsar, gerçek maliyete aramalar eklenir.
   · 522 ek: fotoğraf / PDF soruyla gider (adı gitmez), geçmişte yalnız adı / boyu / türü, dosya saklanmaz, ayırma ek sayısıyla büyür.
   Olumsuz kanıt: tests/bozan/say.bozan.ts. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { planIci, planKabul } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { raporOlustur } from "../src/modules/raporlar/server/raporlar.ts";
import { raporSayBilgisi } from "../src/modules/raporlar/server/say-baglanti.ts";
import { sayBirak, sayDurumu, sayGecmisi, sayOneri, sayRaporCevabi, saySorHazirla, saySorKaydet, sayTemizle } from "../src/modules/say/server/say.ts";
import { sayEkleriOku } from "../src/modules/say/server/ek.ts";
import { ayarOku, ayarYaz } from "../src/server/ayar/ayar.ts";
import { sirYaz } from "../src/server/ayar/sir.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { yzAyi } from "../src/server/yz/kullanim.ts";
import { ARAMA_MALIYETI, sayEnCokMaliyet, SORU_SINIRI } from "../src/server/yz/say.ts";
import { sohbetYaz } from "../src/server/yz/sohbet.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, A = "", B = "";
const klasor = mkdtempSync(join(tmpdir(), "say-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme Kişi", roller: roller as Kisi["roller"] });
interface Firma { yon: Kisi; plan: Kisi; den: Kisi }
let FA: Firma, FB: Firma;
const cevap = (metin: string, giris = 3_000, cikis = 200) => ({ content: [{ type: "text", text: metin }], stop_reason: "end_turn", usage: { input_tokens: giris, output_tokens: cikis } });

async function firmaKur(firma: string, ek: string): Promise<Firma> {
  const f = await kiraciIcinde(havuz, firma, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa, eposta, tel) VALUES ('Gizli Sanayi A.Ş.', 'Gizli', $1, '0312 000 00 00') RETURNING id::text", [`iletisim@${ek}.example`]);
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce, sgk) VALUES ($1, 'Gizli Tesis', 'Saklı Cad. 1', 'Ankara', 'Çankaya', $2) RETURNING id::text", [m, "2".repeat(26)]);
    const per = await q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Saklı Denetçi', '2024-01-01', 'elk-muh', '123') RETURNING id::text");
    const h = async (eposta: string, rol: string, personel: string | null = null) => kisi(await q(
      "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme Kişi', $2, 'etkin', $3) RETURNING id::text", [`${eposta}@${ek}.example`, [rol], personel]), rol);
    return { yon: await h("yon", "firma_yoneticisi"), plan: await h("plan", "planlama"), den: await h("den", "denetci", per), tesis, per };
  });
  /* denetçiye plan günü gelmiş, kabul bekleyen bir plan (Planlar balonu kırmızı 1) */
  const g = bugunTr();
  const p = await kiraciIcinde(havuz, firma, (db) => planAc(db, depo, f.plan, firma, { tesis: f.tesis, baslangic: g, bitis: g, ekip: [{ personel: f.per, isgNo: "ISG-1", kaydet: false }] }), { hesapId: f.plan.id });
  assert.equal(p.durum, "tamam", JSON.stringify(p));
  return { yon: f.yon, plan: f.plan, den: f.den };
}
const ile = <T,>(firma: string, k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
const yzAyari = (firma: string, k: Kisi, d: object) => ile(firma, k, async (db) => {
  const m = await ayarOku(db, "yapay_zeka");
  return ayarYaz(db, "yapay_zeka", m.surum, { ...m.deger, ...d }, { kim: "Deneme", ne: "ayar.yapay_zeka" });
});
/* kişinin KENDİ satırı (RLS yalnız firmayı süzer — firmadaki herkesin satırı görünür; 2026-10-08 CI 715bd6f: süzgeçsiz ilk satır planlamacınındı) */
const kullanim = async (firma: string, k: Kisi) => (await ile(firma, k, (db) => db.sorgu<{ mesaj: number; maliyet: string; ayrilan: string }>(
  "SELECT mesaj, maliyet::text, ayrilan::text FROM yz_kullanim WHERE ay = $1 AND hesap_id = $2", [yzAyi(), k.id]))).rows[0] ?? null;

before(async () => {
  process.env.PROBATA_SIR_ANAHTARI ??= randomBytes(32).toString("base64");
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('say-a', 'Say A', 'SA'), ('say-b', 'Say B', 'SB') RETURNING id::text")).rows.map((r) => r.id);
  } finally { await s.end(); }
  FA = await firmaKur(A, "say-a");
  FB = await firmaKur(B, "say-b");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("kapalıyken ve anahtarsızken cevap yok (söylenir, geçmişe yazılmaz); açık + anahtar hazır", async () => {
  assert.deepEqual(await ile(A, FA.den, (db) => sayDurumu(db)), { acik: false, anahtar: false, sinirDoldu: false });
  assert.deepEqual(await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "Soru", "/")), { durum: "red", neden: "S.A.Y firmada kapalı (Firma ayarları › Yapay zekâ)." });
  assert.deepEqual(await ile(A, FA.den, (db) => sayGecmisi(db)), []);
  /* 550: ayırma (en çok maliyet) internet aramasını da kapsar — sınır onu karşılasın */
  await yzAyari(A, FA.yon, { acik: true, sinir: 0.2 });
  assert.deepEqual(await ile(A, FA.den, (db) => sayDurumu(db)), { acik: true, anahtar: false, sinirDoldu: false });
  assert.match(JSON.stringify(await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "Soru", "/planlar"))), /API anahtarı girilmedi/);
  await ile(A, FA.yon, (db) => sirYaz(db, "yapay_zeka_anahtari", "sk-ant-deneme-anahtar-0123456789", { kim: "Deneme" }));
  assert.deepEqual(await ile(A, FA.den, (db) => sayDurumu(db)), { acik: true, anahtar: true, sinirDoldu: false });
  assert.deepEqual(await ile(A, FA.den, (db) => sayGecmisi(db)), [], "reddedilen soru geçmişe yazılmadı");
  assert.equal(await kullanim(A, FA.den), null, "harcama yok");
});

test("serbest soru: ayırma, soru geçmişe; istek önbellekli talimat + bağlam — müşteri, adres, kişi adı, e-posta, anahtar gitmez; cevap geçmişe, gerçek maliyet", async () => {
  const h = await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "  Kabul bekleyen planımı nasıl kabul ederim?  ", "/planlar"));
  assert.equal(h.durum, "hazir", JSON.stringify(h));
  if (h.durum !== "hazir") return;
  const ust = sayEnCokMaliyet("haiku");
  assert.deepEqual(await kullanim(A, FA.den), { mesaj: 0, maliyet: "0", ayrilan: String(ust) }, "çağrıdan önce en kötü maliyet ayrıldı");
  const g = h.istek.govde as { system: { text: string; cache_control?: unknown }[]; messages: { role: string; content: string }[]; model: string };
  assert.equal(g.model, "claude-haiku-5-5");
  assert.deepEqual(g.system[0].cache_control, { type: "ephemeral" }, "sabit talimat önbellekte");
  assert.match(g.system[1].text, /Kullanıcının rolleri: Denetçi\.[\s\S]*Şu an bulunduğu sayfa: Planlar\.[\s\S]*Planlar: 1 plan günü gelmiş, kabul bekleyen plan/);
  const json = JSON.stringify(h.istek.govde);
  assert.doesNotMatch(json, /sk-ant|Gizli|Saklı|iletisim@|Deneme Kişi|say-a\.example/, "anahtar, müşteri, tesis, adres, kişi adı, e-posta gönderilmez");
  /* konuşma: yeni soru, kullanıcıyla başlar, roller sırayla; rapor dışında yalnız internet araması (rapora yazma aracı yok) */
  assert.deepEqual((h.istek.govde as { tools?: { name: string }[] }).tools?.map((t) => t.name), ["web_search"]);
  assert.equal(g.messages.at(-1)?.content, "Kabul bekleyen planımı nasıl kabul ederim?");
  assert.ok(g.messages.every((m, i) => m.role === (i % 2 ? "assistant" : "user")));
  const k = await ile(A, FA.den, (db) => saySorKaydet(db, h, cevap("Planlar › planı açın › Kabul et.\n- Tarafsızlık beyanını onaylayın.", 4_000, 300)));
  assert.equal(k.durum, "tamam");
  assert.deepEqual(k.durum === "tamam" && k.iletiler.map((m) => [m.kim, m.metin]), [["ben", "Kabul bekleyen planımı nasıl kabul ederim?"], ["say", "Planlar › planı açın › Kabul et.\n- Tarafsızlık beyanını onaylayın."]]);
  assert.deepEqual(await kullanim(A, FA.den), { mesaj: 1, maliyet: "550", ayrilan: "0" }, "ayırma gerçek maliyetle kapandı");
  /* cevapsız çağrı: ücretsiz → bırakılır; bilinmiyor → harcamaya + mesaja */
  const h2 = await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "Bir soru daha", "/"));
  assert.ok(h2.durum === "hazir");
  if (h2.durum !== "hazir") return;
  await ile(A, FA.den, (db) => sayBirak(db, h2, "yok"));
  assert.deepEqual(await kullanim(A, FA.den), { mesaj: 1, maliyet: "550", ayrilan: "0" });
  const h3 = await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "Üçüncü soru", "/"));
  if (h3.durum !== "hazir") return assert.fail(JSON.stringify(h3));
  await ile(A, FA.den, (db) => sayBirak(db, h3, "bilinmiyor"));
  assert.deepEqual(await kullanim(A, FA.den), { mesaj: 2, maliyet: String(550 + ust), ayrilan: "0" });
  /* 550: internet araması gerçek maliyete eklenir (arama başına $10 / 1 000) */
  const h4 = await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "Güncel standart ne?", "/"));
  if (h4.durum !== "hazir") return assert.fail(JSON.stringify(h4));
  await ile(A, FA.den, (db) => saySorKaydet(db, h4, { ...cevap("Arandı.", 4_000, 300), usage: { input_tokens: 4_000, output_tokens: 300, server_tool_use: { web_search_requests: 2 } } }));
  assert.deepEqual(await kullanim(A, FA.den), { mesaj: 3, maliyet: String(550 + ust + 550 + 2 * ARAMA_MALIYETI), ayrilan: "0" });
  /* boş / uzun soru */
  assert.deepEqual(await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "   ", "/")), { durum: "red", neden: "Sorunuzu yazın." });
  assert.deepEqual(await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "x".repeat(SORU_SINIRI + 1), "/")), { durum: "red", neden: `Soru en çok ${SORU_SINIRI} karakter.` });
});

test("sınır doluysa serbest soru yazılmaz (ekranın yaptığı iş ücretsiz, çalışır); düğme 'sınırınız doldu' der", async () => {
  /* sınır 0,2 $ = 200 000; harcanan ≥ 200 000 olsun diye bilinmeyen çağrılar (550: ust 44 000 — arama dahil) */
  for (let i = 0; i < 40 && !(await ile(A, FA.den, (db) => sayDurumu(db))).sinirDoldu; i++) {
    const h = await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, `Sınır sorusu ${i}`, "/"));
    if (h.durum !== "hazir") break;
    await ile(A, FA.den, (db) => sayBirak(db, h, "bilinmiyor"));
  }
  assert.equal((await ile(A, FA.den, (db) => sayDurumu(db))).sinirDoldu, true);
  const once = (await ile(A, FA.den, (db) => sayGecmisi(db))).length;
  const r = await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "Sınırdan sonra", "/"));
  assert.match(JSON.stringify(r), /sınırınız doldu/);
  assert.equal((await ile(A, FA.den, (db) => sayGecmisi(db))).length, once, "soru geçmişe yazılmadı");
  const islem = { hizli: "islem", rapor: { id: "6f0c1d2e-3a4b-4c5d-8e9f-0a1b2c3d4e5f", no: "SA-1026-001" }, islem: { istek: "geri", soru: "Geri al", sayi: 0 } };
  assert.equal((await ile(A, FA.den, (db) => sayRaporCevabi(db, islem))).durum, "tamam", "ekranın yaptığı iş ücretsiz, çalışır");
});

test("GÜVENLİK: geçmiş kişinin kendisinin — aynı firmadaki başkası ve başka firma görmez, temizleyemez; tabloya doğrudan yazma / silme yok; en yeni 200", async () => {
  /* planlamacının iki iletisi (işlevle — oturumdaki kişi) */
  for (const kim of ["ben", "say"] as const) await ile(A, FA.plan, (db) => sohbetYaz(db, { kim, metin: `Planlamacı ${kim}`, yer: "Ana sayfa" }));
  const den = await ile(A, FA.den, (db) => sayGecmisi(db));
  assert.ok(den.length > 4);
  const plan = await ile(A, FA.plan, (db) => sayGecmisi(db));
  assert.ok(plan.length === 2 && !plan.some((m) => den.some((d) => d.id === m.id)), "planlamacı denetçinin geçmişini görmez");
  /* B firmasında açık ve aynı kişi kimliğiyle bile A'nın geçmişi yok */
  await yzAyari(B, FB.yon, { acik: true });
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => db.sorgu("SELECT * FROM yz_sohbet"), { hesapId: FA.den.id }).then((r) => r.rows), []);
  assert.deepEqual(await ile(B, FB.den, (db) => sayGecmisi(db)), []);
  /* doğrudan yazma / güncelleme / silme yok; işlev oturumsuz çalışmaz */
  await assert.rejects(ile(A, FA.den, (db) => db.sorgu("INSERT INTO yz_sohbet (hesap_id, kim, metin, yer) VALUES ($1, 'ben', 'x', 'y')", [FA.plan.id])), /permission denied|izin/i);
  await assert.rejects(ile(A, FA.den, (db) => db.sorgu("UPDATE yz_sohbet SET metin = 'değişti'")), /permission denied|izin/i);
  await assert.rejects(ile(A, FA.den, (db) => db.sorgu("DELETE FROM yz_sohbet")), /permission denied|izin/i);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => sohbetYaz(db, { kim: "ben", metin: "x", yer: "y" })), /oturumdaki kişi/);
  await assert.rejects(ile(A, FA.den, (db) => sohbetYaz(db, { kim: "kotu" as "ben", metin: "x", yer: "y" })), /check constraint/);
  /* mesaj sayısı yalnız artar */
  await assert.rejects(ile(A, FA.den, (db) => db.sorgu("UPDATE yz_kullanim SET mesaj = mesaj - 1")), /yalnız artar/);
  /* temizle yalnız kendi geçmişini */
  assert.equal(await ile(A, FA.plan, (db) => sayTemizle(db)), 2);
  assert.deepEqual(await ile(A, FA.plan, (db) => sayGecmisi(db)), []);
  assert.equal((await ile(A, FA.den, (db) => sayGecmisi(db))).length, den.length, "denetçinin geçmişi duruyor");
  /* 550: uzun ileti (Haiku'nun uzun cevabı) yazılır; sınır 100 000 karakter (göç 0090) */
  await ile(A, FA.plan, (db) => sohbetYaz(db, { kim: "say", metin: "u".repeat(60_000), yer: "Ana sayfa" }));
  await assert.rejects(ile(A, FA.plan, (db) => sohbetYaz(db, { kim: "say", metin: "u".repeat(100_001), yer: "Ana sayfa" })), /check constraint/);
  /* kişi başı en yeni 200 */
  for (let i = 0; i < 205; i++) await ile(A, FA.plan, (db) => sohbetYaz(db, { kim: i % 2 ? "say" : "ben", metin: `İleti ${i}`, yer: "Ana sayfa" }));
  const son = await ile(A, FA.plan, (db) => sayGecmisi(db));
  assert.equal(son.length, 100, "ekrana en yeni 100");
  assert.equal(son.at(-1)?.metin, "İleti 204");
  const toplam = await ile(A, FA.plan, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM yz_sohbet"));
  assert.equal(toplam.rows[0].n, 200);
});

test("382 rapor ekranı: işin metnini sunucu kurar, yer 'Rapor <no>'; eski öneri kartı bir kez, yalnız sahibi işaretler", async () => {
  const R = { id: "6f0c1d2e-3a4b-4c5d-8e9f-0a1b2c3d4e5f", no: "SA-1026-001" };
  assert.deepEqual(await ile(A, FA.yon, (db) => sayRaporCevabi(db, { hizli: "islem", rapor: { id: "kotu", no: R.no }, islem: { istek: "geri", soru: "x", sayi: 0 } })),
    { durum: "red", neden: "Rapor bilgisi okunamadı; sayfayı yenileyip yeniden deneyin." });
  assert.equal((await ile(A, FA.yon, (db) => sayRaporCevabi(db, { hizli: "eksik", rapor: R, eksik: [] }))).durum, "red", "550: eski hızlı soru kalktı");
  const e = await ile(A, FA.yon, (db) => sayRaporCevabi(db, { hizli: "islem", rapor: R, metin: "sahte", islem: { istek: "geri", soru: "Geri al", sayi: 3 } }));
  assert.ok(e.durum === "tamam");
  if (e.durum !== "tamam") return;
  assert.deepEqual(e.iletiler.map((m) => [m.kim, m.metin, m.yer]), [["ben", "Geri al", `Rapor ${R.no}`], ["say", "3 girişi geri aldım.", `Rapor ${R.no}`]]);
  assert.equal(e.iletiler[1].ek?.rapor, R.id);
  /* eski iletideki öneri kartı (382): bir kez, yalnız sahibi */
  const id = await ile(A, FA.yon, (db) => sohbetYaz(db, { kim: "say", metin: "Önerim:", yer: `Rapor ${R.no}`,
    ek: { rapor: R.id, oneri: { alan: "sonuc", deger: "uygun_degil", ad: "Sonuç ve kanaat → Uygun değil", durum: "" } } }));
  assert.equal(await ile(A, FA.plan, (db) => sayOneri(db, id, "uygulandi")), false, "başkasının iletisini işaretleyemez");
  assert.equal(await ile(A, FA.yon, (db) => sayOneri(db, id, "uygulandi")), true);
  assert.equal(await ile(A, FA.yon, (db) => sayOneri(db, id, "vazgecildi")), false, "bir kez");
  assert.equal((await ile(A, FA.yon, (db) => sayGecmisi(db))).find((x) => x.id === id)?.ek?.oneri?.durum, "uygulandi");
  await assert.rejects(ile(A, FA.yon, (db) => db.sorgu("SELECT yz_sohbet_oneri($1, 'kotu')", [id])), /öneri sonucu geçersiz/);
  /* serbest soru rapor ekranında: yer "Rapor <no>" (yalnız Raporlar sayfasında, biçim denetli) */
  await yzAyari(A, FA.yon, { sinir: null });
  const h = await ile(A, FA.yon, (db) => saySorHazirla(db, FA.yon, "Bu raporda neye dikkat edeyim?", `/raporlar/${R.id}`, new Date(), R.no));
  assert.ok(h.durum === "hazir" && h.yer === `Rapor ${R.no}`);
  if (h.durum === "hazir") await ile(A, FA.yon, (db) => sayBirak(db, h, "yok"));
  const h2 = await ile(A, FA.yon, (db) => saySorHazirla(db, FA.yon, "Başka soru", "/planlar", new Date(), "<b>x</b>"));
  assert.ok(h2.durum === "hazir" && h2.yer === "Planlar");
  if (h2.durum === "hazir") await ile(A, FA.yon, (db) => sayBirak(db, h2, "yok"));
});

test("550 açık rapor haritası: yalnız raporu yazanın Yeni raporunda, adres o raporsa; künye gitmez; araç çağrıları komut olur", async () => {
  const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
  const f = await ile(A, FA.yon, async (db) => {
    const tur = (await db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EP', 'Elektrik panosu', 'elektrik', 'e', 12) RETURNING id::text")).rows[0].id;
    const tesis = (await db.sorgu<{ id: string }>("SELECT id::text FROM tesis LIMIT 1")).rows[0].id;
    const ekp = (await db.sorgu<{ id: string }>("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'EP-S1', 'x') RETURNING id::text", [tesis, tur])).rows[0].id;
    const t = tamam(await taslakBaslat(db, FA.yon, tur, "sablon:ZPKR02", null));
    tamam(await yayinla(db, FA.yon, t.id, t.surum, ""));
    const per = (await db.sorgu<{ p: string }>("SELECT personel_id::text AS p FROM hesap WHERE id = $1", [FA.den.id])).rows[0].p;
    return { ekp, tesis, per };
  });
  /* ekipman plan açılınca plana girer: ekipmandan sonra yeni plan */
  const g = bugunTr();
  const plan = tamam(await ile(A, FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis: f.tesis, baslangic: g, bitis: g, ekip: [{ personel: f.per, isgNo: "ISG-2", kaydet: false }] }))).id;
  const v = (await ile(A, FA.den, (db) => planIci(db, FA.den, plan)))!;
  tamam(await ile(A, FA.den, (db) => planKabul(db, FA.den, plan, v.surum, true)));
  const rapor = tamam(await ile(A, FA.den, (db) => raporOlustur(db, FA.den, plan, f.ekp))).id;
  const bilgi = await ile(A, FA.den, (db) => raporSayBilgisi(db, FA.den, rapor));
  assert.equal(bilgi?.turAd, "Elektrik panosu");
  assert.equal(await ile(A, FA.plan, (db) => raporSayBilgisi(db, FA.plan, rapor)), null, "raporu yazmayan alamaz");
  assert.equal(await ile(B, FB.den, (db) => raporSayBilgisi(db, FB.den, rapor)), null, "başka firma alamaz");
  /* denetçinin sınırı önceki testte doldu: sınırsız yap */
  await yzAyari(A, FA.yon, { sinir: null });
  const madde = bilgi!.tanim.bolumler.flatMap((b) => (b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler) : []))[0];
  const canli = { id: rapor, cevaplar: { alan: { kurulus: "Örnek Kuruluş" }, madde: { [madde.id]: { c: "Uygun değil", not: "Kapak kırık" } }, yorum: "Uzman notu",
    kunye: { firma_adi: "Gizli Sanayi A.Ş." } }, ekipman: { marka: "Örnek Marka" } };
  const h = await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "Seri no'ya SN-1 yaz", `/raporlar/${rapor}`, new Date(), "SA-1026-001", canli));
  assert.ok(h.durum === "hazir", JSON.stringify(h));
  if (h.durum !== "hazir") return;
  assert.equal(h.rapor, rapor);
  const govde = h.istek.govde as { system: { text: string }[]; tools: { name: string }[] };
  const baglam = govde.system[1].text;
  assert.match(baglam, /Açık rapor \(kullanıcının şu an yazdığı, kaydedilmemiş değişiklikler dahil\):\nEkipman türü: Elektrik panosu\./);
  assert.ok(baglam.includes('- e:marka · Marka (yazı) = "Örnek Marka"') && baglam.includes('- a:kurulus · ') && baglam.includes(`- m:${madde.id} · ${madde.metin} = "Uygun değil"`), baglam);
  assert.deepEqual(govde.tools.map((t) => t.name), ["rapora_yaz", "fotograflari_oku", "geri_al", "web_search"]);
  assert.doesNotMatch(JSON.stringify(h.istek.govde), /Gizli Sanayi|Gizli Tesis|Saklı Cad|sk-ant/, "künye ve anahtar gitmez");
  /* cevaptaki araç çağrıları komut olarak döner; S.A.Y iletisi rapora bağlı (Geri al o raporda) */
  const k = await ile(A, FA.den, (db) => saySorKaydet(db, h, { content: [{ type: "tool_use", name: "rapora_yaz", input: { girisler: [{ yer: "e:seri", deger: "SN-1" }] } }],
    stop_reason: "tool_use", usage: { input_tokens: 9_000, output_tokens: 120 } }));
  if (k.durum !== "tamam") return assert.fail(JSON.stringify(k));
  assert.deepEqual(k.komutlar, [{ tur: "yaz", girisler: [{ yer: "e:seri", deger: "SN-1" }] }]);
  assert.deepEqual(k.iletiler.map((m) => [m.kim, m.metin, m.ek?.rapor]), [["ben", "Seri no'ya SN-1 yaz", rapor], ["say", "1 giriş yapıyorum.", rapor]]);
  /* adres başka sayfaysa ya da raporu yazmayan sorarsa harita ve rapor araçları yok; araç çağrısı gelse de komut dönmez */
  for (const [kim, yol] of [[FA.den, "/planlar"], [FA.plan, `/raporlar/${rapor}`]] as const) {
    const x = await ile(A, kim, (db) => saySorHazirla(db, kim, "Soru", yol, new Date(), null, canli));
    assert.ok(x.durum === "hazir");
    if (x.durum !== "hazir") continue;
    assert.doesNotMatch((x.istek.govde as { system: { text: string }[] }).system[1].text, /Açık rapor/);
    assert.deepEqual((x.istek.govde as { tools?: { name: string }[] }).tools?.map((t) => t.name), ["web_search"]);
    const y = await ile(A, kim, (db) => saySorKaydet(db, x, { content: [{ type: "tool_use", name: "rapora_yaz", input: { girisler: [{ yer: "e:seri", deger: "X" }] } }, { type: "text", text: "Tamam" }],
      stop_reason: "end_turn", usage: { input_tokens: 10, output_tokens: 1 } }));
    assert.ok(y.durum === "tamam" && !y.komutlar, "rapor dışında komut yok");
  }
});

test("522 ek: fotoğraf ve PDF soruyla gider, adları gitmez; geçmişte adı / türü / boyu kalır, dosya saklanmaz; ayırma ek sayısıyla; yalnız ekle soru", async () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x03, 0x01, 0xff, 0xda, 0x00, 0x02, 0x01, 0x02, 0x03, 0xff, 0xd9]);
  const pdf = new Uint8Array(Buffer.from("%PDF-1.4\n%%EOF"));
  const ekler = sayEkleriOku([{ bayt: jpeg, ad: "Gizli etiket.jpg" }, { bayt: pdf, ad: "kılavuz.pdf" }]);
  if (!Array.isArray(ekler)) return assert.fail(JSON.stringify(ekler));
  const dosyaOnce = (await ile(A, FA.plan, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM dosya"))).rows[0].n;
  /* soru boş, yalnız ek: soru kendiliğinden */
  const h = await ile(A, FA.plan, (db) => saySorHazirla(db, FA.plan, "  ", "/planlar", new Date(), null, null, ekler));
  if (h.durum !== "hazir") return assert.fail(JSON.stringify(h));
  assert.equal(h.ust, sayEnCokMaliyet("haiku", 2));
  assert.equal((await kullanim(A, FA.plan))?.ayrilan, String(sayEnCokMaliyet("haiku", 2)), "ayırma iki ekle");
  const son = (h.istek.govde as { messages: { content: unknown }[] }).messages.at(-1)!.content as { type: string; text?: string }[];
  assert.deepEqual(son.map((b) => b.type), ["image", "document", "text"]);
  assert.match(son[2].text ?? "", /Ek 1 \(fotoğraf\), Ek 2 \(PDF belge\)[\s\S]*Soru:\nEkleri inceler misin\?$/);
  assert.doesNotMatch(JSON.stringify(h.istek.govde), /Gizli|kılavuz|Saklı|iletisim@/, "ek adı, müşteri, kişi gitmez");
  const k = await ile(A, FA.plan, (db) => saySorKaydet(db, h, cevap("Etikette 220 V yazıyor.")));
  if (k.durum !== "tamam") return assert.fail(JSON.stringify(k));
  assert.deepEqual(k.iletiler.map((m) => [m.kim, m.metin, m.ek?.ekler ?? null]), [
    ["ben", "Ekleri inceler misin?", [{ ad: "Gizli etiket.jpg", boyut: jpeg.length, tur: "foto" }, { ad: "kılavuz.pdf", boyut: pdf.length, tur: "pdf" }]],
    ["say", "Etikette 220 V yazıyor.", null]]);
  const g = (await ile(A, FA.plan, (db) => sayGecmisi(db))).at(-2);
  assert.deepEqual(g?.ek, { ekler: [{ ad: "Gizli etiket.jpg", boyut: jpeg.length, tur: "foto" }, { ad: "kılavuz.pdf", boyut: pdf.length, tur: "pdf" }] }, "geçmişte yalnız ad / boy / tür");
  assert.equal((await ile(A, FA.plan, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM dosya"))).rows[0].n, dosyaOnce, "dosya saklanmadı");
  assert.equal((await kullanim(A, FA.plan))?.ayrilan, "0", "ayırma gerçek maliyetle kapandı");
  /* eksiz boş soru yine red */
  assert.deepEqual(await ile(A, FA.plan, (db) => saySorHazirla(db, FA.plan, "", "/")), { durum: "red", neden: "Sorunuzu yazın." });
});

/* 553 (reisim 2026-10-14: "konuşarak ilgili formatı yapabiliyo olalım"): format yapıcıda S.A.Y taslağın haritasını alır — yalnız adres o taslağın
   kurucusuysa, kişi formatı DEĞİŞTİREBİLİYORSA (Ekipman türleri "yaz") ve taslak hâlâ taslaksa; Haiku'nun formati_duzenle çağrısı "format" komutu
   olur (iletide taslağın kimliği — Geri al o taslakta), harita gönderilmediyse komut dönmez */
test("553 format yapıcı: harita yalnız kurucu adresinde, formatı değiştirebilene, taslakta; format komutu döner", async () => {
  const { FormatTanimi } = await import("../src/format/tanim.ts");
  const { SABLONLAR } = await import("../src/format/sablonlar.ts");
  const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
  const f = await ile(A, FA.yon, async (db) => {
    const tur = (await db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('RC', 'RC deneme', 'elektrik', 'e', 12) RETURNING id::text")).rows[0].id;
    const t = tamam(await taslakBaslat(db, FA.yon, tur, "sablon:ZPKR02", null));
    return { tur, taslak: t.id, surum: t.surum };
  });
  await yzAyari(A, FA.yon, { sinir: null });
  const kurucu = { id: f.taslak, tanim: FormatTanimi.parse(SABLONLAR.ZPKR02.tanim) };
  const yol = `/ekipman-turleri/${f.tur}/sablon/${f.taslak}/kurucu`;
  const h = await ile(A, FA.yon, (db) => saySorHazirla(db, FA.yon, "Pano sigortaları tablosuna RCa sütunu ekle, formülü 480 / RCd", yol, new Date(), null, null, [], kurucu));
  if (h.durum !== "hazir") return assert.fail(JSON.stringify(h));
  assert.equal(h.format, f.taslak);
  const g = h.istek.govde as { system: { text: string }[]; tools: { name: string }[] };
  assert.ok(g.system[1].text.includes("Açık format taslağı (format yapıcıda, kaydedilmemiş değişiklikler dahil):"));
  assert.ok(g.system[1].text.includes("## linye · ölçüm tablosu · Pano sigortaları (linye)"));
  assert.deepEqual(g.tools.map((t) => t.name), ["formati_duzenle", "web_search"]);
  const k = await ile(A, FA.yon, (db) => saySorKaydet(db, h, { content: [{ type: "tool_use", name: "formati_duzenle",
    input: { islemler: [{ islem: "oge_ekle", bolum: "linye", ad: "RCa", formul: "480 / RCd" }] } }], stop_reason: "tool_use", usage: { input_tokens: 9_000, output_tokens: 90 } }));
  if (k.durum !== "tamam") return assert.fail(JSON.stringify(k));
  assert.deepEqual(k.komutlar, [{ tur: "format", islemler: [{ islem: "oge_ekle", bolum: "linye", ad: "RCa", formul: "480 / RCd" }] }]);
  assert.deepEqual([k.iletiler[1].metin, k.iletiler[1].ek], ["formatta 1 değişiklik yapıyorum.", { format: f.taslak }]);
  /* değiştiremeyen (denetçi: Ekipman türleri "gör"), başka adres, yayımlanmış sürüm: harita ve format aracı yok, komut dönmez */
  const yok = async (kim: Kisi, y: string) => {
    const x = await ile(A, kim, (db) => saySorHazirla(db, kim, "Soru", y, new Date(), null, null, [], kurucu));
    if (x.durum !== "hazir") return assert.fail(JSON.stringify(x));
    assert.ok(!(x.istek.govde as { system: { text: string }[] }).system[1].text.includes("Açık format taslağı"), `${kim.roller[0]} ${y}`);
    assert.deepEqual((x.istek.govde as { tools?: { name: string }[] }).tools?.map((t) => t.name), ["web_search"]);
    const z = await ile(A, kim, (db) => saySorKaydet(db, x, { content: [{ type: "tool_use", name: "formati_duzenle", input: { islemler: [{ islem: "bolum_sil", bolum: "linye" }] } }],
      stop_reason: "tool_use", usage: { input_tokens: 10, output_tokens: 1 } }));
    assert.ok(z.durum === "tamam" && !z.komutlar, "harita yoksa komut yok");
  };
  await yok(FA.den, yol);
  await yok(FA.yon, `/ekipman-turleri/${f.tur}`);
  tamam(await ile(A, FA.yon, (db) => yayinla(db, FA.yon, f.taslak, f.surum, "")));
  await yok(FA.yon, yol);
});
