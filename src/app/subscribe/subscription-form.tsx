"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { formSchema } from "@/app/schemas/subscription-from";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { FormValues } from "@/app/schemas/subscription-from";

export function SubscriptionForm({ className }: { className?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullname: "",
      email: "",
    },
  });

  const subscribeMutation = api.subscribedEmails.subscribe.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("تم الاشتراك بنجاح!");
      form.reset();

      // Reset form after showing success message
      setTimeout(() => {
        setIsSuccess(false);
        router.replace("/");
      }, 2500);
    },
    onError: error => toast.error(error.message),
  });

  function onSubmit(data: FormValues) {
    subscribeMutation.mutate(data);
  }

  return (
    <div className={cn("w-full max-w-md", className)}>
      {isSuccess ? (
        <div className="p-6 text-center bg-green-50 rounded-lg border border-green-200 duration-300 animate-in fade-in">
          <h3 className="mb-2 text-lg font-medium text-green-800">شكرا لك على الاشتراك!</h3>
          <p className="text-green-700">
            سوف نساعدك على تحقيق أهدافك في المحادثة باللغة الإنجليزية
          </p>
          <p className="mt-2 text-green-700">جاري تحويلك للصفحة الرئيسية...</p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-right">
            <FormField
              control={form.control}
              name="fullname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">الاسم الكامل</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ادخل اسمك الكامل"
                      {...field}
                      className="text-gray-700 border-gray-200"
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ادخل بريدك الإلكتروني"
                      type="email"
                      {...field}
                      className="text-gray-700 border-gray-200"
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="py-6 mt-2 w-full font-medium text-white bg-black transition-all hover:bg-gray-800"
              disabled={subscribeMutation.isPending}
            >
              {subscribeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  جاري الاشتراك...
                </>
              ) : (
                "اشترك"
              )}
            </Button>
          </form>

          <p className="pt-2 text-sm text-gray-500 select-none">
            بالمتابعة، أنت توافق على
            <Link
              href="/terms"
              target="_blank"
              className="inline-flex px-1 text-blue-500 hover:underline"
            >
              شروط الخدمة
            </Link>
            و
            <Link
              href="/privacy"
              target="_blank"
              className="inline-flex px-1 text-blue-500 hover:underline"
            >
              سياسة الخصوصية
            </Link>
          </p>
        </Form>
      )}
    </div>
  );
}
