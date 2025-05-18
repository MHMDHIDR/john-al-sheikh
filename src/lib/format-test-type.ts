import { speakingTestEnum } from "@/server/db/schema";

export type SpeakingTestType = (typeof speakingTestEnum.enumValues)[number];

export function formatTestType(type: SpeakingTestType) {
  switch (type) {
    case "MOCK":
      return "اختبار تجريبي";
    case "PRACTICE":
      return "تدريب محادثة";
    case "OFFICIAL":
      return "اختبار رسمي";
    default:
      return type;
  }
}
