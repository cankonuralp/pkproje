/* NEREDEN GELDİ: 2026-10-31, K2 + M4 (sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"). 2026-10-28 canlı denemede plan açıkken S.A.Y yalnız
   "Planlar" sayfasında olduğunu biliyordu; planı fotoğraflardan tahmin etmeye çalıştı. Bu kilit tutar: (1) uygulamanın her kayıt sayfası (rota klasöründe
   [kimlik] olan) bir sayfa tanımına bağlı ya da bilerek dışarıda (nedeniyle) — yeni sayfa S.A.Y'sız kalamaz; (2) her tanımın işlemi katalogda bir OKUMA
   işlemi ve girdisi şemadan geçer; (3) nota yalnız tanıtıcı alanlar girer, kişisel numaralar girmez; (4) okuma görünmezse ya da düşerse not yok ve
   sorunun işlemi sürer (kayıt noktası). Olumsuz kanıt: tests/bozan/say-sayfa.bozan.ts. */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { z } from "zod";
import { acikKayit, sayfaOzeti, type Islem, type IslemBaglami } from "../src/server/yz/islem.ts";
import { ISLEM_KATALOGU, SAYFA_KATALOGU } from "../src/modules/say/islem-katalogu.ts";

const KOK = "src/app/(uygulama)";
const ID = "0f2a3d00-1fa3-47a0-8f5e-4e5f6c000001";
/** S.A.Y'ın sayfa tanımı olmayan kayıt sayfaları — nedeniyle */
export const DISARIDA: Readonly<Record<string, string>> = {
  "/raporlar/[id]": "açık rapor yolu (rapor-haritasi yoldakiRapor)",
  "/raporlar/[id]/onizle": "açık rapor yolu",
  "/onaylar/[id]": "açık rapor yolu",
  "/ekipman-turleri/[id]/sablon/[sid]/kurucu": "format kurucunun kendi bağlamı (taslak haritası)",
  "/ekipman-turleri/sablon/[anahtar]": "hazır şablon önizlemesi, kayıt değil",
  "/dokumanlar/kriterler/[kod]": "Bakanlık kriter belgesi, kayıt değil",
};
function rotalar(k = KOK, on = ""): string[] {
  const l: string[] = [];
  for (const a of readdirSync(k)) {
    const y = join(k, a);
    if (!statSync(y).isDirectory()) { if (a === "page.tsx" && on.includes("[")) l.push(on); continue; }
    l.push(...rotalar(y, /^\(.*\)$/.test(a) ? on : `${on}/${a}`));
  }
  return l;
}
const ornekYol = (r: string) => r.replace(/\[tur\]/, "c").replace(/\[(kod|anahtar)\]/, "X").replace(/\[[a-z]+\]/g, ID);
const eslesen = (yol: string) => SAYFA_KATALOGU.find((s) => s.desen.test(yol));

test("her kayıt sayfası bir sayfa tanımına bağlı ya da bilerek dışarıda", () => {
  const l = rotalar();
  assert.ok(l.length >= 20, `rota bulunamadı: ${l.length}`);
  for (const r of l) {
    if (DISARIDA[r]) continue;
    assert.ok(eslesen(ornekYol(r)), `S.A.Y'ın tanımadığı kayıt sayfası: ${r} — modülün say-islemleri.ts SAY_SAYFALARI'na ekle ya da DISARIDA'ya nedeniyle yaz`);
  }
  for (const r of Object.keys(DISARIDA)) assert.ok(l.includes(r), `dışarıda listesinde artık olmayan sayfa: ${r}`);
});

test("her tanımın işlemi katalogda okuma işlemi; girdisi şemadan geçer", () => {
  for (const s of SAYFA_KATALOGU) {
    const t = ISLEM_KATALOGU.find((x) => x.ad === s.islem);
    assert.ok(t && t.tur === "oku", `${s.islem} okuma işlemi değil`);
    const adet = new RegExp(`${s.desen.source}|`).exec("")!.length - 1;
    const gruplar = s.desen.source.includes("([cd])") ? ["c", ID] : Array.from({ length: adet }, () => ID);
    assert.ok(t.girdi.safeParse(s.girdi(...gruplar)).success, `${s.islem} girdisi şemaya uymuyor`);
  }
  assert.equal(eslesen(`/ekipman-turleri/${ID}/sablon/${ID}`)?.islem, "format_getir", "dar desen önce");
  assert.equal(eslesen(`/musteriler/tesis/${ID}`)?.islem, "tesis_getir");
  assert.equal(eslesen(`/planlar/${ID}?sekme=rapor#x`.split(/[?#]/)[0])?.islem, "plan_getir");
});

test("nota yalnız tanıtıcı alanlar; kişisel numaralar düşer", () => {
  const o = sayfaOzeti({ no: "P-1026-014", durum: "Kabul edildi", ad: "Uzman A", tc: "12345678901", imzaTel: "05001112233", sgk: "1234567890123456789012345",
    kod: "0 500 111 22 33", tesis: { id: ID, ad: "Deneme Tesisi" }, musteri: { kisa: "Deneme" }, ekip: [{ ad: "x" }] });
  assert.deepEqual(o, [["no", "P-1026-014"], ["ad", "Uzman A"], ["durum", "Kabul edildi"], ["tesis", "Deneme Tesisi"], ["musteri", "Deneme"]]);
});

const sahteDb = () => { const l: string[] = []; return { l, db: { sorgu: async (s: string) => { l.push(s); return { rows: [], rowCount: 0 }; } } }; };
const islemOrnegi = (calistir: Islem["calistir"]): Islem => ({ ad: "plan_getir", modul: 13, tarif: "", tur: "oku", girdi: z.object({ plan: z.string() }), kaynak: [], islev: () => 0, calistir });
const tanim = [{ desen: /^\/planlar\/([0-9a-f-]{36})(?:\/|$)/, tur: "Plan", islem: "plan_getir", girdi: (id: string) => ({ plan: id }) }];
const baglam = (db: unknown) => ({ db, kim: { id: "k", ad: "A", roller: [] }, firmaId: "", depo: () => { throw new Error(); }, kok: null, ekrandakiRapor: null,
  kaydedilmemis: false, epostaGonder: () => {} }) as unknown as IslemBaglami;

test("açık kayıt notu; görünmezse yok; okuma düşerse kayıt noktasına dönülür", async () => {
  const a = sahteDb();
  const n = await acikKayit([islemOrnegi(async () => ({ tamam: true, sonuc: { no: "P-1026-014", durum: "Kabul edildi" } }))], tanim, baglam(a.db), `/planlar/${ID}`);
  assert.equal(n, `Açık kayıt: Plan · no: P-1026-014 · durum: Kabul edildi (kimlik ${ID}). Ayrıntı için plan_getir; kullanıcı "bu", "burası" derse bu kayıttır.`);
  assert.deepEqual(a.l, ["SAVEPOINT acik_kayit", "RELEASE SAVEPOINT acik_kayit"]);
  assert.equal(await acikKayit([islemOrnegi(async () => ({ tamam: false, neden: "görünmez" }))], tanim, baglam(sahteDb().db), `/planlar/${ID}`), null);
  const c = sahteDb();
  assert.equal(await acikKayit([islemOrnegi(async () => { throw new Error("düştü"); })], tanim, baglam(c.db), `/planlar/${ID}`), null);
  assert.deepEqual(c.l, ["SAVEPOINT acik_kayit", "ROLLBACK TO SAVEPOINT acik_kayit"]);
  assert.equal(await acikKayit([islemOrnegi(async () => ({ tamam: true, sonuc: {} }))], tanim, baglam(sahteDb().db), "/planlar"), null, "liste sayfasında yok");
});

test("kaynak kilidi: sayfa notu ve ekran durumu açık kaydı taşır", () => {
  const s = readFileSync("src/modules/say/server/say.ts", "utf8"), d = readFileSync("src/modules/say/server/dongu.ts", "utf8");
  assert.ok(d.includes("acikKayit(ISLEM_KATALOGU, SAYFA_KATALOGU"), "döngü okuyucuyu verir");
  assert.equal((d.match(/acikKayitOkuyucu\(o\)/g) ?? []).length, 2, "soru ve her tur");
  assert.ok(s.includes("await okuyucu(db, kim, e.yol)"), "bağlamda açık kayıt");
  assert.equal((s.match(/\.\.\.\(b\.acikKayit \? \[b\.acikKayit\] : \[\]\)/g) ?? []).length, 2, "sayfa notunda ve ekran durumunda");
});
