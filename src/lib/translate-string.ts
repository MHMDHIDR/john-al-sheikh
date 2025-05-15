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
      return "المحادثة العامة";
    }
    case "account": {
      return "الحساب";
    }
    case "onboarding": {
      return "تكملة بيانات المستخدم";
    }
    case "buy-credits": {
      return "شراء رصيد نقاط";
    }
    case "speaking-test-results": {
      return "نتائج اختبار المحادثة";
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
