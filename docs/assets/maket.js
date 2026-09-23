/* ══ probata MAKET — Planlarım davranışı (2026-09-23) ════════════════════════════════════════════════
   ⛔ Tüm veri UYDURMADIR (anayasa 10.3); gerçek firma/kişi/tesis yok.
   ⛔ "Bugün" sabit: 2026-09-23 — ölçüm her açılışta aynı sonucu versin.
   Durum adresten: ?veri=dolu|bos|hata · ?tema=acik|koyu · ?birincil=yesil|petrol */
(function () {
  "use strict";
  var IKON = "../vendor/lucide-1.47.0/ikonlar.svg#i-";
  var BUGUN = "2026-09-23";
  var HAFTA = ["2026-09-21", "2026-09-27"];
  var YEDI = ["2026-09-23", "2026-09-29"];

  var PLANLAR = [
    { id: 1, tarih: "2026-09-23", bas: "09:00", bit: "12:30", musteri: "Ada Makina San. ve Tic. A.Ş.", tesis: "Merkez Fabrika", yer: "Gebze / Kocaeli", m: 8, e: 4, durum: "kabul" },
    { id: 2, tarih: "2026-09-23", bas: "14:00", bit: "17:00", musteri: "Yıldız Ambalaj A.Ş.", tesis: "Depo 2", yer: "Tuzla / İstanbul", m: 5, e: 0, durum: "kabul" },
    { id: 3, tarih: "2026-09-24", bas: "08:30", bit: "16:30", musteri: "Kuzey Lojistik ve Depolama Hizmetleri A.Ş.", tesis: "Aktarma Merkezi ve Soğuk Hava Deposu", yer: "Çorlu / Tekirdağ", m: 14, e: 6, durum: "bekliyor" },
    { id: 4, tarih: "2026-09-25", bas: "09:00", bit: "13:00", musteri: "Mavi Tekstil Ltd.", tesis: "Boyahane", yer: "Çerkezköy / Tekirdağ", m: 0, e: 9, durum: "bekliyor", eksik: "İSG-KATİP onayı 25 Eyl'de verilmiş; en geç 24 Eyl olmalı." },
    { id: 5, tarih: "2026-09-26", bas: "10:00", bit: "12:00", musteri: "Akın Döküm San. Ltd.", tesis: "Döküm Hattı", yer: "Dilovası / Kocaeli", m: 3, e: 0, durum: "bekliyor", eksik: "Bu tesis için İSG-KATİP kaydı yok." },
    { id: 6, tarih: "2026-09-29", bas: "09:00", bit: "15:00", musteri: "Ege Plastik A.Ş.", tesis: "Üretim Tesisi", yer: "Manisa OSB / Manisa", m: 7, e: 3, durum: "bekliyor" },
    { id: 7, tarih: "2026-09-30", bas: "09:00", bit: "12:00", musteri: "Kaya Yapı Malzemeleri Ltd.", tesis: "Şantiye Deposu", yer: "Başakşehir / İstanbul", m: 2, e: 0, durum: "red", gerekce: "Aynı saatte başka tesiste denetimim var." },
    { id: 8, tarih: "2026-09-22", bas: "09:00", bit: "11:30", musteri: "Deniz Gıda Ltd.", tesis: "Soğuk Hava Deposu", yer: "Pendik / İstanbul", m: 4, e: 0, durum: "tamam" },
    { id: 9, tarih: "2026-09-21", bas: "13:00", bit: "16:00", musteri: "Başak Un Değirmenleri A.Ş.", tesis: "Değirmen", yer: "Lüleburgaz / Kırklareli", m: 6, e: 2, durum: "tamam" }
  ];
  var DURUM = {
    bekliyor: { ad: "Kabul bekliyor", rozet: "a-rozet-bekliyor" },
    kabul: { ad: "Kabul edildi", rozet: "a-rozet-kabul" },
    tamam: { ad: "Tamamlandı", rozet: "a-rozet-tamam" },
    red: { ad: "Reddedildi", rozet: "a-rozet-red" }
  };
  /* Yüklem çipleri: dört durum + bir bağımsız yüklem. ve/veya HEPSİNİ yönetir (kalıp 8). */
  var CIPLER = [
    { k: "bekliyor", ad: "Kabul bekliyor", durum: true, test: function (p) { return p.durum === "bekliyor"; } },
    { k: "kabul", ad: "Kabul edildi", durum: true, test: function (p) { return p.durum === "kabul"; } },
    { k: "tamam", ad: "Tamamlandı", durum: true, test: function (p) { return p.durum === "tamam"; } },
    { k: "red", ad: "Reddedildi", durum: true, test: function (p) { return p.durum === "red"; } },
    { k: "eksik", ad: "Ön koşul eksik", durum: false, test: function (p) { return p.durum === "bekliyor" && !!p.eksik; } }
  ];
  var SECICI = [
    { k: "tarih", ad: "Tarih", secenek: [["tumu", "Tümü"], ["bugun", "Bugün"], ["hafta", "Bu hafta"], ["yedi", "Önümüzdeki 7 gün"]] },
    { k: "musteri", ad: "Müşteri", secenek: [["tumu", "Tümü"]].concat(PLANLAR.map(function (p) { return p.musteri; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a.localeCompare(b, "tr"); })
        .map(function (m) { return [m, m]; })) },
    { k: "brans", ad: "Branş", secenek: [["tumu", "Tümü"], ["m", "Mekanik"], ["e", "Elektrik"]] }
  ];

  var q = new URLSearchParams(location.search);
  var S = { veri: q.get("veri") || "dolu", ara: "", secili: [], kip: "veya", tarih: "tumu", musteri: "tumu", brans: "tumu" };
  var $ = function (id) { return document.getElementById(id); };
  var kacis = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var ikon = function (ad, sinif) { return '<svg class="a-ikon' + (sinif ? " " + sinif : "") + '" aria-hidden="true"><use href="' + IKON + ad + '"/></svg>'; };
  var GUN = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  var AY = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  /* tarih bölünmez (gün adı · gün · ay birlikte kalır); "Bugün" ise dar sütunda alt satıra geçebilir (1080 ölçümü) */
  var gunYaz = function (iso) { var d = new Date(iso + "T12:00:00"); return GUN[d.getDay()] + " " + d.getDate() + " " + AY[d.getMonth()]; };
  var tr = function (s) { return s.toLocaleLowerCase("tr"); };

  function veri() { return S.veri === "dolu" ? PLANLAR : []; }

  /* Taban: çipler HARİÇ her şey (arama + seçiciler). Çip sayıları buradan sayılır (dürüst sayaç, anayasa 2.8). */
  function taban() {
    var a = tr(S.ara.trim());
    return veri().filter(function (p) {
      if (a && tr(p.musteri + " " + p.tesis + " " + p.yer).indexOf(a) < 0) return false;
      if (S.tarih === "bugun" && p.tarih !== BUGUN) return false;
      if (S.tarih === "hafta" && (p.tarih < HAFTA[0] || p.tarih > HAFTA[1])) return false;
      if (S.tarih === "yedi" && (p.tarih < YEDI[0] || p.tarih > YEDI[1])) return false;
      if (S.musteri !== "tumu" && p.musteri !== S.musteri) return false;
      if (S.brans === "m" && !p.m) return false;
      if (S.brans === "e" && !p.e) return false;
      return true;
    });
  }
  function cipGecer(p) {
    if (!S.secili.length) return true;
    var sonuc = S.secili.map(function (k) { return CIPLER.filter(function (c) { return c.k === k; })[0].test(p); });
    return S.kip === "ve" ? sonuc.every(Boolean) : sonuc.some(Boolean);
  }
  function imkansiz() {
    return S.kip === "ve" && S.secili.filter(function (k) { return CIPLER.some(function (c) { return c.k === k && c.durum; }); }).length >= 2;
  }
  /* Sıra: açık işler (bekliyor, kabul) tarihe göre ileri; kapanmışlar (tamam, red) en yeni önce, sonda. */
  function sirala(l) {
    var acik = function (p) { return p.durum === "bekliyor" || p.durum === "kabul"; };
    return l.slice().sort(function (a, b) {
      if (acik(a) !== acik(b)) return acik(a) ? -1 : 1;
      var x = a.tarih + a.bas, y = b.tarih + b.bas;
      return acik(a) ? (x < y ? -1 : x > y ? 1 : 0) : (x > y ? -1 : x < y ? 1 : 0);
    });
  }
  function aktifSecici() { return ["tarih", "musteri", "brans"].filter(function (k) { return S[k] !== "tumu"; }).length; }
  function suzgecVar() { return !!S.ara.trim() || S.secili.length > 0 || aktifSecici() > 0; }

  /* ── ÇİZİM ─────────────────────────────────────────────────────────────────────────────────────── */
  function cizCipler(t) {
    var h = CIPLER.map(function (c) {
      var n = t.filter(c.test).length, bas = S.secili.indexOf(c.k) >= 0;
      return '<button class="a-cip" type="button" data-cip="' + c.k + '" aria-pressed="' + bas + '">' + kacis(c.ad) +
        ' <span class="a-cip-sayi">' + n + "</span></button>";
    }).join("");
    var az = S.secili.length < 2;
    h += '<div class="a-kip" role="group" aria-label="Seçili çipleri birleştirme" aria-disabled="' + az + '"' +
      ' title="veya: seçili çiplerden herhangi birine uyan planlar · ve: hepsine uyan planlar">' +
      '<button type="button" data-kip="veya" aria-pressed="' + (S.kip === "veya") + '"' + (az ? " disabled" : "") + ">veya</button>" +
      '<button type="button" data-kip="ve" aria-pressed="' + (S.kip === "ve") + '"' + (az ? " disabled" : "") + ">ve</button></div>";
    $("a-cipler").innerHTML = h;
  }
  function cizSeciciler() {
    $("a-seciciler").innerHTML = SECICI.map(function (s) {
      var sec = s.secenek.filter(function (o) { return o[0] === S[s.k]; })[0];
      return '<div class="a-secici" data-secici="' + s.k + '">' +
        '<button class="a-secici-tus" type="button" aria-haspopup="listbox" aria-expanded="false" data-secici-ac="' + s.k + '">' +
        '<span class="a-secici-etiket">' + s.ad + '</span><span class="a-secici-deger">' + kacis(sec[1]) + "</span>" + ikon("chevron-down", "a-ikon-kucuk") + "</button>" +
        '<div class="a-secici-liste" role="listbox" aria-label="' + s.ad + '" hidden>' +
        s.secenek.map(function (o) {
          return '<button class="a-secenek" type="button" role="option" aria-selected="' + (o[0] === S[s.k]) + '" data-sec="' + s.k + '" data-deger="' + kacis(o[0]) + '">' +
            ikon("check", "a-ikon-kucuk") + '<span class="a-kirp">' + kacis(o[1]) + "</span></button>";
        }).join("") + "</div></div>";
    }).join("");
    $("a-levha-govde").innerHTML = SECICI.map(function (s) {
      return '<div class="a-levha-grup"><p class="a-levha-grup-ad">' + s.ad + '</p><div class="a-levha-secenekler">' +
        s.secenek.map(function (o) {
          return '<button class="a-cip" type="button" aria-pressed="' + (o[0] === S[s.k]) + '" data-sec="' + s.k + '" data-deger="' + kacis(o[0]) + '">' + kacis(o[1]) + "</button>";
        }).join("") + "</div></div>";
    }).join("");
    var r = $("a-suzgec-rozet"), n = aktifSecici();
    r.hidden = !n; r.textContent = n || "";
  }
  function satir(p) {
    var bugun = p.tarih === BUGUN ? '<span class="a-bugun">Bugün</span>' : "";
    /* sayı adından kopmasın: ad ile sayı arasında bölünmez boşluk; satır yalnız " · " ayracından kırılır */
    var ekp = (p.m ? "Mekanik " + p.m : "") + (p.m && p.e ? " · " : "") + (p.e ? "Elektrik " + p.e : "");
    var tus = "", alt = "";
    if (p.durum === "bekliyor") {
      tus = '<button class="a-tus a-tus-ikincil" type="button" data-eylem="reddet" data-id="' + p.id + '">Reddet</button>' +
        '<button class="a-tus a-tus-birincil" type="button" data-eylem="kabul" data-id="' + p.id + '"' +
        (p.eksik ? ' disabled aria-describedby="a-sebep-' + p.id + '"' : "") + ">" + ikon("check", "a-ikon-kucuk") + "Kabul et</button>";
      if (p.eksik) alt = '<div class="a-sebep" id="a-sebep-' + p.id + '">' + ikon("triangle-alert", "a-ikon-kucuk") + "<span>" + kacis(p.eksik) + "</span></div>";
    } else if (p.durum === "kabul") {
      tus = p.tarih === BUGUN
        ? '<button class="a-tus a-tus-birincil" type="button" data-eylem="kapsam-disi" data-ne="Saha rapor ekranı">' + ikon("play", "a-ikon-kucuk") + "Denetime başla</button>"
        : '<button class="a-tus a-tus-ikincil" type="button" data-eylem="kapsam-disi" data-ne="Plan ayrıntısı">Aç</button>';
    } else if (p.durum === "tamam") {
      tus = '<button class="a-tus a-tus-ikincil" type="button" data-eylem="kapsam-disi" data-ne="Raporlar">Raporlar</button>';
    } else {
      tus = '<button class="a-tus a-tus-ikincil" type="button" data-eylem="kapsam-disi" data-ne="Plan ayrıntısı">Aç</button>';
      alt = '<div class="a-not">Gerekçe: ' + kacis(p.gerekce || "") + "</div>";
    }
    return "<tr>" +
      '<td data-alan="tarih"><span class="a-tarih-gun">' + gunYaz(p.tarih) + bugun + '</span><span class="a-tarih-saat">' + p.bas + " – " + p.bit + "</span></td>" +
      '<td data-alan="musteri"><span class="a-kirp a-musteri-ad" title="' + kacis(p.musteri) + '">' + kacis(p.musteri) + "</span>" +
      '<span class="a-tesis">' + ikon("map-pin", "a-ikon-kucuk") + '<span class="a-kirp" title="' + kacis(p.tesis + " · " + p.yer) + '">' + kacis(p.tesis + " · " + p.yer) + "</span></span></td>" +
      '<td data-alan="ekipman"><span class="a-ekipman-sayi">' + (p.m + p.e) + ' ekipman</span><span class="a-ekipman-alt">' + ekp + "</span></td>" +
      '<td data-alan="durum"><span class="a-rozet ' + DURUM[p.durum].rozet + '">' + DURUM[p.durum].ad + "</span></td>" +
      '<td data-alan="eylem"><div class="a-eylem"><div class="a-eylem-tuslar">' + tus + "</div>" + alt + "</div></td></tr>";
  }
  function bos(tur) {
    var d = {
      yok: ["inbox", "Atanmış plan yok", "Planlama ekibi plan açınca burada görünür.", ""],
      suzgec: ["search", "Süzgece uyan plan yok", "Arama ya da süzgeç değiştirilince liste yeniden dolar.", '<button class="a-tus a-tus-ikincil" type="button" data-eylem="temizle">Süzgeci temizle</button>'],
      imkansiz: ["circle-alert", "Bir plan aynı anda iki durumda olamaz", "“ve” seçiliyken iki durum çipi birlikte hiçbir plana uymaz. “veya” ile ikisindeki planlar birlikte listelenir.", '<button class="a-tus a-tus-ikincil" type="button" data-kip="veya">“veya”ya geç</button>'],
      hata: ["refresh-cw", "Planlar yüklenemedi", "Sunucuya bağlanılamadı; liste eski hâliyle gösterilmiyor.", '<button class="a-tus a-tus-ikincil" type="button" data-eylem="tekrar">' + ikon("refresh-cw", "a-ikon-kucuk") + "Tekrar dene</button>"]
    }[tur];
    return '<div class="a-bos' + (tur === "hata" ? " a-bos-hata" : "") + '" role="status"><div class="a-bos-ikon">' + ikon(d[0]) + "</div>" +
      '<p class="a-bos-baslik">' + d[1] + '</p><p class="a-bos-metin">' + d[2] + "</p>" + d[3] + "</div>";
  }
  function ciz() {
    var t = taban(), liste = sirala(t.filter(cipGecer)), toplam = veri().length;
    cizCipler(t);
    $("a-temizle").disabled = !suzgecVar();
    var ms = PLANLAR.filter(function (p) { return p.durum === "bekliyor"; }).length;
    $("a-menu-sayi").textContent = ms || ""; $("a-menu-sayi").hidden = !ms || S.veri !== "dolu";
    if (S.veri === "hata") { $("a-sayac").innerHTML = "—"; $("a-liste").innerHTML = bos("hata"); return; }
    $("a-sayac").innerHTML = suzgecVar() ? "<b>" + liste.length + "</b> / " + toplam + " plan" : "<b>" + toplam + "</b> plan";
    if (!toplam) { $("a-liste").innerHTML = bos("yok"); return; }
    if (!liste.length) { $("a-liste").innerHTML = bos(imkansiz() ? "imkansiz" : "suzgec"); return; }
    $("a-liste").innerHTML = '<table class="a-tablo"><caption class="a-gizli">Planlarım</caption>' +
      '<colgroup><col class="a-k-tarih"><col class="a-k-musteri"><col class="a-k-ekipman"><col class="a-k-durum"><col class="a-k-eylem"></colgroup>' +
      '<thead><tr><th scope="col">Tarih</th><th scope="col">Müşteri · Tesis</th><th scope="col">Ekipman</th><th scope="col">Durum</th><th scope="col">İşlem</th></tr></thead>' +
      "<tbody>" + liste.map(satir).join("") + "</tbody></table>";
  }

  /* ── ETKİLEŞİM ────────────────────────────────────────────────────────────────────────────────── */
  var bildirimZaman;
  function bildir(m) {
    $("a-bildirim-metin").textContent = m; $("a-bildirim").classList.add("a-gorunur");
    clearTimeout(bildirimZaman); bildirimZaman = setTimeout(function () { $("a-bildirim").classList.remove("a-gorunur"); }, 2800);
  }
  function listeleriKapat(haric) {
    document.querySelectorAll(".a-secici").forEach(function (s) {
      if (s === haric) return;
      s.querySelector(".a-secici-liste").hidden = true; s.querySelector(".a-secici-tus").setAttribute("aria-expanded", "false");
    });
  }
  function cekmece(ac) {
    $("a-kabuk").classList.toggle("a-cekmece-acik", ac);
    document.querySelector(".a-menu-tus").setAttribute("aria-expanded", String(ac));
  }
  function temizle() { S.ara = ""; S.secili = []; S.kip = "veya"; S.tarih = S.musteri = S.brans = "tumu"; $("a-ara-girdi").value = ""; $("a-ara").classList.remove("a-dolu"); }
  var redId = null;

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-cip],[data-kip],[data-sec],[data-secici-ac],[data-eylem]");
    if (!e.target.closest(".a-secici")) listeleriKapat(null);
    if (!el) return;
    if (el.dataset.cip) {
      var i = S.secili.indexOf(el.dataset.cip);
      if (i >= 0) S.secili.splice(i, 1); else S.secili.push(el.dataset.cip);
      ciz(); return;
    }
    if (el.dataset.kip) { if (!el.disabled) { S.kip = el.dataset.kip; ciz(); } return; }
    if (el.dataset.seciciAc) {
      var kap = el.closest(".a-secici"), l = kap.querySelector(".a-secici-liste"), acik = l.hidden;
      listeleriKapat(kap); l.hidden = !acik; el.setAttribute("aria-expanded", String(acik));
      if (acik) (l.querySelector('[aria-selected="true"]') || l.firstElementChild).focus();
      return;
    }
    if (el.dataset.sec) { S[el.dataset.sec] = el.dataset.deger; cizSeciciler(); ciz(); return; }
    var id = +el.dataset.id, p = PLANLAR.filter(function (x) { return x.id === id; })[0];
    switch (el.dataset.eylem) {
      case "cekmece-ac": cekmece(true); break;
      case "cekmece-kapat": cekmece(false); break;
      case "tema":
        var yeni = document.documentElement.getAttribute("data-tema") === "koyu" ? "acik" : "koyu";
        document.documentElement.setAttribute("data-tema", yeni);
        try { localStorage.setItem("probata-tema", yeni); } catch (x) {}
        temaEtiketi(); break;
      case "ara-sil": S.ara = ""; $("a-ara-girdi").value = ""; $("a-ara").classList.remove("a-dolu"); ciz(); $("a-ara-girdi").focus(); break;
      case "temizle": temizle(); cizSeciciler(); ciz(); break;
      case "levha-ac": $("a-levha").showModal(); break;
      case "levha-kapat": $("a-levha").close(); break;
      case "tekrar": S.veri = "dolu"; ciz(); break;
      case "kabul": if (p && !p.eksik) { p.durum = "kabul"; ciz(); bildir("Plan kabul edildi."); } break;
      case "reddet":
        redId = id; $("a-red-gerekce").value = ""; $("a-red-onay").disabled = true;
        $("a-red-ozet").innerHTML = "<b>" + kacis(p.musteri) + "</b><br>" + kacis(p.tesis + " · " + p.yer) + "<br>" + gunYaz(p.tarih) + " · " + p.bas + " – " + p.bit;
        $("a-red-ipucu").className = "a-ipucu"; $("a-red-pencere").showModal(); $("a-red-gerekce").focus(); break;
      case "pencere-kapat": $("a-red-pencere").close(); break;
      case "kapsam-disi": bildir("Maket: " + el.dataset.ne + " bu maketin kapsamında değil."); break;
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var acik = document.querySelector('.a-secici-tus[aria-expanded="true"]');
    if (acik) { listeleriKapat(null); acik.focus(); return; }
    if ($("a-kabuk").classList.contains("a-cekmece-acik")) cekmece(false);
  });
  $("a-ara-girdi").addEventListener("input", function (e) {
    S.ara = e.target.value; $("a-ara").classList.toggle("a-dolu", !!S.ara); ciz();   /* girdi yeniden çizilmez: odak çalınmaz */
  });
  $("a-red-gerekce").addEventListener("input", function (e) {
    var yeter = e.target.value.trim().length >= 3;
    $("a-red-onay").disabled = !yeter; $("a-red-ipucu").hidden = yeter;
  });
  $("a-red-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var g = $("a-red-gerekce").value.trim();
    if (g.length < 3) { $("a-red-ipucu").hidden = false; $("a-red-ipucu").className = "a-ipucu a-ipucu-uyari"; return; }
    var p = PLANLAR.filter(function (x) { return x.id === redId; })[0];
    if (p) { p.durum = "red"; p.gerekce = g; }
    $("a-red-pencere").close(); ciz(); bildir("Plan reddedildi; gerekçe planlama ekibine gider.");
  });
  function temaEtiketi() {
    var k = document.documentElement.getAttribute("data-tema") === "koyu";
    $("a-tema-tus").setAttribute("aria-label", k ? "Açık temaya geç" : "Koyu temaya geç");
  }

  temaEtiketi(); cizSeciciler(); ciz();
})();
