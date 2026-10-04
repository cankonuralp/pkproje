/* yalnız geliştirme (yayında düzen 404 verir): beklenmeyen hata ekranının denemesi (e2e/hata.spec.ts). İçerdiği iç ayrıntı ekrana çıkmamalı. */
export default function HataDenemesi(): never {
  throw new Error("ic-ayrinti-sizmamali: SELECT * FROM hesap");
}
