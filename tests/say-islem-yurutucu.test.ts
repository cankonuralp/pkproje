/* NEREDEN GELDİ: pkproje §9 "2026-10-15 akşam — S.A.Y CLAUDE GİBİ" 2. adım a, B (2026-10-16): "Yürütücü SUNUCUDA koşar (istemci yalnız sonucu
   görür): girdiyi zod ile doğrular, kullanıcının oturumunda çalıştırır, hatayı Türkçe nedeniyle döndürür … Sunucu araçları istemciden gelen bilgiye
   güvenmez (oturum, firma, yetki sunucuda)". Saf kilitler (uydurma katalog ve ortam; veritabanı yok — gerçek PostgreSQL'li yürütme
   tests/say-islem.test.ts):
   1. girdi şemadan geçmezse çalıştırıcı ÇAĞRILMAZ — alan alan Türkçe neden ve işlemin şeması döner;
   2. kişi ve firma ORTAMDAN: girdide kim / firma / hesap alanları olsa da çalıştırıcı oturumun kişisini ve firmasını alır; her işlem ortamın kiracı
      işleminde (islet);
   3. katalogda olmayan işlem söylenir; çalıştırıcının beklenmeyen hatası kaydedilir, S.A.Y'a nedeniyle döner (eylem düşmez);
   4. sonucun özeti: yaz başarısı iş sayılır (yazildi 1, bildirim), okuma değişiklik sayılmaz, hata yazılamayan + neden; modül sonuçları (yetkisiz,
      çakışma, yok, uyarı, eksik) tuşların iletileriyle aynı anlamda;
   5. ekranın gönderdiği adımlar sunucuda YENİDEN ÇALIŞTIRILMAZ: yürütücü yalnız eylemin döngüsünde, yapay zekâ hizmetinin bu çağrıda döndürdüğü
      komutlarla çağrılır (2026-10-23 S.A.Y baştan: src/modules/say/server/dongu.ts — eski eylemler.ts surdur); ortam oturumdan; ekran komutundan sonraki işlem ekranın işini bekler (sıra) —
      denetim tests/yardimci/denetimler.ts sayEylemDenetimi (olumsuz kanıtı aynı işlevle).
   2026-10-16 (2. adım a incelemesi): 6. hiçbir şey değiştirmeyen yazma (degisiklik: false) iş sayılmaz; uyarı S.A.Y'ı soru sormaya yöneltmez;
      ekranda açık, kaydedilmemiş rapor korunur (ekranRaporuKirli); uzun metin sayfa sayfa, hepsi okunur (metinSayfasi — sınır değil).
   Olumsuz kanıt: tests/bozan/say-islem.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { kimlik, z } from "../src/sema/ortak.ts";
import type { Sorgulayici } from "../src/server/db/kiraci.ts";
import {
  EKRAN_KAYDEDILMEMIS, ekranRaporuKirli, islem, IslemGeriAl, islemOzeti, islemYurut, metinSayfasi, sunucuKomutu, yazmaCevabi, type IslemBaglami, type IslemOrtami,
} from "../src/server/yz/islem.ts";
import { oku, sayEylemDenetimi } from "./yardimci/denetimler.ts";

const OTURUM = { id: "11111111-1111-4111-8111-111111111111", ad: "Oturumdaki Kişi", roller: ["planlama" as const] };
const FIRMA = "22222222-2222-4222-8222-222222222222";
const SAHTE_DB = { sorgu: async () => ({ rows: [], rowCount: 0 }) } as unknown as Sorgulayici;

function ortam(): IslemOrtami & { islemler: number; hatalar: string[] } {
  const o = {
    islemler: 0, hatalar: [] as string[],
    islet: async <T,>(is: (db: Sorgulayici) => Promise<T>) => { o.islemler++; return is(SAHTE_DB); },
    kim: OTURUM, firmaId: FIRMA, depo: () => { throw new Error("depo yok"); }, kok: null, ekrandakiRapor: null, epostaGonder: () => undefined,
    hata: (_e: unknown, ad: string) => { o.hatalar.push(ad); },
  };
  return o;
}
/** uydurma katalog: çağrıları ve aldığı ortamı kaydeder */
function katalog() {
  const cagrilar: { b: IslemBaglami; veri: unknown; ham: unknown }[] = [];
  const Girdi = z.object({ plan: kimlik, adet: z.number().int().min(1) });
  return {
    cagrilar,
    l: [
      islem({ ad: "deneme_yaz", modul: 13, tarif: "Deneme.", tur: "yaz", girdi: Girdi, kaynak: [kimlik], islev: () => undefined,
        calistir: async (b, veri, ham) => { cagrilar.push({ b, veri, ham }); return { tamam: true, bildirim: "Yapıldı.", sonuc: { id: veri.plan } }; } }),
      islem({ ad: "deneme_oku", modul: 13, tarif: "Deneme.", tur: "oku", girdi: z.object({}), kaynak: [kimlik], islev: () => undefined,
        calistir: async (b, veri, ham) => { cagrilar.push({ b, veri, ham }); return { tamam: true, sonuc: { satir: 1 } }; } }),
      islem({ ad: "deneme_patla", modul: 13, tarif: "Deneme.", tur: "yaz", girdi: z.object({}), kaynak: [kimlik], islev: () => undefined,
        calistir: async () => { throw new Error("beklenmeyen"); } }),
    ],
  };
}
const PLAN = "33333333-3333-4333-8333-333333333333";

test("1. girdi şemadan geçmezse çalıştırıcı çağrılmaz — alan alan Türkçe neden ve şema döner", async () => {
  const k = katalog(), o = ortam();
  const r = await islemYurut(k.l, o, "deneme_yaz", { plan: "kimlik-degil", adet: 0 });
  assert.equal(k.cagrilar.length, 0, "çalıştırıcı çağrılmadı");
  assert.equal(o.islemler, 0, "veritabanı işlemi açılmadı");
  assert.ok(!r.cevap.tamam && r.cevap.hatalar && "plan" in r.cevap.hatalar && "adet" in r.cevap.hatalar, JSON.stringify(r));
  assert.match(r.cevap.tamam ? "" : r.cevap.neden, /^Girdi şemaya uymuyor: plan: /);
  assert.ok(r.sema && (r.sema as { properties?: object }).properties, "şema sonuçla döner");
  const oz = islemOzeti("deneme_yaz", "yaz", r.cevap, r.sema);
  assert.equal(oz.yazildi, 0);
  assert.match(oz.sonuc ?? "", /"durum":"hata"[\s\S]*"sema"/);
  /* girdi hiç verilmezse de (boş nesne) çağrılmaz */
  assert.equal((await islemYurut(k.l, o, "deneme_yaz", undefined)).cevap.tamam, false);
  assert.equal(k.cagrilar.length, 0);
});

test("2. kişi ve firma ORTAMDAN — girdideki kim / firma / hesap alanları kimlik olmaz; iş ortamın kiracı işleminde", async () => {
  const k = katalog(), o = ortam();
  const sahte = { id: "99999999-9999-4999-8999-999999999999", ad: "Sahte", roller: ["firma_yoneticisi"] };
  const r = await islemYurut(k.l, o, "deneme_yaz", { plan: PLAN, adet: 2, kim: sahte, firmaId: "99999999-0000-4000-8000-000000000000", firma: "baska", hesapId: sahte.id });
  assert.equal(r.cevap.tamam, true);
  assert.equal(k.cagrilar.length, 1);
  const c = k.cagrilar[0];
  assert.equal(c.b.kim, OTURUM, "oturumun kişisi");
  assert.equal(c.b.firmaId, FIRMA, "oturumun firması");
  assert.equal(c.b.db, SAHTE_DB, "ortamın kiracı işlemi");
  assert.equal(o.islemler, 1);
  assert.deepEqual(c.veri, { plan: PLAN, adet: 2 }, "şemadan geçen veride fazlası yok");
});

test("3. katalogda olmayan işlem söylenir; beklenmeyen hata kaydedilir ve nedeniyle döner (fırlamaz)", async () => {
  const k = katalog(), o = ortam();
  const y = await islemYurut(k.l, o, "boyle_bir_sey", {});
  assert.equal(y.islem, null);
  assert.match(y.cevap.tamam ? "" : y.cevap.neden, /Böyle bir işlem yok/);
  const p = await islemYurut(k.l, o, "deneme_patla", {});
  assert.deepEqual(p.cevap, { tamam: false, neden: "Beklenmeyen bir sorun oldu; işlem yapılmadı (veritabanı işlemi geri alındı)." });
  assert.deepEqual(o.hatalar, ["deneme_patla"]);
});

test("4. özet: yaz başarısı iş, okuma değişiklik değil, hata nedeniyle; modül sonuçları tuşların iletileriyle", async () => {
  const k = katalog(), o = ortam();
  const yaz = await sunucuKomutu(k.l, o, { tur: "islem", ad: "deneme_yaz", girdi: { plan: PLAN, adet: 1 } }, String);
  assert.deepEqual([yaz.yazildi, yaz.yapilan, yaz.yazilamadi], [1, ["Yapıldı."], []]);
  assert.deepEqual(JSON.parse(yaz.sonuc ?? "{}"), { islem: "deneme_yaz", durum: "tamam", bildirim: "Yapıldı.", id: PLAN });
  const oku = await sunucuKomutu(k.l, o, { tur: "islem", ad: "deneme_oku", girdi: {} }, String);
  assert.deepEqual([oku.yazildi, oku.yapilan, JSON.parse(oku.sonuc ?? "{}").satir], [0, [], 1]);
  const liste = await sunucuKomutu(k.l, o, { tur: "islemler", adlar: ["deneme_oku"] }, String);
  assert.match(liste.sonuc ?? "", /"islem":"islemler"[\s\S]*"deneme_oku"/);
  const hata = await sunucuKomutu(k.l, o, { tur: "islem", ad: "deneme_yaz", girdi: {} }, String);
  assert.equal(hata.yazildi, 0);
  assert.equal(hata.yazilamadi[0].ad, "deneme_yaz");
  /* modülün yazma sonucu → cevap */
  assert.deepEqual(yazmaCevabi({ durum: "yetkisiz" }), { tamam: false, neden: "Bu işlem için yetkiniz yok." });
  assert.match(yazmaCevabi({ durum: "cakisma" }).tamam ? "" : (yazmaCevabi({ durum: "cakisma" }) as { neden: string }).neden, /sürüm/);
  assert.match((yazmaCevabi({ durum: "yok" }) as { neden: string }).neden, /bulunamadı/);
  assert.deepEqual(yazmaCevabi({ durum: "red", neden: "Plan kabul bekliyor durumunda değil." }), { tamam: false, neden: "Plan kabul bekliyor durumunda değil." });
  const g = yazmaCevabi({ durum: "gecersiz", hatalar: { tesis: "Tesis seçilmeli." } });
  assert.deepEqual(g, { tamam: false, neden: "Girdi geçersiz: tesis: Tesis seçilmeli.", hatalar: { tesis: "Tesis seçilmeli." } });
  const u = yazmaCevabi({ durum: "uyari", uyarilar: { vno: "Bu vergi no başka müşteride." } });
  assert.match(u.tamam ? "" : u.neden, /^Uyarı \(engel değil\)[\s\S]*onay: true/);
  /* 2026-10-16 (2. adım a incelemesi): uyarı yönlendirmesiz — S.A.Y'ı kullanıcıya onay sorusu sormaya yöneltmez (reisim: onay sorusu yok) */
  assert.doesNotMatch(u.tamam ? "" : u.neden, /isterse|sor|kullanıcı/i);
  const e = yazmaCevabi({ durum: "eksik", eksikler: [{ ad: "Seri no" }, { ad: "Sonuç" }] });
  assert.deepEqual(e, { tamam: false, neden: "Zorunlu alanlar eksik (2): Seri no, Sonuç", eksikler: ["Seri no", "Sonuç"] });
  assert.deepEqual(yazmaCevabi({ durum: "tamam", id: PLAN, no: "P-1026-001", bildirim: "Plan açıldı." }), { tamam: true, bildirim: "Plan açıldı.", sonuc: { id: PLAN, no: "P-1026-001" } });
});

test("5. ekranın adımları yeniden çalıştırılmaz: yürütücüyü yalnız eylemin döngüsü, yapay zekânın bu çağrıdaki komutlarıyla çağırır; ortam oturumdan; sıra", () => {
  assert.deepEqual(sayEylemDenetimi(oku("src/modules/say/server/dongu.ts"), oku("src/modules/say/server/say.ts")), []);
});

test("6. değişiklik yapmayan yazma iş sayılmaz; ekranda açık, kaydedilmemiş rapor korunur; uzun metin sayfa sayfa (hepsi okunur)", async () => {
  const bos = islemOzeti("rapor_yaz", "yaz", { tamam: true, bildirim: "R-1: değişiklik yok (girişler zaten öyleydi).", degisiklik: false });
  assert.deepEqual([bos.yazildi, bos.ayni, bos.yapilan], [0, 1, []], "döngünün güvenliği ve sahte \"yaptım\" denetimi değişiklik görmez");
  assert.match(bos.sonuc ?? "", /değişiklik yok/);
  assert.equal(islemOzeti("plan_ac", "yaz", { tamam: true, bildirim: "Plan açıldı." }).yazildi, 1);
  /* çalıştırıcı ortamın "kaydedilmemiş" bilgisini alır (verilmezse false) */
  const k = katalog(), o = ortam();
  await islemYurut(k.l, { ...o, ekrandakiRapor: PLAN, kaydedilmemis: true }, "deneme_yaz", { plan: PLAN, adet: 1 });
  await islemYurut(k.l, o, "deneme_yaz", { plan: PLAN, adet: 1, kaydedilmemis: true });
  assert.deepEqual(k.cagrilar.map((c) => [c.b.ekrandakiRapor, c.b.kaydedilmemis]), [[PLAN, true], [null, false]], "girdideki değil, ortamdaki");
  assert.equal(ekranRaporuKirli({ ekrandakiRapor: PLAN, kaydedilmemis: true }, [PLAN]), true);
  assert.equal(ekranRaporuKirli({ ekrandakiRapor: PLAN, kaydedilmemis: false }, [PLAN]), false, "kaydedilmişse işlem yapılır (sayfa sonra yenilenir)");
  assert.equal(ekranRaporuKirli({ ekrandakiRapor: PLAN, kaydedilmemis: true }, []), false, "işlem açık rapora dokunmuyorsa");
  assert.equal(ekranRaporuKirli({ ekrandakiRapor: null, kaydedilmemis: true }, [PLAN]), false);
  assert.match(EKRAN_KAYDEDILMEMIS, /raporu_kaydet/);
  /* sayfa sayfa: satır sınırında, birleşince metnin tamamı; imleç */
  const metin = Array.from({ length: 500 }, (_, i) => `- ${i + 1}. satır: ${"x".repeat(180)}`).join("\n");
  const s1 = metinSayfasi(metin, 1, 10_000);
  assert.ok(s1.bilgi.sayfa_sayisi > 1 && s1.bilgi.sonraki === 2 && s1.metin.length <= 10_000);
  const hepsi = Array.from({ length: s1.bilgi.sayfa_sayisi }, (_, i) => metinSayfasi(metin, i + 1, 10_000).metin);
  assert.equal(hepsi.join("\n"), metin, "hiçbir satır düşmez");
  assert.equal(metinSayfasi(metin, 999, 10_000).bilgi.sonraki, null, "son sayfa");
  assert.deepEqual(metinSayfasi("kısa", 1).bilgi, { sayfa: 1, sayfa_sayisi: 1, sonraki: null });
});

test("7. (2026-10-16, 2. adım b) çalıştırıcı işi geri aldırıp nedenini söyletebilir: IslemGeriAl — işlem (islet) fırlatmayla geri alınır, cevap olduğu gibi döner, hata kaydı yok", async () => {
  const o = ortam();
  let islenen = 0;
  const geri = [islem({ ad: "deneme_geri", modul: 13, tarif: "Deneme.", tur: "yaz", girdi: z.object({}), kaynak: [kimlik], islev: () => undefined,
    calistir: async () => { islenen++; throw new IslemGeriAl({ tamam: false, neden: "Yayınlanamadı: deneme engeli" }); } })];
  /* islet fırlatmayı geri iletir (gerçekte kiracı işlemi ROLLBACK) */
  let geriAlindi = 0;
  const ortamGeri: IslemOrtami = { ...o, islet: async <T,>(is: (db: Sorgulayici) => Promise<T>) => { try { return await is(SAHTE_DB); } catch (e) { geriAlindi++; throw e; } } };
  const y = await islemYurut(geri, ortamGeri, "deneme_geri", {});
  assert.deepEqual(y.cevap, { tamam: false, neden: "Yayınlanamadı: deneme engeli" });
  assert.deepEqual([islenen, geriAlindi, o.hatalar.length], [1, 1, 0], "çalıştı, işlem geri alındı, beklenmeyen hata sayılmadı");
});
