import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/env";
import { formatPrice } from "@/lib/format-price";
import { api } from "@/trpc/server";

export default async function DashboardPage() {
  const [
    { count: usersCount },
    { count: subscribersCount },
    { count: testUsersCount },
    { balance: accountBalance },
  ] = await Promise.all([
    api.users.getUsers(),
    api.subscribedEmails.getSubscribers(),
    api.users.getTotalTestUsers(),
    api.payments.getAccountBalance(),
  ]);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-sm select-none text-center font-bold mb-6 border-4 border-double rounded-md w-fit mx-auto p-4 border-blue-200">
        لوحة الإدارة {env.NEXT_PUBLIC_APP_NAME}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <MetricCard title="عدد المستخدمين" hrefLabel="عرض المستخدمين">
          {usersCount}
        </MetricCard>

        <MetricCard title="عدد الأشتراكات" href="/admin/subscribers" hrefLabel="عرض الأشتراكات">
          {subscribersCount}
        </MetricCard>

        <MetricCard title="مستخدمي اختبار المحادثة" href="/admin/users" hrefLabel="عرض المستخدمين">
          {testUsersCount}
        </MetricCard>

        {accountBalance.available && (
          <MetricCard title="الربح الحالي" hrefLabel="عرض المستخدمين">
            {accountBalance.available.map((item, index) => (
              <div key={index}>
                <strong>{formatPrice({ price: item.amount })}</strong>
              </div>
            ))}
          </MetricCard>
        )}
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
    <Card className="select-none">
      <CardHeader>
        <CardTitle className="text-center text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="text-5xl text-center font-bold text-green-600">{children}</h3>
        <Link href={href ?? "/admin"}>
          <Button variant={"secondary"} className="w-full font-black border mt-2">
            {hrefLabel}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
