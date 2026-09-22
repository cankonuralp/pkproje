---
name: calisma-anayasasi
description: "⛔⛔ ÇALIŞMA ANAYASASI — bugüne kadar öğrenilen TÜM disiplinlerin tek listesi (14 bölüm). Her işin BAŞINDA oku, iş tipini bul, o bölümü uygula. Ayrıntı için bağlantılı dosyalara git."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 143efef1-a37a-4eec-926e-cf1a71f8dbf8
  modified: 2026-09-12T16:22:47.316Z
---

> ## ⛔ BU DOSYA HAKKINDA (aktarım tamamlandı, 2026-09-22)
>
> Bu, **pkproje'nin çalışma anayasasıdır**. Metin, bir üretim projesinde (çok kiracılı web uygulaması)
> yıllar içinde biriken anayasadan aynen geldi; reisim: *"aktardık ve bitti"*. Örnekler, dosya adları,
> commit numaraları, ekran ve modül adları o projeden gelir. **Kural geneldir, örnek bağlamdır.**
>
> Kullanım:
> - Kurallar **aynen geçerli**. Bu projeye uymayan bir madde görürsen uygulamadan önce sor —
>   kendi kararınla atlama.
> - Geçmişe dönük referansları (commit numarası, modül adı, tarih) yenileriyle **değiştirme**.
>   Kuralın nereden geldiğini anlatırlar; silindiğinde kural gerekçesiz kalır ve ilk itirazda düşer.
> - Somut sayılar (ölçüler, eşikler, genişlikler) bu projenin kendi ölçümüyle değişir. Değiştirirken
>   **ölçümü yazarak** değiştir — "kabul edilen" ve "reddedilen" örneği birlikte bırak.
> - `00`–`08` numaralı dosyalar aynı kuralların **koddaki kanıtını** (`dosya:satır` + gerçek kod) taşır;
>   birlikte okunur. `TASARIM-KALIBI.md` görsel işin kalıbıdır.
> - ⛔ **DEPO HERKESE AÇIK (2026-09-22):** önceki ürünün alan adı ve gerçek müşteri adı bu dosyadan
>   çıkarıldı (canlı bir ürünü hedef göstermemek için). Kuralların gerekçeleri, tarihleri ve olayları
>   olduğu gibi duruyor. Buraya hiçbir gerçek müşteri/firma/kişi adı yazılmaz (5.8 · 10.3).


# ÇALIŞMA ANAYASASI — aynı hatayı iki kez yapmamak için

Reisim (2026-09-08): *"bu zamana kadar öğrendiğimiz tüm disiplinleri sıralayıp bir kalıcı
hafıza oluşturalım, sürekli aynı hataları tekrarlamayalım."*
Aynı gün ikinci geçiş: *"bu anayasayı her seferinde dikkate alarak iş yap."*

**Nasıl kullanılır:** işe başlamadan önce yapacağın işin tipini bul, o bölümün maddelerini
uygula. Her madde ZOR KAZANILDI — hepsinin arkasında canlıda yaşanmış bir arıza var.

---

## 0 · HER İŞTE (istisnasız)
1. ⛔⛔ **ÖNCE BU ANAYASAYI OKU.** İşin tipini belirle (görsel · veri · canlı veri · yeni
   modül · doğrulama), o bölümü uygula. Reisim'in kuralı: *"her seferinde dikkate alarak
   iş yap."* Bu, iş bittikten sonra hatırlanacak bir liste değil — **işe başlama şartı**.
   ⛔⛔ **2026-09-11 — artık YAPISAL:** `.claude/settings.local.json` SessionStart kancası
   (`startup|resume|compact`) bu dosyayı her oturum açılışında, devam ettirmede ve SıKIŞTIRMA
   SONRASI bağlama otomatik enjekte eder. Reisim iki kez uyardı (test ödevi — madde 0.4);
   sebep: indeks satırına güvenip dosyayı okumamak. Kanca okumamayı imkânsız kılar.
   ⚠️ **2026-09-15 ÖLÇÜM:** kanca çıktısı büyükse (bu dosya 24 KB) bağlama yalnız **ilk 2 KB önizleme** girer,
   gerisi dosyaya yazılır → "kanca yükledi" sanıp okumamak mümkündü. Düzeltme: kanca ÖNCE `oturum-acilis.md`
   çeklistini (2 KB altı, dosya yollarıyla) basar, ardından anayasa + **tasarım kalıbı**. Oturum başında iki dosya
   `cat` ile TAM okunur; önizlemeyi okumak = okumamak. Kalıp da kancada: reisim *"genel tasarım şablonumuza uyacağız."*
2. **Türkçe konuş, "reisim" de.** Canlı ürün: **bu projede henüz yok** — yayına çıkınca buraya yazılır.
   (Önceki projenin alan adı, depo açık olduğu için 2026-09-22'de kaldırıldı.)
3. **Teslim zinciri:** `npm test` → `npm run build` → `firebase deploy` → **Chrome eklentisiyle
   CANLIDA bak** → commit → ⛔⛔ **`git push`** (çalışılan dal + `main` fast-forward).
   ⛔ localhost'ta bakma ([[gorsel-dogrulama-chrome]]).
   Kural/fonksiyon değiştiyse `--only database` / `--only functions` AYRICA çıkar; hosting yetmez.
   ⛔⛔ **PUSH KURALI (reisim 2026-09-12):** *"her işlemden sonra github'a push yapıyor musun? en son
   güncelleme 2 ay önce gözüküyor — anayasaya bunu da ekle."* İki ay boyunca 175 commit yalnız yerelde
   kalmıştı. Her teslim `git push origin <dal>` + `git push origin HEAD:main` (main dalın atasıysa) ile
   biter; push yapılmadan teslim mesajı YAZILMAZ.
   ⛔⛔ **ZİNCİR TEST KAPISINDA DURUR:** `npm test` çıktısında `fail 0` yoksa build/deploy YAPILMAZ (T1 teslimi
   2026-09-14'te test düşerken yayınlandı → 13.6).
4. ⛔⛔ **TESTİN TAMAMI BENDE — REİSİM'E İŞ BIRAKMA** (2026-09-08 kuralı: *"bundan sonra
   tüm testleri sen yap bana iş bırakma"*). Her değişikliği **ben** eklentiden canlıya girip
   **GÖZLE** doğrularım; **web ve mobil AYRI AYRI**. Reisim'e verilen "🧪 nasıl test edersin"
   artık **ödev değil, KANIT ÖZETİ**: ne baktım, nerede, ne gördüm.
   ⛔ Terminal komutu KOYMA (npm test / build / deploy benim zincirim).
   ⛔ "Sen bir bak" deme — ben bakarım; bakamadığım şeyi **açıkça bakamadım diye yazarım**
   ([[delivery-test-steps]]).
5. **Elle adım varsa net talimat + teyit iste**, "yapmış say geç" yok ([[confirm-user-todos]]).
6. **Ölç, tahmin etme.** Sayı iddiası varsa gerçek ölçümle destekle ([[veri-mimarisi-standart]]).
7. **Yapamadığın/atladığın parçayı açıkça söyle.** Kapsamı kendi başına daraltma.
8. ⛔⛔ **HATA = SINIF, YAMA YOK** (reisim 2026-09-12, üçüncü kez: *"her seferinde 'yama yapma, hatayı
   kökünden çöz, tek bir yer için değil tüm site için çöz' hatırlatması yapmak zorunda olmak istemiyorum"*).
   Bir hata bulununca: (a) aynı mekanizmanın geçtiği HER ekran/modül taranır ve hepsinde düzeltilir,
   (b) şirkete/veriye özel davranış YASAK — "A şirketinde çalışıyor, B şirketinde çalışmıyor" = birim yanlış
   seçilmiş demektir (çizelge sayfalaması ekipman yerine BLOK sayıyordu), (c) düzeltme mekanizmaya yapılır,
   testle kilitlenir ([[onleyici-tasarim-ilkesi]]).

9. ⛔⛔ **KENAR BOŞLUĞU YOK — ÖLÇMEDEN TESLİM YOK** (reisim 2026-09-12, ÜÇ KEZ: öğlen sayfalar, akşam
   çizelge, gece e-posta: *"şu kenarları boş bırakma saçmalığından vazgeç artık, kaç defa demem gerekecek?"*).
   Ürettiğim HER yüzey — sayfa, modal, önizleme, e-posta gövdesi, PDF sayfası, artifact maketi — kabını
   doldurur; "okunur sütun / max-width" gerekçesi YOK. Teslimden önce ölç ve kanıt özetine yaz:
   kart genişliği = kap genişliği (kenar ≤ 1 px), 1920 ve 375'te. Bkz. [[tasarim-kalibi]] kural 10.

10. ⛔⛔ **"KAPANDI" DEMEDEN KAPSAMI KALEM KALEM SAY** (2026-09-14 gece, iki kez yakalandı): Makine yol haritasına
   üç öneriye bakıp "kapanmış say" dedim — 31 kalemin 18'i eksikti. Yetki kapısını createUser + setUserRolePerms'e
   koyup "kapandı" dedim — deleteUser, hedefin mevcut seviyesi ve görme yetkileri açık kalmıştı; ret metni de eski
   kuralı söylüyordu. Kural: bir kararı/listeyi kapatmadan önce (a) listenin HER kalemini tek tek işaretle,
   (b) aynı kuralı uygulayan BÜTÜN yolları (oluştur · değiştir · sil · ekran metni · sunucu · kural) grep'le say,
   (c) kanıt özetinde "kapandı" yalnız sayılan kapsama söylenir. [[kume2-kalan-isler-2026-09-14]]

11. ⛔⛔ **GÜNDEM DİSİPLİNİ — PARÇA PARÇA** (reisim 2026-09-14 gece): başlanmamış modülün tek satırını bile önüne getirme ·
   yeni konu/karar listesi açma · bir teslimde BİR kalem · gündem dışı her şey not defterine, ASLA unutulmaz.
   Aktif gündem [[gundem-tesis-bakim-2026-09-14]] · ertelenenler [[ertelenen-notlar]] + [[modul-yeniden-yapim-hatirlatma]]
   (bir modüle/konuya BAŞLARKEN oku, reisim'e hatırlat). Ayrıntı [[gundem-disiplini]]. Arayüzde HİTAP YOK ([[arayuz-metni-kurali]]).

12. ⛔⛔ **UYUM BEYANI — HER KALEMİN BAŞINDA VE SONUNDA** (reisim 2026-09-15: *"anayasaya uyacağız, genel tasarım
   şablonumuza uyacağız ve bir işi yaparken başka işleri bozmamaya özen göstereceğiz."*). Okumak yetmez, uygulandığı
   GÖRÜNMELİ. Kalem açılırken tek blok: **iş tipi** · uygulanacak **anayasa bölümleri** (numara) · uygulanacak **kalıp
   kuralları** (numara, [[tasarim-kalibi]] çeklisti) · kullanılacak **mevcut üretici/sınıflar** · **etki alanı** (dokunulacak
   semboller + kullanım sayıları, 13.1) · önceki canlı commit. Teslimde kanıt özetinin ilk iki satırı **UYUM** ve **ETKİ ALANI**
   olur; beyandaki her madde ölçümüyle işaretlenir, işaretlenmemiş madde = kalem kapanmadı (0.10 ile aynı mantık).
   Beyanı olmayan kaleme kod yazılmaz.

13. ⛔⛔ **ALAN BİLGİSİ DOSYASI — `pkproje.md` HER OTURUMDA TAM OKUNUR** (bu projede eklendi, reisim 2026-09-17:
    *"Öğrendiklerini de unutma ve proje içine pkproje.md oluşturarak kalıcılaştır, anayasaya da pkproje.md'yi okuma
    görevi de ekle."*). Proje kökündeki `pkproje.md` ürünün alan bilgisini (mevzuat, akış, roller, emsal inceleme,
    açık sorular, alınan/alınmayan kararlar) taşır; anayasa ve tasarım kalıbıyla birlikte oturum başında `cat` ile
    TAM okunur, önizleme = okumamak (0.1). Yeni öğrenilen her şey aynı teslimde bu dosyaya yerinde işlenir (12.1);
    dosyadaki hiçbir madde reisim onayı olmadan yapılacak iş değildir (1, 0.11). Kod, kurgu bitmeden yazılmaz.

## 1 · SORULUR / SORULMAZ
- ⛔ **SORMA** (mevcut düzene uy): mimari desen, kök adı, dal düzeni, adlandırma, 4 ayna,
  lazy-load, `stampTouch`, kabuk çeklisti, entegrasyon bağlantıları. Reisim: *"sorman bile hata."*
- ✅ **SOR**: ürün davranışı, kimin neyi göreceği, iş akışı sırası, bildirim kime gidecek.
- ⛔ **BİLDİRİM**: reisim demeden HİÇBİR modüle bildirim kurma ([[bildirim-yapma-kurali]]).
- ⛔ **Reisim'in çalışan yöntemini kendi yaklaşımınla değiştirme** ([[yikici-fix-dersi]]).

## 2 · GÖRSEL / UI İŞİ
1. **ÖNCE MAKET, ONAY, SONRA KOD** — sözlü yön verse bile ([[visual-approval-first]]).
2. **Maket masaüstü + mobil AYRI** sunulur; web-native (masaüstü grid/tablo, mobil kart) —
   uzun-ince liste yok ([[maket-masaustu-mobil-ayri]] [[web-mobil-ayri-tasarim]]).
3. ⛔ **Ajan/Workflow açma** — kendin düzelt, token yakma ([[gorsel-degisiklik-ajan-yok]]).
4. ⛔ **Palete dokunma**, palet değişikliği ÖNERME ([[renk-paletine-dokunma]]).
5. **İkon = SVG**, emoji yasak (yazdırma/PDF hariç) ([[svg-ikon-her-yerde]]).
6. **Arayüz metni**: belirsiz özne / tarihsiz söz / iç jargon / katalog tekrarı YASAK;
   **yapılamayanı hiç gösterme** ([[arayuz-metni-kurali]]).
7. **Nesne sayfası kalıbı** (mahal · ekipman · analiz ortak): ekmek kırıntısı + kimlik +
   tıklanır bilgi yüzleri + tek birincil düğme + araç çubuğu ([[mahal-nesne-sayfasi]]).
8. **Sayaç DÜRÜST olur**: süzgeç açıkken "3 / 12"; yüzdeki sayı tıklayınca çıkan liste
   uzunluğuyla AYNI ölçütten hesaplanır. Hesaplanamıyorsa **0 değil "—"** (bkz. 4.12).
9. ⛔ **ANA TEMAYA UYUM — paralel görsel dil kurma.**
   · Renk/ölçü/köşe/gölge **mevcut CSS değişkenlerinden**: `--card --bg --bg2 --brd --txt
     --txt2 --txt3 --accent --accent2 --gbg/--gtxt --rbg/--rtxt --obg/--otxt --r8/--r12/--r16
     --sh1`. **Sabit renk (`#fff`, `#333`) yazma** — koyu temada kırılır.
   · **Mevcut sınıfları yeniden kullan**: `btn btn-primary/secondary btn-sm`, `form-input`,
     `form-select`, `prs-head`, `prs-tabs`, `prs-row-sub`, `prs-pill`, `fb-chip`, `empty-state`.
     Aynı işi yapan ikinci bir sınıf ailesi AÇMA.
   · Yeni sınıf gerekiyorsa **modül önekiyle** (`okut-`, `mahal-`, `eqg-`) ve kaba scope'lu.
   · **Açık ve koyu temanın İKİSİNDE de bak** — tek temada çalışan ekran bitmiş değildir.
   · Yoğunluk mevcutla aynı: tablo satırı ~40px, kart iç boşluğu ~14px, mobil dokunma alanı ≥38px.
   · ⛔⛔ **REFERANS VERDİĞİN DEĞİŞKEN GERÇEKTEN TANIMLI MI — DOĞRULA.** Tanımsız `var(--x)`
     SESSİZ değil YIKICIDIR: `font:700 12px/1 var(--sans)` tanımsızsa **kısayolun TAMAMI**
     geçersiz olur, eleman 700/12px değil gövdeden miras 400/16px alır. Kanıt (2026-09-08,
     canlıda ölçüldü): `--sans` **29 yerde kullanılıyor, hiçbir yerde tanımlı değil**.
     Kontrol: `grep -- "--x:" src/style.css` → 0 çıkıyorsa o değişken YOK. Ev üslubunu
     kopyalarken hatayı da kopyalıyorsun.
10. **SUNUM — kapsamlı iş maketle değil sunumla açılır.**
    Yeni modül · ekranın yeniden tasarımı · mimari karar · faz planı → **Artifact sunumu**.
    İskelet: **sorun → ÖLÇÜM (bugün kaç dokunuş/kaç KB/kaç saniye) → tasarım (masaüstü +
    mobil AYRI) → ekranın kuralları → sıra/faz tablosu → sonunda NET KARAR SORULARI**.
    ⛔ Sunumda da SVG ikon, ⛔ gerçek hesap/müşteri/tesis adı yasak, ⛔ palet değişmez.
    Sunum onaylanmadan tek satır kod yazılmaz; onaylandıysa kapsam **sunumdan** okunur,
    sohbetten değil — koda başlamadan sunumu YENİDEN OKU.
    **Maket mi sunum mu:** tek ekranın düzeni değişiyorsa **maket** yeter; yeni modül, çok
    ekranı ilgilendiren karar, faz planı ya da "şunu neden böyle yapalım" sorusu varsa **sunum**.
    Sunum **yayınlanır ve linki verilir** (Artifact); sohbete gömülü uzun metin sunum değildir.
    ⛔ **MAKETLİ SUNUMDA İKİ AD ALANI** (2026-09-15, kestirimci bakım sunumu): sunumun kendi CSS'i ile maketin CSS'i aynı sayfada →
    çıplak genel sınıf adı (`.ust` `.alt` `.ok`) maketteki aynı adı sessizce ezdi (aşama çubuğu 375'te döndü). Sunum sınıfları sunuma
    özgü adla, maket sınıfları `a-` önekiyle yazılır. Çerçeve yüksekliği sabit YAZILMAZ, içerikten ölçülür; ölçek `.cihaz` genişliğini de
    izler (görünmez yüklemede 0 kalıyordu). Yayından önce ölçülür: dosya geçici olarak `.domtest/`e kopyalanır, önizleme bölmesinde
    izleyici 1920 · 1080 · 375'te her çerçeve için çakışma / kırpık / kesik yükseklik sayılır, sonra kopya SİLİNİR (`git status` temiz).
    ⚠️ Ölçek 0 iken dikdörtgenler sıfırdır ve "çakışma 0" YALANCI çıkar — önce ölçeği oku. Önizleme bölmesinde görünüm taklidi
    ResizeObserver'ı tetiklemiyor: her genişlikte `resize` olayı elle atılır ve ölçeğin genişlikle DEĞİŞTİĞİ görülmeden sayı yazılmaz.
11. ⛔⛔ **TABLET ÜÇÜNCÜ CİHAZDIR — DARALTILMIŞ MASAÜSTÜ DEĞİL** (reisim 2026-09-15, iPad fotoğrafı: *"tablette ve/veya
    mobilde yan ekran açılır kapanır olmalı, bakım çizelgesi kaydırılabilir olmalı, sıkıştırılmış okunamaz yazı kabul edilemez"*).
    Bugüne kadar İKİ düzen vardı (≥1000 masaüstü · <1000 telefon); iPad yatay 1024–1194 px masaüstü sayılıp 246 px SABİT panel +
    12 aylık ızgara ~790 px kaba sıkışıyordu. Kural: (a) **tablet bandı 1000–1279 px**: yan panel **DİKEYDEKİ GİBİ ☰ ÇEKMECESİ** —
    telefonla aynı düğme, aynı perde, içerik tam genişlik; **ikon rayına DÖNÜŞMEZ** (reisim canlıda görünce: *"dik olduğundaki gibi
    açılır kapanır olmalı, sadece simgeye dönüşmemeli"*). Masaüstü ≥1280'de panel sabit (2026-09-12 kararı), `has-module-sidebar` ve
    masaüstü düzenleri bantta KALIR; (b) her ekran ÜÇ genişlikte tasarlanır ve ölçülür: **1920 · 1080 (tablet yatay, çekmece kapalı
    VE açık) · 375**; (c) içerik kararı kap genişliğine göre (3.3), ekran genişliğine göre değil. → [[tablet-duzeni-2026-09-15]].

## 3 · CSS TUZAKLARI (hepsi canlıda yaşandı)
1. ⛔⛔ **Blok taşırken sınırı brace SAYARAK bul**, `indexOf('}\n')` ile DEĞİL. Bir kez
   kapanış parantezi eksik kaldı, altındaki TÜM kurallar medya sorgusuna düştü ve masaüstünde
   uygulama çıplak kaldı. Taşımadan sonra üst-seviye kural kümesini ÖNCE/SONRA karşılaştır.
   Kilit: `tests/mobil-turu-2026-09-07.test.js` (parantez dengesi + taşıyıcı sınıf testi).
2. **Aynı özgüllükteki medya sorgusu taban kuralın ARDINDA olmalı** — önünde kalırsa sessizce
   etkisiz olur (takvim okları ekran dışına taştı).
3. **Kap genişliğine bağlı karar `@container` ile verilir**, ekran sorgusuyla değil — yan
   paneller açıkken ekran geniş ama içerik dar olabilir.
4. **Tablo kolonları ORAN olsun.** Sabit px + tek esnek kolon, dar kapta o kolonu 67px'e
   düşürür. ⛔ Yüzde+piksel KARIŞIMI çözmez: tarayıcı dar durumda pikseli kayırır.
5. **Liste sınıfını tabloya devralırken** `tbody{display:table-row-group}` `tr{display:table-row}`
   şart — yoksa satırlar bloklaşır.
6. **innerHTML kabı yutar**: içine taşıdığın statik düğmeyi yeniden yazmadan ÖNCE kurtar.
7. **Yarat ≠ göster**: dinamik düğmenin görünürlüğü HER çizimde tazelenir.
8. Aynı liste birden çok daldan üretiliyorsa **sınıfı EN DIŞ kaba** ver.
9. **Testte `lastIndexOf('@media…')` KULLANMA** — dosya sonuna yeni bir mobil blok eklenince
   test yanlış bloğu okur ve alakasız yerde patlar. Aranan **kuralın kendisine** tutun.
10. **Izgara hücresi çocuğu GERER**: `inline-flex` bir öğe grid hücresinde sağa boşluk bırakır
    (`justify-self:start` ile içerik genişliğine döner).
11. ⛔⛔ **SIKIŞTIRARAK SIĞDIRMA YASAK — GENİŞ IZGARA KENDİ KABINDA KAYDIRILIR** (2026-09-15 iPad: ay başlıkları "OC ŞU M.").
    `.czl-kaydir{overflow-x:auto}` VARDI ama tablo `width:100%;table-layout:fixed` olduğu için hiç taşmadı → sütunlar eridi;
    mekanizma vardı, kilit yoktu. Kural: `table-layout:fixed` her tabloda **`min-width`** (sütun minimumlarının toplamı) ZORUNLU;
    sarmalayıcı `overflow-x:auto` + `-webkit-overflow-scrolling:touch`; **tablo BÜTÜN OLARAK kayar, yapışkan sütun YOK** (reisim
    canlıda görünce: *"sadece aylar değil tüm tablo kaydırılabilir olmalı"* — ilk teslimdeki üç yapışkan kimlik sütunu kaldırıldı);
    iOS kaydırma çubuğunu gizlediğinden iki kenarda da solgunluk ipucu. Başlık / etiket / sayı KIRPILMAZ — kırpma zinciri (kalıp 4) yalnız
    SERBEST metin içindir; okunur alt sınır 11 px. ⚠️ **SINIF ÖLÇÜLDÜ (aynı gün, Teslim 1):** kural yalnız SABİT px sütunlu
    fixed tablolar içindir (`.czl-tbl`: 540 px kimlik + 12 ay). Yüzde sütunlu `.eqg-tbl` ailesi (`.bld .mahal-ana .rpt` +
    Ekipmanlar/Mahal ızgarası) kapla ÖLÇEKLENİR, 760 altında karta iner VE sayfa düzeyinde yapışkan grup başlığı taşır
    (`.eqg-grp{position:sticky}`; 12-ekipman:712 *"sarmalda overflow YOK — kaydırma kabı sticky'yi kilitler"*) → onlara
    overflow sarmalayıcı KONMAZ, yoksa başka iş bozulur (13). Kilit: `tests/tablet-duzeni-2026-09-15` KURAL 1–5.

## 4 · VERİ KATMANI
1. ⛔⛔ **Yeni dal = 4 AYNA**: `COMPANY_BRANCHES` · `ARRAY_BRANCHES` (yalnız dizi) ·
   `database.rules.json` · **`save()` payload + RBAC `delete payload.X`**. Dördüncüyü atlamak
   save()'i "true döndürüp yazmayan" hale getirir ([[save-payload-dorduncu-ayna]]).
   Katalog haritası eklerken +yedek payload +yedekten geri yükleme +tür silme temizliği (toplam 7).
2. **Boot'a indirme**: yeni dal boot'a girmez; lazy + hedefli `once('value')` + `stampTouch()`.
3. ⛔ **Lazy dal = APPEND-ONLY yazma.** Dalı boot'tan çıkarıp `save()` payload'ında bırakmak
   toplu veri kaybıdır ([[veri-mimarisi-standart]] A).
4. **Küçük + sık yazılan dalı lazy YAPMA** (activity gibi) — amacı bozar.
5. **Liste/arama/filtre = sunucu-bakımlı hafif indeks**; tam kayıt tıklayınca iner.
6. `snapshot.forEach` **süslü parantezle**; okurken `toArr()`.
7. **Zaman anahtarları TR-sabit (UTC+3)**; cihaz saatine güvenme.
8. **Kök okuma yasak** — dal-başına kural varsa çocuklar tek tek okunur.
9. **Foto/dosya**: `compressImage` + ~240px thumb + `storagePlainUrl` + `secureBlobUrl`;
   ⛔ `getDownloadURL` YASAK ([[veri-tasarrufu-standart]] [[getblob-secure-download]]).
   Veri tasarrufu STANDART: bir daha sorma, her yeni özellikte otomatik uygula.
10. **Silme = çöp kutusu** (30 gün); yeni yükleme yolu açtıysan **öksüz süpürücüsünün
    referans setine** de ekle (bkz. 9.4).
11. ⛔⛔ **AY/GÜN PARÇALI DEFTERDE "AÇIK" KAYIT TUTULAMAZ** (2026-09-08, kapı defteri).
    `gateLog/{YYYY-MM}/{DD}` gibi parçalı defter maliyet için doğru, ama iade edilmemiş
    anahtar / teslim edilmemiş kargo ay dönünce **ekrandan düşer ve kapatacak tuş erişilemez
    olur** (çıkmaz kayıt). "Bir önceki ayı da oku" yaması YETMEZ — iki ay eskiyen kayıt yine
    yutulur; pencereyi büyütmek maliyeti artırır, kaybı bitirmez.
    Doğrusu: **aydan bağımsız işaret düğümü** (`gateAcik/{id} = {ay,gun,kind,t}`) — işaret
    yalnız YOL taşır, kayıt defterde kalır (tek doğruluk kaynağı). Açılışta işaret doğar,
    **her kapatma yolunda** düşer (üçünü de bul), indirilen aylardan **kendini onarır**.
    ⛔ Onarım yalnız yazma yetkilisinde çalışsın; ⛔ okuma hatasında işarete DOKUNMA.
    ⛔ "Geçen ay" gibi sabit etiket yazma — kaydın kendi tarihini yaz
    ([[parcali-defter-ve-lazy-dal-dersleri]]).
12. **VERİ ÖMRÜ**: belge/rapor/foto **ASLA otomatik silinmez** (reisim kararı). Otomatik
    temizlik yalnız çöp kutusu purge'ü (30 gün) ve kendini budayan sayaçlardır. Yeni bir
    "eskiyi temizle" işi ancak reisim söylerse yazılır ([[veri-omru-yedek]]).
13. ⛔⛔ **LAZY DAL İNMEDEN PUAN/ÖZET HESAPLAMA — İYİMSER YALAN SÖYLER** (2026-09-08, OEE).
    `stops` inmeden hesaplayınca duruş 0 sayıldı, Kullanılabilirlik %100 ve OEE şişik çıktı,
    saniyeler sonra düştü. Üretim tarafındaki aynı gecikme puanı **0** gösterdiği için hemen
    fark ediliyor; duruşta **tersine iyimser** olduğu için fark edilmiyor — kullanıcı yanlış
    sayıya güvenir. **Sessiz iyimserlik, gürültülü kötümserlikten tehlikelidir.**
    Kural: lazy dal bir puanın **paydası ya da kesintisi** ise → dal inmeden puan **null**,
    ekran **sebebini söyler** ve iki hâli ayırır (*yükleniyor* · *çevrimdışı*), şerit
    **her gösteren ekrana** konur (liste · analiz · detay), null puanın **sıralamayı** ve
    **ortalamayı** bozmadığı testle kilitlenir.

## 5 · GİZLİLİK VE SIZINTI
1. ⛔ **`getDownloadURL` YASAK** — kalıcı public token üretir, link kaçarsa yetki kapısı yok.
   Dosya **yetki + App Check** ile `getBlob` üzerinden iner, `secureBlobUrl` ile gösterilir;
   listede ~240px thumb ([[getblob-secure-download]]).
2. ⛔ **ÜÇÜNCÜ TARAFA VERİ GİTMEZ.** `api.qrserver.com` düşüş yolu ekipman kimliğini dışarı
   yolluyordu. Kütüphaneler **kendi sunucumuzda** (`/vendor/<ad>-<sürüm>.js`, immutable);
   CDN'e düşen yedek yol BIRAKMA ([[okutma-fazlari]]).
3. ⛔ **Şifre alanında tam sessizlik** — global klavye kanalı bir **tuş kaydedici yüzeyi
   olamaz**; `type="password"` görülünce servis susar.
4. **Tenant izolasyonu kuralın kendisinde**: `auth.token.cid === $cid` **veya** grup üye
   sahibi `mid` eşleşmesi · `_deleted` yok · `modules/{key} === true` · `pw.contains('|izin|')`.
   ⛔ Köke `.read` koyma — alt düğümde geri alınamaz.
5. **Kimlik METİN DEĞİLDİR**: kart/barkod kodunda dile bağlı harf katlama (`toLocaleUpperCase('tr')`)
   yapma — `i/I` çiftinde eşleşme çöker. Personel kartı kodu doğrudan RTDB anahtarı olduğu
   için **ham** taşınır; kanoniğe çevirmek mevcut kartları "tanınmayan" yapar.
6. ⛔⛔ **TOLERANSLI EŞLEŞTİRME = AYRICALIK YÜKSELTMESİ.** "Ters bayt / hex↔ondalık / baştaki
   sıfır" farklarını otomatik eşleştirmek geçiş kontrolünde saldırı yüzeyidir (yazılabilir-UID
   kart 50₺). Tahmin değil, **kayıt anında insan onaylı takma ad**. `okuOlasiEsler()` yalnız
   tanımlama ekranında **ipucu** — asla kabul kapısı.
7. **Not/görünürlük**: not sahibi + `visibility` alanı; herkes her notu görmez. Susturma
   yalnız YAYINI sustursun, kaydı gizlemesin ([[bildirim-rol-not-2026-07-11]]).
8. **Kişisel veri URL'e/sorgu dizesine yazılmaz**; ekran görüntüsü/örnek metinde gerçek
   hesap kimliği, müşteri veya tesis adı geçmez ([[ornekte-gercek-veri-yasagi]]).
9. ⛔ **APP CHECK ENFORCE AÇIK** — RTDB + Storage + tüm callable'lar. **Yeni callable
   eklerken `onCall({ enforceAppCheck:true })` koymayı UNUTMA**; unutulan tek callable
   uygulamanın dışından çağrılabilir hale gelir ([[security-firebase-rules]]).
10. ⛔ **KVKK ilke kararı 2026/921 (RG 02.06.2026)**: mesai takibinde **parmak izi ve yüz
    tanıma YASAK**. Bu bir ürün tercihi değil **mevzuat** — biyometrik öneri getirme; yasal
    yol **kart / QR okutma**. Personel modülünün NFC kart seçimi bu yüzdendir
    ([[personel-modulu-plan]]).

## 6 · CANLI VERİYE ELLE DOKUNMA
⛔ En riskli iş sınıfı. Dördü de yaşandı ([[canli-veri-onarim-dersleri]]):
1. **Uygulamanın "gerçekten oldu" damgasını UYDURMA** (`_checked` = QR fiziksel okutuldu).
   Uydurulamayan kanıt varsa (foto) o iddiayı hiç yazma; açıklamayı normal `note` alanına koy.
2. **Admin SDK transaction'ı ilk turu BOŞ önbellekle koşar** → `if(!cur) return;` kalıcı iptal
   eder. Dalı canlı dinleyiciyle sıcak tut, `res.committed` KONTROL ET. ⛔ `return cur` (null) SİLER.
3. **`_touch` KÖKTEDİR**: `takipet/_touch/{cid}`. Yanlış yol = saatlik R2 yedeği kaydı ıskalar.
4. **Geçmiş tarihli kaydı `unshift` etme** — akış sıralanmıyor, en yeni gibi görünür.
5. ⛔ **Deneme yazması YOK** ([[test-hesap-kurali]]); istemciden `once('value')` önbellekten
   okur, doğrulamayı admin SDK ile yap.
6. **Yazmadan önce düşmanca inceleme** (bu iş sınıfında ajan MEŞRU): 18 bulgunun 4'ü kritikti.
7. **Önce KURU KOŞU (`--yaz` bayrağı olmadan)**, beklenen değeri doğrula, sonra yaz; yazdıktan
   sonra geri okuyup göster. Kök `_touch`'ı damgalamayı unutma.

## 7 · YETKİ / ROL
1. **Rol eklemek 4 aynayı ilgilendirir**: istemci `PERM_DEFS` + `WRITE_PERMS` + `PUSH_*` +
   kurallar (`tests/role-mirrors.test.js` kilitler) ([[rol-yetki-mimarisi]]).
2. **SEVİYE zaten yetkidir** — yeni ofis rolleri seviye 1.
3. **Grup üye sahibinin ikincil şirkette user kaydı YOK** — canDo/forceLogout/push kodunda
   istisna şart ([[grup-uye-ikincil-sirket]]).
4. Yapamayacağı tuş **hiç çizilmez** (gri/pasif değil).
5. **Yeni yetki eklenince mevcut oturumlar `pw` claim'ini ALMAZ** — kullanıcı çıkıp girmeli;
   teslim notunda söyle.

## 8 · MODÜL İSKELETİ (yeni modül/ekran)
Tam çeklist: [[modul-iskelet-disiplinleri]]. Özet: `WEB_MODULES`+`TOGGLE_MODULES` · ⛔ `_BASE_MODS`'a
ekleme (girerse süper adminin aç/kapa anahtarı ETKİSİZLEŞİR) · `PAGE2PATH`+`_WEB_PAGE2MOD`+
sayfa kabı+`showPage` dördü birden · **alt sekmeler de URL'e** (`DYN_ROUTES`, `after:true`) ·
`soonBadge:true` ile başla (rozet modülün **TAMAMI** bitince kalkar, faz faz DEĞİL) · Hareket düğmesi.

## 9 · ENTEGRASYON — modül tek başına "bitmiş" olmaz
⛔⛔ **En kolay unutulan bölüm.** Yeni modül/ekran, KURULU sistemlerin hepsine bağlanır.
Biri eksikse modül **bitmemiştir** ve rozeti kalkmaz.
1. **YEDEKLEME** — dal `BACKUP_BRANCHES`'e **ve** `PER_CID_BRANCHES`'e (`['data','hr','sec','dep']`)
   eklenir; nadir değişiyorsa `DAILY_ONLY_BRANCHES`. ⚠️ `hr`+`sec` 24 Ağustos'a kadar yedeğin
   **tamamen dışındaydı**; sonra `PER_CID`'e eklenmediği için her saat **TAM** iniyordu (en pahalı
   kalem). İkisi de sessiz arıza — kimse fark etmez ([[veri-omru-yedek]]).
2. **STORAGE YOLU** — dosya `belgeler/{cid}/…` altına yazılır. `r2BackupStorage` yalnız
   `belgeler/` ve `arsiv/` öneklerini tarar → başka önek **off-site yedeğin dışında** kalır;
   şirket silinince `deleteFiles({prefix:'belgeler/{cid}/'})` de onu bulamaz.
3. **ÇÖP KUTUSU / KURTARMA MERKEZİ** — silme `trashRecord`/`trashDoc` üzerinden (30 gün);
   yeni kayıt türü Kurtarma ekranına da eklenir ([[kurtarma-merkezi]]).
4. **ÖKSÜZ SÜPÜRÜCÜ** — yeni yükleme yolu açtıysan gece süpürücüsünün **referans setine** ekle;
   yoksa canlı dosyayı öksüz sanıp siler (`belgeler/{cid}/` dersi).
5. **ŞİRKET SIFIRLAMA** — `resetCompanyState`'e `xxxResetState` eklenir (desen: `prsResetState`,
   `secResetState`, `depResetState`). Yoksa şirket değişince **eski şirketin verisi sızar**.
6. **PERSONEL / DEPARTMAN AĞACI** — rol 4 aynası + `dept_xxx` / `dept_xxx_m` rolleri +
   `deptReady(key)` (iş emri departman seçicisinde görünsün) + müdür/personel havuzu
   ([[rol-sistemi-departman]]).
7. **İŞ EMRİ KÖPRÜSÜ** — modülün ürettiği kayıt iş emrine **referans** olarak bağlanabilmeli
   ([[is-emri-referans]]).
8. **AKTİVİTE KAYDI** — `logActivity(type, desc, extra, deptKey)`; modül kendi `deptKey`'ini geçsin.
9. **PDF** — ortak A4 motoru `showPdfDoc`; kendi yazdırma yolunu açma ([[pdf-sistemi]]).
10. **MODÜL ANAHTARI** — `modules/{key} === true` hem istemcide hem **KURALDA**.
11. **BİLDİRİM** — ⛔ izinsiz KURMA (1.3); yeri hazır dursun, açması reisim'in kararı.
12. **TEST DOSYASI** — `tests/<modül>.test.js`, **gerçek dosyaları okusun** (sahte veriyle
    çalışan test katalog değişikliğini yakalamaz). Yukarıdaki her bağlantıyı tek tek kilitle.
13. **TAKVİM** — takvim bugün yalnız planlı denetim + `S.takvimNotes`'tan besleniyor, genel
    bir eklenti noktası YOK. Modülün tarihli kayıtları takvimde görünsün mü → **ürün sorusu,
    REİSİM'E SOR** (1.2). Kendiliğinden bağlama, kendiliğinden bırakma da.
14. **KOTA VE ÖZET SAYAÇ** — liste/pano **tüm dalı indirmez**: yarım KB'lık özet sayaçtan
    (`_stats` deseni) okur, detay tıklayınca iner. İndirmeler kotaya sayılır (`bumpUsage`).
    Bu, veri tasarrufu standardının modül tarafındaki karşılığıdır ([[veri-tasarrufu-standart]]).
15. **DEPO / MAKİNE KÖPRÜLERİ** — parça, zimmet, sayım gibi ortak nesneler varsa mevcut
    modülün kalıbını kullan, paralel ikinci bir kavram açma ([[depo-parca-entegrasyonu]]).

## 10 · ÜRÜN FELSEFESİ
1. ⛔⛔ **YAPBOZ**: "v1'de olmasın" YOK → **varsayılan kapalı, isteyen açar**. Kataloglar
   müşterinin. **Şema cömert, ekran cimri** ([[yapboz-modulerlik-ilkesi]]).
2. ⛔ **İskelet tartışılmaz** — esneklik İÇERİKTE, tutarlılık İSKELETTE.
3. **Örnekte gerçek veri YASAK** (hesap kimliği/müşteri/tesis adı) ([[ornekte-gercek-veri-yasagi]]).
4. Şirket her yerde **kullanıcının gördüğü tam adıyla** yazılır; iç kimlik (slug/anahtar) ASLA gösterilmez.
5. **Canlı beta, satış başladı** — "satış sonrası" deme, büyük refactor değmez ([[beta-canli-satis]]).
6. **Riskli olanı en sona koy** — sessiz veri kaybı üreten iş (çevrimdışı kuyruk gibi) faz
   listesinin SONUNDA durur, gerekçesi yazılı olur.

## 11 · DOĞRULAMA
1. **Chrome eklentisi + canlı site**; localhost koşumu YOK ([[gorsel-dogrulama-chrome]]).
   ⛔ Canlıda **yazma yok** — bakmak serbest, kayıt oluşturma/değiştirme yasak.
   ⛔⛔ **HER DEĞİŞİKLİK GÖZLE DOĞRULANIR — WEB VE MOBİL AYRI.** "Test geçti" ya da "kodu
   değiştirdim" doğrulama DEĞİLDİR. Ekranı aç, ekran görüntüsü al, ölç.
   · **Veri o şirkette yoksa VERİSİ OLAN ŞİRKETE GEÇ** (Test şirketi), bak, sonra geri al.
     2026-09-08'de `--sans`'ın 17 kullanımı Makine Takip modülündeydi ve aktif şirkette 0 makine
     olduğu için değişikliğin en büyük parçası ilk turda GÖRÜLMEDEN teslim edildi.
   · **Mobil:** Chrome'un görünüm alanı pencereyle küçülmüyor (1920'de sabit kalıyor).
     Çözüm: canlıdaki **GERÇEK DOM parçasını kopyala**, uygulama içi tarayıcıda 375px'te
     yapıştır — gerçek biçem + gerçek içerik, yalnız oturum yok (yerleşim için yeterli).
   · Öğeyi **enjekte ederek** ölçtüysen bunu teslim notunda **"enjekte" diye yaz**;
     kendiliğinden çıkan ekranla aynı şey değildir.
   · Bakılamayan tek şey **gerçek cihaz teyidi** (11.2) — onu reisim'den istemek meşru.
2. **history/oturum/boot/push/collab değişikliği gerçek telefon teyidi olmadan "bitti" değil**
   ([[mobil-cihaz-testi-kurali]]).
3. **Paylaşılan mekanizmaya dokunurken ÖNCE tüm çağıranları listele**; "iptal ediyorum" diyen
   UI kanıtlamalı ([[iptal-tusu-dersi]]). Aynı eşik iki kanala hizmet ediyorsa **kanal başına**
   düşün (klavye 350ms · kamera 1800ms dersi).
4. **Riski en sona koy**, riskli işten önce git etiketi; her dilim build→deploy→teyit.
5. **Ajan doğrulamasına körü körüne güvenme** — iki kez yanlış "doğrulandı" geldi.
6. **Test yazarken pencereyi demirle**: CRLF dosyalarda `'\n}\n'` araması SESSİZCE tüm dosyayı
   diler; fonksiyon sonunu satır-sonu toleranslı ara. Testte `lastIndexOf` yerine kurala tutun (3.9).
7. **375px'te ölç**: taşan öğe sayısı 0, kırpılan yazı 0. Ölçüm `getBoundingClientRect` ile,
   göz kararı değil.
8. ⛔ **ÜÇ GENİŞLİK ÖLÇÜLMEDEN "BİTTİ" DENMEZ (2026-09-15):** 1920 · **1080** (tablet yatay: panel katlı ve açık) · 375.
   **Teknik (aynı gün ölçüldü):** Chrome penceresi tam ekranken `resize_window` dış boyutu DEĞİŞTİRMİYOR; yöntem = 1920 görünümde
   `html{width:1080px}` + bant CSS'i medya sorgusuz `<style>` enjekte, sayfaları `showPage` ile gez, ölç, sonra kaldır ("enjekte" yaz).
   ⛔ Ölçmeden ÖNCE `innerWidth` oku: geliştirici araçları/yan panel sekme görünümünü SESSİZCE daraltır (784×372 görüldü, 5 ölçüm
   çöpe gitti). Görünüm-bağımlı medya farkı olan sayfalarda (1100 blokları: Takvim/Profil) simülasyon geçersiz → "ölçülemedi" yaz.
   Kabuk/yan panel değişikliğinde gerçek iPad Safari teyidi 11.2 gibi reisim'den istenebilir.
   ✅ **DAHA İYİ TEKNİK (2026-09-15, kestirimci Teslim 7):** canlı sayfada `iframe` aç (genişlik 1920/1080/375), içine `document.styleSheets`
   metnini + ekranın gerçek `outerHTML`'ini + `body` sınıflarını yaz → medya sorguları ÇERÇEVE genişliğine göre çalışır, tablet bandı ve telefon
   blokları gerçekten devreye girer (enjeksiyon gerekmez). Ölç: sayfa taşması, ellipsissiz kırpma, etkileşimli öğe çakışması, ekran dışı öğe, <38 px
   dokunma hedefi, `.kaydir` kabı kayıyor mu. JS kararı (`matchMedia`) varsa işlevi geçici değiştir, yeniden çiz, GERİ AL. ⛔ Sekme arka plandayken
   zamanlayıcılar kısılır (45 sn zaman aşımı) → ölçüm betiği `await setTimeout`suz eş zamanlı yazılır; kanıtta "iframe ile" yazılır.

## 12 · BELGE / İLETİŞİM
1. Reisim'in belgesini "güncelle" = **yerinde düzenle**, sıfırdan yazma ([[belge-yerinde-guncelle]]).
2. Uzun oturumda bağlam kaybını **itiraf et**, tahminle yürüme.
3. ⛔ Bütçe alarmı KURULU, tekrar önerme. ⛔ Push dürtme YAPILMAYACAK.
4. **Durum belgesi güncellenmezse rapordan kötüdür** — `YAPILACAKLAR.md` ve denetim raporları
   iş kapanınca AYNI gün işaretlenir; işaretlenmemiş liste insanı yanlış yere sürer
   ([[denetim-raporu-2026-08-09]]).
5. ⛔ **BAYAT KURAL = YANLIŞ KURAL.** Anayasa ya da kalıp maddesi değişince bağlı dosya + `MEMORY.md` indeks satırı +
   kanca çıktısı (`oturum-acilis.md`) AYNI teslimde güncellenir; anayasayla çelişen dosya görüldüğü an düzeltilir
   (2026-09-11: [[delivery-test-steps]] 3 gün bayat kaldı, reisim'e üç kez ödev yazıldı). Kalıpta "hepsi kilitli" gibi
   toplu iddia yazılmaz — kilit haritası madde madde ([[tasarim-kalibi]] 17).

## 13 · BAŞKA İŞİ BOZMAMA — REGRESYON KAPISI (reisim 2026-09-15)
Reisim (2026-09-14): *"bir şey yaparken başka şeyler bozuluyor"* · (2026-09-15): *"bir işi yaparken başka işleri bozmamaya
özen göstereceğiz."* Dağınık duran kurallar (11.3 çağıranlar · 3.1 parantez · 0.8 sınıf · 4.1 aynalar) tek kapıda.
**Zemin (ölçüldü 2026-09-15):** 38 kaynak dosya (`src/js/01…38`) TEK dosyaya birleşir, **tek küresel ad alanı**, 2.377 üst
düzey işlev, adlar minify'da korunur (inline onclick) → her sembol her yerden görünür ve çakışma **hata vermez**.
1. ⛔⛔ **ETKİ ALANI, KODDAN ÖNCE.** Dokunulacak her sembol (işlev · CSS sınıfı/seçici · DOM id · `S.` alanı · veri dalı/alanı ·
   body.html iskeleti) için kullanım yerleri `grep` ile SAYILIR: `src/js` + `src/body.html` + `src/style.css` + `functions/` +
   `database.rules.json` + `tests/`. Sayı ve dosyalar uyum beyanına (0.12) yazılır. 11.3 yalnız "paylaşılan mekanizma" diyordu;
   kural artık HER dokunulan sembol. `onclick="x("` ve `click:'x()'` dizgeleri de kullanımdır — dizge olarak ara, sembol olarak değil.
2. ⛔⛔ **TEK KÜRESEL AD ALANI — AYNI AD SESSİZCE EZER.** İkinci `function x(` hata vermez, sonraki dosya öncekini ezer. Yeni işlev /
   `S.` alanı / CSS sınıfı / DOM id / veri alanı eklemeden önce ad aranır (`^function x\(`, `\bx\s*=`, `\.x[{ ,:]`, `id="x"`).
   2026-09-15 ölçümü: 2.377 işlev + 541 değişken tekil, 412 id tekil. **KİLİT: `tests/kuresel-ad-cakismasi.test.js`** —
   (a) sütun-0 `function/const/let/var/class` çifti 0, (b) body.html çift id 0, (c) style.css medya dışı aynı seçici
   ikinci blok = RATCHET (bilinen 18 listede; yenisi yasak, sayı artamaz, kalkan listeden silinir). Olumsuz kanıt: üç kasıtlı
   çift → üç test düştü. ⛔ Üst düzey tanım girintiyle yazılmaz — kilit sütun-0 bakar.
3. ⛔ **SİLME = KULLANIM SIFIR.** İşlev/sınıf/id/alan silinmeden önce 1. maddedeki sayım 0 olmalı; 0 değilse silinmez, nota yazılır
   (Depo `.fbar` örneği: elle kuruluyordu, silinmedi, modül yeniden yapımına bırakıldı). "Ölü sanıp silme": inline dizgeler,
   body.html, `functions/` ve testler de kullanıcıdır.
4. ⛔⛔ **ORTAK ÜRETİCİ/SINIF DEĞİŞTİYSE HER TÜKETİCİ CANLIDA AÇILIR.** Kanıt özeti değişen ekranı değil, mekanizmayı kullanan
   BÜTÜN ekranları listeler (süzgeç satırı: 5 ekran). Ortak sayılanlar: `.btn*` `.fb-chip` `.form-input` `.empty-state` ·
   `filterBarHtml` `kipAnahtariHtml` `uzunTus` `showPdfDoc` `mailTemplate` `frmKolonla` `pagerHTML` · `save()` `canDo`
   `showLoading` `toast` `logActivity`. Ek olarak dokunulmayan en az BİR komşu ekran açılır (regresyon kontrolü) ve yazılır.
5. ⛔ **DİFF OKUNMADAN COMMIT YOK.** `git diff --stat` + her dosyanın parçaları okunur; kalem kapsamı dışındaki satır ya geri
   alınır ya kanıt özetine "yan etki" diye yazılır. Değişen dosya listesi kanıt özetine girer. "Bu arada şunu da düzelttim" YOK
   ([[gundem-disiplini]] 2).
6. ⛔⛔ **TEST KAPISI: `fail 0` OLMADAN BUILD/DEPLOY YOK.** T1 (2026-09-14) test düşerken yayınlandı → zincir
   `if grep -q "^ℹ fail 0"` kapısıyla. Düşen test "eski metin çapası" bile olsa önce OKUNUR: davranış aynıysa çapa güncellenir,
   test SİLİNMEZ; davranış değiştiyse kod düzeltilir. Her düzeltme yeni ya da güncellenmiş bir testle kilitlenir; test gerçek
   dosyayı okur (9.12).
7. ⛔ **CSS ÖNCE/SONRA SAYIMI.** `style.css`'e dokunulunca üst düzey kural sayısı ve `@media` blok sayısı önce/sonra karşılaştırılır
   (3.1'in genelleştirilmişi: bir eksik parantez tüm siteyi medya bloğuna düşürdü). Paylaşılan sınıf değiştiyse 4. madde.
8. ⛔ **GERİ DÖNÜŞ YOLU BİLİNİR.** Teslimden önce bir önceki canlı commit hash'i kanıt özetine yazılır; canlıda bozulma görülürse
   `git revert` + deploy, yerinde yama değil. Riskli işten önce git etiketi (11.4).
9. **AYNALAR TESTLE:** yeni dal 4 ayna (4.1) · rol 4 aynası (7.1) · sayfa `PAGE2PATH` dördü (8) — ilgili ayna testi
   (`role-mirrors` · `server-mirror` · `silme-kapsami`) güncellenmeden kalem kapanmaz.
10. **BOZULMA SINIFLARI (canlıda yaşananlar):** beyaz ekran (iptal tuşu, 14 çağıran açılmadı) · site medya bloğuna düştü (eksik
    parantez) · `save()` true dönüp yazmıyor (4. ayna) · sayfa sessizce çöker (`ARRAY_BRANCHES`) · OEE iyimser yalan (lazy dal) ·
    PDF boş fotoğraf (gözlemci yarışı) · test geçmeden yayın (T1) · sızan oturum anahtarı (users listesi save ile) · çizelge
    sayfalaması blok sayıyordu (şirkete özel davranış). Yeni bozulma sınıfı görülünce bu listeye VE teste eklenir.
11. ⛔⛔ **OLUMSUZ KANIT İÇİN KAYNAĞI MUTA ETME; `git checkout --` SATIR SONUNU DEĞİŞTİRİR** (2026-09-15, bu kapı yazıldığı
    gün yaşandı). Küresel ad testinin "gerçekten yakalıyor mu" kanıtı için üç kaynak dosyaya kasıtlı çift ekleyip
    `git checkout -- <dosya>` ile geri aldım: `core.autocrlf=true` olduğundan üç dosya **CRLF** döndü, ağacın kalanı LF;
    `git status` TEMİZ göründü ama **5 test düştü** (CRLF'e duyarlı çapalar, `_czSayfalar` kesimi). Kural: (a) olumsuz kanıt
    scratchpad'e alınmış KOPYA üzerinde yapılır, `src/` muta edilmez; (b) `git checkout --`/`git restore` sonrası
    `git ls-files --eol` ile **w/lf** doğrulanır (temiz `status` yetmez — normalize eder); (c) ağaç LF'dir, CRLF'e dönen dosya
    hemen LF'ye çevrilir. 11.6 ile aynı sınıf: satır sonu sessiz bozucudur.

İlgili ana dosyalar: [[modul-iskelet-disiplinleri]] [[veri-mimarisi-standart]] [[yapboz-modulerlik-ilkesi]]
[[canli-veri-onarim-dersleri]] [[parcali-defter-ve-lazy-dal-dersleri]] [[gorsel-dogrulama-chrome]]
[[mahal-nesne-sayfasi]] [[analiz-risk-motoru]] [[veri-omru-yedek]] [[okutma-fazlari]]
