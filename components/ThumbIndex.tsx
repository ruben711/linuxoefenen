"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Duimregister — de inkepingen aan de boekrand, i.p.v. een navbar. */
const TABS = [
  { href: "/", num: "✦", label: "Index" },
  { href: "/dashboard", num: "I", label: "Logboek" },
  { href: "/oefeningen", num: "II", label: "Practicum" },
  { href: "/cheatsheet", num: "III", label: "Naslag" },
  { href: "/sandbox", num: "IV", label: "Werkbank" },
  { href: "/theorie", num: "V", label: "Kennistoets" },
  { href: "/examen", num: "VI", label: "Veldproef" },
  { href: "/leaderboard", num: "VII", label: "Register" },
];

export default function ThumbIndex() {
  const path = usePathname();
  return (
    <nav className="thumb-index" aria-label="Register van het handboek">
      {TABS.map((t) => {
        const active = t.href === "/" ? path === "/" : path?.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`thumb-tab ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>
            <span className="lbl">{t.label}</span>
            <span className="num">{t.num}</span>
          </Link>
        );
      })}
    </nav>
  );
}
