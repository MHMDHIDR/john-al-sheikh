import Image from "next/image";
import { Card } from "@/components/ui/card";
import { env } from "@/env";

export default function How() {
  return (
    <section className="relative p-1.5 md:p-10 scroll-mt-20 max-sm:mt-10" id="how-it-works">
      <div className="absolute hidden md:block left-10 right-10 top-1/2 -translate-y-1/2">
        <Card className="relative max-h-96 min-h-56 h-76 shadow-sm bg-blue-100 rounded-lg">
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
        <div className="relative z-10 space-y-6 text-center md:text-right px-8">
          <h2 className="md:text-5xl text-4xl text-pretty font-black">
            كيف يعمل {env.NEXT_PUBLIC_APP_NAME}؟
          </h2>
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

            <div className="relative z-20 aspect-[380/780]">
              <Image
                src="/iphone.svg"
                alt="iPhone mockup"
                fill
                sizes="(max-width: 380px) 100vw, 380px"
                loading="lazy"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
