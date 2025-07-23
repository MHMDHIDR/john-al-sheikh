import Image from "next/image";
import { env } from "@/env";
import { Card } from "../ui/card";

export default function How() {
  return (
    <section className="relative p-1.5 md:p-10 scroll-mt-20" id="how-it-works">
      <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2">
        <Card className="max-h-96 min-h-56 h-76 shadow-sm bg-blue-100 rounded-lg">
          <Image
            src="/john-al-shiekh-mustache.svg"
            alt="Background pattern"
            className="object-contain opacity-40"
            priority
            fill
          />
        </Card>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="relative z-10 space-y-6 text-right px-8">
          <h2 className="text-5xl font-black">كيف يعمل {env.NEXT_PUBLIC_APP_NAME}؟</h2>
          <p className="text-xl text-gray-600">
            ثلاث خطوات بسيطة لبدء رحلتك في إتقان المحادثة الإنجليزية
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[380px] z-20">
          <div className="relative w-full">
            <Image
              src="/iphone.svg"
              alt="iPhone mockup"
              width={280}
              height={350}
              className="w-full h-auto z-100"
              priority
            />
            <div className="absolute top-[3%] left-[6%] right-[6%] bottom-[3%] rounded-[38px] overflow-clip">
              <video
                src="/how.mp4"
                className="min-w-full min-h-full object-cover"
                autoPlay
                loop
                playsInline
                muted
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
