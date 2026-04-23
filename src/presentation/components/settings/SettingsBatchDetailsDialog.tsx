import { useMemo, useState } from "react"
import { ChevronDown, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils.ts"
import type { SettingsBatchDetailItem } from "./settingsPage.types.ts"
import {
  Badge, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"

export type SettingsBatchDetailsSection = {
  id: string
  title: string
  description: string
  items: SettingsBatchDetailItem[]
  emptyLabel: string
}

type SettingsBatchDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  sections: SettingsBatchDetailsSection[]
  onRecipeOpen: (slug: string) => void
}

type DetailSectionProps = {
  title: string
  description: string
  items: SettingsBatchDetailItem[]
  defaultOpen?: boolean
  onRecipeOpen: (slug: string) => void
  emptyLabel: string
}

function DetailSection({
  title,
  description,
  items,
  defaultOpen = false,
  onRecipeOpen,
  emptyLabel,
}: DetailSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/10">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/35"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <Badge variant="outline" className="text-xs font-semibold">
              {items.length} recette{items.length > 1 ? "s" : ""}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-border/40 px-4 pb-4 pt-4">
            {items.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-dashed border-border/60 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
                {emptyLabel}
              </div>
            ) : (
              items.map((item) => (
                <article
                  key={`${title}-${item.slug}`}
                  className="rounded-[var(--radius-lg)] border border-border/50 bg-background p-4"
                >
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Link
                        to={`/recipes/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-foreground underline-offset-2 hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                      {item.statusCode != null && (
                        <p className="text-xs text-muted-foreground">
                          Code retour : {item.statusCode}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => onRecipeOpen(item.slug)}>
                        Ouvrir ici
                      </Button>
                      <Button type="button" variant="outline" size="sm" asChild className="gap-1.5">
                        <Link to={`/recipes/${item.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Nouvel onglet
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function SettingsBatchDetailsDialog({
  open,
  onOpenChange,
  title,
  description,
  sections,
  onRecipeOpen,
}: SettingsBatchDetailsDialogProps) {
  const defaultOpenSection = useMemo(() => sections.find((section) => section.items.length > 0)?.id ?? sections[0]?.id, [sections])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl sm:w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(70vh,720px)] space-y-4 overflow-y-auto pr-1">
          {sections.map((section) => (
            <DetailSection
              key={section.id}
              title={section.title}
              description={section.description}
              items={section.items}
              defaultOpen={defaultOpenSection === section.id}
              onRecipeOpen={onRecipeOpen}
              emptyLabel={section.emptyLabel}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
