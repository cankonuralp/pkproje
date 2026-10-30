---
ad: denetim-ve-gonderim
tarif: Hazırlanan raporları gönderimden önce denetler, sorunsuzları yalnız açık komutla onaya gönderir, gönderimi doğrular; gönderilmiş raporda hata çıkarsa düzeltme yolunu yürütür.
ne_zaman: "Kontrol et", "eksik var mı", "hepsini gönder", "en son hazırladıklarımızı gönder", "onaya gönder" denildiğinde ve her toplu işin sonunda "yaptım" demeden önce.
---

# B07 · Denetim ve gönderim

## 1. Denetim (her toplu işin sonunda)

`plan_denetle` çağır; yoksa her raporu `rapor_getir` ile oku. Şunlara bak:

| Denetim | Beklenen |
|---|---|
| Rapor ↔ ekipman ↔ format | Doğru ekipman, türün doğru formatı |
| Tarih ve saat | Kullanıcının günü; çakışma yok ya da kullanıcı istemiş; sonraki kontrol doğru |
| Künye | Boş değil; plan ile aynı; tesis kartından farklıysa uyarı |
| Zorunlu alanlar | Dolu |
| Tablolar | Satır sayısı = envanter; boş hücre yok; seçimler listeden |
| Maddeler ve sonuç | Bulgular doğru maddede ve derecede; sonuç tutarlı |
| Fotoğraf | Bir genel görünüş fotoğrafı; etiket fotoğrafı yok |
| Ölçüm cihazı | Gerekiyorsa seçili; kalibrasyonu geçerli |
| Durum | Hazırlama işinde "Yeni" (gönderilmedi) |

Plan genelinde:

- notta geçen her ekipmanın raporu var;
- mükerrer rapor yok;
- teklif adedi ile rapor adedi arasındaki fark bildirildi.

Sorunu düzelt ve yeniden denetle. Düzeltemediğini listele.

## 2. Gönderim

1. **Yalnız açık komutla:** "gönder", "hepsini gönder", "onaya gönder" ya da şablonun ikinci onayı. "Hazırla", "doldur", "kaydet"
   göndermek değildir.
2. **Kapsam:** "en son hazırladıklarımız" demek, bu konuşmada hazırlanan raporlar demektir. Listeyi say ve kapsamı tek cümleyle
   söyle ("29 rapor gönderiliyor: 26 kapı, …").
3. **Önce denetim** (§1). Sorunlu rapor gönderilmez; listelenir.
4. `raporlari_onaya_gonder` (yoksa her biri için `rapor_onaya_gonder`; ekranda açıksa `onaya_gonder`).
5. **Doğrula:** her raporun durumunu geri oku ("onayda"). Gönderilemeyeni nedeniyle bildir.
6. Denetleyemediğin bir şey varsa (ör. tesis kartına erişim yok) açıkça söyle.

## 3. Gönderildikten sonra hata

- **Rapor onaydaysa:** teknik yönetici `rapor_geri_gonder` ile denetçiye döndürebilir. Kullanıcı teknik yönetici değilse bunu
  ona söylemesini öner.
- **Rapor tamamlandıysa:** `revize_iste` (gerekçe en az 10 karakter: neyin düzeltileceği).
- **Toplu hata** (ör. 46 raporda yanlış SGK): önce etkilenen raporların listesini çıkar ve sun. Kullanıcı onaylarsa geri gönderme
  ya da revize yolunu raporlara uygula, düzelt, yeniden denetle.

## Ders

Bir planın 46 raporu, hanesi kaymış bir SGK numarasıyla onaya gönderildi; doğru numara tesis kartındaydı. Gönderimden önce yapılacak
tek bir karşılaştırma (plan künyesi ↔ tesis kartı) bunu yakalardı. Künye denetimini hiçbir gönderimde atlama.
