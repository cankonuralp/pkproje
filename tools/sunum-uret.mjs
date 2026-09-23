/* SUNUM ÜRETİCİSİ — iki sayfa (2026-09-23, 3. tur):
     docs/index.html     görsel sistem (reisim'in 1–8 kararları işlenmiş hâli)
     docs/plan-ici.html  Planlarım + plan içi: ekipmanlar, raporlar, numara sistemi (3. tur sunumu)
   ⛔ Sayfadaki ölçüm sayıları ELLE YAZILMAZ: kontrast tools/palet-olc.mjs ile GERÇEK tokens.css'ten ölçülür,
      maket ölçümleri docs/assets/olcum.json'dan, ikon listesi docs/vendor/lucide-<sürüm>/ikonlar.svg'den okunur.
   ⛔ Depo herkese açık: emsal uygulamanın adı ve çözümlemesi buraya yazılmaz (pkproje.md §6); yalnız bizim kararlarımız.
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
const ikon = ad => `<svg class="s-ikon" aria-hidden="true"><use href="vendor/lucide-1.47.0/ikonlar.svg#i-${ad}"/></svg>`;
/* sıfır olması gereken ölçüler (olcum.json · tools/olc-maket.js). null = o durumda ölçülmez (ör. pencere kapalı) */
const SIFIR = ["tasma", "sertKirpma", "tasanMetin", "cakisma", "sonCakisma", "gizliEtkilesimli", "ekranDisi", "kucukHedef", "basliksizKirpma", "ipucuKesik", "kenarFarki", "gorunenGizli", "pencereKenar"];
const SIFIR_AD = ["Yatay taşma", "Sert kırpma", "Taşan metin", "Çakışma", "Sonda çakışma", "Gizli tuş", "Ekran dışı", "Küçük hedef", "Başlıksız kırpma", "Kesik ipucu", "Kap farkı", "Görünen gizli", "Pencere kenarı"];

const gecen = P.sonuc.filter(s => s.gecti).length;
const tamSifir = O.durumlar.filter(d => SIFIR.every(k => d[k] === 0 || d[k] === null)).length;
const beyazYesil = kontrast("#FFFFFF", P.marka["marka-onay"]);
const petrolYesil = kontrast(P.marka["marka-petrol"], P.marka["marka-onay"]);
const beyazPetrol = kontrast("#FFFFFF", P.marka["marka-petrol"]);
const beyazC = kontrast("#FFFFFF", "#137050");

const kontrastTablo = tema => `<div class="s-kaydir"><table class="s-tablo s-min-600"><thead><tr><th>Çift</th><th>Ön plan</th><th>Arka plan</th><th>Oran</th><th>Eşik</th><th>Sonuç</th></tr></thead><tbody>${
  P.sonuc.filter(s => s.tema === tema).map(s => `<tr><td>${K(s.anlam)}</td><td class="s-sayi"><code>--${s.on}</code> ${s.onRenk}</td><td class="s-sayi"><code>--${s.arka}</code> ${s.arkaRenk}</td><td class="s-sayi"><b>${sayi(s.oran.toFixed(2))}</b> : 1</td><td class="s-sayi">${sayi(s.esik.toFixed(1))}</td><td class="${s.gecti ? "s-evet" : "s-hayir"}">${s.gecti ? "geçer" : "KALIR"}</td></tr>`).join("")
}</tbody></table></div>`;
const renkOrnekleri = T => Object.entries(T).map(([ad, hex]) => `<div class="s-renk"><i style="background:${hex}"></i><div><b>--${ad}</b><code>${hex}</code></div></div>`).join("");
const olcumTablo = `<div class="s-kaydir"><table class="s-tablo s-min-1800"><thead><tr><th>Genişlik</th><th>Tema</th><th>Durum</th><th>Liste</th>${SIFIR_AD.map(a => `<th>${a}</th>`).join("")}<th>Birincil tuş</th><th>Denetim yüksekliği</th><th>Tuş genişliği</th><th>Satır / kart</th></tr></thead><tbody>${
  O.durumlar.map(d => `<tr><td class="s-sayi"><b>${d.gen}</b></td><td>${d.tema === "acik" ? "açık" : "koyu"}</td><td>${K(d.gorunum)}</td><td>${d.liste}</td>${SIFIR.map(k => d[k] === null ? `<td class="s-sayi">—</td>` : `<td class="s-sayi ${d[k] === 0 ? "s-evet" : "s-hayir"}">${d[k]}</td>`).join("")}<td class="s-sayi">${d.birincil === null ? "—" : d.birincil}</td><td class="s-sayi">${d.tusY} px</td><td class="s-sayi">${d.tusGen[0]}–${d.tusGen[1]} px</td><td class="s-sayi">${d.satirY} px</td></tr>`).join("")
}</tbody></table></div>`;
const ikiliTablo = (satirlar, a, b) => `<div class="s-kaydir"><table class="s-tablo s-min-600"><thead><tr><th>${a}</th><th>${b}</th></tr></thead><tbody>${satirlar.map(([x, y]) => `<tr><td>${K(x)}</td><td>${K(y)}</td></tr>`).join("")}</tbody></table></div>`;
const cokluTablo = (basliklar, satirlar, sinif = "s-min-900") => `<div class="s-kaydir"><table class="s-tablo ${sinif}"><thead><tr>${basliklar.map(b => `<th>${b}</th>`).join("")}</tr></thead><tbody>${satirlar.map(s => `<tr>${s.map(h => `<td>${h}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const cerceveler = (hash, ad) => `<div class="s-cihazlar">
    <div class="s-cihaz s-cihaz-tam"><p class="s-cihaz-ad">Masaüstü · 1920 × 1080 <a href="maket/planlarim.html${hash}" target="_blank" rel="noopener">tam ekran aç</a></p>
      <div class="s-cihaz-ic" data-gen="1920" data-yuk="1080"><iframe data-src="maket/planlarim.html"${hash ? ` data-hash="${hash}"` : ""} width="1920" height="1080" title="${ad}, masaüstü"></iframe></div></div>
    <div class="s-cihaz"><p class="s-cihaz-ad">Tablet · 1080 × 810</p>
      <div class="s-cihaz-ic" data-gen="1080" data-yuk="810"><iframe data-src="maket/planlarim.html"${hash ? ` data-hash="${hash}"` : ""} width="1080" height="810" title="${ad}, tablet"></iframe></div></div>
    <div class="s-cihaz"><p class="s-cihaz-ad">Telefon · 375 × 812</p>
      <div class="s-cihaz-ic" data-gen="375" data-yuk="812"><iframe data-src="maket/planlarim.html"${hash ? ` data-hash="${hash}"` : ""} width="375" height="812" title="${ad}, telefon"></iframe></div></div>
  </div>`;
const bolum = (no, id, baslik, alt, icerik) => `<section class="s-bolum" id="${id}">
  <h2><span class="s-no">${no}</span>${baslik}</h2>
  ${alt ? `<p class="s-alt">${alt}</p>` : ""}
  ${icerik}
</section>`;
const sorular = (liste, baslangic = 1) => `<ol class="s-sorular${baslangic > 1 ? " s-sorular-devam" : ""}"${baslangic > 1 ? ` start="${baslangic}" style="counter-reset: soru ${baslangic - 1}"` : ""}>${liste.map(([s, a, k]) => `<li><div><b>${s}</b><span>${a}</span>${k ? `<span class="s-karar">${ikon("circle-check")}${k}</span>` : ""}</div></li>`).join("")}</ol>`;

/* Faz 1 sırası — iki sayfada aynı (reisim 2026-09-23: "faz 1'i buradan bana yaz" → sohbete de yazıldı) */
const FAZ = [
  ["İskelet", "Next.js, gömülü PostgreSQL, bu sunumdaki değişkenler, test kapısı ve ilk kilitler (kalıp ölçüleri, kiracı süzgeci)."],
  ["Kullanıcı ve Rol · Personel", "Her ekran girişe ve role dayanır; plan kabulü EKİPNET numarasını ve mesleği ister."],
  ["Müşteri ve Tesis", "Ekipman, plan ve İSG-KATİP kaydı tesise bağlı."],
  ["Ekipman Türü Kataloğu · Ekipman", "Ekipman kodla kalıcı kayıt (firmada eşsiz); onay branşı ve yetkili meslekler türden gelir."],
  ["Ölçüm Cihazı · Zimmet · kalibrasyon uyarısı", "Rapordaki cihazlar zimmetten gelir."],
  ["İSG-KATİP kaydı", "Plan kabulünün ön koşulu."],
  ["Planlama · <b>Planlarım</b> · plan içi", "Referans ekran gerçek veriye bağlanır; proje numarası, plan geçmişi."],
  ["Standart Kütüphanesi · ilk Rapor Şablonu", "Rapor, firma × tür şablon sürümüyle açılır; rapor numarası."],
  ["Saha ve Rapor", "Sahadaki asıl iş; ikinci referans ekran."],
  ["Onay ve İmza · PDF", "Branş yöneticisi onayı, son imza, sunucuda PDF."],
  ["Müşteri Paneli", "İmzalı raporlar ve uygunsuzlar Excel'i."]
];
const fazTablo = cokluTablo(["Sıra", "Kalem", "Neden bu sırada"], FAZ.map(([k, n], i) => [`<b>${i + 1}</b>`, k, n]), "s-min-600");

function sayfa({ dosya, baslik, ust, icindekiler, govde, alt }) {
  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${baslik}</title>
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
  <div class="s-ust-baslik">${ust}</div>
  <div class="s-ust-bosluk"></div>
  ${alt}
  <button class="s-tus" type="button" id="s-tema">${ikon("moon")}Tema</button>
</header>
<nav class="s-icindekiler" aria-label="İçindekiler">
  ${icindekiler.map(([id, ad]) => `<a href="#${id}">${ad}</a>`).join("")}
</nav>
<main>
${govde}
</main>
<p class="s-alt-bilgi">Tüm firma, kişi, tesis, adres, sözleşme ve ekipman kodları uydurmadır. Sora: SIL OFL 1.1 · Lucide: ISC · lisans dosyaları <code>vendor/</code> altında. Bu sayfa <code>tools/sunum-uret.mjs</code> ile üretildi.</p>
<script src="assets/sunum.js"></script>
</body>
</html>
`;
  writeFileSync(yol("docs/" + dosya), html);
  return html.length;
}

/* ══ 1 · GÖRSEL SİSTEM (index.html) — kararlar işlendi ═══════════════════════════════════════════════════ */
const KARAR_GORSEL = [
  ["Birincil tuş: A, B ya da C?", "A: yeşil zemin, petrol yazı; iki temada aynı.", "Karar: A. Değişkenlerde tek seçenek kaldı, B ve C elendi."],
  ["Açık tema zemini marka kâğıdı mı?", "Kâğıt #F5F3EE; kartlar beyaz.", "Karar: önerim kabul."],
  ["Yan menü iki temada da koyu petrol mü?", "Logo koyu zemin sürümüyle iki temada aynı görünür.", "Karar: evet."],
  ["Üç bant ve 40 / 48 px denetim yüksekliği?", "Telefon < 768 · tablet 768–1279 · masaüstü ≥ 1280.", "Karar: uygun."],
  ["Süzgeç düzeni", "Reisim: “kurallara göre düzenle”.", "Uygulandı: kalıp 15'in sırası — arama → çipler → ve/veya → seçiciler + Temizle sağda; sığmayınca seçiciler + Temizle birlikte alt satıra."],
  ["Karar penceresi 520 px", "Reisim: “anayasa ve kuralların dışına çıkmadan uydur”.", "Uygulandı: pencerenin içindeki her kutu pencereyi doldurur (ölçüldü, kenar 0); tuşlar içerik kadar; × ve Esc; telefonda alttan levha, tuş çubuğu yapışkan. Genişlik işin içeriğinden: karar 520, iki sütunlu form 760."],
  ["Planlarım referans olarak dondurulsun mu?", "Reisim: “anlamadım”.", "Açıklaması plan içi sunumunda (bölüm 8); soru yeniden soruldu."],
  ["Faz 1 sırası", "Reisim: “faz 1'i buradan bana yaz”.", "Aşağıda ve sohbette yazıldı; onay bekliyor."]
];
const n1 = sayfa({
  dosya: "index.html",
  baslik: "probata · Görsel sistem",
  ust: `<b>Görsel sistem</b><span>Kararlar işlendi · ${O.tarih} · <a href="plan-ici.html">Plan içi sunumu (3. tur) →</a></span>`,
  alt: `<a class="s-tus" href="plan-ici.html">${ikon("file-text")}Plan içi sunumu</a><a class="s-tus" href="maket/planlarim.html" target="_blank" rel="noopener">${ikon("calendar-check")}Maketi aç</a>`,
  icindekiler: [["karar", "Kararlar"], ["olcum", "Ölçüm"], ["renk", "Renk sistemi"], ["birincil", "Birincil tuş"], ["yazi", "Yazı ve ikon"], ["esik", "Eşikler"], ["ekran", "Referans ekran"], ["kurallar", "Ekranın kuralları"], ["faz", "Faz 1"]],
  govde: [
    bolum(1, "karar", "Kararlar (reisim 2026-09-23)", "Marka renkleri, logo, Sora ve iki tema reisim'in kararıydı; üstüne kurulan görsel sistemin sekiz sorusu da cevaplandı.",
      sorular(KARAR_GORSEL) + `<p class="s-oran" style="margin-top:12px">Planlarım ve plan içiyle ilgili 9–16. cevaplar ve yeni tasarım: <a href="plan-ici.html">plan içi sunumu</a>.</p>`),
    bolum(2, "olcum", "Ölçüm", "Tahmin yok. Kontrast gerçek değişken dosyasından hesaplandı; maket yerel sunucuda, üç genişlik ve iki temada ölçüldü.",
      `<div class="s-karolar">
    <div class="s-karo s-iyi"><b>${gecen} / ${P.sonuc.length}</b><span>yazı ve zemin çifti WCAG AA eşiğini geçiyor (iki tema)</span></div>
    <div class="s-karo s-iyi"><b>${tamSifir} / ${O.durumlar.length}</b><span>maket ölçümünde taşma, kırpma, çakışma, gizli tuş, küçük hedef sıfır</span></div>
    <div class="s-karo s-iyi"><b>${TR.length} / ${TR.length}</b><span>Türkçe harf Sora'da var</span></div>
    <div class="s-karo"><b>${O.duzeltilen.length}</b><span>üç turda ölçerken bulunup düzeltilen hata</span></div>
  </div>
  <div class="s-bulgu">${ikon("triangle-alert")}<div><b>Bulgu: marka yeşili üstüne beyaz yazı ${sayi(beyazYesil.toFixed(2))} : 1.</b> Normal metin için eşik 4,5. Bu yüzden birincil tuş yeşil zemin + petrol yazı (karar A).</div></div>
  <p class="s-oran">Maket ölçüm tablosu, etkileşim denemeleri ve düzeltilenlerin tamamı <a href="plan-ici.html#olcum">plan içi sunumunda</a>.</p>`),
    bolum(3, "renk", "Renk sistemi", "Dört marka rengi dokunulmaz. Geri kalan her ton bunlardan türetildi ve iki temada aynı adı taşır.",
      `<h3>Marka</h3><div class="s-renkler">${renkOrnekleri(P.marka)}</div>
  <div class="s-ikili"><div><h3>Açık tema</h3><div class="s-renkler">${renkOrnekleri(P.acik)}</div></div><div><h3>Koyu tema</h3><div class="s-renkler">${renkOrnekleri(P.koyu)}</div></div></div>
  <h3>Kontrast — açık tema</h3>${kontrastTablo("acik")}<h3>Kontrast — koyu tema</h3>${kontrastTablo("koyu")}`),
    bolum(4, "birincil", "Birincil tuş — karar A", "Marka yeşili + beyaz yazı eşiğin altında kaldığı için üç yol vardı; reisim A'yı seçti.",
      `<div class="s-secenekler">
    <div class="s-secenek s-onerilen"><span class="s-etiket">Karar</span><b>A · Yeşil zemin, petrol yazı</b>
      <div class="s-ornek-tuslar s-acik-zemin"><span class="s-ornek-tus" style="background:var(--marka-onay);color:var(--marka-petrol)">Kabul et</span></div>
      <div class="s-ornek-tuslar s-koyu-zemin"><span class="s-ornek-tus" style="background:var(--marka-onay);color:var(--marka-petrol)">Kabul et</span></div>
      <p class="s-oran">Oran <b>${sayi(petrolYesil.toFixed(2))} : 1</b>. İki temada aynı tuş; marka yeşili değişmeden kullanılır.</p></div>
    <div class="s-secenek"><b>B · Petrol zemin, beyaz yazı — elendi</b>
      <div class="s-ornek-tuslar s-acik-zemin"><span class="s-ornek-tus" style="background:var(--marka-petrol);color:#FFFFFF">Kabul et</span></div>
      <p class="s-oran">Açık temada <b>${sayi(beyazPetrol.toFixed(2))} : 1</b>; iki temada farklı görünürdü.</p></div>
    <div class="s-secenek"><b>C · Koyu yeşil zemin, beyaz yazı — elendi</b>
      <div class="s-ornek-tuslar s-acik-zemin"><span class="s-ornek-tus" style="background:var(--s-secenek-c);color:#FFFFFF">Kabul et</span></div>
      <p class="s-oran">Oran <b>${sayi(beyazC.toFixed(2))} : 1</b>; marka yeşilinden koyu bir tona kayıyordu.</p></div>
  </div>`),
    bolum(5, "yazi", "Yazı ve ikon", "Sora 5.3.0, değişken kalınlık 100–800, SIL OFL 1.1, kendi sunucumuzdan. Lucide 1.47.0 ikonları, ISC lisansı, SVG, kendi sunucumuzdan; emoji yok.",
      `<div class="s-olcek">
    <div class="s-olcek-satir"><code>Sayfa başlığı · 22 / 700</code><span style="font-size:22px;font-weight:700">Planlarım</span></div>
    <div class="s-olcek-satir"><code>Bölüm · 17 / 600</code><span style="font-size:17px;font-weight:600">Ekipmanlar</span></div>
    <div class="s-olcek-satir"><code>Gövde · 15 (dokunmatikte 16)</code><span style="font-size:15px">Kuzey Lojistik ve Depolama Hizmetleri A.Ş. · Çorlu / Tekirdağ</span></div>
    <div class="s-olcek-satir"><code>Küçük · 13</code><span style="font-size:13px">KM-0926-772-3416f · 23 Eyl 09:10</span></div>
    <div class="s-olcek-satir"><code>Etiket · 12 / 600</code><span style="font-size:12px;font-weight:600">KABUL BEKLİYOR · ĞÜŞİÖÇ ğüşıöç</span></div>
  </div>
  <h3>Kullanılan ${IKONLAR.length} ikon</h3>
  <div class="s-ikonlar">${IKONLAR.map(i => `<div class="s-ikon-kutu">${ikon(i)}${i}</div>`).join("")}</div>`),
    bolum(6, "esik", "Eşikler", "Üç adlandırılmış bant; yeni eşik eklemek karar ister (karar: uygun).",
      `<div class="s-kaydir"><table class="s-tablo s-min-600"><thead><tr><th>Bant</th><th>Genişlik</th><th>Cihaz</th><th>Yan menü</th><th>Denetim yüksekliği</th><th>Ölçüldüğü genişlik</th></tr></thead><tbody>
    <tr><td><b>dar</b></td><td class="s-sayi">&lt; 768 px</td><td>telefon</td><td>çekmece</td><td class="s-sayi">48 px</td><td class="s-sayi">375</td></tr>
    <tr><td><b>orta</b></td><td class="s-sayi">768 – 1279 px</td><td>tablet</td><td>çekmece</td><td class="s-sayi">48 px</td><td class="s-sayi">1080</td></tr>
    <tr><td><b>geniş</b></td><td class="s-sayi">≥ 1280 px</td><td>masaüstü</td><td>sabit, 248 px</td><td class="s-sayi">40 px (dokunmatik ekranda 48)</td><td class="s-sayi">1920</td></tr>
  </tbody></table></div>
  <p class="s-oran" style="margin-top:10px">Liste tablo mu kart mı, ekrana değil <b>liste kabına</b> bakar: kap ≥ ${O.esik.kap.toLocaleString("tr-TR")} px tablo, altı kart. ${K(O.esik.not)}</p>`),
    bolum(7, "ekran", "Referans ekran: Planlarım", "Çerçeveler maketin kendisi, gerçek boyutunda; kaba sığmayan küçültülür. Plan içi ve ekipman ekleme: <a href=\"plan-ici.html\">plan içi sunumu</a>.",
      `<div class="s-baglantilar">
    <a class="s-tus" href="maket/planlarim.html?tema=acik" target="_blank" rel="noopener">Açık tema</a>
    <a class="s-tus" href="maket/planlarim.html?tema=koyu" target="_blank" rel="noopener">Koyu tema</a>
    <a class="s-tus" href="maket/planlarim.html?veri=bos" target="_blank" rel="noopener">Veri yok</a>
    <a class="s-tus" href="maket/planlarim.html?veri=hata" target="_blank" rel="noopener">Yükleme hatası</a>
  </div>
  ${cerceveler("", "Planlarım maketi")}`),
    bolum(8, "kurallar", "Ekranın kuralları (görsel sistem)", "Planlarım dondurulunca bunlar tasarım kalıbının bu projedeki sayıları olur ve iskelet kaleminde testle kilitlenir.",
      `<ul class="s-kurallar">
    <li><b>Kap tam genişlik</b><span>Liste kabı ve pencere içi kabı doldurur; ölçülen kap farkı ve pencere kenarı 0 px.</span></li>
    <li><b>Tuş içerik kadar</b><span>Masaüstünde ve tablette içerik genişliğinde; yalnız telefonda kart tuşu ve yapışkan tuş çubuğu eşit genişliğe gerilir.</span></li>
    <li><b>Denetim yüksekliği</b><span>Fareyle 40 px, dokunmatikte 48 px: tuş, çip, arama, seçici, menü satırı, form alanı, sekme.</span></li>
    <li><b>Süzgeç (kalıp 15)</b><span>Arama → çipler → ve/veya → seçiciler + Temizle sağda; sığmayınca seçiciler + Temizle birlikte alt satıra. Telefonda seçiciler levhada.</span></li>
    <li><b>Liste tek üreticiden</b><span>Kap ${O.esik.kap.toLocaleString("tr-TR")} px'in altında aynı tablo karta döner; plan listesi, ekipman ve rapor listeleri aynı üreticiden.</span></li>
    <li><b>Dürüst sayaç</b><span>Süzgeç açıkken “3 / 9”; hesaplanamayan sayı “—”, sıfır değil; yükleme hatası “yüklenemedi”, “bulunamadı” değil.</span></li>
    <li><b>Kırpma</b><span>Serbest metin üç nokta + tam metin başlıkta; kimlik (proje no, rapor no, ekipman kodu), sayı ve etiket kırpılmaz.</span></li>
    <li><b>Pencere</b><span>İçindeki her kutu pencereyi doldurur; × ve Esc kapatır; telefonda alttan levha, tuş çubuğu yapışkan ve sonda hiçbir alanı örtmez.</span></li>
    <li><b>Seçim alanı (kalıp 19)</b><span>Cihazın kendi açılır listesi yok; sekizi aşan listede yazarak arama (ekipman türü: 14).</span></li>
    <li><b>Durum rozeti</b><span>Beş plan durumu ve üç rapor durumu; hepsi 4,5 : 1 üstü.</span></li>
  </ul>`),
    bolum(9, "faz", "Faz 1 sırası (öneri — onay bekliyor)", "Her adım kendinden öncekine dayanır; bağlantı kuralları (pkproje.md §3.2) bu sırayı zorunlu kılıyor.", fazTablo)
  ].join("\n\n")
});

/* ══ 2 · PLAN İÇİ (plan-ici.html) — 3. tur sunumu ═══════════════════════════════════════════════════════ */
const CEVAPLAR = [
  ["9", "Reddet satırdan kalktı, plan içinde", "uygun", "Reddet plan içinde; gerekçe zorunlu."],
  ["10", "Denetime başla plan gününe kadar kapalı mı?", "hayır — istediği zaman istediği tepkiyi verebilsin, hareketler kayıt altında kalsın", "Tarih kilidi kalktı. Her hareket (açıldı, kabul, red, başladı, ekipman, rapor, tamamlandı, geri alındı) kim + ne zaman ile plan geçmişine yazılır."],
  ["11", "Raporu başlamamış ekipman varken Tamamla engellensin mi?", "hayır, şu anki gibi", "Engellenmez; şerit “7 ekipmanın bu planda raporu yok” der."],
  ["12", "Tamamlanmış planda ne açık kalsın?", "önerin makul", "Raporlar düzenlenir ve oluşturulur; ekipman ekleme kapalı, önce tamamlama geri alınır."],
  ["13", "Takvim görünümü", "takvimi göremedim", "Maketi yapılmadı; soru 23'te yeniden."],
  ["14", "Ekipman sayısı listede olsun mu?", "gerek yok", "Listede yok; plan içinde “12 ekipman · 5 rapor”."],
  ["15", "Dizüstünde Proje no + adı birleşsin mi?", "hayır", "Ayrı sütunlar; dar kapta kart."],
  ["16", "Proje no biçimi", "olur — mantıklı numara verme sistemi kur, raporlar da eşsiz adlanmalı", "Numara sistemi: bölüm 6."],
  ["+", "Ekipman ve rapor ayrı; ekipman kodu eşsiz", "yukarıda ekipmanlar, aşağıda raporlar; kod elle girilir, çakışan varsa uyar, izin verme", "Bölüm 4 ve 5."]
];
const SENARYO = [
  ["(boş)", "“Etiketteki kodu yazın…” ipucu", "kapalı"],
  ["ht 20 40", "HT2040'a çevrilir: boşluk atılır, küçük harf büyür (yalnız A–Z)", "tür seçilince açık"],
  ["HŞ-2040", "“Kodda yalnız A–Z, 0–9 ve tire olabilir”", "kapalı"],
  ["-HT", "“Tire başta, sonda ya da art arda olamaz”", "kapalı"],
  ["HT-1001", "“HT-1001 bu planda zaten var: Hava tankı · Kompresör odası. Aynı kod iki ekipmana verilemez.”", "kapalı"],
  ["TP-1013", "“bu tesiste kayıtlı … Yeni kayıt açılmaz” + <b>Kayıtlı ekipmanı seç</b> → plana önceki kontrolüyle alınır", "kapalı (seçme yolu açık)"],
  ["FL-1016", "“FL-1016 başka bir tesiste kayıtlı: Forklift · Yıldız Ambalaj A.Ş. / Depo 2.”", "kapalı"],
  ["HT-2040", "“Kod kullanılabilir; bu firmada başka ekipmanda yok.”", "tür seçilince açık"]
];
const NUMARA = [
  ["<b>Proje no</b>", "<code>P-AAYY-SIRA</code>", "<code>P-0926-031</code>", "sunucu, plan açılırken", "AAYY: planın açıldığı ay + yıl · SIRA: firmada o ayın kaçıncı planı (3 hane, her ay 001'den)", "firmada eşsiz; veritabanında benzersizlik kısıtı", "hayır; iptal planın numarası yeniden verilmez"],
  ["<b>Rapor no</b>", "<code>XX-AAYY-SIRA-EK</code>", "<code>KM-0926-772-3416f</code>", "sunucu, rapor oluşturulurken", "XX: firma kısa kodu (firma ayarı) · AAYY: raporun açıldığı ay + yıl · SIRA: firmada kesintisiz artan · EK: 5 hane rasgele (tahmin edilemez)", "firmada eşsiz; EK çakışırsa yeniden üretilir", "hayır; düzeltme revizyonla (öneri: aynı numara + R1)"],
  ["<b>Ekipman kodu</b>", "A–Z, 0–9, tire · 3–20 hane", "<code>HT-1001</code>", "personel, etiketten elle", "Türkçe harf ve boşluk yok; küçük harf büyüğe çevrilir (dile bağlı harf katlama yok, anayasa 5.5)", "firmada eşsiz; yazarken ve kaydederken denetlenir, veritabanında kısıt", "soru 19"]
];
const SORULAR3 = [
  ["Ekipman kodu firma genelinde mi eşsiz olsun, tesis içinde mi?", "Önerim firma geneli: etiket ve QR tek numara taşır, rapor ve müşteri panelinde karışmaz. Makette öyle."],
  ["Kod biçimi serbest mi kalsın, türe göre önek zorunlu mu?", "Önerim serbest (yalnız A–Z, 0–9, tire); önek (HT-, FL-) firmanın etiket düzenine kalsın."],
  ["Ekipman kodu sonradan değiştirilebilsin mi?", "Önerim yalnız yönetici değiştirir; eski kod geçmişte kalır, eski raporlarda eski kod yazar."],
  ["Rapor numarasındaki sıra ayla sıfırlansın mı?", "Önerim hayır: firmada kesintisiz artar (senin örneğin ME-0626-767). Ay + yıl zaten numarada."],
  ["Proje numarasındaki sıra her ay 001'den mi başlasın?", "Önerim evet: P-0926-031 = Eylül 2026'nın 31. planı; ay + yıl planın açıldığı aydır, kontrol tarihi değişse de numara değişmez."],
  ["Tesiste kayıtlı ekipmanları plana kim alır?", "Önerim ikisi de: planlama ekibi plan açarken tesisin kayıtlı ekipmanlarını plana alır, inspector sahada ekler ya da yenisini kaydeder."],
  ["Kabul et'teki İSG-KATİP kilidi kalsın mı?", "Tarih kilidini kaldırdım. Bu kilit senin 22 Eylül kararın (§3.2 madde 2) ve mevzuattan: sözleşmesiz rapor geçersiz. Önerim kalsın."],
  ["Takvim görünümünü görmek ister misin?", "13'e “göremedim” dedin: maketi yapılmadı. İstersen Planlarım'a Liste / Takvim anahtarı ayrı kalem olarak gelir."],
  ["Referans ekran dondurulsun mu?", "Ne olduğu bölüm 8'de. Önerim: bu turdaki cevaplar işlenince Planlarım + plan içi dondurulur, sonra iskelet."]
];
const n2 = sayfa({
  dosya: "plan-ici.html",
  baslik: "probata · Plan içi, ekipmanlar ve raporlar",
  ust: `<b>Plan içi: ekipmanlar, raporlar ve numaralar</b><span>${O.tarih} · ${O.tur}. tur · reisim'in onayına sunulur · <a href="index.html">Görsel sistem →</a></span>`,
  alt: `<a class="s-tus" href="index.html">${ikon("book-open")}Görsel sistem</a><a class="s-tus" href="maket/planlarim.html#/plan/1" target="_blank" rel="noopener">${ikon("calendar-check")}Maketi aç</a>`,
  icindekiler: [["cevaplar", "Cevapların"], ["sorun", "Sorun"], ["olcum", "Ölçüm"], ["plan", "Plan içi"], ["ekle", "Ekipman ekle"], ["numara", "Numara sistemi"], ["kurallar", "Ekranın kuralları"], ["referans", "Referans ekran nedir"], ["faz", "Faz 1"], ["sorular", "Karar soruları"]],
  govde: [
    bolum(1, "cevaplar", "Cevapların ve ne yaptım", "9–16 ve ek isteğin. Görsel sistemin 1–8 cevapları <a href=\"index.html#karar\">görsel sistem sayfasında</a>.",
      cokluTablo(["No", "Soru", "Cevabın", "Makette"], CEVAPLAR.map(([n, s, c, m]) => [`<b>${n}</b>`, K(s), `<i>${K(c)}</i>`, K(m)]), "s-min-900")),
    bolum(2, "sorun", "Sorun", "2. turdaki plan içinde ekipman ile rapor aynı satırdaydı.",
      `<ul class="s-kurallar">
    <li><b>Seneye aynı ekipman</b><span>Satır “ekipman + raporu” idi; aynı ekipmana yeni yılda yeni rapor açmanın yeri yoktu.</span></li>
    <li><b>Ekipmanın kimliği yoktu</b><span>Kod yoktu; aynı ekipman iki kez ya da iki ekipman aynı adla kaydedilebilirdi.</span></li>
    <li><b>Tarih kilidi</b><span>Denetime başla plan gününe kilitliydi; hareketler kayıt altında değildi.</span></li>
    <li><b>Numaralar yazılı değildi</b><span>Proje ve rapor numarasını kimin, ne zaman, hangi kuralla verdiği belli değildi.</span></li>
  </ul>`),
    bolum(3, "olcum", "Ölçüm", `${K(O.yontem)}`,
      `<div class="s-karolar">
    <div class="s-karo s-iyi"><b>${tamSifir} / ${O.durumlar.length}</b><span>ölçümde taşma, kırpma, çakışma, gizli tuş, küçük hedef, pencere kenarı sıfır</span></div>
    <div class="s-karo s-iyi"><b>${gecen} / ${P.sonuc.length}</b><span>yazı ve zemin çifti AA geçiyor (iki tema)</span></div>
    <div class="s-karo"><b>${O.duzeltilen.filter(d => d[0].startsWith("3. tur")).length}</b><span>bu turda ölçerken bulunup düzeltilen</span></div>
    <div class="s-karo"><b>${O.duzeltilen.length}</b><span>üç turda toplam</span></div>
  </div>
  <h3>Maket ölçümü</h3>${olcumTablo}
  <h3>Etkileşim denemeleri</h3>${ikiliTablo(O.etkilesim, "Deneme", "Sonuç")}
  <h3>Ölçerken bulunup düzeltilenler</h3>${ikiliTablo(O.duzeltilen, "Bulgu", "Düzeltme")}`),
    bolum(4, "plan", "Plan içi: üstte ekipmanlar, altta raporlar", "Ekipman tesisin kalıcı kaydıdır, kodla tanınır; plan yalnız hangi ekipmanlara bakılacağını tutar. Rapor her plan için ayrı açılır: seneye aynı ekipmana yeni rapor, önceki rapor “Önceki kontrol” sütununda görünür.",
      `<ul class="s-kurallar">
    <li><b>Ekipmanlar</b><span>Kod · ekipman (tür + konum) · branş · önceki kontrol (ay yıl · sonuç · rapor no) · bu plandaki rapor · <i>Rapor oluştur</i>. Bu planda eklenen “Yeni · İlk kontrol”.</span></li>
    <li><b>Raporlar</b><span>Yalnız bu planda açılanlar: rapor no · ekipman · durum (Taslak / Onayda / Onaylandı) · oluşturulma · Raporu düzenle / aç.</span></li>
    <li><b>Plan geçmişi</b><span>Kim, ne zaman, ne yaptı; en yeni üstte. Denetçi her tuşa istediği an basar, iz kalır.</span></li>
    <li><b>Ne zaman açık</b><span>Ekipman ekle yalnız Denetimde; rapor oluşturma Denetimde ve Tamamlandı'da; öncesinde şerit “denetime başlayınca açılır” der.</span></li>
  </ul>
  <div class="s-baglantilar">
    <a class="s-tus" href="maket/planlarim.html#/plan/1" target="_blank" rel="noopener">Denetimde</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/4" target="_blank" rel="noopener">Ön koşul eksik</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/8" target="_blank" rel="noopener">Tamamlandı</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/6" target="_blank" rel="noopener">Kabul edildi (29 Eyl)</a>
  </div>
  ${cerceveler("#/plan/1", "Plan içi maketi")}`),
    bolum(5, "ekle", "Ekipman ekle: kod eşsiz, çakışan kod kaydedilmez", "İki yol: tesiste kayıtlı ama bu plana alınmamış ekipmanı seç, ya da yeni ekipmanı etiketindeki kodla kaydet. Kod yazılırken denetlenir; kaydederken yeniden denetlenir (gerçek uygulamada sunucuda ve veritabanında da).",
      cokluTablo(["Yazılan", "Pencerenin söylediği", "Kaydet"], SENARYO.map(([a, b, c]) => [`<code>${K(a)}</code>`, b, K(c)]), "s-min-600") +
      `<p class="s-oran" style="margin-top:10px">Çevrimdışı çalışma geldiğinde (sonraki faz): iki inspector aynı kodu çevrimdışı girerse eşitlemede ikincisi reddedilir ve düzeltmesi istenir; kayıt sessizce birleşmez.</p>` +
      cerceveler("#/plan/1/ekle/FL-1016", "Ekipman ekle penceresi")),
    bolum(6, "numara", "Numara sistemi (16. cevap)", "Üç numara, üç kural. Proje ve rapor numarasını sunucu verir, kimse elle yazmaz; ekipman kodunu personel etiketten yazar, sistem eşsizliğini korur.",
      cokluTablo(["Numara", "Biçim", "Örnek", "Kim verir", "Parçalar", "Eşsizlik", "Değişir mi"], NUMARA, "s-min-1400")),
    bolum(7, "kurallar", "Ekranın kuralları (plan içi)", "",
      `<ul class="s-kurallar">
    <li><b>Nesne sayfası (anayasa 2.7)</b><span>Kırıntı · kimlik · bilgi kutuları · tek birincil tuş · araç çubuğu. Tamamlandı'da birincil tuş yok.</span></li>
    <li><b>İki liste, tek üretici</b><span>Ekipmanlar ve Raporlar plan listesiyle aynı üreticiden; kap 1.180 px altında kart, kartta “Önceki kontrol” etiketi.</span></li>
    <li><b>Kimlik kırpılmaz</b><span>Ekipman kodu, rapor no, proje no bölünmez ve üç noktaya düşmez.</span></li>
    <li><b>Kod denetimi yerinde</b><span>Mesaj alanın altında, açık cümleyle ve nedenini söyleyerek; kayıt tuşu ancak kod kullanılabilir ve tür seçiliyken açılır.</span></li>
    <li><b>Hareket kaydı</b><span>Her durum değişikliği ve her ekipman/rapor işlemi geçmişe yazılır; aynı dakikadakiler kayıt sırasıyla.</span></li>
    <li><b>Telefon</b><span>Eylem çubuğunun tamamı altta yapışkan; pencere alttan levha, tuş çubuğu sonda hiçbir alanı örtmez (ölçüldü).</span></li>
  </ul>`),
    bolum(8, "referans", "“Referans ekran” ne demek (7. soru)", "",
      `<p>Referans ekran, sonraki bütün ekranların <b>ölçüsünü aldığı örnek ekrandır</b>: tuş boyu, satır yüksekliği, süzgeç düzeni, liste ve kart, rozet, pencere. <b>Dondurmak</b> iki şey demek: (1) bu ekranın ölçülerini tasarım kalıbına sayı olarak yazmak (ör. “tuş 40/48 px”, “kap ≥ 1.180 px tablo”); (2) iskelet kaleminde bu sayıları bozan bir değişikliği otomatik yakalayan test kurmak. Önceki projede bu görevi Ekipmanlar ekranı yapıyordu; kalıp dosyamızdaki sayılar oradan gelir ve bu projede kendi referans ekranımızla değişecek.</p>
  <p class="s-oran">Dondurulunca Planlarım'da değişiklik yine yapılır, ama bilerek: önce kalıptaki sayı güncellenir, test de onunla birlikte değişir.</p>`),
    bolum(9, "faz", "Faz 1 sırası (öneri — onay bekliyor)", "8. cevap: “faz 1'i buradan bana yaz” — sohbete de yazıldı.", fazTablo),
    bolum(10, "sorular", "Karar soruları", "Cevaplar pkproje.md'ye işlenir.", sorular(SORULAR3.map(([s, a]) => [s, a]), 17))
  ].join("\n\n")
});
console.log(`index.html ${n1} bayt · plan-ici.html ${n2} bayt · kontrast ${gecen}/${P.sonuc.length} · ölçüm ${tamSifir}/${O.durumlar.length} temiz · ${IKONLAR.length} ikon · düzeltilen ${O.duzeltilen.length}`);
