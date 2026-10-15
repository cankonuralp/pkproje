/* ARAMA YOLU DENETİMİ (FIRMA-VT FV2 incelemesi, 2026-10-15; 0010'un devamı) — tests/yayin.test.ts ve tests/bozan/firma-baglanti.bozan.ts aynı sorguyu
   kullanır. Tanımlayıcı-yetkili (SECURITY DEFINER) işlevin arama yolunda geçici şema (pg_temp) AÇIKÇA ve EN SONDA olmalı: yazılmazsa PostgreSQL tablo
   adlarında geçici şemaya EN ÖNCE bakar — çağıranın (ör. uygulama rolünün) açtığı geçici tablo, işlevin tanımlayıcının yetkisiyle okuduğu / yazdığı
   tabloyu gölgeler (PostgreSQL belgesi: "Writing SECURITY DEFINER Functions Safely"). 0010 yalnız "arama yolu var mı"ya bakıyordu; 0096'nın ilk
   yazımı "public" ile bu gerilemeyi getirmişti. Dönen: kuralı bozan işlevlerin adları (boş = temiz). */
export const GECICI_SEMA_ONDE = `
  SELECT p.proname AS ad FROM pg_proc p JOIN pg_namespace s ON s.oid = p.pronamespace
  WHERE s.nspname = 'public' AND p.prosecdef
    AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%' AND c LIKE '%pg_temp')
  ORDER BY 1`;
