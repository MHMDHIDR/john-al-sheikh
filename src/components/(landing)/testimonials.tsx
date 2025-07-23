"use client";

import Autoplay from "embla-carousel-autoplay";
import { Dot } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";

interface Testimonial {
  quote: string;
  author: string;
  location: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "في شهر واحد فقط تحسن نطقي بشكل واضح. جون يصحح أخطائي بطريقة مشجعة ومفيدة. الآن أشعر بثقة أكبر في العمل.",
    author: "أحمد المالكي",
    location: "الرياض، السعودية",
    avatar: "/john-al-shiekh-character.png",
  },
  {
    quote:
      "طريقة التدريس ممتازة وفعالة. استفدت كثيراً من الدروس وتحسنت مهاراتي في المحادثة بشكل ملحوظ.",
    author: "سارة العتيبي",
    location: "جدة، السعودية",
    avatar: "/john-al-shiekh-character.png",
  },
  {
    quote: "جون معلم رائع وصبور. يشرح بأسلوب سهل وواضح ويساعدني على تجاوز أخطائي بكل احترافية.",
    author: "محمد الشمري",
    location: "الدمام، السعودية",
    avatar: "/john-al-shiekh-character.png",
  },
];

export default function Testimonials() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const plugin = React.useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollTo = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl font-bold">قصص النجاح</h2>
          <p className="text-xl text-gray-600">
            اكتشف كيف ساعد جون آل-شيخ عدد كبير من المتحدثين العرب على تحسين مهارات التحدث
          </p>
        </div>

        <Carousel
          plugins={[plugin.current]}
          className="w-full max-w-4xl mx-auto"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          setApi={setApi}
          opts={{ loop: true, direction: "rtl" }}
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index}>
                <Card className="border-0 shadow-none bg-green-100 rounded-lg">
                  <CardContent className="flex flex-col gap-y-10 py-6">
                    <blockquote className="text-lg leading-relaxed text-gray-800">
                      {`"${testimonial.quote}`}
                    </blockquote>
                    <div className="flex items-center gap-1">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        width={40}
                        height={40}
                        className="rounded-full size-10 object-cover shadow-md"
                        draggable={false}
                      />
                      <div className="font-semibold text-gray-900">{testimonial.author}</div>
                      <Dot />
                      <div className="text-sm text-gray-600">{testimonial.location}</div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="flex justify-center mt-8 gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`size-3 rounded-full transition-colors duration-200 ${
                index === current ? "bg-gray-800 w-6" : "bg-gray-300"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
