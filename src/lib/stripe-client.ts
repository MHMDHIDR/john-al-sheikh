import { env } from "@/env";

export const PriceIDs = {
  fiveCredits: env.NEXT_PUBLIC_STRIPE_PRICE_ID_5,
  fifteenCredits: env.NEXT_PUBLIC_STRIPE_PRICE_ID_15,
  twentyCredits: env.NEXT_PUBLIC_STRIPE_PRICE_ID_20,
};

export const Credits = {
  STARTER: 5,
  PLUS: 15,
  PRO: 20,
};

export type PackageInfo = {
  id: keyof typeof PriceIDs;
  priceId: string;
  name: string;
  description: string;
  credits: number;
  features: string[];
  popular?: boolean;
};

export const creditPackages: Record<keyof typeof PriceIDs, PackageInfo> = {
  fiveCredits: {
    id: "fiveCredits",
    priceId: PriceIDs.fiveCredits,
    name: "Starter",
    description: "مناسب للمبتدئين لتجربة المنصة",
    credits: Credits.STARTER,
    features: [
      "5 محادثات تدريبية محاكاة IELTS",
      "تحليل الأداء بالتفصيل",
      "إحصائيات بمستوى الأداء",
      "وصول مستمر للخدمة",
    ],
  },
  fifteenCredits: {
    id: "fifteenCredits",
    priceId: PriceIDs.fifteenCredits,
    name: "Plus",
    description: "من أكثر الباقات شعبية للمحادثات التدريبية",
    credits: Credits.PLUS,
    features: [
      "15 محادثة تدريبية محاكاة IELTS",
      "تحليل الأداء المتقدم",
      "لوحة التحكم لتتبع الأداء",
      "الأولوية في الدعم",
      "وصول مستمر للخدمة",
    ],
    popular: true,
  },
  twentyCredits: {
    id: "twentyCredits",
    priceId: PriceIDs.twentyCredits,
    name: "Pro",
    description: "تحضير متكامل للنجاح المضمون",
    credits: Credits.PRO,
    features: [
      "20 محادثة تدريبية محاكاة IELTS",
      "تحليل أداء محادثات متقدم",
      "إحصائات تفصيلية لمتابعة الأداء",
      "الأولوية القصوى في الدعم",
      "وصول مستمر للخدمة",
    ],
  },
};
