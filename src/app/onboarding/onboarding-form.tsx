"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Images, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { hobbiesList, MINUTES_IN_MS } from "@/lib/constants";
import { api } from "@/trpc/react";
import { onboardingSchema } from "../schemas/onboarding";
import type { OnboardingForm } from "../schemas/onboarding";
import type { RouterOutputs } from "@/trpc/react";
import type { Session } from "next-auth";

type ProfileData = RouterOutputs["users"]["checkProfileCompletion"];

// Generate a username from display name
function generateUsername(name: string) {
  if (!name) return "";

  // Remove spaces, Arabic characters, and convert to lowercase
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/g, "") // Remove Arabic characters
    .replace(/[^\w\d_.-]/gi, ""); // Only allow English letters, numbers, and some symbols
}

export default function OnboardingForm({
  session,
  profileData,
}: {
  session: Session;
  profileData: ProfileData;
}) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();
  const router = useRouter();

  // TRPC API hooks
  const { mutateAsync: optimizeImage } = api.optimizeImage.optimizeImage.useMutation();
  const { mutateAsync: uploadFiles } = api.S3.uploadFiles.useMutation();
  const { mutateAsync: onboardUser } = api.users.onboardUser.useMutation();

  // Create proper default values with all required fields
  const getDefaultValues = useCallback(() => {
    const displayName = session?.user?.name ?? "";
    const emailFirstPart = session?.user?.email?.split("@")[0];
    const generatedUsername = displayName ? generateUsername(displayName) : emailFirstPart;

    return {
      displayName,
      username: generatedUsername ?? "user", // Ensure we have at least 3 chars
      email: session?.user?.email ?? "",
      gender: undefined as "male" | "female" | undefined,
      goalBand: 5.0,
      phone: "",
      hobbies: [] as string[],
      profileImage: undefined as File | undefined,
    };
  }, [session?.user?.name, session?.user?.email]);

  // Initialize the form with proper default values
  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: getDefaultValues(),
  });

  // Watch the username and email fields to check availability
  const username = form.watch("username");
  const email = form.watch("email");
  const [debouncedUsername, setDebouncedUsername] = useState<string>("");
  const [debouncedEmail, setDebouncedEmail] = useState<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const emailDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce username changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (username && username.length > 2) {
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedUsername(username);
      }, 500);
    } else if (!username) {
      setDebouncedUsername("");
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [username]);

  // Debounce email changes
  useEffect(() => {
    if (emailDebounceTimerRef.current) {
      clearTimeout(emailDebounceTimerRef.current);
    }

    if (email?.includes("@")) {
      emailDebounceTimerRef.current = setTimeout(() => {
        setDebouncedEmail(email);
      }, MINUTES_IN_MS / 60);
    } else if (!email) {
      setDebouncedEmail("");
    }

    return () => {
      if (emailDebounceTimerRef.current) {
        clearTimeout(emailDebounceTimerRef.current);
      }
    };
  }, [email]);

  const { data: usernameAvailability, isLoading: loadingUsernameAvailability } =
    api.users.checkUsernameAvailability.useQuery(
      { username: debouncedUsername || "" },
      { enabled: !!debouncedUsername && debouncedUsername.length > 2 },
    );

  const { data: emailAvailability, isLoading: loadingEmailAvailability } =
    api.users.checkEmailAvailability.useQuery(
      { email: debouncedEmail || "" },
      { enabled: !!debouncedEmail && debouncedEmail.includes("@") },
    );

  // Handle profile data when available and reset form properly
  useEffect(() => {
    if (profileData) {
      if (profileData.isComplete && session.user.phone) {
        return;
      }

      // Prefill form if data exists
      if (profileData.user) {
        const user = profileData.user;

        // Reset form with existing data, ensuring all fields are properly set
        form.reset({
          displayName: user.displayName ?? session?.user?.name ?? "",
          username: user.username ?? generateUsername(session?.user?.name ?? "") ?? "user",
          email: user.email ?? session?.user?.email ?? "",
          gender: user.gender as "male" | "female" | undefined,
          goalBand: user.goalBand ?? 5.0,
          phone: user.phone ?? "",
          hobbies: user.hobbies ?? [],
          profileImage: undefined, // File object can't be restored
        });

        if (user.image) {
          setProfileImage(user.image);
        }
      } else {
        // No existing user data, use session data
        const defaultValues = getDefaultValues();
        form.reset(defaultValues);
      }
    } else if (session?.user) {
      // Initial load with session data
      const defaultValues = getDefaultValues();
      form.reset(defaultValues);
    }
  }, [profileData, session, form, getDefaultValues]);

  const isSubmitting = form.formState.isSubmitting;

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
        email: data.email,
        gender: data.gender,
        goalBand: data.goalBand,
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
              render={({ field: { onChange, value: _value, ...field } }) => (
                <FormItem>
                  <FormLabel
                    className="cursor-pointer text-sm text-gray-600 hover:text-black"
                    htmlFor="profileImage"
                  >
                    <Avatar className="group relative mb-2 size-24 cursor-pointer">
                      {profileImage ? (
                        <AvatarImage src={profileImage} alt="Profile" />
                      ) : (
                        <AvatarFallback className="bg-gray-200 text-lg text-gray-500">
                          صورة
                        </AvatarFallback>
                      )}
                      <div className="absolute bg-black/60 inset-0 size-full hidden group-hover:flex">
                        <Images className="absolute size-14 -translate-y-1/2 -translate-x-1/2 left-1/2 top-1/2 text-white stroke-1" />
                      </div>
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
                  <FormControl className="relative">
                    <div>
                      <Input
                        {...field}
                        placeholder="أدخل اسم المستخدم"
                        onChange={e => {
                          // Filter out spaces and Arabic characters
                          const value = e.target.value
                            .replace(/\s+/g, "")
                            .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/g, ""); // Remove Arabic characters

                          field.onChange(value);
                        }}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        @
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage>
                    {loadingUsernameAvailability && (
                      <span className="flex gap-x-1.5 items-center text-gray-500">
                        <Loader className="mr-2 size-3 animate-spin" />
                        جاري التحقق
                      </span>
                    )}
                    {debouncedUsername && debouncedUsername.length > 2 && usernameAvailability && (
                      <span
                        className={
                          usernameAvailability.isAvailable ? "text-green-500" : "text-red-500"
                        }
                      >
                        {usernameAvailability.isAvailable ? "✓ متاح" : "✗ غير متاح"}
                      </span>
                    )}
                  </FormMessage>
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
                    <Input {...field} type="email" placeholder="أدخل بريدك الإلكتروني" />
                  </FormControl>
                  <FormMessage>
                    {loadingEmailAvailability && (
                      <span className="flex gap-x-1.5 items-center text-gray-500">
                        <Loader className="mr-2 size-3 animate-spin" />
                        جاري التحقق
                      </span>
                    )}
                    {debouncedEmail && debouncedEmail.includes("@") && emailAvailability && (
                      <span
                        className={
                          emailAvailability.isAvailable ? "text-green-500" : "text-red-500"
                        }
                      >
                        {emailAvailability.isAvailable ? "✓ متاح" : "✗ غير متاح"}
                      </span>
                    )}
                  </FormMessage>
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
                    >
                      <SelectTrigger className="rtl cursor-pointer">
                        <SelectValue placeholder="اختر هدفك" />
                      </SelectTrigger>
                      <SelectContent className="bg-white rtl">
                        <SelectGroup>
                          <SelectLabel>اختر هدفك</SelectLabel>
                          {Array.from({ length: 9 }, (_, i) => 5 + i * 0.5).map(band => (
                            <SelectItem
                              key={band}
                              value={band.toFixed(1)}
                              className="cursor-pointer"
                            >
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
