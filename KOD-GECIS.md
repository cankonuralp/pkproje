# KOD-GECIS.md — maketten gerçek uygulamaya geçiş hazırlığı (2026-10-03)

> Reisim (2026-10-03, birebir): *"şimdi siteyi maketten normale geçirmek için hazırlık yap backend kurallarını vb şeyleri yaz ve veya
> kurallardan oku hazır olunca söyle başlayalım eksiğimiz olmasın dikkat et"*
>
> **Ne bu belge:** kod yazılmadan önceki son kontrol listesi ve yapım haritası. Kural **tekrar edilmez**, yeri gösterilir; bu belge
> kuralları **bir araya getirir**, makette biriken ama hiçbir kural dosyasına yazılmamış kararları **çıkarır** ve eksikleri **söyler**.
> Okunan kaynaklar (2026-10-03, tam): `ANAYASA.md` · `TASARIM-KALIBI.md` · `pkproje.md` (§1–§9 tam, §11 başlıkları 13–243) · `ARKA-UC.md` ·
> `09-SUNUCU-VE-VERI.md` · `RAPOR-FORMAT.md` · `07-YETKI-VE-COKLU-KIRACI.md` · `EKSIKLER-VE-ONERILER.md` · maketin veri dosyası
> (`docs/assets/maket-veri.js`, ~80 koleksiyon) ve maketteki bütün kayıt engelleme mesajları · uygulama iskeleti (`src/`, `tests/`).
>
> **Durum:** hazırlık bitti. **2026-10-03 kod başladı** (reisim: *"Makette eksik kalmadıysa koda geç , pc de yapman gereken iş olduğunda pc ye geçeriz"*) →
> G0 uygulandı: bütün maketler bu tarihteki hâliyle onaylı. İlk kalem K0 Hazırlık.

---

## 0 · Başlamadan önce gereken kararlar (reisim)

**İkisi de kabul (2026-10-03, reisim: *"2 önerinide kabul ediyorum"*).**

| # | Karar | Neden şimdi | Karar |
|---|---|---|---|
| **G0** | **Maketlerin toplu onayı.** Onaylı: M1–M5, M13. Onay bekleyen: M6 Plan aç · M7 Dökümanlar · M8 Saha raporu · M9 Raporlar / Onaylar / imza / PDF · M10 Uyarılar · M11 Müşteri paneli · M12 Teklifler · M14 Muhasebe · M15 Performans · M16 Eğitimler · Talepler · Firma ayarları · Araçlar · Format kurucu · Onaylar › Diğer · giriş / hata ekranları · Hesabım · belge (Bakanlık görünümü) | Kural: *"bütün maketler onaylanmadan kod yok"* (CLAUDE.md §1, §9 yirmi birinci tur) | ✅ Kabul: "Başlayalım" denince **bütün maketler o günkü hâliyle onaylı** sayılır; kod sırasında çıkan düzeltme küçükse kodda, büyükse önce makette yapılır. |
| **G1** | **Geçmiş tarihe plan açma.** Eskiden makette **engel** ("Geçmiş tarihe plan açılmaz"). Oysa rapor artık geçmiş güne açık (§11 239–240). | Sahada yapılmış ama sisteme sonradan girilecek işler planla açılamaz. | ✅ Kabul: **uyarı** — plan açılır, "Plan günü geçmiş bir tarih" şeridi (makette uygulandı, pkproje §11 246). |

| **G2** ✅ kabul (2026-10-03, reisim: *"senin önerin daha mantıklı"*) | **Barındırma ve maliyet** (reisim 2026-10-03: Supabase + Natro; her firma kendi veritabanını bağlasın, maliyeti kendisi taşısın; yedek sıklığı ve arşiv bulutu ayardan; isteyen kendi sunucusuna kursun) | Veri katmanı K1'de yazılır; firma başına veritabanı her şeyi (göç, kiracı, yedek, destek) değiştirir | **Tek PostgreSQL bizde — G3 ile Supabase'de (AB); kiralık sunucu yok.** Maliyet firmaya şöyle geçer: **dosya deposu firmanın kendi S3 uyumlu hesabı** (en büyük kalem), **yedek hedefi + sıklık (saatlik / günlük) + saklama süresi** Firma ayarları'ndan firmanın deposuna, **arşiv bulutu** ayardan (C2, makette var), **yapay zekâ** firmanın anahtarı (K2). Firma başına ayrı veritabanı varsayılan olmaz; **kendi sunucusuna kurulum** sonraki fazda büyük firmalara seçenek. **Kota:** PostgreSQL'de (Supabase dahil) okuma / yazma başına ücret yok, sınır paket gücü (tıkla büyür); canlı dinleyici yok (09-B5). **İndirme trafiği:** dosya firmanın deposundan imzalı kısa ömürlü bağlantıyla doğrudan (09-A2 yönlendirme yolu) → trafik firmanın. **Yedek iki katman:** bizim veritabanı yedeğimiz (felaket kurtarma, 09-C3) + firmanın kendi yedeği (Firma ayarları: sıklık, saklama; pg-boss işi, çıktı firmanın deposuna). |
| **G3** ✅ kabul: **Supabase** (2026-10-03, reisim: *"Supabase kullanalım sebebi ise eğer bir sorun olurda kiraladığım server yetersiz gelirse sorun olur ama supabase de öyle bi ihtimal görmüyorum"*) | **Hazır servis mi, kiralık sunucu mu** (reisim 2026-10-03: *"Ya firebase ya da supabase kullanıcaz"*) | Veri katmanı ve giriş K1'de yazılır | **Hazır servis isteniyorsa Supabase** (PostgreSQL + RLS: iskelet ve 09 kuralları aynen taşınır; **giriş bizim kodumuzda** (alt alan adı = kiracı, 09-E; Supabase Auth kullanılmaz); dosya Supabase Storage ya da firmanın deposu (G2); uygulama AB bölgesinde hazır barındırmada, ör. Vercel). **Firebase değil** (kullanıma göre ücret: Realtime Database indirilen veri, Firestore okuma sayısı = eski kota sorunu; NoSQL, tasarım baştan). Bedeli: veri Frankfurt'ta → §8.8 ve 09-G3 değişir, KVKK yurt dışı aktarım şartı hukukçuya. Kiralık sunucu seçilmedi. **Karar: Supabase** (pkproje §8.8 değişti). Yerelde gömülü PostgreSQL sürer; ileride Türkiye'ye taşınabilir (aynı PostgreSQL). |

**Sunucu (2026-10-03, reisim: *"Sunucum yokki benim"*):** şimdi gerekmez; K7 Yayın'da Türkiye'de aylık sanal sunucu (VPS / VDS, kök erişimli, Ubuntu) kiralanır. Başlangıç tahmini (ölçülmedi, yayın öncesi yük denemesiyle kesinleşir): 2–4 çekirdek, 4–8 GB bellek, 80 GB+ SSD. Kurulum betiği ve reisim için adım adım kılavuz K7'nin ilk kalemi. **→ G3 ile geçersiz: kiralık sunucu yok, Supabase.**

Kodu bekletmeyen ama **yayından önce** gereken kararlar §12'de.

## 1 · Bağlayıcı kaynaklar — hangi konuda hangi belge

| Konu | Belge (öncelik sırası) |
|---|---|
| Çalışma yöntemi, teslim zinciri, ölçmeden "bitti" yok | `ANAYASA.md` (0, 11, 13) · `CLAUDE.md` §5 |
| Görsel kural ve ölçü | `TASARIM-KALIBI.md` (1–20) · `src/styles/kalip.ts` (dondurulmuş sayılar) · `tokens.css` (tek kaynak) |
| Sunucu, dosya, veri tasarrufu, giriş, imza bütünlüğü, arka plan, KVKK | **`09-SUNUCU-VE-VERI.md` A1–G5** (00–08 ile çelişirse 09) |
| Arka uç yapısı, çevrimdışı, mağaza uygulaması, yapay zekâ, yedek | `ARKA-UC.md` (K1–K6 kabul, K7–K8 yok) |
| Rapor formatı ve motor | `RAPOR-FORMAT.md` (§8.3, 2026-10-02) |
| Ürün davranışı, ekran içeriği | `pkproje.md` §3 (akış, numaralar, §3.7 firmaya göre değişenler, §3.8 site geneli kurallar), §9 (kararlar) |
| Ekranın görünüşü ve davranışı | **onaylı maket** (`docs/maket/*`) — kod maketi birebir uygular; maketteki geçici çözümler hariç (§13) |
| Kabul ölçütü | maketin ölçüm aracındaki denetimler (`tools/olc-bulut.mjs`; bugün **~700 davranış denetimi**, 19 grup) → kodda uçtan uca teste taşınır (§11) |

## 2 · Mimari (değişmeyenler ve kod sırasında kurulacak çekirdek)

**Değişmeyen (onaylı):** Next.js App Router, standalone · TypeScript · gömülü PostgreSQL (yerel) / yönetilen PostgreSQL (yayın) · RLS (ENABLE +
FORCE, uygulama rolü süper kullanıcı değil) · tek erişim katmanı `kiraciIcinde` (pg yalnız `src/server/db`) · modül klasörü `src/modules/<modül>/`
(server · ui · şema · test), modül başka modülün tablosuna dokunmaz · sayfalar iş mantığı taşımaz · pg-boss · S3 uyumlu depo (yerelde klasör) ·
webpack (Turbopack değil) · telemetri kapalı · `node --test` + olumsuz kanıt (`tests/bozan/`) · CI zinciri.

**Kısıt (ölçülmüş, unutulmasın):** reisim'in Windows'unda **Uygulama Denetimi yerel derlenmiş eklentileri engelliyor** (2026-09-23, next-swc).
→ Seçilen her paket **saf JavaScript ya da WebAssembly** olmalı; yerel `.node` eklentisi isteyen paket (ör. bazı parola özeti, görüntü işleme
paketleri) seçilmez ya da Windows'ta ölçülmeden eklenmez. Sunucuda PDF için başsız tarayıcı gerekiyorsa (aşağıda) Windows'ta çalışıp çalışmadığı
**ölçülecek — bugün ölçemedim**.
**Windows (reisim 2026-10-03: *"eğer windovsta çalışman gerekiyorsa buluttan çıkarıp projeyi normal pencereden devam edelim"*):** maket bulutta biter; **K0'ın ilk günü** (paket seçimi ve ilk derleme) reisim'in Windows bilgisayarında, yerel oturumda yapılır — paketler orada denenir (Uygulama Denetimi). Sonraki işler bulutta ya da yerelde sürebilir; CI her push'ta Linux'ta da denetler.

**Çekirdek (tek üretici; her biri kendi kilit testiyle doğar — 09):**

| Çekirdek parça | Ne yapar | Kural |
|---|---|---|
| Oturum ve giriş | parola özeti, kilit (5 hata → 15 dk, hesap + IP), çerez alt alan adına bağlı, geçici parola, sıfırlama 30 dk | 09-E1–E4 · pkproje karar 34, 37 |
| Kiracı çözümleme | alt alan adı → firma; oturumdaki firmayla eşleşmezse ret | 09-E2 (iskelette `coz.ts` var) |
| `canDo` (tek yetki) | rol × modül düzeyi + özel eylemler (§4); sunucuda her istekte | 07, 09-E4 |
| Güvenli yazıcı | yalnız değişen alan · `surum` ile iyimser kilit · yazma reddi görünür · denetim izine | 09-D1, 07 |
| Denetim izi | kim · ne zaman · ne · eski / yeni · gerekçe; yalnız eklenir (iskelette tablo var) | 09-D3 |
| Durum makineleri | rapor, plan ve öteki akışlar tek modül işlevinde (§5) | 09-D3 |
| Numara üretici | proje, rapor, teklif, sözleşme, gider, izin, tutanak… firma biçimiyle (§6) | pkproje §3.5, §3.7 satır 8 |
| Dosya | kapalı depo, tek anahtar üreticisi, tek indirme ucu, ≤ 5 dk imzalı bağlantı, bayttan tür denetimi, EXIF sil, SVG / HTML yok, `<GizliResim>` | 09-A1–A5, B1–B2 |
| Ayarlar | firma ayarları (§7) + şifreli sırlar (API anahtarı, bulut erişimi, imza sağlayıcı) | ARKA-UC §8 |
| Tanım JSON'ları | sabit tanımlar, sürümlü, karma adlı, çevrimdışı pakete girer (§8) | ARKA-UC §2.1 |
| Format motoru | tanımdan saha ekranı + PDF; doğrulama, otomatik sonuç, kusur listesi | `RAPOR-FORMAT.md` |
| PDF | sunucuda; maketin A4 "kâğıt" düzeni birebir (Bakanlık görünümü); imzalı PDF değişmez, SHA-256 | §8.3 · 09-F1 · §11 108, 235 |
| İmza bağdaştırıcısı | mobil imza (operatör), e-imza (kendi imza aracımız + AKİS), indir-imzala-yükle yedek; istek süresi | §9 otuz altıncı tur · 09-F2 |
| İş kuyruğu | pg-boss, kiracı bağlamıyla, idempotent (§9 işler) | 09-G1 |
| E-posta bağdaştırıcısı | ek yok, kalıcı bağlantı yok, sonuç kayıtlı | 09-G4 |
| Yapay zekâ bağdaştırıcısı | yalnız sunucudan, firmanın anahtarıyla, maskeli, kişi başı sayaç | ARKA-UC §5 · 09-G3 |
| Çevrimdışı eşitleme | cihaz deposu (şifreli), çıkış kuyruğu, işlem kimliği tek seferlik, sürüm çakışması | ARKA-UC §4 · 09-D2, B8 |
| Özet tazeleme | balonlar, Ana sayfa, Performans, gelir-gider özet tablodan | 09-B4 |

**Paket seçimleri (anayasa 1: mimari ayrıntı sorulmaz — gerekçesiyle yazılır, ilk kullanıldığı kalemde ölçülür):** sorgu katmanı ham `pg` + tek
erişim katmanı (ORM yok; RLS'yi gizlemesin) · girdi doğrulama tek şema kitaplığı (sunucu ve istemci aynı şemayı paylaşır) · parola özeti Node'un
yerleşik kriptosu ya da WASM Argon2id (yerel eklenti yok) · pg-boss · S3 istemcisi (saf JS) · PDF: HTML → PDF sunucuda başsız Chromium
(maketteki A4 kâğıt düzeni zaten HTML; birebir çıktı için en kısa yol) — Windows'ta ölçülecek, olmazsa saf JS PDF çizimi · PAdES imza gömme saf JS ·
Excel saf JS · çevrimdışı: servis çalışanı + IndexedDB, mağaza uygulamasında Capacitor + SQLite (K5). **Paket izni (2026-10-03, reisim: *"İzin isteme ne
gerekiyorsa yap pc de yapmamız daha iyi olacak şeyler için pc ye geçmemiz gerekince söyle"*): artık tek tek sorulmaz**; sürüm sabit, saf JS / WASM
kuralı aynen, Windows'ta denenmesi gereken paket ya da iş çıkınca reisim'e "PC'ye geçelim" denir. K0'da eklenenler: `zod` 4.6.5 (şema) · `@playwright/test`
1.63.0 (uçtan uca, yalnız test).

## 3 · Veri modeli (maketten çıkan tablolar)

Her tabloda: `firma_id` + RLS (ENABLE + FORCE + politika) · `id` · `surum` · `olustu / degisti / kim` · silme (357, 2026-10-07): **hiç kullanılmamış
kayıt kesin silinir** (src/server/db/silici.ts — `<tablo>_kullanim` + `<tablo>_sil` tanımlayıcı-yetkili, iz eski değerle, dosyalar çöpe), kullanılmış kayıt
**pasif**, yasal kayıt silinmez (çöp kutusu kayıt düzeyinde henüz yok) · liste uçları yalnız kendi sütunları (09-B3). **Benzersizlik veritabanında** (aşağıda ⚑). Makette karşılığı parantezde.

| Modül | Tablolar | ⚑ benzersiz · not |
|---|---|---|
| Çekirdek | firma (`MV.FIRMA`), firma_ayar + sır, kullanici_oturum, rol_yetki (`MV.MATRIS`), denetim_izi, dosya, cop_kutusu, islem (çevrimdışı) | ⚑ firma kısa kodu, alt alan adı · ⚑ işlem kimliği |
| Personel (2) | personel (`PERSONEL`), hesap (roller, durum: ilk · etkin · pasif), ozluk_belgesi (`OZLUK_TUR`), ekipman_atama (`ATAMALAR`), bordro (`BORDROLAR`), yillik_fazla_calisma | ⚑ hesap e-postası · ayrılana hesap açılmaz · özlük ve bordro G2 erişim kaydı |
| Müşteri (3) | musteri (`MUSTERILER`), tesis (`TESISLER`), musteri_kullanici (`MUSTERI_KULLANICI`; ana giriş + ek giriş, tesis kapsamı) | ⚑ müşteri girişi e-postası · vergi / SGK DETSİS tekrarı **uyarı** · pasif, silme yok |
| Teklif (11) | teklif (`TEKLIFLER`), teklif_kalem, fiyat_listesi (`FIYAT`) | yalnız taslak düzenlenir · çok tesisli teklif · kayıtsız müşteriye teklif |
| Sözleşme (12) | is_sozlesmesi (`IS_SOZLESMELERI`), sozlesme_sablon (`SOZ_SABLON`, sürümlü), isg_katip_id (`ISG`; tesis × denetçi, onay ve bitiş isteğe bağlı) | kullanılmış ID silinmez, düzeltilir |
| Planlama (13) | plan (`PLANLAR` + `ACILAN_PLANLAR`), plan_ekip, plan_ekipman, plan_notu (silinmez), plan_hareketi (denetim izi), tarafsizlik_beyani (metin sürümüyle), saha_formu (imzalı tarama) | ⚑ proje no |
| Ekipman (7, plan içinde) | ekipman (`EKIPMAN`; tesise ait, kalıcı, pasif), ekipman_kod_gecmisi | ⚑ **ekipman kodu firmada** (A–Z 0–9 tire, 3–20) · eski kod başkasına verilmez |
| Ekipman türleri (5) | ekipman_turu (`KATALOG`; branş, Ek-III grubu + "Diğer", periyot, süre, kontrol metodu standartları, ölçüm metodu, gerekli cihaz türleri), rapor_format (`FORMAT_TANIM`; taslak / yayında, sürüm, tanım JSON) | ⚑ tür kodu · ⚑ format (tür, sürüm) |
| Saha ve rapor (14) | rapor (`RAPORLAR`), rapor_surumu (R1…), rapor_cevap (bölüm / alan kimliğiyle, JSONB), rapor_olcum (nokta, RCD, linye, 6.2, 6.3), rapor_cihaz, rapor_foto, rapor_durum_gecis, rapor_geri_gonderme, devreden_kusur | ⚑ **rapor no** · rapor açıldığı format sürümünü taşır · imzalıda tesis / müşteri / personel / cihaz bilgisi **kopyalanır** (§3.2-8) |
| Uygunsuzluk | uygunsuzluk (imzalı ve uygun olmayan rapordan; sonraki imzalı raporla "giderildi") | müşteri Excel'i buradan, PDF'ten okunmaz |
| Onay ve imza (15) | imza_istegi (yöntem, süre, sonuç), belge_onay (`BELGE_ONAY`: bordro, eğitim, zimmet, araç tutanağı) | yanıtsız istek süresi dolar (194) |
| Ölçüm cihazı (8) | olcum_cihazi (`VARLIKLAR` tur=cihaz), cihaz_turu (`CIHAZ_TURLERI`), kalibrasyon (sertifika zorunlu), ara_kontrol (sıklık: günlük · haftalık · aylık · 6 ayda bir) | ⚑ **cihaz kodu** |
| Zimmet (9) | varlik (cihaz · araç · diğer), zimmet_hareketi (`ZIMMET`; fotoğraf, not), zimmet_formu (`ZIMMET_FORMLARI`; güncel / eskidi) | aynı kişiye ikinci teslim yok |
| Araçlar (23) | arac (varlık tur=araç; plaka, marka, model, yıl, yakıt, belge bitişleri, bakım km, kayıttaki km), arac_tutanagi (kalemler, açılar, yakıt, km, hasar), km_kaydi (`KM_KAYIT`; haftalık) | ⚑ **plaka** · km öncekinden küçük olamaz |
| Uyarılar (20) | tablo yok — koşuldan türetilir (kalibrasyon, ara kontrol, eğitim, araç belgesi); özet tablodan | "okundu" yok (168) |
| Müşteri paneli (17) | RLS ikinci katman (firma + müşteri + müşteriye açık); musteri_belge_turu (müşteriye açık personel belgeleri) | 09-E5 |
| Muhasebe (18) | is (plan = iş), fatura (dış numara, tarih), fatura_is, tahsilat, gider (`GIDERLER`; masraf formu + elle), sabit_gider (`SABIT_GIDER`) | ⚑ fatura no · tahsilat kalanı aşmaz · ileri tarih yok · fatura tarihi son imzadan önce olamaz |
| Performans (19) | tablo yok — rapor ve durum geçişlerinden özet | rapor "Yeni"den itibaren sayılır (165) |
| Dökümanlar (4) | standart (sürümlü PDF), dokuman (türü eklenebilir), kontrol_kriter_belgesi (ZPKK — tanım JSON) | ⚑ standart (no, sürüm) |
| Eğitimler (10) | egitim_turu (`EGITIM_TURLERI`; tekrar 1–120 ay), egitim_kaydi (`EGITIMLER`; güncel / önceki) | ileri tarihli kayıt yok |
| Talepler (21) | talep_turu, izin_talebi (`IZINLER`), masraf (gider'e yazar) | izin onayı yönetici, masraf onayı muhasebe |
| Yapay zekâ | yz_kullanim (`YZ_KULLANIM`), yz_okuma (öneri / kabul / düzeltme), yz_sohbet (yalnız firma açarsa) | K1–K6 |
| Diğer | duyuru (İSGGM / İSGÜM / portal, okuma işi), bulut_kaydi (Ö2: müşteri klasörüne kayıt, yeniden deneme), disa_aktarim (S3) | — |

## 4 · Yetki

**Roller** (kişiye küme olarak, ekran yetkisi birleşimdir; `MV.ROLLER`): planlama · denetçi · mekanik yönetici · elektrik yönetici · firma yöneticisi ·
muhasebe. **Müşteri kullanıcısı** ayrı tür (yalnız müşteri paneli). Bizim taraf (firma açma, dondurma): yalnız bizim ekibin küçük yönetim sayfası önerildi (örnek maket; §12 Y1).

**Düzeyler:** değiştirir · görür · branşı · kendi · yok. Başlangıç düzeni (firma yöneticisi değiştirir, "önerilen düzene dön"; yöneticinin Personel'i sabit):

| Modül | Planlama | Denetçi | Mek. yön. | Elk. yön. | Firma yön. | Muhasebe |
|---|---|---|---|---|---|---|
| Planlar | değiştirir | kendi | görür | görür | değiştirir | — |
| Ekipman (plan içinde) | değiştirir | değiştirir | görür | görür | değiştirir | — |
| Raporlar | görür | kendi | branşı | branşı | görür | — |
| Onaylar | — | kendi | branşı | branşı | görür | — |
| Uyarılar | görür | kendi | görür | görür | görür | — |
| Müşteriler | değiştirir | görür | görür | görür | değiştirir | görür |
| Teklifler | değiştirir | — | görür | görür | değiştirir | görür |
| Sözleşmeler | değiştirir | kendi | görür | görür | değiştirir | görür |
| Ölçüm cihazları | görür | kendi | değiştirir | değiştirir | değiştirir | — |
| Zimmetler | görür | kendi | değiştirir | değiştirir | değiştirir | — |
| Araçlar | görür | kendi | görür | görür | değiştirir | — |
| Personel | görür | kendi | görür | görür | değiştirir | — |
| Talepler | kendi | kendi | kendi | kendi | değiştirir | kendi |
| Muhasebe | — | — | — | — | değiştirir | değiştirir |
| Performans | görür | kendi | branşı | branşı | görür | — |
| Ekipman türleri | görür | görür | değiştirir | değiştirir | değiştirir | — |
| Dökümanlar | görür | görür | değiştirir | değiştirir | değiştirir | — |
| Eğitimler (Dökümanlar sekmesi) | görür | kendi | değiştirir | değiştirir | değiştirir | — |
| Firma ayarları | — | — | — | — | değiştirir | — |
| Hareket kaydı | — | — | — | — | görür | — |

**Özel eylemler** (düzeyin üstünde, tek tek `canDo` eylemi; sunucuda zorlanır; yapamayacağı tuş **çizilmez** — anayasa 7.4):
plan aç (planlama yetkisi) · plan kabul / red (plandaki denetçi; beyan okunmadan kabul yok) · ekipman pasife al (denetçi), ekipman sil (kayit_sil: Ekipman'da "yaz" + yönetici — 365) ·
**kayit_sil** (357: hiç kullanılmamış kaydın kesin silinmesi — kaydın modülünde "yaz" VE firma / mekanik / elektrik yöneticisi; matris başka role "yaz" verse de) ·
rapor oluştur / kaydet / onaya gönder / Kaydet ve kopyala (raporu yazan) · rapor sil (denetçi kendi oluşturduğu Yeni raporu; yönetici) · rapor pasife
al (denetçi), aktife al ve sil (teknik yönetici) · onayla / geri gönder (türün branş yöneticisi; vekil: öteki branş "Tüm raporlar") · **durum değiştir**
(teknik yönetici, Tamamlandı hariç) · **revizeye gönder** (teknik yönetici, Tamamlandı'dan) · revize iste (denetçi) · onayı geri al · son imza (raporu
yazan, firma yöntemiyle) · izin onayı (firma yöneticisi) · masraf onayı / ödendi (muhasebe) · bordro yükle ve gör (yönetici + muhasebe) · rol
yetkilerini değiştir, hesap aç / kapat, geçici parola (firma yöneticisi) · mesai ayarı, yapay zekâ ayarı, saklama seçimi (firma yöneticisi) · araç ekle /
düzenle (yönetici) · haftalık km (aracı kullanan + yönetici).

**Rol aynaları:** rol listesi, düzey tablosu, özel eylemler ve RLS politikaları **tek tanımdan** üretilir; ayrı kopya varsa bir test bağlar (07, anayasa 7.1).

## 5 · Durum makineleri (tek modül işlevi, her geçiş denetim izine — 09-D3)

| Nesne | Durumlar ve geçişler |
|---|---|
| **Rapor** | **Yeni** (oluştur; geri gönderilen de Yeni, gerekçe üstte) → **Teknik yönetici onayında** (Onaya gönder) → **Muayene uzmanı imzası** (Onayla; ya da teknik yönetici durum değiştirir) → **İmzaya gönderildi** (mobil / e-imza isteği; süre dolarsa geri döner) → **Tamamlandı** (imza gömülü, müşteriye açık). Yan yollar: geri gönder (gerekçe) · onayı geri al · durum değiştir (Tamamlandı hariç, gerekçe şeritte) · revizeye gönder (Tamamlandı → yeni sürüm R1, eski saklı, müşteri yalnız sonu görür) · revize iste · pasif / aktif · sil. |
| **Plan** | Kabul bekliyor → Kabul edildi (beyanla) → Denetimde (ilk raporla kendiliğinden) → Tamamlandı (kontrol listesi Tamamla + en altta Tamamla; geri alınır) · Reddedildi (gerekçe). |
| Teklif | taslak → gönderildi → kabul / red (gerekçe) / süresi doldu (kendiliğinden). |
| İş sözleşmesi | imza bekliyor → yürürlükte (imzalı tarama) → süresi doldu (12 ay; kendiliğinden yenileme seçeneği). |
| İş (muhasebe) | rapor sürüyor → faturaya hazır → tahsilat bekliyor (vadesi geçti) → kapandı (kendiliğinden). |
| Fatura | bekliyor · kısmi ödendi · vadesi geçti · ödendi. |
| Gider / masraf | onay bekliyor → onaylandı (ödenecek) → ödendi · reddedildi (gerekçe ≥ 5). Elle girilen: ödendi / ödenecek. |
| İzin | onay bekliyor → onaylandı / reddedildi (imzasız ret). |
| Belge onayı (Diğer) | bekliyor → imzalı (mobil / e-imza). |
| Hesap | yok → ilk giriş bekleniyor (geçici parola) → etkin → kapalı (yeniden açılır). |
| Zimmet formu | yok · güncel · eskidi (form sonrası zimmet değişti). |
| Rapor formatı | taslak → yayında (v1, v2 …); açık rapor başladığı sürümde, "Formatı güncelle" ile taşınır. |
| Saklama (5 yıl) | sistemde · arşivde (künye kalır) · silinecek (30 gün önce liste) → çöp (30 gün) → kalıcı silme. |

## 6 · Numaralar (tek üretici; biçim ve önek firma ayarı — §3.7 satır 8)

| Numara | Temel biçim | Kural |
|---|---|---|
| Proje no | `P-AAYY-SIRA` | açıldığı ay; ay içinde sıra; iptalin numarası yeniden verilmez |
| Rapor no | `XX-AAYY-SIRA-EK` | XX firma kodu; SIRA firmada kesintisiz; EK 5 hane rasgele; revizyon `-R1` |
| Teklif · sözleşme · gider · izin | `T-` · `IS-` · `G-` · `I-` + `AAYY-SIRA` | firma biçimi |
| Araç tutanağı · zimmet formu | firma biçimi | form kodu `XX-FR-…` |
| Fatura no | dışarıdan (muhasebe programı, 16 karakter) | ⚑ firmada |
| Ekipman · cihaz kodu · plaka | kullanıcı yazar | ⚑ firmada; çakışan kaydedilmez |

## 7 · Firma ayarları (Firma ayarları modülü, 14 bölüm; başlangıç değerleriyle)

Firma bilgileri (ad, kısa kod, adres, rapor e-postası, akreditasyon no, **nüsha** 2, **logo** → bütün belgelere) · İmza yöntemi (mobil / e-imza) ·
Zimmet teslim formu (teslim eden, başlangıç firma yöneticisi) · Saklama süresi dolan raporlar (5 yıl taban, uzatılır; sistemde kalsın / bulut arşivi /
silinsin) · Ön bilgilendirme formu (firmanın PDF'i) · Mesai takibi (aç / kapa; normal 480 dk, mesai 180 dk, yıllık fazla çalışma ≤ 270 saat, günlük
≤ 660 dk) · Uyarı eşikleri (kalibrasyon 30, kontrolü yaklaşan tesis 30, plan açarken "kontrolü geliyor" 30, eğitim 60 gün; ara kontrol sıklığa göre
0 / 2 / 7 / 30) · Rapor numarası (firma kodu) · Fiyat listesi · Sabit giderler · Bulut kaydı (Ö2: sağlayıcı, kök klasör, düzen) · Yapay zekâ (aç / kapa,
API anahtarı şifreli, model, kişi başı aylık sınır, kullanım) · Müşteriye açık personel belgeleri (tür ekle) · Verileri dışa aktar (Türkçe sütunlu ZIP).
Ayrıca: "Uygun değil" maddede fotoğraf zorunlu (§3.7 satır 14 — format kuralına taşındı, `RAPOR-FORMAT.md` §3) · ÷ 22 iş günü ve işverene maliyet oranı (173).

## 8 · Sabit tanımlar (sürümlü JSON — ARKA-UC §2.1)

81 il + ilçeler · meslekler ve yetkili kişi meslek eşleşmesi (§4.6) · Ek-III grupları + Diğer · Bakanlık formatları **ZPKR01, ZPKR02** ve kriter belgeleri
**ZPKK01, ZPKK02** (öteki formatlar PDF'leri gelince) · topraklama Not-1 … Not-11, eğri çarpanları (B 5 · C 10 · D 15) · format blokları ve hazır şablon
kitaplığı · başlangıç cihaz türleri, eğitim türleri, gider türleri + KDV varsayılanları, izin türleri, özlük belge türleri, belge onay türleri · araç
tutanağı kalemleri ve fotoğraf açıları · rapor / plan / teklif … durum adları · yasal mesai sınırları · resmî tatil takvimi (izin iş günü — **makette yok**,
eklenecek) · başlangıç rol × modül düzeni.

## 9 · İş kuralları kataloğu — ENGEL / UYARI (makette ölçülmüş davranış)

Genel ilke: **kural uyarıdır, engel değil** (§9 on ikinci tur). Engeller reisim'in açık kararıdır ya da veri bütünlüğüdür; **cihazda da, sunucuda da**
denetlenir, çelişirse sunucu kazanır (ARKA-UC §4.4).

**ENGEL (kayıt / eylem yapılmaz):**
1. İleri tarihli plana **rapor oluşturulmaz** (gerçek takvime göre; bugün ve geçmiş açık) — 213, 239–240.
2. Türün gerekli ölçüm cihazı eksik ya da **kalibrasyonu geçmiş** cihazla rapor **onaya gönderilmez** (59, 91, yirmi dördüncü tur).
3. **Mesai** açıksa günlük süre (normal + izin verilen fazla çalışma, yıllık sınır) dolunca **yeni rapor ve kopya oluşturulmaz** (212, AA2).
4. **Eşsizlik:** ekipman kodu · cihaz kodu · plaka · proje / rapor / fatura no · müşteri girişi e-postası · belge türü adı · standart no + sürüm.
5. Format zorunlu alanları eksikken **onaya gönderilmez** (pencere + kırmızı alanlar + ilk eksiğe kayar; §3.8-5); Bakanlık zorunlu alanları silinmez.
6. **İmzalı rapor değişmez** (düzeltme yalnız revizyon).
7. Tarih bütünlüğü: ileri tarihli fatura / tahsilat / gider / eğitim kaydedilmez · fatura tarihi son imzadan önce olamaz · bitiş başlangıçtan önce olamaz ·
   haftalık km öncekinden küçük olamaz · tahsilat kalanı aşamaz · net maaş brütten büyük olamaz · günlük çalışma 660 dk'yı aşamaz.
8. Ayrılan personele hesap açılmaz · aynı kişiye ikinci kez teslim edilmez · mobil imza telefonu yoksa mobil imzaya gönderilmez (öteki yol açık).
9. Teklif yalnız taslakken düzenlenir · kullanılmış İSG-KATİP ID silinmez.
10. **Firmanın deposu bağlanıp denenmeden firma açılmaz**; depo kesilemez, yalnız değiştirilir (yeni depo denenir, taşınır) — reisim 2026-10-03, pkproje §11 255.
11. **Bizim kod imzalı rapor PDF'lerini ve aylık arşiv yedeklerini saklama süresi (en az 5 yıl; firma 6–20 yıla uzatabilir — reisim "2 olsun") dolmadan silmez; süre dolunca depodan siler** (30 gün önce firma yöneticisine liste) — reisim 2026-10-03: *"biz kurgulayalım, depoda 5 sene sonra silcek şekilde kodla , müşteri deposunu bağladıktan sonra siler silmez kendi bilir"*. Depo kilidi (nesne kilidi) kullanılmaz; firmanın kendi deposunda elle sildiği dosya firmanın sorumluluğu.

**UYARI (kayıt olur, şerit / pencere söyler):** plan günü geçmiş tarih (G1) · İSG-KATİP ID yok / geç onay / bitmiş · EKİPNET boş · meslek türe yetkili değil · türe ekipman ataması
yok · saat ya da gün çakışması · plan günü iş sözleşmesi dışında · tesiste ikinci açık plan · vergi no / SGK DETSİS no boş ya da tekrar ("Yine de
kaydet") · fotoğrafsız teslim · belgesi olmayan gider · haftada 3.000 km'den fazla artış · zorunlu olmayan alan eksik · "Uygun" seçildi ama uygun değil
madde var · kalibrasyonu 30 gün içinde bitecek · aynı dönemin bordrosu var (yenisi yerine geçer) · yıllık izin hakkı aşılıyor · araç belgesi yaklaşıyor /
geçti · zimmet formu eskidi · müşteri girişi yok.

## 10 · Yapım sırası (kalemler; her kalem = bir teslim, testiyle)

| Faz | Kalemler | Bitti tanımı |
|---|---|---|
| **K0 Hazırlık** | paket seçimleri ve indirme izni · göç düzeni · ortak şema kitaplığı · tasarım kalıbı 20'nin üreticileri (liste ↔ tablo, filtre kutusu, seçim alanı, takvimli tarih, pencere, bildirim, onay penceresi, bilgi yüzleri, şerit, uzun tuş) React bileşeni olarak | kalıp sayıları ve maket görünümüyle ölçülerek aynı · kilitleri yazıldı |
| **K1 Çekirdek** | giriş · oturum · kiracı · `canDo` + rol düzeni · güvenli yazıcı · denetim izi · dosya ucu · numara üretici · firma ayarları · tanım JSON'ları · API sürümü · hata / yetkisiz / oturum doldu sayfaları | 09 A, D, E maddelerinin kilitleri (iki firmalı, iki müşterili gerçek PostgreSQL testi) |
| **K2 Kayıt ekranları** | Personel (hesap, rol yetkileri, özlük, atama, bordro) · Müşteriler / tesisler / müşteri girişi · Ekipman türleri + Dökümanlar (standartlar, kriterler, eğitimler) · Ölçüm cihazları · Zimmetler · Araçlar · Sözleşmeler + İSG-KATİP | maketteki o grubun ölçüm denetimleri uçtan uca testte geçer |
| **K3 Saha omurgası (çevrimdışı ilk günden)** | Format motoru (ZPKR01, ZPKR02, kompresör tanımdan) → Plan aç → Planlar / plan içi → saha raporu (cihaz, kriter, ölçüm, fotoğraf, kusur, sonuç, mesai, Kaydet ve kopyala, fotoğraftan okuma yeri) → Onaylar → imza (önce indir-imzala-yükle, sonra mobil imza) → PDF → Raporlar → müşteri paneli + uygunsuzluk | omurga uçtan uca (teklifsiz) çalışır · çevrimdışı kuyruk ölçüldü (bağlantı kes / gönder / çakışma) · PDF Bakanlık formatıyla görsel karşılaştırma |
| **K4 Masaüstü modülleri** | Teklifler · Muhasebe (iş, fatura, tahsilat, gider, sabit gider, gelir-gider, kârlılık) · Performans · Talepler · Uyarılar · Ana sayfa (rol başına, duyurular) · Onaylar › Diğer · Firma ayarları kalan bölümler · Verileri dışa aktar · Format kurucu | maketin ilgili grupları geçer |
| **K5 Arka plan ve dış servisler** | pg-boss işleri (§ ARKA-UC 7) · e-posta · e-imza aracı (Windows, kod imzalama) · bulut kaydı / arşiv · yapay zekâ (önce fotoğraftan okuma, sonra S.A.Y) · İSGGM duyuru okuma | her iş idempotent, kiracı bağlamlı; deneme setiyle ölçüm (yapay zekâ). **2026-10-08:** fotoğraftan okuma yapıldı (351); zamanlı iş çatısı + gece çöp temizliği yapıldı (378: Vercel Cron → /api/is/gece, is_calisma); İSGGM / İSGÜM / portal duyuru okuma yapıldı (379: Ana sayfa açılınca, 6 saatte bir); S.A.Y çekirdeği yapıldı (380: her sayfada, kalıcı geçmiş, kuralla hızlı sorular, serbest soru) |
| **K6 Mağaza uygulaması** | Capacitor (kamera, SQLite, arka planda gönderme) | gerçek cihaz teyidi (reisim'den, anayasa 11.2) |
| **K7 Yayın** | Supabase projesi (AB) + uygulama barındırma (AB), alan adı, joker SSL, yedek + **geri yükleme denemesi**, izleme, duman testi (09-G5), deneme (staging) ortamı | geri yükleme ölçüldü · duman testi yeşil |

Yöntem (her kalem): uyum beyanı → maketi ve ilgili kural maddelerini yeniden oku → kod → kilit testi + olumsuz kanıt → maketin o ekran için ölçüm
denetimleri geçer → 1920 · 1080 · 375 × açık / koyu gözle → commit + push (CLAUDE.md §5).

## 11 · Test ve kilit planı

- **09'un her maddesi bir kilit testiyle doğar** (maddenin "Kilit" satırı); kilidi olmayan madde "kuruldu" sayılmaz (anayasa 0.10).
- **Maketin ölçüm denetimleri kabul testidir:** bugün 19 grupta ~700 davranış denetimi (planlar 65 · personel ve ayarlar 115 · saha raporu 126 · raporlar
  / onaylar 54 · muhasebe 49 …) + her ekranın üç genişlik × iki tema düzen ölçümü. Kodlanan her ekran aynı denetimleri Playwright'ta geçer (seçiciler
  aynı kalırsa doğrudan taşınır — bileşenler maketteki `id` / `data-` adlarını korur).
- **Görsel referans:** dondurulmuş ekran (Planlar + plan içi) ve Bakanlık formatlı PDF için ekran görüntüsü karşılaştırması.
- **Güvenlik:** iki firmalı + iki müşterili gerçek PostgreSQL testleri (başka firmanın / müşterinin kaydı ve dosyası 404) · anonim dosya 403 ·
  yapay zekâya giden gövdede maskelenecek alan yok · SVG / sahte uzantı reddi · CSRF.
- **Olumsuz kanıt:** her kilit için `tests/bozan/` kopyası (kaynak diskte değiştirilmez — anayasa 13.11).

## 12 · Kodu bekletmeyen ama yayından önce gereken kararlar / hesaplar

| # | Konu | Durum | Önerim |
|---|---|---|---|
| **Y1** | **Firma açma** (her firma kendi alt alan adında: `ornekfirma.probata.com.tr`) | **2026-10-03:** firma başına site / kurulum **yok** (reisim: *"şirket açma paneline gerek yok"*). Tek kod, tek sunucu; alt alan adı firmayı seçer. Firma kaydı (ünvan + kısa kod + alt alan adı + ilk firma yöneticisi, geçici parola) **bizim** tarafta açılır. Reisim *"nasıl bi arapanel işimizi görür … örnek göster"* dedi → örnek maket `maket/yonetim.html` (pkproje §11 247): yalnız bizim ekibin küçük sayfası. ✅ **Karar (2026-10-03, reisim: *"Yönetim sayfa önerini kabul ediyorum"*): bu sayfa** (komut satırı aracı yok) | K1'de firma açma işlevi (sunucuda, yalnız biz; ayrı adres + iki adımlı giriş); dondurma tek bayrak (07). Joker SSL sayesinde alt alan adı için ayrı ayar gerekmez. ✅ **Yapıldı 2026-10-06 (pkproje §11 348):** /yonetim, PROBATA_YONETIM_ALAN, parola + doğrulama kodu, göç 0050 (probata_yonetim rolü); depo engeli S3 ile K7'de |
| **Y2** | **İlk açılışta toplu Excel içe aktarma** | **maketlendi 2026-10-03** (Firma ayarları › Toplu içe aktarma: müşteri + tesis, ekipman, ölçüm cihazı, personel, araç; şablon, satır satır denetim, geri alma) | K2 sonunda; sunucuda aynı denetim, tek işlem (hepsi ya da hiçbiri), denetim izine |
| **Y2b** | **Depolama, arşiv ve yedek** (G2 + G3; 2026-10-03 reisim: *"yedekleme deposu olmadan şirket açılmasına izin verilmesin probata  gün saklar gibi bir alternatif olamaz, müşteriler hukuken raporları 5 yıl arşivlemek durumunda ona göre kurgula tekrar"* · *"elle yedekleme olmasın"* · *"kendi depolarında da yedekleri ve raporlar düzenli arşivlensin"*) | ✅ maketlendi (Yönetim › Firma aç: depo zorunlu · Firma ayarları › Depolama ve yedek; pkproje §11 254–255) | K1: firma kaydında depo zorunlu (S3 uyumlu adaptör, firma başına uç / kova, sırlar şifreli); K3: imza anında PDF → depo `arsiv/raporlar/YIL/Müşteri ünvanı/RaporNo[-Rn].pdf` (okunur — reisim "evet okunur olsun"; `calisma/` okunmaz kimlik, 09-A1 istisnası); K5: pg-boss yedek işi (saatlik / günlük / haftalık; aylık ilk yedek 5 yıl), 5 yıl dolmadan silme yok, 5 yıl dolunca silme işi (30 gün önce liste; nesne kilidi yok — firmanın elle silmesi kendi sorumluluğu); depo erişim denetimi işi (erişilemezse firma yöneticisine şerit, yönetim listesinde durum). probata deposu / probata'da yedek yok. |
| Y3 | ~~Sunucu sağlayıcı (Türkiye)~~ → **Supabase (AB) + uygulama barındırma (AB), G3** · alan adı `probata.com.tr` · ~~KVKK hukukçu teyidi~~ (reisim 2026-10-03: *"kvkk falan yapma yok gerek yok öyle bir şeye zaten herkes kendi raporunu kendi tutacak"*) | "vakti gelince" (182–183) | K5 başında; operatör IP yetkisi sabit adres ister |
| Y4 | E-posta servisi (Türkiye, SPF / DKIM / DMARC) | açık | K5 |
| Y5 | Mobil imza operatör sözleşmesi (probata yapar — 179), zaman damgası; e-imza aracı için kod imzalama sertifikası | karar var, sözleşme yok | K3 sonunda başvuru (test ortamı) |
| Y6 | ~~KVKK: veri işleyen sözleşmesi, saklama / imha politikası, yapay zekâ yurt dışı aktarım (hukukçu)~~ — yapılmaz (reisim 2026-10-03: *"kvkk falan yapma yok gerek yok öyle bir şeye zaten herkes kendi raporunu kendi tutacak"*); **mağazalar gizlilik politikası ve uygulama içi hesap silme ister** | giriş sayfasındaki metin "gerek yok" dendi (R3-5) | Metin giriş sayfasına konmaz; mağaza ve sözleşme için ayrı belge (K6 öncesi) |
| Y7 | Apple / Google geliştirici hesapları | yok | K6 |
| Y8 | Öteki türlerin Bakanlık formatları (PDF) · araç tutanağı kalemleri / açıları / taahhüt metni · giderler Excel'inin sütunları · toplu bordro · sabit gider düzenleme ayrıntısı | açık | geldikçe tanım / şablon olarak; kodu bekletmez |
| Y9 | Resmî tatil takvimi (izin iş günü hesabı) | makette yok | tanım JSON'u, yıllık güncelleme |

## 13 · Maketten koda geçmeyecek olanlar (makette geçici — §9 otuz üçüncü tur)

Sabit "bugün" (23.09.2026) ve uydurma veri (yalnız test fikstürü olur; gerçek sunucuda hiç yok) · tarayıcıda kalıcı maket (localStorage / IndexedDB) ·
tarayıcı yazdırmasıyla PDF · `mailto:` ile e-posta · "Makette bakış" / "Sürücü görünümü" / rol anahtarları (kodda oturumdaki kişi ve rolü belirler) ·
uydurma imza / yapay zekâ cevapları · çevrimdışı göstergenin elle açılması · maket içi ölçüm kancaları. Bunların yerine §2'deki gerçek bağdaştırıcılar gelir.

## 14 · Riskler

| Risk | Önlem |
|---|---|
| Çevrimdışı kuyruk sessiz veri kaybı (anayasa 10.6: riskli iş) | ilk günden saha omurgasında, ölçülerek; sessiz kayıp yok, düşen işlem kırmızı |
| Format motoru elle kurulmuş üç ekranı birebir çizemez | K3'ün ilk kalemi: üç tür tanımdan çizilir, ekran görüntüsüyle karşılaştırılır |
| Windows Uygulama Denetimi yeni paketleri engeller | yerel eklentisiz paket; her paket reisim'in bilgisayarında ilk gün denenir (CI Linux'ta geçse de) |
| Mobil imza operatör süreci uzun sürer | indir-imzala-yükle yedek yol ilk sürümde hazır |
| Yapay zekâ maliyeti / doğruluğu | firma ayarıyla kapalı başlar; deneme setiyle ölçüm (ARKA-UC §5.5) |

---

**Hazır mıyız:** kural tarafı ve yapım haritası hazır. **G0** ve **G1** kabul edildi (2026-10-03); reisim "başlayalım" dediğinde
ilk kalem **K0 Hazırlık** (paket seçimleri + ortak bileşenler).
