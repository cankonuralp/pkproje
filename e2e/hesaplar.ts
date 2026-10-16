/* Uçtan uca testlerin UYDURMA firması ve hesapları — yalnız scripts/e2e-sunucu.ts'in açtığı GEÇİCİ veritabanına yazılır (test bitince silinir).
   Gerçek kişi / firma değildir (CLAUDE.md §7); parola yalnız bu geçici veritabanı içindir, yayında böyle bir hesap yoktur. */
export const E2E_FIRMA = { kisaAd: "deneme", ad: "Deneme Muayene", raporKodu: "DM", baskaKisaAd: "baska" } as const;
export const E2E_PAROLA = "deneme-parola-2026";
export const E2E_HESAPLAR = {
  yonetici: { eposta: "yonetici@deneme.example", ad: "Deneme Yönetici", roller: ["firma_yoneticisi"] },
  denetci: { eposta: "denetci@deneme.example", ad: "Deneme Denetçi", roller: ["denetci"] },
  muhasebe: { eposta: "muhasebe@deneme.example", ad: "Deneme Muhasebe", roller: ["muhasebe"] },
  kilit: { eposta: "kilit@deneme.example", ad: "Deneme Kilit", roller: ["planlama"] },
  /* Onaylar (314): mekanik branş yöneticisi — Hava tankı (mekanik) raporlarını onaylar / geri gönderir */
  mekanik: { eposta: "mekanik@deneme.example", ad: "Deneme Mekanik", roller: ["mekanik_yonetici"] },
} as const;
/* geçici parolayla ilk giriş (durum "ilk"): her proje (genişlik) kendi hesabını değiştirir — testler birbirinin parolasını bozmasın */
export const E2E_ILK = ["masaustu", "tablet", "telefon"].map((p) => ({ eposta: `ilk-${p}@deneme.example`, ad: "Deneme İlk Giriş", roller: ["denetci"] }));
export const E2E_KAPI = 3100;
/* plan aç (309): her firmaya tohumlanan uydurma müşteri ve tesis (scripts/e2e-sunucu.ts); plan içi (310) ayrı tesiste — ekipman ekler, öteki testin
   ekipman sayısını bozmasın; saha raporu (311) üçüncü tesiste — her proje kendi planını açar, rapor plan × ekipman başına tek */
export const E2E_PLAN = { musteri: "Deneme Plan Sanayi A.Ş.", tesis: "Merkez Fabrika", tesisIci: "İç Fabrika", tesisSaha: "Saha Tesisi",
  /* 444: kayıtlı ekipmanı olmayan tesis — Plan aç'ta elle ekipman */
  tesisElle: "Elle Tesisi",
  /* müşteri paneli (319): müşterinin e-postası = ana girişin kullanıcı adı (uydurma) */
  musteriEposta: "plan@deneme-musteri.example" } as const;
/* saha raporu (311): Saha Tesisi'nin ekipmanı (tür HT · Hava tankı, yayında format = hazır şablon KOMPRESOR), türün gerekli ölçüm cihazı türü ve
   denetçinin zimmetindeki, kalibrasyonu geçerli uydurma cihaz */
export const E2E_SAHA = { ekipman: "HT-0201", tur: "Hava tankı", cihazTuru: "Manometre", cihaz: "MN-01", marka: "Deneme", model: "M1", seri: "S-001" } as const;
/* muhasebe (327): ayrı tesis; her projenin tamamlanmış planı (bir imzalı rapor, fiyat listesinden 900,00 TL) ve kaydedeceği fatura numarası */
export const E2E_MUHASEBE = {
  tesis: "Muhasebe Tesisi",
  plan: { masaustu: "P-0125-901", tablet: "P-0125-902", telefon: "P-0125-903" },
  fatura: { masaustu: "DMF2026000000901", tablet: "DMF2026000000902", telefon: "DMF2026000000903" },
} as const;
/* fotoğraftan okuma (351): AYRI uydurma firma (öteki testlerin plan / rapor sayılarına dokunmasın) — yapay zekâ açık, anahtarı uydurma; test sunucusu
   yerel bir Anthropic taklidi açar (PROBATA_YZ_UC), gerçek hizmete istek gitmez. Her proje kendi ekipmanının raporunda okur. */
export const E2E_YZ = {
  firma: { kisaAd: "yzdeneme", ad: "YZ Deneme Muayene", raporKodu: "YZ" },
  yonetici: { eposta: "yonetici@yzdeneme.example", ad: "YZ Yönetici" },
  planlama: { eposta: "planlama@yzdeneme.example", ad: "YZ Planlama" },
  denetci: { eposta: "denetci@yzdeneme.example", ad: "YZ Denetçi" },
  anahtar: "sk-ant-e2e-deneme-anahtar-0001",
  tesis: "YZ Tesisi",
  ekipman: { masaustu: "EP-0301", tablet: "EP-0302", telefon: "EP-0303" } as Record<string, string>,
  /* çevrimdışı (394): genişlik başına AYRI rapor — bağlantı kes / kaydet / gönder / çakışma öteki testlerin raporuna dokunmasın */
  cevrimdisi: { masaustu: "EP-0401", tablet: "EP-0402", telefon: "EP-0403" } as Record<string, string>,
  /* bağlantısız plan kabulü (400): genişlik başına kabul bekleyen plan, kendi müşterisinde (Planlar aramasıyla bulunur); 30 gün sonra başlar —
     önceden indirme sayısına ("1 plan") girmez */
  kabulPlan: { masaustu: "Kabul Deneme Masaüstü A.Ş.", tablet: "Kabul Deneme Tablet A.Ş.", telefon: "Kabul Deneme Telefon A.Ş." } as Record<string, string>,
  /* bağlantısız yeni rapor (405): genişlik başına YZ planında raporu OLMAYAN ekipman — bağlantı kesikken plandan rapor açılır */
  yeniRapor: { masaustu: "EP-0501", tablet: "EP-0502", telefon: "EP-0503" } as Record<string, string>,
  /* S.A.Y Chat (524): genişlik başına YZ planında raporu OLMAYAN ekipman — "Plandan seç" ile kayıt yazılır */
  sayChat: { masaustu: "EP-0601", tablet: "EP-0602", telefon: "EP-0603" } as Record<string, string>,
  /* saklama süresi (387): ayrı tesiste, süresi 10 gün sonra dolacak imzalı rapor (Uyarılar + Firma ayarları › Saklama süresi dolacak raporlar) */
  saklama: { tesis: "YZ Arşiv Tesisi", ekipman: "EP-0950", plan: "P-0121-950", rapor: "YZ-0121-950-00001" },
} as const;
/* 596 TOPLU İMZA / TOPLU ONAY (e2e/toplu-imza.spec.ts): YZ firmasında genişlik başına AYRI denetçi — kendi planında iki rapor, onaya gönderilmiş
   ve elektrik teknik yöneticisince onaylanmış (toplu imza); bir denetçinin iki raporu onayda (toplu onay — yalnız masaüstü, kod aranarak seçilir:
   kuyruk firmanın bütün elektrik raporlarını taşır). Öteki YZ testlerinin hesabına ve planlarına dokunulmaz */
export const E2E_TOPLU = {
  teknik: { eposta: "toplu-teknik@yzdeneme.example", ad: "Toplu Teknik" },
  denetci: {
    masaustu: { eposta: "toplu-masaustu@yzdeneme.example", ad: "Toplu Denetçi Masaüstü" },
    tablet: { eposta: "toplu-tablet@yzdeneme.example", ad: "Toplu Denetçi Tablet" },
    telefon: { eposta: "toplu-telefon@yzdeneme.example", ad: "Toplu Denetçi Telefon" },
  } as Record<string, { eposta: string; ad: string }>,
  ekipman: { masaustu: ["EP-0701", "EP-0702"], tablet: ["EP-0703", "EP-0704"], telefon: ["EP-0705", "EP-0706"] } as Record<string, readonly string[]>,
  onay: { denetci: { eposta: "toplu-onay@yzdeneme.example", ad: "Toplu Onay Denetçi" }, ekipman: ["EP-0711", "EP-0712"] },
} as const;
/* S.A.Y'ın sunucu işlemleri (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a — e2e/say-islem.spec.ts): YZ firmasında AYRI uydurma müşteri /
   tesis, denetçi ve planlamacı — S.A.Y plan açar, müşteri arar. Adlar taklidin kişisel bilgi süzgecine ("YZ …") takılmaz; öteki YZ testlerinin
   hesabına ve planlarına dokunulmaz */
export const E2E_ISLEM = {
  planlama: { eposta: "islem-planlama@islem.example", ad: "İşlem Planlamacı" },
  denetci: { eposta: "islem-denetci@islem.example", ad: "İşlem Denetçi" },
  musteri: "İşlem Deneme Sanayi A.Ş.",
  tesis: "İşlem Tesisi",
} as const;
/* gece işi (378): uçtan uca sunucunun zamanlayıcı sırrı — UYDURMA, yalnız geçici test sunucusunda (yayında Vercel ortam değişkeni CRON_SECRET) */
export const E2E_ZAMANLI_SIR = "e2e-zamanli-is-sirri-uydurma-0000000001";
/* FIRMA-VT FV7 (2026-10-15, FV7 incelemesi — en az yetki): proje sağlığı ucunun AYRI sırrı (duman testi bunu taşır; gece işlerini açmaz) — UYDURMA,
   yalnız geçici test sunucusunda (yayında Vercel ortam değişkeni PROBATA_SAGLIK_SIR) */
export const E2E_SAGLIK_SIR = "e2e-saglik-sirri-uydurma-00000000000001";
/** 432: e-posta sağlayıcısının yerel taklidi (scripts/e2e-sunucu.ts; PROBATA_EPOSTA_UC) — uydurma anahtar, gerçek sağlayıcıya istek gitmez.
    536: anahtar FİRMANIN (Firma ayarları › E-posta; deneme firmasına sır olarak tohumlanır), gönderen alan adı ve Rapor e-postası; hesaplar bu alan adında
    → Kimden = tuşa basan kişi */
export const E2E_EPOSTA = { anahtar: "e2e-eposta-anahtari-uydurma-0001", alan: "deneme.example", genel: "bilgi@deneme.example" };
/* yönetim (348): yönetim adresi ve uydurma yöneticiler (yalnız geçici test veritabanı). Doğrulama anahtarı uydurma Base32; test kodu onunla üretir.
   347–348 incelemesi: üç genişlik tek sunucuda da koşabilsin (yerelde `npm run test:e2e`) — her proje KENDİ "ilk" ve kurulmuş yöneticisini ve kendi
   açacağı firmayı kullanır (E2E_ILK gibi); kurulmuş yönetici de proje başına (aynı zaman adımındaki kod yeniden oynatma sayılmasın). */
const YONETIM_EK = { masaustu: "a", tablet: "b", telefon: "c" } as const;
export const E2E_YONETIM_PROJELER = Object.keys(YONETIM_EK) as (keyof typeof YONETIM_EK)[];
export const E2E_YONETIM = {
  alan: "yonetim.localhost",
  hazirla: "hazirla@probata-yonetim.example",
  anahtar: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP",
  geciciParola: "Gecici-yonetim-2026",
  yeniParola: "yonetim-yeni-parola-2026",
  proje: (p: string) => {
    const ek = YONETIM_EK[p as keyof typeof YONETIM_EK] ?? "x";
    return {
      ilk: `ilk-${p}@probata-yonetim.example`,
      etkin: `etkin-${p}@probata-yonetim.example`,
      firma: { unvan: "Yeni Muayene Deneme Ltd. Şti.", alt: `yenideneme${ek}`, kod: `Y${ek.toUpperCase()}`, yon: "Yeni Deneme Yöneticisi", eposta: `yonetici@yenideneme${ek}.example` },
    };
  },
};
/* FIRMA-VT FV10 (2026-10-16; e2e/yonetim.spec.ts "kendi Supabase projesi"): Supabase Yönetim API'sinin YEREL TAKLİDİ (scripts/e2e-sunucu.ts;
   tests/yardimci/sahte-supabase-yonetim.ts) — anahtar ve örgüt UYDURMA (gerçek anahtar biçiminde değil), gerçek Supabase'e istek gitmez. Proje
   (genişlik) başına panelden kurulan bir firma; proje sağlığı ve gece işi onu da sayar (en çok E2E_KURULUM_EN_COK — e2e/api.spec.ts). */
export const E2E_KURULUM = {
  anahtar: "e2e-supabase-yonetim-uydurma-anahtari-0001",
  orgut: "e2e-uydurma-orgut",
  yz: "sk-ant-uydurmaAnahtarDegil0123456789wxyz",
  firma: (p: string) => {
    const ek = YONETIM_EK[p as keyof typeof YONETIM_EK] ?? "x";
    return { unvan: "Kurulum Muayene Deneme A.Ş.", alt: `kurulum${ek}`, kod: `K${ek.toUpperCase()}`, yon: "Kurulum Deneme Yöneticisi", eposta: `yonetici@kurulum${ek}.example` };
  },
};
export const E2E_KURULUM_EN_COK: number = E2E_YONETIM_PROJELER.length;
/* FIRMA-VT FV11 (2026-10-16; e2e/yonetim.spec.ts "e-posta gönderimi"): proje (genişlik) başına Yönetim'den açılan ortak firma ve gönderen alan adı —
   Resend Yönetim API'sinin yerel taklidi (scripts/e2e-sunucu.ts); alan adları .example (uydurma) */
export const E2E_GONDERIM = {
  firma: (p: string) => {
    const ek = YONETIM_EK[p as keyof typeof YONETIM_EK] ?? "x";
    return { unvan: "Gönderim Muayene Deneme A.Ş.", alt: `gonderim${ek}`, kod: `G${ek.toUpperCase()}`, yon: "Gönderim Deneme Yöneticisi", eposta: `yonetici@gonderim${ek}.example`,
      alan: `gonderim${ek}.example` };
  },
};
/* görsel karşılaştırma (411): AYRI uydurma firma — referans ekranın (Planlar + plan içi; CLAUDE.md §6, src/styles/kalip.ts) görüntüsü her koşuda
   aynı çıksın diye SABİT numara, tarih ve içerikle (bugünden bağımsız); başka test bu firmaya dokunmaz */
export const E2E_GORSEL = {
  firma: { kisaAd: "gorsel", ad: "Görsel Deneme Muayene", raporKodu: "GR" },
  yonetici: { eposta: "yonetici@gorsel.example", ad: "Görsel Yönetici" },
  denetci: "Görsel Denetçi",
  musteri: "Görsel Deneme Sanayi A.Ş.", tesis: "Görsel Tesisi",
  plan: "P-0126-501",
} as const;
/* FIRMA-VT FV3 (2026-10-15; e2e/firma-vt.spec.ts): KENDİ VERİTABANLI uydurma firma — verisi uçtan uca kümesinde AYRI bir veritabanında (vt), merkezde
   (ortak veritabanı) yalnız kaydı + şifreli bağlantısı + kurulumu tamam (scripts/e2e-sunucu.ts). Merkezde bu firmanın kimliğiyle bir TUZAK müşteri
   durur: istek yanlışlıkla merkeze gitse ekranda görünürdü (son kapı vt_firma_dogrula onu da reddeder). Gece işi bu firmayı KENDİ veritabanında
   dolaşır (FV6, 2026-10-16: e2e/api.spec.ts "gece işi" — KENDI_VT_FIRMA_SAYISI kadar fazla firma); dosyaları kendi Storage taklidinde (FV5);
   yönetim panelinde özeti ve yapay zekâ anahtarı firmanın veritabanında (FV9: e2e/yonetim.spec.ts). */
export const E2E_KENDI = {
  firma: { kisaAd: "kendivt", ad: "Kendi VT Muayene", raporKodu: "KV" },
  vt: "probata_kendivt",
  yonetici: { eposta: "yonetici@kendivt.example", ad: "Kendi VT Yönetici" },
  musteri: "Kendi VT Müşterisi A.Ş.",
  tuzak: "Merkez Tuzak Müşterisi A.Ş.",
} as const;
/** uçtan uca sunucusunun tohumladığı kendi veritabanlı firmalar — scripts/e2e-sunucu.ts BU listeyi dolaşır; sayı listeden türer (elle tutulan sabit
    kayabilirdi — 2026-10-15, FV3 incelemesi) */
export const E2E_KENDI_FIRMALAR = [E2E_KENDI] as const;
export const KENDI_VT_FIRMA_SAYISI: number = E2E_KENDI_FIRMALAR.length;
