"use client";

import clsx from "clsx";
import { Mic, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { env } from "@/env";

export default function StickyCtaBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      setIsVisible(scrollY > windowHeight * 0.8);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isHidden) return null;

  return (
    <div
      className={clsx(
        "fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200 p-4 md:hidden transition-all duration-300",
        isVisible && "translate-y-0",
        !isVisible && "translate-y-full",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="font-arabic text-sm font-medium text-primary">ابدأ محادثتك الأولى مجاناً</p>
          <p className="font-arabic text-xs text-muted-foreground">
            مع {env.NEXT_PUBLIC_APP_NAME} الآن
          </p>
        </div>

        <Link href="#quick-speaking">
          <Button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl">
            <Mic className="mr-2 size-4" />
            ابدأ الآن
          </Button>
        </Link>

        <Button
          className="text-muted-foreground hover:text-foreground p-1"
          variant={"ghost"}
          onClick={() => setIsHidden(true)}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
