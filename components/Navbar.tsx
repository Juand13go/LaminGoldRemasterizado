import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getCartItemCount } from "@/lib/cart";
import { logoutAction } from "@/app/actions/auth";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  const cartCount = await getCartItemCount();

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link className="navbar__brand" href="/">
          <Image
            className="navbar__logo"
            src="/img/nuevo_logolg.png"
            alt="Lamin Gold"
            width={42}
            height={42}
          />
          <div className="navbar__brandtext" />
        </Link>

        <nav className="navbar__links">
          <Link className="navlink" href="/catalogo">
            Catalogo
          </Link>

          {user ? (
            <>
              {role === "admin" && (
                <Link className="navlink" href="/admin">
                  Admin
                </Link>
              )}
              <form action={logoutAction}>
                <button className="navlink" type="submit">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <Link className="navlink" href="/login">
              Login
            </Link>
          )}

          <Link className="cartbtn" href="/carrito" aria-label="Carrito">
            <svg className="cartbtn__icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 7h15l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.6L5 3H2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9.5 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
              <path d="M17.5 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
            </svg>
            {cartCount > 0 && <span className="cartbtn__badge">{cartCount}</span>}
          </Link>

          <button id="themeToggle" className="theme-toggle" title="Modo oscuro / claro" type="button">
            🌙
          </button>
        </nav>
      </div>
    </header>
  );
}
