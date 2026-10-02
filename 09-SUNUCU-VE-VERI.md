# 09 · SUNUCU VE VERİ TASARRUFU — pkproje'nin kendi kuralları (ONAYLI, 2026-09-29)

> **Nereden geldi:** 00–08 dosyaları ve ANAYASA'nın 4 · 5 · 7 · 9. bölümleri kaynak projeden (Firebase, tek dosya, istemci ağırlıklı)
> aynen geldi. Reisim (2026-09-29): *"bu rapor arşiv işleri backende giriyor ve backend kurallarımızı görmezden gelme, lazyload fotoğrafların
> gizli görüntülenmesi vs vs bir sürü kuralımız var dikkat et kurallarımız backend açısından eksik mi bi kontrol et"* → denetim
> (`EKSIKLER-VE-ONERILER.md` D) → reisim: *"o eski uygulama içindi bu uygulamanın ihtiyaçları farklı bu uygulamada thumbnaile vs de gerek yok
> bu arada veri tasarrufu ile de alakalı kurallarda eksik varsa onlarıda tamamla D kısmını okudum onayladım"*.
>
> **Bu dosya bu projenin yığını için bağlayıcıdır:** Next.js sunucusu · PostgreSQL + satır seviyesi güvenlik (RLS) · S3 uyumlu depo ·
> kendi giriş sistemimiz · pg-boss arka plan işleri · PWA + çevrimdışı kuyruk (pkproje.md §8). 00–08'deki bir kuralla çelişirse **bu dosya
> geçerlidir**; 00–08 kuralın gerekçesini (yaşanmış arızayı) taşımaya devam eder.
>
> **Kilit:** kod henüz yok (kod bütün maketler onaylanınca tek seferde yazılır, pkproje.md §9 otuz altıncı tur). Her madde, ilgili kod
> yazılırken **aynı teslimde** bir kilit testiyle kurulur (00: her kural bir testte kilitlenir); maddenin yanındaki "Kilit" satırı o testin
> ne iddia edeceğini söyler. Kilidi kurulmamış madde "kuruldu" sayılmaz (ANAYASA 0.10).

---

## A · Dosya ve fotoğraf — gizli görüntüleme, geç yükleme

**A1 · Depo kapalıdır.** Herkese açık okuma yok, listeleme yok. Nesne anahtarı tek üreticiden: `firma/{firma_id}/{modül}/{kayıt_id}/{dosya_id}`;
anahtarda kişi adı, dosya adı, rapor no gibi okunur bilgi yok (ANAYASA 5.8). Dosyanın görünen adı veritabanında.
Kilit: anonim istek 403 · anahtar üreticisi dışında anahtar birleştiren kod yok (tarama).

**A2 · Tek indirme ucu.** Her dosya `GET /api/dosya/{dosya_id}` üzerinden. Sunucu oturumdan kullanıcıyı ve kiracıyı alır, dosyanın bağlı olduğu
kaydı **RLS altında** okur (ör. müşteri yalnız kendi tesisinin tamamlanmış, son sürüm raporunun fotoğrafı), sonra dosyayı akıtır ya da
**en çok 5 dakikalık** imzalı bağlantıya yönlendirir. Veritabanında bağlantı değil **anahtar** tutulur; kalıcı herkese açık bağlantı üretilmez
(ANAYASA 5.1'in bu yığındaki karşılığı). Yanıt: `Cache-Control: private`, `X-Content-Type-Options: nosniff`, `Content-Disposition`.
Kilit: iki firmalı ve iki müşterili gerçek PostgreSQL testi — başka firmanın / müşterinin dosya kimliği 404.

**A3 · Görsel doğrudan `src`'ye yazılmaz.** Tek bileşen (`<GizliResim>`): kimlikle indirir, `blob:` adresi üretir, oturum boyunca önbellekler (aynı
dosya ikinci kez inmez), görünür alana girince yükler (`loading="lazy"` + görünürlük gözlemcisi). PDF / yazdırma akışı görselleri **bekleyerek**
hazırlar (04: soğuk önbellekte boş fotoğraf dersi).
**Küçük kopya (thumbnail) üretilmez** (reisim 2026-09-29: *"bu uygulamada thumbnaile vs de gerek yok"*): tasarruf yükleme öncesi sıkıştırma
(B1) ve geç yüklemeyle sağlanır.
Kilit: kaynakta `<img src=` ile depo / API adresi yok (tarama).

**A4 · Yükleme denetimi sunucuda.** Tür, içeriğin ilk baytlarından denetlenir (uzantıya güvenilmez). İzinli: JPEG, PNG, PDF, .xlsx / .csv (gereken
yerde). **SVG ve HTML yüklenmez.** Boyut sınırı sunucuda da. Fotoğrafın konum bilgisi (EXIF) silinir (KVKK). PDF yeniden işlenmez (imzalı PDF bozulur).
Kilit: sahte uzantılı dosya, SVG ve sınır üstü dosya reddedilir.

**A5 · Öksüz dosya ve silme.** Silinen kaydın dosyası çöpe (30 gün) gider. Gece işi, depoda veritabanında karşılığı olmayan nesneyi **raporlar,
silmez** (ANAYASA 9.4: yanlış referans seti canlı dosyayı siler). Depodan silme yalnız çöp süresi dolana ve C4'e göre.

## B · Veri tasarrufu (ağ, depo, veritabanı)

**B1 · Fotoğraf yüklenmeden önce cihazda küçültülür.** En uzun kenar 1600 px, JPEG %75, saydam zemin beyaz (04). Sahada (bodrum, hücresel ağ) asıl
kazanç burada. Sunucu küçük kopya üretmez (A3).
Kilit: 4000 px örnek görsel yüklemeden önce ≤ 1600 px'e iner.

**B2 · Dosya bir kez iner.** Oturum önbelleği (A3); dosya anahtarı değişmez olduğundan aynı dosya yeniden istenmez. Liste ekranları fotoğraf indirmez;
fotoğraf yalnız raporun ilgili bölümü açılınca ya da PDF'te iner.

**B3 · Liste hafif, detay tıklanınca.** Her liste **sunucuda sayfalı** (kalıp sayıları: ekipman 10, rapor 20) ve yalnız listenin sütunlarını çeker
(`SELECT *` yok). Tam kayıt (kriterler, ölçümler, fotoğraf listesi) yalnız detayda. Süzgeç ve alan aramalarının her sütununa dizin; aynı ekranda
N+1 sorgu yok (03 "liste hafif indeksten"in SQL karşılığı).
Kilit: liste uçlarının döndürdüğü alanlar tek yerde tanımlı; o listenin dışına çıkan alan testi düşürür.

**B4 · Sayılar özetten.** Pano, Ana sayfa ve yan menü balonları (takip sayıları) bütün kayıtları saymaz; özet sorgudan / özet tablodan gelir; arka plan
işi tazeler, iki kaynak çelişirse sunucu kazanır (03). Veri inmeden hesaplanan puan / sayı **iyimser yalan** söylemez: "—" gösterilir (ANAYASA 4.13).

**B5 · Canlı yoklama yok.** Sayılar sayfa açılışında ve sayfa geçişinde tazelenir. Yoklama gerekiyorsa en sık 60 sn ve **yalnız sekme görünürken**.

**B6 · Ağ yanıtı sıkıştırılır ve önbelleklenir.** API ve sayfa yanıtları gzip / brotli. Derleme çıktısındaki içerik karmalı dosyalar
`Cache-Control: public, max-age=31536000, immutable`; HTML ve API kısa ömürlü. Üçüncü parti dosyalar kendi kökenimizden, adında sürüm (01, ANAYASA 5.2).

**B7 · Açılışta yalnız o günün işi iner.** Saha cihazında açılış: kullanıcının bugünkü ve açık planları + gereken tür tanımları. Geçmiş raporlar,
arşiv, hareket kaydı gibi zamanla büyüyen veri açılışta inmez; ekranı açılınca sayfalı iner (03).

**B8 · Çevrimdışı kuyruk tekrar göndermez.** Kuyruktaki fotoğraflar sıkıştırılmış hâlde bekler; her işlem bir **işlem kimliği** taşır, bağlantı gelince
bir kez gönderilir; sunucu aynı kimliği ikinci kez işlemez (D2). Görüntüleyici gönderilmemiş dosyayı kuyruktan gösterir (04 "tek kod yolu").

**B9 · Toplu işler arka planda, tek dosya.** Toplu PDF, Excel dışa aktarım, arşive taşıma pg-boss işiyle; sonuç tek dosya olarak A2'den iner.
Aynı istek tekrarlanırsa hazır sonuç verilir (işin anahtarı: kullanıcı + süzgeç + veri sürümü).

**B10 · Kullanım ölçülür.** Firma başına yüklenen / indirilen bayt, dosya sayısı ve depo büyüklüğü sayaçlanır (03 "geç yüklenen veri de ölçüme
girer"); sayaç tek boğazdan (A2 ve yükleme ucu) yazılır. Maliyet yorumu ölçümden yapılır, tahminden değil (ANAYASA 0.6).

**B11 · Depo ve kayıt büyümesi sınırlıdır.** Depo sürümlemesinde eski sürümler yaşam döngüsü kuralıyla düşer (süre ürün kararı); hata kaydı ve yavaş
sorgu kaydı üst sınırlı ve budanır (06); denetim izi silinmez ama sayfalı okunur.

## C · Veri ömrü, arşiv, yedek

**C1 · ANAYASA 4.12'nin bu projedeki hâli** (reisim 2026-09-29, 185): belge / rapor / fotoğraf **kendiliğinden silinmez**. Tek istisna: 5 yılı dolan rapor,
**firma Firma ayarları'nda "Silinsin" seçtiyse** silinir — silinecekler 30 gün önce firma yöneticisine liste olarak gösterilir, silinen çöp kutusuna
gider ve 30 gün geri alınabilir, her silme denetim izine yazılır. "Bulut arşivine taşınsın" seçildiyse C2. Seçim yoksa rapor sistemde kalır.

**C2 · Arşive güvenli taşıma.** Kopyala → arşivdeki nesnenin özetini (SHA-256) kaynakla karşılaştır → künyeyi "arşivde" yap → ancak sonra kaynağı sil.
Bir adım düşerse kaynak kalır, iş yeniden dener (idempotent), hata görünür. Künye sistemde kalır (rapor no, ekipman, tarih, arşiv yeri); müşteri
portalından kalkar; firma isterse geri getirilir. Arşiv yerinin erişim bilgisi şifreli firma ayarıdır, ekranda gösterilmez, loga yazılmaz.

**C3 · Yedek.** Yönetilen PostgreSQL'in anlık yedeği + zaman noktasına dönüş; ek olarak uygulama seviyesinde dışa aktarım (05: sağlayıcı yedeği yanlış
yazılmış veriyi de saklar); depoda sürümleme. Silinen / arşive taşınan veri yedeklerden de belirli sürede düşer (KVKK); süre ürün kararı.

**C4 · Geri yükleme** 05'teki üç korumayla: yedekten sonra eklenen kayıt silinmez, önce öksüzler yakalanır, veri şekli değişmez.

## D · Yazma, eşzamanlılık, durum

**D1 · Yazma kapsamı değişiklik kadar.** Yalnız değişen alanlar yazılır; her düzenlenen kayıtta `surum` sütunu: `UPDATE … WHERE id = $1 AND surum = $2`,
0 satır = "başkası değiştirdi" uyarısı; sessiz ezme yok (05'in SQL karşılığı). Yazma reddi her zaman görünür (07).

**D2 · Çevrimdışı işlem tek seferlik.** İşlem kimliği sunucuda benzersiz; aynı kimlik ikinci kez işlenmez. Kuyruk işlenirken oturumdaki firma değiştiyse
gönderilmez (03 "await sonrası bağlamı doğrula"). Çakışmada sunucu kazanır, cihaz kullanıcıya gösterir.

**D3 · Durum geçişleri tek yerde.** Rapor durum makinesi (Yeni → onayda → muayene uzmanı imzası → imzaya gönderildi → Tamamlandı; geri gönder, durum
değiştir, revize, imza isteği süresi) tek modül işlevinde; izin verilmeyen geçiş reddedilir; her geçiş denetim izine (kim, ne zaman, eski, yeni, gerekçe).

**D4 · Göç idempotent** (05; iskelette kilitli).

## E · Giriş, oturum, kiracı

**E1 · Parola** Argon2id (ya da bcrypt) özetiyle; düz metin log'a, veritabanına yazılmaz (tek seferlik geçici parola yalnız bir kez gösterilir /
gönderilir, karar 33–34). 5 hatalı denemede 15 dk kilit (karar 37) hesaba ve IP'ye.

**E2 · Oturum çerezi** `HttpOnly · Secure · SameSite=Lax`, **alan adı firmanın kendi alt alan adı** (üst alan adına yazılmaz; yoksa bir firmanın çerezi
öteki firmanın adresine gider). Kiracı alt alan adından çözülür; oturumdaki kiracıyla eşleşmezse istek reddedilir. Kiracı kimliği istemcinin
gövdesinden alınmaz (07).

**E3 · CSRF ve CSP.** Durum değiştiren her istek aynı köken denetimi + belirteçle; sıkı içerik güvenlik politikası (yalnız kendi kökenimiz — ANAYASA 5.2).

**E4 · Oturum sunucuda.** Yetki düşürme / hesap kapatma o kullanıcının açık oturumlarını hemen sonlandırır; yetki her istekte sunucuda tek `canDo`
ile verilir, istemcideki gizleme kolaylıktır (07).

**E5 · Müşteri portalı ikinci katman.** Müşteri kullanıcısı için RLS'de firma + **müşteri** + "müşteriye açık" (tamamlanmış, son sürüm, arşivde değil).
Kilit: iki müşterili gerçek PostgreSQL testi.

**E6 · Dondurulmuş firma** tek bayrak; erişim katmanı ve arka plan işleri okur (07).

## F · İmza ve belge bütünlüğü

**F1 · İmzalı PDF değişmez.** İmzadan sonra nesne yeniden yazılmaz; özeti (SHA-256) veritabanında, görüntülemede doğrulanır; düzeltme yalnız revizyonla
yeni nesne (R1, R2 …); müşteri yalnız son sürümü görür (193).

**F2 · İmza isteği kaydı.** İstek, sonuç, süre dolması (194) denetim izine; zaman damgası; imza aracı ↔ sunucu yalnız kendi kökenimiz ve tek kullanımlık
belirteçle; operatör / zaman damgası erişim bilgileri sır.

## G · Arka plan işleri, kişisel veri, e-posta, doğrulama

**G1 · Arka plan işi kiracı bağlamıyla koşar** (RLS için firma ayarı işin içinde kurulur, iş bitince havuza sızmaz); idempotent; sınırlı tekrar; kalıcı düşen
iş görünür.

**G2 · Özel nitelikli veri ve maaş.** Sağlık raporu, özlük dosyası, bordro yalnız yetkili rol görür; her açılış erişim kaydına yazılır. Log ve hata kaydında
kişisel veri maskelenir (e-posta, telefon, kimlik no).

**G3 · Veri yurt dışına çıkmaz** (§8.8): e-posta, hata izleme, yapay zekâ ile sigorta okuma (§8.10) gibi her dış servis buna göre seçilir.
**İstisna — yapay zekâ (reisim 2026-10-02, `ARKA-UC.md` K1 kabul):** Claude yalnız ABD / küresel çalışıyor; fotoğraftan okuma ve S.A.Y chat bu yüzden
yurt dışına veri gönderir. Koşullar: (1) firma ayarıyla açılır, başlangıçta **kapalı**; (2) gönderilen veri en aza iner — fotoğrafta konum bilgisi
yok, metinde müşteri unvanı, adres, kişi adı, telefon, SGK / İSG-KATİP numarası **maskelenir**; (3) çağrı yalnız sunucudan, firmanın API anahtarıyla
(K2); (4) KVKK yurt dışı aktarım koşulu (standart sözleşme / açık rıza) hukukçuya teyit ettirilir. Kilit: yapay zekâya giden gövdede maskelenmesi
gereken alan yok (örnek raporla test).

**G4 · E-posta** dosya eki ya da kalıcı bağlantı taşımaz; bağlantı giriş gerektirir (A2). Gönderim kendi alan adımızdan (SPF / DKIM / DMARC), sonucu kayıtlı.

**G5 · Duman testi** (06) bu yığın için: sağlık ucu, veritabanı bağlantısı, RLS açık mı, depo kapalı mı (anonim 403), son yedek tazeliği, takılı arka plan işi.
