import { env } from "@/env";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `تواصل معنا | ${env.NEXT_PUBLIC_APP_NAME}`,
  description: env.NEXT_PUBLIC_APP_DESCRIPTION,
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
