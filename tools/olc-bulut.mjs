/* BULUT ÖLÇÜM SÜRÜCÜSÜ (MAKET-PLANI.md §5; 2026-09-24, M1) — SALT OKUNUR: docs/ dosyalarını değiştirmez, yalnız ölçer.
   Bulutta tarayıcı bölmesi yok → başsız Chromium + puppeteer-core (tools/bulut-hazirla.sh kurar; depoya bağımlılık GİRMEZ).
   Yöntem (anayasa 11.7–11.8, önceki turların ölçüm pratikleri):
   · docs/ `python3 -m http.server` ile sunulur (Pages gibi sabit dosya).
   · Her durum × genişlik × tema TAZE yüklenir, ayrı gizli oturumda (yerel depo — tema, menü tercihi — sızmaz).
   · 1920×1080 · 1080×810 · 375×812; açık + koyu (?tema=). 1080'de çekmece kapalı VE açık (anayasa 2.11).
   · Geçişler ve canlandırmalar kapatılır (takılı geçiş yanlış çakışma üretir).
   · tools/olc-maket.js aynen koşar (eş zamanlı betik); sonuç docs/assets/olcum/<maket>.json'a yazılır, ekran görüntüsü
     --goruntu klasörüne (depoya girmez).
   · Çekmece açıkken içerik perdenin altındadır: o durumda yalnız çekmece ölçülür (ekran içinde mi, ad kesik mi, madde
     boyu, menü kayıyor mu, son madde kaydırınca açılıyor mu).
   Olumsuz kanıt (--olumsuz): bilerek taşan / sert kırpılan / küçük / üst üste binen öğe eklenir, bulgu ÇIKMALI; çıkmazsa
   ölçüm yalancı demektir ve sürücü hata koduyla biter.
   Kullanım:  node tools/olc-bulut.mjs <maket> [--goruntu <klasör>] [--yazma]      (maket adları: DURUMLAR)
              node tools/olc-bulut.mjs <maket> --etkilesim [--yazma]   (sonuç docs/assets/olcum/<maket>-etkilesim.json)
              node tools/olc-bulut.mjs <maket> --telefon [--yazma]    (sonuç docs/assets/olcum/<maket>-telefon.json)
              node tools/olc-bulut.mjs --olumsuz
   --telefon (2026-09-25, reisim telefonda sayfanın sağa sola kaydığını gördü): her durum GERÇEK TELEFON TAKLİDİYLE (dokunmatik,
   meta viewport uygulanır, pointer: coarse) 320 · 360 · 390 · 430 genişlikte açılır; sayfa yana taşıyor mu, taşan en dış öğe
   hangisi, 16 px altında yazı alanı var mı (iPhone odakta sayfayı büyütür). 375'lik masaüstü penceresi 320'yi görmüyordu.
   --yazma: "yazma" — sonuç dosyası yazılmaz, yalnız ekrana (deneme koşuları için).
   Komutlar Node 24 ile: PATH=/opt/node24/bin:$PATH. */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const KOK = fileURLToPath(new URL("..", import.meta.url));
const OLC = readFileSync(join(KOK, "tools/olc-maket.js"), "utf8");
const puppeteer = createRequire("/opt/olcum/")("puppeteer-core");

/* ── Her maketin ölçülen durumları. adim: tıkla (seçici) · yaz (seçici, metin) · bekle yok (betik eş zamanlı). ── */
export const DURUMLAR = {
  planlar: { sayfa: "maket/planlarim.html", durumlar: [
    { ad: "liste", hash: "#/" },
    { ad: "plan içi · kabul bekliyor, ön koşul eksik", hash: "#/plan/4" },
    { ad: "plan içi · kabul edildi", hash: "#/plan/6" },
    { ad: "plan içi · denetimde", hash: "#/plan/1" },
    { ad: "plan içi · tamamlandı (22 rapor)", hash: "#/plan/9" },
    { ad: "plan içi · reddedildi", hash: "#/plan/7" },
    { ad: "ekipman ekle · çakışan kod", hash: "#/plan/1/ekle/HT-1001" },
    { ad: "ekipman ekle · tesiste kayıtlı", hash: "#/plan/1/ekle/FL-1013" },
    { ad: "reddet penceresi", hash: "#/plan/3", adim: [["tikla", '#a-plan .a-adim-tuslar [data-eylem="reddet"], #a-plan .a-eylem-cubugu-alt [data-eylem="reddet"]']] },
  ] },
  /* M1 Kullanıcı ve Rol · Personel (2026-09-24; 2. tur 2026-09-25: Kullanıcılar Personel'e katıldı, Ana sayfa, geçici parola,
     rol yetkileri düzenlenir, kartta zimmet ve özlük) */
  m1: { sayfa: "maket/personel.html", durumlar: [
    { ad: "giriş", sayfa: "maket/giris.html", hash: "#/", kabuksuz: true },
    { ad: "giriş · boş gönderildi", sayfa: "maket/giris.html", hash: "#/", kabuksuz: true, adim: [["tikla", '[data-eylem="gir"]']] },
    { ad: "giriş · yanlış bilgi", sayfa: "maket/giris.html", hash: "#/hata", kabuksuz: true },
    { ad: "giriş · parola sıfırlama", sayfa: "maket/giris.html", hash: "#/unuttum", kabuksuz: true },
    { ad: "giriş · geçici parolayla ilk giriş, kural dışı", sayfa: "maket/giris.html", hash: "#/gecici", kabuksuz: true, adim: [["yaz", "#g-p1", "kisa1"], ["tikla", '[data-eylem="belirle"]']] },
    { ad: "ana sayfa · firma yöneticisi", sayfa: "maket/anasayfa.html", hash: "#/yonetici" },
    { ad: "ana sayfa · planlama", sayfa: "maket/anasayfa.html", hash: "#/planlama" },
    { ad: "ana sayfa · inspector", sayfa: "maket/anasayfa.html", hash: "#/inspector" },
    { ad: "ana sayfa · mekanik yönetici", sayfa: "maket/anasayfa.html", hash: "#/mekyon" },
    { ad: "ana sayfa · elektrik yönetici", sayfa: "maket/anasayfa.html", hash: "#/elkyon" },
    { ad: "personel · liste", hash: "#/" },
    { ad: "personel · rol yetkileri", hash: "#/roller" },
    { ad: "personel · rol yetkileri düzenleniyor (1 değişiklik)", hash: "#/roller", adim: [["tikla", '[data-eylem="rol-duzenle"]'], ["tikla", "#m-13-1"], ["tikla", '[data-secim="m-13-1"][data-deger="gor"]']] },
    { ad: "personel · kart (inspector, eksiksiz)", hash: "#/p/mk" },
    { ad: "personel · kart (iki rol, EKİPNET boş)", hash: "#/p/ec" },
    { ad: "personel · kart (ilk giriş bekleniyor)", hash: "#/p/ok" },
    { ad: "personel · kart (giriş hesabı yok)", hash: "#/p/by" },
    { ad: "personel · kart (ayrıldı, hesap kapalı)", hash: "#/p/ns" },
    { ad: "personel · rol değişti, kaydedilmedi", hash: "#/p/mk", adim: [["tikla", '[data-rol="planlama"]']] },
    { ad: "giriş hesabı aç penceresi", hash: "#/p/by/hesap", adim: [["tikla", '[data-hrol="inspector"]']] },
    { ad: "geçici parola gösterildi", hash: "#/p/by/hesap", adim: [["tikla", '[data-hrol="inspector"]'], ["tikla", '[data-eylem="hesap-onayla"]']] },
    { ad: "yeni geçici parola penceresi", hash: "#/p/mk/hesap" },
    { ad: "özlük belgesi penceresi", hash: "#/p/mk/belge", adim: [["tikla", "#b-tur"], ["tikla", '[data-secim="b-tur"][data-deger="saglik"]'], ["tikla", '[data-eylem="dosya-sec"]']] },
    { ad: "zimmet teslim formu (temel format)", hash: "#/p/mk/zimmet-formu" },
    { ad: "personel · kart (zimmet formu eskidi)", hash: "#/p/ea" },
    { ad: "zimmet geçmişi (devir, iade, hâlâ kişide)", hash: "#/p/ea/zimmet-gecmisi" },
    { ad: "imzalı zimmet formu açıldı", hash: "#/p/mk/zimmet-imzali/ZF-0426-003" },
    { ad: "personel · yeni form, boş gönderildi (hatalar)", hash: "#/yeni", adim: [["tikla", '[data-eylem="kaydet"]']] },
    { ad: "personel · düzenle (teknisyen)", hash: "#/p/ke/duzenle" },
  ] },
  /* M2 Müşteri ve Tesis (2026-09-24) */
  m2: { sayfa: "maket/musteriler.html", durumlar: [
    { ad: "müşteriler · liste", hash: "#/" },
    { ad: "müşteri · üç tesis, müşteri girişi etkin, ek girişler", hash: "#/m/m1" },
    { ad: "müşteri · girişi henüz kullanılmadı, İSG-KATİP'siz tesis", hash: "#/m/m5" },
    { ad: "tesis · İSG-KATİP geç onay (uyarı)", hash: "#/t/t7" },
    { ad: "tesis · İSG-KATİP kaydı yok", hash: "#/t/t6" },
    { ad: "müşteri ekle · boş gönderildi", hash: "#/yeni", adim: [["tikla", '[data-eylem="pencere-kaydet"]']] },
    { ad: "müşteri ekle · aynı vergi no uyarısı (Yine de kaydet)", hash: "#/yeni", adim: [["yaz", "#w-unvan", "Deneme Ltd."], ["yaz", "#w-vno", "0480215736"], ["tikla", '[data-eylem="pencere-kaydet"]']] },
    { ad: "müşteri · vergi no ve e-posta eksik kaydedildi", hash: "#/yeni", adim: [["yaz", "#w-unvan", "Deneme Kalıp San. Ltd."], ["tikla", '[data-eylem="pencere-kaydet"]']] },
    { ad: "tesis ekle · çakışan SGK sicil uyarısı", hash: "#/m/m1/tesis-ekle", adim: [["js", 'const e = document.querySelector("#w-sgk"); e.value = MV.tesis("t1").sgk; e.dispatchEvent(new Event("input", { bubbles: true }))'], ["tikla", '[data-eylem="pencere-kaydet"]']] },
    { ad: "tesis · SGK sicil no eksik kaydedildi", hash: "#/m/m10/tesis-ekle", adim: [["yaz", "#w-ad", "Depo"], ["tikla", "#w-il"], ["tikla", '[data-secim="w-il"][data-deger="Bursa"]'], ["tikla", '[data-eylem="pencere-kaydet"]']] },
    { ad: "ek giriş ekle · seçili tesisler", hash: "#/m/m3/kullanici-ekle", adim: [["tikla", '[data-kapsam="secili"]']] },
    { ad: "pasif yap penceresi (müşteri)", hash: "#/m/m11", adim: [["tikla", '[data-eylem="pasif-ac"]']] },
    { ad: "müşteri · pasif, tesisleri de pasif", hash: "#/m/m11", adim: [["tikla", '[data-eylem="pasif-ac"]'], ["tikla", '[data-eylem="pencere-kaydet"]']] },
  ] },
  /* M3 Ekipman Türü Kataloğu · Ekipman (2026-09-24) */
  m3: { sayfa: "maket/ekipman-turleri.html", durumlar: [
    /* 2026-09-26 (2. tur): Ekipmanlar ekranı kalktı (ekipmanlar planın içinde); tür eklenmez, firma yalnız ayarını düzenler */
    { ad: "ekipman türleri · katalog", hash: "#/" },
    { ad: "tür · zorunlu format, şablon var", hash: "#/tur/ET" },
    { ad: "tür · şablon hazırlanıyor, standart yok", hash: "#/tur/LP" },
    { ad: "ayarları düzenle · periyot, süre, standartlar", hash: "#/tur/ET/duzenle" },
    { ad: "ayarları düzenle · geçersiz periyot", hash: "#/tur/ET/duzenle", adim: [["yaz", "#w-periyot", "0"], ["tikla", '[data-eylem="pencere-kaydet"]']] },
    { ad: "tesis sayfası · ekipman yüzü planı açar", sayfa: "maket/musteriler.html", hash: "#/t/t1" },
  ] },
  /* M4 Ölçüm Cihazı · Zimmet · kalibrasyon uyarısı (2026-09-24) */
  m4: { sayfa: "maket/zimmetler.html", durumlar: [
    { ad: "ölçüm cihazları · liste + uyarı şeridi", sayfa: "maket/olcum-cihazlari.html", hash: "#/" },
    { ad: "cihaz · kalibrasyonu geçmiş, zimmette", sayfa: "maket/olcum-cihazlari.html", hash: "#/c/v3" },
    { ad: "cihaz · kalibrasyonda", sayfa: "maket/olcum-cihazlari.html", hash: "#/c/v14" },
    { ad: "kalibrasyon kaydı · boş gönderildi", sayfa: "maket/olcum-cihazlari.html", hash: "#/c/v1/kalibrasyon", adim: [["tikla", '[data-eylem="pencere-kaydet"]']] },
    { ad: "zimmetler · kimde", hash: "#/" },
    { ad: "zimmetler · kişiye göre (adresten)", hash: "#/?kisi=mk" },
    { ad: "zimmetler · hareketler", hash: "#/hareketler" },
    { ad: "varlık · araç, fotoğraflı geçmiş", hash: "#/v/a1" },
    { ad: "teslim · kalibrasyonu geçmiş cihaz uyarısı", hash: "#/teslim/v3", adim: [["tikla", "#w-alan"], ["tikla", '[data-secim="w-alan"][data-deger="mk"]']] },
    { ad: "teslim · araç, boş gönderildi", hash: "#/teslim/a3", adim: [["tikla", '[data-eylem="pencere-kaydet"]']] },
  ] },
  m5: { sayfa: "maket/sozlesmeler.html", durumlar: [
    { ad: "İSG-KATİP · liste + plan kabulünü durduran eksikler", hash: "#/" },
    { ad: "kişiye göre (personel kartından)", hash: "#/isg?kisi=mk" },
    { ad: "tesise göre, kayıt yok (tesis sayfasından)", hash: "#/isg?tesis=t8" },
    { ad: "görünüm · hepsi (önceki kayıtlar dahil)", hash: "#/", adim: [["js", 'MK.SZ.i.sec.gorunum = "hepsi"; MK.suzgecKur("i")']] },
    { ad: "kayıt ekle · eksikten (tesis + kişi dolu)", hash: "#/isg/yeni?tesis=t8&kisi=mk" },
    { ad: "kayıt ekle · geç onay canlı denetimi", hash: "#/isg/yeni?tesis=t8&kisi=mk", adim: [["yaz", "#w-onay", "26.09.2026"]] },
    { ad: "kayıt ekle · güncel kaydı olan kişi × tesis", hash: "#/isg/yeni?tesis=t12&kisi=mk" },
    { ad: "kayıt ekle · boş gönderildi", hash: "#/isg/yeni", adim: [["tikla", '[data-eylem="pencere-kaydet"]']] },
    { ad: "kayıt · geç onay (P-0926-038)", hash: "#/isg/i8" },
    { ad: "kayıt · kabul edilmiş planın dayanağı", hash: "#/isg/i1" },
    { ad: "önceki kayıt · salt okunur", hash: "#/isg/i90" },
  ] },
  m6: { sayfa: "maket/plan-ac.html", durumlar: [
    { ad: "plan aç · boş form", hash: "#/" },
    { ad: "müşteriden gelince (tesis bekliyor)", hash: "#/?musteri=m1" },
    { ad: "tesisten gelince: tarih + kontrolü gelen seçili", hash: "#/?tesis=t2" },
    { ad: "ekip seçili: kabul eksiği + yetki boşluğu", hash: "#/?tesis=t2", adim: [["tikla", "#p-a-mk"], ["tikla", "#p-a-ea"]] },
    { ad: "açık planlı tesis: kapsam açık planda, aynı saat", hash: "#/?tesis=t8", adim: [["tikla", "#p-a-mk"]] },
    { ad: "sahada kaydedilecek yeni ekipman eklendi", hash: "#/?tesis=t8", adim: [["tikla", "#p-yeniTur"], ["tikla", '[data-secim="p-yeniTur"][data-deger="FL"]'], ["yaz", "#p-yeniAdet", "2"], ["tikla", '[data-eylem="yeni-ekle"]']] },
    { ad: "kapsam listesi 2. sayfa (24 ekipman)", hash: "#/?tesis=t12", adim: [["tikla", '[data-sz="k"] [data-sayfa="2"]']] },
    { ad: "boş gönderildi", hash: "#/", adim: [["tikla", '[data-eylem="plani-ac"]']] },
    { ad: "tesisli, ekipsiz gönderildi", hash: "#/?tesis=t6", adim: [["tikla", '[data-eylem="plani-ac"]']] },
    { ad: "plan açıldı · eksikli ekip", hash: "#/?tesis=t2", adim: [["tikla", "#p-a-mk"], ["tikla", "#p-a-ea"], ["tikla", '[data-eylem="plani-ac"]']] },
  ] },
  m7: { sayfa: "maket/standartlar.html", durumlar: [
    { ad: "standartlar · liste", hash: "#/" },
    { ad: "standartlar · önceki sürümler", hash: "#/", adim: [["js", 'MK.SZ.s.sec.gorunum = "hepsi"; MK.suzgecKur("s")']] },
    { ad: "standart · güncel, çok türde", hash: "#/s/s1" },
    { ad: "standart · önceki sürüm", hash: "#/s/s1e" },
    { ad: "standart · türe atanmamış", hash: "#/s/s22" },
    { ad: "standart yükle · var olan numara (yeni sürüm uyarısı)", hash: "#/yukle", adim: [["yaz", "#w-no", "TS EN 280"]] },
    { ad: "standart yükle · boş gönderildi", hash: "#/yukle", adim: [["tikla", '[data-eylem="pencere-kaydet"]']] },
    { ad: "şablon · elektrik, Bakanlık formatı zorunlu", sayfa: "maket/sablon.html", hash: "#/ET" },
    { ad: "şablon · örnek rapor (hava tankı, taslak format)", sayfa: "maket/sablon.html", hash: "#/HT/ornek" },
    { ad: "şablon · örnek rapor (elektrik iç tesisatı, zorunlu format)", sayfa: "maket/sablon.html", hash: "#/ET/ornek" },
    { ad: "şablon · şablonu olmayan tür", sayfa: "maket/sablon.html", hash: "#/BK" },
  ] },
  m8: { sayfa: "maket/rapor.html", durumlar: [
    { ad: "elektrik raporu yarıda · kalibrasyonu geçmiş cihaz", hash: "#/r/ET-1009" },
    { ad: "pano sigortaları okundu (öneri + emin değil)", hash: "#/r/ET-1009", adim: [["tikla", '[data-eylem="sigorta-oku"]']] },
    { ad: "sigorta kontrol penceresi (emin değil)", hash: "#/r/ET-1009", adim: [["tikla", '[data-eylem="sigorta-oku"]'], ["tikla", '[data-eylem="sigorta-ac"][data-no="F4"]']] },
    { ad: "ağır kusur + sonuç kuralı", hash: "#/r/ET-1009", adim: [["tikla", '[data-segmen="d3"][data-deger="yapildi"]'], ["tikla", '[data-segmen="s3"][data-deger="agir"]'], ["tikla", '[data-segmen="sonuc"][data-deger="kullanilir"]']] },
    { ad: "mekanik raporu onaya hazır", hash: "#/r/KP-1004" },
    { ad: "onaya gönderildi (salt okunur)", hash: "#/r/KP-1004", adim: [["tikla", '[data-eylem="onaya-gonder"]']] },
    { ad: "geri gönderilmiş rapor", hash: "#/r/ZV-1007" },
    { ad: "onaydaki rapor", hash: "#/r/HT-1001" },
    { ad: "sonraki kontrol penceresi · gerekçesiz", hash: "#/r/KP-1004", adim: [["tikla", '[data-eylem="sonraki-ac"]'], ["yaz", "#w-tarih", "23.03.2027"], ["tikla", '[data-eylem="pencere-kaydet"]']] },
    { ad: "raporu olmayan ekipman", hash: "#/r/YK-1011" },
  ] },
  m9: { sayfa: "maket/raporlar.html", durumlar: [
    { ad: "raporlar · inspector'ın listesi + imza şeridi", hash: "#/" },
    { ad: "raporlar · imza bekleyen çipi", hash: "#/", adim: [["tikla", '[data-sz="r"] [data-cip="imza"]']] },
    { ad: "rapor · imza bekliyor (PDF önizlemesi)", hash: "#/r/KM-0926-770-a99c1" },
    { ad: "rapor · müşteriye açık, imzalı", hash: "#/r/KM-0926-760-f535b" },
    { ad: "rapor · geri gönderilmiş taslak", hash: "#/r/KM-0926-792-9ce3b" },
    { ad: "son imza penceresi · toplu, imza servisi", hash: "#/imza" },
    { ad: "son imza penceresi · indir, imzala, yükle", hash: "#/imza", adim: [["tikla", '[data-yontem="dosya"]']] },
    { ad: "onaylar · mekanik kuyruk", sayfa: "maket/onaylar.html", hash: "#/" },
    { ad: "onay ekranı · hafif kusurlu rapor", sayfa: "maket/onaylar.html", hash: "#/r/KM-0926-787-42b08" },
    { ad: "geri gönder penceresi · kısa gerekçe", sayfa: "maket/onaylar.html", hash: "#/r/KM-0926-787-42b08/geri", adim: [["yaz", "#w-gerekce", "eksik"], ["tikla", '[data-eylem="geri-gonder"]']] },
  ] },
  m10: { sayfa: "maket/uyarilar.html", durumlar: [
    { ad: "uyarılar · liste", hash: "#/" },
    { ad: "uyarılar · yalnız kalibrasyon (adresten)", hash: "#/?tur=kalibrasyon" },
    { ad: "uyarılar · süresi geçmiş", hash: "#/", adim: [["tikla", '[data-sz="u"] [data-cip="gecti"]']] },
    { ad: "uyarılar · kişiye göre", hash: "#/", adim: [["js", 'MK.SZ.u.sec.kisi = "dk"; MK.suzgecKur("u")']] },
    { ad: "personel kartı · eğitim tekrarı geçmiş", sayfa: "maket/personel.html", hash: "#/p/ke" },
  ] },
  /* müşteri paneli: firmanın yan menüsü ve çekmecesi yok → kabuksuz (çekmece ölçülmez) */
  m11: { sayfa: "maket/musteri.html", durumlar: [
    { ad: "müşteri paneli · raporlar", hash: "#/", kabuksuz: true },
    { ad: "müşteri paneli · uygunsuzluklar", hash: "#/uygunsuz", kabuksuz: true },
    { ad: "uygunsuzları indir (Excel önizlemesi)", hash: "#/excel", kabuksuz: true },
    { ad: "rapor · açık uygunsuzluk, PDF", hash: "#/r/KM-0925-403-66888", kabuksuz: true },
    { ad: "başka müşterinin raporu · bulunamadı", hash: "#/r/KM-0925-466-70a71", kabuksuz: true },
    { ad: "portal kullanıcısı olmayan müşteri", hash: "#/?musteri=m5", kabuksuz: true },
    { ad: "giderilmiş uygunsuzluklar (firma ekranından önizleme)", hash: "#/uygunsuz?musteri=m9", kabuksuz: true },
    { ad: "müşteri kartı · açık uygunsuzluk kayıtlardan", sayfa: "maket/musteriler.html", hash: "#/m/m9" },
  ] },
  m12: { sayfa: "maket/teklifler.html", durumlar: [
    { ad: "teklifler · liste", hash: "#/" },
    { ad: "teklif · kabul edildi, raporlanan adet", hash: "#/t/T-0926-001" },
    { ad: "teklif · gönderildi", hash: "#/t/T-0926-010" },
    { ad: "teklif · reddedildi", hash: "#/t/T-0926-008" },
    { ad: "red gerekçesi penceresi · boş", hash: "#/t/T-0926-009/red", adim: [["tikla", '[data-eylem="red-kaydet"]']] },
    { ad: "yeni teklif · boş", hash: "#/yeni" },
    { ad: "yeni teklif · tesisteki ekipmandan dolduruldu", hash: "#/yeni?tesis=t13", adim: [["tikla", '[data-eylem="doldur"]']] },
    { ad: "yeni teklif · boş gönderildi", hash: "#/yeni", adim: [["tikla", '[data-eylem="kaydet"]']] },
    { ad: "taslak teklif · düzenle", hash: "#/t/T-0926-012/duzenle" },
  ] },
  m13: { sayfa: "maket/is-sozlesmeleri.html", durumlar: [
    { ad: "iş sözleşmeleri · liste, biten sözleşme şeridi", hash: "#/" },
    { ad: "sözleşme · müşteri imzası bekliyor", hash: "#/s/IS-0926-007" },
    { ad: "sözleşme · yürürlükte, 7 gün sonra bitiyor", hash: "#/s/IS-1025-001" },
    { ad: "sözleşme · iki tesis, kendiliğinden yenilenir", hash: "#/s/IS-1125-001" },
    { ad: "sözleşme · süresi doldu", hash: "#/s/IS-1024-001" },
    { ad: "sözleşme hazırla · kabul edilen tekliften", hash: "#/yeni?teklif=T-0926-001" },
    { ad: "sözleşme hazırla · boş gönderildi", hash: "#/yeni", adim: [["tikla", '[data-eylem="kaydet"]']] },
    { ad: "İSG-KATİP sekmesi · aynı menü", sayfa: "maket/sozlesmeler.html", hash: "#/" },
  ] },
  m14: { sayfa: "maket/muhasebe.html", durumlar: [
    { ad: "işler · liste, vadesi geçen ve faturaya hazır şeridi", hash: "#/" },
    { ad: "faturalar · liste", hash: "#/faturalar" },
    { ad: "iş · faturaya hazır (10 imzalı, 12 süreçte)", hash: "#/is/P-0926-025" },
    { ad: "iş · vadesi geçti, kısmi tahsilat", hash: "#/is/P-0226-011" },
    { ad: "iş · kapandı, iki tahsilat", hash: "#/is/P-1125-011" },
    { ad: "iş · rapor sürüyor (denetimde)", hash: "#/is/P-0926-031" },
    { ad: "fatura · vadesi geçti", hash: "#/f/KMF2026000000017" },
    { ad: "fatura · ödendi, çek + havale", hash: "#/f/KMF2025000000245" },
    { ad: "fatura kaydet penceresi · boş gönderildi", hash: "#/is/P-0926-025/fatura", adim: [["tikla", '[data-eylem="fatura-kaydet"]']] },
    { ad: "tahsilat penceresi", hash: "#/f/KMF2026000000017/tahsilat" },
  ] },
  m15: { sayfa: "maket/performans.html", durumlar: [
    { ad: "pano · bu ay (gün başı)", hash: "#/" },
    { ad: "pano · geçen yıl (aylık)", hash: "#/", adim: [["tikla", '[data-donem="gecen"]']] },
    { ad: "pano · bu yıl, elektrik", hash: "#/", adim: [["tikla", '[data-donem="yil"]'], ["tikla", '[data-brans="e"]']] },
    { ad: "kişi · Mert Kaya, bu ay", hash: "#/p/mk" },
    { ad: "kişi · Hakan Polat, geçen yıl", hash: "#/p/hp", adim: [["tikla", '[data-donem="gecen"]']] },
    { ad: "kişi · bu ay raporu yok", hash: "#/p/bs" },
  ] },
  /* toplu bakış sayfası (tools/sunum-uret.mjs üretir; maket değil, sunum): kabuksuz, taşma / kırpma / çakışma / hedef ölçülür */
  toplu: { sayfa: "toplu-bakis.html", durumlar: [
    { ad: "toplu bakış · baş ve özet", hash: "", kabuksuz: true },
    { ad: "toplu bakış · M14 bölümü", hash: "#m14", kabuksuz: true },
    { ad: "toplu bakış · bağımlılıklar", hash: "#bagimli", kabuksuz: true },
  ] },
  m16: { sayfa: "maket/egitimler.html", durumlar: [
    { ad: "kayıtlar · liste, tekrarı geçen şeridi", hash: "#/" },
    { ad: "kayıtlar · kişiye süzülü (personel kartından)", hash: "#/?kisi=mk" },
    { ad: "eğitim türleri", hash: "#/turler" },
    { ad: "kayıt penceresi · tekrarı geçti", hash: "#/k/g31" },
    { ad: "kayıt ekle · boş gönderildi", hash: "#/yeni", adim: [["tikla", '[data-eylem="kaydet"]']] },
    { ad: "tekrarı kaydet · güncel kayıt uyarısı, sertifika seçildi", hash: "#/yeni?kisi=mk&tur=isg", adim: [["tikla", '[data-eylem="dosya-sec"]']] },
  ] },
};

/* ── ETKİLEŞİM DENEMELERİ (--etkilesim): adımlar koşar, sonra `bekle` ifadesi sayfada doğru dönmeli. Gen verilmezse 1920. ── */
export const DENEMELER = {
  planlar: [
    { ad: "çip süzer, sayaç dürüst (4 / 9)", hash: "#/", adim: [["tikla", '[data-sz="l"] [data-cip="bekliyor"]']], bekle: 'document.querySelector("#a-sayac").textContent === "4 / 9 plan" && document.querySelectorAll("#a-liste tbody tr").length === 4' },
    { ad: "ve + aynı grup → imkânsız, sebep yazılır", hash: "#/", adim: [["tikla", '[data-cip="bekliyor"]'], ["tikla", '[data-cip="kabul"]'], ["tikla", '[data-kip="ve"]']], bekle: '/aynı anda iki durumda/.test(document.querySelector("#a-liste .a-bos-baslik").textContent)' },
    { ad: "sütun başlığı sıralar (Proje no artan)", hash: "#/", adim: [["tikla", '[data-sirala="no"]']], bekle: 'document.querySelector("#a-liste tbody tr .a-no").textContent === "P-0926-025" && document.querySelector("th[aria-sort]") !== null' },
    { ad: "arama süzer, kutu yerinde kalır", hash: "#/", adim: [["yaz", '[data-ara="l"]', "tekirdağ"]], bekle: 'document.querySelectorAll("#a-liste tbody tr").length === 2 && document.activeElement.dataset.ara === "l"' },
    { ad: "rapor sayfalayıcı 2. sayfa (21–22 / 22)", hash: "#/plan/9", adim: [["tikla", '[data-sz="r"] [data-sayfa="2"]']], bekle: 'document.querySelector(\'.a-sayfalar[data-sz="r"] .a-sayfa-bilgi\').textContent === "21–22 / 22"' },
    { ad: "telefonda levha: seçici değişir, rozet 1", gen: 375, hash: "#/", adim: [["tikla", '[data-sz="l"] [data-eylem="levha-ac"]'], ["tikla", '#a-levha [data-sec="brans"][data-deger="e"]'], ["tikla", '#a-levha [data-eylem="levha-kapat"]']], bekle: 'document.querySelector(\'[data-sz="l"] .a-suzgec-rozet\').textContent === "1" && !document.querySelector("#a-levha").open' },
    { ad: "levhada Temizle doğru süzgeci temizler (plan içi)", gen: 375, hash: "#/plan/1", adim: [["tikla", '[data-sz="e"] [data-eylem="levha-ac"]'], ["tikla", '#a-levha [data-sec="brans"][data-deger="e"]'], ["tikla", '#a-levha [data-eylem="temizle"]']], bekle: 'document.querySelector(\'[data-sz="e"] .a-suzgec-rozet\').hidden' },
    { ad: "tablette çekmece açılır, Esc kapatır", gen: 1080, hash: "#/", adim: [["tikla", ".a-menu-tus"], ["tus", "Escape"]], bekle: '!document.querySelector("#a-kabuk").classList.contains("a-cekmece-acik")' },
    { ad: "masaüstünde menü 64 px şeride daralır", hash: "#/", adim: [["tikla", ".a-daralt-tus"]], bekle: 'Math.round(document.querySelector(".a-cubuk").getBoundingClientRect().width) === 64' },
    { ad: "kabul et → Kabul edildi", hash: "#/plan/3", adim: [["tikla", '#a-plan .a-adim-tuslar [data-eylem="kabul"]']], bekle: '/Kabul edildi/.test(document.querySelector("#a-plan .a-nesne-baslik").textContent)' },
    { ad: "reddet: gerekçesiz gönderilmez, gerekçeyle reddedilir", hash: "#/plan/3", adim: [["tikla", '#a-plan .a-adim-tuslar [data-eylem="reddet"]'], ["yaz", "#a-red-gerekce", "Aynı gün başka denetim"], ["tikla", "#a-red-onay"]], bekle: '/Reddedildi/.test(document.querySelector("#a-plan .a-nesne-baslik").textContent)' },
    { ad: "ekipman ekle: çakışan kod kaydedilmez", hash: "#/plan/1/ekle", adim: [["yaz", "#a-ekle-kod", "ht-1001"]], bekle: 'document.querySelector("#a-ekle-kod").value === "HT-1001" && document.querySelector(\'[data-eylem="yeni-kaydet"]\').disabled' },
    { ad: "ekipman ekle: yeni kod + tür → plana eklenir", hash: "#/plan/1", adim: [["tikla", '[data-eylem="ekle-ac"]'], ["yaz", "#a-ekle-kod", "ZZ-9001"], ["tikla", "#a-ekle-tur"], ["tikla", '[data-tur="FL"]'], ["tikla", '[data-eylem="yeni-kaydet"]']], bekle: '!document.querySelector("#a-ekle-pencere").open && [...document.querySelectorAll("#a-liste-e .a-kod")].some(e => e.textContent === "ZZ-9001")' },
    /* 2026-09-24 (M16): bütün modüllerin maketi geldi → "hazır olmayan modül" denemesi yerine: menüdeki 17 modülün hepsi maket sayfasına
       bağlantı, "henüz tasarlanmadı" bildirimi veren tuş kalmadı. 2026-09-25 (M1 2. tur): 16 modül + Ana sayfa = yine 17 bağlantı.
       2026-09-26 (M3 2. tur): Ekipmanlar planın içinde → 15 modül + Ana sayfa = 16 bağlantı. */
    { ad: "menüdeki 15 modül ve Ana sayfa maketi açar (bildirim tuşu yok)", hash: "#/", bekle: 'document.querySelectorAll("#a-menu [data-eylem=modul]").length === 0 && document.querySelectorAll("#a-menu a[href]").length === 16' },
    { ad: "menüden hazır maket → bağlantı (Personel)", hash: "#/", bekle: 'document.querySelector(\'#a-menu a[href="personel.html"]\') !== null' },
  ],
  m1: [
    { ad: "personel: sayaç görünüme dürüst (15 çalışan)", sayfa: "maket/personel.html", hash: "#/", bekle: 'document.querySelector("#a-sayac").textContent === "15 kişi" && document.querySelectorAll("#a-liste tbody tr").length === 15' },
    { ad: "personel: Inspector çipi 9 / 15", sayfa: "maket/personel.html", hash: "#/", adim: [["tikla", '[data-cip="inspector"]']], bekle: 'document.querySelector("#a-sayac").textContent === "9 / 15 kişi"' },
    { ad: "personel: Rol seçicisi Planlama ekibi 3 / 15", sayfa: "maket/personel.html", hash: "#/", adim: [["tikla", '[data-secici-ac="rol"]'], ["tikla", '[data-sec="rol"][data-deger="planlama"]']], bekle: 'document.querySelector("#a-sayac").textContent === "3 / 15 kişi"' },
    { ad: "personel: Bilgisi eksik çipi 1 / 15 (engel değil, uyarı)", sayfa: "maket/personel.html", hash: "#/", adim: [["tikla", '[data-cip="eksik"]']], bekle: 'document.querySelector("#a-sayac").textContent === "1 / 15 kişi" && /Emre Çelik/.test(document.querySelector("#a-liste").textContent)' },
    { ad: "personel: Ayrılanlar görünümü süzgeç sayılmaz, Temizle korur", sayfa: "maket/personel.html", hash: "#/", adim: [["tikla", '[data-secici-ac="durum"]'], ["tikla", '[data-sec="durum"][data-deger="ayrilan"]']], bekle: 'document.querySelector("#a-sayac").textContent === "1 kişi" && document.querySelector(".a-temizle").disabled' },
    { ad: "personel: Mekanik ve Elektrik → imkânsız, sebep", sayfa: "maket/personel.html", hash: "#/", adim: [["tikla", '[data-cip="m"]'], ["tikla", '[data-cip="e"]'], ["tikla", '[data-kip="ve"]']], bekle: '/hem mekanik hem elektrik/.test(document.querySelector("#a-liste .a-bos-baslik").textContent)' },
    { ad: "personel: satır tıklanınca kart açılır", sayfa: "maket/personel.html", hash: "#/", adim: [["tikla", '#a-liste tr[data-href="#/p/mk"] td[data-alan="meslek"]']], bekle: 'location.hash === "#/p/mk" && document.querySelector("#a-nesne h1").textContent === "Mert Kaya"' },
    { ad: "personel formu: teknisyen → uyarı, grup yetkilendirmesi yok", sayfa: "maket/personel.html", hash: "#/yeni", adim: [["tikla", "#f-meslek"], ["tikla", '[data-secim="f-meslek"][data-deger="teknisyen"]']], bekle: '/yetkili kişi meslekleri arasında değil/.test(document.querySelector("#a-form-gorunum .a-serit-uyari").textContent) && !document.querySelector("[data-yetki]")' },
    { ad: "personel formu: diploma ve oda no boş kaydedilir, karta düşer", sayfa: "maket/personel.html", hash: "#/yeni", adim: [["yaz", "#f-ad", "Deniz Er"], ["yaz", "#f-basla", "01.10.2026"], ["tikla", "#f-meslek"], ["tikla", '[data-secim="f-meslek"][data-deger="mak-muh"]'], ["tikla", '[data-eylem="kaydet"]']], bekle: '/^#\\/p\\//.test(location.hash) && document.querySelector("#a-nesne h1").textContent === "Deniz Er"' },
    { ad: "kart: rol eklenir, kaydedilir", sayfa: "maket/personel.html", hash: "#/p/mk", adim: [["tikla", '[data-rol="planlama"]'], ["tikla", '[data-eylem="rol-kaydet"]']], bekle: 'MV.kisi("mk").hesap.roller.join() === "planlama,inspector" && /Roller kaydedildi/.test(document.querySelector("#a-bildirim-metin").textContent)' },
    { ad: "kart: yetkili meslek değilse inspector verilebilir, uyarı yazar", sayfa: "maket/personel.html", hash: "#/p/za", adim: [["tikla", '[data-rol="inspector"]']], bekle: 'document.querySelector(\'[data-rol="inspector"]\').checked && /Uyarı: meslek/.test(document.querySelector("#a-b-hesap").closest("section").textContent)' },
    { ad: "hesap aç: rolsüz açılamaz", sayfa: "maket/personel.html", hash: "#/p/by/hesap", bekle: 'document.querySelector("#a-hesap-pencere").open && document.querySelector(\'[data-eylem="hesap-onayla"]\').disabled' },
    { ad: "hesap aç: geçici parola bir kez gösterilir", sayfa: "maket/personel.html", hash: "#/p/by/hesap", adim: [["tikla", '[data-hrol="inspector"]'], ["tikla", '[data-eylem="hesap-onayla"]']], bekle: '/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(document.querySelector("#h-parola").textContent) && MV.kisi("by").hesap.durum === "ilk"' },
    { ad: "hesap aç → Tamam → kartta İlk giriş bekleniyor", sayfa: "maket/personel.html", hash: "#/p/by/hesap", adim: [["tikla", '[data-hrol="inspector"]'], ["tikla", '[data-eylem="hesap-onayla"]'], ["tikla", "#a-hesap-alt .a-tus-birincil"]], bekle: 'location.hash === "#/p/by" && !document.querySelector("#a-hesap-pencere").open && /İlk giriş bekleniyor/.test(document.querySelector("#a-nesne").textContent)' },
    { ad: "yeni geçici parola: eski geçersiz, ilk giriş beklenir", sayfa: "maket/personel.html", hash: "#/p/mk/hesap", adim: [["tikla", '[data-eylem="parola-olustur"]']], bekle: 'document.querySelector("#h-parola") !== null && MV.kisi("mk").hesap.durum === "ilk"' },
    { ad: "hesabı kapat: roller kilitlenir, Hesabı yeniden aç çıkar", sayfa: "maket/personel.html", hash: "#/p/mk", adim: [["tikla", '[data-eylem="hesap-kapat"]']], bekle: 'document.querySelector(\'[data-rol="inspector"]\').disabled && document.querySelector(\'[data-eylem="hesap-yeniden"]\') !== null' },
    { ad: "rol yetkileri: düzenle → değiştir → kaydet", sayfa: "maket/personel.html", hash: "#/roller", adim: [["tikla", '[data-eylem="rol-duzenle"]'], ["tikla", "#m-13-1"], ["tikla", '[data-secim="m-13-1"][data-deger="gor"]'], ["tikla", '[data-eylem="matris-kaydet"]']], bekle: 'MV.MATRIS[13][1] === "gor" && /1 değişiklik/.test(document.querySelector("#a-bildirim-metin").textContent) && /Firmanın kendi düzeni/.test(document.querySelector("#a-roller").textContent)' },
    { ad: "rol yetkileri: firma yöneticisinin Personel yetkisi sabit", sayfa: "maket/personel.html", hash: "#/roller", adim: [["tikla", '[data-eylem="rol-duzenle"]']], bekle: '!document.querySelector("#m-2-4") && document.querySelector("#m-2-3") !== null && /sabit/.test(document.querySelector("#a-roller").textContent)' },
    { ad: "rol yetkileri: önerilen düzene dön → değişiklik kalmaz", sayfa: "maket/personel.html", hash: "#/roller", adim: [["tikla", '[data-eylem="rol-duzenle"]'], ["tikla", "#m-13-1"], ["tikla", '[data-secim="m-13-1"][data-deger="gor"]'], ["tikla", '[data-eylem="matris-oneri"]']], bekle: 'document.querySelector("#m-13-1 .a-kirp").textContent === "Kendi" && document.querySelector(\'[data-eylem="matris-kaydet"]\').disabled' },
    { ad: "özlük: belge eklenir, kartta görünür", sayfa: "maket/personel.html", hash: "#/p/mk/belge", adim: [["tikla", "#b-tur"], ["tikla", '[data-secim="b-tur"][data-deger="saglik"]'], ["tikla", '[data-eylem="dosya-sec"]'], ["tikla", '[data-eylem="belge-kaydet"]']], bekle: 'location.hash === "#/p/mk" && /Sağlık raporu/.test(document.querySelector("#a-nesne").textContent)' },
    { ad: "zimmet formu: kartta İmzalı formu aç → form açılır", sayfa: "maket/personel.html", hash: "#/p/mk", adim: [["tikla", '.a-zimmet-form-durum a.a-tus']], bekle: 'location.hash === "#/p/mk/zimmet-imzali/ZF-0426-003" && /imzalı/.test(document.querySelector(".a-belge-imzali").textContent)' },
    { ad: "zimmet geçmişi: kartındaki tuşla açılır, araç devri ve tarihleri görünür", sayfa: "maket/personel.html", hash: "#/p/ea", adim: [["tikla", 'a[href="#/p/ea/zimmet-gecmisi"]']], bekle: 'location.hash === "#/p/ea/zimmet-gecmisi" && /devredildi · Mert Kaya/.test(document.querySelector("#a-nesne").textContent) && /5 Oca 2026/.test(document.querySelector("#a-nesne").textContent)' },
    { ad: "zimmet geçmişi: satır sayısı kişiye yapılan teslim kadar", sayfa: "maket/personel.html", hash: "#/p/ea/zimmet-gecmisi", bekle: 'document.querySelectorAll("#a-nesne table")[0].querySelectorAll("tbody tr").length === MV.ZIMMET.filter(function (z) { return z.alan === "ea"; }).length' },
    { ad: "zimmet formu: güncel form kartta onaylı, eskiyen uyarılı", sayfa: "maket/personel.html", hash: "#/p/mk", bekle: '/İmzalı zimmet formu yüklü: ZF-0426-003/.test(document.querySelector(".a-zimmet-form-durum").textContent) && document.querySelector(".a-zimmet-form-durum a.a-tus") !== null' },
    { ad: "zimmet formu: varlıklar forma dolar, taramayı yükle → kartta güncel", sayfa: "maket/personel.html", hash: "#/p/ea/zimmet-formu", adim: [["tikla", '[data-eylem="zform-yukle"]']], bekle: 'location.hash === "#/p/ea" && /İmzalı zimmet formu yüklü/.test(document.querySelector(".a-zimmet-form-durum").textContent)' },
    { ad: "zimmet formu: tablo kişideki varlık sayısı kadar", sayfa: "maket/personel.html", hash: "#/p/mk/zimmet-formu", bekle: 'document.querySelectorAll(".a-belge-tablo tbody tr").length === MV.VARLIKLAR.filter(function (v) { return MV.kimde(v.id) === "mk"; }).length && /Teslim alan/.test(document.querySelector(".a-belge").textContent)' },
    { ad: "kart: Zimmetinde yüzü bölüme götürür", sayfa: "maket/personel.html", hash: "#/p/mk", adim: [["tikla", '[data-eylem="zimmete-git"]']], bekle: 'document.activeElement.id === "a-b-zimmet"' },
    { ad: "eski Kullanıcılar bağlantısı kişinin kartına gider", sayfa: "maket/kullanicilar.html", hash: "#/k/mk", bekle: '/personel\\.html$/.test(location.pathname) && location.hash === "#/p/mk"' },
    { ad: "giriş: boş gönderim alanları işaretler", sayfa: "maket/giris.html", hash: "#/", adim: [["tikla", '[data-eylem="gir"]']], bekle: 'document.querySelector("#g-eposta").getAttribute("aria-invalid") === "true" && document.activeElement.id === "g-eposta"' },
    { ad: "giriş: yanlış parola → hesap var mı söylenmez", sayfa: "maket/giris.html", hash: "#/", adim: [["yaz", "#g-eposta", "biri@firma.example"], ["yaz", "#g-parola", "hata123"], ["tikla", '[data-eylem="gir"]']], bekle: 'location.hash === "#/hata" && /E-posta ya da parola yanlış/.test(document.querySelector(".a-serit").textContent)' },
    { ad: "giriş: parola göster/gizle", sayfa: "maket/giris.html", hash: "#/", adim: [["yaz", "#g-parola", "gizli1"], ["tikla", '[data-eylem="goster"]']], bekle: 'document.querySelector("#g-parola").type === "text" && document.querySelector("#g-parola").value === "gizli1"' },
    { ad: "giriş: sıfırlama gönderildi", sayfa: "maket/giris.html", hash: "#/unuttum", adim: [["yaz", "#g-eposta", "biri@firma.example"], ["tikla", '[data-eylem="sifirla"]']], bekle: 'location.hash === "#/gonderildi" && /kayıtlıysa/.test(document.querySelector(".a-serit").textContent)' },
    { ad: "giriş: geçici parolayla → parolayı değiştir ekranı", sayfa: "maket/giris.html", hash: "#/", adim: [["yaz", "#g-eposta", "ozan.kurt@firma.example"], ["yaz", "#g-parola", "gecici12"], ["tikla", '[data-eylem="gir"]']], bekle: 'location.hash === "#/gecici" && /Parolayı değiştir/.test(document.querySelector("h1").textContent)' },
    { ad: "giriş: geçici parola ekranında Şimdi değil → Ana sayfa", sayfa: "maket/giris.html", hash: "#/gecici", adim: [["tikla", 'a[href="anasayfa.html"]']], bekle: '/anasayfa\\.html$/.test(location.pathname)' },
    { ad: "giriş: doğru bilgi → Ana sayfa", sayfa: "maket/giris.html", hash: "#/", adim: [["yaz", "#g-eposta", "ayse.demir@firma.example"], ["yaz", "#g-parola", "dogru12345"], ["tikla", '[data-eylem="gir"]']], bekle: '/anasayfa\\.html$/.test(location.pathname)' },
    { ad: "ana sayfa: menüde Ana sayfa seçili", sayfa: "maket/anasayfa.html", hash: "#/yonetici", bekle: 'document.querySelector(\'#a-menu a[aria-current="page"]\').textContent === "Ana sayfa"' },
    { ad: "ana sayfa: rol anahtarı → inspector bölümü ve kişi", sayfa: "maket/anasayfa.html", hash: "#/yonetici", adim: [["tikla", 'a.a-sekme[href="#/inspector"]']], bekle: 'document.querySelector(".a-kullanici-ad").textContent === "Mert Kaya" && /Son imzanı bekleyen/.test(document.querySelector("#a-icerik").textContent)' },
    { ad: "ana sayfa: mekanik yöneticide onay kuyruğu en eski üstte", sayfa: "maket/anasayfa.html", hash: "#/mekyon", bekle: '(function () { var l = MV.RAPORLAR.filter(function (r) { return r.durum === "onayda" && MV.tur(MV.ekipman(r.kod).tur).b === "m"; }).sort(function (a, b) { return a.gonderildi < b.gonderildi ? -1 : 1; }); return document.querySelector("#a-icerik tbody tr a.a-no").textContent === l[0].no; })()' },
  ],
  m2: [
    /* 2026-09-25 (2. tur, reisim 44–50 "Tüm önerilerin uygundur"): davet → kendiliğinden müşteri girişi · vergi / SGK no uyarı, engel
       değil · pasif · il / ilçe seçim listesi */
    { ad: "müşteriler: Müşteri girişi kullanılmadı → 2 / 11", hash: "#/", adim: [["tikla", '[data-cip="girmedi"]']], bekle: 'document.querySelector("#a-sayac").textContent === "2 / 11 müşteri"' },
    { ad: "müşteriler: İl = Bursa → 2 müşteri", hash: "#/", adim: [["tikla", '[data-secici-ac="il"]'], ["tikla", '[data-sec="il"][data-deger="Bursa"]']], bekle: 'document.querySelectorAll("#a-liste tbody tr").length === 2' },
    { ad: "müşteriler: tesis adıyla arama (Kaynakhane → Poyraz)", hash: "#/", adim: [["yaz", '[data-ara="m"]', "kaynakhane"]], bekle: '/Poyraz/.test(document.querySelector("#a-liste tbody").textContent) && document.querySelectorAll("#a-liste tbody tr").length === 1' },
    { ad: "müşteri ekle: aynı vergi no → uyarı, pencere açık, Yine de kaydet", hash: "#/", adim: [["tikla", '[data-eylem="musteri-ac"]'], ["yaz", "#w-unvan", "Deneme Ltd."], ["yaz", "#w-vno", "0480215736"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '/Ada Makina müşterisinde de kayıtlı/.test(document.querySelector("#w-vno-ipucu").textContent) && document.querySelector("#a-pencere").open && document.querySelector(\'[data-eylem="pencere-kaydet"]\').textContent === "Yine de kaydet"' },
    { ad: "müşteri ekle: aynı vergi no → Yine de kaydet kaydeder (engel değil)", hash: "#/", adim: [["tikla", '[data-eylem="musteri-ac"]'], ["yaz", "#w-unvan", "Deneme Ltd."], ["yaz", "#w-vno", "0480215736"], ["tikla", '[data-eylem="pencere-kaydet"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'location.hash === "#/m/m12" && !document.querySelector("#a-pencere").open' },
    { ad: "müşteri ekle: vergi no ve e-posta boş → kaydedilir, eksik uyarısı, giriş yok", hash: "#/yeni", adim: [["yaz", "#w-unvan", "Deneme Kalıp San. Ltd."], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'location.hash === "#/m/m12" && /Eksik bilgi: vergi no · e-posta/.test(document.querySelector("#a-nesne .a-serit-uyari").textContent) && /E-posta yok/.test(document.querySelector("#a-b-giris").closest("section").textContent)' },
    { ad: "müşteri ekle: e-postayla → müşteri girişi kendiliğinden açılır", hash: "#/yeni", adim: [["yaz", "#w-unvan", "Deneme Kalıp San. Ltd."], ["yaz", "#w-eposta", "info@deneme-kalip.example"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'MV.musteri("m12").giris.durum === "gonderildi" && /Parola gönderildi/.test(document.querySelector("#a-b-giris").closest("section").textContent) && /info@deneme-kalip\\.example/.test(document.querySelector("#a-b-giris").closest("section").textContent)' },
    { ad: "tesis ekle: çakışan SGK → uyarı, pencere açık", hash: "#/m/m1/tesis-ekle", adim: [["yaz", "#w-ad", "Ek Bina"], ["js", 'const e = document.querySelector("#w-sgk"); e.value = MV.tesis("t1").sgk; e.dispatchEvent(new Event("input", { bubbles: true }))'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '/Ada Makina \\/ Merkez Fabrika tesisinde de kayıtlı/.test(document.querySelector("#w-sgk-ipucu").textContent) && document.querySelector("#a-pencere").open' },
    { ad: "tesis ekle: il seçilmeden ilçe seçilemez", hash: "#/m/m10/tesis-ekle", bekle: 'document.querySelector("#w-ilce").readOnly === true' },
    { ad: "tesis ekle: il ve ilçe listeden, SGK boş → kaydedilir, eksik uyarısı", hash: "#/m/m10/tesis-ekle", adim: [["yaz", "#w-ad", "Depo"], ["tikla", "#w-il"], ["tikla", '[data-secim="w-il"][data-deger="Bursa"]'], ["tikla", "#w-ilce"], ["tikla", '[data-secim="w-ilce"][data-deger="İnegöl"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'location.hash === "#/t/t16" && MV.tesis("t16").il === "Bursa" && MV.tesis("t16").ilce === "İnegöl" && /SGK işyeri sicil no/.test(document.querySelector("#a-nesne .a-serit-uyari").textContent)' },
    { ad: "tesis ekle: il listesinde arama (81 il)", hash: "#/m/m10/tesis-ekle", adim: [["tikla", "#w-il"], ["yaz", '[data-secim-ara="w-il"]', "kırk"]], bekle: 'document.querySelectorAll(\'[data-secim="w-il"]\').length === 81 && [...document.querySelectorAll(\'[data-secim="w-il"]\')].filter(b => !b.hidden).length === 1' },
    { ad: "ek giriş: seçili tesis seçilmeden açılmaz", hash: "#/m/m3/kullanici-ekle", adim: [["yaz", "#w-ad", "Ali Veli"], ["yaz", "#w-eposta", "ali.veli@kuzey-lojistik.example"], ["tikla", '[data-kapsam="secili"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '/En az bir tesis/.test(document.querySelector("#w-tesis-ipucu").textContent)' },
    { ad: "ek giriş: açılır, parola gönderildi", hash: "#/m/m5/kullanici-ekle", adim: [["yaz", "#w-ad", "Levent Akın"], ["yaz", "#w-eposta", "levent@akin-dokum.example"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'location.hash === "#/m/m5" && /Parola gönderildi/.test(document.querySelector(".a-tablo-mkullanici").textContent)' },
    { ad: "müşteri girişi: parolayı yeniden gönder", hash: "#/m/m5", adim: [["tikla", '[data-eylem="parola-gonder"]']], bekle: '/info@akin-dokum\\.example adresine gönderildi/.test(document.querySelector("#a-bildirim-metin").textContent)' },
    { ad: "müşteri girişi: Müşteri gözüyle bak → o müşterinin paneli", hash: "#/m/m1", adim: [["tikla", 'a[href="musteri.html#/?musteri=m1"]']], bekle: '/musteri\\.html$/.test(location.pathname) && /Ada Makina/.test(document.querySelector("#a-alt").textContent)' },
    { ad: "pasif yap: müşteri ve tesisleri pasif, Plan aç yok", hash: "#/m/m11", adim: [["tikla", '[data-eylem="pasif-ac"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '!!MV.musteri("m11").pasif && MV.tesisleri("m11").every(t => t.pasif) && !document.querySelector(\'#a-nesne .a-eylem-cubugu a[href^="plan-ac.html"]\') && /Pasif/.test(document.querySelector("#a-nesne .a-nesne-baslik").textContent)' },
    { ad: "pasif müşteri listeden kalkar, Görünüm: Pasif'te görünür", hash: "#/m/m11", adim: [["tikla", '[data-eylem="pasif-ac"]'], ["tikla", '[data-eylem="pencere-kaydet"]'], ["js", 'location.hash = "#/"; MK.goster(false)'], ["tikla", '[data-secici-ac="gorunum"]'], ["tikla", '[data-sec="gorunum"][data-deger="pasif"]']], bekle: 'document.querySelector("#a-sayac").textContent === "1 müşteri" && /Poyraz/.test(document.querySelector("#a-liste tbody").textContent)' },
    { ad: "yeniden etkinleştir: müşteri ve tesisleri geri gelir", hash: "#/m/m11", adim: [["tikla", '[data-eylem="pasif-ac"]'], ["tikla", '[data-eylem="pencere-kaydet"]'], ["tikla", '[data-eylem="etkinlestir"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '!MV.musteri("m11").pasif && MV.tesisleri("m11").every(t => !t.pasif) && !!document.querySelector(\'#a-nesne .a-eylem-cubugu a[href^="plan-ac.html"]\')' },
    { ad: "tesis sayfası: İSG-KATİP'te aç → İSG-KATİP ekranı", hash: "#/t/t7", adim: [["tikla", '#a-nesne .a-alt-bas a.a-bolum-tus[href^="sozlesmeler.html"]']], bekle: '/sozlesmeler\\.html$/.test(location.pathname) && /tesis=t7/.test(location.hash)' },
    /* 2026-09-24 (M6): plan açma maketi geldi — "henüz tasarlanmadı" denemesi yerine gerçek geçiş (tesis dolu gelir) */
    { ad: "Plan aç → plan açma maketi, tesis dolu", hash: "#/t/t6", adim: [["tikla", '#a-nesne .a-eylem-cubugu a[href^="plan-ac.html"]']], bekle: '/plan-ac\\.html$/.test(location.pathname) && !!document.querySelector("#p-tesis .a-kirp") && document.querySelector("#p-tesis .a-kirp").textContent === "Liman Deposu"' },
    { ad: "tesis sayfası: inspector personel kartına bağlanır", hash: "#/t/t7", bekle: 'document.querySelector(\'.a-tablo-isg a[href="personel.html#/p/mk"]\') !== null' },
    /* 2026-09-24 (toplu bakış öncesi): faz 2 yüzleri — müşteri sayfasından o müşterinin teklif, sözleşme ve faturalarına */
    { ad: "müşteri sayfası: Teklif yüzü → müşterinin teklifleri (3 / 15)", hash: "#/m/m1", adim: [["tikla", 'a.a-yuz[href^="teklifler.html"]']], bekle: '/teklifler\\.html$/.test(location.pathname) && document.querySelector("#a-sayac").textContent === "3 / 15 teklif"' },
    { ad: "müşteri sayfası: İş sözleşmesi yüzü → 1 / 12", hash: "#/m/m1", adim: [["tikla", 'a.a-yuz[href^="is-sozlesmeleri.html"]']], bekle: '/is-sozlesmeleri\\.html$/.test(location.pathname) && document.querySelector("#a-sayac").textContent === "1 / 12 sözleşme"' },
    { ad: "müşteri sayfası: Açık alacak yüzü → müşterinin faturaları (3 / 13)", hash: "#/m/m1", adim: [["tikla", 'a.a-yuz[href^="muhasebe.html"]']], bekle: '/muhasebe\\.html$/.test(location.pathname) && document.querySelector("#a-sayac").textContent === "3 / 13 fatura" && /3.600,00 TL/.test(document.querySelector("#a-liste").textContent)' },
  ],
  m3: [
    /* 2026-09-26 (2. tur, reisim: "ekipman türleri yeterli" · 51 "hayır bu işi denetçiler yapacak" · 52–54 öneriler) */
    { ad: "türler: Rapor şablonu hazırlanıyor çipi", hash: "#/", adim: [["tikla", '[data-cip="sablonsuz"]']], bekle: 'document.querySelector("#a-sayac").textContent === MV.KATALOG.filter(t => !t.sablon).length + " / " + MV.KATALOG.length + " tür"' },
    { ad: "türler: branş Elektrik", hash: "#/", adim: [["tikla", '[data-secici-ac="brans"]'], ["tikla", '[data-sec="brans"][data-deger="e"]']], bekle: 'document.querySelectorAll("#a-liste tbody tr").length === MV.KATALOG.filter(t => t.b === "e").length' },
    { ad: "türler: Tür ekle tuşu yok (türler probata'dan)", hash: "#/", bekle: '!document.querySelector(\'[data-eylem="tur-ac"]\') && /probata\'dan gelir/.test(document.querySelector("#a-tur-bilgi").textContent)' },
    { ad: "tür sayfası: yetkili meslekler bölümü yok, ekipman yüzü tıklanmaz", hash: "#/tur/ET", bekle: '!document.querySelector("#a-b-meslek") && ![...document.querySelectorAll("#a-nesne a.a-yuz")].some(a => /Ekipman/.test(a.textContent))' },
    { ad: "ayarlar: süre boş bırakılır → kaydedilir, Girilmedi", hash: "#/tur/ET/duzenle", adim: [["yaz", "#w-sure", ""], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'location.hash === "#/tur/ET" && MV.tur("ET").sure === null && /Girilmedi/.test(document.querySelector("#a-b-kural").closest("section").textContent)' },
    { ad: "ayarlar: periyot 0 → hata, pencere açık", hash: "#/tur/ET/duzenle", adim: [["yaz", "#w-periyot", "0"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'document.querySelector("#a-pencere").open && /1–120 ay/.test(document.querySelector("#w-periyot-ipucu").textContent)' },
    { ad: "ayarlar: periyot 6 → tür sayfasında 6 ay", hash: "#/tur/ET/duzenle", adim: [["yaz", "#w-periyot", "6"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'MV.tur("ET").periyot === 6 && /6 ay/.test(document.querySelector("#a-nesne .a-yuzler").textContent)' },
    { ad: "ayarlar: Vazgeç → tür sayfasına döner", hash: "#/tur/ET/duzenle", adim: [["tikla", '#a-pencere [data-eylem="pencere-kapat"]']], bekle: 'location.hash === "#/tur/ET" && !document.querySelector("#a-pencere").open' },
    { ad: "eski Ekipmanlar bağlantısı Ekipman türlerine gider", sayfa: "maket/ekipmanlar.html", hash: "#/e/HT-1001", bekle: '/ekipman-turleri\\.html$/.test(location.pathname)' },
    { ad: "tesis sayfası: Ekipman yüzü tesisin planını açar", sayfa: "maket/musteriler.html", hash: "#/t/t1", adim: [["tikla", 'a.a-yuz[href^="planlarim.html"]']], bekle: '/planlarim\\.html$/.test(location.pathname) && location.hash === "#/plan/1"' },
  ],
  m4: [
    { ad: "cihazlar: uyarı şeridindeki Göster çipi uygular (2 / 20)", sayfa: "maket/olcum-cihazlari.html", hash: "#/", adim: [["tikla", '[data-eylem="cip-uygula"][data-deger="gecti"]']], bekle: 'document.querySelector("#a-sayac").textContent === "2 / 20 cihaz" && document.querySelector(\'[data-cip="gecti"]\').getAttribute("aria-pressed") === "true"' },
    { ad: "cihaz ekle: aynı envanter no reddedilir", sayfa: "maket/olcum-cihazlari.html", hash: "#/yeni", adim: [["yaz", "#w-env", "oc-001"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '/başka bir cihazda kayıtlı/.test(document.querySelector("#w-env-ipucu").textContent)' },
    { ad: "cihaz ekle: geçerli → depoda cihaz sayfası", sayfa: "maket/olcum-cihazlari.html", hash: "#/yeni", adim: [["yaz", "#w-env", "OC-099"], ["tikla", "#w-cihazTur"], ["tikla", '[data-secim="w-cihazTur"][data-deger="pens"]'], ["yaz", "#w-seri", "CS1"], ["yaz", "#w-bitis", "01.09.2027"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '/^#\\/c\\/v/.test(location.hash) && /OC-099/.test(document.querySelector("#a-nesne h1").textContent) && /Depo/.test(document.querySelector(".a-yuzler").textContent)' },
    { ad: "kalibrasyon kaydı: dosyasız kaydedilmez", sayfa: "maket/olcum-cihazlari.html", hash: "#/c/v1/kalibrasyon", adim: [["yaz", "#w-bitis", "23.09.2027"], ["yaz", "#w-sertifika", "KL-2026-900"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '/Sertifika dosyası eklenmeli/.test(document.querySelector("#a-pencere-govde").textContent)' },
    { ad: "kalibrasyon kaydı: laboratuvardaki cihaz döner, depoya girer", sayfa: "maket/olcum-cihazlari.html", hash: "#/c/v14/kalibrasyon", adim: [["yaz", "#w-bitis", "23.09.2027"], ["yaz", "#w-sertifika", "KL-2026-901"], ["tikla", '[data-eylem="dosya-sec"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'MV.kimde("v14") === "depo" && MV.kalDurum(MV.varlik("v14")) === "gecerli" && /Geçerli/.test(document.querySelector("#a-nesne .a-nesne-baslik").textContent)' },
    { ad: "ara kontrol eklenir", sayfa: "maket/olcum-cihazlari.html", hash: "#/c/v9", adim: [["tikla", '[data-eylem="ara-ac"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'document.querySelectorAll(".a-tablo-ara tbody tr").length === 2' },
    { ad: "zimmetler: personel kartından kişiye göre (6 / 28)", hash: "#/?kisi=mk", bekle: 'document.querySelector("#a-sayac").textContent === "6 / 28 varlık"' },
    { ad: "hareketler: 20'şer sayfa (1–20 / 29)", hash: "#/hareketler", bekle: 'document.querySelector(".a-sayfa-bilgi").textContent === "1–20 / " + MV.ZIMMET.length' },
    { ad: "teslim: aynı kişiye teslim reddedilir", hash: "#/teslim/v7", adim: [["tikla", "#w-alan"], ["tikla", '[data-secim="w-alan"][data-deger="mk"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '/zaten Mert Kaya/.test(document.querySelector("#w-alan-ipucu").textContent)' },
    { ad: "teslim: fotoğrafsız ve kilometresiz araç teslimi reddedilir", hash: "#/teslim/a3", adim: [["tikla", "#w-alan"], ["tikla", '[data-secim="w-alan"][data-deger="bs"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '/en az bir fotoğraf/i.test(document.querySelector("#a-pencere-govde").textContent) && document.querySelector("#w-km").getAttribute("aria-invalid") === "true"' },
    { ad: "teslim: kalibrasyonu geçmiş cihaz depoya alınır, onay gerekmez", hash: "#/teslim/v3", adim: [["tikla", "#w-alan"], ["tikla", '[data-secim="w-alan"][data-deger="depo"]'], ["tikla", '[data-eylem="foto-ekle"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'location.hash === "#/v/v3" && MV.kimde("v3") === "depo" && /İade alındı/.test(document.querySelector(".a-gecmis").textContent)' },
    { ad: "teslim: kişiye teslim onay bekler", hash: "#/teslim/d5", adim: [["tikla", "#w-alan"], ["tikla", '[data-secim="w-alan"][data-deger="ok"]'], ["tikla", '[data-eylem="foto-ekle"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'MV.kimde("d5") === "ok" && /Onay bekliyor/.test(document.querySelector(".a-gecmis li").textContent)' },
  ],
  m5: [
    { ad: "eksikler: iki plan kabulü durur (kayıt yok · geç onay)", hash: "#/", bekle: 'document.querySelectorAll("#a-uyari .a-serit").length === 2 && /kayıt yok/.test(document.querySelector("#a-uyari").textContent) && /en geç 24 Eyl/.test(document.querySelector("#a-uyari").textContent)' },
    { ad: "personel kartından kişiye göre (9 / 17)", hash: "#/isg?kisi=mk", bekle: 'document.querySelector("#a-sayac").textContent === "9 / 17 kayıt"' },
    { ad: "Geç onay çipi (1 / 17)", hash: "#/", adim: [["tikla", '[data-sz="i"] [data-cip="gec"]']], bekle: 'document.querySelector("#a-sayac").textContent === "1 / 17 kayıt" && /S-2026-0447/.test(document.querySelector("#a-liste").textContent)' },
    { ad: "görünüm: önceki kayıtlar (2), süzgeç sayılmaz", hash: "#/", adim: [["tikla", '[data-secici-ac="gorunum"]'], ["tikla", '[data-sec="gorunum"][data-deger="onceki"]']], bekle: 'document.querySelector("#a-sayac").textContent === "2 kayıt" && document.querySelector(\'[data-sz="i"] .a-temizle\').disabled' },
    { ad: "tesisten gelince Kayıt ekle tesisi doldurur", hash: "#/isg?tesis=t8", adim: [["tikla", '.a-sayfa-bas [data-eylem="isg-ekle"]']], bekle: 'document.querySelector("#a-pencere").open && document.querySelector("#w-tesis .a-kirp").textContent === "Döküm Hattı"' },
    { ad: "boş gönderildi: dört alan hatası", hash: "#/isg/yeni", adim: [["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'document.querySelectorAll(\'#a-pencere [aria-invalid="true"]\').length === 4 && document.activeElement.id === "w-tesis"' },
    { ad: "aynı sözleşme no reddedilir", hash: "#/isg/yeni?tesis=t8&kisi=mk", adim: [["yaz", "#w-no", "S-2026-0412"], ["yaz", "#w-onay", "20.09.2026"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '/başka bir kayıtta/.test(document.querySelector("#w-no-ipucu").textContent)' },
    { ad: "olmayan tarih (31.02.2026) reddedilir", hash: "#/isg/yeni?tesis=t8&kisi=mk", adim: [["yaz", "#w-no", "S-2026-0450"], ["yaz", "#w-onay", "31.02.2026"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'document.querySelector("#w-onay").getAttribute("aria-invalid") === "true"' },
    { ad: "geç onay canlı denetlenir (26.09 → kabul edemez)", hash: "#/isg/yeni?tesis=t8&kisi=mk", adim: [["yaz", "#w-onay", "26.09.2026"]], bekle: '/kabul edemez/.test(document.querySelector("#w-seritler").textContent) && document.activeElement.id === "w-onay"' },
    { ad: "eksikten kayıt eklenir → P-0926-039 eksikten düşer", hash: "#/", adim: [["tikla", '[data-eylem="isg-ekle"][data-tesis="t8"]'], ["yaz", "#w-no", "S-2026-0450"], ["yaz", "#w-onay", "22.09.2026"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '!document.querySelector("#a-pencere").open && document.querySelectorAll("#a-uyari .a-serit").length === 1 && location.hash === "#/" && /kabul için uygun/.test(document.querySelector("#a-bildirim-metin").textContent)' },
    { ad: "geç onay düzeltilir → P-0926-038 eksikten düşer", hash: "#/isg/i8", adim: [["yaz", "#w-onay", "23.09.2026"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'document.querySelectorAll("#a-uyari .a-serit").length === 1 && !/P-0926-038/.test(document.querySelector("#a-uyari").textContent)' },
    { ad: "yenileme: eski kayıt önceki kayda geçer", hash: "#/isg/yeni?tesis=t12&kisi=mk", adim: [["yaz", "#w-no", "S-2026-0460"], ["yaz", "#w-onay", "20.09.2026"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'MV.isgTesis("t12").filter(x => x.k === "mk").length === 1 && MV.ISG.filter(x => x.id === "i14")[0].onceki === true' },
    { ad: "önceki kayıt salt okunur (Kaydet yok)", hash: "#/isg/i90", bekle: '!document.querySelector(\'[data-eylem="pencere-kaydet"]\') && document.querySelector("#w-no").readOnly' },
    { ad: "Esc pencereyi kapatır, adres listeye döner", hash: "#/isg/i1", adim: [["tus", "Escape"]], bekle: '!document.querySelector("#a-pencere").open && location.hash === "#/"' },
  ],
  m7: [
    { ad: "görünüm: önceki sürümler (1)", hash: "#/", adim: [["tikla", '[data-secici-ac="gorunum"]'], ["tikla", '[data-sec="gorunum"][data-deger="onceki"]']], bekle: 'document.querySelector("#a-sayac").textContent === "1 standart" && /2002/.test(document.querySelector("#a-liste").textContent)' },
    { ad: "Türe atanmamış çipi (1 / 22)", hash: "#/", adim: [["tikla", '[data-sz="s"] [data-cip="bos"]']], bekle: 'document.querySelector("#a-sayac").textContent === "1 / 22 standart" && /60204-1/.test(document.querySelector("#a-liste").textContent)' },
    { ad: "tür sayfasından gelince türe göre süzülür", hash: "#/?tur=HT", bekle: 'document.querySelector("#a-sayac").textContent === "2 / 22 standart"' },
    { ad: "önceki sürümün rapor sayısı yeni sürümde değil", hash: "#/s/s1e", bekle: '+document.querySelectorAll(".a-yuz-sayi")[1].textContent > 0 && /Önceki sürüm/.test(document.querySelector(".a-nesne-baslik").textContent) && !document.querySelector(\'[data-eylem="surum-ac"]\')' },
    { ad: "yükle: boş gönderildi, dört eksik, odak numarada", hash: "#/yukle", adim: [["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'document.querySelectorAll(\'#a-pencere [aria-invalid="true"]\').length === 3 && /PDF dosyası/.test(document.querySelector("#w-dosya-ipucu").textContent) && document.activeElement.id === "w-no"' },
    { ad: "yükle: kütüphanedeki numara yazılınca yeni sürüm uyarısı", hash: "#/yukle", adim: [["yaz", "#w-no", "TS EN 280"]], bekle: '/önceki sürüm olur/.test(document.querySelector("#w-seritler").textContent) && document.activeElement.id === "w-no"' },
    { ad: "yükle: aynı sürüm reddedilir", hash: "#/yukle", adim: [["yaz", "#w-no", "TS EN 286-1"], ["yaz", "#w-surum", "2014"], ["yaz", "#w-konu", "Basit basınçlı kaplar"], ["tikla", '[data-eylem="dosya-sec"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '/kütüphanede var/.test(document.querySelector("#w-surum-ipucu").textContent)' },
    { ad: "yeni standart yüklenir → standart sayfası", hash: "#/yukle", adim: [["yaz", "#w-no", "TS EN 474-1"], ["yaz", "#w-surum", "2022"], ["yaz", "#w-konu", "Toprak işleme makineleri — güvenlik"], ["tikla", '[data-eylem="dosya-sec"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '/^#\\/s\\/y/.test(location.hash) && /TS EN 474-1:2022/.test(document.querySelector("#a-nesne h1").textContent) && /Türe atanmamış/.test(document.querySelector(".a-nesne-baslik").textContent)' },
    { ad: "yeni sürüm: eski sürüm saklanır, türler yeni sürümde", hash: "#/s/s5/surum", adim: [["yaz", "#w-surum", "2023"], ["tikla", '[data-eylem="dosya-sec"]'], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: 'location.hash === "#/s/s5" && /TS EN 15011:2023/.test(document.querySelector("#a-nesne h1").textContent) && document.querySelectorAll(".a-gecmis li").length === 2' },
    { ad: "şablon: tür değişir (seçim alanı)", sayfa: "maket/sablon.html", hash: "#/HT", adim: [["tikla", "#s-tur"], ["tikla", '[data-secim="s-tur"][data-deger="ET"]']], bekle: 'location.hash === "#/ET" && /Elektrik iç tesisatı/.test(document.querySelector("h1").textContent) && /ZPKR02/.test(document.querySelector(".a-belge").textContent)' },
    { ad: "şablon: alanların kaynağı yazılı, örnekte değer", sayfa: "maket/sablon.html", hash: "#/HT", adim: [["tikla", 'a.a-sekme[href="#/HT/ornek"]']], bekle: 'location.hash === "#/HT/ornek" && !document.querySelector(".a-belge-kaynak") && /S-2026-0412/.test(document.querySelector(".a-belge").textContent)' },
    { ad: "şablonu olmayan tür: boş durum", sayfa: "maket/sablon.html", hash: "#/BK", bekle: '!document.querySelector(".a-belge") && /rapor açılamaz/.test(document.querySelector("#a-sablon").textContent)' },
  ],
  m8: [
    { ad: "kriter cevaplanınca sayaç güncellenir, odak basılan seçimde", hash: "#/r/ET-1009", adim: [["tikla", '[data-segmen="d3"][data-deger="yapildi"]'], ["tikla", '[data-segmen="s3"][data-deger="uygun"]']], bekle: '/^4 \\/ 6/.test(document.querySelector("#r-kriter-say").textContent) && document.activeElement.dataset.segmen === "s3"' },
    { ad: "yapılmadı seçilince sonuç sorulmaz", hash: "#/r/ET-1009", adim: [["tikla", '[data-segmen="d4"][data-deger="yapilmadi"]']], bekle: '!document.querySelector(\'[data-segmen="s4"]\') && /^4 \\/ 6/.test(document.querySelector("#r-kriter-say").textContent)' },
    { ad: "hafif kusurda açıklama istenir", hash: "#/r/ET-1009", adim: [["tikla", '[data-segmen="d3"][data-deger="yapildi"]'], ["tikla", '[data-segmen="s3"][data-deger="hafif"]']], bekle: '!!document.querySelector("#r-kn3") && /kusurun açıklaması yazılmadı/.test(document.querySelector("#r-kontrol").textContent)' },
    { ad: "sınır dışı test değeri: işaretlenir, öneri kullanılamaz (odak yerinde)", hash: "#/r/ET-1009", adim: [["yaz", "#r-t1", "0,5"]], bekle: 'document.querySelector("#r-t1").getAttribute("aria-invalid") === "true" && /kullanılamaz/.test(document.querySelector("#r-oneri").textContent) && document.activeElement.id === "r-t1"' },
    { ad: "sigortalar okunur: 10 satır, emin olunmayan 2 toplu onaya girmez", hash: "#/r/ET-1009", adim: [["tikla", '[data-eylem="sigorta-oku"]']], bekle: 'document.querySelectorAll(".a-tablo-sigorta tbody tr").length === 10 && /Önerileri onayla \\(8\\)/.test(document.querySelector("#r-b6").textContent)' },
    { ad: "emin olunmayan satır düzeltilince onaylanır", hash: "#/r/ET-1009", adim: [["tikla", '[data-eylem="sigorta-oku"]'], ["tikla", '[data-eylem="sigorta-ac"][data-no="F4"]'], ["yaz", "#w-akim", "20"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '!document.querySelector("#a-pencere").open && [...document.querySelectorAll(".a-tablo-sigorta tbody tr")].some(tr => /F4/.test(tr.textContent) && /C20/.test(tr.textContent) && /Onaylı/.test(tr.textContent))' },
    { ad: "kalibrasyonu geçmiş cihaz: gönder kapalı, sebebi yazılı", hash: "#/r/ET-1009", bekle: 'document.querySelector(\'[data-eylem="onaya-gonder"]\').disabled && /OC-003/.test(document.querySelector("#r-kontrol").textContent)' },
    { ad: "ağır kusurda Kullanılabilir seçilemez", hash: "#/r/ET-1009", adim: [["tikla", '[data-segmen="d3"][data-deger="yapildi"]'], ["tikla", '[data-segmen="s3"][data-deger="agir"]'], ["tikla", '[data-segmen="sonuc"][data-deger="kullanilir"]']], bekle: '/Kullanılabilir. seçilemez/.test(document.querySelector("#r-kontrol").textContent)' },
    { ad: "onaya gönderilir → Onayda, salt okunur, yönetici adı", hash: "#/r/KP-1004", adim: [["tikla", '[data-eylem="onaya-gonder"]']], bekle: '/Onayda/.test(document.querySelector(".a-nesne-baslik").textContent) && document.querySelector("[data-segmen]").disabled && /Selin Yıldız/.test(document.querySelector("#a-bildirim-metin").textContent)' },
    { ad: "geri gönderilen rapor: test girilince hazır", hash: "#/r/ZV-1007", adim: [["yaz", "#r-t0", "1100"], ["yaz", "#r-t1", "1250"]], bekle: 'document.querySelector("#r-eksik-say").textContent === "Hazır" && !document.querySelector(\'[data-eylem="onaya-gonder"]\').disabled' },
    { ad: "sonraki kontrol: gerekçesiz kaydedilmez", hash: "#/r/KP-1004", adim: [["tikla", '[data-eylem="sonraki-ac"]'], ["yaz", "#w-tarih", "23.03.2027"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '/gerekçe ister/.test(document.querySelector("#w-gerekce-ipucu").textContent) && document.activeElement.id === "w-gerekce"' },
    { ad: "sonraki kontrol gerekçeyle değişir", hash: "#/r/KP-1004", adim: [["tikla", '[data-eylem="sonraki-ac"]'], ["yaz", "#w-tarih", "23.03.2027"], ["yaz", "#w-gerekce", "Üretici altı ayda bir kontrol istiyor"], ["tikla", '[data-eylem="pencere-kaydet"]']], bekle: '/23 Mar 2027/.test(document.querySelector("#r-b1").textContent) && /değiştirildi/.test(document.querySelector("#r-b1").textContent)' },
    { ad: "Git: bölüme kayar, başlığa odaklanır", hash: "#/r/ET-1009", adim: [["tikla", '[data-eylem="bolume-git"][data-hedef="r-b8"]']], bekle: 'document.activeElement.id === "r-b8-b"' },
    { ad: "telefonda Onaya gönder altta yapışkan", gen: 375, hash: "#/r/ET-1009", bekle: 'getComputedStyle(document.querySelector(".a-form-eylem")).position === "sticky"' },
    { ad: "Planlar'dan Raporu düzenle → saha rapor ekranı", sayfa: "maket/planlarim.html", hash: "#/plan/1", adim: [["tikla", '#a-liste-r a[href*="#/r/ET-1009"]']], bekle: '/rapor\\.html$/.test(location.pathname) && /ET-1009/.test(document.querySelector("h1") ? document.querySelector("h1").textContent : "")' },
  ],
  m9: [
    { ad: "imza şeridi ve menü sayacı: 4 rapor", hash: "#/", bekle: '/4 rapor son imzanızı/.test(document.querySelector("#a-uyari").textContent) && document.querySelector("#a-menu-sayi-14").textContent === "4"' },
    { ad: "İmza bekliyor çipi (4 / 90)", hash: "#/", adim: [["tikla", '[data-sz="r"] [data-cip="imza"]']], bekle: 'document.querySelector("#a-sayac").textContent === "4 / 90 rapor"' },
    { ad: "toplu imza (servis) → 4 rapor müşteriye açık", hash: "#/", adim: [["tikla", '[data-eylem="imza-ac"]'], ["tikla", '[data-eylem="imzala"]']], bekle: '!document.querySelector("#a-pencere").open && !document.querySelector("#a-uyari .a-serit") && /4 rapor imzalandı/.test(document.querySelector("#a-bildirim-metin").textContent)' },
    { ad: "indir-imzala-yükle: yüklemeden tamamlanmaz", hash: "#/imza", adim: [["tikla", '[data-yontem="dosya"]'], ["tikla", '[data-eylem="imzala"]']], bekle: '/Önce imzalı PDF/.test(document.querySelector("#a-pencere-govde").textContent) && document.activeElement.dataset.eylem === "imzali-yukle"' },
    { ad: "rapor sayfasından tekli imza", hash: "#/r/KM-0926-770-a99c1", adim: [["tikla", '#a-nesne .a-eylem-cubugu [data-eylem="imza-ac"]'], ["tikla", '[data-eylem="imzala"]']], bekle: '/Müşteriye açık/.test(document.querySelector(".a-nesne-baslik").textContent) && /İmzalandı/.test(document.querySelector(".a-gecmis").textContent)' },
    { ad: "geri gönderilmiş taslak → saha rapor ekranı", hash: "#/r/KM-0926-792-9ce3b", adim: [["tikla", '#a-nesne a[href^="rapor.html"]']], bekle: '/rapor\\.html$/.test(location.pathname) && /ZV-1007/.test(document.querySelector("h1") ? document.querySelector("h1").textContent : "")' },
    { ad: "onay kuyruğu: 8 mekanik rapor, elektrik ayrı", sayfa: "maket/onaylar.html", hash: "#/", bekle: 'document.querySelector("#a-sayac").textContent === "8 rapor" && document.querySelector("#a-menu-sayi-15").textContent === "8" && /Elektrik raporları \\(6\\)/.test(document.querySelector("#a-uyari").textContent)' },
    { ad: "Onayla → sıradaki rapor açılır, sayaç 7", sayfa: "maket/onaylar.html", hash: "#/r/KM-0926-774-be91d", adim: [["tikla", '#a-nesne .a-nesne-bas [data-eylem="onayla"]']], bekle: 'location.hash === "#/r/KM-0926-775-03cf4" && document.querySelector("#a-menu-sayi-15").textContent === "7" && /Sıradaki rapor/.test(document.querySelector("#a-bildirim-metin").textContent)' },
    { ad: "geri gönder: kısa gerekçe reddedilir", sayfa: "maket/onaylar.html", hash: "#/r/KM-0926-787-42b08/geri", adim: [["yaz", "#w-gerekce", "eksik"], ["tikla", '[data-eylem="geri-gonder"]']], bekle: '/en az 10/.test(document.querySelector("#w-gerekce-ipucu").textContent) && document.activeElement.id === "w-gerekce"' },
    { ad: "geri gönder gerekçeyle → taslağa döner", sayfa: "maket/onaylar.html", hash: "#/r/KM-0926-787-42b08", adim: [["tikla", '#a-nesne .a-nesne-bas [data-eylem="geri-ac"]'], ["yaz", "#w-gerekce", "Kusur açıklamasına kanca mandalının durumu yazılmamış."], ["tikla", '[data-eylem="geri-gonder"]']], bekle: 'MV.rapor("KM-0926-787-42b08").durum === "taslak" && /kanca/.test(MV.rapor("KM-0926-787-42b08").geri.gerekce) && location.hash !== "#/r/KM-0926-787-42b08"' },
    { ad: "kuyrukta olmayan (elektrik) rapor: boş durum", sayfa: "maket/onaylar.html", hash: "#/r/KM-0926-776-490cb", bekle: '/kuyrukta değil/i.test(document.querySelector("#a-nesne").textContent)' },
    { ad: "telefonda onay tuşları altta yapışkan", gen: 375, sayfa: "maket/onaylar.html", hash: "#/r/KM-0926-786-fd731", bekle: 'getComputedStyle(document.querySelector(".a-eylem-cubugu-alt")).position === "sticky"' },
  ],
  m10: [
    { ad: "11 uyarı, menü sayacı 11, en yakın tarih üstte", hash: "#/", bekle: 'document.querySelector("#a-sayac").textContent === "11 uyarı" && document.querySelector("#a-menu-sayi-20").textContent === "11" && /OC-013/.test(document.querySelector("#a-liste tbody tr").textContent)' },
    { ad: "Eğitim tekrarı çipi (5 / 11)", hash: "#/", adim: [["tikla", '[data-sz="u"] [data-cip="egt"]']], bekle: 'document.querySelector("#a-sayac").textContent === "5 / 11 uyarı"' },
    { ad: "Süresi geçmiş (3): iki cihaz + Kaan Er", hash: "#/", adim: [["tikla", '[data-sz="u"] [data-cip="gecti"]']], bekle: 'document.querySelector("#a-sayac").textContent === "3 / 11 uyarı" && /Kaan Er/.test(document.querySelector("#a-liste").textContent)' },
    { ad: "adresten kalibrasyon süzgeci (6)", hash: "#/?tur=kalibrasyon", bekle: 'document.querySelector("#a-sayac").textContent === "6 / 11 uyarı"' },
    { ad: "uyarıdan cihaz sayfasına", hash: "#/", adim: [["tikla", '#a-liste a.a-ad-bag[href*="olcum-cihazlari.html"]']], bekle: '/olcum-cihazlari\\.html$/.test(location.pathname) && /^#\\/c\\/v/.test(location.hash)' },
    { ad: "personel kartı eğitim yüzü kayıttan (Kaan Er: tekrarı geçti)", sayfa: "maket/personel.html", hash: "#/p/ke", bekle: '/1 tekrarı geçti/.test(document.querySelector(".a-yuzler").textContent)' },
  ],
  m11: [
    { ad: "yalnız imzalı ve kendi raporları (21)", hash: "#/", bekle: 'document.querySelector("#a-sayac").textContent === "21 rapor" && !document.querySelector("#a-menu")' },
    { ad: "Uygunsuz çipi (6 / 21)", hash: "#/", adim: [["tikla", '[data-sz="m"] [data-cip="kusurlu"]']], bekle: 'document.querySelector("#a-sayac").textContent === "6 / 21 rapor"' },
    { ad: "uygunsuzluklar sekmesi: 6 açık, Excel tuşu görünür", hash: "#/", adim: [["tikla", 'a.a-sekme[href="#/uygunsuz"]']], bekle: 'document.querySelector("#a-sayac").textContent === "6 uygunsuzluk" && !document.querySelector(\'[data-eylem="excel-ac"]\').hidden' },
    { ad: "Excel önizlemesi: açık başına satır; rapor bağlantısı paneli açar", hash: "#/uygunsuz", adim: [["tikla", '[data-eylem="excel-ac"]'], ["tikla", "#a-pencere .a-belge-tablo a.a-no"]], bekle: '/^#\\/r\\//.test(location.hash) && !document.querySelector("#a-pencere").open && !!document.querySelector("#a-nesne .a-belge")' },
    { ad: "başka müşterinin raporu açılmaz", hash: "#/r/KM-0925-466-70a71", bekle: '/bulunamadı/.test(document.querySelector("#a-nesne").textContent) && !document.querySelector(".a-belge")' },
    { ad: "müşteri sayfasından uygunsuzluk yüzü → o müşterinin paneli", sayfa: "maket/musteriler.html", hash: "#/m/m9", adim: [["tikla", 'a.a-yuz[href^="musteri.html"]']], bekle: '/musteri\\.html$/.test(location.pathname) && /Başak Un/.test(document.querySelector("#a-alt").textContent) && document.querySelector("#a-sayac").textContent === "10 uygunsuzluk"' },
  ],
  m12: [
    { ad: "liste: 15 teklif, en yenisi üstte", hash: "#/", bekle: 'document.querySelector("#a-sayac").textContent === "15 teklif" && /T-0926-011|T-0926-012/.test(document.querySelector("#a-liste tbody tr").textContent)' },
    { ad: "kabul edilmiş teklif: raporlanan adet ve tutar", hash: "#/t/T-0926-001", bekle: '/Raporlanan tutar/.test(document.querySelector("#a-nesne").textContent) && document.querySelectorAll(".a-tablo-kalem-rapor tbody tr").length === 12' },
    { ad: "kabul → Plan aç tesisle açılır", hash: "#/t/T-0926-001", adim: [["tikla", '#a-nesne a[href^="plan-ac.html"]']], bekle: '/plan-ac\\.html$/.test(location.pathname) && document.querySelector("#p-tesis .a-kirp").textContent === "Merkez Fabrika"' },
    { ad: "gönderilen teklif kabul edilir", hash: "#/t/T-0926-010", adim: [["tikla", '[data-eylem="kabul"]']], bekle: '/Kabul edildi/.test(document.querySelector(".a-nesne-baslik").textContent) && !!document.querySelector(\'#a-nesne a[href^="plan-ac.html"]\')' },
    { ad: "red: gerekçesiz kaydedilmez, gerekçeyle reddedilir", hash: "#/t/T-0926-009/red", adim: [["tikla", '[data-eylem="red-kaydet"]'], ["yaz", "#w-gerekce", "Başka firmayla çalışılacak"], ["tikla", '[data-eylem="red-kaydet"]']], bekle: '/Reddedildi/.test(document.querySelector(".a-nesne-baslik").textContent) && /Başka firmayla/.test(document.querySelector("#a-nesne").textContent)' },
    { ad: "form: tür seçilince fiyat listeden, tutar ve toplam canlı", hash: "#/yeni?tesis=t13", adim: [["tikla", "#f-tur-0"], ["tikla", '[data-secim="f-tur-0"][data-deger="FL"]'], ["yaz", "#f-adet-0", "3"]], bekle: 'document.querySelector("#f-fiyat-0").value === "1.250,00" && document.querySelector("#f-tutar-0").textContent === "3.750,00 TL" && /4.500,00 TL/.test(document.querySelector("#f-toplam").textContent) && document.activeElement.id === "f-adet-0"' },
    { ad: "form: tesisteki ekipmandan doldur (11 ekipman)", hash: "#/yeni?tesis=t13", adim: [["tikla", '[data-eylem="doldur"]']], bekle: 'document.querySelectorAll(".a-kalem").length > 1 && /22.400,00 TL/.test(document.querySelector("#f-toplam").textContent)' },
    { ad: "form: aynı tür iki kez reddedilir", hash: "#/yeni?tesis=t13", adim: [["tikla", "#f-tur-0"], ["tikla", '[data-secim="f-tur-0"][data-deger="FL"]'], ["tikla", '[data-eylem="kalem-ekle"]'], ["tikla", "#f-tur-1"], ["tikla", '[data-secim="f-tur-1"][data-deger="FL"]'], ["tikla", '[data-eylem="kaydet"]']], bekle: '/yukarıda var/.test(document.querySelector("#f-tur-1-ipucu").textContent)' },
    { ad: "yeni teklif kaydedilir → taslak teklif sayfası", hash: "#/yeni?tesis=t13", adim: [["tikla", '[data-eylem="doldur"]'], ["tikla", '[data-eylem="kaydet"]']], bekle: 'location.hash === "#/t/T-0926-013" && /Taslak/.test(document.querySelector(".a-nesne-baslik").textContent)' },
    { ad: "gönderilmiş teklif düzenlenemez", hash: "#/t/T-0926-010/duzenle", bekle: 'location.hash === "#/t/T-0926-010" && !document.querySelector(\'#a-nesne a[href$="/duzenle"]\')' },
  ],
  m13: [
    { ad: "liste: 12 sözleşme, imza bekleyen üstte; biten şeridi yenileme teklifini gösterir", hash: "#/", bekle: 'document.querySelector("#a-sayac").textContent === "12 sözleşme" && /IS-0926-007/.test(document.querySelector("#a-liste tbody tr").textContent) && /IS-1025-001[\\s\\S]*yenileme teklifi T-0926-0/.test(document.querySelector("#a-uyari").textContent)' },
    { ad: "Bitişi 60 gün içinde çipi (2 / 12)", hash: "#/", adim: [["tikla", '[data-sz="s"] [data-cip="biten"]']], bekle: 'document.querySelector("#a-sayac").textContent === "2 / 12 sözleşme"' },
    { ad: "sekme: iş sözleşmelerinden İSG-KATİP kayıtlarına", hash: "#/", adim: [["tikla", 'a.a-sekme[href="sozlesmeler.html#/"]']], bekle: '/sozlesmeler\\.html$/.test(location.pathname) && /İSG-KATİP kayıtları/.test(document.querySelector(".a-sekme[aria-current]").textContent)' },
    { ad: "sekme: İSG-KATİP kayıtlarından iş sözleşmelerine", sayfa: "maket/sozlesmeler.html", hash: "#/", adim: [["tikla", 'a.a-sekme[href="is-sozlesmeleri.html#/"]']], bekle: '/is-sozlesmeleri\\.html$/.test(location.pathname) && document.querySelector("#a-sayac").textContent === "12 sözleşme"' },
    { ad: "imzalı sözleşme yüklenir → yürürlükte", hash: "#/s/IS-0926-007", adim: [["tikla", '[data-eylem="imzali-yukle"]']], bekle: '/Yürürlükte/.test(document.querySelector(".a-nesne-baslik").textContent) && /IS-0926-007\\.pdf/.test(document.querySelector("#a-nesne").textContent) && !document.querySelector(\'[data-eylem="imzali-yukle"]\')' },
    { ad: "teklif sayfasından İş sözleşmesi → form teklifle dolu", sayfa: "maket/teklifler.html", hash: "#/t/T-0926-001", adim: [["tikla", '#a-nesne a[href^="is-sozlesmeleri.html"]']], bekle: '/is-sozlesmeleri\\.html$/.test(location.pathname) && document.querySelector("#f-teklif .a-kirp").textContent === "T-0926-001" && document.querySelector("[data-tesis=t1]").checked' },
    { ad: "müşteri değişince teklif ve tesisler sıfırlanır (odak yerinde)", hash: "#/yeni?teklif=T-0926-001", adim: [["tikla", "#f-m"], ["tikla", '[data-secim="f-m"][data-deger="m3"]']], bekle: '!document.querySelector("[data-tesis]:checked") && document.querySelector("#f-teklif .a-kirp").textContent === "Teklif seçin" && document.activeElement.id === "f-m"' },
    { ad: "tesis seçilmeden kaydedilmez, odak tesiste", hash: "#/yeni?teklif=T-0926-001", adim: [["tikla", "[data-tesis=t1]"], ["tikla", '[data-eylem="kaydet"]']], bekle: '/En az bir tesis/.test(document.querySelector("#a-form-gorunum").textContent) && !!document.activeElement.dataset.tesis' },
    { ad: "sözleşme hazırlanır: IS-0926-008, imza bekliyor, bitiş 12 ay", hash: "#/yeni?teklif=T-0926-001", adim: [["tikla", '[data-yenileme="otomatik"]'], ["tikla", '[data-eylem="kaydet"]']], bekle: 'location.hash === "#/s/IS-0926-008" && /İmza bekliyor/.test(document.querySelector(".a-nesne-baslik").textContent) && /23 Eyl 2027/.test(document.querySelector("#a-nesne").textContent) && /Kendiliğinden/.test(document.querySelector("#a-nesne").textContent)' },
    { ad: "biten sözleşme: yenileme teklifi tuşu o teklifi açar", hash: "#/s/IS-1025-001", adim: [["tikla", '.a-eylem-cubugu a[href*="#/t/"]']], bekle: '/teklifler\\.html$/.test(location.pathname) && location.hash === "#/t/T-0926-009"' },
    { ad: "kapsam: İSG-KATİP kaydı olmayan tesis yazılır; plan bağlantısı plan içine", hash: "#/s/IS-0926-006", adim: [["tikla", '.a-tablo-iskapsam a.a-no']], bekle: '/planlarim\\.html$/.test(location.pathname) && /^#\\/plan\\//.test(location.hash)' },
  ],
  m14: [
    { ad: "liste: 16 iş, vadesi geçen üstte; iki şerit", hash: "#/", bekle: 'document.querySelector("#a-sayac").textContent === "16 iş" && /P-0226-011/.test(document.querySelector("#a-liste tbody tr").textContent) && /Vadesi geçen alacak/.test(document.querySelector("#a-uyari").textContent) && /Faturaya hazır/.test(document.querySelector("#a-uyari").textContent)' },
    { ad: "Kapandı çipi (12 / 16)", hash: "#/", adim: [["tikla", '[data-sz="i"] [data-cip="kapandi"]']], bekle: 'document.querySelector("#a-sayac").textContent === "12 / 16 iş"' },
    { ad: "şeritteki Faturalar → vadesi geçenler süzülü (1 / 13)", hash: "#/", adim: [["tikla", '#a-uyari [data-eylem="gecikenler"]']], bekle: 'location.hash === "#/faturalar" && document.querySelector("#a-sayac").textContent === "1 / 13 fatura" && document.querySelector("#a-sekme-fatura").getAttribute("aria-current") === "page"' },
    { ad: "şeritteki İş → faturaya hazır iş", hash: "#/", adim: [["tikla", '#a-uyari a[href="#/is/P-0926-025"]']], bekle: 'location.hash === "#/is/P-0926-025" && /Faturaya hazır/.test(document.querySelector(".a-nesne-baslik").textContent)' },
    { ad: "işin raporları: Faturaya hazır çipi (10 / 22)", hash: "#/is/P-0926-025", adim: [["tikla", '[data-sz="r"] [data-cip="hazir"]']], bekle: 'document.querySelector("#a-r-sayac").textContent === "10 / 22 rapor"' },
    { ad: "işin raporları: 2. sayfa (21–22 / 22)", hash: "#/is/P-0926-025", adim: [["tikla", '[data-sz="r"] [data-sayfa="2"]']], bekle: 'document.querySelector(\'.a-sayfalar[data-sz="r"] .a-sayfa-bilgi\').textContent === "21–22 / 22"' },
    { ad: "fatura kaydet: no yazılmadan kaydedilmez, odak no'da", hash: "#/is/P-0926-025/fatura", adim: [["tikla", '[data-eylem="fatura-kaydet"]']], bekle: '/yazılmalı/.test(document.querySelector("#w-no-ipucu").textContent) && document.activeElement.id === "w-no"' },
    { ad: "fatura kaydet: kayıtlı no reddedilir", hash: "#/is/P-0926-025/fatura", adim: [["yaz", "#w-no", "kmf2026000000017"], ["tikla", '[data-eylem="fatura-kaydet"]']], bekle: '/zaten kayıtlı/.test(document.querySelector("#w-no-ipucu").textContent)' },
    { ad: "fatura kaydedilir → Tahsilat bekliyor, 10 rapor faturalı", hash: "#/is/P-0926-025/fatura", adim: [["yaz", "#w-no", "KMF2026000000018"], ["tikla", '[data-eylem="fatura-kaydet"]']], bekle: '!document.querySelector("#a-pencere").open && location.hash === "#/is/P-0926-025" && /Tahsilat bekliyor/.test(document.querySelector(".a-nesne-baslik").textContent) && /KMF2026000000018/.test(document.querySelector(".a-tablo-isfatura").textContent) && document.querySelectorAll("#a-r-liste .a-uyari-metin").length === 0' },
    { ad: "tahsilat: kalandan fazlası reddedilir", hash: "#/f/KMF2026000000017/tahsilat", adim: [["yaz", "#w-tutar", "5.000,00"], ["tikla", '[data-eylem="tahsilat-kaydet"]']], bekle: '/Kalan 3.600,00 TL/.test(document.querySelector("#w-tutar-ipucu").textContent) && document.activeElement.id === "w-tutar"' },
    { ad: "tahsilat: yöntem seçilir (odak yerinde)", hash: "#/f/KMF2026000000017/tahsilat", adim: [["tikla", "#w-yontem"], ["tikla", '[data-secim="w-yontem"][data-deger="Çek"]']], bekle: 'document.querySelector("#w-yontem .a-kirp").textContent === "Çek" && document.activeElement.id === "w-yontem"' },
    { ad: "tahsilat kalanı kapatır → fatura ödendi, iş kapandı", hash: "#/f/KMF2026000000017/tahsilat", adim: [["tikla", '[data-eylem="tahsilat-kaydet"]']], bekle: '/Ödendi/.test(document.querySelector(".a-nesne-baslik").textContent) && /P-0226-011 kapandı/.test(document.querySelector("#a-bildirim-metin").textContent)' },
    { ad: "rapor no → Raporlar maketinde rapor", hash: "#/is/P-0926-025", adim: [["tikla", '#a-r-liste a[href^="raporlar.html"]']], bekle: '/raporlar\\.html$/.test(location.pathname) && /^#\\/r\\//.test(location.hash)' },
    { ad: "menüde Muhasebe hazır maketi açar (Planlar'dan)", sayfa: "maket/planlarim.html", hash: "#/", adim: [["tikla", '#a-menu a[href="muhasebe.html"]']], bekle: '/muhasebe\\.html$/.test(location.pathname) && document.querySelector("#a-sayac").textContent === "16 iş"' },
  ],
  m15: [
    { ad: "bu ay: 28 rapor, gün başı 3 gün, kazanç en çok olan üstte", hash: "#/", bekle: '/^Rapor28/.test(document.querySelector(".a-yuz").textContent.replace(/\\s/g, "")) && document.querySelectorAll(".a-grafik")[0].querySelectorAll(".a-grafik-satir").length === 3 && document.querySelector("#a-p-liste tbody tr .a-ad-bag").textContent === "Mert Kaya"' },
    { ad: "dönem: geçen yıl → 12 ay satırı, odak tuşta", hash: "#/", adim: [["tikla", '[data-donem="gecen"]']], bekle: 'document.querySelectorAll(".a-grafik")[0].querySelectorAll(".a-grafik-satir").length === 12 && document.activeElement.dataset.donem === "gecen" && /Aylık/.test(document.querySelector(".a-grafik-baslik").textContent)' },
    { ad: "branş: elektrik → yalnız elektrik personeli", hash: "#/", adim: [["tikla", '[data-brans="e"]']], bekle: '[...document.querySelectorAll("#a-p-liste tbody .a-alt-satir")].every(e => /Elektrik|elektrik/.test(e.textContent)) && document.activeElement.dataset.brans === "e"' },
    { ad: "sütun başlığı sıralar (Ad artan)", hash: "#/", adim: [["tikla", '[data-sirala="ad"]']], bekle: 'document.querySelector("#a-p-liste tbody tr .a-ad-bag").textContent === "Elif Aydın" && document.querySelector("#a-p-liste th[aria-sort]") !== null' },
    { ad: "görünüm: rapor yazanlar (2) → bütün inspector'lar (9)", hash: "#/", adim: [["tikla", '[data-secici-ac="gorunum"]'], ["tikla", '[data-sec="gorunum"][data-deger="hepsi"]']], bekle: 'document.querySelector("#a-p-sayac").textContent === "9 kişi" && document.querySelectorAll("#a-p-liste tbody tr").length === 9' },
    { ad: "arama süzer (1 / 9 kişi)", hash: "#/", adim: [["tikla", '[data-secici-ac="gorunum"]'], ["tikla", '[data-sec="gorunum"][data-deger="hepsi"]'], ["yaz", '[data-ara="p"]', "hakan"]], bekle: 'document.querySelector("#a-p-sayac").textContent === "1 / 9 kişi" && document.activeElement.dataset.ara === "p"' },
    { ad: "kişiye geçiş: günlük iş, muhasebe iş bağlantısı", hash: "#/", adim: [["tikla", '#a-p-liste a[href="#/p/mk"]']], bekle: 'location.hash === "#/p/mk" && document.querySelectorAll(".a-tablo-gunluk tbody tr").length === 3 && !!document.querySelector(\'.a-tablo-gunluk a[href^="muhasebe.html#/is/"]\')' },
    { ad: "kişide dönem korunur (panodan geçen yıl → kişi)", hash: "#/", adim: [["tikla", '[data-donem="gecen"]'], ["tikla", '#a-p-liste a[href="#/p/hp"]']], bekle: 'document.querySelector(\'[data-donem="gecen"]\').getAttribute("aria-pressed") === "true" && document.querySelectorAll(".a-tablo-gunluk tbody tr").length > 0' },
    { ad: "menüde Performans hazır maketi açar (Muhasebe'den)", sayfa: "maket/muhasebe.html", hash: "#/", adim: [["tikla", '#a-menu a[href="performans.html"]']], bekle: '/performans\\.html$/.test(location.pathname) && !!document.querySelector(".a-grafik")' },
  ],
  m16: [
    { ad: "liste: 34 kayıt, tekrarı geçen üstte, şerit", hash: "#/", bekle: 'document.querySelector("#a-sayac").textContent === "34 kayıt" && /Kaan Er/.test(document.querySelector("#a-liste tbody tr").textContent) && /tekrarı geçti/.test(document.querySelector("#a-uyari").textContent)' },
    { ad: "Tekrarı geçti çipi (1 / 34)", hash: "#/", adim: [["tikla", '[data-sz="g"] [data-cip="gecti"]']], bekle: 'document.querySelector("#a-sayac").textContent === "1 / 34 kayıt"' },
    { ad: "sayfalayıcı 2. sayfa (21–34 / 34)", hash: "#/", adim: [["tikla", '[data-sz="g"] [data-sayfa="2"]']], bekle: 'document.querySelector(\'.a-sayfalar[data-sz="g"] .a-sayfa-bilgi\').textContent === "21–34 / 34"' },
    { ad: "personel kartındaki eğitim yüzü → kişinin kayıtları (4 / 34)", sayfa: "maket/personel.html", hash: "#/p/mk", adim: [["tikla", 'a.a-yuz[href^="egitimler.html"]']], bekle: '/egitimler\\.html$/.test(location.pathname) && document.querySelector("#a-sayac").textContent === "4 / 34 kayıt"' },
    { ad: "Uyarılar'daki eğitim satırı → kişinin kayıtları", sayfa: "maket/uyarilar.html", hash: "#/", adim: [["tikla", '#a-liste a[href="egitimler.html#/?kisi=ke"]']], bekle: '/egitimler\\.html$/.test(location.pathname) && document.querySelector("#a-sayac").textContent === "1 / 34 kayıt"' },
    { ad: "tekrarı kaydet: geçen kayıt önceki olur, geçti çipi 0", hash: "#/k/g31", adim: [["tikla", '[data-eylem="tekrar"]'], ["tikla", '[data-eylem="kaydet"]']], bekle: '!document.querySelector("#a-pencere").open && document.querySelector(\'[data-cip="gecti"] .a-cip-sayi\').textContent === "0" && document.querySelector("#a-sayac").textContent === "34 kayıt"' },
    { ad: "kayıt ekle: boş kaydedilmez, odak kişide", hash: "#/yeni", adim: [["tikla", '[data-eylem="kaydet"]']], bekle: '/seçilmeli/.test(document.querySelector("#w-kisi-ipucu").textContent) && document.activeElement.id === "w-kisi"' },
    { ad: "kayıt ekle: ileri tarih reddedilir", hash: "#/yeni?kisi=by", adim: [["tikla", "#w-k"], ["tikla", '[data-secim="w-k"][data-deger="isg"]'], ["yaz", "#w-tarih", "01.10.2026"], ["tikla", '[data-eylem="kaydet"]']], bekle: '/İleri tarihli/.test(document.querySelector("#w-tarih-ipucu").textContent) && document.activeElement.id === "w-tarih"' },
    { ad: "kayıt eklenir: tekrar tarihi türden (35 kayıt)", hash: "#/yeni?kisi=by", adim: [["tikla", "#w-k"], ["tikla", '[data-secim="w-k"][data-deger="yangin"]'], ["tikla", '[data-eylem="kaydet"]']], bekle: 'document.querySelector("#a-sayac").textContent === "35 kayıt" && /tekrar 23 Eyl 2027/.test(document.querySelector("#a-bildirim-metin").textContent)' },
    { ad: "eğitim türleri → türe süzülü kayıtlar", hash: "#/turler", adim: [["tikla", '#a-liste a[href="#/?tur=isg"]']], bekle: 'location.hash === "#/?tur=isg" && /^\\d+ \\/ 34 kayıt$/.test(document.querySelector("#a-sayac").textContent) && document.querySelector("#a-sekme-kayit").getAttribute("aria-current") === "page"' },
  ],
  m6: [
    { ad: "tesisten gelince: tarih sonraki kontrol, 6 / 6 seçili", hash: "#/?tesis=t2", bekle: 'document.querySelector("#p-tarih").value === "14.10.2026" && /^6 \\/ 6 kayıtlı seçili/.test(document.querySelector("#p-secili").textContent)' },
    { ad: "müşteri değişince tesis ve kapsam sıfırlanır", hash: "#/?tesis=t2", adim: [["tikla", "#p-musteri"], ["tikla", '[data-secim="p-musteri"][data-deger="m3"]']], bekle: 'document.querySelector("#p-tesis .a-kirp").textContent === "Tesis seçin" && !document.querySelector("#p-secili") && document.activeElement.id === "p-musteri"' },
    { ad: "tarih değişince İSG uygunluğu yeniden hesaplanır (odak yerinde)", hash: "#/?tesis=t7", adim: [["yaz", "#p-tarih", "30.09.2026"]], bekle: '/Kabul edebilir/.test(document.querySelector("#p-a-mk").closest("tr").textContent) && document.activeElement.id === "p-tarih"' },
    { ad: "aynı saatte başka plan yazılır", hash: "#/?tesis=t8", adim: [["tikla", "#p-a-mk"]], bekle: '/aynı saatte P-0926-039/.test(document.querySelector("#p-ozet-kap").textContent) && document.activeElement.id === "p-a-mk"' },
    { ad: "saat değişince çakışma kalkar", hash: "#/?tesis=t8", adim: [["tikla", "#p-a-mk"], ["yaz", "#p-bas", "13:00"], ["yaz", "#p-bit", "15:00"]], bekle: '!/aynı saatte/.test(document.querySelector("#p-ozet-kap").textContent) && /çakışıyor/.test(document.querySelector("#p-a-mk").closest("tr").textContent) === false' },
    { ad: "açık plandaki ekipman seçilemez", hash: "#/?tesis=t8", bekle: '[...document.querySelectorAll("[data-ekp]")].every(e => e.disabled) && /^0 \\/ 3/.test(document.querySelector("#p-secili").textContent)' },
    { ad: "yeni ekipman kapsama eklenir, özet tür başına", hash: "#/?tesis=t8", adim: [["tikla", "#p-yeniTur"], ["tikla", '[data-secim="p-yeniTur"][data-deger="FL"]'], ["yaz", "#p-yeniAdet", "2"], ["tikla", '[data-eylem="yeni-ekle"]']], bekle: '/Forklift/.test(document.querySelector(".a-tablo-kapsamozet").textContent) && /2 yeni/.test(document.querySelector("#p-secili").textContent)' },
    { ad: "seçim temizlenince kapsam hatası, odak ilk ekipmanda", hash: "#/?tesis=t2", adim: [["tikla", '[data-eylem="secimi-temizle"]'], ["tikla", "#p-a-mk"], ["tikla", '[data-eylem="plani-ac"]']], bekle: '/Kapsamda en az bir/.test(document.querySelector("#a-form-gorunum").textContent) && !!document.activeElement.dataset.ekp' },
    { ad: "geçmiş tarih reddedilir", hash: "#/?tesis=t2", adim: [["yaz", "#p-tarih", "01.09.2026"], ["tikla", "#p-a-mk"], ["tikla", '[data-eylem="plani-ac"]']], bekle: '/Geçmiş tarihe/.test(document.querySelector("#p-tarih-ipucu").textContent) && document.activeElement.id === "p-tarih"' },
    { ad: "boş gönderildi: odak müşteride", hash: "#/", adim: [["tikla", '[data-eylem="plani-ac"]']], bekle: 'document.activeElement.id === "p-musteri" && /eksik düzeltilmeli/.test(document.querySelector("#p-ozet-hata").textContent)' },
    { ad: "plan açılır: P-0926-040, eksikli kişi yazılır", hash: "#/?tesis=t2", adim: [["tikla", "#p-a-mk"], ["tikla", "#p-a-ea"], ["tikla", '[data-eylem="plani-ac"]']], bekle: 'location.hash === "#/acildi" && /P-0926-040/.test(document.querySelector("#a-nesne h1").textContent) && /Elif Aydın kabul edemez: İSG-KATİP kaydı yok/.test(document.querySelector("#a-nesne").textContent)' },
    { ad: "telefonda ekipman süzgeci levhada (tür)", gen: 375, hash: "#/?tesis=t12", adim: [["tikla", '[data-sz="k"] [data-eylem="levha-ac"]'], ["tikla", '#a-levha [data-sec="tur"][data-deger="HT"]'], ["tikla", '#a-levha [data-eylem="levha-kapat"]']], bekle: 'document.querySelector(\'[data-sz="k"] .a-suzgec-rozet\').textContent === "1" && !document.querySelector("#a-levha").open' },
  ],
};

const GENISLIK = [[1920, 1080], [1080, 810], [375, 812]];
const TEMA = ["acik", "koyu"];
const SIFIR = ["tasma", "sertKirpma", "tasanMetin", "cakisma", "sonCakisma", "gizliEtkilesimli", "ekranDisi", "kucukHedef", "basliksizKirpma", "ipucuKesik", "kenarFarki", "gorunenGizli", "pencereKenar", "hizaKaymasi", "kartTutarsiz", "eksikIkon"];

function tarayici() {
  const aday = ["/opt/pw-browsers", "/opt/olcum"].filter(existsSync).flatMap(function ara(d) {
    return readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? ara(join(d, e.name)) : /^(headless_shell|chrome-headless-shell)$/.test(e.name) ? [join(d, e.name)] : []);
  });
  if (!aday.length) throw new Error("Başsız Chromium bulunamadı (tools/bulut-hazirla.sh).");
  return aday[0];
}

async function sunucu() {
  const kapi = 8700 + Math.floor(Math.random() * 200);
  const s = spawn("python3", ["-m", "http.server", String(kapi), "--bind", "127.0.0.1", "--directory", join(KOK, "docs")], { stdio: "ignore" });
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${kapi}/`); return { kapi, kapat: () => s.kill() }; } catch { await new Promise(r => setTimeout(r, 100)); } }
  s.kill(); throw new Error("sunucu açılmadı");
}

/* çekmece açıkken: yalnız çekmece (içerik perdenin altında, etkileşime kapalı) */
const CEKMECE = `(() => {
  const c = document.querySelector(".a-cubuk"), m = document.querySelector(".a-menu"), b = c.getBoundingClientRect();
  const tusY = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--tus-y"));
  const linkler = [...m.querySelectorAll("a")];
  const r = { genislik: innerWidth, ekranIcinde: b.left >= -1 && b.right <= innerWidth + 1 && b.top >= -1 && b.bottom <= innerHeight + 1,
    cekmeceGen: Math.round(b.width), madde: linkler.length,
    kesikAd: linkler.filter(a => { const s = a.querySelector(".a-menu-ad"); return s && s.scrollWidth > s.clientWidth + 1; }).length,
    kucukMadde: linkler.filter(a => a.getBoundingClientRect().height < tusY - 0.5).length,
    menuGorunur: Math.round(m.clientHeight), menuIcerik: Math.round(m.scrollHeight), yatayTasma: document.documentElement.scrollWidth - innerWidth };
  m.scrollTop = m.scrollHeight;
  const son = linkler[linkler.length - 1].getBoundingClientRect(), mb = m.getBoundingClientRect();
  r.sonMaddeAcilir = son.bottom <= mb.bottom + 1 && son.top >= mb.top - 1;
  m.scrollTop = 0;
  r.perde = getComputedStyle(document.querySelector(".a-perde")).opacity === "1";
  return r;
})()`;

async function adimlar(sayfa, liste) {
  for (const [ne, secici, metin] of liste || []) {
    if (ne === "tikla") await sayfa.evaluate(s => { const e = [...document.querySelectorAll(s)].find(x => x.getClientRects().length); if (!e) throw new Error("yok: " + s); if (e.focus) e.focus(); e.click(); }, secici);   /* gerçek tıklama gibi: önce odak */
    else if (ne === "yaz") await sayfa.evaluate((s, m) => { const e = document.querySelector(s); e.focus(); e.value = m; e.dispatchEvent(new Event("input", { bubbles: true })); }, secici, metin);
    else if (ne === "tus") await sayfa.keyboard.press(secici);
    else if (ne === "js") await sayfa.evaluate(secici);   /* sayfanın kendi verisinden değer gerektiren adım */
  }
}

async function ac(tar, taban, dosya, hash, gen, yuk, tema, adim) {
  const ctx = await tar.createBrowserContext();
  const s = await ctx.newPage();
  const hatalar = [];
  s.on("pageerror", e => hatalar.push(String(e.message || e)));
  s.on("console", m => { if (m.type() === "error") hatalar.push(m.text()); });
  s.on("requestfailed", r => hatalar.push("istek düştü: " + r.url()));
  s.on("response", r => { if (r.status() >= 400) hatalar.push(r.status() + " " + r.url()); });
  await s.setViewport({ width: gen, height: yuk, deviceScaleFactor: 1 });
  await s.goto(`${taban}/${dosya}?tema=${tema}${hash || ""}`, { waitUntil: "load" });
  await s.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
  await s.evaluate(() => document.fonts.ready);
  await adimlar(s, adim);
  return { s, ctx, hatalar };
}

const say = v => v === undefined || v === null ? null : Array.isArray(v) ? v.length : v;
function ozet(ad, gen, tema, r, hatalar) {
  return { ad, gen, tema, gorunum: r.gorunum, liste: r.listeKipi, pencere: r.pencere,
    tasma: r.yatayTasma, sertKirpma: say(r.sertKirpma), tasanMetin: say(r.tasanMetin), cakisma: r.cakisma, sonCakisma: say(r.sonCakisma),
    gizliEtkilesimli: say(r.gizliEtkilesimli), ekranDisi: r.ekranDisi, kucukHedef: say(r.kucukHedef), basliksizKirpma: say(r.ucNoktaBasliksiz),
    ipucuKesik: say(r.ipucuKesik), kenarFarki: r.kenarFarki, gorunenGizli: say(r.gorunenGizli), pencereKenar: say(r.pencereKenar),
    hizaKaymasi: r.hizaKaymasi, kartTutarsiz: r.kartTutarsiz, eksikIkon: say(r.eksikIkon), tusY: r.tusY, tusGen: r.tusGenislik, satirY: r.satirYukseklik,
    birincil: r.birincilSayisi ?? null, pencereGen: r.pencereGenislik ?? null, icerik: r.icerik, listeGen: r.liste, yaziTipi: r.yaziTipi,
    hata: hatalar.length, ayrinti: Object.fromEntries(["sertKirpma", "tasanMetin", "kucukHedef", "gizliEtkilesimli", "ucNoktaBasliksiz", "ipucuKesik", "gorunenGizli", "eksikIkon"].filter(k => Array.isArray(r[k]) && r[k].length).map(k => [k, r[k]])),
    hatalar };
}
const temizMi = d => SIFIR.every(k => d[k] === 0 || d[k] === null) && d.hata === 0 && d.yaziTipi === "Sora yüklü";

async function olc(ad, { goruntu, yazma }) {
  const t = DURUMLAR[ad]; if (!t) throw new Error("bilinmeyen maket: " + ad + " (" + Object.keys(DURUMLAR).join(", ") + ")");
  const sv = await sunucu(), taban = `http://127.0.0.1:${sv.kapi}`;
  const tar = await puppeteer.launch({ executablePath: tarayici(), headless: true, args: ["--no-sandbox", "--font-render-hinting=none"] });
  const surum = await tar.version();
  const durumlar = [], cekmece = [];
  try {
    for (const d of t.durumlar) for (const [gen, yuk] of GENISLIK) for (const tema of TEMA) {
      const { s, ctx, hatalar } = await ac(tar, taban, d.sayfa || t.sayfa, d.hash, gen, yuk, tema, d.adim);
      const r = await s.evaluate(OLC);
      const o = ozet(d.ad, gen, tema, r, hatalar); durumlar.push(o);
      const dosya = `${ad}-${String(durumlar.length).padStart(2, "0")}-${gen}-${tema}.png`;
      if (goruntu) await s.screenshot({ path: join(goruntu, dosya), fullPage: true });
      console.log(`${temizMi(o) ? "✓" : "✗"} ${gen} ${tema.padEnd(4)} ${d.ad}${temizMi(o) ? "" : "  → " + JSON.stringify(Object.fromEntries(Object.entries(o).filter(([k, v]) => (SIFIR.includes(k) && v) || (k === "hata" && v) || k === "ayrinti" && Object.keys(v).length || k === "hatalar" && v.length || (k === "yaziTipi" && v !== "Sora yüklü"))))}`);
      /* 1080'de çekmece AÇIK (yalnız ilk durumda: kabuk her sayfada aynı üreticiden) */
      if (gen === 1080 && d === t.durumlar.filter(x => !x.kabuksuz)[0]) {
        await s.click(".a-menu-tus");
        const c = await s.evaluate(CEKMECE); c.tema = tema; cekmece.push(c);
        if (goruntu) await s.screenshot({ path: join(goruntu, `${ad}-cekmece-${tema}.png`) });
        const iyi = c.ekranIcinde && !c.kesikAd && !c.kucukMadde && c.sonMaddeAcilir && c.perde && c.yatayTasma === 0;
        console.log(`${iyi ? "✓" : "✗"} 1080 ${tema.padEnd(4)} çekmece açık · ${c.madde} madde · menü ${c.menuGorunur}/${c.menuIcerik} px${iyi ? "" : " → " + JSON.stringify(c)}`);
      }
      await ctx.close();
    }
  } finally { await tar.close(); sv.kapat(); }
  const temiz = durumlar.filter(temizMi).length;
  const iyiCekmece = cekmece.filter(c => c.ekranIcinde && !c.kesikAd && !c.kucukMadde && c.sonMaddeAcilir && c.perde && c.yatayTasma === 0).length;
  const sonuc = { maket: ad, sayfa: t.sayfa, tarih: new Date().toISOString().slice(0, 10), arac: `başsız ${surum} · puppeteer-core · tools/olc-bulut.mjs + tools/olc-maket.js`,
    yontem: "python3 http.server (docs/), her durum × genişlik × tema taze yükleme ve ayrı oturum, geçişler kapalı; 1920×1080 · 1080×810 · 375×812 × açık/koyu; 1080'de çekmece açık ayrıca.",
    toplam: durumlar.length, temiz, cekmece: { toplam: cekmece.length, temiz: iyiCekmece, olcumler: cekmece },
    durumlar: durumlar.map(({ hatalar, ...x }) => ({ ...x, hatalar: hatalar.slice(0, 5) })) };
  if (!yazma) {
    mkdirSync(join(KOK, "docs/assets/olcum"), { recursive: true });
    writeFileSync(join(KOK, `docs/assets/olcum/${ad}.json`), JSON.stringify(sonuc, null, 1) + "\n");
  }
  console.log(`\n${ad}: ${temiz}/${durumlar.length} durum temiz · çekmece ${iyiCekmece}/${cekmece.length}`);
  return temiz === durumlar.length && iyiCekmece === cekmece.length;
}

async function etkilesim(ad, { yazma } = {}) {
  const t = DURUMLAR[ad], l = DENEMELER[ad] || [], sonuclar = [];
  const sv = await sunucu(), taban = `http://127.0.0.1:${sv.kapi}`;
  const tar = await puppeteer.launch({ executablePath: tarayici(), headless: true, args: ["--no-sandbox"] });
  let gecen = 0;
  try {
    for (const d of l) {
      const gen = d.gen || 1920, yuk = { 1920: 1080, 1080: 810, 375: 812 }[gen];
      let ok = false, hata = "";
      const { s, ctx, hatalar } = await ac(tar, taban, d.sayfa || t.sayfa, d.hash, gen, yuk, "acik", []).catch(e => ({ hatalar: [String(e)] }));
      /* adres değişimi (hashchange) eşzamansız: sonuç en çok 2 sn beklenir */
      try { await adimlar(s, d.adim); ok = !!(await s.waitForFunction(`(() => { try { return ${d.bekle}; } catch (x) { return false; } })()`, { timeout: 2000 }).catch(() => null)); } catch (e) { hata = String(e.message || e); }
      ok = ok && !hatalar.length;
      if (ok) gecen++;
      sonuclar.push({ ad: d.ad, gen, sayfa: d.sayfa || t.sayfa, hash: d.hash, gecti: ok, hata: ok ? undefined : (hata || hatalar.join(" | ") || "beklenen sonuç yok") });
      console.log(`${ok ? "✓" : "✗"} ${gen} ${d.ad}${ok ? "" : " → " + (hata || hatalar.join(" | ") || "beklenen sonuç yok")}`);
      if (ctx) await ctx.close();
    }
  } finally { await tar.close(); sv.kapat(); }
  /* 2026-09-24 (toplu bakış): sonuç dosyaya da yazılır — toplu bakış sayfası sayıyı buradan okur, elle yazılmaz */
  if (!yazma) {
    mkdirSync(join(KOK, "docs/assets/olcum"), { recursive: true });
    writeFileSync(join(KOK, `docs/assets/olcum/${ad}-etkilesim.json`), JSON.stringify({ maket: ad, tarih: new Date().toISOString().slice(0, 10),
      arac: "tools/olc-bulut.mjs --etkilesim (başsız tarayıcı, 1920 açık tema; gen verilen denemede o genişlik)", toplam: l.length, gecen, denemeler: sonuclar }, null, 1) + "\n");
  }
  console.log(`\n${ad}: etkileşim ${gecen}/${l.length}`);
  return gecen === l.length;
}

/* ── TELEFON (--telefon): gerçek telefon taklidi, sayfa yana kayıyor mu + 16 px altı yazı alanı ── */
const TELEFON_GEN = [320, 360, 390, 430];
const TELEFON_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const TELEFON_OLC = `(() => {
  const d = document.documentElement, W = d.clientWidth;
  const gor = e => { const b = e.getBoundingClientRect(), s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
  /* kırpan ata içinde kalan (yana kayan şerit, pencere) sayfayı taşırmaz; yalnız en dış taşan öğe yazılır */
  const kirpanAta = e => { for (let a = e.parentElement; a && a !== document.body && a !== d; a = a.parentElement) if (getComputedStyle(a).overflowX !== "visible") return a; return null; };
  const disari = [];
  for (const e of document.querySelectorAll("body *")) {
    if (!gor(e) || e.closest("dialog:not([open])")) continue;
    const b = e.getBoundingClientRect();
    if (b.right <= W + 1) continue;   /* sayfa yalnız SAĞA kayar; solda kalan (kapalı çekmece) kaydırma yaratmaz */
    const k = kirpanAta(e); if (k) { const kb = k.getBoundingClientRect(); if (kb.right <= W + 1) continue; }
    if (disari.some(x => x.el.contains(e))) continue;
    disari.push({ el: e, ad: e.tagName.toLowerCase() + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\\s+/).join(".") : ""), sag: Math.round(b.right - W) });
  }
  const alanlar = [...document.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea, select")].filter(gor);
  return { W, tasma: d.scrollWidth - W, disari: disari.map(({ el, ...x }) => x),
    kucukAlan: alanlar.filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).map(e => (e.id || e.name || e.className || e.tagName) + ":" + getComputedStyle(e).fontSize),
    alan: alanlar.length, dokunmatik: matchMedia("(pointer: coarse)").matches };
})()`;

async function telefonAc(tar, taban, dosya, hash, gen, adim) {
  const ctx = await tar.createBrowserContext(), s = await ctx.newPage();
  await s.emulate({ viewport: { width: gen, height: 800, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, userAgent: TELEFON_UA });
  await s.goto(`${taban}/${dosya}?tema=acik${hash || ""}`, { waitUntil: "load" });
  await s.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
  await s.evaluate(() => document.fonts.ready);
  await adimlar(s, adim);
  await new Promise(r => setTimeout(r, 60));
  return { s, ctx };
}

async function telefon(ad, { yazma } = {}) {
  const t = DURUMLAR[ad]; if (!t) throw new Error("bilinmeyen maket: " + ad);
  const sv = await sunucu(), taban = `http://127.0.0.1:${sv.kapi}`;
  const tar = await puppeteer.launch({ executablePath: tarayici(), headless: true, args: ["--no-sandbox"] });
  const sonuclar = [];
  try {
    for (const d of t.durumlar) for (const gen of TELEFON_GEN) {
      let r, hata;
      try { const { s, ctx } = await telefonAc(tar, taban, d.sayfa || t.sayfa, d.hash, gen, d.adim); r = await s.evaluate(TELEFON_OLC); await ctx.close(); }
      catch (e) { hata = String(e.message || e); }
      const temiz = !hata && r.dokunmatik && r.tasma <= 0 && !r.disari.length && !r.kucukAlan.length;
      sonuclar.push({ ad: d.ad, gen, temiz, ...(r || {}), hata });
      if (!temiz) console.log(`✗ ${gen} ${d.ad} → ${hata || `taşma ${r.tasma} · dışarı ${JSON.stringify(r.disari.slice(0, 3))} · 16 px altı alan ${JSON.stringify(r.kucukAlan)}${r.dokunmatik ? "" : " · dokunmatik taklidi tutmadı"}`}`);
    }
  } finally { await tar.close(); sv.kapat(); }
  const gecen = sonuclar.filter(x => x.temiz).length;
  if (!yazma) {
    mkdirSync(join(KOK, "docs/assets/olcum"), { recursive: true });
    writeFileSync(join(KOK, `docs/assets/olcum/${ad}-telefon.json`), JSON.stringify({ maket: ad, tarih: new Date().toISOString().slice(0, 10),
      arac: "tools/olc-bulut.mjs --telefon (başsız tarayıcı, telefon taklidi: dokunmatik, meta viewport, 3x; açık tema)", genislikler: TELEFON_GEN,
      toplam: sonuclar.length, temiz: gecen, durumlar: sonuclar.map(({ ad, gen, temiz, tasma, disari, kucukAlan, alan, hata }) => ({ ad, gen, temiz, tasma, disari, kucukAlan, alan, hata })) }, null, 1) + "\n");
  }
  console.log(`${ad}: telefon ${gecen}/${sonuclar.length} temiz`);
  return gecen === sonuclar.length;
}

/* OLUMSUZ KANIT: ölçüm gerçekten yakalıyor mu — bilerek bozulmuş sayfa bulgu vermeli */
async function olumsuz() {
  const sv = await sunucu(), taban = `http://127.0.0.1:${sv.kapi}`;
  const tar = await puppeteer.launch({ executablePath: tarayici(), headless: true, args: ["--no-sandbox"] });
  let gecti = true;
  try {
    for (const [gen, yuk] of [[1920, 1080], [375, 812]]) {
      const { s, ctx } = await ac(tar, taban, "maket/planlarim.html", "#/", gen, yuk, "acik");
      await s.evaluate(() => {
        const ic = document.querySelector(".a-icerik");
        const genis = document.createElement("div"); genis.style.cssText = "width:3000px;height:10px"; ic.appendChild(genis);
        const kirpik = document.createElement("div"); kirpik.style.cssText = "width:60px;overflow:hidden;white-space:nowrap"; kirpik.textContent = "Bilerek kırpılan uzun bir metin"; ic.appendChild(kirpik);
        const kucuk = document.createElement("button"); kucuk.textContent = "k"; kucuk.style.cssText = "height:12px"; ic.appendChild(kucuk);
        const ust = document.createElement("button"); ust.textContent = "üst"; ust.className = "a-tus";
        const t = document.querySelector(".a-ara input").getBoundingClientRect();
        ust.style.cssText = `position:absolute;left:${t.left + window.scrollX}px;top:${t.top + window.scrollY}px`; document.body.appendChild(ust);
        ic.insertAdjacentHTML("beforeend", '<svg class="a-ikon"><use href="../vendor/lucide-1.47.0/ikonlar.svg#i-olmayan-ikon"/></svg>');
      });
      const r = await s.evaluate(OLC);
      const bulgu = { tasma: r.yatayTasma, sertKirpma: r.sertKirpma.length, kucukHedef: r.kucukHedef.length, cakisma: r.cakisma, eksikIkon: r.eksikIkon.length };
      const hepsi = Object.values(bulgu).every(v => v > 0);
      gecti = gecti && hepsi;
      console.log(`${hepsi ? "✓" : "✗"} ${gen}: bozulmuş sayfada bulgu → ${JSON.stringify(bulgu)} (hepsi > 0 olmalı)`);
      await ctx.close();
    }
    /* telefon ölçümü: 320'de ekrandan geniş öğe ve 15 px yazı alanı eklenir → ikisi de yakalanmalı */
    const { s, ctx } = await telefonAc(tar, taban, "maket/planlarim.html", "#/", 320, []);
    await s.evaluate(() => {
      const ic = document.querySelector(".a-icerik");
      const genis = document.createElement("div"); genis.style.cssText = "width:340px;height:10px"; ic.appendChild(genis);
      const alan = document.createElement("input"); alan.style.cssText = "font-size:15px"; ic.appendChild(alan);
    });
    const r = await s.evaluate(TELEFON_OLC);
    const hepsi = r.dokunmatik && r.tasma > 0 && r.disari.length > 0 && r.kucukAlan.length > 0;
    gecti = gecti && hepsi;
    console.log(`${hepsi ? "✓" : "✗"} telefon 320: bozulmuş sayfada bulgu → ${JSON.stringify({ dokunmatik: r.dokunmatik, tasma: r.tasma, disari: r.disari.length, kucukAlan: r.kucukAlan.length })} (hepsi > 0 olmalı)`);
    await ctx.close();
  } finally { await tar.close(); sv.kapat(); }
  return gecti;
}

const arg = process.argv.slice(2);
const secenek = { goruntu: null, yazma: arg.includes("--yazma") };
const gi = arg.indexOf("--goruntu"); if (gi >= 0) { secenek.goruntu = arg[gi + 1]; mkdirSync(secenek.goruntu, { recursive: true }); }
const adlar = arg.filter((a, i) => !a.startsWith("--") && arg[i - 1] !== "--goruntu");
let tamam = true;
if (arg.includes("--olumsuz")) tamam = await olumsuz();
for (const ad of adlar) tamam = (arg.includes("--etkilesim") ? await etkilesim(ad, secenek) : arg.includes("--telefon") ? await telefon(ad, secenek) : await olc(ad, secenek)) && tamam;
process.exit(tamam ? 0 : 1);
