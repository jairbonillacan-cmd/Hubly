"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { Bold, Heading2, Italic, ListOrdered } from "lucide-react";
import { notebookToHtml } from "@/lib/notebook-content";
import {
  HublyClipboardIcon as CheckSquare,
  HublyRedoIcon as Redo2,
  HublyRowsIcon as List,
  HublyUndoIcon as Undo2,
} from "@/components/app/icons/DuotoneIcons";

export function NotebookEditor({
  initialContent,
  onChange,
  ariaLabel = "Contenido de la libreta",
}: {
  initialContent: string;
  onChange: (html: string) => void;
  ariaLabel?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: notebookToHtml(initialContent),
    editorProps: { attributes: { class: "hubly-note-editor", "aria-label": ariaLabel, role: "textbox" } },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      heading: current?.isActive("heading", { level: 2 }) ?? false,
      bullet: current?.isActive("bulletList") ?? false,
      ordered: current?.isActive("orderedList") ?? false,
      task: current?.isActive("taskList") ?? false,
    }),
  });

  const tools = [
    { label: "Negrita", Icon: Bold, on: active?.bold, run: () => editor?.chain().focus().toggleBold().run() },
    { label: "Cursiva", Icon: Italic, on: active?.italic, run: () => editor?.chain().focus().toggleItalic().run() },
    { label: "Título", Icon: Heading2, on: active?.heading, run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Lista", Icon: List, on: active?.bullet, run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: "Lista numerada", Icon: ListOrdered, on: active?.ordered, run: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: "Lista de tareas", Icon: CheckSquare, on: active?.task, run: () => editor?.chain().focus().toggleTaskList().run() },
    { label: "Deshacer", Icon: Undo2, on: false, run: () => editor?.chain().focus().undo().run() },
    { label: "Rehacer", Icon: Redo2, on: false, run: () => editor?.chain().focus().redo().run() },
  ];

  return (
    <div className="hubly-note-shell">
      <div className="hubly-note-toolbar" role="toolbar" aria-label="Formato de la nota">
        {tools.map(({ label, Icon, on, run }) => (
          <button key={label} type="button" title={label} aria-label={label} aria-pressed={Boolean(on)} onClick={run}>
            <Icon size={14} />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
