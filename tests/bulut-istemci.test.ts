/* NEREDEN GELDİ: 2026-11-03 — firmanın kendi yedeği (reisim: "yapılsın firma ayarlardan kendi yedeğini otomatik alabiliyo olsun"; sunum K1–K6). Google
   Drive / OneDrive istemcisi (src/server/dis/bulut*.ts) YEREL TAKLİTLE (tests/yardimci/sahte-bulut.ts — gerçek hizmete istek gitmez). Kilitlenenler:
   · ayar: kimlik / sır / dönüş adresi yoksa hizmet kapalı; test ucu yalnız yerel; dönüş adresi https://<alan>/api/bulut/donus;
   · izin adresi: PKCE S256, dar izin (drive.file / Files.ReadWrite.AppFolder), kalıcı izin (offline) — kod takası doğrulayıcıyla, kod bir kez;
   · Google: klasörler bir kez açılır, aynı adlı dosya ikinci yüklemede İÇERİĞİ değişir (kopya dosya yok); Drive'da silinen klasör yeniden açılır;
   · OneDrive: yol adresli, 4 MB üstü yükleme oturumuyla parça parça; yenileme anahtarı her seferinde değişir;
   · hata türleri: invalid_grant → BulutKopuk, 401 → BulutYetki, kota → BulutDolu, 429 bir kez beklenip yeniden, 5xx → BulutHatasi; iletide sır yok.
   Olumsuz kanıt: tests/bozan/yedek.bozan.ts. */
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import { BulutDolu, BulutHatasi, BulutKopuk, BulutYetki, bulutAyari, bulutHizmeti, type YerDeposu } from "../src/server/dis/bulut.ts";
import { sahteBulutKur, sahteBulutOrtami, type SahteBulut } from "./yardimci/sahte-bulut.ts";

let t: SahteBulut;
before(async () => { t = await sahteBulutKur(); });
after(async () => { await t?.kapat(); });

const bellekYer = (): YerDeposu & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, async al(y) { return m.get(y) ?? null; }, async koy(y, id) { m.set(y, id); },
    async sil(o) { for (const k of [...m.keys()]) if (k === o || k.startsWith(`${o}/`)) m.delete(k); } };
};
const hizmet = (s: "gdrive" | "onedrive") => bulutHizmeti(bulutAyari(s, sahteBulutOrtami(t))!, { bekle: async () => undefined });
/** tarayıcının yaptığını yapar: izin adresine gider, dönüşteki kodu alır */
async function izinVer(adres: string): Promise<{ kod: string; durum: string }> {
  const y = await fetch(adres, { redirect: "manual" });
  const l = new URL(y.headers.get("location")!);
  return { kod: l.searchParams.get("code")!, durum: l.searchParams.get("state")! };
}
async function bagla(s: "gdrive" | "onedrive") {
  const h = hizmet(s), dog = randomBytes(48).toString("base64url");
  const adres = h.izinAdresi("deneme.durumkodudurumkodudurumkodudurumkodu12", createHash("sha256").update(dog).digest("base64url"));
  const { kod } = await izinVer(adres);
  return { h, adres, kod, dog, anahtar: await h.kodTakas(kod, dog) };
}

test("ayar: eksikse hizmet kapalı; test ucu yalnız yerel; dönüş adresi biçimi", () => {
  assert.equal(bulutAyari("gdrive", {}), null);
  assert.equal(bulutAyari("gdrive", { PROBATA_GOOGLE_ISTEMCI: "istemci-123", PROBATA_GOOGLE_SIR: "sir-12345678" }), null, "dönüş adresi yok");
  const tam = { PROBATA_GOOGLE_ISTEMCI: "istemci-123", PROBATA_GOOGLE_SIR: "sir-12345678", PROBATA_BULUT_DONUS: "https://deneme.probata.com.tr/api/bulut/donus" };
  assert.equal(bulutAyari("gdrive", tam)?.uc, null);
  assert.throws(() => bulutAyari("gdrive", { ...tam, PROBATA_BULUT_UC: "https://kotu.example" }), /yalnız yerel/);
  assert.throws(() => bulutAyari("gdrive", { ...tam, PROBATA_BULUT_DONUS: "http://deneme.probata.com.tr/api/bulut/donus" }), /biçiminde/);
  assert.throws(() => bulutAyari("gdrive", { ...tam, PROBATA_BULUT_DONUS: "https://kotu.example/baska" }), /biçiminde/);
  assert.equal(bulutAyari("onedrive", tam), null, "OneDrive kimliği ayrı");
});

test("izin adresi: PKCE S256, dar izin, kalıcı izin; kod bir kez, doğrulayıcı tutmalı", async () => {
  const g = new URL(hizmet("gdrive").izinAdresi("deneme.x", "meydan"));
  assert.equal(g.searchParams.get("code_challenge_method"), "S256");
  assert.equal(g.searchParams.get("access_type"), "offline");
  assert.deepEqual(g.searchParams.get("scope")!.split(" ").sort(), ["email", "https://www.googleapis.com/auth/drive.file", "openid"]);
  const m = new URL(hizmet("onedrive").izinAdresi("deneme.x", "meydan"));
  assert.deepEqual(m.searchParams.get("scope")!.split(" ").sort(), ["Files.ReadWrite.AppFolder", "User.Read", "offline_access"]);
  /* yanlış doğrulayıcı → izin geri alınmış sayılır (kod da yandı) */
  const h = hizmet("gdrive"), dog = randomBytes(48).toString("base64url");
  const { kod } = await izinVer(h.izinAdresi("deneme.x", createHash("sha256").update(dog).digest("base64url")));
  await assert.rejects(h.kodTakas(kod, "baska-dogrulayici-baska-dogrulayici-baska-dogrulayici"), BulutKopuk);
  await assert.rejects(h.kodTakas(kod, dog), BulutKopuk, "kod bir kez");
});

test("Google Drive: klasör bir kez, aynı adlı dosyanın içeriği değişir (kopya yok); silinen klasör yeniden açılır", async () => {
  const { h, anahtar } = await bagla("gdrive");
  assert.equal(await h.hesap(anahtar.erisim), t.hesap.google);
  const yer = bellekYer();
  const yol = ["probata yedek", "Raporlar", "Deneme", "Merkez", "XX-1126-0001"];
  await h.yukle(anahtar.erisim, { yol, ad: "XX-1126-0001.pdf", bayt: Buffer.from("%PDF-1 bir"), tur: "application/pdf" }, yer);
  await h.yukle(anahtar.erisim, { yol, ad: "okuma 1.jpg", bayt: Buffer.from("jpeg"), tur: "image/jpeg" }, yer);
  const klasorSayisi = [...t.drive.values()].filter((x) => x.klasor).length;
  assert.equal(klasorSayisi, 5);
  await h.yukle(anahtar.erisim, { yol, ad: "XX-1126-0001.pdf", bayt: Buffer.from("%PDF-1 iki"), tur: "application/pdf" }, yer);
  const d = t.driveDosyalari();
  assert.equal(d.get("probata yedek/Raporlar/Deneme/Merkez/XX-1126-0001/XX-1126-0001.pdf")?.toString(), "%PDF-1 iki");
  assert.equal([...t.drive.values()].filter((x) => x.ad === "XX-1126-0001.pdf").length, 1, "kopya dosya yok");
  /* yer deposu boşken (başka koşu) de aynı dosya bulunur — kopya açılmaz */
  await h.yukle(anahtar.erisim, { yol, ad: "XX-1126-0001.pdf", bayt: Buffer.from("%PDF-1 üç"), tur: "application/pdf" }, bellekYer());
  assert.equal([...t.drive.values()].filter((x) => x.ad === "XX-1126-0001.pdf").length, 1);
  /* kullanıcı Drive'da kök klasörü sildi: kayıtlı kimlik 404 → yol unutulur, baştan açılır */
  const kok = [...t.drive.values()].find((x) => x.ad === "probata yedek")!;
  for (const id of [...t.drive.values()].filter((x) => t.driveYolu(x.id).startsWith("probata yedek")).map((x) => x.id)) t.drive.delete(id);
  assert.ok(!t.drive.has(kok.id));
  await h.yukle(anahtar.erisim, { yol, ad: "XX-1126-0002.pdf", bayt: Buffer.from("%PDF-1 dört"), tur: "application/pdf" }, yer);
  assert.equal(t.driveDosyalari().get("probata yedek/Raporlar/Deneme/Merkez/XX-1126-0001/XX-1126-0002.pdf")?.toString(), "%PDF-1 dört");
});

test("Google Drive hataları: 401 → BulutYetki, kota → BulutDolu, 429 bir kez beklenir, 5xx → BulutHatasi, iptal → BulutKopuk; iletide sır yok", async () => {
  const { h, anahtar } = await bagla("gdrive");
  const y = { yol: ["probata yedek"], ad: "a.pdf", bayt: Buffer.from("x"), tur: "application/pdf" };
  await assert.rejects(h.yukle("gecersiz-anahtar", y, bellekYer()), BulutYetki);
  t.hatalar.push({ yontem: "POST", yol: /^\/google\/upload\//, durum: 403, govde: { error: { errors: [{ reason: "storageQuotaExceeded" }] } }, kez: 1 });
  await assert.rejects(h.yukle(anahtar.erisim, y, bellekYer()), BulutDolu);
  t.hatalar.push({ yontem: "POST", yol: /^\/google\/upload\//, durum: 429, kez: 1 });
  await h.yukle(anahtar.erisim, y, bellekYer());
  t.hatalar.push({ yontem: "POST", yol: /^\/google\/upload\//, durum: 503, kez: 2 });
  const e = await h.yukle(anahtar.erisim, { ...y, ad: "b.pdf" }, bellekYer()).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof BulutHatasi && e.durum === 503);
  assert.ok(!(e as Error).message.includes("gizli_ayrinti"), "hizmetin metni iletiye girmez");
  const yeni = await h.yenile(anahtar.yenileme);
  assert.ok(yeni.erisim && yeni.yenileme === null, "Google yenileme anahtarını değiştirmez");
  t.iptal = true;
  try { await assert.rejects(h.yenile(anahtar.yenileme), BulutKopuk); } finally { t.iptal = false; }
});

test("OneDrive: yol adresli, büyük dosya parça parça; yenileme anahtarı değişir; 507 → BulutDolu", async () => {
  const { h, anahtar } = await bagla("onedrive");
  assert.equal(await h.hesap(anahtar.erisim), t.hesap.ms);
  const yol = ["probata yedek", "Veri yedeği"];
  await h.yukle(anahtar.erisim, { yol, ad: "Tam kopya 2026.zip", bayt: Buffer.from("küçük"), tur: "application/zip" }, bellekYer());
  assert.equal(t.onedrive.get("probata yedek/Veri yedeği/Tam kopya 2026.zip")?.toString(), "küçük");
  const buyuk = randomBytes(23 * 1024 * 1024);
  await h.yukle(anahtar.erisim, { yol, ad: "Tam kopya 2026.zip", bayt: buyuk, tur: "application/zip" }, bellekYer());
  assert.ok(t.onedrive.get("probata yedek/Veri yedeği/Tam kopya 2026.zip")!.equals(buyuk), "parçalar sırayla birleşti, üstüne yazıldı");
  const oturumIstekleri = t.istekler.filter((x) => x.yol.startsWith("/ms/oturum/"));
  assert.equal(oturumIstekleri.length, 3, "23 MB → 10 + 10 + 3 MiB");
  assert.ok(oturumIstekleri.every((x) => x.yetki === undefined), "yükleme oturumuna erişim anahtarı gitmez");
  const k = await h.yenile(anahtar.yenileme);
  assert.ok(k.yenileme && k.yenileme !== anahtar.yenileme, "Microsoft yeni yenileme anahtarı verir");
  t.hatalar.push({ yontem: "PUT", yol: /^\/ms\/graph\//, durum: 507, kez: 1 });
  await assert.rejects(h.yukle(k.erisim, { yol, ad: "a.zip", bayt: Buffer.from("x"), tur: "application/zip" }, bellekYer()), BulutDolu);
});
