/* ══ TASARIM KALIBININ BU PROJEDEKİ SAYILARI — referans ekran dondu (reisim 2026-09-23: "tüm önerilerin uygun")
   Kaynak: Planlar + plan içi maketinin 5. turu (docs/maket/planlarim.html), ölçümler docs/assets/olcum.json.
   Değiştirmek karar ister: önce bu dosya ve pkproje.md §3.3, sonra kilit (tests/kalip-sayilari.test.ts) ölçümle
   birlikte güncellenir (TASARIM-KALIBI yöntemi: kabul edilen VE reddedilen örnek yazılır). */

export const KALIP = {
  /** denetim yüksekliği (tuş, çip, arama, seçici, menü satırı, form alanı) — kabul: 34/44 · reddedilen: 40/48 (4. tur) */
  tusY: { fare: 34, dokunmatik: 44 },
  /** üç adlandırılmış bant: dar < 768 · orta 768–1279 · geniş ≥ 1280 (reisim 2026-09-23, karar 4) */
  bant: { orta: 768, genis: 1280 },
  /** liste kabı ≥ 960 px tablo, altı kart — tablet bandında ölçüldü (liste 933 · ekipman 891 · rapor 891 px'de bozuluyor);
   *  reddedilen: 1.180 (3. tur, 40 px tuşla) */
  kartEsigi: 960,
  /** sayfa boyu listeye göre — ekipman 10 ("10 taneden sonra diğer sayfaya geçsin"), rapor 20 ("5 değil 20") */
  sayfa: { ekipman: 10, rapor: 20 },
  /** yazı ölçeği px — başlık 20 (telefonda 18) · bölüm 15 · gövde 14 (dokunmatikte 15) · küçük 12,5 · etiket 11,5 */
  yazi: { baslik: 20, baslikTelefon: 18, bolum: 15, govde: 14, govdeDokunmatik: 15, kucuk: 12.5, etiket: 11.5 },
  /** kabuk: yan menü genişliği, daraltılmış simge şeridi (yalnız geniş bant) ve üst çubuk yüksekliği.
   *  cubukDar 64 = 12 + 40 (simge tuşu) + 12 — maket 6. tur, reisim 2026-09-24 "uygun" (1920'de içerik 1.648 → 1.816 px);
   *  reddedilen: sayı değil düğme simgesi (panel simgesi → standart ☰, "standart üç alt alta çizgi görünümü olsun") */
  kabuk: { cubukGenislik: 232, cubukDar: 64, ustYukseklik: 52 },
} as const;
