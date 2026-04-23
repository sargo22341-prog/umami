/**
 * Lit une variable d'environnement en prenant en priorite window.__ENV__
 * (injection runtime Docker via docker-entrypoint.sh) puis import.meta.env
 * (variables Vite injectees au build).
 *
 * Cela permet d'utiliser une image Docker generique sans rebuild a chaque
 * changement de configuration.
 */
export function getEnv(key: keyof NonNullable<Window["__ENV__"]>): string {
  if (typeof window !== "undefined" && window.__ENV__?.[key]) {
    return window.__ENV__[key]!
  }
  return (import.meta.env[key] as string) ?? ""
}

/**
 * Indique si l'app tourne dans un conteneur Docker (env-config.js charge).
 * En dev Vite et en prod sans Docker, window.__ENV__ est undefined.
 */
export function isDockerRuntime(): boolean {
  return typeof window !== "undefined" && window.__ENV__ !== undefined
}
