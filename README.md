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

Un exemple de lancement avec Docker Compose est disponible dans `docker-compose.yml`.

Pour demarrer :

```bash
docker compose up -d
```
