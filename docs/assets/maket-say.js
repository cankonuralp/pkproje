/* ══ probata MAKET — S.A.Y saha asistanı (Z2, 2026-10-02) · ONAY BEKLİYOR ══════════════════════════════════════════════════════════════
   Reisim (2026-10-01, §9 kırk altıncı tur): "rapor sayfasında pop up sohbet tuşu koyup S.A.Y chat diye bir şey yapmayı planlıyorum sadece
   kanul edilip rapor yazılmay başlayan planlarda olsun"; kararlar ARKA-UC.md K1–K3, K6 ve §5.3: firma yapay zekâyı açtıysa görünür (başlangıçta
   kapalı); yalnız açık raporu bilir; ÖNERİ verir, kendisi yazmaz — öneri kartında "Uygula" denince denetçinin seçimiyle aynı yoldan yazılır;
   imza, gönderme, onay, silme yapmaz; sohbet kaydedilmez (sayfadan çıkınca düşer); müşteri adı, adres, kişi adı gönderilmez.
   Yer: rapor eylem çubuğunun solunda düğme (sağ alttaki Kaydet / Onaya gönder ile çakışmasın); panel masaüstü ve tablette sağda yan pencere,
   telefonda tam ekran. Makette cevaplar kurallı (rapordan hesaplanır); serbest soru uygulamada Claude'dan gelir. Her mesaj kişinin bu ayki
   kullanımına (Firma ayarları › Yapay zekâ) yazılır. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, X = MK.eylem, B = function () { return MK.sayBag; };
  var S = { acik: false, mesaj: [], n: 0 };   /* mesaj: { kim: "ben" | "say", html, oneri?: { id, deger, ad, durum } } */
  var HIZLI = [["eksik", "Eksik alanlar neler?"], ["derece", "Kusur derecesi öner"], ["sonuc", "Sonuç ne olmalı?"]];

  var anahtarVar = function () { var p = MK.BEN && MV.kisi(MK.BEN); return !!MV.yz().anahtar || !!(p && p.yzAnahtar); };
  function sinirDoldu() {
    var z = MV.yz(), p = MK.BEN && MV.kisi(MK.BEN), k = MV.YZ_KULLANIM.filter(function (x) { return x.k === MK.BEN; })[0];
    return !!(k && !(p && p.yzAnahtar) && z.sinir !== "" && +z.sinir > 0 && k.usd >= +z.sinir);
  }
  function sayac() {   /* bu ayki kullanım: mesaj + yaklaşık harcama (makette sabit 2 sent) */
    var l = MV.YZ_KULLANIM, k = l.filter(function (x) { return x.k === MK.BEN; })[0];
    if (!k) { k = { k: MK.BEN, okuma: 0, mesaj: 0, usd: 0 }; l.push(k); }
    k.mesaj++; k.usd = Math.round((k.usd + 0.02) * 100) / 100; MV.YZ_KULLANIM = l.slice();
  }

  /* panel kabukta bir kez kurulur (rapor yeniden çizilince silinmesin) */
  var kap = document.createElement("aside");
  kap.className = "a-say"; kap.id = "a-say"; kap.hidden = true; kap.setAttribute("data-katman", "");   /* içeriğin üstünde katman (ölçüm bunu bilir) */
  kap.setAttribute("role", "dialog"); kap.setAttribute("aria-labelledby", "a-say-baslik");
  document.body.appendChild(kap);

  function mesajHtml(m, i) {
    if (m.kim === "ben") return '<li class="a-say-mesaj a-say-ben">' + kacis(m.metin) + "</li>";
    var o = m.oneri;
    return '<li class="a-say-mesaj a-say-o">' + m.html + (!o ? "" : '<div class="a-say-oneri" id="a-say-o' + i + '"><p class="a-say-oneri-bas">' + ikon("pencil", "a-ikon-kucuk") + "Öneri</p>" +
      '<p class="a-say-oneri-metin">' + o.ad + "</p>" +
      (o.durum === "uygulandi" ? '<p class="a-say-oneri-durum" tabindex="-1">' + ikon("circle-check", "a-ikon-kucuk") + "Rapora uygulandı</p>"
        : o.durum === "vazgecildi" ? '<p class="a-say-oneri-durum a-say-oneri-red" tabindex="-1">Uygulanmadı</p>'
        : '<div class="a-say-oneri-tuslar">' + MK.tus({ eylem: "say-vazgec", ad: "Vazgeç", sinif: "a-tus-ikincil", veri: { i: i } }) + MK.tus({ eylem: "say-uygula", ad: "Uygula", ikon: "check", veri: { i: i } }) + "</div>") +
      "</div>") + "</li>";
  }
  function ciz() {
    var bos = !S.mesaj.length, anah = anahtarVar();
    kap.innerHTML = '<div class="a-say-bas"><div><h2 id="a-say-baslik">S.A.Y</h2><p class="a-say-alt">Saha asistanı · öneri verir, rapora siz uygularsınız</p></div>' +
        '<button class="a-ikon-tus" type="button" data-eylem="say-kapat" aria-label="S.A.Y\'ı kapat">' + ikon("x") + "</button></div>" +
      '<div class="a-say-govde" id="a-say-govde">' +
        (!anah ? MK.serit("uyari", "key-round", "API anahtarı girilmedi (Firma ayarları › Yapay zekâ): S.A.Y cevap veremez.") : "") +
        (anah && sinirDoldu() ? MK.serit("uyari", "triangle-alert", "Bu ay kişi başı sınırınız doldu; yönetici Firma ayarları'ndan artırabilir.") : "") +
        (bos ? '<p class="a-say-bos">Bu raporu okudum. Eksikleri sorabilir, kusur derecesi ya da sonuç için öneri isteyebilirsiniz. Önerileri siz onaylamadan rapora hiçbir şey yazılmaz.</p>' : "") +
        '<ol class="a-say-liste" aria-live="polite">' + S.mesaj.map(mesajHtml).join("") + "</ol></div>" +
      '<div class="a-say-alt-kisim">' +
        '<div class="a-say-hizli">' + HIZLI.map(function (x) { return '<button class="a-cip" type="button" data-eylem="say-hizli" data-k="' + x[0] + '"' + (anah ? "" : " disabled") + ">" + x[1] + "</button>"; }).join("") + "</div>" +
        '<div class="a-say-yaz"><label class="a-gizli" for="a-say-girdi">S.A.Y\'a sor</label><input class="a-girdi" id="a-say-girdi" autocomplete="off" maxlength="500" placeholder="Bu rapor hakkında sorun"' + (anah ? "" : " disabled") + ">" +
          '<button class="a-ikon-tus a-say-gonder" type="button" data-eylem="say-gonder" aria-label="Gönder"' + (anah ? "" : " disabled") + ">" + ikon("send") + "</button></div>" +
        '<p class="a-say-not">Müşteri adı, adres ve kişi adları gönderilmez. Sohbet kaydedilmez; sayfadan çıkınca silinir.</p></div>';
    var g = $("a-say-govde"); g.scrollTop = g.scrollHeight;
  }
  function ac() {
    S.acik = true; kap.hidden = false; ciz(); document.body.classList.add("a-say-acik");
    var b = document.querySelector('[data-eylem="say-ac"]'); if (b) b.setAttribute("aria-expanded", "true");
    var g = $("a-say-girdi"); (g && !g.disabled ? g : kap.querySelector("[data-eylem=say-kapat]")).focus();
  }
  function kapat() {
    S.acik = false; kap.hidden = true; document.body.classList.remove("a-say-acik");
    var b = document.querySelector('[data-eylem="say-ac"]'); if (b) { b.setAttribute("aria-expanded", "false"); b.focus(); }
  }
  MK.sayAcik = function () { return S.acik; };
  /* rapor her çizilişte: düzenlenen rapor değilse ya da yapay zekâ kapalıysa panel kapanır; başka rapora geçilince sohbet düşer */
  MK.sayGuncelle = function (r, oku) {
    var no = r ? r.no : null;
    if (no !== S.no) { S.mesaj = []; S.no = no; }
    if ((!r || oku || !MV.yz().acik) && S.acik) { S.acik = false; kap.hidden = true; document.body.classList.remove("a-say-acik"); }
    else if (S.acik && !kap.contains(document.activeElement)) ciz();   /* açık panel güncel kalır (anahtar, sınır); içinde yazarken yeniden çizilmez */
  };

  /* ── cevaplar (makette kurallı; uygulamada Claude, aynı araçlarla: raporu oku · öneri ver) ── */
  var bolumAd = function (id) { var h = $(id + "-b"); return h ? h.textContent.trim() : id; };
  function cevap(k) {
    var b = B(), r = b.rapor(); if (!r) return [{ html: "<p>Açık rapor yok.</p>" }];
    if (k === "eksik") {
      var l = b.eksik(r); if (!l.length) return [{ html: "<p>Zorunlu alanların hepsi dolu; raporu onaya gönderebilirsiniz.</p>" }];
      var g = {}, sira = []; l.forEach(function (x) { if (!g[x.bolum]) { g[x.bolum] = []; sira.push(x.bolum); } g[x.bolum].push(x); });
      S.eksik = l;
      return [{ html: "<p>" + l.length + " zorunlu alan boş:</p><ul class=\"a-say-eksik\">" + sira.map(function (id) {
        return "<li><span>" + kacis(bolumAd(id)) + " · " + g[id].length + " alan</span>" + MK.tus({ eylem: "say-git", ad: "Git", ikon: "arrow-right", sinif: "a-tus-ikincil", veri: { i: l.indexOf(g[id][0]) } }) + "</li>"; }).join("") + "</ul>" }];
    }
    if (k === "derece") {
      if (!b.sinifli(r)) return [{ html: "<p>Bu türün formatında kusur derecesi (hafif / ağır) yok.</p>" }];
      var bos = []; r.kriter.forEach(function (x, i) { if (x.c === "uygundegil" && !x.derece) bos.push(i); });
      if (!bos.length) return [{ html: "<p>Derecesi seçilmemiş “Uygun değil” madde yok.</p>" }];
      return [{ html: "<p>" + bos.length + " maddede derece seçilmemiş. Madde metnine göre önerim:</p>" }].concat(bos.slice(0, 5).map(function (i) {
        var ad = b.kriterAd(r, i), agir = /topraklama|koruma|kaçak akım|RCD|fren|halat|kanca|emniyet|kilit|acil/i.test(ad), d = agir ? "agir" : "hafif";
        return { html: "<p>" + (agir ? "Can güvenliğini doğrudan ilgilendiren bir madde." : "Can güvenliğini doğrudan ilgilendirmiyor görünüyor; yerinde gördüğünüz duruma göre siz karar verin.") + "</p>",
          oneri: { id: "r-kd" + i, deger: d, ad: "Madde " + b.kriterNo(r.t, i) + " · " + kacis(ad.length > 60 ? ad.slice(0, 57) + "…" : ad) + " → Kusur derecesi: <b>" + b.ad2(b.DERECE, d) + "</b>" } };
      }));
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
    S.mesaj.push({ kim: "ben", metin: metin }); sayac();
    cevap(k).forEach(function (m) { S.mesaj.push({ kim: "say", html: m.html, oneri: m.oneri ? Object.assign({ durum: "" }, m.oneri) : null }); });
    ciz();
  }

  X["say-ac"] = function () { if (S.acik) kapat(); else ac(); };
  X["say-kapat"] = kapat;
  X["say-hizli"] = function (el) { var k = el.dataset.k; sor(HIZLI.filter(function (x) { return x[0] === k; })[0][1], k); var f = kap.querySelector('[data-eylem="say-hizli"][data-k="' + k + '"]'); if (f) f.focus(); };
  X["say-gonder"] = function () {
    var g = $("a-say-girdi"), v = (g.value || "").trim(); if (!v) { g.focus(); return; }
    var k = /eksik/i.test(v) ? "eksik" : /derece|hafif|ağır/i.test(v) ? "derece" : /sonuç|kanaat/i.test(v) ? "sonuc" : "serbest";
    sor(v, k); $("a-say-girdi").focus();
  };
  X["say-git"] = function (el) { var x = (S.eksik || [])[+el.dataset.i]; if (!x) return; if (window.matchMedia("(max-width: 767.98px)").matches) kapat(); B().git(x); };
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
