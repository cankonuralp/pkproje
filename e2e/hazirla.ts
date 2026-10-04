/* UÇTAN UCA HAZIRLIK (2026-10-03, reisim: "Run failed" — 28e4689'da CI'daki uçtan uca adımı düştü, aynı commit main'de geçti; yerelde 177/177).
   Testler Next geliştirme sunucusunda koşar; sayfa ilk istekte derlenir. Yavaş CI makinesinde ilk derleme ilk testin 5 sn'lik beklemesini
   aşabiliyordu. Testlerden önce her sayfa bir kez istenir ve derlenir (bekleme yalnız burada, uzun); testlerin süreleri değişmez.
   2026-10-04 (K1): istek firma adresine (Host) gider — Node *.localhost'u çözemeyebilir, bu yüzden 127.0.0.1 + Host başlığı. Oturumsuz
   istek girişe yönlenir; giriş ve vitrin derlenir, uygulama sayfaları ilk girişte derlenir. */
import { chromium, request, type FullConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import { MODULLER } from "../src/modules/moduller";
import { E2E_FIRMA, E2E_HESAPLAR, E2E_KAPI, E2E_PAROLA } from "./hesaplar";

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
  await ac("/dokumanlar/kriterler");
  await ac("/dokumanlar/diger");
  await ac("/dokumanlar/egitimler");
  await ac("/dokumanlar/egitimler/turler");
  if (kart) { await ac(kart); await ac(`${kart}/duzenle`); }
  /* 2026-10-04: kaydı test sırasında açılan ayrıntı sayfaları da önceden derlensin (olmayan kimlik "bulunamadı" çizer, rota yine derlenir) —
     ana dalda e2e/musteriler.spec kaydet sonrası /musteriler/<id> soğuk derlemede 5 sn'yi aştı (CI 321ce19, 94ec1ea). */
  const YOK = "00000000-0000-4000-8000-000000000000";
  for (const y of [`/musteriler/${YOK}`, `/musteriler/tesis/${YOK}`, `/ekipman-turleri/${YOK}`, `/ekipman-turleri/${YOK}/sablon/${YOK}`, `/olcum-cihazlari/${YOK}`, `/araclar/${YOK}`,
    `/sozlesmeler/${YOK}`, `/dokumanlar/standart/${YOK}`, "/dokumanlar/kriterler/ZPKK01", `/zimmetler/varlik/d/${YOK}`]) await ac(y);
  await ac("/giris/parola");
  await tarayici.close();
}
