# 00 · ANAYASA — her işte geçerli üst kurallar

Bu dosyadaki kurallar iş tipinden bağımsızdır. Diğer dosyalar bunların uygulamalarıdır.

---

## Her kural bir testte kilitlenir

**Kural:** Bir hata düzeltildiğinde veya bir karar verildiğinde, o kararı bozacak değişikliği
düşüren bir test yaz; kararı yorum satırıyla değil testle koru.

**Neden:** Bu projede aynı hata beş ayrı tarihte tekrarlandı (tanımsız CSS değişkeni yüzünden
yazı tipi kısayolunun tamamının düşmesi). Yorumla uyarmak işe yaramadı; testle kilitlendiğinde
bir daha canlıya çıkamadı.

**Referans kod:** `tests/css-degisken-butunlugu.test.js:1-13`
```js
/* ⛔⛔ TANIMSIZ `var(--x)` SESSİZ DEĞİL YIKICIDIR. `font:700 12px/1 var(--sans)` içinde
   --sans tanımsızsa KISAYOLUN TAMAMI geçersiz olur: eleman 700/12px değil, gövdeden
   miras 400/16px alır. …
   NEREDEN GELDİ: … Beş ayrı tarihte tekrarlandı (b1d33e6 · Makine Dilim 1-2 · 0a23b46 …).
   Bu test o aktarım hatasını bir daha canlıya geçirmez. */
```

**Yeni projeye uyarlama:** Test çerçeven farklı olabilir; değişmeyen kısım testin başındaki
"NEREDEN GELDİ" yorumu — testin neyi koruduğu okunmadan anlaşılmalı, yoksa sonraki geliştirici
testi "eskimiş" sanıp siler.

---

## Kilit kapanır, gevşemez (ratchet)

**Kural:** Bir yasağın bilinen istisnaları varsa istisnaları **sayıyla** kilitle; sayı azalabilir,
asla artamaz. Yasak tam kapanınca istisna listesini kaldır.

**Neden:** "Şimdilik 3 yerde var, sonra düzeltiriz" listesi kendiliğinden büyür. Sayıyla kilitlenince
yeni ihlal testi düşürür, eski ihlaller de tek tek temizlenir ve liste sıfıra iner.

**Referans kod:** `tests/kestirimci-revize-2026-09-16.test.js:25-30`
```js
test('🔴 SINIF KİLİDİ: `font:… inherit` kısayolu GEÇERSİZDİR — yeni kullanım yasak (ratchet; bilinen 3 yer ayrı karar)', () => {
  // inherit, font kısayolunun içinde değer olamaz → bildirimin TAMAMI düşer, öğe tarayıcı varsayılanına iner
```
Aynı desen çakışma testinde: `tests/kuresel-ad-cakismasi.test.js:9-11`
```js
/* … Bu kasıtlı olabilir (tema, geçiş) → RATCHET: bilinen liste dışında YENİ çift yasak,
   bilinenin sayısı artamaz. */
```

**Yeni projeye uyarlama:** Sayı tutan her kilit, sayıyı düşüren değişiklikte gerekçeyle
güncellenmeli. Gerekçe testin içine tarihiyle yazılır (aşağıdaki kurala bakınız).

---

## Testler kaynak kodu değiştirmeden çalışır

**Kural:** Test edilebilirlik uğruna üretim kodunu yeniden düzenleme; testi koda uyarla.

**Neden:** Canlı bir üründe "test için refactor" en riskli değişiklik tipidir. Bu proje, modülleri
dışa aktarım yapmadan küresel kapsamda tanımladığı için, testler kaynaktan **belirli saf
fonksiyonları kesip** izole bir sanal makinede çalıştırır; fonksiyon taşınırsa test açıkça patlar.

**Referans kod:** `tests/harness.js:1-7`
```js
/* TEST HARNESS — SIFIR BAĞIMLILIK (node:test + node:vm).
   … Modülü komple yüklemek DOM ister; onun yerine belirli SAF fonksiyonlar kaynaktan
   KESİLİP (brace-matching) izole bir vm sandbox'ında çalıştırılır. Fonksiyon yeniden
   adlandırılır/taşınırsa test AÇIKÇA patlar ("bulunamadı") — sessizce yanlış şey test edilmez.
   Kaynak koda HİÇ dokunulmaz (beta: refactor yok kuralı). */
```

**Yeni projeye uyarlama:** Modül sistemi olan bir projede kesmeye gerek yok, doğrudan içe aktar.
Taşınan kuralın özü: **test, ürünün mimarisine uyar; ürün teste göre bükülmez.**

---

## Değişikliğin gerekçesi kodun içinde durur

**Kural:** Alışılmadık her satırın yanına "ne zaman, neden, hangi arıza" yaz; karar commit
mesajında kalmasın.

**Neden:** Gerekçesiz satır bir sonraki temizlikte silinir ve arıza geri gelir. Bu projede palet
değeri, gözlemci kurulumu, eşik sayısı gibi onlarca satır sadece yanındaki not sayesinde ayakta.

**Referans kod:** `src/style.css:15`
```css
--txt3:#7E8797; /* txt3 koyulaştırıldı (2026-07-05): 9CA3AF küçük yazıda WCAG kontrastının çok altındaydı */
```
`src/js/02-state-yardimci.js:2181-2183`
```js
/* ⛔ `.btn` de listede: düğme etiketi çıplak metin düğümü olduğu ve düğme flex kap
   olduğu için CSS ile üç nokta konamaz … Hiç olmazsa TAM METNİ kaybetmiyoruz. */
```

**Yeni projeye uyarlama:** Not biçimini standartlaştır: `⛔ KURAL (tarih, kaynak talep): sebep`.
Kararı isteyen kişinin cümlesini birebir alıntılamak, sonradan "acaba yanlış mı anladık" tartışmasını bitirir.

---

## Silinen davranış "geri gelmesin" testine dönüşür

**Kural:** Bir ekran/özellik kaldırıldığında onu ölçen testleri silme; **yokluğunu** ölçen teste çevir.

**Neden:** Kaldırılan bir görünüm, sonraki bir "iyileştirme" ile farkında olmadan geri gelebilir.
Yokluğu ölçen test bunu ilk derlemede yakalar.

**Referans kod:** `git log 076072c` (commit mesajı)
> "10 eski kilit yeni yapıya taşındı (davranış korunanlar çapa, kaldırılanlar 'geri gelmesin')"

Uygulanmış hâli — `tests/tasarim-kalibi.test.js` (2026-09-17 düzenlemesi):
```js
assert.equal((z.match(/type="time"/g) || []).length, 0, 'saat alanı yeniden cihazın kendi penceresini açıyor');
assert.equal((z.match(/data-secim list="bkm-dl-saat"/g) || []).length, 2, 'iki temalı saat alanı yok');
```

**Yeni projeye uyarlama:** Aynı fikir; sayım tabanlı "0 olmalı" iddiası en ucuz koruma.

---

## Paylaşılan mekanizmaya dokunmadan önce tüm tüketicileri listele

**Kural:** Ortak bir üretici/yardımcı değiştirilecekse önce onu çağıran her yeri ara ve listele;
etki alanını yazmadan koda dokunma.

**Neden:** Tek bir ortak üreticiyi kullanan ekran sayısı iki haneli olabiliyor; bir ekran için
yapılan "küçük" düzeltme diğerlerini sessizce bozuyor.

**Referans kod:** `src/js/02-state-yardimci.js:163-167` — tek üretici ve sözleşmesi
```js
/* ── TABLO ↔ KART (mobil ayrımı standardı, 2026-08-25) ─────────────────────────
   cfg = { cols:[{ad, hucre(satir,i), r?:bool, mob?:'ust'|'sub'|'alt'|'cip'|'gizle'}], … }
   ⛔ Yazdırma/PDF tablolarında KULLANILMAZ (A4 sayfalama motoru kart düzenini kaldırmaz). */
```
Aynı disiplinin ikinci ayağı: ad çakışması testi, aynı adın iki yerde tanımlanmasını engeller —
`tests/kuresel-ad-cakismasi.test.js:26`

**Yeni projeye uyarlama:** Etki alanı taraması komut satırında (`grep -rn "<ad>" src/`) yapılır ve
sonucu teslim notuna yazılır. Modül sistemi olan projelerde "kim içe aktarıyor" araması aynı işi görür.

---

## Önce ölç, sonra optimize et

**Kural:** Performans veya maliyet iddiası, ölçen bir araç veya sayaç olmadan koda girmez.

**Neden:** Bu projede "boot'tan çıkardım" denen veri dalları, geç yükleme sırasında yine
indirildiği için sayaca girmeseydi ölçümde görünmeyecekti; sayaç bilinçli olarak eklendi.

**Referans kod:** `src/js/08-kilit-save-giris-hata.js:533`
```js
/* lazy indirme de sayaca girsin — yoksa "boot'tan çıkardım" denen dal ölçümde GÖRÜNMEZ olur */
try{ bumpUsage(_cid, 'dbDown', new Blob([JSON.stringify(snap.exists()?snap.val():null)]).size); }catch(e){}
```
Karşılaştırma aracı: `tools/storage-audit.js:1`
```js
/* SALT-OKUNUR: sayacın saydığı (belge boyutları) ile GERÇEK Storage kullanımını karşılaştır. */
```

**Yeni projeye uyarlama:** Sayaç yazan yer ile gerçeği ölçen araç **ayrı** olmalı; sayaç kendi
kendini doğrulayamaz.

---

## Salt okunur denetim, yazan otomasyondan önce gelir

**Kural:** Temizlik/onarım işlerinde önce **hiçbir şey silmeyen** bir tarayıcı yaz, çıktısını
insan okusun; silme kararı ancak ondan sonra otomatikleşir.

**Neden:** Öksüz dosya, bozuk referans gibi konularda ilk tarama neredeyse her zaman yanlış
pozitif üretir (arşiv, çöp, üye tarafı referansları). Silen bir betik bu yanlışı geri alınamaz yapar.

**Referans kod:** `tools/orphan-scan.js:1-3`
```js
/* SALT-OKUNUR öksüz Storage tarayıcı — HİÇBİR ŞEY SİLMEZ.
   belgeler/ altındaki dosyaları, canlı veri + çöp + arşiv + global/üye referanslarıyla
   karşılaştırır; hiçbirinde olmayanları öksüz olarak raporlar. */
```

**Yeni projeye uyarlama:** Aynı ilke veri göçlerinde de geçerli: önce "ne değişecek" raporu,
sonra uygulama. Geri yükleme tarafındaki karşılığı `05-VERI-GUVENLIGI.md` içindeki öksüz yakalama kuralıdır.
