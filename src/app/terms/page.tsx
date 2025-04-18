import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { env } from "@/env";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 mb-20 max-w-[800px]" dir="rtl">
      <Link
        href="/"
        className="flex items-center justify-start gap-2 text-lg hover:underline underline-offset-6"
      >
        <ArrowRight />
        العودة للرئيسية
      </Link>

      <h1 className="text-center text-2xl font-bold my-6">الشروط والأحكام</h1>

      <p className="mb-2">
        مرحبًا بك في <strong>{env.NEXT_PUBLIC_APP_NAME}</strong>! باستخدام خدمتنا، فإنك توافق على
        هذه الشروط والأحكام. يرجى قراءتها بعناية.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">١. استخدام الخدمة</h2>
      <p className="mb-2">
        تسمح لك خدمتنا بتسجيل الصوت ونسخه وتحويله إلى أحداث قابلة للتنفيذ. يُحظر تمامًا أي سوء
        استخدام للخدمة في الأنشطة غير القانونية.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">٢. حقوق الطبع والنشر</h2>
      <p className="mb-2">
        أنت تمتلك المحتوى الذي تنشئه باستخدام خدمتنا. ومع ذلك، باستخدام خدمتنا، فإنك تمنحنا ترخيصًا
        لاستخدام وتعديل وعرض المحتوى حسب الحاجة لتقديم الخدمة.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">٣. مسؤوليات المستخدم</h2>
      <p className="mb-2">
        أنت مسؤول عن المحتوى الذي تنشئه، بما في ذلك قانونيته ودقته. أنت توافق على عدم استخدام الخدمة
        لأي أغراض غير قانونية.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">٤. إخلاء المسؤولية</h2>
      <p className="mb-2">
        يتم تقديم خدمتنا "كما هي" دون أي ضمانات. نحن لسنا مسؤولين عن أي أضرار أو خسائر ناتجة عن
        استخدامك للخدمة.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">٥. الخصوصية</h2>
      <p className="mb-2">
        خصوصيتك مهمة بالنسبة لنا. يرجى مراجعة سياسة الخصوصية الخاصة بنا لفهم كيفية جمع واستخدام
        ومشاركة معلوماتك.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">٦. الإنهاء</h2>
      <p className="mb-2">
        يمكننا إنهاء أو تعليق وصولك إلى خدمتنا في أي وقت، دون إشعار مسبق أو مسؤولية، لأي سبب.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">٧. التغييرات في الشروط</h2>
      <p className="mb-2">
        نحتفظ بالحق في تعديل هذه الشروط في أي وقت. من خلال الاستمرار في استخدام الخدمة بعد إجراء
        التغييرات، فإنك توافق على الالتزام بالشروط المعدلة.
      </p>

      <p className="mt-4">
        إذا كانت لديك أي أسئلة حول هذه الشروط، يرجى الاتصال بنا على mr.hamood277@gmail.com.
      </p>
    </div>
  );
}
