# Audit Over-Engineering — Backend RPMA v2

## Résumé exécutif
Le backend RPMA v2 présente une **sur-ingénierie significative (Score global : 3.2/5)**. Bien que les domaines métiers critiques (`tasks`, `interventions`, `inventory`, `quotes`) justifient pleinement l'architecture DDD en 4 couches, plusieurs domaines "support" (`sync`, `organizations`, `notifications`) souffrent d'un excès de formalisme architectural (Gold Plating) et de patterns YAGNI. L'application, bien qu'offline-first et mono-tenant, implémente des mécanismes de synchronisation à vide, un bus d'événements complexe et un monitoring de performance digne d'une infrastructure cloud.

## Tableau de synthèse

| Domaine | Commandes IPC | Règles métier | Couches justifiées | Score OE | Verdict |
|---------|--------------|---------------|-------------------|----------|---------|
| `auth` | 15 (incl. Sec) | Élevées (Session/RBAC) | 4/4 | 1/5 | Conserver |
| `tasks` | 13 | Élevées (State Machine) | 4/4 | 1/5 | Conserver |
| `interventions` | 14 | Élevées (Workflow) | 4/4 | 1/5 | Conserver |
| `inventory` | 26 | Modérées (Stock/Calculs) | 4/4 | 1/5 | Conserver |
| `quotes` | 22 | Élevées (Calculs/Accep.) | 4/4 | 1/5 | Conserver |
| `reports` | 5 | Faibles (Pass-through) | 2/4 | 3/5 | Aplatir |
| `settings` | 22 | Faibles (CRUD profil) | 2/4 | 3/5 | Simplifier |
| `organizations` | 7 | Nulle (Workshop info) | 1/4 | 4/5 | Fusionner |
| `notifications` | 14 | Faibles (In-app only) | 2/4 | 4/5 | Simplifier |
| `sync` | 12 | Nulle (Local flush only) | 0/4 | 5/5 | Supprimer |
| `audit` | (incl. auth) | Faibles (Metrics) | 1/4 | 4/5 | Simplifier |

---

## Analyse détaillée par domaine

### `sync` — Score : 5/5
**Commandes IPC réelles :** `sync_enqueue`, `sync_now`, `sync_get_status`, etc. (12 total)
**Règles métier non-triviales :** Aucune. Le service "drain" une file d'attente locale et marque les opérations comme complétées sans aucun appel réseau réel.
**Problèmes détectés :**
- [x] Domaine entièrement prématuré (YAGNI).
- [x] Architecture complexe (Infrastructure/Queue/BackgroundService) pour une fonctionnalité inexistante.
**Recommandation :** Supprimer l'intégralité du domaine. Si une synchronisation est nécessaire plus tard, elle devra être implémentée sur une base concrète.
**Gain estimé :** ~15 fichiers.

### `organizations` — Score : 4/5
**Commandes IPC réelles :** `get_onboarding_status`, `complete_onboarding`, `get_organization`, `update_organization`, `upload_logo`.
**Règles métier non-triviales :** Aucune. Simple stockage des coordonnées de l'atelier unique.
**Problèmes détectés :**
- [x] Domaine prématuré pour une app mono-tenant (mono-atelier).
- [x] Onboarding complexe alors qu'un simple formulaire de "Paramètres de l'entreprise" suffirait.
**Recommandation :** Fusionner avec `settings`. Supprimer le `OrganizationService` et utiliser directement le dépôt dans un module `settings/organization.rs`.
**Gain estimé :** ~10 fichiers.

### `notifications` — Score : 4/5
**Commandes IPC réelles :** 14 commandes (`message_send`, `notification_create`...).
**Règles métier non-triviales :** Faibles. Gestion de templates et de préférences.
**Problèmes détectés :**
- [x] Sous-domaine `message` distinct des `notifications` in-app pour une application desktop simple.
- [x] Utilisation intensive du Bus d'événements pour des notifications locales.
**Recommandation :** Aplatir le domaine. Fusionner `message` et `notification`. Supprimer les couches `application` si elles ne font que déléguer à `infrastructure`.
**Gain estimé :** ~12 fichiers.

### `Performance & Monitoring` (Infrastructure/System) — Score : 4/5
**Commandes IPC :** `get_performance_stats`, `get_cache_statistics`, `configure_cache_settings`...
**Problèmes détectés :**
- [x] Cache LRU 3 niveaux (ADR-020) pour des données SQLite locales (déjà très performantes).
- [x] `CompressedApiResponse` pour des payloads souvent inférieurs à 10 KB.
- [x] WebSocketEventHandler pour du "temps réel" sur une instance locale unique.
**Recommandation :** Supprimer le monitoring de performance IPC. Remplacer les WebSockets par des événements Tauri natifs.
**Gain estimé :** ~8 fichiers.

---

## Plan d'action priorisé

### 🔴 Priorité 1 — Supprimer immédiatement (YAGNI total)
1. **Domaine `sync`** : Supprimer `src-tauri/src/domains/sync`. Retirer de `ServiceBuilder` et `main.rs`.
2. **Commands Performance** : Supprimer `commands/performance.rs` et `shared/services/performance_monitor.rs`.
3. **WebSocket Server** : Supprimer `commands/websocket_commands.rs`. Utiliser `app.emit()` de Tauri.
**Gain estimé : ~35 fichiers.**

### 🟠 Priorité 2 — Fusionner / Aplatir (Simplification de flux)
1. **Domaine `organizations`** : Déplacer les modèles vers `settings/domain/models/organization.rs` et supprimer le dossier `domains/organizations`.
2. **Domaine `reports`** : Supprimer la couche `application`. Faire appeler l'infrastructure directement par l'IPC handler.
3. **Domaine `notifications`** : Fusionner `message` et `notification` dans un seul fichier `notification_service.rs`.
**Gain estimé : ~25 fichiers.**

### 🟡 Priorité 3 — Simplifier l'infrastructure (Réduction du Boilerplate)
1. **ServiceBuilder** : Réduire la complexité du graphe de dépendances. Supprimer le formalisme excessif pour les services qui ne sont que des wrappers de DB.
2. **Settings** : Regrouper les 22 commandes IPC de paramètres en 3-4 commandes "fat" (ex: `update_user_settings(category, data)`).
**Gain estimé : ~10 fichiers.**

## Règle heuristique à appliquer
> **"La règle de 3"** : Si un domaine a moins de **3 commandes IPC actives** ET **aucune state machine complexe** (ex: `reports`, `organizations`, `clients`), il **interdit** les 4 couches DDD. Un seul fichier `[domain]_handler.rs` regroupant IPC et logique suffit. L'infrastructure (SQL) peut être déportée dans un module partagé `shared/repositories`.
