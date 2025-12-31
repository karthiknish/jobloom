"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import { DOMParser as ProseMirrorDOMParser } from "prosemirror-model";
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

import { useState, useCallback, useEffect } from "react";
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
  MoreHorizontal,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { sanitizeHtml } from "@/utils/security";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showSuccess, showError } from "@/components/ui/Toast";
import { aiApi } from "@/utils/api/ai";
import { cn } from "@/lib/utils";

const lowlight = createLowlight(common);

function looksLikeMarkdown(text: string): boolean {
  const value = (text || "").trim();
  if (value.length < 2) return false;

  // Common multi-line markdown patterns
  if (value.includes("\n")) {
    if (/^#{1,6}\s/m.test(value)) return true;
    if (/^>\s/m.test(value)) return true;
    if (/^\s*[-*+]\s+/m.test(value)) return true;
    if (/^\s*\d+\.\s+/m.test(value)) return true;
    if (/```[\s\S]*```/m.test(value)) return true;
  }

  // Single-line patterns
  if (/^#{1,6}\s+/.test(value)) return true;
  if (/^\s*[-*+]\s+/.test(value)) return true;
  if (/^\s*\d+\.\s+/.test(value)) return true;

  // Links / emphasis
  if (/\[[^\]]+\]\([^\)]+\)/.test(value)) return true;
  if (/(\*\*[^*]+\*\*)|(__[^_]+__)|(_[^_]+_)|(\*[^*]+\*)/.test(value)) return true;

  return false;
}

function looksLikeHtml(text: string): boolean {
  const value = (text || "").trim();
  if (!value) return false;
  // Very small heuristic: if it starts with a tag or contains typical block tags.
  if (/^<([a-z][\w-]*)(\s[^>]*)?>/i.test(value)) return true;
  if (/<\/(p|h1|h2|h3|ul|ol|li|blockquote|pre|code)>/i.test(value)) return true;
  return false;
}

function normalizeIncomingContent(raw: string): string {
  const value = raw || "";
  if (!value.trim()) return "";
  if (looksLikeHtml(value)) return value;
  if (looksLikeMarkdown(value)) return markdownToHtml(value);

  // Plain text fallback: preserve newlines as paragraphs.
  const lines = value.replace(/\r\n/g, "\n").split("\n").map((l) => l.trim());
  const nonEmpty = lines.filter(Boolean);
  if (nonEmpty.length === 0) return "";
  return nonEmpty.map((l) => `<p>${l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`).join("\n");
}

function markdownToHtml(markdown: string): string {
  const input = (markdown || "").replace(/\r\n/g, "\n");
  const lines = input.split("\n");

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");

  const inline = (value: string) => {
    let v = escapeHtml(value);
    v = v.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    v = v.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    v = v.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    v = v.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    v = v.replace(/_([^_]+)_/g, "<em>$1</em>");
    v = v.replace(/`([^`]+)`/g, "<code>$1</code>");
    return v;
  };

  const out: string[] = [];
  let inCode = false;
  let inUl = false;
  let inOl = false;
  let inBlockquote = false;

  const closeListsAndQuote = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
    if (inBlockquote) {
      out.push("</blockquote>");
      inBlockquote = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine ?? "";

    if (/^```/.test(line.trim())) {
      closeListsAndQuote();
      if (!inCode) {
        out.push("<pre><code>");
        inCode = true;
      } else {
        out.push("</code></pre>");
        inCode = false;
      }
      continue;
    }

    if (inCode) {
      out.push(escapeHtml(line));
      continue;
    }

    if (line.trim() === "") {
      closeListsAndQuote();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      closeListsAndQuote();
      const level = headingMatch[1].length;
      out.push(`<h${level}>${inline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      if (!inBlockquote) {
        closeListsAndQuote();
        out.push("<blockquote>");
        inBlockquote = true;
      }
      out.push(`<p>${inline(quoteMatch[1])}</p>`);
      continue;
    }

    const ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ulMatch) {
      if (!inUl) {
        closeListsAndQuote();
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inline(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!inOl) {
        closeListsAndQuote();
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inline(olMatch[2])}</li>`);
      continue;
    }

    closeListsAndQuote();
    out.push(`<p>${inline(line)}</p>`);
  }

  if (inCode) out.push("</code></pre>");
  closeListsAndQuote();

  return out.join("\n");
}


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
  const [aiPrompt, setAiPrompt] = useState("");

  const addImage = useCallback(() => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
    }
  }, [editor, imageUrl]);

  const addLink = useCallback(() => {
    if (linkUrl) {
      // If text is selected, just link it. If not, insert text with link.
      if (editor.state.selection.empty && linkText) {
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${linkUrl}" target="_blank">${linkText}</a>`)
          .run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: linkUrl })
          .run();
      }
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

  const generateContent = useCallback(async (prompt: string, options?: { length?: string; format?: string }) => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await aiApi.generateEditorContent({
        prompt,
        tone: "professional",
        format: options?.format || "html",
        length: options?.length || "medium",
      });

      const generatedText = typeof response.content === "string" ? response.content : "";

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

  const convertMarkdown = useCallback(() => {
    if (!editor) return;

    const { from, to, empty } = editor.state.selection;
    const selectedText = empty
      ? ""
      : editor.state.doc.textBetween(from, to, "\n");

    const source = selectedText.trim().length ? selectedText : editor.getText();
    if (!looksLikeMarkdown(source)) {
      showError("No Markdown detected to convert.");
      return;
    }

    const html = markdownToHtml(source);
    if (!html.trim()) {
      showError("Could not convert Markdown.");
      return;
    }

    if (selectedText.trim().length) {
      editor.chain().focus().insertContentAt({ from, to }, html).run();
    } else {
      editor.commands.setContent(html);
    }

    showSuccess("Converted Markdown to rich text.");
  }, [editor]);

  // AI Quick Actions
  const aiQuickActions = [
    { label: "Write introduction", prompt: "Write a compelling introduction paragraph for this blog post" },
    { label: "Add conclusion", prompt: "Write a strong conclusion paragraph summarizing key points" },
    { label: "Generate tips list", prompt: "Create a list of 5 practical tips", options: { format: "bullet" } },
    { label: "Expand paragraph", prompt: "Expand and elaborate on the selected content or previous paragraph" },
    { label: "Add examples", prompt: "Add relevant real-world examples to illustrate the point" },
  ];

  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-border p-2 flex flex-wrap gap-1 items-center bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
      {/* AI Content Generation */}
      <div className="flex items-center gap-1 mr-2 bg-emerald-50 p-1 rounded-md border border-emerald-200">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1 text-emerald-700 hover:bg-emerald-100"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:inline">AI Assist</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Quick Actions</Label>
                <div className="grid grid-cols-1 gap-1">
                  {aiQuickActions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8 text-xs hover:bg-emerald-50"
                      onClick={() => generateContent(action.prompt, action.options)}
                      disabled={isGenerating}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-medium">Custom Prompt</Label>
                <Input
                  placeholder="Describe what to write..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      generateContent(aiPrompt);
                      setAiPrompt("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="w-full h-8 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    generateContent(aiPrompt);
                    setAiPrompt("");
                  }}
                  disabled={isGenerating || !aiPrompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text Formatting Group */}
      <div className="flex items-center gap-0.5">
        <Button
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
          title="Bold (Cmd+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8 p-0"
          title="Italic (Cmd+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-8 w-8 p-0"
          title="Underline (Cmd+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="h-8 w-8 p-0"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive("highlight") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className="h-8 w-8 p-0"
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Headings Group */}
      <div className="flex items-center gap-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
              <span className="text-sm font-medium">
                {editor.isActive("heading", { level: 1 }) ? "H1" :
                 editor.isActive("heading", { level: 2 }) ? "H2" :
                 editor.isActive("heading", { level: 3 }) ? "H3" :
                 editor.isActive("heading", { level: 4 }) ? "H4" :
                 editor.isActive("heading", { level: 5 }) ? "H5" :
                 editor.isActive("heading", { level: 6 }) ? "H6" :
                 "Paragraph"}
              </span>
              <MoreHorizontal className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
              Paragraph
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              Heading 3
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
              Heading 4
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}>
              Heading 5
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}>
              Heading 6
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists & Alignment */}
      <div className="flex items-center gap-0.5">
        <Button
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Insert Group */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={convertMarkdown}
          className="h-8 px-2 gap-1"
          title="Convert Markdown (selection or whole document)"
        >
          <Code className="h-4 w-4" />
          <span className="text-xs hidden sm:inline">MD</span>
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Insert Image">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="image-url" className="text-xs font-medium">Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="image-url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" onClick={addImage} disabled={!imageUrl} className="h-8">
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={editor.isActive("link") ? "secondary" : "ghost"} 
              size="sm" 
              className="h-8 w-8 p-0"
              title="Insert Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="link-url" className="text-xs font-medium">URL</Label>
                <Input
                  id="link-url"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              {editor.state.selection.empty && (
                <div className="space-y-2">
                  <Label htmlFor="link-text" className="text-xs font-medium">Text</Label>
                  <Input
                    id="link-text"
                    placeholder="Link text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                {editor.isActive("link") && (
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => editor.chain().focus().unsetLink().run()}
                    className="h-8"
                  >
                    Unlink
                  </Button>
                )}
                <Button size="sm" onClick={addLink} disabled={!linkUrl} className="h-8">
                  {editor.isActive("link") ? "Update" : "Insert"}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="sm"
          onClick={insertTable}
          className="h-8 w-8 p-0"
          title="Insert Table"
        >
          <TableIcon className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="h-8 w-8 p-0"
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="h-8 w-8 p-0"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1" />

      {/* History */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  className = "",
}: TiptapEditorProps) {
  const normalizedContent = normalizeIncomingContent(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default, use CodeBlockLowlight instead
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: 50000,
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg shadow-sm my-4",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "bg-muted p-4 rounded-lg font-mono text-sm my-4 overflow-x-auto",
        },
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
    content: normalizedContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[300px] p-6 max-w-none",
      },
      handlePaste: (view, event) => {
        try {
          const clipboard = event.clipboardData;
          if (!clipboard) return false;

          // If HTML exists, let TipTap handle it.
          const html = clipboard.getData("text/html");
          if (html && html.trim()) return false;

          const text = clipboard.getData("text/plain");
          if (!text || !looksLikeMarkdown(text)) return false;

          const converted = markdownToHtml(text);
          if (!converted.trim()) return false;

          const sanitized = sanitizeHtml(converted);
          const dom = document.createElement("div");
          dom.innerHTML = sanitized;

          const parser = ProseMirrorDOMParser.fromSchema(view.state.schema);
          const slice = parser.parseSlice(dom, { preserveWhitespace: true });

          const tr = view.state.tr.replaceSelection(slice);
          view.dispatch(tr);
          return true;
        } catch {
          return false;
        }
      },
    },
    immediatelyRender: false,
  });

  // Sync content when it changes externally (e.g., when editing an existing post)
  useEffect(() => {
    if (!editor) return;

    const incoming = normalizeIncomingContent(content);
    const currentContent = editor.getHTML();
    if (incoming && incoming !== currentContent) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [content, editor]);

  const characterCount = editor?.storage?.characterCount?.characters() || 0;
  const wordCount = editor?.storage?.characterCount?.words() || 0;

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-background shadow-sm", className)}>
      <MenuBar editor={editor} />
      
      {editor && (
        <BubbleMenu
          editor={editor}
          appendTo={() => document.body}
          options={{ strategy: "fixed" }}
          style={{ zIndex: 10000 }}
        >
          <div className="flex items-center gap-1 p-1 bg-background border border-border rounded-lg shadow-lg">
            <Button
              variant={editor.isActive("bold") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("italic") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("strike") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className="h-8 w-8 p-0"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("highlight") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className="h-8 w-8 p-0"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </div>
        </BubbleMenu>
      )}

      {editor && (
        <FloatingMenu
          editor={editor}
          appendTo={() => document.body}
          options={{ strategy: "fixed" }}
          style={{ zIndex: 10000 }}
        >
          <div className="flex items-center gap-1 p-1 bg-background border border-border rounded-lg shadow-lg">
            <Button
              variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className="h-8 w-8 p-0"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className="h-8 w-8 p-0"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className="h-8 w-8 p-0"
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className="h-8 w-8 p-0"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>
        </FloatingMenu>
      )}

      <div className="bg-white min-h-[400px]">
        <EditorContent editor={editor} />
      </div>
      
      <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground flex justify-between bg-muted/10">
        <div className="flex gap-4">
          <span>{wordCount} words</span>
          <span>{characterCount} characters</span>
        </div>
        <div className="flex gap-2">
          {editor?.isFocused ? (
            <span className="text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" /> Editing
            </span>
          ) : (
            <span>Saved</span>
          )}
        </div>
      </div>
    </div>
  );
}
