"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { Profile } from "@/lib/types";
import { formatRole } from "@/lib/utils";

type MobileMenuProps = {
  profile: Profile;
  onSignOut: () => Promise<void>;
};

const links = [
  { href: "/dashboard", label: "Visão geral", adminOnly: false },
  { href: "/dashboard/movimentacoes", label: "Movimentações", adminOnly: false },
  { href: "/dashboard/historico", label: "Histórico", adminOnly: false },
  { href: "/dashboard/barris", label: "Barris", adminOnly: false },
  { href: "/dashboard/clientes", label: "Clientes", adminOnly: false },
  { href: "/dashboard/usuarios", label: "Usuários", adminOnly: true },
];

export function MobileMenu({ profile, onSignOut }: MobileMenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const visibleLinks = links.filter((item) => !item.adminOnly || profile.role === "admin");

  const handleNavigation = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        className="mobile-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        <span className={`hamburger ${isOpen ? "open" : ""}`}>
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* Menu Dropdown */}
      <nav className={`mobile-menu ${isOpen ? "open" : ""}`}>
        <div className="mobile-menu-header">
          <div>
            <div className="brand-kicker">Controle de Equipmentos</div>
            <h2 style={{ margin: "10px 0 0", fontSize: "1.5rem" }}>
              {new Date().getFullYear()}
            </h2>
            <p className="muted" style={{ color: "rgba(255, 249, 240, 0.72)" }}>
              Cervejaria Bergway
            </p>
          </div>

          <button
            className="mobile-menu-close"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        <div className="mobile-menu-user">
          <strong>{profile.full_name}</strong>
          <span className="muted" style={{ color: "rgba(255, 249, 240, 0.72)" }}>
            {profile.email}
          </span>
          <div style={{ marginTop: 10 }}>
            <span className="badge badge-warning">{formatRole(profile.role)}</span>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsOpen(false);
              await onSignOut();
            }}
            className="sidebar-signout"
          >
            <button className="button-secondary" type="submit">
              Sair
            </button>
          </form>
        </div>

        <div className="mobile-menu-links">
          {visibleLinks.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "mobile-menu-link active" : "mobile-menu-link"}
                onClick={handleNavigation}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

      </nav>
    </>
  );
}
