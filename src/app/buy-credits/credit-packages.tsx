"use client";

import clsx from "clsx";
import { Check, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { creditsLabel } from "@/lib/credits-label";
import { formatPrice } from "@/lib/format-price";
import { creditPackages } from "@/lib/stripe-client";
import type { PackageInfo } from "@/lib/stripe-client";

export default function CreditPackages({
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
      {Object.entries(creditPackages).map(([id, packageInfo]) => (
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
  const { name, description, features, credits, popular } = packageInfo;

  return (
    <Card
      className={clsx(
        "relative flex h-full select-none min-w-xs md:min-w-2xs md:max-w-sm flex-col",
        {
          "border border-green-500/50 shadow-md md:-mx-3 z-10 md:order-none order-first": popular,
          "border border-gray-200 lg:mt-5": !popular,
        },
      )}
    >
      {popular && (
        <div className="absolute left-0 right-0 top-0 flex justify-center">
          <Badge className="px-4 -mt-2 py-1 text-xs font-medium bg-amber-400/90 hover:bg-amber-400/90 text-amber-950 rounded-b-md border-0">
            <Star className="size-4 ml-2" />
            <strong>الأكثر شعبية</strong>
          </Badge>
        </div>
      )}
      <CardHeader className="flex-none pb-1 pt-8 text-center">
        <CardTitle className="text-xl font-medium">
          <h2 className="font-bold">{name}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow px-6 pb-0 pt-2">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold">{formatPrice({ price: credits })}</span>
            <span className="text-gray-500 dark:text-gray-200 text-base ml-1">مرة واحدة</span>
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
          أحصل على <strong>{credits}</strong> {creditsLabel({ credits })}
        </Button>
      </CardFooter>
    </Card>
  );
}
