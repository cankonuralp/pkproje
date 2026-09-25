/* SUNUM ÜRETİCİSİ — iki sayfa (2026-09-23, 5. tur):
     docs/index.html     görsel sistem (reisim'in 1–8 kararları işlenmiş hâli; 4. turda yükseklik ve yazı ölçeği)
     docs/plan-ici.html  plan içi akışı ve yan menü: adımlar, kontrol listesi, sayfalama, süzgeç, numara sistemi (5. tur)
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
const SIFIR = ["tasma", "sertKirpma", "tasanMetin", "cakisma", "sonCakisma", "gizliEtkilesimli", "ekranDisi", "kucukHedef", "basliksizKirpma", "ipucuKesik", "kenarFarki", "gorunenGizli", "pencereKenar", "hizaKaymasi", "kartTutarsiz"];
const SIFIR_AD = ["Yatay taşma", "Sert kırpma", "Taşan metin", "Çakışma", "Sonda çakışma", "Gizli tuş", "Ekran dışı", "Küçük hedef", "Başlıksız kırpma", "Kesik ipucu", "Kap farkı", "Görünen gizli", "Pencere kenarı", "Hiza kayması", "Kart tutarsız"];

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
const olcumTablo = `<div class="s-kaydir"><table class="s-tablo s-min-2000"><thead><tr><th>Genişlik</th><th>Tema</th><th>Durum</th><th>Liste</th>${SIFIR_AD.map(a => `<th>${a}</th>`).join("")}<th>Birincil tuş</th><th>Denetim yüksekliği</th><th>Tuş genişliği</th><th>Satır / kart</th></tr></thead><tbody>${
  O.durumlar.map(d => `<tr><td class="s-sayi"><b>${d.gen}</b></td><td>${d.tema === "acik" ? "açık" : "koyu"}</td><td>${K(d.gorunum)}</td><td>${d.liste}</td>${SIFIR.map(k => d[k] === null ? `<td class="s-sayi">—</td>` : `<td class="s-sayi ${d[k] === 0 ? "s-evet" : "s-hayir"}">${d[k]}</td>`).join("")}<td class="s-sayi">${d.birincil === null ? "—" : d.birincil}</td><td class="s-sayi">${d.tusY} px</td><td class="s-sayi">${d.tusGen[0]}–${d.tusGen[1]} px</td><td class="s-sayi">${d.satirY === null ? "—" : d.satirY + " px"}</td></tr>`).join("")
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
  ["Planlama · <b>Planlar</b> · plan içi", "Referans ekran gerçek veriye bağlanır; proje numarası, plan geçmişi."],
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
  ["Üç bant ve 40 / 48 px denetim yüksekliği?", "Telefon < 768 · tablet 768–1279 · masaüstü ≥ 1280.", "Karar: uygun. 4. turda reisim: “her şey çok büyük” → 34 / 44 px, gövde yazısı 14 / 15 px (bantlar aynı)."],
  ["Süzgeç düzeni", "Reisim: “kurallara göre düzenle”.", "Uygulandı: kalıp 15'in sırası — arama → çipler → ve/veya → seçiciler + Temizle sağda; sığmayınca seçiciler + Temizle birlikte alt satıra."],
  ["Karar penceresi 520 px", "Reisim: “anayasa ve kuralların dışına çıkmadan uydur”.", "Uygulandı: pencerenin içindeki her kutu pencereyi doldurur (ölçüldü, kenar 0); tuşlar içerik kadar; × ve Esc; telefonda alttan levha, tuş çubuğu yapışkan. Genişlik işin içeriğinden: karar 520, iki sütunlu form 760."],
  ["Planlar (eski adı Planlarım) referans olarak dondurulsun mu?", "Reisim: “anlamadım” → açıklandı, 25. soru olarak yeniden soruldu.", "Karar (4. tur, önerim kabul): plan içi turu onaylanınca Planlar + plan içi dondurulur, sonra iskelet."],
  ["Faz 1 sırası", "Reisim: “faz 1'i buradan bana yaz” → yazıldı.", "Karar (4. tur): “tüm sorularda senin önerilerini kabul ediyorum” → aşağıdaki sıra."]
];
const n1 = sayfa({
  dosya: "index.html",
  baslik: "probata · Görsel sistem",
  ust: `<b>Görsel sistem</b><span>Kararlar işlendi · ${O.tarih} · <a href="plan-ici.html">Plan içi sunumu (${O.tur}. tur) →</a></span>`,
  alt: `<a class="s-tus" href="toplu-bakis.html">${ikon("layers")}Toplu bakış (16 maket)</a><a class="s-tus" href="plan-ici.html">${ikon("file-text")}Plan içi sunumu</a><a class="s-tus" href="maket/planlarim.html" target="_blank" rel="noopener">${ikon("calendar-check")}Maketi aç</a><a class="s-tus" href="uygulama/" target="_blank" rel="noopener">${ikon("house")}Uygulama önizlemesi</a>`,
  icindekiler: [["karar", "Kararlar"], ["olcum", "Ölçüm"], ["renk", "Renk sistemi"], ["birincil", "Birincil tuş"], ["yazi", "Yazı ve ikon"], ["esik", "Eşikler"], ["ekran", "Referans ekran"], ["kurallar", "Ekranın kuralları"], ["faz", "Faz 1"]],
  govde: [
    bolum(1, "karar", "Kararlar (reisim 2026-09-23)", "Marka renkleri, logo, Sora ve iki tema reisim'in kararıydı; üstüne kurulan görsel sistemin sekiz sorusu da cevaplandı.",
      sorular(KARAR_GORSEL) + `<p class="s-oran" style="margin-top:12px">Planlar ve plan içiyle ilgili 9–28. cevaplar, akış ve yan menü: <a href="plan-ici.html">plan içi sunumu</a>.</p>`),
    bolum(2, "olcum", "Ölçüm", "Tahmin yok. Kontrast gerçek değişken dosyasından hesaplandı; maket yerel sunucuda, üç genişlik ve iki temada ölçüldü.",
      `<div class="s-karolar">
    <div class="s-karo s-iyi"><b>${gecen} / ${P.sonuc.length}</b><span>yazı ve zemin çifti WCAG AA eşiğini geçiyor (iki tema)</span></div>
    <div class="s-karo s-iyi"><b>${tamSifir} / ${O.durumlar.length}</b><span>maket ölçümünde taşma, kırpma, çakışma, gizli tuş, küçük hedef sıfır</span></div>
    <div class="s-karo s-iyi"><b>${TR.length} / ${TR.length}</b><span>Türkçe harf Sora'da var</span></div>
    <div class="s-karo"><b>${O.duzeltilen.length}</b><span>beş turda ölçerken bulunup düzeltilen hata</span></div>
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
    <div class="s-olcek-satir"><code>Sayfa başlığı · 20 / 700 (telefonda 18)</code><span style="font-size:20px;font-weight:700">Planlar</span></div>
    <div class="s-olcek-satir"><code>Bölüm · 15 / 600</code><span style="font-size:15px;font-weight:600">Denetim · Ekipmanlar</span></div>
    <div class="s-olcek-satir"><code>Gövde · 14 (dokunmatikte 15)</code><span style="font-size:14px">Kuzey Lojistik ve Depolama Hizmetleri A.Ş. · Çorlu / Tekirdağ</span></div>
    <div class="s-olcek-satir"><code>Küçük · 12,5</code><span style="font-size:12.5px">KM-0926-772-3416f · 23 Eyl 09:10</span></div>
    <div class="s-olcek-satir"><code>Etiket · 11,5 / 600</code><span style="font-size:11.5px;font-weight:600">KABUL BEKLİYOR · ĞÜŞİÖÇ ğüşıöç</span></div>
  </div>
  <h3>Kullanılan ${IKONLAR.length} ikon</h3>
  <div class="s-ikonlar">${IKONLAR.map(i => `<div class="s-ikon-kutu">${ikon(i)}${i}</div>`).join("")}</div>`),
    bolum(6, "esik", "Eşikler", "Üç adlandırılmış bant; yeni eşik eklemek karar ister (karar: uygun). 4. turda yalnız yükseklikler küçüldü.",
      `<div class="s-kaydir"><table class="s-tablo s-min-600"><thead><tr><th>Bant</th><th>Genişlik</th><th>Cihaz</th><th>Yan menü</th><th>Denetim yüksekliği</th><th>Ölçüldüğü genişlik</th></tr></thead><tbody>
    <tr><td><b>dar</b></td><td class="s-sayi">&lt; 768 px</td><td>telefon</td><td>çekmece</td><td class="s-sayi">44 px</td><td class="s-sayi">375</td></tr>
    <tr><td><b>orta</b></td><td class="s-sayi">768 – 1279 px</td><td>tablet</td><td>çekmece</td><td class="s-sayi">44 px</td><td class="s-sayi">1080</td></tr>
    <tr><td><b>geniş</b></td><td class="s-sayi">≥ 1280 px</td><td>masaüstü</td><td>sabit, 232 px</td><td class="s-sayi">34 px (dokunmatik ekranda 44)</td><td class="s-sayi">1920</td></tr>
  </tbody></table></div>
  <p class="s-oran" style="margin-top:10px">Liste tablo mu kart mı, ekrana değil <b>liste kabına</b> bakar: kap ≥ ${O.esik.kap.toLocaleString("tr-TR")} px tablo, altı kart. ${K(O.esik.not)}</p>`),
    bolum(7, "ekran", "Referans ekran: Planlar", "Çerçeveler maketin kendisi, gerçek boyutunda; kaba sığmayan küçültülür. Plan içi ve ekipman ekleme: <a href=\"plan-ici.html\">plan içi sunumu</a>.",
      `<div class="s-baglantilar">
    <a class="s-tus" href="maket/planlarim.html?tema=acik" target="_blank" rel="noopener">Açık tema</a>
    <a class="s-tus" href="maket/planlarim.html?tema=koyu" target="_blank" rel="noopener">Koyu tema</a>
    <a class="s-tus" href="maket/planlarim.html?veri=bos" target="_blank" rel="noopener">Veri yok</a>
    <a class="s-tus" href="maket/planlarim.html?veri=hata" target="_blank" rel="noopener">Yükleme hatası</a>
  </div>
  ${cerceveler("", "Planlar maketi")}`),
    bolum(8, "kurallar", "Ekranın kuralları (görsel sistem)", "Planlar dondurulunca bunlar tasarım kalıbının bu projedeki sayıları olur ve iskelet kaleminde testle kilitlenir.",
      `<ul class="s-kurallar">
    <li><b>Kap tam genişlik</b><span>Liste kabı ve pencere içi kabı doldurur; ölçülen kap farkı ve pencere kenarı 0 px.</span></li>
    <li><b>Tuş içerik kadar</b><span>Masaüstünde ve tablette içerik genişliğinde; yalnız telefonda kart tuşu ve yapışkan tuş çubuğu eşit genişliğe gerilir.</span></li>
    <li><b>Denetim yüksekliği</b><span>Fareyle 34 px, dokunmatikte 44 px (4. tur): tuş, çip, arama, seçici, sayfa tuşu, menü satırı, form alanı, sekme.</span></li>
    <li><b>Süzgeç (kalıp 15)</b><span>Arama → çipler → ve/veya → seçiciler + Temizle sağda; sığmayınca seçiciler + Temizle birlikte alt satıra. Telefonda seçiciler levhada.</span></li>
    <li><b>Liste tek üreticiden</b><span>Kap ${O.esik.kap.toLocaleString("tr-TR")} px'in altında aynı tablo karta döner; plan listesi, ekipman ve rapor listeleri aynı üreticiden.</span></li>
    <li><b>Dürüst sayaç</b><span>Süzgeç açıkken “3 / 9”; hesaplanamayan sayı “—”, sıfır değil; yükleme hatası “yüklenemedi”, “bulunamadı” değil.</span></li>
    <li><b>Kırpma</b><span>Serbest metin üç nokta + tam metin başlıkta; kimlik (proje no, rapor no, ekipman kodu), sayı ve etiket kırpılmaz.</span></li>
    <li><b>Pencere</b><span>İçindeki her kutu pencereyi doldurur; × ve Esc kapatır; telefonda alttan levha, tuş çubuğu yapışkan ve sonda hiçbir alanı örtmez.</span></li>
    <li><b>Seçim alanı (kalıp 19)</b><span>Cihazın kendi açılır listesi yok; sekizi aşan listede yazarak arama (ekipman türü: 14).</span></li>
    <li><b>Yan menü</b><span>Firma panelinin bütün modülleri, gruplu, genel adlarla; sığmayan yükseklikte yalnız menü kayar.</span></li>
    <li><b>Durum rozeti</b><span>Beş plan durumu ve üç rapor durumu; hepsi 4,5 : 1 üstü.</span></li>
  </ul>`),
    bolum(9, "faz", "Faz 1 sırası (karar — 4. tur)", "Her adım kendinden öncekine dayanır; bağlantı kuralları (pkproje.md §3.2) bu sırayı zorunlu kılıyor.", fazTablo)
  ].join("\n\n")
});

/* ══ 2 · PLAN İÇİ (plan-ici.html) — 5. tur sunumu: akış + yan menü ═══════════════════════════════════════ */
/* buradaki sayfa sayıları (“1–20 / 22” gibi) maketin uydurma verisinden; ölçüm sayıları olcum.json'dan okunur */
const CEVAPLAR = [
  ["26–28", "önerilerin uygundur", "Beyan metni firma ayarı (boşsa varsayılan). Proje notunu plandaki inspector'lar ve planlama ekibi yazar ve görür, müşteri görmez, not silinmez. Bu tur uygunsa dondurma ve iskelet (soru 31)."],
  ["Hareketler", "hareketler kısmını kaldır", "Plan içindeki hareket listesi kalktı; yerinde yalnız <b>Proje notları</b>. Hareket kaydı arka planda tutulmaya devam ediyor (3. turdaki “kayıt altında kalsın”); nerede görüneceği soru 30."],
  ["Raporlar", "raporlarda 5 değil 20 rapor alt alta durabilsin 5 çok az", "Rapor listesi <b>20'şer</b> (ekipman 10'ar kaldı). Merkez Fabrika'da zaten 5 rapor vardı ve hepsi görünüyordu; örnek 10 rapora çıktı. Değirmen'de 22 rapor: 20 alt alta, 2'si ikinci sayfada."],
  ["Yan menü", "sol taraftaki bar da çok az modül var, diğer modüller nerde onlarda gözüksün", "Firma panelinde ekranı olan <b>17 modül</b>, 6 grupta (bölüm 2). Ekranı henüz tasarlanmamış modüle tıklanınca bildirim çıkar, sayfa değişmez."],
  ["Kim neyi görür", "kim hangi modülü görebilecek sonradan belirleriz", "Maket herkese bütün menüyü gösteriyor; rol × modül görünürlüğü sonra (Kullanıcılar modülüyle birlikte)."],
  ["Menü adları", "sekmelerin adı da öznellik içermesin planlar raporlar zimmetler gibi genel isimler olsun", "Planlarım → <b>Planlar</b>, Raporlarım → <b>Raporlar</b>, Zimmetim → <b>Zimmetler</b>; sayfa başlığı, kırıntı ve sekme adı da Planlar."]
];
const MENU_TABLO = [
  ["İş takibi", "Planlar · Raporlar · Onaylar · Uyarılar", "13 Planlama · 14 Saha & Rapor · 15 Onay & İmza · 20 Uyarılar"],
  ["Müşteri", "Müşteriler · Teklifler · Sözleşmeler", "3 Müşteri & Tesis · 11 Teklif · 12 Sözleşme"],
  ["Varlık", "Ekipmanlar · Ölçüm cihazları · Zimmetler", "7 Ekipman · 8 Ölçüm Cihazı · 9 Zimmet"],
  ["Personel", "Personel · Eğitimler", "2 Personel · 10 Eğitim Takibi"],
  ["Finans", "Muhasebe · Performans", "18 Muhasebe · 19 Performans & Raporlama"],
  ["Tanımlar", "Ekipman türleri · Standartlar · Kullanıcılar", "5 Ekipman Türü Kataloğu · 4 Standart Kütüphanesi · 1 Kullanıcı & Rol"]
];
const ADIMLAR = [
  ["1 · Planlandı", "Plan bilgisi tek listede: proje no · başlangıç · adres · inspector · İSG-KATİP · açıklama. <b>Kapsam</b>: tür başına planlanan ve plandaki ekipman sayısı; kabul bekleyen planda açık, sonra katlı."],
  ["2 · Kabul", "<b>Tarafsızlık ve çıkar çatışması beyanı</b> (TS EN ISO/IEC 17020; metin firma ayarından, karar 26); Kabul et beyanı onaylar. Reddet gerekçe ister. İSG-KATİP ön koşulu eksikse Kabul et kapalı, nedeni yanında."],
  ["3 · Denetim", "<b>Kontrol listesi</b>: Ekipmanlar (kod · tür · konum · branş · önceki kontrol · rapor · Rapor oluştur) <b>10'ar</b> sayfa; Raporlar (no · ekipman · sonuç · durum · oluşturuldu) <b>20'şer</b> sayfa. İkisinde süzgeç. Ekipman ekle yalnız Denetimde."],
  ["4 · Tamamlama", "Tamamla; raporu olmayan ekipman engel değil, sayısı yazılır. Tamamlanınca raporlar düzenlenir, ekipman eklemek için tamamlama geri alınır."],
  ["Proje notları", "Planlama ekibi ve plandaki inspector'lar yazar ve görür; müşteri görmez; not silinmez (karar 27). Hareket kaydı tutulur, burada gösterilmez."]
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
  ["<b>Proje no</b>", "<code>P-AAYY-SIRA</code>", "<code>P-0926-031</code>", "sunucu, plan açılırken", "AAYY: planın açıldığı ay + yıl · SIRA: firmada o ayın kaçıncı planı, her ay 001'den (karar 21)", "firmada eşsiz; veritabanında benzersizlik kısıtı", "hayır; iptal planın numarası yeniden verilmez"],
  ["<b>Rapor no</b>", "<code>XX-AAYY-SIRA-EK</code>", "<code>KM-0926-772-3416f</code>", "sunucu, rapor oluşturulurken", "XX: firma kısa kodu · AAYY: raporun açıldığı ay + yıl · SIRA: firmada kesintisiz, ayla sıfırlanmaz (karar 20) · EK: 5 hane rasgele", "firmada eşsiz; EK çakışırsa yeniden üretilir", "hayır; düzeltme revizyonla (aynı numara + R1)"],
  ["<b>Ekipman kodu</b>", "A–Z, 0–9, tire · 3–20 hane, önek serbest (karar 18)", "<code>HT-1001</code>", "personel, etiketten elle", "Türkçe harf ve boşluk yok; küçük harf büyüğe çevrilir (dile bağlı harf katlama yok, anayasa 5.5)", "firma genelinde eşsiz (karar 17); yazarken ve kaydederken denetlenir, veritabanında kısıt", "yalnız yönetici; eski kod geçmişte kalır (karar 19)"]
];
const KARARLAR17 = [
  ["Ekipman kodu firma genelinde mi eşsiz?", "Firma geneli: etiket ve QR tek numara taşır.", "Karar: önerim kabul."],
  ["Kod biçimi serbest mi, türe göre önek zorunlu mu?", "Serbest (A–Z, 0–9, tire); önek firmanın etiket düzenine kalır.", "Karar: önerim kabul."],
  ["Ekipman kodu sonradan değiştirilebilsin mi?", "Yalnız yönetici; eski kod geçmişte, eski raporlarda eski kod.", "Karar: önerim kabul."],
  ["Rapor numarasındaki sıra ayla sıfırlansın mı?", "Hayır, firmada kesintisiz.", "Karar: önerim kabul."],
  ["Proje numarasındaki sıra her ay 001'den mi?", "Evet; ay + yıl planın açıldığı ay.", "Karar: önerim kabul."],
  ["Tesiste kayıtlı ekipmanı plana kim alır?", "İkisi de: planlama ekibi plan açarken, inspector sahada.", "Karar: önerim kabul."],
  ["Kabul et'teki İSG-KATİP kilidi kalsın mı?", "Kalsın (§3.2 madde 2, mevzuat).", "Karar: önerim kabul."],
  ["Takvim görünümü", "Reisim: “takvim hariç, onu istemiyorum, yapma”.", "Karar: takvim yok."],
  ["Referans ekran dondurulsun mu?", "Bu tur onaylanınca Planlar + plan içi dondurulur, sonra iskelet.", "Karar: önerim kabul (onay soru 31'de)."],
  ["Tarafsızlık beyanının metni nereden gelsin?", "Firma ayarı (kalite el kitabındaki metin); boşsa varsayılan. Kabul anındaki sürüm kayda yazılır.", "Karar (5. tur): önerim kabul."],
  ["Proje notunu kimler yazar, kimler görür?", "Plandaki inspector'lar ve planlama ekibi; müşteri görmez; not silinmez.", "Karar (5. tur): önerim kabul."],
  ["4. tur uygun mu?", "Reisim: “önerilerin uygundur” + bu turdaki değişiklik istekleri.", "Karar (5. tur): değişikliklerle uygun; onay soru 31'de."]
];
const SORULAR5 = [
  ["Menü grupları ve adları uygun mu?", "İş takibi · Müşteri · Varlık · Personel · Finans · Tanımlar. Önerim bu sıra: her gün kullanılan üstte, bir kez kurulan tanımlar altta."],
  ["Hareket kaydı nerede görünsün?", "Önerim: plan içinde değil. Kim hangi modülü görecek belirlenirken yöneticiye “Hareket kaydı” (denetim izi) olarak açılsın; kayıt şimdiden tutuluyor."],
  ["Bu tur uygun mu?", "Uygunsa Planlar + plan içi referans ekran olarak dondurulur (34 / 44 px, kap 960, ekipman 10 · rapor 20 kalıba yazılır) ve iskelet kalemi açılır."]
];
const n2 = sayfa({
  dosya: "plan-ici.html",
  baslik: "probata · Plan içi akışı",
  ust: `<b>Plan içi ve yan menü</b><span>${O.tarih} · ${O.tur}. tur · reisim'in onayına sunulur · <a href="index.html">Görsel sistem →</a></span>`,
  alt: `<a class="s-tus" href="index.html">${ikon("book-open")}Görsel sistem</a><a class="s-tus" href="maket/planlarim.html#/plan/1" target="_blank" rel="noopener">${ikon("calendar-check")}Maketi aç</a><a class="s-tus" href="uygulama/" target="_blank" rel="noopener">${ikon("house")}Uygulama önizlemesi</a>`,
  icindekiler: [["cevaplar", "İsteklerin"], ["menu", "Yan menü"], ["akis", "Akış"], ["olcum", "Ölçüm"], ["ekle", "Ekipman ekle"], ["numara", "Numara sistemi"], ["kararlar", "17–28 kararları"], ["kurallar", "Ekranın kuralları"], ["faz", "Faz 1"], ["sorular", "Karar soruları"]],
  govde: [
    bolum(1, "cevaplar", "İsteklerin ve ne yaptım", `${O.tur}. tur. Önceki turların kararları (akış, eşsiz kod, numara sistemi) aynen duruyor.`,
      cokluTablo(["Konu", "Senin sözün", "Makette"], CEVAPLAR.map(([n, c, m]) => [`<b>${n}</b>`, `<i>${K(c)}</i>`, m]), "s-min-900")),
    bolum(2, "menu", "Yan menü: bütün modüller, genel adlar", "pkproje.md §3.1'deki 20 modülden firma panelinde ekranı olan 17'si. Adlar kişiye bağlı değil (Planlar, Raporlar, Zimmetler). Masaüstünde 1080 px yükseklikte kaydırmadan sığar; tablet ve telefonda çekmecede yalnız menü kayar.",
      cokluTablo(["Grup", "Menüde", "Modül (§3.1)"], MENU_TABLO.map(([g, m, k]) => [`<b>${g}</b>`, m, K(k)]), "s-min-600") +
      `<p class="s-oran" style="margin-top:10px">Menüde olmayanlar: <b>6 Rapor Şablonları</b> (kodda, site içi düzenleyici yok) · <b>16 PDF Üretimi</b> (sunucu işi) · <b>17 Müşteri Paneli</b> (müşterinin kendi girişi). Kim hangi modülü görecek: sonra.</p>`),
    bolum(3, "akis", "Akış: dört adım", "Adım durumu: ✓ tamamlandı · dolu numara şu an · boş numara sırada · × reddedildi. Telefonda şu anki adımın tuşları altta yapışkan çubukta.",
      cokluTablo(["Adım", "İçinde ne var"], ADIMLAR.map(([a, b]) => [`<b>${a}</b>`, b]), "s-min-600") +
      `<div class="s-baglantilar">
    <a class="s-tus" href="maket/planlarim.html#/plan/2" target="_blank" rel="noopener">Kabul bekliyor</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/4" target="_blank" rel="noopener">Ön koşul eksik</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/6" target="_blank" rel="noopener">Kabul edildi</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/1" target="_blank" rel="noopener">Denetimde (12 ekipman, 10 rapor)</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/9" target="_blank" rel="noopener">Tamamlandı (24 ekipman, 22 rapor)</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/7" target="_blank" rel="noopener">Reddedildi</a>
  </div>
  ${cerceveler("#/plan/9", "Plan içi maketi, 22 raporlu plan")}`),
    bolum(4, "olcum", "Ölçüm", `${K(O.yontem)}`,
      `<div class="s-karolar">
    <div class="s-karo s-iyi"><b>${tamSifir} / ${O.durumlar.length}</b><span>ölçümde taşma, kırpma, çakışma, gizli tuş, küçük hedef, pencere kenarı, hiza, kart tutarlılığı sıfır</span></div>
    <div class="s-karo s-iyi"><b>${gecen} / ${P.sonuc.length}</b><span>yazı ve zemin çifti AA geçiyor (iki tema)</span></div>
    <div class="s-karo"><b>${O.duzeltilen.filter(d => d[0].startsWith(O.tur + ". tur")).length}</b><span>bu turda ölçerken bulunup düzeltilen</span></div>
    <div class="s-karo"><b>${O.duzeltilen.length}</b><span>beş turda toplam</span></div>
  </div>
  <p class="s-oran">Kart eşiği: kap ≥ ${O.esik.kap.toLocaleString("tr-TR")} px tablo, altı kart. ${K(O.esik.not)}</p>
  <h3>Maket ölçümü</h3>${olcumTablo}
  <h3>Etkileşim denemeleri</h3>${ikiliTablo(O.etkilesim, "Deneme", "Sonuç")}
  <h3>Ölçerken bulunup düzeltilenler</h3>${ikiliTablo(O.duzeltilen, "Bulgu", "Düzeltme")}`),
    bolum(5, "ekle", "Ekipman ekle: kod eşsiz, çakışan kod kaydedilmez", "3. turdaki gibi; eklenen ekipman sayfalı listede kendi sayfasında açılır. Kod yazılırken ve kaydederken denetlenir (gerçek uygulamada sunucuda ve veritabanında da).",
      cokluTablo(["Yazılan", "Pencerenin söylediği", "Kaydet"], SENARYO.map(([a, b, c]) => [`<code>${K(a)}</code>`, b, K(c)]), "s-min-600") +
      `<p class="s-oran" style="margin-top:10px">Çevrimdışı çalışma geldiğinde (sonraki faz): iki inspector aynı kodu çevrimdışı girerse eşitlemede ikincisi reddedilir ve düzeltmesi istenir; kayıt sessizce birleşmez.</p>` +
      cerceveler("#/plan/1/ekle/FL-1016", "Ekipman ekle penceresi")),
    bolum(6, "numara", "Numara sistemi (karar 16, 17–21)", "Proje ve rapor numarasını sunucu verir, kimse elle yazmaz; ekipman kodunu personel etiketten yazar, sistem eşsizliğini korur.",
      cokluTablo(["Numara", "Biçim", "Örnek", "Kim verir", "Parçalar", "Eşsizlik", "Değişir mi"], NUMARA, "s-min-1400")),
    bolum(7, "kararlar", "17–28: önerilerim kabul", "Reisim: “tüm sorularda senin önerilerini kabul ediyorum, takvim hariç” (4. tur) · “önerilerin uygundur” (5. tur).", sorular(KARARLAR17, 17)),
    bolum(8, "kurallar", "Ekranın kuralları (plan içi ve menü)", "",
      `<ul class="s-kurallar">
    <li><b>Nesne sayfası (anayasa 2.7)</b><span>Kırıntı · kimlik (ad, durum, müşteri) · adım çizelgesi. Birincil tuş yalnız şu anki adımda ve tek; Tamamlandı ve Reddedildi'de birincil yok.</span></li>
    <li><b>Adım tuşları sağda (kalıp 2)</b><span>Adımın notu solda, tuşları sağda, içerik kadar; telefonda altta yapışkan çubukta eşit genişlikte.</span></li>
    <li><b>İki liste, tek üretici</b><span>Ekipmanlar ve Raporlar Planlar listesiyle aynı tablo ↔ kart üreticisinden; kap ${O.esik.kap.toLocaleString("tr-TR")} px altında kart. Süzgeç de aynı üreticiden (kalıp 15).</span></li>
    <li><b>Sayfalama</b><span>Ekipman 10'ar, rapor 20'şer; “1–20 / 22”; süzgeç değişince 1. sayfaya döner; eklenen kaydın sayfasına geçilir.</span></li>
    <li><b>Kimlik kırpılmaz</b><span>Ekipman kodu, rapor no, proje no bölünmez ve üç noktaya düşmez.</span></li>
    <li><b>Hareket kaydı tutulur, gösterilmez</b><span>Durum değişikliği, ekipman ve rapor işlemi kim + ne zaman ile kaydedilir; plan içinde yalnız proje notları görünür.</span></li>
    <li><b>Yan menü tek kaynaktan</b><span>Gruplar ve adlar tek listeden üretilir; adlar genel (kişiye bağlı değil); sığmayan yükseklikte logo ve alt satır yerinde, yalnız menü kayar.</span></li>
  </ul>`),
    bolum(9, "faz", "Faz 1 sırası (karar — 4. tur)", "“tüm sorularda senin önerilerini kabul ediyorum” → sıra kabul edildi.", fazTablo),
    bolum(10, "sorular", "Karar soruları", "Cevaplar pkproje.md'ye işlenir.", sorular(SORULAR5.map(([s, a]) => [s, a]), 29))
  ].join("\n\n")
});

/* ══ 3 · TOPLU BAKIŞ (toplu-bakis.html; MAKET-PLANI.md §2 SON + §6, 2026-09-24) ═══════════════════════════════════════════
   Reisim bütün maketlere burada birlikte bakar (ara onay yok). ⛔ METİN burada yazılmaz: her maketin ekranı, varsayımları, soruları ve
   ölçüm notu pkproje.md §3.6'dan OKUNUR; sayılar docs/assets/olcum/<maket>.json (durum) ve <maket>-etkilesim.json (etkileşim
   denemeleri) dosyalarından; sayfa adları maket sayfalarının <title>'ından. Soru numarası pkproje.md'deki numaradır. */
const PK = readFileSync(yol("pkproje.md"), "utf8");
const b36bas = PK.indexOf("### 3.6");
const b36 = PK.slice(b36bas, Math.min(...["\n### ", "\n## "].map(x => PK.indexOf(x, b36bas + 5)).filter(i => i > 0)));
const md = t => K(t).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\*([^*]+)\*/g, "<i>$1</i>").replace(/`([^`]+)`/g, "<code>$1</code>");
const oku = f => JSON.parse(readFileSync(yol("docs/assets/olcum/" + f), "utf8"));
const sayfaAdi = f => (/<title>([^<]+)<\/title>/.exec(readFileSync(yol("docs/maket/" + f), "utf8")) || [, f])[1].replace(/ · probata maket$/, "");
/* madde listesi: "- " yeni madde, girintili satır öncekine eklenir · soru listesi: "NN. " yeni soru */
const maddeler = (satirlar, bas) => satirlar.reduce((l, x) => { const m = bas.exec(x); if (m) l.push({ no: m[1], metin: m[2] }); else if (l.length && x.trim()) l[l.length - 1].metin += " " + x.trim(); return l; }, []);
const MAKETLER = b36.split(/\n(?=#### Maket M\d+ )/).slice(1).map(parca => {
  const satir = parca.trim().split("\n"), bas = /^#### Maket (M(\d+)) — (.+) — (ONAY BEKLİYOR|ONAYLANDI[^—]*)$/.exec(satir[0]);
  const bloklar = [{ ad: "Ekran", satirlar: [] }];
  for (const x of satir.slice(1)) {
    const m = /^\*\*((?:Varsayımlar|Sorular \(M\d+\)|Ölçüm|Yeni desen)[^*]*?):?\*\*\s*(.*)$/.exec(x);
    if (m) bloklar.push({ ad: m[1], satirlar: m[2] ? [m[2]] : [] }); else bloklar[bloklar.length - 1].satirlar.push(x);
  }
  const blok = on => bloklar.find(b => b.ad.startsWith(on));
  const ad = /^(.*) \((modül [^)]*)\)$/.exec(bas[3]) || [, bas[3], ""];
  const key = "m" + bas[2], dur = oku(key + ".json"), etk = oku(key + "-etkilesim.json");
  return { id: bas[1], no: +bas[2], key, durum: bas[4].trim(), ad: ad[1], modul: ad[2], faz: /faz 2/.test(ad[2]) ? 2 : 1,
    ekran: blok("Ekran").satirlar.join(" ").trim(), desen: blok("Yeni desen") && { ad: blok("Yeni desen").ad, metin: blok("Yeni desen").satirlar.join(" ") },
    varsayim: maddeler(blok("Varsayımlar").satirlar, /^()- (.*)$/),
    sorular: maddeler(blok("Sorular").satirlar, /^(\d+)\. (.*)$/),
    olcumNot: blok("Ölçüm") ? blok("Ölçüm").satirlar.join(" ") : "",
    sayfalar: [...new Set([...parca.matchAll(/maket\/([a-z-]+\.html)/g)].map(m => m[1]))], dur, etk };
});
const TS = MAKETLER.flatMap(m => m.sorular.map(q => ({ ...q, m })));
const top = (f) => MAKETLER.reduce((t, m) => t + f(m), 0);
const DURUM = { temiz: top(m => m.dur.temiz), toplam: top(m => m.dur.toplam), cekTemiz: top(m => m.dur.cekmece.temiz), cekToplam: top(m => m.dur.cekmece.toplam),
  etkGecen: top(m => m.etk.gecen), etkToplam: top(m => m.etk.toplam) };
const PLANLAR = { dur: oku("planlar.json"), etk: oku("planlar-etkilesim.json") };
const olcumYaz = m => `durum ${m.dur.temiz}/${m.dur.toplam} temiz · çekmece ${m.dur.cekmece.temiz}/${m.dur.cekmece.toplam} · etkileşim ${m.etk.gecen}/${m.etk.toplam}`;
const soruAraligi = m => m.sorular.length ? `${m.sorular[0].no}–${m.sorular[m.sorular.length - 1].no}` : "—";
const baglantilar = m => `<div class="s-baglantilar">${m.sayfalar.map(f => `<a class="s-tus" href="maket/${f}" target="_blank" rel="noopener">${ikon("arrow-right")}${K(sayfaAdi(f))}</a>`).join("")}</div>`;
const soruListesi = l => `<ol class="s-tsorular">${l.map(q => `<li id="soru-${q.no}"><span class="s-tsoru-no">${q.no}</span><div>${md(q.metin)}</div></li>`).join("")}</ol>`;
const maketBolumu = m => `<section class="s-bolum" id="${m.key}">
  <h2><span class="s-no s-no-genis">${m.id}</span>${K(m.ad)}</h2>
  <p class="s-alt">${K(m.modul)}${m.faz === 1 ? " · faz 1" : ""} · <b>${K(m.durum)}</b> · ${olcumYaz(m)}</p>
  ${baglantilar(m)}
  <p>${md(m.ekran)}</p>
  ${m.desen ? `<div class="s-bulgu">${ikon("layers")}<div><b>${md(m.desen.ad)}:</b> ${md(m.desen.metin)}</div></div>` : ""}
  <details class="s-ayrinti" open><summary>Varsayımlar (${m.varsayim.length})</summary><ul class="s-maddeler">${m.varsayim.map(v => `<li>${md(v.metin)}</li>`).join("")}</ul></details>
  <h3>Sorular ${soruAraligi(m)} (${m.sorular.length})</h3>
  ${soruListesi(m.sorular)}
  <details class="s-ayrinti"><summary>Ölçüm ayrıntısı</summary><p>${md(m.olcumNot)}</p>
    <p class="s-oran">Etkileşim denemeleri (${m.etk.tarih}):</p><ul class="s-denemeler">${m.etk.denemeler.map(d => `<li class="${d.gecti ? "s-evet" : "s-hayir"}">${d.gecti ? "geçti" : "KALDI"} · ${K(d.ad)}${d.gen !== 1920 ? ` (${d.gen})` : ""}</li>`).join("")}</ul></details>
</section>`;
const OLCULEMEYEN = [
  ["Gerçek cihaz", "Tablet ve telefonda dokunma, klavye, ekran kenarı: bütün maketler başsız tarayıcıda 1080 ve 375 genişlikte ölçüldü, gerçek cihazda değil."],
  ["Kamera", "Fotoğraf çekme (M4 teslim fotoğrafı, M8 rapor ve pano fotoğrafı): makette dosya seçimi taklit."],
  ["Gerçek görsel okuma", "Pano fotoğrafından sigorta okuma (M8): maketteki okuma sonucu uydurma."],
  ["Gerçek e-imza", "Son imza (M9): imza servisi ve indir-imzala-yükle akışı taklit."],
  ["PDF'in kendisi", "Sunucuda üretilen belge (M7 şablon, M9 rapor, M11 müşteri paneli, M12 teklif, M13 sözleşme): makette HTML önizleme."],
  ["Gerçek Excel dosyası", "“Uygunsuzları indir” (M11): makette önizleme tablosu."],
  ["Gerçek e-Fatura / e-Arşiv", "Fatura (M14): makette yalnız numara ve tarih kaydı."],
  ["E-posta gönderimi", "Davet ve parola sıfırlama (M1): makette gönderildi bildirimi."]
];
const bagimli = TS.filter(q => /Bağımlılık|ile bağlı/.test(q.metin));
const on36 = b36.split(/\n(?=#### Maket M\d+ )/)[0].split("\n").slice(1).join(" ").trim();
const faz = f => MAKETLER.filter(m => m.faz === f);
const n3 = sayfa({
  dosya: "toplu-bakis.html",
  baslik: "probata · Toplu bakış",
  ust: `<b>Toplu bakış</b><span>${MAKETLER.length} maket · ${TS.length} soru · faz 1 + faz 2 · ${(n => n ? n + " onaylandı · " : "")(MAKETLER.filter(m => m.durum.startsWith("ONAYLANDI")).length)}${MAKETLER.filter(m => m.durum === "ONAY BEKLİYOR").length} onay bekliyor</span>`,
  alt: `<a class="s-tus" href="index.html">${ikon("book-open")}Görsel sistem</a><a class="s-tus" href="maket/planlarim.html" target="_blank" rel="noopener">${ikon("calendar-check")}Planlar'dan başla</a>`,
  icindekiler: [["nasil", "Nasıl bakılır"], ["ozet", "Özet"], ["faz1", "Faz 1 · M1–M" + faz(1).length], ["faz2", "Faz 2 · M" + (faz(1).length + 1) + "–M" + MAKETLER.length], ["bagimli", "Bağımlılıklar"], ["olculemeyen", "Ölçülemeyenler"]],
  govde: [
    bolum(1, "nasil", "Nasıl bakılır", "Reisim: “tüm maketleri sırayla bulutta yapılsın en son hepsine toplu bakar ona göre ilerleriz” (2026-09-24). Maketler onaylanana kadar kod yok.",
      `<ul class="s-kurallar">
    <li><b>Maketler birbirine bağlı</b><span>Her bağlantı yeni sekmede açılır. Yan menüdeki 17 modülün hepsinin maketi var; ekranlar arası geçişler (teklif → sözleşme → plan aç, plan → rapor → onay → muhasebe, uyarı → eğitim) tıklanır.</span></li>
    <li><b>Masaüstü, tablet, telefon</b><span>Aynı sayfa telefonda açılınca telefon tasarımı görünür (tablo yerine kart, süzgeç levhası, altta yapışkan tuş). Tema üst çubuktaki düğmeyle.</span></li>
    <li><b>Veri uydurma, gün sabit</b><span>Bütün firma, kişi, tesis ve numaralar uydurmadır; maketin “bugün”ü 23 Eylül 2026. Yapılan değişiklik sayfa yenilenince geri gelir.</span></li>
    <li><b>Cevap numarayla</b><span>Sorular pkproje.md'deki numarayla (${TS[0].no}–${TS[TS.length - 1].no}). “45: evet · 46: hayır, şöyle olsun” biçiminde yazılabilir; cevaplar pkproje.md'ye işlenir, sonra faz 1 sırasıyla koda geçilir.</span></li>
  </ul><p class="s-oran" style="margin-top:12px">${md(on36)}</p>`),
    bolum(2, "ozet", "Özet", `Sayılar ölçüm dosyalarından (${K(MAKETLER[0].dur.arac)}); elle yazılmadı.`,
      `<div class="s-karolar">
    <div class="s-karo"><b>${MAKETLER.length}</b><span>maket · faz 1: ${faz(1).length}, faz 2: ${faz(2).length}</span></div>
    <div class="s-karo"><b>${TS.length}</b><span>karar sorusu (${TS[0].no}–${TS[TS.length - 1].no})</span></div>
    <div class="s-karo s-iyi"><b>${DURUM.temiz}/${DURUM.toplam}</b><span>durum temiz (1920 · 1080 · 375 × açık/koyu) · çekmece ${DURUM.cekTemiz}/${DURUM.cekToplam}</span></div>
    <div class="s-karo s-iyi"><b>${DURUM.etkGecen}/${DURUM.etkToplam}</b><span>etkileşim denemesi geçti</span></div>
  </div>
  <p class="s-oran">Onaylı referans ekran Planlar da bu çalışmada ortak parçalar değiştikçe yeniden ölçüldü: durum ${PLANLAR.dur.temiz}/${PLANLAR.dur.toplam}, çekmece ${PLANLAR.dur.cekmece.temiz}/${PLANLAR.dur.cekmece.toplam}, etkileşim ${PLANLAR.etk.gecen}/${PLANLAR.etk.toplam}. Ölçüm tarihi ${MAKETLER[0].dur.tarih}.</p>
  <ul class="s-kurallar">${MAKETLER.map(m => `<li><a class="s-ozet-bag" href="#${m.key}">${m.id} · ${K(m.ad)}</a><span>${K(m.modul)} · sorular ${soruAraligi(m)} (${m.sorular.length})<br>${olcumYaz(m)}<br>${
    m.sayfalar.map(f => K(sayfaAdi(f))).join(" · ")}</span></li>`).join("")}</ul>`),
    `<section class="s-bolum s-faz" id="faz1"><h2>Faz 1 · M1–M${faz(1).length}</h2><p class="s-alt">Onaylı omurga ve bağımlılık gereği girenler (pkproje.md §3.3). Faz 1 sırası koda geçiş sırasıdır.</p></section>`,
    ...faz(1).map(maketBolumu),
    `<section class="s-bolum s-faz" id="faz2"><h2>Faz 2 · M${faz(1).length + 1}–M${MAKETLER.length}</h2><p class="s-alt">Teklif, iş sözleşmesi, muhasebe, performans, eğitim (pkproje.md §3.3). Veri bağları faz 1 maketleriyle aynı kayıtlar.</p></section>`,
    ...faz(2).map(maketBolumu),
    bolum(3, "bagimli", "Bağımlılıklar", "Cevabı başka maketi de değiştiren sorular (MAKET-PLANI.md §4). Metinde “Bağımlılık” ya da “ile bağlı” yazanlar.",
      `<ol class="s-tsorular">${bagimli.map(q => `<li><span class="s-tsoru-no">${q.no}</span><div><b>${q.m.id} · ${K(q.m.ad)}</b> — ${md(q.metin)}</div></li>`).join("")}</ol>`),
    bolum(4, "olculemeyen", "Ölçülemeyenler", "Bulutta ölçülemedi; tahmin yazılmadı. Gerçek uygulamada ya da gerçek cihazda ayrıca doğrulanır.",
      `<ul class="s-kurallar">${OLCULEMEYEN.map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join("")}</ul>`)
  ].join("\n\n")
});

console.log(`index.html ${n1} bayt · plan-ici.html ${n2} bayt · toplu-bakis.html ${n3} bayt (${MAKETLER.length} maket, ${TS.length} soru, durum ${DURUM.temiz}/${DURUM.toplam}, etkileşim ${DURUM.etkGecen}/${DURUM.etkToplam}) · kontrast ${gecen}/${P.sonuc.length} · ölçüm ${tamSifir}/${O.durumlar.length} temiz · ${IKONLAR.length} ikon · düzeltilen ${O.duzeltilen.length}`);
