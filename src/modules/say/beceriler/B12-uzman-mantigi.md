---
ad: uzman-mantigi
tarif: Firmadan firmaya değişen rapor formatlarında uzmanın düşünme biçimini uygular: formu anlamından okur, her bilgiyi doğru makineye ve yere koyar, cevabın ne iddia ettiğini bilir, bilmediğini uydurmaz, sonucu dayanağıyla yazar, yaptığını bildirir.
ne_zaman: Bir türün formatını ilk kez görünce; becerilerde karşılığı olmayan bir alan, madde ya da tablo çıkınca; "uygulanamaz yap", "bilgiye ulaşılamadı", "uygun değil yap", "hepsine aynı" denildiğinde; kazan, tank, transpalet, konveyör, yangın tüpü, havalandırma, klima gibi türlerde örnek gerektiğinde.
---

# B12 · Uzman mantığı: her formatta (2026-11-05)

Probata'da her firma kendi formatını kurar. Aynı tür iki firmada farklı başlık, farklı madde, farklı cevap seti taşır; aynı firmada bile format
sürümden sürüme değişir. Bu yüzden yer ezberlemek işe yaramaz. S.A.Y uzmanın **neden** öyle yaptığını bilmeli ve bunu önüne gelen formata
uygulamalıdır.

Bu beceri o mantığı öğretir. Her ilkede önce **mantık**, sonra **nasıl** yazar. Örnekler gerçek işlerden alınmıştır; örnekteki başlık ve madde
adları yalnız örnektir, mantık her formatta aynıdır. Ayrıntılı işlem kuralları B05 (doldurma), B06 (tarih, künye), B07 (denetim, gönderim)
becerilerindedir.

## 1. Önce formu anla, sonra yaz

**Mantık:** Form bir soru listesidir. Her yer bir soru sorar ve cevabı o sorunun **konusundan** gelir: yerin sırasından ya da numarasından değil.

1. Haritayı oku: `rapor_ac` sonucundaki tür haritası ya da `rapor_getir`. Format basılı formdan kurulduysa "Formun yerleşimi" de gelir; başlıklar
   ve sütunlar orada görünür. Aynı formattaki raporlarda yerler aynıdır, haritayı bir kez oku.
2. Her bölüm ve sütun başlığına sor: **bu başlık neyi anlatıyor?** Firmayı mı, ekipmanın kendisini mi, ona bağlı başka bir makineyi mi, sistemi mi,
   bir testi mi?
3. Her yerin anlamı dört şeyden çıkar: adı, üstündeki başlık, türü (yazı, sayı, seçim, tarih, formül) ve birimi.
4. Yazma: formüllü yer (probata hesaplar), kayıttan gelen yer, kilitli künye (SGK, İSG-KATİP).
5. Anlamını çıkaramadığın yeri ("Yeni sütun", tek başına "Diğer") doldurma. Bildirimde "anlamı belirsiz yer: …" diye an.
6. Yazdıktan sonra yerleşimi yeniden oku: her değer doğru başlığın altında mı?

## 2. Her bilgi bir makineye aittir

**Mantık:** Bir ekipman çoğu zaman birden çok makinedir: tank ve onu besleyen kompresör ya da pompa; kazan ve brülörü; konveyör ve motoru. Etiket
kendi makinesinin kimliğidir. Başka makinenin yerine yazılırsa rapor var olmayan bir makineyi anlatır.

- **Etiket kimin?** Üstündeki sözcüklere bak: "hava tankı, basınçlı kap, hacim, test basıncı" → tank; "kompresör, debi, devir" → kompresör;
  "brülör, yakıt, kapasite" → brülör; "motor, kW, V, devir/dk" → motor.
- **Ekipmanın kendi yerleri** (`e:` marka, model, seri, imal) muayene edilen ana gövdenindir: tank, kazan, makinenin kendisi.
- **İkinci makinenin yerleri** ayrı bir başlıkta ya da haritada " · <başlık>" ekiyle durur ("Kapasite · KOMPRESÖR"). Önce makineyi belirle, sonra
  yalnız onun başlığı altındaki yerlere yaz (B05 §0b).
- **Sistem değerleri** (çalışma basıncı, test basıncı, emniyet ventili açma basıncı, gösterge skalası) bir makinenin değil sistemin özelliğidir;
  formatta nerede duruyorsa oraya.
- **Formatta yeri olmayan makine** (ör. motor bölümü olmayan formatta motor etiketi) yazılmaz; başka bir alana sıkıştırılmaz.
- Makine sonradan değişmiş olabilir: eski raporla fotoğraftaki etiket farklıysa **fotoğraf geçerlidir**, farkı bildir.

## 3. Cevap bir iddiadır

**Mantık:** Rapordaki her cevap, uzmanın imzasıyla verilen bir beyandır. S.A.Y her cevapta "bunu iddia edebilir miyim?" diye sorar.

| Cevap | Ne iddia eder | Ne zaman verilir |
|---|---|---|
| Uygun | Bakıldı, kusur yok | Uzman kusur söylemediyse ve maddenin konusu bu ekipmanda varsa |
| Uygun değil | Bakıldı, kusur var | Uzman bulgu söylediyse ya da kullanıcı açıkça istediyse; dayanağı not olarak yazılır |
| Uygulanamaz | Bu ekipmanda bu konu yok | Maddenin konusu (parça, yakıt, donanım) ekipmanda yoksa |
| Boş | Karar uzmanındır | Yapılıp yapılmadığını yalnız uzmanın bildiği bir ölçüm ya da test |

- **Adlar formattandır, anlam aynıdır.** "Uygun / Uygun değil / Uygulanamaz", "U / UD / X (özellik yok)", "Uygulanmaz" … Formatın kendi
  karşılığını yaz.
- **Uygulanamaz'ı bulmak:** maddenin metninde bir koşul var mı? "Gazla çalışan kazanlarda …", "katı yakıtlı kazanlarda …", "akülü araçlarda …",
  "pompası varsa …". Koşul ekipmanda yoksa Uygulanamaz. Koşulu bilmiyorsan (yakıt bilinmiyor) toptan Uygulanamaz yapma; önce §4'teki kaynaklara
  bak, bulamazsan bildir.
- **Boş bırakmak:** S.A.Y bilmediği ölçümü "Uygun" diye işaretlemez. Probata'da tamamlayıcı cevapsız maddeyi Uygun yapar; boş kalacak maddeye
  `m:<id>` = "" ver (o rapora sonraki yazışlarda da ya aynısını ver ya `tamamla: false` kullan). Boş madde zorunlu eksiktir: rapor, madde
  cevaplanmadan onaya gitmez. Bildirimde söyle. Onaylı örnek: genleşme tankında kalınlık ölçümü maddesi, kullanıcı söylemedikçe boş.
- **Sonuç hücresi yazı alanı olan madde:** bazı basılı-form formatlarında maddenin cevabı seçim değil yazı alanıdır (`a:` yeri, adı madde metni).
  Oraya formatın kısaltmasını yaz (U / UD / X). Tamamlayıcı yazı alanına "-" yazar, "Uygun" yazmaz.
- **Kullanıcının verdiği cevap onun kararıdır.** "Şunları uygulanamaz yap, ötekileri ben ayarladım" → yalnız söylenen maddeler, `tamamla: false`.

## 4. Bilginin kaynağı ve güveni

**Mantık:** Uzmanın sözü sahadaki gerçektir. Etiket makinenin kimliğidir. Önceki rapor geçen yılın kararıdır. Kayıt masa başında girilmiştir.
Tahmin ise bilgi değildir.

Öncelik sırası:

1. kullanıcının bu işteki sözü (not, altyazı, mesaj),
2. fotoğraf ve etiket,
3. önceki rapor (probata'da rapor açılınca ekipmanın son tamamlanmış raporundan gelir),
4. ekipman kaydı,
5. hiçbiri yoksa: metin "-", sayı, seçim ve tarih boş.

- **Çelişkide** (onaylı kural, ayrıntı B05 §8): kimlik bilgisi (marka, model, seri, imal) etiketten güncellenir, çünkü makine değişmiş olabilir.
  Test, ayar ve basınç değerleri doluysa ezilmez, çünkü önceki muayenenin kararıdır; fark bildirilir.
- "-" bilinmeyen demektir; değer bulununca yazılır.
- Model adından, internetten ya da başka bir işten gelen değer yalnız kullanıcı onaylarsa yazılır.
- Okuması şüpheli değer en iyi okumayla yazılır ve şüpheli işaretlenir. Okunamayan değer uydurulmaz.
- Başka firmanın eski raporunun fotoğrafı: değişmeyen kimlik ve tasarım bilgisi oradan alınabilir (varsayım); değişebilen makine fotoğraftan.

## 5. Sayılar: birim, hesap, formül

**Mantık:** Etiket çoğu zaman değeri değil kuralını verir; uzman hesabı sahada kafadan yapar. Yanlış birimdeki doğru sayı da yanlıştır.

- Birimi yerin biriminden al: debi m³/dk verildi, yer lt/dk ise × 1000 (7,6 → 7600).
- Sık hesaplar:
  - "Test basıncı P × 1,43" → azami basınç × 1,43, bir ondalık (10 bar → 14,3);
  - menfez debisi = hız × kesit alanı × 3600 (m³/h); 10×20 cm → 0,02 m²;
  - "4,8'den eşit aralıklarla 3,2'ye, 5 menfez" → 4,8 · 4,4 · 4,0 · 3,6 · 3,2;
  - testin notunda katsayı varsa ("anma yükünün %110'u") değer kapasiteden hesaplanır (tamamlayıcı da yapar).
- Formüllü yere yazma; probata hesaplar. Formül yoksa hesabı sen yaz.
- Hesapladığın her değeri bildirimde "hesaplandı" diye an.

## 6. Tablo bir envanterdir

**Mantık:** Tablonun satır sayısı sahadaki adettir. Eksik ya da uydurma satır, tesise yanlış envanter söyler.

- Bir satır, bir ekipman ya da bir ölçüm noktasıdır. Satırlar `satir_ekle` ile açılır (B05 §2).
- Adet alanları formüllü değilse satırlardan sayılır; formüllüyse dokunma.
- Liste yoksa satır uydurma (onaylı kural): tablo satırsız kalır, bildirimde "liste yok, tablo boş; teklifte N adet". Formatta en az satır sayısı
  ya da zorunlu sütun varsa rapor tablo dolmadan gönderilemez.
- Uzmanın yazdığı konumu düzeltmeden yaz.
- Tablolu türü (ör. yangın söndürme cihazları) ekipman başına ayrı rapora bölme.

## 7. Sonuç bir gerekçedir

**Mantık:** Sonuç maddelerden ve ölçümlerden çıkar. Maddelerde dayanağı olmayan "uygun değil" sonucu raporu kendi içinde çelişkili yapar;
`plan_denetle` bunu "sonuç maddelerle çelişiyor" diye yakalar.

- Kullanıcı sonucu söylediyse uygula ve dayanağını görünür kıl: ilgili madde Uygun değil + not, ya da ölçüm satırı uygun değil + gerekçe.
- Söylemediyse sonuç motorun önerisidir (tamamlayıcı yazar).
- Sonuç uzmanın kararıdır. Gönderim komutu onu değiştirme yetkisi vermez; uygun olmayanı sonucunu değiştirmeden gönder ve bildir.
- **Örnek, bilgiye ulaşılamadı** (klima tesisatı, "hiçbir bilgiye ulaşılamadı, uygun değil yap"):
  1. metin yerleri "-", sayı, seçim ve tarih boş;
  2. belgeyle ilgili madde (proje, sicil kartı, bakım kayıtları) Uygun değil, notu yorum cümlesi;
  3. ölçüm tablosunda tek satır: numara 1, metin hücreleri "-", satır sonucu uygun değil, gerekçesi yorum cümlesi;
  4. yorum: "<Tesisat adı>na ait proje, teknik doküman, cihaz etiket bilgileri ve bakım kayıtlarına ulaşılamamıştır.";
  5. sonuç: Uygun değil.

## 8. Bir plan bir ziyarettir

**Mantık:** Plan, uzmanın bir tesise bir ziyaretidir: aynı gün, aynı künye, uzmanın gezi sırası. Ayrıntı B06'dadır.

- Gün plan günüdür (sunucu kendisi bulur). Saatler gezi sırasıyla art arda gider; kullanıcının verdiği süre ya da pencere önce gelir.
- Blok penceresi (onaylı kural): "B blok 15:00–15:45" → bloğun bütün raporları o pencereyi alır; `plan_denetle`nin çakışma uyarısı beklenir.
- "Diğer rapora göre": aynı ziyaretteki öteki raporun günü ve bitişi esastır.
- Künye plandandır; değiştirmenin yolu plan bilgisidir (B06).
- **Ortak değer:** uzmanın bir türe bir kez söylediği değer (test yükü, işletme kapasitesi, kumanda cinsi, taşınan malzeme) o işteki o türün
  bütün raporlarına yazılır: tek `raporlara_yaz`, ortak girişlerle. Başka bir işe kopyalanmaz.

## 9. Söyleneni yap, fazlasını yapma

**Mantık:** S.A.Y uzmanın elidir, yerine karar veren değildir. Geri alınması zor her adım (gönderme, pasife alma, kaydı değiştirme) uzmanın
sözüyle olur.

- "Şunları değiştir" → yalnız onlar.
- Sahada olmayan ("bir tane eksildi") ekipmanın raporu açılmaz. Ekipman pasife alınmaz; kullanıcı derse `plan_ekipman_pasif`.
- Teklifte olup sahada verisi olmayan kalem: rapor açılmaz, listelenir. Branş dışı kalem ayrıca "branş dışı" diye geçer. Sahada fazla çıkanın
  raporu açılır, fark sayıyla bildirilir.
- Türün yayınlanmış formatı yoksa rapor açılmaz; "Kalan engel"e yazılır.
- Gönderim yalnız açık komutla (B07).

## 10. Bildirim: uzmanın bilmesi gerekenler

Her işin sonunda kısa ve ayrı ayrı:

- varsayımla yazılanlar,
- hesaplananlar,
- farklar (kayıt ↔ saha, teklif ↔ saha),
- boş bırakılanlar ve kalan engeller (boş madde, eksik format, anlamı belirsiz yer, tablo boş).

## Yeni bir formatla karşılaşınca

1. Başlıklar hangi makineleri ve konuları anlatıyor? Ekipmanın kendisi hangisi?
2. Cevap seti ne; "Uygulanamaz"ın karşılığı hangisi?
3. Hangi maddelerin metninde koşul var (yakıt, donanım, "varsa")?
4. Hangi maddeler yalnız uzmanın bildiği bir ölçüm ya da test?
5. Tablo var mı, bir satır neyi sayıyor, adet alanları formüllü mü?
6. Formüllü, kayıttan gelen, kilitli yerler hangileri?
7. Anlamını çıkaramadığım yer var mı?

## Tür örnekleri

Aşağıdakiler bu ilkelerin gerçek işlerdeki uygulamasıdır. Formatın adları farklı olabilir; ilkeye bakarak eşle.

| Tür | Uzmanın mantığı |
|---|---|
| Kazan | Yakıt maddeleri yakıta göre: gazlıda katı ve sıvı yakıt maddeleri, katı yakıtlıda gaz, sıvı yakıt ve brülör maddeleri, elektriklide bütün yakma maddeleri Uygulanamaz (§3). Katı yakıtlıda brülör yerleri: metin "-", sayı boş (§2). Yakıtın kaynağı: not ("kömürlü") → önceki rapor → fotoğraf (brülör ve gaz hattı → gaz; kömür bunkeri, ızgara, kül kapağı → katı). |
| Kompresör hava tankı | Ekipman tanktır; kompresör ikinci makinedir. "8 bar set" emniyet ventili açma basıncı, "16 bar man" gösterge skalası, "çb" çalışma basıncı (§2). |
| Genleşme / hidrofor tankı | Ekipman tanktır; pompa basınç kaynağıdır, yoksa metin "-". Kalınlık ölçümü maddesi söylenmedikçe boş (§3). |
| Transpalet / istif makinesi | Direk ve kaldırma yüksekliği varsa istif makinesidir. Manuel transpalette anahtar ve akü maddeleri Uygulanamaz (§3). Test yükü notta yoksa boş; kullanıcı söyleyince bütün transpaletlere (§8). |
| Konveyör | Altyazıdaki yer kullanım yeridir. Kumanda cinsi, taşınan malzeme, bant tipi fotoğrafta çoğu zaman yoktur: "-"; söylenince işteki bütün bantlara (§8). |
| Yangın söndürme cihazları | Tek rapor, her tüp bir satır; tipi yazılmayan tüpün tipi "-" ya da boş; liste yoksa tablo boş (§6). |
| Havalandırma | Proje bilgisi projenin antetinden (B11 §8); alan sınıfı projedeki alandan (bilinmiyorsa en küçüğü, varsayım); debi hesapla (§5); projedeki menfez ölçüsü ya da adedi farklıysa raporu değiştirme, bildir. |
| Klima tesisatı | Bilgiye ulaşılamadıysa §7 örneği. |
| Araç kaldırma lifti | Kullanıcı "lift olarak aç" dediyse rot / balans lifti de bu türde açılır; tipi fotoğraftan (zemine gömülü, döner tablalı platform → makaslı). |

## Yapılmayacaklar

- Yer ezberlemek: başka formatta aynı yerin aynı anlama geldiğini varsaymak.
- Koşulu bilmeden maddeleri toptan Uygulanamaz yapmak.
- Bilinmeyen ölçümü Uygun saymak ya da boş kalacak maddeyi tamamlayıcıya bırakmak.
- Model adından, internetten ya da başka işten değeri onaysız yazmak.
- Formatta yeri olmayan bilgiyi başka bir alana sıkıştırmak.
- Tablolu türü ekipman başına ayrı rapora bölmek.
