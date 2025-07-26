import { Mic, Mouse, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center py-6 md:py-16 w-full bg-[#1C1C1C] text-white overflow-hidden">
      <Image
        src="/john-al-shiekh-mustache.svg"
        alt="Background pattern"
        className="object-contain opacity-2 mx-auto w-full"
        fill
        priority
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Image
          src="/john-al-shiekh-character.png"
          alt="John Al-Sheikh character"
          width={380}
          height={380}
          priority
          className="object-contain mx-auto z-10 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96"
          draggable={false}
        />
        <div className="relative z-10 text-center max-w-4xl px-4 space-y-8 pt-20 pb-2">
          <h1 className="md:text-5xl text-3xl font-bold leading-loose">
            تحدث الإنجليزية بثقة
            <br />
            مع جون آل-شيخ
          </h1>

          <p className="md:text-xl text-sm text-gray-300 text-balance">
            مدرّبك العربي من لندن يساعدك على كسر حاجز الخوف من المحادثة الإنجليزية
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link href="#quick-speaking">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg rounded-full"
              >
                <Mic className="mr-2 size-5" />
                ابدأ محادثتك الأولى مجاناً
              </Button>
            </Link>

            <Link href="#how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-2 border-white hover:bg-white/10 hover:text-white px-8 py-6 text-lg rounded-full"
              >
                <PlayCircle className="ml-2 size-5" />
                شاهد كيف يعمل
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Link href="#why" className="flex items-center justify-center pt-10">
        <Mouse className="size-7 stroke-1 opacity-75 animate-bounce" />
      </Link>
    </section>
  );
}
