/* TUŞ — tek üretici (CLAUDE.md §3; kalıp 1). Tür: birincil · ikincil · tehlike. Kapalı tuş nedenini söyler (aria-describedby,
   §3.8: yapılamayan eylemin sebebi yazılır). Bağlantı olan tuş TusBaglanti (aynı görünüm). */
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Ikon } from "../ikon/Ikon";
import stil from "./Tus.module.css";

export type TusTuru = "birincil" | "ikincil" | "tehlike";

export function tusSinifi(tur: TusTuru = "birincil", ek?: string) {
  return [stil.tus, stil[tur], ek].filter(Boolean).join(" ");
}

export function Tus({ tur = "birincil", ikon, children, className, type = "button", ...ozellik }:
  { tur?: TusTuru; ikon?: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={tusSinifi(tur, className)} {...ozellik}>
      {ikon && <Ikon ad={ikon} kucuk />}
      {children}
    </button>
  );
}

export function TusBaglanti({ tur = "ikincil", ikon, href, children }: { tur?: TusTuru; ikon?: string; href: string; children: ReactNode }) {
  return (
    <Link className={tusSinifi(tur)} href={href}>
      {ikon && <Ikon ad={ikon} kucuk />}
      {children}
    </Link>
  );
}
