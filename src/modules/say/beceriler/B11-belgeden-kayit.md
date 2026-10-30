---
ad: belgeden-kayit
tarif: Her modülde, eklenen belgeyi (sertifika, fatura, fiş, kimlik dışı özlük belgesi, standart, liste, form) okur; hangi modüle ve kayda ait olduğunu bulur; kaydı açar ya da günceller, belgeyi kaydın doğru yuvasına ekler, doğrular ve bildirir.
ne_zaman: Bir belge ya da dosya verilip "bunu ekle / işle / kaydet / yükle" denildiğinde; personel, eğitim, ölçüm cihazı, kalibrasyon, döküman, standart, gider, fatura, araç, zimmet, müşteri, sözleşme, firma ayarı gibi her modül işinde.
---

# B11 · Belgeden kayıt (bütün modüller)

## İlke

probata'da ekranda yapılabilen her iş S.A.Y ile de yapılır: kaydı açmak, düzenlemek, belgesini eklemek. Yöntem her modülde aynıdır:

1. Belgeyi oku.
2. Ne olduğunu ve kime ait olduğunu bul.
3. Kaydı bul ya da aç.
4. Alanları yaz.
5. Belgeyi ekle.
6. Doğrula.
7. Bildir.

Modüle özel ezber yok; modülün işlemlerini ve dosya yuvalarını `islemler` ile öğren.

## 1. Belgeyi oku (B02, B03)

- Belgenin **türünü** belirle. Örnekler:
  - kalibrasyon sertifikası,
  - eğitim / yeterlilik sertifikası,
  - katılım listesi,
  - fatura, fiş,
  - standart, döküman,
  - sözleşme, İSG-KATİP çıktısı,
  - araç ruhsatı / muayene / sigorta belgesi,
  - zimmet listesi,
  - vergi levhası,
  - firma logosu,
  - rapor formatı.
- Belgenin **yapısını** çöz: başlıklar, tablolar, imza ve kaşe alanları. Değerleri başlığına göre oku (B05 §0b: formu bir insan gibi oku).
- Çok sayfalı ya da çok kayıtlı belgede (ör. katılım listesi, zimmet listesi) her satır ayrı kayıttır.

## 2. Ne olduğunu ve kime ait olduğunu bul (Y4)

- **Sayfa notunda açık kayıt varsa** (ör. bir personel ya da cihaz sayfası) belge o kayda aittir; yine de belgedeki ad, seri no ya da
  plaka ile tutarlı mı bak.
- **Yoksa** belgedeki kimliklerle ara: ad soyad, seri no, plaka, vergi no, sözleşme no, standart no (ilgili `…_ara` işlemi).
- **Birden çok aday ya da hiç aday yoksa:** yeni kayıt açılması gerekiyorsa kullanıcıya söyle ve açık komut olmadan açma. Belge ve
  kayıt eşleşmesi tek ve açıksa sürdür.

## 3. Kaydı aç ya da güncelle

- Modülün kayıt işlemiyle yaz. Örnekler:
  - `personel_kaydet`,
  - `egitim_kaydet` / `egitim_turu_kaydet`,
  - `cihaz_kaydet` / `kalibrasyon_ekle`,
  - `arac_kaydet`,
  - `demirbas_ekle`,
  - `gider_kaydet` / `fatura_kaydet`,
  - `musteri_kaydet` / `tesis_kaydet`,
  - `isg_katip_kaydet`.
- Şemayı ilk kullanımdan önce `islemler` ile al. Sürüm kilidini koru: önce getir, sonra sürümle yaz.
- **Belgede olmayan değeri yazma.** Okuyamadığını boş bırak ve bildir.
- **Tarihler ve geçerlilik:**
  - kalibrasyon tarihi ve geçerlilik sonu,
  - sertifika veriliş ve bitiş,
  - fatura tarihi.

  Belgedeki tarih biçimini uygulamanın biçimine çevir. Geçerlilik ya da bitiş belgede yazmıyorsa: sistemde bir kural varsa onu
  kullan (ör. eğitim türünün tekrar süresi) ve "kurala göre hesaplandı" de; kural yoksa (ör. kalibrasyon bitişi) uydurma, sor.
- **Tutarlar:** para birimi ve KDV ayrımına dikkat et; belgede hangisi yazıyorsa onu.

## 4. Belgeyi ekle

- `belge_ekle { hedef: kayıt, yuva, ek }` ile belgenin kendisini kaydın doğru yuvasına koy. Örnekler:
  - kalibrasyon kaydının sertifikası,
  - eğitim kaydının sertifikası,
  - personelin özlük belgesi (belge türüyle),
  - giderin fişi,
  - standardın PDF'i,
  - firmanın logosu.
- Hangi yuvaların olduğunu `belge_yuvalari { modul }` ya da işlemin şemasından öğren.
- Aynı belge zaten ekliyse ikinci kez ekleme.
- Rapor formatı PDF'i için `format_pdf_kur` (B08) kullanılır.

## 5. Dışarıya giden işler

İmzaya gönderme, e-posta gönderme ve onaya gönderme **açık komut ve ikinci onay** ister. Ör. eğitim katılım formunu imzaya göndermek,
zimmet formunu imzaya göndermek, bordro göndermek. E-imzanın kendisi kişinin cihazındadır; S.A.Y imzalamaz.

## 6. Doğrula ve bildir (B07)

- Kaydı geri oku: alanlar belgedekiyle aynı mı, belge eklenmiş mi?
- Bildirim şu bölümlerden oluşur:
  - ne açıldı ya da güncellendi,
  - hangi belge hangi kayda eklendi,
  - okunamayanlar,
  - kurala göre hesaplananlar,
  - karar gerekenler (ör. "aynı adla iki personel var, hangisi?").

## 7. Kişisel veri ve yetki

- Özlük, sağlık raporu, kimlik gibi kişisel belgeler kullanım koşullarında kabul edildiği için işlenebilir (firma ve kullanıcı kabulü).
  Yine de yalnız istenen iş için kullan.
- S.A.Y kullanıcının ekrandaki yetkisiyle çalışır. Ekranda göremediği ya da yazamadığı kaydı S.A.Y ile de göremez, yazamaz (ör. özlük
  dosyasını yalnız firma yöneticisi görür). İşlem "görünmez" ya da "yetki yok" dönerse zorlamadan bildir.
- Belgedeki kişisel bilgiyi sohbete gereğinden fazla yazma. Bildirimde kişiyi adıyla an; numaralarını tekrar etme.
- Künye değerleri modele gelmez; kullanıcının verdiği değeri aynen yaz (B06 §2).

## Yapılmayacaklar

- Belgede olmayan bilgiyi uydurmak; belgeyi yanlış kayda eklemek.
- Açık komut olmadan yeni kişi, cihaz, müşteri kaydı açmak (eşleşme yoksa sor).
- Dışarıya giden işi ikinci onaysız yapmak.
- Sır ve anahtar alanlarına (API anahtarları, parolalar) dokunmak; bunlar S.A.Y'ın kapsamı dışındadır.
