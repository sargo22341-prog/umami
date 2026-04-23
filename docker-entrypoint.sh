#!/bin/sh
set -e

# Génère /usr/share/nginx/html/env-config.js avec les variables d'environnement runtime.
# Ce fichier expose window.__ENV__ et permet de reconfigurer l'app sans rebuild de l'image.
#
# Variables supportées :
#   VITE_MEALIE_URL    — URL Mealie accessible depuis le navigateur (ex: http://mealie:9000)
#   VITE_THEME         — Theme par defaut optionnel
#   VITE_ACCENT_COLORS — Couleur d'accent optionnelle

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__ENV__ = {
  VITE_MEALIE_URL: "${VITE_MEALIE_URL:-}",
  VITE_THEME: "${VITE_THEME:-}",
  VITE_ACCENT_COLORS: "${VITE_ACCENT_COLORS:-}"
};
EOF

# Retirer le slash final si présent
VITE_MEALIE_URL="${VITE_MEALIE_URL%/}"
export VITE_MEALIE_URL

# Substituer les variables dans la config nginx
envsubst '${VITE_MEALIE_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
