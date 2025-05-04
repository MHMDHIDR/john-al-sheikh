"use client";

import { Check, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuroraText } from "@/components/magicui/aurora-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { creditsLabel } from "@/lib/credits-label";
import { formatPrice } from "@/lib/format-price";
import { creditPackages } from "@/lib/stripe-client";
import { api } from "@/trpc/react";
import type { PackageInfo } from "@/lib/stripe-client";
import type { CreditPackagePrices, PriceWithCurrency } from "@/lib/types";

export default function CreditPackages({ prices }: { prices: CreditPackagePrices }) {
  const router = useRouter();
  const toast = useToast();

  const { mutateAsync: createCheckoutSession } = api.payments.createCheckoutSession.useMutation({
    onError: error => {
      toast.error(error.message ?? "Failed to create checkout session");
    },
  });

  const handlePurchase = async (packageId: string) => {
    try {
      const { checkoutUrl } = await createCheckoutSession({
        packageId: packageId as keyof typeof creditPackages,
      });

      if (checkoutUrl) {
        router.push(checkoutUrl);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(creditPackages).map(([id, packageInfo]) => (
        <PackageCard
          key={id}
          packageInfo={packageInfo}
          adaptivePrice={prices[id] ?? null}
          onPurchase={() => handlePurchase(id)}
        />
      ))}
    </div>
  );
}

type PackageCardProps = {
  packageInfo: PackageInfo;
  adaptivePrice: PriceWithCurrency | null;
  onPurchase: () => void;
};

function PackageCard({ packageInfo, adaptivePrice, onPurchase }: PackageCardProps) {
  const { name, description, features, credits, popular } = packageInfo;

  // Format the price display
  const priceDisplay = () => {
    if (!adaptivePrice) {
      // Fallback if adaptive price is not available
      return formatPrice(credits);
    }

    // If we have converted currency information, show that
    if (adaptivePrice.converted_currency && adaptivePrice.converted_amount) {
      return formatPrice(
        adaptivePrice.converted_amount / 100, // Convert from cents to base unit
        adaptivePrice.converted_currency === "JPY" ? 0 : 2, // JPY doesn't use decimals
        undefined,
        adaptivePrice.converted_currency,
      );
    }

    // Otherwise show the base price
    return formatPrice(
      adaptivePrice.unit_amount / 100, // Convert from cents to base unit
      adaptivePrice.currency === "JPY" ? 0 : 2, // JPY doesn't use decimals
      undefined,
      adaptivePrice.currency,
    );
  };

  return (
    <Card
      className={`relative flex h-full select-none flex-col ${popular ? "border-green-600 shadow-lg" : ""}`}
    >
      {popular && (
        <Badge className="absolute left-4 top-4 font-black" variant={"success"}>
          الأكثر شعبية
        </Badge>
      )}
      <CardHeader className="flex-none pb-6 pt-6">
        <CardTitle className="flex items-center text-2xl">
          {popular && <Star className="ml-2 size-5 text-primary" />}
          {popular ? <AuroraText className="text-2xl font-black">{name}</AuroraText> : name}
        </CardTitle>
        <CardDescription className="pt-1.5">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4 flex items-baseline">
          <span className="text-3xl font-bold">{priceDisplay()}</span>
          <span className="mx-1 text-sm text-muted-foreground">مرة واحدة</span>
        </div>
        <div className="space-y-3 text-sm">
          {features.map(feature => (
            <div key={feature} className="flex items-start">
              <Check className="ml-2 mt-0.5 h-4 w-4 text-primary" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-none pt-6">
        <Button
          size="lg"
          className="w-full"
          variant={popular ? "default" : "outline"}
          onClick={onPurchase}
        >
          أحصل على <strong>{credits}</strong> {creditsLabel({ credits })}
        </Button>
      </CardFooter>
    </Card>
  );
}
