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
**probata** — periyodik kontrol (iş ekipmanı muayene) firmaları için çok kiracılı web uygulaması. Görsel kimlik
(logo, marka renkleri, Sora, açık + koyu tema): `pkproje.md` §8.12 ve `probata-logo/`. Tam akış:
**teklif → kabul → sözleşmeler (firmalar arası + İSG-KATİP) → plan açıldı → inspector'ın "Planlar" ekranına
düştü → kabul/red → plan günü denetim → rapor taslak → branş yöneticisi onayında → onaylandı/geri gönderildi →
inspector son imza → müşteriye açıldı → fatura → tahsilat → iş kapandı → arşiv.**
**Modül haritası ve modüller arası bağlantı kuralları: `pkproje.md` §3.1–3.2.** Ayrıntı, mevzuat, kararlar:
`pkproje.md`.
**Durum (2026-09-23): İSKELET KURULDU** (reisim: *"tüm önerilerin uygun kodlamaya başla ilk yayını yap"*). Kabuk
(17 modüllü yan menü, tema), kiracı izolasyonlu veri katmanı (gömülü PostgreSQL + RLS), kilit testleri, CI ve Pages
önizlemesi var; modül ekranları YOK — faz 1 sırasıyla (pkproje.md §3.3), her biri önce maket + onay. Referans ekran
(Planlar + plan içi) dondu: `src/styles/kalip.ts`.
**Toplu maket çalışması (2026-09-24, reisim: *"tüm maketleri sırayla bulutta yapılsın en son hepsine toplu bakar ona göre
ilerleriz"*):** faz 1 + faz 2'nin bütün maketleri sırayla, tek bulut oturumunda; reisim en sonda toplu bakar. ⛔ Talimat ve
durum **`MAKET-PLANI.md`** — bu çalışma sürerken oturum başında o da TAM okunur. Maketler onaylanana kadar kod yok.
**2026-09-24 bitti:** 16 maket + toplu bakış (`docs/toplu-bakis.html`; 127 soru, 32–158). **2026-09-25 reisim:** sorular toplu
cevaplanmaz → modüller benim önerdiğim sırayla tek tek; her modülde o modülün soruları YENİDEN sorulur; çakışan / gereksiz
modüller sırası gelince silinir, şimdi değil (MAKET-PLANI.md Durum).

## 2 · Yığın (pkproje.md §8 — **reisim 2026-09-22'de onayladı**)
- **TypeScript + Next.js (App Router), standalone çıktı — onaylı 2026-09-22** (SvelteKit düştü). Tarayıcı
  uygulaması; masaüstü ofis, sahada tablet/telefon = aynı uygulama, ayrı tasarım; PWA + çevrimdışı kuyruk
  sonraki fazda, şema ilk günden buna göre.
- **Modüler mimari — onaylı (pkproje.md §8.11):** her iş modülü `src/modules/<modül>/` içinde; modül başka
  modülün tablosuna doğrudan dokunmaz, o modülün dışa açtığı fonksiyonları kullanır; ortak çekirdek
  `src/server/`; sayfalar iş mantığı taşımaz. ⛔ Tek dosya derleme ve tek küresel ad alanı YOK.
- **Barındırma — onaylı (§8.8):** gerçek uygulama Türkiye'de sunucuda, her firma kendi alt alan adında
  (`*.<ürün>.com.tr`), joker SSL; veri yurt dışına çıkmaz.
- **Arka plan işleri — onaylı (§8.9):** PostgreSQL üstünde iş kuyruğu (pg-boss); ayrı servis yok.
- **Sigorta okuma — onaylı (§8.10):** pano fotoğrafından okuma görsel yapay zekâ ile; değer **öneri** olarak
  düşer, inspector onaylamadan kaydedilmez.
- **Rapor şablonları — onaylı (§8.3):** firma × ekipman türü başına **kodda**; site içi düzenleyici yok.
- **PostgreSQL**: yerelde projeyle gelen **gömülü sürüm** (npm paketi, kurulum yok, veri `data/` altında);
  yayında yönetilen PostgreSQL. Satır seviyesi kiracı izolasyonu veritabanında; her sorgu kiracı süzgeçli tek veri
  erişim katmanından geçer (anayasa 7, 07-YETKI §1).
- **Dosyalar**: yerelde `data/depo/`, yayında S3 uyumlu depo; tek adaptör, iki ayar. Kalıcı herkese açık bağlantı
  ÜRETİLMEZ (anayasa 5.1'in karşılığı: kısa ömürlü, yetkili indirme).
- **Kimlik/giriş** bizim kodumuzda (firma kullanıcıları + müşteri hesapları e-posta ile); kiracı = alt alan adı.
- **PDF** sunucuda üretilir; şablon firma künyesi + form kodu + bölüm iskeleti taşır (`pkproje.md` §4.2, §4.8).
- **Test**: Node 24 yerleşik koşucu `node --test` (TypeScript'i doğrudan koşar). Tarayıcı uçtan uca: Playwright
  (ilk ekranlar çıkınca). Docker YOK, Supabase YOK (2026-09-18 kararı).

## 3 · Dizin haritası (iskelet 2026-09-23; ★ = henüz boş, modüllerle dolar)
```
pkproje/
  CLAUDE.md                 bu dosya
  pkproje.md                alan bilgisi · kurgu · kararlar · açık sorular
  MAKET-PLANI.md            toplu maket çalışmasının talimatı ve durumu (2026-09-24; bulut oturumu için)
  ANAYASA.md · TASARIM-KALIBI.md · 00–08-*.md · EKSIKLER-VE-ONERILER.md
                            kural dosyaları (ANAYASA/KALIP'a madde yalnız reisim onayıyla eklenir)
  src/app/                  sayfalar (iş mantığı YOK): Planlar ana sayfa + modül başına bir rota klasörü (kayıtla birebir)
  src/modules/moduller.ts   MODÜL KAYDI — yan menünün ve rotaların tek kaynağı (17 modül, 6 grup, onaylı maketle aynı)
  src/modules/<modül>/      ★ her iş modülü: server/ (veri erişimi + iş kuralları, dışa açılan fonksiyonlar) · ui/ · şema · testler
  src/server/db/            gömülü PostgreSQL (gomulu.ts) · göç koşucusu (goc.ts, gocler/NNNN_ad.sql, her göç idempotent) ·
                            kiracı süzgeçli TEK erişim katmanı (kiraci.ts: kiraciIcinde) — pg YALNIZ burada içe aktarılır
  src/server/kiraci/        kiracı çözümleme (alt alan adı → firma kısa adı) · ★ yetki (tek `canDo`) · ★ güvenli yazıcılar
  src/components/           TEK ÜRETİCİLER: kabuk (yan menü + üst çubuk) · ikon · boş durum · ★ liste (tablo↔kart) ·
                            ★ süzgeç satırı · ★ seçim alanı · ★ uzun tuş
  src/styles/               tokens.css (TEK KAYNAK; docs kopyası testle aynı) · yazi.css (Sora) · temel.css · kalip.ts
  public/vendor/            üçüncü parti kendi kökenimizden, adında sürüm (lucide-1.47.0 ikonları)
  scripts/                  next.ts (telemetri kapalı + webpack) · gelistir.ts (npm run dev) · onizleme.ts + onizleme-sun.ts
  tests/                    `*.test.ts` kilit testleri (başında "NEREDEN GELDİ"); yardimci/denetimler.ts saf denetim işlevleri
  tests/bozan/              olumsuz kanıt (`*.bozan.ts`; kaynağı diskte DEĞİŞTİRMEDEN bellekte bozar)
  tools/                    salt okunur araçlar: palet-olc.mjs · sunum-uret.mjs · olc-maket.js · olc-uygulama.js ·
                            bulut-hazirla.sh (yalnız bulut VM'i: Node 24 + başsız Chrome + npm ci) · olc-bulut.mjs (başsız
                            ölçüm + etkileşim + olumsuz kanıt, 2026-09-24) · ikon-ekle.mjs (Lucide 1.47.0 → iki ikon kopyası)
  .github/workflows/ci.yml  her push: tip · lint · test · olumsuz kanıt · derleme; main'de Pages önizlemesi
  docs/                     maket + sunum (Pages sitesinin kökü); maketlerin ortak kabuğu assets/maket-ortak.js, ortak uydurma
                            veri assets/maket-veri.js, ölçüm sonuçları assets/olcum/<maket>.json (2026-09-24)
  data/                     yerel veritabanı + dosya deposu (git dışı)
```

## 4 · Komutlar
**Uygulama (iskelet, 2026-09-23 — hepsi çalışıyor):**
```bash
npm install              # gömülü PostgreSQL ikilileri burada iner; başka kurulum yok
npm run dev              # gömülü PostgreSQL (127.0.0.1:54320, data/pg) + Next → http://127.0.0.1:3000
npm test                 # node --test; çıktıda "fail 0" yoksa zincir DURUR (gerçek PostgreSQL testi dahil)
npm run test:negatif     # tests/bozan/ — her kilit gerçekten yakalıyor mu (N/N)
npm run check            # next typegen + tsc (tip denetimi)
npm run lint             # eslint (Next + TypeScript kuralları)
npm run build            # ÖNCE test; düşerse derleme yok (standalone çıktı)
npm run build:onizleme   # ÖNCE test; Pages sitesi site/ (kök: docs, /uygulama/: uygulamanın statik önizlemesi)
npm run onizle           # site/'yi Pages'teki gibi /pkproje/ altında sunar → http://127.0.0.1:8780/pkproje/uygulama/
```
⛔ Next'i çıplak `next` ile değil `scripts/next.ts` üzerinden çalıştır: telemetri kapalı (anayasa 5.2) ve **webpack** —
reisim'in Windows'unda Uygulama Denetimi Next'in yerel derleyicisini engelliyor, Turbopack çalışmıyor (2026-09-23).
Yerelde önizleme (`.claude/launch.json`): "uygulama" (npm run dev) · "onizleme" (site/) · "maket" (docs/).
Uygulama ölçümü: `tools/olc-uygulama.js` tarayıcıda koşar, salt okunur.

**Maket ve sunum:**
```bash
node tools/palet-olc.mjs
```
```bash
node tools/sunum-uret.mjs
```
İlki `src/styles/tokens.css`'teki (tek kaynak) gerçek renklerle bütün çiftlerin (şu an 62) WCAG kontrastını ölçer; aynı
ölçüm `tests/kontrast.test.ts` kilidinde. İkincisi sunumu tokens + `docs/assets/olcum.json`'dan üretir; sunum elle
düzenlenmez. Maket ölçümü: `tools/olc-maket.js`.

## 5 · Teslim zinciri (anayasa 0.3'ün bu projedeki hâli)
`npm test` (fail 0) → `npm run check` + `npm run lint` → `npm run build` → `npm run dev` ile **localde aç ve
GÖZLE doğrula** (masaüstü 1920 · tablet 1080 · telefon 375; açık + koyu tema; kendi tarayıcı bölmemde, ölçerek)
→ `git diff --stat` + her parçayı **oku** (13.5) → commit (mesaj: ne istendi · ne değişti · **nerede/nasıl
doğrulandı**; ölçülemeyen "ölçemedim") → **kanıt özeti** ("ne baktım · nerede · ne gördüm"; ilk iki satır UYUM ve
ETKİ ALANI). Bir teslimde **BİR kalem**. Reisim'e test ödevi verilmez.
CI aynı zinciri her push'ta koşar (`.github/workflows/ci.yml`); main'de denetim geçmeden Pages'e yayın olmaz.
**Askıda (gerçek sunucuya çıkınca açılır):** canlı veriye elle dokunma (anayasa 6) · gerçek cihaz teyidi (11.2) ·
üretim doğrulaması. **Açık:** `git push` (her teslim push ile biter, 0.3) · GitHub Pages önizlemesi (bkz. §8).

## 6 · Kalıp ve kilitler (bu projede)
- **Referans ekran DONDU (2026-09-23): Planlar + plan içi** (maket 5. tur). Sayılar `src/styles/kalip.ts`'te
  (denetim 34/44 · bantlar 768/1280 · kart eşiği 960 · sayfa ekipman 10 / rapor 20 · yazı ölçeği · kabuk 232/52 ·
  daraltılmış yan menü 64, yalnız geniş bant — 2026-09-24),
  kilidi `tests/kalip-sayilari.test.ts` (değişkenler + kabuk + onaylı maket). Kabul/ret örneği dosyada. Kaynak
  projenin sayıları kopyalanmadı.
- ⛔ **ANAYASA ve KALIP = site yapma yöntemimiz** (reisim 2026-09-22: *"anayasada siteye ait kararlar değil
  bizim site yapma yöntemlerimiz ile alakalı şeyler olmalı"*). Ürün/site kararı (rapor akışı, imza, arşiv,
  ekran içeriği) oraya yazılmaz; yeri `pkproje.md`. Kalıba yeni madde yalnız **yöntem** ise ve reisim onayıyla
  girer (kalıp 16).
- Görsel iş: **önce maket (masaüstü + mobil AYRI), onay, sonra kod**; palet ve token'lar kurulduktan sonra
  dokunulmaz; kullanılan her `var(--x)` tanımlı mı testi ilk günden.
- **Kurulu kilitler (iskelet):** tip denetimi · lint · `fail 0` kapısı (betik + CI) · olumsuz kanıt (`tests/bozan/`,
  her kilide bir bozan) · CSS parantez / tanımsız değişken / çift seçici (cırcır) / değişken ezmesi · çift id · değişken
  tek kaynağı (src ↔ docs) · kalıp sayıları (kabuk eşikleri yalnız kalıp bantları; daraltma yalnız geniş bantta, uygulama +
  maket) · ikonlar · menü = onaylı maket · rota = modül kaydı · kontrast (62 çift) ·
  kiracı süzgeci (pg yalnız src/server/db; her kiracı tablosunda ENABLE + FORCE RLS + politika) · kiracı izolasyonu
  GERÇEK PostgreSQL'de (iki firma, WITH CHECK, uygulama rolü süper kullanıcı değil, göç idempotent).
- Sonra: Playwright + erişilebilirlik (ilk ekranlar) · görsel regresyon (referans ekran) · hata alarmı (yayında;
  kayıt yapısı ilk günden).

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
  başına alt alan adı vermez → gerçek uygulama **Türkiye'de sunucuda** (pkproje.md §8.8).
- **Yayın (2026-09-23, iskelet): GitHub Pages GitHub Actions'tan** yayınlar (reisim: *"ilk yayını yap"* → Pages önizlemesi):
  sitenin kökü `docs/` (maket + sunum, adresler aynı), `…/uygulama/` uygulamanın statik önizlemesi (sunucu, veritabanı,
  giriş orada ÇALIŞMAZ). Önceki düzen (main `/docs` doğrudan) kalktı. https://cankonuralp.github.io/pkproje/
  (görsel sistem) · `…/plan-ici.html` (plan içi ve yan menü sunumu) · `…/maket/planlarim.html` (maket; `#/plan/<id>` plan içi,
  `#/plan/<id>/ekle` ekipman ekle) · `…/toplu-bakis.html` (16 maketin toplu bakışı, 2026-09-24). Üç sunum `tools/sunum-uret.mjs` ile
  üretilir, elle düzenlenmez (toplu bakış metni pkproje.md §3.6'dan, sayıları `docs/assets/olcum/`'dan okur). Sayfalar `noindex`; veri uydurma. İş akışı
  `.github/workflows/ci.yml` (Eksikler §1): her push'ta denetim; main'de denetim geçerse önizleme kurulur ve yayınlanır.
- OneDrive: reisim'de kapalı, klasör adı Windows 10'dan kalma; dosyalar yerelde. Yedek = GitHub.
