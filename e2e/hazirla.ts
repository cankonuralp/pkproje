/* UÇTAN UCA HAZIRLIK (2026-10-03, reisim: "Run failed" — 28e4689'da CI'daki uçtan uca adımı düştü, aynı commit main'de geçti; yerelde 177/177).
   Testler Next geliştirme sunucusunda koşar; sayfa ilk istekte derlenir. Yavaş CI makinesinde ilk derleme ilk testin 5 sn'lik beklemesini
   aşabiliyordu. Testlerden önce her sayfa bir kez istenir ve derlenir (bekleme yalnız burada, uzun); testlerin süreleri değişmez.
   2026-10-04 (K1): istek firma adresine (Host) gider — Node *.localhost'u çözemeyebilir, bu yüzden 127.0.0.1 + Host başlığı. Oturumsuz
   istek girişe yönlenir; giriş ve vitrin derlenir, uygulama sayfaları ilk girişte derlenir. */
import { chromium, request, type FullConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import { MODULLER } from "../src/modules/moduller";
import { E2E_FIRMA, E2E_HESAPLAR, E2E_KAPI, E2E_PAROLA, E2E_YONETIM } from "./hesaplar";
import { BOS_KIMLIK, uygulamaRotalari, YOK_SAYFASI } from "./rotalar";

const SAYFALAR = ["/giris", "/", "/planlar", "/muhasebe", "/vitrin"];

export default async function hazirla(_ayar: FullConfig) {
  const istek = await request.newContext({ baseURL: `http://127.0.0.1:${E2E_KAPI}`, extraHTTPHeaders: { Host: `${E2E_FIRMA.kisaAd}.localhost:${E2E_KAPI}` } });
  for (const yol of SAYFALAR) {
    const yanit = await istek.get(yol, { timeout: 180_000 });
    if (!yanit.ok()) throw new Error(`${yol} hazırlanamadı: ${yanit.status()}`);
  }
  await istek.dispose();
  /* 2026-10-04 (K2): oturumlu sayfalar ve istemci parçaları da test başlamadan derlensin — test ortasında derleme, açık sayfada modülü
     yeniden yükleyip (geliştirme kipi) ortak bağlamı (onay penceresi) ikiliyordu: e2e/hesap.spec yalnız ilk projede düştü. Gerçek tarayıcıyla
     giriş yapılır, her modül sayfası ve personel alt sayfaları bir kez açılır. */
  const yol = process.env.PROBATA_CHROMIUM || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
  const tarayici = await chromium.launch(yol ? { executablePath: yol } : {});
  const sayfa = await tarayici.newPage({ baseURL: `http://${E2E_FIRMA.kisaAd}.localhost:${E2E_KAPI}` });
  sayfa.setDefaultTimeout(180_000);
  await sayfa.goto("/giris");
  await sayfa.locator("html[data-hazir]").waitFor({ state: "attached" });
  await sayfa.getByLabel("E-posta").fill(E2E_HESAPLAR.yonetici.eposta);
  await sayfa.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await sayfa.getByRole("button", { name: "Giriş yap" }).click();
  await sayfa.waitForURL((u) => !u.pathname.startsWith("/giris"));
  const ac = async (y: string) => { await sayfa.goto(y); await sayfa.locator("html[data-hazir]").waitFor({ state: "attached" }); };
  for (const m of MODULLER) await ac(`/${m.yol}`);
  await ac("/personel");
  const kart = await sayfa.locator('a[href^="/personel/"]:not([href="/personel/yeni"])').first().getAttribute("href");
  await ac("/personel/yeni");
  await ac("/personel/roller");
  await ac("/musteriler");
  await ac("/ekipman-turleri?brans=e");
  await ac("/olcum-cihazlari");
  await ac("/zimmetler/hareketler");
  await ac("/araclar/tutanaklar");
  await ac("/sozlesmeler/yeni");
  await ac("/teklifler/yeni");
  await ac("/muhasebe/faturalar");
  await ac("/muhasebe/giderler");
  await ac("/muhasebe/gelir-gider");
  await ac("/performans");
  await ac("/talepler");
  await ac("/personel/izinler");
  await ac("/uyarilar");
  await ac("/onaylar/diger");
  await ac("/firma-ayarlari");
  await ac("/planlar/ac");
  await ac("/dokumanlar/kriterler");
  await ac("/dokumanlar/diger");
  await ac("/dokumanlar/egitimler");
  await ac("/dokumanlar/egitimler/turler");
  await ac("/onaylar/tum");
  await ac("/onaylar/imza");
  await ac("/onaylar/istekler");
  /* 319 müşteri paneli: personel oturumuyla ana sayfaya döner, rota yine derlenir */
  await ac("/portal");
  await ac("/portal/uygunsuz");
  await ac("/portal/plan");
  await ac("/portal/sozlesme");
  await ac("/portal/personel");
  await ac("/raporlar");
  if (kart) { await ac(kart); await ac(`${kart}/duzenle`); }
  /* 2026-10-04: kaydı test sırasında açılan ayrıntı sayfaları da önceden derlensin (olmayan kimlik "bulunamadı" çizer, rota yine derlenir) —
     ana dalda e2e/musteriler.spec kaydet sonrası /musteriler/<id> soğuk derlemede 5 sn'yi aştı (CI 321ce19, 94ec1ea). */
  const YOK = BOS_KIMLIK;
  for (const y of [`/musteriler/${YOK}`, `/musteriler/tesis/${YOK}`, `/ekipman-turleri/${YOK}`, `/ekipman-turleri/${YOK}/sablon/${YOK}`, `/olcum-cihazlari/${YOK}`, `/araclar/${YOK}`,
    `/sozlesmeler/${YOK}`, `/teklifler/${YOK}`, `/teklifler/${YOK}/duzenle`, `/muhasebe/is/${YOK}`, `/muhasebe/f/${YOK}`, `/performans/${YOK}`, `/planlar/${YOK}`, `/raporlar/${YOK}`, `/raporlar/${YOK}/onizle`, `/onaylar/${YOK}`, `/dokumanlar/standart/${YOK}`, "/dokumanlar/kriterler/ZPKK01", `/zimmetler/varlik/d/${YOK}`]) await ac(y);
  await ac("/giris/parola");
  /* 468 (2026-10-10, deneme makinesi 927228e): elle yazılan liste eksik kalıyordu — testte ilk kez derlenen sayfa (Yeni rapor: çevrimdışı önceden
     indirme; "bulunamadı": yönetim adresi ayrımı) geliştirme sunucusunu 30 sn'den uzun meşgul etti, o anki istek düştü. Uygulamanın BÜTÜN sayfa ve
     uçları klasörden bulunur (src/app: page / route; yönetim grubu aşağıda kendi adresinde) ve testlerden önce bir kez istenir — oturumlu çerezle,
     127.0.0.1 + Host başlığıyla (sonucu değil, derlemeyi bekleriz). Yeni bir rota parametresinin değeri e2e/rotalar.ts'te tanımlanmadan hazırlık durur. */
  const cerez = (await sayfa.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const oturumlu = await request.newContext({ baseURL: `http://127.0.0.1:${E2E_KAPI}`,
    extraHTTPHeaders: { Host: `${E2E_FIRMA.kisaAd}.localhost:${E2E_KAPI}`, Cookie: cerez }, maxRedirects: 0 });
  for (const y of [...uygulamaRotalari(), YOK_SAYFASI]) {
    const yanit = await oturumlu.get(y, { timeout: 180_000, maxRedirects: 0 }).catch((h: Error) => h);
    if (yanit instanceof Error || yanit.status() >= 500) console.warn(`[hazırlık] ${y}: ${yanit instanceof Error ? yanit.message.split("\n")[0] : yanit.status()}`);
  }
  await oturumlu.dispose();
  /* 348 yönetim: yönetim adresinde giriş adımları ve panel sayfaları (hazırlık yöneticisiyle — testteki yöneticinin kodu yeniden oynatma sayılmasın).
     355 (95b7eb7 CI: tablet ERR_ABORTED, telefon giriş formu gönderilmeden yeniden yüklendi): geliştirme sunucusu yeni derlenen rotadan sonra açık
     sayfayı yeniden yükleyebiliyor — ısınma testten önce derleme içindir, sonucu değil: sayfa açma yeniden denenir, panel sayfaları önce oturumsuz
     da istenir (rota yine derlenir), giriş üç kez denenir; yine olmazsa uyarı yazılır, testler koşar (geç derlenen rota testte beklenir). */
  const ys = await tarayici.newPage({ baseURL: `http://${E2E_YONETIM.alan}:${E2E_KAPI}` });
  ys.setDefaultTimeout(60_000);
  const yac = async (y: string) => {
    for (let i = 1; ; i++) {
      try { await ys.goto(y, { timeout: 180_000 }); await ys.locator("html[data-hazir]").waitFor({ state: "attached" }); return; }
      catch (e) { if (i >= 3) throw e; await ys.waitForTimeout(2_000); }
    }
  };
  try {
    for (const y of ["/yonetim/giris", "/yonetim/giris/kod", "/yonetim/giris/kurulum", "/yonetim", "/yonetim/yeni", `/yonetim/f/${YOK}`]) await yac(y);
    let girdi = false;
    for (let i = 0; i < 3 && !girdi; i++) {
      try {
        await yac("/yonetim/giris");
        await ys.getByLabel("E-posta").fill(E2E_YONETIM.hazirla);
        await ys.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
        /* 393: iki adım kapalı (göç 0075 başlangıcı) — parolayla doğrudan panel */
        await ys.getByRole("button", { name: "Giriş yap" }).click();
        await ys.waitForURL((u) => u.pathname === "/yonetim");
        girdi = true;
      } catch (e) { console.warn(`[hazırlık] yönetim girişi ${i + 1}. deneme: ${(e as Error).message.split("\n")[0]}`); }
    }
    if (girdi) for (const y of ["/yonetim", "/yonetim/yeni", `/yonetim/f/${YOK}`]) await yac(y);
  } catch (e) {
    console.warn(`[hazırlık] yönetim ısınması tamamlanamadı (testler yine koşar): ${(e as Error).message.split("\n")[0]}`);
  }
  await tarayici.close();
}
