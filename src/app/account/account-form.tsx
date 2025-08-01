"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconLoader2 } from "@tabler/icons-react";
import { Moon, Sun } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { accountFormSchema } from "@/app/schemas/account";
import { FileUpload } from "@/components/custom/file-upload";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { fallbackUsername } from "@/lib/fallback-username";
import { api } from "@/trpc/react";
import type { AccountFormValues } from "@/app/schemas/account";
import type { Session } from "next-auth";

export function AccountForm({ user }: { user: Session["user"] }) {
  const [files, setFiles] = useState<Array<File>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);

  const toast = useToast();
  const { setTheme } = useTheme();
  const { data: session, update } = useSession();

  const optimizeImageMutation = api.optimizeImage.optimizeImage.useMutation();
  const uploadFilesMutation = api.S3.uploadFiles.useMutation();

  const handleFilesSelected = (selectedFiles: Array<File>) => {
    setFiles(selectedFiles);
  };

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      id: user.id,
      name: user.name ?? "",
      email: user.email ?? "",
      goalBand: user.goalBand ?? 5.0,
      phone: user.phone ?? "",
      theme: user.theme ?? "light",
      image: user.image ?? "",
    },
  });

  const updateUserMutation = api.users.update.useMutation({
    onSuccess: async data => {
      if (data) {
        const updatedValues = {
          id: user.id,
          name: data.name ?? user.name,
          email: user.email ?? "",
          goalBand: data.goalBand ?? form.getValues("goalBand"),
          phone: data.phone ?? "",
          image: data.image ?? "",
          theme: data.theme ?? form.getValues("theme"),
        };

        form.reset(updatedValues);
        setTheme(updatedValues.theme ?? user.theme);

        if (data.image) {
          await update({ user: { ...session?.user, image: data.image, name: data.name } });
        }

        toast.success("تم تحديث الحساب بنجاح!");
        setIsEditingEnabled(false);
      }
    },
    onError: error => {
      toast.error(`فشل تحديث الحساب: ${error.message}`);
    },
    onMutate: () => {
      toast.loading("يتم تحديث الحساب...");
    },
  });

  const optimizAndUploadImage = async (file: File) => {
    if (!file) return null;

    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Optimize image
    const optimizedBase64 = await optimizeImageMutation.mutateAsync({
      base64,
      quality: 70,
    });

    // Prepare file data for S3 upload
    const fileData = [
      {
        name: file.name.replace(/\.[^.]+$/, ".webp"),
        type: "image/webp",
        size: optimizedBase64.length,
        lastModified: file.lastModified,
        base64: optimizedBase64,
      },
    ];

    // Upload to S3
    const uploadedUrls = await uploadFilesMutation.mutateAsync({
      entityId: `user-avatar/${user.id}`,
      fileData,
    });

    return uploadedUrls[0];
  };

  // Handle form submission
  const onSubmit = async (data: AccountFormValues) => {
    setIsUploading(true);
    try {
      let imageUrl = data.image;

      if (files.length > 0 && files[0]) {
        const uploadedUrl = await optimizAndUploadImage(files[0]);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      updateUserMutation.mutate({
        id: user.id,
        name: data.name,
        phone: data.phone,
        goalBand: data.goalBand,
        theme: data.theme,
        image: imageUrl,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ غير معروف");
    } finally {
      setIsUploading(false);
    }
  };

  const currentImage = form.watch("image");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="image"
          render={() => (
            <FormItem>
              <FormLabel>صورة الحساب</FormLabel>
              <FormControl>
                <div className="flex items-center select-none gap-x-6">
                  {currentImage ? (
                    <Image
                      src={
                        files.length > 0 && files[0] ? URL.createObjectURL(files[0]) : currentImage
                      }
                      alt={`Profile Image of ${user.name}`}
                      width={112}
                      height={112}
                      placeholder="blur"
                      blurDataURL={user.blurImageDataURL ?? "/logo.svg"}
                      className="object-contain w-20 h-20 rounded-full shadow-sm"
                      draggable={false}
                    />
                  ) : (
                    <Avatar className="w-20 h-20 rounded-full shadow-sm text-primary">
                      <AvatarFallback className="text-2xl font-bold">
                        {fallbackUsername(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <FileUpload
                    onFilesSelected={handleFilesSelected}
                    disabled={!isEditingEnabled || isUploading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="goalBand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المستوى الذي تطمح للوصول إليه</FormLabel>
              <FormControl>
                <Select
                  onValueChange={value => {
                    field.onChange(value ? parseFloat(value) : 5.0);
                  }}
                  value={field.value?.toString()}
                  disabled={!isEditingEnabled}
                >
                  <SelectTrigger className="rtl cursor-pointer">
                    <SelectValue placeholder="اختر هدفك" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rtl">
                    <SelectGroup>
                      <SelectLabel>اختر هدفك</SelectLabel>
                      {Array.from({ length: 9 }, (_, i) => 5 + i * 0.5).map(band => (
                        <SelectItem key={band} value={band.toFixed(1)} className="cursor-pointer">
                          {band.toFixed(1)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم الكامل</FormLabel>
              <FormControl>
                <Input {...field} disabled={!isEditingEnabled} />
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
              <FormLabel>البريد الإلكتروني</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="disabled:cursor-not-allowed disabled:bg-black/50 dark:disabled:bg-white/20"
                  disabled
                />
              </FormControl>
              <FormDescription>
                <Link href="/contact" className="cursor-pointer hover:underline underline-offset-4">
                  لتغيير البريد الإلكتروني الخاص بك، يرجى التواصل مع الدعم الفني.
                </Link>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="flex flex-col items-start">
              <FormLabel className="text-left">رقم الهاتف</FormLabel>
              <FormControl className="relative w-full">
                <PhoneInput placeholder="رقم الهاتف" {...field} disabled={!isEditingEnabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem className="flex flex-col items-start">
              <FormLabel className="capitalize">
                <div className="flex items-center gap-x-2">
                  {field.value === "dark" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                  {field.value === "dark" ? "الوضع الليلي" : "الوضع النهاري"}
                </div>
              </FormLabel>
              <FormControl className="relative">
                <Switch
                  checked={field.value === "dark"}
                  onCheckedChange={checked => {
                    const theme = checked ? "dark" : "light";
                    form.setValue("theme", theme);
                  }}
                  disabled={!isEditingEnabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditingEnabled ? (
          <Button
            type="button"
            className="cursor-pointer"
            onClick={() => setIsEditingEnabled(true)}
          >
            تعديل
          </Button>
        ) : (
          <div className="space-x-4">
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={updateUserMutation.isPending || isUploading}
            >
              {updateUserMutation.isPending || isUploading ? (
                <>
                  <IconLoader2 className="w-5 h-5 stroke-current animate-spin stroke-1" /> حفظ...
                </>
              ) : (
                "حفظ"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setIsEditingEnabled(false);
                form.reset();
              }}
            >
              إلغاء
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
