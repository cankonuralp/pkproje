/* KESİN SİLME — tek mekanizma (357; reisim 2026-10-07: "eklenebilen şeylerin silinemediğini tespit ettim … bunu da düzeltmeliyiz"; pkproje §9 kırk birinci
   tur). Hiç KULLANILMAMIŞ kayıt kesin silinir; kullanılmış kayıt pasife alınır ya da silinmez. "Kullanılmış" tanımı ve silmenin kendisi veritabanında
   (göç 0054 …): <tablo>_kullanim(uuid[]) ve <tablo>_sil(uuid, text) — tanımlayıcı-yetkili, oturumdaki firmada ve hesapla, satır kilidiyle, birlikte
   silinenler aynı işlemde, dosyalar çöpe, denetim izine eski değerle. Uygulama rolünün bu tablolarda DELETE hakkı YOK.
   · SILINEBILIR: tür → işlev adları (sabit sözlük; işlev adı girdiden kurulmaz) ve tablonun yabancı anahtarlarının hangisi "kullanım" (silmeyi
     engeller), hangisi "birlikte" (kayıtla silinir). tests/silme-kapsami.test.ts her yabancı anahtarın burada olduğunu denetler (yeni bir bağ eklenip
     silme işlevi güncellenmezse düşer).
   · Yetki burada DEĞİL: modülün işlevi önce canDoEylem("kayit_sil", { modul }) sorar (yalnız yöneticiler), sonra kesinSil'i çağırır. */
import type { Sorgulayici } from "./kiraci.ts";

export const SILINEBILIR = {
  olcum_cihazi: {
    kullanim: "olcum_cihazi_kullanim", sil: "olcum_cihazi_sil",
    fk: { kullanim: ["zimmet_hareket.cihaz_id"], birlikte: ["kalibrasyon.cihaz_id"] },
  },
  /* 359: cihazı olmayan, raporda tür olarak geçmeyen tür; silinince ekipman türlerinin cihaz_turleri dizisinden de çıkar (0055) */
  cihaz_turu: {
    kullanim: "cihaz_turu_kullanim", sil: "cihaz_turu_sil",
    fk: { kullanim: ["olcum_cihazi.tur_id"], birlikte: [] },
  },
  /* 360: raporu olmayan, tamamlanmış planda yer almayan ekipman; plan satırları ve kod geçmişi birlikte (kod serbest; 0056) */
  ekipman: {
    kullanim: "ekipman_kullanim", sil: "ekipman_sil",
    fk: { kullanim: ["rapor.ekipman_id"], birlikte: ["ekipman_kodu.ekipman_id", "plan_ekipman.ekipman_id"] },
  },
  /* 361: ekipmanı, raporu, personel ataması, teklif kalemi, fatura satırı olmayan tür; fiyat, format sürümleri ve PDF'ler birlikte (kod serbest; 0057) */
  ekipman_turu: {
    kullanim: "ekipman_turu_kullanim", sil: "ekipman_turu_sil",
    fk: {
      kullanim: ["ekipman.tur_id", "ekipman_atamasi.tur_id", "fatura_rapor.tur_id", "rapor.tur_id", "teklif_kalem.tur_id"],
      birlikte: ["fiyat_listesi.tur_id", "rapor_format.tur_id", "tur_format.tur_id"],
    },
  },
  /* 362: zimmet hareketi ve imzalı zimmet formu olmayan demirbaş (kod serbest; 0058) */
  demirbas: {
    kullanim: "demirbas_kullanim", sil: "demirbas_sil",
    fk: { kullanim: ["zimmet_hareket.demirbas_id"], birlikte: [] },
  },
  /* 363: zimmet hareketi (teslim tutanağı) ve haftalık kilometresi olmayan araç (plaka serbest; 0059) */
  arac: {
    kullanim: "arac_kullanim", sil: "arac_sil",
    fk: { kullanim: ["arac_km.arac_id", "zimmet_hareket.arac_id"], birlikte: [] },
  },
  /* 364: planı, ekipmanı, sözleşmesi, etkin İSG ID'si, teklifi, giriş kapsamı olmayan tesis; kaldırılmış İSG kayıtları birlikte (0060) */
  tesis: {
    kullanim: "tesis_kullanim", sil: "tesis_sil",
    fk: { kullanim: ["ekipman.tesis_id", "is_sozlesmesi_tesis.tesis_id", "plan.tesis_id", "teklif_tesis.tesis_id"], birlikte: ["isg_katip.tesis_id"] },
  },
  /* 364: sözleşmesi, teklifi, faturası, girilmiş müşteri girişi, tesislerinde plan / ekipman / etkin İSG ID'si olmayan müşteri; tesisleri ve hiç
     girilmemiş girişleri birlikte (karar 48 kullanılmış müşteri için geçerli; 0060) */
  musteri: {
    kullanim: "musteri_kullanim", sil: "musteri_sil",
    fk: { kullanim: ["fatura.musteri_id", "is_sozlesmesi.musteri_id", "teklif.musteri_id"], birlikte: ["musteri_hesap.musteri_id", "tesis.musteri_id"] },
  },
  /* 366: zimmeti, planı, raporu, özlüğü, bordrosu, eğitimi, talebi, imza belgesi, giriş yapılmış hesabı … olmayan personel; hiç girilmemiş hesap ve
     kaldırılmış İSG kayıtları birlikte (karar 43 kullanılmış personel için geçerli — o "Ayrıldı" olur; 0061) */
  personel: {
    kullanim: "personel_kullanim", sil: "personel_sil",
    fk: {
      kullanim: ["arac_km.personel_id", "belge_onay.personel_id", "bordro.personel_id", "egitim_kaydi.personel_id", "ekipman_atamasi.personel_id",
        "gider.personel_id", "izin_talebi.personel_id", "ozluk_belgesi.personel_id", "plan_ekip.personel_id", "rapor.personel_id",
        "zimmet_formu.personel_id", "zimmet_hareket.alan_personel", "zimmet_hareket.eden_personel"],
      birlikte: ["hesap.personel_id", "isg_katip.personel_id"],
    },
  },
  /* 367: müşterinin panele hiç girmediği EK giriş (ana giriş silinmez); oturumları zincirle (0062) */
  musteri_hesap: {
    kullanim: "musteri_hesap_kullanim", sil: "musteri_hesap_sil",
    fk: { kullanim: [], birlikte: ["musteri_oturum.musteri_hesap_id"] },
  },
} as const satisfies Record<string, { kullanim: string; sil: string; fk: { kullanim: readonly string[]; birlikte: readonly string[] } }>;
export type SilinebilirTur = keyof typeof SILINEBILIR;

/** kayıt başına kullanım sayımı ("rapor": 3, "zimmet": 1 …); kullanılmamış kayıt haritada yok */
export type Kullanim = Record<string, number>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function kullanimlar(db: Sorgulayici, tur: SilinebilirTur, idler: readonly string[]): Promise<Map<string, Kullanim>> {
  const l = idler.filter((x) => UUID.test(x));
  if (!l.length) return new Map();
  const r = await db.sorgu<{ id: string; kullanim: Kullanim }>(`SELECT id::text, kullanim FROM ${SILINEBILIR[tur].kullanim}($1::uuid[])`, [l]);
  return new Map(r.rows.filter((x) => Object.keys(x.kullanim).length).map((x) => [x.id, Object.fromEntries(Object.entries(x.kullanim).map(([k, v]) => [k, Number(v)]))]));
}

export type SilmeSonucu = { durum: "tamam"; ad: string } | { durum: "kullanildi"; kullanim: Kullanim } | { durum: "yok" };

/** kesin sil (kullanılmadıysa): oturumdaki firmada, kimin adıyla (iz) */
export async function kesinSil(db: Sorgulayici, tur: SilinebilirTur, id: string, kim: string): Promise<SilmeSonucu> {
  if (!UUID.test(id)) return { durum: "yok" };
  const s = (await db.sorgu<{ s: { durum: string; ad?: string; kullanim?: Kullanim } }>(`SELECT ${SILINEBILIR[tur].sil}($1::uuid, $2) AS s`, [id, kim])).rows[0].s;
  if (s.durum === "tamam") return { durum: "tamam", ad: String(s.ad ?? "") };
  if (s.durum === "kullanildi") return { durum: "kullanildi", kullanim: Object.fromEntries(Object.entries(s.kullanim ?? {}).map(([k, v]) => [k, Number(v)])) };
  return { durum: "yok" };
}
