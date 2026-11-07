/* NEREDEN GELDİ: 2026-11-07 — reisim: "probata sign'ı probata'nın içinde GÖMÜLÜ imza ile kullanacağız: imza ekranı yeni sekmede değil, probata'nın
   kendi sayfasında bir iframe içinde açılacak … sign'ın koduna dokunma, yalnız probata tarafı" (tek kaynak: sign'ın bağlantı rehberi §3, §4, §7).
   Bu kilit tutar:
   (1) iframe'in allow özniteliği rehberle AYNEN ("local-network-access; local-network; loopback-network") ve imza penceresinin her iframe'i onu taşır;
       ekran kendiliğinden yeni sekme açmaz (window.open yok — yedek yalnız kişinin tıkladığı bağlantı);
   (2) köken denetimi: haber YALNIZ açılan gömülü adresin kökeninden, kaynak "probata-sign" ve bu çerçeveden alınır; tanımsız tür / başka köken /
       köken bilinmezken haber yok;
   (3) toplu imza adresi elle kurulmaz: POST /api/v1/toplu-imza { belgeler, eposta } — gomulu_adres ve adres yalnız sign'ın sayfasıysa, kabul edilen
       belgeler cevaptan; imza isteğinin gomulu_baglanti'sı da aynı denetimle; gömülü bağlantı bağlantıyla aynı şifreli alanda (eski kayıt okunur);
   (4) CSP frame-src: 'self' + sign'ın kökü ve firma alt alanları, ayardan türetilir (sabit firma adresi yok).
   Olumsuz kanıt: tests/bozan/sign-gomulu.bozan.ts. Uydurma veri. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { GOMULU_IZIN, kokeni, signHaberi } from "../src/modules/raporlar/sign-haber.ts";
import { signIstemcisi } from "../src/server/dis/sign.ts";
import { signKokenleri, signSayfasiMi } from "../src/server/dis/sign-adres.ts";
import { baglantiMetni, baglantiOku, signGonder } from "../src/modules/raporlar/server/sign.ts";

const KOK = "https://sign.probata.com.tr", FIRMA = "https://deneme.sign.probata.com.tr";
const BELGE = "11111111-1111-4111-8111-111111111111", B2 = "44444444-4444-4444-8444-444444444444", ISTEK = "22222222-2222-4222-8222-222222222222";
const ANAHTAR = "psk_ab12_gizligizligizli";

test("allow özniteliği rehberle aynen; imza penceresinin iframe'i onu taşır; ekran kendiliğinden yeni sekme açmaz", () => {
  assert.equal(GOMULU_IZIN, "local-network-access; local-network; loopback-network");
  const ekran = readFileSync("src/modules/raporlar/ui/SignImza.tsx", "utf8");
  const iframeler = ekran.match(/<iframe\b[^>]*>/g) ?? [];
  assert.ok(iframeler.length >= 1, "gömülü pencerede iframe var");
  for (const f of iframeler) assert.ok(f.includes("allow={GOMULU_IZIN}"), `iframe allow: ${f}`);
  assert.doesNotMatch(ekran, /\bsandbox=/, "sandbox yok (rehber: konursa en az izinler — konmadı)");
  assert.doesNotMatch(ekran, /window\.open\(/, "yeni sekme kendiliğinden açılmaz");
  assert.match(ekran, /e\.source !== cerceve\.current\.contentWindow/, "haber yalnız bu çerçeveden");
  assert.match(ekran, /signHaberi\(e, koken\)/, "haber köken denetiminden geçer");
  /* haber raporun durumunu değiştirmez: pencerenin haber işleyicisi yalnız ekranı tazeler (sunucu eylemi çağırmaz) */
  const haber = ekran.match(/const haber = \(h: SignHaberi\) => \{[\s\S]*?\n {2}\};/g) ?? [];
  assert.equal(haber.length, 2, "tek imza ve toplu imza işleyicisi");
  for (const h of haber) assert.doesNotMatch(h, /Eylemi\(/, "haber işleyicisi sunucu eylemi çağırmaz");
});

test("köken denetimi: yalnız açılan adresin kökeni + kaynak probata-sign; tanımsız tür, başka köken, bilinmeyen köken reddedilir", () => {
  const koken = kokeni(`${FIRMA}/gomulu#abc`);
  assert.equal(koken, FIRMA);
  const h = (origin: string, data: unknown) => signHaberi({ origin, data }, koken);
  for (const tur of ["hazir", "imzalandi", "reddedildi", "kapali"] as const) assert.deepEqual(h(FIRMA, { kaynak: "probata-sign", tur }), { tur });
  assert.deepEqual(h(FIRMA, { kaynak: "probata-sign", tur: "toplu_bitti", imzalanan: [BELGE, "x", 5], atlanan: [B2] }),
    { tur: "toplu_bitti", imzalanan: [BELGE], atlanan: [B2] });
  assert.equal(h("https://kotu.example", { kaynak: "probata-sign", tur: "imzalandi" }), null, "başka köken");
  assert.equal(h(KOK, { kaynak: "probata-sign", tur: "imzalandi" }), null, "kök bile olsa açılan pencerenin kökeni değil");
  assert.equal(h(FIRMA, { kaynak: "baska", tur: "imzalandi" }), null, "kaynak probata-sign değil");
  assert.equal(h(FIRMA, { kaynak: "probata-sign", tur: "sil" }), null, "tanımsız tür");
  assert.equal(h(FIRMA, "imzalandi"), null, "nesne değil");
  assert.equal(signHaberi({ origin: FIRMA, data: { kaynak: "probata-sign", tur: "imzalandi" } }, null), null, "köken bilinmezken haber yok");
});

test("sign adresleri: kökenler ayardan; yalnız sign'ın sayfası kabul (https, kök ya da alt alanı, port / kullanıcı yok)", () => {
  assert.deepEqual(signKokenleri(KOK), [KOK, "https://*.sign.probata.com.tr"]);
  assert.deepEqual(signKokenleri("http://127.0.0.1:4010"), ["http://127.0.0.1:4010"], "yerel taklit");
  assert.deepEqual(signKokenleri("http://kotu.example"), [], "ağda şifresiz kök yok");
  for (const a of [`${FIRMA}/gomulu#x`, `${KOK}/dis#y`]) assert.equal(signSayfasiMi(a, KOK), true, a);
  for (const a of ["https://sign.probata.com.tr.kotu.example/x", "https://kotu.example/x", `http://deneme.sign.probata.com.tr/x`, `${FIRMA}:8443/x`,
    "https://a@deneme.sign.probata.com.tr/x", "javascript:alert(1)", 5, null]) assert.equal(signSayfasiMi(a, KOK), false, String(a));
});

test("CSP frame-src: 'self' + sign kökenleri (signKokenleri — sabit firma adresi yok)", () => {
  const ara = readFileSync("src/proxy.ts", "utf8");
  assert.match(ara, /import \{ signKokenleri \} from "\.\/server\/dis\/sign-adres";/);
  assert.ok(ara.includes("`frame-src ${[\"'self'\", ...signKokenleri()].join(\" \")}`,"), "frame-src sign kökenleriyle");
  assert.doesNotMatch(ara, /sign\.probata\.com\.tr/, "ara katmanda sabit sign adresi yok");
  assert.equal((ara.match(/frame-src/g) ?? []).length, 1);
});

interface Cagri { yontem: string; yol: string; govde: unknown }
function taklit(cevap: (c: Cagri) => { status: number; json: unknown }) {
  const l: Cagri[] = [];
  const getir = (async (adres: string | URL, i?: RequestInit) => {
    const c: Cagri = { yontem: i?.method ?? "GET", yol: String(adres).replace(KOK, ""), govde: typeof i?.body === "string" ? JSON.parse(i.body) : null };
    l.push(c);
    const r = cevap(c);
    return new Response(JSON.stringify(r.json), { status: r.status, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return { getir, l };
}

test("toplu imza: POST /toplu-imza { belgeler, eposta }; gömülü adres yalnız sign'ın sayfasıysa; kabul edilen belgeler cevaptan", async () => {
  const t = taklit(() => ({ status: 201, json: { adres: `${FIRMA}/toplu-imzala?x=1`, gomulu_adres: `${FIRMA}/gomulu-toplu#t`, belgeler: [BELGE, "kotu"], son: "2026-11-07T15:00:00Z" } }));
  const s = signIstemcisi(ANAHTAR, t.getir);
  const r = await s.topluImza([BELGE, B2, BELGE, "gecersiz"], "uzman@ornek.example");
  assert.deepEqual(t.l, [{ yontem: "POST", yol: "/api/v1/toplu-imza", govde: { belgeler: [BELGE, B2], eposta: "uzman@ornek.example" } }]);
  assert.deepEqual(r, { gomulu: `${FIRMA}/gomulu-toplu#t`, adres: `${FIRMA}/toplu-imzala?x=1`, belgeler: [BELGE], son: "2026-11-07T15:00:00Z" });
  const kotu = taklit(() => ({ status: 201, json: { adres: "https://kotu.example/a", gomulu_adres: "javascript:alert(1)", belgeler: [] } }));
  assert.deepEqual(await signIstemcisi(ANAHTAR, kotu.getir).topluImza([BELGE], "u@ornek.example"), { gomulu: null, adres: null, belgeler: [], son: null });
  await assert.rejects(s.topluImza(["gecersiz"], "u@ornek.example"), /belge yok/);
});

test("tek imza: gomulu_baglanti saklanır (bağlantıyla aynı şifreli alan); sign'ın sayfası değilse null; eski kayıt okunur", async () => {
  const t = taklit((c) => c.yol.startsWith("/api/v1/belgeler?") ? { status: 201, json: { id: BELGE, durum: "taslak" } }
    : { status: 201, json: { id: ISTEK, durum: "acik", imzacilar: [{ id: "i", durum: "bekliyor", baglanti: `${FIRMA}/dis#a`, gomulu_baglanti: `${FIRMA}/gomulu#a` }] } });
  const h = { tur: "gonder" as const, istekId: "x", istekSurum: 0, anahtar: ANAHTAR, pdf: new Uint8Array(4), ad: "a.pdf", raporNo: "DA-9", imzaci: { ad: "D", eposta: "d@ornek.example" }, oncekiBelge: null };
  assert.deepEqual(await signGonder(h, signIstemcisi(ANAHTAR, t.getir)), { belge: BELGE, istek: ISTEK, baglanti: `${FIRMA}/dis#a`, gomulu: `${FIRMA}/gomulu#a` });
  const k = taklit((c) => c.yol.startsWith("/api/v1/belgeler?") ? { status: 201, json: { id: BELGE, durum: "taslak" } }
    : { status: 201, json: { id: ISTEK, durum: "acik", imzacilar: [{ id: "i", durum: "bekliyor", baglanti: `${FIRMA}/dis#a`, gomulu_baglanti: "https://kotu.example/g" }] } });
  assert.equal((await signGonder(h, signIstemcisi(ANAHTAR, k.getir))).gomulu, null, "başka adres gömülmez");
  assert.deepEqual(baglantiOku(baglantiMetni(`${FIRMA}/dis#a`, `${FIRMA}/gomulu#a`)), { baglanti: `${FIRMA}/dis#a`, gomulu: `${FIRMA}/gomulu#a` });
  assert.deepEqual(baglantiOku(baglantiMetni(`${FIRMA}/dis#a`, null)), { baglanti: `${FIRMA}/dis#a`, gomulu: null }, "gömülüsüz: düz bağlantı (eski biçim)");
  assert.deepEqual(baglantiOku(`${KOK}/dis#eski`), { baglanti: `${KOK}/dis#eski`, gomulu: null }, "5 Kasım kaydı");
  assert.deepEqual(baglantiOku(JSON.stringify({ b: "x", g: "https://kotu.example/g" })), { baglanti: "x", gomulu: null }, "saklanan gömülü adres de denetlenir");
});
