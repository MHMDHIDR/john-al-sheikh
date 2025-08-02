"use client";

import Link from "next/link";
import { useState } from "react";
import MinutePackages from "@/app/buy-minutes/minutes-packages";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  GENERAL_ENGLISH_CONVERSATION_TIME,
  MINUTES_IN_MS,
  MOCK_TEST_CONVERSATION_TIME,
} from "@/lib/constants";
import { translateSring } from "@/lib/translate-string";
import { api } from "@/trpc/react";

// Convert ms to minutes for comparison
const GENERAL_ENGLISH_REQUIRED_MINUTES = GENERAL_ENGLISH_CONVERSATION_TIME / MINUTES_IN_MS;
const MOCK_TEST_REQUIRED_MINUTES = MOCK_TEST_CONVERSATION_TIME / MINUTES_IN_MS;

type TestType = "general-english" | "mock-test";

interface TestActionWrapperProps {
  children: React.ReactNode;
  testType: TestType;
}

export default function TestActionWrapper({ children, testType }: TestActionWrapperProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Get user's current minutes
  const { data: userMinutes = 0 } = api.payments.getUserMinutes.useQuery();

  // Fetch checkout sessions when drawer opens
  const { data: checkoutSessions = {}, isLoading } = api.payments.getCheckoutSessions.useQuery(
    undefined,
    {
      enabled: isDrawerOpen, // Only fetch when drawer is opened
    },
  );

  // Determine required minutes based on test type
  const requiredMinutes =
    testType === "general-english" ? GENERAL_ENGLISH_REQUIRED_MINUTES : MOCK_TEST_REQUIRED_MINUTES;

  const hasEnoughMinutes = userMinutes >= requiredMinutes;

  // If user doesn't have enough minutes, wrap children in drawer trigger
  return hasEnoughMinutes ? (
    <Link href={`/${testType}`} className="flex w-full">
      {children}
    </Link>
  ) : (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerTrigger asChild onClick={() => setIsDrawerOpen(true)} className="cursor-pointer">
        {children}
      </DrawerTrigger>

      <DrawerContent className="min-w-full">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-xl font-bold tracking-tighter sm:text-2xl">
            تحتاج إلى رصيد {requiredMinutes} دقائق على الأقل للوصول إلى {translateSring(testType)}
          </DrawerTitle>
          <DrawerDescription className="mx-auto max-w-2xl text-gray-500 dark:text-gray-400 md:text-xl text-balance">
            شراء رصيد دقائق للوصول إلى اختبارات المحادثة التدريبية بالتفصيل مع تحديثات وملاحظات عن
            مستواك
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="flex items-center justify-center w-full">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">جاري التحميل...</p>
              </div>
            ) : (
              <MinutePackages checkoutSessions={checkoutSessions} />
            )}
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              إغلاق
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
