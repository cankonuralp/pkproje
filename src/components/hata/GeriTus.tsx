"use client";
/* Geri dön: geçmiş varsa bir önceki sayfa, yoksa Ana sayfa (maket MK.eylem.geri) */
import { useRouter } from "next/navigation";
import { Tus } from "../tus/Tus";

export function GeriTus() {
  const router = useRouter();
  return <Tus tur="ikincil" ikon="arrow-left" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}>Geri dön</Tus>;
}
