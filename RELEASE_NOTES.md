# Release notes

- Correction de l'affichage mobile du mode cuisine : le controle "Pour X portion(s)" reste visible et utilisable a cote du titre Ingredients.
- Ajout de la publication de releases avec ce fichier comme note de version.
- Ajout de la publication de release cote Gitea apres le bump automatique et la publication des images Docker.
- Modification du workflow GitHub : il ne bump plus la version et utilise uniquement la version deja presente dans `package.json`.
- Mise a jour des dependances npm et de l'outillage de build/lint.
- Ajustement ESLint pour des regles React Hooks trop strictes avec le code existant.
- Amelioration de la remontee d'erreur des recettes favorites en conservant la cause originale.
