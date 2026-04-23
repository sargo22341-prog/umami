# Umami

Ce projet est a la base un fork de [bonap](https://github.com/AymericLeFeyer/bonap).

## Description

Umami est une application web basee sur Vite, React et Express.

## Prerequis

- Node.js
- npm
- Une instance Mealie accessible

## Configuration

Copiez `.env.example` vers `.env` puis adaptez les variables si besoin :

```env
VITE_MEALIE_URL=https://mealie.example.com
```

Variables disponibles :

- `VITE_MEALIE_URL` : URL de votre instance Mealie
- `VITE_THEME` : `light`, `dark` ou `system`
- `VITE_ACCENT_COLORS` : couleur d'accent au format `rgba(...)`

## Lancement en local

Installez les dependances :

```bash
npm install
```

Demarrez le projet :

```bash
npm run dev
```

## Scripts utiles

- `npm run dev` : lance l'application en developpement
- `npm run dev:frontend` : lance uniquement le frontend Vite
- `npm run dev:proxy` : lance le proxy de recherche de recettes
- `npm run build` : genere le build de production
- `npm run lint` : verifie le code avec ESLint
- `npm run preview` : previsualise le build

## Docker

Images Docker publiees :

- `ghcr.io/sargo22341-prog/umami:latest`
- `ghcr.io/sargo22341-prog/umami-recipes-search-proxy:latest`

Exemple minimal :

```yaml
services:
  umami:
    image: ghcr.io/sargo22341-prog/umami:latest
    container_name: umami
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      VITE_MEALIE_URL: "https://mealie.example.com"
    depends_on:
      - recipes-search-proxy

  recipes-search-proxy:
    image: ghcr.io/sargo22341-prog/umami-recipes-search-proxy:latest
    container_name: umami-recipes-search-proxy
    restart: unless-stopped
```

Exemple complet :

```yaml
services:
  umami:
    image: ghcr.io/sargo22341-prog/umami:latest
    container_name: umami
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      VITE_MEALIE_URL: "https://mealie.example.com"
      VITE_THEME: "system"
      # VITE_ACCENT_COLORS: "rgba(223, 89, 27, 1)"
    depends_on:
      recipes-search-proxy:
        condition: service_started
    networks:
      - umami

  recipes-search-proxy:
    image: ghcr.io/sargo22341-prog/umami-recipes-search-proxy:latest
    container_name: umami-recipes-search-proxy
    restart: unless-stopped
    expose:
      - "3001"
    networks:
      - umami

networks:
  umami:
    name: umami
```

Fichiers inclus dans le depot :

- `docker-compose.example.yml`
- `docker-compose.full.yml`

Pour demarrer :

```bash
docker compose -f docker-compose.example.yml up -d
```

Puis ouvrez `http://localhost:8080`.

Pensez a remplacer `VITE_MEALIE_URL` par l'URL de votre instance Mealie.
