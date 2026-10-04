-- ══ 0009 · UYGULAMA ROLÜNÜN SÜRE SINIRLARI ═══════════════════════════════════════════════════════════════════════════════════════
-- 2026-10-04 yayın denetimi: yayında uygulama Supabase havuzlayıcısına İŞLEM kipinde bağlanır; orada oturum düzeyinde SET kullanılamaz,
-- sınırlar rolün kendisine yazılır (havuzlayıcı arka uç bağlantısını bu rolle açar, ayar orada geçerli olur). Takılan bir sorgu ya da
-- yarıda kalmış bir işlem bağlantıyı ve satır kilitlerini sonsuza dek tutmasın: tek sorgu en çok 15 sn, işlem içinde boşta bekleme en çok 30 sn.
-- ⛔ Her göç IDEMPOTENT (aynı değeri yeniden yazmak bir şey değiştirmez).
ALTER ROLE probata_uygulama SET statement_timeout = '15s';
ALTER ROLE probata_uygulama SET idle_in_transaction_session_timeout = '30s';
