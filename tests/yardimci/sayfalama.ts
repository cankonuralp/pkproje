/* SAYFALAMA KAYNAK KİLİDİ (2026-10-16; reisim: "herhangi bir tabloda 20 den sonrası sayfalı olacak … herhangi bir liste tablo, ekranda çok fazla veri
   olunca ekran kasacağı için 20 den fazlası sayfalı olsun"). Saf denetim işlevleri — kilit tests/sayfalama.test.ts, olumsuz kanıt
   tests/bozan/sayfa.bozan.ts. Dosya adları src/'ye göre ("modules/…/X.tsx"); bulgu "dosya: neden" listesi.
   · ekran tablosu (<table) ortak sayfalamayla çizilir: dosyadaki her <table için bir <TabloSayfalari (useSayfa) ve satırları sayfanın dilimiyle
     (.dilim( — sayfalayıcı çizilip bütün satırlar da çizilirse yakalanır) — yeni tablo sayfalamasız eklenirse yakalanır; Liste.tsx tek üretici
     kendisi sayfalar;
   · süzgeçli listenin tanımı (imkansiz: alanı olan nesne) sayfa boyu taşır (sayfa:) — süzgeçli liste sayfasız kalamaz;
   · taramada bulunan ul / ol listeleri (SAYFALI_LISTELER) ortak parçayı (SayfaliListe / useSayfa) kullanır, sayısı düşemez;
   · dokunulmayanlar gerekçeli (SAYFASIZ_TABLOLAR): belge / PDF bütün satırları basar, kurucunun kâğıdı ve Belge önizlemesi şablon, grafiğin gizli
     metin karşılığı grafiğin kendisiyle aynı satırlar;
   · saha raporu (sahaSayfaEksikleri): ölçüm tablosu ve kontrol listesi sayfası rapor ekranında, tek kuralla — tablo değişince ilk değişen satırın
     sayfası, eksiğe git ve S.A.Y'ın işaretlediği madde en üstteki yerin sayfası (src/modules/raporlar/sayfa-yeri.ts). */

/** <table çizen ama sayfalanmayan dosyalar — gerekçeyle (yenisi buraya gerekçesiyle yazılır) */
export const SAYFASIZ_TABLOLAR: Readonly<Record<string, string>> = {
  "modules/rapor-format/ui/Kagit.tsx": "format kurucusunun kâğıdı: şablonun sütunları ve örnek satırı (veri satırı yok)",
  "modules/rapor-format/ui/FormatOnizleme.tsx": "kurucunun Belge önizlemesi: belge bütün satırları basar",
  "components/grafik/Grafik.tsx": "grafiğin ekran okuyucu karşılığı (gizli): grafikteki çubuklarla aynı satırlar",
};

/** taramada bulunan, 20'den çok satır olabilen ul / ol listeleri → en az kaç sayfalama (<SayfaliListe + useSayfa() ve gerekçe */
export const SAYFALI_LISTELER: Readonly<Record<string, [number, string]>> = {
  "modules/raporlar/ui/Bloklar.tsx": [3, "ölçüm tablosu + kontrol listesi maddeleri (useSayfa) + kusur açıklamaları"],
  "modules/planlar/ui/PlanAcFormu.tsx": [3, "tesisteki ekipmanlar + elle eklenecek ekipmanlar + denetçiler"],
  "modules/teklifler/ui/TeklifFormu.tsx": [1, "teklif kalemleri (en çok 100)"],
  "app/(uygulama)/ekipman-turleri/[id]/sablon/[sid]/page.tsx": [1, "format sürümünün önceki sürüme göre değişenleri"],
  "modules/planlar/ui/EkipmanBolumu.tsx": [1, "kayıtlı ekipmandan seçim"],
  "modules/planlar/ui/PlanEpostalari.tsx": [1, "bilgilendirme e-postaları"],
  "modules/planlar/ui/ProjeNotlari.tsx": [1, "proje notları (Tümünü göster)"],
  "modules/zimmetler/ui/VarlikParcalari.tsx": [1, "varlığın teslim geçmişi"],
  "modules/firma-ayarlari/ui/IceAktarma.tsx": [2, "satır denetimi önizlemesi + son içe aktarımlar"],
  "modules/say-chat/ui/SayChat.tsx": [5, "kayıtlar, rapora dönüşecekler, oluşan rapor taslakları, plandaki ekipman ve tür seçimi"],
  "modules/olcum-cihazlari/ui/TurPencereleri.tsx": [1, "cihaz türleri penceresi"],
  "components/cevrimdisi/Cevrimdisi.tsx": [1, "cihazda bekleyen işler"],
  "app/(musteri)/portal/r/[id]/page.tsx": [1, "müşteri panelinde raporun uygunsuzlukları"],
};

const say = (metin: string, re: RegExp) => (metin.match(re) ?? []).length;
const ad = (yol: string) => yol.replace(/\\/g, "/").replace(/^src\//, "");

/** ekran tablosu sayfalamasız: <table sayısı <TabloSayfalari ya da sayfa dilimi (.dilim() sayısını aşan dosya (izinli dokunulmayanlar hariç;
    Liste.tsx kendisi sayfalamalı) */
export function sayfasizTablolar(tsx: readonly { ad: string; metin: string }[], izin: Readonly<Record<string, string>> = SAYFASIZ_TABLOLAR): string[] {
  const hata: string[] = [];
  const gorulen = new Set<string>();
  for (const d of tsx) {
    const a = ad(d.ad);
    if (a.startsWith("belge/")) continue;   // rapor belgesi ve PDF: bütün satırlar (src/belge)
    const tablo = say(d.metin, /<table\b/g);
    if (!tablo) continue;
    if (a in izin) { gorulen.add(a); continue; }
    if (a === "components/liste/Liste.tsx") {
      if (!/useSayfa\(kayitlar\.length\b/.test(d.metin) || !/\.dilim\(kayitlar\)/.test(d.metin) || !/<TabloSayfalari\b/.test(d.metin)) hata.push(`${a}: tek üretici kayıtları sayfalamıyor`);
      continue;
    }
    const sayfali = say(d.metin, /<TabloSayfalari\b/g);
    if (sayfali < tablo) hata.push(`${a}: ${tablo} tablo, ${sayfali} sayfalayıcı (useSayfa + TabloSayfalari)`);
    if (sayfali && !/useSayfa\(/.test(d.metin)) hata.push(`${a}: sayfalayıcı var, useSayfa yok`);
    const dilim = say(d.metin, /\.dilim\(/g);
    if (dilim < tablo) hata.push(`${a}: ${tablo} tablo, ${dilim} sayfa dilimi (satırlar sy.dilim(…) ile çizilmeli — yoksa bütün satırlar çizilir)`);
  }
  for (const a of Object.keys(izin)) if (!gorulen.has(a)) hata.push(`${a}: artık tablo yok — izinden çıkar`);
  return hata;
}

/** konumdaki { … } nesne yazımının sınırları (karakter, dize ve şablon içi süslü parantezler sayılmaz — kaba; tanım nesneleri için yeter) */
function nesneSiniri(metin: string, i: number): [number, number] | null {
  let derinlik = 0, bas = -1;
  for (let j = i; j >= 0; j--) {
    const c = metin[j];
    if (c === "}") derinlik++;
    else if (c === "{") { if (derinlik === 0) { bas = j; break; } derinlik--; }
  }
  if (bas < 0) return null;
  derinlik = 0;
  for (let j = bas; j < metin.length; j++) {
    const c = metin[j];
    if (c === "{") derinlik++;
    else if (c === "}" && --derinlik === 0) return [bas, j];
  }
  return null;
}

/** nesnenin KENDİ düzeyinde (iç nesneler değil) anahtar var mı */
function ustDuzeydeAnahtar(nesne: string, anahtar: string): boolean {
  let derinlik = 0;
  const re = new RegExp(`^\\b${anahtar}\\s*:`);
  for (let j = 0; j < nesne.length; j++) {
    const c = nesne[j];
    if (c === "{" || c === "(" || c === "[") derinlik++;
    else if (c === "}" || c === ")" || c === "]") derinlik--;
    else if (derinlik === 1 && /[\s,{]/.test(nesne[j - 1] ?? "") && re.test(nesne.slice(j))) return true;
  }
  return false;
}

/** süzgeçli listenin tanımı (imkansiz: alanı olan nesne yazımı) sayfa boyu taşımıyor — yalnız modül ve sayfa dosyaları (tip tanımı suzgec.ts'te) */
export function sayfasizSuzgecTanimlari(dosyalar: readonly { ad: string; metin: string }[]): string[] {
  const hata: string[] = [];
  for (const d of dosyalar) {
    const a = ad(d.ad);
    if (!a.startsWith("modules/") && !a.startsWith("app/")) continue;
    for (const m of d.metin.matchAll(/\bimkansiz\s*:/g)) {
      const s = nesneSiniri(d.metin, m.index!);
      if (!s) continue;
      const nesne = d.metin.slice(s[0], s[1] + 1);
      if (!ustDuzeydeAnahtar(nesne, "sayfa")) hata.push(`${a}: ${d.metin.slice(0, m.index).split("\n").length}. satırdaki süzgeç tanımında sayfa yok`);
    }
  }
  return hata;
}

/** taramadaki ul / ol listeleri ortak parçayla: dosyada en az n kez <SayfaliListe ya da useSayfa( (bulgu: eksik dosya, sayısı düşen) */
export function sayfasizListeler(tsx: readonly { ad: string; metin: string }[], liste: Readonly<Record<string, [number, string]>> = SAYFALI_LISTELER): string[] {
  const hata: string[] = [];
  const dosya = new Map(tsx.map((d) => [ad(d.ad), d.metin]));
  for (const [a, [n, neden]] of Object.entries(liste)) {
    const m = dosya.get(a);
    if (m === undefined) { hata.push(`${a}: dosya yok — listeden çıkar`); continue; }
    const bulunan = say(m, /<SayfaliListe\b/g) + say(m, /\buseSayfa\(/g);
    if (bulunan < n) hata.push(`${a}: ${neden} — ${n} sayfalama bekleniyordu, ${bulunan}`);
  }
  return hata;
}

/** saha raporunun sayfaları (Bloklar.tsx + SahaRaporu.tsx): ölçüm tablosu ve kontrol listesi sayfası rapor ekranında (bolumSayfasi); satır numarası
    genel, tablonun bütün satır sayısı işaretli (data-satir); tablo değişince ilk değişen satırın sayfası, eksiğe git ve S.A.Y'ın işaretlediği madde
    en üstteki yerin sayfasını açar (bulgu: eksik olanın tanımı) */
export function sahaSayfaEksikleri(bloklar: string, saha: string): string[] {
  const l: [string, string, RegExp][] = [
    ["ölçüm tablosunun sayfası rapor ekranında", bloklar,
      /useSayfa\(satirlar\.length, \{ deger: bag\.bolumSayfasi\(b\.id\), degistir: \(n\) => bag\.bolumSayfaGit\(b\.id, n\) \}\)/],
    ["ölçüm tablosunun satır numarası genel (sayfanın başı + sayfadaki sıra)", bloklar, /sy\.dilim\(satirlar\)\.map\(\(s, j\) => \{\s*const i = sy\.bas \+ j/],
    ["tablonun bütün satır sayısı bölgede (data-satir)", bloklar, /data-satir=\{satirlar\.length\}/],
    ["kontrol listesinin sayfası rapor ekranında", bloklar, /const sy = useSayfa\(b\.gruplar\.reduce[\s\S]{0,120}deger: bag\.bolumSayfasi\(b\.id\)/],
    ["kontrol listesi sayfanın maddeleriyle çizilir (gruplar boyunca, numara genel)", bloklar, /maddeDilimi\(b\.gruplar, sy\.bas, sy\.son\)\.map\(\(\{ g, gi, maddeler \}\)/],
    ["rapor ekranı sayfaları bağlamda verir", saha, /bolumSayfasi: \(b\) => bolumSayfa\[b\] \?\? 1, bolumSayfaGit/],
    ["tablo değişince ilk değişen satırın sayfası", saha,
      /if \(gorulenTablo !== cevaplar\.tablo\) \{[\s\S]{0,200}ilkDegisenSatirlar\(gorulenTablo, cevaplar\.tablo\)[\s\S]{0,200}setBolumSayfa\(/],
    ["eksiğe git en üstteki eksiğin sayfasını açar (tablo ve kontrol listesi)", saha,
      /const eksigeGit = \(l: readonly Eksik\[\]\) => \{[\s\S]{0,500}sayfalariAc\(l\.flatMap\(\(e\) => \{ const y = alanYeri\(e\.alan, maddeYerleri\)/],
    ["S.A.Y'ın işaretlediği maddenin sayfası açılır", saha, /const uygula = \(u: Uygulama[\s\S]{0,1400}sayfalariAc\(u\.isaretler\.flatMap/],
  ];
  const hata = l.filter(([, m, re]) => !re.test(m)).map(([ad]) => ad);
  if (say(bloklar, /<TabloSayfalari s=\{sy\} ad=\{b\.ad\} \/>/g) < 2) hata.push("ölçüm tablosunun ve kontrol listesinin sayfalayıcısı");
  return hata;
}
