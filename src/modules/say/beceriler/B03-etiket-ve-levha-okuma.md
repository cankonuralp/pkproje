---
ad: etiket-ve-levha-okuma
tarif: Ekipman etiketi, tip plakası, kapasite levhası ve yük diyagramını yakınlaştırarak okur; değerleri doğru alana, doğru birimle yazar; emin olmadığını yazmaz.
ne_zaman: Etiket, plaka, levha ya da diyagram fotoğrafından marka, model, seri no, imal yılı, kapasite, ölçü okunacağında.
---

# B03 · Etiket ve levha okuma

## 1. Görüntüyü hazırla

1. Etiketin bulunduğu fotoğrafı `foto_goster` ile tam boy aç.
2. Etiket fotoğrafın küçük bir kısmıysa bölgeyi kes: `bolge: [x0, y0, x1, y1]`, 0–1 arası oranlar.
3. Okuma zorsa `gelistir: "gri_kontrast"` kullan. Parlama, kir ve düşük ışıkta etkilidir.
4. Etiket yan ya da ters duruyorsa `dondur` ile düzelt.
5. Hâlâ okunmuyorsa daha dar bir bölge al: tek satır ya da tek değer.

## 2. Etiketin düzenini çöz

1. Önce yapıya bak:
   - **İki sütunlu tablo:** solda başlık, sağda değer.
   - **Çok dilli başlıklar**, örneğin:
     - `Type – Modèle – Typ`
     - `Serial no. – No. de série – Serien-Nr.`
     - `Year – Année – Baujahr`
     - `Rated capacity – Capacité nominale – Nenn-Tragfähigkeit`
     - `Unladen mass – Masse à vide – Leergewicht`
     - `Battery voltage – Tension batterie`
     - `Rated drive power`
2. Türkçe etiketlerde sık başlıklar:
   - Marka · Model · Tanım · Seri No · Üretim Yılı / Tarihi · Kapasite · Ağırlık
   - Çatal Ölçüleri · Üretici Adı / Adresi · İthalatçı Adı / Adresi
3. Değerleri satır satır, başlığıyla eşleyerek oku.

## 3. Kayma ve mantık denetimi

Etiket baskısında değerler bazen bir satır kayar. Başlıktan önce **değerin türüne** bak:

| Değer | Görünüşü | Alan |
|---|---|---|
| 4 haneli, 19xx–20xx | yıl | imal yılı (yalnız yıl) |
| sayı + kg / t | kütle | kapasite (en büyük yük) ya da ağırlık (makinenin kendi kütlesi) |
| harf + rakam, kısa (BF-2.5T, E16C-02, AC) | model kodu | model / tip |
| uzun harf-rakam dizisi, çizgi ya da eğik çizgili | seri no | seri / üretim no |
| sayı + V / kW / mm | voltaj, güç, ölçü | ilgili alan |
| firma adı ve adres | üretici / ithalatçı | genelde alana yazılmaz |

- **Kapasite ile ağırlığı karıştırma.** Kapasite yükün sınırıdır (el transpaleti 2000–2500 kg). Ağırlık makinenin kendisidir (el
  transpaleti 60–90 kg; akülü forklift binlerce kg).
- **Marka:** logo ve "Marka/Brand" satırı. Üretici firma adı ile ticari marka farklı olabilir; markayı yaz.
- **Kapasite birimi:** alan "(kg)" istiyorsa "2,5 t" yerine 2500 yaz.

## 4. Karakter karışıklıkları

Sık karışan karakterler:

- 0 / O / D
- 1 / I / l / 7
- 5 / S
- 8 / B / 3
- 2 / Z
- 6 / G

**Seri numarasında tek hanesinden emin değilsen alanı boş bırak ve bildir.** Tahminli seri numarası, boş seri numarasından
kötüdür.

## 5. Yük diyagramı (forklift)

- Diyagram kaldırma yüksekliğine göre izin verilen yükü gösterir.
- Ekipmanın kapasitesi tip plakasından alınır; diyagramdan alınmaz.
- Diyagram yalnız kaldırma yüksekliği ya da yük merkezi bilgisi plakada yoksa yardımcı olur. Bunu bildirimde belirt.

## 6. Kapasite ve güvenli yükleme levhası (raf)

Levhada genellikle şunlar bulunur:

- raf üreticisi, montaj tarihi, kullanıcı firma ("-" olabilir);
- bölüm adı (siyah bant);
- palet başına yük (kg);
- kat (seviye) sayısı ve her kattaki palet sayısı;
- **maksimum modül yükü** (kg);
- göz genişliği (cm) ve kat yükseklikleri (cm).

Bu değerler raf tablosunun bölüm, kapasite ve ölçü sütunlarına birimiyle yazılır, örneğin "600 kg/palet – 5400 kg/modül". Levhada
"-" olan değer "-" kalır.

## 7. Kaynaklar çelişirse

| Bilgi | Esas kaynak | Çelişkide |
|---|---|---|
| Marka, model, seri no, imal yılı | Etiket | Etiket geçerli; notta farklıysa bildir. |
| Kapasite | Etiket; etiket yoksa uzmanın notu | İkisi farklıysa yazma, sor ya da bildir. |
| Konum, bölüm | Uzmanın notu | Levhadaki bölüm adı farklıysa notu yaz, levhadakini bildirimde an. |
| Bulgu, kusur | Uzmanın notu | — |
| Geçmiş kayıt | En son | Yeni bilgi varsa ezilir. |

## 8. Okunamayan

- Okuyamadığın alanı boş bırak (B05'teki "-" kuralı yalnız kullanıcının YAZIYLA verdiği bilgiler içindir).
- Bildirimde okunamayanları listele: "F12: seri no okunamadı (parlama)".

## 9. İnternet

- Model kodundan kapasite gibi bir bilgiyi internette doğrulayabilirsin.
- Bulduğunu rapora kesin bilgi gibi yazma. "İnternetten bulundu, doğrulanmalı" diye bildir; kullanıcı onaylarsa yaz.
