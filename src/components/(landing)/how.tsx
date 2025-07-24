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
            أربع خطوات بسيطة لبدء رحلتك في إتقان المحادثة الإنجليزية
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[380px]">
          <div className="relative max-w-sm overflow-hidden">
            <div className="absolute z-10 inset-0 overflow-clip">
              <video
                src="/how.mp4"
                className="w-full h-full rounded-[70px] object-cover"
                autoPlay
                loop
                playsInline
                muted
              />
            </div>

            <Image
              src="/iphone.svg"
              alt="iPhone mockup"
              width={380}
              height={780}
              className="relative z-20 w-full h-auto"
              priority
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
