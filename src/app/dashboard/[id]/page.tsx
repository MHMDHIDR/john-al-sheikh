import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/server";
import TestDetails from "./test-details";

export default async function TestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const test = await api.users.getTestById({ testId: id });

  let recordingUrl: string | null = null;
  if (test?.callId) {
    try {
      const vapiResult = await api.vapi.getRecordingUrl({ callId: test.callId });
      recordingUrl = vapiResult?.recordingUrl || null;
    } catch {
      recordingUrl = null;
    }
  }

  return !test ? (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>لم يتم العثور على الاختبار</CardTitle>
          <CardDescription>
            لم نتمكن من العثور على الاختبار المطلوب. قد يكون غير موجود أو ليس لديك صلاحية الوصول
            إليه.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button className="w-full">العودة إلى لوحة المعلومات</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  ) : (
    <TestDetails details={test} recordingUrl={recordingUrl} />
  );
}
