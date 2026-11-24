import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
} from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { normalizePranchaBodyHtml } from '@/lib/lodge-prancha-html'

interface LodgePranchaBodyEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

function safeEditorHtml(editor: {
  isDestroyed: boolean
  getHTML: () => string
}): string | null {
  if (editor.isDestroyed) return null
  try {
    return editor.getHTML()
  } catch {
    return null
  }
}

/** Editor enxuto da prancha: negrito, itálico, sublinhado e alinhamento. */
export function LodgePranchaBodyEditor({
  content,
  onChange,
  placeholder = 'Escreva o pedido com Enter para quebrar linha...',
}: LodgePranchaBodyEditorProps) {
  const editor = useEditor({
    // TipTap 3: Underline já vem no StarterKit — não registrar de novo.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        listItem: false,
        bulletList: false,
        orderedList: false,
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['paragraph'] }),
    ],
    content: normalizePranchaBodyHtml(content) || '<p></p>',
    onUpdate: ({ editor: current }) => {
      const html = safeEditorHtml(current)
      if (html != null) onChange(html)
    },
    editorProps: {
      attributes: {
        class:
          'prancha-tiptap-editor min-h-[220px] max-h-[360px] overflow-y-auto px-3 py-2 focus:outline-none text-sm leading-relaxed',
      },
    },
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const next = normalizePranchaBodyHtml(content) || '<p></p>'
    const current = safeEditorHtml(editor)
    if (current == null || next === current) return
    editor.commands.setContent(next)
  }, [content, editor])

  if (!editor || editor.isDestroyed) return null

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-2">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Negrito"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Itálico"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Sublinhado"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'left' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
          aria-label="Alinhar à esquerda"
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'center' })}
          onPressedChange={() =>
            editor.chain().focus().setTextAlign('center').run()
          }
          aria-label="Centralizar"
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'justify' })}
          onPressedChange={() =>
            editor.chain().focus().setTextAlign('justify').run()
          }
          aria-label="Justificar"
        >
          <AlignJustify className="h-4 w-4" />
        </Toggle>
      </div>
      <EditorContent editor={editor} />
      <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">
        Enter = novo parágrafo · Shift+Enter = quebra de linha. A prévia
        reduz a fonte automaticamente para caber na folha A4.
      </p>
    </div>
  )
}
