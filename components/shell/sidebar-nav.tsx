"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Profile } from "@/lib/types";

type SidebarNavProps = {
  profile: Profile;
};

const links = [
  { href: "/dashboard", label: "Visão geral", adminOnly: false },
  { href: "/dashboard/movimentacoes", label: "Movimentações", adminOnly: false },
  { href: "/dashboard/historico", label: "Histórico", adminOnly: false },
  { href: "/dashboard/barris", label: "Barris", adminOnly: false },
  { href: "/dashboard/clientes", label: "Clientes", adminOnly: false },
  { href: "/dashboard/usuarios", label: "Usuários", adminOnly: true },
];

export function SidebarNav({ profile }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav">
      {links
        .filter((item) => !item.adminOnly || profile.role === "admin")
        .map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"}
            >
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
