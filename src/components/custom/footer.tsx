import { IconBrandLinkedin } from "@tabler/icons-react";
import { Dot } from "lucide-react";
import Link from "next/link";
import { env } from "@/env";
import { Logo } from "./icons";

export default function Footer() {
  return (
    <footer className="border-t w-full">
      <div className="container mx-auto px-4 max-sm:py-2 h-16 flex max-sm:flex-col items-center justify-between">
        <Link
          href="/"
          className="hidden md:flex items-center select-none gap-x-2 text-xl font-bold text-primary"
        >
          <Logo className="mx-auto size-5 stroke-1 stroke-current" />
          <span className="text-sm sm:inline-flex">{env.NEXT_PUBLIC_APP_NAME}</span>
        </Link>

        <div className="flex max-sm:grid max-sm:grid-cols-2 max-sm:pb-5 max-sm:flex-1 justify-center items-center gap-2 text-sm text-gray-600 max-sm:order-1">
          <Link href="/privacy" className="hover:text-gray-900 transition-colors">
            الخصوصية
          </Link>
          <Dot className="text-gray-400 max-sm:hidden" />
          <Link href="/terms" className="hover:text-gray-900 transition-colors">
            الشروط والأحكام
          </Link>
          <Dot className="text-gray-400 max-sm:hidden" />
          <Link href="/contact" className="hover:text-gray-900 transition-colors">
            تواصل معنا
          </Link>
          <Dot className="text-gray-400 max-sm:hidden" />
          <Link href="/articles" className="hover:text-gray-900 transition-colors">
            النشرة البريدية
          </Link>
        </div>

        <Link
          href="https://www.linkedin.com/company/john-al-shiekh"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 py-2 hover:text-gray-900 transition-colors"
          aria-label="Visit our LinkedIn page"
        >
          <IconBrandLinkedin size={26} stroke={1} />
        </Link>
      </div>
    </footer>
  );
}
