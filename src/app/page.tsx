import type { ReactNode } from "react";
import { Dashboard } from "@/components/dashboard";
import { getDashboardData } from "@/lib/database";
import type { DashboardData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function HomePage(): ReactNode {
  const initialData: DashboardData = getDashboardData();
  const dateline: string = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date());
  return <Dashboard initialData={initialData} dateline={dateline} />;
}
