/* NEREDEN GELDİ: 380 — S.A.Y saha asistanı (maket say.js BB6; ARKA-UC §5.1 / §5.3 / §5.4; reisim 2026-10-03: "her yer de gözükecek", "geçmiş silinmez
   geçmiş olayı önemli"). GERÇEK PostgreSQL, iki firma, firma başına iki kişi:
   · kapalıyken / anahtarsızken cevap yok (düğme yok, söylenir); açıkken "Beni ne bekliyor?" kişinin kendi bekleyenleri (yan menü balonları), "Bu
     sayfada ne yapılır?" sayfa yardımı — ücretsiz, mesaj sayılır;
   · serbest soru: sınır AYRILIR, soru geçmişe; istek önbellekli talimat + bağlam (rol adları, sayfa, bekleyen sayıları) — müşteri unvanı, adres,
     kişi adı, e-posta, anahtar GİTMEZ; cevap geçmişe, ayırma gerçek maliyetle kapanır; sınır doluysa soru yazılmaz; cevapsız çağrı bırakılır /
     bilinmiyorsa harcamaya yazılır;
   · geçmiş kişinin kendisinin: aynı firmadaki başka kişi ve başka firma görmez, temizleyemez; uygulama rolü tabloya yazamaz / silemez; kişi başı
     en yeni 200; mesaj sayısı yalnız artar;
   · 382 rapor ekranı: "Eksik alanlar" / "Sonuç" cevabının METNİNİ sunucu kurar (ekranın yapısından), yer "Rapor <no>"; öneri yalnız seçilen sonuç
     kriterlerden ayrıysa; öneri kartı bir kez işaretlenir, başkası işaretleyemez; serbest soruda yer rapor numarası;
   · 384 açık rapor: özet yalnız raporu yazanın Yeni raporunda ve adres o raporsa; başkası / başka firma alamaz; giden özette serbest metin yok.
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
import { sayBirak, sayDurumu, sayGecmisi, sayHizli, sayOneri, sayRaporCevabi, saySorHazirla, saySorKaydet, sayTemizle } from "../src/modules/say/server/say.ts";
import { ayarOku, ayarYaz } from "../src/server/ayar/ayar.ts";
import { sirYaz } from "../src/server/ayar/sir.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { yzAyi } from "../src/server/yz/kullanim.ts";
import { sayEnCokMaliyet } from "../src/server/yz/say.ts";
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

test("kapalıyken ve anahtarsızken cevap yok; açık + anahtar: hızlı sorular kuralla (kişinin bekleyenleri, sayfa yardımı), ücretsiz, mesaj sayılır", async () => {
  assert.deepEqual(await ile(A, FA.den, (db) => sayDurumu(db)), { acik: false, anahtar: false, sinirDoldu: false });
  assert.deepEqual(await ile(A, FA.den, (db) => sayHizli(db, FA.den, "bekleyen", "/")), { durum: "red", neden: "S.A.Y firmada kapalı (Firma ayarları › Yapay zekâ)." });
  assert.deepEqual(await ile(A, FA.den, (db) => sayGecmisi(db)), []);
  await yzAyari(A, FA.yon, { acik: true, sinir: 1 });
  assert.deepEqual(await ile(A, FA.den, (db) => sayDurumu(db)), { acik: true, anahtar: false, sinirDoldu: false });
  assert.match(JSON.stringify(await ile(A, FA.den, (db) => sayHizli(db, FA.den, "sayfa", "/planlar"))), /API anahtarı girilmedi/);
  await ile(A, FA.yon, (db) => sirYaz(db, "yapay_zeka_anahtari", "sk-ant-deneme-anahtar-0123456789", { kim: "Deneme" }));
  assert.deepEqual(await ile(A, FA.den, (db) => sayDurumu(db)), { acik: true, anahtar: true, sinirDoldu: false });

  const b = await ile(A, FA.den, (db) => sayHizli(db, FA.den, "bekleyen", "/planlar/123?x=1"));
  assert.equal(b.durum, "tamam");
  if (b.durum !== "tamam") return;
  assert.deepEqual(b.iletiler.map((m) => [m.kim, m.metin, m.yer]), [["ben", "Beni ne bekliyor?", "Planlar"], ["say", "Sizi bekleyenler:", "Planlar"]]);
  assert.deepEqual(b.iletiler[1].ek?.bekleyen?.find((x) => x.href === "/planlar"),
    { ad: "Planlar", href: "/planlar", kirmizi: 1, sari: 0, kirmiziAd: "plan günü gelmiş, kabul bekleyen plan", sariAd: "kabul bekleyen plan" });
  assert.doesNotMatch(JSON.stringify(b.iletiler), /Gizli|Saklı|iletisim@/, "müşteri / tesis / kişi adı yok");
  /* planlamacının bekleyeni yok (planın ekibinde değil) */
  const p = await ile(A, FA.plan, (db) => sayHizli(db, FA.plan, "bekleyen", "/"));
  assert.ok(p.durum === "tamam" && p.iletiler[1].metin === "Şu an sizi bekleyen iş yok." && p.iletiler[1].yer === "Ana sayfa");
  const s = await ile(A, FA.den, (db) => sayHizli(db, FA.den, "sayfa", "/onaylar"));
  assert.ok(s.durum === "tamam" && s.iletiler[1].metin.startsWith("Onaylar: imzanızı ya da onayınızı bekleyen"));
  assert.deepEqual(await kullanim(A, FA.den), { mesaj: 2, maliyet: "0", ayrilan: "0" }, "hızlı sorular ücretsiz, mesaj sayılır");
});

test("serbest soru: ayırma, soru geçmişe; istek önbellekli talimat + bağlam — müşteri, adres, kişi adı, e-posta, anahtar gitmez; cevap geçmişe, gerçek maliyet", async () => {
  const h = await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "  Kabul bekleyen planımı nasıl kabul ederim?  ", "/planlar"));
  assert.equal(h.durum, "hazir", JSON.stringify(h));
  if (h.durum !== "hazir") return;
  const ust = sayEnCokMaliyet("opus");
  assert.deepEqual(await kullanim(A, FA.den), { mesaj: 2, maliyet: "0", ayrilan: String(ust) }, "çağrıdan önce en kötü maliyet ayrıldı");
  const g = h.istek.govde as { system: { text: string; cache_control?: unknown }[]; messages: { role: string; content: string }[]; model: string };
  assert.equal(g.model, "claude-opus-5-5");
  assert.deepEqual(g.system[0].cache_control, { type: "ephemeral" }, "sabit talimat önbellekte");
  assert.match(g.system[1].text, /Kullanıcının rolleri: Denetçi\.[\s\S]*Şu an bulunduğu sayfa: Planlar\.[\s\S]*Planlar: 1 plan günü gelmiş, kabul bekleyen plan/);
  const json = JSON.stringify(h.istek.govde);
  assert.doesNotMatch(json, /sk-ant|Gizli|Saklı|iletisim@|Deneme Kişi|say-a\.example/, "anahtar, müşteri, tesis, adres, kişi adı, e-posta gönderilmez");
  /* konuşma: önceki hızlı sorular + yeni soru, kullanıcıyla başlar, roller sırayla */
  assert.equal(g.messages.at(-1)?.content, "Kabul bekleyen planımı nasıl kabul ederim?");
  assert.ok(g.messages.every((m, i) => m.role === (i % 2 ? "assistant" : "user")));
  const k = await ile(A, FA.den, (db) => saySorKaydet(db, h, cevap("Planlar › planı açın › Kabul et.\n- Tarafsızlık beyanını onaylayın.", 4_000, 300)));
  assert.equal(k.durum, "tamam");
  assert.deepEqual(k.durum === "tamam" && k.iletiler.map((m) => [m.kim, m.metin]), [["ben", "Kabul bekleyen planımı nasıl kabul ederim?"], ["say", "Planlar › planı açın › Kabul et.\n- Tarafsızlık beyanını onaylayın."]]);
  assert.deepEqual(await kullanim(A, FA.den), { mesaj: 3, maliyet: String(4_000 * 4 + 300 * 20), ayrilan: "0" }, "ayırma gerçek maliyetle kapandı");
  /* cevapsız çağrı: ücretsiz → bırakılır; bilinmiyor → harcamaya + mesaja */
  const h2 = await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "Bir soru daha", "/"));
  assert.ok(h2.durum === "hazir");
  if (h2.durum !== "hazir") return;
  await ile(A, FA.den, (db) => sayBirak(db, h2, "yok"));
  assert.deepEqual(await kullanim(A, FA.den), { mesaj: 3, maliyet: "22000", ayrilan: "0" });
  const h3 = await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "Üçüncü soru", "/"));
  if (h3.durum !== "hazir") return assert.fail(JSON.stringify(h3));
  await ile(A, FA.den, (db) => sayBirak(db, h3, "bilinmiyor"));
  assert.deepEqual(await kullanim(A, FA.den), { mesaj: 4, maliyet: String(22_000 + ust), ayrilan: "0" });
  /* boş / uzun soru */
  assert.deepEqual(await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "   ", "/")), { durum: "red", neden: "Sorunuzu yazın." });
  assert.deepEqual(await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "x".repeat(501), "/")), { durum: "red", neden: "Soru en çok 500 karakter." });
});

test("sınır doluysa serbest soru yazılmaz (hızlı sorular çalışır); düğme 'sınırınız doldu' der", async () => {
  /* sınır 1 $ = 1 000 000; harcanan 22 000 + ust ≥ 1 000 000 olsun diye bir kez daha bilinmeyen çağrı */
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
  assert.equal((await ile(A, FA.den, (db) => sayHizli(db, FA.den, "sayfa", "/"))).durum, "tamam", "hızlı soru ücretsiz, çalışır");
});

test("GÜVENLİK: geçmiş kişinin kendisinin — aynı firmadaki başkası ve başka firma görmez, temizleyemez; tabloya doğrudan yazma / silme yok; en yeni 200", async () => {
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
  /* kişi başı en yeni 200 */
  for (let i = 0; i < 205; i++) await ile(A, FA.plan, (db) => sohbetYaz(db, { kim: i % 2 ? "say" : "ben", metin: `İleti ${i}`, yer: "Ana sayfa" }));
  const son = await ile(A, FA.plan, (db) => sayGecmisi(db));
  assert.equal(son.length, 100, "ekrana en yeni 100");
  assert.equal(son.at(-1)?.metin, "İleti 204");
  const toplam = await ile(A, FA.plan, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM yz_sohbet"));
  assert.equal(toplam.rows[0].n, 200);
});

test("382 rapor ekranı: metni sunucu kurar, yer 'Rapor <no>'; öneri yalnız sonuç ayrıysa; öneri bir kez, yalnız sahibi işaretler", async () => {
  const R = { id: "6f0c1d2e-3a4b-4c5d-8e9f-0a1b2c3d4e5f", no: "SA-1026-001" };
  assert.deepEqual(await ile(A, FA.yon, (db) => sayRaporCevabi(db, { hizli: "eksik", rapor: { id: "kotu", no: R.no }, eksik: [] })),
    { durum: "red", neden: "Rapor bilgisi okunamadı; sayfayı yenileyip yeniden deneyin." });
  const e = await ile(A, FA.yon, (db) => sayRaporCevabi(db, { hizli: "eksik", rapor: R, metin: "sahte", eksik: [
    { ad: "Kontrol başlangıcı", bolum: "sabit-firma", bolumAd: "Firma bilgileri", alan: "tarih.bas" },
    { ad: "Etiket", bolum: "gozle", bolumAd: "Gözle kontrol", alan: "m1" }, { ad: "Kapak", bolum: "gozle", bolumAd: "Gözle kontrol", alan: "m2" }] }));
  assert.ok(e.durum === "tamam");
  if (e.durum !== "tamam") return;
  assert.deepEqual(e.iletiler.map((m) => [m.kim, m.metin, m.yer]), [["ben", "Eksik alanlar neler?", `Rapor ${R.no}`], ["say", "3 zorunlu alan boş:", `Rapor ${R.no}`]]);
  assert.equal(e.iletiler[1].ek?.rapor, R.id);
  assert.equal(e.iletiler[1].ek?.eksik?.length, 3);
  assert.equal((await ile(A, FA.yon, (db) => sayRaporCevabi(db, { hizli: "eksik", rapor: R, eksik: [] }))).durum === "tamam", true);
  assert.equal((await ile(A, FA.yon, (db) => sayGecmisi(db))).at(-1)?.metin, "Zorunlu alanların hepsi dolu; raporu onaya gönderebilirsiniz.");
  /* sonuç: seçilen kriterlerle aynıysa öneri yok; ayrıysa öneri kartı */
  const ayni = await ile(A, FA.yon, (db) => sayRaporCevabi(db, { hizli: "sonuc", rapor: R, sonuc: { var: true, oneri: "uygun", secili: "uygun", kusur: 0 } }));
  assert.ok(ayni.durum === "tamam" && ayni.iletiler[1].metin === "“Uygun değil” madde ve sınır dışı değer yok. Seçtiğiniz sonuç (Uygun) kriterlerle uyumlu." && !ayni.iletiler[1].ek?.oneri);
  const ayri = await ile(A, FA.yon, (db) => sayRaporCevabi(db, { hizli: "sonuc", rapor: R, sonuc: { var: true, oneri: "uygun_degil", secili: "", kusur: 2 } }));
  assert.ok(ayri.durum === "tamam");
  if (ayri.durum !== "tamam") return;
  const m = ayri.iletiler[1];
  assert.equal(m.metin, "2 kusur var (“Uygun değil” madde ya da sınır dışı değer). Önerim:");
  assert.deepEqual(m.ek?.oneri, { alan: "sonuc", deger: "uygun_degil", ad: "Sonuç ve kanaat → Uygun değil", durum: "" });
  assert.equal(await ile(A, FA.plan, (db) => sayOneri(db, m.id, "uygulandi")), false, "başkasının iletisini işaretleyemez");
  assert.equal(await ile(A, FA.yon, (db) => sayOneri(db, m.id, "uygulandi")), true);
  assert.equal(await ile(A, FA.yon, (db) => sayOneri(db, m.id, "vazgecildi")), false, "bir kez");
  assert.equal((await ile(A, FA.yon, (db) => sayGecmisi(db))).find((x) => x.id === m.id)?.ek?.oneri?.durum, "uygulandi");
  await assert.rejects(ile(A, FA.yon, (db) => db.sorgu("SELECT yz_sohbet_oneri($1, 'kotu')", [m.id])), /öneri sonucu geçersiz/);
  const yok = await ile(A, FA.yon, (db) => sayRaporCevabi(db, { hizli: "sonuc", rapor: R, sonuc: { var: false, oneri: "uygun", secili: "", kusur: 0 } }));
  assert.ok(yok.durum === "tamam" && yok.iletiler[1].metin === "Bu raporun formatında sonuç alanı yok.");
  /* serbest soru rapor ekranında: yer "Rapor <no>" (yalnız Raporlar sayfasında, biçim denetli) */
  const h = await ile(A, FA.yon, (db) => saySorHazirla(db, FA.yon, "Bu raporda neye dikkat edeyim?", `/raporlar/${R.id}`, new Date(), R.no));
  assert.ok(h.durum === "hazir" && h.yer === `Rapor ${R.no}`);
  if (h.durum === "hazir") await ile(A, FA.yon, (db) => sayBirak(db, h, "yok"));
  const h2 = await ile(A, FA.yon, (db) => saySorHazirla(db, FA.yon, "Başka soru", "/planlar", new Date(), "<b>x</b>"));
  assert.ok(h2.durum === "hazir" && h2.yer === "Planlar");
  if (h2.durum === "hazir") await ile(A, FA.yon, (db) => sayBirak(db, h2, "yok"));
});

test("384 açık rapor özeti: yalnız raporu yazanın Yeni raporunda, adres o raporsa; başkası ve başka firma alamaz; özette serbest metin yok", async () => {
  const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
  const f = await ile(A, FA.yon, async (db) => {
    const tur = (await db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EP', 'Elektrik panosu', 'elektrik', 'e', 12) RETURNING id::text")).rows[0].id;
    const tesis = (await db.sorgu<{ id: string }>("SELECT id::text FROM tesis LIMIT 1")).rows[0].id;
    const ekp = (await db.sorgu<{ id: string }>("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'EP-S1', 'x') RETURNING id::text", [tesis, tur])).rows[0].id;
    const t = tamam(await taslakBaslat(db, FA.yon, tur, "sablon:ZPKR02", null));
    tamam(await yayinla(db, FA.yon, t.id, t.surum, ""));
    return { ekp };
  });
  const plan = (await ile(A, FA.den, (db) => db.sorgu<{ id: string }>("SELECT id::text FROM plan LIMIT 1"))).rows[0].id;
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
  const canli = { id: rapor, cevaplar: { alan: { kurulus: "Gizli Sanayi Kuruluşu" }, madde: { [madde.id]: { c: "Uygun değil", not: "Saklı kişinin odası" } }, yorum: "Gizli yorum" } };
  const h = await ile(A, FA.den, (db) => saySorHazirla(db, FA.den, "Bu kusur ağır mı?", `/raporlar/${rapor}`, new Date(), "SA-1026-001", canli));
  assert.ok(h.durum === "hazir", JSON.stringify(h));
  if (h.durum !== "hazir") return;
  const baglam = (h.istek.govde as { system: { text: string }[] }).system[1].text;
  assert.match(baglam, /Açık rapor \(kullanıcının şu an yazdığı, kaydedilmemiş değişiklikler dahil\):\nEkipman türü: Elektrik panosu\./);
  assert.ok(baglam.includes(`Gözle kontrol › ${madde.metin}`), baglam);
  assert.doesNotMatch(JSON.stringify(h.istek.govde), /Gizli Sanayi|Saklı kişinin|Gizli yorum|Gizli Tesis|Saklı Cad/, "serbest metin ve künye gitmez");
  await ile(A, FA.den, (db) => sayBirak(db, h, "yok"));
  /* adres başka sayfaysa ya da raporu yazmayan sorarsa özet yok */
  for (const [k, yol] of [[FA.den, "/planlar"], [FA.plan, `/raporlar/${rapor}`]] as const) {
    const x = await ile(A, k, (db) => saySorHazirla(db, k, "Soru", yol, new Date(), null, canli));
    assert.ok(x.durum === "hazir");
    if (x.durum !== "hazir") continue;
    assert.doesNotMatch((x.istek.govde as { system: { text: string }[] }).system[1].text, /Açık rapor/);
    await ile(A, k, (db) => sayBirak(db, x, "yok"));
  }
});
