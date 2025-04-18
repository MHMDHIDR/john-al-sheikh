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
    default: {
      return string;
    }
  }
};
