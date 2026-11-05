---
ad: denetim-ve-gonderim
tarif: Hazırlanan raporları gönderimden önce denetler, sorunsuzları yalnız açık komutla onaya gönderir, gönderimi doğrular; gönderilmiş raporda hata çıkarsa düzeltme yolunu yürütür.
ne_zaman: "Kontrol et", "eksik var mı", "hepsini gönder", "en son hazırladıklarımızı gönder", "onaya gönder" denildiğinde ve her toplu işin sonunda "yaptım" demeden önce.
---

# B07 · Denetim ve gönderim

## 1. Denetim (her toplu işin sonunda)

`plan_denetle` çağır (rapora yazan iş bitince çağırmazsan sunucu kendisi çalıştırır ve sonucu sana getirir); yoksa her raporu `rapor_getir`
ile oku. Şunlara bak:

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

Sorunu sormadan düzelt ve yeniden denetle. Düzeltemediğini bildirimin "Kalan engel" satırına yaz (ör. "ölçüm cihazı yok — firmada bu türe uygun
cihaz kayıtlı değil").

**Firmada cihazı olmayan ölçüm cihazı türü** (ör. türe kumpas bağlı, firmada kumpas kayıtlı değil): cihaz kaydı uydurma, türün listesini kendiliğinden
değiştirme, seçenek sunma. Alan boş kalır, "Kalan engel"e yazılır. Kullanıcı "ekle / ne lazımsa ekle" derse o cihaz türünü türün ölçüm cihazı
listesinden çıkar (`tur_baglanti_kaydet`, cihazTurleri — ötekiler kalır); yine kayıt açma.

**Tesis / müşteri uyuşmazlığı** (belgede başka firma ya da adres yazıyor): işi durdurmaz; açık plana yaz, "Kalan engel"e "tesis kontrol edilmeli:
belgede … yazıyor" yaz. "Kabul edilmiş teklif yok" plan notudur, raporda düzeltilecek bir şey değildir; bildirime girmez.

## 2. Gönderim

1. **Yalnız açık komutla:** "gönder", "hepsini gönder", "onaya gönder". Komut verildiyse onay sormadan gönderilir. "Hazırla", "doldur", "kaydet"
   göndermek değildir.
2. **Kapsam:** "en son hazırladıklarımız" demek, bu konuşmada hazırlanan raporlar demektir. Listeyi say ve kapsamı tek cümleyle
   söyle ("29 rapor gönderiliyor: 26 kapı, …").
3. **Önce denetim** (§1). Sorunlu rapor gönderilmez; listelenir.
4. `raporlari_onaya_gonder` (yoksa her biri için `rapor_onaya_gonder`; ekranda açıksa `onaya_gonder`).
5. **Doğrula:** her raporun durumunu geri oku ("onayda"). Gönderilemeyeni nedeniyle bildir.
6. Denetleyemediğin bir şey varsa (ör. tesis kartına erişim yok) açıkça söyle.

### Kapsam kalıpları (2026-11-05)

- **Müşteri ya da tesis adıyla:** "Örnek Gıda Antalya raporlarını gönder" → o müşterinin o tesisteki taslak ("Yeni") raporları: `rapor_ara`
  (ara: tesis ya da müşteri adı, secili: taslak), sonra `raporlari_onaya_gonder`. Kaç rapor, hangi plan, kaçı uygun değil, tek cümleyle söyle.
  Sonucu uygun olmayan raporu sonucunu değiştirmeden gönder; bildirimde ayrıca an. Mantık: sonuç uzmanın kararıdır, gönderim komutu onu
  değiştirme yetkisi vermez.
- **"Kaydet ve yolla":** önce istenen değişikliği `rapor_yaz` ile yaz (kaydeder; yalnız söyleneni yazmak için `tamamla: false`), geri oku, sonra gönder.
- Gönderilecek liste bu konuşmada hazırlananlarla sınırlı değilse (ör. kullanıcının başka gün hazırladıkları), listeyi sayıyla söyle; gönderim
  komutu varsa ayrıca onay sorma.

## 3. Gönderildikten sonra hata

- **Rapor onaydaysa:** teknik yönetici `rapor_geri_gonder` ile denetçiye döndürebilir. Kullanıcı teknik yönetici değilse bunu
  ona söylemesini öner.
- **Rapor tamamlandıysa:** `revize_iste` (gerekçe en az 10 karakter: neyin düzeltileceği).
- **Toplu hata** (ör. 46 raporda yanlış SGK): etkilenen raporları bul, geri gönderme ya da revize yolunu uygula, düzelt, yeniden denetle
  ve listeyi bildir ("önce sun" dendiyse önce listeyi sun).

## 4. Yarıda kalan iş (2026-11-05)

S.A.Y'ın işi ekrandan sürer: kullanıcının bilgisayarı kapanır, sayfa kapanır ya da bağlantı koparsa iş yarıda kalır. Kullanıcı "devam" dediyse:

1. Önce durumu oku (`plan_hazirlik`, `plan_denetle`): plandaki her raporun durumu, fotoğrafı, yazılan alanlar.
2. Yalnız eksik kalanı yap; yapılmışı tekrarlama. Gönderimde yalnız durumu hâlâ "Yeni" olanları gönder.
3. Gönderilmiş raporu sunucu ikinci kez kabul etmez ("Rapor gönderildi; yalnız Yeni rapor düzenlenir"). `raporlari_onaya_gonder` sonucundaki
   gönderilen / gönderilemeyen listesi kesindir; ona göre say.
4. Bildirimde kesinleşenleri ve kalanı ayrı söyle: "kazan 1–5 gönderildi; 9 rapor bekliyor".

## Ders

Bir planın 46 raporu, hanesi kaymış bir SGK numarasıyla onaya gönderildi; doğru numara tesis kartındaydı. Gönderimden önce yapılacak
tek bir karşılaştırma (plan künyesi ↔ tesis kartı) bunu yakalardı. Künye denetimini hiçbir gönderimde atlama.
