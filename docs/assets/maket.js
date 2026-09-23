/* ══ probata MAKET — Planlarım + plan içi (2026-09-23 · 2. tur) ═══════════════════════════════════════════
   ⛔ Tüm veri UYDURMADIR (anayasa 10.3); gerçek firma, kişi, tesis, adres ve sözleşme numarası yok.
   ⛔ "Bugün" sabit: 2026-09-23, saat 16:40 — ölçüm her açılışta aynı sonucu versin.
   Adres: ?veri=dolu|bos|hata · ?tema=acik|koyu · ?birincil=yesil|petrol · #/plan/<id> = plan içi.
   2. tur (reisim 2026-09-23): liste sütunları reisim'in gösterdiği örnek listeden; Mesai, İş türü, Rapor durumu
   ve "İşlemler" tuşu YOK. Satırda tek eylem tuşu durumla değişir: Kabul et → Denetime başla → Devam et. Plan
   içinde Tamamla → Tamamlandı; plan içinden "Tamamlamayı geri al" ile Denetimde'ye döner, raporlar düzenlenebilir. */
(function () {
  "use strict";
  var IKON = "../vendor/lucide-1.47.0/ikonlar.svg#i-";
  var BUGUN = "2026-09-23", SAAT = "16:40";
  var HAFTA = ["2026-09-21", "2026-09-27"];
  var YEDI = ["2026-09-23", "2026-09-29"];

  var KISI = {
    mk: { ad: "Mert Kaya", brans: "Mekanik" },
    ea: { ad: "Elif Aydın", brans: "Elektrik" },
    bs: { ad: "Burak Şahin", brans: "Mekanik" }
  };
  /* ekipman türü havuzu; plan başına Mekanik/Elektrik sayısından sırayla türetilir (uydurma kodlar) */
  var TUR = {
    m: [["Hava tankı", "HT"], ["Forklift", "FL"], ["Köprülü kren", "KK"], ["Kaldırma platformu", "KP"], ["Transpalet", "TP"], ["Kompresör", "KM"], ["Zincirli vinç", "ZV"], ["Yük asansörü", "YA"]],
    e: [["Elektrik iç tesisatı", "ET"], ["AG topraklama", "AT"], ["Yıldırımdan korunma", "YK"], ["Dağıtım panosu", "DP"]]
  };
  var PLANLAR = [
    { id: 1, no: "P-0926-031", ad: "Merkez Fabrika", musteri: "Ada Makina San. ve Tic. A.Ş.", adres: "Organize Sanayi Bölgesi 4. Cadde No: 12", ilce: "Gebze", il: "Kocaeli", tarih: "2026-09-23", bas: "09:00", bit: "12:30", ekip: ["mk", "ea"], m: 8, e: 4, durum: "denetimde", basladi: "23 Eyl 09:04", isg: { no: "S-2026-0412", onay: "2026-09-16" }, raporlar: { taslak: 5, onayda: 0 } },
    { id: 2, no: "P-0926-034", ad: "Depo 2", musteri: "Yıldız Ambalaj A.Ş.", adres: "Liman Caddesi No: 7", ilce: "Tuzla", il: "İstanbul", tarih: "2026-09-23", bas: "14:00", bit: "17:00", ekip: ["mk"], m: 5, e: 0, durum: "bekliyor", isg: { no: "S-2026-0431", onay: "2026-09-19" } },
    { id: 3, no: "P-0926-036", ad: "Aktarma Merkezi ve Soğuk Hava Deposu", musteri: "Kuzey Lojistik ve Depolama Hizmetleri A.Ş.", adres: "Sanayi Caddesi No: 48, Aktarma Merkezi Girişi", ilce: "Çorlu", il: "Tekirdağ", tarih: "2026-09-24", bas: "08:30", bit: "16:30", ekip: ["mk", "ea", "bs"], m: 14, e: 6, durum: "bekliyor", isg: { no: "S-2026-0440", onay: "2026-09-15" } },
    { id: 4, no: "P-0926-038", ad: "Boyahane", musteri: "Mavi Tekstil Ltd.", adres: "Organize Sanayi Bölgesi 2. Sokak No: 5", ilce: "Çerkezköy", il: "Tekirdağ", tarih: "2026-09-25", bas: "09:00", bit: "13:00", ekip: ["mk", "ea"], m: 2, e: 7, durum: "bekliyor", isg: { no: "S-2026-0447", onay: "2026-09-25" }, eksik: "İSG-KATİP onayı 25 Eyl'de verilmiş; en geç 24 Eyl olmalı." },
    { id: 5, no: "P-0926-039", ad: "Döküm Hattı", musteri: "Akın Döküm San. Ltd.", adres: "Demir Çelik Caddesi No: 21", ilce: "Dilovası", il: "Kocaeli", tarih: "2026-09-26", bas: "10:00", bit: "12:00", ekip: ["mk"], m: 3, e: 0, durum: "bekliyor", isg: null, eksik: "Bu tesis için İSG-KATİP kaydı yok." },
    { id: 6, no: "P-0926-035", ad: "Üretim Tesisi", musteri: "Ege Plastik A.Ş.", adres: "Organize Sanayi Bölgesi 1. Kısım No: 9", ilce: "Yunusemre", il: "Manisa", tarih: "2026-09-29", bas: "09:00", bit: "15:00", ekip: ["mk", "ea"], m: 7, e: 3, durum: "kabul", isg: { no: "S-2026-0436", onay: "2026-09-20" } },
    { id: 7, no: "P-0926-037", ad: "Şantiye Deposu", musteri: "Kaya Yapı Malzemeleri Ltd.", adres: "Çevre Yolu Caddesi No: 3", ilce: "Başakşehir", il: "İstanbul", tarih: "2026-09-30", bas: "09:00", bit: "12:00", ekip: ["mk"], m: 2, e: 0, durum: "red", isg: { no: "S-2026-0444", onay: "2026-09-21" }, gerekce: "Aynı saatte başka tesiste denetimim var." },
    { id: 8, no: "P-0926-028", ad: "Soğuk Hava Deposu", musteri: "Deniz Gıda Ltd.", adres: "Liman Yolu No: 15", ilce: "Pendik", il: "İstanbul", tarih: "2026-09-22", bas: "09:00", bit: "11:30", ekip: ["mk"], m: 4, e: 0, durum: "tamam", basladi: "22 Eyl 09:02", bitti: "22 Eyl 11:52", isg: { no: "S-2026-0405", onay: "2026-09-12" }, raporlar: { taslak: 1, onayda: 3 } },
    { id: 9, no: "P-0926-025", ad: "Değirmen", musteri: "Başak Un Değirmenleri A.Ş.", adres: "İstasyon Caddesi No: 30", ilce: "Lüleburgaz", il: "Kırklareli", tarih: "2026-09-21", bas: "13:00", bit: "16:00", ekip: ["mk", "ea"], m: 6, e: 2, durum: "tamam", basladi: "21 Eyl 13:05", bitti: "21 Eyl 16:20", isg: { no: "S-2026-0398", onay: "2026-09-10" }, raporlar: { taslak: 0, onayda: 8 } }
  ];
  PLANLAR.forEach(function (p) {
    var r = p.raporlar || { taslak: 0, onayda: 0 }, n = 0;
    p.ekipman = [];
    ["m", "e"].forEach(function (b) {
      for (var i = 0; i < p[b]; i++) {
        var t = TUR[b][i % TUR[b].length], sira = ("0" + (Math.floor(i / TUR[b].length) + 1)).slice(-2);
        p.ekipman.push({ ad: t[0], kod: t[1] + "-" + sira, brans: b, rapor: n < r.taslak ? "taslak" : n < r.taslak + r.onayda ? "onayda" : "yok" });
        n++;
      }
    });
  });

  var DURUM = {
    bekliyor: { ad: "Kabul bekliyor", rozet: "a-rozet-bekliyor", sira: 0 },
    kabul: { ad: "Kabul edildi", rozet: "a-rozet-kabul", sira: 1 },
    denetimde: { ad: "Denetimde", rozet: "a-rozet-denetimde", sira: 2 },
    tamam: { ad: "Tamamlandı", rozet: "a-rozet-tamam", sira: 3 },
    red: { ad: "Reddedildi", rozet: "a-rozet-red", sira: 4 }
  };
  var RAPOR = {
    yok: { ad: "Başlanmadı", rozet: "a-rozet-notr" },
    taslak: { ad: "Taslak", rozet: "a-rozet-bekliyor" },
    onayda: { ad: "Onayda", rozet: "a-rozet-kabul" }
  };
  /* Yüklem çipleri: beş durum + bir bağımsız yüklem. ve/veya HEPSİNİ yönetir (kalıp 8). */
  var CIPLER = [
    { k: "bekliyor", ad: "Kabul bekliyor", durum: true, test: function (p) { return p.durum === "bekliyor"; } },
    { k: "kabul", ad: "Kabul edildi", durum: true, test: function (p) { return p.durum === "kabul"; } },
    { k: "denetimde", ad: "Denetimde", durum: true, test: function (p) { return p.durum === "denetimde"; } },
    { k: "tamam", ad: "Tamamlandı", durum: true, test: function (p) { return p.durum === "tamam"; } },
    { k: "red", ad: "Reddedildi", durum: true, test: function (p) { return p.durum === "red"; } },
    { k: "eksik", ad: "Ön koşul eksik", durum: false, test: function (p) { return p.durum === "bekliyor" && !!p.eksik; } }
  ];
  /* Sıralama: tabloda sütun başlığı, kart kipinde "Sıralama" seçicisi; ikisi de S.sira'yı yazar. */
  var SIRA_ANAHTAR = {
    no: function (p) { return p.no; },
    ad: function (p) { return p.ad; },
    musteri: function (p) { return p.musteri; },
    adres: function (p) { return p.il + " " + p.ilce + " " + p.adres; },
    ekip: function (p) { return KISI[p.ekip[0]].ad; },
    baslangic: function (p) { return p.tarih + " " + p.bas; },
    durum: function (p) { return DURUM[p.durum].sira; }
  };
  var SIRA_AD = { no: "Proje no", ad: "Proje adı", musteri: "Müşteri", adres: "Adres", ekip: "Inspector", baslangic: "Başlangıç", durum: "Durum" };
  function siraEtiket(v) {
    if (v === "varsayilan") return "Açık işler önce";
    var x = v.split("-"), artan = x[1] === "artan";
    var yon = x[0] === "baslangic" ? (artan ? "yakın → uzak" : "uzak → yakın")
      : x[0] === "no" ? (artan ? "küçükten büyüğe" : "büyükten küçüğe")
      : x[0] === "durum" ? (artan ? "akış sırası" : "ters akış") : (artan ? "A → Z" : "Z → A");
    return SIRA_AD[x[0]] + ": " + yon;
  }
  var SIRA_TEMEL = ["varsayilan", "baslangic-artan", "baslangic-azalan", "musteri-artan", "no-artan"];
  function siraSecenek() {
    var l = SIRA_TEMEL.indexOf(S.sira) < 0 ? SIRA_TEMEL.concat([S.sira]) : SIRA_TEMEL;
    return l.map(function (v) { return [v, siraEtiket(v)]; });
  }
  var SECICI = [
    { k: "tarih", ad: "Tarih", secenek: function () { return [["tumu", "Tümü"], ["bugun", "Bugün"], ["hafta", "Bu hafta"], ["yedi", "Önümüzdeki 7 gün"]]; } },
    { k: "musteri", ad: "Müşteri", secenek: function () {
      return [["tumu", "Tümü"]].concat(PLANLAR.map(function (p) { return p.musteri; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a.localeCompare(b, "tr"); })
        .map(function (m) { return [m, m]; }));
    } },
    { k: "brans", ad: "Branş", secenek: function () { return [["tumu", "Tümü"], ["m", "Mekanik"], ["e", "Elektrik"]]; } },
    /* süzgeç değil sıralama: Temizle ve süzgeç rozeti saymaz; satırda yalnız kart kipinde görünür (tabloda başlık sıralar) */
    { k: "sira", ad: "Sıralama", siralama: true, secenek: siraSecenek }
  ];

  var q = new URLSearchParams(location.search);
  var S = { veri: q.get("veri") || "dolu", ara: "", secili: [], kip: "veya", tarih: "tumu", musteri: "tumu", brans: "tumu", sira: "varsayilan" };
  var $ = function (id) { return document.getElementById(id); };
  var kacis = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var ikon = function (ad, sinif) { return '<svg class="a-ikon' + (sinif ? " " + sinif : "") + '" aria-hidden="true"><use href="' + IKON + ad + '"/></svg>'; };
  var GUN = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  var AY = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  /* tarih bölünmez (gün adı · gün · ay birlikte kalır); "Bugün" ise dar sütunda alt satıra geçebilir (1080 ölçümü) */
  var gunYaz = function (iso) { var d = new Date(iso + "T12:00:00"); return GUN[d.getDay()] + " " + d.getDate() + " " + AY[d.getMonth()]; };
  var gunKisa = function (iso) { var d = new Date(iso + "T12:00:00"); return d.getDate() + " " + AY[d.getMonth()]; };
  var tr = function (s) { return s.toLocaleLowerCase("tr"); };
  /* kırpma zinciri (kalıp 4): yaprak blok + üç nokta + tam metin title'da */
  var kirp = function (metin, sinif, baslik) { return '<span class="a-kirp' + (sinif ? " " + sinif : "") + '" title="' + kacis(baslik || metin) + '">' + kacis(metin) + "</span>"; };
  var rozet = function (d) { return '<span class="a-rozet ' + d.rozet + '">' + d.ad + "</span>"; };
  var bul = function (id) { return PLANLAR.filter(function (x) { return x.id === id; })[0]; };

  function veri() { return S.veri === "dolu" ? PLANLAR : []; }

  /* Taban: çipler HARİÇ her şey (arama + seçiciler). Çip sayıları buradan sayılır (dürüst sayaç, anayasa 2.8). */
  function taban() {
    var a = tr(S.ara.trim());
    return veri().filter(function (p) {
      if (a && tr([p.no, p.ad, p.musteri, p.adres, p.ilce, p.il].join(" ")).indexOf(a) < 0) return false;
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
  /* Varsayılan sıra: açık işler (bekliyor, kabul, denetimde) başlangıca göre ileri; kapanmışlar (tamam, red) en yeni önce, sonda. */
  function sirala(l) {
    var zaman = function (p) { return p.tarih + " " + p.bas; };
    if (S.sira === "varsayilan") {
      var acik = function (p) { return p.durum === "bekliyor" || p.durum === "kabul" || p.durum === "denetimde"; };
      return l.slice().sort(function (a, b) {
        if (acik(a) !== acik(b)) return acik(a) ? -1 : 1;
        var c = zaman(a).localeCompare(zaman(b));
        return acik(a) ? c : -c;
      });
    }
    var x = S.sira.split("-"), f = SIRA_ANAHTAR[x[0]], yon = x[1] === "azalan" ? -1 : 1;
    return l.slice().sort(function (a, b) {
      var u = f(a), v = f(b);
      var c = typeof u === "number" ? u - v : String(u).localeCompare(String(v), "tr");
      return c * yon || zaman(a).localeCompare(zaman(b));
    });
  }
  function aktifSecici() { return ["tarih", "musteri", "brans"].filter(function (k) { return S[k] !== "tumu"; }).length; }
  function suzgecVar() { return !!S.ara.trim() || S.secili.length > 0 || aktifSecici() > 0; }

  /* ── TEK LİSTE ÜRETİCİSİ ─────────────────────────────────────────────────────────────────────────────
     Aynı işaretleme: liste kabı eşiğin üstünde tablo, altında kart (maket.css @container liste). Plan listesi ve
     plan içindeki ekipman listesi bu üreticiden çıkar (kalıp 16-b: ikinci liste üreticisi açılmaz).
     Sütun: k · baslik · kart (ust | rozet | govde | eylem) · sira (kartta diziliş) · hucre(kayıt) → HTML. */
  function tabloHtml(o) {
    var bas = o.sutunlar.map(function (s) {
      if (s.gizliBaslik) return '<th scope="col"><span class="a-gizli">' + s.baslik + "</span></th>";
      if (!o.siralanir) return '<th scope="col">' + s.baslik + "</th>";
      var yon = S.sira === s.k + "-artan" ? "ascending" : S.sira === s.k + "-azalan" ? "descending" : "";
      return '<th scope="col"' + (yon ? ' aria-sort="' + yon + '"' : "") + '><button class="a-sirala" type="button" data-sirala="' + s.k + '">' +
        s.baslik + ikon(yon === "ascending" ? "arrow-up" : yon === "descending" ? "arrow-down" : "arrow-up-down", "a-ikon-kucuk") + "</button></th>";
    }).join("");
    var govde = o.kayitlar.map(function (r) {
      var href = o.href ? o.href(r) : "";
      return "<tr" + (href ? ' data-href="' + href + '"' : "") + ">" + o.sutunlar.map(function (s) {
        return '<td data-alan="' + s.k + '" data-kart="' + s.kart + '" style="--sira:' + s.sira + '">' + s.hucre(r) + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return '<table class="a-tablo ' + o.sinif + '"><caption class="a-gizli">' + o.baslik + "</caption><colgroup>" +
      o.sutunlar.map(function (s) { return '<col class="a-k-' + s.k + '">'; }).join("") + "</colgroup>" +
      "<thead><tr>" + bas + "</tr></thead><tbody>" + govde + "</tbody></table>";
  }
  function tus(eylem, p, ad, ik, kapali, sinif, sebepId) {
    return '<button class="a-tus ' + (sinif || "a-tus-birincil") + '" type="button" data-eylem="' + eylem + '" data-id="' + p.id + '"' +
      (kapali ? " disabled" + (sebepId ? ' aria-describedby="' + sebepId + '"' : "") : "") + ">" + (ik ? ikon(ik, "a-ikon-kucuk") : "") + ad + "</button>";
  }

  /* ── PLAN LİSTESİ ─────────────────────────────────────────────────────────────────────────────────── */
  function ekipHtml(p) {
    var tam = p.ekip.map(function (k) { return KISI[k].ad + " (" + KISI[k].brans + ")"; }).join(" · ");
    var fazla = p.ekip.length > 2 ? ' <span class="a-ekip-fazla">+' + (p.ekip.length - 2) + "</span>" : "";
    var adlar = p.ekip.slice(0, 2).map(function (k, i) { return '<span class="a-ekip-ad">' + KISI[k].ad + (i === 1 ? fazla : "") + "</span>"; }).join("");
    return '<span class="a-hucre-satir" title="' + kacis(tam) + '">' + ikon("users", "a-ikon-kucuk a-kart-ikon") + '<span class="a-ekip">' + adlar + "</span></span>";
  }
  /* Satırda TEK eylem tuşu (reisim 2026-09-23): Kabul et → Denetime başla → Devam et. Tamamlandı ve Reddedildi'de tuş yok;
     plana satırdan ya da proje numarasından girilir. Reddet plan içinde. */
  function listeEylem(p) {
    var t = "", not = "", sid = "a-sebep-" + p.id;
    if (p.durum === "bekliyor") {
      t = tus("kabul", p, "Kabul et", "check", !!p.eksik, "", sid);
      if (p.eksik) not = '<div class="a-sebep" id="' + sid + '">' + ikon("triangle-alert", "a-ikon-kucuk") + "<span>" + kacis(p.eksik) + "</span></div>";
    } else if (p.durum === "kabul") {
      var erken = p.tarih > BUGUN;
      t = tus("basla", p, "Denetime başla", "play", erken, "", sid);
      if (erken) not = '<div class="a-not" id="' + sid + '">Plan gününde başlar.</div>';
    } else if (p.durum === "denetimde") {
      t = tus("devam", p, "Devam et", "arrow-right");
    } else if (p.durum === "red") {
      not = '<div class="a-not">Gerekçe: ' + kacis(p.gerekce || "") + "</div>";
    }
    if (!t && !not) return "";
    return '<div class="a-eylem">' + (t ? '<div class="a-eylem-tuslar">' + t + "</div>" : "") + not + "</div>";
  }
  var PLAN_SUTUN = [
    { k: "no", baslik: "Proje no", kart: "ust", sira: 1, hucre: function (p) { return '<a class="a-no" href="#/plan/' + p.id + '">' + p.no + "</a>"; } },
    { k: "ad", baslik: "Proje adı", kart: "govde", sira: 2, hucre: function (p) { return kirp(p.ad, "a-proje-ad"); } },
    { k: "musteri", baslik: "Müşteri", kart: "govde", sira: 4, hucre: function (p) { return '<span class="a-hucre-satir">' + ikon("building-2", "a-ikon-kucuk a-kart-ikon") + kirp(p.musteri) + "</span>"; } },
    { k: "adres", baslik: "Adres", kart: "govde", sira: 5, hucre: function (p) {
      return '<span class="a-hucre-satir">' + ikon("map-pin", "a-ikon-kucuk a-kart-ikon") + '<span class="a-adres">' +
        kirp(p.adres, "a-adres-sokak", p.adres + ", " + p.ilce + " / " + p.il) + '<span class="a-adres-il">' + p.ilce + " / " + p.il + "</span></span></span>";
    } },
    { k: "ekip", baslik: "Inspector", kart: "govde", sira: 6, hucre: ekipHtml },
    { k: "baslangic", baslik: "Başlangıç", kart: "govde", sira: 3, hucre: function (p) {
      return '<span class="a-tarih-gun">' + gunYaz(p.tarih) + (p.tarih === BUGUN ? ' <span class="a-bugun">Bugün</span>' : "") + "</span>" +
        '<span class="a-tarih-saat">' + p.bas + " – " + p.bit + "</span>";
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (p) { return rozet(DURUM[p.durum]); } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: listeEylem }
  ];

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
      var sec = s.secenek(), gor = sec.filter(function (o) { return o[0] === S[s.k]; })[0];
      return '<div class="a-secici' + (s.siralama ? " a-secici-sira" : "") + '" data-secici="' + s.k + '">' +
        '<button class="a-secici-tus" type="button" aria-haspopup="listbox" aria-expanded="false" data-secici-ac="' + s.k + '">' +
        '<span class="a-secici-etiket">' + s.ad + '</span><span class="a-secici-deger">' + kacis(gor[1]) + "</span>" + ikon("chevron-down", "a-ikon-kucuk") + "</button>" +
        '<div class="a-secici-liste" role="listbox" aria-label="' + s.ad + '" hidden>' +
        sec.map(function (o) {
          return '<button class="a-secenek" type="button" role="option" aria-selected="' + (o[0] === S[s.k]) + '" data-sec="' + s.k + '" data-deger="' + kacis(o[0]) + '">' +
            ikon("check", "a-ikon-kucuk") + '<span class="a-kirp">' + kacis(o[1]) + "</span></button>";
        }).join("") + "</div></div>";
    }).join("");
    $("a-levha-govde").innerHTML = SECICI.map(function (s) {
      return '<div class="a-levha-grup"><p class="a-levha-grup-ad">' + s.ad + '</p><div class="a-levha-secenekler">' +
        s.secenek().map(function (o) {
          return '<button class="a-cip" type="button" aria-pressed="' + (o[0] === S[s.k]) + '" data-sec="' + s.k + '" data-deger="' + kacis(o[0]) + '">' + kacis(o[1]) + "</button>";
        }).join("") + "</div></div>";
    }).join("");
    var r = $("a-suzgec-rozet"), n = aktifSecici();
    r.hidden = !n; r.textContent = n || "";
  }
  function bos(tur) {
    var d = {
      yok: ["inbox", "Atanmış plan yok", "Planlama ekibi plan açınca burada görünür.", ""],
      suzgec: ["search", "Süzgece uyan plan yok", "Arama ya da süzgeç değiştirilince liste yeniden dolar.", '<button class="a-tus a-tus-ikincil" type="button" data-eylem="temizle">Süzgeci temizle</button>'],
      imkansiz: ["circle-alert", "Bir plan aynı anda iki durumda olamaz", "“ve” seçiliyken iki durum çipi birlikte hiçbir plana uymaz. “veya” ile ikisindeki planlar birlikte listelenir.", '<button class="a-tus a-tus-ikincil" type="button" data-kip="veya">“veya”ya geç</button>'],
      hata: ["refresh-cw", "Planlar yüklenemedi", "Sunucuya bağlanılamadı; liste eski hâliyle gösterilmiyor.", '<button class="a-tus a-tus-ikincil" type="button" data-eylem="tekrar">' + ikon("refresh-cw", "a-ikon-kucuk") + "Tekrar dene</button>"],
      plan: ["circle-alert", "Plan bulunamadı", "Bu adresteki plan listede yok ya da artık size atanmış değil.", '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Planlarım'a dön</a>"],
      /* ⛔ 2026-09-23 (2. tur): yükleme hatasında plan içi "bulunamadı" diyordu — plan var olabilir, yüklenemedi (anayasa 2.8 dürüstlük) */
      planHata: ["refresh-cw", "Plan yüklenemedi", "Sunucuya bağlanılamadı; plan eski hâliyle gösterilmiyor.", '<button class="a-tus a-tus-ikincil" type="button" data-eylem="tekrar">' + ikon("refresh-cw", "a-ikon-kucuk") + "Tekrar dene</button>"]
    }[tur];
    return '<div class="a-bos' + (tur === "hata" || tur === "planHata" ? " a-bos-hata" : "") + '" role="status"><div class="a-bos-ikon">' + ikon(d[0]) + "</div>" +
      '<p class="a-bos-baslik">' + d[1] + '</p><p class="a-bos-metin">' + d[2] + "</p>" + d[3] + "</div>";
  }
  function menuSayi() {
    var ms = PLANLAR.filter(function (p) { return p.durum === "bekliyor"; }).length;
    $("a-menu-sayi").textContent = ms || ""; $("a-menu-sayi").hidden = !ms || S.veri !== "dolu";
  }
  /* Sıralama seçicisi yalnız KART kipinde satırda görünür: kip CSS'in kendi kararından okunur (kartta başlık yok). */
  function listeKipi() {
    var th = document.querySelector("#a-liste thead");
    if (th) $("a-suzgec").setAttribute("data-liste-kip", getComputedStyle(th).display === "none" ? "kart" : "tablo");
  }
  function ciz() {
    var t = taban(), liste = sirala(t.filter(cipGecer)), toplam = veri().length;
    cizCipler(t);
    $("a-temizle").disabled = !suzgecVar();
    menuSayi();
    if (S.veri === "hata") { $("a-sayac").innerHTML = "—"; $("a-liste").innerHTML = bos("hata"); return; }
    $("a-sayac").innerHTML = suzgecVar() ? "<b>" + liste.length + "</b> / " + toplam + " plan" : "<b>" + toplam + "</b> plan";
    if (!toplam) { $("a-liste").innerHTML = bos("yok"); return; }
    if (!liste.length) { $("a-liste").innerHTML = bos(imkansiz() ? "imkansiz" : "suzgec"); return; }
    $("a-liste").innerHTML = tabloHtml({ baslik: "Planlarım", sinif: "a-tablo-plan", sutunlar: PLAN_SUTUN, kayitlar: liste, siralanir: true,
      href: function (p) { return "#/plan/" + p.id; } });
    listeKipi();
  }

  /* ── PLAN İÇİ (nesne sayfası, anayasa 2.7: kırıntı + kimlik + bilgi yüzleri + tek birincil tuş + araç çubuğu) ── */
  function serit(tur, ik, metin, id) {
    return '<div class="a-serit a-serit-' + tur + '"' + (id ? ' id="' + id + '"' : "") + ">" + ikon(ik, "a-ikon-kucuk") + "<span>" + metin + "</span></div>";
  }
  function planEylem(p) {
    var ikincil = [], birincil = "", not = "", sid = "a-plan-sebep-" + p.id;
    var baslamadi = p.ekipman.filter(function (e) { return e.rapor === "yok"; }).length;
    if (p.durum === "bekliyor") {
      ikincil.push(tus("reddet", p, "Reddet", "", false, "a-tus-ikincil"));
      birincil = tus("kabul", p, "Kabul et", "check", !!p.eksik, "", sid);
      if (p.eksik) not = serit("uyari", "triangle-alert", kacis(p.eksik), sid);
    } else if (p.durum === "kabul") {
      var erken = p.tarih > BUGUN;
      birincil = tus("basla", p, "Denetime başla", "play", erken, "", sid);
      if (erken) not = serit("bilgi", "clock", "Denetim plan gününde, " + gunYaz(p.tarih) + " başlar.", sid);
    } else if (p.durum === "denetimde") {
      birincil = tus("tamamla", p, "Tamamla", "circle-check");
      /* saat sonrasına ek yazılmaz ("09:04'te" / "16:40'ta" ünlü uyumu değişir) → "Denetim başladı: <zaman>." */
      not = serit("bilgi", "clock", "Denetim başladı: " + p.basladi + "." + (baslamadi ? " " + baslamadi + " ekipmanın raporu başlamadı." : ""));
    } else if (p.durum === "tamam") {
      ikincil.push(tus("geri-al", p, "Tamamlamayı geri al", "undo-2", false, "a-tus-ikincil"));
      not = serit("onay", "circle-check", "Tamamlandı: " + p.bitti + ". Raporlar düzenlenebilir; geri alınırsa plan yeniden denetime açılır.");
    } else if (p.durum === "red") {
      not = serit("hata", "circle-x", "Gerekçe: " + kacis(p.gerekce || ""));
    }
    var tuslar = ikincil.join("") + birincil;
    return { tuslar: tuslar, not: not };
  }
  function raporTus(p, e) {
    if (p.durum !== "denetimde" && p.durum !== "tamam") return "";
    var d = e.rapor === "yok" ? ["file-plus", "Rapor oluştur"] : e.rapor === "taslak" ? ["pencil", "Raporu düzenle"] : ["file-text", "Raporu aç"];
    return '<div class="a-eylem"><div class="a-eylem-tuslar"><button class="a-tus a-tus-ikincil" type="button" data-eylem="kapsam-disi" data-ne="Saha rapor ekranı">' +
      ikon(d[0], "a-ikon-kucuk") + d[1] + "</button></div></div>";
  }
  function yuz(etiket, ik, deger) {
    return '<div class="a-yuz"><p class="a-yuz-etiket">' + ikon(ik, "a-ikon-kucuk") + etiket + '</p><div class="a-yuz-deger">' + deger + "</div></div>";
  }
  function planCiz(p) {
    menuSayi();
    if (!p) { $("a-plan").innerHTML = '<nav class="a-kirinti" aria-label="Konum"><a href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Planlarım</a></nav>" +
      '<h1 class="a-gizli" tabindex="-1">' + (S.veri === "hata" ? "Plan yüklenemedi" : "Plan bulunamadı") + "</h1>" + bos(S.veri === "hata" ? "planHata" : "plan"); return; }
    var ey = planEylem(p);
    var sayim = { yok: 0, taslak: 0, onayda: 0 };
    p.ekipman.forEach(function (e) { sayim[e.rapor]++; });
    var dokum = ["taslak", "onayda", "yok"].filter(function (k) { return sayim[k]; }).map(function (k) { return sayim[k] + " " + RAPOR[k].ad.toLocaleLowerCase("tr"); }).join(" · ");
    var isg = !p.isg ? '<span class="a-yuz-uyari">Kayıt yok</span>'
      : kacis(p.isg.no) + '<span class="a-yuz-alt' + (p.eksik ? " a-yuz-uyari" : "") + '">Onay ' + gunKisa(p.isg.onay) + "</span>";
    var cubuk = ey.tuslar ? ey.tuslar : "";
    var ekpSutun = [
      { k: "ekipman", baslik: "Ekipman", kart: "ust", sira: 1, hucre: function (e) { return kirp(e.ad, "a-ekipman-ad") + '<span class="a-ekipman-kod">' + e.kod + "</span>"; } },
      { k: "brans", baslik: "Branş", kart: "govde", sira: 2, hucre: function (e) { return '<span class="a-hucre-satir">' + ikon(e.brans === "m" ? "cog" : "zap", "a-ikon-kucuk") + (e.brans === "m" ? "Mekanik" : "Elektrik") + "</span>"; } },
      { k: "rapor", baslik: "Rapor", kart: "rozet", sira: 1, hucre: function (e) { return rozet(RAPOR[e.rapor]); } },
      { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (e) { return raporTus(p, e); } }
    ];
    var baslamadiNot = (p.durum === "bekliyor" || p.durum === "kabul") ? serit("bilgi", "clock", "Raporlar denetim başlayınca açılır.") : "";
    $("a-plan").innerHTML =
      '<nav class="a-kirinti" aria-label="Konum"><a href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Planlarım</a>" +
        ikon("chevron-right", "a-ikon-kucuk") + '<span aria-current="page">' + p.no + "</span></nav>" +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik">' +
        '<div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(p.ad) + "</h1>" + rozet(DURUM[p.durum]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + "<span>" + kacis(p.musteri) + "</span></p></div>" +
        (cubuk ? '<div class="a-eylem-cubugu a-eylem-cubugu-ust">' + cubuk + "</div>" : "") + "</div>" +
      ey.not +
      '<div class="a-yuzler">' +
        yuz("Başlangıç", "calendar-check", gunYaz(p.tarih) + (p.tarih === BUGUN ? ' <span class="a-bugun">Bugün</span>' : "") + '<span class="a-yuz-alt">' + p.bas + " – " + p.bit + "</span>") +
        yuz("Adres", "map-pin", kacis(p.adres) + '<span class="a-yuz-alt">' + p.ilce + " / " + p.il + "</span>") +
        yuz("Inspector", "users", p.ekip.map(function (k) { return '<span class="a-yuz-satir">' + KISI[k].ad + ' <span class="a-yuz-ek">' + KISI[k].brans + "</span></span>"; }).join("")) +
        yuz("İSG-KATİP", "shield-check", isg) +
        yuz("Ekipman", "wrench", p.ekipman.length + " ekipman" + '<span class="a-yuz-alt">' +
          [p.m ? "Mekanik " + p.m : "", p.e ? "Elektrik " + p.e : ""].filter(Boolean).join(" · ") + "</span>") +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-ekipman-baslik"><div class="a-bolum-bas"><h2 id="a-ekipman-baslik">Ekipmanlar</h2>' +
        '<span class="a-sayac">' + dokum + "</span>" +
        (p.durum === "denetimde" ? '<button class="a-tus a-tus-ikincil a-bolum-tus" type="button" data-eylem="kapsam-disi" data-ne="Ekipman ekleme">' + ikon("plus", "a-ikon-kucuk") + "Ekipman ekle</button>" : "") +
        "</div>" + baslamadiNot +
        '<div class="a-liste-kap">' + tabloHtml({ baslik: "Plandaki ekipmanlar", sinif: "a-tablo-ekipman", sutunlar: ekpSutun, kayitlar: p.ekipman }) + "</div></section>" +
      (cubuk ? '<div class="a-eylem-cubugu a-eylem-cubugu-alt">' + cubuk + "</div>" : "");
  }

  /* ── GÖRÜNÜM (adres #/plan/<id> → plan içi; başka her şey → liste) ───────────────────────────────── */
  function rotaId() { var m = /^#\/plan\/(\d+)$/.exec(location.hash); return m ? +m[1] : null; }
  function goster(odakla) {
    var id = rotaId(), planda = id !== null, p = planda && S.veri === "dolu" ? bul(id) : null;
    $("a-liste-gorunum").hidden = planda; $("a-plan").hidden = !planda;
    if (planda) planCiz(p); else ciz();
    document.title = (p ? p.no + " · " + p.ad : "Planlarım") + " · probata maket";
    if (odakla) {
      window.scrollTo(0, 0);
      var h = document.querySelector(planda ? "#a-plan h1" : "#a-liste-gorunum h1");
      if (h) h.focus({ preventScroll: true });
    }
  }
  function git(id) { if (rotaId() === id) goster(false); else location.hash = "#/plan/" + id; }

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
  /* Temizle yalnız SÜZGECİ sıfırlar; sıralama süzgeç değildir, kalır. */
  function temizle() { S.ara = ""; S.secili = []; S.kip = "veya"; S.tarih = S.musteri = S.brans = "tumu"; $("a-ara-girdi").value = ""; $("a-ara").classList.remove("a-dolu"); }
  var redId = null;

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-cip],[data-kip],[data-sec],[data-secici-ac],[data-sirala],[data-eylem]");
    if (!e.target.closest(".a-secici")) listeleriKapat(null);
    if (!el) {
      /* tıklanır satır / kart: tuşa ya da bağlantıya basılmadıysa plana girer */
      var satir = e.target.closest("tr[data-href]");
      if (satir && !e.target.closest("a, button")) location.hash = satir.getAttribute("data-href");
      return;
    }
    if (el.dataset.cip) {
      var i = S.secili.indexOf(el.dataset.cip);
      if (i >= 0) S.secili.splice(i, 1); else S.secili.push(el.dataset.cip);
      ciz(); return;
    }
    if (el.dataset.kip) { if (!el.disabled) { S.kip = el.dataset.kip; ciz(); } return; }
    if (el.dataset.sirala) {
      var k = el.dataset.sirala;
      S.sira = S.sira === k + "-artan" ? k + "-azalan" : S.sira === k + "-azalan" ? "varsayilan" : k + "-artan";
      cizSeciciler(); ciz();
      var yeni = document.querySelector('[data-sirala="' + k + '"]'); if (yeni) yeni.focus();
      return;
    }
    if (el.dataset.seciciAc) {
      var kap = el.closest(".a-secici"), l = kap.querySelector(".a-secici-liste"), acik = l.hidden;
      listeleriKapat(kap); l.hidden = !acik; el.setAttribute("aria-expanded", String(acik));
      if (acik) (l.querySelector('[aria-selected="true"]') || l.firstElementChild).focus();
      return;
    }
    if (el.dataset.sec) { S[el.dataset.sec] = el.dataset.deger; cizSeciciler(); ciz(); return; }
    var id = +el.dataset.id, p = bul(id);
    switch (el.dataset.eylem) {
      case "cekmece-ac": cekmece(true); break;
      case "cekmece-kapat": cekmece(false); break;
      case "tema":
        var tema = document.documentElement.getAttribute("data-tema") === "koyu" ? "acik" : "koyu";
        document.documentElement.setAttribute("data-tema", tema);
        try { localStorage.setItem("probata-tema", tema); } catch (x) {}
        temaEtiketi(); break;
      case "ara-sil": S.ara = ""; $("a-ara-girdi").value = ""; $("a-ara").classList.remove("a-dolu"); ciz(); $("a-ara-girdi").focus(); break;
      case "temizle": temizle(); cizSeciciler(); ciz(); break;
      case "levha-ac": $("a-levha").showModal(); break;
      case "levha-kapat": $("a-levha").close(); break;
      case "tekrar": S.veri = "dolu"; goster(false); break;
      case "kabul": if (p && p.durum === "bekliyor" && !p.eksik) { p.durum = "kabul"; goster(false); bildir("Plan kabul edildi."); } break;
      case "basla":
        if (p && p.durum === "kabul" && p.tarih <= BUGUN) { p.durum = "denetimde"; p.basladi = gunKisa(BUGUN) + " " + SAAT; bildir("Denetim başladı."); git(id); }
        break;
      case "devam": if (p) git(id); break;
      case "tamamla": if (p && p.durum === "denetimde") { p.durum = "tamam"; p.bitti = gunKisa(BUGUN) + " " + SAAT; goster(false); bildir("Plan tamamlandı."); } break;
      case "geri-al": if (p && p.durum === "tamam") { p.durum = "denetimde"; goster(false); bildir("Tamamlama geri alındı; plan yeniden denetime açıldı."); } break;
      case "reddet":
        if (!p) break;
        redId = id; $("a-red-gerekce").value = ""; $("a-red-onay").disabled = true;
        $("a-red-ozet").innerHTML = "<b>" + kacis(p.ad) + "</b> · " + p.no + "<br>" + kacis(p.musteri) + "<br>" + gunYaz(p.tarih) + " · " + p.bas + " – " + p.bit;
        $("a-red-ipucu").className = "a-ipucu"; $("a-red-ipucu").hidden = false; $("a-red-pencere").showModal(); $("a-red-gerekce").focus(); break;
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
    var p = bul(redId);
    if (p && p.durum === "bekliyor") { p.durum = "red"; p.gerekce = g; }
    $("a-red-pencere").close(); goster(false); bildir("Plan reddedildi; gerekçe planlama ekibine gider.");
  });
  window.addEventListener("hashchange", function () { goster(true); });
  window.addEventListener("resize", function () { if (!$("a-liste-gorunum").hidden) listeKipi(); });
  function temaEtiketi() {
    var k = document.documentElement.getAttribute("data-tema") === "koyu";
    $("a-tema-tus").setAttribute("aria-label", k ? "Açık temaya geç" : "Koyu temaya geç");
  }

  temaEtiketi(); cizSeciciler(); goster(false);
})();
