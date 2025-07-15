import clsx from "clsx";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Code2,
  Highlighter,
  Image as ImageIcon,
  Italic,
  LetterText,
  Link,
  List,
  ListOrdered,
  MousePointerClick,
  Palette,
  Quote,
  Redo,
  Strikethrough,
  Trash2,
  Type,
  Underline,
  Undo,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatCompactDate } from "@/lib/format-date";
import { api } from "@/trpc/react";
import type { ButtonProps } from "@/components/ui/button";
import type { Editor } from "@tiptap/core";

interface EditorMenuProps {
  editor: Editor;
  isSimpleEditor?: boolean;
}

interface EditorButtonProps extends ButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  tooltip?: string;
}

// Reusable button component for editor actions
const EditorButton = ({
  onClick,
  isActive,
  disabled,
  children,
  tooltip,
  ...props
}: EditorButtonProps) => (
  <Button
    variant="ghost"
    size="sm"
    className={clsx(
      "size-8 p-0 hover:bg-muted",
      isActive && "bg-muted border border-primary text-primary",
    )}
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    type="button"
    {...props}
  >
    {children}
  </Button>
);

// Color palette options
const TEXT_COLORS = [
  "#000000",
  "#374151",
  "#6B7280",
  "#9CA3AF",
  "#D1D5DB",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
];

const HIGHLIGHT_COLORS = [
  "#FEF3C7",
  "#FECACA",
  "#D1FAE5",
  "#DBEAFE",
  "#E0E7FF",
  "#F3E8FF",
  "#FCE7F3",
  "#F0F9FF",
  "#ECFDF5",
  "#FEF7CD",
];

export function EditorMenu({ editor, isSimpleEditor }: EditorMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // State for custom button dialog
  const [isCustomButtonDialogOpen, setIsCustomButtonDialogOpen] = useState(false);
  const [customButtonLabel, setCustomButtonLabel] = useState("زر مخصص");
  const [customButtonUrl, setCustomButtonUrl] = useState("#");
  const [customButtonColor, setCustomButtonColor] = useState("#3B82F6");

  const optimizeImageMutation = api.optimizeImage.optimizeImage.useMutation();
  const uploadFilesMutation = api.S3.uploadFiles.useMutation({
    onMutate: () => {
      toast.loading("جاري رفع الصورة...");
    },
    onSuccess: () => {
      toast.success("تم رفع الصورة بنجاح");
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء رفع الصورة");
    },
  });

  if (!editor) {
    return null;
  }

  // File upload handler
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning("يرجى اختيار ملف صورة صحيح");
      return;
    }

    const MAX_FILE_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.warning("حجم الصورة يجب أن لا يتجاوز 3 ميجابايت");
      return;
    }

    try {
      // Add loading placeholder while isUploading
      editor
        .chain()
        .focus()
        .setImage({
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' class='animate-pulse bg-muted' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3C/svg%3E",
          alt: "جاري رفع الصورة...",
        })
        .run();

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
        entityId: `newsletter-images/${formatCompactDate()}`,
        fileData,
      });

      // Replace loading placeholder with actual image
      if (uploadedUrls[0]) {
        editor
          .chain()
          .focus()
          .setImage({
            src: uploadedUrls[0],
            alt: file.name,
            title: file.name,
          })
          .run();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء رفع الصورة");
      // Remove loading placeholder on error
      editor.chain().focus().deleteSelection().run();
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Image URL handler
  const addImageUrl = () => {
    const url = window.prompt("أدخل رابط الصورة:");
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: "Image in a news letter" }).run();
    }
  };

  // Link handler
  const addLink = () => {
    const url = window.prompt("أدخل الرابط:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  // Remove link
  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  // Text color handler
  const setTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  // Highlight color handler
  const setHighlightColor = (color: string) => {
    editor.chain().focus().setHighlight({ color }).run();
  };

  // Font size handler
  const setFontSize = (size: string) => {
    editor.chain().focus().setFontSize(size).run();
  };

  // Custom button handlers
  const handleAddCustomButton = () => {
    editor
      .chain()
      .focus()
      .setCustomButton({
        label: customButtonLabel.trim() || "زر مخصص",
        url: customButtonUrl.trim() || "#",
        backgroundColor: customButtonColor || "#3B82F6",
      })
      .run();

    // Reset form and close dialog
    setCustomButtonLabel("زر مخصص");
    setCustomButtonUrl("#");
    setCustomButtonColor("#3B82F6");
    setIsCustomButtonDialogOpen(false);
  };

  const handleCancelCustomButton = () => {
    setCustomButtonLabel("زر مخصص");
    setCustomButtonUrl("#");
    setCustomButtonColor("#3B82F6");
    setIsCustomButtonDialogOpen(false);
  };

  const MIN_FONT_SIZE = 10;
  const MAX_FONT_SIZE = 100;
  const DEFAULT_FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 88, 96];

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30 dark:bg-background/95 rounded-t-lg">
      <div className="flex items-center gap-1">
        <EditorButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          tooltip="تراجع"
        >
          <Undo className="size-4" />
        </EditorButton>
        <EditorButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          tooltip="إعادة"
        >
          <Redo className="size-4" />
        </EditorButton>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Type className="size-4 mr-1" />
              عنوان
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rtl">
            <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
              نص عادي
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              عنوان رئيسي
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              عنوان فرعي
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              عنوان صغير
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <EditorButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          tooltip="عريض"
        >
          <Bold className="size-4" />
        </EditorButton>
        <EditorButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          tooltip="مائل"
        >
          <Italic className="size-4" />
        </EditorButton>
        <EditorButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          tooltip="تحته خط"
        >
          <Underline className="size-4" />
        </EditorButton>
        <EditorButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          tooltip="يتوسطه خط"
        >
          <Strikethrough className="size-4" />
        </EditorButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <LetterText className="size-4 mr-1" />
              حجم الخط
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="p-1 rtl">
              <p className="text-sm flex items-center gap-1.5 font-medium mb-2">
                <span>حجم الخط</span>
                <small className="text-muted-foreground">(أعلى حجم {MAX_FONT_SIZE})</small>
              </p>
              <div className="flex flex-col gap-1">
                <Input
                  type="number"
                  min={MIN_FONT_SIZE}
                  max={MAX_FONT_SIZE}
                  defaultValue="16"
                  placeholder="حجم الخط"
                  onChange={e => {
                    const size = e.target.value;
                    if (size) {
                      setFontSize(`${size}px`);
                    }
                  }}
                  className="w-full"
                />
                <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
                  {DEFAULT_FONT_SIZES.map(size => (
                    <Button
                      key={size}
                      variant="ghost"
                      size="sm"
                      className={clsx(
                        "h-8 w-full p-1.5 hover:bg-muted",
                        editor.isActive({ fontSize: `${size}px` }) &&
                          "bg-muted border border-primary text-primary",
                      )}
                      onClick={() => setFontSize(`${size}px`)}
                      title={`${size}px`}
                      type="button"
                    >
                      {size}px
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Palette className="size-4 mr-1" />
              لون النص
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="p-2 rtl">
              <p className="text-sm font-medium mb-2">لون النص</p>
              <div className="grid grid-cols-5 gap-1">
                {TEXT_COLORS.map(color => (
                  <button
                    key={color}
                    className="size-6 cursor-pointer rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => setTextColor(color)}
                    title={color}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                إزالة اللون
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Highlighter className="size-4 mr-1" />
              تمييز
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="p-2 rtl">
              <p className="text-sm font-medium mb-2">لون التمييز</p>
              <div className="grid grid-cols-5 gap-1">
                {HIGHLIGHT_COLORS.map(color => (
                  <button
                    key={color}
                    className="size-6 cursor-pointer rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => setHighlightColor(color)}
                    title={color}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
              >
                إزالة التمييز
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <EditorButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          tooltip="محاذاة يمين"
        >
          <AlignRight className="size-4" />
        </EditorButton>
        <EditorButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          tooltip="ضبط"
        >
          <AlignJustify className="size-4" />
        </EditorButton>
        <EditorButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          tooltip="محاذاة يسار"
        >
          <AlignLeft className="size-4" />
        </EditorButton>
        <EditorButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          tooltip="محاذاة وسط"
        >
          <AlignCenter className="size-4" />
        </EditorButton>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <EditorButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          tooltip="قائمة نقطية"
        >
          <List className="size-4" />
        </EditorButton>
        <EditorButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          tooltip="قائمة مرقمة"
        >
          <ListOrdered className="size-4" />
        </EditorButton>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {isSimpleEditor ? null : (
        <div className="flex items-center gap-1">
          <EditorButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            tooltip="كود"
          >
            <Code className="size-4" />
          </EditorButton>
          <EditorButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            tooltip="مربع كود"
          >
            <Code2 className="size-4" />
          </EditorButton>
          <EditorButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            tooltip="اقتباس"
          >
            <Quote className="size-4" />
          </EditorButton>
        </div>
      )}

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <EditorButton onClick={() => null} isActive={editor.isActive("link")} tooltip="رابط">
              <Link className="size-4" />
            </EditorButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={addLink}>إضافة رابط</DropdownMenuItem>
            {editor.isActive("link") && (
              <DropdownMenuItem onClick={removeLink}>إزالة الرابط</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {isSimpleEditor ? null : (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="size-8 p-0 hover:bg-muted">
                  <ImageIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="size-4 mr-2" />
                  رفع صورة
                </DropdownMenuItem>
                <DropdownMenuItem onClick={addImageUrl}>
                  <Link className="size-4 mr-2" />
                  رابط صورة
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </>
        )}

        {/* Custom Button Integration */}
        <Dialog open={isCustomButtonDialogOpen} onOpenChange={setIsCustomButtonDialogOpen}>
          <DialogTrigger asChild>
            <EditorButton
              onClick={() => setIsCustomButtonDialogOpen(true)}
              isActive={editor.isActive("customButton")}
              tooltip="زر مخصص"
            >
              <MousePointerClick className="size-4" />
            </EditorButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>إضافة زر مخصص</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="button-label">نص الزر</Label>
                <Input
                  id="button-label"
                  value={customButtonLabel}
                  onChange={e => setCustomButtonLabel(e.target.value)}
                  placeholder="أدخل نص الزر"
                  className="rtl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="button-url">رابط الزر</Label>
                <Input
                  id="button-url"
                  type="url"
                  value={customButtonUrl}
                  onChange={e => setCustomButtonUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="rtl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="button-color">لون الخلفية</Label>
                <div className="flex gap-2">
                  <Input
                    id="button-color"
                    type="color"
                    value={customButtonColor}
                    onChange={e => setCustomButtonColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={customButtonColor}
                    onChange={e => setCustomButtonColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleAddCustomButton} className="flex-1">
                  إضافة الزر
                </Button>
                <Button variant="outline" onClick={handleCancelCustomButton} className="flex-1">
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <EditorButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        tooltip="مسح التنسيق"
        variant={"destructive"}
        className="w-fit"
      >
        <span className="inline-flex w-fit items-center gap-1">
          مسح التنسيق
          <Trash2 className="size-4" />
        </span>
      </EditorButton>
    </div>
  );
}
