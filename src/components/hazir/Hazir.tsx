"use client";
/* SAYFA HAZIR İŞARETİ: React sayfaya bağlanınca (hidrasyon) <html data-hazir>. Uçtan uca testler tam sayfa yüklemesinden sonra buna bakar —
   bağlanmadan önceki tıklama kaybolur (2026-10-04, e2e/hesap.spec). Kullanıcıya görünür etkisi yok. */
import { useEffect } from "react";

export function Hazir() {
  useEffect(() => { document.documentElement.dataset.hazir = "1"; }, []);
  return null;
}
