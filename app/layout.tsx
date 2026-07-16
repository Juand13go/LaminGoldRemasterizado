import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { FlashMessages } from "@/components/FlashMessages";

export const metadata: Metadata = {
  title: "LAMIN GOLD",
  description: "Joyeria en oro laminado premium.",
  icons: {
    icon: "/img/favicon.png",
    apple: "/img/favicon.png",
  },
};

// Kept as a plain inline script (not React state) so the saved theme applies before
// hydration, exactly like the legacy base.html — same brief flash-of-light-mode
// tradeoff on first paint, avoided entirely on repeat visits via localStorage.
const THEME_SCRIPT = `(function () {
  const toggleBtn = document.getElementById("themeToggle");

  function setTheme(mode) {
    document.body.classList.toggle("dark", mode === "dark");
    localStorage.setItem("theme", mode);
    if (toggleBtn) {
      toggleBtn.textContent = mode === "dark" ? "☀️" : "🌙";
    }
  }

  const savedTheme = localStorage.getItem("theme") || "light";
  setTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isDark = document.body.classList.contains("dark");
      setTheme(isDark ? "light" : "dark");
    });
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <main>
          <Suspense fallback={null}>
            <FlashMessages />
          </Suspense>
          {children}
        </main>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </body>
    </html>
  );
}
