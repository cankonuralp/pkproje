# AKTARIM NOTU — disiplin setinin nereden geldiği

> ⛔ **Aktarım 2026-09-22'de tamamlandı** (reisim: *"aktardık ve bitti"*). `AKTARIM-KITI/` klasörü kaldırıldı,
> dosyalar proje köküne taşındı; artık **bu projenin kendi kuralları**. Bu dosya yalnız kuralların nereden
> geldiğini ve hangi bağlamda doğduğunu anlatır — tarihsel kayıttır, yönerge değildir.
> Aşağıdaki tabloda geçen `AKTARIM-KITI/` yolları artık **proje kökü** demektir.
> Depo herkese açık olduğu için kaynak projenin alan adı ve gerçek müşteri adı metinlerden çıkarıldı.

Bu set, bir üretim projesinde (çok kiracılı, tek sayfalık web uygulaması) yıllar içinde
canlıda yaşanmış arızalardan öğrenilmiş kuralları başka bir projeye taşımak için hazırlandı.

## Bu kitin sözü

**Her kural gerçek koddan doğrulandı.** Her maddenin altında `kaynak: dosya:satır` yazar ve o
satırdaki gerçek kod parçası gösterilir. Koda karşılığı olmayan hiçbir şey kural diye yazılmadı;
onlar ayrı dosyada (`EKSIKLER-VE-ONERILER.md`) öneri olarak durur.

## Dosyalar

**Önce bu ikisi — kaynak projeden AYNEN alındı, değiştirilmedi:**

| Dosya | İçerik |
|---|---|
| `ANAYASA.md` | Çalışma anayasasının aynısı (14 bölüm). Yeni projede **yeniden yazılmaz**, olduğu gibi geçerlidir. Başına yalnız bir "aktarım notu" eklendi. |
| `TASARIM-KALIBI.md` | Tasarım kalıbının aynısı (19 kural). Yöntemi geneldir; **sayıları** kaynak projenin ölçümüdür, yeni projede kendi referans ekranı ölçülerek belirlenir. |

**Sonra bunlar — aynı kuralların koddaki kanıtı (`dosya:satır` + gerçek kod):**

| Dosya | İçerik |
|---|---|
| `00-ANAYASA.md` | Tüm işlerde geçerli, pazarlıksız üst kurallar (8 kural) |
| `01-MIMARI.md` | Derleme zinciri, tek ad alanı, sayfa/pencere ayrımı, veri dalı ekleme (10 kural) |
| `02-GORSEL-SISTEM.md` | Token'lar, bileşen üreticileri, web/mobil ayrımı (10 kural) |
| `03-PERFORMANS-LAZYLOAD.md` | Geç yükleme, özet sayaç, indeks, ölçüm (7 kural) |
| `04-GORSEL-VARLIK-BLOB.md` | Sıkıştırma, küçük resim, yetkili blob indirme, önbellek (8 kural) |
| `05-VERI-GUVENLIGI.md` | Yazma beyaz listesi, transaction yaması, yedek, geri yükleme (9 kural) |
| `06-HATA-TAKIBI.md` | Çizim zırhı, küresel yakalayıcı, kısma, duman testi (7 kural) |
| `07-YETKI-VE-COKLU-KIRACI.md` | Kiracı izolasyonu, token'a gömülü yetki, sunucu kuralı (8 kural) |
| `08-CALISMA-DISIPLINI.md` | Teslim zinciri, kilit testi, olumsuz kanıt, gerekçe yorumu (8 kural) |
| `EKSIKLER-VE-ONERILER.md` | Kaynak projede **olmayan** ama yeni projede kurulması önerilenler |
| `YENI-PROJE-PROMPTU.md` | Yeni projede yeni bir sohbete yapıştırılacak başlangıç istemi |

## Kaynak projenin parmak izi (kuralların bağlamı)

Kuralları körlemesine kopyalamadan önce bilinmesi gerekenler:

- **Yığın:** çerçevesiz (vanilla) JavaScript + CSS; derleme adımı sadece birleştirme ve küçültme.
  Kaynak: `scripts/build.mjs:1-60`
- **Dağıtım:** `src/js/*.js` dosya adına göre sıralanıp **tek** HTML dosyasına gömülür.
  Kaynak: `scripts/shell.mjs:14`, `scripts/build.mjs:24-41`
- **Ad alanı:** tek küresel kapsam — ölçüldüğünde 2377 üst düzey işlev, 541 üst düzey değişken,
  hepsi tekil. Kaynak: `tests/kuresel-ad-cakismasi.test.js:12-13`
- **Veri:** gerçek zamanlı ağaç veritabanı (Firebase RTDB) + nesne deposu (Storage) +
  sunucu işlevleri; kiracı başına tek kök. Kaynak: `src/js/03-firebase-tenant-sirketler.js:33-34`
- **Test:** bağımlılıksız `node --test`; kaynak dosyadan fonksiyon kesip sanal makinede koşturur.
  Kaynak: `tests/harness.js:1-7`

**Bu parmak iz sizin projenizde farklıysa** kuralın kendisi çoğu zaman geçerli kalır, uygulanışı
değişir. Her kuralın son satırındaki **"Yeni projeye uyarlama"** tam olarak bunu anlatır.

## Nasıl kullanılır

1. Bu klasörü yeni projenin köküne kopyala.
2. Yeni projede yeni bir sohbet aç, `YENI-PROJE-PROMPTU.md` içindeki metni yapıştır.
3. İlk iş: `ANAYASA.md` + `TASARIM-KALIBI.md` tam okunur (yeniden yazılmaz), sonra yalnız bu
   projeye özgü olanı taşıyan bir `CLAUDE.md` yazılır: dizin haritası, komutlar, teslim zinciri.
4. `EKSIKLER-VE-ONERILER.md` dosyasını sıraya al — kaynak projede eksik kalanları yeni projede
   en baştan kurmak, sonradan eklemekten ucuzdur.

## Taşınmayanlar

Bu kit **çalışma biçimini** taşır; ürünü değil. Kaynak projenin alan adı, müşteri verisi, modül
kararları, ürün yol haritası ve canlı ortam bilgisi **yoktur**.

Yeni projede canlı ortam henüz yoksa, anayasanın şu maddeleri **askıdadır** (yayına çıkınca açılır):
canlı ortamda doğrulama · dağıtım (deploy) · canlı veriye elle dokunma · uzak depoya gönderme ·
gerçek cihaz teyidi. Yerine geçen zincir: testler → derleme → **localde çalıştırıp gözle doğrulama**
→ fark okuma → commit → kanıt özeti.
