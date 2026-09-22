# 08 · ÇALIŞMA DİSİPLİNİ — teslim zinciri, kanıt, kilit bakımı

Bu dosya kod yazma değil **iş yapma** biçimini taşır. Kaynaklar: derleme/test betikleri, test
başlıkları ve depo geçmişindeki teslim mesajları.

---

## Teslim zinciri sabittir ve sırası değişmez

**Kural:** Her teslim aynı zinciri izler: testler (sıfır başarısızlık) → derleme → yayın → canlıda
gözle doğrulama → değişiklik farkını okuma → commit → uzak dala gönderme → kanıt özeti.

**Neden:** Zincirin herhangi bir halkası atlandığında hata canlıda bulunur. Özellikle "derledim ama
yayına almadım" ve "yayına aldım ama bakmadım" durumları en sık kaynak.

**Referans kod:** `package.json:6-12`
```json
"scripts": {
  "build": "node scripts/build.mjs",
  "build:nomin": "node scripts/build.mjs --no-min",
  "test": "node --test \"tests/*.test.js\""
}
```
Canlı doğrulama halkası — `tools/smoke.js:1`
```js
/* TakipEt DUMAN + REGRESYON TESTİ — her teslim sonrası: `node tools/smoke.js` */
```
Kanıt özetinin nasıl göründüğü — `git log 3e0240b` (teslim mesajı):
> "Canlı test şirketinde iframe ile 1920 · 1080 · 375 (açık+koyu) ölçüldü: … kırpılan etiket 0,
> yatay taşma 0. … Kilit: tests/tablet-duzeni … (olumsuz kanıt 3/3)"

**Yeni projeye uyarlama:** Zinciri yeni projenin ilk gününde `CLAUDE.md` içine yaz. Komutlar
değişir, sıra değişmez. "Testler geçmeden derleme yok" kuralını mümkünse kancayla (pre-commit /
CI) mekanikleştir.

---

## Teslim mesajı ne yapıldığını değil, **nasıl kanıtlandığını** anlatır

**Kural:** Commit mesajı üç şeyi içersin: (1) isteğin ne olduğu — mümkünse isteyenin kendi
cümlesiyle, (2) neyin değiştiği, (3) nerede ve nasıl doğrulandığı (hangi ekran, hangi ölçü, hangi
sayı). Kapsam dışı kalan bilinen bulgular ayrıca yazılsın.

**Neden:** Altı ay sonra "bu neden böyle" sorusunun tek güvenilir cevabı burasıdır. Doğrulama
yazılmazsa, sonraki geliştirici değişikliği test edilmemiş varsayar ve yeniden yapar.

**Referans kod:** `git log ce7dbdd` (teslim mesajı)
> "Üçü de ayrı özelliklerle yazıldı … tasarlanan ölçülerine döndü: 10,5/700 · 11,5/650 · 11,5/600.
> … Ratchet testi artık SIFIRDA … Canlı test şirketi (Profil): üç sınıf da Inter 10,5/700 …
> ölçüm ENJEKTE örnek öğelerle yapıldı, çünkü … kartı bu tarayıcıda push izni verilmediği için boş
> çiziliyor … CSS kural ve @media sayısı değişmedi (2745 · 89)"

**Yeni projeye uyarlama:** Doğrudan taşınır. Ölçemediğin şeyi **ölçemedim** diye yaz (yukarıdaki
mesajda olduğu gibi); eksik kanıtı sessizce geçmek, yanlış kanıttan daha pahalıdır.

---

## Her kilidin olumsuz kanıtı alınır

**Kural:** Yeni yazdığın testin gerçekten koruduğunu kanıtla: korumayı kasten boz, testin
düştüğünü gör, sonra geri al. Bozma işlemi **kaynak dosyaya dokunmadan** yapılsın.

**Neden:** Hiçbir şeyi yakalamayan test, olmayan testten daha zararlıdır — güven verir. Kaynak
projede her teslimde "olumsuz kanıt N/N" olarak raporlanır.

**Referans kod:** Kaynak projede bu, dosya okumayı geçici olarak değiştiren küçük bir yükleyici
betikle yapılır (testler `--require <betik>` ile koşturulur); betik, kaynağı diskte **değiştirmeden**
bellekte bozar:
```js
const fs = require('node:fs'); const asil = fs.readFileSync;
const BOZ = { '1': ['style.css', '.cz-kim dt{font-size:11px', '.cz-kim dt{font-size:9.5px'], … };
const b = BOZ[process.env.BOZ];
fs.readFileSync = function(p, ...r){
  const v = asil.call(this, p, ...r);
  if(b && String(p).endsWith(b[0])){
    if(!v.includes(b[1])) throw new Error('bozan çapa yok ' + process.env.BOZ);
    return v.replace(b[1], b[2]);
  }
  return v;
};
```
Sonuç teslim mesajında raporlanır — `git log 119debd`: *"olumsuz kanıt 4/4"*.

**Yeni projeye uyarlama:** Mutasyon testi araçları aynı işi otomatik yapar; küçük projelerde
yukarıdaki elle yöntem yeterlidir. Kritik nokta: **bozma diske yazılmaz** ve çapa bulunamazsa
betik hata verir (sessizce "test geçti" demez). Bu betikleri geçici klasörde değil, depoda tut.

---

## Test çapası kırıldığında gerekçeyle güncellenir, susturulmaz

**Kural:** Bir davranış bilinçli olarak değiştiğinde ilgili test **silinmez veya gevşetilmez**;
yeni beklenen değere tarih ve gerekçe notuyla güncellenir. Kaldırılan davranış "geri gelmesin"
iddiasına dönüşür.

**Neden:** Kırılan testi susturmak, o testin koruduğu tüm geçmiş hataları geri açar. Gerekçe notu,
sonraki değişiklikte "bu sayı neden 5?" sorusunu cevaplar.

**Referans kod:** `tests/tasarim-kalibi.test.js` (2026-09-17 güncellemesi)
```js
/* 2026-09-17 (reisim onayı, sunum … karar 1): saat alanı cihazın kendi penceresini açan
   type="time" değil, temalı seçim alanı (kalıp 19) — iki alan da data-secim + saat listesi taşır. */
assert.equal((z.match(/type="time"/g) || []).length, 0, 'saat alanı yeniden cihazın kendi penceresini açıyor');
assert.equal((z.match(/data-secim list="bkm-dl-saat"/g) || []).length, 2, 'iki temalı saat alanı yok');
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Kod incelemesinde kırmızı bayrak: **gerekçesiz test
değişikliği.** Test satırının değişmesi, kodun değişmesi kadar dikkat ister.

---

## Tasarım kalıbı belge değil, mekanik kilit olarak yaşar

**Kural:** Tasarım kararlarını (ölçüler, hangi bileşen nerede kullanılır, neyin yasak olduğu)
yazılı kılavuzda bırakma; ölçüp doğrulayan bir testle zorla. Referans olarak **onaylanmış gerçek
bir ekranın ölçümlerini** kullan.

**Neden:** Yazılı kılavuz okunmaz. Kaynak projede kalıp yazıldıktan sonra da ihlal edilmeye devam
etti; mekanik kilit konunca durdu.

**Referans kod:** `tests/tasarim-kalibi.test.js:1-17`
```js
/* ══ TASARIM KALIBI — KALICI KİLİT ═══
   ⛔⛔ ÖNLEYİCİ TASARIM İLKESİ: "çözümler yama olmayacak … önleyici olacak şekilde tasarlanmalı."
      Bu dosya kalıbı MEKANİK olarak zorlar — kuralı yazmak yetmiyor.
   REFERANS ÖLÇÜM (canlı, 1920px, onaylı … ekranı):
     · 70 düğme — EN GENİŞİ 123px, hiçbiri 320px'i geçmiyor
     · düğme yüksekliği 38-39px (birincil) · 30-31px (küçük) · 26px (ikon)
   REDDEDİLEN ÖLÇÜM (… penceresi, 1080px): · "Bakımı Kaydet" 1036×48 … */
```
Aynı yaklaşımın ikinci örneği — `tests/ekran-emoji.test.js:1-8` (ekranda emoji yok; **meşru üç
istisna** açıkça sayılmış).

**Yeni projeye uyarlama:** Doğrudan taşınır ve en yüksek getirili maddelerden biridir. Kilidi
kurarken "kabul edilen" ve "reddedilen" ölçümü birlikte yaz — sınır ancak iki örnekle anlaşılır.

---

## Kural yazarken meşru istisnalar da sayılır

**Kural:** Bir yasak koyarken istisnaları aynı yerde, gerekçesiyle ve **sayılı** biçimde yaz.

**Neden:** İstisnası yazılmamış yasak ya kırılır ya da meşru kullanımı engeller; her iki durumda
da kural güvenilirliğini kaybeder.

**Referans kod:** `tests/ekran-emoji.test.js:1-10`
```js
/* Ekrana basılan HTML'de emoji olmaz; ikon `svgi()` ile çizilir. Emoji yalnız ÜÇ yerde meşru:
     1) `icoHtml()` / `emojiLeadHtml()` ARAMA ANAHTARI olarak (ekrana SVG çıkar) …
     2) YAZDIRMA / PDF / E-POSTA şablonları (orada SVG yok, kağıt hep beyaz),
     3) `toast()` / `confirmDialog()` durum işaretleri (⛔ ⚠️ ✅ ❌ 🚫) — mevcut desen. */
```

**Yeni projeye uyarlama:** Doğrudan taşınır. İstisna listesi büyümeye başlıyorsa kural yanlış
konmuş demektir; listeyi uzatmak yerine kuralı yeniden yaz.

---

## Değişiklikler kalem kalem teslim edilir

**Kural:** Bir teslimde bir konu. Aynı commit'e ikinci bir düzeltme, üçüncü bir iyileştirme
eklenmesin; yol boyunca görülen kapsam dışı bulgular nota yazılıp ayrı teslime bırakılsın.

**Neden:** Karışık teslim geri alınamaz: bir parçası bozulduğunda tümünü geri almak gerekir.
Ayrıca doğrulama da karışır — hangi ölçüm hangi değişikliğe aitti belli olmaz.

**Referans kod:** Depo geçmişi bu disiplini gösteriyor — aynı gün yapılan işler ayrı commit'lerde:
`git log --oneline` → `119debd` (saat alanı) · `3e0240b` (etiket ölçüsü) · `ce7dbdd` (yazı tipi
kısayolu) · `b9b45a3` (bildirim) · `076072c` (liste birleştirme). Her mesaj tek konuyu ve o konunun
kendi kanıtını taşır.

**Yeni projeye uyarlama:** Doğrudan taşınır. Yol boyunca bulunan kapsam dışı işler için bir
"ertelenen notlar" dosyası tut; konusu açılana kadar gündeme getirme.

---

## Ölçüm gerçek ortamda, gerçek genişliklerde yapılır

**Kural:** Görsel bir değişiklik, geliştirici makinesindeki tek bir pencerede değil; en az üç
genişlikte (geniş masaüstü, dar masaüstü/tablet, telefon) ve her iki temada ölçülsün. Taşma ve
kırpılma **sayıyla** raporlansın.

**Neden:** "Bende iyi görünüyor" en pahalı cümledir. Kaynak projede her görsel teslimde üç genişlik
× iki tema ölçülür ve sonuç sayı olarak yazılır ("kırpılan etiket 0, yatay taşma 0").

**Referans kod:** `git log 3e0240b` (teslim mesajı)
> "Canlı test şirketinde iframe ile 1920 · 1080 · 375 (açık+koyu) ölçüldü: İş Emirleri, Bakım
> Çizelgesi, Ekipmanlar, Mahal, Raporlar … kırpılan etiket 0, yatay taşma 0. … Değişiklikten ÖNCE
> de var olan iki bulgu (eski ölçülerle tekrarlanıp doğrulandı, bu kalemin dışında): …"

**Yeni projeye uyarlama:** Doğrudan taşınır. Son cümledeki disiplini de al: **değişiklikten önce de
var olan bulgular ayrıca doğrulanıp ayrı kalem olarak raporlanır** — yoksa bu teslimin hatası sanılır.
