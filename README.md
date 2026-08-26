# GMS Contrôle — Démo Vercel (mock)

Frontend **autonome** pour présentation client : **aucun backend**, **aucune base de données**.

## Déploiement Vercel

1. Importer le dépôt sur [vercel.com](https://vercel.com)
2. **Root Directory** : `vercel`
3. Framework : Next.js (détecté automatiquement)
4. Variable d'environnement (déjà dans `.env.production`) :
   ```
   NEXT_PUBLIC_MOCK_API=true
   ```
5. Déployer

## Développement local

```bash
cd vercel
copy .env.local.example .env.local
npm install
npm run dev
```

→ http://localhost:3000

## Comptes démo

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `admin@groupeservice.local` | n'importe lequel |
| Contrôleur | `amine@groupeservice.local` | n'importe lequel |
| Contrôleur | `sara@groupeservice.local` | n'importe lequel |
| Contrôleur | `karim@groupeservice.local` | n'importe lequel |

## Données mock

- 6 établissements (Casablanca / Rabat)
- 5 contrôles historiques
- Planning hebdomadaire
- Rapports, cartographie, statistiques
- Création de contrôles (session en cours)

Les modifications (CRUD admin, planning) fonctionnent **en mémoire** et disparaissent au rechargement de la page.

## Structure

```
vercel/
  app/              Pages Next.js
  components/       UI
  lib/
    mock-api.ts     Routeur API mock
    mock/           Données & store
  public/brand/     Logo Mondial Service
  vercel.json       Config déploiement
```
