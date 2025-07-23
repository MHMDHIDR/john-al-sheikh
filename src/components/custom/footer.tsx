import { Dot } from "lucide-react";
import Link from "next/link";
import { env } from "@/env";
import { Logo } from "./icons";

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="hidden md:flex items-center select-none gap-x-2 text-xl font-bold text-primary"
        >
          <Logo className="mx-auto size-5 stroke-1 stroke-current" />
          <span className="text-sm sm:inline-flex">{env.NEXT_PUBLIC_APP_NAME}</span>
        </Link>

        <div className="flex max-sm:flex-1 justify-center items-center gap-1 text-sm text-gray-600">
          <Link href="/privacy" className="hover:text-gray-900 transition-colors">
            الخصوصية
          </Link>
          <Dot className="text-gray-400" />
          <Link href="/terms" className="hover:text-gray-900 transition-colors">
            الشروط والأحكام
          </Link>
          <Dot className="text-gray-400" />
          <Link href="/contact" className="hover:text-gray-900 transition-colors">
            تواصل معنا
          </Link>
        </div>
      </div>
    </footer>
  );
}
