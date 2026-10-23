/* OLUMSUZ KANIT — tests/iptal-zamani.test.ts neyi koruyor (2026-10-23; probata-sign denetimi 2026-10-18, YÜKSEK: iptal kanıtının zamanı imza anıyla
   karşılaştırılmıyordu). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): zincirin bir halkası (iptal.ts, pdf-imzalar.ts ya da yukleme.ts) bellekte bozulur;
   üçü geçici klasöre kopyalanır, birbirlerine kopyadan, öteki göreli içe aktarmalar özgün dosyalara bağlanır. Her bozmada eski yanlış sonuç geri gelir:
   1. "geçerli" kanıtın üretim zamanı (thisUpdate ≥ imza anı) aranmazsa imzadan 9 ay önceki OCSP ve imzadan önce biten liste "gecerli" yapar (a, e);
   2. süresi (nextUpdate ≥ imza anı) aranmazsa imzadan önce biten liste "gecerli" yapar (e2);
   3. "iptal" kanıtı öncelikli olmazsa aynı DSS'teki iptal eden liste taze "geçerli" OCSP'yle ezilir — kapı kabul eder (c2);
   4. iptal anı imza anıyla karşılaştırılmazsa damgalı imzadan SONRA iptal edilen sertifika "iptal" olur, iptalden ÖNCE yüklenen belge
      reddedilir (d — ters yönde hata);
   5. okunamayan iptal anı "iptal değil" sayılırsa iptal edilmiş imza "gecerli" olur (f);
   6. OCSP'nin iptal anı RevokedInfo yerine thisUpdate'ten okunursa imzadan önce iptal "gecerli" görünür (c);
   7. iptal listesinin iptal anı revocationDate yerine listenin thisUpdate'inden okunursa aynı (c2);
   8. kanıtlar ilk sağlam kanıtta durularak toplanırsa (eski iptalBul) aynı DSS'teki iptal eden liste görülmez (c2);
   9. imza anı damgadan alınmazsa (hep çözüm anı) imzadan önce taze OCSP sayılmaz, imzadan sonraki iptal imzayı düşürür (b, d);
   10. imzayı kapsayan belge damgası imza anı sayılmazsa damgasız imzanın kanıtı çözüm anına göre bayat kalır;
   11. yükleme kapısı iptal durumuna bakmazsa imza anında iptal edilmiş sertifikanın PDF'i kabul edilir (c — eski hâl);
   12. kapı kendi yükleme anını çözümleyiciye vermezse damgasız imzanın iptal kararı başka bir ana göre verilir;
   13. kapı damga anına göre karara (yalnız i.iptal) güvenirse iptalden sonra yüklenen belge kabul edilir (d — damga güvenilir listeye bağlı
       değil, geriye tarihli basılabilir; 2026-10-18).
   2026-10-23 denetim bulguları (her biri önceden kilitsizdi — bozulunca bütün imza kilitleri fail 0 veriyordu):
   14. iptal listesinin imza süzgeci (r.imza === "tamam") kalkarsa verenin adıyla başka anahtarın "geçerli" listesi B-LT, "iptal" listesi ret (g, g3);
   15. OCSP cevabının imza süzgeci kalkarsa yetkisiz imzacının "geçerli" cevabı B-LT saydırır (g2);
   16. imza damgasının sağlamlığı aranmazsa izi bozuk damga imza anı olur;
   17. belge damgasının sağlamlığı aranmazsa izi bozuk belge damgası imza anı olur;
   18. belge damgasının imzayı kapsaması (boslukBas ≥ kapsamSon) aranmazsa imzadan önce basılmış belge damgası imza anı olur;
   19. imzayı kapsayan İLK belge damgası yerine sonuncusu alınırsa imza anı ileri kayar;
   20. belge damgası imza damgasından önce gelirse imza anı ileri kayar;
   21. kapı damga anına göre kararı (i.iptal) bırakırsa ileri tarihli damgalı, kanıtı "iptal" diyen belge kabul edilir. */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { IMZA_ANI, IPTAL_RET, SIMDI, T, dk, imzaliDss, iptalK, kanitliBelge, senaryo } from "../yardimci/iptal-zamani.ts";

const IPTAL = "src/server/imza/iptal.ts", PDF = "src/server/imza/pdf-imzalar.ts", YUKLEME = "src/server/imza/yukleme.ts";
const ZINCIR = [IPTAL, PDF, YUKLEME];
type P = typeof import("../../src/server/imza/pdf-imzalar.ts");
type Y = typeof import("../../src/server/imza/yukleme.ts");
type I = typeof import("../../src/server/imza/iptal.ts");

const klasor = mkdtempSync(join(tmpdir(), "iptal-zamani-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
/** `dosya`daki `eski` → `yeni`; zincirin üç dosyası kopyalanır (birbirine kopyadan bağlı), dönen: kopyaların modülleri */
async function bozuk(dosya: string, eski: string, yeni: string): Promise<{ i: I; p: P; y: Y }> {
  const hedef = join(klasor, `z-${sira++}`);
  mkdirSync(hedef);
  const zincirde = new Set(ZINCIR.map((z) => resolve(z)));
  for (const z of ZINCIR) {
    let metin = readFileSync(z, "utf8");
    if (z === dosya) {
      assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
      metin = metin.replace(eski, () => yeni);
    }
    metin = metin.replace(/from "(\.\.?\/[^"]+)"/g, (tam, y: string) => {
      const mutlak = resolve(dirname(resolve(z)), y);
      return zincirde.has(mutlak) ? `from "./${basename(mutlak)}"` : `from "${pathToFileURL(mutlak).href}"`;
    });
    writeFileSync(join(hedef, basename(z)), metin);
  }
  const yukle = <M>(z: string) => import(pathToFileURL(join(hedef, basename(z))).href) as Promise<M>;
  return { i: await yukle<I>(IPTAL), p: await yukle<P>(PDF), y: await yukle<Y>(YUKLEME) };
}
const iptalDurumu = (m: { p: P }, pdf: Buffer, simdi = SIMDI) => m.p.pdfImzalariniCozumle(pdf, { simdi }).imzalar.find((x) => x.tur === "imza")!.iptal;
const kapi = (m: { y: Y }, pdf: Buffer, simdi = SIMDI) => m.y.ekImzaNedeni(iptalK.taban, pdf, simdi);

test("zincir sağlamken (bozulmamış kopya) senaryolar kilitteki gibi — olumsuz kanıtın tabanı", async () => {
  const m = await bozuk(IPTAL, "export type IptalDurumu", "export type IptalDurumu");
  assert.deepEqual(["a", "b", "c", "c2", "d", "e", "e2", "f"].map((s) => iptalDurumu(m, senaryo(s).pdf())),
    [null, "gecerli", "iptal", "iptal", "gecerli", null, null, "iptal"]);
  assert.equal(kapi(m, senaryo("c").pdf()), IPTAL_RET);
  assert.deepEqual(["g", "g2", "g3"].map((s) => iptalDurumu(m, senaryo(s).pdf())), [null, null, null]);
  assert.deepEqual([IMZA_ANI.bozukImzaDamgasi(), IMZA_ANI.bozukBelgeDamgasi(), IMZA_ANI.oncekiBelgeDamgasi(), IMZA_ANI.ikiBelgeDamgasi(),
    IMZA_ANI.imzaVeBelgeDamgasi()].map((pdf) => iptalDurumu(m, pdf)), [null, null, null, "gecerli", "gecerli"]);
  assert.equal(kapi(m, IMZA_ANI.ileriDamga()), IPTAL_RET);
});

test("1: üretim zamanı aranmazsa bayat OCSP ve süresi dolmuş liste 'gecerli' yapar", async () => {
  const m = await bozuk(IPTAL, "if (z !== null && z >= A && (k.sonraki === null || (s !== null && s >= A))) gecerli = true;", "void z; void s; gecerli = true;");
  assert.equal(iptalDurumu(m, senaryo("a").pdf()), "gecerli", "bozuk: imzadan 9 ay önceki OCSP yakalandı");
  assert.equal(iptalDurumu(m, senaryo("e").pdf()), "gecerli", "bozuk: imzadan önce biten liste yakalandı");
});

test("2: süresi (nextUpdate) aranmazsa imzadan önce biten liste 'gecerli' yapar", async () => {
  const m = await bozuk(IPTAL, "z >= A && (k.sonraki === null || (s !== null && s >= A))", "z >= A && (void s, true)");
  assert.equal(iptalDurumu(m, senaryo("e2").pdf()), "gecerli", "bozuk: süresi bitmiş liste yakalandı");
});

test("3: 'iptal' kanıtı öncelikli olmazsa taze 'geçerli' OCSP iptal eden listeyi ezer, kapı kabul eder", async () => {
  const m = await bozuk(IPTAL, "    if (ia === null || ia <= A) return \"iptal\";",
    "    if ((ia === null || ia <= A) && !kanitlar.some((x) => x.durum === \"gecerli\")) return \"iptal\";");
  assert.equal(iptalDurumu(m, senaryo("c2").pdf()), "gecerli", "bozuk: iptal eden liste yine kazandı");
  assert.equal(kapi(m, senaryo("c2").pdf()), null, "bozuk: kapı yine reddetti");
});

test("4: iptal anı imza anıyla karşılaştırılmazsa imzadan sonra iptal edilen sertifikanın imzası reddedilir", async () => {
  const m = await bozuk(IPTAL, "    if (ia === null || ia <= A) return \"iptal\";", "    void ia; return \"iptal\";");
  assert.equal(iptalDurumu(m, senaryo("d").pdf()), "iptal", "bozuk: imzadan sonraki iptal yine geçerli sayıldı");
  assert.equal(kapi(m, senaryo("d").pdf(), dk(30)), IPTAL_RET, "bozuk: iptalden önce yüklenen belge yine kabul edildi");
});

test("5: okunamayan iptal anı 'iptal değil' sayılırsa iptal edilmiş imza 'gecerli' olur", async () => {
  const m = await bozuk(IPTAL, "    if (ia === null || ia <= A) return \"iptal\";", "    if (ia !== null && ia <= A) return \"iptal\";");
  assert.equal(iptalDurumu(m, senaryo("f").pdf()), "gecerli", "bozuk: okunamayan iptal anı yine iptal sayıldı");
});

test("6: OCSP'nin iptal anı thisUpdate'ten okunursa imzadan önceki iptal 'gecerli' görünür", async () => {
  const m = await bozuk(IPTAL, "iptalZamani = zamanYoksaNull(() => zamanOku(t, cocuklar(t, sp[1])[0]));", "iptalZamani = zamanOku(t, sp[2]);");
  assert.equal(iptalDurumu(m, senaryo("c").pdf()), "gecerli", "bozuk: RevokedInfo yine okundu");
});

test("7: iptal listesinin iptal anı listenin thisUpdate'inden okunursa imzadan önceki iptal 'gecerli' görünür", async () => {
  const m = await bozuk(IPTAL, "iptalZamani = zamanYoksaNull(() => zamanOku(o, g[1]));", "iptalZamani = zaman;");
  assert.equal(iptalDurumu(m, senaryo("c2").pdf()), "gecerli", "bozuk: revocationDate yine okundu");
});

test("8: kanıtlar ilk sağlam kanıtta durularak toplanırsa aynı DSS'teki iptal eden liste görülmez", async () => {
  const eski = "if (r.imza === \"tamam\" && r.durum !== \"bilinmiyor\") l.push({ tur: \"ocsp\", durum: r.durum, zaman: r.zaman, sonraki: r.sonraki, iptalZamani: r.iptalZamani });";
  const m = await bozuk(PDF, eski, `if (r.imza === "tamam" && r.durum !== "bilinmiyor") { l.push({ tur: "ocsp", durum: r.durum, zaman: r.zaman, sonraki: r.sonraki, iptalZamani: r.iptalZamani }); return l; }`);
  assert.equal(iptalDurumu(m, senaryo("c2").pdf()), "gecerli", "bozuk: liste yine toplandı");
});

test("9: imza anı damgadan alınmazsa (hep çözüm anı) taze OCSP sayılmaz, imzadan sonraki iptal imzayı düşürür", async () => {
  const m = await bozuk(PDF, "const an = (damgaSaglam(bilgi.damga) ? bilgi.damga!.zaman : null) ?? belgeDamgasi ?? cozumAni;", "void belgeDamgasi; const an = cozumAni;");
  assert.equal(iptalDurumu(m, senaryo("b").pdf()), null, "bozuk: damga anı yine kullanıldı");
  assert.equal(iptalDurumu(m, senaryo("d").pdf()), "iptal", "bozuk: damga anı yine kullanıldı");
});

test("10: imzayı kapsayan belge damgası imza anı sayılmazsa damgasız imzanın taze kanıtı bayat kalır", async () => {
  const m = await bozuk(PDF, "?? belgeDamgasi ?? cozumAni;", "?? cozumAni; void belgeDamgasi;");
  assert.equal(iptalDurumu(m, kanitliBelge({ ocsp: [iptalK.ocsp({ zaman: dk(5) })] }, { belgeDamgasi: T })), null, "bozuk: belge damgası yine kullanıldı");
});

test("11: kapı iptal durumuna bakmazsa imza anında iptal edilmiş sertifikanın PDF'i kabul edilir", async () => {
  const m = await bozuk(YUKLEME, "    if (i.iptal === \"iptal\" || iptalKarari(i.iptalKanitlari, an) === \"iptal\") return", "    if (i.iptal === \"__yok__\") return");
  assert.equal(kapi(m, senaryo("c").pdf()), null, "bozuk: kapı yine reddetti");
});

test("12: kapı yükleme anını çözümleyiciye vermezse damgasız imzanın iptal kararı başka bir ana göre verilir", async () => {
  const m = await bozuk(YUKLEME, "pdfImzalariniCozumle(imzali, { simdi })", "pdfImzalariniCozumle(imzali)");
  /* damgasız imza, iptal T + 60 dk; yükleme anı T + 1 dk → doğrusu kabul; bozukta çözüm anı gerçek saat (T'den sonra) → ret */
  const pdf = imzaliDss({ ocsp: [iptalK.ocsp({ durum: "iptal", zaman: dk(65), iptalZamani: dk(60) })] }, { damga: false });
  assert.equal(kapi(m, pdf, dk(1)), IPTAL_RET, "bozuk: yükleme anı yine verildi");
});

test("13: kapı damga anına göre karara güvenirse iptalden sonra yüklenen belge kabul edilir", async () => {
  const m = await bozuk(YUKLEME, "i.iptal === \"iptal\" || iptalKarari(i.iptalKanitlari, an) === \"iptal\"", "i.iptal === \"iptal\"");
  assert.equal(kapi(m, senaryo("d").pdf()), null, "bozuk: yükleme anına göre karar yine verildi");
});

const duzey = (m: { p: P }, pdf: Buffer) => m.p.pdfImzalariniCozumle(pdf, { simdi: SIMDI }).duzey;

test("14: iptal listesinin imza süzgeci kalkarsa başka anahtarın 'geçerli' listesi B-LT saydırır, 'iptal' listesi reddettirir", async () => {
  const m = await bozuk(PDF, 'if (r.imza === "tamam" && r.durum !== "bilinmiyor") l.push({ tur: "crl"', 'if (r.durum !== "bilinmiyor") l.push({ tur: "crl"');
  assert.deepEqual([iptalDurumu(m, senaryo("g").pdf()), duzey(m, senaryo("g").pdf())], ["gecerli", "B-LT"], "bozuk: imzası tutmayan liste yine düştü");
  assert.equal(kapi(m, senaryo("g3").pdf()), IPTAL_RET, "bozuk: imzası tutmayan iptal listesi yine sayılmadı");
});

test("15: OCSP cevabının imza süzgeci kalkarsa yetkisiz imzacının 'geçerli' cevabı B-LT saydırır", async () => {
  const m = await bozuk(PDF, 'if (r.imza === "tamam" && r.durum !== "bilinmiyor") l.push({ tur: "ocsp"', 'if (r.durum !== "bilinmiyor") l.push({ tur: "ocsp"');
  assert.deepEqual([iptalDurumu(m, senaryo("g2").pdf()), duzey(m, senaryo("g2").pdf())], ["gecerli", "B-LT"], "bozuk: yetkisiz cevap yine düştü");
});

test("16: imza damgasının sağlamlığı aranmazsa izi bozuk damga imza anı olur", async () => {
  const m = await bozuk(PDF, "(damgaSaglam(bilgi.damga) ? bilgi.damga!.zaman : null)", "(bilgi.damga?.zaman ?? null)");
  assert.equal(iptalDurumu(m, IMZA_ANI.bozukImzaDamgasi()), "gecerli", "bozuk: bozuk damga yine an sayılmadı");
});

test("17: belge damgasının sağlamlığı aranmazsa izi bozuk belge damgası imza anı olur", async () => {
  const m = await bozuk(PDF, 'd.tur === "belge_damgasi" && saglam(d) && d.boslukBas >= bilgi.kapsamSon', 'd.tur === "belge_damgasi" && d.boslukBas >= bilgi.kapsamSon');
  assert.equal(iptalDurumu(m, IMZA_ANI.bozukBelgeDamgasi()), "gecerli", "bozuk: bozuk belge damgası yine an sayılmadı");
});

test("18: belge damgasının imzayı kapsaması aranmazsa imzadan önce basılmış belge damgası imza anı olur", async () => {
  const m = await bozuk(PDF, "saglam(d) && d.boslukBas >= bilgi.kapsamSon && d.damga?.zaman", "saglam(d) && d.damga?.zaman");
  assert.equal(iptalDurumu(m, IMZA_ANI.oncekiBelgeDamgasi()), "gecerli", "bozuk: önceki belge damgası yine an sayılmadı");
});

test("19: imzayı kapsayan ilk belge damgası yerine sonuncusu alınırsa imza anı ileri kayar", async () => {
  const m = await bozuk(PDF, "const belgeDamgasi = imzalar.find((d) =>", "const belgeDamgasi = imzalar.findLast((d) =>");
  assert.equal(iptalDurumu(m, IMZA_ANI.ikiBelgeDamgasi()), null, "bozuk: ilk belge damgası yine an sayıldı");
});

test("20: belge damgası imza damgasından önce gelirse imza anı ileri kayar", async () => {
  const m = await bozuk(PDF, "const an = (damgaSaglam(bilgi.damga) ? bilgi.damga!.zaman : null) ?? belgeDamgasi ?? cozumAni;",
    "const an = belgeDamgasi ?? (damgaSaglam(bilgi.damga) ? bilgi.damga!.zaman : null) ?? cozumAni;");
  assert.equal(iptalDurumu(m, IMZA_ANI.imzaVeBelgeDamgasi()), null, "bozuk: imza damgası yine önce geldi");
});

test("21: kapı damga anına göre kararı bırakırsa ileri tarihli damgalı, kanıtı 'iptal' diyen belge kabul edilir", async () => {
  const m = await bozuk(YUKLEME, 'if (i.iptal === "iptal" || iptalKarari(', "if (iptalKarari(");
  assert.equal(kapi(m, IMZA_ANI.ileriDamga()), null, "bozuk: damga anına göre karar yine reddetti");
});
