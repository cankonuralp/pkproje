# İMZA SERVİSİ — probata'nın kendi e-imza ve doğrulama servisi (açılış 2026-10-17, TASARIM)

> Reisim (2026-10-17): *"ayrı bir dosya açalım, bu dosyada e imza servisi ve doğrulama servisini bir yandan geliştirelim, bu iş ayrı bir iş
> olarak sadece e imza servisi almak isteyenler tarafından da kullanılabilsin ve imzalama sürecinde insanlar sitelerinden çıkmak zorunda
> kalmasın bir eklenti indirterek ve veya api bağlayarak hizmeti insanlara sunalım, mobil imzada bu iş basit ama e imza da nasıl yaparız
> bilemiyorum … bu sistemi sign.probata.com.tr de paylaşmak istiyorum şirketlerde eğer e imza hizmeti satın alırlarsa örneğin [firma];
> sign.[firma].probata.com.tr adresinde olsun imzalı dosyaları ve doğrulamalar bu adresteki onlara ait raporlara göndertip doğrulamaları
> yaptırtsın"* (örnekteki firma adı buraya yazılmadı).

**Bağlam (`pkproje.md` §11, 2026-10-17):**

| Karar | Bu dosyayla ilişkisi |
|---|---|
| **İMZA YOLLARI** (3): "kendi imza servisimiz SONRA, aynı yapıya bir sağlayıcı olarak" | **Bu dosya o servisin kendisi.** Aynı gün reisim bu servisin ayrı ürün olarak, bir yandan tasarlanmasını istedi. |
| İMZA YOLLARI (5): üçüncü taraf sağlayıcı bağlantısı şimdilik yapılmaz | Değişmedi. Bugünkü yol: toplu indir → imzala → toplu yükle (596). |
| Teknik yönetici imzası (Firma ayarları `imza.teknik`) | Yapıldı. |
| Formatta iki e-imza yeri, onaylanan / onaylayan (İ5) | Yapıldı. |
| Firma başına Supabase | Rafa kalktı. Veri ortak projede, kiracı süzgeçli. |

İmzanın gücü için ölçüt, reisim'in gönderdiği aracı firma çıktısı. Açılıp incelendi: **beş katman** (§3). Reisim: *"eğer bu belgede varsa bizde
koyucaz"*.

> **Durum: TASARIM. Kod yok.** Bu dosya bu işin tek kaynağı. Her karar alındıkça `pkproje.md`'ye işlenir. Görsel her parça önce maket. Kalem adları
> **ES1–ES6** (E-imza Servisi; İ1–İ6 başka iş için kullanılıyor).

---

## 0 · Kısa cevap: ne yapılabilir

| İstek | Yapılabilir mi | Not |
|---|---|---|
| Ayrı ürün: yalnız imza almak isteyen firmalar da kullansın | **Evet** | probata'nın kiracı yapısı aynen; "yalnız İmza modülü açık firma" (§6) |
| Mobil imza, kullanıcı siteden çıkmadan | **Evet** | İstek operatörden telefona düşer. Şart: üç operatörle "mobil imza uygulama sağlayıcı" sözleşmesi + sabit çıkış IP'si (§2.1) |
| USB e-imza (kart), kullanıcı siteden çıkmadan | **Evet, bir kez kurulumla** | Tarayıcı karta kendi başına erişemez; eklenti + küçük yardımcı program şart. İmza siteleri de böyle çalışıyor (§2.2) |
| Kurulumsuz USB e-imza | **Hayır** | Bugünkü tarayıcılarda yolu yok (§2.2) |
| Telefonda / tablette USB e-imza | **Hayır (pratikte)** | Sahada mobil imza |
| Başka firmaların kendi sitelerine bağlanma (API + eklenti) | **Evet** | Bizim imza penceremiz onların sayfasına gömülür; kullanıcı siteden çıkmaz (§2.3) |
| `sign.probata.com.tr` + firma başına adres | **Evet** | Reisim'in biçimi `sign.<firma>.probata.com.tr`; firma açılırken adres kendiliğinden eklenir (§5) |
| İmzalı dosyalar ve doğrulama firmanın adresinde, firmanın raporlarında | **Evet** | Kiracı yapısı hazır; firmanın verisi yalnız onun adresinde açılır |
| İncelenen aracı firma çıktısıyla aynı güçte imza | **Evet** | Beş katman + arşiv tazeleme (§3) |
| Başka sağlayıcıların e-imzalı PDF'lerini de doğrulama | **Evet** | Doğrulama servisi tek başına da ürün olur (§4) |

---

## 1 · Ürün: kim, ne alır

**probata firmaları:**
- Raporların imzaları: muayene uzmanı ve, ayar açıksa, teknik yönetici. Formatın iki imza yerine atılır.
- İç belgeler: zimmet, saha formu, izin / masraf formu, bordro.
- Onaylar › İmzamı bekleyen raporlar ve Onaylar › Diğer bu servisi "İmzaya gönder" ile kullanır. İMZA YOLLARI'ndaki sağlayıcı yapısına
  probata'nın kendi servisi olarak takılır (§6).

**Yalnız imza alan firmalar:**
- Kendi adreslerinde panel: belge yükle, imzacı ekle, sıra ver, takip et, imzalı belgeyi indir, doğrula.
- Kendi yazılımları için **API + bildirim (webhook)**.
- Kendi sayfalarına gömülen **imza penceresi**.

**İmzalayan:** firmanın çalışanı (giriş yapmış) ya da dışarıdan imzacı (müşteri yetkilisi gibi; e-posta / SMS bağlantısıyla gelir).

**Doğrulayan:** herkes — karekod, doğrulama sayfası, API.

---

## 2 · İmza yolları

### 2.1 Mobil imza
1. Kullanıcı "İmzaya gönder"e basar.
2. Sunucumuz belgenin **özetini** operatöre yollar (dosya gitmez).
3. Telefona onay isteği düşer, kişi PIN'i girer.
4. İmza sunucumuza döner; motor (§3) belgeye gömer, damgalar, doğrular.

**Gerekenler:**
- Turkcell, Vodafone, Türk Telekom ile ayrı ayrı "mobil imza uygulama sağlayıcı" sözleşmesi. Sözleşmeyi probata yapar; başvuru, test ortamı
  ve süre her operatörde ayrı.
- **Sabit çıkış IP'si** (operatörler IP yetkisi istiyor). Vercel'in Static IPs özelliği yalnız Pro / Enterprise planda ve ücretli; deneme
  yayını bugün Hobby planda. Alternatif: sabit adresli küçük bir geçit sunucusu.
- Personel kartında mobil imza telefonu var (195).
- Her belge ayrı onay; toplu imzada tek onay imkânı operatöre sorulacak.

### 2.2 USB e-imza (kart) — siteden çıkmadan

**Neden eklenti şart:**
- Normal bir web sitesi karta doğrudan erişemez.
- Chrome'un akıllı kart arabirimi (Web Smart Card API) normal sitelere açık değil.
- WebUSB akıllı kart okuyucularını korumalı sınıf sayıp engelliyor.
- Bilgisayarda yerel adresten çalışan bir program da tek başına yetmiyor: Chrome 141'den beri genel bir sitenin yerel adrese isteği izin
  penceresine bağlı, her site için ayrı ve kırılgan.
- Bu yüzden yerleşik yol: **tarayıcı eklentisi + eklentinin konuştuğu yerel program** (Chrome'un "native messaging" yolu).

**Parçalar:**

| Parça | Ne yapar | Not |
|---|---|---|
| **probata imza eklentisi** | Chrome, Edge (Firefox sonra). Yalnız bizim adreslerimizle (`sign.probata.com.tr` ve firma adresleri) konuşur; başka siteye kendini açmaz. | Chrome / Edge mağazasında yayın |
| **Yardımcı program** | Windows kurulum dosyası. AKİS'in kart kütüphanesiyle kartı kullanır. **PIN'i kendi penceresinde sorar** (web sayfası PIN'i hiç görmez), imzalanacak belgenin adını gösterir. | **Kod imzalama sertifikası** şart (yoksa Windows ve Uygulama Denetimi engeller) |
| **İmza penceresi** | `sign.probata.com.tr`'den gelen küçük pencere. probata ekranlarında doğrudan açılır; başka sitelerde o sitenin sayfasına gömülür. | Kullanıcı siteden çıkmaz |

**Akış:**
1. Site belgeyi (ya da yalnız özetini) API'mize gönderir.
2. İmza penceresi açılır, eklenti yardımcı programla konuşur.
3. Yardımcı program sertifikayı okur; sunucu **PIN'den önce** denetler (nitelikli mi, iptal mi, doğru kişi mi — `imza-kimlik.ts`'in ad karşılaştırması).
4. Yardımcı program PIN'i sorar, kart imzalar.
5. Motor (§3) imzayı gömer.
6. Siteye bildirim gider, imzalı PDF indirilir.

**Toplu imza:** PIN bir kez girilir, her belge ayrı imzalanır (karar 99).

**Kurulum:** bir kez yapılır. Eklenti yoksa pencere "Eklentiyi kur" der ve yolu gösterir.

**Mac / Linux:** AKİS'in Mac sürümü var. Yardımcı programın Mac sürümü ayrı iş (Apple geliştirici hesabı, noter onayı); sonraki faz.

### 2.3 Başka sitelere bağlanma (API + imza penceresi)
1. Firmanın sunucusu API anahtarıyla belgeyi gönderir ve imzacıyı bildirir.
2. Firmanın sayfasına bir satırlık bizim betiğimiz konur; imza penceresi orada açılır.
3. İmza bitince firmanın sunucusuna **imzalı bildirim** (HMAC) gider; imzalı PDF API'den alınır.
4. Doğrulama karekodu firmanın imza adresine (§5) gider.

### 2.4 Yedek yol: toplu indir → imzala → toplu yükle (596, bugün var)
- Her firmada açık kalır.
- Yüklenen belgeye doğrulama bilgileri ve arşiv damgasını yüklemede biz ekleriz; çıktı aynı güce gelir (ES2).

---

## 3 · İmza motoru (sunucu) — beş katman

| Katman | Ne kanıtlar | Kimden |
|---|---|---|
| 1. Nitelikli sertifika + kart | İmzalayan kim | Kişinin kartı (sertifika hizmet sağlayıcıları) |
| 2. Belgeye gömülü imza (PAdES) | Belge değişti mi | Kart imzalar, motor gömer |
| 3. İmza zaman damgası | Ne zaman imzalandı | KamuSM (RFC 3161), imza başına 1 kontör |
| 4. Doğrulama bilgileri | O gün sertifika iptal değildi | Sertifika sağlayıcının iptal sunucusu (OCSP / CRL) + zincir; **imza anında** alınır |
| 5. Arşiv zaman damgası | Yıllar sonra da sağlam | KamuSM, son imzadan sonra belgenin tamamına |

**İncelenen örnek:** iki imzacının 1 yıllık sertifikalarının süresi dolmuştu. Belge katmanlar tam olduğu için yine doğrulanıyordu.

**Ek kurallar:**
- **Tazeleme:** damga sunucusunun sertifikası da bitiyor. Saklama süresi boyunca (5–20 yıl) süre dolmadan yeni arşiv damgası basılır; gece
  işi yapar.
- **Görünür şerit + karekod imzadan önce** konur; imzadan sonra sayfaya hiçbir şey çizilmez.
- **İki imza yeri** (onaylanan / onaylayan, İ5): imzalar sırayla eklenir, her imza öncekini bozmaz. Bugünkü yükleme denetimi de art arda iki
  imzayı kabul ediyor.
- **İmza saati KamuSM damgasından** alınır; ne kişinin bilgisayarından ne bizim sunucumuzdan.
- **Kontör biterse imza bekler,** damgasız imza üretilmez.
- **Bitmiş belge kendi doğrulayıcımızdan geçer;** tutmazsa "Tamamlandı" olmaz.

**Bugünkü kod (2026-10-17, `src/server/imza/`; ayrıntı §9 Durum):**
- Okuma: `pdf-imzalar.ts` beş katmanı çözer (imza, damga, DSS, belge damgası, düzey B-B … B-LTA) + imzadan sonraki değişiklik.
- Yazma: `imzala.ts` + `yer-tutucu.ts` + `pdf-ek.ts` kendi imzamızı belgeye işler; `ltv.ts` 4. ve 5. katmanı ekler.
- Önceki yapı denetimi: `src/modules/raporlar/imza-pdf.ts` (imzalı PDF eki), `imza-kimlik.ts` (imzalayanın adı).

---

## 4 · Doğrulama servisi

**Karekod / sayfa:** `<firmanın imza adresi>/dogrula/<rastgele kod>` adresinde şunlar görünür:
- Sonuç: geçerli · yeni sürümü var · dosya tutmuyor.
- İmzalayanlar ve imza saatleri (damgadan), sertifika sağlayıcı.
- Revizyon durumu.
- "Elinizdeki PDF bu mu?" karşılaştırması. Dosyanın parmak izi tarayıcıda çıkarılır, dosya gönderilmez.

**Belgenin kendisi:**
- Kalıcı açık bağlantıyla verilmez (anayasa 5.1).
- Rapor, müşteri girişinden açılır.
- İncelenen aracı firma belgeyi girişsiz açıyor; bizde bu karar §10-3.

**Genel doğrulayıcı:**
- `sign.probata.com.tr/dogrula`: herhangi bir e-imzalı PDF bırakılır, katman katman sonuç verilir (başka sağlayıcıların belgeleri de).
- Dosya saklanmaz.
- Tanıtım için ücretsiz olabilir.

**API:** `POST /api/imza/v1/dogrula` (PDF) → katman katman sonuç.

**Adobe:** Türk kök sertifikaları bilgisayarda tanımlı değilse Adobe imzayı "geçerliliği bilinmiyor" gösterebilir. Türk sağlayıcıların Adobe'nin
güven listesinde olup olmadığı teyit edilemedi. Doğrulama sayfası bu yüzden de gerekli.

---

## 5 · Adresler

| Adres | Ne |
|---|---|
| `sign.probata.com.tr` | Servisin ana adresi: tanıtım, genel doğrulayıcı, giriş, API kökü, imza penceresi |
| `sign.<firma>.probata.com.tr` | **Reisim'in biçimi.** Firmanın imza paneli, imzalı belgeleri, doğrulama sayfaları |

**Firma adresinin kurulumu:**
- `sign.<firma>.probata.com.tr` iki seviye derin olduğu için `*.probata.com.tr` joker sertifikası kapsamaz.
- Firma açılırken (Yönetim › Firma aç) adres Vercel'e ayrıca eklenir, sertifikası kendiliğinden çıkar. Kuruluma bir adım.
- **Alternatif:** `<firma>.sign.probata.com.tr`. Tek joker sertifika (`*.sign.probata.com.tr`) hepsini kapsar; Vercel'de alt alan için doğrulama
  kaydı yeterli. Daha az parça, ama adres biçimi farklı → karar §10-1.

**Test:** yayın önce test adresinde (2026-10-17 kararı) → `sign.deneme.probata.com.tr`.

**Firmanın kendi alan adı** (ör. `imza.firma.com.tr`): sonra, yönlendirme kaydıyla olur.

---

## 6 · Veri, kiracılık, kod yeri

**Firmalar:**
- probata firması zaten kiracı; imza servisi aynı firmanın içinde bir modül.
- Yalnız imza alan firma = modül kaydında yalnız **İmza** açık firma; Yönetim › Firma aç'ta seçilir.

**Veri:**
- Ortak projede, kiracı süzgeçli (RLS). Firma başına Supabase rafa kalktı.
- İmzalı belgeler firmanın saklama ayarına göre tutulur, tazeleme süresince arşiv damgasıyla.

**probata içinde bağlantı:**
- İMZA YOLLARI (4)'teki sağlayıcı arayüzüne (dene · gönder · durum · al · iptal + yetenek beyanı) **probata'nın kendi servisi** olarak takılır.
- Ekranlar ve durumlar sağlayıcıdan bağımsız kalır.
- Başka bir sağlayıcı istenirse o da aynı arayüzle eklenir.

**Kod yeri:**
- Aynı depo, ayrı modül: `src/modules/imza/` (motor, akış, panel) + `src/app/(imza)/` (yalnız imza adreslerinde) + `/api/imza/v1/`.
- Eklenti ve yardımcı program ayrı klasörlerde: `araclar/imza-eklentisi/`, `araclar/imza-yardimci/`. Ayrı derlenir, ayrı imzalanır.
- Karar §10-7.

**Yardımcı programın derlenmesi, imzalanması, dağıtımı — GitHub'a bağlı değil** (reisim 2026-10-17: *"githubda değil artık supabase ve vercel ile
çalışıyoruz … müşteriye çıktığımızda github ile işimiz bitecek orası sadece kaynak kodları güvenli sakladığım yer olacak"*):
- Web uygulaması gibi her yayında derlenmez; yeni sürümü seyrek çıkar.
- **Derleme:** bulut oturumunda (Linux'tan Windows için derlenebilir). Vercel'in derleme adımına konmaz: orası Linux, her yayında boşuna
  çalışır, imzalama sırrını taşımak gerekir.
- **İmzalama**, sertifika sağlayıcının bulut imzalamasıyla, iki yoldan biri:
  - Sağlayıcının web panelinden dosya yükleyip imzalı hâlini indirmek (ör. SSL.com eSigner Express; çalıştırılabilir dosya için teyit edilecek).
  - Bulut oturumunda sağlayıcının komut satırı aracı.
- **Ya da USB anahtarla:** her sürümde reisim'in bilgisayarında.
- **Dağıtım:** imzalı kurulum dosyası Supabase deposunda durur, `sign.probata.com.tr`'den indirilir; eklenti "Eklentiyi kur" adımında
  oraya yönlendirir.
- **Not:** 2026-03-01'den beri kod imzalama sertifikası en çok 458 gün geçerli; uzun süreli alımda da yeniden düzenlenir.

**Güvenlik:**
- API anahtarları şifreli sır, ekranda son 4.
- Bildirimler HMAC imzalı.
- Her istek kaydı denetim izinde.
- Eklenti yalnız bizim kökenlerimize açık.

**Kişisel veri:**
- Dış firmaların belgelerinde probata **veri işleyen** olur; satıştan önce sözleşme şablonu gerekir.
- 2026-10-03'teki "KVKK hukukçu işi yapılmaz" kararı probata firmaları içindi; dışa satışta yeniden bakılmalı.

---

## 7 · Yasal ve ticari ön koşullar

| Ne | Durum | Not |
|---|---|---|
| probata sertifika vermez (sertifika hizmet sağlayıcı değil), imza platformudur | — | Platform için BTK izni gerekmediği düşünülüyor — **teyit edilecek** |
| Operatör sözleşmeleri (3 operatör) | başvurulmadı | Uzun sürer; başlangıç zamanı karar §10-4 |
| KamuSM zaman damgası hesabı | fiyat biliniyor (10.000 kontör 7.200 TL … 1.000.000 kontör 96.000 TL, KDV dahil) | "1 damga = 1 kontör" ve kontörün başka firmaların belgelerinde kullanılması KamuSM'ye **sorulacak** |
| Kod imzalama sertifikası | alınmadı | Yıllık ücretli |
| Chrome / Edge geliştirici hesapları | açılmadı | Eklenti yayını |
| Vercel Pro + Static IPs | deneme Hobby'de | Ücret Vercel'den teyit edilecek; ya da sabit adresli geçit |
| Güvenlik denetimi (sızma testi) | — | Dışa satıştan önce |

---

## 8 · Sınırlar

- USB e-imza kurulumsuz olmaz; bir kez eklenti + yardımcı program.
- Telefonda / tablette USB e-imza yok; mobil imza.
- Mac ve Linux ek iş.
- Mobil imzada toplu tek onay operatöre bağlı.
- Operatör ve KamuSM süreçlerinin süresi bizim elimizde değil.

---

## 9 · Yapım sırası (öneri; her ekran önce maket)

| Kalem | İş | Neden bu sırada |
|---|---|---|
| **ES1** | Doğrulama servisi: motorun okuma tarafı, her PDF için katman raporu, doğrulama sayfası + API, karekod | En kısa; hemen değer; `imza-pdf.ts` + `imza-kimlik.ts` üstüne |
| **ES2** | İmza motoru: PAdES, KamuSM damgası, doğrulama bilgileri, arşiv damgası, tazeleme işi; toplu yükleme yoluna arşiv katmanları | İmzanın kendisi |
| **ES3** | USB e-imza: yardımcı program (Windows) + eklenti + imza penceresi; probata'ya sağlayıcı arayüzüyle bağlanır | probata firmalarına ilk değer |
| **ES4** | Mobil imza: operatör bağdaştırıcıları, sabit IP | Sözleşme süresine bağlı |
| **ES5** | Dış ürün: `sign.probata.com.tr`, yalnız imza firması, panel, API + bildirim, gömülü pencere, fiyat / kontör | Servis olgunlaşınca |
| **ES6** | Mac yardımcı programı | Talep olursa |

**Kod beklemeden başlatılabilecek başvurular:** operatörler, KamuSM hesabı, kod imzalama sertifikası (karar §10-4).

**Durum (2026-10-17, reisim: *"şimdilik bu kararları erteleyelim bizim kod açısından yapmamız gereken her ne var ise listele sırala ve o sıraya
göre sırayla yapıp bitir"*):** kararlar ertelendi; kararsız yapılabilen kod yapıldı, testli, `src/server/imza/`.

| Kalem | Kodda | Bağlı mı | Bekleyen |
|---|---|---|---|
| ES1 okuma | `pdf-imzalar.ts` (+ `cms.ts`, `sertifika.ts`, `der.ts`): her imza için bütünlük, imza değeri, imzalayan (imzalı sertifika bağıyla), 5070 nitelikli, imza anında geçerli, imza damgası (sunucusu denetlenir), belge damgası, DSS (yalnız kataloğun), DSS'teki iptal kanıtı, imzadan sonraki değişiklik, düzey. İncelenen gerçek belge: B-LTA, iki imza da tamam, iptal "geçerli", sonraki ekler izinli | — | Güvenilir kök listesi (resmî kaynaktan teyitle) |
| ES1 yükleme denetimi | `yukleme.ts`: yüklenen imzalı PDF kriptografik olarak sağlam, nitelikli, bağlı, imza anında geçerli, sonradan değişmemiş olmalı | **Evet** — rapor imzası, teknik yönetici imzası, Onaylar › Diğer | — |
| ES1 doğrulama sayfası | Maket `docs/maket/dogrula.html` (ONAY BEKLİYOR): sonuç, rapor, imzalar, güvence katmanları, "Elinizdeki PDF bu mu?"; hâller geçerli · yeni revizyon · imza bekleniyor · bulunamadı | — | Reisim onayı + §10-9 (imzacının adı) |
| ES2 imza motoru | `imzala.ts` (hazırla → kart → tamamla; formatın boş e-imza alanını doldurur), `yer-tutucu.ts`, `pdf-ek.ts` (artımlı ek; klasik ve sıkıştırılmış xref) | Hayır | İmza yolu (eklenti / yardımcı program ya da mobil imza) |
| ES2 uzun süreli doğrulama | `ltv.ts` (DSS + arşiv damgası, tazeleme), `zaman-damgasi.ts` (RFC 3161 istemcisi), `iptal.ts` (OCSP / iptal listesi) | Hayır — ayar yoksa hiç çalışmaz | KamuSM hesabı + kimlik doğrulama biçimi (§10-2) |

**Bağımsız inceleme (2026-10-17):** çözümleyici kaydedilmeden önce düşmanca incelendi; 9 bulgu doğrulandı ve kapatıldı (kendi anahtarıyla basılan
geriye tarihli damga, sertifika değiştirme, DSS'in metin taramasıyla okunması ve aşırı yavaşlama, imza sonrası değişikliğin görünmemesi, bozuk
girdide çökme). Kilitler: `tests/imza-cozum.test.ts`, `tests/imza-ltv.test.ts`, `tests/imza-inceleme.test.ts` + `tests/bozan/` karşılıkları.

---

## 10 · Karar bekleyenler

1. **Firma adresi:** `sign.<firma>.probata.com.tr` (reisim'in biçimi; firma başına adres kaydı) mı, `<firma>.sign.probata.com.tr` (tek joker
   sertifika) mı?
2. **Zaman damgası kontörü:** servis olarak satılacağı için probata toplu alıp kullanıma göre yansıtsın (öneri) mı, her firma kendi mi?
3. **Doğrulama sayfası belgeyi gösterir mi?** Öneri göstermesin, yalnız sonuç; rapor müşteri girişinden.
4. **Başvurular ne zaman:** operatör sözleşmeleri, KamuSM, kod imzalama sertifikası. Öneri: uzun sürdükleri için hemen.
5. **Mac kullanan var mı?** Yoksa önce Windows.
6. **Dış ürün fiyatı:** imza başı mı, paket mi? Sonra.
7. **Kod yeri:** aynı depo, ayrı modül (öneri) mi, ayrı depo mu?
8. **Sıra:** probata'nın genel kodlama sırasında bu iş nerede? "Bir yandan" — öneri ES1 (doğrulama) ilk, çünkü bugünkü toplu yükleme yoluna da
   değer katıyor.
9. **Doğrulama sayfasında imzacının adı** (maket `docs/maket/dogrula.html`, "İmzacı adı" seçeneği): bugünkü sayfa kişi göstermiyor (595 K8).
   Öneri: görevi + baş harfler (A\*\*\* D\*\*\*); tam ad gerekirse açılır. Karar reisim'in.

---

## 11 · Kaynaklar (2026-10-16/17 araştırması)

- İncelenen örnek: reisim'in gönderdiği aracı firma çıktısı (PDF). İmza yapısı açıldı; kişi ve firma bilgisi hiçbir yere yazılmadı, kopyalar silindi.
- KamuSM fiyatları: reisim'in paylaştığı fiyat ekranı (2026-10-16).
- Vercel Static IPs: https://vercel.com/docs/connectivity/static-ips (Pro ve Enterprise).
- Vercel alt alan joker sertifikası: https://vercel.com/kb/guide/wildcard-domain-without-vercel-nameservers.
- Chrome yerel ağ erişimi izni: https://developer.chrome.com/blog/local-network-access.
- Web Smart Card API: https://github.com/WICG/web-smart-card.
- Yasal dayanak: 5070 m.5 · HMK m.205/2 · İş Ekipmanları Yönetmeliği m.7/2-c (`pkproje.md` §4.3).
- Görsel sunum: "probata e-imza süreci" (2026-10-16, reisim'e özel artifact).
