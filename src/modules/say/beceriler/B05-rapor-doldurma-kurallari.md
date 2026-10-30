---
ad: rapor-doldurma-kurallari
tarif: Raporun maddelerini, tablolarını, ekipman alanlarını, sonucunu, yorumunu ve fotoğrafını probata'nın rapor haritasına göre doğru ve eksiksiz doldurur; bulguyu doğru maddeye ve dereceye bağlar.
ne_zaman: Bir ya da çok rapor doldurulurken; "sonucu … yap, … yaz", "maddeleri uygun işaretle", "tabloyu listeden doldur", "fotoğrafını ekle" istendiğinde.
---

# B05 · Rapor doldurma kuralları

## 0. Harita

- Yazmadan önce raporun haritasını oku: açık raporda `ekran_durumu`, değilse `rapor_getir`.
- Haritadaki yerler:

| Yer | Ne |
|---|---|
| `e:<alan>` | ekipman bilgisi |
| `m:<id>` | madde cevabı |
| `m:<id>#not` | madde notu |
| `m:<id>#derece` | kusur derecesi: hafif / ağır |
| `t:<tablo>:<satır>:<sütun>` | tablo hücresi |
| `t:<tablo>:<satır>:sonuc` | satır sonucu |
| `t:<tablo>:<satır>:gerekce` | satır gerekçesi |
| `tarih:<…>` | kontrol tarihleri |
| `k:<künye>` | künye yeri; değeri modele gelmez |
| `sonuc` | rapor sonucu |
| `yorum` | muayene uzmanı yorumu |

## 0b. Formu bir insan gibi oku (en önemli kural)

- Yazmadan önce formun **başlıklarını ve gruplarını** çöz. "Formun yerleşimi" varsa oradan; formun görüntüsü varsa ona da bak.
- Bir yer, formda **hangi başlığın ve grubun altındaysa** o bilgiyi alır.
- **Birden çok parçalı formlarda** aynı alan adı birden çok başlık altında geçer. Örneğin "Marka / Model / Seri no" hem "Basınçlı kap"
  hem "Tesisat / Basınç kaynağı" başlığı altında olabilir.
  - Önce bilginin **hangi parçaya ait olduğunu** belirle (etiket tankın mı, pompanın mı, tesisatın mı?).
  - Sonra yalnız o parçanın başlığı altındaki yerlere yaz.
  - Ekipmanın kendi bilgileri (marka, model, seri no, imal yılı) önce `e:` yerlerine gider.
  - Adında " · <grup>" olan alan başka bir parçanındır; o parçanın bilgisi yoksa boş kalır.
- Yazdıktan sonra yerleşimi yeniden oku. Her değer doğru başlığın altında mı bak; yanlış yere gideni düzelt.

## 1. Maddeler

1. Yeni raporda maddeler varsayılan cevapla gelir. **Notta bulgu yoksa varsayılanı koru.** Kullanıcı "maddeleri uygun işaretle"
   derse hepsini uygun yap.
2. **Bulgu varsa:**
   1. Bulguyu karşılayan maddeyi bul. Madde metni bulgunun konusunu açıkça kapsamalı.
   2. O maddeyi "Uygun değil" yap.
   3. Dereceyi ver: kullanımı engellemeyen eksik (levha, etiket, işaret, kayıt) **hafif**; güvenliği doğrudan etkileyen (fren,
      emniyet tertibatı, çatlak, sızıntı, çalışmayan acil stop) **ağır**.
   4. Not yaz (§4).
3. **Karşılayan madde yoksa** bulgu yorumda kalır, madde değişmez. Madde çok genişse de aynısı geçerlidir: ör. "uyarı levhaları ve
   kullanma talimatı bulunmalı" maddesi kapasite levhasını açıkça kapsamıyorsa ve madde ağır derecede ise. Bildirimde söyle.
4. Uzmanın "uygun" dediği gözlem (ör. "acil stop yerine şalter var, uygun") bulgu değildir. Madde uygun kalır; istersen yorumda
   bilgi olarak geçer.
5. Maddenin o ekipmanda karşılığı yoksa ve seçeneklerde varsa "Uygulanamaz" seç.

## 2. Tablolar

1. **Satır sayısı envanterdeki adettir.** Şablonda tek boş satır gelir; `satir_ekle` (adet = toplam, `sira` ile numara sütunu) ile
   aç. Sonra satır satır yaz.
2. **Numara ve konum:** konum sütununa numarayı da yaz ("9 - Giriş kapısı yanı"). Ayrı numara sütunu varsa numarayı oraya yaz.
3. **Seçim sütunları:** seçenek listesindeki değerlerden biri yazılır. Sunucu boşluk ve harf farkını eşitler; yine de listedeki
   biçimi kullan.
4. **"Seçilebilir hepsini uygun yap"** komutu yalnız seçim sütunlarına uygulanır. Metin ve sayı sütunlarına dokunma.
5. **Uygulanmaz mantığı:** sütunun konusu o satırdaki ekipmanda yoksa ve seçeneklerde "Uygulanmaz" varsa onu seç.
   - CO2'li söndürücüde manometre ve ibre sütunları.
   - Tekerlekli söndürücüde "askıya alınmış" sütunu: seçeneklerde "Uygulanmaz" yoksa uygun kalır.
6. **Metin sütunları ve "-":** probata'nın kuralı geçerlidir.
   - Kullanıcı bilgiyi yazıyla verdiyse, verilmeyen metin alanlarına "-" yaz.
   - Fotoğraftan ya da etiketten okurken okuyamadığın alan boş kalır.
   - Sayı, tarih ve seçim alanlarına "-" yazılmaz.
   - "Tespit edilen uygunsuzluklar" sütununa bulgu yoksa "-" yaz.
7. **Emin değilsen yazma:** okumadan emin değilsen değeri yazma, bildirimde "doğrulanacaklar" listesine koy. "Tahmini" diye
   düşündüğün değer rapora girmez.
8. **Satır sonucu ve gerekçesi:** bulgu yoksa uygun; bulgu varsa uygun değil ve gerekçe (§4).
9. **Kısa gösterimler:** "6-2" → bölme - kat sütununa aynen yazılır. "10*3 6 sıra" → 10-3 düzeninde 6 satır.
10. **Formüllü ve kayıttan gelen hücreye yazma.**
11. **Sınır:** bir tabloda en çok izin verilen satır sayısı kadar satır olur; aşılacaksa kullanıcıya söyle.
12. Yazdıktan sonra satır sayısını ve boş hücreleri denetle.

## 3. Sonuç

1. **Kullanıcı açıkça söylediyse onu uygula.**
   - Sonuç seçeneklerinde aynı ad yoksa en yakın karşılığı seç ve söyle. Seçenekler Uygun · Şartlı uygun · Uygun değil olur;
     "kusurlu" → Uygun değil, "hafif kusurlu" → Şartlı uygun.
   - Verilen açıklamayı yoruma aynen yaz.
   - "Aynı şekilde X'i de" denirse aynı sonucu ve aynı yorumu X'e de yaz.
2. **Söylemediyse:**
   - Sonuç maddelerden hesaplanıyorsa hesaplanana bırak.
   - Elle seçiliyorsa: ağır kusur varsa Uygun değil; yalnız hafif kusur varsa Şartlı uygun; kusur yoksa Uygun.
   - Bu seviyeyi bildirimde "benim seçimim" diye söyle.
3. **Tutarsızlık:** sonuç "uygun değil" iken bütün maddeler uygun kaldıysa bildir ve ilgili maddeyi değiştirmeyi öner.

## 4. Yorum ve not yazımı

- Kısa, resmî ve eyleme dönük yaz: önce tespit, sonra gereken.
- Uzmanın sözünü kaybetme; düzelt ama anlamını değiştirme.

| Uzmanın notu | Yazılacak |
|---|---|
| "kapasite levhası lazım" | "Ekipman üzerinde yük kapasitesini gösteren levha bulunmamaktadır; kapasite levhası (4000 kg) asılmalıdır." (değer notta varsa) |
| "kapasite yok" | "Ekipman üzerinde kapasite bilgisi bulunmamaktadır; kapasite levhası asılmalıdır." |
| "proje revize edilmeli" | "Yeni revizelere göre yangın tesisatı projesi revize edilmelidir." |
| "acil stop yerine şalter var, uygun" | (bilgi) "Acil durdurma butonu yerine şalter bulunmaktadır." |

## 5. Ekipman alanları

- `e:` yerlerine etiketten ve nottan okunan yazılır (B03).
- İmal yılına yalnız yıl yazılır.
- Kapasite "(kg)" alanına sayı yazılır.
- Parçalı formlarda §0b geçerlidir.
- Konum: uzmanın notundaki konum (bina, bölüm, alan).

## 6. Fotoğraf

- `rapor_foto_ekle` ile her rapora **bir** genel görünüş fotoğrafı ekle (B02 §5).
- Etiket fotoğrafı eklenmez.
- Fazla eklendiyse `rapor_foto_kaldir`.

## 7. Kayıt ve doğrulama

- Kapalı rapora `rapor_yaz` girişleri yazar ve kaydeder. Açık raporda `rapora_yaz`, sonra kullanıcı isterse `raporu_kaydet`.
- Sonra geri oku ve şunları denetle:
  - yazılan sayısı,
  - yazılamayan ve nedeni,
  - tablonun satır sayısı ve boş hücreleri,
  - sonuç ve yorum,
  - fotoğraf sayısı.
- "Yaptım" demeden önce sonucu gör.
