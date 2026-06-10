import "../styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import NavTabs from "@/components/NavTabs";
import ThemeToggle from "@/components/ThemeToggle";
import ModeProvider from "@/components/ModeProvider";
import Footer from "@/components/Footer";
import BackgroundField from "@/components/BackgroundField";
import HeaderStats from "@/components/HeaderStats";
import XpToast from "@/components/XpToast";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "BashAcademy — leer Linux door te dóen",
  description:
    "Interactief openboek-leerplatform voor Linux/Bash: een gesimuleerde terminal met virtueel filesystem, XP en oefeningen. 100% veilig in de browser.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#120f17" },
    { media: "(prefers-color-scheme: light)", color: "#faf8f6" },
  ],
};

const themeInitScript = `
(function() {
  try {
    var t = JSON.parse(localStorage.getItem('bashacademy-theme') || '{}').state || {};
    var theme = t.theme || 'system';
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : theme;
    document.documentElement.classList.add(resolved);
  } catch (e) { document.documentElement.classList.add('dark'); }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body>
        <ModeProvider>
          <BackgroundField />
            <div className="min-h-screen flex flex-col">
              <header className="sticky top-0 z-40 glass border-b border-line/80">
                <div className="mx-auto w-full max-w-[1320px] h-14 px-5 sm:px-7 flex items-center gap-4">
                  <Link href="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="BashAcademy home">
                    <span className="relative grid place-items-center w-9 h-9 rounded-xl bg-brand-gradient font-mono text-[14px] font-bold text-on-brand shadow-glow-soft transition-transform duration-300 group-hover:scale-105">
                      <span className="relative z-10">~$</span>
                    </span>
                    <span className="hidden sm:flex flex-col leading-none">
                      <span className="text-[15px] font-bold tracking-tight">Bash<span className="text-gradient">Academy</span></span>
                      <span className="text-[10px] text-fg-dim font-mono mt-0.5">Linux · openboek</span>
                    </span>
                  </Link>
                  <div className="hidden md:flex flex-1 justify-center overflow-x-auto"><NavTabs /></div>
                  <div className="ml-auto md:ml-0 flex items-center gap-2 shrink-0">
                    <HeaderStats />
                    <ThemeToggle />
                  </div>
                </div>
                <div className="md:hidden border-t border-line/70 overflow-x-auto">
                  <div className="px-3 py-1.5"><NavTabs /></div>
                </div>
              </header>
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <XpToast />
        </ModeProvider>
      </body>
    </html>
  );
}
