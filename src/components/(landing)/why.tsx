import { MapPin } from "lucide-react";
import { Card } from "../ui/card";

interface FeatureCardProps {
  title: string;
  description: string;
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-3xl p-8 text-center space-y-4">
      <div className="mx-auto w-16 h-16 bg-[#1C1C1C] rounded-full flex items-center justify-center">
        <MapPin className="text-white size-8" />
      </div>
      <h3 className="text-2xl font-bold text-[#1C1C1C]" style={{ direction: "rtl" }}>
        {title}
      </h3>
      <p className="text-gray-600 text-lg leading-relaxed" style={{ direction: "rtl" }}>
        {description}
      </p>
    </div>
  );
}

export default function Why() {
  return (
    <section className="p-1.5 md:p-10">
      <Card className="p-6 shadow-sm bg-purple-200 rounded-lg">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold text-[#1C1C1C]" style={{ direction: "rtl" }}>
            لماذا جون آل-شيخ؟
          </h2>
          <p className="text-xl text-gray-600" style={{ direction: "rtl" }}>
            الخيار الأفضل للعرب الذين يريدون إتقان المحادثة الإنجليزية بطريقة عملية وفعالة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            title="مدرب عربي أصيل من لندن"
            description="يفهم تحدياتك الثقافية واللغوية ويتحدث معك بلهجة بريطانية أصيلة"
          />
          <FeatureCard
            title="مدرب عربي أصيل من لندن"
            description="يفهم تحدياتك الثقافية واللغوية ويتحدث معك بلهجة بريطانية أصيلة"
          />
          <FeatureCard
            title="مدرب عربي أصيل من لندن"
            description="يفهم تحدياتك الثقافية واللغوية ويتحدث معك بلهجة بريطانية أصيلة"
          />
        </div>
      </Card>
    </section>
  );
}
