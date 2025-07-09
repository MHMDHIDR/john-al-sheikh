import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Edit3, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReactNodeViewProps } from "@tiptap/react";

// Define the attributes interface
interface CustomButtonAttributes {
  label: string;
  url: string;
  backgroundColor: string;
}

// Function to determine if a color is light or dark
const isLightColor = (color: string): boolean => {
  // Convert hex to RGB
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance using the formula for perceived brightness
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return true if the color is light (luminance > 0.5)
  return luminance > 0.5;
};

// Function to get contrasting text color
const getContrastingTextColor = (backgroundColor: string): string => {
  return isLightColor(backgroundColor) ? "#000000" : "#ffffff";
};

// Button component that renders in the editor
const ButtonComponent = (props: ReactNodeViewProps<HTMLElement>) => {
  const { node, updateAttributes, deleteNode } = props;
  const [isEditing, setIsEditing] = useState(false);

  // Type-safe access to node attributes
  const nodeAttrs = node.attrs as CustomButtonAttributes;
  const [label, setLabel] = useState(nodeAttrs.label ?? "");
  const [url, setUrl] = useState(nodeAttrs.url ?? "");
  const [backgroundColor, setBackgroundColor] = useState(nodeAttrs.backgroundColor ?? "#3B82F6");

  const handleSave = () => {
    updateAttributes({
      label: label.trim() || "زر مخصص",
      url: url.trim() || "#",
      backgroundColor: backgroundColor || "#3B82F6",
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLabel(nodeAttrs.label ?? "");
    setUrl(nodeAttrs.url ?? "");
    setBackgroundColor(nodeAttrs.backgroundColor ?? "#3B82F6");
    setIsEditing(false);
  };

  return (
    <NodeViewWrapper className="custom-button-wrapper">
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50 my-2">
        <div className="flex-1">
          <button
            style={{
              backgroundColor: nodeAttrs.backgroundColor,
              color: getContrastingTextColor(nodeAttrs.backgroundColor),
            }}
            className="px-4 py-2 cursor-pointer rounded-lg font-medium hover:opacity-90 transition-opacity"
            onClick={e => {
              e.preventDefault();
              const buttonUrl = nodeAttrs.url;
              if (buttonUrl && buttonUrl !== "#") {
                window.open(buttonUrl, "_blank");
              }
            }}
          >
            {nodeAttrs.label ?? "زر مخصص"}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="size-8 p-0">
                <Edit3 className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>تعديل الزر المخصص</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="button-label">نص الزر</Label>
                  <Input
                    id="button-label"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="أدخل نص الزر"
                    className="rtl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="button-url">رابط الزر</Label>
                  <Input
                    id="button-url"
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
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
                      value={backgroundColor}
                      onChange={e => setBackgroundColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={backgroundColor}
                      onChange={e => setBackgroundColor(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} className="flex-1">
                    حفظ التغييرات
                  </Button>
                  <Button variant="outline" onClick={handleCancel} className="flex-1">
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0 text-red-500 hover:text-red-700"
            onClick={deleteNode}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

// TipTap extension definition
export const CustomButton = Node.create<Record<string, never>, CustomButtonAttributes>({
  name: "customButton",

  group: "block",

  content: "",

  addAttributes() {
    return {
      label: {
        default: "زر مخصص",
        parseHTML: element => element.getAttribute("data-label") ?? "زر مخصص",
        renderHTML: attributes => {
          const label = attributes.label as string | undefined;
          if (!label) {
            return {};
          }
          return {
            "data-label": label,
          };
        },
      },
      url: {
        default: "#",
        parseHTML: element => element.getAttribute("data-url") ?? "#",
        renderHTML: attributes => {
          const url = attributes.url as string | undefined;
          if (!url) {
            return {};
          }
          return {
            "data-url": url,
          };
        },
      },
      backgroundColor: {
        default: "#3B82F6",
        parseHTML: element => element.getAttribute("data-bg-color") ?? "#3B82F6",
        renderHTML: attributes => {
          const backgroundColor = attributes.backgroundColor as string | undefined;
          if (!backgroundColor) {
            return {};
          }
          return {
            "data-bg-color": backgroundColor,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="custom-button"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const backgroundColor = (HTMLAttributes["data-bg-color"] as string) ?? "#3B82F6";
    const textColor = getContrastingTextColor(backgroundColor);
    const url = (HTMLAttributes["data-url"] as string) ?? "#";
    const label = (HTMLAttributes["data-label"] as string) ?? "زر مخصص";

    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "custom-button" }),
      [
        "a",
        {
          href: url,
          target: "_blank",
          rel: "noopener noreferrer",
          style: `
            display: inline-block;
            padding: 12px 24px;
            background-color: ${backgroundColor};
            color: ${textColor} !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            text-align: center;
            transition: opacity 0.2s;
            cursor: pointer;
            margin: 8px 0;
          `,
          onmouseover: "this.style.opacity='0.9'",
          onmouseout: "this.style.opacity='1'",
        },
        label,
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ButtonComponent);
  },

  addCommands() {
    return {
      setCustomButton:
        (options: Partial<CustomButtonAttributes>) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              label: options.label ?? "زر مخصص",
              url: options.url ?? "#",
              backgroundColor: options.backgroundColor ?? "#3B82F6",
            },
          });
        },
    };
  },
});

// Extend the Commands interface to include our custom command
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customButton: {
      setCustomButton: (options: Partial<CustomButtonAttributes>) => ReturnType;
    };
  }
}
