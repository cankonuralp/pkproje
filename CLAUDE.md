# CLAUDE.md — pkproje (periyodik kontrol uygulaması)

> Bu dosya yalnız **bu projeye özgü** olanı taşır. Çalışma anayasası kopyalanmaz, referans verilir:
> `ANAYASA.md` (14 bölüm, aynen bağlayıcı — **site yapma yöntemimizdir**; ürüne/siteye ait kararlar buraya
> yazılmaz, onların yeri `pkproje.md`) · `TASARIM-KALIBI.md` (19 kural; yöntem bağlayıcı, sayılar bu projenin
> kendi ölçümüyle belirlenecek) · `00–08-*.md` · **`09-SUNUCU-VE-VERI.md`** (bu projenin sunucu ve veri tasarrufu kuralları, onaylı
> 2026-09-29; 00–08 ile çelişirse o geçerli)
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
(yan menü, tema), kiracı izolasyonlu veri katmanı (gömülü PostgreSQL + RLS), kilit testleri, CI ve Pages
önizlemesi var; modül ekranları YOK — faz 1 sırasıyla (pkproje.md §3.3), her biri önce maket + onay. Referans ekran
(Planlar + plan içi) dondu: `src/styles/kalip.ts`.
**Toplu maket çalışması (2026-09-24, reisim: *"tüm maketleri sırayla bulutta yapılsın en son hepsine toplu bakar ona göre
ilerleriz"*):** faz 1 + faz 2'nin bütün maketleri sırayla, tek bulut oturumunda; reisim en sonda toplu bakar. ⛔ Talimat ve
durum **`MAKET-PLANI.md`** — bu çalışma sürerken oturum başında o da TAM okunur. Maketler onaylanana kadar kod yok.
**2026-09-24 bitti:** 16 maket + toplu bakış (`docs/toplu-bakis.html`; 127 soru, 32–158). **2026-09-25 reisim:** sorular toplu
cevaplanmaz → modüller benim önerdiğim sırayla tek tek; her modülde o modülün soruları YENİDEN sorulur; çakışan / gereksiz
modüller sırası gelince silinir, şimdi değil (MAKET-PLANI.md Durum). **M1 onaylandı (2026-09-25, reisim: *"Onaylıyorum"*)**; **M2 onaylandı
(2026-09-26)**; **M3 onaylandı (2026-09-26)** (Ekipmanlar modülü kalktı, ekipmanlar planın içinde; tür başına firmanın rapor formatı PDF'i); **M4 onaylandı (2026-09-26)**; **M5 Sözleşmeler onaylandı (2026-09-26)** (M13 ile birleşti;
İSG-KATİP ID'leri iş sözleşmesinin içinde, uyarı yalnız İSG-KATİP için); M6 Plan aç 2. tur incelemede; **2026-09-26 reisim: kalan modüllerin (M7–M16) soruları tek listede** (MAKET-PLANI.md), cevaplandı (pkproje.md §9 yirmi birinci tur), M6–M16 2. tur bitti, **reisim toplu gözden geçiriyor** — 2026-09-27/28 tur tur (pkproje.md §9 yirmi ikinci – otuz üçüncü tur, §11 90–111; maket artık sayfalar arası
kalıcı, reisim her işlevi kendisi dener; makette geçici çözüm olabilir, nihai kodda olmaz); **bütün maketler onaylanmadan kod yok**; **2026-09-29 reisim: modül modül koda geçiş yok — her şey makette kalır, kod bütün maket bitince tek seferde, olabildiğince düzgün yazılır** (pkproje.md §9 otuz altıncı tur); genel ilke: teknik ayrıntı yok, kural uyarıdır engel değil (pkproje.md §9 on ikinci tur).
**2026-10-03 KOD BAŞLADI** (reisim: *"Makette eksik kalmadıysa koda geç"*): G0 → bütün maketler bu tarihteki hâliyle onaylı; yapım sırası ve kurallar
`KOD-GECIS.md` (K0 → K7). Paket izni kalıcı (reisim: *"İzin isteme ne gerekiyorsa yap"*); Windows'ta yapılması gereken iş çıkınca reisim'e söylenir.
Uçtan uca test: `npm run test:e2e` (Playwright, `e2e/`).

## 2 · Yığın (pkproje.md §8 — **reisim 2026-09-22'de onayladı**)
- **TypeScript + Next.js (App Router), standalone çıktı — onaylı 2026-09-22** (SvelteKit düştü). Tarayıcı
  uygulaması; masaüstü ofis, sahada tablet/telefon = aynı uygulama, ayrı tasarım; PWA + çevrimdışı kuyruk
  sonraki fazda, şema ilk günden buna göre.
- **Modüler mimari — onaylı (pkproje.md §8.11):** her iş modülü `src/modules/<modül>/` içinde; modül başka
  modülün tablosuna doğrudan dokunmaz, o modülün dışa açtığı fonksiyonları kullanır; ortak çekirdek
  `src/server/`; sayfalar iş mantığı taşımaz. ⛔ Tek dosya derleme ve tek küresel ad alanı YOK.
- **Barındırma — §8.8, 2026-10-03 değişti (KOD-GECIS G3):** veritabanı + dosya deposu **Supabase** (yönetilen PostgreSQL, AB — Frankfurt);
  uygulama AB bölgesinde hazır barındırmada (ör. Vercel); her firma kendi alt alan adında (`*.<ürün>.com.tr`), joker SSL. Veri AB'de; KVKK hukukçu işi
  yapılmaz (reisim 2026-10-03: raporları her firma kendi deposunda tutar). Yığın aynı (PostgreSQL + RLS, kendi girişimiz, pg-boss).
- **Arka plan işleri — onaylı (§8.9):** PostgreSQL üstünde iş kuyruğu (pg-boss); ayrı servis yok.
- **Sigorta okuma — onaylı (§8.10):** pano fotoğrafından okuma görsel yapay zekâ ile; değer **öneri** olarak
  düşer, inspector onaylamadan kaydedilmez.
- **Rapor formatları — onaylı (§8.3, 2026-10-02 değişti):** firma × ekipman türü başına, **firmanın Format kurucusunda** kurulan sürümlü
  tanım; saha ekranı ve PDF bu tanımdan çizilir, çizen motor kodda tek (`RAPOR-FORMAT.md`). Eski "kodda, site içi düzenleyici yok" kalktı.
- **PostgreSQL**: yerelde projeyle gelen **gömülü sürüm** (npm paketi, kurulum yok, veri `data/` altında);
  yayında yönetilen PostgreSQL. Satır seviyesi kiracı izolasyonu veritabanında; her sorgu kiracı süzgeçli tek veri
  erişim katmanından geçer (anayasa 7, 07-YETKI §1).
- **Dosyalar**: yerelde `data/depo/`, yayında S3 uyumlu depo; tek adaptör, iki ayar. Kalıcı herkese açık bağlantı
  ÜRETİLMEZ (anayasa 5.1'in karşılığı: kısa ömürlü, yetkili indirme).
- **Kimlik/giriş** bizim kodumuzda (firma kullanıcıları + müşteri hesapları e-posta ile); kiracı = alt alan adı.
- **PDF** sunucuda üretilir; şablon firma künyesi + form kodu + bölüm iskeleti taşır (`pkproje.md` §4.2, §4.8).
- **Test**: Node 24 yerleşik koşucu `node --test` (TypeScript'i doğrudan koşar). Tarayıcı uçtan uca: Playwright
  (ilk ekranlar çıkınca). Docker YOK. Yerelde gömülü PostgreSQL; yayında Supabase (2026-10-03, G3; 2026-09-18'deki "Supabase yok" yerel geliştirme içindi).

## 3 · Dizin haritası (iskelet 2026-09-23; ★ = henüz boş, modüllerle dolar)
```
pkproje/
  CLAUDE.md                 bu dosya
  pkproje.md                alan bilgisi · kurgu · kararlar · açık sorular
  MAKET-PLANI.md            toplu maket çalışmasının talimatı ve durumu (2026-09-24; bulut oturumu için)
  KOD-GECIS.md              maketten koda geçiş hazırlığı (2026-10-03): başlama kararları G0–G1, çekirdek, veri modeli, yetki, durum makineleri,
                            numaralar, ENGEL / UYARI kataloğu, yapım sırası K0–K7, kilit planı, yayın öncesi kararlar — KOD BAŞLARKEN TAM OKUNUR
  RAPOR-FORMAT.md           firmanın kendi rapor formatını kurduğu sistem (2026-10-02, AA10 — onaylı, §8.3)
  ARKA-UC.md                arka uç kurgusu (2026-10-01; K1–K6 kabul, K7–K8 kabul edilmedi — 2026-10-02): veri, dosya, çevrimdışı, uygulama, yapay zekâ, yedek
  ANAYASA.md · TASARIM-KALIBI.md · 00–08-*.md · 09-SUNUCU-VE-VERI.md · EKSIKLER-VE-ONERILER.md
                            kural dosyaları (ANAYASA/KALIP'a madde yalnız reisim onayıyla eklenir)
  src/app/                  sayfalar (iş mantığı YOK), beş rota grubu (348: (yonetim)/yonetim — yalnız yönetim adresinde, kendi oturumu): (uygulama)/ oturum ister — Planlar ana sayfa + modül başına bir
                            rota klasörü (kayıtla birebir) · (acik)/giris · (gelistirme)/vitrin (yayında 404) · (musteri)/portal müşteri paneli (319:
                            müşteri oturumu, veri müşteri işleminde — veritabanında probata_musteri rolü, kısıtlayıcı politikalar; göç 0030)
  src/proxy.ts              ara katman: her istekte nonce'lu CSP + güvenlik başlıkları (Next 16'da middleware'in adı proxy) · /api sürüm başlığı,
                            eski cihaz istemcisi 426 (src/server/api-surum.ts)
  src/modules/moduller.ts   MODÜL KAYDI — yan menünün ve rotaların tek kaynağı (15 modül, 6 grup, onaylı maketle aynı; 2026-09-25 Kullanıcılar Personel'e katıldı; 2026-09-26 Ekipmanlar planın içine; 2026-09-28 Talepler eklendi, Standartlar → Dökümanlar, Eğitimler Dökümanlar'ın içinde)
  src/modules/personel/     PERSONEL (2026-10-04): sema.ts (form + sunucu tek şema) · server/personel.ts (liste, kart, ekle, güncelle, ayrıldı; yetki içeride) ·
                            server/dosyalar.ts (özlük, ekipman ataması, bordro, imzalı zimmet formu; 2026-10-04; 344: zimmet teslim formu src/belge/zimmet.ts →
                            /personel/<id>/zimmet-formu/pdf, İmzaya gönder → Onaylar › Diğer, imzalanınca imzalı form) ·
                            ui/ (liste, form, sunucu eylemleri — "use server" dosyası yalnız …Eylemi dışa açar)
  src/modules/musteriler/   MÜŞTERİLER (2026-10-04): sema.ts · server/musteriler.ts (liste, kart, kaydet + uyarı onayı, pasif zinciri) · ui/ (liste, pencereler)
  src/modules/ekipman-turleri/ EKİPMAN TÜRLERİ (2026-10-04): katalog (Mekanik / Elektrik), tür sayfası, rapor formatı PDF sürümleri
  src/modules/olcum-cihazlari/ ÖLÇÜM CİHAZLARI (2026-10-04): cihaz, cihaz türü, kalibrasyon kaydı + sertifika, kalibrasyon durumu (eşik firma ayarı)
  src/modules/zimmetler/    ZİMMETLER (2026-10-04): kimde (son hareketten), değişmez teslim hareketleri + fotoğraf, demirbaş
  src/modules/araclar/      ARAÇLAR (2026-10-04): araç (zimmet varlığı), değişmez teslim tutanağı + açı fotoğrafları, haftalık kilometre
                            · tutanak belgesi (342): src/belge/arac.ts (temel <kod>-FR-ARC-01) → /araclar/tutanak/<hareket>/pdf; kişiye teslimde
                            PDF aynı işlemde teslim alanın imzasına (Onaylar › Diğer, onaylar/server/belge-baglanti.ts belgeGonder, kaynak = hareket)
  src/modules/sozlesmeler/  SÖZLEŞMELER (2026-10-04): iş sözleşmesi + kapsam + imzalı PDF, İSG-KATİP ID (tesis × denetçi), sözleşme şablonu ·
                            Dayanak teklif (326, göç 0038; kabul edilmiş teklifler teklifler/server/sozlesme-baglanti.ts'ten; ?teklif= ön doldurma)
  src/modules/dokumanlar/   DÖKÜMANLAR (2026-10-04): standart kütüphanesi (sürümlü PDF), diğer dökümanlar; kriter belgeleri src/tanim/kriterler.ts
  src/modules/egitimler/    EĞİTİMLER (2026-10-04; Dökümanlar sekmesi, modül 10): eğitim türleri, kayıtlar, tekrar tarihi, sertifika
                            · katılım formu (345): src/belge/egitim.ts (temel <kod>-FR-EGT-01), katilimFormuGonder → Onaylar › Diğer (kaynak eğitim kaydı)
  src/belge/                RAPOR BELGESİ (2026-10-05, 315): belge.ts tek çizici (format tanımından; React createElement, kaçışlı; önizleme = PDF) ·
                            belge.css A4 Bakanlık görünümü (Carlito ./carlito-5.3.0, OFL) · veri.ts (BelgeVerisi; Raporlar raporBelgesiVerisi doldurur)
                            · html.ts (ağaç → HTML, React'le birebir) · pdf.ts kesin PDF (316: başsız Chromium — Vercel'de @sparticuz/chromium) · ornek.ts (uydurma)
  src/format/               FORMAT MOTORU (2026-10-04, RAPOR-FORMAT.md): tanim.ts (şema) · hesap.ts (ZPKK formülleri, saf) · motor.ts (değerlendir,
                            yayın denetimi) · sablonlar.ts (ZPKR01, ZPKR02, kompresör) — saha ekranı ve PDF aynı tanımdan
  src/modules/rapor-format/ RAPOR FORMATI (2026-10-04, 308): sürümlü tanım (rapor_format, göç 0022: taslak → yayında → eski; yayınlanan değişmez) ·
                            şablondan başlat · taslak kaydet · yayınla (kilitli Bakanlık öğesi ENGEL, öteki denetim uyarı) · yayındaki format;
                            ekran: tür sayfası "Rapor şablonu" + önizleme /ekipman-turleri/<tür>/sablon/<sürüm> · FORMAT KURUCU (338, K4):
                            …/sablon/<taslak>/kurucu (ui/FormatKurucu.tsx; saf düzenleme kurucu.ts — yeni kimlik tekil, kilitli bölüm / öğe silinmez)
  src/modules/planlar/      PLANLAR (2026-10-04, 309–310; modül 13): plan + plan ekibi (göç 0023; proje no sunucuda, değişmez; künye kayıttan) ·
                            Plan aç /planlar/ac (uyarılar sema.ts'te saf, engel değil) · liste /planlar · plan içi /planlar/<id> (server/plan-ici.ts:
                            akış kabul/red/kontrol/tamamla, künye düzenle/güncelle, plan ekipmanı, proje notları; geçişler göç 0024 tetiğinde)
  src/modules/raporlar/     RAPORLAR (2026-10-05, 311; modül 14): saha raporu (göç 0025 rapor: plan × ekipman başına tek etkin rapor, açıldığı
                            format sürümü, künye kopyası, cevaplar JSON, cihazlar; durum ve içerik değişmezliği tetikte) · server/raporlar.ts (oluştur,
                            saha verisi, kaydet, onaya gönder: ENGEL 1 / 2 / 5, sil, cihaz) · server/plan-baglanti.ts (Planlar'ın rapora baktığı tek yer)
                            · ekran /raporlar/<id> (format tanımından çizilir: ui/Bloklar.tsx) · fotoğraflar (312: ui/FotoListesi.tsx, dosya modülü "rapor")
                            · Kaydet ve kopyala / Formatı güncelle / günlük süre — mesai (313: raporKopyala, raporFormatGuncelle, plan-baglanti mesaiDurumu;
                            ui/KopyaPenceresi.tsx) · liste /raporlar (318: raporListesi — görme kayıt kayıt; ui/RaporListesi.tsx) · imzalı PDF eki
                            denetimi imza-pdf.ts (saf, beyaz liste: ek ayrıştırılır, trailer kökü aynı, özgün nesneden yalnız katalog / sayfa /Annots
                            değişir, yeni imza sözlüğü şart — 0028 ve 318 incelemeleri) · revize isteği server/revize.ts (318, göç 0029
                            rapor_revize_istegi; ui/RevizeIstePenceresi.tsx; 0031: imza günü ≥ muayene tarihi, eskimiş sürüm uygunsuzluk kapatmaz)
  src/modules/onaylar/      ONAYLAR (2026-10-05, 314; modül 15): kuyruk, onay ekranı (gözden geçirme), Onayla / Geri gönder / Onayı geri al /
                            Durumu değiştir (göç 0026: geçişler, onay damgası, Yeni'ye gerekçe ≥ 10 veritabanında); rapora raporlar/server/onay-baglanti.ts'ten
                            · İmzamı bekleyen raporlar /onaylar/imza (318, C5: denetçinin Onaylar'ı yalnız bu; kuyruk ve onay ekranı yöneticinin)
                            · Revize istekleri /onaylar/istekler, Revizeye gönder / İsteği reddet (318; ui/RevizePenceresi.tsx; R1 onay-baglanti
                            raporRevizeYaz) · Diğer belgeler /onaylar/diger (333, göç 0044 belge_onay: server/belgeler.ts — kişinin kendi belgeleri,
                            geri gönder, imzalı PDF yükle; server/belge-baglanti.ts — gönderen modüller: Personel bordro "Onaya gönder", Muhasebe
                            muhasebe/server/bordro-gonder.ts + ui/BordroGonder.tsx; ui/DigerBelgeler.tsx; sayfa modülden bağımsız, oturum kapısı)
  src/modules/musteri-paneli/ MÜŞTERİ PANELİ (2026-10-05, 319; modül 17): server/panel.ts (yalnız musteriIslemi içinde; Raporlar'ın musteri-baglanti.ts
                            ve Müşteriler'den okur; 0033 uygunsuzluk yalnız açık sürümün, pasif müşterinin oturumu hemen düşer) · ui/ (Raporlarınız; 320: Uygunsuzluklar /portal/uygunsuz, Excel tarayıcıda — ui/kusur.ts; 321: Planlanan kontroller /portal/plan — Planlar'ın
                            server/musteri-baglanti.ts, göç 0032 sütun sınırlı —, toplu ZIP ui/topluIndir.ts + ui/zipla.ts (saf; 300 rapor / 500 MB) + ui/ad.ts; 322: Sözleşmeler /portal/sozlesme + /portal/s/<id> — Sözleşmeler'in
                            server/musteri-baglanti.ts, göç 0034; 323: Muayene personeli /portal/personel — Personel'in server/musteri-baglanti.ts'i, göç 0035
                            veritabanı işlevleri musteri_personeli / musteri_personel_belgeleri, firma ayarı musteri_belge). Müşteri girişi yönetimi: musteriler/server/girisler.ts + ui/GirisBolumu.tsx;
                            giriş / oturum çekirdeği src/server/kimlik/musteri.ts; kabuk src/components/kabuk/MusteriKabugu.tsx
  src/modules/muhasebe/     MUHASEBE (2026-10-05, 327; modül 18): göç 0039 (fatura, fatura_rapor, tahsilat; değişmez, kalanı aşmaz, son imzadan önce
                            olamaz) · server/muhasebe.ts (işler = planlar, iş / fatura kartı, fatura kaydet / toplu, tahsilat) · ui/ (listeler, iş ve fatura
                            parçaları, pencereler) · okuyucular: planlar/server/muhasebe-baglanti.ts, raporlar/server/muhasebe-baglanti.ts,
                            teklifler/server/rapor-bagi.ts (birim fiyat), sozlesmeler tesisSozlesmesi (vade) · 328: göç 0040 gider (elle ödendi /
                            ödenecek; masraf formu onay → ödendi / red) · server/giderler.ts · karlilik.ts (saf: iş kârı, ay / dönem gelir-gider) ·
                            excel.ts (gider içe / dışa) · ui/Giderler.tsx, ui/Karlilik.tsx · personel/server/muhasebe-baglanti.ts (bordro maliyeti)
                            · fatura özeti PDF (340): src/belge/fatura.ts (temel format <kod>-FR-FOZ-01) → /muhasebe/f/<id>/pdf (pdf.ts faturaPdf;
                            veri muhasebe.ts faturaBelgesiVerisi)
  src/modules/anasayfa/     ANA SAYFA (2026-10-06, 332): rol başına bölümler (server/anasayfa.ts — modüllerin yetkiye duyarlı işlevleri ve
                            planlar / ekipman / raporlar server/anasayfa-baglanti.ts okuyucuları) · ui/AnaSayfa.tsx; kök sayfa src/app/(uygulama)/page.tsx
                            · YAN MENÜ BALONLARI (339): server/takip.ts menuTakip (modül başına kırmızı / sarı, yetkiye duyarlı) · ui/eylemler.ts
                            menuTakipEylemi — kabuk (src/components/kabuk) sayfa açılınca ister
                            · yan menü balonları server/takip.ts (339; 343: kişinin kendi işi — Planlar ekibi, Onaylar onaylayabildiği, Araçlar
                            araclar.ts aracTakip: km + belge)
  src/modules/uyarilar/     UYARILAR (2026-10-06, 331; modül 20): tablo yok — kalibrasyon, eğitim tekrarı, araç belgesi kayıtlardan (okuyucular
                            olcum-cihazlari / egitimler / araclar server/uyari-baglanti.ts); sema.ts (türler, görünürlük) · server/uyarilar.ts · ui/
  src/modules/talepler/     TALEPLER (2026-10-06, 330; modül 21): göç 0042 izin_talebi (yalnız kendi adına; karar firma yöneticisinde) · sema.ts
                            (izin şeması, iş günü) · server/talepler.ts (taleplerim, izin gönder / geri çek / belge, masraf formu — Muhasebe'nin
                            muhasebe/server/talep-baglanti.ts'i, izin onay / red) · ui/Talepler.tsx, ui/IzinTalepleri.tsx (/personel/izinler) ·
                            okuyucular: planlar/server/talep-baglanti.ts, personel/server/talep-baglanti.ts
                            · talep formu PDF (341): src/belge/talep.ts (temel <kod>-FR-IZN-01 / MSR-01) → /talepler/pdf/<izin|masraf>/<id>
                            (talepFormuVerisi: talep eden; izinde firma yöneticisi; masrafta Muhasebe'yi gören)
  src/modules/performans/   PERFORMANS (2026-10-06, 329; modül 19): tablo yok (göç 0041 yalnız dizin) · hesap.ts (saf: dönem, özet, tamamlanma süresi,
                            zaman grafiği, süreç adımları, günlük iş, GÖRÜNÜRLÜK — kendi / branş / hepsi, kazanç) · server/performans.ts (pano, kişi) ·
                            ui/Performans.tsx · okuyucular: raporlar/server/performans-baglanti.ts, personel/server/performans-baglanti.ts
  src/modules/firma-ayarlari/ FİRMA AYARLARI (2026-10-06, 334; modül 22): sema.ts (bölüm şemaları, seçenekler) · server/ayarlar.ts (ekran verisi, bölüm
                            kaydet, firma kodu — çekirdek firmaKoduYaz, göç 0045; logo / ön bilgilendirme / bordro formatı dosyaları) · ui/FirmaAyarlari.tsx
                            (bölüm kartı + taslak Kaydet / Vazgeç) · belge başlığı künyesi src/server/ayar/ayar.ts firmaBelgeKunyesi (ticari ad, adres, akr., logo)
                            · TOPLU İÇE AKTARMA (337, göç 0047 ice_aktarim + ice_aktarim_geri_al): ice-aktar.ts (saf: türler, şablon, satır denetimi) ·
                            server/ice-aktar.ts (denetle, içe aktar — tek işlem, geri al) · ui/IceAktarma.tsx · bağlantılar <modül>/server/ice-aktar-baglanti.ts
                            (musteriler, ekipman, olcum-cihazlari — ilk_bitis, personel, araclar)
  src/components/grafik/    TEK GRAFİK ÜRETİCİSİ (329): dikey sütun (maket T9), etiket ölçülerek, gizli tablo (ekran okuyucu)
  src/modules/yonetim/      probata YÖNETİM (2026-10-06, 348; KOD-GECIS Y1): firmalar, firma aç (ilk yönetici + geçici parola), dondur / etkinleştir,
                            yeni geçici parola — server/yonetim.ts yalnız 0050 işlevleriyle (yönetim rolü); sema.ts (ayrılmış adlar göçle aynı) · ui/ ·
                            sayfalar src/app/(yonetim)/yonetim: giris (parola → kod → ilk kurulum) + (panel) — yalnız PROBATA_YONETIM_ALAN adresinde
  src/server/yonetim/       YÖNETİM ÇEKİRDEĞİ (348): adres.ts (saf; ara katman da okur) · totp.ts (RFC 6238, saf) · giris.ts (iki adımlı giriş, kilit,
                            kurulum, oturum) · istek.ts (yonetimOturumGerekli, yonetimIslemi → db/kiraci.ts yonetimIcinde: SET LOCAL ROLE probata_yonetim)
  src/modules/ekipman/      EKİPMAN (2026-10-04, 309): tesisin kalıcı ekipman kaydı (kod firmada eşsiz; eski kod başkasına verilmez — ekipman_kodu)
  src/modules/teklifler/    TEKLİFLER (2026-10-05, 324; modül 11): göç 0037 (teklif, teklif_kalem, teklif_tesis, fiyat_listesi; teklif_akis: yalnız taslak
                            düzenlenir, taslak → gönderildi → kabul / red, süresi dolan kabul / red edilmez, hazırlayan veritabanında) · server/teklifler.ts
                            (liste, kart, seçenekler, kaydet / kopya, gönder, kabul, red, müşteri olarak kaydet — yaz: planlama + firma yön.) · ui/ (liste,
                            form, eylemler) · rapor bağı raporlar/server/teklif-baglanti.ts (kabulden sonra imzalanan, türle) · tutarlar kuruş ·
                            form-degeri.ts (formun başlangıç değeri sunucuda; pasif tesis düşer) · ui/KalemTablosu.tsx (sütun işlevleri istemcide) ·
                            her rapor TEK teklife (tesis × tür, imza gününde geçerli en son kabul — raporlananlar) · var olan müşteriye bağla ·
                            325: excel.ts (saf: Excel'den yükle → kalemler, Excel'e aktar, şablon) + ui/EkipmanExcel.tsx · teklif belgesi
                            src/belge/teklif.ts (temel format <kod>-FR-TKL-01) → PDF /teklifler/<id>/pdf (src/belge/pdf.ts teklifPdf)
  src/tanim/iller.ts        81 il + 973 ilçe (açık veri, MIT; bir kez alındı)
  src/modules/<modül>/      ★ her iş modülü: server/ (veri erişimi + iş kuralları, dışa açılan fonksiyonlar) · ui/ · şema · testler
  src/tanim/tanimlar.ts     SABİT TANIMLAR (durum adları, eğri çarpanları, mesai sınırları …): şemalı, karma adlı JSON → /api/tanim (2026-10-04)
  src/sema/ortak.ts         ORTAK ŞEMA (zod): girdi doğrulamanın tek kaynağı, sunucu ve istemci aynı şemayı kullanır (2026-10-03)
  src/server/db/            gömülü PostgreSQL (gomulu.ts) · göç koşucusu (goc.ts, gocler/NNNN_ad.sql, her göç idempotent) ·
                            kiracı süzgeçli TEK erişim katmanı (kiraci.ts: kiraciIcinde) — pg YALNIZ burada içe aktarılır ·
                            GÜVENLİ YAZICI (yazici.ts: tablo / ekle / guncelle / izYaz — sürüm kilidi + denetim izi; modül ve sayfa ham
                            yazma SQL'i taşımaz, 2026-10-04)
  src/server/db/gocler/0000, 0008–0010  YAYIN SERTLEŞTİRME (2026-10-04): Supabase API rolleri şemaya giremez (0000 önce, 0008 temizlik + doğrulama),
                            rol süre sınırları (0009), işlev arama yolu (0010) — kilit tests/yayin.test.ts (Supabase taklidi, süper kullanıcı olmayan sahip)
  src/server/yz/            YAPAY ZEKÂ (351): okuma.ts (fotoğraftan okuma isteği — 354: yapılandırılmış çıktı, zorunlu araç YOK (Opus / Sonnet 5.5 400) —
                            cevap süzme / maliyet, saf; anthropicCagir — uç PROBATA_YZ_UC, hata ücretli mi) · kullanim.ts (0052 yz_kullanim / yz_okuma; 0053
                            ayırma: yzAyir satır kilidiyle, yzOkumaYaz, yzAyirmaBirak; yzAyKullanimi firma ayarlarına) · modülde raporlar/server/foto-oku.ts
                            (hazırla + ayır → çağrı → kullanım → öneri; pano fotoğrafı rapora) + foto-eslestir.ts (saf: okunan → boş satır) + ui/FotoOkuma.tsx
  src/server/saglik.ts      SAĞLIK (350; 09-G5): /api/saglik denetimleri (db/saglik.ts → saglik_denetimi, geçerli tanım 0053 — bağlanan rol, göç sayısı;
                            db/son-goc.ts SON_GOC + GOC_SAYISI — her yeni göçte ikisi güncellenir, testle kilitli) · canlı duman testi: node tools/duman.mjs (salt okunur, çıkış kodu)
  src/server/db/havuz.ts    ortamdan bağlantı: ağda şifresiz bağlantı YOK (PROBATA_VT_SSL=dogrula → kok-sertifika.ts Supabase kökü); Vercel'de boşta bekleme
  vercel.json               deneme yayını (Vercel fra1, https://probata-deneme.vercel.app; veritabanı Supabase eu-central-1 — pkproje.md §11 293)
                            · yalnız main yayınlanır (git.deploymentEnabled; kalem/* önizleme kurmaz — 2026-10-06, Function Storage kotası)
                            · 352: Chromium yalnız PDF işlevinde (PDF basan sayfalar maxDuration 60 — tests/pdf-paket.test.ts); saklama 1 gün
  src/server/kiraci/        kiracı çözümleme (alt alan adı → firma kısa adı; istek.ts: istekKiracisi) · ★ güvenli yazıcılar
  src/server/kimlik/        parola özeti (scrypt) · giriş · oturum (belirteç özeti, kilit) — 2026-10-04 · istek.ts (oturumGerekli, modulGorur,
                            güvenli dönüş adresi) · eylemler.ts (giriş / çıkış sunucu eylemleri)
  src/server/dosya/         TEK DOSYA YOLU: anahtar üreticisi (yalnız kimlik) · tür baytlardan + EXIF silme (tur.ts) · kapalı depo bağdaştırıcısı
                            (klasör; deneme yayınında veritabanı — 347, göç 0049 depo_nesne, PROBATA_DEPO=vt, çağıranın işleminde; firma S3'ü K7) ·
                            yükle / indirilebilir + modül erişim kaydı (kaydı olmayan modülün dosyası kimseye açılmaz) ·
                            tek uç src/app/api/dosya/[id] · görsel yalnız <GizliResim> (components/gizli-resim)
  src/server/ayar/          FİRMA AYARLARI (bölüm biçimi + başlangıç değeri tek yerde, sürüm kilidiyle yazılır) · ŞİFRELİ SIRLAR (AES-256-GCM, ana
                            anahtar PROBATA_SIR_ANAHTARI; firma + ada bağlı; ekranda son 4)
  src/server/numara/        TEK NUMARA ÜRETİCİ (proje P-AAYY-SIRA · rapor XX-AAYY-SIRA-EK kesintisiz · teklif / sözleşme / gider / izin / araç tutanağı; sayaç işlem içinde)
  src/server/yetki/         TEK YETKİ: tanim.ts (roller, matris, sabitler) · canDo.ts (canDo, canDoEylem) — ayna testi: DB CHECK · maket · KOD-GECIS §4
  src/components/disa/      DIŞA / İÇE AKTARMA (tarayıcıda, saf): zip.ts (STORE yazıcı) · xlsx.ts (yazıcı) · oku.ts (325: .xlsx / .csv OKUYUCU — DEFLATE
                            DecompressionStream ile, ortak dizgi, tarih biçimi, Türkçe Windows CSV; 10 MB / 50 MB açılmış / 5 000 satır sınırı) · indir.ts
  src/components/           TEK ÜRETİCİLER: sayfa/ (kırıntı, sayfa / nesne başlığı, bölüm, rozet, sekmeler) · kabuk (yan menü + üst çubuk) · ikon · boş durum · tuş · şerit · bildirim · pencere + onay ·
                            liste (tablo↔kart, süzgeç mantığı liste/suzgec.ts) · fotoğraf küçültme (foto/kucult.ts) · filtre satırı · sayfalayıcı · seçim alanı + tarih/saat (secim/) · bilgi yüzleri / bilgi listesi / koşullar (bilgi/) · form sayfası (form/) · uzun tuş (tus/UzunTus) · kopyala (pencere/Kopyala: sonuç pencerenin içinde) · dışa aktarma (disa/: ZIP + .xlsx yazıcı, saf; tarayıcıda indirme — 320)
                            (geliştirme vitrini /vitrin: yalnız geliştirmede, yayında 404)
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
npm run dev              # gömülü PostgreSQL (127.0.0.1:54320, data/pg) + Next → http://deneme.localhost:3000
                         # (ilk açılışta uydurma "deneme" firması + yönetici; parola data/gelistirme-hesap.txt'de)
npm test                 # node --test; çıktıda "fail 0" yoksa zincir DURUR (gerçek PostgreSQL testi dahil)
npm run test:negatif     # tests/bozan/ — her kilit gerçekten yakalıyor mu (N/N)
npm run check            # next typegen + tsc (tip denetimi)
npm run lint             # eslint (Next + TypeScript kuralları)
npm run build            # ÖNCE test; düşerse derleme yok (standalone çıktı)
npm run build:onizleme   # ÖNCE test; Pages sitesi site/ (yalnız docs: maket + sunum; uygulama önizlemesi 2026-10-04 kalktı)
npm run onizle           # site/'yi Pages'teki gibi /pkproje/ altında sunar → http://127.0.0.1:8780/pkproje/
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
İlki `src/styles/tokens.css`'teki (tek kaynak) gerçek renklerle bütün çiftlerin (şu an 74) WCAG kontrastını ölçer; aynı
ölçüm `tests/kontrast.test.ts` kilidinde. İkincisi sunumu tokens + `docs/assets/olcum.json`'dan üretir; sunum elle
düzenlenmez. Maket ölçümü: `tools/olc-maket.js`.

## 5 · Teslim zinciri (anayasa 0.3'ün bu projedeki hâli)
`npm test` (fail 0) → `npm run check` + `npm run lint` → `npm run build` → `npm run dev` ile **localde aç ve
GÖZLE doğrula** (masaüstü 1920 · tablet 1080 · telefon 375; açık + koyu tema; kendi tarayıcı bölmemde, ölçerek)
→ `git diff --stat` + her parçayı **oku** (13.5) → commit (mesaj: ne istendi · ne değişti · **nerede/nasıl
doğrulandı**; ölçülemeyen "ölçemedim") → **kanıt özeti** ("ne baktım · nerede · ne gördüm"; ilk iki satır UYUM ve
ETKİ ALANI). Bir teslimde **BİR kalem**. Reisim'e test ödevi verilmez.
CI aynı zinciri her push'ta koşar (`.github/workflows/ci.yml`); main'de denetim geçmeden Pages'e yayın olmaz.
**PC'de (Windows) yerel deneme YOK (2026-10-04, reisim: *"windowsta postgreSQL ile neden çalışalımki her işimizi internette supabase de vs
yapıcaz windowsta localhostta vs deneme yapmak istemiyorum"*):** PC'de gömülü PostgreSQL, `npm test`, `npm run dev`, yerel uçtan uca koşulmaz;
PC'de yalnız `npm run check` + `npm run lint` (veritabanısız). Test kapısı CI'da: kalem dalı push → CI yeşil (tip · lint · test fail 0 · olumsuz
kanıt · derleme · uçtan uca üç genişlik; günlük: check-runs annotations) → göç Supabase'e (`goc` kaydıyla) → `main` fast-forward + push → Vercel
`main`'den yayınlar. Testler Supabase'e yazmaz (canlı veriye deneme yazması yok, anayasa 6.5). Gözle doğrulama yayında; oturum isteyen ekranda
giriş reisim'in (parolayı ben yazmam) — bakılamayan "ölçemedim" diye yazılır.
**Askıda (gerçek sunucuya çıkınca açılır):** canlı veriye elle dokunma (anayasa 6) · gerçek cihaz teyidi (11.2) ·
üretim doğrulaması. **Açık:** `git push` (her teslim push ile biter, 0.3) · GitHub Pages önizlemesi (bkz. §8).

## 6 · Kalıp ve kilitler (bu projede)
- **Referans ekran DONDU (2026-09-23): Planlar + plan içi** (maket 5. tur). Sayılar `src/styles/kalip.ts`'te
  (denetim 34/44 · bantlar 768/1280 · kart eşiği 600 (2026-09-26, kart yalnız telefonda; 600–960 sıkışık tablo) · sayfa ekipman 10 / rapor 20 · yazı ölçeği · kabuk 232/52 ·
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
  maket) · ikonlar · menü = onaylı maket · rota = modül kaydı · kontrast (74 çift) ·
  kiracı süzgeci (pg yalnız src/server/db; her kiracı tablosunda ENABLE + FORCE RLS + politika) · kiracı izolasyonu
  GERÇEK PostgreSQL'de (iki firma, WITH CHECK, uygulama rolü süper kullanıcı değil, göç idempotent) · giriş / oturum / kilit · yetki
  aynaları · güvenli yazıcı (sürüm kilidi, sütun listesi, gizli alan) · denetim izi değişmez + kim / zaman veritabanı damgası · ham yazma yasağı
  (2026-10-04).
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
- Otomatik silme: **firmanın deposunda** imzalı rapor PDF'i ve aylık arşiv yedeği **saklama süresi dolunca** silinir (en az 5 yıl, firma 6–20 yıla
  uzatabilir; 30 gün önce liste — reisim 2026-10-03: *"2 olsun"*, KOD-GECIS ENGEL 11). Süre dolmadan hiçbir şey silinmez. Eski "yalnız firma 'Sil'
  seçtiyse" kuralı ve sistemde kalsın / arşiv / sil seçenekleri kalktı.
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
  başına alt alan adı vermez → gerçek uygulama Supabase + AB'de hazır barındırma (pkproje.md §8.8, 2026-10-03).
- **Yayın (2026-09-23, iskelet): GitHub Pages GitHub Actions'tan** yayınlar (reisim: *"ilk yayını yap"* → Pages önizlemesi):
  sitenin kökü `docs/` (maket + sunum, adresler aynı). `…/uygulama/` statik önizlemesi **2026-10-04 kalktı** (giriş, ara
  katman, sunucu eylemleri durağan çıktıda çalışmaz; pkproje.md §11 282). Önceki düzen (main `/docs` doğrudan) kalktı. https://cankonuralp.github.io/pkproje/
  (görsel sistem) · `…/plan-ici.html` (plan içi ve yan menü sunumu) · `…/maket/planlarim.html` (maket; `#/plan/<id>` plan içi,
  `#/plan/<id>/ekle` ekipman ekle) · `…/toplu-bakis.html` (16 maketin toplu bakışı, 2026-09-24). Üç sunum `tools/sunum-uret.mjs` ile
  üretilir, elle düzenlenmez (toplu bakış metni pkproje.md §3.6'dan, sayıları `docs/assets/olcum/`'dan okur). Sayfalar `noindex`; veri uydurma. İş akışı
  `.github/workflows/ci.yml` (Eksikler §1): her push'ta denetim; main'de denetim geçerse önizleme kurulur ve yayınlanır.
- OneDrive: reisim'de kapalı, klasör adı Windows 10'dan kalma; dosyalar yerelde. Yedek = GitHub.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
