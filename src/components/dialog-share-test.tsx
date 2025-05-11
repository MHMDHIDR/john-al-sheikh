"use client";

import { toPng } from "html-to-image";
import { Check, Copy, Download, Facebook, Instagram, Share2, Twitter } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { env } from "@/env";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "./custom/icons";
import { AuroraText } from "./magicui/aurora-text";
import { Badge } from "./ui/badge";
import Divider from "./ui/divider";

interface ShareTestDialogProps {
  testId: string;
  username: string;
  band: number;
}

export function ShareTestDialog({ testId, username, band }: ShareTestDialogProps) {
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const toast = useToast();

  const shareUrl = `${env.NEXT_PUBLIC_APP_URL}/@${username}/english-test-results/${testId}`;

  // Generate snapshot image when dialog opens
  const generateSnapshot = async () => {
    setIsSnapshotLoading(true);
    try {
      const element = document.getElementById("test-snapshot");
      if (!element) return;

      const dataUrl = await toPng(element, {
        quality: 0.95,
        pixelRatio: 2,
      });

      setSnapshotUrl(dataUrl);
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("تعذر إنشاء صورة للمشاركة");
    } finally {
      setIsSnapshotLoading(false);
    }
  };

  // Copy the share URL to clipboard
  const copyShareUrl = () => {
    void navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success("تم نسخ رابط مشاركة النتيجة بنجاح");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download the snapshot image
  const downloadSnapshot = () => {
    if (!snapshotUrl) return;

    const link = document.createElement("a");
    link.download = `english-test-result-${testId}.png`;
    link.href = snapshotUrl;
    link.click();
  };

  // Share to social media
  const shareToSocial = (platform: string) => {
    let shareLink = "";
    const text = `شاهد نتيجة اختبار اللغة الإنجليزية الخاص بي! حصلت على ${band} في اختبار المحادثة.`;

    switch (platform) {
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`;
        break;
      case "instagram":
        // Instagram doesn't have a direct sharing URL, so we'll just copy the link
        void navigator.clipboard.writeText(shareUrl);
        toast.success("تم نسخ الرابط بنجاح، يمكنك الآن مشاركته على انستغرام");
        return;
    }

    if (shareLink) {
      window.open(shareLink, "_blank");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="pressable" className="font-bold">
          <Share2 className="size-4" />
          مشاركة النتيجة
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px] md:max-w-[600px]"
        onOpenAutoFocus={event => {
          event.preventDefault();
          setTimeout(() => void generateSnapshot(), 100);
        }}
      >
        <DialogHeader className="text-center! select-none">
          <DialogTitle>مشاركة نتيجة الاختبار</DialogTitle>
          <DialogDescription>
            يمكنك مشاركة نتيجة اختبارك مع الآخرين عبر وسائل التواصل الاجتماعي
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image">مشاركة كصورة</TabsTrigger>
            <TabsTrigger value="link">مشاركة كرابط</TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-4">
            <div className="relative mt-4 border rounded-lg overflow-hidden">
              {isSnapshotLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="p-4">
                  {snapshotUrl ? (
                    <Image
                      src={snapshotUrl}
                      alt={`${username} - ${band} في اختبار المحادثة`}
                      width={500}
                      height={300}
                      className="w-full rounded-md"
                    />
                  ) : (
                    <div
                      id="test-snapshot"
                      className="bg-card p-6 rounded-lg border-2 border-primary"
                    >
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center mb-2">
                          <Badge
                            className="rounded-full size-18 flex-col justify-center text-3xl"
                            variant={band >= 6 ? "success" : "default"}
                          >
                            {Number(band)}
                            <span className="text-xs">Band</span>
                          </Badge>
                        </div>

                        <AuroraText className="text-xl font-bold py-3 whitespace-nowrap">
                          🎉 حصلت على {Number(band)} في اختبار المحادثة 🎉
                        </AuroraText>

                        <p className="text-muted-foreground">@{username}</p>
                      </div>
                      <Divider className="my-2.5" />
                      <div className="text-center">
                        <p className="text-lg mb-4 rtl">
                          شاهد التفاصيل الكاملة والتعليقات على {env.NEXT_PUBLIC_APP_NAME}
                        </p>
                        <p className="text-sm inline-flex items-center gap-2 text-primary font-medium">
                          <Logo className="mx-auto size-7 stroke-1 stroke-current" />
                          {shareUrl}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button onClick={downloadSnapshot} disabled={!snapshotUrl}>
                <Download className="size-4" />
                تحميل الصورة
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-[#1877F2] hover:bg-[#0e5fc7]"
                  onClick={() => shareToSocial("facebook")}
                >
                  <Facebook className="size-4 stroke-white" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-[#1DA1F2] hover:bg-[#0c85d0]"
                  onClick={() => shareToSocial("twitter")}
                >
                  <Twitter className="size-4 stroke-white" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90"
                  onClick={() => shareToSocial("instagram")}
                >
                  <Instagram className="size-4 stroke-white" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 select-none p-3 bg-muted rounded-md text-sm overflow-auto scrollbar-hide">
                {shareUrl}
              </div>
              <Button size="icon" variant="outline" onClick={copyShareUrl}>
                {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-[#1877F2] hover:bg-[#0e5fc7]"
                onClick={() => shareToSocial("facebook")}
              >
                <Facebook className="size-4 stroke-white" />
                <span className="text-white">فيسبوك</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-[#1DA1F2] hover:bg-[#0c85d0]"
                onClick={() => shareToSocial("twitter")}
              >
                <Twitter className="size-4 stroke-white" />
                <span className="text-white">X</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90"
                onClick={() => shareToSocial("instagram")}
              >
                <Instagram className="size-4 stroke-white" />
                <span className="text-white">انستغرام</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
