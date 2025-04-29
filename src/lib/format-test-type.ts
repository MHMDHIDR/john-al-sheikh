export function formatTestType(type: string) {
  switch (type) {
    case "MOCK":
      return "اختبار تجريبي";
    case "PRACTICE":
      return "تدريب";
    case "OFFICIAL":
      return "اختبار رسمي";
    default:
      return type;
  }
}
