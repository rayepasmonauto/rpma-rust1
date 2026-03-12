# PROMPT — Audit Over-Engineering Backend RPMA v2

## Contexte du projet

Tu es un expert en architecture logicielle Rust/Tauri. Tu dois réaliser un **audit complet d'over-engineering** sur le backend Rust de l'application **RPMA v2**.

**Caractéristiques du projet :**
- Application desktop **offline-first** (Tauri 2.1 + Rust 1.85 + SQLite WAL)
- **Mono-tenant** : un seul atelier, pas de SaaS
- 4 rôles utilisateurs : Admin, Supervisor, Technician, Viewer
- ~150+ commandes IPC enregistrées dans `src-tauri/src/main.rs` (lignes 70–324)
- 15 domaines DDD : `auth`, `users`, `clients`, `tasks`, `interventions`, `calendar`, `inventory`, `quotes`, `documents`, `reports`, `settings`, `organizations`, `notifications`, `sync`, `audit`
- 56 migrations SQL embarquées
- Architecture imposée : 4 couches par domaine (ipc → application → domain → infrastructure) + fichiers tests (unit, integration, permission, validation)

---

## Objectif de l'audit

Pour **chaque domaine**, évalue si sa complexité architecturale est **justifiée** par sa valeur métier réelle.

---

## Pour chaque domaine, analyse les points suivants

### 1. Ratio Complexité / Valeur métier
- Combien de commandes IPC expose-t-il réellement ?
- Combien de règles métier non-triviales contient-il (state machines, calculs, validations complexes) ?
- Les 4 couches DDD sont-elles toutes justifiées, ou certaines sont-elles du "pass-through" ?

### 2. Détection des patterns YAGNI / Gold Plating
Cherche et signale explicitement :
- [ ] Domaines entiers prématurés (ex: `sync`, `organizations` pour une app mono-tenant)
- [ ] Couches vides ou "pass-through" (ex: `usecase.rs` qui ne fait que déléguer sans logique)
- [ ] Repositories avec uniquement du CRUD générique sans logique de requête spécifique
- [ ] Facades inutiles exposant exactement ce que le service expose déjà
- [ ] Event Bus utilisé pour des events qui n'ont aucun subscriber réel
- [ ] Cache LRU in-memory pour des données rarement lues en boucle dans une app desktop mono-user
- [ ] ServiceBuilder avec DI container complexe alors qu'un simple `AppState { db }` suffirait
- [ ] `CompressedApiResponse` / streaming IPC pour des payloads qui ne dépassent jamais quelques KB en usage réel

### 3. Commandes IPC "fantômes"
Identifie les commandes listées dans `NOTIMPLEMENTEDCOMMANDS` (ex: `auth_setup_2fa`, `auth_verify_2fa`) et évalue :
- Le coût de maintenance de leur scaffolding vide
- Si leur domaine parent mérite d'exister en l'état

### 4. Score d'over-engineering par domaine

Pour chaque domaine, attribue un score de **sur-ingénierie de 1 à 5** :

| Score | Signification |
|-------|--------------|
| 1 | Complexité totalement justifiée |
| 2 | Légèrement sur-architecturé, acceptable |
| 3 | Over-engineering modéré, refactoring recommandé |
| 4 | Sur-ingénierie significative, simplification urgente |
| 5 | Domaine entier prématuré ou inutile à ce stade |

---

## Format de sortie attendu

Produis un rapport Markdown structuré ainsi :

```markdown
# Audit Over-Engineering — Backend RPMA v2

## Résumé exécutif
[2-3 phrases de verdict global + score moyen pondéré]

## Tableau de synthèse

| Domaine | Commandes IPC | Règles métier | Couches justifiées | Score OE | Verdict |
|---------|--------------|---------------|-------------------|----------|---------|
| auth    | X            | X             | 4/4               | X/5      | ...     |
| ...     | ...          | ...           | ...               | ...      | ...     |

## Analyse détaillée par domaine

### `[nom_domaine]` — Score : X/5

**Commandes IPC réelles :** liste
**Règles métier non-triviales :** liste ou "aucune"
**Problèmes détectés :**
- [ ] [pattern YAGNI ou gold plating identifié]

**Recommandation :** [Supprimer | Fusionner avec X | Aplatir en N fichiers | Conserver tel quel]

---

## Plan d'action priorisé

### 🔴 Priorité 1 — Supprimer immédiatement
[Liste des domaines/couches à supprimer, gain estimé en fichiers]

### 🟠 Priorité 2 — Fusionner / Aplatir
[Liste des fusions recommandées]

### 🟡 Priorité 3 — Simplifier à moyen terme
[Liste des simplifications d'infrastructure (cache, DI, event bus)]

## Règle heuristique à appliquer
> Si un domaine a moins de **3 commandes IPC actives** ET **aucune state machine**, 
> il ne justifie pas 4 couches DDD — un seul fichier `[domain]_handler.rs` suffit.
```

---

## Données de référence à analyser

Voici la liste complète des commandes IPC enregistrées dans le projet, classées par domaine :

**Auth (4):** `auth_login`, `auth_create_account`, `auth_logout`, `auth_validate_session`
**Users (6):** `user_crud`, `bootstrap_first_admin`, `has_admins`, `get_users`, `create_user`, `update_user`, `update_user_status`, `delete_user`
**Clients (2):** `client_crud`, `get_client_statistics`
**Tasks (13):** `task_crud`, `edit_task`, `task_transition_status`, `add_task_note`, `send_task_message`, `delay_task`, `export_tasks_csv`, `import_tasks_bulk`, `check_task_assignment`, `check_task_availability`, `get_task_history`, `validate_task_assignment_change`, `task_get_status_distribution`
**Interventions (14):** `intervention_workflow`, `intervention_progress`, `intervention_management`, `intervention_start`, `intervention_get`, `intervention_get_active_by_task`, `intervention_get_latest_by_task`, `intervention_update`, `intervention_delete`, `intervention_finalize`, `intervention_advance_step`, `intervention_save_step_progress`, `intervention_get_progress`, `intervention_get_step`
**Inventory (26):** `material_create`, `material_get`, `material_get_by_sku`, `material_list`, `material_update`, `material_delete`, `material_update_stock`, `material_adjust_stock`, `material_record_consumption`, `material_get_consumption_history`, `material_get_intervention_consumption`, `material_get_intervention_summary`, `material_create_inventory_transaction`, `material_get_transaction_history`, `material_create_category`, `material_list_categories`, `material_create_supplier`, `material_list_suppliers`, `material_get_stats`, `material_get_low_stock`, `material_get_expired`, `material_get_low_stock_materials`, `material_get_expired_materials`, `material_get_inventory_movement_summary`, `inventory_get_stats`, `inventory_get_dashboard_data`
**Calendar (10):** `get_events`, `get_event_by_id`, `create_event`, `update_event`, `delete_event`, `get_events_for_technician`, `get_events_for_task`, `calendar_get_tasks`, `calendar_check_conflicts`, `calendar_schedule_task`
**Quotes (22):** `quote_create`, `quote_get`, `quote_list`, `quote_update`, `quote_delete`, `quote_item_add`, `quote_item_update`, `quote_item_delete`, `quote_mark_sent`, `quote_mark_accepted`, `quote_mark_rejected`, `quote_mark_expired`, `quote_duplicate`, `quote_export_pdf`, `quote_attachments_get`, `quote_attachment_create`, `quote_attachment_update`, `quote_attachment_delete`, `quote_mark_changes_requested`, `quote_reopen`, `quote_attachment_open`, `quote_convert_to_task`
**Documents (8):** `document_store_photo`, `document_get_photos`, `document_get_photo`, `document_delete_photo`, `document_get_photo_data`, `document_update_photo_metadata`, `export_intervention_report`, `save_intervention_report`
**Reports (5):** `reports_get_capabilities`, `report_generate`, `report_get`, `report_get_by_intervention`, `report_list`
**Settings (22):** `get_app_settings`, `update_general_settings`, `update_security_settings`, `update_notifications_settings`, `update_business_rules`, `update_security_policies`, `update_integrations`, `update_performance_configs`, `update_business_hours`, `get_user_settings`, `update_user_profile`, `update_user_preferences`, `update_user_security`, `update_user_performance`, `update_user_accessibility`, `update_user_notifications`, `change_user_password`, `export_user_data`, `delete_user_account`, `get_data_consent`, `update_data_consent`, `upload_user_avatar`
**Organizations (7):** `get_onboarding_status`, `complete_onboarding`, `get_organization`, `update_organization`, `upload_logo`, `get_organization_settings`, `update_organization_settings`
**Notifications (14):** `initialize_notification_service`, `send_notification`, `test_notification_config`, `get_notification_status`, `get_notifications`, `mark_notification_read`, `mark_all_notifications_read`, `delete_notification`, `create_notification`, `message_send`, `message_get_list`, `message_mark_read`, `message_get_templates`, `message_get_preferences`
**Audit (3):** `get_security_metrics`, `get_active_sessions`, `revoke_session`
**Sync (3):** `sync_enqueue`, `sync_now`, `sync_get_status`
**System (7):** `health_check`, `diagnose_database`, `get_database_stats`, `get_app_info`, `get_device_info`, `get_database_pool_health`, `vacuum_database`

**Contraintes architecturales connues :**
- App **mono-tenant** (ADR-019 définit single-tenant + onboarding)
- Sync est **optionnel** et non connecté à un backend réel
- 2FA est listé en `NOT_IMPLEMENTED_COMMANDS`
- Cache LRU avec TTL 3 niveaux (1min/5min/15min) défini dans ADR-020
- ServiceBuilder avec DI container complet (ADR-021)
- Event bus inter-domaines (ADR-023)
- `CompressedApiResponse` disponible dans `commands/ipc_optimization.rs`

---

## Instructions finales

1. Sois **concret et actionnable** : cite les fichiers et patterns spécifiques
2. Ne recommande pas de simplifier si la complexité est justifiée (ex: `interventions` avec sa state machine mérite ses 4 couches)
3. Priorise les gains les plus rapides (supprimer > fusionner > simplifier)
4. Estime le **nombre de fichiers économisés** pour chaque recommandation
5. Conclus avec la **règle heuristique** à appliquer pour les futures décisions d'architecture
