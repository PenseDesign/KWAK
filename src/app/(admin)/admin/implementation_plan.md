# Plan - Création utilisateur avec abonnement direct par l'admin

## Fichiers à modifier

### 1. `src/app/actions.ts` — `adminCreateUser`
- Ajouter `full_name`, `quartier` dans les paramètres récupérés du FormData
- Passer ces champs à la RPC `create_user_by_admin` (si supporté) ou faire un upsert profil après
- Après la création du compte, si `type_forfait` est renseigné : créer l'abonnement directement dans la table `abonnements` (actif, avec date_debut/date_fin calculées)

### 2. `src/components/admin/UsersTable.tsx` — Modal création
- Ajouter champ `full_name` (Nom complet)
- Ajouter champ `quartier`
- Ajouter section "Abonnement (optionnel)" avec select du forfait
