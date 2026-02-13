"use client"

import { useState } from "react"
import { 
  Bold, Italic, Underline, List, ListOrdered, Link2, Image, 
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3,
  Code, Quote, Undo, Redo, Eye, Code2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RichEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

const ToolButton = ({ 
  icon: Icon, 
  onClick, 
  active, 
  title 
}: { 
  icon: React.ElementType
  onClick: () => void
  active?: boolean
  title: string
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "p-2 rounded hover:bg-gray-100 transition-colors",
      active && "bg-blue-100 text-blue-600"
    )}
  >
    <Icon className="w-4 h-4" />
  </button>
)

export function RichEditor({ value, onChange, placeholder, minHeight = "200px" }: RichEditorProps) {
  const [showHtml, setShowHtml] = useState(false)

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
  }

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.innerHTML)
  }

  const insertLink = () => {
    const url = prompt("URL:")
    if (url) execCommand("createLink", url)
  }

  const insertImage = () => {
    const url = prompt("Image URL:")
    if (url) execCommand("insertImage", url)
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 bg-gray-50">
        <ToolButton icon={Undo} onClick={() => execCommand("undo")} title="Undo" />
        <ToolButton icon={Redo} onClick={() => execCommand("redo")} title="Redo" />
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <ToolButton icon={Bold} onClick={() => execCommand("bold")} title="Bold" />
        <ToolButton icon={Italic} onClick={() => execCommand("italic")} title="Italic" />
        <ToolButton icon={Underline} onClick={() => execCommand("underline")} title="Underline" />
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <ToolButton icon={Heading1} onClick={() => execCommand("formatBlock", "h1")} title="Heading 1" />
        <ToolButton icon={Heading2} onClick={() => execCommand("formatBlock", "h2")} title="Heading 2" />
        <ToolButton icon={Heading3} onClick={() => execCommand("formatBlock", "h3")} title="Heading 3" />
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <ToolButton icon={AlignLeft} onClick={() => execCommand("justifyLeft")} title="Align left" />
        <ToolButton icon={AlignCenter} onClick={() => execCommand("justifyCenter")} title="Center" />
        <ToolButton icon={AlignRight} onClick={() => execCommand("justifyRight")} title="Align right" />
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <ToolButton icon={List} onClick={() => execCommand("insertUnorderedList")} title="List" />
        <ToolButton icon={ListOrdered} onClick={() => execCommand("insertOrderedList")} title="Numbered list" />
        <ToolButton icon={Quote} onClick={() => execCommand("formatBlock", "blockquote")} title="Quote" />
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <ToolButton icon={Link2} onClick={insertLink} title="Insert link" />
        <ToolButton icon={Image} onClick={insertImage} title="Insert image" />
        <ToolButton icon={Code} onClick={() => execCommand("formatBlock", "pre")} title="Code" />
        
        <div className="flex-1" />
        <ToolButton 
          icon={showHtml ? Eye : Code2} 
          onClick={() => setShowHtml(!showHtml)} 
          active={showHtml}
          title={showHtml ? "Preview" : "HTML Code"} 
        />
      </div>

      {/* Editor */}
      {showHtml ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 font-mono text-sm focus:outline-none resize-none"
          style={{ minHeight }}
        />
      ) : (
        <div
          contentEditable
          onInput={handleEditorInput}
          dangerouslySetInnerHTML={{ __html: value }}
          className="p-4 focus:outline-none prose prose-sm max-w-none"
          style={{ minHeight }}
          data-placeholder={placeholder}
        />
      )}
    </div>
  )
}

interface SimpleEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export function SimpleEditor({ value, onChange, placeholder, rows = 4 }: SimpleEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
    />
  )
}
