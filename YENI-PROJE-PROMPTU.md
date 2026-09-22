# YENİ PROJE PROMPTU

Aşağıdaki metin, yeni projede açılan yeni Claude penceresine **olduğu gibi** yapıştırılır.

**Bu kit neyi taşıyor:** çalışma biçimini ve disiplinleri. Ürün, alan adı, mimari kararlar
taşınmıyor — yeni proje bambaşka olabilir.

**En önemli iki dosya:**
- `ANAYASA.md` — kaynak projenin çalışma anayasasının **aynısı** (değiştirilmedi). Yeni projede
  yeniden yazılmaz, olduğu gibi geçerlidir.
- `TASARIM-KALIBI.md` — tasarım kalıbının aynısı; sayıları kaynak projenin ölçümüdür, yöntemi geneldir.

`00`–`08` numaralı dosyalar bu kuralların koddaki kanıtını taşır (`dosya:satır` + gerçek kod);
yeni proje farklı bir yığın kullanıyorsa oradaki "Yeni projeye uyarlama" satırları yol gösterir.

---

## Kopyalanacak metin

Merhaba. Bu projede çalışmaya başlıyoruz. Önce çalışma disiplinimizi kuracağız, sonra koda geçeceğiz.

BU PROJE HAKKINDA:
- Bambaşka bir proje — daha önce birlikte çalıştığımız üründen bağımsız.
- Şimdilik alan adı, canlı ortam ve yayın yok. Localde geliştirip localde bakacağım; istediğim gibi olduktan sonra yayınlama işlerine gireceğiz.
- Buraya taşımak istediğim tek şey **çalışma biçimimiz ve öğrendiğimiz disiplinler**; ürün kararları değil.

BAŞVURU KAYNAĞI — AKTARIM-KITI/ klasörü (bu projenin kökünde):
- ANAYASA.md → önceki projede yıllar içinde biriken çalışma anayasasının AYNISI. Yeniden yazmanı istemiyorum, olduğu gibi geçerli. Tamamını oku.
- TASARIM-KALIBI.md → tasarım kalıbının aynısı. Yöntemi geçerli; içindeki ölçüler önceki projenin ölçümü, bu projede kendi referans ekranımızı ölçerek belirleyeceğiz.
- 00-ANAYASA.md · 01-MIMARI.md · 02-GORSEL-SISTEM.md · 03-PERFORMANS-LAZYLOAD.md · 04-GORSEL-VARLIK-BLOB.md · 05-VERI-GUVENLIGI.md · 06-HATA-TAKIBI.md · 07-YETKI-VE-COKLU-KIRACI.md · 08-CALISMA-DISIPLINI.md → aynı kuralların koddaki kanıtı (gerçek dosya:satır). Her kuralın sonunda "Yeni projeye uyarlama" satırı var.
- EKSIKLER-VE-ONERILER.md → önceki projede eksik kalanlar; burada baştan kurmak istediklerim.

İLK İŞİN (koda dokunmadan, sırayla):
1. AKTARIM-KITI/ içindeki ANAYASA.md ve TASARIM-KALIBI.md dosyalarını TAM oku (önizleme değil). Sonra 00–08 dosyalarını oku.
2. Bana aşağıdaki soruları tek seferde sor, cevapları bekle.
3. Cevaplara göre bu projenin kökünde CLAUDE.md yaz: ne yaptığımız, dizin haritası, komutlar (test / derleme / localde çalıştırma), teslim zinciri, "asla yapma" listesi. ANAYASA.md'yi KOPYALAMA — ona referans ver, CLAUDE.md yalnız bu projeye özgü olanı taşısın.
4. CLAUDE.md'yi bana göster, onaylayınca koda geçeriz.

ANAYASADA ŞİMDİLİK ASKIDA OLAN MADDELER (yayına çıkınca açılacak, unutma):
- Canlı ortamda doğrulama, dağıtım (deploy), canlı veriye dokunma kuralları.
- Uzak depoya gönderme (git push) — uzak depo kurulana kadar.
- Gerçek cihaz teyidi — mobil hedefimiz olursa.
Bunların yerine şimdilik: testler + derleme + LOCALDE çalıştırıp kendi gözünle doğrulama + kanıt özeti.

TESLİM ZİNCİRİ (bu projenin şimdilik geçerli hâli):
testler (sıfır başarısızlık) → derleme → localde çalıştır ve GÖZLE doğrula → değişiklik farkını oku → commit → kanıt özeti.
Bir teslimde BİR kalem. Kanıt özeti "ne baktım · nerede · ne gördüm" biçiminde; bana test ödevi verme, doğrulamayı sen yap.

EN KRİTİK 10 KURAL (ANAYASA.md okunamazsa bile bunlar geçerli):
1. Her kural bir testte kilitlenir. Düzeltilen her hata, o hatayı geri getirecek değişikliği düşüren bir test bırakır. Testin başına "bu neyi koruyor, nereden geldi" yaz.
2. Kilit kapanır, gevşemez (ratchet). Bilinen istisnalar sayıyla kilitlenir; sayı azalabilir, asla artamaz. Kırılan test susturulmaz — tarih ve gerekçeyle güncellenir.
3. Yazma kapsamı, değişikliğin kapsamı kadardır. Tek kaydın alanı değiştiyse listenin tamamı yazılmaz: güncel hâlde kaydı kimliğiyle bul, yalnız o alanları yaz, kayıt yoksa iptal et. ("Son yazan kazanır" bir veri kaybı tasarımıdır.)
4. Toplu kaydetme açık beyaz listeyle yazar. Yazılacak alanlar tek tek sayılır; listeden çıkarılan her alanın NEDEN çıkarıldığı aynı yerde yazar. Bellekte eksik duran veri asla gerçeğin üstüne yazılmaz.
5. Zamanla sınırsız büyüyen veri açılışta yüklenmez; yüklenmeyen veri için "yüklendi mi" bayrağı tutulur ve o alan genel kaydetmeden çıkarılır.
6. Her await sonrası bağlam yeniden doğrulanır. İstek uçuştayken aktif kayıt/kullanıcı değişebilir; dönüşte değiştiyse gelen veri yazılmaz.
7. Güvenlik sunucudadır; istemci kontrolü kullanılabilirlik içindir. Kök seviyesinde geniş izin verilmez. Aynı gerçeğin birden fazla kopyası varsa (rol tanımı gibi) kopyaları bir test bağlar.
8. Her ekran çizimi kendi hata zırhında koşar; yakalanmayan hatalar tek yerde, kısılmış ve bağlamıyla kaydedilir. Başarısız yazma kullanıcıya görünür olur — sessizce yutulmaz.
9. Ortak iş tek üreticiden çıkar (liste, süzgeç satırı, seçim alanı, uzun işlem tuşu, boş durum). Paylaşılan bir mekanizmaya dokunmadan önce tüm çağıranları listele. Tasarım kararları belgeye değil, ölçen bir teste yazılır.
10. Bir teslimde bir konu. Commit mesajı ne yapıldığını değil, nerede ve nasıl doğrulandığını anlatır; ölçülemeyen şey "ölçemedim" diye yazılır.

ÇALIŞMA BİÇİMİ:
- Görsel/arayüz işlerinde önce maket + onay, sonra kod. Masaüstü ve mobil AYRI tasarlanır.
- Kapsam dışı bulduğun işleri hemen yapma; not et, ayrı kalem olarak sıraya al.
- Mevcut çalışan bir davranışı "iyileştirmek" için isteğim dışında değiştirme.
- Ajan/paralel iş açmadan önce sor; önce kendi okuman ve araman.

BANA SORACAKLARIN (tek seferde, kısa):
1. Bu proje ne yapacak? (Bir cümle yeter, gerisini konuşarak açarız.)
2. Yığın ne olsun — dil, çerçeve, veri katmanı? Yoksa sen mi önereceksin?
3. Kullanıcı/yetki kavramı olacak mı? Çok kullanıcılı mı, tek kişilik mi?
4. Veri nerede duracak — yerel dosya, yerel veritabanı, bulut?
5. Arayüz var mı; varsa masaüstü mü, mobil mi, ikisi mi?
6. Testleri hangi araçla koşalım (bağımlılıksız yerleşik test koşucusu tercihim)?
7. EKSIKLER-VE-ONERILER.md listesinden (CI, statik çözümleme, tip denetimi, kaynak haritası, uçtan uca test, görsel regresyon, erişilebilirlik taraması, hata alarmı) hangilerini ilk günden kuralım?

Önce bu soruları sor. Cevapları aldıktan sonra CLAUDE.md'yi yaz, bana göster. Kod yazmaya ondan sonra başlayacağız.
