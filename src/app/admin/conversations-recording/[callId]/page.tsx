import { ArrowLeft, Calendar, Headphones, MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AudioPlayer from "@/components/custom/audio-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/format-date";
import { api } from "@/trpc/server";

type CallIDRecordingProps = {
  params: Promise<{ callId: string }>;
};

export default async function CallIDRecording({ params }: CallIDRecordingProps) {
  const { callId } = await params;

  try {
    // Fetch recording data and URL
    const [recordingData, recordingUrl] = await Promise.all([
      api.vapi.getRecordingById({ callId }),
      api.vapi.getRecordingUrl({ callId }),
    ]);

    const user = recordingData?.user;
    const displayName = user?.displayName ?? user?.name;

    return (
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/conversations-recording">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تسجيل المحادثة</h1>
            <p className="text-muted-foreground">استماع إلى تسجيل المحادثة</p>
          </div>
        </div>

        {/* Recording Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              معلومات التسجيل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">المستخدم</p>
                  <p className="text-sm text-muted-foreground">{displayName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">تاريخ التسجيل</p>
                  <p className="text-sm text-muted-foreground">
                    {recordingData?.createdAt
                      ? formatDate(recordingData.createdAt.toString(), true)
                      : "غير متوفر"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">موضوع المحادثة</p>
                  <p className="text-sm text-muted-foreground">{recordingData?.topic}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={recordingData?.type === "MOCK" ? "secondary" : "default"}>
                  {recordingData?.type === "MOCK"
                    ? "اختبار تجريبي"
                    : recordingData?.type === "PRACTICE"
                      ? "تدريب"
                      : "اختبار رسمي"}
                </Badge>
                <span className="text-xs text-muted-foreground">نوع الاختبار</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio Player */}
        <Suspense
          fallback={
            <Card className="w-full max-w-2xl mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="ml-2">جاري تحميل التسجيل...</span>
                </div>
              </CardContent>
            </Card>
          }
        >
          <AudioPlayer
            audioUrl={recordingUrl.recordingUrl}
            title={`تسجيل محادثة - ${displayName}`}
            subtitle={recordingData?.topic}
          />
        </Suspense>

        {/* Summary Section */}
        {recordingUrl.summary && (
          <Card>
            <CardHeader>
              <CardTitle>ملخص المحادثة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed ltr text-justify">{recordingUrl.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Transcript Section */}
        {recordingData?.transcription && (
          <Card>
            <CardHeader>
              <CardTitle>نص المحادثة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recordingData?.transcription.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2.5 rounded-lg flex gap-3 ${
                      message.role === "examiner"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-green-100 text-green-900"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <Badge
                        variant={message.role === "user" ? "default" : "secondary"}
                        className="flex-col "
                      >
                        {message.role === "user" ? "المستخدم" : "الممتحن"}
                        <span className="text-xs text-muted-foreground mt-1">
                          {message.timestamp}
                        </span>
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm ltr">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error fetching recording:", error);
    notFound();
  }
}
