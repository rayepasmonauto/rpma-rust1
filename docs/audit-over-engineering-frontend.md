# Audit Over-Engineering — Frontend RPMA v2

## Résumé exécutif

Le frontend de RPMA v2 est une application Tauri desktop offline-first bien organisée selon les principes DDD, mais présente des signes mesurables de sur-ingénierie dans environ un tiers des domaines. La principale tension vient de la **symétrie stricte avec le backend** : chaque domaine Rust possède un miroir frontend complet (`api/ + components/ + hooks/ + ipc/ + services/`), même quand le domaine UI n'a qu'un ou deux comportements réels. Les domaines `tasks` (92 composants), `interventions` (double système de workflow PPF/générique), et les domaines dormants `bootstrap`, `performance` et `audit` représentent les cibles prioritaires de simplification. On estime un potentiel de réduction de **80 à 100 fichiers** sans perte de fonctionnalité.

---

## Tableau de synthèse

| Domaine           | Pages / composants | Hooks / stores | IPC / API / services | Score OE | Verdict                                       |
|-------------------|--------------------|----------------|----------------------|----------|-----------------------------------------------|
| `tasks`           | 1 page / 92 comp.  | 16 hooks       | 2 ipc / 6 api / 7 svc| 4/5      | Sur-ingénierie significative                 |
| `interventions`   | 4 pages / 17 comp. | 10 hooks       | 3 ipc / 9 api / 8 svc| 4/5      | Double système workflow à unifier            |
| `sync`            | — / 4 comp.        | 8 hooks        | — / 3 api / 2 svc    | 4/5      | `useOfflineQueue` est un placeholder factice |
| `audit`           | — / 1 comp.        | 2 hooks        | — / 4 api / 2 svc    | 4/5      | `useState` au lieu de React Query             |
| `bootstrap`       | — / 1 comp.        | —              | 1 ipc / 4 api        | 5/5      | 8 fichiers pour 2 opérations IPC              |
| `performance`     | — / 0 comp.        | —              | 1 ipc / 3 api / 1 svc| 5/5      | Domaine dormant sans usage UI                |
| `quotes`          | 2 pages / 20 comp. | 9 hooks        | 1 ipc / 3 api / 1 svc| 3/5      | Hooks trop fragmentés, composants OK         |
| `inventory`       | 1 page / 14 comp.  | 4 hooks        | 1 ipc / 5 api        | 3/5      | Structure OK, 2 fichiers server inutiles     |
| `reports`         | — / 13 comp.       | 5 hooks        | 2 ipc / 2 api / 4 svc| 3/5      | Preview sub-composants peut-être excessifs   |
| `notifications`   | 1 page / 7 comp.   | 3 hooks        | — / 5 api / 3 svc    | 3/5      | Store Zustand justifié, messages OK          |
| `settings`        | 7 pages / 18 comp. | 3 hooks        | 1 ipc / 5 api / 5 svc| 2/5      | Bien organisé, complexité justifiée          |
| `calendar`        | 1 page / 11 comp.  | 2 hooks        | 1 ipc / 3 api        | 2/5      | 4 vues calendrier justifient les composants  |
| `clients`         | 3 pages / 5 comp.  | 7 hooks        | 3 ipc / 3 api / 3 svc| 2/5      | Bien structuré                               |
| `users`           | 1 page / 4 comp.   | 2 hooks        | 1 ipc / 5 api / 3 svc| 2/5      | Raisonnable pour gestion RBAC                |
| `auth`            | 3 pages / 4 comp.  | 8 hooks        | 1 ipc / 6 api / 3 svc| 2/5      | Flux auth complexes justifiés               |
| `documents`       | — / 2 comp.        | 1 hook         | — / 3 api / 3 svc    | 2/5      | Minimal et focalisé                          |
| `dashboard`       | 1 page / 1 comp.   | 1 hook         | 3 ipc / 3 api / 1 svc| 2/5      | Légèrement sur-structuré mais acceptable     |
| `admin`           | 7 pages / 18 comp. | 6 hooks        | — / 5 api            | 2/5      | Tabs admin justifiés par la variété          |
| `organizations`   | — / 1 comp.        | 1 hook         | 1 ipc / 2 api        | 2/5      | Minimal, 1 fichier IPC                       |

---

## Analyse détaillée par domaine

### `tasks` — Score : 4/5

**Structure actuelle :**
- pages : `tasks/page.tsx`, `tasks/[id]/page.tsx`, `tasks/[id]/completed/page.tsx`, `tasks/new/page.tsx`
- components : **92 fichiers** répartis en `TaskActions/` (13), `TaskForm/` (8 + `steps/` sous-dossier), `TaskDetail/` (6), `TaskInfo/` (4), `TaskOverview/` (4), `completed/` (6), et ~50 fichiers éparpillés
- hooks : 16 hooks (useTaskForm, useTaskActions, useTaskFilters, useTaskStatusUpdates, etc.)
- ipc : `tasks.ipc.ts`, `index.ts`
- api : 6 fichiers (useTasks, useTasksActions, TasksProvider, types, etc.)
- services : `task.service.ts` (585 LOC), 6 autres fichiers

**Ce qui est justifié :**
- La page de détail d'une tâche PPF est complexe (formulaire multi-étapes, photos, workflow d'intervention)
- Les composants `TaskForm/steps/` (CustomerStep, VehicleStep, PPFStep, ScheduleStep) sont de vrais formulaires distincts
- `useTaskActions.ts` avec patterns optimistic update (onMutate/rollback) est du code de valeur

**Signes de sur-ingénierie :**
- [x] `TaskActions/ManagedTaskActionPanel.tsx` + `ActionsCard.tsx` + `ActionButtons.tsx` : 3 composants d'action quasi-identiques
- [x] `TaskActions/SendMessageModal.tsx`, `ReportIssueModal.tsx`, `DelayTaskModal.tsx` : modales simples qui pourraient être un seul composant paramétré
- [x] `TaskActions/DelegateTaskActionPanel.tsx` : fonctionnalité non implémentée (UI placeholder)
- [x] `TaskManager.tsx` (476 LOC) + `TaskOverview/TaskOverview.tsx` (468 LOC) : duplication de logique de présentation
- [x] `KanbanBoard.tsx` : présent mais pas exposé dans les routes actuelles
- [x] `services/task.service.ts` (585 LOC) : fichier dieu service-side
- [x] Hook `useTaskFilters` + composant `FilterDrawer.tsx` + `TaskListFilters.tsx` : trois couches pour un système de filtres

**Recommandation :** Fusionner les 3 composants d'action en un seul `TaskActionPanel` paramétré. Consolider les modales en `TaskModal` avec `variant` prop. Supprimer ou déplacer `KanbanBoard` si non utilisé en production.

**Gain estimé :**
- ~18 fichiers supprimés ou fusionnés
- `task.service.ts` refactorable en 2-3 services thématiques
- Réduction de 92 → ~65 composants

---

### `interventions` — Score : 4/5

**Structure actuelle :**
- pages : 4 pages workflow PPF (`inspection`, `preparation`, `installation`, `finalization`)
- components : 17 fichiers dont `ppf/` (5) et `workflow/ppf/` (4 + tests)
- hooks : 10 hooks
- ipc : `interventions.ipc.ts` + `ppfWorkflow.ipc.ts`
- api : `WorkflowProvider.tsx` (692 LOC) + `PPFWorkflowProvider.tsx` (464 LOC) + 7 autres

**Ce qui est justifié :**
- Le workflow PPF est un process métier complexe à 4 étapes (inspection → préparation → installation → finalisation)
- La séparation `interventions.ipc.ts` / `ppfWorkflow.ipc.ts` reflète deux sous-domaines réels

**Signes de sur-ingénierie :**
- [x] `WorkflowProvider.tsx` (692 LOC) et `PPFWorkflowProvider.tsx` (464 LOC) : **deux providers séparés** pour des concepts très proches — duplication de patterns de state management
- [x] `domains/interventions/workflow/` (dossier séparé) en plus de `components/workflow/ppf/` : confusion de structure
- [x] `api/client.ts` dans le domaine interventions : doublon avec le wrapper IPC du domaine
- [x] `services/geolocation.service.ts` : dépendance GPS qui semble spéculative pour une app desktop offline
- [x] `interventions/utils/__tests__/` : dossier de tests isolés non rattaché à un service

**Recommandation :** Fusionner `WorkflowProvider` et `PPFWorkflowProvider` en un seul `WorkflowProvider<TConfig>` générique. Supprimer `api/client.ts` et rediriger vers `interventions.ipc.ts`.

**Gain estimé :**
- ~6 fichiers supprimés
- ~400 LOC de duplication éliminés
- 1 niveau d'indirection removed

---

### `sync` — Score : 4/5

**Structure actuelle :**
- components : `SyncIndicator`, `EntitySyncIndicator`, `SyncToast`
- hooks : `useConnectionStatus`, `useEntitySyncStatus`, `useOfflineActions`, `useOfflineQueue`, `useOfflineQueue.utils`, `useOfflineSync`, `useRealTimeUpdates`, `useSyncStatus`
- api : `SyncProvider`, `types`, `index`
- services : `sync.service.ts`

**Ce qui est justifié :**
- `useConnectionStatus.ts` : gestion online/offline avec browser events — logique réelle
- `useOfflineSync.ts` : connecté à `offlineQueueService` réel, logique de sync offline véritable
- `SyncIndicator`, `EntitySyncIndicator` : composants UI légitimes

**Signes de sur-ingénierie :**
- [x] **`useOfflineQueue.ts` (376 LOC)** : contient `simulateApiCall()` avec échecs **aléatoires à 10%** et délai fictif — **placeholder de développement non retiré**. La vraie implémentation est dans `useOfflineSync.ts`.
- [x] `useRealTimeUpdates.ts` : WebSocket temps-réel dans une app offline-first locale — probablement prématuré
- [x] `useSyncStatus.ts` et `useEntitySyncStatus.ts` : redondance probable avec `useOfflineSync.ts`
- [x] `useOfflineActions.ts` : wrapper mince autour de `useOfflineSync.addAction`

**Recommandation :** Retirer `useOfflineQueue.ts` ou remplacer `simulateApiCall` par une vraie implémentation IPC. Évaluer si `useRealTimeUpdates.ts` (WebSocket) est réellement utilisé — si non, le supprimer. Consolider `useSyncStatus` + `useEntitySyncStatus` en un seul hook.

**Gain estimé :**
- 3-4 hooks supprimés
- ~500 LOC de code placeholder/prématuré éliminés

---

### `audit` — Score : 4/5

**Structure actuelle :**
- components : `index.ts` (vide)
- hooks : `useChangeTracking.ts` (93 LOC), `useAuditLog` (42 LOC dans `api/`)
- api : `AuditProvider.tsx`, `useAuditLog.ts`, `types.ts`, `index.ts`
- server : re-export vers services
- services : `change-log.service.ts` (161 LOC)

**Ce qui est justifié :**
- La `change-log.service.ts` fait un vrai travail de mapping d'événements
- `AuditProvider` expose le contexte correctement

**Signes de sur-ingénierie :**
- [x] `useAuditLog.ts` utilise `useState + useEffect` au lieu de **React Query** — déviation architecturale majeure par rapport au pattern établi du projet
- [x] `useChangeTracking` dans `hooks/` duplique exactement `useAuditLog` dans `api/` : deux hooks identiques pour la même chose
- [x] Pas de composant réel (components/index.ts est vide) mais la structure complète `api/ + hooks/ + services/ + server/` existe
- [x] `getChangeLogById` et `createChangeLog` dans le service ne semblent pas utilisés dans l'UI

**Recommandation :** Migrer `useAuditLog` vers React Query avec une clé de cache dans `query-keys.ts`. Supprimer `useChangeTracking` (doublon). Supprimer les méthodes de service non utilisées.

**Gain estimé :**
- 2 fichiers supprimés/fusionnés
- Migration vers React Query améliore cohérence architecturale

---

### `bootstrap` — Score : 5/5

**Structure actuelle :**
- `ipc/bootstrap.ipc.ts` (17 LOC) : 2 opérations IPC (`firstAdmin`, `hasAdmins`)
- `api/bootstrapProvider.tsx` (11 LOC), `api/usebootstrap.ts` (6 LOC), `api/index.ts` (8 LOC)
- `api/types.ts` (1 LOC), `components/index.ts` (1 LOC), `server/index.ts` (1 LOC)
- `__tests__/domain.test.ts` (5 LOC), `index.ts` (4 LOC), `README.md`

**Ce qui est justifié :**
- Les 2 fonctions IPC réelles (`firstAdmin`, `hasAdmins`) ont une utilité réelle

**Signes de sur-ingénierie :**
- [x] **8 fichiers pour 2 opérations IPC** — ratio sur-ingénierie de 4:1
- [x] `components/index.ts` est un fichier vide (1 ligne)
- [x] `server/index.ts` est un fichier vide (1 ligne)
- [x] `api/types.ts` ne contient qu'une ligne vide
- [x] Le tout pourrait tenir dans le domaine `auth` ou dans un fichier utilitaire
- [x] La structure complète `api/ + components/ + server/ + ipc/` existe uniquement parce que le backend a un contexte `bootstrap`

**Recommandation :** Supprimer le domaine `bootstrap`. Déplacer `bootstrapIpc.firstAdmin` et `bootstrapIpc.hasAdmins` dans `auth/ipc/auth.ipc.ts`, et `useBootstrap` dans `auth/api/`. Supprimer 8 fichiers.

**Gain estimé :**
- **8 fichiers supprimés**
- `auth` absorbe 2 fonctions IPC sans changement structurel

---

### `performance` — Score : 5/5

**Structure actuelle :**
- `ipc/performance.ipc.ts` (33 LOC) : 5 opérations IPC (getStats, getMetrics, cleanupMetrics, getCacheStatistics, clearApplicationCache, configureCacheSettings)
- `api/performanceProvider.tsx` (113 LOC), `api/types.ts` (75 LOC), `api/index.ts` (4 LOC)
- `services/performance.service.ts` (106 LOC)
- `components/index.ts` (1 LOC vide), `index.ts` (2 LOC)

**Ce qui est justifié :**
- Les commandes IPC backend de performance existent
- Le monitoring de cache peut avoir une valeur opérationnelle

**Signes de sur-ingénierie :**
- [x] **Aucun composant UI** : `components/index.ts` est vide, aucune page ne rend ce domaine visible
- [x] `PerformanceProvider` est structuré mais pas connecté à l'application (pas de page `/performance`)
- [x] Toutes les méthodes IPC retournent `JsonValue` — absence de typage fort suggère une conception inachevée
- [x] Le domaine existe avant qu'il y ait un besoin UI clair
- [x] Dans la settings UI, la "PerformanceTab" dans `settings/` fait son propre fetching sans utiliser ce domaine

**Recommandation :** Soit supprimer le domaine `performance` entièrement (fonctions IPC accessibles directement depuis `settings/ipc/`), soit le marquer explicitement comme domaine opérationnel interne sans UI. Si conservé, brancher sur une vraie page de monitoring.

**Gain estimé :**
- **7 fichiers supprimés** si suppression complète
- Clarté sur l'intention du domaine

---

### `quotes` — Score : 3/5

**Structure actuelle :**
- pages : `quotes/page.tsx`, `quotes/[id]/page.tsx`, `quotes/new/page.tsx`
- components : 20 fichiers dont `QuoteImagesManager`, `QuoteDocumentsManager`, `QuoteAttachmentsManager`, `QuoteLaborSection`, `QuotePartsSection`, etc.
- hooks : 9 hooks (`useQuotesCrud`, `useQuoteItems`, `useQuoteStatus`, `useQuoteOperations`, `useQuoteAttachments`, `useNewQuotePage`, `useQuotesPage`, `useQuoteDetailPage`, `useQuotes`)

**Ce qui est justifié :**
- La page de détail d'un devis est complexe (items, totaux, pièces, main d'œuvre, photos, conversion en tâche)
- La séparation des hooks par responsabilité (`useQuoteItems`, `useQuoteStatus`, etc.) améliore la testabilité
- Les 9 tests dans `__tests__/` valident des comportements réels

**Signes de sur-ingénierie :**
- [x] `QuoteImagesManager` + `QuoteDocumentsManager` + `QuoteAttachmentsManager` : 3 composants "manager" quasi-identiques (même pattern : upload + liste + suppression)
- [x] `useQuotes.ts` (barrel re-export) + `useQuotesCrud.ts` + 4 autres hooks : 6 imports pour récupérer des quotes
- [x] `useQuoteDetailPage.ts` + `useNewQuotePage.ts` + `useQuotesPage.ts` : hooks de page qui pourraient être dans les pages elles-mêmes

**Recommandation :** Fusionner les 3 composants "manager" en `AttachmentManager` générique. Conserver les hooks métier (`useQuoteItems`, `useQuoteStatus`) mais absorber les hooks de page dans les composants page.

**Gain estimé :**
- 4-5 fichiers supprimés
- Pattern `AttachmentManager` réutilisable dans `tasks/`

---

### `inventory` — Score : 3/5

**Structure actuelle :**
- components : 14 (Dashboard, Layout, Tabs, MaterialCatalog (571 LOC), MaterialForm, StockLevelIndicator, InventoryManager (548 LOC), InventoryReports, InventorySettings, SupplierManagement)
- hooks : `useInventory`, `useMaterials`, `useInventoryStats`, `useMaterialForm`
- ipc : `inventory.ipc.ts`
- server : `inventory-operations.ts`, `response-utils.ts`

**Ce qui est justifié :**
- Gestion de catalogue matériaux + fournisseurs = feature réelle avec plusieurs écrans
- `MaterialCatalog` et `InventoryManager` sont de vrais fichiers de business logic

**Signes de sur-ingénierie :**
- [x] `server/inventory-operations.ts` et `server/response-utils.ts` dans le domaine frontend — ces fichiers "server" n'ont pas de sens dans une app desktop Tauri pure
- [x] `InventoryManager.tsx` (548 LOC) : composant dieu qui devrait être découpé

**Recommandation :** Supprimer le dossier `server/` du domaine inventory (pas de Next.js API routes pour cet écran). Découper `InventoryManager` en sous-composants.

**Gain estimé :**
- 2 fichiers `server/` supprimés
- `InventoryManager` refactorable

---

### `reports` — Score : 3/5

**Structure actuelle :**
- components : 13 dont `preview/` (7 sous-composants de prévisualisation)
- hooks : 5 hooks
- ipc : `reports.ipc.ts`
- services : `buildInterventionReportViewModel.ts` (service de construction du view model)

**Ce qui est justifié :**
- Les 7 composants de prévisualisation reflètent 7 sections distinctes du rapport d'intervention
- `buildInterventionReportViewModel.ts` encapsule une transformation complexe (données Rust → ViewModel)

**Signes de sur-ingénierie :**
- [x] `ReportsProvider.tsx` ne semble fournir que des helpers de formatage — un simple `export function` suffirait
- [x] `api/index.ts` ne re-exporte que le Provider

**Recommandation :** Supprimer `ReportsProvider` si non utilisé comme Context. Conserver la structure `preview/` (justifiée par la complexité des sections du rapport).

**Gain estimé :**
- 1-2 fichiers supprimés
- Légère simplification

---

### `notifications` — Score : 3/5

**Structure actuelle :**
- components : `NotificationBell`, `NotificationPanel`, `NotificationInitializer`, `MessageInbox`, `MessageComposer`, `NotificationPreferences`
- hooks : `useMessage`, `useMessagesPage`, `useNotificationUpdates`
- stores : `notificationStore.ts` (Zustand)
- services : `notifications.service.ts`, `notificationActions.ts`

**Ce qui est justifié :**
- Le store Zustand est justifié pour les badges de notification non-réactifs (compteurs, statut lu/non-lu)
- `NotificationBell` + `NotificationPanel` = pattern standard

**Signes de sur-ingénierie :**
- [x] `MessageInbox` et `MessageComposer` dans le domaine `notifications` — les messages internes devraient probablement être dans un domaine `messaging` distinct ou fusionnés
- [x] `notificationActions.ts` duplique des fonctions de `notifications.service.ts`

**Recommandation :** Consolider `notifications.service.ts` et `notificationActions.ts`. Évaluer si `MessageInbox/Composer` méritent un sous-domaine.

---

### `settings` — Score : 2/5

**Structure actuelle :**
- pages : 7 sous-pages settings
- components : 18 (tabs par catégorie : Accessibility, Notifications, Performance, Preferences, Profile, Security + `preferences/` subdirectory avec 4 sections)
- hooks : `usePreferencesForm`, `useSecuritySettings`, `usePerformanceSettings`
- services : `settings.service.ts`, `settings-client.service.ts`, `configuration.service.ts` (472 LOC), `defaults.ts`
- ipc : `settings.ipc.ts`

**Ce qui est justifié :**
- 7 tabs de settings avec des fonctionnalités distinctes justifient 18 composants
- `configuration.service.ts` gère des transformations et validations non triviales
- `useSecuritySettings` et `usePerformanceSettings` encapsulent une logique réelle

**Signes de sur-ingénierie :**
- [x] `preferences/` (4 sous-composants) pour des sections qui pourraient être inline dans `PreferencesTab.tsx`
- [x] `settings-client.service.ts` semble un doublon de `settings.service.ts` pour le contexte client

**Recommandation :** Conserver tel quel globalement. Évaluer si `preferences/` sub-components sont réutilisés ailleurs.

---

### `calendar` — Score : 2/5

**Structure actuelle :**
- components : 11 (`CalendarDashboard`, `CalendarView`, `MonthView`, `WeekView`, `DayView`, `AgendaView`, `CalendarHeader`, `CalendarFilters` (554 LOC), `TaskCard`)
- hooks : `useCalendar`, `useCalendarEvents`
- stores : `calendarStore.ts` (Zustand)
- ipc : `calendar.ts`

**Ce qui est justifié :**
- 4 vues calendrier (mois/semaine/jour/agenda) justifient 4 composants distincts
- `calendarStore.ts` pour la vue sélectionnée et les filtres actifs
- `CalendarFilters.tsx` (554 LOC) est complexe mais regroupe des filtres avancés

**Signes de sur-ingénierie :**
- [x] `CalendarFilters.tsx` à 554 LOC devrait être découpé

**Recommandation :** Conserver la structure. Découper `CalendarFilters` en sous-composants (FilterPanel + FilterChips).

---

### `auth` — Score : 2/5

**Structure actuelle :**
- components : `LoginForm`, `SignupForm`, `TOTPSetup`, `AccessDenied`
- hooks : 8 (useAuth, useAuthActions, useLoginForm, useSignupForm, usePasswordReset, useSessionExpiry, usePermissions, useRoleCheck)
- ipc : `auth.ipc.ts`
- server/services : logique Next.js auth (NextAuth-style)

**Ce qui est justifié :**
- 2FA (TOTP), permissions RBAC, expiration de session — chaque hook gère un vrai sous-domaine
- La séparation `server/services/` pour la logique Next.js côté serveur est correcte

**Signes de sur-ingénierie :**
- [x] `useLoginForm` et `useSignupForm` sont des wrappers React Hook Form très minces — pourraient être inline dans les composants

**Recommandation :** Conserver globalement. Absorber `useLoginForm/useSignupForm` dans leurs composants si non réutilisés.

---

### `clients` — Score : 2/5

**Structure actuelle :**
- components : `ClientForm`, `ClientList`, `ClientSelector`
- hooks : 7 (useClients, useClientActions, useClientSearch, useClientById, useClientValidation, useClientsPage, useClientDetailPage)
- ipc : 3 fichiers (client.ipc, vehicule.ipc, index)
- services : `client.service.ts`, `vehicle-enrichment.service.ts`, `validation.service.ts`

**Ce qui est justifié :**
- La séparation véhicule/client est pertinente dans le domaine métier
- Tests IPC sur `client.ipc.test.ts`

**Signes de sur-ingénierie :**
- [x] `useClientsPage` et `useClientDetailPage` : hooks de page qui pourraient être dans les pages

**Recommandation :** Conserver. Absorber optionnellement les hooks de page dans les composants page.

---

### `organizations` — Score : 2/5

**Structure actuelle :**
- components : `OrganizationSettingsTab.tsx` (526 LOC)
- hooks : `useOnboardingCheck.ts`
- ipc : `organization.ipc.ts`
- api : `useOnboarding.ts`, `useOrganization.ts`

**Ce qui est justifié :**
- L'onboarding + les settings organisation sont des features réelles
- `organization.ipc.ts` est bien structuré avec types clairs

**Signes de sur-ingénierie :**
- [x] `OrganizationSettingsTab.tsx` à 526 LOC devrait être découpé en sous-sections

**Recommandation :** Découper `OrganizationSettingsTab` en sections comme `settings/preferences/`. Conserver la structure domaine.

---

### `documents` — Score : 2/5

**Structure actuelle :**
- components : `PhotoUpload.tsx` (480 LOC)
- hooks : `usePhotoUpload.ts`
- services : `task-photo.service.ts`
- server : `report-export.ts`

**Ce qui est justifié :**
- Upload photos + export rapport = deux responsabilités distinctes bien séparées
- `task-photo.service.ts` encapsule la logique de compression

**Signes de sur-ingénierie :**
- [x] `PhotoUpload.tsx` à 480 LOC — devrait être découpé (uploader, preview, list)

**Recommandation :** Conserver la structure. Découper `PhotoUpload` si réutilisé.

---

## Problèmes transverses

### 1. Couche IPC

**`lib/ipc/client.ts` (1 481 LOC)**

`client.ts` est le principal fichier problématique de l'architecture IPC. Il concentre les wrappers pour **17 domaines** dans un seul fichier. C'est un god-object classique.

```
ipcClient.tasks.*        ipcClient.clients.*     ipcClient.quotes.*
ipcClient.settings.*     ipcClient.users.*        ipcClient.audit.*
ipcClient.reports.*      ipcClient.calendar.*     ipcClient.admin.*
ipcClient.inventory.*    ipcClient.notifications.* ipcClient.sync.*
ipcClient.organizations.* ipcClient.auth.*        ipcClient.dashboard.*
ipcClient.performance.*  ipcClient.bootstrap.*
```

Les domaines IPC individuels (`domains/*/ipc/*.ipc.ts`) existent en parallèle mais utilisent `safeInvoke` directement depuis `lib/ipc/core`. L'`ipcClient` de `client.ts` est une surcouche qui devrait être progressive progressivement remplacée par les wrappers de domaine.

**Architecture IPC à 2 niveaux (acceptable mais redondante) :**
```
Component → domainIpc.method() → safeInvoke() → Tauri  ✓ (chemin court)
Component → ipcClient.domain.method() → safeInvoke() → Tauri  ✓ (chemin long, client.ts)
```

**Recommandation :** Laisser `client.ts` se dégrader progressivement : chaque nouveau domaine ou nouvelle commande va directement dans `domains/*/ipc/`, et `client.ts` ne reçoit plus de nouvelles méthodes. À terme, supprimer `client.ts` quand tous les consommateurs ont migré.

**`lib/ipc/` — fichiers secondaires**

| Fichier | Légitimité |
|---------|-----------|
| `utils.ts` | ✅ Justifié — gère session, correlation ID, timeout, error mapping |
| `commands.ts` | ✅ Justifié — centralise les constantes de commande |
| `test-adapter.ts` | ✅ Justifié — mock pour tests |
| `real-adapter.ts` | ✅ Justifié — adaptateur Tauri |
| `metrics.ts` | ⚠️ Partiel — métriques IPC utiles pour debug, but overhead |
| `cache.ts` | ⚠️ Doublon — TTL cache en concurrence avec React Query `staleTime` |
| `retry.ts` | ⚠️ Doublon — `safeInvoke` gère déjà les erreurs; React Query gère le retry |
| `adapter.ts` | ⚠️ Abstraction prématurée — 97 LOC pour définir une interface avec 2 implémentations |
| `calendar.ts`, `notification.ts`, `message.ts`, `status.ts` | ❌ Domaine-spécifique dans lib/ — devrait être dans les domaines |

### 2. State management

**Points positifs :**
- React Query pour le server state — bien respecté dans la majorité des domaines
- Zustand pour `notificationStore` et `calendarStore` — usages légitimes (état UI persistant entre routes)
- `AuthProvider` via React Context — pattern correct

**Déviations identifiées :**
- `useAuditLog.ts` utilise `useState + useEffect` au lieu de React Query — **incohérence architecturale**
- `useOfflineQueue.ts` gère un état de file d'attente dans un hook avec `useState` (pas de persistance réelle côté SQLite)
- Certains hooks (`useClientsPage`, `useQuotesPage`, `useTasksPage`) sont des wrappers minces autour de `useQuery` — pourraient être inlinés dans les pages

**Caches multiples en compétition :**
- `cache.ts` dans `lib/ipc/` (TTL 30s)
- React Query `staleTime` (variable)
- `sessionStorage` dans certains hooks

Ces 3 systèmes de cache peuvent produire des comportements incohérents (données fraîches vs périmées selon l'entrée). React Query doit être le seul cache de référence.

### 3. Component architecture

**Points positifs :**
- Les composants `ui/` sont bien partagés (shadcn/ui + composants internes)
- Pas de duplication cross-domain dans la couche UI partagée
- Les formulaires multi-étapes dans `tasks/` sont bien découpés

**Points problématiques :**
- 3 composants "manager" quasi-identiques : `QuoteImagesManager`, `QuoteDocumentsManager`, `QuoteAttachmentsManager` — candidats à l'extraction d'un composant générique
- `OrganizationSettingsTab.tsx` (526 LOC), `InventoryManager.tsx` (548 LOC), `MaterialCatalog.tsx` (571 LOC), `CalendarFilters.tsx` (554 LOC) : 4 composants > 500 LOC non découpés
- `tasks/components/TaskManager.tsx` (476 LOC) et `TaskOverview.tsx` (468 LOC) : duplication de logique de présentation

---

## Plan d'action priorisé

### 🔴 Priorité 1 — Corriger les bugs et déviations architecturales immédiates

1. **`useAuditLog.ts`** : Migrer de `useState + useEffect` vers `useQuery` (React Query). Ajouter `auditKeys` dans `query-keys.ts`.
2. **`useOfflineQueue.ts`** : Remplacer `simulateApiCall` (random 10% failures + fake delay) par une vraie implémentation IPC ou une erreur explicite "not implemented".
3. **Supprimer les 3 caches concurrents** : Désactiver `lib/ipc/cache.ts` et le cache `sessionStorage` dans les hooks — React Query est le seul cache.

### 🟠 Priorité 2 — Supprimer / fusionner les domaines dormants

4. **`bootstrap`** : Déplacer 2 fonctions IPC dans `auth/ipc/auth.ipc.ts`. Supprimer le domaine (8 fichiers).
5. **`performance`** : Soit supprimer le domaine (7 fichiers) si aucune page ne l'utilise, soit créer une vraie page de monitoring `/admin/performance`.
6. **`audit/hooks/useChangeTracking.ts`** : Doublon exact de `useAuditLog` — supprimer, garder un seul.

### 🟡 Priorité 3 — Réduire le boilerplate par domaine

7. **`tasks/TaskActions/`** : Fusionner `SendMessageModal`, `ReportIssueModal`, `DelayTaskModal` en un `TaskModal` paramétré (~3 → 1 fichier).
8. **`quotes/`** : Extraire un composant `AttachmentManager` générique depuis les 3 managers (QuoteImages/Documents/Attachments).
9. **`interventions/`** : Fusionner `WorkflowProvider` et `PPFWorkflowProvider` en un seul Provider générique.
10. **`lib/ipc/client.ts`** : Figer en "no new methods" — ne plus ajouter de méthodes. Migrer progressivement vers les wrappers de domaine.

### 🟢 Priorité 4 — Simplifier l'infrastructure frontend (moyen terme)

11. Supprimer `lib/ipc/retry.ts` (React Query gère le retry).
12. Supprimer `lib/ipc/cache.ts` (React Query `staleTime` est suffisant).
13. Déplacer `lib/ipc/calendar.ts`, `lib/ipc/notification.ts`, `lib/ipc/message.ts`, `lib/ipc/status.ts` dans leurs domaines respectifs.
14. Absorber `useClientsPage`, `useQuotesPage`, `useTasksPage` dans les composants page.

---

## Heuristiques pour la suite

- **Règle des 3 couches** : Un domaine avec < 3 comportements UI distincts ne justifie pas `api/ + hooks/ + services/ + ipc/ + components/`. Une structure plate `[domain]/index.ts` + `[domain].ipc.ts` suffit.
- **Règle des hooks de page** : Si un hook ne fait qu'appeler `useQuery` sans transformation additionnelle et n'est utilisé que dans un seul fichier, il doit rester dans ce fichier.
- **Règle des composants uniques** : Un composant utilisé une seule fois et sans logique autonome doit rester dans le fichier parent.
- **Règle du miroir backend** : Une abstraction frontend qui n'existe que parce que le backend a un domaine équivalent doit être remise en question — le frontend reflète les **use cases utilisateur**, pas la structure Rust.
- **Règle des managers** : 3 composants "XxxManager" qui partagent la même structure (liste + upload + suppression) doivent être 1 composant générique + 3 configurations.

---

## Structure frontend allégée pour les domaines simples

Pour les domaines avec ≤ 2 comportements UI et ≤ 3 commandes IPC (exemple : `bootstrap`, `performance`, `audit`) :

```
domains/[domain]/
├── [domain].ipc.ts          # Wrappers safeInvoke directement
├── use[Domain].ts           # 1 hook React Query si server state
└── [Domain]Component.tsx    # 1 composant si UI existante
```

Au lieu de la structure complète :
```
domains/[domain]/
├── api/        # Provider + hooks + types + index
├── components/ # Components + tests + index
├── hooks/      # Hooks + tests
├── ipc/        # Wrapper + index
├── services/   # Service + index
├── server/     # Re-exports
├── index.ts
└── README.md
```

Cette simplification économise **6-8 fichiers par domaine** et préserve 100% de la fonctionnalité.
