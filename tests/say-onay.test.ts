/* NEREDEN GELDİ: 2026-10-31, kalem 6b — onay kapısı (sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"; kural: "onaya, imzaya ya da dışarıya
   gönderme, silme, yayınlama ve plan kabulü öneriyle başlasa da ikinci onay ister"). Bugüne dek yalnız talimat söylüyordu; artık sunucu kilitler. Bu kilit
   tutar: (1) S.A.Y'ın yolunda ikinci onaylı işlem onaysız çalışmaz, onay isteği (özet + metin) döner; (2) özet kişi + işlem + girdiye bağlı, anahtar
   sırasından bağımsız; başka girdiyle geçmez; (3) onay yalnız sunucunun yazdığı nottan, 10 dakika, tek kullanımlık — iş ve kullanım aynı işlemde;
   (4) gönderme, silme (_sil), yayın, plan kabulü katalogda onaylı; okuma işlemleri onaysız; (5) döngü kapıyı açar, sayfa notu temizliği onayı silmez,
   ekran pencereyi açar. Olumsuz kanıt: tests/bozan/say-onay.bozan.ts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { z } from "zod";
import { islemYurut, onayOzeti, type Islem, type IslemOrtami } from "../src/server/yz/islem.ts";
import { IKINCI_ONAY, ISLEM_KATALOGU } from "../src/modules/say/islem-katalogu.ts";

export function sahteOrtam(kayit: { onay: Set<string>; kullanilan: Set<string> }, onayKapisi = true): IslemOrtami {
  const db = {
    sorgu: async (sql: string, p: unknown[] = []) => {
      if (sql.includes("bool_or")) {
        const ozet = String(p[0]).replace(/^ONAY /, "").replace(/ · %$/, "");
        return { rows: [{ var: kayit.onay.has(ozet), kullanildi: kayit.kullanilan.has(ozet) }], rowCount: 1 };
      }
      if (sql.startsWith("INSERT INTO yz_konusma")) { const m = /^"ONAY KULLANILDI ([0-9a-f]{16})"$/.exec(String(p[1])); if (m) kayit.kullanilan.add(m[1]!); }
      return { rows: [{ id: "x" }], rowCount: 1 };
    },
  };
  return { islet: (is) => is(db as never), kim: { id: "kisi-1", ad: "Uzman A", roller: [] }, firmaId: "f", depo: () => { throw new Error(); }, kok: null,
    ekrandakiRapor: null, epostaGonder: () => {}, onayKapisi } as IslemOrtami;
}
export const silIslemi = (sayac: { n: number }): Islem => ({ ad: "deneme_sil", modul: 1, tarif: "t", tur: "yaz", girdi: z.object({ kayit: z.string() }), kaynak: [z.string()],
  islev: () => 0, ikinciOnay: () => "Kayıt kalıcı olarak silinecek", calistir: async () => { sayac.n++; return { tamam: true, bildirim: "silindi" }; } });

test("onaysız çalışmaz; onay isteği döner; onayla bir kez çalışır; ikinci kullanım ve başka girdi geçmez", async () => {
  const k = { onay: new Set<string>(), kullanilan: new Set<string>() }, s = { n: 0 }, t = silIslemi(s), o = sahteOrtam(k);
  const r1 = await islemYurut([t], o, "deneme_sil", { kayit: "a" });
  assert.ok(!r1.cevap.tamam && r1.cevap.onay, JSON.stringify(r1.cevap));
  const ozet = r1.cevap.tamam ? "" : r1.cevap.onay!.ozet;
  assert.equal(ozet, onayOzeti("kisi-1", "deneme_sil", { kayit: "a" }));
  assert.equal(s.n, 0);
  assert.ok(!(await islemYurut([t], o, "deneme_sil", { kayit: "a", onay: ozet })).cevap.tamam, "kullanıcı onaylamadan özet tek başına geçmez");
  k.onay.add(ozet);
  assert.ok(!(await islemYurut([t], o, "deneme_sil", { kayit: "b", onay: ozet })).cevap.tamam, "başka girdiyle geçmez");
  assert.ok((await islemYurut([t], o, "deneme_sil", { kayit: "a", onay: ozet })).cevap.tamam);
  assert.equal(s.n, 1);
  assert.ok(!(await islemYurut([t], o, "deneme_sil", { kayit: "a", onay: ozet })).cevap.tamam, "tek kullanımlık");
  assert.equal(s.n, 1);
  assert.ok((await islemYurut([t], sahteOrtam(k, false), "deneme_sil", { kayit: "a" })).cevap.tamam, "kapı yalnız S.A.Y'ın yolunda (ekranın eylemi kendi onayıyla)");
});

test("özet: anahtar sırasından bağımsız; kişi ve girdiyle değişir", () => {
  assert.equal(onayOzeti("k", "x_sil", { a: 1, b: [2, { c: 3, d: 4 }] }), onayOzeti("k", "x_sil", { b: [2, { d: 4, c: 3 }], a: 1 }));
  assert.notEqual(onayOzeti("k", "x_sil", { a: 1 }), onayOzeti("k2", "x_sil", { a: 1 }));
  assert.notEqual(onayOzeti("k", "x_sil", { a: 1 }), onayOzeti("k", "x_sil", { a: 2 }));
  assert.match(onayOzeti("k", "x", {}), /^[0-9a-f]{16}$/);
});

test("katalog: gönderme, silme, yayın, plan kabulü onaylı; okuma onaysız", () => {
  const onayli = new Set(ISLEM_KATALOGU.filter((t) => t.ikinciOnay).map((t) => t.ad));
  for (const a of Object.keys(IKINCI_ONAY)) assert.ok(ISLEM_KATALOGU.some((t) => t.ad === a), `${a} katalogda yok`);
  for (const a of ["rapor_onaya_gonder", "raporlari_onaya_gonder", "plan_kabul", "format_yayinla", "teklif_gonder", "rapor_sil", "plan_sil", "personel_sil"]) assert.ok(onayli.has(a), a);
  for (const t of ISLEM_KATALOGU) {
    if (t.ad.endsWith("_sil")) assert.ok(onayli.has(t.ad), `${t.ad} silme onaysız`);
    if (t.tur === "oku") assert.ok(!onayli.has(t.ad), `${t.ad} okuma onaylı olmamalı`);
  }
  assert.match(IKINCI_ONAY.raporlari_onaya_gonder!({ raporlar: [1, 2, 3] }), /^3 rapor onaya gönderilecek/);
});

test("kaynak kilidi: döngü kapıyı açar ve pencereyi bildirir; onay notu sayfa notuyla silinmez; ekranın onaya göndermesi de onaylı", () => {
  const d = readFileSync("src/modules/say/server/dongu.ts", "utf8"), k = readFileSync("src/server/yz/konusma.ts", "utf8"), s = readFileSync("src/modules/say/ui/SayAsistan.tsx", "utf8");
  assert.ok(d.includes("onayKapisi: true,") && d.includes('if (onay) yaz({ t: "onay", ...onay });'));
  assert.ok(k.includes("NOT ((icerik #>> '{}') LIKE 'ONAY %')"), "sayfa notu temizliği onayı silmez");
  assert.ok(k.includes("zaman > now() - make_interval(mins => $3)") && k.includes("ONAY KULLANILDI"), "10 dakika, tek kullanım");
  assert.ok(s.includes('if (k.tur === "gonder" && !(await onayla({'), "ekrandaki rapor da onayla gönderilir");
  assert.ok(s.includes("await onayGonder(istek.ozet, istek.metin)"), "onay sunucuya");
});
