# Probata — logo dosyaları

## Klasörler
- `svg/` — vektör; her boyutta net. Site, baskı ve marka tescili için bunları kullan.
- `png/` — şeffaf zeminli yüksek çözünürlük; sunum, Word, e-posta imzası.
- `ikon/` — site ve uygulama ikonları.

Her logo dört renkte: `renkli` (açık zemin) · `koyu-zemin` (beyaz + yeşil) · `siyah` (tek renk) · `beyaz` (tek renk, yalnız svg).
Yerleşimler: `isaret` (yalnız P) · `yatay` · `yatay-sloganli` · `dikey` (sloganlı).

## Nerede hangisi
| Yer | Dosya |
|---|---|
| Site üst çubuğu | `svg/probata-yatay-renkli.svg` (koyu zeminde `-koyu-zemin`) |
| Rapor PDF üst bilgisi | `svg/probata-yatay-sloganli-renkli.svg` |
| Tek renk baskı, kaşe | `-siyah` / `-beyaz` |
| Tarayıcı sekmesi | `ikon/favicon.ico`, `svg/favicon.svg` |
| iPhone ana ekran | `ikon/apple-touch-icon.png` (180 px) |
| PWA / Android | `ikon/icon-192.png`, `ikon/icon-512.png`, `ikon/icon-512-maskable.png` (purpose: maskable) |

Next.js'te: `favicon.ico` → `src/app/favicon.ico`, `favicon.svg` → `src/app/icon.svg`, `apple-touch-icon.png` → `src/app/apple-icon.png`.

## Renkler
| Ad | HEX | RGB |
|---|---|---|
| Petrol | #0F2A3D | 15, 42, 61 |
| Onay yeşili | #1FA37A | 31, 163, 122 |
| Kâğıt (zemin) | #F5F3EE | 245, 243, 238 |
| Slogan grisi | #4E5F6C | 78, 95, 108 |

## Yazı tipi
Logo: **Sora SemiBold**, slogan: **Sora Medium**. Logo dosyalarında yazılar eğriye çevrildi; açmak için font kurmak gerekmez.
Sora, SIL Open Font License 1.1 ile ücretsiz kullanılabilir.

## Kullanım
- Koruma alanı: logonun her yanında en az işaret yüksekliğinin ¼'ü kadar boşluk bırak.
- En küçük boyut: yatay logo ekranda 120 px, baskıda 30 mm genişliğin altına inmez; daha küçük yerlerde yalnız işaret ya da favicon kullan.
- Renkleri değiştirme, logoyu esnetme, gölge veya efekt ekleme.
