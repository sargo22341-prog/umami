import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"

// utils  
import { cn } from "@/lib/utils.ts"

const markdownSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "img"],
  attributes: {
    ...defaultSchema.attributes,
    img: ["src", "alt", "width", "height"],
  },
}

function normalizeMediaSrc(src?: string) {
  if (!src) return ""
  return src
}

const markdownComponents: Components = {
  ul: ({ children }) => <ul className="my-2 list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal pl-5">{children}</ol>,
  li: ({ children }) => <li className="my-1">{children}</li>,
  p: ({ children }) => <p className="my-2">{children}</p>,

  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-border px-3 py-2 text-left font-medium">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-2 align-top">
      {children}
    </td>
  ),

  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-border pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),

  code: ({ className, children, ...props }) => {
    const isInline = !className
    return isInline ? (
      <code className="rounded bg-muted px-1.5 py-0.5 text-[0.9em]" {...props}>
        {children}
      </code>
    ) : (
      <pre className="my-3 overflow-x-auto rounded-lg bg-muted p-3">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    )
  },

  img: ({ src, alt, width, height }) => (
    <img
      src={normalizeMediaSrc(typeof src === "string" ? src : "")}
      alt={alt ?? ""}
      width={typeof width === "number" || typeof width === "string" ? width : undefined}
      height={typeof height === "number" || typeof height === "string" ? height : undefined}
      className="my-3 h-auto max-w-full rounded-lg border border-border/50"
    />
  ),
}

export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("max-w-none text-sm leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
        components={markdownComponents}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  )
}