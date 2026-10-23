/* BASILI FORMDAN ŞABLON — yapay zekânın okuduğu formun format tanımına çevrilmesi, saf (2026-10-23; reisim: "ben bunu yükleyince format buna
   dönüşsün format düzenleyicide bundan düzenleme yapabileyim istiyorum"). İstek ve cevabın çözümü src/server/yz/basili.ts. Her parça ŞEMADAN
   geçer; geçmeyen bölüm atılır (adı söylenir), tanımın bütünü yine şemadan geçer. Sabit iskelet sıfırdan oluşturulan formatınki (sablonlar.ts
   bosFormat): 1. bölüm (Firma bilgileri) satırları formdan, ekipman bölümü formun teknik bilgileri (ekipman kaydına bağlı alanlar dahil), sonra
   formun bölümleri sırasıyla, sonuç, imza. Formda ölçüm cihazı bölümü yoksa numarasız "Kullanılan cihazlar" (kurucu bu bölümü zaten ekler —
   numaralı eklemesin), fotoğraf bölümü yoksa en sonda numarasız "Fotoğraflar" (rapor başına en az bir fotoğraf). Kimlikler kurucunun ("k_"). */
import { bosFormat } from "../../format/sablonlar.ts";
import {
  BAS_KAYNAKLARI, Bolum, EKIPMAN_ALANLARI, FIRMA_KAYNAK_ADI, FIRMA_KAYNAKLARI, FIRMA_ZORUNLU, FormatTanimi, imzaAlanlari, IMZA_ALANLARI, IMZA_KISILERI,
  type BasSatiri, type EkipmanAlani, type FirmaSatiri, type ImzaSatiri,
} from "../../format/tanim.ts";
import { yeniKimlik } from "./kurucu.ts";
import { hamdanBolum } from "./yz-oneri.ts";

export interface BasiliCeviri {
  tanim: FormatTanimi;
  /** yapay zekânın kullanıcıya notu (formdan aynen alınamayanlar) */
  cevap: string;
  /** şemaya uymadığı için atılan bölümlerin adları */
  atilan: string[];
}

type Ham = Record<string, unknown>;
const nesne = (x: unknown): Ham => (x && typeof x === "object" && !Array.isArray(x) ? (x as Ham) : {});
const dizi = (x: unknown, n: number): unknown[] => (Array.isArray(x) ? x.slice(0, n) : []);
const yazi = (x: unknown, n: number) => (typeof x === "string" ? x.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n) : "");
/** satır sonlarını koruyan yazı (serbest metin) */
const uzunYazi = (x: unknown, n: number) => (typeof x === "string" ? x.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").trim().slice(0, n) : "");
const evet = (x: unknown) => x === true;
const bir = <T extends string>(l: readonly T[], x: unknown): T | undefined => l.find((y) => y === x);
const dizilis = (x: unknown): 1 | 2 | 3 => (x === 1 || x === 3 ? x : 2);
const CEVAPLAR = ["Uygun", "Uygun değil", "Uygulanamaz"];

/** yapay zekânın alanı → hamdanBolum'un beklediği sade alan (boş yazı → yok) */
const sadeAlan = (a: Ham) => ({
  ad: yazi(a.ad, 200), tur: a.tur, birim: yazi(a.birim, 40) || null, zorunlu: false, formul: yazi(a.formul, 2000) || null,
  secenekler: dizi(a.secenekler, 40).map((x) => yazi(x, 200)).filter(Boolean),
});
const sadeSinir = (o: Ham) => (bir(["<=", ">=", "<", ">"] as const, o.op) && typeof o.sinir === "number" ? { op: o.op, sinir: o.sinir } : { op: null, sinir: null });

/** ham (src/server/yz/basili.ts BASILI_SEMASI) → format tanımı; tanım şemadan geçmezse null */
export function basilidanTanim(ham: Ham, turAd: string): BasiliCeviri | null {
  const baslik = yazi(ham.baslik, 200) || `${turAd} Periyodik Kontrol Raporu`;
  const iskelet = bosFormat(baslik);
  const firma = iskelet.bolumler.find((b) => b.id === "firma")!;
  /* kimlikler o ana kadar kurulanlara göre tekil (yeniKimlik çalışan tanıma bakar; ek: bu çeviride verilenler) */
  const ek = new Set<string>();
  const bolumler: Bolum[] = [firma];
  const calisan = (): FormatTanimi => ({ ...iskelet, bolumler });
  const yeni = (onek: "b" | "a" | "i" | "f" | "h") => { const x = yeniKimlik(calisan(), onek, ek); ek.add(x); return x; };
  const atilan: string[] = [];

  /* ekipman / teknik bilgiler (2. bölüm): ekipman kaydına bağlı alan (marka, seri …) yazı alanıdır ve bir kez; öteki alanlar formun */
  const he = nesne(ham.ekipman);
  const ekipmanVar = he.var !== false;
  if (ekipmanVar) {
    const kullanilan = new Set<EkipmanAlani>();
    const alanlar = dizi(he.alanlar, 60).map(nesne).filter((a) => yazi(a.ad, 200)).flatMap((a) => {
      const e = bir(EKIPMAN_ALANLARI, a.ekipman);
      if (e && !kullanilan.has(e)) {
        kullanilan.add(e);
        return [{ id: yeni("a"), ad: yazi(a.ad, 200), tur: "metin" as const, zorunlu: false, kilit: false, ekipman: e, ...(evet(a.tam) ? { tam: true } : {}) }];
      }
      const b = hamdanBolum(calisan(), { blok: "bilgi", ad: "x", alanlar: [sadeAlan(a)] }, ek);
      const x = b?.blok === "bilgi" ? b.alanlar[0] : undefined;
      if (!x) return [];
      ek.add(x.id);
      return [{ ...x, ...(evet(a.tam) ? { tam: true } : {}) }];
    });
    const b = Bolum.safeParse({ id: "ekipman", ad: yazi(he.ad, 200) || "Ekipman bilgileri", blok: "bilgi", kilit: false, tam: true, dizilis: dizilis(he.dizilis), alanlar });
    if (b.success) bolumler.push(b.data); else atilan.push(yazi(he.ad, 200) || "Ekipman bilgileri");
  }

  /* formun bölümleri sırasıyla */
  for (const x of dizi(ham.bolumler, 36).map(nesne)) {
    const ad = yazi(x.ad, 200), blok = x.blok;
    if (!ad) continue;
    let b: Bolum | null = null;
    if (blok === "cihaz") {
      if (bolumler.some((y) => y.blok === "cihaz")) continue;
      b = { id: "cihaz", ad, blok: "cihaz", kilit: false };
    } else if (blok === "bilgi") {
      const alanlar = dizi(x.alanlar, 60).map(nesne).filter((a) => yazi(a.ad, 200));
      b = hamdanBolum(calisan(), { blok, ad, alanlar: alanlar.map(sadeAlan) }, ek);
      if (b?.blok === "bilgi") b = { ...b, dizilis: dizilis(x.dizilis), alanlar: b.alanlar.map((a, j) => (evet(alanlar[j]?.tam) ? { ...a, tam: true } : a)) };
    } else if (blok === "liste") {
      b = hamdanBolum(calisan(), { blok, ad, gruplar: dizi(x.gruplar, 40).map(nesne).map((g) => ({ ad: g.ad, maddeler: g.maddeler })) }, ek);
      const cevaplar = [...new Set(dizi(x.cevaplar, 6).map((c) => yazi(c, 40)).filter(Boolean))];
      if (b?.blok === "liste") {
        b = { ...b, cevaplar: cevaplar.length >= 2 ? cevaplar : CEVAPLAR, ...(evet(x.yanYana) ? { yanYana: true } : {}), ...(x.numara === "surekli" ? { numara: "surekli" as const } : {}) };
      }
    } else if (blok === "test") {
      b = hamdanBolum(calisan(), { blok, ad, degerler: dizi(x.degerler, 40).map(nesne).map((d) => ({ ad: d.ad, birim: yazi(d.birim, 40) || null, formul: yazi(d.formul, 2000) || null, ...sadeSinir(d) })) }, ek);
    } else if (blok === "olcum") {
      b = hamdanBolum(calisan(), { blok, ad, sutunlar: dizi(x.sutunlar, 20).map(nesne).map((c) => ({ ...sadeAlan(c), giris: c.giris, ...sadeSinir(c) })) }, ek);
    } else if (blok === "metin") {
      b = Bolum.safeParse({ id: yeni("b"), ad, blok, kilit: false, metin: uzunYazi(x.metin, 4000) }).data ?? null;
    } else if (blok === "foto") {
      b = Bolum.safeParse({ id: yeni("b"), ad, blok, kilit: false, enAz: 1, enCok: 20 }).data ?? null;
    } else if (blok === "not" || blok === "kusur") {
      b = Bolum.safeParse({ id: yeni("b"), ad, blok, kilit: false }).data ?? null;
    }
    if (!b) { atilan.push(ad); continue; }
    ek.add(b.id);
    /* numarasız bölüm (formda numarası yok) ya da önceki bölümün alt başlığı (2.1, 2.2) */
    const duzen = evet(x.numarasiz) ? { numarasiz: true } : evet(x.alt) && bolumler.length > 1 ? { alt: true } : {};
    const r = Bolum.safeParse({ ...b, ...duzen });
    if (r.success) bolumler.push(r.data); else atilan.push(ad);
  }
  /* ölçüm cihazları bölümü formda yoksa numarasız, ekipman bölümünün hemen ardından (kurucu numaralı eklemesin) */
  if (!bolumler.some((b) => b.blok === "cihaz")) bolumler.splice(ekipmanVar ? 2 : 1, 0, { id: "cihaz", ad: "Kullanılan cihazlar", blok: "cihaz", kilit: false, numarasiz: true });

  /* sonuç: cümle sözcükten önceki kısım; olumlu / olumsuz bitiş formun yazımıyla */
  const hs = nesne(ham.sonuc);
  const sonuc = Bolum.safeParse({
    id: "sonuc", ad: yazi(hs.ad, 200) || "Sonuç", blok: "sonuc", kilit: false, cumle: yazi(hs.cumle, 400), aciklama: "",
    ...(yazi(hs.uygunMetin, 120) ? { uygunMetin: yazi(hs.uygunMetin, 120) } : {}), ...(yazi(hs.uygunDegilMetin, 120) ? { uygunDegilMetin: yazi(hs.uygunDegilMetin, 120) } : {}),
    ...(evet(hs.numarasiz) ? { numarasiz: true } : {}),
  });
  bolumler.push(sonuc.success ? sonuc.data : iskelet.bolumler.find((b) => b.blok === "sonuc")!);

  /* imza: satırlar kişinin bilgisiyle (kişiye uymayan atılır); muayene uzmanının imza hücresi her zaman (e-imzanın yeri) */
  const hi = nesne(ham.imza);
  const satirlar: ImzaSatiri[] = dizi(hi.satirlar, 40).map(nesne).flatMap((s): ImzaSatiri[] => {
    const ad = yazi(s.ad, 200), kim = bir(IMZA_KISILERI, s.kim), alan = bir(IMZA_ALANLARI, s.bilgi);
    if (!ad || !kim) return [];
    if (kim === "diger") return [{ id: yeni("i"), ad, kim, ...(yazi(s.metin, 400) ? { metin: yazi(s.metin, 400) } : {}), ...(evet(s.tam) ? { tam: true } : {}) }];
    if (!alan || !imzaAlanlari(kim).includes(alan)) return [];
    return [{ id: yeni("i"), ad, kim, alan, ...(evet(s.tam) ? { tam: true } : {}) }];
  });
  if (satirlar.length && !satirlar.some((s) => s.kim === "uzman" && s.alan === "imza")) satirlar.push({ id: yeni("i"), ad: "İmza", kim: "uzman", alan: "imza" });
  const imzaAd = yazi(hi.ad, 200) || "Yetkili kişiler ve imzalar";
  const imza = Bolum.safeParse(satirlar.length
    ? { id: "imza", ad: imzaAd, blok: "imza", kilit: false, imzalar: satirlar.some((s) => s.kim === "teknik") ? ["uzman", "teknik"] : ["uzman"], satirlar, ...(evet(hi.numarasiz) ? { numarasiz: true } : {}) }
    : { id: "imza", ad: imzaAd, blok: "imza", kilit: false, imzalar: ["uzman", "teknik"], ...(evet(hi.numarasiz) ? { numarasiz: true } : {}) });
  bolumler.push(imza.success ? imza.data : iskelet.bolumler.find((b) => b.blok === "imza")!);
  /* fotoğraf bölümü formda yoksa en sonda numarasız (rapor başına en az bir fotoğraf) */
  if (!bolumler.some((b) => b.blok === "foto")) bolumler.push({ id: yeni("b"), ad: "Fotoğraflar", blok: "foto", kilit: false, enAz: 1, enCok: 20, numarasiz: true });

  /* görünüm: belgenin başı, doküman bilgisi satırları, sayfa altı, ekipman satırlarının adı, firma bilgisi satırları, görünüm */
  const basTuru = ham.basTuru === "ad" ? "ad" as const : undefined;
  const gorulenBas = new Set<string>();
  const basSatirlar: BasSatiri[] = basTuru ? [] : dizi(ham.basSatirlari, 10).map(nesne).flatMap((s): BasSatiri[] => {
    const ad = yazi(s.ad, 200), kaynak = bir(BAS_KAYNAKLARI, s.kaynak);
    if (!ad || !kaynak || (kaynak !== "serbest" && gorulenBas.has(kaynak))) return [];
    gorulenBas.add(kaynak);
    return [{ id: yeni("h"), ad, kaynak, ...(kaynak === "serbest" && yazi(s.metin, 200) ? { metin: yazi(s.metin, 200) } : {}) }];
  });
  const gorulenFirma = new Set<string>();
  const firmaSatirlar: FirmaSatiri[] = dizi(ham.firmaSatirlari, 40).map(nesne).flatMap((s): FirmaSatiri[] => {
    const ad = yazi(s.ad, 200), kaynak = bir(FIRMA_KAYNAKLARI, s.kaynak);
    if (!ad || !kaynak || (kaynak !== "serbest" && gorulenFirma.has(kaynak))) return [];
    gorulenFirma.add(kaynak);
    return [{ id: yeni("f"), ad, kaynak, ...(kaynak === "serbest" && yazi(s.metin, 400) ? { metin: yazi(s.metin, 400) } : {}), ...(evet(s.tam) ? { tam: true } : {}) }];
  });
  /* zorunlu satırlar (SGK, İSG-KATİP, başlangıç) formda yoksa sona */
  if (firmaSatirlar.length) for (const z of FIRMA_ZORUNLU) if (!gorulenFirma.has(z)) firmaSatirlar.push({ id: yeni("f"), ad: FIRMA_KAYNAK_ADI[z], kaynak: z });
  const hst = nesne(ham.stil);
  const stil = {
    ...(hst.zemin === "gri" || hst.zemin === "yok" ? { zemin: hst.zemin } : {}), ...(hst.hiza === "orta" ? { hiza: "orta" as const } : {}),
    ...(hst.etiket === "kalin" ? { etiket: "kalin" as const } : {}),
  };
  const kodAdi = yazi(ham.ekipmanKodAdi, 60), turAdi = yazi(ham.ekipmanTurAdi, 60);
  const gorunum = {
    ...iskelet.gorunum, formKodu: yazi(ham.formKodu, 20), baslik,
    ...(basTuru ? { basTuru } : {}), ...(Object.keys(stil).length ? { stil } : {}), ...(basSatirlar.length ? { basSatirlar } : {}),
    ...(yazi(ham.altYazi, 300) ? { altYazi: yazi(ham.altYazi, 300) } : {}),
    ...(kodAdi || turAdi ? { ekipmanAd: { ...(kodAdi ? { kod: kodAdi } : {}), ...(turAdi ? { tur: turAdi } : {}) } } : {}),
    ...(firmaSatirlar.length ? { firma: { satirlar: firmaSatirlar } } : {}),
    ...(ekipmanVar ? {} : { ekipman: false }),
  };
  const t = FormatTanimi.safeParse({ ...iskelet, bolumler, gorunum });
  if (!t.success) return null;
  return { tanim: t.data, cevap: yazi(ham.cevap, 1000), atilan };
}
