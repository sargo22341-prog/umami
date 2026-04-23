// Router
import { Link } from "react-router-dom"

// Icons (lucide)
import {
  Check, Film, FolderOpen, Info, Loader2,
  LogOut, Monitor, Moon, Paintbrush, Palette, Ruler,
  Server, Sun, Tag, Tags, UtensilsCrossed, Wrench,
} from "lucide-react"

// Types
import type { Theme } from "@/infrastructure/theme/ThemeService.ts"

// Constants
import { ACCENT_COLORS } from "@/infrastructure/theme/ThemeService.ts"

// Utils
import { cn } from "@/lib/utils.ts"

// Hooks - Settings
import { useSettingsJowVideoBatch } from "hooks/settings/provider/useSettingsJowVideoBatch.ts"
import {
  useSettingsAppearance, useSettingsSession
} from "hooks/settings"
// Components - Settings
import { CollapsibleSection, SettingsConfirmDialog, SettingsQuickActionsSection } from "components/settings"

// UI Components
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
  Label, Input, Button,
  ColorPickerField
} from "components/ui"

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Systeme", icon: Monitor },
]

export function SettingsPage() {
  const appearance = useSettingsAppearance()
  const session = useSettingsSession()
  const jowVideoBatch = useSettingsJowVideoBatch()

  return (
    <>
      <SettingsConfirmDialog
        open={jowVideoBatch.confirmOpen}
        onOpenChange={jowVideoBatch.setConfirmOpen}
        title="Importer automatiquement les videos Jow ?"
        description="Le traitement va parcourir les recettes existantes, ignorer celles qui ne viennent pas de Jow ou qui ont deja des assets video, puis importer automatiquement la video et le JSON de chapitres quand une source Jow exploitable est detectee."
        note="Le traitement continue meme si une recette echoue."
        confirmLabel="Lancer l'import batch"
        confirmIcon={<Film className="h-4 w-4" />}
        onConfirm={() => {
          void jowVideoBatch.run()
        }}
      />

      <Dialog open={appearance.accentPickerOpen} onOpenChange={appearance.setAccentPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Couleur principale personnalisee</DialogTitle>
            <DialogDescription>
              Choisissez une couleur d&apos;accent pour l&apos;interface.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <ColorPickerField value={appearance.pendingAccentHex} onChange={appearance.setPendingAccentHex} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => appearance.setAccentPickerOpen(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={appearance.submitCustomAccentColor}>
                Valider
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-5xl space-y-6">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold">Parametres</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configuration de l&apos;apparence et des connexions.
          </p>
        </div>

        <CollapsibleSection
          icon={<Palette className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/8"
          title="Apparence"
          subtitle="Theme et couleur d'accent"
        >
          <div className="space-y-2.5">
            <Label>Theme</Label>
            <div className="flex gap-2">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => appearance.setTheme(value)}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-lg)] border px-4 py-2.5",
                    "text-sm font-semibold transition-all duration-150",
                    appearance.theme === value
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_1px_3px_rgba(196,92,58,0.25)]"
                      : "border-border bg-card text-foreground hover:bg-secondary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Couleur principale</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Selectionnee :{" "}
                <span className="font-semibold text-foreground">{appearance.accentColor.name}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => appearance.setAccentColor(color)}
                  title={color.name}
                  aria-label={color.name}
                  className={cn(
                    "relative h-9 w-9 rounded-full",
                    "transition-all duration-150 hover:scale-110",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    appearance.accentColor.id === color.id && "ring-2 ring-offset-2 ring-foreground/25 scale-110",
                  )}
                  style={{ backgroundColor: color.color }}
                >
                  {appearance.accentColor.id === color.id && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={appearance.openAccentPicker}
                title="Ajouter une couleur"
                aria-label="Ajouter une couleur"
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full border",
                  "transition-all duration-150 hover:scale-110",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  appearance.accentColor.isCustom
                    ? "ring-2 ring-offset-2 ring-foreground/25 scale-110 border-transparent"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
                style={appearance.hasCustomPreview ? { backgroundColor: appearance.customAccentPreview } : undefined}
              >
                {!appearance.accentColor.isCustom && appearance.hasCustomPreview && (
                  <span className="absolute inset-0 rounded-full bg-background/82" />
                )}
                <Paintbrush
                  className={cn(
                    "relative h-4 w-4",
                    appearance.accentColor.isCustom ? "text-white" : "text-muted-foreground",
                  )}
                />
              </button>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Gestion des donnees"
          icon={<Wrench className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/8"
          subtitle="Maintenance organizer et synchronisation des recettes"
        >
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" asChild className="w-full justify-start gap-2">
                <Link to="/settings/tools">
                  <Wrench className="h-4 w-4" />
                  Gerer les ustensiles
                </Link>
              </Button>
              <Button type="button" variant="outline" asChild className="w-full justify-start gap-2">
                <Link to="/settings/categories">
                  <FolderOpen className="h-4 w-4" />
                  Gerer les categories
                </Link>
              </Button>
              <Button type="button" variant="outline" asChild className="w-full justify-start gap-2">
                <Link to="/settings/tags">
                  <Tag className="h-4 w-4" />
                  Gerer les tags
                </Link>
              </Button>
              <Button type="button" variant="outline" asChild className="w-full justify-start gap-2">
                <Link to="/settings/labels">
                  <Tags className="h-4 w-4" />
                  Gerer les labels
                </Link>
              </Button>
              <Button type="button" variant="outline" asChild className="w-full justify-start gap-2">
                <Link to="/settings/units">
                  <Ruler className="h-4 w-4" />
                  Gerer les unites
                </Link>
              </Button>
              <Button type="button" variant="outline" asChild className="w-full justify-start gap-2">
                <Link to="/settings/foods">
                  <UtensilsCrossed className="h-4 w-4" />
                  Gerer les aliments
                </Link>
              </Button>
            </div>
          </div>
        </CollapsibleSection>

        <SettingsQuickActionsSection />

        <CollapsibleSection
          icon={<Film className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/8"
          title="Providers"
          subtitle="Actions rapides d'import automatique par source"
        >
          <div className="space-y-4">
            <div className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold">Jow</h3>
                <p className="text-sm text-muted-foreground">
                  Scanne les recettes Jow existantes et importe automatiquement la video avec son JSON de chapitres par defaut.
                </p>
              </div>
            </div>

            {(jowVideoBatch.status.state === "running" ||
              jowVideoBatch.status.state === "done" ||
              jowVideoBatch.status.state === "error") && (
                <div className="space-y-3 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">
                      Analyse de {jowVideoBatch.status.processed}/{jowVideoBatch.status.total}
                    </span>
                    <span className="text-muted-foreground">
                      {jowVideoBatch.status.imported} import{jowVideoBatch.status.imported > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${jowVideoBatch.progress}%` }}
                    />
                  </div>
                  {jowVideoBatch.status.currentRecipeName && (
                    <p className="text-sm text-muted-foreground">
                      Recette en cours : <span className="font-medium text-foreground">{jowVideoBatch.status.currentRecipeName}</span>
                    </p>
                  )}
                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <p>Recettes Jow detectees : {jowVideoBatch.status.jowDetected}</p>
                    <p>Importees : {jowVideoBatch.status.imported}</p>
                    <p>Ignorees non Jow : {jowVideoBatch.status.skippedNonJow}</p>
                    <p>Ignorees assets deja presents : {jowVideoBatch.status.skippedExisting}</p>
                    <p>Ignorees sans video : {jowVideoBatch.status.skippedNoVideo}</p>
                    <p>Erreurs : {jowVideoBatch.status.errors}</p>
                  </div>
                  {jowVideoBatch.status.state === "done" && (
                    <p className="text-sm text-[rgba(22,163,74,1)]">Import batch termine.</p>
                  )}
                  {jowVideoBatch.status.state === "error" && (
                    <p className="text-sm text-destructive">{jowVideoBatch.status.message}</p>
                  )}
                </div>
              )}

            <Button
              type="button"
              variant="outline"
              onClick={() => jowVideoBatch.setConfirmOpen(true)}
              disabled={jowVideoBatch.status.state === "running"}
              className={cn(
                "w-full justify-start gap-2",
                jowVideoBatch.status.state === "running" && "bg-secondary text-muted-foreground",
              )}
            >
              {jowVideoBatch.status.state === "running" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Import automatique en cours...
                </>
              ) : (
                <>
                  <Film className="h-4 w-4" />
                  Importer automatiquement les videos Jow
                </>
              )}
            </Button>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          icon={<Server className="h-4 w-4 text-[rgba(50,140,110,1)] dark:text-[rgba(150,210,190,1)]" />}
          iconBg="bg-[rgba(230,245,235,1)] dark:bg-[rgba(40,70,60,1)]"
          title="Connexion Mealie"
          subtitle="URL d'instance et session locale"
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted-foreground/60">
                VITE_MEALIE_URL
              </Label>
              <Input
                readOnly
                value={session.mealieUrl}
                className="bg-secondary/40 font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted-foreground/60">
                Session locale
              </Label>
              <Input
                readOnly
                type="password"
                value={session.hasStoredToken ? "Connecte" : "Non connecte"}
                className="bg-secondary/40 font-mono text-xs"
              />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          icon={<LogOut className="h-4 w-4 text-destructive" />}
          iconBg="bg-destructive/8"
          title="Deconnexion"
          subtitle="Deconnecter le compte actuellement connecte"
        >
          <Button variant="destructive" onClick={() => void session.handleLogout()}>
            Se deconnecter
          </Button>
        </CollapsibleSection>

        <CollapsibleSection
          icon={<Info className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/8"
          title="A propos"
          subtitle={`umami v${__APP_VERSION__} - par Sargo`}
        >
          <div className="flex items-center gap-2">
            <img src="/umami.png" alt="umami" className="h-6 w-6 rounded-md object-cover" />
            <span className="text-sm font-semibold">umami</span>
            <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-mono font-semibold text-muted-foreground">
              v{__APP_VERSION__}
            </span>
          </div>
        </CollapsibleSection>
      </div>
    </>
  )
}
