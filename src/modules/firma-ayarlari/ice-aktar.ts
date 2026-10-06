/* TOPLU İÇE AKTARMA (ilk kurulum) — saf (337; maket firma-ayarlari "Toplu içe aktarma (ilk kurulum)": maket-ayarlar.js IA_TUR, iaSatirlar,
   iceCiz; pkproje §11 245). Tür tanımları (şablon sütunları — * zorunlu —, örnek satırlar), dosya satırlarının ayrıştırılması ve SATIR SATIR
   denetimi: "Eklenecek" (varsa uyarı notu) ya da atlanma nedeni. Kayıtlı veriyi (kodlar, plakalar, müşteriler, türler …) sunucu modüllerin
   bağlantılarından verir; denetim burada, tarayıcıda ve sunucuda aynı kural. Eklenecek değerler veritabanının biçimine göre (uzunluk, biçim) —
   kayıt sırasında düşmez. Dosya tarayıcıda okunur (src/components/disa/oku.ts); satırlar sunucuda YENİDEN denetlenir (istemciye güvenilmez). */
import { IL_ILCE } from "../../tanim/iller.ts";
import { TANIMLAR } from "../../tanim/veri.ts";

export const IA_TURLER = ["musteri", "ekipman", "cihaz", "personel", "arac"] as const;
export type IaTur = (typeof IA_TURLER)[number];
/** bir dosyada en çok VERİ satırı (fazlası için dosya bölünür) · hücre en çok karakter · okunan ham satır (okuyucunun sınırı, src/components/disa/oku.ts —
    biçimlendirilmiş boş satırlar da okunur; boşlar atıldıktan sonra veri satırı sayılır, 337–339 incelemesi) */
export const IA_SINIR = { satir: 2000, hucre: 300, ham: 5000 } as const;

/** tür: ad · şablon dosya adı · sütunlar (* zorunlu) · örnek satırlar (uydurma) */
export const IA_TUR: Record<IaTur, { ad: string; dosya: string; sutun: readonly string[]; ornek: readonly (readonly string[])[] }> = {
  musteri: {
    ad: "Müşteriler ve tesisler", dosya: "musteriler",
    sutun: ["Müşteri ünvanı*", "Vergi dairesi", "Vergi no", "E-posta", "Tesis adı*", "Adres*", "İl*", "İlçe", "SGK DETSİS NO"],
    ornek: [
      ["Örnek Gıda San. A.Ş.", "Gebze", "1234567890", "isg@ornek-gida.example", "Merkez Fabrika", "OSB 3. Cadde No: 5", "Kocaeli", "Gebze", ""],
      ["Örnek Gıda San. A.Ş.", "Gebze", "1234567890", "isg@ornek-gida.example", "Depo", "OSB 9. Cadde No: 2", "Kocaeli", "Dilovası", ""],
      ["Deneme Metal Ltd.", "Tuzla", "", "", "Atölye", "Sanayi Sitesi B Blok No: 14", "İstanbul", "Tuzla", ""],
    ],
  },
  ekipman: {
    ad: "Ekipmanlar", dosya: "ekipmanlar",
    sutun: ["Ekipman kodu*", "Ekipman türü*", "Müşteri ünvanı*", "Tesis adı*", "Kullanım yeri", "Marka", "Model", "Seri no", "İmal yılı"],
    ornek: [
      ["HT-2001", "Hava tankı", "Örnek Gıda San. A.Ş.", "Depo", "Kompresör odası", "Örnek", "HT-500", "SN-1001", "2018"],
      ["FL-2002", "Forklift", "Örnek Gıda San. A.Ş.", "Depo", "Sevkiyat", "Örnek", "F25", "", ""],
    ],
  },
  cihaz: {
    ad: "Ölçüm cihazları", dosya: "olcum-cihazlari",
    sutun: ["Cihaz kodu*", "Cihaz türü*", "Marka", "Seri no", "Ölçüm aralığı", "Kalibrasyon bitişi*"],
    ornek: [["OC-201", "Topraklama ölçer", "Örnek", "CS-77001", "0–2000 Ω", "15.03.2027"], ["OC-202", "Multimetre", "Örnek", "CS-77002", "", "01.11.2026"]],
  },
  personel: {
    ad: "Personel", dosya: "personel",
    sutun: ["Ad soyad*", "Meslek*", "İşe başlama*", "E-posta", "Diploma no", "Oda sicil no", "EKİPNET no"],
    ornek: [["Deniz Yılmaz", "Elektrik mühendisi", "01.03.2021", "deniz.yilmaz@firma.example", "", "", ""], ["Ece Kara", "Makine mühendisi", "15.06.2023", "", "", "", ""]],
  },
  arac: {
    ad: "Araçlar", dosya: "araclar",
    sutun: ["Plaka*", "Araç türü*", "Marka*", "Model*", "Model yılı*", "Yakıt*", "Kilometre", "Muayene bitişi", "Trafik sigortası bitişi", "Kasko bitişi"],
    ornek: [["34 ABC 101", "Hafif ticari araç", "Örnek", "Van", "2021", "Dizel", "68000", "10.05.2027", "01.02.2027", ""]],
  },
};

/** son içe aktarımlar (ekranda 5, yeniden eskiye): yalnız sonuncusu, geri alınmadıysa "Geri al" */
export interface IaGecmis { id: string; zaman: string; tur: IaTur; turAd: string; adet: number; atlanan: number; kim: string; dosya: string; geri: boolean; son: boolean }

/* ── yardımcılar ── */
const tr = (s: string) => s.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr");
const temiz = (s: string | undefined) => String(s ?? "").trim().replace(/\s+/g, " ");
const bos = (s: string) => (s === "" ? null : s);
/** "GG.AA.YYYY" (ya da G.A.YYYY, GG/AA/YYYY) ya da Excel'in tarih hücresi "YYYY-AA-GG" → YYYY-AA-GG; geçersizse null */
export function iaTarih(s: string): string | null {
  const t = s.trim();
  const m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(t);
  const iso = m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
  if (!iso) return null;
  const [y, a, g] = iso.split("-").map(Number), d = new Date(Date.UTC(y, a - 1, g));
  return d.getUTCFullYear() === y && d.getUTCMonth() === a - 1 && d.getUTCDate() === g ? iso : null;
}
const gunYaz = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
/** kod: boşluksuz, büyük harf (yerelden bağımsız — "i" → "I") */
const kodYaz = (s: string) => s.replace(/\s+/g, "").toUpperCase();
/** plaka (araçlar ile aynı): Türkçe büyük harf, tek boşluk */
const plakaYaz = (s: string) => s.toLocaleUpperCase("tr").replace(/\s+/g, " ").trim();
const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ILLER = Object.keys(IL_ILCE);
const ARAC_TURU = ["Binek araç", "Hafif ticari araç", "Kamyonet", "Minibüs", "Kamyon"] as const;
const YAKIT = [["benzin", "Benzin"], ["dizel", "Dizel"], ["lpg", "LPG"], ["elektrik", "Elektrik"], ["hibrit", "Hibrit"]] as const;
const sinir = (deger: string, en: number, ad: string) => (deger.length > en ? `${ad} en çok ${en} karakter` : "");
/** müşteri eşleşmesi (337–339 incelemesi): önce TAM ünvan, yoksa kısa ad; birden çok müşteri eşleşirse belirsiz — satır atlanır (yanlış müşteriye
    bağlanan tesis / ekipman o müşterinin panelinde görünürdü) */
function musteriBul<M extends { unvan: string; kisa: string }>(l: readonly M[], ad: string): { m: M | null; belirsiz: boolean } {
  const u = l.filter((x) => tr(x.unvan) === tr(ad)), k = u.length ? u : l.filter((x) => tr(x.kisa) === tr(ad));
  return k.length > 1 ? { m: null, belirsiz: true } : { m: k[0] ?? null, belirsiz: false };
}
const BELIRSIZ = "Birden çok müşteri eşleşti; tam ünvanı yazın";

/* ── kayıtlı veri (sunucu bağlantılardan doldurur) ── */
export interface IaBilgi {
  bugun: string;
  musteriler: { id: string; unvan: string; kisa: string; vno: string | null; pasif: boolean }[];
  tesisler: { id: string; musteriId: string; ad: string; pasif: boolean }[];
  /** firmada kullanılan e-postalar (müşteri, personel / müşteri girişi kullanıcı adı) */
  musteriEpostalari: string[];
  ekipmanKodlari: string[];
  ekipmanTurleri: { id: string; ad: string; kod: string }[];
  cihazKodlari: string[];
  cihazTurleri: { id: string; ad: string }[];
  personelAdlari: string[];
  personelEpostalari: string[];
  plakalar: string[];
}

export type IaDeger =
  | { t: "musteri"; musteri: { id: string } | { yeni: { unvan: string; vd: string | null; vno: string | null; eposta: string | null }; anahtar: string };
      tesis: { ad: string; adres: string; il: string; ilce: string | null; sgk: string | null } }
  | { t: "ekipman"; kod: string; turId: string; tesisId: string; konum: string | null; marka: string | null; model: string | null; seri: string | null; imal: number | null }
  | { t: "cihaz"; kod: string; turId: string; marka: string | null; seri: string | null; aralik: string | null; bitis: string }
  | { t: "personel"; ad: string; meslek: string; basla: string; eposta: string | null; diploma: string | null; oda: string | null; ekipnet: string | null }
  | { t: "arac"; plaka: string; tur: string; marka: string; model: string; yil: number; yakit: string; ilkKm: number | null;
      muayene: string | null; sigorta: string | null; kasko: string | null };

/** satır denetimi: no = dosyadaki satır numarası; ana / alt = tabloda kayıt; kod kalın yazılır */
export interface IaSatir { no: number; ok: boolean; neden: string; uyari: string; kod: string; ana: string; alt: string; deger: IaDeger | null }

/** dosyanın ham satırları → numaralı veri satırları: başlık (ilk satırda tür sütunlarından biri ya da "*") atlanır, boş satır yok sayılır */
export function iaVeriSatirlari(tur: IaTur, ham: readonly (readonly unknown[])[]): { no: number; h: string[] }[] {
  const basliklar = new Set(IA_TUR[tur].sutun.map((x) => tr(x.replace("*", ""))));
  const ilk = ham[0]?.map((c) => temiz(String(c ?? ""))) ?? [];
  const baslik = ilk.some((c) => c.includes("*")) || ilk.filter((c) => basliklar.has(tr(c.replace("*", "")))).length >= 2;
  const l: { no: number; h: string[] }[] = [];
  ham.forEach((s, i) => {
    if (i === 0 && baslik) return;
    const h = s.map((c) => String(c ?? "").slice(0, IA_SINIR.hucre));
    if (h.some((c) => c.trim())) l.push({ no: i + 1, h });
  });
  return l;
}

/* ── tür başına denetim ── */
function musteriDenetle(h: string[], b: IaBilgi, onceki: IaSatir[]): Omit<IaSatir, "no"> {
  const u = temiz(h[0]), vd = temiz(h[1]), vnoHam = temiz(h[2]), ep = temiz(h[3]).toLowerCase(), t = temiz(h[4]), adres = temiz(h[5]);
  const il = ILLER.find((x) => tr(x) === tr(temiz(h[6])));
  const ilceHam = temiz(h[7]), ilce = il && ilceHam ? IL_ILCE[il].find((x) => tr(x) === tr(ilceHam)) ?? null : null;
  const sgkHam = temiz(h[8]).replace(/\s+/g, "");
  const mb = musteriBul(b.musteriler, u), kayitli = mb.m;
  const dosyada = onceki.find((o) => o.ok && o.deger?.t === "musteri" && "yeni" in o.deger.musteri && o.deger.musteri.anahtar === tr(u));
  const neden = !u ? "Müşteri ünvanı boş" : u.length < 3 ? "Ünvan en az 3 karakter" : sinir(u, 160, "Ünvan") || (!t ? "Tesis adı boş" : t.length < 2 ? "Tesis adı en az 2 karakter" : "")
    || sinir(t, 80, "Tesis adı") || (!adres ? "Adres boş" : "") || sinir(adres, 160, "Adres") || (!il ? "İl bulunamadı" : "")
    || (mb.belirsiz ? BELIRSIZ : "") || (kayitli?.pasif ? "Müşteri pasif" : "")
    || (kayitli && b.tesisler.some((x) => x.musteriId === kayitli.id && tr(x.ad) === tr(t)) ? "Bu tesis zaten kayıtlı" : "")
    || (onceki.some((o) => o.ok && o.deger?.t === "musteri" && tr(o.ana) === tr(u) && tr(o.deger.tesis.ad) === tr(t)) ? "Dosyada aynı tesis iki kez" : "");
  const uy: string[] = [];
  let vno: string | null = null, eposta: string | null = null, sgk: string | null = null;
  const yeniMusteri = !kayitli && !dosyada;
  if (yeniMusteri) {
    const rakam = vnoHam.replace(/\D/g, "");
    if (!vnoHam) uy.push("vergi no boş");
    else if (!/^\d{10,11}$/.test(rakam)) uy.push("vergi no okunmadı, boş girer");
    else { vno = rakam; if (b.musteriler.some((m) => m.vno === rakam)) uy.push("vergi no başka müşteride"); }
    if (ep) {
      const dosyadaEp = onceki.some((o) => o.ok && o.deger?.t === "musteri" && "yeni" in o.deger.musteri && o.deger.musteri.yeni.eposta === ep);
      if (!EPOSTA.test(ep) || ep.length > 254) uy.push("e-posta okunmadı, boş girer");
      else if (b.musteriEpostalari.includes(ep) || dosyadaEp) uy.push("e-posta başka kayıtta, boş girer");
      else eposta = ep;
    }
    if (vd.length > 40) uy.push("vergi dairesi 40 karakteri aşıyor, boş girer");
  } else uy.push(kayitli ? `müşteri kayıtlı (${kayitli.unvan}), tesis ona eklenir` : "müşteri bu dosyada, tesis ona eklenir");
  if (!sgkHam) uy.push("SGK DETSİS NO boş");
  else if (!/^\d{26}$/.test(sgkHam)) uy.push("SGK DETSİS NO okunmadı, boş girer");
  else sgk = sgkHam;
  if (ilceHam && !ilce) uy.push("ilçe bulunamadı, boş girer");
  const deger: IaDeger | null = neden || !il ? null : {
    t: "musteri",
    /* kayıtlı müşteri · dosyada üstte yeni açılan (aynı anahtar: tek müşteri açılır) · yeni müşteri */
    musteri: kayitli ? { id: kayitli.id } : dosyada ? (dosyada.deger as Extract<IaDeger, { t: "musteri" }>).musteri
      : { yeni: { unvan: u, vd: vd && vd.length <= 40 ? vd : null, vno, eposta }, anahtar: tr(u) },
    tesis: { ad: t, adres, il, ilce, sgk },
  };
  return { ok: !neden, neden, uyari: uy.join(" · "), kod: "", ana: u, alt: `${t}${il ? ` · ${il}${ilce ? ` / ${ilce}` : ""}` : ""}`, deger };
}

function ekipmanDenetle(h: string[], b: IaBilgi, onceki: IaSatir[]): Omit<IaSatir, "no"> {
  const kod = kodYaz(String(h[0] ?? "")), turHam = temiz(h[1]), mu = temiz(h[2]), te = temiz(h[3]);
  const tur = b.ekipmanTurleri.find((x) => tr(x.ad) === tr(turHam) || tr(x.kod) === tr(turHam));
  const mb = musteriBul(b.musteriler.filter((x) => !x.pasif), mu), m = mb.m;
  const tesis = m ? b.tesisler.find((x) => !x.pasif && x.musteriId === m.id && tr(x.ad) === tr(te)) : undefined;
  const konum = temiz(h[4]), marka = temiz(h[5]), model = temiz(h[6]), seri = temiz(h[7]), yil = temiz(h[8]);
  const neden = !kod ? "Ekipman kodu boş" : !/^[A-Z0-9](?:[A-Z0-9]|-(?=[A-Z0-9])){2,19}$/.test(kod) ? "Kod: A–Z, 0–9, tire; 3–20 hane"
    : b.ekipmanKodlari.includes(kod) ? "Bu kod kayıtlı" : onceki.some((o) => o.ok && o.kod === kod) ? "Dosyada aynı kod iki kez"
    : !tur ? "Ekipman türü bulunamadı" : mb.belirsiz ? BELIRSIZ : !tesis ? "Müşteri / tesis bulunamadı (önce müşterileri yükleyin)"
    : sinir(konum, 60, "Kullanım yeri") || sinir(marka, 60, "Marka") || sinir(model, 60, "Model") || sinir(seri, 30, "Seri no");
  const imalOk = /^\d{4}$/.test(yil) && +yil >= 1900 && +yil <= Number(b.bugun.slice(0, 4)) + 1;
  return {
    ok: !neden, neden, uyari: yil && !imalOk ? "imal yılı okunmadı, boş girer" : "", kod: kod || temiz(h[0]), ana: tur?.ad ?? turHam, alt: `${m?.unvan ?? mu} · ${te}`,
    deger: neden || !tur || !tesis ? null : { t: "ekipman", kod, turId: tur.id, tesisId: tesis.id, konum: bos(konum), marka: bos(marka), model: bos(model), seri: bos(seri), imal: imalOk ? +yil : null },
  };
}

function cihazDenetle(h: string[], b: IaBilgi, onceki: IaSatir[]): Omit<IaSatir, "no"> {
  const kod = kodYaz(String(h[0] ?? "")), turHam = temiz(h[1]), tur = b.cihazTurleri.find((x) => tr(x.ad) === tr(turHam));
  const marka = temiz(h[2]), seri = temiz(h[3]), aralik = temiz(h[4]), bit = iaTarih(String(h[5] ?? ""));
  const neden = !kod ? "Cihaz kodu boş" : !/^[A-Z0-9-]{3,12}$/.test(kod) ? "Cihaz kodu 3–12 hane (A–Z, 0–9, tire)"
    : b.cihazKodlari.includes(kod) ? "Bu cihaz kodu kayıtlı" : onceki.some((o) => o.ok && o.kod === kod) ? "Dosyada aynı kod iki kez"
    : !tur ? "Cihaz türü bulunamadı" : !bit ? "Kalibrasyon bitişi GG.AA.YYYY olmalı"
    /* yazım hatası (2072) cihazı yıllarca "geçerli" gösterirdi — kalibrasyon kaydı açılana kadar bu bitiş geçerli (337–339 incelemesi) */
    : bit > `${Number(b.bugun.slice(0, 4)) + 5}${b.bugun.slice(4)}` ? "Kalibrasyon bitişi 5 yıldan ileri olamaz"
    : sinir(marka, 40, "Marka") || sinir(seri, 40, "Seri no") || sinir(aralik, 60, "Ölçüm aralığı");
  return {
    ok: !neden, neden, uyari: bit && bit < b.bugun ? "kalibrasyonu geçmiş" : "", kod: kod || temiz(h[0]), ana: tur?.ad ?? turHam,
    alt: `Kalibrasyon ${bit ? gunYaz(bit) : temiz(h[5]) || "—"}`,
    deger: neden || !tur || !bit ? null : { t: "cihaz", kod, turId: tur.id, marka: bos(marka), seri: bos(seri), aralik: bos(aralik), bitis: bit },
  };
}

function personelDenetle(h: string[], b: IaBilgi, onceki: IaSatir[]): Omit<IaSatir, "no"> {
  const ad = temiz(h[0]), msHam = temiz(h[1]), bas = iaTarih(String(h[2] ?? "")), ep = temiz(h[3]).toLowerCase();
  const ms = TANIMLAR.meslekler.find((m) => m.k !== "diger" && (tr(m.ad) === tr(msHam) || m.k === tr(msHam)));
  const diploma = temiz(h[4]), oda = temiz(h[5]), ekipnet = temiz(h[6]);
  const epGecerli = !!ep && EPOSTA.test(ep) && ep.length <= 254;
  const neden = !ad ? "Ad soyad boş" : ad.split(" ").length < 2 || ad.length < 3 ? "Ad ve soyad yazılmalı" : sinir(ad, 80, "Ad soyad")
    || (!ms ? "Meslek bulunamadı" : !bas ? "İşe başlama GG.AA.YYYY olmalı" : bas > b.bugun ? "İşe başlama ileri tarih" : "")
    || (epGecerli && b.personelEpostalari.includes(ep) ? "Bu e-posta başka personelde" : "")
    || (epGecerli && onceki.some((o) => o.ok && o.deger?.t === "personel" && o.deger.eposta === ep) ? "Dosyada aynı e-posta iki kez" : "")
    || sinir(diploma, 20, "Diploma no") || sinir(oda, 20, "Oda sicil no") || sinir(ekipnet, 20, "EKİPNET no");
  const uy: string[] = [];
  if (ep && !epGecerli) uy.push("e-posta okunmadı, boş girer");
  if (b.personelAdlari.some((x) => tr(x) === tr(ad))) uy.push("aynı adlı personel var");
  if (!ekipnet) uy.push("EKİPNET no boş");
  return {
    ok: !neden, neden, uyari: uy.join(" · "), kod: "", ana: ad, alt: `${ms?.ad ?? msHam}${bas ? ` · ${gunYaz(bas)}` : ""}`,
    deger: neden || !ms || !bas ? null : { t: "personel", ad, meslek: ms.k, basla: bas, eposta: epGecerli ? ep : null, diploma: bos(diploma), oda: bos(oda), ekipnet: bos(ekipnet) },
  };
}

function aracDenetle(h: string[], b: IaBilgi, onceki: IaSatir[]): Omit<IaSatir, "no"> {
  const p = plakaYaz(String(h[0] ?? "")), duz = p.replace(/ /g, "");
  const tur = ARAC_TURU.find((t) => tr(t) === tr(temiz(h[1])));
  const marka = temiz(h[2]), model = temiz(h[3]), yilHam = temiz(h[4]), yil = Number(yilHam);
  const yk = YAKIT.find((y) => tr(y[1]) === tr(temiz(h[5])) || y[0] === tr(temiz(h[5])));
  const kmHam = temiz(h[6]).replace(/[.\s]/g, ""), km = /^\d{1,7}$/.test(kmHam) ? Number(kmHam) : null;
  const neden = !p ? "Plaka boş" : !/^\d{2} ?[A-ZÇĞİÖŞÜ]{1,3} ?\d{2,4}$/.test(p) ? "Plaka 34 ABC 123 biçiminde"
    : b.plakalar.includes(duz) ? "Bu plaka kayıtlı" : onceki.some((o) => o.ok && o.kod.replace(/ /g, "") === duz) ? "Dosyada aynı plaka iki kez"
    : !tur ? "Araç türü bulunamadı" : !marka || !model ? "Marka ve model zorunlu" : sinir(marka, 40, "Marka") || sinir(model, 40, "Model")
    || (!/^\d{4}$/.test(yilHam) || yil < 1980 || yil > Number(b.bugun.slice(0, 4)) + 1 ? "Model yılı geçersiz" : !yk ? "Yakıt bulunamadı" : "");
  const bel = [7, 8, 9].map((i) => (temiz(h[i]) ? iaTarih(String(h[i])) : ""));
  const uy: string[] = [];
  if (bel.some((x) => x === null)) uy.push("okunmayan belge tarihi boş girer");
  if (kmHam && km === null) uy.push("kilometre okunmadı, boş girer");
  return {
    ok: !neden, neden, uyari: uy.join(" · "), kod: p || temiz(h[0]), ana: `${marka} ${model}`.trim(), alt: tur ?? temiz(h[1]),
    deger: neden || !tur || !yk ? null : { t: "arac", plaka: p, tur, marka, model, yil, yakit: yk[0], ilkKm: km, muayene: bel[0] || null, sigorta: bel[1] || null, kasko: bel[2] || null },
  };
}

const DENETLE: Record<IaTur, (h: string[], b: IaBilgi, onceki: IaSatir[]) => Omit<IaSatir, "no">> = {
  musteri: musteriDenetle, ekipman: ekipmanDenetle, cihaz: cihazDenetle, personel: personelDenetle, arac: aracDenetle,
};

/** dosyanın bütün satırlarını sırayla denetler (önceki geçerli satırlar "dosyada iki kez" ve aynı müşteri için) */
export function iaDenetle(tur: IaTur, satirlar: readonly { no: number; h: string[] }[], b: IaBilgi): IaSatir[] {
  const l: IaSatir[] = [];
  for (const s of satirlar) l.push({ no: s.no, ...DENETLE[tur](s.h, b, l) });
  return l;
}
