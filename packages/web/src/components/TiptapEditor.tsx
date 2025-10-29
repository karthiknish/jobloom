"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { common, createLowlight } from "lowlight";

import { useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/components/ui/Toast";
import { getAuthClient } from "@/firebase/client";

const lowlight = createLowlight(common);

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const addImage = useCallback(() => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
    }
  }, [editor, imageUrl]);

  const addLink = useCallback(() => {
    if (linkUrl && linkText) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${linkUrl}" target="_blank">${linkText}</a>`)
        .run();
      setLinkUrl("");
      setLinkText("");
    }
  }, [editor, linkUrl, linkText]);

  const insertTable = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const generateContent = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const auth = getAuthClient();
      const token = await auth?.currentUser?.getIdToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/ai/editor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          tone: "professional",
          format: "plain",
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || "AI content request failed");
      }

      const { content } = await response.json();
      const generatedText = typeof content === "string" ? content : "";

      // Insert the generated content at cursor position
      editor.chain().focus().insertContent(generatedText).run();

      showSuccess("AI content generated successfully!");
    } catch (error) {
      console.error("Error generating content:", error);
      showError("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [editor]);

  const [aiPrompt, setAiPrompt] = useState("");

  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-border p-2 flex flex-wrap gap-1 items-center bg-muted/30">
      {/* AI Content Generation */}
      <div className="flex items-center gap-1 mr-2">
        <Input
          placeholder="Ask AI to write..."
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          className="w-48 h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              generateContent(aiPrompt);
              setAiPrompt("");
            }
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            generateContent(aiPrompt);
            setAiPrompt("");
          }}
          disabled={isGenerating || !aiPrompt.trim()}
          className="h-8"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          {isGenerating ? "..." : "AI"}
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Formatting */}
      <Button
        variant={editor.isActive("bold") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className="h-8 w-8 p-0"
      >
        <Bold className="h-3 w-3" />
      </Button>

      <Button
        variant={editor.isActive("italic") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className="h-8 w-8 p-0"
      >
        <Italic className="h-3 w-3" />
      </Button>

      <Button
        variant={editor.isActive("underline") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className="h-8 w-8 p-0"
      >
        <UnderlineIcon className="h-3 w-3" />
      </Button>

      <Button
        variant={editor.isActive("strike") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className="h-8 w-8 p-0"
      >
        <Strikethrough className="h-3 w-3" />
      </Button>

      <Button
        variant={editor.isActive("highlight") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className="h-8 w-8 p-0"
      >
        <Highlighter className="h-3 w-3" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Headings */}
      <Button
        variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className="h-8 px-2"
      >
        <Heading1 className="h-3 w-3" />
      </Button>

      <Button
        variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="h-8 px-2"
      >
        <Heading2 className="h-3 w-3" />
      </Button>

      <Button
        variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className="h-8 px-2"
      >
        <Heading3 className="h-3 w-3" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Lists */}
      <Button
        variant={editor.isActive("bulletList") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className="h-8 w-8 p-0"
      >
        <List className="h-3 w-3" />
      </Button>

      <Button
        variant={editor.isActive("orderedList") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className="h-8 w-8 p-0"
      >
        <ListOrdered className="h-3 w-3" />
      </Button>

      <Button
        variant={editor.isActive("blockquote") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className="h-8 w-8 p-0"
      >
        <Quote className="h-3 w-3" />
      </Button>

      <Button
        variant={editor.isActive("codeBlock") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className="h-8 w-8 p-0"
      >
        <Code className="h-3 w-3" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Media */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ImageIcon className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <Button onClick={addImage} disabled={!imageUrl} className="w-full">
              Insert Image
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <LinkIcon className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="link-text">Link Text</Label>
                <Input
                  id="link-text"
                  placeholder="Click here"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={addLink} disabled={!linkUrl || !linkText} className="w-full">
              Insert Link
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="sm"
        onClick={insertTable}
        className="h-8 w-8 p-0"
      >
        <TableIcon className="h-3 w-3" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Alignment */}
      <Button
        variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className="h-8 w-8 p-0"
      >
        <AlignLeft className="h-3 w-3" />
      </Button>

      <Button
        variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className="h-8 w-8 p-0"
      >
        <AlignCenter className="h-3 w-3" />
      </Button>

      <Button
        variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className="h-8 w-8 p-0"
      >
        <AlignRight className="h-3 w-3" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* History */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="h-8 w-8 p-0"
      >
        <Undo className="h-3 w-3" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="h-8 w-8 p-0"
      >
        <Redo className="h-3 w-3" />
      </Button>
    </div>
  );
};

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  className = "",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: 50000,
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 hover:text-primary/80",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      Underline,
      Subscript,
      Superscript,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  const characterCount = editor?.storage?.characterCount?.characters() || 0;
  const wordCount = editor?.storage?.characterCount?.words() || 0;

  return (
    <div className={`border border-border rounded-md ${className}`}>
      <MenuBar editor={editor} />
      <div className="min-h-[300px]">
        <EditorContent editor={editor} />
      </div>
      <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground flex justify-between">
        <span>{wordCount} words</span>
        <span>{characterCount}/50,000 characters</span>
      </div>
    </div>
  );
}
