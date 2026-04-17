import { redirect } from "next/navigation";

import { getSessionContext } from "@/lib/auth";

export default async function HomePage() {
  const context = await getSessionContext();

  if (context.profile?.is_active) {
    redirect("/dashboard");
  }

  redirect("/login");
}
