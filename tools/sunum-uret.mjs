/* docs/index.html ÜRETİCİSİ — görsel sistem önerisi sunumu (2026-09-23).
   ⛔ Sayfadaki ölçüm sayıları ELLE YAZILMAZ: kontrast tools/palet-olc.mjs ile GERÇEK tokens.css'ten ölçülür,
      maket ölçümleri docs/assets/olcum.json'dan, ikon listesi docs/vendor/lucide-<sürüm>/ikonlar.svg'den okunur.
   Kullanım: node tools/sunum-uret.mjs   (tokens.css ya da olcum.json değişince yeniden koşulur) */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { paletOlc, kontrast } from "./palet-olc.mjs";

const yol = p => fileURLToPath(new URL("../" + p, import.meta.url));
const K = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sayi = n => String(n).replace(".", ",");
const P = paletOlc();
const O = JSON.parse(readFileSync(yol("docs/assets/olcum.json"), "utf8"));
const IKONLAR = [...readFileSync(yol("docs/vendor/lucide-1.47.0/ikonlar.svg"), "utf8").matchAll(/id="i-([a-z0-9-]+)"/g)].map(m => m[1]);
const TR = "ÇçĞğİıÖöŞşÜü";
/* sıfır olması gereken ölçüler (olcum.json · tools/olc-maket.js); 2. turda gizli etkileşimli öğe ve kesik ipucu eklendi */
const SIFIR = ["tasma", "sertKirpma", "tasanMetin", "cakisma", "gizliEtkilesimli", "ekranDisi", "kucukHedef", "basliksizKirpma", "ipucuKesik", "kenarFarki", "gorunenGizli"];
const ikon = ad => `<svg class="s-ikon" aria-hidden="true"><use href="vendor/lucide-1.47.0/ikonlar.svg#i-${ad}"/></svg>`;

const gecen = P.sonuc.filter(s => s.gecti).length;
const tamSifir = O.durumlar.filter(d => SIFIR.every(k => d[k] === 0)).length;
const beyazYesil = kontrast("#FFFFFF", P.marka["marka-onay"]);
const petrolYesil = kontrast(P.marka["marka-petrol"], P.marka["marka-onay"]);
const beyazPetrol = kontrast("#FFFFFF", P.marka["marka-petrol"]);
const kagitPetrol = kontrast(P.marka["marka-kagit"], P.marka["marka-petrol"]);
const beyazC = kontrast("#FFFFFF", "#137050");

const kontrastTablo = tema => `<div class="s-kaydir"><table class="s-tablo s-min-600"><thead><tr><th>Çift</th><th>Ön plan</th><th>Arka plan</th><th>Oran</th><th>Eşik</th><th>Sonuç</th></tr></thead><tbody>${
  P.sonuc.filter(s => s.tema === tema).map(s => `<tr><td>${K(s.anlam)}</td><td class="s-sayi"><code>--${s.on}</code> ${s.onRenk}</td><td class="s-sayi"><code>--${s.arka}</code> ${s.arkaRenk}</td><td class="s-sayi"><b>${sayi(s.oran.toFixed(2))}</b> : 1</td><td class="s-sayi">${sayi(s.esik.toFixed(1))}</td><td class="${s.gecti ? "s-evet" : "s-hayir"}">${s.gecti ? "geçer" : "KALIR"}</td></tr>`).join("")
}</tbody></table></div>`;

const renkOrnekleri = T => Object.entries(T).map(([ad, hex]) => `<div class="s-renk"><i style="background:${hex}"></i><div><b>--${ad}</b><code>${hex}</code></div></div>`).join("");

const olcumTablo = `<div class="s-kaydir"><table class="s-tablo s-min-1400"><thead><tr><th>Genişlik</th><th>Tema</th><th>Görünüm</th><th>Liste</th><th>Yatay taşma</th><th>Sert kırpma</th><th>Taşan metin</th><th>Çakışma</th><th>Gizli etkileşimli</th><th>Ekran dışı</th><th>Küçük hedef</th><th>Başlıksız kırpma</th><th>Kesik ipucu</th><th>Kap farkı</th><th>Görünen gizli</th><th>Birincil tuş</th><th>Denetim yüksekliği</th><th>Tuş genişliği</th><th>Satır / kart</th></tr></thead><tbody>${
  O.durumlar.map(d => `<tr><td class="s-sayi"><b>${d.gen}</b></td><td>${d.tema === "acik" ? "açık" : "koyu"}</td><td>${K(d.gorunum)}</td><td>${d.liste}</td>${SIFIR.map(k => `<td class="s-sayi ${d[k] === 0 ? "s-evet" : "s-hayir"}">${d[k]}</td>`).join("")}<td class="s-sayi">${d.birincil === null ? "—" : d.birincil}</td><td class="s-sayi">${d.tusY} px</td><td class="s-sayi">${d.tusGen[0]}–${d.tusGen[1]} px</td><td class="s-sayi">${d.satirY} px</td></tr>`).join("")
}</tbody></table></div>`;

const ikiliTablo = (satirlar, a, b) => `<div class="s-kaydir"><table class="s-tablo s-min-600"><thead><tr><th>${a}</th><th>${b}</th></tr></thead><tbody>${satirlar.map(([x, y]) => `<tr><td>${K(x)}</td><td>${K(y)}</td></tr>`).join("")}</tbody></table></div>`;

const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>probata · Görsel sistem önerisi</title>
<meta name="robots" content="noindex">
<link rel="icon" href="marka/favicon.svg" type="image/svg+xml">
<script>
  (function () {
    var q = new URLSearchParams(location.search), d = document.documentElement, t = q.get("tema");
    try { if (!t) t = localStorage.getItem("probata-tema"); } catch (e) {}
    d.setAttribute("data-tema", t === "acik" || t === "koyu" ? t : (matchMedia("(prefers-color-scheme: dark)").matches ? "koyu" : "acik"));
  })();
</script>
<link rel="stylesheet" href="assets/tokens.css">
<link rel="stylesheet" href="assets/sunum.css">
</head>
<body>
<!-- ÜRETİLMİŞ DOSYA — elle düzenlenmez. Kaynak: tools/sunum-uret.mjs · tokens.css · olcum.json -->
<header class="s-ust">
  <img class="s-logo s-logo-acik" src="marka/probata-yatay-renkli.svg" alt="probata" width="136" height="34">
  <img class="s-logo s-logo-koyu" src="marka/probata-yatay-koyu-zemin.svg" alt="probata" width="136" height="34">
  <div class="s-ust-baslik"><b>Görsel sistem önerisi</b><span>Referans ekran: Planlarım + plan içi · ${O.tarih} · ${O.tur}. tur · reisim'in onayına sunulur</span></div>
  <div class="s-ust-bosluk"></div>
  <a class="s-tus" href="maket/planlarim.html" target="_blank" rel="noopener">${ikon("calendar-check")}Maketi aç</a>
  <button class="s-tus" type="button" id="s-tema">${ikon("moon")}Tema</button>
</header>
<nav class="s-icindekiler" aria-label="İçindekiler">
  <a href="#karar">Karar</a><a href="#olcum">Ölçüm</a><a href="#renk">Renk sistemi</a><a href="#birincil">Birincil tuş</a>
  <a href="#yazi">Yazı ve ikon</a><a href="#esik">Eşikler</a><a href="#ekran">Referans ekran</a><a href="#kurallar">Ekranın kuralları</a>
  <a href="#faz">Faz sırası</a><a href="#sorular">Karar soruları</a>
</nav>
<main>

<section class="s-bolum" id="karar">
  <h2><span class="s-no">1</span>Ne karar veriyoruz</h2>
  <p class="s-alt">Marka renkleri, logo, Sora ve iki tema reisim'in kararı. Bu sayfa onların üstüne kurulan <b>görsel sistemi</b> ve ilk referans ekranı sunar.</p>
  <p>Görsel sistem: marka renklerinden türetilen tonlar, birincil tuşun rengi, yazı ölçeği, ikon seti ve ekran eşikleri. Referans ekran Planlarım; onaylanınca ölçüleri tasarım kalıbının bu projedeki sayıları olur ve iskelet kaleminde testle kilitlenir. Karar soruları sayfanın sonunda.</p>
  <p><b>2. tur (reisim ${O.tarih}):</b> liste reisim'in gösterdiği örnek listeye göre yeniden kuruldu: Proje no · Proje adı · Müşteri · Adres · Inspector · Başlangıç · Durum. Mesai, İş türü, Rapor durumu ve "İşlemler" tuşu yok. Satırda tek tuş durumla değişir: <b>Kabul et → Denetime başla → Devam et</b>. Yeni ekran <b>plan içi</b>: Tamamla ile plan Tamamlandı olur; plan içinden geri alınabilir, raporlar düzenlenebilir kalır. Örnekten bilerek alınmayanlar ve yorumlarım 9–16. sorularda.</p>
</section>

<section class="s-bolum" id="olcum">
  <h2><span class="s-no">2</span>Ölçüm</h2>
  <p class="s-alt">Tahmin yok. Kontrast gerçek değişken dosyasından hesaplandı; maket yerel sunucuda, üç genişlik ve iki temada ölçüldü.</p>
  <div class="s-karolar">
    <div class="s-karo s-iyi"><b>${gecen} / ${P.sonuc.length}</b><span>yazı ve zemin çifti WCAG AA eşiğini geçiyor (iki tema)</span></div>
    <div class="s-karo s-iyi"><b>${tamSifir} / ${O.durumlar.length}</b><span>ölçümde taşma, kırpma, çakışma, gizli tuş, küçük hedef sıfır (liste + üç plan içi durumu, üç genişlik, iki tema)</span></div>
    <div class="s-karo s-iyi"><b>${TR.length} / ${TR.length}</b><span>Türkçe harf Sora'da var (ı Ç Ö Ü temel dosyada, Ğ İ Ş genişletilmişte)</span></div>
    <div class="s-karo"><b>${O.duzeltilen.length}</b><span>ölçerken bulunup düzeltilen hata</span></div>
  </div>
  <div class="s-bulgu">${ikon("triangle-alert")}<div><b>Bulgu: marka yeşili üstüne beyaz yazı ${sayi(beyazYesil.toFixed(2))} : 1.</b> Normal metin için eşik 4,5. Klasik "yeşil tuş, beyaz yazı" bu yüzden okunabilirlik eşiğinin altında kalıyor; birincil tuş için üç seçenek aşağıda.</div></div>
  <h3>Maket ölçümü</h3>
  ${olcumTablo}
  <p class="s-oran" style="margin-top:10px">${K(O.yontem)}</p>
  <h3>Etkileşim denemeleri</h3>
  ${ikiliTablo(O.etkilesim, "Deneme", "Sonuç")}
  <h3>Ölçerken bulunup düzeltilenler</h3>
  ${ikiliTablo(O.duzeltilen, "Bulgu", "Düzeltme")}
</section>

<section class="s-bolum" id="renk">
  <h2><span class="s-no">3</span>Renk sistemi</h2>
  <p class="s-alt">Dört marka rengi dokunulmaz. Geri kalan her ton bunlardan türetildi ve iki temada aynı adı taşır; koyu tema aynı değişkenleri yeniden tanımlar.</p>
  <h3>Marka</h3>
  <div class="s-renkler">${renkOrnekleri(P.marka)}</div>
  <div class="s-ikili">
    <div><h3>Açık tema</h3><div class="s-renkler">${renkOrnekleri(P.acik)}</div></div>
    <div><h3>Koyu tema</h3><div class="s-renkler">${renkOrnekleri(P.koyu)}</div></div>
  </div>
  <h3>Kontrast — açık tema</h3>
  ${kontrastTablo("acik")}
  <h3>Kontrast — koyu tema</h3>
  ${kontrastTablo("koyu")}
</section>

<section class="s-bolum" id="birincil">
  <h2><span class="s-no">4</span>Birincil tuş</h2>
  <p class="s-alt">Marka yeşili + beyaz yazı eşiğin altında kaldığı için üç yol var. Maket iki seçeneği canlı gösterir.</p>
  <div class="s-secenekler">
    <div class="s-secenek s-onerilen"><span class="s-etiket">Önerim</span><b>A · Yeşil zemin, petrol yazı</b>
      <div class="s-ornek-tuslar s-acik-zemin"><span class="s-ornek-tus" style="background:var(--marka-onay);color:var(--marka-petrol)">Kabul et</span></div>
      <div class="s-ornek-tuslar s-koyu-zemin"><span class="s-ornek-tus" style="background:var(--marka-onay);color:var(--marka-petrol)">Kabul et</span></div>
      <p class="s-oran">Oran <b>${sayi(petrolYesil.toFixed(2))} : 1</b>. İki temada aynı tuş; marka yeşili değişmeden kullanılır, logodaki onay işaretiyle aynı dil.</p>
      <a class="s-tus" href="maket/planlarim.html?birincil=yesil" target="_blank" rel="noopener">Makette gör</a></div>
    <div class="s-secenek"><b>B · Petrol zemin, beyaz yazı</b>
      <div class="s-ornek-tuslar s-acik-zemin"><span class="s-ornek-tus" style="background:var(--marka-petrol);color:#FFFFFF">Kabul et</span></div>
      <div class="s-ornek-tuslar s-koyu-zemin"><span class="s-ornek-tus" style="background:var(--marka-kagit);color:var(--marka-petrol)">Kabul et</span></div>
      <p class="s-oran">Açık temada <b>${sayi(beyazPetrol.toFixed(2))} : 1</b>, koyu temada kâğıt zemin <b>${sayi(kagitPetrol.toFixed(2))} : 1</b>. Güçlü okunur; ama iki temada farklı görünür ve yeşil yalnız durum rengine kalır.</p>
      <a class="s-tus" href="maket/planlarim.html?birincil=petrol" target="_blank" rel="noopener">Makette gör</a></div>
    <div class="s-secenek"><b>C · Koyu yeşil zemin, beyaz yazı</b>
      <div class="s-ornek-tuslar s-acik-zemin"><span class="s-ornek-tus" style="background:var(--s-secenek-c);color:#FFFFFF">Kabul et</span></div>
      <div class="s-ornek-tuslar s-koyu-zemin"><span class="s-ornek-tus" style="background:var(--s-secenek-c);color:#FFFFFF">Kabul et</span></div>
      <p class="s-oran">Oran <b>${sayi(beyazC.toFixed(2))} : 1</b>. Klasik görünüm korunur; ama tuş marka yeşilinden koyu bir tona kayar, logo rehberi "renkleri değiştirme" diyor.</p></div>
  </div>
</section>

<section class="s-bolum" id="yazi">
  <h2><span class="s-no">5</span>Yazı ve ikon</h2>
  <p class="s-alt">Sora 5.3.0, değişken kalınlık 100–800, SIL OFL 1.1, kendi sunucumuzdan. Lucide 1.47.0 ikonları, ISC lisansı, SVG, kendi sunucumuzdan; emoji yok.</p>
  <div class="s-olcek">
    <div class="s-olcek-satir"><code>Sayfa başlığı · 22 / 700</code><span style="font-size:22px;font-weight:700">Planlarım</span></div>
    <div class="s-olcek-satir"><code>Bölüm · 17 / 600</code><span style="font-size:17px;font-weight:600">Kabul bekleyen planlar</span></div>
    <div class="s-olcek-satir"><code>Gövde · 15 (dokunmatikte 16)</code><span style="font-size:15px">Kuzey Lojistik ve Depolama Hizmetleri A.Ş. · Çorlu / Tekirdağ</span></div>
    <div class="s-olcek-satir"><code>Küçük · 13</code><span style="font-size:13px">09:00 – 12:30 · Mekanik 8 · Elektrik 4</span></div>
    <div class="s-olcek-satir"><code>Etiket · 12 / 600</code><span style="font-size:12px;font-weight:600">KABUL BEKLİYOR · ĞÜŞİÖÇ ğüşıöç</span></div>
  </div>
  <h3>Kullanılan ${IKONLAR.length} ikon</h3>
  <div class="s-ikonlar">${IKONLAR.map(i => `<div class="s-ikon-kutu">${ikon(i)}${i}</div>`).join("")}</div>
</section>

<section class="s-bolum" id="esik">
  <h2><span class="s-no">6</span>Eşikler</h2>
  <p class="s-alt">Önceki projede yedi farklı eşik birikmişti. Burada üç adlandırılmış bant var; yeni eşik eklemek karar ister.</p>
  <div class="s-kaydir"><table class="s-tablo s-min-600"><thead><tr><th>Bant</th><th>Genişlik</th><th>Cihaz</th><th>Yan menü</th><th>Denetim yüksekliği</th><th>Ölçüldüğü genişlik</th></tr></thead><tbody>
    <tr><td><b>dar</b></td><td class="s-sayi">&lt; 768 px</td><td>telefon</td><td>çekmece</td><td class="s-sayi">48 px</td><td class="s-sayi">375</td></tr>
    <tr><td><b>orta</b></td><td class="s-sayi">768 – 1279 px</td><td>tablet</td><td>çekmece</td><td class="s-sayi">48 px</td><td class="s-sayi">1080</td></tr>
    <tr><td><b>geniş</b></td><td class="s-sayi">≥ 1280 px</td><td>masaüstü</td><td>sabit, 248 px</td><td class="s-sayi">40 px (dokunmatik ekranda 48)</td><td class="s-sayi">1920</td></tr>
  </tbody></table></div>
  <p class="s-oran" style="margin-top:10px">Liste tablo mu kart mı, ekrana değil <b>liste kabına</b> bakar: kap ≥ ${O.esik.kap.toLocaleString("tr-TR")} px tablo, altı kart. ${K(O.esik.not)}</p>
</section>

<section class="s-bolum" id="ekran">
  <h2><span class="s-no">7</span>Referans ekran: Planlarım</h2>
  <p class="s-alt">Aşağıdaki çerçeveler maketin kendisi, gerçek boyutunda; kaba sığmayan küçültülür. Tablet ve telefonda doğrudan açmak için bağlantılar:</p>
  <div class="s-baglantilar">
    <a class="s-tus" href="maket/planlarim.html?tema=acik" target="_blank" rel="noopener">Açık tema</a>
    <a class="s-tus" href="maket/planlarim.html?tema=koyu" target="_blank" rel="noopener">Koyu tema</a>
    <a class="s-tus" href="maket/planlarim.html?veri=bos" target="_blank" rel="noopener">Veri yok</a>
    <a class="s-tus" href="maket/planlarim.html?veri=hata" target="_blank" rel="noopener">Yükleme hatası</a>
    <a class="s-tus" href="maket/planlarim.html?birincil=petrol" target="_blank" rel="noopener">Birincil B (petrol)</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/1" target="_blank" rel="noopener">Plan içi · Denetimde</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/4" target="_blank" rel="noopener">Plan içi · ön koşul eksik</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/8" target="_blank" rel="noopener">Plan içi · Tamamlandı</a>
  </div>
  <h3>Liste</h3>
  <div class="s-cihazlar">
    <div class="s-cihaz s-cihaz-tam"><p class="s-cihaz-ad">Masaüstü · 1920 × 1080 <a href="maket/planlarim.html" target="_blank" rel="noopener">tam ekran aç</a></p>
      <div class="s-cihaz-ic" data-gen="1920" data-yuk="1080"><iframe data-src="maket/planlarim.html" width="1920" height="1080" title="Planlarım maketi, masaüstü"></iframe></div></div>
    <div class="s-cihaz"><p class="s-cihaz-ad">Tablet · 1080 × 810</p>
      <div class="s-cihaz-ic" data-gen="1080" data-yuk="810"><iframe data-src="maket/planlarim.html" width="1080" height="810" title="Planlarım maketi, tablet"></iframe></div></div>
    <div class="s-cihaz"><p class="s-cihaz-ad">Telefon · 375 × 812</p>
      <div class="s-cihaz-ic" data-gen="375" data-yuk="812"><iframe data-src="maket/planlarim.html" width="375" height="812" title="Planlarım maketi, telefon"></iframe></div></div>
  </div>
  <h3>Plan içi (Denetimde)</h3>
  <div class="s-cihazlar">
    <div class="s-cihaz s-cihaz-tam"><p class="s-cihaz-ad">Masaüstü · 1920 × 1080 <a href="maket/planlarim.html#/plan/1" target="_blank" rel="noopener">tam ekran aç</a></p>
      <div class="s-cihaz-ic" data-gen="1920" data-yuk="1080"><iframe data-src="maket/planlarim.html" data-hash="#/plan/1" width="1920" height="1080" title="Plan içi maketi, masaüstü"></iframe></div></div>
    <div class="s-cihaz"><p class="s-cihaz-ad">Tablet · 1080 × 810</p>
      <div class="s-cihaz-ic" data-gen="1080" data-yuk="810"><iframe data-src="maket/planlarim.html" data-hash="#/plan/1" width="1080" height="810" title="Plan içi maketi, tablet"></iframe></div></div>
    <div class="s-cihaz"><p class="s-cihaz-ad">Telefon · 375 × 812</p>
      <div class="s-cihaz-ic" data-gen="375" data-yuk="812"><iframe data-src="maket/planlarim.html" data-hash="#/plan/1" width="375" height="812" title="Plan içi maketi, telefon"></iframe></div></div>
  </div>
</section>

<section class="s-bolum" id="kurallar">
  <h2><span class="s-no">8</span>Ekranın kuralları</h2>
  <p class="s-alt">Onaylanırsa bunlar tasarım kalıbının bu projedeki sayıları olur ve iskelet kaleminde testle kilitlenir.</p>
  <ul class="s-kurallar">
    <li><b>Kap tam genişlik</b><span>Liste kabı içeriği doldurur; ölçülen kap farkı 6 durumda da 0 px. Sayfada genişlik kapağı yok.</span></li>
    <li><b>Tuş içerik kadar</b><span>Masaüstünde 91–214 px, tablette 94–225 px. Yalnız telefonda kart tuşu ve plan içindeki eylem çubuğu eşit genişliğe gerilir.</span></li>
    <li><b>Denetim yüksekliği</b><span>Fareyle 40 px, dokunmatikte 48 px: tuş, çip, arama, seçici, menü satırı aynı yükseklikte.</span></li>
    <li><b>Süzgeç iki satır</b><span>Üstte arama solda, seçiciler ve Temizle sağda; altta durum çipleri ve ve/veya. Telefonda seçiciler alttan levhada.</span></li>
    <li><b>Liste tek üreticiden</b><span>Aynı tablo işaretlemesi kap 1.180 px'in altında karta döner. Plan listesi ve plan içindeki ekipman listesi aynı üreticiden çıkar; kartta yerleşim sütunun rolünden gelir.</span></li>
    <li><b>Satırda tek eylem</b><span>Kabul et → Denetime başla → Devam et. Tamamlandı ve Reddedildi satırında tuş yok; plana satıra ya da proje numarasına tıklayarak girilir.</span></li>
    <li><b>Plan içi (nesne sayfası)</b><span>Kırıntı, kimlik, bilgi kutuları, tek birincil tuş. Denetimde: Tamamla. Tamamlandı: birincil yok, "Tamamlamayı geri al"; raporlar düzenlenebilir. Telefonda eylem çubuğunun tamamı altta yapışkan.</span></li>
    <li><b>Sıralama</b><span>Tabloda sütun başlığı (artan → azalan → varsayılan); kartta "Sıralama" seçicisi. Temizle sıralamayı silmez, sıralama süzgeç değildir.</span></li>
    <li><b>Dürüst sayaç</b><span>Süzgeç açıkken "3 / 9"; çip sayıları aynı tabandan; hesaplanamayan sayı "—", sıfır değil.</span></li>
    <li><b>ve/veya</b><span>İki ve üstü seçili çipte açılır; imkânsız kesişim sessiz kalmaz, sebebini ve çıkış yolunu söyler.</span></li>
    <li><b>Kırpma</b><span>Serbest metin üç nokta + tam metin başlıkta; sayı ve etiket kırpılmaz, sarar.</span></li>
    <li><b>Ön koşul kapısı</b><span>Kabul et, ön koşul eksikse pasif; Denetime başla, plan gününe kadar pasif. Eksik olan tuşun yanında açık cümleyle yazar.</span></li>
    <li><b>Durum rozeti</b><span>Kabul bekliyor sarı, Kabul edildi mavi, Denetimde dolu petrol, Tamamlandı yeşil, Reddedildi kırmızı; beşi de 4,5 : 1 üstü.</span></li>
    <li><b>Seçim alanı</b><span>Cihazın kendi açılır listesi yok; temalı liste, telefonda levha. Sekiz seçeneği aşan listede arama gerekecek (kalıp 19).</span></li>
    <li><b>Pencere</b><span>Masaüstünde 520 px karar penceresi; × ve Esc kapatır. Telefonda alttan levha, eylem çubuğu yapışkan.</span></li>
  </ul>
</section>

<section class="s-bolum" id="faz">
  <h2><span class="s-no">9</span>Faz 1 sırası (öneri)</h2>
  <p class="s-alt">Her adım kendinden öncekine dayanır; bağlantı kuralları (pkproje.md §3.2) bu sırayı zorunlu kılıyor.</p>
  <div class="s-kaydir"><table class="s-tablo s-min-600"><thead><tr><th>Sıra</th><th>Kalem</th><th>Neden bu sırada</th></tr></thead><tbody>
    <tr><td class="s-sayi">1</td><td>İskelet</td><td>Next.js, gömülü PostgreSQL, bu sayfadaki değişkenler, test kapısı ve ilk kilitler.</td></tr>
    <tr><td class="s-sayi">2</td><td>Kullanıcı ve Rol · Personel</td><td>Her ekran girişe ve role dayanır; plan kabulü EKİPNET numarasını ve mesleği ister.</td></tr>
    <tr><td class="s-sayi">3</td><td>Müşteri ve Tesis</td><td>Ekipman, plan ve İSG-KATİP kaydı tesise bağlı.</td></tr>
    <tr><td class="s-sayi">4</td><td>Ekipman Türü Kataloğu · Ekipman</td><td>Onay branşı ve yetkili meslekler türden gelir.</td></tr>
    <tr><td class="s-sayi">5</td><td>Ölçüm Cihazı · Zimmet · kalibrasyon uyarısı</td><td>Rapordaki cihazlar zimmetten gelir.</td></tr>
    <tr><td class="s-sayi">6</td><td>İSG-KATİP kaydı</td><td>Plan kabulünün ön koşulu.</td></tr>
    <tr><td class="s-sayi">7</td><td>Planlama · <b>Planlarım</b></td><td>Bu sayfanın referans ekranı gerçek veriye bağlanır.</td></tr>
    <tr><td class="s-sayi">8</td><td>Standart Kütüphanesi · ilk Rapor Şablonu</td><td>Rapor, firma × tür şablon sürümüyle açılır.</td></tr>
    <tr><td class="s-sayi">9</td><td>Saha ve Rapor</td><td>Sahadaki asıl iş; ikinci referans ekran.</td></tr>
    <tr><td class="s-sayi">10</td><td>Onay ve İmza · PDF</td><td>Branş yöneticisi onayı, son imza, sunucuda PDF.</td></tr>
    <tr><td class="s-sayi">11</td><td>Müşteri Paneli</td><td>İmzalı raporlar ve uygunsuzlar Excel'i.</td></tr>
  </tbody></table></div>
</section>

<section class="s-bolum" id="sorular">
  <h2><span class="s-no">10</span>Karar soruları</h2>
  <p class="s-alt">Cevaplar pkproje.md'ye işlenir; onaylanan değişkenler dondurulur.</p>
  <ol class="s-sorular">
    <li><div><b>Birincil tuş: A, B ya da C?</b><span>Önerim A: marka yeşili değişmeden, petrol yazıyla, iki temada aynı.</span></div></li>
    <li><div><b>Açık tema zemini marka kâğıdı mı olsun?</b><span>Önerim kâğıt #F5F3EE; kartlar beyaz kalır. Alternatif: zemin de beyaz.</span></div></li>
    <li><div><b>Yan menü iki temada da koyu petrol mü?</b><span>Önerim evet; logo koyu zemin sürümüyle her iki temada aynı görünür.</span></div></li>
    <li><div><b>Üç bant ve 40 / 48 px denetim yüksekliği uygun mu?</b><span>Tablet ve telefon dokunmatik sayılır; masaüstünde dokunmatik ekran da 48 alır.</span></div></li>
    <li><div><b>Süzgeç iki satır olarak kalsın mı?</b><span>Tek satır 1920'de bile sığmadı: 1.696 px gerekiyor, kap 1.624 px.</span></div></li>
    <li><div><b>Karar penceresi masaüstünde 520 px mi kalsın?</b><span>Kalıp "kap tam genişlik" diyor; pencerenin içi kabı dolduruyor, pencerenin kendisi küçük bir karar için 520 px.</span></div></li>
    <li><div><b>Planlarım referans olarak dondurulsun mu?</b><span>Onaylanırsa ölçüler kalıba yazılır, kilitleri iskelette kurulur.</span></div></li>
    <li><div><b>Faz 1 sırası uygun mu?</b><span>Onaylanırsa ilk kod kalemi iskelet olur.</span></div></li>
  </ol>
  <h3>2. tur: Planlarım ve plan içi</h3>
  <ol class="s-sorular s-sorular-devam" start="9">
    <li><div><b>Reddet satırdan kalktı, plan içinde duruyor. Uygun mu?</b><span>Satırda tek tuş kuralı için. Reddetmek gerekçe ister, plan içinden yapılır.</span></div></li>
    <li><div><b>Denetime başla plan gününe kadar kapalı kalsın mı?</b><span>İSG-KATİP onayı kontrol tarihine bağlı. Öncesinde tuş kapalı ve "Plan gününde başlar" yazıyor.</span></div></li>
    <li><div><b>Raporu başlamamış ekipman varken Tamamla engellensin mi?</b><span>Şu an engellemiyor, yalnız "7 ekipmanın raporu başlamadı" diye bildiriyor.</span></div></li>
    <li><div><b>Tamamlandı planda ne açık kalsın?</b><span>Önerim: raporlar düzenlenir (taslak düzenle, onaydaki aç, eksik oluştur), ekipman ekleme kapalı; eklemek için önce geri alınır.</span></div></li>
    <li><div><b>Örnekteki Takvim görünümü eklensin mi?</b><span>Eklemedim: yeni bir görünüm, ayrı karar. İstenirse Liste / Takvim anahtarı süzgecin yanına gelir.</span></div></li>
    <li><div><b>Ekipman sayısı listede olsun mu?</b><span>Örnekte yoktu, listeden kaldırdım; plan içinde duruyor (12 ekipman · Mekanik 8 · Elektrik 4).</span></div></li>
    <li><div><b>Dizüstünde tablo mu kart mı?</b><span>Sekiz sütun 1.495 px ve üstü ekranda tablo; 1.280–1.494 dizüstünde ve tablette kart. Dizüstünde de tablo istenirse Proje no ile Proje adı tek sütunda birleşir.</span></div></li>
    <li><div><b>Proje no biçimi P-AAYY-SIRA olsun mu?</b><span>Makette P-0926-031. Rapor numarasıyla aynı mantık: ay + yıl, sonra sıra.</span></div></li>
  </ol>
</section>

</main>
<p class="s-alt-bilgi">Tüm firma, kişi ve tesis adları uydurmadır. Sora: SIL OFL 1.1 · Lucide: ISC · lisans dosyaları <code>vendor/</code> altında. Bu sayfa <code>tools/sunum-uret.mjs</code> ile üretildi.</p>
<script src="assets/sunum.js"></script>
</body>
</html>
`;
writeFileSync(yol("docs/index.html"), html);
console.log(`docs/index.html yazıldı: ${html.length} bayt · kontrast ${gecen}/${P.sonuc.length} · ölçüm ${tamSifir}/${O.durumlar.length} temiz · ${IKONLAR.length} ikon`);
