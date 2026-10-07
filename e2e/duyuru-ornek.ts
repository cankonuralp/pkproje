/* UYDURMA DUYURU SAYFALARI (379) — Bakanlık duyuru sayfalarının YAPISINI taklit eder, içerik uydurmadır (gerçek duyuru değil). Uçtan uca
   sunucunun yerel taklidi (scripts/e2e-sunucu.ts, PROBATA_DUYURU_UC) ve tests/duyuru.test.ts kullanır. Tarihler geçmişte (gelecek tarih reddedilir). */

export interface OrnekOge { kod: string; gun: string; ay: string; yil: string; baslik: string }
export interface OrnekPortalOge { tarih: string; baslik: string; no: number | null }

export const ORNEK_DUYURU = {
  isggm: [
    { kod: "15092026", gun: "15", ay: "Eylül", yil: "2026", baslik: "Deneme İSGGM duyurusu: &#214;rnek sınav takvimi" },
    { kod: "02092026", gun: "02", ay: "Eylül", yil: "2026", baslik: "Deneme İSGGM duyurusu: eğitim başvuruları" },
    { kod: "20082026", gun: "20", ay: "Ağustos", yil: "2026", baslik: "Deneme İSGGM duyurusu: eski kayıt" },
  ] as OrnekOge[],
  isgum: [
    { kod: "10092026", gun: "10", ay: "Eylül", yil: "2026", baslik: "Deneme İSGÜM duyurusu: ölçüm eğitimi" },
    { kod: "01082026", gun: "01", ay: "Ağustos", yil: "2026", baslik: "Deneme İSGÜM duyurusu: laboratuvar" },
  ] as OrnekOge[],
  isekipman: [
    { tarih: "12.09.2026", baslik: "Deneme portal duyurusu: rapor formatı güncellendi", no: 9001 },
    { tarih: "03/07/2026", baslik: "Deneme portal duyurusu: sözleşme süreleri", no: 9002 },
    { tarih: "01.06.2026", baslik: "Deneme portal duyurusu: bağlantısız kayıt", no: null },
  ] as OrnekPortalOge[],
};

export function csgbOrnek(birim: "isggm" | "isgum", ogeler: readonly OrnekOge[] = ORNEK_DUYURU[birim]): string {
  return `<!DOCTYPE html><html lang="tr-TR"><body><section class="announcements news-overview pt-0"><div class="container"><div class="row">${ogeler.map((o) => `
    <div class="announcement-item col-md-6 col-lg-4"><div class="bordered scaling">
      <a href="/${birim}/duyurular/${o.kod}/" title="${o.baslik}" class="announcement-item-href d-flex align-content-center">
        <div class="left-side col-3 text-center"><div class="date">
          <span class="day">${o.gun}</span> <span class="moon">${o.ay}</span> <span class="year">${o.yil}</span>
        </div></div>
        <div class="right-side col-9 gutter-0"><div class="content"><h1 class="title">${o.baslik}</h1>
          <div class="place"><span class="icon-eye"></span> &nbsp; Duyuru detayı i&#231;in tıklayın.</div></div></div>
      </a></div></div>`).join("")}</div></div></section></body></html>`;
}

export function isekipmanOrnek(ogeler: readonly OrnekPortalOge[] = ORNEK_DUYURU.isekipman): string {
  return `<!DOCTYPE html><html><body><div class="icerik">${ogeler.map((o, i) => `
    <div id="dyr${i}"><em><strong>${o.tarih} &gt;&gt;&nbsp;<span style="letter-spacing: 0.5px">${o.baslik}</span><em><strong>;</strong></em></strong></em></div>
    ${o.no ? `<p><a href="https://isekipmanlari.csgb.gov.tr/detay.aspx?d=${o.no}" target="_blank">İlgili duyuru için tıklayınız.</a></p>` : "<p>Ayrıntı yok.</p>"}`).join("")}
  </div></body></html>`;
}

/** yerel taklidin yolu → sayfa (Bakanlık adreslerinin yol + sorgu kısmı) */
export function ornekSayfa(yol: string): string | null {
  if (yol === "/isggm/duyurular/") return csgbOrnek("isggm");
  if (yol === "/isgum/duyurular/") return csgbOrnek("isgum");
  if (yol === "/sayfa.aspx?d=3") return isekipmanOrnek();
  return null;
}
