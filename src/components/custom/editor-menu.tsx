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
  Image,
  Italic,
  LetterText,
  Link,
  List,
  ListOrdered,
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
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { Editor } from "@tiptap/core";

interface EditorMenuProps {
  editor: Editor;
}

// Reusable button component for editor actions
const EditorButton = ({
  onClick,
  isActive,
  disabled,
  children,
  tooltip,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  tooltip?: string;
}) => (
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

export function EditorMenu({ editor }: EditorMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  // File upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("يرجى اختيار ملف صورة صحيح");
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      if (result) {
        editor.chain().focus().setImage({ src: result }).run();
      }
    };
    reader.readAsDataURL(file);

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

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30 rounded-t-lg">
      {/* Undo/Redo */}
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

      {/* Headings */}
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Type className="size-4 mr-1" />
              عنوان
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
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

      {/* Text Formatting */}
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
        {/* // setFontSize handler */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <LetterText className="size-4 mr-1" />
              حجم الخط
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="p-2">
              <p className="text-sm flex gap-1 font-medium mb-2">
                <span>حجم الخط</span>
                <small>من 10 الى 100</small>
              </p>
              <div className="flex flex-col gap-1">
                {Array.from({ length: 10 }, (_, i) => (i + 1) * 10).map(size => (
                  <Button
                    key={size}
                    variant="ghost"
                    size="sm"
                    className={clsx(
                      "h-8 w-full p-0 hover:bg-muted",
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Color */}
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Palette className="size-4 mr-1" />
              لون النص
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="p-2">
              <p className="text-sm font-medium mb-2">لون النص</p>
              <div className="grid grid-cols-5 gap-1">
                {TEXT_COLORS.map(color => (
                  <button
                    key={color}
                    className="size-6 rounded border border-gray-300 hover:scale-110 transition-transform"
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
            <div className="p-2">
              <p className="text-sm font-medium mb-2">لون التمييز</p>
              <div className="grid grid-cols-5 gap-1">
                {HIGHLIGHT_COLORS.map(color => (
                  <button
                    key={color}
                    className="size-6 rounded border border-gray-300 hover:scale-110 transition-transform"
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

      {/* Alignment */}
      <div className="flex items-center gap-1">
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
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Lists */}
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

      {/* Code & Quote */}
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

      <Separator orientation="vertical" className="h-6" />

      {/* Links & Images */}
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="size-8 p-0 hover:bg-muted">
              <Image className="size-4" />
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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Clear Formatting */}
      <EditorButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        tooltip="مسح التنسيق"
      >
        <Trash2 className="size-4" />
      </EditorButton>
    </div>
  );
}
