/* NEREDEN GELDİ: 2026-10-31, kalem 7 — M6 (sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"; karar 5: 06'daki madde aynen, ekranlar maket 9).
   S.A.Y kişisel belgelerle çalışacak; yapay zekâ hizmetine (Anthropic, ABD) gidiş kullanım koşullarında kabul edilmeli. Bu kilit tutar: (1) kabul
   olmadan S.A.Y'a istek gitmez — denetim SUNUCUDA (sayKapisi), ekranda değil yalnız; (2) firma kabulü yalnız firma yöneticisinden, kullanıcı kabulü firma
   kabulünden sonra; (3) sürüm değişince yeniden kabul; (4) kabul yalnız eklenir (değişmez, silinmez), IP / cihaz yok, kişi işlemin bağlamından;
   (5) madde dokuz bölüm, özet üç satır, koşullar sayfası oturumsuz ve girişte bağlantı; Yönetim'de kabul durumu. Olumsuz kanıt: bozan say-kosul. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { KOSUL_MADDESI, KOSUL_OZETI, KOSUL_SURUMU, kosulDurumu, kosulKabulEt, kosulTamam } from "../src/server/yz/kosul.ts";

export function kosulDb(satirlar: { tur: string; surum: string; kisi: boolean }[]) {
  const eklenen: string[] = [];
  return { eklenen, db: { sorgu: async (sql: string, p: unknown[] = []) => {
    if (sql.startsWith("SELECT bool_or")) {
      const l = satirlar.filter((x) => x.surum === p[0]);
      return { rows: [{ firma: l.some((x) => x.tur === "firma"), kisi: l.some((x) => x.tur === "kullanici" && x.kisi) }], rowCount: 1 };
    }
    if (sql.startsWith("INSERT INTO kosul_kabul")) { const tur = /VALUES \('(\w+)'/.exec(sql)![1]!; eklenen.push(tur); satirlar.push({ tur, surum: String(p[0]), kisi: true }); }
    return { rows: [], rowCount: 1 };
  } } as never };
}

test("durum ve kabul: firma kabulü yalnız firma yöneticisinden; kullanıcı firma kabulünden sonra; sürüm değişince yeniden", async () => {
  const a = kosulDb([]);
  assert.deepEqual(await kosulDurumu(a.db), { firma: false, kisi: false, surum: KOSUL_SURUMU });
  assert.match((await kosulKabulEt(a.db, { roller: ["denetci"] }, "kullanici"))!, /firma yöneticiniz/);
  assert.match((await kosulKabulEt(a.db, { roller: ["denetci"] }, "firma"))!, /yalnız firma yöneticisi/);
  assert.equal(a.eklenen.length, 0);
  assert.equal(await kosulKabulEt(a.db, { roller: ["firma_yoneticisi"] }, "firma"), null);
  assert.deepEqual(a.eklenen, ["firma", "kullanici"], "yönetici firması ve kendisi adına");
  assert.ok(kosulTamam(await kosulDurumu(a.db)));
  assert.ok(!kosulTamam(await kosulDurumu(a.db, "2099-01-1")), "yeni sürüm: yeniden kabul");
  const b = kosulDb([{ tur: "firma", surum: KOSUL_SURUMU, kisi: false }]);
  assert.equal(await kosulKabulEt(b.db, { roller: ["denetci"] }, "kullanici"), null);
  assert.deepEqual(b.eklenen, ["kullanici"]);
});

test("metin: dokuz bölüm, üç satır özet; sürüm biçimi göçün denetimiyle aynı", () => {
  assert.equal(KOSUL_MADDESI.length, 9);
  assert.deepEqual(KOSUL_MADDESI.map(([b]) => b), ["Ne yapar.", "Hangi bilgiyi işler.", "Nereye gider.", "Nerede saklanır.", "Kapsam dışı.", "Kullanıcının payı.",
    "Firmanın payı.", "Açma ve kapatma.", "Değişiklik."]);
  assert.match(KOSUL_MADDESI[2]![1], /Anthropic PBC, ABD/);
  assert.equal(KOSUL_OZETI.length, 3);
  assert.match(KOSUL_SURUMU, /^[0-9]{4}-[0-9]{2}-[0-9]+$/);
});

test("kaynak kilidi: denetim sunucuda; kabul yalnız eklenir, IP yok; ekran kabulsüz yazı kutusu göstermez; sayfa ve bağlantı; Yönetim'de durum", () => {
  const s = readFileSync("src/modules/say/server/say.ts", "utf8"), g = readFileSync("src/server/db/gocler/0110_kosul_kabul.sql", "utf8");
  assert.ok(s.includes("if (!kosulTamam(await kosulDurumu(db))) return { durum: \"red\", neden: KOSUL_YOK };"), "sayKapisi kabulü denetler");
  assert.ok(g.includes("GRANT SELECT, INSERT ON kosul_kabul TO probata_uygulama;") && g.includes("IF TG_OP <> 'INSERT' THEN RAISE EXCEPTION"), "yalnız eklenir");
  assert.ok(g.includes("NEW.hesap_id := ben;") && g.includes("FORCE ROW LEVEL SECURITY") && g.includes("(SELECT gecerli_firma())"));
  assert.doesNotMatch(g.slice(g.indexOf("CREATE TABLE"), g.indexOf("CREATE INDEX")), /\bip\b|cihaz|user_agent/i, "IP / cihaz bilgisi yok");
  assert.ok(g.includes("'kosul', jsonb_build_object("), "Yönetim özeti");
  const a = readFileSync("src/modules/say/ui/SayAsistan.tsx", "utf8");
  assert.ok(a.includes("onSubmit={(e) => void gonder(e)} hidden={kosulEksik}") && a.includes("<KosulKabul kosul={durum.kosul}"));
  assert.ok(readFileSync("src/app/(acik)/giris/GirisFormu.tsx", "utf8").includes('href="/kosullar"'));
  assert.ok(readFileSync("src/app/(acik)/kosullar/page.tsx", "utf8").includes("KOSUL_MADDESI.map"));
  assert.ok(readFileSync("src/modules/yonetim/ui/YapayZekaBolumu.tsx", "utf8").includes("data-kosul-durum"));
});
