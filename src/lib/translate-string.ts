import { env } from "@/env";

/**
 * A function to replace the string with the arabic string
 * @param string the string to be replaced
 * @returns the replaced string
 * */
export const translateSring = (string: string) => {
  switch (string) {
    case "results": {
      return "صفحة نتائج اختبار المحادثة السريع";
    }
    case "mock-test": {
      return "اختبار المحادثة التجريبي";
    }
    case "general-english": {
      return `المحادثة مع ${env.NEXT_PUBLIC_APP_NAME}`;
    }
    case "account": {
      return "الحساب";
    }
    case "onboarding": {
      return "تكملة بيانات المستخدم";
    }
    case "buy-minutes": {
      return "شراء رصيد دقائق";
    }
    case "dashboard": {
      return "لوحة المعلومات";
    }
    case "card": {
      return "بطاقة";
    }
    case "pending": {
      return "معلق";
    }
    case "available": {
      return "متاح";
    }

    default: {
      return string;
    }
  }
};
