/* BELGE DOLDURMA — MODÜL BAĞLARI (2026-10-25, belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir
   olmalı, bir müşteri için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim"). Sözleşme dışındaki belgelerin (teklif,
   zimmet formu, araç tutanağı, eğitim katılım formu, izin / masraf talep formu, fatura özeti) elle doldurulan yerleri o belgenin modülünde bağlanır:
   belgenin verisi (PDF ondan basılır) elle değerleri kaydın kimliğiyle okur; doldurma işlevi kayıttan ÖNCE modülün yetkisini denetler; eylem modülün
   doldurma işlevini çağırır; PDF tuşunun durduğu ekranda "Belgeyi doldur". Saf kaynak denetimi — kilit tests/belge-doldurma-moduller.test.ts, olumsuz
   kanıt tests/bozan/belge-doldurma-moduller.bozan.ts (dosyalar bellekte bozulur). */

export interface DoldurmaBagi {
  /** katalogdaki belge */
  belge: string;
  /** modülün sunucu dosyası */
  sunucu: string;
  /** belgenin verisini kuran işlev (PDF bu veriden basılır) ve içindeki elle değer okuması (kaydın kimliğiyle) */
  verisi: string; okuma: string;
  /** verisi kuran işlevi çağırması gereken işlevler (imzaya / e-postaya giden PDF de elle değerlerle) */
  kullanan?: readonly string[];
  /** modülün doldurma işlevi, içinde kayıttan önce gelmesi gereken yetki denetimi ve kayıt çağrısı */
  doldur: string; yetki: string; kayit: string;
  /** yetki ayrı işlevdeyse: o işlev ve içinde bulunması gereken denetimler */
  durum?: { ad: string; denetim: readonly string[] };
  /** ui/eylemler.ts ve doldurma eylemi */
  eylemler: string; eylem: string;
  /** PDF tuşunun (ya da belgeyi gönderen tuşun) durduğu ekran: o tuşun parçası ve yanındaki doldurma bileşeni */
  ekran: string; yer: string; tus: string;
  /** "Belgeyi doldur" tuşunu çizen bileşenin dosyası ve çağrısı */
  bilesen: { dosya: string; metin: string };
}

const yetkisiz = `return { durum: "yetkisiz" };`;
export const DOLDURMA_BAGLARI: readonly DoldurmaBagi[] = [
  {
    belge: "teklif", sunucu: "src/modules/teklifler/server/teklifler.ts", verisi: "teklifBelgesiVerisi", okuma: `belgeDoldurmasi(db, "teklif", id)`,
    doldur: "teklifDoldur", yetki: `if (!yazar(kim)) ${yetkisiz}`, kayit: `belgeDoldurmaKaydet(db, { ad: kim.ad }, "teklif", id,`,
    durum: { ad: "teklifDoldur", denetim: [`FROM teklif WHERE id = $1 FOR SHARE`, `if (x.durum !== "taslak") return`] },
    eylemler: "src/modules/teklifler/ui/eylemler.ts", eylem: "teklifDoldurEylemi",
    ekran: "src/modules/teklifler/ui/TeklifEylemleri.tsx", yer: "href={pdf} download", tus: `<BelgeDoldurmaTusu belge="teklif"`,
    bilesen: { dosya: "src/modules/teklifler/ui/TeklifEylemleri.tsx", metin: `<BelgeDoldurmaTusu belge="teklif"` },
  },
  {
    belge: "zimmet", sunucu: "src/modules/personel/server/dosyalar.ts", verisi: "zimmetVerisi", okuma: `belgeDoldurmasi(db, "zimmet", personelId)`,
    kullanan: ["zimmetFormuVerisi", "zimmetFormuGonder"],
    doldur: "zimmetDoldur", yetki: `if (!yazar(kim)) ${yetkisiz}`, kayit: `belgeDoldurmaKaydet(db, { ad: kim.ad }, "zimmet", personelId,`,
    eylemler: "src/modules/personel/ui/eylemler.ts", eylem: "zimmetDoldurEylemi",
    ekran: "src/modules/personel/ui/DosyaBolumleri.tsx", yer: "/zimmet-formu/pdf`", tus: "<ZimmetDoldurma ",
    bilesen: { dosya: "src/modules/personel/ui/DosyaBolumleri.tsx", metin: `<BelgeDoldurmaTusu belge="zimmet"` },
  },
  {
    belge: "arac", sunucu: "src/modules/araclar/server/araclar.ts", verisi: "tutanakBelgesiVerisi", okuma: `belgeDoldurmasi(db, "arac", x.id)`,
    doldur: "tutanakDoldur", yetki: "await tutanakDoldurmaDurumu(db, kim, hareketId)", kayit: `belgeDoldurmaKaydet(db, { ad: kim.ad }, "arac", hareketId,`,
    durum: { ad: "tutanakDoldurmaDurumu", denetim: [`if (k === false || (k === null && !degistirir(kim))) return "yetkisiz";`,
      `if (!x || (k !== null && x.eden !== k)) return "yok";`, `=== "imzali" ? "imzali"`] },
    eylemler: "src/modules/araclar/ui/eylemler.ts", eylem: "tutanakDoldurEylemi",
    ekran: "src/modules/araclar/ui/Pencereler.tsx", yer: "/araclar/tutanak/${t.hareketId}/pdf", tus: "<TutanakDoldurma ",
    bilesen: { dosya: "src/modules/araclar/ui/Pencereler.tsx", metin: `<BelgeDoldurmaTusu belge="arac"` },
  },
  {
    belge: "egitim", sunucu: "src/modules/egitimler/server/egitimler.ts", verisi: "katilimVerisi", okuma: `belgeDoldurmasi(db, "egitim", x.id)`,
    kullanan: ["katilimFormuGonder", "katilimDoldurmaVerisi"],
    doldur: "katilimDoldur", yetki: "await katilimDoldurmaDurumu(db, kim, kayitId)", kayit: `belgeDoldurmaKaydet(db, { ad: kim.ad }, "egitim", d.x.id,`,
    durum: { ad: "katilimDoldurmaDurumu", denetim: [`if (!degistirir(kim)) ${yetkisiz}`, "if (x.onceki) return", `?.durum === "imzali") return`] },
    eylemler: "src/modules/egitimler/ui/eylemler.ts", eylem: "katilimDoldurEylemi",
    ekran: "src/modules/egitimler/ui/EgitimListesi.tsx", yer: "Katılım formunu imzaya gönder", tus: "<KatilimDoldurma ",
    bilesen: { dosya: "src/modules/egitimler/ui/EgitimListesi.tsx", metin: `<BelgeDoldurmaTusu belge="egitim"` },
  },
  {
    belge: "izin / masraf", sunucu: "src/modules/talepler/server/talepler.ts", verisi: "talepFormuVerisi", okuma: "belgeDoldurmasi(db, tip as TalepTipi, id)",
    doldur: "talepDoldur", yetki: "await talepDoldurmaDurumu(db, kim, tip, id)", kayit: "belgeDoldurmaKaydet(db, { ad: kim.ad }, d.tip, id,",
    durum: { ad: "talepDoldurmaDurumu", denetim: [`if (!ben) ${yetkisiz}`, "if (!x || x.personel_id !== ben) return", "if (!KARARSIZ.has(x.durum)) return"] },
    eylemler: "src/modules/talepler/ui/eylemler.ts", eylem: "talepDoldurEylemi",
    ekran: "src/modules/talepler/ui/Talepler.tsx", yer: "/talepler/pdf/${t.tip}/${x.id}", tus: "<TalepDoldurma ",
    bilesen: { dosya: "src/modules/talepler/ui/Talepler.tsx", metin: "<BelgeDoldurmaTusu belge={tip}" },
  },
  {
    belge: "fatura", sunucu: "src/modules/muhasebe/server/muhasebe.ts", verisi: "faturaBelgesiVerisi", okuma: `belgeDoldurmasi(db, "fatura", id)`,
    doldur: "faturaDoldur", yetki: `if (!yazar(kim)) ${yetkisiz}`, kayit: `belgeDoldurmaKaydet(db, { ad: kim.ad }, "fatura", id,`,
    eylemler: "src/modules/muhasebe/ui/eylemler.ts", eylem: "faturaDoldurEylemi",
    ekran: "src/app/(uygulama)/muhasebe/f/[id]/page.tsx", yer: "/muhasebe/f/${f.id}/pdf", tus: "<FaturaDoldurma ",
    bilesen: { dosya: "src/modules/muhasebe/ui/IsParcalari.tsx", metin: `<BelgeDoldurmaTusu belge="fatura"` },
  },
];

/** işlevin gövdesi (tanımından sütun 0'daki ilk "}" satırına kadar); yoksa null */
export function islevGovdesi(metin: string, ad: string): string | null {
  const m = new RegExp(`(?:^|\\n)(?:export )?async function ${ad}\\(`).exec(metin);
  if (!m) return null;
  const son = metin.indexOf("\n}\n", m.index + 1);
  return son < 0 ? null : metin.slice(m.index, son);
}

/** bağlardaki eksikler (boş: hepsi bağlı); oku: köke göre göreli dosya → metin */
export function doldurmaBagiEksikleri(oku: (dosya: string) => string, baglar: readonly DoldurmaBagi[] = DOLDURMA_BAGLARI): string[] {
  const b: string[] = [];
  for (const x of baglar) {
    const s = oku(x.sunucu);
    const v = islevGovdesi(s, x.verisi);
    if (!v) b.push(`${x.belge}: ${x.verisi} yok`);
    else if (!v.includes(`elle: (await ${x.okuma})?.degerler ?? null`)) b.push(`${x.belge}: ${x.verisi} elle değerleri okumuyor — doldurulan yer PDF'te boş basılır`);
    for (const k of x.kullanan ?? []) {
      if (!islevGovdesi(s, k)?.includes(`${x.verisi}(`)) b.push(`${x.belge}: ${k} belgeyi ${x.verisi} ile kurmuyor — giden belgede elle değerler yok`);
    }
    const d = islevGovdesi(s, x.doldur);
    if (!d) b.push(`${x.belge}: ${x.doldur} yok`);
    else {
      const k = d.indexOf(x.kayit), y = d.indexOf(x.yetki);
      if (k < 0) b.push(`${x.belge}: ${x.doldur} kaydı belgenin kaydıyla yapmıyor`);
      if (y < 0 || (k >= 0 && y > k)) b.push(`${x.belge}: ${x.doldur} kayıttan önce yetkiyi denetlemiyor`);
    }
    if (x.durum) {
      const g = islevGovdesi(s, x.durum.ad);
      for (const t of x.durum.denetim) if (!g?.includes(t)) b.push(`${x.belge}: ${x.durum.ad} denetimi eksik: ${t}`);
    }
    const e = islevGovdesi(oku(x.eylemler), x.eylem);
    if (!e) b.push(`${x.belge}: ${x.eylem} yok`);
    else if (!e.includes(`${x.doldur}(db, o,`) || (!e.includes("ayniKoken") && !e.includes("await oturum()"))) {
      b.push(`${x.belge}: ${x.eylem} modülün doldurma işlevini oturumdan çağırmıyor`);
    }
    const ek = oku(x.ekran);
    if (!ek.includes(x.yer)) b.push(`${x.belge}: ${x.ekran} belgenin tuşunu taşımıyor`);
    if (!ek.includes(x.tus)) b.push(`${x.belge}: ${x.ekran} "Belgeyi doldur"u çizmiyor`);
    if (!oku(x.bilesen.dosya).includes(x.bilesen.metin)) b.push(`${x.belge}: ${x.bilesen.dosya} BelgeDoldurmaTusu'nu belgeyle çizmiyor`);
  }
  return b;
}
