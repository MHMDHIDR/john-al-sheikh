import clsx from "clsx";
import { Button } from "@/components/ui/button";
import type { Editor } from "@tiptap/core";

export function EditorMenu({ editor }: { editor: Editor }) {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt("Enter the URL of the image:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt("Enter the URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap select-none gap-2 p-2 rounded-t-md">
      <Button
        className={clsx("px-2 py-1 text-sm text-accent", {
          "border text-blue-400 dark:text-blue-500 border-blue-400": editor.isActive("heading", {
            level: 1,
          }),
        })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        type="button"
      >
        H1
      </Button>
      <Button
        className={clsx("px-2 py-1 text-sm text-accent", {
          "border text-blue-400 dark:text-blue-500 border-blue-400": editor.isActive("heading", {
            level: 2,
          }),
        })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        type="button"
      >
        H2
      </Button>
      <Button
        className={clsx("px-2 py-1 text-sm text-accent", {
          "border text-blue-400 dark:text-blue-500 border-blue-400": editor.isActive("heading", {
            level: 3,
          }),
        })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        type="button"
      >
        H3
      </Button>
      <Button
        className={clsx("px-2 py-1 text-sm text-accent", {
          "border text-blue-400 dark:text-blue-500 border-blue-400": editor.isActive("code"),
        })}
        onClick={() => editor.chain().focus().toggleCode().run()}
        type="button"
      >
        Code
      </Button>
      <Button
        className={clsx("px-2 py-1 text-sm text-accent", {
          "border text-blue-400 dark:text-blue-500 border-blue-400": editor.isActive("codeBlock"),
        })}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        type="button"
      >
        Code Block
      </Button>
      <Button
        className={clsx("px-2 py-1 text-sm text-accent", {
          "border text-blue-400 dark:text-blue-500 border-blue-400": editor.isActive("blockquote"),
        })}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        type="button"
      >
        Blockquote
      </Button>
      <Button
        className={clsx("px-2 py-1 text-sm text-accent", {
          "border text-blue-400 dark:text-blue-500 border-blue-400": editor.isActive("bold"),
        })}
        onClick={() => editor.chain().focus().toggleBold().run()}
        type="button"
      >
        Bold
      </Button>
      <Button
        className={clsx("px-2 py-1 text-sm text-accent", {
          "border text-blue-400 dark:text-blue-500 border-blue-400": editor.isActive("italic"),
        })}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        type="button"
      >
        Italic
      </Button>
      <Button
        className={clsx("px-2 py-1 text-sm text-accent", {
          "border text-blue-400 dark:text-blue-500 border-blue-400": editor.isActive("bulletList"),
        })}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        type="button"
      >
        Bullet List
      </Button>
      <Button
        className={clsx("px-2 py-1 text-sm text-accent", {
          "border text-blue-400 dark:text-blue-500 border-blue-400": editor.isActive("link"),
        })}
        onClick={addLink}
        type="button"
      >
        Link
      </Button>
      <Button
        className={clsx("px-2 py-1 text-sm text-accent", {
          "border text-blue-400 dark:text-blue-500 border-blue-400": editor.isActive("image"),
        })}
        onClick={addImage}
        type="button"
      >
        Image URL
      </Button>
    </div>
  );
}
