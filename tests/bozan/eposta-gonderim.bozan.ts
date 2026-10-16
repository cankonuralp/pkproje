/* OLUMSUZ KANIT — tests/eposta-gonderim.test.ts (FIRMA-VT FV11) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): eposta.ts bellekte bozulup
   geçici klasörden içe aktarılır; veritabanı kilidi bu dosyanın KENDİ geçici kümesinde kaldırılır. GERÇEK PostgreSQL (ortak firma) + Resend taklidi.
   O zaman:
   1. ekle adımında adla arama kalkınca Resend'e eklenip merkeze yazılamamış alan adı yeniden eklenmeye çalışılır — Resend reddeder, firma takılır;
   2. anahtar kimliği denetimi kalkınca her "Doğrula" yeni bir gönderme anahtarı açar (hesapta kullanılmayan anahtarlar birikir);
   3. K3 tetiği kalkınca uygulama rolü e-posta gönderim anahtarını yazar (Firma ayarlarından değiştirilebilir olurdu). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type pg from "pg";
import type { EpostaOrtami } from "../../src/modules/yonetim/server/eposta.ts";
import { sirYaz } from "../../src/server/ayar/sir.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, yonetimIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { resendYonetimi } from "../../src/server/dis/resend-yonetim.ts";
import { parolaOzeti } from "../../src/server/kimlik/parola.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { sahteResendKur, type SahteResend } from "../yardimci/sahte-resend.ts";
import { randomBytes } from "node:crypto";

const gecici = mkdtempSync(join(tmpdir(), "eposta-gonderim-bozan-"));
const ANA = randomBytes(32);
let kume: GomuluKume, havuz: Havuz, sahip: pg.Client, r: SahteResend, o: EpostaOrtami, eskiAnahtar: string | undefined;
let F1 = "", F2 = "", F3 = "";
before(async () => {
  eskiAnahtar = process.env.PROBATA_SIR_ANAHTARI;
  process.env.PROBATA_SIR_ANAHTARI = ANA.toString("base64");
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  sahip = kume.sahipIstemci(); await sahip.connect();
  [F1, F2, F3] = (await sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('bozan-a', 'Bozan A', 'BA'), ('bozan-b', 'Bozan B', 'BB'), ('bozan-c', 'Bozan C', 'BC') RETURNING id::text")).rows.map((x) => x.id);
  const y = (await sahip.query<{ id: string }>("INSERT INTO yonetici (eposta, ad, parola_ozeti, durum, totp_sir) VALUES ('yonetici@probata.example', 'Deneme Yönetici', $1, 'etkin', 'v1.uydurma-dogrulama-anahtari') RETURNING id::text",
    [await parolaOzeti("yonetim-parola-2026")])).rows[0]!.id;
  r = await sahteResendKur();
  o = { merkez: (is) => yonetimIcinde(havuz, is, { yoneticiId: y }), firmada: async () => { throw new Error("bozanda kendi projeli firma yok"); },
    resend: resendYonetimi({ uc: r.url, anahtar: r.anahtar, yerel: true }, { bekle: async () => {} }), anaAnahtar: ANA };
});
after(async () => {
  if (eskiAnahtar === undefined) delete process.env.PROBATA_SIR_ANAHTARI; else process.env.PROBATA_SIR_ANAHTARI = eskiAnahtar;
  await havuz?.end(); await sahip?.end(); await r?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true });
});

const KAYNAK = "src/modules/yonetim/server/eposta.ts";
let sira = 0;
type Modul = typeof import("../../src/modules/yonetim/server/eposta.ts");
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  const k = readFileSync(resolve(KAYNAK), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, a: string) => `from "${pathToFileURL(resolve(resolve(KAYNAK, ".."), a)).href}"`);
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const p = join(gecici, `m-${sira++}.ts`);
  writeFileSync(p, k.replace(eski, () => yeni));
  return import(pathToFileURL(p).href) as Promise<Modul>;
}

test("1. adla arama kalkınca Resend'e eklenip merkeze yazılamamış alan adı yeniden eklenir — Resend reddeder (kilidin koruduğu açık)", async () => {
  const m = await bozuk("    const var_ = (await o.resend.alanlar()).find((x) => x.ad === alan);", "    const var_ = undefined as { id: string } | undefined;");
  await resendYonetimi({ uc: r.url, anahtar: r.anahtar, yerel: true }).alanEkle("bozan-a.example");
  const s = await m.gonderimAlaniEkle(o, F1, { alan: "bozan-a.example", yerel: "bilgi" });
  const eklemeler = r.istekler.filter((i) => i.yontem === "POST" && i.yol === "/domains" && JSON.parse(i.govde).name === "bozan-a.example").length;
  assert.deepEqual([s.durum, eklemeler], ["red", 2], "bozuk: ikinci ekleme denendi, firma takıldı — testin 'ikinci kez eklenmedi' beklentisi düşer");
});

test("2. anahtar kimliği denetimi kalkınca her Doğrula yeni gönderme anahtarı açar (kilidin koruduğu açık)", async () => {
  const m = await bozuk("    if (!anahtarId) {", "    if (true) {");
  assert.equal((await m.gonderimAlaniEkle(o, F2, { alan: "bozan-b.example", yerel: "bilgi" })).durum, "tamam");
  r.dogrulaSonucu = "verified";
  const once = r.anahtarlar.length;
  await m.gonderimDogrula(o, F2);
  await m.gonderimDogrula(o, F2);
  assert.equal(r.anahtarlar.length, once + 2, "bozuk: ikinci Doğrula yeni anahtar açtı — testin 'bir kez' beklentisi düşer");
});

test("3. K3 tetiği kalkınca uygulama rolü e-posta gönderim anahtarını yazar (kilidin koruduğu açık)", async () => {
  await assert.rejects(kiraciIcinde(havuz, F3, (db) => sirYaz(db, "eposta_anahtari", "re_uydurmaAnahtarDegil0123456789", { kim: "Deneme" })), /yönetiminden kurulur/, "sağlam");
  await sahip.query("DROP TRIGGER firma_sir_k3 ON firma_sir");
  await kiraciIcinde(havuz, F3, (db) => sirYaz(db, "eposta_anahtari", "re_uydurmaAnahtarDegil0123456789", { kim: "Deneme" }));
  const n = await kiraciIcinde(havuz, F3, (db) => db.sorgu("SELECT 1 FROM firma_sir WHERE ad = 'eposta_anahtari' AND sifreli IS NOT NULL"));
  assert.equal(n.rowCount, 1, "bozuk: uygulama rolü anahtarı yazdı — testin 'yönetiminden kurulur' beklentisi düşer");
});
