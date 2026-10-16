/* ZİMMETLER — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Her işlem
   modülün VAR OLAN işlevini oturumdaki kişiyle çağırır — Zimmetler ekranıyla aynı yetki ve kural (kimde / hareketler: görebilen, denetçi yalnız
   kendi zimmetini; teslim / demirbaş: "yaz" düzeyi; teslim eden sunucuda son hareketten, kalibrasyondaki ya da pasif varlık teslim edilmez; demirbaş
   kodu eşsiz; pasife alınacak demirbaş depoda olmalı; sil: hiç kullanılmamış, yönetici). Girdi modülün şemasından (TeslimGirdisi, DemirbasGirdisi).
   Teslim fotoğrafı isteğe bağlı (ekrandaki gibi) — S.A.Y fotoğrafsız yazar. Araç teslimi Araçlar'ın tutanağıyla (arac_tutanak_kaydet). */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { GORUNMEZ, islem, sayfala, trIcerir, yazmaCevabi, type Islem } from "../../server/yz/islem.ts";
import { DemirbasGirdisi, TeslimGirdisi } from "./sema.ts";
import { demirbasDurumu, demirbasEkle, demirbasPasif, demirbasSil, teslimEt, varlikKarti, zimmetListeleri, type Kimde } from "./server/zimmet.ts";

const MODUL = 9;
const TUR = { c: "ölçüm cihazı", d: "demirbaş", a: "araç" } as const;
const kimdeMetni = (k: Kimde) => (k.tip === "kisi" ? { yer: "kişide", personel: k.id, ad: k.ad } : { yer: k.tip === "lab" ? "kalibrasyonda" : "depoda" });

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "zimmet_ara", modul: MODUL, tur: "oku", islev: zimmetListeleri, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, sayfa: SuzgecDurumuSemasi.shape.sayfa }),
    tarif: "Zimmet varlıklarını (ölçüm cihazı, demirbaş, araç) ve kimde olduklarını arar (20'şer): ara — kod, ad, kişi; anahtar (c:/d:/a: + kimlik) teslimde kullanılır; teslim alınabilecek kişiler.",
    calistir: async (b, v) => {
      const l = await zimmetListeleri(b.db, b.kim);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Zimmetler'i göremiyor." };
      const s = sayfala(l.varliklar.filter((x) => trIcerir([x.kod, x.ad, x.kimde.tip === "kisi" ? x.kimde.ad : ""].join(" "), v.ara)), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, varliklar: s.satirlar.map((x) => ({ anahtar: x.anahtar, tur: TUR[x.tur], kod: x.kod, ad: x.ad, ...kimdeMetni(x.kimde),
        pasif: x.pasif, son: x.son })), kisiler: l.kisiler } };
    },
  }),
  islem({
    ad: "zimmet_getir", modul: MODUL, tur: "oku", girdi: z.object({ varlik: TeslimGirdisi.shape.varlik.or(z.string().regex(/^a:[0-9a-f-]{36}$/)) }), kaynak: [TeslimGirdisi],
    islev: varlikKarti, tarif: "Varlığın kartı: kimde, teslim hareketleri (zaman, eden, alan, not).",
    calistir: async (b, v) => {
      const x = await varlikKarti(b.db, b.kim, v.varlik);
      if (!x) return { tamam: false, neden: GORUNMEZ };
      /* demirbaşın sürümü (Pasife al / Sil için) — yalnız değiştirebilene */
      const d = x.tur === "d" ? await demirbasDurumu(b.db, b.kim, x.id) : null;
      return { tamam: true, sonuc: { ...x, tur: TUR[x.tur], kimde: kimdeMetni(x.kimde), ...(d ? { surum: d.surum, silinebilir: d.sil } : {}), hareketler: x.hareketler.slice(0, 50) } };
    },
  }),
  islem({
    ad: "zimmet_teslim", modul: MODUL, tur: "yaz", girdi: z.object(TeslimGirdisi.shape), kaynak: [TeslimGirdisi], islev: teslimEt,
    tarif: "Ölçüm cihazını ya da demirbaşı teslim eder: varlik (c:<kimlik> ya da d:<kimlik> — zimmet_ara), alan (personel kimliği ya da \"depo\"), zaman "
      + "(YYYY-AA-GGTSS:DD, Türkiye saati), notu.",
    calistir: async (b, _v, ham) => yazmaCevabi(await teslimEt(b.db, b.depo(), b.kim, b.firmaId, ham), { bildirim: "Teslim yazıldı." }),
  }),
  islem({
    ad: "demirbas_ekle", modul: MODUL, tur: "yaz", girdi: z.object(DemirbasGirdisi.shape), kaynak: [DemirbasGirdisi], islev: demirbasEkle,
    tarif: "Demirbaş ekler: kod (3–12; A–Z, 0–9, tire — eşsiz), ad.",
    calistir: async (b, _v, ham) => yazmaCevabi(await demirbasEkle(b.db, b.kim, ham), { bildirim: "Demirbaş eklendi." }),
  }),
  islem({
    ad: "demirbas_pasif", modul: MODUL, tur: "yaz", girdi: z.object({ demirbas: kimlik, surum, pasif: z.boolean() }), kaynak: [kimlik, surum], islev: demirbasPasif,
    tarif: "Demirbaşı kullanımdan çeker (pasif: true — depoda olmalı) ya da etkinleştirir (pasif: false).",
    calistir: async (b, v) => yazmaCevabi(await demirbasPasif(b.db, b.kim, v.demirbas, v.surum, v.pasif), { bildirim: v.pasif ? "Demirbaş pasife alındı." : "Demirbaş etkinleştirildi." }),
  }),
  islem({
    ad: "demirbas_sil", modul: MODUL, tur: "yaz", girdi: z.object({ demirbas: kimlik }), kaynak: [kimlik], islev: demirbasSil,
    tarif: "Hiç kullanılmamış demirbaşı kesin siler (yönetici); kullanılmışsa nedeni döner.",
    calistir: async (b, v) => {
      const r = await demirbasSil(b.db, b.kim, v.demirbas);
      return yazmaCevabi(r, { bildirim: r.durum === "tamam" ? `${r.ad} silindi.` : undefined });
    },
  }),
];
