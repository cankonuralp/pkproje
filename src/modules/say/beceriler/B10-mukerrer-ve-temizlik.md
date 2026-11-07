---
ad: mukerrer-ve-temizlik
tarif: Toplu işten önce mevcut kayıtları denetler, yarım kalan işi kaldığı yerden sürdürür, mükerrer rapor ve ekipmanı güvenle ayıklar, fazla fotoğrafları kaldırır.
ne_zaman: Toplu rapor açmadan önce; "mükerrerleri temizle", "fazla raporları sil", "fazla fotoğrafları kaldır" denildiğinde; bir iş yarıda kesilip yeniden istendiğinde.
---

# B10 · Mükerrer önleme ve temizlik

## 1. Önleme

- **Toplu rapor açmadan önce:** `plan_getir` / `plan_hazirlik`. Hangi ekipmanın raporu var? AYNI planda raporu olan ekipmana ikinci rapor açma.
  Önleme işi durdurmaz: aynı fotoğrafların ya da ekipmanların raporları BAŞKA planda varsa kullanıcı yine istediği için işi bu planda yeniden
  yaparsın, eskilere dokunmazsın, bildirimde uyarırsın ("aynı ekipmanların raporları P-… planında da var").
- **Ekipman eklemeden önce:** `tesis_ekipmanlari`. Aynı kod ya da aynı seri no var mı? Kod çakışırsa kod uydurma; sunucunun verdiği
  sıradaki kodu kullan ve bildirimde söyle.
- **Kesilen iş:** baştan çalıştırma.
  1. Ne yapıldığını oku: iş taslağı, planın raporları, yazılmış alanlar, fotoğraflar.
  2. Yalnız kalan adımları sürdür.

## 2. Temizlik (kullanıcı isterse)

1. **Mükerrerleri bul:** aynı ekipmanın birden çok raporu; aynı kod ya da aynı seri no.
2. **Dolu mu boş mu:** haritada yazılmış değer sayısına bak.
3. **Boş olan "Yeni" raporu sil** (`rapor_sil`). Dolu rapora dokunma; ikisi de doluysa ikisini de bırak, bildirimde listele. Silme açık komut ister.
4. **Fazla ekipman:**
   - `plan_ekipman_pasif`. Raporu olan ekipman silinmez.
   - Hiç kullanılmamışsa ve kullanıcı isterse `plan_ekipman_sil` (yönetici).
5. **Fazla fotoğraf:**
   - Her raporda yalnız genel görünüş fotoğrafı kalır (`rapor_foto_kaldir`).
   - Kullanıcının elle eklediği fotoğrafa, istemedikçe dokunma.
6. **Önce ve sonra sayıları bildir:** rapor sayısı, silinen, pasife alınan, kaldırılan fotoğraf.
