# MAKET-PLANI.md — toplu maket çalışması (bulutta, sırayla)

> **Karar (reisim 2026-09-24, birebir):** *"tüm maketleri sırayla bulutta yapılsın en son hepsine toplu bakar ona göre
> ilerleriz"* · seçimler: **hepsi, sonda toplu bakış** · kapsam **faz 1 + faz 2**. Bu dosya o çalışmanın talimatıdır;
> bulut oturumu yerel hafızayı görmez, bilmesi gereken her şey burada, `CLAUDE.md`, `ANAYASA.md`, `TASARIM-KALIBI.md` ve
> `pkproje.md`'dedir (dördü de oturum başında TAM okunur, CLAUDE.md §0).
> Durum satırı en altta; her maket bitince güncellenir.

## 1 · Ne yapılıyor, ne yapılmıyor
- Aşağıdaki sırayla **her modülün maketi** (masaüstü + mobil AYRI, anayasa 2.2) `docs/maket/` altında yapılır ve Pages'e çıkar.
  Reisim aradaki maketlere tek tek onay VERMEZ; **en sonda toplu bakış sayfasından** hepsine birlikte bakar. Onay gelene kadar
  her maket "ONAY BEKLİYOR" durumundadır; hiçbirinden koda geçilmez (anayasa 2.1).
- ⛔ `src/` değişmez (uygulama kodu yok). ⛔ Ajan / Workflow / paralel oturum yok (anayasa 2.3, CLAUDE.md §7) — tek oturum, sırayla.
- ⛔ Palet ve değişkenler dokunulmaz (`tokens.css`); kalıp sayıları dondu (`src/styles/kalip.ts`: 34/44 px, bantlar 768/1280, kart
  eşiği 960, sayfa 10/20, yazı ölçeği, kabuk 232/64/52). Yeni desen gerekirse kalıp 16 gereği önce **soru** olarak yazılır.
- ⛔ Veri UYDURMADIR: gerçek firma, müşteri, kişi, tesis, numara yok (CLAUDE.md §8 taraması her commit'ten önce). Emsal
  uygulamanın adı ve ekranları hiçbir dosyaya girmez; `yerel/` bulutta yoktur, olmamalıdır.
- Varsayım yapılabilir ama **açıkça yazılır**; reisim'e soru sorulmaz, sorular birikir (bkz. §4).

## 2 · Sıra (faz 1 → faz 2; pkproje.md §3.1 modül no'ları)
| # | Maket | İçerik (kaynak) | Ekran(lar) |
|---|---|---|---|
| M1 | Kullanıcı ve Rol · Personel (1, 2) | giriş ekranı, kullanıcılar, çoklu rol, rol × modül görünürlüğü (açık karar → varsayım + soru), personel kartı: meslek, branş, diploma, oda sicil, EKİPNET, yetkinlik (§2, §4.6) | liste + nesne sayfası + form |
| M2 | Müşteri ve Tesis (3) | müşteri, çok tesis, tesis adresi + SGK işyeri sicil (§7), müşteri kullanıcıları (e-posta) | liste + nesne sayfası |
| M3 | Ekipman Türü Kataloğu · Ekipman (5, 7) | tür: Ek-III grubu, branş, periyot, standart, yetkili meslekler, akreditasyon, Bakanlık format kodu (§4.6–4.8); ekipman: tesise bağlı, kalıcı, eşsiz kod (§3.5), rapor geçmişi | iki liste + nesne sayfası |
| M4 | Ölçüm Cihazı · Zimmet · kalibrasyon uyarısı (8, 9, 20) | cihaz: seri/envanter no, kalibrasyon + ara kontrol, 30 gün uyarısı (§3); zimmet: varlık (cihaz/araç/diğer), teslim eden → alan, fotoğraf, form, "kimde" + geçmiş | listeler + teslim akışı |
| M5 | İSG-KATİP kaydı (12, kısım) | sözleşme no + onay tarihi, kişi × tesis; plan kabul kilidine bağlantı (§3, §3.2 madde 2) | liste + form |
| M6 | Plan aç (13) | planlama ekibinin plan açma akışı (Planlar maketinde yok): müşteri → tesis → tarih → inspector → ekipman kapsamı; proje no sunucuda (§3.5) | form / sihirbaz |
| M7 | Standart Kütüphanesi · Rapor şablonu önizlemesi (4, 6) | firma kendi standardını yükler; kontrol metodu seçimi (açık soru §3); şablonun PDF iskeleti (§4.2, §4.8) | liste + belge önizleme |
| M8 | Saha ve Rapor (14) | rapor girişi: Ek-III 1.7 alanları, kriter yapıldı/yapılmadı/uygulanamaz, ölçüm, kusur hafif/ağır, fotoğraf ≥ 1, cihazlar zimmetten, pano fotoğrafından sigorta okuma (öneri, insan onayı) | **tablet + telefon önce**, masaüstü |
| M9 | Raporlar · Onaylar · İmza · PDF (14, 15, 16) | rapor listesi, branş yöneticisi onay/geri gönderme, inspector son imza, PDF çıktısı | liste + onay ekranı + PDF |
| M10 | Uyarılar (20) | yalnız reisim'in istedikleri: kalibrasyon bitişi, eğitim tekrarı (bildirim KURMA, anayasa 1.3) | liste |
| M11 | Müşteri Paneli (17) | ayrı giriş, yalnız kendi raporları, "Uygunsuzları indir" Excel (§1.1) | liste + indirme |
| M12 | Teklifler (11) — faz 2 | müşteri, tesis, kalem (tür × adet × birim fiyat), durum | liste + form |
| M13 | Sözleşmeler — iş sözleşmesi (12) — faz 2 | firmalar arası iş sözleşmesi | liste + nesne sayfası |
| M14 | Muhasebe (18) — faz 2 | fatura, tahsilat, iş kapanışı; rapor → teklif kalemi (§3.2 madde 5) | liste |
| M15 | Performans (19) — faz 2 | personel başına günlük iş, rapor sayısı, kazanç, grafik | pano |
| M16 | Eğitimler (10) — faz 2 | eğitim, belge, tekrar süresi | liste |
| SON | Toplu bakış sayfası | her maketin bağlantısı + varsayımları + karar soruları, modül modül gruplu | `docs/toplu-bakis.html` |

## 3 · Her maketin teslim biçimi (bir maket = bir kalem = bir commit)
1. Kalem başında `pkproje.md`'nin ilgili bölümleri yeniden okunur; uyum beyanı commit mesajının başına yazılır.
2. Kabuk ve ortak parçalar **tek üreticiden** (anayasa 2.9, kalıp 15–16): Planlar maketinin kabuğu (yan menü, üst çubuk, tema,
   daraltma, çekmece), süzgeç satırı, liste (tablo ↔ kart, eşik 960), sayfalama, pencere, rozet. İkinci bir aile açılmaz; gerekiyorsa
   ortak kabuk `docs/assets/`'te ayrı dosyaya alınır. ⚠️ Kilitler `docs/assets/maket.js`'teki `var MENU = [` ve `var SAYFA`'yı,
   `maket.css`'teki kart eşiği ve daraltma bloğunu okur (`tests/moduller.test.ts`, `tests/kalip-sayilari.test.ts`); taşınırsa test
   tarih + gerekçeyle güncellenir, gevşetilmez.
3. Yan menü bağlantıları hazır maketlere gider (toplu bakışta tıklanır bir prototip olsun).
4. **Ölçüm** (anayasa 11.7–11.8): 1920 · 1080 (çekmece kapalı + açık) · 375 × açık + koyu tema; `tools/olc-maket.js` bulguları 0;
   ekran görüntüsüne bakılır. Bulutta tarayıcı bölmesi yok → §5. Ölçülemeyen **"ölçemedim"** diye yazılır, tahmin yazılmaz.
5. `pkproje.md`: ilgili bölüme **"Maket M<n> — ONAY BEKLİYOR"** + varsayımlar + karar soruları (numara **32'den** devam eder;
   Planlar turlarında 1–31 kullanıldı); §11 günlüğe satır.
6. `npm test` fail 0 + `npm run test:negatif` → diff okunur → veri taraması → commit (ne istendi · ne değişti · nerede/nasıl
   doğrulandı) → `main` fast-forward + iki dal push → CI yeşil (CLAUDE.md §5, §8). Bu dosyanın durum satırı güncellenir.

## 4 · Sorular ve varsayımlar
- Her makette: **Varsayım** (neyi neden böyle kurdum) ve **Soru** (reisim'in karar vermesi gereken ürün davranışı, anayasa 1.2)
  ayrı yazılır. Ürün davranışı, kimin neyi göreceği, iş akışı sırası, bildirim → SORU; mimari/adlandırma → sorulmaz (anayasa 1).
- Bir cevap önceki maketi etkileyecek olursa (ör. rol × modül görünürlüğü her ekranı etkiler) toplu bakışta bu **bağımlılık**
  yazılır.

## 5 · Bulut ortamı
- Hazır gelen: Ubuntu 24.04, Node 20/21/22 (22 PATH'te), PostgreSQL 16, git, gh. **Proje Node 24 ister** (`package.json` engines).
- İlk iş: `bash tools/bulut-hazirla.sh` (Node 24 → `/opt/node24`, başsız Chrome for Testing → `/opt/olcum`, puppeteer-core).
  Betik yerelde (Windows) koşturulamadı; **ilk çalıştırmada doğrulanır**, düzeltmesi gerekirse aynı kalemde düzeltilir.
- Kabuk durumu çağrılar arasında korunmaz: komutlar `PATH=/opt/node24/bin:$PATH npm test` biçiminde koşulur (betik sonunda
  `node -v` 24 değilse bu gerekir).
- Ölçüm sürücüsü `tools/olc-bulut.mjs` (salt okunur; puppeteer-core ile `python3 -m http.server --directory docs` üstünde sayfayı
  1920/1080/375 × iki tema açar, geçişleri kapatır, `tools/olc-maket.js`'i koşar, ekran görüntüsü alır) ilk makette yazılır ve
  olumsuz kanıtla doğrulanır (bilerek taşan bir öğe → bulgu). Başsız Chrome kurulamazsa maket **"ölçüm bekliyor"** işaretlenir;
  reisim toplu bakmadan ÖNCE yerel oturumda hepsi ölçülür. Ölçülmemiş maket toplu bakışa "ölçüldü" diye girmez.
- Ölçüm pratikleri (önceki turlardan): her genişlik TAZE yüklenir; geçişler kapatılır (takılı geçiş yanlış çakışma üretir);
  adres (#) değişiminden sonra `HashChangeEvent` elle tetiklenir; ölçüm betikleri eş zamanlı yazılır.
- Pages yayını `main`'den ~2 dk; tarayıcı önbelleği 10 dk (max-age=600) — reisim eski görürse Ctrl+F5.

## 6 · Bitiş
Son kalem toplu bakış sayfasıdır (`tools/sunum-uret.mjs` ile üretilir, elle düzenlenmez; `docs/index.html`'den bağlantı). Reisim'e
tek mesaj: sayfanın bağlantısı + kaç maket + kaç soru + ölçülemeyen varsa listesi.

## Durum
- 2026-09-24: plan yazıldı; M1 sırada. Bitenler: —
- 2026-09-24 (bulut): hazırlık doğrulandı ve düzeltildi (Chromium hazır → `/opt/pw-browsers`; testler root olmayan `bulut`
  kullanıcısıyla: `su bulut -s /bin/bash -c 'cd <depo> && PATH=/opt/node24/bin:$PATH npm test'`). Ölçüm `tools/olc-bulut.mjs <maket>`
  (+ `--etkilesim`, `--olumsuz`); sonuç `docs/assets/olcum/<maket>.json`. Ortak kabuk `docs/assets/maket-ortak.js`, ortak veri
  `maket-veri.js`. **M1 bitti** (108/108 · çekmece 2/2 · etkileşim 17/17; sorular 32–43).
- **M2 bitti** (48/48 · çekmece 2/2 · etkileşim 11/11; sorular 44–50).
- **M3 bitti** (60/60 · çekmece 2/2 · etkileşim 14/14; sorular 51–57).
- **M4 bitti** (60/60 · çekmece 2/2 · etkileşim 12/12; sorular 58–65).
- **M5 bitti** (66/66 · çekmece 2/2 · etkileşim 14/14; sorular 66–73).
- **M6 bitti** (60/60 · çekmece 2/2 · etkileşim 12/12; sorular 74–81).
- **M7 bitti** (66/66 · çekmece 2/2 · etkileşim 12/12; sorular 82–89).
- **M8 bitti** (60/60 · çekmece 2/2 · etkileşim 15/15; sorular 90–97).
- **M9 bitti** (60/60 · çekmece 2/2 · etkileşim 12/12; sorular 98–106).
- **M10 bitti** (30/30 · çekmece 2/2 · etkileşim 6/6; sorular 107–110).
- **M11 bitti** (48/48 · çekmece 2/2 · etkileşim 6/6; sorular 111–117). **Faz 1 maketleri bitti.**
- **M12 bitti** (54/54 · çekmece 2/2 · etkileşim 10/10; sorular 118–124).
- **M13 bitti** (48/48 · çekmece 2/2 · etkileşim 11/11; sorular 125–134; M5 ve M12 yeniden ölçüldü).
- **M14 bitti** (60/60 · çekmece 2/2 · etkileşim 14/14; sorular 135–143; Planlar ve M13 yeniden ölçüldü).
- **M15 bitti** (36/36 · çekmece 2/2 · etkileşim 9/9; sorular 144–151).
- **M16 bitti** (36/36 · çekmece 2/2 · etkileşim 10/10; sorular 152–158; M1, M10, Planlar yeniden ölçüldü). **Faz 1 + faz 2 maketleri
  bitti.** Sırada: toplu bakış sayfası.
- Toplu bakış öncesi tutarlılık: müşteri sayfasına (M2) faz 2 yüzleri (teklif, iş sözleşmesi, açık alacak); M2 48/48 · 14/14.
- **Toplu bakış bitti** (`docs/toplu-bakis.html`, `tools/sunum-uret.mjs` üretir; `docs/index.html`'den bağlantı): 16 maket · 127 soru
  (32–158) · durum 900/900 temiz · çekmece 32/32 · etkileşim 188/188 (sonuçlar `docs/assets/olcum/<maket>-etkilesim.json`); sayfanın
  kendi ölçümü 18/18. **Reisim'in toplu cevabı bekleniyor**; cevaplar pkproje.md'ye işlenir, sonra faz 1 sırasıyla kod.
- 2026-09-25: **telefonda sağa sola kayma düzeltildi** (reisim iPhone'da gördü → *"bunu düzelt"*): yazı alanı dokunmatikte 16 px
  (`--boy-girdi`; iPhone 16 px altında odakta büyütüyordu), 320 px'teki 4 taşma, ölçüme telefon taklidi
  (`tools/olc-bulut.mjs <maket> --telefon`: 320 · 360 · 390 · 430; sonuç `docs/assets/olcum/<maket>-telefon.json`).
- 2026-09-25: **sonraki yol** (reisim: *"daha sonra her modülü senin belirlediğin sırayla ele alacağız her modülü ele alırken o modül
  için sorduğun soruları tekrar sor çakışan ve gereksiz modüller var onlarıda teker teker ele alırken sileriz şimdi değil"*):
  127 soru toplu cevaplanmaz; modüller **benim önerdiğim sırayla tek tek** ele alınır, her modülde o modülün soruları reisim'e
  **yeniden** sorulur, cevaplar pkproje.md'ye işlenir. Çakışan / gereksiz modüller o modülün sırası gelince silinir — **şimdi değil**.
- 2026-09-25: **M1 2. tur** — reisim 32–43 ve 159'u cevapladı (pkproje.md §9 on ikinci tur): Kullanıcılar Personel'e katıldı (16 modül),
  rol yetkileri düzenlenir, geçici parola, kartta zimmet + özlük, Ana sayfa (`maket/anasayfa.html`), grup yetkilendirmesi kalktı, eksik
  bilgi uyarı. M1 150/150 · 32/32. **Reisim'in incelemesi bekleniyor**; onaylanınca sırada M2 Müşteri ve Tesis (sorular 44–50 + müşteri
  girişinin kendiliğinden açılması).
- 2026-09-25: M1'e **zimmet teslim formu** eklendi (temel format, imzalı tarama yükleme) ve pkproje.md **§3.7 firmaya göre değişen formatlar** listesi açıldı. M1 162/162 · 35/35.
- 2026-09-25: M1'de imzalı zimmet formu açılır ve kartta **zimmet geçmişi** (verildi / geri alındı tarihleri, imzalı formlar). M1 174/174 · 38/38.
- 2026-09-25: **M1 ONAYLANDI** (reisim: *"Onaylıyorum"*). Sırada **M2 Müşteri ve Tesis** — sorular 44–50 yeniden sorulur, müşteri girişi
  kendiliğinden açılır (cevap 33).
- 2026-09-25: **M2 2. tur** — reisim 44–50: *"Tüm önerilerin uygundur"* (pkproje.md §9 on üçüncü tur): müşteri girişi kendiliğinden, ek
  girişler, vergi / SGK no uyarı, pasif, il / ilçe listeden. M2 78/78 · 24/24 · telefon 52/52. **Reisim'in incelemesi bekleniyor**; onaylanınca
  sırada M3 Ekipman türleri · Ekipmanlar.
- 2026-09-26: **M2 ONAYLANDI** (reisim: *"Sıradakine geçelim"*). Sırada **M3** — reisim: *"ekipmanlar ve ekipman türleri diye iki modüle gerek
  yok ekipman türleri yeterli"*; sorular 51–57 ve ekipman kaydının yeri yeniden soruldu.
- 2026-09-26: **M3 2. tur** — reisim 51–57 (pkproje.md §9 on dördüncü tur): Ekipmanlar modülü kalktı (15 modül, ekipmanlar planın içinde),
  firma tür eklemez, yetkili meslek bölümü kalktı. M3 36/36 · 10/10 · 24/24. **Reisim'in incelemesi bekleniyor**; onaylanınca sırada M4
  Ölçüm cihazları · Zimmetler.
- 2026-09-26: **M3 2. tur, ek** — reisim: Tür ekle olsun, her türe firmanın rapor formatı PDF'i yüklensin, akreditasyon yazılmasın.
  M3 48/48 · 15/15 · 32/32. Reisim'in incelemesi bekleniyor.
- 2026-09-26: **M3 ONAYLANDI** (reisim: *"Sıradakine geçelim"*). Sırada **M4 Ölçüm cihazları · Zimmetler** — sorular 58–65 yeniden soruldu.
- 2026-09-26: **M4 2. tur** — reisim 58–65 ("59 hariç dediklerini kabul ediyorum"; 59: kalibrasyonu geçmiş cihazda gönderim engellenir):
  cihazda kimde / kod / kalibrasyon başta, zimmet onayı imzalı formla, fotoğraf ve ara kontrol isteğe bağlı. M4 72/72 · 20/20 · 48/48.
  Reisim'in incelemesi bekleniyor; onaylanınca sırada M5 İSG-KATİP.
- 2026-09-26: **M4 ONAYLANDI**. **M5 2. tur** — reisim A–H ("Önerilerin hepsi uygun başla"): Sözleşmeler = iş sözleşmesi, M5 + M13
  birleşti, İSG-KATİP ID'leri sözleşmenin içinde denetçiye göre, PDF ve onay tarihi isteğe bağlı, sözleşme şablonu yüklenir. M5 60/60 · 14/14 ·
  40/40. Reisim'in incelemesi bekleniyor; iş sözleşmesinin kalan soruları (M13) ve sonra M6 Plan aç.
- 2026-09-26: **M5 2. tur, ek** — imzalı sözleşme görüntülenir; uyarı yalnız İSG-KATİP (yok · geç onay · bitmiş); hizmet sözleşmesi uyarıları
  kalktı; numaralandırma firmaya göre (§3.7); M13 soruları cevaplandı. M5 66/66 · 16/16 · 44/44. Reisim'in incelemesi bekleniyor; sırada M6.
- 2026-09-26: **M5 ve M13 ONAYLANDI** (reisim: *"Sıradakine geçelim"*). Sırada **M6 Plan aç** — sorular 74–81 yeniden soruldu.
- 2026-09-26: **M6 2. tur** — reisim 74–81 ("Önerilerin uygun ama geliştirilebilir maketi yap inceleyeyim"): uyarılar engel değil, İSG-KATİP ID
  sözleşmeden / el ile, bitmiş uyarısı, sahada yeni ekipman alanı kalktı. M6 60/60 · 18/18 · 40/40. Reisim'in incelemesi bekleniyor.
