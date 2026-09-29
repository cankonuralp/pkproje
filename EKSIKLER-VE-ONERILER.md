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

---

## D · pkproje sunucu (backend) denetimi — 2026-09-29 · ✅ ONAYLANDI → `09-SUNUCU-VE-VERI.md`

> **2026-09-29, reisim:** *"o eski uygulama içindi bu uygulamanın ihtiyaçları farklı bu uygulamada thumbnaile vs de gerek yok bu arada veri
> tasarrufu ile de alakalı kurallarda eksik varsa onlarıda tamamla D kısmını okudum onayladım"* → maddeler kural oldu ve
> `09-SUNUCU-VE-VERI.md`'ye taşındı; **3. madde değişti** (küçük kopya üretilmez); veri tasarrufu maddeleri eklendi (09 · B); ANAYASA 4.9,
> 4.12, 5.1'e bu projenin hâli yazıldı. Aşağıdaki metin denetimin tarihsel kaydıdır; geçerli olan 09'dur.

Reisim (2026-09-29): *"bu rapor arşiv işleri backende giriyor ve backend kurallarımızı görmezden gelme, lazyload fotoğrafların gizli
görüntülenmesi vs vs bir sürü kuralımız var dikkat et kurallarımız backend açısından eksik mi bi kontrol et"*.
Yöntem: ANAYASA (4 · 5 · 7 · 9 · 13), 00–08 dosyaları ve pkproje.md §8 **tam** okundu; her kural bu projenin yığınına (Next.js sunucusu ·
PostgreSQL + RLS · S3 uyumlu depo · kendi giriş sistemimiz · pg-boss · PWA çevrimdışı kuyruk) karşı tek tek eşlendi.
**Bulgu türü:** ✅ kural var ve yığına taşınıyor · ⚠️ kural var ama Firebase diliyle, bu yığında karşılığı yazılmamış · ❌ kural yok.
Aşağıdakiler **öneridir**; reisim onaylarsa "yöntem" olanlar ANAYASA / ilgili 0x dosyasına, "ürün" olanlar pkproje.md'ye girer ve
her biri kod yazılırken ilk günden bir kilit testiyle kurulur (00: her kural bir testte kilitlenir).

### D1 · Dosya ve fotoğraf (gizli görüntüleme, geç yükleme) — ⚠️
Var: 04 (istemcide sıkıştır · küçük kopya · kalıcı herkese açık bağlantı yok · yetkiyle indir → blob · oturum önbelleği · yer tutucu +
gözlemci · PDF öncesi bekle · çevrimdışı kuyruktan göster), ANAYASA 4.9 / 5.1 / 9.2 / 9.4. Hepsi Firebase adlarıyla (getBlob, App Check,
`belgeler/{cid}/`). Bu yığındaki karşılığı yazılmamış:
1. **Depo tamamen kapalı** (herkese açık okuma yok, liste yok); nesne anahtarı tek üreticiden: `firma/{firma_id}/{modül}/{kayıt_id}/{dosya_id}`
   (07 "kiracı yolu tek üreticiden"in depo karşılığı). Anahtarda kişi adı, dosya adı, rapor no gibi okunur bilgi yok (5.8).
2. **Tek indirme ucu:** her dosya `GET /api/dosya/{dosya_id}` üzerinden; sunucu oturumdan kullanıcıyı, kiracıyı ve **kaydın sahipliğini**
   (ör. müşteri yalnız kendi tesisinin tamamlanmış raporunun fotoğrafı) veritabanında RLS altında doğrular, sonra ya dosyayı akıtır ya da
   **≤ 5 dakikalık** imzalı bağlantıya yönlendirir. Veritabanında yalnız anahtar tutulur, bağlantı asla saklanmaz. Yanıt başlıkları:
   `Cache-Control: private, no-store` (gizli belge), `Content-Disposition`, `X-Content-Type-Options: nosniff`.
3. **Küçük kopya + geç yükleme:** her görselin ~240 px kopyası (yükleme sırasında, başarısızsa yükleme kırılmaz, yoksa tam boya düşer);
   liste ve önizleme küçüğü ister, `loading="lazy"` + görünür alana girince indirme; tam boy yalnız büyüt / PDF / yazdırmada. Kaynak adres
   asla doğrudan `src`'ye yazılmaz (`<GizliResim>` tek bileşen) — 04'ün bileşen karşılığı.
4. **Yükleme denetimi sunucuda:** tür, içeriğin ilk baytlarından denetlenir (uzantıya güvenilmez); izin verilenler: JPEG, PNG, PDF, .xlsx
   (+ gereken yerde); **SVG ve HTML yüklenmez** (tarayıcıda betik çalıştırır); boyut sınırı sunucuda da; görselin EXIF'teki konum bilgisi
   silinir (KVKK); PDF yeniden işlenmez (imzalı PDF bozulur).
5. **Öksüz dosya ve silme:** kaydı silinen dosya çöpe (30 gün) gider; gece işi depoda veritabanında karşılığı olmayan nesneyi bulur, silmez,
   **raporlar** (ANAYASA 9.4'ün dersi: yanlış referans seti canlı dosyayı siler). Silme yalnız çöp süresi dolanda.

### D2 · Giriş, oturum, alt alan adı — ❌ (yöntem kuralı yok; ürün kararları var: pkproje.md karar 34, 37)
6. Parola **Argon2id** (ya da bcrypt) ile özetlenir, düz metin hiçbir yere (log, e-posta gövdesi dışında tek seferlik geçici parola) yazılmaz;
   geçici parola ilk girişte değiştirilir (karar 34). 5 hatalı denemede 15 dk kilit (karar 37) **IP'ye de** uygulanır.
7. Oturum çerezi `HttpOnly · Secure · SameSite=Lax`, **alan adı her firmanın kendi alt alan adı** (`Domain` üst alan adına yazılmaz — yoksa
   bir firmanın çerezi öteki firmanın adresine gider). Kiracı alt alan adından çözülür, oturumdaki kiracıyla **eşleşmezse istek reddedilir**.
8. Durumu değiştiren her istek (POST/PUT/DELETE) CSRF'e karşı korunur (aynı köken denetimi + belirteç); yanıtlarda sıkı içerik güvenlik
   politikası (CSP: yalnız kendi kökenimiz — ANAYASA 5.2 "üçüncü tarafa veri gitmez"in tarayıcı kilidi).
9. Yetki düşürme / hesap kapatma (Personel'de var) o kullanıcının **açık oturumlarını hemen** sonlandırır (07'deki "jeton yenilenene kadar
   eski yetki" sorununun bu yığındaki karşılığı: oturum sunucuda tutulur, her istekte okunur).

### D3 · Kiracı ve müşteri erişimi — ⚠️
Var: tek erişim katmanı `kiraciIcinde`, her tabloda ENABLE + FORCE RLS, uygulama rolü süper kullanıcı değil, iki firmalı gerçek PostgreSQL
testi (kilitli). Eksik:
10. **Müşteri portalı ikinci katmandır:** müşteri kullanıcısı için RLS'de firma + **müşteri** + "müşteriye açık" (tamamlanmış, son sürüm,
    arşivde değil) koşulu; bu da iki müşterili gerçek PostgreSQL testiyle kilitlenir. Rol × modül matrisi (Personel › Rol yetkileri) sunucuda
    **tek `canDo`** ile uygulanır; istemcideki gizleme kolaylıktır (07).
11. **Dondurulmuş firma** tek bayrak (07): hem RLS/erişim katmanı hem arka plan işleri okur.

### D4 · Yazma, eşzamanlılık, çevrimdışı — ⚠️
Var: 05 (beyaz liste · tek satır yaması · güvenli yazıcı ailesi · idempotent göç), 07 "yazma reddi görünür". Bu yığında eksik:
12. **Sürüm sütunu ile iyimser kilit:** her düzenlenen kayıtta `surum`; `UPDATE … WHERE id = $1 AND surum = $2` → 0 satır = "başkası
    değiştirdi" uyarısı, sessiz ezme yok (05'in SQL karşılığı). Yalnız değişen alanlar yazılır.
13. **Çevrimdışı gönderim tek seferlik:** saha cihazından gelen her işlem bir **işlem kimliği** taşır; sunucu aynı kimliği ikinci kez
    işlemez (bağlantı kopup tekrar denenince rapor iki kez onaya gitmez, fotoğraf iki kez eklenmez). Çakışmada sunucu kazanır, cihaz
    kullanıcıya gösterir (03 "await sonrası bağlamı doğrula"nın karşılığı: kuyruk işlenirken oturumdaki firma değiştiyse gönderme).
14. **Durum geçişleri sunucuda tek yerde:** rapor durum makinesi (Yeni → onayda → imza → imzada → Tamamlandı; geri gönder, durum değiştir,
    revize) bir modül işlevinde; izin verilmeyen geçiş reddedilir; her geçiş denetim izine yazılır (kim, ne zaman, eski, yeni, gerekçe) —
    makette V1'de kurulan kural.

### D5 · Sorgu ve performans (geç yükleme) — ⚠️
Var: 03 (sınırsız büyüyen veri açılışta inmez · liste hafif indeksten · özet sayaç · geç yüklenen veri ölçüme girer), EKSİKLER 15 (dizin).
15. Her liste **sunucu tarafında sayfalı** (sayfa 10 / 20 — kalıp sayıları) ve **yalnız listenin sütunlarını** çeker; tam kayıt (kriterler,
    ölçümler, fotoğraflar) yalnız detayda. Süzgeç ve alan aramalarının her sütununa dizin; yavaş sorgu kaydı (ör. > 200 ms) hata kaydına düşer.
16. Pano ve yan menü balonları (takip sayıları) **özet sorgudan / özet tablodan** gelir, bütün kayıtları saymaz; arka plan işi tazeler, iki
    kaynak çelişirse sunucu kazanır (03).

### D6 · Rapor arşivi, silme, yedek — ⚠️ + ❗ çelişki
17. ❗ **ANAYASA 4.12 "belge/rapor/foto ASLA otomatik silinmez"** ile 185 kararı ("firma Sil seçerse 5 yıl sonra silinir") çelişiyor. Öneri:
    4.12'ye istisna cümlesi — *"yalnız firmanın açıkça seçtiği saklama kuralıyla (pkproje.md §3, 185), 30 gün önceden liste, çöp kutusu
    (30 gün geri alınabilir), denetim izine kayıt"*. (Anayasa değişikliği reisim onayıyla.)
18. **Arşive taşıma güvenli sırayla:** kopyala → arşivdeki nesnenin özetini (SHA-256) kaynakla karşılaştır → künyeyi "arşivde"ye çevir →
    ancak sonra kaynağı sil. Herhangi bir adım düşerse kaynak kalır, iş yeniden dener (idempotent), hata görünür. Arşiv yerinin erişim
    bilgisi sır olarak saklanır (`.env` değil, şifreli firma ayarı), ekranda gösterilmez.
19. **Yedek:** yönetilen PostgreSQL'in anlık yedeği + zaman noktasına dönüş; ek olarak uygulama seviyesinde dışa aktarım (05); depoda
    **sürümleme** açık. Silinen / arşive taşınan veri yedeklerden de belirli sürede düşer (KVKK "silme" yedekte sonsuza kadar yaşamaz) —
    süre ürün kararı.
20. **Geri yükleme** 05'teki üç korumayla (yedekten sonra eklenen kayıt silinmez).

### D7 · İmza ve belge bütünlüğü — ❌ (V2/V3 ile doğdu)
21. İmzalı PDF **değişmez**: imzadan sonra nesne yeniden yazılmaz; özeti (SHA-256) veritabanında; düzeltme yalnız revizyonla yeni nesne
    (R1…). Görüntülemede özet doğrulanır.
22. İmza isteği ve sonucu (operatör / imza aracı) denetim izine; zaman damgası; **yanıtsız istek süresi dolunca** rapor imza beklemeye
    döner (194). İmza aracı ↔ sunucu iletişimi yalnız kendi kökenimiz, tek kullanımlık belirteçle.

### D8 · Arka plan işleri (pg-boss) — ❌
23. Her iş **kiracı bağlamıyla** koşar (RLS için firma ayarı işin içinde kurulur, iş bitince sızmaz — "önceki kiracının ayarı havuza sızmaz"
    kilidi işlere de uygulanır); her iş idempotent; tekrar deneme sınırlı; kalıcı düşen iş görünür (hata kaydı).

### D9 · Kişisel veri (KVKK) — ⚠️
24. **Özel nitelikli veri** (izin ekindeki sağlık raporu, özlük dosyası) ve **maaş / bordro**: yalnız yetkili rol görür (makette karar var),
    her açılış erişim kaydına yazılır; dosya adında kişisel veri yok; loglara kişisel veri yazılmaz (e-posta, telefon, TC maskelenir) — 06
    "hata kaydı bağlamıyla"nın sınırı.
25. Veri yurt dışına çıkmaz (§8.8) — e-posta, hata izleme, yapay zekâ ile sigorta okuma (§8.10) gibi dış servislerin her biri bu kurala
    göre seçilir; yurt dışı servise kişisel veri gitmez.

### D10 · E-posta — ❌
26. E-postaya **dosya eklenmez ya da kalıcı bağlantı konmaz**: talep / rapor e-postası giriş gerektiren bağlantı taşır (5.1); gönderim
    kendi alan adımızdan (SPF / DKIM / DMARC), gönderim sonucu kayıtlı.

### D11 · Doğrulama — ⚠️
27. Duman testi (06) bu yığın için: sağlık ucu, veritabanı bağlantısı, RLS açık mı, depo özel mi (anonim istek 403 mü), son yedek tazeliği,
    arka plan kuyruğunda takılı iş.
