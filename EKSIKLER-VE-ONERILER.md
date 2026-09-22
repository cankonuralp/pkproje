# EKSİKLER VE ÖNERİLER

Bu dosyadaki maddeler **kural değildir** — kaynak projede kod karşılığı bulunmadığı için kural
dosyalarına alınmadılar. Hepsi doğrulanmış bir **yokluk** ya da doğrulanmış bir **tutarsızlık**tır.
Yeni projede baştan kurmak, sonradan eklemekten ucuzdur.

---

## A · Kaynak projede bulunmayanlar (doğrulandı)

### 1. Sürekli tümleştirme (CI) yok
`.github/` dizini yok; depoda iş akışı dosyası bulunmuyor. Testler yalnız elle koşuluyor.
İlginç ayrıntı: `scripts/build.mjs:4` hâlâ *"CI (pages.yml) bunu koşar ve dist/'i yayınlar"* diyor —
**yorum eskimiş** (bkz. C bölümü).
**Öneri:** Yeni projede ilk gün: her itmede `test` + `build` koşan tek bir iş akışı. Testin
geçmediği dal birleştirilemesin.

### 2. Statik çözümleme / biçimlendirme yok
`eslint`, `prettier`, `tsconfig` yapılandırması yok; `package.json` içinde `lint` betiği yok.
Sözdizimi denetimi yalnız derleme anında yapılıyor (`scripts/build.mjs:26-33`).
**Öneri:** En azından kullanılmayan değişken, tanımsız değişken ve `no-undef` kuralları. Tek başına
bu üçü, kaynak projede elle yazılmış "küresel ad çakışması" testinin bir kısmını bedavaya getirir.

### 3. Tip denetimi yok
Proje tamamen tip bilgisiz JavaScript. Veri şekli (dizi mi anahtarlı harita mı) yalnız yorumlarla
taşınıyor — ve bu, geri yükleme tarafında gerçek bir hataya yol açmış
(`src/js/06-yedekleme-cop-kutusu.js:169-171`, "ŞEKİL KORUNUR" notu).
**Öneri:** Yeni projede TypeScript ya da en azından JSDoc tipleri + `checkJs`. Özellikle veri
dallarının şekli tiple tanımlansın.

### 4. Kaynak haritası (source map) yok
Derlemede `sourcemap` seçeneği kullanılmıyor. Üretimdeki yığın izleri ancak tanımlayıcı adları
korunduğu için okunabiliyor (`scripts/build.mjs:46-51`).
**Öneri:** Kaynak haritası üret ve **yalnız hata izleme servisine** yükle (herkese açık sunma).
Böylece tam küçültme de mümkün olur.

### 5. Uçtan uca (tarayıcı) testi yok
`playwright`/`puppeteer` bağımlılığı yok; testlerin tamamı kaynak metni tarayan ya da saf fonksiyon
koşturan birim testleri (`tests/harness.js`).
**Öneri:** Kritik üç akış için uçtan uca test: giriş, ana kayıt oluşturma, yayın sonrası duman.
Kaynak projedeki `tools/smoke.js` bunun sunucu tarafı karşılığı — tarayıcı tarafı boş.

### 6. Görsel regresyon testi yok
Ekran ölçümleri elle ve canlı ortamda yapılıyor (teslim mesajlarındaki "1920 · 1080 · 375 ölçüldü"
notları). Otomatik ekran görüntüsü karşılaştırması yok.
**Öneri:** Kritik ekranlar için görsel anlık görüntü testi. Elle ölçüm disiplini iyi ama
tekrarlanabilir değil ve yalnız bakılan ekranı kapsıyor.

### 7. Erişilebilirlik testi yok
Kodda erişilebilirlik yardımcıları var (`a11yLabels`, `markDialog` — `src/js/22-modal-tema-events-baslat.js:47-48`)
ama bunları doğrulayan bir test yok.
**Öneri:** Otomatik erişilebilirlik taraması (axe benzeri) en azından açılış ekranı ve bir form için.

### 8. Hata kayıtları için uyarı/alarm yok
Hatalar veritabanına yazılıyor ve yalnız en üst yönetici ekrandan bakınca görülüyor
(`src/js/08-kilit-save-giris-hata.js:813-824`). Eşik aşıldığında kimseye haber gitmiyor.
**Öneri:** Hata sayısı eşiği + günlük özet bildirimi. "Kimse bakmazsa kayıt işe yaramaz."

### 9. Olumsuz kanıt betikleri depoda değil
Teslim mesajlarında raporlanan "olumsuz kanıt N/N" ölçümleri, geçici klasörde yazılıp atılan
betiklerle yapılıyor; depoda karşılıkları yok.
**Öneri:** Bu betikleri `tests/bozan/` altında sürümle ve `npm run test:negatif` gibi bir betikle
koşulabilir yap. Aksi hâlde disiplin kişiye bağlı kalır — taşınamaz.

### 10. Testler için tek komut var ama kapı mekanik değil
`npm test` var; ancak "başarısız test varsa derleme yapılmaz" kuralı yalnız çalışma disiplininde,
kodda değil (`scripts/build.mjs` testleri koşmuyor).
**Öneri:** `build` betiği önce testleri koşsun ya da commit öncesi kanca kursun.

---

## B · Kaynak projede var ama yeni projede **farklı** kurulması önerilenler

### 11. Tek dosya derleme, barındırmaya bağlı bir ödündür
Gerekçe `scripts/build.mjs:6-9` içinde açıkça yazılı ve "başka barındırmaya geçilirse hash'li
parçalara geçmek doğru olur" diyor.
**Öneri:** Yeni projede önbellek başlıklarını kontrol edebiliyorsan tek dosya kuralını **taşıma**;
kural değil, çözüm olduğu sorunu taşı.

### 12. Tek küresel ad alanı ve satır içi olay bağlayıcılar
2377 üst düzey işlev tek kapsamda (`tests/kuresel-ad-cakismasi.test.js:12`). Bu, küçültmeyi
kısıtlıyor (`minifyIdentifiers:false`) ve ad çakışması testini zorunlu kılıyor.
**Öneri:** Yeni projede modül sistemi kullan; ad çakışması testi yerine "aynı id / aynı seçici"
taramalarını al.

### 13. Beş farklı ekran genişliği eşiği birikmiş
Ölçüm: `src/style.css` içinde 759 · 760 · 1000 · 640 · 479 · 600 · 900 gibi çok sayıda eşik var
(`@media` sayımı: 759px 16 kez, 1000px 13 kez, 640px 6, 479px 6…).
**Öneri:** Yeni projede iki–üç adlandırılmış eşikle başla ve token olarak tut; eşik eklemek karar
gerektirsin.

---

## C · Doğrulanmış tutarsızlıklar (kaynak projede düzeltilmeli, yeni projeye taşınmamalı)

### 14. `scripts/build.mjs:4` eskimiş bilgi veriyor
> "CI (pages.yml) bunu koşar ve dist/'i yayınlar — build çıktısı artık git'e GİRMEZ."

Depoda `pages.yml` ve `.github/` yok. Yorumun ilk yarısı artık doğru değil.
**Not:** Bu kitin kapsamı salt okunur olduğu için **düzeltilmedi**, yalnız raporlanıyor.

### 15. Kural dosyalarında dizin kullanımı çok sınırlı
`database.rules.json` içinde 62 doğrulama (`.validate`) kuralına karşılık yalnız 4 dizin
bildirimi (`.indexOn`) var.
**Öneri:** Sorgulanan her dal için dizin bildir; aksi hâlde sunucu tüm dalı istemciye indirip
istemcide süzer (sessiz maliyet).
