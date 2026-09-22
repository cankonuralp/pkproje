# CLAUDE.md — pkproje (periyodik kontrol uygulaması)

> Bu dosya yalnız **bu projeye özgü** olanı taşır. Çalışma anayasası kopyalanmaz, referans verilir:
> `ANAYASA.md` (14 bölüm, aynen bağlayıcı — **site yapma yöntemimizdir**; ürüne/siteye ait kararlar buraya
> yazılmaz, onların yeri `pkproje.md`) · `TASARIM-KALIBI.md` (19 kural; yöntem bağlayıcı, sayılar bu projenin
> kendi ölçümüyle belirlenecek) · `00–08-*.md`
> (kuralların kod kanıtı, "Yeni projeye uyarlama" satırları) · `EKSIKLER-VE-ONERILER.md` (ilk günden kurulacaklar)
> · `AKTARIM-NOTU.md` ve `YENI-PROJE-PROMPTU.md` (aktarımın kendi kaydı, tarihsel).
> Alan bilgisi ve ürün kurgusu: `pkproje.md`. **Aktarım 2026-09-22'de tamamlandı, klasör kaldırıldı** (reisim:
> *"aktardık ve bitti"*) — dosyalar artık proje kökünde, bu projenin kendi kuralları.

## 0 · Her oturumun başında (anayasa 0.1 + 0.13)
1. Şu üç dosyayı `cat` ile **TAM** oku, önizleme okumak = okumamak: `ANAYASA.md` ·
   `TASARIM-KALIBI.md` · `pkproje.md`.
2. Türkçe konuş, "reisim" de (anayasa 0.2). Kalem açarken **uyum beyanı** (0.12), teslimde **kanıt özeti** (0.4).
3. Kalıcı hafızadaki `pkproje-durum` notunu güncel tut; `pkproje.md`'ye giren her bilgi yerinde düzenlenir (12.1).

## 1 · Ne yapıyoruz
Periyodik kontrol (iş ekipmanı muayene) firmaları için çok kiracılı web uygulaması. Akış: **planlama →
sahada tablet (ekipman → rapor → kontrol listesi → uygunluk → fotoğraf) → teknik yönetici onayı → e-imza →
müşteri portalı** (müşteri yalnız kendi raporlarını görür/indirir). Ayrıntı, mevzuat, kararlar: `pkproje.md`.
**Durum (2026-09-22): kurgu aşaması, kod YOK.** Reisim: *"tam kurgu bitmeden tek satır kod yazma"*,
*"şu an iskelet oluşturmalıyız"* → ilk kod kalemi = proje iskeleti; reisim'in onayıyla açılır.

## 2 · Yığın (pkproje.md §8; reisim onayı bekliyor)
- **TypeScript + SvelteKit** (tarayıcı uygulaması; masaüstü ofis, sahada tablet/telefon = aynı uygulama, ayrı
  tasarım; PWA + çevrimdışı kuyruk sonraki fazda, şema ilk günden buna göre).
- **PostgreSQL**: yerelde projeyle gelen **gömülü sürüm** (npm paketi, kurulum yok, veri `data/` altında);
  yayında yönetilen PostgreSQL. Satır seviyesi kiracı izolasyonu veritabanında; her sorgu kiracı süzgeçli tek veri
  erişim katmanından geçer (anayasa 7, 07-YETKI §1).
- **Dosyalar**: yerelde `data/depo/`, yayında S3 uyumlu depo; tek adaptör, iki ayar. Kalıcı herkese açık bağlantı
  ÜRETİLMEZ (anayasa 5.1'in karşılığı: kısa ömürlü, yetkili indirme).
- **Kimlik/giriş** bizim kodumuzda (firma kullanıcıları + müşteri hesapları e-posta ile); kiracı = alt alan adı.
- **PDF** sunucuda üretilir; şablon firma künyesi + form kodu + bölüm iskeleti taşır (`pkproje.md`).
- **Test**: Node 24 yerleşik koşucu `node --test` (TypeScript'i doğrudan koşar). Tarayıcı uçtan uca: Playwright
  (ilk ekranlar çıkınca). Docker YOK, Supabase YOK (2026-09-18 kararı).

## 3 · Dizin haritası (PLANLANAN — iskelet kalemi onaylanınca kurulur)
```
pkproje/
  CLAUDE.md                 bu dosya
  pkproje.md                alan bilgisi · kurgu · kararlar · açık sorular
  ANAYASA.md · TASARIM-KALIBI.md · 00–08-*.md · EKSIKLER-VE-ONERILER.md
                            kural dosyaları (ANAYASA/KALIP'a madde yalnız reisim onayıyla eklenir)
  src/lib/server/db/        şema + göçler (her göç idempotent, 05-VERI §5)
  src/lib/server/           veri erişimi (kiracı süzgeci zorunlu) · yetki (tek `canDo`) · güvenli yazıcılar (`…Safe`)
  src/lib/components/       TEK ÜRETİCİLER: liste (tablo↔kart), süzgeç satırı, seçim alanı, uzun tuş, boş durum
  src/lib/styles/           token'lar (`:root` + koyu tema + `color-scheme`), adlandırılmış 2–3 eşik
  src/routes/               ekranlar: firma paneli · saha · müşteri portalı
  static/vendor/            üçüncü parti kütüphaneler kendi kökenimizden, dosya adında sürüm
  tests/                    `*.test.ts` kilit testleri (başında "NEREDEN GELDİ")
  tests/bozan/              olumsuz kanıt betikleri (kaynağı diskte DEĞİŞTİRMEDEN bellekte bozar)
  tools/                    salt okunur denetim betikleri (öksüz dosya, bütünlük)
  data/                     yerel veritabanı + dosya deposu (git dışı)
```

## 4 · Komutlar (PLANLANAN; iskelet kurulunca gerçek hâli buraya yazılır)
```bash
npm install          # gömülü PostgreSQL ikilileri burada iner; başka kurulum yok
npm run dev          # localde çalıştır → http://localhost:5173
npm test             # node --test; çıktıda "fail 0" yoksa zincir DURUR
npm run test:negatif # tests/bozan/ — her kilit gerçekten yakalıyor mu (N/N)
npm run check        # tip denetimi
npm run lint         # statik çözümleme
npm run build        # ÖNCE test koşar; test düşerse derleme yapmaz (mekanik kapı)
```

## 5 · Teslim zinciri (anayasa 0.3'ün bu projedeki hâli)
`npm test` (fail 0) → `npm run check` + `npm run lint` → `npm run build` → `npm run dev` ile **localde aç ve
GÖZLE doğrula** (masaüstü 1920 · tablet 1080 · telefon 375; açık + koyu tema; kendi tarayıcı bölmemde, ölçerek)
→ `git diff --stat` + her parçayı **oku** (13.5) → commit (mesaj: ne istendi · ne değişti · **nerede/nasıl
doğrulandı**; ölçülemeyen "ölçemedim") → **kanıt özeti** ("ne baktım · nerede · ne gördüm"; ilk iki satır UYUM ve
ETKİ ALANI). Bir teslimde **BİR kalem**. Reisim'e test ödevi verilmez.
**Askıda (yayına çıkınca açılır):** canlı veriye elle dokunma (anayasa 6) · gerçek cihaz teyidi (11.2) · canlı
(üretim) doğrulaması. **Açık:** `git push` (uzak depo bağlanınca her teslim push ile biter, 0.3) · GitHub Pages
önizleme yayını (bkz. §8).

## 8 · Git ve GitHub (reisim 2026-09-22: "önce git kurulumlarını, GitHub bağlantılarını kurgulayıp tamamlayalım")
- Uzak depo: **https://github.com/cankonuralp/pkproje — HERKESE AÇIK (public)**. Reisim kararı: ücretsiz planda
  GitHub Pages yalnız açık depoda çalışıyor, Pro yok. ⛔⛔ **Bu depoya giren her satırı dünya okur.** Her teslimde,
  commit'ten ÖNCE eklenen dosyalar gerçek veri taraması yapılır: firma/müşteri/tesis/kişi adı · e-posta · telefon ·
  SGK, EKİPNET, sözleşme numarası · gerçek rapor içeriği · anahtar/parola/jeton. Şüpheli tek satır varsa commit
  yapılmaz, reisim'e sorulur (anayasa 5.8 + 10.3, bu depoda sertleşti).
- Sırlar koda YAZILMAZ: `.env` (git dışı) + yayında ortam değişkeni; `.env.example` yalnız boş alan adlarını taşır.
- Yerel depo: `main` dalı; çalışma dalı `kalem/<konu>`; her teslim `main`'e fast-forward + iki dalı da push.
  ⛔ **Her iş bittiğinde: yerel commit + `git push`** (reisim 2026-09-22: *"her işten sonra github yayınlaması
  yapacağız ve yerel kayıt olacak"*) → anayasa 0.3 push kuralı bu projede AÇIK.
- Satır sonu: ağaç **LF** (`.gitattributes` `* text=auto eol=lf`, `core.autocrlf=false`; sistem ayarı `true`);
  `git checkout --` / `git restore` sonrası `git ls-files --eol` ile `w/lf` doğrulanır (anayasa 13.11).
- Commit mesajı: ne istendi (reisim'in sözü) · ne değişti · nerede/nasıl doğrulandı; sonunda o oturumda çalışan
  modelin `Co-Authored-By:` satırı. Bir commit = bir kalem.
- `data/`, `.env*`, `node_modules/`, derleme çıktıları depoya girmez (`.gitignore`). Gerçek veri hiçbir zaman.
- **Kural dosyaları artık kökte ve depoda** (2026-09-22, reisim kararı): `AKTARIM-KITI/` klasörü kaldırıldı.
  Yayımlamadan önce önceki ürünün **alan adı ve gerçek müşteri adı** metinden çıkarıldı; kuralların gerekçeleri,
  tarihleri ve olayları olduğu gibi duruyor. Bu dosyalara bir daha gerçek ad yazılmaz.
- **GitHub Pages = statik ÖNİZLEME ortamı** (maket, prototip ekran, örnek veriyle kontrol): reisim buradan bakar,
  ben tarayıcı bölmemde ölçerim. Pages **sunucu tarafını çalıştıramaz** (veritabanı, giriş, PDF üretimi) ve kiracı
  başına alt alan adı vermez → gerçek uygulamanın barındırması ayrı karar (pkproje.md §8.8).
- Yayın: GitHub Actions iş akışı `main`'e her push'ta test + derleme koşar, statik çıktıyı Pages'e yayınlar
  (Eksikler §1 CI ile aynı iş akışı). Yayınlanacak bir çıktı doğduğunda kurulur (iskelet kalemi).
- OneDrive: reisim'de kapalı, klasör adı Windows 10'dan kalma; dosyalar yerelde. Yedek = GitHub.

## 6 · Kalıp ve kilitler (bu projede)
- Referans ekran henüz YOK. İlk onaylanan gerçek ekran ölçülür, sayılar `TASARIM-KALIBI.md` yöntemiyle
  `tests/tasarim-kalibi.test.ts` içine kabul/ret örneğiyle yazılır. O güne kadar kaynak projenin sayıları
  **kopyalanmaz**.
- ⛔ **ANAYASA ve KALIP = site yapma yöntemimiz** (reisim 2026-09-22: *"anayasada siteye ait kararlar değil
  bizim site yapma yöntemlerimiz ile alakalı şeyler olmalı"*). Ürün/site kararı (rapor akışı, imza, arşiv,
  ekran içeriği) oraya yazılmaz; yeri `pkproje.md`. Kalıba yeni madde yalnız **yöntem** ise ve reisim onayıyla
  girer (kalıp 16).
- Görsel iş: **önce maket (masaüstü + mobil AYRI), onay, sonra kod**; palet ve token'lar kurulduktan sonra
  dokunulmaz; kullanılan her `var(--x)` tanımlı mı testi ilk günden.
- İlk gün kurulacak kilitler: tip denetimi · lint · `fail 0` kapısı · olumsuz kanıt betikleri · CSS değişken
  bütünlüğü · aynı id/seçici taraması · kiracı süzgeci testi (her sorgu kiracı kimliği taşır).
- Sonra: CI (uzak depo kurulunca) · Playwright + erişilebilirlik (ilk ekranlar) · görsel regresyon (referans
  ekran) · hata alarmı (yayında; kayıt yapısı ilk günden).

## 7 · ASLA (bu projeye özgü; anayasadaki yasaklar ayrıca geçerli)
- Kurgu bitmeden ve reisim "başla" demeden **kod yazma**; kapsam dışı işi yapma, `pkproje.md`'ye not et.
- Reisim sormadan **ajan / Workflow / paralel iş açma** — önce kendi okuman ve araman.
- **Gerçek müşteri, firma, kişi, rapor verisi** depoya, `pkproje.md`'ye, sohbete, makete girmez (başka bir
  uygulamada görülenler dahil). Örnek veri uydurmadır.
- Reisim'in kullandığı başka uygulamalarda **kayıt oluşturma / değiştirme / silme**; yalnız okuma, izinle indirme.
- Emsal uygulama çözümlemesini depoya koyma — `yerel/` altında kalır (reisim 2026-09-22).
- Deploy, `git push`, canlı veri, dış CDN, kalıcı herkese açık dosya bağlantısı, kök seviyesinde geniş izin.
- Kiracı süzgeçsiz sorgu; "bellekteki her şeyi yaz" kaydetme; sessizce yutulan yazma hatası.
- Reisim demeden bildirim kurma (anayasa 1.3); palet değiştirme/önerme (2.4); emoji ikon (2.5).
- Otomatik silme: yalnız reisim'in verdiği **5 yıl arşiv** kuralı (pkproje.md §3), o da geri alınabilir pencereyle.
- Testi susturma/gevşetme; kırılan test tarih + gerekçeyle güncellenir.
- "Kapandı" demeden kalem kalem sayım (0.10); ölçmeden "bitti" (11.7–11.8); tahmin yazma, "ölçemedim" yaz.
