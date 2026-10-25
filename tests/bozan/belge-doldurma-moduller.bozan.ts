/* OLUMSUZ KANIT — tests/belge-doldurma-moduller.test.ts neyi koruyor (2026-10-25, belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile
   değiştirilebilir ve doldurulabilir olmalı …"). Kaynak diskte değiştirilmez; dosya bellekte bozulup denetime verilir:
   1. Teklif belgesinin verisi elle değerleri okumasaydı doldurulan yerler teklif PDF'inde boş basılırdı.
   2. Zimmet formu imzaya gönderilirken veri başka yoldan kurulsaydı kişiye giden formda elle değerler olmazdı.
   3. Zimmet doldurması yetkiyi denetlemeseydi Personel'i yalnız gören kişinin formunu doldururdu.
   4. Talep doldurmasında sahiplik denetimi olmasaydı başkasının talep formu doldurulurdu.
   5. Tutanak imzalandıktan sonra doldurulabilseydi imzalı tutanakla indirilen PDF ayrışırdı.
   6. Teklif gönderildikten sonra doldurulabilseydi müşteriye verilmiş teklifin belgesi değişirdi.
   7. Talep penceresinde "Belgeyi doldur" çizilmeseydi kişi formu dolduramazdı.
   8. Eylem doldurma işlevini çağırmasaydı tuş hiçbir şey kaydetmezdi. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { oku } from "../yardimci/denetimler.ts";
import { doldurmaBagiEksikleri } from "../yardimci/belge-doldurma-moduller.ts";

/** yalnız verilen dosyanın verilen satırı bellekte değişir */
function bozuk(dosya: string, eski: string, yeni: string): string[] {
  const m = oku(dosya);
  assert.ok(m.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  return doldurmaBagiEksikleri((d) => (d === dosya ? m.replace(eski, () => yeni) : oku(d)));
}
const yakalandi = (l: string[], parca: string) => assert.ok(l.some((x) => x.includes(parca)), `yakalanmadı: ${parca}\n${l.join("\n")}`);

test("teklif verisi elle değerleri okumazsa yakalanır", () => {
  yakalandi(bozuk("src/modules/teklifler/server/teklifler.ts", `elle: (await belgeDoldurmasi(db, "teklif", id))?.degerler ?? null,`, ""), "teklif: teklifBelgesiVerisi elle");
});

test("zimmet formu imzaya başka veriyle gönderilirse yakalanır", () => {
  yakalandi(bozuk("src/modules/personel/server/dosyalar.ts", "try { pdf = await uret(await zimmetVerisi(db, personelId, z, no, depo)); }",
    "try { pdf = await uret({} as never); }"), "zimmetFormuGonder belgeyi zimmetVerisi");
});

test("zimmet doldurması yetkiyi denetlemezse yakalanır", () => {
  const dosya = "src/modules/personel/server/dosyalar.ts";
  const m = oku(dosya), i = m.indexOf("export async function zimmetDoldur(");
  assert.ok(i > 0);
  const govde = m.slice(i), eski = `  if (!yazar(kim)) return { durum: "yetkisiz" };\n`;
  assert.ok(govde.includes(eski));
  const l = doldurmaBagiEksikleri((d) => (d === dosya ? m.slice(0, i) + govde.replace(eski, "") : oku(d)));
  yakalandi(l, "zimmetDoldur kayıttan önce yetkiyi");
});

test("talep doldurmasında sahiplik denetimi yoksa yakalanır", () => {
  yakalandi(bozuk("src/modules/talepler/server/talepler.ts", `if (!x || x.personel_id !== ben) return { durum: "yok" };`, `if (!x) return { durum: "yok" };`),
    "talepDoldurmaDurumu denetimi eksik");
});

test("imzalanmış tutanak doldurulabilirse yakalanır", () => {
  yakalandi(bozuk("src/modules/araclar/server/araclar.ts", `=== "imzali" ? "imzali" : "tamam"`, `=== "yok" ? "imzali" : "tamam"`), "tutanakDoldurmaDurumu denetimi eksik");
});

test("gönderilmiş teklif doldurulabilirse yakalanır", () => {
  yakalandi(bozuk("src/modules/teklifler/server/teklifler.ts", `if (x.durum !== "taslak") return { durum: "red", neden: "Teklif gönderildi; belgesi değiştirilmez." };`, ""),
    "teklifDoldur denetimi eksik");
});

test("talep penceresinde Belgeyi doldur çizilmezse yakalanır", () => {
  yakalandi(bozuk("src/modules/talepler/ui/Talepler.tsx", "{doldur && bek && <TalepDoldurma ", "{doldur && bek && <span "), "Belgeyi doldur\"u çizmiyor");
});

test("eylem doldurma işlevini çağırmazsa yakalanır", () => {
  yakalandi(bozuk("src/modules/muhasebe/ui/eylemler.ts", "(db) => faturaDoldur(db, o, yazi(faturaId), degerler, s)", "async () => ({ durum: \"yok\" as const })"),
    "faturaDoldurEylemi modülün doldurma işlevini");
});
