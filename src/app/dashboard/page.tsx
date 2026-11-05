import type { Metadata } from "next";
import { DashboardApp } from "@/components/dashboard/DashboardApp";

export const metadata: Metadata = {
  title: "Dashboard | Neuvara",
  description: "Explore Neuvara's research-stage platform for rare disease prediction from MRI.",
  robots: { index: false, follow: false }
};

export default function DashboardPage() {
  return <DashboardApp />;
}
