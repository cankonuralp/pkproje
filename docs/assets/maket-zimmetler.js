/* ══ probata MAKET M4 — Zimmet (modül 9) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════════════════
   Kaynak: pkproje.md §1.1 (reisim: "kim hangi aracı kimden teslim aldı kime verdi ne zaman görselleri ile"), §3.1 modül 9 (varlık:
   cihaz · araç · diğer; her teslim ayrı kayıt: teslim eden → alan, tarih-saat, fotoğraflar, zimmet formu; anlık "kimde" + tam
   geçmiş), §3 + §3.2 madde 4 (rapordaki cihazlar zimmetten gelir). Ekranlar: kimde (#/, ?kisi=) · hareketler (#/hareketler) ·
   varlık (#/v/<id>) · teslim penceresi (#/teslim[/<varlık>]). Depo tarafındaki yetkili: planlama ekibinden Zeynep Arslan
   (varsayım). Fotoğraflar makette yer tutucu. UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, SZ = MK.SZ;
  var TUR = { cihaz: { ad: "Ölçüm cihazı", ikon: "gauge" }, arac: { ad: "Araç", ikon: "truck" }, diger: { ad: "Diğer", ikon: "hard-hat" } };
  var KAL = { gecti: { ad: "Kalibrasyonu geçti", rozet: "a-rozet-red" }, yakin: { ad: "Kalibrasyon yakın", rozet: "a-rozet-bekliyor" }, lab: { ad: "Kalibrasyonda", rozet: "a-rozet-kabul" } };
  var q = (function () { var m = /\?(.*)$/.exec(location.hash), o = {}; (m ? m[1] : "").split("&").forEach(function (x) { var y = x.split("="); if (y[0]) o[y[0]] = decodeURIComponent(y[1] || ""); }); return o; })();
  var yerHtml = function (k) {
    return k === "depo" ? '<span class="a-hucre-satir">' + ikon("warehouse", "a-ikon-kucuk") + "Depo</span>" : k === "lab" ? '<span class="a-hucre-satir">' + ikon("flask-conical", "a-ikon-kucuk") + "Kalibrasyonda</span>"
      : '<a class="a-ad-bag" href="' + MK.adres(2, "#/p/" + k) + '">' + kirp(MV.kisi(k).ad) + "</a>";
  };
  var durum = function (v) {
    var k = MV.kimde(v.id), d = MV.kalDurum(v);
    if (d && KAL[d]) return KAL[d];
    return k === "depo" ? { ad: "Depoda", rozet: "a-rozet-notr" } : { ad: "Zimmette", rozet: "a-rozet-tamam" };
  };
  var varlikHtml = function (v, bag) {
    var ad = '<span class="a-hucre-satir">' + ikon(TUR[v.tur].ikon, "a-ikon-kucuk") + '<span class="a-adres">' +
      (bag ? '<a class="a-ad-bag" href="#/v/' + v.id + '">' + kirp(v.tur === "arac" ? v.plaka : v.env) + "</a>" : '<span class="a-kod">' + (v.tur === "arac" ? v.plaka : v.env) + "</span>") +
      kirp(v.ad, "a-alt-satir") + "</span></span>";
    return ad;
  };

  /* ── KİMDE (anlık) ─────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("z", { ad: "Varlıklarda ara", ipucu: "Envanter, plaka, kişi", birim: "varlık",
    cipler: [
      { k: "cihaz", ad: "Ölçüm cihazı", grup: "tur", test: function (v) { return v.tur === "cihaz"; } },
      { k: "arac", ad: "Araç", grup: "tur", test: function (v) { return v.tur === "arac"; } },
      { k: "diger", ad: "Diğer", grup: "tur", test: function (v) { return v.tur === "diger"; } },
      { k: "depo", ad: "Depoda", test: function (v) { return MV.kimde(v.id) === "depo"; } },
      { k: "gecti", ad: "Kalibrasyonu geçmiş cihaz", test: function (v) { return MV.kalDurum(v) === "gecti"; } }
    ],
    seciciler: [{ k: "kisi", ad: "Kimde", secenek: function () {
      var l = MV.VARLIKLAR.map(function (v) { return MV.kimde(v.id); }).filter(function (x, i, a) { return a.indexOf(x) === i; });
      return [["tumu", "Tümü"]].concat(l.map(function (x) { return [x, MV.yerAdi(x)]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
    }, gecer: function (v, d) { return d === "tumu" || MV.kimde(v.id) === d; } }],
    metin: function (v) { return [v.env || "", v.plaka || "", v.ad, MV.yerAdi(MV.kimde(v.id))].join(" "); },
    imkansiz: "Bir varlık aynı anda iki türde olamaz" }, function () { kimdeCiz(); });
  var KIMDE_SUTUN = [
    { k: "varlik", baslik: "Varlık", kart: "ust", sira: 1, hucre: function (v) { return varlikHtml(v, true); } },
    { k: "tur", baslik: "Tür", kart: "govde", sira: 2, hucre: function (v) { return '<span class="a-kart-etiket">Tür</span>' + TUR[v.tur].ad; } },
    { k: "kimde", baslik: "Kimde", kart: "govde", sira: 3, hucre: function (v) { return '<span class="a-kart-etiket">Kimde</span>' + yerHtml(MV.kimde(v.id)); } },
    { k: "teslim", baslik: "Son teslim", kart: "govde", sira: 4, hucre: function (v) {
      var h = MV.hareketler(v.id)[0];
      return '<span class="a-kart-etiket">Son teslim</span>' + (h ? '<span class="a-tarih-gun">' + MK.tarihYaz(h.tarih) + '</span><span class="a-tarih-saat">' + kacis(MV.yerAdi(h.eden)) + " → " + kacis(MV.yerAdi(h.alan)) + "</span>" : '<span class="a-deger-yok">Hareket yok</span>');
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (v) { return rozet(durum(v)); } }
  ];
  function kimdeCiz() {
    MK.listeCiz({ on: "z", kayitlar: MV.VARLIKLAR, sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return MV.yerAdi(MV.kimde(a.id)).localeCompare(MV.yerAdi(MV.kimde(b.id)), "tr") || (a.env || a.plaka).localeCompare(b.env || b.plaka); }); },
      bosVeri: { ikon: "package", baslik: "Varlık yok", metin: "Cihaz, araç ve diğer varlıklar eklenince burada kimde oldukları görünür." },
      tablo: { baslik: "Kimde", sinif: "a-tablo-kimde", sutunlar: KIMDE_SUTUN, href: function (v) { return "#/v/" + v.id; } } });
  }

  /* ── HAREKETLER (tam geçmiş) ─────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("h", { ad: "Hareketlerde ara", ipucu: "Varlık, kişi, not", birim: "hareket", sayfa: 20,
    cipler: [
      { k: "onaysiz", ad: "Onay bekliyor", test: function (h) { return h.alan !== "depo" && h.alan !== "lab" && !h.onay; } },
      { k: "cihaz", ad: "Ölçüm cihazı", grup: "tur", test: function (h) { return MV.varlik(h.v).tur === "cihaz"; } },
      { k: "arac", ad: "Araç", grup: "tur", test: function (h) { return MV.varlik(h.v).tur === "arac"; } },
      { k: "diger", ad: "Diğer", grup: "tur", test: function (h) { return MV.varlik(h.v).tur === "diger"; } }
    ],
    seciciler: [{ k: "kisi", ad: "Kişi", secenek: function () {
      var l = []; MV.ZIMMET.forEach(function (h) { [h.eden, h.alan].forEach(function (x) { if (x !== "depo" && x !== "lab" && l.indexOf(x) < 0) l.push(x); }); });
      return [["tumu", "Tümü"]].concat(l.map(function (x) { return [x, MV.kisi(x).ad]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
    }, gecer: function (h, d) { return d === "tumu" || h.eden === d || h.alan === d; } }],
    metin: function (h) { var v = MV.varlik(h.v); return [MV.varlikAdi(v), MV.yerAdi(h.eden), MV.yerAdi(h.alan), h.not].join(" "); },
    imkansiz: "Bir hareket aynı anda iki türde olamaz" }, function () { hareketCiz(); });
  var formRozet = function (h) {
    if (h.alan === "depo" || h.alan === "lab") return rozet({ ad: h.alan === "lab" ? "Gönderim formu" : "İade alındı", rozet: "a-rozet-notr" });
    return h.onay ? rozet({ ad: "Onaylandı " + MK.gunKisa(h.onay), rozet: "a-rozet-tamam" }) : rozet({ ad: "Onay bekliyor", rozet: "a-rozet-bekliyor" });
  };
  var HAREKET_SUTUN = [
    { k: "tarih", baslik: "Tarih", kart: "ust", sira: 1, hucre: function (h) { return '<span class="a-tarih-gun">' + MK.tarihYaz(h.tarih) + '</span><span class="a-tarih-saat">' + h.tarih.slice(11, 16) + "</span>"; } },
    { k: "varlik", baslik: "Varlık", kart: "govde", sira: 2, hucre: function (h) { return varlikHtml(MV.varlik(h.v), true); } },
    { k: "kim", baslik: "Teslim eden → alan", kart: "govde", sira: 3, hucre: function (h) { return '<span class="a-kart-etiket">Teslim eden → alan</span>' + kacis(MV.yerAdi(h.eden)) + " → <b>" + kacis(MV.yerAdi(h.alan)) + "</b>"; } },
    { k: "foto", baslik: "Fotoğraf", kart: "govde", sira: 4, hucre: function (h) { return '<span class="a-hucre-satir">' + ikon("camera", "a-ikon-kucuk") + h.foto + "</span>"; } },
    { k: "form", baslik: "Zimmet formu", kart: "rozet", sira: 1, hucre: formRozet }
  ];
  function hareketCiz() {
    MK.listeCiz({ on: "h", kayitlar: MV.ZIMMET, sayacId: "a-sayac", listeId: "a-liste", sayfaId: "a-sayfa",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; }); },
      bosVeri: { ikon: "arrow-right-left", baslik: "Hareket yok", metin: "Her teslim ayrı kayıt olarak burada birikir." },
      tablo: { baslik: "Hareketler", sinif: "a-tablo-hareket", sutunlar: HAREKET_SUTUN, href: function (h) { return "#/v/" + h.v; } } });
  }

  /* ── VARLIK SAYFASI: kimde + tam geçmiş (fotoğraflarla) ─────────────────────────────────────────── */
  var fotolar = function (n, etiket) { var s = ""; for (var i = 1; i <= n; i++) s += '<span class="a-foto" role="img" aria-label="' + etiket + " fotoğraf " + i + '">' + ikon("camera") + '<span class="a-foto-no">' + i + "</span></span>"; return s; };
  function yuz(o) {
    var ic = '<span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" + (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "");
    return o.href ? '<a class="a-yuz" href="' + o.href + '">' + ic + "</a>" : '<div class="a-yuz">' + ic + "</div>";
  }
  function varlikCiz(v) {
    if (!v) {
      $("a-nesne").innerHTML = MK.kirinti([["Zimmetler", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Varlık bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Varlık bulunamadı", metin: "Bu adreste kayıtlı varlık yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Zimmetlere dön</a>" });
      return;
    }
    var h = MV.hareketler(v.id), k = MV.kimde(v.id), kimlik = v.tur === "arac" ? v.plaka : v.env;
    $("a-nesne").innerHTML = MK.kirinti([["Zimmetler", "#/"], [kimlik]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kimlik + " · " + kacis(v.ad) + "</h1>" + rozet(durum(v)) + "</div>" +
        '<p class="a-nesne-alt">' + ikon(TUR[v.tur].ikon, "a-ikon-kucuk") + "<span>" + TUR[v.tur].ad + " · " + kacis(v.marka + " " + v.model) + (v.yil ? " · " + v.yil : "") + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + (v.tur === "cihaz" ? MK.git({ hedef: 8, hash: "#/c/" + v.id, ad: "Cihaz ve kalibrasyon", ikon: "gauge", ne: "Ölçüm cihazları" }) : "") +
        (k === "lab" ? "" : MK.tus({ eylem: "teslim-ac", ad: "Teslim et", ikon: "arrow-right-left", veri: { varlik: v.id } })) + "</div></div>" +
      (MV.kalDurum(v) === "gecti" && k !== "depo" ? '<div class="a-serit-kap">' + MK.serit("hata", "circle-x", "Kalibrasyonu geçmiş cihaz " + kacis(MV.yerAdi(k)) + " zimmetinde: raporları onaya gönderilemez. Depoya alın ya da kalibrasyona gönderin.") + "</div>" : "") +
      '<div class="a-yuzler">' +
        yuz({ ikon: k === "depo" ? "warehouse" : k === "lab" ? "flask-conical" : "user", ad: "Kimde", sayi: MV.yerAdi(k), href: k !== "depo" && k !== "lab" ? MK.adres(2, "#/p/" + k) : null, not: h[0] ? "teslim " + MK.tarihYaz(h[0].tarih) : "" }) +
        yuz({ ikon: "arrow-right-left", ad: "Hareket", sayi: h.length, not: "her teslim ayrı kayıt" }) +
        yuz({ ikon: "camera", ad: "Fotoğraf", sayi: h.reduce(function (n, x) { return n + x.foto; }, 0), not: "teslimlerde çekilen" }) +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-gecmis"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-gecmis">Teslim geçmişi</h2><span class="a-sayac"><b>' + h.length + "</b> hareket</span></div>" +
        (h.length ? '<ol class="a-gecmis a-gecmis-zimmet">' + h.map(function (x) {
          return '<li><span class="a-gecmis-zaman">' + MK.zamanYaz(x.tarih) + '</span><span class="a-gecmis-ne"><b>' + kacis(MV.yerAdi(x.eden)) + " → " + kacis(MV.yerAdi(x.alan)) + "</b> " + formRozet(x) +
            '<span class="a-not-metin">' + (x.not ? kacis(x.not) : '<span class="a-deger-yok">Not yok</span>') + (x.eden === "depo" || x.alan === "depo" ? ' <span class="a-gecmis-rol">depo yetkilisi ' + kacis(MV.kisi(x.yetkili).ad) + "</span>" : "") + "</span>" +
            '<span class="a-fotolar">' + fotolar(x.foto, MV.varlikAdi(v) + " " + MK.gunKisa(x.tarih)) + "</span></span></li>";
        }).join("") + "</ol>" : '<p class="a-bos-satir">Bu varlığın hareketi yok; depoda.</p>') + "</section>";
  }

  /* ── TESLİM PENCERESİ ───────────────────────────────────────────────────────────────────────────── */
  var W = null;
  function denetle() {
    var h = {}, d = W.d, k = d.varlik ? MV.kimde(d.varlik) : null;
    if (!d.varlik) h.varlik = "Varlık seçilmeli.";
    else if (k === "lab") h.varlik = "Varlık kalibrasyonda; dönünce depodan teslim edilir.";
    if (!d.alan) h.alan = "Teslim alan seçilmeli.";
    else if (d.alan === k) h.alan = "Varlık zaten " + MV.yerAdi(k) + (k === "depo" ? "da." : "'de.");
    if (!/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/.test(d.zaman)) h.zaman = "GG.AA.YYYY SS:DD biçiminde.";
    if (d.varlik && MV.varlik(d.varlik).tur === "arac" && !/^\d[\d.]*$/.test(d.km)) h.km = "Araç teslimde kilometre yazılır.";
    if (d.foto < 1) h.foto = "En az bir fotoğraf eklenmeli (teslim anındaki durum).";
    return h;
  }
  function pencereCiz(odak) {
    var d = W.d, h = W.hata, v = d.varlik ? MV.varlik(d.varlik) : null, k = v ? MV.kimde(v.id) : null;
    var kisiler = [["depo", "Depo", "iade"]].concat(MV.PERSONEL.filter(function (p) { return p.durum === "etkin"; }).map(function (p) { return [p.id, p.ad, MV.meslekAd(p)]; }));
    $("a-pencere-baslik").textContent = "Teslim et";
    $("a-pencere-govde").innerHTML = '<div class="a-form">' +
      MK.alan({ id: "w-varlik", etiket: "Varlık", zorunlu: true, genis: true, hata: h.varlik, ipucu: v ? "Şu an: " + MV.yerAdi(k) : "",
        girdi: MK.secim({ id: "w-varlik", ad: "Varlık", deger: d.varlik, secenekler: MV.VARLIKLAR.map(function (x) { return [x.id, MV.varlikAdi(x), MV.yerAdi(MV.kimde(x.id))]; }), ipucu: "Varlık seçin", gecersiz: !!h.varlik, tanim: "w-varlik-ipucu" }) }) +
      MK.alan({ id: "w-alan", etiket: "Teslim alan", zorunlu: true, hata: h.alan, ipucu: "Teslim eden: " + (k ? MV.yerAdi(k) + (k === "depo" ? " (depo yetkilisi Zeynep Arslan)" : "") : "—"),
        girdi: MK.secim({ id: "w-alan", ad: "Teslim alan", deger: d.alan, secenekler: kisiler, ipucu: "Kişi ya da depo", gecersiz: !!h.alan, tanim: "w-alan-ipucu" }) }) +
      MK.alan({ id: "w-zaman", etiket: "Tarih ve saat", zorunlu: true, hata: h.zaman, girdi: MK.girdi({ id: "w-zaman", alan: "zaman", deger: d.zaman, sinif: "a-girdi-seri", ek: ' inputmode="numeric" maxlength="16"', hata: h.zaman }) }) +
      (v && v.tur === "arac" ? MK.alan({ id: "w-km", etiket: "Kilometre", zorunlu: true, hata: h.km, girdi: MK.girdi({ id: "w-km", alan: "km", deger: d.km, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="9"', hata: h.km }) }) : "") +
      '<div class="a-alan-grup a-alan-genis"><label class="a-etiket" for="w-not">Durum notu</label><textarea class="a-alan a-alan-ince" id="w-not" data-alan="not" maxlength="300" placeholder="Eksik parça, hasar, aksesuarlar">' + kacis(d.not) + "</textarea></div>" +
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Fotoğraflar <span class="a-zorunlu">en az bir</span></p><div class="a-fotolar">' + fotolar(d.foto, "Teslim") +
        MK.tus({ eylem: "foto-ekle", ad: "Fotoğraf ekle", ikon: "camera", sinif: "a-tus-ikincil" }) + "</div>" +
        (h.foto ? '<p class="a-ipucu a-ipucu-uyari">' + h.foto + "</p>" : '<p class="a-ipucu">Telefonda kamera açılır; masaüstünde dosya seçilir.</p>') + "</div>" +
      "</div>" +
      (v && MV.kalDurum(v) === "gecti" && d.alan && d.alan !== "depo" ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Bu cihazın kalibrasyonu geçti: teslim alanın raporları, cihaz zimmetinde kaldıkça onaya gönderilemez.") + "</div>" : "") +
      '<div class="a-serit-kap">' + MK.serit("bilgi", "file-signature", "Kaydedince zimmet formu oluşur; teslim alan kendi ekranından onaylar (onaylanana kadar hareket “Onay bekliyor”).") + "</div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: "Teslimi kaydet", ikon: "check" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function pencereAc(vid) {
    W = { hata: {}, d: { varlik: vid || "", alan: "", zaman: "23.09.2026 16:40", km: "", not: "", foto: 0 } };
    pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal(); $("w-varlik").focus();
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash.replace(/\?.*$/, ""), m;
    if (h === "#/hareketler") return { v: "hareket" };
    if ((m = /^#\/teslim(?:\/([a-z0-9]+))?$/.exec(h))) return { v: "kimde", pencere: true, id: m[1] };
    if ((m = /^#\/v\/([a-z0-9]+)$/.exec(h))) return { v: "varlik", id: m[1] };
    return { v: "kimde" };
  }
  function sekmeler(v) {
    $("a-sekmeler").innerHTML = '<a class="a-sekme" href="#/"' + (v === "kimde" ? ' aria-current="page"' : "") + ">Kimde</a>" +
      '<a class="a-sekme" href="#/hareketler"' + (v === "hareket" ? ' aria-current="page"' : "") + ">Hareketler</a>";
  }
  function goster(odakla) {
    var r = rota(), v = r.v === "varlik" ? MV.varlik(r.id) : null, liste = r.v !== "varlik";
    $("a-liste-gorunum").hidden = !liste; $("a-nesne").hidden = liste;
    if (liste) {
      sekmeler(r.v);
      var on = r.v === "hareket" ? "h" : "z";
      $("a-suzgec-kap").innerHTML = MK.suzgecHtml(on); MK.suzgecKur(on);
      if (r.v === "kimde") $("a-sayfa").innerHTML = "";
    } else varlikCiz(v);
    document.title = (r.v === "hareket" ? "Hareketler" : r.v === "varlik" ? (v ? MV.varlikAdi(v) : "Varlık bulunamadı") : "Zimmetler") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
    if (r.pencere) pencereAc(r.id); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  var X = MK.eylem;
  X["teslim-ac"] = function (el) { pencereAc(el.dataset.varlik || (rota().v === "varlik" ? rota().id : "")); };
  X["foto-ekle"] = function () { W.d.foto++; delete W.hata.foto; pencereCiz(); var t = document.querySelector('[data-eylem="foto-ekle"]'); if (t) t.focus(); };
  X["pencere-kaydet"] = function () {
    W.hata = denetle(); var hk = Object.keys(W.hata);
    if (hk.length) { pencereCiz(hk[0] === "foto" ? null : "w-" + hk[0]); return; }
    var d = W.d, v = MV.varlik(d.varlik), eden = MV.kimde(v.id), z = d.zaman.split(" ");
    MV.ZIMMET.push({ id: "z" + (MV.ZIMMET.length + 1), v: v.id, tarih: z[0].split(".").reverse().join("-") + "T" + z[1], eden: eden, alan: d.alan, foto: d.foto,
      not: (v.tur === "arac" ? "Km " + d.km + (d.not.trim() ? " · " : "") : "") + d.not.trim(), onay: null, yetkili: "za" });
    $("a-pencere").close();
    location.hash = "#/v/" + v.id;
    MK.bildir(MV.varlikAdi(v) + ": " + MV.yerAdi(eden) + " → " + MV.yerAdi(d.alan) + (d.alan === "depo" ? "." : "; onay bekliyor."));
  };
  MK.onGirdi = function (e) { var k = e.target.dataset && e.target.dataset.alan; if (k && W) W.d[k] = e.target.value; };
  MK.onSecim = function (id, deger) { if (!W) return; if (id === "w-varlik") W.d.varlik = deger; if (id === "w-alan") W.d.alan = deger; delete W.hata[id.slice(2)]; pencereCiz(); };
  $("a-pencere").addEventListener("close", function () { if (rota().pencere) history.replaceState(null, "", "#/"); });

  MK.kabuk({ modul: 9, kullanici: { bas: "CÖ", ad: "Can Öztürk", rol: "Elektrik yönetici" } });
  if (q.kisi) SZ.z.sec.kisi = q.kisi;   /* personel kartındaki "Zimmetinde" yüzünden gelir */
  goster(false);
})();
