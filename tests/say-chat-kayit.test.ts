/* NEREDEN GELDİ: 524 — S.A.Y Chat kayıtları (pkproje §3.10 m.1–12, 18–24; maket 521 maket-saychat.js — reisim 2026-10-13 "onayılıyorum, yap bitir";
   m.2 "sohbeti yalnız kaydı yazan denetçi görür (plan sorumlusu, teknik yönetici, yönetici GÖREMEZ)"; m.3 "Mekanik denetçi yalnız mekanik, elektrik
   denetçisi yalnız elektrik görür"; reisim 2026-10-04: "yetki her zaman sunucuda; istemciden gelen kimlik ve sürüm yetki vermez"). GERÇEK PostgreSQL,
   iki firma (göç 0085 say_chat_kayit):
   · panel yalnız plan ekibindeki kişiye, plan kabul / denetimde / tamamlandı iken; seçenekler kişinin branşına göre (meslekten);
   · kayıt kişiye özel: aynı plandaki öteki denetçi, plan açan ve yönetici göremez (RLS), fotoğrafını açamaz; başka firma hiç;
   · kaydet: plan ekipmanı branşa uygun, raporsuz, kişinin başka kaydında değil; yeni tür formatı yayında; tanım türün formatıyla denetlenir;
     sürüm kilidi (çakışma); kayıt yoksa sürüm 0 olmalı (silinmiş kayıt dirilmez);
   · fotoğraf ekler (kayıt yoksa fotoğrafla açılır, sürüm önce / sonra döner), etiket tek; çıkarılan fotoğraf çöpe; sil kayıt + fotoğraflar;
   · kuyruk işi bir kez uygulanır (aynı kimlik → saklanan sonuç); plan kesin silinince kayıtlar da gider. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { planIci, planKabul, planSil } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { chatFoto, chatIslemi, chatKaydet, chatSil, sayChatPaneli } from "../src/modules/say-chat/server/kayitlar.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { dosyaIndirilebilir } from "../src/server/dosya/dosya.ts";
import { DOSYA_ERISIMI } from "../src/server/dosya/erisim.ts";
import { tekSeferlik } from "../src/server/islem/islem.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, A = "", B = "";
const klasor = mkdtempSync(join(tmpdir(), "say-chat-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, rol: string): Kisi => ({ id, ad: "Deneme Kişi", roller: [rol] as Kisi["roller"] });
let YON: Kisi, PLN: Kisi, ELK: Kisi, MAK: Kisi, YON_B: Kisi;
let PLAN = "", BEKLEYEN = "", EIT = "", KMP = "", E1 = "", E2 = "", M1 = "";
const ile = <T,>(firma: string, k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x03, 0x01, 0xff, 0xda, 0x00, 0x02, 0x01, 0x02, 0x03, 0xff, 0xd9]).toString("base64");

before(async () => {
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('scc-a', 'Deneme A', 'KA'), ('scc-b', 'Deneme B', 'KB') RETURNING id::text")).rows.map((r) => r.id);
  } finally { await s.end(); }
  const f = await kiraciIcinde(havuz, A, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa, eposta, tel) VALUES ('Deneme Sanayi A.Ş.', 'Deneme', 'iletisim@scc-a.example', '0312 000 00 00') RETURNING id::text");
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce, sgk) VALUES ($1, 'Deneme Tesis', 'Deneme Cad. 1', 'Ankara', 'Çankaya', $2) RETURNING id::text", [m, "3".repeat(26)]);
    const pe = await q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Elektrik Denetçi', '2024-01-01', 'elk-muh', '11') RETURNING id::text");
    const pm = await q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Mekanik Denetçi', '2024-01-01', 'mak-muh', '12') RETURNING id::text");
    const h = async (eposta: string, rol: string, per: string | null = null) => kisi(await q(
      "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme Kişi', $2, 'etkin', $3) RETURNING id::text", [`${eposta}@scc-a.example`, [rol], per]), rol);
    return { tesis, pe, pm, yon: await h("yon", "firma_yoneticisi"), pln: await h("pln", "planlama"), elk: await h("elk", "denetci", pe), mak: await h("mak", "denetci", pm) };
  });
  YON = f.yon; PLN = f.pln; ELK = f.elk; MAK = f.mak;
  YON_B = await kiraciIcinde(havuz, B, async (db) => kisi((await db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('yon@scc-b.example', 'Deneme', $1, 'etkin') RETURNING id::text", [["firma_yoneticisi"]])).rows[0].id, "firma_yoneticisi"));
  /* türler (formatı yayında) ve tesis ekipmanı */
  const t = await ile(A, YON, async (db) => {
    const tur = async (kod: string, ad: string, grup: string, brans: string, sablon: string) => {
      const id = (await db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ($1, $2, $3, $4, 12) RETURNING id::text", [kod, ad, grup, brans])).rows[0].id;
      const x = tamam(await taslakBaslat(db, YON, id, `sablon:${sablon}`, null));
      tamam(await yayinla(db, YON, x.id, x.surum, ""));
      return id;
    };
    const eit = await tur("EIT", "Elektrik iç tesisatı", "elektrik", "e", "ZPKR02"), kmp = await tur("KMP", "Kompresör", "basincli", "m", "KOMPRESOR");
    const ekp = async (turId: string, kod: string) => (await db.sorgu<{ id: string }>("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen, konum) VALUES ($1, $2, $3, 'x', 'Bakım binası') RETURNING id::text",
      [f.tesis, turId, kod])).rows[0].id;
    return { eit, kmp, e1: await ekp(eit, "EP-01"), e2: await ekp(eit, "EP-02"), m1: await ekp(kmp, "KP-01") };
  });
  EIT = t.eit; KMP = t.kmp; E1 = t.e1; E2 = t.e2; M1 = t.m1;
  const g = bugunTr();
  const ekip = [{ personel: f.pe, isgNo: "ISG-1", kaydet: false }, { personel: f.pm, isgNo: "ISG-2", kaydet: false }];
  PLAN = tamam(await ile(A, PLN, (db) => planAc(db, depo, PLN, A, { tesis: f.tesis, baslangic: g, bitis: g, ekip }))).id;
  const v = (await ile(A, ELK, (db) => planIci(db, ELK, PLAN)))!;
  tamam(await ile(A, ELK, (db) => planKabul(db, ELK, PLAN, v.surum, true)));
  BEKLEYEN = tamam(await ile(A, PLN, (db) => planAc(db, depo, PLN, A, { tesis: f.tesis, baslangic: g, bitis: g, ekip }))).id;
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

const girdi = (ekipman: unknown, tanim: unknown, mesaj: string[] = ["Örnek", "-", ""], ek: object = {}) =>
  ({ plan: PLAN, ekipman, mesaj, tanim, tanimSurum: 0, kaldir: [], ...ek });

test("panel: yalnız plan ekibine, plan kabul / denetimde / tamamlandı iken; seçenekler branşa göre", async () => {
  const e = await ile(A, ELK, (db) => sayChatPaneli(db, ELK, PLAN));
  assert.ok(e);
  assert.equal(e!.brans, "e");
  assert.deepEqual(e!.planEkipmani.map((x) => x.kod), ["EP-01", "EP-02"]);
  assert.deepEqual(e!.yeniTurler, [EIT]);
  assert.ok(e!.turler[EIT]?.tanim.satirlar.length && !e!.turler[KMP]);
  assert.ok(e!.turler[EIT].basliklar.some(([k]) => k === "linye"), "okunacak başlıklar türün ayarından");
  const m = await ile(A, MAK, (db) => sayChatPaneli(db, MAK, PLAN));
  assert.deepEqual([m!.brans, m!.planEkipmani.map((x) => x.kod), m!.yeniTurler], ["m", ["KP-01"], [KMP]]);
  assert.equal(await ile(A, PLN, (db) => sayChatPaneli(db, PLN, PLAN)), null, "plan açan ekipte değil");
  assert.equal(await ile(A, YON, (db) => sayChatPaneli(db, YON, PLAN)), null, "yönetici ekipte değil");
  assert.equal(await ile(A, ELK, (db) => sayChatPaneli(db, ELK, BEKLEYEN)), null, "kabul bekleyen planda yok");
  assert.equal(await ile(B, YON_B, (db) => sayChatPaneli(db, YON_B, PLAN)), null, "başka firma");
});

test("kaydet: kişiye özel; branş, raporsuz, tekil ekipman; yeni tür; tanım formatla; sürüm kilidi; silinmiş kayıt dirilmez", async () => {
  const p = (await ile(A, ELK, (db) => sayChatPaneli(db, ELK, PLAN)))!, tanim = p.turler[EIT].tanim;
  const k1 = randomUUID(), k2 = randomUUID();
  assert.deepEqual(await ile(A, ELK, (db) => chatKaydet(db, ELK, k1, 0, girdi({ tip: "plan", id: E1 }, tanim))), { durum: "tamam", yeniSurum: 0 });
  assert.equal((await ile(A, ELK, (db) => chatKaydet(db, ELK, k2, 0, girdi({ tip: "plan", id: E1 }, tanim)))).durum, "gecersiz", "aynı ekipman başka kayıtta");
  assert.equal((await ile(A, ELK, (db) => chatKaydet(db, ELK, k2, 0, girdi({ tip: "plan", id: M1 }, tanim)))).durum, "gecersiz", "mekanik ekipman elektrikçiye");
  assert.equal((await ile(A, ELK, (db) => chatKaydet(db, ELK, k2, 0, girdi({ tip: "yeni", tur: KMP }, tanim)))).durum, "gecersiz", "mekanik tür");
  const bozuk = { satirlar: [{ ad: "X", alan: "a:olmayan", hazir: "" }], okunacak: [] };
  const b = await ile(A, ELK, (db) => chatKaydet(db, ELK, k2, 0, girdi({ tip: "yeni", tur: EIT }, bozuk)));
  assert.equal(b.durum === "gecersiz" && Object.keys(b.hatalar)[0], "tanim");
  assert.deepEqual(await ile(A, ELK, (db) => chatKaydet(db, ELK, k2, 0, girdi({ tip: "yeni", tur: EIT }, tanim, ["Yeni marka"]))), { durum: "tamam", yeniSurum: 0 });
  /* öteki denetçi, plan açan, yönetici, başka firma görmez */
  assert.deepEqual((await ile(A, MAK, (db) => sayChatPaneli(db, MAK, PLAN)))!.kayitlar, []);
  for (const k of [MAK, PLN, YON]) assert.equal((await ile(A, k, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM say_chat_kayit"))).rows[0].n, 0, k.roller[0]);
  assert.equal((await ile(B, YON_B, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM say_chat_kayit"))).rows[0].n, 0);
  /* başkasının kaydının kimliğiyle yazılamaz (görmez; iş yapılmadan red) */
  const b2 = await ile(A, MAK, (db) => chatKaydet(db, MAK, k1, 0, girdi(null, null)));
  assert.match(b2.durum === "gecersiz" ? b2.hatalar.kayit : "", /kimliği kullanılmış/);
  const b3 = await ile(A, MAK, (db) => chatFoto(db, depo, MAK, A, k1, { plan: PLAN, rol: "ekipman", k: null, ad: "x.jpg", veri: JPEG }));
  assert.equal(b3.durum, "gecersiz");
  /* sürüm kilidi: eski sürümle çakışma; kayıt yoksa sürüm 0 olmalı */
  assert.deepEqual(await ile(A, ELK, (db) => chatKaydet(db, ELK, k1, 0, girdi({ tip: "plan", id: E1 }, tanim, ["Değişti"]))), { durum: "tamam", yeniSurum: 1 });
  assert.deepEqual(await ile(A, ELK, (db) => chatKaydet(db, ELK, k1, 0, girdi({ tip: "plan", id: E1 }, tanim, ["Eski"]))), { durum: "cakisma" });
  assert.deepEqual(await ile(A, ELK, (db) => chatKaydet(db, ELK, randomUUID(), 3, girdi({ tip: "plan", id: E2 }, tanim))), { durum: "yok" });
  /* panelde: kendi iki kaydı; ekipman, mesaj, tanım */
  const l = (await ile(A, ELK, (db) => sayChatPaneli(db, ELK, PLAN)))!.kayitlar;
  assert.deepEqual(l.map((x) => [x.id, x.surum, x.ekipman, x.mesaj[0]]), [[k1, 1, { tip: "plan", id: E1, kod: "EP-01", turId: EIT }, "Değişti"], [k2, 0, { tip: "yeni", turId: EIT }, "Yeni marka"]]);
  assert.deepEqual(l[0].tanim, tanim);
  assert.equal((await ile(A, ELK, (db) => chatKaydet(db, ELK, randomUUID(), 0, { ...girdi(null, null), plan: BEKLEYEN }))).durum, "red", "kabul bekleyen plan");
  /* kayıt planına bağlı: başka plana taşınamaz (tetik) */
  await assert.rejects(ile(A, ELK, (db) => db.sorgu("UPDATE say_chat_kayit SET plan_id = $1 WHERE cihaz_id = $2", [BEKLEYEN, k1])), /değişmez/);
});

test("fotoğraf: kayıt yoksa açılır, sürüm önce / sonra; yalnız sahibi açar; etiket tek; çıkarılan çöpe; sil; kuyruk bir kez", async () => {
  const k = randomUUID();
  const f1 = await ile(A, ELK, (db) => chatFoto(db, depo, ELK, A, k, { plan: PLAN, rol: "ekipman", k: null, ad: "pano.jpg", veri: JPEG }));
  assert.equal(f1.durum, "tamam", JSON.stringify(f1));
  if (f1.durum !== "tamam") return;
  assert.deepEqual(f1.surum, { once: 0, sonra: 1 });
  const e1 = tamam(await ile(A, ELK, (db) => chatFoto(db, depo, ELK, A, k, { plan: PLAN, rol: "etiket", k: null, ad: "etiket1.jpg", veri: JPEG })));
  const e2 = tamam(await ile(A, ELK, (db) => chatFoto(db, depo, ELK, A, k, { plan: PLAN, rol: "etiket", k: null, ad: "etiket2.jpg", veri: JPEG })));
  const o1 = tamam(await ile(A, ELK, (db) => chatFoto(db, depo, ELK, A, k, { plan: PLAN, rol: "okunacak", k: "linye", ad: "linye.jpg", veri: JPEG })));
  assert.equal((await ile(A, ELK, (db) => chatFoto(db, depo, ELK, A, k, { plan: PLAN, rol: "okunacak", k: null, ad: "x.jpg", veri: JPEG }))).durum, "gecersiz");
  assert.equal((await ile(A, ELK, (db) => chatFoto(db, depo, ELK, A, k, { plan: PLAN, rol: "ekipman", k: null, ad: "x.svg", veri: Buffer.from("<svg/>").toString("base64") }))).durum, "gecersiz");
  const x = (await ile(A, ELK, (db) => sayChatPaneli(db, ELK, PLAN)))!.kayitlar.find((y) => y.id === k)!;
  assert.deepEqual(x.fotolar.map((f) => [f.rol, f.k]), [["ekipman", null], ["etiket", null], ["okunacak", "linye"]], "etiket tek (yenisi eskisinin yerine)");
  assert.equal(x.surum, 4);
  /* yalnız sahibi açar */
  const ac = (kim: Kisi, d: string) => ile(A, kim, (db) => dosyaIndirilebilir(db, kim, d, DOSYA_ERISIMI));
  assert.ok(await ac(ELK, f1.foto.dosya));
  assert.equal(await ac(MAK, f1.foto.dosya), null);
  assert.equal(await ac(YON, f1.foto.dosya), null);
  assert.equal(await ac(ELK, e1.foto.dosya), null, "eski etiket çöpte");
  /* kaydet: ekipman seçilir, okunacak fotoğraf çıkarılır (çöpe) */
  const tanim = (await ile(A, ELK, (db) => sayChatPaneli(db, ELK, PLAN)))!.turler[EIT].tanim;
  tamam(await ile(A, ELK, (db) => chatKaydet(db, ELK, k, 4, girdi({ tip: "plan", id: E2 }, tanim, ["A"], { kaldir: [o1.foto.dosya] }))));
  assert.equal(await ac(ELK, o1.foto.dosya), null);
  assert.ok(await ac(ELK, e2.foto.dosya));
  /* kuyruk işi bir kez: aynı iş kimliği ikinci kez gelirse saklanan sonuç */
  const isId = randomUUID(), kk = randomUUID();
  const is = (db: Sorgulayici) => tekSeferlik(db, { id: isId, tur: "saychat.kaydet", kayit: kk, zaman: null },
    () => chatIslemi(db, { depo, firmaId: A }, ELK, "saychat.kaydet", kk, 0, girdi({ tip: "yeni", tur: EIT }, tanim)));
  assert.equal((await ile(A, ELK, is)).durum, "yeni");
  assert.equal((await ile(A, ELK, is)).durum, "tekrar");
  /* sil: kayıt ve fotoğrafları */
  tamam(await ile(A, ELK, (db) => chatSil(db, ELK, k)));
  assert.equal(await ac(ELK, f1.foto.dosya), null);
  assert.deepEqual(await ile(A, MAK, (db) => chatSil(db, MAK, kk)), { durum: "yok" }, "başkasının kaydını silemez (görmez)");
  assert.ok((await ile(A, ELK, (db) => sayChatPaneli(db, ELK, PLAN)))!.kayitlar.some((y) => y.id === kk));
});

test("plan kesin silinince kayıtlar da gider", async () => {
  const p = (await ile(A, ELK, (db) => sayChatPaneli(db, ELK, PLAN)))!;
  assert.ok(p.kayitlar.length > 0);
  const v = (await ile(A, YON, (db) => planIci(db, YON, PLAN)))!;
  assert.equal(v.planSil, true, "raporsuz plan silinebilir");
  tamam(await ile(A, YON, (db) => planSil(db, YON, PLAN)));
  assert.equal((await ile(A, ELK, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM say_chat_kayit"))).rows[0].n, 0);
});
