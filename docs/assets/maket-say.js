/* ══ probata MAKET — S.A.Y saha asistanı (Z2, 2026-10-02) · ONAY BEKLİYOR ══════════════════════════════════════════════════════════════
   Reisim (2026-10-01, §9 kırk altıncı tur): "rapor sayfasında pop up sohbet tuşu koyup S.A.Y chat diye bir şey yapmayı planlıyorum sadece
   kanul edilip rapor yazılmay başlayan planlarda olsun"; kararlar ARKA-UC.md K1–K3, K6 ve §5.3: firma yapay zekâyı açtıysa görünür (başlangıçta
   kapalı); yalnız açık raporu bilir; ÖNERİ verir, kendisi yazmaz — öneri kartında "Uygula" denince denetçinin seçimiyle aynı yoldan yazılır;
   imza, gönderme, onay, silme yapmaz; sohbet kaydedilmez (sayfadan çıkınca düşer); müşteri adı, adres, kişi adı gönderilmez.
   Yer: rapor eylem çubuğunun solunda düğme (sağ alttaki Kaydet / Onaya gönder ile çakışmasın); panel masaüstü ve tablette sağda yan pencere,
   telefonda tam ekran. Makette cevaplar kurallı (rapordan hesaplanır); serbest soru uygulamada Claude'dan gelir. Her mesaj kişinin bu ayki
   kullanımına (Firma ayarları › Yapay zekâ) yazılır.
   BB6 (2026-10-03, reisim: "bu say botu plan içinde değil her yer de gözükecek şekilde tekrar kurgula ve daha şık bi tasarım yap daha yuvarlak daha
   ilgi çekici olsun"): S.A.Y her sayfada — sağ altta yuvarlak düğme (kabuk yükler; müşteri paneli ve Yönetim'de yok). Rapor ekranında açık raporu
   okur (eksikler, sonuç önerisi); öteki sayfalarda "Beni ne bekliyor?" (kişinin yan menü balonlarından) ve "Bu sayfada ne yapılır?". Kural
   aynı: firma yapay zekâyı açtıysa görünür; öneri verir, kendisi yazmaz.
   Geçmiş kalıcı (2026-10-03, reisim: "her yerden tek boy yönetilir sayfa değiince vs geçmiş silinmez geçmiş olayı önemli"): tek S.A.Y kabukta; sohbet
   ve panelin açık / kapalı hâli sayfa değişince, yenilenince kalır (makette tarayıcı kaydı; uygulamada kişinin hesabında, yalnız kendisi görür).
   Her mesaj hangi sayfada / raporda sorulduğunu taşır; rapor önerisi yalnız o rapor açıkken uygulanır. "Sohbeti temizle" geçmişi siler. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, X = MK.eylem, B = function () { return MK.sayBag; };
  var S = { acik: false, mesaj: [], n: 0 };   /* mesaj: { kim: "ben" | "say", html, yer, rapor, eksik?, oneri?: { id, deger, ad, durum } } */
  var ilkAcik = false;
  MK.kalici("say", function () { return { mesaj: S.mesaj, acik: S.acik }; }, function (d) { if (d && Array.isArray(d.mesaj)) S.mesaj = d.mesaj; ilkAcik = !!(d && d.acik); });
  var yerAd = function () {
    if (S.rapor) return "Rapor " + S.rapor;
    var ad = MK.MODUL === "ana" ? "Ana sayfa" : null;
    (MK.MENU || []).forEach(function (g) { g.ogeler.forEach(function (x) { if (x[2] === MK.MODUL) ad = x[0]; }); });
    return ad || (document.title || "").split(" · ")[0];
  };
  var HIZLI = [["eksik", "Eksik alanlar neler?"], ["sonuc", "Sonuç ne olmalı?"]];   /* AA9: kusur derecesi sorulmadığı için öneri de yok */
  var GENEL = [["bekleyen", "Beni ne bekliyor?"], ["sayfa", "Bu sayfada ne yapılır?"]];
  var raporda = function () { return !!(S.rapor && MK.sayBag && MK.sayBag.rapor()); };   /* düzenlenen rapor açıksa rapor bağlamı */
  var hizli = function () { return raporda() ? HIZLI : GENEL; };
  /* sayfa yardımı (makette kurallı; uygulamada S.A.Y firmanın dökümanları ve ekrandaki kayıtlarla cevaplar) */
  var YARDIM = {
    ana: "Ana sayfa rolünüze göre bugünün işlerini, bekleyenleri ve duyuruları toplar.",
    13: "Planlar: size atanan planlar. Planı açıp tarafsızlık beyanıyla kabul edin; plan gününde ekipmanların raporlarını oluşturun. Planlamacı plan bilgilerini Düzenle ile değiştirirse siz Güncelle'ye basınca planınıza ve taslak raporlarınıza geçer.",
    14: "Raporlar: yazdığınız bütün raporlar. Süzgeçle bulun; Yeni ya da geri gönderilen raporu düzenleyip onaya gönderin.",
    15: "Onaylar: imzanızı ya da onayınızı bekleyen her şey — raporların son imzası, bordro, zimmet, eğitim ve araç tutanakları. Yöneticiyseniz branşınızın onay kuyruğu da burada.",
    20: "Uyarılar: süresi yaklaşan ve geçen işler (kalibrasyon, belge, sözleşme, eğitim).",
    3: "Müşteriler: müşteri ve tesis kartları, müşteri girişi, tesisin ekipmanları (Excel'den toplu yükleme).",
    11: "Teklifler: teklif hazırlayın, müşteriye gönderin; kabul edilen teklif sözleşmeye ve plana gider.",
    12: "Sözleşmeler: firmalar arası iş sözleşmesi ve içindeki İSG-KATİP sözleşme ID'leri (tesis × denetçi).",
    8: "Ölçüm cihazları: kalibrasyon ve ara kontroller; süresi geçen cihaz raporda uyarı verir.",
    9: "Zimmetler: kime hangi cihaz verildi; teslim formu Onaylar'da imzalanır.",
    23: "Araçlar: araç belgeleri, haftalık kilometre ve teslim tutanakları.",
    2: "Personel: kişi kartları, yetkiler, eğitimler, özlük, maaş ve bordrolar.",
    21: "Talepler: izin ve masraf talepleriniz; onaylanınca durumunu burada görürsünüz.",
    18: "Muhasebe: imzalı raporlar → fatura → tahsilat; giderler, gelir-gider ve Maaş bordrosu gönder.",
    19: "Performans: rapor süreleri ve tamamlanma dilimleri.",
    5: "Ekipman türleri: tür kataloğu, kontrol süresi, ölçüm cihazları ve rapor formatı.",
    4: "Dökümanlar: standartlar, talimatlar ve eğitimler.",
    22: "Firma ayarları: künye, imza yöntemi, depolama ve yedek, yapay zekâ, formatlar."
  };

  var anahtarVar = function () { return !MV.yzHazir(MK.BEN) && !MK.cevrimdisi(); };   /* Z4: bağlantı yokken de soru almaz */
  function sinirDoldu() {
    var z = MV.yz(), p = MK.BEN && MV.kisi(MK.BEN), k = MV.YZ_KULLANIM.filter(function (x) { return x.k === MK.BEN; })[0];
    return !!(k && !(p && p.yzAnahtar) && z.sinir !== "" && +z.sinir > 0 && k.usd >= +z.sinir);
  }
  var sayac = function () { MV.yzKullan(MK.BEN, "mesaj"); };   /* bu ayki kullanım: mesaj + yaklaşık harcama */

  /* yuvarlak düğme (BB6): sağ altta, her sayfada; panel açıkken gizli */
  var fab = document.createElement("button");
  fab.type = "button"; fab.className = "a-say-fab"; fab.id = "a-say-fab"; fab.hidden = true; fab.setAttribute("data-eylem", "say-ac"); fab.setAttribute("data-katman", "");
  fab.setAttribute("aria-haspopup", "dialog"); fab.setAttribute("aria-controls", "a-say"); fab.setAttribute("aria-expanded", "false"); fab.setAttribute("aria-label", "S.A.Y — saha asistanı");
  fab.innerHTML = '<span class="a-say-fab-ikon">' + ikon("sparkles") + '</span><span class="a-say-fab-yazi">S.A.Y<small>Asistan</small></span>';
  document.body.appendChild(fab);
  function fabGuncelle() { fab.hidden = !MV.yz().acik || S.acik; fab.setAttribute("aria-expanded", String(S.acik)); document.body.classList.toggle("a-say-var", MV.yz().acik); }
  /* panel kabukta bir kez kurulur (rapor yeniden çizilince silinmesin) */
  var kap = document.createElement("aside");
  kap.className = "a-say"; kap.id = "a-say"; kap.hidden = true; kap.setAttribute("data-katman", "");   /* içeriğin üstünde katman (ölçüm bunu bilir) */
  kap.setAttribute("role", "dialog"); kap.setAttribute("aria-labelledby", "a-say-baslik");
  document.body.appendChild(kap);

  function mesajHtml(m, i, l) {
    var yer = m.yer && (i === 0 || l[i - 1].yer !== m.yer) ? '<li class="a-say-yer">' + kacis(m.yer) + "</li>" : "";   /* yer değişince ayraç */
    if (m.kim === "ben") return yer + '<li class="a-say-mesaj a-say-ben">' + kacis(m.metin) + "</li>";
    var o = m.oneri, burada = !m.rapor || m.rapor === S.rapor;
    var html = burada ? m.html : m.html.replace(/<button[^>]*data-eylem="say-git"[\s\S]*?<\/button>/g, "");   /* Git yalnız o rapor açıkken */
    return yer + '<li class="a-say-mesaj a-say-o" data-m="' + i + '">' + html + (!o ? "" : '<div class="a-say-oneri" id="a-say-o' + i + '"><p class="a-say-oneri-bas">' + ikon("pencil", "a-ikon-kucuk") + "Öneri</p>" +
      '<p class="a-say-oneri-metin">' + o.ad + "</p>" +
      (o.durum === "uygulandi" ? '<p class="a-say-oneri-durum" tabindex="-1">' + ikon("circle-check", "a-ikon-kucuk") + "Rapora uygulandı</p>"
        : o.durum === "vazgecildi" ? '<p class="a-say-oneri-durum a-say-oneri-red" tabindex="-1">Uygulanmadı</p>'
        : !burada ? '<p class="a-say-oneri-durum a-say-oneri-red">' + kacis(m.rapor) + " raporu açıkken uygulanır</p>"
        : '<div class="a-say-oneri-tuslar">' + MK.tus({ eylem: "say-vazgec", ad: "Vazgeç", sinif: "a-tus-ikincil", veri: { i: i } }) + MK.tus({ eylem: "say-uygula", ad: "Uygula", ikon: "check", veri: { i: i } }) + "</div>") +
      "</div>") + "</li>";
  }
  function ciz() {
    var bos = !S.mesaj.length, anah = anahtarVar();
    var rp = raporda();
    kap.innerHTML = '<div class="a-say-bas"><span class="a-say-avatar">' + ikon("sparkles") + '</span><div class="a-say-kimlik"><h2 id="a-say-baslik">S.A.Y</h2><p class="a-say-alt">' +
        (rp ? "Bu raporu okudum · öneri verir, rapora siz uygularsınız" : "Saha asistanı · sorun, yol göstereyim") + "</p></div>" +
        (S.mesaj.length ? '<button class="a-ikon-tus" type="button" data-eylem="say-temizle" aria-label="Sohbeti temizle" title="Sohbeti temizle">' + ikon("trash-2") + "</button>" : "") +
        '<button class="a-ikon-tus" type="button" data-eylem="say-kapat" aria-label="S.A.Y\'ı kapat">' + ikon("x") + "</button></div>" +
      '<div class="a-say-govde" id="a-say-govde">' +
        (MK.cevrimdisi() ? MK.serit("uyari", "wifi-off", "Bağlantı yok: S.A.Y bağlantı gelince çalışır. Raporu yazmaya devam edebilirsiniz.")
          : !anah ? MK.serit("uyari", "key-round", "API anahtarı girilmedi (Firma ayarları › Yapay zekâ): S.A.Y cevap veremez.") : "") +
        (anah && sinirDoldu() ? MK.serit("uyari", "triangle-alert", "Bu ay kişi başı sınırınız doldu; yönetici Firma ayarları'ndan artırabilir.") : "") +
        (bos ? '<p class="a-say-bos">' + (rp ? "Bu raporu okudum. Eksikleri sorabilir, sonuç için öneri isteyebilirsiniz. Önerileri siz onaylamadan rapora hiçbir şey yazılmaz."
          : "Merhaba! Sizi bekleyen işleri gösterebilir, bu sayfada ne yapılacağını anlatabilirim. Bir rapor açınca o raporu da okurum.") + "</p>" : "") +
        '<ol class="a-say-liste" aria-live="polite">' + S.mesaj.map(mesajHtml).join("") + "</ol></div>" +
      '<div class="a-say-alt-kisim">' +
        '<div class="a-say-hizli">' + hizli().map(function (x) { return '<button class="a-cip" type="button" data-eylem="say-hizli" data-k="' + x[0] + '"' + (anah ? "" : " disabled") + ">" + x[1] + "</button>"; }).join("") + "</div>" +
        '<div class="a-say-yaz"><label class="a-gizli" for="a-say-girdi">S.A.Y\'a sor</label><input class="a-girdi" id="a-say-girdi" autocomplete="off" maxlength="500" placeholder="' + (rp ? "Bu rapor hakkında sorun" : "S.A.Y'a sorun") + '"' + (anah ? "" : " disabled") + ">" +
          '<button class="a-ikon-tus a-say-gonder" type="button" data-eylem="say-gonder" aria-label="Gönder"' + (anah ? "" : " disabled") + ">" + ikon("send") + "</button></div>" +
        '<p class="a-say-not">Müşteri adı, adres ve kişi adları gönderilmez. Sohbet geçmişiniz saklanır, yalnız siz görürsünüz; sayfa değişince silinmez.</p></div>';
    var g = $("a-say-govde"); g.scrollTop = g.scrollHeight;
  }
  function ac(odaksiz) {
    S.acik = true; kap.hidden = false; ciz(); document.body.classList.add("a-say-acik"); fabGuncelle();
    if (odaksiz) return;
    var g = $("a-say-girdi"); (g && !g.disabled ? g : kap.querySelector("[data-eylem=say-kapat]")).focus();
  }
  function kapat() {
    S.acik = false; kap.hidden = true; document.body.classList.remove("a-say-acik"); fabGuncelle(); fab.focus();
  }
  MK.sayAcik = function () { return S.acik; };
  /* rapor her çizilişte: düzenlenen rapor rapor bağlamıdır, öteki (onaydaki) raporda S.A.Y genel kalır; sohbet düşmez (geçmiş kalıcı);
     yapay zekâ kapanınca panel ve düğme kalkar */
  MK.sayGuncelle = function (r, oku) {
    var no = r && !oku ? r.no : null;
    if (no !== S.rapor) { S.rapor = no; S.eksik = null; }
    if (!MV.yz().acik && S.acik) { S.acik = false; kap.hidden = true; document.body.classList.remove("a-say-acik"); }
    else if (S.acik && !kap.contains(document.activeElement)) ciz();   /* açık panel güncel kalır (anahtar, sınır); içinde yazarken yeniden çizilmez */
    fabGuncelle();
  };
  /* yapay zekâ başka sayfada (Firma ayarları) açılıp kapanabilir: her tıklamadan sonra düğme güncellenir */
  document.addEventListener("click", function () { setTimeout(function () { if (!MV.yz().acik && S.acik) kapat(); else fabGuncelle(); }, 0); });
  fabGuncelle();
  if (MK.sayBag) { var r0 = MK.sayBag.rapor(); MK.sayGuncelle(r0, !r0 || r0.durum !== "taslak"); }   /* rapor ekranı: betik kabuktan sonra yüklenir */
  if (ilkAcik && MV.yz().acik) ac(true);   /* önceki sayfada açık bırakılan panel açık gelir (odak çalınmaz) */

  /* ── cevaplar (makette kurallı; uygulamada Claude, aynı araçlarla: raporu oku · öneri ver) ── */
  var bolumAd = function (id) { var h = $(id + "-b"); return h ? h.textContent.trim() : id; };
  function bekleyen() {
    var l = [];
    (MK.MENU || []).forEach(function (g) { g.ogeler.forEach(function (x) {
      var t = MV.takip(x[2], MK.BEN); if (!t || !(t.kirmizi || t.sari)) return;
      var h = MK.sayfaAdresi(x[2]);
      l.push("<li>" + (h ? '<a href="' + h + '">' + kacis(x[0]) + "</a>" : kacis(x[0])) + ": " + [t.kirmizi ? "<b>" + t.kirmizi + "</b> " + t.ad.kirmizi : "", t.sari ? t.sari + " " + t.ad.sari : ""].filter(Boolean).join(" · ") + "</li>");
    }); });
    return l.length ? [{ html: "<p>Sizi bekleyenler:</p><ul class=\"a-say-bekleyen\">" + l.join("") + "</ul>" }] : [{ html: "<p>Şu an sizi bekleyen iş yok.</p>" }];
  }
  function cevap(k) {
    if (k === "bekleyen") return bekleyen();
    if (k === "sayfa") return [{ html: "<p>" + kacis(YARDIM[MK.MODUL] || "Bu sayfada S.A.Y, uygulamada ekrandaki kayıtlara ve firmanın dökümanlarına bakarak yol gösterir.") + "</p>" }];
    if (!raporda()) return [{ html: "<p>Makette serbest soru cevaplanmaz. Uygulamada S.A.Y bu sayfadaki kayıtlara ve firmanın dökümanlarına bakarak cevaplar.</p>" }];
    var b = B(), r = b.rapor(); if (!r) return [{ html: "<p>Açık rapor yok.</p>" }];
    if (k === "eksik") {
      var l = b.eksik(r); if (!l.length) return [{ html: "<p>Zorunlu alanların hepsi dolu; raporu onaya gönderebilirsiniz.</p>" }];
      var g = {}, sira = []; l.forEach(function (x) { if (!g[x.bolum]) { g[x.bolum] = []; sira.push(x.bolum); } g[x.bolum].push(x); });
      S.eksik = l;
      return [{ eksik: l, html: "<p>" + l.length + " zorunlu alan boş:</p><ul class=\"a-say-eksik\">" + sira.map(function (id) {
        return "<li><span>" + kacis(bolumAd(id)) + " · " + g[id].length + " alan</span>" + MK.tus({ eylem: "say-git", ad: "Git", ikon: "arrow-right", sinif: "a-tus-ikincil", veri: { i: l.indexOf(g[id][0]) } }) + "</li>"; }).join("") + "</ul>" }];
    }
    if (k === "sonuc") {
      var o = b.otoSonuc(r), n = b.kusurlar(r).length, ad2 = b.ad2(b.SONUC, o);
      var neden = n ? n + " madde “Uygun değil” işaretli." : b.uygunDegil(r) ? "Ölçüm ya da test sonuçlarında sınır dışı değer var." : "“Uygun değil” madde ve sınır dışı ölçüm yok.";
      if (r.sonuc === o) return [{ html: "<p>" + neden + " Seçtiğiniz sonuç (<b>" + ad2 + "</b>) kriterlerle uyumlu.</p>" }];
      return [{ html: "<p>" + neden + "</p>", oneri: { id: "r-sonuc", deger: o, ad: "Sonuç ve kanaat → <b>" + ad2 + "</b>" } }];
    }
    return [{ html: "<p>Makette serbest soru cevaplanmaz. Uygulamada S.A.Y bu raporun alanlarına, türün kriterlerine ve firmanın dökümanlarına bakarak cevaplar.</p>" }];
  }
  function sor(metin, k) {
    var yer = yerAd(), rp = raporda() ? S.rapor : null;
    S.mesaj.push({ kim: "ben", metin: metin, yer: yer, rapor: rp }); sayac();
    cevap(k).forEach(function (m) { S.mesaj.push({ kim: "say", html: m.html, yer: yer, rapor: rp, eksik: m.eksik || null, oneri: m.oneri ? Object.assign({ durum: "" }, m.oneri) : null }); });
    ciz();
  }

  X["say-ac"] = function () { if (S.acik) kapat(); else ac(); };
  X["say-kapat"] = kapat;
  X["say-hizli"] = function (el) { var k = el.dataset.k; sor(HIZLI.concat(GENEL).filter(function (x) { return x[0] === k; })[0][1], k); var f = kap.querySelector('[data-eylem="say-hizli"][data-k="' + k + '"]'); if (f) f.focus(); };
  X["say-gonder"] = function () {
    var g = $("a-say-girdi"), v = (g.value || "").trim(); if (!v) { g.focus(); return; }
    var k = raporda() && /eksik/i.test(v) ? "eksik" : raporda() && /sonuç|kanaat/i.test(v) ? "sonuc" : /bekle|işim|görev/i.test(v) ? "bekleyen" : /sayfa|ne yap/i.test(v) ? "sayfa" : "serbest";
    sor(v, k); $("a-say-girdi").focus();
  };
  X["say-temizle"] = function () {
    MK.onayla({ baslik: "Sohbeti temizle", metin: "S.A.Y ile bütün sohbet geçmişiniz silinir.", tus: "Temizle", tamam: function () { S.mesaj = []; S.eksik = null; ciz(); var k = kap.querySelector("[data-eylem=say-kapat]"); if (k) k.focus(); MK.bildir("Sohbet temizlendi."); } });
  };
  X["say-git"] = function (el) { var li = el.closest("[data-m]"), m = li && S.mesaj[+li.dataset.m], x = ((m && m.eksik) || S.eksik || [])[+el.dataset.i]; if (!x) return; if (window.matchMedia("(max-width: 767.98px)").matches) kapat(); B().git(x); };
  X["say-uygula"] = function (el) {
    var i = +el.dataset.i, o = S.mesaj[i].oneri; if (!o || o.durum) return;
    MK.onSecim(o.id, o.deger);   /* denetçinin seçimiyle aynı yol: rapor kaydedilmemiş değişiklik olarak işaretlenir */
    o.durum = "uygulandi"; ciz(); var d = kap.querySelector("#a-say-o" + i + " .a-say-oneri-durum"); if (d) d.focus();
    MK.bildir("Öneri rapora uygulandı: " + o.ad.replace(/<[^>]*>/g, "") + ". Kaydetmeyi unutmayın.");
  };
  X["say-vazgec"] = function (el) {
    var i = +el.dataset.i, o = S.mesaj[i].oneri; if (!o || o.durum) return;
    o.durum = "vazgecildi"; ciz(); var d = kap.querySelector("#a-say-o" + i + " .a-say-oneri-durum"); if (d) d.focus();
  };
  kap.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.stopPropagation(); kapat(); }
    else if (e.key === "Enter" && e.target.id === "a-say-girdi") { e.preventDefault(); X["say-gonder"](); }
  });
})();
