import Image from "next/image";
import { Card } from "@/components/ui/card";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="bg-white rounded-3xl p-8 text-center space-y-4">
      <div className="mx-auto size-16 rounded-full flex items-center justify-center">
        <Image src={icon} alt={title} width={64} height={64} />
      </div>
      <h3 className="text-2xl font-bold text-[#1C1C1C]">{title}</h3>
      <p className="text-gray-600 text-lg leading-relaxed text-pretty">{description}</p>
    </Card>
  );
}

export default function Why() {
  return (
    <section className="p-1.5 md:p-10">
      <Card className="p-6 shadow-sm bg-purple-200 rounded-lg">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold text-[#1C1C1C]">لماذا جون آل-شيخ؟</h2>
          <p className="text-xl text-gray-600">
            الخيار الأفضل للعرب الذين يريدون إتقان المحادثة الإنجليزية بطريقة عملية وفعالة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon="/london.png"
            title="مدرب عربي أصيل من لندن"
            description="مدرب متخصص نشأ وترعرع في لندن، يجمع بين فهم عميق للثقافة العربية وإتقان اللهجة البريطانية الأصيلة. يساعدك على التواصل بثقة مع بالنطق البرطاني وويفهم التحديات الفريدة التي تواجه المتعلمين العرب"
          />
          <FeatureCard
            icon="/help.png"
            title="دعم فوري ومخصص"
            description="احصل على مساعدة مباشرة ولحظية في تصحيح الأخطاء وتحسين النطق. نظام تفاعلي ذكي يتكيف مع مستواك ويقدم الدعم المناسب في الوقت المناسب، مع التركيز على نقاط ضعفك الشخصية"
          />
          <FeatureCard
            icon="/suggest.png"
            title="اقتراحات ذكية ومتطورة"
            description="تحليل دقيق لأدائك مع اقتراحات عملية لتطوير مهاراتك في المحادثة والنطق. يقدم خطة تعلم مشخصة تتطور معك، مع تمارين مستهدفة لتحسين طلاقتك وثقتك في التحدث باللغة الإنجليزية"
          />
        </div>
      </Card>
    </section>
  );
}
