/* NEREDEN GELDİ: 2026-11-07 S.A.Y Chat yeniden — KİŞİSEL SOHBET (sunum claude.ai 2PiEskE9jDqF5kSefutRBC — reisim: "Evet, önerilerle"; istek: "sohbet
   kişiye özel; S.A.Y da yalnız isteyenin sohbetini okur"). GERÇEK PostgreSQL, iki firma (göç 0123 say_chat_mesaj):
   · mesaj yazılır (yazı / fotoğraf / belge — Word dahil); saat ve sıra cihazınki; aynı kimlik ikinci kez gelirse yazılmış olan döner (kuyruk tekrarı);
   · sohbet KİŞİYE ÖZEL: aynı firmadaki başka kişi (yönetici dahil) göremez, dosyasını açamaz, silemez, aynı kimlikle yazamaz; başka firma hiç;
     S.A.Y'ın okuması (chatOku) da yalnız kendi sohbetinden;
   · mesaj değişmez (veritabanı tetiği — yalnız ön okuma, işaret, dosyanın silinmesi);
   · chatten oku → fotoğraf S.A.Y'ın eki olur (F numarası, deposunda kopyası; yapay zekâ kapalıyken ön okumasız); aynı konuşmada ikinci kez eklenmez;
   · chat_isle plana işaretler (planı göremeyen işaretleyemez), varsayılan okuma işlenmişleri atlar, işaret geri alınır; işlenmiş mesaj silinmez;
   · karar 2: işlenmesinin üstünden 30 gün geçen dosya çöpe, yazı kalır;
   · eski kuyruk işleri (saychat.*) bir sürüm boyunca mesaj olur. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { bugunTr, planAc, type Kisi } from "../src/modules/planlar/server/planlar.ts";
import { chatIslemi, chatDosyasiGorulur, mesajSil, mesajYaz, sohbet } from "../src/modules/say-chat/server/mesajlar.ts";
import { chatIsle, chatOku, chatOkuHazirla } from "../src/modules/say-chat/server/oku.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { dosyaIndirilebilir } from "../src/server/dosya/dosya.ts";
import { DOSYA_ERISIMI } from "../src/server/dosya/erisim.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, A = "", B = "";
const klasor = mkdtempSync(join(tmpdir(), "say-chat-mesaj-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, rol: string): Kisi => ({ id, ad: "Deneme Kişi", roller: [rol] as Kisi["roller"] });
let YON: Kisi, DEN: Kisi, DEN2: Kisi, YON_B: Kisi;
let PLAN = "";
const ile = <T,>(firma: string, k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x03, 0x01, 0xff, 0xda, 0x00, 0x02, 0x01, 0x02, 0x03, 0xff, 0xd9]).toString("base64");
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n").toString("base64");
const z = (s: string) => new Date(`2026-11-07T${s}:00+03:00`).toISOString();
const yazi = (zaman: string, metin: string, sira = 0) => ({ tur: "yazi", zaman, sira, metin, cekim: null, ad: null, veri: null });
const foto = (zaman: string, metin: string | null, sira = 0) => ({ tur: "foto", zaman, sira, metin, cekim: "2026-11-07 10:29", ad: "IMG_1.jpg", veri: JPEG });

before(async () => {
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('scm-a', 'Deneme A', 'MA'), ('scm-b', 'Deneme B', 'MB') RETURNING id::text")).rows.map((r) => r.id);
  } finally { await s.end(); }
  const f = await kiraciIcinde(havuz, A, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa, eposta, tel) VALUES ('Deneme Sanayi A.Ş.', 'Deneme', 'iletisim@scm-a.example', '0312 000 00 00') RETURNING id::text");
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce, sgk) VALUES ($1, 'Deneme Tesis', 'Deneme Cad. 1', 'Ankara', 'Çankaya', $2) RETURNING id::text", [m, "3".repeat(26)]);
    const pe = await q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Denetçi Bir', '2024-01-01', 'mak-muh', '11') RETURNING id::text");
    const pe2 = await q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Denetçi İki', '2024-01-01', 'mak-muh', '12') RETURNING id::text");
    const h = async (eposta: string, rol: string, per: string | null = null) => kisi(await q(
      "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme Kişi', $2, 'etkin', $3) RETURNING id::text", [`${eposta}@scm-a.example`, [rol], per]), rol);
    return { tesis, pe, yon: await h("yon", "firma_yoneticisi"), den: await h("den", "denetci", pe), den2: await h("den2", "denetci", pe2) };
  });
  YON = f.yon; DEN = f.den; DEN2 = f.den2;
  YON_B = await kiraciIcinde(havuz, B, async (db) => kisi((await db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('yon@scm-b.example', 'Deneme', $1, 'etkin') RETURNING id::text", [["firma_yoneticisi"]])).rows[0].id, "firma_yoneticisi"));
  const g = bugunTr();
  PLAN = tamam(await ile(A, YON, (db) => planAc(db, depo, YON, A, { tesis: f.tesis, baslangic: g, bitis: g, ekip: [{ personel: f.pe, isgNo: "ISG-1", kaydet: false }] }))).id;
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("mesaj: yazı, fotoğraf, belge yazılır; saat ve sıra cihazınki; aynı kimlik tekrar gelirse yazılmış olan döner", async () => {
  const y = randomUUID(), fo = randomUUID(), b = randomUUID();
  tamam(await ile(A, DEN, (db) => mesajYaz(db, depo, DEN, A, y, yazi(z("10:28"), "kazan dairesi"))));
  tamam(await ile(A, DEN, (db) => mesajYaz(db, depo, DEN, A, fo, foto(z("10:30"), "sol kazan"))));
  tamam(await ile(A, DEN, (db) => mesajYaz(db, depo, DEN, A, b, { tur: "belge", zaman: z("10:31"), sira: 0, metin: null, cekim: null, ad: "eski.pdf", veri: PDF })));
  const t = tamam(await ile(A, DEN, (db) => mesajYaz(db, depo, DEN, A, y, yazi(z("11:00"), "başka"))));
  assert.equal(t.mesaj?.metin, "kazan dairesi", "kuyruk tekrarı: ilk yazılan döner, değişmez");
  const l = await ile(A, DEN, (db) => sohbet(db, DEN));
  assert.deepEqual(l.map((x) => [x.id, x.tur, x.zaman, x.metin]), [[y, "yazi", z("10:28"), "kazan dairesi"], [fo, "foto", z("10:30"), "sol kazan"], [b, "belge", z("10:31"), null]]);
  assert.equal(l[1]!.cekim, "2026-11-07 10:29");
  assert.ok(l[1]!.dosya && l[2]!.dosya);
  assert.equal((await ile(A, DEN, (db) => mesajYaz(db, depo, DEN, A, randomUUID(), { ...foto(z("10:32"), null), veri: PDF }))).durum, "gecersiz", "fotoğraf yerine PDF");
  assert.equal((await ile(A, DEN, (db) => mesajYaz(db, depo, DEN, A, randomUUID(), yazi(z("10:33"), "   ")))).durum, "gecersiz", "boş yazı");
});

test("kişiye özel: aynı firmadaki başka kişi ve yönetici göremez, dosyayı açamaz, silemez, aynı kimlikle yazamaz; başka firma hiç; S.A.Y'ın okuması da", async () => {
  const l = await ile(A, DEN, (db) => sohbet(db, DEN)), d = l.find((x) => x.tur === "foto")!.dosya!;
  for (const k of [DEN2, YON]) {
    assert.deepEqual(await ile(A, k, (db) => sohbet(db, k)), [], "sohbeti boş");
    assert.equal(await ile(A, k, (db) => dosyaIndirilebilir(db, k, d, DOSYA_ERISIMI)), null, "dosyayı açamaz");
    assert.equal(await ile(A, k, (db) => chatDosyasiGorulur(db, l[1]!.id)), false);
    assert.equal((await ile(A, k, (db) => chatOku(db, {}))).sonuc.mesaj, 0, "S.A.Y başkasının sohbetini okumaz");
    tamam(await ile(A, k, (db) => mesajSil(db, k, l[0]!.id)));
    assert.equal((await ile(A, k, (db) => mesajYaz(db, depo, k, A, l[0]!.id, yazi(z("12:00"), "ele geçirme")))).durum, "gecersiz", "aynı kimlik başkasında");
  }
  assert.equal((await ile(A, DEN, (db) => sohbet(db, DEN))).length, 3, "başkasının silmesi etkisiz");
  assert.ok(await ile(A, DEN, (db) => dosyaIndirilebilir(db, DEN, d, DOSYA_ERISIMI)), "sahibi açar");
  assert.deepEqual(await ile(B, YON_B, (db) => sohbet(db, YON_B)), []);
  assert.equal(await ile(B, YON_B, (db) => dosyaIndirilebilir(db, YON_B, d, DOSYA_ERISIMI)), null);
});

test("mesaj değişmez (tetik): yazı ve saat değiştirilemez", async () => {
  await assert.rejects(ile(A, DEN, (db) => db.sorgu("UPDATE say_chat_mesaj SET metin = 'değişti' WHERE tur = 'yazi'")), /değişmez/);
  await assert.rejects(ile(A, DEN, (db) => db.sorgu("UPDATE say_chat_mesaj SET zaman = now()")), /değişmez/);
});

test("chatten oku: fotoğraf S.A.Y'ın eki olur (F no, kopyası; yapay zekâ kapalı — ön okumasız), sırayla döküm; aynı konuşmada ikinci kez eklenmez", async () => {
  const islet = <T,>(is: (db: Sorgulayici) => Promise<T>) => ile(A, DEN, is);
  await chatOkuHazirla({ islet, depo: () => depo, kim: DEN, firmaId: A }, {});
  const r = await ile(A, DEN, (db) => chatOku(db, {}));
  assert.equal(r.sonuc.mesaj, 3);
  const dokum = String((r.bloklar[0] as { text: string }).text);
  assert.match(dokum, /^Chat 07\.11\.2026 10:28–10:31: 1 fotoğraf, 1 yazı, 1 belge\./);
  assert.match(dokum, /10:28 · yazı: kazan dairesi\n10:30 · F01 · altyazı: sol kazan\n   M01 · F01 — fotoğraf · IMG_1\.jpg · çekim/);
  assert.match(dokum, /10:31 · belge \(eklenemedi\) · belge: eski\.pdf/, "yapay zekâ kapalı: belge hizmete yüklenemedi, söylenir");
  assert.equal((r.sonuc.aralik as { bas: string }).bas, z("10:28"));
  const say = async () => Number((await ile(A, DEN, (db) => db.sorgu<{ n: string }>("SELECT count(*)::text AS n FROM yz_ek WHERE chat_mesaj IS NOT NULL"))).rows[0]!.n);
  assert.equal(await say(), 1);
  assert.equal(Number((await ile(A, DEN, (db) => db.sorgu<{ n: string }>("SELECT count(*)::text AS n FROM dosya WHERE modul = 'say_ek' AND cop IS NULL"))).rows[0]!.n), 1, "kopyası S.A.Y ekinin deposunda");
  await chatOkuHazirla({ islet, depo: () => depo, kim: DEN, firmaId: A }, {});
  assert.equal(await say(), 1, "ikinci okumada yeniden eklenmez");
  assert.equal(Number((await ile(A, DEN2, (db) => db.sorgu<{ n: string }>("SELECT count(*)::text AS n FROM yz_ek"))).rows[0]!.n), 0, "başkasının eki değil");
});

test("chat_isle: plana işaretler (planı göremeyen işaretleyemez); varsayılan okuma işlenmişleri atlar; işlenmiş silinmez; işaret geri alınır", async () => {
  assert.equal((await ile(B, YON_B, (db) => chatIsle(db, YON_B, { plan: PLAN, rapor: 1 }))).durum, "yok", "başka firma planı göremez");
  const r = tamam(await ile(A, DEN, (db) => chatIsle(db, DEN, { plan: PLAN, bas: z("10:28"), bit: z("10:30"), rapor: 2 })));
  assert.equal(r.adet, 2);
  const l = await ile(A, DEN, (db) => sohbet(db, DEN));
  assert.deepEqual(l.map((x) => x.islendi?.rapor ?? null), [2, 2, null]);
  assert.match(l[0]!.islendi!.no, /^P-/);
  const o = await ile(A, DEN, (db) => chatOku(db, {}));
  assert.equal(o.sonuc.mesaj, 1, "işlenmişler atlandı");
  assert.equal((await ile(A, DEN, (db) => chatOku(db, { islenmis: true }))).sonuc.mesaj, 3);
  assert.equal((await ile(A, DEN, (db) => mesajSil(db, DEN, l[0]!.id))).durum, "red", "işlenmiş mesaj silinmez");
  const g = tamam(await ile(A, DEN, (db) => chatIsle(db, DEN, { plan: PLAN, rapor: 0, geri_al: true })));
  assert.equal(g.adet, 2);
  assert.equal((await ile(A, DEN, (db) => sohbet(db, DEN))).filter((x) => x.islendi).length, 0);
});

test("karar 2: işlenmesinin üstünden 30 gün geçen mesajın dosyası çöpe, yazısı kalır", async () => {
  const fo = (await ile(A, DEN, (db) => sohbet(db, DEN))).find((x) => x.tur === "foto")!;
  tamam(await ile(A, DEN, (db) => chatIsle(db, DEN, { plan: PLAN, bas: fo.zaman, bit: fo.zaman, rapor: 1 })));
  const s = kume.sahipIstemci(); await s.connect();
  try { await s.query("UPDATE say_chat_mesaj SET islendi = now() - interval '31 days' WHERE cihaz_id = $1", [fo.id]); } finally { await s.end(); }
  const x = (await ile(A, DEN, (db) => sohbet(db, DEN))).find((m) => m.id === fo.id)!;
  assert.equal(x.dosya, null, "dosya çöpte");
  assert.equal(x.metin, "sol kazan", "altyazı kalır");
});

test("eski kuyruk işleri (saychat.*) bir sürüm boyunca mesaj olur; saychat.sil iş yapmaz", async () => {
  const once = (await ile(A, DEN, (db) => sohbet(db, DEN))).length;
  const d = { depo, firmaId: A };
  tamam(await ile(A, DEN, (db) => chatIslemi(db, d, DEN, "saychat.kaydet", randomUUID(), 0, { plan: PLAN, mesaj: ["Marka X", "-", "", "Seri 12"] })));
  tamam(await ile(A, DEN, (db) => chatIslemi(db, d, DEN, "saychat.foto", randomUUID(), 0, { plan: PLAN, rol: "ekipman", ad: "e.jpg", veri: JPEG })));
  tamam(await ile(A, DEN, (db) => chatIslemi(db, d, DEN, "saychat.sil", randomUUID(), 0, {})));
  const l = await ile(A, DEN, (db) => sohbet(db, DEN));
  assert.equal(l.length, once + 2);
  assert.ok(l.some((x) => x.tur === "yazi" && x.metin === "Marka X\nSeri 12"));
});
