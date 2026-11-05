/* NEREDEN GELDİ: 2026-11-05 — reisim: "bu api keyi ve webhook kodunu girdiğimde imza sisteminin firma için aktif olacağı bir tasarım … o firma için
   imzalama probata sign üzerinden yapılsın … şimdilik e imza üzerinden gidelim"; tasarım 59EF1ZZAJZdg6BztvuiWbr ("önerilerin ve sunumun uygun";
   göç 0122). Bu kilit (saf) tutar: (1) webhook imzası sign'ın tanımıyla (t + HMAC-SHA256, 5 dk, sabit süreli) — yanlış sır, değişmiş gövde, eski
   zaman reddedilir; (2) istemci sign API v1'e doğru gider (yol, Bearer, rapor no, e-imza "usb", her_zaman_baglanti, 7 gün), büyük PDF parçalı,
   401'in iletisi Türkçe; (3) aynı rapor no + farklı PDF (409) revizyon olarak, kapanmış belge rapor nosuz; (4) kaynak: webhook ucu modülü çağırır,
   sign sırlarını uygulama yazamaz (göç), Firma ayarları "probata sign" gösterir. Olumsuz kanıt: tests/bozan/sign.bozan.ts. Uydurma veri. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { signIstemcisi, SignHatasi, TEK_YUKLEME_EN_COK, webhookDogrula, webhookImzasi } from "../src/server/dis/sign.ts";
import { signGonder } from "../src/modules/raporlar/server/sign.ts";

const SIR = "whsec-deneme-0123456789abcdef";
const baslik = (govde: string, t: number, sir = SIR) => `t=${t},v1=${webhookImzasi(sir, t, govde)}`;

test("webhook imzası: doğru sırla geçer; yanlış sır, değişmiş gövde, 5 dakikadan eski / ileri zaman reddedilir", () => {
  const simdi = new Date("2026-11-05T20:00:00Z"), t = Math.floor(simdi.getTime() / 1000), g = '{"id":"abc12345","olay":"belge.tamamlandi"}';
  assert.equal(webhookDogrula(baslik(g, t), g, SIR, simdi), true);
  assert.equal(webhookDogrula(baslik(g, t, "baska-sir-0123456789"), g, SIR, simdi), false);
  assert.equal(webhookDogrula(baslik(g, t), g.replace("tamamlandi", "iptal"), SIR, simdi), false);
  assert.equal(webhookDogrula(baslik(g, t - 301), g, SIR, simdi), false);
  assert.equal(webhookDogrula(baslik(g, t + 301), g, SIR, simdi), false);
  assert.equal(webhookDogrula(null, g, SIR, simdi), false);
  assert.equal(webhookDogrula(`t=${t},v1=zz`, g, SIR, simdi), false);
});

interface Cagri { yontem: string; yol: string; yetki: string | null; tur: string | null; govde: unknown }
function taklitGetir(cevap: (c: Cagri) => { status: number; json?: unknown; bayt?: Uint8Array }) {
  const l: Cagri[] = [];
  const getir = (async (adres: string | URL, i?: RequestInit) => {
    const h = new Headers(i?.headers);
    const c: Cagri = { yontem: i?.method ?? "GET", yol: String(adres).replace(/^https:\/\/sign\.probata\.com\.tr/, ""), yetki: h.get("authorization"), tur: h.get("content-type"),
      govde: typeof i?.body === "string" ? JSON.parse(i.body) : i?.body instanceof Blob ? i.body.size : null };
    l.push(c);
    const r = cevap(c);
    return new Response(r.bayt ? new Uint8Array(r.bayt) : JSON.stringify(r.json ?? {}), { status: r.status, headers: { "content-type": r.bayt ? "application/pdf" : "application/json" } });
  }) as typeof fetch;
  return { getir, l };
}
const BELGE = "11111111-1111-4111-8111-111111111111", ISTEK = "22222222-2222-4222-8222-222222222222", YUK = "33333333-3333-4333-8333-333333333333";
const ANAHTAR = "psk_ab12_gizligizligizli";

test("istemci: yol, Bearer, rapor no; imza isteği e-imza (usb), her_zaman_baglanti; büyük PDF parçalı; 401 Türkçe", async () => {
  assert.throws(() => signIstemcisi("sk-ant-x"), /psk_/);
  const t = taklitGetir((c) => {
    if (c.yontem === "POST" && c.yol.startsWith("/api/v1/belgeler?")) return { status: 201, json: { id: BELGE, durum: "taslak", rapor_no: "DA-1" } };
    if (c.yol === `/api/v1/belgeler/${BELGE}/imza-istekleri`) return { status: 201, json: { id: ISTEK, durum: "acik", imzacilar: [{ id: "i", durum: "bekliyor", baglanti: "https://sign.probata.com.tr/dis#x" }] } };
    if (c.yol === "/api/v1/yuklemeler") return { status: 201, json: { id: YUK, parca_boyu: 3_000_000, parca_sayisi: 2 } };
    if (c.yol.startsWith(`/api/v1/yuklemeler/${YUK}/parcalar/`)) return { status: 200, json: {} };
    if (c.yol.startsWith(`/api/v1/yuklemeler/${YUK}/belge?`)) return { status: 201, json: { id: BELGE, durum: "taslak" } };
    return { status: 401, json: { hata: { kod: "anahtar", mesaj: "Unauthorized" } } };
  });
  const s = signIstemcisi(ANAHTAR, t.getir);
  await s.belgeYukle(new Uint8Array(10), { ad: "DA-1.pdf", raporNo: "DA-1" });
  assert.equal(t.l[0]!.yol, "/api/v1/belgeler?ad=DA-1.pdf&rapor_no=DA-1");
  assert.equal(t.l[0]!.yetki, `Bearer ${ANAHTAR}`);
  assert.equal(t.l[0]!.tur, "application/pdf");
  const i = await s.imzaIstegiAc(BELGE, { ad: "Deneme Bir", eposta: "den@ornek.example", sonTarih: "2026-11-12T23:59:00+03:00" });
  assert.deepEqual(t.l[1]!.govde, { imzacilar: [{ ad: "Deneme Bir", eposta: "den@ornek.example", yontem: "usb" }], son_tarih: "2026-11-12T23:59:00+03:00", her_zaman_baglanti: true });
  assert.equal(i.imzacilar[0]!.baglanti, "https://sign.probata.com.tr/dis#x");
  await s.belgeYukle(new Uint8Array(TEK_YUKLEME_EN_COK + 1), { ad: "b.pdf", raporNo: "DA-2", revizyon: true });
  assert.deepEqual(t.l.slice(2).map((c) => c.yol.replace(/\?.*$/, "")), ["/api/v1/yuklemeler", `/api/v1/yuklemeler/${YUK}/parcalar/0`, `/api/v1/yuklemeler/${YUK}/parcalar/1`,
    `/api/v1/yuklemeler/${YUK}/belge`]);
  assert.match(t.l.at(-1)!.yol, /rapor_no=DA-2&revizyon=true$/);
  await assert.rejects(s.dene(), (e: unknown) => e instanceof SignHatasi && e.kod === 401 && e.message === "sign API anahtarı kabul edilmedi.");
});

test("gönder: 409'da revizyon; kapanmış belgede rapor nosuz; bağlantı yoksa hata; son tarih 7 gün sonra gün sonu", async () => {
  const cagrilar: string[] = [];
  let ilk = true, sonTarih = "";
  const istemci = {
    dene: async () => {}, istekIptal: async () => {}, pdfAl: async () => new Uint8Array(),
    belgeGetir: async () => ({ id: BELGE, durum: "taslak", rapor_no: null, imza_istegi: null }),
    belgeYukle: async (_p: Uint8Array, o: { raporNo: string | null; revizyon?: boolean }) => {
      cagrilar.push(`${o.raporNo ?? "-"}${o.revizyon ? "+rev" : ""}`);
      if (ilk) { ilk = false; throw new SignHatasi(409, "cakisma", "farklı PDF"); }
      return { id: BELGE, durum: o.revizyon ? "iptal" : "taslak", rapor_no: o.raporNo };
    },
    imzaIstegiAc: async (_b: string, p: { sonTarih: string }) => { sonTarih = p.sonTarih; return { id: ISTEK, durum: "acik", son_tarih: null, imzacilar: [{ id: "i", durum: "bekliyor", baglanti: "https://sign.probata.com.tr/dis#x" }] }; },
  };
  const h = { tur: "gonder" as const, istekId: "x", istekSurum: 0, anahtar: ANAHTAR, pdf: new Uint8Array(4), ad: "a.pdf", raporNo: "DA-9", imzaci: { ad: "D", eposta: "d@ornek.example" }, oncekiBelge: null };
  const g = await signGonder(h, istemci, new Date("2026-11-05T20:00:00Z"));
  assert.deepEqual(cagrilar, ["DA-9", "DA-9+rev", "-"]);
  assert.deepEqual(g, { belge: BELGE, istek: ISTEK, baglanti: "https://sign.probata.com.tr/dis#x" });
  assert.equal(sonTarih, "2026-11-12T23:59:00+03:00");
  await assert.rejects(signGonder(h, { ...istemci, belgeYukle: async () => ({ id: BELGE, durum: "taslak", rapor_no: null }),
    imzaIstegiAc: async () => ({ id: ISTEK, durum: "acik", son_tarih: null, imzacilar: [{ id: "i", durum: "bekliyor", baglanti: "javascript:alert(1)" }] }) }), /imza bağlantısı vermedi/);
});

test("kaynak: webhook ucu modülü çağırır; sign sırlarını uygulama yazamaz; Firma ayarları probata sign gösterir; rapor ekranı şeridi", () => {
  const u = readFileSync("src/app/api/sign/bildirim/route.ts", "utf8");
  assert.ok(u.includes("signBildirim(firmaCalistirici(k)") && u.includes('istek.headers.get("x-probata-imza")'));
  const g = readFileSync("src/server/db/gocler/0122_sign_baglanti.sql", "utf8");
  assert.ok(/firma_sir_k3[\s\S]*'sign_anahtari', 'sign_webhook_sirri'/.test(g), "K1: uygulama rolü sign sırlarını yazamaz");
  assert.ok(readFileSync("src/modules/firma-ayarlari/ui/FirmaAyarlari.tsx", "utf8").includes("<b>probata sign</b>"));
  assert.ok(readFileSync("src/modules/raporlar/ui/ImzaBolumu.tsx", "utf8").includes("<SignImzaSeridi raporId={v.id} asama=\"uzman\""));
  assert.ok(readFileSync("src/modules/onaylar/ui/OnayEkrani.tsx", "utf8").includes("asama=\"teknik\""));
});
