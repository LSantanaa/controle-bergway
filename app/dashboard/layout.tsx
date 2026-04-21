import { DashboardPrefetcher } from "@/components/dashboard/dashboard-prefetcher";
import { DashboardProvider } from "@/components/providers/dashboard-provider";
import { MobileMenu } from "@/components/shell/mobile-menu";
import { signOutAction } from "@/app/actions/auth";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { requireActiveProfile } from "@/lib/auth";
import { formatRole } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireActiveProfile();

  return (
    <DashboardProvider hasSupabaseAdminEnv={hasSupabaseAdminEnv} profile={profile}>
      <DashboardPrefetcher />

      <MobileMenu profile={profile} onSignOut={signOutAction} />

      <div className="dashboard-shell">
        <aside className="sidebar">
          <div className="stack">
            <div>
              <div className="brand-kicker">Controle de Equipamentos</div>
              <h2 style={{ margin: "10px 0 0", fontSize: "2rem" }}>{new Date().getFullYear()}</h2>
              <p className="muted" style={{ color: "rgba(255, 249, 240, 0.72)" }}>
                Cervejaria Bergway
              </p>
            </div>

            <div className="sidebar-user">
              <strong>{profile.full_name}</strong>
              <span className="muted" style={{ color: "rgba(255, 249, 240, 0.72)" }}>
                {profile.email}
              </span>
              <div style={{ marginTop: 10 }}>
                <span className="badge badge-warning">{formatRole(profile.role)}</span>
              </div>
            </div>
          </div>

          <SidebarNav profile={profile} />

          <form action={signOutAction}>
            <button className="button-secondary" type="submit">
              Sair
            </button>
          </form>
        </aside>

        <main className="content">{children}</main>
      </div>
    </DashboardProvider>
  );
}
