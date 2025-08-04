"use client";

import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconBrandX,
} from "@tabler/icons-react";
import { toPng } from "html-to-image";
import { Check, Copy, Download, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { env } from "@/env";
import { useToast } from "@/hooks/use-toast";
import { formatTestType } from "@/lib/format-test-type";
import { Logo } from "./custom/icons";
import { AuroraText } from "./magicui/aurora-text";
import { Badge } from "./ui/badge";
import Divider from "./ui/divider";
import type { SpeakingTestType } from "@/lib/format-test-type";

interface ShareTestDialogProps {
  testId: string;
  username: string;
  band: number;
  size: "icon" | "default";
  type: SpeakingTestType;
}

export function ShareTestDialog({
  testId,
  username,
  band,
  size = "default",
  type = "MOCK",
}: ShareTestDialogProps) {
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("image");
  const toast = useToast();

  const shareUrl = `${env.NEXT_PUBLIC_APP_URL}/@${username}/english-test-results/${testId}`;

  // Generate snapshot image when dialog opens
  const generateSnapshot = async () => {
    setIsSnapshotLoading(true);
    try {
      const element = document.getElementById("test-snapshot");
      if (!element) return;

      const dataUrl = await toPng(element, { quality: 0.95, pixelRatio: 2 });

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

  // Helper function to share image directly (if available)
  const shareImage = async () => {
    if (!snapshotUrl) {
      toast.error("لم يتم إنشاء الصورة بعد");
      return false;
    }

    try {
      // Convert base64 to blob
      const res = await fetch(snapshotUrl);
      const blob = await res.blob();

      return blob;
    } catch (error) {
      console.error("Error sharing image:", error);
      toast.error("تعذر مشاركة الصورة");
      return false;
    }
  };

  // Share to social media
  const shareToSocial = async (
    platform: "twitter" | "facebook" | "instagram" | "whatsapp" | "linkedin",
  ) => {
    const text = `شاهد نتيجة اختبار اللغة الإنجليزية الخاص بي! حصلت على ${band} في اختبار المحادثة.`;
    const isImageTab = activeTab === "image";

    // For platforms that support direct image sharing via Web Share API
    if (isImageTab && (platform === "whatsapp" || platform === "instagram")) {
      try {
        const imageBlob = await shareImage();
        if (
          imageBlob &&
          navigator.canShare({
            files: [new File([imageBlob], "test-result.png", { type: "image/png" })],
          })
        ) {
          await navigator.share({
            title: `نتيجة ${formatTestType(type)} اللغة الإنجليزية`,
            text: text,
            url: shareUrl,
            files: [new File([imageBlob], "test-result.png", { type: "image/png" })],
          });
          return;
        }
      } catch (error) {
        console.error("Error using Web Share API:", error);
        // Fall back to regular sharing if Web Share API fails
      }
    }

    let shareLink = "";

    switch (platform) {
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        // Facebook doesn't support direct image sharing via URL parameters
        shareLink = `https://www.facebook.com/sharer.php?u=${encodeURI(shareUrl)}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodeURI(text)} - ${encodeURI(shareUrl)}`;
        break;
      case "instagram":
        // Instagram doesn't support direct sharing via URL, so we copy to clipboard
        if (isImageTab && snapshotUrl) {
          downloadSnapshot(); // Download the image first
          void navigator.clipboard.writeText(shareUrl);
          toast.success("تم تحميل الصورة ونسخ الرابط، يمكنك الآن مشاركتهم على انستغرام");
        } else {
          void navigator.clipboard.writeText(shareUrl);
          toast.success("تم نسخ الرابط بنجاح، يمكنك الآن مشاركته على انستغرام");
        }
        return;
      default:
        void navigator.clipboard.writeText(shareUrl);
        toast.success("تم نسخ الرابط بنجاح، يمكنك الآن مشاركته في المنصة التي تريدها");
        return;
    }

    if (shareLink) {
      window.open(shareLink, "_blank");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={size === "icon" ? "ghost" : "pressable"}
          className="font-bold px-12"
          size={size}
        >
          {size === "icon" ? (
            <Share2 className="size-4" />
          ) : (
            <>
              <Share2 className="size-4" />
              مشاركة النتيجة
            </>
          )}
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
          <DialogTitle>مشاركة نتيجة {formatTestType(type)}</DialogTitle>
          <DialogDescription>
            يمكنك مشاركة نتيجة {formatTestType(type)} مع الآخرين عبر وسائل التواصل الاجتماعي
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="image" className="w-full" onValueChange={value => setActiveTab(value)}>
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
                    <Link
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full rounded-md"
                    >
                      <Image
                        src={snapshotUrl}
                        alt={`${username} - ${band} في اختبار المحادثة`}
                        width={500}
                        height={300}
                        className="w-full rounded-md"
                      />
                    </Link>
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
                          🎉 حصلت على {Number(band)} في {formatTestType(type)} اللغة الإنجليزية 🎉
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
                          <strong>john-al-shiekh.live</strong>
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
                  title="مشاركة في فيسبوك"
                >
                  <IconBrandFacebook className="size-4 stroke-white" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-[#000] hover:bg-[#222]"
                  onClick={() => shareToSocial("twitter")}
                  title="مشاركة في تويتر"
                >
                  <IconBrandX className="size-4 stroke-white" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-[#0A66C2] hover:bg-[#004182]"
                  onClick={() => shareToSocial("linkedin")}
                  title="مشاركة في لينكدإن"
                >
                  <IconBrandLinkedin className="size-4 stroke-white" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-[#25D366] hover:bg-[#1da748]"
                  onClick={() => shareToSocial("whatsapp")}
                  title="مشاركة في واتساب"
                >
                  <IconBrandWhatsapp className="size-4 stroke-white" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90"
                  onClick={() => shareToSocial("instagram")}
                  title="مشاركة في انستغرام"
                >
                  <IconBrandInstagram className="size-4 stroke-white" />
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

            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-[#1877F2] hover:bg-[#0e5fc7]"
                onClick={() => shareToSocial("facebook")}
                title="مشاركة في فيسبوك"
              >
                <IconBrandFacebook className="size-4 stroke-white" />
                <span className="text-white">فيسبوك</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-[#0A66C2] hover:bg-[#004182]"
                onClick={() => shareToSocial("linkedin")}
                title="مشاركة في لينكدإن"
              >
                <IconBrandLinkedin className="size-4 stroke-white" />
                <span className="text-white">لينكدإن</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-[#25D366] hover:bg-[#1da748]"
                onClick={() => shareToSocial("whatsapp")}
                title="مشاركة في واتساب"
              >
                <IconBrandWhatsapp className="size-4 stroke-white" />
                <span className="text-white">واتساب</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-[#000] hover:bg-[#222]"
                onClick={() => shareToSocial("twitter")}
                title="مشاركة في تويتر"
              >
                <IconBrandX className="size-4 stroke-white" />
                <span className="text-white">X</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90"
                onClick={() => shareToSocial("instagram")}
                title="مشاركة في انستغرام"
              >
                <IconBrandInstagram className="size-4 stroke-white" />
                <span className="text-white">انستغرام</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
