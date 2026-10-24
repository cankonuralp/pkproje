/* RAPOR DÜZENİ — belgenin (src/belge/belge.ts) ve saha ekranının (raporlar/ui/SahaRaporu.tsx) ORTAK bölüm düzeni ve numaraları (427). Önce iki
   yerde ayrı yazılıydı. Saf; tanımdan hesaplanır.
   · 1 Firma bilgileri ve 2 ekipman bölümü sabittir. Formatın ekipman bilgi bölümü (kimliği "ekipman" ya da adında "ekipman" geçen, elle
     sorulan alanı olan bilgi bölümü) 2. bölüme katılır; 2. bölümün BAŞLIĞI o bölümün adıdır (ZPKR04 "Tesis bilgileri"), yoksa
     "Ekipman bilgileri". Yalnız kayıttan gelen alanlı bilgi bölümü 1. bölümün kopyasıdır, çizilmez.
   · Formatta cihaz bölümü yoksa ve rapora cihaz eklendiyse 3 "Ölçüm cihazları" sabit bölümü araya girer.
   · Numaralar: üst başlığı (ust) aynı olan ARDIŞIK bölümler tek numaranın altında N.1, N.2 … (Bakanlık: "Ana başlıklar ve sıralamaları
     değişmeyecek" — ZPKR04 5.1 / 5.2); numarasız bölüm numara almaz (ZPKR04 "Fotoğraflar"), sonrakilerin numarası kaymaz.
   · 461: alt başlık (alt) — üstündeki ANA bölümün (numaralı, üst başlıksız, kendisi alt olmayan) altında N.1, N.2 …; ana bölüm yoksa (ilk
     bölüm, numarasız bölümden sonra, üst başlıklı grubun ardından) alt bayrağı yok sayılır, bölüm ana numarasını alır.
   · 460: "tam" ekipman bölümü varsa 2. bölüme YALNIZ o katılır ve 2. bölümde ekipman kodu ve türü dışında sabit satır yoktur (marka, model …
     onun ekipman kaydına bağlı alanlarıdır). Tam bölümsüz eski formatta 2. bölümün sabit satırları: kod, tür ve formatın aynı adlı alanı
     olmayan marka, model, seri no, imal yılı, kullanım yeri, kullanım amacı (sabitEkipmanAlanlari) — belge ve saha ekranı aynı listeden.
   · 486: formatta ekipman bölümü kaldırıldıysa (gorunum.ekipman false — hata listesi 38) 2. bölüm yok: ekipman kodu ve türü 1. bölümde yazar,
     cihaz bölümü 2, format bölümleri 2'den (cihazlıysa 3'ten) sonra numaralanır; ekipman adlı bilgi bölümleri sıradan bölümdür.
   · 540 (reisim 2026-10-14, rapor ekranının görüntüsüyle: "SERİ NO BURADA DA VAR … DEĞİŞTİREMİYORUZ ? SAÇMA EKİPMAN BİLGİLERİNDEKİ HER ŞEY
     DEĞİŞTİRİLEBİLİR OLMALI EKİPMAN KODU HARİÇ"): tam ekipman bölümünde KAYITTAN gelen kopyalar çizilmez (tamAlanlari) — ekipman kodu ve türü
     2. bölümün sabit satırında zaten var; seri no ve kullanım yeri ekipman kaydına bağlı (raporda değiştirilebilir) alan olur, aynısı varsa çıkar.
     Ekran ve belge aynı listeden; Format kurucu formatın kendisini gösterir (sade: false). */
import {
  BAS_HUCRELERI, type BasHucresi, type BasSatiri, CIHAZ_ALAN_ADI, EKIPMAN_ALAN_ADI, FIRMA_KAYNAK_ADI, type Bolum, type BolumOf, type CihazAlani, type CihazSutunu, type EkipmanAlani, type FirmaKaynagi, type FirmaSatiri,
  type FormatTanimi, type ImzaSatiri, type ImzaYeri,
} from "./tanim.ts";
import { sonucKurallariniYaz } from "./sonuc.ts";

const kucuk = (s: string) => s.toLocaleLowerCase("tr");

export interface DuzenBolumu {
  b: Bolum;
  /** "5" · "5.1" · null (numarasız) */
  no: string | null;
  /** üst başlığın ilk alt bölümünde: üst başlığın numarası ve adı (önce o başlık çizilir) */
  ust: { no: string; ad: string } | null;
}
/** sonraki: formatta imza bölümü yoksa en sona eklenen "Yetkili kişi" bölümünün numarası */
/** tam: formatın tam ekipman bölümü (460) — varsa katilan yalnız odur. ekipman (486): 2. bölüm (ekipman bilgileri) var mı */
export interface RaporDuzeni {
  ekipman: boolean; ekipmanBaslik: string; katilan: BolumOf<"bilgi">[]; tam: BolumOf<"bilgi"> | null; cihazNo: string | null; bolumler: DuzenBolumu[]; sonraki: string;
}

/** 486: formatta 2. bölüm (ekipman bilgileri) var mı — kaldırılmadıysa var */
export const ekipmanBolumuVar = (t: FormatTanimi) => t.gorunum.ekipman !== false;

export const ekipmanBolumuMu = (b: Bolum): b is BolumOf<"bilgi"> =>
  b.blok === "bilgi" && (!!b.tam || ((b.id === "ekipman" || kucuk(b.ad).includes("ekipman")) && b.alanlar.some((a) => !a.kaynak)));

/** yalnız kayıttan gelen alanlı bilgi bölümü = 1 · Firma bilgileri'nin kopyası: çizilmez; 447: Format kurucuda SABİT (her formatta aynı, düzenlenmez) */
export const kayittanBolumMu = (b: Bolum): b is BolumOf<"bilgi"> => b.blok === "bilgi" && !b.tam && b.alanlar.length > 0 && b.alanlar.every((a) => a.kaynak);

export const tamBolum = (t: FormatTanimi): BolumOf<"bilgi"> | null => (t.bolumler.find((b) => b.blok === "bilgi" && b.tam) as BolumOf<"bilgi"> | undefined) ?? null;

/* eski formatın 2. bölümdeki sabit satırları: formatta aynı adlı (elle sorulan) alan varsa o satır çizilmez */
const ESKI_SABIT: readonly (readonly [EkipmanAlani, string])[] = [
  ["marka", "marka"], ["model", "model"], ["seri", "seri no"], ["imal", "imal"], ["konum", "kullanım yeri"], ["amac", "kullanım amacı"],
];
/** 2. bölümün kayıttan başlayan sabit satırları (eski format); tam ekipman bölümlü formatta yok */
export function sabitEkipmanAlanlari(t: FormatTanimi): EkipmanAlani[] {
  if (!ekipmanBolumuVar(t) || tamBolum(t)) return [];
  const adlar = t.bolumler.flatMap((b) => (b.blok === "bilgi" ? b.alanlar.filter((a) => !a.kaynak).map((a) => kucuk(a.ad)) : []));
  return ESKI_SABIT.filter(([, x]) => !adlar.some((ad) => ad.includes(x))).map(([k]) => k);
}

/* 2. bölümde zaten sabit satırı olan (kod, tür) ya da ekipman kaydına bağlı alanla aynı (seri no, kullanım yeri) kayıttan alanlar */
const EKIPMAN_KAYNAK = new Set(["ekipman_kodu", "ekipman_adi", "seri_no", "kullanim_yeri"]);

/** 460: eski formatı tam ekipman bölümlüye çevirir — Format kurucu açılırken. Belgenin satırları ve sırası aynı kalır: eski sabit satırlar
    (sabitEkipmanAlanlari) ekipman kaydına bağlı alan olur, ardından "Ekipman bölümü", sonra formatın kendi ekipman alanları. 2. bölümde sabit
    satırı olan kayıttan alanlar (kod, tür, seri no, kullanım yeri) kilitli değilse çıkar. Ekipman bölümü yoksa 1. bölümün kopyasından sonra açılır. */
export function ekipmanTamYap(t: FormatTanimi): FormatTanimi {
  if (!ekipmanBolumuVar(t) || tamBolum(t)) return t;
  const kimlikler = new Set(t.bolumler.flatMap((b) => [b.id, ...(b.blok === "bilgi" ? b.alanlar.map((a) => a.id) : [])]));
  const tekil = (on: string) => { let id = on; for (let n = 2; kimlikler.has(id); n++) id = `${on}${n}`; kimlikler.add(id); return id; };
  const bagli = (k: EkipmanAlani) => ({ id: tekil(`e_${k}`), ad: EKIPMAN_ALAN_ADI[k], tur: "metin" as const, zorunlu: false, kilit: false, ekipman: k });
  const on = [...sabitEkipmanAlanlari(t).map(bagli), bagli("bolum")];
  /* hedef: formatın ekipman bölümü; yoksa yalnız kayıttan alanlı "Ekipman bilgileri" (boş formatın) */
  const i = t.bolumler.findIndex((b) => ekipmanBolumuMu(b));
  const j = i >= 0 ? i : t.bolumler.findIndex((b) => b.blok === "bilgi" && (b.id === "ekipman" || kucuk(b.ad).includes("ekipman")));
  if (j >= 0) {
    const b = t.bolumler[j] as BolumOf<"bilgi">;
    const kalan = b.alanlar.filter((a) => a.kilit || !a.kaynak || !EKIPMAN_KAYNAK.has(a.kaynak));
    return { ...t, bolumler: t.bolumler.map((x, n) => (n === j ? { ...b, tam: true, alanlar: [...on, ...kalan] } : x)) };
  }
  const yeni: BolumOf<"bilgi"> = { id: tekil("ekipman"), ad: "Ekipman bilgileri", blok: "bilgi", kilit: false, tam: true, alanlar: on };
  const p = t.bolumler.findIndex((b) => kayittanBolumMu(b)) + 1;
  return { ...t, bolumler: [...t.bolumler.slice(0, p), yeni, ...t.bolumler.slice(p)] };
}

/** 459: ölçüm cihazları bölümü SABİT (reisim 2026-10-09: "sabit olan tek şey firma bilgileri, cihazlar ve standartlar") — formatta yoksa Format
    kurucu açılırken 2. bölümden hemen sonra eklenir (3. bölüm; cihazlı raporda belge onu zaten orada basıyordu — raporDuzeni cihazEk). Satırları
    türün ölçüm cihazı türlerinden (tür sayfası), denetçi sahada zimmetindeki cihazı ekler. */
export function cihazBolumuEkle(t: FormatTanimi): FormatTanimi {
  if (t.bolumler.some((b) => b.blok === "cihaz")) return t;
  const ilk = raporDuzeni(t, false).bolumler[0]?.b;
  const p = ilk ? t.bolumler.indexOf(ilk) : t.bolumler.length;
  const kimlikler = new Set(t.bolumler.map((b) => b.id));
  let id = "cihaz";
  for (let n = 2; kimlikler.has(id); n++) id = `cihaz${n}`;
  const yeni: Bolum = { id, ad: "Ölçüm cihazları", blok: "cihaz", kilit: false };
  return { ...t, bolumler: [...t.bolumler.slice(0, p), yeni, ...t.bolumler.slice(p)] };
}
/** Format kurucu açılırken: ekipman bölümü serbest (460), ölçüm cihazları bölümü var (459), hesaplı tablonun Bakanlık kuralları tablonun sonuç
    kuralı olarak görünür ve değişir (2026-10-16 — ./sonuc.ts; sonuç aynı) */
export const kurucuyaHazirla = (t: FormatTanimi): FormatTanimi => (t.gorunum.serbest ? sonucKurallariniYaz(t) : sonucKurallariniYaz(cihazBolumuEkle(ekipmanTamYap(t))));

/* 540: tam ekipman bölümünde kayıttan gelen alanın karşılığı — null: 2. bölümün sabit satırında var (çizilmez) */
const KAYITTAN_EKIPMAN: Partial<Record<string, EkipmanAlani | null>> = { ekipman_kodu: null, ekipman_adi: null, seri_no: "seri", kullanim_yeri: "konum" };
/** 540: tam ekipman bölümünün raporda çizilen alanları — kayıttan gelen kod / tür çıkar; seri no ve kullanım yeri ekipman kaydına bağlı alan olur
    (raporda değiştirilir), formatta aynı bağlı alan varsa çıkar. Öteki alanlar olduğu gibi, sırası korunur. */
export function tamAlanlari(b: BolumOf<"bilgi">): BolumOf<"bilgi">["alanlar"] {
  const bagli = new Set(b.alanlar.flatMap((a) => (a.ekipman ? [a.ekipman] : [])));
  return b.alanlar.flatMap((a) => {
    if (!a.kaynak || !(a.kaynak in KAYITTAN_EKIPMAN)) return [a];
    const k = KAYITTAN_EKIPMAN[a.kaynak];
    if (!k || bagli.has(k)) return [];
    bagli.add(k);
    return [{ id: a.id, ad: a.ad, tur: "metin" as const, zorunlu: false, kilit: a.kilit, ekipman: k }];
  });
}

/** cihazEk: formatta cihaz bölümü yok ama rapora cihaz eklendi (sabit "Ölçüm cihazları" bölümü) · sade (540): tam ekipman bölümü raporda çizildiği
    gibi (tamAlanlari) — rapor ekranı, belge, doldurma; Format kurucu formatın kendisini düzenler (false) */
export function raporDuzeni(t: FormatTanimi, cihazEk: boolean, sade = true): RaporDuzeni {
  /* 2026-10-24 (serbest düzen): sabit bölüm yok, numara yok — formatın bölümleri sırasıyla */
  if (t.gorunum.serbest) return { ekipman: false, ekipmanBaslik: "", katilan: [], tam: null, cihazNo: null, bolumler: t.bolumler.map((b) => ({ b, no: null, ust: null })), sonraki: "" };
  const ekipman = ekipmanBolumuVar(t);
  const tamHam = ekipman ? tamBolum(t) : null;
  const tam = tamHam && sade ? { ...tamHam, alanlar: tamAlanlari(tamHam) } : tamHam;
  const katilanHam = !ekipman ? [] : tamHam ? [tamHam] : t.bolumler.filter(ekipmanBolumuMu);
  const katilan = tam ? [tam] : katilanHam;
  const kalan = t.bolumler.filter((b) => !katilanHam.includes(b as BolumOf<"bilgi">) && !kayittanBolumMu(b));
  const sabit = (ekipman ? 2 : 1) + (cihazEk ? 1 : 0);
  let n = sabit, alt = 0, sonUst: string | null = null, anaVar = false;
  const bolumler = kalan.map((b): DuzenBolumu => {
    /* 2026-10-24: serbest tablo numara almaz (başlığı kendi hücrelerinde) */
    if (b.numarasiz || b.blok === "tablo") { sonUst = null; anaVar = false; return { b, no: null, ust: null }; }
    const ust = b.ust?.trim() || null;
    if (ust && ust === sonUst) { alt++; return { b, no: `${n}.${alt}`, ust: null }; }
    if (!ust && b.alt && anaVar) { alt++; return { b, no: `${n}.${alt}`, ust: null }; }
    n++;
    sonUst = ust;
    anaVar = !ust;
    if (ust) { alt = 1; return { b, no: `${n}.1`, ust: { no: String(n), ad: ust } }; }
    alt = 0;
    return { b, no: String(n), ust: null };
  });
  return { ekipman, ekipmanBaslik: katilan[0]?.ad || "Ekipman bilgileri", katilan, tam, cihazNo: cihazEk ? String(sabit) : null, bolumler, sonraki: String(n + 1) };
}

/** 461 / 473: v. bölümden sonra eklenen alt başlığın ANA bölümü — v ana bölümse kendisi, alt başlıksa onun ana bölümü; üst başlıklı grup ya da
    numarasız bölümden sonra alt başlık olmaz (null). Kâğıt ve saha ekranı ortak. */
export function altBaslikAnasi(l: readonly DuzenBolumu[], v: number): Bolum | null {
  const x = l[v];
  if (!x?.no) return null;
  if (!x.no.includes(".")) return x.b.ust ? null : x.b;
  if (!x.b.alt) return null;
  for (let j = v - 1; j >= 0; j--) { const y = l[j]; if (y.no && !y.no.includes(".")) return y.b; }
  return null;
}
/** v. bölümden sonra ana bölümün alt başlık grubu bitiyor mu (sonraki bölüm aynı ananın alt başlığı değil) */
export const altGrupSonu = (l: readonly DuzenBolumu[], v: number) => { const s = l[v + 1]; return !(s?.b.alt && s.no?.includes(".")); };

/** 486 (reisim 2026-10-10 ekran görüntüsü: linye tablosunda "No | No | Devre"): tablonun sıra sütununun başlığı — formatın kendi "No" sütunu varsa
    "Sıra", yoksa "No" (saha ekranı, kâğıt, belge aynı) */
export const siraBasligi = (b: { sutunlar: readonly { ad: string }[] }) => (b.sutunlar.some((s) => /^\s*no\.?\s*$/iu.test(s.ad)) ? "Sıra" : "No");

/* 595 (sunum 595 madde 1): imza bölümünün satırları — tanımdakiler; eski formatta (satirlar yok) imzalar'dan bugünkü satırlar, bugünkü sırayla ve
   adlarıyla (belge aynı çizilir). Varsayılan satırların kimlikleri yalnız bu listede (tanıma kurucu yeni kimlikle yazar). */
const UZMAN_SATIRLARI: readonly ImzaSatiri[] = [
  { id: "imz_ad", ad: "Adı soyadı", kim: "uzman", alan: "ad" }, { id: "imz_meslek", ad: "Mesleği", kim: "uzman", alan: "meslek" },
  { id: "imz_ekipnet", ad: "Yetkili kişi kayıt no (EKİPNET)", kim: "uzman", alan: "ekipnet" }, { id: "imz_diploma", ad: "Diploma no", kim: "uzman", alan: "diploma" },
  { id: "imz_oda", ad: "Oda sicil no", kim: "uzman", alan: "oda" }, { id: "imz_imza", ad: "İmzası", kim: "uzman", alan: "imza", tam: true },
];
const TEKNIK_SATIRLARI: readonly ImzaSatiri[] = [
  { id: "imz_t_ad", ad: "Onaylayan teknik yönetici", kim: "teknik", alan: "ad" }, { id: "imz_t_zaman", ad: "Onay zamanı", kim: "teknik", alan: "zaman" },
];
/* 595 (madde 1): ikinci muayene uzmanı ve tesis yetkilisi (bölüm ayarında "İmza yerleri"nden eklenir) */
const UZMAN2_SATIRLARI: readonly ImzaSatiri[] = [
  { id: "imz_u2_ad", ad: "İkinci muayene uzmanı", kim: "uzman2", alan: "ad" }, { id: "imz_u2_meslek", ad: "Mesleği", kim: "uzman2", alan: "meslek" },
  { id: "imz_u2_ekipnet", ad: "Yetkili kişi kayıt no (EKİPNET)", kim: "uzman2", alan: "ekipnet" }, { id: "imz_u2_imza", ad: "İmzası", kim: "uzman2", alan: "imza", tam: true },
];
const TESIS_SATIRLARI: readonly ImzaSatiri[] = [
  { id: "imz_ts_ad", ad: "Tesis yetkilisi", kim: "tesis", alan: "ad" }, { id: "imz_ts_unvan", ad: "Unvanı", kim: "tesis", alan: "unvan" },
  { id: "imz_ts_imza", ad: "İmzası", kim: "tesis", alan: "imza", tam: true },
];
/** kişinin varsayılan satırları (bölüm ayarında kişi eklenince bunlar gelir) */
export const imzaVarsayilani = (kim: ImzaYeri): readonly ImzaSatiri[] =>
  (kim === "uzman" ? UZMAN_SATIRLARI : kim === "teknik" ? TEKNIK_SATIRLARI : kim === "uzman2" ? UZMAN2_SATIRLARI : TESIS_SATIRLARI);
/** 595 (madde 1): sahada doldurulan imza yerleri — formatın imza bölümünde ikinci uzman / tesis yetkilisi satırı var mı */
export function imzaGirisleri(t: Pick<FormatTanimi, "bolumler">): { uzman2: boolean; tesis: boolean } {
  const l = t.bolumler.flatMap((b) => (b.blok === "imza" ? imzaSatirlari(b) : []));
  return { uzman2: l.some((s) => s.kim === "uzman2"), tesis: l.some((s) => s.kim === "tesis") };
}
export function imzaSatirlari(b: BolumOf<"imza">): readonly ImzaSatiri[] {
  if (b.satirlar) return b.satirlar;
  return [...(b.imzalar.includes("uzman") ? UZMAN_SATIRLARI : []), ...(b.imzalar.includes("teknik") ? TEKNIK_SATIRLARI : [])];
}

/* 595 (sunum 595 madde 3): 1. bölümün (Firma bilgileri) satırları — tanımdakiler; verilmemişse bugünkü satırlar, belgenin bugünkü sırasıyla
   (belge aynı çizilir). Varsayılanın kimlikleri yalnız bu listede (tanıma kurucu yeni kimlikle yazar). */
const FIRMA_VARSAYILAN: readonly [FirmaKaynagi, boolean][] = [
  ["firma", true], ["adres", true], ["rapor_no", false], ["rapor_tarihi", false], ["isg", false], ["sgk", false], ["bas", false], ["bit", false],
  ["sonraki", false], ["takip", false], ["metot", true],
];
const FIRMA_SATIRLARI: readonly FirmaSatiri[] = FIRMA_VARSAYILAN.map(([k, tam]) => ({ id: `fb_${k}`, ad: FIRMA_KAYNAK_ADI[k], kaynak: k, ...(tam ? { tam } : {}) }));
export function firmaSatirlari(t: Pick<FormatTanimi, "gorunum">): readonly FirmaSatiri[] {
  return t.gorunum.firma?.satirlar ?? FIRMA_SATIRLARI;
}

/* 595 (madde 4, 6, 7, 11–15): kâğıtta görünen sabit başlıklar ve sözcükler — formatta yazılmamışsa bugünkü yazı. Belge, saha ekranı ve kâğıt aynı
   işlevlerden okur. */
const yazili = (x: string | undefined, d: string) => (x && x.trim() ? x.trim() : d);
export const olcumBasliklari = (b: BolumOf<"olcum">) => ({
  sira: yazili(b.basliklar?.sira, siraBasligi(b)), not: yazili(b.basliklar?.not, "Uygunluk notu"), sonuc: yazili(b.basliklar?.sonuc, "Sonuç"),
});
export const testBasliklari = (b: BolumOf<"test">) => ({
  olcum: yazili(b.basliklar?.olcum, "Ölçüm"), deger: yazili(b.basliklar?.deger, "Değer"), sinir: yazili(b.basliklar?.sinir, "Sınır"), sonuc: yazili(b.basliklar?.sonuc, "Sonuç"),
});
export const listeBasliklari = (b: BolumOf<"liste">) => ({
  no: yazili(b.basliklar?.no, "No"), madde: yazili(b.basliklar?.madde, "Kontrol maddesi"), sonuc: yazili(b.basliklar?.sonuc, "Sonuç"),
});
export const sonucMetinleri = (b: BolumOf<"sonuc">) => ({
  uygun: yazili(b.uygunMetin, "uygundur"), uygunDegil: yazili(b.uygunDegilMetin, "uygun değildir"), sartli: yazili(b.sartliMetin, "şartlı uygundur"),
});
/** 595 (madde 12): sonuç seçeneğinin belgedeki sözcüğü */
export const sonucSozcugu = (b: BolumOf<"sonuc">, s: string | null | undefined): string | null => {
  const m = sonucMetinleri(b);
  return s === "uygun" ? m.uygun : s === "uygun_degil" ? m.uygunDegil : s === "sartli" ? m.sartli : null;
};
/** 595 (madde 12): formatta üçüncü seçenek (şartlı uygun) açık mı */
export const sartliAcik = (t: Pick<FormatTanimi, "bolumler">) => t.bolumler.some((b) => (b.blok === "sonuc" && !!b.sartli)
  || (b.blok === "tablo" && b.hucreler.some((h) => h.tur === "sonuc" && (h.secenekler?.length ?? 0) >= 3)));
export const basEtiketleri = (t: Pick<FormatTanimi, "gorunum">) => ({
  kod: yazili(t.gorunum.bas?.kod, "Doküman Kodu"), surum: yazili(t.gorunum.bas?.surum, "Format sürümü"), no: yazili(t.gorunum.bas?.no, "Rapor No"),
  tarih: yazili(t.gorunum.bas?.tarih, "Rapor Tarihi"),
});
export const ekipmanEtiketleri = (t: Pick<FormatTanimi, "gorunum">) => ({ kod: yazili(t.gorunum.ekipmanAd?.kod, "Ekipman kodu"), tur: yazili(t.gorunum.ekipmanAd?.tur, "Ekipman türü") });
/** sayfa altı (belgenin sonundaki çizgili satır; formatın kendi yazısı PDF'te her sayfanın şeridinde de — src/belge/pdf.ts): formatın yazısı
    ({firma}, {kod}, {adres}, {tel}, {eposta} yerine firma adı, doküman kodu, Firma ayarlarındaki adres / telefon / rapor e-postası — 595 madde 14;
    boş kalan bilgi " · " ayracıyla birlikte düşer) ya da bugünkü "firma · kod" */
export const ALT_YER_TUTUCULAR = ["{firma}", "{kod}", "{adres}", "{tel}", "{eposta}"] as const;
export interface AltFirma { ad: string; adres?: string | null; tel?: string | null; eposta?: string | null }
export function altYazisi(t: Pick<FormatTanimi, "gorunum">, f: AltFirma, kod: string): string {
  const y = t.gorunum.altYazi?.trim();
  if (!y) return `${f.ad} · ${kod}`;
  const d: Record<(typeof ALT_YER_TUTUCULAR)[number], string> = {
    "{firma}": f.ad, "{kod}": kod, "{adres}": f.adres?.trim() ?? "", "{tel}": f.tel?.trim() ?? "", "{eposta}": f.eposta?.trim() ?? "",
  };
  /* tek geçişte (değerin içindeki "{…}" yeniden çevrilmez); boş bilgi ayracıyla düşer */
  const m = y.replace(/\{(?:firma|kod|adres|tel|eposta)\}/g, (x) => d[x as keyof typeof d]);
  return m.split(/(?<=^|\s)·(?=\s|$)/).map((p) => p.trim()).filter(Boolean).join(" · ");
}

/* 595 (madde 2): ölçüm cihazları tablosunun sütunları — tanımdakiler; verilmemişse (ya da formatta cihaz bölümü yoksa) bugünkü 5 sütun */
const CIHAZ_VARSAYILAN: readonly CihazAlani[] = ["cihaz", "kod_seri", "kal_tarih", "kal_bitis", "sertifika"];
export const cihazSutunlari = (b?: BolumOf<"cihaz"> | null): readonly CihazSutunu[] =>
  b?.sutunlar ?? CIHAZ_VARSAYILAN.map((a) => ({ id: `cs_${a}`, ad: CIHAZ_ALAN_ADI[a], alan: a }));

/* 595 (madde 16): fotoğraf kutularının kimlikleri — kutudaki fotoğraf (RaporFoto.madde = kutu) bölümün sayısına girer; maddenin fotoğrafı girmez
   (sunucu sayiliCevaplar, saha ekranı ve belge aynı sayım) */
export const fotoKutulari = (t: Pick<FormatTanimi, "bolumler">): ReadonlySet<string> =>
  new Set(t.bolumler.flatMap((b) => (b.blok === "foto" ? (b.kutular ?? []).map((k) => k.id) : b.blok === "tablo" ? b.hucreler.flatMap((h) => (h.tur === "foto" && h.id ? [h.id] : [])) : [])));

/* 595 (madde 13): başlık tablosu — doküman bilgisi satırları (verilmemişse bugünkü dört satır, adları basEtiketleri'nden; kimlik bs_*) ve hücre sırası */
const BAS_VARSAYILAN: readonly ("kod" | "surum" | "no" | "tarih")[] = ["kod", "surum", "no", "tarih"];
export const basSatirlari = (t: Pick<FormatTanimi, "gorunum">): readonly BasSatiri[] =>
  t.gorunum.basSatirlar ?? BAS_VARSAYILAN.map((k) => ({ id: `bs_${k}`, ad: basEtiketleri(t)[k], kaynak: k }));
export const basSirasi = (t: Pick<FormatTanimi, "gorunum">): readonly BasHucresi[] => t.gorunum.basSira ?? BAS_HUCRELERI;
/** hücrenin belgedeki genişliği (%) — bugünkü tablo 11 · 27 · 10 · 27 · 25 */
export const BAS_GENISLIK: Record<BasHucresi, string> = { logo: "11%", firma: "27%", akr: "10%", ad: "27%", dok: "25%" };

/* ── 2026-10-23 (basılı formdan şablon — reisim: "bu pdfine bi bak nasıl gözüküyor"): belgenin görünümü ve kontrol listesinin numaraları; belge,
   kâğıt ve saha ekranı ortak ── */
/** belgenin görünüm sınıfları (belge.css): bölüm başlığının zemini / hizası, etiket hücresi — verilmemişse Bakanlık görünümü (sınıf yok) */
export function belgeStilSiniflari(t: Pick<FormatTanimi, "gorunum">): string {
  const s = t.gorunum.stil;
  return [s?.zemin && s.zemin !== "pembe" ? `rb-z-${s.zemin}` : "", s?.hiza === "orta" ? "rb-h-orta" : "", s?.etiket === "kalin" ? "rb-e-kalin" : ""]
    .filter(Boolean).join(" ");
}
/** belgenin başı: logo · firma · doküman bilgisi tablosu ya da yalnız belge adı */
export const basTuru = (t: Pick<FormatTanimi, "gorunum">) => t.gorunum.basTuru ?? "tablo";
/** kontrol listesinin madde numaraları (madde kimliği → numara): grup içinde (birden çok grupta 1.1, 1.2) ya da baştan sona (1, 2, 3 …) */
export function maddeNumaralari(b: BolumOf<"liste">): ReadonlyMap<string, string> {
  const m = new Map<string, string>(), cok = b.gruplar.length > 1;
  let n = 0;
  b.gruplar.forEach((g, gi) => g.maddeler.forEach((x, mi) => m.set(x.id, b.numara === "surekli" ? String(++n) : cok ? `${gi + 1}.${mi + 1}` : String(mi + 1))));
  return m;
}
