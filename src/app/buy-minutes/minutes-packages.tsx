"use client";

import clsx from "clsx";
import { Check, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format-price";
import { minutesLabel } from "@/lib/minutes-label";
import { minutePackages, Minutes } from "@/lib/stripe-client";
import type { PackageInfo } from "@/lib/stripe-client";

export default function MinutePackages({
  checkoutSessions,
}: {
  checkoutSessions: Record<string, string>;
}) {
  const router = useRouter();

  const handlePurchase = async (packageId: string) => {
    try {
      const checkoutUrl = checkoutSessions[packageId];

      if (checkoutUrl) {
        router.push(checkoutUrl);
      }
    } catch (error) {
      console.error("Error during checkout redirect:", error);
    }
  };

  return (
    <div className="grid gap-6 lg:gap-0 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
      {Object.entries(minutePackages).map(([id, packageInfo]) => (
        <PackageCard key={id} packageInfo={packageInfo} onPurchase={() => handlePurchase(id)} />
      ))}
    </div>
  );
}

type PackageCardProps = {
  packageInfo: PackageInfo;
  onPurchase: () => void;
};

function PackageCard({ packageInfo, onPurchase }: PackageCardProps) {
  const { name, description, features, minutes, popular } = packageInfo;

  return (
    <Card
      className={clsx(
        "relative flex h-full select-none min-w-xs md:min-w-2xs md:max-w-sm flex-col",
        {
          "border border-green-500/50 shadow-md md:-mx-3 z-10 md:order-none order-first":
            minutes === Minutes.PRO,
          "max-sm:order-2": minutes === Minutes.PLUS,
          "max-sm:order-last": minutes === Minutes.STARTER,
        },
      )}
    >
      {popular && (
        <div className="absolute left-0 right-0 top-0 flex justify-center">
          <Badge className="px-4 -mt-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-b-md border-0 shadow-lg">
            <Star className="size-4 ml-2" />
            <strong>الأفضل قيمة</strong>
          </Badge>
        </div>
      )}
      <CardHeader className="flex-none pb-1 pt-8 text-center">
        <CardTitle className="text-xl font-medium">
          <h2
            className={clsx("font-bold", {
              "text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500":
                minutes === Minutes.PRO,
              "text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600":
                minutes === Minutes.PLUS,
              "text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-gold-800":
                minutes === Minutes.STARTER,
            })}
          >
            {name}
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow px-6 pb-0 pt-2">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold">{formatPrice({ price: minutes / 5 })}</span>
          </div>
          <small className="mt-2 text-xs">{description}</small>
        </div>

        <div className="space-y-3 text-sm">
          {features.map(feature => (
            <div key={feature} className="flex items-center">
              <Check className="text-green-500 dark:text-green-400 bg-green-50/80 dark:bg-green-950/80 size-5 rounded-full p-0.5 ml-2" />
              <span className="text-gray-600 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-none pb-6 pt-4">
        <Button
          size="lg"
          className={clsx("w-full h-12 rounded-md font-medium", {
            "font-bold": popular,
          })}
          variant={popular ? "pressable" : "outline"}
          onClick={onPurchase}
        >
          أحصل على <strong>{minutes}</strong> {minutesLabel({ credits: minutes })}
        </Button>
      </CardFooter>
    </Card>
  );
}
