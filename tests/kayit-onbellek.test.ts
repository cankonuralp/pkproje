/* NEREDEN GELDİ: FIRMA-VT.md §5.1, FV3 (sunum 579; reisim 2026-10-15: "supabase ve resend bağlantılarını firma açarken biz buradan panelden
   yapalım") — her istekte alt alan adı merkezde çözülür (firma_coz); merkez her istekte sorulmasın diye çözüm süreç içinde kısa süre tutulur. Süre
   dondurmanın bayat kalma penceresidir (o pencerede giriş / oturumu ikinci kilit keser — tests/firma-vt.test.ts), boyut sınırı belleği korur, tek
   uçuş soğuk başlangıçta merkeze yığılmayı önler, hata önbelleğe girmez (merkez bir an düştüyse kalıcı "firma yok" olmasın), yönetim işlemi aynı
   örnekte hemen boşaltır. SAF — veritabanı yok, saat elle ilerler. Kilitlenenler: olumlu 15 sn / olumsuz 5 sn, ortam ayarı 5–60 (geçersiz HATA),
   2 000 kayıtta en eski KULLANILAN düşer, tek uçuş, hata önbelleğe girmez, silme / temizleme sırasında uçuştaki yükleme yazılmaz.
   2026-10-15 (FV3 incelemesi, kasıtlı): kosuldaSil artık uçuşları DÜŞÜRMEZ — bir firmanın bağlantı reddi öteki firmaların uçuştaki yüklemesini boşa
   çıkarmasın; yalnız sonucu koşulu tutan uçuş yazmaz (önceki küresel kuşak sayacının yerine uçuş sahipliği + uçuşa iliştirilen koşul).
   Olumsuz kanıt: tests/bozan/kayit-onbellek.bozan.ts (olumsuz sonuç olumlu süreyle tutulunca yeni açılan firma 15 sn bulunamaz; boyut sınırı kalkınca
   önbellek sınırsız büyür; okuma sırayı güncellemezse sık kullanılan düşer; uçuş sahipliği denetimi kalkınca dondurmadan önceki kayıt geri yazılır;
   tek uçuş kalkar; uçuşa iliştirilen koşul yok sayılınca bağlantı reddinden önce okunmuş bayat kayıt geri yazılır). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { KAYIT_ONBELLEK, kayitOnbellegiKur, onbellekSuresi } from "../src/server/kiraci/kayit-onbellek.ts";

interface Kayit { id: string; ad: string }
/** bekleyen işler (yükleyici bir sonraki adımda çağrılır) koşsun */
const adim = () => new Promise<void>((c) => setImmediate(c));
const saatli = (ek: Parameters<typeof kayitOnbellegiKur>[0] = {}) => {
  const s = { t: 1_000_000 };
  return { s, o: kayitOnbellegiKur<Kayit>({ simdi: () => s.t, ...ek }) };
};

test("ortam: PROBATA_KAYIT_ONBELLEK_SN 5–60 tam saniye, yoksa 15; geçersiz değer HATA (sessizce varsayılana düşmez)", () => {
  assert.equal(onbellekSuresi({}), 15);
  assert.equal(onbellekSuresi({ PROBATA_KAYIT_ONBELLEK_SN: "" }), 15);
  assert.equal(onbellekSuresi({ PROBATA_KAYIT_ONBELLEK_SN: "5" }), 5);
  assert.equal(onbellekSuresi({ PROBATA_KAYIT_ONBELLEK_SN: "60" }), 60);
  for (const v of ["4", "61", "0", "-5", "15.5", "on beş", " "]) {
    assert.throws(() => onbellekSuresi({ PROBATA_KAYIT_ONBELLEK_SN: v }), /PROBATA_KAYIT_ONBELLEK_SN 5–60/, v);
  }
  assert.deepEqual(KAYIT_ONBELLEK, { olumluSn: 15, olumsuzSn: 5, enCok: 2000, enAzSn: 5, enCokSn: 60 });
});

test("olumlu sonuç 15 sn, olumsuz 5 sn tutulur; süresi dolan yeniden yüklenir", async () => {
  const { s, o } = saatli();
  let yukleme = 0;
  const yukle = (d: Kayit | null) => async () => { yukleme++; return d; };
  const A = { id: "a", ad: "kendi-a" };
  assert.deepEqual(await o.getir("a:kendi-a", yukle(A)), A);
  s.t += 14_999;
  assert.deepEqual(await o.getir("a:kendi-a", yukle({ id: "x", ad: "baska" })), A, "15 sn dolmadan önbellekten");
  assert.equal(yukleme, 1);
  s.t += 1;
  assert.deepEqual(await o.getir("a:kendi-a", yukle({ id: "a", ad: "yeni" })), { id: "a", ad: "yeni" }, "15 sn dolunca yeniden");
  assert.equal(yukleme, 2);
  /* olumsuz: 5 sn */
  assert.equal(await o.getir("a:yok", yukle(null)), null);
  s.t += 4_999;
  assert.equal(await o.getir("a:yok", yukle(A)), null, "5 sn dolmadan 'yok' önbellekten");
  assert.equal(yukleme, 3);
  s.t += 1;
  assert.deepEqual(await o.getir("a:yok", yukle(A)), A, "5 sn dolunca yeniden — yeni açılan firma bulunur");
  assert.equal(yukleme, 4);
  /* al: süresi dolan kayıt yok sayılır ve silinir */
  assert.deepEqual(o.al("a:yok"), { deger: A });
  s.t += 15_000;
  assert.equal(o.al("a:yok"), undefined);
  /* ayarlanan süre */
  const k = saatli({ olumluSn: 60 });
  k.o.koy("x", A);
  k.s.t += 59_999;
  assert.deepEqual(k.o.al("x"), { deger: A });
  k.s.t += 1;
  assert.equal(k.o.al("x"), undefined);
});

test("en çok 2 000 kayıt: dolunca en eski KULLANILAN düşer (okunan kayıt sona geçer)", () => {
  const { o } = saatli();
  for (let i = 0; i < KAYIT_ONBELLEK.enCok; i++) o.koy(`k${i}`, { id: String(i), ad: `f${i}` });
  assert.equal(o.boyut, 2000);
  assert.ok(o.al("k0"), "ilk kayıt okundu → en son kullanılan");
  o.koy("yeni", { id: "y", ad: "yeni" });
  assert.equal(o.boyut, 2000);
  assert.ok(o.al("k0"), "okunan kayıt kaldı");
  assert.equal(o.al("k1"), undefined, "en eski kullanılan (k1) düştü");
  assert.ok(o.al("yeni"));
  /* küçük sınır */
  const k = kayitOnbellegiKur<Kayit>({ enCok: 2 });
  k.koy("a", { id: "a", ad: "a" }); k.koy("b", { id: "b", ad: "b" }); k.koy("c", { id: "c", ad: "c" });
  assert.deepEqual([k.al("a"), !!k.al("b"), !!k.al("c")], [undefined, true, true]);
  assert.throws(() => kayitOnbellegiKur({ enCok: 0 }), /geçersiz/);
});

test("tek uçuş: aynı anda gelen istekler tek yüklemeyi bekler; hata önbelleğe girmez", async () => {
  const { o } = saatli();
  let yukleme = 0;
  let bitir: (d: Kayit | null) => void = () => {};
  const yukle = () => { yukleme++; return new Promise<Kayit | null>((c) => { bitir = c; }); };
  const istekler = Array.from({ length: 5 }, () => o.getir("a:kendi-b", yukle));
  await adim();
  bitir({ id: "b", ad: "kendi-b" });
  const sonuclar = await Promise.all(istekler);
  assert.equal(yukleme, 1, "merkeze tek sorgu");
  assert.ok(sonuclar.every((r) => r?.id === "b"));
  /* hata: yukarı gider, önbelleğe girmez — sonraki istek yeniden dener */
  let deneme = 0;
  await assert.rejects(o.getir("a:hatali", async () => { deneme++; throw new Error("merkez düştü"); }), /merkez düştü/);
  assert.equal(o.al("a:hatali"), undefined);
  assert.deepEqual(await o.getir("a:hatali", async () => { deneme++; return { id: "h", ad: "hatali" }; }), { id: "h", ad: "hatali" });
  assert.equal(deneme, 2);
  /* eşzamanlı yükleyiciden biri zaman uyumlu fırlatsa da (yanlış yazılmış yükleyici) önbellek bozulmaz */
  await assert.rejects(o.getir("a:esz", () => { throw new Error("zaman uyumlu"); }), /zaman uyumlu/);
  assert.deepEqual(await o.getir("a:esz", async () => ({ id: "e", ad: "esz" })), { id: "e", ad: "esz" });
});

test("temizle / sil / kosuldaSil: kayıtlar düşer; uçuştaki yükleme sonucu YAZILMAZ (eski sonuç geri dönmez)", async () => {
  const { o } = saatli();
  o.koy("a:kendi-a", { id: "a", ad: "kendi-a" });
  o.koy("k:a", { id: "a", ad: "kendi-a" });
  o.koy("a:kendi-b", { id: "b", ad: "kendi-b" });
  o.koy("a:yok", null);
  o.kosuldaSil((k) => k.id === "a");
  assert.deepEqual([o.al("a:kendi-a"), o.al("k:a"), !!o.al("a:kendi-b"), o.al("a:yok")], [undefined, undefined, true, { deger: null }]);
  o.sil("a:kendi-b");
  assert.equal(o.al("a:kendi-b"), undefined);
  /* uçuştayken temizlenir: yükleme bitince sonucu önbelleğe yazılmaz (dondurulmadan önce okunmuş "etkin" kayıt geri gelmesin) */
  let bitir: (d: Kayit | null) => void = () => {};
  const p = o.getir("a:ucan", () => new Promise((c) => { bitir = c; }));
  await adim();
  o.temizle();
  assert.equal(o.boyut, 0);
  bitir({ id: "u", ad: "ucan" });
  assert.deepEqual(await p, { id: "u", ad: "ucan" }, "bekleyen istek sonucunu alır");
  assert.equal(o.al("a:ucan"), undefined, "ama önbelleğe yazılmaz");
  /* temizlemeden sonra gelen istek eski uçuşa bağlanmaz, yeniden yükler */
  let bitir2: (d: Kayit | null) => void = () => {};
  const eski = o.getir("a:ucan2", () => new Promise((c) => { bitir2 = c; }));
  await adim();
  o.temizle();
  let yeniYukleme = 0;
  const yeni = o.getir("a:ucan2", async () => { yeniYukleme++; return { id: "y", ad: "yeni" }; });
  await adim();
  bitir2({ id: "e", ad: "eski" });
  assert.deepEqual([await eski, await yeni, yeniYukleme], [{ id: "e", ad: "eski" }, { id: "y", ad: "yeni" }, 1]);
  assert.deepEqual(o.al("a:ucan2"), { deger: { id: "y", ad: "yeni" } });
  /* sil de uçuştaki yüklemeyi düşürür (yazılmaz) */
  let bitir3: (d: Kayit | null) => void = () => {};
  const p3 = o.getir("a:ucan3", () => new Promise((c) => { bitir3 = c; }));
  await adim();
  o.sil("a:ucan3");
  bitir3({ id: "s", ad: "silinmeden" });
  assert.deepEqual(await p3, { id: "s", ad: "silinmeden" });
  assert.equal(o.al("a:ucan3"), undefined);
});

test("kosuldaSil uçuşları düşürmez: öteki firmanın yüklemesi tek sorguyla yazılır, koşulu tutan bayat sonuç yazılmaz (2026-10-15, FV3 incelemesi)", async () => {
  const { o } = saatli();
  const bitir: Record<string, (d: Kayit | null) => void> = {};
  let yukleme = 0;
  const yukle = (ad: string) => () => { yukleme++; return new Promise<Kayit | null>((c) => { bitir[ad] = c; }); };
  /* iki firmanın kaydı uçuşta; A'nın bağlantısı reddedildi → A'nın kayıtları silinir */
  const pA = o.getir("a:kendi-a", yukle("a"));
  const pB = o.getir("a:kendi-b", yukle("b"));
  await adim();
  o.kosuldaSil((k) => k.id === "a");
  /* uçuştaki B'ye gelen yeni istek AYNI yüklemeyi bekler (merkeze ikinci sorgu yok) */
  const pB2 = o.getir("a:kendi-b", yukle("b2"));
  bitir.a!({ id: "a", ad: "kendi-a" });
  bitir.b!({ id: "b", ad: "kendi-b" });
  assert.deepEqual([(await pA)?.id, (await pB)?.id, (await pB2)?.id, yukleme], ["a", "b", "b", 2]);
  assert.equal(o.al("a:kendi-a"), undefined, "koşulu tutan (bağlantı reddinden önce okunmuş) sonuç yazılmadı");
  assert.deepEqual(o.al("a:kendi-b"), { deger: { id: "b", ad: "kendi-b" } }, "öteki firmanın sonucu yazıldı");
  /* olumsuz sonuç koşula girmez (koşul yalnız olumlu kayda bakar) */
  const pY = o.getir("a:yok", yukle("y"));
  await adim();
  o.kosuldaSil(() => true);
  bitir.y!(null);
  assert.equal(await pY, null);
  assert.deepEqual(o.al("a:yok"), { deger: null });
});
