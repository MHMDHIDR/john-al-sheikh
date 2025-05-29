import Image from "next/image";
import { env } from "@/env";

type EmailPreviewProps = {
  name: string;
  signupUrl: string;
  ctaButtonLabel?: string;
  customContent?: string;
};

export function EmailPreview({
  name,
  signupUrl,
  ctaButtonLabel = "زيارة المنصة",
  customContent,
}: EmailPreviewProps) {
  const year = new Date().getFullYear();

  return (
    <div className="email-preview bg-white rounded-lg shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6 pb-6 border-b">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image
              src="/logo.png"
              width={40}
              height={40}
              alt={env.NEXT_PUBLIC_APP_NAME}
              className="rounded-full"
            />
            <h1 className="text-2xl font-bold">{env.NEXT_PUBLIC_APP_NAME}</h1>
          </div>
          <p className="text-sm text-gray-500">منصتك لتعلم وممارسة المحادثة باللغة الإنجليزية</p>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h2 className="text-xl font-medium mb-4">مرحباً {name}،</h2>

          {customContent ? (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: customContent }}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {ctaButtonLabel
                  ? `مرحباً بك في منصة ${env.NEXT_PUBLIC_APP_NAME} للمحادثة باللغة الإنجليزية! حيث نساعدك على تحقيق أهدافك
                  في اختبار الايلتس والمحادثة الإنجليزية. نحن متحمسون لانضمامك إلينا!`
                  : `شكراً على اشتراكك في النشرة البريدية الخاصة بتعليم المحادثة باللغة الإنجليزية. يسعدنا
                  انضمامك إلى مجتمعنا!`}
              </p>

              <div className="text-center my-8">
                <a
                  href={signupUrl}
                  className="inline-block bg-black text-white px-6 py-3 rounded-md font-bold hover:bg-gray-800 transition-colors"
                >
                  {ctaButtonLabel}
                </a>
              </div>

              {!ctaButtonLabel && (
                <p className="text-gray-700 leading-relaxed">
                  قم بإنشاء حساب للوصول إلى مزيد من الميزات والموارد المخصصة لتعلم الايلتس وتحقيق
                  درجة أعلى.
                </p>
              )}

              <p className="text-gray-700 leading-relaxed">
                نتطلع إلى مساعدتك في تحقيق أهدافك التعليمية!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t text-center text-sm text-gray-500">
          © {year} {env.NEXT_PUBLIC_APP_NAME}. جميع الحقوق محفوظة.
        </div>
      </div>
    </div>
  );
}
