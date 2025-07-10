"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

interface UnsubscribeFormProps {
  token: string;
}

export function UnsubscribeForm({ token }: UnsubscribeFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verify token on component mount
  const {
    data: subscriberData,
    error: tokenError,
    isLoading: isVerifying,
  } = api.subscribedEmails.verifyUnsubscribeToken.useQuery({ token }, { retry: false });

  // Handle token verification error
  useEffect(() => {
    if (tokenError) {
      toast.error(tokenError.message);
      // Redirect to home after showing error
      setTimeout(() => {
        router.replace("/");
      }, 3000);
    }
  }, [tokenError, toast, router]);

  const unsubscribeMutation = api.subscribedEmails.deleteSubscriber.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("تم إلغاء الاشتراك بنجاح!");

      // Redirect to home after showing success message
      setTimeout(() => {
        router.replace("/");
      }, 3000);
    },
    onError: error => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  function handleUnsubscribe() {
    setIsLoading(true);
    unsubscribeMutation.mutate({ token });
  }

  // Show loading while verifying token
  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="size-8 animate-spin text-gray-500" />
        <p className="text-gray-600">جاري التحقق من الرابط...</p>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenError) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center animate-in fade-in duration-300">
        <h3 className="text-red-800 text-lg font-medium mb-2">رابط غير صحيح</h3>
        <p className="text-red-700">رابط إلغاء الاشتراك غير صحيح أو منتهي الصلاحية</p>
        <p className="text-red-700 mt-2">جاري تحويلك للصفحة الرئيسية...</p>
      </div>
    );
  }

  // Show success message
  if (isSuccess) {
    return (
      <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center animate-in fade-in duration-300">
        <h3 className="text-green-800 text-lg font-medium mb-2">تم إلغاء الاشتراك بنجاح!</h3>
        <p className="text-green-700">نأسف لرؤيتك تغادرنا</p>
        <p className="text-green-700 mt-2">يمكنك العودة إلينا في أي وقت وذلك من خلال</p>
        <Link href="/subscribe" className="text-blue-600 font-black hover:underline">
          صفحة الاشتراك
        </Link>
      </div>
    );
  }

  // Show unsubscribe confirmation
  return (
    <div className="w-full max-w-md">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">
            هل أنت متأكد من إلغاء إشتراكك في النشرة البريدية؟
          </h3>
          {subscriberData?.subscriber && (
            <p className="text-sm text-gray-600">
              سيتم إلغاء اشتراك:{" "}
              <span className="font-medium">{subscriberData.subscriber.fullname}</span>
              <br />
              <span className="text-gray-500">({subscriberData.subscriber.email})</span>
            </p>
          )}
        </div>

        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleUnsubscribe}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-6 font-medium transition-all"
            disabled={isLoading || unsubscribeMutation.isPending}
          >
            {isLoading || unsubscribeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري إلغاء الاشتراك...
              </>
            ) : (
              "نعم، ألغِ اشتراكي"
            )}
          </Button>

          <Button
            onClick={() => router.replace("/")}
            variant="outline"
            className="w-full py-6 font-medium"
            disabled={isLoading || unsubscribeMutation.isPending}
          >
            لا، أبقى مشتركاً
          </Button>
        </div>
      </div>
    </div>
  );
}
