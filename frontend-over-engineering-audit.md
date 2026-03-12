# Audit Over-Engineering — Frontend RPMA v2

## Résumé exécutif
Le frontend de RPMA v2 souffre d'un sur-architecturage significatif, résultat d'une symétrie dogmatique avec le Domain-Driven Design (DDD) du backend rustique. Des couches entières (`api`, `ipc`, `services`, `hooks`) sont systématiquement créées pour des fonctionnalités triviales, agissant uniquement comme des "pass-through" qui alourdissent la base de code sans apporter de valeur. La double implémentation de la couche IPC (un fichier central `client.ts` géant en parallèle de multiples `*.ipc.ts` de domaine) et la présence de fonctionnalités "fantômes" (comme le 2FA) complexifient inutilement le maintien de cette application locale.

## Tableau de synthèse

| Domaine       | Pages / composants | Hooks / stores | IPC / API / services | Score OE | Verdict |
|---------------|--------------------|----------------|----------------------|----------|---------|
| organizations | 0 / 1              | 1 / 0          | 1 / 2 / 0            | 5/5      | Architecture "coquille vide", 100% pass-through. |
| settings      | 0 / 8              | 3 / 0          | 1 / 4 / 4            | 4/5      | Couches services/api excessives pour des préférences locales. |
| documents     | 0 / 2              | 1 / 0          | 0 / 3 / 2            | 4/5      | Abstractions vides uniquement pour un composant d'upload. |
| notifications | - / -              | - / 1          | - / - / -            | 5/5      | Domaine lourd avec un store Zustand pour un composant tiroir. |
| inventory     | 0 / 12             | 4 / 0          | 1 / 5 / 0            | 3/5      | Découpage UI justifié, mais hooks et API wrappent du vide. |
| sync          | 0 / 3              | 6 / 0          | 0 / 3 / 2            | 3/5      | Complexe mais en partie justifié par la gestion de la queue offline. |
| auth          | 0 / 4              | 7 / 0          | 1 / 6 / 0            | 3/5      | Sécurité centralisée mais trop de hooks d'écrans fragmentés. |

*Note: Le nombre de pages/fichiers se base sur le comptage direct des fichiers présents dans chaque dossier de domaine.*

## Analyse détaillée par domaine

### `organizations` — Score : 5/5

**Structure actuelle :**
- pages : 0 (intégré dans settings)
- components : 1 (`OrganizationSettingsTab.tsx`)
- hooks : 1 (`useOnboardingCheck.ts`)
- ipc : 1 (`organization.ipc.ts`)
- api : 2 (`useOrganization.ts`, `useOnboarding.ts`)
- services : 0

**Ce qui est justifié :**
- L'isolation du formulaire des paramètres d'organisation (via composant).

**Signes de sur-ingénierie :**
- [x] Structure de dossiers créée pour refléter le backend alors qu'il n'y a qu'un seul écran de configuration.
- [x] L'API (`useOrganization.ts`) n'est qu'un simple wrapper sur `useQuery` et `organizationIpc`.
- [x] Le wrapper IPC (`organization.ipc.ts`) recrée des interfaces manuelles complètes (`Organization`, `UpdateOrganizationRequest`) au lieu d'utiliser les types TS-RS autogénérés, et se limite à appeler `safeInvoke`.

**Recommandation :**
Réduire à une structure minimale. Supprimer l'IPC de domaine et appeler directement l'API centralisée ou consolider dans le domaine `settings`.

**Gain estimé :**
- 4 fichiers supprimés (`api/`, `ipc/`, `hooks/` superflus).
- Élimination des types dupliqués.
- Un niveau de couplage réduit en enlevant 3 rebonds pour une simple requête de lecture.

---

### `settings` — Score : 4/5

**Structure actuelle :**
- pages : 0
- components : 8 (différents onglets)
- hooks : 3 (`usePerformanceSettings`, `usePreferencesForm`, `useSecuritySettings`)
- ipc : 1 (`settings.ipc.ts`)
- api : 4 fichiers (e.g., `useSettings.ts`, `useSettingsActions.ts`)
- services : 4 (`configuration.service.ts`, `settings-client.service.ts` etc.)

**Ce qui est justifié :**
- Les multiples composants (`AccessibilityTab`, `NotificationsTab`, etc.) car l'écran est objectivement dense.
- Les form abstractions (`usePreferencesForm`) pour simplifier les composants UI.

**Signes de sur-ingénierie :**
- [x] Le dossier `services/` est inutile. Transformer ou stocker une configuration locale ne justifie pas 4 fichiers "Service" faisant office de middle-men avant le hook.
- [x] Le dossier `api/` avec `useSettingsActions.ts` est du pass-through pur qui pourrait être fusionné directement dans les composants ou un store Zustand minimaliste.

**Recommandation :**
Fusionner des fichiers et supprimer des couches. Se passer totalement de `services/` et centraliser les calls dans les `hooks/` formulaires.

**Gain estimé :**
- 5 à 6 fichiers supprimés (`services/` et `api/` fragmentés).
- Complexité cognitive réduite sur le flux de sauvegarde.

---

### `documents` — Score : 4/5

**Structure actuelle :**
- pages : 0
- components : 2 (`PhotoUpload.tsx`)
- hooks : 1 (`usePhotoUpload.ts`)
- ipc : 0
- api : 3 (provider, types, index)
- services : 2 (`task-photo.service.ts`)

**Ce qui est justifié :**
- Le hook `usePhotoUpload.ts` centralise une vraie logique d'upload.

**Signes de sur-ingénierie :**
- [x] Créer tout un dossier `services/` et `api/` pour un seul comportement (l'upload de photo) lié à une tâche.
- [x] Le provider `DocumentsProvider.tsx` pour un seul contexte non global est prématuré.

**Recommandation :**
Réduire à une structure minimale. Tout ramener dans le dossier `components/` ou un dossier global `shared/` pour les photos de tâches.

**Gain estimé :**
- 4 fichiers supprimés.
- Disparition de la sémantique "Domaine document" qui est trompeuse.

---

### `auth` — Score : 3/5

**Structure actuelle :**
- components : 4 (Login, Signup, etc.)
- hooks : 7 (`useLoginForm`, `useSignupForm`, plus un hook par page de routing)
- api : 6 fichiers

**Ce qui est justifié :**
- Provider global d'authentification (`AuthProvider.tsx` de 8000 octets est central).
- L'isolation des formulaires.

**Signes de sur-ingénierie :**
- [x] L'extrême fragmentation des hooks de pages (`useDashboardPage.ts`, `useHomePage.ts`). Un hook pour englober la logique métier d'une page qui a 1 composant est inutile.
- [x] Gestion de "features fantômes" : Le frontend maintient tout un panel de commandes 2FA qui échouent délibérément en `NOT_IMPLEMENTED`.

**Recommandation :**
Fusionner des fichiers. Ramener la logique de routing dans les pages correspondantes et supprimer le code mort lié au 2FA (voir `NOT_IMPLEMENTED_COMMANDS`).

**Gain estimé :**
- 5 fichiers supprimés (les hooks de "page").
- Environ 100 lignes de code mort (gestion du 2FA dans IPC/utils) nettoyées.

---

## Problèmes transverses

### 1. Couche IPC
L'architecture IPC est redondante et excessive. On retrouve un "god-file" centralisé `lib/ipc/client.ts` pesant près de **1475 lignes**, qui expose des méthodes asynchrones (plus de 35 implémentées, e.g. `client.tasks.create`, `client.auth.changePassword`). 
Parallèlement, on a des wrappers par domaine (e.g. `organization.ipc.ts`) qui dupliquent les interfaces `CreateOrganizationRequest` à la main et réinventent l'invocation. 
Ensuite, une structure `safeInvoke` dans `lib/ipc/utils.ts` filtre même des commandes masquées (via le Set `NOT_IMPLEMENTED_COMMANDS` pour le 2FA). 
Il y a 3 couches pour un simple appel IPC, sans compter le mapping vers TanStack Query.

### 2. State management
Zustand est utilisé de manière erratique. Dans le domaine `notifications`, un `notificationStore.ts` complet est créé uniquement pour persister un flag `isPanelOpen`, le `unreadCount` et des array de messages locaux. Le state local devrait être conservé dans les composants (React Context ou useState local), réservant Zustand pour des états métier globaux vitaux ou hors ligne (ce qui est bien fait dans `sync`). Les queries s'empilent via des custom hooks inutiles (`useOrganization.ts` wrappant simplement l'IPC).

### 3. Component architecture
Les composants sont très segmentés. L'obsession pour un Clean Architecture "par domaine" a incité les développeurs à créer un arbre DDD entier (`api/`, `components/`, `hooks/`, `services/`) dès lors qu'un seul composant, tel que `PhotoUpload.tsx` ou `OrganizationSettingsTab.tsx`, était requis. Cela génère des structures de dossiers quasi vides qui n'encapsulent aucune logique partagée, multipliant les imports `../` et la dette de navigation pour les développeurs.

## Plan d'action priorisé

### 🔴 Priorité 1 — Supprimer / fusionner immédiatement
- **Nettoyer les features fantômes :** Supprimer toutes les références, types et gestions des commandes 2FA non implémentées (`NOT_IMPLEMENTED_COMMANDS` dans `utils.ts`, `test-adapter.ts`).
- **Supprimer les "domaine-coquilles" :** Fusionner l'unique feature de `organizations` (ses settings) dans le domaine `settings`. Écraser l'arborescence complète de `documents` vers un dossier feature plus plat.

### 🟠 Priorité 2 — Réduire le boilerplate par domaine
- **Aplatir les requêtes simples :** Dès qu'un hook `api/useFeature.ts` se limite à retourner `useQuery({ queryKey: [...], queryFn: () => safeInvoke(...) })` et n'a pas de logique métier de cache, le supprimer en appelant directement l'IPC via QueryClient dans le composant ou centraliser les hooks de mutation.
- **Éliminer les "Services" superflus :** Supprimer le sous-dossier `services/` dans des domaines comme `settings` et `documents`, et rapatrier la logique triviale dans les hooks métiers ou les IPC clients.

### 🟡 Priorité 3 — Simplifier l'infrastructure frontend
- **Refactor de l'IPC (`client.ts` vs `*.ipc.ts`) :** Choisir une seule convention. Soit le fichier monolithique `client.ts` (découpé correctement), soit les IPC de domaine, mais **ne pas conserver les deux**.
- **Typage généré :** Remplacer immédiatement les typages manuels dupliqués (`Organization`, `OrganizationSettings` dans `organization.ipc.ts`) par les imports en provenance de `src/types/` générés via TS-RS.

## Heuristiques pour la suite
- Si un domaine n'a qu'1 écran et 2 hooks simples (ex: `organizations`), il ne mérite probablement pas `api/ + hooks/ + services/ + ipc/ + components/`.
- Si un hook ne fait qu'appeler `useQuery` sans logique additionnelle ou gestion de dépendance complexe, il doit être supprimé ou fusionné.
- Si un composant n'est utilisé qu'une fois et n'encapsule aucune logique (ex: layout de sous-onglet simple), il doit rester dans le fichier écran.
- Si une abstraction (comme le dossier `services/` frontend) existe uniquement pour faire écho à une couche "Application/Domaine" du backend, elle doit être remise en question de toute urgence sur le frontend (où la complexité réseau/état est déjà gérée par React Query).