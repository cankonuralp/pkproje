/* ══ probata MAKET M5 — Sözleşmeler (modül 12): İSG-KATİP kaydı · ONAY BEKLİYOR (toplu maket, 2026-09-24) ════════════════
   Kaynak: pkproje.md §3 (reisim 2026-09-22: sözleşme no + onay tarihi; "eklensin ama yine tarih aralığı belirlenemez,
   sözleşme yüklenmeyecek"), §4.4 (onay en geç kontrolden 1 gün önce), §4.6 (kayıt kişi × tesis), §3.2 madde 2a (plan kabul
   kilidi). Ekranlar: liste + plan kabulünü durduran eksikler (#/) · kayıt penceresi (#/isg/yeni · #/isg/<id>). İş sözleşmesi
   sekmesi M13'te eklenir. Kaydı giren: planlama ekibinden Zeynep Arslan (varsayım). UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, SZ = MK.SZ;
  var sorgu = function () { var m = /\?(.*)$/.exec(location.hash), o = {}; (m ? m[1] : "").split("&").forEach(function (x) { var y = x.split("="); if (y[0]) o[y[0]] = decodeURIComponent(y[1] || ""); }); return o; };
  var UYGUN = { ad: "Uygun", rozet: "a-rozet-tamam" }, GEC = { ad: "Geç onay", rozet: "a-rozet-bekliyor" }, ONCEKI = { ad: "Önceki kayıt", rozet: "a-rozet-notr" };
  var enGec = function (tarih) { return MK.gunKisa(new Date(new Date(tarih + "T12:00:00") - 864e5).toISOString()); };
  /* kaydın, tesisteki açık plan karşısındaki durumu — plan kabul kilidinin (§3.2 2a) AYNISI; kişi plana atanmamışsa kilide girmez */
  var planDurum = function (x) {
    var t = MV.tesis(x.t);
    if (x.onceki || !MV.acikPlan(t) || t.pekip.indexOf(x.k) < 0) return null;
    return { t: t, uygun: MV.isgUygun(x.onay, t.ptarih) };
  };
  var guncel = function (k, t) { return MV.isgTesis(t).filter(function (x) { return x.k === k; })[0]; };
  /* kabul bekleyen planlarda, atanmış her inspector için kayıt yoksa ya da onay geçse → kabul düğmesi pasif (Planlar'daki sebep) */
  var eksikler = function () {
    var l = [];
    MV.TESISLER.forEach(function (t) {
      if (!t.pid || t.pdurum !== "bekliyor") return;
      t.pekip.forEach(function (k) {
        var x = guncel(k, t.id);
        if (!x) l.push({ t: t, k: k, x: null });
        else if (!MV.isgUygun(x.onay, t.ptarih)) l.push({ t: t, k: k, x: x });
      });
    });
    return l;
  };
  var planBag = function (t) { return '<a class="a-no" href="' + MK.adres(13, "#/plan/" + t.pid) + '">' + t.plan + "</a>"; };

  /* ── PLAN KABULÜNÜ DURDURAN EKSİKLER (liste üstü; yalnız ekranda, anayasa 1.3) ────────────────────────────── */
  function eksikCiz() {
    var l = eksikler();
    $("a-uyari").innerHTML = l.length ? '<div class="a-uyari-serit" role="group" aria-label="Plan kabulünü durduran eksikler">' + l.map(function (e) {
      var ad = kacis(MV.kisi(e.k).ad);
      return '<div class="a-serit a-serit-uyari">' + ikon("triangle-alert", "a-ikon-kucuk") + "<span><b>" + planBag(e.t) + " · " + kacis(e.t.ad) + " · " + MK.gunKisa(e.t.ptarih).replace(" ", "\u00a0") + "</b> · " +
        (e.x ? ad + " sözleşmesinin onayı " + MK.gunKisa(e.x.onay) + "; en geç " + enGec(e.t.ptarih) + " olmalı." : ad + " için kayıt yok.") + " Plan kabul edilemez.</span>" +
        (e.x ? MK.tus({ eylem: "isg-ac", ad: "Kaydı aç", sinif: "a-tus-ikincil a-serit-tus", veri: { id: e.x.id } })
          : MK.tus({ eylem: "isg-ekle", ad: "Kayıt ekle", sinif: "a-tus-ikincil a-serit-tus", veri: { tesis: e.t.id, kisi: e.k } })) + "</div>";
    }).join("") + "</div>" : "";
  }

  /* ── LİSTE ─────────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("i", { ad: "Kayıtlarda ara", ipucu: "Numara, kişi, tesis", birim: "kayıt",
    cipler: [
      { k: "acik", ad: "Açık plana bağlı", test: function (x) { return !!planDurum(x); } },
      { k: "gec", ad: "Geç onay", test: function (x) { var d = planDurum(x); return !!d && !d.uygun; } }
    ],
    seciciler: [
      { k: "kisi", ad: "Inspector", secenek: function () {
        var l = MV.ISG.map(function (x) { return x.k; }).filter(function (k, i, a) { return a.indexOf(k) === i; });
        return [["tumu", "Tümü"]].concat(l.map(function (k) { return [k, MV.kisi(k).ad]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
      }, gecer: function (x, v) { return v === "tumu" || x.k === v; } },
      { k: "musteri", ad: "Müşteri", secenek: function () { return [["tumu", "Tümü"]].concat(MV.MUSTERILER.map(function (m) { return [m.id, m.kisa]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); })); },
        gecer: function (x, v) { return v === "tumu" || MV.tesis(x.t).m === v; } },
      { k: "tesis", ad: "Tesis", secenek: function () {
        var m = SZ.i.sec.musteri, l = MV.TESISLER.filter(function (t) { return m === "tumu" || t.m === m; });
        if (SZ.i.sec.tesis !== "tumu" && !l.some(function (t) { return t.id === SZ.i.sec.tesis; })) SZ.i.sec.tesis = "tumu";   /* ekipmanlarla aynı karar */
        return [["tumu", "Tümü"]].concat(l.map(function (t) { return [t.id, (m === "tumu" ? MV.musteri(t.m).kisa + " / " : "") + t.ad]; }));
      }, gecer: function (x, v) { return v === "tumu" || x.t === v; } },
      { k: "gorunum", ad: "Görünüm", bas: "guncel", secenek: function () { return [["guncel", "Güncel kayıtlar"], ["onceki", "Önceki kayıtlar"], ["hepsi", "Hepsi"]]; },
        gecer: function (x, v) { return v === "hepsi" || (v === "guncel" ? !x.onceki : !!x.onceki); } }
    ],
    metin: function (x) { var t = MV.tesis(x.t), m = MV.musteri(t.m); return [x.no, MV.kisi(x.k).ad, t.ad, m.kisa, m.unvan].join(" "); },
    imkansiz: "" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "tesis", baslik: "Tesis", kart: "ust", sira: 1, hucre: function (x) {
      var t = MV.tesis(x.t);
      return '<a class="a-ad-bag" href="' + MK.adres(3, "#/t/" + t.id) + '">' + kirp(t.ad) + "</a>" + kirp(MV.musteri(t.m).kisa, "a-alt-satir");
    } },
    { k: "kisi", baslik: "Inspector", kart: "govde", sira: 2, hucre: function (x) {
      var p = MV.kisi(x.k);
      return '<span class="a-kart-etiket">Inspector</span><a class="a-ad-bag" href="' + MK.adres(2, "#/p/" + p.id) + '">' + kirp(p.ad) + "</a>";
    } },
    { k: "no", baslik: "Sözleşme no", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Sözleşme no</span><span class="a-kod">' + kacis(x.no) + "</span>"; } },
    { k: "onay", baslik: "Onay tarihi", kart: "govde", sira: 4, hucre: function (x) { return '<span class="a-kart-etiket">Onay tarihi</span>' + MK.tarihYaz(x.onay); } },
    { k: "plan", baslik: "Açık plan", kart: "govde", sira: 5, hucre: function (x) {
      var d = planDurum(x);
      return '<span class="a-kart-etiket">Açık plan</span>' + (d ? "<span>" + planBag(d.t) + '<span class="a-alt-satir">kontrol ' + MK.gunKisa(d.t.ptarih) + "</span></span>" : '<span class="a-deger-yok">—</span>');
    } },
    { k: "durum", baslik: "Plan kabulü için", kart: "rozet", sira: 1, hucre: function (x) {
      if (x.onceki) return rozet(ONCEKI);
      var d = planDurum(x);
      if (!d) return '<span class="a-deger-yok">—</span>';
      return rozet(d.uygun ? UYGUN : GEC) + (d.uygun ? "" : '<span class="a-uyari-metin">en geç ' + enGec(d.t.ptarih) + "</span>");
    } }
  ];
  function listeCiz() {
    eksikCiz();
    MK.listeCiz({ on: "i", kayitlar: MV.ISG, sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.onay < b.onay ? 1 : a.onay > b.onay ? -1 : a.no.localeCompare(b.no); }); },
      bosVeri: { ikon: "scroll-text", baslik: "İSG-KATİP kaydı yok", metin: "İnspector ile tesisin sözleşmesi İSG-KATİP'te onaylanınca numarası ve onay tarihi buraya girilir." },
      tablo: { baslik: "İSG-KATİP kayıtları", sinif: "a-tablo-isgkayit", sutunlar: SUTUN, href: function (x) { return "#/isg/" + x.id; } } });
  }

  /* ── KAYIT PENCERESİ: ekle · düzenle · önceki kaydı görüntüle ─────────────────────────────────────────────── */
  var W = null;
  var tarihIso = function (s) {
    var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((s || "").trim()); if (!m) return null;
    var iso = m[3] + "-" + m[2] + "-" + m[1], d = new Date(iso + "T12:00:00");
    return isNaN(d) || d.getDate() !== +m[1] || d.getMonth() + 1 !== +m[2] ? null : iso;
  };
  var tarihGg = function (iso) { return iso ? iso.slice(8, 10) + "." + iso.slice(5, 7) + "." + iso.slice(0, 4) : ""; };
  function denetle() {
    var h = {}, d = W.d, no = d.no.trim();
    if (!d.tesis) h.tesis = "Tesis seçilmeli.";
    if (!d.kisi) h.kisi = "Inspector seçilmeli.";
    if (!no) h.no = "Sözleşme numarası zorunlu: İSG-KATİP'te onaylanan sözleşmenin numarası.";
    else if (MV.ISG.some(function (x) { return x.no === no && x !== W.x; })) h.no = "Bu numara başka bir kayıtta var.";
    if (!tarihIso(d.onay)) h.onay = "GG.AA.YYYY biçiminde geçerli bir tarih.";
    return h;
  }
  /* seçime göre canlı denetim şeritleri: aynı kişi × tesis için güncel kayıt · tesisteki açık plan · kabulü yapılmış plan */
  function seritler() {
    var d = W.d, s = "", t = d.tesis ? MV.tesis(d.tesis) : null, onay = tarihIso(d.onay), p = d.kisi ? MV.kisi(d.kisi) : null;
    if (W.x && W.x.onceki) {
      var yeni = guncel(W.x.k, W.x.t);
      return MK.serit("bilgi", "history", "Önceki kayıt: yerine " + (yeni ? '<span class="a-kod">' + kacis(yeni.no) + "</span> (onay " + MK.tarihYaz(yeni.onay) + ")" : "yeni kayıt") + " geçti. Geçmiş için saklanır, değiştirilmez.");
    }
    if (!W.x && t && p) {
      var var_ = guncel(p.id, t.id);
      if (var_) s += MK.serit("uyari", "triangle-alert", kacis(p.ad) + " · " + kacis(t.ad) + " için güncel kayıt var (<span class=\"a-kod\">" + kacis(var_.no) + "</span>, onay " + MK.tarihYaz(var_.onay) + "). Kaydedince o kayıt önceki kayıtlara geçer.");
    }
    if (t && t.pid && t.pdurum === "bekliyor") {   /* canlı denetim yalnız kabulü bekleyen planda; kabul edilmişte aşağıdaki kilit şeridi */
      var atanmis = p && t.pekip.indexOf(p.id) >= 0, bas = "<b>" + t.plan + " · kontrol " + MK.gunKisa(t.ptarih) + "</b> · ";
      if (p && !atanmis) s += MK.serit("bilgi", "calendar-check", bas + kacis(p.ad) + " bu plana atanmamış; kayıt planın kabulünü etkilemez.");
      else if (p && !onay) s += MK.serit("bilgi", "calendar-check", bas + "onay tarihi girilince plan kabulü için uygun olup olmadığı burada görünür (en geç " + enGec(t.ptarih) + ").");
      else if (p && MV.isgUygun(onay, t.ptarih)) s += MK.serit("onay", "circle-check", bas + "bu onay tarihiyle " + kacis(p.ad) + " planı kabul edebilir" + (MV.kisi(p.id).ekipnet ? "." : "; EKİPNET numarası eksik olduğu için kabul ayrıca durur."));
      else if (p) s += MK.serit("uyari", "triangle-alert", bas + "onay en geç " + enGec(t.ptarih) + " olmalı; bu tarihle " + kacis(p.ad) + " planı kabul edemez.");
    }
    if (W.x && t && t.pid && ["kabul", "denetimde", "tamam"].indexOf(t.pdurum) >= 0 && t.pekip.indexOf(W.x.k) >= 0)
      s += MK.serit("bilgi", "lock", "<b>" + t.plan + "</b> bu kayda dayanarak kabul edildi. Değişiklik hareket kaydına yazılır; yapılmış kabul geri alınmaz.");
    return s;
  }
  function pencereCiz(odak) {
    var d = W.d, h = W.hata, x = W.x, oku = !!(x && x.onceki), t = d.tesis ? MV.tesis(d.tesis) : null, p = d.kisi ? MV.kisi(d.kisi) : null;
    var tesisler = MV.TESISLER.map(function (y) { return [y.id, y.ad, MV.musteri(y.m).kisa]; });
    var kisiler = MV.PERSONEL.filter(function (y) { return y.durum === "etkin" && MV.yetkiliOlabilir(y); }).map(function (y) { return [y.id, y.ad, MV.meslekAd(y)]; });
    var sabit = function (id, deger) { return '<input class="a-girdi a-girdi-oku" id="' + id + '" value="' + kacis(deger) + '" readonly aria-describedby="' + id + '-ipucu">'; };
    $("a-pencere-baslik").textContent = !x ? "İSG-KATİP kaydı ekle" : oku ? "Önceki İSG-KATİP kaydı" : "İSG-KATİP kaydı";
    $("a-pencere-govde").innerHTML = '<div class="a-form">' +
      /* kişi × tesis kaydın kimliğidir: eklendikten sonra değişmez (yanlışsa yeni kayıt girilir) */
      MK.alan({ id: "w-tesis", etiket: "Tesis", zorunlu: !x, hata: h.tesis, ipucu: t ? kacis(MV.musteri(t.m).unvan) : "Müşterinin tesisi; sözleşme tesis başına",
        girdi: x ? sabit("w-tesis", t.ad) : MK.secim({ id: "w-tesis", ad: "Tesis", deger: d.tesis, secenekler: tesisler, ipucu: "Tesis seçin", gecersiz: !!h.tesis, tanim: "w-tesis-ipucu" }) }) +
      MK.alan({ id: "w-kisi", etiket: "Inspector", zorunlu: !x, hata: h.kisi, ipucu: p ? (p.ekipnet ? "EKİPNET " + p.ekipnet : "EKİPNET numarası eksik (personel kaydı)") : "Sözleşme işveren ile yetkili kişi arasında",
        girdi: x ? sabit("w-kisi", p.ad) : MK.secim({ id: "w-kisi", ad: "Inspector", deger: d.kisi, secenekler: kisiler, ipucu: "Kişi seçin", gecersiz: !!h.kisi, tanim: "w-kisi-ipucu" }) }) +
      MK.alan({ id: "w-no", etiket: "Sözleşme no", zorunlu: !oku, hata: h.no, ipucu: oku ? "" : "İSG-KATİP'teki numara",
        girdi: oku ? sabit("w-no", d.no) : MK.girdi({ id: "w-no", alan: "no", deger: d.no, sinif: "a-girdi-sicil", ek: ' maxlength="30"', hata: h.no }) }) +
      MK.alan({ id: "w-onay", etiket: "Onay tarihi", zorunlu: !oku, hata: h.onay, ipucu: oku ? "" : "GG.AA.YYYY · iki tarafın onayladığı gün",
        girdi: oku ? sabit("w-onay", d.onay) : MK.girdi({ id: "w-onay", alan: "onay", deger: d.onay, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="10"', hata: h.onay }) }) +
      "</div>" +
      '<div class="a-serit-kap a-uyari-serit" id="w-seritler" aria-live="polite">' + seritler() + "</div>" +
      '<div class="a-serit-kap">' + MK.serit("bilgi", "scroll-text", "Sözleşme İSG-KATİP'te işveren ile inspector arasında onaylanır. Burada yalnız numara ve onay tarihi tutulur: belge yüklenmez, geçerlilik aralığı denetlenmez.") + "</div>" +
      (x ? '<p class="a-ipucu">Giren: ' + kacis(MV.kisi(x.girdi).ad) + "</p>" : "");
    $("a-pencere-alt").innerHTML = oku ? MK.tus({ eylem: "pencere-kapat", ad: "Kapat", sinif: "a-tus-ikincil" })
      : MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: x ? "Değişiklikleri kaydet" : "Kaydı ekle", ikon: "check" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function pencereAc(x, on) {
    W = { x: x || null, hata: {}, d: x ? { tesis: x.t, kisi: x.k, no: x.no, onay: tarihGg(x.onay) } : { tesis: on.tesis || "", kisi: on.kisi || "", no: "", onay: "" } };
    pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal();
    $(x ? (x.onceki ? "a-pencere-baslik" : "w-no") : W.d.tesis && W.d.kisi ? "w-no" : W.d.tesis ? "w-kisi" : "w-tesis").focus();
  }
  function kaydet() {
    W.hata = denetle(); var hk = Object.keys(W.hata);
    if (hk.length) { pencereCiz("w-" + hk[0]); return; }
    var d = W.d, onay = tarihIso(d.onay), x = W.x, t = MV.tesis(d.tesis), p = MV.kisi(d.kisi), eski = x ? null : guncel(d.kisi, d.tesis);
    if (x) { x.no = d.no.trim(); x.onay = onay; }
    else {
      if (eski) eski.onceki = true;   /* yenileme: kişi × tesis için tek güncel kayıt, eskisi geçmişte kalır */
      x = { id: "i" + (MV.ISG.length + 100), t: d.tesis, k: d.kisi, no: d.no.trim(), onay: onay, girdi: "za" };
      MV.ISG.push(x);
    }
    $("a-pencere").close();
    listeCiz();
    var dd = planDurum(x);
    MK.bildir((W.x ? "Kayıt güncellendi: " : "Kayıt eklendi: ") + x.no + " · " + p.ad + " · " + t.ad +
      (dd ? (dd.uygun ? "; " + t.plan + " kabul için uygun." : "; " + t.plan + " için onay geç.") : eski ? "; önceki kayıt geçmişe alındı." : "."));
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash.replace(/\?.*$/, ""), m;
    if (h === "#/isg/yeni") return { pencere: "yeni" };
    if ((m = /^#\/isg\/(i[0-9]+)$/.exec(h))) return { pencere: "kayit", id: m[1] };
    return {};
  }
  function goster(odakla) {
    var r = rota(), q = sorgu();
    $("a-suzgec-kap").innerHTML = MK.suzgecHtml("i"); MK.suzgecKur("i");
    document.title = "İSG-KATİP kayıtları · probata maket";
    if (odakla && !r.pencere) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik h1"); if (hh) hh.focus({ preventScroll: true }); }
    if (r.pencere === "yeni") pencereAc(null, q);
    else if (r.pencere === "kayit") { var x = MV.ISG.filter(function (y) { return y.id === r.id; })[0]; if (x) pencereAc(x); else { history.replaceState(null, "", "#/"); MK.bildir("Bu adreste kayıt yok."); } }
    else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  var X = MK.eylem;
  X["isg-ekle"] = function (el) { pencereAc(null, { tesis: el.dataset.tesis || (SZ.i.sec.tesis !== "tumu" ? SZ.i.sec.tesis : ""), kisi: el.dataset.kisi || "" }); };
  X["isg-ac"] = function (el) { location.hash = "#/isg/" + el.dataset.id; };
  X["pencere-kaydet"] = kaydet;
  MK.onGirdi = function (e) {
    var k = e.target.dataset && e.target.dataset.alan; if (!k || !W) return;
    W.d[k] = e.target.value;
    if (k === "onay") $("w-seritler").innerHTML = seritler();   /* yazarken plan kabulü denetimi canlı (odak kaybolmaz) */
  };
  MK.onSecim = function (id, deger) { if (!W) return; W.d[id.slice(2)] = deger; delete W.hata[id.slice(2)]; pencereCiz(id); };
  $("a-pencere").addEventListener("close", function () { if (rota().pencere) history.replaceState(null, "", "#/"); });

  MK.kabuk({ modul: 12, kullanici: { bas: "ZA", ad: "Zeynep Arslan", rol: "Planlama ekibi" } });
  /* liste süzgeci adresten: personel kartındaki ve tesis sayfasındaki "İSG-KATİP kaydı" yüzü (#/isg?kisi= · ?tesis=).
     #/isg/yeni?… ise süzgeç değil, pencerenin ön dolgusudur. */
  var q = sorgu();
  if (!rota().pencere) {
    if (q.kisi) SZ.i.sec.kisi = q.kisi;
    if (q.tesis && MV.tesis(q.tesis)) { SZ.i.sec.musteri = MV.tesis(q.tesis).m; SZ.i.sec.tesis = q.tesis; }
  }
  goster(false);
})();
