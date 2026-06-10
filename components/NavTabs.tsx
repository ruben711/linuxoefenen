"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/oefeningen", label: "Oefeningen" },
  { href: "/cheatsheet", label: "Cheat-sheet" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/theorie", label: "Theorie" },
  { href: "/examen", label: "Examen" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function NavTabs() {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-0.5" role="tablist">
      {tabs.map((t) => {
        const active = path === t.href || (t.href !== "/" && path?.startsWith(t.href));
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`nav-tab ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {t.label}
            {active && (
              <motion.span
                layoutId="nav-underline"
                className="nav-underline"
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
