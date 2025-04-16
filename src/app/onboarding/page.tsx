"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { SelectCountry } from "@/components/custom/select-country";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { MAX_AGE, MIN_AGE } from "@/lib/constants";
import { api } from "@/trpc/react";
import { onboardingSchema } from "../schemas/onboarding";
import type { OnboardingForm } from "../schemas/onboarding";

export default function OnboardingPage() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: session } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();
  const router = useRouter();

  if (!session) {
    redirect("/signin");
  }

  // Move the form declaration before its use in useEffect
  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: session?.user?.name ?? "",
      username: "",
      gender: undefined,
      age: undefined,
      nationality: "",
      phone: "",
      hobbies: [],
    },
  });

  // TRPC API hooks
  const { mutateAsync: optimizeImage } = api.optimizeImage.optimizeImage.useMutation();
  const { mutateAsync: uploadFiles } = api.S3.uploadFiles.useMutation();
  const { mutateAsync: onboardUser } = api.users.onboardUser.useMutation();
  const { data: profileData, isLoading: isProfileLoading } =
    api.users.checkProfileCompletion.useQuery(undefined, { retry: false });

  // Handle profile data when available
  useEffect(() => {
    if (profileData) {
      if (profileData.isComplete) {
        router.replace("/");
        return;
      }

      // Prefill form if data exists
      if (profileData.user) {
        const user = profileData.user;
        form.reset({
          displayName: user.displayName ?? "",
          username: user.username ?? "",
          gender: user.gender as "male" | "female" | undefined,
          age: user.age ?? undefined,
          nationality: user.nationality ?? "",
          phone: user.phone ?? "",
          hobbies: user.hobbies ?? [],
        });

        if (user.image) {
          setProfileImage(user.image);
        }
      }
    }
  }, [profileData, router, form]);

  const isSubmitting = form.formState.isSubmitting;

  const hobbiesList = [
    "القراءة",
    "الطبخ",
    "السفر",
    "التصوير",
    "الرسم",
    "الموسيقى",
    "الرياضة",
    "السباحة",
    "المشي",
    "التخييم",
    "الكتابة",
    "الخياطة",
    "الزراعة",
    "الشطرنج",
    "صيد الأسماك",
    "جمع الطوابع",
    "مشاهدة الأفلام",
    "الرقص",
    "اليوغا",
    "التزلج",
  ];

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (file: File) => void,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onChange(file);
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: OnboardingForm) => {
    try {
      if (!session?.user?.id) {
        throw new Error("No user found");
      }

      let profileImageUrl: string | undefined = undefined;

      // Optimize and upload profile image if selected
      if (selectedFile) {
        // Convert the file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>(resolve => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(selectedFile);
        });

        const base64Data = await base64Promise;

        // Optimize the image
        const optimizedImage = await optimizeImage({
          base64: base64Data,
          quality: 80,
        });

        // Upload to S3
        const uploadedUrls = await uploadFiles({
          entityId: `user-avatar/${session.user.id}`,
          fileData: [
            {
              name: selectedFile.name,
              type: "image/webp",
              size: selectedFile.size,
              lastModified: selectedFile.lastModified,
              base64: optimizedImage,
            },
          ],
        });

        if (uploadedUrls && uploadedUrls.length > 0) {
          profileImageUrl = uploadedUrls[0];
        }
      }

      // Update user profile with onboarding data
      await onboardUser({
        displayName: data.displayName,
        username: data.username,
        gender: data.gender,
        age: data.age,
        nationality: data.nationality,
        phone: data.phone,
        hobbies: data.hobbies,
        ...(profileImageUrl && { profileImage: profileImageUrl }),
      });

      toastSuccess("تم إكمال الملف الشخصي بنجاح");

      router.replace("/");
    } catch (error) {
      console.error(error);
      toastError(error instanceof Error ? error.message : "حدث خطأ أثناء إكمال الملف الشخصي");
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent mx-auto"></div>
          <p className="mt-2">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-black">إكمال الملف الشخصي</h1>
          <p className="text-gray-600">يرجى إكمال ملفك الشخصي للمتابعة</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="profileImage"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel
                    className="cursor-pointer text-sm text-gray-600 hover:text-black"
                    htmlFor="profileImage"
                  >
                    <Avatar className="group relative mb-2 h-24 w-24 cursor-pointer">
                      {profileImage ? (
                        <AvatarImage src={profileImage} alt="Profile" />
                      ) : (
                        <AvatarFallback className="bg-gray-200 text-lg text-gray-500">
                          صورة
                        </AvatarFallback>
                      )}
                    </Avatar>
                    اختر صورة شخصية
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleImageChange(e, onChange)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الكامل</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="أدخل اسمك الكامل" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المستخدم</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input {...field} placeholder="أدخل اسم المستخدم" />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        @
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>النوع</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="rtl flex justify-start gap-2"
                      dir="rtl"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="male" id="male" className="cursor-pointer" />
                        <Label htmlFor="male" className="cursor-pointer">
                          ذكر
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="female" id="female" className="cursor-pointer" />
                        <Label htmlFor="female" className="cursor-pointer">
                          أنثى
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العمر</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={MIN_AGE}
                      max={MAX_AGE}
                      placeholder="أدخل عمرك"
                      value={field.value || ""}
                      onChange={e => {
                        const value = e.target.value;
                        field.onChange(value === "" ? undefined : Number(value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start">
                  <FormLabel className="text-right">الجنسية</FormLabel>
                  <FormControl className="relative w-full">
                    <SelectCountry
                      nationality={field.value || ""}
                      setNationality={field.onChange}
                      placeholder="إختر الجنسية ..."
                      className="max-h-48 w-full rounded border border-gray-200 bg-gray-200 px-4 py-2 leading-tight text-gray-700 focus:border-purple-500 focus:bg-white focus:outline-none dark:bg-gray-800 dark:text-gray-300"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start">
                  <FormLabel className="text-right">رقم الهاتف</FormLabel>
                  <FormControl className="relative w-full">
                    <PhoneInput placeholder="رقم الهاتف الخاص بك" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hobbies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الهوايات</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {hobbiesList.map(hobby => {
                        const isSelected = field.value.includes(hobby);
                        return (
                          <div
                            key={hobby}
                            className={`cursor-pointer rounded-md px-3 py-2 transition-colors ${
                              isSelected
                                ? "bg-gray-800 font-bold text-white"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                            onClick={() => {
                              const currentHobbies = field.value || [];
                              if (isSelected) {
                                field.onChange(currentHobbies.filter(h => h !== hobby));
                              } else {
                                field.onChange([...currentHobbies, hobby]);
                              }
                            }}
                          >
                            {hobby}
                          </div>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full cursor-pointer"
              variant={"pressable"}
              disabled={isSubmitting}
            >
              {isSubmitting ? "جاري التحديث..." : "تحديث المعلومات"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
