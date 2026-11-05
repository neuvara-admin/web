import type { Metadata } from "next";
import { LoginPage } from "@/components/auth/LoginPage";

export const metadata: Metadata = {
  title: "Log in | Neuvara",
  description: "Log in to access the Neuvara platform.",
  robots: { index: false, follow: false }
};

export default function LoginRoute() {
  return <LoginPage />;
}
