import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/server";
import { EmailEditor } from "./email-editor";
import type { SubscribedEmail, Users } from "@/server/db/schema";

async function EmailList() {
  const [{ subscribers }, { users }] = await Promise.all([
    api.subscribedEmails.getSubscribers(),
    api.users.getUsers(),
  ]);

  // Combine and deduplicate emails
  const emailMap = new Map<string, { email: string; name: string | null }>();

  // Add subscribed emails
  subscribers.forEach((sub: SubscribedEmail) => {
    emailMap.set(sub.email, { email: sub.email, name: sub.fullname });
  });

  // Add user emails
  users.forEach((user: Users) => {
    if (!emailMap.has(user.email)) {
      emailMap.set(user.email, { email: user.email, name: user.name });
    }
  });

  // const emailList = Array.from(emailMap.values());

  const testimgEmailList = [
    {
      email: "mr.hamood277@gmail.com",
      name: "حمود العتيبي",
    },
    {
      email: "mr.hamood277+1@gmail.com",
      name: "مثال ٢",
    },
    {
      email: "mr.hamood277+2@gmail.com",
      name: "مثال 1",
    },
  ];

  return <EmailEditor emailList={testimgEmailList} />;
}

export default function ComposeNewsletterPage() {
  return (
    <div className="container mx-auto py-8">
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
