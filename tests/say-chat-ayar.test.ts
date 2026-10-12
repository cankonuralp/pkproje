/* NEREDEN GELDİ: 523 — S.A.Y Chat ayarları (pkproje §3.10 m.13–16; maket 521 ekran 12 — reisim 2026-10-13 "onayılıyorum, yap bitir"; m.16 "Düzenleyen:
   ekipman türünü düzenleyebilen roller"; reisim 2026-10-04: "yetki her zaman sunucuda; istemciden gelen kimlik ve sürüm yetki vermez"). GERÇEK
   PostgreSQL, iki firma (göç 0084 say_chat_ayar):
   · türü gören (denetçi) ayarı görür, kayıt yoksa formattan hazır; görmeyen (muhasebe) ve başka firma göremez;
   · yalnız modül 5'te "yaz" olan (firma / branş yöneticisi) kaydeder; ilk Kaydet satırı ekler, sonrakiler sürümü artırır; aynısı sürüm artırmaz;
     eski sürümle çakışma; formatta olmayan alan reddedilir; her Kaydet denetim izinde;
   · S.A.Y Chat'in okuduğu tanım (chatTanimi) kaydedilen, sürümüyle;
   · firma yalnız kendi ayarını görür (RLS); türü değiştirilemez (tetik); uygulama rolünün DELETE'i yok; tür kesin silinince ayar da gider. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { turSil } from "../src/modules/ekipman-turleri/server/turler.ts";
import { taslakBaslat, yayindakiFormat, yayinla, type Kisi } from "../src/modules/rapor-format/server/formatlar.ts";
import { chatTanimi, sayChatAyari, sayChatAyarKaydet } from "../src/modules/say-chat/server/ayar.ts";
import { chatBasliklari, hazirTanim } from "../src/modules/say-chat/sema.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, A = "", B = "", TUR = "", TUR_B = "";
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let YON: Kisi, DEN: Kisi, MUH: Kisi, YON_B: Kisi;
const ile = <T,>(firma: string, k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };

async function hesap(firma: string, eposta: string, rol: string) {
  return kisi((await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ($1, 'Deneme', $2, 'etkin') RETURNING id::text", [eposta, [rol]]))).rows[0].id, rol);
}
async function turKur(firma: string, k: Kisi, kod: string) {
  return ile(firma, k, async (db) => {
    const id = (await db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ($1, 'Elektrik iç tesisatı', 'elektrik', 'e', 12) RETURNING id::text", [kod])).rows[0].id;
    const t = tamam(await taslakBaslat(db, k, id, "sablon:ZPKR02", null));
    tamam(await yayinla(db, k, t.id, t.surum, ""));
    return id;
  });
}

before(async () => {
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('sca-a', 'Deneme A', 'CA'), ('sca-b', 'Deneme B', 'CB') RETURNING id::text")).rows.map((r) => r.id);
  } finally { await s.end(); }
  YON = await hesap(A, "yon@sca-a.example", "firma_yoneticisi");
  DEN = await hesap(A, "den@sca-a.example", "denetci");
  MUH = await hesap(A, "muh@sca-a.example", "muhasebe");
  YON_B = await hesap(B, "yon@sca-b.example", "firma_yoneticisi");
  TUR = await turKur(A, YON, "EIT");
  TUR_B = await turKur(B, YON_B, "EIT");
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

const satir = (ad: string, alan: string, hazir = "") => ({ ad, alan, hazir });

test("görme: türü gören formattan hazır ayarı görür (yazamaz); görmeyen ve başka firma göremez", async () => {
  const d = await ile(A, DEN, (db) => sayChatAyari(db, DEN, TUR));
  const f = (await ile(A, DEN, (db) => yayindakiFormat(db, TUR)))!.tanim;
  assert.ok(d);
  assert.deepEqual([d!.formatVar, d!.kayitli, d!.yaz, d!.dusen], [true, null, false, 0]);
  assert.deepEqual(d!.tanim, hazirTanim(f));
  assert.deepEqual(d!.basliklar, chatBasliklari(f));
  assert.ok(["linye", "pd", "zi"].every((k) => d!.basliklar.some(([x]) => x === k)), "ZPKR02 ölçüm tabloları başlık");
  assert.equal(await ile(A, MUH, (db) => sayChatAyari(db, MUH, TUR)), null, "muhasebe türü görmez");
  assert.equal(await ile(B, YON_B, (db) => sayChatAyari(db, YON_B, TUR)), null, "başka firmanın türü");
  assert.equal((await ile(A, YON, (db) => sayChatAyari(db, YON, TUR)))?.yaz, true);
});

test("kaydet: yalnız yazabilen; ilk kayıt, aynısı sürüm artırmaz, değişiklik sürümü artırır, eski sürüm çakışır, geçersiz reddedilir; iz", async () => {
  const t1 = { satirlar: [satir("Marka", "e:marka"), satir("Sn", "e:seri"), satir("Not", "yorum")], okunacak: [{ k: "linye", acik: true }, { k: "zi", acik: false }] };
  assert.deepEqual(await ile(A, DEN, (db) => sayChatAyarKaydet(db, DEN, TUR, null, t1)), { durum: "yetkisiz" });
  assert.deepEqual(await ile(A, YON, (db) => sayChatAyarKaydet(db, YON, TUR, null, t1)), { durum: "tamam", surum: 0 });
  assert.deepEqual(await ile(A, YON, (db) => sayChatAyarKaydet(db, YON, TUR, null, t1)), { durum: "cakisma" }, "kayıt varken 'ilk kayıt' çakışır");
  assert.deepEqual(await ile(A, YON, (db) => sayChatAyarKaydet(db, YON, TUR, 0, t1)), { durum: "degisiklik_yok", surum: 0 });
  const t2 = { ...t1, satirlar: [...t1.satirlar.slice(0, 2), satir("Şebeke gerilimi", "yorum", "220 V")] };
  assert.deepEqual(await ile(A, YON, (db) => sayChatAyarKaydet(db, YON, TUR, 0, t2)), { durum: "tamam", surum: 1 });
  assert.deepEqual(await ile(A, YON, (db) => sayChatAyarKaydet(db, YON, TUR, 0, t1)), { durum: "cakisma" }, "eski sürümle");
  const g = await ile(A, YON, (db) => sayChatAyarKaydet(db, YON, TUR, 1, { satirlar: [satir("X", "a:olmayan")] }));
  assert.equal(g.durum === "hata" && g.hata.ne, "alan");
  assert.deepEqual(await ile(A, YON, (db) => sayChatAyarKaydet(db, YON, "00000000-0000-4000-8000-000000000000", null, t1)), { durum: "yok" });
  assert.deepEqual(await ile(B, YON_B, (db) => sayChatAyarKaydet(db, YON_B, TUR, null, t1)), { durum: "yok" }, "başka firmanın türüne yazamaz");
  /* okunan: kayıtlı, sürümüyle; denetim izi iki Kaydet */
  const d = await ile(A, DEN, (db) => sayChatAyari(db, DEN, TUR));
  assert.deepEqual([d?.kayitli?.surum, d?.tanim.satirlar.at(-1)], [1, satir("Şebeke gerilimi", "yorum", "220 V")]);
  assert.deepEqual(await ile(A, DEN, (db) => chatTanimi(db, TUR)), { tanim: { satirlar: t2.satirlar, okunacak: t1.okunacak }, surum: 1 });
  const fb = (await ile(B, YON_B, (db) => yayindakiFormat(db, TUR_B)))!.tanim;
  assert.deepEqual(await ile(B, YON_B, (db) => chatTanimi(db, TUR_B)), { tanim: hazirTanim(fb), surum: 0 }, "B'nin ayarı yok: hazır");
  const iz = await ile(A, YON, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM denetim_izi WHERE ne = 'say_chat_ayar.kaydet'"));
  assert.equal(iz.rows[0].n, 2);
});

test("GÜVENLİK: firma yalnız kendi ayarını görür; türü değişmez; DELETE yok; tür kesin silinince ayar gider", async () => {
  tamam(await ile(B, YON_B, (db) => sayChatAyarKaydet(db, YON_B, TUR_B, null, { satirlar: [satir("Marka", "e:marka")] })));
  assert.equal((await ile(B, YON_B, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM say_chat_ayar"))).rows[0].n, 1, "B yalnız kendini görür");
  await assert.rejects(ile(A, YON, (db) => db.sorgu("UPDATE say_chat_ayar SET tur_id = $1", [TUR_B])), "başka türe taşınamaz");
  const t2 = await ile(A, YON, async (db) => (await db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EIK', 'İkinci', 'elektrik', 'e', 12) RETURNING id::text")).rows[0].id);
  await assert.rejects(ile(A, YON, (db) => db.sorgu("UPDATE say_chat_ayar SET tur_id = $1", [t2])), /türü değişmez/);
  await assert.rejects(ile(A, YON, (db) => db.sorgu("DELETE FROM say_chat_ayar")), /permission denied|izin/);
  assert.equal((await ile(A, YON, (db) => turSil(db, YON, TUR))).durum, "tamam", "kullanılmamış tür silinir");
  assert.equal((await ile(A, YON, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM say_chat_ayar"))).rows[0].n, 0, "ayar birlikte gitti");
});
