/* SUNUM ÜRETİCİSİ — iki sayfa (2026-09-23, 4. tur):
     docs/index.html     görsel sistem (reisim'in 1–8 kararları işlenmiş hâli; 4. turda yükseklik ve yazı ölçeği)
     docs/plan-ici.html  plan içi akışı: adımlar, kontrol listesi, sayfalama, süzgeç, numara sistemi (4. tur sunumu)
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
  ["Üç bant ve 40 / 48 px denetim yüksekliği?", "Telefon < 768 · tablet 768–1279 · masaüstü ≥ 1280.", "Karar: uygun. 4. turda reisim: “her şey çok büyük” → 34 / 44 px, gövde yazısı 14 / 15 px (bantlar aynı)."],
  ["Süzgeç düzeni", "Reisim: “kurallara göre düzenle”.", "Uygulandı: kalıp 15'in sırası — arama → çipler → ve/veya → seçiciler + Temizle sağda; sığmayınca seçiciler + Temizle birlikte alt satıra."],
  ["Karar penceresi 520 px", "Reisim: “anayasa ve kuralların dışına çıkmadan uydur”.", "Uygulandı: pencerenin içindeki her kutu pencereyi doldurur (ölçüldü, kenar 0); tuşlar içerik kadar; × ve Esc; telefonda alttan levha, tuş çubuğu yapışkan. Genişlik işin içeriğinden: karar 520, iki sütunlu form 760."],
  ["Planlarım referans olarak dondurulsun mu?", "Reisim: “anlamadım” → açıklandı, 25. soru olarak yeniden soruldu.", "Karar (4. tur, önerim kabul): bu tur onaylanınca Planlarım + plan içi dondurulur, sonra iskelet."],
  ["Faz 1 sırası", "Reisim: “faz 1'i buradan bana yaz” → yazıldı.", "Karar (4. tur): “tüm sorularda senin önerilerini kabul ediyorum” → aşağıdaki sıra."]
];
const n1 = sayfa({
  dosya: "index.html",
  baslik: "probata · Görsel sistem",
  ust: `<b>Görsel sistem</b><span>Kararlar işlendi · ${O.tarih} · <a href="plan-ici.html">Plan içi sunumu (${O.tur}. tur) →</a></span>`,
  alt: `<a class="s-tus" href="plan-ici.html">${ikon("file-text")}Plan içi sunumu</a><a class="s-tus" href="maket/planlarim.html" target="_blank" rel="noopener">${ikon("calendar-check")}Maketi aç</a>`,
  icindekiler: [["karar", "Kararlar"], ["olcum", "Ölçüm"], ["renk", "Renk sistemi"], ["birincil", "Birincil tuş"], ["yazi", "Yazı ve ikon"], ["esik", "Eşikler"], ["ekran", "Referans ekran"], ["kurallar", "Ekranın kuralları"], ["faz", "Faz 1"]],
  govde: [
    bolum(1, "karar", "Kararlar (reisim 2026-09-23)", "Marka renkleri, logo, Sora ve iki tema reisim'in kararıydı; üstüne kurulan görsel sistemin sekiz sorusu da cevaplandı.",
      sorular(KARAR_GORSEL) + `<p class="s-oran" style="margin-top:12px">Planlarım ve plan içiyle ilgili 9–25. cevaplar ve 4. turdaki akış: <a href="plan-ici.html">plan içi sunumu</a>.</p>`),
    bolum(2, "olcum", "Ölçüm", "Tahmin yok. Kontrast gerçek değişken dosyasından hesaplandı; maket yerel sunucuda, üç genişlik ve iki temada ölçüldü.",
      `<div class="s-karolar">
    <div class="s-karo s-iyi"><b>${gecen} / ${P.sonuc.length}</b><span>yazı ve zemin çifti WCAG AA eşiğini geçiyor (iki tema)</span></div>
    <div class="s-karo s-iyi"><b>${tamSifir} / ${O.durumlar.length}</b><span>maket ölçümünde taşma, kırpma, çakışma, gizli tuş, küçük hedef sıfır</span></div>
    <div class="s-karo s-iyi"><b>${TR.length} / ${TR.length}</b><span>Türkçe harf Sora'da var</span></div>
    <div class="s-karo"><b>${O.duzeltilen.length}</b><span>dört turda ölçerken bulunup düzeltilen hata</span></div>
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
    <div class="s-olcek-satir"><code>Sayfa başlığı · 20 / 700 (telefonda 18)</code><span style="font-size:20px;font-weight:700">Planlarım</span></div>
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
    <li><b>Denetim yüksekliği</b><span>Fareyle 34 px, dokunmatikte 44 px (4. tur): tuş, çip, arama, seçici, sayfa tuşu, menü satırı, form alanı, sekme.</span></li>
    <li><b>Süzgeç (kalıp 15)</b><span>Arama → çipler → ve/veya → seçiciler + Temizle sağda; sığmayınca seçiciler + Temizle birlikte alt satıra. Telefonda seçiciler levhada.</span></li>
    <li><b>Liste tek üreticiden</b><span>Kap ${O.esik.kap.toLocaleString("tr-TR")} px'in altında aynı tablo karta döner; plan listesi, ekipman ve rapor listeleri aynı üreticiden.</span></li>
    <li><b>Dürüst sayaç</b><span>Süzgeç açıkken “3 / 9”; hesaplanamayan sayı “—”, sıfır değil; yükleme hatası “yüklenemedi”, “bulunamadı” değil.</span></li>
    <li><b>Kırpma</b><span>Serbest metin üç nokta + tam metin başlıkta; kimlik (proje no, rapor no, ekipman kodu), sayı ve etiket kırpılmaz.</span></li>
    <li><b>Pencere</b><span>İçindeki her kutu pencereyi doldurur; × ve Esc kapatır; telefonda alttan levha, tuş çubuğu yapışkan ve sonda hiçbir alanı örtmez.</span></li>
    <li><b>Seçim alanı (kalıp 19)</b><span>Cihazın kendi açılır listesi yok; sekizi aşan listede yazarak arama (ekipman türü: 14).</span></li>
    <li><b>Durum rozeti</b><span>Beş plan durumu ve üç rapor durumu; hepsi 4,5 : 1 üstü.</span></li>
  </ul>`),
    bolum(9, "faz", "Faz 1 sırası (karar — 4. tur)", "Her adım kendinden öncekine dayanır; bağlantı kuralları (pkproje.md §3.2) bu sırayı zorunlu kılıyor.", fazTablo)
  ].join("\n\n")
});

/* ══ 2 · PLAN İÇİ (plan-ici.html) — 4. tur sunumu: akış ═════════════════════════════════════════════════ */
/* ölçülen satır yüksekliği olcum.json'dan (elle yazılmaz); 69 / 66 / 1.180 3. turun kayıtlı ölçüsü */
const satirY = gor => O.durumlar.find(d => d.gen === 1920 && d.tema === "acik" && d.gorunum === gor).satirY;
const CEVAPLAR = [
  ["Akış", "planlandı, plan onaylandı, kontrol listesi… akışta takip edilebilir, iş de yapılabilir", "Plan içi dikey adım çizelgesi: Planlandı → Kabul → Denetim (kontrol listesi) → Tamamlama. Her adımda durum, kim, ne zaman; şu anki adımın tuşları adımın içinde."],
  ["17–25", "tüm sorularda senin önerilerini kabul ediyorum", "Kararlar bölüm 7'de, pkproje.md'ye işlendi."],
  ["Takvim", "takvim hariç, onu istemiyorum, yapma", "Yapılmadı; sorulardan çıktı."],
  ["Sayfalama", "ekipmanlar ve raporlar 10 taneden sonra diğer sayfaya geçsin", "İki listede 10'ar kayıt; “1–10 / 12” ve sayfa tuşları. Eklenen ekipmanın sayfasına geçilir."],
  ["Boyut", "bizim maketimizde her şey çok büyük", `Denetim yüksekliği 40 / 48 → 34 / 44 px; gövde yazısı 15 / 16 → 14 / 15 px; satır 69 → ${satirY("liste")} px (liste), 66 → ${satirY("plan · denetimde")} px (plan içi, 1920'de ölçüldü). Kart eşiği 1.180 → ${O.esik.kap.toLocaleString("tr-TR")} px: tablette de tablo.`],
  ["Süzgeç", "filtreleme yok", "Ekipman ve rapor listelerine süzgeç: arama + çipler (ve / veya) + seçiciler. Planlarım'la aynı üretici (kalıp 15)."],
  ["Firma adı", "muayene kuruluşu ismi sol üstte yazmasın", "Üst çubuktan kalktı."]
];
const ADIMLAR = [
  ["1 · Planlandı", "Plan bilgisi tek listede: proje no · başlangıç · adres · inspector · İSG-KATİP · açıklama. <b>Kapsam</b>: tür başına planlanan ve plandaki ekipman sayısı; kabul bekleyen planda açık, sonra katlı."],
  ["2 · Kabul", "<b>Tarafsızlık ve çıkar çatışması beyanı</b> (TS EN ISO/IEC 17020); Kabul et beyanı onaylar. Reddet gerekçe ister. İSG-KATİP ön koşulu eksikse Kabul et kapalı, nedeni yanında (karar 24)."],
  ["3 · Denetim", "<b>Kontrol listesi</b>: Ekipmanlar (kod · tür · konum · branş · önceki kontrol · rapor · Rapor oluştur) ve Raporlar (no · ekipman · sonuç · durum · oluşturuldu). İkisinde süzgeç ve 10'ar sayfa. Ekipman ekle yalnız Denetimde."],
  ["4 · Tamamlama", "Tamamla; raporu olmayan ekipman engel değil, sayısı yazılır (karar 11). Tamamlanınca raporlar düzenlenir, ekipman eklemek için tamamlama geri alınır (karar 12)."],
  ["Notlar ve hareketler", "Proje notu (planlama ekibi görür) ve her hareket: kim, ne zaman, ne. Son 6, “Tümünü göster”."]
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
  ["Referans ekran dondurulsun mu?", "Bu tur onaylanınca Planlarım + plan içi dondurulur, sonra iskelet.", "Karar: önerim kabul (onay soru 28'de)."]
];
const SORULAR4 = [
  ["Tarafsızlık beyanının metni nereden gelsin?", "Önerim: firma ayarı (kalite el kitabındaki metin); boşsa maketteki varsayılan metin. Kabul anında metnin o sürümü hareket kaydına yazılır."],
  ["Proje notunu kimler yazar, kimler görür?", "Önerim: plandaki inspector'lar ve planlama ekibi yazar ve görür; müşteri görmez. Not silinmez, düzeltme yeni notla."],
  ["Bu tur uygun mu?", "Uygunsa Planlarım + plan içi referans ekran olarak dondurulur (34 / 44 px, kap 960, sayfa 10 kalıba yazılır) ve iskelet kalemi açılır (karar 25)."]
];
const n2 = sayfa({
  dosya: "plan-ici.html",
  baslik: "probata · Plan içi akışı",
  ust: `<b>Plan içi: akış, kontrol listesi, sayfalama</b><span>${O.tarih} · ${O.tur}. tur · reisim'in onayına sunulur · <a href="index.html">Görsel sistem →</a></span>`,
  alt: `<a class="s-tus" href="index.html">${ikon("book-open")}Görsel sistem</a><a class="s-tus" href="maket/planlarim.html#/plan/1" target="_blank" rel="noopener">${ikon("calendar-check")}Maketi aç</a>`,
  icindekiler: [["cevaplar", "İsteklerin"], ["neden", "Neden akış"], ["akis", "Akış"], ["olcum", "Ölçüm"], ["ekle", "Ekipman ekle"], ["numara", "Numara sistemi"], ["kararlar", "17–25 kararları"], ["kurallar", "Ekranın kuralları"], ["faz", "Faz 1"], ["sorular", "Karar soruları"]],
  govde: [
    bolum(1, "cevaplar", "İsteklerin ve ne yaptım", "4. tur. 9–16 cevapları ve 3. tur (ekipman / rapor ayrımı, eşsiz kod) bu turda aynen duruyor.",
      cokluTablo(["Konu", "Senin sözün", "Makette"], CEVAPLAR.map(([n, c, m]) => [`<b>${n}</b>`, `<i>${K(c)}</i>`, K(m)]), "s-min-900")),
    bolum(2, "neden", "Neden akış", "3. turdaki plan içi doğru bilgiyi taşıyordu ama takibi zordu.",
      `<ul class="s-kurallar">
    <li><b>Aşama görünmüyordu</b><span>Planın hangi aşamada olduğu ve sırada ne olduğu yalnız rozetten anlaşılıyordu. Şimdi dört adım yukarıdan aşağı; biten ✓, şu anki dolu numara, sıradaki boş.</span></li>
    <li><b>Tuş bağlamsızdı</b><span>Birincil tuş sayfanın üstündeydi. Şimdi ait olduğu adımın içinde, sağda: Kabul adımında Kabul et / Reddet, Denetim'de Denetime başla, Tamamlama'da Tamamla.</span></li>
    <li><b>Kontrol listesi dağınıktı</b><span>Ekipmanlar ve raporlar ayrı bölümlerdeydi. Şimdi ikisi Denetim adımının içinde, alt alta.</span></li>
    <li><b>Uzun listeler, süzgeç yok</b><span>20 ekipmanlı planda sayfa uzuyordu. Şimdi 10'ar sayfa ve her listede süzgeç.</span></li>
  </ul>`),
    bolum(3, "akis", "Akış: dört adım", "Adım durumu: ✓ tamamlandı · dolu numara şu an · boş numara sırada · × reddedildi. Telefonda şu anki adımın tuşları altta yapışkan çubukta.",
      cokluTablo(["Adım", "İçinde ne var"], ADIMLAR.map(([a, b]) => [`<b>${a}</b>`, b]), "s-min-600") +
      `<div class="s-baglantilar">
    <a class="s-tus" href="maket/planlarim.html#/plan/2" target="_blank" rel="noopener">Kabul bekliyor</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/4" target="_blank" rel="noopener">Ön koşul eksik</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/6" target="_blank" rel="noopener">Kabul edildi</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/1" target="_blank" rel="noopener">Denetimde (12 ekipman, iki sayfa)</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/9" target="_blank" rel="noopener">Tamamlandı (13 ekipman, 12 rapor)</a>
    <a class="s-tus" href="maket/planlarim.html#/plan/7" target="_blank" rel="noopener">Reddedildi</a>
  </div>
  ${cerceveler("#/plan/1", "Plan içi maketi")}`),
    bolum(4, "olcum", "Ölçüm", `${K(O.yontem)}`,
      `<div class="s-karolar">
    <div class="s-karo s-iyi"><b>${tamSifir} / ${O.durumlar.length}</b><span>ölçümde taşma, kırpma, çakışma, gizli tuş, küçük hedef, pencere kenarı, hiza, kart tutarlılığı sıfır</span></div>
    <div class="s-karo s-iyi"><b>${gecen} / ${P.sonuc.length}</b><span>yazı ve zemin çifti AA geçiyor (iki tema)</span></div>
    <div class="s-karo"><b>${O.duzeltilen.filter(d => d[0].startsWith(O.tur + ". tur")).length}</b><span>bu turda ölçerken bulunup düzeltilen</span></div>
    <div class="s-karo"><b>${O.duzeltilen.length}</b><span>dört turda toplam</span></div>
  </div>
  <p class="s-oran">Kart eşiği: kap ≥ ${O.esik.kap.toLocaleString("tr-TR")} px tablo, altı kart. ${K(O.esik.not)}</p>
  <h3>Maket ölçümü</h3>${olcumTablo}
  <h3>Etkileşim denemeleri</h3>${ikiliTablo(O.etkilesim, "Deneme", "Sonuç")}
  <h3>Ölçerken bulunup düzeltilenler</h3>${ikiliTablo(O.duzeltilen, "Bulgu", "Düzeltme")}`),
    bolum(5, "ekle", "Ekipman ekle: kod eşsiz, çakışan kod kaydedilmez", "3. turdaki gibi; bu turda eklenen ekipman sayfalı listede kendi sayfasında açılır. Kod yazılırken ve kaydederken denetlenir (gerçek uygulamada sunucuda ve veritabanında da).",
      cokluTablo(["Yazılan", "Pencerenin söylediği", "Kaydet"], SENARYO.map(([a, b, c]) => [`<code>${K(a)}</code>`, b, K(c)]), "s-min-600") +
      `<p class="s-oran" style="margin-top:10px">Çevrimdışı çalışma geldiğinde (sonraki faz): iki inspector aynı kodu çevrimdışı girerse eşitlemede ikincisi reddedilir ve düzeltmesi istenir; kayıt sessizce birleşmez.</p>` +
      cerceveler("#/plan/1/ekle/FL-1016", "Ekipman ekle penceresi")),
    bolum(6, "numara", "Numara sistemi (karar 16, 17–21)", "Proje ve rapor numarasını sunucu verir, kimse elle yazmaz; ekipman kodunu personel etiketten yazar, sistem eşsizliğini korur.",
      cokluTablo(["Numara", "Biçim", "Örnek", "Kim verir", "Parçalar", "Eşsizlik", "Değişir mi"], NUMARA, "s-min-1400")),
    bolum(7, "kararlar", "17–25: önerilerim kabul", "Reisim: “tüm sorularda senin önerilerini kabul ediyorum, takvim hariç”.", sorular(KARARLAR17, 17)),
    bolum(8, "kurallar", "Ekranın kuralları (plan içi)", "",
      `<ul class="s-kurallar">
    <li><b>Nesne sayfası (anayasa 2.7)</b><span>Kırıntı · kimlik (ad, durum, müşteri) · adım çizelgesi. Birincil tuş yalnız şu anki adımda ve tek; Tamamlandı ve Reddedildi'de birincil yok.</span></li>
    <li><b>Adım tuşları sağda (kalıp 2)</b><span>Adımın notu solda, tuşları sağda, içerik kadar; telefonda altta yapışkan çubukta eşit genişlikte.</span></li>
    <li><b>İki liste, tek üretici</b><span>Ekipmanlar ve Raporlar Planlarım'la aynı tablo ↔ kart üreticisinden; kap ${O.esik.kap.toLocaleString("tr-TR")} px altında kart. Süzgeç de aynı üreticiden (kalıp 15).</span></li>
    <li><b>Sayfalama</b><span>10'ar kayıt; “1–10 / 12”; süzgeç değişince 1. sayfaya döner; eklenen kaydın sayfasına geçilir.</span></li>
    <li><b>Kimlik kırpılmaz</b><span>Ekipman kodu, rapor no, proje no bölünmez ve üç noktaya düşmez.</span></li>
    <li><b>Hareket kaydı</b><span>Her durum değişikliği, ekipman ve rapor işlemi, proje notu kim + ne zaman ile yazılır; aynı dakikadakiler kayıt sırasıyla.</span></li>
    <li><b>Eşit satır</b><span>Tuşlu ve tuşsuz satır aynı yükseklikte; kartlarda aynı roldeki hücre aynı kenar ve boşlukta (ölçüldü).</span></li>
  </ul>`),
    bolum(9, "faz", "Faz 1 sırası (karar — 4. tur)", "“tüm sorularda senin önerilerini kabul ediyorum” → sıra kabul edildi.", fazTablo),
    bolum(10, "sorular", "Karar soruları", "Cevaplar pkproje.md'ye işlenir.", sorular(SORULAR4.map(([s, a]) => [s, a]), 26))
  ].join("\n\n")
});

console.log(`index.html ${n1} bayt · plan-ici.html ${n2} bayt · kontrast ${gecen}/${P.sonuc.length} · ölçüm ${tamSifir}/${O.durumlar.length} temiz · ${IKONLAR.length} ikon · düzeltilen ${O.duzeltilen.length}`);
