/* ══ probata MAKET — Araçlar (modül 23) · AA4, 2026-10-02, ONAY BEKLİYOR ══════════════════════════════════════════════════
   Reisim (2026-10-02, §9 kırk sekizinci tur): "bir de araç takip modülü olsun hangi aracın kimde olduğu belli olsun takip edilebilsin
   elinde araç olanlar sadece kendi aracını yöneticiler her aracı kimde olduğunu vs görsün aracın teslim alımı veya teslim verimi üzerine
   fotoğraflı zimmet oluşturma olsun zimmetlere otomatik oradan gitsin örnek bi şablon oluştur inceleyip düzenleriz".
   · Yönetici (#/): bütün araçlar — kimde, kilometre, muayene / trafik sigortası / kasko bitişi (30 gün kala uyarı, geçince kırmızı).
   · Sürücü (#/benim): yalnız kendi zimmetindeki araç(lar) ve kendi tutanakları; başka araç görünmez (rol yetkisi "kendi").
   · Teslim tutanağı (#/tutanak[/<araç>]): kilometre, yakıt, kontrol listesi, hasar notu, açı açı fotoğraf → kaydedince ZİMMET HAREKETİ
     kendiliğinden oluşur (Zimmetler'de aynı kayıt) ve teslim alan kişiyse tutanak onun Onaylar › Diğer'ine imzaya düşer (AA3).
   · Şablon (#/sablon): boş tutanak — reisim inceleyip düzenler (kalemler ve fotoğraf açıları ÖRNEK).
   Araç varlıkları Zimmetler'deki varlık listesinin kendisi (MV.VARLIKLAR, tür "arac"); ikinci liste yok. Plakalar UYDURMA (il kodu 00). */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, X = MK.eylem;
  /* makette sürücü görünümü: Mert Kaya (zimmetinde 00 MAK 001) — gerçek uygulamada giriş yapan kişi */
  var SURUCU = "mk", BEN = /^#\/benim/.test(location.hash) ? SURUCU : null;
  var araclar = function () { return MV.VARLIKLAR.filter(function (v) { return v.tur === "arac"; }); };
  var gorunen = function () { return araclar().filter(function (v) { return !BEN || MV.kimde(v.id) === BEN; }); };
  var BELGE = [["muayene", "Muayene"], ["sigorta", "Trafik sigortası"], ["kasko", "Kasko"]];
  var belgeRozet = function (t) {
    var d = MV.aracTarihDurum(t);
    return d === "yok" ? '<span class="a-deger-yok">Yok</span>' : d === "gecti" ? rozet({ ad: "Geçti · " + MK.tarihYaz(t), rozet: "a-rozet-red" })
      : d === "yakin" ? rozet({ ad: MK.tarihYaz(t), rozet: "a-rozet-bekliyor" }) : MK.tarihYaz(t);
  };
  var durum = function (v) {
    var u = MV.aracUyarilari(v), k = MV.kimde(v.id);
    if (u.some(function (x) { return x.d === "gecti"; })) return { ad: "Belge süresi geçti", rozet: "a-rozet-red" };
    if (u.length) return { ad: "Belge yaklaşıyor", rozet: "a-rozet-bekliyor" };
    return k === "depo" ? { ad: "Depoda", rozet: "a-rozet-notr" } : { ad: "Zimmette", rozet: "a-rozet-tamam" };
  };
  var kimdeHtml = function (k) {
    return k === "depo" ? '<span class="a-hucre-satir">' + ikon("warehouse", "a-ikon-kucuk") + "Depo</span>"
      : BEN ? kacis(MV.kisi(k).ad) : '<a class="a-ad-bag" href="' + MK.adres(2, "#/p/" + k) + '">' + kirp(MV.kisi(k).ad) + "</a>";
  };
  var km = function (v) { var n = MV.aracKm(v.id); return n == null ? '<span class="a-deger-yok">—</span>' : '<span class="a-sayi">' + MV.kmYaz(n) + " km</span>"; };

  /* ── HAFTALIK KİLOMETRE (2026-10-03, reisim: "Araç km bilgisi haftalık girilebilecek bir sistem kurulsun her hafta araç kaç km de ise
     kullanan kişi yazsın takibi olsun"): aracı kullanan kişi her hafta göstergedeki kilometreyi yazar; aynı hafta yeniden yazılırsa düzeltilir.
     Son kilometreden küçük değer kaydedilmez; haftada 3.000 km'den fazla artış kaydedilir ama uyarılır. ── */
  var KM_DURUM = { girildi: { ad: "Girildi", rozet: "a-rozet-tamam" }, bekliyor: { ad: "Bekliyor", rozet: "a-rozet-bekliyor" }, eksik: { ad: "Geçen hafta girilmedi", rozet: "a-rozet-red" } };
  var kmRozet = function (v) { var d = MV.kmDurum(v); return d === "depoda" ? '<span class="a-deger-yok">Depoda</span>' : rozet(KM_DURUM[d]); };
  var KG = {}, KH = {};   /* yazılan değer ve hata, araç başına */
  var oncekiKm = function (vid, h) {   /* bu haftanın kendi kaydı dışındaki en yeni kilometre */
    var l = MV.hareketler(vid).map(function (x) { return { t: x.tarih, km: MV.tutanak(x).km }; }).concat(MV.kmKayitlari(vid).filter(function (x) { return x.hafta !== h; }).map(function (x) { return { t: x.tarih, km: x.km }; }))
      .filter(function (x) { return x.km != null; }).sort(function (a, b) { return a.t < b.t ? 1 : -1; });
    return l.length ? l[0].km : null;
  };
  function kmForm(v) {
    var h = MV.haftaBasi(MK.BUGUN), bu = MV.kmHafta(v.id, h), id = "km-" + v.id, son = oncekiKm(v.id, h), hata = KH[v.id];
    var deger = KG[v.id] != null ? KG[v.id] : bu ? MV.kmYaz(bu.km) : "";
    return '<div class="a-km-gir"><label class="a-etiket" for="' + id + '">' + kacis(v.plaka) + " · bu hafta (" + MV.haftaYaz(h) + ") kilometre" +
        (bu ? " " + rozet(KM_DURUM.girildi) : "") + "</label>" +
      '<div class="a-km-satir">' + MK.girdi({ id: id, deger: deger, sinif: "a-girdi-sicil", ek: ' data-km="' + v.id + '" inputmode="numeric" maxlength="9"', hata: hata }) +
        MK.tus({ eylem: "km-kaydet", ad: bu ? "Düzelt" : "Kaydet", ikon: "check", veri: { v: v.id } }) + "</div>" +
      '<p class="a-ipucu' + (hata ? " a-ipucu-uyari" : "") + '" id="' + id + '-ipucu">' + (hata || (son != null ? "Son bilinen: " + MV.kmYaz(son) + " km" : "")) + "</p></div>";
  }
  function kmGecmis(v) {
    var l = MV.kmKayitlari(v.id), bu = MV.haftaBasi(MK.BUGUN); if (!l.length) return '<p class="a-bos-satir">Haftalık kilometre girilmedi.</p>';
    var ilk = l[l.length - 1].hafta, satir = [];
    for (var h = bu; h >= ilk; h = MV.haftaEkle(h, -1)) satir.push({ h: h, x: MV.kmHafta(v.id, h) });
    satir.forEach(function (s, i) { var once = satir.slice(i + 1).filter(function (y) { return y.x; })[0]; s.yol = s.x && once ? s.x.km - once.x.km : null; });
    return '<div class="a-liste-kap">' + MK.tablo({ baslik: "Haftalık kilometre", sinif: "a-tablo-kmhafta", kayitlar: satir, sutunlar: [
      { k: "hafta", baslik: "Hafta", kart: "ust", sira: 1, hucre: function (s) { return MV.haftaYaz(s.h); } },
      { k: "km", baslik: "Kilometre", kart: "govde", sira: 2, hucre: function (s) { return '<span class="a-kart-etiket">Kilometre</span>' + (s.x ? '<span class="a-sayi">' + MV.kmYaz(s.x.km) + "</span>" : rozet(s.h === bu ? KM_DURUM.bekliyor : { ad: "Girilmedi", rozet: "a-rozet-red" })); } },
      { k: "yol", baslik: "Haftalık yol", kart: "govde", sira: 3, hucre: function (s) { return '<span class="a-kart-etiket">Haftalık yol</span>' + (s.yol != null ? '<span class="a-sayi">' + MV.kmYaz(s.yol) + " km</span>" : '<span class="a-deger-yok">—</span>'); } },
      { k: "kim", baslik: "Giren", kart: "govde", sira: 4, hucre: function (s) { return '<span class="a-kart-etiket">Giren</span>' + (s.x ? "<span>" + kacis(MV.kisi(s.x.kisi).ad) + '<span class="a-alt-satir">' + MK.zamanYaz(s.x.tarih) + "</span></span>" : '<span class="a-deger-yok">—</span>'); } }
    ] }) + "</div>";
  }
  X["km-kaydet"] = function (el) {
    var vid = el.dataset.v, v = MV.varlik(vid), h = MV.haftaBasi(MK.BUGUN), ham = String(KG[vid] != null ? KG[vid] : ($("km-" + vid) || {}).value || "").trim(), son = oncekiKm(vid, h);
    var n = +ham.replace(/\./g, "");
    if (!/^\d[\d.]*$/.test(ham)) KH[vid] = "Göstergedeki kilometreyi yazın.";
    else if (son != null && n < son) KH[vid] = "Son bilinen kilometreden (" + MV.kmYaz(son) + ") küçük olamaz.";
    else delete KH[vid];
    if (KH[vid]) { goster(false); var g = $("km-" + vid); if (g) g.focus(); return; }
    var x = MV.kmHafta(vid, h), duz = !!x;
    if (x) { x.km = n; x.kisi = BEN || MV.kimde(vid); x.tarih = MK.simdi(); }
    else MV.KM_KAYIT.push({ id: "km" + (MV.KM_KAYIT.length + 1), v: vid, hafta: h, km: n, kisi: BEN || MV.kimde(vid), tarih: MK.simdi() });
    MV.KM_KAYIT = MV.KM_KAYIT.slice(); delete KG[vid];
    goster(false); if (MK.takipCiz) MK.takipCiz();
    var t = document.querySelector('[data-eylem="km-kaydet"][data-v="' + vid + '"]'); if (t) t.focus();
    MK.bildir(v.plaka + ": bu haftanın kilometresi " + (duz ? "düzeltildi" : "kaydedildi") + " (" + MV.kmYaz(n) + " km)." + (son != null && n - son > 3000 ? " Dikkat: son kayıttan " + MV.kmYaz(n - son) + " km fazla." : ""));
  };

  /* ── LİSTE ─────────────────────────────────────────────────────────────────────────────────────── */
  var SUTUN = [
    { k: "arac", baslik: "Araç", kart: "ust", sira: 1, hucre: function (v) {
      return '<span class="a-hucre-satir">' + ikon("car", "a-ikon-kucuk") + '<span class="a-adres"><a class="a-ad-bag" href="#/' + (BEN ? "benim/" : "") + "a/" + v.id + '">' + kacis(v.plaka) + "</a>" +
        kirp(v.ad + " · " + v.marka + " " + v.model, "a-alt-satir") + "</span></span>";
    } },
    { k: "kimde", baslik: "Kimde", kart: "govde", sira: 2, hucre: function (v) { return '<span class="a-kart-etiket">Kimde</span>' + kimdeHtml(MV.kimde(v.id)); } },
    { k: "km", baslik: "Kilometre", kart: "govde", sira: 3, hucre: function (v) { return '<span class="a-kart-etiket">Kilometre</span>' + km(v); } },
    { k: "muayene", baslik: "Muayene", kart: "govde", sira: 4, hucre: function (v) { return '<span class="a-kart-etiket">Muayene</span>' + belgeRozet(v.muayene); } },
    { k: "sigorta", baslik: "Trafik sigortası", kart: "govde", sira: 5, hucre: function (v) { return '<span class="a-kart-etiket">Trafik sigortası</span>' + belgeRozet(v.sigorta); } },
    { k: "kasko", baslik: "Kasko", kart: "govde", sira: 6, hucre: function (v) { return '<span class="a-kart-etiket">Kasko</span>' + belgeRozet(v.kasko); } },
    { k: "hafta", baslik: "Bu hafta km", kart: "govde", sira: 7, hucre: function (v) { return '<span class="a-kart-etiket">Bu hafta km</span>' + kmRozet(v); } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (v) { return rozet(durum(v)); } }
  ];
  function listeCiz() {
    var l = gorunen();
    $("a-sayac").innerHTML = "<b>" + l.length + "</b> araç";
    $("a-liste").innerHTML = (BEN && l.length ? '<section class="a-bolum a-km-bolum" aria-labelledby="a-b-km"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-km">Haftalık kilometre</h2></div>' +
        l.map(kmForm).join("") + "</section>" : "") + (l.length ? MK.tablo({ baslik: "Araçlar", sinif: "a-tablo-arac", sutunlar: SUTUN, kayitlar: l, href: function (v) { return "#/" + (BEN ? "benim/" : "") + "a/" + v.id; } })
      : MK.bos(BEN ? { ikon: "car", baslik: "Üzerinizde araç yok", metin: "Size bir araç teslim edilince burada görünür; teslim tutanağı Onaylar'a imzaya düşer." }
        : { ikon: "car", baslik: "Araç yok", metin: "Araçlar Zimmetler'deki varlık listesinden gelir." }));
  }

  /* ── TUTANAKLAR (aracın bütün teslim hareketleri) ─────────────────────────────────────────────────── */
  var tutanaklar = function () {
    return MV.ZIMMET.filter(function (h) { var v = MV.varlik(h.v); return v && v.tur === "arac" && (!BEN || h.eden === BEN || h.alan === BEN); })
      .sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; });
  };
  var T_SUTUN = [
    { k: "tarih", baslik: "Tarih", kart: "ust", sira: 1, hucre: function (h) { return '<span class="a-tarih-gun">' + MK.tarihYaz(h.tarih) + '</span><span class="a-tarih-saat">' + h.tarih.slice(11, 16) + "</span>"; } },
    { k: "arac", baslik: "Araç", kart: "govde", sira: 2, hucre: function (h) { return '<span class="a-kart-etiket">Araç</span><span class="a-kod">' + kacis(MV.varlik(h.v).plaka) + "</span>"; } },
    { k: "kim", baslik: "Teslim eden → alan", kart: "govde", sira: 3, hucre: function (h) { return '<span class="a-kart-etiket">Teslim eden → alan</span><span>' + kacis(MV.yerAdi(h.eden)) + " → <b>" + kacis(MV.yerAdi(h.alan)) + "</b></span>"; } },
    { k: "km", baslik: "Kilometre", kart: "govde", sira: 4, hucre: function (h) { var t = MV.tutanak(h); return '<span class="a-kart-etiket">Kilometre</span>' + (t.km != null ? '<span class="a-sayi">' + MV.kmYaz(t.km) + "</span>" : '<span class="a-deger-yok">—</span>'); } },
    { k: "foto", baslik: "Fotoğraf", kart: "govde", sira: 5, hucre: function (h) { return '<span class="a-kart-etiket">Fotoğraf</span><span class="a-hucre-satir">' + ikon("camera", "a-ikon-kucuk") + h.foto + "</span>"; } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (h) {
      return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.tus({ eylem: "tutanak-goster", ad: "Tutanak", ikon: "file-text", sinif: "a-tus-ikincil", veri: { id: h.id } }) + "</div></div>";
    } }
  ];
  function tutanakListeCiz() {
    var l = tutanaklar();
    $("a-sayac").innerHTML = "<b>" + l.length + "</b> tutanak";
    $("a-liste").innerHTML = l.length ? MK.tablo({ baslik: "Teslim tutanakları", sinif: "a-tablo-tutanak", sutunlar: T_SUTUN, kayitlar: l })
      : MK.bos({ ikon: "file-text", baslik: "Tutanak yok", metin: "Her teslim alma ve teslim etme bir tutanak olarak burada birikir." });
  }

  /* ── ŞABLON ─────────────────────────────────────────────────────────────────────────────────────── */
  function sablonCiz() {
    $("a-sayac").innerHTML = "";
    $("a-liste").innerHTML = '<div class="a-serit-kap">' + MK.serit("bilgi", "info", "Örnek şablon: kontrol kalemleri (" + MV.ARAC_KONTROL.length + ") ve fotoğraf açıları (" + MV.ARAC_FOTO.length +
        ") öneri; birlikte inceleyip düzenleriz. Teslimde doldurulan tutanak bu düzenle çıkar, iki taraf imzalar.") + "</div>" +
      MB.aracTutanak({ bos: true });
  }

  /* ── ARAÇ SAYFASI ───────────────────────────────────────────────────────────────────────────────── */
  function yuz(o) {
    return '<div class="a-yuz"><span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" +
      (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "") + "</div>";
  }
  function aracCiz(v) {
    var kok = BEN ? "#/benim" : "#/";
    if (!v || (BEN && MV.kimde(v.id) !== BEN)) {
      $("a-nesne").innerHTML = MK.kirinti([[BEN ? "Aracım" : "Araçlar", kok]]) + '<h1 class="a-gizli" tabindex="-1">Araç bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Araç bulunamadı", metin: BEN ? "Bu araç sizin zimmetinizde değil." : "Bu adreste kayıtlı araç yok.",
          eylem: '<a class="a-tus a-tus-ikincil" href="' + kok + '">' + ikon("arrow-left", "a-ikon-kucuk") + (BEN ? "Aracıma dön" : "Araçlara dön") + "</a>" });
      return;
    }
    var k = MV.kimde(v.id), h = MV.hareketler(v.id).filter(function (x) { return !BEN || x.eden === BEN || x.alan === BEN; }), u = MV.aracUyarilari(v), n = MV.aracKm(v.id);
    $("a-nesne").innerHTML = MK.kirinti([[BEN ? "Aracım" : "Araçlar", kok], [v.plaka]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(v.plaka) + " · " + kacis(v.ad) + "</h1>" + rozet(durum(v)) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("car", "a-ikon-kucuk") + "<span>" + kacis(v.marka + " " + v.model + " · " + v.yil + (v.yakit ? " · " + yakitAd(v.yakit) : "")) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + (BEN ? "" : MK.tus({ eylem: "arac-duzenle", ad: "Düzenle", ikon: "pencil", sinif: "a-tus-ikincil", veri: { id: v.id } }) +
          '<a class="a-tus a-tus-ikincil" href="zimmetler.html#/v/' + v.id + '">' + ikon("package", "a-ikon-kucuk") + "Zimmet kaydı</a>") +
          '<a class="a-tus a-tus-birincil" href="' + (BEN ? "#/benim/tutanak/" : "#/tutanak/") + v.id + '">' + ikon("clipboard-check", "a-ikon-kucuk") + (BEN ? "Teslim et" : "Teslim tutanağı") + "</a></div></div>" +
      (u.length ? '<div class="a-serit-kap">' + u.map(function (x) {
        return MK.serit(x.d === "gecti" ? "hata" : "uyari", x.d === "gecti" ? "circle-x" : "triangle-alert", x.ad + (x.d === "gecti" ? " süresi geçti (" : " bitiyor (") + MK.tarihYaz(x.t) + ")" + (x.d === "gecti" ? "; araç bu hâliyle trafiğe çıkmamalı." : "."));
      }).join("") + "</div>" : "") +
      '<div class="a-yuzler">' +
        yuz({ ikon: k === "depo" ? "warehouse" : "user", ad: "Kimde", sayi: kacis(MV.yerAdi(k)), not: MV.hareketler(v.id)[0] ? "teslim " + MK.tarihYaz(MV.hareketler(v.id)[0].tarih) : "" }) +
        yuz({ ikon: "gauge", ad: "Kilometre", sayi: n == null ? "—" : MV.kmYaz(n), not: v.bakimKm ? "bakım " + MV.kmYaz(v.bakimKm) + " km" + (n != null && n >= v.bakimKm - 1000 ? " · yaklaştı" : "") : "", uyari: n != null && v.bakimKm && n >= v.bakimKm - 1000 }) +
        BELGE.map(function (b) { var d = MV.aracTarihDurum(v[b[0]]); return yuz({ ikon: "calendar", ad: b[1], sayi: v[b[0]] ? MK.tarihYaz(v[b[0]]) : "—", not: d === "gecti" ? "geçti" : d === "yakin" ? "yaklaşıyor" : "", uyari: d === "gecti" || d === "yakin" }); }).join("") +
      "</div>" +
      /* 2026-10-03 (reisim: "araca tıklayınca gözüken ekranda aracın marka modeli plaka bilgileri de yazmalı"): kayıt bilgileri ayrı bölümde */
      '<section class="a-bolum" aria-labelledby="a-b-bilgi"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-bilgi">Araç bilgileri</h2></div><dl class="a-bilgi">' +
        MK.bilgi("Plaka", '<span class="a-kod">' + kacis(v.plaka) + "</span>") + MK.bilgi("Araç türü", kacis(v.ad)) +
        MK.bilgi("Marka", kacis(v.marka || "—")) + MK.bilgi("Model", kacis(v.model || "—")) +
        MK.bilgi("Model yılı", v.yil ? String(v.yil) : "—") + MK.bilgi("Yakıt", kacis(yakitAd(v.yakit))) +
        (v.ilkKm != null ? MK.bilgi("Kayıttaki kilometre", MV.kmYaz(v.ilkKm) + " km") : "") + "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-kmh"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kmh">Haftalık kilometre</h2>' + kmRozet(v) + "</div>" +
        (k !== "depo" && k !== "lab" ? kmForm(v) : "") + kmGecmis(v) + "</section>" +
      '<section class="a-bolum" aria-labelledby="a-b-tutanak"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-tutanak">Teslim tutanakları</h2><span class="a-sayac"><b>' + h.length + "</b> tutanak</span></div>" +
        (h.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Teslim tutanakları", sinif: "a-tablo-tutanak", sutunlar: T_SUTUN.filter(function (c) { return c.k !== "arac"; }), kayitlar: h }) + "</div>"
          : '<p class="a-bos-satir">Bu aracın tutanağı yok; depoda.</p>') + "</section>";
  }

  /* ── TESLİM TUTANAĞI PENCERESİ ───────────────────────────────────────────────────────────────────── */
  var W = null;
  var YAKIT = [["bos", "Boş"], ["ceyrek", "1/4"], ["yarim", "1/2"], ["ucceyrek", "3/4"], ["dolu", "Dolu"]];
  function denetle() {
    var h = {}, d = W.d, k = d.arac ? MV.kimde(d.arac) : null, son = d.arac ? MV.aracKm(d.arac) : null, n = +String(d.km).replace(/\./g, "");
    if (!d.arac) h.arac = "Araç seçilmeli.";
    if (!d.alan) h.alan = "Teslim alan seçilmeli.";
    else if (d.alan === k) h.alan = "Araç zaten " + MV.yerAdi(k) + (k === "depo" ? "da." : "'de.");
    if (!/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/.test(d.zaman)) h.zaman = "GG.AA.YYYY SS:DD biçiminde.";
    if (!/^\d[\d.]*$/.test(d.km)) h.km = "Teslimde kilometre yazılır.";
    else if (son != null && n < son) h.km = "Son tutanaktaki kilometreden (" + MV.kmYaz(son) + ") küçük olamaz.";
    if (!d.yakit) h.yakit = "Yakıt seviyesi seçilmeli.";
    return h;
  }
  function pencereCiz(odak) {
    if (W.tip === "kayit") { kayitCiz(odak); return; }
    var d = W.d, h = W.hata, v = d.arac ? MV.varlik(d.arac) : null, k = v ? MV.kimde(v.id) : null;
    var kisiler = [["depo", "Depo", "iade"]].concat(MV.PERSONEL.filter(function (p) { return p.durum === "etkin"; }).map(function (p) { return [p.id, p.ad, MV.meslekAd(p)]; }));
    var eksik = MV.ARAC_KONTROL.filter(function (x) { return !d.kontrol[x[0]]; }).length, fotosuz = MV.ARAC_FOTO.filter(function (x) { return !d.foto[x[0]]; }).length;
    $("a-pencere-baslik").textContent = "Araç teslim tutanağı";
    $("a-pencere-govde").innerHTML = '<div class="a-form">' +
      MK.alan({ id: "w-arac", etiket: "Araç", zorunlu: true, hata: h.arac, sonuc: v ? "Şu an: " + kacis(MV.yerAdi(k)) + (MV.aracKm(v.id) != null ? " · son " + MV.kmYaz(MV.aracKm(v.id)) + " km" : "") : "",
        girdi: BEN ? '<input class="a-girdi" id="w-arac" readonly value="' + kacis(MV.varlikAdi(v)) + '" aria-describedby="w-arac-ipucu">'
          : MK.secim({ id: "w-arac", ad: "Araç", deger: d.arac, secenekler: araclar().map(function (x) { return [x.id, MV.varlikAdi(x), MV.yerAdi(MV.kimde(x.id))]; }), ipucu: "Araç seçin", gecersiz: !!h.arac, tanim: "w-arac-ipucu" }) }) +
      MK.alan({ id: "w-alan", etiket: "Teslim alan", zorunlu: true, hata: h.alan, sonuc: "Teslim eden: " + (k ? kacis(MV.yerAdi(k)) : "—"),
        girdi: MK.secim({ id: "w-alan", ad: "Teslim alan", deger: d.alan, secenekler: kisiler, ipucu: "Kişi ya da depo", gecersiz: !!h.alan, tanim: "w-alan-ipucu" }) }) +
      MK.alan({ id: "w-zaman", etiket: "Tarih ve saat", zorunlu: true, hata: h.zaman, girdi: MK.girdi({ id: "w-zaman", alan: "zaman", deger: d.zaman, sinif: "a-girdi-seri", ek: ' inputmode="numeric" maxlength="16" data-takvim="saatli"', hata: h.zaman }) }) +
      MK.alan({ id: "w-km", etiket: "Kilometre", zorunlu: true, hata: h.km, girdi: MK.girdi({ id: "w-km", alan: "km", deger: d.km, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="9"', hata: h.km }) }) +
      MK.alan({ id: "w-yakit", etiket: "Yakıt seviyesi", zorunlu: true, hata: h.yakit,
        girdi: MK.secim({ id: "w-yakit", ad: "Yakıt seviyesi", deger: d.yakit, secenekler: YAKIT, ipucu: "Seviye seçin", gecersiz: !!h.yakit, tanim: "w-yakit-ipucu" }) }) +
      '<fieldset class="a-alan-grup a-alan-genis a-arac-kontrol"><legend class="a-etiket">Araçta olanlar</legend><div class="a-arac-kutular">' +
        MV.ARAC_KONTROL.map(function (x) { return '<label class="a-onay-kutusu"><input type="checkbox" data-kontrol="' + x[0] + '"' + (d.kontrol[x[0]] ? " checked" : "") + "><span>" + kacis(x[1]) + "</span></label>"; }).join("") + "</div>" +
        (eksik ? '<p class="a-ipucu"><span class="a-ipucu-dikkat">İşaretlenmeyen ' + eksik + " kalem tutanağa “yok” diye yazılır.</span></p>" : "") + "</fieldset>" +
      '<div class="a-alan-grup a-alan-genis"><label class="a-etiket" for="w-hasar">Hasar ve notlar</label><textarea class="a-alan a-alan-ince" id="w-hasar" data-alan="hasar" maxlength="400">' + kacis(d.hasar) + "</textarea></div>" +
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Fotoğraflar</p><ul class="a-arac-foto">' + MV.ARAC_FOTO.map(function (x) {
        var ad = d.foto[x[0]];
        return '<li><span class="a-arac-foto-aci">' + kacis(x[1]) + "</span>" + (ad ? MK.fotolar(1, [ad], x[1], { eylem: "tfoto-sil", veri: { aci: x[0] } })
          : MK.tus({ eylem: "tfoto-ekle", ad: "Fotoğraf ekle", ikon: "camera", sinif: "a-tus-ikincil", veri: { aci: x[0] } })) + "</li>";
      }).join("") + "</ul>" +
        (fotosuz ? '<p class="a-ipucu"><span class="a-ipucu-dikkat">' + fotosuz + " açı fotoğrafsız; tutanak yine kaydedilir.</span></p>" : "") + "</div>" +
      "</div>" +
      (d.alan && d.alan !== "depo" ? '<div class="a-serit-kap">' + MK.serit("bilgi", "info", "Kaydedince zimmet kaydı oluşur; tutanak imzaya gider: " + kacis(MV.kisi(d.alan).ad) + " › Onaylar › Diğer belgeler.") + "</div>" : "");
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "tutanak-kaydet", ad: "Tutanağı kaydet", ikon: "check" });
    if (odak) { var el = $(odak) || document.querySelector(odak); if (el) el.focus(); }
  }
  function pencereAc(vid) {
    if (BEN && (!vid || MV.kimde(vid) !== BEN)) vid = (gorunen()[0] || {}).id;
    if (BEN && !vid) { MK.bildir("Üzerinizde araç yok; teslim edilecek araç bulunmuyor."); return; }
    var z = MK.simdi();
    W = { hata: {}, d: { arac: vid || "", alan: BEN ? "depo" : "", zaman: z.slice(8, 10) + "." + z.slice(5, 7) + "." + z.slice(0, 4) + " " + z.slice(11, 16), km: "", yakit: "", kontrol: {}, hasar: "", foto: {} } };
    pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal(); (BEN ? $("w-alan") : $("w-arac")).focus();
  }
  /* ── ARAÇ EKLE / DÜZENLE (2026-10-03, reisim: "araç ekleme kısmıda göremedim") — yalnız yönetici. Plaka zorunlu ve eşsiz (engel: aynı
     plaka iki araç olamaz); belge bitişleri isteğe bağlı (boşsa takip edilmez, balon çıkmaz); başlangıç kilometresi yalnız eklerken — haftalık
     kilometre ve tutanak ondan küçük olamaz. */
  var TURLER = ["Binek araç", "Hafif ticari araç", "Kamyonet", "Minibüs", "Kamyon"];
  var YAKITLAR = [["benzin", "Benzin"], ["dizel", "Dizel"], ["lpg", "LPG"], ["elektrik", "Elektrik"], ["hibrit", "Hibrit"]];
  function yakitAd(y) { var x = YAKITLAR.filter(function (a) { return a[0] === y; })[0]; return x ? x[1] : y || "—"; }
  var plakaDuz = function (s) { return String(s || "").toLocaleUpperCase("tr").replace(/\s+/g, " ").trim(); };
  var tarihIso = function (s) { var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(s).trim()); if (!m) return null; var iso = m[3] + "-" + m[2] + "-" + m[1], d = new Date(iso + "T12:00:00");
    return isNaN(d) || d.getDate() !== +m[1] ? null : iso; };
  var BELGE_AD = [["muayene", "Muayene bitişi"], ["sigorta", "Trafik sigortası bitişi"], ["kasko", "Kasko bitişi"]];
  function kayitDenetle() {
    var h = {}, d = W.d, p = plakaDuz(d.plaka), yil = +d.yil, ust = +MK.raporBugun.slice(0, 4) + 1;
    if (!p) h.plaka = "Plaka yazılmalı.";
    else if (!/^\d{2} ?[A-ZÇĞİÖŞÜ]{1,3} ?\d{2,4}$/.test(p)) h.plaka = "Plaka 34 ABC 123 biçiminde.";
    else if (araclar().some(function (x) { return x.id !== W.id && plakaDuz(x.plaka).replace(/ /g, "") === p.replace(/ /g, ""); })) h.plaka = "Bu plaka kayıtlı; aynı plakayla ikinci araç açılmaz.";
    if (!d.ad) h.ad = "Araç türü seçilmeli.";
    if (!String(d.marka).trim()) h.marka = "Marka yazılmalı.";
    if (!String(d.model).trim()) h.model = "Model yazılmalı.";
    if (!/^\d{4}$/.test(String(d.yil).trim()) || yil < 1980 || yil > ust) h.yil = "Dört haneli yıl (1980–" + ust + ").";
    if (!d.yakit) h.yakit = "Yakıt seçilmeli.";
    if (!W.id && String(d.ilkKm).trim() && !/^\d[\d.]*$/.test(d.ilkKm)) h.ilkKm = "Yalnız rakam.";
    if (String(d.bakimKm).trim() && !/^\d[\d.]*$/.test(d.bakimKm)) h.bakimKm = "Yalnız rakam.";
    BELGE_AD.forEach(function (b) { if (String(d[b[0]]).trim() && !tarihIso(d[b[0]])) h[b[0]] = "GG.AA.YYYY biçiminde; boş bırakılabilir."; });
    return h;
  }
  function kayitCiz(odak) {
    var d = W.d, h = W.hata, gir = function (id, k, sinif, ek) { return MK.girdi({ id: id, alan: k, deger: d[k], sinif: sinif, ek: ek || "", hata: h[k] }); };
    $("a-pencere-baslik").textContent = W.id ? "Aracı düzenle · " + MV.varlik(W.id).plaka : "Araç ekle";
    $("a-pencere-govde").innerHTML = '<div class="a-form">' +
      MK.alan({ id: "w-plaka", etiket: "Plaka", zorunlu: true, hata: h.plaka, girdi: gir("w-plaka", "plaka", "a-girdi-sicil", ' maxlength="12" autocapitalize="characters" placeholder="34 ABC 123"') }) +
      MK.alan({ id: "w-ad", etiket: "Araç türü", zorunlu: true, hata: h.ad, girdi: MK.secim({ id: "w-ad", ad: "Araç türü", deger: d.ad, secenekler: TURLER.map(function (t) { return [t, t]; }), ipucu: "Tür seçin", gecersiz: !!h.ad, tanim: "w-ad-ipucu" }) }) +
      MK.alan({ id: "w-marka", etiket: "Marka", zorunlu: true, hata: h.marka, girdi: gir("w-marka", "marka", "", ' maxlength="40"') }) +
      MK.alan({ id: "w-model", etiket: "Model", zorunlu: true, hata: h.model, girdi: gir("w-model", "model", "", ' maxlength="40"') }) +
      MK.alan({ id: "w-yil", etiket: "Model yılı", zorunlu: true, hata: h.yil, girdi: gir("w-yil", "yil", "a-girdi-sicil", ' inputmode="numeric" maxlength="4"') }) +
      MK.alan({ id: "w-yakit", etiket: "Yakıt", zorunlu: true, hata: h.yakit, girdi: MK.secim({ id: "w-yakit", ad: "Yakıt", deger: d.yakit, secenekler: YAKITLAR, ipucu: "Yakıt seçin", gecersiz: !!h.yakit, tanim: "w-yakit-ipucu" }) }) +
      (W.id ? "" : MK.alan({ id: "w-ilkKm", etiket: "Kilometre (kayıt anında)", hata: h.ilkKm, ipucu: "İsteğe bağlı; haftalık kilometre bundan küçük yazılamaz.", girdi: gir("w-ilkKm", "ilkKm", "a-girdi-sicil", ' inputmode="numeric" maxlength="9"') })) +
      MK.alan({ id: "w-bakimKm", etiket: "Sonraki bakım kilometresi", hata: h.bakimKm, ipucu: "İsteğe bağlı; 1.000 km kala uyarır.", girdi: gir("w-bakimKm", "bakimKm", "a-girdi-sicil", ' inputmode="numeric" maxlength="9"') }) +
      BELGE_AD.map(function (b) { return MK.alan({ id: "w-" + b[0], etiket: b[1], hata: h[b[0]], ipucu: "İsteğe bağlı; boşsa takip edilmez.", girdi: gir("w-" + b[0], b[0], "a-girdi-sicil", ' inputmode="numeric" maxlength="10" placeholder="GG.AA.YYYY" data-takvim') }); }).join("") +
      "</div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "arac-kaydet", ad: W.id ? "Kaydet" : "Aracı ekle", ikon: "check" });
    if (odak) { var el = $(odak) || document.querySelector(odak); if (el) el.focus(); }
  }
  function kayitAc(id) {
    var v = id ? MV.varlik(id) : null, tn = function (x) { return x ? MK.tarihNo(x) : ""; };
    W = { tip: "kayit", id: id || null, hata: {}, d: v ? { plaka: v.plaka, ad: v.ad, marka: v.marka || "", model: v.model || "", yil: v.yil ? String(v.yil) : "", yakit: v.yakit || "",
      bakimKm: v.bakimKm ? String(v.bakimKm) : "", muayene: tn(v.muayene), sigorta: tn(v.sigorta), kasko: tn(v.kasko) }
      : { plaka: "", ad: "", marka: "", model: "", yil: "", yakit: "", ilkKm: "", bakimKm: "", muayene: "", sigorta: "", kasko: "" } };
    kayitCiz(); if (!$("a-pencere").open) $("a-pencere").showModal(); $("w-plaka").focus();
  }
  X["arac-ekle"] = function () { kayitAc(null); };
  X["arac-duzenle"] = function (el) { kayitAc(el.dataset.id); };
  X["arac-kaydet"] = function () {
    W.hata = kayitDenetle(); var hk = Object.keys(W.hata);
    if (hk.length) { kayitCiz("w-" + hk[0]); return; }
    var d = W.d, sayi = function (s) { return String(s).trim() ? +String(s).replace(/\./g, "") : null; }, v = W.id ? MV.varlik(W.id) : null, yeni = !v;
    if (yeni) { var n = 1; while (MV.varlik("a" + n)) n++; v = { id: "a" + n, tur: "arac" }; }
    v.plaka = plakaDuz(d.plaka); v.ad = d.ad; v.marka = String(d.marka).trim(); v.model = String(d.model).trim(); v.yil = +d.yil; v.yakit = d.yakit;
    v.bakimKm = sayi(d.bakimKm); BELGE_AD.forEach(function (b) { v[b[0]] = tarihIso(d[b[0]]) || ""; });
    if (yeni) { if (sayi(d.ilkKm) != null) v.ilkKm = sayi(d.ilkKm); MV.VARLIKLAR.push(v); }
    $("a-pencere").close();
    location.hash = "#/a/" + v.id;
    MK.bildir(v.plaka + (yeni ? " eklendi; depoda. Teslim tutanağıyla kişiye verilir." : " bilgileri kaydedildi."));
  };
  X["tutanak-ac"] = function () { pencereAc(rota().v === "arac" ? rota().id : ""); };
  X["tfoto-ekle"] = function (el) {
    var aci = el.dataset.aci;
    MK.dosyaSec({ kabul: "image/*", kamera: true, enCokMB: 15, ornek: "arac-" + aci + "-" + Date.now() + ".jpg" }, function (ad) {
      if (!W) return; W.d.foto[aci] = ad; pencereCiz('[data-eylem="tfoto-sil"][data-aci="' + aci + '"]');
    });
  };
  X["tfoto-sil"] = function (el) { var aci = el.dataset.aci, ad = W.d.foto[aci]; delete W.d.foto[aci]; if (ad) MK.dosyaSil(ad); pencereCiz('[data-eylem="tfoto-ekle"][data-aci="' + aci + '"]'); };
  X["tutanak-kaydet"] = function () {
    W.hata = denetle(); var hk = Object.keys(W.hata);
    if (hk.length) { pencereCiz("w-" + hk[0]); return; }
    var d = W.d, v = MV.varlik(d.arac), eden = MV.kimde(v.id), z = d.zaman.split(" "), n = +d.km.replace(/\./g, "");
    var fotolar = MV.ARAC_FOTO.filter(function (x) { return d.foto[x[0]]; });
    var hr = { id: "z" + (MV.ZIMMET.length + 1), v: v.id, tarih: z[0].split(".").reverse().join("-") + "T" + z[1], eden: eden, alan: d.alan, foto: fotolar.length,
      fotoAd: fotolar.map(function (x) { return d.foto[x[0]]; }), not: "Km " + MV.kmYaz(n) + (d.hasar.trim() ? " · " + d.hasar.trim() : ""), onay: null, yetkili: BEN || "co",
      tutanak: { no: MV.tutanakNo(z[0].split(".").reverse().join("-")), km: n, yakit: d.yakit, kontrol: MV.ARAC_KONTROL.filter(function (x) { return d.kontrol[x[0]]; }).map(function (x) { return x[0]; }),
        hasar: d.hasar.trim(), foto: fotolar.map(function (x) { return [x[0], d.foto[x[0]]]; }) } };
    MV.ZIMMET.push(hr);
    /* teslim alan kişiyse tutanak onun onayına / imzasına gider (Onaylar › Diğer belgeler, AA3) */
    if (d.alan !== "depo") MV.BELGE_ONAY.push({ id: "bo" + (MV.BELGE_ONAY.length + 1), tur: "arac", ad: "Araç teslim tutanağı · " + v.plaka, kisi: d.alan, gonderen: BEN || "co",
      gonderildi: MK.simdi(), durum: "bekliyor", dosya: "arac-teslim-tutanagi-" + hr.tutanak.no + ".pdf", hareket: hr.id });
    $("a-pencere").close();
    location.hash = (BEN ? (d.alan === BEN ? "#/benim/a/" + v.id : "#/benim") : "#/a/" + v.id);
    MK.bildir(v.plaka + ": " + MV.yerAdi(eden) + " → " + MV.yerAdi(d.alan) + ". Tutanak " + hr.tutanak.no + " kaydedildi, zimmet kaydı oluştu" +
      (d.alan !== "depo" ? "; " + MV.kisi(d.alan).ad + " Onaylar'dan imzalar." : "."));
  };
  X["tutanak-goster"] = function (el) {
    var h = MV.ZIMMET.filter(function (x) { return x.id === el.dataset.id; })[0], v = MV.varlik(h.v), t = MV.tutanak(h);
    MK.pdfGoster({ dosya: "arac-teslim-tutanagi-" + t.no + ".pdf", baslik: "Araç teslim tutanağı · " + v.plaka + " · " + t.no, icerik: MB.aracTutanak({ h: h }) });
  };
  MK.onGirdi = function (e) {
    if (e.target.dataset && e.target.dataset.km) { KG[e.target.dataset.km] = e.target.value; return; }
    if (!W) return;
    if (e.target.dataset.kontrol) { W.d.kontrol[e.target.dataset.kontrol] = e.target.checked; var o = document.activeElement && document.activeElement.dataset.kontrol; pencereCiz(o ? '[data-kontrol="' + o + '"]' : null); return; }
    var k = e.target.dataset && e.target.dataset.alan; if (k) W.d[k] = e.target.value;
  };
  MK.onSecim = function (id, deger) { if (!W) return; var k = id.slice(2); W.d[k] = deger; delete W.hata[k]; pencereCiz(id); };

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash.replace(/^#\/benim\/?/, "#/"), m;
    if (h === "#/tutanaklar") return { v: "tutanaklar" };
    if (h === "#/sablon" && !BEN) return { v: "sablon" };
    if ((m = /^#\/tutanak(?:\/([a-z0-9]+))?$/.exec(h))) return { v: "liste", pencere: true, id: m[1] };
    if ((m = /^#\/a\/([a-z0-9]+)$/.exec(h))) return { v: "arac", id: m[1] };
    return { v: "liste" };
  }
  function sekmeler(v) {
    var on = BEN ? "#/benim/" : "#/";
    $("a-sekmeler").innerHTML = '<a class="a-sekme" href="' + (BEN ? "#/benim" : "#/") + '"' + (v === "liste" ? ' aria-current="page"' : "") + ">" + (BEN ? "Aracım" : "Araçlar") + "</a>" +
      '<a class="a-sekme" href="' + on + 'tutanaklar"' + (v === "tutanaklar" ? ' aria-current="page"' : "") + ">Tutanaklar</a>" +
      (BEN ? "" : '<a class="a-sekme" href="#/sablon"' + (v === "sablon" ? ' aria-current="page"' : "") + ">Şablon</a>");
  }
  function goster(odakla) {
    if (!!BEN !== /^#\/benim/.test(location.hash)) { location.reload(); return; }   /* görünüm (yönetici ↔ sürücü) değişti: kabuk kişisi de değişir */
    var r = rota(), v = r.v === "arac" ? MV.varlik(r.id) : null, liste = r.v !== "arac";
    $("a-liste-gorunum").hidden = !liste; $("a-nesne").hidden = liste;
    $("a-baslik").textContent = BEN ? "Aracım" : "Araçlar";
    if (liste) { sekmeler(r.v); if (r.v === "tutanaklar") tutanakListeCiz(); else if (r.v === "sablon") sablonCiz(); else listeCiz(); }
    else if (v && v.tur === "arac") aracCiz(v); else aracCiz(null);
    document.title = (r.v === "arac" ? (v ? v.plaka : "Araç bulunamadı") : r.v === "tutanaklar" ? "Tutanaklar" : r.v === "sablon" ? "Tutanak şablonu" : BEN ? "Aracım" : "Araçlar") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
    if (r.pencere) pencereAc(r.id); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  $("a-pencere").addEventListener("close", function () { W = null; if (rota().pencere) history.replaceState(null, "", BEN ? "#/benim" : "#/"); });
  $("a-gorunum-tus").innerHTML = BEN ? '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("users", "a-ikon-kucuk") + "Yönetici görünümü</a>"
    : '<a class="a-tus a-tus-ikincil" href="#/benim">' + ikon("user", "a-ikon-kucuk") + "Sürücü görünümü</a>";

  if (BEN) $("a-tutanak-ad").textContent = "Teslim et";
  else document.querySelector('[data-eylem="tutanak-ac"]').insertAdjacentHTML("beforebegin", MK.tus({ eylem: "arac-ekle", ad: "Araç ekle", ikon: "plus", sinif: "a-tus-ikincil" }));
  MK.kabuk({ modul: 23, kullanici: BEN ? { bas: "MK", ad: "Mert Kaya", rol: "Denetçi" } : { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  goster(false);
})();
