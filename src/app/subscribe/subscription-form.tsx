"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      ieltsGoal: 5,
    },
  });

  const subscribeMutation = api.subscribedEmails.subscribe.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("تم الاشتراك بنجاح!");

      // Reset form after showing success message
      setTimeout(() => {
        form.reset();
        setIsSuccess(false);
        router.replace("/");
      }, 3000);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  function onSubmit(data: FormValues) {
    subscribeMutation.mutate(data);
  }

  return (
    <div className={cn("w-full max-w-md", className)}>
      {isSuccess ? (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center animate-in fade-in duration-300">
          <h3 className="text-green-800 text-lg font-medium mb-2">شكرا لك على الاشتراك!</h3>
          <p className="text-green-700">سوف نساعدك لتحقيق أهدافك في الايلتس</p>
          <p className="text-green-700 mt-2">جاري تحويلك للصفحة الرئيسية...</p>
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
                      className="bg-white/80 backdrop-blur-sm border-gray-200"
                      // required
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
                      className="bg-white/80 backdrop-blur-sm border-gray-200"
                      // required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ieltsGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">الدرجة المستهدفة</FormLabel>
                  <Select
                    onValueChange={value => {
                      if (value) {
                        field.onChange(parseFloat(value));
                      }
                    }}
                    value={field.value ? field.value.toString() : "5.0"}
                    // required
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-200 cursor-pointer rtl">
                        <SelectValue placeholder="اختر الدرجة المستهدفة">
                          {field.value ? field.value.toString() : "5.0"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 9 }, (_, i) => 5 + i * 0.5).map(band => (
                        <SelectItem
                          key={band}
                          value={band.toFixed(1)}
                          className="cursor-pointer rtl"
                        >
                          {band.toFixed(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white py-6 font-medium mt-2 transition-all"
              disabled={subscribeMutation.isPending}
            >
              {subscribeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الاشتراك...
                </>
              ) : (
                "اشترك"
              )}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
