/* KULLANIM KOŞULLARI — "YAPAY ZEKÂ (S.A.Y)" MADDESİNİN METNİ (2026-10-31, kalem 7 — M6; karar 5: 06-KULLANIM-KOSULLARI-YZ.md aynen). Saf; kabul ekranı
   (ui/KosulKabul.tsx), koşullar sayfası (src/app/(acik)/kosullar) ve sunucu (src/server/yz/kosul.ts) aynı metni kullanır. */

/** koşul sürümü — değişince eski kabuller geçersiz, yeniden kabul */
export const KOSUL_SURUMU = "2026-11-1";

/** üç satır özet (kabul ekranları) */
export const KOSUL_OZETI = [
  "S.A.Y'a verdiğiniz yazı ve belgeler (kişisel belgeler dahil) cevap üretmek için Anthropic'e (ABD) gönderilir.",
  "Konuşmalar ve ekler firmanızın veri alanında saklanır; \"Sohbeti temizle\" ile silinir.",
  "S.A.Y kullanıcının yetkisiyle çalışır. Göndermeden ve silmeden önce onay ister.",
] as const;

/** "Yapay zekâ (S.A.Y)" maddesi — kullanım koşulları sayfası (06-KULLANIM-KOSULLARI-YZ.md §1, aynen) */
export const KOSUL_MADDESI: readonly (readonly [string, string])[] = [
  ["Ne yapar.", "S.A.Y, probata içinde kullanıcının isteğiyle kayıt açar ve düzenler, belge ekler, rapor hazırlar. Kullanıcının ekrandaki yetkisiyle çalışır: ekranda yapamadığı bir işi S.A.Y ile de yapamaz."],
  ["Hangi bilgiyi işler.", "S.A.Y'a yazılan iletiler, eklenen dosyalar (fotoğraf, PDF, Word, Excel, ZIP, ekran görüntüsü, sohbet dökümü) ve işin gerektirdiği kayıt bilgileri. Bunlar kişisel veri içeren belgeleri de kapsayabilir: özlük belgeleri, kimlik, diploma, sağlık raporu; bordro, eğitim sertifikası, katılım listesi; imzalı formlar."],
  ["Nereye gider.", "Bu bilgiler, cevap üretmek için yapay zekâ hizmet sağlayıcısına (Anthropic PBC, ABD) gönderilir. Bu, verinin yurt dışına aktarılması demektir."],
  ["Nerede saklanır.", "Konuşma ve eklerin kopyası firmanın kendi veri alanında (veritabanı ve deposu) saklanır. Kullanıcı \"Sohbeti temizle\" ile kendi konuşmasını ve eklerini siler. S.A.Y'ın açtığı ya da güncellediği kayıtlar ve eklediği belgeler, ekrandan yapılmış gibi firmanın kayıtlarında kalır."],
  ["Kapsam dışı.", "Parolalar, API anahtarları ve e-imza S.A.Y'ın kapsamında değildir. Sistemdeki künye numaraları (SGK, DETSİS gibi) S.A.Y'a okunmaz; kullanıcı iletisinde yazdıysa yazdığı gider."],
  ["Kullanıcının payı.", "S.A.Y'ın yaptığı işi gözden geçirmek kullanıcının sorumluluğundadır. S.A.Y imza atmaz. Onaya, imzaya ya da dışarıya göndermeden ve silmeden önce ikinci kez onay ister."],
  ["Firmanın payı.", "Firma, S.A.Y'a verdiği kişisel verilerin sahiplerini (çalışanlar, müşteri temsilcileri) bilgilendirir ve gerekiyorsa rızalarını alır."],
  ["Açma ve kapatma.", "Yapay zekâ firma için probata yönetimi tarafından açılır ve kapatılır."],
  ["Değişiklik.", "Bu madde değişirse S.A.Y bir sonraki açılışta yeniden kabul ister."],
];

