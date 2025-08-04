import { env } from "@/env";

export const PriceIDs = {
  fiveMinutes: env.NEXT_PUBLIC_STRIPE_PRICE_ID_5,
  tenMinutes: env.NEXT_PUBLIC_STRIPE_PRICE_ID_10,
  fifteenMinutes: env.NEXT_PUBLIC_STRIPE_PRICE_ID_15,
};

export const Minutes = {
  STARTER: 25,
  PLUS: 50,
  PRO: 75,
};

export type PackageInfo = {
  id: keyof typeof PriceIDs;
  priceId: string;
  name: string;
  description: string;
  minutes: number;
  features: string[];
  popular?: boolean;
};

export const minutePackages: Record<keyof typeof PriceIDs, PackageInfo> = {
  fiveMinutes: {
    id: "fiveMinutes",
    priceId: PriceIDs.fiveMinutes,
    name: "الأساسية",
    description: "مناسب للمبتدئين لتجربة المنصة",
    minutes: Minutes.STARTER,
    features: [
      "أحصل على 25 دقيقة",
      "محادثات تدريبية باللغة الإنجليزية",
      "تحليل الأداء بالتفصيل",
      "إحصائيات بمستوى الأداء",
      "وصول مستمر للخدمة",
    ],
  },
  fifteenMinutes: {
    id: "fifteenMinutes",
    priceId: PriceIDs.fifteenMinutes,
    name: "الإحترافية",
    description: "نحن على ثقة تامة من أنك ستحصل على أفضل النتائج",
    minutes: Minutes.PRO,
    features: [
      "أحصل على 75 دقيقة",
      "محادثات تدريبية باللغة الإنجليزية",
      "تحليل الأداء المتقدم",
      "لوحة التحكم لتتبع الأداء",
      "وصول مستمر للخدمة",
      "الأولوية القصوى في الدعم",
    ],
    popular: true,
  },
  tenMinutes: {
    id: "tenMinutes",
    priceId: PriceIDs.tenMinutes,
    name: "المتقدمة",
    description: "تحضير متكامل للنجاح المضمون",
    minutes: Minutes.PLUS,
    features: [
      "أحصل على 50 دقيقة",
      "محادثات تدريبية باللغة الإنجليزية",
      "إحصائات تفصيلية لمتابعة الأداء",
      "وصول مستمر للخدمة",
      "الأولوية في الدعم",
    ],
  },
};
