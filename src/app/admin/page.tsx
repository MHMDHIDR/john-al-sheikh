import Link from "next/link";
import { AuroraText } from "@/components/magicui/aurora-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/env";
import { api } from "@/trpc/server";

export default async function DashboardPage() {
  const [{ count: usersCount }, { count: subscribersCount }] = await Promise.all([
    api.users.getUsers(),
    api.subscribedEmails.getSubscribers(),
  ]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-sm text-center font-bold mb-6 border-4 border-double rounded-md w-fit mx-auto p-4 border-blue-200">
        لوحة الإدارة {env.NEXT_PUBLIC_APP_NAME}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="عدد المستخدمين" hrefLabel="عرض المستخدمين">
          {usersCount}
        </MetricCard>

        <MetricCard title="عدد الأشتراكات" href="/admin/subscribers" hrefLabel="عرض الأشتراكات">
          {subscribersCount}
        </MetricCard>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  children,
  href = "/admin/users",
  hrefLabel,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  hrefLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="text-4xl text-center font-bold text-green-600">{children}</h3>
        <Link href={href ?? "/admin"}>
          <Button variant={"secondary"} className="w-full font-black border">
            {hrefLabel}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
