import { Suspense } from "react";
import NewsletterAnalytics from "@/components/custom/newsletter-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/server";
import { EmailEditor } from "./email-editor";

async function EmailList() {
  const { subscribers } = await api.subscribedEmails.getSubscribers();

  // Convert combined subscribers to email list format
  const emailList = subscribers.map(sub => ({
    email: sub.email,
    name: sub.name,
  }));

  // const testingEmailList = [
  //   {
  //     email: "mr.hamood277@gmail.com",
  //     name: "محمد حيدر",
  //   },
  // ];

  return <EmailEditor emailList={emailList} />;
}

export default function ComposeNewsletterPage() {
  return (
    <div className="container mx-auto py-8">
      <NewsletterAnalytics />
      <Card>
        <CardHeader>
          <CardTitle className="select-none text-center font-bold">
            إنشاء نشرة بريدية جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            }
          >
            <EmailList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
