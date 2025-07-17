import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";
import { api } from "@/trpc/server";

export default async function NewsletterAnalytics() {
  const analytics = await api.subscribedEmails.getNewsletterAnalytics();

  return (
    <Card className="mb-8 shadow-md border border-muted/40">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-center select-none">
          إحصائيات النشرات البريدية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-around items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-semibold text-primary">
              {analytics.totalNewsletters}
            </span>
            <span className="text-muted-foreground text-sm mt-1">عدد النشرات المُرسلة</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-semibold text-green-600">{analytics.sentCount}</span>
            <span className="text-muted-foreground text-sm mt-1">تم الاستلام (SENT)</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-semibold text-yellow-500">{analytics.pendingCount}</span>
            <span className="text-muted-foreground text-sm mt-1">قيد الإرسال (PENDING)</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-medium">
              {analytics.lastSentCreatedAt
                ? formatDate(analytics.lastSentCreatedAt.toDateString())
                : "—"}
            </span>
            <span className="text-muted-foreground text-sm mt-1">تاريخ آخر نشرة</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
